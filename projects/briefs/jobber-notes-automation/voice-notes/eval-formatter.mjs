// eval-formatter.mjs — offline accuracy harness for the voice formatter.
//
// Each case is how a technician actually talks, paired with the fields the note MUST end
// up carrying. Every case is scored by running the formatter's output through the same
// parse-note.mjs the nightly report sync uses — so this measures the thing that matters:
// does a spoken note survive all the way into the report and the scheduling engine.
//
// Usage (from repo root):
//   node projects/briefs/jobber-notes-automation/voice-notes/eval-formatter.mjs [--case=3] [--verbose]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNote } from '../parse-note.mjs';
import { validate } from './src/grammar.js';
import { formatNote } from './src/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../../.env');
const env = {};
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const argv = process.argv.slice(2);
const only = (argv.find(a => a.startsWith('--case=')) || '').split('=')[1];
const VERBOSE = argv.includes('--verbose');

// expect: field -> value. `undefined` means "must be absent/null".
// warn: list of fields that SHOULD be flagged to the technician.
const CASES = [
  {
    name: 'plain visit',
    spoken: 'two moles today no misses moderate activity three victors out front come back next week',
    expect: { moles: 2, misses: 0, activity: 'Moderate', nextAction: 'Add visit', traps: 3 },
  },
  {
    name: 'mole misheard as mile',
    spoken: 'no mile out here one miss under it no activity one trapline front of house one victor left of house two weeks',
    expect: { moles: 0, misses: 1, missKind: 'under', activity: 'None', nextAction: '2 weeks', traps: 2 },
  },
  {
    name: 'voos misheard as views',
    spoken: 'caught one no miss light activity three views along the fence line back to monthly',
    expect: { moles: 1, misses: 0, activity: 'Low', nextAction: 'Monthly', traps: 3 },
  },
  {
    name: 'two kinds of miss',
    spoken: 'no moles one went under and one tripped it moderate activity two victors back of house two victors left of house add a visit',
    expect: { moles: 0, misses: 1, activity: 'Moderate', nextAction: 'Add visit', traps: 4 },
  },
  {
    name: 'pulled and moved traps',
    spoken: 'one mole one miss under pulled a victor moved another one light activity one victor front of house one trapline on the retaining wall add visit',
    expect: { moles: 1, misses: 1, missKind: 'under', activity: 'Low', nextAction: 'Add visit', traps: 2, actions: 2 },
  },
  {
    name: 'swap victor for trapline',
    spoken: 'nothing caught no misses swapped a victor for a trapline no activity one trapline front of house one victor back of house give it a month',
    expect: { moles: 0, misses: 0, activity: 'None', nextAction: 'Monthly', traps: 2, actions: 1 },
  },
  {
    name: 'numbers spoken as words',
    spoken: 'we got three moles no miss high activity four victors back of house and two traplines in the garden come back in two weeks',
    expect: { moles: 3, misses: 0, activity: 'High', nextAction: '2 weeks', traps: 6 },
  },
  {
    name: 'no traps left on property',
    spoken: 'no moles no misses no activity pulled everything no traps on the ground now going monthly',
    expect: { moles: 0, misses: 0, activity: 'None', nextAction: 'Monthly', traps: 0 },
  },
  {
    name: 'tech omits the miss count',
    spoken: 'one mole moderate activity two victors front of house add visit',
    expect: { moles: 1, misses: undefined, activity: 'Moderate', nextAction: 'Add visit', traps: 2 },
    warn: ['misses'],
  },
  {
    name: 'tech omits activity and next action',
    spoken: 'no moles no miss three victors back of house',
    expect: { moles: 0, misses: 0, activity: undefined, nextAction: undefined, traps: 3 },
    warn: ['activity', 'nextAction'],
  },
  {
    name: 'corrects himself mid-sentence',
    spoken: 'we got two no sorry three moles no misses high activity five victors back of house add visit',
    expect: { moles: 3, misses: 0, activity: 'High', nextAction: 'Add visit', traps: 5 },
  },
  {
    name: 'vole is not a mole',
    spoken: 'no moles caught a vole though no miss light activity two victors front of house monthly',
    expect: { moles: 0, misses: 0, activity: 'Low', nextAction: 'Monthly', traps: 2 },
  },
  {
    name: 'showed the customer',
    spoken: 'one mole no miss no activity showed the customer the tunnels two victors front of house one victor by the driveway monthly',
    expect: { moles: 1, misses: 0, activity: 'None', nextAction: 'Monthly', traps: 3, customerShown: true },
  },
  {
    name: 'rambling with filler',
    spoken: 'ok so uh this one was rough um no moles nothing at all one miss it tripped the trap uh moderate activity I moved one victor there is uh two victors back of house one victor left of house and one out by the fence uh add a visit next week',
    expect: { moles: 0, misses: 1, missKind: 'tripped', activity: 'Moderate', nextAction: 'Add visit', traps: 4, actions: 1 },
  },
  {
    name: 'compass placements',
    spoken: 'no mole no miss no activity one victor front right of house one victor back left of house monthly',
    expect: { moles: 0, misses: 0, activity: 'None', nextAction: 'Monthly', traps: 2 },
  },
  {
    name: 'asap phrasing',
    spoken: 'four moles no miss high activity six victors back of house need to get back out here as soon as possible',
    expect: { moles: 4, misses: 0, activity: 'High', nextAction: 'Add visit', traps: 6 },
  },
  {
    name: 'weekly quick fix',
    spoken: 'one mole one miss under light activity three victors front of house on the weekly quick fix',
    expect: { moles: 1, misses: 1, activity: 'Low', nextAction: 'Weekly', traps: 3 },
  },
  {
    name: 'convert to annual',
    spoken: 'no moles no miss no activity two victors front of house customer wants to convert to annual',
    expect: { moles: 0, misses: 0, activity: 'None', nextAction: 'Convert to annual', traps: 2 },
  },
];

const cases = only ? [CASES[+only - 1]] : CASES;
let pass = 0, fail = 0;
const failures = [];

console.log(`Formatter eval — ${cases.length} case(s), model ${env.FORMAT_MODEL || 'gemini-3.6-flash'}\n`);

for (const [i, c] of cases.entries()) {
  let note;
  try {
    ({ note } = await formatNote(env, c.spoken));
  } catch (e) {
    console.log(`${String(i + 1).padStart(2)}. ✗ ${c.name} — API error: ${e.message}`);
    fail++; continue;
  }
  const p = parseNote(note);
  const v = validate(note, p);
  const traps = p.inventory.reduce((s, x) => s + x.n, 0);

  const problems = [];
  const chk = (label, got, want) => {
    if (want === undefined) { if (got !== null && got !== undefined) problems.push(`${label}: invented ${JSON.stringify(got)} (tech never said it)`); return; }
    if (got !== want) problems.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  };
  if ('moles' in c.expect) chk('moles', p.moles, c.expect.moles);
  if ('misses' in c.expect) chk('misses', p.misses, c.expect.misses);
  if ('missKind' in c.expect) chk('missKind', p.missKind, c.expect.missKind);
  if ('activity' in c.expect) chk('activity', p.activity, c.expect.activity);
  if ('nextAction' in c.expect) chk('nextAction', p.nextAction, c.expect.nextAction);
  if ('traps' in c.expect && traps !== c.expect.traps) problems.push(`traps: got ${traps}, want ${c.expect.traps}`);
  if ('actions' in c.expect && p.actions.length !== c.expect.actions) problems.push(`actions: got ${p.actions.length}, want ${c.expect.actions}`);
  if ('customerShown' in c.expect && p.customerShown !== c.expect.customerShown) problems.push(`customerShown: got ${p.customerShown}`);

  const warned = new Set(v.warnings.map(w => w.field));
  for (const w of (c.warn || [])) if (!warned.has(w)) problems.push(`expected a warning on "${w}" — tech would not have been told`);

  if (problems.length) {
    fail++;
    failures.push({ n: i + 1, c, note, problems });
    console.log(`${String(i + 1).padStart(2)}. ✗ ${c.name}`);
    for (const p2 of problems) console.log(`      ${p2}`);
    console.log(note.split('\n').map(l => '      | ' + l).join('\n'));
  } else {
    pass++;
    console.log(`${String(i + 1).padStart(2)}. ✓ ${c.name}${(c.warn || []).length ? '  (correctly flagged: ' + c.warn.join(', ') + ')' : ''}`);
    if (VERBOSE) console.log(note.split('\n').map(l => '      | ' + l).join('\n'));
  }
}

console.log(`\n${pass}/${pass + fail} passed.`);
if (fail) process.exitCode = 1;
