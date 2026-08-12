#!/usr/bin/env node
// Geocode the Got Moles properties that OptimoRoute never covered (archived jobs that
// predate the integration), so stale onX waypoints can be attributed to the ex-customer
// they actually belong to.
//
// Uses the US Census Bureau batch geocoder: free, keyless, built for bulk, US-only.
// Sends street/city/state/zip ONLY — no customer names.
// Usage: node geocode-archived.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const D = path.join(__dirname, 'data');
const URL_ = 'https://geocoding.geo.census.gov/geocoder/locations/addressbatch';
const BATCH = 3000;          // Census caps at 10k; smaller batches fail less often
const OUT = path.join(D, 'extra-coords.json');

const props = JSON.parse(fs.readFileSync(path.join(D, 'all-properties.json'), 'utf8')).properties;
const coords = JSON.parse(fs.readFileSync(path.join(D, 'optimo-coords.json'), 'utf8')).coords;

const need = props.filter(p => {
  if (!p.street) return false;
  return !p.jobs.some(j => coords[j.jobNumber]);
});
console.log(`properties needing coordinates: ${need.length}`);

const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const todo = need.filter(p => !existing[p.propertyId]);
console.log(`already geocoded: ${need.length - todo.length} | to do: ${todo.length}`);

const csvCell = (s) => String(s || '').replace(/[",\r\n]/g, ' ').trim();
let done = 0, matched = 0;

for (let i = 0; i < todo.length; i += BATCH) {
  const chunk = todo.slice(i, i + BATCH);
  const lines = chunk.map((p, n) => [
    i + n,                       // unique id -> index into todo
    csvCell(p.street),
    csvCell(p.city),
    csvCell(p.province === 'Washington' ? 'WA' : p.province),
    csvCell(p.zip),
  ].join(','));

  const fd = new FormData();
  fd.append('benchmark', 'Public_AR_Current');
  fd.append('addressFile', new Blob([lines.join('\n')], { type: 'text/csv' }), 'addresses.csv');

  let text = null;
  for (let attempt = 0; attempt < 4 && text === null; attempt++) {
    try {
      const r = await fetch(URL_, { method: 'POST', body: fd, signal: AbortSignal.timeout(300000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      text = await r.text();
    } catch (e) {
      console.error(`  batch ${i / BATCH + 1} attempt ${attempt + 1} failed: ${e.message}`);
      await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
    }
  }
  if (text === null) { console.error(`  batch ${i / BATCH + 1} GIVING UP`); continue; }

  // Census returns quoted CSV: id,"input","Match|No_Match|Tie","Exact|Non_Exact","matched addr","lon,lat",tigerId,side
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = line.match(/(".*?"|[^,]+)/g) || [];
    const strip = (s) => String(s || '').replace(/^"|"$/g, '');
    const id = Number(strip(cells[0]));
    const status = strip(cells[2]);
    done++;
    if (status !== 'Match') continue;
    const lonlat = strip(cells[5]);
    const [lng, lat] = lonlat.split(',').map(Number);
    if (!isFinite(lat) || !isFinite(lng)) continue;
    const p = todo[id];
    if (!p) continue;
    existing[p.propertyId] = { lat, lng, address: strip(cells[4]), source: 'census' };
    matched++;
  }
  fs.writeFileSync(OUT, JSON.stringify(existing, null, 1));
  console.log(`  batch ${i / BATCH + 1}: ${done} processed, ${matched} matched (cumulative geocoded: ${Object.keys(existing).length})`);
}

console.log(`\ngeocoded total: ${Object.keys(existing).length} / ${need.length} properties`);
console.log(`wrote ${OUT}`);
