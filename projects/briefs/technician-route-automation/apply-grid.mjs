#!/usr/bin/env node
// PHASE 2 (weekly application): pin every OR order to its ZIP's (day, tech) from
// territory-grid.json. Sets + committed promises stay exactly as pinned. Overflow ZIPs
// get their day with tech left to proximity. Unzoned ZIPs untouched.
// Usage: node apply-grid.mjs dry|live   (then optimize-week.mjs plan --fresh)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.resolve(__dirname, '../../..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}
const key = process.env.OPTIMOROUTE_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const GRID = JSON.parse(fs.readFileSync(path.join(__dirname, 'territory-grid.json'), 'utf8')).zips;
const DATES = { mon: '2026-07-13', tue: '2026-07-14', wed: '2026-07-15', thu: '2026-07-16', fri: '2026-07-17' };

const stops = [];
for (const d of Object.values(DATES)) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${key}&date=${d}`)).json();
  for (const rt of r.routes || []) for (const s of rt.stops || []) stops.push({ orderNo: String(s.orderNo), driver: rt.driverName, date: d });
  await sleep(250);
}
const byNo = {};
for (let i = 0; i < stops.length; i += 400) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_orders?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders: stops.slice(i, i + 400).map(s => ({ orderNo: s.orderNo })) }),
  })).json();
  for (const o of r.orders || []) if (o.data) byNo[o.data.orderNo] = o.data;
  await sleep(400);
}
const updates = [];
let pinnedSkip = 0, unzoned = 0, already = 0;
const summary = {};
for (const s of stops) {
  const d = byNo[s.orderNo];
  if (!d) continue;
  if (/\(SET\)|\(committed\)/.test(d.notes || '')) { pinnedSkip++; continue; }
  const zm = (d.location.address || '').match(/(\d{5})(?:-\d+)?\s*$/) || (d.location.address || '').match(/\b(98\d{3})\b/);
  const g = zm && GRID[zm[1]];
  if (!g) { unzoned++; continue; }
  const targetDate = DATES[g.day];
  const targetTech = g.tech; // null for overflow
  if (targetDate === s.date && (!targetTech || targetTech === s.driver)) { already++; continue; }
  const payload = {
    operation: 'SYNC', orderNo: s.orderNo, type: d.type || 'T', date: targetDate,
    duration: d.duration, priority: 'M', // uniform — priority warps route shape (serves high-prio earlier)
    location: { address: d.location.address, locationName: d.location.locationName, latitude: d.location.latitude, longitude: d.location.longitude, acceptPartialMatch: true, acceptMultipleResults: true },
    allowedDates: { from: targetDate, to: targetDate },
    allowedWeekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    notes: d.notes || '',
  };
  if (targetTech) payload.assignedTo = { serial: targetTech };
  updates.push(payload);
  const k = `${g.day} ${(targetTech || 'overflow').split(' ')[0]}`;
  summary[k] = (summary[k] || 0) + 1;
}
console.log(`stops ${stops.length} | grid moves ${updates.length} | already correct ${already} | promises untouched ${pinnedSkip} | unzoned ${unzoned}`);
console.log('moves to:', Object.keys(summary).sort().map(k => `${k}:${summary[k]}`).join('  '));
if (process.argv[2] !== 'live') { console.log('DRY'); process.exit(0); }
let ok = 0, failed = 0;
for (let i = 0; i < updates.length; i += 3) {
  const batch = updates.slice(i, i + 3);
  const rs = await Promise.all(batch.map(async u => {
    for (let a = 0; a < 5; a++) {
      const r = await (await fetch(`https://api.optimoroute.com/v1/create_order?key=${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u),
      })).json();
      if (r.code !== 'ERR_TOO_MANY_CONNECTIONS') return r;
      await sleep(1500 * (a + 1));
    }
    return { success: false };
  }));
  for (const r of rs) r.success ? ok++ : failed++;
  await sleep(350);
}
console.log(`GRID APPLIED: ok ${ok}, failed ${failed}`);
