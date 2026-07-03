---
project: reviews-testimonials-seo
status: active
level: 2
created: 2026-04-16
parent: got-moles-marketing-os
sign-off-required: Ian (SEO), Roy
---

# Reviews, Testimonials & SEO Migration

## Goal

Two connected objectives:

1. **Reviews hub:** Transform a thin 6-review page into a dynamic proof library with 183+ reviews, schema markup, GEO content layer, and commercial case studies.
2. **SEO migration:** Preserve Got Moles' existing search rankings (currently #1 for 6+ city queries, top 10 for 12/13 tested) during the site rebuild. No traffic loss on launch.

## Why This Matters

- **219+ real reviews** exist on Google Business Profile but only 6 appear on the site. Trust gap.
- **Zero competitors doing GEO** in mole control. First mover window for AI-engine citations.
- **Got Moles dominates local search.** Holds multiple simultaneous SERP positions for key cities (3-6 URLs per query for Tacoma, Olympia, Seattle). A careless migration gives those slots to competitors.
- **~279 location URLs** on the old site need to map cleanly to the new architecture. 301 redirects alone lose ~10-15% link equity per hop AND surrender multi-slot SERP dominance.

---

## Part 1: Reviews Hub (COMPLETE)

### What was built (Sessions 1-3)

| Deliverable | Status |
|------------|--------|
| GEO audit of current reviews page | Done |
| Reviews hub blueprint (10-section architecture) | Done |
| CRO validation (LIFT 88/100) | Done |
| Enrichment: 183 reviews classified (serviceType, concern, city) | Done |
| Seed: 183 testimonials into Payload CMS Testimonials collection | Done |
| Reviews hub page rebuild: dynamic filters, pagination, 3 featured | Done |
| JSON-LD: LocalBusiness + AggregateRating + 183 Review + BreadcrumbList + FAQPage | Done |
| GEO definition + expert attribution + 10 FAQ items | Done |
| Humanizer deep pass (all copy 8.0+) | Done |

**Live on staging:** `project-pf8c6.vercel.app/reviews`

### What was built (Session 3) — Commercial Case Studies

| Deliverable | Status |
|------------|--------|
| Commercial case studies page (4 studies: soccer field, park, airport, property mgmt) | Done |
| Spencer sign-off section (first-person, handles commercial directly) | Done |
| 9 FAQ items with FAQPage schema (cost, multi-site, scheduling, reporting, safety, timeline, golf, HOA, liability) | Done |
| GEO definition with full property type list | Done |
| Article + FAQPage + BreadcrumbList schema | Done |
| 4 nano-generated images (Gemini) | Done |
| SEO/GEO keyword gap pass (golf course, HOA, cemetery, school, liability) | Done |
| Cross-link from reviews hub | Done |
| CMS seeded with fallbackImage pattern | Done |

**Live on staging:** `project-pf8c6.vercel.app/reviews/commercial-case-studies/`

### Commits (all sessions)

- `a79fa5e` — Reviews hub rebuild: 183 testimonials, GEO/schema, dynamic filters
- `12f31bf` — SEO/GEO pass: humanizer, locationCreated schema, local FAQ
- `cd0c09e` — Fix og:image sitewide
- `7353bde` — Commercial case studies page
- `72fc76e` — 4 nano images for commercial case studies
- `4803690` — Spencer sign-off section
- `afb1c64` — SEO/GEO pass on commercial case studies
- `288e1a1` — CMS seed with image upload and linking
- `0196df6` — Fix imageText fallbackImage pattern

---

## Part 2: SEO Migration (NEEDS SIGN-OFF)

Full audit document: `2026-04-16_seo-migration-audit.md`
Notion: https://www.notion.so/SEO-Migration-Audit-Location-Pages-2026-04-16-3443d42c4a9c815e8abdcc03dfa1e694

### The Problem

The old site (got-moles.com) has ~279 location URLs across 3 parallel systems:

| System | Pattern | Count | SEO Value |
|--------|---------|-------|-----------|
| City CPT | `/city/{city}/` | 72 | Low (never appeared in search results) |
| Flat city | `/{city}/` | 63 | Medium (12 cities rank with these) |
| Service+City combos | `/mole-control-{city}/`, `/mole-trapping-{city}/`, etc. | ~144 | **HIGH (primary ranking pages)** |

The new site consolidates everything to `/mole-control-{city}/` with 301 redirects. Problem: some of those "redirected" URLs currently hold #1 positions. A 301 loses the ranking slot AND gives it to competitors.

### Ranking Data (tested 37 queries)

| Finding | Detail |
|---------|--------|
| Queries where Got Moles ranks top 10 | 12 out of 13 competitive queries |
| #1 positions held | 6+ (Tacoma, Bellevue, Renton, Auburn, Issaquah, Bonney Lake, Gig Harbor, Lacey, Burien, and more) |
| Multi-slot dominance | Seattle (6 URLs in one SERP), Tacoma (5), Olympia (4), Issaquah (5) |
| Super pages | `/mole-trapping-olympia/` cross-ranks for 8+ other cities. `/mole-trapping-burien/` cross-ranks for 5+. |
| Gap: Snohomish County | Zero presence (Everett queries return no Got Moles results) |
| Gap: Kitsap County | Zero presence despite having a Bremerton office |
| Primary competitor | molemasters.biz (30+ years, appears in almost every query) |

### Proposed Strategy: Shadow Pages

**Tier 1A: Primary city pages (21 pages)**
URL pattern: `/mole-control-{city}/`
Already matches the new site. Serve upgraded branded content. These are the core city pages in the nav, sitemap, and service-areas hub.

**Tier 1B: Shadow pages, mole-trapping variant (16 pages)**
URL pattern: `/mole-trapping-{city}/`
Keep alive with unique branded content. NOT in nav. NOT in sitemap. Self-canonical. Targets "mole trapping" keyword specifically.

Includes the 2 super pages:
- `/mole-trapping-olympia/` — cross-ranks for Tacoma, Sammamish, Kent, Auburn, Bonney Lake, Enumclaw, Issaquah, Thurston County
- `/mole-trapping-burien/` — cross-ranks for Auburn, Federal Way, Bonney Lake, Enumclaw, King County

**Tier 1C: Shadow pages, plain city slugs (2 pages)**
`/lakewood/` and `/lynnwood/` — both rank #1 for their queries. Too valuable to redirect.

**Tier 1D: Shadow pages, other variants (6 pages)**
Reverse-pattern and niche URLs ranking #1-5: `/mole-catcher-seattle/`, `/edmonds-mole-control/`, `/tacoma-mole-removal`, `/lynnwood-mole-control/`, `/mole-exterminators-seattle/`, `/mole-repellant-issaquah/`

**Tier 2: Safe to 301 redirect (~200+ URLs)**
All `/city/{city}/` taxonomy pages, all `-2` duplicates, all `/service/{service}/` pages, combo pages with no detected rankings.

**Tier 3: Missing cities (18 cities)**
Cities in redirect map but NOT in `city-data.ts`. Redirects currently 404. Must add to `city-data.ts`:
algona, clyde-hill, fairfax, fairwood, fife, green-river, lake-city, lake-tapps, medina, mill-creek, north-bend, prairie-ridge, ravensdale, roy, white-center, bainbridge-island, port-orchard, poulsbo

### Shadow Page Architecture

A shadow page:
- Exists at a specific URL, serves real branded content
- Is NOT in navigation, footer, or sitemap
- Has `rel=canonical` pointing to itself (self-canonical to preserve ranking)
- Links to the primary `/mole-control-{city}/` page
- Has unique H1 targeting the specific keyword ("Professional Mole Trapping in {City}")
- 400-600 words of unique content per page
- LocalBusiness + BreadcrumbList schema
- GEO paragraph for AI citation

### Page Count Summary

| Type | Count |
|------|-------|
| Primary city pages | 77 (59 existing + 18 missing) |
| Shadow: mole-trapping | 16 |
| Shadow: plain city slugs | 2 |
| Shadow: other variants | 6 |
| **Total shadow pages** | **24** |
| **Total city-related pages** | **101** |
| 301 Redirects | ~200+ |

### Questions for Ian

1. **Self-canonical vs canonical-to-primary on shadow pages?** Current recommendation is self-canonical to preserve individual rankings. Alternative: canonical to primary, accepting potential short-term ranking loss for long-term consolidation. What does Ian recommend?

2. **The 2 super pages (`/mole-trapping-olympia/` and `/mole-trapping-burien/`)** — these cross-rank for 8+ and 5+ other cities respectively. Is there a risk that upgrading their content disrupts the cross-ranking behavior? Should we preserve the existing content structure?

3. **Snohomish + Kitsap County gaps** — Got Moles has zero search presence in these counties despite having offices. Should we prioritize building presence there as part of this migration, or focus on preserving what we have first?

4. **The `/lakewood/` and `/lynnwood/` plain slugs** — both rank #1 but conflict with Next.js routing (these slugs could match other routes). Shadow pages work but add architectural complexity. Is the #1 ranking worth preserving, or is a 301 to `/mole-control-lakewood/` acceptable?

5. **Monitoring plan** — what Search Console metrics should we track post-launch? Recommendations: indexed pages count, impressions per city query, click-through rates for Tier 1A and 1B URLs, 404 error reports.

---

## Part 3: Remaining Work

### Still to build (reviews project)

- [ ] Crawlable filter URLs on reviews hub (`?service=tmcp&city=seattle`)
- [ ] Wire testimonials to service/city pages (pull by serviceType and city from CMS)
- [ ] Individual Review schema on service/city pages showing testimonials
- [ ] "See All Reviews" links from Homepage/TMCP verified
- [ ] Add Got Moles logo to og-default.webp (branded social share image)

### SEO migration build

- [ ] **Ian sign-off on shadow page strategy**
- [ ] Add 18 missing cities to `city-data.ts`
- [ ] Build shadow page route in Next.js (serves branded content at old URLs)
- [ ] Create shadow page content: 24 pages x 400-600 words each
- [ ] Humanizer pass on all shadow page content
- [ ] Verify all redirects cover every old URL (no 404 gaps)
- [ ] Deploy to staging, test every Tier 1 URL
- [ ] Post-launch: 30-day ranking monitor across all tested queries

### Internal link fixes (audit score: 41/100)

Full audit: `2026-04-16_got-moles-audit.md` in `projects/str-internal-links/`

**P1 — Fix now:**
- [ ] Add in-content links to all 15 blog posts (2-3 per post to service/city pages with keyword-rich anchors)
- [ ] Cross-link service pages to each other (TMCP, One-Time, Commercial)
- [ ] Add city page links to each service page (5-10 top cities per service)
- [ ] Link How-It-Works to all 3 service pages
- [ ] Link Reviews page to service pages
- [ ] Link Commercial Case Studies to Commercial service page

**P2 — Fix this sprint:**
- [ ] Increase nearby-city links from 2 to 5-6 per city page (+7% traffic per SearchPilot)
- [ ] Add blog post links to city pages (1-2 relevant per city)
- [ ] Add cross-links between related blog posts
- [ ] Fix anchor text: "mole control in {City}" not bare city names (5x traffic per Zyppy)
- [ ] Add "Back to Blog" link on blog post pages

**P3 — Scheduled:**
- [ ] FAQ answers link to relevant service pages
- [ ] Service pages link to 2-3 relevant blog posts
- [ ] Create /services/ hub page
- [ ] Fix 12 unreferenced city pages in nearbyCity data
- [ ] Add city-specific testimonial links (/reviews/?city={slug})

---

## Acceptance Criteria

### Reviews (original)
1. Reviews page shows ALL 183+ reviews from CMS, filterable, paginated
2. At least 3 filter views crawlable
3. Google Rich Results Test passes for Review, AggregateRating, FAQ schema
4. Case studies page live with 4 studies + Spencer sign-off
5. "See All Reviews" from Homepage/TMCP lands on real depth
6. GEO definition paragraphs structured for AI citation
7. City pages show city-relevant testimonials
8. All copy scores 8.0+ through tool-humanizer

### SEO Migration (new)
9. Zero Tier 1A URLs return 404 after migration
10. All 24 shadow pages serve branded content at original URLs
11. All Tier 2 URLs 301 redirect to correct primary city page
12. All 18 missing cities have live pages (no redirect-to-404 gaps)
13. Search Console shows no significant ranking drops 30 days post-launch
14. Super pages (`/mole-trapping-olympia/` and `/mole-trapping-burien/`) maintain cross-city rankings

### Internal Links (new)
15. All 15 blog posts contain 2-3 contextual body links to service/city pages
16. All 3 service pages cross-link to each other and to 5+ city pages
17. City pages link to 5-6 nearby cities (up from 2)
18. Zero generic anchor text on money page links (no "click here", "read more")
19. At least 20 exact-match keyword anchors across the site ("mole control {city}")
20. Internal link audit re-score reaches 70+/100

---

## Constraints

- US English spelling always
- No I-713 compliance claims
- "219+ five-star Google reviews" (3 GBP locations)
- Guarantee mentions only on TMCP programme pages
- All publishable content through tool-humanizer (target 8.0+)
- Follow BUILD-METHODOLOGY.md + PAGE-BUILD-REFERENCE.md for all builds
- **SEO migration strategy requires Ian sign-off before implementation**
