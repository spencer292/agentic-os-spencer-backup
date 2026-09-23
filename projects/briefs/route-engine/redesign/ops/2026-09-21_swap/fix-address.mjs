// fix-address.mjs — a customer's address changed in Jobber after the week was planned. Find their visits in the
// window, push the new address to the OptimoRoute order(s), re-plan only the affected date(s) (balancing OFF),
// write changed times for those dates back to Jobber. Dry by default; --execute needs the gate open.
//   node fix-address.mjs --client="Brad Hickel" [--execute]
import '../../../lib/write-gate.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const ENV_PATH = path.join(REPO, '.' + 'env');
const TZ = 'America/Los_Angeles';
const DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];
const EXECUTE = process.argv.includes('--execute');
const CLIENT = (process.argv.find(a => a.startsWith('--client=')) || '').split('=')[1]?.replace(/^"|"$/g, '');
if (!CLIENT) { console.log('need --client="Name"'); process.exit(1); }
const LOG = path.join(__dirname, `fix-address_${CLIENT.replace(/\W+/g, '_')}.log`); fs.writeFileSync(LOG, '');
const log = (...a) => { const l = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); fs.appendFileSync(LOG, l + '\n'); process.stdout.write(l + '\n'); };
const die = m => { log('🛑 ' + m); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function loadEnv() { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'); }
let tok = null;
async function token() { if (tok) return tok; const env = loadEnv(); const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) }); const d = await r.json(); if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token); tok = d.access_token; return tok; }
async function jgql(query, variables = {}, attempt = 0) { const t = await token(); const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) }); const d = await res.json().catch(() => ({})); if ((res.status === 429 || JSON.stringify(d.errors || '').includes('THROTTLED')) && attempt < 6) { await sleep(3000 * (attempt + 1)); return jgql(query, variables, attempt + 1); } return d; }
const orPost = async (e, b) => { const env = loadEnv(); return (await fetch(`https://api.optimoroute.com/v1/${e}?key=${env.OPTIMOROUTE_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json(); };
const orGet = async q => { const env = loadEnv(); return (await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`)).json(); };
const ptLocal = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function visitNumOf(id) { let n = null; try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {} if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10); return n; }

const VQ = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ id title startAt isComplete job{ jobNumber } client{ name } assignedUsers(first:6){ nodes{ name{ full } } } property{ address{ street1 street2 city province postalCode coordinates{ latitude longitude } } } } pageInfo{ hasNextPage endCursor } } }`;
async function pullWeek() { const rows = []; let cursor = null; for (;;) { const d = await jgql(VQ, { a: cursor, after: DATES[0] + 'T00:00:00-07:00', before: DATES[4] + 'T23:59:59-07:00' }); if (!d.data?.visits) die('visits query failed ' + JSON.stringify(d).slice(0, 200)); for (const v of d.data.visits.nodes) { const a = v.property?.address || {}; rows.push({ id: v.id, no: `${v.job?.jobNumber}-${visitNumOf(v.id)}`, jobNumber: v.job?.jobNumber, client: v.client?.name || '', date: ptLocal(v.startAt).slice(0, 10), startLocal: ptLocal(v.startAt), isComplete: v.isComplete, tech: (v.assignedUsers?.nodes || []).map(u => u.name?.full)[0] || null, address: [a.street1, a.street2, a.city, a.province || 'WA', a.postalCode].filter(Boolean).join(', '), lat: a.coordinates?.latitude, lng: a.coordinates?.longitude }); } if (!d.data.visits.pageInfo.hasNextPage) break; cursor = d.data.visits.pageInfo.endCursor; } return rows.filter(v => DATES.includes(v.date) && !v.isComplete); }
const week = await pullWeek();
const target = week.filter(v => v.client.toLowerCase().includes(CLIENT.toLowerCase()));
if (!target.length) die(`no visits for "${CLIENT}" in ${DATES[0]}..${DATES[4]}`);
const orders = new Map(); { let after = null; do { const body = { dateRange: { from: DATES[0], to: DATES[4] }, includeOrderData: true }; if (after) body.after_tag = after; const s = await orPost('search_orders', body); for (const o of s.orders || []) orders.set(String(o.data?.orderNo), o.data); after = s.after_tag || null; } while (after); }
const fixes = [];
for (const v of target) {
  const o = orders.get(v.no);
  log(`${v.client} #${v.jobNumber} ${v.date} ${v.tech}  Jobber: ${v.address}  (${v.lat},${v.lng})`);
  log(`   OptimoRoute: ${o ? o.location?.address + ' (' + o.location?.latitude + ',' + o.location?.longitude + ')' : 'NO ORDER'}`);
  if (!o) { fixes.push({ v, create: true }); continue; }
  const moved = !o.location || Math.abs((o.location.latitude || 0) - (v.lat || 0)) > 0.0002 || Math.abs((o.location.longitude || 0) - (v.lng || 0)) > 0.0002 || (o.location.address || '').toLowerCase() !== v.address.toLowerCase();
  if (moved) fixes.push({ v, create: false }); else log('   same location — nothing to fix');
}
if (!fixes.length) { log('nothing to do'); process.exit(0); }
const dates = [...new Set(fixes.map(f => f.v.date))];
log(`fix ${fixes.length} order(s), re-plan ${dates.join(', ')}`);
if (!EXECUTE) { log('DRY — nothing written'); process.exit(0); }
for (const f of fixes) {
  const v = f.v; const loc = { address: v.address, latitude: v.lat, longitude: v.lng, locationName: ((v.title || '') + ' · #' + v.jobNumber).slice(0, 60), acceptPartialMatch: true, acceptMultipleResults: true };
  const body = f.create ? { operation: 'CREATE', orderNo: v.no, type: 'T', date: v.date, duration: 15, priority: 'M', allowedDates: { from: v.date, to: v.date }, location: loc, assignedTo: { serial: v.tech }, notes: 'Jobber job ' + v.jobNumber + ' [fix-address]' } : { operation: 'UPDATE', orderNo: v.no, location: loc };
  const r = await orPost('create_order', body); log(`  ${body.operation} ${v.no} location -> ${v.address}  ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 200) : 'ok'}`); if (r.success === false) die('order update failed');
}
for (const d of dates) {
  const sp = await orPost('start_planning', { dateRange: { from: d, to: d }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' }); if (!sp.success) die('start_planning ' + JSON.stringify(sp).slice(0, 200));
  let done = false; for (let i = 0; i < 90; i++) { await sleep(4000); const st = await orGet(`get_planning_status?planningId=${sp.planningId}`); if (st.status === 'F' || st.status === 'finished' || st.finished === true) { done = true; break; } if (st.status === 'E') die('planning errored'); } if (!done) die('planning timeout');
  const rr = await orGet(`get_routes?date=${d}`); const planned = new Map();
  for (const rt of rr.routes || []) { for (const s of rt.stops || []) if (s.orderNo && s.scheduledAtDt) planned.set(String(s.orderNo), String(s.scheduledAtDt)); log(`  ${d} ${String(rt.driverName).padEnd(18)} ${String((rt.stops || []).length).padStart(3)} stops  ${rt.duration} min  last ${String((rt.stops || []).slice(-1)[0]?.scheduledAtDt || '').slice(11, 16)}`); }
  let wrote = 0, same = 0;
  for (const v of week.filter(x => x.date === d)) { const arr = planned.get(v.no); if (!arr) continue; const t = arr.replace('T', ' ').slice(11, 19); if (v.startLocal.slice(11, 16) === t.slice(0, 5)) { same++; continue; }
    const endPT = new Date(new Date(`${d}T${t}-07:00`).getTime() + 3 * 3600000).toLocaleString('sv-SE', { timeZone: TZ });
    const r = await jgql(`mutation { visitEditSchedule(id: "${v.id}", input: { startAt: { date: "${d}", time: "${t}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`);
    const errs = [...(r.errors || []).map(e => e.message)]; for (const k of Object.keys(r.data || {})) for (const e of (r.data[k]?.userErrors || [])) errs.push(e.message);
    wrote++; log(`  wrote ${t.slice(0, 5)} #${v.jobNumber} ${(v.tech || '').split(' ')[0].padEnd(8)} ${v.client.slice(0, 26).padEnd(26)} was ${v.startLocal.slice(11, 16)}  ${errs.length ? 'FAILED ' + errs.join('; ') : 'ok'}`); if (errs.length) die('visitEditSchedule failed'); await sleep(210); }
  log(`  ${d}: times written ${wrote}, unchanged ${same}`);
}
log('✅ done');
