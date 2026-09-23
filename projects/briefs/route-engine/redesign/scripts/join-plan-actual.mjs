#!/usr/bin/env node
/**
 * join-plan-actual.mjs
 *
 * Stage S2 ground truth: join the OptimoRoute plan as it was held for each day
 * against the Jobber completion stamps for the same window.
 *
 *   plan   : redesign/data/optimo-routes/YYYY-MM-DD.json           (per-day route snapshots)
 *   actual : route-engine/data/completed-visits_<from>_<to>.json   (Jobber completedAt)
 *   stamps : route-engine/data/route-day-drive_<from>_<to>.json    (span/service/drive)
 *
 * Join key is the OptimoRoute orderNo, "<jobNumber>-<visitNumericId>", where the
 * numeric id is the tail of the base64-decoded Jobber visit gid. Verified at 98.9%
 * on the full window (2,548 of 2,577 planned stops resolve to a completion).
 *
 * Output: redesign/data/plan-vs-actual.json
 * Offline only. No network calls.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REDESIGN = path.resolve(__dirname, '..');
const ENGINE = path.resolve(REDESIGN, '..');
const ROUTES_DIR = path.join(REDESIGN, 'data', 'optimo-routes');
const COMPLETED = path.join(ENGINE, 'data', 'completed-visits_2026-08-17_2026-09-17.json');
const DAYDRIVE = path.join(ENGINE, 'data', 'route-day-drive_2026-08-17_2026-09-17.json');
const OUT = path.join(REDESIGN, 'data', 'plan-vs-actual.json');

const EVENING_CUTOFF_MIN = 18 * 60 + 30; // 18:30 PT - admin, not field work
const TZ = 'America/Los_Angeles';

// ---------- helpers ----------

const ptParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

/** UTC ISO -> { date: 'YYYY-MM-DD', minutes: float } in Pacific local time */
function toPacific(iso) {
  const p = Object.fromEntries(ptParts.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  const hour = p.hour === '24' ? '00' : p.hour;
  return {
    date: p.year + '-' + p.month + '-' + p.day,
    minutes: Number(hour) * 60 + Number(p.minute) + Number(p.second) / 60,
  };
}

function hhmm(min) {
  if (min == null || !Number.isFinite(min)) return null;
  const m = Math.round(min);
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

const r1 = (n) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : null);

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function stats(values) {
  if (!values.length) return { n: 0, median: null, p10: null, p90: null, mean: null, min: null, max: null };
  const s = [...values].sort((a, b) => a - b);
  return {
    n: s.length,
    median: r1(quantile(s, 0.5)),
    p10: r1(quantile(s, 0.1)),
    p90: r1(quantile(s, 0.9)),
    mean: r1(s.reduce((a, b) => a + b, 0) / s.length),
    min: r1(s[0]),
    max: r1(s[s.length - 1]),
  };
}

/** Monday-anchored week key */
function weekOf(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

const DOW = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
function dowOf(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return DOW[(d.getUTCDay() + 6) % 7];
}

/** Jobber visit gid -> OptimoRoute orderNo */
function orderNoFor(visit) {
  let tail = null;
  try {
    const decoded = Buffer.from(visit.id, 'base64').toString('utf8');
    const m = decoded.match(/(\d+)\s*$/);
    if (m) tail = m[1];
  } catch (e) { /* fall through */ }
  if (!tail) {
    const m = String(visit.id).match(/(\d+)\s*$/);
    tail = m ? m[1] : null;
  }
  return tail ? visit.job + '-' + tail : null;
}

// ---------- load ----------

console.log('[load] plan     ' + ROUTES_DIR);
const dayFiles = fs.readdirSync(ROUTES_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();

const planned = [];
for (const f of dayFiles) {
  const d = JSON.parse(fs.readFileSync(path.join(ROUTES_DIR, f), 'utf8'));
  const date = d.date;
  for (const route of (d.routes || [])) {
    const driver = route.driverName || route.driverSerial;
    const stops = (route.stops || []).slice().sort((a, b) => a.stopNumber - b.stopNumber);
    stops.forEach((s, i) => {
      planned.push({
        date,
        driver,
        orderNo: s.orderNo,
        stopNumber: s.stopNumber,
        isFirstStop: i === 0,
        locationName: s.locationName,
        address: s.address,
        arrivalMinutes: s.arrivalMinutes != null ? s.arrivalMinutes : null,
        departureMinutes: s.departureMinutes != null ? s.departureMinutes : null,
        serviceMinutes: s.serviceDurationMin != null ? s.serviceDurationMin : null,
        legTravelMin: s.travelTimeSec != null ? s.travelTimeSec / 60 : null,
        legDistanceKm: s.travelDistanceM != null ? s.travelDistanceM / 1000 : null,
      });
    });
  }
}
console.log('[load] plan     ' + dayFiles.length + ' day files, ' + planned.length + ' planned stops');

console.log('[load] actual   ' + COMPLETED);
const rawVisits = JSON.parse(fs.readFileSync(COMPLETED, 'utf8'));
const actual = [];
let badKey = 0;
for (const v of rawVisits) {
  if (!v.completedAt) continue;
  const key = orderNoFor(v);
  if (!key) { badKey++; continue; }
  const pt = toPacific(v.completedAt);
  actual.push({
    orderNo: key, job: v.job, title: v.title, tech: v.tech,
    date: pt.date, stampMinutes: pt.minutes, zip: v.zip, city: v.city,
  });
}
console.log('[load] actual   ' + actual.length + ' completions with stamps (' + badKey + ' unkeyable)');

console.log('[load] stamps   ' + DAYDRIVE);
const dayDrive = JSON.parse(fs.readFileSync(DAYDRIVE, 'utf8'));
const dayDriveIdx = new Map();
for (const rd of dayDrive.routeDays) dayDriveIdx.set(rd.day + '|' + rd.tech, rd);
console.log('[load] stamps   ' + dayDrive.routeDays.length + ' stamp-derived route-days');

// ---------- index ----------

const actualByKey = new Map();
for (const a of actual) actualByKey.set(a.orderNo, a);

const plannedByKey = new Map();
for (const p of planned) {
  if (!plannedByKey.has(p.orderNo)) plannedByKey.set(p.orderNo, []);
  plannedByKey.get(p.orderNo).push(p);
}
const plannedDayTech = new Set(planned.map((p) => p.date + '|' + p.driver + '|' + p.orderNo));
const dupPlanned = [...plannedByKey.values()].filter((v) => v.length > 1).length;
console.log('[join] ' + plannedByKey.size + ' distinct planned orders (' + dupPlanned + ' planned on more than one day)');

// ---------- per-stop classification, plan side ----------

for (const p of planned) {
  const a = actualByKey.get(p.orderNo);
  if (!a) { p.outcome = 'ghost'; continue; }
  p.actualDate = a.date;
  p.actualTech = a.tech;
  p.actualStampMinutes = a.stampMinutes;
  if (a.date !== p.date) {
    p.outcome = 'moved-day';
    p.dayShift = Math.round((new Date(a.date + 'T00:00:00Z') - new Date(p.date + 'T00:00:00Z')) / 86400000);
  } else if (a.tech !== p.driver) {
    p.outcome = 'moved-tech';
  } else {
    p.outcome = 'matched';
    p.deltaVsPlannedArrival = a.stampMinutes - p.arrivalMinutes;
    p.deltaVsPlannedDeparture = p.departureMinutes != null
      ? a.stampMinutes - p.departureMinutes
      : a.stampMinutes - (p.arrivalMinutes + (p.serviceMinutes || 0));
    p.eveningStamp = a.stampMinutes > EVENING_CUTOFF_MIN;
  }
}

// ---------- per-stop classification, actual side ----------

for (const a of actual) {
  if (plannedDayTech.has(a.date + '|' + a.tech + '|' + a.orderNo)) { a.inbound = 'matched'; continue; }
  const plans = plannedByKey.get(a.orderNo) || [];
  if (!plans.length) { a.inbound = 'off-map'; continue; }
  a.inbound = plans.some((p) => p.date === a.date) ? 'moved-tech' : 'moved-day';
  a.plannedDates = plans.map((p) => p.date);
  a.plannedDrivers = plans.map((p) => p.driver);
}

// ---------- route-days ----------

const rdKey = (date, driver) => date + '|' + driver;
const routeDays = new Map();

function ensureRD(date, driver) {
  const k = rdKey(date, driver);
  if (!routeDays.has(k)) {
    routeDays.set(k, { date, driver, week: weekOf(date), dow: dowOf(date), planned: null, actual: null, stops: [] });
  }
  return routeDays.get(k);
}

const plannedByRD = new Map();
for (const p of planned) {
  const k = rdKey(p.date, p.driver);
  if (!plannedByRD.has(k)) plannedByRD.set(k, []);
  plannedByRD.get(k).push(p);
}
for (const [k, stops] of plannedByRD) {
  const [date, driver] = k.split('|');
  const rd = ensureRD(date, driver);
  const arr = stops.map((s) => s.arrivalMinutes).filter(Number.isFinite);
  const dep = stops.map((s) => (s.departureMinutes != null ? s.departureMinutes : s.arrivalMinutes + (s.serviceMinutes || 0))).filter(Number.isFinite);
  const firstArrival = Math.min.apply(null, arr);
  const lastDeparture = Math.max.apply(null, dep);
  const legsAll = stops.map((s) => s.legTravelMin || 0);
  const legsInter = stops.filter((s) => !s.isFirstStop).map((s) => s.legTravelMin || 0);
  const firstStop = stops.find((s) => s.isFirstStop);
  rd.planned = {
    stops: stops.length,
    firstArrival: hhmm(firstArrival),
    firstArrivalMin: r1(firstArrival),
    lastDeparture: hhmm(lastDeparture),
    lastDepartureMin: r1(lastDeparture),
    spanMin: r1(lastDeparture - firstArrival),
    // inter-stop legs only; the first stop's inbound leg comes from an unknown origin
    driveMin: r1(legsInter.reduce((a, b) => a + b, 0)),
    driveInclInboundMin: r1(legsAll.reduce((a, b) => a + b, 0)),
    inboundLegMin: r1(firstStop ? (firstStop.legTravelMin || 0) : 0),
    serviceMin: r1(stops.reduce((a, s) => a + (s.serviceMinutes || 0), 0)),
    distanceKm: r1(stops.filter((s) => !s.isFirstStop).reduce((a, s) => a + (s.legDistanceKm || 0), 0)),
  };
}

const actualByRD = new Map();
for (const a of actual) {
  const k = rdKey(a.date, a.tech);
  if (!actualByRD.has(k)) actualByRD.set(k, []);
  actualByRD.get(k).push(a);
}
for (const [k, comps] of actualByRD) {
  const [date, driver] = k.split('|');
  const rd = ensureRD(date, driver);
  comps.sort((a, b) => a.stampMinutes - b.stampMinutes);
  const first = comps[0].stampMinutes;
  const last = comps[comps.length - 1].stampMinutes;
  const dayWork = comps.filter((c) => c.stampMinutes <= EVENING_CUTOFF_MIN);
  const gaps = [];
  for (let i = 1; i < comps.length; i++) gaps.push(comps[i].stampMinutes - comps[i - 1].stampMinutes);
  const sd = dayDriveIdx.get(date + '|' + driver) || null;
  rd.actual = {
    stops: comps.length,
    firstStamp: hhmm(first),
    firstStampMin: r1(first),
    lastStamp: hhmm(last),
    lastStampMin: r1(last),
    spanMin: r1(last - first),
    spanToLastDayStopMin: dayWork.length ? r1(dayWork[dayWork.length - 1].stampMinutes - first) : null,
    eveningStamps: comps.length - dayWork.length,
    maxGapMin: gaps.length ? r1(Math.max.apply(null, gaps)) : null,
    inbound: {
      matched: comps.filter((c) => c.inbound === 'matched').length,
      movedDayIn: comps.filter((c) => c.inbound === 'moved-day').length,
      movedTechIn: comps.filter((c) => c.inbound === 'moved-tech').length,
      offMap: comps.filter((c) => c.inbound === 'off-map').length,
    },
    stampDerived: sd ? { spanMin: r1(sd.span), serviceMin: r1(sd.service), driveMin: r1(sd.drive), doubleTaps: sd.doubleTaps, zips: sd.zips } : null,
  };
}

for (const [k, rd] of routeDays) {
  const pStops = plannedByRD.get(k) || [];
  const aStops = actualByRD.get(k) || [];
  rd.outcomes = {
    plannedStops: pStops.length,
    matched: pStops.filter((p) => p.outcome === 'matched').length,
    movedDay: pStops.filter((p) => p.outcome === 'moved-day').length,
    movedTech: pStops.filter((p) => p.outcome === 'moved-tech').length,
    ghost: pStops.filter((p) => p.outcome === 'ghost').length,
    offMap: aStops.filter((a) => a.inbound === 'off-map').length,
    movedDayIn: aStops.filter((a) => a.inbound === 'moved-day').length,
    movedTechIn: aStops.filter((a) => a.inbound === 'moved-tech').length,
  };
  rd.arrivalDelta = stats(pStops.filter((p) => p.outcome === 'matched' && Number.isFinite(p.deltaVsPlannedDeparture)).map((p) => p.deltaVsPlannedDeparture));
  if (rd.planned && rd.actual) {
    rd.spanDeltaMin = r1(rd.actual.spanMin - rd.planned.spanMin);
    rd.startDeltaMin = r1(rd.actual.firstStampMin - rd.planned.firstArrivalMin);
    rd.endDeltaMin = r1(rd.actual.lastStampMin - rd.planned.lastDepartureMin);
  }
  const zipOf = (addr) => { const m = (addr || '').match(/\b98\d{3}\b/); return m ? m[0] : null; };
  rd.stops = pStops.map((p) => ({
    orderNo: p.orderNo, stopNumber: p.stopNumber, name: p.locationName, zip: zipOf(p.address),
    outcome: p.outcome,
    plannedArrival: hhmm(p.arrivalMinutes), plannedDeparture: hhmm(p.departureMinutes),
    serviceMin: p.serviceMinutes,
    actualStamp: p.actualStampMinutes != null ? hhmm(p.actualStampMinutes) : null,
    actualDate: p.actualDate || null, actualTech: p.actualTech || null,
    dayShift: p.dayShift != null ? p.dayShift : null,
    deltaVsPlannedArrivalMin: r1(p.deltaVsPlannedArrival),
    deltaVsPlannedDepartureMin: r1(p.deltaVsPlannedDeparture),
    eveningStamp: p.eveningStamp != null ? p.eveningStamp : null,
  })).concat(aStops.filter((a) => a.inbound !== 'matched').map((a) => ({
    orderNo: a.orderNo, stopNumber: null, name: a.title, zip: a.zip || null,
    outcome: a.inbound === 'off-map' ? 'off-map' : (a.inbound === 'moved-day' ? 'moved-day-in' : 'moved-tech-in'),
    plannedArrival: null, plannedDeparture: null, serviceMin: null,
    actualStamp: hhmm(a.stampMinutes), actualDate: a.date, actualTech: a.tech,
    plannedDates: a.plannedDates || null, plannedDrivers: a.plannedDrivers || null,
    deltaVsPlannedArrivalMin: null, deltaVsPlannedDepartureMin: null,
    eveningStamp: a.stampMinutes > EVENING_CUTOFF_MIN,
  })));
}

const routeDayList = [...routeDays.values()].sort((a, b) => (a.date === b.date ? a.driver.localeCompare(b.driver) : a.date.localeCompare(b.date)));

// ---------- reason heuristic for span overruns ----------

function reasonFor(rd) {
  const r = [];
  if (rd.startDeltaMin != null && rd.startDeltaMin > 45) r.push('late start +' + Math.round(rd.startDeltaMin) + 'm vs plan');
  if (rd.actual && rd.actual.eveningStamps) r.push(rd.actual.eveningStamps + ' evening stamp' + (rd.actual.eveningStamps > 1 ? 's' : '') + ' after 18:30 (admin)');
  const extra = (rd.outcomes.offMap || 0) + (rd.outcomes.movedDayIn || 0) + (rd.outcomes.movedTechIn || 0);
  if (extra >= 3) r.push(extra + ' unplanned stops worked');
  if (rd.actual && rd.actual.maxGapMin != null && rd.actual.maxGapMin > 75) r.push(Math.round(rd.actual.maxGapMin) + 'm gap between stamps');
  if (rd.outcomes.ghost >= 3) r.push(rd.outcomes.ghost + ' planned stops never completed');
  if (rd.outcomes.movedDay >= 5) r.push(rd.outcomes.movedDay + ' planned stops slid to another day');
  if (!r.length) r.push('steady day, work simply ran longer than the plan allowed');
  return r.join('; ');
}
for (const rd of routeDayList) if (rd.spanDeltaMin != null) rd.reason = reasonFor(rd);

// ---------- weekly rollup ----------

const weeks = [...new Set(routeDayList.map((rd) => rd.week))].sort();
const weekly = weeks.map((w) => {
  const days = routeDayList.filter((rd) => rd.week === w);
  const sum = (f) => days.reduce((a, rd) => a + (f(rd) || 0), 0);
  const p = sum((rd) => rd.outcomes.plannedStops);
  const m = sum((rd) => rd.outcomes.matched);
  const md = sum((rd) => rd.outcomes.movedDay);
  const mt = sum((rd) => rd.outcomes.movedTech);
  const g = sum((rd) => rd.outcomes.ghost);
  const deltas = days.flatMap((rd) => rd.stops.filter((s) => s.outcome === 'matched' && Number.isFinite(s.deltaVsPlannedDepartureMin)).map((s) => s.deltaVsPlannedDepartureMin));
  return {
    week: w,
    routeDays: days.length,
    plannedStops: p,
    matched: m, matchedPct: p ? r1((100 * m) / p) : null,
    movedDay: md, movedDayPct: p ? r1((100 * md) / p) : null,
    movedTech: mt, movedTechPct: p ? r1((100 * mt) / p) : null,
    ghost: g, ghostPct: p ? r1((100 * g) / p) : null,
    offMap: sum((rd) => rd.outcomes.offMap),
    movedDayIn: sum((rd) => rd.outcomes.movedDayIn),
    completedStops: sum((rd) => (rd.actual ? rd.actual.stops : 0)),
    eveningStamps: sum((rd) => (rd.actual ? rd.actual.eveningStamps : 0)),
    plannedSpanMin: r1(sum((rd) => (rd.planned ? rd.planned.spanMin : 0))),
    actualSpanMin: r1(sum((rd) => (rd.actual ? rd.actual.spanMin : 0))),
    plannedDriveMin: r1(sum((rd) => (rd.planned ? rd.planned.driveMin : 0))),
    stampDriveMin: r1(sum((rd) => (rd.actual && rd.actual.stampDerived ? rd.actual.stampDerived.driveMin : 0))),
    arrivalDelta: stats(deltas),
  };
});

// ---------- per-driver rollup ----------

const drivers = [...new Set(routeDayList.map((rd) => rd.driver))].sort();
const perDriver = drivers.map((d) => {
  const days = routeDayList.filter((rd) => rd.driver === d);
  const deltas = days.flatMap((rd) => rd.stops.filter((s) => s.outcome === 'matched' && Number.isFinite(s.deltaVsPlannedDepartureMin)).map((s) => s.deltaVsPlannedDepartureMin));
  const vsArrival = days.flatMap((rd) => rd.stops.filter((s) => s.outcome === 'matched' && Number.isFinite(s.deltaVsPlannedArrivalMin)).map((s) => s.deltaVsPlannedArrivalMin));
  const sum = (f) => days.reduce((a, rd) => a + (f(rd) || 0), 0);
  const p = sum((rd) => rd.outcomes.plannedStops);
  return {
    driver: d,
    routeDays: days.length,
    plannedStops: p,
    matchedPct: p ? r1((100 * sum((rd) => rd.outcomes.matched)) / p) : null,
    movedDayPct: p ? r1((100 * sum((rd) => rd.outcomes.movedDay)) / p) : null,
    movedTechPct: p ? r1((100 * sum((rd) => rd.outcomes.movedTech)) / p) : null,
    ghost: sum((rd) => rd.outcomes.ghost),
    offMap: sum((rd) => rd.outcomes.offMap),
    eveningStamps: sum((rd) => (rd.actual ? rd.actual.eveningStamps : 0)),
    arrivalDeltaVsDeparture: stats(deltas),
    arrivalDeltaVsArrival: stats(vsArrival),
    spanDelta: stats(days.filter((rd) => rd.spanDeltaMin != null).map((rd) => rd.spanDeltaMin)),
    startDelta: stats(days.filter((rd) => rd.startDeltaMin != null).map((rd) => rd.startDeltaMin)),
  };
});

// ---------- window totals ----------

const total = {
  plannedStops: planned.length,
  matched: planned.filter((p) => p.outcome === 'matched').length,
  movedDay: planned.filter((p) => p.outcome === 'moved-day').length,
  movedTech: planned.filter((p) => p.outcome === 'moved-tech').length,
  ghost: planned.filter((p) => p.outcome === 'ghost').length,
  completions: actual.length,
  offMap: actual.filter((a) => a.inbound === 'off-map').length,
  eveningStamps: actual.filter((a) => a.stampMinutes > EVENING_CUTOFF_MIN).length,
  routeDaysPlanned: plannedByRD.size,
  routeDaysActual: actualByRD.size,
  routeDaysBoth: routeDayList.filter((rd) => rd.planned && rd.actual).length,
  routeDaysPlanOnly: routeDayList.filter((rd) => rd.planned && !rd.actual).length,
  routeDaysActualOnly: routeDayList.filter((rd) => !rd.planned && rd.actual).length,
};
total.matchedPct = r1((100 * total.matched) / total.plannedStops);
total.arrivalDeltaVsDeparture = stats(planned.filter((p) => p.outcome === 'matched' && Number.isFinite(p.deltaVsPlannedDeparture)).map((p) => p.deltaVsPlannedDeparture));
total.arrivalDeltaVsArrival = stats(planned.filter((p) => p.outcome === 'matched' && Number.isFinite(p.deltaVsPlannedArrival)).map((p) => p.deltaVsPlannedArrival));

const worst = routeDayList.filter((rd) => rd.spanDeltaMin != null)
  .sort((a, b) => b.spanDeltaMin - a.spanDeltaMin).slice(0, 10)
  .map((rd) => ({
    date: rd.date, dow: rd.dow, driver: rd.driver,
    plannedSpanMin: rd.planned.spanMin, actualSpanMin: rd.actual.spanMin, spanDeltaMin: rd.spanDeltaMin,
    plannedStops: rd.outcomes.plannedStops, completedStops: rd.actual.stops,
    plannedFirst: rd.planned.firstArrival, actualFirst: rd.actual.firstStamp,
    plannedLast: rd.planned.lastDeparture, actualLast: rd.actual.lastStamp,
    eveningStamps: rd.actual.eveningStamps, maxGapMin: rd.actual.maxGapMin,
    offMap: rd.outcomes.offMap, movedDayIn: rd.outcomes.movedDayIn, movedTechIn: rd.outcomes.movedTechIn,
    ghost: rd.outcomes.ghost, movedDay: rd.outcomes.movedDay,
    reason: rd.reason,
  }));

const shiftHist = {};
for (const p of planned) if (p.outcome === 'moved-day' && Number.isFinite(p.dayShift)) shiftHist[p.dayShift] = (shiftHist[p.dayShift] || 0) + 1;

const out = {
  generatedAt: new Date().toISOString(),
  window: { from: '2026-08-17', to: '2026-09-17', tz: TZ, eveningCutoff: '18:30' },
  sources: {
    plan: path.relative(REDESIGN, ROUTES_DIR).replace(/\\/g, '/'),
    actual: path.relative(REDESIGN, COMPLETED).replace(/\\/g, '/'),
    stampDerived: path.relative(REDESIGN, DAYDRIVE).replace(/\\/g, '/'),
  },
  joinKey: {
    form: '<jobNumber>-<visitNumericId>, numeric id = tail of base64-decoded Jobber visit gid',
    plannedOrdersDistinct: plannedByKey.size,
    plannedOrdersOnTwoDays: dupPlanned,
    resolveRatePct: r1((100 * planned.filter((p) => p.outcome !== 'ghost').length) / planned.length),
  },
  definitions: {
    matched: 'planned stop with a completion stamp the same day by the same tech',
    movedDay: 'planned stop whose completion landed on a different date',
    movedTech: 'planned stop completed the same day by a different tech',
    ghost: 'planned stop with no completion anywhere in the window',
    offMap: 'completion with no planned stop on any day in the window',
    movedDayIn_movedTechIn: 'completion on this route-day that was planned elsewhere; the mirror of movedDay / movedTech',
    arrivalDelta: 'actual stamp minus planned departure (planned arrival + service); a stamp is a completion, so this is the like-for-like comparison',
    plannedDrive: 'sum of inter-stop legs; the first stop inbound leg is excluded because it comes from an unknown origin',
  },
  total,
  movedDayShiftHistogram: shiftHist,
  weekly,
  perDriver,
  worstRouteDays: worst,
  routeDays: routeDayList,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('\n[write] ' + OUT + '  (' + (fs.statSync(OUT).size / 1024 / 1024).toFixed(2) + ' MB)');

// ---------- console report ----------

console.log('\n=== WINDOW TOTALS ===');
console.log(JSON.stringify(total, null, 1));

console.log('\n=== WEEKLY ===');
for (const w of weekly) {
  console.log(w.week + '  rdays ' + String(w.routeDays).padStart(2) + '  planned ' + String(w.plannedStops).padStart(4)
    + '  matched ' + String(w.matchedPct).padStart(5) + '%  movedDay ' + String(w.movedDayPct).padStart(4)
    + '%  movedTech ' + String(w.movedTechPct).padStart(4) + '%  ghost ' + String(w.ghost).padStart(3)
    + '  offMap ' + String(w.offMap).padStart(3) + '  movedDayIn ' + String(w.movedDayIn).padStart(3)
    + '  completed ' + String(w.completedStops).padStart(4) + '  evening ' + String(w.eveningStamps).padStart(3)
    + '  delta med ' + w.arrivalDelta.median + ' p90 ' + w.arrivalDelta.p90);
}

console.log('\n=== PER DRIVER ===');
for (const d of perDriver) {
  console.log(d.driver.padEnd(16) + ' rdays ' + String(d.routeDays).padStart(2) + '  planned ' + String(d.plannedStops).padStart(4)
    + '  matched ' + String(d.matchedPct).padStart(5) + '%  delta-vs-departure med ' + String(d.arrivalDeltaVsDeparture.median).padStart(7)
    + ' p90 ' + String(d.arrivalDeltaVsDeparture.p90).padStart(7) + '  delta-vs-arrival med ' + String(d.arrivalDeltaVsArrival.median).padStart(7)
    + '  spanDelta med ' + d.spanDelta.median + '  startDelta med ' + d.startDelta.median + '  evening ' + d.eveningStamps);
}

console.log('\n=== GOLDEN WEEKS 2026-08-24 / 2026-08-31 ===');
for (const rd of routeDayList.filter((r) => r.week === '2026-08-24' || r.week === '2026-08-31')) {
  if (!rd.planned || !rd.actual) {
    console.log(rd.date + ' ' + rd.driver.padEnd(16) + (rd.planned ? ' PLAN ONLY, no completions' : ' ACTUAL ONLY, no plan') + ' stops ' + (rd.planned ? rd.planned.stops : rd.actual.stops));
    continue;
  }
  console.log(rd.date + ' ' + rd.dow + ' ' + rd.driver.padEnd(16)
    + ' stops ' + String(rd.outcomes.plannedStops).padStart(2) + '/' + String(rd.actual.stops).padStart(2)
    + '  span ' + String(rd.planned.spanMin).padStart(6) + '/' + String(rd.actual.spanMin).padStart(6)
    + ' (' + (rd.spanDeltaMin > 0 ? '+' : '') + rd.spanDeltaMin + ')'
    + '  drive plan ' + String(rd.planned.driveMin).padStart(5) + ' stamp ' + String(rd.actual.stampDerived ? rd.actual.stampDerived.driveMin : 'n/a').padStart(6)
    + '  svc ' + rd.planned.serviceMin + '/' + (rd.actual.stampDerived ? rd.actual.stampDerived.serviceMin : 'n/a')
    + '  m/md/mt/gh ' + rd.outcomes.matched + '/' + rd.outcomes.movedDay + '/' + rd.outcomes.movedTech + '/' + rd.outcomes.ghost
    + '  in off/md/mt ' + rd.outcomes.offMap + '/' + rd.outcomes.movedDayIn + '/' + rd.outcomes.movedTechIn
    + '  eve ' + rd.actual.eveningStamps);
}

console.log('\n=== WORST 10 ROUTE-DAYS BY SPAN OVERRUN ===');
for (const w of worst) {
  console.log(w.date + ' ' + w.driver.padEnd(16) + ' plan ' + String(w.plannedSpanMin).padStart(6) + ' actual ' + String(w.actualSpanMin).padStart(6)
    + ' (+' + w.spanDeltaMin + ')  ' + w.plannedFirst + '->' + w.actualFirst + ' / ' + w.plannedLast + '->' + w.actualLast
    + '  stops ' + w.plannedStops + '/' + w.completedStops + '  :: ' + w.reason);
}

console.log('\n=== MOVED-DAY SHIFT HISTOGRAM (days, negative = done early) ===');
console.log(JSON.stringify(shiftHist));
console.log('\n[done]');
