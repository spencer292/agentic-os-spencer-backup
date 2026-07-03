---
site: got-moles.com
date: 2026-05-28
page: /faq/
tier: 2
primary_keyword: mole control FAQ
sitewide_score: N/A (single-page audit)
page_score: 62.5/100
pages_audited: 1
fixes_p1: 4
fixes_p2: 5
fixes_p3: 3
hallucination_correction_progress: 3/6 canonical facts visible (founding year, pricing, client count present; counties, communities count, veteran status mentioned but not in stat-block format)
status: draft
---

# On-Page Audit: /faq/ — got-moles.com

Single-page audit of `/faq/` (Tier 2 supporting hub). Primary keyword: **mole control FAQ**. Intent: informational.

---

## /faq/

### Foundation-doc lookup (Rule F)

| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | `mole control FAQ` (Tier 2, Informational, no cluster) | Title: "Mole Control FAQ \| 25+ Questions Answered" — KW in title. H1: "Your Mole Questions, Answered" — KW absent from H1 | ❌ H1 missing primary KW |
| Recommended H1 | Not explicitly specified in Tier 2 table | "Your Mole Questions, Answered" — creative/brand-forward but lacks `mole control` or `FAQ` signal | mismatch — no KW signal |
| Disambiguation signal | Rule 1: lawn/yard/exterminator/Washington/city/brand | H1 has no disambiguation signal. Title has "Mole Control" which is acceptable per Rule 3. Subheading mentions Spencer Hill (brand). | ❌ H1 missing; ✅ title OK |
| Secondary cluster KWs (>=2) | No cluster assigned in target-keywords.md (standalone Tier 2) | H2s are topical groupings ("About Our Methods", "About Our Services", etc.) — not keyword-bearing. No secondary KWs to target per foundation doc. | N/A — no cluster |
| Queries-to-avoid | Derm: "mole removal cost" etc. | Q6 "How much does mole removal cost?" — uses `mole removal cost` in FAQ question text. Answer contextualizes correctly with "Got Moles offers..." but the question itself matches a queries-to-avoid phrase. | ⚠️ borderline — FAQ question uses avoided phrase, but answer disambiguates. Low risk in FAQ context since the full question is lawn-contextualized by the page. |

### Live verification (Rule C)

- **Schema:** 5 JSON-LD blocks parsed via raw HTML extractor:
  1. Organization (@id reference) — sitewide
  2. WebPage with SpeakableSpecification (cssSelector: `["h1", "main h2"]`)
  3. BreadcrumbList (Home > FAQ)
  4. FAQPage with 26 Question entities (matches codebase 26 items)
  5. WebPageElement (geoDefinition speakable)
- **Images:** HeroBlock.tsx confirmed `priority` prop (line 60) + `fill` (line 59). Fallback image `hero-faq` resolves to `/images/hero-faq.webp`. Alt text auto-generated from heading pattern.
- **Internal links:** Raw HTML count: 51 (includes nav + footer). Content-body links: 16 unique outbound internal links from FAQ answers. No inbound links from blog-data.ts to `/faq/`. Inbound from pages-data.ts: 5 pages link via "See all FAQs" moreLink (homepage, TMCP, OMP, commercial, about).

### Three-Layer SoT (Rule A)

- **Live render:** Matches codebase — 26 FAQ items confirmed in both FAQPage schema and visible content
- **HEAD:** Latest commit touching pages-data.ts: `c0daf55d` (2026-05-21). Latest commit touching faq/page.tsx: `ccf731f7` (sitewide schema pass)
- **Working tree:** `git diff HEAD` shows no changes to faq/page.tsx or pages-data.ts FAQ section = clean
- **CMS:** Payload-backed page. Last reseed not tracked in audit; content matches codebase.

---

### Pillar scores

| # | Pillar | Wt | Raw | Weighted | Notes |
|---|---|---|---|---|---|
| 1 | Headings | 20% | 5/10 | 10/20 | H1 lacks primary KW "mole control" + disambiguation. H2s are topical labels not keyword-bearing. No H3s. No skipped levels. |
| 2 | Meta + Canonical | 10% | 8/10 | 8/10 | Title good (55 chars, carries KW + brand). Meta desc good (154 chars, carries KW). Canonical present. OG tags present. og:image is generic default, not page-specific. |
| 3 | Schema | 15% | 9/10 | 13.5/15 | FAQPage aggregated correctly (26 Qs). BreadcrumbList present. WebPage + Speakable present. Organization @id referenced. No dateModified on FAQPage (not required by spec but good practice). |
| 4 | AEO Content Shape | 20% | 4/10 | 8/20 | No BLUF/answer-first paragraph after H1. No stat blocks. No comparison tables. No ordered lists for processes. No verified-fact callouts above fold. Hero subheading is the only prose before FAQ blocks. Page jumps straight to Q&A with no contextual framing. |
| 5 | Internal Links | 15% | 6/10 | 9/15 | 16 outbound content links (good diversity). 5 inbound from other pages via "See all FAQs" moreLink. Zero inbound from blog posts. No anchor diversity — all inbound use identical "See all FAQs" text. Missing links TO /faq/ from blog posts that reference FAQ topics. |
| 6 | Images | 5% | 7/10 | 3.5/5 | Hero image: WebP, priority, fill — all correct. og:image uses generic site default, not FAQ-specific. No content images in FAQ body (acceptable for Q&A format). |
| 7 | E-E-A-T | 10% | 5/10 | 5/10 | Spencer Hill mentioned in hero subheading (founder + specialist). No author byline component. No Person schema link. No outbound to authoritative sources (WSU Extension, WDFW cited in answers but as text, not links). One WSU citation in castor oil answer — good but more needed. |
| 8 | Freshness + Disambiguation | 5% | 3/10 | 1.5/5 | No visible publish/update date. No dateModified in schema. No Last-Modified header verification. H1 lacks disambiguation signal (see Foundation-doc lookup). Title carries "Mole Control" which disambiguates. |

**Page Score: 58.5/100 — Poor (P1)**

*(Tier 2 weight = 2x for sitewide aggregation)*

---

## Gap Analysis

### What the page IS

A pure FAQ accordion page: hero + geoDefinition + 5 FAQ blocks (26 questions across 5 topics) + closing CTA. Lean, single-purpose, well-structured FAQ.

### What the page LACKS (structural gaps)

1. **No answer-first BLUF paragraph** — page jumps from hero to FAQ blocks with no contextual framing. AI engines need an extractable summary paragraph.
2. **No stat block** — canonical facts (5,000 clients, 92+ communities, since 2017, 219+ reviews) are buried in individual FAQ answers, not in an extractable stat-block component.
3. **No richContent bridges between sections** — no prose connecting FAQ groups. Page reads as a list, not an authority resource.
4. **No testimonial/review block** — social proof is limited to the trust strip.
5. **No serviceArea block** — unlike service pages, no geographic signal beyond FAQ answers mentioning "Western Washington."
6. **No featureGrid** — no visual summary of services/differentiators.
7. **No visible freshness date** — no "Last updated" marker.
8. **No founder voice/quote** — Spencer mentioned in subheading but no direct quote or expert callout.
9. **Only 26 FAQ items** — 66 more exist across other pages (92 total sitewide) and 23 unique ones could be added without duplication.

---

## Prioritized Fix List

### P1 — Must fix (page scores Poor)

| # | Pillar | Gap | Fix | File path |
|---|---|---|---|---|
| P1-1 | Headings (1) | H1 lacks primary KW + disambiguation | Change H1 to "Mole Control FAQ — Your Questions, Answered" or "Mole Control FAQ: Expert Answers for Washington Homeowners" | `src/lib/pages-data.ts` line 650 (`heading` field in faqBlocks hero) |
| P1-2 | AEO (4) | No BLUF paragraph after hero | Add a `richContent` block between geoDefinition and first FAQ group. Answer-first paragraph: "Got Moles answers the most common questions about professional mole control in Western Washington — from cost and methods to safety, timing, and what actually works." | `src/lib/pages-data.ts` after line 669 |
| P1-3 | AEO (4) | No stat block with citable numbers | Add a `statsBlock` with 4 canonical facts: "Nearly 5,000 Clients Served", "92+ Communities", "219+ Five-Star Reviews", "Since 2017" | `src/lib/pages-data.ts` after BLUF block |
| P1-4 | AEO (4) | No richContent bridges between FAQ sections | Add short (2-3 sentence) richContent blocks between at least 2 FAQ groups to provide contextual framing and internal link opportunities | `src/lib/pages-data.ts` between FAQ blocks |

### P2 — Should fix (lifts score to Good)

| # | Pillar | Gap | Fix | File path |
|---|---|---|---|---|
| P2-1 | E-E-A-T (7) | No outbound authority links | Add links to WSU Extension mole management page + WDFW wildlife resources in relevant FAQ answers or richContent bridges | `src/lib/pages-data.ts` FAQ answer fields |
| P2-2 | E-E-A-T (7) | No founder expert quote | Add a `richContent` block with a direct Spencer quote about the most common misconception or advice | `src/lib/pages-data.ts` |
| P2-3 | Internal Links (5) | All inbound anchors identical ("See all FAQs") | Vary anchor text on at least 2 pages: "mole control FAQ", "common mole questions", "frequently asked questions about mole removal" | `src/lib/pages-data.ts` moreLink text fields on other pages |
| P2-4 | Freshness (8) | No visible update date | Add "Last updated {date}" visible text — either in hero subheading or a small text element below hero | `src/lib/pages-data.ts` or `faq/page.tsx` |
| P2-5 | Meta (2) | og:image is generic default | Create FAQ-specific og:image or use hero-faq.webp if dimensions are correct (1200x630) | `src/lib/pages-data.ts` faqMeta or faq/page.tsx metadata |

### P3 — Nice to have

| # | Pillar | Gap | Fix | File path |
|---|---|---|---|---|
| P3-1 | Meta (2) | Title says "25+ Questions" but page has 26; will grow to 49 | Update title to reflect actual count after expansion: "Mole Control FAQ \| 49 Expert Answers" | `src/lib/pages-data.ts` faqMeta + faq/page.tsx FALLBACK |
| P3-2 | Schema (3) | FAQPage has no dateModified | Not required by spec but beneficial. Could emit via schema.tsx if a lastUpdated field is added to faqMeta | `src/lib/schema.tsx` faqSchema function |
| P3-3 | Internal Links (5) | Zero inbound from blog posts | Add contextual links from 3-5 relevant blog posts back to /faq/ with varied anchor text | `src/lib/blog-data.ts` |

---

## FAQ Expansion Plan (from Session 1)

The page currently has 26 questions across 5 sections. Session 1 identified 23 unique FAQ items from other pages that should be added, plus 2 new sections (Commercial Mole Control, Results & Value). Target: **49 questions across 7 sections**.

This expansion directly addresses P1-3 (more citable content), P1-4 (richer page), and lifts Pillar 4 (AEO) and Pillar 5 (internal links) scores.

---

## Score Projection (post-fixes)

Not projecting — per Rule H, post-fix scores require a full re-audit with live evidence. Fixes above target lifting the page from 58.5 (Poor) to 80+ (Good) range, but this must be verified via Rule G re-audit after implementation.

---

## Next Steps

1. Implement P1 fixes (H1, BLUF, stat block, richContent bridges)
2. Implement FAQ expansion (26 → 49 questions, 5 → 7 sections)
3. Implement P2 fixes (authority links, founder quote, anchor diversity, freshness date)
4. Humanize all new copy (tool-humanizer deep mode)
5. Build + reseed + deploy
6. Run Rule G re-audit on live page
