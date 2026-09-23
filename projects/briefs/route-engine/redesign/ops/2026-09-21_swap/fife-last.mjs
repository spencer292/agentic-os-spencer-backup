// Make the Fife anchor the LAST stop: customers' windows end 17:00, anchor opens 17:00. Read-only except the order updates.
import '../../../lib/write-gate.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const envText = fs.readFileSync(path.join(REPO, '.' + 'env'), 'utf8'); const env = {}; for (const l of envText.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY; const post = async (e, b) => (await fetch(`https://api.optimoroute.com/v1/${e}?key=${K}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json();
let after = null; const orders = []; do { const body = { dateRange: { from: '2026-09-23', to: '2026-09-23' }, includeOrderData: true }; if (after) body.after_tag = after; const s = await post('search_orders', body); for (const o of s.orders || []) orders.push(o.data); after = s.after_tag || null; } while (after);
const rob = orders.filter(o => o.assignedTo?.serial === 'Robert Norton');
let ok = 0; for (const o of rob) { const anchor = /^END-/.test(o.orderNo); const r = await post('create_order', { operation: 'UPDATE', orderNo: o.orderNo, timeWindows: anchor ? [{ twFrom: '15:00', twTo: '20:30' }] : [{ twFrom: '07:00', twTo: '21:00' }] }); if (r.success === false) { console.log('FAILED', o.orderNo, JSON.stringify(r).slice(0, 120)); process.exit(1); } ok++; await new Promise(r => setTimeout(r, 120)); }
console.log(`updated ${ok} of Robert's Wednesday orders (anchor 17:00-21:00, customers 07:00-17:00)`);
