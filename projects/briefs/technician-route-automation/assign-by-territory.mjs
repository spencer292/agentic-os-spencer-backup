#!/usr/bin/env node
// ASSIGN BY TERRITORY — put every Jobber visit on the tech who owns its region, from territories.json.
//
// Spencer 2026-08-06: the forward board had 2,404 of 3,630 open visits (66%) assigned to people who
// will not be doing them — Tavis 1,032 (was away, returns 08-17 into a DIFFERENT arc), unassigned
// 846, Cammeron 318 (left 08-07), Spencer Hill 208 (out of field since 07-29). Every planning pass
// was guessing, which is why the week needed hand-fixing however good the router was.
//
// This is ownership, not scheduling: it writes the ASSIGNEE only. No dates, no times, no
// OptimoRoute. Run `jobber-to-optimo-sync.mjs` afterwards to push the result into the plan.
//
// The Cory -> Tavis handover on 2026-08-17 is applied per VISIT DATE, so one run can cover both
// sides of it correctly.
//
// Usage: node assign-by-territory.mjs dry|live --from=2026-08-10 --to=2026-08-14
//                                    [--max-writes=600] [--only=Tavis Alexander] [--show=40]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const RUNS_DIR = path.join(__dirname, 'drift-runs');
const TZ = 'America/Los_Angeles';

const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: assign-by-territory.mjs dry|live --from=YYYY-MM-DD --to=YYYY-MM-DD [--max-writes=N] [--only="Tech Name"]'); process.exit(1); }
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const MAX_WRITES = Number(flag('max-writes', 600));
const ONLY = flag('only', null);
const SHOW = Number(flag('show', 40));
if (!FROM || !TO) { console.error('--from and --to are required'); process.exit(1); }

const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'territories.json'), 'utf8'));

// zip -> region, and the handover-aware owner lookup
const ZIP_REGION = {};
for (const [name, r] of Object.entries(T.regions)) for (const z of r.zips) ZIP_REGION[z] = name;
function ownerFor(regionName, visitDate) {
  const r = T.regions[regionName];
  if (!r) return null;
  for (const h of T.handovers || []) {
    if (h.regions.includes(regionName) && visitDate >= h.effective) return h.to;
  }
  return r.owner;
}

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
  if (data.errors && JSON.stringify(data.errors).includes('THROTTLED') && attempt < 9) {
    const w = Math.min(60000, 2500 * 2 ** attempt); console.log(`  throttled — backoff ${(w / 1000).toFixed(0)}s`); await sleep(w); return jgql(query, variables, attempt + 1);
  }
  return data;
}
const toPT = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

console.log(`ASSIGN BY TERRITORY (${mode.toUpperCase()})  ${FROM} .. ${TO}   map v${T.version}`);
if (ONLY) console.log(`  filtered to visits currently on: ${ONLY}`);

const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id startAt isComplete
      client{ name }
      job{ jobNumber }
      property{ address{ city postalCode } }
      assignedUsers(first:4){ nodes{ id name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;
let cur = null; const visits = [];
for (;;) {
  const d = await jgql(Q, { a: cur, after: `${FROM}T00:00:00-07:00`, before: `${TO}T23:59:59-07:00` });
  if (!d.data) { console.error('Jobber query failed:', JSON.stringify(d).slice(0, 300)); process.exit(1); }
  visits.push(...d.data.visits.nodes);
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cur = d.data.visits.pageInfo.endCursor;
  await sleep(430);
}
const open = visits.filter(v => !v.isComplete);
console.log(`  open visits in window: ${open.length}`);

const users = {};
{
  const r = await jgql('query { users(first: 100) { nodes { id name { full } status } } }', {});
  for (const u of (r.data?.users?.nodes || [])) if (u.name?.full) users[u.name.full.trim().toLowerCase()] = { id: u.id, status: u.status };
}

const plan = [], noRegion = {}, noUser = new Set();
for (const v of open) {
  const date = toPT(v.startAt).slice(0, 10);
  const zip = ((v.property?.address?.postalCode || '') + '').trim().slice(0, 5);
  const jn = String(v.job?.jobNumber || '');
  const now = v.assignedUsers?.nodes?.[0]?.name?.full || null;
  if (ONLY && now !== ONLY) continue;

  const ov = T.jobOverrides?.[jn];
  const region = ZIP_REGION[zip] || null;
  const target = ov ? ov.tech : (region ? ownerFor(region, date) : null);
  if (!target) { const k = `${zip} ${v.property?.address?.city || ''}`; noRegion[k] = (noRegion[k] || 0) + 1; continue; }
  const u = users[target.trim().toLowerCase()];
  if (!u) { noUser.add(target); continue; }
  if (now === target) continue;
  plan.push({ visitId: v.id, job: jn, client: v.client?.name, city: v.property?.address?.city, zip, date, region: ov ? 'jobOverride' : region, from: now, to: target, userId: u.id });
}

console.log(`\n=== PLAN ===`);
console.log(`  visits to reassign : ${plan.length}`);
console.log(`  already correct    : ${open.length - plan.length - Object.values(noRegion).reduce((a, b) => a + b, 0)}`);
const fromCount = {}, toCount = {}, regionCount = {};
for (const p of plan) {
  fromCount[p.from || 'UNASSIGNED'] = (fromCount[p.from || 'UNASSIGNED'] || 0) + 1;
  toCount[p.to] = (toCount[p.to] || 0) + 1;
  regionCount[p.region] = (regionCount[p.region] || 0) + 1;
}
console.log('\n  FROM (who has them now):');
for (const [k, n] of Object.entries(fromCount).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(5)}  ${k}`);
console.log('\n  TO (territory owner):');
for (const [k, n] of Object.entries(toCount).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(5)}  ${k}`);
console.log('\n  by region:');
for (const [k, n] of Object.entries(regionCount).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(5)}  ${k}`);

// The change counts above are not the answer — what matters is where every visit ENDS UP.
const before = {}, after = {};
const moved = new Set(plan.map(p => p.visitId));
for (const v of open) {
  const now = v.assignedUsers?.nodes?.[0]?.name?.full || 'UNASSIGNED';
  before[now] = (before[now] || 0) + 1;
  if (!moved.has(v.id)) after[now] = (after[now] || 0) + 1;
}
for (const p of plan) after[p.to] = (after[p.to] || 0) + 1;
console.log('\n  RESULTING LOAD (visits in window, before -> after):');
for (const k of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
  console.log(`    ${k.padEnd(20)} ${String(before[k] || 0).padStart(5)} -> ${String(after[k] || 0).padStart(5)}`);
}
if (Object.keys(noRegion).length) {
  console.log('\n  !! zip not in any territory (left alone — extend territories.json):');
  for (const [k, n] of Object.entries(noRegion).sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`    ${String(n).padStart(5)}  ${k}`);
}
if (noUser.size) console.log(`\n  !! no Jobber user for: ${[...noUser].join(', ')}`);

console.log(`\n  sample (first ${SHOW}):`);
for (const p of plan.slice(0, SHOW)) {
  console.log(`    #${String(p.job).padEnd(5)} ${p.date}  ${String(p.city || '').slice(0, 15).padEnd(16)} ${String(p.from || 'UNASSIGNED').split(' ')[0].padEnd(10)} -> ${p.to.split(' ')[0].padEnd(9)} ${p.region}`);
}
if (plan.length > SHOW) console.log(`    … +${plan.length - SHOW} more`);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.mkdirSync(RUNS_DIR, { recursive: true });
const reportPath = path.join(RUNS_DIR, `assign-territory-${stamp}.json`);
fs.writeFileSync(reportPath, JSON.stringify({ ranAt: new Date().toISOString(), mode, from: FROM, to: TO, mapVersion: T.version, plan, noRegion, noUser: [...noUser] }, null, 2));

if (mode === 'dry') { console.log(`\nDRY RUN — nothing written. Report: ${reportPath}`); process.exit(0); }

// GUARD: a scoped run has a knowable size. Far above it means the window or the map is wrong.
if (plan.length > MAX_WRITES) {
  console.error(`\n🛑 ABORT: ${plan.length} reassignments exceeds --max-writes ${MAX_WRITES}. NO writes made.`);
  process.exit(1);
}

console.log('\n=== WRITING ===');
let ok = 0, failed = 0;
for (const p of plan) {
  const r = await jgql(`mutation { visitEditAssignedUsers(visitId: "${p.visitId}", input: { assignedUserIds: ["${p.userId}"] }) { userErrors { message } } }`, {});
  const ue = (r.errors || []).map(e => e.message);
  for (const k of Object.keys(r.data || {})) if (r.data[k]?.userErrors) ue.push(...r.data[k].userErrors.map(e => e.message));
  if (ue.length) { failed++; console.log(`  FAILED #${p.job} ${p.date}: ${ue.join('; ')}`); } else ok++;
  if ((ok + failed) % 50 === 0) console.log(`  …${ok + failed}/${plan.length}`);
  await sleep(230);
}
console.log(`\nDONE: ${ok} reassigned, ${failed} failed.`);
console.log(`Report: ${reportPath}`);
console.log('NEXT: node projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs live --from=' + FROM + ' --to=' + TO);
process.exit(failed ? 1 : 0);
