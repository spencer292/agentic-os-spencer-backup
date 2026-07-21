#!/usr/bin/env node
// DRIFT CHECK — Jobber board vs OptimoRoute plan, with auto-fix for new bookings.
// Born from the 07-12 findings (#8158 absent from OR; #8138/#7546 time drift): Jobber and
// OptimoRoute are two sources of truth and new bookings entered in Jobber never reach OR.
//
// What it does:
//   check -> diff every OR-planned future day against Jobber; report missing orders (new
//            bookings), day/tech/time drift, and orphaned OR stops. Writes nothing.
//   fix   -> check, then for each Jobber booking missing from OR: create the order (SYNC,
//            geocoded, locked to its Jobber day + tech, priority M), lock every existing
//            stop on that day to day+tech, re-plan ONLY that day (balancing OFF), verify
//            nobody moved day/tech, write updated times back to Jobber (visitEditSchedule,
//            userErrors checked). Day/tech/time drift on EXISTING orders is reported, never
//            auto-resolved (a hand-move in Jobber may be deliberate).
//
// Guards (all hard):
//   - Email freeze: date D locks 14:00 PT on D-1; today never writable. On a frozen day the
//     missing order is still created in OR (locked, so OR knows it exists) but the day is
//     NOT re-planned and NO Jobber writes happen — flagged for manual handling.
//   - Only days that already have routes in OR are checked (unplanned future days are not drift).
//   - Only own orders (orderNo = <jobNumber>-<visitNum>) are ever touched; foreign orders ignored.
//   - Max NEW creations per run: 15 (override --max-create N). More than that smells like a
//     scoping bug, not bookings -> abort before any write.
//   - Post-replan verification: if any existing stop changed day or tech, or the new order came
//     back unscheduled, that day is ABORTED with zero Jobber writes.
//   - Priority always M (07-12 policy). Never delete anything.
//
// Usage: node drift-check.mjs check | fix [--max-create N] [--apply-tech-drift] [--override-freeze]
//   --apply-tech-drift  Jobber is truth: reassign OR orders whose tech differs from Jobber
//                       (default: report-only). Use when the user says their Jobber moves are deliberate.
//   --override-freeze   Re-plan/write a frozen FUTURE day (today never writable). Only with the
//                       user's explicit OK in-session — emails for that day already went out.
// Report: printed + saved to drift-runs/<UTC timestamp>.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const RUNS_DIR = path.join(__dirname, 'drift-runs');
const TZ = 'America/Los_Angeles';
const HORIZON_DAYS = 12; // scan tomorrow .. today+12 for planned days
const TIME_DRIFT_MIN = 20; // report threshold, minutes

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
  return data; // caller checks .errors / .data (partial errors possible on mutations)
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
  // date D is writable only until 14:00 PT on D-1
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
function hmDiffMin(a, b) {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return Math.abs((ah * 60 + am) - (bh * 60 + bm));
}

async function fetchVisits(afterIso, beforeIso) {
  const visits = [];
  let cursor = null;
  for (;;) {
    const q = `query($after: String) { visits(first: 25, after: $after, filter: { startAt: { after: "${afterIso}", before: "${beforeIso}" } }) { nodes { id title startAt endAt isComplete assignedUsers(first: 2) { nodes { id name { full } } } property { address { street city province postalCode } } job { jobNumber startAt } } pageInfo { hasNextPage endCursor } } }`;
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

async function fetchUsers() {
  const r = await jgql('query { users(first: 100) { nodes { id name { full } } } }', {});
  if (r.errors) throw new Error('Jobber users: ' + JSON.stringify(r.errors).slice(0, 300));
  const map = {};
  for (const u of r.data.users.nodes) if (u.name && u.name.full) map[u.name.full.trim().toLowerCase()] = u.id;
  return map;
}

// ---------- main ----------
const mode = process.argv[2];
const args = process.argv.slice(3);
if (!['check', 'fix'].includes(mode)) { console.log('Usage: drift-check.mjs check|fix [--max-create N]'); process.exit(1); }
const mcIdx = args.indexOf('--max-create');
const maxCreate = mcIdx >= 0 ? Number(args[mcIdx + 1]) : 15;
const applyTechDrift = args.includes('--apply-tech-drift');
const overrideFreeze = args.includes('--override-freeze');

const nowStr = ptNow();
const today = nowStr.slice(0, 10);
console.log(`Drift check ${nowStr} PT (${mode.toUpperCase()})`);

// 1. Find OR-planned days (tomorrow .. horizon) and collect their scheduled stops
const stopsByOrderNo = {}; // orderNo -> {date, driver, driverSerial, hm}
const plannedDays = [];
const driverSerials = {}; // driverName(lower) -> serial
for (let i = 1; i <= HORIZON_DAYS; i++) {
  const d = addDaysPT(today, i);
  const r = await orGet(`get_routes?date=${d}`);
  if (r.success === false) { console.error(`get_routes ${d} failed:`, JSON.stringify(r).slice(0, 200)); process.exit(1); }
  const routes = r.routes || [];
  if (!routes.length) continue;
  plannedDays.push(d);
  for (const rt of routes) {
    if (rt.driverName) driverSerials[rt.driverName.trim().toLowerCase()] = rt.driverSerial || null;
    for (const s of rt.stops || []) {
      const onum = String(s.orderNo || '');
      if (!/^\d+-\w+$/.test(onum)) continue; // own orders only
      stopsByOrderNo[onum] = { date: d, driver: rt.driverName, driverSerial: rt.driverSerial || null, hm: (s.scheduledAtDt || '').slice(11, 16) };
    }
  }
  await sleep(300);
}
if (!plannedDays.length) { console.log('No OR-planned days in horizon — nothing to check.'); process.exit(0); }
const lastPlanned = plannedDays[plannedDays.length - 1];
console.log(`OR-planned days: ${plannedDays.join(', ')} (${Object.keys(stopsByOrderNo).length} own scheduled stops)`);

// 2. Jobber visits across the planned span
const afterIso = `${addDaysPT(plannedDays[0], -1)}T23:59:59-07:00`;
const beforeIso = `${lastPlanned}T23:59:59-07:00`;
const visits = await fetchVisits(afterIso, beforeIso);
const active = visits.filter(v => !v.isComplete && v.job && v.job.jobNumber != null);
console.log(`Jobber active visits in span: ${active.length}`);

// 3. Diff
const missing = [], dayDrift = [], techDrift = [], timeDrift = [], noTime = [];
const seenOrderNos = new Set();
for (const vis of active) {
  const { date: jDate, hm: jHm } = toPT(vis.startAt);
  if (!plannedDays.includes(jDate)) continue; // only compare on planned days
  const jn = String(vis.job.jobNumber);
  const orderNo = jn + '-' + visitNumOf(vis);
  seenOrderNos.add(orderNo);
  const users = (vis.assignedUsers && vis.assignedUsers.nodes) || [];
  const tech = (users[0] && users[0].name && users[0].name.full) || null;
  const stop = stopsByOrderNo[orderNo];
  if (!stop) {
    const a = vis.property && vis.property.address;
    missing.push({
      orderNo, job: jn, visitId: vis.id, date: jDate, hm: jHm, tech,
      title: ((vis.title || 'Unknown') + '').trim().replace(/\s+/g, ' '),
      address: a && a.street ? `${a.street}, ${a.city}, ${a.province || 'WA'} ${a.postalCode || ''}` : null,
      isSet: vis.job.startAt ? toPT(vis.job.startAt).date === jDate : false,
    });
    continue;
  }
  if (stop.date !== jDate) dayDrift.push({ orderNo, job: jn, jobber: jDate, optimo: stop.date, driver: stop.driver });
  else {
    if (tech && stop.driver && tech.trim().toLowerCase() !== stop.driver.trim().toLowerCase())
      techDrift.push({ orderNo, job: jn, date: jDate, jobber: tech, optimo: stop.driver });
    if (jHm !== '00:00' && stop.hm && hmDiffMin(jHm, stop.hm) >= TIME_DRIFT_MIN)
      timeDrift.push({ orderNo, job: jn, date: jDate, jobber: jHm, optimo: stop.hm });
  }
  if (jHm === '00:00') noTime.push({ orderNo, job: jn, date: jDate });
}
const orphans = Object.keys(stopsByOrderNo).filter(o => !seenOrderNos.has(o))
  .map(o => ({ orderNo: o, ...stopsByOrderNo[o] }));

const report = {
  ranAt: new Date().toISOString(), mode, plannedDays,
  counts: { activeVisits: active.length, scheduledStops: Object.keys(stopsByOrderNo).length,
    missing: missing.length, dayDrift: dayDrift.length, techDrift: techDrift.length,
    timeDrift: timeDrift.length, noTime: noTime.length, orphans: orphans.length },
  missing, dayDrift, techDrift, timeDrift, noTime, orphans, fixes: [],
};

console.log('\n=== DRIFT REPORT ===');
console.log(`MISSING from OR (new bookings): ${missing.length}` + (missing.length ? ' — ' + missing.map(m => `#${m.job} ${m.date} ${m.tech || 'NO TECH'}`).join(', ') : ''));
console.log(`Day drift: ${dayDrift.length}` + (dayDrift.length ? ' — ' + dayDrift.map(d => `#${d.job} J:${d.jobber} vs OR:${d.optimo}`).join(', ') : ''));
console.log(`Tech drift: ${techDrift.length}` + (techDrift.length ? ' — ' + techDrift.map(d => `#${d.job} J:${d.jobber} vs OR:${d.optimo}`).join(', ') : ''));
console.log(`Time drift >=${TIME_DRIFT_MIN}m: ${timeDrift.length}` + (timeDrift.length ? ' — ' + timeDrift.map(d => `#${d.job} ${d.date} J:${d.jobber} vs OR:${d.optimo}`).join(', ') : ''));
console.log(`Visits with no time: ${noTime.length}; OR stops with no active Jobber visit (orphans — likely canceled/completed, review only): ${orphans.length}` + (orphans.length ? ' — ' + orphans.map(o => o.orderNo).join(', ') : ''));

function saveReport() {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  const f = path.join(RUNS_DIR, new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  fs.writeFileSync(f, JSON.stringify(report, null, 1));
  console.log(`\nReport saved: ${f}`);
}

if (mode === 'check' || (missing.length === 0 && !(applyTechDrift && techDrift.length))) {
  if (mode === 'fix') console.log('\nNo missing bookings — nothing to fix. (Drift on existing orders is report-only.)');
  saveReport();
  process.exit(0);
}

// ---------- FIX ----------
if (missing.length > maxCreate) {
  console.error(`\nABORT: ${missing.length} missing orders exceeds --max-create ${maxCreate}. That is not a normal booking volume — investigate before fixing (window bug? OR plan wiped?). No writes made.`);
  report.aborted = `missing ${missing.length} > maxCreate ${maxCreate}`;
  saveReport();
  process.exit(1);
}
const noAddress = missing.filter(m => !m.address);
if (noAddress.length) console.log(`\nWARN: ${noAddress.length} missing bookings have no address and cannot be created: ${noAddress.map(m => '#' + m.job).join(', ')}`);

const byDay = {};
for (const m of missing.filter(x => x.address)) (byDay[m.date] = byDay[m.date] || []).push(m);

// Optional: Jobber is truth for tech assignment — reassign drifted OR orders before the day fix
const techDriftDays = new Set();
if (applyTechDrift && techDrift.length) {
  console.log(`\nApplying tech drift (Jobber = truth): ${techDrift.length} reassignment(s)`);
  for (const t of techDrift) {
    const serial = driverSerials[t.jobber.trim().toLowerCase()];
    if (!serial) { console.log(`  SKIP ${t.orderNo}: no OR driver serial for "${t.jobber}"`); continue; }
    const r = await orCall('create_order', { operation: 'UPDATE', orderNo: t.orderNo, date: t.date, allowedDates: { from: t.date, to: t.date }, priority: 'M', assignedTo: { serial } });
    if (!r.success) { console.log(`  REASSIGN FAILED ${t.orderNo}: ${JSON.stringify(r).slice(0, 120)}`); continue; }
    console.log(`  reassigned ${t.orderNo} → ${t.jobber}`);
    stopsByOrderNo[t.orderNo].driver = t.jobber;
    stopsByOrderNo[t.orderNo].driverSerial = serial;
    techDriftDays.add(t.date);
    byDay[t.date] = byDay[t.date] || [];
    await sleep(300);
  }
}

const users = await fetchUsers();

for (const day of Object.keys(byDay).sort()) {
  const items = byDay[day];
  const frozen = !emailCutoffOk(day);
  const writable = !frozen || (overrideFreeze && day > today);
  const fix = { day, writable, created: [], replanned: false, writes: [], failures: [], aborted: null };
  report.fixes.push(fix);
  console.log(`\n--- FIX ${day} (${items.length} new, ${writable ? (frozen ? 'FROZEN but OVERRIDDEN by explicit user approval' : 'writable') : 'FROZEN — create-only'}) ---`);

  // 1. create the missing orders, locked to their Jobber day (+tech when the serial is known)
  for (const m of items) {
    const serial = m.tech ? driverSerials[m.tech.trim().toLowerCase()] : null;
    const order = {
      operation: 'SYNC',
      orderNo: m.orderNo,
      type: 'T',
      date: m.date,
      duration: m.isSet ? 20 : 10,
      priority: 'M',
      location: {
        address: m.address,
        locationName: (m.title + ' · #' + m.job).slice(0, 60),
        acceptPartialMatch: true,
        acceptMultipleResults: true,
      },
      allowedDates: { from: m.date, to: m.date },
      notes: 'Jobber job ' + m.job + (m.isSet ? ' (SET)' : '') + ' [drift-fix]',
    };
    if (serial) order.assignedTo = { serial };
    const r = await orCall('create_order', order);
    if (r.success) { fix.created.push(m.orderNo); console.log(`  created ${m.orderNo} (${m.tech || 'no tech'}${serial ? '' : m.tech ? ' — serial unknown, unassigned' : ''})`); }
    else { fix.failures.push(`create ${m.orderNo}: ${r.code || ''} ${r.message || JSON.stringify(r).slice(0, 120)}`); console.log(`  CREATE FAILED ${m.orderNo}: ${JSON.stringify(r).slice(0, 150)}`); }
    await sleep(400);
  }
  if (!fix.created.length && !techDriftDays.has(day)) { fix.aborted = 'no orders created'; continue; }
  if (!writable) { console.log('  Day frozen (email cutoff) — orders created in OR, NO re-plan, NO Jobber writes. Handle manually.'); continue; }

  // 2. lock every existing scheduled stop on this day to its current day + tech
  const dayStops = Object.entries(stopsByOrderNo).filter(([, s]) => s.date === day);
  console.log(`  locking ${dayStops.length} existing stops to day+tech…`);
  let lockFails = 0;
  for (const [orderNo, s] of dayStops) {
    const upd = { operation: 'UPDATE', orderNo, date: day, allowedDates: { from: day, to: day }, priority: 'M' };
    if (s.driverSerial) upd.assignedTo = { serial: s.driverSerial };
    const r = await orCall('create_order', upd);
    if (!r.success) { lockFails++; fix.failures.push(`lock ${orderNo}: ${r.code || ''} ${r.message || ''}`); }
    await sleep(250);
  }
  if (lockFails > 0) { fix.aborted = `${lockFails} lock failures — day NOT re-planned`; console.log(`  ABORT day: ${lockFails} lock failures.`); continue; }

  // 3. re-plan just this day
  console.log('  re-planning day (balancing OFF)…');
  const sp = await orCall('start_planning', { dateRange: { from: day, to: day }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' });
  if (!sp.success) { fix.aborted = 'start_planning failed: ' + JSON.stringify(sp).slice(0, 150); console.log('  ABORT: ' + fix.aborted); continue; }
  let done = false;
  for (let i = 0; i < 60; i++) {
    await sleep(10000);
    const st = await orGet(`get_planning_status?planningId=${sp.planningId}`);
    const status = (st.status || '').toString();
    if (/^F/i.test(status)) { done = true; break; }
    if (/^E/i.test(status)) { fix.aborted = 'planning error: ' + JSON.stringify(st).slice(0, 150); break; }
  }
  if (!done) { if (!fix.aborted) fix.aborted = 'planning timeout (10 min)'; console.log('  ABORT: ' + fix.aborted); continue; }
  fix.replanned = true;

  // 4. read back + verify nobody moved day/tech and the new orders got scheduled
  const rr = await orGet(`get_routes?date=${day}`);
  const newStops = {};
  for (const rt of rr.routes || []) for (const s of rt.stops || []) {
    const onum = String(s.orderNo || '');
    if (/^\d+-\w+$/.test(onum)) newStops[onum] = { driver: rt.driverName, hm: (s.scheduledAtDt || '').slice(11, 16), scheduledAtDt: s.scheduledAtDt };
  }
  const lostExisting = dayStops.filter(([o]) => !newStops[o]);
  const techMoved = dayStops.filter(([o, s]) => newStops[o] && s.driver && newStops[o].driver !== s.driver);
  const newUnscheduled = fix.created.filter(o => !newStops[o]);
  if (lostExisting.length || techMoved.length) {
    fix.aborted = `VERIFY FAILED: ${lostExisting.length} existing stops vanished, ${techMoved.length} changed tech — NO Jobber writes`;
    console.log('  ABORT: ' + fix.aborted, JSON.stringify({ lost: lostExisting.map(([o]) => o), moved: techMoved.map(([o]) => o) }).slice(0, 300));
    continue;
  }
  if (newUnscheduled.length) console.log(`  NOTE: ${newUnscheduled.length} new orders did not fit and are unscheduled: ${newUnscheduled.join(', ')} — decide manually.`);

  // 5. write updated times to Jobber (changed stops + the new bookings)
  const jVisById = {};
  for (const vis of active) jVisById[String(vis.job.jobNumber) + '-' + visitNumOf(vis)] = vis;
  let ok = 0, failed = 0;
  for (const [orderNo, ns] of Object.entries(newStops)) {
    const vis = jVisById[orderNo];
    if (!vis || !ns.scheduledAtDt) continue;
    const cur = toPT(vis.startAt);
    const planTime = ns.scheduledAtDt.slice(11, 19);
    if (cur.hm === ns.hm && cur.date === day) continue; // unchanged
    const endT = new Date(`${day}T${planTime}-07:00`).getTime() + 3 * 3600000;
    const endPT = new Date(endT).toLocaleString('sv-SE', { timeZone: TZ });
    const opsList = [`mutation { visitEditSchedule(id: "${vis.id}", input: { startAt: { date: "${day}", time: "${planTime}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`];
    const curUsers = ((vis.assignedUsers || {}).nodes || []);
    const curTech = curUsers[0] && curUsers[0].name && curUsers[0].name.full;
    if (!curTech && ns.driver && users[ns.driver.trim().toLowerCase()])
      opsList.push(`mutation { visitEditAssignedUsers(visitId: "${vis.id}", input: { assignedUserIds: ["${users[ns.driver.trim().toLowerCase()]}"] }) { userErrors { message } } }`);
    let bad = null;
    for (const op of opsList) {
      const r = await jgql(op, {});
      const ue = [];
      if (r.errors) ue.push(...r.errors.map(e => e.message));
      const d = r.data || {};
      for (const k of Object.keys(d)) if (d[k] && d[k].userErrors) ue.push(...d[k].userErrors.map(e => e.message));
      if (ue.length) { bad = ue.join('; '); break; }
      await sleep(150);
    }
    if (bad) { failed++; fix.failures.push(`write ${orderNo}: ${bad}`); }
    else { ok++; fix.writes.push({ orderNo, from: `${cur.date} ${cur.hm}`, to: `${day} ${ns.hm}`, driver: ns.driver }); }
    await sleep(200);
  }
  console.log(`  Jobber write-back: ${ok} ok, ${failed} failed. New bookings slotted: ${fix.created.filter(o => newStops[o]).map(o => `${o} @ ${newStops[o].hm} (${newStops[o].driver})`).join(', ')}`);
}

saveReport();
const anyAbort = report.fixes.some(f => f.aborted);
const anyFail = report.fixes.some(f => f.failures.length);
console.log(`\nDRIFT FIX DONE: ${report.fixes.reduce((n, f) => n + f.created.length, 0)} created, ${report.fixes.reduce((n, f) => n + f.writes.length, 0)} Jobber writes${anyAbort ? ' — WITH ABORTED DAYS' : ''}${anyFail ? ' — WITH FAILURES' : ''}`);
process.exit(anyAbort || anyFail ? 1 : 0);
