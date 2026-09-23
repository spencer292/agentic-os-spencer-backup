# S2b — Paid hours as the success label

Joins Gusto paid hours to what OptimoRoute planned and what the completion stamps show, per tech per route-day, 2026-08-17 to 2026-09-20.

- **Script:** `scripts/join-paid-hours.mjs` → `data/route-day-ledger.json` (log: `data/join-paid-hours.log`)
- **Hours only.** The ledger records paid hours per tech per day. No rate, no pay, no dollar amount — it is safe to track in git.
- **Cory Ventura is salaried and does not clock in,** so he has no Gusto rows. His route-days carry `NO_CLOCK`. That is by design, not missing data.
- **Window mismatch:** the plan ends 09-17, Gusto runs to 09-20. Friday 09-18 has paid hours with no plan to compare against, so weekly plan-vs-paid uses in-window days only.
- **Labor Day, Monday 09-07:** all four hourly techs show zero paid hours. Labelled `HOLIDAY`, not `ABSENT`. That week is a 4-day week.
- **Luke was absent Friday 08-28** and Cory covered his 20 planned stops. Luke's day is the only true `ABSENT` in five weeks.

## Labels

| Label | Rule |
|---|---|
| GREEN | paid ≤ 8.5 h and overtime < 1.5 h |
| AMBER | 8.5 h < paid ≤ 10 h |
| RED | paid > 10 h **or** overtime ≥ 1.5 h |
| HOLIDAY | 0 paid hours on a named company holiday |
| ABSENT | 0 paid hours on any other weekday |
| COVER | worked stops planned under another tech (the moved-tech class) |
| Week | SUCCESSFUL if no RED days and overtime < 2 h |

## Weekly table

Paid and overtime are Gusto. Planned span is the OptimoRoute plan, stamped span is first to last completion stamp. All hours.

| Tech | Week | Paid | OT | Planned | Stamped | Stops plan/done | G/A/R | Label |
|---|---|---:|---:|---:|---:|---:|---|---|
| Alias Franks | 08-17 | 51.9 | 11.9 | 44.9 | 51.5 | 125/132 | 0/1/4 | UNSUCCESSFUL |
| Alias Franks | 08-24 | 54.2 | 14.2 | 42.3 | 57.3 | 120/128 | 0/2/3 | UNSUCCESSFUL |
| Alias Franks | 08-31 | 45.4 | 5.4 | 44.8 | 43.9 | 121/120 | 2/0/3 | UNSUCCESSFUL |
| Alias Franks | 09-07 | 38.9 | 0 | 31.9 | 37.9 | 90/94 | 1/1/2 | UNSUCCESSFUL |
| Alias Franks | 09-14 | 51.1 | 11.1 | 31.8 | 39.2 | 85/105 | 1/1/3 | UNSUCCESSFUL |
| Luke LaVergne | 08-17 | 39.8 | 0 | 40.3 | 38.7 | 94/104 | 4/1/0 | SUCCESSFUL |
| Luke LaVergne | 08-24 | 33.1 | 0 | 40.8 | 32.1 | 94/75 | 3/1/0 | SUCCESSFUL |
| Luke LaVergne | 08-31 | 43.7 | 3.7 | 41.3 | 43.4 | 97/104 | 0/4/1 | UNSUCCESSFUL |
| Luke LaVergne | 09-07 | 37.7 | 0 | 34.2 | 40.7 | 80/86 | 0/3/1 | UNSUCCESSFUL |
| Luke LaVergne | 09-14 | 42.0 | 2.0 | 30.4 | 31.1 | 64/79 | 3/1/1 | UNSUCCESSFUL |
| Robert Norton | 08-17 | 39.1 | 0 | 36.2 | 37.1 | 104/109 | 4/1/0 | SUCCESSFUL |
| Robert Norton | 08-24 | 42.0 | 2.0 | 39.5 | 47.5 | 118/125 | 2/1/2 | UNSUCCESSFUL |
| Robert Norton | 08-31 | 42.0 | 2.0 | 40.3 | 40.9 | 118/121 | 2/2/1 | UNSUCCESSFUL |
| Robert Norton | 09-07 | 33.8 | 0 | 32.0 | 32.7 | 95/94 | 2/2/0 | SUCCESSFUL |
| Robert Norton | 09-14 | 35.5 | 0 | 25.0 | 28.7 | 76/99 | 4/1/0 | SUCCESSFUL |
| Tavis Alexander | 08-17 | 40.8 | 0.8 | 40.8 | 38.4 | 124/136 | 2/3/0 | SUCCESSFUL |
| Tavis Alexander | 08-24 | 43.4 | 3.4 | 48.5 | 45.3 | 142/149 | 2/1/2 | UNSUCCESSFUL |
| Tavis Alexander | 08-31 | 43.5 | 3.5 | 42.4 | 41.1 | 123/137 | 1/2/2 | UNSUCCESSFUL |
| Tavis Alexander | 09-07 | 30.9 | 0 | 32.3 | 29.3 | 95/103 | 4/0/0 | SUCCESSFUL |
| Tavis Alexander | 09-14 | 41.0 | 1.0 | 31.5 | 31.3 | 97/117 | 4/1/0 | SUCCESSFUL |
| Cory Ventura | all 5 | — | — | 145.0 | 139.8 | 515/576 | — | NO_CLOCK |

Eight of twenty tech-weeks were successful. Five weeks of paid time total 829.7 hours with 60.9 hours of overtime. Overtime by tech: Alias 42.6, Tavis 8.7, Luke 5.7, Robert 4.0.

The 09-14 row includes Friday 09-18, which sits outside the plan window. Comparable in-window paid totals for that week are Alias 40.3, Luke 32.7, Robert 28.8, Tavis 33.1.

## How far the plan misses the paid day

Day-level distribution of paid hours minus planned span, in hours. Positive means the plan under-estimates what the company pays for.

| Tech | median | p10 | p90 | days |
|---|---:|---:|---:|---:|
| Alias Franks | **+1.7** | −0.2 | +3.7 | 23 |
| Robert Norton | +0.3 | −1.0 | +2.0 | 23 |
| Luke LaVergne | +0.2 | −1.0 | +1.8 | 22 |
| Tavis Alexander | −0.4 | −1.5 | +1.3 | 23 |
| All hourly | +0.3 | −1.1 | +2.3 | 91 |

The plan is close to the paid day in aggregate and badly wrong for one person. Alias is paid a median 1.7 h more per day than his route is planned to take, and on one day in ten he is paid 3.7 h more. Everyone else lands inside ±0.4 h. A planner that treats all four techs as one pace will keep producing this.

## Is the paid day door-to-door, or first job to last job?

Medians per tech, in minutes, on clean days only. Nine days with stamps after 18:30 were excluded, because a tech closing jobs out in the app late inflates the stamped span and destroys the gap. On 08-25 three techs stamped past 21:00 while all three had clocked out by 6:01 PM. The exclusion is deliberately conservative: some late stamps are real work, and comparing the clock-out against the last stamp is what tells the two apart.

| Tech | clock-in → first stamp | last stamp → clock-out | paid − stamped span (h) | clean days |
|---|---:|---:|---:|---:|
| Alias Franks | 11 | 1 | +0.2 | 17 |
| Luke LaVergne | 11 | 1 | +0.2 | 21 |
| Robert Norton | 10.5 | 2 | +0.2 | 22 |
| Tavis Alexander | 8.5 | 3 | +0.2 | 22 |
| All hourly | 11 | 2 | +0.2 | 82 |

**The paid day is first job to last job, not door-to-door.** The clock starts a median 11 minutes before the first completion stamp, which is about the time it takes to arrive and work the first property, and stops within 2 minutes of the last stamp. The paid span exceeds the stamped span by 0.2 h for every tech, with a p10 of 0.0 and a p90 of 0.6. There is no morning block of paid commute in this data, and none in the evening.

Two consequences for the design. The drive from home to stop 1 and home from the last stop is real cost to the tech and invisible to payroll, so a plan that lengthens it is free in hours and not free in retention. And because the clock tracks the stamps this tightly, stamped span is a sound proxy for paid hours on any day without evening stamping, which is most days.

The p90 tail is one-sided. Tavis's clock-out runs 65 min past his last stamp at p90, against 2 to 18 min for the others, and his notes name the cause on two of them, a T-Mobile meeting and a no-reception day.

## Every RED day

25 RED days. `span` means paid over 10 h, `overtime` means the 40-hour week was already crossed.

| Date | Tech | Paid | OT | Cause | Planned stops / span | Done stops / span | Note |
|---|---|---:|---:|---|---:|---:|---|
| 08-26 wed | Alias | 12.52 | 0 | span | 22 / 8.31 | 25 / 12.35 | Forgot to clock in |
| 08-19 wed | Alias | 12.28 | 0 | span | 22 / 8.33 | 27 / 12.32 | |
| 08-18 tue | Alias | 11.87 | 0 | span | 26 / 9.75 | 28 / 11.66 | |
| 09-16 wed | Alias | 11.87 | 0 | span | 26 / 10.21 | 27 / 11.55 | Forgot to clock out lol |
| 08-28 fri | Alias | 11.38 | 11.38 | span+OT | 28 / 9.28 | 29 / 11.01 | |
| 08-27 thu | Alias | 11.05 | 2.82 | span+OT | 24 / 8.41 | 25 / 10.86 | |
| 09-10 thu | Alias | 10.77 | 0 | span | 23 / 8.79 | 23 / 10.48 | |
| 09-18 fri | Alias | 10.77 | 10.77 | span+OT | outside plan window | | |
| 09-15 tue | Alias | 10.68 | 0 | span | 26 / 10.19 | 28 / 10.33 | Forgot to clock in |
| 09-04 fri | Robert | 10.55 | 1.98 | span+OT | 25 / 8.40 | 27 / 10.26 | Did not clock in upon first stop arrival |
| 09-10 thu | Luke | 10.45 | 0 | span | 18 / 8.15 | 19 / 10.13 | |
| 08-25 tue | Tavis | 10.33 | 0 | span | 28 / 10.90 | 33 / 13.33 | |
| 09-02 wed | Alias | 10.28 | 0 | span | 21 / 8.62 | 22 / 10.07 | Forgot to clock in |
| 08-27 thu | Robert | 10.20 | 0 | span | 23 / 8.21 | 25 / 9.92 | |
| 09-09 wed | Alias | 10.20 | 0 | span | 23 / 8.04 | 24 / 9.88 | Forgot to clock in |
| 09-01 tue | Alias | 10.08 | 0 | span | 28 / 10.88 | 27 / 9.79 | Forgot to clock in |
| 09-01 tue | Tavis | 10.05 | 0 | span | 30 / 10.48 | 32 / 9.94 | |
| 08-21 fri | Alias | 9.35 | 9.35 | overtime | 27 / 9.12 | 26 / 9.16 | |
| 09-18 fri | Luke | 9.33 | 2.00 | overtime | outside plan window | | |
| 08-28 fri | Tavis | 8.97 | 3.37 | overtime | 29 / 10.47 | 31 / 9.25 | forgot to punch out |
| 09-04 fri | Tavis | 8.97 | 3.52 | overtime | 20 / 7.67 | 25 / 8.62 | |
| 08-20 thu | Alias | 8.83 | 2.55 | overtime | 23 / 8.39 | 23 / 8.72 | Forgot to clock in |
| 09-04 fri | Alias | 8.57 | 5.38 | overtime | 26 / 9.10 | 25 / 8.02 | |
| 09-04 fri | Luke | 8.28 | 3.65 | overtime | 22 / 8.00 | 23 / 7.77 | |
| 08-28 fri | Robert | 7.32 | 1.97 | overtime | 20 / 6.42 | 22 / 7.15 | Forgot to clock in |

By tech: **Alias 15 RED days of 23**, Tavis 4 of 24, Robert 3 of 23, Luke 3 of 22.

Every RED day in the bottom third of that table is a Friday under 9.5 paid hours. Gusto books overtime against the day the 40-hour line is crossed, so a normal Friday can be recorded as 100% overtime with zero regular hours. Those days are not long days. They are the bill for Monday to Thursday. The ledger carries `redCause` and `otIsWeeklySpillover` so the two never get confused.

**Overtime is a weekly signal, not a daily one.** The binding constraint is the 40-hour week, not the 10-hour day. A planner that balances days to 8.5 h and ignores the week will still buy overtime on Friday.

## Reading

**Alias Franks is the finding.** Zero successful weeks out of five, 15 RED days, and 42.6 hours of overtime against 4.0 for Robert, 5.7 for Luke and 8.7 for Tavis. His median paid day is 10.0 h against a median planned span of 8.4 h. He is not carrying more stops than the others — 125 planned stops in his heaviest week against Tavis's 142 — he is taking longer per stop and finishing late.

Treat the clock hygiene carefully. Eleven of his 24 paid days carry a "forgot to clock in" or "forgot to clock out" note, far more than anyone else, so the raw hours deserve suspicion. They survive it. His paid span exceeds his stamped span by a median of 0.2 h, the same as every other tech, and on his two longest days the clock and the stamps agree independently: 08-19 clocks out at 7:37 PM against a last stamp of 19:36, and 08-26 at 7:47 PM against 19:51. Those late stamps are real work, not app catch-up, and the time clock is what proves it.

**Robert and Tavis are the healthy pattern,** three successful weeks each. Both are also the fastest per paid hour, 3.0 and 3.3 stops, against Luke's 2.4 and Alias's 2.6.

**The unsuccessful weeks split two ways.** Alias's five and Tavis's 08-24 and 08-31 are genuine capacity failures, where long days ran the week past 40 hours. Luke's 08-31 and 09-14 and Robert's 08-24 and 08-31 are near misses, 2.0 to 3.7 hours of overtime with at most one RED day, the kind a slightly lighter Thursday would erase.

**The two quiet weeks are explained, not clean.** Everyone's 09-07 week looks lighter because Labor Day removed a day. Luke's 08-24 week reads successful at 33.1 paid hours partly because he was out on 08-28 and Cory absorbed his 20 stops for free, salaried.

**What S2b hands the design.** Use paid hours as the week's success label, not the day's. Hold the week under 40 and the day under 10, and treat per-tech pace as a planning input, because one tech is being paid 1.7 h a day more than his plan assumes and no amount of day-level balancing at a shared pace will find it.
