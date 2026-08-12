#!/usr/bin/env node
// build-collection-queue.mjs — builds the past-due text send queue, for review.
//
// This script NEVER sends. It produces data/collection-queue.json plus a human-readable
// review sheet at data/collection-queue.md with the exact message each client would receive.
//
// It ALWAYS re-pulls live from Jobber rather than reading a cached file: texting someone who
// paid an hour ago is the single worst outcome of this lane.
//
// Segments (Spencer's spec: 7-day and 11-day triggers, plus the never-chased backlog):
//   7-10 days   -> "gentle"   first nudge
//   11+ days    -> "firmer"   second nudge / backlog catch-up
//   <7 days     -> skipped, normal payment lag (invoices are net-0, so day 1 is not late)
//
// Card-on-file clients additionally get a one-tap option: reply CHARGE and the office runs the
// saved card. That is per-charge authorization for THIS invoice only — it is NOT autopay
// enrolment and must never be described as such (see brief, Lane 3).
//
//   node projects/briefs/jobber-text-automation/scripts/build-collection-queue.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'collection-state.json');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';

const MIN_BALANCE = 1;        // never chase a balance under this
const DAILY_CAP = 40;         // carrier-safety cap per run; the rest roll to the next run

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
async function gql(query, variables, attempt = 0) {
  if (!ACCESS_TOKEN) ACCESS_TOKEN = await getAccessToken();
  const headers = { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) headers['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch(GQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const d = await res.json().catch(() => ({}));
  if (d.errors) {
    if (d.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 10) {
      await sleep(3000 * (attempt + 1));
      return gql(query, variables, attempt + 1);
    }
    console.error('GraphQL errors:', JSON.stringify(d.errors, null, 2));
    process.exit(1);
  }
  return d.data;
}

const PAST_DUE = `
query($n:Int!, $cursor:String) {
  invoices(first:$n, after:$cursor, filter:{status: past_due}, sort:{key: ISSUED_DATE, direction: DESCENDING}) {
    totalCount
    nodes {
      id invoiceNumber dueDate clientHubUri dateViewedInClientHub
      amounts { invoiceBalance }
      client { id firstName lastName name isCompany companyName isArchived phones { number smsAllowed primary description } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

console.error('Re-pulling past-due invoices live…');
const invoices = [];
let cursor = null;
do {
  const d = await gql(PAST_DUE, { n: 50, cursor });
  invoices.push(...d.invoices.nodes);
  cursor = d.invoices.pageInfo.hasNextPage ? d.invoices.pageInfo.endCursor : null;
  if (cursor) await sleep(600);
} while (cursor);
console.error(`  ${invoices.length} past-due invoices`);

const now = new Date();
const dpd = d => Math.floor((now - new Date(d)) / 864e5);

// Commercial / HOA / municipal accounts pay on PO and board cycles, not on a text nudge, and
// they carry the largest balances. Wrong channel and wrong tone — they route to a human list.
const ORG_HINT = /\b(hoa|homeowners|estates?|city of|county|llc|l\.l\.c|inc\b|corp|condos?|condominium|apartments?|association|properties|property|management|mgmt|church|school|district|park|farms?|ranch|golf|club|center|centre)\b/i;
const isOrg = c => Boolean(c?.isCompany) || ORG_HINT.test(c?.name || '') || !(c?.firstName || '').trim();

// ---- suppression, invoice level ----
const skipped = [];
const commercial = [];
const eligible = [];
for (const inv of invoices) {
  const days = dpd(inv.dueDate);
  const bal = inv.amounts.invoiceBalance;
  // A client can have several SMS-allowed numbers and the Jobber thread lives on the PRIMARY,
  // not necessarily the first in the array. Mike Doud (Mobile 401-578-4395 non-primary, Main
  // (206) 295-1604 primary) read as "no conversation" until this was fixed. Keep every
  // SMS-allowed number so the sender can fall back through them.
  const smsPhones = (inv.client?.phones || []).filter(p => p.smsAllowed);
  const phone = smsPhones.find(p => p.primary) || smsPhones[0];
  const why = days < 7 ? `only ${days}d past due (normal lag)`
    : bal < MIN_BALANCE ? `balance ${bal}`
    : inv.client?.isArchived ? 'client archived'
    : !phone ? 'no SMS-allowed phone'
    : null;
  if (why) { skipped.push({ invoiceNumber: inv.invoiceNumber, client: inv.client?.name, why }); continue; }
  if (isOrg(inv.client)) {
    commercial.push({ invoiceNumber: inv.invoiceNumber, client: inv.client?.name, balance: bal, days, link: inv.clientHubUri });
    continue;
  }
  // primary first, then the rest — the sender tries them in order
  const ordered = [phone.number, ...smsPhones.map(p => p.number).filter(n => n !== phone.number)];
  eligible.push({ ...inv, days, bal, phone: phone.number, smsPhones: ordered });
}

// ---- collapse to one message per client ----
const byClient = new Map();
for (const inv of eligible) {
  const k = inv.client.id;
  if (!byClient.has(k)) byClient.set(k, []);
  byClient.get(k).push(inv);
}

// ---- card-on-file lookup (enables the "reply CHARGE" option) ----
const ids = [...byClient.keys()];
const cards = {};
for (let i = 0; i < ids.length; i += 20) {
  const s = ids.slice(i, i + 20);
  const q = 'query {\n' + s.map((id, n) => `  c${n}: paymentMethods(filter:{clientId:"${id}"}) { totalCount }`).join('\n') + '\n}';
  const d = await gql(q);
  s.forEach((id, n) => { cards[id] = d[`c${n}`].totalCount; });
  if (i + 20 < ids.length) await sleep(700);
}

const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { sent: {} };
const usd = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function compose(c) {
  // Only ever greet with a real given name; anything odd degrades to a neutral greeting
  // rather than "Hi -," or addressing an HOA by its first word.
  const raw = (c.firstName || '').replace(/\s+/g, ' ').trim();
  const first = /^[A-Za-z][A-Za-z'’.-]{1,}$/.test(raw) ? raw : null;
  const hi = first ? `Hi ${first}, this is` : 'Hello, this is';
  const link = c.link;
  const amt = usd(c.total);
  const charge = c.hasCard ? ` If you'd like us to run the card we have on file, just reply CHARGE.` : '';

  if (c.count > 1) {
    return `${hi} Got Moles. You have ${c.count} open invoices totaling ${amt}. `
      + `You can view and pay here: ${link}${charge} If you've already paid or have any questions, just reply here. Thanks!`;
  }
  if (c.maxDays <= 10) {
    return `${hi} Got Moles. Just a heads up that your invoice for ${amt} is past due. `
      + `You can view and pay it here: ${link}${charge} If you've already paid or have any questions, just reply here. Thanks!`;
  }
  return `${hi} Got Moles following up on your invoice for ${amt}, now ${c.maxDays} days past due. `
    + `You can pay it here: ${link}${charge} If there's a problem or you've already paid, reply here and we'll get it sorted. Thanks!`;
}

const queue = [];
const heldByState = [];
for (const [clientId, invs] of byClient) {
  invs.sort((a, b) => b.days - a.days);           // oldest first — link to the oldest invoice
  const c = invs[0].client;
  const total = invs.reduce((s, x) => s + x.bal, 0);
  const maxDays = invs[0].days;
  const stage = maxDays <= 10 ? 'day7' : 'day11';

  // one message per client per stage, ever
  const key = `${clientId}:${stage}`;
  if (state.sent[key]) { heldByState.push({ client: c.name, stage, sentAt: state.sent[key] }); continue; }

  const row = {
    clientId, stage, maxDays, total, count: invs.length,
    name: c.name, firstName: c.firstName, phone: invs[0].phone, smsPhones: invs[0].smsPhones,
    hasCard: (cards[clientId] || 0) > 0,
    link: invs[0].clientHubUri,
    neverViewed: invs.every(i => !i.dateViewedInClientHub),
    invoices: invs.map(i => ({ number: i.invoiceNumber, balance: i.bal, days: i.days })),
    stateKey: key,
  };
  row.message = compose(row);
  queue.push(row);
}

queue.sort((a, b) => b.maxDays - a.maxDays || b.total - a.total);
const send = queue.slice(0, DAILY_CAP);
const rolled = queue.slice(DAILY_CAP);

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(path.join(DATA_DIR, 'collection-queue.json'),
  JSON.stringify({ generatedAt: now.toISOString(), dailyCap: DAILY_CAP, send, rolled, commercial, skipped, heldByState }, null, 2));

// ---- review sheet ----
const L = [];
L.push(`# Past-due text queue — ${now.toISOString().slice(0, 16).replace('T', ' ')}`);
L.push('');
L.push(`Generated by \`build-collection-queue.mjs\`. **Nothing has been sent.**`);
L.push('');
L.push(`- eligible clients: **${queue.length}**  (${usd(queue.reduce((s, x) => s + x.total, 0))})`);
L.push(`- sending this run: **${send.length}**  (${usd(send.reduce((s, x) => s + x.total, 0))}) — capped at ${DAILY_CAP}`);
L.push(`- rolling to next run: ${rolled.length}`);
L.push(`- suppressed: ${skipped.length} · already texted at this stage: ${heldByState.length}`);
L.push('');
L.push('| # | Client | Days | Owed | Card | Message |');
L.push('|---|---|---:|---:|:---:|---|');
send.forEach((r, i) => {
  L.push(`| ${i + 1} | ${r.name} | ${r.maxDays} | ${usd(r.total)} | ${r.hasCard ? 'Y' : '—'} | ${r.message.replace(/\|/g, '\\|')} |`);
});
L.push('');
L.push('## Commercial / HOA / municipal — NOT texted, handle by phone or email');
L.push('');
if (!commercial.length) L.push('_none_');
else {
  L.push('| Client | Days | Balance | Invoice |');
  L.push('|---|---:|---:|---|');
  const byOrg = new Map();
  for (const c of commercial) {
    if (!byOrg.has(c.client)) byOrg.set(c.client, { days: 0, bal: 0, link: c.link, n: 0 });
    const o = byOrg.get(c.client);
    o.days = Math.max(o.days, c.days); o.bal += c.balance; o.n++;
  }
  [...byOrg.entries()].sort((a, b) => b[1].bal - a[1].bal)
    .forEach(([name, o]) => L.push(`| ${name} | ${o.days} | ${usd(o.bal)} | ${o.n > 1 ? `${o.n} invoices` : o.link} |`));
}
L.push('');
L.push('## Suppressed');
L.push('');
const reasons = {};
for (const s of skipped) reasons[s.why] = (reasons[s.why] || 0) + 1;
for (const [why, n] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) L.push(`- ${n} — ${why}`);
fs.writeFileSync(path.join(DATA_DIR, 'collection-queue.md'), L.join('\n'));

console.log(`\nQUEUE BUILT — nothing sent\n`);
console.log(`  eligible clients      ${String(queue.length).padStart(4)}   ${usd(queue.reduce((s, x) => s + x.total, 0))}`);
console.log(`  sending this run      ${String(send.length).padStart(4)}   ${usd(send.reduce((s, x) => s + x.total, 0))}`);
console.log(`  rolled to next run    ${String(rolled.length).padStart(4)}`);
console.log(`  commercial (no text)  ${String(new Set(commercial.map(c => c.client)).size).padStart(4)}   ${usd(commercial.reduce((s, x) => s + x.balance, 0))}  -> handle by phone/email`);
console.log(`  suppressed            ${String(skipped.length).padStart(4)}`);
console.log(`  held (already texted) ${String(heldByState.length).padStart(4)}`);
console.log(`\n  review: projects/briefs/jobber-text-automation/data/collection-queue.md\n`);
