---
name: Ninety Scorecard Weekly Push (Mondays)
time: '05:30'
days: mon
active: 'true'
model: sonnet
notify: on_finish
description: 'Computes the Got Moles weekly scorecard from Jobber + CallRail and pushes it to the Ninety.io Leadership board. Re-pushes the last 3 completed weeks so late-arriving data self-heals, refreshes point-in-time past-due, and derives TMCP churn from the week-over-week "TMCP Churned" tag snapshot.'
timeout: 30m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Read CLAUDE.md for system context. Full background: `projects/briefs/got-moles-scale/2026-07-26_ninety-52week-backfill.md`
and the KPI mapping in `projects/briefs/got-moles-scale/scripts/ninety-kpi-map.json`.

This job exists because the scorecard died of manual data entry once already — at the 2026-07-22
audit, 28 of 41 weekly KPIs had never been scored and the maintained ones had all stopped four
weeks earlier. History back to 2025-07-28 was backfilled on 2026-07-26; this job keeps it alive.

## Run

From the repo root:

```
node projects/briefs/got-moles-scale/scripts/ninety-weekly-push.mjs
```

That is the whole job. Do **not** pass `--from`, `--to`, or `--include-current` on the scheduled
run — the defaults are deliberate:

- It pushes the **last 3 completed weeks**, not just one. Jobber invoices, completions, and quote
  transitions land late, so re-pushing recent weeks self-heals numbers that were incomplete when
  first written. The Ninety score POST is create-or-update per (kpi, week), so re-pushing is safe.
- It deliberately does **not** push the in-progress week. On a Monday that week is one day old, and
  pushing it would put near-zero values on the board that only correct themselves next week.
- `--cache` is for interactive re-runs only. The cron must always pull fresh.

## Report

Summarize, in a few lines:

1. The week range pushed, `pushed=` count, and `failed=` count from the final line.
2. The TMCP tag line: clients tagged "TMCP - Active", clients tagged "TMCP Churned", and the churn
   delta if one was computed.
3. Anything that looks off — see below.

Full detail is written to `projects/briefs/got-moles-scale/scorecard-runs/{timestamp}.json` and a
one-line entry in `runs.log`. Point at those rather than pasting the whole table.

## What "looks off" means here

- **Any `failed=` above 0.** Each failure names the metric and week. Report them; do not retry the
  whole run to paper over one bad POST.
- **A week of all-zeros** in the middle of the range — that usually means a Jobber sweep was
  throttled and returned short, not that the business stopped.
- **`total_revenue` is genuinely lumpy** — $40–70K month-end weeks against small mid-month weeks is
  normal TMCP batch invoicing, not an error. Do not flag it.
- **`tmcp_active` moving down** is notable and worth calling out — the job-derived series has almost
  no churn in it, so a decline is unusual.
- **A large churn delta** (say 5+ in one week) is worth surfacing prominently.

## Rules

- **Read-only against Jobber and CallRail. The only writes are Ninety scores and notes.** Never call
  a Jobber mutation from this job.
- **Never invent a number.** If a pull fails, report the failure — do not estimate, and do not push
  a value the script did not compute.
- **Do not edit `ninety-kpi-map.json` from this job.** Enabling a KPI, adding an id, or changing a
  `dataFloor` is a human decision made in a working session.
- If `NINETY_API_TOKEN`, `CALLRAIL_API_KEY`, or the `JOBBER_*` credentials are missing or rejected,
  stop and report it. A silent partial push is worse than a visible failure.
- Model note: this job is `sonnet`, not the `opus` field-ops floor, because it makes **no writes to
  live Jobber or OptimoRoute state** — Jobber is read-only here and the computation is fully
  deterministic inside the script. The model runs it and interprets the output. If this job is ever
  extended to write back to Jobber, it moves to `opus`.

## Known limitations (do not try to "fix" these at runtime)

- **Phone Calls / Missed Calls** only exist from 2026-05-18 (CallRail has no data before 2026-04-30).
  **Quick Fix** metrics only from 2026-01-19 (the line item did not exist in Jobber before then).
  Earlier weeks are intentionally left blank via `dataFloor`, and hold Spencer's manual entries.
- **TMCP Cancellations comes from a tag snapshot delta, not a Jobber date.** Jobber's `Tag` type is
  `{id, label}` with no timestamp, so churn cannot be dated or backfilled. Each run snapshots the
  count to `data/tmcp-tag-snapshots.json` and attributes the delta to the week the *previous*
  snapshot was taken in. If the snapshot file is deleted, the next run silently restarts the
  baseline and pushes no churn — that is intended, not a bug to work around.
- **`Total TMCP Jobs active` overstates.** A cancelled recurring job keeps a future `endAt` in
  Jobber, so the series has almost no churn in it. Each run writes a note on that KPI comparing it
  to the client-tag count for exactly this reason.
