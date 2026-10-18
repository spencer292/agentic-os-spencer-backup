// tmcp-churn.mjs — read-only. Client-level TMCP churn from the saved audit snapshots.
// A client "churned" between two snapshots when they held >=1 live TMCP job in the first and none
// in the second. Job-number turnover alone is NOT churn (a re-created job keeps the client).
// For every departed client, asks Jobber what happened to their jobs and whether the client is
// tagged `TMCP Churned` (tag hygiene), so a closed-but-untagged client shows up.
// Usage: node projects/tool-jobber/scripts/tmcp-churn.mjs [YYYY-MM-DD end] [YYYY-MM-DD start]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const dataDir = path.resolve(here, '..', 'data');
const API = path.join(root, '.claude', 'skills', 'tool-jobber', 'scripts', 'jobber-api.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tmcp-churn-'));

function gql(query) {
  const f = path.join(tmp, 'q.graphql');
  fs.writeFileSync(f, query);
  let out;
  try { out = execSync(`node "${API}" query "${f}"`, { encoding: 'utf8', cwd: root, maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { out = String(e.stdout || e.message); }
  const i = out.indexOf('{');
  if (i < 0) throw new Error(out.slice(0, 300));
  return JSON.parse(out.slice(i));
}

// Only billing-audit snapshots share one schema (08-18 is the older tag-audit shape).
const snaps = fs.readdirSync(dataDir)
  .filter((f) => /_tmcp-jobs\.jsonl$/.test(f) && fs.existsSync(path.join(dataDir, f.replace('jobs.jsonl', 'billing-audit.json'))))
  .map((f) => f.slice(0, 10)).sort();
const END = process.argv[2] || snaps.at(-1);
const START = process.argv[3] || snaps[0];
const load = (d) => fs.readFileSync(path.join(dataDir, `${d}_tmcp-jobs.jsonl`), 'utf8')
  .split('\n').filter(Boolean).map((l) => JSON.parse(l));
const byClient = (rows) => rows.reduce((m, r) => {
  const c = m.get(r.clientId) || { client: r.client, jobs: [], monthly: 0 };
  c.jobs.push(r.job); c.monthly += r.monthly || 0; m.set(r.clientId, c); return m;
}, new Map());
const dayDiff = (a, b) => (new Date(b) - new Date(a)) / 86400000;

// Interval table across every consecutive snapshot pair inside [START, END].
const inRange = snaps.filter((d) => d >= START && d <= END);
const intervals = [];
for (let i = 1; i < inRange.length; i++) {
  const a = byClient(load(inRange[i - 1])), b = byClient(load(inRange[i]));
  const lost = [...a.keys()].filter((k) => !b.has(k));
  const gained = [...b.keys()].filter((k) => !a.has(k));
  intervals.push({ from: inRange[i - 1], to: inRange[i], days: dayDiff(inRange[i - 1], inRange[i]),
    startClients: a.size, endClients: b.size, lost: lost.length, gained: gained.length,
    lostMrr: +lost.reduce((s, k) => s + a.get(k).monthly, 0).toFixed(2) });
}

// Whole window: clients present at START and gone at END (a client who left and came back is not churn).
const A = byClient(load(START)), B = byClient(load(END));
const departed = [...A.entries()].filter(([k]) => !B.has(k));
const days = dayDiff(START, END);
const lostMrr = departed.reduce((s, [, c]) => s + c.monthly, 0);
const startMrr = [...A.values()].reduce((s, c) => s + c.monthly, 0);
const periodRate = departed.length / A.size;
const monthlyRate = 1 - Math.pow(1 - periodRate, 30.44 / days);

// What happened to each departed client's jobs, and are they tagged correctly now?
const detail = [];
for (const [id, c] of departed) {
  let info = null;
  try {
    info = gql(`query { client(id: "${id}") { name isArchived tags(first: 25) { nodes { label } }
      jobs(first: 20) { nodes { jobNumber jobStatus completedAt endAt
        lineItems(first: 10) { nodes { name } } } } } }`).client;
  } catch (e) { info = { error: String(e.message).slice(0, 120) }; }
  const tags = (info?.tags?.nodes || []).map((t) => t.label);
  const jobs = (info?.jobs?.nodes || []).filter((j) => c.jobs.includes(j.jobNumber));
  detail.push({ client: c.client, clientId: id, jobs: c.jobs, monthly: +c.monthly.toFixed(2),
    jobState: jobs.map((j) => `#${j.jobNumber} ${j.jobStatus}${j.completedAt ? ' closed ' + j.completedAt.slice(0, 10) : ''}`),
    clientArchived: info?.isArchived ?? null,
    taggedChurned: tags.includes('TMCP Churned'), taggedActive: tags.includes('TMCP - Active'), tags });
}

const report = {
  window: { start: START, end: END, days },
  startClients: A.size, endClients: B.size, departed: departed.length,
  newClients: [...B.keys()].filter((k) => !A.has(k)).length,
  periodChurnPct: +(periodRate * 100).toFixed(2),
  monthlyChurnPct: +(monthlyRate * 100).toFixed(2),
  annualizedChurnPct: +((1 - Math.pow(1 - monthlyRate, 12)) * 100).toFixed(1),
  startMrr: +startMrr.toFixed(2), lostMrr: +lostMrr.toFixed(2),
  monthlyRevenueChurnPct: +((1 - Math.pow(1 - lostMrr / startMrr, 30.44 / days)) * 100).toFixed(2),
  departedTagHygiene: {
    taggedChurned: detail.filter((d) => d.taggedChurned).length,
    stillTaggedActive: detail.filter((d) => d.taggedActive).length,
    untagged: detail.filter((d) => !d.taggedChurned && !d.taggedActive).length,
  },
  intervals, departedDetail: detail.sort((a, b) => b.monthly - a.monthly),
};
const out = path.join(dataDir, `${END}_tmcp-churn.json`);
fs.writeFileSync(out, JSON.stringify(report, null, 2));
const { intervals: _i, departedDetail: _d, ...head } = report;
console.log(JSON.stringify(head, null, 2));
console.log(`\nfull report -> ${out}`);
