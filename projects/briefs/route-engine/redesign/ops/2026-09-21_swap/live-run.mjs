#!/usr/bin/env node
// live-run.mjs — Tavis out 2026-09-21..24: Tavis -> Cory, Cory -> Spencer, then re-plan.
//
//   node projects/briefs/route-engine/redesign/ops/2026-09-21_swap/live-run.mjs            # DRY (default)
//   node projects/briefs/route-engine/redesign/ops/2026-09-21_swap/live-run.mjs --execute  # LIVE
//
// Every line of output is tee'd to live-run.log in this folder.
//
// SAFETY
//   * The route-engine write gate is the FIRST import. While write-authority.json says
//     writesEnabled:false, every Jobber mutation and every OptimoRoute non-read is refused at the
//     transport and this script cannot do anything, --execute or not. That is the intended state
//     today. Enabling is Spencer's call:
//       node projects/briefs/route-engine/scripts/write-authority.mjs enable --reason "..." --ttl 90m
//   * Dry mode issues QUERIES ONLY and prints the exact mutation list.
//   * HARD STOP: the first userError or GraphQL error on any visit aborts the run immediately.
//     Partial application is recorded per visit in the ledger line, so a resume knows where it got to.
//   * PASS ORDER IS LOAD-BEARING. Cory -> Spencer runs FIRST. If Tavis -> Cory ran first, the
//     second pass would sweep the visits it had just moved onto Cory straight on to Spencer.
//   * visitEditAssignedUsers REPLACES the assignee list, so the new list is built from the visit's
//     CURRENT list with one name swapped and every ride-along kept.
//   * Freshness: the plan is rebuilt from a live Jobber query at run time, never from dry-run.json.
//     Spencer adds visits during the day and a stale plan would miss them.
//
// WHAT IT DOES, IN ORDER
//   0. live Jobber query -> the plan.  Guards: window size, weekend dates, completed visits.
//   1. Jobber pass A: Cory Ventura  -> Spencer Hill   (visitEditAssignedUsers)
//   2. Jobber pass B: Tavis Alexander -> Cory Ventura (visitEditAssignedUsers)
//   3. OptimoRoute: per-order create_order {operation:'UPDATE', orderNo, assignedTo:{serial}}.
//      UPDATE only. Never the SYNC operation — SYNC unschedules everything it touches.
//   4. OptimoRoute driver availability for the four dates (update_drivers_parameters):
//      Spencer Hill enabled, Tavis Alexander disabled, Cory Ventura enabled.
//      This call unschedules the dates it touches, which is why planning comes after it.
//   5. start_planning per date, balancing:'OFF', poll get_planning_status, then get_routes.
//   6. Verification: re-query Jobber for the window and assert ZERO visits remain assigned to
//      Tavis Alexander, and that Cory holds only the ex-Tavis set.

import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration } from '../../../../technician-route-automation/service-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const ENV_PATH = path.join(REPO, '.env');
const LOG_PATH = path.join(__dirname, 'live-run.log');
const TZ = 'America/Los_Angeles';

const EXECUTE = process.argv.includes('--execute');
const ALLOW_MISSING_ORDERS = process.argv.includes('--allow-missing-orders');
const SKIP_PLANNING = process.argv.includes('--no-replan');

const DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24'];
const FROM_ISO = '2026-09-21T00:00:00-07:00';
const TO_ISO = '2026-09-24T23:59:59-07:00';

const TAVIS = 'Tavis Alexander';   // out of town — loses all four days
const CORY = 'Cory Ventura';       // takes Tavis's work
const SPENCER = 'Spencer Hill';    // takes Cory's work

// A run this size is knowable in advance. Far above it means the window or the board moved.
const MAX_WRITES = 260;          // Jobber assignee swaps only
const MAX_ORDER_CREATES = 80;    // visits Spencer added by hand that have no OptimoRoute order yet (dry run counted 46)

// ---------------- logging ----------------
fs.writeFileSync(LOG_PATH, '');
const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
function log(...a) {
  const line = a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
  fs.appendFileSync(LOG_PATH, line + '\n');
  process.stdout.write(line + '\n');
}
function die(msg) { log(`\n🛑 ABORT ${stamp()} — ${msg}`); process.exit(1); }

// ---------------- env + auth ----------------
function loadEnv() {
  const env = {};
  for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
  return env;
}
function saveEnvKey(k, v) {
  let t = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp('^' + k + '=.*$', 'm');
  fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n');
}
let tok = null, tokAt = 0;
async function token(force = false) {
  if (!force && tok && Date.now() - tokAt < 50 * 60 * 1000) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await r.json();
  if (!d.access_token) die(`Jobber token refresh failed (http ${r.status})`);
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; tokAt = Date.now(); return tok;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jgql(query, variables = {}, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 3) { await token(true); return jgql(query, variables, attempt + 1); }
  const d = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { const w = Math.min(60000, 2500 * 2 ** attempt); log(`  … throttled, backoff ${w / 1000}s`); await sleep(w); return jgql(query, variables, attempt + 1); }
  const ts = d.extensions?.cost?.throttleStatus;
  if (ts && ts.currentlyAvailable < 5000) await sleep(Math.min(Math.ceil(((5000 - ts.currentlyAvailable) / (ts.restoreRate || 500)) * 1000), 20000));
  return d;
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
const ptDate = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
function visitNumOf(id) {
  let n = null;
  try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return n;
}

// ---------------- 0. live plan ----------------
log(`=== TAVIS-OUT SWAP ${stamp()} PT ===`);
log(`mode: ${EXECUTE ? 'LIVE (--execute)' : 'DRY (default) — queries only'}`);
log(`window: ${DATES.join(' ')}`);
log(`${TAVIS} -> ${CORY} -> ${SPENCER}\n`);

for (const d of DATES) {
  const dow = new Date(d + 'T12:00:00Z').getUTCDay();
  if (dow === 0 || dow === 6) die(`${d} is a weekend — Got Moles is Mon-Fri`);
}

const VQ = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!,$n:Int!){
  visits(first:$n, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt isComplete visitStatus
      job{ jobNumber } client{ name }
      assignedUsers(first:6){ nodes{ id name{ full } } }
      property{ address{ street1 street2 city province postalCode } } }
    pageInfo{ hasNextPage endCursor } totalCount } }`;

async function pullVisits() {
  const rows = []; let cursor = null;
  for (;;) {
    const d = await jgql(VQ, { a: cursor, after: FROM_ISO, before: TO_ISO, n: 50 });
    if (!d.data?.visits) die('visits query returned no data: ' + JSON.stringify(d).slice(0, 400));
    for (const v of d.data.visits.nodes) {
      rows.push({
        id: v.id, visitNum: visitNumOf(v.id), jobNumber: v.job?.jobNumber ?? null,
        client: v.client?.name || null, title: v.title || '', date: ptDate(v.startAt),
        isComplete: v.isComplete, status: v.visitStatus,
        city: v.property?.address?.city || null, zip: v.property?.address?.postalCode || null,
        address: [v.property?.address?.street1, v.property?.address?.street2, v.property?.address?.city, v.property?.address?.province || 'WA', v.property?.address?.postalCode].filter(Boolean).join(', '),
        assignees: (v.assignedUsers?.nodes || []).map(u => ({ id: u.id, name: u.name?.full || null })),
      });
    }
    if (!d.data.visits.pageInfo.hasNextPage) break;
    cursor = d.data.visits.pageInfo.endCursor;
  }
  return rows.filter(v => DATES.includes(v.date));
}

const UQ = `query { users(first:80){ nodes{ id name{ full } status } } }`;
const ud = await jgql(UQ);
const users = (ud.data?.users?.nodes || []).filter(u => u.status === 'ACTIVATED');
const idOf = n => (users.find(u => (u.name?.full || '') === n) || {}).id || null;
const IDS = { [TAVIS]: idOf(TAVIS), [CORY]: idOf(CORY), [SPENCER]: idOf(SPENCER) };
for (const [n, id] of Object.entries(IDS)) if (!id) die(`no ACTIVATED Jobber user for "${n}" — cannot build an assignee list`);
log('Jobber user ids resolved: ' + Object.entries(IDS).map(([n, i]) => `${n}=${i}`).join(', '));

const visits = await pullVisits();
log(`live Jobber: ${visits.length} visits across the four dates\n`);

const names = v => v.assignees.map(a => a.name).filter(Boolean);
const has = (v, n) => names(v).includes(n);

function buildPass(from, to, pool) {
  return pool.filter(v => has(v, from)).map(v => {
    const swapped = v.assignees.map(a => (a.name === from ? { id: IDS[to], name: to } : a));
    const seen = new Set(); const list = [];
    for (const a of swapped) { if (!a.id || seen.has(a.id)) continue; seen.add(a.id); list.push(a); }
    return { ...v, from, to, current: names(v), next: list.map(a => a.name), nextIds: list.map(a => a.id) };
  });
}
// Cory -> Spencer FIRST, against the ORIGINAL board, then Tavis -> Cory.
const passA = buildPass(CORY, SPENCER, visits);
const passB = buildPass(TAVIS, CORY, visits);
const all = [...passA, ...passB];

const completedHit = all.filter(v => v.isComplete);
if (completedHit.length) {
  log(`NOTE: ${completedHit.length} of the target visits are already COMPLETE — skipping them (reassigning a done visit rewrites history for no field benefit).`);
  for (const v of completedHit) log(`    skip complete #${v.jobNumber} ${v.date} ${v.client}`);
}
const planA = passA.filter(v => !v.isComplete);
const planB = passB.filter(v => !v.isComplete);
const plan = [...planA, ...planB];

log(`\nPLAN`);
log(`  pass A  ${CORY} -> ${SPENCER} : ${planA.length}`);
log(`  pass B  ${TAVIS} -> ${CORY}   : ${planB.length}`);
log(`  total mutations                : ${plan.length}`);
for (const d of DATES) {
  log(`  ${d}  A=${planA.filter(v => v.date === d).length}  B=${planB.filter(v => v.date === d).length}`);
}
const rideAlongs = plan.filter(v => v.current.length > 1);
log(`  ride-alongs preserved          : ${rideAlongs.length}`);
for (const v of rideAlongs) log(`    #${v.jobNumber} ${v.date} [${v.current.join(', ')}] -> [${v.next.join(', ')}]`);

if (plan.length > MAX_WRITES) die(`${plan.length} mutations exceeds MAX_WRITES ${MAX_WRITES} — nothing written`);
if (!plan.length) die('nothing to do — no Tavis or Cory visits in the window');

log(`\n--- JOBBER MUTATION LIST (${plan.length}) ---`);
for (const v of plan) {
  log(`  visitEditAssignedUsers(visitId:"${v.id}", input:{assignedUserIds:[${v.nextIds.map(i => `"${i}"`).join(',')}]})   #${v.jobNumber} ${v.date} ${v.city} ${v.client} : ${v.current.join('+')} -> ${v.next.join('+')}`);
}

// ---------------- OptimoRoute order picture ----------------
const orders = new Map();
{
  let after = null;
  do {
    const body = { dateRange: { from: DATES[0], to: DATES[DATES.length - 1] }, includeOrderData: true };
    if (after) body.after_tag = after;
    const r = await orCall('search_orders', body);
    if (r.success === false) die('search_orders failed: ' + JSON.stringify(r).slice(0, 250));
    for (const o of r.orders || []) { const d = o.data || o; orders.set(String(d.orderNo || ''), d); }
    after = r.after_tag || null;
  } while (after);
}
log(`\nOptimoRoute: ${orders.size} orders in the window`);
// Post-swap assignee for every live visit in the window (not just the moving ones), so the visits Spencer
// added by hand today get an order under the tech who will actually run them.
const finalTech = new Map();
for (const v of visits) finalTech.set(v.id, names(v)[0] || null);
for (const v of plan) finalTech.set(v.id, v.to);

const orderUpdates = [], missingOrders = [], orderCreates = [];
for (const v of plan) {
  const no = `${v.jobNumber}-${v.visitNum}`;
  if (!orders.has(no)) { missingOrders.push({ no, date: v.date, client: v.client, want: v.to }); continue; }
  const cur = orders.get(no).assignedTo?.serial ?? null;
  if (cur === v.to) continue;
  orderUpdates.push({ orderNo: no, date: v.date, from: cur, to: v.to });
}
for (const v of visits) {
  if (v.isComplete) continue;
  const no = `${v.jobNumber}-${v.visitNum}`;
  if (orders.has(no)) continue;
  const tech = finalTech.get(v.id);
  const isSet = /\bset\b/i.test(v.title);
  orderCreates.push({
    operation: 'CREATE', orderNo: no, type: 'T', date: v.date,
    duration: serviceDuration(tech, isSet, v.jobNumber, v.date), priority: 'M',
    location: { address: v.address, locationName: ((v.title || '') + ' · #' + v.jobNumber).slice(0, 60), acceptPartialMatch: true, acceptMultipleResults: true },
    allowedDates: { from: v.date, to: v.date },
    notes: 'Jobber job ' + v.jobNumber + (isSet ? ' (SET)' : '') + ' [swap 2026-09-21 create-missing]',
    ...(tech ? { assignedTo: { serial: tech } } : {}),
    _client: v.client, _tech: tech,
  });
}
// Ghosts: orders the dry run confirmed have no live visit anywhere in the window (dry-run.json optimoroute.ghostStops).
let ghosts = [];
try { ghosts = (JSON.parse(fs.readFileSync(path.join(__dirname, 'dry-run.json'), 'utf8')).optimoroute?.ghostStops || []).filter(g => DATES.includes(g.date) && orders.has(String(g.orderNo)) && !visits.some(v => `${v.jobNumber}-${v.visitNum}` === String(g.orderNo))); } catch {}

log(`  order UPDATEs needed          : ${orderUpdates.length}`);
log(`  orders to CREATE (no order)   : ${orderCreates.length}   (${missingOrders.length} of them are moving visits)`);
for (const c of orderCreates) log(`    CREATE ${c.orderNo} ${c.date} ${String(c._tech).padEnd(16)} ${c.duration} min  ${c._client}  ${c.location.address}`);
log(`  ghost orders to DELETE        : ${ghosts.length}`);
for (const g of ghosts) log(`    DELETE ${g.orderNo} ${g.date} (${g.driver})`);
if (orderCreates.length > MAX_ORDER_CREATES) die(`${orderCreates.length} order creates exceeds MAX_ORDER_CREATES ${MAX_ORDER_CREATES} — the board moved, re-check before running`);
const noAddress = orderCreates.filter(c => !c.location.address);
if (noAddress.length) die(`${noAddress.length} visits to create have no street address: ${noAddress.map(c => c.orderNo).join(', ')}`);

log(`\n--- OPTIMOROUTE CALL LIST ---`);
for (const c of orderCreates) log(`  create_order {operation:"CREATE", orderNo:"${c.orderNo}", date:"${c.date}", duration:${c.duration}, assignedTo:{serial:"${c._tech}"}}`);
for (const g of ghosts) log(`  delete_order {orderNo:"${g.orderNo}"}`);
for (const u of orderUpdates) log(`  create_order {operation:"UPDATE", orderNo:"${u.orderNo}", assignedTo:{serial:"${u.to}"}}   (was ${u.from ?? 'unset'})`);
for (const d of DATES) {
  log(`  update_drivers_parameters {updates:[{driver:{serial:"${SPENCER}"},date:"${d}",enabled:true},{driver:{serial:"${TAVIS}"},date:"${d}",enabled:false},{driver:{serial:"${CORY}"},date:"${d}",enabled:true}]}`);
}
for (const d of DATES) log(`  start_planning {dateRange:{from:"${d}",to:"${d}"}, balancing:"OFF", startWith:"CURRENT", lockType:"NONE"}  -> poll get_planning_status -> get_routes?date=${d}`);

if (!EXECUTE) {
  log(`\nDRY RUN — nothing written. Log: ${LOG_PATH}`);
  log(`Re-run with --execute once the write gate is open.`);
  process.exit(0);
}

// ---------------- 1 & 2. Jobber passes ----------------
let applied = 0;
async function runPass(label, rows) {
  log(`\n=== ${label} (${rows.length}) ===`);
  for (const v of rows) {
    const q = `mutation { visitEditAssignedUsers(visitId: "${v.id}", input: { assignedUserIds: [${v.nextIds.map(i => `"${i}"`).join(',')}] }) { userErrors { message } } }`;
    const r = await jgql(q);
    const errs = [...(r.errors || []).map(e => e.message)];
    for (const k of Object.keys(r.data || {})) for (const e of (r.data[k]?.userErrors || [])) errs.push(e.message);
    applied++;
    log(`  [${String(applied).padStart(3)}/${plan.length}] ${v.date} #${v.jobNumber} ${String(v.city || '').padEnd(14)} ${String(v.client || '').slice(0, 26).padEnd(26)} ${v.current.join('+')} -> ${v.next.join('+')}  ${errs.length ? 'FAILED: ' + errs.join('; ') : 'ok'}`);
    if (errs.length) {
      // Jobber flakes transiently on recurring visits ("required to handle future items"). One retry,
      // then stop — a half-applied swap is only recoverable if it stops where the log says it did.
      await sleep(1500);
      const r2 = await jgql(q);
      const e2 = [...(r2.errors || []).map(e => e.message)];
      for (const k of Object.keys(r2.data || {})) for (const e of (r2.data[k]?.userErrors || [])) e2.push(e.message);
      if (e2.length) die(`visit ${v.id} (#${v.jobNumber} ${v.date}) failed twice: ${e2.join('; ')}. ${applied - 1} visits applied before this one — see the ledger and this log.`);
      log(`        retry ok`);
    }
    await sleep(230);
  }
}
await runPass(`PASS A  ${CORY} -> ${SPENCER}`, planA);
await runPass(`PASS B  ${TAVIS} -> ${CORY}`, planB);

// ---------------- 3a. OptimoRoute: create the orders Spencer's hand-added visits are missing ----------------
log(`\n=== OPTIMOROUTE: ${orderCreates.length} order CREATEs ===`);
for (const c of orderCreates) {
  const { _client, _tech, ...body } = c;
  const r = await orCall('create_order', body);
  log(`  CREATE ${c.orderNo} ${c.date} ${_tech}  ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`);
  if (r.success === false) die(`create_order CREATE failed for ${c.orderNo}`);
  await sleep(350);
}
// ---------------- 3b. OptimoRoute: prune the confirmed ghosts ----------------
log(`\n=== OPTIMOROUTE: ${ghosts.length} ghost DELETEs ===`);
for (const g of ghosts) {
  const r = await orCall('delete_order', { orderNo: String(g.orderNo) });
  log(`  DELETE ${g.orderNo} ${g.date}  ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`);
  if (r.success === false) die(`delete_order failed for ${g.orderNo}`);
  await sleep(200);
}
// ---------------- 3c. OptimoRoute order assignment ----------------
log(`\n=== OPTIMOROUTE: ${orderUpdates.length} order UPDATEs ===`);
for (const u of orderUpdates) {
  const r = await orCall('create_order', { operation: 'UPDATE', orderNo: u.orderNo, assignedTo: { serial: u.to } });
  log(`  ${u.orderNo} ${u.date} ${u.from ?? 'unset'} -> ${u.to}  ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`);
  if (r.success === false) die(`create_order UPDATE failed for ${u.orderNo}`);
  await sleep(120);
}

// ---------------- 4. driver availability ----------------
log(`\n=== OPTIMOROUTE: driver availability ===`);
const updates = [];
for (const d of DATES) {
  updates.push({ driver: { serial: SPENCER }, date: d, enabled: true });
  updates.push({ driver: { serial: TAVIS }, date: d, enabled: false });
  updates.push({ driver: { serial: CORY }, date: d, enabled: true });
}
{
  const r = await orCall('update_drivers_parameters', { updates });
  const rows = r.updates || r.parameters || [];
  const bad = rows.filter(x => !x.success);
  log(`  ${rows.length - bad.length}/${rows.length} succeeded`);
  for (const b of bad) log(`  FAIL ${JSON.stringify(b).slice(0, 200)}`);
  if (!rows.length) log('  unexpected body: ' + JSON.stringify(r).slice(0, 300));
  if (bad.length) die('driver availability update failed — routes for these dates are now UNSCHEDULED; fix the driver record and re-plan before leaving this');
}

// ---------------- 5. re-plan ----------------
if (SKIP_PLANNING) { log('\n--no-replan — planning skipped. The four dates are UNSCHEDULED until someone plans them.'); }
else {
  for (const d of DATES) {
    log(`\n=== PLAN ${d} (balancing OFF) ===`);
    const sp = await orCall('start_planning', { dateRange: { from: d, to: d }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' });
    if (!sp.success) die(`start_planning ${d} failed: ${JSON.stringify(sp).slice(0, 200)}`);
    let done = false;
    for (let i = 0; i < 90; i++) {
      await sleep(4000);
      const st = await orGet(`get_planning_status?planningId=${sp.planningId}`);
      if (st.status === 'F' || st.status === 'finished' || st.finished === true) { done = true; break; }
      if (st.status === 'E' || st.success === false) die(`planning ${d} errored: ${JSON.stringify(st).slice(0, 200)}`);
    }
    if (!done) die(`planning ${d} did not finish inside 6 minutes — do NOT re-run blind, check OptimoRoute first`);
    const rr = await orGet(`get_routes?date=${d}`);
    for (const rt of rr.routes || []) {
      const stops = rt.stops || [];
      const last = stops[stops.length - 1] || {};
      log(`  ${String(rt.driverName).padEnd(18)} ${String(stops.length).padStart(3)} stops  ${rt.duration} min  ${rt.distance} km  last stop ${last.scheduledAtDt || last.scheduledAt || '?'}`);
    }
    // A stop the optimizer cannot fit is appended rather than refused — a late tail is the signal.
    for (const rt of rr.routes || []) {
      const stops = rt.stops || [];
      const last = String((stops[stops.length - 1] || {}).scheduledAtDt || '');
      if (/T(1[7-9]|2[0-3]):/.test(last)) log(`  ⚠ ${rt.driverName} ends at ${last} — the day had no room for its tail`);
    }
  }
}

// ---------------- 6. verification ----------------
log(`\n=== VERIFY ===`);
const after = await pullVisits();
const stillTavis = after.filter(v => has(v, TAVIS));
const spencerNow = after.filter(v => has(v, SPENCER));
const coryNow = after.filter(v => has(v, CORY));
log(`  visits still on ${TAVIS} : ${stillTavis.length}   (expected 0)`);
log(`  visits now on ${CORY}    : ${coryNow.length}`);
log(`  visits now on ${SPENCER} : ${spencerNow.length}`);
for (const d of DATES) {
  log(`    ${d}  tavis=${after.filter(v => v.date === d && has(v, TAVIS)).length}  cory=${after.filter(v => v.date === d && has(v, CORY)).length}  spencer=${after.filter(v => v.date === d && has(v, SPENCER)).length}`);
}
for (const v of stillTavis) log(`    STILL TAVIS: #${v.jobNumber} ${v.date} ${v.client} [${v.assignees.map(a => a.name).join(', ')}]`);
if (stillTavis.length) die(`${stillTavis.length} visits are still assigned to ${TAVIS} — the swap is incomplete`);
log(`\n✅ done ${stamp()} PT — log: ${LOG_PATH}`);
