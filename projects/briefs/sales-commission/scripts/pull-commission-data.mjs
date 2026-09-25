#!/usr/bin/env node
// Pull a month of Jobber invoices + their jobs + originating quotes, so the
// salesperson chain (quote -> job -> invoice) can be audited and commission totalled.
//
// Usage: node pull-commission-data.mjs [YYYY-MM]   (default: previous complete month)

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const API = path.join(ROOT, '.claude/skills/tool-jobber/scripts/jobber-api.mjs');
const OUT = path.resolve(HERE, '../data');

function monthArg() {
  const a = process.argv.slice(2).find(x => /^\d{4}-\d{2}$/.test(x));
  if (a && /^\d{4}-\d{2}$/.test(a)) return a;
  const d = new Date();
  d.setDate(1); d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
const MONTH = monthArg();
const [Y, M] = MONTH.split('-').map(Number);

// Got Moles runs on Pacific time. Filtering the month in UTC shifts the window
// seven hours early, which sweeps the previous month's overnight recurring-invoice
// batch in and pushes this month's batch out — hundreds of invoices either way.
// Boundaries must be local midnight, expressed as the matching UTC instant.
const TZ = 'America/Los_Angeles';
function tzOffsetMinutes(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  return (asUTC - date.getTime()) / 60000;
}
function localMidnightUTC(y, m, d) {
  let ms = Date.UTC(y, m - 1, d, 8);            // start from a PST guess
  for (let i = 0; i < 3; i++) ms = Date.UTC(y, m - 1, d) - tzOffsetMinutes(new Date(ms)) * 60000;
  return new Date(ms).toISOString();
}
const START = localMidnightUTC(Y, M, 1);
const END = localMidnightUTC(M === 12 ? Y + 1 : Y, M === 12 ? 1 : M + 1, 1);
process.stderr.write(`${MONTH} in ${TZ}: ${START} -> ${END}
`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Jobber enforces a leaky-bucket query-COST budget on top of request count, so a
// wide nested query throttles long before 2,500 req/5min. Back off and retry.
async function gql(query, attempt = 0) {
  let out;
  try {
    out = execFileSync('node', [API, 'query', query], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const throttled = /THROTTLED|Throttled/.test(out);
  if (throttled) {
    if (attempt >= 8) throw new Error('Throttled 8 times in a row — stop and retry later.');
    const wait = 5000 * (attempt + 1);
    process.stderr.write(`
  throttled, waiting ${wait / 1000}s...`);
    await sleep(wait);
    return gql(query, attempt + 1);
  }
  let parsed;
  try { parsed = JSON.parse(out); } catch { throw new Error('Non-JSON from API: ' + out.slice(0, 500)); }
  if (parsed.errors) throw new Error(JSON.stringify(parsed.errors).slice(0, 800));
  return parsed;
}

const INVOICE_PAGE = (after) => `{
  invoices(first: 20${after ? `, after: "${after}"` : ''}, filter: {issuedDate: {after: "${START}", before: "${END}"}}) {
    totalCount
    pageInfo { hasNextPage endCursor }
    nodes {
      id invoiceNumber issuedDate invoiceStatus subject
      amounts { total subtotal paymentsTotal depositAmount discountAmount invoiceBalance tipsTotal }
      salesperson { id name { full } }
      client { id name }
      lineItems(first: 5) { nodes { name } }
      jobs(first: 5) {
        nodes {
          id jobNumber title jobType total createdAt
          salesperson { id name { full } }
          lineItems(first: 5) { nodes { name } }
          quote {
            id quoteNumber quoteStatus createdAt
            salesperson { id name { full } }
          }
        }
      }
    }
  }
}`;

// Quotes approved/converted inside the month — the other side of the audit:
// a sale made this month whose downstream job/invoice may have lost the seller.
const QUOTE_PAGE = (after) => `{
  quotes(first: 20${after ? `, after: "${after}"` : ''}, filter: {createdAt: {after: "${START}", before: "${END}"}}) {
    totalCount
    pageInfo { hasNextPage endCursor }
    nodes {
      id quoteNumber quoteStatus createdAt amounts { total }
      salesperson { id name { full } }
      client { id name }
      lineItems(first: 5) { nodes { name } }
      jobs(first: 5) { nodes { id jobNumber salesperson { id name { full } } } }
    }
  }
}`;


// Jobs CREATED in the month — the "sold this month" number the bonus tiers key off.
// An invoice sweep alone misses a job sold in the month that has not billed yet.
const JOB_PAGE = (after) => `{
  jobs(first: 20${after ? `, after: "${after}"` : ''}, filter: {createdAt: {after: "${START}", before: "${END}"}}) {
    totalCount
    pageInfo { hasNextPage endCursor }
    nodes {
      id jobNumber title jobType total createdAt jobStatus
      salesperson { id name { full } }
      client { id name }
      lineItems(first: 5) { nodes { name } }
      quote { id quoteNumber salesperson { id name { full } } }
    }
  }
}`;

// Light sweep used by --tips-only to backfill tips onto a pull made before
// tipsTotal was requested. Invoice number + tip only, so it is cheap.
const TIPS_PAGE = (after) => `{
  invoices(first: 100${after ? `, after: "${after}"` : ''}, filter: {issuedDate: {after: "${START}", before: "${END}"}}) {
    totalCount
    pageInfo { hasNextPage endCursor }
    nodes { invoiceNumber amounts { tipsTotal } }
  }
}`;

async function pageAll(label, key, builder) {
  const nodes = [];
  let after = null, total = null, page = 0;
  for (;;) {
    const data = (await gql(builder(after)))[key];
    if (total === null) { total = data.totalCount; process.stderr.write(`${label}: ${total} to fetch\n`); }
    nodes.push(...data.nodes);
    page++;
    process.stderr.write(`\r  ${label} page ${page} — ${nodes.length}/${total}   `);
    if (!data.pageInfo.hasNextPage) break;
    after = data.pageInfo.endCursor;
    await sleep(1200); // pace under the cost bucket
  }
  process.stderr.write('\n');
  return { totalCount: total, nodes };
}

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, `${MONTH}_raw.json`);

// --jobs-only tops up an existing pull with the jobs-created sweep instead of
// re-fetching hundreds of invoices.
const JOBS_ONLY = process.argv.includes('--jobs-only');
const TIPS_ONLY = process.argv.includes('--tips-only');

if (TIPS_ONLY) {
  const prev = JSON.parse(fs.readFileSync(file, 'utf8'));
  const tips = await pageAll('tips', 'invoices', TIPS_PAGE);
  const byNumber = new Map(tips.nodes.map(n => [n.invoiceNumber, n.amounts?.tipsTotal ?? 0]));
  let touched = 0, sum = 0;
  for (const inv of prev.invoices.nodes) {
    const t = byNumber.get(inv.invoiceNumber);
    if (t === undefined) continue;
    inv.amounts.tipsTotal = t; touched++; sum += t;
  }
  fs.writeFileSync(file, JSON.stringify(prev, null, 2));
  console.log(`
Backfilled tips onto ${touched} invoices — $${sum.toFixed(2)} in tips -> ${file}`);
  process.exit(0);
}
let invoices, quotes;
if (JOBS_ONLY) {
  const prev = JSON.parse(fs.readFileSync(file, 'utf8'));
  ({ invoices, quotes } = prev);
  process.stderr.write(`--jobs-only: keeping ${invoices.nodes.length} invoices + ${quotes.nodes.length} quotes from the previous pull
`);
} else {
  invoices = await pageAll('invoices', 'invoices', INVOICE_PAGE);
  quotes = await pageAll('quotes', 'quotes', QUOTE_PAGE);
}
const jobsSold = await pageAll('jobs created', 'jobs', JOB_PAGE);
fs.writeFileSync(file, JSON.stringify({ month: MONTH, pulledAt: new Date().toISOString(), invoices, quotes, jobsSold }, null, 2));
console.log(`\nSaved ${invoices.nodes.length} invoices + ${quotes.nodes.length} quotes + ${jobsSold.nodes.length} jobs created -> ${file}`);
