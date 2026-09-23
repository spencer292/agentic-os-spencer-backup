#!/usr/bin/env node
/**
 * S3a - derive-master.mjs
 *
 * Derives the AS-BUILT master route from data alone: every job -> one route-day
 * (tech x weekday), with a stability class saying how much the field actually
 * agrees with itself. No rulebook is read. No rule is applied.
 *
 * Inputs (relative to projects/briefs/route-engine/):
 *   redesign/data/jobber/jobs.json
 *   redesign/data/jobber/visits.json
 *   data/completed-visits_2026-08-17_2026-09-17.json   (cross-check only)
 *   data/route-day-drive_2026-08-17_2026-09-17.json    (observed cycle times)
 *
 * Output: redesign/data/master-asbuilt.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..'); // .../route-engine
const OUT = path.join(ROOT, 'redesign', 'data', 'master-asbuilt.json');

const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

// ---------------------------------------------------------------- constants
// Aug-Oct 2026 is entirely PDT (UTC-7); DST ends 2026-11-01.
const PT_OFFSET_H = 7;
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WORKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const STABLE_THRESHOLD = 0.8;
const NEIGHBOURS = 10;

const ptDate = (iso) => new Date(new Date(iso).getTime() - PT_OFFSET_H * 3600e3);
const ptDay = (iso) => ptDate(iso).toISOString().slice(0, 10);
const ptDow = (iso) => DOW[ptDate(iso).getUTCDay()];

const hav = (a, b) => {
  const R = 6371;
  const p = Math.PI / 180;
  const dLat = (b.lat - a.lat) * p;
  const dLng = (b.lng - a.lng) * p;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * p) * Math.cos(b.lat * p) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const tally = (xs) => xs.reduce((a, x) => ((a[x] = (a[x] || 0) + 1), a), {});
const top = (t) => {
  const e = Object.entries(t).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return e.length ? { value: e[0][0], count: e[0][1] } : { value: null, count: 0 };
};

// ---------------------------------------------------------------- load
const jobs = rd('redesign/data/jobber/jobs.json');
const visits = rd('redesign/data/jobber/visits.json');
const crossCheck = rd('data/completed-visits_2026-08-17_2026-09-17.json');
const driveSummary = rd('data/route-day-drive_2026-08-17_2026-09-17.json').summary;

const log = [];
const say = (...a) => {
  const s = a.join(' ');
  log.push(s);
  console.log(s);
};

// ---------------------------------------------------------------- product
const productOf = (job) => {
  const names = (job.lineItems || []).map((li) => (li.name || '').toLowerCase());
  const j = names.join(' | ');
  if (j.includes('total mole control')) return 'TMCP';
  if (j.includes('quick fix')) return 'QUICK_FIX';
  if (j.includes('barter') || j.includes('friends and family')) return 'BARTER';
  if (!names.length || names.every((n) => !n.trim())) return 'BID_OR_EMPTY';
  return 'OTHER';
};

const cf = (job, label) => {
  const f = (job.customFields || []).find(
    (x) => (x.label || '').trim().toLowerCase() === label.toLowerCase()
  );
  return f ? f.value : null;
};

// ---------------------------------------------------------------- index visits
const byJob = new Map();
for (const v of visits) {
  if (!byJob.has(v.jobNumber)) byJob.set(v.jobNumber, []);
  byJob.get(v.jobNumber).push(v);
}
for (const a of byJob.values()) a.sort((x, y) => x.startAt.localeCompare(y.startAt));

// cross-check: does the standalone completed-visits file agree on tech?
{
  const vById = new Map(visits.map((v) => [v.id, v]));
  let miss = 0;
  let disagree = 0;
  for (const c of crossCheck) {
    const v = vById.get(c.id);
    if (!v) {
      miss++;
      continue;
    }
    if ((v.techs || [])[0] !== c.tech) disagree++;
  }
  say(
    `[cross-check] completed-visits file: ${crossCheck.length} rows, ${miss} absent from visits.json, ${disagree} tech disagreements`
  );
}

const completedOf = (jn) =>
  (byJob.get(jn) || [])
    .filter((v) => v.isComplete && (v.techs || []).length)
    .map((v) => ({
      id: v.id,
      date: ptDay(v.startAt),
      weekday: ptDow(v.startAt),
      tech: v.techs[0],
      completedAt: v.completedAt || null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

// window actually observed
const allCompletedDates = visits
  .filter((v) => v.isComplete)
  .map((v) => ptDay(v.startAt))
  .sort();
const WINDOW = { from: allCompletedDates[0], to: allCompletedDates[allCompletedDates.length - 1] };
const WINDOW_WEEKS = (new Date(WINDOW.to) - new Date(WINDOW.from)) / (7 * 86400e3) + 1 / 7;
say(`[window] completed visits ${WINDOW.from} .. ${WINDOW.to} (${WINDOW_WEEKS.toFixed(2)} weeks)`);

// ---------------------------------------------------------------- cadence
// Weekly-equivalent visits derived from the job own visit spacing in the file
// (completed + scheduled future), never from a cadence rule.
const cadenceOf = (jn) => {
  const vs = byJob.get(jn) || [];
  const days = [...new Set(vs.map((v) => ptDay(v.startAt)))].sort();
  if (days.length < 2) return { weeklyEq: null, medianGapDays: null, basis: 'insufficient' };
  const gaps = [];
  for (let i = 1; i < days.length; i++) {
    gaps.push((new Date(days[i]) - new Date(days[i - 1])) / 86400e3);
  }
  const g = median(gaps.filter((x) => x > 0));
  if (!g) return { weeklyEq: null, medianGapDays: null, basis: 'insufficient' };
  return { weeklyEq: Math.min(1, 7 / g), medianGapDays: g, basis: 'observed-spacing' };
};

// ---------------------------------------------------------------- build rows
const rows = [];
for (const job of jobs) {
  const p = job.property || {};
  const comp = completedOf(job.jobNumber);
  const cad = cadenceOf(job.jobNumber);

  // handover detection: exactly one tech change point, sustained after it
  const techSeq = comp.map((c) => c.tech);
  let handover = null;
  if (techSeq.length >= 2) {
    const changes = [];
    for (let i = 1; i < techSeq.length; i++) if (techSeq[i] !== techSeq[i - 1]) changes.push(i);
    if (changes.length === 1) {
      const i = changes[0];
      const before = new Set(techSeq.slice(0, i));
      const after = new Set(techSeq.slice(i));
      // sustained = at least two visits on the new tech, otherwise it is just scatter
      if (before.size === 1 && after.size === 1 && techSeq.length - i >= 2) {
        handover = {
          from: techSeq[i - 1],
          to: techSeq[i],
          date: comp[i].date,
          visitsBefore: i,
          visitsAfter: techSeq.length - i,
        };
      }
    }
  }

  // tech view: after a handover, only the post-handover segment defines the tech
  const techPool = handover ? comp.filter((c) => c.date >= handover.date) : comp;
  const techTally = tally(techPool.map((c) => c.tech));
  const dayTally = tally(comp.map((c) => c.weekday));
  const tTop = top(techTally);
  const dTop = top(dayTally);
  const techShare = techPool.length ? tTop.count / techPool.length : null;
  const dayShare = comp.length ? dTop.count / comp.length : null;

  let stability;
  if (comp.length === 0) stability = 'NONE';
  else if (comp.length === 1) stability = 'SINGLE';
  else {
    const tOk = handover ? true : techShare >= STABLE_THRESHOLD;
    const dOk = dayShare >= STABLE_THRESHOLD;
    if (tOk && dOk) stability = 'STABLE';
    else if (!tOk && dOk) stability = 'TECH-FLIP';
    else if (tOk && !dOk) stability = 'DAY-FLIP';
    else stability = 'BOTH-FLIP';
  }

  rows.push({
    jobNumber: job.jobNumber,
    client: job.client?.name || job.title || null,
    jobStatus: job.jobStatus,
    product: productOf(job),
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    geoStatus: p.geoStatus || null,
    zip: p.postalCode || null,
    city: p.city || null,
    street: p.street || null,
    latestActivity: cf(job, 'Latest Activity'),
    nextAction: cf(job, 'Next Action'),
    molesCaught: cf(job, 'Moles Caught (last visit)'),
    misses: cf(job, 'Misses (last visit)'),
    totalCaught: cf(job, 'Total Caught'),
    scheduledDefault: (job.visitSchedule?.assignedTo || []).map((x) => x?.name || x),
    recurrence: job.visitSchedule?.recurrence || null,
    completedVisits: comp,
    completedCount: comp.length,
    futureCount: (byJob.get(job.jobNumber) || []).filter((v) => !v.isComplete).length,
    handover,
    techTally,
    dayTally,
    dominantTech: tTop.value,
    techShare: techShare === null ? null : +techShare.toFixed(3),
    dominantWeekday: dTop.value,
    dayShare: dayShare === null ? null : +dayShare.toFixed(3),
    stability,
    inferred: false,
    // primary load measure: what this job actually consumed, per week, in the window
    weeklyEq: comp.length ? +(comp.length / WINDOW_WEEKS).toFixed(3) : null,
    weeklyEqSpacing: cad.weeklyEq === null ? null : +cad.weeklyEq.toFixed(3),
    medianGapDays: cad.medianGapDays,
    cadenceBasis: comp.length ? 'observed-throughput' : cad.basis,
    routeDay: tTop.value && dTop.value ? `${tTop.value}|${dTop.value}` : null,
  });
}

// ---------------------------------------------------------------- inference
const stable = rows.filter((r) => r.stability === 'STABLE' && r.lat != null);
const needInfer = rows.filter((r) => r.stability === 'NONE' && r.lat != null);

for (const r of needInfer) {
  const near = stable
    .map((s) => ({ s, d: hav(r, s) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, NEIGHBOURS);
  if (!near.length) continue;
  const votes = {};
  for (const { s, d } of near) {
    const w = 1 / Math.max(d, 0.1);
    votes[s.routeDay] = (votes[s.routeDay] || 0) + w;
  }
  const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const total = ranked.reduce((a, [, w]) => a + w, 0);
  const [rdKey, w] = ranked[0];
  const [tech, weekday] = rdKey.split('|');
  r.routeDay = rdKey;
  r.dominantTech = tech;
  r.dominantWeekday = weekday;
  r.inferred = true;
  r.inferredFrom = {
    neighbours: near.length,
    maxDistKm: +near[near.length - 1].d.toFixed(2),
    confidence: +(w / total).toFixed(3),
    runnerUp: ranked[1] ? ranked[1][0] : null,
  };
}

// weeklyEq fallback for future-only jobs: median observed rate for the same product
{
  const byProd = {};
  for (const r of rows) if (r.weeklyEq != null) (byProd[r.product] ||= []).push(r.weeklyEq);
  const fallback = Object.fromEntries(Object.entries(byProd).map(([k, v]) => [k, median(v)]));
  const globalFallback = median(rows.filter((r) => r.weeklyEq != null).map((r) => r.weeklyEq));
  let n = 0;
  for (const r of rows) {
    if (r.weeklyEq == null) {
      r.weeklyEq = +(fallback[r.product] ?? globalFallback).toFixed(3);
      r.cadenceBasis = `product-median-rate(${r.product})`;
      n++;
    }
  }
  say(
    `[cadence] observed weekly rate, product medians ${JSON.stringify(fallback)}; ${n} future-only jobs used the fallback`
  );
  const spacing = {};
  for (const r of rows) if (r.weeklyEqSpacing != null) (spacing[r.product] ||= []).push(r.weeklyEqSpacing);
  say(
    `[cadence] cross-check, spacing-derived medians ${JSON.stringify(
      Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, median(v)]))
    )}`
  );
  const totalObserved = rows.reduce((a, r) => a + r.completedCount, 0);
  say(
    `[cadence] ${totalObserved} completed visits / ${WINDOW_WEEKS.toFixed(2)} weeks = ${(
      totalObserved / WINDOW_WEEKS
    ).toFixed(1)} actual visits per week`
  );
}

// diagnostics: how scattered are the weekdays really?
{
  const multi = rows.filter((r) => r.completedCount >= 2);
  const buckets = { '1.00': 0, '0.80-0.99': 0, '0.60-0.79': 0, '0.50-0.59': 0, '<0.50': 0 };
  for (const r of multi) {
    const s = r.dayShare;
    if (s >= 1) buckets['1.00']++;
    else if (s >= 0.8) buckets['0.80-0.99']++;
    else if (s >= 0.6) buckets['0.60-0.79']++;
    else if (s >= 0.5) buckets['0.50-0.59']++;
    else buckets['<0.50']++;
  }
  say(`[diagnostic] weekday share among ${multi.length} multi-visit jobs: ${JSON.stringify(buckets)}`);
  const distinct = tally(multi.map((r) => Object.keys(r.dayTally).length));
  say(`[diagnostic] distinct weekdays per multi-visit job: ${JSON.stringify(distinct)}`);
  const vc = tally(multi.map((r) => r.completedCount));
  say(`[diagnostic] completed-visit count distribution: ${JSON.stringify(vc)}`);
}

// ---------------------------------------------------------------- summaries
const classCounts = tally(rows.map((r) => r.stability));
const inferredCount = rows.filter((r) => r.inferred).length;

const cycle = {};
for (const s of driveSummary) cycle[`${s.tech}|${s.dow}`] = s;

const routeDays = {};
for (const r of rows) {
  if (!r.routeDay) continue;
  const [tech, weekday] = r.routeDay.split('|');
  const k = r.routeDay;
  routeDays[k] ||= {
    routeDay: k,
    tech,
    weekday,
    jobs: 0,
    stableJobs: 0,
    inferredJobs: 0,
    flipJobs: 0,
    singleJobs: 0,
    activeJobs: 0,
    weeklyEqVisits: 0,
    latSum: 0,
    lngSum: 0,
    geo: 0,
    zips: {},
    cities: {},
    products: {},
  };
  const d = routeDays[k];
  d.jobs++;
  if (r.stability === 'STABLE') d.stableJobs++;
  if (r.inferred) d.inferredJobs++;
  if (r.stability.endsWith('FLIP')) d.flipJobs++;
  if (r.stability === 'SINGLE') d.singleJobs++;
  if (r.jobStatus !== 'archived') d.activeJobs++;
  d.weeklyEqVisits += r.weeklyEq || 0;
  if (r.lat != null) {
    d.latSum += r.lat;
    d.lngSum += r.lng;
    d.geo++;
  }
  if (r.zip) d.zips[r.zip] = (d.zips[r.zip] || 0) + 1;
  if (r.city) d.cities[r.city] = (d.cities[r.city] || 0) + 1;
  d.products[r.product] = (d.products[r.product] || 0) + 1;
}

for (const d of Object.values(routeDays)) {
  d.weeklyEqVisits = +d.weeklyEqVisits.toFixed(1);
  d.centroid = d.geo
    ? { lat: +(d.latSum / d.geo).toFixed(5), lng: +(d.lngSum / d.geo).toFixed(5) }
    : null;
  delete d.latSum;
  delete d.lngSum;
  delete d.geo;
  const c = cycle[d.routeDay];
  if (c) {
    d.observed = {
      medianStops: c.medianStops,
      medianSpanH: c.medianSpanH,
      medianDriveH: c.medianDriveH,
      driveMinPerStop: c.driveMinPerStop,
      weeks: c.weeks,
    };
    const spanPerStop = c.medianStops ? (c.medianSpanH * 60) / c.medianStops : null;
    d.minutesPerStopObserved = spanPerStop ? +spanPerStop.toFixed(1) : null;
    d.weeklyHours = spanPerStop ? +((spanPerStop * d.weeklyEqVisits) / 60).toFixed(1) : null;
  } else {
    d.observed = null;
    d.minutesPerStopObserved = null;
    d.weeklyHours = null;
  }
  d.topZips = Object.entries(d.zips).sort((a, b) => b[1] - a[1]).slice(0, 8);
  d.topCities = Object.entries(d.cities).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

const orderedRouteDays = Object.values(routeDays).sort(
  (a, b) =>
    a.tech.localeCompare(b.tech) || WORKDAYS.indexOf(a.weekday) - WORKDAYS.indexOf(b.weekday)
);

const handovers = {};
for (const r of rows) {
  if (!r.handover) continue;
  const k = `${r.handover.from} -> ${r.handover.to}`;
  handovers[k] ||= { pair: k, jobs: 0, dates: {} };
  handovers[k].jobs++;
  handovers[k].dates[r.handover.date] = (handovers[k].dates[r.handover.date] || 0) + 1;
}

const out = {
  generatedAt: new Date().toISOString(),
  source: 'jobs.json + visits.json (completed visits only); no rulebook consulted',
  window: { ...WINDOW, weeks: +WINDOW_WEEKS.toFixed(2) },
  method: {
    weekday: 'Pacific (UTC-7) date of visit startAt',
    tech: 'visits.json techs[0] on completed visits',
    stableThreshold: STABLE_THRESHOLD,
    handover: 'single sustained tech change point; post-handover segment defines the tech',
    inference: `${NEIGHBOURS}-nearest STABLE jobs, inverse-distance weighted vote on tech|weekday`,
    weeklyEq: 'min(1, 7 / median gap between the job own scheduled visit dates)',
    weeklyHours: 'route-day observed median span per stop x weekly-equivalent stops',
  },
  summary: {
    jobs: rows.length,
    classCounts,
    inferred: inferredCount,
    withCoordinates: rows.filter((r) => r.lat != null).length,
    unassigned: rows.filter((r) => !r.routeDay).length,
    handovers: Object.values(handovers),
    routeDayCount: orderedRouteDays.length,
  },
  routeDays: orderedRouteDays,
  jobs: rows,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));

say('');
say('=== STABILITY CLASSES ===');
for (const [k, v] of Object.entries(classCounts).sort((a, b) => b[1] - a[1]))
  say(`  ${k.padEnd(10)} ${String(v).padStart(5)}  ${((v / rows.length) * 100).toFixed(1)}%`);
say(`  INFERRED (subset of NONE): ${inferredCount}`);
say(`  unassigned (no route-day at all): ${out.summary.unassigned}`);
say('');
say('=== HANDOVERS ===');
for (const h of Object.values(handovers))
  say(`  ${h.pair}: ${h.jobs} jobs; dates ${JSON.stringify(h.dates)}`);
say('');
say('=== ROUTE-DAY LOAD ===');
say('  tech               dow  jobs  actv  stab infer  flip  wkEqVis  min/stop  hours');
for (const d of orderedRouteDays) {
  say(
    `  ${d.tech.padEnd(18)} ${d.weekday.padEnd(4)} ${String(d.jobs).padStart(4)} ${String(
      d.activeJobs
    ).padStart(5)} ${String(d.stableJobs).padStart(5)} ${String(d.inferredJobs).padStart(
      5
    )} ${String(d.flipJobs).padStart(5)} ${String(d.weeklyEqVisits).padStart(8)} ${String(
      d.minutesPerStopObserved ?? '-'
    ).padStart(9)} ${String(d.weeklyHours ?? '-').padStart(6)}`
  );
}
const totJobs = orderedRouteDays.reduce((a, d) => a + d.jobs, 0);
const totVis = orderedRouteDays.reduce((a, d) => a + d.weeklyEqVisits, 0);
const totH = orderedRouteDays.reduce((a, d) => a + (d.weeklyHours || 0), 0);
say(`  TOTAL: ${totJobs} jobs, ${totVis.toFixed(1)} weekly-equivalent visits, ${totH.toFixed(1)} h/week`);
say('');
say(`wrote ${OUT}`);

fs.writeFileSync(path.join(ROOT, 'redesign/data/derive-master.log'), log.join('\n') + '\n');
