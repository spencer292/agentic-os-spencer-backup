// ============================================================================
// cycle-time.mjs — the ONE cycle-time estimator.
//
// WHY THIS FILE EXISTS
//   S6 defect D-cycle: demand-model.mjs used the RATIO OF MEDIANS
//   (medianSpanH * 60 / medianStops, per tech x weekday) while
//   policies/week-solve.mjs used the MEDIAN OF PER-ROUTE-DAY RATIOS
//   (median over days of span/stops). Two estimators on the same thin
//   evidence. This module is the single definition; both callers import it.
//
// THE DEFINITION (one sentence)
//   cycle time for a tech on a weekday = the MEDIAN, over that tech's
//   route-days on that weekday, of (first-stop-to-last-stop minutes / stops
//   served that day). Drive between stops and any mid-route break are inside
//   it. The home commute is not.
//
// SOURCES
//   'stamps' (default) data/route-day-drive_*.json -> routeDays[]
//                      ratio = span (minutes) / stops
//   'gps'              data/gps-ground-truth.json -> routeDays[]
//                      ratio = cycleMinPerVisit (firstToLastMin / jobberCompleted)
//                      The demand model counts JOBBER VISITS, and one GPS stop
//                      can serve several jobs at one address (Barbee Mill is 11
//                      jobs at one property), so per-visit is the model input.
//                      Falls back to data/cycle-times-gps.json's byTechDow
//                      aggregate when the per-day file is absent; that file is
//                      already a median of per-day ratios, so the estimator is
//                      unchanged, only the ability to honour `before` is lost.
//
// NO LOOKAHEAD
//   Pass `before: '2026-08-24'` and only route-days strictly earlier are used.
//   week-solve relies on this: nothing from inside or after the golden week may
//   reach the capacity model.
//
// FALLBACK LADDER (identical for both callers)
//   exact tech x weekday -> that tech's median across their days -> global median.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';

export const CYCLE_SOURCES = ['stamps', 'gps'];

/** Median. Even-length arrays average the two middles. Empty -> null. */
export function median(xs) {
  const s = [...xs].filter(n => typeof n === 'number' && Number.isFinite(n)).sort((a, b) => a - b);
  if (!s.length) return null;
  const i = (s.length - 1) / 2;
  return (s[Math.floor(i)] + s[Math.ceil(i)]) / 2;
}

const r2 = n => (n == null ? null : +n.toFixed(2));

/**
 * Normalise whatever the CLI was given into a source name.
 *   --cycle=gps                          -> 'gps'
 *   --cycle=stamps | absent              -> 'stamps'
 *   --cycle=data/cycle-times-gps.json    -> 'gps'   (legacy spelling, still honoured)
 *   --cycle=<any other path>             -> 'gps' with that file as an override
 */
export function resolveCycleSource(raw) {
  if (!raw || raw === true) return { source: 'stamps', overrideFile: null };
  const v = String(raw).trim();
  if (/^stamps?$/i.test(v)) return { source: 'stamps', overrideFile: null };
  if (/^gps$/i.test(v)) return { source: 'gps', overrideFile: null };
  // a path — treat as a GPS-shaped cycle file
  return { source: 'gps', overrideFile: v };
}

/** Newest route-day-drive_*.json under a directory, or null. */
function newestDriveFile(dir) {
  if (!fs.existsSync(dir)) return null;
  const hits = fs.readdirSync(dir).filter(f => /^route-day-drive_.*\.json$/.test(f)).sort();
  return hits.length ? path.join(dir, hits[hits.length - 1]) : null;
}

function firstExisting(cands) {
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  return null;
}

/**
 * Per-route-day ratio rows for the chosen source.
 * Returns [{ tech, dow, day, stops, ratioMin }].
 */
function routeDayRatios(source, dirs, overrideFile) {
  if (source === 'stamps') {
    const file = overrideFile || firstExisting(dirs.map(d => newestDriveFile(d)));
    if (!file) return { rows: [], file: null, degraded: null };
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const rows = (raw.routeDays || [])
      .filter(r => r.stops > 0 && r.span > 0)
      .map(r => ({ tech: r.tech, dow: r.dow, day: r.day, stops: r.stops, ratioMin: r.span / r.stops }));
    return { rows, file: path.basename(file), degraded: null };
  }

  // gps — prefer the per-day ground-truth file so `before` can be honoured
  const perDay = overrideFile && /gps-ground-truth/.test(overrideFile)
    ? overrideFile
    : firstExisting(dirs.map(d => path.join(d, 'gps-ground-truth.json')));
  if (perDay) {
    const raw = JSON.parse(fs.readFileSync(perDay, 'utf8'));
    const rows = (raw.routeDays || [])
      .filter(r => r.fieldDay !== false && r.cycleMinPerVisit != null && r.jobberCompleted > 0)
      .map(r => ({ tech: r.tech, dow: r.dow, day: r.date, stops: r.jobberCompleted, ratioMin: r.cycleMinPerVisit }));
    if (rows.length) return { rows, file: path.basename(perDay), degraded: null };
  }

  // fallback — the slim export holds only the tech x weekday aggregate
  const slim = firstExisting([overrideFile, ...dirs.map(d => path.join(d, 'cycle-times-gps.json'))]);
  if (!slim) return { rows: [], file: null, degraded: null };
  const raw = JSON.parse(fs.readFileSync(slim, 'utf8'));
  const rows = (raw.byTechDow || [])
    .filter(r => r.cycleMinPerStop != null)
    .map(r => ({ tech: r.tech, dow: r.dow, day: null, stops: r.medianCustomerStops ?? null, ratioMin: r.cycleMinPerStop, preAggregated: true, days: r.days }));
  return {
    rows,
    file: path.basename(slim),
    degraded: 'per-day GPS rows not found; using the pre-aggregated byTechDow medians. The estimator is the same (median of per-day ratios) but `before` cannot be applied.',
  };
}

/**
 * The one loader.
 *
 * @param {object}   opts
 * @param {string}   opts.source   'stamps' | 'gps'                (default 'stamps')
 * @param {string?}  opts.before   ISO date; use only route-days strictly before it
 * @param {string[]} opts.dirs     directories to look in, in order
 * @param {string?}  opts.overrideFile explicit file path
 *
 * @returns {{
 *   source: string, estimator: string, file: string|null, degraded: string|null,
 *   before: string|null, routeDaysUsed: number,
 *   byTechDow: Map<string, number>, byTech: Map<string, number>,
 *   all: number|null, global: number|null,
 *   cycleFor: (tech: string, dow: string) => { min: number|null, source: string }
 * }}
 */
export function loadCycleTimes(opts = {}) {
  const source = CYCLE_SOURCES.includes(opts.source) ? opts.source : 'stamps';
  const before = opts.before || null;
  const dirs = (opts.dirs || []).filter(Boolean);
  const { rows: allRows, file, degraded } = routeDayRatios(source, dirs, opts.overrideFile || null);

  const rows = before ? allRows.filter(r => r.day == null || r.day < before) : allRows;

  const byTechDowArr = new Map();
  const byTechArr = new Map();
  for (const r of rows) {
    if (!r.tech || !r.dow) continue;
    const k = r.tech + '|' + r.dow;
    if (!byTechDowArr.has(k)) byTechDowArr.set(k, []);
    byTechDowArr.get(k).push(r.ratioMin);
    if (!byTechArr.has(r.tech)) byTechArr.set(r.tech, []);
    byTechArr.get(r.tech).push(r.ratioMin);
  }

  const byTechDow = new Map();
  for (const [k, xs] of byTechDowArr) byTechDow.set(k, r2(median(xs)));
  const byTech = new Map();
  for (const [k, xs] of byTechArr) byTech.set(k, r2(median(xs)));
  const all = r2(median(rows.map(r => r.ratioMin)));

  const label = source === 'gps'
    ? 'GPS measured, median of per-route-day (first-to-last / visits)'
    : 'Jobber stamps, median of per-route-day (span / stops)';

  const cycleFor = (tech, dow) => {
    const exact = byTechDow.get(tech + '|' + dow);
    if (exact != null) return { min: exact, source: label };
    const t = byTech.get(tech);
    if (t != null) return { min: t, source: 'tech median (no measured row for this weekday)' };
    return { min: all, source: 'global median (tech not in the cycle table)' };
  };

  return {
    source,
    estimator: 'median of per-route-day ratios',
    label,
    file,
    degraded,
    before,
    routeDaysUsed: rows.length,
    routeDaysAvailable: allRows.length,
    byTechDow,
    byTech,
    all,
    global: all,
    cycleFor,
  };
}

export default loadCycleTimes;
