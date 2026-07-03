# Discovery Patterns by Framework

How to find every internal link in a codebase, organized by framework. Start with the framework that matches the project, then check cross-framework patterns at the bottom.

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
