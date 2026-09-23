#!/usr/bin/env node
// probe-drivers.mjs — READ-ONLY. Does Spencer Hill exist as an OptimoRoute driver, and is he
// enabled on Mon-Thu of 2026-09-21? get_drivers is not available on this API key and get_routes
// only shows drivers who already hold stops, so the only read-only probe available is history:
// scan past dates for a route under his serial. (The learnings' "assign one order and read the
// response" probe is a WRITE and is not used here.)
import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const env = {};
for (const l of fs.readFileSync(path.join(REPO, '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = { probedAt: new Date().toISOString(), endpoints: {}, history: [] };

for (const ep of ['get_drivers', 'get_drivers_parameters', 'get_vehicles']) {
  const r = await fetch(`https://api.optimoroute.com/v1/${ep}?key=${K}`);
  const j = await r.json().catch(() => ({}));
  out.endpoints[ep] = { status: r.status, body: JSON.stringify(j).slice(0, 400) };
  console.log(ep, r.status, out.endpoints[ep].body.slice(0, 200));
  await sleep(200);
}

// Every weekday back through the GPS window, plus this week and the week after, looking for
// any driverName that is not one of the five known serials.
const dates = [];
for (let i = 0; i < 60; i++) {
  const d = new Date(Date.UTC(2026, 6, 20) + i * 86400000).toISOString().slice(0, 10);
  const dow = new Date(d + 'T12:00:00Z').getUTCDay();
  if (dow >= 1 && dow <= 5) dates.push(d);
}
dates.push('2026-09-25', '2026-09-28', '2026-09-29', '2026-09-30');
const seen = new Map();
for (const d of dates) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json();
  const row = { date: d, drivers: (r.routes || []).map(x => ({ driver: x.driverName, stops: (x.stops || []).length })) };
  out.history.push(row);
  for (const x of row.drivers) seen.set(x.driver, (seen.get(x.driver) || 0) + x.stops);
  await sleep(150);
}
out.driversEverSeen = [...seen.entries()].map(([driver, stops]) => ({ driver, stops })).sort((a, b) => b.stops - a.stops);
console.log('\ndrivers ever seen in probe window:');
for (const x of out.driversEverSeen) console.log(' ', x.driver, x.stops);
fs.writeFileSync(path.join(__dirname, 'probe-drivers.json'), JSON.stringify(out, null, 1));
console.log('\nwrote probe-drivers.json');
