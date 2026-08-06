#!/usr/bin/env node
// TECH HOME INFERENCE — OptimoRoute will not expose driver start locations on this key
// (`get_drivers` → AUTH_KEY_UNKNOWN), but every route's FIRST stop carries the drive from home in
// `travelTime` / `distance`. Collect those across many days and the shortest first legs bracket
// where each tech actually lives — which is what territory design turns on, because 22% of all
// weekly miles are the commute to stop #1 (Cory 36%).
//
// READ-ONLY.
//
// Usage: node tech-home-infer.mjs --from=2026-07-20 --to=2026-08-07

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const TZ = 'America/Los_Angeles';
const M2MI = 1 / 1609.34;

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
if (!FROM || !TO) { console.error('Usage: tech-home-infer.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD'); process.exit(1); }

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const legs = {}; // driver -> [{date, mi, min, address, lat, lng}]
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    const stops = (rt.stops || []).filter(s => /^\d+-\w+$/.test(String(s.orderNo || '')));
    if (!stops.length) continue;
    const f = stops[0];
    (legs[rt.driverName] = legs[rt.driverName] || []).push({
      date: d, mi: (f.distance || 0) * M2MI, min: (f.travelTime || 0) / 60,
      address: f.address || '', lat: f.latitude, lng: f.longitude,
    });
  }
  await sleep(300);
}

console.log(`TECH HOME INFERENCE  ${FROM} .. ${TO}\n`);
for (const [drv, list] of Object.entries(legs).sort()) {
  list.sort((a, b) => a.mi - b.mi);
  const med = list[Math.floor(list.length / 2)];
  const avg = list.reduce((n, x) => n + x.mi, 0) / list.length;
  console.log(`\n=== ${drv} — ${list.length} route days ===`);
  console.log(`   first-leg miles: min ${list[0].mi.toFixed(1)}  median ${med.mi.toFixed(1)}  avg ${avg.toFixed(1)}  max ${list[list.length - 1].mi.toFixed(1)}`);
  console.log(`   CLOSEST starts (these bracket home):`);
  for (const x of list.slice(0, 5)) console.log(`      ${x.mi.toFixed(1).padStart(5)} mi / ${x.min.toFixed(0).padStart(3)} min   ${x.date}  ${x.address.slice(0, 58)}`);
  console.log(`   FURTHEST starts (the expensive mornings):`);
  for (const x of list.slice(-3)) console.log(`      ${x.mi.toFixed(1).padStart(5)} mi / ${x.min.toFixed(0).padStart(3)} min   ${x.date}  ${x.address.slice(0, 58)}`);
  const totalMi = list.reduce((n, x) => n + x.mi, 0);
  const totalMin = list.reduce((n, x) => n + x.min, 0);
  console.log(`   commute over the sample: ${totalMi.toFixed(0)} mi / ${(totalMin / 60).toFixed(1)} h`);
}
