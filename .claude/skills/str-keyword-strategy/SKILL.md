---
name: str-keyword-strategy
description: >
  Build the foundation keyword + search-intent + page-mapping strategy that downstream skills (str-ai-seo, mkt-copywriting, str-cro-audit, mkt-content-repurposing) consume as Context. Use when the user mentions: "keyword research", "keyword strategy", "what should we target", "keyword plan", "search strategy", "intent mapping", "keyword clustering", "topical authority planning", "build a keyword foundation", "GSC keyword analysis", "what queries are we ranking for". Foundation skill — runs upstream of `str-authority-strategy` and `str-ai-seo`. Geographic scope follows the client ICP (Got Moles: local — WA service area). Uses Google Search Console first-party data (via the client GSC scripts) + live SERP testing + brand_context, NOT third-party SEO tools (AhrefsBot/SemrushBot are blocked in robots.txt by choice). Produces `brand_context/target-keywords.md` — versioned, refreshed quarterly. Does NOT trigger for: ad keyword research (separate concern), per-piece copywriting (use mkt-copywriting), competitor backlink analysis (use str-authority-strategy), trending topic research (use str-trending-research).
---

# Keyword Strategy Foundation

Build a versioned, intent-led, cluster-based keyword strategy. The 2026 reality: search-intent leads, search-volume follows, GSC is the only first-party truth, and AI search (GEO) layers on top of traditional SEO — same content, different optimisation.

## Outcome

A structured `brand_context/target-keywords.md` file containing topic clusters with assigned pillar pages, target queries with intent classification (8 categories), per-page assignment, GSC baseline data, target positions, and priority scoring. Read by every downstream content + audit skill so keyword work stops drifting query-to-query.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/positioning.md` | summary + angle | Topic clusters derive from positioning pillars |
| `brand_context/icp.md` | full | ICP language → query phrasing; geography note → don't auto-prefix queries with country |
| `brand_context/voice-profile.md` | tone only | Keep queries within audience-natural phrasing |
| `context/learnings.md` | `## str-keyword-strategy` section | Apply prior corrections |

Proceed without brand_context if missing — flag the gap and produce a draft that's flagged "needs voice/positioning calibration."

## Skill Relationships

**Upstream — REQUIRED:**
- `mkt-positioning`, `mkt-icp`, `mkt-brand-voice` produce brand_context.
- **`str-trending-research`** — REQUIRED, not optional. Keyword strategy must start from REAL ICP problem language sourced from Reddit/X/LinkedIn/web pain mining, NOT from brand positioning alone. Run it per candidate cluster topic before cluster derivation. Without research, clusters end up brand-out (marketing-language head queries) instead of ICP-in (real pain-language long-tail queries). The two produce very different keyword strategies, and brand-out is wrong for early-stage brands without awareness yet.

**Why this matters (the loop direction):** owners on Reddit don't say "AI thinking methodology" — they say "I tried ChatGPT but it just gives me generic crap." Ranking on the real-language version is what builds traffic. Traffic is what builds brand awareness. Brand awareness is what eventually makes branded queries searchable. The loop runs ICP-language → traffic → brand. Running it brand-out (positioning → branded queries first) produces a strategy nobody searches.

**Downstream:** `str-authority-strategy` reads target-keywords clusters to derive per-cluster authority targets. `str-ai-seo` reads target-keywords as audit calibration. `mkt-copywriting`, `str-cro-audit`, `mkt-content-repurposing` read the file for per-piece keyword + intent matching.

**Refresh:** quarterly, or trigger-based on major positioning pivot, ICP shift, significant GSC traction change, OR new research wave (str-trending-research run that surfaces a pain cluster the current strategy doesn't address).

## Before You Start

Confirm scope:
1. **Run mode:** "Foundation build (first run, no `target-keywords.md` exists), refresh (file exists, quarterly update), or expansion (file exists, adding a new cluster)?"
2. **Geographic scope:** follow the geography note in `brand_context/icp.md`. Got Moles is a LOCAL service business — default = Washington State service area (county/city granularity). A global default only fits non-regional brands.
3. **Cluster count:** typically 3-7 for a single-brand foundation. Derive from positioning pillars unless the user specifies.

## Step 1: Load Context + Apply Rules

Read brand_context per the table. Read `context/learnings.md` → `## str-keyword-strategy` section. Apply any Rules entries listed below.

## Step 2: ICP Problem Research (REQUIRED — run BEFORE cluster derivation)

Keyword strategy must start from real ICP problem language, not brand positioning. Run `str-trending-research` per candidate cluster topic to surface what owners actually say on Reddit / X / LinkedIn / forums / communities. Mine for:
- **Pain phrases** — exact words owners use to describe the problem
- **Workarounds tried** — what they've already attempted (often becomes long-tail)
- **Frustrations** — what's NOT working with existing solutions (your wedge)
- **Recurring questions** — same query asked 5+ times across threads (high intent + uncertainty)
- **Voice register** — formal vs casual, technical vs plain, optimistic vs frustrated

If the user has recent research output already (last ~30 days, in `projects/str-trending-research/`), ingest those briefs instead of re-running. Document which research files were used.

If no research exists and the user wants to skip this step (e.g., for a test run or a refresh where pain language hasn't shifted), document the skip explicitly in the output and flag the strategy as "research-thin — long-tail and ICP-voice columns will be sparse."

The research feeds Step 4 (cluster derivation), Step 5 (intent classification — owners' real intent shape), Step 11 (output ICP voice column), and Step 6 (live SERP — query candidates come from research).

## Step 3: Pull GSC First-Party Data

No GSC MCP exists in this install. Pull GSC data with the client scripts: `node scripts/_gsc-status.mjs` (properties, sitemaps, recent search analytics) and `node scripts/_gsc-today.mjs` / `node scripts/_aio-baseline.mjs` for current-period and AI-Overview baselines. Pull the last 90 days by query, then by page for per-page impression breakdown.

If GSC was added recently and impression volume is thin, this is normal pre-indexing state — don't treat thin data as "low traction." Note baseline as "early phase, no statistical significance yet" and proceed.

If site has no GSC verification, document this as a gap and proceed using brainstormed candidates only.

## Step 4: Derive Topic Clusters

**Cluster boundaries derive from ICP problem patterns surfaced in Step 2 research, with positioning pillars as a sanity check — not the primary source.** The research surfaces what owners actually struggle with; positioning maps the brand's response to those struggles. If research surfaces a pain cluster the positioning doesn't address, flag it as a content opportunity (and a potential positioning gap to discuss separately).

From research findings + positioning pillars + ICP language, propose 3-7 clusters. Each cluster = one pillar page (existing or to-build) + a constellation of supporting queries that share primary intent.

**Brand-disambiguation check (before clustering).** If the brand name or core service term collides with an unrelated dominant query intent (homonym risk, e.g. `Got Moles` = lawn pest vs skin lesion vs molecule vs spy; `Apple` = tech vs fruit; `Mercury` = element vs planet vs car vs deity; `Java` = programming vs coffee vs island), build a **Brand-Disambiguation Strategy section** at the top of the output. Include:

- The competing meanings ranked by Google's actual SERP/AIO collapse behaviour
- Rules for title + H1 disambiguation signals (e.g. "lawn signal mandatory in any title targeting `mole` queries")
- Anchor-text rules for internal linking (downstream str-internal-links consumes these as Rule 5)
- A `queries-to-avoid` cluster listing 4-7 sub-clusters of forbidden targets — never as title/H1/FAQ targets, never as primary blog post keywords, often dual-purpose as paid-search account-level negatives

Skip this section for brands without homonym risk.

Format per cluster:
- **id:** kebab-case, e.g., `ai-thinking`
- **pillar_page:** assigned URL
- **primary_intent:** one of 8 (see Step 4)
- **rationale:** one sentence linking cluster to positioning/ICP

See `references/cluster-architecture.md` for cluster construction patterns.

## Step 5: Intent Classification (8 categories)

Per Google quality rater guidelines (2026 evolution beyond the classic 4):

1. **Informational** — "what is X", "how does Y work"
2. **Navigational** — "{brand}", "{competitor}"
3. **Commercial** — "best X", "X pricing", "X for Y audience"
   - **Local-pack sub-intent:** for local-service brands, Commercial + Local ("near me", "{city} {service}", "best {service} in {city}") triggers Map Pack + AI Overview heavily. Tag in the Secondary intent column. AIO triggers ~76.9% on "near me" informational, ~7% on pure transactional Map Pack queries.
4. **Transactional** — "buy X", "sign up X"
5. **Short fact** — "when did X launch"
6. **Comparison** — "X vs Y"
7. **Instruction** — "how to X"
8. **Consequence** — "what happens if X"

Tag every candidate query with primary intent (and secondary if dual-intent). See `references/intent-classification.md` for category tests + tie-break rules.

## Step 6: Live SERP + AI Citation Test

For top 20 priority queries, run via WebSearch to capture who actually ranks/gets cited. Record: top 5 organic, AI Overview presence (if visible), who the brand competes against. This catches phrase-coincidence false positives (apply the field/ICP/intent filter in `str-ai-seo` — a name or phrase coincidentally matching a query is not a ranking competitor).

## Step 7: Competitor Keyword Scan

Without third-party SEO tools (AhrefsBot/SemrushBot blocked by choice), run manual scan: for each cluster, identify 3-5 competitors, scan their pillar/cornerstone pages for query targets visible in H1/H2/title/URL. Note queries they target that we don't.

If a paid SEO tool subscription is later added, this step gains automation — but the manual scan is the reproducible baseline.

## Step 8: Keyword → Page Assignment

Each query gets exactly **one canonical page**. If two pages compete for the same query → that's cannibalisation, flag for consolidation. The assigned page should match the query's intent shape.

See `references/page-assignment-and-scoring.md` for assignment rules + cannibalisation detection.

**Page hierarchy (recommended for sites >50 pages).** Organise the page-keyword map by Tier so downstream skills can consume it cleanly:

- **Tier 1 — Authority pages.** Homepage + service pages + key cornerstones. Highest priority for ranking + AI citation. Each gets explicit recommended H1 in the output.
- **Tier 2 — Supporting hubs.** Reviews, FAQ, About, service-area index, blog index, author pages. Carry weight via Person/Organisation entity reinforcement and as link hubs.
- **Tier 3 — Spokes.** City pages (templated), blog posts (per-cluster). High volume, programmatic patterns OK.

This Tier 1/2/3 structure is consumed by `str-internal-links` (hub-spoke validation), `str-onpage-audit` (H2/H3 keyword mapping per tier), and `str-ai-seo-local` (per-tier audit weighting). Build it once here.

## Step 9: Cannibalisation + Gap Audit

For each cluster:
- **Cannibalisation candidates:** queries with no assigned page OR multiple pages targeting same query/intent. Recommend consolidation.
- **Coverage gaps:** intents within the cluster not yet served by any page. Recommend new content.

## Step 10: Priority Scoring

For each query, score on:
- **Intent fit** (does this query represent ICP buyer journey?)
- **ICP match** (does the query's audience match positioning?)
- **Competition difficulty** (from Step 5 SERP test)
- **Current position** (from GSC — closer to page 1 = lower-effort win)
- **Business goal contribution** (does ranking drive the client's money outcomes — for Got Moles: service bookings, TMCP plan signups, service-area coverage, GBP visibility?)

Output `priority: high | medium | low | deferred` per query. Scoring matrix in `references/page-assignment-and-scoring.md`.

**Stage gate for branded queries (REQUIRED check before scoring):** Branded queries (brand name, brand methodology names like "EVOLVE method", branded community/product names, podcast names) are LAGGING indicators of authority work, not leading content targets. Nobody searches a brand they haven't heard of yet.

- **If GSC shows zero or near-zero impressions on branded queries over 90 days** (the brand has no awareness yet): all branded queries score `priority: deferred`. Track them in the file but don't allocate content/optimisation resources to them. Resource flow goes 100% to ICP problem queries until awareness markers hit.
- **Promotion criteria** — promote a branded query from `deferred` to `medium`/`high` when ANY of the following triggers:
  - GSC shows ≥10 monthly impressions on the branded query consistently
  - An external surface (podcast guest spot, press placement, podcast platform appearance, viral content) starts driving discovery to the brand
  - The brand-mention strategy from `str-authority-strategy` lands material co-citation events
  - Awareness research (LinkedIn analytics, podcast download spikes, direct-traffic GSC trend) confirms recognition is building
- **Why this matters (the loop):** content rankings on ICP problem queries → owners discover the brand via the problem → brand awareness builds → branded queries become real targets to defend. Running the loop in reverse (chasing branded queries first when nobody knows the brand) wastes resource on content that has no audience to find it.
- **Worked example (ATP era, 2026-04-25):** a brand with zero branded-query impressions and brand-confusion typos should mark its branded/thought-leader cluster `deferred` until awareness work lands. For Got Moles, branded queries ("got moles", "got moles reviews") DO have volume — keep the branded cluster active and defended.

## Step 11: Output

Write to `brand_context/target-keywords.md`. Canonical schema:

```markdown
---
last_updated: YYYY-MM-DD
methodology_version: 1.0
data_sources: [GSC mcp, WebSearch live SERP, brand_context]
geographic_scope: global (with regional subsets where applicable)
---

# Target Keywords — {brand}

## Brand-Disambiguation Strategy (when applicable)

*Include this section only if brand has homonym/intent-confusion risk.*

**The collision.** {what the brand name / core service term collides with in Google's index}

**Rules:**
- **Rule 1 — disambiguation signal in title + H1:** {required modifier set}
- **Rule 2 — pivot away from {ambiguous head term}:** {alternative head terms}
- **Rule 3 — {head term preference}**
- **Rule 4 — {entity reinforcement}**
- **Rule 5 — internal anchor text:** {anchor text rules — consumed by str-internal-links}

### Queries to AVOID

| Cluster | Example queries | Why avoid |
|---|---|---|
| ... | ... | ... |

These are NOT title/H1 targets, FAQ targets, or primary blog post keywords. May double as paid-search account-level negatives.

---

## Page Hierarchy (sites >50 pages)

### Tier 1 — Authority pages
| Page URL | Primary keyword | Intent | Cluster | Current rank | Recommended H1 | Notes |
|---|---|---|---|---|---|---|

### Tier 2 — Supporting hubs
| Page URL | Primary keyword | Intent | Cluster | Notes |
|---|---|---|---|---|

### Tier 3 — Spokes (city pages, blog posts)
{condensed pattern description + per-spoke rows or per-cluster summary rows}

---

## Cluster: {id}

**Pillar page:** {URL}
**Primary intent:** {one of 8}
**Cluster rationale:** {one sentence}
**Coverage status:** {complete | gaps in [intents]}

### Queries

| Query | Primary intent | Secondary | Assigned page | GSC impressions (90d) | GSC position | Target | Priority | ICP voice (real-language phrasing from research) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**ICP voice column** holds the actual phrases owners use, sourced from Step 2 research (Reddit/X/LinkedIn quotes). The canonical Query string is for tracking; the ICP voice column is the language to write content in. Example: canonical query "AI for service business owners"; ICP voice "I tried ChatGPT but it just gives me generic crap, how do I make this work for an actual service business?". If research wasn't run, mark this column `[research-thin]` and surface as a gap in Refresh triggers.

**Priority values:** `high` / `medium` / `low` for active targets; `deferred` for queries waiting on a stage gate (e.g., brand awareness, indexing maturity). Deferred queries are tracked but not actively targeted in the current period.

### Cannibalisation notes
{any flagged collisions + resolution chosen}

### Coverage gaps
{intents within cluster lacking page coverage + recommended new content}

---

## Cluster: {next-id}
...

---

## Refresh triggers

- Quarterly default
- Major positioning pivot
- ICP shift
- New offering / product launch
- Significant GSC traction change (e.g., new cluster ranking, dropped rankings)
- Third-party AEO audit (e.g. Pixelmojo Radar) surfaces a citation gap or competitor structure not covered by current clusters
- New `str-trending-research` wave surfaces an ICP pain cluster the current strategy doesn't address

## Methodology version log

- v1.0 (2026-04-25) — initial build
```

Narrative markdown body holds context that doesn't fit the table (cluster boundary decisions, why certain queries demoted, regional subset notes).

After writing: copy to `~/Downloads/` per CLAUDE.md, show absolute path so user can click.

## Step 12: Save + Collect Feedback

Ask: "Anything missing, wrong cluster boundaries, queries that shouldn't be there, priorities you'd flip?"

Log responses to `context/learnings.md` under `## str-keyword-strategy` with date. If feedback reveals a methodology issue (wrong scoring weight, missed intent category, bad cluster pattern), update the `## Rules` section of this SKILL.md immediately.

## Rules

*Entries added when the user flags issues. Format: `- {YYYY-MM-DD}: {correction}`*

- 2026-05-08: Phase 0 currency audit — added Brand-Disambiguation Strategy section pattern (Rules 1-5 + queries-to-avoid cluster) for brands with homonym/intent-confusion risk; added Local-pack sub-intent for Commercial intent on local-service brands; added Tier 1/2/3 page hierarchy as recommended output structure for sites >50 pages (canonical handoff to str-internal-links + str-onpage-audit + str-ai-seo-local); added third-party AEO audit + new research wave as refresh triggers.
- 2026-04-25 (superseded for this client 2026-07-02): geographic default follows `brand_context/icp.md`. Got Moles = LOCAL (WA service area) as the PRIMARY frame — city/county modifiers are core queries, not a subset. Don't auto-prefix with country names.
- 2026-04-25 (updated 2026-07-02): Use the client GSC scripts (`scripts/_gsc-*.mjs`) + WebSearch + manual SERP testing as the data sources. NOT Ahrefs/SEMrush (AhrefsBot/SemrushBot blocked in robots.txt by choice, not capability gap). If user later subscribes to those tools, methodology can layer in additional inputs without changing core flow.
- 2026-04-25: When GSC data is thin because indexing is early-stage, note it explicitly — "early phase, no statistical significance" — and proceed. Don't treat thin GSC as "low traction" or as a reason to lower priority on a cluster.
- 2026-04-25: ICP problem research is REQUIRED upstream input, not optional. Run `str-trending-research` per candidate cluster before deriving clusters. Clusters derive from ICP problem patterns surfaced in research, with positioning pillars as a sanity check — never the primary source. Brand-out clusters (positioning → assumed queries) produce marketing-language head queries nobody searches; ICP-in clusters (real owner pain language → query patterns) produce long-tail queries that earn traffic. Without research, output target-keywords.md is flagged "research-thin — needs v1.1 once research lands."
- 2026-04-25: Branded queries (brand name, brand methodology names, branded community/product/podcast names) are LAGGING indicators of authority work, not leading content targets. If GSC shows zero/near-zero impressions on branded queries over 90 days, score them `priority: deferred` and allocate zero current-period resource to them. Promote to active priority only when GSC shows ≥10 monthly impressions OR an external surface (podcast, press, viral content, co-citation event) starts driving brand discovery. Running the loop in reverse (chasing branded queries first) produces a strategy nobody searches for.

## Self-Update

If the user flags an issue with the output during or after a run — wrong intent classification, wrong cluster boundaries, missed cannibalisation, bad priority scoring, ICP mismatch — update the `## Rules` section above immediately. Don't just log to learnings; fix the methodology so it doesn't recur.

## Troubleshooting

- **GSC returns no/few queries:** site recently submitted to GSC, normal pre-indexing state. Document as baseline and proceed using brainstormed candidates + competitor scan only. Re-run when indexing matures.
- **Live SERP shows phrase-coincidence competitors:** run the field/ICP/intent filter from `str-ai-seo` `references/competitive-citation-gap.md`. Demote false positives to "phrase overlap, not entity competition."
- **Cluster boundaries unclear:** when two clusters could absorb the same query, default to the cluster whose pillar page is closer to the query's natural intent shape. Document the choice.
- **Multiple intents per query:** tag primary + secondary. Assign the page that serves primary best. If the query genuinely splits across two distinct buyer journeys, consider whether the cluster needs splitting.
