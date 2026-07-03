# 2026 SEO/GEO/AEO Research Notes

Recency anchor for str-onpage-audit. Refresh quarterly.

> **Updated 2026-05-31.** The authoritative, fully-cited version of these standards now lives in `clients/got-moles/projects/briefs/mole-content-authority/.planning/research/METHOD.md` (~40 live 2026 sources). Read METHOD.md as the primary benchmark; this file is quick-reference. Key changes: (1) **off-page brand/entity presence is the #1 AI-visibility lever** (web mentions r=0.664, YouTube r=0.737) — bigger than on-page; top-10↔AI-Overview overlap collapsed ~76%→17–38%, so ranking is no longer the gate to citation. (2) **FAQ rich results removed 2026-05-07** — keep FAQPage for AI extraction only. (3) **Speakable downgraded** to optional BLUF-only. (4) **Schema field rigor > presence** (`sameAs`/`knowsAbout`/`dateModified`/`mainEntityOfPage`). (5) **Cited-statistic cadence** ≈ 1 per 150–200 words (Princeton +40%). (6) **Freshness is a primary citation signal** (~50% of AI citations <13 weeks; visible "Last updated" + dateModified). (7) **Depth beats breadth** on clusters. (8) Google March 2026 core update down-weights templated/scaled pages 30–60% unless genuinely specific. Pixelmojo Radar is now a *secondary* benchmark.

**Last refresh:** 2026-05-31 (METHOD.md research pass; supersedes 2026-05-08 Pixelmojo-only baseline)
**Next refresh trigger:** new major Google/LLM citation pattern shift, METHOD.md re-run, or quarterly default.

---

## 2026 AI search citation patterns (the recency benchmark)

Source: Pixelmojo Radar 2026-05-08 + Phase 0 patches.

### High-impact AEO patterns (Pixelmojo high-priority recommendations)

1. **SpeakableSpecification with cssSelector array** — tells voice assistants + AI Overviews which DOM to read aloud and cite. Pattern: `cssSelector: ['h1', 'main h2']`. Article + WebPage schemas.

2. **Article schema completeness** — datePublished + **dateModified** (separate fields, both required). Plus server `Last-Modified` HTTP header (separate signal from dateModified).

3. **FAQPage aggregation rule** — multi-FAQ-block pages emit ONE combined FAQPage at page level, not one per block. Per-block emission silently drops 80%+ of questions from JSON-LD.

4. **Data extractability patterns** — HTML tables for comparisons (extracted verbatim), ordered lists for steps, distinct StatBlock components for citable numbers.

5. **Organization schema enrichment** — `knowsAbout` (topical authority signal), `hasOfferCatalog` with explicit pricing (hallucination-correction signal), complete `sameAs` array.

6. **BreadcrumbList sitewide** — every non-root page.

7. **Hallucination correction loop** — when AI providers state wrong facts, multi-surface correction (llms.txt + schema + verified-fact callouts + press placements + Wikidata) + 7-30 day re-test cycle.

### Brand-mention 3× correlation (vs backlinks)

2026 research: brand mentions correlate **0.664 with AI search visibility vs 0.218 for backlinks**. Implication: brand-mention strategy is the primary signal, backlinks are a footnote. Linkable assets > outreach (build the thing journalists/AI cite, then announce it).

### AI Overview triggering rates (2026)

- "near me" informational queries trigger AIO **76.9%** of the time
- pure transactional Map Pack queries trigger AIO **only 7%**

Implication: for local-service brands, the AI citation surface is informational, not transactional. Don't over-rotate to chase the 7% transactional AIO.

### Bing weighted equal to ChatGPT

Pixelmojo weights Bing/Copilot equal to ChatGPT for AI citation tracking. Bing Places + Apple Business Connect feed multiple surfaces (Bing/Yahoo/Microsoft Copilot/Windows Search; Apple Maps/Siri/Spotlight) — claim early.

---

## 2026 Google Search Quality + Helpful Content

- **Helpful Content Update Dec 2025** — topical authority through hub-spoke clusters is now a meaningful ranking signal (not just a content-marketing concept)
- **8 query intent categories** (Google quality rater guidelines 2026 evolution beyond classic 4): Informational, Navigational, Commercial, Transactional, Short fact, Comparison, Instruction, Consequence
- **For local-service:** Local-pack sub-intent of Commercial matters; AIO triggers heavily on "near me" informational

---

## 2026 Core Web Vitals (verify in CRO + page-build, not in this audit)

For reference (str-cro-audit handles in Step 5):
- **LCP** ≤ 2.5s (largest contentful paint)
- **INP** ≤ 200ms (interaction to next paint — replaced FID March 2024)
- **CLS** ≤ 0.1 (cumulative layout shift)

---

## 2026 Anchor distribution + internal-linking research

Per `str-internal-links` skill methodology:
- **Anchor distribution target:** 40% branded / 30% keyword (15-25% exact-match) / 30% generic-LSI
- **Page depth:** strategic pages within 2 clicks; all important pages within 3
- **Cross-link nearby cities (local-service):** +7% organic traffic (SearchPilot split test)
- **Pages with at least one exact-match anchor:** receive 5× more traffic (Zyppy 23M-link study)
- **Internal-link density sweet spot:** 40-50 total per page; 2-5 contextual per 1,000 words
- **Orphan page recovery:** 76.6% of previously orphan pages improve when internal links added (Niche Pursuits 108-link case study)

---

## 2026 Local SEO ranking weights

- **Proximity** ~55% (uncontrollable — searcher distance from GBP centroid)
- **GBP signals** 32%
- **Reviews** 16-20%
- **On-page** 19%
- **Primary GBP category** = single highest controllable factor
- **Pro photos** = +35% CTR (Semrush 2026)

---

## Trust signal optimal range (CRO-adjacent)

Per `str-cro-audit`:
- 1-3 trust signal types optimal
- 7+ types hurts credibility by ~8%

---

## What changed in 2026

- INP replaced FID (March 2024)
- AI Overview rollout broadly (2025 → 2026)
- llms.txt becoming standard (2025 → 2026)
- BreadcrumbList sitewide became table-stakes
- Speakable schema rewards measurably (Pixelmojo high-impact)
- Brand mentions overtook backlinks for AI visibility correlation
- Pixelmojo Radar (and equivalent) became recurring 3rd-party AEO benchmark
- INP-passing requires careful JS bundle + 3rd-party tag management

---

## Refresh notes

**Next refresh items to research live:**
- New Pixelmojo report deltas
- Google AI Overview rollout updates
- Any LLM citation pattern shift (e.g. Anthropic / OpenAI changing citation behaviour)
- New schema types or required fields introduced by schema.org
- Bing Webmaster Tools "AI Performance" report changes (launched Feb 2026)

**Sources to check on quarterly refresh:**
- Pixelmojo blog + methodology docs
- Google quality rater guidelines (latest)
- Bing Webmaster Tools AI Performance documentation
- Anthropic / OpenAI citation behaviour documentation
- schema.org changelog
- Major SEO research outlets (Semrush, Ahrefs, Search Engine Journal, Search Engine Land — for 2026 study aggregations)
