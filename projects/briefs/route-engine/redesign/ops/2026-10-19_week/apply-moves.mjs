#!/usr/bin/env node
// apply-moves.mjs — the 28 day/tech moves Spencer approved 2026-10-17 for week 10-19..10-23 (moves.json).
//   Cory short Thursday (out-of-town week, Cory in the office): 9 outer Buckley-area stops -> his Mon/Tue/Wed.
//   Luke Yelm/Rainier Tue -> Mon. Tavis Renton 98056/Newcastle Tue -> Fri. Alias Redmond 98052 Mon -> Thu.
//   Robert Thu Issaquah 98027 -> Alias Thu.
//
//   node apply-moves.mjs            # DRY — freshness check + the exact mutations, nothing written
//   node apply-moves.mjs --execute  # LIVE (write gate must be open)
//
// Freshness: each visit is re-read from Jobber and must still be on its fromDay with its tech, not complete.
// Anything that moved since the plan is REFUSED, not forced. Tech changes first, then dates. Hard stop on error.
// Times keep their local time-of-day; sync-plan-times re-plans and writes real times afterwards.
// Next: node sync-plan-times.mjs --execute --no-times (UPDATEs the OptimoRoute orders and re-plans).
import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(path.resolve(__dirname, '../../../../../..'), '.' + 'env');
const LOG_PATH = path.join(__dirname, 'apply-moves' + (process.argv.find(a => a.startsWith('--moves=')) ? '-2' : '') + '.log');
const TZ = 'America/Los_Angeles';
const EXECUTE = process.argv.includes('--execute');
// --moves=moves-2.json applies a follow-up list (2026-10-17: Redmond 98052 Thu -> Alias Tue).
const MOVES_FILE = (process.argv.find(a => a.startsWith('--moves=')) || '').split('=')[1] || 'moves.json';
const MOVES = JSON.parse(fs.readFileSync(path.join(__dirname, MOVES_FILE), 'utf8'));

fs.writeFileSync(LOG_PATH, '');
const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
const log = (...a) => { const l = a.join(' '); fs.appendFileSync(LOG_PATH, l + '\n'); process.stdout.write(l + '\n'); };
const die = m => { log(`\nABORT ${stamp()} — ${m}`); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function loadEnv() { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; }
function saveEnvKey(k, v) { const t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'); }
let tok = null, tokAt = 0;
async function token(force = false) {
  if (!force && tok && Date.now() - tokAt < 50 * 60 * 1000) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json(); if (!d.access_token) die(`Jobber token refresh failed (http ${r.status})`);
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; tokAt = Date.now(); return tok;
}
async function jgql(query, variables = {}, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) });
  if (res.status === 401 && attempt < 3) { await token(true); return jgql(query, variables, attempt + 1); }
  const d = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2500 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
  return d;
}
const ptDate = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const ptTime = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(11, 19);
function visitNumOf(id) { let n = null; try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {} if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10); return n; }

log(`=== APPLY MOVES ${stamp()} PT — ${EXECUTE ? 'LIVE (--execute)' : 'DRY — nothing written'} — ${MOVES.length} moves ===`);
for (const m of MOVES) { const dow = new Date(m.toDay + 'T12:00:00Z').getUTCDay(); if (dow === 0 || dow === 6) die(`${m.orderNo} targets a weekend`); }

// live visits for the week
const VQ = `query($a:String){ visits(first:50, after:$a, filter:{ startAt:{ after:"2026-10-19T00:00:00-07:00", before:"2026-10-23T23:59:59-07:00" } }){
  nodes{ id startAt endAt isComplete job{ jobNumber } client{ name } assignedUsers(first:6){ nodes{ id name{ full } } } }
  pageInfo{ hasNextPage endCursor } } }`;
const live = new Map(); let cur = null;
for (;;) { const d = await jgql(VQ, { a: cur }); if (!d.data?.visits) die('visits query failed: ' + JSON.stringify(d).slice(0, 300)); for (const v of d.data.visits.nodes) live.set(`${v.job?.jobNumber}-${visitNumOf(v.id)}`, v); if (!d.data.visits.pageInfo.hasNextPage) break; cur = d.data.visits.pageInfo.endCursor; }
const users = (await jgql(`query { users(first:80){ nodes{ id name{ full } } } }`)).data?.users?.nodes || [];
const uid = n => users.find(u => u.name?.full === n)?.id || die(`no Jobber user named ${n}`);

const ready = [];
for (const m of MOVES) {
  const v = live.get(m.orderNo);
  if (!v) die(`${m.orderNo} #${m.job} ${m.name}: not on the board 10-19..10-23 any more — refusing`);
  const names = v.assignedUsers.nodes.map(u => u.name.full);
  if (v.isComplete) die(`${m.orderNo} ${m.name}: already complete`);
  if (ptDate(v.startAt) !== m.fromDay) die(`${m.orderNo} ${m.name}: now on ${ptDate(v.startAt)}, plan expected ${m.fromDay}`);
  if (names[0] !== m.tech) die(`${m.orderNo} ${m.name}: now on ${names.join('+')}, plan expected ${m.tech}`);
  ready.push({ m, v, names });
}
log(`freshness: all ${ready.length} visits still where the plan expects them\n`);

const techOps = ready.filter(r => r.m.toTech !== r.m.tech);
const dateOps = ready.filter(r => r.m.toDay !== r.m.fromDay);
for (const r of techOps) log(`  TECH  #${r.m.job} ${r.m.name.padEnd(30)} ${r.m.fromDay}  ${r.m.tech} -> ${r.m.toTech}`);
for (const r of dateOps) log(`  DATE  #${r.m.job} ${r.m.name.padEnd(30)} ${r.m.tech.split(' ')[0]}  ${r.m.fromDay} -> ${r.m.toDay}  (keeps ${ptTime(r.v.startAt).slice(0, 5)})`);
if (!EXECUTE) { log(`\nDRY RUN — ${techOps.length} tech + ${dateOps.length} date changes would be written.`); process.exit(0); }

for (const r of techOps) {
  // visitEditAssignedUsers REPLACES the list: swap the lead, keep any ride-along.
  const ids = r.v.assignedUsers.nodes.map(u => u.name.full === r.m.tech ? uid(r.m.toTech) : u.id);
  const d = await jgql(`mutation($id:EncodedId!,$u:[EncodedId!]!){ visitEditAssignedUsers(visitId:$id, input:{ assignedUserIds:$u }){ userErrors{ message } } }`, { id: r.v.id, u: ids });
  const err = d.errors || d.data?.visitEditAssignedUsers?.userErrors?.length && d.data.visitEditAssignedUsers.userErrors;
  if (err && err.length) die(`TECH #${r.m.job} ${r.m.name}: ${JSON.stringify(err).slice(0, 300)}`);
  log(`  ok TECH #${r.m.job} ${r.m.name} -> ${r.m.toTech}`);
}
for (const r of dateOps) {
  const input = { startAt: { date: r.m.toDay, time: ptTime(r.v.startAt), timezone: TZ }, endAt: { date: r.m.toDay, time: ptTime(r.v.endAt), timezone: TZ } };
  const d = await jgql(`mutation($id:EncodedId!,$i:VisitEditScheduleInput!){ visitEditSchedule(id:$id, input:$i){ userErrors{ message } } }`, { id: r.v.id, i: input });
  const err = d.errors || d.data?.visitEditSchedule?.userErrors?.length && d.data.visitEditSchedule.userErrors;
  if (err && err.length) die(`DATE #${r.m.job} ${r.m.name}: ${JSON.stringify(err).slice(0, 300)}`);
  log(`  ok DATE #${r.m.job} ${r.m.name} ${r.m.fromDay} -> ${r.m.toDay}`);
}
log(`\ndone ${stamp()} — ${techOps.length} tech + ${dateOps.length} date changes written.`);
