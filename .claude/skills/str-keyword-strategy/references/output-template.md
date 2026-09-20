# Output Template for `brand_context/target-keywords.md`

Every section below is mandatory when the corresponding data exists. A refresh that drops a section deletes data that `str-onpage-audit`, `str-internal-links` and `str-authority-strategy` read by name, and three of them stop without it.

Sections that do not apply to the brand are omitted deliberately and the omission is recorded in the frontmatter `research_status` line. A national brand with no locations omits the location cluster, the anchor-city seeding rule and the Tier 3 location table. A brand with no head-term collision omits the Brand-Disambiguation Strategy section. Nothing else is optional.

**Spelling note.** The emitted headings `### Cannibalisation notes` and `## Cannibalisation Detection` keep this spelling because downstream skills match on those strings. Do not correct them to a different variant even in a US-English workspace.

````markdown
---
last_updated: YYYY-MM-DD
methodology_version: 2.0
data_sources:
  - Search Console query export {YYYY-MM-DD} ({n} queries / {n} pages, 90-day window)
  - Search Console page export {YYYY-MM-DD}
  - Search Console generative AI report {YYYY-MM-DD} (manual, impressions only, AI Overviews and AI Mode combined, no query dimension)
  - DataForSEO Labs ranked_keywords {YYYY-MM-DD} ({n} rows) -> projects/str-keyword-strategy/data/{file}.json
  - DataForSEO Labs keyword_ideas / keyword_suggestions / related_keywords {YYYY-MM-DD} ({n} rows)
  - DataForSEO Labs bulk_keyword_difficulty {YYYY-MM-DD} ({n} keywords)
  - DataForSEO Labs search_intent {YYYY-MM-DD} ({n} keywords)
  - DataForSEO Labs domain_intersection / competitors_domain {YYYY-MM-DD} ({n} competitors)
  - DataForSEO Keywords Data google_ads search_volume {YYYY-MM-DD} ({n} keywords)
  - DataForSEO AI Optimization ai_keyword_data {YYYY-MM-DD} ({n} keywords)
  - DataForSEO SERP google/organic/live/advanced {YYYY-MM-DD} ({n} keywords, surface tags)
  - Google Ads Keyword Planner historical metrics {YYYY-MM-DD} ({n} keywords, rounded buckets) | or omit
  - Bing Webmaster Tools AI Performance grounding queries {YYYY-MM-DD} (manual export) | or: NOT AVAILABLE, gap
  - brand_context/positioning.md, brand_context/icp.md
  - {any research documents, with dates}
data_source_spend: "DataForSEO ${x.xx} this run (see the usage log)"
geographic_scope: {verbatim from brand_context/icp.md. Name the frame explicitly: local with its named places, national with its country, or international with its market list. Never "global" without ICP evidence}
research_status: {voice-of-customer status, which sections were omitted and why, what the next version needs}
canonical_facts:
  - {the fact set every page and every authority surface must reinforce: founding, founder, service area, scale, pricing, methodology, review corpus. These supersede any stale figure in icp.md, and str-onpage-audit and str-authority-strategy both read them}
---

# Target Keywords: {brand}

{One paragraph: what this document is, and the explicit list of downstream skills that read it.}

---

## Brand-Disambiguation Strategy

*Include only where a real collision exists, confirmed by a live SERP check.*

**The core problem.** {The collision, its competing senses ranked by observed SERP and AI Overview behaviour, and the evidence for that ranking.}

### Disambiguation Rules

**Rule 1, title and H1 carry an unambiguous signal.** {required modifier set}
**Rule 2, pivot away from the hijacked head term.** {safe alternatives}
**Rule 3, head-term preference.** {which head term the strategy uses instead}
**Rule 4, brand entity reinforcement.** {geographic and entity framing}
**Rule 5, internal anchor text.** {anchor rules, consumed by str-internal-links}

### Queries to AVOID (never target these)

| Cluster | Example queries | Why avoid |
|---|---|---|

**Inverse rule, queries we DO want.** {the modifier set that makes intent unambiguous}

---

## Brand Defense Strategy

**Primary brand-name target.** {the brand query, its volume, any named threat}

| Query | Volume | Page | Notes |
|---|---|---|---|

**Anchor-place seeding rule.** {which places are named in the first 200 words of which pages, and why. Omit for a brand with no geographic frame}

---

## Seasonality Calendar (publish and push schedule)

| Period | Behaviour | Action |
|---|---|---|

**Content calendar rule:** {how far ahead of each demand peak content ships}

---

## Cluster: {id}

**Pillar page:** {URL}
**Primary intent:** {one of the 8}
**Primary surface:** {Classic | Local Pack | AI Overviews | AI Mode | multi}
**Cluster rationale:** {one sentence}
**Coverage status:** {complete | gaps in [intents]}

### Queries

| Query | Primary intent | Secondary | Surface | Assigned page | Volume (classic) | AI volume | Difficulty | Current rank | Ranking URL | Search Console impressions (90d) | Search Console position | Target | Priority | Cannibalisation | Fan-out sub-queries | ICP voice | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

**Column definitions.**

- **Surface.** `Classic`, `Local Pack`, `AI Overviews`, `AI Mode` or `multi`, from Step 7. Suffix `(inferred)` where a live SERP call did not confirm it.
- **Volume (classic).** Monthly search volume. Name the source where two sources disagree. Leave the cell blank when not pulled, and never estimate.
- **AI volume.** AI search volume, modelled from People Also Ask statistics. Label `[U]` in any client-facing extract.
- **Difficulty.** Bulk keyword difficulty, 0 to 100.
- **Current rank and Ranking URL.** From ranked keywords. The URL matters as much as the number, because it is the cannibalisation detector.
- **Cannibalisation.** Blank, or `flag: {n} URLs` cross-referencing the detection table.
- **Fan-out sub-queries.** The sub-questions an AI Mode fan-out would generate, semicolon separated. Primary keywords only. Leave blank on spokes.
- **ICP voice.** The phrasing the audience actually uses, from Step 2. `[research-thin]` if Step 2 was skipped.

### Cannibalisation notes

{Flagged collisions in this cluster and the recommended resolution. Execution is owned by str-onpage-audit.}

### Coverage gaps

{Intents and fan-out axes within the cluster lacking page coverage, and the recommended new content.}

---

## Cluster: {next-id}

{Repeat for every cluster id.}

---

## Page to Primary Keyword Map (sitewide)

### Tier 1, authority pages

| Page URL | Primary keyword | Intent | Surface | Cluster | Current rank | Recommended H1 | Notes |
|---|---|---|---|---|---|---|---|

### Tier 2, supporting hubs

| Page URL | Primary keyword | Intent | Surface | Cluster | Notes |
|---|---|---|---|---|---|

### Tier 3, location pages ({n} total)

*Omit for a brand with no location pages.*

**Pattern.** {the templated primary and secondary keyword and the H1 and title pattern}

| Page URL | Place | Region | Primary keyword | Surface | Current rank | Tier | Per-place substance (passes doorway gate?) | Notes |
|---|---|---|---|---|---|---|---|---|

### Tier 3, blog posts ({n} total)

| URL | Primary keyword | Cluster | Surface | Volume | Current rank | Search Console impressions | Recommended action |
|---|---|---|---|---|---|---|---|

---

## Cannibalisation Detection

Confirmed keyword-level collisions, detected from ranked-keyword data, Search Console query-by-page, and structural URL duplication.

| Keyword | Competing URLs (position) | Cluster | Evidence source | Recommended resolution |
|---|---|---|---|---|

> Detection only. Execution, meaning merge, redirect, redirect-map update, sitemap update and thin-page cull, is owned by `str-onpage-audit` apply-fixes mode under its staged-change rules. Do not action this table from here.

---

## Top {n} Gap Opportunities

High-leverage keywords not yet adequately targeted, sourced from domain intersection and keyword ideas.

| # | Query | Volume | AI volume | Difficulty | Surface | Priority | Recommendation |
|---|---|---|---|---|---|---|---|

---

## Pillar designation per cluster

| Cluster | Pillar URL | Primary surface | Why it is the pillar |
|---|---|---|---|

---

## Hub-and-Spoke topology

{Per cluster: pillar URL and its spoke list. Consumed by str-internal-links.}

### Cluster 1: {id} hub

- **Pillar:** {URL}
- **Spokes:** {list}

**Linking rule:** every spoke links to its pillar in-content, not only through nav or footer. Pillars link to spokes through curated sections. Location pages link up to hubs and out to local proof, never sideways to one another.

---

## Refresh triggers

1. Quarterly cadence, minimum every 90 days
2. A voice-of-customer research wave lands
3. A new offering, service or service area
4. A significant Search Console traction change
5. A surface shift, meaning a target query starts or stops firing an AI Overview or a local pack
6. A named Google core or spam update
7. Cannibalisation cleanup completes, so re-baseline
8. Bing grounding queries surface retrieval phrasing not in the current map

## Methodology version log

- **v2.0 ({YYYY-MM-DD}):** {what this version changed}
- **v1.x ({YYYY-MM-DD}):** {preserved summary}, archived at `target-keywords.v1.x.md`
````
