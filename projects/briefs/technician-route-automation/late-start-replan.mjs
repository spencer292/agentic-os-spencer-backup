#!/usr/bin/env node
// LATE-START REPLAN — push one driver's day to start no earlier than a given time.
// Born 2026-07-21: Spencer starts 7/22 at ~10:30-10:45, route was slotted from 07:42.
// Per 07-12 policy, the constraint goes in as ORDER timeWindows (never driver params —
// update_driver_parameters unschedules routes). Every one of the driver's orders on the day
// gets twFrom >= <earliestStart>; existing promised windows are MERGED (later twFrom wins,
// twTo kept). All stops locked to day+tech, day re-planned (balancing OFF), verified
// (nothing lost, no tech moves, driver's first stop >= earliestStart), times written to Jobber.
//
// Usage: node late-start-replan.mjs <date> <driverName> <earliestStart HH:MM> [--override-freeze]
//   e.g. node late-start-replan.mjs 2026-07-22 "Spencer Hill" 10:30 --override-freeze
// Guards: email freeze (override only with the user's explicit in-session OK); never deletes;
// aborts with zero Jobber writes on any verify failure.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const RUNS_DIR = path.join(__dirname, 'drift-runs');
const TZ = 'America/Los_Angeles';

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
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

async function orCall(endpoint, body, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) {
    await sleep(1500 * (attempt + 1));
    return orCall(endpoint, body, attempt + 1);
  }
  return d;
}
async function orGet(endpointWithQuery, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpointWithQuery}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) {
    await sleep(1500 * (attempt + 1));
    return orGet(endpointWithQuery, attempt + 1);
  }
  return d;
}

function toPT(iso) {
  const s = new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
  return { date: s.slice(0, 10), hm: s.slice(11, 16) };
}
function ptNow() { return new Date().toLocaleString('sv-SE', { timeZone: TZ }); }
function addDaysPT(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function emailCutoffOk(dateStr) {
  const nowStr = ptNow();
  const today = nowStr.slice(0, 10);
  const hour = Number(nowStr.slice(11, 13));
  if (dateStr <= today) return false;
  if (dateStr === addDaysPT(today, 1) && hour >= 14) return false;
  return true;
}
function visitNumOf(vis) {
  let num = null;
  try { num = Buffer.from(vis.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!num || !/^\d+$/.test(num)) num = vis.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return num;
}

async function fetchVisits(afterIso, beforeIso) {
  const visits = [];
  let cursor = null;
  for (;;) {
    const q = `query($after: String) { visits(first: 25, after: $after, filter: { startAt: { after: "${afterIso}", before: "${beforeIso}" } }) { nodes { id title startAt endAt isComplete assignedUsers(first: 2) { nodes { id name { full } } } job { jobNumber } } pageInfo { hasNextPage endCursor } } }`;
    const r = await jgql(q, { after: cursor });
    if (r.errors) throw new Error('Jobber: ' + JSON.stringify(r.errors).slice(0, 300));
    const v = r.data.visits;
    visits.push(...v.nodes);
    if (!v.pageInfo.hasNextPage) break;
    cursor = v.pageInfo.endCursor;
    if (visits.length > 4000) throw new Error('runaway pagination');
    await sleep(700);
  }
  return visits;
}

// ---------- main ----------
const argv = process.argv.slice(2);
const overrideFreeze = argv.includes('--override-freeze');
const [day, driverName, earliestStart] = argv.filter((a) => a !== '--override-freeze');
if (!day || !driverName || !/^\d{2}:\d{2}$/.test(earliestStart || '')) {
  console.log('Usage: late-start-replan.mjs <date> <driverName> <earliestStart HH:MM> [--override-freeze]');
  process.exit(1);
}
console.log(`LATE-START replan ${ptNow()} PT — ${driverName}'s ${day} starts no earlier than ${earliestStart}`);
if (!emailCutoffOk(day)) {
  if (!overrideFreeze) { console.error(`ABORT: ${day} is frozen (email cutoff) — no writes. (--override-freeze only with the user's explicit OK)`); process.exit(1); }
  const todayPT = ptNow().slice(0, 10);
  if (day <= todayPT) { console.error(`ABORT: ${day} is today or past — never writable, even with --override-freeze.`); process.exit(1); }
  console.log('FREEZE OVERRIDDEN by explicit user approval — emails for this day already went out.');
}

// 1. Snapshot the day
const rr0 = await orGet(`get_routes?date=${day}`);
if (rr0.success === false) { console.error('get_routes failed:', JSON.stringify(rr0).slice(0, 200)); process.exit(1); }
const before = {}; // orderNo -> {driver, driverSerial, hm}
for (const rt of rr0.routes || []) {
  for (const s of rt.stops || []) {
    const onum = String(s.orderNo || '');
    if (!/^\d+-\w+$/.test(onum)) continue;
    before[onum] = { driver: rt.driverName, driverSerial: rt.driverSerial || null, hm: (s.scheduledAtDt || '').slice(11, 16) };
  }
}
const driverOrders = Object.keys(before).filter(o => before[o].driver === driverName);
if (!driverOrders.length) { console.error(`ABORT: no scheduled stops for ${driverName} on ${day}.`); process.exit(1); }
console.log(`${Object.keys(before).length} own stops on the day; ${driverOrders.length} on ${driverName} (currently ${driverOrders.map(o => before[o].hm).sort()[0]} first).`);

// 2. Read existing timeWindows on the driver's orders so promised windows are merged, not lost
const go = await orCall('get_orders', { orders: driverOrders.map(orderNo => ({ orderNo })) });
const existingTW = {};
for (const o of go.orders || []) {
  const data = o.data || o;
  if (data.orderNo && Array.isArray(data.timeWindows) && data.timeWindows.length) existingTW[data.orderNo] = data.timeWindows;
}

// 3. Lock all stops to day+tech; the driver's orders additionally get the late-start window
let lockFails = 0;
const conflicts = [];
for (const [orderNo, s] of Object.entries(before)) {
  const upd = { operation: 'UPDATE', orderNo, date: day, allowedDates: { from: day, to: day }, priority: 'M' };
  if (s.driverSerial) upd.assignedTo = { serial: s.driverSerial };
  if (s.driver === driverName) {
    const tw = (existingTW[orderNo] || [{ twFrom: earliestStart, twTo: '18:00' }])[0];
    let from = tw.twFrom && tw.twFrom > earliestStart ? tw.twFrom : earliestStart;
    let to = tw.twTo || '18:00';
    if (to <= earliestStart) { conflicts.push(`${orderNo} promised ${tw.twFrom}-${tw.twTo}, impossible after ${earliestStart}`); to = '18:00'; }
    upd.timeWindows = [{ twFrom: from, twTo: to }];
  }
  const r = await orCall('create_order', upd);
  if (!r.success) { lockFails++; console.log(`  lock failed ${orderNo}: ${JSON.stringify(r).slice(0, 120)}`); }
  await sleep(250);
}
if (conflicts.length) console.log(`WARN — promised windows that cannot survive the late start (customer comms needed):\n  ${conflicts.join('\n  ')}`);
if (lockFails > 0) { console.error(`ABORT: ${lockFails} lock failures — day NOT re-planned.`); process.exit(1); }
console.log(`Locked ${Object.keys(before).length} stops (${driverOrders.length} windowed >= ${earliestStart}).`);

// 4. Re-plan the day
console.log('Re-planning (balancing OFF)…');
const sp = await orCall('start_planning', { dateRange: { from: day, to: day }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' });
if (!sp.success) { console.error('ABORT: start_planning failed: ' + JSON.stringify(sp).slice(0, 150)); process.exit(1); }
let done = false;
for (let i = 0; i < 60; i++) {
  await sleep(10000);
  const st = await orGet(`get_planning_status?planningId=${sp.planningId}`);
  const status = (st.status || '').toString();
  if (/^F/i.test(status)) { done = true; break; }
  if (/^E/i.test(status)) { console.error('ABORT: planning error: ' + JSON.stringify(st).slice(0, 150)); process.exit(1); }
}
if (!done) { console.error('ABORT: planning timeout (10 min).'); process.exit(1); }

// 5. Verify: nothing lost, no tech moves, driver's first stop respects the late start
const rr1 = await orGet(`get_routes?date=${day}`);
const after = {};
for (const rt of rr1.routes || []) {
  for (const s of rt.stops || []) {
    const onum = String(s.orderNo || '');
    if (!/^\d+-\w+$/.test(onum)) continue;
    after[onum] = { driver: rt.driverName, hm: (s.scheduledAtDt || '').slice(11, 16), scheduledAtDt: s.scheduledAtDt };
  }
}
const lost = Object.keys(before).filter(o => !after[o]);
const moved = Object.keys(before).filter(o => after[o] && after[o].driver !== before[o].driver);
if (lost.length || moved.length) {
  console.error(`ABORT VERIFY: ${lost.length} lost (${lost.join(',')}), ${moved.length} tech-moved (${moved.join(',')}) — NO Jobber writes. If lost stops are on ${driverName}, the day may not fit after ${earliestStart}; decide what moves.`);
  process.exit(1);
}
const driverFirst = driverOrders.map(o => after[o].hm).sort()[0];
if (driverFirst < earliestStart) { console.error(`ABORT VERIFY: ${driverName}'s first stop is ${driverFirst}, before ${earliestStart}. NO Jobber writes.`); process.exit(1); }
console.log(`${driverName}'s route now ${driverFirst} → ${driverOrders.map(o => after[o].hm).sort().slice(-1)[0]} (${driverOrders.length} stops).`);

// 6. Write changed times to Jobber
const visits = await fetchVisits(`${addDaysPT(day, -1)}T23:59:59-07:00`, `${day}T23:59:59-07:00`);
const active = visits.filter(v => !v.isComplete && v.job && v.job.jobNumber != null);
const jVisById = {};
for (const vis of active) jVisById[String(vis.job.jobNumber) + '-' + visitNumOf(vis)] = vis;
let ok = 0, failed = 0;
const writes = [];
for (const [orderNo, ns] of Object.entries(after)) {
  const vis = jVisById[orderNo];
  if (!vis || !ns.scheduledAtDt) continue;
  const cur = toPT(vis.startAt);
  const planTime = ns.scheduledAtDt.slice(11, 19);
  if (cur.hm === ns.hm && cur.date === day) continue;
  const endT = new Date(`${day}T${planTime}-07:00`).getTime() + 3 * 3600000;
  const endPT = new Date(endT).toLocaleString('sv-SE', { timeZone: TZ });
  const op = `mutation { visitEditSchedule(id: "${vis.id}", input: { startAt: { date: "${day}", time: "${planTime}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`;
  const r = await jgql(op, {});
  const ue = [];
  if (r.errors) ue.push(...r.errors.map(e => e.message));
  const d = r.data || {};
  for (const k of Object.keys(d)) if (d[k] && d[k].userErrors) ue.push(...d[k].userErrors.map(e => e.message));
  if (ue.length) { failed++; console.log(`  write failed ${orderNo}: ${ue.join('; ')}`); }
  else { ok++; writes.push({ orderNo, from: `${cur.date} ${cur.hm}`, to: `${day} ${ns.hm}`, driver: ns.driver }); }
  await sleep(350);
}
console.log(`Jobber write-back: ${ok} ok, ${failed} failed.`);
for (const w of writes.filter(x => x.driver === driverName).sort((a, b) => (a.to < b.to ? -1 : 1))) console.log(`  ${w.orderNo}: ${w.from} -> ${w.to}`);

const report = { ranAt: new Date().toISOString(), kind: 'late-start-replan', day, driverName, earliestStart, conflicts, driverStops: driverOrders.length, driverFirst, writes, failed };
fs.mkdirSync(RUNS_DIR, { recursive: true });
const out = path.join(RUNS_DIR, `late-start-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`Report saved: ${out}\nLATE-START REPLAN DONE.`);
process.exit(failed ? 1 : 0);
