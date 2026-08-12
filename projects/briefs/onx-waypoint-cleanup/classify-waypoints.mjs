#!/usr/bin/env node
// Classify every onX waypoint against Got Moles properties by distance.
//
// Waypoints are auto-named ("Waypoint 01/27/25 13:35") and marked with a Trap icon, so
// there is nothing to name-match on — attribution is purely geographic. Each waypoint is
// assigned to its NEAREST property, and the verdict depends on whether that property still
// has a live job.
//
// Usage: node classify-waypoints.mjs [--keep-m 200] [--match-m 250]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const D = path.join(__dirname, 'data');

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? Number(argv[i + 1]) : d; };
const KEEP_M = flag('keep-m', 200);    // within this of a LIVE property -> keep
const MATCH_M = flag('match-m', 250);  // within this of an archived property -> confident delete

const markups = JSON.parse(fs.readFileSync(path.join(D, 'onx-markups-backup.json'), 'utf8'));
const propsFile = JSON.parse(fs.readFileSync(path.join(D, 'all-properties.json'), 'utf8'));
const coords = JSON.parse(fs.readFileSync(path.join(D, 'optimo-coords.json'), 'utf8')).coords;
const extra = fs.existsSync(path.join(D, 'extra-coords.json'))
  ? JSON.parse(fs.readFileSync(path.join(D, 'extra-coords.json'), 'utf8')) : {};

// --- property points -------------------------------------------------------
const points = [];
let noCoord = 0;
for (const p of propsFile.properties) {
  let c = null;
  for (const j of p.jobs) { if (coords[j.jobNumber]) { c = coords[j.jobNumber]; break; } }
  if (!c && extra[p.propertyId]) c = extra[p.propertyId];
  if (!c) { noCoord++; continue; }
  points.push({
    lat: c.lat, lng: c.lng,
    client: p.client, street: p.street, city: p.city, zip: p.zip,
    live: p.live,
    jobNumbers: p.jobs.map(j => j.jobNumber),
    statuses: [...new Set(p.jobs.map(j => j.status))],
  });
}

// --- geo -------------------------------------------------------------------
const R = 6371000;
const rad = (d) => d * Math.PI / 180;
function metres(aLat, aLng, bLat, bLng) {
  const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
// Coarse grid index so 938 x ~4600 stays fast and exact.
const CELL = 0.01; // ~1.1 km lat
const grid = new Map();
const cell = (lat, lng) => `${Math.floor(lat / CELL)}|${Math.floor(lng / CELL)}`;
for (const p of points) {
  const k = cell(p.lat, p.lng);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(p);
}
function nearest(lat, lng, filter) {
  let best = null, bestD = Infinity;
  const ci = Math.floor(lat / CELL), cj = Math.floor(lng / CELL);
  for (let r = 1; r <= 6; r++) {                 // expanding ring, ~1.1km per step
    for (let i = ci - r; i <= ci + r; i++) {
      for (let j = cj - r; j <= cj + r; j++) {
        for (const p of grid.get(`${i}|${j}`) || []) {
          if (filter && !filter(p)) continue;
          const d = metres(lat, lng, p.lat, p.lng);
          if (d < bestD) { bestD = d; best = p; }
        }
      }
    }
    if (best && bestD < (r - 1) * CELL * 111000) break;
  }
  return best ? { p: best, d: bestD } : null;
}

// --- classify --------------------------------------------------------------
const PERSONAL_ICONS = new Set(['Glassing Area', 'Parking', 'Gate', 'Access', 'Scat']);
const rows = [];
for (const w of markups.waypoints) {
  const [lng, lat] = w.geo_json?.geometry?.coordinates || [];
  if (typeof lat !== 'number' || typeof lng !== 'number') continue;
  const icon = w.geo_json?.properties?.icon || '(none)';
  const anyN = nearest(lat, lng, null);
  const liveN = nearest(lat, lng, (p) => p.live);

  let verdict, reason;
  if (PERSONAL_ICONS.has(icon)) {
    verdict = 'UNSURE'; reason = `non-trap marker (${icon}) — not a customer pin`;
  } else if (liveN && liveN.d <= KEEP_M) {
    verdict = 'KEEP'; reason = `${Math.round(liveN.d)} m from active job ${liveN.p.client}`;
  } else if (anyN && anyN.d <= MATCH_M && !anyN.p.live) {
    verdict = 'DELETE'; reason = `${Math.round(anyN.d)} m from ex-customer ${anyN.p.client} (${anyN.p.statuses.join('/')}); nearest active ${liveN ? Math.round(liveN.d) + ' m' : 'none'}`;
  } else {
    verdict = 'UNSURE'; reason = anyN
      ? `nearest property ${Math.round(anyN.d)} m (${anyN.p.live ? 'active' : 'archived'}) ${anyN.p.client} — beyond match radius`
      : 'no Got Moles property anywhere near';
  }

  rows.push({
    uuid: w.uuid, name: w.name, icon, lat, lng,
    created: (w.created_at || '').slice(0, 10),
    verdict, reason,
    nearestAny: anyN ? { client: anyN.p.client, street: anyN.p.street, city: anyN.p.city, live: anyN.p.live, m: Math.round(anyN.d) } : null,
    nearestLive: liveN ? { client: liveN.p.client, street: liveN.p.street, city: liveN.p.city, m: Math.round(liveN.d) } : null,
  });
}

const tally = rows.reduce((m, r) => (m[r.verdict] = (m[r.verdict] || 0) + 1, m), {});
fs.writeFileSync(path.join(D, 'waypoint-verdicts.json'), JSON.stringify({
  builtAt: new Date().toISOString(),
  thresholds: { keepMetres: KEEP_M, matchMetres: MATCH_M },
  propertyPoints: points.length,
  propertiesWithoutCoords: noCoord,
  tally,
  waypoints: rows,
}, null, 1));

console.log(`property points: ${points.length} (${points.filter(p => p.live).length} live) | no coords: ${noCoord}`);
console.log(`thresholds: keep<=${KEEP_M}m of live, delete<=${MATCH_M}m of archived`);
console.log(`verdicts: ${JSON.stringify(tally)}`);

// distance distribution, to sanity-check the thresholds
const buckets = [10, 25, 50, 100, 150, 200, 300, 500, 1000, 5000, Infinity];
const dist = {};
for (const r of rows) {
  const d = r.nearestLive ? r.nearestLive.m : Infinity;
  const b = buckets.find(b => d <= b);
  dist['<=' + b] = (dist['<=' + b] || 0) + 1;
}
console.log(`distance to nearest LIVE property: ${JSON.stringify(dist)}`);
