# Entity-Graph Strategy + Multi-Location Local Authority

> **CLIENT CONTEXT:** this is a Got Moles client skill and every example below is Got Moles. Organization = Got Moles (founded 2017, Washington State). Founder = Spencer Hill, US Army veteran, 15+ years of personal mole-control experience — kept distinct from the 2017 company founding date. Locations = three Google Business Profiles (Seattle, Tacoma, Enumclaw) covering 6 counties and 92+ communities. Proof = 219+ five-star Google reviews, nearly 5,000 properties served. Domain = got-moles.com. **Got Moles is a multi-location LOCAL service brand: local authority is PRIMARY, never a subset or appendix.** Never write "WA's #1" and never claim I-713 compliance. US English throughout.

Steps 9 and 10 of `str-authority-strategy`.

## Why the entity graph matters here

Entity resolution is how an engine decides what "Got Moles" refers to, what it does, and where. For this brand that question is unusually hostile, because **"mole" resolves to a skin lesion, a burrowing mammal, a spy, a chemistry unit and a Mexican sauce — and the skin-mole sense dominates the training distribution.** That is popularity bias, not simple ambiguity. The paid side already handles it with roughly 120 medical-cluster negatives; the organic and AI side needs the structural equivalent.

The entity graph is that equivalent. Get it right and the brand enters the candidate pool for lawn-mole queries by default. Get it wrong and the strongest content in the cluster gets resolved against dermatology.

**[U] on every specific disambiguation tactic** — no controlled study exists. The mechanism underneath (candidate generation, then context-weighted entity linking with popularity bias) is standard NLP and is safe to build on.

## 9a. The `sameAs` spine — build this first

This is the highest-return, lowest-risk entity work available, and **the one place structured data still earns its keep**. [S] Ahrefs' difference-in-differences test found no citation uplift from schema for already-visible pages (−4.6% AI Overviews, +2.4% AI Mode, +2.2% ChatGPT), and [P] Google states structured data is not required for generative AI search. The surviving justification is entity binding, correctness and rich results — which is exactly what the spine does.

**Organization schema carries identical `sameAs` URLs to:**

| Profile | Why it is on the spine |
|---|---|
| GBP × 3 (Seattle, Tacoma, Enumclaw) map URLs | The primary local entity records |
| Yelp | [S] Highest-cited directory overall; the dominant local source for Google AI Mode and Perplexity, and for ChatGPT since the [P] 2026-07-23 OpenAI licensing deal |
| Better Business Bureau | [S] Disproportionately weighted by ChatGPT |
| Angi | [S] The Gemini lever — Angi led Gemini citations while Yelp barely registered there |
| Facebook | Long-standing entity corroboration |
| LinkedIn — company page and Spencer's personal profile | Organization and Person binding |
| YouTube channel | [S] The strongest single AI-visibility correlate (0.737); also an entity record |

**Plus `knowsAbout`**, binding the brand to the pest-control sense: mole control, Talpidae, Townsend's mole, Pacific mole, shrew mole, chemical-free trapping, lawn and turf damage, molehills, burrow and tunnel systems.

**Three rules on the spine:**
1. **Identical everywhere.** The same URL set on the site, and consistent NAP across every listed profile. A mismatch is a second candidate entity.
2. **Reciprocal.** Each profile links back to got-moles.com. A `sameAs` pointing at a profile that never points back is a half-signal.
3. **Complete before clever.** Finish the spine before proposing anything more exotic. It carries most of the available disambiguation benefit.

**Supporting move:** every page that uses the word "mole" links to one canonical disambiguation page — what a lawn mole is, why it is not a skin mole, what a molehill looks like. That page is the on-site entity anchor.

## Per-entity strategy template

For every named entity, capture:

| Field | What goes here |
|---|---|
| **Entity name** | Got Moles / Spencer Hill / Total Mole Control Program / Townsend's mole |
| **Entity type** | Organization (LocalBusiness subtype) / Person / Service / referenced species entity |
| **Current state** | Wikidata Q-id or "absent", Knowledge Panel triggering (yes/no, which market), `sameAs` URLs live in on-site schema, profile claim status |
| **Target state** | Full `sameAs` spine, `knowsAbout` populated, per-location LocalBusiness with `parentOrganization`, Person bound by `worksFor` |
| **Notability evidence stack** | The independent secondary sources that would qualify the entity for Wikidata |
| **Schema linkage on-site** | The fields carrying the relationship: `sameAs`, `worksFor`, `knowsAbout`, `areaServed`, `parentOrganization`, `provider`, `author` |
| **Action sequence** | Ordered by dependency, never by calendar |

## Notability evidence per entity type

Wikidata accepts entries when notability is supportable by independent secondary sources. Different entity types qualify differently:

| Entity type | Realistic notability evidence for this client |
|---|---|
| **Organization** | Washington state business registration, founding documentation, sustained independent press coverage, industry association membership, verifiable scale |
| **Person (founder)** | Named coverage in independent regional press, verifiable military service record, quoted-expert placements in trade publications, an authored byline footprint |
| **Service / named program** | Third-party description of the program by name, verifiable customer base, trademark filing if pursued |
| **Species reference** | Already has entries — Got Moles links to them, it does not create them |

Record what is available now and what is still needed. Do not propose submission before the evidence stack qualifies.

## 9d. Honest framing on Wikidata and Wikipedia

**Wikipedia is the strongest `sameAs` anchor** because it feeds the Knowledge Graph and multiple training pipelines. It is **not realistically achievable for a regional service business** and should never be presented to the client as a near-term deliverable.

**Wikidata** is a lower bar but still gated: it needs independent secondary sources, and a rejected entry creates friction for future attempts. Treat it as a long-dependency item unblocked by Tier 1 and Tier 2 press placements landing, not as parallel work. If a separate Wikidata brief exists in `projects/briefs/`, point to it from Section 9 and let the brief own the submission, the property population and the evidence assembly — do not duplicate it here.

The achievable stack in 9a delivers most of the disambiguation benefit without either.

## What to log per entity

```yaml
entity: Got Moles
type: Organization (LocalBusiness subtype)
current_state:
  wikidata: absent
  knowledge_panel: verify per market
  sameAs_populated: [GBP Seattle, GBP Tacoma, GBP Enumclaw]      # verify against live schema
  sameAs_missing: [Yelp, BBB, Angi, Facebook, LinkedIn company, YouTube]
  knowsAbout: present — verify it names the pest-control sense explicitly
target_state:
  sameAs: complete spine, identical sitewide, every profile linking back
  knowsAbout: mole control, Talpidae, Townsend's mole, chemical-free trapping, lawn damage
  local_business: one LocalBusiness node per GBP, each with parentOrganization -> Got Moles @id
  wikidata: gated on independent press placements
notability_evidence:
  available_now:
    - Washington business registration, founded 2017
    - 219+ five-star Google reviews across three profiles
    - nearly 5,000 properties served across 6 counties, 92+ communities
  needed:
    - independent regional press placements (gated on Section 6 earned-media work)
schema_linkage_target:
  areaServed: [King, Pierce, Snohomish, Thurston, Kitsap, Lewis]
  founder: { entity: Spencer Hill, via: Person @id }
  hasOfferCatalog: services with explicit pricing, matching the site's visible pricing
action_sequence:
  - 1: Audit live sameAs population in the site's schema module
  - 2: Claim every missing profile, then add it to sameAs and link it back
  - 3: Verify knowsAbout names the pest-control sense, not just the brand
  - 4: Verify per-location LocalBusiness nodes carry parentOrganization
  - 5: Hold Wikidata until independent press placements exist
```

```yaml
entity: Spencer Hill
type: Person
current_state:
  person_schema: live on /about/ and /author/spencer/ — verify completeness
  sameAs_populated: []                                            # verify
  sameAs_missing: [LinkedIn personal]
target_state:
  worksFor: Got Moles @id
  knowsAbout: [mole control, Talpidae, chemical-free trapping, Western Washington turf]
  sameAs: LinkedIn personal, plus any public professional profile
  byline: Person schema on every post he authors
notability_evidence:
  available_now:
    - founder of a multi-location regional service business
    - US Army veteran (service verifiable)
  needed:
    - independent press placements naming him
action_sequence:
  - 1: Complete Person schema on /about/ and /author/spencer/
  - 2: Bind worksFor to the Organization @id
  - 3: Add the byline to every post he authors
  - 4: Capture press placements as future notability evidence
```

## Multi-location local authority (Step 10)

**For Got Moles this is the primary work.** The "is local a subset?" question does not arise: three GBPs, six counties, 92+ communities, and an ICP with near-me intent on almost every transactional query.

For a brand where local genuinely is a subset — purely digital, no near-me intent — mark it as a subset and keep it short. That case does not apply here.

### What goes in the multi-location section

- **Per-location authority audit** — profile state, citation-surface gaps, named neighborhoods, and per-location authority anchors (city paper, county Chamber, neighborhood association, county Master Gardener program). Named entities, never categories.
- **Directory-by-engine claim order** — the matrix in `SKILL.md` Step 10. Yelp, BBB and Angi are P0 across all three locations because each one feeds a different engine. Thumbtack, HomeAdvisor and Nextdoor follow. Bing Places and Apple Business Connect stay on the list as free listings, with their weight in AI local answers labeled `[U]` because it is unmeasured.
- **Cross-location entity linkage** — Organization `sameAs` carrying all three GBP map URLs; each city page emitting LocalBusiness schema with `parentOrganization` pointing at the Organization `@id`.
- **Review acquisition, policy-compliant only** — the blocking rules are in `SKILL.md` Step 10. In short: [P] 2026-04-17 bans staff quotas and asking a customer to name a technician; [P] 2026-07-24 bans fake or undisclosed incentivized reviews in content and in Review or AggregateRating markup, at manual-action risk. Track velocity as an outcome, never as a staff quota.
- **[P] Service-area business rule** — none of the three profiles may display a street address publicly. Service areas only. A visible address on a service-area profile risks suspension, and suspensions on that basis are hard to reverse.

### Verify live state before diagnosing

Several GBP bugs were logged through 2026 — reviews disappearing after reinstatement, review replies not displaying, "no reviews yet" display errors. Check the live profile before attributing a review or ranking change to an algorithm.

## Anti-patterns

- **Submitting Wikidata too early.** A rejected entry creates friction for later attempts. Wait for the evidence stack.
- **`sameAs` without reciprocity.** A profile that does not link back to got-moles.com is a half-signal.
- **An inconsistent spine.** Different NAP or a different URL set between the site and a profile creates a second candidate entity — the opposite of the intended effect.
- **Presenting schema as a citation lever.** It is entity binding and correctness. Cite the Ahrefs difference-in-differences result when the change is questioned.
- **Treating "mole" as a solved problem.** The homograph is permanent. Every new page, profile and mention either reinforces the pest-control sense or dilutes it. Measure it with `ai_optimization/llm_responses/live` rather than assuming.
- **Treating the entity graph as a one-time build.** Every new placement, profile and video expands it. Re-audit quarterly.
