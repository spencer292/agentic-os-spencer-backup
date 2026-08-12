#!/usr/bin/env node
// autopay-audit.mjs — how many active jobs are on automatic payments, and how many are not.
//
// `Job.willClientBeAutomaticallyCharged` is the autopay flag (verified against the Jobber UI:
// job #8149 reads false, and the job page shows "Automatic payments: No / Disabled").
//
// Product comes from the LINE ITEM, never jobType (per CLAUDE.local rule 2026-08-05):
//   "total mole control"  -> TMCP      (monthly recurring — the autopay target)
//   "quick fix"           -> Quick Fix (5-week series — autopay far less relevant)
//
// Read-only.
//   node projects/briefs/jobber-text-automation/scripts/autopay-audit.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';

function findEnvPath() {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const p = path.join(dir, '.env');
    if (fs.existsSync(p)) return p;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}
const ENV_PATH = findEnvPath();
function loadEnv() {
  const env = {};
  if (!ENV_PATH) return env;
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(key, value) {
  if (!ENV_PATH) return;
  let text = fs.readFileSync(ENV_PATH, 'utf8');
  text = new RegExp(`^${key}=`, 'm').test(text)
    ? text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
    : text + `${text.endsWith('\n') ? '' : '\n'}${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, text);
}

const env = loadEnv();
async function getAccessToken() {
  const rt = loadEnv().JOBBER_REFRESH_TOKEN;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token', refresh_token: rt,
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`Token refresh failed HTTP ${res.status}:`, JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== rt) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  return d.access_token;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
let ACCESS_TOKEN = null;
async function gql(query, variables, attempt = 0) {
  if (!ACCESS_TOKEN) ACCESS_TOKEN = await getAccessToken();
  const headers = { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) headers['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch(GQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const data = await res.json().catch(() => ({}));
  if (data.errors) {
    if (data.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 10) {
      const wait = Math.min(30000, 3000 * (attempt + 1));
      process.stderr.write(`  throttled — waiting ${wait / 1000}s…\n`);
      await sleep(wait);
      return gql(query, variables, attempt + 1);
    }
    console.error('GraphQL errors:', JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }
  return data.data;
}

const QUERY = `
query($n:Int!, $cursor:String) {
  jobs(first:$n, after:$cursor, filter:{status: active}) {
    totalCount
    nodes {
      id
      jobNumber
      jobStatus
      willClientBeAutomaticallyCharged
      client { id name }
      lineItems(first:5) { nodes { name } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

const jobs = [];
let cursor = null, total = null;
do {
  const d = await gql(QUERY, { n: 25, cursor });
  const c = d.jobs;
  if (total === null) { total = c.totalCount; console.error(`Active jobs: ${total}`); }
  jobs.push(...c.nodes);
  cursor = c.pageInfo.hasNextPage ? c.pageInfo.endCursor : null;
  process.stderr.write(`  ${jobs.length}/${total}\n`);
  if (cursor) await sleep(700);
} while (cursor);

function product(job) {
  const names = (job.lineItems?.nodes || []).map(n => (n.name || '').toLowerCase()).join(' | ');
  if (/total mole control/.test(names)) return 'TMCP';
  if (/quick fix/.test(names)) return 'Quick Fix';
  if (/barter|friends and family/.test(names)) return 'Barter/F&F';
  if (!names.trim()) return 'no line item (bid?)';
  return 'other';
}

const rows = jobs.map(j => ({ ...j, product: product(j), autopay: Boolean(j.willClientBeAutomaticallyCharged) }));
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(path.join(DATA_DIR, 'autopay-audit.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), totalActiveJobs: total, jobs: rows }, null, 2));

const products = [...new Set(rows.map(r => r.product))];
console.log(`\nAUTOPAY BY PRODUCT — ${rows.length} active jobs\n`);
console.log('  product                 jobs     autopay ON    autopay OFF');
for (const p of products.sort()) {
  const set = rows.filter(r => r.product === p);
  const on = set.filter(r => r.autopay).length;
  console.log(`  ${p.padEnd(22)}${String(set.length).padStart(5)}${String(on).padStart(14)}${String(set.length - on).padStart(15)}`);
}
const on = rows.filter(r => r.autopay);
console.log(`\n  TOTAL                 ${String(rows.length).padStart(5)}${String(on.length).padStart(14)}${String(rows.length - on.length).padStart(15)}`);

const tmcpOff = rows.filter(r => r.product === 'TMCP' && !r.autopay);
const tmcpClients = new Set(tmcpOff.map(r => r.client?.id));
console.log(`\n  TMCP jobs without autopay: ${tmcpOff.length}  across ${tmcpClients.size} clients`);
console.log(`  -> these are the customers to ask for approval\n`);
console.log(`  wrote data/autopay-audit.json\n`);
