// READ-ONLY. How often does a Quick Fix customer become a TMCP customer, and who converts them?
//
//   node projects/briefs/callrail-faq/scripts/quickfix-to-tmcp.mjs [--since=YYYY-MM-DD] [--refetch]
//
// The phone close is only half the sale. A Quick Fix is five weekly visits with a tech standing in
// the customer's yard holding a dead mole — the strongest upsell position in the business. This
// measures whether that upsell actually happens: for every client who bought a Quick Fix, did a
// TMCP job follow, how long after, and which tech was on the property.

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const API = path.resolve('.claude/skills/tool-jobber/scripts/jobber-api.mjs');
const args = process.argv.slice(2);
const SINCE = (args.find((a) => a.startsWith('--since=')) || '--since=2026-01-01').split('=')[1];
const REFETCH = args.includes('--refetch');
const CACHE_DIR = path.resolve('projects/briefs/callrail-faq/data');
const CACHE = path.join(CACHE_DIR, `qf-tmcp-${SINCE}.json`);
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

let jobs;
if (existsSync(CACHE) && !REFETCH) {
  jobs = JSON.parse(readFileSync(CACHE, 'utf8'));
  process.stderr.write(`(cached — pass --refetch for live data)\n`);
} else {
  jobs = [];
  let cursor = null;
  for (let p = 0; p < 80; p++) {
    const after = cursor ? `, after: ${JSON.stringify(cursor)}` : '';
    const d = gql(`query { jobs(first: 50${after}, filter: { createdAt: { after: "${SINCE}T00:00:00Z" } }) {
      nodes { jobNumber jobStatus createdAt total
              client { id name }
              property { address { city postalCode } }
              salesperson { name { full } }
              lineItems(first: 6) { nodes { name unitPrice } } }
      pageInfo { hasNextPage endCursor } } }`);
    jobs.push(...d.jobs.nodes);
    process.stderr.write(`  ${jobs.length} jobs\r`);
    if (!d.jobs.pageInfo.hasNextPage) break;
    cursor = d.jobs.pageInfo.endCursor;
    sleep(1200);
  }
  process.stderr.write('\n');
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE, JSON.stringify(jobs));
}

const kind = (j) => {
  const n = (j.lineItems?.nodes || []).map((l) => l.name).join(' ').toLowerCase();
  if (/total mole/.test(n)) return 'TMCP';
  if (/quick fix/.test(n)) return 'QuickFix';
  return 'other';
};
const day = (ms) => ms / 86400000;
const NOW = Date.parse('2026-08-18T20:00:00Z');

// Group jobs by client, chronologically.
const byClient = new Map();
for (const j of jobs) {
  const k = j.client?.id;
  if (!k) continue;
  if (!byClient.has(k)) byClient.set(k, []);
  byClient.get(k).push(j);
}
for (const list of byClient.values()) list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

// A Quick Fix has "matured" once its 5-week series has had time to run (~45 days).
const MATURE_DAYS = 45;
const rows = [];
for (const [, list] of byClient) {
  for (let i = 0; i < list.length; i++) {
    if (kind(list[i]) !== 'QuickFix') continue;
    const qf = list[i];
    const later = list.slice(i + 1).find((j) => kind(j) === 'TMCP');
    const techs = new Set();
    rows.push({
      client: qf.client?.name,
      qfNumber: qf.jobNumber,
      created: qf.createdAt,
      age: day(NOW - Date.parse(qf.createdAt)),
      mature: day(NOW - Date.parse(qf.createdAt)) >= MATURE_DAYS,
      upgraded: !!later,
      lagDays: later ? day(Date.parse(later.createdAt) - Date.parse(qf.createdAt)) : null,
      tmcpNumber: later?.jobNumber ?? null,
      techs: [...techs],
      seller: qf.salesperson?.name?.full || '(unassigned)',
      city: qf.property?.address?.city,
    });
  }
}

const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(0)}%` : '—');
const mature = rows.filter((r) => r.mature);
const up = mature.filter((r) => r.upgraded);

console.log(`Quick Fix → TMCP upgrade rate — jobs created since ${SINCE}, measured 2026-08-18\n`);
console.log(`Quick Fix jobs found:            ${rows.length}`);
console.log(`  ...matured (${MATURE_DAYS}+ days old):    ${mature.length}`);
console.log(`  ...still inside the window:    ${rows.length - mature.length}\n`);
console.log(`UPGRADED TO TMCP:                ${up.length} / ${mature.length} = ${pct(up.length, mature.length)}`);
if (up.length) {
  const lags = up.map((r) => r.lagDays).sort((a, b) => a - b);
  console.log(`  median lag to upgrade:         ${lags[Math.floor(lags.length / 2)].toFixed(0)} days`);
  console.log(`  inside the 5-week series:      ${up.filter((r) => r.lagDays <= 35).length} of ${up.length}`);
}

// NOTE: tech attribution needs Visit.assignedUsers, which is deliberately NOT fetched here --
// nesting visits inside the jobs query blows Jobber's query-cost limit and throttles the run for
// several minutes. Use the companion script for the per-tech split.

console.log(`\n--- upgrade rate by who sold the Quick Fix ---`);
const bySeller = new Map();
for (const r of mature) {
  if (!bySeller.has(r.seller)) bySeller.set(r.seller, { n: 0, up: 0 });
  bySeller.get(r.seller).n++;
  if (r.upgraded) bySeller.get(r.seller).up++;
}
[...bySeller.entries()].sort((a, b) => b[1].n - a[1].n)
  .forEach(([s, v]) => console.log(`  ${s.padEnd(20)} ${String(v.up).padStart(3)} / ${String(v.n).padEnd(4)} = ${pct(v.up, v.n)}`));

console.log(`\n--- Quick Fix jobs still inside the upgrade window (live upsell targets) ---`);
rows.filter((r) => !r.mature && !r.upgraded).sort((a, b) => b.age - a.age).forEach((r) =>
  console.log(`  ${r.age.toFixed(0).padStart(3)}d  #${r.qfNumber}  ${String(r.client).padEnd(24)} ${String(r.city || '').padEnd(14)} techs: ${r.techs.join(', ') || '—'}`));
