#!/usr/bin/env node
/**
 * travel.mjs
 *
 * Offline travel-time lookup for the route-engine backtest.
 *
 *   travel(from, to, driver)      -> { seconds, metres, source: 'observed'|'estimated' }
 *   routeTime(stops, driver)      -> { travelSeconds, serviceMinutes, totalMinutes, ... }
 *
 * `from` / `to` are { lat, lng } (also accepts latitude/longitude, or [lat, lng]).
 * Observed place pairs come straight from the OptimoRoute history; anything unseen
 * falls back to the per-driver haversine estimator fitted in build-travel-model.mjs.
 *
 * Self-test (run this file directly) replays every real route-day through routeTime
 * and reports per-day error against the day's own recorded legs + service.
 *
 * Offline only. No network calls.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MODEL_FILE = path.join(ROOT, 'data', 'travel-model.json');
const ROUTES_DIR = path.join(ROOT, 'data', 'optimo-routes');

const COORD_DP = 5;

let MODEL = null;

export function loadModel(file = MODEL_FILE) {
  if (!MODEL) MODEL = JSON.parse(fs.readFileSync(file, 'utf8'));
  return MODEL;
}

export function placeId(lat, lng) {
  return `${Number(lat).toFixed(COORD_DP)},${Number(lng).toFixed(COORD_DP)}`;
}

export function haversineMetres(aLat, aLng, bLat, bLng) {
  const R = 6371008.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function coord(p) {
  if (Array.isArray(p)) return { lat: Number(p[0]), lng: Number(p[1]) };
  const lat = p.lat ?? p.latitude;
  const lng = p.lng ?? p.lon ?? p.longitude;
  if (lat == null || lng == null) throw new Error(`travel: bad coordinate ${JSON.stringify(p)}`);
  return { lat: Number(lat), lng: Number(lng) };
}

function fitFor(driver) {
  const m = loadModel();
  return m.estimator.drivers[driver] || m.estimator.drivers.ALL;
}

/**
 * Travel between two points for a given driver.
 * @param {{lat:number,lng:number}} from
 * @param {{lat:number,lng:number}} to
 * @param {string} driver
 * @param {{forceEstimate?:boolean}} [opts]
 * @returns {{seconds:number, metres:number, source:'observed'|'estimated'}}
 */
export function travel(from, to, driver, opts = {}) {
  const m = loadModel();
  const a = coord(from);
  const b = coord(to);
  const idA = placeId(a.lat, a.lng);
  const idB = placeId(b.lat, b.lng);

  if (!opts.forceEstimate) {
    // 1. the exact directed leg A->B, if it was ever driven
    const dp = m.directedPairs?.[`${idA}>${idB}`];
    if (dp) {
      return { seconds: dp.medianSeconds, metres: dp.medianMetres, source: 'observed', via: 'directed' };
    }
    // 2. the same pair driven the other way (travel is near-symmetric: median 4.4% apart)
    const key = idA <= idB ? `${idA}|${idB}` : `${idB}|${idA}`;
    const p = m.pairs[key];
    if (p) {
      return { seconds: p.medianSeconds, metres: p.medianMetres, source: 'observed', via: 'reverse' };
    }
    // 3. two stops at the same rounded location (clusters like Barbee Mill) are free
    if (idA === idB) return { seconds: 0, metres: 0, source: 'observed', via: 'same-place' };
  }

  const fit = fitFor(driver);
  const hav = haversineMetres(a.lat, a.lng, b.lat, b.lng);
  const metres = Math.max(0, fit.metres.a + fit.metres.b * hav);
  const seconds = Math.max(0, fit.seconds.c + fit.seconds.d * metres);
  return { seconds, metres, source: 'estimated', via: 'haversine-fit' };
}

/**
 * Total time for an ordered stop list. Does NOT include the inbound leg to the first
 * stop: the source data has no depot, so a route's start location is unknown.
 * @param {Array<object>} stops each {lat,lng,serviceMinutes|serviceDurationMin}
 * @param {string} driver
 */
export function routeTime(stops, driver, opts = {}) {
  const legs = [];
  let travelSeconds = 0;
  let travelMetres = 0;
  let serviceMinutes = 0;
  let observed = 0;
  let estimated = 0;

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    serviceMinutes += Number(s.serviceMinutes ?? s.serviceDurationMin ?? 0);
    if (i === 0) continue;
    const t = travel(stops[i - 1], s, driver, opts);
    travelSeconds += t.seconds;
    travelMetres += t.metres;
    if (t.source === 'observed') observed += 1;
    else estimated += 1;
    legs.push({ index: i, ...t });
  }

  return {
    stops: stops.length,
    legs,
    observedLegs: observed,
    estimatedLegs: estimated,
    travelSeconds,
    travelMinutes: travelSeconds / 60,
    travelMetres,
    serviceMinutes,
    totalMinutes: travelSeconds / 60 + serviceMinutes,
  };
}

// ---------------------------------------------------------------- self-test

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;

function selfTest() {
  loadModel();
  const files = fs
    .readdirSync(ROUTES_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();

  const modes = [
    { name: 'REPLAY (pairs + estimator)', opts: {} },
    { name: 'ESTIMATOR ONLY (pairs disabled)', opts: { forceEstimate: true } },
  ];

  for (const mode of modes) {
    console.log(`\n================ ${mode.name} ================`);
    console.log(
      'date        driver             stops  actualMin  modelMin   errMin   err%   obs/est'
    );
    const dayErrPct = [];
    const legErrPct = [];
    let exactRoutes = 0;
    let totalRoutes = 0;
    let exactLegs = 0;
    let totalLegs = 0;

    for (const f of files) {
      const day = JSON.parse(fs.readFileSync(path.join(ROUTES_DIR, f), 'utf8'));
      if (!day.routes || !day.routes.length) continue;
      for (const route of day.routes) {
        const driver = route.driverSerial || route.driverName || 'UNKNOWN';
        const stops = (route.stops || []).filter((s) => s.latitude != null && s.longitude != null);
        if (stops.length < 2) continue;
        totalRoutes += 1;

        // actual: legs from stop 2 onward (stop 1's inbound leg has no known origin) + service
        let actualTravelSec = 0;
        let actualService = 0;
        for (let i = 0; i < stops.length; i++) {
          actualService += stops[i].serviceDurationMin ?? 0;
          if (i > 0) actualTravelSec += stops[i].travelTimeSec ?? 0;
        }
        const actualMin = actualTravelSec / 60 + actualService;

        const rt = routeTime(
          stops.map((s) => ({
            lat: s.latitude,
            lng: s.longitude,
            serviceMinutes: s.serviceDurationMin ?? 0,
          })),
          driver,
          mode.opts
        );

        const errMin = rt.totalMinutes - actualMin;
        const errPct = actualMin > 0 ? Math.abs(errMin) / actualMin : 0;
        dayErrPct.push(errPct);
        if (Math.abs(errMin) < 0.0001) exactRoutes += 1;

        // per-leg error
        for (let i = 1; i < stops.length; i++) {
          const act = stops[i].travelTimeSec ?? 0;
          const pred = rt.legs[i - 1].seconds;
          totalLegs += 1;
          if (pred === act) exactLegs += 1;
          if (act >= 60) legErrPct.push(Math.abs(pred - act) / act);
        }

        console.log(
          [
            day.date,
            driver.padEnd(18),
            String(stops.length).padStart(5),
            String(r1(actualMin)).padStart(10),
            String(r1(rt.totalMinutes)).padStart(9),
            String(r1(errMin)).padStart(8),
            String(r2(errPct * 100)).padStart(6),
            `  ${rt.observedLegs}/${rt.estimatedLegs}`,
          ].join(' ')
        );
      }
    }

    console.log(
      `\n  routes tested: ${totalRoutes}  |  reproduced exactly: ${exactRoutes} (${r1(
        (exactRoutes / totalRoutes) * 100
      )}%)`
    );
    console.log(
      `  legs tested: ${totalLegs}  |  reproduced exactly: ${exactLegs} (${r1(
        (exactLegs / totalLegs) * 100
      )}%)`
    );
    console.log(`  median route-total abs error: ${r2(median(dayErrPct) * 100)}%`);
    console.log(`  median per-leg abs error (legs >= 60s): ${r2(median(legErrPct) * 100)}%`);
    console.log(
      `  p90 per-leg abs error: ${r2(
        [...legErrPct].sort((a, b) => a - b)[Math.floor(legErrPct.length * 0.9)] * 100
      )}%`
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  selfTest();
}
