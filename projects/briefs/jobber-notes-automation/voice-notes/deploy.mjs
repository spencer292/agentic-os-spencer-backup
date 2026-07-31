// deploy.mjs — runs wrangler with Cloudflare credentials taken from the repo .env, so no
// interactive login is needed and the token never appears on a command line.
//
// Any wrangler subcommand can be passed through; with no arguments it deploys.
//   npm run deploy                -> wrangler deploy
//   npm run tail                  -> wrangler tail --format pretty
//   node deploy.mjs whoami        -> wrangler whoami

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const line of fs.readFileSync(path.resolve(__dirname, '../../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
if (!env.CLOUDFLARE_API_TOKEN) { console.error('Missing CLOUDFLARE_API_TOKEN in .env'); process.exit(1); }

const args = process.argv.slice(2);
const r = spawnSync('npx', ['wrangler', ...(args.length ? args : ['deploy'])], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID },
});
process.exit(r.status ?? 1);
