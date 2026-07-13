#!/usr/bin/env node
// MIRROR-HISTORY BOARD (Spencer 2026-07-10 ~23:00): stop re-solving the operation.
// Each window visit gets:
//   day  = its JOB's own modal weekday from completed-visit history (fallback: current Jobber day)
//   tech = Jobber's currently assigned tech (fallback: optimizer assigns within the day)
// Sets + committed visits are already pinned and are NOT touched.
// The optimizer then only sequences within each day. Zones/rebalancing shelved for later.
//
// Usage: node mirror-history.mjs dry|live   (then optimize-week.mjs plan --fresh --overlap)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const TZ = 'America/Los_Angeles';
const DATES = ['2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17'];
const WD2DATE = { Monday: '2026-07-13', Tuesday: '2026-07-14', Wednesday: '2026-07-15', Thursday: '2026-07-16', Friday: '2026-07-17' };
const ZONES = JSON.parse(fs.readFileSync(path.join(__dirname, 'zone-map.json'), 'utf8')).zones;

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
  if (!res.ok) { console.error('token failed', res.status); process.exit(1); }
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
  return data; // caller checks errors (partial errors tolerated on history batches)
}
const toPT = iso => { const s = new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }); return { date: s.slice(0, 10), hm: s.slice(11, 16) }; };
const weekdayPT = iso => new Date(iso).toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long' });

// 1) window visits with job id + tech
console.log('Fetching window visits…');
const visits = [];
let cursor = null;
for (;;) {
  const q = `query($after: String) { visits(first: 25, after: $after, filter: { startAt: { after: "2026-07-12T06:59:59Z", before: "2026-07-20T06:59:59Z" } }) { nodes { id startAt endAt isComplete assignedUsers(first: 1) { nodes { name { full } } } job { id jobNumber startAt } } pageInfo { hasNextPage endCursor } } }`;
  const r = await jgql(q, { after: cursor });
  if (r.errors) throw new Error('visits: ' + JSON.stringify(r.errors).slice(0, 200));
  visits.push(...r.data.visits.nodes);
  if (!r.data.visits.pageInfo.hasNextPage) break;
  cursor = r.data.visits.pageInfo.endCursor;
  await sleep(700);
}
console.log('window visits:', visits.length);

// --jobber mode: day = the CURRENT Jobber day, tech = CURRENT Jobber tech; no history at all.
// Only Sunday-dated / out-of-window visits float. This reproduces Spencer's own board verbatim.
const JOBBER_MODE = process.argv.includes('--jobber');

// 2) per-job history (modal weekday of completed visits), aliased batches of 8
const jobs = JOBBER_MODE ? [] : [...new Map(visits.filter(v => v.job && v.job.id).map(v => [v.job.id, v.job])).values()];
if (!JOBBER_MODE) console.log('unique jobs:', jobs.length, '— fetching completed-visit history…');
const modalDay = {}; // job id -> weekday name or null
for (let i = 0; i < jobs.length; i += 8) {
  const batch = jobs.slice(i, i + 8);
  const q = 'query { ' + batch.map((j, k) => `j${k}: job(id: "${j.id}") { visits(first: 10, filter: { status: COMPLETED }) { nodes { startAt } } }`).join(' ') + ' }';
  const r = await jgql(q, {});
  const d = r.data || {};
  for (let k = 0; k < batch.length; k++) {
    const nodes = d['j' + k] && d['j' + k].visits ? d['j' + k].visits.nodes : [];
    if (!nodes || nodes.length < 2) { modalDay[batch[k].id] = null; continue; }
    const wd = {};
    for (const n of nodes) { const w = weekdayPT(n.startAt); wd[w] = (wd[w] || 0) + 1; }
    const best = Object.entries(wd).sort((a, b) => b[1] - a[1])[0][0];
    modalDay[batch[k].id] = WD2DATE[best] ? best : null; // weekend modal -> treat as no history
  }
  if ((i / 8) % 10 === 0) console.log(`  history ${Math.min(i + 8, jobs.length)}/${jobs.length}`);
  await sleep(800);
}

// 3) current OR orders (payload data)
const env = loadEnv();
const key = env.OPTIMOROUTE_API_KEY;
const orderNos = [];
const visitToOrder = {};
for (const v of visits) {
  if (v.isComplete) continue;
  let num = null;
  try { num = Buffer.from(v.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (!num || !/^\d+$/.test(num)) num = v.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  const no = (v.job?.jobNumber) + '-' + num;
  orderNos.push(no);
  visitToOrder[v.id] = no;
}
const byNo = {};
for (let i = 0; i < orderNos.length; i += 400) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_orders?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders: orderNos.slice(i, i + 400).map(o => ({ orderNo: o })) }),
  })).json();
  for (const o of r.orders || []) if (o.data && o.success !== false) byNo[o.data.orderNo] = o.data;
  await sleep(400);
}
console.log('OR orders found:', Object.keys(byNo).length);

// 4) build updates
const updates = [];
let mirrored = 0, keptCurrentDay = 0, techless = 0, skippedPinned = 0, noOrder = 0;
const dayTotals = {};
for (const v of visits) {
  if (v.isComplete) continue;
  const no = visitToOrder[v.id];
  const d = byNo[no];
  if (!d) { noOrder++; continue; }
  if (/\(SET\)|\(committed\)/.test(d.notes || '')) { skippedPinned++; const dt = d.date; dayTotals[dt] = (dayTotals[dt] || 0) + 1; continue; }
  const hist = JOBBER_MODE ? null : (v.job && modalDay[v.job.id]);
  const curJobberDate = toPT(v.startAt).date;
  // --trusted mode (the synthesis): established customers (with history) keep their historical
  // day + Jobber tech; recent adds with NO history (the sloppy 8xxx entries) FLOAT — but only
  // within their CITY's zone-day (new Seattle customer -> the Tuesday Seattle route), so overflow
  // joins the route that's already in the area instead of being balanced onto whoever has slack.
  const TRUSTED_MODE = process.argv.includes('--trusted');
  let targetDate = hist ? WD2DATE[hist]
    : (TRUSTED_MODE ? null : (DATES.includes(curJobberDate) ? curJobberDate : null));
  let floats = !targetDate;
  let floatDays = null;
  if (floats) {
    const cm = (d.location.address || '').match(/,\s*([A-Za-z ]+),\s*(?:WA|Washington)/);
    const zdays = cm && ZONES[cm[1].trim()];
    if (zdays && zdays.length) {
      // zone-pinned float: lands on its area's day, tech chosen by proximity
      targetDate = WD2DATE[{ mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' }[zdays[0]]];
      floats = false;
      floatDays = null;
    } else {
      targetDate = '2026-07-15'; // unzoned: spans the week
    }
  }
  if (hist) mirrored++; else keptCurrentDay++;
  const tech = (v.assignedUsers?.nodes?.[0]?.name?.full) || null;
  if (!tech) techless++;
  dayTotals[floats ? 'floating' : targetDate] = (dayTotals[floats ? 'floating' : targetDate] || 0) + 1;
  const payload = {
    operation: 'SYNC', orderNo: no, type: d.type || 'T', date: targetDate,
    duration: d.duration, priority: 'M', // uniform — priority warps route shape (serves high-prio earlier)
    location: { address: d.location.address, locationName: d.location.locationName, latitude: d.location.latitude, longitude: d.location.longitude, acceptPartialMatch: true, acceptMultipleResults: true },
    allowedDates: floats ? { from: DATES[0], to: DATES[4] } : { from: targetDate, to: targetDate },
    allowedWeekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    notes: d.notes || '',
  };
  // --freetech: keep historical DAYS but let the optimizer assign techs within each day.
  // --trusted: pin tech ONLY for established (with-history) customers; floaters stay free.
  const pinTech = process.argv.includes('--trusted') ? (!!hist && !!tech) : (tech && !process.argv.includes('--freetech'));
  if (pinTech) payload.assignedTo = { serial: tech };
  updates.push(payload);
}
console.log(`\nMIRROR PLAN: ${updates.length} orders | day from own history: ${mirrored} | kept current day: ${keptCurrentDay} | pinned untouched: ${skippedPinned} | techless (optimizer assigns): ${techless} | no OR order: ${noOrder}`);
console.log('Day totals:', Object.keys(dayTotals).sort().map(k => `${k}:${dayTotals[k]}`).join('  '));

if (process.argv[2] !== 'live') { console.log('\nDRY — nothing pushed.'); process.exit(0); }
let ok = 0, failed = 0;
for (let i = 0; i < updates.length; i += 3) {
  const batch = updates.slice(i, i + 3);
  const rs = await Promise.all(batch.map(async u => {
    for (let a = 0; a < 5; a++) {
      const r = await (await fetch(`https://api.optimoroute.com/v1/create_order?key=${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u),
      })).json();
      if (r.code !== 'ERR_TOO_MANY_CONNECTIONS') return r;
      await sleep(1500 * (a + 1));
    }
    return { success: false };
  }));
  for (const r of rs) r.success ? ok++ : failed++;
  await sleep(350);
}
console.log(`MIRROR PUSHED: ok ${ok}, failed ${failed}`);
