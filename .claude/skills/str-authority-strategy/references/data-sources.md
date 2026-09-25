# Data Sources

Third-party API data is available and should be used. The manual-scan-only posture is retired. Sources checked September 2026.

Substitute the brand's own domain for `{domain}`, its competitors for `{competitor}` and its name for `{brand}`. Run every command from the workspace whose `.env` should be billed, because the shared client walks the `.env` chain upward from the working directory and the nearest file wins.

## DataForSEO v3, through the shared root client

```
node <install-root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' [--out file] [--raw] [--dry]
```

From a client folder that path is `../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs`. Credentials resolve from the `.env` chain by name. **Never print or quote them.** `location_code` `2840` is the United States and `2826` is the United Kingdom. `language_code` is `"en"` unless the brand's market says otherwise.

| Endpoint | Feeds | Notes |
|---|---|---|
| `backlinks/summary/live` | Sections 3 and 4 | One target per call. Baseline rank, referring domains, anchor spread |
| `backlinks/referring_domains/live` | Section 3 | The competitor's actual link sources. Replaces the manual press-page scan |
| `backlinks/anchors/live` | Sections 3 and 4 | Branded-anchor share is the signal that matters at 0.527, not raw link count |
| `backlinks/competitors/live` | Section 3 | Finds domains sharing referring domains with the site, surfacing competitors SERP analysis misses |
| `backlinks/bulk_ranks/live` | Section 3 | Cheap side-by-side rank across the whole named competitor set in one call |
| `content_analysis/search/live` | Sections 8.1 and 8.2 | Web-wide brand-mention discovery, linked and unlinked, with page type and sentiment fields |
| `ai_optimization/llm_mentions/live` | Sections 8.3 and 8.4 | Whether the brand is named across ChatGPT, Google AI Overviews, Gemini, Claude and Perplexity, with sentiment and source references. Priced per request plus per row, so cap the prompt set |
| `ai_optimization/llm_responses/live` | Section 8.4 and Section 1 | Custom prompts, for the hallucination re-test loop and the entity check |
| `serp/google/organic/live/advanced` | Section 1 | Brand-name query rank check, replacing incognito searching |

Payload examples. `--dry` prints the request and spends nothing.

```bash
# Section 3, competitor referring domains
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs backlinks/referring_domains/live \
  '{"target":"{competitor}","limit":100,"order_by":["rank,desc"],"backlinks_status_type":"live"}' \
  --out projects/str-authority-strategy/data/refdomains-{competitor-slug}.json

# Section 3, bulk rank across the named competitor set
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs backlinks/bulk_ranks/live \
  '{"targets":["{domain}","{competitor 1}","{competitor 2}"]}'

# Section 4, own anchor profile and branded-anchor share
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs backlinks/anchors/live \
  '{"target":"{domain}","limit":100,"backlinks_status_type":"live"}'

# Section 8, brand-mention discovery across the web
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs content_analysis/search/live \
  '{"keyword":"{brand}","search_mode":"as_is","limit":50,"page_type":["news","blogs","message-boards","organization"]}' \
  --out projects/str-authority-strategy/data/mentions-{YYYY-MM-DD}.json

# Section 8.3, per-engine mentions with sentiment
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/llm_mentions/live \
  '{"keyword":"{brand}","limit":50}' --dry
```

## Spend guard, mandatory

The account is pay-as-you-go with a small balance.

- Run `--dry` first on any payload you have not run before, and check that the endpoint sub-path resolves. **AI Optimization sub-paths move between vendor releases.** Confirm against `https://docs.dataforseo.com/v3/ai_optimization/overview/` before the first paid call.
- **Never send a Backlinks, Labs or Content Analysis call without an explicit `limit`.** 100 is the working default. 1000 is a deliberate decision.
- Check the balance with `appendix/user_data` before a batch.
- Every call appends endpoint, status and cost to `.dataforseo-usage.log` in the working directory. Reconcile after each run and record the total in the output's `data_sources`.
- **Cap the LLM mentions call to a fixed prompt set per run.** It is priced per request plus per row and is the easiest way to overspend.
- Never retry a failing paid call in a loop.

## Supporting sources

**Google Search Console.** Use the domain property in `sc-domain:` form. Resolve the property and access method from `brand_context/` or the workspace `AGENTS.md`. Where a workspace has helper scripts, check first whether they carry hardcoded OAuth credentials. **Any script holding hardcoded tokens must be scrubbed to `.env` and its tokens rotated before anyone other than its author runs it.** Report the blocker rather than editing the script. The generative-AI report is UI only, impressions only, with no clicks, no queries and no API.

**Bing Webmaster Tools, AI Performance.** UI only. Grounding queries are real AI retrieval phrasings. Feed them into Section 6 pitch angles and the Section 8 prompt sets.

**A second SERP provider.** Key resolved from the `.env` chain by name, on a paid plan with a shared monthly allowance. Use it for spot SERP checks, never as the primary evidence base.

**WebSearch and live checks.** Valid as a spot-check, never as the primary evidence base and never as the basis for a figure in the output.

**Third-party AI-visibility reports.** Optional input with no freshness gate. If a report exists on disk, ingest its competitor-cited-instead URLs and any hallucination matrix. If not, the AI Optimization endpoints are the primary AI-visibility benchmark.

## Confidence labels

Any statistic reaching the output carries `[P]` primary documentation, `[S]` named study with a stated sample, or `[U]` unverified, per the landscape file's key. A `[U]` figure never becomes a scored rule or a client-facing fact.
