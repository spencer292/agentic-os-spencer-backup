---
site: got-moles.com
date: 2026-05-09
sitewide_score: n/a (single-page audit)
pages_audited: 1
fixes_p1: 9
fixes_p2: 5
fixes_p3: 3
hallucination_correction_progress: 1/4 (schema correct; copy still 70+ communities / 4 counties)
status: draft
---

# Got Moles On-Page Audit — Homepage `/`

Tier 1 audit. Target ≥90/100. Per L2 onpage-audit-sweep brief — homepage was queued NEXT after /about/ (95.5/A). Per-page review pattern: this report presents findings; no fixes applied until approved.

---

## https://got-moles.com/

### Foundation-doc lookup (Rule F)

Source: `clients/got-moles/brand_context/target-keywords.md` v1.1 — Tier 1 row line 434, Brand-Disambiguation Rule 1, Brand Defense Strategy lines 76-90, Anchor-city seeding rule line 90, queries-to-avoid lines 57-68. Cross-ref `brand_context/authority-strategy.md` canonical_facts (lines 12-17).

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | **Yard mole control + mole exterminator Western Washington** (dual-anchor, line 434) | H1 + title carry `mole control` + `Western Washington` only — `Yard` and `exterminator` MISSING | ❌ both missing |
| Recommended H1 | **"Yard Mole Control in Western Washington"** (Spencer P2.4, line 434) | `Mole Control in Western Washington` | ❌ missing `Yard` prefix (Spencer P1 lawn-signal) |
| Recommended title | **"Yard Mole Control & Exterminators in Western Washington \| Got Moles"** (line 434) | `Mole Control in Western Washington \| Got Moles` (46 chars) | ❌ missing `Yard` AND `Exterminators` (both Spencer P1 KWs) |
| Disambiguation signal (Rule 1: lawn/yard/exterminator/Washington/city/brand) | Per Rule 1, must include yard/lawn/exterminator on this page (it targets the ambiguous "mole" head term) | `Western Washington` + `Got Moles` brand present in H1; `yard`/`exterminator` missing | ⚠️ partial — geo + brand only, no lawn/yard/exterminator signal in H1 |
| Secondary cluster KWs (≥2 in H2/H3) | mole-control cluster: `mole exterminator`, `yard mole removal`, `professional mole removal`, `mole trapping`, `Total Mole Control Program` | H2 "What Is Professional Mole Control?" carries `professional mole control` ✅. H3s carry "Total Mole Control Program", "One-Time Mole Removal", "Commercial Mole Control" ✅. NONE carry `yard mole`, `mole exterminator`, `lawn mole` | ⚠️ partial — 2 secondary surface, but `yard`/`exterminator` not in any H2/H3 |
| Anchor-city seeding rule (line 90) — Seattle/Tacoma/Bellevue/Sammamish/Puyallup/Renton in **first 200 words** | All 6 cities required in first 200 words of homepage body | First ~200 words after H1 (hero subhead + trust strip + GEO definition + BLUF opening) — **0 of 6 cities named.** Cities only appear in service-area block at the bottom of the page | ❌ rule violated |
| Queries-to-avoid (lines 57-68: derm/cosmetic/medical/pop-culture clusters) | Scan title, H1, all 8 H2s, 14 H3s, body | Zero matches across H1, title, H2/H3, body | ✅ none present |
| Canonical fact: areaServed (authority-strategy line 14) | **6 counties (King, Pierce, Snohomish, Thurston, Kitsap, Lewis), 92+ communities** | Schema (LocalBusiness) ✅ correct. **Visible copy: "70+ communities", "King, Pierce, Thurston & Snohomish Counties"** (4 counties) — both stale | ❌ schema/copy divergence; copy still carries 4-county / 70+ hallucination per `reference_got_moles_canonical_facts.md` |

### Live verification (Rule C)

Live HTML extracted via `_audit-tools/fetch-home-schema.mjs` (created this run, mirrors `/about/` pattern).

- **HTML length:** 115,792 chars
- **Response headers:** `cache-control: public, max-age=0, must-revalidate`, `x-vercel-cache: HIT`. **No `last-modified` header** (Vercel SSG default). `x-vercel-id: lhr1::5sspr-1778339749850`
- **Meta:** title 46 chars (under target 50-60), description 160 chars ✅, canonical `https://got-moles.com` (no trailing slash — minor inconsistency with rendered URL), og:title/og:description/og:image/twitter:card all present
- **Headings:** 1 H1 ✅, 8 H2s, 14 H3s. No skipped levels.
- **Schema:** **4 JSON-LD blocks** parsed (vs 7 on /about/):
  1. Organization (`@id: ...#organization`) — sameAs ×8 (3 GBP map URLs + Facebook, Instagram, LinkedIn, Yelp, Nextdoor), knowsAbout ×8, hasOfferCatalog with 3 priced services ✅
  2. WebPage — bare. **Missing the Speakable cssSelector that `page.tsx` lines 40-43 add to `autoSchema`.** Page.tsx merges `customSchema` from CMS schema field via spread, **the CMS schema field is overriding/replacing the auto Speakable**. Bug.
  3. LocalBusiness (`@id: ...#business`) — full with 3 `department[]` branches (Enumclaw / Seattle / Tacoma), aggregateRating 5.0 / 219 reviews, areaServed `description: "Western Washington — King, Pierce, Snohomish, Thurston, Kitsap, and Lewis Counties (92+ communities)"` ✅ correct
  4. WebPageElement — Speakable for `#geo-definition` only ✅
- **Schema GAPS vs /about/:** ❌ no BreadcrumbList (Pixelmojo flagged); ❌ no FAQPage (Pixelmojo flagged); ❌ WebPage Speakable lost via CMS override; ❌ no Article schema with dateModified; ❌ no Person schema reference / link to Spencer
- **Images:** 3 imgs total (logo ×2, hero ×1). Hero rendered with `data-nimg="fill"` + `sizes="100vw"` — confirms HeroBlock.tsx line 60 `priority` prop wired (`fill` + `priority` + `sizes` all present in source). **However raw img tag has NO explicit `fetchpriority="high"` or `loading="eager"` attribute** — Next 16 may emit preload via `<link rel="preload">` instead. Source has `priority`; runtime emission of explicit `fetchpriority` attr unverified but `priority` IS set in component (HeroBlock.tsx:60). Acceptable.
- **Internal links:** 40 total, 29 unique. Includes 8 Tier-1 paths + 12 city anchors + footer nav. **City anchors lack trailing slashes** (`/mole-control-sammamish` vs canonical `/mole-control-sammamish/` per target-keywords.md Tier 3 pattern line 457) — minor 301-hop risk; verify against redirect map.
- **External links:** 0 (no outbound to authority anchors — WSU/WDFW/AVMA/etc. per authority-strategy.md Section 2)
- **Canonical-fact verification (raw grep):** `92+` present (in schema only); `70+` present (in copy); `King, Pierce, Thurston & Snohomish` present (4-county string in serviceArea block); `Kitsap` present (only in LocalBusiness schema areaServed.description). Body copy carries the older 4-county / 70+ communities figures — out of sync with corrected schema.
- **Visible "Last updated" string:** ❌ MISSING

### Three-Layer SoT (Rule A)

- **Live render:** got-moles.com/ — `x-vercel-cache: HIT`, build `dpl_6yxpWeXShcrkq91gqAPLChDKEDze`
- **HEAD:** last site code commit `9409f8f` (sitewide HeroBlock alt smart-detection, 2026-05-09)
- **Working tree:** divergent on `src/app/(frontend)/page.tsx` + `src/lib/pages-data.ts` (per heartbeat git status). These are the homepage files. **Working-tree edits were noted in `/about/` audit as "homepage hero changes" — but this homepage audit is against the live render, which reflects HEAD `9409f8f`, not the working-tree edits.** Before any apply-fixes commit, reconcile working-tree with this audit's fix list — either fold pending edits in or stash them. Don't ship working-tree changes blind.
- **CMS:** Homepage is CMS-backed via `getCmsPageContent('/')`. The block-data source of truth is the seeded Payload page, NOT directly `homepageBlocks` in `pages-data.ts`. **Any block fix requires `npm run seed -- --reseed /` to deploy to live.** Schema field on CMS Page record is overriding the auto WebPage schema (gap #4 below) — needs investigation in CMS admin OR removal of `customJsonLd` for homepage.

Working-tree divergence on homepage files = **must reconcile before apply-mode**. This is the gating condition Rule A flags.

### Pillar scores

| # | Pillar | Wt | Score | Notes |
|---|---|:-:|:-:|---|
| 1 | Headings | 20% | 14/20 | Foundation-doc rows 2+3+5: H1 missing `Yard` prefix (Spencer P1 KW). H2/H3 carry `professional mole control` + 3 service H3s ✅, but no `yard mole`, `mole exterminator`, `lawn mole` H2/H3. Single H1 ✅, no skipped levels ✅. |
| 2 | Meta + Canonical | 10% | 7.9/10 | Title 46 chars (under target 50-60) — Pixelmojo crawl tool flagged "review title length"; Spencer P1 recommends 70-char `Yard Mole Control & Exterminators in Western Washington \| Got Moles`. Description 160 chars ✅. Canonical lacks trailing slash. og:* + twitter:card complete. |
| 3 | Schema | 15% | 8/15 | Live verification: 4 blocks vs /about/'s 7. Org+LocalBusiness excellent (sameAs×8, knowsAbout×8, hasOfferCatalog, 3 dept branches, aggregateRating). **Missing: BreadcrumbList (Pixelmojo P1), FAQPage (Pixelmojo P1), Article+dateModified, Person reference, Speakable on WebPage (CMS override stripped it).** WebPageElement Speakable on geo-def only. |
| 4 | Content AEO | 20% | 8.8/20 | Foundation-doc row 6+8: zero queries-to-avoid ✅, BLUF answer-first ✅, ordered list (steps 01-04) ✅, 2 question-format H2s. **Missing: StatBlock (Pixelmojo P1), comparison Table for 3 services (Pixelmojo P1), verified-fact callout for 92+ communities/6 counties (current copy still 70+/4 counties — hallucination on a Pixelmojo-flagged surface), anchor-city seeding rule violated (0 of 6 cities in first 200 words).** |
| 5 | Internal Links | 15% | 11.9/15 | 29 unique internal, links to all 8 Tier-1 + 12 cities + footer. Hub-spoke alignment ✅. -1 for city anchors lacking trailing slash (canonical pattern is trailing-slash per Tier 3 spec line 457). -1.1 for anchor diversity (city anchors are bare names not "Mole Control [City]" per Rule 5). No cannibalisation-loser links. |
| 6 | Images | 5% | 4.4/5 | HeroBlock.tsx:60 `priority` prop confirmed in source; runtime HTML has `fill` + `sizes="100vw"` ✅. Hero alt "Mole Control in Western Washington" descriptive (matches H1, post-9409f8f smart-alt pattern). Logo lazy ✅. og:image present. -0.6 for `fetchpriority` attribute not explicit in raw HTML (preload behaviour unverified). |
| 7 | E-E-A-T | 10% | 3/10 | Founder named in Org+LocalBusiness schema ✅. Veteran credential in LocalBusiness `founder.description` ✅. **Missing: founder quote on homepage (TMCP has one), link to /author/spencer/ from homepage body, ANY outbound link to authority anchor (WSU/WDFW/AVMA/etc. per authority-strategy.md Section 2 — required per Pillar 7 spec).** |
| 8 | Freshness + Disambiguation | 5% | 0.6/5 | No dateModified anywhere (no Article schema; WebPage bare). No `Last-Modified` HTTP header. No visible "Last updated {date}" string. Pixelmojo AEO 27/F flagged this as P1. Disambiguation: H1+title carry `Western Washington` + brand only — Rule 1's stronger lawn/yard/exterminator signal absent. |

**Weighted score: 58.6/100 (D+ — Poor)**

Tier 1 target ≥90. **Gap: 31.4 points.** Fully recoverable — most gaps are Pixelmojo's already-known AEO flags (Speakable, StatBlock, Table, FAQPage, BreadcrumbList, dateModified) plus one foundation-doc gap (`Yard`/`Exterminators` in H1+title) plus the canonical-facts hallucination on visible copy. None require new content; all are surgical edits to `homepageBlocks` + `homepageMeta` + `schema.tsx` builder + CMS Page schema field.

Note this homepage scores 36 points lower than /about/ — most of that delta is in Pillars 3, 4, 7, 8. /about/ has all four covered (BreadcrumbList, FAQPage, dateModified, founder quote, Person schema reference, AboutPage Speakable). Homepage has none of those. The /about/ patch playbook applied to homepage is the obvious path to ≥90.

### Per-page fix list

| P | Pillar | Gap | Recommended fix | File / surface |
|---|---|---|---|---|
| **P1** | Headings | H1 missing `Yard` prefix (Spencer P1 KW) | Change H1 from `"Mole Control in Western Washington"` → `"Yard Mole Control in Western Washington"` | `pages-data.ts` `homepageBlocks[0].heading` + reseed `/` |
| **P1** | Meta | Title missing `Yard` + `Exterminators` (both Spencer P1) | Change title from `"Mole Control in Western Washington \| Got Moles"` (46 chars) → `"Yard Mole Control & Exterminators in Western Washington \| Got Moles"` (~70 chars per Spencer line 434) | `pages-data.ts` `homepageMeta.title` |
| **P1** | Content AEO | Anchor-city seeding rule violated — 0 of 6 cities in first 200 words | Insert `Seattle, Tacoma, Bellevue, Sammamish, Puyallup, Renton` naturally into hero subheading OR geoDefinition OR BLUF first paragraph. Recommended: extend geoDefinition copy with `"...serving homeowners in Seattle, Tacoma, Bellevue, Sammamish, Puyallup, Renton, and 86 other communities..."` | `pages-data.ts` `homepageBlocks[1].content` (geoDefinition) |
| **P1** | Content AEO | Canonical-fact hallucination on visible copy: "70+ communities" / "King, Pierce, Thurston & Snohomish Counties" (4 counties) | Update to canonical "92+ communities" + 6 counties (King, Pierce, Snohomish, Thurston, Kitsap, Lewis). Schema is already correct; copy must catch up | `pages-data.ts` geoDefinition `content`, featureGrid "Veteran-Owned" item description (`70+ communities`), serviceArea `heading` (`Serving 70+ Communities...`) + `countyText` (`King, Pierce, Thurston & Snohomish Counties`) |
| **P1** | Schema | No BreadcrumbList — Pixelmojo P1 (homepage = root, but BreadcrumbList for "Home" still emitted on /about/, /services/*, /blog/* sitewide) | Add BreadcrumbList to homepage page.tsx OR confirm site-pattern (single Home item) — verify what /about/'s breadcrumb emission does for the homepage | `src/app/(frontend)/page.tsx` + `src/lib/schema.tsx` builder |
| **P1** | Schema | No FAQPage on homepage — Pixelmojo P1 (high-citation surface) | Add a 4-6 question FAQ block to homepage (similar to /about/'s 6-question FAQ). Suggested questions: "What does Got Moles do?", "How much does mole control cost in Washington?", "Are your methods chemical-free?", "Do you serve my city?", "What's the difference between TMCP and one-time removal?", "Are you veteran-owned?". FAQPage schema auto-emits via existing FAQ block pattern | `pages-data.ts` add FAQ block to `homepageBlocks` (between Why Got Moles + Testimonials) |
| **P1** | Schema | WebPage Speakable lost via CMS override (page.tsx adds it, but customSchema spread strips it) | Either (a) check CMS Page record schema field — if customJsonLd has WebPage with no Speakable, append cssSelector OR remove customJsonLd so auto-schema wins; OR (b) change page.tsx merge order so autoSchema's speakable survives spread (`{...customSchema, speakable: autoSchema.speakable}`) | `src/app/(frontend)/page.tsx` line 55 OR Payload admin Page record `/`'s schema field |
| **P1** | Content AEO | No StatBlock — Pixelmojo P1 (high-citation surface, AEO 27/F driver) | Add `stats` block (same pattern as TMCP page line 1354-1364): `5,000+ Properties · 219+ Five-Star Reviews · 8 Years One Species Focus · 0 Chemicals Used`. Place between BLUF and painPoints | `pages-data.ts` add `{blockType: 'stats', ...}` to homepageBlocks |
| **P1** | E-E-A-T | No outbound link to any authority anchor (Pillar 7 spec requires ≥1 per relevant cluster, authority-strategy.md Section 2) | Add at least one inline outbound link in BLUF or Why Got Moles. Cluster 1 anchor: WSU Extension mole fact sheet (cite-as-source). Anchor format: cite as inline link without no-follow | `pages-data.ts` BLUF block `richContent` |
| P2 | Content AEO | No comparison Table for 3 services — Pixelmojo flagged Table extractability | Convert featureGrid "One Problem. Three Ways" into HTML table OR add a small comparison table after the featureGrid (Service / Price / Best for / Frequency) | `pages-data.ts` — add new richContent block with table markup OR new block type |
| P2 | E-E-A-T | No founder quote on homepage (TMCP has one — line 1372-1375) | Add Spencer Hill quote block to Why Got Moles section. Pattern: `"Across nearly 5,000 Western Washington properties, the homeowners who solve mole problems permanently treat it as ongoing maintenance, not a one-time cleanup." — Spencer Hill, Founder` | `pages-data.ts` Why Got Moles featureGrid → add quote richContent before/after |
| P2 | E-E-A-T | No link to /author/spencer/ from homepage | Add inline link in founder credit (Why Got Moles "Veteran-Owned. Community-Built." item). Anchor: `Spencer Hill` → `/author/spencer/` | `pages-data.ts` featureGrid item description |
| P2 | Freshness | No visible "Last updated {date}" string | Add visible "Last updated May 2026" footer in geoDefinition or near footer (same pattern as /about/) | `pages-data.ts` or page.tsx footer |
| P2 | Freshness | No Article/dateModified or WebPage `dateModified` | Add `dateModified` to autoSchema in page.tsx (same pattern as Article pages) | `src/app/(frontend)/page.tsx` |
| P3 | Internal Links | City anchors missing trailing slash | Update `homepageBlocks[serviceArea].cities[].url` to add trailing slashes per Tier 3 canonical pattern | `pages-data.ts` serviceArea cities array |
| P3 | Meta | Canonical `https://got-moles.com` (no trailing slash) inconsistent with rendered URL `/` | Update buildMetadata canonical resolution to ensure trailing slash for root | `src/lib/cms-page.ts` buildMetadata function |
| P3 | Internal Links | Anchor diversity — city anchors are bare names | Update city anchor text from `Sammamish` → `Mole Control Sammamish` (per Rule 5 anchor-text matters) | `pages-data.ts` serviceArea — display logic in ServiceAreaBlock |

### Score recovery projection

Applying the 9 P1 fixes above:
- Pillar 1: 14 → 19 (`Yard` H1 fix)
- Pillar 2: 7.9 → 9.5 (title fix)
- Pillar 3: 8 → 13 (BreadcrumbList + FAQPage + Speakable rescue)
- Pillar 4: 8.8 → 17.5 (StatBlock + canonical-facts copy fix + anchor-city seeding)
- Pillar 7: 3 → 7 (outbound authority link, Spencer quote with link)

Projected post-P1: **~75/100 (B-)**

Adding P2 fixes (table, founder quote on homepage, /author/spencer/ link, dateModified, visible last-updated): **~92/100 (A-)** — clears Tier 1 ≥90 target.

P3 fixes are polish to push toward 95+ (matching /about/).

---

## Apply-mode handoff

**Recommended apply order** (per The Only Flow, Rule B):

**Commit 1 — P1 copy + meta (lowest risk, no schema change):**
1. `homepageMeta.title` + H1 (`Yard` + `Exterminators`)
2. Canonical-facts copy fix (geoDefinition, serviceArea heading + countyText, featureGrid Veteran item — every "70+" → "92+", every "4 counties" → "6 counties (King, Pierce, Snohomish, Thurston, Kitsap, Lewis)")
3. Anchor-city seeding (extend geoDefinition with 6 cities)
4. Run tool-humanizer deep on all new prose (ZERO em dashes per humanizer Rule #1)
5. `npx next build` → reseed `/` → backup-checkout-reapply if working-tree divergence persists → commit + push to `mine`

**Commit 2 — P1 new blocks (schema-affecting):**
6. Add StatBlock to homepageBlocks
7. Add FAQ block (6 questions) to homepageBlocks
8. Add inline outbound authority link in BLUF
9. Build → reseed → commit + push

**Commit 3 — P1 schema (page.tsx + schema.tsx):**
10. BreadcrumbList add to schema.tsx + page.tsx
11. WebPage Speakable rescue (page.tsx merge order OR Payload schema field cleanup)
12. Build → no reseed needed (schema is route-level not block-level) → commit + push

**Commit 4 — P2 polish:**
13. Founder quote block + /author/spencer/ inline link
14. Comparison table block
15. Visible "Last updated" + WebPage dateModified
16. Build → reseed → commit + push

**Verification after each commit:** WebFetch + raw-HTML extraction on staging URL via `_audit-tools/fetch-home-schema.mjs`. Check schema block count climbs from 4 → 6+ (Org, WebPage with Speakable, LocalBusiness, BreadcrumbList, FAQPage, WebPageElement).

**Working-tree reconciliation gate:** Before Commit 1, deal with the divergent `page.tsx` + `pages-data.ts` working-tree edits flagged in heartbeat git status. Read what's there. If those edits are aligned with this audit's fix list, fold them in. If they're unrelated, use backup-checkout-reapply per Rule D.

**Monitor window:** 7-14 days post-deploy before next high-risk Tier 1 page (services pages or cornerstone) — per L2 brief sequencing rule 4.

---

## Self-check (Rule G)

- [x] Foundation-doc lookup section present + populated (8 rows, includes anchor-city + canonical-fact rows)
- [x] Live verification section present (schema count 4 vs /about/ 7, component path read for HeroBlock, raw-HTML grep for canonical facts + FAQ + Breadcrumb + Article + Last-updated)
- [x] Three-Layer SoT section present — divergent working tree flagged as gating condition for apply-mode
- [x] Pillar scores reference evidence sections
- [x] Per-page fix list with explicit file paths (9 P1 + 5 P2 + 3 P3)
- [x] Apply-mode handoff with commit sequencing
- [x] Score recovery projection

Report passes self-check. Saved.
