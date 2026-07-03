# Content & Keyword Strategy Roadmap — Got Moles

**Created:** 2026-04-02
**Purpose:** Structured pre-launch and post-launch content plan to maximize SEO/GEO authority before DNS switch
**Status:** Ready for execution

---

## Pre-Launch Sprint

### Batch 1: Schema Fixes
**Estimated:** 3 hours | **Dependencies:** None | **Can parallelize:** Yes (all independent)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1.1 | Fix city page lat/lng — currently hardcoded "0,0", read from city-data.ts instead. Add lat/lng fields to CityPages collection + seed script | `[citySlug]/page.tsx` line 91-92, `CityPages.ts`, `seed.ts` | Not started |
| 1.2 | Add AggregateRating schema to Reviews page (219+ reviews, 5.0 rating) | `reviews/page.tsx`, `schema.tsx` | Not started |
| 1.3 | Add CollectionPage schema to Blog index with ItemList of posts | `blog/page.tsx`, `schema.tsx` | Not started |
| 1.4 | Enhance Person schema — add US Army alumniOf, image URL, sameAs profiles | `schema.tsx` personSchema() | Not started |
| 1.5 | Verify HowTo schema on How It Works page, add if missing | `how-it-works/page.tsx` | Not started |

---

### Batch 2: New Blog Posts (Pre-Launch)
**Estimated:** 8 hours | **Dependencies:** None | **Can parallelize:** Yes (each post independent)

| # | Title | Slug | Primary Keyword | Volume | Status |
|---|-------|------|----------------|--------|--------|
| 2.1 | Mole Trapping Laws in Washington State (I-713 Guide) | `washington-mole-trapping-laws-i713` | mole trapping laws Washington | 2,160 | Not started |
| 2.2 | 10 Mole Control Myths Wasting Your Time | `mole-control-myths-debunked` | mole control myths | 3,670 | Not started |
| 2.3 | Mole Traps vs Poison vs Repellents | `mole-traps-vs-poison-vs-repellents` | mole traps vs poison | 3,190 | Not started |
| 2.4 | Can Moles Damage Your Foundation? | `can-moles-damage-foundation` | mole damage foundation | 1,900 | Not started |

**Per post deliverable:** Definition block (30 words, AI-citable), 6-7 sections, 5 FAQs with schema, primary keyword in H1, GEO-ready structure.

**Reminder:** Post 2.1 — do NOT claim I-713 compliance. Focus on chemical-free, safe for pets/children, professional methods.

---

### Batch 3: Internal Linking Overhaul
**Estimated:** 6 hours | **Dependencies:** Batch 2 (blog posts must exist first) | **Can parallelize:** 3a-3e are independent once posts exist

#### 3a. Blog → Service Links
Add `relatedServices` to each blog post. Render "Our Services" section at bottom of blog template.

| Blog Post | Links To | Anchor Text |
|-----------|----------|-------------|
| how-to-choose-a-mole-control-company | One-Time + TMCP | "$450 flat rate removal", "TMCP at $100/month" |
| diy-vs-professional-mole-control | One-Time | "professional mole removal service" |
| mole-removal-cost-washington | One-Time + TMCP + Commercial | "$450 flat rate", "$100/month", "commercial mole control" |
| mole-control-safe-for-pets | One-Time | "chemical-free mole control" |
| monthly-vs-one-time-mole-control | One-Time + TMCP | "one-time removal", "Total Mole Control Program" |
| when-are-moles-most-active-washington | TMCP | "year-round protection through the TMCP" |
| why-moles-keep-coming-back | TMCP | "Total Mole Control Program" |
| washington-mole-trapping-laws-i713 | One-Time | "Got Moles uses only legal, chemical-free methods" |
| mole-control-myths-debunked | One-Time + TMCP | "professional mole trapping", "ongoing protection" |
| mole-traps-vs-poison-vs-repellents | One-Time + TMCP | "professional trapping service", "year-round monitoring" |
| can-moles-damage-foundation | One-Time | "professional mole removal" |

**Status:** Not started

#### 3b. Service → Blog Evidence Links
Add "Learn More" section to each service page before final CTA.

| Service Page | Links To Blog Posts |
|-------------|-------------------|
| One-Time Removal | cost, DIY vs pro, pet safety, myths, how to choose |
| TMCP | why come back, monthly vs one-time, seasonal, cost |
| Commercial | laws, seasonal, foundation damage (liability angle) |

**Status:** Not started

#### 3c. City → Blog + Service Links
Add `<CityResourceLinks>` component to city page template. Universal 3 blog posts for all cities:
1. "How Much Does Mole Removal Cost in Washington?"
2. "Why Do Moles Keep Coming Back?"
3. "When Are Moles Most Active in Washington?"

Plus direct service links with pricing: One-Time ($450) and TMCP ($100/month).

**Status:** Not started

#### 3d. Blog → Blog Cross-Links
Add `relatedPosts` slugs to each post. Render "Related Articles" with 2 post cards.

| Post | Related Posts |
|------|-------------|
| how-to-choose | diy-vs-pro, cost |
| diy-vs-pro | myths, methods |
| cost | monthly-vs-one-time, how-to-choose |
| pet-safety | methods, myths |
| monthly-vs-one-time | why-come-back, cost |
| seasonal | why-come-back, foundation |
| why-come-back | monthly-vs-one-time, seasonal |
| laws | methods, diy-vs-pro |
| myths | diy-vs-pro, methods |
| methods | myths, laws |
| foundation | seasonal, why-come-back |

**Status:** Not started

#### 3e. Service Cross-Links
All 3 service pages link to each other with pricing context.

| From | To | Context |
|------|----|---------|
| One-Time | TMCP | "Want ongoing protection? TMCP at $100/month" (already exists) |
| One-Time | Commercial | "Managing multiple properties? Commercial mole control" |
| TMCP | One-Time | "Not sure yet? Start with $450 one-time removal" |
| TMCP | Commercial | "Property manager? See commercial contracts" |
| Commercial | One-Time | "Residential? $450 one-time removal" |
| Commercial | TMCP | "Residential? $100/month year-round protection" |

**Status:** Not started

---

### Batch 4: Veteran Angle + FAQ Expansion
**Estimated:** 4 hours | **Dependencies:** Batch 2 (FAQ links to new blog posts) | **Can parallelize:** 4a and 4b are independent

#### 4a. Veteran Integration

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 4a.1 | Verify "Veteran-Owned" in TrustBar default metrics | `TrustBar.tsx` | Not started |
| 4a.2 | Add veteran trust line to service page heroes ("Veteran-Owned · Chemical-Free · Guaranteed") | 3 service pages | Not started |
| 4a.3 | Enhance Person schema — alumniOf US Army, dates, role | `schema.tsx` | Not started |
| 4a.4 | Enhance author card on blog posts — veteran icon, structured text for AI extraction | `blog/[slug]/page.tsx` | Not started |
| 4a.5 | Document 8 veteran directory registrations for Spencer (WDVA, VA.gov VetBiz, VeteranOwnedBusiness.com, VOBN, AVOSBA, NaVOBA, Bunker Labs, WEBS) | Outreach doc | Not started |

#### 4b. FAQ Page Expansion
Add 7 new Q&As to `pages-data.ts` faqBlocks. Each links to relevant blog post.

| # | Question | Answer Summary | Links To |
|---|----------|---------------|----------|
| 4b.1 | Will moles go away on their own? | No — territorial, stay as long as food exists | TMCP |
| 4b.2 | Do moles come back after removal? | Yes, 3-12 months typically | TMCP, why-come-back blog |
| 4b.3 | Are mole traps legal in Washington? | Yes, with I-713 restrictions | Laws blog |
| 4b.4 | Does castor oil really work for moles? | Not reliably — cite WSU Extension | Myths blog |
| 4b.5 | How do I know if I have moles or voles? | Mole mounds volcano-shaped; vole = surface runways | — |
| 4b.6 | Can moles damage my foundation? | Indirectly yes, soil displacement | Foundation blog |
| 4b.7 | Is mole poison safe around pets? | No — bromethalin toxic to dogs/cats | Pet safety blog |

**Status:** Not started

---

### Batch 5: Service Page Enhancement
**Estimated:** 2 hours | **Dependencies:** Batch 2 + 3b | **Can parallelize:** After batches 2 and 3b complete

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 5.1 | Add service cross-links (see 3e mapping above) | 3 service pages | Not started |
| 5.2 | Add "Learn More" blog evidence sections (see 3b mapping above) | 3 service pages | Not started |
| 5.3 | Verify GEO definition blocks in all service page heroes | 3 service pages | Not started |

---

## Post-Launch Month 1

### Batch 6: Blog Posts 5-8
**Estimated:** 6 hours

| # | Title | Slug | Volume | Status |
|---|-------|------|--------|--------|
| 6.1 | Does Castor Oil Work for Moles? The Evidence | `does-castor-oil-work-for-moles` | 3,120 | Not started |
| 6.2 | Spring Mole Activity in Washington: When to Act | `spring-mole-activity-washington` | 1,660 | Not started |
| 6.3 | How to Repair Your Lawn After Mole Damage | `lawn-repair-after-mole-damage` | 1,590 | Not started |
| 6.4 | HOA & Property Manager Guide to Mole Control | `hoa-property-manager-mole-control-guide` | 870 | Not started |

### Batch 7: City Page Enrichment
**Estimated:** 6 hours

| # | Task | Status |
|---|------|--------|
| 7.1 | Increase FAQs from 3 to 5-6 per city. Add universal: "How much does mole removal cost in {city}?" + "Are moles active year-round in {city}?" + 1 city-specific | Not started |
| 7.2 | Add `relatedBlogSlugs` field to CityData. Default 3 posts per city | Not started |
| 7.3 | Expand `localDetails` with seasonal activity sentence per city | Not started |

### Batch 8: New City Pages (14 cities)
**Estimated:** 5 hours

**Snohomish County (already served):**

| # | City | Pop. | Slug | Status |
|---|------|------|------|--------|
| 8.1 | Lynnwood | 41K | `lynnwood` | Not started |
| 8.2 | Edmonds | 42K | `edmonds` | Not started |
| 8.3 | Mountlake Terrace | 21K | `mountlake-terrace` | Not started |
| 8.4 | Mukilteo | 21K | `mukilteo` | Not started |
| 8.5 | Arlington | 20K | `arlington` | Not started |
| 8.6 | Monroe | 20K | `monroe` | Not started |

**King County:**

| # | City | Pop. | Slug | Status |
|---|------|------|------|--------|
| 8.7 | Shoreline | 57K | `shoreline` | Not started |
| 8.8 | Burien | 52K | `burien` | Not started |
| 8.9 | Bothell | 50K | `bothell` | Not started |
| 8.10 | Mercer Island | 25K | `mercer-island` | Not started |
| 8.11 | Kenmore | 23K | `kenmore` | Not started |
| 8.12 | Newcastle | 13K | `newcastle` | Not started |

**Pierce County:**

| # | City | Pop. | Slug | Status |
|---|------|------|------|--------|
| 8.13 | Gig Harbor | 12K | `gig-harbor` | Not started |
| 8.14 | Fife | 10K | `fife` | Not started |

### Batch 9: Service Comparison Section
**Estimated:** 2 hours

| # | Task | Status |
|---|------|--------|
| 9.1 | Create 3-column comparison component (One-Time vs TMCP vs Commercial) | Not started |
| 9.2 | Add to One-Time and TMCP pages | Not started |

---

## Post-Launch Month 2

### Batch 10: Blog Posts 9-12

| # | Title | Slug | Volume | Status |
|---|-------|------|--------|--------|
| 10.1 | Mole Damage to Irrigation Systems | `mole-damage-irrigation-systems` | 470 | Not started |
| 10.2 | Golf Course Mole Control Guide | `golf-course-mole-control` | 490 | Not started |
| 10.3 | Protecting Your Garden from Moles | `protecting-garden-from-moles` | 1,600 | Not started |
| 10.4 | When Should You Call a Mole Exterminator? | `when-to-call-mole-exterminator` | 850 | Not started |

### Batch 11: Remaining City Pages

| # | City | County | Slug | Status |
|---|------|--------|------|--------|
| 11.1 | Stanwood | Snohomish | `stanwood` | Not started |
| 11.2 | Milton | Pierce | `milton` | Not started |
| 11.3 | Pacific | Pierce | `pacific` | Not started |
| 11.4 | Edgewood | Pierce | `edgewood` | Not started |
| 11.5 | Steilacoom | Pierce | `steilacoom` | Not started |

### Batch 12: Blog Hub with Clusters

| # | Task | Status |
|---|------|--------|
| 12.1 | Add cluster-based navigation to blog index page (Mole Control Basics, DIY vs Pro, Cost & Value, Safety, Seasonal, Commercial) | Not started |
| 12.2 | Filter/group posts by cluster | Not started |

---

## Tracking

**Total new blog posts:** 12 (4 pre-launch + 4 month 1 + 4 month 2)
**Total new city pages:** 19 (14 month 1 + 5 month 2)
**Total new FAQs:** 7 on main FAQ page + ~66 on city pages (33 cities × 2 new each)
**Estimated keyword impact:** +180 new targets, +3,000-5,000 monthly organic visits, +30-50 monthly leads
**Internal links added:** ~100+ cross-links across blog, services, and city pages

---

*This roadmap is the execution plan. Work through batches in order. Roy adjusts in flow. Each batch gets committed and pushed when complete.*
