#!/usr/bin/env node
// ROUTE ENGINE — RESTORE FROM SNAPSHOT.  The rollback button for scripts/snapshot.mjs.
//
// WHY THIS EXISTS
//   snapshot.mjs gives a rollback POINT. Until now there was no rollback BUTTON: the three revert
//   scripts in technician-route-automation/ (restore-continuity, revert-backlog,
//   revert-shortweek-recut) are bespoke one-offs written in anger for specific past incidents, and
//   none of them reads a snapshot. A rollback plan first executed under pressure is not a plan.
//
// WHAT MAKES AN EXACT RESTORE POSSIBLE AT ALL
//   The whole weekly chain (push-week, apply-grid, assign-by-territory, rebalance-week,
//   optimize-week, jobber-to-optimo-sync, prune-stale-orders) makes exactly TWO kinds of Jobber
//   change — visitEditSchedule and visitEditAssignedUsers. Nothing creates or deletes a Jobber
//   visit. Both are plain overwrites of fields the snapshot holds, so restore is field-for-field
//   rather than a replay of a log. Verified by grep over the chain, 2026-09-17.
//
// PROOF, NOT PROMISE
//   After a live restore this re-runs snapshot.mjs over the same window and compares the content
//   hash. Same hash = provably the same board, not approximately the same board. A restore that
//   cannot prove itself reports a mismatch and says so.
//
// THE FOUR THINGS IT REFUSES TO GUESS AT
//   1. A snapshot visit missing from the window is NOT assumed deleted — the chain can move a visit
//      out of the week entirely. Those ids are re-queried directly and restored from wherever they
//      landed. Only an id Jobber no longer knows is a true loss, and that ABORTS unless forced.
//   2. A live visit that is not in the snapshot is left ALONE. It is either a genuinely new booking
//      or a visit dragged in from another week, and this window cannot tell them apart. Deleting is
//      never the answer; they are reported and left.
//   3. Untimed (all-day) visits restore untimed. Jobber's LocalDateTimeAttributes.time is nullable,
//      so the time is OMITTED rather than written as 00:00 — writing midnight would turn an all-day
//      visit into a timed one that looks identical over the API and wrong in the app.
//   4. OptimoRoute orders that exist but were never routed are invisible to a snapshot (it records
//      routed stops only). Run `baseline` alongside the snapshot to capture them; without that
//      sidecar this refuses to delete anything in OptimoRoute rather than delete the wrong thing.
//
// EMAIL FREEZE
//   Date D locks 14:00 PT on D-1, same rule as push-week/optimize-week. A restore of a frozen day
//   is blocked unless --ignore-freeze, because by then the customer may already hold an arrival
//   window for where the visit is NOW. Restoring the board cannot unsend that.
//
// Usage:
//   node restore-from-snapshot.mjs baseline <hash|latest>   capture OptimoRoute orders (BEFORE the run)
//   node restore-from-snapshot.mjs dry      <hash|latest>   plan the restore, write nothing
//   node restore-from-snapshot.mjs live     <hash|latest> [--max N] [--optimoroute] [--ignore-freeze] [--allow-missing]
//   node restore-from-snapshot.mjs verify   <hash|latest>   re-snapshot and compare the hash only
// Spelled the long way on purpose: check-write-gate.mjs detects coverage by matching the literal
// path `route-engine/lib/write-gate.mjs`, so a bare `../lib/...` import gates correctly but reports
// as UNGATED. Keep this form or the coverage check quietly stops meaning anything.
import '../../route-engine/lib/write-gate.mjs';  // write gate — MUST be the first import (spec v2 Part 7 Step 1)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RE = path.resolve(HERE, '..');
const ROOT = path.resolve(RE, '../../..');
const SNAP_DIR = path.join(RE, 'snapshots');
const ENV_PATH = path.join(ROOT, '.env');
const TZ = 'America/Los_Angeles';

const MODE = process.argv[2];
const WHICH = process.argv[3] || 'latest';
const args = process.argv.slice(4);
const has = (f) => args.includes(`--${f}`);
const num = (f, d) => { const i = args.indexOf(`--${f}`); return i >= 0 ? Number(args[i + 1]) : d; };

if (!['baseline', 'dry', 'live', 'verify'].includes(MODE)) {
  console.error('Usage: restore-from-snapshot.mjs baseline|dry|live|verify <hash|latest> [flags]');
  process.exit(1);
}

// ---------------------------------------------------------------- env + auth
const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const K = env.OPTIMOROUTE_API_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function saveEnvKey(key, value) {
  const txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  fs.writeFileSync(ENV_PATH, re.test(txt) ? txt.replace(re, `${key}=${value}`) : `${txt}\n${key}=${value}\n`);
}

let tok = null;
async function token(force = false) {
  if (tok && !force) return tok;
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('token refresh failed', r.status, JSON.stringify(d).slice(0, 200));
    process.exit(1);
  }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) {
    saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
    env.JOBBER_REFRESH_TOKEN = d.refresh_token;
  }
  tok = d.access_token;
  return tok;
}

async function jgql(query, variables = {}, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await token(true); return jgql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
  return data;
}

// ---------------------------------------------------------------- snapshot
function resolveSnapshot(which) {
  if (which !== 'latest' && fs.existsSync(which)) return which;
  // Exclude this script's OWN outputs. The `-orders.json` sidecar and the restore plan both carry
  // the hash in their name, so a substring match on a hash would otherwise resolve to two files and
  // abort as ambiguous the moment a baseline exists.
  const files = fs.readdirSync(SNAP_DIR).filter((f) => f.endsWith('.json') && f !== 'latest.json'
    && !f.startsWith('restore-plan-') && !f.endsWith('-orders.json'));
  if (which === 'latest') {
    const ptr = path.join(SNAP_DIR, 'latest.json');
    if (fs.existsSync(ptr)) {
      const p = JSON.parse(fs.readFileSync(ptr, 'utf8'));
      const f = files.find((x) => x.includes(p.hash)) || p.file;
      if (f) return path.isAbsolute(f) ? f : path.join(SNAP_DIR, path.basename(f));
    }
  }
  const hit = files.filter((f) => f.includes(which));
  if (hit.length === 1) return path.join(SNAP_DIR, hit[0]);
  if (hit.length > 1) {
    console.error(`"${which}" matches ${hit.length} snapshots:\n  ${hit.join('\n  ')}`);
    process.exit(1);
  }
  console.error(`No snapshot matching "${which}" in ${SNAP_DIR}`);
  process.exit(1);
}

const SNAP_PATH = resolveSnapshot(WHICH);
const SNAP = JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));
const FROM = SNAP.window.from;
const TO = SNAP.window.to;
const ORDERS_SIDECAR = SNAP_PATH.replace(/\.json$/, '-orders.json');
// snapshot.mjs STORES the full sha256 but PRINTS the first 12 chars, and the filename carries the
// short form too. Everything user-facing and every comparison uses the short form; comparing a
// printed hash against the stored one is a guaranteed false mismatch.
const SHORT = String(SNAP.hash).slice(0, 12);

function banner() {
  console.log(`\nRESTORE FROM SNAPSHOT ${SHORT}   [${MODE.toUpperCase()}]`);
  console.log(`  window       ${FROM} .. ${TO}`);
  console.log(`  taken        ${SNAP.takenAt}${SNAP.label ? `  "${SNAP.label}"` : ''}`);
  console.log(`  rules        ${SNAP.provenance?.rulesVersion}`);
  console.log(`  territories  ${SNAP.provenance?.territoriesVersion}`);
  console.log(`  file         ${SNAP_PATH}\n`);
}

// ---------------------------------------------------------------- optimoroute helpers
async function liveOrders() {
  const out = [];
  let after = null;
  do {
    const body = { dateRange: { from: FROM, to: TO }, includeOrderData: true };
    if (after) body.after_tag = after;
    const r = await (await fetch(`https://api.optimoroute.com/v1/search_orders?key=${K}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })).json();
    if (r.success === false) {
      console.error('search_orders failed:', JSON.stringify(r).slice(0, 300));
      process.exit(1);
    }
    for (const o of r.orders || []) {
      const no = String((o.data && o.data.orderNo) || o.orderNo || '');
      if (no) out.push({ orderNo: no, date: (o.data && o.data.date) || o.date || null });
    }
    after = r.after_tag || null;
  } while (after);
  return out;
}

// ---------------------------------------------------------------- BASELINE
if (MODE === 'baseline') {
  banner();
  const orders = await liveOrders();
  fs.writeFileSync(ORDERS_SIDECAR, JSON.stringify({
    hash: SHORT,
    window: { from: FROM, to: TO },
    capturedAt: new Date().toISOString(),
    count: orders.length,
    orders,
  }, null, 1));
  console.log(`  OptimoRoute baseline captured: ${orders.length} order(s) in window`);
  console.log(`  -> ${ORDERS_SIDECAR}\n`);
  console.log(orders.length
    ? '  A restore will delete any order in this window that is NOT in this list.\n'
    : '  The window is EMPTY in OptimoRoute. A restore deletes every order the run creates here.\n');
  process.exit(0);
}

// ---------------------------------------------------------------- VERIFY helpers
function takeVerifySnapshot() {
  try {
    const out = execFileSync('node', [path.join(HERE, 'snapshot.mjs'), `--from=${FROM}`, `--to=${TO}`, '--label=post-restore verify'],
      { encoding: 'utf8', maxBuffer: 64e6, stdio: ['ignore', 'pipe', 'pipe'] });
    const m = out.match(/SNAPSHOT\s+([0-9a-f]{12})/);
    return m ? m[1] : null;
  } catch (e) {
    console.error('  verify snapshot failed:', String(e.stdout || e.message).slice(0, 300));
    return null;
  }
}

// ---------------------------------------------------------------- live board
banner();

const snapVisits = SNAP.board.visits || [];
const snapById = new Map(snapVisits.map((v) => [v.id, v]));

// ---------------------------------------------------------------- diff helpers
const PTdate = (iso) => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const PTtime = (iso) => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(11, 19);
const isAllDay = (v) => (new Date(v.endAt) - new Date(v.startAt)) / 36e5 > 20;   // snapshot.mjs's own test
const eqISO = (a, b) => new Date(a).getTime() === new Date(b).getTime();
const techNames = (v) => (v.techs ? v.techs : (v.assignedUsers?.nodes || []).map((u) => u.name.full)).slice().sort();

// Resolved once, reused by the post-restore re-check.
let idByName = null;
async function loadUsers() {
  if (idByName) return idByName;
  const users = (await jgql('{ users(first: 50) { nodes { id name { full } status } } }')).data?.users?.nodes || [];
  idByName = new Map();
  for (const u of users) {
    if (!idByName.has(u.name.full) || u.status === 'ACTIVATED') idByName.set(u.name.full, u.id);
  }
  return idByName;
}

// Pull the live board and diff it against the snapshot. Called once to build the plan and AGAIN
// after a live restore — re-running the real comparison is a far better proof than hash equality,
// because an ordinary new booking changes the hash without meaning the restore misfired.
async function computeDiff() {
process.stderr.write('  live jobber ');
let cursor = null;
const live = [];
let declared = null;
const fromISO = new Date(`${FROM}T00:00:00-07:00`).toISOString();
const toISO = new Date(`${TO}T23:59:59-07:00`).toISOString();
for (;;) {
  const d = (await jgql(`{
    visits(first: 50, filter: { startAt: { after: "${fromISO}", before: "${toISO}" } }${cursor ? `, after: "${cursor}"` : ''}) {
      pageInfo { hasNextPage endCursor }
      totalCount
      nodes { id startAt endAt isComplete assignedUsers(first: 3) { nodes { id name { full } } } job { jobNumber } }
    }
  }`)).data?.visits;
  if (!d) { console.error('\n  live fetch failed — nothing was written.'); process.exit(1); }
  if (declared === null) declared = d.totalCount;
  live.push(...d.nodes);
  process.stderr.write(`${live.length}/${declared} `);
  if (!d.pageInfo.hasNextPage) break;
  cursor = d.pageInfo.endCursor;
  await sleep(2200);
}
process.stderr.write('\n');

// Same rule as snapshot.mjs: a short pull is indistinguishable from a quiet week, and here it would
// silently mark every un-fetched visit as "moved out of the window".
if (live.length < declared) {
  console.error(`\n  ABORT — incomplete live pull: ${live.length} of ${declared}. Nothing was written.\n`);
  process.exit(1);
}

// Snapshot ids absent from the window: re-query directly rather than assume deletion.
const seen = new Set(live.map((v) => v.id));
const strays = snapVisits.filter((v) => !seen.has(v.id)).map((v) => v.id);
const strayNodes = [];
if (strays.length) {
  process.stderr.write(`  chasing ${strays.length} visit(s) moved out of the window `);
  for (let i = 0; i < strays.length; i += 20) {
    const batch = strays.slice(i, i + 20);
    const q = `{ ${batch.map((id, n) => `v${n}: visit(id: "${id}") { id startAt endAt isComplete assignedUsers(first: 3) { nodes { id name { full } } } job { jobNumber } }`).join(' ')} }`;
    const d = (await jgql(q)).data || {};
    for (const k of Object.keys(d)) if (d[k]) strayNodes.push(d[k]);
    process.stderr.write('.');
    await sleep(600);
  }
  process.stderr.write('\n');
}
const liveById = new Map([...live, ...strayNodes].map((v) => [v.id, v]));

await loadUsers();

// ---------------------------------------------------------------- diff
const ops = [];
const lost = [];
const unresolved = new Set();
for (const s of snapVisits) {
  const l = liveById.get(s.id);
  if (!l) { lost.push(s); continue; }
  const o = {
    visitId: s.id,
    job: s.jobNumber,
    was: { startAt: s.startAt, endAt: s.endAt, techs: techNames(s) },
    now: { startAt: l.startAt, endAt: l.endAt, techs: techNames(l) },
  };
  o.doSchedule = !eqISO(s.startAt, l.startAt) || !eqISO(s.endAt, l.endAt);
  o.doAssign = JSON.stringify(techNames(s)) !== JSON.stringify(techNames(l));
  if (!o.doSchedule && !o.doAssign) continue;
  o.targetDate = PTdate(s.startAt);
  o.currentDate = PTdate(l.startAt);
  o.allDay = isAllDay(s);
  if (o.doAssign) {
    o.userIds = techNames(s).map((n) => {
      const id = idByName.get(n);
      if (!id) unresolved.add(n);
      return id;
    });
  }
  ops.push(o);
}
const extras = live.filter((v) => !snapById.has(v.id));

// ---------------------------------------------------------------- freeze
// Both dates matter: restoring moves the visit OFF where it is now as well as back to where it was.
const nowPT = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
const frozen = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return nowPT >= new Date(y, m - 1, d - 1, 14, 0, 0);
};
for (const o of ops) o.frozen = frozen(o.targetDate) || frozen(o.currentDate);

return { ops, lost, extras, live, strayNodes, unresolved };
}  // end computeDiff

// ---------------------------------------------------------------- VERIFY (semantic)
// The authoritative check. Hash equality is reported too, but it is NOT the pass condition: a
// visit booked into the window by the office five minutes later changes the hash while the restore
// is perfectly intact. What matters is that nothing the snapshot owns still differs.
async function verifySemantic() {
  const d = await computeDiff();
  const clean = d.ops.length === 0 && d.lost.length === 0;
  console.log(`\n  SNAPSHOT-OWNED VISITS STILL DIFFERING : ${d.ops.length}`);
  console.log(`  SNAPSHOT VISITS MISSING FROM JOBBER    : ${d.lost.length}`);
  console.log(`  NEW SINCE THE SNAPSHOT (not ours)      : ${d.extras.length}`);
  if (clean) {
    console.log(`\n  RESTORED — every one of the ${snapVisits.length} snapshot visits matches the snapshot exactly.`);
    if (d.extras.length) console.log(`  (${d.extras.length} visit(s) booked since the snapshot are left in place, by design.)`);
  } else {
    console.log('\n  NOT FULLY RESTORED — re-run `dry` for the remaining differences.');
  }
  return clean ? 0 : 1;
}

if (MODE === 'verify') {
  const code = await verifySemantic();
  const h = takeVerifySnapshot();
  console.log(`  board hash now ${h || '(unreadable)'}${h === SHORT ? ' — identical to the snapshot' : ` (snapshot was ${SHORT})`}`);
  console.log('');
  process.exit(code);
}

const { ops, lost, extras, live, strayNodes, unresolved } = await computeDiff();
const frozenOps = ops.filter((o) => o.frozen);

// ---------------------------------------------------------------- report
const scheduleOps = ops.filter((o) => o.doSchedule);
const assignOps = ops.filter((o) => o.doAssign);
console.log(`  snapshot visits      ${snapVisits.length}`);
console.log(`  live in window       ${live.length}${strayNodes.length ? `  (+${strayNodes.length} found outside the window)` : ''}`);
console.log(`  DIFFERENT            ${ops.length}   — ${scheduleOps.length} schedule, ${assignOps.length} assignee`);
console.log(`  unchanged            ${snapVisits.length - ops.length - lost.length}`);
console.log(`  new since snapshot   ${extras.length}   (left alone — not the snapshot's to own)`);
console.log(`  no longer in jobber  ${lost.length}${lost.length ? '   <-- UNRECOVERABLE FROM A SNAPSHOT' : ''}`);
console.log(`  blocked by freeze    ${frozenOps.length}`);

if (ops.length) {
  console.log('\n  RESTORE PLAN (first 25)');
  console.log('  JOB     WHAT       NOW                          ->  SNAPSHOT');
  for (const o of ops.slice(0, 25)) {
    const what = [o.doSchedule ? 'time' : null, o.doAssign ? 'tech' : null].filter(Boolean).join('+').padEnd(9);
    const nowS = `${PTdate(o.now.startAt)} ${o.allDay ? '(all-day)' : PTtime(o.now.startAt).slice(0, 5)} ${o.now.techs.join('/') || '(none)'}`;
    const wasS = `${PTdate(o.was.startAt)} ${o.allDay ? '(all-day)' : PTtime(o.was.startAt).slice(0, 5)} ${o.was.techs.join('/') || '(none)'}`;
    console.log(`  #${String(o.job).padEnd(6)} ${what} ${nowS.padEnd(28)} ->  ${wasS}${o.frozen ? '   [FROZEN]' : ''}`);
  }
  if (ops.length > 25) console.log(`  ... and ${ops.length - 25} more`);
}
if (lost.length) {
  console.log(`\n  VISITS THE SNAPSHOT HAS AND JOBBER NO LONGER DOES (${lost.length}):`);
  for (const l of lost.slice(0, 15)) console.log(`   #${l.jobNumber}  ${PTdate(l.startAt)}  ${(l.techs || []).join('/')}`);
  console.log('  A deleted visit cannot be recreated from a snapshot — it has no id to write back to.');
  console.log('  Recreate it in Jobber by hand, or re-run with --allow-missing to restore everything else.');
}
if (extras.length) {
  console.log(`\n  IN JOBBER, NOT IN THE SNAPSHOT (${extras.length}) — left untouched:`);
  for (const e of extras.slice(0, 10)) {
    console.log(`   #${e.job?.jobNumber}  ${PTdate(e.startAt)}  ${(e.assignedUsers?.nodes || []).map((u) => u.name.full).join('/') || '(unassigned)'}`);
  }
  if (extras.length > 10) console.log(`   ... and ${extras.length - 10} more`);
  console.log('  These are either new bookings or visits pulled in from another week. This window cannot');
  console.log('  tell those apart, so nothing here is deleted. Check them by eye after the restore.');
}

// ---------------------------------------------------------------- optimoroute
let orDelete = [];
let orMissing = [];
const orForeign = [];
let baselineKnown = false;
if (has('optimoroute') || MODE === 'dry') {
  const nowOrders = await liveOrders();
  const OURS = /^\d+-\d+$/;
  let baseSet;
  if (fs.existsSync(ORDERS_SIDECAR)) {
    baseSet = new Set(JSON.parse(fs.readFileSync(ORDERS_SIDECAR, 'utf8')).orders.map((o) => o.orderNo));
    baselineKnown = true;
  } else {
    baseSet = new Set();
    for (const d of Object.keys(SNAP.board.routes || {})) {
      for (const r of SNAP.board.routes[d]) for (const s of r.stops) baseSet.add(s.orderNo);
    }
  }
  for (const o of nowOrders) {
    if (!OURS.test(o.orderNo)) { orForeign.push(o.orderNo); continue; }
    if (!baseSet.has(o.orderNo)) orDelete.push(o.orderNo);
  }
  const nowSet = new Set(nowOrders.map((o) => o.orderNo));
  orMissing = [...baseSet].filter((n) => !nowSet.has(n));

  console.log('\n  OPTIMOROUTE');
  console.log(`  baseline source      ${baselineKnown ? `sidecar (${baseSet.size} orders, complete)` : `snapshot routed stops (${baseSet.size}) — UNROUTED ORDERS INVISIBLE`}`);
  console.log(`  orders in window now ${nowOrders.length}`);
  console.log(`  to delete            ${orDelete.length}`);
  console.log(`  in baseline, gone    ${orMissing.length}${orMissing.length ? '   <-- re-run push-week to recreate' : ''}`);
  if (orForeign.length) console.log(`  foreign, untouched   ${orForeign.length}`);
  if (!baselineKnown && orDelete.length) {
    console.log('\n  REFUSING to delete OptimoRoute orders without a baseline sidecar.');
    console.log('  A snapshot records ROUTED stops only, so an order that was pushed but never planned');
    console.log('  looks identical to one this run created. Capture the baseline BEFORE the automation:');
    console.log(`     node restore-from-snapshot.mjs baseline ${SHORT}`);
    orDelete = [];
  }
}

// ---------------------------------------------------------------- dry stop
const PLAN_PATH = path.join(SNAP_DIR, `restore-plan-${SHORT}.json`);
if (MODE === 'dry') {
  fs.writeFileSync(PLAN_PATH, JSON.stringify({
    hash: SHORT,
    window: { from: FROM, to: TO },
    builtAt: new Date().toISOString(),
    ops,
    lost,
    extras: extras.map((e) => ({ id: e.id, job: e.job?.jobNumber, startAt: e.startAt })),
    orDelete,
    orMissing,
  }, null, 1));
  console.log('\n  DRY — nothing was written. Plan saved to');
  console.log(`  ${PLAN_PATH}`);
  if (!ops.length && !lost.length && !orDelete.length) {
    console.log('\n  BOARD MATCHES THE SNAPSHOT. A restore would be a no-op — which is the test that this works.');
  }
  console.log('');
  process.exit(0);
}

// ---------------------------------------------------------------- live guards
if (unresolved.size) {
  console.error(`\n  ABORT — cannot resolve ${unresolved.size} technician name(s) to a Jobber user id: ${[...unresolved].join(', ')}`);
  console.error('  Restoring an assignee by guesswork is worse than not restoring it. Nothing was written.\n');
  process.exit(1);
}
if (lost.length && !has('allow-missing')) {
  console.error(`\n  ABORT — ${lost.length} snapshot visit(s) no longer exist in Jobber, so this cannot be an EXACT restore.`);
  console.error('  Re-run with --allow-missing to restore everything else and accept the gap. Nothing was written.\n');
  process.exit(1);
}
const todoAll = has('ignore-freeze') ? ops : ops.filter((o) => !o.frozen);
if (frozenOps.length && !has('ignore-freeze')) {
  console.log(`\n  ${frozenOps.length} op(s) held back by the email freeze (D-1 14:00 PT).`);
  console.log('  Those customers may already hold an arrival window for where the visit is NOW; restoring');
  console.log('  the board cannot unsend that. Use --ignore-freeze only if they were told another way.');
}
const todo = todoAll.slice(0, num('max', Infinity));
console.log(`\n  EXECUTING ${todo.length} of ${ops.length} restore op(s)${todo.length < todoAll.length ? ' (capped by --max)' : ''}\n`);

let ok = 0;
let failed = 0;
const errs = [];
for (const o of todo) {
  const calls = [];
  if (o.doSchedule) {
    const sd = PTdate(o.was.startAt);
    const ed = PTdate(o.was.endAt);
    // time is nullable in LocalDateTimeAttributes — omit it so an all-day visit restores all-day
    // rather than becoming a timed visit at midnight.
    const start = o.allDay ? `{ date: "${sd}", timezone: "${TZ}" }` : `{ date: "${sd}", time: "${PTtime(o.was.startAt)}", timezone: "${TZ}" }`;
    const end = o.allDay ? `{ date: "${ed}", timezone: "${TZ}" }` : `{ date: "${ed}", time: "${PTtime(o.was.endAt)}", timezone: "${TZ}" }`;
    calls.push(`mutation { visitEditSchedule(id: "${o.visitId}", input: { startAt: ${start}, endAt: ${end} }) { userErrors { message } } }`);
  }
  if (o.doAssign) {
    calls.push(`mutation { visitEditAssignedUsers(visitId: "${o.visitId}", input: { assignedUserIds: [${o.userIds.map((i) => `"${i}"`).join(', ')}] }) { userErrors { message } } }`);
  }
  let bad = null;
  for (const c of calls) {
    const r = await jgql(c);
    const ue = [];
    if (r.errors) ue.push(...r.errors.map((e) => e.message));
    for (const k of Object.keys(r.data || {})) if (r.data[k]?.userErrors) ue.push(...r.data[k].userErrors.map((e) => e.message));
    if (ue.length) { bad = ue.join('; '); break; }
    await sleep(150);
  }
  if (bad) { failed++; if (errs.length < 10) errs.push(`#${o.job}: ${bad}`); }
  else { ok++; if (ok % 25 === 0) process.stderr.write(`  ${ok}/${todo.length}\n`); }
}
console.log(`  jobber: ${ok} restored, ${failed} failed`);
for (const e of errs) console.log(`    ${e}`);
// visitEditAssignedUsers is known to fail transiently on recurring visits ("required to handle future
// items") and to succeed on a later identical attempt — see CLAUDE.local.md 2026-08-07. Re-run rather
// than hand-edit.
if (failed) console.log('  Re-run to retry failures — recurring-visit assignment failures are often transient.');

if (has('optimoroute') && orDelete.length) {
  console.log(`\n  optimoroute: deleting ${orDelete.length} order(s)`);
  let dok = 0;
  let dfail = 0;
  for (const no of orDelete) {
    const r = await (await fetch(`https://api.optimoroute.com/v1/delete_order?key=${K}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNo: no }),
    })).json();
    if (r.success) dok++;
    else { dfail++; if (dfail < 6) console.log(`    FAIL ${no} ${r.code || ''} ${r.message || ''}`); }
    await sleep(120);
  }
  console.log(`  optimoroute: ${dok} deleted, ${dfail} failed`);
}
if (orMissing.length) console.log(`\n  ${orMissing.length} baseline order(s) are gone from OptimoRoute — re-run push-week to recreate them.`);

// ---------------------------------------------------------------- prove it
// Re-pull the board and re-run the real comparison. This costs another full fetch and is worth it:
// it is the difference between "the writes returned 200" and "the board is actually back".
console.log('\n  re-checking the board against the snapshot...');
const exit = await verifySemantic();
if (exit && todo.length < ops.length) {
  console.log(`  ${ops.length - todo.length} op(s) were never executed this run (freeze or --max) — that is why.`);
}
const h = takeVerifySnapshot();
console.log(`  board hash now ${h || '(unreadable)'}${h === SHORT ? ' — identical to the snapshot' : ` (snapshot was ${SHORT}; new bookings move this legitimately)`}`);
console.log('');
process.exit(exit);
