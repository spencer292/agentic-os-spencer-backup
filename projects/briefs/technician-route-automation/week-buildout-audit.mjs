#!/usr/bin/env node
// WEEK BUILDOUT AUDIT — three questions at once, for planning a forward week:
//
//   A) VOLUME    — how many visits per day this week vs the forward week(s)? Spencer 2026-08-04:
//                  "whatever number of visits we have this week is going to be similar to the visits
//                  we have next week because we are continuing to get busier day by day."
//   B) TECH MAP  — how many forward visits belong to a property that was served in the hand-assigned
//                  window (default Aug 3-7)? That window is the cleanest customer->tech statement we
//                  have: four real routes, no crew co-assignment, no departed techs.
//   C) GAP       — properties served in the baseline week that have NO scheduled visit ahead.
//                  These are the follow-ups that "get missed" — Total Mole Control customers who
//                  need another visit and have not been booked one.
//
// Why the baseline window matters: before 2026-08-03 there were only THREE routes (Alias rode with
// Cory as one crew), 21% of visits carried two assignees, and Spencer Hill / Robert Norton were
// still on the board. So "who served this property last" is unanswerable before the split, and any
// continuity restore built on it is acting on a field-ordering artifact.
//
// READ-ONLY.
//
// Usage: node week-buildout-audit.mjs --baseline-from=2026-08-03 --baseline-to=2026-08-07
//                                     --target-from=2026-08-10 --target-to=2026-08-14
//                                     [--ahead=21]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const TZ = 'America/Los_Angeles';
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const BF = flag('baseline-from', '2026-08-03'), BT = flag('baseline-to', '2026-08-07');
const TF = flag('target-from', '2026-08-10'), TT = flag('target-to', '2026-08-14');
const AHEAD = Number(flag('ahead', 21));

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : txt + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}
let accessToken = null, tokenAt = 0;
async function jobberToken(force = false) {
  if (!force && accessToken && Date.now() - tokenAt < 50 * 60 * 1000) return accessToken;
  const env = loadEnv();
  const res = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('Jobber token refresh failed', res.status); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token; tokenAt = Date.now();
  return accessToken;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jgql(query, variables, attempt = 0) {
  const token = await jobberToken();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await jobberToken(true); return jgql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 9) { const w = Math.min(60000, 2500 * 2 ** attempt); console.log(`  throttled — backoff ${(w / 1000).toFixed(0)}s`); await sleep(w); return jgql(query, variables, attempt + 1); }
  return data;
}
const toPT = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function dowOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id startAt isComplete
      client{ id name }
      job{ jobNumber jobType }
      property{ id address{ city postalCode } }
      assignedUsers(first:6){ nodes{ name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;
async function fetchRange(a, b, label) {
  let cur = null; const out = [];
  for (;;) {
    const d = await jgql(Q, { a: cur, after: `${a}T00:00:00-07:00`, before: `${b}T23:59:59-07:00` });
    if (!d.data) { console.error(`${label} failed:`, JSON.stringify(d).slice(0, 250)); break; }
    out.push(...d.data.visits.nodes);
    if (!d.data.visits.pageInfo.hasNextPage) break;
    cur = d.data.visits.pageInfo.endCursor;
    await sleep(420);
  }
  console.log(`  ${label}: ${out.length} visits`);
  return out;
}

console.log(`WEEK BUILDOUT AUDIT\n  baseline ${BF}..${BT}   target ${TF}..${TT}   look-ahead ${AHEAD}d\n`);
const all = await fetchRange(BF, addDays(BF, AHEAD + 7), 'fetched');
const act = all.filter(v => !v.isComplete || toPT(v.startAt).slice(0, 10) <= BT);

// ---------- A) volume ----------
const perDay = {};
for (const v of act) {
  const d = toPT(v.startAt).slice(0, 10);
  perDay[d] = (perDay[d] || 0) + 1;
}
function weekTotal(a, b) { let n = 0; for (let d = a; d <= b; d = addDays(d, 1)) n += perDay[d] || 0; return n; }
console.log('\n=== A) VOLUME PER DAY ===');
const w2f = addDays(TF, 7), w2t = addDays(TT, 7);
for (const [a, b, label] of [[BF, BT, 'THIS WEEK  '], [TF, TT, 'NEXT WEEK  '], [w2f, w2t, 'WEEK AFTER ']]) {
  const cells = [];
  for (let d = a; d <= b; d = addDays(d, 1)) cells.push(`${dowOf(d)} ${String(perDay[d] || 0).padStart(3)}`);
  console.log(`  ${label} ${cells.join('  ')}   TOTAL ${String(weekTotal(a, b)).padStart(4)}`);
}
const thisW = weekTotal(BF, BT), nextW = weekTotal(TF, TT);
console.log(`\n  next week is ${nextW} vs ${thisW} this week  ->  SHORT BY ${thisW - nextW} visits (${(100 * nextW / thisW).toFixed(0)}% of this week)`);

// ---------- B) tech-map coverage ----------
const baseTech = {}; // propertyId -> tech (single assignee only; the window has no crew visits)
const baseProps = new Set();
for (const v of act) {
  const d = toPT(v.startAt).slice(0, 10);
  if (d < BF || d > BT) continue;
  baseProps.add(v.property?.id);
  const names = (v.assignedUsers?.nodes || []).map(n => n.name.full);
  if (names.length === 1) baseTech[v.property?.id] = names[0];
}
const target = act.filter(v => { const d = toPT(v.startAt).slice(0, 10); return d >= TF && d <= TT; });
let covered = 0, uncovered = 0, agree = 0, differ = 0;
const differPairs = {};
for (const v of target) {
  const bt = baseTech[v.property?.id];
  if (!bt) { uncovered++; continue; }
  covered++;
  const now = (v.assignedUsers?.nodes || [])[0]?.name?.full;
  if (now === bt) agree++;
  else { differ++; const k = `${(now || 'none').split(' ')[0]} -> ${bt.split(' ')[0]}`; differPairs[k] = (differPairs[k] || 0) + 1; }
}
console.log('\n=== B) TECH MAP COVERAGE (from the hand-assigned baseline week) ===');
console.log(`  target visits whose property WAS served ${BF}..${BT} : ${covered}/${target.length} (${(100 * covered / Math.max(1, target.length)).toFixed(0)}%)`);
console.log(`  no baseline (longer-cycle / new) — need a fallback  : ${uncovered}`);
console.log(`    of the covered: already on the baseline tech       : ${agree}`);
console.log(`    of the covered: on a DIFFERENT tech                : ${differ}`);
if (differ) { console.log('    differences (current -> baseline tech):'); for (const [k, n] of Object.entries(differPairs).sort((a, b) => b[1] - a[1])) console.log(`      ${String(n).padStart(4)}  ${k}`); }

// ---------- C) follow-up gap ----------
const futureByProp = {};
for (const v of act) {
  const d = toPT(v.startAt).slice(0, 10);
  if (d <= BT) continue;
  (futureByProp[v.property?.id] = futureByProp[v.property?.id] || []).push(d);
}
const gaps = [];
for (const v of act) {
  const d = toPT(v.startAt).slice(0, 10);
  if (d < BF || d > BT) continue;
  const fut = futureByProp[v.property?.id];
  const next = fut && fut.length ? fut.sort()[0] : null;
  if (!next) gaps.push({ job: v.job?.jobNumber, jobType: v.job?.jobType, client: v.client?.name, city: v.property?.address?.city, zip: v.property?.address?.postalCode, served: d, tech: (v.assignedUsers?.nodes || [])[0]?.name?.full });
}
const seen = new Set(); const uniqGaps = gaps.filter(g => { const k = g.job + '|' + g.client; if (seen.has(k)) return false; seen.add(k); return true; });
console.log(`\n=== C) FOLLOW-UP GAP — served ${BF}..${BT}, NOTHING booked in the next ${AHEAD} days ===`);
console.log(`  properties with no next visit: ${uniqGaps.length}`);
const byType = {}, byTech = {};
for (const g of uniqGaps) { byType[g.jobType || '?'] = (byType[g.jobType || '?'] || 0) + 1; byTech[g.tech || 'none'] = (byTech[g.tech || 'none'] || 0) + 1; }
console.log('  by job type:', JSON.stringify(byType));
console.log('  by tech    :', JSON.stringify(byTech));
console.log('\n  first 25:');
for (const g of uniqGaps.slice(0, 25)) console.log(`    #${String(g.job).padEnd(5)} ${String(g.client || '').slice(0, 22).padEnd(23)} ${String(g.city || '').slice(0, 14).padEnd(15)} served ${g.served} by ${String(g.tech || '?').split(' ')[0]}`);
if (uniqGaps.length > 25) console.log(`    … +${uniqGaps.length - 25} more`);

const out = path.join(__dirname, `week-buildout-${TF}_${TT}.json`);
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), baseline: [BF, BT], target: [TF, TT], perDay, thisWeek: thisW, nextWeek: nextW, coverage: { covered, uncovered, agree, differ, differPairs }, gaps: uniqGaps }, null, 2));
console.log(`\nSaved: ${out}`);
