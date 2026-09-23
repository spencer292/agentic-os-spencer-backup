#!/usr/bin/env node
/**
 * apply-leveled-plan.mjs — applies the 2026-09-21 week proposal to Jobber and OptimoRoute.
 *
 *   node projects/briefs/route-engine/redesign/ops/2026-09-21_swap/apply-leveled-plan.mjs
 *       DRY (default). Layer 1 only: date moves inside each technician, from leveled-plan.json.
 *
 *   ... --with-edge-shift
 *       DRY. Layer 1 + layer 2, from leveled-plan-2.json: technician changes as well as dates.
 *
 *   ... --execute            apply it
 *   ... --create-missing-orders   also create OptimoRoute orders for moved visits that have none
 *   ... --no-replan          skip the OptimoRoute re-plan (leaves the dates unsequenced)
 *
 * THIS HAS NOT BEEN RUN. It exists so Spencer can see exactly what applying would do, and so that
 * applying it later is one reviewed command rather than a fresh improvisation.
 *
 * SAFETY
 *   * The route-engine write gate is the FIRST import. While write-authority.json says
 *     writesEnabled:false, every Jobber mutation and every OptimoRoute non-read is refused at the
 *     transport, --execute or not. That is the intended state. Opening it is Spencer's call:
 *       node projects/briefs/route-engine/scripts/write-authority.mjs enable --reason "..." --ttl 90m
 *   * FRESHNESS RE-CHECK. The board is re-queried at run time and every change is verified against
 *     it. A visit that has since moved day, changed technician, been completed or disappeared is
 *     REFUSED, not forced. A plan built at one moment must not overwrite a decision made later.
 *   * HARD STOP. The first userError or GraphQL error aborts immediately. The ledger records every
 *     mutation before it is sent and its result after, so a resume knows where it stopped.
 *   * ORDER IS LOAD-BEARING. Technician changes first, then dates, then the OptimoRoute orders,
 *     then planning. Planning against orders still carrying the old technician or date would
 *     rebuild the old week.
 *   * visitEditAssignedUsers REPLACES the assignee list, so the new list is built from the visit's
 *     CURRENT list with one name swapped and every ride-along kept.
 *   * NO DRIVER-AVAILABILITY CALLS. update_drivers_parameters unschedules every date it touches.
 *     The 2026-09-21 swap already set availability for this window.
 *   * --with-edge-shift moves customers between technicians. Spencer approves those block by block.
 *     `--blocks a,b,c` applies only the named blocks (by their index in the plan's block list) and
 *     refuses every technician change that is not in them.
 */

import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration } from '../../../../technician-route-automation/service-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const ENV_PATH = path.join(REPO, '.' + 'env');
const LOG_PATH = path.join(__dirname, 'apply-leveled-plan.log');
const LEDGER_PATH = path.join(__dirname, 'apply-leveled-plan.ledger.jsonl');
const TZ = 'America/Los_Angeles';

const EXECUTE = process.argv.includes('--execute');
const EDGE = process.argv.includes('--with-edge-shift');
const CREATE_MISSING = process.argv.includes('--create-missing-orders');
const SKIP_PLANNING = process.argv.includes('--no-replan');
const BLOCK_FILTER = (process.argv.find(a => a.startsWith('--blocks='))?.split('=')[1] || '')
  .split(',').map(s => s.trim()).filter(Boolean).map(Number);

const PLAN_PATH = path.join(__dirname, EDGE ? 'leveled-plan-2.json' : 'leveled-plan.json');
const DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];
const FROM_ISO = '2026-09-21T00:00:00-07:00';
const TO_ISO = '2026-09-25T23:59:59-07:00';

// A run this size is knowable in advance. Far above it means the board moved under the plan.
const MAX_DATE_MOVES = 280;
const MAX_TECH_MOVES = 80;
const MAX_ORDER_CREATES = 90;

// ---------------- logging + ledger ----------------
fs.writeFileSync(LOG_PATH, '');
const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
function log(...a) {
  const line = a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
  fs.appendFileSync(LOG_PATH, line + '\n');
  process.stdout.write(line + '\n');
}
const RUN_ID = `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`;
function ledger(row) { fs.appendFileSync(LEDGER_PATH, JSON.stringify({ runId: RUN_ID, at: new Date().toISOString(), execute: EXECUTE, edge: EDGE, ...row }) + '\n'); }
function die(msg) { log(`\nABORT ${stamp()} — ${msg}`); ledger({ event: 'abort', msg }); process.exit(1); }

// ---------------- env + auth ----------------
function loadEnv() { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tok = null, tokAt = 0;
async function token(force = false) {
  if (!force && tok && Date.now() - tokAt < 50 * 60 * 1000) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json();
  if (!d.access_token) die(`Jobber token refresh failed (http ${r.status})`);
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; tokAt = Date.now(); return tok;
}
async function jgql(query, variables = {}, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) });
  if (res.status === 401 && attempt < 3) { await token(true); return jgql(query, variables, attempt + 1); }
  const d = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { const w = Math.min(60000, 2500 * 2 ** attempt); log(`  … throttled, backoff ${w / 1000}s`); await sleep(w); return jgql(query, variables, attempt + 1); }
  const ts = d.extensions?.cost?.throttleStatus;
  if (ts && ts.currentlyAvailable < 5000) await sleep(Math.min(Math.ceil(((5000 - ts.currentlyAvailable) / (ts.restoreRate || 500)) * 1000), 20000));
  return d;
}
async function orCall(endpoint, body, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
const ptDate = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const ptTime = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(11, 19);
function visitNumOf(id) { let n = null; try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {} if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10); return n; }

// ---------------- 0. plan + freshness ----------------
log(`=== APPLY ${EDGE ? 'LEVELLED WEEK + EDGE SHIFT' : 'LEVELLED WEEK'} ${stamp()} PT ===`);
log(`mode: ${EXECUTE ? 'LIVE (--execute)' : 'DRY (default) — queries only, nothing written'}`);
log(`plan: ${path.basename(PLAN_PATH)}`);
log(`ledger: ${LEDGER_PATH}`);

const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
const planTechMoves = EDGE ? (plan.techMoves || []) : [];
const planDateMoves = EDGE ? (plan.dayMoves || []) : (plan.moves || []).map(m => ({ visitId: m.visitId, orderNo: m.orderNo, job: m.job, client: m.client, city: m.city, tech: m.tech, fromDay: m.fromDay, toDay: m.toDay }));
log(`plan generated ${plan.generatedAt}: ${planTechMoves.length} technician changes, ${planDateMoves.length} date changes\n`);

for (const d of DATES) { const dow = new Date(d + 'T12:00:00Z').getUTCDay(); if (dow === 0 || dow === 6) die(`${d} is a weekend — Got Moles is Mon-Fri`); }
for (const m of planDateMoves) {
  if (!DATES.includes(m.toDay)) die(`date change ${m.orderNo} targets ${m.toDay}, outside the week`);
  if (m.toDay === m.fromDay) die(`date change ${m.orderNo} is a no-op`);
}
if (planDateMoves.length > MAX_DATE_MOVES) die(`${planDateMoves.length} date changes exceeds MAX_DATE_MOVES ${MAX_DATE_MOVES} — nothing written`);
if (planTechMoves.length > MAX_TECH_MOVES) die(`${planTechMoves.length} technician changes exceeds MAX_TECH_MOVES ${MAX_TECH_MOVES} — nothing written`);

// Block-by-block approval. Without --blocks every block in the plan is applied; with it, only the
// listed ones, and every technician change outside them is dropped.
let allowedTechIds = null;
if (EDGE && BLOCK_FILTER.length) {
  const blocks = plan.blocks || [];
  allowedTechIds = new Set();
  for (const i of BLOCK_FILTER) {
    const b = blocks[i];
    if (!b) die(`--blocks names block ${i}, which does not exist (the plan has ${blocks.length}, numbered 0 to ${blocks.length - 1})`);
    for (const v of b.visits) allowedTechIds.add(v.visitId);
    log(`  approved block ${i}: ${b.name} — ${b.customers} customers, ${b.fromTech} to ${b.toTech}`);
  }
  log('');
}
if (EDGE) {
  log(`--- BLOCKS IN THIS PLAN ---`);
  (plan.blocks || []).forEach((b, i) => log(`  [${i}] ${String(b.customers).padStart(2)} customers  ${b.fromTech} -> ${b.toTech}  ${b.name}  (${b.kmSaved} km, ${b.hoursOffDonor} h off the donor)`));
  log(allowedTechIds ? `  applying only blocks ${BLOCK_FILTER.join(', ')}\n` : `  applying every block — pass --blocks=0,3,7 to approve a subset\n`);
}

const VQ = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!,$n:Int!){
  visits(first:$n, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt endAt duration isComplete visitStatus
      job{ jobNumber } client{ name }
      assignedUsers(first:6){ nodes{ id name{ full } } }
      property{ address{ street1 street2 city province postalCode } } }
    pageInfo{ hasNextPage endCursor } } }`;

async function pullVisits() {
  const rows = new Map();
  let cursor = null;
  for (;;) {
    const d = await jgql(VQ, { a: cursor, after: FROM_ISO, before: TO_ISO, n: 50 });
    if (!d.data?.visits) die('visits query returned no data: ' + JSON.stringify(d).slice(0, 400));
    for (const v of d.data.visits.nodes) {
      const a = v.property?.address || {};
      rows.set(v.id, {
        id: v.id, visitNum: visitNumOf(v.id), jobNumber: v.job?.jobNumber ?? null, client: v.client?.name || null,
        title: v.title || '', date: ptDate(v.startAt), startTime: ptTime(v.startAt),
        endTime: ptTime(v.endAt), duration: v.duration ?? null, isComplete: v.isComplete, city: a.city || null,
        address: [a.street1, a.street2, a.city, a.province || 'WA', a.postalCode].filter(Boolean).join(', '),
        assignees: (v.assignedUsers?.nodes || []).map(u => ({ id: u.id, name: u.name?.full || null })),
        tech: v.assignedUsers?.nodes?.[0]?.name?.full || null,
      });
    }
    if (!d.data.visits.pageInfo.hasNextPage) break;
    cursor = d.data.visits.pageInfo.endCursor;
  }
  return rows;
}

const UQ = `query { users(first:80){ nodes{ id name{ full } status } } }`;
const ud = await jgql(UQ);
const users = (ud.data?.users?.nodes || []).filter(u => u.status === 'ACTIVATED');
const userId = n => (users.find(u => (u.name?.full || '') === n) || {}).id || null;

const live = await pullVisits();
log(`live Jobber: ${live.size} visits in the window`);

// ---- technician changes
const techReady = [], techRefused = [];
for (const m of planTechMoves) {
  const v = live.get(m.visitId);
  if (allowedTechIds && !allowedTechIds.has(m.visitId)) { techRefused.push({ ...m, why: 'block not approved on this run' }); continue; }
  if (!v) { techRefused.push({ ...m, why: 'visit no longer in the window' }); continue; }
  if (v.isComplete) { techRefused.push({ ...m, why: 'already completed' }); continue; }
  if (v.tech !== m.fromTech) { techRefused.push({ ...m, why: `technician already changed — is ${v.tech}, plan said ${m.fromTech}` }); continue; }
  const toId = userId(m.toTech);
  if (!toId) { techRefused.push({ ...m, why: `no ACTIVATED Jobber user for "${m.toTech}"` }); continue; }
  // Replace the list, keeping every ride-along. Only the named technician is swapped out.
  const swapped = v.assignees.map(a => (a.name === m.fromTech ? { id: toId, name: m.toTech } : a));
  const seen = new Set(); const list = [];
  for (const a of swapped) { if (!a.id || seen.has(a.id)) continue; seen.add(a.id); list.push(a); }
  techReady.push({ ...m, live: v, nextIds: list.map(a => a.id), nextNames: list.map(a => a.name), currentNames: v.assignees.map(a => a.name) });
}

// ---- date changes
const dateReady = [], dateRefused = [];
for (const m of planDateMoves) {
  const v = live.get(m.visitId);
  if (!v) { dateRefused.push({ ...m, why: 'visit no longer in the window' }); continue; }
  if (v.isComplete) { dateRefused.push({ ...m, why: 'already completed' }); continue; }
  if (v.date !== m.fromDay) { dateRefused.push({ ...m, why: `moved since the plan was built — now ${v.date}, plan said ${m.fromDay}` }); continue; }
  dateReady.push({ ...m, live: v });
}
log(`  technician changes ready : ${techReady.length}   refused: ${techRefused.length}`);
log(`  date changes ready       : ${dateReady.length}   refused: ${dateRefused.length}`);
for (const r of [...techRefused, ...dateRefused]) log(`    REFUSE #${r.job} ${r.orderNo} ${r.client} — ${r.why}`);
if (!techReady.length && !dateReady.length) die('nothing left to apply — the board has changed since the plan was built; rebuild it');

// Two visits of one job must not end up on one day. Checked against the LIVE board, not the plan.
{
  const target = new Map(dateReady.map(r => [r.visitId, r.toDay]));
  const count = (get) => { const m = new Map(); for (const v of live.values()) { if (v.isComplete) continue; const k = `${v.jobNumber}|${get(v)}`; m.set(k, (m.get(k) || 0) + 1); } return m; };
  const before = count(v => v.date);
  const after = count(v => target.get(v.id) || v.date);
  const created = [...after].filter(([k, n]) => n > 1 && (before.get(k) || 0) < 2);
  if (created.length) die(`applying this against the live board would put two visits of one job on one day: ${created.map(([k]) => k).join(', ')} — rebuild the plan against a fresh pull`);
}

log(`\n--- JOBBER: ${techReady.length} visitEditAssignedUsers ---`);
for (const r of techReady) log(`  visitEditAssignedUsers(visitId:"${r.visitId}", input:{assignedUserIds:[${r.nextIds.map(i => `"${i}"`).join(',')}]})   #${r.job} ${r.city} ${r.client} : ${r.currentNames.join('+')} -> ${r.nextNames.join('+')}`);
log(`\n--- JOBBER: ${dateReady.length} visitEditSchedule ---`);
for (const r of dateReady) {
  const v = r.live;
  log(`  visitEditSchedule(id:"${v.id}", input:{ startAt:{date:"${r.toDay}", time:"${v.startTime}", timezone:"${TZ}"}, endAt:{date:"${r.toDay}", time:"${v.endTime}", timezone:"${TZ}"} })   #${r.job} ${r.tech} ${r.fromDay} -> ${r.toDay}  ${r.city} ${r.client}`);
}

// ---------------- OptimoRoute order picture ----------------
const orders = new Map();
{
  let after = null;
  do {
    const body = { dateRange: { from: DATES[0], to: DATES[DATES.length - 1] }, includeOrderData: true };
    if (after) body.after_tag = after;
    const r = await orCall('search_orders', body);
    if (r.success === false) die('search_orders failed: ' + JSON.stringify(r).slice(0, 250));
    for (const o of r.orders || []) { const d = o.data || o; orders.set(String(d.orderNo || ''), d); }
    after = r.after_tag || null;
    await sleep(200);
  } while (after);
}
log(`\nOptimoRoute: ${orders.size} orders in the window`);

// Final state per visit: whoever ends up owning it, on whatever day it ends up on.
const finalTech = new Map(), finalDay = new Map();
for (const v of live.values()) { finalTech.set(v.id, v.tech); finalDay.set(v.id, v.date); }
for (const r of techReady) finalTech.set(r.visitId, r.toTech);
for (const r of dateReady) finalDay.set(r.visitId, r.toDay);

const touched = new Set([...techReady.map(r => r.visitId), ...dateReady.map(r => r.visitId)]);
const orderUpdates = [], orderCreates = [];
for (const id of touched) {
  const v = live.get(id);
  const no = `${v.jobNumber}-${v.visitNum}`;
  const day = finalDay.get(id), tech = finalTech.get(id);
  if (orders.has(no)) { orderUpdates.push({ orderNo: no, date: day, tech, wasDate: orders.get(no).date || '?', wasTech: orders.get(no).assignedTo?.serial ?? 'unset', client: v.client }); continue; }
  const isSet = /\bset\b/i.test(v.title);
  orderCreates.push({
    operation: 'CREATE', orderNo: no, type: 'T', date: day,
    duration: serviceDuration(tech, isSet, v.jobNumber, day), priority: 'M',
    location: { address: v.address, locationName: ((v.title || '') + ' · #' + v.jobNumber).slice(0, 60), acceptPartialMatch: true, acceptMultipleResults: true },
    allowedDates: { from: day, to: day },
    notes: 'Jobber job ' + v.jobNumber + (isSet ? ' (SET)' : '') + ' [levelled week 2026-09-21]',
    assignedTo: { serial: tech }, _client: v.client,
  });
}
log(`  order UPDATEs : ${orderUpdates.length}`);
log(`  no order yet  : ${orderCreates.length}${CREATE_MISSING ? ' (will be CREATEd)' : ' (will be SKIPPED — pass --create-missing-orders to add them to the map)'}`);
if (CREATE_MISSING && orderCreates.length > MAX_ORDER_CREATES) die(`${orderCreates.length} order creates exceeds MAX_ORDER_CREATES ${MAX_ORDER_CREATES}`);
if (CREATE_MISSING) { const bad = orderCreates.filter(c => !c.location.address); if (bad.length) die(`${bad.length} orders to create have no street address: ${bad.map(c => c.orderNo).join(', ')}`); }

log(`\n--- OPTIMOROUTE CALL LIST ---`);
for (const u of orderUpdates) log(`  create_order {operation:"UPDATE", orderNo:"${u.orderNo}", date:"${u.date}", allowedDates:{from:"${u.date}",to:"${u.date}"}, assignedTo:{serial:"${u.tech}"}}   (was ${u.wasTech} on ${u.wasDate})`);
if (CREATE_MISSING) for (const c of orderCreates) log(`  create_order {operation:"CREATE", orderNo:"${c.orderNo}", date:"${c.date}", duration:${c.duration}, assignedTo:{serial:"${c.assignedTo.serial}"}}`);
else for (const c of orderCreates) log(`  SKIP (no order) ${c.orderNo} ${c._client} -> ${c.date} ${c.assignedTo.serial}`);
for (const d of DATES) log(`  start_planning {dateRange:{from:"${d}",to:"${d}"}, balancing:"OFF", startWith:"CURRENT", lockType:"NONE"}  -> poll get_planning_status -> get_routes?date=${d}`);
log(`  (no update_drivers_parameters — that call unschedules the dates it touches and availability is already set)`);

if (!EXECUTE) {
  log(`\nDRY RUN — nothing written. Log: ${LOG_PATH}`);
  log(`Re-run with --execute once Spencer has approved and the write gate is open.`);
  ledger({ event: 'dry-run', techReady: techReady.length, dateReady: dateReady.length, techRefused: techRefused.length, dateRefused: dateRefused.length, orderUpdates: orderUpdates.length, orderCreates: orderCreates.length });
  process.exit(0);
}

// ---------------- 1. Jobber: technician changes ----------------
let applied = 0;
const total = techReady.length + dateReady.length;
async function jobberStep(label, q, ctx) {
  ledger({ event: label, state: 'sending', ...ctx });
  const res = await jgql(q);
  const key = label.split('.').pop();
  const errs = [...(res.errors || []).map(e => e.message), ...((res.data?.[key]?.userErrors) || []).map(e => e.message)];
  applied++;
  log(`  [${String(applied).padStart(3)}/${total}] ${ctx.line}  ${errs.length ? 'FAILED: ' + errs.join('; ') : 'ok'}`);
  if (!errs.length) { ledger({ event: label, state: 'ok', ...ctx }); return; }
  // Jobber flakes transiently on recurring visits ("required to handle future items"). One retry,
  // then stop — a half-applied plan is only recoverable if it stops where the ledger says it did.
  ledger({ event: label, state: 'error', ...ctx, errors: errs });
  await sleep(1500);
  const res2 = await jgql(q);
  const e2 = [...(res2.errors || []).map(e => e.message), ...((res2.data?.[key]?.userErrors) || []).map(e => e.message)];
  if (e2.length) { ledger({ event: label, state: 'fatal', ...ctx, errors: e2 }); die(`${ctx.line} failed twice: ${e2.join('; ')}. ${applied - 1} changes applied before it — see the ledger.`); }
  log(`        retry ok`);
  ledger({ event: label, state: 'ok-on-retry', ...ctx });
}

log(`\n=== JOBBER: ${techReady.length} technician changes ===`);
for (const r of techReady) {
  const q = `mutation { visitEditAssignedUsers(visitId: ${JSON.stringify(r.visitId)}, input: { assignedUserIds: [${r.nextIds.map(i => `"${i}"`).join(',')}] }) { userErrors { message } } }`;
  await jobberStep('jobber.visitEditAssignedUsers', q, { visitId: r.visitId, job: r.job, fromTech: r.fromTech, toTech: r.toTech, line: `#${String(r.job).padEnd(5)} ${String(r.city || '').padEnd(14)} ${String(r.client || '').slice(0, 24).padEnd(25)} ${r.currentNames.join('+')} -> ${r.nextNames.join('+')}` });
  await sleep(300);
}

// ---------------- 2. Jobber: date changes ----------------
log(`\n=== JOBBER: ${dateReady.length} date changes ===`);
for (const r of dateReady) {
  const v = r.live;
  const q = `mutation { visitEditSchedule(id: ${JSON.stringify(v.id)}, input: { startAt: { date: "${r.toDay}", time: "${v.startTime}", timezone: "${TZ}" }, endAt: { date: "${r.toDay}", time: "${v.endTime}", timezone: "${TZ}" } }) { visit { startAt } userErrors { message } } }`;
  await jobberStep('jobber.visitEditSchedule', q, { visitId: v.id, job: r.job, from: r.fromDay, to: r.toDay, time: v.startTime, line: `#${String(r.job).padEnd(5)} ${String(r.tech || '').padEnd(15)} ${r.fromDay} -> ${r.toDay}  ${String(r.city || '').padEnd(14)} ${String(r.client || '').slice(0, 24)}` });
  await sleep(300);
}

// ---------------- 3. OptimoRoute orders ----------------
log(`\n=== OPTIMOROUTE: ${orderUpdates.length} order UPDATEs ===`);
for (const u of orderUpdates) {
  const body = { operation: 'UPDATE', orderNo: u.orderNo, date: u.date, allowedDates: { from: u.date, to: u.date }, assignedTo: { serial: u.tech } };
  ledger({ event: 'optimo.create_order.UPDATE', state: 'sending', ...body });
  const r = await orCall('create_order', body);
  log(`  UPDATE ${u.orderNo}  ${u.wasTech} ${u.wasDate} -> ${u.tech} ${u.date}  ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`);
  ledger({ event: 'optimo.create_order.UPDATE', state: r.success === false ? 'error' : 'ok', orderNo: u.orderNo, response: r.success === false ? r : undefined });
  if (r.success === false) die(`create_order UPDATE failed for ${u.orderNo} — Jobber is already changed, OptimoRoute is not. Fix the order, then re-run to plan the dates.`);
  await sleep(150);
}
if (CREATE_MISSING) {
  log(`\n=== OPTIMOROUTE: ${orderCreates.length} order CREATEs ===`);
  for (const c of orderCreates) {
    const { _client, ...body } = c;
    ledger({ event: 'optimo.create_order.CREATE', state: 'sending', orderNo: c.orderNo, date: c.date });
    const r = await orCall('create_order', body);
    log(`  CREATE ${c.orderNo} ${c.date} ${c.assignedTo.serial}  ${r.success === false ? 'FAILED ' + JSON.stringify(r).slice(0, 160) : 'ok'}`);
    ledger({ event: 'optimo.create_order.CREATE', state: r.success === false ? 'error' : 'ok', orderNo: c.orderNo, response: r.success === false ? r : undefined });
    if (r.success === false) die(`create_order CREATE failed for ${c.orderNo}`);
    await sleep(350);
  }
} else if (orderCreates.length) {
  log(`\n${orderCreates.length} changed visits have no OptimoRoute order and were skipped. They are correct in Jobber but will not appear on the map until an order exists.`);
}

// ---------------- 4. re-plan ----------------
if (SKIP_PLANNING) log(`\n--no-replan — planning skipped. The five dates hold the new orders but are not re-sequenced.`);
else for (const d of DATES) {
  log(`\n=== PLAN ${d} (balancing OFF) ===`);
  ledger({ event: 'optimo.start_planning', state: 'sending', date: d });
  const sp = await orCall('start_planning', { dateRange: { from: d, to: d }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' });
  if (!sp.success) { ledger({ event: 'optimo.start_planning', state: 'error', date: d, response: sp }); die(`start_planning ${d} failed: ${JSON.stringify(sp).slice(0, 200)}`); }
  let done = false;
  for (let i = 0; i < 90; i++) {
    await sleep(4000);
    const st = await orGet(`get_planning_status?planningId=${sp.planningId}`);
    if (st.status === 'F' || st.status === 'finished' || st.finished === true) { done = true; break; }
    if (st.status === 'E' || st.success === false) { ledger({ event: 'optimo.start_planning', state: 'error', date: d, response: st }); die(`planning ${d} errored: ${JSON.stringify(st).slice(0, 200)}`); }
  }
  if (!done) die(`planning ${d} did not finish inside 6 minutes — do NOT re-run blind, check OptimoRoute first`);
  ledger({ event: 'optimo.start_planning', state: 'ok', date: d });
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    const stops = rt.stops || [];
    const last = stops[stops.length - 1] || {};
    log(`  ${String(rt.driverName).padEnd(18)} ${String(stops.length).padStart(3)} stops  ${String(rt.duration).padStart(4)} min  ${Number(rt.distance).toFixed(0).padStart(4)} km  first ${String(stops[0]?.scheduledAtDt || '').slice(11, 16)}  last ${String(last.scheduledAtDt || '').slice(11, 16)}`);
    if (/T(1[7-9]|2[0-3]):/.test(String(last.scheduledAtDt || ''))) log(`  WARNING ${rt.driverName} ends at ${String(last.scheduledAtDt).slice(11, 16)} — the day had no room for its tail`);
  }
  ledger({ event: 'optimo.get_routes', date: d, routes: (rr.routes || []).map(rt => ({ driver: rt.driverName, stops: (rt.stops || []).length, duration: rt.duration, distance: rt.distance })) });
}

// ---------------- 5. verification ----------------
log(`\n=== VERIFY ===`);
const after = await pullVisits();
let wrong = 0;
for (const r of techReady) {
  const v = after.get(r.visitId);
  if (!v) { log(`  MISSING #${r.job} ${r.orderNo}`); wrong++; continue; }
  if (v.tech !== r.toTech) { log(`  WRONG TECH #${r.job} ${r.orderNo} — is ${v.tech}, plan said ${r.toTech}`); wrong++; }
}
for (const r of dateReady) {
  const v = after.get(r.visitId);
  if (!v) { log(`  MISSING #${r.job} ${r.orderNo}`); wrong++; continue; }
  if (v.date !== r.toDay) { log(`  WRONG DAY #${r.job} ${r.orderNo} — is ${v.date}, plan said ${r.toDay}`); wrong++; }
}
log(`  changes verified: ${total - wrong}/${total}`);
const counts = {};
for (const v of after.values()) { const k = `${v.tech}|${v.date}`; counts[k] = (counts[k] || 0) + 1; }
const planned = EDGE
  ? Object.fromEntries(Object.entries(plan.perTech).map(([t, r]) => [t, DATES.map(d => r.days[d].stage2?.stops ?? 0)]))
  : Object.fromEntries(Object.entries(plan.plan).map(([t, p]) => [t, DATES.map(d => p.after[d]?.stops ?? 0)]));
for (const tech of Object.keys(planned).sort()) {
  const want = planned[tech], got = DATES.map(d => counts[`${tech}|${d}`] || 0);
  log(`  ${tech.padEnd(17)} plan ${want.join('/')}   actual ${got.join('/')}${want.join() === got.join() ? '' : '   MISMATCH'}`);
}
ledger({ event: 'verify', total, wrong });
if (wrong) die(`${wrong} changes did not land — see above`);
log(`\ndone ${stamp()} PT — log: ${LOG_PATH}`);
