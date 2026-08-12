#!/usr/bin/env node
// THURSTON SPLIT — classify every Olympia-area stop as north or south of the I-5 / US-101 line.
//
// Spencer 2026-08-07: "we've got two days for Olympia right now... Does it make sense to split those
// two days so that day one covers everything north of I-5 and north of Highway 101, and day two
// covers south of I-5 and south of Highway 101?"
//
// Zip codes cannot answer this — 98501, 98503 and 98512 all straddle I-5. So this reads the real
// stop coordinates off the OptimoRoute plan and classifies each one against a piecewise line:
//   * east of the I-5/US-101 junction in Tumwater : the I-5 corridor, running WSW -> ENE to Nisqually
//   * west of the junction                        : the US-101 corridor, running SE -> NW to Shelton
// A stop north/east of that line is "north"; anything below it is "south".
//
// READ-ONLY.
//
// Usage: node thurston-split.mjs --from=2026-08-10 --to=2026-08-14

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
if (!FROM || !TO) { console.error('Usage: thurston-split.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD'); process.exit(1); }

const THURSTON = new Set(['98501', '98502', '98503', '98506', '98512', '98513', '98516', '98597']);

// --- the line ---
// I-5 through the Olympia/Lacey urban area: Tumwater junction -> Nisqually.
const I5_W = { lat: 46.9950, lon: -122.9050 };   // I-5 / US-101 junction, Tumwater
const I5_E = { lat: 47.0550, lon: -122.7000 };   // I-5 at Nisqually
// US-101 west/north from the same junction toward Shelton.
const H101_E = { lat: 47.0200, lon: -122.9050 };
const H101_W = { lat: 47.0700, lon: -123.0100 };

function lineLatAt(lon, a, b) {
  const t = (lon - a.lon) / (b.lon - a.lon);
  return a.lat + t * (b.lat - a.lat);
}
function classify(lat, lon) {
  if (lat == null || lon == null) return { side: 'UNKNOWN', margin: null };
  const boundaryLat = lon >= I5_W.lon ? lineLatAt(lon, I5_W, I5_E) : lineLatAt(lon, H101_E, H101_W);
  const margin = (lat - boundaryLat) * 69; // degrees -> approx miles
  return { side: margin >= 0 ? 'NORTH' : 'SOUTH', margin: +margin.toFixed(1), corridor: lon >= I5_W.lon ? 'I-5' : 'US-101' };
}

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
function addDays(s, n) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); }

const stops = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    for (const s of rt.stops || []) {
      if (!/^\d+-\w+$/.test(String(s.orderNo || ''))) continue;
      const zip = (String(s.address || '').match(/\b(98\d{3})\b/) || [])[1] || '?';
      if (!THURSTON.has(zip)) continue;
      const lat = s.location?.latitude ?? s.latitude ?? null;
      const lon = s.location?.longitude ?? s.longitude ?? null;
      stops.push({ job: String(s.orderNo).split('-')[0], date: d, driver: rt.driverName, zip, address: s.address, lat, lon, ...classify(lat, lon) });
    }
  }
  await sleep(300);
}

console.log(`THURSTON SPLIT  ${FROM}..${TO}   ${stops.length} Olympia-area stops\n`);

const north = stops.filter(s => s.side === 'NORTH');
const south = stops.filter(s => s.side === 'SOUTH');
const unk = stops.filter(s => s.side === 'UNKNOWN');

for (const [label, list] of [['NORTH of I-5 / north of US-101', north], ['SOUTH of I-5 / south of US-101', south]]) {
  console.log(`=== ${label} — ${list.length} stops ===`);
  const byZip = {};
  for (const s of list) (byZip[s.zip] = byZip[s.zip] || []).push(s);
  for (const [zip, l] of Object.entries(byZip).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${zip}  ${String(l.length).padStart(3)}  ${l[0].address.split(',')[1]?.trim() || ''}`);
  }
  console.log('');
}
if (unk.length) console.log(`UNKNOWN (no coordinates): ${unk.length}\n`);

// zips that straddle — these are the ones a zip-based rule would get wrong
console.log('=== ZIPS THAT STRADDLE THE LINE (a zip-only rule cannot split these) ===');
const byZip = {};
for (const s of stops) { const b = byZip[s.zip] = byZip[s.zip] || { NORTH: 0, SOUTH: 0, UNKNOWN: 0 }; b[s.side]++; }
for (const [zip, b] of Object.entries(byZip).sort()) {
  const mark = b.NORTH && b.SOUTH ? '  <-- STRADDLES' : '';
  console.log(`  ${zip}   north ${String(b.NORTH).padStart(3)}   south ${String(b.SOUTH).padStart(3)}${mark}`);
}

// closest calls — worth eyeballing
console.log('\n=== CLOSEST TO THE LINE (within 1.5 mi — check these by eye) ===');
for (const s of stops.filter(x => x.margin != null && Math.abs(x.margin) < 1.5).sort((a, b) => Math.abs(a.margin) - Math.abs(b.margin))) {
  console.log(`  #${s.job.padEnd(5)} ${s.side.padEnd(5)} ${String(s.margin).padStart(5)} mi  ${s.corridor.padEnd(6)} ${s.address}`);
}

const out = path.join(__dirname, `thurston-split-${FROM}_${TO}.json`);
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), from: FROM, to: TO, north: north.length, south: south.length, stops }, null, 2));
console.log(`\nSaved: ${out}`);

// --write-cache: persist each address's side so rebalance-week can resolve it without coordinates.
if (process.argv.includes('--write-cache')) {
  const { normAddr, loadCache, saveCache } = await import('./geo-side.mjs');
  const cache = loadCache();
  cache.entries = cache.entries || {};
  let added = 0, updated = 0;
  for (const s of stops) {
    if (s.side !== 'NORTH' && s.side !== 'SOUTH') continue;
    const street = String(s.address || '').split(',')[0];
    const key = normAddr(street, s.zip);
    const prev = cache.entries[key];
    if (!prev) added++; else if (prev.side !== s.side) updated++;
    cache.entries[key] = { line: 'thurston-i5-101', side: s.side, marginMi: s.margin, zip: s.zip, street };
  }
  cache.updatedAt = new Date().toISOString();
  saveCache(cache);
  console.log(`geo-side-cache.json: ${added} new, ${updated} changed, ${Object.keys(cache.entries).length} total`);
}
