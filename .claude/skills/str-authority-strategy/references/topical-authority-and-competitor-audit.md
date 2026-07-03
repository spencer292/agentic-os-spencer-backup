# Topical Authority Anchors + Competitor Authority Audit

Steps 2 and 3 of `str-authority-strategy`. Anchors = the entities that already dominate a cluster's topic (whether or not they compete with the brand). Competitor audit = reverse-engineering the playbook competitors used to get there.

## Why anchors matter (and why they're not always competitors)

A topical authority anchor is any entity AI systems and SERPs treat as the "go-to" voice for a cluster's topic. Some anchors compete directly. Some are adjacent — they own related real estate that the brand can be co-cited with rather than displace. Some are entities to cite as sources rather than out-rank.

Treating every anchor as a competitor leads to bad strategy. Knowing which anchor is in which relationship class lets the strategy choose between displacement, co-citation, source-citation, or partnership per anchor.

## Identifying anchors per cluster

Use the cluster id from `target-keywords.md`. For each cluster:

1. **SERP scan** for top 3-5 cluster queries — who appears in top 10 organic + AI Overviews + ChatGPT/Perplexity citations
2. **Wikipedia / Wikidata search** for cluster topic — which entities have dedicated pages
3. **Industry-specific authoritative sources** — academic centers, trade associations, named methodologies, recognized certifications
4. **Podcast hosts dominating the cluster** — top hosts in the topic, where AI systems pull thought-leader citations
5. **Author / book entities** — established books on the cluster topic with active citation footprint

For each anchor identified, capture:
- **Entity name** + Wikidata Q-id (if exists; check via Wikidata API)
- **Authority surface** — Wikipedia, academic affiliation, institutional, publishing footprint, podcast platform, certification body
- **Audience overlap with brand ICP** — full overlap / partial / none
- **Relationship class:**
  - **Compete** — direct rival, same audience, same offering
  - **Co-cite** — adjacent expert, brand should be associated with them (Roy + Scott Abbott, Roy + Wim Hof)
  - **Cite as source** — academic/institutional authority, brand cites them in content
  - **Partner** — explicit collaboration potential
  - **Ignore** — phrase-overlap only, not real entity relationship (phrase-overlap filter: a person/brand whose name coincidentally matches a query is not an entity relationship)
- **Distinctness** — what they own that the brand doesn't, what the brand owns that they don't (compound positioning angle)

## Competitor authority audit (Step 3)

Once anchors are mapped, the **compete** subset gets the audit treatment. For each direct competitor:

### What to capture
| Audit question | How to find out |
|---|---|
| Where do their backlinks come from? | Manual scan of their press / about / media-kit pages, podcast guesting footprint, byline roundups. (Or paid SEO tool if available — but block of AhrefsBot/SemrushBot doesn't constrain THEIR audit, just yours.) |
| What earned media have they landed? | Search "{competitor name}" site:major-publications, scan their press logos, archive.org snapshots of their press pages |
| What linkable assets have they published? | Look for original research / data / surveys / definitive guides on their site; note what attracted citations |
| Which entity-graph platforms? | Wikidata search, Wikipedia, Crunchbase, Google Knowledge Panel triggering check, sameAs URLs in their schema |
| What's their content cadence + topical depth? | Blog post count per cluster, pillar/cornerstone structure, internal linking density |
| Where do they appear as quoted experts? | Search "according to {name}" + "{name} said" + "{name} told" |

### Reverse-engineering the playbook
For each competitor, distill: **the 3-5 highest-leverage moves they made to get to their current authority position.** This is the playbook. Most can be replicated, often faster, by knowing what to copy and what to skip.

### What to NOT copy
- Generic outreach tactics that landed thin links (waste of effort even if it worked for them)
- Strategies tied to their specific audience that don't fit the brand's ICP
- Linkable assets that are out of scope for the brand to produce
- Anything that violates brand-voice / authenticity rules (no generic templated design assets; keep proof claims real)

## Anti-patterns

- **Listing every competitor as a top-tier displacement target.** Most competitors don't get displaced; they get out-flanked or co-cited around. Decide consciously per anchor.
- **Treating Wikipedia/Wikidata as competitors.** They're authoritative source platforms. The brand's job is to BECOME a Wikidata entry, not out-rank Wikipedia.
- **Missing adjacent authorities.** The biggest co-citation wins often come from authorities one degree removed from direct competition (Mollick adjacent to BOS-UP; Wim Hof adjacent to founder-burnout).
- **Audit without action.** Competitor audit only valuable when it produces a "what to copy / what to leapfrog" output the brand can execute.

## Output for `authority-strategy.md`

Per cluster:
```yaml
topical_authority_anchors:
  - entity: "Ethan Mollick"
    wikidata_qid: Q-id-here
    authority_surface: "Wharton Generative AI Lab, Co-Intelligence book, 700K+ LinkedIn"
    audience_overlap: partial
    relationship_class: co-cite
    distinctness: "Mollick: academic + general AI. Brand: UK service-business AI thinking + wellness."

competitor_authority_audit:
  - competitor: "Phil Pallen"
    backlink_sources: ["Simon & Schuster site", "Tubarks blog review", "podcast appearances"]
    earned_media: ["AI Advantage book series promotion"]
    linkable_assets: ["AI for Small Business book itself"]
    entity_graph: ["Goodreads author page", "Amazon Author Central", "publisher catalog"]
    playbook: ["Trade publisher anchor", "podcast circuit", "social proof from clients"]
    what_to_copy: ["Podcast circuit cadence", "Amazon Author Central completeness"]
    what_to_skip: ["Generic SMB framing — brand has tighter service-business angle"]
```
