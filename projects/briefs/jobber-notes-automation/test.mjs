// test.mjs — locks the CANONICAL scheduling rule. Run: node projects/briefs/jobber-notes-automation/test.mjs
import { decideVisit } from './decide.mjs';
import { parseNote } from './parse-note.mjs';

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) { console.log(`   got : ${JSON.stringify(got)}`); console.log(`   want: ${JSON.stringify(want)}`); fail++; } else pass++;
};
const slim = d => ({ action: d.action, target: d.target ?? null });

// --- decideVisit: the scheduling rule ---
// Same calendar month → PULL earlier
check('same-month "Add visit" pulls Jul 27 → Jul 13',
  slim(decideVisit('2026-07-06', 'Add visit', [{ id: 'a', date: '2026-07-27' }])),
  { action: 'PULL', target: '2026-07-13' });

// Later calendar month → ADD (this is the Annette Wood case that failed live)
check('later-month "Add visit" ADDS Jul 13, keeps Aug 10 (Annette case)',
  slim(decideVisit('2026-07-06', 'Add visit', [{ id: 'a', date: '2026-08-10' }])),
  { action: 'ADD', target: '2026-07-13' });

// "2 weeks" same month → PULL to +14
check('"2 weeks" same-month pulls to Jul 20',
  slim(decideVisit('2026-07-06', '2 weeks', [{ id: 'a', date: '2026-07-27' }])),
  { action: 'PULL', target: '2026-07-20' });

// Idempotent: visit already near target → ALREADY
check('idempotent: existing Jul 13 → ALREADY (safe re-run)',
  slim(decideVisit('2026-07-06', 'Add visit', [{ id: 'a', date: '2026-07-13' }])),
  { action: 'ALREADY', target: '2026-07-13' });

// Monthly / none → LEAVE (no scheduling change)
check('"Monthly" leaves the schedule alone',
  decideVisit('2026-07-06', 'Monthly', [{ id: 'a', date: '2026-07-27' }]).action, 'LEAVE');

// Convert to annual → TASK
check('"Convert to annual" → TASK',
  decideVisit('2026-07-06', 'Convert to annual', []).action, 'TASK');

// Next visit already sooner than target → LEAVE (never push later)
// KNOWN STALE (2026-08-06): the 08-06 rewrite deliberately returns ALREADY here — "sooner is fine"
// is now an idempotency hit, not a no-op, so a re-run can't stack a second visit (#5300 Terry
// Williams). The assertion below still wants the pre-rewrite LEAVE. Left failing on purpose so the
// disagreement stays visible; resolve it in the route lane, not by quietly editing the expectation.
check('same-month visit already sooner than target → LEAVE',
  decideVisit('2026-07-06', '2 weeks', [{ id: 'a', date: '2026-07-09' }]).action, 'LEAVE');

// --- A MISS IS ACTIVITY (Spencer 2026-08-06) ---
// The tech codes N/A because he reads "activity" as mounds. The miss count must override it, or
// a property where three traps were hit drops to monthly. This is the live-notes failure mode.
check('TMCP: Missed 3 + N/A → weekly ADD (miss overrides the miscoded N/A)',
  slim(decideVisit('2026-08-06', 'Monthly', [{ id: 'a', date: '2026-09-10' }],
    { product: 'TMCP', activity: 'None', moles: 0, misses: 3 })),
  { action: 'ADD', target: '2026-08-13' });

check('TMCP: a miss with no activity code at all still schedules weekly',
  slim(decideVisit('2026-08-06', null, [{ id: 'a', date: '2026-09-10' }],
    { product: 'TMCP', activity: null, moles: null, misses: 1 })),
  { action: 'ADD', target: '2026-08-13' });

// "No misses" parses to 0, which is NOT activity — a genuinely quiet property still goes monthly.
check('TMCP: No misses + N/A + no catch → LEAVE (monthly stands)',
  decideVisit('2026-08-06', 'Monthly', [{ id: 'a', date: '2026-09-10' }],
    { product: 'TMCP', activity: 'None', moles: 0, misses: 0 }).action, 'LEAVE');

// Quick Fix out of series with only a miss showing is still a sales call, never an auto-add.
check('Quick Fix: series exhausted + a miss → TASK, not ADD',
  decideVisit('2026-08-06', null, [], { product: 'QUICKFIX', activity: 'None', moles: 0, misses: 2 }).action, 'TASK');

// End-to-end through the parser: the exact shape seen in the live notes.
const pm = parseNote('Missed 3\nPulled 1 TL\nNA\n3TL 1 VOOS foh');
check('parse: "Missed 3" + NA → misses 3, activity None', [pm.misses, pm.activity], [3, 'None']);
check('end-to-end: that note schedules weekly',
  slim(decideVisit('2026-08-06', pm.nextAction, [{ id: 'a', date: '2026-09-10' }],
    { product: 'TMCP', activity: pm.activity, moles: pm.moles, misses: pm.misses })),
  { action: 'ADD', target: '2026-08-13' });

// --- parseNote: a couple of real notes ---
const p = parseNote('1 mole caught\nNa\nPulled 1 v\n1 VOOS boh garden\n1 VOOS foh\nAdd visit');
check('parse: moles caught', p.moles, 1);
check('parse: activity None', p.activity, 'None');
check('parse: next action', p.nextAction, 'Add visit');
check('parse: onX false', p.onX, false);

const p2 = parseNote('No mole\n1 miss u\nL/a\n2 tl shifted\nSee onx\nVisit 2 weeks');
check('parse: miss under', [p2.misses, p2.missKind], [1, 'under']);
check('parse: onX true', p2.onX, true);
check('parse: 2 weeks', p2.nextAction, '2 weeks');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
