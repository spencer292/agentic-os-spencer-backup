#!/usr/bin/env node
// MOVE-TECH REPLAN — hand ONE order to a different tech on the SAME day, re-plan that day,
// and write the new tech + new times back to Jobber.
//
// Born 2026-08-03: #8282 Ryan Belmont (SET), 320 26th Ave E Seattle 98112, was pushed to Cory by the
// 08-03 overflow rebalancer (10 min detour on his south-Seattle Tuesday). Spencer moved it back to
// Alias, whose Tuesday already runs north/central Seattle. eod-reroute.mjs could not do it — that one
// re-times WITHIN a tech and aborts on any cross-tech move.
//
// Differs from rebalance-overflow.mjs (report-only, picks the receiving tech itself) and from
// lock-techs-to-jobber.mjs (whole-week assert). This is: one order, one named tech, one day.
//
// Usage: node move-tech-replan.mjs dry|live <date> <orderNo> "<New Tech>" [--override-freeze]
//   e.g. node move-tech-replan.mjs dry 2026-08-04 8282-2273478814 "Alias Franks"
//
// Guards, in order — any failure means ZERO Jobber writes:
//   * email freeze (day-before arrival-window emails; --override-freeze needs the user's explicit OK)
//   * target must be on <date> and NOT already on <New Tech>; <New Tech> must have a route that day
//   * every other stop locked to its current day+tech before the re-plan
//   * verify: nothing lost, target landed on <New Tech>, no OTHER stop changed tech
// Never deletes. Writes a report to drift-runs/.

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
function gqlErrors(r) {
  const ue = [];
  if (r.errors) ue.push(...r.errors.map(e => e.message));
  const d = r.data || {};
  for (const k of Object.keys(d)) if (d[k] && d[k].userErrors) ue.push(...d[k].userErrors.map(e => e.message));
  return ue;
}

async function orCall(endpoint, body, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
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
// Same cutoff as eod-reroute / late-start-replan: a day is frozen once its arrival-window
// emails have gone out (2pm the day before), and today/past is never writable.
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
    const q = `query($after: String) { visits(first: 25, after: $after, filter: { startAt: { after: "${afterIso}", before: "${beforeIso}" } }) { nodes { id title startAt endAt isComplete assignedUsers(first: 4) { nodes { id name { full } } } job { jobNumber } } pageInfo { hasNextPage endCursor } } }`;
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
const [mode, day, targetOrderNo, newDriver] = argv.filter((a) => !a.startsWith('--'));
if (!['dry', 'live'].includes(mode) || !day || !targetOrderNo || !newDriver) {
  console.log('Usage: move-tech-replan.mjs dry|live <date> <orderNo> "<New Tech>" [--override-freeze]');
  process.exit(1);
}
console.log(`MOVE-TECH REPLAN (${mode}) ${ptNow()} PT — ${targetOrderNo} → ${newDriver} on ${day}`);

// 1. Snapshot the day
const rr0 = await orGet(`get_routes?date=${day}`);
if (rr0.success === false) { console.error('get_routes failed:', JSON.stringify(rr0).slice(0, 200)); process.exit(1); }
const before = {};              // orderNo -> {driver, driverSerial, hm}
const serialOf = {};            // driverName -> serial
const countBefore = {};
for (const rt of rr0.routes || []) {
  if (rt.driverSerial) serialOf[rt.driverName] = rt.driverSerial;
  countBefore[rt.driverName] = 0;
  for (const s of rt.stops || []) {
    const onum = String(s.orderNo || '');
    if (!/^\d+-\w+$/.test(onum)) continue;
    before[onum] = { driver: rt.driverName, driverSerial: rt.driverSerial || null, hm: (s.scheduledAtDt || '').slice(11, 16) };
    countBefore[rt.driverName]++;
  }
}
const tgt = before[targetOrderNo];
if (!tgt) { console.error(`ABORT: ${targetOrderNo} not scheduled on ${day}.`); process.exit(1); }
if (tgt.driver === newDriver) { console.error(`ABORT: ${targetOrderNo} is already on ${newDriver}.`); process.exit(1); }
if (!serialOf[newDriver]) { console.error(`ABORT: ${newDriver} has no route (and no driverSerial) on ${day}.`); process.exit(1); }
console.log(`Target currently ${tgt.hm} on ${tgt.driver}. ${Object.keys(before).length} own stops on the day.`);
console.log('Load before: ' + Object.entries(countBefore).map(([d, n]) => `${d.split(' ')[0]} ${n}`).join(' | '));

if (mode === 'dry') {
  console.log(`\nDRY — would move ${targetOrderNo} from ${tgt.driver} to ${newDriver}, re-plan ${day} (balancing OFF),`);
  console.log('      then write changed times + the new tech to Jobber. Nothing written.');
  console.log(`Email freeze for ${day}: ${emailCutoffOk(day) ? 'OK (still writable)' : 'FROZEN — live needs --override-freeze'}`);
  process.exit(0);
}

if (!emailCutoffOk(day)) {
  if (!overrideFreeze) { console.error(`ABORT: ${day} is frozen (arrival-window emails already sent) — no writes. (--override-freeze, only with the user's explicit OK)`); process.exit(1); }
  if (day <= ptNow().slice(0, 10)) { console.error(`ABORT: ${day} is today or past — never writable, even with --override-freeze.`); process.exit(1); }
  console.log('FREEZE OVERRIDDEN by explicit user approval — arrival-window emails for this day already went out.');
}

// 2. Lock every stop to day + its CURRENT tech; the target is pointed at the new tech.
let lockFails = 0;
for (const [orderNo, s] of Object.entries(before)) {
  const driverSerial = orderNo === targetOrderNo ? serialOf[newDriver] : s.driverSerial;
  const upd = { operation: 'UPDATE', orderNo, date: day, allowedDates: { from: day, to: day }, priority: 'M' };
  if (driverSerial) upd.assignedTo = { serial: driverSerial };
  const r = await orCall('create_order', upd);
  if (!r.success) { lockFails++; console.log(`  lock failed ${orderNo}: ${JSON.stringify(r).slice(0, 120)}`); }
  await sleep(250);
}
if (lockFails > 0) { console.error(`ABORT: ${lockFails} lock failures — day NOT re-planned.`); process.exit(1); }
console.log(`Locked ${Object.keys(before).length} stops (target re-pointed at ${newDriver}).`);

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

// 4. Verify: nothing lost, target on the new tech, nobody ELSE moved tech
const rr1 = await orGet(`get_routes?date=${day}`);
const after = {};
const countAfter = {};
for (const rt of rr1.routes || []) {
  countAfter[rt.driverName] = 0;
  for (const s of rt.stops || []) {
    const onum = String(s.orderNo || '');
    if (!/^\d+-\w+$/.test(onum)) continue;
    after[onum] = { driver: rt.driverName, hm: (s.scheduledAtDt || '').slice(11, 16), scheduledAtDt: s.scheduledAtDt, stopNumber: s.stopNumber };
    countAfter[rt.driverName]++;
  }
}
const lost = Object.keys(before).filter(o => !after[o]);
const strayed = Object.keys(before).filter(o => o !== targetOrderNo && after[o] && after[o].driver !== before[o].driver);
if (lost.length || strayed.length) {
  console.error(`ABORT VERIFY: ${lost.length} lost (${lost.slice(0, 8).join(',')}), ${strayed.length} tech-moved (${strayed.slice(0, 8).join(',')}) — NO Jobber writes. Review in OR.`);
  process.exit(1);
}
if (!after[targetOrderNo]) { console.error('ABORT VERIFY: target came back unscheduled — NO Jobber writes.'); process.exit(1); }
if (after[targetOrderNo].driver !== newDriver) { console.error(`ABORT VERIFY: target landed on ${after[targetOrderNo].driver}, not ${newDriver} — NO Jobber writes.`); process.exit(1); }
console.log(`Verified: target now stop ${after[targetOrderNo].stopNumber} at ${after[targetOrderNo].hm} on ${newDriver}.`);
console.log('Load after:  ' + Object.entries(countAfter).map(([d, n]) => `${d.split(' ')[0]} ${n}`).join(' | '));

// 5. Jobber write-back — changed times for the whole day, plus the target's new tech
const visits = await fetchVisits(`${addDaysPT(day, -1)}T23:59:59-07:00`, `${day}T23:59:59-07:00`);
const active = visits.filter(v => !v.isComplete && v.job && v.job.jobNumber != null);
const jVisById = {};
for (const vis of active) jVisById[String(vis.job.jobNumber) + '-' + visitNumOf(vis)] = vis;

// tech first, so a later time-write failure still leaves the visit on the right person
const targetVisit = jVisById[targetOrderNo];
let techWrite = 'skipped (visit not found in Jobber)';
if (targetVisit) {
  const u = await jgql('query { users(first:100){ nodes{ id name{ full } } } }', {});
  const USERS = {};
  for (const x of u.data.users.nodes) if (x.name?.full) USERS[x.name.full.trim().toLowerCase()] = x.id;
  const uid = USERS[newDriver.trim().toLowerCase()];
  if (!uid) { console.error(`ABORT: no Jobber user named "${newDriver}" — times NOT written.`); process.exit(1); }
  const r = await jgql(`mutation($id:EncodedId!,$input:VisitEditAssignedUsersInput!){ visitEditAssignedUsers(visitId:$id, input:$input){ userErrors{ message } } }`,
    { id: targetVisit.id, input: { assignedUserIds: [uid] } });
  const ue = gqlErrors(r);
  techWrite = ue.length ? 'FAIL ' + ue.join('; ') : `ok → ${newDriver}`;
  console.log(`Jobber tech write: ${techWrite}`);
  if (ue.length) { console.error('ABORT: tech write failed — times NOT written.'); process.exit(1); }
}

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
  const ue = gqlErrors(r);
  if (ue.length) { failed++; console.log(`  write failed ${orderNo}: ${ue.join('; ')}`); }
  else { ok++; writes.push({ orderNo, from: `${cur.date} ${cur.hm}`, to: `${day} ${ns.hm}`, driver: ns.driver }); }
  await sleep(350);
}
console.log(`Jobber time write-back: ${ok} ok, ${failed} failed (${Object.keys(after).length - ok - failed} unchanged).`);

const report = {
  ranAt: new Date().toISOString(), kind: 'move-tech-replan', day, targetOrderNo,
  from: tgt, to: after[targetOrderNo], newDriver, techWrite,
  countBefore, countAfter, writes, failed, freezeOverridden: !emailCutoffOk(day),
};
fs.mkdirSync(RUNS_DIR, { recursive: true });
const out = path.join(RUNS_DIR, `move-tech-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`Report saved: ${out}\nMOVE-TECH REPLAN DONE.`);
process.exit(failed ? 1 : 0);
