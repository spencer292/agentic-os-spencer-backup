#!/usr/bin/env node
// BUILD SEAM PACK — the five ownership seams, costed, for Spencer's ownership-register sitting.
//
// Reads only derived redesign data plus territories.json v9 (read once, to state what the FILE
// says so the no-decision default is visible). Writes:
//   redesign/data/seam-pack.json
//   redesign/seam-pack.html
//
// Hours use each tech's own GPS-measured cycle time (cycle-times-gps.json), per weekday where a
// weekday sample exists, so a dense day and a spread day are never costed at one rate.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');            // redesign/
const DATA = path.join(ROOT, 'data');
const TRA = path.resolve(ROOT, '../../technician-route-automation');

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const master = read(path.join(DATA, 'master-asbuilt.json'));
const territory = read(path.join(DATA, 'territory-asbuilt.json'));
const cycle = read(path.join(DATA, 'cycle-times-gps.json'));
const gps = read(path.join(DATA, 'gps-ground-truth.json'));
const ledger = read(path.join(DATA, 'route-day-ledger.json'));
const jobberJobs = read(path.join(DATA, 'jobber', 'jobs.json'));
const v9 = read(path.join(TRA, 'territories.json'));

const JOBS = master.jobs;
const byNum = new Map(JOBS.map((j) => [j.jobNumber, j]));

// ---------------------------------------------------------------- helpers

const R_KM = 6371;
const rad = (d) => (d * Math.PI) / 180;
function km(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(s));
}
const r1 = (n) => (n == null ? null : Math.round(n * 10) / 10);
const r2 = (n) => (n == null ? null : Math.round(n * 100) / 100);
const DOWS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// ---------------------------------------------------------------- cycle times

const cycleByTechDow = new Map();
for (const r of cycle.byTechDow) cycleByTechDow.set(`${r.tech}|${r.dow}`, r.cycleMinPerStop);
const cycleByTech = new Map();
for (const r of cycle.byTech) cycleByTech.set(r.tech, r.cycleMinPerStop ?? r.medianCycleMinPerStop);
const GLOBAL_CYCLE = cycle.globalCycleMinPerStop;

function cycleMin(tech, dow) {
  return cycleByTechDow.get(`${tech}|${dow}`) ?? cycleByTech.get(tech) ?? GLOBAL_CYCLE;
}
// hours a job costs a given tech on a given day
function jobHours(job, tech, dow) {
  return (job.weeklyEq * cycleMin(tech, dow)) / 60;
}

// ---------------------------------------------------------------- homes

const HOMES = {};
for (const t of gps.perTech) {
  if (t.home && t.home.lat != null) {
    HOMES[t.tech] = { lat: t.home.lat, lng: t.home.lng, street: t.home.street, city: t.home.city, zip: t.home.zip };
  }
}

// ---------------------------------------------------------------- baseline hours

// Current as-built: every job sits on its routeDay (tech|weekday). Cost it at that tech's
// own cycle time for that weekday.
const routeDayOf = new Map();  // jobNumber -> {tech, dow}
for (const j of JOBS) {
  const [tech, dow] = j.routeDay.split('|');
  routeDayOf.set(j.jobNumber, { tech, dow });
}
const TECHS = [...new Set(JOBS.map((j) => routeDayOf.get(j.jobNumber).tech))].sort();

function baselineHours() {
  const out = {};
  for (const t of TECHS) out[t] = 0;
  for (const j of JOBS) {
    const { tech, dow } = routeDayOf.get(j.jobNumber);
    out[tech] += jobHours(j, tech, dow);
  }
  for (const t of TECHS) out[t] = r1(out[t]);
  return out;
}
const BASE_HOURS = baselineHours();

// Paid-hours reality anchor (S2b), per tech per week.
const PAID = {};
for (const p of ledger.perTech) {
  const weeks = ledger.weekly.filter((w) => w.tech === p.tech && w.fieldDays > 0).length || 1;
  PAID[p.tech] = { paidHoursPerWeek: r1(p.paidHours / weeks), fieldDays: p.fieldDays, salaried: !!p.salaried, redDays: p.red };
}

// ---------------------------------------------------------------- pattern medoids

// A tech's "pattern" for a weekday is the settled (STABLE) ground it works that day.
// The medoid is the real customer point that minimises total distance to the rest — an
// honest anchor for "how far off-pattern is this stop", where a centroid can land in water.
const MEDOIDS = [];
for (const t of TECHS) {
  for (const d of DOWS) {
    const all = JOBS.filter((j) => {
      const rd = routeDayOf.get(j.jobNumber);
      return rd.tech === t && rd.dow === d;
    });
    const stable = all.filter((j) => j.stability === 'STABLE');
    const pool = stable.length >= 3 ? stable : all;
    if (!pool.length) continue;
    let best = null, bestSum = Infinity;
    for (const a of pool) {
      let sum = 0;
      for (const b of pool) sum += km(a, b) ?? 0;
      if (sum < bestSum) { bestSum = sum; best = a; }
    }
    const cities = {};
    for (const j of pool) cities[j.city] = (cities[j.city] || 0) + 1;
    MEDOIDS.push({
      tech: t, weekday: d, basis: stable.length >= 3 ? 'stable' : 'all-assigned',
      pool: pool.length, stable: stable.length,
      lat: r2(best.lat), lng: r2(best.lng),
      anchorJob: best.jobNumber, anchorCity: best.city,
      topCities: Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 3),
    });
  }
}
const medoidsByTech = new Map(TECHS.map((t) => [t, MEDOIDS.filter((m) => m.tech === t)]));

function nearestMedoid(pt, tech) {
  let best = null, bd = Infinity;
  for (const m of medoidsByTech.get(tech) || []) {
    const d = km(pt, m);
    if (d != null && d < bd) { bd = d; best = m; }
  }
  return best ? { weekday: best.weekday, km: r1(bd), anchorCity: best.anchorCity, anchorJob: best.anchorJob } : null;
}

// ---------------------------------------------------------------- customer rows

const defaultAssignee = new Map();
for (const j of jobberJobs) {
  const a = j.visitSchedule?.assignedTo || [];
  defaultAssignee.set(j.jobNumber, a.length ? a.map((x) => (typeof x === 'string' ? x : x.name)).join(' + ') : null);
}

function customerRow(j) {
  const rd = routeDayOf.get(j.jobNumber);
  const byTechDow = {};
  for (const v of j.completedVisits || []) {
    byTechDow[v.tech] = byTechDow[v.tech] || {};
    byTechDow[v.tech][v.weekday] = (byTechDow[v.tech][v.weekday] || 0) + 1;
  }
  return {
    jobNumber: j.jobNumber,
    client: j.client,
    address: `${j.street}, ${j.city} ${j.zip}`,
    street: j.street, city: j.city, zip: j.zip,
    product: j.product,
    jobStatus: j.jobStatus,
    weeklyEqVisits: j.weeklyEq,
    completedVisits: j.completedCount,
    completedByTechWeekday: byTechDow,
    fieldTech: rd.tech,
    fieldWeekday: rd.dow,
    stability: j.stability,
    inferred: !!j.inferred,
    currentDefaultAssignee: defaultAssignee.get(j.jobNumber) || null,
    lat: j.lat, lng: j.lng,
  };
}

// ---------------------------------------------------------------- option costing

// An option hands a customer set to (tech, weekday). Everything else on the board stays put.
function costOption(rows, owner, weekday, { keepWeekdayOf = null } = {}) {
  const delta = {};
  for (const t of TECHS) delta[t] = 0;
  let moved = 0, movedHours = 0;
  for (const r of rows) {
    const j = byNum.get(r.jobNumber);
    const fromH = jobHours(j, r.fieldTech, r.fieldWeekday);
    const toDow = keepWeekdayOf ? keepWeekdayOf(r) : weekday;
    const toH = jobHours(j, owner, toDow);
    delta[r.fieldTech] -= fromH;
    delta[owner] += toH;
    if (r.fieldTech !== owner) { moved++; movedHours += toH; }
  }
  const after = {};
  for (const t of TECHS) after[t] = r1(BASE_HOURS[t] + delta[t]);
  for (const t of TECHS) delta[t] = r1(delta[t]);
  return {
    owner, weekday,
    customersMoved: moved,
    hoursMoved: r1(movedHours),
    hoursDelta: delta,
    hoursAfter: after,
    spreadAfter: r1(Math.max(...Object.values(after)) - Math.min(...Object.values(after))),
  };
}

function driveProfile(rows, tech) {
  const home = HOMES[tech];
  const dh = rows.map((r) => km(r, home)).filter((x) => x != null).sort((a, b) => a - b);
  const dm = rows.map((r) => nearestMedoid(r, tech)).filter(Boolean).map((m) => m.km).sort((a, b) => a - b);
  const med = (a) => (a.length ? r1(a[Math.floor(a.length / 2)]) : null);
  return {
    tech,
    home: home ? { ...home, lat: r2(home.lat), lng: r2(home.lng) } : null,
    medianKmFromHome: med(dh),
    maxKmFromHome: dh.length ? r1(dh[dh.length - 1]) : null,
    medianKmToNearestPatternMedoid: med(dm),
    maxKmToNearestPatternMedoid: dm.length ? r1(dm[dm.length - 1]) : null,
  };
}

function fieldSplit(rows) {
  const t = {}, d = {}, td = {};
  for (const r of rows) {
    t[r.fieldTech] = (t[r.fieldTech] || 0) + 1;
    d[r.fieldWeekday] = (d[r.fieldWeekday] || 0) + 1;
    const k = `${r.fieldTech}|${r.fieldWeekday}`;
    td[k] = (td[k] || 0) + 1;
  }
  const srt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);
  return { byTech: srt(t), byWeekday: srt(d), byTechWeekday: srt(td).slice(0, 8) };
}

// ---------------------------------------------------------------- SR-516 side (v9 geoSplit)

function classifyPoint(line, lat, lon) {
  let seg = null;
  for (const s of line.segments) {
    const okLo = s.appliesWhenLonAtLeast == null || lon >= s.appliesWhenLonAtLeast;
    const okHi = s.appliesWhenLonBelow == null || lon < s.appliesWhenLonBelow;
    if (okLo && okHi) { seg = s; break; }
  }
  if (!seg) seg = line.segments[line.segments.length - 1];
  const t = (lon - seg.from.lon) / (seg.to.lon - seg.from.lon);
  const boundaryLat = seg.from.lat + t * (seg.to.lat - seg.from.lat);
  return (lat - boundaryLat) >= 0 ? 'NORTH' : 'SOUTH';
}
const SR516 = v9.geoSplitLines['sr-516'];
const V9_REGIONS = Array.isArray(v9.regions)
  ? v9.regions
  : Object.entries(v9.regions).map(([k, v]) => ({ key: k, ...v }));
const regionOf = (key) => V9_REGIONS.find((r) => r.key === key);

// ---------------------------------------------------------------- the five seams

const SEAMS = [];

// ---- SEAM 1 — Buckley / Bonney Lake / Lake Tapps / Sumner ------------------
{
  const reg = regionOf('Buckley / Bonney Lake / Lake Tapps / Sumner');
  const rows = JOBS.filter((j) => reg.zips.includes(j.zip)).map(customerRow);
  const A = costOption(rows, 'Robert Norton', 'fri', { keepWeekdayOf: (r) => (r.fieldTech === 'Robert Norton' ? r.fieldWeekday : 'fri') });
  const B = costOption(rows, 'Cory Ventura', 'fri', { keepWeekdayOf: () => 'fri' });
  SEAMS.push({
    id: 'S1', name: 'Buckley / Bonney Lake / Lake Tapps / Sumner',
    question: 'The file gives this block to Cory because he lives in Buckley. The field has run it as Robert’s for the whole window. Who owns it?',
    zips: reg.zips, customers: rows.length,
    fileSays: { owner: reg.ownerFrom_2026_08_17, rhythm: reg.rhythm, region: reg.key, matchPct: 6 },
    fieldRuns: fieldSplit(rows),
    noDecisionDefault: 'Robert Norton keeps all 93 in the field; territories.json v9 keeps saying Cory, so assign-by-territory would hand them back to Cory the next time it runs.',
    candidates: [
      { label: 'A — ratify the field: Robert Norton', ...A, drive: driveProfile(rows, 'Robert Norton') },
      { label: 'B — enforce the file: Cory Ventura', ...B, drive: driveProfile(rows, 'Cory Ventura') },
    ],
    rows,
  });
}

// ---- SEAM 2 — North of SR-516 (Des Moines / Kent North / Maple Valley) -----
{
  const reg = regionOf('North of SR-516 (Des Moines / Kent North / Maple Valley)');
  // The SR-516 geoSplit divides this region from "South of SR-516", but BOTH regions have the
  // same owner from 2026-08-17 (Robert Norton) — the line splits the DAY, not the owner. An
  // ownership seam therefore takes the whole zip list, which is the 88 S3a reports.
  const split = new Set(reg.geoSplit.appliesToZips);
  const rows = JOBS.filter((j) => reg.zips.includes(j.zip)).map((j) => ({
    ...customerRow(j),
    sr516Side: split.has(j.zip) ? classifyPoint(SR516, j.lat, j.lng) : 'n/a',
  }));
  const A = costOption(rows, 'Cory Ventura', 'mon', { keepWeekdayOf: (r) => (r.fieldTech === 'Cory Ventura' ? r.fieldWeekday : 'mon') });
  const B = costOption(rows, 'Robert Norton', 'mon', { keepWeekdayOf: () => 'mon' });
  SEAMS.push({
    id: 'S2', name: 'Kent North / Maple Valley (north of SR-516)',
    question: 'The mirror image of S1. The file gives this block to Robert; the field runs it as Cory’s. In effect the two men swapped the blocks the v9 cut gave them.',
    zips: reg.zips,
    geoSplit: 'The sr-516 line splits this region from "South of SR-516" by DAY only — both regions have the same owner from 2026-08-17, so an ownership seam takes the whole zip list. Each customer carries its sr516Side for the day question.',
    customers: rows.length,
    fileSays: { owner: reg.ownerFrom_2026_08_17, rhythm: reg.rhythm, region: reg.key, matchPct: 6 },
    fieldRuns: fieldSplit(rows),
    noDecisionDefault: 'Cory Ventura keeps the block in the field; the file keeps saying Robert. Deciding S1 and S2 together is the same decision twice — ratifying both swaps is one trade, not two.',
    candidates: [
      { label: 'A — ratify the field: Cory Ventura', ...A, drive: driveProfile(rows, 'Cory Ventura') },
      { label: 'B — enforce the file: Robert Norton', ...B, drive: driveProfile(rows, 'Robert Norton') },
    ],
    rows,
  });
}

// ---- SEAM 3 — the two exact ties ------------------------------------------
{
  const groups = [];
  for (const [zip, city, tA, tB] of [
    ['98059', 'Renton', 'Cory Ventura', 'Tavis Alexander'],
    ['98092', 'Auburn', 'Cory Ventura', 'Robert Norton'],
  ]) {
    const rows = JOBS.filter((j) => j.zip === zip).map(customerRow);
    const zrec = territory.zips.find((z) => z.zip === zip);
    const domDay = zrec?.dominantWeekday || 'mon';
    const A = costOption(rows, tA, domDay, { keepWeekdayOf: (r) => (r.fieldTech === tA ? r.fieldWeekday : domDay) });
    const B = costOption(rows, tB, domDay, { keepWeekdayOf: (r) => (r.fieldTech === tB ? r.fieldWeekday : domDay) });
    groups.push({
      zip, city, customers: rows.length,
      zipRecord: zrec ? { techSplit: zrec.techSplit, weekdaySplit: zrec.weekdaySplit, dominantWeekday: zrec.dominantWeekday } : null,
      fieldRuns: fieldSplit(rows),
      candidates: [
        { label: `A — ${tA}`, ...A, drive: driveProfile(rows, tA) },
        { label: `B — ${tB}`, ...B, drive: driveProfile(rows, tB) },
      ],
      rows,
    });
  }
  SEAMS.push({
    id: 'S3', name: 'The two exact ties — 98059 Renton and 98092 Auburn',
    question: 'Two zips where the field is split down the middle. No owner can be derived — the data has no majority to read.',
    customers: groups.reduce((n, g) => n + g.customers, 0),
    fileSays: {
      '98059': { owner: regionOf('Renton / Newcastle')?.ownerFrom_2026_08_17, region: 'Renton / Newcastle', rhythm: regionOf('Renton / Newcastle')?.rhythm },
      '98092': { owner: regionOf('South of SR-516 (Auburn / Kent South / Pacific)')?.ownerFrom_2026_08_17, region: 'South of SR-516 (Auburn / Kent South / Pacific)', rhythm: regionOf('South of SR-516 (Auburn / Kent South / Pacific)')?.rhythm },
    },
    noDecisionDefault: 'Both zips stay split. Every customer in them keeps flipping between two techs, and neither zip can ever be quoted a service day.',
    fieldRuns: fieldSplit(groups.flatMap((g) => g.rows)),
    groups,
    rows: groups.flatMap((g) => g.rows),
  });
}

// ---- SEAM 4 — the 51 islands ----------------------------------------------
{
  const islands = territory.overlaps.filter((o) => o.assignedMatchesMajority === false);
  const rows = islands.map((o) => {
    const j = byNum.get(o.jobNumber);
    const base = customerRow(j);
    const majority = o.countA >= o.countB ? o.techA : o.techB;
    const minority = majority === o.techA ? o.techB : o.techA;
    return {
      ...base,
      neighbourMajorityTech: majority === base.fieldTech ? minority : majority,
      neighbourSplit: o.neighbourSplit,
      neighbourRadiusKm: o.neighbourRadiusKm,
      pair: `${o.techA} / ${o.techB}`,
    };
  });
  // Option A: leave every island where it is (no move at all).
  const A = costOption(rows, null, null, { keepWeekdayOf: (r) => r.fieldWeekday });
  // costOption needs a single owner; do the "leave" case by hand.
  const leave = { owner: 'no change', weekday: 'as-is', customersMoved: 0, hoursMoved: 0, hoursDelta: Object.fromEntries(TECHS.map((t) => [t, 0])), hoursAfter: { ...BASE_HOURS }, spreadAfter: r1(Math.max(...Object.values(BASE_HOURS)) - Math.min(...Object.values(BASE_HOURS))) };
  // Option B: hand each island to the tech its neighbours say owns the ground, on that tech's
  // nearest pattern weekday.
  const deltaB = Object.fromEntries(TECHS.map((t) => [t, 0]));
  let movedB = 0, movedHoursB = 0;
  for (const r of rows) {
    const j = byNum.get(r.jobNumber);
    const to = r.neighbourMajorityTech;
    if (!TECHS.includes(to)) continue;
    const nm = nearestMedoid(r, to);
    const toDow = nm ? nm.weekday : r.fieldWeekday;
    const fromH = jobHours(j, r.fieldTech, r.fieldWeekday);
    const toH = jobHours(j, to, toDow);
    deltaB[r.fieldTech] -= fromH;
    deltaB[to] += toH;
    movedB++; movedHoursB += toH;
    r.proposedWeekday = toDow;
    r.kmToProposedPatternMedoid = nm ? nm.km : null;
    r.kmToCurrentPatternMedoid = nearestMedoid(r, r.fieldTech)?.km ?? null;
  }
  const afterB = Object.fromEntries(TECHS.map((t) => [t, r1(BASE_HOURS[t] + deltaB[t])]));
  const optB = {
    owner: 'neighbour-majority tech, per customer', weekday: 'that tech’s nearest pattern day',
    customersMoved: movedB, hoursMoved: r1(movedHoursB),
    hoursDelta: Object.fromEntries(TECHS.map((t) => [t, r1(deltaB[t])])),
    hoursAfter: afterB,
    spreadAfter: r1(Math.max(...Object.values(afterB)) - Math.min(...Object.values(afterB))),
  };
  const pairCount = {};
  for (const r of rows) pairCount[`${r.fieldTech} → ${r.neighbourMajorityTech}`] = (pairCount[`${r.fieldTech} → ${r.neighbourMajorityTech}`] || 0) + 1;

  SEAMS.push({
    id: 'S4', name: 'The 51 islands — customers held by a tech their neighbours contradict',
    question: 'Fifty-one customers sit inside ground that a different tech’s settled work surrounds. Are they exceptions worth keeping, or drift to be tidied?',
    customers: rows.length,
    fileSays: { note: 'territories.json has no concept of an island. Every one of these would be reassigned by zip on the next assign-by-territory run, with no record that it was deliberate.' },
    fieldRuns: fieldSplit(rows),
    moveDirections: Object.entries(pairCount).sort((a, b) => b[1] - a[1]),
    worstPocket: { description: '21 Cory Ventura customers inside Robert Norton’s settled ground', count: rows.filter((r) => r.fieldTech === 'Cory Ventura' && r.neighbourMajorityTech === 'Robert Norton').length },
    noDecisionDefault: 'All 51 stay where they are, unrecorded. The register gains nothing and the next territory run silently moves an unknown number of them.',
    candidates: [
      { label: 'A — leave every island, record each as a named exception', ...leave, drive: null },
      { label: 'B — hand each island to the tech its neighbours say owns the ground', ...optB, drive: null },
    ],
    rows,
  });
  void A;
}

// ---- SEAM 5 — Snoqualmie Valley -------------------------------------------
{
  const cities = ['North Bend', 'Snoqualmie', 'Fall City', 'Carnation'];
  const rows = JOBS.filter((j) => cities.includes(j.city)).map(customerRow);
  const reg = regionOf('Snoqualmie Valley / Duvall');
  const duvall = JOBS.filter((j) => j.city === 'Duvall').map(customerRow);
  const A = costOption(rows, 'Tavis Alexander', 'fri', { keepWeekdayOf: () => 'fri' });
  const B = costOption(rows, 'Alias Franks', 'thu', { keepWeekdayOf: () => 'thu' });
  SEAMS.push({
    id: 'S5', name: 'Snoqualmie Valley — North Bend, Snoqualmie, Fall City, Carnation',
    question: 'The file puts the valley on Alias, Thursday, as a deliberate 2026-08-07 decision. The field runs 28 of 39 as Tavis on Friday, and the weekday is completely clean.',
    cities, customers: rows.length,
    fileSays: { owner: reg.ownerFrom_2026_08_17, rhythm: reg.rhythm, region: reg.key, matchPct: 40, note: reg.note?.slice(0, 220) },
    fieldRuns: fieldSplit(rows),
    sideNote: `The v9 region also carries Duvall 98019 (${duvall.length} customers here) as the Wednesday overflow catcher. Duvall is excluded from this seam — it is a different decision.`,
    memoryNote: 'CLAUDE.local.md records "Tavis on Snoqualmie is intentional". The data confirms it, and confirms the warning: assign-by-territory reading v9 hands all 39 back to Alias on Thursday.',
    noDecisionDefault: 'Tavis keeps running it on Friday while the file says Alias/Thursday, and the memory note is the only thing stopping a script from undoing it.',
    candidates: [
      { label: 'A — ratify the field: Tavis Alexander, Friday', ...A, drive: driveProfile(rows, 'Tavis Alexander') },
      { label: 'B — enforce the file: Alias Franks, Thursday', ...B, drive: driveProfile(rows, 'Alias Franks') },
    ],
    rows,
  });
}

// ---------------------------------------------------------------- whose doorstep

// A seam sits on a tech's doorstep when that tech's home address falls inside the seam's own
// zips or cities. v9 cut the board partly on doorsteps, so this is the file's own rationale
// measured against the field.
for (const s of SEAMS) {
  const zipset = new Set(s.rows.map((r) => r.zip));
  const cityset = new Set(s.rows.map((r) => r.city));
  s.homesInsideSeam = Object.entries(HOMES)
    .filter(([, h]) => zipset.has(h.zip) || cityset.has(h.city))
    .map(([tech, h]) => ({ tech, city: h.city, zip: h.zip, isCandidate: (s.candidates || []).some((c) => c.owner === tech) || (s.groups || []).some((g) => g.candidates.some((c) => c.owner === tech)) }));
}

// ---------------------------------------------------------------- the paired swap

// S1 and S2 are one trade, not two: v9 gave Cory the Buckley block and Robert the Kent North
// block, and the field swapped them. Costing them together is the only honest way to read
// either, because each alone looks catastrophic for load.
function costJoint(assignments) {
  const delta = Object.fromEntries(TECHS.map((t) => [t, 0]));
  let moved = 0;
  for (const { rows, owner, dayOf } of assignments) {
    for (const r of rows) {
      const j = byNum.get(r.jobNumber);
      const toDow = dayOf(r);
      delta[r.fieldTech] -= jobHours(j, r.fieldTech, r.fieldWeekday);
      delta[owner] += jobHours(j, owner, toDow);
      if (r.fieldTech !== owner) moved++;
    }
  }
  const after = Object.fromEntries(TECHS.map((t) => [t, r1(BASE_HOURS[t] + delta[t])]));
  return {
    customersMoved: moved,
    hoursDelta: Object.fromEntries(TECHS.map((t) => [t, r1(delta[t])])),
    hoursAfter: after,
    spreadAfter: r1(Math.max(...Object.values(after)) - Math.min(...Object.values(after))),
  };
}
const S1ROWS = SEAMS[0].rows, S2ROWS = SEAMS[1].rows;
const jointRatify = costJoint([
  { rows: S1ROWS, owner: 'Robert Norton', dayOf: (r) => (r.fieldTech === 'Robert Norton' ? r.fieldWeekday : 'fri') },
  { rows: S2ROWS, owner: 'Cory Ventura', dayOf: (r) => (r.fieldTech === 'Cory Ventura' ? r.fieldWeekday : 'mon') },
]);
const jointEnforce = costJoint([
  { rows: S1ROWS, owner: 'Cory Ventura', dayOf: () => 'fri' },
  { rows: S2ROWS, owner: 'Robert Norton', dayOf: () => 'mon' },
]);
const PAIRED = {
  name: 'S1 + S2 taken together — the swap',
  note: 'v9 put each man on his own doorstep: Cory lives in Buckley 98321, Robert lives in Maple Valley 98038. The field swapped the two blocks, so each now drives past the other’s ground to reach his own. Costed separately each half looks ruinous for load; costed together they very nearly cancel.',
  commuteMedianKm: {
    'ratify both': { 'Robert Norton on Buckley': SEAMS[0].candidates[0].drive.medianKmFromHome, 'Cory Ventura on Kent North': SEAMS[1].candidates[0].drive.medianKmFromHome },
    'enforce both': { 'Cory Ventura on Buckley': SEAMS[0].candidates[1].drive.medianKmFromHome, 'Robert Norton on Kent North': SEAMS[1].candidates[1].drive.medianKmFromHome },
  },
  options: [
    { label: 'Ratify both — Robert keeps Buckley, Cory keeps Kent North', ...jointRatify },
    { label: 'Enforce both — swap them back to the file', ...jointEnforce },
  ],
};
SEAMS[0].paired = PAIRED;
SEAMS[1].paired = PAIRED;

// ---------------------------------------------------------------- recommendations

function pick(seam, idx, line) {
  seam.recommendation = { option: seam.candidates ? seam.candidates[idx].label : null, line };
}

const s1 = SEAMS[0], s2 = SEAMS[1], s3 = SEAMS[2], s4 = SEAMS[3], s5 = SEAMS[4];

const jr = PAIRED.options[0], je = PAIRED.options[1];
pick(s1, 0, `Ratify Robert — but decide it in the same breath as S2, because the two are one swap. Alone, enforcing the file moves ${s1.candidates[1].customersMoved} customers onto Cory and throws the fleet spread to ${s1.candidates[1].spreadAfter} h. Taken with S2, enforcing both is defensible on paper: spread ${je.spreadAfter} h against ${jr.spreadAfter} h for ratifying and ${r1(Math.max(...Object.values(BASE_HOURS)) - Math.min(...Object.values(BASE_HOURS)))} h today, and it puts each man back on his own doorstep. It still loses, for two reasons the table does not show: it moves ${je.customersMoved} customers against ${jr.customersMoved}, and it hands a block with the cleanest rhythm on Robert’s board (Friday ${s1.fieldRuns.byWeekday.find(([d]) => d === 'fri')?.[1] ?? 0} / Wednesday ${s1.fieldRuns.byWeekday.find(([d]) => d === 'wed')?.[1] ?? 0}) to the tech whose own book is 4% day-stable.`);
pick(s2, 0, `Ratify Cory, as the other half of that swap. ${s2.fieldRuns.byTech[0][1]} of ${s2.customers} are already his, and enforcing this half alone puts Robert at ${s2.candidates[1].hoursAfter['Robert Norton']} h — the heaviest week anyone has run. Be honest about the price of ratifying: Robert lives in Maple Valley, a median ${s2.candidates[1].drive.medianKmFromHome} km from this block against Cory’s ${s2.candidates[0].drive.medianKmFromHome} km, and Cory lives in Buckley, ${s1.candidates[1].drive.medianKmFromHome} km from S1 against Robert’s ${s1.candidates[0].drive.medianKmFromHome} km. Ratifying asks both men to drive past each other every morning, unpaid. That is the argument for revisiting the swap once Cory’s book has a day grid — not for making it now.`);
// seam 3 drive detail, computed before the recommendation so the line can quote it
for (const g of s3.groups) {
  const [a, b] = g.candidates;
  g.driveVerdict = `${a.drive.tech} median ${a.drive.medianKmToNearestPatternMedoid} km to pattern / ${a.drive.medianKmFromHome} km from home; ${b.drive.tech} median ${b.drive.medianKmToNearestPatternMedoid} km to pattern / ${b.drive.medianKmFromHome} km from home.`;
  const closer = a.drive.medianKmFromHome <= b.drive.medianKmFromHome ? a : b;
  g.recommendation = {
    option: closer.label,
    line: `The field cannot choose — the zip is an exact tie. Drive can: ${closer.drive.tech} is ${r1(Math.abs(a.drive.medianKmFromHome - b.drive.medianKmFromHome))} km closer from home at the median and ${closer.drive.medianKmToNearestPatternMedoid} km from their nearest pattern, so give ${g.zip} to ${closer.drive.tech} and stop the flipping.`,
  };
}
{
  const [r98059, r98092] = s3.groups;
  pick(s3, null, `The data cannot recommend on field evidence — both zips are exact ties with no majority to read, and ${s3.customers} customers keep flipping between two techs. Drive breaks both: ${esc0(r98059.recommendation.option)} for 98059 Renton and ${esc0(r98092.recommendation.option)} for 98092 Auburn. One thing the tie hides: Tavis Alexander lives in 98092 Auburn and holds none of its ${r98092.customers} customers — he is not on the ballot the field drew, and he should be.`);
}
function esc0(s) { return String(s).replace(/^[AB] — /, ''); }
pick(s4, 0, `Leave the islands, but write each one down. Handing all ${s4.candidates[1].customersMoved} to their neighbour majority moves only ${s4.candidates[1].hoursMoved} h and buys tidier lines, not fewer hours — and several are known deliberate exceptions. The value is the register entry, not the move.`);
pick(s5, 0, 'Ratify Tavis on Friday. North Bend 98045 is Friday 19 of 19 — the weekday is clean and only the owner is contested, so ratifying costs no customer a service-day change, while enforcing the file moves 28 customers and changes their day.');

// ---------------------------------------------------------------- seam overlap

// The five seams are not disjoint sets. A customer can be both an exact-tie zip member and an
// island. Deciding one seam therefore changes what the other is asking about.
const seamMembers = new Map(SEAMS.map((s) => [s.id, new Set(s.rows.map((r) => r.jobNumber))]));
const seamOverlap = [];
for (let i = 0; i < SEAMS.length; i++) {
  for (let k = i + 1; k < SEAMS.length; k++) {
    const a = seamMembers.get(SEAMS[i].id), b = seamMembers.get(SEAMS[k].id);
    const shared = [...a].filter((n) => b.has(n));
    if (shared.length) seamOverlap.push({ seams: [SEAMS[i].id, SEAMS[k].id], shared: shared.length, jobNumbers: shared });
  }
}

// ---------------------------------------------------------------- write JSON

const pack = {
  generatedAt: new Date().toISOString(),
  stage: 'S7a',
  purpose: 'Decision pack for the ownership-register sitting. Five seams, costed, with the no-decision default stated for each.',
  window: master.window,
  sources: {
    master: 'data/master-asbuilt.json',
    territory: 'data/territory-asbuilt.json',
    cycleTimes: 'data/cycle-times-gps.json (GPS, per tech per weekday)',
    homes: 'data/gps-ground-truth.json — perTech[].home',
    paidHours: 'data/route-day-ledger.json',
    jobber: 'data/jobber/jobs.json — client, address, coordinates, product, default assignee',
    file: 'projects/briefs/technician-route-automation/territories.json (v9, read-only, to state what the file says)',
  },
  method: {
    hours: 'weeklyEq visits x that tech’s GPS cycle minutes per stop for that weekday / 60. cycle-times-gps byTechDow where a weekday sample exists, else byTech, else the global 19.5 min.',
    baseline: 'every one of the 1,063 assigned jobs costed on its as-built route-day. This is the board as it runs today.',
    optionCost: 'only the seam’s customers move; the rest of the board is held still. Hours after = baseline +/- the seam delta, so two seams cannot be added together without re-running both.',
    medoid: 'per tech-weekday, the real customer point minimising total distance to that route-day’s STABLE set (>= 3 stable, else all assigned). A centroid can land in water; a medoid is always a place the truck has been.',
    caution: 'Cycle time blends drive with on-site time, so dense ground flatters a tech and spread ground penalises one. Cory is flattered, Luke and Alias are penalised.',
  },
  baselineHoursPerWeek: BASE_HOURS,
  paidHoursPerWeek: PAID,
  cycleMinPerStopByTech: Object.fromEntries(TECHS.map((t) => [t, cycleByTech.get(t) ?? GLOBAL_CYCLE])),
  homes: HOMES,
  patternMedoids: MEDOIDS,
  seamOverlap,
  seams: SEAMS,
};

fs.writeFileSync(path.join(DATA, 'seam-pack.json'), JSON.stringify(pack, null, 2));
console.log('wrote data/seam-pack.json');
for (const s of SEAMS) {
  console.log(`${s.id} ${s.name} — ${s.customers} customers`);
  for (const c of s.candidates || []) console.log(`   ${c.label}: moves ${c.customersMoved}, ${c.hoursMoved} h; after ${JSON.stringify(c.hoursAfter)} spread ${c.spreadAfter}`);
  for (const g of s.groups || []) {
    console.log(`   [${g.zip} ${g.city}] ${g.customers} customers`);
    for (const c of g.candidates) console.log(`      ${c.label}: moves ${c.customersMoved}, ${c.hoursMoved} h; spread ${c.spreadAfter}`);
  }
}

// ---------------------------------------------------------------- write HTML

const TECH_COLOR = {
  'Alias Franks': '--t-alias',
  'Cory Ventura': '--t-cory',
  'Luke LaVergne': '--t-luke',
  'Robert Norton': '--t-robert',
  'Tavis Alexander': '--t-tavis',
};
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const mapPayload = SEAMS.map((s) => ({
  id: s.id,
  groups: (s.groups || [{ zip: null, rows: s.rows }]).map((g) => ({ zip: g.zip, n: (g.rows || []).length })),
  rows: s.rows.map((r) => ({
    n: r.jobNumber, c: r.client, a: r.address, t: r.fieldTech, d: r.fieldWeekday,
    p: r.product, w: r.weeklyEqVisits, lat: r.lat, lng: r.lng, st: r.stability,
    nb: r.neighbourMajorityTech || null,
  })),
  owners: [...new Set((s.candidates || []).map((c) => c.owner).concat((s.groups || []).flatMap((g) => g.candidates.map((c) => c.owner))))].filter((o) => TECHS.includes(o)),
}));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Seam Decision Pack</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<style>
:root{
  --bg:#ffffff; --panel:#f7f7f5; --ink:#17181a; --muted:#5c6066; --line:#d9dbdd;
  --accent:#1a5e3a; --warn:#8a5a00;
  --t-alias:#2f6fd0; --t-cory:#c2410c; --t-luke:#7c3aed; --t-robert:#0f766e; --t-tavis:#b91c6c;
  --home:#111827;
  --radius:10px;
}
:root:not([data-theme="light"]) { }
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#14161a; --panel:#1c1f25; --ink:#e8eaed; --muted:#9aa1ab; --line:#2f343c;
    --accent:#5ec98d; --warn:#e0a94a;
    --t-alias:#6ea8ff; --t-cory:#ff9257; --t-luke:#b18aff; --t-robert:#3fd0bd; --t-tavis:#ff7bb0;
    --home:#e8eaed;
  }
}
:root[data-theme="dark"]{
  --bg:#14161a; --panel:#1c1f25; --ink:#e8eaed; --muted:#9aa1ab; --line:#2f343c;
  --accent:#5ec98d; --warn:#e0a94a;
  --t-alias:#6ea8ff; --t-cory:#ff9257; --t-luke:#b18aff; --t-robert:#3fd0bd; --t-tavis:#ff7bb0;
  --home:#e8eaed;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow-wrap:anywhere}
body{background:var(--bg);color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
.wrap{max-width:1040px;margin:0 auto;padding:28px 16px 64px}
h1{font-size:1.65rem;line-height:1.2;margin:0 0 6px}
h2{font-size:1.22rem;margin:0 0 4px}
h3{font-size:.95rem;margin:22px 0 8px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
p{margin:0 0 12px}
.sub{color:var(--muted);margin-bottom:22px}
.seam{border:1px solid var(--line);border-radius:var(--radius);background:var(--panel);padding:18px;margin:0 0 26px}
.seam-head{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;justify-content:space-between}
.tag{font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;background:var(--ink);color:var(--bg);padding:5px 8px;border-radius:5px}
.count{color:var(--muted);font-size:.85rem}
.q{margin:10px 0 14px}
.map{height:340px;border:1px solid var(--line);border-radius:8px;margin:12px 0;background:#e9e6df}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.8rem;color:var(--muted);margin:0 0 12px}
.legend span{display:inline-flex;align-items:center;gap:6px}
.dot{width:11px;height:11px;border-radius:50%;display:inline-block;border:1.5px solid rgba(0,0,0,.25)}
.sq{width:11px;height:11px;display:inline-block;border:2px solid var(--home);transform:rotate(45deg)}
.tri{width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid var(--muted);display:inline-block}
table{width:100%;border-collapse:collapse;font-size:.82rem;margin:0 0 14px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-weight:600;color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:.05em}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 14px}
.opt{border:1px solid var(--line);border-radius:8px;padding:12px;background:var(--bg);min-width:0}
.opt h4{margin:0 0 8px;font-size:.88rem}
.opt .big{font:600 1.5rem/1 ui-sans-serif,system-ui;font-variant-numeric:tabular-nums}
.rec{border-left:3px solid var(--accent);padding:10px 12px;background:var(--bg);border-radius:0 8px 8px 0;margin:0 0 12px}
.rec strong{color:var(--accent)}
.dflt{border-left:3px solid var(--warn);padding:10px 12px;background:var(--bg);border-radius:0 8px 8px 0;margin:0 0 12px;font-size:.87rem}
.dflt strong{color:var(--warn)}
.decision{border:1.5px dashed var(--ink);border-radius:8px;padding:14px 12px;margin:14px 0 0;font-size:.85rem}
.decision .rule{border-bottom:1px solid var(--line);height:26px;margin-top:8px}
.decision .fields{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:6px}
.decision .fields span{display:inline-flex;gap:6px;align-items:baseline}
.decision .fields i{display:inline-block;border-bottom:1px solid var(--line);min-width:96px;height:1.1em;font-style:normal}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
details{margin:0 0 12px}
summary{cursor:pointer;color:var(--muted);font-size:.84rem;padding:4px 0}
.note{font-size:.82rem;color:var(--muted);margin:0 0 12px}
@media (max-width:640px){
  .wrap{padding:20px 16px 48px}
  .opts{grid-template-columns:1fr}
  .map{height:280px}
  table{font-size:.76rem}
  th,td{padding:5px 6px}
}
@media print{
  body{background:#fff;color:#000}
  .wrap{max-width:none;padding:0}
  .seam{break-inside:avoid;page-break-inside:avoid;border:1px solid #bbb;background:#fff;margin-bottom:18px}
  .map{height:300px}
  /* the per-customer tables stay collapsed in print: 337 rows would bury the decision */
  details:not([open])>summary{color:#555}
  .opt,.rec,.dflt{background:#fff;border-color:#bbb}
  .decision{border-color:#333}
}
</style>
</head>
<body>
<div class="wrap">
<h1>Ownership register — the five seams</h1>
<p class="sub">Five places where the file and the field disagree about who owns the ground. Window ${esc(master.window.from)} to ${esc(master.window.to)}, ${master.summary.jobs} assigned customers. Hours are each tech’s own GPS cycle time, per weekday. Every seam states what happens if nothing is decided.</p>

<h3>The board as it runs today</h3>
<div class="scroll"><table>
<thead><tr><th>Tech</th><th class="num">Modelled h/wk</th><th class="num">Paid h/wk</th><th class="num">Cycle min/stop</th><th>Home</th></tr></thead>
<tbody>
${TECHS.map((t) => `<tr><td><span class="dot" style="background:var(${TECH_COLOR[t]})"></span> ${esc(t)}</td><td class="num">${BASE_HOURS[t]}</td><td class="num">${PAID[t] ? (PAID[t].salaried ? 'salaried *' : PAID[t].paidHoursPerWeek) : '—'}</td><td class="num">${cycleByTech.get(t) ?? GLOBAL_CYCLE}</td><td>${esc(HOMES[t] ? HOMES[t].city + ' ' + HOMES[t].zip : '—')}</td></tr>`).join('\n')}
</tbody></table></div>
<p class="note">* Cory Ventura is salaried, so the timesheet records no hours for him and paid hours cannot be compared. Modelled hours cost every assigned job at its route-day’s GPS pace; they run above paid hours because they include the 66 future-only jobs.</p>

${SEAMS.map((s) => renderSeam(s)).join('\n')}

<h3>The seams overlap</h3>
<p class="note">${seamOverlap.length ? seamOverlap.map((o) => `<b>${o.seams.join(' ∩ ')}</b>: ${o.shared} customers in both`).join(' &middot; ') : 'No customer appears in more than one seam.'}. Deciding one seam changes what another is asking about, so take them in order and re-read the overlap before the second decision. The hours in each option hold the rest of the board still; two options cannot be added together without re-costing both.</p>

<h3>Method</h3>
<p class="note">Hours = weekly-equivalent visits x that tech’s GPS cycle minutes per stop for that weekday / 60. Cycle time blends drive with on-site time, so dense ground flatters a tech and spread ground penalises one: Cory is flattered, Luke and Alias are penalised. Each option holds the rest of the board still, so two seams cannot be added together without re-costing both. A pattern medoid is the real customer point that minimises total distance to that tech-weekday’s settled set — a place the truck has actually been, not a centroid that can land in water.</p>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
const SEAMS = ${JSON.stringify(mapPayload)};
const HOMES = ${JSON.stringify(HOMES)};
const MEDOIDS = ${JSON.stringify(MEDOIDS)};
const COLORVAR = ${JSON.stringify(TECH_COLOR)};
function cvar(t){ return getComputedStyle(document.documentElement).getPropertyValue(COLORVAR[t]||'--muted').trim() || '#888'; }
for (const s of SEAMS){
  const el = document.getElementById('map-'+s.id);
  if(!el) continue;
  const map = L.map(el, {scrollWheelZoom:false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(map);
  const pts=[];      // only customers and owner homes set the view; medoids are context
  for(const r of s.rows){
    if(r.lat==null) continue;
    pts.push([r.lat,r.lng]);
    L.circleMarker([r.lat,r.lng],{radius:5,color:cvar(r.t),weight:1.5,fillColor:cvar(r.t),fillOpacity:.75})
      .bindPopup('<b>#'+r.n+' '+r.c+'</b><br>'+r.a+'<br>'+r.t+' / '+r.d+' &middot; '+r.p+' &middot; '+r.w+' visits/wk<br><i>'+r.st+(r.nb?' &middot; neighbours say '+r.nb:'')+'</i>')
      .addTo(map);
  }
  for(const t of s.owners){
    const h=HOMES[t];
    if(h){ pts.push([h.lat,h.lng]);
      L.marker([h.lat,h.lng],{icon:L.divIcon({className:'',html:'<div style="width:13px;height:13px;background:'+cvar(t)+';border:2px solid #fff;box-shadow:0 0 0 1.5px '+cvar(t)+';transform:rotate(45deg)"></div>',iconSize:[13,13],iconAnchor:[7,7]})})
        .bindPopup('<b>'+t+' \\u2014 home</b><br>'+h.city+' '+h.zip).addTo(map);
    }
    for(const m of MEDOIDS.filter(x=>x.tech===t)){
      // plotted for context, deliberately NOT added to pts — a tech's far-flung pattern
      // would otherwise zoom the seam out to the whole Sound
      L.marker([m.lat,m.lng],{icon:L.divIcon({className:'',html:'<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:11px solid '+cvar(t)+';opacity:.9"></div>',iconSize:[12,11],iconAnchor:[6,11]})})
        .bindPopup('<b>'+t+' \\u2014 '+m.weekday+' pattern</b><br>anchor: '+m.anchorCity+' (#'+m.anchorJob+')<br>'+m.pool+' customers, '+m.stable+' settled').addTo(map);
    }
  }
  // invalidateSize FIRST: fitBounds against a not-yet-laid-out container picks a zoom for the
  // wrong box and the seam ends up lost inside the whole Sound.
  const fit = () => {
    map.invalidateSize();
    if (pts.length) map.fitBounds(L.latLngBounds(pts), {padding:[24,24]});
    else map.setView([47.4,-122.2],9);
  };
  fit();
  setTimeout(fit, 120);
  window.addEventListener('beforeprint', fit);
}
// Print keeps the customer tables collapsed on purpose — the sitting prints the decision,
// not 337 rows. Anything already opened on screen still prints open.
</script>
</body>
</html>`;

function optCard(c) {
  const dl = Object.entries(c.hoursDelta).filter(([, v]) => Math.abs(v) >= 0.05);
  return `<div class="opt">
  <h4>${esc(c.label)}</h4>
  <div class="big">${c.customersMoved} <span style="font-size:.7rem;font-weight:400;color:var(--muted)">customers move</span></div>
  <div style="font-size:.82rem;color:var(--muted);margin:2px 0 8px">${c.hoursMoved} h/wk of work changes hands</div>
  <table style="margin:0">
    <thead><tr><th>Tech</th><th class="num">h/wk delta</th><th class="num">after</th></tr></thead>
    <tbody>${dl.length ? dl.map(([t, v]) => `<tr><td><span class="dot" style="background:var(${TECH_COLOR[t]})"></span> ${esc(t.split(' ')[0])}</td><td class="num">${v > 0 ? '+' : ''}${v}</td><td class="num">${c.hoursAfter[t]}</td></tr>`).join('') : '<tr><td colspan="3" style="color:var(--muted)">no hours change</td></tr>'}</tbody>
  </table>
  <div style="font-size:.78rem;color:var(--muted);margin-top:6px">Fleet spread after: <b>${c.spreadAfter} h</b>${c.drive ? ` &middot; median ${c.drive.medianKmFromHome} km from ${esc(c.drive.tech.split(' ')[0])}’s home, ${c.drive.medianKmToNearestPatternMedoid} km to their nearest pattern` : ''}</div>
</div>`;
}

function rowsTable(rows, opts = {}) {
  const head = `<thead><tr><th>Job</th><th>Client</th><th>Address</th><th>Product</th><th class="num">v/wk</th><th>Field tech / day</th><th>Completed by tech &amp; day</th><th>Jobber default</th>${opts.nb ? '<th>Neighbours say</th>' : ''}</tr></thead>`;
  const body = rows.map((r) => {
    const cv = Object.entries(r.completedByTechWeekday).map(([t, d]) => `${t.split(' ')[0]} ${Object.entries(d).map(([k, v]) => k + '×' + v).join(' ')}`).join('; ');
    return `<tr><td>#${r.jobNumber}</td><td>${esc(r.client)}</td><td>${esc(r.address)}</td><td>${esc(r.product)}</td><td class="num">${r.weeklyEqVisits}</td><td><span class="dot" style="background:var(${TECH_COLOR[r.fieldTech]})"></span> ${esc(r.fieldTech.split(' ')[0])} / ${r.fieldWeekday}</td><td>${esc(cv || '—')}</td><td>${esc(r.currentDefaultAssignee ? r.currentDefaultAssignee.split(' ')[0] : '—')}</td>${opts.nb ? `<td>${esc((r.neighbourMajorityTech || '').split(' ')[0] || '—')}${r.proposedWeekday ? ' / ' + r.proposedWeekday : ''}</td>` : ''}</tr>`;
  }).join('\n');
  return `<div class="scroll"><table>${head}<tbody>${body}</tbody></table></div>`;
}

function renderSeam(s) {
  const legendTechs = [...new Set(s.rows.map((r) => r.fieldTech))];
  const fileLine = s.fileSays.owner
    ? `<b>${esc(s.fileSays.owner)}</b>, ${esc(s.fileSays.rhythm || '—')}${s.fileSays.matchPct != null ? ` — the file is right about ${s.fileSays.matchPct}% of them` : ''}`
    : (s.fileSays.note ? esc(s.fileSays.note.replace(/\.$/, '')) : Object.entries(s.fileSays).map(([k, v]) => `${k}: ${esc(v.owner)} (${esc(v.rhythm)})`).join(' &middot; '));
  const hasOwnerMarkers = (mapPayload.find((m) => m.id === s.id)?.owners || []).length > 0;

  const optionBlock = s.groups
    ? s.groups.map((g) => `
      <h3>${esc(g.zip)} ${esc(g.city)} — ${g.customers} customers, field split ${g.fieldRuns.byTech.map(([t, n]) => esc(t.split(' ')[0]) + ' ' + n).join(' / ')}</h3>
      <div class="opts">${g.candidates.map(optCard).join('')}</div>
      <p class="note">${esc(g.driveVerdict)}</p>
      <div class="rec"><strong>${esc(g.zip)}.</strong> ${esc(g.recommendation.line)}</div>
      <details><summary>The ${g.customers} customers in ${esc(g.zip)}</summary>${rowsTable(g.rows)}</details>`).join('')
    : `<div class="opts">${s.candidates.map(optCard).join('')}</div>
       <details><summary>The ${s.customers} customers in this seam</summary>${rowsTable(s.rows, { nb: s.id === 'S4' })}</details>`;

  return `<section class="seam" id="${s.id}">
  <div class="seam-head"><h2><span class="tag">${s.id}</span> ${esc(s.name)}</h2><span class="count">${s.customers} customers</span></div>
  <p class="q">${esc(s.question)}</p>
  <p class="note"><b>File says:</b> ${fileLine}.<br><b>Field runs:</b> ${s.fieldRuns ? s.fieldRuns.byTech.map(([t, n]) => esc(t) + ' ' + n).join(', ') + ' — days ' + s.fieldRuns.byWeekday.map(([d, n]) => d + ' ' + n).join(', ') : '—'}.${s.sideNote ? '<br>' + esc(s.sideNote) : ''}${s.memoryNote ? '<br>' + esc(s.memoryNote) : ''}</p>
  <div class="map" id="map-${s.id}"></div>
  <div class="legend">${legendTechs.map((t) => `<span><i class="dot" style="background:var(${TECH_COLOR[t]})"></i>${esc(t)}</span>`).join('')}${hasOwnerMarkers ? '<span><i class="sq"></i>candidate’s home</span><span><i class="tri"></i>pattern medoid (tech colour)</span>' : ''}</div>
  ${optionBlock}
  ${s.homesInsideSeam && s.homesInsideSeam.length ? `<p class="note"><b>Whose doorstep.</b> ${s.homesInsideSeam.map((h) => `${esc(h.tech)} lives in ${esc(h.city)} ${esc(h.zip)}, inside this seam${h.isCandidate ? '' : ' — and is not a candidate for it'}`).join('; ')}. Commute is unpaid on this board, so a doorstep is a retention argument, not a payroll one.</p>` : ''}
  ${s.paired ? `<details><summary>${esc(s.paired.name)} — costed together</summary><p class="note">${esc(s.paired.note)}</p><div class="scroll"><table><thead><tr><th>Option</th><th class="num">Customers moved</th>${TECHS.map((t) => `<th class="num">${esc(t.split(' ')[0])}</th>`).join('')}<th class="num">Spread</th></tr></thead><tbody>${s.paired.options.map((o) => `<tr><td>${esc(o.label)}</td><td class="num">${o.customersMoved}</td>${TECHS.map((t) => `<td class="num">${o.hoursAfter[t]}</td>`).join('')}<td class="num">${o.spreadAfter}</td></tr>`).join('')}<tr><td>Leave both as they run today</td><td class="num">0</td>${TECHS.map((t) => `<td class="num">${BASE_HOURS[t]}</td>`).join('')}<td class="num">${r1(Math.max(...Object.values(BASE_HOURS)) - Math.min(...Object.values(BASE_HOURS)))}</td></tr></tbody></table></div></details>` : ''}
  <div class="rec"><strong>Recommendation.</strong> ${esc(s.recommendation.line)}</div>
  <div class="dflt"><strong>If nothing is decided.</strong> ${esc(s.noDecisionDefault)}</div>
  <div class="decision"><b>Decision</b><div class="fields"><span>owner <i></i></span><span>day <i style="min-width:56px"></i></span><span>effective <i style="min-width:80px"></i></span></div><div class="rule"></div><div class="rule"></div></div>
</section>`;
}

fs.writeFileSync(path.join(ROOT, 'seam-pack.html'), html);
console.log('wrote seam-pack.html');
