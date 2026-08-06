#!/usr/bin/env node
// GRID TECH REALIGN — force every OptimoRoute order in a window onto the tech (and, where the visit
// is not a customer-booked SET, the day) that the territory grid says owns it, then re-plan each day
// with the drivers pinned so the optimizer can re-sequence but never re-assign.
//
// Born 2026-08-04. extend-horizon plans the forward weeks via `push-week --grid`, which pins the
// grid DAY but leaves TECH to the optimizer (lockTechs=false). On the week of 08-10 the optimizer
// handed Cory Ventura's South King work to Luke LaVergne and Luke's Tacoma/peninsula work to Cory —
// a clean 160-stop swap. Each route was internally clustered, so it looked fine in OR, but both men
// started from home on the wrong side of the map every day. The week of 08-03 was hand-cut on 08-01
// and is 99.7% grid-correct, which is why this only shows up in the machine-generated weeks.
//
// Usage: node grid-tech-realign.mjs dry|live --from=YYYY-MM-DD --to=YYYY-MM-DD
//                                   [--grid=territory-grid-v5.json] [--no-day-moves] [--show=40]
//
// Rules (hard):
//   - SET visits (visit date == job start date, i.e. an appointment actually booked for that day)
//     NEVER move day. Tech may still be corrected.
//   - A job with more than one visit in the window keeps its own days (never stack two visits of the
//     same customer onto one day) — same rule as push-week.
//   - Never assign to a tech in the grid's `notWorking` list, or to a day that tech does not work.
//   - Never touch today or a frozen day (date D locks 14:00 PT on D-1).
//   - Post-replan verification: every order must come back on its grid tech and be scheduled, or the
//     day aborts with ZERO Jobber writes. Never deletes anything.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const RUNS_DIR = path.join(__dirname, 'drift-runs');
const TZ = 'America/Los_Angeles';
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: grid-tech-realign.mjs dry|live --from=YYYY-MM-DD --to=YYYY-MM-DD [--grid=file] [--no-day-moves]'); process.exit(1); }
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const GRIDF = flag('grid', 'territory-grid-v5.json');
const NO_DAY_MOVES = process.argv.includes('--no-day-moves');
// Techs read their schedule out of the Jobber app, so a visit whose Jobber assignee is stale (an
// off-roster name, or the tech the optimizer displaced) is invisible to whoever is actually driving
// to it. On by default; --no-jobber-tech leaves Jobber assignees alone. (Spencer approved 2026-08-04.)
const SYNC_JOBBER_TECH = !process.argv.includes('--no-jobber-tech');
const SHOW = Number(flag('show', 40));
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
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
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
  if (!res.ok) throw new Error(`Jobber HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
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
const toPT = (iso) => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
const ptNow = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function dowOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
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
async function fetchUsers() {
  const r = await jgql('query { users(first: 100) { nodes { id name { full } } } }', {});
  if (r.errors) throw new Error('Jobber users: ' + JSON.stringify(r.errors).slice(0, 300));
  const map = {};
  for (const u of r.data.users.nodes) if (u.name && u.name.full) map[u.name.full.trim().toLowerCase()] = u.id;
  return map;
}

const GRID = JSON.parse(fs.readFileSync(path.join(__dirname, GRIDF), 'utf8'));
const NOT_WORKING = new Set(GRID.notWorking || []);
const WORKS = GRID.works || {};
function gridFor(zip, jobNo) {
  const ov = GRID.jobOverrides && GRID.jobOverrides[String(jobNo)];
  const z = GRID.zips[zip];
  const days = (ov && (ov.days || (ov.day && [ov.day]))) || (z && (z.days || (z.day && [z.day]))) || null;
  const tech = (ov && ov.tech) || (z && z.tech) || null;
  return { days: days && days.length ? days : null, tech, viaOverride: !!ov };
}

console.log(`GRID TECH REALIGN (${mode.toUpperCase()})  ${FROM} .. ${TO}   grid ${GRIDF}`);
console.log(`now ${ptNow()} PT\n`);

// ---------- gather ----------
const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt isComplete
      client{ name }
      job{ jobNumber startAt }
      property{ address{ street city postalCode } }
      assignedUsers(first:4){ nodes{ id name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;
let cur = null; const visits = [];
for (;;) {
  const d = await jgql(Q, { a: cur, after: `${addDays(FROM, -1)}T23:59:59-07:00`, before: `${TO}T23:59:59-07:00` });
  if (!d.data) { console.error('Jobber query failed:', JSON.stringify(d).slice(0, 300)); process.exit(1); }
  visits.push(...d.data.visits.nodes);
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cur = d.data.visits.pageInfo.endCursor;
  await sleep(250);
}
const active = visits.filter(v => !v.isComplete);
const visByOrder = {};
const jobVisitCount = {};
for (const v of active) {
  const jDate = toPT(v.startAt).slice(0, 10);
  if (jDate < FROM || jDate > TO) continue;
  const jn = String(v.job?.jobNumber || '');
  visByOrder[jn + '-' + visitNumOf(v)] = v;
  jobVisitCount[jn] = (jobVisitCount[jn] || 0) + 1;
}
console.log(`Jobber active visits in window: ${Object.keys(visByOrder).length}`);

const stops = {}; const driverSerials = {};
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    if (rt.driverName) driverSerials[rt.driverName.trim().toLowerCase()] = rt.driverSerial || null;
    for (const s of rt.stops || []) {
      const onum = String(s.orderNo || '');
      if (!/^\d+-\w+$/.test(onum)) continue;
      stops[onum] = { date: d, driver: rt.driverName, driverSerial: rt.driverSerial || null, hm: (s.scheduledAtDt || '').slice(11, 16) };
    }
  }
  await sleep(300);
}
console.log(`OptimoRoute own stops in window: ${Object.keys(stops).length}`);
console.log(`OR drivers: ${Object.keys(driverSerials).join(', ')}\n`);

// ---------- build the target plan ----------
const plan = [], skipped = [];
for (const [orderNo, st] of Object.entries(stops)) {
  const v = visByOrder[orderNo];
  if (!v) { skipped.push({ orderNo, why: 'no active Jobber visit (orphan)' }); continue; }
  const jn = String(v.job?.jobNumber || '');
  const zip = ((v.property?.address?.postalCode || '') + '').trim().slice(0, 5);
  const g = gridFor(zip, jn);
  if (!g.tech) { skipped.push({ orderNo, job: jn, zip, why: 'zip not in grid — no rule' }); continue; }
  if (NOT_WORKING.has(g.tech)) { skipped.push({ orderNo, job: jn, zip, why: `grid tech ${g.tech} is off-roster` }); continue; }
  const serial = driverSerials[g.tech.trim().toLowerCase()];
  if (!serial) { skipped.push({ orderNo, job: jn, zip, why: `no OR driver serial for ${g.tech}` }); continue; }

  const jDate = toPT(v.startAt).slice(0, 10);
  const isSet = v.job?.startAt ? toPT(v.job.startAt).slice(0, 10) === jDate : false;
  const multiVisit = (jobVisitCount[jn] || 0) > 1;

  // target day: keep the current OR day when it is already a valid grid day; otherwise the first
  // grid day for this zip that falls inside the window AND that the tech actually works.
  let targetDay = st.date;
  let dayReason = 'already on a grid day';
  const curDow = dowOf(st.date);
  const onGrid = g.days ? g.days.includes(curDow) : true;
  if (!onGrid && !NO_DAY_MOVES && !isSet && !multiVisit) {
    const works = WORKS[g.tech] || DOW;
    const cands = [];
    for (let d = FROM; d <= TO; d = addDays(d, 1)) {
      const dw = dowOf(d);
      if (g.days.includes(dw) && works.includes(dw) && emailCutoffOk(d)) cands.push(d);
    }
    if (cands.length) { targetDay = cands[0]; dayReason = `off grid (${curDow}) -> grid day ${dowOf(cands[0])}`; }
    else dayReason = `off grid (${curDow}) but no grid day available in window — day kept`;
  } else if (!onGrid) {
    dayReason = isSet ? `off grid (${curDow}) but SET — day kept` : multiVisit ? `off grid (${curDow}) but multi-visit job — day kept` : `off grid (${curDow}) — day moves disabled`;
  }

  const techChange = st.driver !== g.tech;
  const dayChange = targetDay !== st.date;
  if (!techChange && !dayChange) continue;
  if (!emailCutoffOk(targetDay) || !emailCutoffOk(st.date)) { skipped.push({ orderNo, job: jn, why: `frozen/today (${st.date} -> ${targetDay})` }); continue; }
  plan.push({
    orderNo, job: jn, client: v.client?.name, zip, city: v.property?.address?.city,
    fromDay: st.date, toDay: targetDay, fromTech: st.driver, toTech: g.tech, serial,
    techChange, dayChange, isSet, multiVisit, dayReason, viaOverride: g.viaOverride,
    gridDays: g.days,
  });
}

const techOnly = plan.filter(p => p.techChange && !p.dayChange);
const dayOnly = plan.filter(p => !p.techChange && p.dayChange);
const both = plan.filter(p => p.techChange && p.dayChange);
console.log('=== PLAN ===');
console.log(`  tech change only : ${techOnly.length}`);
console.log(`  day change only  : ${dayOnly.length}`);
console.log(`  tech + day       : ${both.length}`);
console.log(`  TOTAL orders touched: ${plan.length}`);
console.log(`  untouched (already grid-correct): ${Object.keys(stops).length - plan.length - skipped.length}`);
console.log(`  skipped: ${skipped.length}`);

const pairs = {};
for (const p of plan) if (p.techChange) { const k = `${String(p.fromTech).split(' ')[0]} -> ${p.toTech.split(' ')[0]}`; pairs[k] = (pairs[k] || 0) + 1; }
console.log('\n  tech reassignments (from -> to):');
for (const [k, n] of Object.entries(pairs).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(3)}  ${k}`);

const loadBefore = {}, loadAfter = {};
for (const [orderNo, st] of Object.entries(stops)) {
  const k = st.date + '|' + (st.driver || '?');
  loadBefore[k] = (loadBefore[k] || 0) + 1;
  const p = plan.find(x => x.orderNo === orderNo);
  const k2 = (p ? p.toDay : st.date) + '|' + (p ? p.toTech : st.driver || '?');
  loadAfter[k2] = (loadAfter[k2] || 0) + 1;
}
console.log('\n  stops per tech-day  (before -> after):');
const allKeys = [...new Set([...Object.keys(loadBefore), ...Object.keys(loadAfter)])].sort();
let lastDay = '';
for (const k of allKeys) {
  const [d, t] = k.split('|');
  if (d !== lastDay) { console.log(`   ${d} (${dowOf(d)})`); lastDay = d; }
  const b = loadBefore[k] || 0, a = loadAfter[k] || 0;
  console.log(`      ${t.padEnd(20)} ${String(b).padStart(3)} -> ${String(a).padStart(3)}${a > 32 ? '   << HEAVY' : ''}${a === 0 && b > 0 ? '   << emptied' : ''}`);
}

if (skipped.length) {
  console.log('\n  skipped detail:');
  const why = {};
  for (const s of skipped) why[s.why] = (why[s.why] || 0) + 1;
  for (const [w, n] of Object.entries(why).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(3)}  ${w}`);
}

console.log(`\n  sample of changes (first ${SHOW}):`);
for (const p of plan.slice(0, SHOW)) {
  console.log(`    #${String(p.job).padEnd(5)} ${String(p.zip).padEnd(6)} ${String(p.city || '').slice(0, 14).padEnd(15)}` +
    `${p.fromDay}/${String(p.fromTech || '?').split(' ')[0].padEnd(9)} -> ${p.toDay}/${p.toTech.split(' ')[0].padEnd(9)}` +
    `${p.isSet ? ' [SET]' : ''}${p.viaOverride ? ' [override]' : ''}  ${p.dayChange ? p.dayReason : ''}`);
}
if (plan.length > SHOW) console.log(`    … +${plan.length - SHOW} more`);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.mkdirSync(RUNS_DIR, { recursive: true });
const reportPath = path.join(RUNS_DIR, `realign-${stamp}.json`);
const report = { ranAt: new Date().toISOString(), mode, from: FROM, to: TO, grid: GRIDF, plan, skipped, days: [] };
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

if (mode === 'dry') {
  console.log(`\nDRY RUN — nothing written. Report: ${reportPath}`);
  process.exit(0);
}

// ---------- apply ----------
console.log('\n=== APPLYING ===');
const users = SYNC_JOBBER_TECH ? await fetchUsers() : {};
if (SYNC_JOBBER_TECH) console.log(`Jobber users resolved: ${Object.keys(users).length}`);
const touchedDays = [...new Set([...plan.map(p => p.fromDay), ...plan.map(p => p.toDay)])].sort();

// 1. pin EVERY order in the window to its target day + tech (untouched ones pin to where they are,
//    so the re-plan can re-sequence but never re-assign anybody).
console.log(`Pinning ${Object.keys(stops).length} orders to target day+tech…`);
let pinFails = 0;
for (const [orderNo, st] of Object.entries(stops)) {
  const p = plan.find(x => x.orderNo === orderNo);
  const day = p ? p.toDay : st.date;
  const serial = p ? p.serial : st.driverSerial;
  const upd = { operation: 'UPDATE', orderNo, date: day, allowedDates: { from: day, to: day }, priority: 'M' };
  if (serial) upd.assignedTo = { serial };
  const r = await orCall('create_order', upd);
  if (!r.success) { pinFails++; console.log(`  PIN FAILED ${orderNo}: ${JSON.stringify(r).slice(0, 140)}`); }
  await sleep(250);
}
if (pinFails) { console.error(`\nABORT: ${pinFails} pin failures — no re-plan, no Jobber writes.`); report.aborted = `${pinFails} pin failures`; fs.writeFileSync(reportPath, JSON.stringify(report, null, 2)); process.exit(1); }

// 2. re-plan each touched day, drivers pinned
for (const day of touchedDays) {
  const dayRec = { day, replanned: false, writes: [], techWrites: [], failures: [], aborted: null };
  report.days.push(dayRec);
  console.log(`\n--- re-plan ${day} (${dowOf(day)}) ---`);
  const sp = await orCall('start_planning', { dateRange: { from: day, to: day }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' });
  if (!sp.success) { dayRec.aborted = 'start_planning failed: ' + JSON.stringify(sp).slice(0, 150); console.log('  ABORT: ' + dayRec.aborted); continue; }
  let done = false;
  for (let i = 0; i < 60; i++) {
    await sleep(10000);
    const st = await orGet(`get_planning_status?planningId=${sp.planningId}`);
    const status = (st.status || '').toString();
    if (/^F/i.test(status)) { done = true; break; }
    if (/^E/i.test(status)) { dayRec.aborted = 'planning error: ' + JSON.stringify(st).slice(0, 150); break; }
  }
  if (!done) { if (!dayRec.aborted) dayRec.aborted = 'planning timeout'; console.log('  ABORT: ' + dayRec.aborted); continue; }
  dayRec.replanned = true;

  // 3. verify every order on this day sits on its grid tech and is scheduled
  const rr = await orGet(`get_routes?date=${day}`);
  const now = {};
  for (const rt of rr.routes || []) for (const s of rt.stops || []) {
    const onum = String(s.orderNo || '');
    if (/^\d+-\w+$/.test(onum)) now[onum] = { driver: rt.driverName, hm: (s.scheduledAtDt || '').slice(11, 16), scheduledAtDt: s.scheduledAtDt };
  }
  const expected = [];
  for (const [orderNo, st] of Object.entries(stops)) {
    const p = plan.find(x => x.orderNo === orderNo);
    const tgtDay = p ? p.toDay : st.date;
    if (tgtDay !== day) continue;
    expected.push([orderNo, p ? p.toTech : st.driver]);
  }
  const missingNow = expected.filter(([o]) => !now[o]);
  const wrongTech = expected.filter(([o, t]) => now[o] && t && now[o].driver !== t);
  if (missingNow.length || wrongTech.length) {
    dayRec.aborted = `VERIFY FAILED: ${missingNow.length} unscheduled, ${wrongTech.length} on the wrong tech — NO Jobber writes`;
    console.log('  ABORT: ' + dayRec.aborted);
    console.log('    ' + JSON.stringify({ unscheduled: missingNow.map(([o]) => o).slice(0, 12), wrongTech: wrongTech.map(([o, t]) => `${o} want ${t} got ${now[o].driver}`).slice(0, 12) }));
    continue;
  }
  console.log(`  verified: ${expected.length} stops, all on their grid tech`);

  // 4. write day/time back to Jobber, and (unless disabled) put the Jobber visit on the same tech
  //    OptimoRoute is routing it to. Techs read their day out of the Jobber app: a visit still
  //    reading "Tavis Alexander" is invisible to whoever is actually driving to it.
  let ok = 0, failed = 0, techOk = 0, techFailed = 0;
  for (const [orderNo, ns] of Object.entries(now)) {
    const v = visByOrder[orderNo];
    if (!v || !ns.scheduledAtDt) continue;
    const cur2 = toPT(v.startAt);
    const planTime = ns.scheduledAtDt.slice(11, 19);
    const needSchedule = !(cur2.slice(0, 10) === day && cur2.slice(11, 16) === ns.hm);
    const curTech = v.assignedUsers?.nodes?.[0]?.name?.full || null;
    const wantTech = ns.driver || null;
    const wantId = wantTech ? users[wantTech.trim().toLowerCase()] : null;
    const needTech = SYNC_JOBBER_TECH && wantTech && wantId && curTech !== wantTech;

    if (needSchedule) {
      const endT = new Date(`${day}T${planTime}-07:00`).getTime() + 3 * 3600000;
      const endPT = new Date(endT).toLocaleString('sv-SE', { timeZone: TZ });
      const r = await jgql(`mutation { visitEditSchedule(id: "${v.id}", input: { startAt: { date: "${day}", time: "${planTime}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`, {});
      const ue = [];
      if (r.errors) ue.push(...r.errors.map(e => e.message));
      for (const k of Object.keys(r.data || {})) if (r.data[k] && r.data[k].userErrors) ue.push(...r.data[k].userErrors.map(e => e.message));
      if (ue.length) { failed++; dayRec.failures.push(`write ${orderNo}: ${ue.join('; ')}`); }
      else { ok++; dayRec.writes.push({ orderNo, from: cur2.slice(0, 16), to: `${day} ${ns.hm}`, driver: ns.driver }); }
      await sleep(200);
    }
    if (needTech) {
      const r = await jgql(`mutation { visitEditAssignedUsers(visitId: "${v.id}", input: { assignedUserIds: ["${wantId}"] }) { userErrors { message } } }`, {});
      const ue = [];
      if (r.errors) ue.push(...r.errors.map(e => e.message));
      for (const k of Object.keys(r.data || {})) if (r.data[k] && r.data[k].userErrors) ue.push(...r.data[k].userErrors.map(e => e.message));
      if (ue.length) { techFailed++; dayRec.failures.push(`tech ${orderNo}: ${ue.join('; ')}`); }
      else { techOk++; dayRec.techWrites.push({ orderNo, from: curTech, to: wantTech }); }
      await sleep(200);
    }
  }
  console.log(`  Jobber write-back: ${ok} time ok / ${failed} failed; ${techOk} tech ok / ${techFailed} failed`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
const anyAbort = report.days.some(d => d.aborted);
const anyFail = report.days.some(d => d.failures.length);
console.log(`\nREALIGN DONE: ${plan.length} orders realigned, ${report.days.reduce((n, d) => n + d.writes.length, 0)} Jobber time writes, ${report.days.reduce((n, d) => n + d.techWrites.length, 0)} Jobber tech writes${anyAbort ? ' — WITH ABORTED DAYS' : ''}${anyFail ? ' — WITH FAILURES' : ''}`);
console.log(`Report: ${reportPath}`);
process.exit(anyAbort || anyFail ? 1 : 0);
