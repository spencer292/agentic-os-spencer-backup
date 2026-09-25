#!/usr/bin/env node
// CADENCE AUDIT — for a list of job numbers, work out whether each ACTUALLY needs an interim visit.
//
// Spencer 2026-08-09: a list of "jobs missing visits" is a hypothesis, not a finding. Of 18 flagged
// that day, 7 already had a next visit inside the required interval and 2 were exhausted Quick Fix
// series (a sales decision, never an auto-add) — only 9 needed anything. So the test is
//     required = lastVisit + interval   vs   the job's FIRST OPEN FUTURE VISIT
// and an add is warranted only when the existing next visit is LATER than required, or missing.
//
// Interval rules (CLAUDE.local.md):
//   - Quick Fix  -> ALWAYS 7 days (a 5-week weekly series). Series exhausted + activity = FLAG for
//                   a human sales decision, never an automatic add.
//   - TMCP       -> ANY activity (l/a, m/a, h/a) = 7 days. n/a with no catch = monthly (~30).
//   - A CATCH on the last visit overrides the code: 7 days regardless.
// Product comes from the JOB'S LINE ITEM, never jobType — every job here is "Recurring".
//
// READ-ONLY. Prints the verdict per job and writes a plan file for add-interim-visits.mjs.
//
// Usage: node cadence-audit-0814.mjs --jobs=7472,8056,... [--activity=7472:la:1,...] [--out=plan.json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const JOBS = (flag('jobs', '') || '').split(',').filter(Boolean);
const OUT = flag('out', '_cadence_adds_0814.json');
// --activity=<job>:<code>:<caught>
const ACT = {};
for (const p of (flag('activity', '') || '').split(',').filter(Boolean)) {
  const [j, code, caught] = p.split(':');
  ACT[j] = { code: (code || '').toLowerCase(), caught: Number(caught || 0) };
}
if (!JOBS.length) { console.log('Usage: cadence-audit-0814.mjs --jobs=1,2,3 [--activity=1:la:1]'); process.exit(1); }

const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const tr = await (await fetch('https://api.getjobber.com/api/oauth/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
})).json();
if (tr.refresh_token && tr.refresh_token !== env.JOBBER_REFRESH_TOKEN) {
  fs.writeFileSync(ENV_PATH, fs.readFileSync(ENV_PATH, 'utf8').replace(/^JOBBER_REFRESH_TOKEN=.*$/m, 'JOBBER_REFRESH_TOKEN=' + tr.refresh_token));
}
const tok = tr.access_token;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const gql = async (query, attempt = 0) => {
  const r = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query }),
  });
  const d = await r.json();
  if (d.errors) {
    if (d.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 8) {
      await sleep(Math.min(60000, 2000 * 2 ** attempt)); return gql(query, attempt + 1);
    }
    throw new Error(JSON.stringify(d.errors).slice(0, 300));
  }
  return d.data;
};

const ptDay = iso => new Date(new Date(iso).getTime() - 7 * 3600e3).toISOString().slice(0, 10);
const addD = (d, n) => { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
const TODAY = ptDay(new Date().toISOString());

const rows = [];
for (const jn of JOBS) {
  // jobs(filter:{}) has no jobNumber filter on this schema version, so search by number and match.
  const d = await gql(`query { jobs(first: 5, searchTerm: "${jn}") { nodes {
    id jobNumber jobStatus jobType
    client { name }
    lineItems(first: 10) { nodes { name } }
  } } }`);
  const job = (d.jobs?.nodes || []).find(j => String(j.jobNumber) === String(jn));
  if (!job) { rows.push({ jn, verdict: 'NOT FOUND', note: 'no job matched this number' }); await sleep(350); continue; }

  // PAGINATE the visits. A fixed visits(first:60) returns the OLDEST 60 on a mature job — Thornhill
  // (#5540) has 169 and Abraham (#7478) 141, so on 2026-09-13 the capped query reported Thornhill's
  // last visit as 2026-04-08 by a tech who had left, and no future visit at all. Every job past ~60
  // visits — i.e. most of the mature TMCP book — was silently misread.
  const vnodes = [];
  let cur = null;
  for (;;) {
    const p = await gql(`query { job(id: "${job.id}") { visits(first: 50${cur ? `, after: "${cur}"` : ''}) {
      nodes { id startAt isComplete assignedUsers(first: 2) { nodes { name { full } } } property { address { city postalCode } } }
      pageInfo { hasNextPage endCursor } } } }`);
    const c = p.job.visits;
    vnodes.push(...c.nodes);
    if (!c.pageInfo.hasNextPage) break;
    cur = c.pageInfo.endCursor;
    await sleep(350);
  }

  const items = (job.lineItems?.nodes || []).map(n => (n.name || '').toLowerCase());
  const isQuickFix = items.some(n => n.includes('quick fix'));
  const isTMCP = items.some(n => n.includes('total mole control'));
  const product = isQuickFix ? 'Quick Fix' : isTMCP ? 'TMCP' : (items[0] ? `other (${items[0].slice(0, 28)})` : 'none (bid?)');

  const vs = vnodes.map(v => ({ ...v, day: ptDay(v.startAt) })).sort((a, b) => a.day.localeCompare(b.day));
  const done = vs.filter(v => v.isComplete);
  const last = done.length ? done[done.length - 1] : null;
  const future = vs.filter(v => !v.isComplete && v.day > TODAY);
  const next = future.length ? future[0] : null;

  const a = ACT[jn] || { code: '', caught: 0 };
  // Quick Fix is weekly by construction; TMCP is weekly on ANY activity or any catch, monthly on a
  // clean n/a. A catch always wins.
  const hasActivity = a.caught > 0 || /^(l|m|h)\/?a$/.test(a.code);
  // Monthly is the Nth weekday of the month, not a hard 30 days — scheduling-rules.json: the weekday
  // holds and the interval flexes 28-35. Abraham at 34 days was flagged "4d late" against a literal 30.
  const MONTH_MIN = 28, MONTH_MAX = 35;
  const interval = isQuickFix ? 7 : hasActivity ? 7 : MONTH_MIN;
  const grace = isQuickFix || hasActivity ? 7 : MONTH_MAX;   // latest acceptable gap
  const why = isQuickFix ? 'Quick Fix — always weekly'
    : a.caught > 0 ? `catch (${a.caught}) — weekly regardless of code`
      : hasActivity ? `activity ${a.code.toUpperCase()} — weekly` : `${(a.code || 'n/a').toUpperCase()}, no catch — monthly (${MONTH_MIN}-${MONTH_MAX}d)`;

  const required = last ? addD(last.day, interval) : null;   // earliest acceptable
  const latest = last ? addD(last.day, grace) : null;        // latest acceptable
  let verdict, target = null;
  if (!last) verdict = 'NO COMPLETED VISIT — skip';
  // A Quick Fix that ran its 5 weeks and ended QUIET is a finished programme, not a gap. Only an
  // exhausted series with activity STILL showing is a human sales call (another month, or a TMCP).
  else if (isQuickFix && done.length >= 5 && !next) {
    verdict = hasActivity ? 'QUICK FIX EXHAUSTED — flag, do not auto-add'
      : 'COMPLETE — Quick Fix finished clean, no action';
  }
  else if (!next) { verdict = 'ADD — no future visit at all'; target = required < TODAY ? addD(TODAY, 1) : required; }
  else if (next.day <= latest) verdict = `OK — next visit ${next.day} is within ${grace}d`;
  else { verdict = `ADD — next visit ${next.day} is ${daysBetween(latest, next.day)}d late`; target = required < TODAY ? addD(TODAY, 1) : required; }

  rows.push({
    jn, client: job.client?.name, status: job.jobStatus, product,
    tech: last ? (last.assignedUsers?.nodes || [])[0]?.name?.full : null,
    zip: (last || vs[0])?.property?.address?.postalCode, city: (last || vs[0])?.property?.address?.city,
    lastVisit: last?.day, visitsDone: done.length, code: a.code.toUpperCase() || '-', caught: a.caught,
    interval, why, required, nextVisit: next?.day || null, verdict, target,
  });
  await sleep(350);
}

const pad = (s, n) => String(s ?? '').padEnd(n);
console.log(`\nCADENCE AUDIT  ${rows.length} job(s)   today ${TODAY} PT\n`);
console.log(pad('job', 6) + pad('client', 20) + pad('product', 11) + pad('last', 11) + pad('code', 6) + pad('need', 6) + pad('required', 11) + pad('next', 11) + 'verdict');
for (const r of rows) {
  console.log(pad('#' + r.jn, 6) + pad((r.client || '').slice(0, 18), 20) + pad(r.product, 11) + pad(r.lastVisit, 11)
    + pad(r.code + (r.caught ? `/${r.caught}` : ''), 6) + pad(r.interval ? r.interval + 'd' : '-', 6) + pad(r.required, 11) + pad(r.nextVisit || '—', 11) + r.verdict);
}
const adds = rows.filter(r => r.verdict.startsWith('ADD'));
const flags = rows.filter(r => /flag|skip|complete/i.test(r.verdict) || r.verdict === 'NOT FOUND');
console.log(`\n${adds.length} need an interim visit, ${rows.length - adds.length - flags.length} already covered, ${flags.length} need no add (finished / human call).`);
for (const r of rows) console.log(`   #${r.jn} ${pad(r.client, 20)} ${r.why}`);
fs.writeFileSync(path.join(__dirname, OUT), JSON.stringify({ ranAt: new Date().toISOString(), today: TODAY, rows, adds }, null, 2));
console.log(`\nplan -> ${OUT}`);
