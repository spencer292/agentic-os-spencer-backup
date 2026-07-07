// decide.mjs — the CANONICAL follow-up scheduling decision, as a pure function.
// Kept separate from Jobber I/O so it can be unit-tested. See brief.md for the rules.

import { followUpDays } from './parse-note.mjs';

const isoDate = d => d.toISOString().slice(0, 10);
export const addDays = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return isoDate(d); };
export const monthOf = ymd => ymd.slice(0, 7);
export const daysBetween = (a, b) => Math.round((new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) / 86400000);

/**
 * Decide what to do with a job's follow-up visit.
 * @param completed  YYYY-MM-DD of the just-completed visit
 * @param nextAction parsed next-action string ("Add visit", "2 weeks", "Monthly", ...)
 * @param upcoming   array of upcoming visits: [{ id?, date: 'YYYY-MM-DD', tech?: string[] }]
 * @returns { action, target?, visitId?, tech?, reason? }
 *          action ∈ PULL | ADD | LEAVE | ALREADY | TASK
 */
export function decideVisit(completed, nextAction, upcoming = []) {
  if (nextAction === 'Convert to annual') return { action: 'TASK', reason: 'plan change, not scheduling' };

  const interval = followUpDays(nextAction);
  if (interval == null) return { action: 'LEAVE', reason: 'no follow-up interval' };

  const target = addDays(completed, interval);
  const up = [...upcoming].sort((a, b) => a.date.localeCompare(b.date));
  const next = up[0] || null;

  // Idempotent: a visit already within ±3 days of the target means it's handled.
  if (up.some(v => Math.abs(daysBetween(v.date, target)) <= 3)) return { action: 'ALREADY', target };

  if (next && monthOf(next.date) === monthOf(completed)) {
    // Same calendar month: pull the existing visit earlier (never later).
    if (next.date > target) return { action: 'PULL', target, visitId: next.id };
    return { action: 'LEAVE', target, reason: `next ${next.date} already ≤ target` };
  }

  // Next visit is in a LATER month (or none): leave it, add a new visit. Never pull a
  // future-month visit back into the current month — that strands the monthly cadence.
  return { action: 'ADD', target, tech: next ? next.tech || [] : [] };
}
