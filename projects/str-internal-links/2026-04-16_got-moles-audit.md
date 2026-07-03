---
site: got-moles
date: 2026-04-16
score: 41/100
orphan_pages: 7
fixes_p1: 6
fixes_total: 22
status: draft
---

# Internal Link Audit — Got Moles New Site

**Staging:** project-pf8c6.vercel.app
**Codebase:** `projects/briefs/website-rebuild-rebrand/site/src/`
**Date:** 2026-04-16

---

## Internal Link Audit Score: 41/100 (SEO/GEO weighted)

| Pillar | Score | SEO/GEO Weight | Weighted |
|--------|-------|----------------|----------|
| Cross-Linking Gaps | 2/10 | 25% | 5.0 |
| Hub-and-Spoke | 4/10 | 25% | 10.0 |
| Anchor Text | 4/10 | 20% | 8.0 |
| Orphan Pages | 5/10 | 15% | 7.5 |
| Link Depth | 8/10 | 10% | 8.0 |
| Link Equity Flow | 4/10 | 5% | 2.0 |

**SEO/GEO weighting rationale:** Cross-linking and topic clusters weighted highest because they directly drive rankings (SearchPilot +7% to +25% in A/B tests) and AI citation probability (December 2025 Helpful Content Update rewards clear content hierarchies). Anchor text weighted 20% because exact-match anchors deliver 5x more traffic (Zyppy, 23M links) and signal page topics to AI systems. Link depth and equity flow weighted lower because the site already scores well on depth and equity flow is largely captured by the other pillars.

**Worst pillar:** Cross-Linking Gaps (2/10). Zero contextual body links between content types (blog to service, service to city, reviews to service). This is the single biggest SEO opportunity on the site.

---

## Site Map (24 route types, ~100+ total pages)

| Route | Page Count | Strategic Priority |
|-------|-----------|-------------------|
| `/` | 1 | HIGH |
| `/how-it-works` | 1 | HIGH |
| `/services/total-mole-control-program` | 1 | HIGH (money page) |
| `/services/one-time-mole-removal` | 1 | HIGH (money page) |
| `/services/commercial-mole-control` | 1 | HIGH (money page) |
| `/service-areas` | 1 | MEDIUM (hub) |
| `/mole-control-{city}/` | 77 (59 built + 18 missing) | HIGH (money pages) |
| `/reviews` | 1 | MEDIUM |
| `/reviews/commercial-case-studies` | 1 | MEDIUM |
| `/blog` | 1 | MEDIUM (hub) |
| `/blog/{slug}` | 15 | MEDIUM |
| `/about` | 1 | LOW |
| `/contact` | 1 | MEDIUM |
| `/faq` | 1 | MEDIUM |
| `/privacy` | 1 | LOW |
| `/terms` | 1 | LOW |
| `/lp/*` | 4 | Isolated (no nav, intentional) |

---

## Pillar 1: Orphan Pages — 5/10

**Zero true orphans.** Every page is reachable via header nav or footer. That's the baseline.

**7 functional orphans.** These pages have ONLY navigation/footer links pointing to them. Zero contextual body links from any other page. Google gives template links less weight than editorial body links.

| Page | Nav/Footer Links | Contextual Body Links | Status |
|------|-----------------|----------------------|--------|
| `/services/total-mole-control-program` | Header + Footer | Homepage feature grid only | Weak |
| `/services/one-time-mole-removal` | Header + Footer | Homepage feature grid only | Weak |
| `/services/commercial-mole-control` | Header + Footer | Homepage feature grid only | Weak |
| `/faq` | Footer | How-It-Works "See all FAQs" + service page FAQ moreLinks | OK |
| `/about` | Header + Footer | Reviews "Read Spencer's story" + Case Studies "Read my full story" | OK |
| `/privacy` | Footer | Zero | Orphan |
| `/terms` | Footer | Zero | Orphan |

**12 city pages with zero inbound nearby-city references.** These cities are not referenced in any other city's `nearbyCity1` or `nearbyCity2` field. They're only reachable via the service-areas hub:

black-diamond, elk-plain, fircrest, granite-falls, lake-forest-park, mercer-island, mukilteo, newcastle, normandy-park, orting, pacific, parkland

---

## Pillar 2: Link Depth — 8/10

Strong. No page is more than 3 clicks from the homepage.

| Depth | Pages | Examples |
|-------|-------|---------|
| 0 | 1 | Homepage |
| 1 | ~25 | All nav pages, 12 priority cities, /reviews, /how-it-works |
| 2 | ~70 | Remaining 65 cities (via service-areas), all 15 blog posts (via /blog), commercial case studies (via /reviews) |
| 3 | 0 | None |

**Good:** 12 priority cities linked directly from homepage at depth 1.
**Good:** All service pages at depth 1 via feature grid.
**Minor gap:** Commercial case studies at depth 2 (homepage -> reviews -> case studies). Acceptable for secondary content.

---

## Pillar 3: Anchor Text — 4/10

Most internal link anchor text is either generic CTA copy or bare page titles. Missing keyword-rich contextual anchors.

### Anchor Text Inventory by Type

| Type | Count | Examples | Issue |
|------|-------|---------|-------|
| Generic CTA | 12 | "GET A FREE QUOTE", "REQUEST SITE INSPECTION", "See How It Works" | No keyword signal |
| Page title | 8 | "Year-Round Protection (TMCP)", "One-Time Removal", "Commercial" | Descriptive but no location/keyword |
| City name only | 12 | "Sammamish", "Bellevue", "Kirkland" (homepage service area) | Good city signal, missing "mole control" keyword |
| Generic utility | 5 | "See all FAQs", "See All Service Areas", "All Service Areas" | No keyword value |
| Keyword-adjacent | 2 | "See All 219+ Reviews", "View Commercial Case Studies" | Partial keyword match |

**Zero exact-match anchors** like "mole control Seattle" or "mole trapping Tacoma" anywhere on the site. This is a 5x traffic opportunity being left on the table (Zyppy study: pages with at least 1 exact-match anchor = 5x more traffic).

**City page nearby-city links** use city display names ("Bellevue", "Issaquah") which are good partial matches but miss the "mole control" keyword.

**Service links from city pages** use service titles ("Year-Round Protection", "One-Time Removal") rather than keyword-rich anchors like "mole control program" or "professional mole removal".

---

## Pillar 4: Hub-and-Spoke — 4/10

### Location Cluster: 6/10

| Check | Status | Detail |
|-------|--------|--------|
| Hub page exists | YES | `/service-areas` links to all 77 cities |
| Hub links to ALL spokes | YES | All 77 cities linked |
| Spokes link back to hub | YES | Every city page links to `/service-areas` |
| Spokes cross-link to related spokes | PARTIAL | Only 2 nearby cities per page (should be 3-6) |
| No cross-cluster pollution | YES | Clean |

**Gap:** Only 2 nearby cities per page. SearchPilot A/B test proved +7% organic traffic from linking to 6 nearest neighboring location pages. Current setup leaves 4 cross-links on the table per city page.

**Gap:** 12 city pages are never referenced by any other city's nearbyCity field.

### Service Cluster: 2/10

| Check | Status | Detail |
|-------|--------|--------|
| Service hub page exists | NO | No `/services/` hub page. Only header dropdown. |
| Hub links to all services | N/A | No hub |
| Services link to each other | NO | Zero cross-links between TMCP, One-Time, Commercial |
| Services link to relevant city pages | NO | Zero city links from any service page |
| City pages link to services | YES | ServiceCards component on every city page |

**Critical gap:** Service pages are islands. No "Also consider" or "Compare services" linking. A visitor on the One-Time Removal page has no contextual path to TMCP.

### Blog Cluster: 1/10

| Check | Status | Detail |
|-------|--------|--------|
| Blog hub exists | YES | `/blog` lists all 15 posts |
| Hub links to all posts | YES | All 15 linked |
| Posts link back to hub | NO | No "Back to blog" link |
| Posts cross-link to related posts | NO | Zero inter-blog links |
| Posts link to service pages | TEMPLATE ONLY | 6 template links in "Related Services" sidebar. Zero in-content links |
| Posts link to city pages | NO | Zero city links in any blog post |

**Massive gap:** 15 blog posts x 0 in-content internal links = 0 contextual links flowing equity to money pages. The template-level "Related Services" section is better than nothing, but editorial body links carry significantly more weight.

---

## Pillar 5: Link Equity Flow — 4/10

### Authority Distribution

| Page | Inbound Contextual Links | Inbound Template Links | Status |
|------|-------------------------|----------------------|--------|
| Homepage | 0 (logo links don't count) | Header logo on all pages | OK |
| TMCP service | 1 (homepage feature grid) | Header + Footer | Equity-starved |
| One-Time service | 1 (homepage feature grid) | Header + Footer | Equity-starved |
| Commercial service | 1 (homepage feature grid) | Header + Footer | Equity-starved |
| Top city pages (Seattle, Tacoma, etc.) | 1 (homepage) + 2-8 nearby-city refs | Footer (5 counties) | Moderate |
| Leaf city pages (12 unreferenced) | 0 contextual | Service-areas hub only | Equity-starved |
| Blog posts | 0 | Blog hub listing | Equity-starved |
| Reviews | 1 (homepage testimonial block) | Footer | OK |

**Key finding:** The 3 service pages (TMCP, One-Time, Commercial) are the highest-value money pages on the site but receive only 1 contextual body link each (from the homepage feature grid). Every other inbound link is nav/footer template. These pages need 10-20+ contextual body links from blog posts, city pages, FAQ, and reviews to compete effectively.

**No nofollow internal links.** Good.
**No redirect chains detected in internal links.** Good.
**No broken internal links detected.** Good (though `/privacy` and `/terms` footer links may 404 if those pages aren't built yet).

### Outbound Link Density

| Page Type | Avg Contextual Outbound | Benchmark | Status |
|-----------|------------------------|-----------|--------|
| Homepage | 18 | 5-8 prominent | Over-linked (dilution risk on city block) |
| City pages | 6 (2 nearby + 3 services + 1 service-areas) | 8-12 | Under-linked |
| Service pages | 1-2 (FAQ moreLink + CTA) | 8-12 | Severely under-linked |
| Blog posts | 0 in-content + 6 template | 3-5 per 1,000 words | Zero editorial links |

---

## Pillar 6: Cross-Linking Gaps — 2/10

This is the biggest opportunity. The table below shows every cross-link pattern that should exist but doesn't.

### Gap Map

| From | To | Current | Should Be | Gap Size |
|------|----|---------|-----------|----------|
| Blog posts (15) | Service pages | 0 in-content | 2-3 per post | ~35 missing links |
| Blog posts (15) | City pages | 0 | 1-2 per post (localize) | ~20 missing links |
| Blog posts (15) | Other blog posts | 0 | 1-2 related per post | ~20 missing links |
| Service pages (3) | City pages | 0 | 5-10 per service page | ~20 missing links |
| Service pages (3) | Other service pages | 0 | 2 each (cross-sell) | 6 missing links |
| Service pages (3) | Blog posts | 0 | 2-3 relevant per service | ~8 missing links |
| City pages (59) | Blog posts | 0 | 1-2 relevant per city | ~80 missing links |
| City pages (59) | Additional nearby cities | 2 per city | 4-6 per city | ~120 missing links |
| Reviews | Service pages | 0 | 3 (one per service) | 3 missing links |
| Reviews | City pages | 0 | 3-5 top cities | 4 missing links |
| Commercial case studies | Commercial service | 0 | 1 direct link | 1 missing link |
| FAQ | Service pages | 0 | Link answers to relevant services | ~5 missing links |
| FAQ | City pages | 0 | Link location questions to cities | ~3 missing links |
| About | Services | 0 | 1-2 (Spencer's work) | 2 missing links |
| How-It-Works | Service pages | 0 | 3 (one per service) | 3 missing links |

**Total estimated missing contextual body links: ~330**

---

## Prioritized Fix List

### P1 — Fix Now (High Impact, Low-Medium Effort)

| # | Fix | Impact | Effort | File(s) to Edit |
|---|-----|--------|--------|-----------------|
| 1 | **Add in-content links to all 15 blog posts.** Each post mentions services by name but never links them. Add 2-3 contextual links per post to relevant service pages. Use keyword-rich anchors like "professional mole trapping" not "click here". | HIGH | MEDIUM | `site/src/lib/blog-data.ts` — edit richText content for each post |
| 2 | **Cross-link service pages to each other.** Add "Compare Services" or "Also Consider" section to each service page linking to the other 2 services. | HIGH | LOW | `site/src/lib/pages-data.ts` — add richContent or comparison block to `tmcpBlocks`, `oneTimeBlocks`, `commercialBlocks` |
| 3 | **Add city page links to service pages.** Each service page should reference 5-10 top cities. "We serve Seattle, Tacoma, Bellevue..." with links. | HIGH | LOW | `site/src/lib/pages-data.ts` — add serviceArea or richContent block to each service page |
| 4 | **Link How-It-Works to all 3 service pages.** Currently only links to FAQ. Add explicit "Choose Your Service" section linking to TMCP, One-Time, and Commercial. | HIGH | LOW | `site/src/lib/pages-data.ts` — add featureGrid or richContent to `howItWorksBlocks` |
| 5 | **Link Reviews page to service pages.** Add "Services Our Customers Review" section with links to TMCP, One-Time, Commercial. | MEDIUM | LOW | `site/src/app/(frontend)/reviews/page.tsx` — add section before FAQ |
| 6 | **Link Commercial Case Studies to Commercial service page.** Add explicit "Learn more about our commercial service" link. | MEDIUM | LOW | `site/src/lib/pages-data.ts` — add to `commercialCaseStudiesBlocks` |

### P2 — Fix This Sprint (High Impact, Medium Effort)

| # | Fix | Impact | Effort | File(s) to Edit |
|---|-----|--------|--------|-----------------|
| 7 | **Increase nearby-city links from 2 to 5-6 per city page.** SearchPilot proved +7% organic traffic from 6 nearest neighbors. Currently only 2. | HIGH | MEDIUM | `site/src/lib/city-data.ts` — add nearbyCity3 through nearbyCity6 fields; `site/src/app/(frontend)/[citySlug]/page.tsx` — render additional nearby links |
| 8 | **Add blog post links to city pages.** Each city page should link to 1-2 relevant blog posts in the content area. E.g., Seattle city page links to "Mole Removal Cost in Washington" and "When Are Moles Most Active in Washington". | MEDIUM | MEDIUM | `site/src/app/(frontend)/[citySlug]/page.tsx` — add "Helpful Resources" section with conditional blog links |
| 9 | **Add cross-links between related blog posts.** Group posts by cluster (Mole Control: 7 posts, Cost: 2, Biology: 3, Safety: 1, Seasonal: 1, DIY: 1) and add "Related Reading" links. | MEDIUM | MEDIUM | `site/src/lib/blog-data.ts` — add `relatedPosts` field to each post; `site/src/app/(frontend)/blog/[slug]/page.tsx` — render related posts section |
| 10 | **Fix anchor text on service links from city pages.** ServiceCards currently use "Year-Round Protection", "One-Time Removal", "Commercial". Change to include "mole control" keyword: "Year-Round Mole Control Program", "One-Time Mole Removal", "Commercial Mole Control". | MEDIUM | LOW | `site/src/app/(frontend)/[citySlug]/page.tsx` — update ServiceCards text |
| 11 | **Fix anchor text on nearby-city links.** Currently uses bare city names ("Bellevue"). Change to "Mole control in Bellevue" for exact-match anchor text boost (5x traffic per Zyppy). | MEDIUM | LOW | `site/src/app/(frontend)/[citySlug]/page.tsx` — update nearby city link text |
| 12 | **Add "Back to Blog" link on blog post pages.** Blog posts have no link back to the blog hub. | LOW | LOW | `site/src/app/(frontend)/blog/[slug]/page.tsx` — add breadcrumb or back link |

### P3 — Scheduled (Medium Impact, Medium Effort)

| # | Fix | Impact | Effort | File(s) to Edit |
|---|-----|--------|--------|-----------------|
| 13 | **FAQ answers should link to relevant service pages.** E.g., "How much does mole removal cost?" answer should link to One-Time Removal and TMCP pages. | MEDIUM | MEDIUM | `site/src/lib/pages-data.ts` — edit FAQ richText answers in `faqBlocks` |
| 14 | **Add blog links to service pages.** Each service page should link to 2-3 relevant blog posts. E.g., TMCP links to "Monthly vs One-Time" and "Why Moles Keep Coming Back". | MEDIUM | MEDIUM | `site/src/lib/pages-data.ts` — add richContent block to service page blocks |
| 15 | **About page should link to services.** Spencer's bio mentions building the company around mole trapping. Add contextual links to service pages in the narrative. | LOW | LOW | `site/src/lib/pages-data.ts` — edit `aboutBlocks` richContent |
| 16 | **Create a /services/ hub page.** Currently no service hub exists. Header has a dropdown but no landing page. A hub page linking to all 3 services would complete the service cluster. | MEDIUM | MEDIUM | New page: `site/src/app/(frontend)/services/page.tsx` + blocks in pages-data.ts |
| 17 | **Fix the 12 unreferenced city pages.** Add these as nearbyCity references from their geographic neighbors: black-diamond, elk-plain, fircrest, granite-falls, lake-forest-park, mercer-island, mukilteo, newcastle, normandy-park, orting, pacific, parkland. | LOW | MEDIUM | `site/src/lib/city-data.ts` — update neighbor references |
| 18 | **Add city-specific testimonial links.** Reviews page filters by city. Each city page could link to `/reviews/?city={slug}` showing local testimonials. | MEDIUM | LOW | `site/src/app/(frontend)/[citySlug]/page.tsx` — add "See reviews from {City} homeowners" link |

### P4 — Monitor (Low Impact, Varies)

| # | Fix | Impact | Effort | File(s) to Edit |
|---|-----|--------|--------|-----------------|
| 19 | **Verify /privacy and /terms pages exist.** Footer links to both but pages may not be built. | LOW | LOW | Check page routes exist |
| 20 | **Review blog template links for anchor text.** The "Related Services & Resources" section uses descriptive titles. Could add keyword-rich variations. | LOW | LOW | `site/src/app/(frontend)/blog/[slug]/page.tsx` lines 220-241 |
| 21 | **Consider homepage service area block link count.** 12 city links in one block may dilute equity. Consider showing 6 priority cities instead with "See all" link. | LOW | LOW | `site/src/lib/pages-data.ts` — `homepageBlocks` serviceArea section |
| 22 | **Landing pages (/lp/*) intentionally isolated.** Confirm this is correct for conversion-focused paid traffic pages. No action needed unless SEO value wanted. | MONITOR | NONE | N/A |

---

## Key Statistics

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Total contextual body links across site | ~45 | ~375 | 330 missing |
| Blog posts with in-content links | 0/15 (0%) | 15/15 (100%) | 15 posts need links |
| Service pages with city links | 0/3 (0%) | 3/3 (100%) | 3 pages need city links |
| Service pages cross-linking each other | 0/3 (0%) | 3/3 (100%) | 6 cross-links needed |
| City pages with nearby-city links | 2 per page | 5-6 per page | 3-4 more per city |
| Exact-match keyword anchors | 0 | 20+ | 20+ needed |
| Blog-to-service contextual links | 0 | ~35 | 35 missing |
| Service-to-blog contextual links | 0 | ~8 | 8 missing |

---

## Research Data Backing These Recommendations

| Recommendation | Evidence | Source |
|---------------|----------|--------|
| Add in-content blog links | 76.6% of previously orphaned pages improved rankings when internal links added | Niche Pursuits (108 links) |
| Increase nearby-city links to 6 | +7% organic traffic from linking to 6 nearest neighbors | SearchPilot A/B test |
| Add exact-match anchors | Pages with 1+ exact-match anchor = 5x more traffic | Zyppy (23M links) |
| Cross-link service pages | +25% organic traffic from category cross-linking | SearchPilot (Iceland Groceries) |
| Contextual body links > nav links | Editorial links carry more weight than template links | Google (John Mueller) |
| Optimal links per page: 40-50 | Sweet spot for maximum organic clicks | Zyppy (23M links) |
| Internal linking is "super-critical for SEO" | Direct quote | John Mueller, Google |
