#!/usr/bin/env node
// Cash-flow projection — Jobber invoice puller.
// Paginates the Got Moles Jobber account and writes a raw invoice dataset to
// data/invoices-raw.json for the modelling step (build-projection.mjs).
//
// Pulls TWO cohorts:
//   1. History  — invoices ISSUED in the last N months (default 12) → collection-curve source.
//   2. Open A/R — every invoice with an outstanding balance right now, regardless of issue date.
//
// Read-only. Reuses the same OAuth refresh flow as the tool-jobber skill.
// Run from the repo root:  node projects/briefs/cash-flow-projection/scripts/pull-invoices.mjs [months]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_DIR, 'data');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';

// ---- .env (walk up to repo root) ----
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
  if (new RegExp(`^${key}=`, 'm').test(text)) {
    text = text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
  } else {
    text += `${text.endsWith('\n') ? '' : '\n'}${key}=${value}\n`;
  }
  fs.writeFileSync(ENV_PATH, text);
}

const env = loadEnv();
const ID = env.JOBBER_CLIENT_ID, SECRET = env.JOBBER_CLIENT_SECRET;
if (!ID || !SECRET) {
  console.error('Missing JOBBER_CLIENT_ID / JOBBER_CLIENT_SECRET in .env');
  process.exit(1);
}

async function getAccessToken() {
  const rt = loadEnv().JOBBER_REFRESH_TOKEN;
  if (!rt) { console.error('No JOBBER_REFRESH_TOKEN in .env — run the skill auth flow first.'); process.exit(1); }
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
// Retries on Jobber's query-cost throttle (THROTTLED) with backoff so the
// leaky-bucket budget can refill. The two limiters are req-count and query-cost;
// this handles the cost one, which large paginated pulls hit first.
async function gql(query, variables, attempt = 0) {
  if (!ACCESS_TOKEN) ACCESS_TOKEN = await getAccessToken();
  const headers = { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
  const ver = env.JOBBER_GRAPHQL_VERSION;
  if (ver) headers['X-JOBBER-GRAPHQL-VERSION'] = ver;
  const res = await fetch(GQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`HTTP ${res.status}:`, JSON.stringify(data, null, 2)); process.exit(1); }
  if (data.errors) {
    const throttled = data.errors.some(e => e.extensions?.code === 'THROTTLED');
    if (throttled && attempt < 8) {
      const wait = Math.min(30000, 3000 * (attempt + 1));
      process.stdout.write(`\n  throttled — waiting ${wait / 1000}s for cost budget to refill…\n`);
      await sleep(wait);
      return gql(query, variables, attempt + 1);
    }
    console.error('GraphQL errors:', JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }
  return data.data;
}

// History cohort needs only dates + amounts (no client) to keep query cost low.
// depositAmount marks new-customer jobs (deposit taken at booking = early cash,
// not included in paymentsTotal).
const HISTORY_FIELDS = `
  id
  invoiceNumber
  invoiceStatus
  issuedDate
  dueDate
  receivedDate
  createdAt
  amounts { total invoiceBalance paymentsTotal depositAmount }
`;
// Open-A/R cohort adds client name so the report can show who owes.
const OPEN_FIELDS = HISTORY_FIELDS + `
  client { name }
`;

const pageQuery = fields => `
query($n:Int!, $cursor:String, $filter:InvoiceFilterAttributes) {
  invoices(first:$n, after:$cursor, filter:$filter, sort:{key: ISSUED_DATE, direction: DESCENDING}) {
    totalCount
    nodes { ${fields} }
    pageInfo { hasNextPage endCursor }
  }
}`;

async function pullAll(label, filter, fields = HISTORY_FIELDS) {
  const query = pageQuery(fields);
  const all = [];
  let cursor = null, hasNext = true, page = 0, total = null;
  while (hasNext) {
    const d = await gql(query, { n: 50, cursor, filter });
    const conn = d.invoices;
    if (total === null) total = conn.totalCount;
    all.push(...conn.nodes);
    hasNext = conn.pageInfo.hasNextPage;
    cursor = conn.pageInfo.endCursor;
    page++;
    process.stdout.write(`\r  [${label}] ${all.length}/${total} invoices (${page} pages)   `);
    // stay well inside both limiters: req-count and the query-cost leaky bucket
    if (hasNext) await sleep(700);
  }
  process.stdout.write('\n');
  return { total, nodes: all };
}

// ---- date helpers (UTC, no external deps) ----
function isoMonthsAgo(months, ref) {
  const d = new Date(ref);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString();
}

async function main() {
  const months = parseInt(process.argv[2] || '12', 10);
  const generatedAt = new Date().toISOString();
  const historyStart = isoMonthsAgo(months, generatedAt);

  console.log(`Pulling Jobber invoices — history window ${months} months (issued since ${historyStart.slice(0,10)}).`);

  // 1. History cohort: issued within the window.
  const history = await pullAll('history', {
    issuedDate: { after: historyStart, before: generatedAt },
  });

  // 2. Open receivables: currently awaiting payment or past due (any issue date).
  const awaiting = await pullAll('awaiting_payment', { status: 'awaiting_payment' }, OPEN_FIELDS);
  const pastDue = await pullAll('past_due', { status: 'past_due' }, OPEN_FIELDS);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const outPath = path.join(DATA_DIR, 'invoices-raw.json');
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt,
    historyWindowMonths: months,
    historyStart,
    account: 'Got Moles',
    history,
    open: {
      awaiting_payment: awaiting,
      past_due: pastDue,
    },
  }, null, 2));

  console.log(`\nSaved → ${outPath}`);
  console.log(`  history invoices:      ${history.nodes.length}`);
  console.log(`  open awaiting_payment: ${awaiting.nodes.length}`);
  console.log(`  open past_due:         ${pastDue.nodes.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
