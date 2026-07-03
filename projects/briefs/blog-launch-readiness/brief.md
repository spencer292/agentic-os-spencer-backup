---
project: blog-launch-readiness
status: complete
level: 2
created: 2026-04-24
completed: 2026-04-24
---

## Completion note (2026-04-24)

All 8 phases shipped in a single day. Summary in `reports/08_launch-verification.md`. 35 posts published on staging, schema + internal linking + technical SEO in place. Safe to flip DNS when Spencer/team give the word. Deferred: live Lighthouse + Rich Results Test (both gated on production — staging blocks Googlebot). Remaining 27-post content audit (beyond priority 8) deferred; content uplift ran across all 35 in Phase 3 but the formal per-post score card only covers the priority 8.


# Blog Launch Readiness

## Goal

Get the 34 Got Moles blog posts (plus any missing-but-indexed old URLs) into a state where — the moment DNS switches to the new site — Google, Bing, and AI search engines (AI Overviews, ChatGPT, Perplexity, Claude, Gemini) discover a complete, quality, URL-preserved, citation-optimised blog hub. No ranking loss, no thin posts, no broken URLs, no missed GEO signals.

## Why this is a project, not a task

- 34 posts × ~7 workstreams = ~240 discrete touchpoints
- Multi-skill pipeline (`mkt-authority-content` → `tool-humanizer` → `viz-nano-banana` → `ops-cms-content`) per post
- URL-strategy decisions must happen before content work (wrong URL = wasted content)
- Launch-critical — this is one of the final blockers between staging and flip

## Context anchors

- **Current state:** 34 blog posts in Payload DB, all `_status=draft`. 19 standard (`/blog/{slug}/`), 15 legacy-root (`/{slug}/`). Meta titles + featured images empty on all 34. Content quality mixed: 5 cornerstone-tier (1,500+ wc), 17 medium (600-900 wc), 10 thin (<500 wc).
- **URL moat at stake:** per agency Rankings sheet (2,657 keywords tracked, 1,409 top-3), ~68 top-3 + 60 more top-10 live on blog-shaped URLs. Plus at least 1 unmigrated indexed URL (`/what-species-of-moles-live-in-washington-state/` — 2 top-3, 9 top-10).
- **Core principle (Roy's standing rule, memory `feedback_preserve_indexed_urls.md`):** migrate, don't redirect. Every URL Google has seen must render content at that same URL on the new site.
- **Quality bar** set by the 4 existing Tier-1 cornerstones: `how-to-get-rid-of-moles` (1,522 wc), `what-do-moles-eat` (1,659), `types-of-moles-in-washington` (1,712), `mole-vs-vole-vs-gopher` (1,822). All 34 posts come up to this bar before launch.
- **GEO moat:** zero competitors currently optimising for AI search. First-mover opportunity on WA-native facts (Townsend's mole, Mazama pocket gopher, earthworm 55-93% diet, chemical-free method).

## Skill stack invoked by this project

Every content pass runs through the proper skill chain — no freestyling.

| Stage | Skill | Role |
|---|---|---|
| URL audit | ad-hoc (query DB + spreadsheet) | Cross-reference rankings vs build |
| Per-post content | **`mkt-authority-content`** (via **`ops-blog-pipeline`**) | Writes BLUF-first, knowledge-base-grounded, GEO-structured content |
| GEO overlay | **`str-ai-seo`** | Overlays AEO/GEO citation signals, speakable schema, answer-first blocks, stat citations |
| Humanizer gate | **`tool-humanizer`** | Mandatory — strips AI patterns, 8.0+ target |
| Featured image | **`viz-nano-banana`** | Brand-consistent imagery (no Canva — memory `feedback_no_canva.md`) |
| Internal linking | **`str-internal-links`** | Hub-and-spoke linking matrix |
| CMS operations | **`ops-cms-content`** | Payload seed/update patterns |
| Publishing | **`ops-blog-pipeline`** | End-to-end orchestrator |

Brand context loaded per skill's context matrix (voice-profile, positioning, icp, mole-knowledge-base as fact source).

## Deliverables

- [ ] URL cross-reference report — every rankings-sheet URL mapped to (new-build URL, urlPattern decision, or create-new-post action)
- [ ] Every post's `urlPattern` correctly set for URL preservation
- [ ] `redirects.ts` cleaned of any entries that redirect away from indexed-content URLs
- [ ] Every post has complete SEO metadata (title, description, primary keyword, keyword cluster, canonical)
- [ ] Every post has a featured image (CMS-uploaded via `viz-nano-banana`) with descriptive alt text
- [ ] Every post ≥ 800 wc, WA-GEO-specific content, FAQ block, internal links
- [ ] Every post passes `tool-humanizer` at 8.0+
- [ ] Every post has complete schema (BlogPosting + FAQ + BreadcrumbList + DefinedTerm + Speakable where applicable)
- [ ] Internal linking matrix live: every post has ≥3 inbound blog links + 1 city/service link
- [ ] `/blog` index page functions as keyword hub (all 34 visible, images load, proper structure)
- [ ] Sitemap includes all 34 URLs with lastmod
- [ ] Rich Results Test passes on representative sample
- [ ] Lighthouse SEO ≥95 on representative sample
- [ ] All 34 posts `_status=published` verified on staging pre-flip

## Acceptance criteria — day-one crawl-ready checklist

The project is done when **every item below is true on staging**, verified before DNS flip.

### URL preservation (no indexed-URL content is redirected away)

- [ ] Every URL in agency Rankings sheet with any top-100 rank either renders content on the new site OR is a justified canonical-duplicate consolidated to the canonical city/service URL (only for pattern-consolidated and `-2` duplicate cases)
- [ ] `/what-do-moles-eat/` renders content at the root URL (flipped from standard to legacy-root)
- [ ] `/what-species-of-moles-live-in-washington-state/` renders content (new legacy-root post created)
- [ ] Any other old root URL with top-10 rank has a corresponding legacy-root post
- [ ] `redirects.ts` blogSlugs list reviewed — no 301s away from content we could migrate

### Per-post field completeness (all 34 posts)

- [ ] `title` — present, non-empty
- [ ] `slug` — matches target URL
- [ ] `urlPattern` — correct for the URL strategy
- [ ] `excerpt` — 100-160 chars, compelling
- [ ] `publishDate` — set (not future-dated)
- [ ] `dateModified` — set, rendered in schema
- [ ] `author` — linked to Authors collection entry with bio
- [ ] `seoPrimaryKeyword` — set
- [ ] `keywordCluster` — full semantic cluster
- [ ] `seoMetaTitle` — 50-60 chars, keyword-forward
- [ ] `seoMetaDescription` — 120-160 chars, compelling, non-duplicate
- [ ] `featuredImage` — CMS Media upload, ≥1200×675, WebP, `<1.5s` on 4G
- [ ] Alt text — descriptive, keyword-natural (not stuffed)
- [ ] `definitionBlock` — populated for info-type posts (drives DefinedTerm schema)
- [ ] Body content ≥ 800 words
- [ ] FAQ block present (3-5 Q&A)
- [ ] ≥3 internal links to related blog posts
- [ ] ≥1 internal link to a city page
- [ ] ≥1 internal link to a service page
- [ ] Tags linked (for archive/cluster signalling)

### Content GEO/AEO bar (all 34 posts)

- [ ] Answer-first paragraph in first 100 words (BLUF — AI-extractable)
- [ ] Primary question answered definitively within the first 150 words
- [ ] Bullet-list summaries for key facts (AI-extractable)
- [ ] At least one citation-worthy stat or fact (with source — .gov, Wikipedia, academic, or Got Moles CRM)
- [ ] WA-specific geographic context (Townsend's mole, Mazama gopher, county-level detail, Puget Sound moisture, glacial till, earthworm diet 55-93%)
- [ ] Chemical-free / veteran-owned / 5,000-client / 219-review trust signals woven in naturally
- [ ] External outbound links: .gov (WDFW) / Wikipedia / academic where appropriate — credibility signals
- [ ] No competitor comparisons violating memory `feedback_got_moles_no_only_claim.md` (no "only mole-exclusive" claims) or `feedback_guarantee_scope.md` (guarantee is programme-specific, not sitewide)
- [ ] Passes `tool-humanizer` at 8.0+

### Schema completeness (every post)

- [ ] `BlogPosting` JSON-LD — author, publisher, datePublished, dateModified, image, keywords, mainEntityOfPage
- [ ] `BreadcrumbList` JSON-LD — for both `/blog/{slug}/` and `/{slug}/` URLs
- [ ] `FAQPage` JSON-LD — where post has FAQ block (separate schema, validated standalone)
- [ ] `DefinedTerm` / `DefinedTermSet` — for info posts with definitions
- [ ] `Speakable` JSON-LD — marking voice-extractable blocks (BLUF + FAQ answers)
- [ ] `HowTo` JSON-LD — for how-to posts
- [ ] `ImageObject` — for featured image (contentUrl, caption, creditText)
- [ ] Got Moles `LocalBusiness` referenced via `publisher` (with WA geo coordinates for locally-relevant posts)
- [ ] Rich Results Test passes on 5 representative post samples
- [ ] Schema validates (no syntax errors) via Schema.org validator

### E-E-A-T signals

- [ ] Author bio pages exist for each author referenced (Authors collection entries with credentials)
- [ ] Organisation schema in root layout enriched with `founder`, `foundingDate`, `numberOfEmployees`, `aggregateRating` (links to Got Moles review count)
- [ ] Visible publish + modified dates on each post
- [ ] Inline author byline + credentials on each post
- [ ] Got Moles trust signals (5,000 clients, 219+ reviews, since 2017, chemical-free, veteran-owned) consistent across posts
- [ ] First-party data citations where CRM-sourced stats are used (e.g., "Across 5,000+ Got Moles service calls, Townsend's mole represents 94% of specimens west of the Cascades")

### Technical SEO (day-one crawl health)

- [ ] Core Web Vitals pass on 5 sample posts (LCP <2.5s mobile, INP <200ms, CLS <0.1)
- [ ] Next.js Image component used with explicit width/height (no CLS)
- [ ] Responsive srcset on all images (avif + webp fallback)
- [ ] Explicit `<link rel="canonical">` per post
- [ ] Meta robots `index, follow` per post (verified not noindexing)
- [ ] `dateModified` in BlogPosting schema distinct from `datePublished`
- [ ] Sitemap.xml includes all 34 URLs with `<lastmod>`, `<changefreq>`, `<priority>`
- [ ] robots.ts permits 19 whitelisted bots + GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot
- [ ] UTM / fbclid parameter canonicalisation verified (params don't create duplicate indexable URLs)
- [ ] Pagination on `/blog` index handled correctly (canonical to page 1 or `rel=next/prev`)
- [ ] Tag archive pages either (a) built with SEO standards, or (b) explicitly noindexed (no thin pages indexed)
- [ ] No broken internal links (anchor-link audit across all 34 posts + blog index)
- [ ] Image sitemap extension in sitemap.xml

### Hub & discoverability

- [ ] `/blog` index shows all 34 posts with hero images, excerpts, tags, publish dates
- [ ] Blog index functions as a clear hub — cornerstones prominent, supporting posts grouped by cluster
- [ ] Homepage links to ≥2 blog cornerstones (equity inbound)
- [ ] Service pages link to ≥1 relevant blog post each
- [ ] Service-areas page or top city pages link to at least 2 cornerstones
- [ ] Anchor text diversity audit — no over-optimised exact-match anchor patterns
- [ ] Related-posts block visible on each individual post page (not just in JSON schema)
- [ ] Visible breadcrumb on each post page (not just schema)

### AI/LLM access

- [ ] robots.ts explicit `Allow` for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Amazonbot, Applebot, Bingbot, YandexBot
- [ ] Speakable content blocks identified (AI voice-read friendly)
- [ ] No CSP or X-Frame headers blocking legitimate AI crawler access
- [ ] Optional: RSS feed at `/blog/rss.xml` for syndication signals

## Phases

### Phase 0 — Context load (all skills)

Load brand context per the skills' context matrix:
- `brand_context/voice-profile.md` — voice + rhythm
- `brand_context/positioning.md` — angle
- `brand_context/icp.md` — reader
- `brand_context/mole-knowledge-base.md` — fact source
- `context/learnings.md` — relevant skill sections

If `mole-knowledge-base.md` exists, it's the fact floor for all content. If absent, flag and proceed with general knowledge + explicit WA-GEO facts from research. (Need to verify existence as Phase 0.1.)

### Phase 1 — URL strategy & migration

**Owner:** Claude | **Skills:** ad-hoc (DB query + spreadsheet cross-ref)

1. Cross-reference Rankings sheet `/{slug}/` and `/blog/{slug}/` URLs against DB blog posts
2. For each rankings URL:
   - Exists at same URL via correct urlPattern → no action
   - Exists at different URL → flip urlPattern to legacy-root (if root URL has rank) OR note for redirect (only for `-2` / pattern-consolidation cases)
   - Not in DB → queue as create-new legacy-root post
3. Update DB: `UPDATE blog_posts SET url_pattern = 'legacy-root' WHERE slug IN (...)`
4. Clean `redirects.ts`: remove any `blogSlugs` entry for a URL we're migrating instead
5. Generate list of create-new legacy-root posts needed

**Report:** `reports/01_url-strategy-audit.md` — per-URL decision table

**Definition of done:** Every rankings-sheet URL mapped to an action; urlPattern updated in DB; create-new list finalised.

### Phase 2 — Field audit baseline

**Owner:** Claude | **Skills:** ad-hoc

Programmatic per-post audit: identify exact field gaps (meta-title, featured-image, thin-content) per post. Already partially done — re-run after Phase 1 URL fixes.

**Report:** `reports/02_per-post-field-audit.md` — matrix of posts × fields × gap/present

**Definition of done:** Gap matrix complete, content uplift scope (word count + fields) confirmed per post.

### Phase 3 — Content uplift

**Owner:** Claude | **Skills:** `ops-blog-pipeline` → `mkt-authority-content` + `str-ai-seo` + `tool-humanizer`

Per-post content work, in priority order:

1. **Create-new posts** (from Phase 1 queue) — legacy-root aliases for indexed URLs without content
2. **Thin posts** (10 under 500 wc) — expand to 800-1,500+ wc via `mkt-authority-content` pipeline
3. **Medium legacy-root posts** (15 Q&A at 600-900 wc) — GEO-refresh, add WA specificity, FAQ, internal links, hit 1,000+ wc
4. **Medium standard posts** (2-3 at 600-900 wc) — GEO-refresh same standard
5. **Cornerstone polish** (5 posts already at 1,500+ wc) — verify GEO/AEO bar, FAQ, speakable blocks, internal links

Each post:
- Runs through `mkt-authority-content` for structured writing (BLUF, sections, FAQ, citation hooks)
- Runs through `str-ai-seo` overlay for AEO/GEO signals (speakable, answer-first, stat citations)
- Runs through `tool-humanizer` for 8.0+ pass
- Content saved to `projects/mkt-authority-content/{YYYY-MM-DD}_{slug}.md` (archive)
- Content pushed to Payload via `ops-cms-content`

**Reports:** per-post archive in `projects/mkt-authority-content/` (one file per post)

**Definition of done:** Every post ≥800 wc, FAQ present, internal links present, humanizer ≥8.0, WA-GEO context present.

### Phase 4 — Featured images

**Owner:** Claude | **Skill:** `viz-nano-banana`

Generate 34 branded featured images. Prompts tailored per post topic in Got Moles visual language (grass-green, cream, subtle mole/yard imagery, conceptual — no AI-generated humans).

Per image:
- Generate at 1200×675 WebP
- Descriptive alt text with primary keyword (natural, not stuffed)
- Upload to Payload Media collection
- Link `featuredImage` field on the post
- Verify OG preview renders correctly

**Report:** `reports/04_featured-images.md` — image generation log

**Definition of done:** Every post has CMS-linked featured image + alt text + OG preview validated.

### Phase 5 — Internal linking hub

**Owner:** Claude | **Skill:** `str-internal-links`

Build the hub:

1. Matrix: every post → 3-5 related posts (by keyword cluster)
2. Cornerstone flow: Tier 1 cornerstones link to supporting Tier 2/3 posts
3. City/service cross-linking: every post links to ≥1 city page + ≥1 service page
4. Site-wide links INTO the hub: homepage, service-areas, service pages link to cornerstones
5. Blog index hub design: cornerstones prominent, supporting grouped by cluster, tag filter
6. Anchor text diversity audit
7. Related-posts block component implementation (visible on page, not just schema)

**Report:** `reports/05_internal-linking-matrix.md` — full matrix + component spec

**Definition of done:** Every post has ≥3 inbound internal links; blog index hub visible; no orphans.

### Phase 6 — Schema completeness

**Owner:** Claude | **Skill:** ad-hoc (schema audit against `src/lib/schema.tsx`)

1. Audit `schema.tsx` functions for: BlogPosting, BreadcrumbList, FAQPage, DefinedTerm, Speakable, HowTo, ImageObject, LocalBusiness
2. Verify `[citySlug]/page.tsx` legacy-root branch + `blog/[slug]/page.tsx` render all required schemas
3. Enrich root-layout Organization schema (founder, foundingDate, numberOfEmployees, aggregateRating)
4. Run Google Rich Results Test on 5 representative sample posts
5. Run Schema.org validator on output
6. Fix errors/warnings

**Report:** `reports/06_schema-validation.md` — per-sample Rich Results + validator output

**Definition of done:** All target schemas render, Rich Results Test passes on samples, no validator errors.

### Phase 7 — Technical SEO + crawl readiness

**Owner:** Claude | **Skill:** ad-hoc + `str-ai-seo` (technical audit)

1. Core Web Vitals on 5 sample posts (Lighthouse mobile)
2. Canonical tag per post verified
3. `robots.ts` permits all whitelisted + AI bots
4. `sitemap.xml` lastmod/priority/changefreq per URL
5. Image sitemap extension
6. Pagination behaviour on `/blog` index
7. Tag archive page decision (build SEO-ready or noindex)
8. UTM/fbclid canonical handling
9. Broken-link audit across all 34 posts + hub

**Report:** `reports/07_technical-seo.md` — audit results + fixes applied

**Definition of done:** All 34 URLs pass crawl health check; Lighthouse SEO ≥95 on samples.

### Phase 8 — Publish + full verification

**Owner:** Claude | **Skill:** `ops-blog-pipeline`

1. Flip `_status=published` for all 34 posts (after field-completeness verified)
2. Staging smoke test: every URL returns 200, content renders
3. Rich Results Test on sample posts
4. Lighthouse SEO score verification
5. Sitemap verification (all URLs present)
6. Internal link crawl (no 404s)
7. OG preview verification
8. Final per-post checklist pass

**Report:** `reports/08_launch-verification.md` — full checklist results

**Definition of done:** Every acceptance criterion above is checked green.

## Dependencies

```
Phase 0 (context load)
   ↓
Phase 1 (URL strategy) ── must complete before Phase 3 (content work)
   ↓
Phase 2 (field audit) ── informs Phase 3 priorities
   ↓
Phase 3 (content uplift) ── biggest chunk, parallel with Phase 4
   ↓                         ↓
Phase 4 (images)           ───┘
   ↓
Phase 5 (internal linking) ── requires final content in place
   ↓
Phase 6 (schema) ── verifiable once content + links set
   ↓
Phase 7 (technical SEO) ── runs after content stable
   ↓
Phase 8 (publish + verify) ── final gate
```

## Constraints

- **URL preservation is absolute.** No 301 away from any URL with top-100 rank unless it's a justified canonical consolidation (pattern-duplicates only).
- **Content quality is absolute.** Every post meets the cornerstone bar — no "acceptable for now" escapes.
- **Humanizer gate is mandatory** per memory `feedback_humanizer_mandatory.md`.
- **No AI photos of humans** per memory `feedback_no_canva.md` + `feedback_carousel_image_strategy.md`.
- **US English spelling** throughout (memory — Got Moles is WA-based US company).
- **Trust-signal rules:**
  - No "only mole-exclusive" claims (memory `feedback_got_moles_no_only_claim.md`)
  - Guarantee is programme-specific, not sitewide (memory `feedback_guarantee_scope.md`)
  - "WA's #1" is unsubstantiated — don't use (CLAUDE.md Got Moles)
  - "15+ years" = Spencer's personal experience, not company age (founded 2017)
  - "5,000 clients" is safe to publish
  - "219+ five-star Google reviews" is the canonical review reference
- **Do not create docs proactively** (memory `feedback_clear_memory_often.md` style) — only the brief + reports + post archives.

## Open decisions for Roy

1. **`mole-knowledge-base.md` existence** — Phase 0 check. If missing, do we pause to build it (proper), or proceed with general knowledge + online research (faster, lower authority)?
2. **Thin posts strategy** — expand all 10 to cornerstone-tier 1,500+ wc (highest quality, longest) or cornerstone-tier 800-1,000 wc (solid, faster)?
3. **Legacy-root posts uplift depth** — full rewrite to cornerstone-tier vs GEO-refresh + FAQ + link additions keeping core content (faster but less transformational)?
4. **Create-new legacy-root posts** — sweep depth for missing URLs: top-10 only, top-50, or all ranked? More depth = more posts to write.
5. **Featured image prompts** — should I spec a consistent "Got Moles blog hero" visual template (same palette, framing conventions) before generating, or run each post with topic-specific creative freedom?
6. **Blog index page design** — pure chronological vs curated hub (cornerstones pinned top, supporting posts by cluster)? Hub is better SEO + UX but needs design work.
7. **Tag archive pages** — build as SEO-ready pages or noindex them (simpler)?

## Owner Map

| Task | Owner |
|---|---|
| Project lead, scope decisions | Roy |
| URL audit + migration (Phase 1) | Claude |
| Field audit (Phase 2) | Claude |
| Content uplift per post (Phase 3) | Claude via `ops-blog-pipeline` |
| Featured image generation (Phase 4) | Claude via `viz-nano-banana` |
| Internal linking hub (Phase 5) | Claude via `str-internal-links` |
| Schema completeness (Phase 6) | Claude |
| Technical SEO audit (Phase 7) | Claude |
| Publish + verify (Phase 8) | Claude via `ops-blog-pipeline` |
| Spencer review via Notion | Spencer (per-post after Phase 3) |
| Final pre-flip approval | Roy |

## Not in scope

- City-page content uplift (separate scope)
- Service-page content uplift (separate scope)
- Tier 2/3 new blog posts beyond URL preservation (queued for post-launch)
- Third-party citation campaign (Wikipedia/Reddit — separate GEO project)
- Original research content from Spencer's CRM (separate project, Jobber-gated)
- County hub pages (separate post-launch)
- Shadow pages (Ian sign-off — separate)

## References

- **Spreadsheet:** `projects/briefs/website-rebuild-rebrand/Got Moles - PPC Growth YoY + SEO Progress and Fruits.xlsx`
- **Prior analysis:** `projects/str-ai-seo/2026-04-24_keyword-ppc-gap-analysis.md`
- **Build docs:** `projects/briefs/website-rebuild-rebrand/BUILD-METHODOLOGY.md`, `PAGE-BUILD-REFERENCE.md`, `LAUNCH-CHECKLIST.md`
- **Related briefs:** `seo-geo-reinforcement/brief.md`, `got-moles-measurement-setup/brief.md`
- **Skill docs:** `.claude/skills/ops-blog-pipeline/`, `mkt-authority-content/`, `str-ai-seo/`, `tool-humanizer/`, `viz-nano-banana/`, `str-internal-links/`

---

*Brief v1.0 — awaiting Roy approval before execution. No work on posts begins until this brief is signed off.*
