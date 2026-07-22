// tmcp-revenue-audit.mjs — recurring-revenue audit for Total Mole Control jobs.
// Read-only. Resumable: phases persist to projects/tool-jobber/data/ with cursors
// in tmcp-audit-state.json.
// Usage: node projects/tool-jobber/scripts/tmcp-revenue-audit.mjs <sweep|detail|tags|analyze|all>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const dataDir = path.resolve(here, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const statePath = path.join(dataDir, 'tmcp-audit-state.json');
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};
const saveState = () => fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
const API = path.join(root, '.claude', 'skills', 'tool-jobber', 'scripts', 'jobber-api.mjs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tmcp-audit-'));
const sleep = (ms) => execSync(process.platform === 'win32' ? `ping -n ${Math.max(1, Math.ceil(ms / 1000)) + 1} 127.0.0.1 > nul` : `sleep ${ms / 1000}`);

function gqlJson(query, attempt = 0) {
  const f = path.join(tmp, 'q.graphql');
  fs.writeFileSync(f, query);
  let out;
  try {
    out = execSync(`node "${API}" query "${f}"`, { encoding: 'utf8', cwd: root });
  } catch (e) {
    out = String(e.stdout || e.message);
  }
  const i = out.indexOf('{');
  if (i < 0 || /GraphQL errors|THROTTLED/i.test(out)) {
    if (attempt < 5) {
      const wait = /THROTTLED|rate/i.test(out) ? 45000 : 5000 * (attempt + 1);
      console.log(`  retry in ${wait / 1000}s (${out.slice(0, 120).replace(/\n/g, ' ')})`);
      sleep(wait);
      return gqlJson(query, attempt + 1);
    }
    throw new Error('query failed after retries: ' + out.slice(0, 400));
  }
  return JSON.parse(out.slice(i));
}

const sweepFile = path.join(dataDir, '2026-07-21_jobs-sweep.jsonl');
const detailFile = path.join(dataDir, '2026-07-21_jobs-detail.jsonl');
const tagsFile = path.join(dataDir, '2026-07-21_tagged-clients.jsonl');

// ---------- Phase 1: shallow sweep of ALL recurring jobs ----------
function sweep() {
  if (state.sweepDone) { console.log('sweep: already done'); return; }
  let cursor = state.sweepCursor || null;
  let n = state.sweepCount || 0;
  for (;;) {
    const q = `query { jobs(first: 50${cursor ? `, after: "${cursor}"` : ''}, filter: { jobType: RECURRING }) {
      nodes { id jobNumber title jobStatus client { id name } }
      pageInfo { endCursor hasNextPage } totalCount } }`;
    const d = gqlJson(q).jobs;
    fs.appendFileSync(sweepFile, d.nodes.map((x) => JSON.stringify(x)).join('\n') + '\n');
    n += d.nodes.length;
    cursor = d.pageInfo.endCursor;
    state.sweepCursor = cursor; state.sweepCount = n; saveState();
    console.log(`sweep: ${n}/${d.totalCount}`);
    if (!d.pageInfo.hasNextPage) break;
    sleep(400);
  }
  state.sweepDone = true; saveState();
}

// ---------- Phase 2: detail batches for non-archived jobs ----------
function detail() {
  const rows = fs.readFileSync(sweepFile, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const seen = new Set();
  const active = rows.filter((r) => {
    if (seen.has(r.id) || r.jobStatus === 'archived') return false;
    seen.add(r.id); return true;
  });
  console.log(`detail: ${active.length} non-archived jobs`);
  const done = new Set(fs.existsSync(detailFile)
    ? fs.readFileSync(detailFile, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l).id)
    : []);
  const todo = active.filter((r) => !done.has(r.id));
  console.log(`detail: ${todo.length} remaining`);
  for (let i = 0; i < todo.length; i += 15) {
    const batch = todo.slice(i, i + 15);
    const q = 'query {\n' + batch.map((r, k) => `j${k}: job(id: "${r.id}") {
      id jobNumber title jobStatus startAt endAt createdAt total invoicedTotal uninvoicedTotal billingType
      invoiceSchedule { billingFrequency scheduleSummary }
      invoices { totalCount }
      lineItems(first: 12) { nodes { name quantity unitPrice totalPrice } }
      client { id name isCompany tags(first: 15) { nodes { label } } }
      property { address { street city } }
    }`).join('\n') + '\n}';
    const d = gqlJson(q);
    const out = batch.map((_, k) => d[`j${k}`]).filter(Boolean);
    fs.appendFileSync(detailFile, out.map((x) => JSON.stringify(x)).join('\n') + '\n');
    console.log(`detail: ${Math.min(i + 15, todo.length)}/${todo.length}`);
    sleep(400);
  }
}

// ---------- Phase 3: clients tagged TMCP - Active ----------
function tags() {
  if (state.tagsDone) { console.log('tags: already done'); return; }
  let cursor = state.tagsCursor || null;
  let n = state.tagsCount || 0;
  for (;;) {
    const q = `query { clients(first: 50${cursor ? `, after: "${cursor}"` : ''}, filter: { tags: ["TMCP - Active"] }) {
      nodes { id name } pageInfo { endCursor hasNextPage } totalCount } }`;
    const d = gqlJson(q).clients;
    fs.appendFileSync(tagsFile, d.nodes.map((x) => JSON.stringify(x)).join('\n') + '\n');
    n += d.nodes.length;
    cursor = d.pageInfo.endCursor;
    state.tagsCursor = cursor; state.tagsCount = n; saveState();
    console.log(`tags: ${n}/${d.totalCount}`);
    if (!d.pageInfo.hasNextPage) break;
    sleep(400);
  }
  state.tagsDone = true; saveState();
}

// ---------- Phase 4: analysis ----------
const TMC_RE = /total mole control/i;
const VARIANT_RE = /barter|warranty|friends|family/i;

function classify(job) {
  const names = (job.lineItems?.nodes || []).map((n) => n.name || '');
  const isTMC = names.some((n) => TMC_RE.test(n));
  const isVariant = !isTMC && names.some((n) => VARIANT_RE.test(n));
  return { isTMC, isVariant, names };
}

function cadenceBucket(job) {
  const f = job.invoiceSchedule?.billingFrequency || 'NONE';
  const s = (job.invoiceSchedule?.scheduleSummary || '').toLowerCase();
  if (f === 'ON_COMPLETION') return 'on_completion';
  if (f === 'NEVER') return 'never';
  if (f === 'PER_VISIT') return 'per_visit';
  if (f === 'PERIODIC') {
    if (s.includes('monthly on the last day')) return 'monthly_last_day';
    if (s.includes('month')) return 'monthly_other';
    if (s.includes('90 days') || s.includes('3 months') || s.includes('quarter')) return 'quarterly';
    if (s.includes('year')) return 'yearly';
    return 'periodic_other';
  }
  return 'none';
}

function monthlyEquiv(job, bucket) {
  const t = job.total || 0;
  if (bucket === 'monthly_last_day' || bucket === 'monthly_other') return t;
  if (bucket === 'quarterly') return t / 3;
  if (bucket === 'yearly') return t / 12;
  return 0;
}

function analyze() {
  const jobs = fs.readFileSync(detailFile, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const dedup = new Map(jobs.map((j) => [j.id, j]));
  const all = [...dedup.values()].filter((j) => j.jobStatus !== 'archived');
  const tagged = fs.existsSync(tagsFile)
    ? new Map(fs.readFileSync(tagsFile, 'utf8').trim().split('\n').filter(Boolean).map((l) => { const c = JSON.parse(l); return [c.id, c]; }))
    : new Map();

  const tmc = [], variants = [], other = [];
  for (const j of all) {
    const c = classify(j);
    if (c.isTMC) tmc.push(j); else if (c.isVariant) variants.push(j); else other.push(j);
  }

  const now = new Date('2026-07-21T00:00:00-07:00');
  const julEnd = new Date('2026-08-01T00:00:00-07:00');
  const augEnd = new Date('2026-09-01T00:00:00-07:00');
  const weekAgo = new Date(now.getTime() - 7 * 86400e3);

  const summary = { counts: {}, cadence: {}, value: {}, rollOff: {}, tagGaps: {}, flags: {} };

  // counts
  const clientIds = new Set(tmc.map((j) => j.client.id));
  summary.counts = {
    activeTmcJobs: tmc.length,
    distinctClients: clientIds.size,
    variants: variants.length,
    otherActiveRecurring: other.length,
    taggedClients: tagged.size,
  };

  // cadence + value
  const buckets = {};
  for (const j of tmc) {
    const b = cadenceBucket(j);
    (buckets[b] ||= []).push(j);
  }
  for (const [b, list] of Object.entries(buckets)) {
    summary.cadence[b] = {
      count: list.length,
      totalPerPeriod: +list.reduce((s, j) => s + (j.total || 0), 0).toFixed(2),
      monthlyEquiv: +list.reduce((s, j) => s + monthlyEquiv(j, b), 0).toFixed(2),
    };
  }
  summary.value.mrrEquiv = +Object.entries(buckets).reduce(
    (s, [b, list]) => s + list.reduce((x, j) => x + monthlyEquiv(j, b), 0), 0).toFixed(2);
  summary.value.annualRunRate = +(summary.value.mrrEquiv * 12).toFixed(2);

  // violations: on_completion / per_visit / never (split by start-within-7-days)
  const bad = tmc.filter((j) => ['on_completion', 'per_visit', 'never', 'none'].includes(cadenceBucket(j)));
  summary.flags.badBilling = bad.map((j) => ({
    job: j.jobNumber, client: j.client.name, status: j.jobStatus,
    freq: j.invoiceSchedule?.billingFrequency, sched: j.invoiceSchedule?.scheduleSummary,
    total: j.total, startAt: j.startAt, endAt: j.endAt,
    invoices: j.invoices?.totalCount, invoicedTotal: j.invoicedTotal,
    startedLast7d: j.startAt && new Date(j.startAt) >= weekAgo,
  }));

  // tag gaps
  const untagged = tmc.filter((j) => !(j.client.tags?.nodes || []).some((t) => t.label === 'TMCP - Active'));
  summary.tagGaps.jobsMissingTag = untagged.map((j) => ({
    job: j.jobNumber, client: j.client.name, clientId: j.client.id, status: j.jobStatus,
    startAt: j.startAt, tags: (j.client.tags?.nodes || []).map((t) => t.label),
  }));
  const withJobs = new Set(tmc.map((j) => j.client.id));
  summary.tagGaps.taggedNoActiveJob = [...tagged.values()].filter((c) => !withJobs.has(c.id)).map((c) => c.name);

  // roll-off (jobs with endAt in window)
  const window = (list, a, b) => list.filter((j) => j.endAt && new Date(j.endAt) >= a && new Date(j.endAt) < b);
  const val = (list) => +list.reduce((s, j) => s + (j.total || 0), 0).toFixed(2);
  const mval = (list) => +list.reduce((s, j) => s + monthlyEquiv(j, cadenceBucket(j)), 0).toFixed(2);
  for (const [label, list] of [['tmc', tmc], ['variants', variants], ['other', other]]) {
    summary.rollOff[label] = {
      endsByJul31: { count: window(list, now, julEnd).length, totalPerPeriod: val(window(list, now, julEnd)), monthlyEquiv: mval(window(list, now, julEnd)),
        jobs: window(list, now, julEnd).map((j) => ({ job: j.jobNumber, client: j.client.name, endAt: j.endAt, total: j.total, sched: j.invoiceSchedule?.scheduleSummary, lineItems: (j.lineItems?.nodes || []).map((n) => n.name) })) },
      endsInAug: { count: window(list, julEnd, augEnd).length, totalPerPeriod: val(window(list, julEnd, augEnd)), monthlyEquiv: mval(window(list, julEnd, augEnd)),
        jobs: window(list, julEnd, augEnd).map((j) => ({ job: j.jobNumber, client: j.client.name, endAt: j.endAt, total: j.total, sched: j.invoiceSchedule?.scheduleSummary, lineItems: (j.lineItems?.nodes || []).map((n) => n.name) })) },
    };
  }

  // multi-job clients
  const byClient = {};
  for (const j of tmc) (byClient[j.client.name] ||= []).push(j.jobNumber);
  summary.counts.multiJobClients = Object.entries(byClient).filter(([, v]) => v.length > 1)
    .map(([name, v]) => ({ name, jobs: v }));

  const outPath = path.join(dataDir, '2026-07-21_tmcp-audit-summary.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.counts, null, 2));
  console.log(JSON.stringify(summary.cadence, null, 2));
  console.log(JSON.stringify(summary.value, null, 2));
  console.log(`full summary -> ${outPath}`);
}

const phase = process.argv[2] || 'all';
if (phase === 'sweep' || phase === 'all') sweep();
if (phase === 'detail' || phase === 'all') detail();
if (phase === 'tags' || phase === 'all') tags();
if (phase === 'analyze' || phase === 'all') analyze();
