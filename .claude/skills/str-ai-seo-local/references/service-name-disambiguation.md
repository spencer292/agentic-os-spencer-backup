# Service-Name vs Medical-Term Disambiguation

"Got moles?" is a service-business question that collides with the dermatology/skin-mole query intent. AI assistants without strong disambiguation signals route mole-removal queries to medical content, leaking citation share entirely.

This is a citation leak that's specific to this brand and not covered by generic brand-disambiguation playbooks (which assume name collision with another company, person, or framework — not a medical term).

## Run this audit

### 1. AI assistant intent test

For each of the following queries, paste into Google AI Overview, Perplexity, ChatGPT (web search on), and Bing Copilot. Record what the AI assumes the user means:

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

Score: clean (≥6/8 correct intent) / partial (4-5) / leaky (≤3).

### 2. Knowledge Graph + Wikidata check

Search Google for "mole" — does the Knowledge Panel disambiguate (animal / skin lesion / molecule / spy / Mexican sauce)? Confirm Got Moles' brand entity isn't being absorbed into the wrong sense.

Check Wikidata:
- Is there an entity for "Got Moles" the company? If not, that's a launch-window opportunity.
- The animal "mole" entity (Q2007) and the skin-mole entity (Q11424) are separate. Got Moles' Organization schema should `sameAs` link to GBP, Yelp, Facebook, LinkedIn — not to either Wikidata mole entity.

### 3. Organization schema sameAs audit

Pull the Organization schema from the homepage and verify the `sameAs` array contains enough entity-anchors to make "this is a pest-control company" unambiguous to AI crawlers:

| Required | Why |
|----------|-----|
| All 3 GBP map URLs | Strongest local-business entity signal |
| Yelp business profile | Cited 4-8% in AI Overviews |
| Facebook page | Cited especially in community-context queries |
| BBB profile | Trust signal + entity disambiguation |
| Angi listing | Industry-context disambiguation |
| Apple Business Connect | Apple Maps + Siri context |
| Instagram (if active) | Social entity anchor |
| LinkedIn company page | B2B + commercial-services disambiguation |

Missing 3+ → high disambiguation risk. The animal-pest-control intent should be obvious from any 3 of these.

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

Spot-check the homepage and at least 3 city pages for explicit "lawn moles / yard moles / mole pests" phrasing in the first 100 words. If a page says "moles" without the qualifying noun (lawn, yard, garden, ground, pest, animal), flag it. AI assistants chunk first paragraphs heavily — leaving "moles" unqualified there is a citation leak.

The site's BLUF should mention the animal context within the direct-answer block (40-60 words under H1).

## Recommendations the audit should produce

If the audit finds disambiguation gaps:

- **Schema fix:** add missing `sameAs` entries to Organization schema (specific entity URLs)
- **Person fix:** strengthen Spencer's Person schema with army provenance and `knowsAbout`
- **Content fix:** rewrite first-paragraph "moles" → "lawn moles" / "yard moles" on flagged pages
- **Wikidata fix:** create a Got Moles company entity if absent, with explicit `instance of: business` and pest-control category
- **Internal linking fix:** every "moles" anchor in body content should link to a page whose URL contains "mole" + a yard/pest qualifier (e.g., `/mole-control-program/`, not `/contact/`)

## Sources

- [Google Knowledge Graph + Wikidata disambiguation guide](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Conductor 2026 AEO/GEO Benchmarks Report](https://www.conductor.com/academy/aeo-geo-benchmarks-report/)
- [Whitespark — AI Overviews for Local Business Searches research](https://whitespark.ca/blog/case-study-the-prevalence-of-ai-overviews-in-local-search/)
