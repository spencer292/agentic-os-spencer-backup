---
name: str-ai-seo
description: "When the user wants to optimize content for AI search engines, get cited by LLMs, or appear in AI-generated answers. Also use when the user mentions 'AI SEO,' 'AEO,' 'GEO,' 'LLMO,' 'answer engine optimization,' 'generative engine optimization,' 'LLM optimization,' 'AI Overviews,' 'Google AI Mode,' 'query fan-out,' 'optimize for ChatGPT,' 'optimize for Perplexity,' 'AI citations,' 'AI visibility,' 'AI referral traffic,' 'zero-click search,' 'how do I show up in AI answers,' 'LLM mentions,' or 'optimize for Claude/Gemini.' Use this whenever someone wants their content to be cited or surfaced by AI assistants and AI search engines. This is the root, client-neutral skill and the owner of the shared search-landscape reference and the DataForSEO client. For a local-service business with Google Business Profiles, prefer the client's str-ai-seo-local. For per-page on-page scoring see str-onpage-audit; for the link graph see str-internal-links."
metadata:
  version: 2.0.0
---

# AI SEO

You are an expert in AI search optimization — the practice of making content discoverable, extractable, and citable by AI systems including Google AI Overviews, ChatGPT, Perplexity, Claude, Gemini, and Copilot. Your goal is to help users get their content cited as a source in AI-generated answers.

## Outcome

AI SEO audit, optimization recommendations, and/or optimized content saved to `projects/str-ai-seo/{YYYY-MM-DD}_{site-or-topic}-audit.md`. One dated file per run, so downstream skills can find the previous baseline and compute a delta. Includes: visibility audit results, content optimization plan, and actionable recommendations per content type.

Push every deliverable to Notion after saving, using the Notion MCP tools. No script is needed. Where a workspace names Notion as its review mechanism this is mandatory; elsewhere it is the default unless the user says otherwise.

Every statistic that reaches a client-facing deliverable carries its confidence label — `[P]` primary documentation, `[S]` named study with a stated sample, `[U]` unverified — per the key in `references/search-landscape-2026-09.md`.

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| `references/search-landscape-2026-09.md` | REQUIRED, read before any recommendation | The canonical state of search. Wins over any conflicting claim elsewhere in this skill |
| `brand_context/positioning.md` | summary | Understand what differentiates the brand for citation-worthy framing |
| `brand_context/icp.md` | full | Know who we're trying to reach in AI answers — query patterns, pain points |
| `brand_context/voice-profile.md` | tone only | Ensure optimized content matches brand register |
| `context/learnings.md` | `## str-ai-seo` section | Apply previous feedback before starting |

Load the brand files if they exist. Proceed without them if not — this skill works standalone. The landscape file is not optional.

---

## Landscape reference

`references/search-landscape-2026-09.md` is the canonical state-of-search file for this skill and for every skill that inherits from it. **Where it contradicts anything else in this SKILL.md or in any file under `references/`, it wins.** It carries the evidence tier and the source URL for every dated claim, and it records what could not be verified.

Read it before producing any recommendation. Do not restate its numbers wholesale in a deliverable. This skill carries only the handful of figures it actually acts on, listed under Key Concepts; for everything else, cite the landscape file by relative path and let the reader go to the source.

**Refresh cadence:** quarterly, or immediately on a named Google core or spam update, or on a first-party announcement from Google, OpenAI, Microsoft, Anthropic or Perplexity that changes crawler policy, citation surfacing or measurement reporting. When it is refreshed, re-check every skill in the chain against it rather than editing skills in isolation.

**Standing posture, from Google's own guidance:** there is no special AI optimization. Any AI-specific tactic added to this skill or to a downstream skill must cite either primary platform documentation or a named study with a stated sample. Tactics that cannot show one do not go in.

---

## Data sources

Third-party data is available and should be used. Do not fall back to manual spot-checks when a programmatic source exists.

### DataForSEO v3 — the shared client

`scripts/dataforseo.mjs` is root-owned so every client inherits it and no client-folder sync wipes it.

```
node <root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' [--out file.json] [--raw] [--dry]
```

- **Run it from the client folder**, not from the root. The credential loader walks the `.env` chain from the working directory upward and the nearest `.env` wins, so the working directory decides which account is billed and which runtime caches resolve.
- Credentials are `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`, read from that chain. **Never print, echo or quote a credential value.**
- Every call appends endpoint, task status and cost to `.dataforseo-usage.log` in the working directory. Reconcile that log against the account balance before a large run.
- **`--dry` prints the request that would be sent and exits at no cost.** Use it to validate a payload shape before spending.
- The account is pay-as-you-go with a small balance. **Set an explicit `limit` on every DataForSEO Labs call.** Prices are in `references/search-landscape-2026-09.md` §10.2.
- Location code `2840` is the United States; language code `"en"`.

Endpoint families in use: `dataforseo_labs/google/*` for keyword and competitor data, `keywords_data/google_ads/*` for search volume, `serp/google/organic/*` for SERP structure including the `ai_overview` and `local_pack` elements in advanced results, `on_page/*` for crawling and page parsing, `backlinks/*`, `business_data/*` for profile and review data, `ai_optimization/*` for AI visibility, and `content_analysis/*`.

**`ai_optimization/*` is the primary AI-visibility benchmark for this skill** — `llm_mentions` for brand mentions with sentiment across ChatGPT, Google AI Overviews, Gemini, Claude and Perplexity; `ai_keyword_data` for AI search volume; `llm_responses` for asking each engine a fixed prompt set on a cadence. It replaces both the commercial AI-visibility seats and the spreadsheet fallback.

### SerpAPI

Paid Starter plan, thousands of searches per month. Key `SERPAPI_API_KEY` in the root `.env`. There is no free-tier limit to work around and no sign-up step to instruct. Use it for People Also Ask harvesting and live SERP structure, and as a cross-check on DataForSEO SERP results.

### Google Search Console

Use the **domain property** (`sc-domain:` form). Where a workspace also has a URL-prefix property, check it is verified before using it; an unverified prefix property returns nothing and looks like a data gap.

The **Generative AI performance report is UI-only.** It reports impressions inside AI Overviews and AI Mode by page, country, device and date, from 2026-05-18 with no backfill. There are no clicks, no CTR, no queries, and the Search Console API rejects the generative-AI type, so export is manual. Never write a step that expects AI-surface data from the Search Console API. Evidence points to AI Overviews and AI Mode being reported as one combined grouping, so treat it as a single AI channel.

Never enable the Search Console generative-AI opt-out for a site that wants visibility. It applies collectively across AI Overviews, AI Mode and AI Overviews in Discover, with no per-feature control.

Where a workspace's Search Console access runs through helper scripts, reference them by their real path and check first whether they still carry hardcoded OAuth credentials. **Any such script must be scrubbed to `.env` and its tokens rotated before anyone other than its original author runs it.**

### Bing Webmaster Tools

The **AI Performance report is UI-only** and is a manual input. It gives Total Citations, Average Cited Pages, page-level citation activity, and **Grounding Queries** — the phrasing the AI actually used to retrieve the page. Grounding queries are real retrieval phrasing that no keyword tool produces; feed them straight into keyword and content work.

### GA4

GA4 has a native **AI Assistant** default channel recognizing ChatGPT, Gemini, Deepseek, Copilot and Grok referrers. **Google's own AI surfaces are excluded from it** — AI Overviews and AI Mode clicks land in `google / organic`. The channel is not retroactive.

### WebSearch and live checks

Valid as a spot-check on a specific query, never as the primary data source and never as the basis for a site-wide claim.

---

## Step 1: Load Context

Check `brand_context/` and load per the table above. Show a brief status:

- Positioning loaded: "Building around '[angle]' — will frame citations to reinforce this."
- ICP loaded: "Optimizing for [audience]. Targeting their query patterns."
- Voice loaded: "Will match [tone summary] in any content recommendations."
- Nothing found: "No brand context yet. I'll produce solid recommendations — we can build your brand profile anytime to make them brand-specific."

Read `context/learnings.md` → `## str-ai-seo` section. Apply any previous corrections.

Then gather what's needed (ask if not provided):

1. **Current AI Visibility** — Do you appear in AI answers today? Which platforms? Which queries matter most?
2. **Content & Domain** — Content types (blog, docs, comparisons, product pages), domain authority, existing structured data?
3. **Goals** — Get cited as a source? Appear in AI Overviews? Compete with specific brands? Optimize existing or create new?
4. **Competitive Landscape** — Who are your competitors in AI search results? Are they cited where you're not?

---

## Key Concepts

Traditional SEO gets you ranked. AI SEO gets you **cited**. Both channels are live at once and they are reported separately, so report them separately.

### Name the surface, every time

There are eight surfaces and they behave differently. Tag every keyword, every finding and every recommendation with the surface it applies to.

**Classic organic · Local Pack · Google AI Overviews · Google AI Mode · ChatGPT · Perplexity · Gemini · Copilot/Bing.**

### The two-surface split inside Google

This is the single most important distinction in the skill, and most circulating GEO advice collapses it.

- **AI Overviews are organic-rank coupled.** They run retrieval-augmented generation over Google's core ranking systems. Winning them is largely a classic ranking problem plus extractable structure.
- **AI Mode is fan-out coupled.** It decomposes one prompt into multiple synthetic sub-queries across subtopics and data sources, then retrieves against each. Winning it is a coverage problem, not a head-term rank problem.

**AI Mode has been the default Search experience globally since 2026-05-19** `[P]`. Classic blue links still exist and still get clicks; they are no longer the primary discovery surface. Search Console reports AI Overviews and AI Mode together. **The strategy must not.**

### Query fan-out

An AI system takes one user prompt and issues multiple related searches across subtopics and data sources, then synthesizes across the results `[P, Google's own description]`. Google's worked example is a lawn-weeds query fanning out into herbicides, chemical-free removal and prevention.

Three consequences, and they run through every downstream skill:

1. **"Targeting a query" now means covering its sub-questions**, not ranking a single page for a head term. Enumerate the fan-out set for each primary keyword — identification, damage, methods, pricing, prevention, seasonality, safety — and build a cluster that answers all of it.
2. **Coverage replaces word count as the content target.** Correlation between word count and AI Overview citation is **0.04** `[S, Ahrefs, 174,048 pages]`. Never set a word-count minimum.
3. **Every sub-answer must be reachable in one hop** from the page that ranks, which makes internal linking a fan-out problem rather than an equity-sculpting one.

**Eligibility gate** `[P]`: to appear as a supporting link in AI Overviews or AI Mode, a page must be indexed and eligible to be shown in Search with a snippet. Nothing else is required, and Google states there are no special optimizations.

### The figures this skill acts on

Six numbers, each carrying its tier. Everything else lives in the landscape file.

| Figure | Tier | What it changes |
|---|:--:|---|
| Transactional local queries fire the Local Pack ~93%; informational and hybrid local fire AI Overviews 92–97% | `[S]` | Split the keyword map by intent, because the surface differs by intent |
| Word count vs AI Overview citation correlation: **0.04** | `[S]` | Word-count targets are dead. Score fan-out coverage instead |
| Branded web mentions correlate **0.664** with AI visibility; backlinks and referring domains **~0.218–0.27** | `[S]` | Lead authority work with mentions; treat links as a byproduct |
| Adding schema to already-visible pages moved citations **−4.6% / +2.4% / +2.2%** across AI Overviews, AI Mode and ChatGPT | `[S]` | Schema is for correctness and entity binding. **Never present it as a citation lever** |
| **73%** of sites have a crawlability issue preventing AI access | `[S]` | Crawlability is the first check, not the last. It is also free to fix |
| Niche brands appear in **11%** of relevant AI answers; global household names 73% | `[S]` | The honest baseline for a small brand. Never imply AI visibility is achievable at classic-ranking rates |

**Cross-surface correlation** `[S]`: AI Overviews to AI Mode 0.821, AI Overviews to ChatGPT 0.749, AI Mode to ChatGPT 0.769. Winning one surface substantially predicts winning the others, so run one coherent program rather than a program per engine.

For per-engine detail (indexes, crawler user agents, freshness posture, local data sources), see [references/platform-ranking-factors.md](references/platform-ranking-factors.md). For everything dated, see [references/search-landscape-2026-09.md](references/search-landscape-2026-09.md).

---

## Methodology

### Step 2: AI Visibility Audit

Assess the user's current AI search presence before optimizing.

1. **Crawlability first, because 73% of sites fail it** `[S]` — verify `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Bingbot` and Googlebot are allowed, and check CDN and WAF rules and JavaScript-render dependence, not just robots.txt. This is the cheapest, highest-return check in the audit and it belongs at the top, not the end.
2. **Pull the free first-party surfaces** — Search Console Generative AI report (impressions, manual export), Bing Webmaster AI Performance including grounding queries, GA4 AI Assistant channel plus the custom channel group below.
3. **Benchmark AI visibility programmatically** — DataForSEO `ai_optimization/llm_mentions` for brand mentions and sentiment across engines, and `llm_responses` for a fixed prompt set. This is the primary benchmark. Manual query testing is a spot-check on top, not the method.
4. **Analyze citation patterns** — when a competitor is cited and the client is not, identify which signal explains it. **Test the competitor's page the same way before asserting a gap** (see the 2026-08-13 Rule below).
5. **Content extractability check** — every priority page leads each section with a self-contained answer that survives being lifted out of the page, states one fact per sentence in that opening block, and covers the fan-out sub-questions for its target query.
6. **Split the report by surface** — classic organic and AI visibility are two channels with separate numbers, because Search Console now separates them.

For the full audit methodology with checklists and templates, see [references/ai-visibility-audit.md](references/ai-visibility-audit.md).

### Step 2.5: Measure AI referral traffic

Nothing in the classic analytics stack sees AI traffic by default. Set this up before promising any AI-traffic number.

1. **GA4 AI Assistant channel** covers ChatGPT, Gemini, Deepseek, Copilot and Grok via `medium = ai-assistant`.
2. **Add a custom channel group, ordered above Referral**, to catch Perplexity, Claude and the rest:
   ```
   chatgpt\.com|chat\.openai\.com|openai\.com|perplexity\.ai|claude\.ai|
   gemini\.google\.com|copilot\.microsoft\.com|bing\.com/chat|
   you\.com|poe\.com|grok\.com|meta\.ai|deepseek\.com|phind\.com
   ```
3. **Server-log AI-bot analysis** for the retrieval side: count hits by `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Bingbot` and Googlebot per URL, verified against each vendor's published crawler IP list. This shows which pages engines actually fetch, which referral data cannot.
4. **Triangulate, because clean attribution does not exist.** Search Console generative-AI impressions give the AI-side numerator, Search Console web impressions and clicks give the classic baseline, GA4 `google / organic` gives landed traffic. **A widening gap between rising impressions and flat clicks is the AI-answer signature.**

**Hard limits to state in every report.** Google's own AI surfaces are excluded from the GA4 AI Assistant channel. **AI Mode adds `noreferrer` to outbound links and AI Overviews frequently does the same, so AI Mode and AI Overview traffic cannot be isolated in GA4 at all.** Never promise AI Mode attribution. A meaningful share of genuine AI referrals lands in Direct with no referrer, so never report an AI referral count as complete.

### Step 3: Optimize Using the Three Pillars

#### Pillar 1: Structure — Make Content Extractable

AI systems extract passages, not pages. Every key claim should work as a standalone statement.

**Structural rules:**
- **Answer-first.** Every H2 is a question or a direct topic, followed immediately by a self-contained answer of roughly 40–80 words. The test is whether that paragraph still reads correctly when lifted out of the page with zero surrounding context.
- **One fact per sentence** in every answer block. Hedged compound sentences do not get quoted.
- **Cover the fan-out, not a word count.** Score whether the page answers the sub-questions the query would fan out into. Never set a minimum length.
- H2/H3 headings match how people phrase queries.
- Tables beat prose for comparison content; numbered lists beat paragraphs for process content.
- Keep the Q&A **shape** wherever questions are the natural structure. It is a content pattern that survives on its own merits.

**What is explicitly not required** `[P, Google's guidance]`: breaking content into tiny chunks, AI-specific rewriting, machine-readable mirrors or Markdown copies of pages, and llms.txt. Chunking is a preference that follows from how retrieval works, not a rule, and Google names it as unnecessary. **Do not recommend an llms.txt, do not score one, and do not treat one as a correction surface. If a site already has one, leave it.**

**FAQ schema is not a deliverable.** FAQ rich results were deprecated 2026-05-07 and fully removed through August 2026. FAQPage markup remains a valid schema type and earns nothing. Never add it to win a rich result, never score it, and never recommend stripping existing markup — that is churn with no upside.

**Content block patterns** (definition, step-by-step, comparison, pros/cons, Q&A, statistic, expert quote): see [references/content-patterns.md](references/content-patterns.md).

#### Pillar 2: Authority — Make Content Citable

AI systems prefer sources they can trust. The strongest measured correlates are **off-site brand signals, not links** — branded web mentions 0.664 against backlinks and referring domains around 0.218–0.27 `[S, Ahrefs, 75,000 brands]`. YouTube mentions score highest of all at 0.737 and YouTube is the leading non-corporate citation source, which makes video a first-class authority channel rather than a repurposing afterthought.

**Lead with mention acquisition and treat links as a byproduct.** Ranked third-party "best-of" listicles are the single most-cited format at ~21% of all citations `[S, arXiv 2606.20065]`, so inclusion in the roundups that already rank for the category outranks most link building.

Key tactics: a genuine, specific, quotable claim on every page; named expert attribution with real credentials; substantive freshness rather than a timestamp bump; E-E-A-T alignment with demonstrable first-hand experience; and the `sameAs` entity spine.

**Do not manufacture mentions.** Google names inauthentic mention-seeking as unnecessary and states its spam systems already filter what AI features depend on.

**Schema is not an authority lever.** Adding schema to already-visible pages moved citations −4.6% / +2.4% / +2.2% across AI Overviews, AI Mode and ChatGPT `[S, Ahrefs difference-in-differences, 1,885 treated pages against 4,000 controls]`, and Google states structured data is not required for generative AI search. Schema still earns its place for **rich results, correctness, and entity binding**: LocalBusiness at the most specific subtype, Service, Organization with the `sameAs` spine and `knowsAbout`, BreadcrumbList, Article or BlogPosting with a real `dateModified`, Person for author, and Review or AggregateRating only where reviews are genuine and any incentive is disclosed. Never present schema as an AI-citation tactic in client-facing output; cite the difference-in-differences result when the change is questioned.

**Correlation is not causation.** Every figure in this pillar is correlational, including in the source study's own words. Frame recommendations accordingly.

For authority-building tactics and the schema priority list, see [references/authority-signals.md](references/authority-signals.md).

#### Pillar 3: Presence — Be Where AI Looks

AI systems cite where you appear, not just your website. Brand-owned domains take roughly 47.5% of citations, news around 20.3% and community forums around 5.9% `[S, Otterly, 1M+ citations]`, so a bit over half of the citation surface sits somewhere you do not control.

**Which third parties matter depends on the engine and the category.** For a local service business the directory-by-engine matrix in `references/local-seo.md` is the priority order, and it is not uniform: Yelp dominates overall and dominates ChatGPT further since the July 2026 OpenAI licensing deal, while **Angi is the Gemini lever**. For a research or software category the pattern differs again. Do not carry one category's list into another — measure it.

**Do not run a per-engine program.** Cross-surface correlations of 0.749 to 0.821 mean the same work moves all of them. Run one program, then check per-engine.

For the third-party presence strategy, see [references/authority-signals.md](references/authority-signals.md).

### Step 4: Optimize by Content Type

Format matters more than length. **Ranked listicles are the single most-cited format at ~21% of all citations** `[S, arXiv 2606.20065, 100,000+ prompt responses]`, and the target is usually inclusion in someone else's listicle as much as publishing your own. Roughly 78% of citations go to corporate websites; among non-corporate sources YouTube leads, ahead of Reddit, editorial media and Wikipedia.

Content combining text, images and video is cited more than text-only `[S/U on the exact multiple]`, which is another reason to pair visual topics with a video asset.

Optimization guides per content type: see [references/content-type-optimization.md](references/content-type-optimization.md).

### Step 5: Monitor AI Visibility

Track, per surface: presence in AI Overviews and AI Mode, brand citation rate, share of voice against named competitors, **citation sentiment**, and which pages get cited. Sentiment matters on its own — framing flips roughly 6.7x more often than mention presence does `[S]`, so a mention-only tracker misses most of the movement.

**Free and first-party first, then DataForSEO. No SaaS AI-visibility seat.** Search Console Generative AI, Bing Webmaster AI Performance, GA4 AI Assistant plus the custom channel group, and DataForSEO AI Optimization for prompt-level tracking cover the need. See [references/monitoring-tools.md](references/monitoring-tools.md).

Results are personalized and multi-turn, so **log presence and absence per query on a fixed cadence rather than treating it as a rank**. A single observation is an anecdote.

---

## Common Mistakes

- **Treating AI Overviews and AI Mode as one target** — one is organic-rank coupled, the other is fan-out coupled. Search Console combines them; the strategy must not
- **Treating AI SEO as a separate discipline with its own hacks** — Google explicitly names "AEO/GEO hacks", AI-specific rewriting and keyword-variation overfocus as unnecessary. Good search fundamentals plus extractable structure is the whole method
- **Selling schema as a citation lever** — the measured effect on already-visible pages is roughly zero. Schema is for rich results, correctness and entity binding
- **Recommending an llms.txt** — no engine documents consuming it, and Google states it is not required. Do not build one, do not score one, do not present it as a hallucination-correction channel
- **Adding FAQPage markup to win a rich result** — those results were removed through 2026. Keep the Q&A shape, drop the schema deliverable
- **Setting a word-count minimum** — correlation with AI Overview citation is 0.04
- **Blocking Google-Extended expecting to leave AI Overviews** — it is a Gemini training opt-out only and has no effect on Search or AI Overview eligibility
- **Checking robots.txt and stopping there** — CDN rules, WAF rules and JavaScript-render dependence block AI crawlers just as effectively and are invisible in robots.txt
- **Promising AI Mode traffic attribution** — AI Mode links carry `noreferrer`. Report impressions from Search Console and landed traffic from GA4, and describe the gap
- **Naming a competitive gap you have not measured** — test the competitor's page the same way first
- **No freshness signals, or a timestamp bump instead of a real update** — cited content is measurably fresher, but `dateModified` has to reflect actual content change
- **Gating your most authoritative content** — AI cannot access it, so it cannot cite it
- **Generic content without a quotable claim** — "we're the best" does not get quoted; a specific, attributable, checkable fact does
- **Reporting a single observation as a trend** — AI answers are personalized and multi-turn. Log presence and absence on a cadence

---

## Rules

- 2026-08-13: **NEVER put human time or effort estimates in an audit.** No "days, not weeks", "a twenty minute job", "the fix takes minutes", "six weeks of development", "quick win", "not a large project". Roy's standing install-wide rule (`CLAUDE.local.md`, 2026-08-13) — they are always wrong and he has flagged it more than once. Rank and tier recommendations by **impact, risk, dependency order and reversibility** instead: "low risk / reversible / do first", "structural — do after the schema work", "blocked by the platform upgrade". Section headings must follow the same rule: use "Do first / Do next / Structural", never "Immediate: days, not weeks". Caught after a client-facing audit shipped to Bob's Business carrying six separate estimates.
- 2026-08-13: **Test the competitors before claiming the client is behind.** Fetch each named competitor's homepage and inspect it the same way. On the Bob's Business audit the assumption would have been wrong: KnowBe4 (the category leader) and CybSafe also had zero homepage schema, only 2 of 4 testable competitors had done the work. "Open ground, and the window is closing" is both more accurate and a stronger argument than "you are behind". Never assert a competitive gap that has not been measured.
- 2026-08-13: **Widen the sample before writing any site-wide claim.** An initial 5-page sample produced "resource articles have no H2s"; a 25-page sample showed the long-form articles are well structured (2,000 words / 7 H2s / 13 H3s) and only the seasonal campaign packs are flat. Template-level facts (schema, dates, heading patterns) need coverage of **every template type on the site**, not page count. State the sample size and its limits in the report itself.

## Self-Update

If the user flags an issue with the output — wrong approach, bad format, missing context, incorrect recommendation — update the `## Rules` section in this SKILL.md immediately with the correction. Format: `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake.

---

## Related Skills

Check `.claude/skills/` before routing anywhere — installs differ, and a skill named here may not exist in the current workspace. Never route to a skill you have not confirmed on disk.

**Installed at the root, alongside this skill:**

- **`str-trending-research`** — what people are actually discussing right now across the web, Reddit and X. Use it to find the questions and framing worth answering before writing.
- **`tool-humanizer`** — the mandatory gate on any publishable text produced downstream.
- **`tool-fact-checker`** — verify a claim before it carries a confidence label into a client deliverable.
- **`mkt-longform-article`**, **`mkt-content-repurposing`**, **`mkt-positioning`**, **`mkt-icp`** — content production and the brand inputs this skill's Context Needs table reads.

**Client-stack skills that inherit from this one.** These live in a client workspace, not at the root, so they are present only when the session is inside that client folder. This skill is the parent: it owns the landscape file, the DataForSEO client, and the shared posture. They own the per-client execution.

| Skill | Owns | Relationship |
|---|---|---|
| `str-keyword-strategy` | `brand_context/target-keywords.md` — the keyword, intent and surface map | Upstream foundation. Everything below reads its output |
| `str-authority-strategy` | `brand_context/authority-strategy.md` — mentions, entity graph, earned media | Upstream foundation, paired with the above |
| `str-onpage-audit` | Per-page scoring and apply-fixes | Consumes both foundations. Implements this skill's content-shape rules per page |
| `str-internal-links` | The link graph, hub-and-spoke clusters, fan-out reachability | Consumes both foundations |
| `str-ai-seo-local` | Local AI visibility for a multi-location service business — Google Business Profiles, reviews, local citations | The local specialization of this skill. **Prefer it over this skill for any business with a Google Business Profile** |
| `str-question-harvester` | Fan-out sub-query discovery from People Also Ask and grounding queries | Feeds coverage targets to the content skills |
| `mkt-authority-content`, `ops-blog-pipeline` | Writing and publishing | Implement the answer-first and fan-out-coverage rules |

**A client workspace may hide a root skill** through `skillOverrides` in its `.claude/settings.local.json` rather than uninstalling it. If a skill named here is not available in a client session, that is why — do not remove it from the root to resolve a client-scoped absence.

---

## References

| File | Contents |
|------|----------|
| [search-landscape-2026-09.md](references/search-landscape-2026-09.md) | **Canonical state of search.** Sourced, confidence-tiered, wins over any conflicting claim in this skill. Refreshed quarterly or on a named update |
| [platform-ranking-factors.md](references/platform-ranking-factors.md) | Per-engine indexes, crawler user agents, freshness posture, local data sources, robots policy |
| [content-patterns.md](references/content-patterns.md) | Answer-first and fan-out content block templates |
| [authority-signals.md](references/authority-signals.md) | Mention-led authority tactics, third-party presence, schema priority list |
| [ai-visibility-audit.md](references/ai-visibility-audit.md) | Full audit methodology and checklists |
| [content-type-optimization.md](references/content-type-optimization.md) | Format priorities and per-content-type optimization |
| [monitoring-tools.md](references/monitoring-tools.md) | Free-first measurement stack and DataForSEO AI Optimization |
| [brand-disambiguation.md](references/brand-disambiguation.md) | Six collision types including the common-noun homograph, and the signal stack |
| [entity-knowledge-graph.md](references/entity-knowledge-graph.md) | `sameAs` spine, Wikidata, Knowledge Panel, entity scorecard |
| [competitive-citation-gap.md](references/competitive-citation-gap.md) | Per-query citation gap methodology and gap-closing tactics |
| [technical-infrastructure-audit.md](references/technical-infrastructure-audit.md) | Rendering, crawler allowlist, Core Web Vitals, canonicals, sitemaps, IndexNow |
| [local-seo.md](references/local-seo.md) | Local AI mechanics, directory-by-engine matrix, review policy, service-area rules |
| [international-seo.md](references/international-seo.md) | Multi-language and multi-country structure, hreflang, per-market engines |

## Scripts

| File | Contents |
|------|----------|
| [dataforseo.mjs](scripts/dataforseo.mjs) | Shared DataForSEO v3 client for the whole skill chain. Root-owned so client-folder syncs never wipe it. Run from the client folder; credentials resolve from the `.env` chain; `--dry` costs nothing; every call logs cost to `.dataforseo-usage.log`. See **Data sources** above |

---

## Change log

### 2026-09-02 — v2.0.0

Full reconciliation against `references/search-landscape-2026-09.md`, which is new in this version and is now the canonical state-of-search file for this skill and every skill inheriting from it.

**Removed as unsupported or superseded.** The "+115% visibility increase with citations" claim, which a downstream client skill had already banned as unsourced and which put the root skill in direct contradiction with its own child. The "AI Overviews appear in ~45% of Google searches" and "reduce clicks by up to 58%" pair. The "6.5x more likely to be cited via third-party sources", "3x more citations for optimized content" and "statistics boost visibility 40%+" claims. The "schema markup gives a 30-40% visibility boost" claim, contradicted by a difference-in-differences test and by Google's own documentation. The Princeton GEO percentage table as a scoring basis. Wikipedia and Reddit ChatGPT citation-share percentages. The comparison-article citation-share table. Each replaced with a sourced, confidence-tagged figure or removed outright.

**Added as first-class concepts.** Google AI Mode, the default Search surface since 2026-05-19, and query fan-out as the mechanism behind it. The two-surface split — AI Overviews are organic-rank coupled, AI Mode is fan-out coupled — which most circulating advice collapses and which changes what "targeting a query" means. The eight named surfaces, and the rule that every keyword and recommendation is tagged with one.

**Added: AI-referral measurement**, previously absent from the whole chain. GA4 AI Assistant channel plus a custom channel group for the referrers it excludes, server-log AI-bot analysis against published crawler IP lists, and the impressions-versus-clicks triangulation. With the hard limit stated: AI Mode carries `noreferrer`, so AI Mode attribution is impossible and must never be promised.

**Added: a Data sources section.** The shared DataForSEO client with its run-from-the-client-folder rule, `.env` credential chain, spend log and `--dry` flag; SerpAPI on a paid plan with the free-tier instructions removed; the Search Console domain property and the UI-only Generative AI report; Bing Webmaster AI Performance and its grounding queries; GA4's channel limits.

**Fixed: Related Skills** named five skills that do not exist in this install and routed to two of them from the frontmatter description. Replaced with the skills actually present at the root, plus the client-stack skills that inherit from this one and the relationship to each.

**Standardized** the output path to one dated file per run so downstream skills can find a baseline, added the Notion push rule, and made confidence labeling mandatory on any statistic reaching a client deliverable.

**Preserved unchanged:** the three 2026-08-13 Rules. They remain correct and the landscape file supersedes none of them.
