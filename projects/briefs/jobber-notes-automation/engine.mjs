// engine.mjs — Got Moles Jobber notes automation, per-date orchestrator.
//
// For a given date: pull jobs visited that day, parse the latest note, and compute the
// follow-up visit plan per the CANONICAL scheduling rules in brief.md. Dry-run by default;
// pass --execute to perform the reschedules/adds against the live Jobber account.
//
// Usage (run from repo root):
//   node projects/briefs/jobber-notes-automation/engine.mjs [--date=YYYY-MM-DD] [--jobs=40] [--execute] [--json]
//
// Reuses the tool-jobber skill's authenticated GraphQL client (token refresh handled there).

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { parseNote } from './parse-note.mjs';
import { decideVisit } from './decide.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBBER = path.resolve(__dirname, '../../../.claude/skills/tool-jobber/scripts/jobber-api.mjs');
const TZ = 'America/Los_Angeles';

const argv = process.argv.slice(2);
const arg = k => (argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const TODAY = arg('date') || new Date().toISOString().slice(0, 10);
const JOBS_N = +arg('jobs') || 40;
const EXECUTE = argv.includes('--execute');
const JSON_OUT = argv.includes('--json');
const LOG = argv.includes('--log');

// console + optional capture for a dated review file
const buf = [];
const say = (...a) => { const line = a.join(' '); buf.push(line); console.log(line); };

// --- Jobber GraphQL via the skill's CLI ---
// Retries transient token/refresh races (rotation can 401 a concurrent refresh).
function gql(query, attempt = 0) {
  try {
    const out = execFileSync('node', [JOBBER, 'query', query], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (/GraphQL errors/i.test(out)) throw new Error(out.trim());
    const i = out.indexOf('{');
    if (i < 0) throw new Error('No JSON from jobber-api: ' + out.slice(0, 300));
    const j = JSON.parse(out.slice(i));
    return j.data || j;
  } catch (e) {
    const transient = /HTTP 401|Token request failed|ECONNRESET|ETIMEDOUT|handle->flags/i.test(e.message || '');
    if (transient && attempt < 3) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500 * (attempt + 1)); // sync backoff
      return gql(query, attempt + 1);
    }
    throw e;
  }
}

// --- date helper (Jobber startAt is midnight-local, so the date part is the local date) ---
const localDate = startAt => String(startAt).slice(0, 10);

// --- pull jobs + latest note + upcoming visits ---
function fetchJobs() {
  const q = `query { jobs(first: ${JOBS_N}) { nodes {
    id jobNumber client { name }
    notes(first: 50) { nodes { __typename ... on JobNote { message createdAt } } }
    visits(first: 4, filter: { status: UPCOMING }) { nodes { id startAt assignedUsers(first: 3) { nodes { id } } } }
  } } }`;
  return gql(q).jobs.nodes;
}

// --- decide the action for one job ---
function planFor(job) {
  const jobNotes = (job.notes.nodes || []).filter(n => n.__typename === 'JobNote' && n.message);
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
    client: job.client?.name || '(no client)',
    completed, nextAction: parsed.nextAction || '(none)',
    activity: parsed.activity, moles: parsed.moles,
    nextVisit: next ? next.date : null,
    target: d.target || null, action: d.action, visitId: d.visitId, tech: d.tech, detail,
  };
}

// --- executors ---
function execPull(p) {
  const m = `mutation { visitEditSchedule(id: "${p.visitId}", input: {
    startAt: { date: "${p.target}", timezone: "${TZ}" }, endAt: { date: "${p.target}", timezone: "${TZ}" }
  }) { visit { startAt } userErrors { message } } }`;
  const r = gql(m).visitEditSchedule;
  if (r.userErrors?.length) throw new Error(JSON.stringify(r.userErrors));
  return r.visit.startAt;
}
function execAdd(p) {
  const tech = p.tech?.length ? `, teamMemberIdsToAssign: [${p.tech.map(t => `"${t}"`).join(', ')}]` : '';
  const m = `mutation { visitCreate(jobId: "${p.jobId}", input: { visits: [{ title: ${JSON.stringify(p.client)}, schedule: {
    startAt: { date: "${p.target}", timezone: "${TZ}" }, endAt: { date: "${p.target}", timezone: "${TZ}" }${tech}
  } }] }) { createdVisits { startAt } userErrors { message } } }`;
  const r = gql(m).visitCreate;
  if (r.userErrors?.length) throw new Error(JSON.stringify(r.userErrors));
  return r.createdVisits[0].startAt;
}

// --- run ---
const jobs = fetchJobs();
const plans = jobs.map(planFor).filter(Boolean);

if (JSON_OUT) { console.log(JSON.stringify({ date: TODAY, plans }, null, 2)); process.exit(0); }

const tag = { PULL: '⏪ PULL ', ADD: '➕ ADD  ', LEAVE: '   leave', ALREADY: '✓ done  ', TASK: '📋 task ' };
say(`\nGot Moles — visit-note automation ${EXECUTE ? '⚡ EXECUTE' : '🔍 DRY RUN'} — completed ${TODAY}`);
say(`Scanned ${jobs.length} recent jobs; ${plans.length} were visited on ${TODAY}.\n`);
for (const p of plans) {
  let status = tag[p.action] || p.action;
  if (EXECUTE && (p.action === 'PULL' || p.action === 'ADD')) {
    try { const at = p.action === 'PULL' ? execPull(p) : execAdd(p); status = (p.action === 'PULL' ? '⏪ PULLED' : '➕ ADDED ') + ` @${localDate(at)}`; }
    catch (e) { status = '❌ FAIL: ' + e.message.slice(0, 120); }
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
