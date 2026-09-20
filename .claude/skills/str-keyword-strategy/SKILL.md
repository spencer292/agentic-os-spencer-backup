---
name: str-keyword-strategy
description: >
  Build the foundation keyword + search-intent + surface-mapping strategy that the rest of the SEO/AEO/GEO chain consumes as Context. Use when the user mentions: "keyword research", "keyword strategy", "what should we target", "keyword plan", "search strategy", "intent mapping", "keyword clustering", "topical authority planning", "build a keyword foundation", "GSC keyword analysis", "what queries are we ranking for", "keyword remap", "AI search volume", "fan-out coverage", "cannibalisation check". Foundation skill — runs upstream of `str-authority-strategy`, `str-onpage-audit`, `str-internal-links`, `str-ai-seo-local`, `str-question-harvester`, `mkt-authority-content` and `ops-blog-pipeline`. Geographic scope follows the client ICP (Got Moles: local — Western Washington service area). Data sources are Google Search Console (first-party truth), DataForSEO Labs / Keywords Data / AI Optimization / SERP, Bing Webmaster Tools grounding queries, and live SERP spot-checks. Produces `brand_context/target-keywords.md` — versioned, refreshed quarterly. Does NOT trigger for: ad keyword research (use `ops-got-moles-ads`), per-page on-page fixes (use `str-onpage-audit`), competitor backlink analysis (use `str-authority-strategy`), PAA question mining (use `str-question-harvester`), trending topic research (use root `str-trending-research`).
---

# Keyword Strategy Foundation

Build a versioned, intent-led, surface-tagged, cluster-based keyword strategy.

The operating reality as of 2026-09-02, per the canonical landscape file at `../../.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`. All relative paths in this skill are from `clients/got-moles/`, which is where runs happen. Read the landscape file before any refresh run and let it win over anything written here.

- **AI Mode is the default Search surface** and has been since 2026-05-19. Classic results still exist. Discovery no longer runs through one surface.
- **The surface a query fires is determined by its intent.** Explicitly transactional local goes to the Local Pack (~93%); informational and hybrid local go to AI Overviews (92–97%). A keyword map that does not name the surface is not actionable.
- **AI Overviews are organic-rank coupled. AI Mode is fan-out coupled.** They are two targets, not one, even though Search Console reports them combined.
- **GSC is first-party truth for queries you already appear on.** It cannot tell you what you are missing, and its generative-AI report is impressions-only with no query dimension. Third-party demand data fills that gap.

Those four facts are the ones this skill acts on. Everything else — click-through impact, citation correlations, algorithm dates, per-engine behavior — stays in the landscape file. Cite it by path; do not copy its tables in here.

## Outcome

A structured `brand_context/target-keywords.md` that reproduces the live document's shape exactly and adds the remap columns: per-keyword surface, Google volume, AI search volume, difficulty, intent, current rank + ranking URL, fan-out sub-queries, and a cannibalisation detection table. Read by every downstream content and audit skill so keyword work stops drifting query-to-query.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/target-keywords.md` | **full, if it exists** | The live document is the contract. A refresh must reproduce every section it has. Never write a shorter file than the one already on disk |
| `brand_context/positioning.md` | summary + angle | Cluster sanity check |
| `brand_context/icp.md` | full | ICP language → query phrasing; **geography note sets `geographic_scope`** |
| `brand_context/voice-profile.md` | tone only | Keep queries within audience-natural phrasing |
| `../../.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` | full | Surface behavior, evidence tiers, debunked claims |
| `context/learnings.md` | `## str-keyword-strategy` section | Apply prior corrections |

Proceed without brand_context if missing — flag the gap and produce a draft flagged "needs voice/positioning calibration."

**Geographic scope default.** Take the frame from `brand_context/icp.md`. Got Moles is a LOCAL service business: Western Washington. Take the exact counts from the `canonical_facts` block in the live `target-keywords.md`, which supersedes `icp.md` where they disagree — canonical is **6 counties (King, Pierce, Snohomish, Thurston, Kitsap, Lewis), 92+ communities**; `icp.md` still says 3 counties / 60+ cities and is stale. Never emit `geographic_scope: global` for this client.

## Skill Relationships

**Upstream:**
- `brand_context/positioning.md`, `icp.md`, `voice-profile.md` already exist for this client. There is no installed positioning or ICP skill here — if those files need work, do it by hand.
- **Root `str-trending-research`** — voice-of-customer input for Step 2. Strongly recommended on a first build, optional on a refresh where pain language has not shifted. It is a *root* skill, invoked from the client folder.

**Downstream — these read `brand_context/target-keywords.md` and several hard-stop without it:**

| Consumer | What it reads | Stops without it? |
|---|---|---|
| `str-onpage-audit` | `canonical_facts`, per-page primary keyword rows (every audited page needs a row), cluster ids, disambiguation Rules | **Yes** |
| `str-internal-links` | Hub-and-Spoke topology, Tier 1/2/3 hierarchy, Rule 5 anchor-text rules | **Yes** |
| `str-authority-strategy` | Cluster ids, Brand Defense Strategy section, pillar designation | **Yes** |
| `str-ai-seo-local` | `canonical_facts`, location-services cluster, city tiers | Context |
| `str-question-harvester` | Cluster ids and primary keywords as its seed list. **Bidirectional** — it returns per-primary-keyword fan-out sub-query sets that Step 8 ingests | Context |
| `mkt-authority-content`, `ops-blog-pipeline` | Cluster assignment, recommended H1, secondary keywords, queries-to-avoid | Context |

**Refresh:** quarterly, or on a positioning pivot, ICP shift, significant GSC traction change, a named Google core or spam update, or a new voice-of-customer research wave.

## Versioning Rule

**v2 supersedes v1.1 wholesale.** The remap changes the column set, so a partial merge produces a document with two incompatible table shapes.

On the **first v2 write only**, before writing anything:

1. Copy the existing file to `brand_context/target-keywords.v1.1.md` verbatim. That archive is never edited again and is the audit trail for what changed.
2. Add a line at the top of the archive: `> ARCHIVED {YYYY-MM-DD}. Superseded by target-keywords.md v2. Retained for provenance.`
3. Write the new v2 file at the canonical path `brand_context/target-keywords.md`.

Subsequent v2.x refreshes edit in place — no further archives. Do not perform the archive step as part of a skill update or a dry run; it happens only on a real v2 build.

## Before You Start

Confirm scope:
1. **Run mode:** foundation build (no `target-keywords.md` exists), refresh (quarterly update), expansion (adding a cluster), or **remap** (v1.1 → v2, the full data-driven rebuild).
2. **Geographic scope:** per the rule above.
3. **Cluster set:** for Got Moles the taxonomy is **fixed at seven ids** — `mole-control`, `biology`, `safety`, `cost-value`, `seasonal`, `diy-vs-pro`, `location-services`. Do not invent new ids, do not rename, do not merge. A genuinely new cluster is a decision for Spencer, not a side effect of a refresh.
4. **Budget:** confirm the DataForSEO spend guard for this run (see Data Sources).

---

## Data Sources

This skill uses first-party data as truth and third-party APIs for everything first-party data cannot see. There is no reason to refuse third-party keyword data: blocking AhrefsBot and SemrushBot in `robots.txt` controls who crawls got-moles.com, and has nothing to do with querying a keyword or SERP API that never touches the site.

### 1. Google Search Console — first-party truth

Domain property `sc-domain:got-moles.com`, full-user access. The URL-prefix property is unverified — never use it.

```
node .claude/skills/ops-got-moles-ads/scripts/_gsc-status.mjs
node .claude/skills/ops-got-moles-ads/scripts/_gsc-today.mjs
node .claude/skills/ops-got-moles-ads/scripts/_aio-baseline.mjs
```

Run from `clients/got-moles/`. Pull 90 days by query, then by page.

> **Caution.** `_gsc-status.mjs` and `_gsc-today.mjs` currently hold hardcoded Google OAuth credentials and are gitignored for that reason. They must be scrubbed to `.env` and the tokens rotated before anyone other than Roy runs this step. `_aio-baseline.mjs` is clean.

**Search Console Generative AI report is UI-only.** Impressions inside AI Overviews and AI Mode, by page, country, device and date, from 2026-05-18 with no backfill. No clicks, no CTR, **no queries**, and the API rejects the generative-AI type. You cannot get AI-surface *query* data out of GSC. Record it manually as a page-level AI-impression baseline; never script it.

### 2. DataForSEO v3 — demand, rank, difficulty, intent, SERP shape, AI volume

Shared client, root-owned so `update-clients.sh` cannot delete it. Always run from `clients/got-moles/` so this client's `.env` wins:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' [--out <file>] [--raw] [--dry]
```

Credentials resolve from `.env` automatically. Never print or quote them. Every call appends endpoint, status and cost to `.dataforseo-usage.log` in the working directory.

`location_code: 2840` is the United States. `language_code: "en"`. For city-level SERP shape, look the codes up first rather than guessing:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs serp/google/locations '' --raw | grep -i "Washington,United States"
```

**The call set for a full remap.** All payload shapes below are `--dry`-verified against the client. Add `--dry` to any of them to print the exact request without spending.

| Purpose | Endpoint | Payload | Cap |
|---|---|---|---|
| What we already rank for, with URL | `dataforseo_labs/google/ranked_keywords/live` | `{"target":"got-moles.com","location_code":2840,"language_code":"en","limit":1000,"order_by":["ranked_serp_element.serp_item.rank_group,asc"]}` | `limit` 1000 |
| Competitor ranked sets | same endpoint, per competitor | `{"target":"molepatrol.com","location_code":2840,"language_code":"en","limit":300}` | `limit` 300, top 5 competitors only |
| Demand we are missing | `dataforseo_labs/google/keyword_ideas/live` | `{"keywords":["mole control","yard mole removal","mole exterminator"],"location_code":2840,"language_code":"en","limit":500}` | `limit` 500 |
| Long-tail off a head term | `dataforseo_labs/google/keyword_suggestions/live` | `{"keyword":"how to get rid of moles in your yard","location_code":2840,"language_code":"en","limit":300}` | `limit` 300 |
| Semantic neighbors | `dataforseo_labs/google/related_keywords/live` | `{"keyword":"mole control seattle","location_code":2840,"language_code":"en","depth":2,"limit":200}` | `depth` 2 |
| Difficulty | `dataforseo_labs/google/bulk_keyword_difficulty/live` | `{"keywords":["mole control seattle","yard mole removal"],"location_code":2840,"language_code":"en"}` | ≤1000 keywords per task |
| Intent | `dataforseo_labs/google/search_intent/live` | `{"keywords":["mole control seattle","do moles have eyes"],"language_code":"en"}` | ≤1000 keywords per task |
| Head-to-head keyword overlap | `dataforseo_labs/google/domain_intersection/live` | `{"target1":"got-moles.com","target2":"molepatrol.com","location_code":2840,"language_code":"en","limit":300}` | one competitor per call |
| Who we actually compete with | `dataforseo_labs/google/competitors_domain/live` | `{"target":"got-moles.com","location_code":2840,"language_code":"en","limit":20}` | `limit` 20 |
| Our strongest pages | `dataforseo_labs/google/relevant_pages/live` | `{"target":"got-moles.com","location_code":2840,"language_code":"en","limit":100}` | `limit` 100 |
| Visibility trend | `dataforseo_labs/google/historical_rank_overview/live` | `{"target":"got-moles.com","location_code":2840,"language_code":"en"}` | once per run |
| Google Ads search volume | `keywords_data/google_ads/search_volume/live` | `{"keywords":["mole control seattle","mole exterminator near me"],"location_code":2840,"language_code":"en"}` | ≤1000 keywords per task |
| Volume for a site's whole footprint | `keywords_data/google_ads/keywords_for_site/live` | `{"target":"got-moles.com","location_code":2840,"language_code":"en"}` | once per run |
| **AI search volume** | `ai_optimization/ai_keyword_data/keywords_search_volume/live` | `{"keywords":["how to get rid of moles in my yard","best mole control company washington"],"location_code":2840,"language_code":"en"}` | priority keywords only |
| Live SERP shape (AI Overview + Local Pack + PAA in one call) | `serp/google/organic/live/advanced` | `{"keyword":"mole control seattle","location_code":2840,"language_code":"en","device":"desktop","depth":20,"people_also_ask_click_depth":1}` | one keyword per task, top 30 priority keywords |
| Local pack detail | `serp/google/local_finder/live/advanced` | `{"keyword":"mole control near me","location_code":2840,"language_code":"en","depth":20}` | Tier A cities only |
| Account balance (free GET) | `appendix/user_data` | — | before and after every run |

**Spend guard.** A full remap is budgeted at **~$5**. This is a budget cap, not a schedule. Enforce it:

1. Call `appendix/user_data` first and record the balance.
2. Run the Labs and Keywords Data pulls, which are the cheap bulk layer. Never omit `limit`.
3. Run per-keyword SERP calls last and only for the top 30 priority keywords, because they are the expensive per-task layer.
4. Re-check `appendix/user_data` and reconcile against `.dataforseo-usage.log`. If the run has consumed $5, stop and report what is missing rather than continuing.

AI Keyword Data is the cheapest useful signal in the set (per the landscape file §10.2, $0.01 per task plus $0.0001 per keyword), so AI search volume is affordable across the whole priority set. LLM Mentions at $0.10 per request belongs to `str-ai-seo-local`, not here.

### 3. Bing Webmaster Tools — grounding queries (manual input)

AI Performance report, public preview since 2026-02-10. **UI only, no API.** Its Grounding Queries panel shows the phrasing Copilot and Bing AI actually used to retrieve a page. That is real retrieval phrasing, not modeled volume — no keyword tool has it.

Ask Roy to export or screenshot the grounding queries for the top 20 pages and paste them in. Treat every grounding query as a candidate keyword row tagged `surface: AI Mode` or `surface: multi`, sourced `Bing grounding queries {date}`. If the report is unavailable, record the gap in `data_sources` rather than silently skipping it.

### 4. SerpAPI — optional second SERP opinion

Paid Starter plan, key `SERPAPI_API_KEY` in the root `.env`. Thousands of searches per month. Use it when a DataForSEO SERP result looks wrong, or when `str-question-harvester` has already pulled PAA for the same keyword and the two should agree. It is not the primary source.

### 5. WebSearch and manual SERP checks

Valid as a spot-check on a handful of queries. Never the primary data source, and never the basis for a volume, difficulty or rank figure in the output.

### 6. GA4

The AI Assistant channel exists but **excludes Google's own AI surfaces**, and AI Mode links carry `noreferrer`. **Never promise AI Mode attribution.** GA4 is out of scope for this skill; measurement belongs to `str-ai-seo-local`.

### 7. Pixelmojo Radar

Optional. If a report exists in `~/Downloads/`, read it as one more opinion. DataForSEO AI Optimization is the primary AI-visibility benchmark now. Never gate a run on Pixelmojo freshness.

---

## Step 1: Load Context + Apply Rules

Read brand_context per the table, including the live `target-keywords.md` in full. Read the landscape file. Read `context/learnings.md` → `## str-keyword-strategy`. Apply every Rule in this file's `## Rules` section.

## Step 2: Voice-of-Customer Language

Keyword strategy starts from the language homeowners actually use, not from brand copy. For a lawn-pest ICP the live surfaces are Reddit (r/lawncare, r/landscaping, r/gardening, r/Seattle, r/SeattleWA), Nextdoor, Google's People Also Ask, and the Bing grounding queries from Data Sources §3. Not LinkedIn, not X.

Mine for:
- **Pain phrases** — the exact words used to describe mounds, tunnels and lawn damage
- **Workarounds tried** — vinegar, castor oil, repellents, flooding, sonic spikes; each is a long-tail query and a myth-busting page
- **Frustrations** — what failed and why, which is the wedge for the diy-vs-pro cluster
- **Recurring questions** — the same question asked five or more times across threads
- **Register** — how urgent, how technical, how much yard-vs-pest framing

Run root `str-trending-research` per candidate topic, or ingest existing briefs from `projects/str-trending-research/` if they are recent. Document which files were used.

If the step is skipped, say so in the output and flag the strategy `research-thin — ICP voice column sparse`.

## Step 3: Pull Google Search Console

Per Data Sources §1. Pull 90 days by query and by page. Capture, per query: impressions, clicks, average position, and the page GSC attributes it to.

If impression volume is thin because indexing is early, this is normal — record it as "early phase, no statistical significance yet" and proceed. Never read thin GSC as low demand.

Record the Search Console Generative AI report's page-level AI impressions manually as the AI-surface baseline, with the note that it combines AI Overviews and AI Mode and carries no query dimension.

## Step 4: Pull DataForSEO Demand and Rank Data

Per Data Sources §2, in this order:

1. `ranked_keywords` for got-moles.com — this is the current-rank and ranking-URL spine of the whole document, and the input to cannibalisation detection in Step 11.
2. `keyword_ideas` / `keyword_suggestions` / `related_keywords` seeded from the seven cluster head terms — this is the demand GSC cannot show, because GSC only reports queries the site already appears on.
3. `bulk_keyword_difficulty` and `search_intent` across the merged candidate set.
4. `search_volume` (Google Ads) across the merged candidate set.
5. `ai_keyword_data/keywords_search_volume` across the priority subset.
6. `historical_rank_overview` once, for the trend line.

Write every raw response to `projects/str-keyword-strategy/data/{YYYY-MM-DD}_{endpoint-slug}.json` with `--out` so the run is reproducible and the numbers are auditable.

**Every DataForSEO intent label is a machine guess.** Cross-check it against the 8-category model in Step 6 and record the manual verdict when the two disagree. The Labs label goes in the output as supporting evidence, never as the sole basis for the `intent` column.

## Step 5: Derive Clusters + Brand Disambiguation

For Got Moles the seven cluster ids are fixed (see Before You Start). Assign every candidate keyword to exactly one. A keyword that fits none is either out of scope or evidence for a conversation with Spencer — flag it, do not create a cluster for it.

For a different client, derive 3–7 clusters from ICP problem patterns with positioning pillars as a sanity check. See `references/cluster-architecture.md`.

**Brand-disambiguation check.** "Mole" is a homograph whose skin-lesion sense dominates the training distribution, so this is popularity bias, not merely ambiguity. The output carries a Brand-Disambiguation Strategy section with:

- The competing meanings ranked by observed SERP and AI Overview collapse behavior
- Rules 1–5 (title/H1 signal, cost-query pivot, head-term preference, entity reinforcement, internal anchor text) — `str-internal-links` consumes Rule 5 by name
- A `queries-to-avoid` table of the sub-clusters that are never title, H1 or primary blog targets

**Blocking homograph rule.** "Mole" never appears in a title, H1, H2 or first paragraph without a disambiguating token in the same sentence: lawn, yard, turf, ground, burrow, tunnel, molehill, trapping, pest, *Scapanus*. This applies to every recommended H1 this skill emits. A recommendation that breaks it does not ship.

## Step 6: Intent Classification (8 categories)

Tag every keyword with a primary intent, and a secondary only when the query genuinely splits.

1. **Informational** — "what is a mole tunnel", "why do molehills appear"
2. **Navigational** — "got moles", "mole patrol seattle"
3. **Commercial** — "best mole control company", "mole exterminator near me"
4. **Transactional** — "book mole control", "mole control quote"
5. **Short fact** — "how many eyes do moles have"
6. **Comparison** — "vole vs mole", "monthly vs one-time mole control"
7. **Instruction** — "how to get rid of moles in your yard"
8. **Consequence** — "what happens if you leave moles in your lawn"

**Provenance.** This 8-category model is a working extension of the classic informational / navigational / commercial / transactional split, refined against this account's own SERPs. It is **not** sourced to any published Quality Rater Guidelines revision — the September 2025 edition is the current one and no 2026 revision exists (landscape file §7). Earlier versions of this skill attributed it to a "2026 evolution of the rater guidelines"; that attribution was unsourced and has been removed. Use the model because it maps cleanly to page shape, and label it `[U]` if it ever appears in client-facing output.

Cross-check every tag against the DataForSEO `search_intent` label from Step 4. Where they disagree, the manual verdict wins and the disagreement is recorded. See `references/intent-classification.md` for category tests and tie-breaks.

## Step 7: Surface Classification (the two-surface split)

**This is the step that makes the map actionable.** Intent determines which surface a query fires, and the surfaces are won in completely different ways.

| Surface | Fires on | Won by | Tag |
|---|---|---|---|
| **Local Pack** | Explicitly transactional local — "mole control Everett", "mole exterminator near me" (~93%) | Google Business Profile, proximity, reviews, service-area depth. **Not** by page copy | `Local Pack` |
| **AI Overviews** | Informational local (~92%) and hybrid such as "average cost of mole control in {city}" (~97%) | Classic organic rank plus cited, answer-first content. AI Overviews stay tightly rank-coupled | `AI Overviews` |
| **AI Mode** | Broad, conversational and multi-part questions | Fan-out coverage across sub-queries, not head-term rank | `AI Mode` |
| **Classic** | Queries where neither an AI Overview nor a local pack fires | Conventional organic ranking | `Classic` |
| **multi** | Two or more of the above fire on the same query | Both plays required; note which is primary | `multi` |

Determine the tag from evidence, not assumption. For the top 30 priority keywords run `serp/google/organic/live/advanced` and read the returned item types: an `ai_overview` item means AI Overviews, a `local_pack` item means Local Pack, both means `multi`, neither means Classic. For Tier A cities add `serp/google/local_finder/live/advanced`. For everything below the top 30, infer the tag from intent using the table above and mark the row `inferred`.

**Stop using top-10 rank as the AI proxy.** It remains the right proxy for classic search and correlates with AI Overview appearance, but a top-10 organic ranking gives only about a 25% chance of appearing in an AI Overview (landscape file §2.3). It predicts AI Mode citation barely at all.

## Step 8: AI Mode and Query Fan-Out

Google's own description of AI Mode retrieval is query fan-out: it issues multiple related searches across subtopics and data sources, then answers from what comes back. Google's worked example is a lawn-weeds query fanning into herbicides, chemical-free removal and prevention — a direct read-across to mole control.

**Source the sub-queries from data where it exists.** `str-question-harvester` harvests People Also Ask via DataForSEO SERP and emits a per-primary-keyword fan-out set with volume; if a recent harvest exists in `projects/str-question-harvester/`, ingest it rather than re-deriving by hand, and record which report was used. Bing grounding queries from Data Sources §3 are the second source, because they are confirmed retrieval phrasing. Hand enumeration fills whatever those two leave uncovered. The relationship is bidirectional: the harvester seeds itself from this document's clusters, and this document takes its fan-out sets back from the harvester.

**For every primary keyword, enumerate the sub-queries a fan-out would generate.** For this account the recurring axes are:

identification · damage · chemical-free methods · pricing · prevention · seasonality · pets and children · DIY-versus-professional · local availability

Write them into the `fan_out_subqueries` column. Then check coverage: does one page on the site answer each sub-query in a self-contained passage? A cluster that answers three of nine axes will not be cited in AI Mode regardless of where its pillar ranks.

**Coverage across the fan-out replaces word-count targets.** There are no word-count minimums anywhere in this skill or its references. The question is never "is this page long enough", it is "does this cluster answer the sub-questions a fan-out would generate".

**Do not carry the circulating fan-out numbers.** The "8–16 sub-queries per prompt" and "161% more likely to be cited" figures are single-source and unverified (landscape file §13). Encode the mechanism, never those numbers.

## Step 9: Competitor Keyword Scan

Replace manual H1 scraping with data:

1. `competitors_domain` for got-moles.com → who actually shares our keyword footprint, ranked by overlap. Reconcile against the ten named competitors already in `authority-strategy.md` Section 3 (Mole Patrol, Mole Masters, Moody Moles, NW Mole Pros, NW Mole King, The Mole Man, Mole Control & More, Mole Busters, Croach, Sound Pest / Sunrise Pest).
2. `domain_intersection` per top-five competitor → keywords they rank for and we do not, with volume and position on both sides. This is the gap list.
3. `ranked_keywords` per competitor, `limit` 300 → their strongest positions.
4. `relevant_pages` for got-moles.com → which of our pages carry the most keyword weight, which feeds the Tier 1/2/3 hierarchy in Step 10.

Apply a relevance filter before anything reaches the output: a domain that ranks for "mole removal" in the dermatology sense is a phrase coincidence, not a competitor. Demote those to "phrase overlap, not entity competition."

## Step 10: Keyword → Page Assignment and Tiers

Each keyword gets exactly **one canonical page**. Two pages targeting one keyword is cannibalisation, handled in Step 11.

Organize the page-keyword map by tier, because three downstream skills consume the tiers:

- **Tier 1 — Authority pages.** Homepage, service pages, cornerstone content. Each gets an explicit recommended H1 that satisfies the homograph rule.
- **Tier 2 — Supporting hubs.** Reviews, FAQ, About, service-area index, blog index, author page. Entity reinforcement and link hubs.
- **Tier 3 — Spokes.** City pages and blog posts. **Every page gets its own row**, not a pattern summary — `str-onpage-audit` needs a per-page row for every page it audits, and a condensed pattern description makes that skill unrunnable.

**City-page doorway gate.** Strip the city name from a city page. If what remains is indistinguishable from another city page, it fails and needs per-city substance: named neighborhoods, local terrain, local proof, local pricing context. City pages link UP to hubs and OUT to local proof, never sideways to each other in rings. Do not build a strategy that requires ranking a near-identical page per city for the same head term.

See `references/page-assignment-and-scoring.md`.

## Step 11: Cannibalisation Detection

**This skill detects. It does not execute.** Merges, 301s, redirect-map updates and thin-page culls belong to `str-onpage-audit` apply-fixes mode, which owns staged, evidence-gated changes to live URLs. Emitting a detection table that someone acts on directly is how a site with 635 #1 rankings loses them.

Detection method, in order of evidence strength:

1. **DataForSEO `ranked_keywords`** — group the response by keyword. Any keyword with two or more got-moles.com URLs in the result is a confirmed cannibalisation pair, with both positions and both URLs. This is the primary detector and it is the reason `ranked_keywords` runs first in Step 4.
2. **GSC by query and page** — the same query producing impressions across multiple pages, especially where no single page takes more than about 25% of impressions.
3. **Structural duplication** — multiple URL variants for one city or topic (`/bellevue/`, `/bellevue-mole-removal`, `/bellevue-mole-extermination/`), or two pages carrying the same keyword in title, H1 and slug.

Emit one table (schema in Step 13) with keyword, every competing URL and its position, cluster, evidence source, and a **recommended** resolution: consolidate (merge and 301 to the stronger URL), differentiate (reassign one page to a different keyword and intent), or demote (drop from sitemap and internal linking, keep accessible).

Close the table with the hand-off line verbatim:

> Detection only. Execution — merge, 301, redirect-map update, sitemap update, thin-page cull — is owned by `str-onpage-audit` apply-fixes mode under its staged-change rules. Do not action this table from here.

## Step 12: Priority Scoring

Score each keyword on:

- **Intent fit** — does it represent the ICP buyer journey?
- **ICP match** — does the audience match positioning?
- **Difficulty** — from `bulk_keyword_difficulty`, not from eyeballing a SERP
- **Demand** — Google volume and AI search volume together; a keyword can be small in one and material in the other
- **Current position** — from `ranked_keywords` and GSC; closer to page one is a cheaper win
- **Surface reachability** — a Local Pack keyword cannot be won with content, so a content-led priority on one is misallocation
- **Business goal contribution** — service bookings, TMCP signups, service-area coverage, GBP visibility

Output `priority: high | medium | low | deferred` per keyword. Matrix in `references/page-assignment-and-scoring.md`.

**Branded-query stage gate.** Branded queries are lagging indicators of authority work, not leading content targets, so a brand with no awareness scores them `deferred`. **This gate does not bind Got Moles.** Branded queries here have real volume (`got moles` at 200–500 monthly) and an active competitive threat, so the branded cluster stays active and defended — Brand Defense Strategy in the output is a live section, not a deferred one. Keep the gate documented for the case where a new cluster or a new brand has genuinely no awareness yet, and apply it only on that evidence.

**Never write an AI search volume figure into client-facing output without its source label.** The underlying prompt corpora are estimates. Every statistic that reaches a client-facing deliverable carries `[P]`, `[S]` or `[U]` per the landscape file's confidence key.

## Step 13: Output

Write to `brand_context/target-keywords.md`, honoring the Versioning Rule above. This template reproduces the live document exactly and adds the remap columns. **Every section below is mandatory when the corresponding data exists — a refresh that drops a section deletes data three downstream skills read.**

Note on spelling: skill prose and deliverables are US English, but the emitted headings `### Cannibalisation notes` and `## Cannibalisation Detection` keep the existing spelling because downstream skills match on those strings. Do not "correct" them.

````markdown
---
last_updated: YYYY-MM-DD
methodology_version: 2.0
data_sources:
  - GSC query export {YYYY-MM-DD} ({n} queries / {n} pages, 90-day window)
  - GSC page export {YYYY-MM-DD}
  - Search Console Generative AI report {YYYY-MM-DD} (manual, impressions only, AI Overviews + AI Mode combined, no query dimension)
  - DataForSEO Labs ranked_keywords {YYYY-MM-DD} ({n} rows) → projects/str-keyword-strategy/data/{file}.json
  - DataForSEO Labs keyword_ideas / keyword_suggestions / related_keywords {YYYY-MM-DD} ({n} rows)
  - DataForSEO Labs bulk_keyword_difficulty {YYYY-MM-DD} ({n} keywords)
  - DataForSEO Labs search_intent {YYYY-MM-DD} ({n} keywords)
  - DataForSEO Labs domain_intersection / competitors_domain {YYYY-MM-DD} ({n} competitors)
  - DataForSEO Keywords Data google_ads search_volume {YYYY-MM-DD} ({n} keywords)
  - DataForSEO AI Optimization ai_keyword_data {YYYY-MM-DD} ({n} keywords)
  - DataForSEO SERP google/organic/live/advanced {YYYY-MM-DD} ({n} keywords, surface tags)
  - Bing Webmaster Tools AI Performance grounding queries {YYYY-MM-DD} (manual export) | or: NOT AVAILABLE — gap
  - brand_context/positioning.md, brand_context/icp.md
  - {any client research documents, with dates}
data_source_spend: "DataForSEO ${x.xx} this run (see .dataforseo-usage.log)"
geographic_scope: Western Washington (King, Pierce, Snohomish, Thurston, Kitsap, Lewis counties — 6 counties, 92+ communities; regional service business; the ICP is local, NOT global)
research_status: {voice-of-customer status; what is still missing and what the next version needs}
canonical_facts:
  - communities: "92+ communities across 6 counties"
  - counties: "King, Pierce, Snohomish, Thurston, Kitsap, Lewis"
  - clients: "nearly 5,000 properties served"
  - founded: 2017
  - founder: Spencer Hill, US Army veteran
  - pricing: TMCP $100/month; OMP $450 flat + $150 setup; Commercial custom-quoted
  - reviews: "219+ five-star Google reviews across 3 Google Business Profiles"
---

# Target Keywords — {brand}

{One paragraph: what this document is, and the explicit list of downstream skills that read it.}

---

## Brand-Disambiguation Strategy

**The core SEO problem.** {The homograph collision, its competing senses ranked by observed SERP and AI Overview behavior, and the evidence for that ranking.}

### Disambiguation Rules

**Rule 1 — Title + H1 carry an unambiguous {disambiguating} signal.** {required modifier set}
**Rule 2 — Pivot away from {hijacked head term}.** {safe alternatives}
**Rule 3 — {head term preference}.**
**Rule 4 — Brand entity reinforcement.** {geo + entity framing}
**Rule 5 — Internal anchor text.** {anchor rules — consumed by str-internal-links}

### Queries to AVOID (never target these)

| Cluster | Example queries | Why avoid |
|---|---|---|

**Inverse rule — queries we DO want.** {the modifier set that makes intent unambiguous}

---

## Brand Defense Strategy

**Primary brand-name target.** {the brand query, its volume, the named threat}

| Query | Volume | Page | Notes |
|---|---|---|---|

**Anchor-city seeding rule.** {which cities are named in the first 200 words of which pages, and why}

---

## Seasonality Calendar (publish + push schedule)

| Period | Behaviour | Action |
|---|---|---|

**Content calendar rule:** {lead time before each demand peak}

---

## Cluster: {id}

**Pillar page:** {URL}
**Primary intent:** {one of 8}
**Primary surface:** {Classic | Local Pack | AI Overviews | AI Mode | multi}
**Cluster rationale:** {one sentence}
**Coverage status:** {complete | gaps in [intents]}

### Queries

| Query | Primary intent | Secondary | Surface | Assigned page | Volume (Google) | AI volume | Difficulty | Current rank | Ranking URL | GSC impressions (90d) | GSC position | Target | Priority | Cannibalisation | Fan-out sub-queries | ICP voice | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

**Column definitions.**
- **Surface** — `Classic` / `Local Pack` / `AI Overviews` / `AI Mode` / `multi`, from Step 7. Suffix `(inferred)` where it was not confirmed by a live SERP call.
- **Volume (Google)** — monthly search volume, DataForSEO Keywords Data. `—` when not pulled; never estimate.
- **AI volume** — AI search volume, DataForSEO AI Keyword Data. Label `[U]` in any client-facing extract.
- **Difficulty** — DataForSEO Labs bulk keyword difficulty, 0–100.
- **Current rank / Ranking URL** — from Labs ranked_keywords. The URL matters as much as the number: it is the cannibalisation detector.
- **Cannibalisation** — `—`, or `flag: {n} URLs` cross-referencing the detection table.
- **Fan-out sub-queries** — the sub-questions an AI Mode fan-out would generate, semicolon-separated. Primary keywords only; leave blank on spokes.
- **ICP voice** — the phrasing homeowners actually use, from Step 2. `[research-thin]` if Step 2 was skipped.

### Cannibalisation notes
{flagged collisions in this cluster + the recommended resolution; execution is owned by str-onpage-audit}

### Coverage gaps
{intents and fan-out axes within the cluster lacking page coverage + recommended new content}

---

## Cluster: {next-id}
...

{Repeat for all seven: mole-control, biology, safety, cost-value, seasonal, diy-vs-pro, location-services.}

---

## Page → Primary Keyword Map (Sitewide)

### Tier 1 — Authority pages

| Page URL | Primary keyword | Intent | Surface | Cluster | Current rank | Recommended H1 | Notes |
|---|---|---|---|---|---|---|---|

### Tier 2 — Supporting hubs

| Page URL | Primary keyword | Intent | Surface | Cluster | Notes |
|---|---|---|---|---|---|

### Tier 3 — City pages ({n} total)

**Pattern.** {the templated primary/secondary keyword and H1/title pattern}

| Page URL | City | County | Primary keyword | Surface | Current rank | Tier | Per-city substance (passes doorway gate?) | Notes |
|---|---|---|---|---|---|---|---|---|

### Tier 3 — Blog posts ({n} total)

| URL | Primary keyword | Cluster | Surface | Volume | Current rank | GSC impressions | Recommended action |
|---|---|---|---|---|---|---|---|

---

## Cannibalisation Detection

Confirmed keyword-level collisions, detected from DataForSEO ranked_keywords, GSC query-by-page, and structural URL duplication.

| Keyword | Competing URLs (position) | Cluster | Evidence source | Recommended resolution |
|---|---|---|---|---|

> Detection only. Execution — merge, 301, redirect-map update, sitemap update, thin-page cull — is owned by `str-onpage-audit` apply-fixes mode under its staged-change rules. Do not action this table from here.

---

## Top {n} Gap Opportunities

High-leverage keywords not yet adequately targeted, sourced from Labs domain_intersection and keyword_ideas.

| # | Query | Volume | AI volume | Difficulty | Surface | Priority | Recommendation |
|---|---|---|---|---|---|---|---|

---

## Pillar designation per cluster

| Cluster | Pillar URL | Primary surface | Why it's the pillar |
|---|---|---|---|

---

## Hub-and-Spoke topology

{Per cluster: pillar URL + its spoke list. Consumed by str-internal-links Step 6.}

### Cluster 1: {id} hub
- **Pillar:** {URL}
- **Spokes:** {list}

**Linking rule:** every spoke links to its pillar in-content, not only via nav or footer. Pillars link to spokes through curated sections. City pages link UP to hubs and OUT to local proof, never sideways to one another.

---

## Refresh triggers

1. Quarterly cadence — minimum every 90 days
2. Voice-of-customer research wave lands
3. New offering, service or service area
4. Significant GSC traction change
5. Surface shift — a target query starts or stops firing an AI Overview or a local pack
6. A named Google core or spam update
7. Cannibalisation cleanup completes — re-baseline
8. Bing grounding queries surface retrieval phrasing not in the current map

## Methodology version log

- **v2.0 ({YYYY-MM-DD})** — {what the remap changed}
- **v1.1 (2026-05-08)** — {preserved summary}; archived at `target-keywords.v1.1.md`
- **v1.0 (2026-05-06)** — {preserved summary}
````

Narrative markdown between sections holds what does not fit a table: cluster boundary decisions, why a query was demoted, competitor notes, per-city strategy.

After writing: copy to `~/Downloads/` per CLAUDE.md and show the absolute path.

## Step 14: Notion Push + Feedback

**Push the finished document to Notion.** Notion is the review mechanism for this client — Spencer and the team review there, so a deliverable that only exists on disk has not been delivered. Use the Notion MCP tools directly; no script is needed. Push after every write, including refreshes.

Then ask: "Anything missing, wrong cluster boundaries, keywords that shouldn't be there, priorities you'd flip, surfaces I've called wrong?"

Log responses to `context/learnings.md` under `## str-keyword-strategy` with the date. If feedback reveals a methodology issue, update the `## Rules` section of this SKILL.md immediately.

## Rules

*Entries added when the user flags issues. Format: `- {YYYY-MM-DD}: {correction}`*

- 2026-09-02: Surface tagging is mandatory. Every keyword row and every recommendation carries its surface — Classic, Local Pack, AI Overviews, AI Mode, or multi. Transactional local intent fires the Local Pack (~93%) and is won through Google Business Profile, not page copy; informational and hybrid local fire AI Overviews (92–97%) and are won through cited content. AI Overviews are organic-rank coupled; AI Mode is fan-out coupled. An untagged keyword map sends content work at Local Pack queries it cannot win. Source: `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` §2.2, §2.3.
- 2026-09-02: The output template is the contract, not a suggestion. A refresh reproduces every section the live `target-keywords.md` already has — `canonical_facts`, Brand Defense Strategy, Seasonality Calendar, per-cluster tables, Page → Primary Keyword Map with per-page Tier 3 rows, Gap Opportunities, Pillar designation, Hub-and-Spoke topology, Refresh triggers, version log. Four downstream skills address these by name and three hard-stop without them. Writing a shorter file is data loss.
- 2026-09-02: No word-count minimums anywhere in this skill or its references. Coverage across the query fan-out replaces length as the completeness test. Word count correlates 0.04 with AI Overview citation (landscape file §5.2).
- 2026-09-02: Cannibalisation is detected here and executed in `str-onpage-audit`. This skill never emits an instruction to merge, redirect or delete a live URL. The site holds 635 #1 rankings; staged, evidence-gated execution under the audit skill's rules is the only safe path.
- 2026-09-02: Cluster taxonomy for Got Moles is fixed at the seven ids in the live `target-keywords.md`. New ids are a decision for Spencer, never a side effect of a refresh.
- 2026-05-08: Phase 0 currency audit — added the Brand-Disambiguation Strategy section pattern (Rules 1–5 + queries-to-avoid) for brands with homograph risk; added the local-pack sub-intent for commercial intent on local-service brands; added the Tier 1/2/3 page hierarchy as the canonical handoff to `str-internal-links`, `str-onpage-audit` and `str-ai-seo-local`; added a new research wave as a refresh trigger. *(Superseded in part 2026-09-02: the third-party AEO audit refresh trigger is now a surface shift plus a named Google update — Pixelmojo Radar is optional input, not a trigger. The local-pack sub-intent is superseded by the full surface column in Step 7.)*
- 2026-04-25 (superseded for this client 2026-07-02): geographic default follows `brand_context/icp.md`. Got Moles = LOCAL (Western Washington) as the PRIMARY frame — city and county modifiers are core queries, not a subset. Never auto-prefix with country names. *(Extended 2026-09-02: exact county and community counts come from `canonical_facts` in `target-keywords.md`, which supersedes the stale 3-county / 60+ city figures in `icp.md`.)*
- 2026-04-25 (updated 2026-07-02, superseded 2026-09-02): the original rule named the client GSC scripts plus WebSearch and manual SERP testing as the only data sources, and excluded Ahrefs and SEMrush because AhrefsBot and SemrushBot are blocked in `robots.txt`. **Superseded 2026-09-02:** the rationale was wrong. A `robots.txt` block controls who crawls got-moles.com and has no bearing on querying a keyword or SERP API, which never touches the site. The rule is now: GSC is first-party truth for queries the site already appears on; DataForSEO Labs, Keywords Data, AI Optimization and SERP supply volume, difficulty, intent, rank, competitor gaps and live surface shape; Bing Webmaster Tools grounding queries are a manual input; SerpAPI is a second opinion; WebSearch is a spot-check only. The GSC script path in the original rule was also wrong — the scripts are at `.claude/skills/ops-got-moles-ads/scripts/_gsc-*.mjs`, not `scripts/`, and `scripts/` is the disposable OS mirror that `update-clients.sh` deletes.
- 2026-04-25: When GSC data is thin because indexing is early-stage, note it explicitly — "early phase, no statistical significance" — and proceed. Never read thin GSC as low traction or as a reason to lower a cluster's priority.
- 2026-04-25 (softened 2026-09-02): voice-of-customer research is a strong input, not a hard gate. Clusters derive from ICP problem patterns with positioning pillars as a sanity check; brand-out clusters produce marketing-language head terms nobody searches. **Change 2026-09-02:** it is no longer REQUIRED-blocking, because DataForSEO Labs keyword ideas and Bing grounding queries now supply real demand language independently. Run it on a first build and when pain language may have shifted; on a refresh, record the skip and flag the ICP voice column `[research-thin]`. Mine Reddit, Nextdoor and PAA for a homeowner ICP — not LinkedIn or X, which was ATP-era framing.
- 2026-04-25 (scoped 2026-09-02): branded queries are lagging indicators of authority work, so a brand with zero or near-zero branded impressions over 90 days scores them `deferred`. **This gate does not bind Got Moles** — `got moles` carries 200–500 monthly volume and an active competitive threat from Mole Patrol, so the branded cluster stays active and defended. Apply the gate only on evidence of genuinely absent awareness.

## Self-Update

If the user flags an issue during or after a run — wrong intent classification, wrong surface tag, wrong cluster boundaries, missed cannibalisation, bad priority scoring, ICP mismatch — update the `## Rules` section immediately. Don't just log to learnings; fix the methodology so it doesn't recur.

## Troubleshooting

- **GSC returns no or few queries:** normal pre-indexing state. Document as baseline and proceed on DataForSEO demand data plus the competitor gap list. Re-run when indexing matures.
- **GSC scripts fail on credentials:** they hold hardcoded OAuth tokens pending a scrub to `.env`. Report the blocker rather than editing the scripts — they are out of this skill's scope.
- **DataForSEO returns an empty result:** check `location_code` (2840 for the US) and `language_code` ("en") first, then re-run with `--dry` to inspect the exact request. City-level codes must be looked up via `serp/google/locations`, never guessed.
- **Spend guard hit mid-run:** stop. Report which pulls completed, which are missing, and what the partial map can and cannot support. Do not continue past the cap on your own judgment.
- **A SERP call shows a competitor that is a phrase coincidence:** a dermatology or chemistry result matching "mole" is not a competitor. Demote to "phrase overlap, not entity competition."
- **Cluster boundaries unclear:** for Got Moles the seven ids are fixed — assign to the cluster whose pillar matches the query's natural intent shape and document the choice.
- **Multiple intents per query:** tag primary and secondary. Assign the page serving primary best. If the query genuinely splits across two buyer journeys, that is a coverage gap, not a second page for the same keyword.
- **DataForSEO intent disagrees with the manual tag:** the manual verdict wins. Record both.

## Change log

- **2026-09-02** — Rebuilt against `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (canonical, 2026-09-02) and the September 2026 skill audit.
  - **Output template rewritten to match the live `brand_context/target-keywords.md`.** The previous template emitted six fewer sections than the live file and would have silently destroyed `canonical_facts`, Brand Defense Strategy, Seasonality Calendar, Gap Opportunities, Pillar designation and Hub-and-Spoke topology on the next refresh — all read by name by `str-onpage-audit`, `str-internal-links`, `str-authority-strategy` and `str-ai-seo-local`. It also emitted `geographic_scope: global` against a Western Washington local business. Tier 3 now requires a per-page row rather than a pattern description, because `str-onpage-audit` needs a row for every page it audits.
  - **New columns for the remap:** `surface`, `ai_search_volume`, `difficulty`, `intent` (Labs, manually cross-checked), `current_rank` + `ranking_url`, `fan_out_subqueries`, `cannibalisation` flag, plus a dated `data_sources` block and a spend line per refresh.
  - **Data-source block replaces the third-party-tool refusal.** The old rationale — that AhrefsBot and SemrushBot are blocked in `robots.txt` — controlled who crawls the site and had nothing to do with querying an API. Removed from the description, the old Step 7 competitor scan and the Rules. Replaced with GSC as first-party truth (correct script path plus a credential-scrub caution), DataForSEO Labs / Keywords Data / AI Optimization / SERP with `--dry`-verified payloads and per-call caps, Bing grounding queries as a manual input, SerpAPI as a second opinion, and a ~$5 spend guard for a full remap.
  - **Added the two-surface split (Step 7) and AI Mode plus query fan-out (Step 8).** AI Mode was absent from the entire skill stack; it is now the default Search surface and is fan-out coupled rather than rank coupled. Word-count targets are replaced by fan-out coverage.
  - **Added cannibalisation detection (Step 11)** with an explicit hand-off: execution belongs to `str-onpage-audit` apply-fixes.
  - **Statistics re-sourced or retired.** The 8-intent model's attribution to "2026 evolution of the Quality Rater Guidelines" was unsourced and is removed — no 2026 revision exists. The "AIO triggers ~76.9% on near-me informational, ~7% on transactional Map Pack" pair is replaced by the Whitespark and Search Engine Land figures actually carried in the landscape file (~93% Local Pack on transactional local, 92–97% AI Overviews on informational and hybrid, 76.9% on informational near-me). The "GSC mcp" data source is removed — no GSC MCP exists in this install. Pixelmojo Radar is demoted from refresh trigger to optional input.
  - **ATP residue removed:** the `ai-thinking` cluster id, the "ChatGPT gives me generic crap" justification, the Reddit/X/LinkedIn B2B mining frame, and the EVOLVE-method branded-query worked example. Downstream routing now names only skills installed here — `mkt-copywriting`, `mkt-content-repurposing` and root-only `str-ai-seo` are gone; `str-onpage-audit` and `str-internal-links`, which hard-stop without this file, are added.
  - **Fan-out sourcing wired to `str-question-harvester`.** Step 8 ingests that skill's per-primary-keyword sub-query sets and Bing grounding queries before hand-enumerating, and the harvester seeds itself from this document's clusters — the relationship is bidirectional and neither side re-derives the other's work.
  - **Cluster taxonomy reconciled** to the seven ids in the live file. **Notion push** added to the output step per the client rule. **Doorway-page gate** added for city pages.
