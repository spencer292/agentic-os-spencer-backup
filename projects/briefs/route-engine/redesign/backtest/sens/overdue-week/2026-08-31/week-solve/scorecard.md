# Backtest scorecard — 2026-08-31 · week-solve

The S4 design: owner map from history, due windows from the last visit, the week solved per tech under capacity, zone compactness and window constraints.

| | |
|---|---|
| Golden week | 2026-08-31 (2026-08-31 .. 2026-09-04) |
| Plan-time cutoff | 2026-08-28T21:00:00.000Z (Friday 14:00 PT) |
| Policy | `week-solve` |
| Techs | Alias Franks, Cory Ventura, Luke LaVergne, Robert Norton, Tavis Alexander |
| Overall | **FAIL** |

## Gates

| Gate | Value | Result |
|---|---:|:---:|
| same tech >= 95% | 89.2 | FAIL |
| same day >= 95% | 60 | FAIL |
| route-day hours within +-10% | 7/24 (29.2%) | FAIL |
| route-day hours within +-10% (board only, same sequencer) _(advisory)_ | 6/24 (25%) | FAIL |
| no dropped visits | 4 | FAIL |
| no invented visits | 0 | PASS |
| no weekend placements | 0 | PASS |
| every visit inside its due window (clamped to the week) | 528/528 (100%) | PASS |
| inside the raw due window, before clamping to the week _(advisory)_ | 446/528 (84.5%) | FAIL |
| no route-day over 9.5 h (modelled travel + service) _(advisory)_ | 4 of 25 (actual: 4/25) | FAIL |
| route-day total time within +-5% of the OptimoRoute day (compactness) _(advisory)_ | 2/24 (8.3%) | FAIL |
| no overflow (visits that would not fit under the wall) _(advisory)_ | 4 | FAIL |
| late bookings (created after the cutoff — the add-queue load) _(advisory)_ | 54 | PASS |

## Coverage

| Metric | Count |
|---|---:|
| Visits due and known at the cutoff | 532 |
| Late bookings (created after the cutoff, excluded) | 54 |
| Visits the policy placed | 528 |
| Dropped (due, never placed) | 4 |
| Invented (placed, not due) | 0 |
| Duplicate placements | 0 |
| Placed on a weekend | 0 |
| Placed outside the golden week | 0 |
| Due visits with no resolvable actual | 0 |
| OptimoRoute ghost orders (no Jobber visit) | 5 |

## Agreement with what ran

| Reference | n | Same tech | Same day | Both |
|---|---:|---:|---:|---:|
| Actual run (completion stamps) | 528 | 89.2% | 60% | 57.4% |
| OptimoRoute route as held | 521 | 89.6% | 60.8% | 58% |

## Hours per route-day

| Metric | Value |
|---|---:|
| Route-days with both a proposal and an actual | 24 |
| Within +-10% of actual | 7 (29.2%) |
| Median proposal/actual ratio | 0.94 |
| **Board only** — within +-10% when the actual day is re-sequenced by us | 6/24 (25%) |
| **Board only** — median ratio | 1.03 |
| Route-days only in the proposal | 1 |
| Route-days only in the actual | 1 |
| Total proposal hours | 190.5 |
| Total actual hours | 197 |
| Actual stop order taken from | OptimoRoute 524, completion stamps 8, schedule 0 |

The headline hours ratio moves for two reasons at once: a different board, and a different stop order. The **board only** row re-sequences the actual day with the same sequencer, so what remains is purely the board.

## Sequence quality (same stop set, two orders)

| Metric | Value |
|---|---:|
| Route-days compared | 21 |
| Median drive-time ratio (ours / OptimoRoute) | 0.9 |
| Median distance ratio | 0.88 |
| **Uniform-model control** — median drive ratio, estimator only | 0.94 |
| Legs our order has to estimate (median) | 40% |
| Legs OptimoRoute's order has to estimate (median) | 18.2% |
| Route-days we beat OptimoRoute on drive time | 19 |
| Route-days OptimoRoute beat us | 1 |
| Route-days we beat it under the uniform control | 16 |
| Total drive minutes, ours vs OptimoRoute | 2129.2 vs 2381.2 |

Read the uniform-model control, not the headline ratio. OptimoRoute actually drove every leg in its own order, so those legs are real measurements in the travel model; any re-ordering invents legs nobody has driven and they fall back to a haversine estimator whose median per-leg error is around 20%. The headline ratio therefore flatters any re-ordering. The control times both orders with the estimator alone, so neither side gets that advantage.

## Design gates (S4 section 5)

| Due-window compliance | Value |
|---|---:|
| Visits carrying a window | 528 |
| Placed inside the window, clamped to the week | 528 (100%) |
| Placed inside the raw window | 446 (84.5%) |

| Window type | n | Inside raw | Inside clamped |
|---|---:|---:|---:|
| active-measured | 235 | 94.9% | 100% |
| active-assumed | 118 | 41.5% | 100% |
| active-series | 116 | 99.1% | 100% |
| no-anchor | 47 | 100% | 100% |
| other-product | 11 | 100% | 100% |
| ambiguous-gap | 1 | 100% | 100% |

A window that opens before the golden week or closes after it cannot be obeyed inside a Monday-to-Friday solve. The clamped column is what the solver could actually hold; the raw column is the window the cadence rule asked for, and the gap between them is the design telling you how much work the office was already carrying late.

| Capacity and compactness | Proposal | Actual |
|---|---:|---:|
| Route-days | 25 | 25 |
| Over 8 h (modelled travel + service) | 13 | 13 |
| Over 9.5 h — the hard wall | 4 | 4 |
| Longest route-day, hours | 10.72 | 10.82 |
| Median route-day, hours | 8.13 | 8.03 |
| Route-day time within +-5% of the OptimoRoute day | 2/24 (8.3%) | - |
| Route-day ratio range | 0.31 - 1.6 | - |
| Overflow — could not fit under the wall | 4 | - |
| Late bookings — the add-queue load | 54 | - |

## Per-tech weekly hours

| Tech | Days | Stops | Proposal h | Actual h | Delta h |
|---|---:|---:|---:|---:|---:|
| Alias Franks | 5/6 | 110/115 | 40.2 | 43.4 | -3.2 |
| Cory Ventura | 5/4 | 123/90 | 39.4 | 27 | 12.5 |
| Luke LaVergne | 5/5 | 70/92 | 33.4 | 41.9 | -8.5 |
| Robert Norton | 5/5 | 100/112 | 34.5 | 39.6 | -5.1 |
| Tavis Alexander | 5/5 | 125/123 | 42.9 | 45.1 | -2.2 |

## Route-days

| Date | Dow | Tech | Stops p/a | Prop h | Act h | Ratio | +-10% | Board ratio | Seq drive p/a | Seq ratio |
|---|---|---|---:|---:|---:|---:|:---:|---:|---:|---:|
| 2026-08-25 | tue | Alias Franks | -/1 | - | 0.51 | - | - | - | - | - |
| 2026-08-31 | mon | Alias Franks | 27/25 | 9.32 | 8.66 | 1.08 | PASS | 1.11 | 116.5/120.4 | 0.97 |
| 2026-09-01 | tue | Alias Franks | 17/25 | 6.29 | 9.47 | 0.66 | FAIL | 0.68 | 92.4/105.1 | 0.88 |
| 2026-09-02 | wed | Alias Franks | 19/20 | 7.54 | 8.44 | 0.89 | FAIL | 0.98 | 76.8/108.5 | 0.71 |
| 2026-09-03 | thu | Alias Franks | 22/20 | 8.19 | 7.98 | 1.03 | PASS | 1.08 | 92.2/101.3 | 0.91 |
| 2026-09-04 | fri | Alias Franks | 25/24 | 8.85 | 8.3 | 1.07 | PASS | 1.09 | 86.3/89 | 0.97 |
| 2026-08-31 | mon | Cory Ventura | 32/24 | 9.08 | 7.26 | 1.25 | FAIL | 1.3 | 100/106.4 | 0.94 |
| 2026-09-01 | tue | Cory Ventura | 23/20 | 7.86 | 6.66 | 1.18 | FAIL | 1.27 | 95.3/122.1 | 0.78 |
| 2026-09-02 | wed | Cory Ventura | 28/24 | 9.91 | 6.67 | 1.49 | FAIL | 1.55 | - | - |
| 2026-09-03 | thu | Cory Ventura | 19/22 | 5.67 | 6.4 | 0.89 | FAIL | 0.93 | 23.1/23.1 | 1 |
| 2026-09-04 | fri | Cory Ventura | 21/- | 6.92 | - | - | - | - | - | - |
| 2026-08-31 | mon | Luke LaVergne | 4/18 | 2.71 | 8.75 | 0.31 | FAIL | 0.35 | - | - |
| 2026-09-01 | tue | Luke LaVergne | 19/24 | 9.87 | 10.82 | 0.91 | PASS | 0.97 | 213.9/236.8 | 0.9 |
| 2026-09-02 | wed | Luke LaVergne | 18/13 | 8.35 | 7.11 | 1.17 | FAIL | 1.33 | 98.6/131.1 | 0.75 |
| 2026-09-03 | thu | Luke LaVergne | 19/16 | 8.29 | 7.2 | 1.15 | FAIL | 1.18 | 178.6/185.7 | 0.96 |
| 2026-09-04 | fri | Luke LaVergne | 10/21 | 4.19 | 8.03 | 0.52 | FAIL | 0.54 | 60.4/69.4 | 0.87 |
| 2026-08-31 | mon | Robert Norton | 20/20 | 6.91 | 7.2 | 0.96 | PASS | 0.98 | 91.9/106 | 0.87 |
| 2026-09-01 | tue | Robert Norton | 21/25 | 7.15 | 8.93 | 0.8 | FAIL | 0.83 | 94.1/110.9 | 0.85 |
| 2026-09-02 | wed | Robert Norton | 23/22 | 8.13 | 7.51 | 1.08 | PASS | 1.11 | 100.8/105.4 | 0.96 |
| 2026-09-03 | thu | Robert Norton | 15/21 | 5.53 | 7.67 | 0.72 | FAIL | 0.75 | 107/119.9 | 0.89 |
| 2026-09-04 | fri | Robert Norton | 21/24 | 6.77 | 8.28 | 0.82 | FAIL | 0.86 | 74.2/81.4 | 0.91 |
| 2026-08-31 | mon | Tavis Alexander | 31/28 | 10.72 | 9.6 | 1.12 | FAIL | 1.11 | 143.4/140.7 | 1.02 |
| 2026-09-01 | tue | Tavis Alexander | 24/28 | 8.44 | 10 | 0.84 | FAIL | 0.87 | 141.5/156.3 | 0.91 |
| 2026-09-02 | wed | Tavis Alexander | 36/23 | 10.61 | 6.65 | 1.6 | FAIL | 1.69 | 39.8/46.1 | 0.86 |
| 2026-09-03 | thu | Tavis Alexander | 9/23 | 4.12 | 9.07 | 0.45 | FAIL | 0.52 | - | - |
| 2026-09-04 | fri | Tavis Alexander | 25/21 | 9.05 | 9.79 | 0.92 | PASS | 1.13 | 102.4/115.6 | 0.89 |

## Tech/day mismatches (225 total, first 60)

| Visit | Zip | Wrong | Proposed | Actual |
|---|---|---|---|---|
| 8311-2277566639 Steve Tullis (5th Visi | 98052 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 7546-2301040724 Marymoor Park - Marymo | 98052 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 6392-1650121780 Dan Hazen (PROBLEM JOB | 98004 | tech+day | Alias Franks 2026-08-31 | Tavis Alexander 2026-09-03 |
| 8307-2277550492 Tanya Parry | 98052 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-03 |
| 8046-2226614715 Daniel Bay | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 8476-2306720782 Amit Grover | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 8302-2275942854 Spencer Jacobs (5th Vi | 98125 | day | Alias Franks 2026-09-01 | Alias Franks 2026-08-25 |
| 8238-2265641331 Joshua  Chao | 98125 | day | Alias Franks 2026-09-02 | Alias Franks 2026-09-01 |
| 8299-2275356286 Kirsten Mcclelland (5t | 98115 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-01 |
| 8245-2302016358 Tad Hutchison | 98115 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-01 |
| 6420-1658060971 Vikrant Jain | 98115 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-01 |
| 8178-2254867766 Leslie Bratrud | 98105 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-01 |
| 8252-2302872444 Huy Nguyen | 98155 | day | Alias Franks 2026-09-02 | Alias Franks 2026-09-01 |
| 8036-2225664949 Garett Gowens | 98155 | day | Alias Franks 2026-09-02 | Alias Franks 2026-09-01 |
| 7022-1854765759 Seddik Belyamani - TMC | 98053 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-03 |
| 6602-1768237483 Lynn Wecker | 98053 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-03 |
| 7869-2149304482 Shelley Ryan | 98053 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-03 |
| 8467-2305375945 Sandy Goodkin | 98053 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-03 |
| 8194-2259504496 Steve Murdock | 98077 | day | Alias Franks 2026-09-02 | Alias Franks 2026-09-03 |
| 6607-1771843076 Jonathan Kim-Hull | 98077 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-03 |
| 8217-2261194664 Aziz El-solh | 98072 | day | Alias Franks 2026-09-02 | Alias Franks 2026-09-03 |
| 6402-1651426617 Melissa Street | 98045 | tech+day | Alias Franks 2026-09-03 | Tavis Alexander 2026-09-04 |
| 8236-2265635591 Tom Hopson | 98008 | day | Alias Franks 2026-09-04 | Alias Franks 2026-08-31 |
| 6660-2293788805 Craig Knebel | 98177 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-01 |
| 6970-2295607674 Mary Olin | 98052 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8233-2265627931 Vicky Marxen | 98074 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-03 |
| 6375-2296591400 Mike Cushman | 98077 | day | Alias Franks 2026-09-02 | Alias Franks 2026-09-03 |
| 6919-1832480807 Corky Heimbigner | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 8256-2268932059 Doug Crow | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 5104-1668537502 Nathan Barness | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 8156-2248881712 Deborah Berger | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 6355-1637516858 Julie James | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 7817-2106876955 Josh Hedrick | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 8394-2293211676 Sachin Gupta | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 6810-1815091723 Doug  Schutt | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 8265-2270506349 Jepson Fuller | 98075 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-04 |
| 8447-2301448513 Tia Gong | 98008 | day | Alias Franks 2026-09-04 | Alias Franks 2026-08-31 |
| 5531-1805401521 Conover Court | 98052 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8450-2301459641 Ashok Shivani | 98033 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8455-2303096700 Shelly Evans | 98034 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8384-2292302812 Marjory Laymon | 98034 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 7962-2201297328 Joann Mortenson | 98042 | tech | Cory Ventura 2026-08-31 | Robert Norton 2026-08-31 |
| 8291-2300687894 John & Jasmine Foth | 98042 | tech | Cory Ventura 2026-08-31 | Robert Norton 2026-08-31 |
| 6628-2300151891 Shana Valencia | 98038 | tech | Cory Ventura 2026-08-31 | Robert Norton 2026-08-31 |
| 5427-1733048543 Dave Wilson | 98038 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-02 |
| 8310-2277563076 Danielle Goodgion | 98038 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-02 |
| 7199-2301059154 Glen Smith | 98038 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-02 |
| 5602-2300210037 Sandee Smith | 98042 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-02 |
| 7084-2300231816 Jameel Hyder - TMCP | 98042 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-02 |
| 8403-2294002257 Susan Eibey | 98042 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-02 |
| 8270-2272143054 Brian Meadows | 98058 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-03 |
| 8319-2307413989 Jill Robinson | 98403 | tech+day | Cory Ventura 2026-09-02 | Luke LaVergne 2026-09-04 |
| 5597-1912251749 Jim McGowan - Job for  | 98374 | tech+day | Cory Ventura 2026-09-02 | Robert Norton 2026-09-04 |
| 8477-2307852234 Tom Walker | 98446 | tech+day | Cory Ventura 2026-09-02 | Luke LaVergne 2026-09-04 |
| 8300-2275366634 Rick Little (5th Visit | 98466 | tech+day | Cory Ventura 2026-09-02 | Luke LaVergne 2026-08-31 |
| 5178-1770741183 Washington Premier Soc | 98371 | tech+day | Cory Ventura 2026-09-02 | Luke LaVergne 2026-09-04 |
| 7675-2038425287 Charlie  Brown | 98406 | tech+day | Cory Ventura 2026-09-02 | Luke LaVergne 2026-09-04 |
| 8308-2277557908 Annemarie Jesse (5th v | 98407 | tech+day | Cory Ventura 2026-09-02 | Luke LaVergne 2026-09-04 |
| 8336-2283654625 Dale Hoff | 98407 | tech+day | Cory Ventura 2026-09-02 | Luke LaVergne 2026-09-04 |
| 7497-1959126738 Bess  Poehlmann | 98407 | tech+day | Cory Ventura 2026-09-02 | Luke LaVergne 2026-09-04 |

## Policy notes

```json
{
  "weights": {
    "cap": 30,
    "zone": 1,
    "drift": 1,
    "late": 2,
    "softHours": 8,
    "wallHours": 9.5,
    "overdueMode": "week"
  },
  "ownerMap": {
    "jobs": 834,
    "dominant": 787,
    "neighbourVote": 47,
    "rosterFloor": 0,
    "medianDominantShare": 1,
    "note": "Dominant tech over completed visits strictly before the Friday 14:00 PT cutoff. master-asbuilt routeDay deliberately unused: it was derived over a window containing the golden weeks."
  },
  "windowTiers": {
    "active-measured": 237,
    "active-series": 117,
    "no-anchor": 47,
    "active-assumed": 119,
    "other-product": 11,
    "ambiguous-gap": 1
  },
  "windowClamps": {
    "none": 450,
    "overdue": 82,
    "early": 0
  },
  "windowTierNote": "active-measured = last delivered gap <=12d. quiet-measured = >=20d. active-assumed = a TMCP anchor but only one completed visit before the cutoff, so no gap to measure. no-anchor / ambiguous-gap / other-product fall back to the scheduled day +-2 weekdays.",
  "dayZones": {
    "k": 5,
    "perTech": [
      {
        "tech": "Alias Franks",
        "points": 268,
        "zones": 5,
        "spreadTies": 1,
        "weekdayMap": "mon:z0(57 pts, 21.1 min/stop, cap 27) tue:z3(56 pts, 31.9 min/stop, cap 17) wed:z2(54 pts, 29.1 min/stop, cap 19) thu:z1(21 pts, 25 min/stop, cap 22) fri:z4(80 pts, 22.5 min/stop, cap 25)"
      },
      {
        "tech": "Cory Ventura",
        "points": 292,
        "zones": 5,
        "spreadTies": 0,
        "weekdayMap": "mon:z4(55 pts, 14.1 min/stop, cap 40) tue:z1(58 pts, 14.5 min/stop, cap 39) wed:z3(52 pts, 14.3 min/stop, cap 39) thu:z0(68 pts, 17.9 min/stop, cap 31) fri:z2(59 pts, 15.4 min/stop, cap 37)"
      },
      {
        "tech": "Luke LaVergne",
        "points": 206,
        "zones": 5,
        "spreadTies": 1,
        "weekdayMap": "mon:z1(5 pts, 21.5 min/stop, cap 26) tue:z2(38 pts, 26.2 min/stop, cap 21) wed:z4(44 pts, 29 min/stop, cap 19) thu:z3(70 pts, 25.4 min/stop, cap 22) fri:z0(49 pts, 20 min/stop, cap 28)"
      },
      {
        "tech": "Robert Norton",
        "points": 260,
        "zones": 5,
        "spreadTies": 0,
        "weekdayMap": "mon:z2(45 pts, 23.9 min/stop, cap 23) tue:z3(44 pts, 22.7 min/stop, cap 25) wed:z0(53 pts, 18.6 min/stop, cap 30) thu:z1(38 pts, 22.9 min/stop, cap 24) fri:z4(80 pts, 22.8 min/stop, cap 25)"
      },
      {
        "tech": "Tavis Alexander",
        "points": 275,
        "zones": 5,
        "spreadTies": 1,
        "weekdayMap": "mon:z4(36 pts, 16.9 min/stop, cap 33) tue:z2(67 pts, 21.4 min/stop, cap 26) wed:z0(112 pts, 14.6 min/stop, cap 39) thu:z1(22 pts, 18.8 min/stop, cap 30) fri:z3(38 pts, 19.4 min/stop, cap 29)"
      }
    ]
  },
  "cycleTimes": {
    "file": "route-day-drive_2026-08-17_2026-09-17.json",
    "routeDaysBeforeWeek": 49,
    "allTechMedianMinPerStop": 21.04,
    "sources": {
      "tech+weekday": 25
    }
  },
  "capacityAtCycleTime": {
    "routeDays": 25,
    "over8h": 12,
    "over95h": 0,
    "maxHours": 9.49
  },
  "overflowCount": 4,
  "offRosterOwners": 0,
  "perTech": [
    {
      "tech": "Alias Franks",
      "visits": 114,
      "placed": 110,
      "overflow": 4,
      "searchPasses": 8,
      "moves": 0,
      "swaps": 108,
      "reinserted": 0,
      "finalCost": 1454,
      "zonePoints": 268,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-31",
          "dow": "mon",
          "stops": 27,
          "cycleMin": 21.1,
          "cycleSource": "tech+weekday",
          "capStops": 27,
          "cycleHours": 9.49,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-01",
          "dow": "tue",
          "stops": 17,
          "cycleMin": 31.9,
          "cycleSource": "tech+weekday",
          "capStops": 17,
          "cycleHours": 9.05,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-02",
          "dow": "wed",
          "stops": 19,
          "cycleMin": 29.1,
          "cycleSource": "tech+weekday",
          "capStops": 19,
          "cycleHours": 9.21,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-03",
          "dow": "thu",
          "stops": 22,
          "cycleMin": 25,
          "cycleSource": "tech+weekday",
          "capStops": 22,
          "cycleHours": 9.18,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-04",
          "dow": "fri",
          "stops": 25,
          "cycleMin": 22.5,
          "cycleSource": "tech+weekday",
          "capStops": 25,
          "cycleHours": 9.38,
          "over8": true,
          "over95": false
        }
      ]
    },
    {
      "tech": "Cory Ventura",
      "visits": 123,
      "placed": 123,
      "overflow": 0,
      "searchPasses": 1,
      "moves": 0,
      "swaps": 0,
      "reinserted": 0,
      "finalCost": 971,
      "zonePoints": 292,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-31",
          "dow": "mon",
          "stops": 32,
          "cycleMin": 14.1,
          "cycleSource": "tech+weekday",
          "capStops": 40,
          "cycleHours": 7.5,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-01",
          "dow": "tue",
          "stops": 23,
          "cycleMin": 14.5,
          "cycleSource": "tech+weekday",
          "capStops": 39,
          "cycleHours": 5.55,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-02",
          "dow": "wed",
          "stops": 28,
          "cycleMin": 14.3,
          "cycleSource": "tech+weekday",
          "capStops": 39,
          "cycleHours": 6.68,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-03",
          "dow": "thu",
          "stops": 19,
          "cycleMin": 17.9,
          "cycleSource": "tech+weekday",
          "capStops": 31,
          "cycleHours": 5.68,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-04",
          "dow": "fri",
          "stops": 21,
          "cycleMin": 15.4,
          "cycleSource": "tech+weekday",
          "capStops": 37,
          "cycleHours": 5.38,
          "over8": false,
          "over95": false
        }
      ]
    },
    {
      "tech": "Luke LaVergne",
      "visits": 70,
      "placed": 70,
      "overflow": 0,
      "searchPasses": 3,
      "moves": 7,
      "swaps": 7,
      "reinserted": 0,
      "finalCost": 986,
      "zonePoints": 206,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-31",
          "dow": "mon",
          "stops": 4,
          "cycleMin": 21.5,
          "cycleSource": "tech+weekday",
          "capStops": 26,
          "cycleHours": 1.43,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-01",
          "dow": "tue",
          "stops": 19,
          "cycleMin": 26.2,
          "cycleSource": "tech+weekday",
          "capStops": 21,
          "cycleHours": 8.29,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-02",
          "dow": "wed",
          "stops": 18,
          "cycleMin": 29,
          "cycleSource": "tech+weekday",
          "capStops": 19,
          "cycleHours": 8.71,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-03",
          "dow": "thu",
          "stops": 19,
          "cycleMin": 25.4,
          "cycleSource": "tech+weekday",
          "capStops": 22,
          "cycleHours": 8.04,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-04",
          "dow": "fri",
          "stops": 10,
          "cycleMin": 20,
          "cycleSource": "tech+weekday",
          "capStops": 28,
          "cycleHours": 3.33,
          "over8": false,
          "over95": false
        }
      ]
    },
    {
      "tech": "Robert Norton",
      "visits": 100,
      "placed": 100,
      "overflow": 0,
      "searchPasses": 3,
      "moves": 4,
      "swaps": 6,
      "reinserted": 0,
      "finalCost": 474,
      "zonePoints": 260,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-31",
          "dow": "mon",
          "stops": 20,
          "cycleMin": 23.9,
          "cycleSource": "tech+weekday",
          "capStops": 23,
          "cycleHours": 7.97,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-01",
          "dow": "tue",
          "stops": 21,
          "cycleMin": 22.7,
          "cycleSource": "tech+weekday",
          "capStops": 25,
          "cycleHours": 7.93,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-02",
          "dow": "wed",
          "stops": 23,
          "cycleMin": 18.6,
          "cycleSource": "tech+weekday",
          "capStops": 30,
          "cycleHours": 7.13,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-03",
          "dow": "thu",
          "stops": 15,
          "cycleMin": 22.9,
          "cycleSource": "tech+weekday",
          "capStops": 24,
          "cycleHours": 5.72,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-04",
          "dow": "fri",
          "stops": 21,
          "cycleMin": 22.8,
          "cycleSource": "tech+weekday",
          "capStops": 25,
          "cycleHours": 7.97,
          "over8": false,
          "over95": false
        }
      ]
    },
    {
      "tech": "Tavis Alexander",
      "visits": 125,
      "placed": 125,
      "overflow": 0,
      "searchPasses": 4,
      "moves": 20,
      "swaps": 30,
      "reinserted": 0,
      "finalCost": 839,
      "zonePoints": 275,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-31",
          "dow": "mon",
          "stops": 31,
          "cycleMin": 16.9,
          "cycleSource": "tech+weekday",
          "capStops": 33,
          "cycleHours": 8.76,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-01",
          "dow": "tue",
          "stops": 24,
          "cycleMin": 21.4,
          "cycleSource": "tech+weekday",
          "capStops": 26,
          "cycleHours": 8.56,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-02",
          "dow": "wed",
          "stops": 36,
          "cycleMin": 14.6,
          "cycleSource": "tech+weekday",
          "capStops": 39,
          "cycleHours": 8.76,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-03",
          "dow": "thu",
          "stops": 9,
          "cycleMin": 18.8,
          "cycleSource": "tech+weekday",
          "capStops": 30,
          "cycleHours": 2.82,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-04",
          "dow": "fri",
          "stops": 25,
          "cycleMin": 19.4,
          "cycleSource": "tech+weekday",
          "capStops": 29,
          "cycleHours": 8.07,
          "over8": true,
          "over95": false
        }
      ]
    }
  ],
  "historyVisitsBeforeCutoff": 1301,
  "historyDays": 12
}
```

---

Hours are modelled with `travel.mjs` over each route-day in its own order, including the inbound leg from the tech's inferred start area and excluding the trip home. Proposal and actual are timed with the identical model and identical per-visit service minutes, so any difference is the board, not the clock.