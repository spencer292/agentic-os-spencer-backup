# AI Visibility Audit

Full methodology for assessing current AI search presence before optimizing. Dated claims defer to `search-landscape-2026-09.md`, which wins on any conflict.

**Order matters.** Crawlability first, then the free first-party data, then programmatic benchmarking, and only then manual query testing. The previous version of this file opened with manual query testing and closed with the bot check — which is backwards, because a crawler that cannot reach the site makes every other finding moot.

---

## Step 1: Crawler access — do this first

`[S]` 73% of sites have a crawlability issue preventing AI access (Otterly, 1M+ citations, January–February 2026). It is the highest-return item in the audit and it costs nothing to fix.

**Check that these are allowed:**

| User agent | Operator | What it does |
|---|---|---|
| `OAI-SearchBot` | OpenAI | ChatGPT search. **This is the one that matters for citation** |
| `PerplexityBot` | Perplexity | Search, does not train |
| `Claude-SearchBot` | Anthropic | Search quality |
| `Bingbot` | Microsoft | Bing index — a hard prerequisite for Copilot |
| `Googlebot` | Google | Everything Google, including AI Overviews and AI Mode |

**Also allow `Google-Extended`.** `[P]` It is a Gemini training opt-out only. **Blocking it does not remove pages from AI Overviews** and does not affect Search ranking. Blocking it buys nothing.

**`GPTBot` and `ClaudeBot` are a separate decision.** They are training crawlers. Blocking them does not remove the site from any search surface. Recommend allowing them, since brand presence in training corpora correlates with visibility — but be clear that this is a business choice, not a citation lever.

**Three failure modes, and only the first is in robots.txt:**

1. **robots.txt** — a `Disallow` targeting any agent above, or a blanket block.
2. **CDN, WAF and bot management** — these block AI crawlers invisibly and do not appear in robots.txt. **This is where most of the 73% actually lives.** Check the edge configuration.
3. **JavaScript-render dependence** — the crawler fetches successfully and gets an empty shell. Fetch each priority page with each crawler's user agent and compare against the browser view.

**Verify by IP, not by user-agent string:** `openai.com/searchbot.json`, `openai.com/gptbot.json`, `perplexity.com/perplexitybot.json`, `claude.com/crawling/bots.json`.

**Also check:** the Search Console generative-AI opt-out is **off**. It removes the site from AI Overviews, AI Mode and AI Overviews in Discover collectively, with no per-feature control, and it is the only real AI opt-out that exists.

| Check | Result |
|---|:--:|
| `OAI-SearchBot` allowed | |
| `PerplexityBot` allowed | |
| `Claude-SearchBot` allowed | |
| `Bingbot` allowed | |
| `Googlebot` allowed | |
| `Google-Extended` allowed | |
| CDN / WAF / bot management not blocking any of the above | |
| Priority pages render server-side for non-Google crawlers | |
| Served HTML under 2MB on priority pages | |
| Search Console generative-AI opt-out is OFF | |

---

## Step 2: Pull the free first-party data

These are the only sources with first-party truth, and all three are free.

**Search Console → Performance → Generative AI.** Impressions inside AI Overviews and AI Mode, by page, country, device and date. Impressions only — no clicks, no CTR, no queries. Data starts 2026-05-18 with no backfill. **The API rejects the generative-AI type, so export is manual from the UI.** Treat AI Overviews and AI Mode as one combined channel; evidence points to them being reported together.

**Bing Webmaster Tools → AI Performance.** Total Citations, Average Cited Pages, page-level citation activity, and **Grounding Queries** — the phrasing the AI used to retrieve the page. UI only. The grounding queries are the most valuable free output in this whole audit; feed them into keyword and content work rather than filing them in a report.

**GA4.** The AI Assistant channel plus a custom channel group for the referrers it excludes. See `monitoring-tools.md` for the regex and the ordering rule.

**Server logs.** Hits per URL by each search crawler, verified against the published IP lists. A page engines never fetch cannot be cited, and no other report here will show you that.

---

## Step 3: Benchmark programmatically

DataForSEO AI Optimization is the primary benchmark. Manual testing is a spot-check on top of it, not the method.

| Endpoint | What it answers |
|---|---|
| `ai_optimization/llm_mentions` | Is the brand named for these prompts, across which engines, and **with what sentiment** |
| `ai_optimization/llm_responses` | What entity comes back for a fixed prompt set — the entity-resolution and hallucination check |
| `ai_optimization/ai_keyword_data` | AI search volume and conversational phrasing |
| `serp/google/organic/live/advanced` | Whether an AI Overview fires per keyword, and who it cites |

Run the shared client from the client folder. Use `--dry` to validate payloads at no cost. Set an explicit `limit` on Labs calls.

**Track sentiment, not only presence.** `[S]` Framing flips roughly 6.7x more often than mention presence does. A presence-only tracker misses most of the movement.

---

## Step 4: Manual query testing as a spot-check

Test 10–20 priority queries. **Log presence and absence per query on a fixed cadence** rather than treating any single run as a measurement — answers are personalized and multi-turn, so one observation is an anecdote.

| Query | Surface | AI Overview | AI Mode | ChatGPT | Perplexity | Gemini | Copilot | Cited? | Who else |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|---|
| | | | | | | | | | |

**Tag every query with its surface before testing.** `[S]` Explicitly transactional local queries fire the Local Pack around 93% of the time; informational and hybrid fire AI Overviews at 92–97%. A transactional query showing no AI Overview is not a finding — it is the expected behavior for that intent.

**Query types to cover:**
- "What is {category}" and "how does {thing} work" — informational
- "Best {category} for {use case}" — the listicle surface
- "{Brand} vs {competitor}" — comparison
- "{Category} pricing" or "how much does {service} cost" — hybrid
- "{Brand}" alone — the entity-resolution check
- "{Service} near me" and "{service} in {city}" — local, if applicable

**The most useful output is not whether you appeared.** It is **which sources were cited**. Recurring third-party sources across your queries are the mention target list, and that list is worth more than the presence tally.

---

## Step 5: Analyze citation patterns

When a competitor is cited and the client is not, identify which signal explains it.

**Test the competitor's page the same way first.** Fetch it, inspect it, score it on the same checklist. Never assert a competitive gap that has not been measured — the assumption is wrong often enough that "open ground, and the window is closing" turns out to be both more accurate and a stronger argument than "you are behind."

Signals to compare, in rough order of what actually explains gaps:

| Signal | Notes |
|---|---|
| Crawler access | Does the crawler reach their page and not yours |
| Answer-first structure | Do they lead each section with a self-contained answer |
| Fan-out coverage | Do they answer the sub-questions you skip |
| Citable specifics | Do they carry attributable claims where you carry adjectives |
| Off-site presence | Are they in the directories, listicles and unstructured citations you are not |
| Freshness | Real content change, not a timestamp bump |
| Organic rank | For AI Overviews specifically, which stay rank-coupled |
| Entity resolution | Does the engine resolve their brand cleanly and yours ambiguously |

**Not on that list, deliberately:** schema. `[S]` Adding schema to already-visible pages produced −4.6% / +2.4% / +2.2%. Check schema for correctness and entity binding, not as a citation explanation.

---

## Step 6: Content extractability check

Per priority page:

| Check | Pass/Fail |
|---|:--:|
| Every H2 is a question or direct topic | |
| Each H2 followed by a self-contained answer of roughly 40–80 words | |
| Answer blocks survive being lifted out with zero surrounding context | |
| One fact per sentence in each answer block | |
| Fan-out sub-questions for the primary query all covered | |
| At least one specific, attributable, checkable claim | |
| Tables used for comparison content | |
| Named author with real credentials | |
| Visible date reflecting a real content change | |
| Schema correct and matching visible content | |
| Every sub-answer reachable in one hop | |
| Disambiguation rule satisfied in title, H1, H2s and first paragraph, where one applies | |

**Not scored, deliberately:** word count, FAQPage schema, llms.txt presence, chunk sizes, `Speakable` beyond optional. Each is either measured at no effect or named by Google as unnecessary.

---

## Step 7: Report

Split classic and AI visibility into **two channels with separate numbers**, because Search Console now separates them.

Set expectations honestly. `[S]` Niche brands appear in roughly 11% of relevant AI answers against 73% for global household names, and AI visibility is materially harder to achieve than classic ranking. A report implying otherwise will read as a failure when it is a baseline.

**Report rules:**
- **No time or effort estimates.** Rank by impact, risk, dependency order and reversibility — "low risk, reversible, do first"; "structural, do after the render work"; "blocked by the platform change".
- **Label every statistic** `[P]`, `[S]` or `[U]`.
- **State the sample size and its limits** on any site-wide claim, and cover every template type on the site rather than a page count. Five pages of one template does not support a claim about the site.
- **Never assert an unmeasured competitive gap.**

Save to `projects/str-ai-seo/{YYYY-MM-DD}_{site-or-topic}-audit.md` and push to Notion.
