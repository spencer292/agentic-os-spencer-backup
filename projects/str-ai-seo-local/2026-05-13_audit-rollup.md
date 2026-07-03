---
project: str-ai-seo-local
date: 2026-05-13
client: got-moles
target: got-moles.com
type: full-audit-rollup
session: sitewide + 10 page-level audits (parallel via 3 subagents)
---

# Got Moles — Full Audit Roll-Up (Sitewide + 10 Pages)

Single prioritised fix list combining today's sitewide SEO/AEO/GEO audit + 10 per-page Rule A-G audits. Ranked by impact × effort. Annotated against active project briefs.

## Score snapshot

| Page | Tier | Score | Grade | Status |
|---|---|---:|---|---|
| `/` (homepage re-audit) | 1 | 91.5 | A | ✅ Defending |
| `/about/` (re-audit) | 1 | 95.0 | A | ✅ Defending |
| `/blog/best-mole-traps/` | 3 | 76.5 | B | Minor lifts |
| `/blog/types-of-moles-in-washington/` | 3 | 78.5 | B+ | Minor lifts |
| `/blog/how-to-get-rid-of-moles/` | 1 | 71.5 | C | **P1 — canonical bug** |
| `/services/commercial-mole-control/` | 1 | 62.0 | D | **P1** |
| `/mole-control-bellevue/` | 1 | 67.0 | D+ | **P1** (paid LP target) |
| `/mole-control-seattle/` | 1 | 65.5 | D | **P1** |
| `/services/one-time-mole-removal/` | 1 | 58.0 | F | **P1** |
| `/services/total-mole-control-program/` | 1 | 58.0 | F | **P1** |

**Tier 1 weighted average:** ~73. Two flagship pages (home + /about/) hold A; the rest of the Tier 1 stack is in P1 band. Top 5 of P1 are all template/schema fixes that propagate to many pages — high-leverage.

**Radar 2026-05-13 unified:** 68/C (citation 44/D, AEO 40/D, hallucination 20/F, answer 40/D — covered in sitewide audit).

---

## P1 fixes — high impact + template leverage (do these first)

The pattern across this audit: **most P1 lift comes from template-level commits**, not per-page surgery. Single edits to `schema.tsx`, the city-page template, and the Lexical builder cascade across 90+ pages.

### P1-1 — Lexical builder: add `<table>` + `<ol>` block types
**File:** `src/blocks/` (block definitions) + `src/components/blocks/RichTextRenderer.tsx` (renderer)
**Impact:** Unlocks AEO extractability on every blog post + service page. Pixelmojo's #1 high-impact action. Currently 0 tables and 0 ordered lists across the 10 audited pages — every blog post / service page is leaving citable structure on the floor.
**Pages affected:** 3 services + 15 blog posts + future content (~25 pages now; growing)
**Effort:** Medium. Already-shipped block patterns exist (HeroBlock, StatBlock); add `TableBlock` + `OrderedListBlock` to the same patterns.
**Dependency:** Rule E (Lexical builder capability) must be confirmed working before content-side fixes #P1-5/6/7 can apply.

### P1-2 — `schema.tsx`: add `dateModified` + `aggregateRating` to Service nodes
**File:** `src/lib/schema.tsx` (single source of truth for all schema)
**Impact:** All 3 service pages + all 93 city pages emit `Service` schema. Currently no `dateModified` → AI engines deprioritize as undatable. Currently no `aggregateRating` on commercial page (TMCP/OMP have it).
**Pages affected:** 3 services + 93 city pages = 96 pages
**Effort:** Low. Single helper-function edit + datetime source from Payload `updatedAt` or build timestamp.

### P1-3 — City page template overhaul
**Files:** `src/lib/city-data.ts` + `src/app/(frontend)/[citySlug]/page.tsx` + `src/lib/schema.tsx`
**Impact:** All 93 city pages currently identical structure — uniform 6-H2 with no secondary cluster KW variation, no `parentOrganization` on cityLocalBusinessSchema, no Person ref, zero outbound authority anchors, zero tables, zero `<ol>`. Single template-pass lifts all 93 from D+ to ~B-.
**Specific edits:**
- Title template: `Mole Control & Exterminators in {city}, WA | Got Moles`
- Add H2 carrying secondary cluster KW: `Mole Exterminator in {city}` (Spencer P1 lift cue at line 56 of target-keywords.md)
- Add `dateModified` (covered by P1-2)
- Add WA legal-trapping FAQ Q with WDFW citation (currently only Bellevue has it)
- Add per-city outbound: WSU Hortsense + WDFW (authority-strategy.md Cluster 1)
- Add `cityData[].authorityCitations[]` schema extension to support per-city tailoring
**Effort:** Medium. Single template change + per-city authorityCitations array seeding (one-time content effort).

### P1-4 — `/blog/how-to-get-rid-of-moles/` duplicate route fix
**Files:** `src/app/(frontend)/blog/[slug]/page.tsx` + `next.config.ts` or `src/lib/redirects.ts`
**Impact:** Both `/blog/how-to-get-rid-of-moles/` and `/how-to-get-rid-of-moles-in-your-yard/` return 200 with identical content. The legacy-root URL is the canonical (target-keywords.md line 438; GSC 760 imp / pos 19.1; recoverable Tier 1 pillar). Duplicate dilutes equity.
**Fix:** Exclude `legacy-root` rows from `/blog/[slug]` `generateStaticParams` + add 301 redirect in `redirects.ts`. Sweep `blog-data.ts` for other `legacy-root` rows with same duplication bug.
**Effort:** Trivial code-wise; medium audit-wise (need to check all `legacy-root` rows).

### P1-5 — Build the `/services/` hub page (currently 404)
**File:** new `src/app/(frontend)/services/page.tsx`
**Impact:** Three children (`one-time-mole-removal`, `total-mole-control-program`, `commercial-mole-control`) are orphaned from parent IA — Pillar 5 cap until fixed. Hub page with comparison table is also the first AEO extractability win (the table is the asset).
**Content scaffolding:**
- BLUF summarizing 3 offerings
- HTML comparison table (TMCP vs OMP vs Commercial — price, coverage, term, warranty, ideal-for)
- FAQPage block
- Service schema with `serviceCatalog`
- Internal links to each service child page
- Outbound: WSU Hortsense (treatment context)
**Effort:** Medium (new page).

### P1-6 — Spencer Person `sameAs` LinkedIn URL
**File:** `src/lib/schema.tsx` (Spencer Person node) + `/about/` page schema
**Impact:** Person schema `sameAs` empty across `/about/` + all blog posts. E-E-A-T Pillar weakening. Reduces entity-graph strength for Knowledge Graph entry.
**Blocker:** Roy/Spencer to provide LinkedIn URL.
**Effort:** Trivial (one-line edit) once URL provided.

### P1-7 — Canonical-bug sweep on `legacy-root` blog rows
**File:** `src/lib/blog-data.ts`
**Impact:** Verify there aren't other slugs with the same dual-URL-emission bug (Group C agent found at least one — `how-to-get-rid-of-moles`). If 3-5 more exist, same fix template applies but you only want to ship the route exclusion once.
**Effort:** Low (grep + audit).

---

## P2 fixes — high impact, moderate effort

### P2-1 — Configure `Last-Modified` HTTP header
**File:** Vercel/Next.js middleware OR Payload CMS serve config
**Impact:** Independent freshness signal from `dateModified` schema field; Pixelmojo flags as separate AEO check. Currently null on all HTML pages; static .txt files have it.
**Effort:** Medium (infra-level — may need Vercel SSR config or Payload PR). Agent flagged as separate workstream.

### P2-2 — Service page H1 rewrites (TMCP + OMP)
- **TMCP current:** "Year-Round Mole Protection for $100/Month" → "Total Mole Control Program — Year-Round Mole Control in Western Washington"
- **OMP current:** "Professional Mole Removal with a Guarantee" → add "Western Washington" geo
- **Commercial current:** Title 85 chars — trim to ≤60 preserving primary KW
**File:** `src/lib/pages-data.ts` for service-page hero block
**Impact:** Brand-Disambiguation Rule 1 (lawn/yard/WA/brand) fails on both TMCP + OMP — primary KW phrase and geo missing.
**Effort:** Low.

### P2-3 — Service page H2/H3 process triads → `<ol>`; comparison content → `<table>`
- TMCP: Monitor / Respond / Report H3 triad → `<ol>`
- OMP: Inspect / Trap / Clear H3 triad → `<ol>` + Guarantee block → `<table>`
- Commercial: 6 ICP-segment H3 grid → `<table>` + 4-step process → `<ol>`
**Depends on:** P1-1 (Lexical builder must support these block types)
**Effort:** Low after P1-1 lands.

### P2-4 — Blog title trims (template-level fix)
**File:** `src/app/(frontend)/blog/[slug]/generateMetadata()` (suspected — confirm location)
**Current:** "{post title} | Mole Control Blog | Got Moles" — adds 30-40 chars per post
- `best-mole-traps`: 92 → ~49 chars
- `how-to-get-rid-of-moles`: 85 → ~49 chars
- `types-of-moles-in-washington`: 111 → ~52 chars
**Fix:** Drop the double-brand suffix; keep just "| Got Moles". Or use post-defined title field where set.
**Effort:** Low (template change).

### P2-5 — Add `<table>` to blog posts (concrete asset)
- `/blog/best-mole-traps/`: "Which Trap Works Best in Different Washington Soil Conditions" — H2 promises comparison; deliver the table. **This page is on the Pixelmojo 7-competitor-citation-loss list.**
- `/blog/types-of-moles-in-washington/`: "Species Comparison at a Glance" — H2 promises a table; deliver it (3-species comparison: Townsend's vs Coast vs Broad-footed)
- `/blog/how-to-get-rid-of-moles/`: Step 1/2/3/4 H2s → `<ol>`
**Depends on:** P1-1 (Lexical builder)
**Effort:** Medium (content authoring under voice profile).

### P2-6 — OMP Service schema enrichment
**File:** `src/lib/schema.tsx` BRAND_OFFER_CATALOG entry for OMP
**Current:** `price: 450` (incomplete)
**Fix:** Add `priceSpecification: UnitPriceSpecification` covering the $450 + $150 conditional setup; add `warranty`/`termsOfService`. This is also the page hallucinated by Perplexity ("$150 setup only") — schema enrichment helps re-crawl correct it.
**Effort:** Low.

### P2-7 — Title length trims (Pixelmojo flag)
- Home: 71 → ≤65 chars
- TMCP service page: 73 → ≤65 chars
**Effort:** Trivial.

### P2-8 — Free-inspection language audit (separate workstream — Spencer to confirm)
**Surfaces:** 36 occurrences across 13 files. CTA subtext, HowTo schema step, meta description, 11 city FAQ answers, 2 service-area FAQs. Possible internal inconsistency: OMP page says inspection is bundled into $450 (not "free standalone"), while city pages and homepage CTAs say "free inspection."
**Resolution path:** Spencer to confirm: is standalone free inspection real? If yes → align OMP FAQ; if no → strip from 25+ user-facing strings + HowTo schema + meta desc.
**Effort:** Trivial-to-medium depending on decision.

---

## P3 fixes — minor lifts

- **P3-1** Add GoogleOther rule to `robots.txt` (one line)
- **P3-2** Outbound authority anchor sweep on remaining pages (services + blog posts) — needs Lexical builder if applied via blocks
- **P3-3** Generic `og-default.webp` on services → service-specific OG assets
- **P3-4** Article schema additional `@type`: `["Article", "BlogPosting"]` if Pixelmojo's strict match flagged this
- **P3-5** Author-page sweep — Spencer's author page render quality + Person sameAs

---

## Hallucination correction loop — runs alongside fixes

| Hallucination | Provider | Schema/llms state | Action |
|---|---|---|---|
| Founded 2020 | ChatGPT | `foundingDate: "2017"` correct in schema | Force re-crawl via ChatGPT web search on `/about/` |
| Pricing varies by mole size | ChatGPT | `OfferCatalog` correct | Re-crawl `/services/total-mole-control-program/` + push `llms-full.txt` |
| OMP $150 setup only | Perplexity | `OfferCatalog` description correct | After P2-6 schema enrichment, re-submit OMP page to Perplexity |

Re-run Radar 7-14 days post-fixes to verify correction propagated.

---

## Already in flight (don't duplicate — annotate)

| Finding from this audit | Active brief |
|---|---|
| Lexical builder block extensions | (no current brief — would land in `internal-linking-recovery` or as new sub-brief) |
| `dateModified` + `Last-Modified` | `aeo-p0-content` had this scoped; verify not regressed |
| Service schema deepening | `aeo-p0-content` Tier 2 |
| Spencer Person sameAs | `wikidata-entity-strategy` covers entity authority broadly |
| City-template citation anchors | `seo-geo-reinforcement` + `internal-linking-recovery` |
| `/blog/how-to-get-rid-of-moles/` canonical | `cornerstone-url-recovery` may already track |
| Blog title metadata template | `blog-launch-readiness` (complete) — minor regression |
| Free-inspection compliance | (no brief — net new today) |

---

## Suggested execution order

**Block 1 (this week, low-risk):**
- P2-4 blog title trims (template — fixes 15 blog post titles in one commit)
- P2-7 home + TMCP title trims
- P3-1 GoogleOther robots.txt rule
- P2-2 service H1 rewrites
- P1-7 canonical-bug sweep on legacy-root rows (audit only, fix scope from there)
- P1-4 implement the canonical fix once scope known
- Spencer to provide LinkedIn for P1-6
- Spencer to confirm free-inspection offer for P2-8

**Block 2 (next 2 weeks — the lever):**
- P1-1 Lexical builder: TableBlock + OrderedListBlock (unlocks everything downstream)
- P1-2 schema.tsx: dateModified + aggregateRating on Service nodes
- P2-6 OMP schema enrichment
- P1-5 Build `/services/` hub page

**Block 3 (week 3-4 — propagation):**
- P1-3 City page template overhaul (lifts all 93 city pages D→B)
- P2-3 Service page process triads → `<ol>` / `<table>` (depends on P1-1)
- P2-5 Blog post tables + ordered lists (depends on P1-1)
- P2-1 Configure Last-Modified header

**Block 4 (week 4-6 — verification):**
- Re-run Pixelmojo Radar
- Re-run `str-ai-seo-local` audit
- Re-run page audits per Rule H for any P1 page that received fixes
- Hallucination correction loop — re-test 5 facts × 4 providers

---

## Audit artefacts (all files)

**Sitewide audit:**
- `clients/got-moles/projects/str-ai-seo-local/2026-05-13_audit.md`

**Page-level audits (10):**
- `clients/got-moles/projects/str-onpage-audit/2026-05-13_got-moles-homepage-audit_re-audit.md`
- `clients/got-moles/projects/str-onpage-audit/2026-05-13_got-moles-about-audit_re-audit.md`
- `clients/got-moles/projects/str-onpage-audit/2026-05-13_got-moles-tmcp-audit.md`
- `clients/got-moles/projects/str-onpage-audit/2026-05-13_got-moles-omp-audit.md`
- `clients/got-moles/projects/str-onpage-audit/2026-05-13_got-moles-commercial-audit.md`
- `clients/got-moles/projects/str-onpage-audit/2026-05-13_got-moles-seattle-audit.md`
- `clients/got-moles/projects/str-onpage-audit/2026-05-13_got-moles-bellevue-audit.md`
- `clients/got-moles/projects/str-onpage-audit/2026-05-13_got-moles-how-to-get-rid-of-moles-audit.md`
- `clients/got-moles/projects/str-onpage-audit/2026-05-13_got-moles-best-mole-traps-audit.md`
- `clients/got-moles/projects/str-onpage-audit/2026-05-13_got-moles-types-of-moles-in-washington-audit.md`

**Audit tooling:**
- `clients/got-moles/projects/str-ai-seo-local/_audit-tools/schema-extract.mjs` (raw HTML + JSON-LD extractor, GPTBot UA)
- `clients/got-moles/projects/str-ai-seo-local/_audit-tools/schema-extract-2026-05-13.json` (live state snapshot)

**Benchmark:**
- `~/Downloads/ai-visibility-report-got-moles.com-2026-05-13.json` (Pixelmojo Radar — unified 68/C)
