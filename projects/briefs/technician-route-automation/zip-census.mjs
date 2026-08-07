#!/usr/bin/env node
// ZIP CENSUS — every zip on the live board, with measured volume, the cities it contains, and the
// region/owner it currently sits in.
//
// Why this exists (2026-08-06/07): territories.json v7 grouped zips into regions by pattern-matching
// CITY NAMES. Spencer's actual rule is highway boundaries (I-90 / SR-18 / SR-410 / SR-167 / I-705),
// which cut THROUGH cities — "Seattle" is not one territory, it is two. Rebuilding the map by hand
// needs the zip list in front of you with the volume attached, not a region summary.
//
// READ-ONLY. Writes only its own JSON output.
//
// Usage: node zip-census.mjs --from=2026-07-27 --to=2026-08-07 [--weeks=2]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const TZ = 'America/Los_Angeles';

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const WEEKS = Number(flag('weeks', 2));
if (!FROM || !TO) { console.error('Usage: zip-census.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD [--weeks=2]'); process.exit(1); }

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
  if (data.errors && JSON.stringify(data.errors).includes('THROTTLED') && attempt < 9) {
    const w = Math.min(60000, 2500 * 2 ** attempt); console.error(`  throttled — backoff ${(w / 1000).toFixed(0)}s`); await sleep(w); return jgql(query, variables, attempt + 1);
  }
  return data;
}
const toPT = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });

// current map, for the "where does this zip live today" column
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'territories.json'), 'utf8'));
const zipRegion = {}, zipOwner = {};
for (const [name, r] of Object.entries(T.regions)) {
  for (const z of r.zips) { zipRegion[z] = name; zipOwner[z] = r.owner; }
}

const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id startAt
      property{ address{ street city postalCode } }
      assignedUsers(first:3){ nodes{ name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;

let cur = null; const visits = [];
for (;;) {
  const d = await jgql(Q, { a: cur, after: `${FROM}T00:00:00-07:00`, before: `${TO}T23:59:59-07:00` });
  if (!d.data) { console.error('Jobber query failed:', JSON.stringify(d).slice(0, 300)); process.exit(1); }
  visits.push(...d.data.visits.nodes);
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cur = d.data.visits.pageInfo.endCursor;
  await sleep(400);
}

const zips = {};
for (const v of visits) {
  const zip = ((v.property?.address?.postalCode || '') + '').trim().slice(0, 5);
  const city = (v.property?.address?.city || '').trim();
  const tech = v.assignedUsers?.nodes?.[0]?.name?.full || 'UNASSIGNED';
  const key = zip || '?????';
  const z = zips[key] = zips[key] || { zip: key, n: 0, cities: {}, techs: {} };
  z.n++;
  if (city) z.cities[city] = (z.cities[city] || 0) + 1;
  z.techs[tech] = (z.techs[tech] || 0) + 1;
}

const rows = Object.values(zips).map(z => ({
  zip: z.zip,
  perWeek: +(z.n / WEEKS).toFixed(1),
  total: z.n,
  city: Object.entries(z.cities).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}(${n})`).join(' '),
  region: zipRegion[z.zip] || 'UNMAPPED',
  owner: zipOwner[z.zip] || '—',
  techs: Object.entries(z.techs).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t.split(' ')[0]}:${n}`).join(' '),
})).sort((a, b) => b.total - a.total);

console.log(`ZIP CENSUS  ${FROM} .. ${TO}   visits=${visits.length}  zips=${rows.length}  (per-week over ${WEEKS} weeks)\n`);
console.log('ZIP    /wk  tot  CURRENT REGION                              OWNER      CITIES');
for (const r of rows) {
  console.log(
    `${r.zip}  ${String(r.perWeek).padStart(4)} ${String(r.total).padStart(4)}  ` +
    `${r.region.slice(0, 42).padEnd(42)}  ${r.owner.split(' ')[0].padEnd(9)}  ${r.city.slice(0, 60)}`
  );
}

const unmapped = rows.filter(r => r.region === 'UNMAPPED');
if (unmapped.length) {
  console.log(`\nUNMAPPED (${unmapped.length} zips, ${unmapped.reduce((s, r) => s + r.total, 0)} visits):`);
  for (const r of unmapped) console.log(`  ${r.zip}  ${r.total}  ${r.city}`);
}

const out = path.join(__dirname, `zip-census-${FROM}_${TO}.json`);
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), from: FROM, to: TO, weeks: WEEKS, visits: visits.length, rows }, null, 2));
console.log(`\nSaved: ${out}`);
