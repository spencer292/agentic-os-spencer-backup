// append-stragglers.mjs — OptimoRoute will not place Tavis's four Friday visits (its per-driver day cap holds even
// after the window change, and the API cannot read or set that cap). Spencer's decision: Tavis runs late and the
// customers get accurate times. So: take Tavis's planned Friday route, append the four stops after his last stop in
// nearest-neighbour order using the travel model built from OptimoRoute's own driven legs, and write those times
// to Jobber (startAt = arrival, endAt = +3 h). Read-only against OptimoRoute; Jobber writes go through the gate.
import '../../../lib/write-gate.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { travel } from '../../scripts/travel.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const ENV_PATH = path.join(REPO, '.' + 'env');
const arg = (n, d) => (process.argv.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1] || d;
const TZ = 'America/Los_Angeles', DATE = arg('date', '2026-09-25'), TECH = arg('tech', 'Tavis Alexander'), SERVICE_MIN = +arg('service', 15);
const EXECUTE = process.argv.includes('--execute');
const LOG = path.join(__dirname, 'append-stragglers.log'); fs.writeFileSync(LOG, '');
const log = (...a) => { const l = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); fs.appendFileSync(LOG, l + '\n'); process.stdout.write(l + '\n'); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function loadEnv() { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'); }
let tok = null;
async function token() { if (tok) return tok; const env = loadEnv(); const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) }); const d = await r.json(); if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token); tok = d.access_token; return tok; }
async function jgql(query, variables = {}) { const t = await token(); const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) }); return res.json(); }
const orPost = async (e, b) => { const env = loadEnv(); return (await fetch(`https://api.optimoroute.com/v1/${e}?key=${env.OPTIMOROUTE_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json(); };
const orGet = async q => { const env = loadEnv(); return (await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`)).json(); };
const ptLocal = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function visitNumOf(id) { let n = null; try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {} if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10); return n; }

// Tavis's planned route and the unscheduled orders
const rr = await orGet(`get_routes?date=${DATE}`); const rt = (rr.routes || []).find(r => r.driverName === TECH);
if (!rt) { log('no Tavis route'); process.exit(1); }
const last = rt.stops[rt.stops.length - 1];
let after = null; const orders = [];
do { const body = { dateRange: { from: DATE, to: DATE }, includeOrderData: true, includeScheduleInformation: true }; if (after) body.after_tag = after; const s = await orPost('search_orders', body); for (const o of s.orders || []) orders.push(o); after = s.after_tag || null; } while (after);
const strag = orders.filter(o => o.data?.assignedTo?.serial === TECH && !o.scheduleInformation).map(o => ({ orderNo: o.data.orderNo, lat: o.data.location.latitude, lng: o.data.location.longitude, address: o.data.location.address }));
log(`${TECH} ${DATE}: route ${rt.stops.length} stops, last arrival ${last.scheduledAtDt} at ${last.address || last.locationName}; unscheduled ${strag.length}`);
// nearest-neighbour append
let cur = { lat: last.latitude ?? last.lat, lng: last.longitude ?? last.lng };
let t = new Date(String(last.scheduledAtDt).replace(' ', 'T') + '-07:00').getTime() + (+arg('lastService', 15)) * 60000; // leave last stop (its own service, not the appended stop's)
const plan = []; const pool = [...strag];
while (pool.length) {
  let best = null;
  for (const s of pool) { const tr = travel([cur.lat, cur.lng], [s.lat, s.lng], TECH); if (!best || tr.seconds < best.tr.seconds) best = { s, tr }; }
  t += best.tr.seconds * 1000; plan.push({ ...best.s, arrival: new Date(t).toLocaleString('sv-SE', { timeZone: TZ }), legMin: Math.round(best.tr.seconds / 60), legKm: +(best.tr.metres / 1000).toFixed(1), source: best.tr.source });
  t += SERVICE_MIN * 60000; cur = { lat: best.s.lat, lng: best.s.lng }; pool.splice(pool.indexOf(best.s), 1);
}
for (const p of plan) log(`  ${p.arrival.slice(11, 16)}  ${p.orderNo}  ${p.address}  (leg ${p.legMin} min / ${p.legKm} km, ${p.source})`);
log(`  day ends ~${new Date(t).toLocaleString('sv-SE', { timeZone: TZ }).slice(11, 16)}`);
if (!EXECUTE) { log('DRY — nothing written'); process.exit(0); }
// Jobber visits for those orderNos
const VQ = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ id startAt job{ jobNumber } client{ name } } pageInfo{ hasNextPage endCursor } } }`;
const byNo = new Map(); let cursor = null;
for (;;) { const d = await jgql(VQ, { a: cursor, after: DATE + 'T00:00:00-07:00', before: DATE + 'T23:59:59-07:00' }); for (const v of d.data?.visits?.nodes || []) byNo.set(`${v.job?.jobNumber}-${visitNumOf(v.id)}`, v); if (!d.data?.visits?.pageInfo?.hasNextPage) break; cursor = d.data.visits.pageInfo.endCursor; }
for (const p of plan) {
  const v = byNo.get(p.orderNo); if (!v) { log(`  no Jobber visit for ${p.orderNo}`); continue; }
  const time = p.arrival.slice(11, 19); const endPT = new Date(new Date(`${DATE}T${time}-07:00`).getTime() + 3 * 3600000).toLocaleString('sv-SE', { timeZone: TZ });
  const r = await jgql(`mutation { visitEditSchedule(id: "${v.id}", input: { startAt: { date: "${DATE}", time: "${time}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`);
  const errs = [...(r.errors || []).map(e => e.message)]; for (const k of Object.keys(r.data || {})) for (const e of (r.data[k]?.userErrors || [])) errs.push(e.message);
  log(`  wrote ${time.slice(0, 5)} #${v.job?.jobNumber} ${v.client?.name}  was ${ptLocal(v.startAt).slice(11, 16)}  ${errs.length ? 'FAILED ' + errs.join('; ') : 'ok'}`);
  await sleep(250);
}
log('✅ done');
