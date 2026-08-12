#!/usr/bin/env node
// Build a Jobber-job-number -> lat/lng map from OptimoRoute orders.
// OptimoRoute geocoded these service addresses itself, so it is the authoritative
// coordinate source for Got Moles properties (Jobber returns no lat/lng).
// Usage: node fetch-optimo-coords.mjs [FROM] [TO]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const KEY = env.OPTIMOROUTE_API_KEY;
if (!KEY) { console.error('OPTIMOROUTE_API_KEY missing from .env'); process.exit(1); }

const FROM = process.argv[2] || '2025-01-01';
const TO = process.argv[3] || '2026-12-31';
const OUT = path.join(__dirname, 'data', 'optimo-coords.json');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

async function post(endpoint, body) {
  const r = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) throw new Error(`${endpoint}: ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j;
}

// search_orders caps the date range, so walk it in 30-day windows.
function* windows(from, to, days = 30) {
  let s = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  while (s <= end) {
    const e = new Date(Math.min(s.getTime() + (days - 1) * 86400000, end.getTime()));
    yield [s.toISOString().slice(0, 10), e.toISOString().slice(0, 10)];
    s = new Date(e.getTime() + 86400000);
  }
}

const byJob = new Map();   // jobNumber -> {lat,lng,address,name,date}
let calls = 0, orders = 0;
for (const [wFrom, wTo] of windows(FROM, TO)) {
 let after = null;
 for (;;) {
  const body = {
    dateRange: { from: wFrom, to: wTo },
    includeOrderData: true,
    includeScheduleInformation: false,
  };
  if (after) body.after_tag = after;
  const j = await post('search_orders', body);
  calls++;
  for (const o of j.orders || []) {
    orders++;
    const d = o.data || {};
    const loc = d.location || {};
    if (typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') continue;
    // orderNo looks like "8127-2243404660"; locationName like "Gary Koessler · #8127"
    const m = String(d.orderNo || '').match(/^(\d+)/);
    const jobNo = m ? Number(m[1]) : null;
    if (!jobNo) continue;
    const prev = byJob.get(jobNo);
    if (!prev || (d.date || '') > (prev.date || '')) {
      byJob.set(jobNo, {
        jobNumber: jobNo,
        lat: loc.latitude, lng: loc.longitude,
        address: loc.address || '',
        locationName: loc.locationName || '',
        date: d.date || '',
      });
    }
  }
  after = j.after_tag || null;
  if (!after) break;
 }
 process.stderr.write(`  ${wFrom}..${wTo}: ${orders} orders, ${byJob.size} jobs mapped\n`);
}

fs.writeFileSync(OUT, JSON.stringify({
  pulledAt: new Date().toISOString(),
  range: { from: FROM, to: TO },
  ordersScanned: orders,
  jobsMapped: byJob.size,
  coords: Object.fromEntries([...byJob].map(([k, v]) => [k, v])),
}, null, 1));

console.log(`orders scanned: ${orders}`);
console.log(`unique Jobber jobs with coords: ${byJob.size}`);
console.log(`wrote ${OUT}`);
