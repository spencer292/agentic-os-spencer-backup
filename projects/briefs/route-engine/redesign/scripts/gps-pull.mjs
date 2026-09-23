#!/usr/bin/env node
// GPS PULL — FleetSharp (Linxup) REST API v2, the account's own host. READ-ONLY.
//
// Contract confirmed 2026-09-19 from the account's Swagger spec (stages/fleetsharp-v2-api.yaml,
// fetched from https://app02.fleetsharp.com/ibis/apidocs/api.yaml, api version 2.13):
//   host      https://app02.fleetsharp.com        basePath /ibis/rest/api/v2
//   auth      Authorization: Bearer <token>       (the token from Setup > API/Developers, Version 2)
//   GET  /tracker                                 -> TrackerInfo[]  (imei, deviceUUID, firstName/lastName, make/model/vin, driverId)
//   POST /trips  {fromDate, toDate}  (epoch ms)   -> Trip[]   range <= 48 h
//   POST /stops  {fromDate, toDate}  (epoch ms)   -> Stop[]   range <= 48 h  (stopType Engine Off | Idling, beginDate, endDate, duration min, lat/lng, address)
//
// Usage (from the repo root):  node projects/briefs/route-engine/redesign/scripts/gps-pull.mjs --from=2026-08-17 --to=2026-09-17
// Writes raw JSON to projects/briefs/route-engine/redesign/private/fleetsharp/ (gitignored):
//   _trackers.json, trips_<from>_<to>.json, stops_<from>_<to>.json, plus a masked pull.log
// Never prints the token.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const OUT_DIR = path.join(ROOT, 'projects/briefs/route-engine/redesign/private/fleetsharp');
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
if (!FROM || !TO) { console.error('Usage: gps-pull.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD'); process.exit(1); }

const env = {};
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const TOKEN = (env.FLEETSHARP_API_KEY || '').replace(/^["']|["']$/g, '');
if (!TOKEN) { console.error('FLEETSHARP_API_KEY missing in .env'); process.exit(1); }
const HOST = (env.FLEETSHARP_API_URL || 'https://app02.fleetsharp.com').replace(/\/$/, '');
const BASE = HOST + '/ibis/rest/api/v2';
const mask = s => String(s).replace(/[A-Za-z0-9\-_\.]{40,}/g, '<token>');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function call(method, p, body, attempt = 0) {
  const r = await fetch(BASE + p, { method, headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 429 && attempt < 6) { const w = 5000 * (attempt + 1); console.log(`  429, waiting ${w} ms`); await sleep(w); return call(method, p, body, attempt + 1); }
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} -> HTTP ${r.status} ${mask(text.slice(0, 200))}`);
  return JSON.parse(text);
}
// The spec says /trips and /stops return a bare array; the live API wraps it. Unwrap the common envelopes,
// and if the shape is still unknown, save it and show the keys instead of crashing.
function asArray(data, label) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    // live shape: { responseType: 'Success', data: { trips: [...] } } / { data: { stops: [...] } }
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) { const inner = data.data; for (const k of ['trips', 'stops', 'content', 'records', 'items']) if (Array.isArray(inner[k])) return inner[k]; }
    for (const k of ['data', 'trips', 'stops', 'content', 'records', 'items', 'results', 'result']) if (Array.isArray(data[k])) return data[k];
    for (const k of Object.keys(data)) if (Array.isArray(data[k])) { console.log(`  note: ${label} array found under key "${k}"`); return data[k]; }
  }
  fs.writeFileSync(path.join(OUT_DIR, `_unexpected_${label}.json`), JSON.stringify(data, null, 2));
  throw new Error(`${label}: unexpected response shape, keys = ${data && typeof data === 'object' ? Object.keys(data).join(',') : typeof data}. Saved to private/fleetsharp/_unexpected_${label}.json`);
}

// Pacific calendar days -> epoch ms. PDT (-07:00) applies for the whole Aug-Oct window; DST ends 2026-11-01.
const dayStart = d => new Date(d + 'T00:00:00.000-07:00').getTime();
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

fs.mkdirSync(OUT_DIR, { recursive: true });
const log = [];
const say = s => { console.log(s); log.push(s); };

say(`host ${HOST}  window ${FROM}..${TO}`);
const trackers = await call('GET', '/tracker');
fs.writeFileSync(path.join(OUT_DIR, '_trackers.json'), JSON.stringify(trackers, null, 2));
say(`trackers: ${trackers.length}`);
for (const t of trackers) say(`  ${[t.firstName, t.lastName].filter(Boolean).join(' ')}  | ${t.year || ''} ${t.make || ''} ${t.model || ''} | imei ${t.imei} | driverId ${t.driverId ?? '-'} | group ${t.groupId ?? '-'}`);

const trips = [], stops = [];
for (let d = FROM; d <= TO; d = addDays(d, 2)) {
  const to = addDays(d, 2) > TO ? addDays(TO, 1) : addDays(d, 2);
  const body = { fromDate: dayStart(d), toDate: dayStart(to) - 1 };
  const tr = asArray(await call('POST', '/trips', body), 'trips'); trips.push(...tr); await sleep(300);
  const st = asArray(await call('POST', '/stops', body), 'stops'); stops.push(...st); await sleep(300);
  say(`${d}..${addDays(to, -1)}  trips ${tr.length}  stops ${st.length}`);
}
fs.writeFileSync(path.join(OUT_DIR, `trips_${FROM}_${TO}.json`), JSON.stringify(trips));
fs.writeFileSync(path.join(OUT_DIR, `stops_${FROM}_${TO}.json`), JSON.stringify(stops));

// per-vehicle summary
const by = {};
const who = r => (r.appDriverName || r.driverName || r.personName || r.imei) + (r.personName && r.appDriverName ? ` (${r.personName})` : '');
for (const t of trips) { const k = who(t); by[k] = by[k] || { trips: 0, miles: 0, stops: 0, engineOff: 0, idling: 0 }; by[k].trips++; by[k].miles += t.distanceMilesDetailed || t.distanceMiles || 0; }
for (const s of stops) { const k = who(s); by[k] = by[k] || { trips: 0, miles: 0, stops: 0, engineOff: 0, idling: 0 }; by[k].stops++; if (/off/i.test(s.stopType || '')) by[k].engineOff++; else by[k].idling++; }
say('\nvehicle                          trips   miles   stops  engine-off  idling');
for (const [k, v] of Object.entries(by)) say(`${k.padEnd(32)} ${String(v.trips).padStart(5)} ${v.miles.toFixed(0).padStart(7)} ${String(v.stops).padStart(7)} ${String(v.engineOff).padStart(11)} ${String(v.idling).padStart(7)}`);
say(`\ntotal trips ${trips.length}, stops ${stops.length}  -> ${path.relative(ROOT, OUT_DIR)}`);
fs.writeFileSync(path.join(OUT_DIR, `pull_${FROM}_${TO}.log`), log.join('\n'));
