#!/usr/bin/env node
// enrich-payment-methods.mjs — adds a card-on-file signal to the past-due dataset.
//
// Jobber gates payment-method DETAIL the same way it gates messages:
// `PaymentMethodInterfaceEdge` exposes only `cursor`, so we can never read the card itself.
// But `paymentMethods(filter:{clientId}) { totalCount }` IS readable, which gives a per-client
// boolean: does this customer already have a payment method saved?
//
// Card on file + past due  =  the charge failed, or autopay was never switched on.
// No card on file          =  a genuine autopay conversion target.
//
// Read-only. Run after pull-past-due.mjs:
//   node projects/briefs/jobber-text-automation/scripts/enrich-payment-methods.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const RAW = path.join(DATA_DIR, 'past-due-raw.json');
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
async function gql(query, attempt = 0) {
  if (!ACCESS_TOKEN) ACCESS_TOKEN = await getAccessToken();
  const headers = { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) headers['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch(GQL_URL, { method: 'POST', headers, body: JSON.stringify({ query }) });
  const data = await res.json().catch(() => ({}));
  if (data.errors) {
    if (data.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 8) {
      const wait = Math.min(30000, 3000 * (attempt + 1));
      process.stderr.write(`  throttled — waiting ${wait / 1000}s…\n`);
      await sleep(wait);
      return gql(query, attempt + 1);
    }
    console.error('GraphQL errors:', JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }
  return data.data;
}

const payload = JSON.parse(fs.readFileSync(RAW, 'utf8'));
const clients = [...new Map(payload.invoices.map(i => [i.client.id, i.client])).values()];
console.log(`Checking saved payment methods for ${clients.length} clients…`);

const cardCount = {};
const BATCH = 20;
for (let i = 0; i < clients.length; i += BATCH) {
  const slice = clients.slice(i, i + BATCH);
  const q = 'query {\n' + slice.map((c, n) =>
    `  c${n}: paymentMethods(filter:{clientId:"${c.id}"}) { totalCount }`).join('\n') + '\n}';
  const d = await gql(q);
  slice.forEach((c, n) => { cardCount[c.id] = d[`c${n}`].totalCount; });
  process.stderr.write(`  ${Math.min(i + BATCH, clients.length)}/${clients.length}\n`);
  if (i + BATCH < clients.length) await sleep(800);
}

for (const inv of payload.invoices) inv.cardsOnFile = cardCount[inv.client.id] ?? null;
payload.paymentMethodsCheckedAt = new Date().toISOString();
fs.writeFileSync(RAW, JSON.stringify(payload, null, 2));

const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sum = a => a.reduce((s, x) => s + x.amounts.invoiceBalance, 0);
const withCard = payload.invoices.filter(i => i.cardsOnFile > 0);
const without = payload.invoices.filter(i => !i.cardsOnFile);

console.log(`\nPAST-DUE INVOICES BY CARD-ON-FILE STATUS\n`);
console.log(`  card on file    ${String(withCard.length).padStart(3)} invoices  ${money(sum(withCard)).padStart(11)}   -> charge failed, or autopay never enabled`);
console.log(`  no card         ${String(without.length).padStart(3)} invoices  ${money(sum(without)).padStart(11)}   -> autopay conversion target`);

const cSet = id => new Set(payload.invoices.filter(i => (id ? i.cardsOnFile > 0 : !i.cardsOnFile)).map(i => i.client.id)).size;
console.log(`\n  unique clients with a card:    ${cSet(true)}`);
console.log(`  unique clients with no card:   ${cSet(false)}`);
console.log(`\n  wrote cardsOnFile into data/past-due-raw.json\n`);
