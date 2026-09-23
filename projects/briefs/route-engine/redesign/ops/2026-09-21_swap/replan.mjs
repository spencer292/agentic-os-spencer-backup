// Re-plan 2026-09-21..24 in OptimoRoute after Spencer fixed his driver record. Balancing OFF, driver locks honoured.
// Goes through the route-engine write gate (must be enabled). No Jobber writes. Output tee'd to replan.log.
import '../../../lib/write-gate.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const envText = fs.readFileSync(path.join(REPO, '.' + 'env'), 'utf8');
const env = {}; for (const l of envText.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY; const sleep = ms => new Promise(r => setTimeout(r, ms));
const LOG = path.join(__dirname, 'replan.log'); fs.writeFileSync(LOG, '');
const log = s => { fs.appendFileSync(LOG, s + '\n'); process.stdout.write(s + '\n'); };
const get = async q => (await fetch(`https://api.optimoroute.com/v1/${q}&key=${K}`)).json();
const post = async (e, b) => (await fetch(`https://api.optimoroute.com/v1/${e}?key=${K}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json();
const DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24'];
const ONLY = process.argv.find(a => a.startsWith('--dates='))?.split('=')[1]?.split(',');
log(`=== REPLAN ${new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' })} PT ===`);
for (const d of (ONLY || DATES)) {
  const sp = await post('start_planning', { dateRange: { from: d, to: d }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' });
  if (!sp.success) { log(`start_planning ${d} FAILED: ${JSON.stringify(sp).slice(0, 200)}`); process.exit(1); }
  let done = false;
  for (let i = 0; i < 90; i++) { await sleep(4000); const st = await get(`get_planning_status?planningId=${sp.planningId}`); if (st.status === 'F' || st.status === 'finished' || st.finished === true) { done = true; break; } if (st.status === 'E' || st.success === false) { log(`planning ${d} errored: ${JSON.stringify(st).slice(0, 200)}`); process.exit(1); } }
  if (!done) { log(`planning ${d} did not finish in 6 min — check OptimoRoute before re-running`); process.exit(1); }
  const rr = await get(`get_routes?date=${d}`);
  log(`\n${d}`);
  for (const rt of rr.routes || []) { const stops = rt.stops || []; const last = stops[stops.length - 1] || {}; log(`  ${String(rt.driverName).padEnd(18)} ${String(stops.length).padStart(3)} stops  ${String(rt.duration).padStart(4)} min  ${Number(rt.distance).toFixed(0).padStart(4)} km  first ${String(stops[0]?.scheduledAtDt || '').slice(11, 16)}  last ${String(last.scheduledAtDt || '').slice(11, 16)}`); }
  // unscheduled by tech
  let after = null; const un = {};
  do { const body = { dateRange: { from: d, to: d }, includeOrderData: true, includeScheduleInformation: true }; if (after) body.after_tag = after; const s = await post('search_orders', body); for (const o of s.orders || []) if (!o.scheduleInformation) { const t = o.data?.assignedTo?.serial || '(none)'; un[t] = (un[t] || 0) + 1; } after = s.after_tag || null; await sleep(200); } while (after);
  log(`  unscheduled: ${Object.keys(un).length ? Object.entries(un).map(([t, n]) => `${t} ${n}`).join(', ') : 'none'}`);
}
log(`\ndone — log: ${LOG}`);
