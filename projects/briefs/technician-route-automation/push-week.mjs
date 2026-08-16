#!/usr/bin/env node
// WF-1 EQUIVALENT (script engine) — push Jobber visits → OptimoRoute orders.
// Same rules as n8n "Route v2 WF-1" (YxKaiU1IAAmMkDLh); used when running supervised
// from Claude Code or when the n8n Jobber credential is unavailable.
//
// Rules encoded (agreed 2026-07-10):
// - Email freeze: date D locks 14:00 PT on D-1; today never writable.
// - Week window: Mon-Thu -> this Sunday; Fri-Sun -> next Sunday.
// - Pin rule: SETs (visit date == job.startAt date) and jobs with more than one visit in the week
//   get allowedDates = own day; everything else follows the grid. Visit start times and their
//   windows are PLACEHOLDERS, not customer promises (Spencer 2026-08-01) — do not pin on them.
// - Weekdays only (mon-fri). Durations: 10 min check / 20 min set. Priority C for sets.
// - orderNo = <jobNumber>-<visitNumericId>, operation SYNC (idempotent, collision-proof).
// - lockTechs=false: no assignedTo; optimizer assigns. locationName = "Name · #job".
//
// Usage: node push-week.mjs dry | live
// State/report: prints summary; live mode creates/updates orders via create_order (3 concurrent).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration, serviceTimeSummary } from './service-time.mjs';
console.log(serviceTimeSummary());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
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
  if (!res.ok) { console.error('Jobber token refresh failed', res.status, JSON.stringify(d)); process.exit(1); }
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
  if (data.errors) throw new Error(`Jobber GraphQL: ${JSON.stringify(data.errors).slice(0, 300)}`);
  return data.data;
}

async function orCall(endpoint, body, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) {
    await sleep(1500 * (attempt + 1));
    return orCall(endpoint, body, attempt + 1);
  }
  return d;
}

// ---------- PT helpers ----------
function toPT(iso) {
  const s = new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
  return { date: s.slice(0, 10), hm: s.slice(11, 16) };
}
function ptToday() {
  return new Date().toLocaleString('sv-SE', { timeZone: TZ });
}
function addDaysPT(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

// ---------- window (same semantics as WF-1 Window node) ----------
function computeWindow() {
  const nowStr = ptToday(); // "YYYY-MM-DD HH:MM:SS" PT
  const today = nowStr.slice(0, 10);
  const hour = Number(nowStr.slice(11, 13));
  const minOffset = hour >= 14 ? 2 : 1;
  const fromDate = addDaysPT(today, minOffset);
  // weekday of today (PT): 1=Mon..7=Sun
  const [y, m, d] = today.split('-').map(Number);
  const wd = ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1;
  // end of week (Sunday) of today, +1 week if Fri/Sat/Sun
  const daysToSunday = 7 - wd;
  let toDate = addDaysPT(today, daysToSunday + (wd >= 5 ? 7 : 0));
  if (toDate < fromDate) toDate = fromDate;
  // Jobber query bounds: [fromDate 00:00 PT - 1s, toDate+1 00:00 PT - 1s] — July = PDT (UTC-7)
  const afterIso = `${addDaysPT(fromDate, -1)}T23:59:59-07:00`;
  const beforeIso = `${toDate}T23:59:59-07:00`;
  return { fromDate, toDate, afterIso, beforeIso };
}

// ---------- main ----------
const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: push-week.mjs dry|live'); process.exit(1); }

const win = computeWindow();
// --from=YYYY-MM-DD overrides the freeze-derived start. Needed when a day past its 14:00 email
// cutoff still has to be re-planned because the customers were notified another way.
const fromArg = process.argv.find(a => a.startsWith('--from='));
if (fromArg) {
  win.fromDate = fromArg.split('=')[1];
  win.afterIso = `${addDaysPT(win.fromDate, -1)}T23:59:59-07:00`;
  console.log(`!! window start overridden to ${win.fromDate} (past its email freeze)`);
}
// --to=YYYY-MM-DD extends the window end. Needed to plan a FUTURE week: the week rule caps toDate at
// this Sunday until Friday, so a Wednesday run cannot reach next week without it.
const toArg = process.argv.find(a => a.startsWith('--to='));
if (toArg) {
  win.toDate = toArg.split('=')[1];
  win.beforeIso = `${win.toDate}T23:59:59-07:00`;
  console.log(`!! window end overridden to ${win.toDate}`);
}
console.log(`Window: ${win.fromDate} -> ${win.toDate} (${mode.toUpperCase()})`);

// fetch visits (25/page cursor loop)
const visits = [];
let cursor = null;
for (;;) {
  const q = `query($after: String) { visits(first: 25, after: $after, filter: { startAt: { after: "${win.afterIso}", before: "${win.beforeIso}" } }) { nodes { id title startAt endAt isComplete assignedUsers(first: 1) { nodes { name { full } } } property { address { street city province postalCode } } job { jobNumber startAt } } pageInfo { hasNextPage endCursor } } }`;
  const d = await jgql(q, { after: cursor });
  const v = d.visits;
  visits.push(...v.nodes);
  if (!v.pageInfo.hasNextPage) break;
  cursor = v.pageInfo.endCursor;
  if (visits.length % 100 === 0) console.log(`  fetched ${visits.length}…`);
  if (visits.length > 4000) throw new Error('runaway pagination');
  await sleep(700);
}
console.log(`Jobber visits in window: ${visits.length}`);

// ---------- grid-day enforcement (--grid) ----------
// Without --grid: flexible orders float the whole window and the optimizer picks the day
// (the grid is advisory only). With --grid: each flexible order is pinned to its zip's
// territory day, so far-south/far-north 2x-per-week holds by construction instead of by luck.
// jobOverrides (job-level) beat the zip rule. Pinned/committed visits are NEVER moved.
// --grid uses the standing territory-grid.json; --grid=<file> uses an alternate grid, so a proposed
// re-split can be built and measured without touching the live one.
const gridArg = process.argv.find(a => a.startsWith('--grid='));
const useGrid = gridArg != null || process.argv.includes('--grid');
let GRID = null;
if (useGrid) {
  const gf = gridArg ? gridArg.split('=')[1] : 'territory-grid.json';
  GRID = JSON.parse(fs.readFileSync(path.resolve(__dirname, gf), 'utf8'));
  console.log(`grid: ${gf}`);
}
const DAY_IDX = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4 };
// Monday of the plan week = first weekday on/after win.fromDate
function weekMonday(fromDate) {
  const [y, m, d] = fromDate.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
  // A weekend fromDate belongs to the week AHEAD, not the one just gone. Rolling Sunday back six
  // days put every grid day on the previous week, where it fell outside the window and was
  // discarded — so `--grid` silently degraded to "float the whole week" on exactly the run that
  // matters most: the Friday/weekend baseline. That is what left 08-03 unbuilt (found 2026-07-31).
  if (wd === 0) return addDaysPT(fromDate, 1);
  if (wd === 6) return addDaysPT(fromDate, 2);
  return addDaysPT(fromDate, -(wd - 1));
}
const MONDAY = weekMonday(win.fromDate);
// Returns {from, to, weekdays} or null to float.
// A zip may carry `days: ['tue','fri']` — a TWO-DAY ZONE. Then the order is allowed on either of
// those weekdays and the optimizer balances between them, which is how a zip too big for one day
// gets split without hand-assigning stops (e.g. 98092 Auburn across Luke's Tue and Fri).
function gridDateFor(zip, jobNo) {
  if (!GRID) return null;
  const ov = GRID.jobOverrides && GRID.jobOverrides[String(jobNo)];
  const z = GRID.zips[zip];
  let days = (ov && (ov.days || (ov.day && [ov.day]))) || (z && (z.days || (z.day && [z.day])));
  if (!days || !days.length) return null;
  days = days.filter(d => d in DAY_IDX);
  if (!days.length) return null;
  const dates = days.map(d => addDaysPT(MONDAY, DAY_IDX[d]))
                    .filter(dt => dt >= win.fromDate && dt <= win.toDate);
  if (!dates.length) return null;   // whole zone is frozen — let it float
  dates.sort();
  const kept = days.filter(d => dates.includes(addDaysPT(MONDAY, DAY_IDX[d])));
  return { from: dates[0], to: dates[dates.length - 1], weekdays: kept };
}

// build orders (same rules as WF-1 Build orders)
const orders = [], skipped = [];
const gridStats = { forced: 0, noZip: 0, frozen: 0, pinnedKept: 0, split: 0 };
const byId = {};
for (const v of visits) byId[v.id] = v;
// A job with more than one visit in the window keeps its own days. Grid-forcing them all onto the
// zip's single grid day stacks two visits to the same customer ten minutes apart — six jobs did
// exactly that on 2026-08-01 (e.g. #7303 Bryce Murphy, Jobber 08-03 + 08-04, both forced to 08-04).
// This is separate from true Jobber duplicates (two records, same job, SAME day), which are a data
// problem — see find-dup-visits.mjs.
const visitsPerJob = {};
for (const v of Object.values(byId)) {
  if (v.isComplete) continue;
  const j = v.job && v.job.jobNumber;
  if (j != null) visitsPerJob[String(j)] = (visitsPerJob[String(j)] || 0) + 1;
}
const multiVisitJobs = new Set(Object.keys(visitsPerJob).filter(j => visitsPerJob[j] > 1));
for (const vis of Object.values(byId)) {
  if (vis.isComplete) continue;
  const jn = vis.job && vis.job.jobNumber;
  const { date: visitDate, hm: startHM } = toPT(vis.startAt);
  if (visitDate < win.fromDate || visitDate > win.toDate) { skipped.push({ reason: 'out-of-window', job: jn, visitDate }); continue; }
  if (jn == null) { skipped.push({ reason: 'no-job-number', visitId: vis.id, visitDate }); continue; }
  const users = (vis.assignedUsers && vis.assignedUsers.nodes) || [];
  const tech = (users[0] && users[0].name && users[0].name.full) || null;
  const a = vis.property && vis.property.address;
  if (!a || !a.street) { skipped.push({ reason: 'no-address', job: jn, visitDate, tech }); continue; }
  let visitNum = null;
  try { visitNum = Buffer.from(vis.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!visitNum || !/^\d+$/.test(visitNum)) visitNum = vis.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  const isSet = vis.job.startAt ? toPT(vis.job.startAt).date === visitDate : false;
  let windowHrs = 99;
  if (vis.endAt) {
    windowHrs = (new Date(vis.endAt) - new Date(vis.startAt)) / 3600000;
  }
  // An explicit jobOverride naming a day is a person deciding, and it outranks the automatic pin.
  // Without this a committed visit can never be moved off its day by the grid — which is right by
  // default (the window is a promise) but wrong when the office has deliberately re-dated the job.
  // Anything moved this way needs the customer re-notified; push-week cannot do that.
  const ovDay = useGrid && GRID.jobOverrides && GRID.jobOverrides[String(jn)]
    && (GRID.jobOverrides[String(jn)].day || GRID.jobOverrides[String(jn)].days);
  const multiVisit = multiVisitJobs.has(String(jn));
  if (multiVisit) gridStats.multiVisitKept = (gridStats.multiVisitKept || 0) + 1;
  // A start time with a short window is NOT a customer commitment — those times are PLACEHOLDERS
  // (Spencer 2026-08-01). Treating them as promises pinned 28 visits off their grid day and made
  // routine grid moves look like they would break an appointment. Only a real SET pins now: a visit
  // whose date matches its job's start date, i.e. an appointment actually booked for that day.
  const pinned = (isSet || multiVisit) && !ovDay;
  // grid day for this order (null = float the window)
  const zip = ((a.postalCode || '') + '').trim().slice(0, 5);
  let gridDate = null;
  if (useGrid) {
    if (pinned) { gridStats.pinnedKept++; }
    else {
      gridDate = gridDateFor(zip, jn);
      if (gridDate) { gridStats.forced++; if (gridDate.weekdays.length > 1) gridStats.split++; }
      else if (!GRID.zips[zip]) gridStats.noZip++;
      else gridStats.frozen++;
    }
  }
  const allowed = pinned ? { from: visitDate, to: visitDate }
    : gridDate ? { from: gridDate.from, to: gridDate.to }
    : { from: win.fromDate, to: win.toDate };
  // two-day zones must also constrain the WEEKDAYS, otherwise the date range lets mid-week days in
  const allowedWeekdays = (!pinned && gridDate) ? gridDate.weekdays : ['mon','tue','wed','thu','fri'];
  orders.push({
    meta: { job: String(jn), visitDate, tech, isSet, pinned, zip, gridDate },
    order: {
      operation: 'SYNC',
      orderNo: jn + '-' + visitNum,
      type: 'T',
      // Keep the scheduled date consistent with allowedDates for flexible orders. Cosmetic only —
      // allowedDates already constrained them and the optimizer already moved them; measured
      // 2026-08-01, this changed nothing about where stops landed. SETs and multi-visit jobs keep
      // their own date.
      date: (!pinned && gridDate) ? gridDate.from : visitDate,
      // Per-tech on-site time (tech-service-times.json) — a flat 10/20 planned everyone at one pace.
      duration: serviceDuration(tech, isSet, jn),
      // Uniform priority: OptimoRoute serves higher-priority orders earlier in the day,
      // which warps the route shape. Promises are made FROM the plan, never fed in as priority.
      priority: 'M',
      location: {
        address: `${a.street}, ${a.city}, ${a.province || 'WA'} ${a.postalCode || ''}`,
        locationName: (((vis.title || 'Unknown') + '').trim().replace(/\s+/g, ' ') + ' · #' + jn).slice(0, 60),
        acceptPartialMatch: true,
        acceptMultipleResults: true,
      },
      allowedDates: allowed,
      allowedWeekdays,
      notes: 'Jobber job ' + jn + (isSet ? ' (SET)' : pinned ? ' (committed)' : ''),
    },
  });
}

// manifest of orderNos for ghost-diff / audits
fs.writeFileSync(path.join(__dirname, 'last-push-manifest.txt'), orders.map(o => o.order.orderNo).join('\n'));

// summary
const sets = orders.filter(o => o.meta.isSet), pinned = orders.filter(o => o.meta.pinned);
const perDay = {};
for (const o of orders) perDay[o.meta.visitDate] = (perDay[o.meta.visitDate] || 0) + 1;
console.log(`Orders: ${orders.length} — ${pinned.length} pinned (${sets.length} sets), ${orders.length - pinned.length} flexible`);
console.log('Per day (Jobber dates):', Object.keys(perDay).sort().map(d => `${d}:${perDay[d]}`).join('  '));
if (useGrid) {
  const perGrid = {};
  for (const o of orders) {
    const k = o.meta.gridDate ? (o.meta.gridDate.weekdays.length>1 ? o.meta.gridDate.weekdays.join('/') : o.meta.gridDate.from) : (o.meta.pinned ? `pinned:${o.meta.visitDate}` : 'float');
    perGrid[k] = (perGrid[k] || 0) + 1;
  }
  console.log(`GRID MODE — forced ${gridStats.forced} (${gridStats.split} in two-day zones), pinned kept ${gridStats.pinnedKept}, zip-not-in-grid ${gridStats.noZip}, grid-day frozen ${gridStats.frozen}`);
  console.log('Per grid day:', Object.keys(perGrid).sort().map(d => `${d}:${perGrid[d]}`).join('  '));
}
if (skipped.length) console.log(`Skipped ${skipped.length}:`, JSON.stringify(skipped.slice(0, 10)));
if (sets.length) console.log('Sets:', sets.map(s => `job ${s.meta.job} ${s.meta.visitDate}`).join(', '));

if (mode === 'dry') { console.log('\nDRY — nothing written.'); process.exit(0); }

// live: create/sync orders, 3 concurrent
let ok = 0, failed = 0;
const errs = [];
for (let i = 0; i < orders.length; i += 3) {
  const batch = orders.slice(i, i + 3);
  const results = await Promise.all(batch.map(o => orCall('create_order', o.order)));
  for (let j = 0; j < batch.length; j++) {
    const r = results[j];
    if (r.success) ok++;
    else { failed++; errs.push(`job ${batch[j].meta.job}: ${r.code || ''} ${r.message || JSON.stringify(r).slice(0, 120)}`); }
  }
  if ((i + 3) % 60 < 3) console.log(`  ${Math.min(i + 3, orders.length)}/${orders.length} (ok ${ok}, failed ${failed})`);
  await sleep(400);
}
console.log(`\nLIVE PUSH DONE: ${ok} ok, ${failed} failed of ${orders.length}`);
if (errs.length) console.log('Errors:', errs.slice(0, 15).join(' | '));
