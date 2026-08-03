#!/usr/bin/env node
// Delete the 9 duplicate visits Spencer approved on 2026-08-01 for the week of 08-03.
// Generated from find-dup-visits.mjs; the ids below are the exact ones shown to him and approved.
//
// SAFETY: the approved id list is hardcoded. The script re-resolves each id against a LIVE Jobber
// snapshot and refuses to run unless all 9 resolve, none is already complete, and each one's job +
// day still has a surviving sibling visit. A duplicate delete that leaves no visit behind means the
// customer silently gets no service — that is the failure this guard exists to prevent.
//
// Usage: node delete-dup-visits-0803.mjs dry|live --visits=<snapshot.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: dry|live --visits=<file>'); process.exit(1); }
const vArg = process.argv.find(a => a.startsWith('--visits='));
if (!vArg) { console.log('--visits=<snapshot.json> required'); process.exit(1); }
const V = JSON.parse(fs.readFileSync(path.resolve(__dirname, vArg.split('=')[1]), 'utf8'));

// visitNum -> reason (Spencer-approved 2026-08-01)
const DELETE = {
  '2040319402': '4705 Pam Northrip — Tavis copy (kept 2260348620)',
  '2122434219': '6239 Lauren Kenyon — Tavis copy (kept 2268643623)',
  '2017346027': '7317 Chris Bartlett — Tavis copy (kept 2267908276)',
  '2102495849': '7809 Nick Pillon — unassigned copy (kept Luke 2258592361)',
  '2268234083': '8025 Christina Long — all-day copy (kept 2231812561, has the window)',
  '2268008495': '8117 Patty Dills — bare copy (kept 2242207177 "(5th visit)")',
  '2268377384': '8193 Erica Benson — exact twin, newer id (kept 2259502027)',
  '2268104967': '8201 Jenna Elberts — all-day copy (kept 2259578706, has the window)',
  '2268089055': '8235 Mike Schuppert — exact twin, newer id (kept 2265630305)',
};
const EXPECT = 9;

const pt = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' });
const num = id => { try { return Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch { return null; } };

const idx = {}, perJobDay = {};
for (const v of V) {
  const n = num(v.id); if (!n) continue;
  idx[n] = v;
  const k = `${v.job?.jobNumber}|${pt(v.startAt).slice(0, 10)}`;
  (perJobDay[k] = perJobDay[k] || []).push({ n, complete: v.isComplete });
}

const targets = [], problems = [];
for (const [n, why] of Object.entries(DELETE)) {
  const v = idx[n];
  if (!v) { problems.push(`${n} — not in snapshot (already gone or moved out of the week?)`); continue; }
  if (v.isComplete) { problems.push(`${n} — already COMPLETE, refusing`); continue; }
  const k = `${v.job?.jobNumber}|${pt(v.startAt).slice(0, 10)}`;
  const survivors = (perJobDay[k] || []).filter(s => s.n !== n && !DELETE[s.n] && !s.complete);
  if (!survivors.length) { problems.push(`${n} — deleting it would leave job ${v.job?.jobNumber} with NO visit that day, refusing`); continue; }
  targets.push({ num: n, enc: v.id, job: String(v.job?.jobNumber), title: v.title, startAt: v.startAt, why, keeps: survivors.map(s => s.n).join(',') });
}

for (const t of targets) console.log(`  del ${t.num}  ${pt(t.startAt).slice(0, 16)}  "${t.title}"  ${t.why}  [survivor ${t.keeps}]`);
if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach(p => console.log('  ' + p)); }
if (targets.length !== EXPECT) { console.error(`\n!! resolved ${targets.length}, expected ${EXPECT} — ABORT`); process.exit(1); }

fs.writeFileSync(path.join(__dirname, 'deleted-visits-0803.json'), JSON.stringify(targets, null, 1));
if (mode === 'dry') { console.log('\nDRY — nothing deleted. Targets saved to deleted-visits-0803.json'); process.exit(0); }

const tr = await (await fetch('https://api.getjobber.com/api/oauth/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
})).json();
const tok = tr.access_token;
if (!tok) { console.error('no Jobber token', JSON.stringify(tr).slice(0, 200)); process.exit(1); }
const gql = async (query, variables) => (await fetch('https://api.getjobber.com/api/graphql', {
  method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2023-11-15' },
  body: JSON.stringify({ query, variables }),
})).json();

let ok = 0, fail = 0;
for (const t of targets) {
  const j = await gql(`mutation($ids:[EncodedId!]!){ visitDelete(visitIds:$ids){ userErrors{ message } } }`, { ids: [t.enc] });
  const errs = j.errors || j.data?.visitDelete?.userErrors || [];
  if (errs.length) { fail++; console.log(`  FAIL ${t.num}: ${JSON.stringify(errs).slice(0, 160)}`); }
  else { ok++; console.log(`  deleted ${t.num}  (job ${t.job})`); }
  await new Promise(r => setTimeout(r, 450));
}
console.log(`\nDONE — deleted ${ok}, failed ${fail} of ${targets.length}`);
