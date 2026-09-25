#!/usr/bin/env node
// build-call-list.mjs — the voice lane: clients where text has already failed.
//
// Takes the newest *_client-open-balances.json, selects everyone past --min-days (default 31),
// RE-VERIFIES each balance live against Jobber, and writes a call sheet.
//
// The re-verify is the point: an open-balance pull goes stale within hours, and asking someone
// for money they paid this morning costs more goodwill than the call recovers.
//
//   node projects/briefs/jobber-text-automation/scripts/build-call-list.mjs [--min-days=31]
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
const loadEnv = () => {
  const env = {};
  if (!ENV_PATH) return env;
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
};
const env = loadEnv();
async function getAccessToken() {
  const rt = env.JOBBER_REFRESH_TOKEN;
  const res = await fetch(TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: rt }),
  });
  const d = await res.json();
  if (!res.ok) { console.error('token refresh failed', JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== rt && ENV_PATH) {
    let x = fs.readFileSync(ENV_PATH, 'utf8');
    x = x.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, `JOBBER_REFRESH_TOKEN=${d.refresh_token}`);
    fs.writeFileSync(ENV_PATH, x);
  }
  return d.access_token;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let TOKEN = null;
async function gql(query, variables, attempt = 0) {
  if (!TOKEN) TOKEN = await getAccessToken();
  const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) headers['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch(GQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const d = await res.json();
  if (d.errors) {
    if (d.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 8) { await sleep(3000 * (attempt + 1)); return gql(query, variables, attempt + 1); }
    console.error(JSON.stringify(d.errors, null, 2)); process.exit(1);
  }
  return d.data;
}

const MIN_DAYS = Number((process.argv.find(a => a.startsWith('--min-days=')) || '--min-days=31').split('=')[1]);
const src = fs.readdirSync(DATA_DIR).filter(f => /_client-open-balances\.json$/.test(f)).sort().pop();
const doc = JSON.parse(fs.readFileSync(path.join(DATA_DIR, src), 'utf8'));
const pool = doc.rows.filter(r => r.oldestDaysPastDue >= MIN_DAYS).sort((a, b) => b.oldestDaysPastDue - a.oldestDaysPastDue);
console.error(`${pool.length} clients at ${MIN_DAYS}+ days from ${src} — re-verifying live…`);

const VERIFY = `query($c:EncodedId!){ invoices(first:50, filter:{clientId:$c}){ nodes{
  invoiceNumber invoiceStatus issuedDate dueDate clientHubUri dateViewedInClientHub
  amounts{ total invoiceBalance } } } }`;

const now = new Date();
const days = d => Math.floor((now - new Date(d)) / 864e5);
const live = [], cleared = [];
for (let i = 0; i < pool.length; i++) {
  const r = pool[i];
  const d = await gql(VERIFY, { c: r.id });
  const open = d.invoices.nodes
    .filter(x => (x.amounts.invoiceBalance || 0) > 0 && x.invoiceStatus !== 'draft' && x.invoiceStatus !== 'paid')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const bal = open.reduce((s, o) => s + o.amounts.invoiceBalance, 0);
  if (!open.length) { cleared.push({ ...r, was: r.openBalance }); }
  else live.push({ ...r, openBalance: bal, oldestDaysPastDue: days(open[0].dueDate), verifiedAt: now.toISOString(),
    invoices: open.map(o => ({ number: o.invoiceNumber, status: o.invoiceStatus, issued: o.issuedDate, due: o.dueDate,
      daysPastDue: days(o.dueDate), balance: o.amounts.invoiceBalance, viewed: o.dateViewedInClientHub, payLink: o.clientHubUri })) });
  process.stderr.write(`  ${i + 1}/${pool.length}\r`);
  await sleep(200);
}
process.stderr.write('\n');

const m = v => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clean = s => String(s).replace(/\s+/g, ' ').trim();
const ph = r => { const p = r.phones.find(x => x.primary) || r.phones[0]; return p ? p.number : '—'; };
const COMMERCIAL = /plaza|storage|\bhoa\b|association|archers|wakefield|rental management|\bllc\b|\binc\b|mill\b|church|school|district/i;

live.sort((a, b) => b.openBalance - a.openBalance);
const org = live.filter(r => COMMERCIAL.test(r.name));
const res = live.filter(r => !COMMERCIAL.test(r.name));

const L = [];
const p = s => L.push(s);
p(`# Collections call list — ${now.toISOString().slice(0, 10)}`);
p('');
p(`**Balances re-verified live at ${now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT.**`);
p('');
p(`**${live.length} clients / ${m(live.reduce((s, r) => s + r.openBalance, 0))}** — everyone ${MIN_DAYS}+ days past due.`);
p('');
p('These are the accounts where the text lane has already had its turn and failed. Most have');
p('never opened an invoice in the client hub, which is why another text is not the answer.');
p('');
if (cleared.length) {
  p(`Paid since the last pull, do not call: ${cleared.map(c => `${clean(c.name)} (${m(c.was)})`).join(', ')}`);
  p('');
}

const table = (title, rows, note) => {
  if (!rows.length) return;
  p(`## ${title} — ${rows.length} clients, ${m(rows.reduce((s, r) => s + r.openBalance, 0))}`);
  p('');
  if (note) { p(note); p(''); }
  p('| Days | Client | Owes | Phone | Card | Last texted | Opened? | Invoices |');
  p('|--:|---|--:|---|:--:|---|:--:|---|');
  for (const r of rows) {
    p(`| ${r.oldestDaysPastDue} | ${clean(r.name)} | **${m(r.openBalance)}** | ${ph(r)} | ${r.cardsOnFile ? `${r.cardsOnFile}` : '—'} | ${r.lastTexted || 'never'} | ${r.invoices.every(i => !i.viewed) ? 'never' : 'yes'} | ${r.invoices.map(i => '#' + i.number).join(', ')} |`);
  }
  p('');
};
table('Residential', res, 'Card count is how many cards are already on file — "can we run the card we have?" is the shortest path on those.');
table('Commercial / HOA / property manager', org, 'These pay on AP and board cycles. Ask for the AP contact, not the money, on the first call.');

p('## Detail');
p('');
for (const r of live) {
  p(`### ${clean(r.name)} — ${m(r.openBalance)}, ${r.oldestDaysPastDue} days`);
  p(`${ph(r)}${r.phones.length > 1 ? ` (also ${r.phones.slice(1).map(x => x.number).join(', ')})` : ''}${r.emails.length ? ' · ' + r.emails.join(', ') : ' · **no email on file — text or phone is the only channel**'}`);
  if (r.address) p(`${r.address}`);
  p(`${r.cardsOnFile ? `**${r.cardsOnFile} card${r.cardsOnFile > 1 ? 's' : ''} on file** — can offer to run it` : 'No card on file'} · ${r.product}${r.autopay ? ' · autopay ON' : ''} · last texted ${r.lastTexted || 'never'}`);
  for (const i of r.invoices) {
    p(`- **#${i.number}** ${m(i.balance)}, due ${i.due.slice(0, 10)}, ${i.daysPastDue} days past due${i.viewed ? '' : ' — never opened'}`);
    if (i.payLink) p(`  ${i.payLink}`);
  }
  p('');
}

const dest = path.join(DATA_DIR, `${now.toISOString().slice(0, 10)}_call-list.md`);
fs.writeFileSync(dest, L.join('\n'));
fs.writeFileSync(path.join(DATA_DIR, `${now.toISOString().slice(0, 10)}_call-list.json`), JSON.stringify({ generatedAt: now.toISOString(), minDays: MIN_DAYS, clients: live, clearedSinceLastPull: cleared }, null, 2));
console.log(`\n${live.length} clients / ${m(live.reduce((s, r) => s + r.openBalance, 0))}${cleared.length ? ` · ${cleared.length} cleared since the pull` : ''}`);
console.log(`wrote ${dest}`);
