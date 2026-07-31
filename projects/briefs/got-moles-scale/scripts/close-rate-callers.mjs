// close-rate-callers.mjs — addendum to close-rate-analysis.mjs. Segments every inbound
// caller into EXISTING customer / NEW lead / no-Jobber-record by sweeping the full client
// phone book, then measures the true new-lead booking rate. Read-only.
//   node projects/briefs/got-moles-scale/scripts/close-rate-callers.mjs [--call-from 2026-05-01]
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const briefDir = path.resolve(here, '..');
const env = {};
for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
function die(msg) { console.error('FATAL: ' + msg); process.exit(1); }
const args = process.argv.slice(2);
const argVal = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const CALL_FROM = argVal('--call-from', '2026-05-01');
const TZ = 'America/Los_Angeles';
const ptDate = (i) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(i));
const ptMonth = (i) => ptDate(i).slice(0, 7);
const today = ptDate(new Date().toISOString());

const cacheDir = path.join(briefDir, 'data');
const cacheFile = readdirSync(cacheDir).filter((f) => f.startsWith('_close-rate-cache_')).sort().pop();
if (!cacheFile) die('run close-rate-analysis.mjs first (no cache found)');
const { quotes, jobs, calls } = JSON.parse(readFileSync(path.join(cacheDir, cacheFile), 'utf8'));
console.log(`Using ${cacheFile}: ${jobs.length} jobs, ${calls.length} calls, ${quotes.length} quotes`);

// ---------- Jobber ----------
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
let tok = null;
async function accessToken() {
  if (tok) return tok;
  const e = {};
  for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/); if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: e.JOBBER_CLIENT_ID, client_secret: e.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: e.JOBBER_REFRESH_TOKEN }) });
  const d = await res.json();
  if (!res.ok) die('token refresh failed ' + res.status);
  if (d.refresh_token && d.refresh_token !== e.JOBBER_REFRESH_TOKEN) {
    writeFileSync(path.join(root, '.env'), readFileSync(path.join(root, '.env'), 'utf8').replace(/^JOBBER_REFRESH_TOKEN=.*$/m, `JOBBER_REFRESH_TOKEN=${d.refresh_token}`));
  }
  tok = d.access_token; return tok;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function gql(q, v, attempt = 0) {
  const t = await accessToken();
  const h = { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) h['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch(GQL_URL, { method: 'POST', headers: h, body: JSON.stringify({ query: q, variables: v }) });
  const d = await res.json().catch(() => ({}));
  if ((res.status === 429 || d.errors?.some((e) => e.extensions?.code === 'THROTTLED')) && attempt < 12) { await sleep(Math.min(8000 * (attempt + 1), 60000)); return gql(q, v, attempt + 1); }
  if (res.status === 401 && attempt < 2) { tok = null; return gql(q, v, attempt + 1); }
  const fatal = (d.errors || []).filter((e) => !/hidden due to permissions/i.test(e.message || ''));
  if (!res.ok || fatal.length) die('GQL ' + res.status + ' ' + JSON.stringify(fatal).slice(0, 300));
  return d.data;
}

const bookFile = path.join(cacheDir, `_client-phonebook_${today}.json`);
let book;
if (existsSync(bookFile)) { book = JSON.parse(readFileSync(bookFile, 'utf8')); console.log(`phonebook cache: ${book.length} clients`); }
else {
  book = []; let cursor = null;
  for (;;) {
    const d = await gql(`query($after:String){ clients(first:100, after:$after){ nodes{ id createdAt phones{ number } } pageInfo{ hasNextPage endCursor } } }`, { after: cursor });
    book.push(...d.clients.nodes);
    process.stdout.write(`\r  phonebook: ${book.length}...   `);
    if (!d.clients.pageInfo.hasNextPage) break;
    cursor = d.clients.pageInfo.endCursor; await sleep(200);
  }
  console.log('');
  mkdirSync(cacheDir, { recursive: true }); writeFileSync(bookFile, JSON.stringify(book));
}

// ---------- segment ----------
const digits = (s) => String(s || '').replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');
const phoneToClient = new Map();
for (const c of book) for (const p of (c.phones || [])) {
  const d = digits(p.number); if (d.length < 10) continue;
  const prev = phoneToClient.get(d);
  if (!prev || new Date(c.createdAt) < new Date(prev.createdAt)) phoneToClient.set(d, c); // oldest record wins
}
const jobByPhone = new Map();
for (const j of jobs) for (const p of (j.client?.phones || [])) {
  const d = digits(p.number); if (d.length < 10) continue;
  if (!jobByPhone.has(d)) jobByPhone.set(d, []); jobByPhone.get(d).push(j);
}

const inbound = calls.filter((c) => String(c.direction || '').includes('inbound'));
const callers = new Map(); // phone -> {calls:[], firstCallDate}
for (const c of inbound) {
  const d = digits(c.customer_phone_number); if (d.length < 10) continue;
  if (!callers.has(d)) callers.set(d, []);
  callers.get(d).push(c);
}
const TMC_RE = /total mole control|tmcp|year.?round|annual mole control|(?:[2-9]|\d\d+)\s*month of mole control/i;
const QF_RE = /quick fix|1\s*month of mole control|month of mole control/i;
const cls = (o) => { const s = (o.lineItems?.nodes || []).map((l) => l.name || '').join(' ') + ' ' + (o.title || ''); return TMC_RE.test(s) ? 'TMC' : QF_RE.test(s) ? 'QF' : 'other'; };
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '—');

const out = []; const say = (s = '') => { out.push(s); console.log(s); };

const rows = [];
for (const [phone, cs] of callers) {
  const client = phoneToClient.get(phone);
  const firstAt = cs.map((c) => c.start_time).sort()[0];
  const seg = !client ? 'no-record'
    : ptDate(client.createdAt) < CALL_FROM ? 'existing'
    : 'new-in-window';
  const js = jobByPhone.get(phone) || [];
  rows.push({ phone, seg, firstAt, month: ptMonth(firstAt), nCalls: cs.length,
    answered: cs.some((c) => c.answered !== false), maxDur: Math.max(...cs.map((c) => c.duration || 0)),
    jobs: js, won: js.length > 0, kinds: [...new Set(js.map(cls))] });
}

say(`\n================ CALLER SEGMENTATION (${CALL_FROM} → ${today}) ================`);
say(`Jobber client phone book: ${book.length} clients, ${phoneToClient.size} distinct phone numbers`);
say(`Unique inbound callers in window: ${rows.length}\n`);
say('segment          callers   %ofcallers   with a job   book rate');
for (const s of ['existing', 'new-in-window', 'no-record']) {
  const a = rows.filter((r) => r.seg === s);
  const w = a.filter((r) => r.won).length;
  say(`${s.padEnd(16)} ${String(a.length).padStart(6)}   ${pct(a.length, rows.length).padStart(9)}   ${String(w).padStart(9)}   ${pct(w, a.length).padStart(8)}`);
}
const newLeads = rows.filter((r) => r.seg !== 'existing');
const nlWon = newLeads.filter((r) => r.won).length;
say(`\nNEW LEADS (new-in-window + no-record) = ${newLeads.length} callers, ${nlWon} booked a job = ${pct(nlWon, newLeads.length)}`);

// quality filters
const real = newLeads.filter((r) => r.answered && r.maxDur >= 30);
say(`Filtered to answered + ≥30s conversation: ${real.length} callers, ${real.filter((r) => r.won).length} booked = ${pct(real.filter((r) => r.won).length, real.length)}`);

say('\nBy month of first call (maturity matters — July callers may still convert):');
say('month     newleads  booked   rate     (answered ≥30s only)  booked   rate');
for (const m of [...new Set(newLeads.map((r) => r.month))].sort()) {
  const a = newLeads.filter((r) => r.month === m); const b = a.filter((r) => r.answered && r.maxDur >= 30);
  say(`${m}   ${String(a.length).padStart(8)}  ${String(a.filter((r) => r.won).length).padStart(6)}  ${pct(a.filter((r) => r.won).length, a.length).padStart(6)}          ${String(b.length).padStart(10)}  ${String(b.filter((r) => r.won).length).padStart(6)}  ${pct(b.filter((r) => r.won).length, b.length).padStart(6)}`);
}

say('\nExisting-customer calls (service/billing/rebook traffic, not new sales):');
const ex = rows.filter((r) => r.seg === 'existing');
say(`  ${ex.length} callers / ${ex.reduce((s, r) => s + r.nCalls, 0)} calls = ${pct(ex.reduce((s, r) => s + r.nCalls, 0), inbound.length)} of all inbound call volume`);

say('\nProduct booked by NEW-LEAD callers:');
const kinds = { QF: 0, TMC: 0, other: 0 };
for (const r of newLeads.filter((x) => x.won)) for (const j of r.jobs) kinds[cls(j)]++;
const tot = kinds.QF + kinds.TMC + kinds.other;
for (const k of ['QF', 'TMC', 'other']) say(`  ${k.padEnd(6)} ${String(kinds[k]).padStart(4)}  ${pct(kinds[k], tot)}`);
say(`  QF vs TMC among classified: QF ${pct(kinds.QF, kinds.QF + kinds.TMC)} / TMC ${pct(kinds.TMC, kinds.QF + kinds.TMC)}`);

// unmatched jobs: how many jobs did NOT come from a tracked call
const matchedJobNums = new Set(rows.flatMap((r) => r.jobs.map((j) => j.jobNumber)));
say(`\nJobs created in window: ${jobs.length} | traceable to a tracked inbound call: ${matchedJobNums.size} (${pct(matchedJobNums.size, jobs.length)})`);
const untracedBySource = {};
for (const j of jobs) if (!matchedJobNums.has(j.jobNumber)) untracedBySource[j.source || 'null'] = (untracedBySource[j.source || 'null'] || 0) + 1;
say('Untraced jobs by source (existing customers, web forms, manual adds):');
for (const [k, n] of Object.entries(untracedBySource).sort((a, b) => b[1] - a[1])) say(`  ${String(k).padEnd(18)} ${String(n).padStart(4)}`);

writeFileSync(path.join(briefDir, `${today}_caller-segmentation.txt`), out.join('\n'));
console.log(`\nSaved -> ${path.join(briefDir, `${today}_caller-segmentation.txt`)}`);
