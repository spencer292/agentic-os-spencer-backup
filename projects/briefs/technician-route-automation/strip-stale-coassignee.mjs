#!/usr/bin/env node
// STRIP STALE CO-ASSIGNEE — reduce a visit assigned to TWO drivers down to the one
// OptimoRoute actually routed it to.
//
// Born 2026-08-03: Alias Franks rode along with Cory Ventura until 07-31 and started his own truck
// the week of 08-03. When his stops moved onto his own route the new tech was ADDED to the Jobber
// visit and the old one never came off, so 5 visits showed on both men's schedules (#8253, #8252,
// #8263, #8265, #8254) — plus #8228, the same shape with Spencer Hill, who is notWorking in the grid.
//
// Rule: OptimoRoute is the dispatch truth. For every OPEN visit in the window with >1 assignee,
// if exactly one assignee is the OR driver for that order, drop the others — EXCEPT designated
// ride-alongs, who are crew rather than a truck and are supposed to be on the visit alongside a
// driver. Touches assignees ONLY: no dates, no times, no arrival windows.
//
// Usage: node strip-stale-coassignee.mjs dry|live [--from=2026-08-03] [--to=2026-08-07]
//                                                 [--no-ride-along-exemption]
// Guards: never touches a ride-along pairing; never touches a visit whose sole assignee is already
// correct; aborts a visit if the OR driver is not among the current assignees (that is a real
// reassignment, not a leftover — out of scope here, use move-tech-replan.mjs).
//
// --no-ride-along-exemption drops the ride-along carve-out and reduces EVERY multi-assigned visit
// to its OptimoRoute driver. Added 2026-08-03 on Spencer's call: the repo contradicts itself on
// Robert Norton — lock-techs-to-jobber.mjs exempts him as crew, while territory-grid-v5.json lists
// him under notWorking. When a tech is off the roster, a visit carrying him plus a driver is a
// two-technician visit, not a crew pairing.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const RUNS_DIR = path.join(__dirname, 'drift-runs');
const TZ = 'America/Los_Angeles';

// Crew who ride WITH a driver — same rule as lock-techs-to-jobber.mjs. A visit carrying a
// ride-along plus a driver is correct and must be left alone.
const RIDE_ALONG = /norton/i;

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
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('Jobber token refresh failed', res.status); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token; tokenAt = Date.now();
  return accessToken;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  if (throttled && attempt < 8) {
    const wait = Math.min(60000, 2000 * 2 ** attempt);
    console.log(`  jobber throttled — backoff ${wait / 1000}s`);
    await sleep(wait);
    return jgql(query, variables, attempt + 1);
  }
  if (!res.ok) throw new Error(`Jobber HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}
function gqlErrors(r) {
  const ue = [];
  if (r.errors) ue.push(...r.errors.map(e => e.message));
  const d = r.data || {};
  for (const k of Object.keys(d)) if (d[k] && d[k].userErrors) ue.push(...d[k].userErrors.map(e => e.message));
  return ue;
}
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) {
    await sleep(1500 * (attempt + 1));
    return orGet(q, attempt + 1);
  }
  return d;
}
const PT = s => new Date(s).toLocaleString('sv-SE', { timeZone: TZ });
function visitNumOf(vis) {
  let num = null;
  try { num = Buffer.from(vis.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!num || !/^\d+$/.test(num)) num = vis.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return num;
}
function addDaysPT(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// ---------- main ----------
const argv = process.argv.slice(2);
const mode = argv.find(a => a === 'dry' || a === 'live');
const arg = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = arg('from', '2026-08-03'), TO = arg('to', '2026-08-07');
const exemptRideAlongs = !argv.includes('--no-ride-along-exemption');
if (!mode) { console.log('Usage: strip-stale-coassignee.mjs dry|live [--from=YYYY-MM-DD] [--to=YYYY-MM-DD] [--no-ride-along-exemption]'); process.exit(1); }
console.log(`STRIP STALE CO-ASSIGNEE (${mode}) ${FROM}..${TO}${exemptRideAlongs ? '' : '  [ride-along exemption OFF]'}`);

// OptimoRoute = dispatch truth
const OR = {};
for (let d = FROM; d <= TO; d = addDaysPT(d, 1)) {
  const r = await orGet(`get_routes?date=${d}`);
  for (const rt of r.routes || []) for (const s of rt.stops || []) {
    const no = String(s.orderNo || '');
    if (/^\d+-\w+$/.test(no)) OR[no] = rt.driverName;
  }
}
console.log(`OptimoRoute stops in window: ${Object.keys(OR).length}`);

// Jobber visits
const visits = [];
let cursor = null;
for (;;) {
  const q = `query($after:String){ visits(first:100, after:$after, filter:{ startAt:{ after:"${addDaysPT(FROM, -1)}T23:59:59-07:00", before:"${TO}T23:59:59-07:00" } }){ nodes{ id title startAt isComplete assignedUsers(first:6){ nodes{ id name{ full } } } job{ jobNumber } property{ address{ postalCode } } } pageInfo{ hasNextPage endCursor } } }`;
  const r = await jgql(q, { after: cursor });
  if (r.errors) throw new Error('Jobber: ' + JSON.stringify(r.errors).slice(0, 300));
  visits.push(...r.data.visits.nodes);
  if (!r.data.visits.pageInfo.hasNextPage) break;
  cursor = r.data.visits.pageInfo.endCursor;
  await sleep(400);
}
console.log(`Jobber visits in window: ${visits.length}`);

const plan = [], skipped = [];
for (const v of visits) {
  if (v.isComplete || !v.job?.jobNumber) continue;
  const users = v.assignedUsers?.nodes || [];
  if (users.length < 2) continue;
  const names = users.map(u => u.name.full);
  if (exemptRideAlongs && names.some(n => RIDE_ALONG.test(n))) { skipped.push({ job: v.job.jobNumber, why: 'ride-along', names }); continue; }
  const orderNo = `${v.job.jobNumber}-${visitNumOf(v)}`;
  const driver = OR[orderNo];
  if (!driver) { skipped.push({ job: v.job.jobNumber, why: 'no OR stop', names }); continue; }
  const keep = users.find(u => u.name.full === driver);
  if (!keep) { skipped.push({ job: v.job.jobNumber, why: `OR driver ${driver} not among assignees — real reassignment, out of scope`, names }); continue; }
  plan.push({
    job: String(v.job.jobNumber), visitId: v.id, title: v.title,
    date: PT(v.startAt).slice(0, 10), zip: (v.property?.address?.postalCode || '').slice(0, 5),
    was: names, keep: driver, keepId: keep.id, drop: names.filter(n => n !== driver),
  });
}

console.log(`\n${plan.length} visits to reduce:`);
for (const p of plan) console.log(`  #${p.job.padEnd(5)} ${p.date} ${(p.title || '').slice(0, 26).padEnd(27)} ${p.zip}  ${p.was.join(' + ').padEnd(38)} -> ${p.keep}  (drop ${p.drop.join(', ')})`);
if (skipped.length) {
  console.log(`\n${skipped.length} multi-assigned visits left alone:`);
  for (const s of skipped) console.log(`  #${String(s.job).padEnd(5)} ${s.names.join(' + ').padEnd(38)} — ${s.why}`);
}
if (mode === 'dry') { console.log('\nDRY — nothing written.'); process.exit(0); }
if (!plan.length) { console.log('\nNothing to do.'); process.exit(0); }

console.log('');
let ok = 0, failed = 0;
const writes = [];
for (const p of plan) {
  const r = await jgql(`mutation($id:EncodedId!,$input:VisitEditAssignedUsersInput!){ visitEditAssignedUsers(visitId:$id, input:$input){ userErrors{ message } } }`,
    { id: p.visitId, input: { assignedUserIds: [p.keepId] } });
  const ue = gqlErrors(r);
  if (ue.length) { failed++; console.log(`  #${p.job} FAIL ${ue.join('; ')}`); }
  else { ok++; writes.push(p); console.log(`  #${p.job} ok — ${p.was.join(' + ')} -> ${p.keep}`); }
  await sleep(350);
}
console.log(`\nDone: ${ok} ok, ${failed} failed.`);

const report = { ranAt: new Date().toISOString(), kind: 'strip-stale-coassignee', from: FROM, to: TO, writes, skipped, failed };
fs.mkdirSync(RUNS_DIR, { recursive: true });
const out = path.join(RUNS_DIR, `coassignee-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`Report saved: ${out}`);
process.exit(failed ? 1 : 0);
