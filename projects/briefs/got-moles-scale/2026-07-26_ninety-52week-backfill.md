# Ninety Scorecard — 52-Week Backfill to Aug 2025 (2026-07-26)

Backfilled the Leadership weekly scorecard from the week containing **Aug 1, 2025** through the
**current week**, and added a **Missed Calls** KPI. Run log: `scorecard-runs/2026-07-26T17-13-*.json`.

**Result: 597 scores pushed across 52 weeks (2025-07-28 .. 2026-07-20), 0 failures.**

## What Spencer asked for

> "Go back through the 90 data and go all the way back to date... exactly how many TMCP jobs we've
> had, starting from August 1, 2025... bring it all the way to the current week, and update all of
> the other information as well... I also want to add a weekly metric for missed calls."

## TMCP — the headline

| | 2025-07-28 | 2026-07-20 | Change |
|---|---|---|---|
| **Total TMCP Jobs active** | **278** | **645** | **+367 (+132%)** |
| **TMCP MRR** | $27,121 | $63,886 | +$36,765 (+136%) |

- **377 new TMCP jobs started** inside the 52 weeks (659 TMCP recurring jobs touch the window at
  all; 282 of those were already running on 2025-07-28).
- TMCP quoted **520**, converted **322** → **61.9% close rate** over the year.
- Weekly net-new summed to 363 vs. the 367 active delta — a 4-job boundary difference, i.e. the
  series is internally consistent.

### Caveat on "active" — read this before quoting 645

`Total TMCP Jobs active` counts recurring jobs where `startAt <= week end <= endAt`. **Only 6 of the
659 TMCP jobs have an end date in the past** — Jobber keeps a future `endAt` on a recurring job even
after a customer cancels. So the curve is effectively *"TMCP jobs ever started and never formally
closed"* and has almost no churn in it. True active count is lower by however many silent
cancellations have happened. This is the same blocker that keeps `TMCP Cancellations` disabled
(it computes ~0 every week). **Fixing this needs churn-tagging hygiene in Jobber, not a code change.**

## Everything else, 52-week totals

| Metric | 52-wk total |
|---|---|
| Total revenue | **$863,914** |
| New clients | 594 |
| Client visits | 15,442 |
| Total jobs created | 1,184 |

Revenue cross-checks against the Phase 0 baseline model's ~$857K trailing-12 — independent
confirmation the week bucketing is right. Revenue stays lumpy by design ($42–70K month-end TMCP
batch invoicing weeks vs. small mid-month weeks).

## Missed Calls (new KPI)

Created in the Ninety UI — **the public API has no KPI-create endpoint** (probed: `POST
/scorecard/kpis` → 404). Id `6a663cd93bb8238f576331cf`, Weekly, unit Number, orientation
**≤ goal**, goal **2**.

Definition: inbound CallRail calls with `answered == false`.

- 10 weeks of live data (2026-05-18 .. 2026-07-20): **693 calls, 46 missed = 6.6% miss rate,
  averaging 4.6/week**, and rising with volume (10 missed last week).
- Goal of ≤2/wk is a stretch against a 4.6 actual — deliberately, per the audit's ~$640
  expected-value-per-missed-call math. One click to change if Spencer wants ≤4.

## Two fixes that were blocking a correct history

1. **Week-start was wrong on the board.** The 2026-07-23 run pushed Sunday-keyed dates; Ninety
   snapped each one back into the containing Monday week, so every score sat **one week early**
   (Sunday 2026-06-21's 592 was showing in the "Jun 15 – Jun 21" column). Confirmed Monday-start
   visually. The backfill range covers every affected week, so all 166 of those are now overwritten
   correctly. One orphan — the point-in-time past-due score/note stranded at week 2026-07-13 — was
   deleted.
2. **Quote window was hardcoded to 2026-02-01**, which would have zeroed every quote metric before
   February. Now reaches 180 days behind the window start, since a quote can convert months after
   it was created.

## Data floors — why some cells are deliberately blank

New `dataFloor` field per metric in `ninety-kpi-map.json`. Weeks before a metric's floor are
**skipped, not pushed as 0**, so the board shows a blank instead of a false flat line.

| Metric | Floor | Why |
|---|---|---|
| Phone Calls, Missed Calls | 2026-05-18 | CallRail's first call is 2026-04-30; only fully live from 05-18 |
| Quick Fix ×4 | 2026-01-19 | "Quick Fix" line items first appear in Jobber on 2026-01-20 |

**This preserves Spencer's manual history.** Pre-floor weeks still hold hand-entered numbers —
Phone Calls through Jan–Apr 2026, and Quick Fix in the three weeks Dec 29 – Jan 18 (Quoted 26,
Converted 18, Created 34, Closed 11). Those weren't overwritten and weren't deleted: they're real
tracking from before the automation had a source. Every automated metric reconciles to the board
total exactly; those four rows carry the manual head.

## Churn — the TMCP tag (added 2026-07-26)

Spencer flagged that a Jobber churn tag exists but has only recently been applied. Confirmed and wired in.

Tags live on **Client**, not Job (`Job` has no tag field). Current state across 4,270 clients
(1,026 carry at least one tag):

| Tag | Clients |
|---|---|
| TMCP - Active | **613** |
| TMCP Churned | **20** |
| TMCP - BARTER | 6 |

**The blocking constraint: Jobber's `Tag` type is `{ id, label }` — there is no timestamp.** The tag
can say *who* churned but never *when*, so weekly churn cannot be backfilled, and never will be
retroactively, no matter how diligently the tag gets applied.

The fix is to have the cron *create* the history the tag lacks: every run snapshots the tag counts to
`data/tmcp-tag-snapshots.json` and pushes the **week-over-week delta** as `TMCP Cancellations`. The
delta is attributed to the week the *previous* snapshot was taken in — on a Monday cron that is
exactly the week that just closed. Attributing it to the current week would shift every number a
week late (the same class of bug as the Sunday/Monday snap above).

- **Baseline recorded 2026-07-26 at 20 tagged.** The first run deliberately pushes nothing — putting
  the standing total of 20 in as one week's churn would be flatly wrong. The first real number lands
  on the Monday cron.
- `TMCP Cancellations` is now **enabled**, source `jobber-tag`, replacing the job-`endAt` version
  that computed 0 every week.

**613 tagged active vs 645 job-derived active.** Not directly comparable — jobs are per-property and
clients are per-account, so one client with two properties is two jobs. But the gap is the honest
measure of how much the job-derived count overstates. Each run now writes a note on the "Total TMCP
Jobs active" KPI carrying both numbers, so the gap is visible on the board instead of buried here.
As tag coverage improves, the tag count becomes the more trustworthy of the two.

## Automation — registered

`cron/jobs/ninety-scorecard-push.md` — **Mondays 05:30, sonnet, active**. Validated through the
runtime's own parser; the daemon re-scans `cron/jobs/` every tick, so no restart was needed.

It re-pushes the **last 3 completed weeks** rather than one, because Jobber invoices, completions,
and quote transitions land late — re-pushing self-heals numbers that were incomplete when first
written (the score POST is create-or-update per kpi+week). It deliberately does *not* push the
in-progress week: on a Monday that week is one day old and would put near-zero values on the board.

Model is `sonnet`, not the `opus` field-ops floor, because it makes **no writes to live Jobber or
OptimoRoute state** — Jobber is read-only here, the computation is fully deterministic in the
script, and the only writes are Ninety scores. Documented in the job file; it moves to `opus` if it
ever writes back to Jobber.

## Still open

- Spencer's UI pass from the audit is still outstanding: archive the TMCP MRR duplicates (×2), the
  "quick fix jobs created" dupe, "Leads of Phone", and the 12 never-scored lead-source KPIs; set
  owners and goals (TMCP active goal is still 524 against an actual 645).
- OptimoRoute density metric (stops per route-hour) — needs its KPI created first.
- Churn tag coverage: 20 tagged against a book of 613 active. The weekly delta is only as good as
  the tagging discipline behind it.

## Engineering notes

- `--cache` added: raw Jobber/CallRail pulls (5,413 invoices / 1,351 quotes / 15,508 visits /
  1,537 recurring jobs / 729 calls) are saved to `data/_pull-cache_{from}_{to}.json`, so a push
  failure never re-pulls. Past-due is point-in-time and is always fetched live, never cached.
- CallRail enforces a 2-year retention window and returns a hard **400** for earlier dates — the
  call pull is clamped to a 2026-04-01 floor rather than allowed to throw.
- The Ninety public API is score-write only: no `GET .../scores`, no KPI create. Verification has
  to happen in the UI (or by reconciling the board's Total column, as done above).
