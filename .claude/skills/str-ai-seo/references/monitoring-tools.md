# Monitoring AI Visibility

How to track presence in AI-generated answers, and how to measure the traffic that follows.

**Posture: free and first-party first, then DataForSEO. No SaaS AI-visibility seat.** Search Console, Bing Webmaster Tools, GA4 and the DataForSEO AI Optimization API cover the need at a fraction of the cost of a commercial platform. See `search-landscape-2026-09.md` §10 for pricing and sourcing.

---

## What to track

| Metric | What it measures | Source |
|---|---|---|
| AI Overview and AI Mode impressions | Whether Google's AI surfaces show the site at all | Search Console → Performance → Generative AI (UI only) |
| Copilot and Bing AI citations | Citation count and which pages | Bing Webmaster Tools → AI Performance (UI only) |
| Grounding queries | The phrasing the AI actually used to retrieve the page | Bing Webmaster Tools → AI Performance (UI only) |
| Brand mention rate per engine | Is the brand named for a given prompt | DataForSEO `ai_optimization/llm_mentions` |
| Citation sentiment | How the engine frames the brand when it names it | DataForSEO `ai_optimization/llm_mentions` |
| Share of voice against competitors | Brand mentions versus named competitors on the same prompt set | DataForSEO `ai_optimization/llm_mentions` |
| Entity resolution | Which entity the engine returns for "what is {brand}" | DataForSEO `ai_optimization/llm_responses` |
| AI search volume | Demand in conversational phrasing, which typed-search tools do not carry | DataForSEO `ai_optimization/ai_keyword_data` |
| AI Overview presence per keyword | Whether an AI Overview fires and who it cites | DataForSEO `serp/google/organic/live/advanced` → `ai_overview` element |
| AI referral sessions | Traffic arriving from answer engines | GA4 AI Assistant channel plus a custom channel group |
| AI crawler activity | Which pages the engines actually fetch | Server logs, verified against published crawler IP lists |

---

## Tier 1 — free and first-party

Do these before spending anything. They are the only sources with first-party truth.

### Search Console → Performance → Generative AI

The primary AI visibility metric for Google's surfaces. Impressions inside AI Overviews and AI Mode, broken down by page, country, device and date.

**Limits, and state them in every report:**
- Impressions only. No clicks, no CTR, no queries.
- Data starts 2026-05-18 with no backfill.
- **The Search Console API rejects the generative-AI type.** Export is manual, from the UI. Never write a step that expects this data from the API.
- Evidence points to AI Overviews and AI Mode being reported as one combined grouping rather than separate rows. Treat it as a single AI channel.

**Never enable the generative-AI opt-out** for a site that wants visibility. It applies collectively across AI Overviews, AI Mode and AI Overviews in Discover, with no per-feature control, and Google states opted-out sites receive no traffic or impressions from those features.

### Bing Webmaster Tools → AI Performance

Public preview since 2026-02-10. Total Citations, Average Cited Pages, page-level citation activity, visibility trends across Copilot and Bing AI summaries, and **Grounding Queries**.

Grounding queries are the single most valuable free input in this stack: real retrieval phrasing, not modeled search volume. Feed them directly into keyword and content work rather than treating them as a reporting curiosity.

UI only. This is a manual input to any skill that needs it.

### GA4

The native **AI Assistant** channel recognizes ChatGPT, Gemini, Deepseek, Copilot and Grok referrers via `medium = ai-assistant`. It is not retroactive.

**Google's own AI surfaces are excluded.** AI Overviews and AI Mode clicks land in `google / organic`.

Add a custom channel group placed **above** Referral in evaluation order, to catch Perplexity, Claude and the rest:

```
chatgpt\.com|chat\.openai\.com|openai\.com|perplexity\.ai|claude\.ai|
gemini\.google\.com|copilot\.microsoft\.com|bing\.com/chat|
you\.com|poe\.com|grok\.com|meta\.ai|deepseek\.com|phind\.com
```

**AI Mode adds `noreferrer` to outbound links and AI Overviews frequently does the same. AI Mode and AI Overview traffic cannot be isolated in GA4.** Never promise AI Mode attribution to a client. A meaningful share of genuine AI referrals also arrives with no referrer at all and lands in Direct, so never present an AI referral count as a complete number.

### Server logs

The retrieval side, which no referral report can show. Count hits per URL by `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Bingbot` and Googlebot, verified against each vendor's published crawler IP list rather than the user-agent string alone:

```
openai.com/searchbot.json
openai.com/gptbot.json
perplexity.com/perplexitybot.json
claude.com/crawling/bots.json
```

A page engines never fetch cannot be cited, and that failure is invisible in every other report here.

### Triangulation

No clean AI attribution exists, so build the picture from three numbers:

1. Search Console generative-AI impressions — the AI-side numerator.
2. Search Console web impressions and clicks — the classic baseline.
3. GA4 `google / organic` — landed traffic.

**A widening gap between rising impressions and flat clicks is the AI-answer signature.** Report it as that, not as a traffic loss of unknown cause.

**For a phone-led business, call tracking is the real measurement layer.** Distinct tracked numbers per surface — website, Google Business Profile, paid — are the only way to see where calls originate, and that matters more as call buttons erode on some surfaces.

---

## Tier 2 — DataForSEO AI Optimization

The programmatic layer, and the primary AI-visibility benchmark for this skill. Run through the shared client:

```
node <root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' [--out file] [--dry]
```

Run it from the client folder so the right `.env` and runtime caches resolve. `--dry` validates a payload at no cost. Every call logs its cost to `.dataforseo-usage.log`. Set an explicit `limit` on Labs calls.

| Endpoint | Returns | Engines |
|---|---|---|
| `ai_optimization/llm_mentions` | Brand, domain and keyword mentions with sentiment, citation tracking, source references, snippets | ChatGPT, Google AI Overviews, Gemini, Claude, Perplexity |
| `ai_optimization/ai_keyword_data/keywords_search_volume` | AI search volume for the last month, 12-month trend, phrasing patterns | ChatGPT, Google AI Overviews |
| `ai_optimization/llm_responses` | Structured responses to a custom prompt set, with system instructions | ChatGPT, Gemini, Claude |
| `ai_optimization/llm_scraper` | Real-time data from live AI interfaces, brand entity extraction | ChatGPT, Gemini |
| `serp/google/organic/live/advanced` | The `ai_overview` element — presence and cited sources per keyword | Google |

**Two patterns worth standing up:**

- **A fixed prompt set on a cadence.** LLM Responses is cheap enough per prompt to ask every engine the same 20–30 questions repeatedly — "what is {brand}", "who does {service} in {city}", the category questions the ICP would ask — and record which entity and which sources come back. This is how entity resolution and hallucination get measured rather than assumed.
- **A recurring mention scan.** LLM Mentions answers "is the brand named for these prompts, and how is it framed" across all five engines in one call, with sentiment. **Track sentiment, not only presence** — framing flips far more often than mention presence does.

Prices are in `search-landscape-2026-09.md` §10.2. AI Keyword Data is cheap enough per keyword that AI search volume is effectively free at small scale.

---

## Tier 3 — commercial AI-visibility platforms

**Skip them.** Otterly, Peec AI, Semrush AI Toolkit, Profound and Ahrefs Brand Radar all sell what Tier 1 and Tier 2 already deliver. All circulating pricing for these is `[U]` — aggregated from comparison posts, not vendor pages. If a client insists on one, verify pricing on the vendor's own page before quoting it, and be explicit about what it adds over the free stack, which is usually reporting convenience rather than data.

---

## Manual query testing

Still valid, but as a **spot-check on top of the programmatic sources, never as the method**. Results are personalized and multi-turn, so a single observation is an anecdote.

When you do it: log presence and absence per query on a fixed cadence, record which sources were cited rather than only whether the brand appeared, and note the date and the engine. A recurring third-party source in the results is a mention target, which is the most useful thing manual testing produces.

---

## Cadence

- **Monthly:** Search Console generative-AI impressions, Bing AI Performance including grounding queries, GA4 AI channel, the LLM Mentions prompt set.
- **Quarterly:** the full re-audit, plus a re-check of this file's parent landscape reference.
- **On any named Google core or spam update:** re-baseline before drawing conclusions from a movement.

Set expectations honestly in whatever the deliverable is. Niche brands appear in roughly 11% of relevant AI answers `[S]`, and AI visibility is materially harder to achieve than classic local or organic ranking. A monitoring report that implies otherwise will read as a failure when it is a baseline.
