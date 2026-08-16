#!/usr/bin/env node
// WEEK REVIEW — read-only. What OptimoRoute currently holds for a date range, in the shape Spencer
// approves against: per tech per day, stops / first stop / last stop / span / drive / on-site,
// plus anything left unscheduled. Never writes. Never plans.
//
// Usage: node week-review.mjs 2026-08-17 2026-08-21 [--visits=<snapshot.json>]
// --visits: a fetch-window-visits.mjs snapshot. Any live Jobber visit with no routed stop on its
//           own day is reported as UNSCHEDULED — the thing that silently drops work off a truck.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration } from './service-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const K = env.OPTIMOROUTE_API_KEY;
const FROM = process.argv[2], TO = process.argv[3];
const vArg = process.argv.find(a => a.startsWith('--visits='));
if (!FROM || !TO) { console.log('Usage: week-review.mjs <from> <to> [--visits=<snapshot.json>]'); process.exit(1); }

const TZ = 'America/Los_Angeles';
const toPT = s => new Date(s).toLocaleString('sv-SE', { timeZone: TZ });
function visitNumOf(v) {
  let n = null;
  try { n = Buffer.from(v.id, 'base64').toString('utf8').split('/').pop(); } catch (e) {}
  if (!n || !/^\d+$/.test(n)) n = v.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return n;
}
// wanted[date] = Map(orderNo -> label), straight off the live Jobber board
const wanted = {};
const isSetOf = {};   // orderNo -> first visit of the job (traps going in), for the service-time lookup
if (vArg) {
  const V = JSON.parse(fs.readFileSync(path.resolve(__dirname, vArg.split('=')[1]), 'utf8'));
  for (const v of V) {
    const d = toPT(v.startAt).slice(0, 10);
    const orderNo = `${v.job?.jobNumber}-${visitNumOf(v)}`;
    (wanted[d] = wanted[d] || new Map()).set(orderNo, `#${v.job?.jobNumber} ${v.title || ''}`.trim());
    isSetOf[orderNo] = v.job?.startAt ? toPT(v.job.startAt).slice(0, 10) === d : false;
  }
}

const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dow = s => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(s + 'T12:00:00Z').getUTCDay()];
const hm = s => { s = (s || '').trim(); return s.includes(' ') ? s.split(' ')[1].slice(0, 5) : s.slice(0, 5); };
const mins = s => { const t = hm(s); if (!t) return 0; const [a, b] = t.split(':').map(Number); return a * 60 + b; };
const h = m => (m / 60).toFixed(1);

const dates = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) dates.push(d);

const grand = {};
console.log(`\nOPTIMOROUTE PLAN — ${FROM} .. ${TO}   (read-only)\n`);

for (const date of dates) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${date}`)).json();
  const routes = (r.routes || []).filter(rt => (rt.stops || []).length);
  if (!routes.length) continue;
  console.log(`--- ${dow(date).toUpperCase()} ${date} ---`);
  console.log(`  ${'tech'.padEnd(17)} ${'stops'.padStart(5)}  ${'first'.padStart(5)}  ${'last'.padStart(5)}  ${"paid".padStart(5)}  ${"commute".padStart(7)}  ${'drive'.padStart(5)}  ${'miles'.padStart(5)}`);
  let dayStops = 0;
  for (const rt of routes.sort((a, b) => (b.stops || []).length - (a.stops || []).length)) {
    const st = rt.stops || [];
    const first = st[0], last = st[st.length - 1];
    // OptimoRoute units: route.duration = whole-route minutes INCLUDING the depot legs,
    // route.distance = miles, stop.travelTime = SECONDS of drive into that stop.
    const drive = Math.round(st.reduce((n, s) => n + (s.travelTime || 0), 0) / 60);
    const onsite = Math.max(0, (rt.duration || 0) - drive);
    const miles = rt.distance || 0;
    // PAID hours: techs clock in at job 1 and clock out when the last job is done (Spencer
    // 2026-08-15). The commute out to the first stop and home from the last is unpaid, and
    // route.duration includes both — which is why it overstates the working day, worst for
    // whoever lives furthest from their ground.
    const lastSvc = serviceDuration(rt.driverName, isSetOf[String(last.orderNo)] || false, String(last.orderNo).split('-')[0]);
    const paid = mins(last.scheduledAt) - mins(first.scheduledAt) + lastSvc;
    const commute = Math.max(0, (rt.duration || 0) - paid);
    dayStops += st.length;
    grand[rt.driverName] = grand[rt.driverName] || { stops: 0, paid: 0, commute: 0, drive: 0, onsite: 0, miles: 0, days: 0 };
    const g = grand[rt.driverName];
    g.stops += st.length; g.paid += paid; g.commute += commute; g.drive += drive; g.onsite += onsite; g.miles += miles; g.days++;
    console.log(`  ${rt.driverName.padEnd(17)} ${String(st.length).padStart(5)}  ${hm(first.scheduledAt).padStart(5)}  ${hm(last.scheduledAt).padStart(5)}  ${(h(paid) + 'h').padStart(5)}  ${(h(commute) + 'h').padStart(7)}  ${(h(drive) + 'h').padStart(5)}  ${String(Math.round(miles)).padStart(5)}${paid / 60 > 9 ? '   << over 9h PAID' : (paid / 60 > 8.5 ? '   < near 9h' : '')}`);
  }
  console.log(`  ${'TOTAL'.padEnd(17)} ${String(dayStops).padStart(5)}`);
  // Unscheduled = on the Jobber board for this day, but no routed stop anywhere on it.
  if (wanted[date]) {
    const routed = new Set();
    for (const rt of routes) for (const s of rt.stops || []) routed.add(String(s.orderNo || ''));
    const missing = [...wanted[date].keys()].filter(o => !routed.has(o));
    if (missing.length) console.log(`  !! UNSCHEDULED: ${missing.length} — ${missing.slice(0, 12).map(o => wanted[date].get(o)).join(' | ')}`);
  }
  console.log('');
}

console.log('WEEK TOTALS');
console.log(`  ${'tech'.padEnd(17)} ${'days'.padStart(4)} ${'stops'.padStart(5)}  ${'PAID wk'.padStart(8)}  ${'avg/day'.padStart(7)}  ${'commute'.padStart(7)}  ${'drive'.padStart(6)}  ${'miles'.padStart(6)}`);
for (const [t, g] of Object.entries(grand).sort((a, b) => b[1].paid - a[1].paid)) {
  console.log(`  ${t.padEnd(17)} ${String(g.days).padStart(4)} ${String(g.stops).padStart(5)}  ${(h(g.paid) + 'h').padStart(8)}  ${(h(g.paid / g.days) + 'h').padStart(7)}  ${(h(g.commute) + 'h').padStart(7)}  ${(h(g.drive) + 'h').padStart(6)}  ${String(Math.round(g.miles)).padStart(6)}`);
}
