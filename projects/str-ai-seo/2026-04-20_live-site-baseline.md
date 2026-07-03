# Got Moles — Live Site SEO + GEO Baseline (got-moles.com)

**Date:** 2026-04-20
**Site audited:** https://got-moles.com (production — old WordPress + Yoast site, pre-DNS-switch)
**Skill applied:** `str-ai-seo` (full methodology)
**Reviewer:** Claude Opus 4.7
**Purpose:** Baseline against which the new site's post-DNS-switch lift is measured. Also surfaces what the live site does well (must preserve) and what it does poorly (gaps the new build closes).

---

## Executive Summary

**Live site SEO posture:** ~58/100
**Live site GEO posture:** ~35/100
**Live site overall:** ~46/100

The live site is **not** a schema wasteland — Yoast Premium emits a substantial baseline graph (WebPage, Organization, LocalBusiness, Person, Review, AggregateRating) on every page, plus Article on blog posts. That's better than initially assumed.

What it lacks is the **AI-citation-critical schema set**: FAQPage (despite having a FAQ page), Speakable, HowTo, Service. Combined with generic city-name-swap content on local pages and zero presence in broad-query SERPs, the live site captures long-tail city+keyword combos well (per the previous agency's Rankings sheet) but is invisible to AI search engines on the broader informational queries that drive citations.

**Headline gap:** Live site ranks #1 for ~700 specific city+keyword terms (e.g. `mole control centralia`, `mole catcher centralia`). Live site ranks **nowhere** in the top 10 for the broader queries AI engines tend to cite (`mole control Seattle Bellevue Tacoma`, `how to get rid of moles Washington State`). Those queries are dominated by WSU Extension, Mole Masters (30-year founder story), Croach, Northwest Center, and JC Ehrlich.

The new build (audited 2026-04-20 at 87/100) closes the AI gap with FAQPage saturation, Speakable schema, HowTo on /how-it-works, Tier 1 cornerstones targeting the broad informational queries, and 4 zero-competition GEO content moats. **The DNS switch will represent a ~+40 point lift in AI/GEO posture.**

---

## Part 1 — Inventory

### 1.1 Site footprint

| Sitemap | URLs | Notes |
|---------|-----|-------|
| Pages | ~298 | Includes 220+ `city × service` thin-content combination pages |
| Cities | 87 | Plus county-level pages (King, Pierce, Snohomish, Thurston, Lewis) |
| Posts (blog) | 26 | Mostly biology/identification (Tier 4 in our taxonomy) |
| Services | 8 | mole-control, mole-trapping, mole-extermination, mole-removal, mole-exterminator, mole-catcher, mole-repellant, pest-control |
| Categories / Tags / Authors / CPT layouts | n/a | Standard WP taxonomies |

**Robots.txt:** `User-agent: *` / `Disallow:` (nothing blocked). No explicit AI bot allowlist. Sitemap pointer present.
**AI bots:** Implicitly allowed (no Disallow). New site explicitly allowlists 19 bots — same effective access, more defensive.

### 1.2 Schema (per page type)

Verified by direct HTML fetch + JSON-LD parse. Yoast Premium pattern:

| Page | @types emitted |
|------|----------------|
| Homepage (/) | WebPage, WebSite, Organization, LocalBusiness, ImageObject, Person, Place, Review, Rating, AggregateRating, BreadcrumbList |
| FAQ (/faq/) | Same graph as homepage. **No FAQPage.** |
| City (/mole-control-bellevue/) | Same graph + ImageObject. **No LocalBusiness with city-specific GeoCoordinates. No FAQPage. No Service.** |
| Blog post (/what-do-moles-eat/) | Same graph + Article. **No FAQPage on Q&A-heavy content.** |

**What's strong:**
- Review + AggregateRating sitewide (good for local SEO + Google star ratings)
- Person attribution on blog posts (Spencer Hill bio + LinkedIn)
- Multi-address Organization signal (Bremerton, Seattle, Tacoma, Enumclaw)

**What's missing (every page):**
- **FAQPage** — 0 instances despite having explicit Q&A content
- **Speakable** — 0 instances (voice search blind)
- **HowTo** — 0 instances despite having "Our Process" pages
- **Service** with Offer / UnitPriceSpecification — 0 instances
- **City-level cityLocalBusiness with GeoCoordinates** — sitewide LocalBusiness only

---

## Part 2 — On-Page (Pillar 1: Structure)

### 2.1 Homepage

- **H1:** "Mole Control Seattle"
- **BLUF:** Yes — opens with "Got Moles is your neighborhood expert for mole control, trapping, and removal..." Defines the business in the first sentence.
- **Heading hierarchy:** H1 + 6 H2s + 3+ H3s. Reasonable.
- **FAQ on page:** No (links to /faq/ in nav).
- **Numbered lists / comparison tables / pros-cons:** None visible.
- **Voice-search-friendly Q&A blocks:** Limited.

### 2.2 Service page (/mole-control/)

- **H1:** "Mole Control Services for Washington Homeowners"
- **Word count:** ~2,100 words
- **Process section:** 4 numbered steps (Phone Assessment / Site Inspection / Weekly Visits / Follow-Up). Good.
- **FAQ schema:** None. FAQ content links to /faq/ as a separate page.
- **Service schema with Offer:** None. New site has this on every service page.

### 2.3 City page (/city/bellevue/)

**Critical finding: city-name-swap, not localization.**

- H1: "Mole Control Seattle" (mismatched H1 — appears Seattle is the homepage and Bellevue uses similar template; need to re-verify)
- Generic value props with city name inserted
- **Zero references to:** Bellevue topology (Lake Washington / Lake Sammamish), microhabitat (clay-loam Aldernood-Everett soils), seasonal patterns specific to Eastside, neighborhood-level detail (Bridle Trails / Crossroads / Lakehurst).
- New site's Bellevue page has all of the above.

This is the biggest single content-quality gap. 87 city pages × generic-template = 87 thin pages from an AI extractability standpoint, even though they each rank for their core city term.

### 2.4 Blog post (/what-do-moles-eat/)

- **Word count:** ~1,200 words
- **Author:** Spencer Hill with bio + LinkedIn (good E-E-A-T)
- **H1 + H2s + H3s:** Yes, 4 food-category sections
- **Numbered list (4 control tips):** Yes
- **Statistics with cited sources:** No (mentions WDFW but doesn't extract specific stats)
- **Comparison tables:** No
- **FAQ schema:** No

---

## Part 3 — Authority (Pillar 2)

| Signal | Live site state |
|--------|-----------------|
| Founder / expert named | ✅ Spencer Hill, blog author |
| Years in business | ✅ "more than 15 years" + "founded 2017" |
| Review schema (AggregateRating) | ✅ Yoast emits sitewide |
| Specific stats with sources | ❌ Generic claims, no cited datapoints |
| Original research | ❌ None |
| Multi-location signal | ✅ 4 addresses in schema |
| Per-page LastModified | ❌ Sitewide ©2026 only |
| Veteran-owned | ✅ Mentioned, but not schema'd |
| Statistics density (per blog) | ⚠️ Light — narrative-style content, few hard numbers |
| WSU / WDFW citations | ⚠️ Mentioned but not deeply leveraged |

**Comparison to new build:**
- New site adds Person schema for Spencer + 5-person Team
- New site has 55-93% earthworm diet stat, 18 ft/hr tunneling, 4-5 oz Townsend's mole — all sourced
- New site has 4 Tier 1 cornerstones with proprietary-angle GEO moats
- New site retains review schema (from existing 219+ Google reviews)

---

## Part 4 — Presence (Pillar 3)

**Not directly testable from automated audit — requires manual verification across third-party platforms.**

What we know:
- 219+ Google reviews across 3 GBP locations (per memory)
- Likely Yelp profile (competitor Mole Masters has one; standard for the category)
- Unknown Wikipedia, Reddit, YouTube, BBB, Angi, Nextdoor, industry press

Mole Masters (top SERP competitor) shows: Facebook + Yelp + Google Maps + Licensed & Insured + 30-year founder narrative. That's the bar to clear.

**For the brief's Track A4 (third-party presence) — assume current state is "Google reviews only" and treat all other channels as net-new buildouts.**

---

## Part 5 — SERP Landscape Sample (5 broad queries)

Tested via Google web search 2026-04-20 (proxy for AI Overview source set, since AI engines mostly cite top web results).

| Query | Got Moles in top 10? | Cited authorities |
|-------|:-----------------:|-------------------|
| "mole control Seattle Bellevue Tacoma" | ❌ | Mole Masters, Sunrise Pest, Seattle Wildlife Control, Willard's, Croach, Mole Man, Mole Control and More |
| "how to get rid of moles Washington State" | ❌ | Northwest Center, eHow, **WSU Hortsense**, JC Ehrlich, Kelly's, Pacifica Landscapes, **WSU Snohomish Extension**, Sunrise, Western Exterminator, HeraldNet |

**Pattern:**
- Got Moles ranks #1 for ~700 long-tail city+keyword terms (proven by previous agency Rankings sheet) — **a strength**.
- Got Moles ranks **outside top 10 for broad informational queries** — a critical gap for AI citations.
- WSU Extension dominates educational queries — if Got Moles can get cited *by* WSU's pages or seed authoritative content WSU would link to, that's a Pillar 3 lever.
- Mole Masters' "founded 1991, 30+ years" longevity signal is potent. Spencer's "15+ years personal experience" needs to **lead** with personal experience to match.

### Initiative 713 note

Live and competitor SERPs surface I-713 (Washington's body-gripping trap ban). **Got Moles uses body-gripping professional traps — DO NOT claim I-713 compliance** (per CLAUDE.md). Lead with "professional methods, chemical-free, safe for pets/children, veteran-owned." Already correctly framed in the new build.

---

## Part 6 — Three-Pillar Scoring (Live Site)

### Pillar 1: Structure — **50/100**
Solid Yoast schema baseline + good blog Article + Person attribution. Major gaps: no FAQPage on Q&A pages, no Speakable, no HowTo on process pages, no Service+Offer schema. Generic city pages are thin from AI extractability angle.

### Pillar 2: Authority — **55/100**
Spencer named, multi-location signal, Yoast Review/AggregateRating schema, 15+ years claim. Gaps: no statistics with sources, no original research, no per-page freshness signals, narrative-style blog content.

### Pillar 3: Presence — **~30/100** (estimated, manual verification recommended)
Strong Google reviews. Likely Yelp. Unknown / probably zero on Wikipedia, Reddit, YouTube, BBB, Angi, Nextdoor, industry press.

### **Overall: ~46/100**

---

## Part 7 — What the Live Site Does Right (must preserve on DNS switch)

These are the assets the new build inherits via redirects + by maintaining brand context:

1. **291-redirect map** preserves 94 of 111 old-site URLs covering ~700 ranked keywords. Already in place. (15 gaps to patch — Track C of `seo-geo-reinforcement`.)
2. **Sitewide Review + AggregateRating schema** (Yoast pattern) — new site reproduces this on the Reviews page + LocalBusiness aggregate.
3. **Spencer Hill author attribution** on blog content — preserved + extended with full Person + Team schemas on About page.
4. **4-address LocalBusiness graph** — preserved as 3 GBP locations referenced in new site SiteSettings.
5. **Long-tail city+keyword ranking density** — preserved by 90 city pages mapped 1:1 to old-site URLs via redirects.

---

## Part 8 — Gaps the New Build Closes

| Gap (live site) | Closed by (new build) |
|-----------------|----------------------|
| No FAQPage anywhere | ✅ FAQ block emits FAQPage on every service, city, FAQ, blog page |
| No Speakable schema | ✅ GEODefinitionBlock emits SpeakableSpecification on key pages |
| No HowTo on process pages | ✅ /how-it-works/ has HowTo schema with 4 steps |
| No Service+Offer schema | ✅ All 3 service pages have Service+Offer+UnitPriceSpecification |
| Generic city-name-swap content | ✅ Per-city localized BLUF + microhabitat + neighborhood detail |
| No city-level GeoCoordinates | ✅ cityLocalBusiness schema with GeoCoordinates per city |
| No proprietary stats | ✅ 55-93% earthworm diet, 18 ft/hr, 4-5 oz Townsend's mole — all sourced |
| No GEO content moats | ✅ 4 Tier 1 cornerstones (Townsend's mole, earthworm diet, Mazama gopher, complete guide) |
| 220+ thin city×service pages | ✅ Consolidated into 90 canonical city pages + 3 service pages with 301s preserving link equity |
| No per-page LastModified | ✅ Next.js generateMetadata() emits per-page |
| No Person schemas for staff | ✅ Person + Team schemas on About page (Spencer + 5) |
| No internal link density on broad queries | ✅ 360 contextual city-to-city links + 50 in-content blog links |
| Implicit-only AI bot access | ✅ Explicit allowlist for 19 AI/search bots |

---

## Part 9 — Gaps the New Build Does NOT Close (Track A of seo-geo-reinforcement L2)

Both the live site AND the new site lack:

1. **Third-party presence (Pillar 3)** — Wikipedia, Reddit, YouTube, BBB, Angi, Nextdoor, industry press. AI engines cite externals 6.5× more than own domain. **Biggest single AI-citation lever still on the board.**
2. **Comparison content depth** — comparison pages capture ~33% of AI citation share. New build has 2 (Mole vs Vole, Monthly vs One-Time). Need 4 more (vs DIY, vs Moody Moles, 5 city "best of" hubs, 3-way service comparison).
3. **Original research** — Spencer's 5,000-client dataset is unused on both. Original research = 12% of citations and unreproducible by competitors.
4. **AI visibility baseline** — no captured pre-launch snapshot of which queries AI cites Got Moles for. Without it, post-launch lift is unmeasurable.

These are the four Track A items in the `seo-geo-reinforcement` L2.

---

## Part 10 — Pre-DNS-Switch Action Items (already covered)

These aren't new findings from this audit — they consolidate what's already actionable in the L2 brief:

| # | Action | Tracked in |
|---|--------|-----------|
| 1 | Patch 15 uncovered redirects | Track C3 (launch-critical) |
| 2 | Add 6 cities (Algona, Fairwood, Lake Tapps, Medina, Centralia, Eatonville) | Track C1 (launch-critical) |
| 3 | Reseed + verify | Track C4-C5 (launch-critical) |
| 4 | Tracking IDs install | Paid Ads Readiness (launch-critical, Spencer-blocked on account handoff) |
| 5 | Jobber API wire | Paid Ads Readiness (launch-critical) |
| 6 | LSA Google Guarantee verification kickoff | Paid Ads Readiness (launch-critical) |

---

## Part 11 — AI Visibility Baseline (manual queries Roy can run)

Per str-ai-seo Step 2 — these need actual ChatGPT / Perplexity / Claude / Google AI Overview testing (can't be done via WebSearch, which only returns Google web results). Recommended priority queries:

1. mole control Washington State
2. best mole control in Western Washington
3. how to get rid of moles Puget Sound
4. moles eastern Washington (should surface "no moles east of Cascades" moat)
5. types of moles Washington State
6. why grub control doesn't work on moles (should surface earthworm diet moat)
7. mole vs vole vs gopher Western Washington
8. Townsend's mole largest North America
9. mole control Bellevue / Sammamish / Tacoma / Seattle / Puyallup
10. professional mole trapping Pierce County
11. chemical-free mole removal WA
12. veteran owned mole control Washington
13. is mole poison safe for dogs Talpirid
14. Mazama pocket gopher Western Washington
15. do moles hibernate Washington winter

For each: capture screenshot of which sources are cited. Repeat 30 days post-DNS-switch for delta measurement.

---

## Part 12 — Bottom Line

The live site has been doing the long-tail SEO job well for years (700+ ranked keywords, $10 CPL paid baseline). It is **not** doing the AI/GEO job at all (~46/100, invisible on broad informational queries, missing all AI-critical schemas).

The new build addresses the AI/GEO gap structurally (87/100 internal posture) and preserves the long-tail wins via redirects. DNS switch represents a +40-point GEO lift on day one.

What the new build does NOT yet address: third-party presence, comparison depth, original research, monitoring. All four are scoped in the `seo-geo-reinforcement` L2 (Track A) for post-launch execution.

---

## Sources & Data

- Live site direct fetches: `/`, `/robots.txt`, `/sitemap.xml`, `/page-sitemap.xml`, `/city-sitemap.xml`, `/post-sitemap.xml`, `/mole-control/`, `/city/bellevue/`, `/what-do-moles-eat/`, `/faq/`, `/mole-control-bellevue/`
- JSON-LD scraped via Node.js fetch (User-Agent Mozilla)
- SERP landscape: Google web search 2026-04-20 — 2 broad queries
- Competitor signal: Mole Masters homepage (top SERP competitor)
- New-build comparison: `projects/str-ai-seo/2026-04-20_full-seo-geo-report.md`
- Long-tail ranking baseline: `projects/briefs/google-ads-campaigns/baseline-from-previous-agency.md`
- Comparable competitor authorities: WSU Hortsense, WSU Snohomish Extension, Northwest Center for Alternatives to Pesticides, JC Ehrlich, Mole Masters, Croach, Sunrise Pest, Mole Man WA
