#!/usr/bin/env node
// pull-past-due.mjs — Phase 0/1 foundation for the past-due text lane.
//
// Pulls every past_due invoice with the fields the outbound texter needs, buckets by days
// past due, and reports the exact day-7 and day-11 cohorts (the two send triggers).
//
// Read-only. Same OAuth refresh flow as the tool-jobber skill.
//   node projects/briefs/jobber-text-automation/scripts/pull-past-due.mjs [--json]
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
  fs.writeFileSync(text ? ENV_PATH : ENV_PATH, text);
}

const env = loadEnv();
const ID = env.JOBBER_CLIENT_ID, SECRET = env.JOBBER_CLIENT_SECRET;
if (!ID || !SECRET) { console.error('Missing JOBBER_CLIENT_ID / JOBBER_CLIENT_SECRET in .env'); process.exit(1); }

async function getAccessToken() {
  const rt = loadEnv().JOBBER_REFRESH_TOKEN;
  if (!rt) { console.error('No JOBBER_REFRESH_TOKEN in .env — run the tool-jobber auth flow.'); process.exit(1); }
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
    if (data.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 8) {
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

// Everything the outbound texter needs to decide + compose, in one pull.
const QUERY = `
query($n:Int!, $cursor:String) {
  invoices(first:$n, after:$cursor, filter:{status: past_due}, sort:{key: ISSUED_DATE, direction: DESCENDING}) {
    totalCount
    nodes {
      id
      invoiceNumber
      invoiceStatus
      issuedDate
      dueDate
      clientHubUri
      dateViewedInClientHub
      linkedCommunications { totalCount }
      amounts { total invoiceBalance paymentsTotal }
      client { id name isArchived phones { number smsAllowed } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

const asJson = process.argv.includes('--json');
const out = [];
let cursor = null, total = null;
do {
  const d = await gql(QUERY, { n: 50, cursor });
  const c = d.invoices;
  if (total === null) total = c.totalCount;
  out.push(...c.nodes);
  cursor = c.pageInfo.hasNextPage ? c.pageInfo.endCursor : null;
  if (!asJson) process.stderr.write(`  pulled ${out.length}/${total}\n`);
  if (cursor) await sleep(600); // stay inside the cost limiter
} while (cursor);

const now = new Date();
const daysPastDue = d => Math.floor((now - new Date(d)) / 864e5);
const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

for (const inv of out) {
  inv.daysPastDue = daysPastDue(inv.dueDate);
  const phone = (inv.client?.phones || []).find(p => p.smsAllowed) || null;
  inv.smsPhone = phone?.number || null;
  inv.textable = Boolean(phone) && !inv.client?.isArchived && inv.amounts.invoiceBalance > 0;
}

fs.mkdirSync(DATA_DIR, { recursive: true });
const payload = { generatedAt: now.toISOString(), totalCount: total, invoices: out };
fs.writeFileSync(path.join(DATA_DIR, 'past-due-raw.json'), JSON.stringify(payload, null, 2));

if (asJson) { console.log(JSON.stringify(payload, null, 2)); process.exit(0); }

const sum = a => a.reduce((s, x) => s + x.amounts.invoiceBalance, 0);
console.log(`\nPAST DUE as of ${now.toISOString().slice(0, 16).replace('T', ' ')}  —  ${out.length} invoices, ${money(sum(out))}\n`);

const buckets = [[0, 0], [1, 6], [7, 7], [8, 10], [11, 11], [12, 20], [21, 45], [46, 90], [91, 9999]];
console.log('  days past due   invoices    balance     textable');
for (const [lo, hi] of buckets) {
  const b = out.filter(i => i.daysPastDue >= lo && i.daysPastDue <= hi);
  if (!b.length) continue;
  const label = lo === hi ? `${lo}` : hi === 9999 ? `${lo}+` : `${lo}-${hi}`;
  const mark = (lo === 7 && hi === 7) || (lo === 11 && hi === 11) ? '  <-- SEND TRIGGER' : '';
  console.log(`  ${label.padStart(11)}   ${String(b.length).padStart(8)}   ${money(sum(b)).padStart(10)}   ${String(b.filter(i => i.textable).length).padStart(8)}${mark}`);
}

const notViewed = out.filter(i => !i.dateViewedInClientHub);
const noSms = out.filter(i => !i.smsPhone);
console.log(`\n  never opened the invoice in client hub: ${notViewed.length}/${out.length}`);
console.log(`  no SMS-allowed phone on file:           ${noSms.length}/${out.length}`);

const dupClients = new Map();
for (const i of out) dupClients.set(i.client?.id, (dupClients.get(i.client?.id) || 0) + 1);
const multi = [...dupClients.values()].filter(n => n > 1).length;
console.log(`  clients with >1 open past-due invoice:  ${multi}  (must collapse to one text)`);
console.log(`\n  wrote data/past-due-raw.json\n`);
