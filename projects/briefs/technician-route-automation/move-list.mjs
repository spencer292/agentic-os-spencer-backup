#!/usr/bin/env node
// MOVE LIST — turn a proposed relief move into the exact jobs to change in Jobber.
//
// Read-only. Given "take N stops in CITY off <tech> on <day> and put them on <tech> <day>", it
// picks WHICH N by how cheap each one is to move: removal saving on the source day minus the cost
// of landing it next to what the target tech already has that day. Prints job number, customer and
// address so the moves can be made in Jobber by hand.
//
// Removal saving is not just the stop's own service time. Dropping a mid-route stop hands part of
// the drive back as a longer bridge between its neighbours, so the saving is
//   service + drive-in + drive-out - bridge(prev -> next)
// with the bridge estimated from straight-line distance at that route's own average road speed.
// A tail stop has no "next", so it saves the whole of drive-in + service — which is why tails come
// out cheapest and why the relief tool looks there first.
//
// Usage: node move-list.mjs --from-tech="Luke LaVergne" --from-day=2026-08-19 \
//                           --to-tech="Luke LaVergne"   --to-day=2026-08-21 \
//                           --city=Tacoma --n=6

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const K = env.OPTIMOROUTE_API_KEY;
const arg = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const FROM_TECH = arg('from-tech'), FROM_DAY = arg('from-day');
const TO_TECH = arg('to-tech'), TO_DAY = arg('to-day');
const CITY = (arg('city', '') || '').toLowerCase(), N = Number(arg('n', 6));
if (!FROM_TECH || !FROM_DAY || !TO_TECH || !TO_DAY) {
  console.log('Usage: move-list.mjs --from-tech= --from-day= --to-tech= --to-day= [--city=] [--n=6]');
  process.exit(1);
}

const miles = (a, b) => {
  const t = Math.PI / 180, dLat = (b.latitude - a.latitude) * t, dLon = (b.longitude - a.longitude) * t;
  const la = a.latitude * t, lb = b.latitude * t;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  return 3959 * 2 * Math.asin(Math.sqrt(h));
};
const cityOf = s => (s.address || '').split(',')[1]?.trim() || '?';
const nameOf = s => (s.locationName || '').split('·')[0].trim();
const jobOf = s => String(s.orderNo || '').split('-')[0];

const get = async d => (await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json()).routes || [];
const src = (await get(FROM_DAY)).find(r => r.driverName === FROM_TECH);
const dst = (await get(TO_DAY)).find(r => r.driverName === TO_TECH);
if (!src) { console.error(`no route for ${FROM_TECH} on ${FROM_DAY}`); process.exit(1); }
if (!dst) { console.error(`no route for ${TO_TECH} on ${TO_DAY}`); process.exit(1); }

const st = src.stops;
const driveMin = r => Math.round((r.stops || []).reduce((n, s) => n + (s.travelTime || 0), 0) / 60);
const svcTotal = r => (r.duration || 0) - driveMin(r);
const perStopSvc = Math.round(svcTotal(src) / st.length);
const perStopSvcDst = Math.round(svcTotal(dst) / dst.stops.length);

// Straight-line length of a stop list IN THE GIVEN ORDER.
const tourLen = list => list.slice(1).reduce((n, s, i) => n + miles(list[i], s), 0);
// Nearest-neighbour tour from the first stop — the proxy for how a day re-sequences after a change.
function nnLen(list) {
  if (list.length < 2) return 0;
  const left = list.slice(1); let cur = list[0], total = 0;
  while (left.length) {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < left.length; i++) { const d = miles(cur, left[i]); if (d < bd) { bd = d; bi = i; } }
    total += bd; cur = left.splice(bi, 1)[0];
  }
  return total;
}
// Scale a day's REAL road drive by how much its straight-line tour grows or shrinks. Straight-line
// on its own understates road miles badly; the ratio is what carries over.
const scaleDrive = (route, newList) => {
  const base = tourLen(route.stops);
  if (base <= 0) return driveMin(route);
  return Math.round(driveMin(route) * (nnLen(newList) / base));
};

// The first stop of a day is excluded: removing it changes where the tech drives FROM in the
// morning, and the home/depot leg is not in the API response, so any saving would be a guess.
const cands = st.map((s, i) => ({ s, i }))
  .filter(c => c.i > 0)
  .filter(c => !CITY || cityOf(c.s).toLowerCase() === CITY)
  .map(c => {
    let near = Infinity, nearOf = '';
    for (const o of dst.stops) { const d2 = miles(c.s, o); if (d2 < near) { near = d2; nearOf = nameOf(o); } }
    return { ...c, near, nearOf };
  });

// Choose greedily on ACTUAL modelled net: re-cost both days for each additional stop taken.
const chosen = [];
const srcBase = src.duration || 0, dstBase = dst.duration || 0;
while (chosen.length < N && chosen.length < cands.length) {
  let best = null;
  for (const c of cands) {
    if (chosen.includes(c)) continue;
    const trial = [...chosen, c];
    const keep = st.filter(s => !trial.some(t => t.s === s));
    const gain = keep.length ? scaleDrive(src, keep) + perStopSvc * keep.length : 0;
    const add = [...dst.stops, ...trial.map(t => t.s)];
    const cost = scaleDrive(dst, add) + perStopSvcDst * add.length;
    const net = (srcBase - gain) - (cost - dstBase);
    if (!best || net > best.net) best = { c, net, srcAfter: gain, dstAfter: cost };
  }
  if (!best || best.net <= 0) break;
  chosen.push(best.c);
  best.c._srcAfter = best.srcAfter; best.c._dstAfter = best.dstAfter;
}
const pick = chosen;

console.log(`\nMOVE LIST  ${FROM_TECH} ${FROM_DAY}${CITY ? ` (${CITY})` : ''}  →  ${TO_TECH} ${TO_DAY}`);
console.log(`  source day now: ${st.length} stops, ${((src.duration || 0) / 60).toFixed(1)}h   target day now: ${dst.stops.length} stops, ${((dst.duration || 0) / 60).toFixed(1)}h`);
console.log(`  ${cands.length} candidate(s) in scope; taking ${pick.length}\n`);
console.log(`  ${'job'.padEnd(6)} ${'customer'.padEnd(26)} ${'address'.padEnd(42)}  nearest stop on target day`);
for (const c of pick) {
  console.log(`  #${jobOf(c.s).padEnd(5)} ${nameOf(c.s).slice(0, 25).padEnd(26)} ${(c.s.address || '').split(',').slice(0, 2).join(',').slice(0, 41).padEnd(42)}  ${c.near.toFixed(1)} mi (${c.nearOf.slice(0, 20)})`);
}
if (!pick.length) { console.log('  (no move improves both days — nothing to suggest here)'); process.exit(0); }
const srcAfter = pick[pick.length - 1]._srcAfter, dstAfter = pick[pick.length - 1]._dstAfter;
console.log(`\n  ${FROM_TECH} ${FROM_DAY}: ${(srcBase / 60).toFixed(1)}h  ->  ~${(srcAfter / 60).toFixed(1)}h   (${st.length} -> ${st.length - pick.length} stops)`);
console.log(`  ${TO_TECH} ${TO_DAY}: ${(dstBase / 60).toFixed(1)}h  ->  ~${(dstAfter / 60).toFixed(1)}h   (${dst.stops.length} -> ${dst.stops.length + pick.length} stops)`);
console.log(`  combined: ${((srcBase + dstBase) / 60).toFixed(1)}h -> ${((srcAfter + dstAfter) / 60).toFixed(1)}h`);
console.log(`\n  Estimates from a nearest-neighbour re-solve scaled onto each day's real road drive.`);
console.log(`  OptimoRoute re-sequences properly after the move, so expect close but not identical.`);
