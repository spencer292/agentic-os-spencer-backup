# Service-Name vs Medical-Term Disambiguation

"Got moles?" is a service-business question that collides with the dermatology/skin-mole query intent. AI assistants without strong disambiguation signals route mole-removal queries to medical content, leaking citation share entirely.

This is a citation leak that's specific to this brand and not covered by generic brand-disambiguation playbooks (which assume name collision with another company, person, or framework — not a common-noun homograph).

**Why this is worse than ordinary ambiguity.** The skin-mole sense dominates the training distribution, so the failure is popularity bias on top of ambiguity, not a coin flip. The paid side already handles it with ~120 medical-cluster negatives in `ops-got-moles-ads`; the organic and AI side needs the equivalent. [U] on every specific tactic in this file — no controlled study exists — but the underlying mechanism (candidate generation, then context-weighted entity linking with popularity bias) is standard NLP and safe to rely on. See `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` §9 (install root).

**The blocking rule this file exists to enforce.** "Mole" never appears in a title, H1, H2 or first paragraph without a disambiguating token in the same sentence: lawn, yard, turf, ground, burrow, tunnel, molehill, trapping, pest, *Scapanus*. The first 40-80 words carry it, because that is the chunk that gets retrieved.

## Run this audit

### 1. AI assistant intent test

For each of the following queries, record what each engine assumes the user means, across **Google AI Overviews, Google AI Mode, ChatGPT (web search on), Perplexity and Copilot**. AI Mode is a separate surface with its own fan-out behavior — do not fold it into the AI Overviews result.

| Query | Expected intent | Failure mode |
|-------|-----------------|--------------|
| "got moles" | Pest control / lawn moles | If AI returns dermatology content = leak |
| "moles in yard" | Yard pests | Should be clean — animal context obvious |
| "mole removal" | Pest control OR dermatology | Highest-risk query — AI must use geo + context |
| "mole removal Seattle" | Pest control (geo disambiguates) | Should resolve to lawn moles |
| "got moles? what to do" | Pest control (brand-anchored) | Brand phrase should pull animal context |
| "moles vs voles" | Yard pests | Animal context strong |
| "skin mole" / "moles on skin" | Dermatology (correct) | Should NOT show Got Moles |
| "mole problem" | Ambiguous | If AI assumes dermatology, leak |

Score: clean (≥6/8 correct intent) / partial (4-5) / leaky (≤3), **scored per engine**, because an engine that resolves correctly and one that returns dermatology are two different problems.

**Script the test rather than pasting by hand.** [P] DataForSEO LLM Responses bills $0.0006 per prompt plus provider charges, so the whole matrix is cheap. Run from `clients/got-moles/`:

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/chat_gpt/llm_responses/live \
  '{"user_prompt":"what is Got Moles","model_name":"gpt-4o","web_search":true}'
```

Repeat against the Gemini and Claude equivalents under `ai_optimization/`, and use `ai_optimization/llm_mentions/live` with `{"keyword":"Got Moles","llm_models":["chat_gpt","gemini","perplexity"],"limit":50}` to see which sources each engine cited alongside the answer. Measure the failure on a fixed cadence rather than assuming it.

### 2. Knowledge Graph + Wikidata check

Search Google for "mole" — does the Knowledge Panel disambiguate (animal / skin lesion / molecule / spy / Mexican sauce)? Confirm Got Moles' brand entity isn't being absorbed into the wrong sense.

Check Wikidata:
- Is there an entity for "Got Moles" the company? If not, that's a launch-window opportunity.
- The animal "mole" entity (Q2007) and the skin-mole entity (Q11424) are separate. Got Moles' Organization schema should `sameAs` link to GBP, Yelp, Facebook, LinkedIn — not to either Wikidata mole entity.

### 3. Organization schema sameAs audit

**This is the one place schema still earns its keep for this brand.** [S] Schema does not lift AI citations — the Ahrefs difference-in-differences test measured −4.6% / +2.4% / +2.2% — and [P] Google states structured data is not required for generative AI search. The `sameAs` spine survives that finding because it does a different job: entity binding. Never present it in client output as a citation lever; present it as the disambiguation defense.

Pull the Organization schema from the homepage with raw `node fetch` (WebFetch strips `<script>`) and verify the `sameAs` array is identical everywhere it appears:

| Required | Why |
|----------|-----|
| All 3 GBP map URLs | Strongest local-business entity signal |
| Yelp business profile | [S] The single most-cited local directory across AI engines, and [P] ChatGPT's licensed source since 2026-07-23 |
| BBB profile | [S] Led ChatGPT directory citations in the Q4 2025 dataset. Trust signal plus entity disambiguation |
| Angi listing | [S] The Gemini lever — Angi led Gemini citations decisively |
| Facebook page | Cited in community-context queries |
| LinkedIn company page | Commercial-services disambiguation |
| YouTube channel | [S] The strongest single correlate of AI brand visibility (0.737 across engines). Also a `sameAs` anchor |
| Apple Business Connect | Apple Maps and Siri context. [U] weight |
| Instagram (if active) | Social entity anchor |

Missing 3+ → high disambiguation risk. The animal-pest-control intent should be obvious from any 3 of these.

Add `knowsAbout` on the Organization binding the brand to the pest-control sense of "mole" — this is the explicit statement that the `sameAs` set only implies.

### 3b. Canonical disambiguation page

One page is the entity anchor: what a lawn mole is, why it is not a skin mole, what a molehill looks like, which species occur in Western Washington (*Scapanus townsendii*, *Scapanus orarius*). Every page that mentions "mole" links to it. Verify it exists, that it is indexed, and that the inbound links are actually present — `str-internal-links` owns adding the missing ones.

### 4. Spencer's Person schema reinforcement

Person entities pull disambiguation toward the company. Spencer Hill's Person schema should include:

- `jobTitle`: Founder / Owner
- `worksFor`: Got Moles (Organization @id reference)
- `alumniOf` or military service: US Army, infantryman, 2011-2014
- `birthPlace`: Buckley, Washington (or homeBase: Enumclaw, WA)
- `sameAs`: LinkedIn, Facebook, Instagram if public
- `knowsAbout`: ["Pest Control", "Mole Removal", "Wildlife Management"] — array nudges entity-context

A strong Person entity for Spencer pulls "got moles" queries toward "the pest-control company founded by this veteran in WA," not toward dermatology.

### 5. Content-side disambiguation

Apply the blocking rule from the top of this file. Spot-check the homepage and at least 3 city pages, plus the highest-traffic blog posts: "mole" must not appear in the title, H1, any H2 or the first paragraph without a disambiguating token in the same sentence (lawn, yard, turf, ground, burrow, tunnel, molehill, trapping, pest, *Scapanus*). Retrieval works on chunks, and the first 40-80 words are the chunk that gets pulled — leaving "moles" unqualified there is a citation leak.

The answer-first block (40-60 words under the H1) must carry the animal context itself, not rely on a later paragraph to supply it.

## Recommendations the audit should produce

If the audit finds disambiguation gaps:

- **Schema fix:** add missing `sameAs` entries to Organization schema (specific entity URLs) and `knowsAbout` binding the brand to the pest-control sense. Framed as entity binding, never as a citation lever
- **Person fix:** strengthen Spencer's Person schema with army provenance and `knowsAbout`
- **Content fix:** rewrite the title, H1, H2s and first paragraph on flagged pages so every "mole" carries a disambiguating token in the same sentence
- **Canonical-page fix:** ensure the disambiguation page exists, is indexed, and is linked from every page that mentions "mole"
- **Wikidata fix:** create a Got Moles company entity if absent, with explicit `instance of: business` and a pest-control category. [P] Wikipedia and Wikidata are the strongest `sameAs` anchors because they feed the Knowledge Graph and multiple training pipelines — but a Wikipedia article is not realistically achievable here, so treat the achievable `sameAs` spine above as the primary defense
- **Internal linking fix:** every "moles" anchor in body content should link to a page whose URL contains "mole" plus a yard or pest qualifier (e.g. `/mole-control-program/`, not `/contact/`). Hand execution to `str-internal-links`

**Never propose an llms.txt entry as a disambiguation or hallucination fix.** [P] No engine documents consuming it, and Google states it is not required for Search visibility.

## Sources

- Landscape file §9 (homograph and entity disambiguation) and §6 (structured data state) — `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (install root)
- [S] Ahrefs, schema and AI citations difference-in-differences test (2026-05-11) — https://ahrefs.com/blog/schema-ai-citations/
- [P] Google, AI optimization guide (updated 2026-07-10) — https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- [S] Ahrefs, AI brand visibility correlations, 75,000 brands — https://ahrefs.com/blog/ai-brand-visibility-correlations

## Retired claims

Removed 2026-09-02, do not reintroduce: "Yelp cited 4-8% in AI Overviews" — no traceable source, and superseded by the measured directory-citation ranking in `bing-copilot.md`.
