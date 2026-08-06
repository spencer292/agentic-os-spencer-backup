#!/usr/bin/env node
// AREA FREQUENCY — how many separate days does each tech visit the same area in one week?
//
// Born 2026-08-04 (Spencer): "I've got Cory going to Newcastle three times, and Bellevue multiple
// times. That doesn't make any sense." Revisiting one area on three days means three separate drives
// into it — the cost is in the approach, not the stops. This measures it directly off the live
// OptimoRoute plan so a grid change can be judged before it is made.
//
// READ-ONLY. Writes nothing.
//
// Usage: node area-frequency.mjs --from=2026-08-10 --to=2026-08-14 [--by=city|zip] [--min=2]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const TZ = 'America/Los_Angeles';
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const BY = flag('by', 'city');
const MIN = Number(flag('min', 2));
if (!FROM || !TO) { console.error('Usage: area-frequency.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD [--by=city|zip]'); process.exit(1); }

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : txt + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}
let accessToken = null, tokenAt = 0;
async function jobberToken(force = false) {
  if (!force && accessToken && Date.now() - tokenAt < 50 * 60 * 1000) return accessToken;
  const env = loadEnv();
  const res = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('Jobber token refresh failed', res.status); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token; tokenAt = Date.now();
  return accessToken;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jgql(query, variables, attempt = 0) {
  const token = await jobberToken();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await jobberToken(true); return jgql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
  return data;
}
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
const toPT = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function dowOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
function visitNumOf(vis) {
  let num = null;
  try { num = Buffer.from(vis.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!num || !/^\d+$/.test(num)) num = vis.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return num;
}

const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id isComplete client{ name } job{ jobNumber }
      property{ address{ city postalCode } } }
    pageInfo{ hasNextPage endCursor } } }`;
let cur = null; const visits = [];
for (;;) {
  const d = await jgql(Q, { a: cur, after: `${addDays(FROM, -1)}T23:59:59-07:00`, before: `${TO}T23:59:59-07:00` });
  if (!d.data) { console.error('Jobber query failed:', JSON.stringify(d).slice(0, 300)); process.exit(1); }
  visits.push(...d.data.visits.nodes);
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cur = d.data.visits.pageInfo.endCursor;
  await sleep(250);
}
const meta = {};
for (const v of visits.filter(x => !x.isComplete)) {
  meta[String(v.job?.jobNumber) + '-' + visitNumOf(v)] = {
    city: (v.property?.address?.city || '?').trim(),
    zip: ((v.property?.address?.postalCode || '') + '').trim().slice(0, 5),
    client: v.client?.name,
  };
}

// driver -> area -> { day -> count }
const grid = {};
const dayLoad = {};
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    const drv = rt.driverName || '?';
    dayLoad[drv] = dayLoad[drv] || {};
    dayLoad[drv][d] = { stops: 0, miles: rt.distance ?? null, dur: rt.duration ?? null };
    for (const s of rt.stops || []) {
      const onum = String(s.orderNo || '');
      if (!/^\d+-\w+$/.test(onum)) continue;
      const m = meta[onum];
      if (!m) continue;
      const area = BY === 'zip' ? m.zip : m.city;
      grid[drv] = grid[drv] || {};
      grid[drv][area] = grid[drv][area] || {};
      grid[drv][area][d] = (grid[drv][area][d] || 0) + 1;
      dayLoad[drv][d].stops++;
    }
  }
  await sleep(300);
}

const days = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) days.push(d);

console.log(`AREA FREQUENCY  ${FROM} .. ${TO}   (grouped by ${BY})\n`);
for (const drv of Object.keys(grid).sort()) {
  console.log(`\n=== ${drv} ===`);
  const hdr = '  ' + 'area'.padEnd(20) + days.map(d => dowOf(d).padStart(5)).join('') + '   days  stops';
  console.log(hdr);
  console.log('  ' + '-'.repeat(hdr.length - 2));
  const areas = Object.entries(grid[drv])
    .map(([a, byDay]) => ({ a, byDay, nDays: Object.keys(byDay).length, total: Object.values(byDay).reduce((x, y) => x + y, 0) }))
    .sort((x, y) => y.nDays - x.nDays || y.total - x.total);
  for (const { a, byDay, nDays, total } of areas) {
    const cells = days.map(d => String(byDay[d] || '·').padStart(5)).join('');
    const mark = nDays >= 3 ? '   <<< ' + nDays + ' SEPARATE DAYS' : nDays === 2 ? '   << 2 days' : '';
    if (nDays >= MIN || MIN <= 1) console.log('  ' + a.slice(0, 19).padEnd(20) + cells + '   ' + String(nDays).padStart(4) + String(total).padStart(7) + mark);
  }
  const dl = dayLoad[drv] || {};
  console.log('  ' + 'DAY TOTAL'.padEnd(20) + days.map(d => String(dl[d]?.stops ?? '·').padStart(5)).join(''));
  console.log('  ' + 'miles'.padEnd(20) + days.map(d => String(dl[d]?.miles != null ? Math.round(dl[d].miles) : '·').padStart(5)).join(''));
  console.log('  ' + 'minutes'.padEnd(20) + days.map(d => String(dl[d]?.dur ?? '·').padStart(5)).join(''));
}

console.log('\n\n=== REPEAT-VISIT SUMMARY (same tech, same area, 2+ separate days) ===');
const repeats = [];
for (const drv of Object.keys(grid)) {
  for (const [a, byDay] of Object.entries(grid[drv])) {
    const n = Object.keys(byDay).length;
    if (n >= 2) repeats.push({ drv, area: a, nDays: n, days: Object.keys(byDay).sort().map(dowOf).join('+'), total: Object.values(byDay).reduce((x, y) => x + y, 0) });
  }
}
repeats.sort((a, b) => b.nDays - a.nDays || b.total - a.total);
for (const r of repeats) console.log(`  ${String(r.nDays)}x  ${r.drv.split(' ')[0].padEnd(10)} ${r.area.slice(0, 20).padEnd(21)} ${r.days.padEnd(16)} ${r.total} stops`);
if (!repeats.length) console.log('  none');
