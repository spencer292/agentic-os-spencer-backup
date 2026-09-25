#!/usr/bin/env node
// write-optimo-times.mjs — copy the ALREADY-OPTIMIZED OptimoRoute times onto the Jobber visits.
//
// WHY THIS EXISTS: jobber-to-optimo-sync nests its Jobber time write-back inside the per-day
// re-plan loop, and that loop only runs for days whose ORDERS changed. Once the board and
// OptimoRoute are fully in sync — which is exactly the state you want to commit from — it
// re-plans nothing and therefore writes nothing. This writes the times that are already there,
// with NO re-planning, so the committed times are the same ones that were measured and approved.
//
// Same conventions as the sync: startAt from the optimized route, endAt = start + 3h, and the
// D-1 14:00 PT email freeze is enforced per day (a frozen day is skipped, never overridden here).
//
// Usage: node write-optimo-times.mjs dry|live --from=YYYY-MM-DD --to=YYYY-MM-DD [--visits=snap.json]
import '../route-engine/lib/write-gate.mjs';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';
const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.error('Usage: write-optimo-times.mjs dry|live --from=… --to=… [--visits=…]'); process.exit(1); }
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const FROM = flag('from'), TO = flag('to');
const SNAP = flag('visits', '_visits_push.json');
if (!FROM || !TO) { console.error('--from and --to are required'); process.exit(1); }

const loadEnv = () => { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; };
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp(`^${k}=.*$`, 'm'); t = re.test(t) ? t.replace(re, `${k}=${v}`) : t + `\n${k}=${v}\n`; fs.writeFileSync(ENV_PATH, t); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ptNow = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const dowOf = d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d + 'T12:00:00Z').getUTCDay()];

// D-1 14:00 PT email freeze — identical rule to jobber-to-optimo-sync.mjs
function emailCutoffOk(dateStr) {
  const nowStr = ptNow(); const today = nowStr.slice(0, 10); const hour = Number(nowStr.slice(11, 13));
  if (dateStr <= today) return false;
  if (dateStr === addDays(today, 1) && hour >= 14) return false;
  return true;
}
function visitNumOf(vis) {
  let num = null;
  try { num = Buffer.from(vis.id, 'base64').toString('utf8').split('/').pop(); } catch { }
  if (!num || !/^\d+$/.test(num)) num = vis.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return num;
}

let tok = null;
async function token(force = false) {
  if (tok && !force) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('token refresh failed', r.status); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; return tok;
}
async function jgql(query, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query }) });
  if (res.status === 401 && attempt < 2) { await token(true); return jgql(query, attempt + 1); }
  const d = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return jgql(query, attempt + 1); }
  return d;
}
const orGet = async q => (await fetch(`https://api.optimoroute.com/v1/${q}&key=${loadEnv().OPTIMOROUTE_API_KEY}`)).json();

// ---- map orderNo -> Jobber visit, from the same snapshot that was pushed ----
const visits = JSON.parse(fs.readFileSync(path.join(__dirname, SNAP), 'utf8'));
const byOrderNo = new Map();
for (const v of visits) byOrderNo.set(`${v.job.jobNumber}-${visitNumOf(v)}`, v);
const ptDate = s => new Date(new Date(s).getTime() - 7 * 3600e3).toISOString().slice(0, 10);

console.log(`\n  WRITE OPTIMIZED TIMES -> JOBBER (${mode.toUpperCase()})   ${FROM} .. ${TO}`);
console.log(`  now ${ptNow()} PT\n`);

let planned = 0, wrote = 0, failed = 0, skippedFrozen = 0, unmatched = 0, unchanged = 0;
for (let day = FROM; day <= TO; day = addDays(day, 1)) {
  const ok = emailCutoffOk(day);
  const rr = await orGet(`get_routes?date=${day}`);
  const stops = [];
  for (const rt of rr.routes || []) for (const s of rt.stops || []) if (/^\d+-\w+$/.test(String(s.orderNo || '')) && s.scheduledAtDt) stops.push({ ...s, driver: rt.driverName });
  if (!ok) { skippedFrozen += stops.length; console.log(`--- ${day} (${dowOf(day)}) — FROZEN, past its D-1 14:00 cutoff. ${stops.length} stops NOT written.`); continue; }
  console.log(`--- ${day} (${dowOf(day)}) — ${stops.length} stops`);
  let d_ok = 0, d_fail = 0, d_same = 0;
  for (const s of stops) {
    const v = byOrderNo.get(String(s.orderNo));
    if (!v) { unmatched++; continue; }
    const time = s.scheduledAtDt.slice(11, 19);
    const cur = new Date(new Date(v.startAt).getTime() - 7 * 3600e3).toISOString();
    if (ptDate(v.startAt) === day && cur.slice(11, 19) === time) { d_same++; unchanged++; continue; }
    planned++;
    if (mode === 'dry') continue;
    const endPT = new Date(new Date(`${day}T${time}-07:00`).getTime() + 3 * 3600000).toLocaleString('sv-SE', { timeZone: TZ });
    const r = await jgql(`mutation { visitEditSchedule(id: ${JSON.stringify(v.id)}, input: { startAt: { date: "${day}", time: "${time}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0, 10)}", time: "${endPT.slice(11, 19)}", timezone: "${TZ}" } }) { userErrors { message } } }`);
    const ue = [...(r.errors || []).map(e => e.message), ...((r.data?.visitEditSchedule?.userErrors) || []).map(e => e.message)];
    if (ue.length) { d_fail++; failed++; console.log(`    FAIL #${v.job.jobNumber} ${ue.join('; ').slice(0, 120)}`); }
    else { d_ok++; wrote++; }
    await sleep(260);
  }
  console.log(`    written ${d_ok}, already correct ${d_same}, failed ${d_fail}`);
}
console.log(`\n  ${mode === 'dry' ? 'WOULD WRITE' : 'WROTE'} ${mode === 'dry' ? planned : wrote}   already correct ${unchanged}   failed ${failed}   frozen-skipped ${skippedFrozen}   no Jobber match ${unmatched}`);
if (mode === 'dry') console.log('  DRY RUN — nothing written.');
