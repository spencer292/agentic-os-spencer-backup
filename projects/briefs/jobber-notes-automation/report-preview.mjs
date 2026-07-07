// report-preview.mjs — READ-ONLY. Shows the custom-field values the automation WOULD write
// for each job visited on a given date, straight from the notes. Creates/writes nothing.
// Usage (from repo root): node projects/briefs/jobber-notes-automation/report-preview.mjs [--date=YYYY-MM-DD] [--jobs=40]

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseNote } from './parse-note.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBBER = path.resolve(__dirname, '../../../.claude/skills/tool-jobber/scripts/jobber-api.mjs');
const argv = process.argv.slice(2);
const arg = k => (argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const DATE = arg('date') || new Date().toISOString().slice(0, 10);
const JOBS_N = +arg('jobs') || 40;

function gql(q) {
  const out = execFileSync('node', [JOBBER, 'query', q], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (/GraphQL errors/i.test(out)) throw new Error(out.trim());
  const j = JSON.parse(out.slice(out.indexOf('{')));
  return j.data || j;
}
const localDate = s => String(s).slice(0, 10);

const jobs = gql(`query { jobs(first: ${JOBS_N}) { nodes {
  jobNumber client { name }
  notes(first: 50) { nodes { __typename ... on JobNote { message createdAt } } }
} } }`).jobs.nodes;

const rows = [];
for (const j of jobs) {
  const notes = (j.notes.nodes || []).filter(n => n.__typename === 'JobNote' && n.message);
  if (!notes.length) continue;
  const latest = notes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  if (localDate(latest.createdAt) !== DATE) continue;
  const p = parseNote(latest.message);
  const totalCaught = notes.reduce((s, n) => s + (parseNote(n.message).moles || 0), 0);
  rows.push({
    job: j.jobNumber, client: j.client?.name || '(no client)',
    fields: {
      'Latest Activity': p.activity || '—',
      'Moles Caught (last visit)': p.moles ?? '—',
      'Misses (last visit)': p.misses ?? '—',
      'Trap Inventory': p.inventoryStr || '—',
      'Next Action': p.nextAction || '—',
      'Customer Shown': p.customerShown ? 'Yes' : 'No',
      'onX Mapped': p.onX ? 'Yes' : 'No',
      'Total Caught': totalCaught,
    },
    raw: latest.message.replace(/\s*\n\s*/g, ' / ').trim(),
  });
}

console.log(`\nREPORT PREVIEW — custom-field values the automation WOULD write — visits completed ${DATE}`);
console.log(`(${rows.length} jobs; READ-ONLY, nothing created)\n`);

// compact table
const H = ['Job', 'Client', 'Activity', 'Moles', 'Miss', 'Next Action', 'Cust', 'onX', 'Trap Inventory'];
console.log(H.join(' | '));
console.log('—'.repeat(90));
for (const r of rows) {
  const f = r.fields;
  console.log([
    r.job, r.client.slice(0, 20).padEnd(20), String(f['Latest Activity']).padEnd(8),
    String(f['Moles Caught (last visit)']).padEnd(5), String(f['Misses (last visit)']).padEnd(4),
    String(f['Next Action']).padEnd(20), f['Customer Shown'].padEnd(3), f['onX Mapped'].padEnd(3),
    f['Trap Inventory'].slice(0, 40),
  ].join(' | '));
}

// two full-detail examples: literal field:value the automation would set
console.log('\n\nEXAMPLE — exactly what gets written to two jobs (field : value):\n');
for (const r of rows.slice(0, 2)) {
  console.log(`■ Job ${r.job} — ${r.client}`);
  console.log(`  note: "${r.raw}"`);
  for (const [k, v] of Object.entries(r.fields)) console.log(`    ${k.padEnd(26)} → ${v}`);
  console.log();
}
