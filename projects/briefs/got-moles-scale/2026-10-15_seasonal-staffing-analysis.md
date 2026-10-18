# Seasonal staffing analysis: slow vs peak, TMCP vs Quick Fix

Source: every Jobber visit Oct 2024 to Oct 14 2026 (30,403 visits, 2,773 jobs). Product is read from the job's line item. The legacy "1 Month of Mole Control Service" is counted as Quick Fix and "Annual Mole Control Service" as TMCP. October 2026 is a partial month.
Script: `scripts/visit-mix-seasonality.mjs`. Data: `data/2026-10-15_visit-mix-seasonality.csv`.

## Completed visits per month

| Month | Total | TMCP | Quick Fix | TMCP % | Techs/day | Visits per tech-day |
|---|---|---|---|---|---|---|
| 2024-10 | 1,011 | 461 | 524 | 46% | 2.0 | 22.3 |
| 2024-11 | 685 | 353 | 305 | 52% | 1.8 | 21.6 |
| 2024-12 | 699 | 419 | 265 | 60% | 2.0 | 17.0 |
| 2025-01 | 700 | 378 | 302 | 54% | 1.8 | 17.1 |
| 2025-02 | 612 | 393 | 198 | 64% | 2.4 | 15.0 |
| 2025-03 | 733 | 504 | 203 | 69% | 2.0 | 16.9 |
| 2025-04 | 651 | 460 | 174 | 71% | 1.7 | 17.0 |
| 2025-05 | 767 | 511 | 225 | 67% | 2.0 | 18.3 |
| 2025-06 | 1,057 | 690 | 335 | 65% | 2.5 | 19.5 |
| 2025-07 | 1,556 | 862 | 643 | 55% | 3.1 | 22.5 |
| 2025-08 | 1,451 | 744 | 657 | 51% | 2.9 | 24.0 |
| 2025-09 | 1,479 | 822 | 611 | 56% | 2.8 | 24.9 |
| 2025-10 | 1,697 | 959 | 678 | 57% | 2.9 | 25.1 |
| 2025-11 | 1,107 | 746 | 329 | 67% | 2.8 | 20.7 |
| 2025-12 | 972 | 792 | 161 | 81% | 2.2 | 20.2 |
| 2026-01 | 902 | 707 | 172 | 78% | 2.0 | 21.3 |
| 2026-02 | 939 | 758 | 153 | 81% | 2.0 | 23.4 |
| 2026-03 | 1,000 | 847 | 127 | 85% | 2.1 | 20.6 |
| 2026-04 | 1,003 | 874 | 110 | 87% | 2.0 | 22.0 |
| 2026-05 | 1,110 | 920 | 168 | 83% | 2.4 | 23.4 |
| 2026-06 | 1,614 | 1,321 | 257 | 82% | 3.0 | 23.9 |
| 2026-07 | 2,365 | 1,907 | 415 | 81% | 3.7 | 27.3 |
| 2026-08 | 2,496 | 1,912 | 534 | 77% | 4.5 | 26.4 |
| 2026-09 | 2,512 | 1,874 | 609 | 75% | 4.9 | 24.6 |

The remaining 1 to 4% of visits are bids, warranty, barter and equipment retrieval. A tech-day is a tech with 8 or more completed visits on that date.

## Slow vs peak

| Season | Slow avg/mo (Nov–May) | Peak avg/mo (Jun–Oct) | Peak ÷ slow |
|---|---|---|---|
| 2024–25 | 692 | 1,448 | 2.1× |
| 2025–26 | 1,005 | 2,248 (Jun–Sep) | 2.2× |

From the lowest month to the highest, volume is 2.8× in both years. The slow season is Nov–May. It drops in November, bottoms out in Dec–Apr, and jumps in June and July, by about 45% each month in both years.

## TMCP vs Quick Fix

| 12 months | Total visits | TMCP | Quick Fix | TMCP : QF |
|---|---|---|---|---|
| Oct 24 – Sep 25 | 11,401 | 6,597 (58%) | 4,442 (39%) | 1.5 : 1 |
| Oct 25 – Sep 26 | 17,717 | 13,617 (77%) | 3,713 (21%) | 3.7 : 1 |

- Year over year, TMCP visits grew 106% and Quick Fix visits fell 16%. Total visits grew 55%.
- Quick Fix accounts for the seasonal swing: about 110–170 visits a month in winter and 600+ in September. TMCP is the base that carries through winter.
- TMCP visits per active TMCP job: about 1.75 a month in winter (Jan–Apr 2026) and 2.4–2.9 in peak.

## Winter 2026–27 staffing need

- There are ~766 TMCP clients now (10-14 churn audit), growing ~20 a month net through winter (last winter's rate).
- Projected Dec–Feb: ~1,420–1,490 TMCP visits, ~160 Quick Fix and ~25 other, so **~1,600–1,700 visits a month**.
- Last winter's pace was 21–23 visits per tech-day over ~21 field days, which is ~460 visits per tech per month.
- That works out to **~3.6 techs fully loaded, so 4 techs.** The roster is 5, which leaves about one tech-equivalent of slack Dec–Feb. Last winter 2 techs carried ~900 a month at the same pace.
- Rule of thumb: **about 265 TMCP clients keep one tech busy in winter.**

## When to hire

- Volume jumps in June and July. In July 2026 the board hit 27.3 visits per tech-day, the highest of the 24 months. Alias and Robert started in July, after the jump.
- A new tech needs ~15 field days (300+ stops) to reach pace.
- **The hire for the 2027 peak should be in the field by May 1. Post in March and hire in April.** If TMCP keeps growing, plan a second start for early June.
- Rough 2027 peak: with ~1,000 TMCP clients by June at 2.4–2.9 visits each, plus ~600 Quick Fix, that is ~3,000–3,500 visits a month, or **6–7 techs** at ~25 visits per tech-day.

## Caveats

- Tech counts come from Jobber's `completedBy`, so office completions or proxy completions can blur the per-tech numbers.
- The winter projection assumes visits per TMCP job stay at last winter's level. The current weekly-on-activity rule could push that higher, but the cadence engine is off.
- The 2027 peak figure depends on TMCP sales holding their current rate. Treat it as a planning range, not a forecast.
