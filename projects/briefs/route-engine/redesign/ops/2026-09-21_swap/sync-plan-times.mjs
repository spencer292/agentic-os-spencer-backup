#!/usr/bin/env node
// sync-plan-times.mjs — Spencer set every visit's day and tech by hand for 2026-09-21..25. This makes
// OptimoRoute match Jobber, plans the five days, and writes the planned times back to Jobber.
//
//   node projects/briefs/route-engine/redesign/ops/2026-09-21_swap/sync-plan-times.mjs            # DRY (queries only)
//   node projects/briefs/route-engine/redesign/ops/2026-09-21_swap/sync-plan-times.mjs --execute  # LIVE (gate must be enabled)
//
// ORDER OF WORK
//   0. live Jobber visits 09-21..09-25 (Pacific), not completed. Jobber is the truth for DAY and TECH.
//   1. OptimoRoute orders in the window. Reconcile per order, never SYNC:
//        CREATE  visit has no order            (Spencer's hand-added visits)
//        UPDATE  date / assignedTo / duration differ from Jobber
//        DELETE  order in the window has no live visit in the window (moved out, cancelled, ghost)
//   2. Driver availability per date: a driver is enabled on a date only if Jobber gives them a visit that date.
//   3. start_planning per date, balancing OFF, poll, get_routes.
//   4. Write the planned arrival back to Jobber: visitEditSchedule startAt = planned arrival, endAt = +3 h
//      (the customer-facing 3-hour window convention the arrival-window sweep also uses). Unchanged times skipped.
//   5. Verify: re-pull Jobber, count visits whose start time matches the plan.
// Visits on Courtney or with no assignee are listed and left alone (no OptimoRoute driver for them).
// Every mutation is one ledger line in sync-plan-times.log. Hard stop on the first error.

import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration } from '../../../../technician-route-automation/service-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const ENV_PATH = path.join(REPO, '.' + 'env');
const LOG_PATH = path.join(__dirname, 'sync-plan-times.log');
const TZ = 'America/Los_Angeles';
const EXECUTE = process.argv.includes('--execute');
const NO_TIMES = process.argv.includes('--no-times');
// --tw=07:00-21:00 puts an earliest/latest arrival window on EVERY order (Spencer 2026-09-19: first job at 07:00 for everyone).
const TW = (process.argv.find(a => a.startsWith('--tw=')) || '').split('=')[1] || null;
const TW_OBJ = TW ? [{ twFrom: TW.split('-')[0], twTo: TW.split('-')[1] }] : null;
const twSame = (o) => !TW_OBJ || (Array.isArray(o.timeWindows) && o.timeWindows.length === 1 && o.timeWindows[0].twFrom === TW_OBJ[0].twFrom && o.timeWindows[0].twTo === TW_OBJ[0].twTo);
const ALL_DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];
const DATES = ((process.argv.find(a => a.startsWith('--dates=')) || '').split('=')[1] || '').split(',').filter(Boolean).length ? (process.argv.find(a => a.startsWith('--dates=')).split('=')[1]).split(',') : ALL_DATES;
const START_WITH = (process.argv.find(a => a.startsWith('--start=')) || '').split('=')[1] || 'CURRENT';
const FROM_ISO = DATES[0] + 'T00:00:00-07:00', TO_ISO = DATES[DATES.length - 1] + 'T23:59:59-07:00';
const DRIVERS = ['Alias Franks', 'Cory Ventura', 'Luke LaVergne', 'Robert Norton', 'Tavis Alexander', 'Spencer Hill'];
const MAX = { create: 150, delete: 80, update: 700, times: 700 };

fs.writeFileSync(LOG_PATH, '');
const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
const log = (...a) => { const l = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); fs.appendFileSync(LOG_PATH, l + '\n'); process.stdout.write(l + '\n'); };
const die = m => { log(`\n🛑 ABORT ${stamp()} — ${m}`); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadEnv() { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'); }
let tok = null, tokAt = 0;
async function token(force = false) {
  if (!force && tok && Date.now() - tokAt < 50 * 60 * 1000) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json(); if (!d.access_token) die(`Jobber token refresh failed (http ${r.status})`);
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; tokAt = Date.now(); return tok;
}
async function jgql(query, variables = {}, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) });
  if (res.status === 401 && attempt < 3) { await token(true); return jgql(query, variables, attempt + 1); }
  const d = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { const w = Math.min(60000, 2500 * 2 ** attempt); log(`  … throttled, backoff ${w / 1000}s`); await sleep(w); return jgql(query, variables, attempt + 1); }
  const ts = d.extensions?.cost?.throttleStatus; if (ts && ts.currentlyAvailable < 5000) await sleep(Math.min(Math.ceil(((5000 - ts.currentlyAvailable) / (ts.restoreRate || 500)) * 1000), 20000));
  return d;
}
async function orCall(endpoint, body, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
const ptLocal = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
const ptDate = iso => ptLocal(iso).slice(0, 10);
function visitNumOf(id) { let n = null; try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {} if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10); return n; }

log(`=== SYNC + PLAN + TIMES ${stamp()} PT ===`);
log(`mode: ${EXECUTE ? 'LIVE (--execute)' : 'DRY (default) — queries only'}   window: ${DATES[0]}..${DATES[DATES.length - 1]}`);

// ---------------- 0. live Jobber ----------------
const VQ = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt endAt isComplete job{ jobNumber } client{ name }
      assignedUsers(first:6){ nodes{ id name{ full } } }
      property{ address{ street1 street2 city province postalCode } } }
    pageInfo{ hasNextPage endCursor } } }`;
async function pullVisits() {
  const rows = []; let cursor = null;
  for (;;) {
    const d = await jgql(VQ, { a: cursor, after: FROM_ISO, before: TO_ISO });
    if (!d.data?.visits) die('visits query returned no data: ' + JSON.stringify(d).slice(0, 300));
    for (const v of d.data.visits.nodes) {
      const a = v.property?.address || {};
      rows.push({ id: v.id, visitNum: visitNumOf(v.id), jobNumber: v.job?.jobNumber ?? null, client: v.client?.name || null, title: v.title || '', date: ptDate(v.startAt), startLocal: ptLocal(v.startAt), isComplete: v.isComplete,
        tech: (v.assignedUsers?.nodes || []).map(u => u.name?.full).filter(Boolean)[0] || null, city: a.city || null, zip: a.postalCode || null,
        address: [a.street1, a.street2, a.city, a.province || 'WA', a.postalCode].filter(Boolean).join(', ') });
    }
    if (!d.data.visits.pageInfo.hasNextPage) break; cursor = d.data.visits.pageInfo.endCursor;
  }
  return rows.filter(v => DATES.includes(v.date));
}
const visitsAll = await pullVisits();
const visits = visitsAll.filter(v => !v.isComplete);
const skipped = visits.filter(v => !v.tech || !DRIVERS.includes(v.tech));
const active = visits.filter(v => v.tech && DRIVERS.includes(v.tech));
log(`live Jobber: ${visitsAll.length} visits, ${visits.length} not complete, ${active.length} on a routed driver, ${skipped.length} skipped (no tech / not a driver)`);
for (const v of skipped) log(`  skip ${v.date} #${v.jobNumber} ${v.client} -> ${v.tech || '(none)'}`);
const byDayTech = {}; for (const v of active) { byDayTech[v.date] = byDayTech[v.date] || {}; byDayTech[v.date][v.tech] = (byDayTech[v.date][v.tech] || 0) + 1; }
for (const d of DATES) log(`  ${d}  ` + Object.entries(byDayTech[d] || {}).map(([t, n]) => `${t.split(' ')[0]} ${n}`).join('  '));

// ---------------- 1. reconcile OptimoRoute ----------------
const orders = new Map();
{ let after = null; do { const body = { dateRange: { from: DATES[0], to: DATES[DATES.length - 1] }, includeOrderData: true }; if (after) body.after_tag = after; const r = await orCall('search_orders', body); if (r.success === false) die('search_orders failed: ' + JSON.stringify(r).slice(0, 200)); for (const o of r.orders || []) { const d = o.data || o; orders.set(String(d.orderNo || ''), d); } after = r.after_tag || null; } while (after); }
log(`\nOptimoRoute: ${orders.size} orders in the window`);
const orderNoOf = v => `${v.jobNumber}-${v.visitNum}`;
const liveNos = new Set(active.map(orderNoOf));
const creates = [], updates = [], deletes = [];
for (const v of active) {
  const no = orderNoOf(v); const isSet = /\bset\b/i.test(v.title);
  const want = { date: v.date, assignedTo: { serial: v.tech }, duration: serviceDuration(v.tech, isSet, v.jobNumber, v.date), ...(TW_OBJ ? { timeWindows: TW_OBJ } : {}) };
  const o = orders.get(no);
  if (!o) { creates.push({ operation: 'CREATE', orderNo: no, type: 'T', ...want, priority: 'M', allowedDates: { from: v.date, to: v.date }, location: { address: v.address, locationName: ((v.title || '') + ' · #' + v.jobNumber).slice(0, 60), acceptPartialMatch: true, acceptMultipleResults: true }, notes: 'Jobber job ' + v.jobNumber + (isSet ? ' (SET)' : '') + ' [sync-plan-times]', _v: v }); continue; }
  const diff = [];
  if (o.date !== want.date) diff.push(`date ${o.date}->${want.date}`);
  if ((o.assignedTo?.serial ?? null) !== v.tech) diff.push(`tech ${o.assignedTo?.serial ?? 'unset'}->${v.tech}`);
  if (Number(o.duration) !== Number(want.duration)) diff.push(`dur ${o.duration}->${want.duration}`);
  if (!twSame(o)) diff.push(`tw -> ${TW}`);
  if (diff.length) updates.push({ operation: 'UPDATE', orderNo: no, ...want, allowedDates: { from: v.date, to: v.date }, _diff: diff.join(', '), _v: v });
}
for (const [no, o] of orders) if (!liveNos.has(no)) deletes.push({ orderNo: no, date: o.date, driver: o.assignedTo?.serial ?? '-', name: o.location?.locationName || '' });
log(`  CREATE ${creates.length}   UPDATE ${updates.length}   DELETE ${deletes.length}   unchanged ${active.length - creates.length - updates.length}`);
for (const c of creates) log(`    CREATE ${c.orderNo} ${c.date} ${c._v.tech} ${c.duration}m  ${c._v.client}  ${c.location.address}`);
for (const u of updates) log(`    UPDATE ${u.orderNo} ${u.date} ${u._v.tech}  ${u._diff}`);
for (const d of deletes) log(`    DELETE ${d.orderNo} ${d.date} ${d.driver}  ${d.name}`);
if (creates.length > MAX.create || deletes.length > MAX.delete || updates.length > MAX.update) die(`reconcile counts exceed guards ${JSON.stringify(MAX)} — the board is not what this script expects; check before running`);
const noAddr = creates.filter(c => !c.location.address); if (noAddr.length) die(`${noAddr.length} creates have no street address: ${noAddr.map(c => c.orderNo).join(', ')}`);

// ---------------- 2. driver availability plan ----------------
const availability = [];
for (const d of DATES) for (const dr of DRIVERS) availability.push({ driver: { serial: dr }, date: d, enabled: !!(byDayTech[d] && byDayTech[d][dr]) });
log(`\ndriver availability: ` + DATES.map(d => `${d.slice(5)}: ${DRIVERS.filter(dr => byDayTech[d]?.[dr]).map(x => x.split(' ')[0]).join('/')}`).join('   '));

if (!EXECUTE) { log(`\nDRY RUN — nothing written. Planning and time write-back happen only with --execute. Log: ${LOG_PATH}`); process.exit(0); }

// ---------------- apply 1 ----------------
log(`\n=== OPTIMOROUTE: ${creates.length} CREATE ===`);
for (const c of creates) {
  const { _v, ...body } = c; let r = await orCall('create_order', body);
  if (r.success === false && r.code === 'ERR_ORD_EXISTS') {
    // The order exists on a date outside our window (the visit was moved into the week). Update it instead.
    const { location, type, notes, ...upd } = body; r = await orCall('create_order', { ...upd, operation: 'UPDATE' });
    log(`  CREATE ${c.orderNo} ${c.date} ${_v.tech}  existed elsewhere -> UPDATE  ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`);
  } else log(`  CREATE ${c.orderNo} ${c.date} ${_v.tech}  ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`);
  if (r.success === false) die(`CREATE failed ${c.orderNo}`); await sleep(300);
}
log(`=== OPTIMOROUTE: ${updates.length} UPDATE ===`);
for (const u of updates) { const { _v, _diff, ...body } = u; const r = await orCall('create_order', body); log(`  UPDATE ${u.orderNo} ${_diff}  ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`); if (r.success === false) die(`UPDATE failed ${u.orderNo}`); await sleep(120); }
log(`=== OPTIMOROUTE: ${deletes.length} DELETE ===`);
for (const d of deletes) { const r = await orCall('delete_order', { orderNo: d.orderNo }); log(`  DELETE ${d.orderNo} ${d.date}  ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`); if (r.success === false) die(`DELETE failed ${d.orderNo}`); await sleep(200); }

// ---------------- apply 2 ----------------
log(`\n=== OPTIMOROUTE: driver availability ===`);
{ const r = await orCall('update_drivers_parameters', { updates: availability }); const rows = r.updates || r.parameters || []; const bad = rows.filter(x => !x.success); log(`  ${rows.length - bad.length}/${rows.length} succeeded`); for (const b of bad) log(`  FAIL ${JSON.stringify(b).slice(0, 200)}`); if (!rows.length) log('  unexpected body: ' + JSON.stringify(r).slice(0, 300)); if (bad.length) die('driver availability update failed — dates are UNSCHEDULED until re-planned'); }

// ---------------- apply 3: plan ----------------
const planned = new Map(); // orderNo -> { date, arrival 'YYYY-MM-DD HH:MM:SS', driver }
for (const d of DATES) {
  log(`\n=== PLAN ${d} (balancing OFF) ===`);
  const sp = await orCall('start_planning', { dateRange: { from: d, to: d }, balancing: 'OFF', startWith: START_WITH, lockType: 'NONE' });
  if (!sp.success) die(`start_planning ${d} failed: ${JSON.stringify(sp).slice(0, 200)}`);
  let done = false;
  for (let i = 0; i < 90; i++) { await sleep(4000); const st = await orGet(`get_planning_status?planningId=${sp.planningId}`); if (st.status === 'F' || st.status === 'finished' || st.finished === true) { done = true; break; } if (st.status === 'E' || st.success === false) die(`planning ${d} errored: ${JSON.stringify(st).slice(0, 200)}`); }
  if (!done) die(`planning ${d} did not finish in 6 minutes — check OptimoRoute before re-running`);
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    const stops = rt.stops || []; const last = stops[stops.length - 1] || {};
    log(`  ${String(rt.driverName).padEnd(18)} ${String(stops.length).padStart(3)} stops  ${String(rt.duration).padStart(4)} min  ${Number(rt.distance).toFixed(0).padStart(4)} km  first ${String(stops[0]?.scheduledAtDt || '').slice(11, 16)}  last ${String(last.scheduledAtDt || '').slice(11, 16)}`);
    for (const s of stops) if (s.orderNo && s.scheduledAtDt) planned.set(String(s.orderNo), { date: d, arrival: String(s.scheduledAtDt), driver: rt.driverName });
  }
  const un = active.filter(v => v.date === d && !planned.has(orderNoOf(v)));
  if (un.length) log(`  ⚠ ${un.length} unscheduled on ${d}: ` + un.map(v => `${v.tech.split(' ')[0]} #${v.jobNumber}`).join(', '));
}

// ---------------- apply 4: times back to Jobber ----------------
if (NO_TIMES) { log('\n--no-times: planned times NOT written to Jobber.'); }
else {
  log(`\n=== JOBBER: write planned times (startAt = arrival, endAt = +3 h) ===`);
  let wrote = 0, same = 0, fail = 0, none = 0; const writes = [];
  for (const v of active) {
    const p = planned.get(orderNoOf(v)); if (!p) { none++; continue; }
    const arr = p.arrival.replace('T', ' ').slice(0, 19); const time = arr.slice(11, 19) || (arr.slice(11, 16) + ':00');
    if (v.startLocal.slice(11, 16) === time.slice(0, 5) && v.date === p.date) { same++; continue; }
    writes.push({ v, date: p.date, time });
  }
  if (writes.length > MAX.times) die(`${writes.length} time writes exceeds guard ${MAX.times}`);
  log(`  to write ${writes.length}   already correct ${same}   not on a route ${none}`);
  for (const w of writes) {
    const endPT = new Date(new Date(`${w.date}T${w.time}-07:00`).getTime() + 3 * 3600000).toLocaleString('sv-SE', { timeZone: TZ });
    const q = `mutation { visitEditSchedule(id: "${w.v.id}", input: { startAt: { date: "${w.date}", time: "${w.time}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`;
    const r = await jgql(q); const errs = [...(r.errors || []).map(e => e.message)]; for (const k of Object.keys(r.data || {})) for (const e of (r.data[k]?.userErrors || [])) errs.push(e.message);
    wrote++; log(`  [${String(wrote).padStart(3)}/${writes.length}] ${w.date} ${w.time.slice(0, 5)} #${w.v.jobNumber} ${String(w.v.tech).split(' ')[0].padEnd(8)} ${String(w.v.client || '').slice(0, 28).padEnd(28)} was ${w.v.startLocal.slice(5, 16)}  ${errs.length ? 'FAILED: ' + errs.join('; ') : 'ok'}`);
    if (errs.length) { fail++; die(`visitEditSchedule failed for #${w.v.jobNumber} (${w.v.id}) — ${wrote - 1} written before it`); }
    await sleep(210);
  }
  log(`  written ${wrote}  failed ${fail}`);
  // ---------------- 5. verify ----------------
  const after = (await pullVisits()).filter(v => !v.isComplete && v.tech && DRIVERS.includes(v.tech));
  let match = 0, mismatch = [];
  for (const v of after) { const p = planned.get(orderNoOf(v)); if (!p) continue; const t = p.arrival.replace('T', ' ').slice(11, 16); if (v.startLocal.slice(11, 16) === t && v.date === p.date) match++; else mismatch.push(`#${v.jobNumber} jobber ${v.startLocal.slice(5, 16)} plan ${p.date} ${t}`); }
  log(`\n=== VERIFY === ${match} visits match the plan, ${mismatch.length} do not`);
  for (const m of mismatch.slice(0, 20)) log(`  ${m}`);
}
log(`\n✅ done ${stamp()} PT — log: ${LOG_PATH}`);
log(`Next: the arrival-window sweep (node projects/tool-jobber/scripts/arrival-window-sweep.mjs) so every visit carries the 3-hour window.`);
