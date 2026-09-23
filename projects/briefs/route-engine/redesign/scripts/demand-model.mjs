// demand-model.mjs - S3b. Weekly visit demand and capacity per route-day under four cadence policies.
// Input:  redesign/data/cadence-asbuilt.json (from derive-cadence.mjs)
//         data/route-day-drive_2026-08-17_2026-09-17.json (stamp-derived cycle time per route-day)
//         redesign/data/master-asbuilt.json (route-day assignment, IF it exists)
// Output: redesign/data/demand-model.json
//
// Options:
//   --cycle=gps      take cycle times from vehicle GPS instead of Jobber stamps.
//                    (--cycle=stamps, or omitting it, is the default. A file path is
//                    still accepted and read as a GPS-shaped cycle file.)
//                    The GPS observedBaseline replaces the stamp baseline so
//                    calibration stays like-for-like.
//   --out=<file>     write to this file instead of data/demand-model.json
//
// S6 defect D-cycle: this file used to compute cycle time as the RATIO OF
// MEDIANS (medianSpanH * 60 / medianStops) while policies/week-solve.mjs used
// the MEDIAN OF PER-ROUTE-DAY RATIOS. Both now import the one estimator from
// lib/cycle-time.mjs, which is the median of per-route-day ratios.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCycleTimes, resolveCycleSource } from './lib/cycle-time.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REDESIGN = path.resolve(HERE, '..');
const ROOT = path.resolve(REDESIGN, '..');
const DATA = path.join(REDESIGN, 'data');
const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'));

const argOf = name => {
  const a = process.argv.slice(2).find(x => x.startsWith('--' + name + '='));
  return a ? a.slice(name.length + 3) : null;
};
const CYCLE_ARG = argOf('cycle');
const OUT_FILE = argOf('out') || 'demand-model.json';
const resolveIn = f => path.isAbsolute(f) ? f : (fs.existsSync(path.resolve(REDESIGN, f)) ? path.resolve(REDESIGN, f) : path.resolve(process.cwd(), f));

const { source: CYCLE_SRC, overrideFile: CYCLE_OVERRIDE } = resolveCycleSource(CYCLE_ARG);

const cad = rd(path.join(DATA, 'cadence-asbuilt.json'));
const drive = rd(path.join(ROOT, 'data', 'route-day-drive_2026-08-17_2026-09-17.json'));
// the GPS observedBaseline (what actually ran) still comes from the slim export
const GPS_SLIM = path.join(DATA, 'cycle-times-gps.json');
const cycleFile = CYCLE_SRC === 'gps'
  ? rd(CYCLE_OVERRIDE && /cycle-times/.test(CYCLE_OVERRIDE) ? resolveIn(CYCLE_OVERRIDE) : GPS_SLIM)
  : null;

// optional: a master route-day assignment from a sibling stage
const MASTER = path.join(DATA, 'master-asbuilt.json');
let master = null;
if (fs.existsSync(MASTER)) {
  try { master = rd(MASTER); } catch (e) { master = null; }
}

const DOWS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const med = arr => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const i = (s.length - 1) / 2;
  return (s[Math.floor(i)] + s[Math.ceil(i)]) / 2;
};

// ---------- cycle time per route-day (minutes per stop, drive included) ----------
// Either the stamp-derived cycle (span/stops from Jobber completion stamps) or, with --cycle, the
// GPS-measured one. Both are "minutes per stop from the first stop of the day to the last".
const CT = loadCycleTimes({
  source: CYCLE_SRC,
  overrideFile: CYCLE_OVERRIDE ? resolveIn(CYCLE_OVERRIDE) : null,
  dirs: [DATA, path.join(ROOT, 'data')],
});
const CYCLE_SOURCE = CT.label + (CT.file ? ' [' + CT.file + ']' : '');
const cycle = CT.byTechDow;                 // "tech|dow" -> minutes per stop
const globalCycle = CT.global;
const cycleFor = (tech, dow) => CT.cycleFor(tech, dow);
if (!cycle.size) {
  console.error('FATAL: no cycle-time rows for source "' + CYCLE_SRC + '". Nothing to model against.');
  process.exit(1);
}

// ---------- route-day assignment per job ----------
// Preference: master-asbuilt.json -> dominant tech/dow from cadence -> nearest neighbor.
const masterByJob = new Map();
if (master) {
  const rows = Array.isArray(master) ? master : (master.jobs || master.rows || []);
  for (const r of rows) {
    const jn = r.jobNumber ?? r.job ?? r.jobNo;
    let tech = null, dow = null;
    // master-asbuilt stores routeDay as the string "Tech Name|dow"
    if (typeof r.routeDay === 'string' && r.routeDay.includes('|')) {
      const parts = r.routeDay.split('|');
      tech = parts[0]; dow = parts[1];
    } else if (r.routeDay && typeof r.routeDay === 'object') {
      tech = r.routeDay.tech; dow = r.routeDay.dow;
    }
    tech = tech || r.tech || r.dominantTech;
    dow = dow || r.dow || r.dominantWeekday;
    if (jn != null && tech && dow) masterByJob.set(Number(jn), { tech, dow, inferred: !!r.inferred, stability: r.stability || null });
  }
}

const active = cad.jobs.filter(j => j.active);
const assignedPool = [];   // for nearest-neighbor fallback
const assign = new Map();
for (const j of active) {
  let a = null, src = null;
  if (masterByJob.has(j.jobNumber)) { a = masterByJob.get(j.jobNumber); src = 'master-asbuilt.json'; }
  else if (j.routeDay) { a = { tech: j.routeDay.tech, dow: j.routeDay.dow }; src = 'dominant ' + j.routeDay.basis; }
  if (a) { assign.set(j.jobNumber, { ...a, src }); if (j.lat != null && j.lng != null) assignedPool.push({ lat: j.lat, lng: j.lng, ...a }); }
}
const hav = (a, b) => {
  const R = 6371, t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t, dLng = (b.lng - a.lng) * t;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
let nnUsed = 0, unassignable = 0;
for (const j of active) {
  if (assign.has(j.jobNumber)) continue;
  if (j.lat == null || j.lng == null || !assignedPool.length) { unassignable++; continue; }
  let best = null, bd = Infinity;
  for (const p of assignedPool) { const d = hav(j, p); if (d < bd) { bd = d; best = p; } }
  assign.set(j.jobNumber, { tech: best.tech, dow: best.dow, src: 'nearest neighbor (' + bd.toFixed(1) + ' km)' });
  nnUsed++;
}

// ---------- policy intervals (days between visits) ----------
// P0 as-run: the job's OWN measured median completed-visit gap; fall back to the delivered
//            median for its product+trigger, then to the product median.
const deliveredTmcp = cad.deliveredIntervals.TMCP.median;
const deliveredQf = cad.deliveredIntervals.quickFix.median;
const productMedian = p => (p === 'Quick Fix' ? deliveredQf : deliveredTmcp);
// trigger-level delivered medians come from the notes cross-check (the only per-visit evidence)
const triggerDelivered = {};
for (const [k, v] of Object.entries(cad.notesCrossCheck.byTriggerDelivered || {})) triggerDelivered[k] = v.median;

const isActivity = t => t.startsWith('activity');
const QF = 'Quick Fix';

// A job only HAS an own measured gap if it was visited twice inside a 5-week window, which by
// construction selects the fast-cadence jobs. Using a short trigger median for the rest inflates
// demand badly (it over-shot the observed baseline by 27%). The honest fallback for a job with a
// single completed visit is the gap the office itself booked next, which is the only cadence
// evidence that exists for it.
function intervalP0(j) {
  if (j.ownMedianInterval && j.ownMedianInterval > 0) return { d: j.ownMedianInterval, basis: 'own measured gap median' };
  const booked = j.intervalAfterLastCompleted;
  if (booked && booked > 0 && booked <= 60) return { d: booked, basis: 'own next booked gap (only one completed visit)' };
  return { d: productMedian(j.product), basis: 'product delivered median (no gap evidence)' };
}
function intervalP1(j) {
  const caught = (j.latestState.moles || 0) > 0;
  return { d: caught ? 7 : 30, basis: caught ? 'catch' : 'no catch' };
}
function intervalP2(j) {
  const s = j.latestState;
  const hot = (s.moles || 0) > 0 || (s.misses || 0) > 0 || (s.activity && s.activity !== 'None');
  return { d: hot ? 7 : 30, basis: hot ? 'catch/miss/activity' : 'quiet' };
}
const NA_DAYS = { 'Add visit': 7, Weekly: 7, '2 weeks': 14, Monthly: 30 };
function intervalP3(j) {
  const na = j.latestState.nextAction;
  if (na && NA_DAYS[na]) return { d: NA_DAYS[na], basis: 'Next Action = ' + na };
  return { d: 30, basis: 'Next Action blank -> treated as Monthly' };
}
const POLICIES = {
  P0: { label: 'as the office actually runs it (measured intervals)', fn: intervalP0 },
  P1: { label: 'weekly after a catch, monthly otherwise', fn: intervalP1 },
  P2: { label: 'weekly after catch OR miss OR any activity, monthly otherwise', fn: intervalP2 },
  P3: { label: "the office's own Next Action field taken literally", fn: intervalP3 },
};

// Quick Fix is a product definition (a 5-week weekly series), not a cadence judgment, so the
// headline run holds it at 7 days under every policy. The pure-policy numbers are kept alongside.
const QF_OVERRIDE_DAYS = 7;

function runPolicy(key, qfWeekly) {
  const fn = POLICIES[key].fn;
  const cells = new Map();
  const basisCount = {};
  let unplaced = 0;
  for (const j of active) {
    const a = assign.get(j.jobNumber);
    if (!a) { unplaced++; continue; }
    let { d, basis } = fn(j);
    if (qfWeekly && j.product === QF) { d = QF_OVERRIDE_DAYS; basis = 'Quick Fix product cadence (weekly series)'; }
    if (!d || d <= 0) { d = productMedian(j.product); basis = 'fallback'; }
    basisCount[basis] = (basisCount[basis] || 0) + 1;
    const k = a.tech + '|' + a.dow;
    if (!cells.has(k)) cells.set(k, { tech: a.tech, dow: a.dow, jobs: 0, visitsPerWeek: 0, byProduct: {} });
    const c = cells.get(k);
    c.jobs++;
    c.visitsPerWeek += 7 / d;
    c.byProduct[j.product] = +((c.byProduct[j.product] || 0) + 7 / d).toFixed(3);
  }
  const rows = [];
  for (const tech of [...new Set([...cycle.keys()].map(k => k.split('|')[0]))].sort()) {
    for (const dow of DOWS) {
      const c = cells.get(tech + '|' + dow) || { tech, dow, jobs: 0, visitsPerWeek: 0, byProduct: {} };
      const cy = cycleFor(tech, dow);
      const v = +c.visitsPerWeek.toFixed(2);
      const hours = +(v * cy.min / 60).toFixed(2);
      rows.push({
        tech, dow, jobs: c.jobs, visitsPerWeek: v,
        cycleMinPerStop: cy.min, cycleSource: cy.source,
        hoursPerWeek: hours,
        hoursOver8: +(hours - 8).toFixed(2),
        hoursOver9: +(hours - 9).toFixed(2),
        over8: hours > 8, over9: hours > 9,
        byProduct: c.byProduct,
      });
    }
  }
  const totalV = +rows.reduce((a, r) => a + r.visitsPerWeek, 0).toFixed(1);
  const totalH = +rows.reduce((a, r) => a + r.hoursPerWeek, 0).toFixed(1);
  return {
    policy: key, label: POLICIES[key].label, quickFixHeldWeekly: !!qfWeekly,
    rows,
    totals: {
      visitsPerWeek: totalV, hoursPerWeek: totalH,
      routeDays: rows.length, capacityHoursAt8: rows.length * 8, capacityHoursAt9: rows.length * 9,
      hoursOverCapacityAt8: +(totalH - rows.length * 8).toFixed(1),
      hoursOverCapacityAt9: +(totalH - rows.length * 9).toFixed(1),
      routeDaysOver8: rows.filter(r => r.over8).length,
      routeDaysOver9: rows.filter(r => r.over9).length,
      utilizationAt8Pct: +(totalH / (rows.length * 8) * 100).toFixed(1),
      techDaysNeededAt8: +(totalH / 8).toFixed(1),
    },
    intervalBasisCounts: basisCount,
    jobsUnplaced: unplaced,
  };
}

// ---------- observed baseline: what the route actually delivered ----------
const observedRows = cycleFile
  ? (cycleFile.observedBaseline?.rows || []).map(r => ({ tech: r.tech, dow: r.dow, medianStops: r.medianStops, medianSpanH: r.medianSpanH, weeks: r.weeksObserved }))
  : (drive.summary || []).map(r => ({ tech: r.tech, dow: r.dow, medianStops: r.medianStops, medianSpanH: r.medianSpanH, weeks: r.weeks }));
const observed = observedRows.filter(r => r.medianSpanH && r.medianStops).map(r => {
  const cy = r.medianSpanH * 60 / r.medianStops;
  return {
    tech: r.tech, dow: r.dow, medianStops: r.medianStops, medianSpanH: r.medianSpanH,
    cycleMinPerStop: +cy.toFixed(2), weeksObserved: r.weeks,
    hoursOver8: +(r.medianSpanH - 8).toFixed(2), hoursOver9: +(r.medianSpanH - 9).toFixed(2),
  };
});
const observedTotals = {
  stopsPerWeek: +observed.reduce((a, r) => a + r.medianStops, 0).toFixed(1),
  hoursPerWeek: +observed.reduce((a, r) => a + r.medianSpanH, 0).toFixed(1),
  routeDaysOver8: observed.filter(r => r.medianSpanH > 8).length,
  routeDaysOver9: observed.filter(r => r.medianSpanH > 9).length,
};

// ---------- assemble ----------
const policies = {};
const policiesPure = {};
for (const k of Object.keys(POLICIES)) {
  policies[k] = runPolicy(k, true);
  policiesPure[k] = runPolicy(k, false);
}

// ---------- calibration: does each policy reproduce what actually ran? ----------
const calibration = Object.keys(POLICIES).map(k => {
  const t = policies[k].totals;
  return {
    policy: k,
    visitsPerWeek: t.visitsPerWeek,
    observedStopsPerWeek: observedTotals.stopsPerWeek,
    deltaVisitsPct: +((t.visitsPerWeek - observedTotals.stopsPerWeek) / observedTotals.stopsPerWeek * 100).toFixed(1),
    hoursPerWeek: t.hoursPerWeek,
    observedHoursPerWeek: observedTotals.hoursPerWeek,
    deltaHoursPct: +((t.hoursPerWeek - observedTotals.hoursPerWeek) / observedTotals.hoursPerWeek * 100).toFixed(1),
  };
});

const out = {
  generatedAt: new Date().toISOString(),
  asOf: cad.asOf,
  calibration,
  calibrationNote: 'The observed baseline is what the five techs actually delivered. A policy whose visits/week sits far above it is describing a service level the company has never run, not a forecast of the same work.',
  basis: {
    activeJobs: active.length,
    routeDayAssignment: master ? 'master-asbuilt.json where present, else dominant tech/weekday from this job visits' : 'dominant tech/weekday from each job completed visits (scheduled visits when it has none)',
    masterAsbuiltPresent: !!master,
    masterRowsParsed: masterByJob.size,
    assignmentSources: [...assign.values()].reduce((m, a) => (m[a.src] = (m[a.src] || 0) + 1, m), {}),
    nearestNeighborUsed: nnUsed,
    unassignable,
    cycleTimeSource: CYCLE_SOURCE,
    cycleTime: 'lib/cycle-time.mjs, the one estimator: the MEDIAN over that tech x weekday route-days of (first-stop-to-last-stop minutes / stops that day). '
      + (CYCLE_SRC === 'gps'
        ? 'Stops are Jobber completed visits, spans are vehicle GPS, because the model counts visits and one GPS stop can serve several jobs at one address.'
        : 'Spans and stops are Jobber completion stamps.')
      + ' Fallback: that tech median across their days, then the global median.',
    cycleTimeEstimator: CT.estimator,
    cycleTimeFile: CT.file,
    cycleTimeRouteDaysUsed: CT.routeDaysUsed,
    cycleTimeDegraded: CT.degraded,
    globalCycleMinPerStop: globalCycle,
    quickFixNote: 'Headline policies hold Quick Fix at 7 days because the product IS a weekly 5-week series; policiesPure applies each policy to Quick Fix too, for comparison.',
    capacityReference: '25 route-days x 8h = 200h per week.',
  },
  caveats: [
    'Demand is a steady-state rate: each job contributes 7/interval visits per week. It does not model the Quick Fix series ending, new sales arriving, or churn.',
    'Cycle time is a route-day median measured over 3-5 weeks at the stop counts actually run. Pushing a route-day well past its observed stop count will not scale linearly - drive per stop falls as density rises, so hours at much higher volume are over-estimated, and at much lower volume under-estimated.',
    'P0 uses each job own measured gap, which is itself the product of a schedule the office has been manually patching. It reproduces current behavior, including its defects.',
    'Trigger state is job-level and describes only the last completed visit, so P1/P2/P3 classify each job by one observation, not by a steady-state probability of catching.',
    'Cycle time is measured per tech, and techs differ by up to about 2x (Cory 12.8-16.0 min/stop, Luke 20.0-32.1). Hours per route-day are therefore not comparable between techs as a measure of workload difficulty.',
  ],
  observedBaseline: { rows: observed, totals: observedTotals,
    source: cycleFile ? 'GPS (cycle-times-gps.json observedBaseline)' : 'Jobber completion stamps (route-day-drive summary)',
    note: 'What the five techs actually delivered over 08-17..09-17. The right sanity check for any policy total.' },
  policies,
  policiesPure,
  seasonality: cad.seasonality,
  seasonalityNote: 'Share of TMCP completed visits whose gap from the prior visit was <=10 days, by week. Week 1 is flagged BIASED (the lookback runs off the front of the visit window). Week 4 lost Labor Day (4 field days), which stretched gaps into week 5 and is the main reason week 5 reads low. The truncation-free companion is ratePerFieldDayNormalized: 0.622 -> 0.556 visits per active TMCP job per 5-day week across the month.',
};

fs.writeFileSync(path.join(DATA, OUT_FILE), JSON.stringify(out, null, 1));

// ---------- console report ----------
const L = [];
L.push('cycle times: ' + CYCLE_SOURCE + '   ->  data/' + OUT_FILE);
L.push('active jobs ' + active.length + '  route-days 25  master-asbuilt ' + (master ? 'USED' : 'absent, computed own') + '  nearest-neighbor ' + nnUsed + '  unassignable ' + unassignable);
L.push('');
L.push('OBSERVED BASELINE (what actually ran 08-17..09-17) - ' + (cycleFile ? 'GPS measured' : 'stamp derived'));
L.push('  stops/week ' + observedTotals.stopsPerWeek + '  hours/week ' + observedTotals.hoursPerWeek + '  route-days over 8h ' + observedTotals.routeDaysOver8 + '  over 9h ' + observedTotals.routeDaysOver9);
L.push('');
for (const k of Object.keys(POLICIES)) {
  const p = policies[k];
  L.push(k + ' - ' + p.label + (p.quickFixHeldWeekly ? '  [Quick Fix held weekly]' : ''));
  L.push('  tech             dow  jobs  visits/wk  cyc(min)  hours  over8  over9');
  for (const r of p.rows) {
    L.push('  ' + r.tech.padEnd(17) + r.dow.padEnd(5) + String(r.jobs).padStart(4) + String(r.visitsPerWeek).padStart(11)
      + String(r.cycleMinPerStop).padStart(10) + String(r.hoursPerWeek).padStart(7)
      + String(r.hoursOver8).padStart(7) + String(r.hoursOver9).padStart(7) + (r.cycleSource !== CT.label ? '  <' + r.cycleSource : ''));
  }
  const t = p.totals;
  L.push('  TOTAL visits/wk ' + t.visitsPerWeek + '  hours/wk ' + t.hoursPerWeek + '  vs 200h = ' + (t.hoursOverCapacityAt8 > 0 ? '+' : '') + t.hoursOverCapacityAt8
    + '  util ' + t.utilizationAt8Pct + '%  days>8h ' + t.routeDaysOver8 + '  days>9h ' + t.routeDaysOver9 + '  tech-days needed@8h ' + t.techDaysNeededAt8);
  L.push('  interval basis: ' + JSON.stringify(p.intervalBasisCounts));
  L.push('');
}
L.push('CALIBRATION vs observed (' + observedTotals.stopsPerWeek + ' stops/wk, ' + observedTotals.hoursPerWeek + ' h/wk)');
for (const c of calibration) {
  L.push('  ' + c.policy + '  visits/wk ' + String(c.visitsPerWeek).padStart(7) + ' (' + (c.deltaVisitsPct > 0 ? '+' : '') + c.deltaVisitsPct + '%)'
    + '   hours/wk ' + String(c.hoursPerWeek).padStart(7) + ' (' + (c.deltaHoursPct > 0 ? '+' : '') + c.deltaHoursPct + '%)');
}
L.push('');
L.push('ROUTE-DAY ASSIGNMENT SOURCE: ' + JSON.stringify([...assign.values()].reduce((m, a) => (m[a.src] = (m[a.src] || 0) + 1, m), {})));
L.push('');
L.push('PURE POLICY (Quick Fix NOT held weekly) totals:');
for (const k of Object.keys(POLICIES)) {
  const t = policiesPure[k].totals;
  L.push('  ' + k + '  visits/wk ' + String(t.visitsPerWeek).padStart(7) + '  hours/wk ' + String(t.hoursPerWeek).padStart(7) + '  vs200 ' + String(t.hoursOverCapacityAt8).padStart(7) + '  days>8h ' + t.routeDaysOver8);
}
L.push('');
L.push('SEASONALITY');
for (const s of cad.seasonality) {
  L.push('  ' + s.weekStart + '  TMCP visits ' + String(s.tmcpCompletedVisits).padStart(4) + '  share weekly ' + String(s.shareWeeklyPct).padStart(5) + '%'
    + '  rate@5d ' + s.ratePerFieldDayNormalized + (s.caveat ? '  <<' + s.caveat.split(':')[0] : ''));
}
console.log(L.join('\n'));
