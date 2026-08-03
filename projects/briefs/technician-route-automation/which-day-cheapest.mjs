#!/usr/bin/env node
// Which of a tech's days is the CHEAPEST home for one job? Answers "this stop is sitting on its own
// — where does it actually belong?" by measuring the real detour, not by eyeballing a map.
//
// For each candidate date it finds the tech's route, locates the two consecutive stops the job would
// slot between, and reports the INSERTION COST: (A->job + job->B) - (A->B). That is the minutes the
// job actually adds to that day, which is the number Spencer cares about.
//
// Usage: node which-day-cheapest.mjs --job=8053 --tech="Cammeron Anderson" --dates=2026-08-05,2026-08-06
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const K = env.OPTIMOROUTE_API_KEY;
const arg = n => (process.argv.find(a => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
const JOB = arg('job'), TECH = arg('tech'), DATES = arg('dates').split(',').filter(Boolean);

// straight-line miles, then a 1.3x road factor and 35 mph to get a comparable minute figure.
// Good enough to rank candidate days against each other; it is not a routing engine.
const R = 3958.8, rad = d => d * Math.PI / 180;
const dist = (a, b) => {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const minutes = mi => (mi * 1.3) / 35 * 60;

const routes = {};
for (const d of DATES) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json();
  routes[d] = (r.routes || []).find(rt => rt.driverName === TECH);
}

// find the job's own coordinates from whichever route currently holds it
let target = null;
for (const d of DATES) for (const s of (routes[d]?.stops || []))
  if ((s.orderNo || '').startsWith(JOB + '-')) target = { lat: s.latitude, lon: s.longitude, name: s.locationName, on: d };
if (!target) { console.log(`job ${JOB} is not on ${TECH}'s route on any of ${DATES.join(', ')}`); process.exit(1); }

console.log(`${target.name}\ncurrently on ${target.on}\n`);
const results = [];
for (const d of DATES) {
  const stops = (routes[d]?.stops || []).filter(s => !(s.orderNo || '').startsWith(JOB + '-'))
    .map(s => ({ lat: s.latitude, lon: s.longitude, name: s.locationName }));
  if (stops.length < 2) { console.log(`  ${d}: route too short to measure`); continue; }
  let best = null;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    const cost = minutes(dist(a, target)) + minutes(dist(target, b)) - minutes(dist(a, b));
    if (!best || cost < best.cost) best = { cost, after: a.name, before: b.name };
  }
  // also allow slotting at the very start or very end of the day
  const head = minutes(dist(target, stops[0])), tail = minutes(dist(stops[stops.length - 1], target));
  if (head < best.cost) best = { cost: head, after: '(start of day)', before: stops[0].name };
  if (tail < best.cost) best = { cost: tail, after: stops[stops.length - 1].name, before: '(end of day)' };
  results.push({ date: d, ...best });
  console.log(`  ${d}  +${best.cost.toFixed(0)} min   between ${best.after.slice(0, 28)} and ${best.before.slice(0, 28)}`);
}
results.sort((a, b) => a.cost - b.cost);
if (results.length > 1)
  console.log(`\nCHEAPEST: ${results[0].date} (+${results[0].cost.toFixed(0)} min) — saves ${(results[1].cost - results[0].cost).toFixed(0)} min against ${results[1].date}`);
