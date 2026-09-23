# Backtest scorecard — 2026-08-31 · dominant-routeday

Static master route — each job to the tech and weekday it was most often served on before the week.

| | |
|---|---|
| Golden week | 2026-08-31 (2026-08-31 .. 2026-09-04) |
| Plan-time cutoff | 2026-08-28T21:00:00.000Z (Friday 14:00 PT) |
| Policy | `dominant-routeday` |
| Techs | Alias Franks, Cory Ventura, Luke LaVergne, Robert Norton, Tavis Alexander |
| Overall | **FAIL** |

## Gates

| Gate | Value | Result |
|---|---:|:---:|
| same tech >= 95% | 90.2 | FAIL |
| same day >= 95% | 75.9 | FAIL |
| route-day hours within +-10% | 9/24 (37.5%) | FAIL |
| route-day hours within +-10% (board only, same sequencer) _(advisory)_ | 7/24 (29.2%) | FAIL |
| no dropped visits | 0 | PASS |
| no invented visits | 0 | PASS |
| no weekend placements | 0 | PASS |
| no route-day over 9.5 h (modelled travel + service) _(advisory)_ | 2 of 25 (actual: 4/25) | FAIL |
| route-day total time within +-5% of the OptimoRoute day (compactness) _(advisory)_ | 5/24 (20.8%) | FAIL |
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
| Placed outside the golden week | 0 |
| Due visits with no resolvable actual | 0 |
| OptimoRoute ghost orders (no Jobber visit) | 5 |

## Agreement with what ran

| Reference | n | Same tech | Same day | Both |
|---|---:|---:|---:|---:|
| Actual run (completion stamps) | 532 | 90.2% | 75.9% | 71.8% |
| OptimoRoute route as held | 525 | 90.7% | 77.1% | 73% |

## Hours per route-day

| Metric | Value |
|---|---:|
| Route-days with both a proposal and an actual | 24 |
| Within +-10% of actual | 9 (37.5%) |
| Median proposal/actual ratio | 0.96 |
| **Board only** — within +-10% when the actual day is re-sequenced by us | 7/24 (29.2%) |
| **Board only** — median ratio | 0.98 |
| Route-days only in the proposal | 1 |
| Route-days only in the actual | 1 |
| Total proposal hours | 191.8 |
| Total actual hours | 197 |
| Actual stop order taken from | OptimoRoute 524, completion stamps 8, schedule 0 |

The headline hours ratio moves for two reasons at once: a different board, and a different stop order. The **board only** row re-sequences the actual day with the same sequencer, so what remains is purely the board.

## Sequence quality (same stop set, two orders)

| Metric | Value |
|---|---:|
| Route-days compared | 23 |
| Median drive-time ratio (ours / OptimoRoute) | 0.89 |
| Median distance ratio | 0.87 |
| **Uniform-model control** — median drive ratio, estimator only | 0.92 |
| Legs our order has to estimate (median) | 37.5% |
| Legs OptimoRoute's order has to estimate (median) | 16.7% |
| Route-days we beat OptimoRoute on drive time | 22 |
| Route-days OptimoRoute beat us | 1 |
| Route-days we beat it under the uniform control | 19 |
| Total drive minutes, ours vs OptimoRoute | 2791.6 vs 3160.1 |

Read the uniform-model control, not the headline ratio. OptimoRoute actually drove every leg in its own order, so those legs are real measurements in the travel model; any re-ordering invents legs nobody has driven and they fall back to a haversine estimator whose median per-leg error is around 20%. The headline ratio therefore flatters any re-ordering. The control times both orders with the estimator alone, so neither side gets that advantage.

## Design gates (S4 section 5)

This policy carries no due windows, so window compliance is not scored.

| Capacity and compactness | Proposal | Actual |
|---|---:|---:|
| Route-days | 25 | 25 |
| Over 8 h (modelled travel + service) | 10 | 13 |
| Over 9.5 h — the hard wall | 2 | 4 |
| Longest route-day, hours | 10.92 | 10.82 |
| Median route-day, hours | 7.76 | 8.03 |
| Route-day time within +-5% of the OptimoRoute day | 5/24 (20.8%) | - |
| Route-day ratio range | 0.62 - 1.32 | - |
| Overflow — could not fit under the wall | 0 | - |
| Late bookings — the add-queue load | 54 | - |

## Per-tech weekly hours

| Tech | Days | Stops | Proposal h | Actual h | Delta h |
|---|---:|---:|---:|---:|---:|
| Alias Franks | 5/6 | 115/115 | 41.4 | 43.4 | -2 |
| Cory Ventura | 5/4 | 114/90 | 37.8 | 27 | 10.8 |
| Luke LaVergne | 5/5 | 73/92 | 33.9 | 41.9 | -8 |
| Robert Norton | 5/5 | 103/112 | 35.7 | 39.6 | -3.9 |
| Tavis Alexander | 5/5 | 127/123 | 43 | 45.1 | -2.1 |

## Route-days

| Date | Dow | Tech | Stops p/a | Prop h | Act h | Ratio | +-10% | Board ratio | Seq drive p/a | Seq ratio |
|---|---|---|---:|---:|---:|---:|:---:|---:|---:|---:|
| 2026-08-25 | tue | Alias Franks | -/1 | - | 0.51 | - | - | - | - | - |
| 2026-08-31 | mon | Alias Franks | 25/25 | 8.43 | 8.66 | 0.97 | PASS | 1 | 127.7/139.3 | 0.92 |
| 2026-09-01 | tue | Alias Franks | 25/25 | 9.01 | 9.47 | 0.95 | PASS | 0.97 | 135.8/153.1 | 0.89 |
| 2026-09-02 | wed | Alias Franks | 21/20 | 8.19 | 8.44 | 0.97 | PASS | 1.06 | 146.1/191.7 | 0.76 |
| 2026-09-03 | thu | Alias Franks | 17/20 | 6.38 | 7.98 | 0.8 | FAIL | 0.84 | 127.8/142.2 | 0.9 |
| 2026-09-04 | fri | Alias Franks | 27/24 | 9.39 | 8.3 | 1.13 | FAIL | 1.16 | 129/137.9 | 0.94 |
| 2026-08-31 | mon | Cory Ventura | 28/24 | 7.76 | 7.26 | 1.07 | PASS | 1.11 | 87.6/89.7 | 0.98 |
| 2026-09-01 | tue | Cory Ventura | 18/20 | 6.84 | 6.66 | 1.03 | PASS | 1.1 | 101.2/112.3 | 0.9 |
| 2026-09-02 | wed | Cory Ventura | 17/24 | 5.67 | 6.67 | 0.85 | FAIL | 0.89 | - | - |
| 2026-09-03 | thu | Cory Ventura | 24/22 | 7.99 | 6.4 | 1.25 | FAIL | 1.32 | 57/58 | 0.98 |
| 2026-09-04 | fri | Cory Ventura | 27/- | 9.54 | - | - | - | - | - | - |
| 2026-08-31 | mon | Luke LaVergne | 14/18 | 6.24 | 8.75 | 0.71 | FAIL | 0.81 | 149.2/184.5 | 0.81 |
| 2026-09-01 | tue | Luke LaVergne | 17/24 | 8.07 | 10.82 | 0.75 | FAIL | 0.79 | 228.9/267.7 | 0.86 |
| 2026-09-02 | wed | Luke LaVergne | 12/13 | 6.18 | 7.11 | 0.87 | FAIL | 0.98 | 190.7/226.9 | 0.84 |
| 2026-09-03 | thu | Luke LaVergne | 19/16 | 8.44 | 7.2 | 1.17 | FAIL | 1.2 | 206.3/191.7 | 1.08 |
| 2026-09-04 | fri | Luke LaVergne | 11/21 | 4.98 | 8.03 | 0.62 | FAIL | 0.65 | 60.4/69.4 | 0.87 |
| 2026-08-31 | mon | Robert Norton | 23/20 | 7.93 | 7.2 | 1.1 | FAIL | 1.13 | 100.2/110.2 | 0.91 |
| 2026-09-01 | tue | Robert Norton | 21/25 | 7.37 | 8.93 | 0.82 | FAIL | 0.85 | 120/140 | 0.86 |
| 2026-09-02 | wed | Robert Norton | 15/22 | 5.23 | 7.51 | 0.7 | FAIL | 0.71 | 73.9/83.4 | 0.89 |
| 2026-09-03 | thu | Robert Norton | 21/21 | 7.55 | 7.67 | 0.99 | PASS | 1.03 | 121.9/137.6 | 0.89 |
| 2026-09-04 | fri | Robert Norton | 23/24 | 7.6 | 8.28 | 0.92 | PASS | 0.97 | 78/87 | 0.9 |
| 2026-08-31 | mon | Tavis Alexander | 27/28 | 9.19 | 9.6 | 0.96 | PASS | 0.95 | 109.2/110.1 | 0.99 |
| 2026-09-01 | tue | Tavis Alexander | 30/28 | 10.92 | 10 | 1.09 | PASS | 1.13 | 147.4/161.1 | 0.91 |
| 2026-09-02 | wed | Tavis Alexander | 32/23 | 8.74 | 6.65 | 1.32 | FAIL | 1.39 | 51.7/58.9 | 0.88 |
| 2026-09-03 | thu | Tavis Alexander | 20/23 | 7.08 | 9.07 | 0.78 | FAIL | 0.89 | 86.3/117.1 | 0.74 |
| 2026-09-04 | fri | Tavis Alexander | 18/21 | 7.09 | 9.79 | 0.72 | FAIL | 0.88 | 155.3/190.3 | 0.82 |

## Tech/day mismatches (150 total, first 60)

| Visit | Zip | Wrong | Proposed | Actual |
|---|---|---|---|---|
| 8300-2275366634 Rick Little (5th Visit | 98466 | tech+day | Cory Ventura 2026-09-04 | Luke LaVergne 2026-08-31 |
| 8419-2296253681 Kim Anderson | 98092 | day | Robert Norton 2026-09-01 | Robert Norton 2026-08-31 |
| 7517-1970470240 Balbir Houthi | 98001 | tech+day | Robert Norton 2026-09-03 | Cory Ventura 2026-08-31 |
| 8098-2302898802 Gyasi Ross | 98178 | day | Tavis Alexander 2026-09-01 | Tavis Alexander 2026-08-31 |
| 8454-2302702231 John Croonquist | 98188 | day | Tavis Alexander 2026-09-01 | Tavis Alexander 2026-08-31 |
| 8413-2301914123 Rick Broderick | 98168 | day | Tavis Alexander 2026-09-01 | Tavis Alexander 2026-08-31 |
| 8030-2301955413 Briana Watson | 98168 | day | Tavis Alexander 2026-09-01 | Tavis Alexander 2026-08-31 |
| 8451-2301461807 Holy Chea | 98031 | day | Cory Ventura 2026-09-03 | Cory Ventura 2026-08-31 |
| 6492-1750196089 Greg Hastings | 98039 | tech+day | Tavis Alexander 2026-09-03 | Alias Franks 2026-08-31 |
| 8448-2301451770 Kelly Wan | 98168 | day | Tavis Alexander 2026-09-01 | Tavis Alexander 2026-08-31 |
| 8475-2306272044 Constance Pivonka | 98031 | day | Cory Ventura 2026-09-01 | Cory Ventura 2026-08-31 |
| 8065-2232218120 Aleyna Yamaguchi | 98168 | day | Tavis Alexander 2026-09-01 | Tavis Alexander 2026-08-31 |
| 7962-2201297328 Joann Mortenson | 98042 | tech | Cory Ventura 2026-08-31 | Robert Norton 2026-08-31 |
| 8457-2303099608 Caroline Irwin | 98516 | day | Luke LaVergne 2026-09-03 | Luke LaVergne 2026-08-31 |
| 8470-2305378584 Alice Collins (SET) | 98146 | day | Tavis Alexander 2026-09-01 | Tavis Alexander 2026-08-31 |
| 8449-2301457003 Steve Vernon | 98516 | day | Luke LaVergne 2026-09-03 | Luke LaVergne 2026-08-31 |
| 8122-2242745157 Bob Roggenbach | 98042 | day | Cory Ventura 2026-09-04 | Cory Ventura 2026-08-31 |
| 7971-2205670730 David Marsh | 98042 | day | Cory Ventura 2026-09-03 | Cory Ventura 2026-08-31 |
| 8459-2303103317 Melody Deisher | 98058 | day | Cory Ventura 2026-09-03 | Cory Ventura 2026-08-31 |
| 7634-2019950707 Michael Blondin | 98513 | day | Luke LaVergne 2026-09-03 | Luke LaVergne 2026-08-31 |
| 6500-1770760668 Sheri Powers | 98058 | day | Cory Ventura 2026-09-04 | Cory Ventura 2026-08-31 |
| 6628-2300151891 Shana Valencia | 98038 | tech | Cory Ventura 2026-08-31 | Robert Norton 2026-08-31 |
| 8201-2259577854 Jenna Elberts | 98146 | day | Tavis Alexander 2026-09-01 | Tavis Alexander 2026-08-31 |
| 8453-2301467891 Polly Prince | 98055 | day | Cory Ventura 2026-09-03 | Cory Ventura 2026-08-31 |
| 7837-2115889337 Karen Baker | 98055 | day | Cory Ventura 2026-09-04 | Cory Ventura 2026-08-31 |
| 8200-2259574191 GenCare - 1 Year Mole  | 98055 | day | Cory Ventura 2026-09-04 | Cory Ventura 2026-08-31 |
| 7987-2212575340 David  Lloyd | 98058 | day | Cory Ventura 2026-09-04 | Cory Ventura 2026-08-31 |
| 8112-2240793540 Colleen Hunter | 98146 | day | Tavis Alexander 2026-09-01 | Tavis Alexander 2026-08-31 |
| 8447-2301448513 Tia Gong | 98008 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 8302-2275942854 Spencer Jacobs (5th Vi | 98125 | day | Alias Franks 2026-09-01 | Alias Franks 2026-08-25 |
| 5298-1741959807 Zach Usher | 98108 | day | Tavis Alexander 2026-08-31 | Tavis Alexander 2026-09-01 |
| 8318-2277596699 Dave Sinner | 98338 | tech | Cory Ventura 2026-09-01 | Luke LaVergne 2026-09-01 |
| 7747-2306559626 Leeroy Perkins | 98338 | tech | Cory Ventura 2026-09-01 | Luke LaVergne 2026-09-01 |
| 8432-2297638277 Stacey Boydell | 98338 | tech | Cory Ventura 2026-09-01 | Luke LaVergne 2026-09-01 |
| 5540-1718978553 Chris Thornhill | 98338 | tech | Cory Ventura 2026-09-01 | Luke LaVergne 2026-09-01 |
| 7449-2306558170 Sally  Gasser | 98051 | tech+day | Cory Ventura 2026-09-03 | Robert Norton 2026-09-01 |
| 5727-1902275237 Eric Crossley | 98338 | tech | Cory Ventura 2026-09-01 | Luke LaVergne 2026-09-01 |
| 5413-1718745013 Ron Houlihan | 98338 | tech | Cory Ventura 2026-09-01 | Luke LaVergne 2026-09-01 |
| 7735-2300147947 Mike Coile | 98051 | day | Robert Norton 2026-08-31 | Robert Norton 2026-09-01 |
| 7771-2300255166 McKenzie  Dickson | 98051 | day | Robert Norton 2026-08-31 | Robert Norton 2026-09-01 |
| 7320-1909920913 Mike Menigoz | 98374 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 7725-2057513406 Suzanne Gullace | 98360 | tech | Cory Ventura 2026-09-01 | Luke LaVergne 2026-09-01 |
| 8375-2288867788 Johnny Evans | 98374 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 7450-2300307120 Amy Thomas | 98051 | day | Robert Norton 2026-08-31 | Robert Norton 2026-09-01 |
| 8431-2297636572 Julie Woods | 98375 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 8373-2288590962 Carey Jenkins | 98102 | tech | Tavis Alexander 2026-09-01 | Alias Franks 2026-09-01 |
| 7884-2153405149 Matt Arnold (PROBLEM J | 98375 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 5024-1702511846 Brienna Dyberg | 98375 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 8118-2304496381 Patty  Ring (PROBLEM J | 98375 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 8133-2244933522 Shane Taylor | 98375 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 7839-2117235404 Jason Andrews | 98446 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 4608-2295808602 Kristi Rice | 98373 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 5440-2027785822 Steve Hewitt | 98092 | day | Robert Norton 2026-08-31 | Robert Norton 2026-09-01 |
| 7723-2056042316 Chad Peterson | 98363 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 7737-2062875612 James Evenson | 98373 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 7764-2071869386 Michallea Schuelke | 98373 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 5780-1880520514 Susy Bevans | 98372 | day | Cory Ventura 2026-09-02 | Cory Ventura 2026-09-01 |
| 8359-2286336675 Mary Suhadolnik | 98116 | day | Tavis Alexander 2026-08-31 | Tavis Alexander 2026-09-01 |
| 8015-2300631052 Toby Aldrich | 98116 | day | Tavis Alexander 2026-08-31 | Tavis Alexander 2026-09-01 |
| 8346-2284399350 Kenton Phillips | 98116 | day | Tavis Alexander 2026-08-31 | Tavis Alexander 2026-09-01 |

## Policy notes

```json
{
  "tiers": {
    "job": 487,
    "zip": 44,
    "nearestStart": 1,
    "floor": 0
  },
  "jobsWithHistory": 788,
  "historyVisits": 1329,
  "historyDays": 12,
  "comment": "History is every completed visit strictly before the golden week Monday. No lookahead, no oracle."
}
```

---

Hours are modelled with `travel.mjs` over each route-day in its own order, including the inbound leg from the tech's inferred start area and excluding the trip home. Proposal and actual are timed with the identical model and identical per-visit service minutes, so any difference is the board, not the clock.