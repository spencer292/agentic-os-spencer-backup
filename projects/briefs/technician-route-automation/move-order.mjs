#!/usr/bin/env node
// MOVE ORDER — move ONE OptimoRoute order to a given day (and optionally tech), re-plan the
// receiving day with every other stop locked, verify nothing else shifted, write times back to
// Jobber. The source day is deliberately NOT re-planned: when a stop leaves a day, the remaining
// stops keep their existing times, so a frozen/already-emailed day is never re-timed.
//
// Born 2026-08-04: #8311 Steve Tullis sat on Alias' 08-05 OptimoRoute route while the Jobber visit
// had moved to 08-06 with Cory — a phantom stop that would have sent Alias to Redmond for a job
// that was not there. drift-check reports that shape (day drift on an EXISTING order) but never
// auto-resolves it, because a hand-move in Jobber can be deliberate.
//
// Usage: node move-order.mjs dry|live --order=8311-2277566634 --to-date=2026-08-06 [--tech="Alias Franks"]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const TZ = 'America/Los_Angeles';

const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: move-order.mjs dry|live --order=NO --to-date=YYYY-MM-DD [--tech="Name"]'); process.exit(1); }
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const ORDER = flag('order'), TO_DATE = flag('to-date'), TECH = flag('tech');
if (!ORDER || !TO_DATE) { console.error('--order and --to-date are required'); process.exit(1); }

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
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
  return data;
}
async function orCall(endpoint, body, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orCall(endpoint, body, attempt + 1); }
  return d;
}
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
const toPT = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
const ptNow = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function emailCutoffOk(dateStr) {
  const nowStr = ptNow(); const today = nowStr.slice(0, 10); const hour = Number(nowStr.slice(11, 13));
  if (dateStr <= today) return false;
  if (dateStr === addDays(today, 1) && hour >= 14) return false;
  return true;
}
function visitNumOf(vis) {
  let num = null;
  try { num = Buffer.from(vis.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!num || !/^\d+$/.test(num)) num = vis.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return num;
}

console.log(`MOVE ORDER (${mode.toUpperCase()})  ${ORDER} -> ${TO_DATE}${TECH ? ' / ' + TECH : ''}`);
console.log(`now ${ptNow()} PT`);
if (!emailCutoffOk(TO_DATE)) { console.error(`ABORT: ${TO_DATE} is today, past, or past its 14:00 PT D-1 cutoff — not writable.`); process.exit(1); }

// locate the order today
let fromDate = null, serials = {};
for (let i = 0; i <= 21; i++) {
  const d = addDays(ptNow().slice(0, 10), i);
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    if (rt.driverName) serials[rt.driverName.trim().toLowerCase()] = rt.driverSerial || null;
    for (const s of rt.stops || []) if (String(s.orderNo) === ORDER) { fromDate = d; console.log(`  found on ${d} / ${rt.driverName} @ ${(s.scheduledAtDt || '').slice(11, 16)}`); }
  }
  await sleep(250);
}
if (!fromDate) console.log('  not currently on any route in the next 21 days (unscheduled order)');
const serial = TECH ? serials[TECH.trim().toLowerCase()] : null;
if (TECH && !serial) { console.error(`ABORT: no OptimoRoute driver serial for "${TECH}"`); process.exit(1); }

// current stops on the receiving day
const rrTo = await orGet(`get_routes?date=${TO_DATE}`);
const dayStops = {};
for (const rt of rrTo.routes || []) for (const s of rt.stops || []) {
  const o = String(s.orderNo || '');
  if (/^\d+-\w+$/.test(o) && o !== ORDER) dayStops[o] = { driver: rt.driverName, driverSerial: rt.driverSerial || null, hm: (s.scheduledAtDt || '').slice(11, 16) };
}
console.log(`  ${TO_DATE} currently has ${Object.keys(dayStops).length} other own stops`);
console.log(`  source day ${fromDate || '(none)'} will NOT be re-planned — its remaining stops keep their times`);

if (mode === 'dry') { console.log('\nDRY RUN — nothing written.'); process.exit(0); }

// 1. move the order
const upd = { operation: 'UPDATE', orderNo: ORDER, date: TO_DATE, allowedDates: { from: TO_DATE, to: TO_DATE }, priority: 'M' };
if (serial) upd.assignedTo = { serial };
const mv = await orCall('create_order', upd);
if (!mv.success) { console.error('ABORT: move failed:', JSON.stringify(mv).slice(0, 250)); process.exit(1); }
console.log(`  moved ${ORDER} -> ${TO_DATE}${TECH ? ' / ' + TECH : ''}`);

// 2. lock every other stop on the receiving day to its current day + tech
console.log(`  locking ${Object.keys(dayStops).length} existing stops…`);
let lockFails = 0;
for (const [o, s] of Object.entries(dayStops)) {
  const u = { operation: 'UPDATE', orderNo: o, date: TO_DATE, allowedDates: { from: TO_DATE, to: TO_DATE }, priority: 'M' };
  if (s.driverSerial) u.assignedTo = { serial: s.driverSerial };
  const r = await orCall('create_order', u);
  if (!r.success) lockFails++;
  await sleep(250);
}
if (lockFails) { console.error(`ABORT: ${lockFails} lock failures — no re-plan, no Jobber writes.`); process.exit(1); }

// 3. re-plan the receiving day
console.log('  re-planning…');
const sp = await orCall('start_planning', { dateRange: { from: TO_DATE, to: TO_DATE }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' });
if (!sp.success) { console.error('ABORT: start_planning failed:', JSON.stringify(sp).slice(0, 200)); process.exit(1); }
let done = false;
for (let i = 0; i < 60; i++) {
  await sleep(10000);
  const st = await orGet(`get_planning_status?planningId=${sp.planningId}`);
  const status = (st.status || '').toString();
  if (/^F/i.test(status)) { done = true; break; }
  if (/^E/i.test(status)) { console.error('ABORT: planning error', JSON.stringify(st).slice(0, 200)); process.exit(1); }
}
if (!done) { console.error('ABORT: planning timeout'); process.exit(1); }

// 4. verify
const rr2 = await orGet(`get_routes?date=${TO_DATE}`);
const now = {};
for (const rt of rr2.routes || []) for (const s of rt.stops || []) {
  const o = String(s.orderNo || '');
  if (/^\d+-\w+$/.test(o)) now[o] = { driver: rt.driverName, hm: (s.scheduledAtDt || '').slice(11, 16), scheduledAtDt: s.scheduledAtDt };
}
const lost = Object.keys(dayStops).filter(o => !now[o]);
const moved = Object.keys(dayStops).filter(o => now[o] && dayStops[o].driver && now[o].driver !== dayStops[o].driver);
if (lost.length || moved.length) { console.error(`ABORT VERIFY: ${lost.length} vanished, ${moved.length} changed tech — NO Jobber writes`, JSON.stringify({ lost, moved }).slice(0, 300)); process.exit(1); }
if (!now[ORDER]) { console.error(`ABORT VERIFY: ${ORDER} did not get scheduled on ${TO_DATE} — NO Jobber writes`); process.exit(1); }
console.log(`  verified: ${ORDER} @ ${now[ORDER].hm} (${now[ORDER].driver}); ${Object.keys(dayStops).length} existing stops intact`);

// 5. write times (and the moved order's assignee) back to Jobber
const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id startAt isComplete job{ jobNumber } assignedUsers(first:4){ nodes{ name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;
let cur = null; const vis = [];
for (;;) {
  const d = await jgql(Q, { a: cur, after: `${addDays(TO_DATE, -1)}T23:59:59-07:00`, before: `${TO_DATE}T23:59:59-07:00` });
  if (!d.data) { console.error('Jobber query failed', JSON.stringify(d).slice(0, 250)); break; }
  vis.push(...d.data.visits.nodes);
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cur = d.data.visits.pageInfo.endCursor;
  await sleep(250);
}
const byOrder = {};
for (const v of vis.filter(x => !x.isComplete)) byOrder[String(v.job?.jobNumber) + '-' + visitNumOf(v)] = v;
const users = {};
{
  const r = await jgql('query { users(first: 100) { nodes { id name { full } } } }', {});
  for (const u of (r.data?.users?.nodes || [])) if (u.name?.full) users[u.name.full.trim().toLowerCase()] = u.id;
}
let ok = 0, failed = 0, techOk = 0;
for (const [o, ns] of Object.entries(now)) {
  const v = byOrder[o];
  if (!v || !ns.scheduledAtDt) continue;
  const cur2 = toPT(v.startAt);
  if (!(cur2.slice(0, 10) === TO_DATE && cur2.slice(11, 16) === ns.hm)) {
    const planTime = ns.scheduledAtDt.slice(11, 19);
    const endPT = new Date(new Date(`${TO_DATE}T${planTime}-07:00`).getTime() + 3 * 3600000).toLocaleString('sv-SE', { timeZone: TZ });
    const r = await jgql(`mutation { visitEditSchedule(id: "${v.id}", input: { startAt: { date: "${TO_DATE}", time: "${planTime}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`, {});
    const ue = (r.errors || []).map(e => e.message);
    for (const k of Object.keys(r.data || {})) if (r.data[k]?.userErrors) ue.push(...r.data[k].userErrors.map(e => e.message));
    if (ue.length) { failed++; console.log(`  WRITE FAILED ${o}: ${ue.join('; ')}`); } else ok++;
    await sleep(200);
  }
  const curTech = v.assignedUsers?.nodes?.[0]?.name?.full || null;
  const wantId = ns.driver ? users[ns.driver.trim().toLowerCase()] : null;
  if (wantId && curTech !== ns.driver) {
    const r = await jgql(`mutation { visitEditAssignedUsers(visitId: "${v.id}", input: { assignedUserIds: ["${wantId}"] }) { userErrors { message } } }`, {});
    const ue = (r.errors || []).map(e => e.message);
    for (const k of Object.keys(r.data || {})) if (r.data[k]?.userErrors) ue.push(...r.data[k].userErrors.map(e => e.message));
    if (!ue.length) { techOk++; console.log(`  tech ${o}: ${curTech || 'none'} -> ${ns.driver}`); }
    await sleep(200);
  }
}
console.log(`\nDONE: ${ok} time writes, ${techOk} tech writes, ${failed} failed.`);
process.exit(failed ? 1 : 0);
