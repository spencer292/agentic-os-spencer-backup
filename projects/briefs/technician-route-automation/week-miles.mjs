#!/usr/bin/env node
// Total OptimoRoute's OWN road miles + drive hours for a date range. Used to compare routing
// configurations apples-to-apples (road distance, not straight-line), because that is the number
// that actually costs fuel. Usage: node week-miles.mjs 2026-08-03 2026-08-07 [label]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;
const [from, to, label] = [process.argv[2], process.argv[3], process.argv[4] || 'run'];
const addD = (d, n) => { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10); };
let miles = 0, driveMin = 0, stops = 0, commuteMin = 0;
const perDay = [];
for (let d = from; d <= to; d = addD(d, 1)) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json();
  let dm = 0, ds = 0, dd2 = 0;
  const crews = [];
  for (const rt of r.routes || []) {
    const st = rt.stops || [];
    if (!st.length) continue;
    const mi = st.reduce((a, s) => a + (s.distance || 0), 0) / 1609.34;
    dm += mi; ds += st.length;
    dd2 += st.slice(1).reduce((a, s) => a + (s.travelTime || 0), 0) / 60;
    commuteMin += (st[0].travelTime || 0) / 60;
    const span = ((new Date(st[st.length - 1].scheduledAtDt.replace(' ', 'T')) - new Date(st[0].scheduledAtDt.replace(' ', 'T'))) / 3600000);
    crews.push(`${rt.driverName.split(' ')[0]} ${st.length}/${Math.round(mi)}mi/${span.toFixed(1)}h`);
  }
  miles += dm; stops += ds; driveMin += dd2;
  perDay.push({ date: d, stops: ds, miles: Math.round(dm), driveH: +(dd2 / 60).toFixed(1) });
  console.log(`  ${d}  ${String(ds).padStart(3)} stops  ${String(Math.round(dm)).padStart(4)} mi  ${(dd2 / 60).toFixed(1)}h drive   ${crews.join(' | ')}`);
}
const out = { label, from, to, stops, miles: Math.round(miles), driveH: +(driveMin / 60).toFixed(1), commuteH: +(commuteMin / 60).toFixed(1), milesPerStop: +(miles / stops).toFixed(2), perDay };
console.log(`\n[${label}] ${stops} stops | ${Math.round(miles)} road mi | ${(driveMin / 60).toFixed(1)}h in-day driving | ${(commuteMin / 60).toFixed(1)}h commute-to-first | ${(miles / stops).toFixed(2)} mi/stop`);
const f = path.join(__dirname, 'route-config-trials.json');
const all = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
all.push(out);
fs.writeFileSync(f, JSON.stringify(all, null, 1));
