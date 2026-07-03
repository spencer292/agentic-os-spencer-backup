# Live-vs-Corpus Audit — 2026-04-25

**Question:** For every URL in the keyword corpus, does the new build resolve it correctly, render the right content, and protect the ranking signal that put it in the corpus?

**Method:** Top-40 highest-value URLs (sorted by top-3 keyword count) probed against staging via Googlebot UA. For each:
1. HTTP chain (status, final URL after redirects)
2. `<title>` length + content
3. `<h1>` content
4. Word count (thin-content flag <600)
5. JSON-LD schema block count
6. Sample-keyword presence in body text (5 highest-ranked keywords per URL)

Raw data: `live-vs-corpus_2026-04-25.json`. Reproduce: `node _live-vs-corpus.mjs`.

---

## Findings

### 🚨 Critical (fixed in `4a999fd`)

**`/what-do-moles-eat` was 404.** This URL holds **102 ranked keywords** (the highest-volume informational URL). Cause: comment in `redirects.ts` claimed the post was migrated as `urlPattern='legacy-root'` rendering at the bare URL, but the DB shows `urlPattern='blog'` (renders at `/blog/what-do-moles-eat`). The Pattern-1 hand-mapped redirect was deliberately omitted based on the stale comment. Without the redirect, all 102 ranked keywords would 404 on DNS flip. **Re-added the redirect** + corrected the comment with reproduction steps.

### 🔧 Title bloat — duplicated brand (fixed in `4a999fd`)

Every page was rendering with duplicated brand:
```
Bellevue Mole Control | Proven Results | Got Moles | Got Moles
```
Cause: per-page titles already included "Got Moles" AND the layout's `metadata.title.template = '%s | Got Moles'` appended it again. Across the top 40 URLs, **22 city pages had titles >60 chars** (Google truncates ~60 chars on mobile SERP).

Fixed approach: kept the layout template, stripped trailing/leading "Got Moles" from per-page titles. Result: every page still renders brand exactly once, but at <60 chars on the priority pages.

Pages edited: `[citySlug]` template (90 city pages), `/about`, `/contact`, `/reviews`, `/service-areas`, `/blog`, `/blog/[slug]`, `/services/total-mole-control-program`, `/services/commercial-mole-control`, `/services/one-time-mole-removal`.

### ✅ Confirmed clean across all top-40 URLs

- **HTTP chain:** all top-40 URLs resolve to 200 after at most 2 hops (trailing-slash strip → canonical → 200). Zero 4xx in the corpus's high-value list except the now-fixed `/what-do-moles-eat`.
- **Schema density:** 4-6 JSON-LD blocks per template (Organization + Breadcrumb + LocalBusiness/Service/CollectionPage as appropriate + WebPage + FAQPage). City pages all show 6.
- **Word count:** all top-40 URLs are 800-1,800 words (no thin-content flags except the now-fixed 404).
- **H1:** present and topical on every URL probed.

### 🟡 Non-blocking observations

**Sample-keyword presence:** the audit reported "0/5 keywords found in body" on most city pages. This is a measurement artifact, not a content gap. The sample keywords are exact phrases like `"burien ground moles"` and the audit checks substring match. The page text has "Burien" and "ground moles" as separate tokens but rarely the exact phrase. Replacing the substring check with token-overlap would resolve. **Verified manually:** Burien city page contains both "Burien" and "ground moles" — content is fine, the audit method needs refinement.

**Long page titles for blog post slugs:** the `/blog/[slug]/page.tsx` fallback is `${title} | Mole Control Blog` + ` | Got Moles` template = often 70-85 chars. Each blog post can override via `seo.metaTitle` in CMS — recommend Spencer/Roy run a one-off pass on the 35 blog posts and set short metaTitles where the natural H1 is >40 chars. Not launch-blocking.

## Methodology — re-running the audit

After DNS flip:
1. Update `STAGING` constant in `_live-vs-corpus.mjs` to `https://got-moles.com`
2. Run `node _live-vs-corpus.mjs`
3. Anomaly section at the end of output flags any new issues
4. Compare top-3/top-1 deltas against the corpus in `keyword-corpus-raw.json`

The audit can also be run weekly during the first month post-launch as part of the GSC Coverage monitoring loop in `LAUNCH-CHECKLIST.md`.

## Action items

| Item | Status | Commit |
|---|---|---|
| Re-add `/what-do-moles-eat` redirect | shipped | `4a999fd` |
| Strip duplicated brand from per-page titles | shipped | `4a999fd` |
| Trim service-page titles below 60 chars | shipped | `4a999fd` |
| Refine sample-keyword presence check (token overlap not substring) | non-blocking — test methodology |
| Per-post `seo.metaTitle` pass on 35 blog posts | post-launch — Spencer/Roy |
