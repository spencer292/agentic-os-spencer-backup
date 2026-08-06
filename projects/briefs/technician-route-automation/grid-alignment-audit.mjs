#!/usr/bin/env node
// GRID ALIGNMENT AUDIT — three-way diff for a date window: Jobber day/tech vs OptimoRoute day/tech
// vs what territory grid v5 SAYS the day/tech should be.
//
// Born 2026-08-04: the 08-04 drift check found 155 day-drift + 156 tech-drift stops concentrated in
// 08-10..08-14, the week extend-horizon had just planned. Spencer's call: the GRID decides the day,
// not the Jobber board and not the current OR plan. Before moving anything we need to know which
// side is already grid-correct — copying Jobber onto OR (--apply-tech-drift) would be exactly wrong
// if OR is the grid-derived side.
//
// READ-ONLY. Writes nothing to Jobber or OptimoRoute. Prints buckets + saves JSON.
//
// Usage: node grid-alignment-audit.mjs --from=2026-08-10 --to=2026-08-14 [--grid=territory-grid-v5.json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const TZ = 'America/Los_Angeles';
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const flag = (n, d) => {
  const a = process.argv.find(x => x.startsWith(`--${n}=`));
  return a ? a.split('=')[1] : d;
};
const FROM = flag('from');
const TO = flag('to');
const GRIDF = flag('grid', 'territory-grid-v5.json');
if (!FROM || !TO) { console.error('Usage: grid-alignment-audit.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD [--grid=file]'); process.exit(1); }

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
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('Jobber token refresh failed', res.status); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token; tokenAt = Date.now();
  return accessToken;
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
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
  if (!res.ok) throw new Error(`Jobber HTTP ${res.status}`);
  return data;
}
async function orGet(q, attempt = 0) {
  const env = loadEnv();
  const res = await fetch(`https://api.optimoroute.com/v1/${q}&key=${env.OPTIMOROUTE_API_KEY}`);
  const d = await res.json().catch(() => ({}));
  if ((d.code === 'ERR_TOO_MANY_CONNECTIONS' || res.status === 429) && attempt < 6) { await sleep(1500 * (attempt + 1)); return orGet(q, attempt + 1); }
  return d;
}
const toPT = (iso) => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function dowOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
// Must match drift-check.mjs exactly — this is the OptimoRoute orderNo join key.
function visitNumOf(vis) {
  let num = null;
  try { num = Buffer.from(vis.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!num || !/^\d+$/.test(num)) num = vis.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return num;
}

const GRID = JSON.parse(fs.readFileSync(path.join(__dirname, GRIDF), 'utf8'));
// Same resolution order as push-week.gridDateFor: jobOverrides beat the zip rule; days[] supported.
function gridFor(zip, jobNo) {
  const ov = GRID.jobOverrides && GRID.jobOverrides[String(jobNo)];
  const z = GRID.zips[zip];
  const days = (ov && (ov.days || (ov.day && [ov.day]))) || (z && (z.days || (z.day && [z.day]))) || null;
  const tech = (ov && ov.tech) || (z && z.tech) || null;
  return { days: days && days.length ? days : null, tech, viaOverride: !!ov, knownZip: !!z };
}

// ---------- fetch ----------
console.log(`GRID ALIGNMENT AUDIT ${FROM} .. ${TO}  (grid ${GRIDF})\n`);

const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt isComplete
      client{ name }
      job{ jobNumber startAt }
      property{ address{ street city postalCode } }
      assignedUsers(first:4){ nodes{ name{ full } } } }
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
const active = visits.filter(v => !v.isComplete);
console.log(`Jobber active visits in window: ${active.length}`);

const orStops = {};
for (let d = FROM; d <= TO; d = addDays(d, 1)) {
  const rr = await orGet(`get_routes?date=${d}`);
  for (const rt of rr.routes || []) for (const s of rt.stops || []) {
    const onum = String(s.orderNo || '');
    if (/^\d+-\w+$/.test(onum)) orStops[onum] = { date: d, driver: rt.driverName };
  }
  await sleep(300);
}
console.log(`OptimoRoute own stops in window: ${Object.keys(orStops).length}\n`);

// ---------- three-way compare ----------
const rows = [];
for (const v of active) {
  const jDate = toPT(v.startAt).slice(0, 10);
  if (jDate < FROM || jDate > TO) continue;
  const jn = String(v.job?.jobNumber || '');
  const orderNo = jn + '-' + visitNumOf(v);
  const zip = ((v.property?.address?.postalCode || '') + '').trim().slice(0, 5);
  const jTech = v.assignedUsers?.nodes?.[0]?.name?.full || null;
  const or = orStops[orderNo] || null;
  const g = gridFor(zip, jn);
  const isSet = v.job?.startAt ? toPT(v.job.startAt).slice(0, 10) === jDate : false;

  const jDow = dowOf(jDate);
  const orDow = or ? dowOf(or.date) : null;
  rows.push({
    job: jn, orderNo, client: v.client?.name, title: v.title, zip,
    city: v.property?.address?.city, isSet,
    jDate, jDow, jTech,
    orDate: or?.date || null, orDow, orTech: or?.driver || null,
    gridDays: g.days, gridTech: g.tech, viaOverride: g.viaOverride, knownZip: g.knownZip,
    jDayOnGrid: g.days ? g.days.includes(jDow) : null,
    orDayOnGrid: g.days && orDow ? g.days.includes(orDow) : null,
    jTechOnGrid: g.tech && jTech ? g.tech === jTech : null,
    orTechOnGrid: g.tech && or?.driver ? g.tech === or.driver : null,
  });
}

const pct = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : '—';
const withGrid = rows.filter(r => r.gridDays);
const inOR = rows.filter(r => r.orDate);

console.log('=== DAY: who agrees with the grid? ===');
const jOn = withGrid.filter(r => r.jDayOnGrid).length;
const orOn = withGrid.filter(r => r.orDate && r.orDayOnGrid).length;
const orInGrid = withGrid.filter(r => r.orDate).length;
console.log(`  Jobber day on grid : ${jOn}/${withGrid.length} (${pct(jOn, withGrid.length)})`);
console.log(`  OR day on grid     : ${orOn}/${orInGrid} (${pct(orOn, orInGrid)})`);

console.log('\n=== TECH: who agrees with the grid? ===');
const wt = rows.filter(r => r.gridTech);
const jT = wt.filter(r => r.jTechOnGrid).length;
const orT = wt.filter(r => r.orTech && r.orTechOnGrid).length;
const orTn = wt.filter(r => r.orTech).length;
console.log(`  Jobber tech on grid: ${jT}/${wt.length} (${pct(jT, wt.length)})`);
console.log(`  OR tech on grid    : ${orT}/${orTn} (${pct(orT, orTn)})`);

// four-way bucket on DAY
const B = { bothOn: [], jOnly: [], orOnly: [], neither: [], noOR: [], noGrid: [] };
for (const r of rows) {
  if (!r.gridDays) { B.noGrid.push(r); continue; }
  if (!r.orDate) { B.noOR.push(r); continue; }
  if (r.jDayOnGrid && r.orDayOnGrid) B.bothOn.push(r);
  else if (r.jDayOnGrid) B.jOnly.push(r);
  else if (r.orDayOnGrid) B.orOnly.push(r);
  else B.neither.push(r);
}
console.log('\n=== DAY BUCKETS ===');
console.log(`  A. Jobber + OR both on a grid day, agree?   ${B.bothOn.filter(r => r.jDate === r.orDate).length} agree / ${B.bothOn.filter(r => r.jDate !== r.orDate).length} split across two valid grid days`);
console.log(`  B. Jobber on grid, OR off grid             ${B.jOnly.length}  -> OR must move to Jobber's day`);
console.log(`  C. OR on grid, Jobber off grid             ${B.orOnly.length}  -> Jobber must move to OR's day`);
console.log(`  D. NEITHER on a grid day                   ${B.neither.length}  -> both move to the grid day`);
console.log(`  E. no OR order at all                      ${B.noOR.length}`);
console.log(`  F. zip not in grid (no rule)               ${B.noGrid.length}`);

const showN = Number(flag('show', 25));
for (const [k, label] of [['jOnly', 'B. Jobber on grid, OR off'], ['orOnly', 'C. OR on grid, Jobber off'], ['neither', 'D. neither on grid']]) {
  const list = B[k];
  if (!list.length) continue;
  console.log(`\n--- ${label} (${list.length}) ---`);
  for (const r of list.slice(0, showN)) {
    console.log(`  #${String(r.job).padEnd(5)} ${String(r.zip).padEnd(6)} ${String(r.city || '').slice(0, 14).padEnd(14)} J:${r.jDow}/${String(r.jTech || '?').split(' ')[0].padEnd(9)} OR:${r.orDow}/${String(r.orTech || '?').split(' ')[0].padEnd(9)} GRID:${(r.gridDays || []).join('|').padEnd(8)}/${String(r.gridTech || '?').split(' ')[0]}${r.isSet ? '  [SET]' : ''}${r.viaOverride ? '  [override]' : ''}`);
  }
  if (list.length > showN) console.log(`  … +${list.length - showN} more`);
}

if (B.noGrid.length) {
  const zips = {};
  for (const r of B.noGrid) zips[r.zip] = (zips[r.zip] || 0) + 1;
  console.log(`\n--- F. zips with no grid rule ---`);
  console.log('  ' + Object.entries(zips).sort((a, b) => b[1] - a[1]).map(([z, n]) => `${z}(${n})`).join(', '));
}

const out = path.join(__dirname, `grid-alignment-${FROM}_${TO}.json`);
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), from: FROM, to: TO, grid: GRIDF, rows, buckets: Object.fromEntries(Object.entries(B).map(([k, v]) => [k, v.map(r => r.orderNo)])) }, null, 2));
console.log(`\nSaved: ${out}`);
