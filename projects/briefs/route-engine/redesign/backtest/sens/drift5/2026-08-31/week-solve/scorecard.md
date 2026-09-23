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
| same day >= 95% | 51.9 | FAIL |
| route-day hours within +-10% | 5/24 (20.8%) | FAIL |
| route-day hours within +-10% (board only, same sequencer) _(advisory)_ | 4/24 (16.7%) | FAIL |
| no dropped visits | 4 | FAIL |
| no invented visits | 0 | PASS |
| no weekend placements | 0 | PASS |
| every visit inside its due window (clamped to the week) | 528/528 (100%) | PASS |
| inside the raw due window, before clamping to the week _(advisory)_ | 446/528 (84.5%) | FAIL |
| no route-day over 9.5 h (modelled travel + service) _(advisory)_ | 6 of 25 (actual: 4/25) | FAIL |
| route-day total time within +-5% of the OptimoRoute day (compactness) _(advisory)_ | 3/24 (12.5%) | FAIL |
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
| Actual run (completion stamps) | 528 | 89.2% | 51.9% | 49.2% |
| OptimoRoute route as held | 521 | 89.6% | 52.6% | 49.7% |

## Hours per route-day

| Metric | Value |
|---|---:|
| Route-days with both a proposal and an actual | 24 |
| Within +-10% of actual | 5 (20.8%) |
| Median proposal/actual ratio | 1.03 |
| **Board only** — within +-10% when the actual day is re-sequenced by us | 4/24 (16.7%) |
| **Board only** — median ratio | 1.12 |
| Route-days only in the proposal | 1 |
| Route-days only in the actual | 1 |
| Total proposal hours | 199.9 |
| Total actual hours | 197 |
| Actual stop order taken from | OptimoRoute 524, completion stamps 8, schedule 0 |

The headline hours ratio moves for two reasons at once: a different board, and a different stop order. The **board only** row re-sequences the actual day with the same sequencer, so what remains is purely the board.

## Sequence quality (same stop set, two orders)

| Metric | Value |
|---|---:|
| Route-days compared | 22 |
| Median drive-time ratio (ours / OptimoRoute) | 0.91 |
| Median distance ratio | 0.94 |
| **Uniform-model control** — median drive ratio, estimator only | 0.97 |
| Legs our order has to estimate (median) | 48.4% |
| Legs OptimoRoute's order has to estimate (median) | 28.4% |
| Route-days we beat OptimoRoute on drive time | 17 |
| Route-days OptimoRoute beat us | 2 |
| Route-days we beat it under the uniform control | 14 |
| Total drive minutes, ours vs OptimoRoute | 2100.1 vs 2297.8 |

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
| Over 9.5 h — the hard wall | 6 | 4 |
| Longest route-day, hours | 12.84 | 10.82 |
| Median route-day, hours | 8.18 | 8.03 |
| Route-day time within +-5% of the OptimoRoute day | 3/24 (12.5%) | - |
| Route-day ratio range | 0.22 - 1.77 | - |
| Overflow — could not fit under the wall | 4 | - |
| Late bookings — the add-queue load | 54 | - |

## Per-tech weekly hours

| Tech | Days | Stops | Proposal h | Actual h | Delta h |
|---|---:|---:|---:|---:|---:|
| Alias Franks | 5/6 | 110/115 | 41.6 | 43.4 | -1.7 |
| Cory Ventura | 5/4 | 123/90 | 41.2 | 27 | 14.2 |
| Luke LaVergne | 5/5 | 70/92 | 36.5 | 41.9 | -5.4 |
| Robert Norton | 5/5 | 100/112 | 35.3 | 39.6 | -4.3 |
| Tavis Alexander | 5/5 | 125/123 | 45.3 | 45.1 | 0.2 |

## Route-days

| Date | Dow | Tech | Stops p/a | Prop h | Act h | Ratio | +-10% | Board ratio | Seq drive p/a | Seq ratio |
|---|---|---|---:|---:|---:|---:|:---:|---:|---:|---:|
| 2026-08-25 | tue | Alias Franks | -/1 | - | 0.51 | - | - | - | - | - |
| 2026-08-31 | mon | Alias Franks | 27/25 | 10.66 | 8.66 | 1.23 | FAIL | 1.26 | 75.9/81.8 | 0.93 |
| 2026-09-01 | tue | Alias Franks | 17/25 | 6.32 | 9.47 | 0.67 | FAIL | 0.68 | 94.2/103.1 | 0.91 |
| 2026-09-02 | wed | Alias Franks | 19/20 | 7.17 | 8.44 | 0.85 | FAIL | 0.93 | 37/37 | 1 |
| 2026-09-03 | thu | Alias Franks | 22/20 | 8.4 | 7.98 | 1.05 | PASS | 1.11 | 122.3/137.1 | 0.89 |
| 2026-09-04 | fri | Alias Franks | 25/24 | 9.09 | 8.3 | 1.1 | PASS | 1.12 | 81.8/85 | 0.96 |
| 2026-08-31 | mon | Cory Ventura | 36/24 | 12.17 | 7.26 | 1.68 | FAIL | 1.74 | 105.2/115.8 | 0.91 |
| 2026-09-01 | tue | Cory Ventura | 22/20 | 7.81 | 6.66 | 1.17 | FAIL | 1.26 | 116.7/129.7 | 0.9 |
| 2026-09-02 | wed | Cory Ventura | 26/24 | 9.2 | 6.67 | 1.38 | FAIL | 1.44 | - | - |
| 2026-09-03 | thu | Cory Ventura | 26/22 | 7.9 | 6.4 | 1.23 | FAIL | 1.3 | 52.7/46.3 | 1.14 |
| 2026-09-04 | fri | Cory Ventura | 13/- | 4.09 | - | - | - | - | - | - |
| 2026-08-31 | mon | Luke LaVergne | 16/18 | 10.16 | 8.75 | 1.16 | FAIL | 1.33 | 65.9/65.9 | 1 |
| 2026-09-01 | tue | Luke LaVergne | 18/24 | 9.34 | 10.82 | 0.86 | FAIL | 0.91 | 200.9/223.5 | 0.9 |
| 2026-09-02 | wed | Luke LaVergne | 17/13 | 8.18 | 7.11 | 1.15 | FAIL | 1.3 | 120.7/150.3 | 0.8 |
| 2026-09-03 | thu | Luke LaVergne | 15/16 | 7.02 | 7.2 | 0.98 | PASS | 1 | 184.1/184.7 | 1 |
| 2026-09-04 | fri | Luke LaVergne | 4/21 | 1.78 | 8.03 | 0.22 | FAIL | 0.23 | 46.7/53.5 | 0.87 |
| 2026-08-31 | mon | Robert Norton | 22/20 | 8.6 | 7.2 | 1.19 | FAIL | 1.22 | 63/67.1 | 0.94 |
| 2026-09-01 | tue | Robert Norton | 22/25 | 7.46 | 8.93 | 0.84 | FAIL | 0.86 | 108.7/124.1 | 0.88 |
| 2026-09-02 | wed | Robert Norton | 22/22 | 7.59 | 7.51 | 1.01 | PASS | 1.03 | 79.1/82.2 | 0.96 |
| 2026-09-03 | thu | Robert Norton | 15/21 | 5.48 | 7.67 | 0.72 | FAIL | 0.75 | 104.1/120.1 | 0.87 |
| 2026-09-04 | fri | Robert Norton | 19/24 | 6.2 | 8.28 | 0.75 | FAIL | 0.79 | 74.2/81.4 | 0.91 |
| 2026-08-31 | mon | Tavis Alexander | 33/28 | 12.84 | 9.6 | 1.34 | FAIL | 1.33 | 99.2/98.2 | 1.01 |
| 2026-09-01 | tue | Tavis Alexander | 25/28 | 8.67 | 10 | 0.87 | FAIL | 0.89 | 128.1/152.2 | 0.84 |
| 2026-09-02 | wed | Tavis Alexander | 37/23 | 11.76 | 6.65 | 1.77 | FAIL | 1.87 | 42.6/47.5 | 0.9 |
| 2026-09-03 | thu | Tavis Alexander | 4/23 | 2.36 | 9.07 | 0.26 | FAIL | 0.3 | - | - |
| 2026-09-04 | fri | Tavis Alexander | 26/21 | 9.67 | 9.79 | 0.99 | PASS | 1.21 | 97/111.3 | 0.87 |

## Tech/day mismatches (268 total, first 60)

| Visit | Zip | Wrong | Proposed | Actual |
|---|---|---|---|---|
| 6402-1651426617 Melissa Street | 98045 | tech+day | Alias Franks 2026-08-31 | Tavis Alexander 2026-09-04 |
| 6660-2293788805 Craig Knebel | 98177 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-01 |
| 7543-1988650555 Edward Yang | 98177 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-01 |
| 7434-2296121832 Linda Lowe | 98077 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-02 |
| 6970-2295607674 Mary Olin | 98052 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-02 |
| 8233-2265627931 Vicky Marxen | 98074 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-03 |
| 6375-2296591400 Mike Cushman | 98077 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-03 |
| 8154-2248818913 Kim Suver | 98074 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 6919-1832480807 Corky Heimbigner | 98075 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 8256-2268932059 Doug Crow | 98075 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 5104-1668537502 Nathan Barness | 98075 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 8156-2248881712 Deborah Berger | 98075 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 6355-1637516858 Julie James | 98075 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 7817-2106876955 Josh Hedrick | 98075 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 8394-2293211676 Sachin Gupta | 98075 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 6810-1815091723 Doug  Schutt | 98075 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 8265-2270506349 Jepson Fuller | 98075 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 8339-2284306049 Donald Kaplan | 98074 | day | Alias Franks 2026-08-31 | Alias Franks 2026-09-04 |
| 6926-2301207768 Chris Mckenzie - one Y | 98005 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 7285-2301170936 Andrea Estes | 98005 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 8281-2273476558 James Paxton (5th Visi | 98004 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 8313-2289385794 Nik bhogal | 98004 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 6392-2300395711 Dan Hazen | 98004 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 7384-2300526328 Kevin Chen | 98039 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 7183-2300843276 Eric Dworkis - one yea | 98007 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 8335-2282549559 Alicia Hoare | 98005 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 7756-2301143786 Annette Wood | 98005 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 4703-2301126510 Joel Glass | 98005 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 8293-2301076930 Francis Abraham | 98052 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 8311-2277566639 Steve Tullis (5th Visi | 98052 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 8367-2287754033 Daniel Hill | 98008 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 7546-2301040724 Marymoor Park - Marymo | 98052 | day | Alias Franks 2026-09-02 | Alias Franks 2026-08-31 |
| 6392-1650121780 Dan Hazen (PROBLEM JOB | 98004 | tech+day | Alias Franks 2026-09-02 | Tavis Alexander 2026-09-03 |
| 8307-2277550492 Tanya Parry | 98052 | day | Alias Franks 2026-09-02 | Alias Franks 2026-09-03 |
| 8306-2277540084 Dino P. Simone (5th Vi | 98074 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-03 |
| 8302-2275942854 Spencer Jacobs (5th Vi | 98125 | day | Alias Franks 2026-09-01 | Alias Franks 2026-08-25 |
| 8238-2265641331 Joshua  Chao | 98125 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-01 |
| 8299-2275356286 Kirsten Mcclelland (5t | 98115 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-01 |
| 8245-2302016358 Tad Hutchison | 98115 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-01 |
| 6420-1658060971 Vikrant Jain | 98115 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-01 |
| 8178-2254867766 Leslie Bratrud | 98105 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-01 |
| 8036-2225664949 Garett Gowens | 98155 | day | Alias Franks 2026-09-03 | Alias Franks 2026-09-01 |
| 8447-2301448513 Tia Gong | 98008 | day | Alias Franks 2026-09-04 | Alias Franks 2026-08-31 |
| 6849-1820873831 Michelle  Rasmussen -  | 98072 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8285-2273489072 David Alexander | 98072 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 7504-1960881329 Lisa Shaughnessy | 98072 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 7639-2022582006 Marla Poor | 98072 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8042-2226606804 Dave Parker | 98077 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8378-2289327633 Drew Culver | 98077 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8298-2275009707 Melinda Holland | 98052 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 5531-1805401521 Conover Court | 98052 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8450-2301459641 Ashok Shivani | 98033 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8455-2303096700 Shelly Evans | 98034 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 8384-2292302812 Marjory Laymon | 98034 | day | Alias Franks 2026-09-04 | Alias Franks 2026-09-02 |
| 5536-2289776184 Clark Potter | 98042 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-02 |
| 6275-2292360247 Mike Tonda | 98038 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-02 |
| 7306-2292448524 Greg Anderson | 98038 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-02 |
| 4880-1912508644 Matt Swank | 98038 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-02 |
| 4608-2295808602 Kristi Rice | 98373 | day | Cory Ventura 2026-08-31 | Cory Ventura 2026-09-01 |
| 8137-2246402530 Brenda Vonderahe | 98321 | tech+day | Cory Ventura 2026-08-31 | Robert Norton 2026-09-04 |

## Policy notes

```json
{
  "weights": {
    "cap": 30,
    "zone": 1,
    "drift": 5,
    "late": 2,
    "softHours": 8,
    "wallHours": 9.5,
    "overdueMode": "monday"
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
    "over8h": 13,
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
      "finalCost": 2062,
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
      "searchPasses": 2,
      "moves": 0,
      "swaps": 1,
      "reinserted": 0,
      "finalCost": 1212,
      "zonePoints": 292,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-31",
          "dow": "mon",
          "stops": 36,
          "cycleMin": 14.1,
          "cycleSource": "tech+weekday",
          "capStops": 40,
          "cycleHours": 8.44,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-01",
          "dow": "tue",
          "stops": 22,
          "cycleMin": 14.5,
          "cycleSource": "tech+weekday",
          "capStops": 39,
          "cycleHours": 5.3,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-02",
          "dow": "wed",
          "stops": 26,
          "cycleMin": 14.3,
          "cycleSource": "tech+weekday",
          "capStops": 39,
          "cycleHours": 6.2,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-03",
          "dow": "thu",
          "stops": 26,
          "cycleMin": 17.9,
          "cycleSource": "tech+weekday",
          "capStops": 31,
          "cycleHours": 7.77,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-04",
          "dow": "fri",
          "stops": 13,
          "cycleMin": 15.4,
          "cycleSource": "tech+weekday",
          "capStops": 37,
          "cycleHours": 3.33,
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
      "searchPasses": 2,
      "moves": 4,
      "swaps": 7,
      "reinserted": 0,
      "finalCost": 1632,
      "zonePoints": 206,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-31",
          "dow": "mon",
          "stops": 16,
          "cycleMin": 21.5,
          "cycleSource": "tech+weekday",
          "capStops": 26,
          "cycleHours": 5.73,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-01",
          "dow": "tue",
          "stops": 18,
          "cycleMin": 26.2,
          "cycleSource": "tech+weekday",
          "capStops": 21,
          "cycleHours": 7.86,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-02",
          "dow": "wed",
          "stops": 17,
          "cycleMin": 29,
          "cycleSource": "tech+weekday",
          "capStops": 19,
          "cycleHours": 8.22,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-03",
          "dow": "thu",
          "stops": 15,
          "cycleMin": 25.4,
          "cycleSource": "tech+weekday",
          "capStops": 22,
          "cycleHours": 6.35,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-04",
          "dow": "fri",
          "stops": 4,
          "cycleMin": 20,
          "cycleSource": "tech+weekday",
          "capStops": 28,
          "cycleHours": 1.33,
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
      "searchPasses": 4,
      "moves": 7,
      "swaps": 9,
      "reinserted": 0,
      "finalCost": 815,
      "zonePoints": 260,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-31",
          "dow": "mon",
          "stops": 22,
          "cycleMin": 23.9,
          "cycleSource": "tech+weekday",
          "capStops": 23,
          "cycleHours": 8.77,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-01",
          "dow": "tue",
          "stops": 22,
          "cycleMin": 22.7,
          "cycleSource": "tech+weekday",
          "capStops": 25,
          "cycleHours": 8.31,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-02",
          "dow": "wed",
          "stops": 22,
          "cycleMin": 18.6,
          "cycleSource": "tech+weekday",
          "capStops": 30,
          "cycleHours": 6.82,
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
          "stops": 19,
          "cycleMin": 22.8,
          "cycleSource": "tech+weekday",
          "capStops": 25,
          "cycleHours": 7.21,
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
      "searchPasses": 5,
      "moves": 15,
      "swaps": 56,
      "reinserted": 0,
      "finalCost": 1565,
      "zonePoints": 275,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-31",
          "dow": "mon",
          "stops": 33,
          "cycleMin": 16.9,
          "cycleSource": "tech+weekday",
          "capStops": 33,
          "cycleHours": 9.32,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-01",
          "dow": "tue",
          "stops": 25,
          "cycleMin": 21.4,
          "cycleSource": "tech+weekday",
          "capStops": 26,
          "cycleHours": 8.92,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-02",
          "dow": "wed",
          "stops": 37,
          "cycleMin": 14.6,
          "cycleSource": "tech+weekday",
          "capStops": 39,
          "cycleHours": 9,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-09-03",
          "dow": "thu",
          "stops": 4,
          "cycleMin": 18.8,
          "cycleSource": "tech+weekday",
          "capStops": 30,
          "cycleHours": 1.25,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-09-04",
          "dow": "fri",
          "stops": 26,
          "cycleMin": 19.4,
          "cycleSource": "tech+weekday",
          "capStops": 29,
          "cycleHours": 8.39,
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