#!/usr/bin/env node
// apply-defer-plan.mjs — execute the Labor Day short-week deferrals.
//
// Approved by Spencer 2026-09-03 after reviewing the roster: TMCP jobs with a quiet note and no
// add-visit instruction move one week, so the Sep 8-11 four-day week fits.
//
// TARGET DATE RULE — deliberately NOT a blind +7.
//   Spencer parked the whole Monday tile onto Tue 9/8 as staging. A visit sitting on 9/8 therefore
//   may belong to Monday, and +7 would strand it on a Tuesday it has never run. So:
//     * a visit on the parked day (2026-09-08) goes to its OWN home weekday in the week of 9/14,
//       derived from where that tech has actually run that zip over the last five weeks;
//     * a visit on Wed/Thu/Fri is already on its natural day -> same weekday, +7.
//   This moves dates only. It never changes a tech, and it never re-cuts a tile.
//
// SAFETY
//   * write-gate.mjs is the FIRST import: every write is ledgered, and refused unless authority is on.
//   * dry run by default. --live is required to write.
//   * refuses any visit that is its job's SET (the promised first day).
//   * refuses if the visit has moved since the plan was built.
//
// Usage: node apply-defer-plan.mjs [--tier1|--tier2|--all] [--live]
import '../route-engine/lib/write-gate.mjs';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';
const PARKED_DAY = '2026-09-08';
const WEEK_OF = { Mon: '2026-09-14', Tue: '2026-09-15', Wed: '2026-09-16', Thu: '2026-09-17', Fri: '2026-09-18' };

// Spencer reviewed the roster 2026-09-03 and cleared the whole Tier 1 batch, including #8054
// Katie Richardson, which had been held back for a 7-day-old note carrying no instruction.
const EXCLUDE = new Set();

const argv = process.argv.slice(2);
const LIVE = argv.includes('--live');
const TIER = argv.includes('--all') ? 'all' : argv.includes('--tier2') ? 'tier2' : 'tier1';

const loadEnv = () => {
  const env = {};
  for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
  return env;
};
function saveEnvKey(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : txt + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tok = null;
async function token(force = false) {
  if (tok && !force) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('token refresh failed', r.status, JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token;
  return tok;
}
async function gql(query, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query }),
  });
  if (res.status === 401 && attempt < 2) { await token(true); return gql(query, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return gql(query, attempt + 1); }
  if (data.errors) throw new Error('Jobber: ' + JSON.stringify(data.errors).slice(0, 300));
  return data.data;
}

const ptDate = s => new Date(new Date(s).getTime() - 7 * 3600e3).toISOString().slice(0, 10);
const dow = d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d + 'T12:00:00Z').getUTCDay()];
const addDays = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// --- home weekday per tech+zip, from five weeks of real routes ---
const hist = [
  ...JSON.parse(fs.readFileSync(path.join(__dirname, '_visits_aug.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(__dirname, '_visits_wk0831.json'), 'utf8')),
];
const tally = {};
for (const x of hist) {
  const t = x.assignedUsers?.nodes?.[0]?.name?.full || 'X';
  const z = (x.property?.address?.postalCode || '').slice(0, 5);
  const d = dow(ptDate(x.startAt));
  ((tally[t] = tally[t] || {})[z] = tally[t][z] || {})[d] = (tally[t][z][d] || 0) + 1;
}
const homeDay = (tech, zip) => {
  const v = tally[tech]?.[zip];
  if (!v) return null;
  const best = Object.entries(v).filter(([d]) => WEEK_OF[d]).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
};

// --- build the batch ---
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, '_defer_plan.json'), 'utf8'));
const defer = plan.rows.filter(r => r.decision === 'DEFER');
const unreadable = r => r.activity === null && r.moles === null && r.misses === null && !r.nextAction;
const tierOf = r => unreadable(r) ? 'hold' : r.noteAge >= 30 ? 'tier2' : 'tier1';

const batch = [];
for (const r of defer) {
  const t = tierOf(r);
  if (t === 'hold') continue;
  if (TIER === 'tier1' && t !== 'tier1') continue;
  if (TIER === 'tier2' && t !== 'tier2') continue;
  if (EXCLUDE.has(r.jobNumber)) continue;

  let target, basis;
  if (r.date === PARKED_DAY) {
    const h = homeDay(r.tech, r.zip);
    if (h) { target = WEEK_OF[h]; basis = `home day ${h}`; }
    else { target = addDays(r.date, 7); basis = 'no history for this tech+zip — fell back to +7'; }
  } else {
    target = addDays(r.date, 7);
    basis = `already on its own day (${r.day}) — +7`;
  }
  batch.push({ ...r, tier: t, target, basis });
}

console.log(`\n  DEFERRAL EXECUTOR — ${LIVE ? '*** LIVE ***' : 'DRY RUN'}   tier=${TIER}   ${batch.length} visits\n`);
const fallbacks = batch.filter(b => b.basis.startsWith('no history'));
const byTech = {};
for (const b of batch) (byTech[b.tech] = byTech[b.tech] || []).push(b);
for (const t of Object.keys(byTech).sort()) {
  console.log(`  ${t.toUpperCase()}  (${byTech[t].length})`);
  for (const b of byTech[t].sort((a, c) => a.target.localeCompare(c.target))) {
    console.log(`    #${String(b.jobNumber).padEnd(5)} ${b.client.replace(/\s+/g, ' ').trim().slice(0, 24).padEnd(25)} ${b.zip} ${b.city.slice(0, 13).padEnd(14)} ${b.date} ${b.day}  ->  ${b.target} ${dow(b.target)}   ${b.basis}`);
  }
  console.log('');
}
if (fallbacks.length) console.log(`  !! ${fallbacks.length} used the +7 fallback (no tech+zip history) — listed above\n`);

if (!LIVE) {
  console.log('  DRY RUN — nothing written. Re-run with --live once write authority is enabled:');
  console.log('    node ../route-engine/scripts/write-authority.mjs enable --reason "Labor Day deferrals, Spencer approved 09-03" --ttl 30m --ceiling 60');
  process.exit(0);
}

// --- pre-flight: re-read the whole window ONCE and check the board still matches the plan ---
// (Jobber exposes no `node(id:)` root field, so a per-visit lookup is not available. One windowed
// read is cheaper anyway, and it catches a board that moved under us since the plan was built.)
const live = new Map();
{
  let cursor = null;
  for (let p = 0; p < 20; p++) {
    const afterArg = cursor ? `, after: "${cursor}"` : '';
    const v = (await gql(`query { visits(first: 100${afterArg}, filter: { startAt: { after: "2026-09-07T07:00:00Z", before: "2026-09-11T23:59:59-07:00" } }) {
      nodes { id startAt job { jobNumber startAt } }
      pageInfo { hasNextPage endCursor } } }`)).visits;
    for (const n of v.nodes) live.set(n.id, n);
    if (!v.pageInfo.hasNextPage) break;
    cursor = v.pageInfo.endCursor;
    await sleep(300);
  }
}
console.log(`  pre-flight: re-read ${live.size} visits on the live board\n`);

// --- execute ---
let ok = 0, refused = 0, failed = 0;
for (const b of batch) {
  const v = live.get(b.visitId);
  if (!v) { console.log(`  SKIP  #${b.jobNumber} — no longer in the Sep 7-11 window`); refused++; continue; }
  if (ptDate(v.startAt) !== b.date) { console.log(`  SKIP  #${b.jobNumber} — moved since the plan was built (now ${ptDate(v.startAt)}, plan said ${b.date})`); refused++; continue; }
  if (v.job?.startAt && ptDate(v.job.startAt) === b.date) { console.log(`  SKIP  #${b.jobNumber} — this visit is the job's SET`); refused++; continue; }

  const m = `mutation { visitEditSchedule(id: ${JSON.stringify(b.visitId)}, input: {
    startAt: { date: "${b.target}", timezone: "${TZ}" }, endAt: { date: "${b.target}", timezone: "${TZ}" }
  }) { visit { startAt } userErrors { message } } }`;
  try {
    const r = (await gql(m)).visitEditSchedule;
    if (r.userErrors?.length) { console.log(`  FAIL  #${b.jobNumber} ${JSON.stringify(r.userErrors)}`); failed++; }
    else { console.log(`  MOVED #${String(b.jobNumber).padEnd(5)} ${b.client.slice(0, 22).padEnd(23)} ${b.date} -> ${b.target}`); ok++; }
  } catch (e) { console.log(`  FAIL  #${b.jobNumber} ${e.message.slice(0, 160)}`); failed++; }
  await sleep(400);
}
console.log(`\n  moved ${ok}   skipped ${refused}   failed ${failed}`);
fs.writeFileSync(path.join(__dirname, `_defer_executed_${new Date().toISOString().slice(0, 10)}.json`),
  JSON.stringify({ ranAt: new Date().toISOString(), tier: TIER, moved: ok, refused, failed, batch }, null, 1));
