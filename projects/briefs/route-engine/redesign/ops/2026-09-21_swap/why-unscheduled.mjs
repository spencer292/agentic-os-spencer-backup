// READ-ONLY: inspect the OptimoRoute orders for Tavis's four unplaced Friday visits.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const envText = fs.readFileSync(path.join(REPO, '.' + 'env'), 'utf8');
const env = {}; for (const l of envText.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;
const post = async (e, b) => (await fetch(`https://api.optimoroute.com/v1/${e}?key=${K}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json();
const get = async q => (await fetch(`https://api.optimoroute.com/v1/${q}&key=${K}`)).json();
const jobs = ['8058', '8368', '4979', '8123'];
let after = null; const orders = [];
do { const body = { dateRange: { from: '2026-09-25', to: '2026-09-25' }, includeOrderData: true, includeScheduleInformation: true }; if (after) body.after_tag = after; const s = await post('search_orders', body); for (const o of s.orders || []) orders.push(o); after = s.after_tag || null; } while (after);
for (const o of orders) { const d = o.data || {}; if (!jobs.includes(String(d.orderNo || '').split('-')[0])) continue;
  console.log(JSON.stringify({ orderNo: d.orderNo, date: d.date, assignedTo: d.assignedTo, duration: d.duration, allowedDates: d.allowedDates, timeWindows: d.timeWindows, priority: d.priority, location: { address: d.location?.address, lat: d.location?.latitude, lng: d.location?.longitude, valid: d.location?.valid, notes: d.location?.notes }, sched: o.scheduleInformation || null }, null, 0)); }
const tavis = orders.filter(o => o.data?.assignedTo?.serial === 'Tavis Alexander');
console.log(`Tavis orders on 09-25: ${tavis.length}, scheduled ${tavis.filter(o => o.scheduleInformation).length}`);
const rr = await get('get_routes?date=2026-09-25'); const rt = (rr.routes || []).find(r => r.driverName === 'Tavis Alexander');
console.log('Tavis route: stops', rt?.stops?.length, 'duration', rt?.duration, 'first', rt?.stops?.[0]?.scheduledAtDt, 'last', rt?.stops?.slice(-1)[0]?.scheduledAtDt);
