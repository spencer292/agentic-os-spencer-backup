// READ-ONLY. Two questions:
//   1. What % of first inbound calls convert to TMCP ON THAT CALL — Spencer era vs Muhammad era?
//   2. What % of inbound calls are being taken by CallRail Voice Assist instead of a human?
//
//   node projects/briefs/callrail-faq/scripts/first-call-tmcp.mjs [--refetch]
//
// Method, and why it is built this way:
//   - Attribution is by PERIOD, not by transcript. Muhammad went live 2026-08-07. Every
//     human-answered call before that is Spencer's era, every one after is Muhammad's. This
//     avoids needing a per-call transcript fetch to work out who picked up (~550ms each).
//   - A call "converted on the call" if a quote for a client with that phone number was created
//     between the call starting and 20 minutes after it ended, and that quote later won.
//   - "First call" = the earliest human-answered call of >=90s from a given phone number in the
//     window. Repeat calls from the same number are follow-ups, not first calls.
//
// Never writes to CallRail or Jobber.

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const API = path.resolve('.claude/skills/tool-jobber/scripts/jobber-api.mjs');
const CACHE_DIR = path.resolve('projects/briefs/callrail-faq/data');
const CACHE = path.join(CACHE_DIR, 'first-call-tmcp-cache.json');
const REFETCH = process.argv.includes('--refetch');

for (const line of readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = (process.env.CALLRAIL_API_KEY || '').trim();
const ACCT = 'ACC019dc0126ade7956850fbd40239646af';

const START = '2026-06-01';
const END = '2026-09-01';
const MO_LIVE = '2026-08-07';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const digits = (s) => String(s || '').replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');

// ------------------------------------------------------------------ CallRail

async function callrail(p, params = {}, attempt = 0) {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${KEY}"` } });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 4) throw new Error(`${res.status} on ${p}`);
    await sleep(Math.min(30000, 2000 * 2 ** attempt));
    return callrail(p, params, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} on ${p}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function allCalls() {
  const out = [];
  for (let page = 1; page <= 60; page++) {
    const d = await callrail(`a/${ACCT}/calls.json`, {
      start_date: START, end_date: END, per_page: '250', page: String(page),
      fields: 'recording_duration,tracking_phone_number,tags',
    });
    out.push(...(d.calls || []));
    process.stderr.write(`  callrail page ${page}: ${(d.calls || []).length} (total ${out.length})\n`);
    if (!d.calls || d.calls.length < 250) break;
    await sleep(400);
  }
  return out.map((c) => ({
    id: c.id, start: c.start_time, duration: c.duration || 0,
    direction: c.direction, answered: c.answered,
    name: c.customer_name, phone: digits(c.customer_phone_number),
    tracking: c.tracking_phone_number,
    tags: (c.tags || []).map((t) => t.name),
  }));
}

// -------------------------------------------------------------------- Jobber

function gql(q, attempt = 0) {
  try {
    return JSON.parse(execFileSync('node', [API, 'query', q], { maxBuffer: 1 << 28 }).toString());
  } catch (e) {
    const msg = `${e.stderr || ''}${e.stdout || ''}`;
    if (/THROTTLED/i.test(msg) && attempt < 7) {
      execFileSync(process.execPath, ['-e', `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,${6000 * 2 ** attempt})`]);
      return gql(q, attempt + 1);
    }
    throw new Error('Jobber query failed: ' + msg.slice(0, 400));
  }
}

function allQuotes() {
  const out = [];
  let cursor = null;
  for (let p = 0; p < 60; p++) {
    const after = cursor ? `, after: ${JSON.stringify(cursor)}` : '';
    const d = gql(`query { quotes(first: 50${after}, filter: { createdAt: { after: "${START}T00:00:00Z" } }) {
      nodes {
        quoteNumber quoteStatus createdAt
        salesperson { name { full } }
        client { id name phones { number } }
        amounts { total }
        lineItems(first: 4) { nodes { name } }
      } pageInfo { hasNextPage endCursor } } }`);
    out.push(...d.quotes.nodes);
    process.stderr.write(`  jobber page ${p + 1}: ${out.length} quotes\n`);
    if (!d.quotes.pageInfo.hasNextPage) break;
    cursor = d.quotes.pageInfo.endCursor;
    execFileSync(process.execPath, ['-e', 'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,1200)']);
  }
  return out;
}

// ---------------------------------------------------------------------- run

let data;
if (existsSync(CACHE) && !REFETCH) {
  data = JSON.parse(readFileSync(CACHE, 'utf8'));
  process.stderr.write('(cached — pass --refetch for live data)\n');
} else {
  process.stderr.write('fetching CallRail…\n');
  const calls = await allCalls();
  process.stderr.write(`fetching Jobber quotes…\n`);
  const quotes = allQuotes();
  data = { calls, quotes, fetchedAt: new Date().toISOString() };
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE, JSON.stringify(data));
}

const { calls, quotes } = data;

// ------------------------------------------------- classify who took the call

const VA_TAG = /voice assist/i;
const isVA = (c) => c.tags.some((t) => VA_TAG.test(t));
const inbound = calls.filter((c) => c.direction === 'inbound');

console.log(`CallRail calls ${START} → ${END}: ${calls.length} total, ${inbound.length} inbound`);
console.log(`Jobber quotes in the same window: ${quotes.length}`);
console.log(`Data fetched: ${data.fetchedAt}\n`);

// =========================================================== Q2 — Voice Assist

console.log('='.repeat(78));
console.log('Q2 — HOW MUCH OF THE PHONE IS VOICE ASSIST TAKING?');
console.log('='.repeat(78));

function vaReport(label, list) {
  const n = list.length;
  const va = list.filter(isVA).length;
  const answered = list.filter((c) => c.answered).length;
  // by unique caller: did ANY of that number's calls reach a human?
  const byPhone = new Map();
  for (const c of list) {
    if (!c.phone) continue;
    const e = byPhone.get(c.phone) || { va: 0, human: 0 };
    if (isVA(c)) e.va++; else if (c.answered) e.human++;
    byPhone.set(c.phone, e);
  }
  const callers = [...byPhone.values()];
  const vaOnly = callers.filter((e) => e.va > 0 && e.human === 0).length;
  console.log(`\n${label}`);
  console.log(`  inbound calls              ${n}`);
  console.log(`  answered at all            ${answered} (${((answered / n) * 100).toFixed(0)}%)`);
  console.log(`  tagged Voice Assist        ${va} = ${((va / n) * 100).toFixed(1)}% of all inbound calls`);
  console.log(`  unique caller numbers      ${callers.length}`);
  console.log(`  ...who NEVER reached a human, only the bot:  ${vaOnly} = ${((vaOnly / callers.length) * 100).toFixed(1)}%`);
  return { n, va, callers: callers.length, vaOnly };
}

const moEra = inbound.filter((c) => c.start >= MO_LIVE);
const preMo = inbound.filter((c) => c.start < MO_LIVE);
vaReport(`SPENCER ERA (${START} → ${MO_LIVE})`, preMo);
vaReport(`MUHAMMAD ERA (${MO_LIVE} → ${END})`, moEra);

// business hours only — the window Mo is actually on the phone (9-5 weekdays PT)
const hourPT = (iso) => {
  const s = new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false, weekday: 'short', hour: '2-digit' });
  const wd = s.slice(0, 3);
  const hr = parseInt(s.match(/(\d{2})$/)[1], 10);
  return { wd, hr };
};
const onShift = (c) => {
  const { wd, hr } = hourPT(c.start);
  return !['Sat', 'Sun'].includes(wd) && hr >= 9 && hr < 17;
};
vaReport(`MUHAMMAD ERA — WEEKDAYS 9am-5pm PT ONLY (he is on the phone)`, moEra.filter(onShift));

// per-day breakdown for the Mo era, on shift
console.log(`\n  Per weekday-on-shift breakdown, Muhammad era:`);
const byDay = new Map();
for (const c of moEra.filter(onShift)) {
  const d = new Date(c.start).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const e = byDay.get(d) || { n: 0, va: 0 };
  e.n++; if (isVA(c)) e.va++;
  byDay.set(d, e);
}
for (const [d, e] of [...byDay].sort()) {
  console.log(`    ${d}  ${String(e.n).padStart(3)} calls, ${String(e.va).padStart(3)} Voice Assist = ${String(((e.va / e.n) * 100).toFixed(0)).padStart(3)}%`);
}

// =============================================== Q1 — TMCP on the first call

console.log(`\n${'='.repeat(78)}`);
console.log('Q1 — WHAT SHARE OF FIRST CALLS CLOSE ONTO TMCP, ON THAT CALL?');
console.log('='.repeat(78));

const plan = (q) => {
  const nl = (q.lineItems?.nodes || []).map((n) => n.name).join(' ').toLowerCase();
  if (nl.includes('total mole control')) return 'TMCP';
  if (nl.includes('quick fix')) return 'QF';
  return 'OTHER';
};
const WON = new Set(['converted', 'approved']);

// index quotes by every phone number on the client
const quotesByPhone = new Map();
for (const q of quotes) {
  for (const p of q.client?.phones || []) {
    const d = digits(p.number);
    if (!d) continue;
    if (!quotesByPhone.has(d)) quotesByPhone.set(d, []);
    quotesByPhone.get(d).push(q);
  }
}
console.log(`\nJobber clients indexed by phone: ${quotesByPhone.size} distinct numbers\n`);

// first human-answered call of >=90s from each number
function firstCalls(list) {
  const byPhone = new Map();
  for (const c of list) {
    if (!c.phone || !c.answered || isVA(c) || c.duration < 90) continue;
    const prev = byPhone.get(c.phone);
    if (!prev || c.start < prev.start) byPhone.set(c.phone, c);
  }
  return [...byPhone.values()];
}

const WINDOW_MS = 20 * 60 * 1000;

function q1Report(label, list) {
  const fc = firstCalls(list);
  let tmcp = 0, qf = 0, none = 0, other = 0;
  const examples = { TMCP: [], QF: [] };
  for (const c of fc) {
    const t0 = new Date(c.start).getTime();
    const t1 = t0 + c.duration * 1000 + WINDOW_MS;
    const live = (quotesByPhone.get(c.phone) || []).filter((q) => {
      const t = new Date(q.createdAt).getTime();
      return t >= t0 && t <= t1;
    });
    const wonLive = live.filter((q) => WON.has(q.quoteStatus));
    if (wonLive.some((q) => plan(q) === 'TMCP')) { tmcp++; examples.TMCP.push(c); }
    else if (wonLive.some((q) => plan(q) === 'QF')) { qf++; examples.QF.push(c); }
    else if (wonLive.length) other++;
    else none++;
  }
  const n = fc.length;
  const sold = tmcp + qf + other;
  console.log(`${label}`);
  console.log(`  first calls (human-answered, >=90s, one per number)   ${n}`);
  console.log(`  ...closed a sale ON THAT CALL                        ${sold} = ${((sold / n) * 100).toFixed(1)}%`);
  console.log(`     of which TMCP                                     ${tmcp} = ${((tmcp / n) * 100).toFixed(1)}% of all first calls`);
  console.log(`     of which Quick Fix                                ${qf} = ${((qf / n) * 100).toFixed(1)}% of all first calls`);
  if (other) console.log(`     of which other/unclassified                       ${other}`);
  console.log(`  ...no sale on the call                               ${none} = ${((none / n) * 100).toFixed(1)}%`);
  if (sold) console.log(`  >>> TMCP as a share of first-call sales:             ${tmcp}/${sold} = ${((tmcp / sold) * 100).toFixed(1)}%`);
  console.log('');
  return { n, tmcp, qf, sold, none };
}

const a = q1Report(`SPENCER ERA (${START} → ${MO_LIVE})`, preMo);
const b = q1Report(`MUHAMMAD ERA (${MO_LIVE} → ${END})`, moEra);

console.log('-'.repeat(78));
console.log('SIDE BY SIDE — % of first calls that became a TMCP sale on that call');
console.log(`  Spencer era   ${((a.tmcp / a.n) * 100).toFixed(1)}%   (${a.tmcp} of ${a.n})`);
console.log(`  Muhammad era  ${((b.tmcp / b.n) * 100).toFixed(1)}%   (${b.tmcp} of ${b.n})`);
console.log('-'.repeat(78));
