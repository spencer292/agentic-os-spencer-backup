// READ ONLY. Completed field visits per month, split by product (TMCP vs Quick Fix vs other),
// plus how many techs carried the load. Answers: how big is the slow-season board vs peak,
// and what share of visits each product drives.
// Product comes from the job's LINE ITEM, never jobType (Spencer 2026-08-05).
// Usage: node projects/briefs/got-moles-scale/scripts/visit-mix-seasonality.mjs [FROM] [TO]
import fs from 'node:fs';
import { gql, sleep, ptDayBoundsUtc } from '../../jobber-notes-automation/catch-tally/jb.mjs';

const FROM = process.argv[2] || '2024-10-01';
const TO   = process.argv[3] || '2026-10-15';
const OUT  = 'C:/Agentic-os-got-moles/projects/briefs/got-moles-scale/data';
const { after } = ptDayBoundsUtc(FROM);
const { before } = ptDayBoundsUtc(TO);

// ---- 1. visits ----
const visits = [];
let cursor = null, page = 0;
for (;;) {
  page++;
  const a = cursor ? `, after: "${cursor}"` : '';
  const d = await gql(`query { visits(first: 100${a}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
    pageInfo { hasNextPage endCursor }
    nodes { startAt visitStatus completedBy job { id } } } }`);
  for (const n of d.visits.nodes) visits.push({ startAt: n.startAt, status: n.visitStatus, by: n.completedBy || null, job: n.job?.id || null });
  if (page % 25 === 0) process.stderr.write(`page ${page}: ${visits.length} visits\n`);
  if (!d.visits.pageInfo.hasNextPage) break;
  cursor = d.visits.pageInfo.endCursor;
  await sleep(120);
}
process.stderr.write(`visits: ${visits.length}\n`);

// ---- 2. line items per job ----
const jobIds = [...new Set(visits.map(v => v.job).filter(Boolean))];
const jobs = new Map();
const CHUNK = 20;
for (let i = 0; i < jobIds.length; i += CHUNK) {
  const chunk = jobIds.slice(i, i + CHUNK);
  const q = `query { ${chunk.map((id, k) => `j${k}: job(id: ${JSON.stringify(id)}) { id jobNumber lineItems(first: 10) { nodes { name } } }`).join(' ')} }`;
  const d = await gql(q);
  for (const k of Object.keys(d)) if (d[k]) jobs.set(d[k].id, { num: d[k].jobNumber, items: d[k].lineItems.nodes.map(n => n.name || '') });
  if ((i / CHUNK) % 20 === 0) process.stderr.write(`jobs: ${jobs.size}/${jobIds.length}\n`);
  await sleep(150);
}

const product = (id) => {
  const items = jobs.get(id)?.items || [];
  // Legacy names: "Annual Mole Control Service" / "TMCP Deposit" / Friends and family = the recurring
  // plan; "1 Month of Mole Control Service" = the one-month product renamed Quick Fix in Jan 2026.
  if (items.some(n => /total mole control|annual mole control|tmcp|friends and family/i.test(n))) return 'tmcp';
  if (items.some(n => /quick fix|month of mole control/i.test(n))) return 'qf';
  return 'other';
};
const otherNames = new Map();
for (const id of jobIds) if (product(id) === 'other') {
  const k = (jobs.get(id)?.items || []).join(' | ') || '(none)';
  otherNames.set(k, (otherNames.get(k) || 0) + 1);
}

// ---- 3. aggregate by month ----
const byMonth = new Map();
for (const v of visits) {
  const m = new Date(v.startAt).toLocaleString('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit' }).slice(0, 7);
  if (!byMonth.has(m)) byMonth.set(m, { all: 0, done: 0, tmcp: 0, qf: 0, other: 0, techs: new Map(), qfJobs: new Set(), tmcpJobs: new Set() });
  const b = byMonth.get(m);
  b.all++;
  if (v.status !== 'COMPLETED') continue;
  b.done++;
  const p = product(v.job);
  b[p]++;
  if (p === 'qf') b.qfJobs.add(v.job);
  if (p === 'tmcp') b.tmcpJobs.add(v.job);
  const who = v.by || 'Unassigned';
  b.techs.set(who, (b.techs.get(who) || 0) + 1);
}

const csv = ['month,all_visits,completed,tmcp,quick_fix,other,tmcp_pct,qf_pct,tmcp_jobs,qf_jobs,techs_20plus,tech_breakdown'];
for (const [m, b] of [...byMonth.entries()].sort()) {
  const t = [...b.techs.entries()].sort((x, y) => y[1] - x[1]);
  const active = t.filter(([, c]) => c >= 20).length;
  csv.push([m, b.all, b.done, b.tmcp, b.qf, b.other,
    b.done ? (100 * b.tmcp / b.done).toFixed(1) : 0, b.done ? (100 * b.qf / b.done).toFixed(1) : 0,
    b.tmcpJobs.size, b.qfJobs.size, active, `"${t.map(([w, c]) => `${w}:${c}`).join('; ')}"`].join(','));
}
fs.writeFileSync(`${OUT}/2026-10-15_visit-mix-seasonality.csv`, csv.join('\n'));
fs.writeFileSync(`${OUT}/2026-10-15_visit-mix-other-items.json`, JSON.stringify([...otherNames.entries()].sort((a, b) => b[1] - a[1]), null, 2));
fs.writeFileSync(`${OUT}/2026-10-15_visit-mix-raw.json`, JSON.stringify({ visits, jobs: [...jobs.entries()] }));
console.log(csv.join('\n'));
console.log(`\nvisits: ${visits.length}  jobs: ${jobIds.length}  (missing job lookups: ${jobIds.length - jobs.size})`);
console.log('top "other" line items:', [...otherNames.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12));
