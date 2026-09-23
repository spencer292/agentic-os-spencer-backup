# Backtest scorecard — 2026-08-31 · keep-actual

Oracle baseline — the tech and day each visit actually got.

| | |
|---|---|
| Golden week | 2026-08-31 (2026-08-31 .. 2026-09-04) |
| Plan-time cutoff | 2026-08-28T21:00:00.000Z (Friday 14:00 PT) |
| Policy | `keep-actual` — reads the oracle |
| Techs | Alias Franks, Cory Ventura, Luke LaVergne, Robert Norton, Tavis Alexander |
| Overall | **FAIL** |

## Gates

| Gate | Value | Result |
|---|---:|:---:|
| same tech >= 95% | 100 | PASS |
| same day >= 95% | 100 | PASS |
| route-day hours within +-10% | 21/25 (84%) | FAIL |
| route-day hours within +-10% (board only, same sequencer) _(advisory)_ | 25/25 (100%) | PASS |
| no dropped visits | 0 | PASS |
| no invented visits | 0 | PASS |
| no weekend placements | 0 | PASS |
| no route-day over 9.5 h (modelled travel + service) _(advisory)_ | 3 of 25 (actual: 4/25) | FAIL |
| route-day total time within +-5% of the OptimoRoute day (compactness) _(advisory)_ | 14/25 (56%) | FAIL |
| late bookings (created after the cutoff — the add-queue load) _(advisory)_ | 54 | PASS |

## Coverage

| Metric | Count |
|---|---:|
| Visits due and known at the cutoff | 532 |
| Late bookings (created after the cutoff, excluded) | 54 |
| Visits the policy placed | 532 |
| Dropped (due, never placed) | 0 |
| Invented (placed, not due) | 0 |
| Duplicate placements | 0 |
| Placed on a weekend | 0 |
| Placed outside the golden week | 1 |
| Due visits with no resolvable actual | 0 |
| OptimoRoute ghost orders (no Jobber visit) | 5 |

## Agreement with what ran

| Reference | n | Same tech | Same day | Both |
|---|---:|---:|---:|---:|
| Actual run (completion stamps) | 532 | 100% | 100% | 100% |
| OptimoRoute route as held | 525 | 99.6% | 99.8% | 99.4% |

## Hours per route-day

| Metric | Value |
|---|---:|
| Route-days with both a proposal and an actual | 25 |
| Within +-10% of actual | 21 (84%) |
| Median proposal/actual ratio | 0.96 |
| **Board only** — within +-10% when the actual day is re-sequenced by us | 25/25 (100%) |
| **Board only** — median ratio | 1 |
| Route-days only in the proposal | 0 |
| Route-days only in the actual | 0 |
| Total proposal hours | 186 |
| Total actual hours | 197 |
| Actual stop order taken from | OptimoRoute 524, completion stamps 8, schedule 0 |

The headline hours ratio moves for two reasons at once: a different board, and a different stop order. The **board only** row re-sequences the actual day with the same sequencer, so what remains is purely the board.

## Sequence quality (same stop set, two orders)

| Metric | Value |
|---|---:|
| Route-days compared | 24 |
| Median drive-time ratio (ours / OptimoRoute) | 0.87 |
| Median distance ratio | 0.85 |
| **Uniform-model control** — median drive ratio, estimator only | 0.9 |
| Legs our order has to estimate (median) | 37.6% |
| Legs OptimoRoute's order has to estimate (median) | 9.2% |
| Route-days we beat OptimoRoute on drive time | 23 |
| Route-days OptimoRoute beat us | 1 |
| Route-days we beat it under the uniform control | 21 |
| Total drive minutes, ours vs OptimoRoute | 3366.4 vs 4025.6 |

Read the uniform-model control, not the headline ratio. OptimoRoute actually drove every leg in its own order, so those legs are real measurements in the travel model; any re-ordering invents legs nobody has driven and they fall back to a haversine estimator whose median per-leg error is around 20%. The headline ratio therefore flatters any re-ordering. The control times both orders with the estimator alone, so neither side gets that advantage.

## Design gates (S4 section 5)

This policy carries no due windows, so window compliance is not scored.

| Capacity and compactness | Proposal | Actual |
|---|---:|---:|
| Route-days | 25 | 25 |
| Over 8 h (modelled travel + service) | 8 | 13 |
| Over 9.5 h — the hard wall | 3 | 4 |
| Longest route-day, hours | 10.22 | 10.82 |
| Median route-day, hours | 7.66 | 8.03 |
| Route-day time within +-5% of the OptimoRoute day | 14/25 (56%) | - |
| Route-day ratio range | 0.82 - 1 | - |
| Overflow — could not fit under the wall | 0 | - |
| Late bookings — the add-queue load | 54 | - |

## Per-tech weekly hours

| Tech | Days | Stops | Proposal h | Actual h | Delta h |
|---|---:|---:|---:|---:|---:|
| Alias Franks | 6/6 | 115/115 | 41.6 | 43.4 | -1.8 |
| Cory Ventura | 4/4 | 90/90 | 25.7 | 27 | -1.3 |
| Luke LaVergne | 5/5 | 92/92 | 38.9 | 41.9 | -3 |
| Robert Norton | 5/5 | 112/112 | 38.2 | 39.6 | -1.4 |
| Tavis Alexander | 5/5 | 123/123 | 41.6 | 45.1 | -3.5 |

## Route-days

| Date | Dow | Tech | Stops p/a | Prop h | Act h | Ratio | +-10% | Board ratio | Seq drive p/a | Seq ratio |
|---|---|---|---:|---:|---:|---:|:---:|---:|---:|---:|
| 2026-08-25 | tue | Alias Franks | 1/1 | 0.51 | 0.51 | 1 | PASS | 1 | - | - |
| 2026-08-31 | mon | Alias Franks | 25/25 | 8.43 | 8.66 | 0.97 | PASS | 1 | 130.5/144.4 | 0.9 |
| 2026-09-01 | tue | Alias Franks | 25/25 | 9.3 | 9.47 | 0.98 | PASS | 1 | 152.7/163.3 | 0.94 |
| 2026-09-02 | wed | Alias Franks | 20/20 | 7.69 | 8.44 | 0.91 | PASS | 1 | 146.6/191.7 | 0.76 |
| 2026-09-03 | thu | Alias Franks | 20/20 | 7.55 | 7.98 | 0.95 | PASS | 1 | 153.2/179 | 0.86 |
| 2026-09-04 | fri | Alias Franks | 24/24 | 8.09 | 8.3 | 0.98 | PASS | 1 | 125.7/137.9 | 0.91 |
| 2026-08-31 | mon | Cory Ventura | 24/24 | 7 | 7.26 | 0.96 | PASS | 1 | 119.9/135.4 | 0.89 |
| 2026-09-01 | tue | Cory Ventura | 20/20 | 6.21 | 6.66 | 0.93 | PASS | 1 | 132.4/159.9 | 0.83 |
| 2026-09-02 | wed | Cory Ventura | 24/24 | 6.39 | 6.67 | 0.96 | PASS | 1 | 95.2/112 | 0.85 |
| 2026-09-03 | thu | Cory Ventura | 22/22 | 6.07 | 6.4 | 0.95 | PASS | 1 | 100/120 | 0.83 |
| 2026-08-31 | mon | Luke LaVergne | 18/18 | 7.66 | 8.75 | 0.88 | FAIL | 1 | 174.9/240.1 | 0.73 |
| 2026-09-01 | tue | Luke LaVergne | 24/24 | 10.22 | 10.82 | 0.95 | PASS | 1 | 253.4/289 | 0.88 |
| 2026-09-02 | wed | Luke LaVergne | 13/13 | 6.28 | 7.11 | 0.88 | FAIL | 1 | 181.6/231.8 | 0.78 |
| 2026-09-03 | thu | Luke LaVergne | 16/16 | 7.04 | 7.2 | 0.98 | PASS | 1 | 182.5/191.7 | 0.95 |
| 2026-09-04 | fri | Luke LaVergne | 21/21 | 7.7 | 8.03 | 0.96 | PASS | 1 | 132/151.8 | 0.87 |
| 2026-08-31 | mon | Robert Norton | 20/20 | 7.02 | 7.2 | 0.97 | PASS | 1 | 121.2/132.1 | 0.92 |
| 2026-09-01 | tue | Robert Norton | 25/25 | 8.64 | 8.93 | 0.97 | PASS | 1 | 143.2/160.9 | 0.89 |
| 2026-09-02 | wed | Robert Norton | 22/22 | 7.35 | 7.51 | 0.98 | PASS | 1 | 110.8/120.5 | 0.92 |
| 2026-09-03 | thu | Robert Norton | 21/21 | 7.35 | 7.67 | 0.96 | PASS | 1 | 126.3/145 | 0.87 |
| 2026-09-04 | fri | Robert Norton | 24/24 | 7.84 | 8.28 | 0.95 | PASS | 1 | 110.5/137.1 | 0.81 |
| 2026-08-31 | mon | Tavis Alexander | 28/28 | 9.64 | 9.6 | 1 | PASS | 1 | 143.4/140.7 | 1.02 |
| 2026-09-01 | tue | Tavis Alexander | 28/28 | 9.69 | 10 | 0.97 | PASS | 1 | 161.5/180.1 | 0.9 |
| 2026-09-02 | wed | Tavis Alexander | 23/23 | 6.3 | 6.65 | 0.95 | PASS | 1 | 68.9/89.9 | 0.77 |
| 2026-09-03 | thu | Tavis Alexander | 23/23 | 7.98 | 9.07 | 0.88 | FAIL | 1 | 134.1/199.1 | 0.67 |
| 2026-09-04 | fri | Tavis Alexander | 21/21 | 8.01 | 9.79 | 0.82 | FAIL | 1 | 165.9/272.2 | 0.61 |

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