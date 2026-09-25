#!/usr/bin/env node
// autopay-open-exact.mjs — per-client walk (no cross-client pagination, so no tie-duplication):
// for every client whose active job has autopay ON, list any invoice with a balance left.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Agentic-os-got-moles';
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const ENV_PATH = path.join(ROOT, ['.', 'env'].join(''));
function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(key, value) {
  let t = fs.readFileSync(ENV_PATH, 'utf8');
  t = new RegExp(`^${key}=`, 'm').test(t) ? t.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`) : t + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, t);
}
const env = loadEnv();
let TOKEN = null;
async function auth() {
  const rt = loadEnv().JOBBER_REFRESH_TOKEN;
  const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: rt }) });
  const d = await res.json();
  if (!res.ok) { console.error('token fail', JSON.stringify(d)); process.exit(1); }
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
    if (d.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 12) { await sleep(3000 * (attempt + 1)); return gql(query, variables, attempt + 1); }
    console.error(JSON.stringify(d.errors, null, 2)); process.exit(1);
  }
  return d.data;
}

// 1. autopay clients from active jobs
const JOBS = `
query($n:Int!,$cursor:String){
  jobs(first:$n, after:$cursor, filter:{status: active}){
    totalCount
    nodes{ jobNumber willClientBeAutomaticallyCharged
      client{ id name isArchived phones{number} emails{address} }
      lineItems(first:5){ nodes{ name } } }
    pageInfo{ hasNextPage endCursor }
  }
}`;
const clients = new Map();
let cursor = null, total = null, n = 0;
do {
  const d = await gql(JOBS, { n: 25, cursor });
  const c = d.jobs;
  if (total === null) { total = c.totalCount; console.error(`active jobs: ${total}`); }
  for (const j of c.nodes) {
    const cl = j.client; if (!cl) continue;
    const names = (j.lineItems?.nodes || []).map(x => (x.name || '').toLowerCase()).join(' | ');
    const p = /total mole control/.test(names) ? 'TMCP' : /quick fix/.test(names) ? 'QuickFix' : 'other';
    const prev = clients.get(cl.id) || { id: cl.id, name: cl.name, archived: cl.isArchived, phone: cl.phones?.[0]?.number || null, email: cl.emails?.[0]?.address || null, autopay: false, product: p, jobs: [] };
    prev.autopay = prev.autopay || !!j.willClientBeAutomaticallyCharged;
    if (p === 'TMCP') prev.product = 'TMCP';
    prev.jobs.push(j.jobNumber);
    clients.set(cl.id, prev);
  }
  n += c.nodes.length;
  cursor = c.pageInfo.hasNextPage ? c.pageInfo.endCursor : null;
  process.stderr.write(`  jobs ${n}/${total}\r`);
  if (cursor) await sleep(350);
} while (cursor);
process.stderr.write('\n');
const autopayClients = [...clients.values()].filter(c => c.autopay);
console.error(`clients with an active job: ${clients.size}; autopay ON: ${autopayClients.length}`);

// 2. per-client invoice walk
const INV = `
query($c:EncodedId!,$n:Int!,$cursor:String){
  invoices(first:$n, after:$cursor, filter:{clientId:$c}, sort:{key: ISSUED_DATE, direction: DESCENDING}){
    totalCount
    nodes{ invoiceNumber invoiceStatus issuedDate dueDate amounts{ total invoiceBalance } }
    pageInfo{ hasNextPage endCursor }
  }
}`;
const today = new Date();
const days = d => Math.floor((today - new Date(d)) / 86400000);
const rows = [];
for (let i = 0; i < autopayClients.length; i++) {
  const c = autopayClients[i];
  const seen = new Map();
  let cur = null;
  do {
    const d = await gql(INV, { c: c.id, n: 50, cursor: cur });
    for (const inv of d.invoices.nodes) seen.set(inv.invoiceNumber, inv);
    cur = d.invoices.pageInfo.hasNextPage ? d.invoices.pageInfo.endCursor : null;
    if (cur) await sleep(200);
  } while (cur);
  const open = [...seen.values()].filter(x => (x.amounts.invoiceBalance || 0) > 0 && x.invoiceStatus !== 'draft');
  if (open.length) {
    open.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    rows.push({ ...c, openInvoices: open.map(o => ({ number: o.invoiceNumber, status: o.invoiceStatus, issued: o.issuedDate, due: o.dueDate, balance: o.amounts.invoiceBalance })),
      balance: open.reduce((s, o) => s + o.amounts.invoiceBalance, 0), daysPastDue: days(open[0].dueDate) });
  }
  process.stderr.write(`  clients ${i + 1}/${autopayClients.length}  hits ${rows.length}\r`);
  await sleep(120);
}
process.stderr.write('\n');

// 3. cards on file
for (const r of rows) {
  const d = await gql(`query($c:EncodedId!){ paymentMethods(filter:{clientId:$c}){ totalCount } }`, { c: r.id });
  r.cardsOnFile = d.paymentMethods?.totalCount ?? null;
  await sleep(150);
}

rows.sort((a, b) => b.daysPastDue - a.daysPastDue);
const money = v => '$' + Number(v || 0).toFixed(2);
const dest = path.join(ROOT, 'projects/briefs/jobber-text-automation/data/autopay-not-collecting.json');
fs.writeFileSync(dest, JSON.stringify({ generatedAt: new Date().toISOString(), method: 'per-client invoice walk (deduped)', activeJobClients: clients.size, autopayOnClients: autopayClients.length, count: rows.length, totalBalance: rows.reduce((s, r) => s + r.balance, 0), clients: rows }, null, 2));
console.error(`wrote ${dest}`);

console.log(`\nAUTOPAY ON, INVOICE STILL UNPAID — ${rows.length} of ${autopayClients.length} autopay clients, ${money(rows.reduce((s, r) => s + r.balance, 0))}\n`);
console.log('days  client                       balance   invoice(s)                          cards  phone');
for (const r of rows) {
  const inv = r.openInvoices.map(o => `#${o.number} ${o.status} due ${o.due.slice(0, 10)} ${money(o.balance)}`).join(' + ');
  console.log(`${String(r.daysPastDue).padStart(4)}  ${String(r.name).slice(0, 26).padEnd(27)} ${money(r.balance).padStart(9)}  ${inv.padEnd(36)} ${String(r.cardsOnFile).padStart(5)}  ${r.phone || ''}${r.archived ? ' [ARCHIVED]' : ''}`);
}
