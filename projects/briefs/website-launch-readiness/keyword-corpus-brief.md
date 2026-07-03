---
document: Keyword Corpus Brief — Got Moles Pre-Launch
project: website-launch-readiness
created: 2026-04-25
status: v1 — pre-DNS-flip baseline
sources:
  - Got Moles - PPC Growth YoY + SEO Progress and Fruits.xlsx (Rankings sheet)
  - phase-2-keyword-mapping.md (page-by-page primary/secondary/GEO)
  - seo-geo-reinforcement/reports/redirect-matrix.csv (URL-to-keyword binding)
  - mole-content-authority/keyword-gap-analysis.md (350+ Search Intent queries)
  - str-keyword-plan/2026-04-02_keyword-gap-analysis.md
  - str-ai-seo/2026-04-24_keyword-ppc-gap-analysis.md
---

# Keyword Corpus Brief — Got Moles

Single source of truth for the keyword universe Got Moles enters launch with. Use this to:
- Defend rankings on the DNS flip (don't lose what's already #1)
- Prioritize content effort post-launch (where lift is likely)
- Brief Ian, Spencer, or any future SEO consultant in one artifact
- Establish baseline for 30-day / 90-day lift measurement

---

## 1. Headline numbers

| Metric | Count | % of total |
|---|---:|---:|
| **Total keywords tracked** (rolling spreadsheet) | **2,668** | 100% |
| **Ranked positions 1-100** | **2,405** | 90% |
| **Top-1 (#1 spot)** | **635** | 24% |
| **Top-3** | **1,409** | 53% |
| **Top-10** | **1,799** | 67% |
| Unranked / >100 | 263 | 10% |
| Distinct ranking URLs | 180 | — |

**Read:** Got Moles enters launch with one of the strongest small-business SEO footprints in Western Washington's pest-control vertical — 67% of all tracked keywords sit in top-10. The risk on DNS flip is concentrated, not distributed: ~30 high-value URLs hold the bulk of the #1 positions.

## 2. Cluster split (ranked keywords by intent)

| Cluster | Total ranked | #1 positions | Top-3 |
|---|---:|---:|---:|
| **Local-commercial** ({city} + {service-verb}) | 1,664 | **595** | **1,243** |
| Long-tail / other | 350 | 15 | 63 |
| Informational mole-biology | 189 | 0 | 41 |
| Control methods | 100 | 21 | 53 |
| Identification & damage | 64 | 4 | 9 |
| Consideration (DIY vs pro / how to) | 34 | 0 | 0 |
| Pricing / cost | 4 | 0 | 0 |

**Read:** The local-commercial cluster carries 94% of the #1s. This is where the brand wins. Informational-biology has 189 ranked but zero #1 — that's the **growth surface** post-launch (cornerstone content + schema saturation should convert near-misses to wins).

## 3. Top 30 highest-value URLs (must-defend on flip)

These 30 URLs hold ~1,200 of the 2,405 ranked positions (50% of value on 17% of URLs). Verify each is either preserved as-is on the new build OR has a working 301 to a topical equivalent. Status column reflects state of `redirects.ts` as of `1033c49`.

| # | Old URL | Ranked | Top-3 | #1 | Disposition on new build |
|---|---|---:|---:|---:|---|
| 1 | `/what-do-moles-eat` | 102 | 7 | 0 | ✅ Migrated as `/blog/what-do-moles-eat/` (urlPattern=blog) |
| 2 | `/how-many-eyes-do-moles-have` | 90 | **46** | 0 | ✅ Preserved at same URL (urlPattern=legacy-root) |
| 3 | `/mole-trapping-redmond` | 90 | **85** | **58** | ✅ Pattern-2 redirect → `/mole-control-redmond/` |
| 4 | `/voles-vs-moles-whats-the-difference` | 80 | 0 | 0 | ✅ Pattern-1 redirect → `/blog/mole-vs-vole-vs-gopher/` |
| 5 | `/mole-control-renton` | 78 | 74 | **58** | ✅ Same URL (canonical) |
| 6 | `/mole-control-burien` | 61 | 54 | **50** | ✅ Same URL |
| 7 | `/mole-control-puyallup` | 61 | 38 | 6 | ✅ Same URL |
| 8 | `/shoreline` | 57 | 50 | 0 | ✅ Bare-slug redirect → `/mole-control-shoreline/` |
| 9 | `/mole-control-bellevue` | 54 | 31 | 16 | ✅ Same URL |
| 10 | `/mole-control-issaquah` | 53 | **41** | 4 | ✅ Same URL — Mole Masters competition flagged |
| 11 | `/mole-control-maple-valley` | 51 | 48 | **42** | ✅ Same URL |
| 12 | `/mole-control-sammamish` | 48 | 44 | 25 | ✅ Same URL |
| 13 | `/mole-control-kent` | 43 | 41 | 16 | ✅ Same URL |
| 14 | `/mole-control-southhill` | 40 | **40** | **40** | ✅ Pattern-6 spelling redirect → `/mole-control-south-hill/` |
| 15 | `/mole-control-fife` | 37 | 35 | 8 | ✅ Same URL |
| 16 | `/mole-control-woodinville` | 37 | 37 | 18 | ✅ Same URL |
| 17 | `/mole-control-enumclaw` | 36 | 36 | **36** | ✅ Same URL — HQ city |
| 18 | `/mole-trapping-tacoma` | 36 | 30 | 10 | ✅ Pattern-2 redirect → `/mole-control-tacoma/` |
| 19 | `/do-moles-hibernate` | 35 | 0 | 0 | ✅ Pattern-1 redirect → `/blog/when-are-moles-most-active-washington/` |
| 20 | `/mole-control-tukwila` | 35 | 35 | 25 | ✅ Same URL |
| 21 | `/mole-control-covington` | 34 | 31 | 0 | ✅ Same URL |
| 22 | `/do-moles-bite` | 33 | 14 | 0 | ✅ Preserved (legacy-root) |
| 23 | `/kirkland` | 31 | 5 | 2 | ✅ Bare-slug redirect → `/mole-control-kirkland/` |
| 24 | `/mole-control-seatac-2` | 31 | 31 | 10 | ✅ Pattern-5 dedupe redirect → `/mole-control-seatac/` |
| 25 | `/mole-control-buckley` | 30 | 30 | 1 | ✅ Same URL |
| 26 | `/mole-control-federal-way` | 30 | 22 | 4 | ✅ Same URL |
| 27 | `/woodinville` | 30 | 22 | 3 | ✅ Bare-slug redirect → `/mole-control-woodinville/` |
| 28 | `/mole-control-des-moines` | 27 | 12 | 0 | ✅ Same URL |
| 29 | `/tacoma` | 27 | 21 | 1 | ✅ Bare-slug redirect → `/mole-control-tacoma/` |
| 30 | `/do-moles-carry-diseases` | 25 | 4 | 0 | ✅ Preserved (legacy-root) |

**All 30 highest-value URLs are accounted for.** Verified live on staging via redirect chain trace 2026-04-25 (see `2026-04-25_audit.md` and `redirect-audit_2026-04-20.md`).

## 4. Top-50 defended keywords (highest single-keyword value at #1)

The 635 #1 keywords cluster heavily into city × verb patterns. Every one of these must continue to resolve to a 200 page (either canonical or via redirect chain).

**Pattern coverage check:**

| Pattern | Example | Variants per city | Cities | Total #1s in pattern |
|---|---|---:|---:|---:|
| `/{city}-mole-control` (reverse) | `algona-mole-control` | 1 | ~30 | ~30 |
| `/{city}-mole-trapping` | `auburn-mole-trapping` | 1 | ~25 | ~25 |
| `/{city}-mole-catcher` | `auburn-mole-catcher` | 1 | ~25 | ~25 |
| `/mole-trapping-{city}` | `mole-trapping-redmond` | 1 | ~30 | ~150 |
| `/mole-control-{city}` | `mole-control-burien` | 1 | ~70 | ~280 |
| `/mole-repellant-{city}` (A-spelling) | `mole-repellant-federal-way` | 1 | ~20 | ~30 |
| `/mole-repellent-{city}` (E-spelling) | `mole-repellent-snoqualmie` | 1 | ~10 | ~15 |
| `/mole-removal-{city}` | `mole-removal-kent` | 1 | ~25 | ~25 |
| `/mole-exterminator-{city}` | `bonney-lake-mole-exterminator` | 1 | ~15 | ~15 |
| `/{city}` (bare slug) | `seatac`, `tukwila`, `kirkland` | 1 | ~25 | ~30 |
| Mixed informational + commercial | scattered | n/a | n/a | ~10 |

Every pattern is covered by `redirects.ts` (verified 2026-04-25 via 14-pattern chain trace).

## 5. Pattern-driven kw expansion (the implicit corpus)

Phase-2 keyword-mapping.md doesn't enumerate the city × verb matrix because it's pattern-driven. The actual ranking corpus is:

```
~90 cities × ~10 verbs = ~900 city-targeted keyword variants
+ ~7 verbs × ~90 cities = ~630 SERP-ranked positions historically (after ranking attrition)
+ ~150 cornerstone informational variants
+ ~200 cluster-specific (cost, DIY, types, etc.)
+ ~800 long-tail variants

~ 2,500-2,700 keyword footprint
```

That maps cleanly to the spreadsheet's 2,668 tracked terms. Phase-2 is the **page-build map** (one row per page); the **kw corpus** is what those pages rank for at scale.

## 6. Top-30 GROWTH keywords (where new build unlocks lift)

These are keywords where the OLD site has zero or weak rankings, but the NEW build's cornerstones, schema, and GEO depth should rank within 30-90 days. Source: cluster-by-cluster analysis of "ranked but no #1" + content-authority gap.

| Cluster | Sample keyword | Why new build wins |
|---|---|---|
| Mole biology | "types of moles in washington state" | Cornerstone `/blog/types-of-moles-in-washington/` + DefinedTerm schema |
| Mole biology | "townsend's mole" | New cornerstone, no competitor coverage |
| Mole biology | "mazama pocket gopher western washington" | Disambiguation moat — only Got Moles correctly distinguishes mole vs gopher |
| Mole biology | "moles eastern washington" | Geographic moat — Cascade barrier |
| Mole biology | "do moles hibernate washington winter" | Already ranks 0 #1 / 35 ranked — new schema should lift |
| Control methods | "why grub control doesn't work on moles" | Earthworm-diet moat |
| Control methods | "is talpirid safe for dogs" | Pet-safety + chemical-free positioning |
| Identification | "what do mole holes look like" | Migrated, schema added |
| Identification | "mole vs vole vs gopher western washington" | Cornerstone preserved, schema added |
| Local-info | "mole control near me" (city-agnostic) | LocalBusiness `areaServed` schema (just shipped 1033c49) |
| Veteran/E-E-A-T | "veteran owned mole control washington" | About-page Person schema with @graph[5 team] |
| TMCP | "mole protection plan washington" | New service page, no competitor exists |
| TMCP | "year-round mole control monthly" | UNCONTESTED per phase-2 |
| TMCP | "mole control subscription" | UNCONTESTED |
| Schema-driven | "best mole control company washington" | LocalBusiness + AggregateRating + 219+ reviews |
| Speakable | "how does mole removal work" | Speakable schema on `/how-it-works/` HowTo |
| Authority | "got moles spencer hill" | Person + AboutPage schema |
| 90 city pages | (each picks up 5-10 long-tail variants) | Pattern-driven; ~600 long-tail upsides |
| Commercial | "commercial mole control property managers" | New `/services/commercial-mole-control/` page + case-studies article |

Plus Tier-2/3 myth-bust + safety blog posts queued in `mole-content-authority` (not yet shipped) — Sonic Repellers, Castor Oil Myth, 10 Mole Myths, Pet Safety Deep-Dive — these should each pick up 5-15 keywords once published.

**Realistic 90-day lift:** 200-400 net new ranked keywords, 50-100 net new top-3, 20-40 net new #1s. Most lift comes from informational cluster (currently zero #1) since local-commercial is near saturation.

## 7. Cluster → page mapping (where each cluster's traffic lands)

| Cluster | Primary pages | Secondary support |
|---|---|---|
| Local-commercial | 90 city pages (`/mole-control-{slug}/`) | Service-areas hub, county hubs (Q3 plan) |
| Mole biology | `/blog/types-of-moles-in-washington/`, `/blog/are-moles-blind/`, `/blog/how-long-do-moles-live/`, `/how-many-eyes-do-moles-have/` (legacy) | Footer + nav, internal-link cluster |
| Control methods | `/services/total-mole-control-program/`, `/services/one-time-mole-removal/`, `/blog/best-mole-traps/`, `/blog/diy-vs-professional-mole-control/` | TMCP cornerstone in particular |
| Identification & damage | `/blog/how-to-find-active-mole-tunnels/`, `/blog/mole-vs-vole-vs-gopher/` | Service pages link in |
| Consideration | `/blog/diy-vs-professional-mole-control/`, `/blog/how-to-choose-a-mole-control-company/`, `/blog/monthly-vs-one-time-mole-control/` | TMCP page |
| Pricing | `/blog/mole-removal-cost-washington/`, `/services/one-time-mole-removal/` ($450 flat-rate), `/services/total-mole-control-program/` ($100/month) | FAQ schema |
| Pet safety | `/blog/mole-control-safe-for-pets/`, `/blog/are-moles-poisonous-or-venomous/` (legacy) | Sitewide chemical-free trust strip |
| Veteran / E-E-A-T | `/about/` (Spencer Hill Person schema + @graph team) | Footer + service-page sidebars |

## 8. Tracking baseline (what to monitor)

### Pre-flip
- `redirect-matrix.csv` — 334 URLs each with current rank + redirect destination
- This brief — 30 high-value URL list above
- AIO baseline — `2026-04-25_aio-baseline.md` (1 brand citation, 5 brand mentions across 30 query×engine cells)
- PageSpeed baseline — `2026-04-25_pagespeed-baseline.md` (96 mobile / 100 desktop, LCP 2.7s mobile)

### Post-flip — daily for 7 days
- GSC Coverage report — flag any 4xx/5xx on a previously-indexed URL
- GSC Performance — clicks + impressions on the 30 high-value URLs above
- `curl -I` spot-check on 10 random redirect patterns
- Bingbot, Googlebot, GPTBot, ClaudeBot in Vercel access logs

### Post-flip — weekly for 4 weeks
- GSC Performance — top-50 query position deltas vs old baseline (use Search Console export)
- Bing Webmaster Tools — same metrics, smaller volume
- AIO re-run — same 15 queries from `2026-04-25_aio-baseline.md`
- AggregateRating + LocalBusiness rich-result coverage in GSC Enhancements

### 30-day, 60-day, 90-day milestones
- 30d: ≥40% indexation of full sitemap (138 URLs)
- 30d: 0 net loss on top-30 high-value URLs
- 60d: 50+ net new ranked keywords
- 90d: 20+ net new #1 positions, primarily from informational cluster
- 90d: AIO score 45 → 60+ on the 15 priority queries

## 9. Rules / constraints (memory-derived)

- "WA's #1" is **unsubstantiated** — never use until Spencer provides evidence
- Got Moles **is** mole-exclusive — that's the moat. Use as descriptor, never as superlative ("the only").
- 219+ five-star Google reviews is the canonical claim across 3 GBPs — never round to 200 or 220
- "15+ years" refers to Spencer's personal experience, not company age (founded 2017)
- 5,000 clients confirmed — safe to publish
- No I-713 compliance claims — focus on chemical-free + pet-safe instead
- US English spelling throughout (color not colour, etc.)

## 10. Open / parked

- **A5** — `BUSINESS.social` `sameAs` expansion, deferred until Group C listings claim sweep completes (Bing Places, Apple Business Connect, Nextdoor Seattle/Tacoma, BBB)
- **24 shadow pages** — Ian sign-off pending; not in launch corpus
- **5 county hubs** — Q3 scope, not in launch corpus
- **Tier-2/3 myth-bust + safety blogs** — queued in `mole-content-authority`, ship post-launch (~12-15 net new ranked kw expected)
- **Issaquah** — Mole Masters has dedicated `/issaquah-wa` LP. Got Moles' `/mole-control-issaquah/` ranks 4 #1 + 41 top-3 but loses on the priority query. Post-launch deep-dive scoped, no action plan yet.

## Source files (canonical)

| File | Role |
|---|---|
| `Got Moles - PPC Growth YoY + SEO Progress and Fruits.xlsx` (Rankings sheet) | Master ranking corpus, 2,668 keywords |
| `keyword-corpus-raw.json` (this folder) | Machine-readable extract for re-running analyses |
| `phase-2-keyword-mapping.md` (website-rebuild-rebrand) | Page-build map (primary/secondary/GEO per page) |
| `redirect-matrix.csv` (seo-geo-reinforcement) | URL-to-keyword binding for redirect decisions |
| `keyword-gap-analysis.md` (mole-content-authority) | Search Intent map vs existing/planned content |

This brief is the canonical roll-up. Update v2 30-day post-launch with actual GSC data overlaid.
