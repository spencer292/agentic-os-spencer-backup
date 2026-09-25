#!/usr/bin/env node
// ROUTE ENGINE — WRITE GATE.  Step 1 of spec v2 Part 7 ("contain write authority").
//
// WHY THIS EXISTS
//   Measured 2026-08-21 in technician-route-automation/: 117 scripts, 32 carrying Jobber mutation
//   call-sites, 24 writing to OptimoRoute, 66 independently refreshing the one shared Jobber token.
//   Every failure the spec lists was a write nobody authorised in that moment — route-drift-check
//   re-sequencing Spencer's days underneath him, 11 visits stranded on the wrong tech across the
//   handover, a plan written back against a board that had already moved. There was no single place
//   to say "no writes right now".
//
// WHAT IT DOES
//   Patches globalThis.fetch and classifies every outbound request to Jobber or OptimoRoute as READ
//   or WRITE. Reads pass through untouched. A WRITE is refused unless write-authority.json currently
//   grants authority. Every write attempt — allowed or refused — is appended to the ledger BEFORE
//   the request leaves, with the result recorded after it returns.
//
// WHY THE TRANSPORT AND NOT THE CALL-SITE
//   A per-call-site guard has to be added to 32 files and is silently absent from the 33rd script
//   somebody writes next week. Every script here uses global fetch (verified: no axios, no
//   node-fetch, no https module) and there are exactly two Jobber endpoints. Gating the transport
//   makes the retrofit one import line, and check-write-gate.mjs can then PROVE that no mutating
//   script is missing it.
//
// USE
//   import '<path>/route-engine/lib/write-gate.mjs';   // FIRST import, before any fetch happens
//
// FAIL-CLOSED: if this module cannot read its own state file it refuses writes. A gate that opens
// when it breaks is not a gate.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STATE_PATH = path.join(ROOT, 'write-authority.json');
const LEDGER_DIR = path.join(ROOT, 'ledger');

const RUN_ID = crypto.randomUUID();
const SCRIPT = path.basename(process.argv[1] || 'unknown');
let writeCount = 0;

// ---------------------------------------------------------------- authority
// Two ways a write can be authorised, and they are deliberately different shapes:
//
//   standingGrants — a NAMED script allowed a NAMED operation, forever, because Spencer approved
//     that specific narrow behaviour (today: the arrival-window sweep, jobEdit only). It cannot do
//     anything else, and it is still ledgered. This exists so "writes off by default" does not mean
//     "the customer-facing safety net dies".
//   the global switch — ad-hoc, time-boxed, for a human driving a run right now.
//
// A standing grant is checked first and does not need the global switch on.
function standing(script, target, op) {
  let s;
  try { s = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch { return null; }
  for (const g of s.standingGrants || []) {
    if (g.script !== script || g.target !== target) continue;
    // The op string can be a compound like "jobEdit+visitEdit"; every part must be allowed.
    const parts = String(op).split('+');
    if (parts.every(p => (g.ops || []).includes(p))) {
      return { granted: true, standing: true, why: `standing grant: ${g.reason || g.script}`, ceiling: Number(g.ceilingPerRun) || 0, by: g.approvedBy || 'standing' };
    }
    return { granted: false, standing: true, why: `standing grant for ${script} covers ${(g.ops || []).join(',')} — not ${op}`, ceiling: 0 };
  }
  return null;
}

function authority() {
  let s;
  try {
    s = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch (e) {
    return { granted: false, why: `write-authority.json unreadable (${e.code || e.message}) — failing closed`, ceiling: 0 };
  }
  if (!s.writesEnabled) return { granted: false, why: s.reason ? `writes disabled: ${s.reason}` : 'writes disabled', ceiling: 0 };
  // A time-boxed grant that was never revoked must lapse on its own.
  if (!s.enabledUntil) {
    return { granted: false, why: 'writesEnabled is true but enabledUntil is null — an open-ended grant is not honoured', ceiling: 0 };
  }
  if (!(new Date(s.enabledUntil) > new Date())) {
    return { granted: false, why: `write authority EXPIRED at ${s.enabledUntil} (granted by ${s.enabledBy || 'unknown'}: ${s.reason || 'no reason given'})`, ceiling: 0 };
  }
  return { granted: true, why: s.reason || '', ceiling: Number(s.ceilingPerRun) || 0, until: s.enabledUntil, by: s.enabledBy };
}

// ---------------------------------------------------------------- classify
const JOBBER_MUTATIONS = [
  'visitEditSchedule', 'visitEditAssignedUsers', 'visitCreate', 'visitDelete', 'visitEdit',
  'jobEdit', 'jobCreate', 'propertyEdit', 'clientEdit', 'clientCreate',
  'quoteEdit', 'quoteCreate', 'invoiceCreate', 'noteCreate', 'customFieldEdit',
];

// OptimoRoute: safe-by-default. Anything not plainly a read is treated as a write.
const OPTIMO_READ = /\/v1\/(get_|search_)/;

function classify(url, init) {
  const u = String(url);
  if (u.includes('api.getjobber.com/api/oauth/token')) return null;      // auth, not a data write
  if (u.includes('api.getjobber.com/api/graphql')) {
    const body = typeof init?.body === 'string' ? init.body : '';
    if (!/\bmutation\b/.test(body)) return null;                          // a query
    // Match on the call site (`name(`), not a bare substring — otherwise `visitEditSchedule` also
    // reports as `visitEdit` and a standing grant scoped to one silently reads as covering the other.
    const hit = JOBBER_MUTATIONS.filter(m => new RegExp(`\\b${m}\\s*\\(`).test(body));
    return { target: 'jobber', op: hit.length ? [...new Set(hit)].sort().join('+') : 'unknown-mutation' };
  }
  if (u.includes('api.optimoroute.com')) {
    if (OPTIMO_READ.test(u)) return null;
    const m = u.match(/\/v1\/([a-z_0-9]+)/);
    return { target: 'optimoroute', op: m ? m[1] : 'unknown-endpoint' };
  }
  return null;                                                            // not ours — untouched
}

// ---------------------------------------------------------------- ledger
// Written BEFORE the request leaves. A write that is never confirmed still leaves a record that it
// was attempted, which is the only way a partially-applied batch is recoverable.
function ledger(entry) {
  try {
    fs.mkdirSync(LEDGER_DIR, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    fs.appendFileSync(path.join(LEDGER_DIR, `${day}.jsonl`), JSON.stringify(entry) + '\n');
  } catch { /* the ledger must never be the reason a run dies */ }
}

function digest(s) { return crypto.createHash('sha256').update(String(s || '')).digest('hex').slice(0, 12); }

// ---------------------------------------------------------------- the patch
const realFetch = globalThis.fetch;
if (!realFetch) throw new Error('write-gate: no global fetch — Node 18+ required');

globalThis.fetch = async function gatedFetch(url, init = {}) {
  const w = classify(url, init);
  if (!w) return realFetch(url, init);

  const auth = standing(SCRIPT, w.target, w.op) || authority();
  const seq = ++writeCount;
  const base = {
    ts: new Date().toISOString(), runId: RUN_ID, script: SCRIPT, seq,
    target: w.target, op: w.op, payloadDigest: digest(init?.body),
  };

  if (!auth.granted) {
    ledger({ ...base, outcome: 'REFUSED', why: auth.why });
    throw new Error(
      `\n  WRITE REFUSED by route-engine write gate\n` +
      `    script    ${SCRIPT}\n` +
      `    target    ${w.target}.${w.op}\n` +
      `    reason    ${auth.why}\n` +
      `    grant it  node projects/briefs/route-engine/scripts/write-authority.mjs enable --reason "..." --ttl 30m\n`
    );
  }

  if (auth.ceiling && seq > auth.ceiling) {
    ledger({ ...base, outcome: 'REFUSED', why: `per-run write ceiling ${auth.ceiling} exceeded` });
    // Abort rather than truncate: a half-applied plan is worse than none, and the ledger says where it stopped.
    throw new Error(`\n  WRITE CEILING EXCEEDED — ${seq} attempted, ceiling ${auth.ceiling}. Aborted with ${seq - 1} applied. See ledger.\n`);
  }

  ledger({ ...base, outcome: 'ATTEMPT', grantedBy: auth.by, grantExpires: auth.until || null, standing: !!auth.standing });
  let res;
  try {
    res = await realFetch(url, init);
  } catch (e) {
    ledger({ ...base, outcome: 'TRANSPORT-ERROR', why: e.message });
    throw e;
  }
  // Jobber returns HTTP 200 carrying userErrors, so status alone does not mean applied.
  let applied = res.ok, note = `http ${res.status}`;
  if (w.target === 'jobber' && res.ok) {
    try {
      const j = await res.clone().json();
      const errs = (JSON.stringify(j).match(/"userErrors":\[[^\]]*\]/g) || []).filter(x => x !== '"userErrors":[]');
      if (errs.length) { applied = false; note = `userErrors ${errs.join(' ')}`.slice(0, 300); }
      if (j.errors) { applied = false; note = `graphql errors ${JSON.stringify(j.errors).slice(0, 300)}`; }
    } catch { /* body not JSON — leave status as the verdict */ }
  }
  ledger({ ...base, outcome: applied ? 'APPLIED' : 'FAILED', note });
  return res;
};

// One line on stderr so a human running a script by hand sees the gate is live and which way it is set.
{
  let s = null;
  try { s = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch { /* banner only */ }
  const mine = (s?.standingGrants || []).find(g => g.script === SCRIPT);
  const a = authority();
  if (mine) {
    process.stderr.write(`[write-gate] standing grant for ${SCRIPT}: ${mine.target}.${(mine.ops || []).join(',')} only — run ${RUN_ID.slice(0, 8)}\n`);
  } else {
    process.stderr.write(a.granted
      ? `[write-gate] WRITES ENABLED until ${a.until} (${a.by}: ${a.why}) — ceiling ${a.ceiling}/run — run ${RUN_ID.slice(0, 8)}\n`
      : `[write-gate] writes BLOCKED — ${a.why} — run ${RUN_ID.slice(0, 8)}\n`);
  }
}

export const writeGate = { runId: RUN_ID, authority, classify };
export default writeGate;
