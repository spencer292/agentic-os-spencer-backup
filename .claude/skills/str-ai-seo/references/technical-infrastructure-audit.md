# Technical Infrastructure Audit

The foundation underneath every AI SEO signal. If infrastructure fails, nothing else matters — schema in code doesn't help if the bot never sees it, citations don't help if the page loads in 8 seconds.

---

## Contents

- Rendering and indexability
- Core Web Vitals as AI ranking input
- Canonicals and duplicate content
- Internal linking as citation signal
- Sitemap hygiene
- IndexNow for Bing / Copilot
- `llms.txt` drafting
- HTTPS, security headers, HSTS
- Redirect chains and link equity

---

## Rendering: SSR vs CSR (the #1 silent killer)

AI bots read rendered HTML. They do not execute JavaScript the way browsers do. If your site is a client-side SPA (React, Vue, Angular) without server-side rendering, your pages can look perfect in a browser and invisible to GPTBot, PerplexityBot, and ClaudeBot.

**Bot support for JavaScript rendering (2026 state):**

| Bot | JS Rendering | Notes |
|-----|:--:|-------|
| Googlebot (including AIO) | Yes (two-wave indexing) | Waits up to 5s; complex JS can still fail |
| Bingbot (Copilot) | Partial | Simple JS only |
| GPTBot | No | Reads static HTML only |
| ChatGPT-User | No | Reads static HTML only |
| PerplexityBot | No | Static HTML only |
| ClaudeBot | No | Static HTML only |
| Google-Extended | Yes | Same as Googlebot |

**Implication:** if your site is CSR-only, you're visible to Google AIO but invisible to every other AI system. Ship SSR or static generation (Next.js app router SSR, Remix, Astro, 11ty, Hugo) before any other AI work.

**Render-check command pattern:**
```bash
node -e "fetch('{URL}',{headers:{'User-Agent':'GPTBot/1.0'}}).then(r=>r.text()).then(t=>{console.log('Size:',t.length);console.log('H1:',/<h1[^>]*>([\\s\\S]*?)<\\/h1>/.exec(t)?.[1]);console.log('JSON-LD:',(t.match(/application\\/ld\\+json/g)||[]).length)})"
```

Run this on 5-10 priority pages with GPTBot, PerplexityBot, ClaudeBot user agents. Any that return markedly less content than a browser view = render failure.

---

## Core Web Vitals as AI ranking input

Page experience is not directly an AI ranking factor on every platform, but it gates citation on the ones that matter most.

**Hard thresholds (2026 data):**
- **Copilot:** hard 2.0-second load threshold. Bingbot deprioritizes slower pages. Verify with WebPageTest using a Bing-adjacent geography.
- **Google AIO:** LCP < 2.5s, INP < 200ms, CLS < 0.1 (same as Core Web Vitals). Degraded CWV lowers citation probability on AIO by ~15-20% per internal Google analyses.
- **ChatGPT / Perplexity:** no direct CWV weighting, but timeouts on slow pages mean the bot gives up. 10+ second timeouts are common.

**Action:** measure with PageSpeed Insights + WebPageTest. If LCP > 2.5s or CLS > 0.1 on cornerstone pages, fix before optimizing other pillars. INP issues usually come from third-party scripts (analytics, chat widgets, ad tags) — audit + defer.

---

## Canonicals and duplicate content

AI systems cite the canonical URL if one is declared; otherwise they split citation weight across duplicates. Three failure modes:

1. **www vs non-www inconsistency** — different canonicals on different pages, or canonicals pointing to the redirect target instead of the final URL.
2. **Trailing slash inconsistency** — `/page` vs `/page/` canonical on different templates.
3. **Staging/preview URLs indexed** — test subdomains without `noindex` get crawled and split citation.

**Audit steps:**
- Crawl with Screaming Frog; filter for pages where canonical ≠ page URL
- Verify `rel="canonical"` present on every page
- Check `Vercel preview`, `staging.`, `dev.` subdomains have `X-Robots-Tag: noindex` headers
- Confirm HTTPS canonicals — mixed http/https canonicals split citation

---

## Internal linking as citation signal

AI systems weight topical authority heavily. Topical authority = consistent linking from a well-structured internal hub-spoke.

**Pattern that works:**
- **Pillar hub** (e.g. `/ai/`) — overview + links to all cluster content
- **Cluster content** — blog posts, guides, cornerstones all linking back to the hub + to each other where relevant
- **Anchor text variety** — avoid exact-match keyword stuffing; use natural phrases

**Audit:**
- Each cornerstone should have ≥3 inbound internal links from cluster content
- Each pillar hub should link to ≥8 cluster pieces
- Orphan pages (zero inbound internal links) = essentially invisible to AI topical authority calculations
- Check for hub dilution — if every blog post links to 30+ pages, the PageRank-equivalent signal weakens

Tools: Screaming Frog, Ahrefs Site Audit, ContentKing, or DIY via `next-sitemap` + custom crawler.

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

IndexNow is a ping protocol that tells Bing, Yandex, and several smaller engines about URL changes immediately instead of waiting for a crawl. Microsoft Copilot relies on Bing's index, so IndexNow meaningfully accelerates Copilot citation for fresh content.

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

**Impact:** fresh content gets indexed in Bing within hours instead of days. Directly correlates with faster Copilot citation.

---

## `llms.txt` drafting

Emerging standard (llmstxt.org, adopted by Anthropic, OpenAI-partner sites, a growing list). Not yet a ranking factor, but provides a single curated index of your content for AI systems. Low cost to add, forward-compatible.

**Format:**

```markdown
# {Site Name}

> {One-sentence site summary — what the site offers, who it's for}

{2-3 sentence context paragraph about the organization}

## {Section: e.g. Core content}

- [Page title](https://domain.com/url): One-sentence description
- [Page title](https://domain.com/url): One-sentence description

## {Section: Blog / Research}

- [Article title](https://domain.com/url): One-sentence description

## Optional

- [Nice-to-have page](https://domain.com/url): One-sentence description

## About

- [About](https://domain.com/about): Who we are
- [Contact](https://domain.com/contact): How to reach us
```

**Host at:** `https://{domain}/llms.txt` (exact filename, root path).

**What to include:**
- Pillar hubs, cornerstones, definitive guides
- About, contact, author bio pages
- Research/data assets
- Book / product pages for authors / SaaS

**What to exclude:**
- Shallow blog posts, news, utility pages (login, checkout)
- Draft content
- Date-stale content unless critical

Keep under ~100 entries. Quality curation, not comprehensive.

---

## HTTPS and security headers

- HTTPS mandatory — HTTP-only sites get downranked/de-indexed across all AI systems
- HSTS header (`Strict-Transport-Security`) — signals long-term HTTPS commitment
- Content-Security-Policy — no direct AI ranking impact but reduces injection attacks that can blacklist your domain

---

## Redirect chains and link equity

Every redirect hop loses ~15% of the originating signal. A chain of 3 redirects passes ~60% of equity.

**Audit:**
- Find redirect chains via Screaming Frog ("Response Codes → Redirect Chains")
- Flatten to single-hop where possible (A → C instead of A → B → C)
- Ensure legacy URLs 301 to canonical, not 302 (302 = temporary, doesn't pass equity reliably)
- Check sitemap doesn't list redirecting URLs

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

### IndexNow
- Implemented: {yes/no}
- Last ping: {date}

### llms.txt
- Present: {yes/no}
- Entry count: {number}

### Score: {pillar score /100}
```
