#!/usr/bin/env node
// MILEAGE SPLIT — road miles per tech, separated into unpaid commute and paid between-job driving.
// Read-only.
//
// UNITS (verified 2026-08-15 against straight-line geometry, because the two fields disagree):
//   stop.distance  = METRES of road into that stop. Checked by comparing each leg to the haversine
//                    distance between the same two stops: as metres the road/straight ratio is
//                    1.3-1.5 and implied speeds are 17-33 mph, both normal. Read as thousandths of
//                    a mile the ratio becomes 2.1-2.5 and the speeds 39-54 mph, which is not a
//                    suburban trap route.
//   route.distance = KILOMETRES for the whole route including both depot legs. Forced by the
//                    arithmetic: Luke 2026-08-20 sums to 117.9 mi of stop legs against a route
//                    figure of 237.8. As miles that leaves a 120-mile drive home; as km it leaves
//                    29.9 miles, which is the answer that can actually be true.
//
// So: commute out = stop[0].distance. Commute home = route total - every stop leg. Between-job
// driving = every stop leg except the first. Commute is unpaid (techs clock in at job 1), but the
// company still burns the fuel on the way home.
//
// Usage: node mileage-split.mjs <from> <to>

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
if (!FROM || !TO) { console.log('Usage: mileage-split.mjs <from> <to>'); process.exit(1); }

const M_PER_MI = 1609.34;
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dow = s => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(s + 'T12:00:00Z').getUTCDay()];

const dates = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) dates.push(d);

const g = {};
const perDay = [];
for (const date of dates) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${date}`)).json();
  for (const rt of (r.routes || []).filter(x => (x.stops || []).length)) {
    const st = rt.stops;
    const legs = st.reduce((n, s) => n + (s.distance || 0), 0);          // metres, home->1 ... n-1->n
    const totalM = (rt.distance || 0) * 1000;                            // route.distance is km
    const out = (st[0].distance || 0) / M_PER_MI;                        // home -> first job
    const home = Math.max(0, totalM - legs) / M_PER_MI;                  // last job -> home
    const between = (legs - (st[0].distance || 0)) / M_PER_MI;           // job -> job, on the clock
    const t = rt.driverName;
    g[t] = g[t] || { days: 0, stops: 0, out: 0, home: 0, between: 0 };
    g[t].days++; g[t].stops += st.length; g[t].out += out; g[t].home += home; g[t].between += between;
    perDay.push({ date, tech: t, stops: st.length, out, home, between });
  }
}

console.log(`\nROAD MILES — ${FROM} .. ${TO}   (stop legs in metres, route totals in km, both converted)\n`);
console.log(`  ${'tech'.padEnd(17)} ${'day'.padStart(4)} ${'stops'.padStart(5)}  ${'to 1st'.padStart(7)} ${'home'.padStart(6)}  ${'COMMUTE'.padStart(8)}  ${'between'.padStart(8)}  ${'TOTAL'.padStart(7)}`);
for (const t of Object.keys(g).sort()) {
  for (const d of perDay.filter(x => x.tech === t)) {
    console.log(`  ${t.padEnd(17)} ${dow(d.date).padStart(4)} ${String(d.stops).padStart(5)}  ${d.out.toFixed(1).padStart(7)} ${d.home.toFixed(1).padStart(6)}  ${(d.out + d.home).toFixed(1).padStart(8)}  ${d.between.toFixed(1).padStart(8)}  ${(d.out + d.home + d.between).toFixed(1).padStart(7)}`);
  }
  const x = g[t];
  console.log(`  ${(t + ' — WEEK').padEnd(17)} ${String(x.days).padStart(4)} ${String(x.stops).padStart(5)}  ${x.out.toFixed(0).padStart(7)} ${x.home.toFixed(0).padStart(6)}  ${(x.out + x.home).toFixed(0).padStart(8)}  ${x.between.toFixed(0).padStart(8)}  ${(x.out + x.home + x.between).toFixed(0).padStart(7)}\n`);
}

console.log('WEEK TOTALS');
console.log(`  ${'tech'.padEnd(17)} ${'stops'.padStart(5)}  ${'COMMUTE'.padStart(8)}  ${'between'.padStart(8)}  ${'TOTAL'.padStart(7)}  ${'mi/stop'.padStart(7)}  ${'commute %'.padStart(9)}`);
let tc = 0, tb = 0;
for (const [t, x] of Object.entries(g).sort((a, b) => (b[1].out + b[1].home + b[1].between) - (a[1].out + a[1].home + a[1].between))) {
  const c = x.out + x.home, tot = c + x.between; tc += c; tb += x.between;
  console.log(`  ${t.padEnd(17)} ${String(x.stops).padStart(5)}  ${c.toFixed(0).padStart(8)}  ${x.between.toFixed(0).padStart(8)}  ${tot.toFixed(0).padStart(7)}  ${(tot / x.stops).toFixed(1).padStart(7)}  ${((c / tot) * 100).toFixed(0).padStart(8)}%`);
}
console.log(`  ${'ALL'.padEnd(17)} ${String(Object.values(g).reduce((n, x) => n + x.stops, 0)).padStart(5)}  ${tc.toFixed(0).padStart(8)}  ${tb.toFixed(0).padStart(8)}  ${(tc + tb).toFixed(0).padStart(7)}`);
