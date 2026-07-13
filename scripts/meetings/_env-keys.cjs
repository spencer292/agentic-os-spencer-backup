// Prints only the NAMES of env keys matching a regex — never values.
const fs = require('fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');
const re = new RegExp(process.argv[2] || '.', 'i');
let ks = [];
try {
  for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (m && re.test(m[1])) ks.push(m[1]);
  }
} catch (e) { console.log('ENV_READ_ERROR', e.message); }
console.log(ks.join('\n') || '(none)');
