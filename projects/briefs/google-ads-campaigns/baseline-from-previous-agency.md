# Got Moles — PPC + SEO Baseline from Previous Agency

**Source:** `Got Moles - PPC Growth YoY + SEO Progress and Fruits (1).xlsx` (Roy received from previous agency, 2026-04-20)
**Covers:** Paid 2024 + Jan-Nov 2025 + SEO ranking history 2022 → Dec 2025

This file documents what the previous agency was actually achieving, so any new plan is anchored to real numbers rather than generic benchmarks. Written 2026-04-20 after reviewing the spreadsheet.

---

## 1. Paid Media — Actual Numbers

### 2024 (full year)

| Metric | Value |
|---|---|
| Google Ads spend | $6,780.69 |
| Bing Ads spend | $1,978.60 |
| **Total paid spend** | **$8,759.29** |
| **Total leads** | **874** |
| **CPL (blended)** | **$10.02** |

### 2025 (Jan 1 – Nov 30)

| Metric | Value |
|---|---|
| Google Ads spend | $6,127.14 |
| Bing Ads spend | $3,159.22 |
| **Total paid spend** | **$9,286.36** |
| **Total leads** | **903** |
| **CPL (blended)** | **$10.28** |

### Derived

- Monthly paid run rate (2025): **~$844/month**
- Google share of paid: **~66%** ($557/month)
- Bing share of paid: **~34%** ($287/month)
- Lead volume: **~75/month** blended
- CPL has held roughly flat YoY — mature campaigns, stable Quality Score, no disruption

### Implications

- Any new Google Ads plan that forecasts CPL significantly above ~$10 is worse than the baseline. Target is **match or beat $10 CPL**, not compete with industry-standard benchmarks.
- **Microsoft Ads (Bing) is a legitimate channel, not a throwaway.** 34% of paid spend at the same CPL. The first Google Ads brief draft (commit `02bdca9`) did not include Bing — gap to fix.
- Budget floor should be **~$850-1,000/month** to match 2025 run rate. Going bigger needs a scaling hypothesis tied to capacity (can Spencer handle more leads?) not just "bigger is better."

---

## 2. SEO — Keyword Position Snapshot

From the Overview sheet (curated view):

| Metric | 6/1/2025 | 12/1/2025 | Δ |
|---|---|---|---|
| Total keywords ranked | 1,012 | 1,057 | +45 |
| Keywords on first page | 806 | 889 | +83 |
| Keywords in top 3 | 620 | 698 | +78 |

From the Rankings sheet (full history, 3,024 rows):

| Metric (current, 04.12.2025) | Value |
|---|---|
| Tracked rows | 3,024 |
| Top 3 | 1,409 |
| Top 10 | 1,799 |
| Ranked 1-100 | 2,405 |
| Deep (>100) | 252 |
| Not ranking (NA) | 11 |

*The Overview numbers (~1,057 total / 698 top-3) reflect a curated subset — probably only keywords with known search volume. The Rankings sheet's 1,409 top-3 count includes the full tracked tail. Either way: SEO is a strong, appreciating asset.*

### High-Value Recent Fruits (ranked deep → page 1 in the last 6 months)

From Overview rows 8-17:

| # | Keyword | 6/1 → Current |
|---|---|---|
| 1 | mukilteo mole extermination | 27 → 1 |
| 2 | dupont mole control | 22 → 1 |
| 3 | bothell mole control | 64 → 2 |
| 4 | bothell mole extermination | 42 → 2 |
| 5 | mole control lakewood | 30 → 2 |
| 6 | mole control fife | 55 → 2 |
| 7 | des moines mole control | 10 → 2 |
| 8 | shoreline mole control | 100+ → 3 |
| 9 | bellevue mole control companies | 6 → 3 |
| 10 | algona mole control | 100+ → 3 |

Pattern: local city-level "mole control [city]" and "mole extermination [city]" moving from deep to top 3.

### High-Value Seeds (currently ranking 5-10, climbing)

From Overview rows 22-31:

| # | Keyword | 6/1 → Current |
|---|---|---|
| 1 | bellevue mole problem | 9 → 5 |
| 2 | shoreline moles in yard | 100+ → 5 |
| 3 | des moines mole control in yard | 9 → 5 |
| 4 | mole control in yard des moines | 21 → 5 |
| 5 | mole control des moines | 12 → 6 |
| 6 | mole pest removal des moines | 11 → 6 |
| 7 | des moines moles in yard | 12 → 7 |
| 8 | ground moles seattle | 24 → 8 |
| 9 | seattle mole problem | 13 → 8 |
| 10 | bellevue mole removal service | 21 → 10 |

---

## 3. Old-Site URL Coverage vs Redirect Map

Cross-referenced all 111 unique URL paths in the Rankings sheet against `src/lib/redirects.ts`.

| Status | Count |
|---|---|
| **Covered by redirects** | 94 / 111 (84.7%) |
| **Uncovered** | 17 / 111 |

### The 17 uncovered URLs

| # | URL | Gap type | Fix |
|---|---|---|---|
| 1 | `/algona-mole-control` | Missing city in `redirects.ts` `citySlugs` | Add `algona` to citySlugs |
| 2 | `/fairwood` | Missing city in `citySlugs` | Add `fairwood` to citySlugs |
| 3 | `/lake-tapps-mole-control` | Missing city | Add `lake-tapps` to citySlugs |
| 4 | `/medina-mole-control` | Missing city | Add `medina` to citySlugs |
| 5 | `/medina-mole-extermination` | Missing city + missing `mole-extermination-*` prefix | Add city + prefix |
| 6 | `/mill-creek-mole-extermination` | Missing `mole-extermination-*` prefix (city is present) | Add prefix |
| 7 | `/mole-control-centralia` | City not on new site (Thurston, out of core area?) | Add city OR redirect to `/service-areas` |
| 8 | `/mole-control-eatonville` | City not on new site (Pierce, rural) | Add city OR redirect to `/service-areas` |
| 9 | `/mole-control-fife` | City exists on new site — pattern match handles it automatically ✓ | No redirect needed (false positive) |
| 10 | `/mole-control-seatac-2` | Missing `-2` handler for non-core city pages | Add `-2` suffix pattern for all cities |
| 11 | `/mole-control-southhill` | Spelling variant (`south-hill` in citySlugs) | Add redirect `/mole-control-southhill` → `/mole-control-south-hill` |
| 12 | `/mole-control-sumner-2` | Missing `-2` handler | Add `-2` suffix pattern |
| 13 | `/mole-repellent-snoqualmie` | Missing `mole-repellent-*` prefix (E spelling — only A spelling `mole-repellant` covered) | Add prefix |
| 14 | `/mole-repellent-sumner` | Missing `mole-repellent-*` prefix | Add prefix |
| 15 | `/puyallup-mole-extermination` | Missing reverse pattern `{slug}-mole-extermination` | Add reverse pattern |
| 16 | `/spanaway-mole-exterminator` | Missing reverse pattern `{slug}-mole-exterminator` | Add reverse pattern |
| 17 | `/blog` | Page exists on new site natively — false positive ✓ | No action |

**Actual uncovered URLs that need work: 15** (the 2 false positives above are not issues).

### Top 30 old-site URL patterns by ranking count

| Pattern | # Keywords | New-site equivalent |
|---|---|---|
| `/mole-control-*` | 932 | Same URL structure on new site ✓ |
| `/(homepage)/` | 214 | `/` ✓ |
| `/what-do-moles-eat/` | 102 | `/blog/what-do-moles-eat/` ✓ |
| `/how-many-eyes-do-moles-have/` | 90 | `/blog/how-many-eyes-do-moles-have/` (blog slug in redirects) ✓ |
| `/mole-trapping-redmond/` | 90 | `/mole-control-redmond/` ✓ |
| `/voles-vs-moles-whats-the-difference/` | 80 | `/blog/voles-vs-moles-whats-the-difference/` ✓ |
| `/shoreline/` | 57 | `/mole-control-shoreline/` ✓ |
| `/mole-trapping-tacoma/` | 36 | `/mole-control-tacoma/` ✓ |
| `/do-moles-hibernate/` | 35 | `/blog/do-moles-hibernate/` ✓ |
| `/do-moles-bite/` | 33 | `/blog/do-moles-bite/` ✓ |

---

## 4. Action Items (immediate)

### Launch-critical (pre-DNS switch)

1. **Patch `redirects.ts`** — add 15 missing redirects. Every one preserves ranked keywords that would otherwise 404.
2. **Decide on centralia + eatonville** — either add to `city-data.ts` + `redirects.ts`, or redirect to `/service-areas`.

### Planning (pre-launch)

3. **Obtain previous agency Google Ads account** — matured Quality Scores, keyword history, negative keyword list. Restarting fresh loses years of learning. Owner: Spencer.
4. **Obtain previous agency Bing Ads account** — same reasoning. Owner: Spencer.
5. **Obtain previous agency GA4 + Search Console access** — traffic baseline for post-launch comparison. Owner: Spencer.

### Documentation

6. **Rewrite the Google Ads campaigns brief** with real baseline numbers (not agency benchmarks).
7. **Save this file as a reference** — the baseline numbers that any new plan must match or beat.

---

## 5. Methodology Note

The Overview "Total Keywords Ranked: 1,057" and the Rankings full-sheet count (2,405 ranked 1-100) differ because they use different definitions. Overview likely curates to keywords with known volume from Ahrefs/SEMrush. The Rankings sheet tracks every keyword the agency has monitored over time, including long-tail. Both are valid; the first is the "money keywords" view, the second is "everything."

For ongoing measurement, use the Rankings sheet as the source of truth and curate a top-200 watchlist for executive reporting.
