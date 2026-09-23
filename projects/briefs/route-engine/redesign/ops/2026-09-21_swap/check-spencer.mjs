// READ-ONLY: why does Spencer Hill have no route after the swap? Reads get_routes and search_orders (+schedule info).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const envText = fs.readFileSync(path.join(REPO, '.' + 'env'), 'utf8');
const env = {}; for (const l of envText.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY; const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = async q => (await fetch(`https://api.optimoroute.com/v1/${q}&key=${K}`)).json();
const post = async (e, b) => (await fetch(`https://api.optimoroute.com/v1/${e}?key=${K}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json();
for (const d of ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24']) {
  const r = await get(`get_routes?date=${d}`);
  console.log(d, 'routes:', (r.routes || []).map(x => `${x.driverName || x.driverSerial}:${(x.stops || []).length}`).join('  '));
  let after = null; const orders = [];
  do { const body = { dateRange: { from: d, to: d }, includeOrderData: true, includeScheduleInformation: true }; if (after) body.after_tag = after; const s = await post('search_orders', body); for (const o of s.orders || []) orders.push(o); after = s.after_tag || null; await sleep(200); } while (after);
  const byTech = {}; for (const o of orders) { const t = o.data?.assignedTo?.serial || '(none)'; const sch = o.scheduleInformation ? 'scheduled' : 'UNSCHEDULED'; byTech[t] = byTech[t] || {}; byTech[t][sch] = (byTech[t][sch] || 0) + 1; }
  console.log('   orders by assignedTo:', JSON.stringify(byTech));
  const sp = orders.filter(o => o.data?.assignedTo?.serial === 'Spencer Hill').slice(0, 1);
  for (const o of sp) console.log('   sample Spencer order:', JSON.stringify({ orderNo: o.data.orderNo, date: o.data.date, duration: o.data.duration, location: o.data.location?.address, sched: o.scheduleInformation || null }).slice(0, 300));
}
