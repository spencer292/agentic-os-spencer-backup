# Harvest Passes A to F

Six passes. DataForSEO is the primary source, a second SERP provider is a cross-check, and Bing grounding queries are a manual input. Payload shapes checked September 2026 against `https://docs.dataforseo.com/v3/`.

Save every raw response under `projects/str-question-harvester/data/{YYYY-MM-DD}/` with `--out` before any processing, so a re-cluster never costs a second API call.

All calls run through the shared client, from the workspace whose `.env` should be billed:

```
node <install-root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' --out <file>
```

From a client folder that path is `../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs`. Add `--dry` to inspect a request without spending. `location_code` `2840` is the United States and `2826` is the United Kingdom. Look any other market up through `serp/google/locations` rather than guessing. `language_code` is `"en"` unless the brand's market says otherwise.

---

## Pass A: People Also Ask and AI Overview presence, per seed

Endpoint `serp/google/organic/live/advanced`. One call per seed. The advanced result carries the `people_also_ask` element **and** tells you whether an `ai_overview` element fired, which is the surface tag every downstream recommendation needs.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs serp/google/organic/live/advanced \
  '{"keyword":"{seed}","location_code":2840,"language_code":"en","device":"desktop","depth":20,"people_also_ask_click_depth":2}' \
  --out projects/str-question-harvester/data/{YYYY-MM-DD}/serp-{seed-slug}.json
```

Extract per seed:

| From | Field | Use |
|---|---|---|
| `people_also_ask` items | `title`, `expanded_element[].description`, `expanded_element[].url`, `expanded_element[].domain` | The question, Google's answer text, and the source currently winning it |
| `ai_overview` item | presence, `references[].domain` and `.url` | Surface tag for the seed, and who AI Overviews cites for it |
| `local_pack` item | presence | Marks the seed Local-Pack-fired. Route to the local SEO skill, not the content queue |
| `organic` items | `domain` of the top 10 | Competitor set for the cluster |
| `related_searches` item | `items[]` | Seed-expansion candidates for the next run |

`people_also_ask_click_depth` of 2 expands each box one level, where most of the fan-out signal lives. Raise it only when a cluster comes back thin, because it increases cost per call.

If `people_also_ask` is absent, log the seed as "no PAA" and keep the AI Overview, organic and related-searches data. A seed with an AI Overview and no People Also Ask is still a fan-out target.

---

## Pass B: question-shaped expansion with volume

Endpoints `dataforseo_labs/google/keyword_suggestions/live` and `dataforseo_labs/google/related_keywords/live`. This is the demand axis. Without it, "frequency" only means how many seeds surfaced a question, which is a property of the harvest rather than of the market.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs dataforseo_labs/google/keyword_suggestions/live \
  '{"keyword":"{cluster pillar keyword}","location_code":2840,"language_code":"en","include_seed_keyword":true,"limit":100,"filters":[["keyword_info.search_volume",">",10]],"order_by":["keyword_info.search_volume,desc"]}' \
  --out projects/str-question-harvester/data/{YYYY-MM-DD}/suggest-{cluster}.json
```

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs dataforseo_labs/google/related_keywords/live \
  '{"keyword":"{cluster pillar keyword}","location_code":2840,"language_code":"en","depth":2,"limit":100}' \
  --out projects/str-question-harvester/data/{YYYY-MM-DD}/related-{cluster}.json
```

Run these at **cluster-pillar level, not per seed**. One suggestions call and one related call per cluster. Keep `limit` at 100 and raise it only for a cluster that comes back thin.

Keep the question-shaped rows, meaning those starting who, what, why, how, when, where, can, do, does, is, are, should or will. Carry `keyword_info.search_volume`, `keyword_info.competition` and `keyword_properties.keyword_difficulty` onto every matching harvested question. `related_keywords` at `depth` 2 replaces the second provider's related searches, with volume attached.

---

## Pass C: intent classification

Endpoint `dataforseo_labs/google/search_intent/live`. Batch the deduplicated question list, up to 1000 keywords per task. This replaces a crude how-what-why flag with a real intent label, and it is the same classification `str-keyword-strategy` uses, so the two documents stay comparable.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs dataforseo_labs/google/search_intent/live \
  '{"keywords":["{question 1}","{question 2}"],"language_code":"en"}' \
  --out projects/str-question-harvester/data/{YYYY-MM-DD}/intent.json
```

Informational and hybrid questions are this skill's content queue. Anything classified commercial or transactional is a service-page or local-surface concern. Tag it and hand it on rather than queuing a post.

---

## Pass D: AI search volume

Endpoint `ai_optimization/ai_keyword_data/keywords_search_volume/live`. Conversational phrasings barely register in typed-search tools. This endpoint returns AI search volume for the last month plus a 12-month trend.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/ai_keyword_data/keywords_search_volume/live \
  '{"keywords":["{question 1}","{question 2}"],"location_code":2840,"language_code":"en"}' \
  --out projects/str-question-harvester/data/{YYYY-MM-DD}/ai-volume.json
```

Batch the whole deduplicated question list. **Never sample it.** At $0.0001 per keyword it is the cheapest signal in the run, capped at 1000 keywords per task.

**What the number is.** DataForSEO calculates AI search volume from statistical data in People Also Ask questions, as the estimated frequency with which a keyword is used in questions people may ask AI tools. It is modelled, not observed AI usage, so it carries a `[U]` confidence label in client-facing output. Checked September 2026 against `https://docs.dataforseo.com/v3/ai_optimization-ai_keyword_data-keywords_search_volume-live/`.

A question with low classic volume and high AI search volume is a **priority signal, not a weak one**. Demand has moved to an answer surface. Flag those explicitly.

---

## Pass E: second-provider cross-check, optional

Run a subset of seeds, typically the cluster pillars, through a second SERP provider to confirm People Also Ask depth independently and to collect the two fields DataForSEO does not surface as cleanly.

```
GET https://serpapi.com/search.json?engine=google&q={keyword}&gl={country}&hl={language}&api_key={key from .env by name}
```

Take `related_questions` and compare against Pass A. **A large divergence means one provider's SERP snapshot is stale. Note it, do not silently merge.** Take `related_searches` and `discussions_and_forums`. The forum threads feed the ICP phrasing bank, not the content queue.

Spend goes against a monthly allowance shared with every other skill using the provider. Record the searches this run consumed and the remaining allowance from the pre-flight check.

---

## Pass F: Bing grounding queries, manual

Bing Webmaster Tools, AI Performance, Grounding Queries lists the phrasings Copilot and Bing AI actually used to retrieve pages on the site. **UI only, there is no API**, so ask the user to export or paste them.

These outrank People Also Ask in evidence quality. People Also Ask is a proxy for fan-out. Grounding queries are observed retrieval. Merge them into the question bank tagged `source: bing-grounding`, and where a grounding query has no matching People Also Ask question, treat it as a confirmed gap regardless of its score.

For completeness: Google Search Console's generative AI report is impressions only, UI only, and has no API. It cannot supply query-level AI data. Do not plan a step around it.

---

## Cost model and error handling

The shared client prints the actual cost of every call to stderr and appends it to `.dataforseo-usage.log` in the working directory. **Reconcile that log at the end of the run and put the real total in the report. Do not estimate.**

Every Labs call in this skill specifies a `limit`. A call that returns far more rows or costs far more than expected had its limit omitted or set too high.

If a call fails, log the endpoint and the seed and continue. Report every failure at the end with its status so the operator decides whether to retry. **Never retry a paid call in a loop.**

Tag every harvested question with the cluster id of the seed that produced it, the seed itself, its provider, and the surface the seed fired.
