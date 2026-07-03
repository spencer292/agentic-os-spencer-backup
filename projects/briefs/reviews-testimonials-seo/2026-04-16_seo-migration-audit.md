---
page: seo-migration-audit
date: 2026-04-16
status: draft
---

# SEO Migration Audit — Got Moles Location Pages

## Executive Summary

Got Moles ranks in the top 10 for 12 out of 13 competitive queries tested. Holds #1 position for 6+ queries. The `/mole-control-{city}/` pattern is the SEO backbone, with `/mole-trapping-{city}/` as a strong secondary. Two "super pages" (`/mole-trapping-olympia/` and `/mole-trapping-burien/`) cross-rank for 8+ other cities each.

**Critical finding:** Consolidating all URL variants into one page per city via 301 would sacrifice multi-slot SERP dominance. For cities like Tacoma, Olympia, and Seattle, Got Moles holds 3-6 simultaneous positions. Each 301 redirect loses ~10-15% link equity AND surrenders SERP slots to competitors.

**Recommended strategy:** Shadow pages. Keep ranking URLs alive with upgraded branded content. Don't put them in navigation. Let search engines continue to index them.

---

## Old Site URL Architecture (3 parallel systems)

| System | Pattern | Count | SEO Value |
|--------|---------|-------|-----------|
| City CPT | `/city/{city}/` | 72 | Low — never appeared in results |
| Flat city | `/{city}/` | 63 | Medium — 12 cities rank with these |
| Service+City | `/mole-control-{city}/`, `/mole-trapping-{city}/`, etc. | ~144 | HIGH — primary ranking pages |
| Service CPT | `/service/{service}/` | 9 | Low |
| Flat service | `/mole-control/`, `/mole-trapping/`, etc. | 9 | Low-Medium |
| Blog | `/{slug}/` | 26 | Informational authority |

---

## Tier Classification

### Tier 1A — Primary City Pages (MUST keep URL alive)

These are the `/mole-control-{city}/` pages. They rank #1-3 for their target queries. The new site already uses this pattern — these URLs match 1:1.

| URL | Best Position | Query |
|-----|--------------|-------|
| `/mole-control-tacoma/` | #1 | mole removal tacoma |
| `/mole-control-bellevue/` | #1 | mole exterminator bellevue |
| `/mole-control-renton/` | #1 | mole control renton |
| `/mole-control-auburn/` | #1 | mole control auburn |
| `/mole-control-issaquah/` | #1 | mole control issaquah |
| `/mole-control-federal-way/` | #1 | mole trapping federal way |
| `/mole-control-bonney-lake/` | #1 | mole control bonney lake |
| `/mole-control-gig-harbor/` | #1 | mole control gig harbor |
| `/mole-control-lacey/` | #1 | mole control lacey |
| `/mole-control-burien/` | #1 | mole control burien |
| `/mole-control-olympia/` | #4 | multiple Olympia queries |
| `/mole-control-kirkland/` | #2-4 | multiple Kirkland queries |
| `/mole-control-sammamish/` | #2-3 | multiple Sammamish queries |
| `/mole-control-kent/` | #2 | mole control kent |
| `/mole-control-woodinville/` | #2 | both queries |
| `/mole-control-shoreline/` | #3-5 | both queries |
| `/mole-control-bothell/` | #2-3 | both queries |
| `/mole-control-redmond/` | #7 | consistent |
| `/mole-control-puyallup/` | #3-8 | multiple queries |
| `/mole-control-enumclaw/` | #2 | multiple queries |
| `/mole-control-des-moines/` | #6 | cross-ranks for lacey |

**Action:** These already match the new site's URL pattern. Serve upgraded branded content at these URLs. 21 pages.

### Tier 1B — Shadow Pages: mole-trapping (MUST preserve as shadow pages)

These `/mole-trapping-{city}/` pages rank alongside the primary pages. Redirecting them loses SERP slots.

| URL | Best Position | Query | Cross-ranks? |
|-----|--------------|-------|-------------|
| `/mole-trapping-olympia/` | #1 | multiple queries | YES — 8+ other cities |
| `/mole-trapping-burien/` | #2 | mole trapping burien | YES — 5+ other cities |
| `/mole-trapping-tacoma/` | #1 | mole exterminator tacoma | No |
| `/mole-trapping-bellevue/` | #4 | multiple queries | No |
| `/mole-trapping-kirkland/` | #3 | mole trapping kirkland | No |
| `/mole-trapping-renton/` | #1 | mole trapping renton | No |
| `/mole-trapping-auburn/` | #2 | mole trapping auburn | No |
| `/mole-trapping-issaquah/` | #2 | mole trapping issaquah | No |
| `/mole-trapping-redmond/` | #1 | mole trapping redmond | No |
| `/mole-trapping-puyallup/` | #2 | mole trapping puyallup | No |
| `/mole-trapping-bonney-lake/` | #4 | mole trapping bonney lake | No |
| `/mole-trapping-enumclaw/` | #1 | mole trapping enumclaw | No |
| `/mole-trapping-kent/` | #4 | mole trapping kent | No |
| `/mole-trapping-seattle/` | #6 | mole catcher seattle | No |
| `/mole-trapping-sammamish/` | present | trapping queries | No |
| `/mole-trapping-sumner/` | #7 | pierce county query | No |

**Action:** Create shadow pages at these URLs. Unique H1 targeting "Mole Trapping in {City}". Branded, upgraded content. NOT in navigation. NOT in sitemap. Canonical to the primary `/mole-control-{city}/` page OR self-canonical (see strategy below). 16 pages.

### Tier 1C — Shadow Pages: Plain City Slugs (preserve where ranking)

| URL | Best Position | Notes |
|-----|--------------|-------|
| `/lakewood/` | #1 | STRONGEST — #1 for both control and trapping |
| `/lynnwood/` | #1 | STRONGEST — #1 for both queries |
| `/tacoma/` | #4-7 | Appears in multiple queries |
| `/seattle/` | #8 | Appears for catcher query |
| `/sammamish/` | #4 | Trapping + removal queries |
| `/woodinville/` | #5 | Trapping query |
| `/bonney-lake/` | #5 | Multiple queries |
| `/kirkland/` | #10 | Exterminator query |
| `/edmonds/` | #10 | Control query |
| `/kent/` | #10 | Trapping query |
| `/gig-harbor/` | #10 | Control query |

**Action:** These need special handling. They clash with Next.js dynamic routes. Options:
- Serve as shadow pages with branded content
- OR 301 redirect to `/mole-control-{city}/` (loses ~15% equity but simplifies architecture)

**Recommendation:** Redirect the weaker ones (#7-10 positions) and preserve `/lakewood/` and `/lynnwood/` as shadow pages (they're #1 — can't afford to lose that). 2 shadow pages, 9 redirects.

### Tier 1D — Shadow Pages: Reverse-Pattern and Other Variants

| URL | Best Position | Notes |
|-----|--------------|-------|
| `/tacoma-mole-removal` | #4 | mole removal tacoma |
| `/edmonds-mole-control/` | #3 | both Edmonds queries |
| `/lynnwood-mole-control/` | #4 | Lynnwood queries |
| `/issaquah-mole-control/` | #7 | both Issaquah queries |
| `/mole-catcher-seattle/` | #1 | mole catcher seattle |
| `/mole-catcher-olympia/` | #9 | mole removal olympia |
| `/seattle-mole-removal` | #10 | mole catcher seattle |
| `/kirkland-mole-extermination` | #10 | mole trapping kirkland |
| `/mole-exterminators-seattle/` | #3 | mole catcher seattle |
| `/mole-repellant-issaquah/` | #4 | mole trapping issaquah |
| `/mole-repellant-renton/` | #8 | mole trapping renton |

**Action:** Preserve as shadow pages where position is #1-5. Redirect #6-10 to primary city page. 6 shadow pages, 5 redirects.

### Tier 2 — Safe to 301 Redirect (no detected rankings)

All URLs NOT listed above. This includes:
- All `/city/{city}/` taxonomy pages (never appeared in results)
- All `/mole-repellant-{city}/` pages (except Issaquah and Renton)
- All `-2` duplicate pages
- All `/service/{service}/` taxonomy pages
- Combo pages for cities with zero results (Everett, Snohomish county cities)
- Cities not in the test set — assume redirect unless proven otherwise

**Action:** 301 redirect to the primary `/mole-control-{city}/` page.

### Tier 3 — 18 Missing Cities (redirect to 404 gap)

Cities in `redirects.ts` but NOT in `city-data.ts`:

| City | County | Recommendation |
|------|--------|---------------|
| algona | King | Add to city-data.ts (minimal content) |
| clyde-hill | King | Add to city-data.ts |
| fairfax | Pierce | Add to city-data.ts |
| fairwood | King | Add to city-data.ts |
| fife | Pierce | Add to city-data.ts |
| green-river | King | Add to city-data.ts |
| lake-city | King | Add to city-data.ts |
| lake-tapps | Pierce | Add to city-data.ts |
| medina | King | Add to city-data.ts |
| prairie-ridge | Pierce | Add to city-data.ts |
| ravensdale | King | Add to city-data.ts |
| roy | Pierce | Add to city-data.ts |
| white-center | King | Add to city-data.ts |
| bainbridge-island | Kitsap | Add to city-data.ts |
| port-orchard | Kitsap | Add to city-data.ts |
| poulsbo | Kitsap | Add to city-data.ts |
| mill-creek | Snohomish | Add to city-data.ts |
| north-bend | King | Add to city-data.ts |

**Action:** Add all 18 to `city-data.ts` with at least minimal content so redirects don't 404.

---

## Super Pages — Special Handling Required

Two pages have outsized SEO value because they cross-rank for many other cities:

### `/mole-trapping-olympia/` (ranks for 8+ other cities)
- mole exterminator tacoma (#2)
- mole catcher tacoma (#1)
- mole repellent tacoma (#6)
- mole trapping sammamish (#6)
- mole trapping kent (#7)
- mole trapping auburn (#9)
- mole trapping bonney lake (#8)
- mole trapping enumclaw (#3)
- mole trapping issaquah (#10)
- mole control thurston county (#6)

### `/mole-trapping-burien/` (ranks for 5+ other cities)
- mole trapping auburn (#7)
- mole trapping federal way (#9)
- mole trapping bonney lake (#9)
- mole trapping enumclaw (#10)
- mole exterminator king county (#8)

**These pages MUST be preserved exactly as shadow pages. Do not redirect. Do not remove. Upgrade content and brand them.**

---

## Shadow Page Architecture

### What is a shadow page?

A page that:
- Exists at a specific URL and serves real content
- Is NOT in the site navigation (header, footer, service-areas hub)
- Is NOT in the XML sitemap (let Google keep its existing index)
- Has a `rel=canonical` pointing to itself (self-canonical) to preserve ranking
- Links to the primary `/mole-control-{city}/` page as the "main" version
- Contains unique H1, title, and content targeting the specific keyword variant
- Is branded and upgraded (not the old WordPress content)
- Has proper schema markup

### Why self-canonical (not canonical to primary)?

If the shadow page currently ranks #1 and we set `rel=canonical` to the primary page, Google may drop the shadow page from results and NOT transfer the ranking to the primary. Self-canonical tells Google "this is the authoritative version of THIS URL" while the primary page is the authoritative version of its own URL. Both can rank.

### Shadow page content strategy

Each shadow page needs unique content targeting its specific keyword:
- **H1:** "Professional Mole Trapping in {City}" (not "Mole Control in {City}" — different keyword)
- **Content:** 400-600 words focusing on the trapping/removal/extermination angle
- **Local specifics:** City-relevant details, soil types, mole activity patterns
- **CTA:** Links to primary city page and contact
- **Schema:** LocalBusiness + BreadcrumbList (simpler than primary pages)
- **GEO paragraph:** Entity-rich text for AI citation
- **Cross-link:** "For our full {City} mole control services, visit [primary page]"

### Page count summary

| Type | Count |
|------|-------|
| Primary city pages (`/mole-control-{city}/`) | 59 (existing) + 18 (gap cities) = 77 |
| Shadow: mole-trapping | 16 |
| Shadow: plain city slugs | 2 (lakewood, lynnwood) |
| Shadow: reverse pattern + other | 6 |
| **Total shadow pages** | **24** |
| **Total city-related pages** | **101** |
| Redirects (everything else) | ~200+ |

---

## Competitive Landscape

| Competitor | Threat Level | Strengths |
|-----------|-------------|-----------|
| molemasters.biz | HIGH | 30+ years, appears in almost every query, city pages |
| nwmole.com | MEDIUM | Strong in King County |
| molemanwa.com | MEDIUM | Strong in Pierce County, 25+ years |
| mole-patrol.com | MEDIUM | Puget Sound wide |
| molecontrolandmore.com | LOW | South King County only |
| Yelp/Angi directories | HIGH | "Top 10" pages rank for most queries |

**Got Moles advantage:** Mole-exclusive specialization. 219+ reviews. Multi-slot SERP dominance. Zero competitors doing GEO.

**Got Moles gap:** Zero presence in Snohomish County (Everett) and Kitsap County despite having offices.

---

## Implementation Order

1. Fix the 18 missing cities in `city-data.ts` (prevent 404s)
2. Build shadow page route architecture (serves branded content at old URLs)
3. Create shadow page content for 24 Tier 1B/1C/1D URLs
4. Verify all redirects in `redirects.ts` are complete (no gaps)
5. Deploy to staging and test every URL
6. Post-launch: monitor Search Console for 404s and ranking changes
7. 30-day check: compare rankings before/after for all Tier 1 queries

---

## Queries Tested

| # | Query | Got Moles in Results? |
|---|-------|--------------------|
| 1 | mole control seattle | Yes — homepage #2 |
| 2 | mole control tacoma | Yes — #1 |
| 3 | mole control bellevue | Yes — #1 |
| 4 | mole trapping seattle | Yes — homepage #1 |
| 5 | mole removal seattle | Yes — homepage #6 |
| 6 | mole exterminator seattle | Yes — homepage #2 |
| 7 | mole catcher seattle | Yes — 6 URLs in top 10 |
| 8 | mole exterminator near me washington | Yes — homepage #4 |
| 9 | mole control kirkland | Yes — #2 |
| 10 | mole control olympia | Yes — #1 (triple ranking) |
| 11 | commercial mole control washington | No |
| 12 | got moles reviews | Yes — #1 |
| 13 | mole control sammamish | Yes — #1 (double ranking) |
| 14 | mole trapping tacoma | Yes — #1 (triple ranking) |
| 15 | mole control puyallup | Yes — #3 |
| 16-33 | 18 medium-priority city queries | Yes for 17/18 (only Everett missing) |
| 34-37 | County-level queries | Yes for King + Pierce, No for Snohomish + Kitsap |
