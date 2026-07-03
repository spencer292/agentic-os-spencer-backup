# Entity-Graph Strategy + Local-Authority Subset

> **CLIENT CONTEXT (added 2026-07-02):** written in the ATP era — the YAML template and worked examples use ATP entities (Roy Castleman, All The Power, BOS-UP, Bedford). For Got Moles substitute: org = Got Moles LLC (founded 2017, WA); founder = Spencer Hill (US Army veteran, 15+ years personal mole-control experience); locations = 3 GBPs (Seattle, Tacoma, Enumclaw); proof = 219+ five-star Google reviews, 5,000 clients; domain = got-moles.com. And CRITICALLY: Got Moles is a multi-location LOCAL service brand — local authority is PRIMARY here, not a subset; read the "local subset" sections below through that inversion.

Steps 9 and 10 of `str-authority-strategy`. Entity-graph = building Wikidata + Wikipedia + sameAs + Knowledge Panel presence; local subset = Bedford-style regional authority that supports but doesn't replace global ICP.

## Entity-graph: why it's the slowest-moving but highest-leverage authority signal

Entity-graph platforms (Wikidata, Wikipedia, Knowledge Graph) are how AI systems decide an entity exists, what it's about, and what other entities relate to it. A brand without entity-graph presence is invisible to AI's "who is this" resolution layer. A brand with entity-graph presence enters the citation candidate pool by default.

For non-regional brands, entity-graph work is global by default (for Got Moles the graph anchors to WA locality). Wikidata is multilingual and platform-neutral; Wikipedia presence in any language adds notability evidence; Knowledge Panel triggering happens per market.

## Per-entity strategy template

For every named entity in the brand (Person, Organization, Book, Product/Service, Methodology), capture:

| Field | What goes here |
|---|---|
| **Entity name** | Roy Castleman / All The Power Ltd / "Thinking Outside Your Brain with AI" / Power Movers / BOS UP UK / T.H.R.I.V.E. method |
| **Entity type** | Person / Organization / Book / PodcastSeries / DefinedTerm / etc |
| **Current state** | Wikidata Q-id (or "absent"), Wikipedia (lang), Knowledge Panel triggering (Y/N + which market), sameAs URLs in on-site schema |
| **Target state** | Q-id submitted, schema-linked, Knowledge Panel triggering for branded query, full sameAs cross-platform |
| **Notability evidence stack** | The independent secondary sources that qualify this entity for Wikidata |
| **Schema linkage on-site** | The schema field/relationship this entity is connected via (`author`, `editor`, `colleague`, `affiliation`, `worksFor`, `knowsAbout`, `inDefinedTermSet`) |
| **Action sequence** | Steps to move from current to target |

## Notability evidence per entity type

Wikidata accepts entries when notability is supportable by ≥2 independent secondary sources. Different entity types qualify differently:

| Entity type | Strong notability evidence |
|---|---|
| **Person (thought leader/coach)** | Recognized programme/certification, registered company, published author, podcast host with platform-confirmed footprint, press mentions in independent outlets, board/EIR position at recognized institution |
| **Organization** | Companies House / equivalent registry, founding date with documentation, employees ≥ threshold, industry awards, press mentions |
| **Book** | ISBN, publisher catalog entry, Amazon listing live, Goodreads entry, ≥2 independent reviews/mentions |
| **PodcastSeries** | Spotify + Apple Podcasts entity pages, episode count, regular host(s), independent reviews/listings |
| **DefinedTerm (named methodology)** | Founder/originator citation, third-party use of the term, structured definition published, used in book/published material |
| **Product/Service** | Customer case studies (verifiable), independent reviews, integration/partner listings |

For each entity in `authority-strategy.md`, list the specific evidence available (or what's still needed). Don't propose Wikidata submission until the evidence stack qualifies.

## Schema linkage as entity-graph cement

On-site schema with `sameAs` URLs and entity relationship fields (`colleague`, `author`, `editor`, `affiliation`, `worksFor`, `knowsAbout`, `founder`, `inDefinedTermSet`, `publisher`) is what tells AI systems *how* the named entities relate. Even without Wikidata entries, rich on-site schema starts building the entity graph.

Sequence:
1. **On-site schema first** — populate every entity field structurally (not just description strings). Even if no Wikidata Q-id exists yet, the relationships render machine-readable.
2. **Cross-platform sameAs** — every place an entity has a profile (LinkedIn, Goodreads, Amazon Author Central, YouTube channel, Spotify, Wim Hof Method instructor profile, Crunchbase, Companies House) goes in the entity's `sameAs` array.
3. **Wikidata submission** when notability evidence stack supports it. Don't submit too early; rejected entries hurt future attempts.
4. **Wikipedia** is a higher bar than Wikidata. Punt unless ≥6 months of earned media + book sales + reviews + multi-source coverage exists.

## What execution work to log per entity

For each entity in `authority-strategy.md`, log the action sequence:

```yaml
entity: Roy Castleman
type: Person
current_state:
  wikidata: absent
  wikipedia: absent
  knowledge_panel: not triggering
  sameAs_populated: [LinkedIn, X/Twitter, Wim Hof Method instructor profile]
  sameAs_missing: [YouTube channel, Power Movers Spotify, Skool, LinkedIn newsletter]
target_state:
  wikidata: Q-id assigned, all P-properties populated
  wikipedia: not in scope until Q3 2026
  knowledge_panel: triggering for branded query
  sameAs_populated: complete cross-platform
notability_evidence:
  available_now:
    - Wim Hof Method instructor (recognised programme)
    - Companies House 12884810
    - Book ISBN 978-1-0676727-0-6
    - Power Movers podcast (Spotify + Amazon UK)
    - "UK's first certified BOS-UP coach" (verifiable via Scott Abbott)
  needed:
    - 2+ independent press placements (gated on launch + earned-media work)
schema_linkage_target:
  affiliation: BOS-UP, Wim Hof Method
  award: ["UK's first certified BOS-UP coach", "Wim Hof Method Level 2 Instructor"]
  colleague: { entity: Scott Abbott, sameAs: scottabbottabc.com }
  worksFor: All The Power Ltd
  knowsAbout: [...]
action_sequence:
  - 1: Populate Person sameAs missing URLs
  - 2: Add structured affiliation/award/colleague/worksFor fields sitewide
  - 3: Capture launch-week press placements as Wikidata source candidates
  - 4: Submit Wikidata entry once 2+ press placements landed
  - 5: Wait for Q-id, then add to all on-site schema as @id reference
```

## Local-authority subset (Step 10)

Only run if the brand has a deliberate regional component. Don't auto-create local sections for global brands.

### When local subset applies
- Brand has a registered office in a specific city/region (Roy's Bedford UK)
- Brand offers any face-to-face component (workshops, retreats, in-person coaching)
- ICP includes regional/near-me intent for any service
- Knowledge Panel benefits from a local-business signal

### When local subset is wrong
- Brand is purely digital with no regional component
- ICP is global with no near-me intent
- Adding local schema dilutes the global Person/Org entity (rare but happens with founder + multinational org)

### What goes in the local subset

For non-regional brands, mark explicitly as **subset, not primary** (Got Moles inverts this — local is primary).

```yaml
local_authority_subset:
  region: Bedford UK
  rationale: "Roy's Companies House registration + primary office. Supports near-me intent and UK regional Knowledge Panel queries. Subset of global ICP strategy."
  components:
    - LocalBusiness schema on Org (currently generic Organization)
    - Google Business Profile claim/populate
    - NAP consistency: Apple Maps, Bing Places, Yelp, Trustpilot
    - Regional press: Bedford-area business journals, Bedfordshire Chamber, FSB Bedfordshire
    - Wim Hof + breathwork local directories (if Roy runs in-person workshops)
  do_NOT_apply:
    - Don't constrain global keyword strategy
    - Don't filter authority-anchor mapping to UK only
    - Don't framing competitive analysis as UK-only
```

## Anti-patterns

- **Submitting Wikidata too early.** A rejected Wikidata entry creates friction for future submissions. Wait until notability evidence stack is solid.
- **sameAs without entity reciprocity.** Listing a YouTube channel in `sameAs` without that YouTube channel's About section linking back to the brand is incomplete entity-graph signal. Update both directions.
- **Local subset that becomes the lead.** Brands sometimes drift into "we're the Bedford expert" framing because local SEO wins arrive faster than global authority wins. For non-regional brands, local stays a subset — but verify against the client ICP first; for a local service brand the "drift" is actually the strategy.
- **Treating the entity graph as a one-time build.** It's compounding. Every new press placement, podcast guest spot, byline expands the graph. Re-audit quarterly.
