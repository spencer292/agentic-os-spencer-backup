#!/usr/bin/env node
// add-nextweek-visits-0801.mjs — one-shot: book the follow-up visits that technician
// notes asked for and never got (audit: runs/followup-misses-2026-08-01.md).
//
// Approved by Spencer 2026-08-01: 7 adds from the 'missing next week' list, split across
// weeks 8/3 and 8/10 per the activity-cadence rule (LA -> 7-14d, NA -> ~14d).
// #7840 Wrisley EXCLUDED: NA ideal ~8/17, already has 8/19. The 9 'ok' jobs untouched.
//
// Rules honoured:
//  - Interim ADD only — the recurring visit is left exactly where it is, so no downstream
//    gap is created (the 2026-07-06 Annette Wood error / Avila 7/30 lesson).
//  - Target = the zip's territory-grid v5 day inside the required week. Mon-Fri only.
//  - Created all-day (00:00-23:59 PT) => push-week treats it as FLEXIBLE and the optimizer
//    places it; techs are NOT pinned here (grid v5 runs lockTechs=false).
//  - GUARD: refuses to create if the job already has any visit within +/-3 days of target.
//
// Usage: node projects/briefs/jobber-notes-automation/add-nextweek-visits-0801.mjs dry|live

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';
const GQL_VERSION = '2025-04-16';

const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: dry|live'); process.exit(1); }

// job, client, jobId, target date, why
const ADDS = [
  { job: '6492', client: 'Greg Hastings', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMTE1NzIwMDg=', date: '2026-08-03', why: 'LA, caught 0, last 2026-07-27, was 2026-08-24 (28d). Medina 98039 -> mon.' },
  { job: '8089', client: 'Klaudia Elam', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xNDk0OTg4MTc=', date: '2026-08-04', why: 'LA, caught 0, last 2026-07-28, was NOTHING SCHEDULED. Seattle 98136 -> tue.' },
  { job: '6396', client: 'Deborah Canon', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMDc5MDg5NjA=', date: '2026-08-06', why: 'LA, caught 0, last 2026-07-30, was 2026-08-26 (27d). Newcastle 98059 -> thu.' },
  { job: '8068', client: 'Kyle Rancourt', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xNDkyMjc3ODk=', date: '2026-08-10', why: 'NA, caught 1, last 2026-07-30, was NOTHING SCHEDULED. Lacey 98503 -> mon.' },
  { job: '8276', client: 'Diana Miller', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xNTI2ODYwNjk=', date: '2026-08-11', why: 'LA, caught 0, last 2026-07-31, was NOTHING SCHEDULED. Tacoma 98445 -> tue.' },
  { job: '4998', client: 'Bill Langley', id: 'Z2lkOi8vSm9iYmVyL0pvYi84NDc4MzQ0OQ==', date: '2026-08-14', why: 'NA, caught 0, last 2026-07-29, was 2026-08-25 (27d). Graham 98338 -> fri.' },
  { job: '6900', client: 'Jeff Hunter', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMjAwNjg4NjE=', date: '2026-08-14', why: 'NA, caught 0, last 2026-07-30, was NOTHING SCHEDULED. Kent 98042 -> fri.' },
];

const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const tr = await (await fetch('https://api.getjobber.com/api/oauth/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
})).json();
if (!tr.access_token) { console.error('Token failed', JSON.stringify(tr).slice(0, 200)); process.exit(1); }
if (tr.refresh_token && tr.refresh_token !== env.JOBBER_REFRESH_TOKEN) {
  let t = fs.readFileSync(ENV_PATH, 'utf8'); t = t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, 'JOBBER_REFRESH_TOKEN=' + tr.refresh_token); fs.writeFileSync(ENV_PATH, t);
}
const tok = tr.access_token;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function gql(query, variables, attempt = 0) {
  const r = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': GQL_VERSION },
    body: JSON.stringify({ query, variables }),
  });
  const d = await r.json().catch(() => ({}));
  if ((r.status === 429 || JSON.stringify(d.errors || '').includes('THROTTLED')) && attempt < 6) { await sleep(2000 * 2 ** attempt); return gql(query, variables, attempt + 1); }
  return d;
}
const shift = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

const log = [];
let created = 0, skipped = 0, failed = 0;
for (const a of ADDS) {
  const lo = shift(a.date, -3), hi = shift(a.date, 3);
  const chk = await gql(`query($id:EncodedId!){ job(id:$id){ jobNumber client{name}
    visits(first:20, filter:{ startAt:{ after:"${lo}T00:00:00-07:00", before:"${hi}T23:59:59-07:00" } }){ totalCount nodes{ startAt visitStatus } } } }`, { id: a.id });
  const job = chk.data?.job;
  if (!job) { console.log(`❌ #${a.job} ${a.client} — job not found: ${JSON.stringify(chk.errors || '').slice(0, 160)}`); failed++; continue; }
  const near = (job.visits.nodes || []).map(v => v.startAt.slice(0, 10));
  console.log(`#${a.job} ${a.client} -> ${a.date}`);
  console.log(`    ${a.why}`);
  if (near.length) { console.log(`    ⏭  SKIP — visit(s) already within ±3d: ${near.join(', ')}`); skipped++; log.push(`SKIP #${a.job} ${a.client} ${a.date} (near: ${near.join(',')})`); continue; }
  if (mode === 'dry') { console.log('    DRY — would create'); log.push(`DRY #${a.job} ${a.client} ${a.date}`); continue; }
  const res = await gql(`mutation($jobId:EncodedId!,$input:VisitCreateInput!){ visitCreate(jobId:$jobId, input:$input){ createdVisits{ id startAt } userErrors{ message } } }`,
    { jobId: a.id, input: { visits: [{ title: a.client, schedule: { notifyTeam: false,
      startAt: { date: a.date, time: '00:00:00', timezone: TZ }, endAt: { date: a.date, time: '23:59:59', timezone: TZ } } }] } });
  const errs = res.errors || res.data?.visitCreate?.userErrors || [];
  if (errs.length) { console.log('    ❌ FAIL ' + JSON.stringify(errs).slice(0, 220)); failed++; log.push(`FAIL #${a.job} ${a.client} ${a.date}`); }
  else { const v = res.data.visitCreate.createdVisits[0]; console.log(`    ✅ CREATED ${v.startAt.slice(0, 10)}  ${v.id}`); created++; log.push(`CREATED #${a.job} ${a.client} ${a.date} ${v.id}`); }
  await sleep(500);
}
console.log(`\n${mode.toUpperCase()} — created ${created}, skipped ${skipped}, failed ${failed}, of ${ADDS.length} planned.`);
if (mode === 'live') {
  const dir = path.join(__dirname, 'runs'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'nextweek-adds-2026-08-01-executed.txt'), log.join('\n') + '\n');
}
