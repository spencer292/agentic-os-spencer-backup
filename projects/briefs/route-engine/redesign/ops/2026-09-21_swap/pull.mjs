#!/usr/bin/env node
// pull.mjs — READ-ONLY live pull for the 2026-09-21..24 Tavis→Cory / Cory→Spencer swap dry run.
//
// Queries only. Jobber: GraphQL queries (no `mutation` anywhere in this file).
// OptimoRoute: get_routes (GET) and search_orders — both match write-gate's OPTIMO_READ
// (/v1/(get_|search_)) so the gate classifies them as reads and passes them through.
// The write gate is imported anyway, as a belt-and-braces proof that nothing here mutates.
//
// Usage (from repo root):
//   node projects/briefs/route-engine/redesign/ops/2026-09-21_swap/pull.mjs
// Writes: live.json in this folder.

import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const ENV_PATH = path.join(REPO, '.env');
const TZ = 'America/Los_Angeles';

const DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24'];
const FROM_ISO = '2026-09-21T00:00:00-07:00';
const TO_ISO = '2026-09-24T23:59:59-07:00';
const TARGETS = ['Tavis Alexander', 'Cory Ventura'];
const ALSO = ['Spencer Hill'];

// ---------------- env + auth (read-only use) ----------------
function loadEnv() {
  const env = {};
  for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(k, v) {
  let t = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp('^' + k + '=.*$', 'm');
  t = re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n';
  fs.writeFileSync(ENV_PATH, t);
}
let tok = null, tokAt = 0;
async function token(force = false) {
  if (!force && tok && Date.now() - tokAt < 50 * 60 * 1000) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await r.json();
  if (!d.access_token) { console.error('token refresh failed', r.status); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; tokAt = Date.now(); return tok;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jgql(query, variables, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 3) { await token(true); return jgql(query, variables, attempt + 1); }
  const d = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) {
    const w = Math.min(60000, 2500 * 2 ** attempt);
    console.log(`  … jobber throttled — backoff ${w / 1000}s`);
    await sleep(w); return jgql(query, variables, attempt + 1);
  }
  const ts = d.extensions?.cost?.throttleStatus;
  if (ts && ts.currentlyAvailable < 5000) await sleep(Math.min(Math.ceil(((5000 - ts.currentlyAvailable) / (ts.restoreRate || 500)) * 1000), 20000));
  return d;
}
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
async function orSearch(body, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/search_orders?key=${env.OPTIMOROUTE_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orSearch(body, attempt + 1); }
  return d;
}

const ptDate = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const ptTime = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(11, 16);
function visitNumOf(id) {
  let n = null;
  try { n = Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!n || !/^\d+$/.test(n)) n = id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return n;
}

// ---------------- 1. Jobber: every visit in the window ----------------
const VQ = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!,$n:Int!){
  visits(first:$n, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt endAt duration isComplete completedAt visitStatus
      job{ id jobNumber jobStatus }
      client{ id name }
      assignedUsers(first:6){ nodes{ id name{ full } } }
      property{ id address{ street city province postalCode } } }
    pageInfo{ hasNextPage endCursor }
    totalCount } }`;

console.log(`Jobber: pulling visits ${FROM_ISO} .. ${TO_ISO}`);
const visits = [];
let cursor = null, page = 0;
for (;;) {
  const d = await jgql(VQ, { a: cursor, after: FROM_ISO, before: TO_ISO, n: 50 });
  if (!d.data?.visits) { console.error('visits query returned no data:', JSON.stringify(d).slice(0, 500)); process.exit(1); }
  for (const v of d.data.visits.nodes) {
    const a = v.property?.address || {};
    visits.push({
      id: v.id, visitNum: visitNumOf(v.id), title: v.title || '',
      startAt: v.startAt, endAt: v.endAt, duration: v.duration,
      date: ptDate(v.startAt), startPT: ptTime(v.startAt), endPT: v.endAt ? ptTime(v.endAt) : null,
      isComplete: v.isComplete, completedAt: v.completedAt, visitStatus: v.visitStatus,
      jobId: v.job?.id || null, jobNumber: v.job?.jobNumber ?? null, jobStatus: v.job?.jobStatus || null,
      clientName: v.client?.name || null,
      assignees: (v.assignedUsers?.nodes || []).map(u => ({ id: u.id, name: u.name?.full || null })),
      city: a.city || null, zip: a.postalCode || null, street: a.street || null,
    });
  }
  page++;
  console.log(`  page ${page}: ${visits.length}/${d.data.visits.totalCount}`);
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cursor = d.data.visits.pageInfo.endCursor;
}
console.log(`Jobber: ${visits.length} visits in window`);

// ---------------- 2. Jobber: user ids for the three techs ----------------
const UQ = `query { users(first:80){ nodes{ id name{ full } status isAccountAdmin } } }`;
const ud = await jgql(UQ, {});
const users = (ud.data?.users?.nodes || []).map(u => ({ id: u.id, name: u.name?.full || null, status: u.status }));
console.log(`Jobber: ${users.length} users`);

// ---------------- 3. OptimoRoute: routes per date ----------------
const routes = {};
for (const d of DATES) {
  const r = await orGet(`get_routes?date=${d}`);
  if (r.success === false) { console.error(`get_routes ${d} failed:`, JSON.stringify(r).slice(0, 300)); }
  routes[d] = r;
  console.log(`OR get_routes ${d}: ${(r.routes || []).length} routes, ${(r.routes || []).reduce((s, x) => s + (x.stops || []).length, 0)} stops`);
  await sleep(200);
}

// ---------------- 4. OptimoRoute: orders in the window ----------------
const orders = [];
let after = null;
do {
  const body = { dateRange: { from: DATES[0], to: DATES[DATES.length - 1] }, includeOrderData: true };
  if (after) body.after_tag = after;
  const r = await orSearch(body);
  if (r.success === false) { console.error('search_orders failed:', JSON.stringify(r).slice(0, 300)); break; }
  orders.push(...(r.orders || []));
  after = r.after_tag || null;
} while (after);
console.log(`OR search_orders: ${orders.length} orders in window`);

fs.writeFileSync(path.join(__dirname, 'live.json'), JSON.stringify({
  pulledAt: new Date().toISOString(),
  pulledAtPT: new Date().toLocaleString('sv-SE', { timeZone: TZ }),
  window: { from: FROM_ISO, to: TO_ISO, dates: DATES },
  targets: TARGETS, also: ALSO,
  visits, users, routes, orders,
}, null, 1));
console.log(`\nwrote ${path.join(__dirname, 'live.json')}`);
