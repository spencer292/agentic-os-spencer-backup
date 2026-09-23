#!/usr/bin/env node
/**
 * build-travel-model.mjs
 *
 * Builds an offline travel-time model from observed OptimoRoute route-days so the
 * route-engine backtest can sequence and time routes without calling OptimoRoute.
 *
 * Input:  data/optimo-routes/YYYY-MM-DD.json  (one file per route-day)
 * Output: data/travel-model.json
 *
 * Every stop carries the leg FROM THE PREVIOUS STOP (travelTimeSec / travelDistanceM).
 * The first stop's leg comes from an unknown origin (there is no start location in the
 * data), so it is excluded from legs/pairs/estimator and used only to derive route start.
 *
 * Offline only. No network calls.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ROUTES_DIR = path.join(ROOT, 'data', 'optimo-routes');
const OUT_FILE = path.join(ROOT, 'data', 'travel-model.json');

const COORD_DP = 5;

// ---------------------------------------------------------------- helpers

export function placeId(lat, lng) {
  return `${Number(lat).toFixed(COORD_DP)},${Number(lng).toFixed(COORD_DP)}`;
}

export function haversineMetres(aLat, aLng, bLat, bLng) {
  const R = 6371008.8; // mean earth radius, metres
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const la1 = toRad(aLat);
  const la2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function round(n, dp = 3) {
  if (n == null || !Number.isFinite(n)) return null;
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/** Ordinary least squares y = a + b*x, with R squared. */
function ols(xs, ys) {
  const n = xs.length;
  if (n < 2) return { a: 0, b: 0, n, r2: null };
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const b = sxx === 0 ? 0 : sxy / sxx;
  const a = my - b * mx;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (ys[i] - (a + b * xs[i])) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  return { a, b, n, r2: ssTot === 0 ? null : 1 - ssRes / ssTot };
}

// ---------------------------------------------------------------- load

function loadDayFiles() {
  const files = fs
    .readdirSync(ROUTES_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  const days = [];
  const skipped = [];
  for (const f of files) {
    const day = JSON.parse(fs.readFileSync(path.join(ROUTES_DIR, f), 'utf8'));
    if (!Array.isArray(day.routes) || day.routes.length === 0) {
      skipped.push({ date: day.date ?? f.replace('.json', ''), reason: day.note ?? 'no routes' });
      continue;
    }
    days.push(day);
  }
  return { days, skipped };
}

// ---------------------------------------------------------------- build

function build() {
  const { days, skipped } = loadDayFiles();

  const places = new Map(); // id -> record
  const legs = [];
  const driverStarts = [];
  const quirks = {
    emptyDays: skipped,
    zeroSecondLegs: 0,
    zeroMetreLegs: 0,
    identicalCoordAdjacentStops: 0,
    legsOver60Min: [],
    legsOver30Min: 0,
    missingCoords: 0,
    missingService: 0,
    stopsOutOfSequence: 0,
    routesWithOneStop: 0,
  };

  const touchPlace = (stop) => {
    const id = placeId(stop.latitude, stop.longitude);
    let p = places.get(id);
    if (!p) {
      p = {
        id,
        lat: Number(Number(stop.latitude).toFixed(COORD_DP)),
        lng: Number(Number(stop.longitude).toFixed(COORD_DP)),
        address: stop.address ?? null,
        addresses: new Set(),
        locationNames: new Set(),
        orderNos: new Set(),
        jobNumbers: new Set(),
        drivers: new Set(),
        dates: new Set(),
        visits: 0,
        serviceMinutes: [],
      };
      places.set(id, p);
    }
    p.visits += 1;
    if (stop.address) p.addresses.add(stop.address);
    if (stop.locationName) p.locationNames.add(stop.locationName);
    if (stop.orderNo) {
      p.orderNos.add(stop.orderNo);
      p.jobNumbers.add(String(stop.orderNo).split('-')[0]);
    }
    if (stop.serviceDurationMin != null) p.serviceMinutes.push(stop.serviceDurationMin);
    return id;
  };

  let stopCount = 0;
  let routeCount = 0;

  for (const day of days) {
    const date = day.date;
    for (const route of day.routes) {
      routeCount += 1;
      const driver = route.driverSerial || route.driverName || 'UNKNOWN';
      const stops = route.stops || [];
      if (stops.length === 1) quirks.routesWithOneStop += 1;
      let prevId = null;
      let prevStop = null;

      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        stopCount += 1;
        if (s.latitude == null || s.longitude == null) {
          quirks.missingCoords += 1;
          continue;
        }
        if (s.serviceDurationMin == null) quirks.missingService += 1;
        if (s.stopNumber !== i + 1) quirks.stopsOutOfSequence += 1;

        const id = touchPlace(s);
        places.get(id).drivers.add(driver);
        places.get(id).dates.add(date);

        if (i > 0 && prevId != null) {
          const seconds = s.travelTimeSec ?? null;
          const metres = s.travelDistanceM ?? null;
          if (seconds != null && metres != null) {
            if (seconds === 0) quirks.zeroSecondLegs += 1;
            if (metres === 0) quirks.zeroMetreLegs += 1;
            if (prevId === id) quirks.identicalCoordAdjacentStops += 1;
            if (seconds > 3600) {
              quirks.legsOver60Min.push({
                date,
                driver,
                from: prevStop.address,
                to: s.address,
                minutes: round(seconds / 60, 1),
                km: round(metres / 1000, 1),
              });
            }
            if (seconds > 1800) quirks.legsOver30Min += 1;
            const p1 = places.get(prevId);
            const p2 = places.get(id);
            legs.push({
              fromPlace: prevId,
              toPlace: id,
              seconds,
              metres,
              haversine: Math.round(haversineMetres(p1.lat, p1.lng, p2.lat, p2.lng)),
              date,
              driver,
            });
          }
        }
        prevId = id;
        prevStop = s;
      }

      // ---- derived route start / end (no depot in the data)
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (first && last && first.latitude != null && last.latitude != null) {
        const inboundSec = first.travelTimeSec ?? null;
        const inboundM = first.travelDistanceM ?? null;
        const firstArrival = first.arrivalMinutes ?? null;
        driverStarts.push({
          driver,
          date,
          stopCount: stops.length,
          startPlace: placeId(first.latitude, first.longitude),
          startLat: Number(Number(first.latitude).toFixed(COORD_DP)),
          startLng: Number(Number(first.longitude).toFixed(COORD_DP)),
          startAddress: first.address ?? null,
          firstArrivalAt: first.scheduledAt ?? null,
          firstArrivalMinutes: firstArrival,
          inboundLegSeconds: inboundSec,
          inboundLegMetres: inboundM,
          // route start = first arrival minus its inbound leg
          derivedRouteStartMinutes:
            firstArrival != null && inboundSec != null
              ? round(firstArrival - inboundSec / 60, 2)
              : null,
          reportedRouteStartMinutes: route.derived?.routeStartMinutes ?? null,
          endPlace: placeId(last.latitude, last.longitude),
          endLat: Number(Number(last.latitude).toFixed(COORD_DP)),
          endLng: Number(Number(last.longitude).toFixed(COORD_DP)),
          endAddress: last.address ?? null,
          lastArrivalAt: last.scheduledAt ?? null,
          lastArrivalMinutes: last.arrivalMinutes ?? null,
          lastDepartureMinutes: last.departureMinutes ?? null,
          routeDistanceKm: route.routeDistanceKm ?? null,
          routeDurationMin: route.routeDurationMin ?? null,
        });
      }
    }
  }

  // ---------------------------------------------------------------- pairs
  const pairMap = new Map();
  for (const l of legs) {
    const key =
      l.fromPlace <= l.toPlace ? `${l.fromPlace}|${l.toPlace}` : `${l.toPlace}|${l.fromPlace}`;
    let p = pairMap.get(key);
    if (!p) {
      p = { key, n: 0, sec: [], met: [], haversine: l.haversine };
      pairMap.set(key, p);
    }
    p.n += 1;
    p.sec.push(l.seconds);
    p.met.push(l.metres);
  }
  const pairs = {};
  for (const [key, p] of pairMap) {
    const [a, b] = key.split('|');
    pairs[key] = {
      a,
      b,
      n: p.n,
      haversine: p.haversine,
      medianSeconds: median(p.sec),
      medianMetres: median(p.met),
      minSeconds: Math.min(...p.sec),
      maxSeconds: Math.max(...p.sec),
      minMetres: Math.min(...p.met),
      maxMetres: Math.max(...p.met),
    };
  }

  // ------------------------------------------------- directed pairs (A->B)
  // Travel is not symmetric: 227 pairs were seen in both directions and differ by a
  // median 4.4%. The unordered `pairs` block above is the requested aggregate; this
  // directed block is what lets an observed leg replay exactly.
  const dirMap = new Map();
  for (const l of legs) {
    const key = `${l.fromPlace}>${l.toPlace}`;
    let p = dirMap.get(key);
    if (!p) {
      p = { n: 0, sec: [], met: [] };
      dirMap.set(key, p);
    }
    p.n += 1;
    p.sec.push(l.seconds);
    p.met.push(l.metres);
  }
  const directedPairs = {};
  let directedSeenOnce = 0;
  for (const [key, p] of dirMap) {
    if (p.n === 1) directedSeenOnce += 1;
    directedPairs[key] = {
      n: p.n,
      medianSeconds: median(p.sec),
      medianMetres: median(p.met),
      minSeconds: Math.min(...p.sec),
      maxSeconds: Math.max(...p.sec),
    };
  }

  // how asymmetric is travel on this ground?
  const asym = [];
  for (const key of dirMap.keys()) {
    const [a, b] = key.split('>');
    const rev = dirMap.get(`${b}>${a}`);
    if (!rev) continue;
    const f = median(dirMap.get(key).sec);
    const r = median(rev.sec);
    const mean = (f + r) / 2;
    if (mean > 0) asym.push(Math.abs(f - r) / mean);
  }

  // ---------------------------------------------------------------- estimator
  const byDriver = new Map();
  for (const l of legs) {
    if (!byDriver.has(l.driver)) byDriver.set(l.driver, []);
    byDriver.get(l.driver).push(l);
  }
  byDriver.set('ALL', legs);

  const estimator = {
    note:
      'metres = a + b*haversine ; seconds = c + d*metres. Fitted per driver by OLS on that driver observed legs. ALL is the fallback for an unknown driver.',
    drivers: {},
  };

  for (const [driver, ls] of byDriver) {
    const hav = ls.map((l) => l.haversine);
    const met = ls.map((l) => l.metres);
    const sec = ls.map((l) => l.seconds);

    const fitM = ols(hav, met);
    const fitS = ols(met, sec);

    // end-to-end quality: haversine -> predicted metres -> predicted seconds
    const errM = [];
    const pctM = [];
    const errS = [];
    const pctS = [];
    const errSdirect = [];
    for (let i = 0; i < ls.length; i++) {
      const pm = Math.max(0, fitM.a + fitM.b * hav[i]);
      const ps = Math.max(0, fitS.a + fitS.b * pm);
      const psDirect = Math.max(0, fitS.a + fitS.b * met[i]);
      errM.push(Math.abs(pm - met[i]));
      errS.push(Math.abs(ps - sec[i]));
      errSdirect.push(Math.abs(psDirect - sec[i]));
      if (met[i] >= 100) pctM.push(Math.abs(pm - met[i]) / met[i]);
      if (sec[i] >= 60) pctS.push(Math.abs(ps - sec[i]) / sec[i]);
    }

    estimator.drivers[driver] = {
      legs: ls.length,
      metres: { a: round(fitM.a, 4), b: round(fitM.b, 6), r2: round(fitM.r2, 4) },
      seconds: { c: round(fitS.a, 4), d: round(fitS.b, 6), r2: round(fitS.r2, 4) },
      quality: {
        medianAbsErrMetres: round(median(errM), 1),
        medianAbsPctMetres: round(median(pctM), 4),
        medianAbsErrSeconds: round(median(errS), 1),
        medianAbsPctSeconds: round(median(pctS), 4),
        medianAbsErrSecondsGivenTrueMetres: round(median(errSdirect), 1),
        pctSampleLegs: pctS.length,
      },
    };
  }

  // ---------------------------------------------------------------- inferred start areas
  const startsByDriver = new Map();
  for (const d of driverStarts) {
    if (!startsByDriver.has(d.driver)) startsByDriver.set(d.driver, []);
    startsByDriver.get(d.driver).push(d);
  }
  const medoidOf = (pts) => {
    let best = null;
    for (const p of pts) {
      let sum = 0;
      for (const q of pts) sum += haversineMetres(p.lat, p.lng, q.lat, q.lng);
      const mean = sum / pts.length;
      if (!best || mean < best.meanMetres) best = { ...p, meanMetres: mean };
    }
    if (!best) return null;
    const ds = pts.map((q) => haversineMetres(best.lat, best.lng, q.lat, q.lng));
    return {
      lat: best.lat,
      lng: best.lng,
      address: best.address,
      date: best.date,
      days: pts.length,
      meanKmToOtherDays: round(best.meanMetres / 1000, 2),
      medianKmToOtherDays: round(median(ds) / 1000, 2),
      maxKmToOtherDays: round(Math.max(...ds) / 1000, 2),
    };
  };

  const inferredStartArea = {};
  const inferredEndArea = {};
  for (const [driver, ds] of startsByDriver) {
    inferredStartArea[driver] = medoidOf(
      ds.map((d) => ({ lat: d.startLat, lng: d.startLng, address: d.startAddress, date: d.date }))
    );
    inferredEndArea[driver] = medoidOf(
      ds.map((d) => ({ lat: d.endLat, lng: d.endLng, address: d.endAddress, date: d.date }))
    );
    const starts = ds.map((d) => d.derivedRouteStartMinutes).filter((v) => v != null);
    inferredStartArea[driver].medianRouteStartMinutes = round(median(starts), 1);
    inferredStartArea[driver].inboundLegMedianMinutes = round(
      median(ds.map((d) => d.inboundLegSeconds).filter((v) => v != null)) / 60,
      1
    );
  }

  // ---------------------------------------------------------------- coverage
  const nPlaces = places.size;
  const possiblePairs = (nPlaces * (nPlaces - 1)) / 2;
  const observedPairs = Object.keys(pairs).length;

  const placesOut = {};
  for (const [id, p] of places) {
    placesOut[id] = {
      id,
      lat: p.lat,
      lng: p.lng,
      address: p.address,
      addresses: [...p.addresses],
      locationNames: [...p.locationNames],
      orderNos: [...p.orderNos],
      jobNumbers: [...p.jobNumbers],
      drivers: [...p.drivers],
      dates: [...p.dates],
      visits: p.visits,
      medianServiceMinutes: median(p.serviceMinutes),
    };
  }

  // how often does a repeated pair actually agree?
  const repeatPairs = Object.values(pairs).filter((p) => p.n > 1);
  const repeatSpread = repeatPairs.map((p) =>
    p.medianSeconds > 0 ? (p.maxSeconds - p.minSeconds) / p.medianSeconds : 0
  );

  const model = {
    generatedAt: new Date().toISOString(),
    source: 'projects/briefs/route-engine/redesign/data/optimo-routes/*.json',
    units: { seconds: 'travel seconds', metres: 'travel metres', haversine: 'straight-line metres' },
    coverage: {
      dayFiles: days.length,
      emptyDayFiles: skipped.length,
      routes: routeCount,
      stops: stopCount,
      legs: legs.length,
      distinctPlaces: nPlaces,
      observedPairs,
      possiblePairs,
      pairCoveragePct: round((observedPairs / possiblePairs) * 100, 4),
      pairsSeenOnce: Object.values(pairs).filter((p) => p.n === 1).length,
      pairsSeenMultiple: repeatPairs.length,
      medianRepeatPairSpreadPct: round(median(repeatSpread) * 100, 2),
      directedPairs: Object.keys(directedPairs).length,
      directedPairsSeenOnce: directedSeenOnce,
      pairsSeenBothDirections: asym.length / 2,
      medianDirectionalDiffPct: round(median(asym) * 100, 2),
      drivers: [...byDriver.keys()].filter((d) => d !== 'ALL'),
      dates: days.map((d) => d.date),
    },
    quirks,
    estimator,
    inferredStartArea,
    inferredEndArea,
    driverStarts,
    places: placesOut,
    pairs,
    directedPairs,
    legs,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(model, null, 1));
  return model;
}

const m = build();
console.log('--- travel-model built ---');
console.log(JSON.stringify(m.coverage, null, 1));
console.log('--- quirks ---');
console.log(JSON.stringify(m.quirks, null, 1));
console.log('--- estimator ---');
console.log(JSON.stringify(m.estimator.drivers, null, 1));
console.log('--- inferred start areas ---');
console.log(JSON.stringify(m.inferredStartArea, null, 1));
console.log('--- inferred end areas ---');
console.log(JSON.stringify(m.inferredEndArea, null, 1));
console.log(`written: ${OUT_FILE}`);
