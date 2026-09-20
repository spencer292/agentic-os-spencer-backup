# Data Sources

First-party data is truth. Third-party APIs cover everything first-party data cannot see. Sources checked September 2026.

There is no reason to refuse third-party keyword data on the grounds that a site blocks crawler user agents in `robots.txt`. That block controls who crawls the site. It has nothing to do with querying a keyword or SERP API that never touches the site.

Substitute the brand's own domain for `{domain}` and its competitors for `{competitor}` throughout. Run every command from the workspace whose `.env` should be billed, because the DataForSEO client walks the `.env` chain upward from the working directory and the nearest file wins.

---

## 1. Google Search Console, first-party truth

Use the **domain property** in `sc-domain:` form. Where a workspace also has a URL-prefix property, confirm it is verified before using it. An unverified prefix property returns nothing and looks like a data gap.

Resolve the property and the access method from `brand_context/` or the workspace `AGENTS.md`. Where a workspace has helper scripts, reference them by their real path and check first whether they carry hardcoded OAuth credentials. **Any script holding hardcoded tokens must be scrubbed to `.env` and its tokens rotated before anyone other than its author runs it.** If it has not been, report the blocker rather than editing the script.

Pull 90 days by query, then by page.

**The generative-AI report is UI only.** It shows impressions inside AI Overviews and AI Mode by page, country, device and date, from 2026-05-18 with no backfill. There are no clicks, no click-through rate and **no queries**, and the API rejects the generative-AI type. AI-surface query data cannot be exported from Search Console. Record it manually as a page-level AI-impression baseline and never script it.

Never enable the Search Console generative-AI opt-out for a site that wants visibility. It applies collectively across AI Overviews, AI Mode and AI Overviews in Discover with no per-feature control.

---

## 2. DataForSEO v3, demand, rank, difficulty, intent, SERP shape and AI volume

The shared client is root-owned so a client-folder sync cannot delete it.

```
node <install-root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' [--out <file>] [--raw] [--dry]
```

From a client folder that path is `../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs`.

Credentials are `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`, resolved from the `.env` chain. **Never print, echo or quote a credential value.** Every call appends endpoint, status and cost to `.dataforseo-usage.log` in the working directory.

`location_code` `2840` is the United States and `2826` is the United Kingdom. `language_code` is `"en"`. For any other market, and for city-level SERP shape, look the code up rather than guessing:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs serp/google/locations '' --raw | grep -i "<place>,<country>"
```

### The call set for a full build or remap

`--dry` prints the exact request and spends nothing. Use it on any payload shape you have not run before.

| Purpose | Endpoint | Payload shape | Cap |
|---|---|---|---|
| What the site already ranks for, with URL | `dataforseo_labs/google/ranked_keywords/live` | `{"target":"{domain}","location_code":2840,"language_code":"en","limit":1000,"order_by":["ranked_serp_element.serp_item.rank_group,asc"]}` | `limit` 1000 |
| Competitor ranked sets | same endpoint, per competitor | `{"target":"{competitor}","location_code":2840,"language_code":"en","limit":300}` | `limit` 300, top 5 competitors |
| Demand the site is missing | `dataforseo_labs/google/keyword_ideas/live` | `{"keywords":["{head term 1}","{head term 2}"],"location_code":2840,"language_code":"en","limit":500}` | `limit` 500 |
| Long tail off a head term | `dataforseo_labs/google/keyword_suggestions/live` | `{"keyword":"{head term}","location_code":2840,"language_code":"en","limit":300}` | `limit` 300 |
| Semantic neighbours | `dataforseo_labs/google/related_keywords/live` | `{"keyword":"{head term}","location_code":2840,"language_code":"en","depth":2,"limit":200}` | `depth` 2 |
| Difficulty | `dataforseo_labs/google/bulk_keyword_difficulty/live` | `{"keywords":[...],"location_code":2840,"language_code":"en"}` | 1000 keywords per task |
| Machine intent label | `dataforseo_labs/google/search_intent/live` | `{"keywords":[...],"language_code":"en"}` | 1000 keywords per task |
| Head-to-head keyword overlap | `dataforseo_labs/google/domain_intersection/live` | `{"target1":"{domain}","target2":"{competitor}","location_code":2840,"language_code":"en","limit":300}` | one competitor per call |
| Who actually shares the footprint | `dataforseo_labs/google/competitors_domain/live` | `{"target":"{domain}","location_code":2840,"language_code":"en","limit":20}` | `limit` 20 |
| The site's strongest pages | `dataforseo_labs/google/relevant_pages/live` | `{"target":"{domain}","location_code":2840,"language_code":"en","limit":100}` | `limit` 100 |
| Visibility trend | `dataforseo_labs/google/historical_rank_overview/live` | `{"target":"{domain}","location_code":2840,"language_code":"en"}` | once per run |
| Classic search volume | `keywords_data/google_ads/search_volume/live` | `{"keywords":[...],"location_code":2840,"language_code":"en"}` | 1000 keywords per task |
| Volume across a whole site footprint | `keywords_data/google_ads/keywords_for_site/live` | `{"target":"{domain}","location_code":2840,"language_code":"en"}` | once per run |
| **AI search volume** | `ai_optimization/ai_keyword_data/keywords_search_volume/live` | `{"keywords":[...],"location_code":2840,"language_code":"en"}` | 1000 keywords per task |
| Live SERP shape, AI Overview plus Local Pack plus People Also Ask in one call | `serp/google/organic/live/advanced` | `{"keyword":"{keyword}","location_code":2840,"language_code":"en","device":"desktop","depth":20,"people_also_ask_click_depth":1}` | one keyword per task, top 30 priority keywords |
| Local pack detail, brands with locations only | `serp/google/local_finder/live/advanced` | `{"keyword":"{keyword}","location_code":2840,"language_code":"en","depth":20}` | priority cities only |
| Account balance, free | `appendix/user_data` | none | before and after every run |

**AI search volume is modelled, not observed.** DataForSEO calculates it from statistical data in People Also Ask questions, as the estimated frequency with which a keyword is used in questions people may ask AI tools. Price is $0.0001 per keyword with a 1000-keyword cap per task, so it is affordable across a whole priority set. It carries a `[U]` confidence label in any client-facing output. Checked September 2026 against `https://docs.dataforseo.com/v3/ai_optimization-ai_keyword_data-keywords_search_volume-live/`.

Brand-mention and per-engine LLM endpoints belong to `str-authority-strategy`, not here.

### Spend guard

Set the cap for the run before starting and enforce it.

1. Call `appendix/user_data` first and record the balance.
2. Run the Labs and Keywords Data pulls, which are the cheap bulk layer. **Never omit `limit`.**
3. Run per-keyword SERP calls last, and only for the top 30 priority keywords, because they are the expensive per-task layer.
4. Re-check `appendix/user_data` and reconcile against `.dataforseo-usage.log`. If the run has consumed the cap, stop and report what is missing rather than continuing.

Never retry a failing paid call in a loop.

---

## 3. Google Ads Keyword Planner, optional volume source

The root `ops-google-ads` skill ships a read-only historical-metrics puller on Google Ads API v24.

```
node <install-root>/.claude/skills/ops-google-ads/scripts/keyword-metrics.mjs <geoConstant> [keywordsFile]
```

`geoConstant` is `2840` for the United States and `2826` for the United Kingdom. `keywordsFile` is a newline-delimited keyword list. Credentials are the `GOOGLE_ADS_*` variables in the `.env` chain, and the requesting account is only the API caller, because volumes are geography and language driven rather than account data. Run it from the workspace whose `.env` should resolve.

**Caveat, and it matters.** Keyword Planner returns **rounded buckets**, not exact counts, and the buckets widen at low volume. Treat it as a cross-check on DataForSEO volume and a free second opinion on relative scale, never as the precise figure in a client-facing table. Where two sources disagree, record both with their source names.

Use it when the workspace already has Google Ads credentials, when the DataForSEO balance is tight, or when a paid-search team is working from Planner numbers and the organic map should reconcile against them.

---

## 4. Bing Webmaster Tools grounding queries, manual input

The AI Performance report has been in public preview since 2026-02-10. **UI only, no API.** Its Grounding Queries panel shows the phrasing Copilot and Bing AI actually used to retrieve a page. That is real retrieval phrasing rather than modelled volume, and no keyword tool produces it.

Ask the user to export or screenshot the grounding queries for the top 20 pages. Treat every one as a candidate keyword row tagged `surface: AI Mode` or `surface: multi`, sourced `Bing grounding queries {date}`. If the report is unavailable, record the gap in `data_sources` rather than silently skipping it.

---

## 5. SerpAPI, optional second SERP opinion

Key `SERPAPI_API_KEY` in the `.env` chain, on a paid plan with a monthly search allowance shared across every skill that uses it. Use it when a DataForSEO SERP result looks wrong, or when `str-question-harvester` has already pulled People Also Ask for the same keyword and the two should agree. It is never the primary source.

---

## 6. WebSearch and manual SERP checks

Valid as a spot-check on a handful of queries. Never the primary data source, and never the basis for a volume, difficulty or rank figure in the output.

---

## 7. GA4

The AI Assistant channel exists but **excludes Google's own AI surfaces**, and AI Mode links carry `noreferrer`. **Never promise AI Mode attribution.** Measurement belongs to `str-ai-seo` and the local SEO skills, not to this one.

---

## 8. Third-party AI-visibility reports

Optional. If a vendor report exists on disk, read it as one more opinion. DataForSEO AI Optimization is the primary AI-visibility benchmark. Never gate a run on a third-party report's freshness.
