#!/usr/bin/env node
// cory-fri.mjs — re-plan ONE driver's day without touching anyone else's route.
// Spencer 2026-10-29: Cory's Fri 10-30 was rebuilt by hand in Jobber; he starts from home (Wilkeson) at 9:00.
// OptimoRoute's per-date work hours / start location are not settable by API on this account, so the 9:00 start is
// expressed as a twFrom floor on Cory's orders: floor = 09:00 + drive from home to the first stop.
//
//   node cory-fri.mjs                         # DRY: reconcile Cory's orders, show what would change
//   node cory-fri.mjs --execute --floor=09:00 # create/update Cory's orders, plan Cory only, verify other routes unmoved
//   node cory-fri.mjs --times                 # write Cory's planned times to Jobber from routes-{date}-cory.json
// Other drivers' orders and Jobber times are never written. Ledger: cory-fri.log
import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration } from '../../../../technician-route-automation/service-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const ENV_PATH = path.join(REPO, '.' + 'env');
const LOG_PATH = path.join(__dirname, 'cory-fri.log');
const TZ = 'America/Los_Angeles';
const arg = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const DATE = arg('date') || '2026-10-30';
const DRIVER = arg('driver') || 'Cory Ventura';
const FLOOR = arg('floor') || '09:00';
const EXECUTE = process.argv.includes('--execute');
const TIMES = process.argv.includes('--times');
const TW = [{ twFrom: FLOOR, twTo: '21:00' }];
// --win=8816@12:00,8677@09:05-09:30 pins a job's window. The API cannot drop the profile end-at-home, so this is how
// stops near home go FIRST (early twTo) and the far stop goes LAST (late twFrom).
const WIN = Object.fromEntries((arg('win') || '').split(',').filter(Boolean).map(x => { const [j, w] = x.split('@'); const [f, t] = w.split('-'); return [j, { twFrom: f, twTo: t || '21:00' }]; }));
const twFor = jobNumber => [WIN[String(jobNumber)] || { twFrom: FLOOR, twTo: '21:00' }];
const SAVED = path.join(__dirname, `routes-${DATE}-cory.json`);

const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
const log = (...a) => { const l = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); fs.appendFileSync(LOG_PATH, l + '\n'); process.stdout.write(l + '\n'); };
const die = m => { log(`\n🛑 ABORT ${stamp()} — ${m}`); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadEnv() { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'); }
let tok = null;
async function token(force = false) {
  if (!force && tok) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json(); if (!d.access_token) die(`Jobber token refresh failed (http ${r.status})`);
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  return (tok = d.access_token);
}
async function jgql(query, variables = {}, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) });
  if (res.status === 401 && attempt < 3) { await token(true); return jgql(query, variables, attempt + 1); }
  const d = await res.json().catch(() => ({}));
  if ((res.status === 429 || JSON.stringify(d.errors || '').includes('THROTTLED')) && attempt < 8) { await sleep(Math.min(60000, 2500 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
  return d;
}
async function orCall(endpoint, body, attempt = 0) {
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${loadEnv().OPTIMOROUTE_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orCall(endpoint, body, attempt + 1); }
  return d;
}
async function orGet(q, attempt = 0) {
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${loadEnv().OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
const ptLocal = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function visitNumOf(id) { let n = null; try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {} if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10); return n; }
const orderNoOf = v => `${v.jobNumber}-${v.visitNum}`;
const stopKey = rr => Object.fromEntries((rr.routes || []).filter(r => r.driverSerial !== DRIVER).map(r => [r.driverSerial, (r.stops || []).map(s => `${s.orderNo}@${s.scheduledAt}`).join(',')]));

log(`\n=== CORY-ONLY ${stamp()} PT === ${DRIVER} ${DATE} floor ${FLOOR}  mode ${TIMES ? 'TIMES' : EXECUTE ? 'LIVE' : 'DRY'}`);

// ---------------- live Jobber, this driver only ----------------
const VQ = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt isComplete job{ jobNumber } client{ name }
      assignedUsers(first:6){ nodes{ name{ full } } }
      property{ address{ street1 street2 city province postalCode } } }
    pageInfo{ hasNextPage endCursor } } }`;
async function pullVisits() {
  const rows = []; let cursor = null;
  for (;;) {
    const d = await jgql(VQ, { a: cursor, after: DATE + 'T00:00:00-07:00', before: DATE + 'T23:59:59-07:00' });
    if (!d.data?.visits) die('visits query returned no data: ' + JSON.stringify(d).slice(0, 300));
    for (const v of d.data.visits.nodes) {
      const a = v.property?.address || {};
      rows.push({ id: v.id, visitNum: visitNumOf(v.id), jobNumber: v.job?.jobNumber ?? null, client: v.client?.name || null, title: v.title || '', startLocal: ptLocal(v.startAt), isComplete: v.isComplete,
        tech: (v.assignedUsers?.nodes || []).map(u => u.name?.full).filter(Boolean)[0] || null,
        address: [a.street1, a.street2, a.city, a.province || 'WA', a.postalCode].filter(Boolean).join(', ') });
    }
    if (!d.data.visits.pageInfo.hasNextPage) break; cursor = d.data.visits.pageInfo.endCursor;
  }
  return rows.filter(v => v.startLocal.slice(0, 10) === DATE && !v.isComplete && v.tech === DRIVER);
}
const mine = await pullVisits();
log(`Jobber: ${mine.length} open visits on ${DRIVER}`);
if (!mine.length) die('no visits for this driver on this date');

// ---------------- write Jobber times from the saved Cory plan ----------------
if (TIMES) {
  const rr = JSON.parse(fs.readFileSync(SAVED, 'utf8'));
  const rt = (rr.routes || []).find(r => r.driverSerial === DRIVER); if (!rt) die(`no ${DRIVER} route in ${SAVED}`);
  const planned = new Map(rt.stops.filter(s => s.orderNo).map(s => [String(s.orderNo), String(s.scheduledAtDt).slice(11, 19)]));
  const missing = mine.filter(v => !planned.has(orderNoOf(v))); if (missing.length) die(`${missing.length} visits not on the saved route: ${missing.map(v => '#' + v.jobNumber).join(', ')}`);
  let n = 0;
  for (const v of mine) {
    const time = planned.get(orderNoOf(v));
    if (v.startLocal.slice(11, 16) === time.slice(0, 5)) { log(`  same  ${time.slice(0, 5)} #${v.jobNumber} ${v.client}`); continue; }
    const endPT = new Date(new Date(`${DATE}T${time}-07:00`).getTime() + 3 * 3600000).toLocaleString('sv-SE', { timeZone: TZ });
    const q = `mutation { visitEditSchedule(id: "${v.id}", input: { startAt: { date: "${DATE}", time: "${time}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`;
    const r = await jgql(q); const errs = [...(r.errors || []).map(e => e.message), ...(r.data?.visitEditSchedule?.userErrors || []).map(e => e.message)];
    n++; log(`  write ${time.slice(0, 5)} #${v.jobNumber} ${String(v.client).padEnd(26)} was ${v.startLocal.slice(11, 16)}  ${errs.length ? 'FAILED: ' + errs.join('; ') : 'ok'}`);
    if (errs.length) die(`visitEditSchedule failed for #${v.jobNumber}`);
    await sleep(210);
  }
  const after = await pullVisits(); let ok = 0;
  for (const v of after) if (v.startLocal.slice(11, 16) === planned.get(orderNoOf(v))?.slice(0, 5)) ok++; // Jobber drops seconds
  log(`VERIFY: ${ok}/${after.length} Jobber visits match the plan (${n} written)`);
  process.exit(0);
}

// ---------------- reconcile this driver's orders ----------------
const orders = new Map();
{ let after = null; do { const body = { dateRange: { from: DATE, to: DATE }, includeOrderData: true }; if (after) body.after_tag = after; const r = await orCall('search_orders', body); if (r.success === false) die('search_orders failed: ' + JSON.stringify(r).slice(0, 200)); for (const o of r.orders || []) { const d = o.data || o; orders.set(String(d.orderNo || ''), d); } after = r.after_tag || null; } while (after); }
const liveNos = new Set(mine.map(orderNoOf));
const creates = [], updates = [];
for (const v of mine) {
  const no = orderNoOf(v); const isSet = /\bset\b/i.test(v.title);
  const want = { date: DATE, assignedTo: { serial: DRIVER }, duration: serviceDuration(DRIVER, isSet, v.jobNumber, DATE), timeWindows: twFor(v.jobNumber) };
  const o = orders.get(no);
  if (!o) { creates.push({ operation: 'CREATE', orderNo: no, type: 'T', ...want, priority: 'M', allowedDates: { from: DATE, to: DATE }, location: { address: v.address, locationName: ((v.title || '') + ' · #' + v.jobNumber).slice(0, 60), acceptPartialMatch: true, acceptMultipleResults: true }, notes: 'Jobber job ' + v.jobNumber + (isSet ? ' (SET)' : '') + ' [cory-fri]', _v: v }); continue; }
  const diff = [];
  if ((o.assignedTo?.serial ?? null) !== DRIVER) diff.push(`tech ${o.assignedTo?.serial ?? 'unset'}`);
  if (Number(o.duration) !== Number(want.duration)) diff.push(`dur ${o.duration}->${want.duration}`);
  if (!(o.timeWindows?.length === 1 && o.timeWindows[0].twFrom === want.timeWindows[0].twFrom && o.timeWindows[0].twTo === want.timeWindows[0].twTo)) diff.push(`tw -> ${want.timeWindows[0].twFrom}-${want.timeWindows[0].twTo}`);
  if (diff.length) updates.push({ operation: 'UPDATE', orderNo: no, ...want, allowedDates: { from: DATE, to: DATE }, _diff: diff.join(', '), _v: v });
}
const strays = [...orders.values()].filter(o => o.assignedTo?.serial === DRIVER && !liveNos.has(String(o.orderNo)));
log(`OptimoRoute: CREATE ${creates.length}  UPDATE ${updates.length}  unchanged ${mine.length - creates.length - updates.length}  stray ${DRIVER} orders ${strays.length}`);
for (const c of creates) log(`  CREATE ${c.orderNo} ${c.duration}m ${c._v.client}  ${c.location.address}`);
for (const u of updates) log(`  UPDATE ${u.orderNo} ${u._diff}`);
for (const s of strays) log(`  STRAY ${s.orderNo} ${s.location?.locationName || ''} — left alone, check by hand`);
if (strays.length) die('stray orders on this driver; resolve before planning');
if (!EXECUTE) { log('DRY — nothing written.'); process.exit(0); }

for (const c of creates) {
  const { _v, ...body } = c; let r = await orCall('create_order', body);
  if (r.success === false && r.code === 'ERR_ORD_EXISTS') { const { location, type, notes, ...upd } = body; r = await orCall('create_order', { ...upd, operation: 'UPDATE' }); }
  log(`  CREATE ${c.orderNo} ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`); if (r.success === false) die(`CREATE failed ${c.orderNo}`); await sleep(300);
}
for (const u of updates) { const { _v, _diff, ...body } = u; const r = await orCall('create_order', body); log(`  UPDATE ${u.orderNo} ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`); if (r.success === false) die(`UPDATE failed ${u.orderNo}`); await sleep(150); }

// ---------------- plan this driver only ----------------
const before = await orGet(`get_routes?date=${DATE}`);
fs.writeFileSync(path.join(__dirname, `routes-${DATE}-before-cory.json`), JSON.stringify(before, null, 1));
const sp = await orCall('start_planning', { date: DATE, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE', useDrivers: [{ driverSerial: DRIVER }], useOrders: mine.map(orderNoOf) });
log(`start_planning: ${JSON.stringify(sp).slice(0, 200)}`);
if (!sp.success) die('start_planning failed');
let done = false;
for (let i = 0; i < 90; i++) { await sleep(4000); const st = await orGet(`get_planning_status?planningId=${sp.planningId}`); if (st.status === 'F' || st.finished === true) { done = true; break; } if (st.status === 'E' || st.success === false) die(`planning errored: ${JSON.stringify(st).slice(0, 200)}`); }
if (!done) die('planning did not finish in 6 minutes');
const rr = await orGet(`get_routes?date=${DATE}`);
fs.writeFileSync(SAVED, JSON.stringify(rr, null, 1));
const b = stopKey(before), a = stopKey(rr);
const moved = Object.keys({ ...a, ...b }).filter(k => a[k] !== b[k]);
log(`other drivers: ${Object.keys(b).length} routes before, ${Object.keys(a).length} after, ${moved.length} changed ${moved.length ? '⚠ ' + moved.join(', ') : '(none — isolated)'}`);
const rt = (rr.routes || []).find(r => r.driverSerial === DRIVER);
if (!rt) die(`${DRIVER} has no route after planning`);
log(`${DRIVER}: ${rt.stops.length} stops  ${rt.duration} min  ${Number(rt.distance).toFixed(0)} km  first-leg drive ${Math.round((rt.stops[0]?.travelTime || 0) / 60)} min`);
for (const s of rt.stops) log(`  ${s.stopNumber}. ${s.scheduledAt}  ${s.locationName}  (${Math.round((s.travelTime || 0) / 60)} min drive)`);
const un = mine.filter(v => !rt.stops.some(s => String(s.orderNo) === orderNoOf(v)));
if (un.length) log(`⚠ ${un.length} unscheduled: ${un.map(v => '#' + v.jobNumber).join(', ')}`);
log(`Saved ${SAVED}. Next: --times writes these to Jobber.`);
