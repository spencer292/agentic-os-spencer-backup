# Technical Infrastructure Audit

The foundation underneath every AI SEO signal. If infrastructure fails, nothing else matters — schema in code doesn't help if the bot never sees it, and citations don't help if the crawler times out.

**Crawlability is the first check in the whole audit, not the last.** `[S]` 73% of sites have a crawlability issue preventing AI access — robots.txt blocks, CDN restrictions, JavaScript-render dependence (Otterly, 1M+ citations, January–February 2026). It is the highest-return technical item and it costs nothing to fix.

Dated claims here defer to `search-landscape-2026-09.md`, which wins on any conflict.

---

## Contents

- The crawler allowlist
- Rendering and indexability
- JavaScript payload limits
- Core Web Vitals
- Canonicals and duplicate content
- Internal linking as a fan-out signal
- Sitemap hygiene
- IndexNow for Bing / Copilot
- HTTPS, security headers, HSTS
- Redirect chains

---

## The crawler allowlist

**Allow unconditionally:**

```
User-agent: OAI-SearchBot      # ChatGPT search — this is the one that matters
User-agent: PerplexityBot      # Perplexity search
User-agent: Claude-SearchBot   # Claude search quality
User-agent: Bingbot            # Copilot via Bing; Bing indexation is a hard prerequisite
User-agent: Googlebot          # Google, including AI Overviews and AI Mode
Allow: /
```

**Also allow `Google-Extended`.** `[P]` It is a Gemini **training** opt-out, not a Search or AI Overviews opt-out. Google states it "manages whether content Google crawls from their sites may be used for training future generations of Gemini models" and that it does not affect Search ranking. **Blocking it does not remove pages from AI Overviews or AI Mode.** Blocking it buys nothing and costs training presence.

**Recommend allowing `GPTBot` and `ClaudeBot` too.** These are training crawlers, and they are a separate decision from search. Blocking them does not remove the site from any search surface, but off-site brand presence correlates strongly with AI visibility, which makes presence in training corpora an asset rather than a cost. If a client insists on blocking them, that is a defensible business choice — just be clear it does not affect citation.

**The only real AI opt-out is the Search Console generative-AI toggle**, and it should never be enabled for a site that wants visibility. It applies collectively across AI Overviews, AI Mode and AI Overviews in Discover, with no per-feature control.

**Do not audit robots.txt and stop there.** CDN rules, WAF rules and bot-management products block AI crawlers just as effectively and are invisible in robots.txt. That is where most of the 73% failure rate actually lives. Check the edge configuration, and verify against each vendor's published crawler IP list rather than trusting a user-agent string:

```
openai.com/searchbot.json
openai.com/gptbot.json
perplexity.com/perplexitybot.json
claude.com/crawling/bots.json
```

`[U]` Google reportedly added a `Google-Agent` user agent in March 2026 for AI systems browsing on a user's behalf, which by design ignores robots.txt. Secondary sources only; the crawler documentation does not surface it. Do not build policy on it.

---

## Rendering: SSR vs CSR

AI crawlers read what the server returns. A client-side-rendered application without server-side rendering or static generation can look perfect in a browser and near-empty to a crawler that does not execute JavaScript.

Googlebot renders JavaScript through a deferred second pass; complex bundles can still fail. **The non-Google crawlers should be assumed not to render JavaScript** unless their operator documents otherwise, and none of them documents doing so.

**Implication:** a CSR-only site is at best partially visible to Google and effectively invisible to every other engine. Ship server-side rendering or static generation before any other AI work — nothing downstream in this skill matters until the content is in the served HTML.

**Render check:** fetch each priority page with each search crawler's user agent and compare the returned HTML against the browser view. Any page returning markedly less content, a missing H1, or missing JSON-LD is a render failure.

```bash
node -e "fetch('{URL}',{headers:{'User-Agent':'OAI-SearchBot/1.0'}}).then(r=>r.text()).then(t=>{console.log('Size:',t.length);console.log('H1:',/<h1[^>]*>([\\s\\S]*?)<\\/h1>/.exec(t)?.[1]);console.log('JSON-LD:',(t.match(/application\\/ld\\+json/g)||[]).length)})"
```

Run it with `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot` and `Bingbot` across 5–10 priority pages covering **every template type on the site**, not 5–10 pages of the same template.

DataForSEO `on_page/instant_pages` and `on_page/content_parsing` give the same picture at scale and are the better tool once more than a handful of pages are in scope.

---

## JavaScript payload limits

`[P]` Googlebot file limits, clarified February 2026: the first **2MB of HTML**, the first 64MB of PDFs, and the first 2MB of other supported types. A separate 15MB default applies across Google's wider crawler infrastructure. This was a documentation relocation rather than a new restriction, but it is now explicit.

**Practical effect: very large JavaScript bundles risk incomplete rendering.** Content that sits beyond the fetch limit is simply not there as far as the crawler is concerned.

**The check:** flag any page whose served HTML exceeds 2MB, and any page whose critical rendering depends on bundles that push past those limits. A page can pass a render check on a fast connection and still truncate for the crawler.

---

## Core Web Vitals

`[P]` **Unchanged: LCP, INP, CLS.** No new metric and no INP replacement has been announced.

**Weight INP highest.** `[S]` It is the most commonly failed metric, with roughly 43% of sites over the 200ms threshold. INP problems usually come from third-party scripts — analytics, chat widgets, tag managers, ad tags. Audit and defer them.

Thresholds: LCP under 2.5s, INP under 200ms, CLS under 0.1.

**On per-engine speed claims: there aren't any credible ones.** The previously stated "Copilot enforces a hard 2.0-second load threshold" and "degraded Core Web Vitals lower AI Overview citation probability by 15–20%" both traced to unsourced trade content and are removed. What remains true is unglamorous: a crawler that times out fetches nothing, and page experience is a ranking input on the classic surface that AI Overviews are coupled to. That is sufficient reason to fix it without inventing a threshold.

**Measure** with PageSpeed Insights, or DataForSEO `on_page/lighthouse` at scale.

---

## Canonicals and duplicate content

AI systems cite the canonical URL if one is declared; otherwise they split citation weight across duplicates. Three failure modes:

1. **www vs non-www inconsistency** — different canonicals on different pages, or canonicals pointing to the redirect target instead of the final URL.
2. **Trailing slash inconsistency** — `/page` vs `/page/` canonical on different templates.
3. **Staging/preview URLs indexed** — test subdomains without `noindex` get crawled and split citation.

**Audit steps:**
- Crawl and filter for pages where the canonical does not equal the page URL. Use DataForSEO `on_page/task_post` for the crawl and `on_page/pages` and `on_page/duplicate_content` for the results
- Verify `rel="canonical"` is present on every page
- Check that preview, staging and dev subdomains carry `X-Robots-Tag: noindex` headers
- Confirm HTTPS canonicals — mixed http/https canonicals split the signal

`[P]` Google clarified canonicalization re-evaluation timeframes in July 2026. A canonical change is not instant; do not diagnose a failure from a single post-change crawl.

---

## Internal linking as a fan-out signal

`[P] Google names internal linking directly` in its generative-AI guidance: "use internal linking effectively" appears in the official guide. Cite Google here rather than inferring it.

**The reason it matters has changed.** The old rationale was equity flow and topical authority. The current rationale is **query fan-out**: an AI system decomposes one prompt into sub-queries and retrieves against each, so the site has to make every sub-answer reachable.

**The pattern that works:**
- **Hub built around a fan-out set**, not around a name. A cost page, a methods page, a seasonality page and a prevention page linked as a cluster covers what a fan-out on that topic would generate.
- **Every sub-answer reachable in one hop** from the page that ranks.
- **Informational pages link to transactional pages.** They win on different surfaces, and the informational ones are what AI Overviews cite.
- **Anchor text carries the brand sometimes, not just the keyword.** `[S]` Branded anchors correlate 0.511–0.628 with AI visibility, above Domain Rating. Treat anchor text as a brand signal as well as a relevance signal.

**Anti-pattern: rings of near-duplicate pages cross-linking to each other.** Location pages linking sideways into a ring cover no additional fan-out and look like a doorway network. They link **up** to hubs and **out** to genuinely distinct proof.

**Audit:**
- Orphan pages — zero inbound internal links — are effectively invisible
- Every cornerstone carries several inbound links from its cluster
- Every hub links out across its cluster
- Check for dilution: a page linking to dozens of others distributes very little to any of them
- **Check fan-out coverage, not just link counts:** for each primary query, is every sub-answer one hop away

**Crawl it, don't infer it from the codebase.** A code-only reading misses links injected by the CMS at render time. Use a live crawl as the primary source and the codebase as a cross-check.

---

## Sitemap hygiene

AI bots often find new content via sitemap.xml faster than via crawl.

**Checks:**
- `sitemap.xml` referenced in `robots.txt` (`Sitemap: https://...`)
- All indexable pages present
- `<lastmod>` dates are accurate and update when content changes
- No `noindex` pages in sitemap
- No 404 or 301-redirecting URLs in sitemap
- Split large sitemaps (>50k URLs or >50MB) into a sitemap index
- Submit to Google Search Console AND Bing Webmaster Tools — many sites forget Bing

---

## IndexNow for Bing / Copilot

IndexNow is a ping protocol that tells participating engines about URL changes immediately instead of waiting for a crawl.

**`[P]` Google does not support IndexNow.** Participants are Bing, Yandex, Naver, Seznam, Yep and Amazon. It is worth doing for Bing, which is a hard prerequisite for Copilot citation, and it does nothing for Google. `[U]` on whether it materially raises citation odds — implement it, label the benefit unmeasured.

**Implementation:**
1. Generate a key (32+ char hex string) — host at `https://{domain}/{key}.txt`
2. POST to `https://api.indexnow.org/indexnow` on every publish/update:
   ```json
   {
     "host": "yourdomain.com",
     "key": "{your-key}",
     "keyLocation": "https://yourdomain.com/{your-key}.txt",
     "urlList": ["https://yourdomain.com/new-or-updated-page"]
   }
   ```
3. Hook into your CMS publish workflow. For Next.js on Vercel, a webhook from Payload/Sanity → Vercel serverless function → IndexNow POST works cleanly.

**Effect:** faster Bing indexing for new and updated content, which is the prerequisite for Copilot citation.

---

## llms.txt — do not build one

**This is a deliberate non-recommendation, and it replaces a full drafting guide that used to sit here.**

`[P]` Google, Search Central, 2026-06-15: llms.txt files "aren't required for Google Search visibility or rankings," and it is "completely fine" to maintain one for other systems that use such files. `[P]` OpenAI, Anthropic and Perplexity crawler documentation covers robots.txt only and never mentions llms.txt. `[U] and probably false:` claims that Anthropic and Perplexity publicly confirmed llms.txt support trace to a single vendor page with no citations, sample sizes or methodology.

**No engine documents consuming it.** The previous version of this file described it as an emerging standard "adopted by Anthropic and OpenAI-partner sites," which was not supportable.

**The rules:**
- Do not recommend building one.
- Do not score one in an audit, in either direction.
- **Do not present it as a hallucination-correction surface.** There is no evidence any engine reads it, which makes it the worst possible place to put a correction.
- **If a site already has one, leave it.** It is harmless, and removing it is churn.

The same applies to AI-specific Markdown mirrors of pages and AI-specific rewriting passes — `[P]` Google names both as unnecessary.

---

## HTTPS and security headers

- HTTPS mandatory — HTTP-only sites get downranked/de-indexed across all AI systems
- HSTS header (`Strict-Transport-Security`) — signals long-term HTTPS commitment
- Content-Security-Policy — no direct AI ranking impact but reduces injection attacks that can blacklist your domain

---

## Redirect chains

The "every hop loses ~15% of the signal" figure has no traceable source and is removed. Google has stated that PageRank is not lost through 301 redirects. What chains reliably cost is **crawl efficiency and correctness**: hops consume crawl budget, they slow the fetch for crawlers that time out, and long chains are where redirect loops and dropped destinations hide.

That is reason enough to flatten them without inventing a decay percentage.

**Audit** with DataForSEO `on_page/redirect_chains`:
- Flatten to a single hop where possible — A to C rather than A to B to C
- Legacy URLs use 301, not 302
- No redirecting URLs listed in the sitemap
- No chains ending in a 404 or a loop

`[P]` Site move guidance was expanded in June 2026 for domain variants. Check it before any large-scale redirect work.

---

## Report format for this pillar

```markdown
## Technical Infrastructure

### Rendering
- SSR status: {full / partial / CSR-only}
- Bots tested: {list}
- Render-check results: {pass/fail per bot}

### Core Web Vitals (priority pages)
| Page | LCP | INP | CLS | Status |
|------|:--:|:--:|:--:|:--:|

### Canonicals
- www/non-www consistency: {pass/fail}
- Canonical coverage: {% of pages with correct canonical}
- Issues flagged: {list}

### Internal linking
- Orphan pages: {count}
- Average inbound links per cornerstone: {number}
- Hub-spoke integrity: {pass/fail}

### Sitemap
- {checks from list above}

### IndexNow (Bing only — Google does not participate)
- Implemented: {yes/no}
- Last ping: {date}

### Score: {pillar score /100}
```

**Report rules:** no time or effort estimates — rank by impact, risk, dependency order and reversibility. Label every statistic `[P]`, `[S]` or `[U]`. State the sample size and its limits for any site-wide claim, and cover every template type on the site rather than a page count.
