---
stage: S3b-corrected
supersedes: stages/S3b-cadence-capacity.md (the numbers, not the method)
created: 2026-09-19
inputs: data/jobber/{jobs,visits,notes-sample}.json, data/route-day-drive_2026-08-17_2026-09-17.json, data/gps-ground-truth.json
before: data/before-repair/
---

# S3b corrected — the cadence numbers after the measurement primitives were repaired

Build item 1 of the redesign plan. Six primitives in `derive-cadence.mjs` were
measuring something other than what they were named after; Codex found them and
S6 verification confirmed each one with line numbers. They are now fixed, the
stage was re-run, and every headline number is reported here before and after.

The pre-repair outputs are kept verbatim in `data/before-repair/` so any figure
below can be re-derived rather than taken on trust.

## What was repaired

| # | Primitive | Was | Now |
|---|---|---|---|
| a | Delivered gap | every consecutive pair of **scheduled** visits, dated by `startAt`, filtered only on the ending visit being complete | completion to completion, dated by `completedAt` in Pacific, and dropped when an uncompleted visit sits between the two |
| b | Note as evidence of a return | the next **note** counted as a delivered follow-up on its own | a note counts only when a completed visit sits within ±1 day of it; otherwise `note only`, excluded |
| c | Miss parsing | `/(\d+)\s*miss(?:ed)?/` — blind to the plural | `misses`, `missed`, `miss`, `2x miss`, `miss x2`, `2 traps sprung`, `trap tripped`; `missing` without a number is a lost trap, not a miss |
| d | Quick Fix series length | counted **future appointments**; cohort needed only a recent start | counts completed visits, reports `completedInSeries` and `scheduledRemaining` separately, cohort requires a first visit ≥35 days before as-of |
| e | Weekday and tech hold | denominator included all 1,248 future incomplete visits | completed visits only, by the weekday the visit was **worked** |
| f | Overdue | a stale uncompleted visit stood in for an arrangement and suppressed `hardOverdue`; active population cut at 45 days | a stale uncompleted visit is a **missed** visit; active population reaches 60 days |
| g | Cycle time | `demand-model` took the ratio of medians, `week-solve` the median of ratios | one estimator in `scripts/lib/cycle-time.mjs`, the median of per-route-day ratios, imported by both |

The note reader moved to `scripts/lib/parse-note.mjs` and is covered by
`scripts/tests/parse-note.test.mjs` — 16 field-shaped notes, 64 assertions,
all passing, including `2 misses N/A`, which used to parse as quiet.

## Headline numbers, before and after

### Delivered gaps — unchanged

| Measure | Before | After |
|---|---|---|
| TMCP delivered gaps (n) | 1,403 | 1,401 |
| TMCP median / p25 / p75 | 7 / 7 / 9 | 7 / 7 / 9 |
| Quick Fix median (n) | 7 (476) | 7 (476) |
| All products median (n) | 7 (1,925) | 7 (1,922) |

Exactly one gap stepped over a skipped visit, and no completed visit was missing
a `completedAt`. This confirms the S6 verification: the mechanism was real, the
effect is not. The delivered gap median is 7 days either way.

One flag flips and it is not a regression. `intervalTableIsBookedNotDelivered`
goes from `true` to `false` because the forward interval is now measured from the
day the last visit was **worked**, and two visits (#8281, #8302) were completed
days before the date they were booked for — so the next visit on the books is one
that has already happened. Two rows of 812.

### Delivered gaps by trigger — the medians hold, the evidence base shrinks by a third

The note cross-check is the only per-visit evidence, and it feeds P0's fallback
interval in `demand-model.mjs`. Of 148 rows that used to count as delivered
because a later note existed, **59 could not be tied to any completed visit**.

| Trigger | Before, median (n) | After, median (n) |
|---|---|---|
| quiet (None) | 7 (42) | 7 (29) |
| activity Low | 7 (43) | 7 (25) |
| miss (no catch) | 7 (36) | 7 (23) |
| catch | 7.5 (22) | 7 (11) |
| activity Moderate | 7 (4) | 7 (1) |
| activity High | 6.5 (2) | 7 (1) |

Every median stays at 7 days. The conclusion survives; the confidence behind it
is a third thinner, and Moderate and High now rest on one observation each.

### Miss parsing — latent, as predicted

Across the 192-note sample the repaired reader changes the `misses` field on
**4 notes** and the trigger on **1**: `"No mole | Moved 2 | Missing 2 (yellow) |
LA | Traps onX | Add visit"` moves from *activity Low* to *miss*. Not one note in
the sample uses the plural "misses". The defect is real and now closed, but it
never bit this data.

### Quick Fix — the "five visits delivered" claim does not survive

| Measure | Before | After |
|---|---|---|
| All Quick Fix jobs, visits per job (median) | **5** | **3 completed** (5 scheduled) |
| Clean cohort size | 134 jobs | **18 jobs** |
| Cohort visits per job (median) | 5 | 4 completed, 0 still scheduled |
| Cohort jobs completing ≥5 visits | 31 of 134 | **8 of 18** |
| Spacing between delivered visits (median) | 7 d | 7 d |

The old cohort only required the job to start inside the visit window. The window
opens 2026-08-14 and as-of is 2026-09-18, so a five-week weekly series can be
fully observed for jobs starting in the first few days and no others — which is
why an honest cohort is 18 jobs, not 134. **S3b's "series length delivered:
median 5 visits — the 5-week design holds" was counting appointments, not
visits.** What the data supports is narrower: the spacing inside a Quick Fix
series is weekly and very tight (median 7 d, 100% within 10 d), and fewer than
half of the observable series reach five completed visits.

### Weekday and tech hold — both rise

| Measure | Before (schedule template) | After (completed visits only) |
|---|---|---|
| Weekday hold | 66.6% | **75.6%** |
| Tech hold | 83.2% | **88.9%** |
| Jobs measured | 728 | 567 |
| Visits counted | 4,290-scoped | 1,972 completed |
| Jobs holding weekday 100% | 169 | **253** |

The old figures described how consistently the schedule was written. Measured on
what the techs actually did, both hold rates are higher. S3b line 115 guessed
this ("the true figure is higher"); it is now measured.

### Overdue — materially worse than reported

| Measure | Before | After |
|---|---|---|
| Active jobs | 881 | 881 |
| Unsatisfied against Next Action | 403 (**45.7%**) | 472 (**53.6%**) |
| Hard overdue | 129 (**14.6%**) | 165 (**18.7%**) |
| Median days since last completion, hard overdue | 22 | 22 |
| Missed stale visits (booked on or before as-of, never completed) | not measured | **112 across 110 jobs** |

112 appointments were booked, passed, and never completed, and each one used to
make its job look arranged. Removing that alone moves unsatisfied work from
under half the book to over half, and hard-overdue from one job in seven to
nearly one in five.

**The 45→60 day widening changed nothing, and the reason matters.** It adds zero
jobs, because the visit window itself only reaches back to 2026-08-14. The
oldest last-completion among jobs with no future visit is 32 days. The threshold
was never the binding constraint — the length of the data pull is. Until a
snapshot carries a longer history, the overdue count still cannot see work
neglected for more than about a month. The weekly snapshots from build item 2
are what eventually fix this.

### Capacity, P0–P3, under both cycle sources

Stamps (`route-day-drive`, 113 route-days) and GPS (`gps-ground-truth`, 113
route-days), both now through the one shared estimator.

**Stamp cycle times**

| Policy | Visits/wk before → after | Hours/wk before → after | Days >8 h | Days >9 h |
|---|---|---|---|---|
| P0 as-run | 688.8 → 688.7 | 235.4 → **231.0** | 18 → 16 | 14 → 14 |
| P1 weekly after catch | 411.8 → 411.8 | 139.7 → **137.7** | 3 → 3 | 0 → 0 |
| P2 weekly after any activity | 589.6 → 589.6 | 199.4 → **196.6** | 11 → 11 | 9 → 10 |
| P3 Next Action literal | 776.2 → 776.2 | 263.9 → **259.8** | 20 → 20 | 19 → 17 |

**GPS cycle times**

| Policy | Visits/wk before → after | Hours/wk before → after | Days >8 h | Days >9 h |
|---|---|---|---|---|
| P0 as-run | 688.8 → 688.7 | 229.8 → **229.8** | 16 → 16 | 13 → 13 |
| P1 weekly after catch | 411.8 → 411.8 | 136.9 → **136.9** | 3 → 3 | 1 → 1 |
| P2 weekly after any activity | 589.6 → 589.6 | 195.2 → **195.3** | 10 → 10 | 7 → 7 |
| P3 Next Action literal | 776.2 → 776.2 | 258.3 → **258.4** | 19 → 19 | 16 → 16 |

Observed baseline is unchanged: 615 stops and 207.9 h (stamps) or 207.6 h (GPS)
per week. Unifying the estimator moves the **stamp** numbers by 1–4 hours a week
and leaves the **GPS** numbers alone, because the GPS file was already a median
of per-day ratios and the stamp path was the one taking a ratio of medians.
Per-tech P2 hours under GPS are unmoved: Alias 49.8, Luke 39.3, Robert 36.6,
Tavis 36.7, Cory 32.8.

## What changes in the plan's section 1 table

Four rows. Two need rewriting, two are confirmed.

1. **"Half the active book is behind its own field — 46% of active jobs
   unsatisfied; 15% hard overdue, median 22 days."** **Changes.** It is
   **54% unsatisfied and 19% hard overdue**, median still 22 days. Add the
   112 missed stale visits, which is the mechanism behind the gap.

2. **"Weekday structure is real where geography makes it so — … elsewhere 67%
   weekday hold and Cory 4%."** **Changes.** Weekday hold is **75.6%**, and
   tech hold, quoted as 83% in the "ownership is real and stable" row, is
   **88.9%**. Both were measured on the schedule template, not the field. The
   Cory 4% figure is S3a's stable-customer share and was **not** re-measured
   here — it stands unverified by this pass.

3. **"The office books one cadence regardless of what the tech found — next
   visit booked 14 days out after a catch, a miss, low, high or nothing;
   delivered TMCP gap median 7 days."** **Confirmed unchanged.** Every TMCP
   trigger still books at a median of 14 days and the field still delivers 7.

4. **"Capacity fits on paper only — weekly-after-any-activity = 195 h (GPS)
   against 200 h; 10 route-days over 8 h; Alias's book alone is 50.5 h."**
   **Confirmed.** 195.3 h, 10 route-days over 8 h, Alias 49.8 h. The 50.5 h
   figure should read 49.8 h.

Nothing in section 2 (the model) or section 4 (the build order) is invalidated.
One claim outside the table does fall: the design note that **Quick Fix "runs
exactly as designed"** is not a delivered measurement. Terminating the series at
visit five with a sales flag remains the right rule because it is the product
definition, but it should be stated as a rule the system will enforce, not as
behaviour the data confirms.

## Files

- `scripts/lib/cycle-time.mjs` — the one cycle-time estimator
- `scripts/lib/parse-note.mjs` — the note reader, with the repaired miss patterns
- `scripts/tests/parse-note.test.mjs` — 16 notes, 64 assertions
- `scripts/derive-cadence.mjs` — repairs a, b, d, e, f
- `scripts/demand-model.mjs` — `--cycle=gps|stamps`, shared estimator
- `scripts/policies/week-solve.mjs` — shared estimator, cut preserved at the week start
- `data/before-repair/` — the pre-repair outputs, for any re-derivation
