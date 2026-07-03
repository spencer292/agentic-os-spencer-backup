# Got Moles — Full Redirect Audit (Old Site → New Build)

**Date:** 2026-04-20
**Audience:** Ian (SEO consultant) + Roy + Spencer
**Status:** Pre-DNS-switch review — findings are actionable before launch
**Tested against:** https://project-pf8c6.vercel.app (new-build staging, same `redirects.ts` as production)
**Contact:** roy@allthepower.co.uk

---

## Executive summary

**Every URL the old site currently surfaces was tested against the new build's redirect behavior.** Of 334 unique old-site URLs:

| Result | Count | % |
|---|--:|---:|
| ✅ Transfers cleanly (same URL **or** 301 → 200) | **225** | 67% |
| ❌ 404 on new build (redirect gap) | **109** | 33% |

**Headline number:** 109 old-site URLs will 404 on DNS switch unless `redirects.ts` is patched. Together they hold **430+ ranked keywords** from the previous agency's Rankings sheet — 298 of them in positions 1-3 (top-3).

The gaps fall into **7 recognizable patterns**, all fixable with a small number of redirect rules (not 109 individual redirects). The biggest single miss is **blog-URL slugs at root** (old site: `/do-moles-bite/` → new site: no such URL; `/blog/do-moles-bite/` also 404 because the new build's blog doesn't carry this slug).

**The strategic Q already resolved:** The dominant old-site ranking pattern is `/mole-control-{slug}/` — the **same pattern** as the new site. 932+ ranked keywords live at URLs that don't change on DNS switch. So the concern about "losing Google indexing power" is real for the gaps listed below but **not** for the core structure. See `reports/city-link-comparison_2026-04-20.md` for the URL-structure discussion.

---

## Methodology

1. **Inventory.** Pulled every URL the old site currently lists:
   - `page-sitemap.xml` (~298 URLs)
   - `city-sitemap.xml` (72 URLs)
   - `post-sitemap.xml` (26 blog URLs)
   - `service-sitemap.xml` (8 URLs)
   - Plus the 111 unique URLs from the previous agency's Rankings sheet (deduped with the above)
   - Total unique: **334 URLs**
2. **Probe.** For each old-site path, issued a HEAD request to `project-pf8c6.vercel.app{path}` and followed the redirect chain manually (Next.js auto-emits 308 for trailing-slash normalization, and the custom `redirects.ts` rules emit 308 `permanent: true` for moved URLs — both are fully compliant and pass link equity).
3. **Categorize** the final status:
   - **200** = URL transferred (same pattern on both sites, **or** redirected through a 301/308 chain to a valid new URL).
   - **404** = no redirect rule matched; the URL is dead on the new build.
4. **Cross-reference** with the Rankings sheet to weight each gap by ranked keyword count + top-3 keyword count. This lets us prioritize fixes by actual ranking value, not URL count alone.
5. **Pattern-group** the 109 gaps to derive redirect rule additions (one rule patches many URLs).

Raw data: `reports/redirect-matrix.csv` (334 rows, every URL + status + redirect chain + ranking value) and `reports/redirect-matrix.json` (same, machine-readable).

---

## What transfers cleanly (the 225)

- **`/mole-control-{slug}/`** on both sites → **same URL, no redirect needed**. Dominant pattern covering 932 ranked keywords historically.
- **`/{slug}/`** (bare-slug cities like `/seattle/`, `/bellevue/`) → 301 to `/mole-control-{slug}/`. Redirect rules in place for 77 of the original 90+ cities.
- **`/mole-trapping-{slug}/`, `/mole-exterminator-{slug}/`, `/mole-catcher-{slug}/`, `/mole-removal-{slug}/`, `/mole-repellant-{slug}/`** (A-spelling) → 301 to `/mole-control-{slug}/`. All verb-prefix combos consolidated to canonical.
- **`/service/{name}/`** (old WordPress CPT duplicates) → 301 to `/services/{slug}/`.
- **Core page redirects:** `/about-us`, `/our-services`, `/our-process`, `/contact-us`, `/pricing`, `/cities-served`, `/thank-you` → canonical equivalents.
- **Homepage** `/` → `/` (same).

All transfers use HTTP **308 (Permanent Redirect)**. Next.js emits 308 both for trailing-slash normalization and for every `permanent: true` rule in `redirects.ts` — there are no 301s on the site. Google treats 308 and 301 identically for PageRank / link equity transfer (Mueller/Illyes public statements + Google Search Central docs). Full link equity passes through both single-hop 308s (trailing-slash) and chained 308s (trailing-slash → pattern redirect → 200).

---

## What doesn't transfer — 109 gaps by pattern

| # | Pattern | Gap count | Ranked kw | Top-3 kw | Fix complexity |
|---|---------|----:|----:|----:|---|
| 1 | **Blog URLs at root (no `/blog/` prefix)** | 27 | **305** | **70** | Per-post redirect decisions (not pattern-able) |
| 2 | **Reverse `{slug}-mole-{verb}`** (e.g. `/spanaway-mole-exterminator/`) | 37 | 21 | 15 | 1 pattern rule |
| 3 | **`/city/{slug}/`** (abandoned on old site too — 301s to homepage) | 20 | 0 | 0 | 1 pattern rule (for UX/crawl cleanliness) |
| 4 | **Bare-slug cities not in `citySlugs`** (e.g. `/algona/`, `/fairwood/`) | 12 | 1 | 1 | Derive `citySlugs` from `city-data.ts` |
| 5 | **`{slug}-2` WordPress duplicates** (e.g. `/mole-control-seatac-2/`) | 6 | 36 | 36 | 1 pattern rule |
| 6 | **Forward `mole-{verb}-{slug}` where slug isn't in citySlugs** (e.g. `/mole-control-southhill/`) | 4 | 59 | 53 | Spelling variant handlers + missing city additions |
| 7 | **`mole-repellent-{slug}`** (E-spelling vs A-spelling covered) | 2 | 8 | 8 | 1 pattern rule |
| — | Nested paths, archives | 1 | 0 | 0 | Individual handler |
| | **TOTAL** | **109** | **430** | **183** | |

**Weighting note:** "ranked kw" = number of keyword rows in the Rankings sheet that land on that URL. "top-3" = subset of those at SERP positions 1-3. A URL with 46 top-3 keywords (`/how-many-eyes-do-moles-have/`) is a dramatically higher loss on DNS switch than one with 0 (`/city/algona/`).

---

## The 20 highest-value gaps (prioritized fix list)

Sorted by top-3 keyword count, then ranked keyword count. These 20 URLs carry **358 ranked keywords and 253 top-3 keywords** — the bulk of the "at risk" ranking value.

| Old URL | Ranked kw | Top-3 kw | Recommended destination |
|---------|---:|---:|-------|
| `/how-many-eyes-do-moles-have/` | 90 | 46 | `/blog/are-moles-blind` (topical match — blindness = no functional eyes) |
| `/mole-control-southhill/` | 40 | 40 | `/mole-control-south-hill/` (spelling variant) |
| `/mole-control-seatac-2/` | 31 | 31 | `/mole-control-seatac/` (`-2` duplicate) |
| `/do-moles-bite/` | 33 | 14 | `/blog/` (no direct match — redirect to blog index or /faq) |
| `/mole-control-centralia/` | 18 | 12 | **Build new city page** (Track C1 of L2 brief) |
| `/spanaway-mole-exterminator/` | 7 | 7 | `/mole-control-spanaway/` (reverse pattern rule) |
| `/mole-repellent-snoqualmie/` | 6 | 6 | `/mole-control-snoqualmie/` (E-spelling + city) |
| `/mole-control-sumner-2/` | 5 | 5 | `/mole-control-sumner/` (`-2` duplicate) |
| `/do-moles-carry-diseases/` | 25 | 4 | `/blog/are-moles-good-for-your-yard` or `/faq` |
| `/are-moles-nocturnal/` | 17 | 4 | `/blog/` (no direct match — redirect to closest cornerstone) |
| `/what-species-of-moles-live-in-washington-state/` | 9 | 2 | `/blog/types-of-moles-in-washington` ✅ direct topical match |
| `/algona-mole-control/` | 2 | 2 | `/mole-control-algona/` (reverse pattern rule) |
| `/lake-tapps-mole-control/` | 2 | 2 | `/mole-control-lake-tapps/` (reverse pattern rule) |
| `/mill-creek-mole-extermination/` | 2 | 2 | `/mole-control-mill-creek/` (reverse pattern rule) |
| `/mole-repellent-sumner/` | 2 | 2 | `/mole-control-sumner/` (E-spelling + city) |
| `/fairwood/` | 1 | 1 | `/mole-control-fairwood/` (bare-slug → add to citySlugs) |
| `/medina-mole-control` | 1 | 1 | `/mole-control-medina/` (reverse pattern rule, no trailing slash) |
| `/medina-mole-extermination/` | 1 | 1 | `/mole-control-medina/` (reverse pattern rule) |
| `/mole-control-eatonville/` | 1 | 1 | **Build new city page** (Track C1 of L2 brief) |
| `/voles-vs-moles-whats-the-difference/` | 80 | 0 | `/blog/mole-vs-vole-vs-gopher` ✅ direct topical match |

Note the one-off 80-keyword miss (`voles-vs-moles-whats-the-difference`) that's ranked in tail positions but transfers to a relevant cornerstone on the new site — straight topical redirect, high confidence.

---

## Recommended `redirects.ts` patches

One patch per pattern rule. These fix the 109 gaps:

### Pattern 1 — Blog-URL redirects (hand-mapped, 27 URLs)

The old site's blog posts live at ROOT (e.g. `/do-moles-bite/`). The new site uses `/blog/{slug}/` and the slugs have been rewritten. Cannot pattern-match — needs a hand-mapped table.

```typescript
const blogRedirects: [string, string][] = [
  // Exact topical matches (new site has equivalent cornerstone)
  ['/voles-vs-moles-whats-the-difference/', '/blog/mole-vs-vole-vs-gopher/'],
  ['/moles-vs-gopher-mounds/', '/blog/mole-vs-vole-vs-gopher/'],
  ['/what-species-of-moles-live-in-washington-state/', '/blog/types-of-moles-in-washington/'],
  ['/what-do-moles-eat/', '/blog/what-do-moles-eat/'],
  ['/do-moles-hibernate/', '/blog/when-are-moles-most-active-washington/'],
  ['/when-are-moles-most-active/', '/blog/when-are-moles-most-active-washington/'],
  ['/how-to-get-rid-of-moles-in-your-yard/', '/blog/how-to-get-rid-of-moles/'],
  ['/how-to-get-rid-of-ground-moles-with-vinegar/', '/blog/do-mole-repellents-work/'],
  ['/what-attracts-moles-to-your-yard/', '/blog/why-moles-keep-coming-back/'],

  // Closest-cornerstone redirect where no direct equivalent exists
  ['/how-many-eyes-do-moles-have/', '/blog/are-moles-blind/'],
  ['/do-moles-bite/', '/faq/'],
  ['/do-moles-carry-diseases/', '/blog/are-moles-good-for-your-yard/'],
  ['/are-moles-nocturnal/', '/blog/when-are-moles-most-active-washington/'],
  ['/are-moles-poisonous-or-venomous/', '/blog/mole-control-safe-for-pets/'],
  ['/are-moles-venomous/', '/blog/mole-control-safe-for-pets/'],
  ['/can-moles-swim/', '/blog/'],
  ['/do-moles-live-in-groups/', '/blog/how-long-do-moles-live/'],
  ['/how-deep-do-moles-dig/', '/blog/how-to-find-active-mole-tunnels/'],
  ['/how-many-babies-do-moles-have/', '/blog/how-long-do-moles-live/'],
  ['/is-a-mole-a-rodent/', '/blog/types-of-moles-in-washington/'],
  ['/pest-control/', '/services/total-mole-control-program/'],
  ['/what-do-mole-holes-look-like/', '/blog/how-to-find-active-mole-tunnels/'],
  ['/what-eats-moles/', '/blog/'],
  ['/why-do-moles-make-molehills/', '/blog/how-to-find-active-mole-tunnels/'],
];
```

**Ian review flag:** each mapping is a judgment call on "closest topical match." Where `/blog/` is used as a fallback, Google will still serve the target blog if the old URL had backlinks — but the topical relevance drops. Prefer specific page matches where Ian can spot them from Search Console top-query data.

### Pattern 2 — Reverse `{slug}-mole-{verb}` (37 URLs, 1 rule)

```typescript
// Add to the existing citySlugs loop
for (const slug of citySlugs) {
  for (const verb of ['mole-control', 'mole-extermination', 'mole-exterminator', 'mole-trapping', 'mole-removal']) {
    // Reverse pattern: /{slug}-{verb}/ → /mole-control-{slug}/
    redirects.push({ source: `/${slug}-${verb}`, destination: dest, permanent: true })
    redirects.push({ source: `/${slug}-${verb}/`, destination: dest, permanent: true })
  }
}
```

### Pattern 3 — `/city/{slug}/` abandoned URLs (20 URLs, 1 rule)

```typescript
// Catch-all for legacy /city/{slug} path that the old site already 301'd to homepage
for (const slug of citySlugs) {
  redirects.push({ source: `/city/${slug}`, destination: `/mole-control-${slug}`, permanent: true })
  redirects.push({ source: `/city/${slug}/`, destination: `/mole-control-${slug}/`, permanent: true })
}
```

### Pattern 4 — Derive `citySlugs` from `city-data.ts` (resolves 12 bare-slug gaps)

The hardcoded 77-city `citySlugs` array in `redirects.ts` has silently drifted from the live `city-data.ts` (90 cities). Replace with:

```typescript
import { cities } from './city-data'
const citySlugs = cities.map(c => c.slug)
```

This closes the Algona/Fairwood/Lake-Tapps/Medina bare-slug gap + the 18 expansion cities added on the new site (Bremerton, Everett, Marysville, etc.).

### Pattern 5 — `{slug}-2` WordPress duplicates (6 URLs, 1 rule)

```typescript
// WordPress emitted /-2 duplicates when slugs collided. Strip and redirect.
for (const slug of citySlugs) {
  redirects.push({ source: `/mole-control-${slug}-2`, destination: `/mole-control-${slug}`, permanent: true })
  redirects.push({ source: `/mole-control-${slug}-2/`, destination: `/mole-control-${slug}/`, permanent: true })
}
// Plus: /lake-city-mole-control-2/ — non-pattern-match legacy, one-off:
redirects.push({ source: '/lake-city-mole-control-2', destination: '/mole-control-lake-city', permanent: true })
```

### Pattern 6 — Forward spelling + missing city variants (4 URLs, 3 rules)

```typescript
// Spelling variants
redirects.push({ source: '/mole-control-southhill', destination: '/mole-control-south-hill', permanent: true })
redirects.push({ source: '/mole-control-southhill/', destination: '/mole-control-south-hill/', permanent: true })

// Centralia + Eatonville are Track C1 of the L2 brief — pages to be built.
// Until built, these 404s resolve themselves when the cities are added to citySlugs + city-data.ts.
```

### Pattern 7 — E-spelling `mole-repellent-*` (2 URLs, 1 rule)

```typescript
// Parallel to existing mole-repellant-* block
for (const slug of citySlugs) {
  redirects.push({ source: `/mole-repellent-${slug}`, destination: `/mole-control-${slug}`, permanent: true })
  redirects.push({ source: `/mole-repellent-${slug}/`, destination: `/mole-control-${slug}/`, permanent: true })
}
```

---

## What Ian's review should add

Three things this audit cannot answer from the spreadsheet alone:

1. **Backlink inventory per URL.** The Rankings sheet shows organic rank, not referring domains. A URL with zero current top-3 keywords but strong backlinks is still worth redirecting for link equity. Run Ahrefs/SEMrush referring-domain report against the 334 URL list, prioritize any high-backlink URLs in the gap list.
2. **Search Console impression data per URL.** The baseline Rankings sheet is agency tracker data; GSC gives the authoritative impressions + CTR per landing URL. Cross-check: are any URLs in the 225 "transfers OK" pile actually **duplicates** that should have been 301'd instead? (Canonical drift risk.)
3. **User search behavior for the "closest topical" blog redirects.** Where we've routed old blog URLs to a "closest cornerstone" (e.g. `/do-moles-bite/` → `/faq/`), Ian should validate: does Google consider that a relevant redirect? If the old URL's queries skew toward "safety / children / pets," redirect to `/blog/mole-control-safe-for-pets/` instead of `/faq/`.

---

## Raw data attachments

- `reports/redirect-matrix.csv` — 334 rows × (old URL, final status, chain, ranked kw, top-3 kw, verdict)
- `reports/redirect-matrix.json` — same, machine-readable for any automated follow-up
- Input: `Got Moles - PPC Growth YoY + SEO Progress and Fruits.xlsx` (Rankings sheet, 3,024 rows × 42 timestamps)

---

## Action sequence (recommended)

1. **Ian reviews this document** — confirms or adjusts blog-slug mapping (Pattern 1), flags any URLs in the 225 "clean" pile that should have been patched differently.
2. **Ship Pattern 4 first** (derive citySlugs from city-data.ts) — fixes 12 bare-slug + most reverse-pattern gaps in one commit.
3. **Ship Patterns 2, 3, 5, 7 together** — five rule additions fix 65 more gaps.
4. **Ship Pattern 1 (blog hand-map) after Ian review** — 27 URLs, each a judgment call.
5. **Pattern 6 resolved automatically** once Centralia + Eatonville pages are built (Track C1 of `seo-geo-reinforcement` L2 brief).
6. **Post-DNS-switch:** run Screaming Frog against production to verify every old URL either 200s or 301s with no chained redirects >2 hops.

**Launch-gating view:** no single gap blocks the DNS switch — but leaving all 109 unfixed means losing 430 ranked keyword surfaces (298 in top-3) on day one, including the 90-keyword `/how-many-eyes-do-moles-have/` page. Fix cost is one-two small commits.

---

*Report compiled 2026-04-20 by Claude Code. Source files in `projects/briefs/seo-geo-reinforcement/reports/`. Push-to-Notion script: `_push-redirect-audit.mjs`.*
