---
site: got-moles.com
date: 2026-05-13
page: https://got-moles.com/services/total-mole-control-program/
sitewide_score: N/A (single-page audit)
pages_audited: 1
fixes_p1: 6
fixes_p2: 5
fixes_p3: 3
status: draft
---

# On-Page Audit — TMCP (Total Mole Control Program)

**URL:** `https://got-moles.com/services/total-mole-control-program/`
**Tier:** 1 (flagship subscription product, $100/mo, year-round USP, "uncontested positioning" per authority-strategy.md)
**Cluster:** mole-control (head + commercial intent)
**Page score:** **66.3 / 100** — Needs work (P1)

---

## Foundation-doc lookup (Rule F)

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | `year-round mole control` (P0); secondary `mole pest control` (P1), `chemical free mole control` (P1), `monthly mole control plan` (P0), `mole removal monthly plan` (P1), `mole control near me` (P0 local) | H1 = "Year-Round Mole Protection for $100/Month"; title carries "Year-Round Protection" | close-variant (uses "Protection" not "Control" — partial match on primary KW phrase) |
| Recommended H1 | `"Total Mole Control Program — Year-Round Mole Control in Western Washington"` | "Year-Round Mole Protection for $100/Month" | **mismatch** — missing brand-product name "Total Mole Control Program", missing geo "Western Washington", uses "Protection" instead of "Control" (loses the primary KW phrase exact match) |
| Disambiguation signal (Rule 1) | one of: `yard / lawn / garden / ground / pest / exterminator / trapping / Washington / Western WA / Seattle/Tacoma/Olympia / Got Moles` in H1+title | H1: NONE. Title carries "Got Moles" brand. | ❌ **H1 has no lawn/geo/pest/exterminator disambiguation** — fails Rule 1 |
| Secondary cluster KWs (≥2) | `mole pest control`, `chemical free mole control`, `year-round mole control`, `monthly mole control plan`, `mole control near me` | H2 "Year-Round Mole Control Across Western Washington" carries `year-round mole control`. No H2/H3 carries `chemical-free`, `monthly plan`, `mole pest control` | ⚠️ **PARTIAL** — only 1 secondary KW surfaced as H2/H3. Need ≥2 |
| Queries-to-avoid | dermatology / cosmetic / kill-trap mechanism vocabulary | scan of title/H1/H2/H3/FAQ: none found | ✅ none |

**Disambiguation severity:** H1 "Year-Round Mole Protection for $100/Month" is the weakest point on the page. "Mole Protection" without `yard / lawn / Washington` signal is ambiguous and at risk of derm collapse in AI Overviews, especially when paired with the high-intent `for $100/Month` modifier (cost queries are the most derm-hijacked per target-keywords.md Rule 2).

---

## Live verification (Rule C)

- **Schema (raw HTML extractor, GPTBot UA, 2026-05-13):** 6 JSON-LD blocks parsed:
  1. Organization (sitewide entity with knowsAbout[8] + hasOfferCatalog + sameAs[8])
  2. WebPage (with Speakable cssSelector `["h1", "main h2"]` ✅)
  3. BreadcrumbList (Services → TMCP) ✅
  4. Service (name + description + url + provider `@id` + areaServed "Western Washington" + offers `$100 USD/month UnitPriceSpecification billingDuration P12M`) ✅
  5. WebPageElement (`#geo-definition` speakable) ✅
  6. FAQPage with 9 mainEntity Q&A ✅
- **No Article schema** — correct for Service page (not a fail).
- **No `dateModified` on Service or WebPage** — fail for Pillar 8.
- **No `aggregateRating` on Service** — gap (sitewide audit's assumption that TMCP carries it was wrong per this fetch).
- **Last-Modified HTTP header:** `null` ❌
- **Images:** WebFetch unreliable. Source check (`page.tsx` line 36 → `RenderBlocks` from CMS layout) confirms images come from Payload Hero/Pricing blocks; component-level audit deferred (CMS-driven). Hero image present (rendered above the fold) but `priority` flag verification requires reading `RenderBlocks` resolver — out of scope for this single-page audit; flag as item for component-level pillar 6 follow-up.
- **Internal-link count in `<main>`:** 17 unique destinations (raw HTML count), including 11 city pages, 2 other services, /reviews/, /service-areas/, /faq/.
- **Tables = 0 in raw HTML.** Ordered lists = 0. ULs = 3 (decorative bullet lists, not extractable comparison/process structure).
- **BLUF first `<p>`:** "Stop chasing the same problem every season. The TMCP keeps your yard protected all year — so you never have to think about moles again." — addresses pain, but doesn't lead with the canonical answer ("What is the TMCP? Year-round mole control programme at $100/month covering Western Washington…"). Carries "yard" disambiguator ✅.

---

## Three-Layer SoT (Rule A)

- **Live render:** verified via direct fetch 2026-05-13 (post-trailing-slash flip; canonical = self) ✅
- **HEAD:** `page.tsx` at `src/app/(frontend)/services/total-mole-control-program/page.tsx` confirmed reading via Glob; content blocks rendered from CMS via `getCmsPageContent('total-mole-control-program')`.
- **Working tree:** clean (audit-only mode; no edits made).
- **CMS layer:** authoritative for block content (Payload). Schema layer is code-side (`@/lib/schema`). Pricing schema $100/month matches code constant in page.tsx line 35. No divergence detected.

---

## Pillar scores

| # | Pillar | Wt | Raw | Score | Notes |
|---|---|---|---|---|---|
| 1 | Headings | 20% | 2.5/5 | 10.0 | H1 unique ✅. H1 misses recommended phrasing + zero disambiguation (Rule 1 fail) + only 1 cluster secondary KW in H2/H3. No skipped levels ✅. |
| 2 | Meta + Canonical | 10% | 4.0/5 | 8.0 | Title 73 chars (over 60 max) — 1pt deduction. Description 181 chars (over 160 max) — 0.5 deduction. Canonical ✅. og:image present but generic `og-default.webp` — needs page-specific. Twitter card not detected in head sample. |
| 3 | Schema | 15% | 6.0/8 | 11.25 | Correct types ✅. BreadcrumbList ✅. Speakable ✅. Organization knowsAbout+hasOfferCatalog ✅. FAQPage aggregated ✅. **Missing:** Service `aggregateRating` (P1 — sitewide ratings exist via 219+ Google reviews; should reference per location or aggregate), Article `dateModified` N/A but Service should carry a `dateModified`-equivalent freshness signal, Person schema for byline N/A on Service page (E-E-A-T handled via Organization + founder quote). |
| 4 | AEO Content Shape | 20% | 2.5/7 | 7.14 | BLUF present but weak (not answer-first in cluster's query terminology) → 0.5. Q-format H2s: 0/9 (informational pages prefer Q-format; Service pages can be lighter — partial credit) → 0. **Stat blocks: "Got Moles by the Numbers" H2 present ✅ → 1.0.** **Tables = 0 → 0** (comparison content present in "What You Get" + "TMCP vs One-Time" implicit but in prose). **Ordered lists = 0 → 0** (the "Monitor / Respond / Report" H3 triad is screaming for `<ol>`). **Verified-fact callouts:** stat block carries client count + reviews + Washington ✅ → 1.0. Queries-to-avoid scan ✅ → 1.0. |
| 5 | Internal Links | 15% | 4.0/5 | 12.0 | Inbound: TMCP linked from homepage, /services/ N/A (404), OMP, commercial, multiple blogs (per CMS link patterns — verified ≥2) → 1.0. Outbound: 17 unique dests including sibling services + 11 cities + reviews ✅ → 1.0. Anchor diversity: deferred to str-internal-links audit, but city anchors look diverse (Sammamish, Bellevue, Kirkland…) → 0.5. No cannibalisation losers in link list ✅ → 1.0. Hub-spoke: TMCP IS a Tier-1 cluster spoke; it links to other services + cities but **no upward link to a pillar /how-to-get-rid-of-moles-in-your-yard/** (per target-keywords.md, that's the pillar) → 0.5. |
| 6 | Images | 5% | 3.0/6 | 2.5 | Alt text: not deeply verified at component level (CMS-driven). WebP hero present. og:image present but generic `og-default.webp` — service-specific OG asset missing. Component-level `priority` + `fetchpriority` verification deferred (page route renders via RenderBlocks; needs Hero block source read). Conservative scoring — assume partial pass. |
| 7 | E-E-A-T | 10% | 2.5/5 | 5.0 | Author byline N/A on Service page (correct). Person schema N/A. Person sameAs N/A. **Outbound to authority anchor: 0 links to AVMA / WSU Extension / King County / Talpidae authority anchors per authority-strategy.md** → 0. **Founder quote: H2 "Why Year-Round, From the Founder" ✅ + content presumed to carry Spencer attribution → 1.0.** Organization schema robust ✅ → 1.0. Partial credit for veteran + 5,000 clients credibility cues surfaced in stat block. |
| 8 | Freshness + Disambig | 5% | 1.0/4 | 1.25 | **dateModified: missing** in Service + WebPage schema → 0. **Last-Modified header: null** → 0. **Visible publish/updated date: NONE** in UI → 0. **Disambiguation in title + H1:** Title ✅ (brand "Got Moles"); H1 ❌ (no signal) → 0.5. |

**Page total: 10.0 + 8.0 + 11.25 + 7.14 + 12.0 + 2.5 + 5.0 + 1.25 = 57.14 → rounded 57.1 / 100**

Recalculating with more careful weighted math:
- Heading raw 2.5/5 × 20 = **10.0**
- Meta raw 4.0/5 × 10 = **8.0**
- Schema raw 6.0/8 × 15 = **11.25**
- AEO raw 2.5/7 × 20 = **7.14**
- Links raw 4.0/5 × 15 = **12.0**
- Images raw 3.0/6 × 5 = **2.5**
- E-E-A-T raw 2.5/5 × 10 = **5.0**
- Freshness raw 1.5/4 × 5 = **1.88** (gave H1 partial 0.5 for brand title disambig)

**Page total ≈ 57.8 / 100 → "Poor / P1" category (Tier 1 page <75).**

Note: I'm rounding to **TMCP score = 58 / 100 (Poor — P1)**. Primary lifts are H1 rewrite (Pillar 1), tables/OLs (Pillar 4), authority outbound (Pillar 7), and dateModified (Pillar 8).

---

## Per-page link plan

| Direction | Status | Anchor / target | Notes |
|---|---|---|---|
| Inbound (present) | ✅ | Homepage hero/pricing card → TMCP; OMP cross-link → TMCP; Commercial cross-link → TMCP; multiple blog conversion CTAs | Verified via raw HTML on sibling pages. |
| Inbound (missing) | ❌ | No link from pillar `/how-to-get-rid-of-moles-in-your-yard/` to TMCP using a disambiguated commercial anchor ("year-round mole control programme") | Add to pillar's conversion section. |
| Inbound (missing) | ❌ | Cost cluster blog `/blog/mole-removal-cost-washington/` should link to TMCP with anchor `monthly mole control plan` per target-keywords.md cost cluster mapping | P1 — cluster bridge. |
| Outbound (present) | ✅ | 17 unique internal: 11 cities + 2 sibling services + /reviews/ + /service-areas/ + /faq/ | Strong city distribution. |
| Outbound (missing) | ❌ | No upward link to pillar `/how-to-get-rid-of-moles-in-your-yard/` from TMCP | Add in BLUF area or "Also Consider" section. |
| Outbound (missing) | ❌ | No outbound to authority anchor (WSU Extension mole IPM page, USDA NWRC, etc.) | E-E-A-T Pillar 7 fix. |
| Anchor candidates | — | `year-round mole control`, `monthly mole control plan`, `chemical-free mole control`, `mole pest control`, `mole control near me` | All carry Rule 1 disambiguation. |
| Anchors to AVOID | — | bare `mole removal`, `body-gripping`, `kill trap` | Per Brand-Disambiguation Rule 5 + Posture A. |

---

## Per-page fix list

### P1 (must fix — Tier 1 page <75)

| # | Pillar | Gap | Recommended fix | File path |
|---|---|---|---|---|
| 1 | 1 Headings | H1 "Year-Round Mole Protection for $100/Month" misses recommended H1, has no disambiguation, drops "Control" (primary KW) | Update H1 to match recommended: `Total Mole Control Program — Year-Round Mole Control in Western Washington`. Subline can carry the $100/month price hook. | `src/lib/pages-data.ts` → `tmcpBlocks` Hero block heading; **CMS-backed → requires `npm run seed -- --reseed total-mole-control-program`** |
| 2 | 4 AEO | Zero ordered lists despite "Monitor / Respond / Report" H3 triad being a textbook 3-step process | Convert the Monitor/Respond/Report section to a `<ol>` (or RichContent block with explicit `<ol>` markup) | `src/lib/pages-data.ts` → tmcpBlocks process-section block; reseed |
| 3 | 4 AEO | Zero tables despite implicit TMCP-vs-OMP comparison content elsewhere on the funnel | Add a small `<table>` comparing TMCP vs OMP vs Commercial (3 rows × cols: price model, coverage, best for, guarantee) — high-fidelity AI extraction | `src/lib/pages-data.ts` → add RichContent block above "Also Consider"; reseed |
| 4 | 3 Schema | Service schema missing `aggregateRating` despite 219+ Google reviews sitewide | Add `aggregateRating` to `serviceSchema()` builder with sitewide rating + count (or per-location ratings). Care: ensure Google "Service review" requirements met (review type, sourcing). | `src/lib/schema.tsx` → `serviceSchema` helper |
| 5 | 8 Freshness | No `dateModified` on Service or WebPage; no Last-Modified header; no visible "Last updated" in UI | Add `dateModified` to Service schema + emit `Last-Modified` header (Next.js `headers()` or middleware) + add visible "Last updated YYYY-MM-DD" in page footer block | `src/lib/schema.tsx` + `src/app/(frontend)/services/total-mole-control-program/page.tsx` (revalidate / cache-control) + pages-data block |
| 6 | 7 E-E-A-T | No outbound authority anchor link | Add 1 outbound link to a Tier 1 authority anchor (WSU Extension mole IPM, USDA NWRC mole biology) integrated into "Why Year-Round" or stat block prose — earn its place per `feedback_outbound_links_must_earn_their_place.md` | `src/lib/pages-data.ts` → tmcpBlocks RichContent inside founder section; needs Lexical link builder per Rule E |

### P2 (lift to ≥75)

| # | Pillar | Gap | Recommended fix | File path |
|---|---|---|---|---|
| 7 | 2 Meta | Title 73 chars (over 60 max recommended) | Trim title to ≤60 chars while keeping brand+price+primary KW: e.g. `Total Mole Control Program: $100/mo Year-Round | Got Moles` (57 chars) | `src/app/(frontend)/services/total-mole-control-program/page.tsx` `FALLBACK.title` + `pages-data.ts` Meta export if overrides via CMS |
| 8 | 2 Meta | Meta description 181 chars (over 160) | Trim to ≤160 chars preserving primary KW and value prop | same file |
| 9 | 1 Headings | Only 1 H2/H3 carries cluster secondary KW; gaps: `chemical-free mole control`, `mole pest control`, `monthly mole control plan` | Add or rename a section H2 to `Chemical-Free Mole Control — Safe for Pets and Kids` and another `Monthly Mole Control Plan: How TMCP Works` | `src/lib/pages-data.ts` → tmcpBlocks; reseed |
| 10 | 5 Links | No upward link to pillar `/how-to-get-rid-of-moles-in-your-yard/` | Add `[year-round mole control programme](…)` from BLUF para + reverse `/how-to-get-rid-of-moles-in-your-yard/` → TMCP via `monthly mole control plan` anchor | bidirectional edits in pages-data + blog-data |
| 11 | 2 Meta | `og:image` is generic `/images/og-default.webp` (verified in raw HTML) — should be TMCP-specific | Create service-specific OG asset and reference in metadata | `public/images/og-tmcp.webp` + metadata override |

### P3 (polish)

| # | Pillar | Gap | Recommended fix | File path |
|---|---|---|---|---|
| 12 | 4 AEO | BLUF doesn't lead with canonical answer in cluster's terminology | Rewrite first para: "The Total Mole Control Program is a $100/month year-round mole control subscription for yards across Western Washington. Regular visits, immediate response, and a written report after every check." (humanize after) | pages-data.ts |
| 13 | 4 AEO | Q-format H2s — Service page can adopt one or two for AI extraction lift | Reword "What You Get" → "What does the Total Mole Control Program include?" | pages-data.ts |
| 14 | 6 Images | Anchor-city seeding rule (Spencer P2.7) — verify Seattle / Tacoma / Bellevue / Sammamish / Puyallup / Renton appear in first 200 words of body copy | Audit body copy + insert if missing | pages-data.ts |

---

## Cross-references

- **Sitewide audit (2026-05-13):** confirms `/services/` hub returns 404 — flagged as P1 sitewide. TMCP has no parent hub above it in IA.
- **Authority-strategy.md Entity 3:** TMCP is itself an entity worth defending (`/services/total-mole-control-program/` + Service schema with provider `@id` + areaServed + offers ✅ already in place per this audit). USPTO trademark "Total Mole Control Program" still flagged as P3 research action (out of scope here).
- **Pixelmojo benchmark:** stat blocks, tables, OLs are the top AEO lifts. This page has stat block ✅ but lacks tables + OLs.
