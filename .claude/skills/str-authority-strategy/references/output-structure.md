# Output Structure for `brand_context/authority-strategy.md`

Write the numbered Section 1 to 10 structure exactly. **Section numbers and titles are a consumer contract.** `str-onpage-audit` addresses Sections 2, 5, 8.4 and 9 by number, and the content skills read Sections 2 and 9. A refresh emitting any other shape breaks them.

Section 1 is conditional and runs only when a brand-defense trigger applies. Section 10 is the largest section for a brand with locations and a short subset for a brand with no near-me intent. Every other section is mandatory.

````markdown
---
last_updated: YYYY-MM-DD
methodology_version: {n.n}
geographic_scope: {verbatim from brand_context/icp.md. Never "global" by default. Name the frame explicitly: local with its named places and location count, national with its country, or international with its market list. Say whether local authority is PRIMARY for this brand or a subset}
data_sources:
  - brand_context/target-keywords.md v{n} ({n} clusters, Tier 1/2/3 map, Brand-Disambiguation Strategy, Brand Defense)
  - brand_context/positioning.md, brand_context/icp.md
  - str-ai-seo/references/search-landscape-2026-09.md (landscape baseline)
  - DataForSEO backlinks, content_analysis/search and ai_optimization, run {date}, spend ${x.xx} per the usage log
  - {optional third-party AI-visibility report, {date}} / {Bing Webmaster AI Performance grounding queries, read {date}}
canonical_facts:
  - {carried forward from the prior version: founding, founder, service area, scale, pricing, methodology, review corpus. Every authority surface reinforces these and every hallucination is measured against them}
---

# Authority Strategy: {brand}

{Two paragraphs. The lever ordering with its evidence tier, and what is primary for this brand.}

---

## Section 1: Brand Defense (Step 5.5, conditional)

*Include only when a trigger applies. State the trigger.*

### Brand-name query inventory
| Query | Volume | Page | Defense priority |
### Entity check per engine
| Prompt | ChatGPT | AI Overviews | Gemini | Claude | Perplexity | Verdict |
### Defense surfaces
| Surface | Action |
### Threat monitoring
| Competitor | Tactic | Counter-signal |
### Uncontested-credential opportunities
| Credential | Authority play | Surface |

*Never write an unsubstantiated superlative or a compliance claim the brand cannot evidence into this section.*

---

## Section 2: Topical Authority Anchors per Cluster

### Cluster {n}: {cluster-id}
**Pillar:** {pillar URL from target-keywords.md}
| Anchor | URL | Surface | Relationship | Distinctness |

{One block per cluster, covering every cluster id in target-keywords.md.}

---

## Section 3: Competitor Authority Audit

### Referring-domain and anchor profile
| Competitor | Referring domains | Branded-anchor share | Notable relevant links | Listicle presence | YouTube |
### Authority playbook to reverse-engineer
| Signal | Competitor approach | Our counter |
### What to copy, what to skip

---

## Section 4: Current Authority Surface Inventory

### `sameAs` spine state
| Profile | Claimed | In Organization sameAs | Links back | Engine fed |
### Strong and claimed surfaces
| Surface | State | Notes |
### Gaps and unclaimed surfaces
| Surface | State | Priority | Action |
### Off-site signal baseline
| Signal | Value | Source | Confidence |

---

## Section 5: Co-Citation Strategy

### Co-citation targets per cluster
| Target entity | Cluster | Why it strengthens | Surfaces | First action | Cadence |
### Expert-as-source co-citation surfaces

---

## Section 6: Earned-Media Target List

### 6a: Third-party ranked listicles (priority class)
| Roundup | Query and place or segment | Publisher | Inclusion path | Current occupants | Status |
### Tier 1: flagship
| Outlet | Audience overlap | Pitch angle | Submission path | Status |
### Tier 2: industry and trade
### Tier 3: niche, community, podcast and YouTube

---

## Section 7: Linkable-Asset Inventory

### Asset proposals per cluster
| # | Asset | Hook | Citation potential | Dependency | Cluster | YouTube companion |
### Dependency-ordered sequence
| Band | Assets | Unblocked by |

*No effort or duration estimates. Bands are dependency bands, never calendar bands.*

---

## Section 8: Brand-Mention Strategy and Hallucination Correction

### 8.1 Proactive mention earning
### 8.2 Reactive mention monitoring
### 8.3 Mention-quality and sentiment scoring
| Run date | Total mentions | Authoritative | Listed | Neutral | Dismissive | Negative | Sentiment split | Per-engine mention rate |
### 8.4 Hallucination correction surface
| Fact | Hallucination | Ground truth | Correction surfaces (ordered) | Re-test prompt | Last verdict |

---

## Section 9: Entity-Graph Plan

### 9a: `sameAs` spine and `knowsAbout` binding
### 9b: Person entity
### 9c: Per-entity state
#### Entity {n}: {name} ({type})
| Field | Current | Target | Action |
### 9d: Encyclopaedic entries, honest framing

---

## Section 10: Multi-Location Authority ({PRIMARY or subset})

*State which at the top of the section, from geographic_scope.*

### Per-location authority audit
| Location | Profile status | Citation surface gaps | Per-location authority anchors | Review state |
### Directory-by-engine matrix
| Directory | Engine fed | Priority | Status per location |
### Review acquisition (policy-compliant)
### Cross-location entity-graph linkage

---

## Refresh triggers

{Quarterly plus the trigger-based events from the skill's Skill Relationships section.}

## Methodology version log

- **v{n.n} ({date}):** {what changed and why}
````

## After writing

1. Show the absolute path.
2. Hand the document to whatever review mechanism `brand_context/` or the workspace `AGENTS.md` names for this brand. Where none is named, the file on disk is the deliverable.
3. Working data from the run goes to `projects/str-authority-strategy/data/`. Any standalone analysis goes to `projects/str-authority-strategy/{YYYY-MM-DD}_{topic}-audit.md`. **The foundation document itself stays in `brand_context/`.**

## Confidence labels

Every statistic reaching this document carries `[P]` primary documentation, `[S]` named study with a stated sample, or `[U]` unverified. A `[U]` figure never becomes a scored rule or a client-facing fact.
