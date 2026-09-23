#!/usr/bin/env node
/**
 * sequence.mjs
 *
 * Orders one tech's stops for one day: nearest-neighbour from the tech's start
 * point, then 2-opt improvement. Every distance and duration comes from
 * travel.mjs, so the sequencer and the scorer share one travel model.
 *
 * Travel here is treated as ASYMMETRIC — the model holds directed pairs that
 * differ by ~4% median — so a 2-opt reversal is costed by recomputing the path
 * rather than by the usual symmetric delta shortcut.
 *
 *   sequenceStops(stops, driver, start, opts) -> { order, cost, improvedFrom, sweeps }
 *   pathSeconds(stops, driver, start)         -> travel seconds incl. the inbound leg
 *   routeMinutes(stops, driver, start)        -> { travelMin, serviceMin, totalMin, ... }
 *
 * A stop is { key, lat, lng, serviceMin }. `start` is { lat, lng } or null.
 * Offline only.
 */

import { travel, placeId } from './travel.mjs';

// travel() already does map lookups, but a 2-opt sweep asks for the same leg
// thousands of times. Memoise on the rounded place pair + driver.
const memo = new Map();
function leg(a, b, driver, est = false) {
  const k = `${placeId(a.lat, a.lng)}>${placeId(b.lat, b.lng)}|${driver}|${est ? 'E' : 'O'}`;
  let v = memo.get(k);
  if (v === undefined) {
    v = travel(a, b, driver, est ? { forceEstimate: true } : undefined);
    memo.set(k, v);
  }
  return v;
}
export function clearLegCache() {
  memo.clear();
}

/**
 * Travel seconds for an ordered stop list, including the inbound leg from `start`.
 * `est` forces the haversine estimator even for legs that were really driven —
 * used as a control, so two orders can be timed by one uniform model instead of
 * one of them getting credit for having its legs in the observed-pair table.
 */
export function pathSeconds(stops, driver, start, est = false) {
  let s = 0;
  let prev = start || null;
  for (const stop of stops) {
    if (prev) s += leg(prev, stop, driver, est).seconds;
    prev = stop;
  }
  return s;
}

/** Travel metres for an ordered stop list, including the inbound leg from `start`. */
export function pathMetres(stops, driver, start, est = false) {
  let m = 0;
  let prev = start || null;
  for (const stop of stops) {
    if (prev) m += leg(prev, stop, driver, est).metres;
    prev = stop;
  }
  return m;
}

/** How many of an ordered list's legs came from real observations. */
export function legMix(stops, driver, start) {
  let observed = 0;
  let estimated = 0;
  let prev = start || null;
  for (const stop of stops) {
    if (prev) (leg(prev, stop, driver).source === 'observed' ? observed++ : estimated++);
    prev = stop;
  }
  return { observed, estimated, estimatedPct: observed + estimated ? (estimated / (observed + estimated)) * 100 : 0 };
}

/**
 * Full route cost for an ordered stop list.
 * Includes the inbound leg from the tech's start; excludes the trip home,
 * which the source data cannot pin down.
 */
export function routeMinutes(stops, driver, start) {
  let travelSec = 0;
  let metres = 0;
  let serviceMin = 0;
  let observed = 0;
  let estimated = 0;
  let prev = start || null;
  for (const stop of stops) {
    serviceMin += Number(stop.serviceMin ?? stop.serviceDurationMin ?? 0);
    if (prev) {
      const t = leg(prev, stop, driver);
      travelSec += t.seconds;
      metres += t.metres;
      if (t.source === 'observed') observed += 1;
      else estimated += 1;
    }
    prev = stop;
  }
  return {
    stops: stops.length,
    travelMin: travelSec / 60,
    travelMetres: metres,
    travelMiles: metres / 1609.344,
    serviceMin,
    totalMin: travelSec / 60 + serviceMin,
    observedLegs: observed,
    estimatedLegs: estimated,
  };
}

/** Nearest-neighbour construction from the tech's start point. */
export function nearestNeighbour(stops, driver, start) {
  const remaining = stops.slice();
  const order = [];
  let cur = start || remaining[0];
  if (!start && remaining.length) order.push(remaining.shift());
  while (remaining.length) {
    let bestI = 0;
    let bestSec = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const s = leg(cur, remaining[i], driver).seconds;
      if (s < bestSec) {
        bestSec = s;
        bestI = i;
      }
    }
    const next = remaining.splice(bestI, 1)[0];
    order.push(next);
    cur = next;
  }
  return order;
}

/**
 * 2-opt. Reverses segment [i..j] and keeps the move when total path seconds drop.
 * Costs are recomputed in full because the travel model is directed.
 */
export function twoOpt(order, driver, start, { maxSweeps = 40, minGainSec = 1 } = {}) {
  let best = order.slice();
  let bestCost = pathSeconds(best, driver, start);
  let sweeps = 0;
  let improved = true;
  while (improved && sweeps < maxSweeps) {
    improved = false;
    sweeps += 1;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const cand = best.slice(0, i).concat(best.slice(i, j + 1).reverse(), best.slice(j + 1));
        const c = pathSeconds(cand, driver, start);
        if (c < bestCost - minGainSec) {
          best = cand;
          bestCost = c;
          improved = true;
        }
      }
    }
  }
  return { order: best, cost: bestCost, sweeps };
}

/**
 * Or-opt: relocate a run of 1..3 consecutive stops elsewhere in the order.
 * Cheap, and it fixes the single-stop detours 2-opt cannot reach.
 */
export function orOpt(order, driver, start, { maxSweeps = 20, minGainSec = 1 } = {}) {
  let best = order.slice();
  let bestCost = pathSeconds(best, driver, start);
  let sweeps = 0;
  let improved = true;
  while (improved && sweeps < maxSweeps) {
    improved = false;
    sweeps += 1;
    for (let len = 1; len <= 3 && len < best.length; len++) {
      for (let i = 0; i + len <= best.length; i++) {
        const seg = best.slice(i, i + len);
        const rest = best.slice(0, i).concat(best.slice(i + len));
        for (let j = 0; j <= rest.length; j++) {
          if (j === i) continue;
          const cand = rest.slice(0, j).concat(seg, rest.slice(j));
          const c = pathSeconds(cand, driver, start);
          if (c < bestCost - minGainSec) {
            best = cand;
            bestCost = c;
            improved = true;
            i = Math.max(-1, i - 1); // restart scanning around the change
            break;
          }
        }
      }
    }
  }
  return { order: best, cost: bestCost, sweeps };
}

/**
 * Order a day's stops for one tech.
 * @param {Array<{key:string,lat:number,lng:number,serviceMin:number}>} stops
 * @param {string} driver
 * @param {{lat:number,lng:number}|null} start
 */
export function sequenceStops(stops, driver, start, opts = {}) {
  const usable = stops.filter((s) => s.lat != null && s.lng != null);
  const unplaceable = stops.filter((s) => s.lat == null || s.lng == null);
  if (usable.length <= 1) {
    return { order: usable.concat(unplaceable), cost: 0, nnCost: 0, sweeps: 0, unplaceable: unplaceable.length };
  }
  const nn = nearestNeighbour(usable, driver, start);
  const nnCost = pathSeconds(nn, driver, start);
  const a = twoOpt(nn, driver, start, opts);
  const b = opts.orOpt === false ? a : orOpt(a.order, driver, start, opts);
  const final = b.cost <= a.cost ? b : a;
  return {
    order: final.order.concat(unplaceable),
    cost: final.cost,
    nnCost,
    improvedPct: nnCost > 0 ? (1 - final.cost / nnCost) * 100 : 0,
    sweeps: a.sweeps + b.sweeps,
    unplaceable: unplaceable.length,
  };
}
