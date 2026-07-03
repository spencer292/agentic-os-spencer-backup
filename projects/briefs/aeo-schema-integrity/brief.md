---
project: aeo-schema-integrity
status: active
level: 3
created: 2026-05-20
parent: website-rebuild-rebrand
---

# AEO Schema Integrity & Extractability — Got Moles

Fix schema duplication bugs, establish schema discipline rules, improve AEO extractability across the entire site, and update the playbook so future pages are built correctly from day one.

## Problem statement

The Got Moles site has strong schema foundations (28 types, 9/10 on Pillar 2) but poor schema discipline and weak AEO extractability. This creates three compounding problems:

1. **Duplicate/competing schemas** — Multiple pages emit two FAQPage schemas (page-level `faqSchema()` + FAQBlock component auto-emission). The /services/ page has three competing page-type schemas (WebPage, CollectionPage, FAQPage). Google expects one primary type per URL.

2. **AEO extractability gaps** — Pixelmojo Radar 68/C (AEO 40/D, Answer 40/D). Zero HTML tables or ordered lists across 10 audited pages. Answer paragraphs over 100 words (AI engines prefer 40-60). No TL;DR boxes. No visible "Updated 2026" freshness markers. The schema is solid but the content it wraps isn't structured for extraction.

3. **Playbook doesn't prevent this** — PAGE-BUILD-REFERENCE.md Gotcha #7 is misleading about `generateSchema`. No rule for "one primary page-type per URL." No validation step for duplicate schemas. Every new page built from this playbook repeats the mistakes.

## Success criteria

- Pixelmojo Radar score: 68/C → 85+/A (or as close as achievable given external factors like hallucination lag)
- Zero duplicate schema types on any page (verifiable via Google Rich Results Test)
- Every page has exactly one primary page-type schema
- PAGE-BUILD-REFERENCE.md and BUILD-METHODOLOGY.md updated with schema discipline rules
- AEO extractability improvements on all Tier 1 pages (services, cornerstones, city template)
- Re-baseline audit confirms improvements

## Current state (starting scores)

| Metric | Score | Date | Source |
|--------|-------|------|--------|
| Pixelmojo Radar overall | 68/C | 2026-05-13 | audit-rollup |
| Pixelmojo AEO sub-score | 40/D | 2026-05-13 | audit-rollup |
| Pixelmojo Answer sub-score | 40/D | 2026-05-13 | audit-rollup |
| Pixelmojo Citation sub-score | 44/D | 2026-05-13 | audit-rollup |
| Pixelmojo Hallucination | 20/F | 2026-05-13 | audit-rollup |
| AEO audit overall | 7.0/10 | 2026-05-02 | aeo-audit-2026 brief |
| Schema & Structured Data (Pillar 2) | 9/10 | 2026-05-02 | aeo-audit-2026 brief |
| Content Structure (Pillar 3) | 7.5/10 | 2026-05-02 | aeo-audit-2026 brief |

## Known issues (from investigation 2026-05-19 and 2026-05-20)

### Duplicate FAQPage schema (confirmed)

| Page | Page-level faqSchema() | Block generateSchema | Result |
|------|:---:|:---:|---|
| /about/ | YES (aggregates blocks) | true in pages-data.ts | DUPLICATE |
| /reviews/commercial-case-studies/ | YES (extracts from block) | true | DUPLICATE |
| /services/ | NO | true | OK — but has competing webPageSpeakable |
| /faq/ | YES (aggregates 5 blocks) | false (already fixed) | OK |

### Competing page-type schemas

- /services/ emits WebPage (speakable) + CollectionPage + FAQPage — three page-types
- Fix: remove webPageSpeakable, CollectionPage is primary, FAQPage is secondary (valid)

### Schema gaps from audit rollup (P1-P2)

- P1-2: dateModified + aggregateRating missing on Service nodes (96 pages)
- P1-3: City page template missing parentOrganization, Person ref, authority anchors
- P1-6: Spencer Person sameAs empty (blocked on Spencer providing LinkedIn URL)
- P2-6: OMP Service schema incomplete (priceSpecification) — warranty removed, no formal warranty offered

### AEO extractability gaps from audit rollup

- P1-1: Lexical builder has no table or ordered list block types (0 tables, 0 ol across site)
- P2-2: Service page H1s missing primary keyword + geo
- P2-3: Process triads on service pages should be `<ol>`, comparisons should be `<table>`
- P2-4: Blog title template adds 30-40 chars (double brand suffix)
- P2-5: Blog posts promise comparison tables in H2s but don't deliver them
- No TL;DR/BLUF visual component
- No "Updated 2026" freshness markers on cornerstones

### Supabase/Payload CMS impact

The `generateSchema` flag is stored in Supabase via Payload CMS. Changing `pages-data.ts` alone does NOT fix pages already seeded — the CMS version in Supabase takes priority. Every schema fix requires either:
- Re-seeding the affected page (`npm run seed -- --reseed {slug}`)
- Running a fix script against the Payload API (like the existing `fix-faq-schema-flags.ts`)

## Constraints

- Spencer must provide LinkedIn URL before Person sameAs can be fixed
- Spencer must confirm free-inspection language before 36 occurrences can be audited
- Pixelmojo has 9 runs remaining (used 1 of 10) — use strategically for verification
- AI engine hallucination correction has weeks-to-months lag after content changes
- No localhost dev — verify everything on Vercel staging
- US English spelling for all content

## Existing artifacts to consume

| Artifact | Path | What it provides |
|----------|------|-----------------|
| AEO audit (7-pillar) | projects/briefs/aeo-audit-2026/brief.md | Baseline scores, P0/P1/P2 roadmap |
| Pixelmojo baseline | projects/briefs/aeo-p0-content/baseline-pixelmojo-2026-05-03.md | Sub-scores, hallucination list, action items |
| Audit rollup | projects/str-ai-seo-local/2026-05-13_audit-rollup.md | P1-P3 fix list ranked by impact, execution order |
| GEO citation strategy | projects/briefs/website-rebuild-rebrand/2026-04-02_geo-citation-strategy.md | Platform-specific preferences, citation factors |
| Schema plan | projects/briefs/website-rebuild-rebrand/phase-2-schema-plan.md | Original 28-type schema design |
| PAGE-BUILD-REFERENCE.md | projects/briefs/website-rebuild-rebrand/PAGE-BUILD-REFERENCE.md | Current playbook (needs updating) |
| BUILD-METHODOLOGY.md | projects/briefs/website-rebuild-rebrand/BUILD-METHODOLOGY.md | Master build process (needs updating) |
| 10 page-level audits | projects/str-onpage-audit/2026-05-13_*.md | Per-page scores and fix lists |

## Research needed (for GSD research phase)

Fresh 2026 research on:
- Current Google guidelines for schema per page (one vs multiple page-types)
- FAQPage schema — is it still worth having post-2024 deprecation rumors?
- AEO extractability best practices (table/list structure, answer paragraph length)
- Pixelmojo scoring methodology (what specifically moves each sub-score)
- Speakable schema — current support across AI engines
- TL;DR/BLUF patterns that AI engines actually extract from
- HTML table vs CSS grid — which do AI crawlers extract better?

## Out of scope

- Wikidata entity strategy (separate brief exists)
- Paid ads / landing pages
- Contact form handler, tracking IDs, favicon (Phase 5 remainders — separate)
- City page content overhaul beyond template-level changes
- New blog post creation
- Phase 6 pre-launch items (CWV test, Spencer sign-off, DNS switch)
