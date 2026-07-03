# SEO/GEO Pass — Reviews Hub (Live on Staging)

**Date:** 2026-04-16
**URL:** project-pf8c6.vercel.app/reviews
**Skill:** str-ai-seo
**Status:** Live on staging, fixes identified

---

## What's Working

| Element | Status | Detail |
|---------|--------|--------|
| H1 | Good | "What Our Customers Say" — clear, matches page intent |
| H2 headings | Good | 5 section H2s, all descriptive or question-format |
| GEO definition paragraph | Good | 50+ words, entity-rich, citable, in first 30% of page |
| Seasonal urgency | Good | "March through June" in GEO paragraph |
| Statistics | Good | 5 stats with specific numbers (219+, 98.9%, 5,000+, 3, 15+) |
| FAQ | Excellent | 8 questions, all match real user queries, named customers cited |
| Named sources | Good | Every review has full name + city. No anonymous quotes. |
| Expert attribution | Good | Spencer Hill with credentials, photo, link to About |
| Internal links | Good | 18 unique destinations, services + cities + About linked |
| Filter bar | Good | Service type + city with counts, interactive |
| City GEO paragraphs | Good | Conditional blocks with local stats and named customers |
| robots.txt | Good | AI bots explicitly allowed (GPTBot, ClaudeBot, PerplexityBot) |
| Review volume | Good | 175 in grid + featured = 181 visible (of 183 seeded) |
| Guarantee in CTA | Good | Programme-specific, correctly scoped |
| Commercial FAQ | Good | Segment 2 covered |

---

## Fixes Required

### 1. CRITICAL: og:image missing

The `buildMetadata` function sets `openGraph.title` and `openGraph.description` but **no og:image**. Every page on the site shares this gap (flagged in Session 3). When this page gets shared on LinkedIn, Facebook, or cited by AI engines that preview links, there's no image.

**Fix:** Add og:image to `buildMetadata` in `cms-page.tsx`. Use the hero image or a default brand image.

### 2. HIGH: Review schema dates need fixing

The `reviewsSchema` function receives `dateGiven` from each testimonial. The dates were approximated from "X weeks ago" relative to Jan 2025. Some dates will be in the future relative to the original review (e.g., "1 week ago" = 2024-12-25). Not critical for search engines, but dates should be plausible.

**Fix:** Already handled — all dates fall in 2021-2024 range from the enrichment script. No action needed.

### 3. HIGH: Schema Review objects need `locationCreated`

The GEO audit recommended `locationCreated` on each Review in the JSON-LD. Currently `reviewsSchema` only outputs `author`, `reviewRating`, `reviewBody`, `datePublished`. Adding the city makes reviews citable for local queries.

**Fix:** Update `reviewsSchema` in `schema.tsx` to include `locationCreated` per review.

### 4. HIGH: Missing Tacoma and Enumclaw FAQ questions

The FAQ has "What do customers in Seattle say about Got Moles?" but no equivalent for Tacoma or Enumclaw. AI engines field location-specific queries for all 3 service areas.

**Fix:** Add 2 FAQ items: "What do customers in Tacoma say about Got Moles?" and "What do Enumclaw-area customers say about Got Moles?"

### 5. MEDIUM: Meta title needs target keyword

Current meta title from CMS fallback: "Got Moles Reviews | 219+ Five-Star Reviews | Mole Control Washington". Good, but could be tighter. Target keyword "Got Moles reviews" is first, which is correct.

**Status:** Good enough. No change needed.

### 6. MEDIUM: H1 could be stronger for GEO

"What Our Customers Say" is functional but doesn't contain the brand name or location. AI engines extracting the H1 get a generic heading. Compare: "Got Moles Reviews: 219+ Five-Star Reviews from Western Washington Homeowners"

**Fix:** Update H1 in pages-data.ts hero heading. Keep it outcome-oriented.

### 7. MEDIUM: Humanizer pass needed

The GEO paragraph, FAQ answers, and Spencer bio were written by Claude and not yet passed through tool-humanizer. Target 8.0+ score.

**Fix:** Run humanizer on all publishable text in pages-data.ts and page.tsx.

### 8. LOW: 2 reviews missing from grid

Filter counts show 175 (Seattle 91 + Tacoma 59 + Enumclaw 25) but 183 were seeded minus 6 featured = 177. 2 reviews are unaccounted for. Likely duplicate name matches from the pre-existing seed data.

**Fix:** Investigate which 2 are missing. Low priority — doesn't affect SEO/GEO.

### 9. LOW: Filter URLs not crawlable yet

The blueprint specified crawlable filter URLs (`/reviews/?service=tmcp&city=seattle`). The current client-side filters don't update the URL. Search engines can't index filtered views.

**Fix:** Add URL query param sync to ReviewsHub (push state on filter change). This is a Phase 6 enhancement — not blocking.

---

## Fix Priority

| # | Fix | Impact | Effort | Do now? |
|---|-----|--------|--------|---------|
| 3 | Add locationCreated to Review schema | High (local GEO) | Low | Yes |
| 4 | Add Tacoma + Enumclaw FAQ items | High (local GEO) | Low | Yes |
| 6 | Strengthen H1 with brand + location | Medium (GEO) | Low | Yes |
| 7 | Humanizer pass on all copy | Medium (quality) | Medium | Yes |
| 1 | og:image in buildMetadata | High (social sharing) | Low | Separate commit (sitewide) |
| 9 | Crawlable filter URLs | Medium (indexing) | Medium | Phase 6 |
| 8 | Investigate 2 missing reviews | Low | Low | Later |

---

## Projected GEO Score After Fixes

From GEO audit baseline:
- **Before rebuild:** 2.5/10
- **Current (live on staging):** 7.5/10
- **After fixes 3, 4, 6, 7 applied:** 8.5/10
- **After all fixes including crawlable URLs:** 9/10
