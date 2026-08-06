#!/usr/bin/env node
// RESTORE CONTINUITY — put each upcoming visit back on the tech who actually last served that
// property, in Jobber. Spencer 2026-08-04: "in most cases the same tech needs to keep the same
// customer. The continuity does matter for repeat visits."
//
// Continuity belongs to the CUSTOMER, not to the zip. Every re-cut of territory-grid (v1..v6 in four
// weeks) silently handed hundreds of customers to a different tech; grid-tech-realign.mjs on
// 2026-08-04 did the same to 240 visits. This undoes that by history, not by table.
//
// Writes JOBBER ONLY (visitEditAssignedUsers). Jobber is the source of truth for tech, so the
// follow-up step is `jobber-to-optimo-sync.mjs live` to push these into OptimoRoute and re-plan.
//
// Never restores a tech who is off-roster (grid `notWorking` — e.g. Robert Norton, Spencer Hill):
// they cannot serve the visit, so those handovers are legitimate and are left alone.
//
// Usage: node restore-continuity.mjs dry|live --from=2026-08-10 --to=2026-08-14 [--history-days=45]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const TZ = 'America/Los_Angeles';
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: restore-continuity.mjs dry|live --from=YYYY-MM-DD --to=YYYY-MM-DD [--history-days=45]'); process.exit(1); }
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const HIST = Number(flag('history-days', 45));
const GRIDF = flag('grid', 'territory-grid-v5.json');
const SHOW = Number(flag('show', 30));
if (!FROM || !TO) { console.error('--from and --to are required'); process.exit(1); }

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
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('Jobber token refresh failed', res.status); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token; tokenAt = Date.now();
  return accessToken;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
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
  if (throttled && attempt < 9) { const w = Math.min(60000, 2500 * 2 ** attempt); console.log(`  throttled — backoff ${(w / 1000).toFixed(0)}s`); await sleep(w); return jgql(query, variables, attempt + 1); }
  return data;
}
const toPT = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function dowOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

const GRID = JSON.parse(fs.readFileSync(path.join(__dirname, GRIDF), 'utf8'));
const OFF_ROSTER = new Set(GRID.notWorking || []);

const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id startAt isComplete
      client{ id name }
      job{ jobNumber }
      property{ id address{ city postalCode } }
      assignedUsers(first:4){ nodes{ id name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;
async function fetchRange(a, b, label) {
  let cur = null; const out = [];
  for (;;) {
    const d = await jgql(Q, { a: cur, after: `${a}T00:00:00-07:00`, before: `${b}T23:59:59-07:00` });
    if (!d.data) { console.error(`${label} query failed:`, JSON.stringify(d).slice(0, 250)); break; }
    out.push(...d.data.visits.nodes);
    if (!d.data.visits.pageInfo.hasNextPage) break;
    cur = d.data.visits.pageInfo.endCursor;
    await sleep(400);
  }
  console.log(`  ${label}: ${out.length} visits`);
  return out;
}

const todayPT = new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
console.log(`RESTORE CONTINUITY (${mode.toUpperCase()})  ${FROM}..${TO}   history ${HIST}d\n`);
const history = await fetchRange(addDays(todayPT, -HIST), addDays(todayPT, -1), 'history');
const upcoming = await fetchRange(FROM, TO, 'upcoming');

const served = {};
for (const v of history) {
  const tech = v.assignedUsers?.nodes?.[0]?.name?.full;
  const pid = v.property?.id;
  if (!tech || !pid) continue;
  (served[pid] = served[pid] || []).push({ date: toPT(v.startAt).slice(0, 10), tech });
}
for (const k of Object.keys(served)) served[k].sort((a, b) => b.date.localeCompare(a.date));

const users = {};
{
  const r = await jgql('query { users(first: 100) { nodes { id name { full } } } }', {});
  for (const u of (r.data?.users?.nodes || [])) if (u.name?.full) users[u.name.full.trim().toLowerCase()] = u.id;
}

const fixes = [], skipped = [];
const loadBefore = {}, loadAfter = {};
for (const v of upcoming) {
  if (v.isComplete) continue;
  const day = toPT(v.startAt).slice(0, 10);
  const now = v.assignedUsers?.nodes?.[0]?.name?.full || null;
  const kb = day + '|' + (now || 'unassigned');
  loadBefore[kb] = (loadBefore[kb] || 0) + 1;
  const hist = served[v.property?.id];
  const last = hist && hist.length ? hist[0] : null;
  let target = now;
  if (last && last.tech !== now) {
    if (OFF_ROSTER.has(last.tech)) skipped.push({ job: v.job?.jobNumber, why: `last tech ${last.tech} is off-roster` });
    else if (!users[last.tech.trim().toLowerCase()]) skipped.push({ job: v.job?.jobNumber, why: `no Jobber user id for ${last.tech}` });
    else {
      target = last.tech;
      fixes.push({ visitId: v.id, job: String(v.job?.jobNumber), client: v.client?.name, city: v.property?.address?.city, zip: v.property?.address?.postalCode, day, from: now, to: last.tech, lastDate: last.date, seen: hist.length, userId: users[last.tech.trim().toLowerCase()] });
    }
  }
  const ka = day + '|' + (target || 'unassigned');
  loadAfter[ka] = (loadAfter[ka] || 0) + 1;
}

console.log(`\n=== RESTORE PLAN ===`);
console.log(`  visits to put back on their previous tech : ${fixes.length}`);
console.log(`  left alone (previous tech off-roster)     : ${skipped.length}`);
const pairs = {};
for (const f of fixes) { const k = `${(f.from || 'none').split(' ')[0]} -> ${f.to.split(' ')[0]}`; pairs[k] = (pairs[k] || 0) + 1; }
console.log('\n  reassignments (current -> restored):');
for (const [k, n] of Object.entries(pairs).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(4)}  ${k}`);

console.log('\n  stops per tech-day (before -> after):');
const keys = [...new Set([...Object.keys(loadBefore), ...Object.keys(loadAfter)])].sort();
let lastDay = '';
for (const k of keys) {
  const [d, t] = k.split('|');
  if (d !== lastDay) { console.log(`   ${d} (${dowOf(d)})`); lastDay = d; }
  const b = loadBefore[k] || 0, a = loadAfter[k] || 0;
  const delta = a - b;
  console.log(`      ${t.padEnd(20)} ${String(b).padStart(3)} -> ${String(a).padStart(3)}  ${delta > 0 ? '+' + delta : delta === 0 ? '' : delta}${a >= 34 ? '   << HEAVY' : ''}`);
}

console.log(`\n  first ${Math.min(SHOW, fixes.length)} restorations:`);
for (const f of fixes.slice(0, SHOW)) {
  console.log(`    #${String(f.job).padEnd(5)} ${String(f.client || '').slice(0, 20).padEnd(21)} ${String(f.city || '').slice(0, 13).padEnd(14)} ${dowOf(f.day)}  ${String(f.from || 'none').split(' ')[0].padEnd(9)} -> ${f.to.split(' ')[0].padEnd(9)} (last served ${f.lastDate}, ${f.seen} visits)`);
}
if (fixes.length > SHOW) console.log(`    … +${fixes.length - SHOW} more`);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(__dirname, 'drift-runs', `restore-continuity-${stamp}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), mode, from: FROM, to: TO, fixes, skipped, loadBefore, loadAfter }, null, 2));

if (mode === 'dry') { console.log(`\nDRY RUN — nothing written. Report: ${out}`); console.log('Next: restore-continuity.mjs live … then jobber-to-optimo-sync.mjs live --from --to'); process.exit(0); }

console.log('\n=== WRITING JOBBER ===');
let ok = 0, failed = 0;
for (const f of fixes) {
  const r = await jgql(`mutation { visitEditAssignedUsers(visitId: "${f.visitId}", input: { assignedUserIds: ["${f.userId}"] }) { userErrors { message } } }`, {});
  const ue = (r.errors || []).map(e => e.message);
  for (const k of Object.keys(r.data || {})) if (r.data[k]?.userErrors) ue.push(...r.data[k].userErrors.map(e => e.message));
  if (ue.length) { failed++; console.log(`  FAILED #${f.job}: ${ue.join('; ')}`); } else ok++;
  await sleep(220);
}
console.log(`\nRESTORE DONE: ${ok} visits put back on their previous tech, ${failed} failed.`);
console.log('NEXT: node projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs live --from=' + FROM + ' --to=' + TO);
process.exit(failed ? 1 : 0);
