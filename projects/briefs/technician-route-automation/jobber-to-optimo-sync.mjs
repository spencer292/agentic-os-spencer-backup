#!/usr/bin/env node
// JOBBER -> OPTIMOROUTE SYNC — Jobber is the source of truth for WHICH DAY and WHICH TECH.
// OptimoRoute is the optimizer: it may only re-sequence within the day and hand back times.
//
// Born 2026-08-04 (Spencer): "jobber is the truth, optimoroute is the dry run essentially — we use
// it to measure and get everyone on the optimal route for the day and then push back to jobber."
// This is the reverse of grid-tech-realign.mjs, which made Jobber follow the grid. Use THIS one
// after the board has been hand-corrected; use that one to enforce the territory grid.
//
// Flow: read every active Jobber visit in the window -> create/UPDATE its OR order onto the Jobber
// day, pinned to the Jobber tech -> re-plan each day (balancing OFF, drivers pinned) -> verify every
// visit is scheduled on its Jobber tech -> write the optimized times back to Jobber.
//
// Usage: node jobber-to-optimo-sync.mjs dry|live --from=YYYY-MM-DD --to=YYYY-MM-DD
//                                       [--override-freeze] [--no-replan=DATE,DATE] [--show=40]
//
// Guards: never today or past; a frozen future day needs --override-freeze (its customers already
// have arrival windows). --no-replan=DATE syncs a day's orders WITHOUT re-planning or re-timing it,
// so work moved into a frozen day still becomes visible in OR without disturbing emailed windows.
// Post-replan verification aborts a day with ZERO Jobber writes if any visit is unscheduled or lands
// on a tech other than the one Jobber names. Never deletes.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const RUNS_DIR = path.join(__dirname, 'drift-runs');
const TZ = 'America/Los_Angeles';
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: jobber-to-optimo-sync.mjs dry|live --from=YYYY-MM-DD --to=YYYY-MM-DD [--override-freeze] [--no-replan=DATE,...]'); process.exit(1); }
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const OVERRIDE_FREEZE = process.argv.includes('--override-freeze');
const NO_REPLAN = new Set((flag('no-replan', '') || '').split(',').filter(Boolean));
// Jobs handled OFF-ROUTE by a person who is not an OptimoRoute driver. Spencer 2026-08-09 keeps
// #7949 Emerald Ridge personally; his driver record has no working day, so the stop can never be
// scheduled and its day aborts with zero writes — taking 109 other Friday stops down with it.
// Excluded jobs are left ALONE in Jobber (date, tech and time untouched) and simply not pushed.
const SKIP_JOBS = new Set((flag('skip-jobs', '') || '').split(',').map(x=>x.trim()).filter(Boolean));
const SHOW = Number(flag('show', 40));
// --plan-only: create/update orders and re-plan in OptimoRoute, then STOP. No Jobber writes at all.
// For a frozen day whose customers already have arrival windows: lets the real time impact be
// measured before deciding whether to disturb them. Spencer 2026-08-10.
const PLAN_ONLY = process.argv.includes('--plan-only');
if (!FROM || !TO) { console.error('--from and --to are required'); process.exit(1); }

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
  if (throttled && attempt < 8) { const w = Math.min(60000, 2000 * 2 ** attempt); console.log(`  jobber throttled — backoff ${w / 1000}s`); await sleep(w); return jgql(query, variables, attempt + 1); }
  return data;
}
async function orCall(endpoint, body, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orCall(endpoint, body, attempt + 1); }
  return d;
}
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
const toPT = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
const ptNow = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function dowOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
function emailCutoffOk(dateStr) {
  const nowStr = ptNow(); const today = nowStr.slice(0, 10); const hour = Number(nowStr.slice(11, 13));
  if (dateStr <= today) return false;
  if (dateStr === addDays(today, 1) && hour >= 14) return false;
  return true;
}
function visitNumOf(vis) {
  let num = null;
  try { num = Buffer.from(vis.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!num || !/^\d+$/.test(num)) num = vis.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return num;
}
function addrOf(a) {
  if (!a) return null;
  const parts = [a.street, a.city, a.province, a.postalCode].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

const today = ptNow().slice(0, 10);
console.log(`JOBBER -> OPTIMOROUTE SYNC (${mode.toUpperCase()})  ${FROM} .. ${TO}`);
console.log(`now ${ptNow()} PT   (Jobber is truth for day + tech)\n`);

// ---------- read Jobber ----------
const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt isComplete
      client{ name }
      job{ jobNumber startAt }
      property{ address{ street city province postalCode } }
      assignedUsers(first:4){ nodes{ id name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;
let cur = null; const raw = [];
for (;;) {
  const d = await jgql(Q, { a: cur, after: `${addDays(FROM, -1)}T23:59:59-07:00`, before: `${TO}T23:59:59-07:00` });
  if (!d.data) { console.error('Jobber query failed:', JSON.stringify(d).slice(0, 300)); process.exit(1); }
  raw.push(...d.data.visits.nodes);
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cur = d.data.visits.pageInfo.endCursor;
  await sleep(250);
}
const want = {}; // orderNo -> desired state from Jobber
const skippedOffRoute = [];
for (const v of raw) {
  if (v.isComplete) continue;
  const jDate = toPT(v.startAt).slice(0, 10);
  if (jDate < FROM || jDate > TO) continue;
  const jn = String(v.job?.jobNumber || '');
  if (SKIP_JOBS.has(jn)) { skippedOffRoute.push(jn + ' ' + jDate + ' ' + (v.client?.name || '')); continue; }
  want[jn + '-' + visitNumOf(v)] = {
    visit: v, job: jn, date: jDate,
    tech: v.assignedUsers?.nodes?.[0]?.name?.full || null,
    address: addrOf(v.property?.address),
    city: v.property?.address?.city,
    title: v.title, client: v.client?.name,
    isSet: v.job?.startAt ? toPT(v.job.startAt).slice(0, 10) === jDate : false,
  };
}
if (skippedOffRoute.length) console.log(`
  OFF-ROUTE, left untouched in Jobber (${skippedOffRoute.length}): ${skippedOffRoute.join('; ')}`);
console.log(`Jobber active visits in window: ${Object.keys(want).length}`);

// ---------- read OptimoRoute ----------
const have = {}; const serials = {};
for (let d = addDays(FROM, -3); d <= addDays(TO, 3); d = addDays(d, 1)) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    if (rt.driverName) serials[rt.driverName.trim().toLowerCase()] = rt.driverSerial || null;
    for (const s of rt.stops || []) {
      const o = String(s.orderNo || '');
      if (/^\d+-\w+$/.test(o)) have[o] = { date: d, driver: rt.driverName, driverSerial: rt.driverSerial || null, hm: (s.scheduledAtDt || '').slice(11, 16) };
    }
  }
  await sleep(280);
}
console.log(`OptimoRoute own stops seen (±3d): ${Object.keys(have).length}`);
console.log(`OR drivers: ${Object.keys(serials).join(', ')}\n`);

// PRE-FLIGHT: every tech Jobber names in this window must exist as an OptimoRoute driver. Without a
// serial the order goes in unassigned, the optimizer hands it to whoever is nearest, and the day
// fails verification AFTER a full re-plan — which is how 2026-08-06 went: Robert Norton had 132
// Jobber visits and no driver record, so Monday was re-planned for nothing. Fail before any write.
// Note `serials` is learned from get_routes, so a driver with no current stops is invisible here;
// that is exactly the case this catches, and the fix is to create the driver in the OptimoRoute UI
// (create_driver is not available on this API key).
{
  // Drivers confirmed to exist but with no stops this window would otherwise be flagged as missing.
  try {
    const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'territories.json'), 'utf8'));
    for (const name of T.optimoRouteDrivers?.confirmed || []) {
      const k = name.trim().toLowerCase();
      if (!serials[k]) serials[k] = name; // serials on this account are the full name
    }
  } catch { /* territories.json is optional for this script */ }
  const needed = new Set(Object.values(want).map(w => w.tech).filter(Boolean));
  const missing = [...needed].filter(t => !serials[t.trim().toLowerCase()]);
  if (missing.length) {
    console.error(`\n🛑 ABORT: ${missing.length} tech(s) named in Jobber have no OptimoRoute driver record:`);
    for (const m of missing) {
      const n = Object.values(want).filter(w => w.tech === m).length;
      console.error(`     ${m}  (${n} visits in this window)`);
    }
    console.error('   Create them in the OptimoRoute UI — with their home as the start location, or the');
    console.error('   commute cost of every route they run will be wrong. NO writes were made.');
    process.exit(1);
  }
}

// ---------- diff ----------
const actions = [], noAddress = [], noTech = [], frozenSkip = [];
for (const [orderNo, w] of Object.entries(want)) {
  const h = have[orderNo] || null;
  const needCreate = !h;
  const needDay = h && h.date !== w.date;
  const needTech = w.tech && (!h || h.driver !== w.tech);
  if (!needCreate && !needDay && !needTech) continue;
  if (!w.address) { noAddress.push({ orderNo, job: w.job, client: w.client }); continue; }
  if (!w.tech) noTech.push({ orderNo, job: w.job, client: w.client });
  const serial = w.tech ? serials[w.tech.trim().toLowerCase()] : null;
  if (w.tech && !serial) { frozenSkip.push({ orderNo, job: w.job, why: `no OR driver serial for ${w.tech}` }); continue; }
  if (!emailCutoffOk(w.date) && !(OVERRIDE_FREEZE && w.date > today)) { frozenSkip.push({ orderNo, job: w.job, why: `target day ${w.date} frozen` }); continue; }
  actions.push({
    orderNo, job: w.job, client: w.client, city: w.city, isSet: w.isSet,
    fromDay: h?.date || null, toDay: w.date,
    fromTech: h?.driver || null, toTech: w.tech, serial,
    needCreate, needDay, needTech, address: w.address, title: w.title,
  });
}

// days that must be re-planned: any day gaining or losing an order
const touched = new Set();
for (const a of actions) { touched.add(a.toDay); if (a.fromDay) touched.add(a.fromDay); }
const replanDays = [...touched].filter(d => d >= FROM && d <= TO).sort()
  .filter(d => {
    if (NO_REPLAN.has(d)) return false;
    if (!emailCutoffOk(d) && !(OVERRIDE_FREEZE && d > today)) return false;
    return true;
  });
const blockedDays = [...touched].filter(d => d >= FROM && d <= TO).sort().filter(d => !replanDays.includes(d));

console.log('=== PLAN ===');
console.log(`  create missing OR order : ${actions.filter(a => a.needCreate).length}`);
console.log(`  move to Jobber day      : ${actions.filter(a => a.needDay).length}`);
console.log(`  set to Jobber tech      : ${actions.filter(a => a.needTech).length}`);
console.log(`  TOTAL orders touched    : ${actions.length}`);
console.log(`  already in sync         : ${Object.keys(want).length - actions.length - noAddress.length - frozenSkip.length}`);
console.log(`  days to re-plan         : ${replanDays.join(', ') || '(none)'}`);
if (blockedDays.length) console.log(`  days NOT re-planned     : ${blockedDays.join(', ')}  (frozen, or --no-replan)`);
if (noAddress.length) console.log(`  !! no address, cannot create: ${noAddress.map(x => '#' + x.job).join(', ')}`);
if (noTech.length) console.log(`  !! no tech in Jobber (optimizer will choose): ${noTech.map(x => '#' + x.job).join(', ')}`);
if (frozenSkip.length) {
  console.log(`  skipped (${frozenSkip.length}):`);
  const by = {};
  for (const s of frozenSkip) by[s.why] = (by[s.why] || 0) + 1;
  for (const [w, n] of Object.entries(by)) console.log(`      ${String(n).padStart(3)}  ${w}`);
}

console.log(`\n  changes (first ${SHOW}):`);
for (const a of actions.slice(0, SHOW)) {
  const bits = [];
  if (a.needCreate) bits.push('CREATE');
  if (a.needDay) bits.push(`${a.fromDay}->${a.toDay}`);
  if (a.needTech) bits.push(`${(a.fromTech || 'none').split(' ')[0]}->${a.toTech.split(' ')[0]}`);
  console.log(`    #${String(a.job).padEnd(5)} ${String(a.city || '').slice(0, 14).padEnd(15)} ${dowOf(a.toDay)}  ${bits.join('  ')}${a.isSet ? '  [SET]' : ''}`);
}
if (actions.length > SHOW) console.log(`    … +${actions.length - SHOW} more`);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.mkdirSync(RUNS_DIR, { recursive: true });
const reportPath = path.join(RUNS_DIR, `j2o-sync-${stamp}.json`);
const report = { ranAt: new Date().toISOString(), mode, from: FROM, to: TO, actions, noAddress, noTech, frozenSkip, replanDays, blockedDays, days: [] };
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
if (mode === 'dry') { console.log(`\nDRY RUN — nothing written. Report: ${reportPath}`); process.exit(0); }

// ---------- apply ----------
console.log('\n=== APPLYING ===');
console.log(`Writing ${actions.length} order updates to OptimoRoute…`);
let fails = 0;
for (const a of actions) {
  const order = {
    operation: 'SYNC', orderNo: a.orderNo, type: 'T', date: a.toDay,
    duration: a.isSet ? 20 : 10, priority: 'M',
    location: { address: a.address, locationName: ((a.title || '') + ' · #' + a.job).slice(0, 60), acceptPartialMatch: true, acceptMultipleResults: true },
    allowedDates: { from: a.toDay, to: a.toDay },
    notes: 'Jobber job ' + a.job + (a.isSet ? ' (SET)' : '') + ' [jobber-truth-sync]',
  };
  if (a.serial) order.assignedTo = { serial: a.serial };
  const r = await orCall('create_order', order);
  if (!r.success) { fails++; console.log(`  FAILED ${a.orderNo}: ${JSON.stringify(r).slice(0, 150)}`); }
  await sleep(350);
}
if (fails) { console.error(`\nABORT: ${fails} order writes failed — no re-plan, no Jobber writes.`); report.aborted = `${fails} order write failures`; fs.writeFileSync(reportPath, JSON.stringify(report, null, 2)); process.exit(1); }
console.log('  all order updates accepted');

// pin every OTHER order on each re-plan day so the optimizer can only re-sequence
for (const day of replanDays) {
  const dayRec = { day, replanned: false, writes: [], techWrites: [], failures: [], aborted: null };
  report.days.push(dayRec);
  console.log(`\n--- ${day} (${dowOf(day)}) ---`);
  const rr = await orGet(`get_routes?date=${day}`);
  const existing = {};
  for (const rt of rr.routes || []) for (const s of rt.stops || []) {
    const o = String(s.orderNo || '');
    if (/^\d+-\w+$/.test(o)) existing[o] = { driver: rt.driverName, driverSerial: rt.driverSerial || null };
  }
  console.log(`  pinning ${Object.keys(existing).length} stops to day+tech…`);
  let lockFails = 0;
  for (const [o, s] of Object.entries(existing)) {
    const w = want[o];
    const serial = (w && w.tech && serials[w.tech.trim().toLowerCase()]) || s.driverSerial;
    const u = { operation: 'UPDATE', orderNo: o, date: day, allowedDates: { from: day, to: day }, priority: 'M' };
    if (serial) u.assignedTo = { serial };
    const r = await orCall('create_order', u);
    if (!r.success) lockFails++;
    await sleep(230);
  }
  if (lockFails) { dayRec.aborted = `${lockFails} pin failures`; console.log(`  ABORT: ${dayRec.aborted}`); continue; }

  console.log('  re-planning (balancing OFF, drivers pinned)…');
  const sp = await orCall('start_planning', { dateRange: { from: day, to: day }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' });
  if (!sp.success) { dayRec.aborted = 'start_planning failed: ' + JSON.stringify(sp).slice(0, 150); console.log('  ABORT: ' + dayRec.aborted); continue; }
  let done = false;
  for (let i = 0; i < 60; i++) {
    await sleep(10000);
    const st = await orGet(`get_planning_status?planningId=${sp.planningId}`);
    const status = (st.status || '').toString();
    if (/^F/i.test(status)) { done = true; break; }
    if (/^E/i.test(status)) { dayRec.aborted = 'planning error: ' + JSON.stringify(st).slice(0, 150); break; }
  }
  if (!done) { if (!dayRec.aborted) dayRec.aborted = 'planning timeout'; console.log('  ABORT: ' + dayRec.aborted); continue; }
  dayRec.replanned = true;

  const rr2 = await orGet(`get_routes?date=${day}`);
  const now = {};
  for (const rt of rr2.routes || []) for (const s of rt.stops || []) {
    const o = String(s.orderNo || '');
    if (/^\d+-\w+$/.test(o)) now[o] = { driver: rt.driverName, hm: (s.scheduledAtDt || '').slice(11, 16), scheduledAtDt: s.scheduledAtDt };
  }
  const expect = Object.entries(want).filter(([, w]) => w.date === day);
  const unscheduled = expect.filter(([o]) => !now[o]);
  const wrongTech = expect.filter(([o, w]) => now[o] && w.tech && now[o].driver !== w.tech);
  if (unscheduled.length || wrongTech.length) {
    dayRec.aborted = `VERIFY FAILED: ${unscheduled.length} unscheduled, ${wrongTech.length} on a tech Jobber does not name — NO Jobber writes`;
    console.log('  ABORT: ' + dayRec.aborted);
    console.log('    ' + JSON.stringify({ unscheduled: unscheduled.map(([o]) => o).slice(0, 10), wrongTech: wrongTech.map(([o, w]) => `${o} want ${w.tech} got ${now[o].driver}`).slice(0, 10) }));
    continue;
  }
  console.log(`  verified: ${expect.length} visits scheduled, all on the tech Jobber names`);

  let ok = 0, failed = 0;
  for (const [o, ns] of Object.entries(now)) {
    const w = want[o];
    if (!w || !ns.scheduledAtDt) continue;
    const cur2 = toPT(w.visit.startAt);
    if (cur2.slice(0, 10) === day && cur2.slice(11, 16) === ns.hm) continue;
    if (PLAN_ONLY) { ok++; continue; }   // measured, not written
    const planTime = ns.scheduledAtDt.slice(11, 19);
    const endPT = new Date(new Date(`${day}T${planTime}-07:00`).getTime() + 3 * 3600000).toLocaleString('sv-SE', { timeZone: TZ });
    const r = await jgql(`mutation { visitEditSchedule(id: "${w.visit.id}", input: { startAt: { date: "${day}", time: "${planTime}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`, {});
    const ue = (r.errors || []).map(e => e.message);
    for (const k of Object.keys(r.data || {})) if (r.data[k]?.userErrors) ue.push(...r.data[k].userErrors.map(e => e.message));
    if (ue.length) { failed++; dayRec.failures.push(`write ${o}: ${ue.join('; ')}`); }
    else { ok++; dayRec.writes.push({ orderNo: o, from: cur2.slice(0, 16), to: `${day} ${ns.hm}`, driver: ns.driver }); }
    await sleep(210);
  }
  console.log(`  Jobber time write-back: ${ok} ok, ${failed} failed`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
const anyAbort = report.days.some(d => d.aborted), anyFail = report.days.some(d => d.failures.length);
console.log(`\nSYNC DONE: ${actions.length} orders synced, ${report.days.reduce((n, d) => n + d.writes.length, 0)} Jobber time writes${anyAbort ? ' — WITH ABORTED DAYS' : ''}${anyFail ? ' — WITH FAILURES' : ''}`);
console.log(`Report: ${reportPath}`);
process.exit(anyAbort || anyFail ? 1 : 0);
