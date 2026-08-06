#!/usr/bin/env node
/**
 * intraday-drift.mjs — how far behind is each truck RIGHT NOW, and who is about to be told
 * the wrong arrival time?
 *
 * READ-ONLY. Writes nothing to Jobber or OptimoRoute. This is the sensing half of intraday
 * re-routing; any script that acts on the day should take its numbers from here.
 *
 * Why it reads completion from Jobber and the plan from OptimoRoute:
 *   OptimoRoute knows when each stop was PLANNED for, but nothing else — verified 2026-08-03 at
 *   13:40 PT, all 107 of the day's stops still reported status "scheduled" while 70 of them were
 *   already done. The crews do not drive the OptimoRoute app. Jobber is where "I finished this
 *   one" actually lands, in real time: completedAt timestamps track the work as it happens.
 *   So plan comes from OptimoRoute, truth comes from Jobber, and drift is the difference.
 *
 * Drift is measured from the LAST completed stop, not averaged. A truck that lost an hour at 8am
 * and then held pace is an hour behind for the rest of the day — averaging hides that.
 *
 * Usage:
 *   node intraday-drift.mjs [date] [--json] [--late=30]
 *     date     defaults to today (Pacific)
 *     --late   minutes of drift before a remaining stop is called out (default 30)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';

const args = process.argv.slice(2);
const flag = n => args.find(a => a.startsWith(`--${n}=`))?.split('=')[1];
const LATE = Number(flag('late') || 30);
const asJson = args.includes('--json');

const loadEnv = () => {
  const env = {};
  for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
  return env;
};
const saveEnvKey = (key, value) => {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  fs.writeFileSync(ENV_PATH, re.test(txt) ? txt.replace(re, `${key}=${value}`) : `${txt}\n${key}=${value}\n`);
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const ptNow = () => new Date().toLocaleString('sv-SE', { timeZone: TZ });
const DATE = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || ptNow().slice(0, 10);
const NOW_HM = ptNow().slice(11, 16);

/** "HH:MM" -> minutes since midnight. The whole comparison happens in local wall-clock minutes. */
const hm2m = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };
const m2hm = m => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(Math.round(((m % 60) + 60) % 60)).padStart(2, '0')}`;
const ptHM = iso => iso ? new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(11, 16) : '';
const ptDate = iso => iso ? new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10) : '';
const numericId = gid => { try { return Buffer.from(gid, 'base64').toString('utf8').split('/').pop(); } catch { return ''; } };
const sign = n => (n > 0 ? `+${n}` : String(n));

// ---------------------------------------------------------------- Jobber

let tok = null;
async function token(force = false) {
  if (tok && !force) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) { console.error('Jobber token refresh failed', r.status, JSON.stringify(d).slice(0, 200)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token;
  return tok;
}
async function jgql(query, variables, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await token(true); return jgql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
  if (data.errors) throw new Error('Jobber: ' + JSON.stringify(data.errors).slice(0, 300));
  return data.data;
}

async function pullVisits() {
  const out = [];
  let cursor = null;
  for (;;) {
    const d = await jgql(`query($after:String){ visits(first:50, after:$after, filter:{ startAt:{ after:"${DATE}T00:00:00-07:00", before:"${DATE}T23:59:59-07:00" } }){ nodes{ id title startAt endAt isComplete completedAt duration client{ name } job{ jobNumber } assignedUsers(first:3){ nodes{ name{ full } } } property{ address{ street city postalCode } } } pageInfo{ hasNextPage endCursor } } }`, { after: cursor });
    out.push(...d.visits.nodes);
    if (!d.visits.pageInfo.hasNextPage) break;
    cursor = d.visits.pageInfo.endCursor;
    await sleep(500);
  }
  return out;
}

// ---------------------------------------------------------------- OptimoRoute

async function pullRoutes() {
  const K = loadEnv().OPTIMOROUTE_API_KEY;
  const r = await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${DATE}`);
  const j = await r.json();
  if (!j?.success) throw new Error('OptimoRoute get_routes failed: ' + JSON.stringify(j).slice(0, 200));
  return j.routes || [];
}

// ---------------------------------------------------------------- join

const [visits, routes] = await Promise.all([pullVisits(), pullRoutes()]);

const visitByOrder = new Map();
for (const v of visits) visitByOrder.set(`${v.job?.jobNumber || ''}-${numericId(v.id)}`, v);

const techs = [];
for (const route of routes) {
  const stops = (route.stops || []).filter(s => s.orderNo).sort((a, b) => (a.stopNumber || 0) - (b.stopNumber || 0));
  const rows = stops.map(s => {
    const v = visitByOrder.get(s.orderNo);
    const planned = s.scheduledAt ? hm2m(s.scheduledAt) : null;
    // completedAt is only meaningful if it lands on the day being examined.
    const doneHM = v?.isComplete && v.completedAt && ptDate(v.completedAt) === DATE ? ptHM(v.completedAt) : '';
    return {
      orderNo: s.orderNo,
      stop: s.stopNumber,
      planned, plannedHM: s.scheduledAt || '',
      done: doneHM ? hm2m(doneHM) : null, doneHM,
      complete: !!v?.isComplete,
      jn: v?.job?.jobNumber ? String(v.job.jobNumber) : '',
      who: v?.client?.name || s.locationName || '',
      addr: [v?.property?.address?.street, v?.property?.address?.city].filter(Boolean).join(', ') || s.address || '',
      zip: (v?.property?.address?.postalCode || '').slice(0, 5),
      inJobber: !!v,
    };
  });

  // Running drift = the most recent completed stop's (actual - planned). Not an average:
  // a truck that lost an hour early and then held pace is still an hour down all day.
  const completed = rows.filter(r => r.done != null);
  const last = completed[completed.length - 1] || null;
  const drift = last ? last.done - last.planned : 0;
  const remaining = rows.filter(r => !r.complete);

  techs.push({
    driver: route.driverName || '(unnamed)',
    total: rows.length,
    doneCount: completed.length,
    remaining,
    drift,
    last,
    rows,
    // Projected finish = last remaining stop's plan shifted by current drift.
    projectedEnd: remaining.length ? m2hm((remaining[remaining.length - 1].planned ?? 0) + drift) : null,
  });
}
techs.sort((a, b) => b.drift - a.drift);

const late = techs.filter(t => t.drift >= LATE && t.remaining.length);
const affected = late.flatMap(t => t.remaining.map(r => ({ ...r, driver: t.driver, drift: t.drift, eta: m2hm(r.planned + t.drift) })));

if (asJson) {
  console.log(JSON.stringify({ date: DATE, now: NOW_HM, lateThreshold: LATE, techs, affected }, null, 1));
  process.exit(0);
}

// ---------------------------------------------------------------- report

console.log(`INTRADAY DRIFT — ${DATE}, as of ${NOW_HM} PT   (plan: OptimoRoute · completions: Jobber)\n`);

for (const t of techs) {
  const bar = t.drift >= LATE ? 'BEHIND' : t.drift <= -LATE ? 'AHEAD ' : 'on time';
  console.log(`${t.driver.padEnd(19)} ${String(t.doneCount).padStart(2)}/${String(t.total).padEnd(3)} done   drift ${sign(t.drift).padStart(4)} min  ${bar}` +
    (t.remaining.length ? `   ${t.remaining.length} left, projected finish ${t.projectedEnd}` : '   day complete'));
  if (t.last) console.log(`  last done: #${t.last.jn} ${t.last.who} — planned ${t.last.plannedHM}, actually ${t.last.doneHM}`);
}

const noSignal = techs.filter(t => !t.doneCount && t.total);
if (noSignal.length) {
  console.log(`\nNO COMPLETIONS YET: ${noSignal.map(t => t.driver).join(', ')} — either not started, or not marking visits complete in Jobber.`);
}

if (!affected.length) {
  console.log(`\nNo truck is more than ${LATE} min behind with stops left. Nothing to act on.`);
} else {
  console.log(`\n${affected.length} REMAINING STOPS ON A LATE TRUCK — these customers were given a window that is now wrong:\n`);
  for (const a of affected) {
    console.log(`  ${a.driver.padEnd(18)} #${String(a.jn).padEnd(5)} planned ${a.plannedHM} -> now ~${a.eta}  (${sign(a.drift)} min)  ${a.who} — ${a.addr} ${a.zip}`);
  }
}

const ghosts = techs.flatMap(t => t.rows.filter(r => !r.inJobber).map(r => ({ ...r, driver: t.driver })));
if (ghosts.length) {
  console.log(`\n${ghosts.length} routed stop(s) with no matching Jobber visit today — completion can never be detected for these:`);
  for (const g of ghosts) console.log(`  ${g.driver.padEnd(18)} ${g.orderNo}  ${g.addr}`);
}
