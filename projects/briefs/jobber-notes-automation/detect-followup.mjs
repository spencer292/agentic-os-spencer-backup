// detect-followup.mjs — BROAD follow-up-intent detector for technician visit notes.
//
// Deliberately a SUPERSET of parse-note.mjs's next-action regex. Every form this catches
// that parse-note.mjs does not is, by definition, a note the live automation reads as
// "no follow-up interval" and silently drops (the Robert Norton "1 week" / "two weeks"
// case, found 2026-08-01).
//
// Kept as its own module so it can be unit-tested without running the audit.

const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

export function detectFollowUp(msg) {
  const t = ' ' + String(msg).replace(/\s+/g, ' ').trim() + ' ';

  if (/convert to annual/i.test(t)) return { kind: 'task', label: 'Convert to annual', days: null, phrase: 'convert to annual' };

  const hits = [];
  const push = (days, phrase, label) => hits.push({ days, phrase: String(phrase).trim(), label });
  let m;

  // explicit "add visit" (incl. the known "Ad visit" field misspelling)
  m = t.match(/\ba+d{1,2}\s*(?:a\s*)?visit\b/i);
  if (m) push(7, m[0], 'Add visit');

  // "N week(s)" / "N wk" / "N-week" — numeric
  const weekRe = /\b(\d+)\s*[-–]?\s*(?:wks?|weeks?)\b/gi;
  while ((m = weekRe.exec(t)) !== null) push(+m[1] * 7, m[0], `${m[1]} week${+m[1] > 1 ? 's' : ''}`);

  // "one week" / "two weeks" — word-number
  const wordRe = /\b(one|two|three|four|five|six)\s*[-–]?\s*(?:wks?|weeks?)\b/gi;
  while ((m = wordRe.exec(t)) !== null) push(WORDNUM[m[1].toLowerCase()] * 7, m[0], `${m[1]} weeks`);

  // "N days" — bounded 2..45 so trap-count noise and stray numbers don't create intervals
  const dayRe = /\b(\d+)\s*[-–]?\s*days?\b/gi;
  while ((m = dayRe.exec(t)) !== null) { const n = +m[1]; if (n >= 2 && n <= 45) push(n, m[0], `${n} days`); }

  // bare cadence words
  if (/\bbi-?weekly\b/i.test(t)) push(14, 'biweekly', 'Biweekly');
  else if (/\bweekly\b/i.test(t)) push(7, 'weekly', 'Weekly');
  if (/\bnext\s*week\b/i.test(t)) push(7, 'next week', 'Next week');

  if (!hits.length) {
    if (/return visit scheduled/i.test(t)) return { kind: 'none', label: 'Return visit scheduled', days: null, phrase: '' };
    if (/monthly/i.test(t)) return { kind: 'none', label: 'Monthly', days: null, phrase: '' };
    return { kind: 'none', label: null, days: null, phrase: '' };
  }

  // Shortest interval wins — a tech asking for a sooner return is the binding instruction.
  hits.sort((a, b) => a.days - b.days);
  const best = hits[0];
  const monthly = /monthly/i.test(t);
  return {
    kind: 'interval', days: best.days, label: best.label, phrase: best.phrase,
    ambiguous: hits.length > 1 || monthly,
    allHits: [...new Set(hits.map(h => h.phrase))],
    alsoMonthly: monthly,
  };
}
