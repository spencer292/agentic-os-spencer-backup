#!/usr/bin/env node
// CFO — pull Jobber invoice history for month-end revenue forecasting.
// Read-only. Writes projects/briefs/cfo/data/invoice-history.json
// Usage (from repo root): node projects/briefs/cfo/scripts/pull-invoice-history.mjs [monthsBack]
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
if (!ID || !SECRET) { console.error('Missing JOBBER_CLIENT_ID / JOBBER_CLIENT_SECRET'); process.exit(1); }

async function getAccessToken() {
  const rt = loadEnv().JOBBER_REFRESH_TOKEN;
  if (!rt) { console.error('No JOBBER_REFRESH_TOKEN'); process.exit(1); }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: ID, client_secret: SECRET, grant_type: 'refresh_token', refresh_token: rt }),
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
  if (!res.ok) { console.error(`HTTP ${res.status}:`, JSON.stringify(data, null, 2)); process.exit(1); }
  if (data.errors) {
    if (data.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 10) {
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

const FIELDS = `
  id
  invoiceNumber
  invoiceStatus
  issuedDate
  createdAt
  amounts { total invoiceBalance paymentsTotal depositAmount discountAmount }
`;
const PAGE = `
query($n:Int!, $cursor:String, $filter:InvoiceFilterAttributes) {
  invoices(first:$n, after:$cursor, filter:$filter, sort:{key: ISSUED_DATE, direction: DESCENDING}) {
    totalCount
    nodes { ${FIELDS} }
    pageInfo { hasNextPage endCursor }
  }
}`;

async function pullAll(label, filter) {
  const all = []; let cursor = null, hasNext = true, page = 0, total = null;
  while (hasNext) {
    const d = await gql(PAGE, { n: 100, cursor, filter });
    const conn = d.invoices;
    if (total === null) total = conn.totalCount;
    all.push(...conn.nodes);
    hasNext = conn.pageInfo.hasNextPage; cursor = conn.pageInfo.endCursor; page++;
    process.stdout.write(`\r  [${label}] ${all.length}/${total} (${page} pages)   `);
    if (hasNext) await sleep(600);
  }
  process.stdout.write('\n');
  return { total, nodes: all };
}

async function main() {
  const monthsBack = parseInt(process.argv[2] || '26', 10);
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
  const generatedAt = now.toISOString();
  console.log(`Pulling invoices issued ${start.toISOString().slice(0, 10)} -> ${generatedAt.slice(0, 10)}`);
  const history = await pullAll('history', { issuedDate: { after: start.toISOString(), before: generatedAt } });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const out = path.join(DATA_DIR, 'invoice-history.json');
  fs.writeFileSync(out, JSON.stringify({ generatedAt, start: start.toISOString(), count: history.nodes.length, nodes: history.nodes }, null, 2));
  console.log(`Saved -> ${out}  (${history.nodes.length} invoices)`);
}
main().catch(e => { console.error(e); process.exit(1); });
