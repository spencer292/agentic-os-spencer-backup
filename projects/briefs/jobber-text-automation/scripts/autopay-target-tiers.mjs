#!/usr/bin/env node
// autopay-target-tiers.mjs — builds the prioritized "ask for autopay approval" list.
//
// Autopay cannot be switched on unilaterally: a stored card authorizes the charge the customer
// agreed to, not an open-ended recurring one. Card-network stored-credential rules and FTC
// negative-option rules both require explicit consent, with an auditable record. So this script
// produces an ASK list, not a change list.
//
// Tiers, warmest first:
//   T1  card on file + past due   -> already trusted you with a card AND currently owes
//   T2  card on file, current     -> one question away
//   T3  no card + past due        -> needs card details AND consent
//   T4  no card, current          -> cold, bulk campaign
//
// Inputs:  data/autopay-audit.json (autopay-audit.mjs), data/past-due-raw.json (pull-past-due.mjs)
// Output:  data/autopay-targets.json
// Read-only against Jobber.
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
  if (!res.ok) { console.error(`Token refresh failed HTTP ${res.status}`); process.exit(1); }
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
  const d = await res.json().catch(() => ({}));
  if (d.errors) {
    if (d.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 10) {
      await sleep(3000 * (attempt + 1));
      return gql(query, attempt + 1);
    }
    console.error('GraphQL errors:', JSON.stringify(d.errors, null, 2));
    process.exit(1);
  }
  return d.data;
}

const audit = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'autopay-audit.json'), 'utf8'));
const pastDue = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'past-due-raw.json'), 'utf8'));

// One entry per client: TMCP jobs that are NOT on automatic payments.
const targets = [...new Map(
  audit.jobs.filter(j => j.product === 'TMCP' && !j.autopay).map(j => [j.client.id, j.client.name])
).entries()];
console.error(`Checking saved cards for ${targets.length} TMCP clients with autopay off…`);

const cards = {};
for (let i = 0; i < targets.length; i += 20) {
  const slice = targets.slice(i, i + 20);
  const q = 'query {\n' + slice.map(([id], n) =>
    `  c${n}: paymentMethods(filter:{clientId:"${id}"}) { totalCount }`).join('\n') + '\n}';
  const d = await gql(q);
  slice.forEach(([id], n) => { cards[id] = d[`c${n}`].totalCount; });
  process.stderr.write(`  ${Math.min(i + 20, targets.length)}/${targets.length}\n`);
  if (i + 20 < targets.length) await sleep(700);
}

const due = {};
for (const inv of pastDue.invoices) due[inv.client.id] = (due[inv.client.id] || 0) + inv.amounts.invoiceBalance;

const tiers = { T1: [], T2: [], T3: [], T4: [] };
for (const [id, name] of targets) {
  const hasCard = cards[id] > 0, owes = due[id] || 0;
  const row = { id, name, cardsOnFile: cards[id] || 0, pastDueBalance: owes };
  if (hasCard && owes) tiers.T1.push(row);
  else if (hasCard) tiers.T2.push(row);
  else if (owes) tiers.T3.push(row);
  else tiers.T4.push(row);
}

fs.writeFileSync(path.join(DATA_DIR, 'autopay-targets.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), tiers }, null, 2));

const money = a => '$' + a.reduce((s, x) => s + x.pastDueBalance, 0).toLocaleString();
const L = [
  ['T1', 'card on file + past due', 'warmest ask'],
  ['T2', 'card on file, current', 'one question away'],
  ['T3', 'no card + past due', 'needs card + consent'],
  ['T4', 'no card, current', 'cold, bulk campaign'],
];
console.log(`\nTMCP CLIENTS WITH AUTOPAY OFF: ${targets.length}\n`);
console.log('  tier  segment                    clients    past due   note');
for (const [k, label, note] of L) {
  const t = tiers[k];
  console.log(`  ${k}    ${label.padEnd(26)}${String(t.length).padStart(5)}${money(t).padStart(12)}   ${note}`);
}
console.log(`\n  already have a card on file: ${tiers.T1.length + tiers.T2.length}`);
console.log(`  wrote data/autopay-targets.json\n`);
