#!/usr/bin/env node
// Dump the live Jobber visits for a date range to JSON, in the shape lock-techs-to-grid.mjs expects.
// Exists because the lock script was pinned to a hand-made snapshot (week-visits-0727-post-dedup.json);
// any visit booked after that snapshot got pushed to OptimoRoute but never tech-locked.
// Usage: node fetch-window-visits.mjs 2026-07-30 2026-07-31 [outfile]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const loadEnv = () => {
  const env = {};
  for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
  return env;
};
function saveEnvKey(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : txt + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let tok = null;
async function token(force = false) {
  if (tok && !force) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('token refresh failed', r.status, JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token;
  return tok;
}
async function jgql(query, variables, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await token(true); return jgql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
  if (data.errors) throw new Error('Jobber: ' + JSON.stringify(data.errors).slice(0, 300));
  return data.data;
}

const from = process.argv[2], to = process.argv[3];
if (!from || !to) { console.log('Usage: fetch-window-visits.mjs FROM TO [outfile]'); process.exit(1); }
const out = process.argv[4] || path.join(__dirname, `week-visits-${from.replace(/-/g, '').slice(4)}-live.json`);
const afterIso = `${from}T00:00:00-07:00`, beforeIso = `${to}T23:59:59-07:00`;

const visits = [];
let cursor = null;
for (;;) {
  const q = `query($after: String) { visits(first: 25, after: $after, filter: { startAt: { after: "${afterIso}", before: "${beforeIso}" } }) { nodes { id title startAt isComplete assignedUsers(first: 3) { nodes { id name { full } } } property { address { street city province postalCode } } job { jobNumber startAt } } pageInfo { hasNextPage endCursor } } }`;
  const d = await jgql(q, { after: cursor });
  visits.push(...d.visits.nodes);
  if (!d.visits.pageInfo.hasNextPage) break;
  cursor = d.visits.pageInfo.endCursor;
  await sleep(700);
}
fs.writeFileSync(out, JSON.stringify(visits, null, 1));
console.log(`${visits.length} visits ${from}..${to} -> ${out}`);
