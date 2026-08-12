#!/usr/bin/env node
// GEO CACHE BUILD — resolve every address that sits on a geoSplit zip to its side of the line, and
// cache the answer so the assignment and planning passes can use it without coordinates.
//
// Generalises what thurston-split.mjs did for Olympia to EVERY line in territories.json.
// geoSplitLines currently holds:
//   thurston-i5-101   day-only split (both sides are Luke)
//   bellevue-ne8th    OWNER split   (north = Alias/T1, south = Cory/T2)
//
// Coordinates come from OptimoRoute, which geocodes every order we push. Jobber does not return
// lat/lng, which is why the cache exists at all.
//
// READ-ONLY against both APIs. Writes geo-side-cache.json.
//
// Usage: node geo-cache-build.mjs --from=2026-08-10 --to=2026-08-14 [--write]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normAddr, loadCache, saveCache, classifyPoint } from './geo-side.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const WRITE = process.argv.includes('--write');
if (!FROM || !TO) { console.error('Usage: geo-cache-build.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD [--write]'); process.exit(1); }

const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function addDays(s, n) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); }

const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'territories.json'), 'utf8'));
const LINES = T.geoSplitLines || {};

// Which zips does each line govern? A zip governed by a line is one that appears in a region
// carrying that line's geoSplit — narrowed by appliesToZips when the region declares it.
const zipLine = {};
for (const [name, r] of Object.entries(T.regions)) {
  const gs = r.geoSplit;
  if (!gs) continue;
  const scope = gs.appliesToZips || r.zips;
  for (const z of scope) zipLine[z] = gs.line;
}
console.log(`geo lines: ${Object.keys(LINES).filter(k => !k.startsWith('_')).join(', ')}`);
console.log(`zips under a geoSplit: ${Object.keys(zipLine).sort().join(' ')}\n`);

const stops = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json();
  for (const rt of r.routes || []) for (const s of rt.stops || []) {
    if (!/^\d+-\w+$/.test(String(s.orderNo || ''))) continue;
    const zip = (String(s.address || '').match(/\b(98\d{3})\b/) || [])[1];
    if (!zip || !zipLine[zip]) continue;
    const lat = s.location?.latitude ?? s.latitude ?? null;
    const lon = s.location?.longitude ?? s.longitude ?? null;
    stops.push({ job: String(s.orderNo).split('-')[0], zip, line: zipLine[zip], address: s.address, driver: rt.driverName, lat, lon });
  }
  await sleep(300);
}

const cache = loadCache();
cache.entries = cache.entries || {};
let added = 0, changed = 0, nocoord = 0;
const byLine = {};
for (const s of stops) {
  const line = LINES[s.line];
  if (!line) continue;
  const c = classifyPoint(line, s.lat, s.lon);
  if (!c) { nocoord++; continue; }
  const street = String(s.address || '').split(',')[0];
  const key = normAddr(street, s.zip);
  const prev = cache.entries[key];
  if (!prev) added++; else if (prev.side !== c.side) changed++;
  cache.entries[key] = { line: s.line, side: c.side, marginMi: c.marginMi, zip: s.zip, street };
  (byLine[s.line] = byLine[s.line] || []).push({ ...s, ...c, street });
}

for (const [ln, list] of Object.entries(byLine)) {
  const n = list.filter(x => x.side === 'NORTH').length, so = list.length - n;
  console.log(`=== ${ln} — ${list.length} stops: ${n} NORTH, ${so} SOUTH ===`);
  if (LINES[ln]?.crossesOwners) {
    console.log('   (this line changes the OWNER, not just the day)');
    for (const x of list.sort((a, b) => b.marginMi - a.marginMi)) {
      console.log(`   ${x.side.padEnd(5)} ${String(x.marginMi).padStart(6)} mi   #${x.job.padEnd(6)} now on ${x.driver.padEnd(15)} ${x.address}`);
    }
  }
  console.log('');
}
if (nocoord) console.log(`stops with no coordinates (skipped): ${nocoord}`);

if (WRITE) {
  cache.updatedAt = new Date().toISOString();
  saveCache(cache);
  console.log(`geo-side-cache.json: ${added} new, ${changed} changed, ${Object.keys(cache.entries).length} total`);
} else {
  console.log(`DRY — would add ${added}, change ${changed}. Pass --write to save.`);
}
