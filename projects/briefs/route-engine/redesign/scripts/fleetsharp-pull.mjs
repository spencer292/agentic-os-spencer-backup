#!/usr/bin/env node
// FLEETSHARP (Linxup) PULL — historical trip/stop/position data for the route-engine redesign.
//
// STATUS AS OF 2026-09-18: no FLEETSHARP_API_KEY exists yet. This script is a documented SKELETON.
// The `--probe` mode is the ONLY mode safe to run before the key exists is granted -- it does
// nothing until a key is present, and even then it only calls the one documented auth+list call
// (mint a JWT, list trackers) so we can see the real response shape before trusting the rest of
// this file's parsing logic, which was written from the OpenAPI spec, not from a live response.
//
// See ../stages/fleetsharp-api-notes.md for everything this script assumes, with sources cited.
// Everything marked UNVERIFIED there is a guess about field names this script has NOT confirmed
// against a real payload — re-check `TripsReport`/`StopsReport`/`Position` shape with --probe
// before relying on --pull output for anything real.
//
// Auth flow (Linxup Pull API v3 -- FleetSharp is a rebrand of Linxup, same platform):
//   1. POST {base}/api/v3/jwts   header: x-api-key: <FLEETSHARP_API_KEY>   -> JWT string (15 min TTL)
//   2. GET  {base}/api/v3/...    header: Authorization: Bearer <jwt>
// Base URL default: https://api.linxup.com/pullapi (override with FLEETSHARP_API_URL in .env)
//
// Usage:
//   node fleetsharp-pull.mjs --probe                          # only mints a JWT + lists trackers
//   node fleetsharp-pull.mjs --from=2026-08-17 --to=2026-09-17 [--trackers=id1,id2,...]
//
// The --from/--to pull writes RAW JSON per vehicle per day to:
//   projects/briefs/route-engine/redesign/private/fleetsharp/{trackerId}/{YYYY-MM-DD}.json
// (that folder is gitignored -- see projects/briefs/route-engine/redesign/private/.gitignore
// equivalent entry in the repo root .gitignore: "projects/briefs/route-engine/redesign/private/")
//
// Do not run --from/--to until FLEETSHARP_API_KEY is in .env. Do not run this at all without
// explicit go-ahead -- it is read-only against FleetSharp/Linxup, but it has never been exercised
// against a real account and its parsing of the response bodies is unverified.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..'); // .../route-engine/redesign/scripts -> repo root
const ENV_PATH = path.join(ROOT, '.env');
const OUT_DIR = path.join(ROOT, 'projects/briefs/route-engine/redesign/private/fleetsharp');

const flag = (n, d) => {
  const a = process.argv.find(x => x.startsWith('--' + n + '='));
  return a ? a.split('=')[1] : d;
};
const PROBE = process.argv.includes('--probe');
const FROM = flag('from', null);
const TO = flag('to', null);
const TRACKER_FILTER = flag('trackers', null); // comma-separated trackerIds, optional

const LEGACY_PROBE = process.argv.includes('--legacy-probe');
if (!PROBE && !LEGACY_PROBE && (!FROM || !TO)) {
  console.error('Usage:');
  console.error('  node fleetsharp-pull.mjs --probe');
  console.error('  node fleetsharp-pull.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD [--trackers=id1,id2]');
  process.exit(1);
}

// ---- env (same parse style as route-day-drive.mjs: flat KEY=VALUE, no quoting/escaping support) ----
if (!fs.existsSync(ENV_PATH)) {
  console.error(`.env not found at ${ENV_PATH}`);
  process.exit(1);
}
const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const API_KEY = env.FLEETSHARP_API_KEY;
const BASE_URL = (env.FLEETSHARP_API_URL || 'https://api.linxup.com/pullapi').replace(/\/$/, '');

if (!API_KEY) {
  console.error('FLEETSHARP_API_KEY is not set in .env yet.');
  console.error('This is expected as of 2026-09-18 -- the owner has not obtained a key yet.');
  console.error('Once they do: add FLEETSHARP_API_KEY=... (and optionally FLEETSHARP_API_URL=...)');
  console.error('to .env, then re-run with --probe first.');
  process.exit(1);
}
// Never print API_KEY or the JWT anywhere below.

// ---- auth: exchange the API key for a short-lived JWT (valid ~15 min per the spec) ----
let jwt = null;
let jwtMintedAt = 0;
const JWT_TTL_MS = 13 * 60 * 1000; // refresh a couple minutes early, real TTL is 15 min per spec

async function getJwt(force = false) {
  if (jwt && !force && Date.now() - jwtMintedAt < JWT_TTL_MS) return jwt;
  const r = await fetch(`${BASE_URL}/api/v3/jwts`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`JWT mint failed: HTTP ${r.status} ${body.slice(0, 300)}`);
  }
  // Spec says the response body IS the JWT (plain string). Some deployments wrap it in JSON
  // ({"token": "..."}) -- handle both without guessing wrong silently.
  const raw = (await r.text()).trim();
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      jwt = parsed.token || parsed.jwt || parsed.access_token;
      if (!jwt) throw new Error('JSON JWT response had no token/jwt/access_token field: ' + raw.slice(0, 200));
    } catch (e) {
      throw new Error('JWT response looked like JSON but failed to parse: ' + e.message);
    }
  } else {
    jwt = raw.replace(/^"|"$/g, ''); // strip stray quotes if the body was a quoted JSON string
  }
  jwtMintedAt = Date.now();
  return jwt;
}

// ---- generic GET with 429 backoff (token bucket: 25/min refill, 200 max, per the spec) ----
const sleep = ms => new Promise(res => setTimeout(res, ms));

async function apiGet(pathAndQuery, attempt = 0) {
  const token = await getJwt();
  const r = await fetch(`${BASE_URL}${pathAndQuery}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 401 && attempt === 0) {
    // JWT may have expired early or been rejected -- force a remint once, then give up.
    await getJwt(true);
    return apiGet(pathAndQuery, attempt + 1);
  }
  if (r.status === 429) {
    if (attempt >= 6) throw new Error(`Still rate-limited after ${attempt} retries on ${pathAndQuery}`);
    const wait = 5000 * (attempt + 1);
    console.error(`  429 rate-limited, waiting ${wait}ms...`);
    await sleep(wait);
    return apiGet(pathAndQuery, attempt + 1);
  }
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`GET ${pathAndQuery} -> HTTP ${r.status} ${body.slice(0, 300)}`);
  }
  return r.json();
}

// ---- paginate: 100 records/page per the spec, no documented total-count field --
// stop when a page comes back with fewer than PAGE_SIZE records (or empty/non-array).
const PAGE_SIZE = 100;
async function fetchAllPages(basePath, extraQuery) {
  const all = [];
  for (let page = 0; ; page++) {
    const qs = new URLSearchParams({ ...extraQuery, page: String(page) });
    const data = await apiGet(`${basePath}?${qs}`);
    const records = Array.isArray(data) ? data : (data.content || data.records || data.items || null);
    if (!Array.isArray(records)) {
      // UNVERIFIED response envelope -- surface the raw shape instead of guessing wrong.
      console.error(`  Unexpected response shape from ${basePath} page ${page}, dumping raw and stopping.`);
      all.push({ __unparsed_raw_response: data });
      break;
    }
    all.push(...records);
    if (records.length < PAGE_SIZE) break;
    await sleep(150); // stay well under the 25/min refill rate across many pages
  }
  return all;
}

const dateToEpochMs = (isoDate, endOfDay = false) => {
  // Interprets isoDate as a US Pacific calendar day, matching route-engine's TZ convention
  // elsewhere in this project (route-day-drive.mjs uses America/Los_Angeles throughout).
  // UNVERIFIED: whether the Linxup API expects UTC-anchored epoch ms or is timezone-agnostic
  // (epoch ms is inherently UTC-based, so this only affects which local day a boundary falls in).
  const suffix = endOfDay ? 'T23:59:59.999-07:00' : 'T00:00:00.000-07:00';
  return new Date(isoDate + suffix).getTime();
};

// ---- PROBE MODE: only mint a JWT and list trackers, print the raw shape ----
async function probe() {
  console.log(`Base URL: ${BASE_URL}`);
  console.log('Minting JWT...');
  await getJwt();
  console.log('JWT minted OK (not printed).');
  console.log('Calling GET /api/v3/trackers ...');
  const data = await apiGet('/api/v3/trackers?page=0');
  console.log('Raw response (first 2000 chars):');
  console.log(JSON.stringify(data, null, 2).slice(0, 2000));
  console.log('\nIf this worked: compare the field names above against fleetsharp-api-notes.md\'s');
  console.log('"UNVERIFIED" notes on the Tracker/Asset schema, then update this script\'s field');
  console.log('mapping before trusting a full --from/--to pull.');
}

// ---- FULL PULL MODE ----
async function pull() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let trackerIds = TRACKER_FILTER ? TRACKER_FILTER.split(',').map(s => s.trim()) : null;
  if (!trackerIds) {
    console.log('No --trackers given, listing all trackers on the account...');
    const trackers = await fetchAllPages('/api/v3/trackers', {});
    trackerIds = trackers.map(t => t.trackerId).filter(Boolean);
    console.log(`Found ${trackerIds.length} tracker(s): ${trackerIds.join(', ')}`);
    fs.writeFileSync(path.join(OUT_DIR, '_trackers.json'), JSON.stringify(trackers, null, 2));
  }
  if (trackerIds.length === 0) {
    console.error('No trackers to pull. Check the account has active trackers, or pass --trackers explicitly.');
    process.exit(1);
  }
  if (trackerIds.length > 5) {
    console.error(`Warning: ${trackerIds.length} trackers found, but this task is scoped to 5 trucks.`);
    console.error('Pass --trackers=id1,id2,id3,id4,id5 to restrict to the right ones.');
  }

  const startMs = dateToEpochMs(FROM, false);
  const endMs = dateToEpochMs(TO, true);
  const spanDays = Math.ceil((endMs - startMs) / 86400000);
  if (spanDays > 93) {
    console.error(`Range is ${spanDays} days; /trips, /stops, /positions cap endDate at 93 days`);
    console.error('after startDate (per fleetsharp-api-notes.md). Split into multiple runs.');
    process.exit(1);
  }

  for (const trackerId of trackerIds) {
    console.log(`\n=== Tracker ${trackerId} ===`);
    const vehicleDir = path.join(OUT_DIR, String(trackerId));
    fs.mkdirSync(vehicleDir, { recursive: true });

    const query = { startDate: String(startMs), endDate: String(endMs), trackerIds: String(trackerId) };

    console.log('  Fetching trips...');
    const trips = await fetchAllPages('/api/v3/trips', query);
    console.log('  Fetching stops...');
    const stops = await fetchAllPages('/api/v3/stops', query);
    console.log('  Fetching positions (this can be large -- one row per GPS ping)...');
    const positions = await fetchAllPages('/api/v3/positions', query);

    // Written as one raw file per data type for the whole range, not split per-day, since a
    // single call already covers up to 93 days and per-day splitting would just mean re-slicing
    // the same array client-side. If a future run needs per-day files, slice these by the
    // relevant timestamp field once its real name is confirmed via --probe.
    fs.writeFileSync(path.join(vehicleDir, `trips_${FROM}_${TO}.json`), JSON.stringify(trips, null, 2));
    fs.writeFileSync(path.join(vehicleDir, `stops_${FROM}_${TO}.json`), JSON.stringify(stops, null, 2));
    fs.writeFileSync(path.join(vehicleDir, `positions_${FROM}_${TO}.json`), JSON.stringify(positions, null, 2));
    console.log(`  Saved ${trips.length} trips, ${stops.length} stops, ${positions.length} positions -> ${path.relative(ROOT, vehicleDir)}`);
  }
  console.log('\nDone. Raw JSON is unparsed/unvalidated against a live account -- read one file');
  console.log('by hand before building anything downstream on top of it.');
}

// ---- LEGACY PROBE (2026-09-19): the credential the owner saved is an agilis-issued long-lived JWT that
// the LEGACY Linxup REST API v2 accepts as a plain Bearer token. Confirmed live by the fleetsharp-api
// worker: GET https://www.linxup.com/ibis/rest/api/v2/geofences -> 200 with this account's geofences.
// /trips and /stops answered 405 to a bare GET, so they need a date range. This mode makes at most
// SIX scoped read-only calls to learn the call shape and saves the raw responses (masked log).
// Run it yourself from the repo root:   node projects/briefs/route-engine/redesign/scripts/fleetsharp-pull.mjs --legacy-probe
const LEGACY_BASE = 'https://www.linxup.com/ibis/rest/api/v2';
const mask = s => String(s).replace(/[A-Za-z0-9\-_\.]{40,}/g, '<token>');
async function legacyGet(pathAndQuery) {
  const r = await fetch(`${LEGACY_BASE}${pathAndQuery}`, { headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' } });
  const text = await r.text().catch(() => '');
  return { status: r.status, text };
}
async function legacyProbe() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const day = flag('day', '2026-09-16');
  const dayStartMs = new Date(day + 'T00:00:00.000-07:00').getTime();
  const dayEndMs = new Date(day + 'T23:59:59.999-07:00').getTime();
  const tries = [
    ['geofences', '/geofences'],
    ['trips_isodate', `/trips?startDate=${day}&endDate=${day}`],
    ['trips_epochms', `/trips?startDate=${dayStartMs}&endDate=${dayEndMs}`],
    ['stops_isodate', `/stops?startDate=${day}&endDate=${day}`],
    ['stops_epochms', `/stops?startDate=${dayStartMs}&endDate=${dayEndMs}`],
    ['trips_isodatetime', `/trips?startDate=${encodeURIComponent(day + 'T00:00:00')}&endDate=${encodeURIComponent(day + 'T23:59:59')}`],
  ];
  const done = new Set();
  for (const [name, q] of tries) {
    const kind = name.split('_')[0];
    if (done.has(kind)) continue; // first working shape per resource is enough
    const { status, text } = await legacyGet(q);
    const file = path.join(OUT_DIR, `legacy-shape_${name}.json`);
    fs.writeFileSync(file, text);
    let summary = '';
    try { const j = JSON.parse(text); const arr = Array.isArray(j) ? j : (j.data || j.content || j.records || j.items || null); summary = Array.isArray(arr) ? `array of ${arr.length}; first keys: ${arr[0] ? Object.keys(arr[0]).join(',') : '-'}` : `object keys: ${Object.keys(j).join(',')}`; } catch { summary = 'non-JSON: ' + mask(text.slice(0, 160)); }
    console.log(`${name.padEnd(18)} GET ${q.split('?')[0]} -> ${status}  ${summary}`);
    if (status === 200) done.add(kind);
    await sleep(400);
  }
  console.log(`\nRaw responses saved under ${path.relative(ROOT, OUT_DIR)}/legacy-shape_*.json (gitignored).`);
  console.log('Next: the first 200 per resource above tells us the date format; the first-record keys tell us the vehicle/driver field names.');
}

try {
  if (process.argv.includes('--legacy-probe')) await legacyProbe();
  else if (PROBE) await probe();
  else await pull();
} catch (err) {
  console.error('FAILED:', err.message);
  process.exit(1);
}
