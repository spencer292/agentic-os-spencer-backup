# S2c — GPS ground truth

**Window** 2026-08-17 .. 2026-09-17 (Pacific, PDT/UTC-7 throughout).
**Built by** `scripts/gps-ground-truth.mjs` → `data/gps-ground-truth.json`, `data/cycle-times-gps.json`, log at `data/gps-ground-truth.log`.
**Capacity re-run** `scripts/demand-model.mjs --cycle=data/cycle-times-gps.json --out=demand-model-gps.json` → `data/demand-model-gps.json`, log at `data/demand-model-gps.log`.

Inputs: 6 trackers, 1,126 trips, 3,637 stops (75 exact duplicate rows in the feed, dropped), plus Jobber jobs/visits, `plan-vs-actual.json`, `route-day-ledger.json` (Gusto paid hours) and the stamp-derived `route-day-drive_2026-08-17_2026-09-17.json`.

## Method, and why trips are not the drive record

Only the **2022 Ranger** (Tavis) turns the engine off at customers. The other four idle through their stops, so their trips do **not** split at a visit — one trip swallows every idling stop inside it. On 2026-09-02 Cory's truck logged 28 stops but only 3 trips. Summing trip minutes as "drive" would therefore double-count the on-site time for four of five techs.

So **stops are the visit record**, and drive is derived as span minus dwell. Trips are used only for a day's first departure or last arrival when no base stop is present, and their miles are reported for reference.

Cleaning: idling under 2 min dropped as traffic (32 stops); adjacent stops within 4 min and 120 m merged into one dwell (433 merges); any dwell over 120 min reclassified `PARKED`, because a mole check is never two hours (this caught Alias's truck sitting in Sammamish for 70 hours over the weekend of 08-21, which had been scoring as a customer visit).

## Truck → tech

One truck, one tech, all 23 field weekdays each. No truck ever matched a different tech.

| Truck | Tech | Basis | Field stops | Match share |
|---|---|---|---:|---:|
| 2022 Ranger | Tavis Alexander | tracker `appDriverName` + proximity | 648 | 89.7% |
| white ranger | Robert Norton | proximity (150 m, same date) | 574 | 85.2% |
| Maverick 2024 | Cory Ventura | proximity | 604 | 83.6% |
| maverick 2026 | Alias Franks | proximity | 650 | 82.2% |
| Luke Lavergne | Luke LaVergne | truck named for the tech + proximity | 493 | 84.0% |

Weekly match share never drops below 80.6% and never exceeds 93.0%; the runner-up tech scores 0 or 1 stops on essentially every day, so the assignment is not close. The sixth tracker, `lost??`, produced no stops at all in the window.

Six truck-days carry no customer match: four weekend or Labor Day days, plus two real weekday gaps. **Luke LaVergne 2026-08-28** — his truck did not move at all and he stamped nothing, the absence the ledger already records with Cory covering. **Cory Ventura 2026-09-04** — his truck made two local stops and he stamped nothing. One GPS-flagged cover day: **Tavis 2026-08-21**, working a median 32.6 km from his own ground against a usual 9.1 km.

## Home locations

This answers the open "tech home cities" question. The medoid of each truck's overnight stops, with the share of nights spent there:

| Tech | Home | Nights at home |
|---|---|---:|
| Alias Franks | Ludwig Rd, **Snohomish 98290** | 25/26 (96%) |
| Tavis Alexander | SE Green Valley Rd, **Auburn 98092** | 25/25 (100%) |
| Cory Ventura | 155th St E, **Buckley 98321** | 28/31 (90%) |
| Robert Norton | SE 268th St, **Maple Valley 98038** | 22/24 (92%) |
| Luke LaVergne | 45th St E, **Edgewood 98372** | 23/23 (100%) |

Alias garages 43 min from the ground he works. He lives in Snohomish and runs Bellevue, Kirkland and Sammamish.

## The depot is Spencer's own property

One shared company location clears the bar of three or more trucks on four or more days with real dwell:

**35705 Cumberland Way SE, Enumclaw 98022** — 4 trucks, 18 calls, 10 days, 2,101 minutes total, longest single stay 892 min (a truck slept there). The nearest Jobber record is 19 m away: job **#7778, client "Spencer Hill", line item "Barter"**.

There is no other depot. The fleet is home-garaged and this address is the meet-up and load-out point. Classifying it before the customer test matters, because the barter job on it would otherwise have counted 18 overnight and meet-up stays as customer visits.

Everything else non-customer is fuel, food and errands: the biggest recurring ones are 5003 Pacific Highway E, Fife (Robert, 4 days, median 129 min — a shop stay), 1323 E Main Ave, Puyallup (Cory, 3 days, median 158 min) and 202 Avenue D, Snohomish (Alias, 16 calls over 15 days, median 5.7 min — a daily stop two minutes from his house).

## Per-tech week

Hours are summed over the week; `work` is door-to-door minus any errand before the first job or after the last.

| Tech | Week | Days | Stops | d2d | work | first→last | on-site | drive | commute | other | paid |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Alias Franks | 08-17 | 5 | 112 | 53.7 | 52.9 | 47.1 | 27.7 | 16.6 | 5.9 | 3.5 | 51.9 |
| | 08-24 | 5 | 120 | 62.6 | 59.8 | 53.2 | 35.1 | 15.9 | 6.6 | 5.0 | 54.2 |
| | 08-31 | 5 | 116 | 55.1 | 53.2 | 45.7 | 28.7 | 15.8 | 7.5 | 3.0 | 45.4 |
| | 09-07 | 4 | 90 | 45.4 | 44.6 | 38.9 | 24.9 | 13.0 | 5.7 | 1.8 | 38.9 |
| | 09-14 | 4 | 100 | 46.5 | 45.7 | 39.8 | 25.4 | 13.5 | 5.9 | 1.8 | 40.3 |
| Cory Ventura | 08-17 | 5 | 117 | 46.9 | 40.9 | 34.9 | 17.9 | 16.0 | 6.0 | 6.9 | — |
| | 08-24 | 5 | 117 | 45.8 | 40.4 | 34.1 | 17.1 | 15.8 | 6.3 | 6.6 | — |
| | 08-31 | 4 | 90 | 32.5 | 31.8 | 25.6 | 13.7 | 11.0 | 6.2 | 1.6 | — |
| | 09-07 | 4 | 93 | 31.7 | 31.3 | 25.5 | 13.8 | 11.3 | 5.8 | 0.9 | — |
| | 09-14 | 4 | 103 | 34.6 | 33.2 | 27.8 | 14.9 | 11.2 | 5.4 | 3.1 | — |
| Luke LaVergne | 08-17 | 5 | 96 | 49.6 | 48.1 | 40.9 | 21.5 | 18.0 | 7.2 | 2.8 | 39.8 |
| | 08-24 | 4 | 75 | 45.5 | 41.9 | 35.2 | 17.9 | 16.7 | 6.7 | 4.3 | 33.1 |
| | 08-31 | 5 | 92 | 53.5 | 50.7 | 43.7 | 24.7 | 17.9 | 7.0 | 3.9 | 43.7 |
| | 09-07 | 4 | 81 | 45.7 | 42.4 | 37.0 | 20.3 | 15.0 | 5.4 | 4.9 | 37.7 |
| | 09-14 | 4 | 81 | 43.0 | 42.0 | 35.4 | 18.2 | 15.9 | 6.6 | 2.3 | 32.7 |
| Robert Norton | 08-17 | 5 | 98 | 53.4 | 47.5 | 42.2 | 26.4 | 11.9 | 5.3 | 9.8 | 39.1 |
| | 08-24 | 5 | 117 | 48.4 | 47.6 | 42.2 | 29.3 | 11.2 | 5.5 | 2.3 | 42.0 |
| | 08-31 | 5 | 112 | 48.1 | 47.4 | 41.2 | 27.2 | 12.0 | 6.3 | 2.7 | 42.0 |
| | 09-07 | 4 | 86 | 42.9 | 39.4 | 33.3 | 22.2 | 9.3 | 6.1 | 5.4 | 33.8 |
| | 09-14 | 4 | 83 | 37.6 | 35.8 | 29.1 | 17.7 | 10.5 | 6.7 | 2.7 | 28.8 |
| Tavis Alexander | 08-17 | 5 | 121 | 49.6 | 48.2 | 39.1 | 21.3 | 16.7 | 9.2 | 2.4 | 40.8 |
| | 08-24 | 5 | 137 | 50.4 | 50.3 | 41.8 | 21.4 | 18.5 | 8.5 | 2.0 | 43.4 |
| | 08-31 | 5 | 131 | 51.4 | 50.4 | 42.7 | 22.6 | 19.2 | 7.8 | 1.8 | 43.5 |
| | 09-07 | 4 | 93 | 37.5 | 37.2 | 30.1 | 17.1 | 12.4 | 7.2 | 0.8 | 30.9 |
| | 09-14 | 4 | 106 | 39.3 | 39.2 | 31.7 | 16.5 | 14.4 | 7.5 | 0.9 | 33.1 |

Across all 113 field route-days: 1,150 h door-to-door, 938 h first-to-last, 544 h on-site, 360 h driving inside the route, 164 h commuting, 83 h on errands.

## On-site per stop, against the directed service times

The directed numbers are the 2026-08-15 rule: Cory 12 min check / 24 set, everyone else 15/30.

| Tech | p25 | median | p75 | p90 | Directed check | GPS − directed | n stops |
|---|---:|---:|---:|---:|---:|---:|---:|
| Alias Franks | 9.2 | **14.3** | 20.3 | 27.5 | 15 | −0.7 | 538 |
| Robert Norton | 8.2 | **12.3** | 18.4 | 26.5 | 15 | −2.7 | 496 |
| Luke LaVergne | 9.2 | **12.2** | 17.3 | 25.4 | 15 | −2.8 | 425 |
| Tavis Alexander | 6.1 | **9.0** | 12.7 | 16.5 | 15 | −6.0 | 588 |
| Cory Ventura | 5.1 | **8.1** | 11.2 | 15.3 | 12 | −3.9 | 520 |

Every tech is under their directed time, Tavis by 6 minutes. The spread between techs is 1.8× (8.1 to 14.3). The spread *within* a tech is wider than that: Alias runs 9.2 at p25 and 20.3 at p75, a 2.2× range on the same person.

## Drive per stop, inside the route

| Tech | Drive min per stop | Route-day median |
|---|---:|---|
| Robert Norton | 6.5 | densest ground |
| Cory Ventura | 7.1 | |
| Tavis Alexander | 8.1 | |
| Alias Franks | 8.5 | |
| Luke LaVergne | 11.9 | peninsula and Olympia |

Luke drives 83% more per stop than Robert. This is the number the old "compare techs by visit count" habit destroys, and it is why hours, never counts, is the comparison.

## How far the stamps were off

Per tech, median over their route-days, in minutes:

| Tech | stamp span − GPS first→last | GPS on-site − stamp service | GPS drive − stamp drive | GPS stops − Jobber visits |
|---|---:|---:|---:|---:|
| Alias Franks | −10.4 | −18.3 | +67.8 | −1 |
| Tavis Alexander | −7.7 | −170.7 | +262.4 | −1 |
| Cory Ventura | −14.6 | −116.8 | +211.8 | −2 |
| Luke LaVergne | −19.0 | −48.4 | +200.9 | −1 |
| Robert Norton | −9.2 | −46.0 | +103.2 | −2 |

The **span** was close: the stamps understate the route by 8 to 19 minutes a day, because GPS sees the arrival before the tech stamps and the departure after. The **composition** was badly wrong. `route-day-drive` derives service as 15 min × stops and calls the remainder drive, so for Tavis it credits 2.8 h of on-site that never happened and hides 4.4 h of driving. Any design that reasons about "how much of the day is service" off the stamp file is reasoning off an assumption, not a measurement.

GPS records 2,567 physical customer stops against 2,793 Jobber completed visits, a 92% hit rate. The gap is not missed work: several jobs sit on one property (Barbee Mill is 11 jobs at one address). The cycle time handed to the model is therefore **per Jobber visit**, not per GPS stop, so it is like-for-like with what the model counts.

## Paid time is first-job-to-last-job, not door-to-door

Over 91 clocked field days (Cory is salaried and excluded):

| Comparison | Median | p25 | p75 |
|---|---:|---:|---:|
| paid − door-to-door | −97.3 min | −127.1 | −72.5 |
| paid − first-to-last | **+1.4 min** | −4.2 | +9.0 |
| clock-in − leaving home | +40.9 min | +32.4 | +49.8 |
| clock-out − arriving home | −48.9 min | −71.8 | −37.2 |

Techs clock in when they reach the first job and clock out at the last. Paid hours reproduce the route span to within a minute and a half at the median. The commute at both ends, a median 70 to 105 min per tech per day, is unpaid and invisible to every existing model. That is a fact about how the day is recorded, and it should go to the HR seat before any territory change moves a tech's ground farther from their house.

## Capacity under P2, GPS vs stamp

P2 is the live rule: weekly after a catch, a miss or any activity; monthly when quiet; Quick Fix held weekly. Both runs use the same 589.6 visits per week, so the only thing that moves is the cycle time.

| | Stamp-based | GPS-based | Change |
|---|---:|---:|---:|
| Hours per week | 199.4 | **195.2** | −4.2 |
| vs 200 h (25 route-days × 8 h) | −0.6 | −4.8 | |
| Utilisation at 8 h | 99.7% | 97.6% | |
| Route-days over 8 h | 11 | **10** | −1 |
| Route-days over 9 h | 9 | **7** | −2 |
| Tech-days needed at 8 h | 24.9 | 24.4 | −0.5 |

The ten route-days over 8 h on GPS cycle times: Alias every weekday (8.6, 8.9, 12.2, 10.5, 9.6), Cory Monday (9.0), Luke Monday and Thursday (10.7, 9.8), Robert Friday (12.3), Tavis Friday (9.2). Alias Wednesday at 12.2 h and Robert Friday at 12.3 h are the two that cannot be absorbed by sequencing.

The headline moves very little, and that is itself the finding: **the stamp-derived span was a good estimate of the route, so the capacity number was roughly right for the wrong reasons.** What changes is everything underneath it.

Observed baselines now agree at 615 stops per week, 207.6 h (GPS) against 207.9 h (stamps).

## The three facts the design must change

**1. The route is not the day, and the model only ever costed the route.** Door-to-door exceeds first-to-last by a median 70 min (Robert) to 105 min (Tavis) — 164 h across the month, 17.5% on top of the 938 h of route time. Alias's median day is 11.6 h door-to-door for a 10.1 h route. A capacity rule that caps the route at 8 h is capping an Alias day at 9.5 h and a Tavis day at 9.8 h. The design must carry home coordinates per tech and cost the commute legs explicitly, because the tech's home is what makes an 8 h route a 10 h day. The home coordinates now exist; use them as the route start and end, not the first stop.

**2. A single service time per tech is the wrong shape.** The directed 12/15 minutes are all too high, by 0.7 to 6.0 min, so the planner is padding every stop and then wondering why the day runs short. But replacing the constant with a better constant does not fix it: the within-tech spread (Alias 9.2 at p25 to 20.3 at p75) is wider than the between-tech spread (8.1 to 14.3). On-site time is driven by the property, not by the person. The design should carry a per-job on-site estimate learned from that job's own GPS history, with the tech median as the fallback, and should stop treating "check" and "set" as the only two durations.

**3. Paid capacity and route capacity are different quantities, and the model has been conflating them.** Paid hours track the route span to within 1.4 min, so an hour added at the end of a route is an hour of payroll; an hour added by moving a territory farther from a tech's house is free to the payroll and expensive to the tech. Right now nothing in the model can see that difference, so a territory re-cut optimised on route hours will silently lengthen unpaid days — and Alias, at 43 min each way from Snohomish to Sammamish, is already the worst case. The design needs two ceilings, a paid-hours ceiling on the route span and a door-to-door ceiling on the day, with the second binding first for Alias, Luke and Tavis.

## Caveats

- One truck-day is a genuine outlier rather than a defect: **Robert 2026-08-19** left his last customer at 13:58 and reached home at 21:37, with 338 min of stops in Gig Harbor, Fife and Seattle in between. Door-to-door reads 15.0 h; the working span is 9.4 h. Any door-to-door median should be read alongside the `workingSpanMin` column.
- Cory is salaried and files no Gusto rows, so he is absent from every paid-time comparison. His route numbers are complete.
- The window holds one 4-day week (Labor Day, 2026-09-07) and one absence with cover (Luke out 2026-08-28, Cory covering). Weekly totals for those weeks are not comparable to the 5-day weeks.
- Match share tops out at 93%: roughly one stop in seven does not land within 150 m of a visit that tech stamped that day. Those are classified from the customer geofence or the nearest job property where possible, and the remainder sit in `OTHER`.
