#!/usr/bin/env node
// route-work-times.mjs — read the optimized OptimoRoute routes and report the ACTUAL WORKING DAY.
//
// WORKING DAY = first job to last job (Spencer's rule). Commute is unpaid and excluded, and
// `route.duration` is NOT the working day — it includes the run out from the start location and
// back. Measured here from the first stop's arrival to the last stop's arrival + its service time.
//
// FIELD NOTES on get_routes (verified 2026-09-04):
//   route.distance  KILOMETRES, and it INCLUDES the commute legs
//   stop.distance   METRES, the leg INTO that stop
//   stop.travelTime SECONDS, the leg INTO that stop — so stop 1's is the unpaid morning commute
//   stops carry NO service duration; on-site time is what we pushed, via service-time.mjs
//
// READ-ONLY. No writes of any kind.
// Usage: node route-work-times.mjs 2026-09-08 2026-09-11
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration } from './service-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const orGet = async q => (await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`)).json();

const FROM = process.argv[2] || '2026-09-08';
const TO = process.argv[3] || '2026-09-11';
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const dowOf = d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d + 'T12:00:00Z').getUTCDay()];
const hm = s => String(s || '').slice(11, 16);
const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmt = m => `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
const MI = km => km * 0.621371;

// on-site minutes per job, exactly as pushed
const visits = JSON.parse(fs.readFileSync(path.join(__dirname, '_visits_push.json'), 'utf8'));
const svcByJob = new Map();
for (const v of visits) {
  const tech = v.assignedUsers?.nodes?.[0]?.name?.full || null;
  const isSet = v.job?.startAt && String(v.job.startAt).slice(0, 10) === String(v.startAt).slice(0, 10);
  svcByJob.set(String(v.job.jobNumber), serviceDuration(tech, !!isSet, v.job.jobNumber));
}

const rows = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    const stops = (rt.stops || []).filter(s => s.scheduledAtDt && /^\d+-\w+$/.test(String(s.orderNo || '')));
    if (!stops.length) continue;
    stops.sort((a, b) => a.stopNumber - b.stopNumber);
    const svc = s => svcByJob.get(String(s.orderNo).split('-')[0]) ?? 15;
    const first = stops[0], last = stops[stops.length - 1];
    const start = mins(hm(first.scheduledAtDt));
    const end = mins(hm(last.scheduledAtDt)) + svc(last);
    const service = stops.reduce((n, s) => n + svc(s), 0);
    const drive = stops.slice(1).reduce((n, s) => n + Number(s.travelTime || 0), 0) / 60;
    const metres = stops.slice(1).reduce((n, s) => n + Number(s.distance || 0), 0);
    rows.push({
      date: d, dow: dowOf(d), driver: rt.driverName || '(none)', stops: stops.length,
      start: hm(first.scheduledAtDt),
      end: `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
      workMin: end - start, serviceMin: service, driveMin: drive,
      idleMin: Math.max(0, (end - start) - service - drive),
      km: metres / 1000,
      commuteMin: Number(first.travelTime || 0) / 60, commuteKm: Number(first.distance || 0) / 1000,
    });
  }
  await sleep(280);
}

const drivers = [...new Set(rows.map(r => r.driver))].sort();
const days = [...new Set(rows.map(r => r.date))].sort();
const cell = (dr, d, f) => { const r = rows.find(x => x.driver === dr && x.date === d); return r ? f(r) : '—'; };

console.log(`\n  ACTUAL WORKING DAY — first job to last job, ${FROM} .. ${TO}`);
console.log('  OptimoRoute optimized, balancing OFF, techs pinned to Jobber. Commute excluded.\n');

console.log('  TECH               ' + days.map(d => (dowOf(d) + ' ' + d.slice(8)).padStart(15)).join('') + '        WEEK');
for (const dr of drivers) {
  let tot = 0;
  const line = days.map(d => cell(dr, d, r => { tot += r.workMin; return `${r.start}-${r.end}`; }).padStart(15)).join('');
  console.log('  ' + dr.padEnd(18) + line + fmt(tot).padStart(12));
}
console.log('\n  TECH               ' + days.map(d => (dowOf(d) + ' ' + d.slice(8)).padStart(15)).join('') + '        WEEK');
for (const dr of drivers) {
  let tot = 0;
  const line = days.map(d => cell(dr, d, r => { tot += r.workMin; return `${fmt(r.workMin)} / ${r.stops}`; }).padStart(15)).join('');
  console.log('  ' + dr.padEnd(18) + line + fmt(tot).padStart(12));
}

console.log('\n  WHERE THE TIME GOES\n');
console.log('  DATE        TECH               STOPS  ON SITE  DRIVING    IDLE   WORKING DAY  MILES  COMMUTE');
for (const d of days) {
  for (const r of rows.filter(x => x.date === d).sort((a, b) => b.workMin - a.workMin)) {
    console.log(`  ${r.date} ${r.dow}  ${r.driver.padEnd(18)}${String(r.stops).padStart(4)}  ${fmt(r.serviceMin).padStart(7)}  ${fmt(r.driveMin).padStart(7)}  ${fmt(r.idleMin).padStart(6)}  ${fmt(r.workMin).padStart(11)}  ${MI(r.km).toFixed(0).padStart(5)}  ${(r.commuteMin).toFixed(0).padStart(4)}m${r.workMin > 540 ? '  <<' : ''}`);
  }
  console.log('');
}

const wk = {};
for (const r of rows) { const w = wk[r.driver] = wk[r.driver] || { work: 0, svc: 0, drive: 0, idle: 0, stops: 0, km: 0, commute: 0 }; w.work += r.workMin; w.svc += r.serviceMin; w.drive += r.driveMin; w.idle += r.idleMin; w.stops += r.stops; w.km += r.km; w.commute += r.commuteMin; }
console.log('  WEEK TOTALS');
console.log('  TECH                STOPS  ON SITE  DRIVING    IDLE     PAID WEEK  MILES  UNPAID COMMUTE');
for (const dr of drivers) { const w = wk[dr]; console.log(`  ${dr.padEnd(19)}${String(w.stops).padStart(4)}  ${fmt(w.svc).padStart(7)}  ${fmt(w.drive).padStart(7)}  ${fmt(w.idle).padStart(6)}  ${fmt(w.work).padStart(12)}  ${MI(w.km).toFixed(0).padStart(5)}  ${fmt(w.commute).padStart(9)}`); }
const T = Object.values(wk).reduce((a, w) => ({ work: a.work + w.work, svc: a.svc + w.svc, drive: a.drive + w.drive, stops: a.stops + w.stops, km: a.km + w.km }), { work: 0, svc: 0, drive: 0, stops: 0, km: 0 });
console.log(`  ${'ALL'.padEnd(19)}${String(T.stops).padStart(4)}  ${fmt(T.svc).padStart(7)}  ${fmt(T.drive).padStart(7)}          ${fmt(T.work).padStart(12)}  ${MI(T.km).toFixed(0).padStart(5)}`);
console.log('\n  << working day over 9 hours.  IDLE = the optimizer holding a stop for a time window.\n');
