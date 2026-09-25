# Entity Graph and Multi-Location Authority

Steps 9 and 10 of `str-authority-strategy`.

## Why the entity graph matters

Entity resolution is how an engine decides what a brand name refers to, what it does, and where. For most brands this is routine. For a brand whose name or category term collides with a stronger meaning it is hostile, because the dominant sense wins the training distribution and the strongest content in the cluster gets resolved against the wrong industry. For example, a client selling mole control competed against the skin-lesion sense of the same word, and the paid side already handled it with roughly 120 medical-cluster negative keywords while the organic and AI side needed the structural equivalent.

The entity graph is that equivalent. Get it right and the brand enters the candidate pool for its own category by default.

**[U] on every specific disambiguation tactic**, because no controlled study exists. The mechanism underneath, meaning candidate generation followed by context-weighted entity linking with popularity bias, is standard natural-language processing and is safe to build on.

## 9a. The `sameAs` spine, build this first

This is the highest-return, lowest-risk entity work available, and **the one place structured data still earns its keep**. [S] A difference-in-differences test found no citation uplift from schema for already-visible pages, at minus 4.6% for AI Overviews, plus 2.4% for AI Mode and plus 2.2% for ChatGPT, and [P] Google states structured data is not required for generative AI search. The surviving justification is entity binding, correctness and rich results, which is exactly what the spine does.

Organization schema carries identical `sameAs` URLs to every profile the brand actually holds. For a brand with locations that means each business-profile map URL, the highest-cited directories for the category, the social profiles, the company and personal professional profiles, and the YouTube channel. For a national or purely digital brand, substitute the equivalent authoritative profiles: professional registries, app or marketplace listings, category review platforms and the code or research hosts where relevant.

**Plus `knowsAbout`**, binding the brand to the specific subject matter of its category, named precisely enough to separate it from any competing sense.

**Three rules on the spine.**

1. **Identical everywhere.** The same URL set on the site, and consistent name, address and phone across every listed profile. A mismatch creates a second candidate entity.
2. **Reciprocal.** Each profile links back to the site. A `sameAs` pointing at a profile that never points back is a half-signal.
3. **Complete before clever.** Finish the spine before proposing anything more exotic. It carries most of the available benefit.

**Supporting move where a collision exists.** Every page using the ambiguous term links to one canonical disambiguation page explaining what the term means in this context. That page is the on-site entity anchor.

## Per-entity strategy template

| Field | What goes here |
|---|---|
| **Entity name** | The Organization, the founder or named expert, any named programme or service, and any referenced subject entity |
| **Entity type** | Organization at the most specific subtype, Person, Service, or a referenced entity |
| **Current state** | Wikidata identifier or absent, Knowledge Panel triggering yes or no and in which market, `sameAs` URLs live in on-site schema, profile claim status |
| **Target state** | Full `sameAs` spine, `knowsAbout` populated, per-location LocalBusiness with `parentOrganization` where applicable, Person bound by `worksFor` |
| **Notability evidence stack** | The independent secondary sources that would qualify the entity for Wikidata |
| **Schema linkage on-site** | The fields carrying the relationship: `sameAs`, `worksFor`, `knowsAbout`, `areaServed`, `parentOrganization`, `provider`, `author` |
| **Action sequence** | Ordered by dependency, never by calendar |

## Notability evidence per entity type

| Entity type | Realistic notability evidence |
|---|---|
| **Organization** | Business registration, founding documentation, sustained independent press coverage, industry association membership, verifiable scale |
| **Person** | Named coverage in independent press, verifiable credentials or service record, quoted-expert placements in trade publications, an authored byline footprint |
| **Service or named programme** | Third-party description of the programme by name, a verifiable customer base, a trademark filing if pursued |
| **Referenced subject entity** | Usually already has an entry. The brand links to it, it does not create it |

Record what is available now and what is still needed. **Do not propose submission before the evidence stack qualifies.**

## 9d. Honest framing on encyclopaedic entries

**A Wikipedia entry is the strongest `sameAs` anchor** because it feeds the Knowledge Graph and multiple training pipelines. It is **not realistically achievable for most regional or mid-market businesses** and should never be presented to a client as a near-term deliverable.

**Wikidata** is a lower bar but still gated on independent secondary sources, and a rejected entry creates friction for future attempts. Treat it as a long-dependency item unblocked by press placements landing, never as parallel work. If a separate brief exists for it, point to that brief from Section 9 and let it own the submission and the evidence assembly.

The achievable stack in 9a delivers most of the benefit without either.

## What to log per entity

```yaml
entity: {brand}
type: Organization ({most specific subtype})
current_state:
  wikidata: absent
  knowledge_panel: verify per market
  sameAs_populated: []          # verify against live schema
  sameAs_missing: []
  knowsAbout: verify it names the category sense explicitly
target_state:
  sameAs: complete spine, identical sitewide, every profile linking back
  knowsAbout: [{the category subject terms}]
  local_business: one node per location, each with parentOrganization -> Organization @id
  wikidata: gated on independent press placements
notability_evidence:
  available_now: []
  needed: []                    # gated on the Section 6 earned-media work
schema_linkage_target:
  areaServed: []
  founder: { entity: {name}, via: Person @id }
  hasOfferCatalog: services with explicit pricing matching the site's visible pricing
action_sequence:
  - 1: Audit live sameAs population in the site's schema
  - 2: Claim every missing profile, add it to sameAs and link it back
  - 3: Verify knowsAbout names the category sense, not just the brand
  - 4: Verify per-location nodes carry parentOrganization
  - 5: Hold Wikidata until independent press placements exist
```

## Multi-location authority

**Primary for a brand with physical locations or defined service areas. A short subset for a brand with no near-me intent.** Decide from `geographic_scope` in the frontmatter and state which it is at the top of Section 10.

### What goes in the section when local is primary

- **Per-location authority audit.** Profile state, citation-surface gaps, named neighbourhoods, and per-location authority anchors, meaning the city paper, the chamber, the neighbourhood association, the local institutional programme. **Named entities, never categories.** Per-location profile mechanics defer to the local SEO skill where one is installed.
- **Directory-by-engine claim order.** Each directory feeds a different engine, so claim in the order below rather than alphabetically.
- **Cross-location entity linkage.** Organization `sameAs` carries every location profile URL, and each location page emits LocalBusiness schema with `parentOrganization` pointing at the Organization identifier.
- **Review acquisition, policy-compliant only.**

### Directory-by-engine matrix

[S] Foundation Marketing and AirOps, 28.5M AI responses. Verify the current ordering against the landscape file section 4.2 before quoting it, because the licensing landscape moves.

| Directory | Which engine it feeds | Priority |
|---|---|---|
| **Yelp** | Google AI Mode, at 66% of its citations, and Perplexity at 28.5%. Strongest on ChatGPT since the [P] 2026-07-23 OpenAI licensing deal covering reviews, ratings, photos and the quote-request flow | P0 per location |
| **Better Business Bureau** | Disproportionately important to ChatGPT, and cheap to establish | P0 per location |
| **Angi** | **The Gemini lever.** Angi led Gemini citations while Yelp barely registered there | P0 per location |
| **Thumbtack** | Secondary marketplace coverage | P1 |
| **HomeAdvisor** | Secondary marketplace coverage | P1 |
| **Nextdoor** | Local and community tail, hyperlocal neighbourhood presence | P1 per location |

The named platforms above are the home-services and local-services pattern. **Do not carry one category's list into another.** For a professional-services, software or research category the equivalent set is different, and it must be measured with an AI-citation source audit rather than assumed.

Bing Places and Apple Business Connect stay on the list as free listings feeding Copilot, Bing, Apple Maps and voice assistants. **Label their weight in AI local answers `[U]`, because it is unmeasured.** [S] The Foursquare claim is dead: an August 2026 test across 4,607 runs found Foursquare at 0.00% of ChatGPT citations while Yelp was attached to 95.83% of structured business cards. Do not build on it.

### Review acquisition, policy-compliant only

Reviews are around 20% of Local Pack weight [S, Whitespark 2026] and the corpus that converts an AI mention into a call. [S] 97% of consumers double-check an AI recommendation against real reviews, 47% will not use a business with under 20 reviews, and 31% will not use one rated below 4.5. Rating acts as a filter, not a ranking signal.

The compliance rules are **blocking**:

- **[P] 2026-04-17.** No staff review quotas, and never ask a customer to name a staff member in their review. The platform prohibits merchants requesting reviews containing specific content, including content identifying a staff member. A customer naming someone spontaneously is fine. Asking for it is a violation. Staff may invite an honest, open-ended review offered equally to every customer with no reward attached.
- **[P] 2026-07-24.** No fake or undisclosed incentivised reviews on the page or in structured data. Any incentive must be clearly and prominently disclosed. Review or AggregateRating markup over undisclosed incentivised reviews is a manual-action risk that kills star-rating eligibility while the page still ranks.
- **Never propose a monthly review target as a quota on staff.** Track velocity as an outcome measure, label any specific per-month number `[U]` unless sourced, and describe the acquisition method rather than a headcount goal.
- **[P] Service-area business rule.** A profile for a business that does not receive customers at its address must not display a street address publicly. Service areas only. A visible address risks suspension, and suspensions on that basis are hard to reverse.
- **Verify live state before diagnosing.** Platform bugs recur, including reviews disappearing after reinstatement, replies not displaying, and false no-reviews states. Check the live profile before attributing a review or ranking change to an algorithm.

## Anti-patterns

- **Submitting to Wikidata too early.** A rejected entry creates friction for later attempts.
- **`sameAs` without reciprocity.** A profile that does not link back is a half-signal.
- **An inconsistent spine.** Different name, address, phone or URL set between the site and a profile creates a second candidate entity, which is the opposite of the intended effect.
- **Presenting schema as a citation lever.** It is entity binding and correctness. Cite the difference-in-differences result when the change is questioned.
- **Treating a name collision as solved.** It is permanent. Every new page, profile and mention either reinforces the right sense or dilutes it. Measure it with the LLM responses endpoint rather than assuming.
- **Treating the entity graph as a one-time build.** Every new placement, profile and video expands it. Re-audit quarterly.
