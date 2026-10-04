# TMCP Annual Unit Economics

**Built:** 2026-09-29 · **Window:** completed visits 2025-10-01 → 2026-09-18 (352 days, annualized) · **Sources:** Jobber visits (`cfo-private/visits-*.json`), active job book 2026-09-29, QBO P&L Oct 2025–Aug 2026.

**Cohort:** 272 monthly-billed TMCP jobs that started before 2025-10-01, so each has a full year of visits and no new-job ramp. Survivorship caveat: jobs that cancelled during the year are not in the active book.

## Answer

A mature TMCP job averages **24 visits a year (2 a month)**. At $100/mo that is **$49 per visit against ~$35 fully loaded cost — about 29% margin.** Breakeven is ~34 visits a year. $100 is priced correctly. The thin margin is in **grandfathered prices under $100**, not in visit frequency.

## Visits per job per year (KNOWN)

| p10 | p25 | Median | p75 | p90 | Max |
|---:|---:|---:|---:|---:|---:|
| 16 | 20 | 24 | 28 | 32 | 48 |

Seasonal (avg visits per job per month): Oct 2.5 · Nov 1.8 · Dec 1.9 · Jan 1.6 · Feb 1.5 · Mar 1.5 · Apr 1.5 · May 1.5 · Jun 2.2 · Jul 3.0 · Aug 2.6.
New jobs (started Oct–Mar): month 1 2.3, month 2 2.9, then ~1.9 — about 2 extra visits at the start.

## Margin by price (mature jobs; cost/visit $34.8 fully loaded, ESTIMATE)

| Monthly price | Jobs | Visits/yr | Revenue/visit | Margin | Jobs losing money |
|---|---:|---:|---:|---:|---:|
| < $80 | 8 | 24.0 | $34 | −1% | 4 |
| $80–99 | 139 | 23.5 | $45 | 22% | 22 |
| $100 | 83 | 24.5 | $49 | 29% | 3 |
| $101–124 | 7 | 25.9 | $52 | 32% | 0 |
| $125–149 | 19 | 23.6 | $65 | 46% | 0 |
| $150–199 | 3 | 22.8 | $88 | 60% | 0 |
| $200+ (commercial) | 13 | 24.2 | $246 | 86% | 0 |

Visit count is flat (~24/yr) across every price tier: acreage tier does not predict how often we go.
Across all 744 active monthly TMCP jobs: 258 (35%) are under $100, 399 at $100, 87 above.

## Cost per visit (ESTIMATE)

- Fully loaded $34.8 = (COGS + opex − owner wages) ÷ 15,209 completed visits, Oct 2025–Aug 2026.
- Variable ~$20.7 = wages, payroll tax, fuel (incl. ~$13K unbooked winter fuel), supplies, vehicle repairs ÷ visits.
- Blended across all visit types; setup visits cost more than checks.
