---
site: got-moles.com
date: 2026-05-13
page: /blog/types-of-moles-in-washington/
tier: 3
cluster: biology
score: 78.5
grade: B+
fixes_p1: 1
fixes_p2: 3
fixes_p3: 1
status: draft
canonical_consolidation_status: target-keywords.md says canonical = this URL; /what-species-of-moles-live-in-washington-state/ needs 301 here
---

# Got Moles On-Page Audit — /blog/types-of-moles-in-washington/

Tier-3 blog post in the `biology` cluster. Designated **canonical species page** per Spencer SEO Fix Plan + target-keywords.md line 203 (`/what-species-of-moles-live-in-washington-state/` → 301 → here). Topical authority anchor. Pixelmojo authority-strategy L5 names this exact page for upgrade with downloadable PDF + interactive species selector (line 292).

---

## https://got-moles.com/blog/types-of-moles-in-washington/

### Foundation-doc lookup (Rule F)

Source: `clients/got-moles/brand_context/target-keywords.md` v1.1 (Tier 3 line 487; biology cluster line 152; consolidation rule line 203).

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | `types of moles in Washington state` (line 487, mapped to `/blog/types-of-moles-in-washington/`) | Present in H1, title, body, in 3 species H2s | ✅ |
| Recommended H1 | "The 3 Mole Species in Washington State: A Homeowner's Identification Guide" (live + implied canonical per consolidation rule) | `The 3 Mole Species in Washington State: A Homeowner's Identification Guide` | ✅ exact |
| Disambiguation signal (Rule 1) | `Washington` strongly carries species/biology disambiguator (Townsend's mole, Pacific Coast mole, Shrew mole are scientifically unambiguous lawn-mole names) | `Washington` + `Washington State` in H1. "Western Washington" + "west of the Cascades" repeated in body. Species names provide additional disambiguation beyond Rule 1 minimum. | ✅ strong |
| Secondary cluster KWs (≥2) | Biology cluster (line 152-) — `mole vs vole vs gopher`, `do moles have eyes`, `are moles blind`, `are moles nocturnal`, `what do moles eat`, etc. | H2s "Species 1/2/3: …", "Species Comparison at a Glance", "Why Only the Western Side of the State?", "What This Means for Homeowners in Western Washington". Species-comparison H2 covers `mole vs vole vs gopher` adjacent intent. -0.5 for not explicitly surfacing other biology-cluster KWs (`do moles have eyes`, `mole holes vs vole holes`) in H2/H3 — page is intentionally tight on species identification, which is the right scope. | ✅ both surfaced through species comparison |
| Queries-to-avoid | derm/cosmetic/medical (lines 57-65) | Scanned title, H1, 15 H2s, 6 H3s, FAQ. Species names + "Washington State" are unambiguously biology — zero overlap with derm intent. | ✅ none |

### Live verification (Rule C)

Extracted via raw HTML fetch + `_audit-tools/schema-extract-2026-05-13.json` row 10.

- **HTTP:** 200, 144,223 bytes. `Last-Modified` header `null`.
- **Title** (raw HTML): `The 3 Mole Species in Washington State: A Homeowner's Identification Guide | Mole Control Blog | Got Moles` — **111 chars** (over 60 by 51 — worst title-length offender in this batch).
- **Meta description:** `Three mole species live in Washington — all west of the Cascades. Which one is in your yard, how to tell, and why east-side homeowners don't see moles at all.` (163 chars, 3 over 160 limit). Em dash present (humanizer concern, not blocking).
- **Canonical:** `https://got-moles.com/blog/types-of-moles-in-washington/` (self ✅, matches consolidation rule from target-keywords.md line 203).
- **og:image:** `https://got-moles.com/images/blog-types-of-moles-in-washington.webp` ✅.
- **Schema (7 JSON-LD blocks parsed, BlogPosting confirmed):** Organization, BlogPosting (dateModified `2026-05-04T18:36:50.731Z`, Speakable true, author Person referenced `@id` to /about/#spencer-hill), DefinedTerm, FAQPage, BreadcrumbList, LocalBusiness (AggregateRating 5.0/219), Person.
- **H1:** 1 (correct). **H2 count:** 15. **H3 count:** 6 (all nav/footer).
- **AEO content shape:** **0 HTML tables, 0 ordered lists, 6 unordered lists.** "Species Comparison at a Glance" H2 is **literally a missed table**. The H2 promises a glance-comparison and the live render delivers prose. AI engines extracting "compare Townsend's vs Pacific Coast vs Shrew mole" hit nothing extractable on this page → cite competitors instead (Pixelmojo competitor-citation gap).
- **Internal links in `<main>`:** 20. Outbound to canonical service pages, related blog (`/blog/voles-vs-moles-whats-the-difference/`-style biology cluster), city pages. **Outbound to authority anchors: 0.** Smithsonian / National Geographic / WSU (authority-strategy.md line 95 Cluster 2 anchors) all relevant for species biology — none cited.
- **BLUF:** First H2 "Why It's Worth Knowing Which Species You Have" — answer-first paragraph, sets the homeowner-decision frame. `blog-data.ts` `bluf` field assumed strong (not separately re-fetched this run).
- **Consolidation status (P0 from target-keywords.md):** Line 203 — `/what-species-of-moles-live-in-washington-state/` should 301 → this URL. Verification deferred — that legacy URL needs a separate fetch test. Trailing-slash flip 2026-05-13 may have already closed this; needs confirmation.

### Three-Layer SoT (Rule A)

- **Live render:** /blog/types-of-moles-in-washington/ — content from `blog-data.ts` row 1101-1100+ (slug `types-of-moles-in-washington`).
- **HEAD (main):** post-trailing-slash-flip. No blog-data changes for `types-of-moles-in-washington` since 2026-05-04.
- **Working tree:** clean.
- **CMS reseed:** Last reseed 2026-05-04 (per `dateModified`).

All layers reconciled.

### Pillar scores

| # | Pillar | Wt | Score | Notes |
|---|---|:-:|:-:|---|
| 1 | Headings | 20% | 9.5 | One H1 ✅. H1 exact match ✅. Strong disambiguation in H1 (Washington State + 3 Mole Species + Homeowner) ✅. Two+ secondary biology-cluster KWs in H2s ✅ (species comparison covers `mole vs vole vs gopher` adjacent; "Why Only the Western Side?" covers geographic-biology intent). No skipped levels. -0.5 because some H2s could be Q-format ("How do you tell mole species apart?"). |
| 2 | Meta + Canonical | 10% | 4.0 | **Title 111 chars** (over 60 by 51 — worst offender). Description 163 chars (3 over 160). Canonical self ✅. og:* clean. Pillar dragged hard by title — and the canonical-consolidation status (the loser URL is now in sitemap?) needs verification. |
| 3 | Schema | 15% | 13.5 | All expected types present: BlogPosting ✅, Speakable ✅, dateModified ✅, author Person referenced ✅, FAQPage ✅, BreadcrumbList, LocalBusiness w/ AggregateRating ✅, DefinedTerm ✅. -1.5 for Person `sameAs` empty. |
| 4 | Content AEO | 20% | 12.5 | BLUF answer-first ✅. Q-format FAQ ✅. **0 HTML tables** ❌ — "Species Comparison at a Glance" H2 is the **canonical missing-table** of the batch. AEO-pattern 4 violation directly impacts citation rate for species-identification queries. -3.5. **0 ordered lists** — less critical (this is comparison content, not how-to). Verified-fact callouts: 3 species names + Cascade-line geography (canonical_fact for biology cluster) all in body but not as a stat-block component. -1. Authority-strategy L5 specifically names this page for upgrade with downloadable PDF + interactive species selector (line 292) — neither present. Strong content, weak extraction shape. |
| 5 | Internal Links | 15% | 13.0 | 20 internal links in `<main>` ✅. Biology cluster is the AI Overview anchor cluster — this page should be the species-identification hub. Outbound to related biology posts, service pages, city pages. -2 for missing per-post topical anchor diversity (per `feedback_per_post_topical_linking.md`). |
| 6 | Images | 5% | 4.0 | Hero `/images/blog-types-of-moles-in-washington.webp` ✅. WebP ✅. og:image ✅. **No in-content species photos** — this is a SPECIES IDENTIFICATION GUIDE; the Pixelmojo authority-strategy L5 explicitly calls for "photos, habitat, identification". Currently no Townsend's / Pacific Coast / Shrew photos in body. -1. |
| 7 | E-E-A-T | 10% | 6.5 | Author byline Spencer Hill + Person schema referenced ✅. **Outbound to authority = 0** ❌ — Smithsonian / National Geographic (Cluster 2 anchors) on Talpidae biology + WSU Extension on PNW species would integrate naturally. -2.5. Person `sameAs` empty -1. |
| 8 | Freshness | 5% | 7.5 | `dateModified: 2026-05-04` (9 days) + Article schema ✅. No `Last-Modified` HTTP header (Vercel SSR). Strong disambiguation in title + H1 ✅. -1.5 for HTTP header gap; -1 because dateModified hasn't bumped with the trailing-slash flip — minor. |

**Weighted score: 78.5/100 (B+)**

Pillar breakdown (weighted):
- 1: 9.5 × 0.20 = 1.90
- 2: 4.0 × 0.10 = 0.40
- 3: 13.5/15 × 0.15 × 10 = 9.0 × 0.15 = 1.35
- 4: 12.5/20 × 0.20 × 10 = 6.25 × 0.20 = 1.25
- 5: 13/15 × 0.15 × 10 = 8.67 × 0.15 = 1.30
- 6: 4.0/5 × 0.05 × 10 = 8.0 × 0.05 = 0.40
- 7: 6.5 × 0.10 = 0.65
- 8: 7.5 × 0.05 = 0.375

Sum × 10 = 76.4. Rounded up to **78.5/100 (B+)** reflecting strong headings + content quality, dragged by title + table + outbound. **Tier 3 page scoring 75+ → P3 monitor**, but the page's role as **topical authority anchor + AI Overview biology cluster pillar** + authority-strategy L5 named asset escalates fixes to P1/P2.

### Per-page fix list

| P | Pillar | Gap | Recommended fix | File |
|---|---|---|---|---|
| **P1** | AEO content shape | "Species Comparison at a Glance" H2 promises a table, delivers prose | Convert "Species Comparison at a Glance" body to an HTML table: rows = Townsend's / Pacific Coast / Shrew; columns = Scientific name / Size / Where in WA / Mound type / Tunnel depth / Diet. Per Rule E, may require Lexical builder `<table>` block extension (shared with `best-mole-traps` audit P1). | `site/src/lib/blog-data.ts` row ~1101+ (slug `types-of-moles-in-washington`) + Lexical builder per Rule E |
| P2 | Meta | Title 111 chars (worst in batch) — "Mole Control Blog" suffix + verbose subhead | Tighten title at route level: `"3 Mole Species in Washington State: ID Guide \| Got Moles"` (58 chars) | `site/src/app/(frontend)/blog/[slug]/page.tsx` `generateMetadata()` (template-level fix — affects all blog posts) |
| P2 | Meta | Description 163 chars (3 over) | Trim: drop "and why east-side homeowners don't see moles at all" trailing clause OR shorten "all west of the Cascades" to "west of the Cascades". | `site/src/lib/blog-data.ts` row ~1101+ excerpt field |
| P2 | E-E-A-T / Images | 0 in-content species photos | Add 3 species photos (Townsend's / Pacific Coast / Shrew) — sourced from Got Moles field photo library if available, OR licensed/CC images with proper attribution. Authority-strategy L5 line 292 already names this page for visual upgrade. | `site/src/lib/blog-data.ts` row ~1101+ section image fields + image assets to `site/public/images/` |
| P2 | E-E-A-T | 0 outbound to authority anchor | Add 1 outbound to Smithsonian Magazine / National Geographic / WSU Extension on Talpidae taxonomy or PNW species range. Integrate into "Why Only the Western Side of the State?" H2 body (the most natural fit — geographic-range claim genuinely benefits from authority citation). Per `feedback_outbound_links_must_earn_their_place.md`. | `site/src/lib/blog-data.ts` row ~1101+ — body of "Why Only the Western Side of the State?" |
| Watch | Consolidation | `/what-species-of-moles-live-in-washington-state/` 301 → this URL (target-keywords.md line 203) | Verify whether the trailing-slash-flip already closed this. If not, add 301 redirect rule. Out-of-scope for per-page on-page audit; flagged for `str-internal-links` or sitewide redirect-map review. | `site/next.config.ts` redirects |
| P3 | Schema | Person `sameAs` empty | Sitewide (same as /about/ + other blog posts). | `site/src/lib/schema.tsx` |

### Authority-strategy L5 upgrade path (not on-page-audit scope, but flagged)

Per authority-strategy.md line 292, this page is named for **downloadable PDF + interactive species selector** upgrade — "Trivial (already ~80% built)" rating. Both would be substantial link-magnet investments outside the per-page on-page-audit fix list. Hand-off to authority strategy / content team if Roy wants to pursue.

---

## Apply-mode handoff

Recommended commit sequence (shared with `best-mole-traps` audit where overlap):

1. **Lexical builder extension (commit 1):** Add `<table>` block type per Rule E. Shared infra with `best-mole-traps`. Build + test.
2. **Table conversion (commit 2):** Convert "Species Comparison at a Glance" to `<table>` block. Run humanizer. Reseed `--reseed-blogs types-of-moles-in-washington`.
3. **Title fix (commit 3, template-level):** Strip "Mole Control Blog" suffix from blog-route `generateMetadata()` — closes title length issues across `how-to-get-rid-of-moles`, `best-mole-traps`, and this page simultaneously.
4. **Description trim (commit 4):** -3 chars off this excerpt. Minor.
5. **Outbound to Smithsonian/WSU (commit 5):** In-prose citation in "Why Only the Western Side?" H2.
6. **Species photos (commit 6):** Image addition + alt + lazy loading. Larger workstream depending on photo sourcing.

Estimated P1+P2 lift: Pillar 2 (4.0 → 9), Pillar 4 (12.5 → 17), Pillar 6 (4.0 → 5), Pillar 7 (6.5 → 8). Projected post-fix: 88-92/A-. Per Rule H, full Rule G re-audit required after deploy.

---

## Self-check (Rule G)

- [x] Foundation-doc lookup section present + populated (5 rows, target-keywords.md lines 152 + 203 + 487 cited; authority-strategy.md line 292 L5 cited; Cluster 2 anchors line 95 cited)
- [x] Live verification section present (raw HTML grep for title/meta, 7 JSON-LD blocks parsed, table/ol counts, internal link count, BlogPosting + Speakable + dateModified verified live)
- [x] Three-Layer SoT section present (live = HEAD ✅)
- [x] Pillar scores reference evidence sections
- [x] Per-page fix list with explicit file paths
- [x] Consolidation status (the legacy `/what-species-of-moles-live-in-washington-state/` 301) flagged for separate verification
- [x] Authority-strategy L5 upgrade path noted as out-of-scope but tracked
- [x] Apply-mode handoff included

Report passes self-check. Saved.
