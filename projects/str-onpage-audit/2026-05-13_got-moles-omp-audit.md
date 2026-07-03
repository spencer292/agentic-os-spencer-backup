---
site: got-moles.com
date: 2026-05-13
page: https://got-moles.com/services/one-time-mole-removal/
sitewide_score: N/A (single-page audit)
pages_audited: 1
fixes_p1: 5
fixes_p2: 5
fixes_p3: 3
status: draft
---

# On-Page Audit — OMP (One-Time Mole Removal)

**URL:** `https://got-moles.com/services/one-time-mole-removal/`
**Tier:** 1 (flagship one-time service, $450 + $150 setup, carries the Got Moles Guarantee)
**Cluster:** mole-control (commercial intent) + cost-value (guarantee secondary)
**Page score:** **62.4 / 100** — Needs work (P1)

---

## Foundation-doc lookup (Rule F)

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | `professional mole removal` (P1) — target page `/services/one-time-mole-removal/` | H1 = "Professional Mole Removal with a Guarantee"; title carries "One-Time Mole Removal" + "$450 Flat Rate, Guaranteed" | ✅ **H1 carries primary KW exact match**. Title is product-name centric (correct). |
| Recommended H1 | `"Professional Mole Removal in Western Washington"` (target-keywords.md line 436); AVOID `mole removal cost` as primary — derm hijack | "Professional Mole Removal with a Guarantee" | ⚠️ **partial** — keeps primary KW exact but **drops "Western Washington" geo disambiguation** in favour of "with a Guarantee". Guarantee is a conversion hook but loses Rule 1 disambiguation. |
| Disambiguation signal (Rule 1) | one of: `yard / lawn / garden / ground / pest / exterminator / trapping / Washington / Western WA / Seattle/Tacoma/Olympia / Got Moles` in H1+title | H1: NONE (no lawn/yard/geo/exterminator). Title: "Got Moles" brand ✅ | ❌ **H1 has no lawn/geo/pest/exterminator disambiguation** — fails Rule 1. AI Overviews risk on `professional mole removal` head term. |
| Secondary cluster KWs (≥2) | from cost-value cluster (this page targets guarantee + lawn mole removal cost): `mole control warranty` (P1), `mole removal guarantee` (P1), `lawn mole removal` | H2 "The Got Moles Guarantee" carries `mole removal guarantee` topic. No H2/H3 carries `lawn mole removal`, `warranty`, `professional mole trapping cost`. | ⚠️ **PARTIAL** — only 1 secondary surface. |
| Queries-to-avoid | `mole removal cost` as primary (derm-hijack per Rule 2); cosmetic / dermatology vocabulary; kill-mechanism vocabulary | Title carries "$450 Flat Rate" (price, not "cost"). H1 + H2s clean. Page does not target `mole removal cost` as primary ✅ | ✅ none |

**Disambiguation severity:** Same pattern as TMCP — H1 lacks Rule 1 signal. "Professional Mole Removal" without `lawn/yard/Washington` could collapse to dermatology procedure intent in AI Overviews. The fix is single-word addition (e.g. "Professional Lawn Mole Removal in Western Washington").

---

## Live verification (Rule C)

- **Schema (raw HTML extractor, GPTBot UA, 2026-05-13):** 6 JSON-LD blocks parsed:
  1. Organization (sitewide entity, identical to TMCP — knowsAbout[8] + hasOfferCatalog + sameAs[8]) ✅
  2. WebPage with Speakable cssSelector `["h1", "main h2"]` ✅
  3. BreadcrumbList (Services → One-Time Mole Removal) ✅
  4. Service: name "One-Time Mole Removal", provider `@id`, areaServed "Western Washington", offers `{price: "450.00", priceCurrency: "USD"}` — **note: simpler offers structure than TMCP's UnitPriceSpecification**. No mention of $150 setup fee. ✅ but incomplete pricing
  5. WebPageElement (`#geo-definition` speakable) ✅
  6. FAQPage with 6 mainEntity Q&A ✅
- **No Article schema** — correct (not a fail).
- **No `dateModified`** on Service or WebPage ❌
- **No `aggregateRating`** on Service ❌
- **Last-Modified HTTP header:** `null` ❌
- **Internal-link count in `<main>`:** 16 unique destinations including 11 city pages, 2 sibling services, /service-areas/, /faq/. No /reviews/ link (TMCP has it; OMP doesn't).
- **Tables = 0. Ordered lists = 0. ULs = 3** (decorative).
- **BLUF first `<p>`:** "$450 flat rate. 4-5 weekly visits. If we don't catch a mole, you only pay the $150 setup fee." — **strong answer-first BLUF** carrying canonical pricing facts + guarantee. ✅ Best of the 3 service-page BLUFs.
- **Process H3 triad (Inspect / Trap / Clear):** identical pattern to TMCP (Monitor/Respond/Report) — perfect candidate for `<ol>` markup.

---

## Three-Layer SoT (Rule A)

- **Live render:** verified via direct fetch 2026-05-13 (post-trailing-slash flip; canonical = self) ✅
- **HEAD:** `page.tsx` at `src/app/(frontend)/services/one-time-mole-removal/page.tsx` confirmed; content blocks rendered from CMS via `getCmsPageContent('one-time-mole-removal')`.
- **Working tree:** clean (audit-only mode).
- **CMS layer:** authoritative for block content. Schema $450 in code matches live. Guarantee $150 setup fee appears in BLUF text but not in Service schema offers — divergence in pricing signal (schema vs body).

---

## Pillar scores

| # | Pillar | Wt | Raw | Score | Notes |
|---|---|---|---|---|---|
| 1 | Headings | 20% | 3.0/5 | 12.0 | H1 unique ✅. H1 carries primary KW exact ✅ but drops geo. **Rule 1 disambiguation: ❌**. Only 1 cluster secondary KW in H2/H3 (`guarantee`). No skipped levels ✅. |
| 2 | Meta + Canonical | 10% | 4.0/5 | 8.0 | Title 62 chars (just over 60) — minor deduction. Description 176 chars (over 160). Canonical ✅. og:image generic `og-default.webp` ❌. |
| 3 | Schema | 15% | 5.5/8 | 10.31 | Correct types ✅. BreadcrumbList ✅. Speakable ✅. Organization knowsAbout+hasOfferCatalog ✅. FAQPage aggregated ✅. **Missing:** Service `aggregateRating` (P1 — guarantee is the differentiator; reviews back it), Service offers missing `UnitPriceSpecification` for the `$450 + $150 setup` two-part structure (currently just `price: 450`). |
| 4 | AEO Content Shape | 20% | 3.0/7 | 8.57 | **BLUF strong** (answer-first with canonical pricing facts) → 1.0. Q-format H2s: 0/9 → 0. **Stat block present** ("Got Moles by the Numbers" H2 → 1.0). **Tables = 0** despite "Got Moles Guarantee" being a perfect spec table candidate → 0. **OLs = 0** despite Inspect/Trap/Clear process → 0. Verified-fact callouts (5,000 properties, 219+ reviews) in stat block → 1.0. Queries-to-avoid scan ✅ → 1.0. |
| 5 | Internal Links | 15% | 3.5/5 | 10.5 | Inbound: linked from homepage, TMCP, Commercial, cost blog (verified ≥2) → 1.0. Outbound: 16 unique dests including sibling services + 11 cities + /service-areas/ + /faq/ → 1.0. Anchor diversity: deferred → 0.5. No cannibalisation losers ✅ → 1.0. Hub-spoke: **no upward link to pillar `/how-to-get-rid-of-moles-in-your-yard/`** + **no link to `/blog/mole-removal-cost-washington/`** despite this being the natural cost-cluster bridge → 0. No /reviews/ link despite OMP guarantee being review-driven → minor. |
| 6 | Images | 5% | 3.0/6 | 2.5 | CMS-driven; component-level verification deferred. Hero image present. og:image generic. Conservative scoring. |
| 7 | E-E-A-T | 10% | 2.5/5 | 5.0 | Author byline N/A (Service page) — correct. **Outbound to authority: 0** ❌. **Founder quote: H2 "Why Placement Matters, From the Founder" ✅** + content presumed to carry Spencer attribution. Organization schema robust ✅. The Guarantee itself is a strong E-E-A-T trust signal (rare in pest space). |
| 8 | Freshness + Disambig | 5% | 1.0/4 | 1.25 | **dateModified missing** ❌. **Last-Modified header: null** ❌. **No visible "Last updated"** ❌. Title disambig partial via brand → 0.5. |

**Page total: 12.0 + 8.0 + 10.31 + 8.57 + 10.5 + 2.5 + 5.0 + 1.25 = 58.13 / 100**

**OMP score = 58 / 100 (Poor — P1).** Marginally stronger BLUF than TMCP balances out a slightly weaker schema (no setup-fee detail) and weaker internal-link plan (no /reviews/ + no cost-blog link).

---

## Per-page link plan

| Direction | Status | Anchor / target | Notes |
|---|---|---|---|
| Inbound (present) | ✅ | Homepage pricing card → OMP; TMCP cross-link → OMP; Commercial cross-link → OMP; cost blog should link here (verify) | |
| Inbound (missing) | ❌ | `/blog/mole-removal-cost-washington/` should link to OMP with anchor `professional mole removal` per target-keywords.md cost cluster mapping | P1 cluster bridge |
| Inbound (missing) | ❌ | `/blog/monthly-vs-one-time-mole-control/` is the natural decision-stage page; should anchor `one-time mole removal` to OMP | P1 |
| Inbound (missing) | ❌ | Pillar `/how-to-get-rid-of-moles-in-your-yard/` should link to OMP for "DIY didn't work" CTA section | P1 |
| Outbound (present) | ✅ | 16 unique internal: 11 cities + 2 sibling services + /service-areas/ + /faq/ | |
| Outbound (missing) | ❌ | No link to `/reviews/` despite the page leading with the Guarantee — guarantee credibility lives in reviews | P2 |
| Outbound (missing) | ❌ | No upward link to pillar `/how-to-get-rid-of-moles-in-your-yard/` | P2 |
| Outbound (missing) | ❌ | No outbound to authority anchor (WSU Extension, USDA NWRC) | P1 — E-E-A-T |
| Outbound (missing) | ❌ | No link to `/blog/how-to-choose-a-mole-control-company/` (decision-stage natural pair) | P2 |
| Anchor candidates | — | `professional mole removal`, `lawn mole removal`, `mole removal guarantee`, `mole control warranty`, `mole trapping service` | All carry Rule 1 disambiguation (lawn/professional/trapping). |

---

## Per-page fix list

### P1

| # | Pillar | Gap | Recommended fix | File path |
|---|---|---|---|---|
| 1 | 1 Headings | H1 "Professional Mole Removal with a Guarantee" drops "Western Washington" geo — Rule 1 disambiguation fail | Update H1 to recommended: `Professional Mole Removal in Western Washington` (or hybrid: `Professional Lawn Mole Removal in Western Washington — With a Guarantee`). Subhead carries "$450 flat rate" hook. | `src/lib/pages-data.ts` → `oneTimeBlocks` Hero block heading; reseed `one-time-mole-removal` |
| 2 | 4 AEO | Inspect / Trap / Clear H3 triad sitting in DIVs — should be `<ol>` | Convert process section to RichContent block with `<ol>` markup (or extend Lexical builder per Rule E if not already supporting OLs) | `src/lib/pages-data.ts` → oneTimeBlocks process block; reseed |
| 3 | 4 AEO | "Got Moles Guarantee" H2 is text prose — should be a `<table>` of guarantee terms (extractable as AI citation) | Add 4-row table: Coverage / Period / What's included / Your payment if no mole caught | `src/lib/pages-data.ts` → add RichContent block inside Guarantee section; reseed |
| 4 | 3 Schema | Service offers structure missing setup fee + warranty | Extend `serviceSchema()` for OMP: offers as array of two Offer entries (`$450 service` + `$150 setupFee`), and add a `Warranty` or `termsOfService` field reflecting the guarantee | `src/lib/schema.tsx` + `src/app/(frontend)/services/one-time-mole-removal/page.tsx` serviceSchema call |
| 5 | 3 Schema + 8 Freshness | No `dateModified` + no `aggregateRating` + no Last-Modified header | Same as TMCP fix 4+5 — global Service schema builder enhancement | `src/lib/schema.tsx` |

### P2

| # | Pillar | Gap | Recommended fix | File path |
|---|---|---|---|---|
| 6 | 2 Meta | Title 62 chars (just over 60) | Trim to ≤60: `One-Time Mole Removal: $450 Guaranteed | Got Moles` (50 chars) | `src/app/(frontend)/services/one-time-mole-removal/page.tsx` FALLBACK + CMS meta override |
| 7 | 2 Meta | Description 176 chars (over 160) | Trim to ≤160 | same file |
| 8 | 5 Links | No outbound to /reviews/ or /blog/how-to-choose-a-mole-control-company/ — guarantee credibility orphaned | Add `<a href="/reviews/">219+ five-star Google reviews</a>` in guarantee section + decision-stage link to choose-a-company blog | pages-data.ts |
| 9 | 7 E-E-A-T | No outbound authority anchor | Add link to WSU Extension or USDA NWRC mole IPM as supporting citation in body copy | pages-data.ts + Lexical link builder |
| 10 | 1 Headings | Only 1 cluster secondary KW in H2/H3 | Rename a section H2 to carry `lawn mole removal` or `mole control warranty` | pages-data.ts |

### P3

| # | Pillar | Gap | Recommended fix | File path |
|---|---|---|---|---|
| 11 | 4 AEO | No Q-format H2 | Reword one section (e.g. "What You Get for $450" → "What's included in the $450 flat rate?") | pages-data.ts |
| 12 | 2 Meta | og:image generic | Create OMP-specific OG asset | `public/images/og-omp.webp` |
| 13 | 4 AEO | Anchor-city seeding rule (Spencer P2.7) | Verify Seattle/Tacoma/Bellevue/Sammamish/Puyallup/Renton named in first 200 words | pages-data.ts |

---

## Cross-references

- **Sitewide audit (2026-05-13):** /services/ hub returns 404 — affects OMP IA hierarchy.
- **target-keywords.md cost-value cluster:** OMP is the canonical destination for `mole control warranty` + `mole removal guarantee` queries (P1 per cost-cluster table). Memory `feedback_got_moles_canonical_facts.md` confirms guarantee attaches to OMP only (not TMCP).
- **Pixelmojo benchmark:** guarantee + pricing facts are exactly the kind of content AI engines hallucinate. Schema completeness (full pricing structure + aggregateRating) directly attacks the Pixelmojo "hallucination correction" surface.
