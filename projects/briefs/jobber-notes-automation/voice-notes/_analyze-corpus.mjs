// _analyze-corpus.mjs — offline. Mines _notes-corpus.json for the vocabulary the voice
// formatter must be able to emit: real placement words, trap tokens, next-action phrasings,
// and which lines the current parser fails to classify at all.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notes = JSON.parse(fs.readFileSync(path.join(__dirname, '_notes-corpus.json'), 'utf8'));

const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
const top = (m, n = 40) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
const show = (title, m, n = 40) => {
  console.log(`\n── ${title} (${m.size} distinct) ──`);
  for (const [k, c] of top(m, n)) console.log(`  ${String(c).padStart(5)}  ${k}`);
};

const VERB = /\b(pulled|added|moved|shifted|swapped|set|replaced|removed|reset)\b/i;
const NEXT = /\b(add visit|ad visit|return visit|monthly|month|2\s*weeks|two weeks|convert|weekly|week)\b/i;
const ONX = /on\s*x/i;
const ACT = /^\s*[nlmh]\s*\/?\s*a\s*$/i;
const MOLE = /\b(no mole|\d+\s*moles?|\d+\s*caught)\b/i;
const MISS = /\bmiss/i;

const placements = new Map(), traps = new Map(), nextActs = new Map(),
      verbs = new Map(), unclassified = new Map(), lineCount = new Map();

for (const n of notes) {
  const lines = String(n.message).split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  bump(lineCount, lines.length);
  for (const raw of lines) {
    const l = raw.toLowerCase();
    if (ACT.test(l)) continue;
    if (MOLE.test(l) && !VERB.test(l)) continue;
    if (MISS.test(l)) continue;
    if (ONX.test(l)) continue;
    if (NEXT.test(l) && !/\d\s*(v|voos|victor|tl|trapline)\b/.test(l)) { bump(nextActs, l); continue; }
    if (VERB.test(l)) { bump(verbs, l.match(VERB)[0].toLowerCase()); }

    // inventory-ish line: "<n> <type> <placement...>"
    const m = l.match(/^(\d+)\s*(voos|victors?|v|tl|traplines?|gopher hawk|gh)\b\s*(.*)$/);
    if (m) {
      bump(traps, m[2]);
      const rest = m[3].replace(VERB, '').trim();
      if (rest) bump(placements, rest);
      continue;
    }
    if (!VERB.test(l)) bump(unclassified, l);
  }
}

console.log(`Corpus: ${notes.length} notes`);
console.log('\n── lines per note ──');
for (const [k, c] of [...lineCount].sort((a, b) => a[0] - b[0])) console.log(`  ${String(k).padStart(3)} lines: ${c}`);
show('trap type tokens', traps);
show('placement / location words', placements, 60);
show('next-action line phrasings', nextActs, 40);
show('action verbs', verbs);
show('lines the parser classifies as NOTHING', unclassified, 50);
