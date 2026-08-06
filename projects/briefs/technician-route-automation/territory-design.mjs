#!/usr/bin/env node
// TERRITORY DESIGN — assign whole REGIONS to technicians as owned territory, balancing weekly hours
// while minimising the commute nobody was costing: the drive from a tech's home to their first stop.
//
// Spencer 2026-08-06: "let's break it down technician by technician... both cost-effectively and
// mileage-efficiently, and create these into territories that each technician owns."
//
// Why commute drives this: measured 2026-07-27..08-07, the drive to stop #1 is 22% of all weekly
// miles. Cory lives ~1 mi from Buckley and was being sent to Bellevue (41 mi), Carnation (43) and
// Burien (35) — 309 commute miles / 6.1 h over 10 route days, against Cammeron's 130 mi from the
// same town. Territory that ignores where people sleep pays for it every morning.
//
// Method: regions come from region-capacity.mjs (real volume + measured drive cost per stop). Each
// region gets a volume-weighted centroid from zip-centroids.json. Tech homes are inferred by
// tech-home-infer.mjs (closest observed first stop). Then a greedy assignment seeded by proximity,
// followed by improvement swaps, minimises total weighted commute subject to an hours band.
//
// READ-ONLY — proposes, never writes.
//
// Usage: node territory-design.mjs [--band=0.15] [--hours=8]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const BAND = Number(flag('band', 0.15));      // allowed +/- deviation from the mean tech load
const DAY_HOURS = Number(flag('hours', 8));

// --- inputs -----------------------------------------------------------------
// Homes: closest observed first stop per tech (tech-home-infer.mjs, 2026-07-27..08-07).
// These are proxies accurate to a few miles, which is the resolution territory design needs.
const HOMES = {
  'Cammeron Anderson': { lat: 47.1631, lon: -122.0270, note: 'Buckley 98321 (2.4 mi closest start)' },
  'Cory Ventura': { lat: 47.1470, lon: -121.9860, note: 'Buckley 98321 (1.0 mi closest start)' },
  'Luke LaVergne': { lat: 47.1793, lon: -122.3070, note: 'Puyallup 98373 (4.7 mi closest start)' },
  'Alias Franks': { lat: 47.8570, lon: -122.1120, note: 'Snohomish 98296 (9.9 mi closest start)' },
};

// Region -> member zips. Mirrors region-capacity.mjs; kept explicit so a region can be re-cut here
// without touching the measurement script.
const REGION_ZIPS = {
  'Plateau (Enumclaw/Buckley/Bonney Lake)': ['98022', '98321', '98391', '98390', '98010', '98051'],
  'Kirkland / Redmond / Woodinville': ['98033', '98034', '98052', '98053', '98072', '98077', '98011', '98019', '98021', '98296'],
  'Thurston / Olympia': ['98501', '98502', '98503', '98506', '98512', '98513', '98516', '98597'],
  'Kent / Covington / Maple Valley': ['98030', '98031', '98032', '98042', '98038'],
  'Seattle': ['98103', '98105', '98107', '98108', '98112', '98115', '98116', '98117', '98118', '98122', '98125', '98126', '98133', '98136', '98177', '98199'],
  'Renton / Newcastle': ['98055', '98056', '98057', '98058', '98059'],
  'Sammamish / Issaquah': ['98027', '98029', '98074', '98075'],
  'Bellevue / Mercer': ['98004', '98005', '98006', '98007', '98008', '98039', '98040'],
  'Graham / Orting': ['98338', '98360', '98580', '98328'],
  'Snoqualmie Valley': ['98014', '98024', '98045', '98065'],
  'Auburn / Federal Way': ['98001', '98002', '98003', '98023', '98092', '98047'],
  'Puyallup / Edgewood': ['98371', '98372', '98373', '98374', '98375', '98354'],
  'Tacoma': ['98402', '98403', '98404', '98405', '98406', '98407', '98408', '98409', '98443', '98445', '98446', '98465', '98466'],
  'Peninsula / Gig Harbor': ['98329', '98332', '98335', '98349', '98351', '98359', '98366', '98367', '98310', '98312'],
  'Burien / SeaTac / South King': ['98146', '98148', '98158', '98166', '98168', '98178', '98188', '98198'],
  'Lakewood / UP / Spanaway': ['98327', '98387', '98388', '98498', '98499'],
  'Shoreline / North': ['98155', '98028', '98020', '98026'],
};

const capFile = fs.readdirSync(__dirname).filter(f => f.startsWith('region-capacity-') && f.endsWith('.json')).sort().pop();
if (!capFile) { console.error('Run region-capacity.mjs first.'); process.exit(1); }
const cap = JSON.parse(fs.readFileSync(path.join(__dirname, capFile), 'utf8'));
const centroids = JSON.parse(fs.readFileSync(path.join(__dirname, 'zip-centroids.json'), 'utf8'));

const R = 3958.8;
const rad = d => d * Math.PI / 180;
function haversine(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad((b.lon ?? b.lng) - (a.lon ?? a.lng));
  const la1 = rad(a.lat), la2 = rad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// region centroid, weighted by how many stops each zip actually contributes
const regions = [];
for (const r of cap.rows) {
  if (r.name === 'UNMAPPED') continue;
  const zips = REGION_ZIPS[r.name] || [];
  let lat = 0, lon = 0, w = 0;
  for (const z of zips) {
    const c = centroids[z];
    if (!c) continue;
    const wt = c.n || 1;
    lat += c.lat * wt; lon += c.lon * wt; w += wt;
  }
  if (!w) { console.error(`no centroid data for ${r.name} — skipped`); continue; }
  regions.push({ name: r.name, hours: r.hoursPerWeek, visits: r.perWeek, lat: lat / w, lon: lon / w, days: Math.max(1, Math.round(r.hoursPerWeek / DAY_HOURS)) });
}
regions.sort((a, b) => b.hours - a.hours);

const techs = Object.keys(HOMES);
const totalH = regions.reduce((n, r) => n + r.hours, 0);
const mean = totalH / techs.length;
const lo = mean * (1 - BAND), hi = mean * (1 + BAND);

// A region needing more than one day is split into DAY-CHUNKS, and chunks may go to different techs.
// The Plateau is 19.8 h / 3 days and BOTH Cammeron and Cory live in it — forcing it to a single
// owner is what left Cory at 24 h while everyone else sat at 43. Continuity is per CUSTOMER, not per
// region, so two techs sharing a large region is fine as long as each keeps their own customers.
const chunks = [];
for (const r of regions) {
  const n = Math.max(1, Math.ceil(r.hours / DAY_HOURS));
  for (let i = 0; i < n; i++) {
    chunks.push({ ...r, chunkOf: n, hours: r.hours / n, visits: r.visits / n, days: 1, label: n > 1 ? `${r.name} (${i + 1}/${n})` : r.name });
  }
}
chunks.sort((a, b) => b.hours - a.hours);

// Cost is hours-weighted distance: time spent in a far region is what actually buys commute, since a
// tech drives home->region and back once per day they work there.
const cost = (t, r) => haversine(HOMES[t], r) * r.hours;

// greedy seed: nearest tech with room; ties broken by who is emptier so co-located techs share
const assign = {};
for (const t of techs) assign[t] = [];
const load = () => Object.fromEntries(techs.map(t => [t, assign[t].reduce((n, r) => n + r.hours, 0)]));
for (const r of chunks) {
  const l = load();
  const eligible = techs.filter(t => l[t] + r.hours <= hi);
  const pool = eligible.length ? eligible : techs;
  pool.sort((a, b) => {
    const d = cost(a, r) - cost(b, r);
    if (Math.abs(d) > 0.5) return d;
    return l[a] - l[b];
  });
  assign[pool[0]].push(r);
}

// improvement pass: swap or move a region if it lowers total commute and keeps both techs in band
function totalCost() { return techs.reduce((n, t) => n + assign[t].reduce((m, r) => m + cost(t, r), 0), 0); }
for (let iter = 0; iter < 400; iter++) {
  let improved = false;
  const l = load();
  for (const a of techs) for (const b of techs) {
    if (a === b) continue;
    for (let i = 0; i < assign[a].length; i++) {
      const r = assign[a][i];
      // move
      if (l[b] + r.hours <= hi && l[a] - r.hours >= lo) {
        if (cost(b, r) < cost(a, r)) {
          assign[a].splice(i, 1); assign[b].push(r); improved = true; break;
        }
      }
      // swap
      for (let j = 0; j < assign[b].length; j++) {
        const s = assign[b][j];
        const la = l[a] - r.hours + s.hours, lb = l[b] - s.hours + r.hours;
        if (la < lo || la > hi || lb < lo || lb > hi) continue;
        const before = cost(a, r) + cost(b, s), after = cost(a, s) + cost(b, r);
        if (after < before - 0.01) {
          assign[a][i] = s; assign[b][j] = r; improved = true; break;
        }
      }
      if (improved) break;
    }
    if (improved) break;
  }
  if (!improved) break;
}

// --- report -----------------------------------------------------------------
console.log(`TERRITORY DESIGN — ${regions.length} regions, ${techs.length} techs`);
console.log(`Total ${totalH.toFixed(1)} h/wk · mean ${mean.toFixed(1)} h/tech · band ${(lo).toFixed(1)}–${(hi).toFixed(1)} h\n`);
console.log('Homes (inferred from closest observed first stop):');
for (const t of techs) console.log(`  ${t.padEnd(20)} ${HOMES[t].note}`);

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
console.log('\n');
for (const t of techs) {
  const list = assign[t].slice().sort((a, b) => b.hours - a.hours);
  const h = list.reduce((n, r) => n + r.hours, 0);
  const v = list.reduce((n, r) => n + r.visits, 0);
  const dayCount = list.reduce((n, r) => n + r.days, 0);
  console.log(`=== ${t} ===   ${h.toFixed(1)} h/wk · ${v.toFixed(0)} visits · ${dayCount} region-days`);
  for (const r of list) {
    const mi = haversine(HOMES[t], r);
    console.log(`   ${(r.label || r.name).padEnd(44)} ${r.hours.toFixed(1).padStart(5)}h ${r.visits.toFixed(0).padStart(4)}v  home→region ${mi.toFixed(0)} mi`);
  }
  console.log(`   weekly commute (2 x ${list.length} day-trips): ${commuteOf(t).toFixed(0)} mi\n`);
}

// One round trip per DAY worked, to that day's region — not per region-day.
function commuteOf(t) { return assign[t].reduce((n, r) => n + haversine(HOMES[t], r) * 2, 0); }
const totalCommute = techs.reduce((n, t) => n + commuteOf(t), 0);
console.log(`TOTAL weekly commute across the team: ${totalCommute.toFixed(0)} mi`);

// what today costs, for comparison
console.log('\n--- current assignment, same measure ---');
const curCommute = {};
for (const r of cap.rows) {
  if (r.name === 'UNMAPPED') continue;
  const reg = regions.find(x => x.name === r.name);
  if (!reg) continue;
  const top = Object.entries(r.techs || {}).sort((a, b) => b[1] - a[1])[0];
  if (!top) continue;
  const full = techs.find(t => t.split(' ')[0] === top[0]);
  if (!full) continue;
  curCommute[full] = (curCommute[full] || 0) + haversine(HOMES[full], reg) * 2 * reg.days;
}
let curTotal = 0;
for (const t of techs) { const c = curCommute[t] || 0; curTotal += c; console.log(`  ${t.padEnd(20)} ${c.toFixed(0).padStart(5)} mi`); }
console.log(`  ${'TOTAL'.padEnd(20)} ${curTotal.toFixed(0).padStart(5)} mi   →  proposed ${totalCommute.toFixed(0)} mi  (${(100 * (curTotal - totalCommute) / Math.max(1, curTotal)).toFixed(0)}% less)`);

const out = path.join(__dirname, 'territory-design-proposal.json');
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), source: capFile, mean, band: [lo, hi], assign: Object.fromEntries(techs.map(t => [t, assign[t].map(r => ({ region: r.name, hours: r.hours, visits: r.visits, days: r.days, homeMiles: haversine(HOMES[t], r) }))])) }, null, 2));
console.log(`\nSaved: ${out}`);
