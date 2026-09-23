#!/usr/bin/env node
// OPTIMO DRIVER HOMES — read each field tech's start location from OptimoRoute.
//
// Why (2026-08-12): territories.json has carried "Tavis Alexander home: unknown" since 08-07,
// blocking his commute calculation for the five-way cut. Spencer: his home address is already set
// in OptimoRoute as his start location. This reads it back so territories.json can be corrected
// from the system of record instead of guessed.
//
// Note from territories.json v8: get_drivers has returned AUTH_KEY_UNKNOWN on this account key,
// and get_routes only reveals drivers that already have stops. So this tries get_drivers first and
// falls back to walking recent planned dates via get_routes.
//
// READ-ONLY. Calls only OptimoRoute GET endpoints. Writes nothing.
//
// Usage: node optimo-driver-homes.mjs [--from=YYYY-MM-DD] [--days=14]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../..');

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(REPO, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
const K = loadEnv().OPTIMOROUTE_API_KEY;
if (!K) { console.error('OPTIMOROUTE_API_KEY missing from .env'); process.exit(1); }

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from', '2026-08-03');
const DAYS = Number(flag('days', 14));

const call = async (ep, qs = '') => {
  const r = await fetch(`https://api.optimoroute.com/v1/${ep}?key=${K}${qs}`);
  const j = await r.json().catch(() => ({ success: false, _status: r.status }));
  return j;
};

const homes = new Map();   // driver -> { lat, lon, address, source }

// --- 1. get_drivers, if the key allows it ----------------------------------
const drv = await call('get_drivers');
if (drv && drv.success && Array.isArray(drv.drivers)) {
  console.log(`get_drivers: ${drv.drivers.length} driver record(s)\n`);
  for (const d of drv.drivers) {
    const name = d.serial || d.name || d.driverSerial;
    homes.set(name, {
      address: d.startLocation?.address ?? d.startingLocation?.address ?? d.address ?? null,
      lat: d.startLocation?.latitude ?? d.startingLocation?.latitude ?? d.latitude ?? null,
      lon: d.startLocation?.longitude ?? d.startingLocation?.longitude ?? d.longitude ?? null,
      source: 'get_drivers',
      raw: d,
    });
  }
} else {
  console.log(`get_drivers unavailable on this key (${JSON.stringify(drv).slice(0, 160)})`);
  console.log('falling back to get_routes over recent planned dates\n');
}

// --- 2. fall back to get_routes -------------------------------------------
if (!homes.size) {
  const start = new Date(FROM + 'T12:00:00Z');
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
    const r = await call('get_routes', `&date=${d}`);
    if (!r || !r.success || !Array.isArray(r.routes)) continue;
    for (const rt of r.routes) {
      const name = rt.driverSerial || rt.driverName;
      if (!name || homes.has(name)) continue;
      // the route's declared start point, before the first stop
      const sl = rt.startLocation || rt.startingLocation || null;
      if (sl) homes.set(name, { address: sl.address ?? null, lat: sl.latitude ?? null, lon: sl.longitude ?? null, source: `get_routes ${d}`, raw: sl });
    }
  }
}

if (!homes.size) { console.log('No driver start locations readable from either endpoint.'); process.exit(0); }

console.log('DRIVER START LOCATIONS');
for (const [name, h] of [...homes.entries()].sort()) {
  console.log(`  ${name.padEnd(20)} ${h.address ?? '(no address string)'}   ${h.lat != null ? `${h.lat}, ${h.lon}` : ''}   [${h.source}]`);
}

// --- 3. reconcile against territories.json roster --------------------------
const T = JSON.parse(fs.readFileSync(path.join(REPO, 'projects/briefs/technician-route-automation/territories.json'), 'utf8'));
console.log('\nRECONCILE vs territories.json roster');
for (const [name, r] of Object.entries(T.roster)) {
  const h = homes.get(name);
  const known = r.home && r.home !== 'unknown';
  if (!h) { console.log(`  ${name.padEnd(20)} roster="${r.home ?? '-'}"  -> NOT FOUND in OptimoRoute`); continue; }
  console.log(`  ${name.padEnd(20)} roster="${r.home ?? '-'}"  optimo="${h.address ?? `${h.lat},${h.lon}`}"${known ? '' : '   <-- FILLS A GAP'}`);
}
