# Backtest scorecard — 2026-08-24 · dominant-routeday

Static master route — each job to the tech and weekday it was most often served on before the week.

| | |
|---|---|
| Golden week | 2026-08-24 (2026-08-24 .. 2026-08-28) |
| Plan-time cutoff | 2026-08-21T21:00:00.000Z (Friday 14:00 PT) |
| Policy | `dominant-routeday` |
| Techs | Alias Franks, Cory Ventura, Luke LaVergne, Robert Norton, Tavis Alexander |
| Overall | **FAIL** |

## Gates

| Gate | Value | Result |
|---|---:|:---:|
| same tech >= 95% | 86.8 | FAIL |
| same day >= 95% | 69.2 | FAIL |
| route-day hours within +-10% | 6/24 (25%) | FAIL |
| route-day hours within +-10% (board only, same sequencer) _(advisory)_ | 5/24 (20.8%) | FAIL |
| no dropped visits | 0 | PASS |
| no invented visits | 0 | PASS |
| no weekend placements | 0 | PASS |
| no route-day over 9.5 h (modelled travel + service) _(advisory)_ | 5 of 25 (actual: 3/24) | FAIL |
| route-day total time within +-5% of the OptimoRoute day (compactness) _(advisory)_ | 2/24 (8.3%) | FAIL |
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
| Actual run (completion stamps) | 552 | 86.8% | 69.2% | 62.9% |
| OptimoRoute route as held | 551 | 89.1% | 69.1% | 65% |

## Hours per route-day

| Metric | Value |
|---|---:|
| Route-days with both a proposal and an actual | 24 |
| Within +-10% of actual | 6 (25%) |
| Median proposal/actual ratio | 0.94 |
| **Board only** — within +-10% when the actual day is re-sequenced by us | 5/24 (20.8%) |
| **Board only** — median ratio | 0.99 |
| Route-days only in the proposal | 1 |
| Route-days only in the actual | 0 |
| Total proposal hours | 196.4 |
| Total actual hours | 201.7 |
| Actual stop order taken from | OptimoRoute 549, completion stamps 3, schedule 0 |

The headline hours ratio moves for two reasons at once: a different board, and a different stop order. The **board only** row re-sequences the actual day with the same sequencer, so what remains is purely the board.

## Sequence quality (same stop set, two orders)

| Metric | Value |
|---|---:|
| Route-days compared | 21 |
| Median drive-time ratio (ours / OptimoRoute) | 0.89 |
| Median distance ratio | 0.9 |
| **Uniform-model control** — median drive ratio, estimator only | 0.97 |
| Legs our order has to estimate (median) | 43.5% |
| Legs OptimoRoute's order has to estimate (median) | 12.5% |
| Route-days we beat OptimoRoute on drive time | 17 |
| Route-days OptimoRoute beat us | 2 |
| Route-days we beat it under the uniform control | 15 |
| Total drive minutes, ours vs OptimoRoute | 2498.6 vs 2811.3 |

Read the uniform-model control, not the headline ratio. OptimoRoute actually drove every leg in its own order, so those legs are real measurements in the travel model; any re-ordering invents legs nobody has driven and they fall back to a haversine estimator whose median per-leg error is around 20%. The headline ratio therefore flatters any re-ordering. The control times both orders with the estimator alone, so neither side gets that advantage.

## Design gates (S4 section 5)

This policy carries no due windows, so window compliance is not scored.

| Capacity and compactness | Proposal | Actual |
|---|---:|---:|
| Route-days | 25 | 24 |
| Over 8 h (modelled travel + service) | 11 | 16 |
| Over 9.5 h — the hard wall | 5 | 3 |
| Longest route-day, hours | 11.33 | 11.18 |
| Median route-day, hours | 7.95 | 8.22 |
| Route-day time within +-5% of the OptimoRoute day | 2/24 (8.3%) | - |
| Route-day ratio range | 0.43 - 1.73 | - |
| Overflow — could not fit under the wall | 0 | - |
| Late bookings — the add-queue load | 55 | - |

## Per-tech weekly hours

| Tech | Days | Stops | Proposal h | Actual h | Delta h |
|---|---:|---:|---:|---:|---:|
| Alias Franks | 5/5 | 130/116 | 47.7 | 43.2 | 4.5 |
| Cory Ventura | 5/5 | 113/116 | 34.8 | 36.2 | -1.4 |
| Luke LaVergne | 5/4 | 91/69 | 39.9 | 33.2 | 6.7 |
| Robert Norton | 5/5 | 108/115 | 37.1 | 39.7 | -2.6 |
| Tavis Alexander | 5/5 | 110/136 | 36.9 | 49.4 | -12.5 |

## Route-days

| Date | Dow | Tech | Stops p/a | Prop h | Act h | Ratio | +-10% | Board ratio | Seq drive p/a | Seq ratio |
|---|---|---|---:|---:|---:|---:|:---:|---:|---:|---:|
| 2026-08-24 | mon | Alias Franks | 30/26 | 10.09 | 9.08 | 1.11 | FAIL | 1.16 | 127.5/149.3 | 0.85 |
| 2026-08-25 | tue | Alias Franks | 25/20 | 9.19 | 7.9 | 1.16 | FAIL | 1.28 | 120.1/140.3 | 0.86 |
| 2026-08-26 | wed | Alias Franks | 25/22 | 9.55 | 8.69 | 1.1 | PASS | 1.19 | 137.3/166.7 | 0.82 |
| 2026-08-27 | thu | Alias Franks | 23/24 | 8.51 | 8.89 | 0.96 | PASS | 1 | 141.3/142.9 | 0.99 |
| 2026-08-28 | fri | Alias Franks | 27/24 | 10.36 | 8.62 | 1.2 | FAIL | 1.23 | 132.4/132 | 1 |
| 2026-08-24 | mon | Cory Ventura | 30/27 | 8.46 | 7.42 | 1.14 | FAIL | 1.17 | 53.6/52.9 | 1.01 |
| 2026-08-25 | tue | Cory Ventura | 10/23 | 3.4 | 7.9 | 0.43 | FAIL | 0.48 | - | - |
| 2026-08-26 | wed | Cory Ventura | 25/20 | 7.51 | 6 | 1.25 | FAIL | 1.26 | 117.6/118.6 | 0.99 |
| 2026-08-27 | thu | Cory Ventura | 17/29 | 5.53 | 8.28 | 0.67 | FAIL | 0.68 | - | - |
| 2026-08-28 | fri | Cory Ventura | 31/17 | 9.94 | 6.63 | 1.5 | FAIL | 1.54 | - | - |
| 2026-08-24 | mon | Luke LaVergne | 16/21 | 6.94 | 9.26 | 0.75 | FAIL | 0.81 | 157.6/186.8 | 0.84 |
| 2026-08-25 | tue | Luke LaVergne | 19/16 | 8.6 | 8.04 | 1.07 | PASS | 1.15 | 217.1/242.4 | 0.9 |
| 2026-08-26 | wed | Luke LaVergne | 16/14 | 7.42 | 7.72 | 0.96 | PASS | 1.11 | 189.6/228.8 | 0.83 |
| 2026-08-27 | thu | Luke LaVergne | 20/18 | 8.94 | 8.16 | 1.1 | PASS | 1.1 | 222.8/221.1 | 1.01 |
| 2026-08-28 | fri | Luke LaVergne | 20/- | 7.98 | - | - | - | - | - | - |
| 2026-08-24 | mon | Robert Norton | 19/21 | 6.59 | 7.73 | 0.85 | FAIL | 0.89 | 100.7/112.8 | 0.89 |
| 2026-08-25 | tue | Robert Norton | 23/27 | 7.69 | 9.31 | 0.83 | FAIL | 0.85 | 116.3/128.6 | 0.9 |
| 2026-08-26 | wed | Robert Norton | 12/25 | 4.05 | 8.05 | 0.5 | FAIL | 0.52 | 36.3/37.1 | 0.98 |
| 2026-08-27 | thu | Robert Norton | 21/22 | 7.45 | 8.07 | 0.92 | PASS | 0.97 | 127/145.4 | 0.87 |
| 2026-08-28 | fri | Robert Norton | 33/20 | 11.33 | 6.53 | 1.73 | FAIL | 1.78 | 70.7/70.9 | 1 |
| 2026-08-24 | mon | Tavis Alexander | 18/26 | 6.31 | 9.03 | 0.7 | FAIL | 0.74 | 49.4/64 | 0.77 |
| 2026-08-25 | tue | Tavis Alexander | 24/28 | 7.84 | 11.18 | 0.7 | FAIL | 0.76 | 53.5/73.1 | 0.73 |
| 2026-08-26 | wed | Tavis Alexander | 27/32 | 8.12 | 9.63 | 0.84 | FAIL | 0.9 | 68.5/88.3 | 0.78 |
| 2026-08-27 | thu | Tavis Alexander | 24/25 | 7.95 | 8.9 | 0.89 | FAIL | 0.95 | 113.4/148.7 | 0.76 |
| 2026-08-28 | fri | Tavis Alexander | 17/25 | 6.68 | 10.64 | 0.63 | FAIL | 0.71 | 145.9/160.6 | 0.91 |

## Tech/day mismatches (205 total, first 60)

| Visit | Zip | Wrong | Proposed | Actual |
|---|---|---|---|---|
| 8124-2242810802 Debbie Jennings | 98466 | day | Luke LaVergne 2026-08-26 | Luke LaVergne 2026-08-24 |
| 7449-2285905550 Sally  Gasser | 98051 | tech | Cory Ventura 2026-08-24 | Robert Norton 2026-08-24 |
| 7699-2049090863 Laura Johnson | 98467 | day | Luke LaVergne 2026-08-28 | Luke LaVergne 2026-08-24 |
| 7735-2292802408 Mike Coile | 98051 | tech | Cory Ventura 2026-08-24 | Robert Norton 2026-08-24 |
| 8117-2293572315 Patty Dills | 98166 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 7771-2292829469 McKenzie  Dickson | 98051 | tech | Cory Ventura 2026-08-24 | Robert Norton 2026-08-24 |
| 6447-2293678445 Larena Walshe | 98146 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 7450-2292853099 Amy Thomas | 98051 | tech | Cory Ventura 2026-08-24 | Robert Norton 2026-08-24 |
| 8403-2294002254 Susan Eibey | 98042 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-24 |
| 8235-2293702073 Mike Schuppert | 98146 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 7088-2293721579 Kay Neal | 98146 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 8430-2297634753 Lourdes Orive - Darcy | 98498 | day | Luke LaVergne 2026-08-28 | Luke LaVergne 2026-08-24 |
| 6653-2284453880 SLPPLLC | 98042 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-24 |
| 8429-2297633682 Lourdes Orive | 98498 | day | Luke LaVergne 2026-08-28 | Luke LaVergne 2026-08-24 |
| 6581-2293816898 Greg Flynn | 98146 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 7962-2292145161 Joann Mortenson | 98042 | tech | Robert Norton 2026-08-24 | Cory Ventura 2026-08-24 |
| 8345-2293799342 Jennifer Pere | 98146 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 7662-2293567921 James Harnish - Job fo | 98092 | day | Cory Ventura 2026-08-25 | Cory Ventura 2026-08-24 |
| 8142-2293848663 Kevin Shaver | 98136 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 7574-2294065139 Steve  Huling | 98136 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 7010-2293566543 Charles Lindsey | 98092 | day | Cory Ventura 2026-08-25 | Cory Ventura 2026-08-24 |
| 7470-2294072215 Dawn St Clair | 98136 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 5025-2294023006 Bye The Green Condomin | 98002 | day | Cory Ventura 2026-08-25 | Cory Ventura 2026-08-24 |
| 8426-2297113023 Chris Kerr (SET) | 98136 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 8155-2284020426 Bac Walker | 98032 | day | Cory Ventura 2026-08-25 | Cory Ventura 2026-08-24 |
| 8193-2294166097 Erica Benson | 98116 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 7183-1889098186 Eric Dworkis - one yea | 98007 | tech+day | Tavis Alexander 2026-08-26 | Alias Franks 2026-08-24 |
| 8291-2291898534 John & Jasmine Foth | 98042 | tech | Cory Ventura 2026-08-24 | Robert Norton 2026-08-24 |
| 8072-2232222187 Prologis - Total Mole  | 98032 | day | Cory Ventura 2026-08-25 | Cory Ventura 2026-08-24 |
| 8359-2286336673 Mary Suhadolnik | 98116 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 8103-2293737261 Cindy Joaquin ( proble | 98030 | day | Cory Ventura 2026-08-25 | Cory Ventura 2026-08-24 |
| 8015-2294294798 Toby Aldrich | 98116 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 8346-2284399345 Kenton Phillips | 98116 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 4930-2293611317 Plemmons Industries | 98030 | day | Cory Ventura 2026-08-25 | Cory Ventura 2026-08-24 |
| 8371-2289204687 Betsy Monahan | 98030 | day | Cory Ventura 2026-08-25 | Cory Ventura 2026-08-24 |
| 7712-2054364448 Nancy Hawkins | 98042 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-24 |
| 8328-2280652499 Bob Chatalas | 98136 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 7608-2294593890 Scott Hamilton | 98146 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 8361-2293637826 Erik Guttridge | 98146 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 4705-2293640255 Pam Northrip | 98146 | day | Tavis Alexander 2026-08-25 | Tavis Alexander 2026-08-24 |
| 7527-2284297094 Katherine Cavanaugh | 98501 | day | Luke LaVergne 2026-08-27 | Luke LaVergne 2026-08-24 |
| 7199-2292441831 Glen Smith | 98038 | tech | Robert Norton 2026-08-24 | Cory Ventura 2026-08-24 |
| 7792-2089783693 Janet Medrud | 98501 | day | Luke LaVergne 2026-08-27 | Luke LaVergne 2026-08-24 |
| 8329-2280656938 J.C Brummond | 98198 | tech+day | Cory Ventura 2026-08-25 | Tavis Alexander 2026-08-24 |
| 8412-2294586916 Bill Henshaw | 98513 | day | Luke LaVergne 2026-08-27 | Luke LaVergne 2026-08-24 |
| 8347-2285418445 David Jones | 98028 | day | Alias Franks 2026-08-28 | Alias Franks 2026-08-25 |
| 8413-2298216852 Rick Broderick | 98168 | tech+day | Cory Ventura 2026-08-28 | Tavis Alexander 2026-08-25 |
| 4480-2289280783 Amanda Willard | 98372 | tech+day | Robert Norton 2026-08-27 | Cory Ventura 2026-08-25 |
| 7939-2295390950 Richard Driscoll | 98125 | day | Alias Franks 2026-08-26 | Alias Franks 2026-08-25 |
| 8030-2223332496 Briana Watson | 98168 | day | Tavis Alexander 2026-08-24 | Tavis Alexander 2026-08-25 |
| 7087-2289287962 Todd Merry | 98374 | day | Cory Ventura 2026-08-26 | Cory Ventura 2026-08-25 |
| 8342-2284347334 Michael Adamov | 98374 | day | Cory Ventura 2026-08-26 | Cory Ventura 2026-08-25 |
| 6890-2283869573 Tom Schlimme | 98002 | tech | Cory Ventura 2026-08-25 | Robert Norton 2026-08-25 |
| 7702-2049953361 Joe Tate | 98168 | day | Tavis Alexander 2026-08-24 | Tavis Alexander 2026-08-25 |
| 7853-2295291565 Jim Vaughn | 98360 | day | Cory Ventura 2026-08-26 | Cory Ventura 2026-08-25 |
| 7825-2108542953 David Bennett | 98168 | day | Tavis Alexander 2026-08-24 | Tavis Alexander 2026-08-25 |
| 7997-2216283366 Anita Leigh | 98360 | day | Cory Ventura 2026-08-27 | Cory Ventura 2026-08-25 |
| 8419-2296253290 Kim Anderson | 98092 | tech+day | Cory Ventura 2026-08-27 | Robert Norton 2026-08-25 |
| 8372-2288588473 Travis Bruce | 98108 | day | Tavis Alexander 2026-08-24 | Tavis Alexander 2026-08-25 |
| 7496-2296019246 Vince Preece | 98360 | day | Cory Ventura 2026-08-26 | Cory Ventura 2026-08-25 |

## Policy notes

```json
{
  "tiers": {
    "job": 436,
    "zip": 108,
    "nearestStart": 8,
    "floor": 0
  },
  "jobsWithHistory": 638,
  "historyVisits": 725,
  "historyDays": 7,
  "comment": "History is every completed visit strictly before the golden week Monday. No lookahead, no oracle."
}
```

---

Hours are modelled with `travel.mjs` over each route-day in its own order, including the inbound leg from the tech's inferred start area and excluding the trip home. Proposal and actual are timed with the identical model and identical per-visit service minutes, so any difference is the board, not the clock.