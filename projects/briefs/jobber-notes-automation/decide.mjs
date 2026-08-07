// decide.mjs — the CANONICAL follow-up scheduling decision, as a pure function.
// Kept separate from Jobber I/O so it can be unit-tested. See brief.md for the rules.

import { followUpDays } from './parse-note.mjs';

const isoDate = d => d.toISOString().slice(0, 10);
export const addDays = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return isoDate(d); };
export const monthOf = ymd => ymd.slice(0, 7);
export const daysBetween = (a, b) => Math.round((new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) / 86400000);

/**
 * Classify the product from a job's line-item names. `jobType` is useless here: EVERY Got Moles job
 * is RECURRING — Quick Fix is a 5-week recurring series (Spencer 2026-08-05). Dashes vary between
 * line items ("Program -- Year round" vs "The Quick Fix — One-Month"), so match loosely, and scan
 * every item because "Repeat Customer Discount" rides along as a second one.
 * @param names array of line-item name strings
 * @returns 'TMCP' | 'QUICKFIX' | 'OTHER'
 */
export function productOf(names = []) {
  const hay = names.filter(Boolean).join(' ~ ').toLowerCase();
  if (hay.includes('total mole control')) return 'TMCP';
  if (hay.includes('quick fix')) return 'QUICKFIX';
  return 'OTHER';
}

const ACTIVE_CODES = new Set(['Low', 'Moderate', 'High']);

/**
 * Decide what to do with a job's follow-up visit.
 *
 * CADENCE (Spencer 2026-07-26 / 08-01 / 08-05) — driven by what the tech FOUND, not by the
 * free-text "Next Action" they typed. Before 2026-08-05 the interval came only from that phrase, so
 * `Monthly` or a blank field meant the customer silently fell to the ~34-day recurring series even
 * after a catch.
 *
 *   Quick Fix : ALWAYS weekly, every visit of the 5-week series, activity or not.
 *               Series exhausted while activity continues -> TASK (add a visit, or sell TMCP /
 *               another month). That is a sales call, never an automatic add.
 *   TMCP      : a catch, a MISS, or ANY activity (L/A, M/A, H/A) -> weekly. The level does not
 *               matter. N/A with no catch and no misses -> monthly, i.e. the recurring series stands.
 *   Other     : (barter, bid, unknown product) -> legacy behaviour, interval from Next Action.
 *
 * Interim visits are always ADDED, never pulled from the recurring series (Spencer 2026-07-26):
 * moving the monthly visit forward just relocates the gap downstream — Avila 7/30 would have left
 * 7/30 -> 9/17, a 49-day hole.
 *
 * @param completed  YYYY-MM-DD of the just-completed visit
 * @param nextAction parsed next-action string ("Add visit", "2 weeks", "Monthly", ...)
 * @param upcoming   array of upcoming visits: [{ id?, date: 'YYYY-MM-DD', tech?: string[] }]
 * @param ctx        { product, activity, moles, misses } — product from productOf(), the rest parsed
 * @returns { action, target?, visitId?, tech?, reason? }
 *          action ∈ PULL | ADD | LEAVE | ALREADY | TASK
 */
export function decideVisit(completed, nextAction, upcoming = [], ctx = {}) {
  if (nextAction === 'Convert to annual') return { action: 'TASK', reason: 'plan change, not scheduling' };

  const { product = 'OTHER', activity = null, moles = null, misses = null } = ctx;
  const caught = Number(moles) > 0;
  const missed = Number(misses) > 0;
  // A MISS IS ACTIVITY (Spencer 2026-08-06). A trap that was hit and did not hold means a mole was
  // working that run and got away, so the property is not quiet — on its own, with no fresh mounds
  // and nothing caught. It does NOT depend on the activity code, because the code is exactly what
  // the techs get wrong here: they read "activity" as mounds only, so `Missed 3` + `N/A` is a
  // common and WRONG combination in the live notes (26 such notes in the 5 weeks to 2026-08-06,
  // 6 of them sent to monthly). Deriving it from the miss count corrects the miscoded note.
  const active = caught || missed || ACTIVE_CODES.has(activity);

  const up = [...upcoming].sort((a, b) => a.date.localeCompare(b.date));
  const next = up[0] || null;

  let interval = null;
  let why = null;
  if (product === 'QUICKFIX') {
    // The 5-week series is weekly by definition. Once it is used up the guarantee is served: with
    // activity left it is a sales decision (surface it, never auto-extend); with the property quiet
    // the job is simply finished. Adding here would hand a completed customer free weekly visits
    // forever — #8110 Chris Roby, quiet and out of series, was doing exactly that.
    if (!next) {
      if (active) return { action: 'TASK', reason: 'Quick Fix series finished with activity still showing — add a visit, or sell TMCP / another month' };
      return { action: 'LEAVE', reason: 'Quick Fix series complete and the property is quiet — nothing further owed' };
    }
    interval = 7;
    why = 'Quick Fix — always weekly';
  } else if (product === 'TMCP') {
    // No activity code AND no mole count parsed means the note did not parse, which is NOT the same
    // as a quiet property. Treating it as N/A would silently drop an active customer to monthly, so
    // say so instead — the nightly summary flags these for a human to read.
    if (activity == null && moles == null && misses == null) return { action: 'LEAVE', reason: 'note did not parse an activity code — cadence undecidable, review the note' };
    if (!active) return { action: 'LEAVE', reason: 'TMCP, no activity, no catch and no misses — monthly cadence stands' };
    interval = 7;
    why = caught ? `TMCP — caught ${moles}, weekly`
      : missed ? `TMCP — ${misses} miss${misses > 1 ? 'es' : ''} (activity regardless of the "${activity ?? 'no'}" code), weekly`
      : `TMCP — ${activity} activity, weekly`;
  } else {
    interval = followUpDays(nextAction);
    if (interval == null) return { action: 'LEAVE', reason: 'no follow-up interval' };
    why = `next-action "${nextAction}"`;
  }

  const target = addDays(completed, interval);

  // Idempotent, and SOONER IS FINE: any upcoming visit on or before target+3 already satisfies the
  // cadence. Only a gap LONGER than the target needs an interim visit. Checking a symmetric ±3
  // window instead treated an earlier visit as "not handled" and added a second one on top of it —
  // e.g. #5300 Terry Williams, already booked 08-06, would also have been given 08-11, and the 08-06
  // visit would then generate its own follow-up around 08-13. Three visits in a week, unbilled.
  const soonest = up.length ? up[0].date : null;
  if (soonest && soonest <= addDays(target, 3)) return { action: 'ALREADY', target, reason: why };

  // Legacy products keep the original same-month PULL behaviour. Activity-driven follow-ups never
  // move the recurring visit — they are added alongside it.
  if (product === 'OTHER' && next && monthOf(next.date) === monthOf(completed)) {
    if (next.date > target) return { action: 'PULL', target, visitId: next.id, reason: why };
    return { action: 'LEAVE', target, reason: `next ${next.date} already ≤ target` };
  }

  return { action: 'ADD', target, tech: next ? next.tech || [] : [], reason: why };
}
