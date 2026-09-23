// reverse-route.mjs — Spencer 2026-09-22: "Reroute Robert's schedule backwards: start in Kent, end in Algona."
// Reverse the planned Wednesday sequence, slot the unscheduled Kupietz stop next to the other Tacoma 98422 stops,
// recompute arrivals from 07:00 at the first stop with the travel model, write times to Jobber, then pin every order
// with a time window around its new time and re-plan the day so OptimoRoute shows the same order.
//   node reverse-route.mjs --date=2026-09-23 --tech="Robert Norton" [--execute]
import '../../../lib/write-gate.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { travel } from '../../scripts/travel.mjs';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const ENV_PATH = path.join(REPO, '.' + 'env'); const TZ = 'America/Los_Angeles';
const arg = (n, d) => (process.argv.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1]?.replace(/^"|"$/g, '') || d;
const DATE = arg('date', '2026-09-23'), TECH = arg('tech', 'Robert Norton'), START = arg('start', '07:00'), EXECUTE = process.argv.includes('--execute');
const log = (...a) => console.log(...a); const sleep = ms => new Promise(r => setTimeout(r, ms));
function loadEnv() { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'); }
let tok = null; async function token() { if (tok) return tok; const env = loadEnv(); const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) }); const d = await r.json(); if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token); tok = d.access_token; return tok; }
async function jgql(query, variables = {}) { const t = await token(); return (await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) })).json(); }
const orPost = async (e, b) => { const env = loadEnv(); return (await fetch(`https://api.optimoroute.com/v1/${e}?key=${env.OPTIMOROUTE_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json(); };
const orGet = async q => { const env = loadEnv(); return (await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`)).json(); };
const ptLocal = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function visitNumOf(id) { let n = null; try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {} if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10); return n; }
const hm = ms => new Date(ms).toLocaleString('sv-SE', { timeZone: TZ }).slice(11, 16);

// planned route + all of the tech's orders (for durations and the unscheduled ones)
const rr = await orGet(`get_routes?date=${DATE}`); const rt = (rr.routes || []).find(r => r.driverName === TECH); if (!rt) { log('no route'); process.exit(1); }
let after = null; const orders = new Map(); const unsched = [];
do { const body = { dateRange: { from: DATE, to: DATE }, includeOrderData: true, includeScheduleInformation: true }; if (after) body.after_tag = after; const s = await orPost('search_orders', body); for (const o of s.orders || []) { if (o.data?.assignedTo?.serial !== TECH) continue; orders.set(String(o.data.orderNo), o.data); if (!o.scheduleInformation) unsched.push(o.data); } after = s.after_tag || null; } while (after);
let seq = rt.stops.slice().reverse().map(s => ({ orderNo: String(s.orderNo), lat: s.latitude, lng: s.longitude, address: s.address, dur: Number(orders.get(String(s.orderNo))?.duration || 15) }));
for (const u of unsched) { // insert next to the nearest existing stop
  const cand = { orderNo: String(u.orderNo), lat: u.location.latitude, lng: u.location.longitude, address: u.location.address, dur: Number(u.duration || 15) };
  let best = 0, bestD = Infinity; seq.forEach((s, i) => { const d = travel([s.lat, s.lng], [cand.lat, cand.lng], TECH).seconds; if (d < bestD) { bestD = d; best = i; } });
  seq.splice(best + 1, 0, cand); log(`inserted ${cand.orderNo} (${cand.address}) after stop ${best + 1}`);
}
let t = new Date(`${DATE}T${START}:00-07:00`).getTime(); const plan = [];
for (let i = 0; i < seq.length; i++) { const s = seq[i]; if (i > 0) t += travel([seq[i - 1].lat, seq[i - 1].lng], [s.lat, s.lng], TECH).seconds * 1000; plan.push({ ...s, at: t }); t += s.dur * 60000; }
for (const p of plan) log(`  ${hm(p.at)}  ${p.orderNo.padEnd(18)} ${p.dur}m  ${p.address}`);
log(`day ends ~${hm(t)} at ${plan[plan.length - 1].address}`);
if (!EXECUTE) { log('DRY — nothing written'); process.exit(0); }
// 1. Jobber times
const VQ = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ id startAt job{ jobNumber } client{ name } } pageInfo{ hasNextPage endCursor } } }`;
const byNo = new Map(); let cursor = null;
for (;;) { const d = await jgql(VQ, { a: cursor, after: DATE + 'T00:00:00-07:00', before: DATE + 'T23:59:59-07:00' }); for (const v of d.data?.visits?.nodes || []) byNo.set(`${v.job?.jobNumber}-${visitNumOf(v.id)}`, v); if (!d.data?.visits?.pageInfo?.hasNextPage) break; cursor = d.data.visits.pageInfo.endCursor; }
let wrote = 0;
for (const p of plan) { const v = byNo.get(p.orderNo); if (!v) { log(`  no Jobber visit for ${p.orderNo}`); continue; }
  const time = new Date(p.at).toLocaleString('sv-SE', { timeZone: TZ }).slice(11, 19); const endPT = new Date(p.at + 3 * 3600000).toLocaleString('sv-SE', { timeZone: TZ });
  const r = await jgql(`mutation { visitEditSchedule(id: "${v.id}", input: { startAt: { date: "${DATE}", time: "${time}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`);
  const errs = [...(r.errors || []).map(e => e.message)]; for (const k of Object.keys(r.data || {})) for (const e of (r.data[k]?.userErrors || [])) errs.push(e.message);
  wrote++; log(`  wrote ${time.slice(0, 5)} #${v.job?.jobNumber} ${v.client?.name}  was ${ptLocal(v.startAt).slice(11, 16)}  ${errs.length ? 'FAILED ' + errs.join('; ') : 'ok'}`); if (errs.length) process.exit(1); await sleep(210); }
// 2. pin OptimoRoute orders to the new order with a window [t-15, t+45] and re-plan the day
for (const p of plan) { const from = hm(p.at - 15 * 60000), to = hm(p.at + 45 * 60000); const r = await orPost('create_order', { operation: 'UPDATE', orderNo: p.orderNo, timeWindows: [{ twFrom: from < '07:00' ? '07:00' : from, twTo: to }] }); if (r.success === false) log(`  window FAILED ${p.orderNo} ${JSON.stringify(r).slice(0, 100)}`); await sleep(120); }
const sp = await orPost('start_planning', { dateRange: { from: DATE, to: DATE }, balancing: 'OFF', startWith: 'EMPTY', lockType: 'NONE' }); if (!sp.success) { log('start_planning failed ' + JSON.stringify(sp).slice(0, 200)); process.exit(1); }
for (let i = 0; i < 90; i++) { await sleep(4000); const st = await orGet(`get_planning_status?planningId=${sp.planningId}`); if (st.status === 'F' || st.finished === true) break; }
const rr2 = await orGet(`get_routes?date=${DATE}`); const rt2 = (rr2.routes || []).find(r => r.driverName === TECH);
log(`OptimoRoute after re-plan: ${rt2?.stops?.length} stops, first ${String(rt2?.stops?.[0]?.scheduledAtDt || '').slice(11, 16)} at ${rt2?.stops?.[0]?.address}, last ${String(rt2?.stops?.slice(-1)[0]?.scheduledAtDt || '').slice(11, 16)} at ${rt2?.stops?.slice(-1)[0]?.address}`);
const orderOk = rt2?.stops?.every((s, i) => String(s.orderNo) === plan[i]?.orderNo); log(`sequence matches Jobber: ${orderOk}`);
log(`✅ done, ${wrote} Jobber times written`);
