// eval-audio.mjs — end-to-end check of the real chain: audio -> transcribe -> format ->
// parse-note.mjs -> validate. The formatter eval covers text; this one covers the step
// that only exists in the field, where the words arrive through a microphone.
//
// Test audio is synthesized locally with Windows SAPI (no TTS API key needed). Synthetic
// speech is cleaner than a technician in the wind, so treat this as a lower bound on
// failure modes, not a substitute for the pilot week.
//
// Usage (from repo root):
//   node projects/briefs/jobber-notes-automation/voice-notes/eval-audio.mjs [--keep]

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseNote } from '../parse-note.mjs';
import { validate } from './src/grammar.js';
import { transcribe, formatNote } from './src/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../../.env');
const env = {};
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const KEEP = process.argv.includes('--keep');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'gm-audio-'));

const CASES = [
  { name: 'plain visit', spoken: 'two moles today no misses moderate activity three victors out front come back next week',
    expect: { moles: 2, misses: 0, activity: 'Moderate', nextAction: 'Add visit', traps: 3 } },
  { name: 'mole/mile trap', spoken: 'no mole out here one miss under it no activity one trapline front of house one victor left of house two weeks',
    expect: { moles: 0, misses: 1, missKind: 'under', activity: 'None', nextAction: '2 weeks', traps: 2 } },
  { name: 'rambling with filler', spoken: 'ok so uh this one was rough um no moles nothing at all one miss it tripped the trap uh moderate activity I moved one victor there is uh two victors back of house one victor left of house and one out by the fence uh add a visit next week',
    expect: { moles: 0, misses: 1, missKind: 'tripped', activity: 'Moderate', nextAction: 'Add visit', traps: 4 } },
  { name: 'voos and fenceline', spoken: 'caught one no miss light activity three voos along the fenceline showed the customer back to monthly',
    expect: { moles: 1, misses: 0, activity: 'Low', nextAction: 'Monthly', traps: 3 } },
  { name: 'high count', spoken: 'four moles no miss high activity six victors back of house and two traplines in the garden add a visit',
    expect: { moles: 4, misses: 0, activity: 'High', nextAction: 'Add visit', traps: 8 } },
  { name: 'omits the miss', spoken: 'one mole moderate activity two victors front of house add visit',
    expect: { moles: 1, misses: undefined, activity: 'Moderate', nextAction: 'Add visit', traps: 2 }, warn: ['misses'] },
];

// Synthesize all clips in one PowerShell call.
const ps = CASES.map((c, i) =>
  `$s.SetOutputToWaveFile('${path.join(TMP, `c${i}.wav`).replace(/\\/g, '\\\\')}'); $s.Speak(${JSON.stringify(c.spoken)});`
).join(' ');
execFileSync('powershell', ['-NoProfile', '-Command',
  `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ${ps} $s.Dispose()`],
  { stdio: 'pipe' });

console.log(`Audio eval — ${CASES.length} clips through transcribe -> format -> parse\n`);
let pass = 0, fail = 0;

for (const [i, c] of CASES.entries()) {
  const bytes = new Uint8Array(fs.readFileSync(path.join(TMP, `c${i}.wav`)));
  let transcript, note;
  try {
    ({ text: transcript } = await transcribe(env, bytes, 'audio/wav'));
    ({ note } = await formatNote(env, transcript));
  } catch (e) {
    console.log(`${String(i + 1).padStart(2)}. ✗ ${c.name} — ${e.message}`);
    fail++; continue;
  }
  const p = parseNote(note);
  const v = validate(note, p);
  const traps = p.inventory.reduce((s, x) => s + x.n, 0);

  const problems = [];
  const chk = (l, got, want) => {
    if (want === undefined) { if (got !== null && got !== undefined) problems.push(`${l}: invented ${JSON.stringify(got)}`); return; }
    if (got !== want) problems.push(`${l}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  };
  if ('moles' in c.expect) chk('moles', p.moles, c.expect.moles);
  if ('misses' in c.expect) chk('misses', p.misses, c.expect.misses);
  if ('missKind' in c.expect) chk('missKind', p.missKind, c.expect.missKind);
  if ('activity' in c.expect) chk('activity', p.activity, c.expect.activity);
  if ('nextAction' in c.expect) chk('nextAction', p.nextAction, c.expect.nextAction);
  if ('traps' in c.expect && traps !== c.expect.traps) problems.push(`traps: got ${traps}, want ${c.expect.traps}`);
  const warned = new Set(v.warnings.map(w => w.field));
  for (const w of (c.warn || [])) if (!warned.has(w)) problems.push(`expected warning on "${w}"`);

  if (problems.length) {
    fail++;
    console.log(`${String(i + 1).padStart(2)}. ✗ ${c.name}`);
    for (const x of problems) console.log(`      ${x}`);
    console.log(`      heard: "${transcript}"`);
    console.log(note.split('\n').map(l => '      | ' + l).join('\n'));
  } else {
    pass++;
    console.log(`${String(i + 1).padStart(2)}. ✓ ${c.name}`);
    console.log(`      heard: "${transcript.slice(0, 100)}${transcript.length > 100 ? '…' : ''}"`);
    console.log(note.split('\n').map(l => '      | ' + l).join('\n'));
  }
}

console.log(`\n${pass}/${pass + fail} passed.`);
if (KEEP) console.log(`Clips kept in ${TMP}`);
else fs.rmSync(TMP, { recursive: true, force: true });
if (fail) process.exitCode = 1;
