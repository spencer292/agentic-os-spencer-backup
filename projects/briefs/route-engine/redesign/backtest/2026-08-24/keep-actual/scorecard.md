# Backtest scorecard — 2026-08-24 · keep-actual

Oracle baseline — the tech and day each visit actually got.

| | |
|---|---|
| Golden week | 2026-08-24 (2026-08-24 .. 2026-08-28) |
| Plan-time cutoff | 2026-08-21T21:00:00.000Z (Friday 14:00 PT) |
| Policy | `keep-actual` — reads the oracle |
| Techs | Alias Franks, Cory Ventura, Luke LaVergne, Robert Norton, Tavis Alexander |
| Overall | **FAIL** |

## Gates

| Gate | Value | Result |
|---|---:|:---:|
| same tech >= 95% | 100 | PASS |
| same day >= 95% | 100 | PASS |
| route-day hours within +-10% | 21/24 (87.5%) | FAIL |
| route-day hours within +-10% (board only, same sequencer) _(advisory)_ | 24/24 (100%) | PASS |
| no dropped visits | 0 | PASS |
| no invented visits | 0 | PASS |
| no weekend placements | 0 | PASS |
| no route-day over 9.5 h (modelled travel + service) _(advisory)_ | 1 of 24 (actual: 3/24) | FAIL |
| route-day total time within +-5% of the OptimoRoute day (compactness) _(advisory)_ | 13/24 (54.2%) | FAIL |
| late bookings (created after the cutoff — the add-queue load) _(advisory)_ | 55 | PASS |

## Coverage

| Metric | Count |
|---|---:|
| Visits due and known at the cutoff | 552 |
| Late bookings (created after the cutoff, excluded) | 55 |
| Visits the policy placed | 552 |
| Dropped (due, never placed) | 0 |
| Invented (placed, not due) | 0 |
| Duplicate placements | 0 |
| Placed on a weekend | 0 |
| Placed outside the golden week | 0 |
| Due visits with no resolvable actual | 0 |
| OptimoRoute ghost orders (no Jobber visit) | 2 |

## Agreement with what ran

| Reference | n | Same tech | Same day | Both |
|---|---:|---:|---:|---:|
| Actual run (completion stamps) | 552 | 100% | 100% | 100% |
| OptimoRoute route as held | 551 | 96.9% | 99.6% | 96.6% |

## Hours per route-day

| Metric | Value |
|---|---:|
| Route-days with both a proposal and an actual | 24 |
| Within +-10% of actual | 21 (87.5%) |
| Median proposal/actual ratio | 0.96 |
| **Board only** — within +-10% when the actual day is re-sequenced by us | 24/24 (100%) |
| **Board only** — median ratio | 1 |
| Route-days only in the proposal | 0 |
| Route-days only in the actual | 0 |
| Total proposal hours | 190.7 |
| Total actual hours | 201.7 |
| Actual stop order taken from | OptimoRoute 549, completion stamps 3, schedule 0 |

The headline hours ratio moves for two reasons at once: a different board, and a different stop order. The **board only** row re-sequences the actual day with the same sequencer, so what remains is purely the board.

## Sequence quality (same stop set, two orders)

| Metric | Value |
|---|---:|
| Route-days compared | 24 |
| Median drive-time ratio (ours / OptimoRoute) | 0.87 |
| Median distance ratio | 0.85 |
| **Uniform-model control** — median drive ratio, estimator only | 0.92 |
| Legs our order has to estimate (median) | 42.6% |
| Legs OptimoRoute's order has to estimate (median) | 7.3% |
| Route-days we beat OptimoRoute on drive time | 24 |
| Route-days OptimoRoute beat us | 0 |
| Route-days we beat it under the uniform control | 22 |
| Total drive minutes, ours vs OptimoRoute | 3430.2 vs 4088.4 |

Read the uniform-model control, not the headline ratio. OptimoRoute actually drove every leg in its own order, so those legs are real measurements in the travel model; any re-ordering invents legs nobody has driven and they fall back to a haversine estimator whose median per-leg error is around 20%. The headline ratio therefore flatters any re-ordering. The control times both orders with the estimator alone, so neither side gets that advantage.

## Design gates (S4 section 5)

This policy carries no due windows, so window compliance is not scored.

| Capacity and compactness | Proposal | Actual |
|---|---:|---:|
| Route-days | 24 | 24 |
| Over 8 h (modelled travel + service) | 13 | 16 |
| Over 9.5 h — the hard wall | 1 | 3 |
| Longest route-day, hours | 10.24 | 11.18 |
| Median route-day, hours | 8.09 | 8.22 |
| Route-day time within +-5% of the OptimoRoute day | 13/24 (54.2%) | - |
| Route-day ratio range | 0.87 - 1 | - |
| Overflow — could not fit under the wall | 0 | - |
| Late bookings — the add-queue load | 55 | - |

## Per-tech weekly hours

| Tech | Days | Stops | Proposal h | Actual h | Delta h |
|---|---:|---:|---:|---:|---:|
| Alias Franks | 5/5 | 116/116 | 40.9 | 43.2 | -2.3 |
| Cory Ventura | 5/5 | 116/116 | 34.9 | 36.2 | -1.3 |
| Luke LaVergne | 4/4 | 69/69 | 30.9 | 33.2 | -2.3 |
| Robert Norton | 5/5 | 115/115 | 38.4 | 39.7 | -1.3 |
| Tavis Alexander | 5/5 | 136/136 | 45.6 | 49.4 | -3.8 |

## Route-days

| Date | Dow | Tech | Stops p/a | Prop h | Act h | Ratio | +-10% | Board ratio | Seq drive p/a | Seq ratio |
|---|---|---|---:|---:|---:|---:|:---:|---:|---:|---:|
| 2026-08-24 | mon | Alias Franks | 26/26 | 8.71 | 9.08 | 0.96 | PASS | 1 | 132.4/154.7 | 0.86 |
| 2026-08-25 | tue | Alias Franks | 20/20 | 7.2 | 7.9 | 0.91 | PASS | 1 | 116.8/158.8 | 0.74 |
| 2026-08-26 | wed | Alias Franks | 22/22 | 8.06 | 8.69 | 0.93 | PASS | 1 | 153.4/191.6 | 0.8 |
| 2026-08-27 | thu | Alias Franks | 24/24 | 8.5 | 8.89 | 0.96 | PASS | 1 | 150.1/173.5 | 0.87 |
| 2026-08-28 | fri | Alias Franks | 24/24 | 8.45 | 8.62 | 0.98 | PASS | 1 | 132.1/142.1 | 0.93 |
| 2026-08-24 | mon | Cory Ventura | 27/27 | 7.24 | 7.42 | 0.98 | PASS | 1 | 110.7/121 | 0.91 |
| 2026-08-25 | tue | Cory Ventura | 23/23 | 7.1 | 7.9 | 0.9 | FAIL | 1 | 149.8/198 | 0.76 |
| 2026-08-26 | wed | Cory Ventura | 20/20 | 5.96 | 6 | 0.99 | PASS | 1 | 117.7/120.1 | 0.98 |
| 2026-08-27 | thu | Cory Ventura | 29/29 | 8.11 | 8.28 | 0.98 | PASS | 1 | 138.4/148.9 | 0.93 |
| 2026-08-28 | fri | Cory Ventura | 17/17 | 6.47 | 6.63 | 0.98 | PASS | 1 | 133.1/142.6 | 0.93 |
| 2026-08-24 | mon | Luke LaVergne | 21/21 | 8.58 | 9.26 | 0.93 | PASS | 1 | 199.8/240.8 | 0.83 |
| 2026-08-25 | tue | Luke LaVergne | 16/16 | 7.47 | 8.04 | 0.93 | PASS | 1 | 208.5/242.4 | 0.86 |
| 2026-08-26 | wed | Luke LaVergne | 14/14 | 6.69 | 7.72 | 0.87 | FAIL | 1 | 191.5/253.1 | 0.76 |
| 2026-08-27 | thu | Luke LaVergne | 18/18 | 8.14 | 8.16 | 1 | PASS | 1 | 218.3/219.7 | 0.99 |
| 2026-08-24 | mon | Robert Norton | 21/21 | 7.43 | 7.73 | 0.96 | PASS | 1 | 130.9/148.8 | 0.88 |
| 2026-08-25 | tue | Robert Norton | 27/27 | 9.03 | 9.31 | 0.97 | PASS | 1 | 136.9/153.8 | 0.89 |
| 2026-08-26 | wed | Robert Norton | 25/25 | 7.87 | 8.05 | 0.98 | PASS | 1 | 97.2/107.9 | 0.9 |
| 2026-08-27 | thu | Robert Norton | 22/22 | 7.72 | 8.07 | 0.96 | PASS | 1 | 133.3/154.1 | 0.87 |
| 2026-08-28 | fri | Robert Norton | 20/20 | 6.36 | 6.53 | 0.97 | PASS | 1 | 81.4/91.9 | 0.89 |
| 2026-08-24 | mon | Tavis Alexander | 26/26 | 8.56 | 9.03 | 0.95 | PASS | 1 | 123.5/151.6 | 0.81 |
| 2026-08-25 | tue | Tavis Alexander | 28/28 | 10.24 | 11.18 | 0.92 | PASS | 1 | 164.7/220.9 | 0.75 |
| 2026-08-26 | wed | Tavis Alexander | 32/32 | 9.02 | 9.63 | 0.94 | PASS | 1 | 93.2/129.8 | 0.72 |
| 2026-08-27 | thu | Tavis Alexander | 25/25 | 8.34 | 8.9 | 0.94 | PASS | 1 | 125.5/159.1 | 0.79 |
| 2026-08-28 | fri | Tavis Alexander | 25/25 | 9.43 | 10.64 | 0.89 | FAIL | 1 | 191/263.2 | 0.73 |

## Policy notes

```json
{
  "unresolvedVisits": 0,
  "unresolvedKeys": [],
  "comment": "Visits with no resolvable actual are left unassigned and count as drops; they are the same visits the scorer cannot score."
}
```

---

Hours are modelled with `travel.mjs` over each route-day in its own order, including the inbound leg from the tech's inferred start area and excluding the trip home. Proposal and actual are timed with the identical model and identical per-visit service minutes, so any difference is the board, not the clock.