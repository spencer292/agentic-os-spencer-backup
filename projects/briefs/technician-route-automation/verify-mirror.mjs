#!/usr/bin/env node
// Verify the planned week mimics last week: for every planned stop whose job was
// completed last week, check same weekday + same tech. Reports mismatches.
// Usage: node verify-mirror.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../..', '.env');
const env = {};
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const TZ = 'America/Los_Angeles';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PLAN_DATES = ['2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24'];
const SUB = { 'Tavis Alexander': 'Cory Ventura', 'Brayden Rich': 'Luke LaVergne' };

let tok = null;
async function jt() {
  if (tok) return tok;
  const r = await (await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  })).json();
  if (r.refresh_token && r.refresh_token !== env.JOBBER_REFRESH_TOKEN) {
    const t = fs.readFileSync(ENV_PATH, 'utf8');
    fs.writeFileSync(ENV_PATH, t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, 'JOBBER_REFRESH_TOKEN=' + r.refresh_token));
  }
  tok = r.access_token;
  return tok;
}

// last week's completed visits: job -> {weekday, tech}
const lastWeek = {};
let cursor = null;
for (;;) {
  const q = `query($after: String) { visits(first: 25, after: $after, filter: { status: COMPLETED, startAt: { after: "2026-07-13T06:59:59Z", before: "2026-07-18T07:00:00Z" } }) { nodes { startAt assignedUsers(first: 1) { nodes { name { full } } } job { jobNumber } } pageInfo { hasNextPage endCursor } } }`;
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: 'Bearer ' + await jt(), 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query: q, variables: { after: cursor } }),
  });
  const d = await res.json();
  if (d.errors) {
    if (JSON.stringify(d.errors).includes('THROTTLED')) { await sleep(8000); continue; }
    throw new Error(JSON.stringify(d.errors).slice(0, 200));
  }
  for (const v of d.data.visits.nodes) {
    const jn = v.job && v.job.jobNumber;
    const tech = v.assignedUsers?.nodes?.[0]?.name?.full;
    if (jn == null || !tech) continue;
    const wd = new Date(v.startAt).toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long' });
    lastWeek[jn] = { wd, tech: SUB[tech] || tech };
  }
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cursor = d.data.visits.pageInfo.endCursor;
  await sleep(700);
}

// planned week from OR
const stops = [];
for (const d of PLAN_DATES) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${env.OPTIMOROUTE_API_KEY}&date=${d}`)).json();
  for (const rt of r.routes || []) for (const s of rt.stops || []) stops.push({ orderNo: String(s.orderNo), driver: rt.driverName, date: d });
  await sleep(250);
}

const wdOf = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long' });
let match = 0, dayMiss = 0, techMiss = 0, bothMiss = 0, notLastWeek = 0;
const misses = [];
for (const s of stops) {
  const jn = Number(s.orderNo.split('-')[0]);
  const lw = lastWeek[jn];
  if (!lw) { notLastWeek++; continue; }
  const sameDay = wdOf(s.date) === lw.wd;
  const sameTech = s.driver === lw.tech;
  if (sameDay && sameTech) match++;
  else {
    if (!sameDay && !sameTech) bothMiss++; else if (!sameDay) dayMiss++; else techMiss++;
    misses.push(`job ${jn}: last week ${lw.wd}/${lw.tech} -> planned ${wdOf(s.date)}/${s.driver}`);
  }
}
console.log(`planned stops: ${stops.length} | jobs also done last week: ${stops.length - notLastWeek}`);
console.log(`MATCH day+tech: ${match} | day-only miss: ${dayMiss} | tech-only miss: ${techMiss} | both miss: ${bothMiss}`);
console.log(`new-to-week (grid-slotted): ${notLastWeek}`);
if (misses.length) console.log('Mismatches:\n  ' + misses.join('\n  '));
