# Content inventory and audit

Self-contained reference for `str-ux-research` Mode D. The inventory is every URL. The audit is
a verdict on each one.

## Build the inventory

Sources, merged on URL:

1. Crawl of the live site, via `tool-firecrawl-scraper` or WebFetch of the top pages
2. XML sitemap, which often disagrees with the crawl. Both disagreements are findings
3. Google Search Console pages report, for impressions and clicks
4. GA4 landing pages report, for sessions and key events

Where a URL appears in one source and not another, record why. A page with sessions that is not
in the sitemap is an orphan. A page in the sitemap with no impressions at all is either new or
not indexed.

## Columns

| Column | Notes |
|--------|-------|
| URL | Full path |
| Page type | Home, service, location, product, blog, about, contact, legal, utility |
| Purpose | What job the page does, in one clause. If you cannot write one, that is the verdict |
| Primary keyword | From Search Console, the query with the most impressions landing here |
| Sessions | With the date range stated once at the top of the table |
| Conversions | Key events attributed to the page |
| Impressions and clicks | From Search Console, same range |
| Backlinks | If a backlink source is available. Drives redirect decisions |
| Last updated | Visible date or last modified |
| Verdict | Keep, rewrite, merge, cut, redirect |
| Target URL | Required for merge, cut and redirect |
| Notes | The evidence behind the verdict |

## Verdict rules

Apply in order. The first rule that matches wins.

**Keep.** Traffic or conversions, purpose is clear, content is current, and no other page
competes for the same query. Leave it alone and carry it into the new site.

**Rewrite.** The page has demand, shown by impressions, but it underperforms on clicks or
conversions, or the content is out of date. The URL survives. The content does not.

**Merge.** Two or more pages compete for the same query and none of them is strong enough alone.
Pick the URL with the strongest backlinks and history as the survivor, fold the others into it,
and redirect them. Name the survivor in the target URL column for every page being folded in.

**Cut.** No traffic, no conversions, no backlinks, no strategic purpose, and no legal
requirement to keep it. Redirect to the closest relevant parent rather than letting it 404.

**Redirect.** The page has value to preserve, backlinks or historic rankings, but the content
does not belong in the new site. Preserve the equity, drop the content.

Two guards. Never cut a page that ranks for a query the business earns money from, however thin
it looks. Never cut a legal, accessibility or regulatory page.

## Summary for the brief

The full table goes in an appendix. The brief carries the summary.

- Count by verdict, and the share of total URLs each represents
- Sessions and conversions sitting on pages marked cut or merge, which is the traffic at risk
- The redirect map size, which is the migration workload
- The content gaps, meaning top tasks from Mode C with no page serving them
- The three pages carrying the most value, which the new site must not break

## Where the audit feeds

`viz-page-architect` reads the keep and rewrite sets to know which pages exist. The gap list
becomes the new pages in the recommended page set. `str-keyword-strategy` reads the primary
keyword column and the merge decisions so two pages are not built to compete again.

Industry practice puts a meaningful share of content effort into auditing and refreshing what
already exists rather than publishing new material, because refreshed pages with existing
history outperform new pages competing from zero. Reflect that in the recommendation: rewrite
before you write.

## Sources

Checked September 2026.

- Content audit guide 2026, update, merge or delete pages, AllAble:
  https://www.allable.ai/blog/content-audit/
- Free content audit template and checklist 2026, Averi:
  https://resources.averi.ai/templates/content-audit-template
- GEO content audit template, Search Engine Land:
  https://searchengineland.com/geo-content-audit-template-462384
- SEO content audit template 2026, Web Tonic:
  https://www.webtonic.io/blog/seo-content-audit-template
- How to do a content audit in 7 steps, King Content Agency:
  https://www.kingcontentagency.com/how-to-do-a-content-audit-in-7-steps-a-practical-framework-for-2026/
