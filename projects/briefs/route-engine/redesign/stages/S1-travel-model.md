# S1 — Travel model

Offline travel-time model built from 24 pulled OptimoRoute route-days so the backtest can
sequence and time routes with no API calls.

- Builder: `scripts/build-travel-model.mjs` → `data/travel-model.json` (1.9 MB)
- Lookup: `scripts/travel.mjs` — `travel(from, to, driver)` and `routeTime(stops, driver)`
- Logs: `data/build-travel-model.log`, `data/travel-selftest.log`

## Coverage

| Item | Value |
|---|---|
| Route-days with routes | 23 of 24 (2026-09-07 is empty, Labor Day) |
| Routes / stops / legs | 113 / 2,577 / 2,464 |
| Distinct places (lat,lng to 5 dp) | 941, of which 241 were visited once |
| Observed pairs, unordered | 1,676 (1,156 seen once) |
| Observed pairs, directed A→B | 1,900 (1,479 seen once) |
| Pairs driven both ways | 224, differing by a median 4.4% |

The first stop of every route carries an inbound leg from an unknown origin. There is no
depot in the data, so those 113 legs are excluded from pairs and the fit, and used only to
derive route start.

**The coverage number that matters is 11.7%, not 0.38%.** Against all 442,270 possible place
pairs, 0.38% are observed, but that denominator is meaningless. The real question is what the
backtest will ask for: re-sequencing a day freely needs every ordered pair inside that day's
stop set, and only **11.7%** of those were ever driven (per route: median 12.0%, range 8.2 to
33.3%). Roughly seven in eight legs the backtest prices will come from the estimator.

## Estimator quality

`metres = a + b × haversine`, then `seconds = c + d × metres`, fitted by least squares per
driver because each driver's ground has its own road density. Error is end-to-end, from
straight-line distance through to predicted seconds, on legs of 60 seconds or longer.

| Driver | Legs | R² metres | R² seconds | Median abs error |
|---|---|---|---|---|
| Luke LaVergne | 406 | 0.886 | 0.926 | 17.8% |
| Robert Norton | 488 | 0.791 | 0.918 | 19.0% |
| Alias Franks | 518 | 0.888 | 0.851 | 19.3% |
| Tavis Alexander | 558 | 0.837 | 0.876 | 19.7% |
| Cory Ventura | 494 | 0.801 | 0.864 | 23.1% |
| ALL (unknown-driver fallback) | 2,464 | 0.881 | 0.905 | 21.2% |

All five are inside the 25% target. Cory is worst because his West Seattle and Renton ground
is dense, so short legs dominate and a straight-line fit has little to work with.

## Self-test

Replaying all 113 real route-days through `routeTime`:

| | Legs exact | Median route error | p90 | Max |
|---|---|---|---|---|
| Pairs + estimator | 2,353 / 2,464 (95.5%) | 0.00 min | 1.99 min | 4.89 min |
| Estimator only | 0 | 1.73% | — | — |

The 111 legs that do not reproduce exactly are all directed pairs driven more than once at
different times of day; the model stores the median, so it lands a median 28 seconds off
(max 172 s). Lookup order is directed pair, then the same pair driven in reverse, then the
fit. Without the directed layer only 82.8% of legs replayed exactly, so direction matters.

Route **totals** hold up far better than individual legs: with pairs disabled entirely, per-leg
error runs 19.6% but whole-route error is 1.73%, because over- and under-estimates cancel
across 20-plus legs. The backtest can trust day length; it should not trust any single leg.

## Data quirks

- **Barbee Mill is one 11-minute stop, not a cluster.** Job #7964 appears once a week on Tavis
  as a single order at 4205 Williams Avenue North with 11 minutes of service. The 120-minute
  cluster price in the operating rules is not in this data, so the backtest will under-time it.
- **Service durations confirm the directed per-tech rates.** Cory runs 12 min check / 24 set,
  everyone else 15 / 30. Two anomalies: 40 Tavis stops at 11 min and 23 Robert stops at 12 min
  (Cory's rate), most likely orders created before a reassignment.
- **9 zero-length legs**, all pairs of stops sharing one rounded coordinate. `travel()` returns
  zero for these rather than estimating.
- **190 distinct place pairs sit within 300 m of each other** — neighbor properties that the
  5 dp rounding correctly keeps apart.
- **2 legs over 60 minutes**, both Luke's peninsula and Yelm runs, and 17 over 30 minutes. They
  are real, not errors, and they dominate his fit's intercept.
- Every stop has coordinates, a service duration, and an in-sequence stop number. No route has
  a single stop. Nothing was dropped for bad data.
