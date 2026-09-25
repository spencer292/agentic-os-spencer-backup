// READ-ONLY: actual working day per tech across a date range, from fresh Jobber visits + the live
// OptimoRoute plan. Same measure as route-work-times.mjs (first job to last job, unpaid commute
// excluded) but takes the visits file as an argument instead of the stale _visits_push.json, and
// prices on-site time per the Jobber assignee via service-time.mjs.
// Usage: node _wd_week.mjs 2026-09-21 2026-09-25 <visits.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration } from './service-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const FROM = process.argv[2], TO = process.argv[3], VF = process.argv[4];
const visits = JSON.parse(fs.readFileSync(VF, 'utf8'));

const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const dowOf = d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d + 'T12:00:00Z').getUTCDay()];
const hm = s => String(s || '').slice(11, 16);
const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmt = m => `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
const clock = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;

const svcByJob = new Map(), techByJob = new Map();
for (const v of visits) {
  const tech = v.assignedUsers?.nodes?.[0]?.name?.full || null;
  const isSet = v.job?.startAt && String(v.job.startAt).slice(0, 10) === String(v.startAt).slice(0, 10);
  svcByJob.set(String(v.job.jobNumber), serviceDuration(tech, !!isSet, v.job.jobNumber, String(v.startAt).slice(0, 10)));
  techByJob.set(String(v.job.jobNumber), tech);
}

const rows = [], ghosts = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${env.OPTIMOROUTE_API_KEY}&date=${d}`)).json();
  for (const rt of r.routes || []) {
    const all = (rt.stops || []).filter(s => s.scheduledAtDt && /^\d+-\w+$/.test(String(s.orderNo || '')));
    const stops = all.filter(s => svcByJob.has(String(s.orderNo).split('-')[0]));
    for (const s of all) if (!svcByJob.has(String(s.orderNo).split('-')[0])) ghosts.push({ d, driver: rt.driverName, job: String(s.orderNo).split('-')[0] });
    if (!stops.length) continue;
    stops.sort((a, b) => a.stopNumber - b.stopNumber);
    const svc = s => svcByJob.get(String(s.orderNo).split('-')[0]) ?? 15;
    const start = mins(hm(stops[0].scheduledAtDt));
    const end = mins(hm(stops[stops.length - 1].scheduledAtDt)) + svc(stops[stops.length - 1]);
    rows.push({
      date: d, dow: dowOf(d), driver: rt.driverName || '(none)', stops: stops.length,
      start, end, work: end - start,
      service: stops.reduce((n, s) => n + svc(s), 0),
      drive: stops.slice(1).reduce((n, s) => n + Number(s.travelTime || 0), 0) / 60,
      km: stops.slice(1).reduce((n, s) => n + Number(s.distance || 0), 0) / 1000,
      commute: Number(stops[0].travelTime || 0) / 60,
    });
  }
  await new Promise(r2 => setTimeout(r2, 280));
}

const drivers = [...new Set(rows.map(r => r.driver))].sort();
const days = [...new Set(rows.map(r => r.date))].sort();
const cell = (dr, d, f) => { const r = rows.find(x => x.driver === dr && x.date === d); return r ? f(r) : '—'; };

console.log(`\n  WORKING DAY — first job to last job, ${FROM} .. ${TO}  (unpaid commute excluded)\n`);
console.log('  TECH               ' + days.map(d => (dowOf(d) + ' ' + d.slice(8)).padStart(15)).join('') + '        WEEK');
for (const dr of drivers) {
  let tot = 0;
  const line = days.map(d => cell(dr, d, r => { tot += r.work; return `${fmt(r.work)} / ${r.stops}`; }).padStart(15)).join('');
  console.log('  ' + dr.padEnd(18) + line + fmt(tot).padStart(12));
}
console.log('\n  TECH               ' + days.map(d => (dowOf(d) + ' ' + d.slice(8)).padStart(15)).join('') + '     OVER 9h');
for (const dr of drivers) {
  let over = 0;
  const line = days.map(d => cell(dr, d, r => { if (r.work > 540) over++; return `${clock(r.start)}-${clock(r.end)}`; }).padStart(15)).join('');
  console.log('  ' + dr.padEnd(18) + line + String(over).padStart(12));
}

console.log('\n  DAILY DETAIL\n');
console.log('  DATE        TECH               STOPS  ON SITE  DRIVING    IDLE   WORKING DAY  MILES');
for (const d of days) {
  for (const r of rows.filter(x => x.date === d).sort((a, b) => b.work - a.work)) {
    const idle = Math.max(0, r.work - r.service - r.drive);
    console.log(`  ${r.date} ${r.dow}  ${r.driver.padEnd(18)}${String(r.stops).padStart(4)}  ${fmt(r.service).padStart(7)}  ${fmt(r.drive).padStart(7)}  ${fmt(idle).padStart(6)}  ${fmt(r.work).padStart(11)}  ${(r.km * 0.621371).toFixed(0).padStart(5)}${r.work > 540 ? '  <<' : ''}`);
  }
  console.log('');
}
const wk = {};
for (const r of rows) { const w = wk[r.driver] = wk[r.driver] || { work: 0, svc: 0, drive: 0, stops: 0, km: 0, commute: 0 }; w.work += r.work; w.svc += r.service; w.drive += r.drive; w.stops += r.stops; w.km += r.km; w.commute += r.commute; }
console.log('  WEEK TOTALS');
console.log('  TECH                STOPS  ON SITE  DRIVING     PAID WEEK  MILES  UNPAID COMMUTE');
for (const dr of drivers) { const w = wk[dr]; console.log(`  ${dr.padEnd(19)}${String(w.stops).padStart(4)}  ${fmt(w.svc).padStart(7)}  ${fmt(w.drive).padStart(7)}  ${fmt(w.work).padStart(12)}  ${(w.km * 0.621371).toFixed(0).padStart(5)}  ${fmt(w.commute).padStart(9)}`); }
const T = Object.values(wk).reduce((a, w) => ({ stops: a.stops + w.stops, work: a.work + w.work, svc: a.svc + w.svc, drive: a.drive + w.drive, km: a.km + w.km }), { stops: 0, work: 0, svc: 0, drive: 0, km: 0 });
console.log(`  ${'ALL'.padEnd(19)}${String(T.stops).padStart(4)}  ${fmt(T.svc).padStart(7)}  ${fmt(T.drive).padStart(7)}  ${fmt(T.work).padStart(12)}  ${(T.km * 0.621371).toFixed(0).padStart(5)}`);
const routed = new Set(rows.reduce((n, r) => n + r.stops, 0) ? [] : []);
console.log(`\n  Jobber visits ${FROM}..${TO}: ${visits.length}   routed stops matched: ${T.stops}   ghosts: ${ghosts.length}   not on the map: ${visits.length - T.stops - ghosts.length}`);
console.log('\n  << working day over 9 hours.\n');
