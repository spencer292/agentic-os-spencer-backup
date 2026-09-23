#!/usr/bin/env node
// pull-jobber.mjs — READ-ONLY Jobber pull for the route-engine redesign.
//
// Queries only. No mutation is issued anywhere in this file.
// Auth + throttle pattern copied from projects/briefs/route-engine/scripts/route-day-drive.mjs
// (refresh_token grant, rotated token persisted to .env, X-JOBBER-GRAPHQL-VERSION 2025-04-16,
// exponential backoff on THROTTLED). Refresh-token rotation is disabled on this account, so
// the refresh call is safe to repeat.
//
// Usage (from repo root):
//   node projects/briefs/route-engine/redesign/scripts/pull-jobber.mjs --part=jobs|visits|notes|all
//
// Every page is checkpointed to data/jobber/.ckpt-*.json, so a throttle or crash mid-run
// resumes from the last completed page instead of restarting the pull.
//
// SCHEMA NOTES (verified by __type introspection 2026-09-18, recorded here so the queries
// below are not guesses):
//   Job.visitSchedule : VisitSchedule { startDate endDate startTime endTime
//                                       recurrenceSchedule { friendly calendarRule }
//                                       assignedTo(first:) : UserConnection }
//       -> assignedTo IS the job-level default assignee. There is no Job.assignedTo.
//   Job.customFields  : [CustomFieldUnion] — possible types CustomFieldText, CustomFieldNumeric,
//       CustomFieldDropdown, CustomFieldTrueFalse, CustomFieldArea, CustomFieldLink.
//       Area/Link are the only ones that could hold acreage; both are queried.
//   Property.address  : PropertyAddress { street street1 street2 city province postalCode
//                                         coordinates { latitude longitude } geoStatus }
//       -> Jobber DOES expose coordinates. geoStatus says whether they were resolved.
//   jobs(filter:)     : JobFilterAttributes — has visitsScheduledBetween (date range) and
//       status (JobStatusTypeEnum: active, archived, late, today, upcoming, unscheduled, ...).
//       Two passes are run and unioned: visits-in-window, plus status:active.
//   visits(filter:)   : VisitFilterAttributes — startAt range, no postalCode filter.
//   JobLineItem       : { name description quantity unitPrice totalPrice } — the PRODUCT lives
//       in name (total mole control / quick fix / tmcp deposit / barter / friends and family).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const ENV_PATH = path.join(ROOT, '.env');
const OUT_DIR = path.join(__dirname, '../data/jobber');
fs.mkdirSync(OUT_DIR, { recursive: true });

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const PART = flag('part', 'all');
const JOB_PAGE = +flag('jobpage', 25);   // jobs carry line items + custom fields — heavier per node
const VISIT_PAGE = +flag('visitpage', 50);

const JOBS_FROM = '2026-08-01T00:00:00-07:00';
const JOBS_TO = '2026-10-16T23:59:59-07:00';
const VISITS_FROM = '2026-08-14T00:00:00-07:00';
const VISITS_TO = '2026-10-16T23:59:59-07:00';

// ---------------- auth (read-only use) ----------------
const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); t = re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'; fs.writeFileSync(ENV_PATH, t); }
let tok = null;
async function token() {
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await r.json();
  if (!d.access_token) { console.error('token refresh failed', JSON.stringify(d).slice(0, 300)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; return tok;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const onlyPermissionHides = errs => errs.every(e => /hidden due to permissions/i.test(e.message || ''));

async function g(q, v, a = 0) {
  const t = tok || await token();
  let r;
  try {
    r = await fetch('https://api.getjobber.com/api/graphql', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
      body: JSON.stringify({ query: q, variables: v }),
    });
  } catch (e) {
    if (a < 6) { await sleep(3000 * 2 ** a); return g(q, v, a + 1); }
    throw e;
  }
  if (r.status === 401 && a < 3) { await token(); return g(q, v, a + 1); }
  const d = await r.json().catch(() => ({}));
  const throttled = r.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && a < 9) {
    const wait = Math.min(90000, 3000 * 2 ** a);
    console.log(`  … throttled — backing off ${wait / 1000}s`);
    await sleep(wait); return g(q, v, a + 1);
  }
  if (d.errors && !(d.data && onlyPermissionHides(d.errors))) {
    console.error('GraphQL errors:', JSON.stringify(d.errors).slice(0, 600));
    if (!d.data) process.exit(1);
  }
  // Throttle-aware pacing. Jobber's leaky bucket: maximumAvailable 10000, restoreRate 500/s.
  // Two other sessions were pulling the same account today, so top the bucket back up rather
  // than racing it to zero.
  const ts = d.extensions?.cost?.throttleStatus;
  if (ts && ts.currentlyAvailable < 5000) {
    const wait = Math.ceil(((5000 - ts.currentlyAvailable) / (ts.restoreRate || 500)) * 1000);
    await sleep(Math.min(wait, 20000));
  }
  return d;
}

// ---------------- checkpointing ----------------
const ck = name => path.join(OUT_DIR, `.ckpt-${name}.json`);
const readCk = name => { try { return JSON.parse(fs.readFileSync(ck(name), 'utf8')); } catch { return null; } };
const writeCk = (name, obj) => fs.writeFileSync(ck(name), JSON.stringify(obj));
const clearCk = name => { try { fs.unlinkSync(ck(name)); } catch {} };

const CF_SEL = `customFields {
  __typename
  ... on CustomFieldText     { id label valueText }
  ... on CustomFieldNumeric  { id label unit valueNumeric }
  ... on CustomFieldDropdown { id label valueDropdown }
  ... on CustomFieldTrueFalse{ id label valueTrueFalse }
  ... on CustomFieldArea     { id label unit valueArea { length width } }
  ... on CustomFieldLink     { id label valueLink { url text } }
}`;

const JOB_SEL = `
  id jobNumber jobStatus jobType title instructions createdAt startAt endAt completedAt total billingType
  client { id name }
  property { id
    address { street street1 street2 city province postalCode geoStatus coordinates { latitude longitude } } }
  lineItems(first: 15) { nodes { id name quantity unitPrice totalPrice } }
  visitSchedule {
    startDate endDate startTime endTime
    recurrenceSchedule { friendly }
    assignedTo(first: 5) { nodes { id name { full } } } }
  visitsInfo { futureCount pastCount scheduledCount unscheduledCount incompleteTotal mostRecentVisitStartAt }
  ${CF_SEL}`;

const flatCf = f => {
  if (!f) return null;
  const base = { type: f.__typename, id: f.id, label: f.label };
  if (f.__typename === 'CustomFieldText') return { ...base, value: f.valueText };
  if (f.__typename === 'CustomFieldNumeric') return { ...base, value: f.valueNumeric, unit: f.unit };
  if (f.__typename === 'CustomFieldDropdown') return { ...base, value: f.valueDropdown };
  if (f.__typename === 'CustomFieldTrueFalse') return { ...base, value: f.valueTrueFalse };
  if (f.__typename === 'CustomFieldArea') return { ...base, value: f.valueArea, unit: f.unit };
  if (f.__typename === 'CustomFieldLink') return { ...base, value: f.valueLink };
  return base;
};

function shapeJob(j, source) {
  const a = j.property?.address || {};
  return {
    id: j.id, jobNumber: j.jobNumber, jobStatus: j.jobStatus, jobType: j.jobType,
    title: j.title || '', instructions: j.instructions || null,
    createdAt: j.createdAt, startAt: j.startAt, endAt: j.endAt, completedAt: j.completedAt,
    total: j.total, billingType: j.billingType,
    client: j.client ? { id: j.client.id, name: j.client.name } : null,
    property: {
      id: j.property?.id || null,
      street: a.street || null, street1: a.street1 || null, street2: a.street2 || null,
      city: a.city || null, province: a.province || null, postalCode: a.postalCode || null,
      geoStatus: a.geoStatus || null,
      lat: a.coordinates?.latitude ?? null, lng: a.coordinates?.longitude ?? null,
    },
    lineItems: (j.lineItems?.nodes || []).map(li => ({ name: li.name, quantity: li.quantity, unitPrice: li.unitPrice, totalPrice: li.totalPrice })),
    visitSchedule: {
      startDate: j.visitSchedule?.startDate || null, endDate: j.visitSchedule?.endDate || null,
      startTime: j.visitSchedule?.startTime || null, endTime: j.visitSchedule?.endTime || null,
      recurrence: j.visitSchedule?.recurrenceSchedule?.friendly || null,
      assignedTo: (j.visitSchedule?.assignedTo?.nodes || []).map(u => ({ id: u.id, name: u.name?.full || null })),
    },
    visitsInfo: j.visitsInfo || null,
    customFields: (j.customFields || []).map(flatCf).filter(Boolean),
    _source: source,
  };
}

// ---------------- part: jobs ----------------
async function pullJobs() {
  const passes = [
    { key: 'window', filter: { visitsScheduledBetween: { after: JOBS_FROM, before: JOBS_TO } } },
    { key: 'active', filter: { status: 'active' } },
  ];
  const byId = new Map();
  const prior = readCk('jobs');
  let startPass = 0, cursor = null;
  if (prior) {
    for (const j of prior.rows) byId.set(j.id, j);
    startPass = prior.passIdx; cursor = prior.cursor;
    console.log(`resuming jobs pull: ${byId.size} jobs, pass ${passes[startPass]?.key}, cursor ${cursor ? 'set' : 'start'}`);
  }

  const Q = `query($a:String,$f:JobFilterAttributes,$n:Int!){
    jobs(first:$n, after:$a, filter:$f){
      nodes{ ${JOB_SEL} }
      pageInfo{ hasNextPage endCursor }
      totalCount } }`;

  for (let pi = startPass; pi < passes.length; pi++) {
    const p = passes[pi];
    let pages = 0;
    for (;;) {
      const d = await g(Q, { a: cursor, f: p.filter, n: JOB_PAGE });
      if (!d.data?.jobs) { console.error('jobs query returned no data', JSON.stringify(d).slice(0, 400)); process.exit(1); }
      for (const j of d.data.jobs.nodes) {
        if (!byId.has(j.id)) byId.set(j.id, shapeJob(j, p.key));
        else byId.get(j.id)._source += '+' + p.key;
      }
      pages++;
      const pi_ = d.data.jobs.pageInfo;
      cursor = pi_.hasNextPage ? pi_.endCursor : null;
      writeCk('jobs', { passIdx: pi, cursor, rows: [...byId.values()] });
      if (pages % 10 === 0) console.log(`  jobs[${p.key}] page ${pages}, ${byId.size} unique (totalCount ${d.data.jobs.totalCount})`);
      if (!cursor) break;
      await sleep(400);
    }
    console.log(`jobs[${p.key}] done: ${pages} pages, ${byId.size} unique so far`);
    cursor = null;
  }

  const rows = [...byId.values()].sort((a, b) => a.jobNumber - b.jobNumber);
  fs.writeFileSync(path.join(OUT_DIR, 'jobs.json'), JSON.stringify(rows, null, 1));
  clearCk('jobs');
  console.log(`\nwrote jobs.json — ${rows.length} jobs`);
  return rows;
}

// ---------------- part: visits ----------------
async function pullVisits() {
  const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime,$n:Int!){
    visits(first:$n, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
      nodes{ id title startAt endAt duration isComplete completedAt createdAt instructions
        visitStatus overrideOrder routingOrder
        job{ id jobNumber jobStatus }
        client{ id name }
        assignedUsers(first:5){ nodes{ id name{ full } } }
        property{ id address{ postalCode city street geoStatus coordinates{ latitude longitude } } } }
      pageInfo{ hasNextPage endCursor }
      totalCount } }`;

  const prior = readCk('visits');
  let rows = prior?.rows || [], cursor = prior?.cursor || null;
  if (prior) console.log(`resuming visits pull: ${rows.length} rows`);
  const seen = new Set(rows.map(r => r.id));
  let pages = 0;
  for (;;) {
    const d = await g(Q, { a: cursor, after: VISITS_FROM, before: VISITS_TO, n: VISIT_PAGE });
    if (!d.data?.visits) { console.error('visits query returned no data', JSON.stringify(d).slice(0, 400)); process.exit(1); }
    for (const v of d.data.visits.nodes) {
      if (seen.has(v.id)) continue; seen.add(v.id);
      const a = v.property?.address || {};
      rows.push({
        id: v.id, title: v.title || '', startAt: v.startAt, endAt: v.endAt, duration: v.duration,
        isComplete: v.isComplete, completedAt: v.completedAt, createdAt: v.createdAt,
        visitStatus: v.visitStatus, instructions: v.instructions || null,
        overrideOrder: v.overrideOrder ?? null, routingOrder: v.routingOrder ?? null,
        jobId: v.job?.id || null, jobNumber: v.job?.jobNumber ?? null, jobStatus: v.job?.jobStatus || null,
        clientName: v.client?.name || null,
        techs: (v.assignedUsers?.nodes || []).map(u => u.name?.full).filter(Boolean),
        propertyId: v.property?.id || null,
        postalCode: a.postalCode || null, city: a.city || null, street: a.street || null,
        geoStatus: a.geoStatus || null, lat: a.coordinates?.latitude ?? null, lng: a.coordinates?.longitude ?? null,
      });
    }
    pages++;
    const p = d.data.visits.pageInfo;
    cursor = p.hasNextPage ? p.endCursor : null;
    writeCk('visits', { cursor, rows });
    if (pages % 10 === 0) console.log(`  visits page ${pages}, ${rows.length} rows (totalCount ${d.data.visits.totalCount})`);
    if (!cursor) break;
    await sleep(400);
  }
  rows.sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)));
  fs.writeFileSync(path.join(OUT_DIR, 'visits.json'), JSON.stringify(rows, null, 1));
  clearCk('visits');
  console.log(`\nwrote visits.json — ${rows.length} visits over ${pages} pages`);
  return rows;
}

// ---------------- part: notes ----------------
const productOf = job => {
  const names = (job.lineItems || []).map(li => String(li.name || '').toLowerCase());
  const all = names.join(' | ');
  if (/total mole control/.test(all)) return 'TMCP';
  if (/quick fix/.test(all)) return 'Quick Fix';
  if (/tmcp deposit/.test(all)) return 'TMCP deposit';
  if (/friends and family/.test(all)) return 'Friends and family';
  if (/barter/.test(all)) return 'Barter';
  if (!names.length) return 'none (bid)';
  return 'other';
};

async function pullNotes(jobs) {
  // 40 jobs spread across products, newest-activity first inside each product bucket.
  const buckets = {};
  for (const j of jobs) (buckets[productOf(j)] = buckets[productOf(j)] || []).push(j);
  const order = Object.keys(buckets).sort((a, b) => buckets[b].length - buckets[a].length);
  const picked = [];
  let i = 0;
  while (picked.length < 40 && order.some(k => buckets[k][i])) {
    for (const k of order) { const j = buckets[k][i]; if (j && picked.length < 40) picked.push(j); }
    i++;
  }
  console.log(`notes: sampling ${picked.length} jobs across ${order.length} products (${order.map(k => k + ':' + buckets[k].length).join(', ')})`);

  const prior = readCk('notes');
  const out = prior?.rows || [];
  const done = new Set(out.map(r => r.jobId));
  const todo = picked.filter(j => !done.has(j.id));
  const CHUNK = 8;
  for (let k = 0; k < todo.length; k += CHUNK) {
    const chunk = todo.slice(k, k + CHUNK);
    const q = `query { ${chunk.map((j, n) => `j${n}: job(id: ${JSON.stringify(j.id)}) {
      id jobNumber notes(last: 5) { nodes { __typename ... on JobNote { id message createdAt createdBy { __typename ... on User { name { full } } } } } } }`).join(' ')} }`;
    const d = await g(q, {});
    for (const key of Object.keys(d.data || {})) {
      const j = d.data[key]; if (!j) continue;
      const src = picked.find(p => p.id === j.id) || {};
      out.push({
        jobId: j.id, jobNumber: j.jobNumber, product: productOf(src), jobStatus: src.jobStatus,
        client: src.client?.name || null, postalCode: src.property?.postalCode || null,
        notes: (j.notes?.nodes || []).filter(n => n && n.__typename === 'JobNote').map(n => ({ id: n.id, message: n.message, createdAt: n.createdAt, by: n.createdBy?.name?.full || n.createdBy?.__typename || null })),
      });
    }
    writeCk('notes', { rows: out });
    console.log(`  notes chunk ${k / CHUNK + 1}: ${out.length} jobs`);
    await sleep(700);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'notes-sample.json'), JSON.stringify(out, null, 1));
  clearCk('notes');
  console.log(`\nwrote notes-sample.json — ${out.length} jobs, ${out.reduce((s, r) => s + r.notes.length, 0)} notes`);
  return out;
}

// ---------------- run ----------------
const t0 = Date.now();
let jobs = null;
if (PART === 'jobs' || PART === 'all') jobs = await pullJobs();
if (PART === 'visits' || PART === 'all') await pullVisits();
if (PART === 'notes' || PART === 'all') {
  if (!jobs) jobs = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'jobs.json'), 'utf8'));
  await pullNotes(jobs);
}
console.log(`\ndone in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
