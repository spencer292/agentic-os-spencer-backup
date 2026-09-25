// tmcp-billing-audit.mjs — read-only. Two questions in one sweep:
//   1. Which live TMCP jobs sit on a client MISSING the "TMCP - Active" tag (and the inverse)?
//   2. Which live TMCP jobs are BILLED WRONG — no recurring charge, $0 price, never invoiced,
//      expired-but-running, or hand-billed rather than on autopay?
//
// Extends tmcp-tag-audit.mjs with the billing-truth fields: willClientBeAutomaticallyCharged,
// invoicedTotal, uninvoicedTotal, jobBalanceTotals, per-line-item unit prices, property address.
// Usage: node projects/tool-jobber/scripts/tmcp-billing-audit.mjs [YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const dataDir = path.resolve(here, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const API = path.join(root, '.claude', 'skills', 'tool-jobber', 'scripts', 'jobber-api.mjs');
const RUN = process.argv[2] || new Date().toISOString().slice(0, 10);
const TODAY = new Date(RUN + 'T12:00:00Z');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tmcp-bill-'));
const sleep = (ms) => execSync(process.platform === 'win32'
  ? `ping -n ${Math.max(1, Math.ceil(ms / 1000)) + 1} 127.0.0.1 > nul`
  : `sleep ${ms / 1000}`);

function gql(query, attempt = 0) {
  const f = path.join(tmp, 'q.graphql');
  fs.writeFileSync(f, query);
  let out;
  try { out = execSync(`node "${API}" query "${f}"`, { encoding: 'utf8', cwd: root, maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { out = String(e.stdout || e.message); }
  const i = out.indexOf('{');
  if (i < 0 || /GraphQL errors|THROTTLED/i.test(out)) {
    if (attempt < 6) {
      const wait = /THROTTLED|rate/i.test(out) ? 45000 : 5000 * (attempt + 1);
      console.log(`  retry in ${wait / 1000}s (${out.slice(0, 140).replace(/\n/g, ' ')})`);
      sleep(wait);
      return gql(query, attempt + 1);
    }
    throw new Error('query failed: ' + out.slice(0, 400));
  }
  return JSON.parse(out.slice(i));
}

const JOB_FIELDS = `
  id jobNumber title jobStatus jobType startAt endAt createdAt total billingType
  willClientBeAutomaticallyCharged invoicedTotal uninvoicedTotal
  jobBalanceTotals { outstandingAmount totalAmount }
  invoiceSchedule { billingFrequency scheduleSummary }
  lineItems(first: 20) { nodes { name quantity unitPrice totalPrice } }
  property { address { street city postalCode } }
  client { id name isArchived tags(first: 25) { nodes { label } } }`;

// ---- Phase 1: every live job across all non-archived statuses ----
const LIVE_STATUSES = ['active', 'upcoming', 'today', 'late', 'on_hold', 'action_required', 'requires_invoicing', 'unscheduled'];
const jobs = new Map();
for (const status of LIVE_STATUSES) {
  let cursor = null, n = 0, total = null;
  for (;;) {
    const d = gql(`query { jobs(first: 25${cursor ? `, after: "${cursor}"` : ''}, filter: { status: ${status} }) {
      nodes { ${JOB_FIELDS} } pageInfo { endCursor hasNextPage } totalCount } }`).jobs;
    for (const j of d.nodes) jobs.set(j.id, j);
    n += d.nodes.length; total = d.totalCount;
    cursor = d.pageInfo.endCursor;
    if (!d.pageInfo.hasNextPage) break;
    sleep(250);
  }
  console.log(`jobs[${status}]: ${n}/${total}  (unique so far: ${jobs.size})`);
  sleep(250);
}

// ---- Phase 2: tag rosters ----
function clientsByTag(tag) {
  const out = new Map();
  let cursor = null;
  for (;;) {
    const d = gql(`query { clients(first: 50${cursor ? `, after: "${cursor}"` : ''}, filter: { tags: ["${tag}"] }) {
      nodes { id name isArchived } pageInfo { endCursor hasNextPage } totalCount } }`).clients;
    for (const c of d.nodes) out.set(c.id, c);
    cursor = d.pageInfo.endCursor;
    if (!d.pageInfo.hasNextPage) break;
    sleep(250);
  }
  console.log(`clients[${tag}]: ${out.size}`);
  return out;
}
const tagActive = clientsByTag('TMCP - Active');
const tagChurned = clientsByTag('TMCP Churned');

// ---- Phase 3: classify ----
const TMC_RE = /total mole control/i;
const DISCOUNT_RE = /discount|barter|friends|family|comp\b|trade/i;
const live = [...jobs.values()].filter((j) => j.jobStatus !== 'archived');
const items = (j) => j.lineItems?.nodes || [];
const isTmc = (j) => items(j).some((n) => TMC_RE.test(n.name || ''));
const labels = (j) => (j.client?.tags?.nodes || []).map((t) => t.label);
const days = (iso) => (iso ? Math.round((TODAY - new Date(iso)) / 86400000) : null);
const addr = (j) => {
  const a = j.property?.address || {};
  return [a.street, a.city, a.postalCode].filter(Boolean).join(', ');
};
const tmc = live.filter(isTmc);

const sched = (j) => (j.invoiceSchedule?.scheduleSummary || '').toLowerCase();
const freq = (j) => j.invoiceSchedule?.billingFrequency;
const cadence = (j) => {
  const f = freq(j), s = sched(j);
  if (f !== 'PERIODIC') return f;                       // ON_COMPLETION | NEVER | PER_VISIT
  if (s.includes('year')) return 'PERIODIC_YEARLY';
  if (s.includes('90 days') || s.includes('3 month') || s.includes('quarter')) return 'PERIODIC_QUARTERLY';
  if (s.includes('month')) return 'PERIODIC_MONTHLY';
  return 'PERIODIC_OTHER';
};
const monthly = (j) => {
  const t = j.total || 0;
  switch (cadence(j)) {
    case 'PERIODIC_MONTHLY': return t;
    case 'PERIODIC_YEARLY': return t / 12;
    case 'PERIODIC_QUARTERLY': return t / 3;
    default: return 0;
  }
};

// --- billing defect rules ---
// Expected setup for a live TMCP job: PERIODIC monthly schedule, non-zero price, invoices
// actually raised once it is past its first cycle, not past its end date.
function defects(j) {
  const d = [];
  const c = cadence(j);
  const age = days(j.startAt);
  const tmcItems = items(j).filter((n) => TMC_RE.test(n.name || ''));
  const tmcPrice = tmcItems.reduce((s, n) => s + (n.totalPrice || 0), 0);
  const hasDiscountItem = items(j).some((n) => DISCOUNT_RE.test(n.name || ''));

  if (c === 'NEVER') d.push('NO_INVOICE_SCHEDULE');            // "Don't remind me to invoice"
  else if (c === 'ON_COMPLETION') d.push('BILLS_ON_CLOSE');    // never charges while it runs
  else if (c === 'PER_VISIT') d.push('BILLS_PER_VISIT');
  else if (c === 'PERIODIC_YEARLY') d.push('BILLS_YEARLY');
  else if (c === 'PERIODIC_QUARTERLY') d.push('BILLS_QUARTERLY');
  else if (c === 'PERIODIC_OTHER') d.push('SCHEDULE_UNPARSED');

  if (!(j.total > 0)) d.push('ZERO_PRICE');
  else if (tmcPrice === 0) d.push('TMCP_LINE_ZERO');           // priced, but not on the TMCP line
  else if (j.total < 75 && !hasDiscountItem) d.push('BELOW_FLOOR_NO_DISCOUNT');

  // Past its first cycle and still nothing invoiced = the schedule is not actually firing.
  if (age !== null && age >= 45 && !(j.invoicedTotal > 0)) d.push('NEVER_INVOICED');

  if (j.endAt && days(j.endAt) > 0) d.push('PAST_END_DATE');

  return { defects: d, tmcPrice, hasDiscountItem };
}

const rows = tmc.map((j) => {
  const { defects: dfx, tmcPrice, hasDiscountItem } = defects(j);
  return {
    job: j.jobNumber, title: j.title, status: j.jobStatus, jobType: j.jobType,
    client: j.client.name, clientId: j.client.id, address: addr(j),
    startAt: j.startAt, endAt: j.endAt, createdAt: j.createdAt, ageDays: days(j.startAt),
    total: j.total, tmcPrice, hasDiscountItem,
    cadence: cadence(j), billingFrequency: freq(j), sched: j.invoiceSchedule?.scheduleSummary,
    monthly: +monthly(j).toFixed(2),
    autopay: j.willClientBeAutomaticallyCharged,
    invoicedTotal: j.invoicedTotal, uninvoicedTotal: j.uninvoicedTotal,
    outstanding: j.jobBalanceTotals?.outstandingAmount ?? null,
    tags: labels(j),
    hasActiveTag: labels(j).includes('TMCP - Active'),
    hasChurnedTag: labels(j).includes('TMCP Churned'),
    lineItems: items(j).map((n) => `${n.name} @${n.totalPrice}`),
    defects: dfx,
  };
});

const tmcClientIds = new Set(rows.map((r) => r.clientId));
const missingTag = rows.filter((r) => !r.hasActiveTag);
const churnedButLive = rows.filter((r) => r.hasChurnedTag);
// Umbrella/parent accounts legitimately carry "TMCP - Active" while the billable jobs sit on
// individual member records. Flagging them is a false positive — Spencer confirmed 2026-09-09
// that Barbee Mill HOA is a TMCP client (11 live jobs on owner records at $100 less a $50 HOA
// discount). Add a client here only when the same pattern is confirmed, not to silence a gap.
const UMBRELLA_ACCOUNTS = new Set(['Barbee Mill HOA']);
const taggedNoJob = [...tagActive.values()]
  .filter((c) => !tmcClientIds.has(c.id) && !UMBRELLA_ACCOUNTS.has(c.name));
const broken = rows.filter((r) => r.defects.length);

const byDefect = {};
for (const r of broken) for (const d of r.defects) (byDefect[d] ||= []).push(r.job);

const noRecurringCharge = rows.filter((r) => r.monthly === 0);
const handBilled = rows.filter((r) => r.autopay === false);

// --- Autopay intent recorded but never applied ---
// The client "Autopay" tag records that the customer AGREED to be auto-charged. When the job's
// willClientBeAutomaticallyCharged is still false, that intent was recorded and never switched on,
// and if the client already holds a saved card it is a one-switch fix with no sales conversation.
// The tag is UNDER-applied (many jobs autopay carrying no tag), so it is NOT a roster — only
// tag-present + setting-off is a signal. Jobber gates payment-method detail, but
// paymentMethods.totalCount is readable, which gives the card-on-file count.
const AUTOPAY_TAG_RE = /autopay/i;
const autopayIntentUnapplied = rows.filter(
  (r) => r.autopay !== true && r.tags.some((t) => AUTOPAY_TAG_RE.test(t)));
for (const r of autopayIntentUnapplied) {
  try {
    r.cardsOnFile = gql(`query { paymentMethods(filter: { clientId: "${r.clientId}" }) { totalCount } }`)
      .paymentMethods.totalCount;
  } catch { r.cardsOnFile = null; }
  sleep(400);
}
const autopayOneSwitch = autopayIntentUnapplied.filter((r) => r.cardsOnFile > 0);
console.log(`autopay tagged but OFF: ${autopayIntentUnapplied.length} jobs, ${autopayOneSwitch.length} already hold a card`);

const report = {
  runDate: RUN,
  liveJobsScanned: live.length,
  tmcp: {
    jobs: rows.length,
    distinctClients: tmcClientIds.size,
    extraJobsFromMultiClients: rows.length - tmcClientIds.size,
    mrrEquiv: +rows.reduce((s, r) => s + r.monthly, 0).toFixed(2),
  },
  tagAudit: {
    clientsTaggedActive: tagActive.size,
    clientsTaggedChurned: tagChurned.size,
    jobsMissingActiveTag: missingTag.length,
    clientsMissingActiveTag: new Set(missingTag.map((r) => r.clientId)).size,
    mrrBehindMissingTag: +missingTag.reduce((s, r) => s + r.monthly, 0).toFixed(2),
    jobsTaggedChurnedButLive: churnedButLive.length,
    clientsTaggedActiveNoLiveJob: taggedNoJob.length,
  },
  billingAudit: {
    jobsWithAnyDefect: broken.length,
    jobsRaisingNoMonthlyCharge: noRecurringCharge.length,
    valueAtRiskNoMonthlyCharge: +noRecurringCharge.reduce((s, r) => s + (r.total || 0), 0).toFixed(2),
    handBilledJobs: handBilled.length,
    handBilledMonthly: +handBilled.reduce((s, r) => s + r.monthly, 0).toFixed(2),
    autopayJobs: rows.filter((r) => r.autopay === true).length,
    autopayMonthly: +rows.filter((r) => r.autopay === true).reduce((s, r) => s + r.monthly, 0).toFixed(2),
    autopayTaggedButOff: autopayIntentUnapplied.length,
    autopayTaggedButOffMonthly: +autopayIntentUnapplied.reduce((s, r) => s + r.monthly, 0).toFixed(2),
    autopayOneSwitchFix: autopayOneSwitch.length,
    autopayOneSwitchMonthly: +autopayOneSwitch.reduce((s, r) => s + r.monthly, 0).toFixed(2),
    defectCounts: Object.fromEntries(Object.entries(byDefect).map(([k, v]) => [k, v.length])),
  },
  cadenceBreakdown: rows.reduce((m, r) => ((m[r.cadence] = (m[r.cadence] || 0) + 1), m), {}),
  missingTagDetail: missingTag.sort((a, b) => String(b.startAt).localeCompare(String(a.startAt))),
  churnedButLiveDetail: churnedButLive,
  taggedNoJobDetail: taggedNoJob.map((c) => ({ client: c.name, clientId: c.id, archived: c.isArchived })),
  billingDefectDetail: broken.sort((a, b) => (b.total || 0) - (a.total || 0)),
  autopayTaggedButOffDetail: autopayIntentUnapplied
    .sort((a, b) => (b.monthly || 0) - (a.monthly || 0))
    .map((r) => ({ job: r.job, client: r.client, monthly: r.monthly, cardsOnFile: r.cardsOnFile, outstanding: r.outstanding })),
};

const dump = path.join(dataDir, `${RUN}_tmcp-jobs.jsonl`);
fs.writeFileSync(dump, rows.map((r) => JSON.stringify(r) + '\n').join(''));
const out = path.join(dataDir, `${RUN}_tmcp-billing-audit.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2));

console.log('\n' + JSON.stringify({
  runDate: report.runDate, liveJobsScanned: report.liveJobsScanned, tmcp: report.tmcp,
  tagAudit: report.tagAudit, billingAudit: report.billingAudit, cadenceBreakdown: report.cadenceBreakdown,
}, null, 2));
console.log(`\njobs dump  -> ${dump}`);
console.log(`full report -> ${out}`);
