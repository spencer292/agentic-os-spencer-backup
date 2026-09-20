---
name: str-question-harvester
description: >
  Discover the sub-queries people and answer engines actually ask about your
  topics. Harvests People Also Ask questions via DataForSEO SERP (primary,
  with search volume and AI search volume from DataForSEO Labs and the AI
  Optimization API), cross-checks with SerpAPI, and accepts Bing Webmaster
  AI grounding queries as a manual input. Seeds derive live from the seven
  clusters in brand_context/target-keywords.md. Clusters results, filters the
  mole homograph at harvest time, compares against existing on-site answer
  coverage, and outputs a prioritized gap report plus a per-primary-keyword
  fan-out sub-query set that str-keyword-strategy and mkt-authority-content
  consume. Runs on-demand or monthly via cron.
  Triggers on: "question harvester", "what questions are people asking",
  "find questions", "question research", "PAA research", "harvest questions",
  "FAQ gaps", "question bank", "what should we answer", "content gaps",
  "fan-out sub-queries", "what sub-questions does this query generate",
  "what are homeowners asking", "what are people searching for".
  Does NOT trigger for: writing the answers (mkt-authority-content or
  ops-blog-pipeline), the keyword/page-map foundation itself
  (str-keyword-strategy), local AI-visibility auditing (str-ai-seo-local), or
  social/forum discussion research (str-trending-research).
---

# Question Harvester

Discover the sub-queries people and answer engines actually ask about your topics. Harvests Google's "People Also Ask" questions for seeds derived from the seven clusters in `brand_context/target-keywords.md`, attaches real search volume and AI search volume, clusters them, and compares against the answers the site already gives.

## Why this skill exists now: query fan-out

Google retrieves for AI Overviews and AI Mode through **query fan-out** — one user prompt is decomposed into multiple related sub-queries issued across subtopics and data sources, and pages are retrieved against each sub-query rather than against the original phrasing. Google's own worked example is a lawn-weeds query fanning into herbicides, chemical-free removal and prevention, which reads across directly to mole control. See `../../../../../.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` §2.3 (from the install root: `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`).

**The harvested questions ARE the fan-out sub-queries.** PAA is the closest free proxy for what a fan-out generates, and Bing's grounding queries are the actual retrieval phrasings. So this skill is not an FAQ-topic generator any more. It is the sub-query discovery layer for the whole content chain:

- `str-keyword-strategy` fills its `fan_out_subqueries` column per primary keyword from this output.
- `mkt-authority-content` and `ops-blog-pipeline` use the grouped sub-queries as the H2 set for a post, each answered in a self-contained 40–80 word block.
- Coverage is scored per page against its own fan-out set, never against a sitewide FAQ count.

Two surfaces matter for Got Moles and they behave differently. Transactional local intent ("mole removal Everett") fires the **Local Pack** ~93% of the time; informational and hybrid intent ("how do I get rid of moles", "average cost of mole removal in {city}") fires **AI Overviews** ~92–97% of the time. This skill serves the informational and hybrid side. Tag every harvested question with the surface its seed fires. Local Pack questions are a `str-ai-seo-local` concern, not a content gap.

## Outcome

A question bank and gap report saved to `projects/str-question-harvester/{YYYY-MM-DD}_got-moles-audit.md` containing:
- Every harvested question, clustered to the seven `target-keywords.md` cluster ids
- Search volume, keyword difficulty and AI search volume per question where available
- **Fan-out sets grouped per primary keyword** — the contract row `str-keyword-strategy` and `mkt-authority-content` read
- Gap analysis against the answers the site already gives, scored as fan-out coverage per page
- Prioritized list of unanswered sub-queries worth creating content for
- Suggested placement per question (answer-first H2 on an existing page, new spoke post, city-page local block)
- Competitor domains appearing as PAA and AI Overview sources
- Spend actually used, per provider

Always save output to disk. This is not optional. After saving, show the user the full absolute file path so they can click it directly, then push the report to Notion (client rule: Notion is the review mechanism) using the Notion MCP tools. No script is needed.

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| `brand_context/target-keywords.md` | **REQUIRED** | The seven cluster ids, the per-cluster Queries table, Disambiguation Rules 1–5 and the "Queries to AVOID" list. Seeds derive from this file every run — see Step 2 |
| `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (install root) | sections 2.3, 5.2, 9, 10 | Fan-out mechanism, format/length evidence, the homograph problem, the measurement stack. This file wins over any landscape claim written into this skill |
| `brand_context/positioning.md` | summary | What differentiates the brand — prioritize questions where we have a unique angle |
| `brand_context/icp.md` | full | The audience's actual phrasing, pain points and search patterns, for relevance scoring |
| `brand_context/authority-strategy.md` | summary, optional | Per-cluster authority anchors, so a harvested question can be routed to the page that already carries the anchor |
| `context/learnings.md` | `## str-question-harvester` section | Apply previous feedback before starting |

`target-keywords.md` is required. Everything else: load if it exists, proceed without it if not.

## Dependencies

| Dependency | Required? | What it provides | Without it |
|-------|-----------|-----------------|------------|
| **DataForSEO v3** (PRIMARY) | Required | PAA questions with location targeting, AI Overview presence per seed, keyword suggestions and related keywords **with search volume and difficulty**, search intent classification, and AI search volume for the harvested questions. Shared client at `.claude/skills/str-ai-seo/scripts/dataforseo.mjs` (install root); credentials resolve from `.env` automatically | Fall back to SerpAPI-only. You lose volume, difficulty, intent and AI search volume — the entire demand axis of the scoring — so flag the report as volume-blind |
| **SerpAPI** (cross-check / second provider) | Optional | An independent PAA read on the same seeds, plus `related_searches` and `discussions_and_forums`. Useful for confirming PAA depth and for the ICP-phrasing bank. Key `SERPAPI_API_KEY` in root `.env` | Run DataForSEO alone. Note in the report that PAA was single-provider |
| **Bing Webmaster Tools → AI Performance → Grounding Queries** | Optional, manual | The actual phrasings Copilot and Bing AI used to retrieve a page. This is real retrieval data, which PAA is only a proxy for. UI only, no API — the operator pastes or exports them | Harvest proceeds on PAA alone. Say so; the fan-out sets are then inferred, not observed |
| **WebSearch** | Fallback only | Search each seed and note the visible People-Also-Ask questions | Reduced coverage, no source metadata, no volume. Flag the report as fallback-mode |

## Skill Relationships

**Upstream:** `str-keyword-strategy` — it produces `brand_context/target-keywords.md`, which this skill reads every run to derive its seeds. This skill does not need a keyword-strategy run to have happened this week, but it does need that file to exist.

**Downstream consumers:**
- `str-keyword-strategy` — consumes the per-primary-keyword fan-out sets to fill its `fan_out_subqueries` column on the next refresh. Closed loop: it seeds this skill, this skill feeds it back.
- `mkt-authority-content` / `ops-blog-pipeline` — consume the fan-out set for a primary keyword as the H2 plan for a post, and the gap list as the topic queue.
- `str-onpage-audit` — consumes per-page fan-out coverage as the input to its answer-shape pillar.
- `str-ai-seo-local` — consumes the Local-Pack-tagged questions and the competitor-source list.

**Trigger conflicts:** overlaps with `str-trending-research` on phrases like "what are people asking about X". The distinction: this skill pulls structured question data from search engines and answer engines. `str-trending-research` pulls social and forum discussion. Different data sources, different outputs, no conflict running both on one topic.

## Before You Start

1. **Confirm the working directory.** Run everything from `clients/got-moles/` so `.env` and relative paths resolve. Never print or echo a credential value.

2. **Check credentials and budget.** Both providers are paid and already provisioned. Do not prompt the user to sign up for anything.

   | Provider | Key | Plan | Pre-flight check |
   |---|---|---|---|
   | DataForSEO v3 | `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD`, resolved from `.env` by the shared client | Pay-as-you-go, small prepaid balance | `node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs appendix/user_data` returns the live balance. Read it before every run |
   | SerpAPI | `SERPAPI_API_KEY` in the **root** `.env` | **Paid Starter plan** — a monthly allowance in the thousands of searches, shared with every other skill that uses it | Check `https://serpapi.com/account.json` for `plan_searches_left` before a run |

   **Spend discipline.** Do not carry a hard-coded quota number in this skill or in the emitted report — plan allowances and balances change and a stale number is worse than none. The operator reads the live figures from the two pre-flight checks above and the skill reports **what this run actually consumed**, per provider, against what the pre-flight showed.

   DataForSEO is billed per call and per row, so **every Labs call in this skill specifies a `limit`**, and the shared client appends each call's endpoint, status and cost to `.dataforseo-usage.log` in the working directory. Per-run spend guard: before starting, state the planned call count and the worst-case cost from the price table in Step 3; if that exceeds **$2.00** for one harvest, cut the seed count or the Labs `limit`s until it does not, and say so in the report. Never start a run that would take the DataForSEO balance below $5.

3. **Check for recent runs.** Look in `projects/str-question-harvester/` for a report from the last 30 days. If one exists: "I ran a harvest on {date}. Refresh it, or harvest a different cluster set?" A refresh is cheaper than a cold run because Step 4 can diff against the previous question bank.

4. **Business:** this is the Got Moles client workspace. There is one business. US English throughout.

## Step 1: Load Context

Load per the Context Needs table. `brand_context/target-keywords.md` is required — stop and say so if it is missing, because the seed list derives from it.

Show a brief status:
- Target keywords loaded: "Deriving seeds from {n} clusters, last_updated {date}."
- Positioning loaded: "Framing questions around '{angle}' — prioritizing gaps where we have a unique take."
- ICP loaded: "Scoring relevance against {audience summary}."

Read `context/learnings.md` → `## str-question-harvester` section and the `## Rules` section below. Apply every correction before starting.

## Step 2: Derive the Seed Set

**The seed list is derived every run. It is never a stored copy.** The July 2026 frozen seed file drifted from the foundation doc as soon as the clusters changed; that failure mode is what this step exists to prevent.

### Derivation rule

1. Read `brand_context/target-keywords.md`. Take the seven cluster ids exactly as written there: `mole-control`, `biology`, `safety`, `cost-value`, `seasonal`, `diy-vs-pro`, `location-services`. If that file's cluster set has changed, the new set wins — do not reconcile it against anything in this skill.
2. For each cluster, take from its `### Queries` table the **highest-priority informational and hybrid-intent** entries. Aim for 3–5 seeds per cluster. Transactional head terms belong to the Local Pack and produce thin PAA — take at most one per cluster as a control.
3. Add the cluster's `### Coverage gaps` entries as seeds. A recorded gap is exactly where fan-out discovery pays.
4. Add the pillar page's primary keyword from `## Pillar designation per cluster`, so every fan-out set has a page to attach to.
5. `location-services`: seed geo-modified queries only when the run's purpose is city-page fan-out coverage. Use two or three Tier A cities from `### Priority cities`, not the full 93. Geo-modified PAA is thin, and these seeds fire the Local Pack rather than AI Overviews — tag them accordingly.
6. **Homograph gate (blocking).** Every seed must carry a disambiguating token in the seed string itself — `lawn`, `yard`, `turf`, `ground`, `burrow`, `tunnel`, `molehill`, `trapping`, `pest`, `Scapanus`, or a Washington place name — **unless** the seed is a deliberate ambiguity probe. A bare seed such as `mole removal` or `mole removal cost` is only permitted as a probe, must be labeled as one, and its results go to the ambiguity section of the report, never to the content queue. Cross-check every seed against the `### Queries to AVOID` list in `target-keywords.md`; anything on it is dropped, not rephrased.
7. Sanity-cap the run. A full harvest is roughly 20–30 seeds. If the derivation yields more, keep the highest-priority entries per cluster until it fits the spend guard from "Before You Start".

If the user supplies custom keywords, run them through steps 6 and 7 and assign each to one of the seven cluster ids. Do not create an eighth cluster.

### Fallback

`references/seed-keywords.md` holds a **dated fallback list**, plus the ICP phrasing bank and the customization rules. Use it only when `target-keywords.md` is unreadable, and say in the report that the run used the fallback seeds and is therefore not aligned to the current clusters.

## Step 3: Harvest

Four passes. DataForSEO is the primary source; SerpAPI is a cross-check; Bing grounding queries are a manual input. Save every raw response under `projects/str-question-harvester/data/{YYYY-MM-DD}/` with `--out` before any processing, so a re-cluster never costs a second API call.

All calls run through the shared client from `clients/got-moles/`:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' --out <file>
```

Add `--dry` to inspect a request without spending. Location code 2840 = United States, `language_code` `"en"`. Every payload below has been `--dry` verified.

### Pass A — PAA and AI Overview presence, per seed (`serp/google/organic/live/advanced`)

One call per seed. The advanced result carries the `people_also_ask` element **and** tells you whether an `ai_overview` element fired for that seed, which is the surface tag every downstream recommendation needs.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs serp/google/organic/live/advanced \
  '{"keyword":"how to get rid of moles in yard","location_code":2840,"language_code":"en","device":"desktop","depth":20,"people_also_ask_click_depth":2}' \
  --out projects/str-question-harvester/data/2026-09-02/serp-how-to-get-rid-of-moles-in-yard.json
```

Extract per seed:

| From | Field | Use |
|---|---|---|
| `people_also_ask` items | `title` (the question), `expanded_element[].description`, `expanded_element[].url`, `expanded_element[].domain` | The question itself, Google's answer text, and the source currently winning it |
| `ai_overview` item | presence, `references[].domain` / `.url` | Surface tag for the seed, and who AI Overviews cites for it |
| `local_pack` item | presence | Marks the seed as Local-Pack-fired — route to `str-ai-seo-local`, not to the content queue |
| `organic` items | `domain` of the top 10 | Competitor set for the cluster |
| `related_searches` item | `items[]` | Seed-expansion candidates for the next run |

`people_also_ask_click_depth` of 2 expands each PAA box one level, which is where most of the fan-out signal lives. Raise it only when a cluster comes back thin; it increases cost per call.

If `people_also_ask` is absent, log the seed as "no PAA" and keep the `ai_overview`, `organic` and `related_searches` data. A seed with an AI Overview and no PAA is still a fan-out target.

### Pass B — question-shaped expansion with volume (`dataforseo_labs/google/keyword_suggestions/live` and `related_keywords/live`)

This is what the skill has never had: **actual demand**. Previously "frequency" meant how many seeds surfaced a question, which is a property of the harvest, not of the market.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs dataforseo_labs/google/keyword_suggestions/live \
  '{"keyword":"mole control","location_code":2840,"language_code":"en","include_seed_keyword":true,"limit":100,"filters":[["keyword_info.search_volume",">",10]],"order_by":["keyword_info.search_volume,desc"]}' \
  --out projects/str-question-harvester/data/2026-09-02/suggest-mole-control.json
```

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs dataforseo_labs/google/related_keywords/live \
  '{"keyword":"mole hills in lawn","location_code":2840,"language_code":"en","depth":2,"limit":100}' \
  --out projects/str-question-harvester/data/2026-09-02/related-mole-hills-in-lawn.json
```

Run these at the **cluster pillar** level, not per seed — one suggestions call and one related call per cluster, seven of each at most. Keep `limit` at 100 and raise it only for a cluster that comes back thin. Keep the question-shaped rows (leading who/what/why/how/when/where/can/do/does/is/are/should/will) and carry `keyword_info.search_volume`, `keyword_info.competition`, and `keyword_properties.keyword_difficulty` onto every matching harvested question. `related_keywords` at `depth` 2 is the replacement for SerpAPI's `related_searches`, with volume attached.

### Pass C — intent classification (`dataforseo_labs/google/search_intent/live`)

Batch the deduplicated question list. This replaces the crude How/What/Why flag with a real intent label, and it is the same classification `str-keyword-strategy` uses, so the two documents stay comparable.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs dataforseo_labs/google/search_intent/live \
  '{"keywords":["do mole repellents work","mole removal cost washington"],"language_code":"en"}' \
  --out projects/str-question-harvester/data/2026-09-02/intent.json
```

Batch up to 1,000 keywords per task. Informational and hybrid questions are this skill's content queue. Anything classified commercial or transactional is a Local Pack or service-page concern — tag it and hand it on rather than queuing a blog post.

### Pass D — AI search volume (`ai_optimization/ai_keyword_data/keywords_search_volume/live`)

Conversational phrasings barely register in typed-search tools. This endpoint returns AI search volume from the last month plus a 12-month trend across ChatGPT and Google AI Overview prompt corpora — the demand signal for exactly the phrasings this skill harvests.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/ai_keyword_data/keywords_search_volume/live \
  '{"keywords":["how do i get rid of moles in my yard","are mole traps safe for pets"],"location_code":2840,"language_code":"en"}' \
  --out projects/str-question-harvester/data/2026-09-02/ai-volume.json
```

Batch the whole deduplicated question list. At $0.0001 per keyword this is the cheapest signal in the run — never skip it, and never sample it. A question with low classic volume and high AI search volume is a **priority signal, not a weak one**: it means the demand has moved to an answer surface. Flag those explicitly.

### Pass E — SerpAPI cross-check (optional, second provider)

Run a subset of seeds — typically the cluster pillars — through SerpAPI to confirm PAA depth from an independent provider and to collect the two fields DataForSEO does not surface as cleanly:

```
GET https://serpapi.com/search.json?engine=google&q={keyword}&gl=us&hl=en&api_key={key}
```

Take `related_questions` (compare against Pass A; a large divergence means one provider's SERP snapshot is stale — note it, do not silently merge), `related_searches` and `discussions_and_forums`. The forum threads feed the ICP phrasing bank in `references/seed-keywords.md`, not the content queue.

Spend against SerpAPI is charged to the monthly Starter allowance, which is shared with the rest of the stack. Record the number of searches this run consumed and the `plan_searches_left` figure from the pre-flight check.

### Pass F — Bing grounding queries (manual)

Bing Webmaster Tools → **AI Performance → Grounding Queries** lists the phrasings Copilot and Bing AI actually used to retrieve pages on got-moles.com. It is UI only — there is no API — so ask the operator to export or paste them.

These outrank PAA in evidence quality: PAA is a proxy for fan-out, grounding queries are observed retrieval. Merge them into the question bank tagged `source: bing-grounding`, and where a grounding query has no matching PAA question, treat it as a confirmed gap regardless of its score.

Note for completeness: Google Search Console's Generative AI report is **impressions only, UI only, and has no API**. It cannot supply query-level AI data. Do not plan a step around it.

### Cost model and error handling

Prices for the AI Optimization endpoints are in the landscape file §10.2 — AI Keyword Data is $0.01 per task plus $0.0001 per keyword. SERP and Labs pricing is per call plus per row; the shared client prints the actual cost of every call to stderr and appends it to `.dataforseo-usage.log`. **Reconcile that log at the end of the run and put the real total in the report.** Do not estimate.

If a call fails, log the endpoint and seed and continue. Report every failure at the end with its status so the operator decides whether to retry. Never retry a paid call in a loop.

Tag every question with the cluster id of the seed that produced it, the seed itself, its provider, and the surface the seed fired.

## Step 3.5: Homograph Filter (blocking, at harvest time)

Filter before clustering, not after. PAA for anything mole-related returns dermatology, chemistry and pop-culture questions, and a single one reaching a content plan is a brand-safety problem, not a tidiness problem.

Drop any harvested question where:
1. It matches the `### Queries to AVOID` clusters in `brand_context/target-keywords.md`, or the medical-cluster negative list the ads side already maintains at `.claude/skills/ops-got-moles-ads/scripts/_got-moles-existing-negatives.json` (read it for the token list; do not modify it).
2. It contains a dermatology, chemistry, culinary or espionage sense marker — skin, dermatologist, biopsy, cancerous, melanoma, freckle, removal cost of a lesion, atomic, Avogadro, sauce, poblano, spy, informant.
3. "Mole" appears with no disambiguating token anywhere in the question **and** the PAA snippet resolves to the wrong sense. Judge by the snippet, not the question string alone.

Keep the dropped questions in a **Homograph Rejects** section of the report with the sense each resolved to. That list is evidence for `str-onpage-audit`'s disambiguation gate and for the ads negatives, and it tells you which seeds are still ambiguous in Google's eyes.

Any surviving question that goes into the content queue must be answerable in a sentence that carries a disambiguating token. If it cannot, rewrite the target phrasing before it reaches `mkt-authority-content`.

## Step 4: Deduplicate, Cluster, and Build the Fan-Out Sets

1. **Deduplicate.** Remove exact and near-duplicate questions ("how to get rid of moles in my yard" and "how do I get rid of moles in the yard" are one question). Keep the phrasing with the highest combined classic and AI search volume, and record the variants — variant phrasings are themselves fan-out signal.
2. **Cluster to the seven ids.** Use only the cluster ids from `brand_context/target-keywords.md`: `mole-control`, `biology`, `safety`, `cost-value`, `seasonal`, `diy-vs-pro`, `location-services`. A question inherits the cluster of the seed that produced it. Where a question surfaced under several clusters, assign it to the one whose pillar page should own the answer, and record the cross-cluster appearance. **Do not invent categories.** Any other taxonomy that appears in an older report is superseded.
3. **Build the fan-out set per primary keyword.** This is the deliverable the rest of the chain consumes. For each cluster pillar and each Tier 1/Tier 2 primary keyword in `target-keywords.md`, collect the harvested questions that a fan-out on that keyword would plausibly generate — the sub-questions, adjacent conditions, comparisons, objections and next steps. Order them the way a reader would need them. That ordered list is the H2 plan for the page.
4. **Attach the demand columns.** Every question carries classic search volume, keyword difficulty, DataForSEO search intent, AI search volume, and its 12-month AI trend where available. Mark anything missing as `n/a`, never as zero.
5. **Tag the surface.** `AI Overviews` for informational and hybrid seeds, `Local Pack` for transactional local seeds, `Classic organic` where neither fired, and `Copilot/Bing` for anything sourced from grounding queries. A question can carry more than one.
6. **Count seed frequency, but do not score on it alone.** Appearing under several seeds means the question sits at a cluster's center. It is a topology signal, not a demand signal — volume is the demand signal.

## Step 5: Map Existing Answer Coverage

Scan the site for the answers it already gives. This is coverage, not schema — the question is whether a reader or an answer engine can find the answer on the page, not whether it is wrapped in markup.

**Got Moles site:** `projects/briefs/website-rebuild-rebrand/site/src/` (relative to this client workspace root).

- Grep the page and block content for H2/H3 headings, question-shaped strings, and existing Q&A blocks (`faqSchema`, `FAQBlock`, question/answer arrays — read them as a content inventory).
- Cover the service pages, city pages, blog posts and the FAQ surfaces.
- For each answer found, record the question it answers, the page, the heading it sits under, and whether the answer reads as self-contained out of context.

**Note on FAQPage schema.** FAQ rich results were removed between 2026-05 and 2026-08. The Q&A **content shape** still matters for retrieval; the schema earns nothing. So: existing FAQPage markup stays where it is — do not recommend removing it — and adding FAQPage markup is never an output of this skill. See the landscape file §6.

Build the coverage baseline: every question the site currently answers, with its location.

## Step 6: Gap Analysis — Fan-Out Coverage per Page

Score coverage **per page against that page's own fan-out set**, not against a sitewide question count. A site with 200 answered questions spread thinly still loses the fan-out it needs to win one query.

For each fan-out set from Step 4:

| Status | Definition |
|---|---|
| **Covered** | The page answers this sub-query in a self-contained block that reads correctly with no surrounding context |
| **Present but not retrievable** | The answer exists on the page but is buried mid-paragraph, split across sections, or depends on earlier context to make sense. Counts as a gap for retrieval purposes and is usually the cheapest fix in the report |
| **Partially covered** | The topic is addressed, this angle or phrasing is not |
| **Not covered** | Nothing on the page addresses it |

Then report, per page: `fan-out coverage = covered / total sub-queries in the set`. That percentage is the number `str-onpage-audit` consumes. A confirmed Bing grounding query that is not covered is a gap regardless of its priority score.

Also flag **cross-page collisions**: two pages both covering the same sub-query is a cannibalization signal. Report it and hand it to `str-onpage-audit`, which owns the cull. Do not merge or redirect anything from this skill.

## Step 7: Prioritize Gaps

Score each gap. The demand axes carry real numbers now, so they outweigh the harvest-shape axes.

| Factor | Weight | How to assess |
|--------|--------|---------------|
| **Demand** | 3x | Classic search volume plus AI search volume for the question. High AI volume with low classic volume scores **high**, not low — the demand has moved to an answer surface |
| **Fan-out centrality** | 3x | Does this sub-query sit inside the fan-out set of a Tier 1 or pillar page? Sub-queries that block a pillar's coverage outrank standalone curiosities. A confirmed Bing grounding query scores at the top of this axis |
| **ICP relevance** | 2x | Would the ICP in `brand_context/icp.md` actually ask this? Score against the real audience, not the persona name |
| **Content depth available** | 2x | Do we have knowledge-base material, a technician's first-hand experience, or a verifiable local specific to answer it well? Generic answers do not get cited |
| **Competitive gap** | 1x | Are the current PAA and AI Overview sources weak — thin, generic, out of date, or national content with no Washington specificity? Use the source domains captured in Pass A |
| **Difficulty** | 1x, inverse | Keyword difficulty from Pass B. High difficulty on a low-volume question is a poor trade |

Rank by total score. The top 20 form the priority list, but present them **grouped by the page that should own them**, not as a flat list — a page with six unanswered sub-queries is one job, not six.

Every statistic that reaches a client-facing version of this report carries a confidence label: `[P]` primary/platform data, `[S]` named study, `[U]` unverified. API-returned volumes are `[P]`. Anything inferred is `[U]`.

## Step 8: Save the Report and Push to Notion

Save to `projects/str-question-harvester/{YYYY-MM-DD}_got-moles-audit.md`. Always save output to disk. This is not optional. Raw API responses stay in `projects/str-question-harvester/data/{YYYY-MM-DD}/`.

Report structure — use this template:

```markdown
# Question Harvest — Got Moles
Date: {YYYY-MM-DD}
Seeds: {count} derived from target-keywords.md (last_updated {date}) | Questions harvested: {count} | Unique after dedup: {count} | Homograph rejects: {count}
Providers: DataForSEO ({n} calls, ${actual} from .dataforseo-usage.log) | SerpAPI ({n} searches, {plan_searches_left} left at pre-flight) | Bing grounding queries: {n or "not supplied"}

## Summary
{2-3 sentences: what the harvest revealed, which pillar has the weakest fan-out coverage, anything surprising. Answer-first, one fact per sentence.}

## Fan-Out Sets per Primary Keyword
*The contract section. `str-keyword-strategy` fills its `fan_out_subqueries` column from here; `mkt-authority-content` uses each set as the H2 plan.*

### {primary keyword} → {owning page URL} [cluster: {id}] [surface: {AI Overviews | Local Pack | Classic organic}]
Fan-out coverage: {covered}/{total}
1. {sub-query} — vol {n} | AI vol {n} | intent {label} | **{covered / not retrievable / partial / gap}**
2. ...

### {next primary keyword}
...

## Priority Gaps, Grouped by Owning Page

### {page URL} — {n} unanswered sub-queries, coverage {x}%
| Sub-query | Cluster | Vol | AI vol | Difficulty | Score | Placement |
|---|---|---|---|---|---|---|
| {question} | {cluster id} | {n} | {n} | {n} | {score} | Answer-first H2 on this page / new spoke post / city-page local block |

## Full Question Bank by Cluster

### {cluster id} ({n} questions, {n} gaps)
#### Answered
- {question} — covered on {page}, under H2 "{heading}", self-contained: yes/no

#### Gaps
- {question} (vol {n}, AI vol {n}, intent {label}, surface {surface}, score {score})

## Homograph Rejects
| Dropped question | Resolved sense | Seed that surfaced it |
|---|---|---|
| {question} | dermatology / chemistry / culinary / espionage | {seed} |
{Seeds that keep producing rejects need their phrasing tightened in target-keywords.md — name them.}

## Cross-Page Collisions (hand to str-onpage-audit)
{Sub-queries answered on more than one page. Cannibalization candidates. This skill reports them; str-onpage-audit owns the cull.}

## Competitor Sources
{Domains appearing as PAA sources and as AI Overview references, with how many seeds each appeared under. This is the citation competition.}

## Seed Expansion for Next Run
{Question-shaped rows from related_keywords / keyword_suggestions with volume attached, and any SerpAPI related_searches. Candidates for the next derivation, not for the frozen file.}

## ICP Phrasing Observed
{Real phrasings from discussions_and_forums and from high-AI-volume conversational questions. Feeds the phrasing bank in references/seed-keywords.md.}

## Bing Grounding Queries
{Observed retrieval phrasings, or "not supplied this run". Any grounding query with no matching site answer is a confirmed gap.}

## Recommended Actions
1. {Page with the weakest fan-out coverage}: add answer-first H2 blocks for its {n} uncovered sub-queries. Each H2 is the question or its direct topic, followed by a self-contained 40–80 word answer, one fact per sentence.
2. {Cluster with a structural gap}: commission {n} new spoke posts via mkt-authority-content / ops-blog-pipeline, each carrying its fan-out set as the H2 plan.
3. Hand the fan-out sets to str-keyword-strategy for the `fan_out_subqueries` column at its next refresh.
4. Hand cross-page collisions to str-onpage-audit.
5. {Any client-specific recommendation.}

Ordering is by impact and dependency, never by effort. No FAQPage schema is added as a result of this report.
```

Show the user the full absolute file path after saving, then push the report to Notion with the Notion MCP tools. Notion is the review mechanism for this client, so a report that is not in Notion is not delivered.

## Step 9: Collect Feedback

Present to the user:
- Summary stats: questions harvested, gaps, homograph rejects, actual spend per provider
- The three pages with the weakest fan-out coverage
- Top 10 gaps grouped by owning page
- "Any of these surprise you? Any cluster that needs different seeds next run?"

Log feedback to `context/learnings.md` under `## str-question-harvester` with the date.

## Cron Mode

Monthly, non-interactive. There is one business in this workspace: Got Moles.

1. Derive seeds from `target-keywords.md` as normal — a cron run picks up cluster changes automatically, which is the whole point of deriving rather than storing.
2. Run the harvest at reduced breadth: cluster pillars only, Passes A, C and D, plus Pass B for any cluster whose coverage dropped. Skip the SerpAPI cross-check unless a provider disagreement was flagged last run.
3. Save the report silently to the standard path and push it to Notion.
4. Diff against the previous month's report and add a `## Month-over-Month Changes` section: new questions, questions that dropped out of PAA, movement in AI search volume, and any fan-out coverage percentage that moved.
5. If the spend guard would be breached, do not run. Write a short note to the report path saying so and stop.

## Rules

*Updated when the user flags an issue. Read before every run.*

- **2026-09-02 — Seeds derive, they never freeze.** Read `brand_context/target-keywords.md` at the start of every run and build the seed set from its live clusters. `references/seed-keywords.md` is a fallback and a rule set, not a source of truth. **Why:** the July 2026 hand-copied seed list drifted from the foundation the moment the clusters changed, and nothing detected it.
- **2026-09-02 — Seven cluster ids, no others.** `mole-control`, `biology`, `safety`, `cost-value`, `seasonal`, `diy-vs-pro`, `location-services`, exactly as `target-keywords.md` writes them. Three competing taxonomies previously lived in this one file.
- **2026-09-02 — Homograph filter runs at harvest time, before clustering.** Dermatology, chemistry, culinary and espionage senses never reach a content plan. Rejects are reported, not silently dropped.
- **2026-09-02 — No hard-coded API quota in this skill or in the emitted report.** Read the live balance and plan allowance in the pre-flight, report actual consumption from `.dataforseo-usage.log`.
- **2026-09-02 — Never output an FAQPage schema recommendation.** FAQ rich results were removed 2026-05 to 2026-08. Keep the Q&A content shape, route answers to answer-first H2 blocks in body content. Existing markup stays.
- **2026-09-02 — No word-count targets.** Coverage is measured as fan-out coverage per page. Word count correlates 0.04 with AI Overview citation (Ahrefs, 174,048 pages — see the landscape file §5.2).
- **2026-09-02 — High AI search volume with low classic volume is a priority signal.** It means demand moved to an answer surface. Never down-rank it for thin classic volume.

## Self-Update

If the user flags an issue with the output — wrong seeds, bad clustering, missed questions, irrelevant results, wrong cluster mapping, a homograph reject that should have survived — update the `## Rules` section in this SKILL.md immediately with the correction and today's date. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake.

## Troubleshooting

**DataForSEO returns 40101 / 401:** credentials are missing or wrong. The shared client walks `.env` from the working directory up to the filesystem root, so the usual cause is running from the wrong folder. Run from `clients/got-moles/`. Never print the values.

**DataForSEO returns 40200 or a payment error:** the prepaid balance is exhausted. Check with `appendix/user_data` and stop. Do not retry.

**A Labs call returns far more rows than expected, or costs more than expected:** the `limit` was omitted or set too high. Every Labs payload in Step 3 carries a `limit`; add one and re-run. Check `.dataforseo-usage.log` for what the call actually cost.

**No `people_also_ask` element for a seed:** not every query generates PAA. Log it, keep the `ai_overview`, `organic` and `related_searches` data, and move on. If a whole cluster returns nothing, the seeds are too narrow — take the cluster's pillar keyword instead of its long-tail entries.

**SerpAPI returns 401:** the key in the **root** `.env` is wrong. This is the paid Starter plan, so a key that used to work has not expired on its own — check for a truncated copy first.

**SerpAPI monthly allowance is low:** the Starter allowance is shared with every other skill using it. Drop Pass E entirely and run DataForSEO-only, noting single-provider PAA in the report. Do not suggest a plan upgrade; the plan is the operator's decision, not this skill's.

**The two providers disagree on PAA for the same seed:** report both counts rather than merging. Divergence usually means one provider's SERP snapshot is older, and it is useful signal about volatility on that query.

**Answer-coverage scan finds nothing:** the pages may carry their answers in CMS content rather than in the codebase. Check Payload content before concluding the answers do not exist, otherwise every question becomes a false gap.

**Seeds keep producing homograph rejects:** the seed phrasing is too bare. Add a disambiguating token and re-derive. Persistent rejects on a term belong in the report so `str-keyword-strategy` can tighten `target-keywords.md`.

**`target-keywords.md` is missing or unreadable:** stop and say so. Falling back to `references/seed-keywords.md` is permitted but produces a report that is not aligned to the current clusters, and it must be labeled that way.

## Change log

**2026-09-02** — Rewritten against `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (install root) and the September 2026 skill audit (items 10, 19, 20).

- **Budget section rewritten against the paid SerpAPI Starter plan.** Removed the free-tier sign-up prompt, the 250-vs-100 monthly contradiction, the 46-vs-24 seed-count contradiction, the "50 searches/hour" throttle and its 2-second delay, the `/ 250 monthly budget` line hard-coded into the report template, and the "upgrade to the $25/month tier" advice. Six wrong or mutually contradictory statements. The skill now reads live figures in a pre-flight and reports actual consumption.
- **DataForSEO v3 added as the primary source**, through the shared root client. Pass A `serp/google/organic/live/advanced` for PAA plus AI Overview and Local Pack presence per seed; Pass B `dataforseo_labs/google/keyword_suggestions/live` and `related_keywords/live` for question-shaped expansion with search volume and difficulty; Pass C `dataforseo_labs/google/search_intent/live`; Pass D `ai_optimization/ai_keyword_data/keywords_search_volume/live` for AI search volume. Every payload `--dry` verified. Each Labs call carries a `limit`, and a per-run spend guard sits in "Before You Start". SerpAPI demoted to an optional cross-check.
- **The skill now has a demand axis.** Priority scoring previously used "frequency" meaning how many seeds surfaced a question — a property of the harvest, not of the market. Scoring now weights real search volume and AI search volume, with fan-out centrality alongside it and difficulty as an inverse factor.
- **Seeds derive from `brand_context/target-keywords.md` on every run** instead of the frozen 2026-07-02 copy. `references/seed-keywords.md` becomes a derivation rule, a labeled dated fallback list, the homograph rules and the ICP phrasing bank.
- **Query fan-out framing added** per landscape §2.3. Harvested questions are reframed as the fan-out sub-queries themselves, and the report now emits fan-out sets grouped per primary keyword for `str-keyword-strategy`'s `fan_out_subqueries` column and for `mkt-authority-content`'s H2 plan. Gap scoring moved from a sitewide FAQ count to fan-out coverage per page.
- **Bing Webmaster AI grounding queries added as a manual input** (UI only, no API). Recorded as observed retrieval phrasing, which outranks PAA as evidence. Noted that Search Console's Generative AI report is impressions-only, UI-only and has no API, so it cannot supply query-level data.
- **Homograph filter promoted to a blocking harvest-time step** (new Step 3.5) with a Homograph Rejects section in the report, cross-referenced to the existing ads medical-cluster negatives.
- **FAQPage schema removed as an output.** FAQ rich results were removed 2026-05 to 2026-08 (landscape §6). The Q&A content shape survives and routes to answer-first H2 blocks. Existing markup is left alone.
- **Word-count targets removed** ("800-1200 words for GEO"); replaced by fan-out coverage per landscape §5.2.
- **ATP residue removed:** the "run for both businesses" cron mode, the `str-linkedin-planner` handoff, the LinkedIn content-format option, and the `mkt-copywriting` downstream route. Downstream now names only installed skills: `str-keyword-strategy`, `mkt-authority-content`, `ops-blog-pipeline`, `str-onpage-audit`, `str-ai-seo-local`. Upstream now correctly names `str-keyword-strategy`.
- **Three cluster taxonomies reconciled to the seven ids** in `target-keywords.md`.
- **Surface tagging added** — Classic organic, Local Pack, AI Overviews, Copilot/Bing — with transactional local seeds routed to `str-ai-seo-local` rather than the content queue.
- **Standard output path and Notion push applied:** `projects/str-question-harvester/{YYYY-MM-DD}_got-moles-audit.md`, pushed to Notion via the Notion MCP tools after every run.
- **Cross-page collision reporting added**, handed to `str-onpage-audit`, which owns the cannibalization cull.
- **Dated claims in the old file** either re-sourced or retired: the ICP is now referenced through `brand_context/icp.md` rather than named personas frozen in the skill, and the unverified "First-Mover GEO Opportunities" list in the reference file is relabeled as an unverified 2026-07 hypothesis to re-test, not an asserted finding.
