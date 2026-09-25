#!/usr/bin/env node
// SERVICE TIME CALIBRATE — what on-site duration should each tech's stops carry?
//
// Spencer 2026-08-11: "I clearly need to adjust the time per technician for the jobs moving forward.
// The times are definitely incorrect."
//
// Today every order is pushed at a flat 10 min (check) / 20 min (set), so OptimoRoute plans every
// tech at one pace. tech-pace.mjs measured a 23% spread in real min/stop — but that number blends
// DRIVE with ON-SITE, so it cannot be dropped into `duration` directly. This script separates them:
//
//   measured cycle (Jobber completedAt gaps)  =  drive  +  on-site
//   planned drive  (OptimoRoute travelTime)   =  drive
//   => implied on-site = cycle - drive, per tech-day, then median across that tech's days.
//
// Drive comes from the tech's OWN routes, so Luke's peninsula miles and Cory's West Seattle blocks
// are each priced with their own drive, not an average. What is left is genuinely the person.
//
// The first leg of the day (home -> stop 1) is excluded from drive, to match tech-pace, which only
// measures gaps BETWEEN completion stamps and so never sees the morning commute.
//
// READ-ONLY. Writes a JSON next to this file; changes nothing in Jobber or OptimoRoute.
//
// Usage: node service-time-calibrate.mjs --from=2026-07-13 --to=2026-08-09

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
if (!FROM || !TO) { console.error('Usage: service-time-calibrate.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD'); process.exit(1); }

const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

// ---------- Jobber: completion stamps -> measured cycle time per tech-day ----------
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); t = re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'; fs.writeFileSync(ENV_PATH, t); }
let tok = null;
async function token() {
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json();
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; return tok;
}
async function g(q, v, a = 0) {
  const t = tok || await token();
  const r = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query: q, variables: v }) });
  const d = await r.json().catch(() => ({}));
  if (d.errors && JSON.stringify(d.errors).includes('THROTTLED') && a < 8) { await sleep(2500 * 2 ** a); return g(q, v, a + 1); }
  return d;
}
const pt = s => new Date(s).toLocaleString('sv-SE', { timeZone: TZ });

const Q = 'query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ isComplete completedAt assignedUsers(first:3){nodes{name{full}}} } pageInfo{hasNextPage endCursor} } }';
const stamps = {};   // "tech|day" -> [epoch ms]
let cur = null, n = 0;
for (;;) {
  const d = await g(Q, { a: cur, after: FROM + 'T00:00:00-07:00', before: TO + 'T23:59:59-07:00' });
  if (!d.data) { console.error('Jobber query failed', JSON.stringify(d).slice(0, 250)); process.exit(1); }
  for (const v of d.data.visits.nodes) {
    if (!v.isComplete || !v.completedAt) continue;
    const tech = ((v.assignedUsers && v.assignedUsers.nodes) || []).map(x => x.name.full)[0];
    if (!tech) continue;
    const key = tech + '|' + pt(v.completedAt).slice(0, 10);
    (stamps[key] = stamps[key] || []).push(new Date(v.completedAt).getTime());
    n++;
  }
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cur = d.data.visits.pageInfo.endCursor; await sleep(400);
}
console.log(`Jobber: ${n} completed visits with a stamp   (${FROM} .. ${TO})`);

// ---------- OptimoRoute: planned drive per tech-day ----------
const drive = {};    // "tech|day" -> { legs, minutes }  (first leg of the day excluded)
let routeDays = 0;
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json();
  if (!r.routes || !r.routes.length) continue;
  routeDays++;
  for (const rt of r.routes) {
    const stops = (rt.stops || []).filter(s => /^\d+-\w+$/.test(String(s.orderNo || '')));
    if (stops.length < 3) continue;
    let mins = 0, legs = 0;
    stops.forEach((s, i) => { if (i === 0) return; mins += Number(s.travelTime || 0) / 60; legs++; });
    drive[rt.driverName + '|' + d] = { legs, minutes: mins };
  }
  await sleep(150);
}
console.log(`OptimoRoute: ${routeDays} planned days, ${Object.keys(drive).length} tech-days with a route\n`);

// ---------- Join ----------
const perTech = {};
const unmatched = [];
for (const [key, list] of Object.entries(stamps)) {
  const [tech, day] = key.split('|');
  if (list.length < 4) continue;                       // too few stops to read a pace off
  list.sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < list.length; i++) {
    const m = (list[i] - list[i - 1]) / 60000;
    if (m < 2 || m > 90) continue;                     // lunch/admin out, double-taps out
    gaps.push(m);
  }
  if (gaps.length < 3) continue;
  const dr = drive[key];
  if (!dr) { unmatched.push(key); continue; }
  const cycle = med(gaps);
  const drivePerStop = dr.minutes / dr.legs;
  (perTech[tech] = perTech[tech] || []).push({ day, stops: gaps.length + 1, cycle, drivePerStop, onsite: cycle - drivePerStop });
}

console.log('tech                days  stops   cycle   drive   ON-SITE   vs flat 10');
const out = [];
const rowsSorted = Object.entries(perTech).sort((a, b) => med(a[1].map(x => x.onsite)) - med(b[1].map(x => x.onsite)));
for (const [tech, days] of rowsSorted) {
  const onsite = med(days.map(x => x.onsite));
  const cycle = med(days.map(x => x.cycle));
  const dr = med(days.map(x => x.drivePerStop));
  const stops = days.reduce((s, x) => s + x.stops, 0);
  console.log('  ' + tech.padEnd(18) + String(days.length).padStart(4) + String(stops).padStart(7) +
    cycle.toFixed(1).padStart(8) + dr.toFixed(1).padStart(8) + onsite.toFixed(1).padStart(10) +
    ('x' + (onsite / 10).toFixed(2)).padStart(12));
  out.push({ tech, days: days.length, stops, medianCycle: +cycle.toFixed(1), medianDrivePerStop: +dr.toFixed(1), impliedOnSite: +onsite.toFixed(1), factorVsFlat10: +(onsite / 10).toFixed(2) });
}
if (unmatched.length) console.log(`\n  (${unmatched.length} tech-days had completion stamps but no OptimoRoute route — skipped)`);

const allOnsite = Object.values(perTech).flat().map(x => x.onsite);
console.log(`\n  ALL TECHS implied on-site median: ${med(allOnsite).toFixed(1)} min  (flat value in use today: 10 min check / 20 min set)`);

fs.writeFileSync(path.join(__dirname, `service-time-calibrate-${FROM}_${TO}.json`),
  JSON.stringify({ from: FROM, to: TO, allOnSiteMedian: +med(allOnsite).toFixed(1), flatCheck: 10, flatSet: 20, techs: out }, null, 2));
console.log(`\nwrote service-time-calibrate-${FROM}_${TO}.json`);
