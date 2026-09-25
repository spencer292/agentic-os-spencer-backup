#!/usr/bin/env node
// CFO — pull Jobber payment records (actual cash collected) for the cash lens.
// Read-only. Writes projects/briefs/cfo/data/payments.json
// Usage (from repo root): node projects/briefs/cfo/scripts/pull-payments.mjs [monthsBack]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const ENV_NAME = '.env';

function findEnvPath() {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const p = path.join(dir, ENV_NAME);
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
  if (new RegExp(`^${key}=`, 'm').test(text)) text = text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
  else text += `${text.endsWith('\n') ? '' : '\n'}${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, text);
}

const env = loadEnv();
const ID = env.JOBBER_CLIENT_ID, SECRET = env.JOBBER_CLIENT_SECRET;
async function getAccessToken() {
  const rt = loadEnv().JOBBER_REFRESH_TOKEN;
  const res = await fetch(TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: ID, client_secret: SECRET, grant_type: 'refresh_token', refresh_token: rt }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`Token refresh failed HTTP ${res.status}`); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== rt) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  return d.access_token;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let TOKEN = null;
async function gql(query, variables, attempt = 0) {
  if (!TOKEN) TOKEN = await getAccessToken();
  const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) headers['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch(GQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`HTTP ${res.status}:`, JSON.stringify(data, null, 2)); process.exit(1); }
  if (data.errors) {
    if (data.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 12) {
      const wait = Math.min(30000, 3000 * (attempt + 1));
      process.stdout.write(`\n  throttled — waiting ${wait / 1000}s…\n`);
      await sleep(wait);
      return gql(query, variables, attempt + 1);
    }
    console.error('GraphQL errors:', JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }
  return data.data;
}

const Q = `
query($n:Int!, $cursor:String, $filter:PaymentRecordFilterAttributes) {
  paymentRecords(first:$n, after:$cursor, filter:$filter, sort:{key: ENTRY_DATE, direction: DESCENDING}) {
    totalCount
    nodes { id amount entryDate paymentType adjustmentType }
    pageInfo { hasNextPage endCursor }
  }
}`;

async function main() {
  const monthsBack = parseInt(process.argv[2] || '15', 10);
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1));
  const filter = { entryDate: { after: start.toISOString(), before: end.toISOString() } };
  const all = []; let cursor = null, hasNext = true, page = 0, total = null;
  while (hasNext) {
    const d = await gql(Q, { n: 100, cursor, filter });
    const c = d.paymentRecords;
    if (total === null) total = c.totalCount;
    all.push(...c.nodes);
    hasNext = c.pageInfo.hasNextPage; cursor = c.pageInfo.endCursor; page++;
    process.stdout.write(`\r  payments ${all.length}/${total} (${page} pages)   `);
    if (hasNext) await sleep(550);
  }
  process.stdout.write('\n');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const out = path.join(DATA_DIR, 'payments.json');
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), start: start.toISOString(), count: all.length, nodes: all }, null, 2));
  console.log(`Saved -> ${out}  (${all.length} payment records)`);
}
main().catch(e => { console.error(e); process.exit(1); });
