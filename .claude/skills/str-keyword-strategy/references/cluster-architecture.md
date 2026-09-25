# Cluster Architecture

Topic clusters are the architectural unit of the keyword strategy. A cluster = one **pillar page** + a constellation of **supporting pages** that share a primary intent, cover the query fan-out around the pillar's topic, and link back to it.

Worked examples below are Got Moles. For another client, apply the method and substitute that client's clusters and geography.

## The Got Moles cluster set is fixed

Seven ids, defined in `brand_context/target-keywords.md`:

| id | Pillar | Primary intent | Primary surface |
|---|---|---|---|
| `mole-control` | `/how-to-get-rid-of-moles-in-your-yard/` | Instruction (head) + Commercial (spokes) | AI Overviews + Classic |
| `biology` | `/voles-vs-moles-whats-the-difference/` | Informational | AI Overviews |
| `safety` | `/blog/mole-control-safe-for-pets/` | Informational + Commercial | AI Overviews |
| `cost-value` | `/blog/mole-removal-cost-washington/` | Commercial | AI Overviews (hybrid ~97%) |
| `seasonal` | `/when-are-moles-most-active/` | Informational | AI Overviews |
| `diy-vs-pro` | `/blog/diy-mole-removal-vs-professional/` | Comparison + Commercial | AI Overviews |
| `location-services` | `/` + `/service-areas/` | Commercial / Local | **Local Pack** |

Do not invent, rename or merge ids. A genuinely new cluster is a decision for Spencer, not a side effect of a refresh. Surface tags come from Step 7 of the skill and must be confirmed by a live SERP call for the pillar of each cluster.

**The surface split is the most important line in this table.** `location-services` is won through Google Business Profile, proximity and reviews, not through page copy. Everything else is won through cited, answer-first content that satisfies a query fan-out. Treating them the same sends content work at queries content cannot win.

## What a good cluster looks like

- **3–7 clusters** for a single-brand foundation. More than seven and the brand is trying to be everything; fewer than three and positioning is too narrow. Got Moles sits at seven.
- **One pillar page per cluster.** The comprehensive hub for the topic. Existing or to-build, but exactly one.
- **5–15 supporting queries per cluster**, chosen to cover the fan-out axes rather than to hit a page count.
- **Shared primary intent.** A cluster mixing informational and transactional dilutes the topical signal — though a cluster can legitimately have an informational head and commercial spokes, as `mole-control` does.
- **Boundaries match user mental models**, not content production convenience. If a homeowner would search across two clusters in one session, the boundary may be wrong.

## How clusters derive (for a new client)

1. **Start from ICP problem patterns**, sourced from voice-of-customer research and DataForSEO Labs keyword ideas. Positioning pillars are the sanity check, not the primary source.
2. **Add a brand-defense cluster** only where branded queries carry real volume or face a named competitive threat. For Got Moles they do, so Brand Defense is a live section.
3. **Handle geography as its own cluster** for a local service business. `location-services` is a distinct cluster because it competes on a distinct surface.
4. **Stress-test with real queries** — would the ICP search across two clusters in one session?
5. **Check cluster size.** Fewer than five supporting queries usually means a satellite of another cluster, not a cluster.

## Pillar vs supporting page anatomy

| Layer | Job | Completeness test | Schema |
|---|---|---|---|
| Pillar | The comprehensive answer for the cluster topic. Links out to every spoke. | Answers every fan-out axis for the head query, each in a self-contained passage | Article or BlogPosting with `dateModified`, Person author, BreadcrumbList |
| Supporting (cornerstone) | A deep answer on one sub-topic. Links back to the pillar. | Answers its own sub-question and the two or three that branch off it | Same, plus Service on commercial pages |
| Answer page | One specific question — a definition, a myth, a single fact. | Answers the question in the first 40–60 words | Same |

**There is no word-count target on any layer.** Length is not a completeness test. Word count correlates 0.04 with AI Overview citation (landscape file §5.2). The test is fan-out coverage: does the cluster answer the sub-questions a fan-out would generate.

**Schema is for entity binding and correctness, never for AI citation.** LocalBusiness (most specific subtype), Service, Organization with the `sameAs` spine and `knowsAbout`, BreadcrumbList, Article or BlogPosting with `dateModified`, Person for the author, and Review or AggregateRating only where reviews are genuine and any incentive is disclosed. **Speakable is optional at best. FAQPage earns nothing** — the rich result was removed between 2026-05 and 2026-08 — so keep the question-and-answer *content* shape and stop treating the markup as a deliverable. Existing markup stays; removing it buys nothing either. Never present schema as an AI-citation lever in client-facing output.

## Cluster construction process

1. Merge the candidate keyword set from GSC, DataForSEO Labs keyword ideas and suggestions, competitor gap data, and Bing grounding queries.
2. Assign every candidate to exactly one of the seven ids.
3. Tag each with intent (8 categories) and then surface.
4. Enumerate the fan-out axes for each cluster head: identification, damage, chemical-free methods, pricing, prevention, seasonality, pets and children, DIY-versus-professional, local availability.
5. Map existing pages onto the axes. Uncovered axes are the content plan.
6. Confirm the pillar is the page best positioned to hold the head query, using `ranked_keywords` rather than assumption.

## Anti-patterns

- **Multi-pillar clusters** — one cluster covering biology and cost and city coverage. Each gets its own.
- **Single-page clusters** — one URL with no spokes is a page, not a cluster.
- **Audience-only clusters** — "for homeowners" is the ICP, not a topic.
- **Format-only clusters** — "blog posts" is not a cluster. Format is downstream of topic.
- **Funnel-stage clusters** — TOFU/MOFU/BOFU is not a cluster either. Intent within a topic determines page shape.
- **City-name clusters** — every city is not its own cluster. All 93 city pages are spokes of `location-services`. A strategy that needs a near-identical page ranking per city for the same head term is a doorway-page strategy and fails the gate in the skill's Step 10.
- **Chasing head-term rank as the AI target.** A top-10 organic ranking gives roughly a 25% chance of AI Overview appearance and predicts AI Mode citation barely at all. Cluster coverage does.
