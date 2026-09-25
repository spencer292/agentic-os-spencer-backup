# Topical Authority Anchors + Competitor Authority Audit

> **CLIENT CONTEXT:** this is a Got Moles client skill and every example below is Got Moles — a mole-control service business in Western Washington with three Google Business Profiles (Seattle, Tacoma, Enumclaw), 219+ five-star Google reviews and nearly 5,000 properties served across 6 counties. The named competitor set lives in `brand_context/authority-strategy.md` Section 3. Never write "WA's #1" and never claim I-713 compliance. US English throughout.

Steps 2 and 3 of `str-authority-strategy`. Anchors are the entities that already dominate a cluster's topic, whether or not they compete. The competitor audit reverse-engineers how the actual rivals got where they are.

## Why anchors matter, and why they aren't all competitors

A topical authority anchor is any entity that search and AI systems treat as the go-to voice for a cluster's topic. Some compete. Some are adjacent and can be co-cited rather than displaced. Some are institutional sources to cite, never to out-rank.

Treating every anchor as a competitor produces bad strategy. For this client the distinction is stark: WSU Extension and the Washington Department of Fish and Wildlife dominate several clusters and will never be displaced by a service business. They are sources to cite, and citing them consistently is itself an authority build.

**These anchors are also a scored consumer contract.** `str-onpage-audit` grades pages on whether they carry at least one outbound link to a Tier 1 authority anchor from `authority-strategy.md` Section 2, and `mkt-authority-content` reads Section 2 to decide what to cite. Name real entities with real URLs, never categories.

## Identifying anchors per cluster

Work from the seven cluster ids in `brand_context/target-keywords.md`: `mole-control`, `biology`, `safety`, `cost-value`, `seasonal`, `diy-vs-pro`, `location-services`.

For each cluster:

1. **Surface scan across all four surfaces separately** — classic organic top 10, Local Pack, Google AI Overviews and AI Mode, and the answer engines. They are won by different work and cite different sources, so record which anchor appears where.
2. **Institutional search** — university extension services, state agencies, professional and veterinary associations, museums and species databases.
3. **Wikipedia and Wikidata** — which entities have dedicated entries the brand can link to and bind against with `knowsAbout`.
4. **YouTube** — which channels rank for cluster queries. [S] YouTube mentions are the strongest single AI-visibility correlate (0.737) and YouTube is the leading non-corporate citation source, so channels are anchors, not an afterthought.
5. **Ranked third-party roundups** — who publishes "best mole removal in {city}" and who is currently listed. [S] Listicles are ~21% of all AI citations.

Per anchor, capture:
- **Entity name** and URL, plus Wikidata Q-id if one exists
- **Authority surface** — institutional page, extension publication, regulatory guidance, national publication, YouTube channel, review platform
- **Which surface it wins on** — organic, Local Pack, AI Overviews, AI Mode, or a named engine
- **Audience overlap with the ICP** — full, partial or none
- **Relationship class:**
  - **Compete** — direct rival, same service area, same offering
  - **Co-cite** — adjacent authority the brand should be named alongside
  - **Cite as source** — institutional or regulatory authority the brand links out to
  - **Partner** — a real collaboration path (landscapers, lawn-care firms, pest companies that don't do moles)
  - **Ignore** — phrase overlap only. The homograph makes this class unusually large: dermatology clinics, cosmetic-surgery pages and mole-sauce recipes all match the string and none is an entity relationship. Filter them out explicitly
- **Distinctness** — what they own that Got Moles doesn't, and the reverse

## Competitor authority audit (Step 3)

Once anchors are classed, the **compete** subset gets the audit. This is now API-driven — the old manual press-page scan is retired.

### What to capture, and how

| Audit question | How to find out |
|---|---|
| Where do their links actually come from? | `backlinks/referring_domains/live` with an explicit `limit`, ordered by rank. Read for genuinely regional sources — chambers, city papers, extension services — versus directory noise |
| How big is the profile overall? | `backlinks/summary/live` per target; `backlinks/bulk_ranks/live` for the whole named competitor set in one call |
| What does their anchor profile look like? | `backlinks/anchors/live`. Branded-anchor share is the signal that correlates (0.527); exact-match anchor volume is not |
| Who shares their link sources? | `backlinks/competitors/live` against got-moles.com — surfaces rivals that SERP analysis alone misses |
| Which roundups name them? | Live search for "best mole removal in {city}" and "best pest control in {county}" across the priority cities. Record publisher and inclusion path |
| What earned media have they landed? | Site search against regional publications; their own press page as a cross-check, not the primary source |
| What linkable assets have they published? | Original research, data, guides or tools on their site, and whether anything cites them |
| Do they have a YouTube presence? | Channel, upload cadence, whether their videos surface for cluster queries |
| Which entity-graph surfaces? | GBP, Yelp, BBB, Angi, Nextdoor, Crunchbase, Wikidata, and the `sameAs` array in their on-site schema |
| Are they cited by answer engines? | `ai_optimization/llm_mentions/live` on the competitor name, or the "competitor cited instead" URLs from an optional Pixelmojo report |

Run every call from `clients/got-moles/`, always with a `limit`, and reconcile spend against `.dataforseo-usage.log`. Use `--dry` first on any payload shape you have not run before.

### Reverse-engineering the playbook

Per competitor, distill the 3-5 highest-leverage moves that built their position. Most can be replicated, and some should not be.

**What not to copy:**
- Tactics that only worked because of domain age. A 42-year-old domain's legacy directory links are not a strategy anyone can execute now — counter them with entity completeness, review corpus and multi-location footprint instead.
- Meta-keyword stuffing on a rival's brand name. Google ignores meta keywords, and it bleeds brand defense.
- Thin templated city pages at volume. [P] Google's spam policies name city-targeted pages funneling to one destination as doorway abuse, and scaled-content abuse applies to human and AI writing alike. The counter is per-city substance, not per-city volume.
- Anything that depends on hiding who paid for it — see the prohibition in `co-citation-and-brand-mentions.md`.
- Assets outside what this brand can honestly produce.

**Thin competitor link profiles are a finding, not a failure.** Small local service businesses genuinely have few links. When the whole competitive set is thin, links are not the contested ground — roundup inclusion, review corpus and brand mentions are.

## Anti-patterns

- **Listing every competitor as a displacement target.** Most get out-flanked or co-cited around. Decide the class consciously.
- **Treating institutional sources as competitors.** WSU Extension, WDFW, AVMA and Wikipedia are sources. The goal is to be cited alongside them, not to out-rank them.
- **Missing the adjacent authorities.** The biggest co-citation wins usually come from one degree away — the county Master Gardener program, a regional landscaping channel, the Chamber.
- **Missing the homograph noise.** Dermatology results will appear in every scan. Filter them at intake with the same disambiguation token list the ads negatives use.
- **Audit without action.** The audit is only worth running if it ends in a "what to copy, what to skip" list the brand can execute.

## Output for `authority-strategy.md`

Section 2, per cluster:

```yaml
cluster: biology
pillar: /voles-vs-moles-whats-the-difference/
topical_authority_anchors:
  - entity: "WSU Extension"
    url: "https://extension.wsu.edu/"
    wikidata_qid: null
    authority_surface: "Land-grant extension service; PNW vertebrate-pest fact sheets"
    wins_on: [classic organic, AI Overviews]
    audience_overlap: partial
    relationship_class: cite-as-source
    distinctness: "WSU: institutional research authority, no service delivery. Got Moles: operator with field data across nearly 5,000 properties."
  - entity: "Animal Diversity Web (University of Michigan)"
    url: "https://animaldiversity.org/"
    authority_surface: "Academic species reference for Talpidae"
    wins_on: [classic organic, AI Overviews]
    relationship_class: cite-as-source
    distinctness: "National species reference. Got Moles owns the Western Washington application."
```

Section 3, per competitor:

```yaml
competitor_authority_audit:
  - competitor: "{competitor domain}"
    referring_domains: { count: 0, top_regional: [], directory_noise_share: "0%" }   # backlinks/referring_domains
    anchor_profile: { branded_share: "0%", exact_match_share: "0%" }                 # backlinks/anchors
    listicle_presence: []          # which "best mole removal in {city}" roundups name them
    youtube: { channel: null, ranks_for_cluster_queries: false }
    earned_media: []
    linkable_assets: []
    entity_graph: [GBP, Yelp, BBB, Angi, Nextdoor]                                   # claimed surfaces
    ai_citation: { engines_citing: [], source: "ai_optimization/llm_mentions" }
    playbook: []                   # the 3-5 moves that built their position
    what_to_copy: []
    what_to_skip: []
```

Leave the numeric fields empty until a real run populates them. An audit table filled with estimates is worse than an empty one.
