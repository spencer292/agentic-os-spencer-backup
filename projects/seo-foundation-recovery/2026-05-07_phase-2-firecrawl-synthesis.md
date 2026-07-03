---
phase: 2
date: 2026-05-07
data_source: Firecrawl /v1/search + /v1/scrape (Google SERP, hl=en)
keywords_pulled: 31
status: complete
related:
  - 2026-05-07_h1-h2-review.md
  - ../str-ai-seo-local/firecrawl-serp-2026-05-07.json
  - ../str-ai-seo-local/gsc-query-by-page-2026-05-07.json
---

# Phase 2 — Firecrawl SERP Synthesis

Top 10 organic data pulled for 31 priority keywords across 4 buckets:
homepage commercial head terms, service-specific commercial, cost queries,
biology cluster, mole-control informational, top city pages.

## Headline finding

**We win biology. We lose money.**

| Cluster | Got Moles in top 10 | Position when present |
|---|---|---|
| Biology (informational) | 5 / 8 | 1, 1, 2, 3, 7 |
| Commercial head terms | 2 / 6 | 4, 5 (no top 3) |
| Service-specific commercial | 0 / 4 | — |
| Cost queries | 1 / 3 | pos 3 |
| City pages (top 4) | 3 / 4 | 2, 2, 4 |
| **Total** | **11 / 31** | — |

Biology pages are pulling the rankings; the money pages aren't.
This is the post-launch revenue gap in one number.

## Top commercial gaps (NOT in top 10)

These are the queries that drive booked jobs. Competitors are eating us
on every one of them:

| Query | Top 3 |
|---|---|
| mole control near me | (Map Pack-dominated; need GBP push not on-page) |
| lawn mole control | (informational SERP — long-tail content opportunity) |
| professional mole control | molemasters.biz, mole-patrol.com, yelp |
| year round mole control | (long-tail) |
| professional mole removal | (mostly directories) |
| mole exterminator near me | molemasters.biz, mole-patrol.com, yelp |
| commercial mole control | (B2B SERP) |

## Competitors actually ranking (Western Washington)

Across the 11 commercial queries:

| Competitor | Times in top 5 | Notes |
|---|---|---|
| molemasters.biz | 6 | Direct competitor — pest-only, focused. Worth a competitor scan. |
| mole-patrol.com | 5 | Direct competitor — Puget Sound focus |
| seattlewildlifecontrol.com | 3 | Wildlife-generalist. Has a /mole-control/ page. |
| yelp.com (aggregator) | 4 | Map Pack tax — we need to be on page 1 of Yelp's "Best Of" lists |
| nextdoor.com | 1 | Hyperlocal social — citation surface for AI Overviews |

**Action:** run a competitor on-page scan of molemasters.biz + mole-patrol.com
homepage and key money pages. What H1/H2 patterns do they use? Schema?
Review density? This drops into Phase 4 of the master review.

## Where we win — and what it tells us

Position 1 for "how many eyes do moles have", "how deep do moles dig",
"voles vs moles" lookalikes — biology cluster is doing exactly what
GSC predicted: high impressions, low clicks (AI Overview eating clicks).

Two truths at once:
1. The biology pages are well-optimised for ranking signals. Replicate
   the pattern (H1 keyword targeting, schema, internal linking) on the
   commercial pages.
2. The biology cluster's traffic value is capped by AIO. The fix isn't
   ranking better — it's a BLUF (Bottom Line Up Front) format under each
   H2 so AI Overview cites Got Moles when it answers the query, not just
   rolls up an unattributed answer.

## City page split

| Query | Got Moles position | Top 3 |
|---|---|---|
| mole control bellevue | NOT in top 10 | molemasters, mole-patrol, yelp |
| mole control sammamish | 4 | molemasters, seattlewildlifecontrol, yelp |
| mole control tacoma | 2 | molemasters, **got-moles**, yelp |
| mole control kirkland | 2 | molemasters, **got-moles**, mole-patrol |

Bellevue is the gap — should be top 3 given it's the biggest market in the
service area. Likely an H1/H2/internal-link issue (and maybe GBP proximity
for the Map Pack). Flag for the Phase A implementation.

## What Phase 2 did NOT capture

- **PAA (People Also Ask)** — Firecrawl scrape returned 0 PAA candidates
  across 31 queries. Google's PAA module is JS-rendered post-load and
  Firecrawl's headless browser didn't fire the trigger. Phase 3 (SerpAPI)
  uses Google's actual SERP API and returns PAA + Related Searches as
  structured data — that's the right tool for this gap.
- **AI Overview presence** — same JS-render issue. SerpAPI's
  `google_ai_overview` parameter solves this.
- **Map Pack rankings** — Firecrawl strips local results; SerpAPI returns
  them. Map Pack is a major revenue driver for "near me" queries and we
  have zero data on it right now.

## Phase 3 brief (SerpAPI)

When ready:
- Pull PAA + Related Searches for the 31 keywords (gives us H2 candidates
  per page based on what real users ask)
- Pull AI Overview citations to see who Google AI cites for our targets
- Pull Map Pack rankings for "near me" + city queries (3-pack visibility
  per location)
- Cost: SerpAPI ~$50/mo for 5,000 queries (5x our current need —
  budget-friendly)

## Immediate actions feeding the H1/H2 master review

Adding these to the Section 7+8 of `2026-05-07_h1-h2-review.md`:

1. Bellevue city page — diagnose why we're out of top 10. Compare H1/H2
   against Sammamish (pos 4), Tacoma (pos 2), Kirkland (pos 2).
2. Commercial head-term pages (homepage, /year-round-mole-control/,
   /one-time-removal/, /commercial/) — H1/H2 must include the exact
   commercial query phrase the page is targeting. Currently the homepage
   H1 is brand-led, not query-led.
3. Biology cluster pages — add BLUF block under each H2 for AIO citation
   capture.
4. molemasters.biz + mole-patrol.com competitor scan — what are they
   doing on-page that we're not?
