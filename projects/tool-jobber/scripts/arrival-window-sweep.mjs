// Weekly safety net: ensure every Jobber job with timed visits in the next
// 14 days carries the standard 3-hour arrival window, so client notifications
// show a window instead of an exact route-ETA time.
// Reads are free; the only mutation is jobEdit { arrivalWindow }, pre-approved
// by Spencer 2026-07-20 (3-hour standard).
// Run from the repo root: node projects/tool-jobber/scripts/arrival-window-sweep.mjs

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const API = '.claude/skills/tool-jobber/scripts/jobber-api.mjs';
const WINDOW_MIN = 180;
const DAYS_AHEAD = 14;
const BATCH = 20;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aw-sweep-'));
function gql(query) {
  const f = path.join(tmp, 'q.graphql');
  fs.writeFileSync(f, query);
  return execSync(`node ${API} query "${f}"`, { encoding: 'utf8', cwd: process.cwd() });
}
function gqlJson(query) {
  const out = gql(query);
  const i = out.indexOf('{');
  if (i < 0 || /GraphQL errors/.test(out)) throw new Error('query failed: ' + out.slice(0, 300));
  return JSON.parse(out.slice(i));
}

const now = new Date();
const end = new Date(now.getTime() + DAYS_AHEAD * 86400e3);

// 1. Collect timed visits missing arrival windows
let cursor = null;
const jobIds = new Set();
let scanned = 0;
for (let page = 0; page < 40; page++) {
  const d = gqlJson(`query {
    visits(first: 50${cursor ? `, after: "${cursor}"` : ''},
      filter: { startAt: { after: "${now.toISOString()}", before: "${end.toISOString()}" } }) {
      nodes { id allDay arrivalWindow { duration } job { id } }
      pageInfo { endCursor hasNextPage }
    }
  }`);
  const v = d.visits;
  scanned += v.nodes.length;
  v.nodes.forEach(n => {
    if (!n.allDay && !n.arrivalWindow && n.job) jobIds.add(n.job.id);
  });
  if (!v.pageInfo.hasNextPage) break;
  cursor = v.pageInfo.endCursor;
}

const ids = [...jobIds];
console.log(`Scanned ${scanned} visits over next ${DAYS_AHEAD} days.`);
if (ids.length === 0) {
  console.log('No jobs missing arrival windows. Nothing to do.');
  process.exit(0);
}
console.log(`${ids.length} job(s) missing arrival windows — applying ${WINDOW_MIN}-minute window.`);

// 2. Apply in aliased batches; on a batch error fall back to per-job edits
function editBatch(list) {
  const body = list.map((id, k) =>
    `m${k}: jobEdit(jobId: "${id}", input: { arrivalWindow: { durationInMinutes: ${WINDOW_MIN} } }) { job { jobNumber } userErrors { message } }`
  ).join('\n');
  return gql(`mutation {\n${body}\n}`);
}

let ok = 0, failed = [];
for (let i = 0; i < ids.length; i += BATCH) {
  const chunk = ids.slice(i, i + BATCH);
  const out = editBatch(chunk);
  if (/GraphQL errors/.test(out)) {
    // batch voided — retry one by one so a single dead job can't sink the rest
    for (const id of chunk) {
      const single = editBatch([id]);
      if (/GraphQL errors|userErrors":\s*\[\s*{/.test(single)) failed.push(id);
      else ok++;
    }
  } else {
    ok += (out.match(/"jobNumber"/g) || []).length;
    const errs = (out.match(/"message"/g) || []).length;
    if (errs) failed.push(`${errs} userError(s) in batch at offset ${i}`);
  }
}

console.log(`Applied ${WINDOW_MIN}-min arrival window to ${ok}/${ids.length} jobs.`);
if (failed.length) {
  console.log(`FAILED (${failed.length}):`);
  failed.forEach(f => console.log('  !! ' + f));
  process.exit(1);
}
