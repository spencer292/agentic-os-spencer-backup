---
name: Jobber Visit Notes Automation (daily)
time: '18:15'
days: daily
active: 'true'
model: haiku
notify: on_finish
description: 'Daily Got Moles visit-note scheduling review: dry-runs the follow-up scheduling engine for review. The REPORT half moved to n8n (workflow 2dxtg73X1JUvLUTr, daily 18:00 PT, activated 2026-07-10) — do NOT run report-sync here, it would double-write.'
timeout: 15m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Read CLAUDE.md for system context. See `projects/briefs/jobber-notes-automation/brief.md`
for the full rules.

NOTE (2026-07-10): the report sync (Job Custom Fields from notes) now runs server-side in
n8n — workflow `2dxtg73X1JUvLUTr`, daily 18:00 PT. Do NOT run `report-sync.mjs` from this
job; that would double-write the same fields. This job is the SCHEDULING REVIEW only.

Scheduling review (DRY-RUN, writes nothing):

1. From the repo root, run:
   `node projects/briefs/jobber-notes-automation/engine.mjs --log`
   (Do NOT pass `--execute`. Saves a plan to `projects/briefs/jobber-notes-automation/runs/`.)
2. Report any `PULL` / `ADD` lines = follow-ups the automation would schedule. Any that the
   techs did not already handle on-site are **missed follow-ups worth checking**. Flag
   `❌ FAIL` or `(none)`/all-blank jobs as parse exceptions.
3. Optionally sanity-check the n8n report run: if asked or if something looks off, the n8n
   execution list for `2dxtg73X1JUvLUTr` shows whether tonight's 18:00 report sync succeeded.

Output a concise summary: the scheduling PULL/ADD/exception rows, pointing to the saved
dry-run log for full detail.

Rules:
- This job is dry-run: never pass `--execute`, never call a visit mutation.
- Never run `report-sync.mjs --write` here — the n8n workflow owns the report now.
- If a Jobber token error occurs, note it and stop — do not retry destructively.
- Keep the summary short and skimmable.
