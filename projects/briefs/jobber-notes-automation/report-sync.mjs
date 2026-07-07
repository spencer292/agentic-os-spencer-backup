// report-sync.mjs — writes the Job Custom Field report from visit notes.
// For each job visited on a date: parse the latest note, resolve that job's custom-field IDs
// (readable without the custom-fields scope), and write values via jobEdit. Dry-run by default.
// Usage (from repo root):
//   node projects/briefs/jobber-notes-automation/report-sync.mjs [--date=YYYY-MM-DD] [--jobs=40] [--write]

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
const WRITE = argv.includes('--write');

function gql(q, attempt = 0) {
  try {
    const out = execFileSync('node', [JOBBER, 'query', q], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (/GraphQL errors/i.test(out)) throw new Error(out.trim());
    return JSON.parse(out.slice(out.indexOf('{'))).data || JSON.parse(out.slice(out.indexOf('{')));
  } catch (e) {
    if (/HTTP 401|Token request failed|ECONNRESET|handle->flags/i.test(e.message || '') && attempt < 3) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500 * (attempt + 1));
      return gql(q, attempt + 1);
    }
    throw e;
  }
}
const localDate = s => String(s).slice(0, 10);
const norm = s => String(s || '').trim();

// Canonical field name -> how to derive its value + which jobEdit value key to use.
// Returns undefined to SKIP a field (leaves the prior value untouched).
const DROPDOWN_NEXT = new Set(['Add visit', '2 weeks', 'Monthly', 'Return visit scheduled', 'Convert to annual']);
function fieldValues(parsed, totalCaught) {
  return {
    'Latest Activity':          parsed.activity ? { valueDropdown: parsed.activity } : undefined,
    'Moles Caught (last visit)': parsed.moles != null ? { valueNumeric: parsed.moles } : undefined,
    'Misses (last visit)':       parsed.misses != null ? { valueNumeric: parsed.misses } : undefined,
    'Trap Inventory':            parsed.inventoryStr ? { valueText: parsed.inventoryStr } : undefined,
    'Next Action':               DROPDOWN_NEXT.has(parsed.nextAction) ? { valueDropdown: parsed.nextAction }
                                  : parsed.nextAction === 'Weekly' ? { valueDropdown: 'Add visit' } : undefined,
    'Customer Shown':            { valueTrueFalse: !!parsed.customerShown },
    'onX Mapped':                { valueTrueFalse: !!parsed.onX },
    'Total Caught':              { valueNumeric: totalCaught },
  };
}

const jobs = gql(`query { jobs(first: ${JOBS_N}) { nodes {
  id jobNumber client { name }
  notes(first: 50) { nodes { __typename ... on JobNote { message createdAt } } }
  customFields {
    __typename
    ... on CustomFieldText { id label }
    ... on CustomFieldNumeric { id label }
    ... on CustomFieldDropdown { id label }
    ... on CustomFieldTrueFalse { id label }
  }
} } }`).jobs.nodes;

let synced = 0, skipped = 0;
console.log(`\nReport sync ${WRITE ? '⚡ WRITE' : '🔍 DRY RUN'} — visits completed ${DATE}\n`);
for (const j of jobs) {
  const notes = (j.notes.nodes || []).filter(n => n.__typename === 'JobNote' && n.message);
  if (!notes.length) continue;
  const latest = notes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  if (localDate(latest.createdAt) !== DATE) continue;

  const parsed = parseNote(latest.message);
  const totalCaught = notes.reduce((s, n) => s + (parseNote(n.message).moles || 0), 0);
  const wanted = fieldValues(parsed, totalCaught);

  // map this job's field labels -> ids
  const byLabel = {};
  for (const f of (j.customFields || [])) byLabel[norm(f.label)] = f.id;

  const edits = [];
  for (const [name, val] of Object.entries(wanted)) {
    if (val === undefined) continue;
    const id = byLabel[name];
    if (!id) { console.log(`  ⚠ ${j.jobNumber} ${j.client?.name}: field "${name}" not found on job`); continue; }
    edits.push({ id, ...val });
  }
  if (!edits.length) { skipped++; continue; }

  const summary = edits.map(e => `${Object.values(e)[1]}`).join(' | ');
  if (WRITE) {
    const cf = edits.map(e => `{ id: "${e.id}", ${Object.entries(e).filter(([k]) => k !== 'id').map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')} }`).join(', ');
    const r = gql(`mutation { jobEdit(jobId: "${j.id}", input: { customFields: [${cf}] }) { userErrors { message } } }`).jobEdit;
    if (r.userErrors?.length) { console.log(`  ❌ ${j.jobNumber} ${j.client?.name}: ${JSON.stringify(r.userErrors)}`); continue; }
    console.log(`  ✅ ${String(j.jobNumber).padEnd(5)} ${(j.client?.name || '').slice(0, 22).padEnd(22)} | ${summary}`);
  } else {
    console.log(`  · ${String(j.jobNumber).padEnd(5)} ${(j.client?.name || '').slice(0, 22).padEnd(22)} | ${summary}`);
  }
  synced++;
}
console.log(`\n${WRITE ? 'Wrote' : 'Would write'} ${synced} jobs; ${skipped} skipped (no fields to set). ${WRITE ? '' : 'Re-run with --write to apply.'}`);
