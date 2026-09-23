#!/usr/bin/env node
// READ-ONLY. Pulls the live Jobber board for 2026-09-21..2026-09-25 plus the OptimoRoute
// route picture, and caches both to week-live.json so the solver can run offline.
// Query = live-run.mjs's VQ + createdAt, instructions, and property coordinates.
import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const ENV_PATH = path.join(REPO, '.' + 'env');
const OUT = path.join(__dirname, 'week-live.json');
const LOG = path.join(__dirname, 'pull-week.log');
const TZ = 'America/Los_Angeles';

const DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];
const FROM_ISO = '2026-09-21T00:00:00-07:00';
const TO_ISO = '2026-09-25T23:59:59-07:00';

fs.writeFileSync(LOG, '');
const log = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); fs.appendFileSync(LOG, s + '\n'); process.stdout.write(s + '\n'); };
const die = m => { log('ABORT — ' + m); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadEnv() { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'); }
let tok = null, tokAt = 0;
async function token(force = false) {
  if (!force && tok && Date.now() - tokAt < 50 * 60 * 1000) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json();
  if (!d.access_token) die(`Jobber token refresh failed (http ${r.status})`);
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; tokAt = Date.now(); return tok;
}
async function jgql(query, variables = {}, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) });
  if (res.status === 401 && attempt < 3) { await token(true); return jgql(query, variables, attempt + 1); }
  const d = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { const w = Math.min(60000, 2500 * 2 ** attempt); log(`  … throttled, backoff ${w / 1000}s`); await sleep(w); return jgql(query, variables, attempt + 1); }
  const ts = d.extensions?.cost?.throttleStatus;
  if (ts && ts.currentlyAvailable < 5000) await sleep(Math.min(Math.ceil(((5000 - ts.currentlyAvailable) / (ts.restoreRate || 500)) * 1000), 20000));
  return d;
}
const ptDate = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const ptTime = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(11, 19);
function visitNumOf(id) { let n = null; try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {} if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10); return n; }

const VQ = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!,$n:Int!){
  visits(first:$n, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt endAt duration createdAt instructions isComplete visitStatus
      job{ jobNumber } client{ name }
      assignedUsers(first:6){ nodes{ id name{ full } } }
      property{ address{ street1 street2 city province postalCode geoStatus
                         coordinates{ latitude longitude } } } }
    pageInfo{ hasNextPage endCursor } totalCount } }`;

log(`=== PULL WEEK ${new Date().toLocaleString('sv-SE', { timeZone: TZ })} PT ===`);
const rows = [];
let cursor = null, pages = 0;
for (;;) {
  const d = await jgql(VQ, { a: cursor, after: FROM_ISO, before: TO_ISO, n: 50 });
  if (!d.data?.visits) die('visits query returned no data: ' + JSON.stringify(d).slice(0, 600));
  pages++;
  for (const v of d.data.visits.nodes) {
    const a = v.property?.address || {};
    const c = a.coordinates || {};
    rows.push({
      id: v.id, visitNum: visitNumOf(v.id), jobNumber: v.job?.jobNumber ?? null,
      client: v.client?.name || null, title: v.title || '', instructions: v.instructions || '',
      date: ptDate(v.startAt), startTime: ptTime(v.startAt), startAt: v.startAt, endAt: v.endAt,
      duration: v.duration ?? null, createdAt: v.createdAt,
      isComplete: v.isComplete, status: v.visitStatus,
      city: a.city || null, zip: a.postalCode || null, geoStatus: a.geoStatus || null,
      address: [a.street1, a.street2, a.city, a.province || 'WA', a.postalCode].filter(Boolean).join(', '),
      lat: c.latitude != null ? Number(c.latitude) : null, lng: c.longitude != null ? Number(c.longitude) : null,
      assignees: (v.assignedUsers?.nodes || []).map(u => ({ id: u.id, name: u.name?.full || null })),
    });
  }
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cursor = d.data.visits.pageInfo.endCursor;
}
const visits = rows.filter(v => DATES.includes(v.date));
log(`Jobber: ${rows.length} visits returned over ${pages} pages, ${visits.length} inside ${DATES[0]}..${DATES[4]}`);
log(`  with coordinates: ${visits.filter(v => v.lat != null).length}   without: ${visits.filter(v => v.lat == null).length}`);
for (const d of DATES) {
  const day = visits.filter(v => v.date === d);
  const byTech = {};
  for (const v of day) { const t = v.assignees[0]?.name || '(unassigned)'; byTech[t] = (byTech[t] || 0) + 1; }
  log(`  ${d}  ${String(day.length).padStart(3)} visits   ${Object.entries(byTech).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(' | ')}`);
}
log(`  already complete: ${visits.filter(v => v.isComplete).length}`);

// ---- OptimoRoute: orders + planned routes (reads only) ----
async function orCall(endpoint, body, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${endpoint}?key=${env.OPTIMOROUTE_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orCall(endpoint, body, attempt + 1); }
  return d;
}
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
const orders = [];
{
  let after = null;
  do {
    const body = { dateRange: { from: DATES[0], to: DATES[4] }, includeOrderData: true, includeScheduleInformation: true };
    if (after) body.after_tag = after;
    const r = await orCall('search_orders', body);
    if (r.success === false) die('search_orders failed: ' + JSON.stringify(r).slice(0, 250));
    for (const o of r.orders || []) orders.push({ ...(o.data || {}), scheduleInformation: o.scheduleInformation || null });
    after = r.after_tag || null;
    await sleep(200);
  } while (after);
}
log(`OptimoRoute: ${orders.length} orders in the window`);
const routes = {};
for (const d of DATES) {
  const rr = await orGet(`get_routes?date=${d}`);
  routes[d] = (rr.routes || []).map(rt => ({
    driver: rt.driverName, duration: rt.duration, distance: rt.distance,
    stops: (rt.stops || []).map(s => ({ orderNo: s.orderNo, stopNumber: s.stopNumber, scheduledAt: s.scheduledAtDt, travelTime: s.travelTime, distance: s.distance, lat: s.latitude, lng: s.longitude, address: s.address })),
  }));
  log(`  ${d}: ${routes[d].map(r => `${r.driver} ${r.stops.length}/${r.duration}min`).join(' | ') || '(no routes)'}`);
  await sleep(200);
}

fs.writeFileSync(OUT, JSON.stringify({ pulledAt: new Date().toISOString(), dates: DATES, visits, orders, routes }, null, 1));
log(`\nwrote ${OUT}`);
