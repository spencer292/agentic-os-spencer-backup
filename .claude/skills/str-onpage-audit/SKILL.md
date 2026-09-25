---
name: str-onpage-audit
description: >
  Per-page on-page SEO/GEO/AEO audit AND apply-fixes skill for codebase-accessible sites, and the owner of the cannibalisation cull. Audit mode reads `brand_context/target-keywords.md` (primary keyword + cluster mapping per page) + `brand_context/authority-strategy.md` (per-cluster authority signals) + the root landscape file `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`, then scores every page on nine pillars: AI + search crawlability (named user agents, WAF/CDN rules, JS-render dependence, published IP lists), heading and keyword alignment, answer-first content shape and query fan-out coverage, meta + canonical, internal links, schema correctness and entity binding, visible freshness, E-E-A-T, and images + Core Web Vitals. Three blocking gates run before scoring: the mole homograph gate, the doorway-page gate on city pages, and the incentivized-review gate on any Review or AggregateRating markup. Produces a scored audit report with a per-page fix list. Apply-fixes mode executes the fixes directly, including staged cannibalisation merges, 301s and redirect-map updates. Data sources: DataForSEO On-Page (`instant_pages`, `content_parsing`, `lighthouse`) and AI Optimization (`llm_mentions`, `llm_responses`) through the shared client, Google Search Console, plus live raw-HTML extraction. Use when the user mentions: "on-page audit", "SEO audit", "AEO audit", "AI Mode audit", "page audit", "audit my pages", "score this page for SEO/AEO", "fix H1s sitewide", "audit H2s against keywords", "page-level SEO/GEO audit", "implement onpage fixes", "apply audit fixes", "cannibalisation cull", "merge duplicate pages", "301 the loser page", "AI crawlability check". Foundation skill — runs DOWNSTREAM of `str-keyword-strategy` + `str-authority-strategy` (both REQUIRED). Used adjacent to `str-internal-links` (consumes its per-page link plan), `str-cro-audit` (orthogonal — conversion not search), `str-ai-seo` / `str-ai-seo-local` (sitewide audit; this skill is page-level). Does NOT trigger for: keyword research (use `str-keyword-strategy`), authority/backlink strategy (use `str-authority-strategy`), conversion audits (use `str-cro-audit`), internal-linking-only audits (use `str-internal-links`).
---

# On-Page SEO / GEO / AEO Audit

Per-page audit and apply-fixes skill. Audits every page on the site against the validated foundation docs (target-keywords.md + authority-strategy.md) and the current search landscape, then emits a scored audit plus a per-page fix list with explicit file paths. Apply-fixes mode executes the fixes, including the cannibalisation cull.

This is the **audit-skill pattern** named in `meta-skill-creator`: foundation-doc consumption + per-page structured handoff to apply-mode + a recurring external recency benchmark.

**Landscape authority.** `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (relative to the install root) is the single source of truth for the state of search. Where this skill and that file disagree, that file wins. Only the handful of numbers this skill actually scores against are repeated here; everything else stays there.

**The five landscape facts this skill acts on:**

1. **[S] 73% of sites block AI crawlers somewhere** — robots.txt, CDN, WAF or JS-render dependence (Otterly, 1M+ citations). Highest-return technical item and it costs nothing. This is why crawlability is Pillar 1.
2. **[S] Schema does not lift AI citations.** Ahrefs difference-in-differences, 1,885 treated pages vs 4,000 matched controls, published 2026-05-11: AI Overviews −4.6%, AI Mode +2.4%, ChatGPT +2.2%. Schema is scored for correctness and entity binding only, never as a citation lever.
3. **[S] Word count is irrelevant.** Ahrefs, 174,048 pages: correlation with AI Overview citation is 0.04. Word-count targets are replaced by fan-out coverage.
4. **[P] FAQ rich results are gone.** Deprecation notice 2026-05-07, features removed June 2026, Search Console API data removed August 2026. FAQPage markup stays valid and earns nothing.
5. **[P] Freshness feeds retrieval.** Google's RAG "relies on our core Search ranking systems to retrieve relevant, up-to-date web pages," and [S] AI-cited content is 25.7% fresher on average. A timestamp bump is not an update.

Confidence keys **[P]** primary documentation, **[S]** named study with a sample, **[U]** unverified. Any statistic carried into a client-facing deliverable keeps its label.

## Outcome

**Produces:** Scored audit report saved to `projects/str-onpage-audit/{YYYY-MM-DD}_{site-name}-audit.md`.

Includes:
- Blocking-gate results (homograph, doorway, incentivized-review) — a failed gate overrides the score
- Site-wide score (0-100) across 9 audit pillars
- Per-page audit table (one row per page, all 9 pillars scored)
- Per-page fix list with explicit file paths
- Per-page link plan (inbound + outbound + anchor candidates)
- Per-surface success criteria: classic organic, Local Pack, AI Overviews, AI Mode (see Step 2.3)
- Hallucination-correction surface progress (if applicable)
- Cannibalisation cull queue where duplicate pairs are found
- Apply-mode handoff: P1/P2/P3 prioritised fix queue

Always save output to disk. After saving, show the user the full absolute file path, then push the report to Notion — Notion is the Got Moles review mechanism and every deliverable goes there.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/target-keywords.md` | **REQUIRED, full** | Per-page primary keyword, cluster, recommended H1, secondary keywords for H2/H3, brand-disambiguation rules, queries-to-avoid, canonical_facts |
| `brand_context/authority-strategy.md` | **REQUIRED, full** | Per-cluster authority anchors, hallucination-correction matrix, brand defense, multi-location patterns |
| `brand_context/design-system.md` | tokens + image rules | Hero image rules, alt-text patterns, schema conventions |
| `brand_context/positioning.md` | summary | Differentiation messaging audit |
| `brand_context/icp.md` | summary | Audience-language audit |
| `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (install root) | **REQUIRED — §12.2 and §12.9 in full; rest on demand** | Current state of search. Wins over anything written in this skill |
| `context/learnings.md` | `## str-onpage-audit` section | Past audit feedback |

If `target-keywords.md` or `authority-strategy.md` is missing, **stop**. Tell the user to run `str-keyword-strategy` (then `str-authority-strategy`) first. Per `meta-skill-creator` Pre-Scaffold Guardrails: foundation-doc consumption is non-negotiable.

## Skill Relationships

**Upstream (REQUIRED):**
- `str-keyword-strategy` produces target-keywords.md
- `str-authority-strategy` produces authority-strategy.md (depends on target-keywords.md)

**Upstream (recurring benchmark):**
- **DataForSEO AI Optimization API is the primary AI-visibility recency benchmark.** `ai_optimization/llm_mentions` for brand and domain mentions with sentiment and source references, `ai_optimization/llm_responses` for structured answers to a fixed prompt set. Run through the shared client. See Data Sources below.
- Pixelmojo Radar AI Visibility Report (`~/Downloads/ai-visibility-report-{domain}-{date}.json`) — **OPTIONAL**. Ingest one if a fresh report happens to be present. Never gate the audit on it, and never flag its absence as a blocker. The old 30-day freshness gate silently failed for months because nobody owned the re-run.

**Adjacent (read for cross-reference):**
- `str-internal-links` — its per-page link plan (Step 9 deliverable) is the inbound/outbound source of truth. If a recent str-internal-links audit exists, ingest it rather than re-deriving.
- `str-ai-seo` / `str-ai-seo-local` — sitewide audit pillars; this skill is page-level. Read latest sitewide audit for context.
- `str-cro-audit` — orthogonal (conversion not search). Some overlap on Core Web Vitals + image rules; defer to str-cro-audit on conversion concerns.

**Downstream:**
- Build tasks — fix list drives direct code changes
- `mkt-authority-content` — answer-first, fan-out coverage and disambiguation rewrites on informational and blog pages
- `ops-blog-pipeline` — blog-post fixes that need a re-publish cycle
- `ops-cms-content` — schema fixes + meta tag updates surface here; CMS content skill executes

No copywriting skill is installed in this workspace. Route informational prose rewrites to `mkt-authority-content`, or write commercial-page copy here directly and run `tool-humanizer` before commit.

**Trigger boundaries:**
- "audit conversion" / "CRO audit" → `str-cro-audit`
- "internal link audit only" → `str-internal-links`
- "sitewide AEO score" → `str-ai-seo-local` (Got Moles) or `str-ai-seo` (others)
- "build a keyword strategy" → `str-keyword-strategy`

## Data Sources

Shared DataForSEO v3 client, root-owned so `update-clients.sh` never wipes it:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' [--out file] [--raw] [--dry]
```

Run it **from `clients/got-moles/`** so this client's environment file wins. Credentials resolve automatically. Never print or quote credential values. Every call logs endpoint, status and cost to `.dataforseo-usage.log` in the working directory.

**Spend guard (mandatory).** The account is pay-as-you-go on a small balance. Before any paid call:

1. Run it with `--dry` first and check the payload shape. `--dry` costs nothing.
2. Put an explicit `limit` on every DataForSEO Labs call. Never omit it.
3. `instant_pages`, `content_parsing` and `lighthouse` are billed per URL. Audit Tier 1 first, extend to Tier 2 and 3 only once the run is confirmed useful.
4. Read the running total in `.dataforseo-usage.log` before a sitewide sweep, and state the expected call count to the user before firing it.
5. Any sweep over 40 URLs needs explicit user confirmation. Unit prices are in the landscape file §10.

**Verified payloads.** All `--dry`-tested 2026-09-02.

Rendered page, meta, headings, canonical, schema presence and load timing. This is the backstop for the bespoke extractor:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/instant_pages \
  '{"url":"https://got-moles.com/","enable_javascript":true,"enable_browser_rendering":true,"load_resources":true}' \
  --out projects/str-onpage-audit/data/home-instant.json
```

Per-section parsed content. This makes answer-first block scoring measurable instead of eyeballed:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/content_parsing/live \
  '{"url":"https://got-moles.com/mole-control-everett-wa/","markdown_view":true}' \
  --out projects/str-onpage-audit/data/everett-content.json
```

Core Web Vitals, mobile:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/lighthouse/live/json \
  '{"url":"https://got-moles.com/","for_mobile":true,"categories":["performance"]}' \
  --out projects/str-onpage-audit/data/home-lighthouse.json
```

AI-visibility recency benchmark. Brand mentions with sentiment and source references:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/llm_mentions/live \
  '{"keyword":"Got Moles","llm_name":"chat_gpt","date_from":"2026-08-01"}' \
  --out projects/str-onpage-audit/data/mentions-chatgpt.json
```

Entity-resolution probe for the homograph gate. Ask an engine directly and read which entity comes back:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/llm_responses/live \
  '{"user_prompt":"Who removes lawn moles in Everett, Washington?","llm_name":"gemini","model_name":"gemini-2.5-pro","web_search":true}' \
  --out projects/str-onpage-audit/data/entity-everett.json
```

Cannibalisation evidence. Ranked keywords for the domain, always with a `limit`:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs dataforseo_labs/google/ranked_keywords/live \
  '{"target":"got-moles.com","location_code":2840,"language_code":"en","limit":1000}' \
  --out projects/str-onpage-audit/data/ranked.json
```

Location code 2840 is the United States. Language code is `en`.

**Other sources.**

- **Google Search Console**, domain property `sc-domain:got-moles.com`, read via `.claude/skills/ops-got-moles-ads/scripts/_gsc-status.mjs` and `_gsc-today.mjs`. The URL-prefix property is unverified — never use it. **Caution: both scripts still hold hardcoded OAuth credentials and are gitignored pending a scrub into the environment file. Nobody other than Roy runs them until that scrub and the token rotation are done.**
- **Search Console Generative AI report** is UI-only. Impressions only, no clicks, no click-through rate, no queries, no API, data starting 2026-05-18 with no backfill. Any AI-surface impression figure in this audit is a manual read and must be labeled as one.
- **Bing Webmaster Tools AI Performance** (grounding queries) is UI-only. Accept it as a manual paste when the user has it.
- **GA4** cannot attribute AI Mode or AI Overviews traffic. Those links carry `noreferrer` and the sessions land in `google / organic`. Never promise AI Mode attribution in this audit.
- **WebSearch and live SERP checks** stay valid as spot-checks, never as the primary data source.

## Refresh

Quarterly default; trigger-based on:
- New DataForSEO AI Optimization benchmark run, or a fresh third-party AEO audit if one arrives
- target-keywords.md or authority-strategy.md refresh
- A named Google core or spam update
- Post-deploy verification of any major page batch
- Hallucination-correction matrix re-test cycle (re-test dates per authority-strategy Section 8.4)

## Before You Start

Confirm scope:
1. **Run mode:** "Full sitewide audit, single-page audit, or apply-fixes from existing audit?"
2. **Scope filter:** "All pages, Tier 1 only (authority pages from target-keywords.md), or specific URL list?"
3. **Verify foundation docs exist** — if either target-keywords.md or authority-strategy.md is missing, stop and instruct user to run upstream skills first.
4. **Re-audit gate (Rule H below):** If this run is a *post-fix re-audit* (not a fresh audit), explicitly state so. Re-audits MUST run the full evidence chain. No projecting pillar lifts from "fix landed = +X". If any internal monologue says "estimated score lift" / "should clear ≥90 with these fixes" — stop and run the actual extractor.
5. **Page Structure Checklist gate (apply-fixes mode only):** Before any `pages-data.ts` insert/edit, run all 7 rules of `brand_context/design-system.md` Page Structure Checklist (line 625-637 in Got Moles). Treat the checklist as a gate, not a reference. The Section component's background enum is NOT a menu of valid options — the checklist explicitly bans `cream`, `blue` (standalone), and mid-page `gradient`. Verify each insert against all 7 rules before code change.
6. **Visual verification commitment:** Live HTML correctness is not visual correctness. Plan a browser-render check after every commit, not just an extractor probe. Test pages at `/test/{name}` exist for this purpose on the Got Moles site.
7. **Landscape check:** confirm `search-landscape-2026-09.md` has been read this run. Its `last_updated` date is the recency anchor recorded in the audit frontmatter. If it is more than a quarter old, say so in the report rather than auditing against stale conditions.
8. **Blocking gates:** state up front that the homograph gate, the doorway-page gate and the incentivized-review gate run before scoring, and that a gate failure overrides the pillar score for that page.
9. **Spend confirmation:** if the run will make paid DataForSEO calls, state the endpoint list and expected call count before firing. Over 40 URLs needs explicit confirmation.

## Step 0: Foundation + Benchmark Load

Read in this order — don't skip any:

1. **Landscape file** — `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`, §12.2 and §12.9 in full. It supersedes anything in this skill that contradicts it.
2. **Foundation docs** — target-keywords.md (full), authority-strategy.md (full), design-system.md, positioning.md (summary), icp.md (summary). The seven cluster ids are the only taxonomy: mole-control, biology, safety, cost-value, seasonal, diy-vs-pro, location-services.
3. **AI-visibility recency benchmark** — run the DataForSEO AI Optimization calls in Data Sources above against the current prompt set, or ingest a fresh Pixelmojo report if one is present. If neither is available, record "no recency benchmark this run" in the frontmatter and continue. This never blocks the audit.
4. **Fan-out sub-query set** — read the latest `projects/str-question-harvester/` output for the per-primary-keyword fan-out sub-queries. These are what Pillar 3 scores coverage against. If none exists, derive a provisional set from the cluster query tables in target-keywords.md and flag it as provisional.
5. **Cannibalisation inventory** — read target-keywords.md cannibalisation notes and ingest the canonical-versus-loser URL pairs. These feed the cull procedure at the bottom of this skill.
6. **Adjacent audit context** — read the newest `projects/str-internal-links/{YYYY-MM-DD}_{site-name}-audit.md` and take its **`Per-Page Link Plan`** section as the inbound/outbound source of truth for Pillar 2.5. Also check `projects/str-ai-seo-local/` for recent sitewide context. Don't re-derive what was audited recently.
7. **Past learnings** — `context/learnings.md`, `## str-onpage-audit` section.

Output a brief status before starting: "Landscape file dated Z loaded. X clusters from target-keywords.md, Y authority anchors from authority-strategy.md, fan-out set for N primary keywords, M adjacent audits found, recency benchmark: {DataForSEO run date | Pixelmojo date | none}."

## Step 1: Discover Pages

Scan the codebase to enumerate every page that needs auditing.

For Next.js / Payload sites (the Got Moles stack):
- `src/app/**/page.tsx` — every route
- `src/lib/pages-data.ts` — block-based CMS pages
- `src/lib/blog-data.ts` — blog posts
- `src/lib/city-data.ts` (or equivalent) — programmatic city/location pages
- Dynamic route enumeration via `generateStaticParams`

Cross-reference the page list against the target-keywords.md Tier 1/2/3 mapping. Flag any page on the site NOT mapped in target-keywords.md, and any page in target-keywords.md NOT live on the site. Both are coverage gaps.

## Step 1.5: Blocking Gates

Three gates run before any pillar is scored. A gate failure is recorded as **BLOCKED** on that page and carries into the fix queue as P1 regardless of the numeric score. A page can score 92 and still be blocked.

### Gate 1 — Homograph (every page)

"Mole" resolves to a skin lesion, a burrowing mammal, a spy, a chemistry unit and a Mexican sauce, and the skin-mole sense dominates the training distribution. This is popularity bias, not just ambiguity, so the defense has to be explicit.

**The test.** Fail the page if "mole" appears in the `<title>`, the H1, any H2, or the first paragraph **without a disambiguating token in the same sentence**. Accepted tokens: lawn, yard, turf, garden, ground, burrow, tunnel, molehill, trapping, pest, exterminator, *Scapanus*, ground mole, or a Western Washington geographic modifier.

This is the on-page half of target-keywords.md Brand-Disambiguation Rule 1. Anchor text is covered separately in Pillar 5.

**Optional evidence.** Probe entity resolution directly with `ai_optimization/llm_responses` (payload in Data Sources). If an engine answers "who removes lawn moles in {city}" with dermatology content, record it as evidence, not as a separate score.

**[U] on every specific tactic here.** No controlled study exists. The underlying mechanism, candidate generation followed by context-weighted entity linking with popularity bias, is standard natural-language processing and is safe to rely on. Label it that way in client-facing output.

### Gate 2 — Doorway page (city pages only)

**The test.** Strip the city name from the title, the H1 and the body. If what remains is indistinguishable from any other city page, the page fails.

Google's spam policies still name pages targeted at different cities that funnel visitors to the same destination as doorway abuse, and scaled content abuse covers many pages generated primarily to manipulate rankings regardless of whether a human or a model wrote them. A templated ~90-city build sits closest to those two policies.

**[U, practitioner consensus] The 2026 failure mode is silent.** Manual actions still happen for egregious cases, but the common outcome for thin location pages is quiet suppression, filtering, or grouping so only one representative page shows. **Nothing appears in Search Console.** This audit is the only place it gets caught, which is why the gate is blocking rather than a scored signal.

**What passing looks like.** Per-city substance: local mole species and soil conditions, actual jobs done in that city, named neighborhoods, city-specific reviews, real photography. [S] Whitespark's top local organic factor is dedicated service pages, so the defense is per-city substance, not per-city templating.

Record the strip-test result verbatim in the audit: the remaining text after removing the city name, and the page it most closely matches.

### Gate 3 — Incentivized reviews (any page carrying Review or AggregateRating markup)

**[P]** Fake or undisclosed incentivized reviews became a named violation in the review-snippet structured-data guidelines on 2026-07-24, and the exposure is a manual action against the site.

**The test.** For any page emitting `Review` or `AggregateRating`, confirm the underlying reviews are genuine and that any incentive is disclosed. Also confirm the review-collection process behind them complies with the 2026-04-17 Google Business Profile policy: no staff review quotas, no asking customers to name a technician, no rewards tied to leaving a review.

If review provenance cannot be confirmed, mark the gate **UNVERIFIED** and raise it with the user. Do not quietly pass it, and do not strip the markup unilaterally.

## Step 2: Per-Page Audit (9 Pillars)

For each page in scope, run all 9 pillars. Score 0/0.5/1 per signal, then sum to a per-page score normalised to 100. Full rubric in `references/audit-checklist.md`.

Weights, highest first: Content shape 25, Crawlability 15, Headings 15, Meta 10, Internal links 10, Schema 10, Freshness 5, E-E-A-T 5, Images and performance 5.

### 2.1 AI + Search Crawlability (Pillar weight 15%) — the top check

**[S] 73% of websites have crawlability issues preventing AI access** (Otterly, 1M+ citations, January to February 2026). Robots.txt blocks, CDN restrictions and JavaScript-rendering requirements are the named causes. It is the highest-return technical item in the stack and it costs nothing, so it runs first. Every other pillar is worthless on a page an engine cannot fetch.

**Named user agents to verify explicitly in robots.txt:**

| Agent | Owner | Purpose | Policy |
|---|---|---|---|
| `Googlebot` | Google | Index and AI Overviews / AI Mode eligibility | Allow. Non-negotiable |
| `Google-Extended` | Google | Gemini **training only** | Allow. **[P] Blocking it does not remove pages from AI Overviews or AI Mode** and does not affect ranking |
| `Bingbot` | Microsoft | Bing index, prerequisite for Copilot citation | Allow |
| `OAI-SearchBot` | OpenAI | ChatGPT search | Allow |
| `GPTBot` | OpenAI | Training | Recommend allow |
| `ChatGPT-User` | OpenAI | User-initiated fetch | Allow |
| `PerplexityBot` | Perplexity | Search, does not train | Allow |
| `Perplexity-User` | Perplexity | User-initiated fetch | Allow |
| `Claude-SearchBot` | Anthropic | Search quality | Allow |
| `ClaudeBot` | Anthropic | Training | Recommend allow |
| `Google-Agent` | Google | [U] Added 2026-03-20 for agentic browsing; reported to ignore robots.txt by design. Secondary sources only | Note, do not score |

The Got Moles site already allows all of these. Confirm it every run rather than assuming, because the failure mode is invisible.

**Signals scored:**

- **robots.txt allows every agent above** — verify the live file, not a remembered state
- **CDN and WAF rules do not block them** — this is where blocks actually live. Check Vercel firewall rules, any bot-management setting, and rate limits. **Verify against the published IP ranges** each vendor documents, not just the user-agent string, because a WAF matching on ASN or IP will block an agent whose user-agent string is allowed
- **No JS-render dependence for primary content** — the answer-first block, H1, H2s and body text must be present in the raw HTML response. Compare `on_page/instant_pages` with `enable_javascript: false` against `true`. Any content that only appears in the rendered pass is at risk
- **HTML payload under 2MB** — **[P]** Googlebot fetches the first 2MB of HTML, clarified February 2026. Flag any page over it. Large JavaScript bundles risk incomplete rendering
- **Page is indexed and snippet-eligible** — **[P]** "To be eligible to be shown as a supporting link in AI Overviews or AI Mode, a page must be indexed and eligible to be shown in Google Search with a snippet." Check for `noindex`, `nosnippet`, `data-nosnippet` and restrictive `max-snippet` on content that should be citable
- **Search Console generative AI opt-out is OFF** — **[P]** sites that opt out receive no traffic or impressions from generative AI features, and it applies collectively with no per-feature control. **Never enable it for a local-service site.** This is a site-level check; record it once per audit

**How to verify:** fetch `/robots.txt` directly. Run `on_page/instant_pages` twice, once with JavaScript enabled and once without, and diff the extracted content. Read the hosting firewall configuration in the codebase or the dashboard. Do not infer crawler access from the fact that the site renders in a browser.

### 2.2 Headings + Keyword Alignment (Pillar weight 15%)

- **H1 unique on the page** — exactly one H1
- **H1 matches the recommended H1 from target-keywords.md** — exact phrase or close variant, carrying the primary keyword
- **H1 carries a disambiguation signal** per target-keywords.md Brand-Disambiguation Rule 1 (lawn, yard, exterminator, Washington, city, brand). Note this overlaps Gate 1, which is blocking; scoring it here is the graded version of the same signal
- **H2/H3 carry secondary cluster keywords** — at least two H2/H3 contain secondary keywords from the page's cluster, per the cluster query table
- **H2s map to fan-out sub-queries** — at least half the H2s correspond to a sub-query in the fan-out set for this page's primary keyword
- **No skipped heading levels** — H1 straight to H3 without an H2 fails

### 2.3 Content Shape — Answer-First and Fan-Out Coverage (Pillar weight 25%)

Highest-weight pillar, because passage-level extraction is what decides citation. Rationale sits in the landscape file §5.2 and §2.3.

**Surfaces are distinct. Name the surface for every recommendation in this pillar.**

| Surface | What wins it | Success criterion for this audit |
|---|---|---|
| **Classic organic** | Conventional relevance and quality | Rank for the primary keyword |
| **Local Pack** | Google Business Profile, proximity, category. **[S]** fires on ~93% of explicitly transactional local queries | Not won on the page. Route to `str-ai-seo-local` |
| **Google AI Overviews** | **Organic-rank coupled.** [S] seoClarity, 432,000 keywords: 97% of AI Overviews cite at least one source from the organic top 20. [S] Whitespark: a top-10 rank gives only ~25% chance of appearing | Rank in the top 20 for the primary keyword **and** carry a liftable answer block |
| **Google AI Mode** | **Fan-out coupled.** [P] Google issues "multiple related searches across subtopics and data sources" and retrieves against each. Rank on the head term matters much less | Cover the fan-out sub-query set. Every sub-answer present on the page or one hop away |
| **ChatGPT / Perplexity / Gemini / Copilot** | Same content shape, different indexes. Bing indexation is a hard prerequisite for Copilot | Cited in the recency-benchmark prompt set |

**[S] Winning one surface substantially predicts the others** — Ahrefs cross-platform overlap: AI Overviews to AI Mode 0.821, AI Overviews to ChatGPT 0.749. Run one coherent program, not per-engine programs.

**Do not repeat the older "top-10 to AI-citation overlap collapsed from 76% to 17–38%" line.** It is single-source, it conflicts with the larger-sample seoClarity finding for AI Overviews specifically, and the landscape file resolves it as: AI Overviews stay tightly coupled to organic rank, AI Mode is loosely coupled via fan-out.

**Signals scored:**

- **Answer-first block under the H1** — a **40–60-word** self-contained direct answer to the page's primary question, in the searcher's own terms. **The test: does this paragraph survive being lifted out of the page and read correctly with zero surrounding context.** If it needs the sentence before it, it fails
- **Every H2 is a question or a direct topic, followed immediately by its own self-contained answer block of roughly 40–80 words**, then supporting detail. Same lift-out test per section. Encode the pattern, not the numbers — **[U]** on the exact word counts circulating in trade content; the word ranges here are a working shape, not a measured threshold
- **One fact per sentence in every answer block.** No hedged compound sentences, no "it depends, but generally". Hedged compounds do not get quoted. Score the first block of each section
- **Fan-out coverage** — the page answers the sub-questions a fan-out would generate for its primary keyword. Score against the fan-out set loaded in Step 0. Missing sub-answers are listed by name in the fix list
- **No word-count target.** **[S]** Ahrefs, 174,048 pages: correlation between word count and AI Overview citation is **0.04**. Never score a page for being short or long. Score it for coverage
- **At least one extractable structured asset** — a comparison table, numbered steps, or a stat block. [S] Listicles are the single most-cited format at ~21% of all citations (arXiv 2606.20065, 100,000+ prompt responses, March to May 2026). Cost pages get a price table, myth pages a works-versus-doesn't table, seasonal pages a month table, identification pages a comparison table
- **Cited, attributable specifics** — at least one specific, attributable, quotable claim per major section: a number, a local specific, a named method, with inline attribution to `.gov` / `.edu` / WSU Extension or Got Moles' own job data. Generic advice does not get quoted. The old "one statistic per 150–200 words" cadence and the "+40% generative visibility" figure are retired as scored rules; the underlying principle stands
- **Verified-fact callouts** — canonical_facts from target-keywords.md (founding year 2017, pricing, six counties, 92+ communities, nearly 5,000 properties, 219+ five-star Google reviews) where applicable. Ties to the hallucination-correction matrix in authority-strategy.md Section 8.4
- **Local specificity on city pages** — a generic answer with the city name swapped in is not a local answer. Engines cite chunks that name the place and say something true about it
- **No queries-to-avoid in title, H1 or FAQ** — verify against the target-keywords.md Brand-Disambiguation Strategy
- **No visible TL;DR or "AI summary" boxes** — answer-first prose and semantic HTML only. Established Got Moles pattern: the answer engineering is invisible infrastructure
- **No AI-specific rewriting** — **[P]** Google's generative-AI guidance names AI-specific language, content chunking into tiny pieces, machine-readable AI text files and "AEO/GEO hacks" as unnecessary. If a recommendation only makes sense for a machine reader, it does not belong in this audit

**How to verify:** `on_page/content_parsing/live` returns per-section text, which makes the answer-block and one-fact-per-sentence checks measurable rather than eyeballed. Fall back to raw-HTML extraction when the endpoint is unavailable or the spend guard says no.

### 2.4 Meta + Canonical (Pillar weight 10%)

- **Title tag 50-60 chars**, carries the primary keyword and the brand
- **Meta description 150-160 chars**, carries the primary keyword and a clear value proposition
- **Canonical tag** points to the canonical URL. Critical against the cannibalisation inventory
- **Open Graph tags** present: og:title, og:description, og:image
- **Twitter card** tags present
- **og:image** present at 1200x630

### 2.5 Internal Links — Per-Page Link Plan (Pillar weight 10%)

Read from the `str-internal-links` audit if one is recent; otherwise derive.

**Contract with `str-internal-links`.** That skill writes `projects/str-internal-links/{YYYY-MM-DD}_{site-name}-audit.md` with a **`## Per-Page Link Plan`** section, and that section is the inbound/outbound source of truth consumed **here, in Pillar 2.5**. Both the filename pattern and that heading are fixed names looked up by name, so neither gets renamed casually. It was previously mis-cited in both skills as "Step 4 of that skill's rubric"; there is no Step 4 handoff. Detection of cannibalisation stays in `str-internal-links`; execution is the **Cannibalisation Cull — Apply-Fixes Procedure** section of this skill (steps C1 to C5).

**Columns to read from that table (as of 2026-09-02):** inbound, outbound, anchor candidates, plus **Cluster**, **Surface**, and **Fan-out sub-queries served**.

- **Cluster** must match this page's cluster in target-keywords.md. A mismatch is a mapping error, not a linking error — fix it in the foundation doc first.
- **Surface** drives the routing check below. It is one of the named surfaces: classic organic, Local Pack, AI Overviews, AI Mode.
- **Fan-out sub-queries served** is the input to the fan-out reachability signal. Use it rather than re-deriving reachability from the codebase.

**[P] Google names internal linking as effective for AI features** in its generative-AI guidance, so cite Google rather than inference when this comes up.

- **Inbound link count** — at least two inbound links from related cluster pages
- **Outbound link count** — links to at least one related cluster page plus the parent service or pillar
- **Fan-out reachability** — every fan-out sub-answer not on this page is reachable in one hop from it. Read this from the `Fan-out sub-queries served` column of the link plan
- **Informational-to-transactional routing** — informational pages link into the transactional local pages they support. Read the `Surface` column: the two win on different surfaces, and the informational pages are the ones AI Overviews cite. An informational page with no route to a transactional page is a gap even when its own link counts pass
- **Anchor diversity** — no single anchor phrase dominates inbound, per target-keywords.md Rule 5. **[S]** Branded anchors correlate 0.511–0.628 with AI visibility, above Domain Rating, so a meaningful share of anchors should carry the brand name
- **Disambiguation guard on anchors** — anchors carry a lawn / exterminator / geo signal where the destination targets an ambiguous head term. Anchor text `mole removal` alone is forbidden
- **No links to cannibalisation losers** — every internal link resolves to the canonical version with no 301 hop
- **Hub-spoke alignment** — Tier 3 spokes link UP to the cluster pillar; Tier 2 hubs link to relevant Tier 1 and down to their Tier 3
- **City pages link up and out, never sideways** — city pages link up to service and informational hubs and out to genuinely local proof. A ring of city-to-city links covers no fan-out and reads as a doorway network

Output: a per-page link plan row in the audit — inbound present and missing, outbound present and missing, anchor candidates from the cluster plus Rule 5, and the cluster, surface and fan-out sub-queries carried through from the source table so the two audits reconcile line for line.

### 2.6 Schema — Correctness and Entity Binding (Pillar weight 10%)

**Schema is not an AI-citation lever.** **[S]** Ahrefs ran a difference-in-differences test, 1,885 pages adding JSON-LD against 4,000 matched controls, published 2026-05-11: AI Overviews **−4.6%**, AI Mode **+2.4%**, ChatGPT **+2.2%**. **[P]** Google: "Structured data isn't required for generative AI search, and there's no special schema.org markup you need to add."

The authors' own caveats are worth carrying: treated pages already had 100+ citations, so schema may still aid discoverability for pages with no visibility at all; all schema types were pooled; the windows were 30 days; JSON-LD only; and the effects are not fully separable from other simultaneous page changes.

**What schema is still scored for:** rich results that still exist, entity binding, correctness, and non-Google systems that consume it. **Never present schema as an AI-citation tactic in client-facing output.** Cite the difference-in-differences result when the change is questioned.

**Priority order:** LocalBusiness (most specific subtype) → Service → Organization with the `sameAs` spine and `knowsAbout` → BreadcrumbList → Article/BlogPosting with `dateModified` → Person for author → Review/AggregateRating, only where reviews are genuine and any incentive is disclosed.

**Signals scored:**

- **Correct schema type for the page** — LocalBusiness subtype on the homepage and location pages, Service on service pages, Article or BlogPosting on blog posts, AboutPage on /about/
- **Organization `sameAs` spine** — identical across Google Business Profile, Yelp, BBB, Angi, Facebook, LinkedIn and YouTube, plus `knowsAbout` binding the brand to the pest-control sense of "mole". **This is the one place schema still earns its keep**, because it is the entity-disambiguation defense
- **Referenced `@id` pattern** — sitewide entities (Organization, LocalBusiness) defined ONCE and referenced everywhere as `{ "@id": "https://example.com/#organization" }`, never embedded inline copies. Embedded duplicates trigger Google "could not pick canonical entity" warnings and the fields drift apart
- **BreadcrumbList** on every non-root page
- **Article or BlogPosting with `dateModified`** as well as `datePublished`
- **Person schema** on author bylines with `worksFor` and `sameAs`
- **Structured data matches visible page content** — **[P]** a hard Google requirement. Markup asserting a price, rating or date the page does not show is a violation, not an optimization
- **No malformed JSON-LD** — validates in the Rich Results Test
- **Review / AggregateRating provenance** — see Gate 3. Genuine and disclosed, or it does not ship

**Not scored, deliberately:**

- **FAQPage.** **[P]** FAQ rich results are gone: deprecation notice 2026-05-07, search appearance and Rich Results Test support removed June 2026, Search Console API data removed August 2026. FAQPage markup remains valid schema.org and earns nothing. **Keep the Q&A content shape, which is what Pillar 2.3 scores. Do not add FAQPage as a deliverable, do not score it, and do not recommend removing existing markup** — ripping it out is churn with no upside
- **Speakable.** **Optional.** Never a scored signal and never above "optional" in any recommendation. The old framing of it as a high-impact action came from a single vendor report and does not survive the schema evidence above
- **llms.txt, AI-specific Markdown mirrors, AI markup, content chunking.** Removed from this audit entirely, as recommendations and as scored items. **[P]** Google, 2026-06-15: "llms.txt files aren't required for Google Search visibility or rankings." No engine documents consuming it. **If one already exists on the site, leave it** — do not spend a change on removing it

**How to verify:** WebFetch's text summary STRIPS `<script type="application/ld+json">` blocks. Extract raw HTML instead — either `on_page/instant_pages`, or the one-shot Node script template in `references/audit-checklist.md` § Live verification. Never trust a WebFetch summary for a schema audit.

### 2.7 Visible Freshness (Pillar weight 5%)

**A timestamp bump is not an update.** **[S]** AI-cited content is 25.7% fresher on average, roughly a 368-day gap (Ahrefs), and 65% of AI bot hits target content published in the past year (Seer Interactive, October 2025). **[P]** Google's retrieval "relies on our core Search ranking systems to retrieve relevant, up-to-date web pages."

- **`dateModified` reflects a substantive change** — at least one new fact, source or example in a major section since the previous value. A page whose `dateModified` moved with no content delta scores 0 on this signal, not 1
- **`Last-Modified` HTTP header** returned by the server and consistent with `dateModified`
- **Sitemap `lastmod`** accurate for the page and consistent with both of the above
- **Visible publish and updated dates** in the page UI
- **12-month untouched flag** — flag any page with no substantive content change in 12 months, regardless of what the timestamps say. These go into the refresh queue, not the fix queue

### 2.8 E-E-A-T (Pillar weight 5%)

**[P]** The September 2025 Quality Rater Guidelines edition is still current; no 2026 revision found. The Experience criterion still rewards demonstrable first-hand work.

- **Author byline** present on Article-typed pages
- **Byline links to a Person schema page** (for example /author/spencer/)
- **Person schema `sameAs`** populated with real professional profiles
- **Outbound to an authoritative source** — at least one link to a Tier 1 authority anchor from authority-strategy.md for the relevant cluster
- **Founder or named-technician first-hand detail** on relevant pages, per authority-strategy.md Section 5 co-citation. Real jobs, real observations, real photography

### 2.9 Images + Performance (Pillar weight 5%)

- **Alt text** present and descriptive, not stuffed. For sitewide auto-generated alts (the HeroBlock fallback pattern `{heading} — {suffix}`), check for redundant geo or service repetition when the heading already carries those signals
- **Explicit width/height OR an aspect-ratio container** for layout stability. A Next.js `<Image fill>` inside an `aspect-[3/4]` parent counts as compliant, because the parent reserves the space
- **WebP format**
- **Hero image** has `priority` in Next.js, which emits `fetchpriority="high"` and `loading="eager"` at runtime
- **Below-fold images** have `loading="lazy"` — the Next.js `<Image>` default when no `priority` prop
- **og:image** matches the page topic
- **Core Web Vitals** — **[P]** unchanged at LCP, INP and CLS. No new metric and no INP replacement announced. Thresholds: LCP under 2.5s, INP under 200ms, CLS under 0.1. **Weight INP highest**: **[S]** it is the most commonly failed metric, with around 43% of sites over the 200ms threshold. Pull the numbers from `on_page/lighthouse/live/json` rather than deferring to `str-cro-audit`
- **JavaScript payload** — flag any page whose HTML exceeds 2MB or whose critical rendering depends on bundles beyond Googlebot's fetch limits. Cross-references the render check in Pillar 2.1

**How to verify (Next.js sites):** WebFetch parsers commonly miss `next/image` runtime-emitted attributes (`fetchpriority`, `loading`, dimensions in `fill` mode). Cross-check the component source — read `src/components/blocks/HeroBlock.tsx`, `TeamCardsBlock.tsx` and any custom hero — to confirm `priority`, `fill`, `sizes` and the `aspect-*` parent. WebFetch image audits alone undercount and produce false negatives.

## Step 3: Score + Prioritise

### Per-page score

Sum the 9 pillars to a per-page score out of 100. Categorise:
- **Excellent (90-100)** — defend
- **Good (75-89)** — minor lifts
- **Needs work (60-74)** — P2 fixes
- **Poor (under 60)** — P1 fixes

**A blocked page is not an "excellent" page.** Any page failing Gate 1, 2 or 3 carries a `BLOCKED` flag next to its score and enters the fix queue at P1 whatever the number says. Report the score and the gate separately; never average them together.

### Sitewide score

Average per-page across the site, weighted by Tier (Tier 1 pages weighted 3×, Tier 2 weighted 2×, Tier 3 weighted 1×).

### Prioritised fix list

Generate P1/P2/P3 fix queue:
- **P1** — any blocked page (Gate 1, 2 or 3); any crawlability failure in Pillar 2.1; Tier 1 pages scoring under 75; hallucination-correction surface gaps; broken canonical or cannibalisation losers
- **P2** — Tier 2 pages scoring under 75; H2/H3 secondary-keyword gaps; answer-first and fan-out coverage gaps on cluster pillar pages; INP over 200ms on a Tier 1 or 2 page
- **P3** — Tier 3 pages; minor meta and image hygiene; schema correctness tidy-ups

Each fix item must include: page, pillar or gate, specific gap, recommended fix, target surface (classic organic, Local Pack, AI Overviews, AI Mode, or answer engines), and the file path to edit.

**Rank by impact, risk, dependency order and reversibility. Never attach a time or effort estimate to a fix.**

## Step 4: Save Audit Report

Save to `projects/str-onpage-audit/{YYYY-MM-DD}_{site-name}-audit.md` with frontmatter:

```yaml
---
site: [domain]
date: [YYYY-MM-DD]
sitewide_score: [X/100]
pages_audited: [N]
pages_blocked: [N]
gate_failures:
  homograph: [N]
  doorway: [N]
  incentivized_review: [N or unverified]
fixes_p1: [count]
fixes_p2: [count]
fixes_p3: [count]
hallucination_correction_progress: [N/M facts corrected]
landscape_file_dated: [YYYY-MM-DD from search-landscape frontmatter]
recency_benchmark: [DataForSEO run date | Pixelmojo report date | none]
dataforseo_calls: [N]
status: draft
---
```

Show the user the full absolute file path. Present a summary: sitewide score, blocked pages, top five P1 fixes, hallucination-correction progress.

Push the report to Notion for review. Notion is the Got Moles review mechanism and Spencer and the team review there, so this happens after every deliverable, not on request. Create the page under the Got Moles project with the Notion MCP tools (`mcp__claude_ai_Notion__notion-create-pages`). No script is needed.

**Confidence labels are mandatory in anything client-facing.** Every statistic carried into the report keeps its `[P]` / `[S]` / `[U]` label per the landscape file's key. Several widely repeated 2026 "facts" did not survive checking, so an unlabeled number in a client document is a defect.

**US English throughout.** Color, customize, organize, neighborhood, specialized.

**Per-page report block structure (mandatory — Rule G):**

```markdown
## {Page URL}

### Foundation-doc lookup (Rule F)
| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | … | … | ✅/❌ |
| Recommended H1 | … | … | exact/close/mismatch |
| Disambiguation signal | Rule 1: {signals} | present? | ✅/❌ |
| Secondary cluster KWs | {KW1}, {KW2}, … | {H2/H3 carrying each} | ✅/❌/MISSING |
| Queries-to-avoid | {list} | scan result | ✅ none / ❌ {violations} |

### Live verification (Rule C)
- Schema: {N} JSON-LD blocks parsed via raw HTML extractor: {types}
- Images: component source read: {component paths}; `priority`/`fill`/`aspect-*` confirmed
- Internal links: {N} via raw HTML count (WebFetch reported {M})

### Three-Layer SoT (Rule A)
- Live render: {hash or last-deploy timestamp}
- HEAD: {commit short SHA}
- Working tree: clean / divergent ({list files})
- CMS reseed: {date} or N/A

### Blocking gates (Step 1.5)
| Gate | Result | Evidence |
|---|---|---|
| Homograph | PASS / **FAIL** | offending element + the sentence, or "no undisambiguated 'mole' in title/H1/H2/first para" |
| Doorway (city pages) | PASS / **FAIL** / N/A | the city-stripped text, and the page it most closely matches |
| Incentivized review | PASS / **FAIL** / UNVERIFIED / N/A | Review or AggregateRating nodes found, provenance confirmed how |

### Pillar scores
| # | Pillar | Wt | Score | Notes |
|---|---|---|---|---|
| 1 | AI + search crawlability | 15% | … | robots + WAF + JS-render diff |
| 2 | Headings | 15% | … | references Foundation-doc row 2 |
| 3 | Content shape (answer-first + fan-out) | 25% | … | sub-queries covered / total |
| 4 | Meta + canonical | 10% | … | … |
| 5 | Internal links | 10% | … | … |
| 6 | Schema (correctness + entity binding) | 10% | … | … |
| 7 | Visible freshness | 5% | … | … |
| 8 | E-E-A-T | 5% | … | … |
| 9 | Images + performance | 5% | … | LCP / INP / CLS |

### Surface targets
| Surface | Target | Current | Gap |
|---|---|---|---|
| Classic organic | rank for {primary KW} | … | … |
| AI Overviews | top-20 organic + liftable answer block | … | … |
| AI Mode | fan-out coverage {n}/{m} sub-queries | … | … |
```

If any of the three evidence sections is empty for any audited page, the report is incomplete — return to Step 2 and fill them before saving.

Ask: "Anything missing or scored wrong? Any pages to re-prioritise?" Log feedback to learnings.

## Production Flow Discipline (Mandatory for Live CMS Sites)

Before audit OR apply-fixes on a live production site, internalise these four rules. They are non-negotiable for a site with rank equity at stake. Got Moles holds 635 #1 keywords, so every change here is a change to a live asset.

### Rule A — Three-Layer Source-of-Truth Check

Before scoring any pillar, verify the state across three layers (CMS sites only — pure SSG sites collapse to one):

| Layer | Where | What it represents |
|---|---|---|
| **Live render** | `https://{domain}/{path}` | What users + Googlebot + AI engines actually see |
| **HEAD** | `git show HEAD:{file}` | What's committed but may not be deployed yet |
| **Working tree** | local edits | What's about to be committed (may have regressions) |
| **CMS layer** | Payload / Supabase data | Block-data source of truth on Payload-backed pages — diverges from `pages-data.ts` until re-seed |

If any of these diverge unexpectedly (e.g. working tree shows a regression vs HEAD; HEAD differs from live because re-seed missed; CMS has manual edits not in code), STOP and reconcile before scoring. Audits scored against the wrong layer are worthless.

For Got Moles (Next.js + Payload pattern): the CMS render is authoritative for any page route that calls `getCmsPageContent()`. Code changes to `pages-data.ts` don't affect the live page until `npm run seed -- --reseed {slug}` runs.

### Rule B — The Only Flow per fix tier

For every commit during apply-fixes mode on a CMS-backed live site:

1. **Edit** code (pages-data.ts / page.tsx / schema.tsx / components)
2. **Humanize** any new prose — pass through `tool-humanizer` (deep mode if voice-profile exists). **ZERO em dashes** (humanizer Rule #1) — replace every em dash with full stop, comma, or restructure.
3. **Build** — `npx next build` MUST pass. Don't commit broken builds.
4. **Reseed** if block data changed — `npm run seed -- --reseed {slug}`. Skip only if no CMS-backed change.
5. **Stage selectively** — use backup-checkout-reapply (Rule D) if other uncommitted changes exist
6. **Commit** with descriptive message referencing the audit ID + page + tier
7. **Commit + push** — push to origin for backup; the LIVE site deploys from the ORIGINAL freeflyroy/agent-os repo (client AGENTS.md "Website Deploy" — rewire pending), so shipping means routing the site tree through that deploy repo as an explicit user step. Report unshipped fixes as STAGED, not deployed. Never use the Vercel CLI.
8. **Verify once actually deployed** — after the change ships via the deploy repo and the Vercel build completes, verify via WebFetch + raw HTML extraction (don't trust client-side previews)

Skipping any step = fix doesn't actually deploy or breaks production. Common miss: committing without re-seeding → live site stays unchanged while git looks clean.

### Rule C — Verify Live, Not Just Source

After deploy, verify the actual rendered HTML, not just the source files:

- **Schema:** raw HTML extractor script (template in `references/audit-checklist.md`) or `on_page/instant_pages`. WebFetch summary strips JSON-LD.
- **AI crawlability:** fetch `/robots.txt` directly and diff a JavaScript-enabled against a JavaScript-disabled render. Never infer crawler access from the site rendering in a browser.
- **Headings (H1/H2/H3):** WebFetch is reliable for headings.
- **Images:** WebFetch alt text reliable; `fetchpriority`/`loading`/dimensions check via component source code.
- **Internal links:** WebFetch undercounts city clusters / pricing card grids — count manually from rendered HTML or component source.
- **Visible freshness:** WebFetch reliable for "Last updated {date}" string presence.

**CDN cache awareness:** `x-vercel-cache: HIT` can serve stale static HTML even after a fresh deploy. Cache-bust query strings (`?nocache=...`) don't always invalidate Next.js static prerender cache. Before declaring a deploy "didn't work", probe the data source directly — for Payload+Supabase sites, a small `payload.find()` script confirming CMS state is the ground truth. CDN HITs lie; the database doesn't. Got Moles 2026-05-09: thought a deploy failed because extractor showed 7 FAQ items; Supabase had 11 the whole time, edge cache was just stale. Always probe upstream of the CDN before suspecting build/deploy failure.

### Rule D — Backup-Checkout-Reapply (when uncommitted changes exist)

If other uncommitted work is in the working tree (e.g. homepage hero changes you don't want to ship yet) but your fix touches the same file (e.g. `pages-data.ts`):

```bash
cp src/lib/pages-data.ts /tmp/backup-{tier}.ts            # 1. backup full working tree
git checkout HEAD -- src/lib/pages-data.ts                 # 2. reset to HEAD
# 3. re-apply ONLY your fix's edits (not the unrelated uncommitted work)
git add src/lib/pages-data.ts && git commit -m "..."       # 4. commit clean
cp /tmp/backup-{tier}.ts src/lib/pages-data.ts             # 5. restore working tree
```

This isolates a clean per-tier commit + revert point per fix without losing in-progress unrelated work. Per `feedback_per_page_review_pattern.md`.

### Rule F — Foundation-Doc Keyword Lookup (per page, evidence-bearing)

Before scoring Pillars 2 (Headings), 3 (Content shape), 4 (Meta) and 5 (Internal links) for any page, perform an explicit per-page lookup against `target-keywords.md` and emit the lookup as a table in the audit output. The lookup is the precondition for those pillars — the score is invalid without it. It is also the evidence base for Gate 1, so the gate result cites this table.

**Required lookup row per page:**

| Field | Source in target-keywords.md | Live state | Match? |
|---|---|---|---|
| Primary KW | Tier 1/2/3 row for this URL | extracted from H1/title/body | ✅/❌ |
| Recommended H1 | Tier 1/2/3 row "Recommended H1" column | live H1 text | exact / close-variant / mismatch |
| Disambiguation signal | Brand-Disambiguation Rule 1 (lawn/yard/exterminator/Washington/city/brand) | present in H1? | ✅/❌ |
| Secondary cluster KWs (≥2) | cluster query table for this page's cluster | which H2/H3 carry them | list each KW + its H2/H3 location, or `MISSING` |
| Fan-out sub-queries | question-harvester fan-out set for this primary KW | which H2 answers each | list each covered / `MISSING` |
| Queries-to-avoid | Brand-Disambiguation queries-to-avoid list | scan title/H1/FAQ for any | ✅ none / ❌ list violations |

If the lookup table is absent from the audit output, **the audit is incomplete and must be rerun** — the Pillar 2/3/4/5 scores are not trustworthy without it. This rule exists because foundation-doc grounding is easy to skip silently under context pressure; making the lookup an output artefact makes skipping visible.

### Rule G — Output Must Carry Evidence of Execution

The audit report (`projects/str-onpage-audit/{date}_{site}-audit.md`) must include three evidence sections per page audited. If any section is empty or missing, the audit is incomplete and must be rerun.

| Section | What it proves | What goes in it |
|---|---|---|
| **Foundation-doc lookup** (Rule F) | target-keywords.md was actually consulted | the 6-row lookup table from Rule F |
| **Live verification log** (Rule C) | raw HTML / component code was actually checked, not just WebFetch | the schema-extraction count ("7 JSON-LD blocks parsed: Organization, AboutPage, BreadcrumbList, ..."), component-source paths read for image checks ("HeroBlock.tsx confirmed `priority` prop"), raw-HTML link count when WebFetch undercounts likely |
| **Three-Layer SoT reconciliation** (Rule A) | live vs HEAD vs working tree vs CMS state was reconciled | one-line confirmation per layer ("Live render = HEAD ✅, Working tree = HEAD ✅, CMS reseeded {date} ✅") or note any divergence + how it was resolved |

These sections appear at the top of each per-page audit block, BEFORE the blocking-gate table and the 9-pillar score table. The pillar scores reference these sections (e.g. "Headings: 9.5 — see Foundation-doc lookup row 2 for H1 match").

**Self-check before saving the report:** scan the markdown for the three section headers per page. If any page is missing any of the three, the report is incomplete — go back and fill them. Don't save or present the audit otherwise.

### Rule H — Post-Fix Re-Audits Run Full Rule G Evidence

Re-scoring after fixes land must run the same evidence-bearing process as the original audit. Never project pillar deltas from "this commit shipped therefore Pillar X went up by Y points".

**Why:** Got Moles homepage 2026-05-09. Pre-fix audit ran full Rule G → 58.6/D+. After 5 commits I reported "post-fix score 89.4/B+" — but that 89.4 was projected, not measured. Roy: "please run properly don't just guess." A real Rule G re-audit landed at 89.5/B+ (close on the number, but the WSU outbound placement issue was completely invisible to the projection because projection only counts what code CHANGED, not what code now SAYS in context).

**How to apply:**
- Original audit's Rule G discipline carries forward to ALL re-audits. Same artefacts: foundation-doc lookup table (Rule F), live verification log (Rule C), three-layer SoT reconciliation (Rule A).
- Pillar scores in a re-audit reference live evidence captured DURING that re-audit, not the original audit's evidence + projected deltas.
- Post-fix audit file: separate filename suffix like `_post-fixes.md` or `_re-audit.md`. Same Rule G template as pre-audit file. Same self-check at save.
- If a re-audit feels too cheap to run again because "I just shipped the fixes", that's the exact signal it MUST be run. Discipline is most needed where it feels redundant.

**Trigger phrases that should fire this rule:**
- "Re-score after this commit"
- "Estimated score lift"
- "Projected pillar delta"
- "Running estimate after Commits X+Y"
- "Should clear ≥90 with these fixes"

If any of these appear in self-talk, stop and run the actual extractor. Per `feedback_post_audit_must_be_rule_g_too.md`.

### Rule I — Visual Verification (browser, not just extractor)

Live HTML correctness ≠ visual correctness. The live HTML extractor can confirm semantic shipping (H2 count went up, schema entries added, list markup present) while missing visible regressions (a horizontal seam where two gradients meet, an unexpected line, a broken image, a layout shift).

**Why:** Got Moles homepage 2026-05-09 Commit 7. I declared the commit "verified live" after the extractor confirmed +2 H2s, +5 `<li>`, FAQPage schema picked up new Q. Roy then sent a screenshot showing a visible horizontal line on the page. Diagnosed as a hero-photo / overlay-gradient interaction unrelated to my commit — but I wouldn't have known the question even existed without the screenshot.

**How to apply:**
- After every post-deploy extractor probe: open the page in a browser. Visual scan for: section seams / hairlines, broken layout, missing images, visible whitespace gaps, alignment shifts, mobile-vs-desktop divergence.
- Hard signals to check: any element that "shouldn't be a line but is", any sudden tonal break between adjacent sections, any element that breaks the design-system principle "no decorative dividers" (`design-system.md` line 20-21).
- Test pages live at `/test/{name}` on the Got Moles site for exactly this purpose. Use them.
- A commit is NOT verified until both the extractor AND a visual check have run. If browser access isn't possible in the moment, ask the user to confirm visually before declaring the commit verified.

### Rule J — Page Structure Checklist Is a Gate (not a reference)

Before any insert/edit to `pages-data.ts` (or equivalent block-data file), run all 7 rules of `brand_context/design-system.md` Page Structure Checklist (Got Moles: line 625-637). Treat as a gate. The Section component's `background` enum is NOT a menu of valid options — the checklist explicitly bans `cream`, standalone `blue`, and mid-page `gradient`.

**Got Moles current banned-by-checklist values:**
- Rule 2: `bg='blue'` (standalone) — bans
- Rule 3: `bg='cream'` — bans
- Rule 4: `bg='gradient'` — only on the LAST block

**Why:** Got Moles homepage 2026-05-09 Commit 8 plan. I proposed `bg='cream'` for a comparison-table block to make it "stand out". Roy caught the violation before I shipped it. I had read the Section.tsx enum (5 background options) and treated it as a menu, missing that the design-system Page Structure Checklist bans 3 of those 5.

**How to apply:**
- Before any block insert, write out a 7-rule check inline in your plan (or mentally if confident, but ONLY after running it explicitly the first 3 times you use it on a site).
- If a rule is violated, STOP and redesign before writing code. Don't ship and revert.
- If alternation requires more than 2 dark backgrounds in a row to stay legal, that means the block design (typography, whitespace, content density) needs to do the visual standout — not background swaps.

### Rule E — Lexical Builder Capability Check (Payload + Lexical sites)

Before applying any fix that requires inline links inside `richContent` blocks: check the project's Lexical builder helper (e.g. `parseInline` in `pages-data.ts`).

If the helper supports `**bold**` only and not `[text](url)`: extend it to handle markdown-style link syntax via combined regex — `/\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g` — emitting Lexical link nodes (`type: 'link'`, `version: 2`, `fields: { url, linkType: 'custom', newTab: false }`). Verify the renderer (`RichContentBlock.tsx`) already handles `case 'link':`.

Without this, internal-link fixes either skip or hand-write Lexical JSON — both bad. Skip = Pillar 5 stays at 3/10. Hand-write = brittle, violates Gotcha #8 of the page-build playbook.

## Apply-Fixes Mode

When the user asks to apply / implement / execute fixes from an existing audit, switch to apply-fixes mode. Don't re-audit — execute the fix list.

### A1. Find the audit
Read most recent `projects/str-onpage-audit/{YYYY-MM-DD}_*.md`. Sort newest first. If multiple, ask which.

### A2. Confirm scope
Present P1 fix list. Confirm: "Apply all P1, or filter to specific pages / pillars?"

### A3. Apply fixes per fix-type

| Fix type | Where to edit | Example |
|---|---|---|
| H1 mismatch | `pages-data.ts` (Payload block-based) or `blog-data.ts` (blog posts) | Update `heading` field |
| Meta title/description | `pages-data.ts` (`*Meta` exports) or per-page `generateMetadata()` | Update title/description in `*Meta` object |
| Canonical | Per-page route file | Update canonical in metadata |
| Crawler block | `public/robots.txt`, hosting firewall config | Allow a blocked agent; remove a WAF or rate-limit rule catching a named crawler |
| JS-render dependence | component / route | Move primary content into the server-rendered output |
| Schema gap | `src/lib/schema.tsx` builder + per-page route | Add BreadcrumbList, `sameAs` spine, `knowsAbout`, `dateModified`, or convert an embedded entity to an `@id` reference. **Never add FAQPage or Speakable as a fix** |
| Answer-first block | `pages-data.ts` block content | Add or rewrite the 40-60-word self-contained answer under the H1, and the 40-80-word opener under each H2 |
| Fan-out gap | `pages-data.ts` / `blog-data.ts` | Add the missing sub-answer section, or link to the page that carries it |
| Homograph gate failure | title, H1, H2 or first paragraph | Add a disambiguating token in the same sentence |
| Freshness | Article schema builder, block data, sitemap | Make a substantive content change first, then update `dateModified` and `lastmod` |
| Internal-link rewrite | `pages-data.ts` block bodies + `blog-data.ts` section bodies | Rewrite markdown links |
| Image alt / dimensions | Component or block level | Update `alt` / `width` / `height` props |
| E-E-A-T (author byline) | Blog post template | Add Person schema + byline component |
| dateModified | Article schema builder + blog post data | Add field |

For schema changes:
1. Update the schema builder in `src/lib/schema.tsx` if pattern-level
2. Update per-page route if per-page emission
3. Verify with Google Rich Results Test before committing

### A4. Reseed CMS content (Payload pattern)

For block-data changes affecting CMS:
- `npm run seed -- --reseed {slug}` for individual pages
- `npm run seed -- --reseed-blogs {slug}` for blog posts
- Verify on staging before claiming complete

### A5. Build + deploy

- `npx next build` must pass
- Commit per fix cluster (not per individual edit). Reference audit ID + page list
- Commit + push to origin; shipping live goes through the deploy repo (AGENTS.md "Website Deploy")
- Spot-check on staging URL

### A6. Update audit status

Mark audit frontmatter `status: partially-applied` or `complete`. Add `applied_at` field. Add applied-commits log at bottom of audit.

### Apply-fixes rules

- Confirm scope before applying. Don't silently apply the entire list.
- **Gate failures are fixed before score-lift work.** A blocked page gets its gate cleared first, whatever its numeric score.
- **Never add FAQPage schema, Speakable, llms.txt, an AI-markup file or an AI-specific content rewrite as a fix.** They are not scored and not recommended. Existing markup on the site stays where it is.
- Run a build BEFORE reseeding DB content.
- Per page: respect existing block alternation rules (per `feedback_unified_alternation_rule.md` for Got Moles).
- For Got Moles: commit direct to main (trunk-based). Live shipping routes through the deploy repo — see AGENTS.md "Website Deploy". Verify after the deploy actually lands.

## Cannibalisation Cull — Apply-Fixes Procedure

**This skill owns execution.** Detection lives in three places — `str-keyword-strategy` Step 9, `str-internal-links`, and the per-cluster cannibalisation notes in `target-keywords.md` — and until now nothing owned the merge, the redirect or the cull. It sits here because a cull is an apply-fixes operation on live URLs, and Rule B already governs those.

This is the highest-risk procedure in the skill. The site holds 635 #1 keywords. Everything below is written to make the operation reversible.

### C1 — Evidence gate (all three required before any change)

No URL is touched until all three sources agree the pair is genuinely cannibalising. One source alone is not evidence.

**Candidate versus confirmed.** `str-internal-links` Step 6.5 labels every pair it detects. Keyword overlap or near-duplication alone is a **candidate pair** and is never actionable here. All three evidence sets agreeing is a **confirmed pair**, and only a confirmed pair may enter C2. A candidate pair arriving from upstream goes back for the missing evidence, it does not get promoted on judgement.

1. **Overlapping ranked keywords.** `dataforseo_labs/google/ranked_keywords/live` for the domain with an explicit `limit`, then group by URL and find keyword sets held by two or more URLs. Record the overlapping keywords, each URL's position, and which URL Google prefers per keyword.
2. **Search Console page-level clicks over a 16-month window.** Pull per-page clicks and impressions for the overlapping queries via `.claude/skills/ops-got-moles-ads/scripts/_gsc-status.mjs` and `_gsc-today.mjs`, against the domain property `sc-domain:got-moles.com`. A "loser" that still earns clicks is not a loser. Sixteen months covers seasonality and the last two core updates. **Caution: both scripts still hold hardcoded OAuth credentials and are gitignored pending a scrub into the environment file. Nobody other than Roy runs this step until that scrub and the token rotation are done.** If the step cannot be run, the pair stays a candidate. It never becomes confirmed on two sources.
3. **Internal-link inventory for both URLs.** Every inbound internal link to each URL, with anchor text, from the `str-internal-links` audit or a fresh On-Page crawl. This is the rewrite list, and its size is part of the risk assessment.

Write the three evidence sets into the audit before proposing a decision. A proposal without all three is not actionable.

### C2 — Decision

Pick exactly one per cluster pair, and record the reason:

| Decision | When | What happens |
|---|---|---|
| **Merge** | Both URLs answer the same query and neither is clearly stronger | Fold the unique content of the loser into the canonical URL, then 301 the loser |
| **Differentiate** | The two URLs should answer different sub-queries in the fan-out | Rewrite headings, answer blocks and internal anchors so each owns a distinct sub-query. No URL changes |
| **301** | The loser has no unique content worth keeping and holds equity or links | Redirect the loser to the canonical URL |
| **Noindex** | The page has a genuine user purpose but should not compete in search | `noindex, follow`. Keep the URL live and linked |

**Prefer differentiate over deletion wherever the fan-out has room for both.** The fan-out set usually has more sub-queries than the site has pages, so two competing pages are often two under-specified pages rather than one surplus page.

### C3 — Execution sequence (one cluster at a time)

Run inside Rule B's Only Flow. Each step is a separate commit.

1. **Snapshot.** Record current rankings and clicks for both URLs, and copy the current redirect map to a dated backup. The diff between old and new redirect maps is the revert instructions.
2. **Content move.** Fold the loser's unique content into the canonical page. Run `tool-humanizer` on any new prose. Zero em dashes.
3. **Redirect-map update.** Add the 301 to the project's redirect configuration. Never leave a redirect chain — if the loser was already a redirect target, repoint the original source directly at the final canonical URL.
4. **Sitemap update.** Remove the retired URL and confirm the canonical URL's `lastmod` reflects the substantive change made in step 2.
5. **Internal-link rewrite.** Rewrite every internal link from the C1 inventory to point at the canonical URL with a compliant anchor. **No internal link may point at a redirect.** Anchors follow Rule 5 and the disambiguation guard.
6. **Build and verify.** `npx next build` must pass. Reseed if block data changed.
7. **Ship and verify live.** Route through the deploy repo per AGENTS.md "Website Deploy". Confirm the 301 actually returns 301 and lands on the canonical URL, and that no internal link still resolves through a hop.

### C4 — Post-change monitoring checkpoints

Record all four in the audit file. Do not start the next cluster until checkpoint 2 is clean.

| Checkpoint | What to check | Rollback trigger |
|---|---|---|
| **Immediately after deploy** | 301 returns 301 to the canonical URL; canonical page renders; no internal link resolves through a hop; no build regression | Any failure — revert the commit |
| **After the next full Google crawl of both URLs** (confirm in Search Console URL Inspection, do not assume a date) | Canonical URL indexed; retired URL dropping out; no soft-404 or "duplicate, Google chose different canonical" flags | Retired URL still indexed and outranking the canonical one |
| **Two Search Console reporting periods after the crawl checkpoint** | Combined clicks and impressions for the merged pair versus the pre-change baseline from C1 | Combined clicks materially below baseline |
| **Next monthly re-audit** | Overlapping-keyword set no longer split; the canonical URL holds the positions both URLs used to share | Positions worse than the better of the two originals |

### C5 — Hard rules

- **Staged, one cluster at a time.** Never batch multiple clusters into one change set. A batched cull cannot be attributed when traffic moves.
- **Never touch a URL holding a #1 keyword without explicit approval from Roy**, named in the audit and confirmed in the session. This is a hard stop, not a preference. Check the ranked-keyword pull for position 1 before proposing anything.
- **Always reversible.** Keep the redirect-map diff, the pre-change content of the retired page, and the C1 baseline. Every cull must have a written revert path before it ships.
- **No time or effort estimates** on any cull item. Rank by impact, risk, dependency order and reversibility.
- **City pages go through the doorway gate first.** A city page failing Gate 2 is a substance problem, not automatically a cull candidate. Fix the substance or cull deliberately, and never mass-delete city pages off the back of one audit.
- **The cull queue is a proposal until the user approves it.** Present decisions and evidence; do not begin C3 unprompted.

## References

| File | Topic |
|------|-------|
| `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (install root) | **The landscape authority.** State of search, sourced and confidence-labeled. Wins over anything below |
| `references/audit-checklist.md` | Full per-pillar detail + the 9-pillar scoring rubric + live-verification scripts |
| `references/aeo-patterns-2026.md` | Answer-first and fan-out content patterns, per-cluster leverage map |
| `references/2026-research-notes.md` | Retired as a research source. Now a pointer to the landscape file plus the small set of Got Moles-specific working notes |

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- 2026-09-02: **Rubric restructured to nine pillars against the September 2026 landscape.** AI + search crawlability promoted to Pillar 1 at 15% ([S] 73% of sites block AI crawlers somewhere). Content shape raised to 25% and rebuilt around the lift-out test, one-fact-per-sentence density and fan-out coverage; word-count targets removed ([S] correlation 0.04). Schema demoted to 10% and rescoped to correctness and entity binding ([S] Ahrefs difference-in-differences, 1,885 treated vs 4,000 control, 2026-05-11: −4.6% / +2.4% / +2.2%). FAQ rich-result scoring removed entirely and FAQPage retired as a deliverable ([P] features gone June 2026). Speakable downgraded to optional in SKILL.md, `audit-checklist.md` and `aeo-patterns-2026.md`. llms.txt, AI markup and content chunking removed as recommendations and as scored items ([P] Google, 2026-06-15). Three blocking gates added: homograph, doorway page, incentivized reviews. Visible freshness split into its own pillar requiring a substantive change, not a timestamp bump. Google AI Mode and query fan-out added as explicit concepts with success criteria split by surface. Cannibalisation cull procedure added — this skill owns execution. Source: `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`.
- 2026-05-31 (**superseded 2026-09-02** — the METHOD.md research pass predates Google's generative-AI guidance, the FAQ rich-result removal and the Ahrefs schema test; the landscape file replaces it as the benchmark): Updated to 2026 research (`mole-content-authority/.planning/research/METHOD.md`, ~40 cited sources). Schema pillar: FAQ rich results removed 2026-05-07, Speakable downgraded to optional, schema field rigor (`sameAs`/`knowsAbout`/`dateModified`) over presence, LocalBusiness/Service top priority. AEO pillar: 40–60w answer-first block, chunked self-contained H2s, no visible TL;DR boxes. **Retired from this rule:** "keep FAQPage for AI extraction" (FAQPage is not a deliverable at all now), the cited-stat cadence of one per 150–200 words, and the Princeton +40% figure — the principle that specific attributable claims get quoted survives, the numbers do not. Off-page entity presence remains the larger AI-visibility lever, and that work belongs to `str-authority-strategy`.
- 2026-05-08: Skill created. Foundation-doc check is non-negotiable — stop if target-keywords.md or authority-strategy.md missing. Pixelmojo as recurring 3rd-party benchmark in Step 0. Per-page link plan output is the canonical handoff to apply-fixes mode and adjacent skills.
- Audit-skill pattern (per meta-skill-creator): foundation-doc consumption + structured per-page handoff to apply-mode. Apply mode is a separate top-level section.
- For multi-location brands (e.g. Got Moles 3 GBPs), per-location LocalBusiness schema is a sitewide audit concern — defer to str-ai-seo-local for sitewide; this skill audits per-page emission only.
- Hallucination-correction surface gaps are P1 priority — verified-fact callouts visible above the fold on relevant pages.
- 2026-05-09: Added Production Flow Discipline section (Rules A-E) after Got Moles /about/ apply-fixes work surfaced 5 production-flow gaps: three-layer source-of-truth check, The Only Flow per-tier, live-vs-source verification, backup-checkout-reapply pattern, Lexical builder capability check. Schema pillar updated with the referenced @id pattern + raw-HTML extraction note (it was 2.3 under the old eight-pillar numbering, now 2.6). Images pillar updated with the component-code-vs-WebFetch caveat for Next.js sites (was 2.6, now 2.9). /about/ went 68→95 with these patches applied.
- 2026-05-09: Apply-fixes mode must run `tool-humanizer` deep pass on any new prose before commit. ZERO em dashes (humanizer Rule #1) — easy to miss, mandatory.
- 2026-05-09 (later): Added Rule F (Foundation-Doc Keyword Lookup, per page, evidence-bearing) + Rule G (Output Must Carry Evidence of Execution). Reason: a /about/ re-audit was scored without opening target-keywords.md — the rule existed in the headings pillar but was skippable silently. Fix: make foundation-doc lookup + live-verification + three-layer SoT reconciliation visible artefacts in the report. Empty section = incomplete audit. Self-check before save scans for the three section headers per page.
- 2026-09-02: **Never quote a time or effort estimate** in an audit, a fix list, a cull plan or a client-facing deliverable. Rank by impact, risk, dependency order and reversibility. Standing rule from Roy, repeated miss across the install.
- 2026-09-02: **Never present schema as an AI-citation lever** in client-facing output. If the recommendation is questioned, cite the Ahrefs difference-in-differences result. Schema earns its keep on rich results, entity binding and non-Google systems.
- 2026-09-02: **Every statistic in a client-facing deliverable carries a [P]/[S]/[U] confidence label.** Several widely repeated 2026 "facts" did not survive checking. An unlabeled number in a client document is a defect.
- 2026-09-02: **The +115% citation-lift figure stays banned.** It is unsourced. So is the "top-10 to AI-citation overlap collapsed 76% to 17–38%" line, which is single-source and conflicts with the larger-sample seoClarity finding. Use the landscape resolution instead: AI Overviews are organic-rank coupled, AI Mode is fan-out coupled.
- 2026-09-02: **`str-internal-links` hands its per-page link plan to Pillar 2.5 of this skill, not "Step 4".** The mis-citation lived in both skills and is corrected in both.

## Self-Update

If the user flags an issue with the output during or after a run — wrong scoring, missed pillar, bad fix priority, file path errors — update the `## Rules` section in this SKILL.md immediately with the correction and today's date. Don't just log to learnings; fix the skill so it doesn't repeat the mistake.

Format: `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`

## Troubleshooting

- **Foundation doc missing:** stop. Tell user to run str-keyword-strategy (then str-authority-strategy) first. Per meta-skill-creator Pre-Scaffold Guardrails — non-negotiable.
- **Page not in target-keywords.md:** flag as a coverage gap; don't audit. Recommend updating target-keywords.md to include the page or removing the page if orphaned.
- **No recency benchmark available:** run the DataForSEO AI Optimization calls in Data Sources. If the spend guard says no, record `recency_benchmark: none` in the frontmatter and continue. This never blocks an audit, and a missing Pixelmojo report is not a finding.
- **A page scores well but is blocked:** that is the system working. Report the score and the gate separately and put the page at P1. Never average a gate into a score.
- **Schema validates but an engine still gets a fact wrong:** schema is not the lever. Check the visible page content first, since [P] structured data must match what the page shows, then route the correction to `str-authority-strategy` Section 8.4, which owns the hallucination-correction matrix.
- **A crawler looks allowed in robots.txt but the page is not cited anywhere:** check the CDN and WAF next, and against the published IP ranges rather than the user-agent string. Then diff a JavaScript-enabled render against a JavaScript-disabled one. Robots.txt is the least common place a block actually lives.
- **Cannibalisation pair looks obvious from one data source:** it is not evidence until all three C1 sources agree. A "loser" still earning Search Console clicks is not a loser.
- **Apply-mode breaks build:** rollback the specific commit; re-run audit on the affected page; identify why the fix produced invalid Lexical / TypeScript / schema; fix root cause.
- **Multi-location LocalBusiness schema audit:** out-of-scope for this skill — handled by str-ai-seo-local sitewide.

## Change log

### 2026-09-02 — September 2026 landscape alignment

Rewritten against `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`, which is now the landscape authority for the whole skill chain. Audit plan items 8, 9, 12, 15, 16 and 20.

**Rubric**
- Nine pillars replace eight. AI + search crawlability is now Pillar 1 at 15%, covering the named user agents, CDN and WAF rules checked against published IP ranges, JavaScript-render dependence, the 2MB HTML limit and snippet eligibility. Reason: [S] 73% of sites block AI crawlers somewhere, and every other pillar is worthless on a page an engine cannot fetch.
- Content shape rises to 25% and is rebuilt around the lift-out test, one-fact-per-sentence density and fan-out coverage. Word-count targets are gone: [S] Ahrefs, 174,048 pages, correlation 0.04.
- Schema falls to 10% and is scored for correctness, visible-content match and entity binding only. The Ahrefs difference-in-differences result is cited in the pillar so the change is defensible to a client.
- FAQ rich-result scoring removed. FAQPage is no longer a deliverable and no longer scored. Existing markup stays.
- Speakable downgraded to optional in SKILL.md, `references/audit-checklist.md` and `references/aeo-patterns-2026.md`. It previously sat as a full-weight signal in the rubric and as "the #1 high-impact action" in the patterns file, both contradicting the skill's own 2026-05-31 rule.
- llms.txt, AI-markup mirrors and content chunking removed as recommendations and as scored items.
- Visible freshness is its own pillar and requires a substantive change: `dateModified`, `Last-Modified` and sitemap `lastmod` consistent, plus a 12-month-untouched flag.
- Core Web Vitals kept at LCP, INP and CLS with INP weighted highest, now measured from the Lighthouse endpoint rather than deferred.

**Gates**
- Homograph gate is blocking, per landscape §9 and §12.2.10.
- Doorway-page gate added for city pages with the strip-the-city-name test, and the 2026 failure mode recorded as silent suppression rather than a manual action.
- Incentivized-review gate added on any Review or AggregateRating markup, per the 2026-07-24 named violation.

**Surfaces**
- Google AI Mode and query fan-out added as explicit concepts. Success criteria are now split by surface: AI Overviews are organic-rank coupled, AI Mode is fan-out coupled, the Local Pack is not won on the page and routes to `str-ai-seo-local`.

**Data sources**
- DataForSEO AI Optimization (`llm_mentions`, `llm_responses`) replaces Pixelmojo as the primary recency benchmark. Pixelmojo is optional and its absence is no longer a finding. The old 30-day freshness gate had been failing silently since May.
- DataForSEO On-Page (`instant_pages`, `content_parsing/live`, `lighthouse/live/json`) added as the backstop to the bespoke extractor, with `--dry`-tested payloads and a mandatory spend guard.
- Google Search Console, the UI-only Generative AI report, Bing AI Performance and GA4's attribution limits documented, including the caution that the two GSC scripts still hold hardcoded credentials pending a scrub.

**Corrections**
- The `str-internal-links` handoff is Pillar 2.5, not "Step 4". Pillar 2.5 now also reads the Cluster, Surface and Fan-out-sub-queries-served columns that skill added on 2026-09-02, and the Surface column drives a new informational-to-transactional routing signal.
- The AI Overviews / organic overlap figure is reconciled to the landscape resolution. The single-source 76%-to-17–38% collapse is retired.
- The unsourced +115% claim stays banned.
- Cross-client residue removed: this skill no longer references ATP test pages or cornerstones.
- `mkt-copywriting` removed from the downstream list. It is not installed in this workspace.

**New**
- Cannibalisation cull procedure. This skill now owns execution: a three-source evidence gate, a four-way decision, a staged execution sequence, four monitoring checkpoints and hard rules including no URL holding a #1 keyword without explicit approval from Roy.
