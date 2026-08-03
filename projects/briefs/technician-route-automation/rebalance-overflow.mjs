#!/usr/bin/env node
// OVERFLOW REBALANCER — Spencer's rule, 2026-08-01, stated exactly:
//
//   "Each tech owns their territory. If there is overflow it gets taken over by the closest tech,
//    and only the jobs that are the closest to the tech that is taking over."
//
// So: territory is the default (the grid). Overflow is the exception. And overflow moves ONE JOB AT
// A TIME, cheapest-first, to whichever tech's route that day actually passes nearest to it — never
// by moving a whole zip, which is what kept sending a tech out of their way.
//
// For every stop belonging to an over-target tech it computes:
//   RELEASE  = (A->S + S->B) - (A->B) + service   ... time that day gets back if the stop leaves
//   INSERT   = (C->S + S->D) - (C->D) + service   ... time the receiving day pays to take it
// A move is allowed only when INSERT <= --max-detour (default 15 min, Spencer's ceiling), and only
// when the receiving tech stays under the weekly cap. Cheapest INSERT goes first.
//
// REPORT ONLY. Emits jobOverrides to paste into the grid; writes nothing anywhere.
//
// Usage: node rebalance-overflow.mjs --from=2026-08-03 --to=2026-08-07 [--cap=40] [--max-detour=15]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const K = env.OPTIMOROUTE_API_KEY;
const arg = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = arg('from'), TO = arg('to');
const CAP = Number(arg('cap', 42)), MAX_DETOUR = Number(arg('max-detour', 15));
// 42 = Spencer's 40h target + the 2h/week of overtime he approved 2026-08-01. Aim at 40, never 42+.
const SERVICE = 10 / 60; // hours on site per stop

const addD = (d, n) => { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10); };
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const R = 3958.8, rad = x => x * Math.PI / 180;
const miles = (a, b) => {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const mins = mi => (mi * 1.3) / 35 * 60;   // road factor + 35 mph; ranking metric, not a router

// ---------- load the week ----------
const dates = []; for (let d = FROM; d <= TO; d = addD(d, 1)) dates.push(d);
const day = {};   // date -> driver -> {stops:[{job,lat,lon,name}], hours}
for (const d of dates) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json();
  day[d] = {};
  for (const rt of r.routes || []) {
    const st = (rt.stops || []).filter(s => s.latitude != null);
    if (!st.length) continue;
    const span = (new Date(st[st.length - 1].scheduledAtDt.replace(' ', 'T')) - new Date(st[0].scheduledAtDt.replace(' ', 'T'))) / 3600000;
    day[d][rt.driverName] = {
      hours: span,
      stops: st.map(s => ({ job: (s.orderNo || '').split('-')[0], lat: s.latitude, lon: s.longitude, name: s.locationName || '' })),
    };
  }
}
const techs = [...new Set(dates.flatMap(d => Object.keys(day[d])))];
const weekHours = t => dates.reduce((a, d) => a + (day[d][t]?.hours || 0), 0);

// cheapest place to slot a point into a route (returns added minutes)
const insertCost = (stops, p) => {
  if (!stops.length) return Infinity;
  let best = Math.min(mins(miles(p, stops[0])), mins(miles(stops[stops.length - 1], p)));
  for (let i = 0; i < stops.length - 1; i++)
    best = Math.min(best, mins(miles(stops[i], p)) + mins(miles(p, stops[i + 1])) - mins(miles(stops[i], stops[i + 1])));
  return best;
};
// time the owning day gets back by dropping this stop
const releaseSaving = (stops, idx) => {
  if (stops.length < 2) return 0;
  const s = stops[idx];
  if (idx === 0) return mins(miles(s, stops[1]));
  if (idx === stops.length - 1) return mins(miles(stops[idx - 1], s));
  return mins(miles(stops[idx - 1], s)) + mins(miles(s, stops[idx + 1])) - mins(miles(stops[idx - 1], stops[idx + 1]));
};

console.log('WEEK HOURS (first stop to last stop)');
for (const t of techs.sort()) console.log(`  ${t.padEnd(20)} ${weekHours(t).toFixed(1)}h${weekHours(t) > CAP ? '   << OVER' : ''}`);

const over = techs.filter(t => weekHours(t) > CAP).sort((a, b) => weekHours(b) - weekHours(a));
if (!over.length) { console.log(`\nnobody over ${CAP}h — nothing to rebalance.`); process.exit(0); }

const moves = [];
// CASCADE (Spencer 2026-08-01): shed the most-over tech first, recompute, repeat. If the nearest
// neighbour is also over, it sheds to ITS neighbour in an earlier round and room appears here.
const extra = {};                       // tech -> hours added so far this run
const taken = new Set();                // jobs already moved � MUST outlive the round loop, or a
                                        // later round re-proposes the same job and double-counts it
const hoursNow = t => weekHours(t) + (extra[t] || 0);
for (let round = 0; round < 6; round++) {
  const overNow = techs.filter(t => hoursNow(t) > CAP).sort((a, b) => hoursNow(b) - hoursNow(a));
  if (!overNow.length) break;
  const src = overNow[0];
  let need = hoursNow(src) - CAP;
  console.log(`\n${src} is ${need.toFixed(1)}h over. Cheapest jobs to hand to a neighbouring tech:\n`);
  // every candidate move: one stop -> another tech, same date preferred
  const cands = [];
  for (const d of dates) {
    const route = day[d][src]; if (!route) continue;
    route.stops.forEach((s, i) => {
      for (const dst of techs) {
        if (dst === src) continue;
        // Days may shift now, so consider EVERY day of the receiving tech, not just this one.
        // Same-day is kept as the tie-break because stability is still the preference.
        for (const d2 of dates) {
          const target = day[d2][dst]; if (!target) continue;
          const cost = insertCost(target.stops, s);
          if (cost > MAX_DETOUR) continue;
          cands.push({ date: d2, dow: DOW[new Date(d2 + 'T12:00:00Z').getUTCDay()], job: s.job, name: s.name,
                       src, dst, cost, saving: releaseSaving(route.stops, i), sameDay: d2 === d });
        }
      }
    });
  }
  // cheapest insertion first — "only the jobs closest to the tech taking over"
  cands.sort((a, b) => a.cost - b.cost || (b.sameDay - a.sameDay));
  for (const c of cands) {
    if (need <= 0) break;
    if (taken.has(c.job)) continue;
    if (hoursNow(c.dst) + (c.cost + SERVICE * 60) / 60 > CAP) continue;   // never push the receiver over
    taken.add(c.job);
    extra[c.dst] = (extra[c.dst] || 0) + (c.cost + SERVICE * 60) / 60;
    extra[c.src] = (extra[c.src] || 0) - (c.saving + SERVICE * 60) / 60;
    need -= (c.saving + SERVICE * 60) / 60;
    moves.push(c);
    console.log(`  #${String(c.job).padEnd(5)} ${c.name.slice(0, 30).padEnd(32)} ${c.dow} -> ${c.dst.split(' ')[0].padEnd(9)} +${c.cost.toFixed(0)}min detour, frees ${(c.saving + SERVICE * 60).toFixed(0)}min`);
  }
  if (need > 0) console.log(`  !! still ${need.toFixed(1)}h over — no more jobs within ${MAX_DETOUR} min of another tech's route.`);
}

if (moves.length) {
  console.log('\n--- jobOverrides ---');
  for (const m of moves)
    console.log(`    '${m.job}': { client: ${JSON.stringify(m.name.split(' · ')[0])}, tech: ${JSON.stringify(m.dst)}, day: '${m.dow}', decided: true,\n              note: 'Overflow from ${m.src} — ${m.cost.toFixed(0)} min detour for the receiving route (auto-rebalance ${FROM}).' },`);
}
console.log('\nREPORT ONLY — nothing written.');
