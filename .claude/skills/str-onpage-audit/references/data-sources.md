# Data Sources and Page Discovery

Reference for `str-onpage-audit` Steps 2 and 3. Every payload here was shape-tested with `--dry` on 2026-09-02.

## The shared DataForSEO client

The client is root-owned so no client-folder sync can wipe it:

```
node <install-root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' [--out file] [--raw] [--dry]
```

Run it **from the workspace whose account should be billed**. The credential loader walks the `.env` chain from the working directory upward and the nearest `.env` wins, so the working directory decides both the account and where the runtime caches resolve. From a client folder that path is `../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs`.

Credentials are `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`, read by name. **Never print, echo or quote a credential value.** Every call appends endpoint, task status and cost to `.dataforseo-usage.log` in the working directory.

### Spend guard, mandatory

Accounts are typically pay-as-you-go on a small balance. Before any paid call:

1. Run it with `--dry` first and check the payload shape. `--dry` costs nothing.
2. Put an explicit `limit` on every Labs call. Never omit it.
3. Rendered-page, content-parsing and Lighthouse endpoints are billed per URL. Audit Tier 1 first and extend only once the run is confirmed useful.
4. Read the running total in `.dataforseo-usage.log` before a site-wide sweep, and state the expected call count to the user before firing it.
5. Any sweep over 40 URLs needs explicit user confirmation. Unit prices are in the landscape file, not from memory.

### Verified payloads

Rendered page, meta, headings, canonical, schema presence and load timing. The backstop for the bespoke extractor:

```
node <root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/instant_pages \
  '{"url":"https://example.com/","enable_javascript":true,"enable_browser_rendering":true,"load_resources":true}' \
  --out projects/str-onpage-audit/data/home-instant.json
```

Per-section parsed content. This makes answer-block scoring measurable rather than eyeballed:

```
node <root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/content_parsing/live \
  '{"url":"https://example.com/some-page/","markdown_view":true}' \
  --out projects/str-onpage-audit/data/some-page-content.json
```

Core Web Vitals, mobile:

```
node <root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/lighthouse/live/json \
  '{"url":"https://example.com/","for_mobile":true,"categories":["performance"]}' \
  --out projects/str-onpage-audit/data/home-lighthouse.json
```

AI-visibility recency benchmark, brand mentions with sentiment and source references:

```
node <root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/llm_mentions/live \
  '{"keyword":"<brand name>","llm_name":"chat_gpt","date_from":"2026-08-01"}' \
  --out projects/str-onpage-audit/data/mentions-chatgpt.json
```

Entity-resolution probe for the brand-disambiguation gate. Ask an engine directly and read which entity comes back:

```
node <root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/llm_responses/live \
  '{"user_prompt":"<a real customer question in the brand category and location>","llm_name":"gemini","model_name":"gemini-2.5-pro","web_search":true}' \
  --out projects/str-onpage-audit/data/entity-probe.json
```

Cannibalisation evidence, ranked keywords for the domain, always with a `limit`:

```
node <root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs dataforseo_labs/google/ranked_keywords/live \
  '{"target":"example.com","location_code":2840,"language_code":"en","limit":1000}' \
  --out projects/str-onpage-audit/data/ranked.json
```

Location code 2840 is the United States. Resolve the right code for other markets from the locations endpoint rather than guessing.

## Other sources

- **Google Search Console.** Use whatever Search Console access the workspace has configured, resolving credentials from `.env` by name and reading the site's verified property. Confirm which property type is verified before quoting anything from it, since a domain property and a URL-prefix property can report differently. Where the workspace has no configured client, accept a manual export and label every figure taken from it as a manual read.
- **Search Console generative-AI report** is UI-only. Impressions only, no clicks, no click-through rate, no queries, no API, no backfill before 2026-05-18. Any AI-surface impression figure in an audit is a manual read and must be labelled as one.
- **Bing Webmaster Tools AI Performance**, including grounding queries, is UI-only. Accept it as a manual paste when the user has it.
- **GA4** cannot attribute AI Mode or AI Overviews traffic. Those links carry `noreferrer` and the sessions land in organic search. Never promise AI Mode attribution in an audit.
- **Third-party AI-visibility reports** are optional. Ingest one if a fresh report is present in the workspace. Never gate the audit on it and never flag its absence as a blocker. A freshness gate that nobody owns fails silently.
- **Web search and live SERP checks** stay valid as spot-checks, never as the primary data source.

## Refresh triggers

Quarterly by default, plus: a new AI-visibility benchmark run, a refresh of either foundation doc, a named Google core or spam update, post-deploy verification of a major page batch, or a hallucination-correction re-test cycle.

## Page discovery per framework

Enumerate every page from the codebase, then cross-reference against the tier mapping in `target-keywords.md`.

| Stack | Where routes live | Where page content lives |
|---|---|---|
| Next.js App Router | `src/app/**/page.tsx`, plus dynamic route enumeration through `generateStaticParams` | Block or page data modules, blog data modules, programmatic location or variant data modules |
| Next.js Pages Router | `pages/**/*.tsx` | Same, plus MDX content directories |
| Astro, SvelteKit, Nuxt | The framework's routes or pages directory, plus content collections | Content collection front matter and body files |
| A headless CMS of any kind | Routes render from CMS entries, so the route list alone undercounts | Query the CMS for the published entry list. A CMS entry with no code trace is still a live page |
| Static site generators | Source content directory | The same files |

Flag both directions of drift: a page live on the site but absent from the keyword map, and a page in the keyword map but not live. Both are coverage gaps, not scoring failures.
