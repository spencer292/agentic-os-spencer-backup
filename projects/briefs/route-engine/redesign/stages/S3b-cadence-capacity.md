# S3b — Cadence as-built and route-day capacity

Measured 2026-09-18 from Jobber. Findings only, no recommendations. Nothing here applies
`scheduling-rules.json` or the cadence rules in `CLAUDE.local.md`; every number is derived from
the visit and job data. Where a measured result agrees or disagrees with a written rule, that is
reported as an observation.

| | |
|---|---|
| Jobs | 1,063 (TMCP 752, Quick Fix 274) |
| Visits | 4,290 over 2026-08-14 .. 2026-10-16 (2,924 completed) |
| Notes sample | 192 notes on 40 jobs, used for true per-visit state |
| Route-day cycle time | `data/route-day-drive_2026-08-17_2026-09-17.json`, 25 route-days |
| Route-day assignment | `redesign/data/master-asbuilt.json` — all 881 active jobs matched, no fallback used |
| Scripts | `scripts/derive-cadence.mjs` → `data/cadence-asbuilt.json`; `scripts/demand-model.mjs` → `data/demand-model.json` |

---

## 1. The measurement problem that shapes everything below

The Jobber fields that record what a tech found — Latest Activity, Moles Caught, Misses, Next
Action — are **job-level, not visit-level**. They hold only the state of the most recent completed
visit. Each job therefore yields exactly one trigger-attributed interval, measured forward from its
last completed visit.

That forward interval is, by construction, always a **scheduled** date and never a delivered one.
The script asserts this and it holds for all 810 rows. So the trigger table below measures what the
office has **booked next**, not what the field delivered.

Delivered cadence has to come from two other places: consecutive completed-visit gaps (large n, but
unattributable to a trigger), and the notes sample (small n, but carries true per-visit state).
All three views are reported separately and they disagree in an informative way.

---

## 2. Interval by trigger

**Booked next** — one row per job, from the job-level fields. This is the standing schedule.

| Trigger | n | median | p25 | p75 | share ≤10d |
|---|---:|---:|---:|---:|---:|
| quiet (None, no catch/miss) | 446 | 9 | 7 | 25 | 55% |
| catch | 138 | 14 | 7 | 26 | 37% |
| activity Low | 104 | 14 | 7 | 21 | 45% |
| miss (no catch) | 104 | 14 | 7 | 25.5 | 44% |
| activity Moderate | 13 | 14 | 13 | 21 | 23% |
| activity High | 5 | 14 | 7 | 27 | 40% |

**The booked schedule does not discriminate by trigger at all.** Every non-quiet trigger sits at a
median of 14 days with a p75 in the 21-27 day range. A catch and a High-activity finding buy the
customer exactly the same next appointment as a Low-activity one. Restricted to TMCP the quiet row
also collapses to 14 days, so the 9-day quiet median above is a Quick Fix effect, not a signal that
quiet jobs get seen sooner.

**Delivered** — consecutive completed-visit gaps, unattributed.

| Product | n | median | p25 | p75 | share ≤10d |
|---|---:|---:|---:|---:|---:|
| TMCP | 1,403 | 7 | 7 | 9 | 80% |
| Quick Fix | 476 | 7 | 7 | 7 | 99.6% |
| All | 1,925 | 7 | 7 | 8 | 85% |

**Delivered by trigger** — notes sample, per-visit state, follow-up that actually happened.

| Trigger | n | median | p25 | p75 | share ≤10d |
|---|---:|---:|---:|---:|---:|
| miss (no catch) | 36 | 7 | 7 | 7 | 94% |
| activity Low | 43 | 7 | 7 | 7 | 88% |
| catch | 22 | 7.5 | 7 | 11.5 | 73% |
| quiet (None) | 42 | 7 | 7 | 16 | 57% |
| activity Moderate | 4 | 7 | 6.8 | 7 | 100% |
| activity High | 2 | 6.5 | 6.3 | 6.8 | 100% |

The two views tell opposite stories, and both are true. The field **delivers** roughly weekly
service to anything with a sign of activity. The standing schedule **holds** those same jobs at
fortnightly-to-monthly. The gap between them is closed by hand, visit by visit, which is what the
overdue count in section 5 is measuring.

Note the ordering inside the delivered table: a **miss gets a faster return than a catch**
(94% vs 73% within 10 days). A caught mole is treated as a problem partly solved; a miss is treated
as one still running.

The free-text Next Action written on a note predicts the delivered interval well: "Add visit"
n=83 median 7d (89% ≤10d), "Add visit 1 week" n=15 median 7d, "2 weeks" n=11 median 14d,
"Monthly" n=17 median 28d. The dropdown field has only three values and no "Add visit N weeks"
option, so the note grammar carries more precision than the field it feeds.

---

## 3. Quick Fix series reality

Clean cohort: 134 Quick Fix jobs whose job start falls inside the visit window, so the whole series
is observable.

- **Series length delivered: median 5 visits**, p25 5, p75 5, range 3-6. The 5-week design holds.
- **Spacing: median 7 days**, p25 7, p75 7, range 3-11. 99.4% of gaps are ≤10 days.
- **Ran past 5 visits: 11 of 134 scheduled a 6th; none has completed a 6th yet.** So the
  "series exhausted with activity outstanding" case is roughly 8% of Quick Fix jobs, and it is
  currently being handled by booking a 6th visit rather than by a sales conversation.
- 108 of 134 still hold a future visit; 22 are archived.

Quick Fix is the one part of the book that runs exactly as designed. It needs no cadence logic —
it is a fixed weekly series — so it should be modeled as a fixed 1 visit/week per active job rather
than being fed through a trigger rule.

---

## 4. TMCP quiet interval and weekday hold

- **Quiet TMCP jobs are booked at a median of 14 days forward** (n=324, p25 7, p75 28). Only 34%
  of those bookings fall in the 24-38 day band. So "quiet means monthly" is **not** what the
  standing schedule does — it books quiet jobs at every interval from 4 to 42 days.
- **Weekday hold: 66.6%.** Across 728 TMCP jobs with two or more visits, only two thirds of visits
  land on the job's own dominant weekday, and only 169 jobs (23%) hold their weekday 100% of the time.
- **Tech hold: 83.2%**, measured inside a window that contains real handovers, so the true figure
  is higher. Ownership is considerably more stable than the weekday.

The weekday is the weakest anchor in the system. A design that assumes "this job belongs to Tuesday"
is assuming something that currently holds only two times in three.

---

## 5. Overdue as of 2026-09-18

Scope is the 881 **active** jobs: not archived, and either holding a future visit or completed
within 45 days. Two measures:

- **Unsatisfied** — the job's own Next Action field is not met by the schedule. No visit after the
  last completed one, or the next visit falls past the field's limit (Add visit 10d, 2 weeks 17d,
  Monthly 33d, each target plus 3 days of grace).
- **Hard overdue** — the limit date has already passed and nothing happened or is booked before today.

| | count |
|---|---:|
| Active jobs | 881 |
| Unsatisfied | **403** (46%) |
| Hard overdue | **129** (15%) |
| No future visit at all | 81 |

By product: unsatisfied TMCP 393, Quick Fix 5, Barter 4, Friends and family 1. Hard overdue
TMCP 125, Barter 3, Friends and family 1. **The problem is entirely a TMCP problem.**

By the office's own instruction: 355 of the 403 unsatisfied jobs carry "Add visit", 33 carry
"2 weeks", 15 carry "Monthly".

By trigger, hard overdue: quiet 56, catch 29, miss 26, activity Low 15, activity Moderate 3.
**Fifty-five of the 129 hard-overdue jobs had a catch or a miss on the last visit.**

Days since last completed visit: all active jobs median 4 (p75 10). Hard-overdue jobs median 22
(p25 17, p75 24, max 35).

Per route-day (active / unsatisfied / hard):

| Route-day | active | unsat | hard |
|---|---:|---:|---:|
| Cory Ventura / wed | 51 | 17 | 11 |
| Cory Ventura / mon | 47 | 22 | 4 |
| Tavis Alexander / thu | 42 | 21 | 9 |
| Tavis Alexander / tue | 42 | 19 | 7 |
| Robert Norton / tue | 41 | 18 | 7 |
| Tavis Alexander / fri | 41 | 22 | 5 |
| Robert Norton / wed | 39 | 23 | 4 |
| Luke LaVergne / thu | 39 | 13 | 5 |
| Robert Norton / fri | 38 | 11 | 5 |
| Alias Franks / tue | 37 | 16 | 4 |
| Alias Franks / wed | 37 | 14 | 6 |
| Tavis Alexander / mon | 35 | 19 | 4 |
| Alias Franks / fri | 34 | 11 | 1 |
| Robert Norton / thu | 34 | 20 | 5 |
| Alias Franks / thu | 34 | 12 | 7 |
| Luke LaVergne / mon | 34 | 18 | 6 |
| Alias Franks / mon | 32 | 18 | 2 |
| Cory Ventura / thu | 32 | 14 | 6 |
| Tavis Alexander / wed | 32 | 23 | 7 |
| Cory Ventura / tue | 30 | 15 | 8 |
| Luke LaVergne / fri | 30 | 16 | 8 |
| Luke LaVergne / tue | 28 | 14 | 3 |
| Cory Ventura / fri | 26 | 15 | 2 |
| Robert Norton / mon | 23 | 6 | 2 |
| Luke LaVergne / wed | 23 | 6 | 1 |

The backlog is **spread evenly across all 25 route-days**, between 6 and 23 unsatisfied jobs each.
No tech and no weekday is the cause. That rules out a local explanation and points at the scheduling
mechanism itself.

---

## 6. Capacity under four cadence policies

Weekly demand per job is `7 / interval`. Hours are `visits × that route-day's measured cycle time`,
where cycle time is median span hours ÷ median stops for that tech and weekday, drive included.

- **P0** — as the office actually runs it. Each job uses its own measured gap median, falling back
  to its own next booked gap when it has only one completed visit, then to the product median.
- **P1** — weekly after a catch, monthly otherwise.
- **P2** — weekly after catch OR miss OR any activity, monthly otherwise.
- **P3** — the Next Action field taken literally (Add visit 7d, 2 weeks 14d, Monthly 30d).

Quick Fix is held at 7 days under all four, because it is a product definition rather than a cadence
decision. The pure-policy variant is in `demand-model.json` under `policiesPure`.

Observed baseline, what the five techs actually delivered over 08-17 .. 09-17: **615 stops/week,
207.9 hours/week, 15 of 25 route-days already over 8 h, 6 over 9 h.**

| Tech | Day | cycle min | obs stops | obs h | P0 v | P0 h | P1 v | P1 h | P2 v | P2 h | P3 v | P3 h |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Alias Franks | mon | 19.2 | 27.5 | 8.8 | 31.7 | 10.2 | 20.4 | 6.5 | 29.6 | 9.5 | 33.2 | 10.6 |
| Alias Franks | tue | 23.6 | 27 | 10.6 | 32.5 | 12.8 | 18.8 | 7.4 | 23.4 | 9.2 | 32.2 | 12.6 |
| Alias Franks | wed | 28.3 | 25 | 11.8 | 26.4 | 12.4 | 18.7 | 8.8 | 26.3 | 12.4 | 31.2 | 14.7 |
| Alias Franks | thu | 25.3 | 23 | 9.7 | 26.7 | 11.3 | 12.5 | 5.3 | 24.0 | 10.1 | 31.2 | 13.2 |
| Alias Franks | fri | 22.4 | 25.5 | 9.5 | 29.9 | 11.2 | 16.6 | 6.2 | 25.0 | 9.3 | 31.7 | 11.8 |
| Cory Ventura | mon | 12.8 | 31 | 6.6 | 44.0 | 9.4 | 26.4 | 5.6 | 41.0 | 8.7 | 49.7 | 10.6 |
| Cory Ventura | tue | 15.1 | 23 | 5.8 | 22.1 | 5.6 | 14.6 | 3.7 | 18.4 | 4.7 | 27.7 | 7.0 |
| Cory Ventura | wed | 15.2 | 28 | 7.1 | 27.6 | 7.0 | 15.3 | 3.9 | 22.2 | 5.6 | 29.9 | 7.6 |
| Cory Ventura | thu | 16.0 | 24 | 6.4 | 25.5 | 6.8 | 12.8 | 3.4 | 22.0 | 5.9 | 29.5 | 7.9 |
| Cory Ventura | fri | 15.5 | 24 | 6.2 | 35.6 | 9.2 | 19.7 | 5.1 | 30.4 | 7.9 | 36.4 | 9.4 |
| Luke LaVergne | mon | 22.1 | 22 | 8.1 | 28.7 | 10.6 | 23.6 | 8.7 | 27.4 | 10.1 | 38.7 | 14.3 |
| Luke LaVergne | tue | 28.9 | 17 | 8.2 | 23.5 | 11.3 | 9.4 | 4.5 | 14.0 | 6.7 | 20.1 | 9.7 |
| Luke LaVergne | wed | 32.1 | 17 | 9.1 | 22.2 | 11.9 | 11.2 | 6.0 | 14.3 | 7.6 | 22.2 | 11.9 |
| Luke LaVergne | thu | 27.4 | 21 | 9.6 | 27.5 | 12.6 | 15.6 | 7.1 | 21.7 | 9.9 | 33.0 | 15.1 |
| Luke LaVergne | fri | 20.0 | 24 | 8.0 | 20.7 | 6.9 | 11.7 | 3.9 | 17.0 | 5.7 | 24.2 | 8.1 |
| Robert Norton | mon | 21.5 | 21.5 | 7.7 | 14.8 | 5.3 | 6.5 | 2.3 | 13.4 | 4.8 | 17.5 | 6.3 |
| Robert Norton | tue | 19.9 | 25 | 8.3 | 24.4 | 8.1 | 15.4 | 5.1 | 21.5 | 7.1 | 28.4 | 9.4 |
| Robert Norton | wed | 20.1 | 23 | 7.7 | 24.4 | 8.2 | 15.3 | 5.1 | 20.7 | 6.9 | 31.7 | 10.6 |
| Robert Norton | thu | 21.1 | 25 | 8.8 | 26.6 | 9.4 | 14.8 | 5.2 | 21.0 | 7.4 | 30.7 | 10.8 |
| Robert Norton | fri | 23.7 | 22 | 8.7 | 31.2 | 12.3 | 21.6 | 8.5 | 30.0 | 11.9 | 34.7 | 13.7 |
| Tavis Alexander | mon | 16.4 | 27.5 | 7.5 | 29.9 | 8.2 | 21.3 | 5.8 | 30.5 | 8.3 | 36.4 | 9.9 |
| Tavis Alexander | tue | 18.2 | 29 | 8.8 | 28.2 | 8.6 | 20.9 | 6.3 | 24.0 | 7.3 | 30.1 | 9.1 |
| Tavis Alexander | wed | 15.0 | 32 | 8.0 | 23.3 | 5.8 | 12.1 | 3.0 | 19.0 | 4.8 | 27.5 | 6.9 |
| Tavis Alexander | thu | 18.7 | 26 | 8.1 | 25.1 | 7.8 | 18.6 | 5.8 | 24.0 | 7.5 | 32.7 | 10.2 |
| Tavis Alexander | fri | 21.1 | 25 | 8.8 | 36.3 | 12.8 | 18.0 | 6.3 | 28.7 | 10.1 | 35.7 | 12.6 |

Totals against a 200-hour week (25 route-days × 8 h):

| Policy | visits/wk | hours/wk | vs 200 h | vs observed 615 | days >8 h | days >9 h | tech-days needed at 8 h |
|---|---:|---:|---:|---:|---:|---:|---:|
| Observed | 615 | 207.9 | +7.9 | — | 15 | 6 | 26.0 |
| P0 as-run | 688.8 | 235.4 | **+35.4** | +12% | 18 | 14 | 29.4 |
| P1 catch-only | 411.8 | 139.7 | −60.3 | −33% | 3 | 0 | 17.5 |
| P2 any-activity | 589.6 | 199.4 | **−0.6** | −4% | 11 | 9 | 24.9 |
| P3 field literal | 776.2 | 263.9 | **+63.9** | +26% | 20 | 19 | 33.0 |

### What the calibration says

**P2 is the only policy that reproduces the business that actually runs.** At 589.6 visits and
199.4 hours it sits 4% under the observed baseline and lands within 0.6 hours of the 200-hour
capacity of the current five techs. The rule "any activity, a catch, or a miss means weekly, and
nothing found means monthly" is, to within measurement error, a description of what Got Moles is
already doing — not a change to it.

**P1 is a service cut, not a simplification.** Catch-only weekly would remove a third of the
delivered work. The misses and the Low-activity findings are carrying most of the follow-up volume.

**P3 does not fit in the week.** Taking the office's own Next Action field literally needs 33
tech-days against the 25 available — eight route-days, or about 1.6 extra techs. Since 896 of
1,063 jobs carry "Add visit", the field is effectively a default rather than a decision, and no
scheduler can honor it as written.

**P0 runs 12% hot against the observed baseline.** P0 sums the current book at each job's own
measured pace, while the 615-stop baseline is a five-week median over a slightly smaller book that
lost a day to Labor Day. The gap is the model's error bar. Treat differences between policies as
meaningful and differences under about 10% as noise.

---

## 7. Seasonality, 08-17 to 09-14

| Week of | TMCP visits | share ≤10 d gap | visits per active TMCP job, 5-day-normalized |
|---|---:|---:|---:|
| 08-17 | 449 | 100% (biased) | 0.622 |
| 08-24 | 444 | 97.5% | 0.615 |
| 08-31 | 422 | 82.8% | 0.584 |
| 09-07 | 321 | 84.7% | 0.556 |
| 09-14 | 405 | 53.5% (partial) | 0.561 |

Two caveats sit on this table. Week 1's ≤10-day share is **inflated to 100% by construction** — the
lookback runs off the front of the visit window, so no long gap can be observed. Week 4 lost Labor
Day and ran 4 field days, which pushed visits into week 5 and is the main reason week 5's share
reads 53.5%. The normalized rate in the last column has neither problem.

On that cleaner measure the delivered rate falls from **0.622 to 0.556 visits per active TMCP job
per week across the month, about 10%** — cadence stretching from roughly 11.3 to 12.6 days. The
median gap stays at 7 days throughout. So the change is entirely in the tail: the share of TMCP jobs
still on a weekly footing is shrinking while the weekly ones stay weekly. That is consistent with
mole activity easing into September, and it means a model calibrated on August will over-book October.

---

## 8. Facts the design must respect

1. **The standing schedule is trigger-blind; humans close the gap by hand.** Booked-next medians
   are 14 days for a catch, a miss, and every activity level alike, while delivered medians are
   7 days. Everything the field does right about cadence currently lives outside the schedule.
   Any engine that reads the booked schedule as intent will reproduce the wrong cadence.

2. **A catch today is followed by a visit in a median of 7.5 days and is run as weekly 73% of the
   time — but the schedule only books it inside 10 days 37% of the time.** A miss is treated more
   urgently than a catch (94% weekly). A design that triggers on catches alone (P1) drops a third
   of the delivered work.

3. **P2 costs what the company already spends.** Weekly on catch, miss or any activity and monthly
   on quiet comes to 199.4 hours against 200 hours of capacity. But it needs 11 of 25 route-days
   over 8 hours and 9 over 9 hours, against 15 and 6 observed today. **The binding constraint is
   balance between route-days, not total headcount** — the total fits, the distribution does not.

4. **The weekday anchor holds only 66.6% of the time; tech ownership holds 83.2%.** Any design that
   pins a job to a fixed weekday is enforcing something the current operation does not do. Ownership
   is the stable axis.

5. **46% of active jobs are already behind their own instruction and 15% are hard overdue, spread
   evenly across all 25 route-days (6-23 per day).** Fifty-five of the 129 hard-overdue jobs had a
   catch or a miss. This is a mechanism failure, not a tech or territory failure.

6. **Quick Fix needs no cadence logic.** Median 5 visits, median 7-day spacing, 99.4% of gaps
   within 10 days. Model it as a fixed weekly series with a flag when an 11-of-134 case wants a
   sixth visit.
