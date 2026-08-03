#!/usr/bin/env node
// add-followup-visits-0801.mjs — one-shot: book the follow-up visits that technician
// notes asked for and never got (audit: runs/followup-misses-2026-08-01.md).
//
// Approved by Spencer 2026-08-01: 17 clean adds + #5676 Potter + #6986 Wollam.
// #6970 Mary Olin deliberately EXCLUDED (14d gap only, add would sit 4d before 8/10).
//
// Rules honoured:
//  - Interim ADD only — the recurring visit is left exactly where it is, so no downstream
//    gap is created (the 2026-07-06 Annette Wood error / Avila 7/30 lesson).
//  - Target = the zip's territory-grid v5 day inside the required week. Mon-Fri only.
//  - Created all-day (00:00-23:59 PT) => push-week treats it as FLEXIBLE and the optimizer
//    places it; techs are NOT pinned here (grid v5 runs lockTechs=false).
//  - GUARD: refuses to create if the job already has any visit within +/-3 days of target.
//
// Usage: node projects/briefs/jobber-notes-automation/add-followup-visits-0801.mjs dry|live

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
  { job: '7937', client: 'Dave Kenney', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xNDU4OTU2MTg=', date: '2026-08-03', why: '"Add visit" 07-21, next was 2026-08-24 (34d). Olympia 98501 -> mon.' },
  { job: '4655', client: 'Bruce  Sprague', id: 'Z2lkOi8vSm9iYmVyL0pvYi83ODUwNTUxMA==', date: '2026-08-04', why: '"Add visit" 07-28, next was 2026-08-11 (14d). Enumclaw 98022 -> tue.' },
  { job: '5328', client: 'Dave Belmont', id: 'Z2lkOi8vSm9iYmVyL0pvYi85MTk0NTYzNw==', date: '2026-08-04', why: '"Add visit" 07-23, next was 2026-08-27 (35d). Enumclaw 98022 -> tue.' },
  { job: '6338', client: 'Barbara Wood', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMDYzODI0MDU=', date: '2026-08-04', why: '"Add visit" 07-27, next was 2026-08-18 (22d). Tacoma 98445 -> tue.' },
  { job: '7063', client: 'Robert Saeman', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMjI2MDkwODA=', date: '2026-08-04', why: '"Add visit" 07-22, next was 2026-08-25 (34d). Tacoma 98446 -> tue.' },
  { job: '7202', client: 'Josh Trachtenberg', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMjQ3MTM5NjI=', date: '2026-08-04', why: '"Add visit" 07-29, next was 2026-08-24 (26d). Woodinville 98072 -> tue.' },
  { job: '7459', client: 'Larry McGowan', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMjg2MDYxMjM=', date: '2026-08-04', why: '"Add visit" 07-28, next was 2026-08-11 (14d). Seattle 98178 -> tue.' },
  { job: '7639', client: 'Marla Poor', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMzQ0MDM4OTc=', date: '2026-08-04', why: '"Add visit" 07-29, next was 2026-08-24 (26d). Woodinville 98072 -> tue.' },
  { job: '7788', client: 'Bonnie Mccracken', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMzg3NDI2OTA=', date: '2026-08-04', why: '"Ad visit" 07-28, next was 2026-08-25 (28d). Burien 98166 -> tue.' },
  { job: '4676', client: 'Rick  Fegurgur', id: 'Z2lkOi8vSm9iYmVyL0pvYi83OTAzNzE0NA==', date: '2026-08-05', why: '"Add visit" 07-31, next was 2026-08-14 (14d). Buckley 98321 -> wed.' },
  { job: '6985', client: 'Melisa Shryock', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMjEyNzM2ODM=', date: '2026-08-05', why: '"Add visit" 07-31, next was 2026-08-14 (14d). Buckley 98321 -> wed.' },
  { job: '5726', client: 'Faye Houshyari', id: 'Z2lkOi8vSm9iYmVyL0pvYi85NTQyNzIzMw==', date: '2026-08-06', why: '"1 week" 07-23, next was 2026-08-13 (21d). Newcastle 98059 -> thu.' },
  { job: '6355', client: 'Julie James', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMDcxMzYxODY=', date: '2026-08-06', why: '"Add visit" 07-23, next was 2026-08-19 (27d). Sammamish 98075 -> thu.' },
  { job: '6986', client: 'Ashley Wollam', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xMjEyNzQyMTc=', date: '2026-08-06', why: '"Add visit" 07-22, next was 2026-08-11 (20d). Puyallup 98374 -> thu. TIGHT: Spencer-approved.' },
  { job: '7988', client: 'Aaron Diaz', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xNDc3MjA5MTE=', date: '2026-08-06', why: '"2 weeks" 07-23, next was 2026-08-13 (21d). Newcastle 98059 -> thu.' },
  { job: '8020', client: 'Cordell Jones', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xNDgyODQyMDY=', date: '2026-08-06', why: '"Add visit" 07-30, next was 2026-08-13 (14d). Renton 98059 -> thu.' },
  { job: '5676', client: 'Clark Potter', id: 'Z2lkOi8vSm9iYmVyL0pvYi85NTA1ODczOQ==', date: '2026-08-07', why: '"Ad visit" 07-22, next was 2026-08-12 (21d). Maple Valley 98038 -> fri. TIGHT: Spencer-approved.' },
  { job: '8224', client: 'Kelsey Peck', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xNTE3OTk0MDk=', date: '2026-08-07', why: '"Add visit" 07-31, next was 2026-08-28 (28d). North Bend 98045 -> fri.' },
  { job: '8157', client: 'Charles', id: 'Z2lkOi8vSm9iYmVyL0pvYi8xNTA2MTMxOTc=', date: '2026-08-11', why: '"2 weeks" 07-27, next was 2026-08-19 (23d). Tacoma 98445 -> tue.' },
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
  fs.writeFileSync(path.join(dir, 'followup-adds-2026-08-01-executed.txt'), log.join('\n') + '\n');
}
