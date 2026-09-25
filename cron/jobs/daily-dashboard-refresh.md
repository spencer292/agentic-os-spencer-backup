---
name: Daily Dashboard Refresh
time: '05:00'
days: mon,tue,wed,thu,fri,sat,sun
active: 'true'
model: haiku
notify: never
description: 'Re-pulls the daily check-in numbers from Jobber + CallRail and rewrites dashboard.html so Spencer opens a fresh page every morning. READ-ONLY against Jobber.'
timeout: 25m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Task: refresh Spencer's daily check-in dashboard so it is current before he opens it.

## Run

From the repo root, both commands, in order:

```
node projects/briefs/daily-dashboard/scripts/pull-dashboard-data.mjs
node projects/briefs/daily-dashboard/scripts/render-dashboard.mjs
```

The pull takes 3-6 minutes and self-throttles against Jobber's leaky bucket — let it finish, do
not re-run it in parallel. The render is instant and rewrites both
`projects/briefs/daily-dashboard/dashboard.html` and the Desktop copy `Got-Moles-Daily.html`.

That is the whole job.

## Rules

- **READ-ONLY.** Neither script sends a mutation to Jobber and neither should ever be given one.
  This job must never create, edit, move or archive a visit, job, quote, client or invoice.
- It runs every day including weekends. Got Moles does not work weekends, so a Saturday page
  showing zero visits is correct, not a failure.
- Do not pass any arguments. There are none.

## Report

One line only, and only if something is wrong. On success, say nothing beyond a short confirmation
with today's headline: calls, missed, visits done/scheduled, projected month.

## What "looks off" means here

- **`Jobber token refresh failed HTTP 401`** — the refresh token has expired. This needs a browser
  and only Spencer can do it: `node .claude/skills/tool-jobber/scripts/jobber-api.mjs auth`. Say so
  plainly; do not retry the pull, it cannot succeed.
- **`CallRail 400`** — the call window reached before the account's data floor (2026-04-30). Report
  it; the Jobber half of the page is still valid.
- **A metric that is zero when it should not be** (0 active TMCP jobs, $0 invoiced month-to-date
  mid-month) usually means a Jobber sweep was throttled and returned short. Re-run once; if it
  repeats, report it rather than papering over it.
- **A projected month wildly outside the last three months** shown on the page. The projection is
  built from the shape of completed months, so a large miss means the reference months are wrong,
  not that the business changed overnight.
- Lumpy daily invoicing is **normal** — TMCP bills in batches, so single days of $50K+ next to days
  of $0 are expected. Do not flag it.
