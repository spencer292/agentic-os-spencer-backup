// derive-cadence.mjs - S3b. Measure how visit cadence ACTUALLY runs.
// Derives from data only. Does not read scheduling-rules.json or any rulebook.
// Inputs:  redesign/data/jobber/jobs.json, visits.json, notes-sample.json
// Output:  redesign/data/cadence-asbuilt.json
//
// ---------------------------------------------------------------------------
// S6 MEASUREMENT REPAIRS (build item 1, 2026-09-19). Five primitives were
// measuring something other than what they were named after:
//
//  a. DELIVERED GAPS are now completed-to-completed, dated by completedAt in
//     Pacific, and a gap that steps over an uncompleted visit is dropped rather
//     than counted (a skipped visit used to halve the measured gap). Was:
//     every consecutive pair of SCHEDULED visits, dated by startAt, filtered
//     only on the ending visit being complete.
//  b. A "next note" is delivered evidence only when a completed visit sits
//     within +/-1 day of it. An administrative or back-dated note used to
//     manufacture a delivered interval on its own.
//  c. Miss parsing moved to lib/parse-note.mjs and repaired (plural "misses",
//     "2x miss", "miss x2", sprung traps). Tested by tests/parse-note.test.mjs.
//  d. Quick Fix series length counts COMPLETED visits, reports completed and
//     scheduled-remaining separately, and the clean cohort now requires the
//     first visit to be at least 35 days before as-of so five weekly visits
//     could actually have been observed.
//  e. Weekday and tech hold are measured over COMPLETED visits only. They used
//     to include every future scheduled visit, which makes them a property of
//     the schedule template rather than of field behaviour.
//  f. Overdue: an uncompleted visit dated on or before as-of is a MISSED visit
//     and no longer suppresses hardOverdue; the active population now reaches
//     60 days back, so a job with no future work and a two-month-old last
//     visit is counted instead of dropped.
//
// Output keys are unchanged where demand-model.mjs reads them.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNote, triggerOf } from './lib/parse-note.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REDESIGN = path.resolve(HERE, '..');
const DATA = path.join(REDESIGN, 'data');
const JB = path.join(DATA, 'jobber');
const AS_OF = '2026-09-18';

const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'));

// ---------- date helpers (Pacific = UTC-7 in Aug/Sep 2026) ----------
const PAC_OFFSET_H = 7;
const pacDate = iso => {
  const t = new Date(iso).getTime() - PAC_OFFSET_H * 3600e3;
  return new Date(t).toISOString().slice(0, 10);
};
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const dowOf = ymd => DOW[new Date(ymd + 'T12:00:00Z').getUTCDay()];
const dayNum = ymd => Math.round(new Date(ymd + 'T12:00:00Z').getTime() / 86400e3);
const diffDays = (a, b) => dayNum(b) - dayNum(a);
// addDays must round-trip through the SAME anchor dayNum uses, or week ends land a day late.
const addDays = (ymd, n) => new Date(new Date(ymd + 'T12:00:00Z').getTime() + n * 86400e3).toISOString().slice(0, 10);

// ---------- stats ----------
const q = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return +(s[lo] + (s[hi] - s[lo]) * (i - lo)).toFixed(1);
};
const dist = arr => ({
  n: arr.length, median: q(arr, 0.5), p25: q(arr, 0.25), p75: q(arr, 0.75),
  min: arr.length ? Math.min(...arr) : null, max: arr.length ? Math.max(...arr) : null,
  shareWeekly: arr.length ? +(arr.filter(d => d <= 10).length / arr.length * 100).toFixed(1) : null,
  shareMonthlyish: arr.length ? +(arr.filter(d => d >= 24 && d <= 38).length / arr.length * 100).toFixed(1) : null,
});

// ---------- product from line items ----------
function productOf(job) {
  const names = (job.lineItems || []).map(li => String(li.name || '').toLowerCase());
  if (names.some(n => n.includes('total mole control'))) return 'TMCP';
  if (names.some(n => n.includes('quick fix'))) return 'Quick Fix';
  if (names.some(n => n.includes('friends and family'))) return 'Friends and family';
  if (names.some(n => n.includes('barter'))) return 'Barter';
  if (!names.length) return 'none (bid)';
  return 'other';
}

// ---------- custom fields (labels carry trailing whitespace in Jobber) ----------
function cf(job) {
  const m = {};
  for (const c of job.customFields || []) m[String(c.label).trim()] = c.value;
  const norm = v => (v === '' || v === undefined) ? null : v;
  return {
    activity: norm(m['Latest Activity']),
    moles: typeof m['Moles Caught (last visit)'] === 'number' ? m['Moles Caught (last visit)'] : null,
    misses: typeof m['Misses (last visit)'] === 'number' ? m['Misses (last visit)'] : null,
    nextAction: norm(m['Next Action']),
    totalCaught: typeof m['Total Caught'] === 'number' ? m['Total Caught'] : null,
  };
}

// trigger classification lives in lib/parse-note.mjs so the note reader and this
// file cannot drift apart. (S6 D-miss.)
//
// how long the office's own Next Action field allows before the next visit (target + 3d grace)
const NA_LIMIT = { 'Add visit': 10, Weekly: 10, '2 weeks': 17, Monthly: 33 };

// ---------- load ----------
const jobs = rd(path.join(JB, 'jobs.json'));
const visits = rd(path.join(JB, 'visits.json'));
const notesSample = rd(path.join(JB, 'notes-sample.json'));

const visitDates = visits.map(v => pacDate(v.startAt)).sort();
const WIN = { from: visitDates[0], to: visitDates[visitDates.length - 1] };

// group visits by job
//
// REPAIR (a): a completed visit carries TWO dates. `date` is when it was booked
// (startAt) and orders the schedule; `completedDate` is when the tech was
// actually there (completedAt) and is the only date a delivered gap may use.
// They differ whenever a visit was worked on a different day than it was booked
// for, which is exactly the case a cadence measurement must not silently absorb.
let missingCompletedAt = 0;
const byJob = new Map();
for (const v of visits) {
  const d = pacDate(v.startAt);
  const complete = !!v.isComplete;
  let cd = null;
  if (complete) {
    if (v.completedAt) cd = pacDate(v.completedAt);
    else { cd = d; missingCompletedAt++; }   // fall back to the booked day, and count it
  }
  const rec = {
    date: d, dow: dowOf(d), isComplete: complete, status: v.visitStatus,
    completedDate: cd,
    tech: (v.techs && v.techs[0]) || null,
    visitId: v.id,
  };
  if (!byJob.has(v.jobNumber)) byJob.set(v.jobNumber, []);
  byJob.get(v.jobNumber).push(rec);
}
for (const arr of byJob.values()) {
  arr.sort((a, b) => a.date.localeCompare(b.date) || String(a.visitId).localeCompare(String(b.visitId)));
}

// REPAIR (a): delivered gaps. Walk the visits in schedule order. Between two
// consecutive COMPLETED visits, measure completedDate to completedDate. If any
// uncompleted visit was booked strictly between them, the customer was meant to
// be served in that hole and was not, so the gap is NOT a delivered cadence
// observation — it is a skipped visit, and counting it halves the measured gap.
// Those are recorded separately as `skippedSpans` rather than thrown away.
function deliveredGaps(vs) {
  const out = { gaps: [], skipped: 0 };
  let prev = null;            // previous completed visit
  let holeSincePrev = false;  // an uncompleted visit booked after prev
  for (const v of vs) {
    if (!v.isComplete) { if (prev) holeSincePrev = true; continue; }
    if (prev) {
      const g = diffDays(prev.completedDate, v.completedDate);
      if (holeSincePrev) {
        out.skipped++;
        v.deliveredGapDays = null;
        v.deliveredGapExcluded = 'an uncompleted visit was booked between these two completions';
      } else if (g > 0 && g <= 120) {
        v.deliveredGapDays = g;
        out.gaps.push(g);
      } else {
        v.deliveredGapDays = null;
        if (g !== 0) v.deliveredGapExcluded = 'gap ' + g + 'd outside the 1..120 measurable range';
      }
    }
    prev = v;
    holeSincePrev = false;
  }
  return out;
}

// ---------- per-job records ----------
const recs = [];
for (const job of jobs) {
  const product = productOf(job);
  const st = cf(job);
  const vs = byJob.get(job.jobNumber) || [];
  for (let i = 1; i < vs.length; i++) vs[i].intervalFromPrev = diffDays(vs[i - 1].date, vs[i].date);
  const dg = deliveredGaps(vs);
  const completed = vs.filter(v => v.isComplete);
  // last completed visit, by the day it was WORKED, not the day it was booked
  const completedByDone = [...completed].sort((a, b) => a.completedDate.localeCompare(b.completedDate));
  const last = completedByDone.length ? completedByDone[completedByDone.length - 1] : null;
  const after = last ? vs.filter(v => v.date > last.completedDate) : vs.slice();
  const nextVisit = after.length ? after[0] : null;

  // REPAIR (f): an uncompleted visit dated on or before as-of is a MISSED visit,
  // not a plan. The old code took the first booked visit after the last
  // completion as proof that service was arranged, so a three-week-old
  // appointment nobody kept made the job look satisfied and suppressed
  // hardOverdue. Only work still ahead of us counts as arranged.
  const missedStale = after.filter(v => !v.isComplete && v.date <= AS_OF);
  const nextOpen = after.find(v => v.isComplete || v.date > AS_OF) || null;

  // route-day: dominant (tech, dow) over completed visits, else over all visits
  const tally = (list, keyf) => {
    const m = new Map();
    for (const v of list) { const k = keyf(v); if (!k) continue; m.set(k, (m.get(k) || 0) + 1); }
    let best = null, bn = 0;
    for (const [k, n] of m) if (n > bn) { best = k; bn = n; }
    return best ? { key: best, n: bn } : null;
  };
  const src = completed.length ? completed : vs;
  const tTech = tally(src, v => v.tech);
  const tDow = tally(src, v => v.dow);
  const routeDay = (tTech && tDow) ? {
    tech: tTech.key, dow: tDow.key,
    basis: completed.length ? 'completed visits' : 'scheduled visits',
    techShare: +(tTech.n / src.length).toFixed(2),
    dowShare: +(tDow.n / src.length).toFixed(2),
  } : null;

  // REPAIR (a): `intervalsCompleted` is now the delivered set — completion to
  // completion, no step over a skipped visit. The key name is kept because
  // demand-model.mjs reads it as P0's own-gap evidence.
  const intervalsCompleted = dg.gaps;
  const ownMedian = intervalsCompleted.length ? q(intervalsCompleted, 0.5) : null;

  const daysSinceLast = last ? diffDays(last.completedDate, AS_OF) : null;
  const nextSched = vs.find(v => v.date > AS_OF) || null;
  const naLimit = st.nextAction ? (NA_LIMIT[st.nextAction] ?? null) : null;
  let naSatisfied = null, naReason = null;
  if (last && naLimit != null) {
    const due = dayNum(last.completedDate) + naLimit;
    if (nextOpen && dayNum(nextOpen.date) <= due) { naSatisfied = true; naReason = 'next visit inside limit'; }
    else if (!nextOpen) {
      naSatisfied = false;
      naReason = missedStale.length
        ? missedStale.length + ' visit(s) booked and not completed on or before ' + AS_OF + ', nothing scheduled since'
        : 'no visit scheduled after last completed';
    } else {
      naSatisfied = false;
      naReason = 'next visit ' + nextOpen.date + ' is ' + (dayNum(nextOpen.date) - due) + 'd past the ' + naLimit + 'd limit'
        + (missedStale.length ? ' (and ' + missedStale.length + ' earlier visit(s) were missed)' : '');
    }
  }
  const hardOverdue = (last && naLimit != null)
    ? (dayNum(AS_OF) > dayNum(last.completedDate) + naLimit && (!nextOpen || nextOpen.date > AS_OF))
    : null;

  // REPAIR (f): 45 -> 60 days. The overdue metric exists to find neglected work;
  // a 45-day cutoff drops the very jobs that are most neglected out of the
  // denominator, so the number it reports can only ever understate.
  const activeJob = job.jobStatus !== 'archived' && (!!nextSched || (daysSinceLast != null && daysSinceLast <= 60));

  recs.push({
    jobNumber: job.jobNumber, product, jobStatus: job.jobStatus, client: job.client ? job.client.name : null,
    zip: job.property ? job.property.postalCode : null, city: job.property ? job.property.city : null,
    lat: job.property ? job.property.lat : null, lng: job.property ? job.property.lng : null,
    recurrence: job.visitSchedule ? job.visitSchedule.recurrence : null,
    jobStartAt: job.startAt ? pacDate(job.startAt) : null,
    pastCountAllTime: job.visitsInfo ? job.visitsInfo.pastCount : null,
    routeDay, active: activeJob,
    latestState: st, trigger: triggerOf(st),
    stateAppliesTo: last ? last.date : null,
    visits: vs.map(v => ({
      date: v.date, dow: v.dow, isComplete: v.isComplete, tech: v.tech,
      completedDate: v.completedDate ?? null,
      intervalFromPrev: v.intervalFromPrev ?? null,
      deliveredGapDays: v.deliveredGapDays ?? null,
    })),
    nVisitsInWindow: vs.length, nCompletedInWindow: completed.length,
    nScheduledRemaining: vs.filter(v => !v.isComplete && v.date > AS_OF).length,
    nMissedStale: missedStale.length,
    intervalsCompleted, ownMedianInterval: ownMedian,
    deliveredGapsSkipped: dg.skipped,
    lastCompleted: last ? last.completedDate : null,
    lastCompletedBookedFor: last ? last.date : null,
    intervalAfterLastCompleted: (last && nextVisit) ? diffDays(last.completedDate, nextVisit.date) : null,
    intervalAfterIsScheduled: (last && nextVisit) ? !nextVisit.isComplete : null,
    nextVisit: nextVisit ? nextVisit.date : null,
    nextOpenVisit: nextOpen ? nextOpen.date : null,
    nextScheduled: nextSched ? nextSched.date : null,
    daysSinceLastCompleted: daysSinceLast,
    nextActionLimitDays: naLimit, nextActionSatisfied: naSatisfied, nextActionReason: naReason,
    hardOverdue,
  });
}

// ---------- A. measured interval distributions by trigger (job-level latest state) ----------
const byTrigger = {};
for (const r of recs) {
  const iv = r.intervalAfterLastCompleted;
  if (iv == null || iv <= 0 || iv > 120) continue;
  const k = r.trigger;
  if (!byTrigger[k]) byTrigger[k] = { all: [], TMCP: [], 'Quick Fix': [], scheduledOnly: [], completedOnly: [] };
  byTrigger[k].all.push(iv);
  if (byTrigger[k][r.product]) byTrigger[k][r.product].push(iv);
  (r.intervalAfterIsScheduled ? byTrigger[k].scheduledOnly : byTrigger[k].completedOnly).push(iv);
}
const intervalTable = {};
for (const [k, v] of Object.entries(byTrigger)) {
  intervalTable[k] = {
    all: dist(v.all), TMCP: dist(v.TMCP), quickFix: dist(v['Quick Fix']),
    scheduledForward: dist(v.scheduledOnly), alreadyCompleted: dist(v.completedOnly),
  };
}
// STRUCTURAL: the job-level state describes the LAST completed visit, so the next visit after it
// is by construction never yet completed. Everything in intervalTable is therefore a BOOKED
// promise, not a delivered interval. Delivered cadence must come from completedIntervals /
// notesCrossCheck below. Assert it so the claim stays true if the snapshot changes.
const bookedOnly = Object.values(intervalTable).every(v => v.alreadyCompleted.n === 0);

// ---------- B. notes-sample cross-check: per-VISIT state -> interval to next visit ----------
// The reader is lib/parse-note.mjs (REPAIR c). tests/parse-note.test.mjs covers it.

// REPAIR (b): a note is not a visit. The old code accepted the NEXT NOTE as
// proof that the tech returned, so an administrative entry, a back-dated
// write-up or two notes typed on one visit manufactured a short "delivered"
// interval — and that median is what demand-model.mjs uses as P0's fallback.
// A note now counts as delivered evidence only when a COMPLETED visit sits
// within +/-1 day of it. Anything else is 'note only' and is excluded.
const LINK_TOLERANCE_DAYS = 1;
function linkedCompletion(vs, ymd) {
  let best = null, bestAbs = Infinity;
  for (const v of vs) {
    if (!v.isComplete) continue;
    const delta = diffDays(ymd, v.completedDate);
    const a = Math.abs(delta);
    if (a <= LINK_TOLERANCE_DAYS && a < bestAbs) { bestAbs = a; best = { date: v.completedDate, delta }; }
  }
  return best;
}

const noteRows = [];
for (const j of notesSample) {
  const vs = byJob.get(j.jobNumber) || [];
  const ns = [...(j.notes || [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (let i = 0; i < ns.length; i++) {
    const d = pacDate(ns[i].createdAt);
    const p = parseNote(ns[i].message);
    let nextD = null, kind = null, link = null;
    if (i + 1 < ns.length) {
      nextD = pacDate(ns[i + 1].createdAt);
      link = linkedCompletion(vs, nextD);
      kind = link ? 'next note (visit-linked)' : 'note only';
    }
    const nv = vs.find(v => v.date > d);
    if (nv && (!nextD || nv.date < nextD)) {
      nextD = nv.isComplete ? nv.completedDate : nv.date;
      kind = nv.isComplete ? 'next completed visit' : 'next scheduled visit';
      link = nv.isComplete ? { date: nv.completedDate, delta: 0 } : null;
    }
    if (!nextD) continue;
    const iv = diffDays(d, nextD);
    if (iv <= 0 || iv > 120) continue;
    noteRows.push({
      jobNumber: j.jobNumber, product: j.product, date: d, interval: iv, kind,
      linkedCompletedDate: link ? link.date : null,
      linkDeltaDays: link ? link.delta : null,
      trigger: triggerOf(p), ...p,
    });
  }
}
// a note row is DELIVERED when the thing that followed it demonstrably happened:
// a completed visit, or a note we could tie to one.
const DELIVERED = r => r.kind === 'next note (visit-linked)' || r.kind === 'next completed visit';
const noteByTrigger = {};
const noteByTriggerDelivered = {};
for (const r of noteRows) {
  (noteByTrigger[r.trigger] = noteByTrigger[r.trigger] || []).push(r.interval);
  if (DELIVERED(r)) (noteByTriggerDelivered[r.trigger] = noteByTriggerDelivered[r.trigger] || []).push(r.interval);
}
const noteIntervalTable = Object.fromEntries(Object.entries(noteByTrigger).map(([k, v]) => [k, dist(v)]));
const noteDeliveredTable = Object.fromEntries(Object.entries(noteByTriggerDelivered).map(([k, v]) => [k, dist(v)]));
const noteKindCounts = noteRows.reduce((m, r) => (m[r.kind] = (m[r.kind] || 0) + 1, m), {});
const noteByNextAction = {};
for (const r of noteRows) if (r.nextAction) (noteByNextAction[r.nextAction] = noteByNextAction[r.nextAction] || []).push(r.interval);
const noteNextActionTable = Object.fromEntries(Object.entries(noteByNextAction).map(([k, v]) => [k, dist(v)]));
const noteNextActionCounts = Object.fromEntries(Object.entries(noteByNextAction).map(([k, v]) => [k, v.length]));

// ---------- C. Quick Fix series reality ----------
// REPAIR (d): "series length delivered: median 5" was counting FUTURE
// appointments. 112 of the old 134-job cohort carried at least one incomplete
// visit in that number. Two things change:
//   - completedInSeries and scheduledRemaining are reported separately, and
//     visitsPerJob is now the COMPLETED count.
//   - the clean cohort requires the job's first visit to be at least 35 days
//     before as-of. A five-week weekly series cannot be observed in less, so
//     the old cohort was measuring jobs that simply had not finished yet.
const QF_SERIES_DAYS = 35;
const qf = recs.filter(r => r.product === 'Quick Fix');
const firstVisitOf = r => (r.visits.length ? r.visits[0].date : null);
const qfClean = qf.filter(r => {
  const fv = firstVisitOf(r);
  return fv && fv >= WIN.from && diffDays(fv, AS_OF) >= QF_SERIES_DAYS;
});
const qfSeries = c => {
  const completedLens = c.map(r => r.nCompletedInWindow);
  const scheduledLens = c.map(r => r.nVisitsInWindow);
  const remainingLens = c.map(r => r.nScheduledRemaining);
  // spacing between visits the tech actually made, not between bookings
  const spacing = c.flatMap(r => r.visits.map(v => v.deliveredGapDays).filter(n => typeof n === 'number' && n > 0 && n <= 60));
  return {
    jobs: c.length,
    visitsPerJob: dist(completedLens),                 // COMPLETED — the delivered series length
    completedInSeries: dist(completedLens),
    scheduledRemaining: dist(remainingLens),
    scheduledVisitsPerJob: dist(scheduledLens),        // the old number, kept and labelled
    spacingDays: dist(spacing),
    ranPastFiveScheduled: c.filter(r => r.nVisitsInWindow > 5).length,
    ranPastFiveCompleted: c.filter(r => r.nCompletedInWindow > 5).length,
    completedFiveOrMore: c.filter(r => r.nCompletedInWindow >= 5).length,
    scheduledFiveOrMore: c.filter(r => r.nVisitsInWindow >= 5).length,
    jobsWithAnyIncompleteVisit: c.filter(r => r.nVisitsInWindow > r.nCompletedInWindow).length,
    stillHaveFutureVisit: c.filter(r => r.nextScheduled).length,
    archived: c.filter(r => r.jobStatus === 'archived').length,
    shareSpacingWeeklyPct: spacing.length ? +(spacing.filter(d => d <= 10).length / spacing.length * 100).toFixed(1) : null,
    withAnyCompleted: c.filter(r => r.nCompletedInWindow > 0).length,
  };
};

// ---------- D. TMCP quiet interval + weekday hold ----------
const tmcp = recs.filter(r => r.product === 'TMCP');
const quiet = tmcp.filter(r => r.trigger.indexOf('quiet') === 0 && r.intervalAfterLastCompleted != null);
const quietIv = quiet.map(r => r.intervalAfterLastCompleted).filter(n => n > 0 && n <= 120);
// REPAIR (e): hold is a fact about the FIELD, so only completed visits may
// enter it. The old denominator was nVisitsInWindow, of which 1,248 of 4,290
// were future and incomplete — that measured how consistently the schedule
// template was written, not how consistently the tech turned up.
// A completed visit's weekday is the day it was WORKED (completedDate).
let dowHoldNum = 0, dowHoldDen = 0, techHoldNum = 0, techHoldDen = 0;
const perJobDowHold = [];
for (const r of tmcp) {
  const done = r.visits.filter(v => v.isComplete);
  if (!r.routeDay || done.length < 2) continue;
  const same = done.filter(v => dowOf(v.completedDate || v.date) === r.routeDay.dow).length;
  dowHoldNum += same; dowHoldDen += done.length;
  perJobDowHold.push(Math.round(same / done.length * 100));
  const stc = done.filter(v => v.tech === r.routeDay.tech).length;
  techHoldNum += stc; techHoldDen += done.length;
}
const tmcpAllIv = tmcp.flatMap(r => r.intervalsCompleted).filter(n => n > 0 && n <= 120);

// ---------- E. overdue view as of AS_OF ----------
const activeRecs = recs.filter(r => r.active);
const overdueRows = activeRecs.filter(r => r.nextActionSatisfied === false);
const hardRows = activeRecs.filter(r => r.hardOverdue === true);
const groupCount = (rows, keyf) => {
  const m = {};
  for (const r of rows) { const k = keyf(r) == null ? 'unassigned' : keyf(r); m[k] = (m[k] || 0) + 1; }
  return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
};
const rdKey = r => (r.routeDay ? r.routeDay.tech + ' / ' + r.routeDay.dow : null);

const overdue = {
  asOf: AS_OF,
  definition: {
    active: 'jobStatus != archived AND (a future visit exists OR last completed visit within 60 days)',
    unsatisfied: "the job's own Next Action field is not met by the schedule: no OPEN visit after the last completed one, or the next open visit falls past the field limit (Add visit 10d, 2 weeks 17d, Monthly 33d = target + 3d grace)",
    hardOverdue: 'the limit date has already passed and no visit happened or is still booked ahead of today',
    missedStale: 'a visit booked on or before as-of that was never completed. It counts as MISSED service and no longer stands in for an arrangement.',
    repairs: 'S6 item 1f: the 45-day active cutoff became 60, and a stale uncompleted visit no longer suppresses hardOverdue.',
  },
  activeJobs: activeRecs.length,
  unsatisfied: overdueRows.length,
  hardOverdue: hardRows.length,
  noFutureVisitAtAll: activeRecs.filter(r => !r.nextScheduled).length,
  jobsWithMissedStaleVisits: activeRecs.filter(r => r.nMissedStale > 0).length,
  missedStaleVisits: activeRecs.reduce((a, r) => a + r.nMissedStale, 0),
  unsatisfiedByProduct: groupCount(overdueRows, r => r.product),
  unsatisfiedByNextAction: groupCount(overdueRows, r => r.latestState.nextAction),
  unsatisfiedByTrigger: groupCount(overdueRows, r => r.trigger),
  unsatisfiedByRouteDay: groupCount(overdueRows, rdKey),
  hardOverdueByProduct: groupCount(hardRows, r => r.product),
  hardOverdueByTrigger: groupCount(hardRows, r => r.trigger),
  hardOverdueByRouteDay: groupCount(hardRows, rdKey),
  activeByProduct: groupCount(activeRecs, r => r.product),
  activeByRouteDay: groupCount(activeRecs, rdKey),
  daysSinceLastCompleted: {
    allActive: dist(activeRecs.map(r => r.daysSinceLastCompleted).filter(n => n != null)),
    unsatisfied: dist(overdueRows.map(r => r.daysSinceLastCompleted).filter(n => n != null)),
    hardOverdue: dist(hardRows.map(r => r.daysSinceLastCompleted).filter(n => n != null)),
  },
  worst20: [...hardRows].sort((a, b) => (b.daysSinceLastCompleted || 0) - (a.daysSinceLastCompleted || 0)).slice(0, 20)
    .map(r => ({
      job: r.jobNumber, client: r.client, product: r.product, trigger: r.trigger,
      nextAction: r.latestState.nextAction, lastCompleted: r.lastCompleted,
      daysSince: r.daysSinceLastCompleted, nextVisit: r.nextVisit, routeDay: rdKey(r),
    })),
};

// ---------- F. seasonality ----------
// TRUNCATION: a visit's gap to its prior visit is only observable if that prior visit is inside
// the window. For a <=10d test the lookback must reach WIN.from, so any week starting sooner than
// WIN.from + 10d is biased upward and is flagged rather than reported as fact.
const WEEKS = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14'];
const tmcpActiveDenom = tmcp.filter(r => r.visits.some(v => v.isComplete && (v.completedDate || v.date) >= '2026-08-17' && (v.completedDate || v.date) <= '2026-09-17')).length;
const seasonality = WEEKS.map(wstart => {
  const wend = addDays(wstart, 6);
  let weekly = 0, total = 0, visitsThisWeek = 0;
  const ivs = [];
  const daysSeen = new Set();
  for (const r of tmcp) {
    for (const v of r.visits) {
      if (!v.isComplete) continue;
      const cd = v.completedDate || v.date;             // REPAIR (a): the day it was worked
      if (cd < wstart || cd > wend) continue;
      visitsThisWeek++; daysSeen.add(cd);
      if (typeof v.deliveredGapDays !== 'number' || v.deliveredGapDays <= 0 || v.deliveredGapDays > 120) continue;
      total++; ivs.push(v.deliveredGapDays);
      if (v.deliveredGapDays <= 10) weekly++;
    }
  }
  const lookbackObservable = dayNum(wstart) - 10 >= dayNum(WIN.from);
  const partialWeek = wend > '2026-09-17';
  const rate = tmcpActiveDenom ? visitsThisWeek / tmcpActiveDenom : null;
  return {
    weekStart: wstart, weekEnd: wend,
    tmcpCompletedVisits: visitsThisWeek,
    tmcpVisitsWithPriorVisit: total,
    onWeeklyCadence: weekly,
    shareWeeklyPct: total ? +(weekly / total * 100).toFixed(1) : null,
    medianIntervalDays: q(ivs, 0.5),
    lookbackObservable,
    partialWeek,
    // truncation-free alternative: visits delivered per active TMCP job that week
    visitsPerActiveTmcpJob: rate == null ? null : +rate.toFixed(3),
    impliedCadenceDays: rate ? +(7 / rate).toFixed(1) : null,
    // the last week is cut off mid-week and one week holds Labor Day, so normalize by field day
    fieldDaysObserved: daysSeen.size,
    fieldDays: [...daysSeen].sort(),
    tmcpVisitsPerFieldDay: daysSeen.size ? +(visitsThisWeek / daysSeen.size).toFixed(1) : null,
    ratePerFieldDayNormalized: (rate != null && daysSeen.size)
      ? +((visitsThisWeek / daysSeen.size * 5) / tmcpActiveDenom).toFixed(3) : null,
    caveat: !lookbackObservable
      ? 'BIASED: the <=10d lookback falls outside the visit window, so shareWeeklyPct is inflated toward 100 by construction. Use visitsPerActiveTmcpJob for this week.'
      : (partialWeek ? 'PARTIAL: week extends past the last completed visit date, so counts are low.' : null),
  };
});

// ---------- assemble ----------
const out = {
  generatedAt: new Date().toISOString(),
  asOf: AS_OF,
  visitWindow: WIN,
  source: {
    jobs: jobs.length, visits: visits.length, notesSampleJobs: notesSample.length,
    notesSampleNotes: notesSample.reduce((a, j) => a + (j.notes || []).length, 0),
  },
  repairs: {
    applied: '2026-09-19, build item 1 of the redesign plan',
    a: 'delivered gaps are completion-to-completion (completedAt, Pacific) and never step over an uncompleted visit',
    b: 'a following note counts as delivered only when a completed visit sits within +/-1 day of it',
    c: 'miss parsing moved to lib/parse-note.mjs; plural "misses", "2x miss", "miss x2" and sprung traps now read as misses',
    d: 'Quick Fix series length counts completed visits; cohort requires a first visit at least ' + QF_SERIES_DAYS + ' days before as-of',
    e: 'weekday and tech hold measured over completed visits only, by the day worked',
    f: 'stale uncompleted visits count as missed and no longer suppress hardOverdue; active population reaches 60 days back',
    visitsMissingCompletedAt: missingCompletedAt,
    deliveredGapsDroppedForSkippedVisit: recs.reduce((a, r) => a + r.deliveredGapsSkipped, 0),
  },
  limitations: [
    'Job custom fields (Latest Activity / Moles Caught / Misses / Next Action) are JOB-level, not visit-level. They describe only the LAST completed visit. Every trigger-attributed interval below is therefore one row per job, measured forward from that job last completed visit.',
    'The forward interval for most jobs is a SCHEDULED date, not a delivered one. Scheduled-vs-completed splits are reported separately in intervalTable.*.scheduledForward / .alreadyCompleted.',
    'Visits are only available for ' + WIN.from + '..' + WIN.to + '. Intervals that straddle the start of that window are not observable, so the first visit in the window has no intervalFromPrev.',
    'The notes sample (40 jobs, 192 notes) carries true PER-VISIT state and is used as an independent cross-check of the job-level numbers. It is a small, product-stratified sample, not a random one.',
    'Weekday/tech hold is measured inside the window only and over COMPLETED visits only; a tech handover inside the window reads as a hold failure.',
    'A delivered gap needs two completed visits with no skipped visit between them, so jobs whose service was interrupted contribute fewer observations than jobs that ran clean. The count dropped for that reason is reported in repairs.deliveredGapsDroppedForSkippedVisit.',
  ],
  productCounts: recs.reduce((m, r) => (m[r.product] = (m[r.product] || 0) + 1, m), {}),
  triggerCounts: recs.reduce((m, r) => (m[r.trigger] = (m[r.trigger] || 0) + 1, m), {}),
  triggerCountsActive: activeRecs.reduce((m, r) => (m[r.trigger] = (m[r.trigger] || 0) + 1, m), {}),
  intervalTable,
  intervalTableIsBookedNotDelivered: bookedOnly,
  deliveredIntervals: {
    note: 'consecutive COMPLETED-visit gaps inside the window, dated by completedAt in Pacific and never stepping over an uncompleted visit, unattributed to a trigger (the job-level fields cannot reach back this far). This is what the field actually delivered.',
    TMCP: dist(tmcpAllIv),
    quickFix: dist(recs.filter(r => r.product === 'Quick Fix').flatMap(r => r.intervalsCompleted).filter(n => n > 0 && n <= 120)),
    allProducts: dist(recs.flatMap(r => r.intervalsCompleted).filter(n => n > 0 && n <= 120)),
  },
  notesCrossCheck: {
    rows: noteRows.length, kindCounts: noteKindCounts,
    byTrigger: noteIntervalTable, byTriggerDelivered: noteDeliveredTable,
    byNextAction: noteNextActionTable, nextActionCounts: noteNextActionCounts,
  },
  quickFix: {
    allJobs: qfSeries(qf),
    cleanCohortStartedInWindow: qfSeries(qfClean),
    note: 'cleanCohort = Quick Fix jobs whose job startAt falls inside the visit window, so the whole series is observable.',
  },
  tmcpQuiet: {
    quietJobs: quiet.length,
    forwardInterval: dist(quietIv),
    allTmcpCompletedIntervals: dist(tmcpAllIv),
    weekdayHoldPct: dowHoldDen ? +(dowHoldNum / dowHoldDen * 100).toFixed(1) : null,
    techHoldPct: techHoldDen ? +(techHoldNum / techHoldDen * 100).toFixed(1) : null,
    holdBasis: 'COMPLETED visits only, by the weekday the visit was worked (S6 D-holdstats)',
    holdVisitsCounted: dowHoldDen,
    jobsMeasuredForHold: perJobDowHold.length,
    jobsWith100PctDowHold: perJobDowHold.filter(p => p === 100).length,
  },
  seasonality,
  overdue,
  jobs: recs,
};

fs.mkdirSync(DATA, { recursive: true });
fs.writeFileSync(path.join(DATA, 'cadence-asbuilt.json'), JSON.stringify(out, null, 1));

// ---------- console report ----------
const L = [];
L.push('window ' + WIN.from + '..' + WIN.to + '  jobs ' + jobs.length + '  visits ' + visits.length + '  asOf ' + AS_OF);
L.push('');
L.push('DELIVERED cadence (consecutive completed-visit gaps, unattributed)');
L.push('  TMCP       ' + JSON.stringify(out.deliveredIntervals.TMCP));
L.push('  Quick Fix  ' + JSON.stringify(out.deliveredIntervals.quickFix));
L.push('  all        ' + JSON.stringify(out.deliveredIntervals.allProducts));
L.push('');
L.push('BOOKED-NEXT interval after last completed visit, BY TRIGGER (1 row/job).');
L.push('  NOTE: every row here is a SCHEDULED date, never a delivered one (bookedOnly=' + bookedOnly + ').');
L.push('trigger'.padEnd(36) + 'n'.padStart(5) + 'med'.padStart(7) + 'p25'.padStart(7) + 'p75'.padStart(7) + '  %<=10d');
for (const [k, v] of Object.entries(intervalTable).sort((a, b) => b[1].all.n - a[1].all.n)) {
  L.push(k.padEnd(36) + String(v.all.n).padStart(5) + String(v.all.median).padStart(7) + String(v.all.p25).padStart(7) + String(v.all.p75).padStart(7) + String(v.all.shareWeekly).padStart(8));
}
L.push('');
L.push('  TMCP only:');
for (const [k, v] of Object.entries(intervalTable).sort((a, b) => b[1].TMCP.n - a[1].TMCP.n)) {
  L.push('  ' + k.padEnd(34) + String(v.TMCP.n).padStart(5) + String(v.TMCP.median).padStart(7) + String(v.TMCP.p25).padStart(7) + String(v.TMCP.p75).padStart(7) + String(v.TMCP.shareWeekly).padStart(8));
}
L.push('');
L.push('NOTES CROSS-CHECK (true per-visit state, 40-job sample)  rows=' + noteRows.length + '  ' + JSON.stringify(noteKindCounts));
L.push('  -- all rows --');
for (const [k, v] of Object.entries(noteIntervalTable).sort((a, b) => b[1].n - a[1].n)) {
  L.push('  ' + k.padEnd(34) + String(v.n).padStart(5) + String(v.median).padStart(7) + '  %<=10d ' + v.shareWeekly);
}
L.push('  -- DELIVERED rows only (the follow-up actually happened) --');
for (const [k, v] of Object.entries(noteDeliveredTable).sort((a, b) => b[1].n - a[1].n)) {
  L.push('  ' + k.padEnd(34) + String(v.n).padStart(5) + String(v.median).padStart(7) + '  p25 ' + v.p25 + ' p75 ' + v.p75 + '  %<=10d ' + v.shareWeekly);
}
L.push('  -- by Next Action written on the note --');
for (const [k, v] of Object.entries(noteNextActionTable).sort((a, b) => b[1].n - a[1].n)) {
  L.push('  ' + k.padEnd(34) + String(v.n).padStart(5) + String(v.median).padStart(7) + '  %<=10d ' + v.shareWeekly);
}
L.push('');
L.push('QUICK FIX all       ' + JSON.stringify(out.quickFix.allJobs));
L.push('QUICK FIX clean     ' + JSON.stringify(out.quickFix.cleanCohortStartedInWindow));
{
  const c = out.quickFix.cleanCohortStartedInWindow;
  L.push('  clean cohort = first visit inside the window AND >=' + QF_SERIES_DAYS + 'd before ' + AS_OF + '  (n=' + c.jobs + ')');
  L.push('    completed in series   median ' + c.completedInSeries.median + '  p25 ' + c.completedInSeries.p25 + '  p75 ' + c.completedInSeries.p75);
  L.push('    scheduled remaining   median ' + c.scheduledRemaining.median + '  max ' + c.scheduledRemaining.max);
  L.push('    completed >=5 visits  ' + c.completedFiveOrMore + ' of ' + c.jobs + '   scheduled >=5: ' + c.scheduledFiveOrMore);
}
L.push('');
L.push('TMCP QUIET ' + JSON.stringify(out.tmcpQuiet));
L.push('');
L.push('SEASONALITY (TMCP; denominator for the rate column = ' + tmcpActiveDenom + ' TMCP jobs with a completed visit 08-17..09-17)');
for (const s of seasonality) {
  L.push('  ' + s.weekStart + '  visits=' + String(s.tmcpCompletedVisits).padStart(4)
    + '  weekly ' + String(s.shareWeeklyPct).padStart(5) + '%  median ' + String(s.medianIntervalDays).padStart(4) + 'd'
    + '  visits/job ' + String(s.visitsPerActiveTmcpJob).padStart(5) + '  implied ' + String(s.impliedCadenceDays).padStart(5) + 'd'
    + '  fieldDays ' + s.fieldDaysObserved + '  v/fieldDay ' + String(s.tmcpVisitsPerFieldDay).padStart(6)
    + '  rate@5d ' + String(s.ratePerFieldDayNormalized).padStart(5)
    + (s.caveat ? '  <<' + s.caveat.split(':')[0] : ''));
}
L.push('');
L.push('OVERDUE as of ' + AS_OF);
L.push('  active jobs ' + overdue.activeJobs + '  unsatisfied ' + overdue.unsatisfied + '  hard overdue ' + overdue.hardOverdue + '  no future visit ' + overdue.noFutureVisitAtAll);
L.push('  missed stale visits ' + overdue.missedStaleVisits + ' across ' + overdue.jobsWithMissedStaleVisits + ' active jobs (booked on or before ' + AS_OF + ', never completed)');
L.push('  REPAIRS: ' + JSON.stringify(out.repairs.visitsMissingCompletedAt) + ' completed visits had no completedAt (fell back to the booked day); '
  + out.repairs.deliveredGapsDroppedForSkippedVisit + ' delivered gaps dropped for stepping over a skipped visit');
L.push('  unsatisfied by product    ' + JSON.stringify(overdue.unsatisfiedByProduct));
L.push('  unsatisfied by NextAction ' + JSON.stringify(overdue.unsatisfiedByNextAction));
L.push('  unsatisfied by trigger    ' + JSON.stringify(overdue.unsatisfiedByTrigger));
L.push('  hard overdue by product   ' + JSON.stringify(overdue.hardOverdueByProduct));
L.push('  unsatisfied by route-day:');
for (const [k, n] of Object.entries(overdue.unsatisfiedByRouteDay)) L.push('    ' + k.padEnd(28) + n);
L.push('  hard overdue by route-day:');
for (const [k, n] of Object.entries(overdue.hardOverdueByRouteDay)) L.push('    ' + k.padEnd(28) + n);
L.push('  worst 10: ' + overdue.worst20.slice(0, 10).map(w => '#' + w.job + ' ' + w.daysSince + 'd ' + w.trigger).join(' | '));
console.log(L.join('\n'));
