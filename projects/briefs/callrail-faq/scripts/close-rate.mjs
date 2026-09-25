// READ-ONLY. Muhammad's true close rate, corrected for the multi-quote-per-lead artifact.
//
//   node projects/briefs/callrail-faq/scripts/close-rate.mjs [--since=YYYY-MM-DD] [--refetch]
//
// The Jobber Salesperson report divides converted quotes by TOTAL quotes. That understates
// anyone who sends a customer two quotes (Quick Fix + TMCP) and lets them pick: the lead can
// only convert once, but it lands in the denominator twice. This groups quotes into
// OPPORTUNITIES (one customer = one opportunity) and reports both.
//
// It also counts two things the quote report cannot see:
//   - quotes sitting `approved` (customer said yes, nobody converted it) — a win scored as a loss
//   - jobs created with NO quote behind them (existing customers booked straight in)

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const API = path.resolve('.claude/skills/tool-jobber/scripts/jobber-api.mjs');
const args = process.argv.slice(2);
const SINCE = (args.find((a) => a.startsWith('--since=')) || '--since=2026-06-01').split('=')[1];
const REFETCH = args.includes('--refetch');
const CACHE_DIR = path.resolve('projects/briefs/callrail-faq/data');
const CACHE = path.join(CACHE_DIR, `close-rate-cache-${SINCE}.json`);

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function gql(q, attempt = 0) {
  try {
    return JSON.parse(execFileSync('node', [API, 'query', q], { maxBuffer: 1 << 28 }).toString());
  } catch (e) {
    const msg = `${e.stderr || ''}${e.stdout || ''}`;
    if (/THROTTLED/i.test(msg) && attempt < 7) {
      const wait = 6000 * 2 ** attempt;
      process.stderr.write(`  throttled — waiting ${wait / 1000}s\n`);
      sleep(wait);
      return gql(q, attempt + 1);
    }
    throw new Error('Jobber query failed: ' + msg.slice(0, 400));
  }
}

function pageAll(root, selection, filter) {
  const out = [];
  let cursor = null;
  for (let p = 0; p < 60; p++) {
    const after = cursor ? `, after: ${JSON.stringify(cursor)}` : '';
    const d = gql(`query { ${root}(first: 100${after}, filter: ${filter}) {
      nodes { ${selection} } pageInfo { hasNextPage endCursor } } }`);
    out.push(...d[root].nodes);
    if (!d[root].pageInfo.hasNextPage) break;
    cursor = d[root].pageInfo.endCursor;
    sleep(1200);
  }
  return out;
}

let data;
if (existsSync(CACHE) && !REFETCH) {
  data = JSON.parse(readFileSync(CACHE, 'utf8'));
  process.stderr.write(`(cached fetch — pass --refetch for live data)\n`);
} else {
  const range = `{ createdAt: { after: "${SINCE}T00:00:00Z" } }`;
  process.stderr.write('fetching quotes…\n');
  const quotes = pageAll('quotes', `
    quoteNumber quoteStatus createdAt transitionedAt sentAt clientHubViewedAt
    salesperson { name { full } }
    client { id name }
    property { id address { street city postalCode } }
    amounts { total }
    linkedCommunications { totalCount }
    lineItems(first: 4) { nodes { name } }`, range);
  process.stderr.write(`  ${quotes.length} quotes\nfetching jobs…\n`);
  const jobs = pageAll('jobs', `
    jobNumber jobStatus createdAt total
    salesperson { name { full } }
    client { id name }
    property { address { street city postalCode } }
    quote { quoteNumber }`, range);
  process.stderr.write(`  ${jobs.length} jobs\n`);
  data = { quotes, jobs, fetchedFor: SINCE };
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE, JSON.stringify(data));
}

const { quotes, jobs } = data;
const who = (x) => x.salesperson?.name?.full || '(unassigned)';
const WON = new Set(['converted', 'approved']);
const OPEN = new Set(['awaiting_response', 'draft']);

// Muhammad wrote two training quotes to himself before going live — not real leads.
const isTrainingTest = (q) => /muhammad/i.test(q.client?.name || '');

// ---------------------------------------------------------------- who is who
const bySalesperson = {};
for (const q of quotes) (bySalesperson[who(q)] ??= []).push(q);
const MO = Object.keys(bySalesperson).find((n) => /muhammad|mohammad|^mo\b/i.test(n));
const SPENCER = Object.keys(bySalesperson).find((n) => /spencer/i.test(n));

// ---------------------------------------------------------------- opportunities
// One customer = one opportunity. Quotes for the same client within 14 days are the same
// decision (the Quick Fix / TMCP pair), so they collapse to a single win-or-lose.
function opportunities(qs) {
  const byClient = new Map();
  for (const q of qs) {
    const k = q.client?.id || q.quoteNumber;
    (byClient.get(k) ?? byClient.set(k, []).get(k)).push(q);
  }
  const opps = [];
  for (const [, list] of byClient) {
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let cur = [];
    for (const q of list) {
      if (!cur.length || (new Date(q.createdAt) - new Date(cur[0].createdAt)) / 86400000 <= 14) cur.push(q);
      else { opps.push(cur); cur = [q]; }
    }
    if (cur.length) opps.push(cur);
  }
  return opps.map((qs2) => ({
    quotes: qs2,
    client: qs2[0].client?.name,
    createdAt: qs2.reduce((m, q) => (q.createdAt < m ? q.createdAt : m), qs2[0].createdAt),
    value: Math.max(...qs2.map((q) => q.amounts?.total || 0)),
    won: qs2.some((q) => WON.has(q.quoteStatus)),
    open: !qs2.some((q) => WON.has(q.quoteStatus)) && qs2.some((q) => OPEN.has(q.quoteStatus)),
  }));
}

const NOW = Date.now();
const ageDays = (iso) => (NOW - new Date(iso).getTime()) / 86400000;
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(0)}%` : '—');

function report(label, qs) {
  const clean = qs.filter((q) => !isTrainingTest(q));
  const opps = opportunities(clean);
  const wonQ = clean.filter((q) => WON.has(q.quoteStatus)).length;
  const wonO = opps.filter((o) => o.won).length;
  const decided = opps.filter((o) => !o.open);
  const wonD = decided.filter((o) => o.won).length;
  const mature = opps.filter((o) => ageDays(o.createdAt) >= 14);
  const wonM = mature.filter((o) => o.won).length;

  console.log(`\n=== ${label} ===`);
  console.log(`  quotes ${qs.length}${qs.length !== clean.length ? ` (${qs.length - clean.length} training tests excluded)` : ''}, opportunities ${opps.length}`);
  console.log(`  QUOTE-LEVEL   (what the Jobber report shows) : ${wonQ}/${clean.length} = ${pct(wonQ, clean.length)}`);
  console.log(`  OPPORTUNITY   (one customer = one decision)  : ${wonO}/${opps.length} = ${pct(wonO, opps.length)}`);
  console.log(`  DECIDED ONLY  (excludes still-open quotes)   : ${wonD}/${decided.length} = ${pct(wonD, decided.length)}`);
  console.log(`  MATURED 14d+  (had time to land)            : ${wonM}/${mature.length} = ${pct(wonM, mature.length)}`);
  const multi = opps.filter((o) => o.quotes.length > 1);
  console.log(`  multi-quote leads: ${multi.length} (${multi.reduce((n, o) => n + o.quotes.length, 0)} quotes for ${multi.length} decisions)`);
  return { opps, clean, multi };
}

console.log(`Close rate — quotes created since ${SINCE}, measured ${new Date().toISOString().slice(0, 10)}`);
console.log(`Won = quoteStatus converted OR approved.`);
console.log(`\nSalespeople on record: ${Object.entries(bySalesperson).map(([n, v]) => `${n} (${v.length})`).join(', ')}`);

const moAll = bySalesperson[MO] || [];
const moRes = report(`${MO} — all time`, moAll);
const spRes = report(`${SPENCER} — all time (baseline)`, bySalesperson[SPENCER] || []);

// Like-for-like: same window, since Muhammad went live
const LIVE = moAll.filter((q) => !isTrainingTest(q)).reduce((m, q) => (q.createdAt < m ? q.createdAt : m), '9999');
const LIVE_DAY = LIVE.slice(0, 10);
console.log(`\n\n######## LIKE-FOR-LIKE — quotes created ${LIVE_DAY} onward ########`);
report(`${MO}`, moAll.filter((q) => q.createdAt >= LIVE));
report(`${SPENCER}`, (bySalesperson[SPENCER] || []).filter((q) => q.createdAt >= LIVE));

// ---------------------------------------------------------------- his multi-quote leads
console.log(`\n\n######## ${MO}'s MULTI-QUOTE LEADS (the artifact) ########`);
for (const o of moRes.multi) {
  console.log(`  ${o.won ? 'WON ' : o.open ? 'OPEN' : 'LOST'}  ${o.client}  —  ${o.quotes.map((q) => `#${q.quoteNumber} $${q.amounts?.total} ${q.quoteStatus}`).join('  |  ')}`);
}

// ---------------------------------------------------------------- quote-less closes
console.log(`\n\n######## CLOSES WITH NO QUOTE (invisible to the quote report) ########`);
const noQuoteJobs = jobs.filter((j) => !j.quote && who(j) === MO);
for (const j of noQuoteJobs) {
  console.log(`  job #${j.jobNumber} ${j.jobStatus} $${j.total} — ${j.client?.name} — ${j.property?.address?.street || ''} (${j.createdAt.slice(0, 10)})`);
}
console.log(`  total: ${noQuoteJobs.length}`);
const unattributed = jobs.filter((j) => !j.quote && who(j) === '(unassigned)');
console.log(`  (plus ${unattributed.length} quote-less jobs with no salesperson set — unattributable)`);

// ---------------------------------------------------------------- open pipeline
console.log(`\n\n######## ${MO}'s LIVE PIPELINE (open, chaseable) ########`);
const open = moRes.opps.filter((o) => o.open).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
let openVal = 0;
for (const o of open) {
  const q = o.quotes[0];
  const viewed = o.quotes.some((x) => x.clientHubViewedAt);
  const touches = Math.max(...o.quotes.map((x) => x.linkedCommunications?.totalCount || 0));
  openVal += o.value;
  console.log(`  ${ageDays(o.createdAt).toFixed(1)}d  $${o.value}  ${o.client}  — ${o.quotes.map((x) => '#' + x.quoteNumber).join(',')}  ${viewed ? 'opened' : 'NEVER OPENED'}  ${touches} touch${touches === 1 ? '' : 'es'}`);
}
console.log(`  ${open.length} open opportunities, $${openVal.toLocaleString()} of pipeline`);
