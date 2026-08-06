#!/usr/bin/env node
// SET VISIT TECH — point a Jobber visit at a named tech. Assignees only: no dates, no times,
// no OptimoRoute writes, no re-plan.
//
// For the case where OptimoRoute already has the right driver and only Jobber is out of step, so
// there is nothing to re-sequence. Born 2026-08-04: #8267 Matt Kirk (98499 Lakewood, Fri) was on
// Spencer Hill in Jobber while OptimoRoute and grid v5 both had Luke LaVergne — Spencer is not in
// the field, so Jobber was simply wrong (Spencer's call: "if OptimoRoute says Luke, then it's Luke").
//
// If OptimoRoute has the WRONG driver too, this is the wrong tool — that is a real move and needs
// move-tech-replan.mjs, which re-sequences the day and writes the new times back.
//
// Usage: node set-visit-tech.mjs dry|live <jobNumber> "<Tech Name>" [--from=YYYY-MM-DD] [--to=YYYY-MM-DD]
//        node set-visit-tech.mjs dry|live <jobNumber>              [--from=…] [--to=…]
//          (tech omitted -> use whatever driver OptimoRoute has for that order)
// Window defaults to the current Mon-Fri. Refuses to touch a completed visit. Reports the
// OptimoRoute driver alongside, so a disagreement is visible before writing.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const RUNS_DIR = path.join(__dirname, 'drift-runs');
const TZ = 'America/Los_Angeles';

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
async function jobberToken(force = false) {
  if (!force && accessToken && Date.now() - tokenAt < 50 * 60 * 1000) return accessToken;
  const env = loadEnv();
  const res = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('Jobber token refresh failed', res.status); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token; tokenAt = Date.now();
  return accessToken;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function jgql(query, variables, attempt = 0) {
  const token = await jobberToken();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await jobberToken(true); return jgql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
  if (!res.ok) throw new Error(`Jobber HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}
function gqlErrors(r) {
  const ue = [];
  if (r.errors) ue.push(...r.errors.map(e => e.message));
  const d = r.data || {};
  for (const k of Object.keys(d)) if (d[k] && d[k].userErrors) ue.push(...d[k].userErrors.map(e => e.message));
  return ue;
}
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
const PT = s => new Date(s).toLocaleString('sv-SE', { timeZone: TZ });
function visitNumOf(vis) {
  let num = null;
  try { num = Buffer.from(vis.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!num || !/^\d+$/.test(num)) num = vis.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return num;
}
function addDaysPT(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function thisMonday() {
  const today = new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
  const wd = new Date(today + 'T12:00:00Z').getUTCDay();
  return addDaysPT(today, wd === 0 ? -6 : -(wd - 1));
}

// ---------- main ----------
const argv = process.argv.slice(2);
const positional = argv.filter(a => !a.startsWith('--'));
const argOf = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const mode = positional[0], jobNo = positional[1], wantTech = positional[2] || null;
const MON = thisMonday();
const FROM = argOf('from', MON), TO = argOf('to', addDaysPT(MON, 4));
if (!['dry', 'live'].includes(mode) || !jobNo) {
  console.log('Usage: set-visit-tech.mjs dry|live <jobNumber> ["<Tech Name>"] [--from=YYYY-MM-DD] [--to=YYYY-MM-DD]');
  process.exit(1);
}
console.log(`SET VISIT TECH (${mode}) job #${jobNo}${wantTech ? ` -> ${wantTech}` : ' -> (OptimoRoute driver)'}  window ${FROM}..${TO}`);

// OptimoRoute drivers in the window
const ORdriver = {};
for (let d = FROM; d <= TO; d = addDaysPT(d, 1)) {
  const r = await orGet(`get_routes?date=${d}`);
  for (const rt of r.routes || []) for (const s of rt.stops || []) {
    const no = String(s.orderNo || '');
    if (/^\d+-\w+$/.test(no)) ORdriver[no] = { driver: rt.driverName, date: d, hm: (s.scheduledAtDt || '').slice(11, 16) };
  }
}

// Jobber visits in the window
const visits = [];
let cursor = null;
for (;;) {
  const q = `query($after:String){ visits(first:100, after:$after, filter:{ startAt:{ after:"${addDaysPT(FROM, -1)}T23:59:59-07:00", before:"${TO}T23:59:59-07:00" } }){ nodes{ id title startAt isComplete assignedUsers(first:6){ nodes{ id name{ full } } } job{ jobNumber } property{ address{ city postalCode } } } pageInfo{ hasNextPage endCursor } } }`;
  const r = await jgql(q, { after: cursor });
  if (r.errors) throw new Error('Jobber: ' + JSON.stringify(r.errors).slice(0, 300));
  visits.push(...r.data.visits.nodes);
  if (!r.data.visits.pageInfo.hasNextPage) break;
  cursor = r.data.visits.pageInfo.endCursor;
  await sleep(400);
}

const targets = visits.filter(v => String(v.job?.jobNumber) === String(jobNo));
if (!targets.length) { console.error(`ABORT: no visit for job #${jobNo} in ${FROM}..${TO}.`); process.exit(1); }

const plan = [];
for (const v of targets) {
  const orderNo = `${v.job.jobNumber}-${visitNumOf(v)}`;
  const or = ORdriver[orderNo];
  const names = (v.assignedUsers?.nodes || []).map(u => u.name.full);
  const tech = wantTech || or?.driver || null;
  console.log(`\n#${jobNo} "${v.title}" ${v.property?.address?.city || ''} ${(v.property?.address?.postalCode || '').slice(0, 5)}`);
  console.log(`   jobber : ${PT(v.startAt)}  tech ${names.join(' + ') || '(none)'}${v.isComplete ? '  [COMPLETE]' : ''}`);
  console.log(`   optimo : ${or ? `${or.date} ${or.hm}  driver ${or.driver}` : '(no stop)'}`);
  console.log(`   target : ${tech || '(cannot resolve)'}`);
  if (v.isComplete) { console.log('   -> SKIP (visit is complete)'); continue; }
  if (!tech) { console.log('   -> SKIP (no tech given and no OptimoRoute stop to read one from)'); continue; }
  if (names.length === 1 && names[0] === tech) { console.log('   -> SKIP (already correct)'); continue; }
  if (or && wantTech && or.driver !== wantTech) {
    console.log(`   !! OptimoRoute has ${or.driver}, not ${wantTech} — Jobber and the route will DISAGREE after this.`);
    console.log('      If the route is also wrong, use move-tech-replan.mjs instead.');
  }
  plan.push({ v, orderNo, tech, was: names });
}
if (!plan.length) { console.log('\nNothing to write.'); process.exit(0); }
if (mode === 'dry') { console.log('\nDRY — nothing written.'); process.exit(0); }

const u = await jgql('query { users(first:100){ nodes{ id name{ full } } } }', {});
const USERS = {};
for (const x of u.data.users.nodes) if (x.name?.full) USERS[x.name.full.trim().toLowerCase()] = x.id;

let ok = 0, failed = 0;
const writes = [];
for (const p of plan) {
  const uid = USERS[p.tech.trim().toLowerCase()];
  if (!uid) { failed++; console.log(`  FAIL — no Jobber user named "${p.tech}"`); continue; }
  const r = await jgql(`mutation($id:EncodedId!,$input:VisitEditAssignedUsersInput!){ visitEditAssignedUsers(visitId:$id, input:$input){ userErrors{ message } } }`,
    { id: p.v.id, input: { assignedUserIds: [uid] } });
  const ue = gqlErrors(r);
  if (ue.length) { failed++; console.log(`  FAIL ${p.orderNo}: ${ue.join('; ')}`); }
  else { ok++; writes.push({ orderNo: p.orderNo, was: p.was, now: p.tech }); console.log(`  ok — ${p.was.join(' + ') || '(none)'} -> ${p.tech}`); }
  await sleep(300);
}
console.log(`\nDone: ${ok} ok, ${failed} failed.`);
fs.mkdirSync(RUNS_DIR, { recursive: true });
const out = path.join(RUNS_DIR, `set-tech-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), kind: 'set-visit-tech', jobNo, writes, failed }, null, 2));
console.log(`Report saved: ${out}`);
process.exit(failed ? 1 : 0);
