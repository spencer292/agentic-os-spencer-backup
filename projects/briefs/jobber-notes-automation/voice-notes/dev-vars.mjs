// dev-vars.mjs — writes .dev.vars (gitignored) so `wrangler dev` can run the real thing
// locally. Values come from the repo .env and techs.json; nothing is printed.
//
// Usage (from this folder):  node dev-vars.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const line of fs.readFileSync(path.resolve(__dirname, '../../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const TECHS_PATH = path.join(__dirname, 'techs.json');
let techs;
if (fs.existsSync(TECHS_PATH)) {
  techs = JSON.parse(fs.readFileSync(TECHS_PATH, 'utf8'));
} else {
  // Local-only stand-in so dev works before the real codes are generated.
  techs = {
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    codes: { '1234': { name: 'Spencer Hill', jobberUserId: 'Z2lkOi8vSm9iYmVyL1VzZXIvMzgwNjE2' } },
  };
}

const out = [
  `JOBBER_CLIENT_ID=${env.JOBBER_CLIENT_ID}`,
  `JOBBER_CLIENT_SECRET=${env.JOBBER_CLIENT_SECRET}`,
  `JOBBER_REFRESH_TOKEN=${env.JOBBER_REFRESH_TOKEN}`,
  `GEMINI_API_KEY=${env.GEMINI_API_KEY}`,
  `SESSION_SECRET=${techs.sessionSecret}`,
  `TECH_CODES=${JSON.stringify(techs.codes)}`,
].join('\n') + '\n';

fs.writeFileSync(path.join(__dirname, '.dev.vars'), out);
console.log('Wrote .dev.vars (gitignored). Sign-in codes available:', Object.keys(techs.codes).join(', '));
