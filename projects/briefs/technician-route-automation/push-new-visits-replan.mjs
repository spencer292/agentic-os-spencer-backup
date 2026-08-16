#!/usr/bin/env node
// PUSH NEW VISITS + REPLAN — pick up Jobber visits booked AFTER a day was planned, create their
// OptimoRoute orders, re-sequence that day, and write the new times back to Jobber.
//
// Born 2026-08-03: #8302 Spencer Jacobs (SET) was booked at 15:38 for the next day, after push-week
// had already built Tuesday. It sat in Jobber as an anytime visit with no OR order at all, so it
// would not have appeared on Alias' route — invisible work.
//
// push-week.mjs is the whole-week equivalent, but it runs lockTechs=false and rewrites allowedDates
// for every order in the window, which re-opens tech assignment for the entire week. This one
// touches ONLY the visits that have no order yet; every already-planned stop is locked to the day
// and tech it currently has, so the re-plan can re-sequence but never reassign.
//
// Usage: node push-new-visits-replan.mjs dry|live <date> [--override-freeze]
//   e.g. node push-new-visits-replan.mjs dry 2026-08-04
//
// Guards: email freeze (--override-freeze needs the user's explicit OK); new orders inherit the
// Jobber tech where that tech is driving that day; verify nothing lost and no already-planned stop
// changed tech before ANY Jobber write. Never deletes.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration, serviceTimeSummary } from './service-time.mjs';
console.log(serviceTimeSummary());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const RUNS_DIR = path.join(__dirname, 'drift-runs');
const TZ = 'America/Los_Angeles';
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

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
async function orCall(endpoint, body, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) {
    await sleep(1500 * (attempt + 1)); return orCall(endpoint, body, attempt + 1);
  }
  return d;
}
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) {
    await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1);
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
  const nowStr = ptNow(); const today = nowStr.slice(0, 10); const hour = Number(nowStr.slice(11, 13));
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

// ---------- main ----------
const argv = process.argv.slice(2);
const overrideFreeze = argv.includes('--override-freeze');
const positional = argv.filter(a => !a.startsWith('--'));
const argOf = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const mode = positional[0];
// Accept either a single positional <date> or --from/--to. A range sweeps every weekday in it and
// re-plans ONLY the days that actually gained an order — a day with nothing new is never re-planned,
// because re-planning re-times stops for no reason and (past the cutoff) invalidates emailed windows.
let FROM = argOf('from', positional[1]);
let TO = argOf('to', FROM);
if (!['dry', 'live'].includes(mode) || !FROM) {
  console.log('Usage: push-new-visits-replan.mjs dry|live <date> [--override-freeze]');
  console.log('       push-new-visits-replan.mjs dry|live --from=YYYY-MM-DD --to=YYYY-MM-DD [--override-freeze]');
  process.exit(1);
}
const DAYS = [];
for (let d = FROM; d <= TO; d = addDaysPT(d, 1)) {
  const wd = new Date(d + 'T12:00:00Z').getUTCDay();
  if (wd >= 1 && wd <= 5) DAYS.push(d);   // weekdays only — Got Moles does not run Sat/Sun
}
console.log(`PUSH NEW VISITS + REPLAN (${mode}) ${ptNow()} PT — ${DAYS.length} day(s): ${DAYS.join(', ')}`);

const summary = [];
for (const day of DAYS) {
  console.log(`\n${'='.repeat(70)}\n${day} (${DOW[new Date(day + 'T12:00:00Z').getUTCDay()]})`);
  const res = await processDay(day);
  summary.push(res);
}
console.log(`\n${'='.repeat(70)}\nSUMMARY`);
for (const s of summary) {
  console.log(`  ${s.day}  ${String(s.created).padStart(2)} new order(s)  ${String(s.written).padStart(3)} time write(s)  ${s.note}`);
}
const totalNew = summary.reduce((a, s) => a + s.created, 0);
const anyFailed = summary.some(s => s.failed);
console.log(`\n${totalNew} new order(s) pushed across ${DAYS.length} day(s).`);
process.exit(anyFailed ? 1 : 0);

async function processDay(day) {

// 1. Current OR plan for the day
const rr0 = await orGet(`get_routes?date=${day}`);
if (rr0.success === false) { console.error('get_routes failed:', JSON.stringify(rr0).slice(0, 200)); return { day, created: 0, written: 0, failed: true, note: 'get_routes failed' }; }
const before = {}, serialOf = {};
for (const rt of rr0.routes || []) {
  if (rt.driverSerial) serialOf[rt.driverName] = rt.driverSerial;
  for (const s of rt.stops || []) {
    const no = String(s.orderNo || '');
    if (!/^\d+-\w+$/.test(no)) continue;
    before[no] = { driver: rt.driverName, driverSerial: rt.driverSerial || null, hm: (s.scheduledAtDt || '').slice(11, 16) };
  }
}
console.log(`OptimoRoute has ${Object.keys(before).length} stops on ${day}.`);

// 2. Jobber visits for the day
const visits = [];
let cursor = null;
for (;;) {
  const q = `query($after:String){ visits(first:100, after:$after, filter:{ startAt:{ after:"${addDaysPT(day, -1)}T23:59:59-07:00", before:"${day}T23:59:59-07:00" } }){ nodes{ id title startAt endAt isComplete assignedUsers(first:4){ nodes{ name{ full } } } job{ jobNumber startAt } property{ address{ street city province postalCode } } } pageInfo{ hasNextPage endCursor } } }`;
  const r = await jgql(q, { after: cursor });
  if (r.errors) throw new Error('Jobber: ' + JSON.stringify(r.errors).slice(0, 300));
  visits.push(...r.data.visits.nodes);
  if (!r.data.visits.pageInfo.hasNextPage) break;
  cursor = r.data.visits.pageInfo.endCursor;
  await sleep(400);
}
console.log(`Jobber has ${visits.length} visits on ${day}.`);

// 3. Which have no order?
const newOrders = [], unroutable = [];
for (const v of visits) {
  if (v.isComplete || !v.job?.jobNumber) continue;
  const orderNo = `${v.job.jobNumber}-${visitNumOf(v)}`;
  if (before[orderNo]) continue;
  const a = v.property?.address;
  if (!a || !a.street) { unroutable.push({ orderNo, why: 'no address', title: v.title }); continue; }
  const isSet = v.job.startAt ? toPT(v.job.startAt).date === day : false;
  const tech = (v.assignedUsers?.nodes || [])[0]?.name?.full || null;
  const serial = tech && serialOf[tech] ? serialOf[tech] : null;
  newOrders.push({
    orderNo, visitId: v.id, title: v.title, isSet, tech, serial,
    zip: (a.postalCode || '').slice(0, 5),
    order: {
      operation: 'SYNC', orderNo, type: 'T', date: day,
      duration: serviceDuration(tech, isSet, v.job.jobNumber), priority: 'M',
      location: {
        address: `${a.street}, ${a.city}, ${a.province || 'WA'} ${a.postalCode || ''}`,
        locationName: ((v.title || 'Unknown').trim().replace(/\s+/g, ' ') + ' · #' + v.job.jobNumber).slice(0, 60),
        acceptPartialMatch: true, acceptMultipleResults: true,
      },
      allowedDates: { from: day, to: day },
      allowedWeekdays: [DOW[new Date(day + 'T12:00:00Z').getUTCDay()]],
      ...(serial ? { assignedTo: { serial } } : {}),
      notes: `Jobber job ${v.job.jobNumber}${isSet ? ' (SET)' : ''} — late booking, pushed ${ptNow().slice(0, 16)}`,
    },
  });
}
console.log(`\n${newOrders.length} visit(s) with no OptimoRoute order:`);
for (const n of newOrders) console.log(`  ${n.orderNo.padEnd(20)} ${(n.title || '').slice(0, 28).padEnd(29)} ${n.zip} ${n.isSet ? 'SET 20min' : 'chk 10min'}  tech ${n.tech || '(none)'}${n.serial ? '' : ' [no serial — optimizer will place]'}`);
if (unroutable.length) { console.log('\nCannot route:'); for (const u of unroutable) console.log(`  ${u.orderNo} ${u.title} — ${u.why}`); }

// A day with nothing new is left completely alone — no lock, no re-plan, no writes.
if (!newOrders.length) { console.log('Nothing new to push — day untouched.'); return { day, created: 0, written: 0, failed: false, note: 'nothing new' }; }
if (mode === 'dry') {
  console.log(`\nDRY — would create ${newOrders.length} order(s), lock ${Object.keys(before).length} existing stops to day+tech, re-plan ${day}, write changed times back to Jobber.`);
  console.log(`Email freeze for ${day}: ${emailCutoffOk(day) ? 'OK (still writable)' : 'FROZEN — live needs --override-freeze'}`);
  return { day, created: newOrders.length, written: 0, failed: false, note: `dry — ${emailCutoffOk(day) ? 'writable' : 'FROZEN'}` };
}
if (!emailCutoffOk(day)) {
  // Per-day, not whole-run: one frozen day must not stop the other days from being swept.
  if (!overrideFreeze) { console.error(`SKIPPED: ${day} is frozen (arrival-window emails already sent). Re-run with --override-freeze to include it.`); return { day, created: 0, written: 0, failed: false, note: 'SKIPPED — frozen' }; }
  if (day <= ptNow().slice(0, 10)) { console.error(`SKIPPED: ${day} is today or past — never writable, even with --override-freeze.`); return { day, created: 0, written: 0, failed: false, note: 'SKIPPED — today/past' }; }
  console.log('FREEZE OVERRIDDEN by explicit user approval — arrival-window emails for this day already went out.');
}

// 4. Create the new orders
let createFails = 0;
for (const n of newOrders) {
  const r = await orCall('create_order', n.order);
  if (!r.success) { createFails++; console.log(`  create FAILED ${n.orderNo}: ${JSON.stringify(r).slice(0, 200)}`); }
  else console.log(`  created ${n.orderNo}${r.geocodingIssue ? ' (GEOCODING ISSUE — check address)' : ''}`);
  await sleep(300);
}
if (createFails) { console.error(`ABORT ${day}: ${createFails} order(s) failed to create — day NOT re-planned.`); return { day, created: 0, written: 0, failed: true, note: 'create failed' }; }

// 5. Lock every already-planned stop to its current day+tech
let lockFails = 0;
for (const [orderNo, s] of Object.entries(before)) {
  const upd = { operation: 'UPDATE', orderNo, date: day, allowedDates: { from: day, to: day }, priority: 'M' };
  if (s.driverSerial) upd.assignedTo = { serial: s.driverSerial };
  const r = await orCall('create_order', upd);
  if (!r.success) { lockFails++; console.log(`  lock failed ${orderNo}: ${JSON.stringify(r).slice(0, 120)}`); }
  await sleep(250);
}
if (lockFails) { console.error(`ABORT ${day}: ${lockFails} lock failures — day NOT re-planned.`); return { day, created: newOrders.length, written: 0, failed: true, note: 'lock failed' }; }
console.log(`Locked ${Object.keys(before).length} existing stops to day+tech.`);

// 6. Re-plan
console.log('Re-planning (balancing OFF)…');
const sp = await orCall('start_planning', { dateRange: { from: day, to: day }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' });
if (!sp.success) { console.error('ABORT: start_planning failed: ' + JSON.stringify(sp).slice(0, 150)); return { day, created: newOrders.length, written: 0, failed: true, note: 'start_planning failed' }; }
let done = false, planErr = null;
for (let i = 0; i < 60; i++) {
  await sleep(10000);
  const st = await orGet(`get_planning_status?planningId=${sp.planningId}`);
  const status = (st.status || '').toString();
  if (/^F/i.test(status)) { done = true; break; }
  if (/^E/i.test(status)) { planErr = JSON.stringify(st).slice(0, 150); break; }
}
if (planErr) { console.error('ABORT: planning error: ' + planErr); return { day, created: newOrders.length, written: 0, failed: true, note: 'planning error' }; }
if (!done) { console.error('ABORT: planning timeout (10 min).'); return { day, created: newOrders.length, written: 0, failed: true, note: 'planning timeout' }; }

// 7. Verify
const rr1 = await orGet(`get_routes?date=${day}`);
const after = {};
for (const rt of rr1.routes || []) for (const s of rt.stops || []) {
  const no = String(s.orderNo || '');
  if (!/^\d+-\w+$/.test(no)) continue;
  after[no] = { driver: rt.driverName, hm: (s.scheduledAtDt || '').slice(11, 16), scheduledAtDt: s.scheduledAtDt, stopNumber: s.stopNumber };
}
const lost = Object.keys(before).filter(o => !after[o]);
const strayed = Object.keys(before).filter(o => after[o] && after[o].driver !== before[o].driver);
const unplaced = newOrders.filter(n => !after[n.orderNo]);
if (lost.length || strayed.length) {
  console.error(`ABORT VERIFY ${day}: ${lost.length} lost (${lost.slice(0, 8).join(',')}), ${strayed.length} tech-moved (${strayed.slice(0, 8).join(',')}) — NO Jobber writes.`);
  return { day, created: newOrders.length, written: 0, failed: true, note: 'verify failed — lost/tech-moved' };
}
if (unplaced.length) {
  console.error(`ABORT VERIFY ${day}: new order(s) came back unscheduled: ${unplaced.map(u => u.orderNo).join(', ')} — day may be full. NO Jobber writes.`);
  return { day, created: newOrders.length, written: 0, failed: true, note: 'verify failed — unplaced' };
}
for (const n of newOrders) console.log(`New stop placed: ${n.orderNo} → ${after[n.orderNo].driver} stop ${after[n.orderNo].stopNumber} at ${after[n.orderNo].hm}`);

// 8. Write changed times back to Jobber
const jVisById = {};
for (const v of visits) if (!v.isComplete && v.job?.jobNumber) jVisById[`${v.job.jobNumber}-${visitNumOf(v)}`] = v;
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
  else { ok++; writes.push({ orderNo, from: `${cur.date} ${cur.hm}`, to: `${day} ${ns.hm}`, driver: ns.driver, isNew: newOrders.some(n => n.orderNo === orderNo) }); }
  await sleep(350);
}
console.log(`\nJobber time write-back: ${ok} ok, ${failed} failed (${Object.keys(after).length - ok - failed} unchanged).`);

const report = {
  ranAt: new Date().toISOString(), kind: 'push-new-visits-replan', day,
  created: newOrders.map(n => ({ orderNo: n.orderNo, title: n.title, zip: n.zip, tech: n.tech, isSet: n.isSet, placed: after[n.orderNo] })),
  stopsBefore: Object.keys(before).length, stopsAfter: Object.keys(after).length,
  writes, failed, freezeOverridden: !emailCutoffOk(day),
};
fs.mkdirSync(RUNS_DIR, { recursive: true });
const out = path.join(RUNS_DIR, `push-new-${day}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`Report saved: ${out}`);
return { day, created: newOrders.length, written: ok, failed: failed > 0, note: `${ok} re-timed${failed ? `, ${failed} FAILED` : ''}` };
}
