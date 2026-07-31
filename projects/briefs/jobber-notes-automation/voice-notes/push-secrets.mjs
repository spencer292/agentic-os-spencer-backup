// push-secrets.mjs — one-shot setup. Reads credentials from the repo .env, reads (or
// creates) the technician code list, and pushes everything to the Worker as secrets.
//
// Nothing secret is written to wrangler.toml or committed. The generated technician codes
// and the session secret are kept in techs.json, which is gitignored — that file is the
// only place the codes exist in readable form, so keep it.
//
// Usage (from this folder):  npm run secrets

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../../.env');
const TECHS_PATH = path.join(__dirname, 'techs.json');

const env = {};
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

// Jobber user IDs pulled from the live account on 2026-07-28 (_users.mjs). Only ACTIVATED
// users who actually run routes are seeded; add or remove people by editing techs.json.
const SEED = [
  ['Cammeron Anderson', 'Z2lkOi8vSm9iYmVyL1VzZXIvNDA2MDE5OQ=='],
  ['Luke LaVergne',     'Z2lkOi8vSm9iYmVyL1VzZXIvMzc3NDU2OA=='],
  ['Cory Ventura',      'Z2lkOi8vSm9iYmVyL1VzZXIvMTI5NDM3Mg=='],
  ['Alias Franks',      'Z2lkOi8vSm9iYmVyL1VzZXIvNDE3NTQ5Mg=='],
  ['Robert Norton',     'Z2lkOi8vSm9iYmVyL1VzZXIvNDE4MTE1Ng=='],
  ['Spencer Hill',      'Z2lkOi8vSm9iYmVyL1VzZXIvMzgwNjE2'],
  ['Tavis Alexander',   'Z2lkOi8vSm9iYmVyL1VzZXIvMzE0NDEwNQ=='],
];

let techs;
if (fs.existsSync(TECHS_PATH)) {
  techs = JSON.parse(fs.readFileSync(TECHS_PATH, 'utf8'));
  console.log(`Using existing ${path.basename(TECHS_PATH)} (${Object.keys(techs.codes).length} technicians)`);
} else {
  const used = new Set();
  const code = () => { let c; do { c = String(crypto.randomInt(1000, 10000)); } while (used.has(c)); used.add(c); return c; };
  techs = { sessionSecret: crypto.randomBytes(32).toString('hex'), codes: {} };
  for (const [name, jobberUserId] of SEED) techs.codes[code()] = { name, jobberUserId };
  fs.writeFileSync(TECHS_PATH, JSON.stringify(techs, null, 2));
  console.log(`Created ${path.basename(TECHS_PATH)} with fresh codes.`);
}

const required = { JOBBER_CLIENT_ID: env.JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET: env.JOBBER_CLIENT_SECRET, JOBBER_REFRESH_TOKEN: env.JOBBER_REFRESH_TOKEN, GEMINI_API_KEY: env.GEMINI_API_KEY };
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) { console.error(`Missing from .env: ${missing.join(', ')}`); process.exit(1); }

const secrets = { ...required, SESSION_SECRET: techs.sessionSecret, TECH_CODES: JSON.stringify(techs.codes) };

// Cloudflare credentials come from the repo .env too, so wrangler never needs an
// interactive browser login and the token never appears on a command line.
const cfEnv = {
  ...process.env,
  CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID,
};
if (!env.CLOUDFLARE_API_TOKEN) { console.error('Missing CLOUDFLARE_API_TOKEN in .env'); process.exit(1); }

for (const [name, value] of Object.entries(secrets)) {
  process.stdout.write(`  ${name} … `);
  try {
    execFileSync('npx', ['wrangler', 'secret', 'put', name], { input: value, stdio: ['pipe', 'pipe', 'pipe'], shell: true, env: cfEnv });
    console.log('set');
  } catch (e) {
    console.log('FAILED');
    console.error(String(e.stdout || '') + String(e.stderr || ''));
    process.exit(1);
  }
}

console.log('\nTechnician sign-in codes:');
for (const [code, t] of Object.entries(techs.codes)) console.log(`  ${code}   ${t.name}`);
console.log('\nThese live only in techs.json (gitignored). Hand each person their own code.');
