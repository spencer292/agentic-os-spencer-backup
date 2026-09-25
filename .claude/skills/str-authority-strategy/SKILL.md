---
name: str-authority-strategy
description: >
  Build the foundation off-site authority strategy — brand mentions, YouTube, third-party listicles, co-citation, earned media, linkable assets, the `sameAs` entity spine and multi-location local authority — that downstream skills consume as Context. Use when the user mentions: "authority strategy", "brand mentions", "mention monitoring", "sentiment monitoring", "backlink strategy", "link building plan", "earned media strategy", "digital PR plan", "topical authority plan", "co-citation strategy", "entity SEO", "sameAs spine", "Wikidata strategy", "who should link to us", "how do we get into best-of lists", "best mole removal in {city} listicle", "linkable assets", "YouTube authority", "hallucination correction", "brand SERP defense", "domain authority building". Foundation skill — runs DOWNSTREAM of `str-keyword-strategy` (reads its clusters) and UPSTREAM of `str-onpage-audit` (REQUIRED input, addressed by Section number), `str-ai-seo-local`, `str-internal-links` and `mkt-authority-content`. Weighted per the September 2026 landscape: off-site brand signals correlate 2-3x stronger with AI visibility than backlinks (YouTube mentions 0.737, branded web mentions 0.664, backlinks ~0.218), ranked third-party listicles are the single most-cited format, and manufactured mentions are an explicit Google-named anti-pattern. Geographic scope defaults from `brand_context/icp.md` — for Got Moles (3 GBPs, Western Washington) LOCAL IS PRIMARY, not a subset. Produces `brand_context/authority-strategy.md` as numbered Sections 1-10 — the numbering is a consumer contract. Does NOT trigger for: tactical outreach execution, per-piece content authoring (use `mkt-authority-content`), keyword strategy (use `str-keyword-strategy` first), page-level audit (use `str-onpage-audit`), local AI-visibility audit (use `str-ai-seo-local`).
---

# Authority Strategy Foundation

Build a versioned off-site authority strategy specifying WHO should mention, cite and link the brand, WHAT topical authorities matter per cluster, HOW to earn those signals, and WHICH assets to build. The lever ordering follows the evidence: **off-site brand signals first, links as a byproduct.**

**[S] Ahrefs, 75,000 brands (published 2025-12-12)** — Spearman correlations against AI brand visibility: YouTube mentions 0.737, branded web mentions 0.664, branded anchors 0.527, backlinks and referring domains ~0.218-0.27. Ahrefs' own caveat applies: correlation is not causation. Full landscape context lives in the root file `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` §5.1 — read it rather than restating its numbers here.

**[S] Ranked third-party listicles are the single most-cited format at ~21% of all citations** (arXiv 2606.20065, 100,000+ prompt responses). Inclusion in a "best mole removal in {city}" roundup outranks most link building. Same study: niche brands appear in **11%** of relevant answers — that is the honest baseline for a local service business, not a failure state.

**[P] Manufactured mentions are prohibited.** Google's generative-AI optimization guide names inauthentic mention-building as unnecessary and states that spam systems already filter what AI features depend on. Never propose paid, seeded, swapped or fabricated mentions, and never propose review incentives without disclosure.

## Outcome

A structured `brand_context/authority-strategy.md` written as **numbered Sections 1-10**. Downstream skills address it by section number (`str-onpage-audit` cites Section 2, Section 5, Section 8.4 and Section 9 by name; `mkt-authority-content` reads Section 2 and Section 9). **The section numbering and titles are a contract — a refresh must reproduce them exactly or three consumer skills break.**

| # | Section | What it holds |
|---|---|---|
| 1 | Brand Defense (Step 5.5, triggered) | Brand-name query inventory, defense surfaces, threat monitoring, uncontested credentials |
| 2 | Topical Authority Anchors per Cluster | Per-cluster anchor tables — the sources to cite and link out to |
| 3 | Competitor Authority Audit | Competitor referring-domain and anchor profiles, playbook to reverse-engineer |
| 4 | Current Authority Surface Inventory | What the brand owns today versus the gaps |
| 5 | Co-Citation Strategy | Named entities to be mentioned alongside, per cluster |
| 6 | Earned-Media Target List | Tiered outlets and the third-party listicle target class |
| 7 | Linkable-Asset Inventory | Assets to build, with hook and citation rationale |
| 8 | Brand-Mention Strategy + Hallucination Correction | Proactive, reactive, sentiment, and the per-fact correction matrix (8.4) |
| 9 | Entity-Graph Plan | `sameAs` spine, `knowsAbout` homograph binding, per-entity state |
| 10 | Multi-Location Authority (PRIMARY for Got Moles) | Per-location authority, directory-by-engine matrix, review policy |

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/target-keywords.md` | full | **Required.** Cluster ids, Brand Defense, Brand-Disambiguation Strategy, Gap Opportunities, pillar designation |
| `brand_context/icp.md` | full | Sets `geographic_scope`. ICP determines which authority surfaces matter |
| `brand_context/positioning.md` | summary + angle | Authority anchors and uncontested credentials derive from the differentiators |
| `brand_context/voice-profile.md` | tone only | Keeps recommended pitches within brand register |
| Root `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` | §1, §3, §4, §5, §11, §12.5, §12.9 | **Required.** The single source of landscape facts. Where this skill and that file disagree, that file wins |
| `context/learnings.md` | `## str-authority-strategy` section | Apply prior corrections |
| `brand_context/authority-strategy.md` | full, if it exists | Existing version — this is a refresh, not a first run |

If `brand_context/target-keywords.md` doesn't exist, **stop and ask the user to run `str-keyword-strategy` first**. Authority strategy without keyword clusters is shotgun.

## Skill Relationships

**Upstream (required):** `str-keyword-strategy` produces `target-keywords.md`. Every cluster in this skill's output maps 1:1 to a cluster id there — the seven ids are `mole-control`, `biology`, `safety`, `cost-value`, `seasonal`, `diy-vs-pro`, `location-services`.

**Upstream (optional):** `str-trending-research` (root) for emergent authority anchors and community sentiment. `str-question-harvester` for the sub-questions a linkable asset must answer. `positioning.md`, `icp.md` and `voice-profile.md` are maintained directly in `brand_context/`; no producer skill for them is installed here.

**Downstream:**
- `str-onpage-audit` — **REQUIRED consumer.** Reads Section 2 for outbound authority anchors, Section 5 for co-citation and expert-quote signals, Section 8.4 for the hallucination-correction matrix and its re-tests, Section 9 for entity binding. Addresses them **by section number**.
- `str-ai-seo-local` — reads per-cluster authority targets and citation gaps as Context.
- `str-internal-links` — reads which pages hold external authority so internal links can route it.
- `mkt-authority-content` and `ops-blog-pipeline` — read Section 2 for the sources to cite and link out to, Section 9 for the entity facts to reinforce.

**Refresh:** quarterly, or trigger-based on:
- Positioning pivot, new offering, major industry shift
- Refreshed `target-keywords.md` adds or removes clusters
- A DataForSEO AI Optimization run (`llm_mentions` / `llm_responses`) surfaces a competitor cited instead of Got Moles, a new hallucinated fact, or a sentiment flip
- Downstream `str-ai-seo-local` or `str-onpage-audit` surfaces a new authority anchor in any cluster
- Brand-name SERP defense triggered (a named competitor erodes brand SERP)
- A named Google core or spam update, or a refresh of the root landscape file
- Optional: a fresh Pixelmojo Radar report flags "competitor cited instead" URLs not in the current audit

## Before You Start

Confirm scope:
1. **Run mode:** foundation build (no `authority-strategy.md` exists), refresh (file exists, quarterly update), or expansion (adding a cluster). For Got Moles this is always a **refresh** — v1.0 dated 2026-05-08 exists.
2. **Verify dependency:** `brand_context/target-keywords.md` must exist. If missing, stop.
3. **Set `geographic_scope` from `brand_context/icp.md` — never default to global.** Read the ICP's service area and write it verbatim into the frontmatter. For Got Moles that is Western Washington multi-location (3 GBPs: Seattle, Tacoma, Enumclaw; 6 counties; 92+ communities), and **local authority is the PRIMARY frame**, with topical mole-control expertise layered on top. A global-primary scope only fits a brand whose ICP has no near-me intent.
4. **Carry `canonical_facts` forward.** The existing file's `canonical_facts` block is the fact set every authority surface must reinforce and every hallucination is measured against. Never drop it on a refresh.

## Data Sources

Third-party API data is available and should be used. The old "manual scan only until someone subscribes to Ahrefs" posture is retired.

**DataForSEO v3** through the shared root client. Run every command **from `clients/got-moles/`**:

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' [--out file] [--raw] [--dry]
```

Credentials resolve from the client's environment file automatically. Never print or quote them. Location code US = `2840`, `language_code` `"en"`.

| Endpoint | Feeds | Notes |
|---|---|---|
| `backlinks/summary/live` | Section 3, Section 4 | One target per call. Baseline rank, referring domains, anchor spread |
| `backlinks/referring_domains/live` | Section 3 | The competitor's actual link sources — replaces the manual press-page scan |
| `backlinks/anchors/live` | Section 3, Section 4 | Branded-anchor share is the signal that matters (0.527), not raw link count |
| `backlinks/competitors/live` | Section 3 | Finds domains sharing referring domains with got-moles.com — surfaces competitors SERP analysis misses |
| `backlinks/bulk_ranks/live` | Section 3 | Cheap side-by-side rank for the ten named competitors in one call |
| `content_analysis/search/live` | Section 8.1, 8.2 | Web-wide brand-mention discovery, linked and unlinked, with page type and sentiment fields |
| `ai_optimization/llm_mentions/live` | Section 8.3, 8.4 | Whether the brand is named across ChatGPT, Google AI Overviews, Gemini, Claude and Perplexity, with sentiment and source references. $0.10 per request plus $0.001 per row |
| `ai_optimization/llm_responses/live` | Section 8.4, Section 1 | Custom prompts, for the hallucination re-test loop and the "what is Got Moles" entity check. $0.0006 per prompt |
| `serp/google/organic/live/advanced` | Section 1 | Brand-name query rank check, replacing incognito searching |

Dry-tested payload examples (`--dry` prints the request and spends nothing):

```bash
# Section 3 — competitor referring domains
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs backlinks/referring_domains/live \
  '{"target":"mole-patrol.com","limit":100,"order_by":["rank,desc"],"backlinks_status_type":"live"}' \
  --out projects/str-authority-strategy/data/refdomains-mole-patrol.json

# Section 3 — bulk rank across the named competitor set
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs backlinks/bulk_ranks/live \
  '{"targets":["got-moles.com","mole-patrol.com","molemasters.com"]}'

# Section 4 — own anchor profile (branded-anchor share)
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs backlinks/anchors/live \
  '{"target":"got-moles.com","limit":100,"backlinks_status_type":"live"}'

# Section 8 — brand-mention discovery across the web
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs content_analysis/search/live \
  '{"keyword":"Got Moles","search_mode":"as_is","limit":50,"page_type":["news","blogs","message-boards","organization"]}'
```

**Spend guard (mandatory).** The account is pay-as-you-go with a small balance.
- Run `--dry` first on any payload you have not run before, and check that the endpoint sub-path resolves. The AI Optimization sub-paths in particular move between vendor releases — confirm against `https://docs.dataforseo.com/v3/ai_optimization/overview/` before the first paid call.
- **Never send a Backlinks, Labs or Content Analysis call without an explicit `limit`.** 100 is the working default; 1,000 is a deliberate decision.
- Check the balance with `node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs appendix/user_data` before a batch.
- Every call appends endpoint, status and cost to `.dataforseo-usage.log` in the client folder. Reconcile after each run and record the total in the output's `data_sources`.
- Cap `llm_mentions` to a fixed prompt set per run. It is priced per request plus per row and is the easiest way to overspend.

**Other sources.**
- **Google Search Console** domain property `sc-domain:got-moles.com` via `.claude/skills/ops-got-moles-ads/scripts/_gsc-status.mjs` and `_gsc-today.mjs`. **Caution: both scripts currently carry hardcoded OAuth credentials and are gitignored pending a scrub to environment variables — they must be scrubbed and the tokens rotated before anyone other than Roy runs them.** The Search Console Generative AI report is UI-only (impressions, no clicks, no queries, no API) — read it in the interface, never script it.
- **Bing Webmaster Tools → AI Performance** (UI only). Grounding queries are real AI retrieval phrasings; feed them into Section 6 pitch angles and the Section 8 prompt sets.
- **SerpAPI** on the paid Starter plan (`SERPAPI_API_KEY` in the root environment file) for spot SERP checks.
- **WebSearch / live checks** remain valid as a spot-check, never as the primary evidence base.
- **Pixelmojo Radar** JSON in `~/Downloads/` is now an **optional** input. If a report exists, ingest its "competitor cited instead" URLs and hallucination matrix; if not, DataForSEO AI Optimization is the primary AI-visibility benchmark. No freshness gate blocks the run.

**Confidence labels are mandatory.** Any statistic that reaches the output file carries `[P]` primary, `[S]` named study, or `[U]` unverified, per the landscape file's key. `[U]` figures never become scored rules or client-facing facts.

## Step 1: Load Context + Apply Rules

Read `brand_context/` per the table. Read `target-keywords.md` to ingest the seven cluster ids, the Brand Defense section, the Brand-Disambiguation Strategy and the Top 10 Gap Opportunities. Read the root landscape file. Read `context/learnings.md` → `## str-authority-strategy`. Read the existing `authority-strategy.md` if present and carry `canonical_facts` forward.

## Step 2: Topical Authority Anchor Mapping (per cluster) → Section 2

For each cluster, identify 5-10 **topical authority anchors** — the high-authority sites, institutions and people that dominate the cluster's topic. These are not necessarily competitors. They are the sources answer engines cite, and the sources Got Moles content should cite and link out to.

Per cluster, capture:
- **Anchor name** (entity)
- **Authority surface** (institutional page, extension service, regulatory body, dominant publication, YouTube channel, Wikipedia or Wikidata entry)
- **Relationship class** (compete / co-cite / cite-them-as-source / partner / ignore)
- **Distinctness** — what they own that Got Moles doesn't, and the reverse

For a Western Washington mole-control business the anchor set is regional and institutional: WSU Extension, Washington Department of Fish and Wildlife, Animal Diversity Web, iNaturalist, the Wikipedia and Wikidata Talpidae and Townsend's mole entries, AVMA and ASPCA for the safety cluster, NOAA for seasonality, Consumer Reports and This Old House for the DIY cluster. **These are the outbound links `str-onpage-audit` grades pages against** — name real URLs, not categories.

See `references/topical-authority-and-competitor-audit.md` for the mapping methodology.

## Step 3: Competitor Authority Audit (per cluster) → Section 3

Audit the top competitors on their actual off-site signals. Run the DataForSEO Backlinks calls above rather than scanning press pages by hand.

Per competitor, capture:
- **Referring-domain profile** — count, top domains by rank, and which are genuinely regional (chambers, local news, extension services) versus directory noise
- **Anchor profile** — branded versus generic versus exact-match share. Branded anchors correlate 0.527 with AI visibility; exact-match link building does not
- **Third-party listicle presence** — which "best mole removal in {city}" and "best pest control in {county}" roundups name them. This is the highest-value single finding in the whole audit
- **YouTube presence** — channel, video count, whether their videos surface for cluster queries
- **Earned media landed** and **linkable assets published**
- **Entity-graph presence** — GBP, Yelp, BBB, Angi, Nextdoor, Crunchbase, Wikidata, and their on-site `sameAs`
- **Playbook** — the 3-5 highest-leverage moves that built their position, and explicitly what to copy and what to skip

**Optional Pixelmojo input.** If a Radar report is available, add its "competitor cited instead" URLs to the audit list and run the structural diff. Those are competitors AI systems treat as authoritative even when they do not outrank in classic SERP.

## Step 4: Current Authority Surface Inventory → Section 4

Audit what exists, not what should exist:
- **The `sameAs` spine** — GBP × 3, Yelp, BBB, Angi, Facebook, LinkedIn (company and Spencer personal), YouTube. Populated, identical everywhere, and reciprocated (each profile links back to got-moles.com)
- **YouTube channel** — treat as a first-class authority surface, not a repurposing afterthought
- **Directory profiles** — each recorded with the engine it feeds (see the matrix in Step 10)
- **Wikidata / Wikipedia** — current state and realistic notability path
- **Crunchbase and registry profiles**
- **Author profile pages** — `/author/spencer/` and Person schema completeness
- **Brand mentions, linked and unlinked** — from `content_analysis/search/live`, with count, sentiment split and page type
- **Referring domains and branded-anchor share** — from `backlinks/summary/live` and `backlinks/anchors/live`
- **AI mention baseline** — from `ai_optimization/llm_mentions/live` across the five engines

Output a "what we own / what we don't yet" table that feeds Sections 5-10. Every gap gets a priority (P0-P3), never a duration.

## Step 5: Co-Citation Strategy → Section 5

Co-citation = being mentioned alongside a known authoritative entity by a third party, with or without a link. It works without backlinks and is how a niche brand borrows institutional credibility.

For each cluster, name **specific co-citation targets**:
- **Entity to be co-cited with** — for Got Moles: WSU Extension and its Master Gardener program, WDFW, the six county Chambers of Commerce, regional press (Seattle Times, Tacoma News Tribune, The Olympian, Enumclaw Courier-Herald), Old Farmer's Almanac for seasonal content, AVMA and ASPCA for pet safety, PNW landscaping YouTube channels and podcasts, and veteran-owned business networks
- **Why the association strengthens the brand** — the specific authority being transferred
- **Surfaces where co-citation can happen** — guest articles, quoted-expert placements, joint YouTube appearances, Chamber member spotlights, schema `knowsAbout` and `sameAs` fields
- **First action** — one concrete next step per target
- **Cadence** — how often the association needs a new co-citation event to stay live

**Co-citation must rest on a real connection point.** A relationship that does not exist will not be accepted by any engine, and manufacturing one is the anti-pattern Google names. See `references/co-citation-and-brand-mentions.md`.

## Step 5.5: Brand-Name SERP Defense (conditional) → Section 1

Run if any trigger applies:
- A named competitor targets brand-name terms (Mole Patrol uses "got moles?" in meta keywords)
- The brand name carries homograph risk — for Got Moles this is permanent, per the mole and skin-mole collision in `target-keywords.md`
- Brand-name queries return non-brand results

Document:
- **Brand-name query inventory** — `{brand}`, `{brand} {city}`, `{brand} reviews`, `{brand} pricing`, `{founder} {service}`, `{brand} bbb` and `{brand} yelp`
- **Current rank per query** — via `serp/google/organic/live/advanced`, not incognito searching
- **Entity check per engine** — `ai_optimization/llm_responses/live` on "what is Got Moles" and "who removes moles in {city} WA". Check which entity comes back. At $0.0006 per prompt this is cheap enough to run on a fixed cadence, and it measures the homograph failure instead of assuming it
- **Defense surfaces** — Organization schema with the full `sameAs` spine, Person schema for Spencer, review density on the three GBPs, press placements stating the brand name authoritatively
- **Threat monitoring** — which competitors erode brand SERP, their tactic, and the counter-signal
- **Uncontested-credential opportunities** — credentials no competitor can claim. For Got Moles: US Army veteran founder, the Total Mole Control Program as the region's year-round mole subscription, chemical-free methodology, and the largest mole-exclusive operation by review and client count. Never "WA's #1" (unsubstantiated) and never an I-713 compliance claim

This section feeds Section 8 and Section 9.

## Step 6: Earned-Media Target List → Section 6

Three target classes, in evidence order.

**6a. Third-party ranked listicles — the priority class.** [S] Listicles are ~21% of all AI citations, the single most-cited format. Target inclusion in "best mole removal in {city}", "best pest control in {county}" and "top-rated lawn services in {metro}" roundups across the priority cities in `target-keywords.md`. For each: the publisher, whether inclusion is editorial or submission-based, the current occupants, and the honest inclusion path. **Never pay for placement in a roundup presented as editorial, and never fabricate an entry.**

**6b. Tiered outlets.** For each cluster, list outlets that cover the topic, overlap the ICP, and carry real authority. Tier by access difficulty:
- **Tier 1 — flagship regional and national homeowner press.** Seattle Times, Tacoma News Tribune, Pacific NW Magazine, Seattle Magazine, The Olympian; nationally, Better Homes & Gardens or Real Simple as a quoted-expert source
- **Tier 2 — industry and trade.** Pest Control Technology, Pest Management Professional, Lawn & Landscape, veteran-business publications
- **Tier 3 — niche, local and community.** County Chamber newsletters, neighborhood papers, PNW landscaping podcasts and YouTube channels, WSU Master Gardener publications, local subreddits and Nextdoor

Build the Tier 3 stack first, let Tier 2 follow, and approach Tier 1 with proof points in hand.

**6c. YouTube as an earned surface.** Guest appearances and collaborations with PNW lawn-care and homesteading channels generate the highest-correlating signal in the dataset (0.737) and produce footage that doubles as proof for the [S] 97% of consumers who verify an AI recommendation before acting on it.

Per outlet capture: name, tier, cluster and topic match, audience overlap, **specific** pitch angle, submission path, status. A generic outlet list with no per-outlet angle is unusable.

See `references/earned-media-and-linkable-assets.md`.

## Step 7: Linkable-Asset Inventory → Section 7

Linkable assets are the things journalists, roundup editors and answer engines naturally cite. Build the asset, then the outreach has something to announce.

For each cluster, propose 2-4 assets with:
- **Asset type** — original dataset, definitive regional guide, calculator, field guide, tested-methods study, case study set
- **Hook** — the specific reason this gets cited: an original number, a counter-narrative, a first-of-kind, insider data from the job history across nearly 5,000 properties, or a synthesis
- **Citation potential** — which surface it earns on (listicle inclusion, press pickup, AI Overviews, AI Mode, classic organic)
- **Dependency** — what must exist before it can be built (data pulled, photography, video shot)
- **Cluster served** — must match a `target-keywords.md` cluster id
- **YouTube companion** — every visual asset (mole damage, trapping process, before and after, DIY method tests) ships with a video. This is the highest-leverage single addition to the content operation

**No effort or duration estimates.** Rank assets by impact, dependency order and reversibility. Sequence by what unblocks what, never by calendar.

## Step 8: Brand-Mention Strategy + Hallucination Correction → Section 8

Brand mentions are the primary off-site signal (branded web mentions 0.664 versus backlinks ~0.218). Links are a byproduct, not the target.

**8.1 Proactive mention earning.** Expert-source platforms (Featured, Qwoted) with Spencer's profile complete for "mole control expert", "PNW pest", "veteran-owned business". Journalist outreach per Section 6. Speaking and trade-event presence. Referral exchange with landscapers and pest companies that don't do moles. Listicle inclusion outreach per Step 6a.

**[P] Prohibited, absolutely.** No paid mentions presented as editorial, no mention swaps, no seeded forum posts, no AI-generated mention farms, no review incentives without clear and prominent disclosure. Google names inauthentic mention-building as unnecessary and its spam systems filter exactly what AI features retrieve from. This is a hard gate on every recommendation in this section.

**8.2 Reactive mention monitoring.** Scheduled, not remembered:
- `content_analysis/search/live` for "Got Moles", "Spencer Hill mole" and "got-moles.com" with an explicit `limit`, logged per run so velocity is computable
- Google Alerts as a free backstop
- Community watch on r/Seattle, r/Tacoma, r/lawncare, r/PNWGardening and Nextdoor
- Convert unlinked mentions to linked where it is easy and welcome, but do not chase every one. Unlinked mentions carry the signal

**8.3 Mention-quality and sentiment scoring.** [S] Sentiment flips roughly **6.7x more often than mention presence** — a brand can hold its mention count while the framing turns against it, so tracking presence alone misses the failure. Score each run:
- Volume: total mentions, linked and unlinked
- Context class: authoritative cite / listed cite (roundup inclusion) / neutral mention / dismissive cite / negative mention
- Sentiment split from `content_analysis/search/live` and `ai_optimization/llm_mentions/live`
- Per-engine mention rate across ChatGPT, Google AI Overviews, Gemini, Claude and Perplexity, tracked as a trend
- Target framing: majority authoritative or listed context. Benchmark against the [S] 11% niche-brand answer-presence baseline rather than an invented target

**8.4 Hallucination-correction matrix.** When an engine states a wrong fact about the brand, each fact gets a tracked correction surface and a re-test. Correction surfaces in the order engines actually read them:

1. **Google Business Profile** × 3 — founding year, services, service areas, attributes. The most directly consumed local fact source
2. **Yelp, BBB and Angi profiles** — the three highest-cited directories, and the entity records engines reconcile against
3. **Own-site answer blocks** — the fact stated plainly in a self-contained 40-60 word answer on the page that owns the query, in the first chunk, not buried
4. **Organization and Service schema fields** — `foundingDate`, `areaServed`, `hasOfferCatalog` with explicit pricing. Schema is for correctness and entity binding, never presented as a citation lever
5. **Press placements** stating the correct fact verbatim — third-party corroboration is what shifts a stubborn hallucination
6. **Wikipedia-adjacent entity sources** — Wikidata properties, Crunchbase, registry records. Slow, durable
7. **Re-test** via `ai_optimization/llm_responses/live` on the same prompt set, after enough recrawl time has passed, scoring each fact Correct / Vague / Wrong. Escalate the surface if still Wrong

**llms.txt is not on this list.** No engine documents consuming it and Google states it "will neither harm nor help." If the file exists, leave it in place and keep it accurate. Never propose it as a correction channel and never count it as a fix.

See `references/co-citation-and-brand-mentions.md`.

## Step 9: Entity-Graph Plan → Section 9

The realistic entity work, in order of return.

**9a. The `sameAs` spine — do this first.** Organization schema carrying identical `sameAs` URLs to: the three GBP map URLs, Yelp, BBB, Angi, Facebook, LinkedIn company page and the YouTube channel. Plus `knowsAbout` binding the brand to the pest-control sense of "mole" (mole control, Talpidae, Townsend's mole, chemical-free trapping, lawn and turf damage). **This is the disambiguation defense and the one place schema still earns its keep** — the mole and skin-mole homograph is a popularity-bias problem, and the spine is what tells engines which entity Got Moles is. Reciprocity matters: each profile links back to got-moles.com.

**9b. Person entity.** Spencer Hill with `worksFor` pointing at the Organization `@id`, `knowsAbout`, the veteran credential, LinkedIn in `sameAs`, and a byline on every post he authors. Three skills audit this entity; this section is where it gets built.

**9c. Per-entity state table.** For each named entity (Organization, Person, the Total Mole Control Program as a Service, the three Washington mole species as referenced entities): current state, target state, notability evidence, schema linkage, action sequence.

**9d. Wikidata and Wikipedia — honest framing.** Wikipedia is the strongest `sameAs` anchor because it feeds the Knowledge Graph, and it is **not realistically achievable for a regional service business**. Wikidata accepts entries supported by independent secondary sources; treat it as a long-dependency item gated on press placements landing, not a near-term deliverable. If a separate Wikidata brief exists, point to it rather than duplicating it. The achievable stack in 9a delivers most of the disambiguation benefit without either.

See `references/entity-graph-and-local-subset.md`.

## Step 10: Multi-Location Authority → Section 10

**For Got Moles this is the PRIMARY section, not an appendix.** Three GBPs, six counties, 92+ communities. For a brand with no near-me intent, mark local as a subset instead.

**Per-location authority audit.** For each GBP (Seattle, Tacoma, Enumclaw): profile state, per-location citation surface gaps, per-location authority anchors (city paper, Chamber, neighborhood associations, county Master Gardener program), named neighborhoods, and review state. Per-location GBP mechanics defer to `str-ai-seo-local`.

**Directory-by-engine matrix.** [S] Foundation Marketing / AirOps, 28.5M AI responses. Claim in this order, because each directory feeds a different engine:

| Directory | AI citations | Which engine it feeds | Priority |
|---|---|---|---|
| **Yelp** | 512,680 | Google AI Mode (66% of its citations) and Perplexity (28.5%); strongest on ChatGPT since the [P] 2026-07-23 OpenAI licensing deal covering reviews, ratings, photos and Request a Quote | P0 × 3 locations |
| **Better Business Bureau** | 149,710 | Disproportionately important to ChatGPT; cheap to establish | P0 × 3 |
| **Angi** | 145,633 | **The Gemini lever** — Angi led Gemini at 18,870 citations while Yelp scored 49 | P0 × 3 |
| **Thumbtack** | 56,004 | Secondary marketplace coverage | P1 |
| **HomeAdvisor** | 33,582 | Secondary marketplace coverage | P1 |
| **Nextdoor** | 10,308 | Local and community tail; hyperlocal neighborhood presence | P1 × 3 |

Bing Places and Apple Business Connect stay on the list as free listings feeding Copilot, Bing, Apple Maps, Siri and Spotlight — label their weight in AI local answers `[U]`, because it is unmeasured. **[S] The Foursquare claim is dead**: an August 2026 test across 4,607 runs found Foursquare at 0.00% of ChatGPT citations and Yelp attached to 95.83% of structured business cards. Do not build on it.

**Cross-location entity-graph linkage.** Organization `sameAs` includes all three GBP map URLs. Each city page emits LocalBusiness schema with `parentOrganization` pointing at the Organization `@id`.

**Review acquisition — policy-compliant only.** Reviews are ~20% of Local Pack weight [S, Whitespark 2026] and the corpus that converts an AI mention into a call: [S] 97% of consumers double-check an AI recommendation against real reviews, 47% will not use a business with under 20 reviews, and 31% will not use one rated below 4.5. Rating acts as a filter, not a ranking signal. The compliance rules are blocking:

- **[P] 2026-04-17** — no staff review quotas, and never ask a customer to name a technician in their review. Google prohibits merchants requesting reviews containing specific content, including content that identifies a staff member. A customer naming Spencer or a technician spontaneously is fine; asking for it is a violation. Staff may invite an honest, open-ended review offered equally to every customer with no reward attached.
- **[P] 2026-07-24** — no fake or undisclosed incentivized reviews on the page or in structured data. Any incentive must be clearly and prominently disclosed. Review and AggregateRating markup over undisclosed incentivized reviews is a manual-action risk that kills star-rating eligibility while the page still ranks.
- **Never propose a monthly review target as a quota on staff.** Track velocity as an outcome measure, label any specific per-month number `[U]` unless sourced, and describe the acquisition method rather than a headcount goal.
- **[P] Service-area business rule:** the three profiles must not display a street address publicly. Service areas only.
- **Known 2026 GBP bugs** (reviews disappearing, replies not displaying) mean live state must be verified before a review drop is diagnosed as a ranking loss.

**Per-location authority anchors** are named entities: the city paper, the county Chamber, the neighborhood association, the Master Gardener program. Not categories.

## Step 11: Output → `brand_context/authority-strategy.md`

Write the numbered Section 1-10 structure exactly. **Section numbers and titles are a consumer contract — `str-onpage-audit` and `mkt-authority-content` address them by number.**

````markdown
---
last_updated: YYYY-MM-DD
methodology_version: {n.n}
geographic_scope: {verbatim from brand_context/icp.md — never "global" by default. For Got Moles: Western Washington — multi-location (3 GBPs: Seattle / Tacoma / Enumclaw; 6 counties; 92+ communities). Local authority is PRIMARY for this brand, not appendix.}
data_sources:
  - brand_context/target-keywords.md v{n} (7 clusters + Tier 1/2/3 map + Brand-Disambiguation Strategy + Brand Defense)
  - brand_context/positioning.md / icp.md
  - .claude/skills/str-ai-seo/references/search-landscape-2026-09.md (landscape baseline)
  - DataForSEO backlinks/* + content_analysis/search + ai_optimization/* — run {date}, spend ${x.xx} per .dataforseo-usage.log
  - {optional: Pixelmojo Radar report {date}} / {Bing Webmaster AI Performance grounding queries, read {date}}
canonical_facts (must be reinforced across every authority surface):
  - {carried forward from the prior version — founding, founder, service area, scale, pricing, methodology}
---

# Authority Strategy — {brand}

{Two-paragraph frame: the lever ordering with its evidence tier, and what is primary for this brand.}

---

## Section 1 — Brand Defense (Step 5.5, triggered)
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

---

## Section 2 — Topical Authority Anchors per Cluster
### Cluster {n}: {cluster-id}
**Pillar:** {pillar URL from target-keywords.md}
| Anchor | Surface | Relationship | Distinctness |
{one block per cluster, all seven}

---

## Section 3 — Competitor Authority Audit
### Referring-domain and anchor profile (DataForSEO)
| Competitor | Referring domains | Branded-anchor share | Notable regional links | Listicle presence | YouTube |
### Authority playbook to reverse-engineer
| Signal | Competitor approach | Got Moles counter |
### What to copy / what to skip

---

## Section 4 — Current Authority Surface Inventory
### `sameAs` spine state
| Profile | Claimed | In Organization sameAs | Links back | Engine fed |
### Strong / claimed surfaces
| Surface | State | Notes |
### Gaps / unclaimed surfaces
| Surface | State | Priority | Action |
### Off-site signal baseline
| Signal | Value | Source | Confidence |

---

## Section 5 — Co-Citation Strategy
### Co-citation targets per cluster
| Target entity | Cluster | Why it strengthens | Surfaces | First action |
### {Founder}-as-expert co-citation surfaces

---

## Section 6 — Earned-Media Target List
### 6a — Third-party ranked listicles (priority class)
| Roundup | City / query | Publisher | Inclusion path | Current occupants | Status |
### Tier 1 — flagship
| Outlet | Audience overlap | Pitch angle |
### Tier 2 — industry / trade
### Tier 3 — niche / community / podcast / YouTube

---

## Section 7 — Linkable-Asset Inventory
### Asset proposals (per cluster)
| # | Asset | Hook | Citation potential | Dependency | Cluster | YouTube companion |
### Dependency-ordered sequence
| Band | Assets | Unblocked by |

---

## Section 8 — Brand-Mention Strategy + Hallucination Correction
### 8.1 Proactive mention earning
### 8.2 Reactive mention monitoring
### 8.3 Mention-quality and sentiment scoring
| Run date | Total mentions | Authoritative | Listed | Neutral | Dismissive | Negative | Sentiment split | Per-engine mention rate |
### 8.4 Hallucination correction surface
| Fact | Hallucination | Ground truth | Correction surfaces (ordered) | Re-test prompt | Last verdict |

---

## Section 9 — Entity-Graph Plan
### 9a `sameAs` spine + knowsAbout binding
### Entity {n}: {name} ({type})
| Field | Current | Target | Action |

---

## Section 10 — Multi-Location Authority ({PRIMARY / subset})
### Per-location authority audit
| Location | GBP status | Citation surface gaps | Per-location authority anchors | Review state |
### Directory-by-engine matrix
| Directory | Engine fed | Priority | Status per location |
### Review acquisition (policy-compliant)
### Cross-location entity-graph linkage

---

## Refresh triggers
{quarterly + trigger-based events}

## Methodology version log
- v{n.n} ({date}) — {what changed and why}
````

**After writing:**
1. Show the absolute path.
2. **Push to Notion** — client rule: Notion is the review mechanism, and every deliverable goes there when created or updated. Use the Notion MCP tools directly; no script is needed.
3. Any working data pulled during the run goes to `projects/str-authority-strategy/data/`, and any standalone report to `projects/str-authority-strategy/{YYYY-MM-DD}_{topic}-audit.md`. The foundation document itself stays in `brand_context/`.

## Step 12: Save + Collect Feedback

Ask: "Anything missing? Wrong anchors? Co-citation targets I shouldn't pursue? Earned-media outlets you'd cut? Assets you wouldn't build?"

Log responses to `context/learnings.md` under `## str-authority-strategy` with the date. If feedback reveals a methodology issue, update `## Rules` below immediately.

## Rules

*Entries added when the user flags issues. Format: `- {YYYY-MM-DD}: {correction}`*

- 2026-09-02: **Section numbering is a contract.** The output is Sections 1-10 with the exact titles in the Outcome table. `str-onpage-audit` addresses Section 2, Section 5, Section 8.4 and Section 9 by number; `mkt-authority-content` reads Section 2 and Section 9. A refresh that emits any other shape breaks them. Also mandatory on every refresh: `geographic_scope` set verbatim from `icp.md` (never "global"), and the `canonical_facts` block carried forward.
- 2026-09-02: **No manufactured mentions, ever.** [P] Google names inauthentic mention-building as unnecessary and its spam systems filter what AI features retrieve. No paid editorial placement, no mention swaps, no seeded posts, no undisclosed review incentives. This is a gate on every recommendation, not a preference.
- 2026-09-02: **Review acquisition is policy-gated.** [P] 2026-04-17 bans staff review quotas and asking customers to name a technician. [P] 2026-07-24 bans fake or undisclosed incentivized reviews in content and in Review/AggregateRating markup, at manual-action risk. Never write a per-staff review target into a deliverable.
- 2026-09-02: **llms.txt is not a correction surface.** No engine documents consuming it; Google states it neither harms nor helps. Leave existing files in place and accurate. Never list it as a hallucination-correction channel, a deliverable or a scored item.
- 2026-09-02: **Never present schema as an AI-citation lever.** [S] Ahrefs difference-in-differences, 1,885 treated pages: −4.6% / +2.4% / +2.2%. Schema earns its keep for entity binding, correctness and rich results — the `sameAs` spine plus `knowsAbout` is the disambiguation defense, and that is the justification to give a client.
- 2026-09-02: **No effort or duration estimates anywhere.** Rank assets, gaps and outreach by impact, dependency order, risk and reversibility. "Trivial / moderate / substantial" effort bands and calendar-phrased sequencing are both out.
- 2026-05-08: Phase 0 currency audit — added third-party AEO audit input to Step 3 (ingest "competitor cited instead" URLs); added Step 5.5 Brand-Name SERP Defense for brands with named-competitor erosion or homograph risk; added hallucination-correction signals as the fourth component of the brand-mention strategy (Step 8 — per-fact correction surface plus re-test); added the multi-location pattern to Step 10 (per-location audit plus citation surface, and escalation when local is primary); added the separate-Wikidata-brief link rule; added refresh triggers. *(Superseded 2026-09-02 in two places: the Pixelmojo report is now an optional input rather than the named Step 3 trigger, replaced by DataForSEO AI Optimization; and llms.txt is removed from the Step 8 correction-surface list.)*
- 2026-04-25 (superseded for this client 2026-07-02): geographic frame follows `brand_context/icp.md`. Got Moles = LOCAL-PRIMARY (per-location audit plus citation surface per Step 10); topical authority supports it. Global-primary only fits non-regional brands.
- 2026-04-25 (superseded 2026-09-02 — numbers corrected, ordering reweighted): Brand mentions are weighted as a primary signal, not a footnote. The original wording cited "3x stronger correlation than backlinks, 0.664 vs 0.218" sourced to trade content. The [S] primary is Ahrefs, 75,000 brands, published 2025-12-12: **YouTube mentions 0.737**, branded web mentions 0.664, branded anchors 0.527, backlinks and referring domains ~0.218-0.27 — so the gap is 2-3x depending on the signal, and **YouTube, not web mentions, is the strongest single correlate**. YouTube is therefore a first-class authority channel in this skill, not a repurposing afterthought. Correlation is not causation (Ahrefs' own caveat). The brand-mention step remains non-optional.
- 2026-04-25 (extended 2026-09-02): Linkable assets are the leading link-earning method, not outreach. Extended: inclusion in third-party ranked listicles outranks both, at [S] ~21% of all AI citations — the single most-cited format. Step 6a targets those roundups explicitly.
- 2026-04-25: Co-citation is treated as a structured component with named entities plus specific surfaces, not a vague aspiration. Concrete relationships (for Got Moles: WA lawn-care and landscaping firms, pest-control associations, local-news gardening desks, WSU Extension, county Chambers, veteran-owned business directories) are what filled-in co-citation looks like — name real entities, not categories.
- 2026-04-25: Required upstream: `brand_context/target-keywords.md` produced by `str-keyword-strategy`. Don't run authority strategy without keyword clusters — the work becomes shotgun.

## Self-Update

If the user flags an issue with the output during or after a run — wrong cluster mapping, false topical authorities, co-citation targets that misrepresent existing relationships, earned-media targets out of scope, linkable assets the brand can't realistically produce — update the `## Rules` section above immediately.

## Troubleshooting

- **No `target-keywords.md` exists:** stop and instruct the user to run `str-keyword-strategy` first.
- **DataForSEO call returns an error or an unexpected shape:** re-run with `--dry` and check the endpoint sub-path against `https://docs.dataforseo.com/v3/`. AI Optimization sub-paths move between vendor releases. Never retry a failing paid call in a loop.
- **DataForSEO balance is low:** the account is pay-as-you-go. Check with `appendix/user_data`, cut `limit`, and drop `llm_mentions` before anything else — it is priced per request plus per row. `--dry` and the free Search Console, Bing and GA4 layers cost nothing.
- **Backlink data looks thin for a competitor:** small local businesses genuinely have thin link profiles. That is a finding, not a failure — it means listicle inclusion and brand mentions are the contested ground, not links.
- **Wikidata has no entry for a named entity:** that is a notability-evidence gap, not a blocker. Record it as gated on independent secondary sources, and do not submit early — a rejected entry creates friction for future attempts.
- **Co-citation targets feel too aspirational:** good candidates have a real existing connection point. Pure aspiration doesn't qualify, and manufacturing the connection is prohibited.
- **Linkable asset feels generic ("write a guide"):** sharpen until it has a hook a roundup editor or an engine would actually cite. Generic gets ignored.
- **An engine still states a wrong fact after correction:** escalate the surface order in 8.4 — GBP and the three directories first, then third-party press corroboration. Adding more first-party text rarely moves a stubborn hallucination on its own.

## Change log

- **2026-09-02** — Refreshed against the root landscape file `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`.
  - **Output template rewritten to the live Section 1-10 shape.** The previous cluster-first template would have destroyed the live document's structure on refresh and broken every consumer that addresses it by section number. `geographic_scope` now defaults from `icp.md` instead of "global"; `canonical_facts` is carried forward.
  - **Methodology reweighted from backlinks to brand mentions**, with the correct [S] Ahrefs figures (YouTube 0.737, branded web mentions 0.664, branded anchors 0.527, backlinks ~0.218) replacing the unsourced "3x / 0.664 vs 0.218" pair that appeared four times across this skill. **YouTube promoted to a first-class authority channel.**
  - **Third-party ranked listicles added as the priority earned-media class** (Step 6a) at ~21% of all AI citations.
  - **Sentiment monitoring added** to Step 8 (sentiment flips ~6.7x more often than mention presence), plus an explicit [P] prohibition on manufactured mentions.
  - **`sameAs` entity spine** (GBP × 3, Yelp, BBB, Angi, Facebook, LinkedIn, YouTube) with `knowsAbout` promoted to the lead of Step 9 as the homograph disambiguation defense and the one surviving schema justification. Wikidata and Wikipedia demoted to honest long-dependency framing.
  - **Directory-by-engine matrix added to Section 10** (Yelp → AI Mode and Perplexity; BBB → ChatGPT; Angi → Gemini; then Thumbtack, HomeAdvisor, Nextdoor), with the Foursquare claim recorded as debunked, plus the [P] 2026-04-17 and 2026-07-24 review-policy compliance rules and the service-area address rule.
  - **DataForSEO wired in** — `backlinks/*` for Step 3 and Section 4, `content_analysis/search` plus `ai_optimization/llm_mentions` and `llm_responses` for Section 8 and the Step 5.5 entity check — with `--dry`-tested payloads, mandatory `limit`s and a spend guard. The "manual scan until someone buys Ahrefs" posture is retired. Pixelmojo demoted to an optional input with no freshness gate.
  - **llms.txt removed from the hallucination-correction surface list** and the surfaces reordered around what engines actually read (GBP, then Yelp/BBB/Angi, then own-site answer blocks, schema, press, Wikipedia-adjacent sources, then the LLM re-test).
  - **ATP residue removed** from the SKILL body (Wim Hof instructor profile, Scott Abbott, Ethan Mollick, BOS-UP) and replaced with Got Moles equivalents. Downstream skill list corrected — `str-onpage-audit` added as the REQUIRED consumer it always was; `mkt-copywriting`, `mkt-positioning` and `mkt-icp` removed as not installed here.
  - **Output convention standardized** — run data to `projects/str-authority-strategy/data/`, and the Notion push made explicit after every deliverable.
