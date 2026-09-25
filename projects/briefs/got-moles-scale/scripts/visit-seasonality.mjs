// Completed field visits per month — the seasonal capacity curve.
// Answers: when does the field board actually shrink?
import fs from 'node:fs';
import { gql, sleep, ptDayBoundsUtc } from '../../jobber-notes-automation/catch-tally/jb.mjs';

const FROM = process.argv[2] || '2024-09-01';
const TO   = process.argv[3] || '2026-09-01';
const { after } = ptDayBoundsUtc(FROM);
const { before } = ptDayBoundsUtc(TO);

const byMonth = new Map();   // 'YYYY-MM' -> { all, completed, techs:Map }
let cursor = null, page = 0, total = 0;
for (;;) {
  page++;
  const a = cursor ? `, after: "${cursor}"` : '';
  const d = await gql(`query { visits(first: 100${a}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
    pageInfo { hasNextPage endCursor }
    nodes { startAt visitStatus completedBy } } }`);
  const v = d.visits;
  for (const n of v.nodes) {
    total++;
    const m = new Date(n.startAt).toLocaleString('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit' }).slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, { all: 0, completed: 0, techs: new Map() });
    const b = byMonth.get(m);
    b.all++;
    if (n.visitStatus === 'COMPLETED') {
      b.completed++;
      const who = n.completedBy || 'Unassigned';
      b.techs.set(who, (b.techs.get(who) || 0) + 1);
    }
  }
  if (page % 25 === 0) process.stderr.write(`page ${page}: ${total} visits\n`);
  if (!v.pageInfo.hasNextPage) break;
  cursor = v.pageInfo.endCursor;
  await sleep(120);
}

const rows = [...byMonth.entries()].sort();
const out = ['month,all_visits,completed,active_techs,completed_per_tech'];
for (const [m, b] of rows) {
  const active = [...b.techs.entries()].filter(([, c]) => c >= 20).length;
  out.push(`${m},${b.all},${b.completed},${active},${active ? (b.completed / active).toFixed(0) : 0}`);
}
fs.writeFileSync('C:/Agentic-os-got-moles/projects/briefs/got-moles-scale/data/visit-seasonality.csv', out.join('\n'));
console.log(out.join('\n'));
console.log(`\ntotal visits scanned: ${total}`);
