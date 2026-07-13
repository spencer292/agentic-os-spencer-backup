#!/usr/bin/env node
// Build the service-area calendar draft from 12 months of COMPLETED Jobber visits.
// Aggregates city + ZIP x weekday, measures day-consistency, writes an editable draft:
//   projects/briefs/technician-route-automation/zone-map-draft.md  (overwrites the week-based v1)
// Raw aggregation cached in history-zone-cache.json (rerunnable without refetching).
//
// Usage: node history-zone-calendar.mjs scan     (fetch + aggregate; ~10-20 min, throttle-safe)
//        node history-zone-calendar.mjs report   (regenerate the markdown from cache)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const CACHE = path.join(__dirname, 'history-zone-cache.json');
const DRAFT = path.join(__dirname, 'zone-map-draft.md');
const TZ = 'America/Los_Angeles';
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
  if (!res.ok) { console.error('token refresh failed', res.status); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token; tokenAt = Date.now();
  return accessToken;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jgql(query, variables, attempt = 0) {
  const token = await jobberToken();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await jobberToken(true); return jgql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 10) {
    const wait = Math.min(90000, 2000 * 2 ** attempt);
    console.log(`  throttled — backoff ${wait / 1000}s`);
    await sleep(wait);
    return jgql(query, variables, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (data.errors) throw new Error('GraphQL: ' + JSON.stringify(data.errors).slice(0, 300));
  return data.data;
}
function weekdayPT(iso) {
  return new Date(iso).toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long' });
}

async function scan() {
  const now = new Date();
  const from = new Date(now.getTime() - 365 * 24 * 3600 * 1000).toISOString();
  const to = now.toISOString();
  console.log(`Scanning COMPLETED visits ${from.slice(0, 10)} -> ${to.slice(0, 10)}…`);
  // agg[city][zip][weekday] = count
  const agg = {};
  let cursor = null, n = 0, page = 0;
  for (;;) {
    const q = `query($after: String) { visits(first: 50, after: $after, filter: { status: COMPLETED, startAt: { after: "${from}", before: "${to}" } }) { nodes { startAt property { address { city postalCode } } } pageInfo { hasNextPage endCursor } } }`;
    const d = await jgql(q, { after: cursor });
    const v = d.visits;
    page++;
    for (const node of v.nodes) {
      n++;
      const a = node.property && node.property.address;
      const city = (a && a.city && a.city.trim()) || '?';
      const zip = (a && a.postalCode && a.postalCode.trim().slice(0, 5)) || '?';
      const wd = weekdayPT(node.startAt);
      agg[city] = agg[city] || {};
      agg[city][zip] = agg[city][zip] || {};
      agg[city][zip][wd] = (agg[city][zip][wd] || 0) + 1;
    }
    if (page % 40 === 0) console.log(`  page ${page}: ${n} visits`);
    if (!v.pageInfo.hasNextPage) break;
    cursor = v.pageInfo.endCursor;
    await sleep(650);
  }
  fs.writeFileSync(CACHE, JSON.stringify({ scannedAt: new Date().toISOString(), from, to, total: n, agg }));
  console.log(`\nSCAN DONE: ${n} completed visits across ${Object.keys(agg).length} cities.`);
  report();
}

function report() {
  const { agg, total, from, to, scannedAt } = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const L = [];
  L.push('# Service-Area Calendar — DRAFT v2 (from 12 months of completed visits)');
  L.push('');
  L.push(`Source: ${total} completed visits, ${from.slice(0, 10)} -> ${to.slice(0, 10)} (generated ${scannedAt.slice(0, 16)})`);
  L.push('');
  L.push('For each area: historical weekday split and a suggested zone-day.');
  L.push('**STRONG** = one day holds >=50% of visits. **LEAN** = 35-50%. **SCATTERED** = no real habit — you decide.');
  L.push('Edit freely: change days, split ZIPs, add second allowed days. This becomes zone-map.json.');
  L.push('');
  // city rollups
  const cities = [];
  for (const [city, zips] of Object.entries(agg)) {
    const wd = {};
    let ct = 0;
    for (const z of Object.values(zips)) for (const [d, c] of Object.entries(z)) { wd[d] = (wd[d] || 0) + c; ct += c; }
    cities.push({ city, count: ct, wd, zips });
  }
  cities.sort((a, b) => b.count - a.count);
  const day = { bucket: {} };
  L.push('| Area | Visits | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Suggested day | Confidence |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const c of cities) {
    if (c.count < 5) continue; // long tail below
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const counts = days.map(d => c.wd[d] || 0);
    const best = days[counts.indexOf(Math.max(...counts))];
    const pct = Math.round(100 * Math.max(...counts) / c.count);
    const conf = pct >= 50 ? 'STRONG' : pct >= 35 ? 'LEAN' : 'SCATTERED';
    L.push(`| ${c.city} | ${c.count} | ${counts.map(x => x || '').join(' | ')} | **${best}** (${pct}%) | ${conf} |`);
    (day.bucket[best] = day.bucket[best] || []).push(`${c.city} (${c.count}${conf === 'STRONG' ? '' : ', ' + conf.toLowerCase()})`);
  }
  L.push('');
  L.push('## Suggested calendar (by dominant historical day)');
  for (const d of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
    if (day.bucket[d]) { L.push(`### ${d}`); for (const c of day.bucket[d]) L.push(`- ${c}`); L.push(''); }
  }
  // ZIP detail for large multi-zip cities
  L.push('## ZIP-level detail (cities with 100+ visits — for splitting)');
  for (const c of cities.filter(x => x.count >= 100)) {
    L.push(`### ${c.city}`);
    const zipRows = Object.entries(c.zips).map(([zip, wd]) => {
      const ct = Object.values(wd).reduce((a, b) => a + b, 0);
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const counts = days.map(d => wd[d] || 0);
      const best = days[counts.indexOf(Math.max(...counts))];
      const pct = ct ? Math.round(100 * Math.max(...counts) / ct) : 0;
      return { zip, ct, best, pct };
    }).sort((a, b) => b.ct - a.ct);
    for (const z of zipRows) if (z.ct >= 10) L.push(`- ${z.zip}: ${z.ct} visits, mostly ${z.best} (${z.pct}%)`);
    L.push('');
  }
  const small = cities.filter(c => c.count < 5);
  if (small.length) L.push(`## Long tail (<5 visits/yr, leave flexible): ${small.map(c => c.city).join(', ')}`);
  fs.writeFileSync(DRAFT, L.join('\n'));
  console.log('Draft written:', DRAFT);
}

const mode = process.argv[2];
if (mode === 'scan') await scan();
else if (mode === 'report') report();
else console.log('Usage: history-zone-calendar.mjs scan|report');
