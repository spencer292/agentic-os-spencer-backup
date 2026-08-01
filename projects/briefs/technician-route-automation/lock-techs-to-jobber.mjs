#!/usr/bin/env node
// TIMES-ONLY lock: point every OptimoRoute order at the tech Jobber currently has, and pin it to the
// day Jobber currently has. The optimizer can then only re-sequence within that tech's day — no
// cross-day moves, no reassignment. Use when the board's techs/days are already correct by hand and
// only the times need rebuilding (Spencer 2026-07-29: "everybody is on their correct technician for
// tomorrow, but the times are incorrect — just correct the times").
//
// Differs from lock-techs-to-grid.mjs, which asserts the TERRITORY GRID over Jobber. When the office
// has hand-assigned work the grid doesn't know about, the grid is the stale side.
//
// Usage: node lock-techs-to-jobber.mjs dry|live --visits=<snapshot.json>
//          [--grid=<file>]        roster from the grid's `works` map (else the four 07-26 drivers)
//          [--fallback=grid]      grid assigns the tech where Jobber has nobody who is driving
//          [--tech-only]          write the tech but not the day — leaves days to push-week --grid
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;
const TZ = 'America/Los_Angeles';
const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: lock-techs-to-jobber.mjs dry|live --visits=<file>'); process.exit(1); }
const vArg = process.argv.find(a => a.startsWith('--visits='));
if (!vArg) { console.log('--visits=<snapshot.json> required (build one with fetch-window-visits.mjs)'); process.exit(1); }
const V = JSON.parse(fs.readFileSync(path.resolve(__dirname, vArg.split('=')[1]), 'utf8'));
const manifest = new Set(fs.readFileSync(path.join(__dirname, 'last-push-manifest.txt'), 'utf8').split(/\r?\n/).filter(Boolean));

// Norton rides WITH a driver — crew, not a truck, and not an OptimoRoute driver.
// Alias Franks was removed from this rule 2026-07-31: he runs his own truck from the week of 08-03.
const RIDE_ALONG = /norton/i;
// Roster comes from the grid's `works` map when one is passed, so a roster change (tech added,
// tech out of the field) is a grid edit rather than a code edit in three files.
const gArg = process.argv.find(a => a.startsWith('--grid='));
const G = gArg ? JSON.parse(fs.readFileSync(path.resolve(__dirname, gArg.split('=')[1]), 'utf8')) : null;
const DRIVERS = G
  ? Object.keys(G.works || {})
  : ['Luke LaVergne', 'Cory Ventura', 'Cammeron Anderson', 'Spencer Hill'];
console.log(`roster: ${DRIVERS.join(', ')}`);
// --fallback=grid : Jobber stays authoritative wherever the office assigned a tech who is actually
// driving; the grid only fills the gaps — unassigned visits and visits still pointing at someone off
// the roster (a tech who left the field, or is out that week). Without it those visits go to the
// optimizer unassigned, which is how 221 of next week's 502 ended up unplaceable (Spencer 2026-07-31).
const useGridFallback = process.argv.some(a => a === '--fallback=grid');
if (useGridFallback && !G) { console.log('--fallback=grid needs --grid=<file>'); process.exit(1); }
// --tech-only : write the tech but not allowedDates, leaving the DAY to push-week --grid and its pin
// rule. One owner per field — otherwise this step silently re-pins every visit to the day it already
// had and the grid's day structure never takes effect.
const techOnly = process.argv.includes('--tech-only');
const ptDate = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);

const rows = [], skipped = [], fallbacks = {};
for (const v of V) {
  if (v.isComplete) continue;
  let num; try { num = Buffer.from(v.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!num) continue;
  const jn = String(v.job?.jobNumber), orderNo = `${jn}-${num}`;
  if (!manifest.has(orderNo)) continue;
  const names = (v.assignedUsers?.nodes || []).map(u => u.name.full);
  let driver = names.find(n => DRIVERS.includes(n)), src = 'jobber';
  if (!driver && useGridFallback) {
    const zip = (v.property?.address?.postalCode || '').trim().slice(0, 5);
    const ov = G.jobOverrides?.[jn];
    const t = ov?.tech || G.zips[zip]?.tech;
    if (t && DRIVERS.includes(t)) {
      driver = t; src = 'grid';
      const was = names.length ? names.join('+') : '(unassigned)';
      fallbacks[`${was} -> ${t}`] = (fallbacks[`${was} -> ${t}`] || 0) + 1;
    }
  }
  if (!driver) { skipped.push({ orderNo, why: names.length ? `no driver among [${names.join('+')}]` : 'no tech assigned' }); continue; }
  rows.push({ orderNo, driver, src, date: ptDate(v.startAt), rideAlong: names.some(n => RIDE_ALONG.test(n)) });
}

const cells = {};
for (const r of rows) cells[`${r.date}|${r.driver}`] = (cells[`${r.date}|${r.driver}`] || 0) + 1;
const dates = [...new Set(rows.map(r => r.date))].sort();
console.log('Jobber-current load (tech + day locked, times free):\n');
console.log('date         ' + DRIVERS.map(t => t.split(' ')[0].padStart(11)).join(''));
for (const d of dates) console.log(`${d}  ` + DRIVERS.map(t => { const c = cells[`${d}|${t}`]; return String(c == null ? '-' : c).padStart(11); }).join(''));
console.log(`\nlockable: ${rows.length}  (jobber ${rows.filter(r => r.src === 'jobber').length}, grid fallback ${rows.filter(r => r.src === 'grid').length})`);
if (Object.keys(fallbacks).length) {
  console.log('grid filled in for:');
  for (const [k, c] of Object.entries(fallbacks).sort((a, b) => b[1] - a[1])) console.log(`   ${String(c).padStart(3)}  ${k}`);
}
if (skipped.length) {
  console.log(`LEFT TO THE OPTIMIZER: ${skipped.length}`);
  for (const s of skipped.slice(0, 10)) console.log(`   ${s.orderNo} — ${s.why}`);
}
if (mode === 'dry') { console.log('\nDRY — nothing written.'); process.exit(0); }

// A tech with no OptimoRoute driver record rides on a borrowed serial (grid serialAliases) until
// their own exists. This only ever affects the OptimoRoute side — optimize-week reverses it before
// any Jobber write, so nobody gets assigned the borrowed name in Jobber.
const AL = (G && G.serialAliases) || {};
if (Object.keys(AL).length) console.log('serial aliases (shim):', JSON.stringify(AL));
const orders = rows.map(r => ({
  operation: 'UPDATE', orderNo: r.orderNo,
  assignedTo: { serial: AL[r.driver] || r.driver },
  ...(techOnly ? {} : { allowedDates: { from: r.date, to: r.date } }),
}));
let ok = 0, fail = 0;
for (let i = 0; i < orders.length; i += 100) {
  const res = await fetch(`https://api.optimoroute.com/v1/create_or_update_orders?key=${K}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orders: orders.slice(i, i + 100) }),
  });
  const j = await res.json();
  for (const o of j.orders || []) { if (o.success) ok++; else { fail++; if (fail < 6) console.log('  FAIL', o.orderNo, o.code, o.message || ''); } }
  if (!j.orders) console.log('  batch error', JSON.stringify(j).slice(0, 300));
}
console.log(`\nlocked ${ok}, failed ${fail}`);
