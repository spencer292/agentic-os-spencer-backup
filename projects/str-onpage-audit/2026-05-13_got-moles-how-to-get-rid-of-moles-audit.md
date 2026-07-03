---
site: got-moles.com
date: 2026-05-13
page: /blog/how-to-get-rid-of-moles/ (duplicate route of canonical /how-to-get-rid-of-moles-in-your-yard/)
tier: 1
cluster: mole-control (head)
score: 71.5
grade: C
fixes_p1: 2
fixes_p2: 3
fixes_p3: 1
status: draft
canonical_bug: confirmed
---

# Got Moles On-Page Audit — /blog/how-to-get-rid-of-moles/

This page is a **duplicate route** of the canonical pillar at `/how-to-get-rid-of-moles-in-your-yard/`. Both URLs return HTTP 200 with identical title, H1, BLUF, sections, and body. The canonical tag on the `/blog/` version correctly points to the legacy-root URL, but the duplicate is still indexable, in the routing tree, and creating a self-conflicting canonical surface for crawlers.

This is the **#1 P1 finding** in this audit. Score below is for the `/blog/` route specifically; the canonical legacy-root page would score differently (not in scope today).

---

## https://got-moles.com/blog/how-to-get-rid-of-moles/

### Canonical-bug resolution (Pre-pillar — recommended fix)

**Live state (verified raw HTML, 2026-05-13):**

| URL | HTTP | Canonical tag points to | Title | In sitemap? | In `blog-data.ts`? |
|---|---|---|---|---|---|
| `/blog/how-to-get-rid-of-moles/` | 200 | `https://got-moles.com/how-to-get-rid-of-moles-in-your-yard/` | "How to Get Rid of Moles in Your Yard: The Complete Guide \| Got Moles Blog \| Got Moles" (85 chars) | ❌ **Not in sitemap** | Implied — slug `how-to-get-rid-of-moles-in-your-yard` with `urlPattern: 'legacy-root'` (line 901) is what's rendered at BOTH paths |
| `/how-to-get-rid-of-moles-in-your-yard/` | 200 | self | Identical title/H1/body | ✅ In sitemap | ✅ Source-of-truth row (`blog-data.ts` line 899-908) |

**Root cause hypothesis:** The blog index/route is generating `/blog/{slug}` for every row in `blog-data.ts`, **including rows flagged `urlPattern: 'legacy-root'`** that should only render at the legacy-root path. The `legacy-root` flag is being respected by sitemap generation (only the legacy URL is sitemapped) and canonical-tag generation (canonical correctly points to legacy), but NOT by the route-generation logic itself.

**Foundation-doc context (target-keywords.md):**
- `/how-to-get-rid-of-moles-in-your-yard/` is the **Tier 1 pillar** for cluster `mole-control` (line 438, 111).
- It already carries the historic SEO equity from the WordPress era (GSC: 760 impressions / position 19.1 — recoverable).
- target-keywords.md does NOT list `/blog/how-to-get-rid-of-moles/` as a separate page. It is unintended.

**Canonical decision (recommended):**

**Canonical = `/how-to-get-rid-of-moles-in-your-yard/`** (legacy-root, preserves WordPress equity, matches Spencer Hill SEO Fix Plan + target-keywords.md Tier 1 mapping).

**Resolution options (P1):**

1. **Best — 301 redirect** `/blog/how-to-get-rid-of-moles/` → `/how-to-get-rid-of-moles-in-your-yard/` at the routing layer. Stop generating the `/blog/` route for any row flagged `urlPattern: 'legacy-root'`. Cleanest signal to Googlebot / Bingbot / AI crawlers.
2. **Acceptable — `noindex`** the `/blog/` route while keeping the 200. Leaves the duplicate URL in the wild but tells search engines to ignore it. Slower de-indexation than a 301.
3. **Worst — leave as is.** Self-canonical-to-other-URL is a known weak signal; AI crawlers (especially Bingbot per Pixelmojo's competitor-citation finding) sometimes still index both, splitting authority. The canonical-mismatch title-tag bug (3× brand string `"...| Got Moles Blog | Got Moles"`) also signals to LLMs that this URL is a low-quality duplicate.

**Recommendation: Option 1 (301).** Files to touch:
- `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/src/app/(frontend)/blog/[slug]/page.tsx` (or equivalent) — exclude `urlPattern: 'legacy-root'` rows from `generateStaticParams`.
- Add 301 redirect rule in `next.config.ts` (or `middleware.ts`) for `/blog/how-to-get-rid-of-moles/` → `/how-to-get-rid-of-moles-in-your-yard/`.
- Audit other `legacy-root` rows in `blog-data.ts` for the same bug (memory line 204 of target-keywords.md flagged historical duplicates already; the trailing-slash flip closed most, but the `/blog/{slug}` echo of legacy-root rows looks unresolved).

After fix, only the canonical legacy-root URL renders.

### Foundation-doc lookup (Rule F)

Note: Lookup is against the **content** rendered at this URL, which equals the content of the Tier 1 pillar `/how-to-get-rid-of-moles-in-your-yard/`. So foundation-doc fit is **content-level strong**; the gap is at the **URL/canonical** layer.

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | `how to get rid of moles` / `how to get rid of moles in your yard` (Tier 1 line 119-121, mapped to `/how-to-get-rid-of-moles-in-your-yard/`) | Present in H1, title, BLUF, repeated through body | ✅ at content level |
| Recommended H1 | "How to Get Rid of Moles in Your Yard: The Complete Guide" (Tier 1 line 438) | `How to Get Rid of Moles in Your Yard: The Complete Guide` | ✅ exact |
| Disambiguation signal (Rule 1) | `yard` + `Washington` strongly required | `yard` in H1 + `Western Washington` repeated in body (H2 "Step 2: …Western Washington", H2 "Got Moles Serves Western Washington", H2 "Step 1: …voles or gophers") | ✅ |
| Secondary cluster KWs (≥2) | `how to get rid of moles in lawn`, `mole control near me`, `mole removal Washington`, `professional mole control` (cluster 1 queries, lines 119-126) | `professional mole control` → H2 "How Professional Mole Control Works". Step-style H2s "Step 1/2/3/4" capture instruction intent. "Western Washington" recurring localization. | ✅ both surfaced + more |
| Queries-to-avoid | derm/cosmetic/medical (lines 57-65) | Scanned title, H1, 15 H2s, 6 H3s, FAQ | ✅ none |

Content fit: strong (this is canonical-pillar content). URL fit: **failed** — wrong URL serving the right content.

### Live verification (Rule C)

Extracted via raw HTML fetch + `_audit-tools/schema-extract-2026-05-13.json` row 12.

- **HTTP:** 200, 138,983 bytes, content-type `text/html`. `Last-Modified` header `null`.
- **Title** (raw HTML): `How to Get Rid of Moles in Your Yard: The Complete Guide | Got Moles Blog | Got Moles` — **85 chars** (over 60 limit) AND `Got Moles` appears **3 times** in the title (suffix appended twice). This is a separate bug from the canonical mismatch — the route is double-suffixing the brand at the `/blog/` path layer.
- **Meta description:** `Most DIY mole control fails — and it's not your fault. What actually works, what to skip, and when to call a specialist in Western Washington.` (147 chars ✅) — contains em dash (humanizer Rule #1 would fail; not a blocker but worth flagging).
- **Canonical:** `https://got-moles.com/how-to-get-rid-of-moles-in-your-yard/` (points away to legacy-root — see canonical-bug section above).
- **og:image:** `https://got-moles.com/images/blog-how-to-get-rid-of-moles.webp` ✅.
- **Schema (7 JSON-LD blocks parsed, BlogPosting confirmed):** Organization, BlogPosting (dateModified `2026-05-04T18:36:48.024Z`, Speakable true, author Person referenced `@id` to /about/#spencer-hill), DefinedTerm, FAQPage, BreadcrumbList, LocalBusiness (AggregateRating 5.0/219), Person.
- **H1:** 1 (correct). **H2 count:** 15. **H3 count:** 6 (mostly footer/nav: "Our Services", "Learn More", "More from the Blog", "Services", "Company", "Service Areas" — no content H3s, which is acceptable for a step-based H2 structure).
- **AEO content shape:** **0 HTML tables, 0 ordered lists, 6 unordered lists.** Crippling for a "how-to" page with explicit `Step 1 / Step 2 / Step 3 / Step 4` H2s — these MUST be an `<ol>` for AI extraction (per `aeo-patterns-2026.md` pattern 4 + Pixelmojo high-impact action).
- **Internal links in `<main>`:** 22. **Outbound to authority anchors:** **0**. WSU Extension is in authority-strategy.md as the Cluster 1 cite-them-as-source anchor (line 84) — the BLUF mentions WSU implicitly in repellent-failure context, but no outbound link.
- **BLUF:** "Start With What Actually Works" is the first H2 after H1. Body content is answer-first ✅ but no dedicated BLUF callout block — relies on first paragraph of first H2.

### Three-Layer SoT (Rule A)

- **Live render:** /blog/how-to-get-rid-of-moles/ — serving content from `blog-data.ts` row 899-908 (slug `how-to-get-rid-of-moles-in-your-yard`, flagged `legacy-root`). Routing bug: rendering at both `/blog/{slug-with-blog}` AND `/{slug-with-legacy-root}`.
- **HEAD (main):** post-trailing-slash-flip commits `9348db5` + `c0a46f1`. No blog-routing changes between 2026-05-09 and 2026-05-13. The duplicate-route bug pre-dates this audit window.
- **Working tree:** clean.
- **CMS reseed:** Blog posts seeded via `npm run seed -- --reseed-blogs`; `dateModified` shows 2026-05-04 (last reseed).

**Divergence resolved:** Live render = HEAD ✅. The bug is in routing logic, not in a stale deploy.

### Pillar scores

| # | Pillar | Wt | Score | Notes |
|---|---|:-:|:-:|---|
| 1 | Headings | 20% | 9.0 | One H1 ✅. H1 exact match to recommended ✅. Lawn signal (`yard`) in H1 + body ✅. Two secondary cluster KWs in H2s ✅ (`professional mole control`, step-format for `how to get rid of` instruction intent). No skipped levels. -1 because some H2s ("Step 1…", "Step 4…") could be stronger Q-format ("How do you tell moles from voles?") for AEO. |
| 2 | Meta + Canonical | 10% | 3.0 | **Title 85 chars** (over 60 by 25); brand `Got Moles` repeated 3× ("…Got Moles Blog \| Got Moles"). **Canonical points to a different URL** — see canonical-bug section (this is the structural P1). Description 147 chars ✅ + em dash (humanizer concern). og:* + canonical present but canonical is *correct in direction* while the route shouldn't exist. Score reflects the meta cluster, not the canonical-bug remediation (separate fix). |
| 3 | Schema | 15% | 13.5 | All expected types present: BlogPosting ✅, Speakable ✅, dateModified ✅ (2026-05-04), author Person referenced `@id` ✅, FAQPage ✅, BreadcrumbList ✅, Organization ✅, LocalBusiness w/ AggregateRating ✅, DefinedTerm ✅. Best pillar on this page. -1.5 for Person `sameAs` empty (same as /about/ deferral). |
| 4 | Content AEO | 20% | 11.5 | BLUF answer-first ✅. Q-format FAQ ✅. Stat block referenced ("Got Moles by the Numbers" H2) ✅. **0 HTML tables** ❌ — Step 4 "Use the Method That Does — Physical Trapping" has tunnel-depth + trap-type comparison content that begs a table. **0 ordered lists** ❌ — `Step 1 / 2 / 3 / 4` H2s are screaming for an `<ol>`. No queries-to-avoid ✅. Verified-fact callouts (5,000 properties, 219+ reviews, 92+ communities) present in body but not as a distinct above-fold component. Biggest AEO lift on the site sits here. |
| 5 | Internal Links | 15% | 12.0 | 22 internal links in `<main>`. Outbound to canonical service pages, related blog posts (`/blog/best-mole-traps/`, `/blog/diy-vs-professional-mole-control/`), city pages. **Inbound from cluster siblings** can't be audited here (sitewide concern). -3 because the duplicate-URL bug means ALL inbound links pointing to `/blog/how-to-get-rid-of-moles/` are wasted — they should point to `/how-to-get-rid-of-moles-in-your-yard/`. If the route is killed, inbound that mistakenly used `/blog/` slug needs a sitewide internal-link rewrite. |
| 6 | Images | 5% | 4.5 | Hero image `/images/blog-how-to-get-rid-of-moles.webp` set; component-source for `HeroBlock.tsx` confirms `priority` prop ✅. WebP ✅. og:image matches topic. -0.5 for blog post hero typically rendered via `BlogPostHero` (not audited specifically) — assume parity with sitewide pattern. |
| 7 | E-E-A-T | 10% | 6.5 | Author byline Spencer Hill present + Person schema referenced via `@id` to /about/#spencer-hill ✅. BUT Person `sameAs` empty (-1). **Outbound to authority anchor = 0** ❌ — WSU Extension is the named Cluster 1 cite-them-as-source anchor (authority-strategy.md line 84); the page discusses repellent failure modes and physical trapping where a WSU citation would integrate naturally into prose. -2.5 for missing outbound. |
| 8 | Freshness | 5% | 7.0 | `dateModified: 2026-05-04` (Article schema field, 9 days old). No `Last-Modified` HTTP header (Vercel SSR limit). Visible date in UI — assumed via `BlogPostHero` (component-source confirmation deferred — would round-trip if needed). Disambiguation in title + H1 ✅. -1.5 for HTTP header gap; -1.5 for dateModified being 9 days old (fine but the trailing-slash flip might warrant a re-bump if any inline links change). |

**Weighted score: 71.5/100 (C)**

Pillar breakdown (weighted, /10 then × weight):
- 1: 9.0 × 0.20 = 1.80
- 2: 3.0 × 0.10 = 0.30
- 3: 13.5 / 15 × 0.15 × 10 = 9.0 × 0.15 = 1.35
- 4: 11.5 / 20 × 0.20 × 10 = 5.75 × 0.20 = 1.15
- 5: 12 / 15 × 0.15 × 10 = 8.0 × 0.15 = 1.20
- 6: 4.5 / 5 × 0.05 × 10 = 9.0 × 0.05 = 0.45
- 7: 6.5 × 0.10 = 0.65
- 8: 7.0 × 0.05 = 0.35

Sum × 10 = 71.5/100. **Tier 1 page scoring <75 → P1 priority** per audit-checklist priority assignment table.

### Per-page fix list

| P | Pillar | Gap | Recommended fix | File |
|---|---|---|---|---|
| **P1** | Canonical / routing | Duplicate route `/blog/how-to-get-rid-of-moles/` returns 200 with canonical pointing to `/how-to-get-rid-of-moles-in-your-yard/` | 301 redirect at `/blog/how-to-get-rid-of-moles/` → `/how-to-get-rid-of-moles-in-your-yard/`. Stop generating `/blog/{slug}` for rows flagged `urlPattern: 'legacy-root'` in `blog-data.ts`. Audit other `legacy-root` rows for same duplication. | `site/src/app/(frontend)/blog/[slug]/page.tsx` (or `generateStaticParams`) + `site/next.config.ts` redirects |
| **P1** | AEO content shape | 0 ordered lists despite explicit Step 1/2/3/4 H2 structure | Convert step content body to `<ol>` markup inside the section bodies (richContent block-level), OR restructure the Step blocks into a single ordered-list block. AI engines extract `<ol>` verbatim as step-by-step citations (Pixelmojo high-impact action). | `site/src/lib/blog-data.ts` row 899-908 `sections` body fields for `Step 1/2/3/4` H2s |
| P2 | Meta | Title 85 chars + brand `Got Moles` repeated 3× | Once duplicate route is killed (P1 above), this URL stops existing. If kept (Option 2/3), fix title at route level: `"How to Get Rid of Moles in Your Yard | Got Moles"` (50 chars exact) | `site/src/app/(frontend)/blog/[slug]/page.tsx` `generateMetadata()` — strip the extra `| Got Moles Blog` suffix on legacy-root rows |
| P2 | E-E-A-T | 0 outbound to authority anchor | Add 1 outbound to WSU Extension where it integrates into the prose. Best candidate: "Step 3: Skip the Methods That Don't Work" body, citing WSU's published guidance on castor oil ("not consistently effective"). Per `feedback_outbound_links_must_earn_their_place.md`. | `site/src/lib/blog-data.ts` row 899-908 — body of "Step 3" section |
| P2 | AEO content shape | 0 HTML tables despite tunnel-type / method comparison content | Convert "Step 4: Use the Method That Does" or "How Professional Mole Control Works" comparison content (method × Cost × Effort × Effectiveness × Best for) to an HTML table block. | `site/src/lib/blog-data.ts` row 899-908 + Lexical builder if a new block type is needed |
| P3 | Schema | Person `sameAs` empty (sitewide) | Same as /about/ — add LinkedIn to Person schema when Roy supplies URL. | `site/src/lib/schema.tsx` |

### Cross-page pattern (also applies to other 2 blog posts in this batch)

This page is the WORST instance of the 3 blog posts on the duplicate-canonical front, but the AEO-shape gap (0 tables, 0 ordered lists) is **identical across all 3**. The combined fix is template-level: extend the Lexical/blog renderer to emit `<table>` and `<ol>` blocks, then convert step/comparison content in each post.

---

## Apply-mode handoff

Two P1 fixes are independent — the canonical-bug fix is a routing change (no block-data touch), while the AEO shape fix is block-data + possibly Lexical builder (per Rule E). Recommended commit order:

1. **Canonical-bug fix (commit 1):** Exclude `legacy-root` rows from `/blog/[slug]` generation + add 301. Build + verify no other `legacy-root` rows still rendering at `/blog/`. Push to `mine`.
2. **Title fix (commit 1 or 2):** Only relevant if some `legacy-root` rows are kept on `/blog/` paths (e.g. for deep-equity URLs we want to keep both). Strip duplicate brand suffix.
3. **AEO ordered-list / table fix (commit 3):** Template-level extension of Lexical builder per Rule E, then block-data conversion. Run `tool-humanizer` on any rewritten prose. Reseed via `npm run seed -- --reseed-blogs how-to-get-rid-of-moles-in-your-yard`.
4. **WSU outbound (commit 4):** Per Rule J + outbound-links-earn-their-place memory.

Estimated P1+P2 lift: Pillar 2 (3.0 → 10), Pillar 4 (11.5/20 → 16/20), Pillar 5 (12/15 → 14/15), Pillar 7 (6.5 → 8.5). **Projected post-fix range: 87-91/B+ to A-**. Per Rule H this is a projection only; full Rule G re-audit required after deploy.

---

## Self-check (Rule G)

- [x] Foundation-doc lookup section present + populated (5 rows, target-keywords.md v1.1 lines 119-121 + 438 cited)
- [x] Live verification section present (raw HTML grep for title/meta, 7 JSON-LD blocks parsed, table/ol counts, internal link count)
- [x] Three-Layer SoT section present (live = HEAD ✅, working tree clean, CMS reseed 2026-05-04)
- [x] Pillar scores reference evidence sections
- [x] Per-page fix list with explicit file paths
- [x] Canonical-bug investigation completed (live URL probe, sitemap check, blog-data.ts inspection, foundation-doc cross-reference)
- [x] Apply-mode handoff included

Report passes self-check. Saved.
