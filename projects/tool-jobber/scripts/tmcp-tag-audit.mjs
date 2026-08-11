// tmcp-tag-audit.mjs — read-only TMCP membership + tag reconciliation.
// Usage: node projects/tool-jobber/scripts/tmcp-tag-audit.mjs [YYYY-MM-DD]
//
// Differs from tmcp-revenue-audit.mjs: sweeps every LIVE job (status filter, both RECURRING and
// ONE_OFF) instead of recurring-only, so the one-off TMC jobs found on 7/22 (Marcus Andy #4979,
// Aziz #8150, Wickland #8087) can't hide. Pulls line items + client tags in one pass.
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tmcp-tags-'));
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
    if (attempt < 5) {
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
  id jobNumber title jobStatus jobType startAt endAt total billingType
  invoiceSchedule { billingFrequency scheduleSummary }
  lineItems(first: 15) { nodes { name quantity unitPrice totalPrice } }
  client { id name isArchived tags(first: 20) { nodes { label } } }`;

// ---- Phase 1: every live job (all non-archived statuses) ----
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
    sleep(300);
  }
  console.log(`jobs[${status}]: ${n}/${total}  (unique so far: ${jobs.size})`);
  sleep(300);
}

// ---- Phase 2: clients carrying each TMCP tag ----
function clientsByTag(tag) {
  const out = new Map();
  let cursor = null;
  for (;;) {
    const d = gql(`query { clients(first: 50${cursor ? `, after: "${cursor}"` : ''}, filter: { tags: ["${tag}"] }) {
      nodes { id name isArchived } pageInfo { endCursor hasNextPage } totalCount } }`).clients;
    for (const c of d.nodes) out.set(c.id, c);
    cursor = d.pageInfo.endCursor;
    if (!d.pageInfo.hasNextPage) break;
    sleep(300);
  }
  console.log(`clients[${tag}]: ${out.size}`);
  return out;
}
const tagActive = clientsByTag('TMCP - Active');
const tagChurned = clientsByTag('TMCP Churned');

// ---- Phase 3: classify ----
const TMC_RE = /total mole control/i;
const live = [...jobs.values()].filter((j) => j.jobStatus !== 'archived');
const isTmc = (j) => (j.lineItems?.nodes || []).some((n) => TMC_RE.test(n.name || ''));
const labels = (j) => (j.client?.tags?.nodes || []).map((t) => t.label);
const tmc = live.filter(isTmc);

const monthly = (j) => {
  const f = j.invoiceSchedule?.billingFrequency;
  const s = (j.invoiceSchedule?.scheduleSummary || '').toLowerCase();
  const t = j.total || 0;
  if (f !== 'PERIODIC') return 0;
  if (s.includes('year')) return t / 12;
  if (s.includes('90 days') || s.includes('3 month') || s.includes('quarter')) return t / 3;
  if (s.includes('month')) return t;
  return 0;
};

const missingTag = tmc.filter((j) => !labels(j).includes('TMCP - Active'));
const tmcClientIds = new Set(tmc.map((j) => j.client.id));

// Clients carrying more than one live TMCP job. Tags live on the CLIENT, so a 2-job client
// shows up once in any tag count — the true job total is tmc.length, not the tagged-client count.
const byClient = new Map();
for (const j of tmc) {
  if (!byClient.has(j.client.id)) byClient.set(j.client.id, []);
  byClient.get(j.client.id).push(j);
}
const multiJob = [...byClient.entries()].filter(([, js]) => js.length > 1);
const taggedNoJob = [...tagActive.values()].filter((c) => !tmcClientIds.has(c.id));
const churnedButLive = tmc.filter((j) => labels(j).includes('TMCP Churned'));

const report = {
  runDate: RUN,
  liveJobsScanned: live.length,
  tmcJobs: {
    total: tmc.length,
    recurring: tmc.filter((j) => j.jobType === 'RECURRING').length,
    oneOff: tmc.filter((j) => j.jobType !== 'RECURRING').length,
    distinctClients: tmcClientIds.size,
    clientsWithMultipleJobs: multiJob.length,
    extraJobsFromMultiClients: tmc.length - tmcClientIds.size,
  },
  tags: {
    taggedActive: tagActive.size,
    taggedChurned: tagChurned.size,
    tmcJobsMissingActiveTag: missingTag.length,
    clientsMissingActiveTag: new Set(missingTag.map((j) => j.client.id)).size,
    taggedActiveNoTmcJob: taggedNoJob.length,
    tmcJobsTaggedChurned: churnedButLive.length,
  },
  mrrEquiv: +tmc.reduce((s, j) => s + monthly(j), 0).toFixed(2),
  missingTagDetail: missingTag.map((j) => ({
    job: j.jobNumber, client: j.client.name, clientId: j.client.id,
    jobType: j.jobType, status: j.jobStatus, startAt: j.startAt, endAt: j.endAt,
    total: j.total, sched: j.invoiceSchedule?.scheduleSummary || j.invoiceSchedule?.billingFrequency,
    currentTags: labels(j),
  })).sort((a, b) => String(b.startAt).localeCompare(String(a.startAt))),
  taggedNoJobDetail: taggedNoJob.map((c) => ({ client: c.name, clientId: c.id, archived: c.isArchived })),
  multiJobDetail: multiJob.map(([clientId, js]) => ({
    client: js[0].client.name, clientId, jobCount: js.length,
    tags: labels(js[0]),
    jobs: js.map((j) => ({
      job: j.jobNumber, title: j.title, jobType: j.jobType, status: j.jobStatus,
      startAt: j.startAt, endAt: j.endAt, total: j.total,
      sched: j.invoiceSchedule?.scheduleSummary || j.invoiceSchedule?.billingFrequency,
      monthly: +monthly(j).toFixed(2),
      lineItems: (j.lineItems?.nodes || []).map((n) => n.name),
    })),
  })).sort((a, b) => b.jobCount - a.jobCount || a.client.localeCompare(b.client)),
};

const out = path.join(dataDir, `${RUN}_tmcp-tag-audit.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log('\n' + JSON.stringify({ ...report, missingTagDetail: undefined, taggedNoJobDetail: undefined, multiJobDetail: undefined }, null, 2));
if (multiJob.length) {
  console.log(`\nClients with >1 live TMCP job (${multiJob.length}, carrying ${tmc.length - tmcClientIds.size} extra jobs):`);
  for (const m of report.multiJobDetail) {
    console.log(`  ${m.client} — ${m.jobCount} jobs: ${m.jobs.map((j) => `#${j.job} (${j.status}, $${j.total})`).join(', ')}`);
  }
}
console.log(`\nfull report -> ${out}`);
