---
project: daily-dashboard
status: active
level: 2
created: 2026-09-02
---

# Daily Dashboard — Spencer's morning check-in

## Goal

One HTML file Spencer opens every morning that answers "what is going on in my business today"
without him having to log into Jobber, CallRail, Ninety or a spreadsheet. Local file, works
offline, refreshed automatically before he wakes up.

## Deliverables

| File | What it is |
|---|---|
| `scripts/pull-dashboard-data.mjs` | Read-only pull from Jobber + CallRail → `data/dashboard.json` |
| `scripts/render-dashboard.mjs` | `data/dashboard.json` → self-contained `dashboard.html` + Desktop copy |
| `Refresh-Dashboard.bat` | Double-click: re-pull, re-render, open |
| `../../../cron/jobs/daily-dashboard-refresh.md` | 05:30 daily cron that runs both scripts |

## What is on the page

Requested by Spencer, in his order: phone calls, visits, total mole control jobs, missed calls,
answered calls, quotes sent, projected income for the month. Then the four he added:
money at risk, TMCP health, close rate by person, today's field board — plus Quick Fix jobs past
5 visits.

Every metric is shown four ways: **today / yesterday / week to date / month to date**, so a number
carries its own context. Week starts Sunday, matching the Ninety scorecard.

## Where the numbers come from

- **CallRail** (`calls.json`, inbound only) — total, answered, missed, answer rate, by hour.
- **Jobber GraphQL, read-only** — invoices (revenue), quotes (`sentAt` / `transitionedAt` +
  `salesperson`), visits (`isComplete` + `assignedUsers`), clients, recurring jobs
  (`lineItems` + `visits.totalCount`), past-due invoices.

**Metric definitions are copied from `projects/briefs/got-moles-scale/scripts/ninety-weekly-push.mjs`
on purpose** — the same TMCP 45-day guard, the same archived-job exclusion, the same
`$25–400 max line item` rule for monthly rate, the same product regexes. The dashboard and the
Ninety board must never be able to disagree about the same week.

## Decisions

- **The dashboard cannot call the APIs itself.** An HTML file on a PC would have to carry the
  CallRail and Jobber credentials in plain text, and both APIs refuse browser-origin requests
  anyway. So a script bakes the numbers in and the page is static. This is why there is a cron and
  a .bat rather than a "reload" button.
- **The projection is shape-based, not pace-based.** First build extrapolated the daily invoicing
  pace and projected **$411,753** for September on day 2 — against real months of $78K / $99K /
  $109K. Cause: Got Moles bills in batches (2026-08-31 alone invoiced $56,361; the two days before
  it were $0), so "fraction of the month billed" has almost nothing to do with "fraction of the
  month elapsed". The projection now measures how a month actually fills up across the last three
  completed months and adds the typical remainder to what is already billed. It is stable on day 1
  and converges on the real number by month end.
- **Three projection segments, none overlapping** — invoiced (fact), recurring still to bill
  (estimate), everything else to come (estimate). Each carries a `known` / `estimate` tag on the
  page, per the CFO-seat rule that every figure states how solid it is.
- **Close rate is credited to the Jobber `salesperson` field**, which is quote-assignment, not who
  answered the phone. A job booked on the call with no quote never appears — noted on the page so
  the number is not misread. This is the known Spencer-vs-Muhammad artifact.
- **Quick Fix overrun counts visits, not weeks.** `visits.totalCount > 5` on an unarchived Quick
  Fix job. Nothing in Jobber gates the 5-week series, so these accumulate silently; each one is a
  sales decision (add a visit, or sell a month / TMCP), never an automatic add.
- **Charts are inline SVG with no library.** The file has to work offline from a double-click and
  keep working if this repo moves. Palette is the validated data-viz default — adjacent-pair CVD
  and normal-vision floors cleared in both light and dark. Do not swap hexes without re-running
  `scripts/validate_palette.js`.

## Constraints

- Read-only against Jobber, always. This project must never gain a mutation.
- The pull takes 3-6 minutes (Jobber's leaky-bucket rate limit). Do not parallelise the sweeps.
- CallRail has no calls on this account before 2026-04-30; earlier dates are a hard 400.

## Open threads

- The Desktop copy is written by the render script. If Spencer wants it somewhere else, that is one
  line in `render-dashboard.mjs`.
- Not included yet: Google Ads spend / cost per booked job (needs the `ops-google-ads` lane),
  review count (needs the GBP scraper), and route drift. Each is a bolt-on to the same JSON.
