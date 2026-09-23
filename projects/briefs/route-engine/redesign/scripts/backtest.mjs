#!/usr/bin/env node
/**
 * backtest.mjs
 *
 * Replays a golden week against a routing policy and scores the result against
 * what actually ran.
 *
 *   node scripts/backtest.mjs --week=2026-08-24 --policy=keep-actual
 *   node scripts/backtest.mjs --week=2026-08-31 --policy=dominant-routeday
 *   node scripts/backtest.mjs --all                      every policy x every golden week
 *
 * Flags
 *   --week=YYYY-MM-DD    the Monday of the golden week (default 2026-08-24)
 *   --policy=<name>      a module under scripts/policies/ (default keep-actual)
 *   --all                run every policy against every golden week
 *   --out=<dir>          output root (default redesign/backtest)
 *   --no-orOpt           2-opt only, skip the Or-opt pass
 *   --quiet              scorecard only, no per-route-day table
 *
 * Pipeline: load -> snapshot as of Friday 14:00 PT -> policy -> sequence ->
 * score -> write backtest/<week>/<policy>/{scorecard.md,scorecard.json,board.json}.
 *
 * Offline only. Writes nothing outside the output root.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSnapshot, weekDays, dowOf, isWeekend, ptMinutes as ptMinutesOf, REDESIGN } from './backtest-data.mjs';
import { sequenceStops, routeMinutes, pathSeconds, pathMetres, legMix, clearLegCache } from './sequence.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLICY_DIR = path.join(__dirname, 'policies');
const DEFAULT_OUT = path.join(REDESIGN, 'backtest');

export const GOLDEN_WEEKS = ['2026-08-24', '2026-08-31'];

const THRESHOLDS = {
  sameTechPct: 95,
  sameDayPct: 95,
  hoursTolerancePct: 10,
  // S4 section 5: compactness is "total route time per day within 5% of the
  // OptimoRoute route the field drove", and the hard wall is 9.5 h.
  compactnessTolerancePct: 5,
  wallHours: 9.5,
  softHours: 8.0,
};

// ---------------------------------------------------------------- helpers

const r1 = (n) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10) / 10);
const r2 = (n) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 100) / 100);
const pct = (num, den) => (den > 0 ? (num / den) * 100 : null);

function median(xs) {
  const s = xs.filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function parseArgs(argv) {
  const out = { week: GOLDEN_WEEKS[0], policy: 'keep-actual', out: DEFAULT_OUT, orOpt: true };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === 'week') out.week = v;
    else if (k === 'policy') out.policy = v;
    else if (k === 'out') out.out = path.resolve(v);
    else if (k === 'all') out.all = true;
    else if (k === 'quiet') out.quiet = true;
    else if (k === 'no-orOpt') out.orOpt = false;
    else if (k === 'help') out.help = true;
  }
  return out;
}

export function listPolicies() {
  return fs
    .readdirSync(POLICY_DIR)
    .filter((f) => f.endsWith('.mjs'))
    .map((f) => f.replace(/\.mjs$/, ''))
    .sort();
}

async function loadPolicy(name) {
  const file = path.join(POLICY_DIR, `${name}.mjs`);
  if (!fs.existsSync(file)) {
    throw new Error(`unknown policy "${name}". Available: ${listPolicies().join(', ')}`);
  }
  const mod = await import(pathToFileURL(file).href);
  if (typeof mod.propose !== 'function') throw new Error(`policy ${name} exports no propose()`);
  return mod;
}

// ---------------------------------------------------------------- scoring

/**
 * Score a proposed board against the actual board.
 * @param {object} snap
 * @param {{assignments:Array<{key,tech,date}>, notes?:object}} proposal
 */
export function score(snap, proposal, opts = {}) {
  const dueByKey = new Map(snap.due.map((v) => [v.key, v]));
  const proposed = new Map();
  const duplicates = [];
  const invented = [];

  for (const a of proposal.assignments) {
    if (!dueByKey.has(a.key)) {
      invented.push(a.key);
      continue;
    }
    if (proposed.has(a.key)) duplicates.push(a.key);
    proposed.set(a.key, a);
  }
  const dropped = [...dueByKey.keys()].filter((k) => !proposed.has(k));

  // ---- coverage and placement
  const weekend = [];
  const offWeek = [];
  for (const [k, a] of proposed) {
    if (isWeekend(a.date)) weekend.push({ key: k, date: a.date, tech: a.tech });
    else if (!snap.daySet.has(a.date)) offWeek.push({ key: k, date: a.date, tech: a.tech });
    if (!snap.techs.includes(a.tech)) offWeek.push({ key: k, date: a.date, tech: a.tech, reason: 'tech off roster' });
  }

  // ---- tech / day agreement, against both actual definitions
  const agree = {
    run: { tech: 0, day: 0, both: 0, n: 0 },
    held: { tech: 0, day: 0, both: 0, n: 0 },
  };
  const mismatches = [];
  let noActual = 0;
  for (const [k, a] of proposed) {
    const act = snap.actual.get(k);
    const held = snap.optimoHeld.get(k);
    if (!act) noActual += 1;
    if (act && act.tech && act.date) {
      agree.run.n += 1;
      const t = act.tech === a.tech;
      const d = act.date === a.date;
      if (t) agree.run.tech += 1;
      if (d) agree.run.day += 1;
      if (t && d) agree.run.both += 1;
      if (!t || !d) {
        mismatches.push({
          key: k,
          title: dueByKey.get(k)?.title,
          zip: dueByKey.get(k)?.zip,
          proposedTech: a.tech,
          actualTech: act.tech,
          proposedDate: a.date,
          actualDate: act.date,
          actualSource: act.source,
          wrong: [!t ? 'tech' : null, !d ? 'day' : null].filter(Boolean).join('+'),
        });
      }
    }
    if (held) {
      agree.held.n += 1;
      const t = held.tech === a.tech;
      const d = held.date === a.date;
      if (t) agree.held.tech += 1;
      if (d) agree.held.day += 1;
      if (t && d) agree.held.both += 1;
    }
  }

  // ---- build proposal route-days and sequence them
  const propRouteDays = new Map(); // `${tech}|${date}` -> stops
  for (const [k, a] of proposed) {
    const v = dueByKey.get(k);
    const id = `${a.tech}|${a.date}`;
    if (!propRouteDays.has(id)) propRouteDays.set(id, []);
    propRouteDays.get(id).push({
      key: k,
      lat: v.lat,
      lng: v.lng,
      serviceMin: snap.serviceMin.get(k) ?? 15,
      title: v.title,
      zip: v.zip,
    });
  }

  const sequenced = new Map();
  for (const [id, stops] of propRouteDays) {
    const tech = id.split('|')[0];
    const start = snap.startAreas[tech] || null;
    const res = sequenceStops(stops, tech, start, { orOpt: opts.orOpt !== false });
    sequenced.set(id, { tech, date: id.split('|')[1], stops: res.order, seqMeta: res, start });
  }

  // ---- actual route-days.
  //
  // Keyed off the ACTUAL BOARD (who really worked the stop, from the completion
  // stamp), not off the OptimoRoute driver name. Those two disagree whenever a
  // tech covers another tech's day — on 2026-08-28 OptimoRoute held 17 stops
  // under one driver and a different tech worked every one of them. Keying off
  // the OR driver would invent a phantom empty day for one tech and an
  // unscoreable day for the other.
  //
  // Ordering inside the day is OptimoRoute's engineered stop order wherever the
  // stop was routed that same date, so the sequence comparison really is
  // "our order vs OptimoRoute's order". Where no OR stop exists it falls back
  // to the completion-stamp order, i.e. the order the tech actually drove.
  const actualRouteDays = new Map();
  const orderSource = { optimo: 0, stamp: 0, scheduled: 0 };
  for (const v of snap.due) {
    const act = snap.actual.get(v.key);
    if (!act || !act.tech || !act.date) continue;
    const id = `${act.tech}|${act.date}`;
    if (!actualRouteDays.has(id)) {
      actualRouteDays.set(id, {
        tech: act.tech,
        date: act.date,
        stops: [],
        start: snap.startAreas[act.tech] || null,
      });
    }
    const held = snap.optimoHeld.get(v.key);
    let rank;
    let src;
    if (held && held.date === act.date) {
      rank = held.seq;
      src = 'optimo';
    } else if (act.completedAt != null) {
      rank = 10000 + (ptMinutesOf(act.completedAt) ?? 0);
      src = 'stamp';
    } else {
      rank = 20000 + (ptMinutesOf(v.startAt) ?? 0);
      src = 'scheduled';
    }
    orderSource[src] += 1;
    actualRouteDays.get(id).stops.push({
      key: v.key,
      lat: v.lat,
      lng: v.lng,
      serviceMin: snap.serviceMin.get(v.key) ?? 15,
      rank,
      orderSource: src,
    });
  }
  for (const rd of actualRouteDays.values()) rd.stops.sort((a, b) => a.rank - b.rank);

  // ---- per route-day scoring
  const routeDays = [];
  const allIds = new Set([...sequenced.keys(), ...actualRouteDays.keys()]);
  for (const id of [...allIds].sort()) {
    const p = sequenced.get(id);
    const a = actualRouteDays.get(id);
    const [tech, date] = id.split('|');
    const start = (p || a).start;

    const pm = p ? routeMinutes(p.stops, tech, start) : null;
    const am = a ? routeMinutes(a.stops, tech, start) : null;

    // The same actual stop set, re-ordered by OUR sequencer. Comparing the
    // proposal against this isolates board composition (who works what, when)
    // from sequencing (what order they drive it in). Without it, a sequencer
    // that simply beats OptimoRoute looks like a board that got the hours wrong.
    let arm = null;
    if (a && a.stops.length > 1) {
      const rs = sequenceStops(a.stops, tech, start, { orOpt: opts.orOpt !== false });
      arm = routeMinutes(rs.order, tech, start);
    } else if (a) {
      arm = am;
    }

    // sequence quality on the COMMON stop set only: same stops, two orders
    let seqCmp = null;
    if (p && a) {
      const aKeys = new Set(a.stops.map((s) => s.key));
      const common = p.stops.filter((s) => aKeys.has(s.key));
      if (common.length >= 3) {
        const commonKeys = new Set(common.map((s) => s.key));
        const actualOrder = a.stops.filter((s) => commonKeys.has(s.key));
        const pSec = pathSeconds(common, tech, start);
        const aSec = pathSeconds(actualOrder, tech, start);
        const pM = pathMetres(common, tech, start);
        const aM = pathMetres(actualOrder, tech, start);
        // Control: time both orders with the haversine estimator only. The
        // actual order's legs were all really driven, so they sit in the
        // observed-pair table; a re-ordering invents legs nobody has driven and
        // those fall back to the estimator, whose median per-leg error is ~20%.
        // Scoring the mixed model therefore flatters any re-ordering. Under the
        // uniform model neither order gets that advantage.
        const pSecU = pathSeconds(common, tech, start, true);
        const aSecU = pathSeconds(actualOrder, tech, start, true);
        const pMix = legMix(common, tech, start);
        const aMix = legMix(actualOrder, tech, start);
        seqCmp = {
          commonStops: common.length,
          proposalDriveMin: r1(pSec / 60),
          actualDriveMin: r1(aSec / 60),
          driveRatio: aSec > 0 ? r2(pSec / aSec) : null,
          proposalMiles: r1(pM / 1609.344),
          actualMiles: r1(aM / 1609.344),
          distanceRatio: aM > 0 ? r2(pM / aM) : null,
          uniformDriveRatio: aSecU > 0 ? r2(pSecU / aSecU) : null,
          proposalEstimatedLegPct: r1(pMix.estimatedPct),
          actualEstimatedLegPct: r1(aMix.estimatedPct),
        };
      }
    }

    const hoursRatio = pm && am && am.totalMin > 0 ? pm.totalMin / am.totalMin : null;
    const boardRatio = pm && arm && arm.totalMin > 0 ? pm.totalMin / arm.totalMin : null;
    routeDays.push({
      id,
      tech,
      date,
      dow: dowOf(date),
      proposal: pm
        ? {
            stops: pm.stops,
            driveMin: r1(pm.travelMin),
            serviceMin: r1(pm.serviceMin),
            totalMin: r1(pm.totalMin),
            hours: r2(pm.totalMin / 60),
            miles: r1(pm.travelMiles),
            observedLegs: pm.observedLegs,
            estimatedLegs: pm.estimatedLegs,
            nnImprovedPct: r1(p.seqMeta.improvedPct),
          }
        : null,
      actual: am
        ? {
            stops: am.stops,
            driveMin: r1(am.travelMin),
            serviceMin: r1(am.serviceMin),
            totalMin: r1(am.totalMin),
            hours: r2(am.totalMin / 60),
            miles: r1(am.travelMiles),
          }
        : null,
      actualResequenced: arm
        ? { driveMin: r1(arm.travelMin), totalMin: r1(arm.totalMin), hours: r2(arm.totalMin / 60) }
        : null,
      hoursRatio: r2(hoursRatio),
      hoursWithinTolerance:
        hoursRatio == null ? null : Math.abs(hoursRatio - 1) * 100 <= THRESHOLDS.hoursTolerancePct,
      boardRatio: r2(boardRatio),
      boardWithinTolerance:
        boardRatio == null ? null : Math.abs(boardRatio - 1) * 100 <= THRESHOLDS.hoursTolerancePct,
      sequence: seqCmp,
      only: p && a ? null : p ? 'proposal-only' : 'actual-only',
    });
  }

  // ---- S4 section 5 additions -------------------------------------------------
  //
  // 1. Due-window compliance. A policy that carries a due window per visit hands
  //    it over in `proposal.windows` as { key: {from, to, type, allowed} }. `from`
  //    and `to` are the raw window; `allowed` is that window clamped to the five
  //    weekdays of the golden week, which is what the solver could actually obey
  //    when a window opened before the week or closed after it.
  const windowSpec = proposal.windows || null;
  let windowCompliance = null;
  if (windowSpec) {
    const byType = {};
    let n = 0;
    let insideRaw = 0;
    let insideEffective = 0;
    const violations = [];
    for (const [k, a] of proposed) {
      const w = windowSpec[k];
      if (!w) continue;
      n += 1;
      const raw = w.from != null && w.to != null && a.date >= w.from && a.date <= w.to;
      const eff = Array.isArray(w.allowed) ? w.allowed.includes(a.date) : raw;
      if (raw) insideRaw += 1;
      if (eff) insideEffective += 1;
      const t = w.type || 'unknown';
      if (!byType[t]) byType[t] = { n: 0, insideRaw: 0, insideEffective: 0 };
      byType[t].n += 1;
      if (raw) byType[t].insideRaw += 1;
      if (eff) byType[t].insideEffective += 1;
      if (!eff && violations.length < 40) {
        violations.push({ key: k, date: a.date, from: w.from, to: w.to, type: t });
      }
    }
    for (const t of Object.keys(byType)) {
      byType[t].insideRawPct = r1(pct(byType[t].insideRaw, byType[t].n));
      byType[t].insideEffectivePct = r1(pct(byType[t].insideEffective, byType[t].n));
    }
    windowCompliance = {
      n,
      insideRaw,
      insideRawPct: r1(pct(insideRaw, n)),
      insideEffective,
      insideEffectivePct: r1(pct(insideEffective, n)),
      byType,
      violations,
    };
  }

  // 2. Overflow: visits a policy could not fit under the hard wall. They are
  //    reported here and still counted as unplaced by the drop gate, so an
  //    infeasible week can never look like a clean one.
  const overflow = Array.isArray(proposal.overflow) ? proposal.overflow : [];

  const bothDays = routeDays.filter((d) => d.hoursRatio != null);
  const hoursPass = bothDays.filter((d) => d.hoursWithinTolerance).length;
  const boardDays = routeDays.filter((d) => d.boardRatio != null);
  const boardPass = boardDays.filter((d) => d.boardWithinTolerance).length;
  const seqDays = routeDays.filter((d) => d.sequence && d.sequence.driveRatio != null);

  // ---- per-tech weekly hours
  const perTech = [];
  for (const tech of snap.techs) {
    const pd = routeDays.filter((d) => d.tech === tech && d.proposal);
    const ad = routeDays.filter((d) => d.tech === tech && d.actual);
    perTech.push({
      tech,
      proposalDays: pd.length,
      proposalStops: pd.reduce((s, d) => s + d.proposal.stops, 0),
      proposalHours: r1(pd.reduce((s, d) => s + d.proposal.totalMin, 0) / 60),
      actualDays: ad.length,
      actualStops: ad.reduce((s, d) => s + d.actual.stops, 0),
      actualHours: r1(ad.reduce((s, d) => s + d.actual.totalMin, 0) / 60),
      hoursDelta: r1(
        (pd.reduce((s, d) => s + d.proposal.totalMin, 0) - ad.reduce((s, d) => s + d.actual.totalMin, 0)) / 60
      ),
    });
  }

  // 3. Capacity, measured on the harness's own modelled route time (travel +
  //    service), for the proposal and for the day the field actually worked.
  //    A policy that also models capacity its own way reports that separately in
  //    its notes; this is the harness's independent read.
  const propDays = routeDays.filter((d) => d.proposal);
  const actDays = routeDays.filter((d) => d.actual);
  const capacity = {
    proposal: {
      routeDays: propDays.length,
      over8h: propDays.filter((d) => d.proposal.hours > THRESHOLDS.softHours).length,
      over95h: propDays.filter((d) => d.proposal.hours > THRESHOLDS.wallHours).length,
      maxHours: propDays.length ? Math.max(...propDays.map((d) => d.proposal.hours)) : null,
      medianHours: r2(median(propDays.map((d) => d.proposal.hours))),
    },
    actual: {
      routeDays: actDays.length,
      over8h: actDays.filter((d) => d.actual.hours > THRESHOLDS.softHours).length,
      over95h: actDays.filter((d) => d.actual.hours > THRESHOLDS.wallHours).length,
      maxHours: actDays.length ? Math.max(...actDays.map((d) => d.actual.hours)) : null,
      medianHours: r2(median(actDays.map((d) => d.actual.hours))),
    },
  };

  // 4. Compactness: per-day total route time against the OptimoRoute route the
  //    field drove, both sides timed by travel.mjs. S4 asks for within 5%.
  const compactPass = bothDays.filter(
    (d) => Math.abs(d.hoursRatio - 1) * 100 <= THRESHOLDS.compactnessTolerancePct
  ).length;
  const compactBoardPass = boardDays.filter(
    (d) => Math.abs(d.boardRatio - 1) * 100 <= THRESHOLDS.compactnessTolerancePct
  ).length;
  const compactness = {
    routeDaysScored: bothDays.length,
    within5Pct: compactPass,
    within5PctShare: r1(pct(compactPass, bothDays.length)),
    medianRatio: r2(median(bothDays.map((d) => d.hoursRatio))),
    boardOnlyWithin5Pct: compactBoardPass,
    boardOnlyRouteDays: boardDays.length,
    ratioMin: bothDays.length ? Math.min(...bothDays.map((d) => d.hoursRatio)) : null,
    ratioMax: bothDays.length ? Math.max(...bothDays.map((d) => d.hoursRatio)) : null,
  };

  const sameTechPct = pct(agree.run.tech, agree.run.n);
  const sameDayPct = pct(agree.run.day, agree.run.n);
  const hoursPassPct = pct(hoursPass, bothDays.length);

  const gates = [
    { gate: 'same tech >= 95%', value: r1(sameTechPct), pass: sameTechPct != null && sameTechPct >= THRESHOLDS.sameTechPct },
    { gate: 'same day >= 95%', value: r1(sameDayPct), pass: sameDayPct != null && sameDayPct >= THRESHOLDS.sameDayPct },
    {
      gate: 'route-day hours within +-10%',
      value: `${hoursPass}/${bothDays.length} (${r1(hoursPassPct)}%)`,
      pass: bothDays.length > 0 && hoursPass === bothDays.length,
    },
    {
      gate: 'route-day hours within +-10% (board only, same sequencer)',
      value: `${boardPass}/${boardDays.length} (${r1(pct(boardPass, boardDays.length))}%)`,
      pass: boardDays.length > 0 && boardPass === boardDays.length,
      advisory: true,
    },
    { gate: 'no dropped visits', value: dropped.length, pass: dropped.length === 0 },
    { gate: 'no invented visits', value: invented.length, pass: invented.length === 0 },
    { gate: 'no weekend placements', value: weekend.length, pass: weekend.length === 0 },
  ];

  // S4 section 5 gates. Only the policies that carry the design's own inputs
  // (a due window, an overflow list) are scored on them.
  if (windowCompliance) {
    gates.push({
      gate: 'every visit inside its due window (clamped to the week)',
      value: `${windowCompliance.insideEffective}/${windowCompliance.n} (${windowCompliance.insideEffectivePct}%)`,
      pass: windowCompliance.n > 0 && windowCompliance.insideEffective === windowCompliance.n,
    });
    gates.push({
      gate: 'inside the raw due window, before clamping to the week',
      value: `${windowCompliance.insideRaw}/${windowCompliance.n} (${windowCompliance.insideRawPct}%)`,
      pass: windowCompliance.n > 0 && windowCompliance.insideRaw === windowCompliance.n,
      advisory: true,
    });
  }
  gates.push({
    gate: `no route-day over ${THRESHOLDS.wallHours} h (modelled travel + service)`,
    value: `${capacity.proposal.over95h} of ${capacity.proposal.routeDays} (actual: ${capacity.actual.over95h}/${capacity.actual.routeDays})`,
    pass: capacity.proposal.over95h === 0,
    advisory: true,
  });
  gates.push({
    gate: 'route-day total time within +-5% of the OptimoRoute day (compactness)',
    value: `${compactness.within5Pct}/${compactness.routeDaysScored} (${compactness.within5PctShare}%)`,
    pass: compactness.routeDaysScored > 0 && compactness.within5Pct === compactness.routeDaysScored,
    advisory: true,
  });
  if (overflow.length || proposal.overflow) {
    gates.push({
      gate: 'no overflow (visits that would not fit under the wall)',
      value: overflow.length,
      pass: overflow.length === 0,
      advisory: true,
    });
  }
  gates.push({
    gate: 'late bookings (created after the cutoff — the add-queue load)',
    value: snap.lateBookings.length,
    pass: true,
    advisory: true,
  });

  return {
    thresholds: THRESHOLDS,
    coverage: {
      dueVisits: snap.due.length,
      lateBookings: snap.lateBookings.length,
      proposed: proposed.size,
      dropped: dropped.length,
      invented: invented.length,
      duplicates: duplicates.length,
      noActual,
      weekendPlacements: weekend.length,
      offWeekPlacements: offWeek.length,
      ghostOrders: snap.ghosts.length,
    },
    agreement: {
      vsActualRun: {
        n: agree.run.n,
        sameTech: agree.run.tech,
        sameTechPct: r1(sameTechPct),
        sameDay: agree.run.day,
        sameDayPct: r1(sameDayPct),
        sameBoth: agree.run.both,
        sameBothPct: r1(pct(agree.run.both, agree.run.n)),
      },
      vsOptimoHeld: {
        n: agree.held.n,
        sameTechPct: r1(pct(agree.held.tech, agree.held.n)),
        sameDayPct: r1(pct(agree.held.day, agree.held.n)),
        sameBothPct: r1(pct(agree.held.both, agree.held.n)),
      },
    },
    hours: {
      routeDaysScored: bothDays.length,
      withinTolerance: hoursPass,
      withinTolerancePct: r1(hoursPassPct),
      medianRatio: r2(median(bothDays.map((d) => d.hoursRatio))),
      boardOnly: {
        routeDaysScored: boardDays.length,
        withinTolerance: boardPass,
        withinTolerancePct: r1(pct(boardPass, boardDays.length)),
        medianRatio: r2(median(boardDays.map((d) => d.boardRatio))),
      },
      actualOrderSource: orderSource,
      proposalOnlyDays: routeDays.filter((d) => d.only === 'proposal-only').length,
      actualOnlyDays: routeDays.filter((d) => d.only === 'actual-only').length,
      totalProposalHours: r1(routeDays.reduce((s, d) => s + (d.proposal?.totalMin || 0), 0) / 60),
      totalActualHours: r1(routeDays.reduce((s, d) => s + (d.actual?.totalMin || 0), 0) / 60),
    },
    sequence: {
      routeDaysCompared: seqDays.length,
      medianDriveRatio: r2(median(seqDays.map((d) => d.sequence.driveRatio))),
      medianDistanceRatio: r2(median(seqDays.map((d) => d.sequence.distanceRatio))),
      medianUniformDriveRatio: r2(median(seqDays.map((d) => d.sequence.uniformDriveRatio))),
      medianProposalEstimatedLegPct: r1(median(seqDays.map((d) => d.sequence.proposalEstimatedLegPct))),
      medianActualEstimatedLegPct: r1(median(seqDays.map((d) => d.sequence.actualEstimatedLegPct))),
      betterThanOptimo: seqDays.filter((d) => d.sequence.driveRatio < 1).length,
      worseThanOptimo: seqDays.filter((d) => d.sequence.driveRatio > 1).length,
      betterThanOptimoUniform: seqDays.filter((d) => d.sequence.uniformDriveRatio < 1).length,
      totalProposalDriveMin: r1(seqDays.reduce((s, d) => s + d.sequence.proposalDriveMin, 0)),
      totalActualDriveMin: r1(seqDays.reduce((s, d) => s + d.sequence.actualDriveMin, 0)),
    },
    windowCompliance,
    capacity,
    compactness,
    overflow: { count: overflow.length, keys: overflow.slice(0, 40) },
    gates,
    passed: gates.filter((g) => !g.advisory).every((g) => g.pass),
    perTech,
    routeDays,
    mismatches: mismatches.slice(0, 60),
    mismatchTotal: mismatches.length,
    droppedKeys: dropped.slice(0, 40),
    inventedKeys: invented.slice(0, 40),
    weekendKeys: weekend.slice(0, 40),
  };
}

// ---------------------------------------------------------------- reporting

function markdown(snap, policy, result, proposal) {
  const L = [];
  const yn = (b) => (b === true ? 'PASS' : b === false ? 'FAIL' : '-');
  L.push(`# Backtest scorecard — ${snap.week} · ${policy.name}`);
  L.push('');
  L.push(`${policy.description}`);
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---|`);
  L.push(`| Golden week | ${snap.week} (${snap.days[0]} .. ${snap.days[4]}) |`);
  L.push(`| Plan-time cutoff | ${snap.asOf} (Friday 14:00 PT) |`);
  L.push(`| Policy | \`${policy.name}\`${policy.usesOracle ? ' — reads the oracle' : ''} |`);
  L.push(`| Techs | ${snap.techs.join(', ')} |`);
  L.push(`| Overall | **${result.passed ? 'PASS' : 'FAIL'}** |`);
  L.push('');

  L.push('## Gates');
  L.push('');
  L.push('| Gate | Value | Result |');
  L.push('|---|---:|:---:|');
  for (const g of result.gates) {
    L.push(`| ${g.gate}${g.advisory ? ' _(advisory)_' : ''} | ${g.value} | ${yn(g.pass)} |`);
  }
  L.push('');

  const c = result.coverage;
  L.push('## Coverage');
  L.push('');
  L.push('| Metric | Count |');
  L.push('|---|---:|');
  L.push(`| Visits due and known at the cutoff | ${c.dueVisits} |`);
  L.push(`| Late bookings (created after the cutoff, excluded) | ${c.lateBookings} |`);
  L.push(`| Visits the policy placed | ${c.proposed} |`);
  L.push(`| Dropped (due, never placed) | ${c.dropped} |`);
  L.push(`| Invented (placed, not due) | ${c.invented} |`);
  L.push(`| Duplicate placements | ${c.duplicates} |`);
  L.push(`| Placed on a weekend | ${c.weekendPlacements} |`);
  L.push(`| Placed outside the golden week | ${c.offWeekPlacements} |`);
  L.push(`| Due visits with no resolvable actual | ${c.noActual} |`);
  L.push(`| OptimoRoute ghost orders (no Jobber visit) | ${c.ghostOrders} |`);
  L.push('');

  const a = result.agreement;
  L.push('## Agreement with what ran');
  L.push('');
  L.push('| Reference | n | Same tech | Same day | Both |');
  L.push('|---|---:|---:|---:|---:|');
  L.push(
    `| Actual run (completion stamps) | ${a.vsActualRun.n} | ${a.vsActualRun.sameTechPct}% | ${a.vsActualRun.sameDayPct}% | ${a.vsActualRun.sameBothPct}% |`
  );
  L.push(
    `| OptimoRoute route as held | ${a.vsOptimoHeld.n} | ${a.vsOptimoHeld.sameTechPct}% | ${a.vsOptimoHeld.sameDayPct}% | ${a.vsOptimoHeld.sameBothPct}% |`
  );
  L.push('');

  const h = result.hours;
  L.push('## Hours per route-day');
  L.push('');
  L.push('| Metric | Value |');
  L.push('|---|---:|');
  L.push(`| Route-days with both a proposal and an actual | ${h.routeDaysScored} |`);
  L.push(`| Within +-10% of actual | ${h.withinTolerance} (${h.withinTolerancePct}%) |`);
  L.push(`| Median proposal/actual ratio | ${h.medianRatio} |`);
  L.push(`| **Board only** — within +-10% when the actual day is re-sequenced by us | ${h.boardOnly.withinTolerance}/${h.boardOnly.routeDaysScored} (${h.boardOnly.withinTolerancePct}%) |`);
  L.push(`| **Board only** — median ratio | ${h.boardOnly.medianRatio} |`);
  L.push(`| Route-days only in the proposal | ${h.proposalOnlyDays} |`);
  L.push(`| Route-days only in the actual | ${h.actualOnlyDays} |`);
  L.push(`| Total proposal hours | ${h.totalProposalHours} |`);
  L.push(`| Total actual hours | ${h.totalActualHours} |`);
  L.push(
    `| Actual stop order taken from | OptimoRoute ${h.actualOrderSource.optimo}, completion stamps ${h.actualOrderSource.stamp}, schedule ${h.actualOrderSource.scheduled} |`
  );
  L.push('');
  L.push(
    'The headline hours ratio moves for two reasons at once: a different board, and a different stop order. The **board only** row re-sequences the actual day with the same sequencer, so what remains is purely the board.'
  );
  L.push('');

  const s = result.sequence;
  L.push('## Sequence quality (same stop set, two orders)');
  L.push('');
  L.push('| Metric | Value |');
  L.push('|---|---:|');
  L.push(`| Route-days compared | ${s.routeDaysCompared} |`);
  L.push(`| Median drive-time ratio (ours / OptimoRoute) | ${s.medianDriveRatio} |`);
  L.push(`| Median distance ratio | ${s.medianDistanceRatio} |`);
  L.push(`| **Uniform-model control** — median drive ratio, estimator only | ${s.medianUniformDriveRatio} |`);
  L.push(`| Legs our order has to estimate (median) | ${s.medianProposalEstimatedLegPct}% |`);
  L.push(`| Legs OptimoRoute's order has to estimate (median) | ${s.medianActualEstimatedLegPct}% |`);
  L.push(`| Route-days we beat OptimoRoute on drive time | ${s.betterThanOptimo} |`);
  L.push(`| Route-days OptimoRoute beat us | ${s.worseThanOptimo} |`);
  L.push(`| Route-days we beat it under the uniform control | ${s.betterThanOptimoUniform} |`);
  L.push(`| Total drive minutes, ours vs OptimoRoute | ${s.totalProposalDriveMin} vs ${s.totalActualDriveMin} |`);
  L.push('');
  L.push(
    'Read the uniform-model control, not the headline ratio. OptimoRoute actually drove every leg in its own order, so those legs are real measurements in the travel model; any re-ordering invents legs nobody has driven and they fall back to a haversine estimator whose median per-leg error is around 20%. The headline ratio therefore flatters any re-ordering. The control times both orders with the estimator alone, so neither side gets that advantage.'
  );
  L.push('');

  L.push('## Design gates (S4 section 5)');
  L.push('');
  if (result.windowCompliance) {
    const w = result.windowCompliance;
    L.push('| Due-window compliance | Value |');
    L.push('|---|---:|');
    L.push(`| Visits carrying a window | ${w.n} |`);
    L.push(`| Placed inside the window, clamped to the week | ${w.insideEffective} (${w.insideEffectivePct}%) |`);
    L.push(`| Placed inside the raw window | ${w.insideRaw} (${w.insideRawPct}%) |`);
    L.push('');
    L.push('| Window type | n | Inside raw | Inside clamped |');
    L.push('|---|---:|---:|---:|');
    for (const [t, v] of Object.entries(w.byType).sort((a, b) => b[1].n - a[1].n)) {
      L.push(`| ${t} | ${v.n} | ${v.insideRawPct}% | ${v.insideEffectivePct}% |`);
    }
    L.push('');
    L.push(
      'A window that opens before the golden week or closes after it cannot be obeyed inside a Monday-to-Friday solve. The clamped column is what the solver could actually hold; the raw column is the window the cadence rule asked for, and the gap between them is the design telling you how much work the office was already carrying late.'
    );
    L.push('');
  } else {
    L.push('This policy carries no due windows, so window compliance is not scored.');
    L.push('');
  }
  const cap = result.capacity;
  const cm = result.compactness;
  L.push('| Capacity and compactness | Proposal | Actual |');
  L.push('|---|---:|---:|');
  L.push(`| Route-days | ${cap.proposal.routeDays} | ${cap.actual.routeDays} |`);
  L.push(`| Over 8 h (modelled travel + service) | ${cap.proposal.over8h} | ${cap.actual.over8h} |`);
  L.push(`| Over 9.5 h — the hard wall | ${cap.proposal.over95h} | ${cap.actual.over95h} |`);
  L.push(`| Longest route-day, hours | ${cap.proposal.maxHours} | ${cap.actual.maxHours} |`);
  L.push(`| Median route-day, hours | ${cap.proposal.medianHours} | ${cap.actual.medianHours} |`);
  L.push(
    `| Route-day time within +-5% of the OptimoRoute day | ${cm.within5Pct}/${cm.routeDaysScored} (${cm.within5PctShare}%) | - |`
  );
  L.push(`| Route-day ratio range | ${r2(cm.ratioMin)} - ${r2(cm.ratioMax)} | - |`);
  L.push(`| Overflow — could not fit under the wall | ${result.overflow.count} | - |`);
  L.push(`| Late bookings — the add-queue load | ${result.coverage.lateBookings} | - |`);
  L.push('');

  L.push('## Per-tech weekly hours');
  L.push('');
  L.push('| Tech | Days | Stops | Proposal h | Actual h | Delta h |');
  L.push('|---|---:|---:|---:|---:|---:|');
  for (const t of result.perTech) {
    L.push(
      `| ${t.tech} | ${t.proposalDays}/${t.actualDays} | ${t.proposalStops}/${t.actualStops} | ${t.proposalHours} | ${t.actualHours} | ${t.hoursDelta} |`
    );
  }
  L.push('');

  L.push('## Route-days');
  L.push('');
  L.push('| Date | Dow | Tech | Stops p/a | Prop h | Act h | Ratio | +-10% | Board ratio | Seq drive p/a | Seq ratio |');
  L.push('|---|---|---|---:|---:|---:|---:|:---:|---:|---:|---:|');
  for (const d of result.routeDays) {
    const sq = d.sequence;
    L.push(
      `| ${d.date} | ${d.dow} | ${d.tech} | ${d.proposal?.stops ?? '-'}/${d.actual?.stops ?? '-'} | ${
        d.proposal?.hours ?? '-'
      } | ${d.actual?.hours ?? '-'} | ${d.hoursRatio ?? '-'} | ${yn(d.hoursWithinTolerance)} | ${
        d.boardRatio ?? '-'
      } | ${sq ? `${sq.proposalDriveMin}/${sq.actualDriveMin}` : '-'} | ${sq?.driveRatio ?? '-'} |`
    );
  }
  L.push('');

  if (result.mismatchTotal) {
    L.push(`## Tech/day mismatches (${result.mismatchTotal} total, first 60)`);
    L.push('');
    L.push('| Visit | Zip | Wrong | Proposed | Actual |');
    L.push('|---|---|---|---|---|');
    for (const m of result.mismatches) {
      L.push(
        `| ${m.key} ${String(m.title || '').slice(0, 22)} | ${m.zip || ''} | ${m.wrong} | ${m.proposedTech} ${m.proposedDate} | ${m.actualTech} ${m.actualDate} |`
      );
    }
    L.push('');
  }

  if (proposal.notes) {
    L.push('## Policy notes');
    L.push('');
    L.push('```json');
    L.push(JSON.stringify(proposal.notes, null, 2));
    L.push('```');
    L.push('');
  }

  L.push('---');
  L.push('');
  L.push(
    'Hours are modelled with `travel.mjs` over each route-day in its own order, including the inbound leg from the tech\'s inferred start area and excluding the trip home. Proposal and actual are timed with the identical model and identical per-visit service minutes, so any difference is the board, not the clock.'
  );
  return L.join('\n');
}

// ---------------------------------------------------------------- run

export async function runOne({ week, policyName, outRoot, orOpt = true, quiet = false }) {
  const t0 = Date.now();
  const policy = await loadPolicy(policyName);
  const snap = buildSnapshot({ week });
  clearLegCache();

  const proposal = policy.propose(snap);
  if (!proposal || !Array.isArray(proposal.assignments)) {
    throw new Error(`policy ${policyName} returned no assignments array`);
  }
  const result = score(snap, proposal, { orOpt });

  const dir = path.join(outRoot, week, policyName);
  fs.mkdirSync(dir, { recursive: true });

  const json = {
    generatedAt: new Date().toISOString(),
    week,
    days: snap.days,
    asOf: snap.asOf,
    policy: { name: policy.name || policyName, description: policy.description || '', usesOracle: !!policy.usesOracle },
    runtimeMs: Date.now() - t0,
    ...result,
    policyNotes: proposal.notes || null,
  };
  fs.writeFileSync(path.join(dir, 'scorecard.json'), JSON.stringify(json, null, 2));
  fs.writeFileSync(path.join(dir, 'scorecard.md'), markdown(snap, { name: policyName, ...policy }, result, proposal));

  // the proposed board itself, sequenced, so a human can eyeball a day
  const board = { week, policy: policyName, asOf: snap.asOf, routeDays: [] };
  for (const d of result.routeDays) {
    if (!d.proposal) continue;
    board.routeDays.push({ date: d.date, tech: d.tech, hours: d.proposal.hours, stops: d.proposal.stops });
  }
  board.assignments = proposal.assignments;
  fs.writeFileSync(path.join(dir, 'board.json'), JSON.stringify(board, null, 2));

  if (!quiet) {
    console.log(`\n=== ${week} · ${policyName} ===`);
    console.log(
      `due ${result.coverage.dueVisits}  late ${result.coverage.lateBookings}  placed ${result.coverage.proposed}  dropped ${result.coverage.dropped}  invented ${result.coverage.invented}  weekend ${result.coverage.weekendPlacements}`
    );
    console.log(
      `same tech ${result.agreement.vsActualRun.sameTechPct}%  same day ${result.agreement.vsActualRun.sameDayPct}%  both ${result.agreement.vsActualRun.sameBothPct}%  (n=${result.agreement.vsActualRun.n})`
    );
    console.log(
      `hours within +-10%: ${result.hours.withinTolerance}/${result.hours.routeDaysScored} (median ratio ${result.hours.medianRatio})  |  board only: ${result.hours.boardOnly.withinTolerance}/${result.hours.boardOnly.routeDaysScored} (median ${result.hours.boardOnly.medianRatio})`
    );
    console.log(
      `sequence drive ratio median ${result.sequence.medianDriveRatio} (uniform-model control ${result.sequence.medianUniformDriveRatio}) over ${result.sequence.routeDaysCompared} route-days  (ours ${result.sequence.totalProposalDriveMin} min vs OR ${result.sequence.totalActualDriveMin} min)`
    );
    if (result.windowCompliance) {
      const w = result.windowCompliance;
      console.log(
        `due windows: inside clamped ${w.insideEffective}/${w.n} (${w.insideEffectivePct}%)  inside raw ${w.insideRaw}/${w.n} (${w.insideRawPct}%)  overflow ${result.overflow.count}`
      );
    }
    console.log(
      `capacity: proposal over 9.5h ${result.capacity.proposal.over95h}/${result.capacity.proposal.routeDays} (actual ${result.capacity.actual.over95h}/${result.capacity.actual.routeDays})  max ${result.capacity.proposal.maxHours}h  |  compactness within +-5%: ${result.compactness.within5Pct}/${result.compactness.routeDaysScored}`
    );
    console.log(`gates: ${result.gates.map((g) => `${g.pass ? 'PASS' : 'FAIL'} ${g.gate}`).join(' | ')}`);
    console.log(`-> ${dir}  (${Date.now() - t0} ms)`);
  }
  return { week, policyName, result, dir };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('usage: node scripts/backtest.mjs --week=YYYY-MM-DD --policy=<name> [--all] [--out=dir] [--no-orOpt] [--quiet]');
    console.log('policies: ' + listPolicies().join(', '));
    console.log('golden weeks: ' + GOLDEN_WEEKS.join(', '));
    return;
  }
  const weeks = args.all ? GOLDEN_WEEKS : [args.week];
  const policies = args.all ? listPolicies() : [args.policy];
  const summary = [];
  for (const w of weeks) {
    for (const p of policies) {
      const r = await runOne({ week: w, policyName: p, outRoot: args.out, orOpt: args.orOpt, quiet: args.quiet });
      summary.push({
        week: w,
        policy: p,
        sameTechPct: r.result.agreement.vsActualRun.sameTechPct,
        sameDayPct: r.result.agreement.vsActualRun.sameDayPct,
        hoursWithin: `${r.result.hours.withinTolerance}/${r.result.hours.routeDaysScored}`,
        boardWithin: `${r.result.hours.boardOnly.withinTolerance}/${r.result.hours.boardOnly.routeDaysScored}`,
        boardRatio: r.result.hours.boardOnly.medianRatio,
        seqRatio: r.result.sequence.medianDriveRatio,
        seqRatioUniform: r.result.sequence.medianUniformDriveRatio,
        inWindowPct: r.result.windowCompliance ? r.result.windowCompliance.insideEffectivePct : null,
        over95h: `${r.result.capacity.proposal.over95h}/${r.result.capacity.proposal.routeDays}`,
        within5Pct: `${r.result.compactness.within5Pct}/${r.result.compactness.routeDaysScored}`,
        overflow: r.result.overflow.count,
        dropped: r.result.coverage.dropped,
        weekend: r.result.coverage.weekendPlacements,
        passed: r.result.passed,
      });
    }
  }
  if (summary.length > 1) {
    console.log('\n=== SUMMARY ===');
    console.table(summary);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((e) => {
    console.error(e.stack || String(e));
    process.exit(1);
  });
}
