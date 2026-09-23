#!/usr/bin/env node
/**
 * S2b - join Gusto paid hours to planned and stamped route-days.
 *
 * Inputs
 *   private/gusto/paid-hours.json              (gitignored; hours only, never pay)
 *   data/plan-vs-actual.json                   (planned vs stamped per route-day + join classes)
 *   ../data/route-day-drive_<from>_<to>.json   (stamp-derived span/service/drive)
 *   data/optimo-routes/_index.json             (planned stop counts per date per driver)
 *
 * Output
 *   data/route-day-ledger.json                 (hours per tech per day - no pay, safe to track)
 *
 * Usage: node scripts/join-paid-hours.mjs > data/join-paid-hours.log 2>&1
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REDESIGN = path.resolve(__dirname, '..');
const ENGINE = path.resolve(REDESIGN, '..');

const PATHS = {
  gusto: path.join(REDESIGN, 'private', 'gusto', 'paid-hours.json'),
  pva: path.join(REDESIGN, 'data', 'plan-vs-actual.json'),
  drive: path.join(ENGINE, 'data', 'route-day-drive_2026-08-17_2026-09-17.json'),
  optimo: path.join(REDESIGN, 'data', 'optimo-routes', '_index.json'),
  out: path.join(REDESIGN, 'data', 'route-day-ledger.json'),
};

// Techs who clock in. Cory Ventura is salaried and never clocks in - he has no
// Gusto rows by design. That is not missing data.
const SALARIED = new Set(['Cory Ventura']);

// Company holidays inside the window. A holiday reads as 0 paid hours on a
// weekday, which is exactly the ABSENT shape, so it has to be named or every
// tech shows as absent on Labor Day.
const HOLIDAYS = { '2026-09-07': 'Labor Day' };

// Thresholds
const GREEN_MAX_H = 8.5;
const AMBER_MAX_H = 10;
const RED_OT_H = 1.5;
const WEEK_OT_H = 2;
// A day counts as COVER when the tech worked stops that were planned under
// another tech: either the whole day was someone else's (nothing planned for
// this tech) or a material share of the day came in from another tech.
const COVER_MIN_STOPS = 3;
const COVER_MIN_SHARE = 0.2;

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const r2 = (n) => (n == null || Number.isNaN(n) ? null : Math.round(n * 100) / 100);
const r1 = (n) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10) / 10);

function mondayOf(dateStr) {
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
const isWeekday = (dateStr) => !['sat', 'sun'].includes(dowOf(dateStr));

// "8:04 AM" / "4:25 PM" -> minutes past midnight (Pacific, as Gusto reports it)
function clockToMin(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}
// "08:04" -> minutes
function hhmmToMin(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
function minToClock(min) {
  if (min == null) return null;
  const h = Math.floor(min / 60);
  const mm = Math.round(min % 60);
  return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
function dist(values) {
  const v = values.filter((x) => x != null && !Number.isNaN(x)).sort((a, b) => a - b);
  if (!v.length) return { n: 0, median: null, p10: null, p90: null, min: null, max: null };
  return {
    n: v.length,
    median: r1(quantile(v, 0.5)),
    p10: r1(quantile(v, 0.1)),
    p90: r1(quantile(v, 0.9)),
    min: r1(v[0]),
    max: r1(v[v.length - 1]),
  };
}

// ---------------------------------------------------------------- load
const gusto = read(PATHS.gusto);
const pva = read(PATHS.pva);
const drive = read(PATHS.drive);
const optimo = read(PATHS.optimo);

console.log('S2b join-paid-hours');
console.log('  gusto   :', gusto.source, '|', gusto.rows.length, 'rows');
console.log('  pva     :', pva.routeDays.length, 'route-days', JSON.stringify(pva.window));
console.log('  drive   :', drive.routeDays.length, 'route-days', drive.from, '->', drive.to);
console.log('  optimo  :', optimo.dates.length, 'planned dates', JSON.stringify(optimo.range));

const key = (tech, date) => tech + '|' + date;

// paid hours
const paidBy = new Map();
for (const r of gusto.rows) paidBy.set(key(r.tech, r.date), r);
const gustoTechs = [...new Set(gusto.rows.map((r) => r.tech))].sort();

// planned stops from OptimoRoute
const plannedBy = new Map();
for (const d of optimo.dates) {
  for (const drv of d.drivers || []) {
    plannedBy.set(key(drv.driver, d.date), {
      stops: drv.stops,
      routeDistanceKm: drv.routeDistanceKm,
      routeDurationMin: drv.routeDurationMin,
    });
  }
}

// plan-vs-actual route-days
const pvaBy = new Map();
for (const rd of pva.routeDays) pvaBy.set(key(rd.driver, rd.date), rd);

// stamp-derived drive/service
const driveBy = new Map();
for (const rd of drive.routeDays) driveBy.set(key(rd.tech, rd.day), rd);

// Which tech a covering tech took stops FROM. Per-stop outcomes are hyphenated
// ('moved-tech-in'), and the covering tech's own route-day already carries
// plannedDrivers on each inbound stop, so read it straight off that side.
const coverFrom = new Map(); // `tech|date` -> Map(plannedTech -> count)
for (const rd of pva.routeDays) {
  for (const s of rd.stops || []) {
    if (s.outcome !== 'moved-tech-in') continue;
    const k = key(rd.driver, rd.date);
    if (!coverFrom.has(k)) coverFrom.set(k, new Map());
    const m = coverFrom.get(k);
    for (const from of s.plannedDrivers || ['unknown']) m.set(from, (m.get(from) || 0) + 1);
  }
}

// ---------------------------------------------------------------- build days
const allTechs = [...new Set([...gustoTechs, ...pva.routeDays.map((r) => r.driver)])].sort();
const allDates = [...new Set([
  ...gusto.rows.map((r) => r.date),
  ...pva.routeDays.map((r) => r.date),
  ...optimo.dates.map((d) => d.date),
])].sort();

const days = [];
for (const tech of allTechs) {
  for (const date of allDates) {
    const k = key(tech, date);
    const paid = paidBy.get(k) || null;
    const planned = plannedBy.get(k) || null;
    const rd = pvaBy.get(k) || null;
    const dr = driveBy.get(k) || null;
    const salaried = SALARIED.has(tech);

    const hasWork = !!(planned || rd || dr);
    const hasPaidRow = !!paid;
    if (salaried && !hasWork) continue;
    if (!salaried && !hasPaidRow && !hasWork) continue;
    // drop weekend rows that are pure zeros with no work
    if (!hasWork && paid && !paid.totalHours && !isWeekday(date)) continue;

    const paidHours = salaried ? null : paid ? paid.totalHours : null;
    const otHours = salaried ? null : paid ? paid.overtime || 0 : null;
    const clockInMin = paid ? clockToMin(paid.clockIn) : null;
    const clockOutMin = paid ? clockToMin(paid.clockOut) : null;

    const rdPlan = rd && rd.planned ? rd.planned : null;
    const rdAct = rd && rd.actual ? rd.actual : null;

    const plannedStops = planned ? planned.stops : rdPlan && rdPlan.stops != null ? rdPlan.stops : rd ? 0 : null;
    const plannedSpanH = rdPlan && rdPlan.spanMin != null ? rdPlan.spanMin / 60 : null;
    const plannedDriveH = rdPlan && rdPlan.driveInclInboundMin != null ? rdPlan.driveInclInboundMin / 60 : null;
    const plannedServiceH = rdPlan && rdPlan.serviceMin != null ? rdPlan.serviceMin / 60 : null;

    const stampedStops = rdAct && rdAct.stops != null ? rdAct.stops : dr ? dr.stops : null;
    const firstStampMin = rdAct ? hhmmToMin(rdAct.firstStamp) : dr ? hhmmToMin(dr.first) : null;
    const lastStampMin = rdAct ? hhmmToMin(rdAct.lastStamp) : dr ? hhmmToMin(dr.last) : null;
    const stampedSpanH = rdAct && rdAct.spanMin != null ? rdAct.spanMin / 60 : dr ? dr.span / 60 : null;
    const stampDriveH = dr ? dr.drive / 60 : rdAct && rdAct.stampDerived ? rdAct.stampDerived.driveMin / 60 : null;
    const stampServiceH = dr ? dr.service / 60 : rdAct && rdAct.stampDerived ? rdAct.stampDerived.serviceMin / 60 : null;

    // cover
    const mtIn = rd && rd.outcomes ? rd.outcomes.movedTechIn || 0 : 0;
    const fromMap = coverFrom.get(k) || new Map();
    const shareBase = stampedStops || 0;
    const isCover = mtIn > 0 && (
      !plannedStops ||
      mtIn >= COVER_MIN_STOPS ||
      (shareBase > 0 && mtIn / shareBase >= COVER_MIN_SHARE)
    );

    // hours label - always computed where hours exist, so a COVER day still
    // shows whether it was a long day
    const holiday = HOLIDAYS[date] || null;
    let hoursLabel;
    if (salaried) hoursLabel = 'NO_CLOCK';
    else if (paidHours == null) hoursLabel = 'NO_ROW';
    else if (paidHours === 0) hoursLabel = holiday ? 'HOLIDAY' : isWeekday(date) ? 'ABSENT' : 'OFF';
    else if (paidHours > AMBER_MAX_H || (otHours || 0) >= RED_OT_H) hoursLabel = 'RED';
    else if (paidHours > GREEN_MAX_H) hoursLabel = 'AMBER';
    else hoursLabel = 'GREEN';

    // Gusto books overtime on the day the 40 h weekly line is crossed, so a
    // normal-length Friday can be 100% overtime. Record which test fired, or a
    // short day flagged only by spillover reads as a long day.
    let redCause = null;
    if (hoursLabel === 'RED') {
      const bySpan = paidHours > AMBER_MAX_H;
      const byOt = (otHours || 0) >= RED_OT_H;
      redCause = bySpan && byOt ? 'span+overtime' : bySpan ? 'span' : 'overtime';
    }
    const otIsWeeklySpillover = !salaried && paid && (otHours || 0) > 0 && paid.regularHours === 0;

    let label = hoursLabel;
    if (isCover) label = 'COVER';
    if (hoursLabel === 'ABSENT' || hoursLabel === 'HOLIDAY') label = hoursLabel;

    days.push({
      tech,
      date,
      dow: dowOf(date),
      week: mondayOf(date),
      weekday: isWeekday(date),
      holiday,
      outsidePlanWindow: date > pva.window.to,
      salaried,
      label,
      hoursLabel,
      redCause,
      otIsWeeklySpillover,
      paid: {
        hours: r2(paidHours),
        regularHours: salaried || !paid ? null : r2(paid.regularHours),
        overtimeHours: r2(otHours),
        clockIn: paid ? paid.clockIn || null : null,
        clockOut: paid ? paid.clockOut || null : null,
        clockInMin,
        clockOutMin,
        breaks: paid ? paid.breaks || [] : [],
        note: paid && paid.note ? paid.note : null,
        status: paid ? paid.status || null : null,
      },
      planned: {
        stops: plannedStops,
        spanH: r2(plannedSpanH),
        driveH: r2(plannedDriveH),
        serviceH: r2(plannedServiceH),
        routeDurationH: planned ? r2(planned.routeDurationMin / 60) : null,
        distanceKm: planned ? r1(planned.routeDistanceKm) : null,
      },
      stamped: {
        stops: stampedStops,
        first: minToClock(firstStampMin),
        last: minToClock(lastStampMin),
        spanH: r2(stampedSpanH),
        driveH: r2(stampDriveH),
        serviceH: r2(stampServiceH),
        // Stamps after 18:30. A tech closing jobs out in the app at 21:00
        // inflates the stamped span and breaks the last-stamp-to-clock-out gap,
        // so these days are excluded from the commute-gap medians.
        eveningStamps: rdAct && rdAct.eveningStamps != null ? rdAct.eveningStamps : null,
      },
      deltas: {
        paidMinusPlannedSpanH: paidHours && plannedSpanH != null ? r2(paidHours - plannedSpanH) : null,
        paidMinusStampedSpanH: paidHours && stampedSpanH != null ? r2(paidHours - stampedSpanH) : null,
        clockInToFirstStampMin: clockInMin != null && firstStampMin != null ? r1(firstStampMin - clockInMin) : null,
        lastStampToClockOutMin: clockOutMin != null && lastStampMin != null ? r1(clockOutMin - lastStampMin) : null,
        stopsPerPaidHour: paidHours ? r2((stampedStops || 0) / paidHours) : null,
      },
      cover: {
        isCover,
        stopsInFromOtherTech: mtIn,
        from: [...fromMap.entries()].map(([t, n]) => ({ tech: t, stops: n })).sort((a, b) => b.stops - a.stops),
        stopsOutToOtherTech: rd && rd.outcomes ? rd.outcomes.movedTech || 0 : 0,
      },
      reason: rd ? rd.reason || null : null,
    });
  }
}
days.sort((a, b) => (a.date === b.date ? a.tech.localeCompare(b.tech) : a.date.localeCompare(b.date)));
console.log('  ledger  :', days.length, 'tech-days for', allTechs.length, 'techs');

// ---------------------------------------------------------------- weekly
const weeksSet = [...new Set(days.map((d) => d.week))].sort();
const weekly = [];
for (const tech of allTechs) {
  for (const week of weeksSet) {
    const rows = days.filter((d) => d.tech === tech && d.week === week);
    if (!rows.length) continue;
    const salaried = SALARIED.has(tech);
    const paidH = rows.reduce((s, d) => s + (d.paid.hours || 0), 0);
    const otH = rows.reduce((s, d) => s + (d.paid.overtimeHours || 0), 0);
    const count = (l) => rows.filter((d) => d.hoursLabel === l).length;
    const red = count('RED');
    const amber = count('AMBER');
    const green = count('GREEN');
    const absent = rows.filter((d) => d.label === 'ABSENT').length;
    const holidays = rows.filter((d) => d.label === 'HOLIDAY').length;
    const cover = rows.filter((d) => d.cover.isCover).length;
    const redSpan = rows.filter((d) => d.redCause && d.redCause.includes('span')).length;
    // The plan window ends before the Gusto window, so the last week has paid
    // days with no plan. Compare paid against plan only on days both cover.
    const inWin = rows.filter((d) => !d.outsidePlanWindow);
    const paidHInWindow = inWin.reduce((s, d) => s + (d.paid.hours || 0), 0);
    const otHInWindow = inWin.reduce((s, d) => s + (d.paid.overtimeHours || 0), 0);
    const outOfWindowDays = rows.length - inWin.length;
    const plannedH = rows.reduce((s, d) => s + (d.planned.spanH || 0), 0);
    const stampedH = rows.reduce((s, d) => s + (d.stamped.spanH || 0), 0);
    const plannedStops = rows.reduce((s, d) => s + (d.planned.stops || 0), 0);
    const stampedStops = rows.reduce((s, d) => s + (d.stamped.stops || 0), 0);
    const fieldDays = rows.filter((d) => (d.stamped.stops || 0) > 0).length;

    let weekLabel;
    let reason;
    if (salaried) {
      weekLabel = 'NO_CLOCK';
      reason = 'salaried - no time clock, hours cannot be labelled';
    } else if (red === 0 && otH < WEEK_OT_H) {
      weekLabel = 'SUCCESSFUL';
      reason = 'no RED days, ' + r2(otH) + ' h overtime';
    } else {
      weekLabel = 'UNSUCCESSFUL';
      const bits = [];
      if (red) bits.push(red + ' RED day' + (red > 1 ? 's' : '') + ' (' + rows.filter((d) => d.hoursLabel === 'RED').map((d) => d.date.slice(5) + ' ' + d.redCause).join(', ') + ')');
      if (otH >= WEEK_OT_H) bits.push(r2(otH) + ' h overtime, i.e. the week passed 40 h');
      reason = bits.join('; ');
    }

    weekly.push({
      tech, week, salaried, weekLabel, reason,
      paidHours: salaried ? null : r2(paidH),
      overtimeHours: salaried ? null : r2(otH),
      paidHoursInPlanWindow: salaried ? null : r2(paidHInWindow),
      overtimeHoursInPlanWindow: salaried ? null : r2(otHInWindow),
      outOfWindowDays,
      fieldDays,
      green, amber, red, redSpan, absent, holidays, cover,
      plannedSpanH: r2(plannedH),
      stampedSpanH: r2(stampedH),
      plannedStops, stampedStops,
      paidMinusPlannedSpanH: salaried ? null : r2(paidHInWindow - plannedH),
      paidMinusStampedSpanH: salaried ? null : r2(paidHInWindow - stampedH),
      stopsPerPaidHour: salaried || !paidH ? null : r2(stampedStops / paidH),
    });
  }
}

// ---------------------------------------------------------------- per-tech distributions
const perTech = allTechs.map((tech) => {
  const rows = days.filter((d) => d.tech === tech && (d.stamped.stops || 0) > 0);
  const paidRows = rows.filter((d) => d.paid.hours);
  const cleanRows = paidRows.filter((d) => !d.stamped.eveningStamps);
  const salaried = SALARIED.has(tech);
  return {
    tech, salaried,
    fieldDays: rows.length,
    paidHours: salaried ? null : r2(paidRows.reduce((s, d) => s + d.paid.hours, 0)),
    overtimeHours: salaried ? null : r2(paidRows.reduce((s, d) => s + (d.paid.overtimeHours || 0), 0)),
    red: rows.filter((d) => d.hoursLabel === 'RED').length,
    amber: rows.filter((d) => d.hoursLabel === 'AMBER').length,
    green: rows.filter((d) => d.hoursLabel === 'GREEN').length,
    absentWeekdays: days.filter((d) => d.tech === tech && d.label === 'ABSENT').length,
    coverDays: rows.filter((d) => d.cover.isCover).length,
    paidMinusPlannedSpanH: dist(paidRows.map((d) => d.deltas.paidMinusPlannedSpanH)),
    paidMinusStampedSpanH: dist(paidRows.map((d) => d.deltas.paidMinusStampedSpanH)),
    clockInToFirstStampMin: dist(paidRows.map((d) => d.deltas.clockInToFirstStampMin)),
    lastStampToClockOutMin: dist(paidRows.map((d) => d.deltas.lastStampToClockOutMin)),
    // same two gaps on days with no post-18:30 stamping
    cleanDays: cleanRows.length,
    clockInToFirstStampMinClean: dist(cleanRows.map((d) => d.deltas.clockInToFirstStampMin)),
    lastStampToClockOutMinClean: dist(cleanRows.map((d) => d.deltas.lastStampToClockOutMin)),
    paidMinusStampedSpanHClean: dist(cleanRows.map((d) => d.deltas.paidMinusStampedSpanH)),
    paidH: dist(paidRows.map((d) => d.paid.hours)),
    stampedSpanH: dist(rows.map((d) => d.stamped.spanH)),
    plannedSpanH: dist(rows.map((d) => d.planned.spanH)),
    stopsPerPaidHour: dist(paidRows.map((d) => d.deltas.stopsPerPaidHour)),
  };
});

const redDays = days
  .filter((d) => d.hoursLabel === 'RED')
  .map((d) => ({
    tech: d.tech, date: d.date, dow: d.dow,
    redCause: d.redCause, otIsWeeklySpillover: d.otIsWeeklySpillover,
    outsidePlanWindow: d.outsidePlanWindow,
    paidHours: d.paid.hours, overtimeHours: d.paid.overtimeHours,
    clockIn: d.paid.clockIn, clockOut: d.paid.clockOut,
    plannedStops: d.planned.stops, stampedStops: d.stamped.stops,
    plannedSpanH: d.planned.spanH, stampedSpanH: d.stamped.spanH,
    paidMinusPlannedSpanH: d.deltas.paidMinusPlannedSpanH,
    note: d.paid.note, reason: d.reason, isCover: d.cover.isCover,
  }))
  .sort((a, b) => b.paidHours - a.paidHours);

const absentDays = days.filter((d) => d.label === 'ABSENT').map((d) => ({
  tech: d.tech, date: d.date, dow: d.dow, note: d.paid.note,
  plannedStops: d.planned.stops, stampedStops: d.stamped.stops,
}));

const coverDays = days.filter((d) => d.cover.isCover).map((d) => ({
  tech: d.tech, date: d.date, dow: d.dow,
  plannedStops: d.planned.stops, stampedStops: d.stamped.stops,
  stopsInFromOtherTech: d.cover.stopsInFromOtherTech, from: d.cover.from,
  paidHours: d.paid.hours, salaried: d.salaried,
}));

const out = {
  generatedAt: new Date().toISOString(),
  stage: 'S2b',
  window: { from: allDates[0], to: allDates[allDates.length - 1], tz: 'America/Los_Angeles' },
  sources: {
    gusto: { file: 'private/gusto/paid-hours.json (gitignored)', source: gusto.source, rows: gusto.rows.length },
    planVsActual: 'data/plan-vs-actual.json',
    routeDayDrive: '../data/route-day-drive_2026-08-17_2026-09-17.json',
    optimoIndex: 'data/optimo-routes/_index.json',
  },
  notes: [
    'Hours only. This file records paid HOURS per tech per day and never pay, rate or dollar amounts.',
    'Cory Ventura is salaried and does not clock in, so he has no Gusto rows. His route-days appear with paid hours null and label NO_CLOCK - by design, not missing data.',
    'Planned span comes from the OptimoRoute plan and excludes the inbound leg from tech home to stop 1, so paid-minus-planned span includes that commute.',
    'The plan window ends 2026-09-17; Gusto runs to 2026-09-20, so 09-18..09-20 carry paid hours with no plan to compare against.',
    'The week of 2026-09-07 is a 4-day week (Labor Day, Monday 09-07). All four hourly techs show 0 paid hours that day; they are labelled HOLIDAY, not ABSENT.',
    'Gusto books overtime against the day the 40 h weekly line is crossed, so a normal-length Friday can be recorded as 100% overtime with 0 regular hours. redCause says which test fired and otIsWeeklySpillover marks days whose overtime is purely that accumulator. Overtime is therefore a WEEKLY signal, not a long-day signal.',
  ],
  thresholds: {
    GREEN: 'paid <= ' + GREEN_MAX_H + ' h and overtime < ' + RED_OT_H + ' h',
    AMBER: GREEN_MAX_H + ' h < paid <= ' + AMBER_MAX_H + ' h',
    RED: 'paid > ' + AMBER_MAX_H + ' h or overtime >= ' + RED_OT_H + ' h',
    HOLIDAY: '0 paid hours on a named company holiday',
    ABSENT: '0 paid hours on a weekday that is not a holiday',
    COVER: 'worked stops planned under another tech (moved-tech class): nothing planned for this tech, or >= ' + COVER_MIN_STOPS + ' stops in, or >= ' + COVER_MIN_SHARE * 100 + '% of the day',
    week: 'SUCCESSFUL if no RED days and overtime < ' + WEEK_OT_H + ' h',
  },
  perTech,
  weekly,
  redDays,
  absentDays,
  coverDays,
  days,
};

fs.writeFileSync(PATHS.out, JSON.stringify(out, null, 1));
console.log('  wrote   :', path.relative(REDESIGN, PATHS.out));

// ---------------------------------------------------------------- console report
const fmt = (n, w) => (n == null ? '-' : String(n)).padStart(w || 6);
console.log('\nWEEKLY (paid / OT / planned span / stamped span / label)');
for (const tech of allTechs) {
  console.log('  ' + tech);
  for (const w of weekly.filter((x) => x.tech === tech)) {
    console.log('    ' + w.week + '  paid ' + fmt(w.paidHours) + (w.outOfWindowDays ? ' (inWin ' + fmt(w.paidHoursInPlanWindow, 5) + ')' : '') + '  OT ' + fmt(w.overtimeHours, 5) +
      '  plan ' + fmt(w.plannedSpanH) + '  stamp ' + fmt(w.stampedSpanH) +
      '  stops ' + fmt(w.plannedStops, 4) + '/' + fmt(w.stampedStops, 4) +
      '  G/A/R ' + w.green + '/' + w.amber + '/' + w.red +
      '  ' + w.weekLabel + ' - ' + w.reason);
  }
}
console.log('\nPER-TECH DISTRIBUTIONS');
for (const t of perTech) {
  const d = t.paidMinusPlannedSpanH;
  const c = t.clockInToFirstStampMin;
  const e = t.lastStampToClockOutMin;
  console.log('  ' + t.tech.padEnd(17) + ' fieldDays ' + t.fieldDays + '  paid ' + (t.paidHours == null ? 'salaried' : t.paidHours) +
    '  OT ' + (t.overtimeHours == null ? '-' : t.overtimeHours) + '  G/A/R ' + t.green + '/' + t.amber + '/' + t.red +
    '  absent ' + t.absentWeekdays + '  cover ' + t.coverDays);
  console.log('      paid-minus-planned span h  med ' + d.median + '  p10 ' + d.p10 + '  p90 ' + d.p90 + '  (n=' + d.n + ')');
  console.log('      paid-minus-stamped span h  med ' + t.paidMinusStampedSpanH.median + '  p10 ' + t.paidMinusStampedSpanH.p10 + '  p90 ' + t.paidMinusStampedSpanH.p90);
  console.log('      clockIn->firstStamp min    med ' + c.median + '  p10 ' + c.p10 + '  p90 ' + c.p90);
  console.log('      lastStamp->clockOut min    med ' + e.median + '  p10 ' + e.p10 + '  p90 ' + e.p90);
  console.log('      CLEAN days (no evening stamping) n=' + t.cleanDays +
    '  clockIn->first med ' + t.clockInToFirstStampMinClean.median + ' (p90 ' + t.clockInToFirstStampMinClean.p90 + ')' +
    '  last->clockOut med ' + t.lastStampToClockOutMinClean.median + ' (p90 ' + t.lastStampToClockOutMinClean.p90 + ')' +
    '  paid-minus-stamped med ' + t.paidMinusStampedSpanHClean.median);
  console.log('      paid h med ' + t.paidH.median + '  stamped span h med ' + t.stampedSpanH.median + '  planned span h med ' + t.plannedSpanH.median + '  stops/paid h med ' + t.stopsPerPaidHour.median);
}
console.log('\nRED DAYS: ' + redDays.length);
for (const d of redDays) {
  console.log('  ' + d.date + ' ' + d.dow + ' ' + d.tech.padEnd(17) + ' paid ' + fmt(d.paidHours, 5) + ' OT ' + fmt(d.overtimeHours, 5) + ' ' + (d.redCause || '').padEnd(13) +
    ' planned ' + fmt(d.plannedStops, 3) + ' /' + fmt(d.plannedSpanH, 5) + ' h   stamped ' + fmt(d.stampedStops, 3) + ' /' + fmt(d.stampedSpanH, 5) + ' h  ' +
    d.clockIn + '-' + d.clockOut + (d.outsidePlanWindow ? '  [outside plan window]' : '') + (d.note ? '  note: ' + d.note : ''));
}
console.log('\nABSENT WEEKDAYS: ' + absentDays.length);
for (const d of absentDays) console.log('  ' + d.date + ' ' + d.dow + ' ' + d.tech + '  planned ' + (d.plannedStops || 0) + '  stamped ' + (d.stampedStops || 0) + (d.note ? '  note: ' + d.note : ''));
console.log('\nCOVER DAYS: ' + coverDays.length);
for (const d of coverDays) console.log('  ' + d.date + ' ' + d.dow + ' ' + d.tech + '  planned ' + (d.plannedStops || 0) + '  stamped ' + d.stampedStops + '  in-from ' + JSON.stringify(d.from) + '  paid ' + (d.salaried ? 'salaried' : d.paidHours));

const hourly = days.filter((d) => !d.salaried && d.paid.hours);
const hourlyClean = hourly.filter((d) => !d.stamped.eveningStamps);
console.log('\nALL-TECH (hourly only, n=' + hourly.length + '; clean n=' + hourlyClean.length + ')');
console.log('  paid-minus-planned span h : ' + JSON.stringify(dist(hourly.map((d) => d.deltas.paidMinusPlannedSpanH))));
console.log('  paid-minus-stamped span h : ' + JSON.stringify(dist(hourly.map((d) => d.deltas.paidMinusStampedSpanH))));
console.log('  clockIn->firstStamp min   : ' + JSON.stringify(dist(hourly.map((d) => d.deltas.clockInToFirstStampMin))));
console.log('  lastStamp->clockOut min   : ' + JSON.stringify(dist(hourly.map((d) => d.deltas.lastStampToClockOutMin))));
console.log('  CLEAN paid-minus-stamped  : ' + JSON.stringify(dist(hourlyClean.map((d) => d.deltas.paidMinusStampedSpanH))));
console.log('  CLEAN clockIn->firstStamp : ' + JSON.stringify(dist(hourlyClean.map((d) => d.deltas.clockInToFirstStampMin))));
console.log('  CLEAN lastStamp->clockOut : ' + JSON.stringify(dist(hourlyClean.map((d) => d.deltas.lastStampToClockOutMin))));
console.log('  days with evening stamping: ' + hourly.filter((d) => d.stamped.eveningStamps).length);
console.log('\ndone');
