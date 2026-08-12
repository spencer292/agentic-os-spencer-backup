#!/usr/bin/env node
// ROUTE TIME FORECAST — how long is each technician's day, per route, from the live OptimoRoute plan.
//
// Spencer 2026-08-07: "give me a prediction on how much time we're talking about for each technician
// per route."
//
// Three numbers matter and they are NOT the same:
//   DRIVE      — OptimoRoute's real per-stop travelTime, summed. The first leg is the commute from
//                home to stop #1, which is a measured 22% of all weekly miles, so it is reported
//                separately rather than buried in the total.
//   ON-SITE    — service time at the properties.
//   DAY LENGTH — first arrival to last departure. This is what the tech actually experiences.
//
// Density caveat (Spencer, same day): a day with 35 stops where 9 are in one neighbourhood is not a
// 35-drive day — those 9 cost one approach and eight driveway walks. OptimoRoute already prices that
// correctly because travelTime between adjacent stops is near zero, so a high stop count with low
// drive time is a DENSE day, not an overloaded one. The stops/hour column makes that visible.
//
// READ-ONLY.
//
// Usage: node route-time-forecast.mjs --from=2026-08-10 --to=2026-08-14

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
if (!FROM || !TO) { console.error('Usage: route-time-forecast.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD'); process.exit(1); }

const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function addDays(s, n) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); }
const dowOf = d => DOW[new Date(d + 'T12:00:00Z').getUTCDay()];
const hm = mins => `${Math.floor(mins / 60)}h${String(Math.round(mins % 60)).padStart(2, '0')}`;
const toMin = t => { const m = String(t || '').match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
const clock = mins => mins == null ? '  —  ' : `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(Math.round(mins % 60)).padStart(2, '0')}`;

const rows = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json();
  for (const rt of r.routes || []) {
    const stops = (rt.stops || []).filter(s => /^\d+-\w+$/.test(String(s.orderNo || '')));
    if (!stops.length) continue;
    let drive = 0, commute = 0; let onsite = 0;
    stops.forEach((s, i) => {
      const t = Number(s.travelTime || 0) / 60;
      if (i === 0) commute = t; else drive += t;
      onsite += Number(s.duration || 0) / 60;
    });
    const starts = stops.map(s => toMin(s.scheduledAt)).filter(x => x != null);
    const first = starts.length ? Math.min(...starts) : null;
    const lastStop = stops[stops.length - 1];
    const lastStart = toMin(lastStop.scheduledAt);
    const end = lastStart == null ? null : lastStart + Number(lastStop.duration || 0) / 60;
    let dayLen = first != null && end != null ? end - first : drive + onsite;
    // get_routes does not return per-stop service duration on this account, so on-site is derived:
    // the gaps between scheduled arrivals already contain it. Day length runs first arrival -> last
    // departure and therefore EXCLUDES the home->stop#1 commute, which is reported separately.
    if (onsite === 0 && dayLen > 0) onsite = Math.max(0, dayLen - drive);
    // cluster read: how many stops sit within 2 min drive of the one before them
    const tight = stops.filter((s, i) => i > 0 && Number(s.travelTime || 0) / 60 <= 2).length;
    rows.push({
      date: d, dow: dowOf(d), tech: rt.driverName, stops: stops.length,
      miles: Math.round(rt.distance || 0), commute, drive, onsite,
      dayLen, first, end, tight,
    });
  }
  await sleep(300);
}

console.log(`ROUTE TIME FORECAST  ${FROM} .. ${TO}\n`);
console.log('Day length = first arrival to last departure. Commute = home to stop #1, shown separately.');
console.log('Tight = stops reached in <=2 min from the previous one (same street / same neighbourhood).\n');

const techs = [...new Set(rows.map(r => r.tech))].sort();
for (const t of techs) {
  const mine = rows.filter(r => r.tech === t).sort((a, b) => a.date.localeCompare(b.date));
  console.log(`=== ${t} ===`);
  console.log('  day  date        stops  tight   miles   commute    drive   on-site   DAY LENGTH   start  end');
  let T = { stops: 0, miles: 0, commute: 0, drive: 0, onsite: 0, dayLen: 0 };
  for (const r of mine) {
    T.stops += r.stops; T.miles += r.miles; T.commute += r.commute; T.drive += r.drive; T.onsite += r.onsite; T.dayLen += r.dayLen;
    const warn = r.dayLen > 9 * 60 ? ' <-- over 9h' : (r.dayLen < 6 * 60 ? ' <-- light' : '');
    console.log(`  ${r.dow}  ${r.date}  ${String(r.stops).padStart(5)}  ${String(r.tight).padStart(5)}  ${String(r.miles).padStart(6)}  ${hm(r.commute).padStart(8)}  ${hm(r.drive).padStart(7)}  ${hm(r.onsite).padStart(8)}  ${hm(r.dayLen).padStart(11)}   ${clock(r.first)}  ${clock(r.end)}${warn}`);
  }
  console.log(`  ${'WEEK'.padEnd(16)}${String(T.stops).padStart(5)}  ${''.padStart(5)}  ${String(T.miles).padStart(6)}  ${hm(T.commute).padStart(8)}  ${hm(T.drive).padStart(7)}  ${hm(T.onsite).padStart(8)}  ${hm(T.dayLen).padStart(11)}`);
  console.log(`  ${(T.dayLen / 60).toFixed(1)} h on the clock; ${((T.commute + T.drive) / T.dayLen * 100).toFixed(0)}% of it driving; ${(T.stops / (T.dayLen / 60)).toFixed(1)} stops/hour\n`);
}

console.log('=== WEEK TOTALS ===');
console.log('tech               stops   miles   drive+commute   on-site   DAY LENGTH   over-9h days');
for (const t of techs) {
  const mine = rows.filter(r => r.tech === t);
  const s = mine.reduce((a, r) => ({ stops: a.stops + r.stops, miles: a.miles + r.miles, drv: a.drv + r.drive + r.commute, on: a.on + r.onsite, len: a.len + r.dayLen }), { stops: 0, miles: 0, drv: 0, on: 0, len: 0 });
  const over = mine.filter(r => r.dayLen > 9 * 60).length;
  console.log(`${t.padEnd(18)}${String(s.stops).padStart(5)}  ${String(s.miles).padStart(6)}  ${hm(s.drv).padStart(13)}  ${hm(s.on).padStart(8)}  ${hm(s.len).padStart(11)}   ${over || '-'}`);
}
const all = rows.reduce((a, r) => ({ stops: a.stops + r.stops, miles: a.miles + r.miles, drv: a.drv + r.drive + r.commute, on: a.on + r.onsite, len: a.len + r.dayLen }), { stops: 0, miles: 0, drv: 0, on: 0, len: 0 });
console.log(`${'ALL'.padEnd(18)}${String(all.stops).padStart(5)}  ${String(all.miles).padStart(6)}  ${hm(all.drv).padStart(13)}  ${hm(all.on).padStart(8)}  ${hm(all.len).padStart(11)}`);

const out = path.join(__dirname, `route-forecast-${FROM}_${TO}.json`);
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), from: FROM, to: TO, rows }, null, 2));
console.log(`\nSaved: ${out}`);
