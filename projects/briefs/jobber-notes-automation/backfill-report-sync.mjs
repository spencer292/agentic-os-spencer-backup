#!/usr/bin/env node
// One-off repair: replay report-sync for the nights the n8n report workflow failed.
//
// Context: n8n workflow 2dxtg73X1JUvLUTr ran the Job Custom Field report nightly from
// 2026-07-10 until its Jobber OAuth credential died. Every run from ~2026-07-24 onward
// failed with "The provided refresh token is not valid", so the report fields have been
// stale since then. The workflow was deactivated 2026-08-04 and the sync moved back into
// cron/jobs/jobber-visit-followups.md. This script repairs the gap in between.
//
// ASCENDING date order is load-bearing. Job custom fields hold CURRENT state, not
// per-date history, so a job visited more than once in the window must end on its LATEST
// visit's values. Running descending would leave older data on top.
//
// Re-running a date is safe: values are derived deterministically from the same visit
// notes, so a already-correct date is rewritten with identical values.
//
// Usage (from repo root) — --confirm is required, there is no dry-run default here
// because report-sync.mjs itself is dry-run unless passed --write:
//   node projects/briefs/jobber-notes-automation/backfill-report-sync.mjs --confirm
//   node projects/briefs/jobber-notes-automation/backfill-report-sync.mjs --confirm --from=2026-07-24 --to=2026-08-03
//   node projects/briefs/jobber-notes-automation/backfill-report-sync.mjs --dry-run   # preview only, writes nothing
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');
const SCRIPT = 'projects/briefs/jobber-notes-automation/report-sync.mjs';
const RUNS = path.join(HERE, 'runs');

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const DRY = argv.includes('--dry-run');
const CONFIRM = argv.includes('--confirm');
const FROM = arg('from', '2026-07-24');
const TO = arg('to', '2026-08-03');

if (!CONFIRM && !DRY) {
  console.error('Refusing to run: this writes to live Jobber job records.');
  console.error('Pass --confirm to apply, or --dry-run to preview.');
  process.exit(1);
}

const dates = [];
{
  const [fy, fm, fd] = FROM.split('-').map(Number);
  const end = TO;
  for (const d = new Date(Date.UTC(fy, fm - 1, fd)); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    dates.push(iso);
    if (iso >= end) break;
    if (dates.length > 400) break; // guard against a malformed range
  }
}

fs.mkdirSync(RUNS, { recursive: true });
const LOG = path.join(RUNS, `${new Date().toISOString().slice(0, 10)}-backfill.log`);
const say = (s) => { console.log(s); fs.appendFileSync(LOG, s + '\n'); };

say(`=== report-sync backfill ${DRY ? 'DRY RUN' : '⚡ WRITE'} started ${new Date().toISOString()} ===`);
say(`dates: ${dates[0]} .. ${dates[dates.length - 1]} (${dates.length}), ascending`);

let totalWrote = 0;
let failures = 0;

for (const date of dates) {
  const args = [SCRIPT, `--date=${date}`];
  if (!DRY) args.push('--write');
  try {
    const out = execFileSync(process.execPath, args, {
      cwd: ROOT, maxBuffer: 40e6, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 900000,
    });
    const lines = out.trim().split('\n').filter(Boolean);
    const last = lines.pop() || '(no output)';
    const errs = out.split('\n').filter((l) => /userError|!! /i.test(l));
    const m = last.match(/Wrote (\d+) jobs/);
    if (m) totalWrote += Number(m[1]);
    say(`${date}  ${last.trim()}${errs.length ? `  [${errs.length} error line(s)]` : ''}`);
    for (const e of errs.slice(0, 5)) say(`    ${e.trim()}`);
  } catch (err) {
    failures++;
    const detail = (err.stderr || err.stdout || err.message || '').toString().trim().split('\n').slice(-3).join(' | ');
    say(`${date}  !! FAILED: ${detail.slice(0, 400)}`);
    // A dead token would fail identically for every remaining date — stop rather than
    // hammer it, and leave the rest of the window for a retry after re-auth.
    if (/refresh token|401|Authorization|invalid_grant/i.test(detail)) {
      say('!! Jobber auth failed — stopping. Re-auth with:');
      say('   node .claude/skills/tool-jobber/scripts/jobber-api.mjs auth');
      break;
    }
  }
}

say(`=== finished ${new Date().toISOString()} — ${totalWrote} job writes, ${failures} failed date(s) ===`);
say(`log: ${LOG}`);
process.exit(failures ? 1 : 0);
