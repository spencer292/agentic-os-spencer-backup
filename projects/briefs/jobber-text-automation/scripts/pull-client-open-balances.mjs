#!/usr/bin/env node
// pull-client-open-balances.mjs — the collections view that does NOT understate the ask.
//
// Why this exists: `filter:{status: past_due}` hides invoices that are issued but not yet due,
// so the past-due slice understates what to ask a client for on a call. Western Plaza read
// $500 past due while the real open balance was $1,700 across three invoices (2026-09-09).
//
// Seeds from data/past-due-raw.json (run pull-past-due.mjs first), then walks EVERY invoice
// for each of those clients and rolls up the full open balance, plus the three signals that
// decide the channel: card on file, autopay flag, and whether they ever opened the invoice.
//
// Read-only.
//   node projects/briefs/jobber-text-automation/scripts/pull-client-open-balances.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';

function findEnvPath() {
  let dir = __dirname;
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
const ID = env.JOBBER_CLIENT_ID, SECRET = env.JOBBER_CLIENT_SECRET;
if (!ID || !SECRET) { console.error('Missing JOBBER_CLIENT_ID / JOBBER_CLIENT_SECRET in .env'); process.exit(1); }

async function getAccessToken() {
  const rt = loadEnv().JOBBER_REFRESH_TOKEN;
  if (!rt) { console.error('No JOBBER_REFRESH_TOKEN in .env'); process.exit(1); }
  const res = await fetch(TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
      process.stderr.write(`  throttled — waiting ${wait / 1000}s\n`);
      await sleep(wait);
      return gql(query, variables, attempt + 1);
    }
    console.error('GraphQL errors:', JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }
  return data.data;
}

const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'past-due-raw.json'), 'utf8'));
const seed = new Map();
for (const inv of raw.invoices) if (inv.client?.id) seed.set(inv.client.id, inv.client.name);
console.error(`seed: ${raw.invoices.length} past-due invoices across ${seed.size} clients (pull ${raw.generatedAt})`);

const PER_CLIENT = `
query($c:EncodedId!,$cursor:String){
  client(id:$c){ id name isArchived
    phones{ number smsAllowed primary }
    emails{ address primary }
    billingAddress{ street city province postalCode }
    jobs(first:25){ nodes{ jobNumber jobStatus willClientBeAutomaticallyCharged lineItems(first:5){ nodes{ name } } } } }
  paymentMethods(filter:{clientId:$c}){ totalCount }
  invoices(first:50, after:$cursor, filter:{clientId:$c}, sort:{key: ISSUED_DATE, direction: DESCENDING}){
    nodes{ invoiceNumber invoiceStatus issuedDate dueDate clientHubUri dateViewedInClientHub
      linkedCommunications{ totalCount } amounts{ total invoiceBalance paymentsTotal } }
    pageInfo{ hasNextPage endCursor } }
}`;

const now = new Date();
const days = d => Math.floor((now - new Date(d)) / 864e5);
const ids = [...seed.keys()];
const rows = [];
for (let i = 0; i < ids.length; i++) {
  const id = ids[i];
  const invMap = new Map();
  let cur = null, head = null;
  do {
    const d = await gql(PER_CLIENT, { c: id, cursor: cur });
    if (!head) head = d;
    for (const inv of d.invoices.nodes) invMap.set(inv.invoiceNumber, inv);
    cur = d.invoices.pageInfo.hasNextPage ? d.invoices.pageInfo.endCursor : null;
    if (cur) await sleep(250);
  } while (cur);

  const cl = head.client;
  // Client.jobs returns the PER-JOB status (upcoming / today / late / archived / completed …),
  // NOT the top-level `filter:{status: active}` bucket — "active" is never a value here.
  // Live = anything not archived or completed.
  const DEAD = new Set(['archived', 'completed']);
  const jobs = (cl.jobs?.nodes || []).filter(j => !DEAD.has(String(j.jobStatus).toLowerCase()));
  const names = jobs.flatMap(j => (j.lineItems?.nodes || []).map(x => (x.name || '').toLowerCase())).join(' | ');
  const product = /total mole control/.test(names) ? 'TMCP' : /quick fix/.test(names) ? 'QuickFix' : jobs.length ? 'other' : 'none';
  const open = [...invMap.values()]
    .filter(x => (x.amounts.invoiceBalance || 0) > 0 && x.invoiceStatus !== 'draft' && x.invoiceStatus !== 'paid')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  // `paid` with a residual balance = a Jobber accounting artifact, not money to chase (2026-09-01).
  const artifacts = [...invMap.values()].filter(x => (x.amounts.invoiceBalance || 0) > 0 && x.invoiceStatus === 'paid');

  if (open.length) rows.push({
    id, name: cl.name, archived: cl.isArchived, product,
    autopay: jobs.some(j => j.willClientBeAutomaticallyCharged),
    activeJobs: jobs.map(j => j.jobNumber),
    cardsOnFile: head.paymentMethods?.totalCount ?? 0,
    phones: (cl.phones || []).map(p => ({ number: p.number, smsAllowed: p.smsAllowed, primary: p.primary })),
    emails: (cl.emails || []).map(e => e.address),
    address: cl.billingAddress ? [cl.billingAddress.street, cl.billingAddress.city, cl.billingAddress.province, cl.billingAddress.postalCode].filter(Boolean).join(', ') : null,
    openBalance: open.reduce((s, o) => s + o.amounts.invoiceBalance, 0),
    pastDueBalance: open.filter(o => days(o.dueDate) > 0).reduce((s, o) => s + o.amounts.invoiceBalance, 0),
    oldestDaysPastDue: days(open[0].dueDate),
    neverOpened: open.every(o => !o.dateViewedInClientHub),
    invoices: open.map(o => ({ number: o.invoiceNumber, status: o.invoiceStatus, issued: o.issuedDate, due: o.dueDate,
      daysPastDue: days(o.dueDate), balance: o.amounts.invoiceBalance, total: o.amounts.total,
      viewed: o.dateViewedInClientHub, comms: o.linkedCommunications?.totalCount ?? 0, payLink: o.clientHubUri })),
    paidWithResidual: artifacts.map(a => ({ number: a.invoiceNumber, balance: a.amounts.invoiceBalance, issued: a.issuedDate })),
  });
  process.stderr.write(`  clients ${i + 1}/${ids.length}\r`);
  await sleep(150);
}
process.stderr.write('\n');

rows.sort((a, b) => b.openBalance - a.openBalance);
const money = v => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dest = path.join(DATA_DIR, `${now.toISOString().slice(0, 10)}_client-open-balances.json`);
fs.writeFileSync(dest, JSON.stringify({
  generatedAt: now.toISOString(), seededFrom: raw.generatedAt, seedClients: ids.length,
  clients: rows.length,
  openBalance: rows.reduce((s, r) => s + r.openBalance, 0),
  pastDueBalance: rows.reduce((s, r) => s + r.pastDueBalance, 0),
  rows,
}, null, 2));

console.log(`\nOPEN BALANCE for every client with at least one past-due invoice`);
console.log(`${rows.length} clients — open ${money(rows.reduce((s, r) => s + r.openBalance, 0))}, of which past due ${money(rows.reduce((s, r) => s + r.pastDueBalance, 0))}\n`);
console.log('days  client                          open      pastdue  inv  card auto  ch  product');
for (const r of rows) {
  console.log(`${String(r.oldestDaysPastDue).padStart(4)}  ${String(r.name).slice(0, 28).padEnd(29)} ${money(r.openBalance).padStart(10)} ${money(r.pastDueBalance).padStart(10)}  ${String(r.invoices.length).padStart(3)}  ${String(r.cardsOnFile).padStart(4)} ${(r.autopay ? ' ON' : 'off').padStart(4)}  ${(r.neverOpened ? '--' : 'ok').padStart(2)}  ${r.product}${r.archived ? ' [ARCHIVED]' : ''}`);
}
console.log(`\nwrote ${dest}`);
