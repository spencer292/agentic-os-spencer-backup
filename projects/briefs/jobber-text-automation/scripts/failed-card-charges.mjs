#!/usr/bin/env node
// failed-cards.mjs — every FAILED Jobber Payments charge in a window, flagged by
// whether the client is on autopay (Job.willClientBeAutomaticallyCharged) and whether
// the invoice is still open. Read-only.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Agentic-os-got-moles';
const SINCE = process.argv[2] || '2026-06-01T00:00:00Z';
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const ENV_PATH = path.join(ROOT, ['.', 'env'].join(''));

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(key, value) {
  let t = fs.readFileSync(ENV_PATH, 'utf8');
  t = new RegExp(`^${key}=`, 'm').test(t)
    ? t.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
    : t + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, t);
}
const env = loadEnv();
let TOKEN = null;
async function auth() {
  const rt = loadEnv().JOBBER_REFRESH_TOKEN;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token', refresh_token: rt,
    }),
  });
  const d = await res.json();
  if (!res.ok) { console.error('token refresh failed', JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== rt) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  return d.access_token;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function gql(query, variables, attempt = 0) {
  if (!TOKEN) TOKEN = await auth();
  const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) headers['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch(GQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const d = await res.json().catch(() => ({}));
  if (d.errors) {
    if (d.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 12) {
      await sleep(Math.min(30000, 3000 * (attempt + 1)));
      return gql(query, variables, attempt + 1);
    }
    console.error(JSON.stringify(d.errors, null, 2)); process.exit(1);
  }
  return d.data;
}

// ---- 1. every payment record in the window -------------------------------
const PAY = `
query($n:Int!,$cursor:String,$since:ISO8601DateTime!){
  paymentRecords(first:$n, after:$cursor, filter:{entryDate:{after:$since}}){
    totalCount
    nodes{
      id entryDate amount paymentType paymentOrigin
      client{ id name emails{address} phones{number} }
      invoice{ id invoiceNumber invoiceStatus dueDate amounts{ total invoiceBalance } }
      ... on JobberPaymentsCreditCardPaymentRecord { transactionStatus lastDigits brand expiry nameOnCard }
      ... on JobberPaymentsACHPaymentRecord { transactionStatus }
    }
    pageInfo{ hasNextPage endCursor }
  }
}`;
const records = [];
let cursor = null, total = null;
do {
  const d = await gql(PAY, { n: 50, cursor, since: SINCE });
  const c = d.paymentRecords;
  if (total === null) { total = c.totalCount; console.error(`payment records since ${SINCE}: ${total}`); }
  records.push(...c.nodes);
  cursor = c.pageInfo.hasNextPage ? c.pageInfo.endCursor : null;
  process.stderr.write(`  payments ${records.length}/${total}\r`);
  if (cursor) await sleep(400);
} while (cursor);
process.stderr.write('\n');

const tally = {};
for (const r of records) { const k = String(r.transactionStatus ?? `n/a:${r.paymentType}`); tally[k] = (tally[k] || 0) + 1; }
console.error('status tally:', JSON.stringify(tally));

const failed = records.filter(r => r.transactionStatus === 'FAILED');

// ---- 2. autopay flag per client (from active jobs) -----------------------
const JOBS = `
query($n:Int!,$cursor:String){
  jobs(first:$n, after:$cursor, filter:{status: active}){
    totalCount
    nodes{ id jobNumber willClientBeAutomaticallyCharged client{ id name } lineItems(first:5){ nodes{ name } } }
    pageInfo{ hasNextPage endCursor }
  }
}`;
const autopayByClient = new Map();
const productByClient = new Map();
cursor = null; total = null; let n = 0;
do {
  const d = await gql(JOBS, { n: 25, cursor });
  const c = d.jobs;
  if (total === null) { total = c.totalCount; console.error(`active jobs: ${total}`); }
  for (const j of c.nodes) {
    const cid = j.client?.id; if (!cid) continue;
    if (j.willClientBeAutomaticallyCharged) autopayByClient.set(cid, true);
    else if (!autopayByClient.has(cid)) autopayByClient.set(cid, false);
    const names = (j.lineItems?.nodes || []).map(x => (x.name || '').toLowerCase()).join(' | ');
    const p = /total mole control/.test(names) ? 'TMCP' : /quick fix/.test(names) ? 'QuickFix' : 'other';
    if (!productByClient.has(cid) || p === 'TMCP') productByClient.set(cid, p);
  }
  n += c.nodes.length;
  cursor = c.pageInfo.hasNextPage ? c.pageInfo.endCursor : null;
  process.stderr.write(`  jobs ${n}/${total}\r`);
  if (cursor) await sleep(350);
} while (cursor);
process.stderr.write('\n');

const out = failed.map(r => ({
  when: r.entryDate,
  client: r.client?.name,
  clientId: r.client?.id,
  phone: r.client?.phones?.[0]?.number || null,
  email: r.client?.emails?.[0]?.address || null,
  amount: r.amount,
  origin: r.paymentOrigin,
  card: r.brand ? `${r.brand} ..${r.lastDigits} exp ${r.expiry}` : r.paymentType,
  expiry: r.expiry || null,
  invoice: r.invoice ? `#${r.invoice.invoiceNumber}` : null,
  invoiceStatus: r.invoice?.invoiceStatus || null,
  invoiceBalance: r.invoice?.amounts?.invoiceBalance ?? null,
  autopayNow: autopayByClient.has(r.client?.id) ? autopayByClient.get(r.client?.id) : null,
  product: productByClient.get(r.client?.id) ?? null,
})).sort((a, b) => (a.when < b.when ? 1 : -1));

const dest = path.join(ROOT, 'projects/briefs/jobber-text-automation/data/failed-card-charges.json');
fs.writeFileSync(dest, JSON.stringify({
  generatedAt: new Date().toISOString(), since: SINCE,
  totalPaymentRecords: records.length, statusTally: tally,
  failedCount: out.length, failures: out,
}, null, 2));
console.error(`wrote ${dest}`);

const money = v => '$' + Number(v || 0).toFixed(2);
console.log(`\nFAILED charges since ${SINCE.slice(0, 10)} — ${out.length} of ${records.length} payment records\n`);
for (const f of out) {
  console.log(`${f.when.slice(0, 10)}  ${String(f.client).padEnd(26)} ${money(f.amount).padStart(9)}  ${String(f.card).padEnd(32)} ${(f.invoice || '-').padEnd(7)} ${String(f.invoiceStatus || '-').padEnd(12)} bal ${money(f.invoiceBalance).padStart(9)}  autopay:${f.autopayNow === true ? 'ON ' : f.autopayNow === false ? 'OFF' : '?  '} ${f.product || ''} ${f.origin}`);
}
const still = out.filter(f => (f.invoiceBalance || 0) > 0);
console.log(`\nstill unpaid: ${still.length}  —  ${money(still.reduce((s, f) => s + (f.invoiceBalance || 0), 0))}`);
console.log(`autopay ON now: ${out.filter(f => f.autopayNow === true).length}   autopay OFF now: ${out.filter(f => f.autopayNow === false).length}   no active job: ${out.filter(f => f.autopayNow === null).length}`);
