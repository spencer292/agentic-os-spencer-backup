#!/usr/bin/env node
// CONTINUITY CHECK — for every upcoming visit, is it assigned to the tech who has actually been
// serving that property? Spencer 2026-08-04: "in most cases the same tech needs to keep the same
// customer. The continuity does matter for repeat visits."
//
// Continuity is a property of the CUSTOMER, not of the zip code. A zip->tech grid only approximates
// it, and every time the grid is re-cut (v1..v6 in four weeks) it silently reassigns real customers.
// This measures the real thing: upcoming assigned tech vs. who last served that property.
//
// READ-ONLY.
//
// Usage: node continuity-check.mjs --from=2026-08-10 --to=2026-08-14 [--history-days=45]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const TZ = 'America/Los_Angeles';

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const HIST = Number(flag('history-days', 45));
if (!FROM || !TO) { console.error('Usage: continuity-check.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD [--history-days=45]'); process.exit(1); }

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
  if (throttled && attempt < 9) { const w = Math.min(60000, 2500 * 2 ** attempt); console.log(`  throttled — backoff ${(w / 1000).toFixed(0)}s`); await sleep(w); return jgql(query, variables, attempt + 1); }
  return data;
}
const toPT = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
  visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id startAt isComplete
      client{ id name }
      job{ jobNumber }
      property{ id address{ city postalCode } }
      assignedUsers(first:4){ nodes{ name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;

async function fetchRange(a, b, label) {
  let cur = null; const out = [];
  for (;;) {
    const d = await jgql(Q, { a: cur, after: `${a}T00:00:00-07:00`, before: `${b}T23:59:59-07:00` });
    if (!d.data) { console.error(`${label} query failed:`, JSON.stringify(d).slice(0, 250)); break; }
    out.push(...d.data.visits.nodes);
    if (!d.data.visits.pageInfo.hasNextPage) break;
    cur = d.data.visits.pageInfo.endCursor;
    await sleep(400);
  }
  console.log(`  ${label}: ${out.length} visits`);
  return out;
}

const todayPT = new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
console.log(`CONTINUITY CHECK  upcoming ${FROM}..${TO}  vs history last ${HIST} days\n`);
const history = await fetchRange(addDays(todayPT, -HIST), addDays(todayPT, -1), 'history');
const upcoming = await fetchRange(FROM, TO, 'upcoming');

// property -> [{date, tech}] most recent first
const served = {};
for (const v of history) {
  const tech = v.assignedUsers?.nodes?.[0]?.name?.full;
  const pid = v.property?.id;
  if (!tech || !pid) continue;
  (served[pid] = served[pid] || []).push({ date: toPT(v.startAt).slice(0, 10), tech, complete: v.isComplete });
}
for (const k of Object.keys(served)) served[k].sort((a, b) => b.date.localeCompare(a.date));

let match = 0, mismatch = 0, noHistory = 0, noTech = 0;
const breaks = [];
const pairCount = {};
for (const v of upcoming) {
  if (v.isComplete) continue;
  const tech = v.assignedUsers?.nodes?.[0]?.name?.full;
  const pid = v.property?.id;
  if (!tech) { noTech++; continue; }
  const hist = served[pid];
  if (!hist || !hist.length) { noHistory++; continue; }
  const last = hist[0];
  if (last.tech === tech) match++;
  else {
    mismatch++;
    const k = `${last.tech.split(' ')[0]} -> ${tech.split(' ')[0]}`;
    pairCount[k] = (pairCount[k] || 0) + 1;
    breaks.push({ job: v.job?.jobNumber, client: v.client?.name, city: v.property?.address?.city, zip: v.property?.address?.postalCode, was: last.tech, lastDate: last.date, now: tech, seen: hist.length });
  }
}
const denom = match + mismatch;
console.log(`\n=== CONTINUITY on ${FROM}..${TO} ===`);
console.log(`  same tech as last visit : ${match}/${denom}  (${denom ? (100 * match / denom).toFixed(1) : '—'}%)`);
console.log(`  DIFFERENT tech          : ${mismatch}/${denom}  (${denom ? (100 * mismatch / denom).toFixed(1) : '—'}%)`);
console.log(`  no visit in last ${HIST}d   : ${noHistory}   (new or long-cycle customers — no continuity to keep)`);
console.log(`  no tech assigned        : ${noTech}`);

if (Object.keys(pairCount).length) {
  console.log('\n  handovers (previous tech -> newly assigned):');
  for (const [k, n] of Object.entries(pairCount).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(4)}  ${k}`);
}
const SHOW = Number(flag('show', 25));
if (breaks.length) {
  console.log(`\n  first ${Math.min(SHOW, breaks.length)} broken pairings:`);
  for (const b of breaks.slice(0, SHOW)) {
    console.log(`    #${String(b.job).padEnd(5)} ${String(b.client || '').slice(0, 20).padEnd(21)} ${String(b.city || '').slice(0, 13).padEnd(14)} ${b.was.split(' ')[0].padEnd(9)} (last ${b.lastDate}, ${b.seen} visits) -> ${b.now.split(' ')[0]}`);
  }
  if (breaks.length > SHOW) console.log(`    … +${breaks.length - SHOW} more`);
}
const out = path.join(__dirname, `continuity-${FROM}_${TO}.json`);
fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), from: FROM, to: TO, historyDays: HIST, match, mismatch, noHistory, noTech, pairCount, breaks }, null, 2));
console.log(`\nSaved: ${out}`);
