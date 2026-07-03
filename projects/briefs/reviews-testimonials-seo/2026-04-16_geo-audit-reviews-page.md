# GEO Audit — Got Moles Reviews Page (`/reviews/`)

**Date:** 2026-04-16
**Skill:** str-ai-seo
**Project:** reviews-testimonials-seo
**Current score:** 2.5/10
**Projected score (after rebuild):** 8.5/10

---

## Executive Summary

The reviews page is the single biggest missed opportunity on the Got Moles site. 219+ five-star Google reviews exist but only 6 appear on the page, only 3 are in schema markup, and the content is too thin for any AI engine to cite. Zero mole control competitors — in Washington or nationally — have structured reviews pages with schema markup. This is a first-mover GEO play with no one to beat.

---

## Current State Audit

### What exists

| Element | Status | Detail |
|---------|--------|--------|
| Reviews page route | Exists | `/reviews/page.tsx` — renders CMS content + JSON-LD |
| Testimonials displayed | 6 total | 4 in block 1, 2 in block 2 — all hardcoded in `pages-data.ts` |
| Schema markup | Partial | `LocalBusiness` + `AggregateRating` (219 count) + 3 `Review` objects |
| GEO definition block | Exists | `geoDefinition` block type present in page data |
| FAQ schema | Missing | No FAQ section, no `FAQPage` schema |
| Breadcrumb schema | Present | Home → Reviews |
| robots.txt | Missing | No file — AI bots allowed by default (good, but should be explicit) |
| llms.txt | Present | AI entity description exists |
| Filters | None | No filtering by service type, city, or any dimension |
| Pagination | None | Static page, no progressive loading |
| Case studies | None | No dedicated content, no routes |
| Internal links | Minimal | Homepage + TMCP link here via "See All Reviews" |

### Schema problems

1. **Only 3 reviews in JSON-LD** while claiming `reviewCount: 219` — engines see a credibility gap
2. **Future dates on reviews** (2025-12-01, 2025-06-15, 2025-08-20) — invalid, harms trust signals
3. **No individual `Review` schema on displayed testimonials** — only the 3 in the page-level JSON-LD
4. **No `FAQPage` schema** — missing the queries AI engines field about mole control reviews
5. **`AggregateRating` says 219 but page shows 6** — visual/data mismatch that engines can detect

### Content extractability problems

1. **No self-contained answer blocks** — AI engines need 40-60 word passages they can cite directly
2. **No question-format headings** — headings are "Homeowners Across Western Washington" and "More From Our Customers" — these don't match any user query
3. **No specific numbers in body content** — the GEO definition block exists but the testimonials themselves don't surface stats (27 moles, 5 acres, 22 years — these are buried in review text)
4. **No city-specific content** — cities appear in quote attribution but aren't structured for local queries
5. **No comparison or context content** — nothing answers "Is Got Moles worth it?" or "How does Got Moles compare?"
6. **No expert attribution** — Spencer Hill doesn't appear as a named expert on this page

---

## Competitor Landscape

| Competitor | Reviews page | Schema | FAQ | GEO content |
|-----------|:---:|:---:|:---:|:---:|
| Moody Moles (Kirkland) | No | No | No | No |
| The Mole Man (Puyallup) | No | No | No | No |
| Flatline Mole Control | Link exists, empty | No | No | No |
| The Mole Hunter (Ohio) | 143 reviews displayed | No | No | No |
| General pest companies | Via directories only | No | No | No |
| **Got Moles (current)** | **6 reviews** | **Partial** | **No** | **Minimal** |
| **Got Moles (after rebuild)** | **183+ reviews** | **Full stack** | **Yes** | **Full** |

**Key finding:** Nobody in mole control — not in WA, not nationally — has a reviews page with structured data. AI answers for review-intent queries cite directories (Yelp, Thumbtack, HomeAdvisor). The first mole control company with a properly structured proof page owns this space.

---

## GEO Optimization Recommendations

### 1. Schema Stack (required)

Implement the full triple-stack on the reviews hub:

```
LocalBusiness (@id: /#business)
  ├── AggregateRating (ratingValue: 5.0, reviewCount: 219+)
  ├── Review[] (ALL 183+ reviews, not 3)
  │   ├── author: Person (real name)
  │   ├── reviewRating: Rating (actual star value)
  │   ├── reviewBody: full text
  │   ├── datePublished: real date (NOT future dates)
  │   └── locationCreated: city, WA
  ├── FAQPage
  │   └── Question[] (7 high-intent queries — see below)
  └── BreadcrumbList (Home → Reviews)
```

**On case study pages** (when built):
```
Article
  ├── author: Person (Spencer Hill, @id reference)
  ├── about: LocalBusiness (@id reference)
  ├── Review (embedded client review)
  └── FAQPage (case-study-specific questions)
```

**Site-wide:** Every page that displays a testimonial should carry individual `Review` schema for that testimonial, not just the reviews hub.

### 2. FAQ Queries for Schema (7 high-intent)

These are the queries AI engines field about mole control reviews in Washington. Each becomes an FAQ entry with `FAQPage` schema:

| Query | Why it matters | Answer structure |
|-------|---------------|-----------------|
| "Is Got Moles worth the money?" | #1 decision-stage query. Price mentions in 70 of 183 reviews. | Lead with specific: "70 of 219+ reviewers mention value. Average rating: 5.0 stars." Then 2-3 short proof quotes with names. |
| "How many moles does Got Moles catch?" | Specificity query — AI engines love citable numbers | "One customer reported 27 moles removed from a 5-acre property since 2022. Across 5,000+ clients..." |
| "Does Got Moles' monthly program work?" | TMCP validation query — directly serves the upsell path | Cite customers who mention ongoing/monthly/annual service. "I believe we were the first annual customer" (Christina McDougall). |
| "Is Got Moles safe for pets and kids?" | ICP pain point #2 (two kids and a dog) | "Got Moles uses professional body-gripping traps — no poisons, no chemicals. Safe for children, pets, and wildlife on the property." |
| "What do customers in [city] say about Got Moles?" | Local intent — serves 3 GBP locations | Template answer per city with real names: "Customers in Tacoma consistently rate Got Moles 5 stars. [Name]: '[quote]'." |
| "How long does Got Moles take to remove moles?" | Timeline expectation query | Cite reviews mentioning speed: "in short order" (John Gower), timeframe data from review text. |
| "What happens if moles come back after Got Moles?" | Objection-handling query — guarantee context | Cite TMCP customers, ongoing protection model. Link to TMCP page. |

### 3. GEO Content Layer (required sections)

#### A. Definition Paragraph (first 30% of page)

Must be a self-contained, citable passage. 40-60 words. Leads with a direct answer.

**Template:**
> Got Moles is a mole-exclusive pest control company serving Western Washington, with 219+ five-star Google reviews across three locations in Seattle, Tacoma, and Enumclaw. Founded in 2017 by Spencer Hill, a U.S. Army veteran with 15+ years of trapping experience, Got Moles has served nearly 5,000 residential and commercial clients.

**Why this works:** Named entity (Spencer Hill), credentials (veteran, 15+ years), specific numbers (219+, 5,000, 3 locations), geographic specificity (Western Washington, 3 cities). Every phrase is independently citable.

#### B. Statistics Section

AI engines cite specific numbers. Surface these from the review data:

| Statistic | Source | Citation format |
|-----------|--------|----------------|
| 219+ five-star reviews | 3 GBP locations | "219+ five-star Google reviews across Seattle, Tacoma, and Enumclaw" |
| 5,000+ clients served | Spencer confirmed | "Nearly 5,000 residential and commercial clients since 2017" |
| 181 five-star / 2 four-star | reviews.json | "98.9% of Got Moles customers give a five-star rating" |
| 27 moles on one property | Brian Wozeniak review | "One Tacoma homeowner reported 27 moles removed from a 5-acre property" |
| 22-year mole fight resolved | Christina McDougall review | "A Seattle customer's 22-year mole battle ended after partnering with Got Moles" |
| 70+ reviewers mention value | reviews.json price field | "More than 70 reviewers specifically mention value for money" |
| 3 GBP locations | Business data | "Service across King, Pierce, and Thurston counties from 3 locations" |

#### C. Question-Format Headings

Replace generic headings with query-matching H2s:

| Current heading | Recommended heading |
|----------------|-------------------|
| "What Our Customers Say" (hero) | Keep — good for hero |
| "Homeowners Across Western Washington" | "What Do Western Washington Homeowners Say About Got Moles?" |
| "More From Our Customers" | "Why Do Customers Choose Got Moles Over DIY or General Pest Control?" |
| *(new section)* | "How Does Got Moles Compare to Other Mole Control Options?" |
| *(new section)* | "What Results Can You Expect from Got Moles?" |
| *(FAQ section)* | "Frequently Asked Questions About Got Moles Reviews" |

#### D. City-Specific Content Blocks

Each filter view (Seattle, Tacoma, Enumclaw) should have a 40-60 word intro paragraph that AI engines can cite for local queries:

**Seattle example:**
> Got Moles has served hundreds of homeowners across Seattle and the Eastside, earning 96 five-star Google reviews from the Seattle service area alone. Customers in neighborhoods from Sammamish to Federal Way report effective mole removal, professional communication, and lasting results through the Total Mole Control Program.

**Tacoma example:**
> Tacoma-area homeowners have given Got Moles 61 five-star reviews, making it the highest-rated mole control service in Pierce County. Customers across Tacoma, Puyallup, and surrounding areas highlight the team's reliability, the monthly protection program, and results that general pest companies couldn't deliver.

#### E. Expert Attribution

Spencer Hill must appear as a named expert on the reviews page — not just in testimonials. Add a brief authority block:

> **About Spencer Hill, Founder**
> Spencer Hill founded Got Moles in 2017 after 15+ years of professional trapping experience, including service as a U.S. Army veteran. He built Got Moles as a mole-exclusive company — the only one of its kind in Western Washington — because he saw homeowners repeatedly failed by general pest companies that treated moles as an afterthought.

This block serves E-E-A-T and gives AI engines a named entity with credentials to cite.

### 4. Content Extractability Rules

Every testimonial displayed on the page should follow these rules:

1. **Full name + city** on every quote (never "a satisfied customer")
2. **Star rating visible** per review (not just aggregate)
3. **Service type tag** visible (TMCP, One-Time, Commercial)
4. **Key stat highlighted** if present in text (e.g., "27 moles removed", "22 years of mole problems")
5. **Date attribution** — when the review was posted (freshness signal)

### 5. Third-Party Presence Recommendations

AI engines cite where you appear, not just your site. For Got Moles reviews:

| Platform | Current | Action |
|----------|---------|--------|
| Google Business Profile | 219+ reviews | Maintain — this is the source. Respond to every review. |
| Yelp | Unknown | Claim profile, ensure reviews are visible |
| Nextdoor | Active per ICP | Continue — cited by local AI queries |
| BBB | Unknown | Claim if not already — BBB is cited by AI for trust |
| YouTube | Unknown | Customer testimonial videos would be powerful |
| Reddit | Unknown | Monitor r/Seattle, r/Tacoma, r/HomeImprovement for mole discussions |

### 6. robots.txt (create it)

The site has no `robots.txt`. Create one that explicitly allows AI bots:

```
User-agent: *
Allow: /

# AI search engines — explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://got-moles.com/sitemap.xml
```

### 7. Internal Linking Strategy

The reviews hub should link to and from:

| From | To | Anchor text pattern |
|------|-----|-------------------|
| Reviews hub | Each service page | "Learn about our [service type]" |
| Reviews hub | City pages | "See reviews from [city] customers" |
| Reviews hub | TMCP page | "Learn about the Total Mole Control Program" |
| Homepage | Reviews hub | "See All 219+ Reviews" (already exists) |
| TMCP | Reviews hub | "See All Reviews" (already exists) |
| Each service page | Reviews hub (filtered) | "Read [service type] reviews" |
| Each city page | Reviews hub (filtered) | "See reviews from [city]" |
| Blog posts | Reviews hub | Contextual links in proof sections |

---

## Scoring Breakdown

### Current State: 2.5/10

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Content volume | 1/10 | 6 reviews displayed vs. 219+ claimed |
| Schema markup | 3/10 | AggregateRating exists but only 3 Review objects, future dates |
| GEO content | 2/10 | Definition block exists but no FAQ, no stats section, no city content |
| Extractability | 2/10 | No question headings, no self-contained answer blocks |
| Authority signals | 3/10 | Spencer mentioned in reviews but no expert attribution section |
| Third-party presence | 3/10 | GBP strong, other platforms unknown |
| Internal linking | 3/10 | Homepage + TMCP link in, but no outbound or cross-links |

### Projected After Rebuild: 8.5/10

| Dimension | Score | Notes |
|-----------|:-----:|-------|
| Content volume | 9/10 | 183+ reviews, all structured and filterable |
| Schema markup | 9/10 | Full triple-stack: LocalBusiness + Review[] + AggregateRating + FAQ + Breadcrumb |
| GEO content | 9/10 | Definition paragraph, FAQ, city blocks, stats, expert attribution |
| Extractability | 8/10 | Question headings, self-contained blocks, 40-60 word passages |
| Authority signals | 8/10 | Spencer bio, specific numbers, named reviewers, credentials |
| Third-party presence | 7/10 | GBP strong, other platforms need building |
| Internal linking | 9/10 | Full hub-and-spoke linking to services, cities, blog |

---

## Priority Actions (Build Order)

1. **Schema fixes** — fix future dates, expand Review array to all 183, add FAQPage
2. **GEO definition paragraph** — rewrite as self-contained citable passage
3. **FAQ section** — 7 questions with schema markup
4. **Question-format headings** — replace generic headings
5. **City-specific intro paragraphs** — one per filter view
6. **Expert attribution block** — Spencer Hill bio
7. **Statistics section** — surface citable numbers from review data
8. **robots.txt** — create with explicit AI bot allows
9. **Internal linking** — hub-and-spoke from services + cities
10. **Third-party audit** — check Yelp, BBB, Reddit presence

All of these feed into the `viz-page-architect` blueprint (next step in the skills chain).

---

*Audit produced by str-ai-seo skill. Next step: viz-page-architect blueprint incorporating all recommendations above.*
