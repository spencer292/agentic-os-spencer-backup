---
title: Got Moles — Keyword + PPC Gap Analysis
date: 2026-04-24
source: Rankings sheet (3,025 rows, Dec 4 2025 snapshot) + PPC Sheet5 + agency recon
---

# Keyword + PPC Gap Analysis

## TL;DR

1. **Organic is the engine.** 1,409 top-3 keywords, 1,799 top-10, 2,657 ranked. 76% of top-3 are city-service pattern (1,073 kw). The SEO plan has built a real moat.
2. **Paid was dormant, not strategic.** Agency's 2025 spend: $844/mo, 82 leads/mo, $10.28 CPL — but only **1 active paid keyword** per SpyFu. Spreadsheet has zero keyword-level PPC data. $844 was running on autopilot, not optimisation.
3. **Launch-critical risk: 285 top-3 keywords at risk from 22 URLs with redirect-gap patterns.** That's ~20% of the top-3 moat if migration isn't clean.
4. **Opportunity zone: 554 keywords at rank 4-20** — close to top-3, achievable with on-page + internal linking work post-launch.
5. **The "paid vs organic" framing is wrong.** Organic generates ~99% of business per SpyFu. The real gap analysis is: what organic opportunities are we missing, and what's the smallest sensible paid layer on top.

---

## Part 1 — Current state from Rankings sheet (Dec 4 2025)

**Keyword distribution (2,657 ranked):**

| Band | Count | % |
|---|---|---|
| Top 3 | 1,409 | 53% |
| Top 10 | 1,799 | 68% |
| Top 20 | 1,963 | 74% |
| Top 50 | 2,270 | 85% |
| Top 100 | 2,405 | 91% |
| >100 or unranked | 263 | 9% |

**Top-3 keyword clustering:**

| Cluster | Top-3 count | % |
|---|---|---|
| City + service ("X mole control", "mole control X") | 1,073 | 76% |
| Service generic ("mole removal", "mole trapping") | 157 | 11% |
| Informational questions ("do moles have eyes") | 37 | 3% |
| Other/long-tail | 142 | 10% |
| Brand ("got moles") | 0 | — |

The brand zero is notable — it means either brand searches are aggregated elsewhere, or there's no brand-specific keyword-tracking. Worth verifying Got Moles isn't losing brand SERP to competitors.

**Top 15 ranking URLs by top-3 keyword count:**

| Top-3 kw | URL | Notes |
|---|---|---|
| 142 | `/` | Homepage — huge keyword magnet |
| 85 | `/mole-trapping-redmond/` | Redmond crushing it |
| 74 | `/mole-control-renton/` | Renton doing the same |
| 54 | `/mole-control-burien/` | |
| 50 | `/shoreline/` | ⚠️ Bare-slug — REDIRECT GAP |
| 48 | `/mole-control-maple-valley/` | |
| **46** | **`/how-many-eyes-do-moles-have/`** | ⚠️ REDIRECT GAP — single info page holds 46 top-3 + 61 top-10 |
| 44 | `/mole-control-sammamish/` | |
| 41 | `/mole-control-issaquah/` | |
| 41 | `/mole-control-kent/` | |
| 40 | `/mole-control-southhill/` | |
| 38 | `/mole-control-puyallup/` | |
| 37 | `/mole-control-woodinville/` | |
| 36 | `/mole-control-enumclaw/` | |
| 35 | `/mole-control-fife/` | |

## Part 2 — Redirect gap quantification (LAUNCH-CRITICAL)

**22 URLs match known gap patterns. Total keywords at risk: 285 top-3 + 383 top-10.**

| At-risk top-3 | URL | Gap type |
|---|---|---|
| 50 | `/shoreline/` | Bare-slug city, not in citySlugs |
| 46 | `/how-many-eyes-do-moles-have/` | Info page — fate unclear |
| 31 | `/mole-control-seatac-2/` | `-2` duplicate page |
| 25 | `/tukwila/` | Bare-slug city |
| 25 | `/seatac/` | Bare-slug city |
| 22 | `/woodinville/` | Bare-slug city |
| 21 | `/tacoma/` | Bare-slug city |
| 15 | `/mole-repellant-federal-way/` | `mole-repellant-{city}` pattern |
| 14 | `/do-moles-bite/` | Info page |
| 7 | `/mole-repellant-tacoma/` | `mole-repellant-{city}` pattern |
| 5 | `/kirkland/` | Bare-slug city |
| 5 | `/mole-control-sumner-2/` | `-2` duplicate |
| 4 | `/do-moles-carry-diseases/` | Info page |
| 4 | `/enumclaw/` | Bare-slug (has match elsewhere?) |
| 3 | `/maple-valley/` | Bare-slug |
| 2 | `/mole-repellant-issaquah/` | Pattern |
| 2 | `/mole-repellant-kirkland/` | Pattern |
| 1 | `/bellevue/` | Bare-slug |
| 1 | `/buckley/` | Bare-slug |
| 1 | `/mole-repellant-bellevue/` | Pattern |
| 1 | `/mole-repellant-kent/` | Pattern |

**285 top-3 = 20% of entire top-3 moat hangs on these 22 redirects landing correctly.**

This is already flagged in `seo-geo-reinforcement/reports/redirect-audit_2026-04-20.md` (Roy's redirect audit called out 109 gaps / 430+ at-risk keywords). This analysis confirms with concrete numbers for the sub-segment matching gap patterns.

## Part 3 — Opportunity zone (rank 4-20)

**554 keywords ranked 4-20.** These are page-1 or page-2, close to top-3. With on-page optimisation + internal linking, many could push up.

Sample at rank 4 (dominant theme: city service variations + info questions):

**City service at rank 4 (single position from top-3):**
- buckley mole control
- covington mole control service
- des moines mole control service
- edmonds mole extermination
- federal way mole control service
- kenmore mole control in yard
- kent mole exterminator
- kirkland mole service
- mole catcher tacoma

**Informational questions at rank 4:**
- are moles poisonous to humans
- can moles bite you
- can moles carry rabies
- do moles carry disease
- do moles have eyes (multiple variants)
- do moles have rabies

**Pattern:** service-variation phrases ("exterminator", "service", "in yard") are ranking just below the primary "mole control" variants. Content on existing city pages isn't covering all service-intent phrasings. Quick win: audit top 20 city pages, ensure each has H2/H3 for every major service variation phrase.

## Part 4 — PPC reality check

**What the spreadsheet actually contains (Sheet5):**

| Metric | 2024 | 2025 (Jan-Nov) |
|---|---|---|
| Google spend | $6,780.69 | $6,127.14 ($557/mo) |
| Bing spend | $1,978.60 | $3,159.22 ($287/mo) |
| **Total spend** | **$8,759.29** | **$9,286.36 ($844/mo)** |
| **Total leads** | **874 (73/mo)** | **903 (82/mo)** |
| **CPL** | **$10.02** | **$10.28** |

**That's it.** No keyword-level PPC data. No Quality Scores. No bid history. No ad group structure. No conversion breakdown. The granular paid data lives in the agency's Google Ads + Bing Ads accounts, which are pending handover (per measurement-setup brief Track D).

**What SpyFu adds:**
- 1 active paid keyword currently (near-dormant)
- 295 lifetime paid keywords (mostly abandoned)
- 5 ad creatives in 3 years (vs industry benchmark 20-50+)
- $60.36/mo visible Google Search Ads spend
- ~$497/mo invisible (hypothesized PMax — not LSAs per SERP check)

**The implication:** Agency's paid was ~$60 Search + ~$500 PMax (Google) + $287 Bing. The $844/mo generated 82 leads at $10.28 CPL — reasonable but the attribution is mostly branded + PMax-matched, not keyword-targeted search intent.

## Part 5 — Missed opportunities, ranked

### Tier 1 — Launch-critical (pre-DNS switch)

**1. Fix 22 at-risk redirect URLs → preserve 285 top-3 + 383 top-10 keywords.** Flagged in redirect-audit; this analysis quantifies specific URLs. Each gap URL needs an explicit 301 to the best-match new URL. Fail here and launch day traffic craters. Examples:
- `/how-many-eyes-do-moles-have/` (46 top-3) → must redirect to new info page of same topic
- `/shoreline/` (50 top-3) + `/tukwila/` (25) + `/seatac/` (25) + `/woodinville/` (22) + `/tacoma/` (21) → bare-slug city pages need to either (a) be added back as pages, or (b) 301 to the `mole-control-{city}` canonical

**2. 6 city pages missing (Centralia, Eatonville, Algona, Fairwood, Lake Tapps, Medina).** ~25 kw at risk per Track C1/C2 of seo-geo-reinforcement brief. Centralia alone = 18 keyword hits with 6 #1 rankings for 3+ years.

### Tier 2 — Quick wins post-launch

**3. Push opportunity-zone keywords (rank 4-20) to top-3.** 554 keywords one position away. Focus on:
- City-service variations (add "exterminator", "service", "in yard" H2/H3 to top 20 city pages)
- Info-question variants (do moles have eyes, can moles bite — consolidate duplicate phrasings on one page with FAQ schema)
- Estimated impact: push 50-100 keywords to top-3 within 90 days of consistent internal linking + content refresh

**4. Info-page pattern replication.** `/how-many-eyes-do-moles-have/` alone holds 46 top-3 keywords on ONE page. This pattern (one comprehensive answer page absorbing all question variants) works. Replicate for:
- Do moles bite (already exists, 14 top-3 — has room to grow to 30+)
- When are moles most active (new)
- How deep do moles dig (new)
- What time of day are moles active (new)
- Each info page can be a 20-50 kw anchor.

**5. Review generation campaign.** Seattle GBP 135 reviews vs Mole Masters 356 — 2.6x gap. Post-service SMS + QR leave-behind. Cheap, high-ROI, no dev work. Flagged in 2026-04-23 recon, not yet started.

### Tier 3 — Paid rebuild when Spencer hands over

**6. Brand defense campaign.** Zero brand-term top-3 tracked = either SEMrush isn't tracking them, or Got Moles isn't defending brand SERP. Either way, $50-100/mo Google Ads brand campaign prevents competitors bidding on "got moles" — table stakes.

**7. Scale paid from $844 → $1,500-2,000/mo.** $10.28 CPL is efficient. If CPL holds at cold-start (Month 3-4), doubling budget doubles leads. Key risk: new accounts have 2-3 month ramp-up before Quality Scores stabilise.

**8. LSA activation.** Spencer's GBP verification status is unknown. If already Google Guaranteed, LSAs launch Day 1 at pay-per-lead pricing (typically $20-40 per lead in home-service verticals — plausibly cheaper than Search CPC). Flagged in Track E of seo-geo-reinforcement.

**9. TMCP + Commercial service paid emphasis.** Organic top-3 concentration is 76% city-service (mostly One-Time Removal intent). TMCP (recurring revenue, higher LTV) is under-represented in both organic and paid. Paid should over-index on TMCP terms to drive higher-LTV customers rather than one-time leads.

### Tier 4 — Structural / off-site

**10. Third-party citation campaign.** Wikipedia (Townsend's mole, Mazama pocket gopher articles), Reddit (r/Seattle, r/SeaWA), YouTube (species ID shorts), Yelp/Angi/Nextdoor/BBB claims. Zero current footprint. Feeds AI models directly — GEO moat. Flagged in Track A4.

**11. Spencer CRM original research.** 5,000-client dataset could yield 2-4 proprietary-stat blogs (recurrence rate by soil type, trap-to-catch days by species, seasonal peak data). Becomes citation-worthy content. Gated on Jobber API access.

## Part 6 — What's missing from the data

Cannot answer without further inputs:

1. **GSC/GA4 traffic → conversion correlation.** 1,409 top-3 kw = a lot of impressions, but how many convert? Some are probably vanity ranks. Need Spencer to share GSC + GA4 data (or cold-start with new property post-launch).
2. **Detailed PPC keyword spend breakdown.** Agency's Google Ads + Bing Ads account exports. Spencer pending.
3. **Competitor PPC intel.** SpyFu Ads History tab + PPC Competitors data not yet pulled. Low-cost unlock ($39/mo SpyFu Basic already purchased).
4. **Jobber CRM lead quality by source.** Which source converts to paying customer? Paid vs organic lifetime value? Blocked on Jobber OAuth (in progress).

## Part 7 — Recommended next actions

**This week (pre-launch):**
1. Verify all 22 at-risk URLs have explicit 301s in `next.config.ts` — cross-check against `redirects.ts` source file
2. Confirm the 6 missing city pages are either built or redirected correctly
3. Spec the info-page replication set (do-moles-bite expansion, when-active, how-deep) for post-launch content pipeline

**Week 1-2 post-launch:**
4. GSC new-property baseline to validate the 1,409 top-3 still holds
5. Start review-generation campaign (no dev dependency)
6. Pull SpyFu Ads History tab on top 3 named competitors (Mole Masters, Moody Moles, Mole Control & More)

**Month 1-2 (Spencer handovers / rebuilds):**
7. Paid cold-start: Google Search ($400) + Bing ($200) + LSA if verification ready
8. Brand defense campaign ($50-100/mo)
9. Opportunity-zone keyword push via internal linking refresh

---

*Source files: Rankings sheet (3,025 rows, Dec 4 2025) | Sheet5 (7 rows, PPC summary) | redirect-audit_2026-04-20.md (109 gaps) | 2026-04-23_agency-recon-and-strategy-pivot.md (SpyFu + competitor context)*
