# S2 — Plan versus actual

Ground truth for the route-engine redesign, interim until FleetSharp GPS arrives. The
OptimoRoute plan as it was held for each day, joined stop-by-stop to the Jobber completion
stamps for the same window.

- Join: `scripts/join-plan-actual.mjs` → `data/plan-vs-actual.json` (1.5 MB)
- Log: `data/join-plan-actual.log`
- Window: 2026-08-17 .. 2026-09-17, 24 route-day files, 113 planned route-days, 2,577 planned stops, 2,793 Jobber completions

## The join key holds

OptimoRoute's `orderNo` is `<jobNumber>-<visitNumericId>`, and the numeric id is the tail of
the base64-decoded Jobber visit gid (`Z2lkOi8vSm9iYmVyL1Zpc2l0LzIyOTE5MTQzNzY=` →
`gid://Jobber/Visit/2291914376` → `5602-2291914376`). Every one of the 2,793 completions
produced a key, and 2,548 of 2,577 planned stops (98.9%) resolved to one. No planned order
appeared on two different days, so the key is unique on both sides and the remaining 29 are
genuine never-completed stops, not join failures.

## What the plan gets right, and what it does not

**The day and the tech are close to true. The clock is not.** 97.2% of planned stops were
completed the same day by the same tech. But of those matched stops, only 42% landed within
30 minutes of their planned slot, and the median absolute error is 38 minutes.

| Measure | Value |
|---|---:|
| Matched (same day, same tech) | 2,506 of 2,577 — 97.2% |
| Moved to another day | 11 — 0.4% |
| Completed by another tech | 31 — 1.2% |
| Ghost (never completed in window) | 29 — 1.1% |
| Off-map completions (no planned stop anywhere) | 245 |
| Arrival delta, median | −5.6 min |
| Arrival delta, absolute median / p90 | 37.8 / 104.4 min |
| Stops within ±15 / ±30 / ±60 min of plan | 21% / 42% / 71% |

Arrival delta is the completion stamp minus the planned **departure** (planned arrival plus
service), because a Jobber stamp is a completion, not an arrival. Measured against planned
arrival instead, the median is +8.7 min, which is just the service time reappearing.

## Weekly

| Week | Route-days | Stops planned | Matched | Moved day | Moved tech | Ghosts | Off-map | Completed | Evening stamps |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2026-08-17 | 26 | 570 | 97.7% | 1.1% | 0.4% | 5 | 44 | 609 | 4 |
| 2026-08-24 | 25 | 576 | 95.5% | 0.3% | 3.5% | 4 | 32 | 604 | 9 |
| 2026-08-31 | 24 | 553 | 98.4% | 0.2% | 0.4% | 6 | 36 | 583 | 0 |
| 2026-09-07 | 20 | 454 | 97.6% | 0.2% | 1.1% | 5 | 27 | 476 | 1 |
| 2026-09-14 | 20 | 424 | 97.2% | 0.2% | 0.5% | 9 | 106 | 521 | 1 |

Three of these numbers are artifacts, not operations:

- **The 106 off-map in the week of 09-14 is a capture defect.** The plan snapshot for
  2026-09-14 holds 52 stops across 5 routes where every other Monday holds 119 to 130. The
  history pull ran on 09-18, by which time most of that day's orders were gone from
  OptimoRoute. Eighty of the 106 sit on that one date. Exclude it and off-map runs 5 to 13 a
  day, median 8, roughly 6% of completed volume.
- **The 3.5% moved-tech in the week of 08-24 is one swap.** On Friday 08-28 Cory Ventura
  worked all 20 of Luke LaVergne's planned stops. Across the whole window that leaves 11
  genuine tech changes, under 0.5%.
- **2026-09-07 is Labor Day** and 2026-08-28 and 2026-09-04 carry 4 planned routes, not 5.

## Golden week 2026-08-24

| Date | Tech | Stops plan/done | Planned span | Actual span | Δ span | Planned drive | Stamp drive | Ghost | Unplanned in | Evening |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2026-08-24 | Alias Franks | 27/27 | 539.9 | 553 | +13.1 | 134.9 | 163 | 0 | 0 | 0 |
| 2026-08-24 | Cory Ventura | 30/30 | 502.2 | 457.3 | −44.9 | 130.2 | 85.3 | 1 | 1 | 0 |
| 2026-08-24 | Luke LaVergne | 23/23 | 592.3 | 486.5 | −105.8 | 232.3 | 141.5 | 0 | 0 | 0 |
| 2026-08-24 | Robert Norton | 23/22 | 465.4 | 519.4 | +54 | 120.4 | 204.4 | 1 | 0 | 0 |
| 2026-08-24 | Tavis Alexander | 27/26 | 530 | 463.9 | −66.1 | 125 | 73.9 | 0 | 0 | 0 |
| 2026-08-25 | Alias Franks | 19/22 | 437.2 | 828.8 | +391.6 | 137.2 | 243.2 | 0 | 3 | 1 |
| 2026-08-25 | Cory Ventura | 23/23 | 434.8 | 334.3 | −100.5 | 158.8 | 70.3 | 0 | 0 | 0 |
| 2026-08-25 | Luke LaVergne | 17/17 | 497.6 | 479 | −18.6 | 227.6 | 97.7 | 0 | 0 | 0 |
| 2026-08-25 | Robert Norton | 27/30 | 552.1 | 862.3 | +310.2 | 147.1 | 7.6 | 0 | 3 | 1 |
| 2026-08-25 | Tavis Alexander | 28/33 | 653.7 | 799.7 | +146 | 188.7 | 40.4 | 0 | 5 | 1 |
| 2026-08-26 | Alias Franks | 22/25 | 498.4 | 741.1 | +242.7 | 168.4 | 336.1 | 0 | 3 | 4 |
| 2026-08-26 | Cory Ventura | 20/20 | 326.5 | 254.3 | −72.2 | 86.5 | 26.3 | 0 | 0 | 0 |
| 2026-08-26 | Luke LaVergne | 14/14 | 437.1 | 396.6 | −40.5 | 227.1 | 186.6 | 0 | 0 | 0 |
| 2026-08-26 | Robert Norton | 25/26 | 476.4 | 445.8 | −30.6 | 101.4 | 55.8 | 0 | 1 | 0 |
| 2026-08-26 | Tavis Alexander | 32/33 | 568.3 | 442.5 | −125.8 | 120.3 | −4.8 | 0 | 1 | 0 |
| 2026-08-27 | Alias Franks | 24/25 | 504.9 | 651.8 | +146.9 | 144.8 | 276.8 | 0 | 1 | 0 |
| 2026-08-27 | Cory Ventura | 29/33 | 487.7 | 509 | +21.3 | 139.7 | 89 | 0 | 4 | 0 |
| 2026-08-27 | Luke LaVergne | 20/21 | 494.6 | 565.3 | +70.7 | 194.6 | 141 | 1 | 2 | 0 |
| 2026-08-27 | Robert Norton | 23/25 | 492.6 | 595.3 | +102.7 | 132.6 | 220.3 | 0 | 2 | 0 |
| 2026-08-27 | Tavis Alexander | 26/26 | 530.2 | 457.9 | −72.3 | 140.2 | 67.9 | 1 | 2 | 0 |
| 2026-08-28 | Alias Franks | 28/29 | 556.6 | 660.6 | +104 | 121.6 | 225.6 | 0 | 1 | 2 |
| 2026-08-28 | Cory Ventura | 0/21 | — | 290.4 | — | — | 50.4 | — | — | 0 |
| 2026-08-28 | Luke LaVergne | 20/0 | 426.9 | — | — | 126.9 | — | — | — | — |
| 2026-08-28 | Robert Norton | 20/22 | 384.9 | 429 | +44.1 | 84.9 | 84 | 0 | 2 | 0 |
| 2026-08-28 | Tavis Alexander | 29/31 | 628.1 | 555.2 | −72.9 | 193.1 | 90.2 | 0 | 2 | 0 |

Week totals: planned span 12,018 min against actual 12,779, planned drive 3,584 against
stamp-derived 2,973.

## Golden week 2026-08-31

| Date | Tech | Stops plan/done | Planned span | Actual span | Δ span | Planned drive | Stamp drive | Ghost | Unplanned in | Evening |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2026-08-31 | Alias Franks | 25/25 | 497.9 | 467.2 | −30.7 | 122.9 | 107.2 | 0 | 0 | 0 |
| 2026-08-31 | Cory Ventura | 27/26 | 478.3 | 359.3 | −119 | 118.3 | 23.3 | 1 | 0 | 0 |
| 2026-08-31 | Luke LaVergne | 18/20 | 491.2 | 513.7 | +22.5 | 191.2 | 183.7 | 0 | 2 | 0 |
| 2026-08-31 | Robert Norton | 21/21 | 428.5 | 357.4 | −71.1 | 113.5 | 57.4 | 0 | 0 | 0 |
| 2026-08-31 | Tavis Alexander | 28/29 | 565.7 | 457 | −108.7 | 130.7 | 22 | 0 | 1 | 0 |
| 2026-09-01 | Alias Franks | 28/27 | 652.5 | 587.4 | −65.1 | 172.5 | 152.4 | 0 | 0 | 0 |
| 2026-09-01 | Cory Ventura | 22/22 | 431.3 | 383.7 | −47.6 | 143.3 | 107.7 | 0 | 0 | 0 |
| 2026-09-01 | Luke LaVergne | 25/24 | 634.2 | 555.5 | −78.7 | 259.2 | 110.7 | 1 | 0 | 0 |
| 2026-09-01 | Robert Norton | 25/25 | 524.5 | 513.5 | −11 | 149.5 | 153.5 | 0 | 0 | 0 |
| 2026-09-01 | Tavis Alexander | 30/32 | 628.9 | 596.2 | −32.7 | 163.9 | 71.1 | 1 | 3 | 0 |
| 2026-09-02 | Alias Franks | 21/22 | 517.3 | 604 | +86.7 | 172.3 | 259 | 0 | 1 | 0 |
| 2026-09-02 | Cory Ventura | 23/29 | 358.1 | 383.5 | +25.4 | 82.1 | −12.5 | 0 | 6 | 0 |
| 2026-09-02 | Luke LaVergne | 15/17 | 459.3 | 532 | +72.7 | 219.3 | 232 | 1 | 3 | 0 |
| 2026-09-02 | Robert Norton | 22/22 | 450.5 | 448.9 | −1.6 | 120.5 | 133.9 | 0 | 0 | 0 |
| 2026-09-02 | Tavis Alexander | 23/24 | 398.9 | 380.7 | −18.2 | 89.9 | 57.6 | 0 | 1 | 0 |
| 2026-09-03 | Alias Franks | 21/21 | 471.5 | 493.1 | +21.6 | 156.5 | 193.1 | 0 | 0 | 0 |
| 2026-09-03 | Cory Ventura | 22/24 | 364 | 374 | +10 | 100 | 86 | 0 | 2 | 0 |
| 2026-09-03 | Luke LaVergne | 17/20 | 411.2 | 533.3 | +122.1 | 156.2 | 89.8 | 0 | 4 | 0 |
| 2026-09-03 | Robert Norton | 25/26 | 512.9 | 515.9 | +3 | 122.9 | 125.9 | 0 | 1 | 0 |
| 2026-09-03 | Tavis Alexander | 22/27 | 489.3 | 516.8 | +27.5 | 144.3 | 96.8 | 1 | 6 | 0 |
| 2026-09-04 | Alias Franks | 26/25 | 545.7 | 481.3 | −64.4 | 155.7 | 121.3 | 0 | 0 | 0 |
| 2026-09-04 | Luke LaVergne | 22/23 | 480.1 | 466.2 | −13.9 | 135.1 | 136.2 | 0 | 1 | 0 |
| 2026-09-04 | Robert Norton | 25/27 | 504 | 615.5 | +111.5 | 129 | 180.5 | 1 | 3 | 0 |
| 2026-09-04 | Tavis Alexander | 20/25 | 460.4 | 517.4 | +57 | 160.4 | 112.4 | 0 | 5 | 0 |

Week totals: planned span 11,756 min against actual 11,654, planned drive 3,509 against
stamp-derived 2,801.

**Read the drive columns with care.** Planned drive is the sum of OptimoRoute's inter-stop
legs, with the first stop's inbound leg excluded because it comes from an unknown origin.
Stamp drive is not a measurement: `route-day-drive` derives it as span minus assumed service
minus any gap over 90 minutes, so it inherits the directed service times and goes negative
whenever two stops share an address. Planned drive exceeds it by about 20% in both weeks,
which is consistent either with OptimoRoute overpricing travel or with real service running
longer than the directed minutes. Nothing in this data separates the two. That separation is
exactly what FleetSharp GPS is for.

## Arrival delta by driver

Delta is the completion stamp minus planned departure. A negative median means the tech
finishes ahead of the planned slot.

| Driver | Matched stops | Median | p10 | p90 | Absolute median | Within ±30 min |
|---|---:|---:|---:|---:|---:|---:|
| Alias Franks | 536 | +20.8 | −26.5 | +120.0 | 31.1 | 49% |
| Cory Ventura | 501 | +11.8 | −51.3 | +83.0 | 37.2 | 40% |
| Luke LaVergne | 397 | −34.5 | −80.5 | +55.8 | 44.5 | 27% |
| Robert Norton | 500 | −4.8 | −58.1 | +70.3 | 29.6 | 51% |
| Tavis Alexander | 572 | −31.0 | −103.1 | +37.0 | 43.3 | 38% |

The spread matters more than the centre. Luke and Tavis run consistently ahead of the plan,
Alias consistently behind, and the p10-to-p90 band is 128 to 146 minutes wide for every
driver. A plan built on these timings cannot support a customer arrival window tighter than
about two hours without GPS to tighten it.

Route-day span error is unbiased but noisy: across 107 route-days with both sides (excluding
09-14), the median span delta is +1.5 minutes, p10 −103 and p90 +113. Twenty-nine days ran
more than an hour long, twenty-eight more than an hour short.

## Worst 10 route-days by span overrun

| Date | Tech | Plan span | Actual span | Δ | Stops plan/done | First plan→actual | Last plan→actual | Reason |
|---|---|---:|---:|---:|---:|---|---|---|
| 2026-08-25 | Alias Franks | 437.2 | 828.8 | +391.6 | 19/22 | 07:13 → 07:27 | 14:30 → 21:16 | one 21:16 stamp after a 241-minute gap, plus 3 unplanned stops; the field day ended mid-afternoon |
| 2026-08-25 | Robert Norton | 552.1 | 862.3 | +310.2 | 27/30 | 07:15 → 07:05 | 16:27 → 21:28 | one 21:28 stamp after a 390-minute gap, plus 3 unplanned stops; evening admin, not work |
| 2026-09-09 | Luke LaVergne | 538.9 | 800.8 | +261.9 | 17/16 | 07:31 → 07:18 | 16:30 → 20:39 | one 20:39 stamp after a 204-minute gap; a single late close-out |
| 2026-09-14 | Luke LaVergne | 177.5 | 424.2 | +246.7 | 7/22 | 07:51 → 07:02 | 10:49 → 14:06 | plan capture defect — only 7 of 22 stops survived in the snapshot |
| 2026-08-26 | Alias Franks | 498.4 | 741.1 | +242.7 | 22/25 | 07:05 → 07:29 | 15:23 → 19:51 | 4 evening stamps to 19:51 and 3 unplanned stops; a genuinely long day |
| 2026-08-19 | Alias Franks | 499.7 | 739.1 | +239.4 | 22/27 | 06:56 → 07:17 | 15:16 → 19:36 | 3 evening stamps to 19:36 and 5 unplanned stops added to a 22-stop plan |
| 2026-09-14 | Robert Norton | 186.5 | 415.7 | +229.2 | 9/22 | 07:36 → 07:35 | 10:43 → 14:31 | plan capture defect — 9 of 22 stops in the snapshot |
| 2026-09-14 | Alias Franks | 248.9 | 471.9 | +223 | 13/28 | 07:17 → 07:28 | 11:26 → 15:20 | plan capture defect — 13 of 28 stops in the snapshot |
| 2026-09-14 | Cory Ventura | 168.1 | 381.5 | +213.4 | 10/32 | 07:39 → 07:38 | 10:27 → 13:59 | plan capture defect — 10 of 32 stops in the snapshot |
| 2026-09-14 | Tavis Alexander | 231.7 | 410.4 | +178.7 | 13/29 | 07:48 → 07:38 | 11:40 → 14:29 | plan capture defect — 13 of 29 stops in the snapshot |

Five of the ten are the 09-14 capture defect. Of the five real ones, four are driven by a
single evening stamp hours after the last field stop.

## Evening stamps are admin, not work

Only 15 stamps in the whole window land after 18:30, and 12 of them belong to Alias Franks.
Three of those days sit in the worst-10 table purely because of them. Any span or utilisation
figure must clip at 18:30 or it will read close-out paperwork as field time. The join carries
`spanToLastDayStopMin` alongside `spanMin` for exactly this.

## Ghosts cluster on the same customers

Twenty-nine planned stops were never completed anywhere in the window, and they are not
spread evenly. Becky Hohengarten (job #8261) was planned and dropped five separate times,
Aaron Rutledge (#8465) three, Darren Mccullough (#8266) twice. Luke LaVergne carried five
ghosts on 2026-09-15 alone. These read as problem jobs that keep getting re-scheduled and
skipped rather than as router error, and they are worth a separate look against the cadence
rules.

## Carry into the redesign

1. **Day and tech assignment is solid enough to backtest against.** 97.2% matched, and the
   residual is 11 genuine tech changes and 11 day moves.
2. **Planned clock times are not usable as a customer promise.** 58% of stops miss their
   planned slot by more than half an hour.
3. **Off-map work is real and steady at roughly 6% of daily volume**, 5 to 13 stops a day
   once 09-14 is excluded. The engine has to plan with headroom for it, not treat it as noise.
4. **Re-pull 2026-09-14** if that Monday is wanted as evidence. OptimoRoute history decays,
   so any future plan snapshot has to be taken the same day it is held, not weeks later.
5. **Drive time stays unresolved.** Plan says 20% more drive than the stamp residual leaves
   room for, and stamps cannot tell drive from service. FleetSharp closes this, nothing else
   here will.
