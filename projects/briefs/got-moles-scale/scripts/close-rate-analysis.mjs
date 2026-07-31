// close-rate-analysis.mjs — Got Moles sales funnel: quote close rate, call→job rate,
// and the Quick Fix vs Total Mole Control mix. Read-only (Jobber GraphQL + CallRail v3).
//   node projects/briefs/got-moles-scale/scripts/close-rate-analysis.mjs [--months 12] [--call-from 2026-05-01] [--cache]
// Reads JOBBER_* and CALLRAIL_API_KEY from repo-root .env. Never prints secrets.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
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
const CALLRAIL = env.CALLRAIL_API_KEY || env.CALLRAIL_API_TOKEN || env.CALLRAIL_TOKEN;
function die(msg) { console.error('FATAL: ' + msg); process.exit(1); }
if (!CALLRAIL) die('CallRail key missing from .env');

const args = process.argv.slice(2);
const argVal = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const USE_CACHE = args.includes('--cache');
const MONTHS = Number(argVal('--months', 12));
const CALL_FROM = argVal('--call-from', '2026-05-01');

const TZ = 'America/Los_Angeles';
const ptDate = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
const ptMonth = (iso) => ptDate(iso).slice(0, 7);
const today = ptDate(new Date().toISOString());
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const quoteFrom = (() => { const d = new Date(today + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - MONTHS); return d.toISOString().slice(0, 10); })();
const iso = (d) => new Date(d + 'T00:00:00-07:00').toISOString();

// ---------- Jobber ----------
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
let jobberToken = null;
async function jobberAccessToken() {
  if (jobberToken) return jobberToken;
  const envNow = {};
  for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) envNow[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: envNow.JOBBER_CLIENT_ID, client_secret: envNow.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: envNow.JOBBER_REFRESH_TOKEN }),
  });
  const d = await res.json();
  if (!res.ok) die(`Jobber token refresh failed HTTP ${res.status}`);
  if (d.refresh_token && d.refresh_token !== envNow.JOBBER_REFRESH_TOKEN) {
    let text = readFileSync(path.join(root, '.env'), 'utf8');
    writeFileSync(path.join(root, '.env'), text.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, `JOBBER_REFRESH_TOKEN=${d.refresh_token}`));
  }
  jobberToken = d.access_token;
  return jobberToken;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function gql(query, variables, attempt = 0) {
  const token = await jobberAccessToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) headers['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch(GQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const data = await res.json().catch(() => ({}));
  const throttled = data.errors?.some((e) => e.extensions?.code === 'THROTTLED');
  if ((res.status === 429 || throttled) && attempt < 12) { await sleep(Math.min(8000 * (attempt + 1), 60000)); return gql(query, variables, attempt + 1); }
  if (res.status === 401 && attempt < 2) { jobberToken = null; return gql(query, variables, attempt + 1); }
  // partial "hidden due to permissions" errors still carry good data — only fail on real errors
  const fatal = (data.errors || []).filter((e) => !/hidden due to permissions/i.test(e.message || ''));
  if (!res.ok || fatal.length) die(`Jobber GQL failed: HTTP ${res.status} ${JSON.stringify(fatal).slice(0, 400)}`);
  return data.data;
}
async function sweep(connection, queryFn, label) {
  const out = []; let cursor = null;
  for (;;) {
    const d = await queryFn(cursor);
    const conn = d[connection];
    out.push(...conn.nodes);
    process.stdout.write(`\r  ${label}: ${out.length}${conn.pageInfo.hasNextPage ? '...' : ''}   `);
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
    await sleep(200);
  }
  console.log('');
  return out;
}

const crApi = async (p, params) => {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${CALLRAIL}"` } });
  if (!res.ok) die(`CallRail ${res.status} on ${p}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
};

async function pullAll() {
  console.log(`Pulling Jobber (quotes from ${quoteFrom}, jobs/clients from ${CALL_FROM})…`);
  const quotes = await sweep('quotes', (after) => gql(
    `query($after:String){ quotes(first:50, after:$after, filter:{ createdAt:{ after:"${iso(quoteFrom)}" } }){
       nodes{ quoteNumber createdAt sentAt transitionedAt quoteStatus amounts{ total } client{ id } lineItems(first:15){ nodes{ name } } }
       pageInfo{ hasNextPage endCursor } } }`, { after }), 'quotes');

  const jobs = await sweep('jobs', (after) => gql(
    `query($after:String){ jobs(first:25, after:$after, filter:{ createdAt:{ after:"${iso(CALL_FROM)}" } }){
       nodes{ jobNumber createdAt jobType jobStatus total source quote{ quoteNumber } client{ id name phones{ number } } lineItems(first:15){ nodes{ name totalPrice } } }
       pageInfo{ hasNextPage endCursor } } }`, { after }), 'jobs created');

  const clients = await sweep('clients', (after) => gql(
    `query($after:String){ clients(first:100, after:$after, filter:{ createdAt:{ after:"${iso(CALL_FROM)}" } }){
       nodes{ id createdAt isLead phones{ number } }
       pageInfo{ hasNextPage endCursor } } }`, { after }), 'clients created');

  console.log('Pulling CallRail…');
  const acct = (await crApi('a.json', {})).accounts[0].id;
  const calls = [];
  for (let page = 1; ; page++) {
    const d = await crApi(`a/${acct}/calls.json`, {
      start_date: CALL_FROM, end_date: today, per_page: 250, page,
      fields: 'answered,direction,start_time,duration,first_call,prior_calls,customer_phone_number,source,source_name,tracker_id,lead_status,tags,call_disposition,spam,value',
    });
    calls.push(...(d.calls || []));
    process.stdout.write(`\r  calls: ${calls.length}   `);
    if (!d.calls?.length || page >= (d.total_pages || 1)) break;
    await sleep(400);
  }
  console.log('');
  return { quotes, jobs, clients, calls };
}

const cacheFile = path.join(briefDir, 'data', `_close-rate-cache_${quoteFrom}_${CALL_FROM}_${today}.json`);
let raw;
if (USE_CACHE && existsSync(cacheFile)) { raw = JSON.parse(readFileSync(cacheFile, 'utf8')); console.log('Using cache ' + path.relative(root, cacheFile)); }
else { raw = await pullAll(); mkdirSync(path.dirname(cacheFile), { recursive: true }); writeFileSync(cacheFile, JSON.stringify(raw)); }
const { quotes, jobs, clients, calls } = raw;

// ---------- classification ----------
// Quotes and jobs name the same two products differently: the Quick Fix is written as
// "The Quick Fix" on jobs but "1 Month of Mole Control Service" on most quotes.
// "1 Month of Mole Control Service" is the Quick Fix; only multi-month/annual are program work.
const TMC_RE = /total mole control|tmcp|year.?round|annual mole control|(?:[2-9]|\d\d+)\s*month of mole control/i;
const QF_RE = /quick fix|1\s*month of mole control|month of mole control/i;
const lines = (o) => (o.lineItems?.nodes || []).map((li) => li.name || '').join(' | ');
const cls = (o) => { const s = lines(o) + ' ' + (o.title || ''); return TMC_RE.test(s) ? 'TMC' : QF_RE.test(s) ? 'QF' : 'other'; };
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '—');
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

// ---------- 1. QUOTE CLOSE RATE ----------
say(`\n================ 1. QUOTE CLOSE RATE (quotes created ${quoteFrom} → ${today}) ================`);
const byStatus = {};
for (const q of quotes) byStatus[q.quoteStatus] = (byStatus[q.quoteStatus] || 0) + 1;
say('\nQuote status mix (all ' + quotes.length + '):');
for (const [s, n] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) say(`  ${s.padEnd(20)} ${String(n).padStart(5)}  ${pct(n, quotes.length)}`);

const WON = new Set(['converted', 'approved']);
const DEAD = new Set(['archived']);
const OPEN = new Set(['draft', 'awaiting_response', 'changes_requested']);

// Cohort close rate by month created; a quote is "decided" if won or archived.
say('\nBy month created (cohort — excludes drafts):');
say('month     sent  won  lost  open   close%   won $        quoted $     $close%');
const months = [...new Set(quotes.map((q) => ptMonth(q.createdAt)))].sort();
const rowFor = (qs) => {
  const sent = qs.filter((q) => q.quoteStatus !== 'draft');
  const won = sent.filter((q) => WON.has(q.quoteStatus));
  const lost = sent.filter((q) => DEAD.has(q.quoteStatus));
  const open = sent.filter((q) => OPEN.has(q.quoteStatus));
  const $ = (a) => a.reduce((s, q) => s + (q.amounts?.total || 0), 0);
  return { sent, won, lost, open, wonV: $(won), sentV: $(sent) };
};
for (const m of months) {
  const r = rowFor(quotes.filter((q) => ptMonth(q.createdAt) === m));
  say(`${m}  ${String(r.sent.length).padStart(4)} ${String(r.won.length).padStart(4)} ${String(r.lost.length).padStart(5)} ${String(r.open.length).padStart(5)}  ${pct(r.won.length, r.sent.length).padStart(6)}  ${money(r.wonV).padStart(10)}  ${money(r.sentV).padStart(11)}  ${pct(r.wonV, r.sentV).padStart(6)}`);
}
const all = rowFor(quotes);
say(`ALL       ${String(all.sent.length).padStart(4)} ${String(all.won.length).padStart(4)} ${String(all.lost.length).padStart(5)} ${String(all.open.length).padStart(5)}  ${pct(all.won.length, all.sent.length).padStart(6)}  ${money(all.wonV).padStart(10)}  ${money(all.sentV).padStart(11)}  ${pct(all.wonV, all.sentV).padStart(6)}`);
// decided-only (drop still-open quotes from the denominator)
const decided = all.won.length + all.lost.length;
say(`\nDecided-only close rate (won / (won+lost), ignores ${all.open.length} still-open): ${pct(all.won.length, decided)}`);
// mature cohort: quotes created 30+ days ago
const mature = rowFor(quotes.filter((q) => ptDate(q.createdAt) <= addDays(today, -30)));
say(`Mature cohort (created 30+ days ago, ${mature.sent.length} quotes): ${pct(mature.won.length, mature.sent.length)} of sent | ${pct(mature.won.length, mature.won.length + mature.lost.length)} of decided`);

// close rate by product
say('\nBy product (all quotes sent in window):');
say('product   sent  won  close%   won $        avg won $');
for (const p of ['QF', 'TMC', 'other']) {
  const r = rowFor(quotes.filter((q) => cls(q) === p));
  say(`${p.padEnd(8)} ${String(r.sent.length).padStart(5)} ${String(r.won.length).padStart(4)}  ${pct(r.won.length, r.sent.length).padStart(6)}  ${money(r.wonV).padStart(10)}  ${money(r.won.length ? r.wonV / r.won.length : 0).padStart(9)}`);
}

// ---------- 2. HOW JOBS ARE ACTUALLY SOLD ----------
say(`\n================ 2. JOBS CREATED ${CALL_FROM} → ${today} ================`);
const jobsWin = jobs.filter((j) => ptDate(j.createdAt) >= CALL_FROM);
const bySource = {};
for (const j of jobsWin) bySource[j.source || 'null'] = (bySource[j.source || 'null'] || 0) + 1;
say(`\nTotal jobs created: ${jobsWin.length}`);
say('How the job was created (job.source):');
for (const [s, n] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) say(`  ${String(s).padEnd(18)} ${String(n).padStart(5)}  ${pct(n, jobsWin.length)}`);
const fromQuote = jobsWin.filter((j) => j.quote).length;
say(`\nJobs with a linked quote: ${fromQuote} (${pct(fromQuote, jobsWin.length)}) — the rest were booked without ever creating a quote.`);

// ---------- 3. CALLS → JOB ----------
say(`\n================ 3. CALLS → JOB (${CALL_FROM} → ${today}) ================`);
const digits = (s) => String(s || '').replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');
const inbound = calls.filter((c) => String(c.direction || '').includes('inbound'));
const answered = inbound.filter((c) => c.answered !== false);
const firstTime = inbound.filter((c) => c.first_call === true);
const uniqCallers = new Set(inbound.map((c) => digits(c.customer_phone_number)).filter(Boolean));
const uniqFirstTime = new Set(firstTime.map((c) => digits(c.customer_phone_number)).filter(Boolean));
say(`\nInbound calls: ${inbound.length} | answered ${answered.length} (${pct(answered.length, inbound.length)}) | missed ${inbound.length - answered.length} (${pct(inbound.length - answered.length, inbound.length)})`);
say(`Unique inbound phone numbers: ${uniqCallers.size} | flagged first-time callers: ${firstTime.length} calls from ${uniqFirstTime.size} unique numbers`);
const tally = (arr, key) => { const t = {}; for (const c of arr) t[c[key] ?? 'null'] = (t[c[key] ?? 'null'] || 0) + 1; return Object.entries(t).sort((a, b) => b[1] - a[1]); };
say('\nCallRail lead_status on inbound calls (how the office/AI tagged them):');
for (const [k, n] of tally(inbound, 'lead_status')) say(`  ${String(k).padEnd(20)} ${String(n).padStart(5)}  ${pct(n, inbound.length)}`);
say('\nCall source (inbound):');
for (const [k, n] of tally(inbound, 'source').slice(0, 10)) say(`  ${String(k).padEnd(28)} ${String(n).padStart(5)}  ${pct(n, inbound.length)}`);
const spam = inbound.filter((c) => c.spam === true).length;
const short = inbound.filter((c) => (c.duration || 0) < 30).length;
say(`\nSpam-flagged: ${spam} (${pct(spam, inbound.length)}) | under 30 seconds: ${short} (${pct(short, inbound.length)})`);

// phone match: caller number → a job created in the window
const jobPhone = new Map(); // digits -> [jobs]
for (const j of jobsWin) for (const p of (j.client?.phones || [])) {
  const d = digits(p.number); if (!d) continue;
  if (!jobPhone.has(d)) jobPhone.set(d, []); jobPhone.get(d).push(j);
}
const clientPhone = new Set();
for (const c of clients) for (const p of (c.phones || [])) { const d = digits(p.number); if (d) clientPhone.add(d); }

const matchedAll = [...uniqCallers].filter((d) => jobPhone.has(d));
const matchedFirst = [...uniqFirstTime].filter((d) => jobPhone.has(d));
const newClientCallers = [...uniqCallers].filter((d) => clientPhone.has(d));
say(`\nUnique callers that map to a job created in the window: ${matchedAll.length} / ${uniqCallers.size} = ${pct(matchedAll.length, uniqCallers.size)}`);
say(`Unique FIRST-TIME callers that map to a job created in the window: ${matchedFirst.length} / ${uniqFirstTime.size} = ${pct(matchedFirst.length, uniqFirstTime.size)}`);
say(`Unique callers that became a NEW CLIENT record in the window: ${newClientCallers.length} / ${uniqCallers.size} = ${pct(newClientCallers.length, uniqCallers.size)}`);
say(`Raw call→job rate (jobs created / inbound calls): ${jobsWin.length} / ${inbound.length} = ${pct(jobsWin.length, inbound.length)}`);

// product mix of phone-matched jobs
const matchedJobs = [...new Set(matchedAll.flatMap((d) => jobPhone.get(d)))];
const mixOf = (arr, label) => {
  const c = { QF: 0, TMC: 0, other: 0 }; const v = { QF: 0, TMC: 0, other: 0 };
  for (const j of arr) { const k = cls(j); c[k]++; v[k] += j.total || 0; }
  say(`\n${label} (n=${arr.length}):`);
  for (const k of ['QF', 'TMC', 'other']) say(`  ${k.padEnd(6)} ${String(c[k]).padStart(4)}  ${pct(c[k], arr.length).padStart(6)}   value ${money(v[k])}`);
  const known = c.QF + c.TMC;
  say(`  QF vs TMC among classified only (n=${known}): QF ${pct(c.QF, known)} / TMC ${pct(c.TMC, known)}`);
  return c;
};

// ---------- 4. QF vs TMC MIX ----------
say(`\n================ 4. QUICK FIX vs TOTAL MOLE CONTROL ================`);
mixOf(jobsWin, 'All jobs created in window');
mixOf(matchedJobs, 'Jobs traced back to a tracked inbound call');
const wonQuotes = quotes.filter((q) => WON.has(q.quoteStatus) && ptDate(q.createdAt) >= CALL_FROM);
mixOf(wonQuotes.map((q) => ({ lineItems: q.lineItems, total: q.amounts?.total || 0 })), 'Won quotes created in window');

// monthly job mix trend
say('\nMonthly job mix (created):');
say('month      total    QF   TMC  other   QF%(classified)');
for (const m of [...new Set(jobsWin.map((j) => ptMonth(j.createdAt)))].sort()) {
  const a = jobsWin.filter((j) => ptMonth(j.createdAt) === m);
  const c = { QF: 0, TMC: 0, other: 0 }; for (const j of a) c[cls(j)]++;
  say(`${m}   ${String(a.length).padStart(6)} ${String(c.QF).padStart(5)} ${String(c.TMC).padStart(5)} ${String(c.other).padStart(6)}   ${pct(c.QF, c.QF + c.TMC).padStart(6)}`);
}

// unclassified sample so the "other" bucket is auditable
const others = jobsWin.filter((j) => cls(j) === 'other');
if (others.length) {
  say(`\n"other" job line items (${others.length} jobs, top 15 distinct):`);
  const tally = {};
  for (const j of others) { const k = lines(j) || `(no line items) title="${j.title || ''}"`; tally[k] = (tally[k] || 0) + 1; }
  for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 15)) say(`  ${String(n).padStart(3)}x  ${k.slice(0, 110)}`);
}

const reportFile = path.join(briefDir, `${today}_close-rate-and-mix.txt`);
writeFileSync(reportFile, out.join('\n'));
console.log(`\nSaved raw output -> ${reportFile}`);
