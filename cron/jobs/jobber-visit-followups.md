---
name: Jobber Visit Notes Automation (daily)
time: '18:00'
days: daily
active: 'true'
model: haiku
notify: on_finish
description: 'Daily Got Moles visit-note automation: writes the Job Custom Field report from notes (LIVE), and dry-runs the follow-up scheduling for review. Report writes are additive; scheduling writes nothing until the gate is flipped.'
timeout: 15m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Read CLAUDE.md for system context. See `projects/briefs/jobber-notes-automation/brief.md`
for the full rules.

This job has two parts. Part 1 WRITES the status report (safe, additive). Part 2 is DRY-RUN
scheduling for review (writes nothing).

Part 1 — Report sync (LIVE):

1. From the repo root, run:
   `node projects/briefs/jobber-notes-automation/report-sync.mjs --write`
2. This reads each job visited today and writes its 8 Job Custom Fields from the latest note.
3. Note the count written and any lines with `❌` (a write that failed — usually a dropdown
   option mismatch) or `⚠` (a custom field missing on a job). Flag those; do not retry blindly.

Part 2 — Scheduling review (DRY-RUN, writes nothing):

4. From the repo root, run:
   `node projects/briefs/jobber-notes-automation/engine.mjs --log`
   (Do NOT pass `--execute`. Saves a plan to `projects/briefs/jobber-notes-automation/runs/`.)
5. Report any `PULL` / `ADD` lines = follow-ups the automation would schedule. During the review
   phase these are usually already handled on-site by the tech; any that are NOT are **missed
   follow-ups worth checking**. Flag `❌ FAIL` or `(none)`/all-blank jobs as parse exceptions.

Output a concise summary: report jobs written, any report errors, and the scheduling PULL/ADD/
exception rows. Point to the saved dry-run log for full detail.

Rules:
- Part 1 (report) writes custom fields only — never quotes, invoices, or visits.
- Part 2 (scheduling) is dry-run: never pass `--execute`, never call a visit mutation.
- If a Jobber token error occurs, note it and stop — do not retry destructively.
- Keep the summary short and skimmable.
