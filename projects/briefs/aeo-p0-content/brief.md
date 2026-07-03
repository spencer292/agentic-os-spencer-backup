---
project: aeo-p0-content
status: active
level: 2
created: 2026-05-03
parent: aeo-audit-2026
---

# AEO P0 Content Enhancement — Tier 2 Citation-Target Pages

L2 sub-project of `aeo-audit-2026`. Execute audit P0 items #1, #2, #3, #4 (freshness markers + Spencer-attributed expert quotes + proprietary stats + citation schema) on the 9 highest-leverage citation-target pages.

## Goal

Concentrate AEO/GEO authority signals on the 9 pages where Got Moles WANTS to be cited by AI engines (Cornerstones, services, About). Skip site-wide signal pollution. Per Princeton GEO study + 2026 AEO research consensus: AI engines reward concentration on topic-specific pages, not site-wide enhancement.

Material outcome: measurable lift in AI citation rate (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews) for the 9 pages within 30-60 days.

## Strategic logic — tiered approach

Not every page needs full per-page AEO treatment. Doing it everywhere dilutes power.

| Tier | Page types | Treatment | Why |
|---|---|---|---|
| **Tier 1 — Foundational** | All 151 pages | Schema, llms.txt, AI bot allowlist, canonical/OG/Twitter, BLUF on cornerstones | Already done — yesterday's commits closed last gaps |
| **Tier 2 — Citation targets (THIS PROJECT)** | 9 pages: 5 cornerstones + 3 services + About | Full Spencer quotes, citation schema, proprietary stats, freshness markers, TL;DR, FAQ schema | Pages we WANT cited. Concentrate authority signals. |
| **Tier 3 — Conversion pages** | 4 LPs, contact, decision-stage blog | Foundational only. Skip Spencer callouts. | Job is to convert, not be cited. Different optimization. |
| **Tier 4 — Local/geo pages** | 100+ city pages, service-areas | LocalBusiness + NAP + city-specific. Skip Spencer callouts. | Job is local discovery (GBP, near-me), not topic authority. |
| **Tier 5 — Utility** | Privacy, terms, sitemap | Foundational only | Not citation candidates. |

## AEO + GEO integration

**The terms have largely merged in 2026** — most sources use them interchangeably. Subtle distinction:
- **AEO** = answer engines (Featured Snippets, AI Overviews) — emphasizes Q&A schema, position-zero formatting, BLUF
- **GEO** = generative engines (ChatGPT, Perplexity, Claude, Gemini) — emphasizes original research, citation-worthy content, brand entity, E-E-A-T

This project covers both. Per-deliverable mapping:
- Spencer-attributed quotes = **GEO** lever (citation-worthy unique content)
- Citation schema on sources = **GEO** (machine-readable source attribution)
- FAQPage schema = **AEO** (position-zero candidate)
- Freshness markers = both
- Proprietary stats = **GEO** (unique data AI engines reward)
- TL;DR boxes = **AEO** (extractable answer block)

## Scope — 9 pages

### Cornerstones (5) — high informational query value
1. `/what-do-moles-eat/` (102 KW historical value)
2. `/voles-vs-moles-whats-the-difference/` (80 KW)
3. `/do-moles-hibernate/` (35 KW)
4. `/how-to-get-rid-of-moles-in-your-yard/` (3 KW + content authority)
5. `/blog/types-of-moles-in-washington/` (cornerstone, no MERGE)

### Service pages (3) — decision-stage commercial intent
6. `/services/total-mole-control-program/`
7. `/services/one-time-mole-removal/`
8. `/services/commercial-mole-control/`

### About page (1) — E-E-A-T anchor for whole site
9. `/about/`

## Per-page deliverables

For each of the 9 pages, ship:

| Element | Source | Treatment |
|---|---|---|
| **2-3 Spencer-attributed expert quotes** | `brand_context/technician-field-guide-INTERNAL.md` (the public-safe excerpt) | Paraphrased from Spencer's confidential field guide; attribute as: "Spencer Hill, founder of Got Moles, with over 8 years and nearly 5,000 Western Washington properties of field experience..." |
| **1-2 proprietary stat callouts** | Got Moles internal stats | "5,000 properties since 2017", "219+ five-star reviews across 3 GBPs", "60-80% body weight in earthworms daily", etc. |
| **"Updated [Month Year]" hero marker** | Code | Render dynamically from page metadata; visible above the fold |
| **Citation schema on referenced sources** | Where WSU Extension / WDFW / similar are cited in body | JSON-LD `Citation` schema entries with sourceURL |
| **TL;DR / BLUF visual** | Existing definitionBlock field | Make visually distinct (callout box) on cornerstones; ensure present on services + About |

## 4-layer framework status

| Layer | Status |
|---|---|
| 1 — Foundational (sitewide) | ✅ Done |
| 2 — Citation-target (this project) | 🔴 Starting |
| 3 — Entity authority (Wikidata + cross-platform) | 🟡 Spencer playbook shipped; broader work in motion |
| 4 — Measurement & iteration | 🟡 GSC tracking shipped; AI citation testing + GA4 segment pending |

## Phases

### Phase 1 — Voice template lock (cornerstone #1, full review)

- [ ] Extract 2-3 Spencer quote candidates for `/what-do-moles-eat/` from technician guide
- [ ] Voice-match against `voice-profile.md`, run through `tool-humanizer` deep mode
- [ ] Draft proprietary stat callouts (e.g., "5,000 properties", "60-80% body weight daily")
- [ ] Draft "Updated May 2026" marker placement
- [ ] Draft Citation schema entries for any WSU/WDFW references in body
- [ ] Show full diff to Roy before any commit
- [ ] Roy approves → ship cornerstone #1

### Phase 2 — Repeat pattern across remaining 4 cornerstones

- [ ] Cornerstone #2 (`/voles-vs-moles-whats-the-difference/`) — same per-page deliverables
- [ ] Cornerstone #3 (`/do-moles-hibernate/`)
- [ ] Cornerstone #4 (`/how-to-get-rid-of-moles-in-your-yard/`)
- [ ] Cornerstone #5 (`/blog/types-of-moles-in-washington/`)
- [ ] Batch reseed + commit + push

### Phase 3 — Service pages (3)

- [ ] `/services/total-mole-control-program/` — Spencer methodology quotes (Rule of Four, edge-runs insight, juvenile-dispersal-explains-TMCP), proprietary stat callouts
- [ ] `/services/one-time-mole-removal/` — Spencer Quick Fix methodology, guarantee framing, "every Quick Fix is an audition for TMCP" public-safe version
- [ ] `/services/commercial-mole-control/` — Spencer commercial-property insights, scale credentials
- [ ] Reseed + commit + push

### Phase 4 — About page (1)

- [ ] Author bio enhancement on Spencer (P1 audit item — knock out two birds)
- [ ] Spencer-attributed personal voice quotes (origin story + practitioner POV)
- [ ] EducationalOccupationalCredential schema enrichment
- [ ] Person schema sameAs to LinkedIn + future Wikidata Q-id (placeholder)

### Phase 5 — Verification + measurement

- [ ] Re-run AI citation testing (Claude prompt from Wikidata brief Phase 8)
- [ ] Compare against pre-enhancement baseline
- [ ] GSC URL inspection on the 9 pages — request re-indexing
- [ ] 30/60-day measurement checkpoints

## Acceptance criteria

1. All 9 pages have 2-3 Spencer-attributed quotes, voice-matched to brand voice (humanizer ≥ 8.0)
2. All 9 pages have visible "Updated May 2026" or similar freshness marker
3. All 9 pages have at least 1 proprietary stat callout
4. Citation schema present on every WSU/WDFW reference in body
5. TL;DR / BLUF visually distinct on the 9 pages
6. No verbatim copying from the technician field guide (Sections 3 + 4 of the guide stay confidential)
7. Re-audit script confirms keyword coverage maintained
8. Measurable AI citation lift on the 9 pages within 60 days (baseline + recheck)

## Out of scope (future work, data-driven)

- Other 30+ blog posts: extend Tier 2 only IF GSC shows specific posts catching AI citation traction in months 2-3
- FAQ page: refresh after the cornerstone work establishes Spencer-quote voice pattern
- City pages: Tier 4 treatment only (no Spencer callouts)
- LP pages: Tier 3 treatment (foundational only)

## Sources

- `brand_context/technician-field-guide-INTERNAL.md` — Spencer expertise extraction map
- `brand_context/technician-field-guide-FULL-VERBATIM.md` — full guide reference (confidential)
- `brand_context/voice-profile.md` — voice match
- `brand_context/mole-knowledge-base.md` — public KB for fact-checking
- `aeo-audit-2026/brief.md` — parent audit
- `wikidata-entity-strategy/brief-v2.md` — Layer 3 work (in parallel)
- Princeton GEO study (cited in audit) — +41% citation visibility from expert quotes

## Notion link

[L2: AEO P0 Content Enhancement — 9 Citation-Target Pages](https://www.notion.so/L2-AEO-P0-Content-Enhancement-9-Citation-Target-Pages-3553d42c4a9c81de912ee882b18715db)
