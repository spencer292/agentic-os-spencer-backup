---
name: Jobber Visit Notes Automation (daily)
time: '18:15'
days: daily
active: 'true'
model: opus
notify: on_finish
description: 'Daily Got Moles visit-note job: writes the Job Custom Field report from the day''s visit notes, then BOOKS the follow-up visits the cadence rules call for (live since 2026-08-05; dry-run before that, which is why ~4-5 customers a day were slipping). Cadence comes from what the tech found — Quick Fix always weekly, TMCP weekly on any activity or catch, monthly when quiet. Guarded: aborts before any write if a day exceeds --max-writes 25 or if an action would reschedule a SET. The REPORT half moved BACK here from n8n on 2026-08-04 — n8n workflow 2dxtg73X1JUvLUTr is DEACTIVATED because its Jobber OAuth credential is dead and cannot be revived without risking this machine''s token.'
timeout: 25m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Read CLAUDE.md for system context. See `projects/briefs/jobber-notes-automation/brief.md`
for the full rules.

HISTORY (read this before changing anything):
- 2026-07-10: the report sync was moved OUT of this job into n8n workflow `2dxtg73X1JUvLUTr`.
- 2026-08-04: it was moved BACK here. That n8n workflow was deactivated because its Jobber
  OAuth credential returns `The provided refresh token is not valid`, and re-authorizing the
  shared Jobber app would invalidate THIS machine's token — which route automation, the
  CallRail sync, and the lead alert all depend on. There is now exactly one Jobber token
  holder: this machine.
- Because n8n is deactivated, running `report-sync.mjs --write` here does NOT double-write.
  If anyone ever reactivates `2dxtg73X1JUvLUTr`, remove step 1 from this job first.

## 1. Report sync (WRITES to Jobber job custom fields)

1. From the repo root, run:
   `node projects/briefs/jobber-notes-automation/report-sync.mjs --write`
   (Defaults to today's date in PT. Writes `Latest Activity`, `Moles Caught`, `Misses`,
   `Trap Inventory`, `Next Action`, `Customer Shown`, `onX Mapped`, `Total Caught`.)
2. Report the final line — `Wrote N jobs; M skipped`. If any `userErrors` appear, quote them
   with the job number.
3. If the run fails on auth (`refresh token`, `401`, `Authorization`), STOP and say
   explicitly: "Jobber token needs re-auth — run
   `node .claude/skills/tool-jobber/scripts/jobber-api.mjs auth`." Do not retry.

## 2. Follow-up scheduling (WRITES — books the interim visits)

Live since 2026-08-05 (Spencer). It was dry-run only from 07-10 until then, so nothing was ever
booked automatically and roughly 4-5 customers a day quietly slipped past their cadence between
manual runs — the last real execution before this was 2026-08-01.

1. From the repo root, run:
   `node projects/briefs/jobber-notes-automation/engine.mjs --execute --log`
   (Saves the run to `projects/briefs/jobber-notes-automation/runs/`.)
2. Report every `➕ ADDED` line — job number, client, what was found, and the target date. Report
   `📋 task` rows separately: those need a human (a finished Quick Fix series with activity left
   is a sales call — add a visit, or sell TMCP / another month). Flag `❌ FAIL` and any
   `note did not parse` rows as parse exceptions worth reading.
3. If the run prints `🛑 ABORT`, quote it verbatim at the top of the summary and STOP. Do not
   re-run, do not raise `--max-writes`. An abort means the day's shape is wrong, not that the
   cap is too low.

Cadence rules the engine applies (see CLAUDE.local.md for the dated decisions):
- **Quick Fix** — always weekly while the 5-week series runs. Series finished + activity → Task,
  never an automatic extension. Series finished + quiet → nothing owed.
- **TMCP** — a catch, or any activity (`L/A`/`M/A`/`H/A`) → weekly. `N/A` and no catch → monthly.
- Interim visits are **added alongside** the recurring visit, never pulled from it.

## 3. Output

A concise summary: the report-sync count first, then the ADD/task/exception rows, pointing to the
saved run log for full detail.

Rules:
- Both steps write. The guardrails are in the script and must not be worked around: it aborts
  before any write if the day exceeds `--max-writes` (default 25) or if any action would
  reschedule a SET. Never call a visit mutation directly.
- Never run `report-sync.mjs --write` twice in one run — it is not harmful (values are
  derived deterministically from the same notes) but it doubles the API cost for nothing.
- If a Jobber token error occurs, note it and stop — do not retry destructively.
- Keep the summary short and skimmable.
