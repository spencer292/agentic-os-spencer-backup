#!/usr/bin/env node
/**
 * extend-horizon.mjs — keep OptimoRoute planned N days ahead so new bookings have a route to land on.
 *
 * The problem this exists for (Spencer 2026-08-03/04):
 *   route-drift-check already picks up a new Jobber booking and inserts it into OptimoRoute within
 *   two hours — but ONLY on days OptimoRoute has already planned ("unplanned future days are not
 *   drift", drift-check.mjs:217). OptimoRoute was planned one week out, so on 2026-08-04 there were
 *   312 Jobber visits for Aug 10-14 and 2,071 through October with no route to join. A client booked
 *   today almost always lands past this Friday, which meant the auto-fix did nothing for most new
 *   clients. Planning further ahead makes the automation you already trust cover the window you
 *   actually book into — no change to drift-check, whose HORIZON_DAYS is already 12.
 *
 * What it does: finds weekdays inside the horizon that OptimoRoute has NOT planned, then for exactly
 * those days runs the existing, proven chain —
 *   set-driver-days --dates=  (availability; without it any ENABLED driver collects stops)
 *   push-week      --from --to --grid   (Jobber visits -> OR orders)
 *   optimize-week  plan --from --to     (start_planning + build change plan)
 *   optimize-week  write                (times + techs back to Jobber)
 *
 * THE CENTRAL GUARD: the window never includes a day that already has routes. Every step here
 * unschedules or re-plans what it touches, so reaching into the live week would tear up routes the
 * crews are driving and customers have been emailed about. If the first unplanned day is not
 * strictly after the last planned day, this aborts rather than guessing.
 *
 * Usage:
 *   node extend-horizon.mjs dry           # report the window and the exact commands, run nothing
 *   node extend-horizon.mjs live          # execute the chain
 *   node extend-horizon.mjs live --days=12 --grid=territory-grid-v5.json
 *   node extend-horizon.mjs live --no-write   # plan in OR, skip the Jobber write-back
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const TZ = 'America/Los_Angeles';

const args = process.argv.slice(2);
const mode = args[0];
if (!['dry', 'live'].includes(mode)) {
  console.log('Usage: extend-horizon.mjs dry|live [--days=12] [--grid=territory-grid-v5.json] [--no-write]');
  process.exit(1);
}
const flag = n => args.find(a => a.startsWith(`--${n}=`))?.split('=')[1];
// PAIRED WITH drift-check.mjs HORIZON_DAYS — keep the two equal. This plans routes out to DAYS;
// drift-check scans out to HORIZON_DAYS for new bookings missing from them. Planning FURTHER than
// drift-check scans creates days that have routes but never receive new bookings. 19 days is two
// full weeks beyond the current one from any weekday (Spencer 2026-08-04).
const DAYS = Number(flag('days') || 19);
const GRID = flag('grid') || 'territory-grid-v5.json';
const noWrite = args.includes('--no-write');

const env = {};
for (const l of fs.readFileSync(path.join(REPO, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const K = env.OPTIMOROUTE_API_KEY;
if (!K) { console.error('OPTIMOROUTE_API_KEY missing'); process.exit(1); }

const today = new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const addD = (d, n) => { const [y, m, dd] = d.split('-').map(Number); const x = new Date(y, m - 1, dd + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const isWeekend = d => { const w = new Date(d + 'T12:00:00').getDay(); return w === 0 || w === 6; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!fs.existsSync(path.join(__dirname, GRID))) { console.error(`Grid not found: ${GRID}`); process.exit(1); }

// ---------------------------------------------------------------- survey

console.log(`EXTEND HORIZON — ${today} PT, target ${DAYS} days out, grid ${GRID}\n`);

const planned = [], unplanned = [];
for (let i = 0; i <= DAYS; i++) {
  const d = addD(today, i);
  if (isWeekend(d)) continue;                       // Got Moles is Mon-Fri; never plan a weekend
  const r = await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`);
  const j = await r.json().catch(() => ({}));
  if (j?.success === false) { console.error(`get_routes ${d} failed: ${JSON.stringify(j).slice(0, 160)}`); process.exit(1); }
  const stops = (j.routes || []).reduce((n, x) => n + (x.stops || []).length, 0);
  (stops ? planned : unplanned).push(d);
  console.log(`  ${d}  ${String(stops).padStart(3)} stops  ${stops ? 'planned' : 'UNPLANNED'}`);
  await sleep(200);
}

if (!unplanned.length) {
  console.log(`\nHorizon already full through ${planned[planned.length - 1]} — nothing to do.`);
  process.exit(0);
}

const from = unplanned[0], to = unplanned[unplanned.length - 1];
const lastPlanned = planned.length ? planned[planned.length - 1] : null;

// THE GUARD. A planned day at or after the window start means the horizon is not a clean tail —
// re-planning would reach into days that are already live. Abort; a human decides.
const intruders = planned.filter(d => d >= from);
if (intruders.length) {
  console.error(`\nABORT: ${intruders.length} already-planned day(s) fall inside the window ${from}..${to}: ${intruders.join(', ')}`);
  console.error('The horizon is not a clean tail — extending would re-plan live days. Nothing was run.');
  process.exit(1);
}

console.log(`\nPlanned through: ${lastPlanned || '(nothing planned)'}`);
console.log(`Window to add:   ${from} .. ${to}  (${unplanned.length} weekdays: ${unplanned.join(', ')})`);

/**
 * SECOND GUARD: optimize-week has exactly ONE plan slot. `plan` writes optimize-plan.json and
 * `write` reads it, so planning a new window destroys any plan that was never written — silently,
 * and with no way to recover it short of re-planning that week from scratch. Nearly lost the
 * Aug 10-14 write-back this way on 2026-08-04: 357 pending Jobber writes were sitting unwritten
 * when the next horizon run was due. Refuse rather than clobber.
 */
const planPath = path.join(__dirname, 'optimize-plan.json');
if (fs.existsSync(planPath)) {
  let held = null;
  try { held = JSON.parse(fs.readFileSync(planPath, 'utf8')); } catch { /* unreadable — treat as empty */ }
  const w = held?.window;
  if (w && (w.fromDate !== from || w.toDate !== to)) {
    if (args.includes('--discard-plan')) {
      console.log(`\n!! discarding the held plan for ${w.fromDate}..${w.toDate} (${held.counts?.writes ?? '?'} writes) — --discard-plan given`);
    } else {
      console.error(`\nABORT: optimize-plan.json holds a plan for ${w.fromDate}..${w.toDate}` +
        ` (${held.counts?.writes ?? '?'} Jobber writes, ${held.counts?.techChanges ?? '?'} tech changes, generated ${held.generatedAt || 'unknown'}).`);
      console.error('Planning a new window would overwrite it. If it was never written, those writes are lost.');
      console.error('If it still needs applying:  node optimize-week.mjs write');
      console.error('If it was already applied:   archive it, then re-run —');
      console.error(`    mv optimize-plan.json optimize-plan.${w.fromDate}_${w.toDate}.done.json`);
      console.error('Only as a last resort:        re-run this with --discard-plan');
      process.exit(1);
    }
  }
}

const steps = [
  ['set-driver-days.mjs', [mode, `--grid=${GRID}`, `--dates=${unplanned.join(',')}`]],
  ['push-week.mjs', [mode, `--from=${from}`, `--to=${to}`, `--grid=${GRID}`]],
  ['optimize-week.mjs', ['plan', `--from=${from}`, `--to=${to}`]],
];
if (!noWrite) steps.push(['optimize-week.mjs', ['write']]);

if (mode === 'dry') {
  console.log('\nDRY — would run, in order:\n');
  for (const [s, a] of steps) console.log(`  node ${s} ${a.join(' ')}`);
  console.log('\nRe-run with `live` to execute. optimize-week keeps its own email-freeze and');
  console.log('delta guards at write time; nothing here bypasses them.');
  process.exit(0);
}

// ---------------------------------------------------------------- execute

function run(script, argv) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== node ${script} ${argv.join(' ')}\n`);
    const p = spawn(process.execPath, [path.join(__dirname, script), ...argv], { cwd: __dirname, stdio: 'inherit' });
    p.on('close', code => code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`)));
    p.on('error', reject);
  });
}

for (const [script, argv] of steps) {
  try {
    await run(script, argv);
  } catch (e) {
    // Stop the chain on the first failure. Each script is individually guarded and leaves its own
    // state; carrying on would run the optimizer over a half-pushed day.
    console.error(`\nCHAIN STOPPED at ${script}: ${e.message}`);
    console.error('Nothing further was run. Inspect that step before re-running.');
    process.exit(1);
  }
}

/**
 * Archive the plan we just applied. The guard above keys on the window in optimize-plan.json, so a
 * spent plan left on disk makes every future run abort — the job would stop dead each morning
 * having already done its work. Only archive when the chain actually ran the write; with
 * --no-write the plan is genuinely still pending and must stay put.
 */
if (!noWrite && fs.existsSync(planPath)) {
  const done = path.join(__dirname, `optimize-plan.${from}_${to}.done.json`);
  fs.renameSync(planPath, done);
  console.log(`\nApplied plan archived -> ${path.basename(done)}`);
} else if (noWrite) {
  console.log('\nNOTE: --no-write, so optimize-plan.json is still PENDING. Run');
  console.log('`node optimize-week.mjs write` to apply it — until then the next horizon run aborts.');
}

console.log(`\nHorizon extended: ${from} .. ${to} planned. route-drift-check (HORIZON_DAYS=${19}) now`);
console.log('covers these days, so new bookings land on them automatically within the hour.');
