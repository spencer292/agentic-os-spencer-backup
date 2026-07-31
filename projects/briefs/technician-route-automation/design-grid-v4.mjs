#!/usr/bin/env node
// FOUR-WAY TERRITORY DESIGNER (v4, 2026-07-29).
// Spencer out of the field permanently; Elias ("Alias Franks" in Jobber) becomes the 4th truck.
//
// Two stages, both geographic — because the measured waste is in the CONSTRAINTS, not in
// OptimoRoute's sequencing (proved 2026-07-29: re-sequencing saved 0 of 2003 mi; freeing days cost
// +20%). So the win has to come from tighter (tech, day) cells.
//
//   1) TECH: capacity-balanced nearest-anchor assignment of every zip to one of four territory
//      anchors. Assigned in order of "regret" (best vs 2nd-best anchor) so the zips that care most
//      about their anchor get placed before capacity runs out.
//   2) DAY: per tech, weighted k-means (k=5) over that tech's zip centroids, then a repair pass that
//      evens the day volumes, then clusters mapped west->east onto mon..fri.
//
// Emits territory-grid-v4.json (same schema as territory-grid.json + a `works` roster) and a report.
// Does NOT touch the live grid. Trial it with: push-week.mjs --grid=territory-grid-v4.json
//
// Usage: node design-grid-v4.mjs [--report]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const Z = JSON.parse(fs.readFileSync(path.join(__dirname, 'zip-centroids.json'), 'utf8'));
const OLD = JSON.parse(fs.readFileSync(path.join(__dirname, 'territory-grid.json'), 'utf8'));

// Territory anchors. Chosen to reproduce each tech's existing core so nobody loses their whole patch:
// Elias inherits the north Eastside his route was already started on; Cory the Bellevue-Sammamish
// spine; Cammeron South King; Luke the Pierce/Thurston south sound.
const ANCHORS = [
  { tech: 'Alias Franks',      lat: 47.6740, lon: -122.1215, cap: 100, note: 'north Eastside — Redmond anchor' },
  { tech: 'Cory Ventura',      lat: 47.5750, lon: -122.0700, cap: 108, note: 'Bellevue/Sammamish spine' },
  { tech: 'Cammeron Anderson', lat: 47.3809, lon: -122.2348, cap: 110, note: 'South King — Kent anchor' },
  { tech: 'Luke LaVergne',     lat: 47.1900, lon: -122.3500, cap: 126, note: 'South Sound — Pierce/Thurston' },
];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// HARD PINS. Straight-line distance treats Puget Sound as drivable, so the peninsula has to be pinned
// or it gets handed to whoever is nearest as the crow flies (v4 draft 1 put Gig Harbor on Elias and
// Olalla on Cammeron — both across the Narrows). Elias's core is pinned to the north Eastside block
// his route was already started on, so capacity pressure can't push him into Seattle instead.
const PENINSULA = ['98332', '98333', '98335', '98351', '98359', '98394'];
const ELIAS_CORE = ['98052', '98053', '98033', '98034', '98005', '98004', '98039',
                    '98077', '98072', '98019', '98014', '98296', '98011', '98021', '98028',
                    // north-Seattle strip: reached from Kenmore/Lake Forest Park, not from Renton
                    '98117', '98177', '98133', '98155', '98125', '98115', '98199', '98105'];
const PIN_TECH = {};
for (const z of PENINSULA) PIN_TECH[z] = 'Luke LaVergne';       // Spencer 2026-07-29: peninsula -> Luke
for (const z of ELIAS_CORE) PIN_TECH[z] = 'Alias Franks';
// The peninsula is one trip over the bridge — it must be a single day, never sprinkled across the week.
// Gig Harbor is reached THROUGH Tacoma, so the peninsula rides with Luke's west-Tacoma day.
const PIN_DAY = Object.fromEntries(PENINSULA.map(z => [z, 'wed']));
const R = 3958.8;
const raw = (a, b) => { const p = Math.PI / 180, dLat = (b.lat - a.lat) * p, dLon = (b.lon - a.lon) * p;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * p) * Math.cos(b.lat * p) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)); };

// WATER BARRIERS. A straight line is a bad proxy for driving here: Ballard->Kirkland is 8 crow-miles
// but a 520-bridge trip, and Gig Harbor->Tacoma means the Narrows. Each barrier is a meridian segment;
// crossing it costs the real detour to the nearest bridge. Without this the designer builds days that
// pair West Seattle with Redmond (v4 draft 2).
const BARRIERS = [
  { lon: -122.25, latMin: 47.52, latMax: 47.72, penalty: 10, name: 'Lake Washington' },
  { lon: -122.55, latMin: 47.15, latMax: 47.45, penalty: 25, name: 'Tacoma Narrows' },
  { lon: -122.08, latMin: 47.53, latMax: 47.64, penalty: 5,  name: 'Lake Sammamish' },
];
const hav = (a, b) => {
  let d = raw(a, b);
  for (const bar of BARRIERS) {
    if ((a.lon - bar.lon) * (b.lon - bar.lon) >= 0) continue;            // both on the same side
    const t = (bar.lon - a.lon) / (b.lon - a.lon);                        // where it crosses
    const lat = a.lat + t * (b.lat - a.lat);
    if (lat >= bar.latMin && lat <= bar.latMax) d += bar.penalty;
  }
  return d;
};

// ---------- stage 1: tech ----------
const zips = Object.entries(Z).map(([zip, v]) => ({ zip, ...v }));
for (const z of zips) {
  z.d = ANCHORS.map(a => ({ tech: a.tech, mi: hav(z, a) })).sort((x, y) => x.mi - y.mi);
  z.regret = z.d[1].mi - z.d[0].mi;
}
zips.sort((a, b) => b.regret - a.regret);
const load = {}; for (const a of ANCHORS) load[a.tech] = 0;
const capOf = Object.fromEntries(ANCHORS.map(a => [a.tech, a.cap]));
// pinned zips claim their tech first, before capacity is spent on anything else
for (const z of zips) if (PIN_TECH[z.zip]) { z.tech = PIN_TECH[z.zip]; load[z.tech] += z.n; }
for (const z of zips) {
  if (z.tech) continue;
  const pick = z.d.find(c => load[c.tech] + z.n <= capOf[c.tech]) || z.d[0];
  z.tech = pick.tech; load[pick.tech] += z.n;
}

// ---------- stage 2: day, per tech ----------
function kmeans(items, k, iters = 60, seedIdx = null) {
  // seed: either spread by longitude (geographic slices) or from an explicit seed set, so the caller
  // can restart from many starting points and keep the most COMPACT result rather than the first one.
  const sorted = items.slice().sort((a, b) => a.lon - b.lon);
  let cents = seedIdx
    ? seedIdx.map(i => ({ lat: items[i].lat, lon: items[i].lon }))
    : Array.from({ length: k }, (_, i) => {
        const s = sorted[Math.min(sorted.length - 1, Math.floor(i * sorted.length / k))];
        return { lat: s.lat, lon: s.lon };
      });
  let asg = items.map(() => 0);
  for (let it = 0; it < iters; it++) {
    let moved = false;
    items.forEach((z, i) => {
      let best = 0, bd = Infinity;
      cents.forEach((c, ci) => { const d = hav(z, c); if (d < bd) { bd = d; best = ci; } });
      if (asg[i] !== best) { asg[i] = best; moved = true; }
    });
    cents = cents.map((_, ci) => {
      const mem = items.filter((_, i) => asg[i] === ci);
      const w = mem.reduce((a, m) => a + m.n, 0) || 1;
      return mem.length ? { lat: mem.reduce((a, m) => a + m.lat * m.n, 0) / w, lon: mem.reduce((a, m) => a + m.lon * m.n, 0) / w } : cents[ci];
    });
    if (!moved) break;
  }
  return { asg, cents };
}

const grid = { _comment: 'TERRITORY GRID v4 — four-way split. Spencer out of field (permanent, 2026-07-29); Elias ("Alias Franks" in Jobber) is the 4th truck. Generated by design-grid-v4.mjs from real next-week volumes + OptimoRoute zip centroids.', generated: '2026-07-29', works: {}, zips: {}, jobOverrides: {} };
for (const a of ANCHORS) grid.works[a.tech] = [...DAYS];

const report = [];
for (const a of ANCHORS) {
  const all = zips.filter(z => z.tech === a.tech);
  // day-pinned zips (the peninsula run) are held out of clustering, then added to their fixed day —
  // otherwise they drag a cluster centroid across the water and wreck that day's compactness.
  const pinned = all.filter(z => PIN_DAY[z.zip]);
  const mine = all.filter(z => !PIN_DAY[z.zip]);
  const total = all.reduce((s, z) => s + z.n, 0);
  const target = total / 5;
  // Score a day-assignment: total weighted spread inside each day (what the truck actually drives)
  // plus a penalty for uneven days. Lower is better.
  const score = (as) => {
    const vol = [0, 0, 0, 0, 0]; mine.forEach((z, i) => vol[as[i]] += z.n);
    let spread = 0;
    for (let ci = 0; ci < 5; ci++) {
      const mem = mine.filter((_, i) => as[i] === ci);
      for (let x = 0; x < mem.length; x++) for (let y = x + 1; y < mem.length; y++)
        spread += hav(mem[x], mem[y]) * Math.min(mem[x].n, mem[y].n);
    }
    const imbalance = Math.max(...vol) - Math.min(...vol);
    return spread / Math.max(1, total) + 40 * Math.max(0, imbalance - target * 0.30);
  };
  const balance = (as) => {   // even out day volumes by moving the geographically cheapest zip
    for (let pass = 0; pass < 300; pass++) {
      const vol = [0, 0, 0, 0, 0]; mine.forEach((z, i) => vol[as[i]] += z.n);
      const hi = vol.indexOf(Math.max(...vol)), lo = vol.indexOf(Math.min(...vol));
      if (vol[hi] - vol[lo] <= Math.max(3, target * 0.30)) break;
      const loMem = mine.filter((_, i) => as[i] === lo);
      const w = loMem.reduce((s, m) => s + m.n, 0) || 1;
      const loC = { lat: loMem.reduce((s, m) => s + m.lat * m.n, 0) / w, lon: loMem.reduce((s, m) => s + m.lon * m.n, 0) / w };
      let cand = -1, cd = Infinity;
      mine.forEach((z, i) => { if (as[i] !== hi) return; if (vol[hi] - z.n < vol[lo] + z.n) return;
        const d = hav(z, loC); if (d < cd) { cd = d; cand = i; } });
      if (cand < 0) break;
      as[cand] = lo;
    }
    return as;
  };
  let asg = balance(kmeans(mine, 5).asg), bestScore = score(asg);
  for (let r = 0; r < 400; r++) {   // random restarts — keep the most compact balanced solution
    const seed = []; const used = new Set();
    while (seed.length < 5) { const i = Math.floor(Math.random() * mine.length); if (!used.has(i)) { used.add(i); seed.push(i); } }
    const cand = balance(kmeans(mine, 5, 60, seed).asg);
    const s = score(cand);
    if (s < bestScore) { bestScore = s; asg = cand; }
  }
  // map clusters west -> east onto mon..fri
  const order = [0, 1, 2, 3, 4].map(ci => {
    const mem = mine.filter((_, i) => asg[i] === ci);
    const w = mem.reduce((s, m) => s + m.n, 0) || 1;
    return { ci, lon: mem.length ? mem.reduce((s, m) => s + m.lon * m.n, 0) / w : 0 };
  }).sort((x, y) => x.lon - y.lon);
  const dayOf = {}; order.forEach((o, i) => dayOf[o.ci] = DAYS[i]);
  const perDay = {};
  const place = (z, day, note) => {
    grid.zips[z.zip] = { day, tech: a.tech, cities: '', visitsNextWeek: z.n, decided: false, note };
    (perDay[day] = perDay[day] || []).push(z);
  };
  mine.forEach((z, i) => place(z, dayOf[asg[i]], `grid v4 four-way split (${a.note})`));
  // Attach the held-out group (the peninsula) to whichever day is genuinely nearest under the
  // barrier-aware metric, rather than a weekday guessed in advance — that is what lands it with the
  // west-Tacoma day it is reached through, instead of with Graham/Yelm 68 mi away.
  if (pinned.length) {
    const pw = pinned.reduce((s, z) => s + z.n, 0) || 1;
    const pc = { lat: pinned.reduce((s, z) => s + z.lat * z.n, 0) / pw, lon: pinned.reduce((s, z) => s + z.lon * z.n, 0) / pw };
    // A meridian barrier can't model Puget Sound's shape: Gig Harbor and Olympia are both west of the
    // Narrows line at their own latitudes, so the metric called them neighbours and put the peninsula
    // on the Olympia day. In reality you reach the peninsula over the Narrows from west Tacoma, so the
    // peninsula follows its GATEWAY zip's day.
    const GATEWAY = ['98407', '98466', '98443', '98406'];   // west Tacoma / University Place
    let bestDay = null;
    for (const d of DAYS) if ((perDay[d] || []).some(z => GATEWAY.includes(z.zip))) { bestDay = d; break; }
    if (!bestDay) {
      let bd = Infinity; bestDay = DAYS[0];
      for (const d of DAYS) {
        const mem = perDay[d] || []; if (!mem.length) continue;
        const w = mem.reduce((s, m) => s + m.n, 0) || 1;
        const c = { lat: mem.reduce((s, m) => s + m.lat * m.n, 0) / w, lon: mem.reduce((s, m) => s + m.lon * m.n, 0) / w };
        const dist = hav(pc, c); if (dist < bd) { bd = dist; bestDay = d; }
      }
    }
    for (const z of pinned) place(z, bestDay, `grid v4 — peninsula, one trip over the Narrows with the ${bestDay} west-Tacoma run (Spencer 2026-07-29: peninsula -> Luke)`);
  }
  report.push({ tech: a.tech, total, perDay });
}

// carry forward job-level overrides, dropping every Spencer one (he is out of the field)
let dropped = 0, kept = 0;
for (const [job, ov] of Object.entries(OLD.jobOverrides || {})) {
  if (/spencer/i.test(ov.tech || '')) { dropped++; continue; }
  grid.jobOverrides[job] = ov; kept++;
}

fs.writeFileSync(path.join(__dirname, 'territory-grid-v4.json'), JSON.stringify(grid, null, 1));

console.log('=== TECH TOTALS (next week, 434 visits) ===');
for (const r of report) console.log(`  ${r.tech.padEnd(20)} ${String(r.total).padStart(4)} visits`);
console.log(`\njobOverrides: kept ${kept}, dropped ${dropped} Spencer overrides`);
for (const r of report) {
  console.log(`\n#### ${r.tech} — ${r.total} visits`);
  for (const d of DAYS) {
    const m = r.perDay[d] || [];
    const n = m.reduce((s, z) => s + z.n, 0);
    const cities = m.sort((a, b) => b.n - a.n).slice(0, 7).map(z => `${z.zip}(${z.n})`).join(' ');
    // day compactness: max distance between any two zips in the day
    let spread = 0;
    for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) spread = Math.max(spread, hav(m[i], m[j]));
    console.log(`   ${d}  ${String(n).padStart(3)} visits, ${String(m.length).padStart(2)} zips, ${spread.toFixed(0)} mi wide   ${cities}${m.length > 7 ? ' …' : ''}`);
  }
}
console.log('\nWrote territory-grid-v4.json');
