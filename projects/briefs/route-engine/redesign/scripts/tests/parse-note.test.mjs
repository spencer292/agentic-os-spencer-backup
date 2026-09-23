#!/usr/bin/env node
// ============================================================================
// parse-note.test.mjs — the miss parser, against real-shaped field notes.
//
//   node projects/briefs/route-engine/redesign/scripts/tests/parse-note.test.mjs
//
// Exits non-zero on the first failing expectation. No framework, no install.
//
// The case that matters is #4, "2 misses N/A". Before the repair it parsed as
// {misses: null, activity: 'None'} and the job was classified QUIET, because
// the old regex knew "missed" and "miss" but not the plural "misses" while the
// activity regex happily caught the N/A. Two moles escaped traps and the
// customer went onto a monthly cycle.
// ============================================================================

import { parseNote, triggerOf } from '../lib/parse-note.mjs';

const CASES = [
  // --- the defect itself, and its neighbours -------------------------------
  { note: '2 misses N/A',
    want: { moles: null, misses: 2, activity: 'None' }, trigger: 'miss (no catch)' },
  { note: '2 missed N/A',
    want: { moles: null, misses: 2, activity: 'None' }, trigger: 'miss (no catch)' },
  { note: 'No mole\n2 miss\nL/A\n2 tl\nONX\nWeekly',
    want: { moles: 0, misses: 2, activity: 'Low' }, trigger: 'miss (no catch)' },
  { note: 'No mole\nmiss x2\nN/A\n1 tl\nAdd visit',
    want: { moles: 0, misses: 2, activity: 'None' }, trigger: 'miss (no catch)' },
  { note: '2x miss no mole na',
    want: { moles: 0, misses: 2, activity: 'None' }, trigger: 'miss (no catch)' },

  // --- the negative must still win ----------------------------------------
  { note: 'No mole\nNo miss\nMoved 1 tl\nLa\n1 tl\nONX\nAdd visit',
    want: { moles: 0, misses: 0, activity: 'Low' }, trigger: 'activity Low (no catch/miss)' },
  { note: 'No mole\nNo misses\nN/A\n1 tl\nONX\nMonthly',
    want: { moles: 0, misses: 0, activity: 'None' }, trigger: 'quiet (None, no catch/miss)' },
  { note: 'No mole 0 miss H/A fresh hills out front 3 tl',
    want: { moles: 0, misses: 0, activity: 'High' }, trigger: 'activity High (no catch/miss)' },

  // --- a catch outranks a miss --------------------------------------------
  { note: '2 moles\n1 miss\nM/A\n2 tl\nONX\nWeekly',
    want: { moles: 2, misses: 1, activity: 'Moderate' }, trigger: 'catch' },
  { note: '1 caught no miss na 1 tl 2 weeks',
    want: { moles: 1, misses: 0, activity: 'None' }, trigger: 'catch' },

  // --- the bare word, and the sprung trap ---------------------------------
  { note: 'No mole\nMiss\nL/A\n1 tl\nAdd visit',
    want: { moles: 0, misses: 1, activity: 'Low' }, trigger: 'miss (no catch)' },
  { note: 'No mole trap tripped N/A reset 2 tl weekly',
    want: { moles: 0, misses: 1, activity: 'None' }, trigger: 'miss (no catch)' },
  { note: 'No mole 2 traps sprung not holding la add visit',
    want: { moles: 0, misses: 2, activity: 'Low' }, trigger: 'miss (no catch)' },

  // --- "missing" is a lost trap, not a miss --------------------------------
  { note: 'No mole\nNo miss\nNa \nCouldn’t find tl \n1 tl\nONX\n2 weeks',
    want: { moles: 0, misses: 0, activity: 'None' }, trigger: 'quiet (None, no catch/miss)' },
  { note: 'No mole na Missing tl reset 1 tl monthly',
    want: { moles: 0, misses: null, activity: 'None' }, trigger: 'quiet (None, no catch/miss)' },
  { note: 'Missing 2 na no mole',
    want: { moles: 0, misses: 2, activity: 'None' }, trigger: 'miss (no catch)' },
];

let failed = 0;
let checks = 0;
for (const [i, c] of CASES.entries()) {
  const got = parseNote(c.note);
  const trig = triggerOf(got);
  const oneLine = c.note.replace(/\n/g, ' | ');
  for (const [k, v] of Object.entries(c.want)) {
    checks++;
    if (got[k] !== v) {
      failed++;
      console.error(`FAIL #${i + 1} [${k}]  "${oneLine}"`);
      console.error(`      want ${JSON.stringify(v)}  got ${JSON.stringify(got[k])}`);
    }
  }
  checks++;
  if (trig !== c.trigger) {
    failed++;
    console.error(`FAIL #${i + 1} [trigger]  "${oneLine}"`);
    console.error(`      want ${JSON.stringify(c.trigger)}  got ${JSON.stringify(trig)}`);
  }
}

console.log(`parse-note: ${CASES.length} notes, ${checks} assertions, ${failed} failed`);
if (failed) process.exit(1);
console.log('OK');
