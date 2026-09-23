// ============================================================================
// parse-note.mjs — read a technician's visit note into structured state.
//
// Extracted from derive-cadence.mjs so it can be tested. The notes are terse,
// hand-typed, and inconsistent; every pattern here was seen in the field.
//
// S6 defect D-miss (CONFIRMED mechanism): the old miss regex was
//     /(\d+)\s*miss(?:ed)?\s*(u|t)?\b/i  then  /miss(?:ed|sd|sed)\s*(\d+)/i
// which does not match the PLURAL "misses". "2 misses N/A" therefore parsed as
// {misses: null, activity: 'None'} and classified QUIET — the exact opposite of
// the truth, because a sprung trap that did not hold means a mole was working
// that run (CLAUDE.local.md 2026-08-06: a miss is activity on its own).
//
// The repaired reader recognises, in this order:
//   1. an explicit negative      "No miss", "no misses", "0 miss"      -> 0
//   2. a count before the word   "2 misses", "2 missed", "2 miss", "2x miss"
//   3. a count after the word    "miss x2", "missed 2", "Missing 2"
//   4. a sprung trap             "trap tripped", "traps sprung", "2 traps tripped"
//   5. the bare word             "miss", "missed"                      -> 1
// "Missing" with no number is NOT a miss — in these notes it means the tech
// could not find the trap ("Missing tl"), so it only counts when a count follows.
// ============================================================================

const ACTIVITY_LETTER = { n: 'None', l: 'Low', m: 'Moderate', h: 'High' };

/** Moles caught on this visit. null = the note does not say. */
export function parseMoles(t) {
  if (/\bno\s+moles?\b/i.test(t)) return 0;
  const m = t.match(/(\d+)\s*moles?\b/i) || t.match(/(\d+)\s*caught\b/i);
  return m ? +m[1] : null;
}

/** Traps hit that did not hold. null = the note does not say. */
export function parseMisses(t) {
  // 1. explicit negative — must run first or "no misses" reads as a bare miss
  if (/\bno\s+miss(?:es|ed)?\b/i.test(t)) return 0;
  if (/\b0\s*x?\s*miss(?:es|ed)?\b/i.test(t)) return 0;

  // 2. a count before the word: "2 misses", "2 missed", "2 miss", "2x miss", "2 miss t"
  let m = t.match(/\b(\d+)\s*x?\s*miss(?:es|ed|sd|sed)?\s*(?:u|t)?\b/i);
  if (m) return +m[1];

  // 3. a count after the word: "miss x2", "missed 2", "Missing 2", "misses 2"
  m = t.match(/\bmiss(?:es|ed|sd|sed|ing)?\s*x?\s*(\d+)\b/i);
  if (m) return +m[1];

  // 4. a sprung trap is a miss even when the word "miss" never appears
  m = t.match(/\b(\d+)\s*traps?\s+(?:were\s+|was\s+)?(?:tripped|sprung|set\s*off)\b/i);
  if (m) return +m[1];
  if (/\btraps?\s+(?:were\s+|was\s+)?(?:tripped|sprung|set\s*off)\b/i.test(t)) return 1;
  if (/\b(?:tripped|sprung)\s+traps?\b/i.test(t)) return 1;

  // 5. the bare word. "missing" is excluded — in these notes it means the tech
  //    could not find the trap, not that a mole escaped one.
  if (/\bmiss(?:es|ed)?\b/i.test(t)) return 1;

  return null;
}

/** Latest Activity letter code: N/A, L/A, M/A, H/A (slash optional). */
export function parseActivity(t) {
  const am = t.toLowerCase().match(/\b([nlmh])\/?a\b/);
  return am ? ACTIVITY_LETTER[am[1]] : null;
}

/** The Next Action the tech wrote on the note, if any. */
export function parseNextAction(t) {
  const aw = t.match(/\ba?d{1,2}\s+visit\s*(\d+)\s*week/i);
  if (/convert to annual/i.test(t)) return { nextAction: 'Convert to annual', naWeeks: null };
  if (aw) return { nextAction: 'Add visit ' + aw[1] + ' week', naWeeks: +aw[1] };
  if (/\bad{1,2}\s+visit/i.test(t)) return { nextAction: 'Add visit', naWeeks: null };
  if (/monthly/i.test(t)) return { nextAction: 'Monthly', naWeeks: null };
  if (/visit\s*2\s*weeks|2\s*weeks/i.test(t)) return { nextAction: '2 weeks', naWeeks: null };
  if (/weekly/i.test(t)) return { nextAction: 'Weekly', naWeeks: null };
  return { nextAction: null, naWeeks: null };
}

/**
 * The whole note. Returns { moles, misses, activity, nextAction, naWeeks }.
 * Every field is null when the note is silent on it — null is "not stated",
 * never "zero".
 */
export function parseNote(msg) {
  const t = ' ' + String(msg == null ? '' : msg).replace(/\s+/g, ' ').trim() + ' ';
  const { nextAction, naWeeks } = parseNextAction(t);
  return {
    moles: parseMoles(t),
    misses: parseMisses(t),
    activity: parseActivity(t),
    nextAction,
    naWeeks,
  };
}

/** Trigger classification from a parsed note or a job's custom-field state. */
export function triggerOf(st) {
  if (st.moles > 0) return 'catch';
  if (st.misses > 0) return 'miss (no catch)';
  if (st.activity === 'High') return 'activity High (no catch/miss)';
  if (st.activity === 'Moderate') return 'activity Moderate (no catch/miss)';
  if (st.activity === 'Low') return 'activity Low (no catch/miss)';
  if (st.activity === 'None') return 'quiet (None, no catch/miss)';
  return 'unknown';
}

export default parseNote;
