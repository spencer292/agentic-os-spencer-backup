#!/usr/bin/env node
// REGION CAPACITY — group the service area into named regions, measure ACTUAL weekly volume and
// the real cost per stop in each, and work out how many service days per week each region needs.
//
// Spencer 2026-08-06: "Are you able to look at the region rhythm and determine which regions would
// need multiple visits per week just based on the capacity... tell me how many visits we have for
// those regions and what we can determine is a two-region area?"
//
// Why not use the grid's visitsPerYear: that is a trailing annual figure (15,138/yr = ~291/wk) while
// August is running ~560/wk. Capacity has to be planned on peak-season reality, so volume here comes
// from the live board over a recent window.
//
// Cost per stop is measured, not assumed: OptimoRoute's per-stop travelTime is the real drive INTO
// each stop, so a spread-out region shows its true cost instead of a flat 10-minute guess.
//
// Spencer's rule being served: every region gets a fixed rhythm; most 1 day/week, some 2. When an
// area needs 2, the days go on OPPOSITE ends of the week so a new caller is never far from the next
// scheduled run.
//
// READ-ONLY.
//
// Usage: node region-capacity.mjs --from=2026-07-27 --to=2026-08-07 [--weeks=2] [--hours=8]

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
const WEEKS = Number(flag('weeks', 2));
const DAY_HOURS = Number(flag('hours', 8));
if (!FROM || !TO) { console.error('Usage: region-capacity.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD [--weeks=2] [--hours=8]'); process.exit(1); }

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
    const w = Math.min(60000, 2500 * 2 ** attempt); console.log(`  throttled — backoff ${(w / 1000).toFixed(0)}s`); await sleep(w); return jgql(query, variables, attempt + 1);
  }
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

// ---------- region map ----------
// Named the way the business talks about the map, not by k-means: a region is somewhere a tech would
// say they are "working today". Zip wins over city when a zip straddles a boundary (98372 splits
// Edgewood/Puyallup across SR-167, which is why "move Edgewood" is never a clean zip operation).
const ZIP_REGION = {
  '98372': 'Puyallup / Edgewood', '98371': 'Puyallup / Edgewood',
  '98092': 'Auburn / Federal Way', '98042': 'Kent / Covington / Maple Valley',
  // City spellings vary between records ("BonneyLake" with no space), so pin the ones that matter.
  '98391': 'Plateau (Enumclaw/Buckley/Bonney Lake)',
  '98351': 'Peninsula / Gig Harbor', '98359': 'Peninsula / Gig Harbor',
  '98296': 'Kirkland / Redmond / Woodinville',
};
const CITY_RULES = [
  [/olympia|lacey|tumwater|yelm|rainier|tenino/i, 'Thurston / Olympia'],
  [/gig harbor|port orchard|bremerton|fox island|vaughn|lakebay|key ?peninsula|purdy/i, 'Peninsula / Gig Harbor'],
  [/dupont|steilacoom|lakewood|university place|fircrest|spanaway|parkland/i, 'Lakewood / UP / Spanaway'],
  [/tacoma/i, 'Tacoma'],
  [/graham|eatonville|roy|orting|south prairie|wilkeson/i, 'Graham / Orting'],
  [/puyallup|edgewood|milton|south hill/i, 'Puyallup / Edgewood'],
  [/bonney lake|sumner|lake tapps|buckley|enumclaw|black diamond|ravensdale|pierce county/i, 'Plateau (Enumclaw/Buckley/Bonney Lake)'],
  [/auburn|federal way|pacific|algona/i, 'Auburn / Federal Way'],
  [/kent|covington|maple valley/i, 'Kent / Covington / Maple Valley'],
  [/renton|newcastle/i, 'Renton / Newcastle'],
  [/burien|seatac|tukwila|normandy park|des moines|white center/i, 'Burien / SeaTac / South King'],
  [/mercer island|bellevue|clyde hill|medina|beaux arts|hunts point|yarrow point|newport/i, 'Bellevue / Mercer'],
  [/sammamish|issaquah/i, 'Sammamish / Issaquah'],
  [/redmond|kirkland|woodinville|bothell|duvall/i, 'Kirkland / Redmond / Woodinville'],
  [/north bend|snoqualmie|fall city|carnation|preston/i, 'Snoqualmie Valley'],
  [/shoreline|lake forest park|kenmore|edmonds|mountlake/i, 'Shoreline / North'],
  [/seattle/i, 'Seattle'],
];
function regionOf(zip, city) {
  if (ZIP_REGION[zip]) return ZIP_REGION[zip];
  for (const [re, name] of CITY_RULES) if (re.test(city || '')) return name;
  return 'UNMAPPED';
}

// ---------- gather ----------
console.log(`REGION CAPACITY  ${FROM} .. ${TO}  (${WEEKS} week sample, ${DAY_HOURS}h day)\n`);
const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id startAt isComplete job{ jobNumber startAt }
      property{ address{ city postalCode } }
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
console.log(`Jobber visits in sample: ${visits.length}`);

const byOrder = {};
for (const v of visits) {
  const zip = ((v.property?.address?.postalCode || '') + '').trim().slice(0, 5);
  const city = v.property?.address?.city || '';
  const jDate = toPT(v.startAt).slice(0, 10);
  byOrder[String(v.job?.jobNumber) + '-' + visitNumOf(v)] = {
    zip, city, region: regionOf(zip, city), date: jDate,
    isSet: v.job?.startAt ? toPT(v.job.startAt).slice(0, 10) === jDate : false,
    tech: v.assignedUsers?.nodes?.[0]?.name?.full || null,
  };
}

// real drive-in time per stop, straight from the OptimoRoute plan
const travel = {}; // region -> {sec, n}
let orStops = 0;
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) {
    const stops = (rt.stops || []).filter(s => /^\d+-\w+$/.test(String(s.orderNo || '')));
    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      const m = byOrder[String(s.orderNo)];
      if (!m) continue;
      orStops++;
      if (i === 0) continue; // first leg is commute from home, not a between-stops cost
      const t = travel[m.region] = travel[m.region] || { sec: 0, n: 0 };
      t.sec += Number(s.travelTime || 0); t.n++;
    }
  }
  await sleep(300);
}
console.log(`OptimoRoute stops matched: ${orStops}\n`);

// ---------- aggregate ----------
const reg = {};
for (const m of Object.values(byOrder)) {
  const r = reg[m.region] = reg[m.region] || { visits: 0, sets: 0, zips: new Set(), cities: new Set(), days: {}, techs: {} };
  r.visits++; if (m.isSet) r.sets++;
  r.zips.add(m.zip); if (m.city) r.cities.add(m.city);
  r.days[dowOf(m.date)] = (r.days[dowOf(m.date)] || 0) + 1;
  if (m.tech) r.techs[m.tech.split(' ')[0]] = (r.techs[m.tech.split(' ')[0]] || 0) + 1;
}

if (reg.UNMAPPED) {
  const seen = new Set();
  console.log('UNMAPPED zips (extend CITY_RULES or ZIP_REGION):');
  for (const m of Object.values(byOrder)) {
    if (m.region !== 'UNMAPPED' || seen.has(m.zip)) continue;
    seen.add(m.zip);
    console.log(`   ${m.zip}  ${m.city}`);
  }
  console.log('');
}

const rows = [];
for (const [name, r] of Object.entries(reg)) {
  const perWeek = r.visits / WEEKS;
  const t = travel[name];
  const travelMin = t && t.n ? (t.sec / t.n) / 60 : 12; // fallback if a region never appeared in a route
  const serviceMin = 10 + (r.sets / Math.max(1, r.visits)) * 10; // SETs run ~20 min, standard ~10
  const minPerStop = travelMin + serviceMin;
  const hoursPerWeek = perWeek * minPerStop / 60;
  const daysNeeded = hoursPerWeek / DAY_HOURS;
  rows.push({ name, perWeek, zips: r.zips.size, travelMin, minPerStop, hoursPerWeek, daysNeeded, days: r.days, techs: r.techs, measured: !!(t && t.n) });
}
rows.sort((a, b) => b.hoursPerWeek - a.hoursPerWeek);

console.log('region'.padEnd(38) + 'zips'.padStart(5) + 'vis/wk'.padStart(8) + 'drive'.padStart(7) + 'min/stop'.padStart(9) + 'hrs/wk'.padStart(8) + 'days'.padStart(7) + '  rhythm');
console.log('-'.repeat(110));
let totH = 0, totV = 0;
for (const r of rows) {
  totH += r.hoursPerWeek; totV += r.perWeek;
  const rec = r.daysNeeded <= 1.05 ? '1 day' : r.daysNeeded <= 2.05 ? '2 DAYS — split opposite ends' : `${Math.ceil(r.daysNeeded)} DAYS`;
  console.log(
    r.name.padEnd(38) + String(r.zips).padStart(5) + r.perWeek.toFixed(0).padStart(8) +
    (r.travelMin.toFixed(0) + 'm').padStart(7) + r.minPerStop.toFixed(0).padStart(9) +
    r.hoursPerWeek.toFixed(1).padStart(8) + r.daysNeeded.toFixed(2).padStart(7) + '  ' + rec + (r.measured ? '' : '  (drive est.)'));
}
console.log('-'.repeat(110));
console.log('TOTAL'.padEnd(38) + ''.padStart(5) + totV.toFixed(0).padStart(8) + ''.padStart(16) + totH.toFixed(1).padStart(8) + (totH / DAY_HOURS).toFixed(2).padStart(7) + `  tech-days needed (4 techs x 5 = 20 available)`);

console.log('\n\n=== HOW EACH REGION IS SERVED TODAY (sample days, visit counts) ===');
for (const r of rows) {
  const spread = DOW.slice(1, 6).map(d => `${d} ${String(r.days[d] || 0).padStart(3)}`).join('  ');
  const techs = Object.entries(r.techs).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}:${n}`).join(' ');
  console.log(`\n  ${r.name}`);
  console.log(`     ${spread}`);
  console.log(`     techs: ${techs}`);
}

const out = path.join(__dirname, `region-capacity-${FROM}_${TO}.json`);
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), from: FROM, to: TO, weeks: WEEKS, dayHours: DAY_HOURS, rows: rows.map(r => ({ ...r, days: r.days, techs: r.techs })) }, null, 2));
console.log(`\nSaved: ${out}`);
