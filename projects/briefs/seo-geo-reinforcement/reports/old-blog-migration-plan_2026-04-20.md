# Old Blog Content Migration Plan

**Date:** 2026-04-20
**Audience:** Roy + Ian + eventual CMS work
**Premise:** The redirect audit treated old blog URLs as "redirect to closest cornerstone" — lossy. Roy flagged that this forfeits ranked URLs unnecessarily. This plan migrates them instead, preserving both URL and content, with the new design system applied.

---

## TL;DR

The old site has **25 blog posts** totaling **~23,000 words** and **~430 ranked keywords** (~100 in top-3). All currently 404 on the new build — neither at their root URL nor at `/blog/{slug}/`.

**The right move is migrate, not redirect.** Keep every valuable old post alive at its original URL, ingest the content into Payload CMS, apply the new design system, and leave them off the main menu (secondary in nav). This preserves 100% of indexed URLs + link equity while letting the new `/blog/` cornerstones lead the brand narrative.

**Three migration buckets:**

| Bucket | Count | Old URL → New URL | Ranked kw |
|--------|------:|-------------------|----------:|
| **Migrate** (preserve old URL, import content) | 18 | `/{slug}/` stays at `/{slug}/` | 196 |
| **Merge + 301** (new post covers topic better) | 7 | `/{slug}/` → `/blog/{new-slug}/` | 234 |
| **Archive** (no meaningful value, redirect to blog index) | 0 | — | 0 |

No archive bucket — every post has either ranking value **or** word-count substance worth preserving.

---

## Full inventory

Sorted by current ranking value (top-3 keywords then total ranked keywords). Published dates span Jan 2024 to Mar 2026 — some recent posts haven't had time to rank yet.

| # | Old URL | Words | Top-3 kw | Ranked kw | Pub date | Verdict |
|---|---------|------:|----:|----:|---|---|
| 1 | `/how-many-eyes-do-moles-have/` | 416 | **46** | **90** | 2024-10 | **MIGRATE** — highest-ranking blog post; no new-site equivalent |
| 2 | `/do-moles-bite/` | 628 | 14 | 33 | 2024-12 | **MIGRATE** — no equivalent |
| 3 | `/what-do-moles-eat/` | 619 | 7 | **102** | 2024-06 | MERGE → `/blog/what-do-moles-eat/` (new is already live — SAME slug, different content) |
| 4 | `/do-moles-carry-diseases/` | 638 | 4 | 25 | 2024-07 | **MIGRATE** — no equivalent |
| 5 | `/are-moles-nocturnal/` | 1,156 | 4 | 17 | 2025-02 | **MIGRATE** — no equivalent; has FAQ |
| 6 | `/what-species-of-moles-live-in-washington-state/` | 1,586 | 2 | 9 | 2025-07 | MERGE → `/blog/types-of-moles-in-washington/` (same topic, newer slug) |
| 7 | `/voles-vs-moles-whats-the-difference/` | 551 | 0 | **80** | 2024-09 | MERGE → `/blog/mole-vs-vole-vs-gopher/` (broader cornerstone) |
| 8 | `/do-moles-hibernate/` | 975 | 0 | 35 | 2025-01 | MERGE → `/blog/when-are-moles-most-active-washington/` |
| 9 | `/how-to-get-rid-of-ground-moles-with-vinegar/` | 580 | 0 | 9 | 2024-08 | **MIGRATE** — no equivalent; myth-bust angle |
| 10 | `/how-to-get-rid-of-moles-in-your-yard/` | 1,164 | 0 | 3 | 2024-02 | MERGE → `/blog/how-to-get-rid-of-moles/` (new cornerstone) |
| 11 | `/what-do-mole-holes-look-like/` | 921 | 0 | 3 | 2025-06 | **MIGRATE** — no equivalent |
| 12 | `/is-a-mole-a-rodent/` | 766 | 0 | 1 | 2024-11 | **MIGRATE** — no equivalent |
| 13 | `/what-attracts-moles-to-your-yard/` | 1,445 | 0 | 0 | 2025-07 | **MIGRATE** — has FAQ; ranks will grow |
| 14 | `/can-moles-swim/` | 409 | 0 | 0 | 2025-04 | **MIGRATE** — short but unique |
| 15 | `/how-deep-do-moles-dig/` | 1,066 | 0 | 0 | 2025-04 | **MIGRATE** — no equivalent |
| 16 | `/moles-vs-gopher-mounds/` | 1,250 | 0 | 0 | 2025-03 | MERGE → `/blog/mole-vs-vole-vs-gopher/` (same topic) |
| 17 | `/what-works-for-mole-extermination/` | 1,560 | 0 | 0 | 2024-01 | MERGE → `/blog/best-mole-traps/` (same topic) |
| 18 | `/when-are-moles-most-active/` | 1,000 | 0 | 0 | 2025-08 | MERGE → `/blog/when-are-moles-most-active-washington/` |
| 19 | `/why-do-moles-make-molehills/` | 777 | 0 | 0 | 2025-09 | **MIGRATE** — no equivalent |
| 20 | `/olympia-mole-exterminator/` | 895 | 0 | 0 | 2025-10 | EDGE CASE — in blog sitemap but city×service URL. **Redirect → `/mole-control-olympia/`**. |
| 21 | `/what-eats-moles/` | 1,111 | 0 | 0 | 2025-11 | **MIGRATE** — unique food-chain angle |
| 22 | `/are-moles-venomous/` | 846 | 0 | 0 | 2025-12 | **MIGRATE** — consolidate with #25 |
| 23 | `/how-many-babies-do-moles-have/` | 992 | 0 | 0 | 2026-02 | **MIGRATE** — biology angle |
| 24 | `/do-moles-live-in-groups/` | 1,165 | 0 | 0 | 2026-02 | **MIGRATE** — social-behavior angle |
| 25 | `/are-moles-poisonous-or-venomous/` | 873 | 0 | 0 | 2026-03 | **MIGRATE** — duplicate of #22, consolidate: redirect venomous → poisonous |

**Migration bucket totals:**
- Migrate: 18 posts (keeping old URL)
- Merge + 301 to new post: 7 posts (new post already exists with stronger content)
- One-off redirect: 1 (olympia-mole-exterminator is a city page, not a blog)

---

## URL structure decision

**Recommendation: keep old blog URLs at root.** Old site's blog posts live at `/{slug}/` (WordPress default). New site's blog posts live at `/blog/{slug}/`. Both coexist post-launch.

### Why this is the right move

**Maximum indexing preservation.** Google indexes `/how-many-eyes-do-moles-have/`. Keep the URL intact, keep the content alive, keep the indexed entry. Zero redirect hop, zero ranking dampener.

**Two legitimate URL structures.** It's not elegant to have blogs at both `/{slug}/` and `/blog/{slug}/` — but it's perfectly valid from Google's perspective. Each URL is canonical to itself. No duplicate-content risk if each URL serves unique content (which it does — old posts and new posts are different).

**Main menu stays clean.** New `/blog/` cornerstones lead the brand narrative. Old posts remain discoverable via search and internal linking from the blog index, but they don't compete for nav real estate. They're "legacy content kept alive for SEO" not "featured articles."

**CMS data model already supports this.** Payload can hold blog posts with a `urlPattern` field (e.g. `'legacy-root'` vs `'blog'`). Routes pick up the right pattern.

### Why NOT to redirect everything to `/blog/{slug}/`

- 301 redirects have a measurable dampener (historically 10-15%, Google's modern stance is "near-zero" but real-world experience differs).
- Reindex period 2-8 weeks during which rank volatility is high.
- The 90-keyword `/how-many-eyes-do-moles-have/` page would go through reindex for a URL change that buys us zero SEO benefit — the slug isn't the problem.
- Visual consistency in URL structure is a developer preference, not a user or Google preference.

### Why NOT to merge everything into closest cornerstone

- Loss of the specific long-tail ranking. Even if `/how-many-eyes-do-moles-have/` topically overlaps `/blog/are-moles-blind/`, the old URL ranks on 46 top-3 queries specifically tied to "eyes," and those queries often don't match the cornerstone's angle.
- Google treats the two URLs as distinct content. Merging forces Google to pick one — and the cornerstone's content won't cover the same queries as depth-specific content like "how many eyes."

---

## Content ingestion approach

For the 18 MIGRATE posts:

1. **Scrape old HTML** for each post — body text, H1/H2/H3 structure, images (URL + alt), publication date, author.
2. **Transform to new design system** — map WordPress heading structure to Payload's Lexical format. Strip WordPress-specific markup (shortcodes, inline styles).
3. **Re-image** where content implies it — the new site uses `viz-nano-banana` generated photorealistic hero images. Old posts have stock/thin images. Each migrated post gets a hero image matching the new brand.
4. **Add FAQ schema** where content has Q&A structure (11 posts have question-heavy H3s that naturally become FAQPage entries).
5. **Add Speakable schema** via the standard GEODefinitionBlock at top of each post (once a BLUF is extracted from the opening).
6. **Insert internal links** to relevant service pages + related posts (2-3 per post, per the `ops-blog-pipeline` methodology).
7. **Humanize via tool-humanizer deep mode** — 8.0+ score minimum, matching new brand voice.
8. **Set `urlPattern: 'legacy-root'`** field so the route serves at `/{slug}/` not `/blog/{slug}/`.

For the 7 MERGE posts:

1. **Identify stronger facts in the old post** — e.g. `/voles-vs-moles-whats-the-difference/` may have specific identification tips the new cornerstone lacks.
2. **Fold those paragraphs into the new post** where they strengthen content.
3. **301 old URL to new post** with full link equity pass.
4. **No CMS import needed** for the old post itself.

---

## Routing + CMS model

### Payload schema addition

```typescript
// Existing BlogPost collection
{
  urlPattern: {
    type: 'select',
    defaultValue: 'blog',
    options: ['blog', 'legacy-root'],
    admin: { description: '"blog" → /blog/{slug}/, "legacy-root" → /{slug}/' }
  },
  // ... existing fields
}
```

### Next.js routes

- `app/(frontend)/blog/[slug]/page.tsx` — existing, serves `urlPattern === 'blog'` posts
- `app/(frontend)/[slug]/page.tsx` — **new catch-all** — looks up `urlPattern === 'legacy-root'` posts by slug

**Collision check:** `[slug]` is a dynamic catch-all. Static routes (e.g. `/about/`, `/contact/`, `/faq/`, `/how-it-works/`, `/service-areas/`, `/reviews/`, `/blog/`) take precedence over dynamic. City pages live at `/mole-control-{slug}/` — no collision. Verify `[slug]` doesn't eat any legitimate static route (the `generateStaticParams` + a reserved-slug list handles this).

### Sitemap

Add legacy-root posts to the sitemap alongside blog/{slug}/ posts. Sitemap signals "these are legitimate URLs, index them separately." No cross-canonicalization.

### Canonical tags

Each URL canonicals to itself. `/how-many-eyes-do-moles-have/` canonical = `/how-many-eyes-do-moles-have/`. `/blog/are-moles-blind/` canonical = `/blog/are-moles-blind/`. They're different content, different URLs.

---

## Ingestion workflow (when we execute)

1. Write a one-shot migration script: `scripts/migrate-old-blogs.ts` that takes the 18 MIGRATE URLs, scrapes each via fetch, transforms HTML → Payload Lexical, inserts into the CMS with `urlPattern: 'legacy-root'`.
2. Run `ops-blog-pipeline` per post in "migrate mode": fetch-existing-content → apply-new-design → humanize → seed → deploy.
3. Update `src/app/(frontend)/[slug]/page.tsx` route to resolve legacy-root posts.
4. Update `src/app/sitemap.ts` to include both `/blog/{slug}/` and legacy-root `/{slug}/` URLs.
5. For the 7 MERGE posts: add hand-mapped 301 entries to `redirects.ts` → new canonical post.
6. Commit + push mine → Vercel staging → smoke-test each migrated URL.
7. Run redirect-audit script again post-migration to verify every old blog URL resolves 200 (not 404).

**Order of operations with DNS switch:** ingest + route updates ship to staging BEFORE DNS switch so production DNS cut-over lands on a site with all migrated posts live on day one.

---

## Open questions

1. **Visual consistency.** Migrated posts share the `/{slug}/` URL space with… nothing else? (Cities are `/mole-control-{slug}/`, not bare slug.) So visually, bare-slug URLs = legacy blog. Is that OK or should they get a visual "legacy" treatment in the URL bar via something like `/mole-101/{slug}/`? Recommendation: no — a 301 to a prefix URL is still a URL change, and we're trying to AVOID changes.
2. **Archive vs keep-indefinitely.** Should legacy blog posts have a sunset policy (e.g. after 18 months of zero ranking, consolidate)? Out of scope for launch; decide in 2027.
3. **Newer old posts (2025-08 to 2026-03) with zero rankings.** They're new enough that they haven't indexed yet. Migrating preserves the URL for when they do rank. Recommendation: migrate these too — zero cost, preserves future ranking potential.
4. **Image licensing.** Old site images come from WordPress uploads. Do we have rights to reuse, or should every migrated post get a `viz-nano-banana` regenerated hero? Recommendation: regenerate — cleaner brand consistency and zero licensing exposure.

---

## Updating the L2 brief

This plan adds a new track to `seo-geo-reinforcement`:

**Track D — Old Blog Migration (NEW, launch-critical)**
- D1. Scraper + transformer script
- D2. Payload schema addition (`urlPattern` field)
- D3. `app/(frontend)/[slug]/page.tsx` catch-all route
- D4. Ingest 18 posts via `ops-blog-pipeline` migrate mode
- D5. Update 7 MERGE posts' cornerstones with folded content + 301s
- D6. Update sitemap + redirect verification

Sequence: D1 + D2 + D3 in one commit (infrastructure). D4 in second commit (bulk ingest). D5 third (merge + redirect). All before DNS switch.

---

## What we'd need from Ian

Ian can validate and refine this plan with:

1. **GSC landing-page report for the old site** — confirms which of the 18 MIGRATE posts actually receive organic traffic vs just being tracked. If a post has 0 impressions over 90 days, downgrade from MIGRATE → MERGE.
2. **Backlink inventory per old blog URL** — same as redirect audit ask. High-backlink posts get priority migration.
3. **The 7 MERGE mappings** — validate that Google will see each new-post as genuinely fulfilling the old URL's intent. If not, flip MERGE → MIGRATE.

---

*Report compiled 2026-04-20. Source data: `reports/redirect-matrix.csv` + `reports/old-blog-inventory.csv` + `reports/old-blog-inventory.json`.*
