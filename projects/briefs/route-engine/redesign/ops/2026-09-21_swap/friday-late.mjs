#!/usr/bin/env node
// friday-late.mjs — Tavis runs late Friday 2026-09-25 (Spencer's call). Four visits did not fit his OptimoRoute
// working window. Extend his Friday window, re-plan Friday only (balancing OFF), write every changed Friday time
// back to Jobber (startAt = planned arrival, endAt = +3 h). Then run the arrival-window sweep separately.
//   node friday-late.mjs            # dry: shows the current Friday plan and what would change
//   node friday-late.mjs --execute  # live (write gate must be enabled)
import '../../../lib/write-gate.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const ENV_PATH = path.join(REPO, '.' + 'env');
const LOG_PATH = path.join(__dirname, 'friday-late.log');
const TZ = 'America/Los_Angeles';
const EXECUTE = process.argv.includes('--execute');
const DATE = '2026-09-25', TECH = 'Tavis Alexander', WORK_TO = process.argv.find(a => a.startsWith('--to='))?.split('=')[1] || '20:30';
fs.writeFileSync(LOG_PATH, '');
const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
const log = (...a) => { const l = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); fs.appendFileSync(LOG_PATH, l + '\n'); process.stdout.write(l + '\n'); };
const die = m => { log(`\n🛑 ABORT ${stamp()} — ${m}`); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function loadEnv() { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'); }
let tok = null, tokAt = 0;
async function token(force = false) { if (!force && tok && Date.now() - tokAt < 50 * 60 * 1000) return tok; const env = loadEnv(); const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) }); const d = await r.json(); if (!d.access_token) die('Jobber token refresh failed'); if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token); tok = d.access_token; tokAt = Date.now(); return tok; }
async function jgql(query, variables = {}, attempt = 0) { const t = await token(); const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) }); if (res.status === 401 && attempt < 3) { await token(true); return jgql(query, variables, attempt + 1); } const d = await res.json().catch(() => ({})); const throttled = res.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED')); if (throttled && attempt < 8) { const w = Math.min(60000, 2500 * 2 ** attempt); await sleep(w); return jgql(query, variables, attempt + 1); } return d; }
async function orCall(endpoint, body, attempt = 0) { const env = loadEnv(); const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const d = await res.json().catch(() => ({})); if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orCall(endpoint, body, attempt + 1); } return d; }
async function orGet(q, attempt = 0) { const env = loadEnv(); const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`); const d = await res.json().catch(() => ({})); if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); } return d; }
const ptLocal = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function visitNumOf(id) { let n = null; try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {} if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10); return n; }

log(`=== FRIDAY LATE ${stamp()} PT === mode ${EXECUTE ? 'LIVE' : 'DRY'}  ${TECH} ${DATE} work window to ${WORK_TO}`);
// Friday visits from Jobber
const VQ = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ id title startAt isComplete job{ jobNumber } client{ name } assignedUsers(first:6){ nodes{ name{ full } } } } pageInfo{ hasNextPage endCursor } } }`;
async function pullFriday() { const rows = []; let cursor = null; for (;;) { const d = await jgql(VQ, { a: cursor, after: DATE + 'T00:00:00-07:00', before: DATE + 'T23:59:59-07:00' }); if (!d.data?.visits) die('visits query failed'); for (const v of d.data.visits.nodes) rows.push({ id: v.id, visitNum: visitNumOf(v.id), jobNumber: v.job?.jobNumber, client: v.client?.name, startLocal: ptLocal(v.startAt), isComplete: v.isComplete, tech: (v.assignedUsers?.nodes || []).map(u => u.name?.full)[0] || null }); if (!d.data.visits.pageInfo.hasNextPage) break; cursor = d.data.visits.pageInfo.endCursor; } return rows.filter(v => ptLocal(v.startLocal).slice(0, 10) === DATE || v.startLocal.slice(0, 10) === DATE); }
const visits = (await pullFriday()).filter(v => !v.isComplete);
const byNo = new Map(visits.map(v => [`${v.jobNumber}-${v.visitNum}`, v]));
log(`Friday visits in Jobber: ${visits.length}  (${TECH}: ${visits.filter(v => v.tech === TECH).length})`);
const before = await orGet(`get_routes?date=${DATE}`);
for (const rt of before.routes || []) log(`  now  ${String(rt.driverName).padEnd(18)} ${String((rt.stops || []).length).padStart(3)} stops  ${rt.duration} min  last ${String((rt.stops || []).slice(-1)[0]?.scheduledAtDt || '').slice(11, 16)}`);
if (!EXECUTE) { log(`\nDRY — would set ${TECH} ${DATE} workTimeTo=${WORK_TO}, re-plan ${DATE}, write changed Friday times. Log: ${LOG_PATH}`); process.exit(0); }

// 1. extend Tavis's Friday window. The API rejects workTimeTo on the per-date endpoint (confirmed 2026-09-19:
// "Additional properties are not allowed ('workTimeTo' was unexpected)"), and the singular endpoint needs an
// externalId this account's drivers do not have. So the window is set by hand in the OptimoRoute UI
// (Drivers > Tavis Alexander > 2026-09-25 > working hours) and this script runs with --no-window afterwards.
if (!process.argv.includes('--no-window')) { const r = await orCall('update_drivers_parameters', { updates: [{ driver: { serial: TECH }, date: DATE, enabled: true, workTimeTo: WORK_TO }] }); const rows = r.updates || r.parameters || []; const bad = rows.filter(x => !x.success); log(`driver window: ${rows.length - bad.length}/${rows.length} ok ${bad.length ? JSON.stringify(bad).slice(0, 200) : ''}`); if (!rows.length) log('  body: ' + JSON.stringify(r).slice(0, 300)); if (bad.length || !rows.length) die('driver parameter update failed — Friday is UNSCHEDULED until re-planned'); }
// 2. re-plan Friday
const START_WITH = process.argv.find(a => a.startsWith('--start='))?.split('=')[1] || 'CURRENT';
log(`start_planning ${DATE} balancing OFF startWith ${START_WITH}`);
const sp = await orCall('start_planning', { dateRange: { from: DATE, to: DATE }, balancing: 'OFF', startWith: START_WITH, lockType: 'NONE' });
if (!sp.success) die('start_planning failed: ' + JSON.stringify(sp).slice(0, 200));
let done = false; for (let i = 0; i < 90; i++) { await sleep(4000); const st = await orGet(`get_planning_status?planningId=${sp.planningId}`); if (st.status === 'F' || st.status === 'finished' || st.finished === true) { done = true; break; } if (st.status === 'E' || st.success === false) die('planning errored: ' + JSON.stringify(st).slice(0, 200)); }
if (!done) die('planning did not finish in 6 min');
const rr = await orGet(`get_routes?date=${DATE}`); const planned = new Map();
for (const rt of rr.routes || []) { const stops = rt.stops || []; log(`  plan ${String(rt.driverName).padEnd(18)} ${String(stops.length).padStart(3)} stops  ${rt.duration} min  last ${String(stops.slice(-1)[0]?.scheduledAtDt || '').slice(11, 16)}`); for (const s of stops) if (s.orderNo && s.scheduledAtDt) planned.set(String(s.orderNo), String(s.scheduledAtDt)); }
const stillUn = visits.filter(v => !planned.has(`${v.jobNumber}-${v.visitNum}`)); if (stillUn.length) log(`  ⚠ still unscheduled: ` + stillUn.map(v => `${(v.tech || '?').split(' ')[0]} #${v.jobNumber}`).join(', '));
// 3. write changed Friday times
let wrote = 0, same = 0;
for (const [no, arr] of planned) { const v = byNo.get(no); if (!v) continue; const t = arr.replace('T', ' ').slice(11, 19) || arr.slice(11, 16) + ':00'; if (v.startLocal.slice(11, 16) === t.slice(0, 5)) { same++; continue; }
  const endPT = new Date(new Date(`${DATE}T${t}-07:00`).getTime() + 3 * 3600000).toLocaleString('sv-SE', { timeZone: TZ });
  const r = await jgql(`mutation { visitEditSchedule(id: "${v.id}", input: { startAt: { date: "${DATE}", time: "${t}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`);
  const errs = [...(r.errors || []).map(e => e.message)]; for (const k of Object.keys(r.data || {})) for (const e of (r.data[k]?.userErrors || [])) errs.push(e.message);
  wrote++; log(`  [${wrote}] ${t.slice(0, 5)} #${v.jobNumber} ${(v.tech || '').split(' ')[0].padEnd(8)} ${String(v.client || '').slice(0, 28).padEnd(28)} was ${v.startLocal.slice(11, 16)}  ${errs.length ? 'FAILED ' + errs.join('; ') : 'ok'}`);
  if (errs.length) die(`visitEditSchedule failed #${v.jobNumber}`); await sleep(210); }
log(`\nwritten ${wrote}  unchanged ${same}\n✅ done ${stamp()} PT — now run the arrival-window sweep.`);
