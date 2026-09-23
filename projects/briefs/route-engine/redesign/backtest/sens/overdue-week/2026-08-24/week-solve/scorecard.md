# Backtest scorecard — 2026-08-24 · week-solve

The S4 design: owner map from history, due windows from the last visit, the week solved per tech under capacity, zone compactness and window constraints.

| | |
|---|---|
| Golden week | 2026-08-24 (2026-08-24 .. 2026-08-28) |
| Plan-time cutoff | 2026-08-21T21:00:00.000Z (Friday 14:00 PT) |
| Policy | `week-solve` |
| Techs | Alias Franks, Cory Ventura, Luke LaVergne, Robert Norton, Tavis Alexander |
| Overall | **FAIL** |

## Gates

| Gate | Value | Result |
|---|---:|:---:|
| same tech >= 95% | 87.5 | FAIL |
| same day >= 95% | 74.4 | FAIL |
| route-day hours within +-10% | 11/24 (45.8%) | FAIL |
| route-day hours within +-10% (board only, same sequencer) _(advisory)_ | 10/24 (41.7%) | FAIL |
| no dropped visits | 16 | FAIL |
| no invented visits | 0 | PASS |
| no weekend placements | 0 | PASS |
| every visit inside its due window (clamped to the week) | 536/536 (100%) | PASS |
| inside the raw due window, before clamping to the week _(advisory)_ | 527/536 (98.3%) | FAIL |
| no route-day over 9.5 h (modelled travel + service) _(advisory)_ | 3 of 25 (actual: 3/24) | FAIL |
| route-day total time within +-5% of the OptimoRoute day (compactness) _(advisory)_ | 6/24 (25%) | FAIL |
| no overflow (visits that would not fit under the wall) _(advisory)_ | 16 | FAIL |
| late bookings (created after the cutoff — the add-queue load) _(advisory)_ | 55 | PASS |

## Coverage

| Metric | Count |
|---|---:|
| Visits due and known at the cutoff | 552 |
| Late bookings (created after the cutoff, excluded) | 55 |
| Visits the policy placed | 536 |
| Dropped (due, never placed) | 16 |
| Invented (placed, not due) | 0 |
| Duplicate placements | 0 |
| Placed on a weekend | 0 |
| Placed outside the golden week | 0 |
| Due visits with no resolvable actual | 0 |
| OptimoRoute ghost orders (no Jobber visit) | 2 |

## Agreement with what ran

| Reference | n | Same tech | Same day | Both |
|---|---:|---:|---:|---:|
| Actual run (completion stamps) | 536 | 87.5% | 74.4% | 65.7% |
| OptimoRoute route as held | 536 | 89.9% | 74.3% | 68.3% |

## Hours per route-day

| Metric | Value |
|---|---:|
| Route-days with both a proposal and an actual | 24 |
| Within +-10% of actual | 11 (45.8%) |
| Median proposal/actual ratio | 0.97 |
| **Board only** — within +-10% when the actual day is re-sequenced by us | 10/24 (41.7%) |
| **Board only** — median ratio | 1 |
| Route-days only in the proposal | 1 |
| Route-days only in the actual | 0 |
| Total proposal hours | 191 |
| Total actual hours | 201.7 |
| Actual stop order taken from | OptimoRoute 549, completion stamps 3, schedule 0 |

The headline hours ratio moves for two reasons at once: a different board, and a different stop order. The **board only** row re-sequences the actual day with the same sequencer, so what remains is purely the board.

## Sequence quality (same stop set, two orders)

| Metric | Value |
|---|---:|
| Route-days compared | 22 |
| Median drive-time ratio (ours / OptimoRoute) | 0.93 |
| Median distance ratio | 0.92 |
| **Uniform-model control** — median drive ratio, estimator only | 0.95 |
| Legs our order has to estimate (median) | 42.3% |
| Legs OptimoRoute's order has to estimate (median) | 12.9% |
| Route-days we beat OptimoRoute on drive time | 20 |
| Route-days OptimoRoute beat us | 1 |
| Route-days we beat it under the uniform control | 17 |
| Total drive minutes, ours vs OptimoRoute | 2464.4 vs 2735.5 |

Read the uniform-model control, not the headline ratio. OptimoRoute actually drove every leg in its own order, so those legs are real measurements in the travel model; any re-ordering invents legs nobody has driven and they fall back to a haversine estimator whose median per-leg error is around 20%. The headline ratio therefore flatters any re-ordering. The control times both orders with the estimator alone, so neither side gets that advantage.

## Design gates (S4 section 5)

| Due-window compliance | Value |
|---|---:|
| Visits carrying a window | 536 |
| Placed inside the window, clamped to the week | 536 (100%) |
| Placed inside the raw window | 527 (98.3%) |

| Window type | n | Inside raw | Inside clamped |
|---|---:|---:|---:|
| active-assumed | 242 | 96.3% | 100% |
| no-anchor | 121 | 100% | 100% |
| active-series | 109 | 100% | 100% |
| active-measured | 48 | 100% | 100% |
| other-product | 16 | 100% | 100% |

A window that opens before the golden week or closes after it cannot be obeyed inside a Monday-to-Friday solve. The clamped column is what the solver could actually hold; the raw column is the window the cadence rule asked for, and the gap between them is the design telling you how much work the office was already carrying late.

| Capacity and compactness | Proposal | Actual |
|---|---:|---:|
| Route-days | 25 | 24 |
| Over 8 h (modelled travel + service) | 13 | 16 |
| Over 9.5 h — the hard wall | 3 | 3 |
| Longest route-day, hours | 10.82 | 11.18 |
| Median route-day, hours | 8.36 | 8.22 |
| Route-day time within +-5% of the OptimoRoute day | 6/24 (25%) | - |
| Route-day ratio range | 0.36 - 1.46 | - |
| Overflow — could not fit under the wall | 16 | - |
| Late bookings — the add-queue load | 55 | - |

## Per-tech weekly hours

| Tech | Days | Stops | Proposal h | Actual h | Delta h |
|---|---:|---:|---:|---:|---:|
| Alias Franks | 5/5 | 118/116 | 43.8 | 43.2 | 0.6 |
| Cory Ventura | 5/5 | 114/116 | 35.3 | 36.2 | -0.9 |
| Luke LaVergne | 5/4 | 85/69 | 38.7 | 33.2 | 5.5 |
| Robert Norton | 5/5 | 107/115 | 36.1 | 39.7 | -3.6 |
| Tavis Alexander | 5/5 | 112/136 | 37.2 | 49.4 | -12.2 |

## Route-days

| Date | Dow | Tech | Stops p/a | Prop h | Act h | Ratio | +-10% | Board ratio | Seq drive p/a | Seq ratio |
|---|---|---|---:|---:|---:|---:|:---:|---:|---:|---:|
| 2026-08-24 | mon | Alias Franks | 26/26 | 8.75 | 9.08 | 0.96 | PASS | 1.01 | 130.7/151 | 0.87 |
| 2026-08-25 | tue | Alias Franks | 22/20 | 8.41 | 7.9 | 1.06 | PASS | 1.17 | 99.9/105.7 | 0.94 |
| 2026-08-26 | wed | Alias Franks | 20/22 | 7.74 | 8.69 | 0.89 | FAIL | 0.96 | 84.4/120.1 | 0.7 |
| 2026-08-27 | thu | Alias Franks | 24/24 | 9.13 | 8.89 | 1.03 | PASS | 1.07 | 119.9/126.6 | 0.95 |
| 2026-08-28 | fri | Alias Franks | 26/24 | 9.75 | 8.62 | 1.13 | FAIL | 1.15 | 118.4/125.3 | 0.94 |
| 2026-08-24 | mon | Cory Ventura | 37/27 | 10.82 | 7.42 | 1.46 | FAIL | 1.49 | 111.3/110.9 | 1 |
| 2026-08-25 | tue | Cory Ventura | 14/23 | 4.57 | 7.9 | 0.58 | FAIL | 0.64 | 97.5/105.8 | 0.92 |
| 2026-08-26 | wed | Cory Ventura | 27/20 | 7.9 | 6 | 1.32 | FAIL | 1.33 | 124.1/120.1 | 1.03 |
| 2026-08-27 | thu | Cory Ventura | 8/29 | 2.95 | 8.28 | 0.36 | FAIL | 0.36 | - | - |
| 2026-08-28 | fri | Cory Ventura | 28/17 | 9.08 | 6.63 | 1.37 | FAIL | 1.4 | - | - |
| 2026-08-24 | mon | Luke LaVergne | 12/21 | 6.36 | 9.26 | 0.69 | FAIL | 0.74 | 139.1/165.3 | 0.84 |
| 2026-08-25 | tue | Luke LaVergne | 19/16 | 8.55 | 8.04 | 1.06 | PASS | 1.14 | 194.3/221.3 | 0.88 |
| 2026-08-26 | wed | Luke LaVergne | 17/14 | 8.44 | 7.72 | 1.09 | PASS | 1.26 | 195.4/228.8 | 0.85 |
| 2026-08-27 | thu | Luke LaVergne | 18/18 | 7.98 | 8.16 | 0.98 | PASS | 0.98 | 201.7/210.9 | 0.96 |
| 2026-08-28 | fri | Luke LaVergne | 19/- | 7.32 | - | - | - | - | - | - |
| 2026-08-24 | mon | Robert Norton | 20/21 | 6.9 | 7.73 | 0.89 | FAIL | 0.93 | 100.7/112.8 | 0.89 |
| 2026-08-25 | tue | Robert Norton | 26/27 | 8.66 | 9.31 | 0.93 | PASS | 0.96 | 106.8/114.6 | 0.93 |
| 2026-08-26 | wed | Robert Norton | 25/25 | 8.36 | 8.05 | 1.04 | PASS | 1.06 | 71.5/76.8 | 0.93 |
| 2026-08-27 | thu | Robert Norton | 16/22 | 5.71 | 8.07 | 0.71 | FAIL | 0.74 | 102.5/119.9 | 0.85 |
| 2026-08-28 | fri | Robert Norton | 20/20 | 6.47 | 6.53 | 0.99 | PASS | 1.02 | 66.5/70.3 | 0.95 |
| 2026-08-24 | mon | Tavis Alexander | 16/26 | 5.54 | 9.03 | 0.61 | FAIL | 0.65 | 72.2/82.2 | 0.88 |
| 2026-08-25 | tue | Tavis Alexander | 26/28 | 8.63 | 11.18 | 0.77 | FAIL | 0.84 | 77/88.9 | 0.87 |
| 2026-08-26 | wed | Tavis Alexander | 33/32 | 9.73 | 9.63 | 1.01 | PASS | 1.08 | 64/85 | 0.75 |
| 2026-08-27 | thu | Tavis Alexander | 25/25 | 8.36 | 8.9 | 0.94 | PASS | 1 | 72.6/75.7 | 0.96 |
| 2026-08-28 | fri | Tavis Alexander | 12/25 | 4.9 | 10.64 | 0.46 | FAIL | 0.52 | 113.9/117.5 | 0.97 |

## Tech/day mismatches (184 total, first 60)

| Visit | Zip | Wrong | Proposed | Actual |
|---|---|---|---|---|
| 4771-2293000199 Nancy Krossa | 98033 | day | Alias Franks 2026-08-26 | Alias Franks 2026-08-24 |
| 7525-2292357089 Denica Bucklin | 98008 | tech+day | Alias Franks 2026-08-24 | Tavis Alexander 2026-08-27 |
| 4905-1637600089 Ashley Clark | 98075 | tech | Alias Franks 2026-08-28 | Tavis Alexander 2026-08-28 |
| 8263-2270434990 Terry Tuttle (5th Visi | 98029 | tech | Alias Franks 2026-08-28 | Tavis Alexander 2026-08-28 |
| 7417-1926987067 Michael Morgan | 98075 | tech | Alias Franks 2026-08-28 | Tavis Alexander 2026-08-28 |
| 8306-2277540082 Dino P. Simone | 98074 | day | Alias Franks 2026-08-27 | Alias Franks 2026-08-28 |
| 8347-2285418445 David Jones | 98028 | day | Alias Franks 2026-08-26 | Alias Franks 2026-08-25 |
| 8178-2254867762 Leslie Bratrud | 98105 | day | Alias Franks 2026-08-26 | Alias Franks 2026-08-25 |
| 7903-2166549247 Mike Doud | 98109 | tech | Alias Franks 2026-08-25 | Tavis Alexander 2026-08-25 |
| 8421-2296258864 Erik Severson (SET) | 98119 | tech | Alias Franks 2026-08-25 | Tavis Alexander 2026-08-25 |
| 8278-2273468548 Jessica Saab | 98199 | tech | Alias Franks 2026-08-25 | Tavis Alexander 2026-08-25 |
| 8283-2273481016 Susan Eggleton | 98199 | tech | Alias Franks 2026-08-25 | Tavis Alexander 2026-08-25 |
| 8239-2265641605 Michael Winkler (5th V | 98199 | tech | Alias Franks 2026-08-25 | Tavis Alexander 2026-08-25 |
| 8373-2288590952 Carey Jenkins | 98102 | tech | Alias Franks 2026-08-25 | Tavis Alexander 2026-08-25 |
| 8252-2268583215 Huy Nguyen (5th Visit) | 98155 | day | Alias Franks 2026-08-26 | Alias Franks 2026-08-25 |
| 6436-2294435204 Bobby  Holt | 98112 | tech | Alias Franks 2026-08-25 | Tavis Alexander 2026-08-25 |
| 8036-2293508114 Garett Gowens | 98155 | day | Alias Franks 2026-08-26 | Alias Franks 2026-08-25 |
| 8282-2273478822 Ryan Belmont | 98112 | tech+day | Alias Franks 2026-08-27 | Tavis Alexander 2026-08-25 |
| 8304-2276023003 Chris Poppy | 98122 | tech+day | Alias Franks 2026-08-27 | Tavis Alexander 2026-08-25 |
| 7802-2097019384 Kallin Baumann | 98019 | day | Alias Franks 2026-08-26 | Alias Franks 2026-08-27 |
| 6757-2151444022 Ryan Tacher | 98040 | tech | Alias Franks 2026-08-27 | Tavis Alexander 2026-08-27 |
| 6607-2287123153 Jonathan Kim-Hull | 98077 | day | Alias Franks 2026-08-26 | Alias Franks 2026-08-27 |
| 8355-2286291992 Carlos Villagomez  | 98019 | day | Alias Franks 2026-08-26 | Alias Franks 2026-08-27 |
| 6271-2297401576 Dan Golden | 98019 | day | Alias Franks 2026-08-26 | Alias Franks 2026-08-27 |
| 7477-2297249981 Melissa  Osvaldik | 98024 | tech+day | Alias Franks 2026-08-27 | Tavis Alexander 2026-08-28 |
| 8258-2268936652 Ken Larson | 98024 | tech+day | Alias Franks 2026-08-27 | Tavis Alexander 2026-08-28 |
| 8233-2265628466 Vicky Marxen (PROBLEM  | 98074 | day | Alias Franks 2026-08-27 | Alias Franks 2026-08-28 |
| 8154-2296811495 Kim Suver | 98074 | day | Alias Franks 2026-08-27 | Alias Franks 2026-08-28 |
| 8224-2262415872 Kelsey Peck | 98045 | tech | Alias Franks 2026-08-28 | Tavis Alexander 2026-08-28 |
| 8315-2277578707 Scott Vojik | 98045 | tech | Alias Franks 2026-08-28 | Tavis Alexander 2026-08-28 |
| 7449-2285905550 Sally  Gasser | 98051 | tech | Cory Ventura 2026-08-24 | Robert Norton 2026-08-24 |
| 7735-2292802408 Mike Coile | 98051 | tech | Cory Ventura 2026-08-24 | Robert Norton 2026-08-24 |
| 7771-2292829469 McKenzie  Dickson | 98051 | tech | Cory Ventura 2026-08-24 | Robert Norton 2026-08-24 |
| 7450-2292853099 Amy Thomas | 98051 | tech | Cory Ventura 2026-08-24 | Robert Norton 2026-08-24 |
| 8291-2291898534 John & Jasmine Foth | 98042 | tech | Cory Ventura 2026-08-24 | Robert Norton 2026-08-24 |
| 8259-2268948418 Roseanne Ingroia (5th  | 98038 | day | Cory Ventura 2026-08-24 | Cory Ventura 2026-08-27 |
| 7117-2292209261 Tom Feldman | 98058 | day | Cory Ventura 2026-08-24 | Cory Ventura 2026-08-27 |
| 5829-2292604420 Tom Hornberg | 98038 | day | Cory Ventura 2026-08-24 | Cory Ventura 2026-08-27 |
| 8385-2292313005 Clark Lehigh | 98038 | day | Cory Ventura 2026-08-24 | Cory Ventura 2026-08-27 |
| 5458-2292362413 Jake Nettleton | 98038 | day | Cory Ventura 2026-08-24 | Cory Ventura 2026-08-27 |
| 4545-2292435029 Randy Stegmeier | 98038 | day | Cory Ventura 2026-08-24 | Cory Ventura 2026-08-27 |
| 6287-2292492051 Charles Hahn - ANNUAL  | 98038 | day | Cory Ventura 2026-08-24 | Cory Ventura 2026-08-27 |
| 8403-2294002254 Susan Eibey | 98042 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-24 |
| 8413-2298216852 Rick Broderick | 98168 | tech+day | Cory Ventura 2026-08-28 | Tavis Alexander 2026-08-25 |
| 5371-2298507267 Jeff Ostlund | 98059 | tech+day | Cory Ventura 2026-08-28 | Tavis Alexander 2026-08-26 |
| 8317-2277586179 Mark Brainard | 98059 | tech+day | Cory Ventura 2026-08-28 | Tavis Alexander 2026-08-26 |
| 8219-2298470096 Trent Bryan | 98059 | tech+day | Cory Ventura 2026-08-28 | Tavis Alexander 2026-08-26 |
| 7594-2298397500 Dalveer Josan | 98059 | tech+day | Cory Ventura 2026-08-28 | Tavis Alexander 2026-08-26 |
| 8377-2289229853 Ranju Atwal | 98059 | tech+day | Cory Ventura 2026-08-28 | Tavis Alexander 2026-08-26 |
| 7904-2298452741 Ben Gardner | 98056 | tech+day | Cory Ventura 2026-08-28 | Tavis Alexander 2026-08-26 |
| 6900-2298032994 Jeff Hunter | 98042 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-27 |
| 4515-2298009620 Kelly Kunz | 98042 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-27 |
| 7971-2298081852 David Marsh | 98042 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-27 |
| 6500-2298110473 Sheri Powers | 98058 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-27 |
| 7837-2298166171 Karen Baker | 98055 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-27 |
| 8200-2298273280 GenCare - 1 Year Mole  | 98055 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-27 |
| 7987-2298302290 David  Lloyd | 98058 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-27 |
| 8422-2296261765 Mauricio Silva | 98058 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-27 |
| 8170-2298353294 Ross Luo | 98059 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-27 |
| 8350-2298342709 Ross Luo | 98059 | day | Cory Ventura 2026-08-28 | Cory Ventura 2026-08-27 |

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
    "jobs": 748,
    "dominant": 623,
    "neighbourVote": 125,
    "rosterFloor": 0,
    "medianDominantShare": 1,
    "note": "Dominant tech over completed visits strictly before the Friday 14:00 PT cutoff. master-asbuilt routeDay deliberately unused: it was derived over a window containing the golden weeks."
  },
  "windowTiers": {
    "no-anchor": 125,
    "active-series": 112,
    "active-assumed": 250,
    "active-measured": 48,
    "other-product": 17
  },
  "windowClamps": {
    "none": 543,
    "overdue": 9,
    "early": 0
  },
  "windowTierNote": "active-measured = last delivered gap <=12d. quiet-measured = >=20d. active-assumed = a TMCP anchor but only one completed visit before the cutoff, so no gap to measure. no-anchor / ambiguous-gap / other-product fall back to the scheduled day +-2 weekdays.",
  "dayZones": {
    "k": 5,
    "perTech": [
      {
        "tech": "Alias Franks",
        "points": 150,
        "zones": 5,
        "spreadTies": 0,
        "weekdayMap": "mon:z0(55 pts, 21.2 min/stop, cap 26) tue:z2(38 pts, 25.5 min/stop, cap 22) wed:z3(30 pts, 27.9 min/stop, cap 20) thu:z4(9 pts, 23.4 min/stop, cap 24) fri:z1(18 pts, 21.7 min/stop, cap 26)"
      },
      {
        "tech": "Cory Ventura",
        "points": 161,
        "zones": 5,
        "spreadTies": 1,
        "weekdayMap": "mon:z0(73 pts, 12.5 min/stop, cap 45) tue:z1(11 pts, 13.9 min/stop, cap 41) wed:z4(25 pts, 15.3 min/stop, cap 37) thu:z3(12 pts, 20.1 min/stop, cap 28) fri:z2(40 pts, 16.3 min/stop, cap 34)"
      },
      {
        "tech": "Luke LaVergne",
        "points": 127,
        "zones": 5,
        "spreadTies": 1,
        "weekdayMap": "mon:z4(6 pts, 21.1 min/stop, cap 26) tue:z2(17 pts, 23.3 min/stop, cap 24) wed:z1(15 pts, 28.6 min/stop, cap 19) thu:z3(34 pts, 23.2 min/stop, cap 24) fri:z0(55 pts, 20 min/stop, cap 28)"
      },
      {
        "tech": "Robert Norton",
        "points": 135,
        "zones": 5,
        "spreadTies": 0,
        "weekdayMap": "mon:z2(21 pts, 23.6 min/stop, cap 24) tue:z3(19 pts, 16.1 min/stop, cap 35) wed:z0(32 pts, 19.5 min/stop, cap 29) thu:z1(18 pts, 21.3 min/stop, cap 26) fri:z4(45 pts, 25.3 min/stop, cap 22)"
      },
      {
        "tech": "Tavis Alexander",
        "points": 128,
        "zones": 5,
        "spreadTies": 0,
        "weekdayMap": "mon:z4(17 pts, 15.5 min/stop, cap 36) tue:z3(30 pts, 18.1 min/stop, cap 31) wed:z0(51 pts, 15.3 min/stop, cap 37) thu:z2(19 pts, 19.4 min/stop, cap 29) fri:z1(11 pts, 20.3 min/stop, cap 28)"
      }
    ]
  },
  "cycleTimes": {
    "file": "route-day-drive_2026-08-17_2026-09-17.json",
    "routeDaysBeforeWeek": 25,
    "allTechMedianMinPerStop": 20.32,
    "sources": {
      "tech+weekday": 25
    }
  },
  "capacityAtCycleTime": {
    "routeDays": 25,
    "over8h": 10,
    "over95h": 0,
    "maxHours": 9.41
  },
  "overflowCount": 16,
  "offRosterOwners": 0,
  "perTech": [
    {
      "tech": "Alias Franks",
      "visits": 134,
      "placed": 118,
      "overflow": 16,
      "searchPasses": 6,
      "moves": 0,
      "swaps": 118,
      "reinserted": 0,
      "finalCost": 1761,
      "zonePoints": 150,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-24",
          "dow": "mon",
          "stops": 26,
          "cycleMin": 21.2,
          "cycleSource": "tech+weekday",
          "capStops": 26,
          "cycleHours": 9.17,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-08-25",
          "dow": "tue",
          "stops": 22,
          "cycleMin": 25.5,
          "cycleSource": "tech+weekday",
          "capStops": 22,
          "cycleHours": 9.36,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-08-26",
          "dow": "wed",
          "stops": 20,
          "cycleMin": 27.9,
          "cycleSource": "tech+weekday",
          "capStops": 20,
          "cycleHours": 9.31,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-08-27",
          "dow": "thu",
          "stops": 24,
          "cycleMin": 23.4,
          "cycleSource": "tech+weekday",
          "capStops": 24,
          "cycleHours": 9.36,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-08-28",
          "dow": "fri",
          "stops": 26,
          "cycleMin": 21.7,
          "cycleSource": "tech+weekday",
          "capStops": 26,
          "cycleHours": 9.41,
          "over8": true,
          "over95": false
        }
      ]
    },
    {
      "tech": "Cory Ventura",
      "visits": 114,
      "placed": 114,
      "overflow": 0,
      "searchPasses": 1,
      "moves": 0,
      "swaps": 0,
      "reinserted": 0,
      "finalCost": 756,
      "zonePoints": 161,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-24",
          "dow": "mon",
          "stops": 37,
          "cycleMin": 12.5,
          "cycleSource": "tech+weekday",
          "capStops": 45,
          "cycleHours": 7.7,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-25",
          "dow": "tue",
          "stops": 14,
          "cycleMin": 13.9,
          "cycleSource": "tech+weekday",
          "capStops": 41,
          "cycleHours": 3.24,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-26",
          "dow": "wed",
          "stops": 27,
          "cycleMin": 15.3,
          "cycleSource": "tech+weekday",
          "capStops": 37,
          "cycleHours": 6.88,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-27",
          "dow": "thu",
          "stops": 8,
          "cycleMin": 20.1,
          "cycleSource": "tech+weekday",
          "capStops": 28,
          "cycleHours": 2.68,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-28",
          "dow": "fri",
          "stops": 28,
          "cycleMin": 16.3,
          "cycleSource": "tech+weekday",
          "capStops": 34,
          "cycleHours": 7.63,
          "over8": false,
          "over95": false
        }
      ]
    },
    {
      "tech": "Luke LaVergne",
      "visits": 85,
      "placed": 85,
      "overflow": 0,
      "searchPasses": 3,
      "moves": 7,
      "swaps": 4,
      "reinserted": 0,
      "finalCost": 1049,
      "zonePoints": 127,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-24",
          "dow": "mon",
          "stops": 12,
          "cycleMin": 21.1,
          "cycleSource": "tech+weekday",
          "capStops": 26,
          "cycleHours": 4.23,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-25",
          "dow": "tue",
          "stops": 19,
          "cycleMin": 23.3,
          "cycleSource": "tech+weekday",
          "capStops": 24,
          "cycleHours": 7.39,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-26",
          "dow": "wed",
          "stops": 17,
          "cycleMin": 28.6,
          "cycleSource": "tech+weekday",
          "capStops": 19,
          "cycleHours": 8.12,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-08-27",
          "dow": "thu",
          "stops": 18,
          "cycleMin": 23.2,
          "cycleSource": "tech+weekday",
          "capStops": 24,
          "cycleHours": 6.95,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-28",
          "dow": "fri",
          "stops": 19,
          "cycleMin": 20,
          "cycleSource": "tech+weekday",
          "capStops": 28,
          "cycleHours": 6.33,
          "over8": false,
          "over95": false
        }
      ]
    },
    {
      "tech": "Robert Norton",
      "visits": 107,
      "placed": 107,
      "overflow": 0,
      "searchPasses": 3,
      "moves": 1,
      "swaps": 9,
      "reinserted": 0,
      "finalCost": 506,
      "zonePoints": 135,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-24",
          "dow": "mon",
          "stops": 20,
          "cycleMin": 23.6,
          "cycleSource": "tech+weekday",
          "capStops": 24,
          "cycleHours": 7.85,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-25",
          "dow": "tue",
          "stops": 26,
          "cycleMin": 16.1,
          "cycleSource": "tech+weekday",
          "capStops": 35,
          "cycleHours": 6.96,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-26",
          "dow": "wed",
          "stops": 25,
          "cycleMin": 19.5,
          "cycleSource": "tech+weekday",
          "capStops": 29,
          "cycleHours": 8.12,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-08-27",
          "dow": "thu",
          "stops": 16,
          "cycleMin": 21.3,
          "cycleSource": "tech+weekday",
          "capStops": 26,
          "cycleHours": 5.69,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-28",
          "dow": "fri",
          "stops": 20,
          "cycleMin": 25.3,
          "cycleSource": "tech+weekday",
          "capStops": 22,
          "cycleHours": 8.45,
          "over8": true,
          "over95": false
        }
      ]
    },
    {
      "tech": "Tavis Alexander",
      "visits": 112,
      "placed": 112,
      "overflow": 0,
      "searchPasses": 5,
      "moves": 15,
      "swaps": 27,
      "reinserted": 0,
      "finalCost": 549,
      "zonePoints": 128,
      "zones": 5,
      "days": [
        {
          "date": "2026-08-24",
          "dow": "mon",
          "stops": 16,
          "cycleMin": 15.5,
          "cycleSource": "tech+weekday",
          "capStops": 36,
          "cycleHours": 4.13,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-25",
          "dow": "tue",
          "stops": 26,
          "cycleMin": 18.1,
          "cycleSource": "tech+weekday",
          "capStops": 31,
          "cycleHours": 7.85,
          "over8": false,
          "over95": false
        },
        {
          "date": "2026-08-26",
          "dow": "wed",
          "stops": 33,
          "cycleMin": 15.3,
          "cycleSource": "tech+weekday",
          "capStops": 37,
          "cycleHours": 8.43,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-08-27",
          "dow": "thu",
          "stops": 25,
          "cycleMin": 19.4,
          "cycleSource": "tech+weekday",
          "capStops": 29,
          "cycleHours": 8.07,
          "over8": true,
          "over95": false
        },
        {
          "date": "2026-08-28",
          "dow": "fri",
          "stops": 12,
          "cycleMin": 20.3,
          "cycleSource": "tech+weekday",
          "capStops": 28,
          "cycleHours": 4.06,
          "over8": false,
          "over95": false
        }
      ]
    }
  ],
  "historyVisitsBeforeCutoff": 701,
  "historyDays": 6
}
```

---

Hours are modelled with `travel.mjs` over each route-day in its own order, including the inbound leg from the tech's inferred start area and excluding the trip home. Proposal and actual are timed with the identical model and identical per-visit service minutes, so any difference is the board, not the clock.