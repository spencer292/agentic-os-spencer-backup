#!/usr/bin/env node
// ROUTE-DAY DRIVE — is drive time stable per route-day (tech x weekday) week to week?
//
// Spencer 2026-09-18: "the drive times between stops change the actual hours significantly."
// This measures exactly that, from real completion stamps, per route-day, per week:
//   span    = first completedAt -> last completedAt on that tech/day, plus the first stop's own service
//   service = sum of per-stop service minutes (tech-service-times.json: check/set, cluster share)
//   breaks  = gaps > 90 min between consecutive stamps (lunch/admin), removed from drive
//   drive   = span - service - breaks   (drive + on-road slack, as actually driven)
// Then per route-day: the weekly drive values side by side, median, and spread (max - min).
//
// READ-ONLY against Jobber. Saves the raw pull to route-engine/data/ so it can be reused.
//
// Usage: node route-day-drive.mjs --from=2026-08-17 --to=2026-09-17 [--reuse]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const ENV_PATH = path.join(ROOT, '.env');
const SVC_PATH = path.join(ROOT, 'projects/briefs/technician-route-automation/tech-service-times.json');
const DATA_DIR = path.join(ROOT, 'projects/briefs/route-engine/data');
const TZ = 'America/Los_Angeles';
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const REUSE = process.argv.includes('--reuse');
if (!FROM || !TO) { console.error('Usage: route-day-drive.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD'); process.exit(1); }
const RAW_PATH = path.join(DATA_DIR, `completed-visits_${FROM}_${TO}.json`);

// ---- Jobber (read-only) ----
const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); t = re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'; fs.writeFileSync(ENV_PATH, t); }
let tok = null;
async function token() {
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json();
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; return tok;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function g(q, v, a = 0) {
  const t = tok || await token();
  const r = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query: q, variables: v }) });
  const d = await r.json().catch(() => ({}));
  if (d.errors && JSON.stringify(d.errors).includes('THROTTLED') && a < 8) { await sleep(2500 * 2 ** a); return g(q, v, a + 1); }
  return d;
}
const pt = s => new Date(s).toLocaleString('sv-SE', { timeZone: TZ }); // "YYYY-MM-DD HH:MM:SS" Pacific

const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title isComplete completedAt startAt
      job{ jobNumber }
      property{ address{ postalCode city } }
      assignedUsers(first:3){ nodes{ name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;

let rows;
if (REUSE && fs.existsSync(RAW_PATH)) {
  rows = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'));
  console.log(`reusing ${rows.length} completed visits from ${path.relative(ROOT, RAW_PATH)}`);
} else {
  rows = []; let cur = null, pages = 0;
  for (;;) {
    const d = await g(Q, { a: cur, after: FROM + 'T00:00:00-07:00', before: TO + 'T23:59:59-07:00' });
    if (!d.data) { console.error('Jobber query failed', JSON.stringify(d).slice(0, 300)); process.exit(1); }
    for (const v of d.data.visits.nodes) {
      if (!v.isComplete || !v.completedAt) continue;
      const tech = (v.assignedUsers?.nodes || []).map(x => x.name.full)[0]; if (!tech) continue;
      rows.push({ id: v.id, job: v.job?.jobNumber ?? null, title: v.title || '', tech, completedAt: v.completedAt, startAt: v.startAt, zip: v.property?.address?.postalCode || '', city: v.property?.address?.city || '' });
    }
    pages++; if (!d.data.visits.pageInfo.hasNextPage) break; cur = d.data.visits.pageInfo.endCursor; await sleep(400);
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(RAW_PATH, JSON.stringify(rows));
  console.log(`pulled ${rows.length} completed visits with a completion stamp over ${pages} pages -> ${path.relative(ROOT, RAW_PATH)}`);
}

// ---- service-time pricing (mirrors tech-service-times.json precedence: cluster > dayOverride > tech > default) ----
const svc = JSON.parse(fs.readFileSync(SVC_PATH, 'utf8'));
const clusterShare = {};
for (const c of Object.values(svc.clusters || {})) for (const j of c.jobs) clusterShare[j] = c.totalMinutes / c.jobs.length;
function serviceMinutes(r, day) {
  if (r.job != null && clusterShare[r.job] != null) return clusterShare[r.job];
  const isSet = /\bset\b/i.test(r.title);
  const ov = (svc.dayOverrides || []).find(o => o.tech === r.tech && o.date === day);
  const t = ov || svc.techs[r.tech] || svc.default;
  return isSet ? t.set : t.check;
}

// ---- group into route-days ----
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const mondayOf = day => { const d = new Date(day + 'T12:00:00Z'); const dow = d.getUTCDay(); d.setUTCDate(d.getUTCDate() - ((dow + 6) % 7)); return d.toISOString().slice(0, 10); };
const byTechDay = {};
for (const r of rows) {
  const local = pt(r.completedAt); const day = local.slice(0, 10);
  const k = r.tech + '|' + day;
  (byTechDay[k] = byTechDay[k] || []).push({ ...r, day, at: new Date(r.completedAt).getTime() });
}
const routeDays = []; // one record per tech/day
for (const [k, list] of Object.entries(byTechDay)) {
  list.sort((a, b) => a.at - b.at);
  const tech = list[0].tech, day = list[0].day;
  const dow = DOW[new Date(day + 'T12:00:00Z').getUTCDay()];
  if (dow === 'sat' || dow === 'sun') continue;
  if (list.length < 3) continue; // a 1-2 stop day is not a route-day (ride-along, admin, one-off)
  const service = list.reduce((s, r) => s + serviceMinutes(r, day), 0);
  let breaks = 0, doubleTaps = 0;
  for (let i = 1; i < list.length; i++) { const m = (list[i].at - list[i - 1].at) / 60000; if (m > 90) breaks += m; if (m < 2) doubleTaps++; }
  const spanRaw = (list[list.length - 1].at - list[0].at) / 60000;
  const span = spanRaw + serviceMinutes(list[0], day); // first stop's own work happened before its stamp
  const drive = span - service - breaks;
  routeDays.push({ tech, day, dow, week: mondayOf(day), stops: list.length, first: pt(list[0].completedAt).slice(11, 16), last: pt(list[list.length - 1].completedAt).slice(11, 16), span, service, breaks, drive, doubleTaps, zips: new Set(list.map(r => r.zip)).size });
}

// ---- report ----
const weeks = [...new Set(routeDays.map(r => r.week))].sort();
const techs = [...new Set(routeDays.map(r => r.tech))].sort();
const h = m => (m / 60).toFixed(1);
const fmt = (s, w) => String(s).padEnd(w);
const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };

console.log(`\nwindow ${FROM} .. ${TO}   weeks: ${weeks.join('  ')}`);
console.log('per cell: stops / span h / drive h   (span = first stop to last stop incl. first stop work; drive = span - service - breaks>90min)\n');
const summary = [];
for (const tech of techs) {
  console.log('== ' + tech);
  console.log(fmt('day', 5) + weeks.map(w => fmt(w.slice(5), 18)).join('') + 'median drive  spread  stops');
  for (const dow of ['mon', 'tue', 'wed', 'thu', 'fri']) {
    const cells = weeks.map(w => routeDays.find(r => r.tech === tech && r.dow === dow && r.week === w));
    if (!cells.some(Boolean)) continue;
    const drives = cells.filter(Boolean).map(c => c.drive);
    const stops = cells.filter(Boolean).map(c => c.stops);
    const md = median(drives), spread = Math.max(...drives) - Math.min(...drives);
    const line = fmt(dow, 5) + cells.map(c => fmt(c ? `${c.stops} / ${h(c.span)} / ${h(c.drive)}` : '-', 18)).join('') + fmt(h(md) + ' h', 14) + fmt(h(spread) + ' h', 8) + `${Math.min(...stops)}-${Math.max(...stops)}`;
    console.log(line);
    summary.push({ tech, dow, weeks: drives.length, medianDriveH: +h(md), spreadH: +h(spread), medianSpanH: +h(median(cells.filter(Boolean).map(c => c.span))), medianStops: median(stops), driveMinPerStop: +(md / median(stops)).toFixed(1), stopsRange: `${Math.min(...stops)}-${Math.max(...stops)}` });
  }
  console.log('');
}

// weekly totals per tech (span hours = paid working day, first job to last job)
console.log('== weekly span hours per tech (first job to last job, breaks included)');
console.log(fmt('tech', 18) + weeks.map(w => fmt(w.slice(5), 9)).join('') + 'median/wk');
for (const tech of techs) {
  const wk = weeks.map(w => routeDays.filter(r => r.tech === tech && r.week === w).reduce((s, r) => s + r.span, 0));
  console.log(fmt(tech, 18) + wk.map(m => fmt(m ? h(m) : '-', 9)).join('') + h(median(wk.filter(Boolean))));
}
const totals = weeks.map(w => routeDays.filter(r => r.week === w).reduce((s, r) => s + r.span, 0));
console.log(fmt('ALL', 18) + totals.map(m => fmt(h(m), 9)).join('') + h(median(totals)));

// stability verdict
const stable = summary.filter(s => s.weeks >= 3 && s.spreadH <= 1.0).length;
const wobbly = summary.filter(s => s.weeks >= 3 && s.spreadH > 1.0);
console.log(`\nroute-days with >=3 weeks of data: ${summary.filter(s => s.weeks >= 3).length}   drive spread <= 1.0 h: ${stable}   > 1.0 h: ${wobbly.length}`);
for (const s of wobbly.sort((a, b) => b.spreadH - a.spreadH)) console.log(`  ${fmt(s.tech, 18)} ${s.dow}  median ${s.medianDriveH} h  spread ${s.spreadH} h  stops ${s.stopsRange}`);

const OUT = path.join(DATA_DIR, `route-day-drive_${FROM}_${TO}.json`);
fs.writeFileSync(OUT, JSON.stringify({ from: FROM, to: TO, generatedAt: new Date().toISOString(), weeks, routeDays, summary }, null, 1));
console.log(`\nsaved -> ${path.relative(ROOT, OUT)}`);
