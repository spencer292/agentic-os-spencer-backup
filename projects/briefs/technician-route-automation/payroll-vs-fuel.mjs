#!/usr/bin/env node
// PAYROLL-OPTIMAL vs FUEL-OPTIMAL ROUTING — how much paid driving is OptimoRoute buying in order
// to shorten the unpaid commute? Read-only.
//
// The two objectives are genuinely different:
//   OptimoRoute minimises the WHOLE LOOP  home -> stops -> home.
//   Payroll only pays from job 1 to the last job. The depot legs are free in WAGES (not in fuel).
// So the payroll-optimal route is the shortest open HAMILTONIAN PATH over the day's stops with
// BOTH ENDPOINTS FREE, which can be shorter than the path OptimoRoute picked, because OptimoRoute
// is willing to lengthen the middle to bring the ends closer to home.
//
// Method per tech-day: take the stop coordinates, measure the current sequence, then search for a
// shorter open path (nearest-neighbour from every possible start, then 2-opt to convergence).
// Everything is straight-line; the gap is then scaled onto that day's REAL road miles by the
// day's own road/straight ratio, so the answer is in road miles rather than crow-flies.
//
// Reported as miles AND as minutes at the day's own average road speed, because a mile moved from
// paid to unpaid saves the wage as well as nothing on fuel — the fuel is burned either way.
//
// Usage: node payroll-vs-fuel.mjs <from> <to>

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
if (!FROM || !TO) { console.log('Usage: payroll-vs-fuel.mjs <from> <to>'); process.exit(1); }

const M_PER_MI = 1609.34;
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dow = s => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(s + 'T12:00:00Z').getUTCDay()];
const mi = (a, b) => {
  const t = Math.PI / 180, dLat = (b.latitude - a.latitude) * t, dLon = (b.longitude - a.longitude) * t;
  const la = a.latitude * t, lb = b.latitude * t;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  return 3959 * 2 * Math.asin(Math.sqrt(h));
};
const pathLen = (p, D) => { let n = 0; for (let i = 1; i < p.length; i++) n += D[p[i - 1]][p[i]]; return n; };

// Shortest OPEN path, both endpoints free: NN from every start, then 2-opt segment reversal.
function bestOpenPath(D, n) {
  let best = null;
  for (let s = 0; s < n; s++) {
    const un = new Set([...Array(n).keys()]); un.delete(s);
    const p = [s];
    while (un.size) {
      let b = -1, bd = Infinity;
      for (const c of un) { const d = D[p[p.length - 1]][c]; if (d < bd) { bd = d; b = c; } }
      p.push(b); un.delete(b);
    }
    let len = pathLen(p, D), improved = true, guard = 0;
    while (improved && guard++ < 60) {
      improved = false;
      for (let i = 0; i < n - 1 && !improved; i++) {
        for (let j = i + 1; j < n; j++) {
          const q = p.slice(0, i).concat(p.slice(i, j + 1).reverse(), p.slice(j + 1));
          const l2 = pathLen(q, D);
          if (l2 < len - 1e-9) { p.splice(0, p.length, ...q); len = l2; improved = true; break; }
        }
      }
    }
    if (!best || len < best.len) best = { len, p: [...p] };
  }
  return best;
}

const dates = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) dates.push(d);

console.log(`\nPAYROLL-OPTIMAL vs WHAT IS PLANNED — ${FROM} .. ${TO}\n`);
console.log(`  ${'day'.padEnd(4)} ${'tech'.padEnd(17)} ${'stops'.padStart(5)}  ${'paid mi now'.padStart(11)}  ${'best open'.padStart(9)}  ${'saved mi'.padStart(8)}  ${'saved min'.padStart(9)}`);
const g = {};
let totMi = 0, totMin = 0;
for (const date of dates) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${date}`)).json();
  for (const rt of (r.routes || []).filter(x => (x.stops || []).length > 3)) {
    const st = rt.stops, n = st.length;
    const D = st.map(a => st.map(b => mi(a, b)));
    const curStraight = pathLen([...Array(n).keys()], D);
    // real paid road miles = every leg except the drive in to stop 1
    const realPaid = (st.reduce((x, s) => x + (s.distance || 0), 0) - (st[0].distance || 0)) / M_PER_MI;
    const paidMin = st.slice(1).reduce((x, s) => x + (s.travelTime || 0), 0) / 60;
    const best = bestOpenPath(D, n);
    const ratio = curStraight > 0 ? realPaid / curStraight : 0;     // straight-line -> road
    const savedMi = Math.max(0, (curStraight - best.len) * ratio);
    const savedMin = realPaid > 0 ? savedMi * (paidMin / realPaid) : 0;
    totMi += savedMi; totMin += savedMin;
    g[rt.driverName] = g[rt.driverName] || { mi: 0, min: 0 };
    g[rt.driverName].mi += savedMi; g[rt.driverName].min += savedMin;
    console.log(`  ${dow(date).padEnd(4)} ${rt.driverName.padEnd(17)} ${String(n).padStart(5)}  ${realPaid.toFixed(1).padStart(11)}  ${(best.len * ratio).toFixed(1).padStart(9)}  ${savedMi.toFixed(1).padStart(8)}  ${savedMin.toFixed(0).padStart(9)}`);
  }
}
console.log(`\n  ${'TECH TOTALS'.padEnd(22)} ${'saved mi/wk'.padStart(11)}  ${'saved min/wk'.padStart(12)}`);
for (const [t, x] of Object.entries(g).sort((a, b) => b[1].min - a[1].min)) {
  console.log(`  ${t.padEnd(22)} ${x.mi.toFixed(0).padStart(11)}  ${x.min.toFixed(0).padStart(12)}`);
}
console.log(`  ${'ALL'.padEnd(22)} ${totMi.toFixed(0).padStart(11)}  ${totMin.toFixed(0).padStart(12)}  (= ${(totMin / 60).toFixed(1)} paid hours a week)`);
console.log(`\n  Straight-line search scaled onto each day's real road miles. A real re-plan will differ,`);
console.log(`  and this ignores time windows — it is the size of the prize, not a route.`);
