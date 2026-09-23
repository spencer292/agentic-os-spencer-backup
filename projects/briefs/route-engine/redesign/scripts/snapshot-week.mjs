#!/usr/bin/env node
// ============================================================================
// snapshot-week.mjs — capture the whole book "as of now" into an immutable
// snapshot folder under projects/briefs/route-engine/redesign/snapshots/.
//
// WHO RUNS THIS AND WHEN
//   A PERSON runs it, by hand, every FRIDAY AT 12:00 PT.
//   It is NOT scheduled. Do not put it on a cron, do not wire it into
//   cron/jobs/, do not call it from another job. The weekly cadence is a human
//   ritual: somebody runs it, looks at the output, and keeps the folder.
//
// STRICTLY READ-ONLY
//   Jobber   : GraphQL `query` operations only. The string "mutation" does not
//              appear in any request body built by this file.
//   OptimoRoute: the same read-only allow-list transport as
//              pull-optimo-history.mjs — get_routes, search_orders,
//              get_completion_details, get_depots. The transport THROWS on any
//              endpoint not on that list, so a typo cannot reach a writer.
//   Nothing in this file can change a job, a visit, an order or a route.
//
// SNAPSHOTS ARE IMMUTABLE
//   A snapshot records what was true at one moment. Never edit one, never
//   re-run a part over a good one to "correct" it. A wrong snapshot gets a NEW
//   snapshot; the old one stays as the record. See snapshots/README.md.
//
// USAGE (always from the repo root C:\Agentic-os-got-moles so .env resolves):
//
//   full capture (new folder, all six parts)
//     node projects/briefs/route-engine/redesign/scripts/snapshot-week.mjs --part=all
//
//   one part only (still creates a new folder unless --dir= is given)
//     node projects/briefs/route-engine/redesign/scripts/snapshot-week.mjs --part=notes --dir=2026-09-19T1200-1a2b3c4d
//
//   resume / top up an existing snapshot folder (parts already complete are skipped)
//     node projects/briefs/route-engine/redesign/scripts/snapshot-week.mjs --part=all --dir=2026-09-19T1200-1a2b3c4d
//
//   force a part to be re-pulled inside an existing folder
//     node projects/briefs/route-engine/redesign/scripts/snapshot-week.mjs --part=optimo --dir=<folder> --force
//
//   Never pipe a live run through head/sed (SIGPIPE truncation — CLAUDE.local.md
//   2026-08-09). The script tees its own console output to capture.log inside
//   the snapshot folder; redirect the shell too if you want a second copy.
//
// PARTS
//   jobs    ALL jobs — visitsScheduledBetween over the snapshot window UNION status:active
//   visits  every visit with startAt in [capture-14d, capture+45d] Pacific
//   notes   job notes created in the last 21 days, across ALL jobs
//   users   the active user list
//   optimo  OptimoRoute routes as currently held for the next 21 weekdays
//   config  copies of territories.json, tech-service-times.json, cycle-times-gps.json
//
// SCHEMA NOTES — inherited from pull-jobber.mjs (verified by introspection
// 2026-09-18) and pull-optimo-history.mjs. Trust those headers over guessing:
//   Job.visitSchedule.assignedTo IS the job-level default assignee (no Job.assignedTo).
//   Job.customFields is a union — Text/Numeric/Dropdown/TrueFalse/Area/Link.
//   Jobber custom-field labels carry trailing whitespace; they are trimmed here.
//   Property.address exposes coordinates { latitude longitude } + geoStatus.
//   OptimoRoute get_drivers returns AUTH_KEY_UNKNOWN on this key; the roster is
//   inferred from routes.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REDESIGN = path.resolve(__dirname, '..');
const ROOT = path.resolve(__dirname, '../../../../..');
const ENV_PATH = path.join(ROOT, '.env');
const SNAP_ROOT = path.join(REDESIGN, 'snapshots');

// ---------------------------------------------------------------- args
const flag = (n, d) => {
  const a = process.argv.find(x => x === `--${n}` || x.startsWith(`--${n}=`));
  if (!a) return d;
  return a.includes('=') ? a.split('=').slice(1).join('=') : true;
};
const PART = String(flag('part', 'all'));
const FORCE = Boolean(flag('force', false));
const DIR_ARG = flag('dir', null);
const JOB_PAGE = Number(flag('jobpage', 25));
const VISIT_PAGE = Number(flag('visitpage', 50));
const NOTE_CHUNK = Number(flag('notechunk', 8));
const OPTIMO_SLEEP = Number(flag('optimosleep', 250));
const VALID_PARTS = ['jobs', 'visits', 'notes', 'users', 'optimo', 'config'];
if (PART !== 'all' && !VALID_PARTS.includes(PART)) {
  console.error(`--part must be one of ${VALID_PARTS.join('|')}|all`);
  process.exit(1);
}
const wants = p => PART === 'all' || PART === p;

// ------------------------------------------------- Pacific time (UTC-7, Sep 2026)
const PAC_OFFSET_H = 7;
const pacShift = ms => new Date(ms - PAC_OFFSET_H * 3600e3);
const pacDate = ms => pacShift(ms).toISOString().slice(0, 10);
const pacHHMM = ms => pacShift(ms).toISOString().slice(11, 16).replace(':', '');
const pacFull = ms => pacShift(ms).toISOString().slice(0, 19).replace('T', ' ') + ' PT';
const addDays = (ymd, n) => new Date(new Date(ymd + 'T12:00:00Z').getTime() + n * 86400e3).toISOString().slice(0, 10);

const CAPTURE_START_MS = Date.now();
const CAPTURE_START_ISO = new Date(CAPTURE_START_MS).toISOString();
const CAPTURE_DATE_PAC = pacDate(CAPTURE_START_MS);

let GIT_HEAD = 'unknown';
try { GIT_HEAD = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); } catch { /* not fatal */ }

// windows
const WIN_FROM = addDays(CAPTURE_DATE_PAC, -14);
const WIN_TO = addDays(CAPTURE_DATE_PAC, 45);
const WIN_FROM_ISO = `${WIN_FROM}T00:00:00-0${PAC_OFFSET_H}:00`;
const WIN_TO_ISO = `${WIN_TO}T23:59:59-0${PAC_OFFSET_H}:00`;
const NOTES_CUTOFF_ISO = new Date(CAPTURE_START_MS - 21 * 86400e3).toISOString();

// ---------------------------------------------------------------- snapshot folder
const hash8 = crypto.createHash('sha256').update(CAPTURE_START_ISO + '|' + GIT_HEAD).digest('hex').slice(0, 8);
const NEW_ID = `${CAPTURE_DATE_PAC}T${pacHHMM(CAPTURE_START_MS)}-${hash8}`;
const SNAP_ID = DIR_ARG ? String(DIR_ARG).replace(/[\\/]+$/, '') : NEW_ID;
const SNAP = path.join(SNAP_ROOT, SNAP_ID);
if (DIR_ARG && !fs.existsSync(SNAP)) {
  console.error(`--dir=${SNAP_ID} does not exist under ${SNAP_ROOT}`);
  process.exit(1);
}
fs.mkdirSync(SNAP, { recursive: true });

// ---------------------------------------------------------------- tee to capture.log
const LOG_PATH = path.join(SNAP, 'capture.log');
let logOpen = true;
const rawLog = console.log.bind(console);
const rawErr = console.error.bind(console);
const tee = (fn, prefix) => (...a) => {
  const line = a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
  fn(line);
  if (logOpen) { try { fs.appendFileSync(LOG_PATH, prefix + line + '\n'); } catch {} }
};
console.log = tee(rawLog, '');
console.error = tee(rawErr, 'ERR ');
const stopLog = () => { logOpen = false; };

console.log(`\n=== snapshot-week  READ ONLY  ===`);
console.log(`snapshot  ${SNAP_ID}${DIR_ARG ? '  (resuming existing folder)' : ''}`);
console.log(`folder    ${SNAP}`);
console.log(`captured  ${pacFull(CAPTURE_START_MS)}  /  ${CAPTURE_START_ISO}`);
console.log(`git HEAD  ${GIT_HEAD}`);
console.log(`part      ${PART}${FORCE ? '  --force' : ''}`);
console.log(`windows   visits/jobs ${WIN_FROM} .. ${WIN_TO}   notes since ${NOTES_CUTOFF_ISO.slice(0, 10)}`);
console.log('');

// ---------------------------------------------------------------- env (never logged)
function loadEnv() {
  const env = {};
  if (!fs.existsSync(ENV_PATH)) { console.error(`No .env at ${ENV_PATH} — run from the repo root.`); process.exit(1); }
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
const env = loadEnv();
// No value from `env` is ever printed, logged or written to a snapshot file.

function saveEnvKey(k, v) {
  let t = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp('^' + k + '=.*$', 'm');
  t = re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n';
  fs.writeFileSync(ENV_PATH, t);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------- Jobber auth + transport
let tok = null;
async function token() {
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await r.json();
  if (!d.access_token) { console.error('token refresh failed (response withheld — may contain secrets)'); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) {
    saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
    env.JOBBER_REFRESH_TOKEN = d.refresh_token;
    console.log('  (jobber refresh token rotated in .env)');
  }
  tok = d.access_token;
  return tok;
}
const onlyPermissionHides = errs => errs.every(e => /hidden due to permissions/i.test(e.message || ''));

// READ-ONLY GUARD: every query string is checked before it leaves the process.
function assertQueryOnly(q) {
  if (/\bmutation\b/i.test(q)) throw new Error('BLOCKED: request body contains "mutation" — this script is read-only');
}

async function g(q, v, a = 0, soft = false) {
  assertQueryOnly(q);
  const t = tok || await token();
  let r;
  try {
    r = await fetch('https://api.getjobber.com/api/graphql', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
      body: JSON.stringify({ query: q, variables: v }),
    });
  } catch (e) {
    if (a < 6) { await sleep(3000 * 2 ** a); return g(q, v, a + 1, soft); }
    throw e;
  }
  if (r.status === 401 && a < 3) { await token(); return g(q, v, a + 1, soft); }
  const d = await r.json().catch(() => ({}));
  const throttled = r.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && a < 9) {
    const wait = Math.min(90000, 3000 * 2 ** a);
    console.log(`  … throttled — backing off ${wait / 1000}s`);
    await sleep(wait);
    return g(q, v, a + 1, soft);
  }
  if (d.errors && !(d.data && onlyPermissionHides(d.errors))) {
    if (soft) return d;
    console.error('GraphQL errors: ' + JSON.stringify(d.errors).slice(0, 600));
    if (!d.data) process.exit(1);
  }
  // Leaky-bucket pacing: maximumAvailable 10000, restoreRate 500/s. Other sessions
  // may be pulling the same account, so top the bucket up rather than racing it down.
  const ts = d.extensions?.cost?.throttleStatus;
  if (ts && ts.currentlyAvailable < 5000) {
    const wait = Math.ceil(((5000 - ts.currentlyAvailable) / (ts.restoreRate || 500)) * 1000);
    await sleep(Math.min(wait, 20000));
  }
  return d;
}

// ---------------------------------------------------------------- OptimoRoute transport
const OR_BASE = 'https://api.optimoroute.com/v1';
const READ_ONLY = new Set(['get_routes', 'search_orders', 'get_completion_details', 'get_depots']);
const OR_KEY = env.OPTIMOROUTE_API_KEY;

async function orCall(endpoint, { body = null, query = '' } = {}) {
  if (!READ_ONLY.has(endpoint)) throw new Error(`BLOCKED: ${endpoint} is not a read-only endpoint`);
  const url = `${OR_BASE}/${endpoint}?key=${encodeURIComponent(OR_KEY)}${query}`;
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) await sleep(OPTIMO_SLEEP * Math.pow(2, attempt) + Math.random() * 300);
    try {
      const res = await fetch(url, body
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        : undefined);
      if (res.status === 429 || res.status >= 500) { lastErr = `HTTP ${res.status}`; continue; }
      const data = await res.json().catch(() => null);
      if (!data) { lastErr = 'unparseable body'; continue; }
      if (data.success === false) return { ok: false, error: `${data.code || 'ERR'}: ${data.message || ''}`.trim(), data };
      return { ok: true, data };
    } catch (e) { lastErr = e.message; }
  }
  return { ok: false, error: `retries exhausted (${lastErr})` };
}

// ---------------------------------------------------------------- checkpoints
const ck = name => path.join(SNAP, `.ckpt-${name}.json`);
const readCk = name => { try { return JSON.parse(fs.readFileSync(ck(name), 'utf8')); } catch { return null; } };
const writeCk = (name, obj) => fs.writeFileSync(ck(name), JSON.stringify(obj));
const clearCk = name => { try { fs.unlinkSync(ck(name)); } catch {} };

// ---------------------------------------------------------------- part files
const partFile = {
  jobs: 'jobs.json',
  visits: 'visits.json',
  notes: 'notes.json',
  users: 'users.json',
  optimo: 'optimo.json',
  config: 'config/_config-manifest.json',
};
const writeJson = (rel, obj) => {
  const p = path.join(SNAP, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 1));
};
function alreadyComplete(part) {
  const p = path.join(SNAP, partFile[part]);
  if (!fs.existsSync(p)) return false;
  try { JSON.parse(fs.readFileSync(p, 'utf8')); return true; } catch { return false; }
}

// ---------------------------------------------------------------- Jobber shaping
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

// Jobber custom-field labels carry trailing whitespace — trim, always.
const flatCf = f => {
  if (!f) return null;
  const base = { type: f.__typename, id: f.id, label: String(f.label ?? '').trim() };
  if (f.__typename === 'CustomFieldText') return { ...base, value: typeof f.valueText === 'string' ? f.valueText.trim() : f.valueText };
  if (f.__typename === 'CustomFieldNumeric') return { ...base, value: f.valueNumeric, unit: f.unit };
  if (f.__typename === 'CustomFieldDropdown') return { ...base, value: typeof f.valueDropdown === 'string' ? f.valueDropdown.trim() : f.valueDropdown };
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

// ---------------------------------------------------------------- part: jobs
async function pullJobs() {
  const passes = [
    { key: 'window', filter: { visitsScheduledBetween: { after: WIN_FROM_ISO, before: WIN_TO_ISO } } },
    { key: 'active', filter: { status: 'active' } },
  ];
  const byId = new Map();
  const prior = readCk('jobs');
  let startPass = 0, cursor = null;
  if (prior) {
    for (const j of prior.rows) byId.set(j.id, j);
    startPass = prior.passIdx; cursor = prior.cursor;
    console.log(`  resuming jobs from checkpoint: ${byId.size} jobs, pass ${passes[startPass]?.key}, cursor ${cursor ? 'set' : 'start'}`);
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
      if (!d.data?.jobs) { console.error('jobs query returned no data'); process.exit(1); }
      for (const j of d.data.jobs.nodes) {
        if (!byId.has(j.id)) byId.set(j.id, shapeJob(j, p.key));
        else if (!byId.get(j.id)._source.includes(p.key)) byId.get(j.id)._source += '+' + p.key;
      }
      pages++;
      const pinfo = d.data.jobs.pageInfo;
      cursor = pinfo.hasNextPage ? pinfo.endCursor : null;
      writeCk('jobs', { passIdx: pi, cursor, rows: [...byId.values()] });
      if (pages % 10 === 0) console.log(`  jobs[${p.key}] page ${pages}, ${byId.size} unique (totalCount ${d.data.jobs.totalCount})`);
      if (!cursor) break;
      await sleep(400);
    }
    console.log(`  jobs[${p.key}] done: ${pages} pages, ${byId.size} unique so far`);
    cursor = null;
  }

  const rows = [...byId.values()].sort((a, b) => a.jobNumber - b.jobNumber);
  writeJson(partFile.jobs, {
    part: 'jobs',
    capturedAt: CAPTURE_START_ISO,
    source: 'jobber graphql query jobs(filter:) — two passes unioned',
    passes: ['visitsScheduledBetween ' + WIN_FROM + '..' + WIN_TO, 'status:active'],
    count: rows.length,
    jobs: rows,
  });
  clearCk('jobs');
  console.log(`  wrote jobs.json — ${rows.length} jobs`);
  return { count: rows.length, rows };
}

// ---------------------------------------------------------------- part: visits
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
  const rows = prior?.rows || [];
  let cursor = prior?.cursor || null;
  if (prior) console.log(`  resuming visits from checkpoint: ${rows.length} rows`);
  const seen = new Set(rows.map(r => r.id));
  let pages = 0;
  for (;;) {
    const d = await g(Q, { a: cursor, after: WIN_FROM_ISO, before: WIN_TO_ISO, n: VISIT_PAGE });
    if (!d.data?.visits) { console.error('visits query returned no data'); process.exit(1); }
    for (const v of d.data.visits.nodes) {
      if (seen.has(v.id)) continue;
      seen.add(v.id);
      const a = v.property?.address || {};
      rows.push({
        id: v.id, title: v.title || '', startAt: v.startAt, endAt: v.endAt, duration: v.duration,
        isComplete: v.isComplete, completedAt: v.completedAt, createdAt: v.createdAt,
        visitStatus: v.visitStatus, instructions: v.instructions || null,
        overrideOrder: v.overrideOrder ?? null, routingOrder: v.routingOrder ?? null,
        jobId: v.job?.id || null, jobNumber: v.job?.jobNumber ?? null, jobStatus: v.job?.jobStatus || null,
        clientName: v.client?.name || null,
        assignedUsers: (v.assignedUsers?.nodes || []).map(u => u.name?.full).filter(Boolean),
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
  writeJson(partFile.visits, {
    part: 'visits',
    capturedAt: CAPTURE_START_ISO,
    source: 'jobber graphql query visits(filter:{startAt})',
    window: { from: WIN_FROM, to: WIN_TO, note: 'Pacific, capture date -14d .. +45d' },
    count: rows.length,
    visits: rows,
  });
  clearCk('visits');
  console.log(`  wrote visits.json — ${rows.length} visits over ${pages} pages`);
  return { count: rows.length };
}

// ---------------------------------------------------------------- part: notes
async function pullNotes(jobs) {
  const all = jobs.map(j => ({ id: j.id, jobNumber: j.jobNumber, client: j.client?.name || null, postalCode: j.property?.postalCode || null, jobStatus: j.jobStatus }));
  const prior = readCk('notes');
  const kept = prior?.kept || [];
  const doneIds = new Set(prior?.doneIds || []);
  let scanned = prior?.scanned || 0;
  if (prior) console.log(`  resuming notes from checkpoint: ${scanned} jobs scanned, ${kept.length} with in-window notes`);
  const todo = all.filter(j => !doneIds.has(j.id));
  console.log(`  notes: scanning ${todo.length} jobs (of ${all.length}) for notes since ${NOTES_CUTOFF_ISO}`);

  for (let k = 0; k < todo.length; k += NOTE_CHUNK) {
    const chunk = todo.slice(k, k + NOTE_CHUNK);
    const q = `query { ${chunk.map((j, n) => `j${n}: job(id: ${JSON.stringify(j.id)}) {
      id jobNumber notes(last: 10) { nodes { __typename ... on JobNote { id message createdAt createdBy { __typename ... on User { name { full } } } } } } }`).join(' ')} }`;
    const d = await g(q, {});
    for (const key of Object.keys(d.data || {})) {
      const j = d.data[key];
      if (!j) continue;
      doneIds.add(j.id);
      const src = chunk.find(c => c.id === j.id) || {};
      const inWindow = (j.notes?.nodes || [])
        .filter(n => n && n.__typename === 'JobNote' && n.createdAt && n.createdAt >= NOTES_CUTOFF_ISO)
        .map(n => ({ id: n.id, createdAt: n.createdAt, message: n.message, createdBy: n.createdBy?.name?.full || n.createdBy?.__typename || null }));
      if (inWindow.length) {
        kept.push({
          jobId: j.id, jobNumber: j.jobNumber,
          client: src.client ?? null, postalCode: src.postalCode ?? null, jobStatus: src.jobStatus ?? null,
          notes: inWindow.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
        });
      }
    }
    // chunk members that came back null still count as scanned
    for (const c of chunk) doneIds.add(c.id);
    scanned = doneIds.size;
    writeCk('notes', { kept, doneIds: [...doneIds], scanned });
    const n = k / NOTE_CHUNK + 1;
    if (n % 10 === 0 || k + NOTE_CHUNK >= todo.length) {
      console.log(`  notes chunk ${n}/${Math.ceil(todo.length / NOTE_CHUNK)} — ${scanned} jobs scanned, ${kept.length} with notes`);
    }
    await sleep(400);
  }

  kept.sort((a, b) => a.jobNumber - b.jobNumber);
  const noteCount = kept.reduce((s, r) => s + r.notes.length, 0);
  writeJson(partFile.notes, {
    part: 'notes',
    capturedAt: CAPTURE_START_ISO,
    source: 'jobber graphql batched-alias job(id:){ notes(last:10) }, filtered client-side',
    cutoff: NOTES_CUTOFF_ISO,
    jobsScanned: scanned,
    jobsWithNotes: kept.length,
    noteCount,
    jobs: kept,
  });
  clearCk('notes');
  console.log(`  wrote notes.json — ${kept.length} jobs with in-window notes, ${noteCount} notes (scanned ${scanned})`);
  return { count: noteCount, jobsWithNotes: kept.length, jobsScanned: scanned };
}

// ---------------------------------------------------------------- part: users
async function pullUsers() {
  // Try the richest shape first; degrade field-by-field rather than losing the part.
  const attempts = [
    { label: 'id name.full email.raw status isAccountAdmin', sel: 'id name { full } email { raw } status isAccountAdmin' },
    { label: 'id name.full email.raw status', sel: 'id name { full } email { raw } status' },
    { label: 'id name.full status', sel: 'id name { full } status' },
    { label: 'id name.full', sel: 'id name { full }' },
    { label: 'id', sel: 'id' },
  ];
  const tried = [];
  for (const at of attempts) {
    const q = `query { users(first: 50) { nodes { ${at.sel} } totalCount pageInfo { hasNextPage endCursor } } }`;
    const d = await g(q, {}, 0, true);
    if (d.data?.users?.nodes) {
      const nodes = d.data.users.nodes;
      tried.push({ fields: at.label, ok: true });
      writeJson(partFile.users, {
        part: 'users',
        capturedAt: CAPTURE_START_ISO,
        source: 'jobber graphql query users(first:50)',
        fieldsCaptured: at.label,
        attempts: tried,
        totalCount: d.data.users.totalCount ?? null,
        hasNextPage: d.data.users.pageInfo?.hasNextPage ?? null,
        count: nodes.length,
        users: nodes.map(u => ({
          id: u.id,
          name: u.name?.full ?? null,
          email: u.email?.raw ?? null,
          status: u.status ?? null,
          isAccountAdmin: u.isAccountAdmin ?? null,
        })),
      });
      console.log(`  wrote users.json — ${nodes.length} users (fields: ${at.label})`);
      return { count: nodes.length, fields: at.label };
    }
    const msg = JSON.stringify(d.errors || d).slice(0, 200);
    tried.push({ fields: at.label, ok: false, error: msg });
    console.log(`  users: field set rejected (${at.label}) — degrading`);
  }
  writeJson(partFile.users, {
    part: 'users', capturedAt: CAPTURE_START_ISO, source: 'jobber graphql query users(first:50)',
    count: 0, users: [], attempts: tried, gap: 'every users(...) field set was rejected — no user list captured',
  });
  console.error('  users part returned a GAP — no field set accepted');
  return { count: 0, gap: 'all field sets rejected' };
}

// ---------------------------------------------------------------- part: optimo
const minsOf = dt => {
  if (!dt) return null;
  const m = String(dt).match(/(\d{2}):(\d{2}):?(\d{2})?/);
  return m ? Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number(m[3]) / 60 : 0) : null;
};
const round = (n, p = 2) => (n == null || Number.isNaN(n) ? null : Number(n.toFixed(p)));

function nextWeekdays(startYmd, n) {
  const out = [];
  let cur = startYmd;
  while (out.length < n) {
    const dow = new Date(cur + 'T12:00:00Z').getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

async function fetchOrders(date) {
  const orders = [];
  let after = null;
  for (let page = 0; page < 40; page++) {
    const body = { dateRange: { from: date, to: date }, includeOrderData: true, includeScheduleInformation: true };
    if (after) body.after_tag = after;
    const r = await orCall('search_orders', { body });
    await sleep(OPTIMO_SLEEP);
    if (!r.ok) return { orders, error: r.error };
    orders.push(...(r.data.orders || []));
    after = r.data.after_tag || null;
    if (!after) break;
  }
  return { orders, error: null };
}

async function pullOptimo() {
  if (!OR_KEY) {
    writeJson(partFile.optimo, { part: 'optimo', capturedAt: CAPTURE_START_ISO, dates: [], gaps: [{ date: null, reason: 'OPTIMOROUTE_API_KEY missing from .env' }], count: 0 });
    console.error('  optimo: OPTIMOROUTE_API_KEY missing — gap recorded');
    return { count: 0, gap: 'OPTIMOROUTE_API_KEY missing' };
  }
  const dates = nextWeekdays(CAPTURE_DATE_PAC, 21);
  console.log(`  optimo: ${dates.length} weekdays ${dates[0]} .. ${dates[dates.length - 1]}`);

  const depotRes = await orCall('get_depots');
  await sleep(OPTIMO_SLEEP);
  const depots = depotRes.ok ? (depotRes.data.depots || []) : [];
  if (!depotRes.ok) console.log(`  get_depots failed: ${depotRes.error}`);

  const out = { part: 'optimo', capturedAt: CAPTURE_START_ISO,
    source: 'optimoroute get_routes + search_orders (read-only allow-list)',
    units: { 'stops[].travelDistanceM': 'metres', 'stops[].travelTimeSec': 'seconds', routeDistanceKm: 'kilometres', routeDurationMin: 'minutes', serviceDurationMin: 'minutes' },
    depots, dates: [], gaps: [], totals: {} };

  let totalStops = 0;
  for (const date of dates) {
    const routeRes = await orCall('get_routes', { query: `&date=${encodeURIComponent(date)}` });
    await sleep(OPTIMO_SLEEP);

    if (!routeRes.ok) {
      console.log(`  ${date}  ROUTES FAILED: ${routeRes.error}`);
      out.gaps.push({ date, reason: `get_routes failed: ${routeRes.error}` });
      out.dates.push({ date, status: 'error', routes: [], routeCount: 0, stops: 0, orders: 0 });
      continue;
    }
    const routes = routeRes.data.routes || [];
    if (!routes.length) {
      // A real gap — OptimoRoute holds no plan for that date. Recorded, never filled.
      console.log(`  ${date}  NO ROUTES (gap recorded)`);
      out.gaps.push({ date, reason: 'get_routes returned zero routes' });
      out.dates.push({ date, status: 'empty', routes: [], routeCount: 0, stops: 0, orders: 0 });
      continue;
    }

    const { orders, error: orderErr } = await fetchOrders(date);
    const orderByNo = new Map();
    for (const o of orders) if (o?.data?.orderNo) orderByNo.set(o.data.orderNo, o);

    const outRoutes = [];
    let dayStops = 0;
    for (const rt of routes) {
      const stops = (rt.stops || []).map(s => {
        const od = orderByNo.get(s.orderNo)?.data || null;
        const arrMin = minsOf(s.arrivalTimeDt || s.scheduledAtDt);
        const serviceMin = od?.duration ?? null;
        return {
          stopNumber: s.stopNumber, orderNo: s.orderNo, orderId: s.id,
          locationName: s.locationName || null, locationNo: s.locationNo || null,
          address: s.address || null, latitude: s.latitude ?? null, longitude: s.longitude ?? null,
          scheduledAt: s.scheduledAt || null, scheduledAtDt: s.scheduledAtDt || null,
          arrivalTimeDt: s.arrivalTimeDt || null,
          arrivalMinutes: round(arrMin, 2),
          departureMinutes: arrMin != null && serviceMin != null ? round(arrMin + serviceMin, 2) : null,
          travelTimeSec: s.travelTime ?? null,
          travelDistanceM: s.distance ?? null,
          serviceDurationMin: serviceMin,
          priority: od?.priority ?? null, orderType: od?.type ?? null,
          assignedTo: od?.assignedTo?.serial ?? null,
          timeWindows: od?.timeWindows ?? [],
          allowedDates: od?.allowedDates ?? null,
          orderNotes: od?.notes ?? null,
        };
      });
      const arrivals = stops.map(s => s.arrivalMinutes).filter(v => v != null);
      const first = stops[0] || null, last = stops[stops.length - 1] || null;
      const legTravelSec = stops.reduce((a, s) => a + (s.travelTimeSec || 0), 0);
      const legDistanceM = stops.reduce((a, s) => a + (s.travelDistanceM || 0), 0);
      const serviceSum = stops.reduce((a, s) => a + (s.serviceDurationMin || 0), 0);
      const startMin = arrivals.length ? Math.min(...arrivals) - ((first?.travelTimeSec || 0) / 60) : null;
      const endMin = last && last.arrivalMinutes != null ? last.arrivalMinutes + (last.serviceDurationMin || 0) : null;
      dayStops += stops.length;
      outRoutes.push({
        driverSerial: rt.driverSerial ?? null, driverName: rt.driverName ?? null,
        driverExternalId: rt.driverExternalId ?? '',
        vehicleRegistration: rt.vehicleRegistration ?? null, vehicleLabel: rt.vehicleLabel ?? null,
        locked: rt.locked ?? null,
        routeDistanceKm: rt.distance ?? null, routeDurationMin: rt.duration ?? null,
        derived: {
          stopCount: stops.length,
          firstStopScheduledAt: first?.scheduledAt ?? null,
          lastStopScheduledAt: last?.scheduledAt ?? null,
          routeStartMinutes: round(startMin, 2),
          routeEndMinutes: round(endMin, 2),
          onSiteSpanMinutes: startMin != null && endMin != null ? round(endMin - startMin, 2) : null,
          legTravelMinutes: round(legTravelSec / 60, 2),
          legDistanceKm: round(legDistanceM / 1000, 3),
          legDistanceMiles: round(legDistanceM / 1609.344, 3),
          serviceMinutes: round(serviceSum, 2),
        },
        stops,
      });
    }
    totalStops += dayStops;
    const warnings = [orderErr && `search_orders: ${orderErr}`].filter(Boolean);
    if (warnings.length) out.gaps.push({ date, reason: warnings.join('; ') });
    out.dates.push({
      date, status: 'ok', routeCount: routes.length, stops: dayStops, orders: orders.length,
      ordersMatched: routes.flatMap(r => r.stops || []).filter(s => orderByNo.has(s.orderNo)).length,
      warnings, routes: outRoutes,
    });
    console.log(`  ${date}  routes=${routes.length} stops=${dayStops} orders=${orders.length}` + (warnings.length ? '  WARN: ' + warnings.join('; ') : ''));
  }

  out.totals = {
    datesRequested: dates.length,
    datesWithRoutes: out.dates.filter(d => d.status === 'ok').length,
    datesWithGaps: out.gaps.length,
    stops: totalStops,
  };
  writeJson(partFile.optimo, out);
  console.log(`  wrote optimo.json — ${out.totals.datesWithRoutes}/${dates.length} dates with routes, ${totalStops} stops, ${out.gaps.length} gaps`);
  return { count: totalStops, gaps: out.gaps.length, datesWithRoutes: out.totals.datesWithRoutes };
}

// ---------------------------------------------------------------- part: config
function copyConfig() {
  const srcs = [
    { name: 'territories.json', rel: 'projects/briefs/technician-route-automation/territories.json' },
    { name: 'tech-service-times.json', rel: 'projects/briefs/technician-route-automation/tech-service-times.json' },
    { name: 'cycle-times-gps.json', rel: 'projects/briefs/route-engine/redesign/data/cycle-times-gps.json' },
  ];
  const rec = [];
  fs.mkdirSync(path.join(SNAP, 'config'), { recursive: true });
  for (const s of srcs) {
    const abs = path.join(ROOT, s.rel);
    if (!fs.existsSync(abs)) {
      rec.push({ name: s.name, source: s.rel, copied: false, note: 'MISSING at capture time' });
      console.log(`  config: MISSING ${s.rel}`);
      continue;
    }
    const buf = fs.readFileSync(abs);
    fs.writeFileSync(path.join(SNAP, 'config', s.name), buf);
    rec.push({ name: s.name, source: s.rel, copied: true, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), sourceMtime: fs.statSync(abs).mtime.toISOString() });
    console.log(`  config: copied ${s.name} (${buf.length} bytes)`);
  }
  writeJson(partFile.config, { part: 'config', capturedAt: CAPTURE_START_ISO, files: rec, missing: rec.filter(r => !r.copied).map(r => r.name) });
  return { count: rec.filter(r => r.copied).length, missing: rec.filter(r => !r.copied).map(r => r.name) };
}

// ---------------------------------------------------------------- manifest
function walk(dir, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
    else out.push(rel);
  }
  return out.sort();
}

function buildManifest(partRecords, endMs) {
  const prior = (() => { try { return JSON.parse(fs.readFileSync(path.join(SNAP, 'manifest.json'), 'utf8')); } catch { return null; } })();
  const files = {};
  for (const rel of walk(SNAP)) {
    if (rel === 'manifest.json') continue;   // cannot hash itself
    files[rel] = crypto.createHash('sha256').update(fs.readFileSync(path.join(SNAP, rel))).digest('hex');
  }
  const runs = [...(prior?.runs || []), {
    argv: process.argv.slice(1),
    part: PART, force: FORCE,
    startPacific: pacFull(CAPTURE_START_MS), startUtc: CAPTURE_START_ISO,
    endPacific: pacFull(endMs), endUtc: new Date(endMs).toISOString(),
    elapsedSeconds: Number(((endMs - CAPTURE_START_MS) / 1000).toFixed(1)),
    gitHead: GIT_HEAD,
  }];
  const parts = { ...(prior?.parts || {}), ...partRecords };
  return {
    snapshotId: SNAP_ID,
    immutable: 'Snapshots are never edited or corrected in place. A wrong snapshot gets a NEW snapshot; this one stays as the record of what was true at capture time. See snapshots/README.md.',
    readOnly: 'Captured with query-only Jobber GraphQL and the OptimoRoute read-only endpoint allow-list. No write was issued.',
    capture: {
      startPacific: prior?.capture?.startPacific || pacFull(CAPTURE_START_MS),
      startUtc: prior?.capture?.startUtc || CAPTURE_START_ISO,
      endPacific: pacFull(endMs),
      endUtc: new Date(endMs).toISOString(),
      pacificOffsetHours: PAC_OFFSET_H,
    },
    gitHead: GIT_HEAD,
    argv: process.argv.slice(1),
    windows: {
      visitsAndJobs: { from: WIN_FROM, to: WIN_TO, note: 'Pacific, capture date -14d .. +45d' },
      notesSince: NOTES_CUTOFF_ISO,
      optimoWeekdays: 21,
    },
    parts,
    runs,
    fileDigests: files,
    fileDigestNote: 'sha256 of every file in the snapshot folder except manifest.json itself. capture.log is hashed at manifest-write time; nothing is appended to it afterwards.',
  };
}

// ---------------------------------------------------------------- run
const partRecords = {};
async function runPart(name, fn) {
  if (!wants(name)) return null;
  if (!FORCE && alreadyComplete(name)) {
    console.log(`[${name}] already complete in this folder — skipped (use --force to re-pull)`);
    return null;
  }
  console.log(`[${name}] starting…`);
  const t = Date.now();
  let res, status = 'ok', error = null;
  try { res = await fn(); }
  catch (e) { status = 'failed'; error = e.message; console.error(`[${name}] FAILED: ${e.message}`); }
  const secs = Number(((Date.now() - t) / 1000).toFixed(1));
  partRecords[name] = { status, elapsedSeconds: secs, ranAt: new Date().toISOString(), ...(res || {}), ...(error ? { error } : {}) };
  if (partRecords[name].rows) delete partRecords[name].rows;
  console.log(`[${name}] ${status} in ${secs}s` + (res?.count != null ? ` — ${res.count} records` : ''));
  return res;
}

let jobsRes = await runPart('jobs', pullJobs);

await runPart('visits', pullVisits);

if (wants('notes') && (FORCE || !alreadyComplete('notes'))) {
  let jobRows = jobsRes?.rows;
  if (!jobRows) {
    const jp = path.join(SNAP, 'jobs.json');
    if (!fs.existsSync(jp)) {
      console.error('[notes] cannot run — jobs.json is not in this snapshot folder. Run --part=jobs first.');
      partRecords.notes = { status: 'failed', elapsedSeconds: 0, error: 'jobs.json missing — run --part=jobs first' };
    } else {
      jobRows = JSON.parse(fs.readFileSync(jp, 'utf8')).jobs;
    }
  }
  if (jobRows) await runPart('notes', () => pullNotes(jobRows));
} else {
  await runPart('notes', async () => null); // handles the skip/log path
}

await runPart('users', pullUsers);
await runPart('optimo', pullOptimo);
await runPart('config', async () => copyConfig());

// manifest last, always — it must describe what is actually on disk
const END_MS = Date.now();
console.log('');
console.log(`rebuilding manifest…`);
stopLog();
const manifest = buildManifest(partRecords, END_MS);
fs.writeFileSync(path.join(SNAP, 'manifest.json'), JSON.stringify(manifest, null, 1));
rawLog(`wrote manifest.json — ${Object.keys(manifest.fileDigests).length} files hashed`);
rawLog(`\nDONE  ${SNAP}`);
rawLog(`total ${((END_MS - CAPTURE_START_MS) / 1000).toFixed(1)}s`);
for (const [k, v] of Object.entries(partRecords)) {
  rawLog(`  ${k.padEnd(7)} ${String(v.status).padEnd(7)} ${String(v.elapsedSeconds).padStart(7)}s  ${v.count != null ? v.count + ' records' : ''}${v.error ? '  ' + v.error : ''}`);
}
