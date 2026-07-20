#!/usr/bin/env node
// EOD REROUTE — pin one order to the end of its driver's day via an OR time window,
// re-plan that day (everyone locked to day+tech), verify, write times to Jobber.
// Born 07-14: Jennifer Cramer (EOD) #7697 was slotted 09:02 on Cammeron's 07-16 route.
// Policy: real promises = OR timeWindows only (07-12). The window persists on the order,
// so future drift-fix re-plans keep honoring it.
//
// Usage: node eod-reroute.mjs <date> <orderNo> <driverName> [twFrom] [twTo]
//   e.g. node eod-reroute.mjs 2026-07-16 7697-2047351647 "Cammeron Anderson" 14:30 17:30
// Guards: email freeze; order must already be on that date+driver; all other stops locked
// to day+tech before re-plan; verify no stop lost/moved tech AND target is driver's last
// stop before any Jobber write. Never deletes.

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
const [day, targetOrderNo, driverName, twFrom = '14:30', twTo = '17:30'] = argv.filter((a) => a !== '--override-freeze');
if (!day || !targetOrderNo || !driverName) {
  console.log('Usage: eod-reroute.mjs <date> <orderNo> <driverName> [twFrom] [twTo] [--override-freeze]');
  process.exit(1);
}
console.log(`EOD reroute ${ptNow()} PT — ${targetOrderNo} → end of ${driverName}'s ${day} (window ${twFrom}-${twTo})`);
if (!emailCutoffOk(day)) {
  if (!overrideFreeze) { console.error(`ABORT: ${day} is frozen (email cutoff) — no writes. (--override-freeze to force, only with the user's explicit OK)`); process.exit(1); }
  const todayPT = ptNow().slice(0, 10);
  if (day <= todayPT) { console.error(`ABORT: ${day} is today or past — never writable, even with --override-freeze.`); process.exit(1); }
  console.log('FREEZE OVERRIDDEN by explicit user approval — emails for this day already went out.');
}

// 1. Snapshot the day
const rr0 = await orGet(`get_routes?date=${day}`);
if (rr0.success === false) { console.error('get_routes failed:', JSON.stringify(rr0).slice(0, 200)); process.exit(1); }
const before = {}; // orderNo -> {driver, driverSerial, hm}
let targetSerial = null;
for (const rt of rr0.routes || []) {
  for (const s of rt.stops || []) {
    const onum = String(s.orderNo || '');
    if (!/^\d+-\w+$/.test(onum)) continue;
    before[onum] = { driver: rt.driverName, driverSerial: rt.driverSerial || null, hm: (s.scheduledAtDt || '').slice(11, 16) };
  }
  if (rt.driverName === driverName) targetSerial = rt.driverSerial || null;
}
const tgt = before[targetOrderNo];
if (!tgt) { console.error(`ABORT: ${targetOrderNo} not scheduled on ${day}.`); process.exit(1); }
if (tgt.driver !== driverName) { console.error(`ABORT: ${targetOrderNo} is on ${tgt.driver}, not ${driverName}.`); process.exit(1); }
console.log(`Target currently at ${tgt.hm} on ${tgt.driver}. ${Object.keys(before).length} own stops on the day.`);

// 2. Lock everyone to day+tech; target additionally gets the EOD time window
let lockFails = 0;
for (const [orderNo, s] of Object.entries(before)) {
  const upd = { operation: 'UPDATE', orderNo, date: day, allowedDates: { from: day, to: day }, priority: 'M' };
  if (s.driverSerial) upd.assignedTo = { serial: s.driverSerial };
  if (orderNo === targetOrderNo) upd.timeWindows = [{ twFrom, twTo }];
  const r = await orCall('create_order', upd);
  if (!r.success) { lockFails++; console.log(`  lock failed ${orderNo}: ${JSON.stringify(r).slice(0, 120)}`); }
  await sleep(250);
}
if (lockFails > 0) { console.error(`ABORT: ${lockFails} lock failures — day NOT re-planned.`); process.exit(1); }
console.log(`Locked ${Object.keys(before).length} stops (target windowed ${twFrom}-${twTo}).`);

// 3. Re-plan the day
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

// 4. Verify: nothing lost, no tech moves, target scheduled AND last on its driver's route
const rr1 = await orGet(`get_routes?date=${day}`);
const after = {};
const lastByDriver = {};
for (const rt of rr1.routes || []) {
  let last = null;
  for (const s of rt.stops || []) {
    const onum = String(s.orderNo || '');
    if (!/^\d+-\w+$/.test(onum)) continue;
    after[onum] = { driver: rt.driverName, hm: (s.scheduledAtDt || '').slice(11, 16), scheduledAtDt: s.scheduledAtDt };
    last = onum;
  }
  lastByDriver[rt.driverName] = last;
}
const lost = Object.keys(before).filter(o => !after[o]);
const moved = Object.keys(before).filter(o => after[o] && after[o].driver !== before[o].driver);
if (lost.length || moved.length) {
  console.error(`ABORT VERIFY: ${lost.length} lost (${lost.join(',')}), ${moved.length} tech-moved (${moved.join(',')}) — NO Jobber writes. Review in OR.`);
  process.exit(1);
}
if (!after[targetOrderNo]) { console.error('ABORT VERIFY: target came back unscheduled — window may not fit shift. NO Jobber writes.'); process.exit(1); }
const isLast = lastByDriver[driverName] === targetOrderNo;
console.log(`Target now at ${after[targetOrderNo].hm} on ${after[targetOrderNo].driver} — ${isLast ? 'LAST stop ✓' : `NOT last (last is ${lastByDriver[driverName]})`}`);
if (!isLast) { console.error('ABORT: target is not the last stop — tighten the window and rerun. NO Jobber writes.'); process.exit(1); }

// 5. Write changed times to Jobber
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

const report = { ranAt: new Date().toISOString(), kind: 'eod-reroute', day, targetOrderNo, driverName, twFrom, twTo, before: tgt, after: after[targetOrderNo], isLast, writes, failed };
fs.mkdirSync(RUNS_DIR, { recursive: true });
const out = path.join(RUNS_DIR, `eod-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`Report saved: ${out}\nEOD REROUTE DONE.`);
process.exit(failed ? 1 : 0);
