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
check('same-month visit already sooner than target → LEAVE',
  decideVisit('2026-07-06', '2 weeks', [{ id: 'a', date: '2026-07-09' }]).action, 'LEAVE');

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
