#!/usr/bin/env node
// OVERTIME RELIEF — find the cheapest stops to move off an over-long day, WITHOUT changing tech.
//
// Read-only. Suggests, never moves. Every candidate keeps the customer with the same technician and
// only changes which day of the same week they are visited — so territory ownership, continuity and
// the cadence interval all survive.
//
// Why the TAIL: removing a stop from the middle of a route saves its service time but hands the
// drive back as a longer bridge between its neighbours. Removing the tail is exact — the route just
// ends earlier — so the saving is the full sum of (drive in + on-site) for every stop dropped, with
// no re-optimisation guesswork.
//
// Cost of landing it: the stop is priced against the NEAREST stop that tech already has on the
// target day. If it lands next to something they are already visiting, the added drive is small and
// the move is close to free. That distance is the number to judge a suggestion by.
//
// Usage: node overtime-relief.mjs <from> <to> [--ceiling=9] [--max=4]
//   --ceiling  hours a day may reach before it counts as over (default 9)
//   --max      how many tail stops to consider per over-long day (default 4)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const K = env.OPTIMOROUTE_API_KEY;
const FROM = process.argv[2], TO = process.argv[3];
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? Number(a.split('=')[1]) : d; };
const CEILING = flag('ceiling', 9), MAXTAIL = flag('max', 4);
if (!FROM || !TO) { console.log('Usage: overtime-relief.mjs <from> <to> [--ceiling=9] [--max=4]'); process.exit(1); }

const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dow = s => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(s + 'T12:00:00Z').getUTCDay()];
const miles = (a, b) => {
  const t = Math.PI / 180, dLat = (b.latitude - a.latitude) * t, dLon = (b.longitude - a.longitude) * t;
  const la = a.latitude * t, lb = b.latitude * t;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  return 3959 * 2 * Math.asin(Math.sqrt(h));
};
const cityOf = s => (s.address || '').split(',')[1]?.trim() || '?';
const nameOf = s => (s.locationName || '').split('·')[0].trim();
const jobOf = s => String(s.orderNo || '').split('-')[0];

const dates = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) dates.push(d);

// day -> tech -> route
const byTech = {};
for (const date of dates) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${date}`)).json();
  for (const rt of r.routes || []) {
    if (!(rt.stops || []).length) continue;
    (byTech[rt.driverName] = byTech[rt.driverName] || {})[date] = rt;
  }
}

console.log(`\nOVERTIME RELIEF — ${FROM}..${TO}, ceiling ${CEILING}h, same tech only, tail moves\n`);

for (const [tech, days] of Object.entries(byTech)) {
  const hoursOf = d => (days[d]?.duration || 0) / 60;
  const over = dates.filter(d => days[d] && hoursOf(d) > CEILING).sort((a, b) => hoursOf(b) - hoursOf(a));
  if (!over.length) continue;

  console.log(`### ${tech}`);
  console.log(`    ${dates.filter(d => days[d]).map(d => `${dow(d)} ${hoursOf(d).toFixed(1)}h`).join('   ')}`);

  for (const src of over) {
    const rt = days[src], st = rt.stops;
    // Lighter days for this same tech, roomiest first.
    const targets = dates.filter(d => d !== src && days[d] && hoursOf(d) < CEILING).sort((a, b) => hoursOf(a) - hoursOf(b));
    if (!targets.length) { console.log(`  ${dow(src)} ${hoursOf(src).toFixed(1)}h — no lighter day for ${tech.split(' ')[0]} this week`); continue; }

    console.log(`  ${dow(src)} ${hoursOf(src).toFixed(1)}h  →  needs ${((hoursOf(src) - CEILING) * 60).toFixed(0)} min off`);
    let cum = 0;
    for (let k = 1; k <= Math.min(MAXTAIL, st.length - 1); k++) {
      const s = st[st.length - k];
      // Exact saving: the route simply ends before this stop.
      const svc = (rt.duration || 0) - Math.round(st.reduce((n, x) => n + (x.travelTime || 0), 0) / 60);
      const perStopSvc = Math.round(svc / st.length);
      const save = Math.round((s.travelTime || 0) / 60) + perStopSvc;
      cum += save;
      // Cheapest landing among this tech's lighter days.
      let best = null;
      for (const t of targets) {
        let near = Infinity, nearName = '';
        for (const o of days[t].stops) { const d2 = miles(s, o); if (d2 < near) { near = d2; nearName = cityOf(o); } }
        if (!best || near < best.near) best = { day: t, near, nearName };
      }
      console.log(`    -${String(k).padStart(2)}  #${jobOf(s).padEnd(5)} ${nameOf(s).slice(0, 22).padEnd(23)} ${cityOf(s).padEnd(13)} saves ${String(save).padStart(3)} min (running ${String(cum).padStart(3)})  →  ${dow(best.day)} ${hoursOf(best.day).toFixed(1)}h, nearest stop ${best.near.toFixed(1)} mi (${best.nearName})`);
    }
  }
  console.log('');
}
console.log('Read-only — nothing moved. Moves happen in Jobber, then re-push and re-plan.');
