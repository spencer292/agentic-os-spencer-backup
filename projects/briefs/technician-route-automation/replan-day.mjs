#!/usr/bin/env node
// REPLAN DAY — re-sequence ONE day in OptimoRoute against the Jobber board, and stop there.
//
// Exists because jobber-to-optimo-sync only re-plans a day that GAINS OR LOSES an order. When the
// orders are already correct and something else changed — a service time, a cluster price, a
// duration fix — there is no diff, so nothing re-plans and the new numbers sit inert. Spencer hit
// this on 2026-08-15: Barbee Mill was re-priced from 11x15 min to 11x11 min and Wednesday needed a
// fresh sequence to use the hour that freed up.
//
// SAFETY BY CONSTRUCTION: this script has no Jobber credentials and no Jobber code path. It cannot
// write to Jobber even by mistake. It reads the board from a fetch-window-visits.mjs snapshot,
// pins every stop to its Jobber day + Jobber tech, re-plans, and prints what came out. Getting the
// times into Jobber is a separate, deliberate step: write-times-from-plan.mjs.
//
// Usage: node replan-day.mjs <date> --visits=<snapshot.json> [--dry]
//   --dry  pin nothing, plan nothing — just report what is on the day right now.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TZ = 'America/Los_Angeles';
const OURS = /^\d+-\w+$/;

const DATE = process.argv[2];
const vArg = process.argv.find(a => a.startsWith('--visits='));
const DRY = process.argv.includes('--dry');
if (!DATE || !vArg) { console.log('Usage: replan-day.mjs <YYYY-MM-DD> --visits=<snapshot.json> [--dry]'); process.exit(1); }

const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const K = env.OPTIMOROUTE_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const toPT = s => new Date(s).toLocaleString('sv-SE', { timeZone: TZ });
const ptToday = () => new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const hm = s => { s = (s || '').trim(); return s.includes(' ') ? s.split(' ')[1].slice(0, 5) : s.slice(0, 5); };

// Today's routes are being driven right now. Re-sequencing them under the techs is never right.
if (DATE <= ptToday()) { console.error(`REFUSING: ${DATE} is today or in the past — those routes are live.`); process.exit(1); }

async function orCall(endpoint, body, attempt = 0) {
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${K}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orCall(endpoint, body, attempt + 1); }
  return d;
}
async function orGet(q, attempt = 0) {
  const res = await fetch(`https://api.optimoroute.com/v1/${q}${q.includes('?') ? '&' : '?'}key=${K}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
function visitNumOf(v) {
  let n = null;
  try { n = Buffer.from(v.id, 'base64').toString('utf8').split('/').pop(); } catch (e) {}
  if (!n || !/^\d+$/.test(n)) n = v.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return n;
}

// ---------- what Jobber says belongs on this day ----------
const V = JSON.parse(fs.readFileSync(path.resolve(__dirname, vArg.split('=')[1]), 'utf8'));
const want = {};
for (const v of V) {
  if (toPT(v.startAt).slice(0, 10) !== DATE) continue;
  want[`${v.job?.jobNumber}-${visitNumOf(v)}`] = {
    tech: (v.assignedUsers?.nodes || [])[0]?.name?.full || null,
    label: `#${v.job?.jobNumber} ${v.title || ''}`.trim(),
  };
}
console.log(`REPLAN DAY ${DATE}${DRY ? '  (DRY — no pinning, no planning)' : ''}`);
console.log(`  Jobber board for this day: ${Object.keys(want).length} visits`);

// Driver serials come from whoever is already routed — the same source jobber-to-optimo-sync uses.
const before = await orGet(`get_routes?date=${DATE}`);
const serials = {};
for (const rt of before.routes || []) if (rt.driverSerial) serials[rt.driverName.trim().toLowerCase()] = rt.driverSerial;
const routedBefore = {};
for (const rt of before.routes || []) for (const s of rt.stops || []) if (OURS.test(String(s.orderNo || ''))) routedBefore[s.orderNo] = rt.driverName;
console.log(`  OptimoRoute has: ${Object.keys(routedBefore).length} of our stops routed`);

const missingSerial = [...new Set(Object.values(want).map(w => w.tech).filter(Boolean))].filter(t => !serials[t.trim().toLowerCase()]);
if (missingSerial.length) console.log(`  !! no OptimoRoute driver record routed today for: ${missingSerial.join(', ')}`);

if (!DRY) {
  // Pin every routed stop to this day + the tech Jobber names, so the optimizer may only re-sequence.
  console.log(`  pinning ${Object.keys(routedBefore).length} stops to day + Jobber tech…`);
  let pinFails = 0;
  for (const orderNo of Object.keys(routedBefore)) {
    const w = want[orderNo];
    const serial = (w && w.tech && serials[w.tech.trim().toLowerCase()]) || null;
    const u = { operation: 'UPDATE', orderNo, date: DATE, allowedDates: { from: DATE, to: DATE }, priority: 'M' };
    if (serial) u.assignedTo = { serial };
    const r = await orCall('create_order', u);
    if (!r.success) { pinFails++; console.log(`    pin FAILED ${orderNo}: ${JSON.stringify(r).slice(0, 120)}`); }
    await sleep(230);
  }
  if (pinFails) { console.error(`ABORT: ${pinFails} pin failures — not planning.`); process.exit(1); }

  console.log('  re-planning (balancing OFF, drivers pinned)…');
  const sp = await orCall('start_planning', { dateRange: { from: DATE, to: DATE }, balancing: 'OFF', startWith: 'CURRENT', lockType: 'NONE' });
  if (!sp.success) { console.error('ABORT: start_planning failed — ' + JSON.stringify(sp).slice(0, 200)); process.exit(1); }
  let done = false;
  for (let i = 0; i < 60; i++) {
    await sleep(10000);
    const st = await orGet(`get_planning_status?planningId=${sp.planningId}`);
    const status = (st.status || '').toString();
    if (/^F/i.test(status)) { done = true; break; }
    if (/^E/i.test(status)) { console.error('ABORT: planning error — ' + JSON.stringify(st).slice(0, 200)); process.exit(1); }
  }
  if (!done) { console.error('ABORT: planning timed out.'); process.exit(1); }
}

// ---------- report ----------
const after = await orGet(`get_routes?date=${DATE}`);
const now = {};
console.log('');
for (const rt of (after.routes || []).filter(r => (r.stops || []).length).sort((a, b) => (b.stops || []).length - (a.stops || []).length)) {
  const st = rt.stops || [];
  for (const s of st) if (OURS.test(String(s.orderNo || ''))) now[s.orderNo] = rt.driverName;
  const drive = Math.round(st.reduce((n, s) => n + (s.travelTime || 0), 0) / 60);
  const hours = ((rt.duration || 0) / 60).toFixed(1);
  console.log(`  ${rt.driverName.padEnd(17)} ${String(st.length).padStart(3)} stops  ${hm(st[0].scheduledAt)}-${hm(st[st.length - 1].scheduledAt)}  route ${hours}h  drive ${(drive / 60).toFixed(1)}h  ${Math.round(rt.distance || 0)} mi${Number(hours) > 9 ? '   << over 9h' : ''}`);
}

const unscheduled = Object.entries(want).filter(([o]) => !now[o]);
const wrongTech = Object.entries(want).filter(([o, w]) => now[o] && w.tech && now[o] !== w.tech);
console.log('');
console.log(`  scheduled : ${Object.keys(want).length - unscheduled.length} / ${Object.keys(want).length}`);
if (unscheduled.length) console.log(`  !! UNSCHEDULED (${unscheduled.length}): ${unscheduled.map(([, w]) => w.label).join(' | ')}`);
if (wrongTech.length) console.log(`  !! WRONG TECH (${wrongTech.length}): ${wrongTech.map(([o, w]) => `${w.label} want ${w.tech} got ${now[o]}`).join(' | ')}`);
if (!unscheduled.length && !wrongTech.length) console.log('  every visit is scheduled, and every one is on the tech Jobber names.');
console.log(`\nNothing was written to Jobber. To send these times: node write-times-from-plan.mjs live --date=${DATE}`);
