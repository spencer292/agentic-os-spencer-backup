---
title: AEO P0 — Pixelmojo AI Visibility Baseline
date: 2026-05-03
phase: Phase 4 measurement (AI engine half)
source: Pixelmojo Radar 10-pack run, JSON at ~/Downloads/ai-visibility-report-got-moles.com-2026-05-03.json
overall_score: 58/100 (Grade C)
---

# Pre-Phase-4 AI Visibility Baseline

Captured 2026-05-03 10:03 UTC, ~1 hour after shipping Phase 4 first slice (commit b9b2b38 — WSU citation correction + Citation schema). Effectively pre-AEO baseline since AI engines won't have re-indexed the changes yet (training-data refresh lag).

Companion to `baseline-serp-2026-05-03.md` (Google SERP measurement same day).

## Sub-scores at t=0

| Tool | Score | Grade | Trustworthiness | Notes |
|---|---|---|---|---|
| crawl | 81 | B | High | Bot access strong |
| robots | 91 | A | High | Well-configured robots.txt |
| llms | 80 | A | High | Strong llms.txt |
| readiness | 84 | B | High | Solid AI infra base |
| **citation** | **44** | **D** | **High** | Branded query mentions: 50% on ChatGPT/Perplexity/Gemini, 0% on Claude. Sentiment: 4/6 positive or neutral. |
| reddit | 77 | B | High | 16 mentions across r/lawncare and r/homeowners. 12 neutral, 3 positive, 1 negative. Only 1 mention in last 30 days = recency gap. |
| **aeo** | **27** | **F** | **LOW — see caveat** | Claims missing speakable schema, but `articleSchema()` in src/lib/schema.tsx explicitly emits SpeakableSpecification on cornerstones. Likely audited homepage not a cornerstone. |
| **answer** | **33** | **F** | **High** | Got Moles NOT cited for "what is Got Moles' specialization" question by 3 of 4 providers; only Perplexity returned low-alignment citation. Perplexity cited 6 competitor URLs instead. |
| schemaAudit | 59 | C | LOW — see caveat | Claims "no Article schema found" — but we ship `BlogPosting` (a subclass of Article per schema.org). Detector likely only matches exact `@type: Article`. |
| **hallucinationCheck** | **0** | **F** | **High** | 10 inaccuracies across 4 providers. 6 high-severity. PRE-DATES our WSU citation work. |

## The Three Findings That Matter

### 1. AI engines are stating wrong core facts about Got Moles

Direct from the report (verbatim):
- ChatGPT: *"Got Moles was founded in 2019"* — **wrong**, actual 2017
- ChatGPT: *"Mole Removal Services: Professional services to remove moles, skin tags, and other benign skin growths"* — **wrong category entirely**, ChatGPT thinks we're a dermatology clinic
- ChatGPT: *"Pricing for mole removal services can vary widely based on factors such as the size and number of moles being removed, the technique used, and the geographic location"* — **fabricated**, actual is $100/mo TMCP + $450 flat-rate One-Time

This is the #1 brand-damage finding. AI engines confidently misdirect potential customers. Fix: ground-truth signals in `llms.txt` + complete Organization + Product schema.

### 2. Claude has ZERO mentions of Got Moles

ChatGPT, Perplexity, Gemini all hit 50% mention rate on branded queries. Claude returned 0%. Different remediation path — Claude weights Wikidata heavily. Aligns with the Wikidata entity strategy already on the roadmap (`projects/briefs/wikidata-entity-strategy/brief-v2.md`).

### 3. Competitive visibility = 0/35

Got Moles appears in **none** of the competitive category queries ("best mole control company in Washington" etc.). Perplexity cited 6 competitor URLs for the target question instead of got-moles.com. Matches the SERP baseline finding that service pages don't surface on service-intent queries — cannibalization + weak service-page authority.

## Pixelmojo Detector Caveats (don't act on these without verification)

- **Speakable schema "missing" claim** — `src/lib/schema.tsx` line 449-454 explicitly emits speakable on every blog post. Pixelmojo likely audited the homepage or a non-cornerstone URL where speakable doesn't apply.
- **"No Article schema" claim** — `articleSchema()` emits `@type: BlogPosting` which IS a subclass of Article per schema.org spec. Pixelmojo's detector appears to do exact-string match, not subclass-aware. Independently verifiable: paste any cornerstone URL into Google's Rich Results Test.
- **Hallucination check is pre-Phase-4** — ChatGPT's training-data state from before our WSU citation + Spencer attribution shipped. Won't reflect those changes for weeks-to-months as engines refresh.

## Concrete Action List (Pixelmojo's, filtered for what's actually new)

Stripped to items NOT already addressed by Phases 1-4 work:

| Priority | Action | Why now |
|---|---|---|
| **HIGH** | Update `llms.txt` with explicit ground-truth: founded 2017, mole-only specialist (not skin/dermatology), $100/mo TMCP + $450 One-Time, Western Washington only | Directly addresses 6 high-severity hallucinations |
| HIGH | Add complete `Organization` schema (founding year + Product list with explicit pricing) | Same — ground truth that overrides training drift |
| MEDIUM | Wikidata entity (already on roadmap per wikidata-entity-strategy brief-v2) | Addresses Claude's 0% mention rate specifically |
| MEDIUM | Service page SEO authority (already known from SERP baseline) | Addresses 0/35 competitive visibility |
| LOW | Robots.txt: explicit GoogleOther rule | Cleanup |
| LOW | llms-full.txt creation | Marginal — the existing llms.txt is already 80/A |
| SKIP | "Add speakable schema" | Already shipped per src/lib/schema.tsx |
| SKIP | "Add Article schema" | Already shipped as BlogPosting (subclass) |
| SKIP | "Add FAQPage schema" | Already shipped via FAQ block in pages-data.ts (`generateSchema: true`) |
| SKIP | "Add dateModified" | Already shipped per articleSchema |

## Re-baseline trigger

Re-run Pixelmojo in **4-6 weeks** (mid-June 2026) using the same scoring. Look for:

1. **Citation rate lift on Claude** — currently 0%, target any non-zero
2. **Hallucination count drop** — currently 10 (6 high-severity), target ≤5 high-severity
3. **Competitive visibility** — currently 0/35, target ≥5/35

If those move, Phase 1-3 content + Phase 4 WSU citation + llms.txt updates are working. If they don't, the issue is either (a) AI engines lag longer than 6 weeks for index refresh, or (b) the work isn't strong enough yet — re-evaluate.

## Pixelmojo 10-pack budget remaining

This baseline used 1 of 10. 9 runs left for re-baselines + targeted page-level audits if specific cornerstones underperform.
