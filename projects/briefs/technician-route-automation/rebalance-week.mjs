#!/usr/bin/env node
// REBALANCE WEEK — lock the TECH, free the DAY, let OptimoRoute level the week.
//
// This is the combination nothing else does, and it is the one that fixes lumpy days:
//   push-week           : floats the day, leaves the tech free  -> produced the 160-stop Cory/Luke
//                         territory swap on the week of 08-10 ("lockTechs=false: no assignedTo").
//   jobber-to-optimo-sync: locks the tech, fixes the day        -> keeps whatever lumps Jobber holds.
//   this                : locks the tech, frees the day.
//
// Why it is needed (measured 2026-08-06, week of 08-10, AFTER territory ownership was corrected):
//   Robert  11.2h mon, 11.0h tue, 0.5h fri
//   Cory     0.5h mon, NO tuesday, 11.7h wed, 12.6h fri
//   Alias   10.1h tue, 1.5h fri
// Weekly totals were fine (28-38h). The days were inherited from the old grid, which assumed a
// different set of people, and the optimizer was forbidden from touching them.
//
// Continuity is preserved by construction: assignedTo is set on EVERY order from the Jobber tech, so
// the optimizer may choose the day and the sequence but can never hand a customer to someone else.
// SETs never move day — the customer was promised it.
//
// Usage: node rebalance-week.mjs dry|live --from=2026-08-10 --to=2026-08-14
//                                [--max-day-hours=9] [--balancing=ON] [--show=0]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration, serviceTimeSummary } from './service-time.mjs';
console.log(serviceTimeSummary());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const RUNS_DIR = path.join(__dirname, 'drift-runs');
const TZ = 'America/Los_Angeles';
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const mode = process.argv[2];
if (!['dry', 'plan', 'writeback', 'live'].includes(mode)) { console.log('Usage: rebalance-week.mjs dry|plan|writeback|live --from=YYYY-MM-DD --to=YYYY-MM-DD [--max-day-hours=9]'); process.exit(1); }
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const MAX_DAY_HOURS = Number(flag('max-day-hours', 9));
const BALANCING = flag('balancing', 'ON');
const SHOW = Number(flag('show', 0));
if (!FROM || !TO) { console.error('--from and --to are required'); process.exit(1); }
// plan = push to OptimoRoute and STOP so the map can be eyeballed. writeback = take what is in
// OptimoRoute now and write it to Jobber. live = both. Spencer 2026-08-06: "I have to be able to
// see it on the map, so if I can see it in Optimo before it goes to Jobber, that is best case."
const DO_PLAN = mode === 'plan' || mode === 'live';
const DO_WRITE = mode === 'writeback' || mode === 'live';

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
  if (data.errors && JSON.stringify(data.errors).includes('THROTTLED') && attempt < 9) {
    const w = Math.min(60000, 2500 * 2 ** attempt); console.log(`  throttled — backoff ${(w / 1000).toFixed(0)}s`); await sleep(w); return jgql(query, variables, attempt + 1);
  }
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
const dowOf = d => DOW[new Date(d + 'T12:00:00Z').getUTCDay()];
function visitNumOf(vis) {
  let num = null;
  try { num = Buffer.from(vis.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!num || !/^\d+$/.test(num)) num = vis.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return num;
}
function addrOf(a) {
  if (!a) return null;
  const p = [a.street, a.city, a.province, a.postalCode].filter(Boolean);
  return p.length ? p.join(', ') : null;
}

const days = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) days.push(d);

// Constrain each visit to its REGION'S rhythm days, not the whole week.
// Letting the day float freely across Mon-Fri looks right but is not: OptimoRoute balances between
// DRIVERS, never across DAYS, so it packs the week into as few days as possible — four days of
// 10.5 h with an empty Friday on 2026-08-06 — because dropping a day saves a whole home->territory
// trip. Nothing in the API tells it "we work five days" (the daily work-time cap is web-UI only on
// this account). The region rhythm does: every tech's regions together span all five days, so
// pinning each visit to its region's days produces a five-day week by construction.
// Two regions may SHARE a zip list and be told apart by the stop's coordinates — that is a
// geoSplit, and it exists because Spencer's boundaries are highways, which cut through zips.
// Olympia is the live case: 98501/98502/98503/98513 all straddle the I-5 / US-101 line, so a
// zip->days map alone would put a third of the Olympia work on the wrong day. Both sides of a
// geoSplit always have the SAME owner, so this only ever decides the DAY, never the technician.
const RHYTHM = {};                 // zip -> days (single-region zips; kept for the guard below)
const RHYTHM_BY_REGION = {};       // region name -> days
const ZIP_REGIONS = {};            // zip -> [region names]
let REGION_DEF = {}, GEO_LINES = {};
const NEW_RHYTHM = {};             // region name -> post-cut days, when the window is on/after the cut
const WEEK_OVERRIDE = {};          // region name -> days, this week only (--rhythm-override)
let RHYTHM_SOURCE = 'regions[].rhythm', RHYTHM_OVERRIDE_NOTE = null;
const geoFallback = [], geoUnknown = [], dayOverrideHits = [];
let DAY_OVERRIDES = {};
let geoCache = { entries: {} };
try {
  const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'territories.json'), 'utf8'));
  REGION_DEF = T.regions; GEO_LINES = T.geoSplitLines || {};
  DAY_OVERRIDES = Object.fromEntries(Object.entries(T.dayOverrides || {}).filter(([k]) => !k.startsWith('_')));
  // v9 (five-way cut) re-deals the 22 region blocks, which breaks v8's one-block-per-weekday tiling,
  // so blocks change DAY as well as owner from 2026-08-17. The new days live in `rhythmChanges`, not
  // in regions[].rhythm — deliberately, because rhythm has no date mechanism and make-service-day-sheet
  // / build-address-day-lookup read it for TODAY. So: use newRhythm only when the window being planned
  // starts on or after the effective date, and say so out loud. A window that straddles the date is
  // refused rather than planned half on each map.
  // --rhythm-override=<file> layers a WEEK-LEVEL day map on top, for the case the standing map
  // cannot cover: the standing rhythm is tuned on a census of typical volume, and a real week is
  // lumpy — one block booked at half its usual volume empties a route-day while another overflows.
  // A visit still never leaves its region's days (chooseDays), so widening the block's days here is
  // the only lever. Scoped by `effective`/`expires` so it cannot silently outlive its week.
  const roArg = process.argv.find(a => a.startsWith('--rhythm-override='));
  if (roArg) {
    const ro = JSON.parse(fs.readFileSync(path.resolve(__dirname, roArg.split('=')[1]), 'utf8'));
    if (FROM < ro.effective || (ro.expires && TO >= ro.expires)) {
      console.error(`ABORT: override covers ${ro.effective}..${ro.expires || 'open'}, window is ${FROM}..${TO}.`);
      process.exit(1);
    }
    for (const [name, c] of Object.entries(ro.byRegion || {})) if (c.days) WEEK_OVERRIDE[name] = c.days;
    RHYTHM_OVERRIDE_NOTE = `${path.basename(roArg.split('=')[1])} (${Object.keys(WEEK_OVERRIDE).length} region(s))`;
  }
  const RC = T.rhythmChanges;
  if (RC?.effective && RC.byRegion) {
    if (FROM >= RC.effective) {
      RHYTHM_SOURCE = `rhythmChanges (effective ${RC.effective})`;
      for (const [name, c] of Object.entries(RC.byRegion)) if (c.newRhythm) NEW_RHYTHM[name] = c.newRhythm;
    } else if (TO >= RC.effective) {
      console.error(`ABORT: window ${FROM}..${TO} straddles the rhythm change effective ${RC.effective}.`);
      console.error('Plan the two sides separately — one run cannot hold both day maps.');
      process.exit(1);
    }
  }
  for (const [name, r] of Object.entries(T.regions)) {
    const wd = ((WEEK_OVERRIDE[name] ?? NEW_RHYTHM[name] ?? r.rhythm) || '').toLowerCase().match(/mon|tue|wed|thu|fri/g) || [];
    RHYTHM_BY_REGION[name] = wd;
    for (const z of r.zips) {
      (ZIP_REGIONS[z] = ZIP_REGIONS[z] || []).push(name);
      RHYTHM[z] = RHYTHM[z] ? [...new Set([...RHYTHM[z], ...wd])] : wd;
    }
  }
  if (Object.keys(GEO_LINES).length) ({ loadCache: geoCache } = {}, geoCache = (await import('./geo-side.mjs')).loadCache());
} catch { /* no territory file -> fall back to the full window */ }
const streetOf = w => w.visit?.property?.address?.street || '';

// Which region does this visit belong to? Only interesting when a zip is shared by a geoSplit pair.
async function regionForVisit(w, zip) {
  const regs = ZIP_REGIONS[zip];
  if (!regs || !regs.length) return null;
  if (regs.length === 1) return regs[0];
  const split = regs.filter(n => {
    const gs = REGION_DEF[n]?.geoSplit;
    return gs && (!gs.appliesToZips || gs.appliesToZips.includes(zip));
  });
  if (split.length < 2) return regs[0];
  const lineName = REGION_DEF[split[0]].geoSplit.line;
  const line = GEO_LINES[lineName];
  if (!line) return split[0];
  const { sideOf } = await import('./geo-side.mjs');
  const { side, source } = sideOf(lineName, line, streetOf(w), zip, geoCache);
  if (source === 'none') { geoUnknown.push(`#${w.job} ${streetOf(w)} ${zip}`); return split[0]; }
  if (source === 'fallback') geoFallback.push(`#${w.job} ${streetOf(w)} ${zip} -> ${side}`);
  return split.find(n => REGION_DEF[n].geoSplit.side === side) || split[0];
}
async function allowedForVisit(w) {
  const zip = zipOf(w);
  // A dayOverride pins ONE job to a weekday, beating its region's rhythm. For a property that sits
  // inside one region's zip but belongs on another region's run — Argus Ranch is in Auburn 98092
  // (Robert's Monday) but out at Lake Holm on the Enumclaw side, so it rides Tuesday.
  const ov = DAY_OVERRIDES[String(w.job)];
  if (ov?.day) {
    const dates = days.filter(d => dowOf(d) === ov.day.toLowerCase());
    if (dates.length) { dayOverrideHits.push(`#${w.job} -> ${ov.day}`); return dates; }
  }
  const region = await regionForVisit(w, zip);
  const wd = region ? RHYTHM_BY_REGION[region] : RHYTHM[zip];
  if (!wd || !wd.length) return null;
  const dates = days.filter(d => wd.includes(dowOf(d)));
  return dates.length ? dates : null;
}
// allowedDates is a from/to RANGE, so "Mon and Fri only" cannot be expressed — a mon..fri range is
// just the whole week again. So the DAY is chosen here, greedily onto the least-loaded rhythm day
// for that tech, and each order is then pinned to it. OptimoRoute is left to do the thing it is
// genuinely good at and cannot get wrong: sequencing within a day.
async function chooseDays(want) {
  const load = {};                       // tech -> date -> minutes
  const pick = {};                       // orderNo -> date
  const entries = Object.entries(want).filter(([, w]) => !w.isSet && w.address);
  // Heaviest regions first so the constrained ones settle before the flexible ones fill the gaps.
  // Resolve each visit's allowed days up front — geoSplit regions need an async address lookup.
  const allowedBy = new Map(), weightBy = new Map();
  for (const [orderNo, w] of entries) {
    allowedBy.set(orderNo, await allowedForVisit(w));
    // Balance the day by MINUTES, not by stop count. Counting stops assumes every stop costs the
    // same, and on this board it does not: driveMinPerStop runs 4.5 in Burien to 18 on the
    // peninsula, so an even split of visits can still hand someone a 10.9h day next to an 8.2h one
    // (measured 2026-08-13, first pass of the five-way cut). Service time is per-tech measured,
    // drive is the region's measured average — the same inputs the census and the cut review use.
    const region = await regionForVisit(w, zipOf(w));
    weightBy.set(orderNo, serviceDuration(w.tech, w.isSet, w.job) + (REGION_DEF[region]?.driveMinPerStop ?? 12));
  }
  entries.sort((a, b) => (allowedBy.get(a[0])?.length || 9) - (allowedBy.get(b[0])?.length || 9));
  // Per-tech target for one day. The rhythm is a PREFERENCE, not a hard rule: Luke's rhythm put
  // Tacoma, Lakewood and Burien all on Tuesday, which stacked 59 visits on one day. When every
  // rhythm day for a region is already at target, the visit spills to that tech's emptiest day —
  // the alternative is honouring the rhythm and sending someone out for a twelve-hour Tuesday.
  const perTech = {};
  for (const [, w] of entries) { const t = w.tech || 'UNASSIGNED'; perTech[t] = (perTech[t] || 0) + 1; }
  const target = {};
  for (const t of Object.keys(perTech)) target[t] = perTech[t] / days.length;

  const overflow = [];
  for (const [orderNo, w] of entries) {
    const t = w.tech || 'UNASSIGNED';
    const cands = allowedBy.get(orderNo);
    load[t] = load[t] || {};
    if (!cands) { overflow.push({ orderNo, why: 'zip has no region rhythm' }); continue; }
    // A visit NEVER leaves its region's days. Spilling overflow onto a tech's emptiest day is what
    // put single Burien and Seattle stops on Luke's Graham and Olympia runs on 2026-08-06 and made
    // a 474-mile Friday. If a region's days are full that means the REGION needs another day — it is
    // never licence to move the stop somewhere unrelated.
    const best = cands.reduce((b, d) => ((load[t][d] || 0) < (load[t][b] || 0) ? d : b), cands[0]);
    load[t][best] = (load[t][best] || 0) + (weightBy.get(orderNo) ?? 13);
    pick[orderNo] = best;
  }
  // One greedy pass seats each visit on the lightest day it is allowed, but it cannot revisit a
  // decision: whichever block settles first owns the light day, and a block that only runs two days
  // can end up carrying a 10.9h Thursday next to a 7.8h Tuesday. So sweep afterwards — repeatedly
  // take the tech's heaviest day and move the single visit that most reduces that day, but only
  // onto a day the visit's own region already runs. The rule that a visit never leaves its region's
  // days is untouched; this only chooses better among the days it was always allowed.
  const byTech = {};
  for (const [orderNo, w] of entries) if (pick[orderNo]) (byTech[w.tech || 'UNASSIGNED'] ||= []).push(orderNo);
  let movedInSweep = 0;
  for (const [t, orders] of Object.entries(byTech)) {
    for (let iter = 0; iter < 400; iter++) {
      const ds = days.filter(d => load[t][d] != null);
      if (ds.length < 2) break;
      const heavy = ds.reduce((a, b) => (load[t][a] > load[t][b] ? a : b));
      const light = ds.reduce((a, b) => (load[t][a] < load[t][b] ? a : b));
      const gap = load[t][heavy] - load[t][light];
      if (gap <= 0) break;
      // Move only if it strictly narrows the gap — never overshoot into making the light day heavy.
      const cand = orders.find(o => pick[o] === heavy && (allowedBy.get(o) || []).includes(light)
        && (weightBy.get(o) ?? 13) * 2 <= gap);
      if (!cand) break;
      const wgt = weightBy.get(cand) ?? 13;
      load[t][heavy] -= wgt; load[t][light] += wgt; pick[cand] = light; movedInSweep++;
    }
  }
  if (movedInSweep) console.log(`  day balance sweep: ${movedInSweep} visit(s) moved to a lighter day within their own region days`);
  if (overflow.length) console.log();
  return pick;
}
const zipOf = w => ((w.visit.property?.address?.postalCode || '') + '').trim().slice(0, 5);
console.log(`REBALANCE WEEK (${mode.toUpperCase()})  ${FROM} .. ${TO}   balancing=${BALANCING}  day ceiling ${MAX_DAY_HOURS}h`);
console.log(`now ${ptNow()} PT   — tech LOCKED from Jobber, day FREE within the window`);
console.log(`day map: ${RHYTHM_SOURCE}${RHYTHM_OVERRIDE_NOTE ? `  + week override ${RHYTHM_OVERRIDE_NOTE}` : ''}\n`);

// ---------- Jobber ----------
const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt isComplete
      client{ name } job{ jobNumber startAt }
      property{ address{ street city province postalCode } }
      assignedUsers(first:4){ nodes{ name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;
let cur = null; const raw = [];
for (;;) {
  const d = await jgql(Q, { a: cur, after: `${FROM}T00:00:00-07:00`, before: `${TO}T23:59:59-07:00` });
  if (!d.data) { console.error('Jobber query failed:', JSON.stringify(d).slice(0, 300)); process.exit(1); }
  raw.push(...d.data.visits.nodes);
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cur = d.data.visits.pageInfo.endCursor;
  await sleep(430);
}
const want = {};
for (const v of raw) {
  if (v.isComplete) continue;
  const jDate = toPT(v.startAt).slice(0, 10);
  if (jDate < FROM || jDate > TO) continue;
  const jn = String(v.job?.jobNumber || '');
  want[jn + '-' + visitNumOf(v)] = {
    visit: v, job: jn, date: jDate,
    tech: v.assignedUsers?.nodes?.[0]?.name?.full || null,
    address: addrOf(v.property?.address), city: v.property?.address?.city,
    title: v.title, client: v.client?.name,
    // A SET is the FIRST VISIT OF THE JOB (Spencer 2026-08-06) — the day the customer was promised.
    // job.startAt is the series start, so "visit date == job start" is exactly that. Do NOT use the
    // visit title: "(SET)" is inherited by every follow-up in the series (#8309's Aug 12 visit is
    // titled (SET) but its job began Aug 4), so title-matching would pin a customer's whole
    // recurring series forever. A start time with a short window is also NOT a set — those are
    // placeholders (Spencer 2026-08-01).
    isSet: v.job?.startAt ? toPT(v.job.startAt).slice(0, 10) === jDate : false,
  };
}
console.log(`Jobber open visits in window: ${Object.keys(want).length}`);

// ---------- OptimoRoute driver serials ----------
const serials = {};
for (let d = addDays(FROM, -7); d <= addDays(TO, 2); d = addDays(d, 1)) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) if (rt.driverName) serials[rt.driverName.trim().toLowerCase()] = rt.driverSerial || rt.driverName;
  await sleep(260);
}
try {
  const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'territories.json'), 'utf8'));
  for (const n of T.optimoRouteDrivers?.confirmed || []) if (!serials[n.trim().toLowerCase()]) serials[n.trim().toLowerCase()] = n;
} catch {}
const needed = new Set(Object.values(want).map(w => w.tech).filter(Boolean));
const missingDrv = [...needed].filter(t => !serials[t.trim().toLowerCase()]);
if (missingDrv.length) {
  console.error(`\n🛑 ABORT: no OptimoRoute driver for: ${missingDrv.join(', ')} — NO writes made.`);
  process.exit(1);
}
console.log(`OR drivers resolved: ${[...needed].join(', ')}`);

// ---------- current day shape ----------
function shape(assign) {
  const s = {};
  for (const [o, w] of Object.entries(want)) {
    const d = assign[o] || w.date;
    const t = w.tech || 'UNASSIGNED';
    s[t] = s[t] || {};
    s[t][d] = (s[t][d] || 0) + 1;
  }
  return s;
}
function printShape(title, s) {
  console.log(`\n${title}`);
  console.log('  tech'.padEnd(22) + days.map(d => dowOf(d).padStart(7)).join('') + '    total');
  for (const t of Object.keys(s).sort()) {
    const cells = days.map(d => String(s[t][d] || 0).padStart(7)).join('');
    const tot = days.reduce((n, d) => n + (s[t][d] || 0), 0);
    console.log('  ' + t.padEnd(20) + cells + String(tot).padStart(9));
  }
}
printShape('CURRENT day shape (visits):', shape({}));
const chosen = await chooseDays(want);
printShape('PLANNED day shape (visits):', shape(chosen));

const setCount = Object.values(want).filter(w => w.isSet).length;
console.log(`\nSETs pinned to their promised day: ${setCount}`);
console.log(`Free to move: ${Object.keys(want).length - setCount}`);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.mkdirSync(RUNS_DIR, { recursive: true });
const reportPath = path.join(RUNS_DIR, `rebalance-${stamp}.json`);

if (mode === 'dry') {
  console.log(`\nDRY RUN — nothing written. A live run would:`);
  console.log(`  1. rewrite ${Object.keys(want).length} OR orders: assignedTo = Jobber tech (hard lock),`);
  console.log(`     allowedDates = ${FROM}..${TO} for the ${Object.keys(want).length - setCount} non-SET visits, own day for the ${setCount} SETs`);
  console.log(`  2. start_planning across the whole window, balancing=${BALANCING}, clustering ON`);
  console.log(`  3. verify nobody changed tech and nothing came back unscheduled`);
  console.log(`  4. write the chosen day + time back to Jobber`);
  console.log(`\nReport: ${reportPath}`);
  fs.writeFileSync(reportPath, JSON.stringify({ ranAt: new Date().toISOString(), mode, from: FROM, to: TO, before: shape({}), setCount, total: Object.keys(want).length }, null, 2));
  process.exit(0);
}

// ---------- 1. push orders: tech locked, day free ----------
if (DO_PLAN) {
console.log(`\n=== APPLYING ===\nWriting ${Object.keys(want).length} orders (tech locked, day free)…`);
let fails = 0;
for (const [orderNo, w] of Object.entries(want)) {
  if (!w.address) { console.log(`  skip ${orderNo}: no address`); continue; }
  const day = w.isSet ? w.date : (chosen[orderNo] || w.date);
  const allowed = { from: day, to: day };
  const order = {
    operation: 'SYNC', orderNo, type: 'T', date: day,
    duration: serviceDuration(w.tech, w.isSet, w.job), priority: 'M',
    location: { address: w.address, locationName: ((w.title || '') + ' · #' + w.job).slice(0, 60), acceptPartialMatch: true, acceptMultipleResults: true },
    allowedDates: allowed,
    notes: 'Jobber job ' + w.job + (w.isSet ? ' (SET)' : '') + ' [rebalance]',
  };
  const serial = w.tech ? serials[w.tech.trim().toLowerCase()] : null;
  if (serial) order.assignedTo = { serial };
  const r = await orCall('create_order', order);
  if (!r.success) { fails++; console.log(`  FAILED ${orderNo}: ${JSON.stringify(r).slice(0, 140)}`); }
  await sleep(340);
}
if (fails) { console.error(`\n🛑 ABORT: ${fails} order writes failed — no planning, no Jobber writes.`); process.exit(1); }
console.log('  all orders accepted');

// ---------- 2. plan the whole week at once ----------
console.log(`\nPlanning ${FROM}..${TO} (balancing=${BALANCING}, clustering ON)…`);
const sp = await orCall('start_planning', { dateRange: { from: FROM, to: TO }, balancing: 'OFF', clustering: true, startWith: 'CURRENT', lockType: 'NONE' });
if (!sp.success) { console.error('🛑 ABORT: start_planning failed: ' + JSON.stringify(sp).slice(0, 200)); process.exit(1); }
let done = false;
for (let i = 0; i < 90; i++) {
  await sleep(10000);
  const st = await orGet(`get_planning_status?planningId=${sp.planningId}`);
  const s = (st.status || '').toString();
  if (/^F/i.test(s)) { done = true; break; }
  if (/^E/i.test(s)) { console.error('🛑 ABORT: planning error ' + JSON.stringify(st).slice(0, 200)); process.exit(1); }
}
if (!done) { console.error('🛑 ABORT: planning timeout'); process.exit(1); }
} else { console.log('\n(writeback mode — using the plan already in OptimoRoute)'); }

// ---------- 3. verify ----------
const now = {};
for (const d of days) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) for (const s of rt.stops || []) {
    const o = String(s.orderNo || '');
    if (/^\d+-\w+$/.test(o)) now[o] = { date: d, driver: rt.driverName, hm: (s.scheduledAtDt || '').slice(11, 16), scheduledAtDt: s.scheduledAtDt };
  }
  await sleep(280);
}
const unscheduled = Object.keys(want).filter(o => want[o].address && !now[o]);
const wrongTech = Object.keys(want).filter(o => now[o] && want[o].tech && now[o].driver !== want[o].tech);
const movedSets = Object.keys(want).filter(o => want[o].isSet && now[o] && now[o].date !== want[o].date);
if (wrongTech.length || movedSets.length) {
  console.error(`\n🛑 ABORT VERIFY: ${wrongTech.length} changed tech, ${movedSets.length} SETs moved day — NO Jobber writes.`);
  console.error('   ' + JSON.stringify({ wrongTech: wrongTech.slice(0, 10), movedSets: movedSets.slice(0, 10) }));
  process.exit(1);
}
if (unscheduled.length) console.log(`\n  NOTE: ${unscheduled.length} did not fit and are unscheduled: ${unscheduled.slice(0, 15).join(', ')}`);

// GUARD: every stop on a day must belong to a region whose rhythm includes that weekday. This is
// the check that would have stopped 2026-08-06 reaching the board — a Gig Harbor + Seattle Friday,
// and single Burien stops stranded on a Graham run. A day that mixes regions it should not is a bug,
// not a route.
{
  const bad = [];
  for (const [o, n] of Object.entries(now)) {
    const w = want[o];
    if (!w || w.isSet) continue;
    if (DAY_OVERRIDES[String(w.job)]?.day) continue;   // pinned on purpose
    const zip = zipOf(w);
    const wd = RHYTHM[zip];
    if (!wd || !wd.length) continue;
    if (!wd.includes(dowOf(n.date))) bad.push(`#${w.job} ${w.city || zip} on ${dowOf(n.date)} — region runs ${wd.join('/')}`);
  }
  if (bad.length) {
    console.error(`\n🛑 ABORT: ${bad.length} stop(s) landed on a day their region does not run — NO Jobber writes.`);
    for (const b of bad.slice(0, 20)) console.error('     ' + b);
    process.exit(1);
  }
  console.log('  region/day check: every stop is on one of its own region days');
}

const after = {};
for (const [o, n] of Object.entries(now)) if (want[o]) after[o] = n.date;
printShape('NEW day shape (visits):', shape(after));
const hours = {};
for (const d of days) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    const st = (rt.stops || []).filter(s => /^\d+-\w+$/.test(String(s.orderNo || '')));
    if (!st.length) continue;
    hours[rt.driverName] = hours[rt.driverName] || {};
    hours[rt.driverName][d] = (rt.duration || 0) / 60;
  }
  await sleep(260);
}
console.log('\n  hours per tech-day:');
console.log('  tech'.padEnd(22) + days.map(d => dowOf(d).padStart(7)).join(''));
let over = 0;
for (const t of Object.keys(hours).sort()) {
  const cells = days.map(d => { const h = hours[t][d]; if (h == null) return '      -'; if (h > MAX_DAY_HOURS) over++; return h.toFixed(1).padStart(7); }).join('');
  console.log('  ' + t.padEnd(20) + cells);
}
if (over) console.log(`  ${over} tech-day(s) over the ${MAX_DAY_HOURS}h ceiling`);

console.log('\n  what each day actually contains:');
for (const d of days) {
  const perTech = {};
  for (const [o, n] of Object.entries(now)) {
    if (n.date !== d || !want[o]) continue;
    const t = n.driver || '?';
    const c = want[o].city || '?';
    perTech[t] = perTech[t] || {};
    perTech[t][c] = (perTech[t][c] || 0) + 1;
  }
  console.log('   ' + dowOf(d) + ' ' + d);
  for (const t of Object.keys(perTech).sort()) {
    const cities = Object.entries(perTech[t]).sort((a, b) => b[1] - a[1]).map(([c, n2]) => c + '(' + n2 + ')').join(' ');
    console.log('      ' + t.split(' ')[0].padEnd(9) + cities);
  }
}

if (!DO_WRITE) {
  console.log(`\n=== PLANNED IN OPTIMOROUTE — NOTHING WRITTEN TO JOBBER ===`);
  console.log('Open OptimoRoute and check the map. If it looks right:');
  console.log(`   node projects/briefs/technician-route-automation/rebalance-week.mjs writeback --from=${FROM} --to=${TO}`);
  fs.writeFileSync(reportPath, JSON.stringify({ ranAt: new Date().toISOString(), mode, from: FROM, to: TO, unscheduled, hours }, null, 2));
  process.exit(0);
}

// ---------- 4. write back ----------
console.log('\nWriting new day + time to Jobber…');
let ok = 0, failed = 0, movedDay = 0;
for (const [o, n] of Object.entries(now)) {
  const w = want[o];
  if (!w || !n.scheduledAtDt) continue;
  const cur2 = toPT(w.visit.startAt);
  if (cur2.slice(0, 10) === n.date && cur2.slice(11, 16) === n.hm) continue;
  if (cur2.slice(0, 10) !== n.date) movedDay++;
  const planTime = n.scheduledAtDt.slice(11, 19);
  const endPT = new Date(new Date(`${n.date}T${planTime}-07:00`).getTime() + 3 * 3600000).toLocaleString('sv-SE', { timeZone: TZ });
  const r = await jgql(`mutation { visitEditSchedule(id: "${w.visit.id}", input: { startAt: { date: "${n.date}", time: "${planTime}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`, {});
  const ue = (r.errors || []).map(e => e.message);
  for (const k of Object.keys(r.data || {})) if (r.data[k]?.userErrors) ue.push(...r.data[k].userErrors.map(e => e.message));
  if (ue.length) { failed++; console.log(`  WRITE FAILED ${o}: ${ue.join('; ')}`); } else ok++;
  await sleep(215);
}
fs.writeFileSync(reportPath, JSON.stringify({ ranAt: new Date().toISOString(), mode, from: FROM, to: TO, unscheduled, hours, writes: ok, failed, movedDay }, null, 2));
console.log(`\nREBALANCE DONE: ${ok} Jobber writes (${movedDay} changed day), ${failed} failed, ${unscheduled.length} unscheduled.`);
console.log(`Report: ${reportPath}`);
process.exit(failed ? 1 : 0);
