#!/usr/bin/env node
// MIRROR LAST WEEK (Spencer: "everything I want is on the right days from last week").
// Each job visited last week (7/06-7/10, completed) -> SAME weekday + SAME tech next week.
// Jobs not on last week's board -> rough-draft grid (day+tech by ZIP). Sets/committed untouched.
// Usage: node mirror-lastweek.mjs dry|live   (then optimize-week.mjs plan --fresh)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../..', '.env');
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}
const key = process.env.OPTIMOROUTE_API_KEY;
const TZ = 'America/Los_Angeles';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const GRID = JSON.parse(fs.readFileSync(path.join(__dirname, 'territory-grid.json'), 'utf8')).zips;
const DATES = { Monday: '2026-07-13', Tuesday: '2026-07-14', Wednesday: '2026-07-15', Thursday: '2026-07-16', Friday: '2026-07-17' };
const DAYK = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' };

function saveEnvKey(k, v) {
  let t = fs.readFileSync(ENV_PATH, 'utf8');
  fs.writeFileSync(ENV_PATH, t.replace(new RegExp('^' + k + '=.*$', 'm'), k + '=' + v));
}
let tok = null, tokAt = 0;
async function jt(force = false) {
  if (!force && tok && Date.now() - tokAt < 50 * 60e3) return tok;
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
  const r = await (await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  })).json();
  if (r.refresh_token && r.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', r.refresh_token);
  tok = r.access_token; tokAt = Date.now();
  return tok;
}
async function jgql(q, v, a = 0) {
  const t = await jt();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query: q, variables: v }),
  });
  if (res.status === 401 && a < 2) { await jt(true); return jgql(q, v, a + 1); }
  const d = await res.json().catch(() => ({}));
  if ((res.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'))) && a < 10) { await sleep(Math.min(90e3, 2000 * 2 ** a)); return jgql(q, v, a + 1); }
  if (d.errors) throw new Error(JSON.stringify(d.errors).slice(0, 200));
  return d.data;
}
// 1) last week's completed visits: job -> (weekday, tech). Latest visit wins per job.
const lastWeek = {};
let cursor = null, n = 0;
for (;;) {
  const q = `query($after: String) { visits(first: 25, after: $after, filter: { status: COMPLETED, startAt: { after: "2026-07-06T06:59:59Z", before: "2026-07-11T07:00:00Z" } }) { nodes { startAt assignedUsers(first: 1) { nodes { name { full } } } job { jobNumber } } pageInfo { hasNextPage endCursor } } }`;
  const d = await jgql(q, { after: cursor });
  for (const v of d.visits.nodes) {
    n++;
    const jn = v.job && v.job.jobNumber;
    const tech = v.assignedUsers?.nodes?.[0]?.name?.full;
    if (jn == null || !tech) continue;
    const wd = new Date(v.startAt).toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long' });
    if (DATES[wd]) lastWeek[jn] = { day: (tech === 'Spencer Hill' && wd === 'Wednesday') ? 'Friday' : wd, tech }; // Spencer's last-week Wed (mountain corridor) = his Friday this week
  }
  if (!d.visits.pageInfo.hasNextPage) break;
  cursor = d.visits.pageInfo.endCursor;
  await sleep(700);
}
console.log(`last week: ${n} completed visits, ${Object.keys(lastWeek).length} jobs mapped`);
// 2) next week's orders
const stops = [];
for (const d of Object.values(DATES)) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${key}&date=${d}`)).json();
  for (const rt of r.routes || []) for (const s of rt.stops || []) stops.push({ orderNo: String(s.orderNo), driver: rt.driverName, date: d });
  await sleep(250);
}
// include unscheduled (the 33): manifest diff
const routedSet = new Set(stops.map(s => s.orderNo));
const manifest = fs.readFileSync(path.join(__dirname, 'last-push-manifest.txt'), 'utf8').split(/\r?\n/).filter(Boolean);
for (const no of manifest) if (!routedSet.has(no)) stops.push({ orderNo: no, driver: null, date: null });
const byNo = {};
for (let i = 0; i < stops.length; i += 400) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_orders?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders: stops.slice(i, i + 400).map(s => ({ orderNo: s.orderNo })) }),
  })).json();
  for (const o of r.orders || []) if (o.data && o.success !== false) byNo[o.data.orderNo] = o.data;
  await sleep(400);
}
// 3) build updates
const updates = [];
let mirror = 0, grid = 0, pinned = 0, none = 0;
for (const s of stops) {
  const d = byNo[s.orderNo];
  if (!d) continue;
  if (/\(SET\)|\(committed\)/.test(d.notes || '')) { pinned++; continue; }
  const jn = Number(s.orderNo.split('-')[0]);
  let day = null, tech = null, src = null;
  if (lastWeek[jn]) { day = lastWeek[jn].day; tech = lastWeek[jn].tech; src = 'mirror'; mirror++; }
  else {
    const zm = (d.location.address || '').match(/(\d{5})(?:-\d+)?\s*$/) || (d.location.address || '').match(/\b(98\d{3})\b/);
    const g = zm && GRID[zm[1]];
    if (g) { day = DAYK[g.day]; tech = g.tech; src = 'grid'; grid++; }
    else { none++; continue; }
  }
  if (tech === 'Tavis Alexander' || tech === 'Brayden Rich') tech = tech === 'Tavis Alexander' ? 'Cory Ventura' : 'Luke LaVergne';
  const targetDate = DATES[day];
  const payload = {
    operation: 'SYNC', orderNo: s.orderNo, type: d.type || 'T', date: targetDate,
    duration: d.duration, priority: 'M', // uniform — priority warps route shape (serves high-prio earlier)
    location: { address: d.location.address, locationName: d.location.locationName, latitude: d.location.latitude, longitude: d.location.longitude, acceptPartialMatch: true, acceptMultipleResults: true },
    allowedDates: { from: targetDate, to: targetDate },
    allowedWeekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    notes: d.notes || '',
  };
  if (tech) payload.assignedTo = { serial: tech };
  updates.push(payload);
}
console.log(`orders: ${stops.length} | mirrored from last week: ${mirror} | grid fallback: ${grid} | promises untouched: ${pinned} | no source: ${none}`);
if (process.argv[2] !== 'live') { console.log('DRY'); process.exit(0); }
let ok = 0, failed = 0;
for (let i = 0; i < updates.length; i += 3) {
  const b = updates.slice(i, i + 3);
  const rs = await Promise.all(b.map(async u => {
    for (let a = 0; a < 5; a++) {
      const r = await (await fetch(`https://api.optimoroute.com/v1/create_order?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u) })).json();
      if (r.code !== 'ERR_TOO_MANY_CONNECTIONS') return r;
      await sleep(1500 * (a + 1));
    }
    return { success: false };
  }));
  for (const r of rs) r.success ? ok++ : failed++;
  await sleep(350);
}
console.log(`LAST-WEEK MIRROR PUSHED: ok ${ok}, failed ${failed}`);
