---
name: Route Ready Ads Budget Guard
time: '08:00'
days: daily
active: 'true'
model: haiku
notify: on_failure
description: 'Route Ready (zero-touch-business): daily enforcement of the $75/mo ad-spend policy cap. Pauses campaign 24059425574 the day month-to-date spend hits $75, re-enables on the 1st of the next month. Created 2026-07-26 when the daily budget went $2.47 -> $8.00 (the campaign had 0 impressions in 3 days at the old price) — at $8/day the monthly cap can burn in ~9 days and ztb-ads-manager (Tue only) is too coarse to hold it.'
timeout: 10m
retry: '1'
---
You are running as a scheduled job for Agentic OS: the Route Ready ads budget guard.

Context: `projects/briefs/zero-touch-business/brief.md`. The experiment's total budget is ~$100-150/mo including ad spend; the ad portion is capped at **$75/month** as a policy (Google Ads does not enforce this itself — a $8.00/day budget can bill up to ~$243/mo without this guard).

0. Gate: `.env` must contain the namespaced `ROUTE_READY_ADS_*` creds. NEVER use the generic `GOOGLE_ADS_*` keys — those are the Got Moles account. If creds are missing, report "ads account not set up" and stop.

1. Run `node projects/briefs/zero-touch-business/scripts/rr-budget-guard.mjs` from the repo root.

   The script is idempotent and self-reporting. It returns one of:
   - `OK` — month-to-date spend under 80% of cap. Nothing to do.
   - `WARNING_NEAR_CAP` — spend at 80%+ of cap. No mutation; flag the remaining runway.
   - `PAUSED_AT_CAP` — spend hit $75; the campaign was paused. This is the designed behavior, not a failure.
   - `NEW_MONTH_RESUME` — new month, cap reset, a guard-paused campaign was re-enabled.
   - `SKIPPED` / `ERROR` — report verbatim.

2. Append a one-line entry to `projects/briefs/zero-touch-business/runs/ads-log.md` ONLY when the status is `PAUSED_AT_CAP`, `NEW_MONTH_RESUME`, or `ERROR`. Do not log routine `OK` days — the log is for state changes.

3. Report the JSON summary line (status, spentUsd, remainingUsd, daysOfRunwayLeft, campaignStatus, action).

Rules:
- The only mutations permitted are campaign status ENABLED <-> PAUSED on campaign 24059425574, and only via this script's own logic. Do not change budgets, bids, keywords, or ads — that is `ztb-ads-manager`'s job.
- Never raise the cap. If Spencer wants a different cap, he changes `CAP_USD` in the script.
