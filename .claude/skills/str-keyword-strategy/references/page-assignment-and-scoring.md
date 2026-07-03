# Page Assignment, Cannibalisation, and Priority Scoring

How target queries get mapped to canonical pages, how cannibalisation gets detected, and how each query gets priority-scored so the strategy is executable rather than aspirational.

## Page assignment rule

**Each query gets exactly one canonical page.** Not zero, not two.

Reasoning: when two pages target the same query, neither wins — Google splits authority and ranks neither well. When zero pages target a query, the query is theoretical, not strategic.

### Assignment process

1. Look at the query's primary intent (8-category classification — see `intent-classification.md`).
2. Match it to the page shape that best serves that intent (intent → content shape mapping table in `intent-classification.md`).
3. Assign the existing page that best fits, OR flag as "needs new page" if no existing page matches.
4. Document the assignment in `target-keywords.md` under the cluster's queries array.

### When intent is genuinely dual

If a query truly serves two intents (e.g. "BOS UP vs EOS" = Comparison primary + Commercial secondary), the page should serve primary intent shape and structure secondary intent into FAQ blocks or schema. Never assign two pages.

## Cannibalisation detection

**Cannibalisation = two or more existing pages targeting the same query/intent within the same cluster.**

How to spot:
- Multiple URLs in the cluster have the same query in title/H1/URL slug
- GSC shows the same query producing impressions across multiple pages (especially when no single page passes ~25% of impressions)
- Both pages link to each other as if they're peers when one should be the child of the other

How to resolve:
- **Consolidate** — merge content into the better-positioned page, 301 the weaker one
- **Differentiate** — keep both but reassign one to a different query/intent (verify GSC data supports this)
- **Demote** — remove the weaker page from sitemap/internal linking, keep accessible but stop investing

Document the resolution choice + reasoning in the cluster's `cannibalisation_notes` field.

## Coverage gaps

Within each cluster, after assignment is done:
- List intent categories the cluster is supposed to serve (per its primary_intent + supporting intents)
- Mark which intents have a page, which don't
- Gaps = opportunities for new content

Format:
```
cluster: ai-thinking
intents_in_cluster: [informational, commercial, instruction, comparison]
coverage:
  - informational: ✓ /ai (pillar)
  - commercial: ✓ /ai/ai-for-business-owners
  - instruction: gap — recommend /ai/how-to-use-ai-as-business-owner
  - comparison: gap — recommend /ai/care-framework-vs-other-prompting-frameworks
```

## Priority scoring

Each query gets `priority: high | medium | low` based on a 5-axis matrix:

| Axis | High | Medium | Low |
|---|---|---|---|
| **Intent fit** (does query represent ICP buyer journey?) | core ICP query | adjacent | tangential |
| **ICP match** (audience match) | ICP exact | partial | mismatched |
| **Competition** (from live SERP test) | weak/inconsistent SERP | mixed | dominant authorities |
| **Current position** (GSC) | already top 30 | top 50-100 | unknown / no data |
| **Business goal contribution** | direct revenue pull (Got Moles: booking/TMCP signup intent) | brand awareness | nice-to-have |

**Scoring rules:**
- 4+ "high" axes → `priority: high`
- 3 "high" axes OR 5 "medium" → `priority: medium`
- Otherwise → `priority: low`

**Tie-breakers:**
- If GSC shows the page is already at top 20-30 for the query → bump priority one level (close-to-page-1 wins are highest ROI)
- If competitor analysis shows weak content + no Wikipedia/Wikidata authorities → bump priority one level (unclaimed territory)
- If query is critical for a flagship initiative (for Got Moles: TMCP plan, new service-area launch) → bump priority one level

**Don't bump for:**
- High search volume alone (volume without intent fit is noise)
- "Easy ranking" via keyword stuffing (defeats the purpose)
- Aspiration ("I want to rank for this someday") without intent/ICP fit

## Validation pass

Before writing `target-keywords.md`, sanity-check:
- [ ] Every cluster has 1 pillar + 5-15 supporting queries
- [ ] Every query has primary intent tagged
- [ ] Every query has assigned_page (existing URL, or "NEW: /proposed-path")
- [ ] No two queries target the same page with the same intent (= cannibalisation)
- [ ] Every cluster has priority distribution: roughly 1-3 high, 3-7 medium, rest low
- [ ] Geography follows brand_context/icp.md (Got Moles: WA-local PRIMARY frame; city/county modifiers are core queries)
