---
name: str-authority-strategy
description: >
  Build the foundation authority + backlink + brand-mention + co-citation + entity-graph strategy that downstream skills (str-ai-seo, str-ai-seo-local, future earned-media planning) consume as Context. Use when the user mentions: "authority strategy", "backlink strategy", "link building plan", "earned media strategy", "topical authority plan", "brand mentions", "co-citation strategy", "entity SEO", "Wikidata strategy", "digital PR plan", "who should link to us", "linkable assets", "thought leader authority", "domain authority building". Foundation skill — runs DOWNSTREAM of `str-keyword-strategy` (reads its target-keywords clusters to derive per-cluster authority targets) and UPSTREAM of `str-ai-seo` (audit reads the strategy as Context). Reflects 2026 reality: brand mentions correlate 3x stronger with AI search visibility than backlinks (0.664 vs 0.218), topical authority outweighs raw link power, digital PR is the #1 link-building method. Geographic scope follows the client ICP — for Got Moles (multi-location local service, 3 GBPs) LOCAL IS PRIMARY, not a subset. Produces `brand_context/authority-strategy.md` — versioned, refreshed quarterly. Does NOT trigger for: tactical outreach execution (separate work), per-piece content authoring (use mkt-copywriting), keyword strategy (use str-keyword-strategy first), site audit (use str-ai-seo).
---

# Authority Strategy Foundation

Build a versioned authority strategy specifying WHO should link/cite/mention the brand, WHAT topical authorities matter per cluster, HOW to earn signals, and WHICH linkable assets to create. The 2026 reality: brand mentions matter 3x more than backlinks for AI visibility, topical authority outweighs raw link power, and digital PR + linkable assets beat outreach.

## Outcome

A structured `brand_context/authority-strategy.md` file containing per-cluster authority anchors, co-citation targets (named people/entities to associate with), earned-media target lists, linkable-asset inventory, brand-mention strategy, entity-graph plan, and (if applicable) local-business authority subset. Read by every downstream skill that needs to know what authority signals are being deliberately built.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/positioning.md` | summary + angle | Authority anchors derive from positioning differentiators |
| `brand_context/icp.md` | full | ICP determines which authority surfaces matter (where do owners trust?) |
| `brand_context/target-keywords.md` | full | **Required.** Authority targets are scoped per cluster — needs clusters to exist |
| `brand_context/voice-profile.md` | tone only | Keep recommended pitches/outreach within brand register |
| `context/learnings.md` | `## str-authority-strategy` section | Apply prior corrections |

If `brand_context/target-keywords.md` doesn't exist, **stop and ask the user to run `str-keyword-strategy` first**. Authority strategy without keyword clusters is shotgun.

## Skill Relationships

**Upstream (required):** `str-keyword-strategy` produces `target-keywords.md`. Every cluster in this skill's output maps 1:1 to a cluster in target-keywords.

**Upstream (optional):** `mkt-positioning`, `mkt-icp`, `mkt-brand-voice`. `str-trending-research` for surfacing emergent authority anchors per cluster.

**Downstream:** `str-ai-seo` reads authority-strategy as Context calibration (knows what signals are being deliberately built vs what's organic). Execution briefs (e.g., `wikidata-entity-strategy`, `seo-geo-reinforcement`) consume authority-strategy to prioritise the right earned-media + entity-graph + linkable-asset work. Future per-channel skills (e.g., podcast guesting planner, press kit builder) consume it for tactical execution.

**Refresh:** quarterly, or trigger-based on:
- Positioning pivot, new offering, major industry shift
- Refreshed `target-keywords.md` adds/removes clusters
- Pixelmojo (or equivalent 3rd-party AEO audit) flags new "competitor cited instead" URLs not in current competitor authority audit
- Downstream `str-ai-seo-local` or `str-ai-seo` audit surfaces new authority anchor in any cluster
- Brand-name SERP defense triggered (named competitor erodes brand SERP via meta-keyword stuffing or other tactic)
- New high-severity AI hallucination surfaces (cross-platform fact verification fails on a fact not yet in the hallucination-correction map)

## Before You Start

Confirm scope:
1. **Run mode:** "Foundation build (first run, no `authority-strategy.md` exists), refresh (file exists, quarterly update), or expansion (file exists, adding a cluster's authority strategy)?"
2. **Verify dependency:** `brand_context/target-keywords.md` must exist. If missing, instruct user to run `str-keyword-strategy` first.
3. **Geographic scope:** follow `brand_context/icp.md`. Got Moles is a multi-location LOCAL service brand (3 GBPs — Seattle, Tacoma, Enumclaw): local authority is the PRIMARY frame per Step 10's multi-location pattern, with topical (mole-control expertise) authority layered on top. A global-primary default only fits non-regional brands.

## Step 1: Load Context + Apply Rules

Read brand_context per the table. Read target-keywords.md to ingest the cluster list. Read `context/learnings.md` → `## str-authority-strategy` section.

## Step 2: Topical Authority Anchor Mapping (per cluster)

For each cluster in `target-keywords.md`, identify 5-10 **topical authority anchors** — the high-authority sites/people/entities that currently dominate the cluster's topic. These are NOT necessarily competitors — they're the authorities AI systems cite, the names that show up across SERP for cluster queries, the people/orgs Wikipedia/Wikidata link to.

Per cluster, capture:
- **Anchor name** (entity)
- **Authority surface** (Wikipedia presence, Wikidata Q-id, dominant publications, podcasts, books)
- **Relationship potential** (compete / co-cite / cite-them-as-source / partner / collaborate / ignore)
- **Distinctness from your brand** (what they own that you don't, what you own that they don't)

See `references/topical-authority-and-competitor-audit.md` for mapping methodology + competitor audit playbook.

## Step 3: Competitor Authority Audit (per cluster)

For each cluster, audit top 3-5 competitors (from `target-keywords.md` Step 5 SERP data) on their authority signals:
- Where do their backlinks come from? (manual scan of their press/about pages, podcast appearances, byline sites)
- What earned media have they landed?
- What linkable assets have they published?
- What entity-graph platforms do they appear on?

This identifies the playbook competitors used to build their position — most can be reverse-engineered.

**Pixelmojo / 3rd-party AEO audit input.** Check `~/Downloads/` for the most recent `ai-visibility-report-{domain}-{date}.json` (Pixelmojo Radar). If present and ≤30 days old, ingest its `aiSummary.actions[]` and `recommendations[]` for the **answer** + **citation** pillars — specifically the "competitor cited instead" URLs. These competitors are the ones AI systems treat as most authoritative for the cluster topic, even if they don't outrank in traditional SERP. Add them to the audit list and run the structural authority diff (what they have that we don't: schema completeness, dateModified, authoritative outbound links, named expert quotes, citation count). This data is gold — it surfaces authority anchors that pure SERP analysis misses.

## Step 4: Current Authority Surface Inventory

Audit the brand's existing authority surfaces — not what should exist, what does exist:
- Wikidata / Wikipedia entries
- Crunchbase / Companies House / equivalent registry profiles
- LinkedIn presence (personal + company + newsletter)
- Author profiles (Amazon Author Central, Goodreads, publisher sites)
- Podcast appearances (host + guest, with show notes URLs)
- Industry/professional certifications with public profiles (e.g., Wim Hof Method instructor profile for Roy)
- YouTube / Spotify / Apple Podcasts entity pages
- Schema sameAs URLs already populated
- Brand mentions (linked + unlinked) tracked via Google search of brand name

Output: a "what we own / what we don't yet" summary that feeds Steps 5-8.

## Step 5: Co-Citation Strategy

Co-citation = being mentioned alongside known authoritative entities. Works without direct backlinks. Critical for thought-leader brand association.

For each cluster, name **specific co-citation targets**:
- **Person/entity to be co-cited with** (e.g., Scott Abbott for BOS-UP, Wim Hof for breathwork-business angle, Ethan Mollick — adjacent — for AI-thinking)
- **Why this association strengthens the brand** (what authority transfer happens)
- **Surfaces where co-citation can happen** (joint podcasts, byline pieces, press mentions, schema `colleague`/`knowsAbout`/`founder` fields, Wikidata `P-properties`)
- **Action items** to seed the association

See `references/co-citation-and-brand-mentions.md` for tactics + the brand-mention 3x-correlation rationale.

## Step 5.5: Brand-Name SERP Defense (conditional)

Only run if any of the following triggers apply:
- A named competitor uses brand-name terms in meta keywords / on-page (e.g. Mole Patrol uses "got moles?" in meta keywords for Got Moles)
- The brand name has homonym risk (per `target-keywords.md` Brand-Disambiguation Strategy)
- Brand-name SERP queries (`{brand}`, `{brand} reviews`, `{brand} {city}`, `{brand} pricing`) return non-brand results

If triggered, document:

- **Brand-name query inventory** — every search variant where the brand should rank #1 (`{brand}`, `{brand} {city}`, `{brand} reviews`, `{brand} pricing`, `{founder name} {service}`)
- **Current rank per query** — verified via incognito search from target geo
- **Defense surfaces** — which authority signals reinforce brand-#1 ranking (Organization schema with `sameAs` to LinkedIn/GBP/Crunchbase/BBB/Yelp; Person schema for founder; review-velocity on GBP; press placements stating brand name authoritatively)
- **Threat monitoring** — which competitors actively erode brand SERP; document their tactic and the counter-signal
- **Uncontested-credential opportunities** — credentials no competitor can claim (e.g. `veteran owned mole control washington` for Got Moles, where Spencer is the only US Army veteran founder in the cluster). These are pure-win authority plays — document explicitly and own the search surface

This section feeds the entity-graph plan (Step 9) and the brand-mention strategy (Step 8).

## Step 6: Earned-Media Target List

For each cluster, list 10-15 publications/podcasts/platforms that:
- Cover the cluster's topic regularly
- Have audience overlap with ICP
- Accept guest contributions, expert quotes, OR data-driven story pitches
- Have authority strong enough to matter (not link farms)

Tier by access difficulty:
- **Tier 1 — flagship outlets** (hardest to land, biggest authority transfer)
- **Tier 2 — industry/trade publications** (achievable with original data or expert quote)
- **Tier 3 — niche / podcast / specialist** (most achievable, still meaningful)

Global by default. Regional/UK subset only if there's a deliberate regional play. See `references/earned-media-and-linkable-assets.md`.

## Step 7: Linkable-Asset Inventory

Linkable assets = content the brand should produce because it's the kind of thing journalists, bloggers, and authoritative sites NATURALLY want to cite. Original research, data studies, surveys, frameworks, calculators, definitive guides, comparison tables.

For each cluster, propose 2-4 linkable assets:
- **Asset type** (original survey / data study / calculator / framework / definitive guide / industry report)
- **Hook** (the angle that makes journalists/AI systems want to cite it)
- **Effort** (trivial / moderate / substantial)
- **Cluster served** (must align with target-keywords cluster)

Linkable assets > outreach. Build something people want to cite, then outreach announces it.

See `references/earned-media-and-linkable-assets.md` for asset patterns + hook engineering.

## Step 8: Brand Mention Strategy

Per the 2026 research: brand mentions correlate **3x stronger with AI search visibility than backlinks** (0.664 vs 0.218). Treat brand mentions as a primary signal, not a footnote.

Four components per cluster:
- **Proactive mention earning** — Featured/Qwoted/HARO-equivalent expert-source platforms, journalist outreach for quoted-expert positioning
- **Reactive mention monitoring** — track unlinked brand mentions across web, convert to linked when possible, but DON'T chase every link (unlinked still counts)
- **Mention-quality scoring** — authoritative vs dismissive vs neutral context
- **Hallucination-correction signals** — when AI providers state wrong facts about the brand (verified via Pixelmojo hallucination matrix or branded-query testing across ChatGPT / Claude / Perplexity / Gemini), authoritative third-party sources stating correct facts is itself an authority signal. Track which surfaces correct each fact:
  - `llms.txt` + `llms-full.txt` updates (first-party but AI-readable)
  - Organization schema fields (`foundingDate`, `numberOfEmployees`, `hasOfferCatalog` with explicit pricing)
  - Press placements stating the correct fact verbatim
  - Wikidata entity properties (P-codes for founding date, founder, location)
  - GBP profile facts (founding year, services, pricing posture)
  - Per-fact correction map: each high-severity hallucination gets a tracked correction surface and a re-test date (7-30 days after correction lands)

See `references/co-citation-and-brand-mentions.md` for the methodology + tracking approach.

## Step 9: Entity-Graph Plan

For each named entity (Person, Organization, Book, Product/Service, Methodology), specify:
- **Current state** (what exists: Wikidata entry, Wikipedia, knowledge panel triggering, sameAs URLs)
- **Target state** (what should exist for this entity to be AI-citable)
- **Notability evidence** (the independent secondary sources that qualify the entity for Wikidata/Wikipedia)
- **Schema linkage** (how the brand's on-site schema connects this entity into the graph — `sameAs`, `colleague`, `affiliation`, `worksFor`, `editor`, etc.)

This step ties the keyword strategy + co-citation + earned-media + linkable-asset work into a coherent entity-graph build. See `references/entity-graph-and-local-subset.md`.

## Step 10: Local-Authority Subset (conditional)

Only run if the brand has a deliberate regional/local component. For Got Moles this is the core play — WA service area with 3 GBP locations; for a brand without local intent, skip entirely.

If running, document:
- LocalBusiness schema requirements
- Google Business Profile state + claim plan
- NAP consistency across local directories
- Regional press / industry-association authority surfaces
- Local-specific earned-media targets

**Multi-location pattern.** When the brand has multiple GBPs (e.g. Got Moles has 3 — Seattle, Tacoma, Enumclaw), the local subset is NOT a single block — run per-location:

- Per-location GBP audit (primary category, NAP, photos, reviews, posts) — defer to `str-ai-seo-local` if installed
- Per-location citation surface (Bing Places + Apple Business Connect + Yelp + BBB + Angi + Nextdoor — all per location)
- Per-location authority anchors (regional press, Chamber of Commerce, neighbourhood associations, industry trade publications by service area)
- Cross-location entity-graph linkage (Organization schema sameAs each GBP map URL; per-location LocalBusiness schema with `parentOrganization` pointer)
- Review-velocity gap audit per location (target: 8+ new reviews/month/location for local-pack ranking)

For multi-location service brands, the local subset can be the PRIMARY work, not a subset. In that case, escalate prominence in the output schema — make it a co-primary section with the global cluster work, not an appendix.

**Separate Wikidata brief link.** If a separate Wikidata entity strategy brief exists (e.g. `projects/briefs/wikidata-entity-strategy/`), reference it in the entity-graph plan (Step 9), don't duplicate. Authority strategy points to it; the brief executes the Q-id submission, sameAs population, and notability-evidence assembly.

For non-regional brands, mark local as **subset, not primary**. For multi-location service brands — Got Moles included — local IS primary. See `references/entity-graph-and-local-subset.md`.

## Step 11: Output

Write to `brand_context/authority-strategy.md`. Canonical schema:

```markdown
---
last_updated: YYYY-MM-DD
methodology_version: 1.0
geographic_scope: global (with regional subsets where applicable)
data_sources: [target-keywords.md, live SERP, manual competitor scan, Wikidata API]
---

# Authority Strategy — {brand}

## Cluster: {id} (matches target-keywords cluster id)

### Topical authority anchors
| Entity | Authority surface | Relationship | Distinctness |
|---|---|---|---|

### Competitor authority audit
{playbook each top competitor used}

### Current authority surfaces (own)
{what exists today}

### Co-citation targets
| Entity | Why | Surfaces | Action items |
|---|---|---|---|

### Earned-media targets
| Outlet | Tier | Audience overlap | Pitch angle |
|---|---|---|---|

### Linkable assets to build
| Asset | Hook | Effort | Cluster served |
|---|---|---|---|

### Brand-mention strategy
- Proactive: ...
- Reactive monitoring: ...
- Quality tracking: ...

### Entity-graph plan
| Entity | Current state | Target state | Notability evidence | Schema linkage |
|---|---|---|---|---|

---
## Cluster: {next-id}
...

---

## Local-authority subset (if applicable)
{regional/local components flagged as subset}

## Refresh triggers
{quarterly + trigger-based events}

## Methodology version log
- v1.0 (2026-04-25) — initial build
```

After writing: copy to `~/Downloads/`, show absolute path so user can click.

## Step 12: Save + Collect Feedback

Ask: "Anything missing? Wrong anchors? Co-citation targets I shouldn't pursue? Earned-media outlets you'd cut? Assets you wouldn't build?"

Log responses to `context/learnings.md` under `## str-authority-strategy` with date. If feedback reveals a methodology issue, update `## Rules` section below immediately.

## Rules

*Entries added when the user flags issues. Format: `- {YYYY-MM-DD}: {correction}`*

- 2026-05-08: Phase 0 currency audit — added Pixelmojo / 3rd-party AEO audit as Step 3 input (ingest "competitor cited instead" URLs into competitor authority audit); added Step 5.5 Brand-Name SERP Defense for brands with named-competitor erosion or homonym risk; added hallucination-correction signals as 4th component of brand-mention strategy (Step 8 — track per-fact correction surface + re-test date); added multi-location pattern to Step 10 (per-location audit + per-location citation surface + escalation when local is primary not subset); added separate-Wikidata-brief link rule; added 4 refresh triggers (Pixelmojo new gap, downstream audit anchor, brand SERP defense triggered, new hallucination surface).
- 2026-04-25 (superseded for this client 2026-07-02): geographic frame follows `brand_context/icp.md`. Got Moles = LOCAL-PRIMARY (per-location audit + citation surface per Step 10); topical authority supports it. Global-primary only fits non-regional brands.
- 2026-04-25: Brand mentions are weighted as a primary signal, not a footnote — per 2026 research showing 3x stronger correlation with AI search visibility than backlinks. The `brand-mention strategy` step is non-optional.
- 2026-04-25: Linkable assets are the leading link-earning method, not outreach. Skill output should propose specific assets to build per cluster, not generic outreach lists.
- 2026-04-25: Co-citation is treated as a structured component with named entities + specific surfaces, not a vague aspiration. Concrete relationships (for Got Moles: WA lawn-care and landscaping firms, pest-control associations, local-news gardening desks, veteran-owned business directories) are what filled-in co-citation looks like — name real entities, not categories.
- 2026-04-25: Required upstream: `brand_context/target-keywords.md` produced by `str-keyword-strategy`. Don't run authority strategy without keyword clusters — the work becomes shotgun.

## Self-Update

If the user flags an issue with the output during or after a run — wrong cluster mapping, false topical authorities, co-citation targets that misrepresent existing relationships, earned-media targets out of scope, linkable assets the brand can't realistically produce — update the `## Rules` section above immediately.

## Troubleshooting

- **No `target-keywords.md` exists:** stop and instruct user to run `str-keyword-strategy` first. Don't run authority work without keyword clusters.
- **Wikidata API returns zero entries for named entities:** that's a notability-evidence gap, not a blocker. Document the gap in entity-graph plan as "needs ≥2 independent secondary sources before Wikidata submission."
- **Competitor authority audit hard to complete (manual scan):** if the user later subscribes to Ahrefs/SEMrush/Moz, the competitor backlink piece can be automated. Until then, manual scan of competitors' press/about/byline pages is the reproducible baseline.
- **Co-citation targets feel too aspirational:** good co-citation candidates have a real existing connection point (shared platform, prior conversation, event presence, explicit endorsement). Pure aspiration ("Oprah should mention us") doesn't qualify.
- **Linkable asset feels generic ("write a guide"):** sharpen until the asset has a unique hook journalists would actually cite. Generic = ignored.
