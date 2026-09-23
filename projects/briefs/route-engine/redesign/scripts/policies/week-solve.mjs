#!/usr/bin/env node
/**
 * Policy: week-solve
 *
 * The S4 design, implemented. Three layers, each with its own clock:
 *
 *   Layer 1  Book of business — every job has ONE owner tech, derived from
 *            completed visits strictly before the Friday 14:00 PT cutoff.
 *            A job with no owner-bearing history is voted in by its 10 nearest
 *            neighbours that do have one. No lookahead: master-asbuilt's own
 *            routeDay is deliberately NOT used, because it was computed over a
 *            window that contains the golden weeks.
 *
 *   Layer 2  Due window — not a date. Computed from the job's last completed
 *            visit before the cutoff and the state the harness can actually
 *            determine offline:
 *              active TMCP / Quick Fix  -> [last + 5, last + 9]
 *              quiet TMCP               -> [last + 26, last + 35]
 *              state undeterminable     -> the visit's own scheduled day +-2 weekdays
 *            Every window is reported by tier so the reader can see how much of
 *            the result rests on a measured state and how much on a fallback.
 *
 *   Layer 3  The week — solved per tech. Greedy by window urgency, then a
 *            move/swap local search minimising
 *              capacity (quadratic above 8.0 h, hard wall 9.5 h)
 *            + compactness (km from the day-zone medoid)
 *            + weekday drift (small)
 *            subject to: owner tech only, Mon-Fri only, never outside the window.
 *            Anything that cannot fit under the wall goes to `overflow` and is
 *            left unplaced, so the scorecard counts it rather than hiding it.
 *
 * Day-zones: per tech, k-medoids (k=5) over the coordinates of that tech's
 * completed stops before the week. Each zone takes the weekday it was most often
 * served on, one weekday per zone, ties spread across the free weekdays. The
 * zone's cycle time is that tech/weekday's median span-per-stop from the
 * route-day-drive summary, also cut at the week start.
 *
 * Sequencing is NOT done here. The harness sequences every policy's board with
 * the same sequencer, so policies are compared on the board, not the routing.
 *
 * Weight overrides for sensitivity runs, read from the environment:
 *   WS_CAP_W    capacity weight, cost units per (hour above 8.0)^2   default 30
 *   WS_ZONE_W   compactness weight, cost units per km from the medoid default 1
 *   WS_DRIFT_W  weekday-drift weight, cost units per drifted visit    default 1
 *
 * Offline. No network, no oracle.
 */

import fs from 'node:fs';
import path from 'node:path';
import { dowOf, weekDays, PROJECT } from '../backtest-data.mjs';
import {
  loadCycleTimes as sharedLoadCycleTimes,
  resolveCycleSource,
} from '../lib/cycle-time.mjs';

export const name = 'week-solve';
export const description =
  'The S4 design: owner map from history, due windows from the last visit, the week solved per tech under capacity, zone compactness and window constraints.';
export const usesOracle = false;

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// ---- tuning -----------------------------------------------------------------

const num = (v, d) => (v == null || v === '' || !Number.isFinite(Number(v)) ? d : Number(v));
const W = {
  cap: num(process.env.WS_CAP_W, 30), // per (hour above 8.0)^2
  zone: num(process.env.WS_ZONE_W, 1), // per km from the day-zone medoid
  drift: num(process.env.WS_DRIFT_W, 1), // per visit not on its last visit's weekday
  late: num(process.env.WS_LATE_W, 2), // per weekday later, for an already-overdue visit
};
// How a visit whose window closed before the week opens is handled.
//   'monday'  strict: its only legal day is the first day of the week
//   'week'    any weekday, with a small cost pushing it early
const OVERDUE_MODE = process.env.WS_OVERDUE === 'week' ? 'week' : 'monday';
const SOFT_HOURS = 8.0;
const WALL_HOURS = 9.5;
const K_ZONES = 5;
const NN_VOTE_K = 10;
const ACTIVE_WINDOW = [5, 9];
const QUIET_WINDOW = [26, 35];
const ACTIVE_GAP_MAX = 12; // last delivered gap at or under this reads as active
const QUIET_GAP_MIN = 20; // at or over this reads as quiet
const FALLBACK_SPREAD = 2; // scheduled day +- this many weekdays

// ---- small helpers ----------------------------------------------------------

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371.0088;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function median(xs) {
  const s = xs.filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function addDaysISO(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86400e3).toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400e3;
}

// ---- cycle times ------------------------------------------------------------

/**
 * Median minutes per stop, per tech per weekday — cut at the golden week's
 * Monday so nothing from inside the week (or after it) reaches the capacity
 * model.
 *
 * The estimator itself lives in lib/cycle-time.mjs and is shared with
 * demand-model.mjs (S6 defect D-cycle: the two files used to disagree, one
 * taking the ratio of medians and the other the median of ratios).
 *
 * Source selection, in order:
 *   opts.cycleSource argument -> WS_CYCLE env var -> 'stamps'
 * `gps` reads data/gps-ground-truth.json (per route-day, so the cut still
 * applies); `stamps` reads the newest data/route-day-drive_*.json.
 */
function loadCycleTimes(week, cycleSource) {
  const { source, overrideFile } = resolveCycleSource(
    cycleSource || process.env.WS_CYCLE || 'stamps',
  );
  const ct = sharedLoadCycleTimes({
    source,
    overrideFile,
    before: week,
    dirs: [path.join(PROJECT, 'data'), path.join(PROJECT, 'redesign', 'data')],
  });
  return {
    byTechDow: ct.byTechDow,
    byTech: ct.byTech,
    all: ct.all,
    routeDaysUsed: ct.routeDaysUsed,
    file: ct.file,
    source: ct.source,
    estimator: ct.estimator,
    degraded: ct.degraded,
  };
}

// ---- k-medoids --------------------------------------------------------------

/** k-medoids over lat/lng points. Deterministic: farthest-point seeding. */
function kMedoids(points, k, maxIter = 40) {
  if (!points.length) return { medoids: [], labels: [] };
  const n = points.length;
  const kk = Math.min(k, n);
  const d = (i, j) => haversineKm(points[i].lat, points[i].lng, points[j].lat, points[j].lng);

  // seed: the point nearest the centroid, then repeatedly the farthest point
  // from the current medoid set. No randomness, so a re-run gives the same map.
  const cLat = points.reduce((s, p) => s + p.lat, 0) / n;
  const cLng = points.reduce((s, p) => s + p.lng, 0) / n;
  let first = 0;
  let bestD = Infinity;
  for (let i = 0; i < n; i++) {
    const dd = haversineKm(points[i].lat, points[i].lng, cLat, cLng);
    if (dd < bestD) {
      bestD = dd;
      first = i;
    }
  }
  const medoids = [first];
  while (medoids.length < kk) {
    let far = -1;
    let farD = -1;
    for (let i = 0; i < n; i++) {
      if (medoids.includes(i)) continue;
      let m = Infinity;
      for (const mi of medoids) m = Math.min(m, d(i, mi));
      if (m > farD) {
        farD = m;
        far = i;
      }
    }
    if (far < 0) break;
    medoids.push(far);
  }

  let labels = new Array(n).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bd = Infinity;
      for (let c = 0; c < medoids.length; c++) {
        const dd = d(i, medoids[c]);
        if (dd < bd) {
          bd = dd;
          best = c;
        }
      }
      if (labels[i] !== best) {
        labels[i] = best;
        changed = true;
      }
    }
    // update: the member minimising total distance inside its cluster
    let moved = false;
    for (let c = 0; c < medoids.length; c++) {
      const members = [];
      for (let i = 0; i < n; i++) if (labels[i] === c) members.push(i);
      if (!members.length) continue;
      let best = medoids[c];
      let bestSum = Infinity;
      for (const cand of members) {
        let s = 0;
        for (const m of members) s += d(cand, m);
        if (s < bestSum) {
          bestSum = s;
          best = cand;
        }
      }
      if (best !== medoids[c]) {
        medoids[c] = best;
        moved = true;
      }
    }
    if (!changed && !moved) break;
  }
  return { medoids: medoids.map((i) => ({ lat: points[i].lat, lng: points[i].lng })), labels };
}

/**
 * One weekday per zone. Each zone bids for the weekday its stops were most often
 * served on; the strongest bids are honoured first and every remaining zone is
 * spread across the weekdays still free.
 */
function zonesToWeekdays(zoneDowCounts, nZones) {
  const bids = [];
  for (let z = 0; z < nZones; z++) {
    const counts = zoneDowCounts[z] || {};
    for (const dw of WEEKDAYS) bids.push({ z, dw, c: counts[dw] || 0 });
  }
  bids.sort((a, b) => b.c - a.c || WEEKDAYS.indexOf(a.dw) - WEEKDAYS.indexOf(b.dw) || a.z - b.z);
  const zoneOf = new Map(); // dow -> zone
  const dowOfZone = new Map(); // zone -> dow
  let ties = 0;
  for (const b of bids) {
    if (dowOfZone.has(b.z) || zoneOf.has(b.dw)) continue;
    if (b.c === 0) ties += 1;
    dowOfZone.set(b.z, b.dw);
    zoneOf.set(b.dw, b.z);
  }
  // any weekday still free gets the nearest-by-count zone already placed
  for (const dw of WEEKDAYS) if (!zoneOf.has(dw)) zoneOf.set(dw, null);
  return { zoneOf, dowOfZone, spreadTies: ties };
}

// ---- the policy -------------------------------------------------------------

export function propose(snap) {
  const days = weekDays(snap.week);
  const dowToDate = new Map(days.map((d) => [dowOf(d), d]));
  const dateToDow = new Map(days.map((d) => [d, dowOf(d)]));
  const asOfMs = Date.parse(snap.asOf);
  const roster = snap.techs.slice();
  const rosterSet = new Set(roster);

  // ---------------------------------------------------------------- history
  // Every completed visit strictly before the Friday 14:00 PT cutoff. The
  // snapshot's history is cut at the week's Monday, which is looser than the
  // cutoff, so re-cut it on the completion instant where one is available.
  const hist = [];
  for (const h of snap.history) {
    const st = snap.stamps.get(h.key);
    const ms = st?.completedAt ? Date.parse(st.completedAt) : Date.parse(`${h.date}T23:59:59Z`);
    if (!(ms < asOfMs)) continue;
    hist.push({ ...h, ms });
  }
  hist.sort((a, b) => a.ms - b.ms);

  const histByJob = new Map();
  const histByTech = new Map();
  for (const h of hist) {
    if (!histByJob.has(h.jobNumber)) histByJob.set(h.jobNumber, []);
    histByJob.get(h.jobNumber).push(h);
    if (!histByTech.has(h.tech)) histByTech.set(h.tech, []);
    histByTech.get(h.tech).push(h);
  }

  // ---------------------------------------------------------------- Layer 1
  // Owner tech per job. Dominant tech over completed visits before the cutoff,
  // ties broken by the most recent. A tech no longer on the roster does not
  // count, so a handed-over book re-homes instead of vanishing.
  const jobCoord = new Map();
  for (const v of snap.due) {
    if (v.lat != null && v.lng != null && !jobCoord.has(v.jobNumber)) {
      jobCoord.set(v.jobNumber, { lat: v.lat, lng: v.lng });
    }
  }
  for (const [jn, rows] of histByJob) {
    if (jobCoord.has(jn)) continue;
    const p = rows.find((r) => r.lat != null && r.lng != null);
    if (p) jobCoord.set(jn, { lat: p.lat, lng: p.lng });
  }
  for (const v of snap.due) {
    if (jobCoord.has(v.jobNumber)) continue;
    const j = snap.jobsByNumber.get(v.jobNumber);
    if (j?.property?.lat != null) jobCoord.set(v.jobNumber, { lat: j.property.lat, lng: j.property.lng });
  }

  const ownerOf = new Map();
  const ownerBasis = { dominant: 0, neighbourVote: 0, rosterFloor: 0 };
  const ownerSupport = [];
  for (const [jn, rows] of histByJob) {
    const counts = new Map();
    const last = new Map();
    for (const r of rows) {
      if (!rosterSet.has(r.tech)) continue;
      counts.set(r.tech, (counts.get(r.tech) || 0) + 1);
      if (!last.has(r.tech) || r.ms > last.get(r.tech)) last.set(r.tech, r.ms);
    }
    let best = null;
    let bc = -1;
    let bl = -1;
    for (const [t, c] of counts) {
      const l = last.get(t);
      if (c > bc || (c === bc && l > bl)) {
        best = t;
        bc = c;
        bl = l;
      }
    }
    if (best) {
      ownerOf.set(jn, best);
      ownerSupport.push(bc / rows.length);
    }
  }
  ownerBasis.dominant = ownerOf.size;

  // neighbour vote for a job with no owner-bearing history
  const anchored = [...ownerOf.keys()].filter((jn) => jobCoord.has(jn)).map((jn) => ({ jn, ...jobCoord.get(jn) }));
  const needOwner = [...new Set(snap.due.map((v) => v.jobNumber))].filter((jn) => !ownerOf.has(jn));
  for (const jn of needOwner) {
    const c = jobCoord.get(jn);
    if (!c || !anchored.length) {
      ownerOf.set(jn, roster[0]);
      ownerBasis.rosterFloor += 1;
      continue;
    }
    const near = anchored
      .map((a) => ({ jn: a.jn, km: haversineKm(c.lat, c.lng, a.lat, a.lng) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, NN_VOTE_K);
    const votes = new Map();
    for (const nb of near) {
      const t = ownerOf.get(nb.jn);
      // inverse-distance weighting, so a neighbour 0.2 km away outvotes one 8 km away
      votes.set(t, (votes.get(t) || 0) + 1 / Math.max(0.25, nb.km));
    }
    let bt = roster[0];
    let bv = -1;
    for (const [t, v] of votes) if (v > bv) ((bt = t), (bv = v));
    ownerOf.set(jn, bt);
    ownerBasis.neighbourVote += 1;
  }

  // ---------------------------------------------------------------- Layer 2
  // Due windows.
  const lastVisitOf = new Map(); // jobNumber -> {date, dow, ms}
  const lastGapOf = new Map(); // jobNumber -> delivered gap in days before the cutoff
  for (const [jn, rows] of histByJob) {
    const lastRow = rows[rows.length - 1];
    lastVisitOf.set(jn, lastRow);
    if (rows.length >= 2) lastGapOf.set(jn, daysBetween(rows[rows.length - 2].date, lastRow.date));
  }

  const windows = {};
  const windowTiers = {};
  const clamps = { none: 0, overdue: 0, early: 0 };
  const bump = (o, k) => (o[k] = (o[k] || 0) + 1);

  for (const v of snap.due) {
    const lastV = lastVisitOf.get(v.jobNumber);
    const gap = lastGapOf.get(v.jobNumber);
    let tier = null;
    let from = null;
    let to = null;

    if (lastV && v.product === 'QUICK_FIX') {
      // standing rule: a Quick Fix series is weekly by construction
      tier = 'active-series';
      [from, to] = ACTIVE_WINDOW;
    } else if (lastV && v.product === 'TMCP' && gap != null && gap <= ACTIVE_GAP_MAX) {
      tier = 'active-measured';
      [from, to] = ACTIVE_WINDOW;
    } else if (lastV && v.product === 'TMCP' && gap != null && gap >= QUIET_GAP_MIN) {
      tier = 'quiet-measured';
      [from, to] = QUIET_WINDOW;
    } else if (lastV && v.product === 'TMCP' && gap == null) {
      // one completed visit before the cutoff: an anchor but no delivered gap.
      // Every measurable TMCP gap in this window is weekly, so active is the
      // supported read — flagged as assumed, not measured.
      tier = 'active-assumed';
      [from, to] = ACTIVE_WINDOW;
    } else {
      tier = lastV ? (v.product === 'TMCP' ? 'ambiguous-gap' : 'other-product') : 'no-anchor';
    }

    let winFrom;
    let winTo;
    if (from != null && lastV) {
      winFrom = addDaysISO(lastV.date, from);
      winTo = addDaysISO(lastV.date, to);
    } else {
      // the harness cannot determine state: fall back to the visit's own
      // scheduled day, plus or minus two weekdays.
      const sd = v.startDate;
      const idx = days.indexOf(sd);
      if (idx >= 0) {
        winFrom = days[Math.max(0, idx - FALLBACK_SPREAD)];
        winTo = days[Math.min(4, idx + FALLBACK_SPREAD)];
      } else {
        winFrom = days[0];
        winTo = days[4];
      }
    }

    let allowed = days.filter((d) => d >= winFrom && d <= winTo);
    let clamp = 'none';
    if (!allowed.length) {
      if (winTo < days[0]) {
        // the window closed before the week opened: the visit is already late.
        // Strictly, the earliest day of the week is the only placement that
        // honours the window at all; in practice a week of overdue work cannot
        // all land on Monday, so 'week' mode lets it spread and pays a small
        // cost per day of further delay.
        allowed = OVERDUE_MODE === 'week' ? days.slice() : [days[0]];
        clamp = 'overdue';
      } else {
        // the window opens after the week closes, yet the office booked it here
        allowed = [days[4]];
        clamp = 'early';
      }
    }
    clamps[clamp] += 1;
    bump(windowTiers, tier);
    windows[v.key] = {
      from: winFrom,
      to: winTo,
      type: tier,
      clamp,
      allowed,
      anchor: lastV ? lastV.date : null,
      lastDow: lastV ? lastV.dow : dateToDow.get(v.startDate) || null,
    };
  }

  // ---------------------------------------------------------------- day-zones
  const cyc = loadCycleTimes(snap.week, snap.cycleSource);
  const cycleFor = (tech, dw) =>
    cyc.byTechDow.get(`${tech}|${dw}`) ?? cyc.byTech.get(tech) ?? cyc.all ?? 20;
  const cycleSourceFor = (tech, dw) =>
    cyc.byTechDow.has(`${tech}|${dw}`)
      ? 'tech+weekday'
      : cyc.byTech.has(tech)
        ? 'tech median'
        : cyc.all != null
          ? 'all-tech median'
          : 'default 20 min';

  const zonesByTech = new Map();
  const cycleSourceCounts = {};
  for (const tech of roster) {
    const pts = (histByTech.get(tech) || []).filter((h) => h.lat != null && h.lng != null);
    const km = kMedoids(pts.map((p) => ({ lat: p.lat, lng: p.lng })), K_ZONES);
    const nZones = km.medoids.length;
    const zoneDowCounts = Array.from({ length: nZones }, () => ({}));
    const zoneSize = new Array(nZones).fill(0);
    km.labels.forEach((z, i) => {
      zoneDowCounts[z][pts[i].dow] = (zoneDowCounts[z][pts[i].dow] || 0) + 1;
      zoneSize[z] += 1;
    });
    const { zoneOf, spreadTies } = zonesToWeekdays(zoneDowCounts, nZones);
    const byDow = new Map();
    for (const dw of WEEKDAYS) {
      const z = zoneOf.get(dw);
      const medoid = z != null && km.medoids[z] ? km.medoids[z] : null;
      const cycle = cycleFor(tech, dw);
      const src = cycleSourceFor(tech, dw);
      bump(cycleSourceCounts, src);
      byDow.set(dw, {
        zone: z,
        medoid,
        stops: z != null ? zoneSize[z] : 0,
        cycleMin: cycle,
        capStops: Math.max(1, Math.floor((WALL_HOURS * 60) / cycle)),
        cycleSource: src,
      });
    }
    zonesByTech.set(tech, { byDow, nZones, spreadTies, points: pts.length, medoids: km.medoids });
  }

  // ---------------------------------------------------------------- Layer 3
  const byTech = new Map(roster.map((t) => [t, []]));
  const offRoster = [];
  for (const v of snap.due) {
    const t = ownerOf.get(v.jobNumber);
    if (!byTech.has(t)) {
      offRoster.push(v.key);
      byTech.get(roster[0]).push(v);
      continue;
    }
    byTech.get(t).push(v);
  }

  const assignments = [];
  const overflow = [];
  const perTech = [];

  for (const tech of roster) {
    const visits = byTech.get(tech);
    const zoneInfo = zonesByTech.get(tech);
    const dayMeta = new Map();
    for (const d of days) {
      const dw = dateToDow.get(d);
      const z = zoneInfo.byDow.get(dw);
      dayMeta.set(d, { date: d, dow: dw, ...z });
    }

    // per-visit, per-day cost pieces that never change
    const items = visits.map((v) => {
      const w = windows[v.key];
      const zoneKm = new Map();
      for (const d of days) {
        const m = dayMeta.get(d);
        const km = m.medoid && v.lat != null ? haversineKm(v.lat, v.lng, m.medoid.lat, m.medoid.lng) : 0;
        zoneKm.set(d, km);
      }
      return {
        key: v.key,
        v,
        allowed: w.allowed,
        zoneKm,
        lastDow: w.lastDow,
        winTo: w.to,
        overdue: w.clamp === 'overdue',
      };
    });

    const load = new Map(days.map((d) => [d, 0]));
    const place = new Map();

    const dayHours = (d, n) => (n * dayMeta.get(d).cycleMin) / 60;
    const capCost = (d, n) => {
      const h = dayHours(d, n);
      return h > SOFT_HOURS ? W.cap * (h - SOFT_HOURS) ** 2 : 0;
    };
    const itemCost = (it, d) =>
      W.zone * it.zoneKm.get(d) +
      (it.lastDow && dateToDow.get(d) !== it.lastDow ? W.drift : 0) +
      (it.overdue ? W.late * days.indexOf(d) : 0);
    const feasible = (it, d) => it.allowed.includes(d) && load.get(d) < dayMeta.get(d).capStops;

    // ---- greedy, most urgent first: fewest legal days, then the window closing soonest
    const order = items
      .slice()
      .sort((a, b) => a.allowed.length - b.allowed.length || (a.winTo < b.winTo ? -1 : a.winTo > b.winTo ? 1 : 0));
    for (const it of order) {
      let bestD = null;
      let bestC = Infinity;
      for (const d of it.allowed) {
        if (!feasible(it, d)) continue;
        const n = load.get(d);
        const c = itemCost(it, d) + (capCost(d, n + 1) - capCost(d, n));
        if (c < bestC) {
          bestC = c;
          bestD = d;
        }
      }
      if (!bestD) {
        overflow.push(it.key);
        continue;
      }
      place.set(it.key, bestD);
      load.set(bestD, load.get(bestD) + 1);
    }

    // ---- local search: moves then swaps, until nothing improves
    const totalCost = () => {
      let c = 0;
      for (const d of days) c += capCost(d, load.get(d));
      for (const it of items) {
        const d = place.get(it.key);
        if (d) c += itemCost(it, d);
      }
      return c;
    };
    const placedItems = () => items.filter((it) => place.has(it.key));

    let pass = 0;
    let improved = true;
    let moves = 0;
    let swaps = 0;
    let reinserted = 0;
    while (improved && pass < 25) {
      improved = false;
      pass += 1;

      // move
      for (const it of placedItems()) {
        const from = place.get(it.key);
        let bestD = null;
        let bestGain = 1e-9;
        for (const d of it.allowed) {
          if (d === from) continue;
          if (load.get(d) >= dayMeta.get(d).capStops) continue;
          const nf = load.get(from);
          const nt = load.get(d);
          const delta =
            itemCost(it, d) -
            itemCost(it, from) +
            (capCost(from, nf - 1) - capCost(from, nf)) +
            (capCost(d, nt + 1) - capCost(d, nt));
          if (-delta > bestGain) {
            bestGain = -delta;
            bestD = d;
          }
        }
        if (bestD) {
          load.set(from, load.get(from) - 1);
          load.set(bestD, load.get(bestD) + 1);
          place.set(it.key, bestD);
          improved = true;
          moves += 1;
        }
      }

      // swap: two visits exchange days. Capacity is unchanged by a swap, so only
      // the item costs matter, which makes this the cheap half of the search.
      const pl = placedItems();
      for (let i = 0; i < pl.length; i++) {
        const a = pl[i];
        const da = place.get(a.key);
        for (let j = i + 1; j < pl.length; j++) {
          const b = pl[j];
          const db = place.get(b.key);
          if (da === db) continue;
          if (!a.allowed.includes(db) || !b.allowed.includes(da)) continue;
          const delta =
            itemCost(a, db) + itemCost(b, da) - itemCost(a, da) - itemCost(b, db);
          if (delta < -1e-9) {
            place.set(a.key, db);
            place.set(b.key, da);
            improved = true;
            swaps += 1;
            break;
          }
        }
      }

      // a move may have freed room under the wall for something overflowed
      if (overflow.length) {
        for (let i = overflow.length - 1; i >= 0; i--) {
          const it = items.find((x) => x.key === overflow[i]);
          if (!it) continue;
          let bestD = null;
          let bestC = Infinity;
          for (const d of it.allowed) {
            if (load.get(d) >= dayMeta.get(d).capStops) continue;
            const n = load.get(d);
            const c = itemCost(it, d) + (capCost(d, n + 1) - capCost(d, n));
            if (c < bestC) {
              bestC = c;
              bestD = d;
            }
          }
          if (bestD) {
            place.set(it.key, bestD);
            load.set(bestD, load.get(bestD) + 1);
            overflow.splice(i, 1);
            improved = true;
            reinserted += 1;
          }
        }
      }
    }

    for (const [key, date] of place) assignments.push({ key, tech, date });

    perTech.push({
      tech,
      visits: visits.length,
      placed: place.size,
      overflow: visits.length - place.size,
      searchPasses: pass,
      moves,
      swaps,
      reinserted,
      finalCost: Math.round(totalCost()),
      zonePoints: zoneInfo.points,
      zones: zoneInfo.nZones,
      days: days.map((d) => {
        const m = dayMeta.get(d);
        const n = load.get(d);
        return {
          date: d,
          dow: m.dow,
          stops: n,
          cycleMin: Math.round(m.cycleMin * 10) / 10,
          cycleSource: m.cycleSource,
          capStops: m.capStops,
          cycleHours: Math.round(dayHours(d, n) * 100) / 100,
          over8: dayHours(d, n) > SOFT_HOURS,
          over95: dayHours(d, n) > WALL_HOURS,
        };
      }),
    });
  }

  const cycleHoursDays = perTech.flatMap((t) => t.days);

  return {
    assignments,
    windows,
    overflow,
    notes: {
      weights: { ...W, softHours: SOFT_HOURS, wallHours: WALL_HOURS, overdueMode: OVERDUE_MODE },
      ownerMap: {
        jobs: ownerOf.size,
        ...ownerBasis,
        medianDominantShare: Math.round((median(ownerSupport) ?? 0) * 100) / 100,
        note: 'Dominant tech over completed visits strictly before the Friday 14:00 PT cutoff. master-asbuilt routeDay deliberately unused: it was derived over a window containing the golden weeks.',
      },
      windowTiers,
      windowClamps: clamps,
      windowTierNote:
        'active-measured = last delivered gap <=12d. quiet-measured = >=20d. active-assumed = a TMCP anchor but only one completed visit before the cutoff, so no gap to measure. no-anchor / ambiguous-gap / other-product fall back to the scheduled day +-2 weekdays.',
      dayZones: {
        k: K_ZONES,
        perTech: [...zonesByTech.entries()].map(([t, z]) => ({
          tech: t,
          points: z.points,
          zones: z.nZones,
          spreadTies: z.spreadTies,
          weekdayMap: WEEKDAYS.map((dw) => {
            const m = z.byDow.get(dw);
            return `${dw}:z${m.zone ?? '-'}(${m.stops} pts, ${Math.round(m.cycleMin * 10) / 10} min/stop, cap ${m.capStops})`;
          }).join(' '),
        })),
      },
      cycleTimes: {
        file: cyc.file,
        routeDaysBeforeWeek: cyc.routeDaysUsed,
        allTechMedianMinPerStop: Math.round((cyc.all ?? 0) * 100) / 100,
        sources: cycleSourceCounts,
      },
      capacityAtCycleTime: {
        routeDays: cycleHoursDays.length,
        over8h: cycleHoursDays.filter((d) => d.over8).length,
        over95h: cycleHoursDays.filter((d) => d.over95).length,
        maxHours: Math.max(...cycleHoursDays.map((d) => d.cycleHours)),
      },
      overflowCount: overflow.length,
      offRosterOwners: offRoster.length,
      perTech,
      historyVisitsBeforeCutoff: hist.length,
      historyDays: new Set(hist.map((h) => h.date)).size,
    },
  };
}
