#!/usr/bin/env node
// APPLY SERVICE TIMES — retro-fit per-tech on-site duration onto orders ALREADY in OptimoRoute.
//
// The five order writers now read tech-service-times.json, but that only fixes orders written from
// now on. Every stop already sitting on a future day still carries the old flat 10/20. This walks a
// date range and rewrites `duration` on each of our orders to its tech's number.
//
// What it does NOT do: re-plan. Duration changes are inert until the day is re-planned, which is
// deliberate — re-planning re-sequences stops and re-times them, and past the 14:00 PT D-1 cutoff
// the customer already holds an arrival window. Run the re-plan yourself, per day, with eyes open.
//
// Tech comes from the order's own assignedTo.serial, falling back to the planned route's driver.
// An order with neither is SKIPPED and listed — never quietly given the default.
//
// Usage: node apply-service-times.mjs dry|live --from=YYYY-MM-DD --to=YYYY-MM-DD
//        [--techs="Alias Franks,Robert Norton"]   limit to these techs
//        [--min-date-guard=YYYY-MM-DD]            refuse to touch anything before this date
//                                                 (defaults to tomorrow — today's routes are live)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration, serviceTimeSummary } from './service-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';
const OURS = /^\d+-\w+$/;

const argv = process.argv.slice(2);
const mode = argv[0];
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
if (!['dry', 'live'].includes(mode) || !FROM || !TO) {
  console.log('Usage: apply-service-times.mjs dry|live --from=YYYY-MM-DD --to=YYYY-MM-DD [--techs="A,B"] [--min-date-guard=YYYY-MM-DD]');
  process.exit(1);
}
const ONLY = (flag('techs', '') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ptToday = () => new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const hm = m => `${Math.floor(Math.abs(m) / 60)}h${String(Math.round(Math.abs(m) % 60)).padStart(2, '0')}`;

// Today's routes are being driven right now; yesterday's are history. Neither should ever be rewritten.
const GUARD = flag('min-date-guard', addDays(ptToday(), 1));
if (FROM < GUARD) { console.error(`REFUSING: --from=${FROM} is before the guard date ${GUARD}. Pass --min-date-guard to override deliberately.`); process.exit(1); }

console.log(`APPLY SERVICE TIMES (${mode})  ${FROM} .. ${TO}`);
console.log(serviceTimeSummary());
if (ONLY.length) console.log(`limited to: ${ONLY.join(', ')}`);

async function or(endpoint, body) {
  for (let a = 0; a < 6; a++) {
    const r = await (await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${K}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json().catch(() => ({}));
    if (r.code === 'ERR_TOO_MANY_CONNECTIONS') { await sleep(1500 * (a + 1)); continue; }
    return r;
  }
  return { success: false, code: 'RETRIES_EXHAUSTED' };
}

// ---------- orderNo -> planned driver (fallback when assignedTo is blank) ----------
const plannedDriver = {};
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json();
  for (const rt of r.routes || []) for (const s of rt.stops || []) if (OURS.test(String(s.orderNo || ''))) plannedDriver[s.orderNo] = rt.driverName;
  await sleep(150);
}

// ---------- every order in the window ----------
const orders = [];
let after = null;
do {
  const body = { dateRange: { from: FROM, to: TO }, includeOrderData: true };
  if (after) body.after_tag = after;
  const r = await or('search_orders', body);
  if (r.success === false) { console.error('search_orders failed:', JSON.stringify(r).slice(0, 250)); process.exit(1); }
  orders.push(...(r.orders || []));
  after = r.after_tag || null;
} while (after);
console.log(`\n${orders.length} orders in window`);

const changes = [], noTech = [], foreign = [];
for (const o of orders) {
  const d = o.data || o;
  const no = String(d.orderNo || '');
  if (!OURS.test(no)) { foreign.push(no); continue; }
  const tech = (d.assignedTo && d.assignedTo.serial) || plannedDriver[no] || null;
  if (!tech) { noTech.push({ no, date: d.date }); continue; }
  if (ONLY.length && !ONLY.includes(tech.trim().toLowerCase())) continue;
  // SET = first visit of a job (traps going in). The writers stamp "(SET)" into notes; the old flat
  // 20 is the fallback signal for orders written before that convention.
  const isSet = /\(SET\)/i.test(d.notes || '') || Number(d.duration) === 20;
  // orderNo is <jobNumber>-<visitId>, so the cluster lookup needs nothing extra.
  const want = serviceDuration(tech, isSet, no.split('-')[0]);
  const have = Number(d.duration);
  if (want === have) continue;
  changes.push({ no, date: d.date, tech, isSet, have, want });
}

// ---------- what this does to each day ----------
const byDayTech = {};
for (const c of changes) { const k = `${c.date}|${c.tech}`; (byDayTech[k] = byDayTech[k] || { n: 0, delta: 0 }).n++; byDayTech[k].delta += c.want - c.have; }
console.log(`\nday         tech                stops   added on-site`);
for (const [k, v] of Object.entries(byDayTech).sort()) {
  const [day, tech] = k.split('|');
  console.log(`  ${day}  ${tech.padEnd(18)}${String(v.n).padStart(5)}   ${(v.delta >= 0 ? '+' : '-') + hm(v.delta)}`);
}
console.log(`\n${changes.length} orders to update` + (foreign.length ? `   (${foreign.length} foreign orders ignored)` : ''));
if (noTech.length) console.log(`  !! ${noTech.length} of our orders have no tech in OptimoRoute and were SKIPPED: ${noTech.slice(0, 8).map(x => x.no).join(', ')}${noTech.length > 8 ? '…' : ''}`);

if (mode === 'dry') { console.log('\nDRY — nothing written. Re-run with `live` to apply, then re-plan the affected days.'); process.exit(0); }

let fails = 0, ok = 0;
for (const c of changes) {
  const r = await or('create_order', { operation: 'UPDATE', orderNo: c.no, duration: c.want });
  if (r.success) ok++; else { fails++; console.log(`  FAILED ${c.no}: ${JSON.stringify(r).slice(0, 140)}`); }
  await sleep(320);
}
console.log(`\nwritten: ${ok}/${changes.length}` + (fails ? `   ${fails} FAILED` : ''));
console.log('Durations are now correct but the plans are NOT re-sequenced. Re-plan each affected day deliberately.');
