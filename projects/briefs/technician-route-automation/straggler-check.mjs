#!/usr/bin/env node
// STRAGGLER CHECK — read the PLANNED OptimoRoute week and find every stop that is on the wrong
// technician, plus the day-hour spread.
//
// Spencer 2026-08-07, looking at the planned week of 08-10: "we've got the same problem with a Luke
// job and a Cory job being right next to each other in Seattle, which is clearly not a Luke
// territory... job number 6986... that's going to tighten up some hours right there of drive time."
//
// A straggler is a stop whose ZIP belongs to territory X but which is planned on territory Y's
// technician. Every one of them is a long drive that should not exist, and they are what makes a
// 10-hour day sit next to a 6-hour day.
//
// READ-ONLY. Writes only its own JSON.
//
// Usage: node straggler-check.mjs --from=2026-08-10 --to=2026-08-14

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
if (!FROM || !TO) { console.error('Usage: straggler-check.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD'); process.exit(1); }

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
function dowOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'territories.json'), 'utf8'));
const ZIP_REGION = {}, REGION = T.regions;
for (const [name, r] of Object.entries(REGION)) for (const z of r.zips) ZIP_REGION[z] = name;
function ownerFor(regionName, date) {
  const r = REGION[regionName];
  if (!r) return null;
  for (const h of T.handovers || []) if (h.regions.includes(regionName) && date >= h.effective) return h.to;
  return r.owner;
}
const OVERRIDE_TECH = {};
for (const [job, o] of Object.entries(T.jobOverrides || {})) OVERRIDE_TECH[job] = o.tech;

console.log(`STRAGGLER CHECK  ${FROM}..${TO}   map v${T.version}\n`);

const stragglers = [], dayLoad = {}, unmapped = [];
let total = 0;
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    const driver = rt.driverName;
    const stops = (rt.stops || []).filter(s => /^\d+-\w+$/.test(String(s.orderNo || '')));
    if (!stops.length) continue;
    const key = `${driver}|${d}`;
    dayLoad[key] = dayLoad[key] || { driver, date: d, dow: dowOf(d), stops: 0, driveSec: 0, mi: rt.distance || 0, cities: {}, regions: {} };
    for (const s of stops) {
      total++;
      const zip = (String(s.address || '').match(/\b(98\d{3})\b/) || [])[1] || '?';
      const city = String(s.address || '').split(',')[1]?.trim() || '';
      const job = String(s.orderNo).split('-')[0];
      const region = ZIP_REGION[zip] || null;
      const expected = OVERRIDE_TECH[job] || (region ? ownerFor(region, d) : null);
      dayLoad[key].stops++;
      dayLoad[key].driveSec += Number(s.travelTime || 0);
      if (city) dayLoad[key].cities[city] = (dayLoad[key].cities[city] || 0) + 1;
      if (region) dayLoad[key].regions[region] = (dayLoad[key].regions[region] || 0) + 1;
      if (!region) { unmapped.push({ job, zip, city, driver, date: d }); continue; }
      if (expected && expected !== driver) {
        stragglers.push({
          job, orderNo: s.orderNo, zip, city, date: d, dow: dowOf(d),
          on: driver, shouldBe: expected, region,
          driveMinIn: Math.round(Number(s.travelTime || 0) / 60),
        });
      }
    }
  }
  await sleep(300);
}

console.log(`planned stops: ${total}\n`);

console.log(`=== STRAGGLERS: stop is on the wrong technician (${stragglers.length}) ===`);
if (!stragglers.length) console.log('  none');
const byPair = {};
for (const s of stragglers) {
  const k = `${s.on} -> ${s.shouldBe}`;
  (byPair[k] = byPair[k] || []).push(s);
}
for (const [k, list] of Object.entries(byPair).sort((a, b) => b[1].length - a[1].length)) {
  const drive = list.reduce((t, s) => t + s.driveMinIn, 0);
  console.log(`\n  ${k}   ${list.length} stop(s), ${drive} min of drive-in`);
  for (const s of list.sort((a, b) => a.date.localeCompare(b.date))) {
    console.log(`     #${s.job.padEnd(5)} ${s.dow} ${s.date}  ${s.zip} ${s.city.padEnd(16)} ${String(s.driveMinIn).padStart(3)}m in   [${s.region}]`);
  }
}

if (unmapped.length) {
  console.log(`\n=== ZIP IN NO TERRITORY (${unmapped.length}) ===`);
  for (const u of unmapped) console.log(`  #${u.job} ${u.date} ${u.zip} ${u.city} — on ${u.driver}`);
}

console.log(`\n=== DAY LOAD (drive-in time only; service time not included) ===`);
console.log('tech             day  date        stops   mi   drive-min   regions on that day');
const rows = Object.values(dayLoad).sort((a, b) => a.driver.localeCompare(b.driver) || a.date.localeCompare(b.date));
for (const r of rows) {
  const regs = Object.entries(r.regions).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n}(${c})`).join(' ');
  console.log(`${r.driver.padEnd(16)} ${r.dow}  ${r.date}  ${String(r.stops).padStart(4)}  ${String(Math.round(r.mi)).padStart(4)}  ${String(Math.round(r.driveSec / 60)).padStart(6)}     ${regs.slice(0, 110)}`);
}

console.log(`\n=== PER-TECH SPREAD ===`);
const byTech = {};
for (const r of rows) (byTech[r.driver] = byTech[r.driver] || []).push(r);
for (const [tech, list] of Object.entries(byTech)) {
  const st = list.map(r => r.stops);
  console.log(`  ${tech.padEnd(16)} days=${list.length}  stops ${Math.min(...st)}..${Math.max(...st)}  total=${st.reduce((a, b) => a + b, 0)}  miles=${Math.round(list.reduce((t, r) => t + r.mi, 0))}`);
}

const out = path.join(__dirname, `stragglers-${FROM}_${TO}.json`);
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), from: FROM, to: TO, mapVersion: T.version, total, stragglers, unmapped, dayLoad: rows }, null, 2));
console.log(`\nSaved: ${out}`);
