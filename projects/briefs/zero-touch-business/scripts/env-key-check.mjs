// env-key-check.mjs — diagnose whether a key parses from .env WITHOUT printing
// any values. Prints: substring present, parsed-as-key, and the key name of any
// line that merely *contains* the target (to catch glued-line appends).
// Usage: node env-key-check.mjs KEY_NAME
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const key = process.argv[2];
if (!key) { console.error('usage: node env-key-check.mjs KEY_NAME'); process.exit(1); }

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const raw = readFileSync(resolve(repoRoot, '.env'), 'utf8');
const lines = raw.split(/\r?\n/);

const parsed = {};
for (const line of lines) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) parsed[m[1]] = true;
}

console.log(JSON.stringify({
  substring_present: raw.includes(key),
  parses_as_key: Boolean(parsed[key]),
  file_ends_with_newline: /\r?\n$/.test(raw),
  lines_containing_key: lines
    .map((l, i) => ({ i: i + 1, l }))
    .filter(x => x.l.includes(key))
    .map(x => ({ line: x.i, starts_with_key: x.l.trimStart().startsWith(key), key_at_char: x.l.indexOf(key) })),
}, null, 2));
