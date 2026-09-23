#!/usr/bin/env node
// VERIFY territories v9 — replays assign-by-territory.mjs's own owner-resolution logic against
// the real Jobber board for the week of 2026-08-17, before anything is written anywhere.
//
// Checks, in order of how badly each would hurt:
//   1. No region appears in two handovers (would make ownership order-dependent).
//   2. Every region resolves to exactly one owner before AND after the effective date.
//   3. The live week of 08-10 is UNAFFECTED — v9 must not retro-assign already-routed visits.
//   4. How many of next week's real visits actually change assignee, and to whom.
//
// READ-ONLY. Reads territories-v9.json and week-0817.json. Writes nothing.
//
// Usage: node verify-v9.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../..');
const V9 = path.join(__dirname, '../data/territories-v9.json');
const VISITS = path.join(REPO, 'projects/briefs/technician-route-automation/week-0817.json');

const T = JSON.parse(fs.readFileSync(V9, 'utf8'));
let fail = 0;
const bad = (msg) => { console.log(`  FAIL  ${msg}`); fail++; };
const ok = (msg) => console.log(`  ok    ${msg}`);

// --- 1. handover uniqueness ------------------------------------------------
console.log('\n1. Handover uniqueness');
const seen = new Map();
for (const h of T.handovers || []) for (const r of h.regions) {
  if (seen.has(r)) bad(`region "${r}" appears in handovers to both ${seen.get(r)} and ${h.to}`);
  seen.set(r, h.to);
}
if (!fail) ok(`${seen.size} region(s) handed over, each exactly once`);

// --- 2. owner resolution, mirroring assign-by-territory.mjs ----------------
function ownerFor(regionName, visitDate) {
  const r = T.regions[regionName];
  let owner = r.owner;
  for (const h of T.handovers || []) {
    if (h.regions.includes(regionName) && visitDate >= h.effective) owner = h.to;
  }
  return owner;
}
console.log('\n2. Owner resolution before / after 2026-08-17');
const ROSTER_FIELD = new Set(Object.entries(T.roster).filter(([, v]) => v.status === 'field').map(([k]) => k));
for (const name of Object.keys(T.regions)) {
  const before = ownerFor(name, '2026-08-14');
  const after = ownerFor(name, '2026-08-17');
  if (!after) bad(`"${name}" resolves to no owner after the cut`);
  if (!ROSTER_FIELD.has(after)) bad(`"${name}" resolves to ${after}, who is not a field tech in v9`);
  const expect = T.regions[name].ownerFrom_2026_08_17;
  if (after !== expect) bad(`"${name}" resolves to ${after} but v9 declares ${expect}`);
  if (before !== T.regions[name].owner) bad(`"${name}" pre-cut owner drifted: ${before} vs ${T.regions[name].owner}`);
}
if (!fail) ok(`all ${Object.keys(T.regions).length} regions resolve to exactly one field tech on both sides of the date`);

// --- 3 & 4. dry-run against the real board --------------------------------
const zipRegions = new Map();
for (const [name, r] of Object.entries(T.regions)) for (const z of r.zips) {
  if (!zipRegions.has(z)) zipRegions.set(z, []);
  zipRegions.get(z).push(name);
}
// geoSplit zips map to two regions; resolve by fallbackSide (coordinates live in geo-side-cache)
function regionFor(zip) {
  const cands = zipRegions.get(zip);
  if (!cands) return null;
  if (cands.length === 1) return { region: cands[0], geo: false };
  const lineName = T.regions[cands[0]].geoSplit?.line;
  const line = T.geoSplitLines?.[lineName];
  const side = line?.fallbackSide?.[zip];
  const picked = cands.find(n => T.regions[n].geoSplit?.side === side) || cands[0];
  return { region: picked, geo: true };
}

const visits = JSON.parse(fs.readFileSync(VISITS, 'utf8'));
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let changed = 0, same = 0, unmapped = 0, geoNeeded = 0, weekend = 0, unassigned = 0;
const flow = new Map(), perTech = new Map();

for (const v of visits) {
  const date = v.startAt.slice(0, 10);
  const zip = v.property?.address?.postalCode;
  const cur = (v.assignedUsers?.nodes || []).map(n => n.name.full).join('+') || '(unassigned)';
  if (cur === '(unassigned)') unassigned++;
  const dow = DOW[new Date(date + 'T12:00:00Z').getUTCDay()];
  if (dow === 'Sat' || dow === 'Sun') weekend++;
  const hit = regionFor(zip);
  if (!hit) { unmapped++; continue; }
  if (hit.geo) geoNeeded++;
  const want = ownerFor(hit.region, date);
  perTech.set(want, (perTech.get(want) || 0) + 1);
  if (want === cur) same++;
  else { changed++; const k = `${cur}  ->  ${want}`; flow.set(k, (flow.get(k) || 0) + 1); }
}

console.log('\n3. Live week of 08-10 protection');
const liveWeek = ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14'];
let retro = 0;
for (const name of Object.keys(T.regions)) for (const d of liveWeek) {
  if (ownerFor(name, d) !== T.regions[name].owner) retro++;
}
if (retro) bad(`${retro} region-days in the LIVE week would be reassigned by v9`); else ok('no region changes owner before 2026-08-17 — the live week is untouched');

console.log('\n4. Dry-run against the real board, week of 2026-08-17');
console.log(`  ${visits.length} visits on the board`);
console.log(`  ${same} already on the right tech, ${changed} would be reassigned`);
console.log(`  ${unmapped} zip not in any region, ${geoNeeded} need per-address geo resolution, ${unassigned} unassigned, ${weekend} on a WEEKEND (defect)`);
console.log('\n  reassignment flow:');
[...flow.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`    ${String(n).padStart(4)}  ${k}`));
console.log('\n  resulting visit count per tech (booked so far, ~150 more still to land):');
[...perTech.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`    ${String(n).padStart(4)}  ${k}`));

console.log(fail ? `\n${fail} CHECK(S) FAILED — do not cut over.` : '\nAll structural checks passed. v9 is safe to cut over on an explicit go.');
process.exit(fail ? 1 : 0);
