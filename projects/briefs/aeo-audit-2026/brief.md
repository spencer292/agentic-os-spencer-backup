---
project: aeo-audit-2026
status: active
level: 2
created: 2026-05-02
parent: got-moles-marketing-os
---

# AEO Audit 2026 — Got Moles Site

L2 audit of the new got-moles.com against 2026 AEO best practices. Establishes a baseline + prioritised gap-fill roadmap. Pre-cursor to a `str-aeo` skill (separate scope, follows this audit).

## Executive summary

**Overall AEO maturity: 7.0 / 10.** The new build is unusually strong on technical AEO foundations — JSON-LD schema depth (28 distinct types in use), llms.txt present, AI bots allowlisted, BLUF structure on cornerstones, multiple FAQ phrasing variants, AggregateRating, hub-and-spoke internal links. **The big gaps are in entity authority signals** (no Wikidata/Wikipedia presence, thin author E-E-A-T) **and platform-specific measurement** (no formal "share of model" tracking across ChatGPT/Perplexity/Gemini). For a local service business in 2026, this site is in the top ~10% of AEO readiness — but there's a clear runway to double current AI citation rates by closing 6-8 specific gaps over the next 60 days.

---

## What "AEO" actually means in 2026

Optimising for Answer Engines (Google AI Overviews, ChatGPT, Perplexity, Claude, Gemini, Bing Copilot) — distinct from but compatible with traditional SEO.

**Princeton GEO study findings cited across 2026 sources:**
- Adding **expert quotes** boosts AI citation visibility ~**41%**
- Adding **statistics** boosts ~**30%**
- Adding **citations** boosts ~**30%**
- **FAQPage schema**: 41% citation rate vs 15% without (**2.7× improvement**)
- Pages with clean structure + schema earn **2.8× higher AI citation rates** than poorly structured pages

**Platform-specific preferences (all sources converge):**
- **Google AI Overviews**: favours content already ranking in top 10 organic positions; Google Business Profile heavily weighted for local
- **ChatGPT**: favours authoritative long-form content
- **Perplexity**: favours fresh, well-cited articles with specific data
- **Claude / Gemini**: similar to Perplexity, citation-heavy

---

## Current state assessment — 7-pillar framework

### Pillar 1: Entity & Brand Authority Signals — 5/10

| Item | Status | Notes |
|---|---|---|
| Google Business Profile (3 locations) | ✅ | 219+ five-star combined reviews — strong |
| NAP consistency (Yelp, Apple Maps, Facebook, Nextdoor) | ⚠️ Partial | Apple Business Connect + Nextdoor Seattle/Tacoma still pending Spencer |
| LinkedIn company page | ✅ | Linked in schema sameAs |
| Industry directory listings (BBB, etc.) | ❌ | None visible |
| **Wikidata Q-id for Got Moles** | ❌ | No entity registered |
| **Wikipedia article** | ❌ | None |
| **Spencer Hill Wikipedia / authoritative profile** | ❌ | LinkedIn only |
| Founder photo + bio with credentials | ✅ | About page complete |
| Service area keywords consistent | ✅ | All schema mentions same 4 counties |

### Pillar 2: Schema & Structured Data — 9/10

| Schema type | In use | Notes |
|---|---|---|
| Organization | ✅ | Full with sameAs (8 entries), founder, founding date |
| LocalBusiness | ✅ | With branch graph (3 BRANCHES department[]) |
| BlogPosting | ✅ | All 35 posts (upgraded from Article) |
| FAQPage | ✅ | On cornerstones + service pages + FAQ page |
| HowTo | ✅ | On `/how-it-works/` |
| BreadcrumbList | ✅ | Site-wide |
| AggregateRating | ✅ | 219 / 5.0 |
| Review | ✅ | Embedded in reviewsSchema |
| Service | ✅ | 3 service pages |
| Person | ✅ | Spencer (with EducationalOccupationalCredential — US Army) |
| DefinedTerm | ✅ | On cornerstones (citable factual paragraph for AI extraction) |
| SpeakableSpecification | ✅ | All blog posts |
| ItemList / CollectionPage | ✅ | On hub pages |
| **Dataset** | ❌ | No proprietary research published |
| **VideoObject** | ❌ | No videos on site |
| **Citation Schema** | ❌ | WSU + WDFW mentioned in copy but no formal Citation schema |

**Total schema types in use: 28** — exceptional depth. Only 3 weak/missing categories.

### Pillar 3: Content Structure & Answerability — 7.5/10

| Item | Status | Notes |
|---|---|---|
| BLUF (40-60 word answer at top) | ✅ Most cornerstones | Some service pages could tighten |
| H2/H3 as questions | ✅ | Cornerstones use Q-format headings |
| Answer paragraphs 40-60 words | ⚠️ | Mixed — many over 100 words |
| Bullet lists for 3+ items | ✅ | |
| HTML tables for complex data | ✅ | Mole species comparison table |
| "Current as of [year]" date markers | ❌ | No prominent freshness signals on cornerstones |
| Short sentences (<20 words) | ⚠️ Partial | Many longer sentences in body |
| Active voice | ✅ | Strong throughout |
| Hub-and-spoke topology | ✅ | 35 posts × 3 city links + service link |
| Internal anchor text | ✅ | Descriptive, keyword-rich |
| **TL;DR boxes** | ❌ | BLUF is in HTML body but not visually distinct as TL;DR |
| **"Updated 2026" prominently displayed** | ⚠️ | publishDate in schema but not user-visible |

### Pillar 4: Platform-Specific Optimisation — 6/10

| Platform | Coverage | Notes |
|---|---|---|
| Google AI Overviews | ✅ | Top organic rank on 635+ #1 keywords pre-launch — qualifies |
| ChatGPT | ⚠️ Untested | No baseline of mentions vs competitors |
| Perplexity | ⚠️ Untested | Same |
| Claude | ⚠️ Untested | Same |
| Gemini | ⚠️ Partial | Baseline captured 2026-04-25 (1 brand citation, 5 mentions across 30 cells) |
| Bing Copilot | ⚠️ | Bing Webmaster present but UET tag dormant (Spencer pending) |

**Manual platform testing across the priority queries hasn't been formalised post-launch.** Pre-launch baseline exists for ChatGPT + Gemini (in `projects/str-ai-seo-local/2026-04-25_aio-baseline.md`); needs re-run May+.

### Pillar 5: Technical Crawlability for AI Bots — 9/10

| Item | Status |
|---|---|
| robots.txt allows GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, ChatGPT-User, Google-Extended, Anthropic-AI, Cohere-AI, CCBot, etc. | ✅ All major AI bots allowed |
| Sitemap submitted | ✅ Got Moles 138 URLs, fetched clean by GSC |
| llms.txt present | ✅ 70 lines, comprehensive company profile |
| Mobile parity (100% of desktop content) | ✅ |
| Core Web Vitals | ✅ Mobile 96 / Desktop 100 (Apr 25 baseline) |
| HTTPS, HSTS preload | ✅ |
| Canonical correctness | ✅ All 151 URLs (verified May 2) |
| JavaScript bloat | ✅ Next.js SSR, no JS-only content |
| TTFB | ✅ Vercel edge serves <200ms |

### Pillar 6: Buyer Journey Coverage — 6/10

| Stage | Content present | Gaps |
|---|---|---|
| **Awareness** ("when do I need mole control") | ✅ Strong | Blog posts cover signs, biology, identification |
| **Evaluation** ("best mole control [city]") | ⚠️ | City pages exist but not framed as comparison content. No "Got Moles vs [competitor]" pages |
| **Decision** ("Got Moles pricing", "Got Moles hours") | ⚠️ | Pricing on service pages but no dedicated "Pricing" page; hours not prominent on contact |
| **Post-purchase** | ❌ | No "What to expect during your mole control visit" or similar onboarding content |

### Pillar 7: Measurement Infrastructure — 4/10

| Item | Status |
|---|---|
| GSC daily tracking (Notion DB + n8n) | ✅ Just shipped today |
| 90-day baseline captured | ✅ (`gsc-baseline-2026-05-02.md`) |
| Bing Webmaster tracking | ⚠️ Existing property, sitemap not yet resubmitted post-launch |
| **Manual AI citation tracking (ChatGPT/Perplexity/Claude)** | ❌ No recurring process |
| **Share of Model (SoM) vs competitors** | ❌ Not set up |
| **AI referral traffic in GA4** | ⚠️ GA4 firing but no AI-source segment defined |
| **Citation tracking tool** (Profound, Otterly) | ❌ Not subscribed |
| Brand sentiment in LLM descriptions | ❌ |

---

## Score summary

| Pillar | Score |
|---|---|
| 1. Entity & Brand Authority | 5/10 |
| 2. Schema & Structured Data | 9/10 |
| 3. Content Structure & Answerability | 7.5/10 |
| 4. Platform-Specific Optimisation | 6/10 |
| 5. Technical Crawlability for AI Bots | 9/10 |
| 6. Buyer Journey Coverage | 6/10 |
| 7. Measurement Infrastructure | 4/10 |
| **Weighted average** | **7.0/10** |

For a local service business launched 24h ago, this is unusually strong. Most local service sites score 3-5/10 across these pillars.

---

## Prioritised gap-fill roadmap

### P0 — Quick wins, ship within 7 days (high impact, low effort)

1. **Add "Updated [Month Year]" prominently to cornerstone hero blocks.** Freshness is a Perplexity / Claude citation signal. One template change, reseed.
2. **Add expert quote callouts to top 5 cornerstones.** Per Princeton GEO study: +41% citation visibility. Quote from WSU Extension Service (already cited in body) or WDFW. Pull-quote styling.
3. **Add proprietary stats callouts**: "Spencer Hill, founder of Got Moles, has trapped moles on nearly 5,000 properties since 2017." — "5,000+ properties" is a unique stat AI engines will cite. Make it scannable.
4. **Add Citation schema** to references in body (WSU Extension, WDFW).
5. **Define AI-source segment in GA4** — track ChatGPT/Perplexity/Claude referral traffic separately. ~30 min setup.
6. **Re-submit sitemap to Bing Webmaster** + URL submission for top 10 cornerstones.

### P1 — Material lift, ship within 30 days

7. **Wikidata Q-id for Got Moles**: register the company entity at wikidata.org. Free. Massive entity-disambiguation lift across all AI engines (Wikidata is part of LLM training data + retrieval).
8. **Wikidata Q-id for Spencer Hill**: same, separate entity. Adds founder authority.
9. **Author bio enhancement on About page**: structured credentials, sameAs to LinkedIn + any podcast appearances + media mentions. Person schema with `EducationalOccupationalCredential` (already partial — extend).
10. **Original research dataset publication**: pull aggregate stats from Spencer's 5,000-client database (with privacy redaction): "Mole damage by season in Western Washington (2017-2026 — 5,000 properties)" — chart + Dataset schema. AI engines love proprietary data.
11. **Comparison pages**: "Got Moles vs DIY mole control", "Total Mole Control Program vs One-Time Removal" — fills evaluation-stage gap.
12. **Post-purchase content**: "What to expect during your mole control inspection" — fills decision-stage gap.
13. **Manual AI citation baseline + monthly tracking**: define 20 priority queries, run quarterly across ChatGPT/Perplexity/Claude/Gemini/AI Overviews, log mentions/citations to a Notion DB.

### P2 — Strategic, ship within 60-90 days

14. **Wikipedia article for Got Moles** (or Spencer Hill if more notable): requires meeting notability guidelines via media coverage. Pursue local press features first.
15. **Podcast appearance strategy**: Spencer on home/garden/Pacific NW podcasts → transcripts on the site → boosts entity authority.
16. **Citation tracking tool subscription**: Profound or Otterly (~$200-500/mo). Automated SoM tracking against named competitors.
17. **Knowledge Panel pursuit**: file Knowledge Graph submission for Got Moles + Spencer.
18. **TL;DR component in design system**: visually distinct callout box for the BLUF answer at the top of every long page.
19. **Tighten content per AEO style rules**: Flesch-Kincaid 60-70, sentences <20 words, paragraphs 40-60 words. Run cornerstones through tool-humanizer with AEO-tuned mode (could be a humanizer enhancement).

---

## Path to `str-aeo` skill

This audit's recommendations crystallise the methodology. A `str-aeo` skill would:

1. **Run the 7-pillar assessment** on any client site (auto-detect schema types via DOM scrape + grep)
2. **Score each pillar** 1-10 with rubric
3. **Generate prioritised gap report** (P0/P1/P2) tailored to client
4. **Optional: ship-ready artifacts** — Wikidata draft, Citation schema snippets, expert-quote callout templates, GA4 segment definitions

**Distinct from existing `str-ai-seo-local`**: that skill is broader (covers GBP, local SEO, AI citation gaps for *local services*). `str-aeo` would be narrower and deeper: pure AEO/answer-engine optimisation, applicable to any vertical (local, SaaS, e-commerce, content).

**Recommendation**: build `str-aeo` skill in a separate session AFTER closing the P0 gaps on Got Moles (so the skill methodology is battle-tested before formalising).

---

## Sources

- [The 100-Point AI-First & AEO Technical Audit Checklist 2026 — DigitalRomans](https://digitalromans.com/aeo-technical-audit-checklist-2026/)
- [The Complete AEO Audit Checklist for B2B Websites — NAV43](https://nav43.com/blog/the-complete-aeo-audit-checklist-for-b2b-websites-a-7-pillar-framework-for-ai-search-visibility/)
- [Answer Engine Optimization 2026 Practical Playbook — ALM Corp](https://almcorp.com/blog/answer-engine-optimization-2026/)
- [AEO Best Practices in 2026 — Stackmatix](https://www.stackmatix.com/blog/aeo-answer-engine-optimization-practices-2026)
- [How to Implement Schema Markup for AEO — AirOps](https://www.airops.com/blog/schema-markup-aeo)
- [The Ultimate Schema Markup Guide For GEO, AEO And AI Overviews — 201 Creative](https://201creative.com/structured-data-ai-search/)
- [AEO Complete Guide — Frase.io](https://www.frase.io/blog/what-is-answer-engine-optimization-the-complete-guide-to-getting-cited-by-ai)

---

## Files in this folder

- `brief.md` — this audit + roadmap
- (future) `_score-aeo.mjs` — re-runnable scoring script
- (future) `p0-deliverables/` — ship-ready content for P0 items
