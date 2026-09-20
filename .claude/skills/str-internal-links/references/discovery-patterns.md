# Discovery Patterns

How to build the link graph. **The live crawl is the primary source; the codebase is the cross-check.** Start with section 0, then use the framework patterns to attach a file path to every edge the crawl found.

---

## 0. Live crawl — DataForSEO On-Page (primary source)

Run every command from the client folder (`clients/got-moles/`) so `.env` and `.dataforseo-usage.log` resolve. Credential values are never printed by the shared client and must never be echoed.

### Spend guard — read before the first live call

The account is pay-as-you-go on a small balance and On-Page bills per page crawled.

```bash
# balance check, before anything else
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs appendix/user_data

# inspect the exact request without spending anything
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/task_post '{...}' --dry
```

- `max_crawl_pages` is mandatory on every crawl. Never omit it.
- `load_resources: false` and `enable_javascript: false` for a link-graph crawl. Both multiply cost and neither is needed for the anchor graph.
- `store_raw_html`, `check_spell` and `calculate_keyword_density` off — other skills own those.
- Reconcile the run against `.dataforseo-usage.log` afterwards and put the spend in the audit frontmatter.
- Prices are in `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` §10. Do not quote a price from memory.

### The crawl flow

```bash
# 1. post the task
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/task_post \
  '{"target":"got-moles.com","max_crawl_pages":180,"load_resources":false,"enable_javascript":false,"store_raw_html":false,"check_spell":false,"calculate_keyword_density":false}' \
  --out projects/str-internal-links/data/onpage-task.json

# 2. poll until crawl_progress is "finished" — a partial crawl invents orphans
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/summary/<TASK_ID>

# 3. pull results (each is a POST carrying the task id)
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/pages \
  '{"id":"<TASK_ID>","limit":1000}' --out projects/str-internal-links/data/pages.json

node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/links \
  '{"id":"<TASK_ID>","limit":1000,"filters":[["link_from","like","%got-moles.com%"]]}' \
  --out projects/str-internal-links/data/links.json

node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/redirect_chains \
  '{"id":"<TASK_ID>","limit":1000}' --out projects/str-internal-links/data/redirects.json

node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/non_indexable \
  '{"id":"<TASK_ID>","limit":1000}' --out projects/str-internal-links/data/non-indexable.json

# duplicate_content is per-URL — it needs a "url" field as well as the task id
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/duplicate_content \
  '{"id":"<TASK_ID>","url":"https://got-moles.com/mole-control-tacoma/","limit":100}'
```

Page the edge list with `limit` and `offset` until it is exhausted. Save every response under `projects/str-internal-links/data/` so a re-score does not re-spend.

### Field mapping — crawl result to audit pillar

| Endpoint | Field | Feeds |
|---|---|---|
| `on_page/pages` | `url`, `status_code`, `click_depth` | Link Depth (use directly, do not re-derive a BFS) |
| `on_page/pages` | `internal_links_count`, `external_links_count` | Orphan Pages (zero inbound), Link Equity Flow (dilution) |
| `on_page/pages` | `canonical`, `meta` | Step 6.5 cannibalisation, canonical-vs-link-graph disagreement |
| `on_page/links` | `link_from`, `link_to` | The edge list. Every pillar |
| `on_page/links` | `text` | Anchor Text — diversity, brand presence, disambiguation guard |
| `on_page/links` | `type` | Contextual vs template classification |
| `on_page/links` | `dofollow` | Nofollow internal links (should be zero outside login/cart) |
| `on_page/links` | `is_broken` | Broken internal links — report the measured count |
| `on_page/redirect_chains` | full record | Internal links resolving through a hop |
| `on_page/non_indexable` | `url`, `reason` | Inbound links pointing at pages that cannot be cited |
| `on_page/duplicate_content` | similarity records | Step 6.5 detection, and the doorway signal on city pages |

### Provenance reconciliation

Label every edge before scoring:

| Provenance | Meaning | Action |
|---|---|---|
| Both | In the crawl and in the source | Normal. Fixable, file path known |
| Crawl only | Renders live, no source edge found | Usually CMS-seeded Lexical richtext. Find the real source of truth before proposing an edit, or the next reseed wipes the fix |
| Source only | In the code, absent from the live HTML | A defect. Behind JS, inside a lazy block, in dead code, or on a page the crawl could not reach. The site is not shipping a link it thinks it ships |

Report the divergence count in the audit. A high crawl-only count means the codebase is not the source of truth for links, and every apply-fix must route through the seed script rather than the data file.

**Degraded mode.** If the crawl cannot run, the codebase patterns below still produce a graph — but the report opens with a banner naming the degradation and the score is labelled provisional. Never present a code-only score as measured.

---

## Next.js (App Router)

### Route Discovery

Scan for all `page.tsx` files under `app/`:
```
app/(frontend)/page.tsx              → /
app/(frontend)/about/page.tsx        → /about
app/(frontend)/reviews/page.tsx      → /reviews
app/(frontend)/[slug]/page.tsx       → dynamic routes
```

Also check:
- `layout.tsx` files — contain navigation links (header, footer)
- `not-found.tsx` — may contain recovery links
- Dynamic route params — read from data files (city-data.ts, etc.)

### Link Sources in Next.js

| Source | Where to find | Link format |
|--------|--------------|-------------|
| Navigation | `layout.tsx`, `Header.tsx`, `Nav.tsx` | `<Link href="/path">` |
| Footer | `Footer.tsx`, `layout.tsx` | `<Link href="/path">` |
| Breadcrumbs | Component or layout | `<Link href="/path">` |
| Page body (code) | `page.tsx`, block components | `<Link href="/path">`, `<a href="/path">` |
| Page body (CMS) | pages-data.ts, richText fields | Lexical JSON link nodes, or href in block data |
| Blog content | blog-data.ts, MDX files, CMS | Markdown links, Lexical JSON |
| City data | city-data.ts | `nearbyAreas` arrays, service references |
| Redirects | next.config.ts, redirects.ts, middleware.ts | redirect rules (not links, but affect link graph) |
| Schema/JSON-LD | schema.tsx, page components | `url` fields in structured data |
| Sitemap | sitemap.ts or sitemap.xml | URLs included/excluded |

### Payload CMS Specifics

For sites using Payload CMS with Next.js:

- **Block data files** (e.g., pages-data.ts) — search for `href`, `url`, `link`, `slug` fields in block objects
- **RichText fields** — Payload uses Lexical editor. Link nodes in Lexical JSON look like:
  ```json
  { "type": "link", "fields": { "url": "/path", "linkType": "internal" } }
  ```
- **Seed scripts** — check what data gets seeded to CMS (may differ from code-level data)
- **Relationship fields** — `type: 'relationship'` fields may create implicit links between content

### Key Files to Read (Got Moles specific)

| File | What it contains |
|------|-----------------|
| `site/src/lib/pages-data.ts` | All page block data with links |
| `site/src/lib/city-data.ts` | 59+ cities with nearbyAreas cross-links |
| `site/src/lib/blog-data.ts` | Blog post content with internal links |
| `site/src/lib/redirects.ts` | 291+ redirects mapping old → new URLs |
| `site/src/components/layout/` | Header, Footer, Nav with site-wide links |
| `site/src/components/blocks/` | All block components (CTABlock, etc.) |
| `site/src/app/(frontend)/` | All page routes |

---

## General Patterns (All Frameworks)

### Grep Patterns for Links

```bash
# Next.js Link components
grep -r "href=" --include="*.tsx" --include="*.ts" --include="*.jsx"

# Anchor tags
grep -r "<a " --include="*.tsx" --include="*.jsx"

# CMS/data link fields  
grep -r '"href"' --include="*.ts" --include="*.json"
grep -r '"url"' --include="*.ts" --include="*.json"
grep -r '"link"' --include="*.ts" --include="*.json"

# Lexical richText link nodes
grep -r '"linkType"' --include="*.ts" --include="*.json"
```

### What NOT to Count as Internal Links

- External links (different domain)
- Anchor links (#section-id on same page)
- JavaScript onclick handlers without href
- Links inside `<noscript>` tags
- Links in comments or disabled code
- mailto: and tel: links
- Links to static assets (images, PDFs, etc.)

### What to Flag but Not Count

- Links behind JavaScript (Google may not follow)
- Links in lazy-loaded content (may not be discovered by crawlers)
- Links in search/filter results (dynamic, not in static HTML)
- Links that require form submission to reveal
