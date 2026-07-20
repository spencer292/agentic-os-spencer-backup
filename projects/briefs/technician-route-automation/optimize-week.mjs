#!/usr/bin/env node
// WF-2 EQUIVALENT (script engine) — optimize in OptimoRoute + build/execute Jobber write-back.
// Mirrors n8n "Route v2 WF-2" (QEKz72NTP8YRZsUS) + adds TECH ASSIGNMENT write-back
// (visitEditAssignedUsers) because techs are optimizer-assigned (lockTechs=false era).
//
// Usage:
//   node optimize-week.mjs plan      -> start_planning + poll + get_routes + build change plan (NO Jobber writes)
//   node optimize-week.mjs plan --no-replan  -> skip start_planning, read existing routes + build plan
//   node optimize-week.mjs write     -> execute the saved plan (writes times + techs to Jobber)
//   node optimize-week.mjs write --max 5     -> cap writes (canary)
//
// Guards: email-freeze (never writes a date past its D-1 14:00 PT cutoff, checked at WRITE time),
// delta guard (>5 committed/set day-moves aborts), userErrors checked per mutation.
// Plan saved to optimize-plan.json for review between steps.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const PLAN_PATH = path.join(__dirname, 'optimize-plan.json');
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
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
  if (throttled && attempt < 8) {
    const wait = Math.min(60000, 2000 * 2 ** attempt);
    console.log(`  jobber throttled — backoff ${wait / 1000}s`);
    await sleep(wait);
    return jgql(query, variables, attempt + 1);
  }
  if (!res.ok) throw new Error(`Jobber HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data; // caller checks .errors / .data (partial errors possible on mutations)
}

async function orCall(endpoint, body, attempt = 0) {
  const env = loadEnv();
  const url = `https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}${body === null && endpoint.includes('?') ? '' : ''}`;
  const res = await fetch(url, {
    method: body === null ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === null ? undefined : JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) {
    await sleep(1500 * (attempt + 1));
    return orCall(endpoint, body, attempt + 1);
  }
  return d;
}
async function orGet(endpointWithQuery, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpointWithQuery}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) {
    await sleep(1500 * (attempt + 1));
    return orGet(endpointWithQuery, attempt + 1);
  }
  return d;
}

function toPT(iso) {
  const s = new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
  return { date: s.slice(0, 10), hm: s.slice(11, 16) };
}
function ptNow() { return new Date().toLocaleString('sv-SE', { timeZone: TZ }); }
function addDaysPT(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function computeWindow() {
  const nowStr = ptNow();
  const today = nowStr.slice(0, 10);
  const hour = Number(nowStr.slice(11, 13));
  const minOffset = hour >= 14 ? 2 : 1;
  const fromDate = addDaysPT(today, minOffset);
  const [y, m, d] = today.split('-').map(Number);
  const wd = ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1;
  let toDate = addDaysPT(today, (7 - wd) + (wd >= 5 ? 7 : 0));
  if (toDate < fromDate) toDate = fromDate;
  return { fromDate, toDate, afterIso: `${addDaysPT(fromDate, -1)}T23:59:59-07:00`, beforeIso: `${toDate}T23:59:59-07:00` };
}
function emailCutoffOk(dateStr) {
  // date D is writable only until 14:00 PT on D-1
  const nowStr = ptNow();
  const today = nowStr.slice(0, 10);
  const hour = Number(nowStr.slice(11, 13));
  if (dateStr <= today) return false;
  if (dateStr === addDaysPT(today, 1) && hour >= 14) return false;
  return true;
}

async function fetchVisits(win) {
  const visits = [];
  let cursor = null;
  for (;;) {
    const q = `query($after: String) { visits(first: 25, after: $after, filter: { startAt: { after: "${win.afterIso}", before: "${win.beforeIso}" } }) { nodes { id title startAt endAt isComplete assignedUsers(first: 2) { nodes { id name { full } } } job { jobNumber startAt } } pageInfo { hasNextPage endCursor } } }`;
    const r = await jgql(q, { after: cursor });
    if (r.errors) throw new Error('Jobber: ' + JSON.stringify(r.errors).slice(0, 300));
    const v = r.data.visits;
    visits.push(...v.nodes);
    if (!v.pageInfo.hasNextPage) break;
    cursor = v.pageInfo.endCursor;
    await sleep(700);
  }
  return visits;
}

async function fetchUsers() {
  const r = await jgql('query { users(first: 100) { nodes { id name { full } } } }', {});
  if (r.errors) throw new Error('Jobber users: ' + JSON.stringify(r.errors).slice(0, 300));
  const map = {};
  for (const u of r.data.users.nodes) if (u.name && u.name.full) map[u.name.full.trim().toLowerCase()] = u.id;
  return map;
}

const mode = process.argv[2];
const args = process.argv.slice(3);
const maxIdx = args.indexOf('--max');
const maxWrites = maxIdx >= 0 ? Number(args[maxIdx + 1]) : Infinity;
const noReplan = args.includes('--no-replan');

if (mode === 'plan') {
  const win = computeWindow();
  console.log(`Window: ${win.fromDate} -> ${win.toDate}`);

  if (!noReplan) {
    console.log('Starting OptimoRoute planning (balancing ON/WT, clustering)…');
    const sp = await orCall('start_planning', {
      dateRange: { from: win.fromDate, to: win.toDate },
      balancing: 'ON_FORCE', balanceBy: 'WT', clustering: !args.includes('--overlap'), // ON_FORCE: every enabled driver gets a route every day; --overlap disables clustering so balancing can cross territory gravity when one side of the map is overloaded
      // --fresh: re-sequence from scratch (fixes stale ordering from stacked re-plans); default CURRENT for incremental stability
      startWith: args.includes('--fresh') ? 'EMPTY' : 'CURRENT', lockType: 'NONE',
    });
    if (!sp.success) { console.error('start_planning failed:', JSON.stringify(sp)); process.exit(1); }
    const pid = sp.planningId;
    console.log('planningId:', pid);
    for (let i = 0; ; i++) {
      await sleep(10000);
      const st = await orGet(`get_planning_status?planningId=${pid}`);
      const status = (st.status || '').toString();
      console.log(`  poll ${i + 1}: ${status} ${st.percentageComplete != null ? st.percentageComplete + '%' : ''}`);
      if (/^F/i.test(status)) break;
      if (/^E/i.test(status)) { console.error('Planning error:', JSON.stringify(st)); process.exit(1); }
      if (i > 60) { console.error('Planning timeout (10 min)'); process.exit(1); }
    }
  }

  // read routes per date
  const stops = [];
  const routeMeta = [];
  for (let d = win.fromDate; d <= win.toDate; d = addDaysPT(d, 1)) {
    const r = await orGet(`get_routes?date=${d}`);
    if (r.success === false) { console.error('get_routes failed for', d, JSON.stringify(r).slice(0, 200)); process.exit(1); }
    for (const rt of r.routes || []) {
      routeMeta.push({ date: d, driver: rt.driverName, stops: (rt.stops || []).length, start: rt.routeStart || '', end: rt.routeEnd || '' });
      for (const s of rt.stops || []) stops.push({ orderNo: String(s.orderNo), driver: rt.driverName, scheduledAtDt: s.scheduledAtDt, date: d });
    }
    await sleep(400);
  }
  console.log(`Routed stops: ${stops.length}`);

  // Jobber current state
  const visits = await fetchVisits(win);
  const users = await fetchUsers();
  const byNum = {};
  for (const v of visits) {
    let num = null;
    try { num = Buffer.from(v.id, 'base64').toString('utf8').split('/').pop(); } catch {}
    if (!num || !/^\d+$/.test(num)) num = v.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
    byNum[num] = v;
  }

  const writes = [], moves = [], committedMoves = [], orphans = [], techChanges = [];
  const matched = new Set();
  for (const s of stops) {
    const m = s.orderNo.match(/^(\d+)-(\w+)$/);
    if (!m) { orphans.push(s.orderNo); continue; }
    const vis = byNum[m[2]];
    if (!vis) { orphans.push(s.orderNo); continue; }
    matched.add(vis.id);
    const planDate = s.scheduledAtDt.slice(0, 10), planTime = s.scheduledAtDt.slice(11, 16);
    const cur = toPT(vis.startAt);
    const endPT = vis.endAt ? toPT(vis.endAt) : null;
    const winH = vis.endAt ? (new Date(vis.endAt) - new Date(vis.startAt)) / 3600000 : 99;
    const committed = cur.hm !== '00:00' && winH <= 6;
    const jn = String(vis.job && vis.job.jobNumber);
    const isSet = vis.job && vis.job.startAt ? toPT(vis.job.startAt).date === cur.date : false;
    const curTechs = ((vis.assignedUsers || {}).nodes || []);
    const curTech = curTechs[0] && curTechs[0].name && curTechs[0].name.full;
    const newUserId = users[s.driver.trim().toLowerCase()] || null;
    const dayMove = planDate !== cur.date;
    const timeChange = dayMove || planTime !== cur.hm;
    const techChange = (curTech || '') !== s.driver;
    if (dayMove) {
      const rec = { job: jn, from: cur.date, to: planDate, driver: s.driver, isSet, committed };
      moves.push(rec);
      if (committed || isSet) committedMoves.push(rec);
    }
    if (techChange) techChanges.push({ job: jn, from: curTech || '(none)', to: s.driver });
    if (timeChange || techChange) writes.push({
      visitId: vis.id, job: jn, date: planDate, time: s.scheduledAtDt.slice(11, 19),
      driver: s.driver, newUserId, curUserIds: curTechs.map(u => u.id),
      doSchedule: timeChange, doAssign: techChange && !!newUserId, dayMove, isSet,
    });
  }
  const unrouted = visits.filter(v => !v.isComplete && !matched.has(v.id)).map(v => {
    const jn = String(v.job && v.job.jobNumber);
    const d = toPT(v.startAt).date;
    const isSet = v.job && v.job.startAt ? toPT(v.job.startAt).date === d : false;
    return { job: jn, date: d, isSet };
  });
  const unroutedSets = unrouted.filter(u => u.isSet);

  if (committedMoves.length > 5) {
    console.error(`DELTA GUARD: ${committedMoves.length} committed/set day-moves — ABORT. ${JSON.stringify(committedMoves.slice(0, 5))}`);
    process.exit(1);
  }

  const plan = { generatedAt: new Date().toISOString(), window: win, routeMeta, counts: {
    routedStops: stops.length, jobberVisits: visits.length, writes: writes.length,
    dayMoves: moves.length, committedMoves: committedMoves.length, techChanges: techChanges.length,
    unrouted: unrouted.length, unroutedSets: unroutedSets.length, orphans: orphans.length,
  }, writes, moves, techChanges, unrouted, unroutedSets, orphans };
  fs.writeFileSync(PLAN_PATH, JSON.stringify(plan, null, 1));

  console.log('\n=== ROUTE PLAN ===');
  for (const r of routeMeta) console.log(`  ${r.date}  ${r.driver}: ${r.stops} stops  ${r.start}-${r.end}`);
  console.log(`\nWrites needed: ${writes.length} (day-moves ${moves.length}, tech changes ${techChanges.length})`);
  console.log(`Unrouted: ${unrouted.length} (${unroutedSets.length} SETS${unroutedSets.length ? ' — DECIDE: ' + unroutedSets.map(u => 'job ' + u.job + ' ' + u.date).join(', ') : ''})`);
  if (orphans.length) console.log(`Orphans: ${orphans.length}`, orphans.slice(0, 10));
  console.log(`\nPlan saved: ${PLAN_PATH}`);
} else if (mode === 'write') {
  const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
  const todo = plan.writes.filter(w => emailCutoffOk(w.date)).slice(0, maxWrites);
  const skippedCutoff = plan.writes.length - plan.writes.filter(w => emailCutoffOk(w.date)).length;
  console.log(`Executing ${todo.length} of ${plan.writes.length} writes (${skippedCutoff} blocked by email cutoff, cap ${maxWrites === Infinity ? 'none' : maxWrites})`);
  let ok = 0, failed = 0;
  const errs = [];
  for (let i = 0; i < todo.length; i++) {
    const w = todo[i];
    const ops = [];
    if (w.doSchedule) {
      const endT = new Date(`${w.date}T${w.time}-07:00`).getTime() + 3 * 3600000;
      const endPT = new Date(endT).toLocaleString('sv-SE', { timeZone: TZ });
      ops.push(`mutation { visitEditSchedule(id: "${w.visitId}", input: { startAt: { date: "${w.date}", time: "${w.time}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`);
    }
    if (w.doAssign) {
      ops.push(`mutation { visitEditAssignedUsers(visitId: "${w.visitId}", input: { assignedUserIds: ["${w.newUserId}"] }) { userErrors { message } } }`);
    }
    let bad = null;
    for (const op of ops) {
      const r = await jgql(op, {});
      const ue = [];
      if (r.errors) ue.push(...r.errors.map(e => e.message));
      const d = r.data || {};
      for (const k of Object.keys(d)) if (d[k] && d[k].userErrors) ue.push(...d[k].userErrors.map(e => e.message));
      if (ue.length) { bad = ue.join('; '); break; }
      await sleep(150);
    }
    if (bad) { failed++; errs.push(`job ${w.job}: ${bad}`); } else ok++;
    if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${todo.length} (ok ${ok}, failed ${failed})`);
    await sleep(200);
  }
  console.log(`\nWRITE-BACK DONE: ok ${ok}, failed ${failed} of ${todo.length}`);
  if (errs.length) console.log('Errors:', errs.slice(0, 20).join(' | '));
} else {
  console.log('Usage: optimize-week.mjs plan [--no-replan] | write [--max N]');
}
