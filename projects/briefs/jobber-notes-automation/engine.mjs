// engine.mjs — Got Moles Jobber notes automation, per-date orchestrator.
//
// For a given date: pull jobs visited that day, parse the latest note, and compute the
// follow-up visit plan per the CANONICAL scheduling rules in brief.md. Dry-run by default;
// pass --execute to perform the reschedules/adds against the live Jobber account.
//
// Read strategy (v2, 2026-07-10): visits-first, same as report-sync.mjs. Page the day's
// visits (cheap), dedup to their jobs, then fetch notes + upcoming visits for ONLY those
// jobs in aliased batches. The old unfiltered jobs(first: N) pull missed most of a day's
// visited jobs (0 of 65 on 2026-07-09).
//
// Auth: sanctioned direct-fetch pattern (refresh at start, rotated token persisted to
// .env, re-refresh on 401) — NOT the tool-jobber CLI, which treats Jobber's partial
// "RequestNote ... hidden due to permissions" errors as fatal and drops the data.
//
// Usage (run from repo root):
//   node projects/briefs/jobber-notes-automation/engine.mjs [--date=YYYY-MM-DD] [--execute] [--json] [--log]

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { parseNote } from './parse-note.mjs';
import { decideVisit } from './decide.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const GQL_VERSION = '2025-04-16';
const TZ = 'America/Los_Angeles';

const argv = process.argv.slice(2);
const arg = k => (argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const TODAY = arg('date') || new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const CHUNK = +arg('chunk') || 15;
const EXECUTE = argv.includes('--execute');
const JSON_OUT = argv.includes('--json');
const LOG = argv.includes('--log');

// console + optional capture for a dated review file
const buf = [];
const say = (...a) => { const line = a.join(' '); buf.push(line); console.log(line); };

// ---------- auth (persist rotated refresh token, same as jobber-api.mjs) ----------
function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : txt + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}
let accessToken = null, tokenAt = 0;
async function getToken(force = false) {
  if (!force && accessToken && Date.now() - tokenAt < 50 * 60 * 1000) return accessToken;
  const env = loadEnv();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`Token refresh failed HTTP ${res.status}`, JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token;
  tokenAt = Date.now();
  return accessToken;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const onlyPermissionHides = errs => errs.every(e => /hidden due to permissions/i.test(e.message || ''));

async function gql(query, attempt = 0) {
  const token = await getToken();
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-JOBBER-GRAPHQL-VERSION': GQL_VERSION,
    },
    body: JSON.stringify({ query }),
  });
  if (res.status === 401 && attempt < 2) { await getToken(true); return gql(query, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 6) {
    const wait = Math.min(60000, 2000 * 2 ** attempt);
    console.log(`  … throttled — backing off ${wait / 1000}s`);
    await sleep(wait);
    return gql(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  if (data.errors && !(data.data && onlyPermissionHides(data.errors))) {
    throw new Error(`GraphQL: ${JSON.stringify(data.errors).slice(0, 300)}`);
  }
  return data.data;
}

// --- date helpers ---
const localDate = startAt => String(startAt).slice(0, 10);
// PT day [00:00, 24:00) expressed in UTC (handles PDT/PST).
function ptDayBoundsUtc(date) {
  const mk = (yy, mm, dd) => {
    const noonUtc = new Date(Date.UTC(yy, mm - 1, dd, 12));
    const ptHour = +noonUtc.toLocaleString('en-US', { timeZone: TZ, hour: '2-digit', hour12: false });
    return new Date(Date.UTC(yy, mm - 1, dd, 12 - ptHour)).toISOString();
  };
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return { after: mk(y, m, d), before: mk(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()) };
}

// --- pull the day's visited jobs (visits-first), then notes + upcoming visits per job ---
// Visit scan reaches 2 days BACK from the run date: techs sometimes write the note the
// day after the visit (seen live: visited 07-09, note created 07-10 — invisible to both
// days' runs when the scan covered only the run date). The latest-note-date == run-date
// check below still decides which jobs actually get processed.
async function fetchJobs() {
  const scanFrom = (d => { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd - 2)).toISOString().slice(0, 10); })(TODAY);
  const { after } = ptDayBoundsUtc(scanFrom);
  const { before } = ptDayBoundsUtc(TODAY);
  const jobsById = new Map();
  let cursor = null, pages = 0;
  for (;;) {
    pages++;
    const afterArg = cursor ? `, after: "${cursor}"` : '';
    const v = (await gql(`query { visits(first: 100${afterArg}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
      nodes { id job { id } }
      pageInfo { hasNextPage endCursor } } }`)).visits;
    for (const n of v.nodes) if (n.job) jobsById.set(n.job.id, true);
    if (!v.pageInfo.hasNextPage || pages >= 10) break;
    cursor = v.pageInfo.endCursor;
    await sleep(400);
  }
  // Follow-up check = visits by DATE (anything after the noted day), NOT status UPCOMING:
  // a follow-up that's happening today or already completed isn't UPCOMING anymore and
  // would be falsely reported missing (the Mike Coile case, 2026-07-10).
  const JOB_SEL = `id jobNumber jobType jobStatus jobberWebUri client { name }
    notes(last: 40) { nodes { __typename ... on JobNote { message createdAt } } }
    visits(first: 6, filter: { startAt: { after: "${before}" } }) { nodes { id startAt assignedUsers(first: 3) { nodes { id } } } }`;
  const ids = [...jobsById.keys()];
  const jobs = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const q = `query { ${chunk.map((id, k) => `j${k}: job(id: ${JSON.stringify(id)}) { ${JOB_SEL} }`).join(' ')} }`;
    const d = await gql(q);
    for (const k of Object.keys(d)) if (d[k]) jobs.push(d[k]);
    if (i + CHUNK < ids.length) await sleep(600);
  }
  return jobs;
}

// --- decide the action for one job ---
function planFor(job) {
  const jobNotes = (job.notes.nodes || []).filter(n => n && n.__typename === 'JobNote' && n.message);
  if (!jobNotes.length) return null;
  const latest = jobNotes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  const completed = localDate(latest.createdAt);
  if (completed !== TODAY) return null; // only jobs whose latest note is from the target date

  const parsed = parseNote(latest.message);
  const upcoming = (job.visits.nodes || [])
    .map(v => ({ id: v.id, date: localDate(v.startAt), tech: (v.assignedUsers.nodes || []).map(u => u.id) }));
  const next = [...upcoming].sort((a, b) => a.date.localeCompare(b.date))[0] || null;

  const d = decideVisit(completed, parsed.nextAction, upcoming);
  const detail = {
    PULL: `pull ${next ? next.date : ''} → ${d.target}`,
    ADD: `add new visit ${d.target} (next scheduled ${next ? next.date : 'none'} kept)`,
    LEAVE: d.reason || 'leave',
    ALREADY: `visit already near ${d.target}`,
    TASK: 'Convert to annual — raise Task (not scheduling)',
  }[d.action] || d.action;

  return {
    jobNumber: job.jobNumber, jobId: job.id,
    jobType: job.jobType, jobStatus: job.jobStatus, webUri: job.jobberWebUri,
    client: job.client?.name || '(no client)',
    completed, nextAction: parsed.nextAction || '(none)',
    activity: parsed.activity, moles: parsed.moles,
    nextVisit: next ? next.date : null,
    target: d.target || null, action: d.action, visitId: d.visitId, tech: d.tech, detail,
  };
}

// --- executors ---
async function execPull(p) {
  const m = `mutation { visitEditSchedule(id: "${p.visitId}", input: {
    startAt: { date: "${p.target}", timezone: "${TZ}" }, endAt: { date: "${p.target}", timezone: "${TZ}" }
  }) { visit { startAt } userErrors { message } } }`;
  const r = (await gql(m)).visitEditSchedule;
  if (r.userErrors?.length) throw new Error(JSON.stringify(r.userErrors));
  return r.visit.startAt;
}
async function execAdd(p) {
  const tech = p.tech?.length ? `, teamMemberIdsToAssign: [${p.tech.map(t => `"${t}"`).join(', ')}]` : '';
  const m = `mutation { visitCreate(jobId: "${p.jobId}", input: { visits: [{ title: ${JSON.stringify(p.client)}, schedule: {
    startAt: { date: "${p.target}", timezone: "${TZ}" }, endAt: { date: "${p.target}", timezone: "${TZ}" }${tech}
  } }] }) { createdVisits { startAt } userErrors { message } } }`;
  const r = (await gql(m)).visitCreate;
  if (r.userErrors?.length) throw new Error(JSON.stringify(r.userErrors));
  return r.createdVisits[0].startAt;
}

// --- run ---
const jobs = await fetchJobs();
const plans = jobs.map(planFor).filter(Boolean);

if (JSON_OUT) { console.log(JSON.stringify({ date: TODAY, plans }, null, 2)); process.exit(0); }

const tag = { PULL: '⏪ PULL ', ADD: '➕ ADD  ', LEAVE: '   leave', ALREADY: '✓ done  ', TASK: '📋 task ' };
say(`\nGot Moles — visit-note automation ${EXECUTE ? '⚡ EXECUTE' : '🔍 DRY RUN'} — completed ${TODAY}`);
say(`Day's visited jobs: ${jobs.length}; ${plans.length} have a note from ${TODAY}.\n`);
for (const p of plans) {
  let status = tag[p.action] || p.action;
  if (EXECUTE && (p.action === 'PULL' || p.action === 'ADD')) {
    try { const at = p.action === 'PULL' ? await execPull(p) : await execAdd(p); status = (p.action === 'PULL' ? '⏪ PULLED' : '➕ ADDED ') + ` @${localDate(at)}`; }
    catch (e) { status = '❌ FAIL: ' + e.message.slice(0, 120); }
    await sleep(300);
  }
  say(`${status} | ${String(p.jobNumber).padEnd(5)} ${p.client.slice(0, 22).padEnd(22)} | ${p.nextAction.padEnd(22)} | ${p.detail}`);
}
const c = a => plans.filter(p => p.action === a).length;
say(`\nPULL ${c('PULL')}  ADD ${c('ADD')}  leave ${c('LEAVE')}  already ${c('ALREADY')}  task ${c('TASK')}`);
say(EXECUTE ? 'Executed live.' : 'No writes made. Re-run with --execute to perform PULL/ADD actions.');

if (LOG) {
  const dir = path.join(__dirname, 'runs');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${TODAY}${EXECUTE ? '-executed' : '-dryrun'}.txt`);
  fs.writeFileSync(file, buf.join('\n') + '\n');
  console.log(`\nReview log written: ${file}`);
}
