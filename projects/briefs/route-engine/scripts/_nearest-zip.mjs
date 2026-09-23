#!/usr/bin/env node
// Reverse-locate each driver's OptimoRoute start location to the nearest zip centroid we hold,
// and name the region block it falls in. READ-ONLY.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../..');
const OLD = path.join(REPO, 'projects/briefs/technician-route-automation');
const cent = JSON.parse(fs.readFileSync(path.join(OLD, 'zip-centroids.json'), 'utf8'));
const T = JSON.parse(fs.readFileSync(path.join(OLD, 'territories.json'), 'utf8'));
const hw = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/five-way-highway.json'), 'utf8'));

const zipRegion = new Map();
for (const [n, r] of Object.entries(T.regions)) for (const z of r.zips) if (!zipRegion.has(z)) zipRegion.set(z, n);
const blockOwner = new Map();
for (const t of hw.territories) for (const b of t.blocks) blockOwner.set(b.name, t.tech);

const DRIVERS = [
  { name: 'Alias Franks', lat: 47.924897, lon: -122.1110239, addr: '1024 Ludwig Rd, Snohomish, WA 98290' },
  { name: 'Cory Ventura', lat: null, lon: null, addr: '(EMPTY — no start location set)' },
  { name: 'Luke LaVergne', lat: 47.2163038, lon: -122.2795999, addr: '11210 45th St E, Edgewood, WA 98372' },
  { name: 'Robert Norton', lat: 47.1172496, lon: -122.0697043, addr: '(no address string, coordinates only)' },
  { name: 'Tavis Alexander', lat: 47.2895112, lon: -122.085035, addr: '19230 SE Green Valley Rd, Auburn, WA 98092' },
];

const R = 6371;
const hav = (a, b, c, d) => {
  const t = Math.PI / 180, dLat = (c - a) * t, dLon = (d - b) * t;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const get = (v) => Array.isArray(v) ? { lat: v[0], lon: v[1] } : { lat: v.lat ?? v.latitude, lon: v.lon ?? v.lng ?? v.longitude };

for (const d of DRIVERS) {
  console.log(`\n${d.name}`);
  console.log(`  OptimoRoute start: ${d.addr}`);
  if (d.lat == null) { console.log('  -> cannot locate: no coordinates on the driver record'); continue; }
  const scored = [];
  for (const [zip, v] of Object.entries(cent)) {
    const c = get(v);
    if (typeof c.lat !== 'number' || typeof c.lon !== 'number') continue;
    scored.push({ zip, km: hav(d.lat, d.lon, c.lat, c.lon) });
  }
  scored.sort((a, b) => a.km - b.km);
  for (const s of scored.slice(0, 3)) {
    const reg = zipRegion.get(s.zip);
    console.log(`  ${s.km.toFixed(1).padStart(5)} km  ${s.zip}  ${reg || '(zip not in any region)'}${reg ? `  ->  ${blockOwner.get(reg)}` : ''}`);
  }
}
