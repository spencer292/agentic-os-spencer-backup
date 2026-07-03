/**
 * 301 Redirects — Old got-moles.com URLs → New site
 *
 * **Vercel has a hard limit of 2,048 redirects per project.** Earlier
 * iterations of this file enumerated each city × each verb × each trailing
 * slash combination, which pushed the count to 2,876 and broke deploys. This
 * version uses `path-to-regexp` alternation groups so a single rule covers
 * all ~90 cities × all verbs at once.
 *
 * Patterns applied (per seo-geo-reinforcement/reports/redirect-audit_2026-04-20.md):
 *   • Pattern 2 — forward and reverse `{slug}-{verb}` city combos
 *   • Pattern 3 — `/city/{slug}/` (legacy WordPress CPT) → canonical
 *   • Pattern 4 — `citySlugs` derived from `city-data.ts` (no hardcoded drift)
 *   • Pattern 5 — `{slug}-2` WordPress duplicates for flagged cities
 *   • Pattern 6 — Spelling variants (`southhill` → `south-hill`)
 *   • Pattern 7 — E-spelling `mole-repellent-{slug}` per city
 *
 * MIGRATE blogs (per old-blog-migration-plan_2026-04-20.md) are NOT
 * redirected here — they preserve their indexed URL via urlPattern='legacy-root'
 * and render through the [citySlug] catch-all route.
 */

import type { Redirect } from 'next/dist/lib/load-custom-routes'
import { getAllCitySlugs } from './city-data'

// ────────────────────────────────────────────────────────────────────────
// Alternation groups used in path-to-regexp rules
// ────────────────────────────────────────────────────────────────────────

/**
 * Every city slug joined with `|`. path-to-regexp uses this inside a named
 * capture group to constrain the `:slug` param to known cities. If any slug
 * is added to city-data.ts, this alternation grows for free.
 */
const cityAlt = getAllCitySlugs().join('|')

/**
 * Forward verb prefixes. `mole-control` is the canonical and does NOT appear
 * here (we never want to redirect `/mole-control-seattle/` — that's the
 * destination).
 */
const forwardVerbAlt = [
  'mole-trapping',
  'mole-exterminator',
  'mole-exterminators',
  'mole-catcher',
  'mole-repellant',
  'mole-removal',
  'mole-extermination',
].join('|')

/**
 * Reverse verb suffixes — audit Pattern 2. `mole-control` IS here (the reverse
 * pattern `/seattle-mole-control/` is a valid redirect source even though
 * `/mole-control-seattle/` is the destination).
 */
const reverseVerbAlt = [
  'mole-control',
  'mole-trapping',
  'mole-exterminator',
  'mole-extermination',
  'mole-removal',
].join('|')

/**
 * Cities flagged in the audit Pattern 5 as having WordPress `-2` duplicates.
 * Kept explicit to avoid polluting the alternation regex with slug+`-2` noise.
 */
const duplicateSuffixCities = ['seatac', 'sumner', 'lake-city', 'edgewood']

/**
 * Blog slugs that 301 from `/{slug}/` → `/blog/{slug}/`. Intentionally short:
 * Track D MIGRATE blogs live at `/{slug}/` via urlPattern='legacy-root' and
 * MUST NOT appear here or the migration breaks. MERGE target remapping is
 * pending Ian's validation.
 */
const blogSlugs = [
  'how-to-choose-a-mole-control-company',
  // 'what-do-moles-eat' REMOVED 2026-05-02 per cornerstone-url-recovery L2:
  // page now serves at /what-do-moles-eat/ as urlPattern='legacy-root'.
  // Reversed the 2026-04-25 redirect to recover 102 ranked KW. See
  // projects/briefs/cornerstone-url-recovery/brief.md
  'signs-of-moles-in-your-yard',

  // Cosmetic redirects added 2026-05-05 for the 14 /blog/* posts whose
  // legacy-root /{slug}/ variant 308'd to /{slug} then 404'd. GSC deep pull
  // (2026-05-05_gsc-deep-pull.md) confirmed zero historical equity at the
  // bare /{slug}/ paths — these aren't preserve-indexed-URL recoveries,
  // they're hygiene redirects so human typos / AI URL guesses land on the
  // canonical /blog/{slug}/ instead of 404.
  'are-moles-blind',
  'are-moles-good-for-your-yard',
  'best-mole-traps',
  'diy-vs-professional-mole-control',
  'do-mole-repellents-work',
  'does-grub-control-stop-moles',
  'how-long-do-moles-live',
  'how-to-find-active-mole-tunnels',
  'humane-mole-removal',
  'mole-control-safe-for-pets',
  'mole-removal-cost-washington',
  'monthly-vs-one-time-mole-control',
  'types-of-moles-in-washington',
  'why-moles-keep-coming-back',
]

export function getRedirects(): Redirect[] {
  const redirects: Redirect[] = []

  // ────────────────────────────────────────────────────────────────────
  // 1. Core page redirects
  //
  // 2026-05-13: Site flipped to `trailingSlash: true` to align Next.js
  // routing with sitemap + canonical tag declarations (both already declared
  // slash form). Pre-flip baseline showed 1/139 sitemap URLs returned 200 in
  // 0 hops; post-flip 138/139. Destinations now use slash form so historical
  // WP URLs resolve in 1 hop instead of 2-3.
  //
  // Sources stay no-slash: Next.js normalises trailing slashes on incoming
  // requests before matching redirect rules, so listing both forms would be
  // dead code (and inflate the Vercel 2,048-redirect budget).
  // ────────────────────────────────────────────────────────────────────
  const coreRedirects: [string, string][] = [
    ['/about-us', '/about/'],
    ['/our-services', '/services/total-mole-control-program/'],
    ['/our-process', '/how-it-works/'],
    ['/contact-us', '/contact/'],
    ['/pricing', '/services/one-time-mole-removal/'],
    ['/cities-served', '/service-areas/'],
    ['/thank-you', '/contact/'],
    // 2026-05-02 cornerstone-url-recovery L2: removed MERGE rules for
    // /voles-vs-moles-whats-the-difference and /how-to-get-rid-of-moles-in-your-yard
    // as those pages now serve at their original URLs (urlPattern='legacy-root').
    // See projects/briefs/cornerstone-url-recovery/brief.md
  ]

  for (const [source, dest] of coreRedirects) {
    redirects.push({ source, destination: dest, permanent: true })
  }

  // ────────────────────────────────────────────────────────────────────
  // 2. Service page redirects (old pages + CPT duplicates)
  // ────────────────────────────────────────────────────────────────────
  const serviceRedirects: [string, string][] = [
    ['/mole-control', '/services/total-mole-control-program/'],
    ['/mole-trapping', '/services/one-time-mole-removal/'],
    ['/mole-exterminator', '/services/one-time-mole-removal/'],
    ['/mole-removal', '/services/one-time-mole-removal/'],
    ['/mole-repellant', '/faq/'],
    ['/mole-repellent', '/faq/'],
    ['/mole-catcher', '/services/one-time-mole-removal/'],
    ['/mole-extermination', '/services/one-time-mole-removal/'],
    ['/service/mole-control', '/services/total-mole-control-program/'],
    ['/service/mole-trapping', '/services/one-time-mole-removal/'],
    ['/service/mole-exterminator', '/services/one-time-mole-removal/'],
    ['/service/mole-removal', '/services/one-time-mole-removal/'],
    ['/service/mole-extermination', '/services/one-time-mole-removal/'],
  ]

  for (const [source, dest] of serviceRedirects) {
    redirects.push({ source, destination: dest, permanent: true })
  }

  // ────────────────────────────────────────────────────────────────────
  // 3. City pattern redirects (one rule per pattern × 90 cities)
  //    Uses path-to-regexp alternation — counts as ONE route each.
  // ────────────────────────────────────────────────────────────────────

  // 3a. Plain slug /:slug  →  /mole-control-:slug
  redirects.push({
    source: `/:slug(${cityAlt})`,
    destination: '/mole-control-:slug/',
    permanent: true,
  })

  // 3b. Legacy /city/:slug  →  /mole-control-:slug (Pattern 3)
  redirects.push({
    source: `/city/:slug(${cityAlt})`,
    destination: '/mole-control-:slug/',
    permanent: true,
  })

  // 3c. Forward verb-city  /:verb-:slug  →  /mole-control-:slug
  redirects.push({
    source: `/:verb(${forwardVerbAlt})-:slug(${cityAlt})`,
    destination: '/mole-control-:slug/',
    permanent: true,
  })

  // 3d. Reverse city-verb  /:slug-:verb  →  /mole-control-:slug (Pattern 2)
  redirects.push({
    source: `/:slug(${cityAlt})-:verb(${reverseVerbAlt})`,
    destination: '/mole-control-:slug/',
    permanent: true,
  })

  // 3e. E-spelling /mole-repellent-:slug  →  /mole-control-:slug (Pattern 7)
  redirects.push({
    source: `/mole-repellent-:slug(${cityAlt})`,
    destination: '/mole-control-:slug/',
    permanent: true,
  })

  // ────────────────────────────────────────────────────────────────────
  // 4. Pattern 5 — `-2` WordPress duplicates (flagged cities only)
  // ────────────────────────────────────────────────────────────────────
  for (const slug of duplicateSuffixCities) {
    const dest = `/mole-control-${slug}/`
    redirects.push({ source: `/mole-control-${slug}-2`, destination: dest, permanent: true })
    redirects.push({ source: `/${slug}-mole-control-2`, destination: dest, permanent: true })
  }

  // ────────────────────────────────────────────────────────────────────
  // 5. Pattern 6 — Spelling variants
  // ────────────────────────────────────────────────────────────────────
  const spellingVariants: [string, string][] = [
    ['/mole-control-southhill', '/mole-control-south-hill/'],
    ['/southhill-mole-control', '/mole-control-south-hill/'],
    // /are-moles-venomous/ is a content duplicate of the canonical
    // /are-moles-poisonous-or-venomous/ migrated blog. Consolidate via 308.
    ['/are-moles-venomous', '/are-moles-poisonous-or-venomous/'],
    // 2026-05-08 Sub 1.5 cannibalisation cleanup: species-page pair per
    // Spencer SEO Fix Plan P1.1 + target-keywords.md v1.1. Canonical is
    // /blog/types-of-moles-in-washington/. Loser had legacy-root URL.
    ['/what-species-of-moles-live-in-washington-state', '/blog/types-of-moles-in-washington/'],
  ]
  for (const [source, destination] of spellingVariants) {
    redirects.push({ source, destination, permanent: true })
  }

  // ────────────────────────────────────────────────────────────────────
  // 6. Blog posts — old root-level → /blog/{slug}/
  //    (Track D MIGRATE blogs intentionally NOT in this list — they live at /{slug}/)
  // ────────────────────────────────────────────────────────────────────
  for (const slug of blogSlugs) {
    redirects.push({ source: `/${slug}`, destination: `/blog/${slug}/`, permanent: true })
  }

  // ────────────────────────────────────────────────────────────────────
  // 6b. MERGE blogs — old URL → new cornerstone where slug changes.
  //     Per old-blog-migration-plan_2026-04-20.md Pattern 1 hand-map.
  //     All 8 targets exist as live /blog/ cornerstones. High-confidence
  //     topical matches; Ian can refine destinations if needed without
  //     data loss (just edit the right-hand side).
  // ────────────────────────────────────────────────────────────────────
  const mergeRedirects: [string, string][] = [
    // 2026-05-02 cornerstone-url-recovery L2: 5 of 7 MERGE rules removed.
    // Pages now serve at original URLs (urlPattern='legacy-root') to recover
    // ~30% impressions loss. Remaining 2 below are out-of-scope (zero ranked
    // KW each — true MERGE candidates). See cornerstone-url-recovery/brief.md
    //
    // 2026-05-13: Destinations restored to slash form to match the
    // `trailingSlash: true` flip. Each redirect now resolves in 1 hop.
    //
    // moles-vs-gopher-mounds → mole-vs-vole-vs-gopher cornerstone
    ['/moles-vs-gopher-mounds', '/voles-vs-moles-whats-the-difference/'],
    // when-are-moles-most-active (no -washington suffix) → new cornerstone
    ['/when-are-moles-most-active', '/do-moles-hibernate/'],
    // what-works-for-mole-extermination → best-mole-traps (still at /blog/)
    ['/what-works-for-mole-extermination', '/blog/best-mole-traps/'],
    //
    // ── REVERSE 301s — 2026-05-02 cornerstone-url-recovery L2 ──
    // For any external links pointing to /blog/* paths that moved to legacy-root.
    ['/blog/what-do-moles-eat', '/what-do-moles-eat/'],
    ['/blog/mole-vs-vole-vs-gopher', '/voles-vs-moles-whats-the-difference/'],
    ['/blog/when-are-moles-most-active-washington', '/do-moles-hibernate/'],
    ['/blog/how-to-get-rid-of-moles', '/how-to-get-rid-of-moles-in-your-yard/'],
  ]
  for (const [source, destination] of mergeRedirects) {
    redirects.push({ source, destination, permanent: true })
  }

  // ────────────────────────────────────────────────────────────────────
  // 6c. City-page one-off redirect: old blog URL that's actually a city
  //     page per migration plan row 20.
  // ────────────────────────────────────────────────────────────────────
  redirects.push({ source: '/olympia-mole-exterminator', destination: '/mole-control-olympia/', permanent: true })

  // ────────────────────────────────────────────────────────────────────
  // 6d. One-off page redirects (non-blog, non-city) from audit Pattern 1.
  //     Keep this section for any specific legacy paths that aren't
  //     covered by the pattern rules above.
  // ────────────────────────────────────────────────────────────────────
  redirects.push({ source: '/pest-control', destination: '/services/total-mole-control-program/', permanent: true })

  // ────────────────────────────────────────────────────────────────────
  // 7. WordPress cruft → homepage
  // ────────────────────────────────────────────────────────────────────
  const dropToHome: string[] = [
    '/tag/:path*',
    '/category/:path*',
    // /author/:path* removed 2026-05-05: /author/spencer/ is now a real
    // authority page (preserve-indexed-URLs rule for the 7 historical
    // clicks at pos 20.6).
    // Specific known WordPress author archives still indexed by Google
    // (got-moles flagged in mobile SERP 2026-05-05) — redirect to /about/
    // since that's the company-info destination, not homepage.
    '/layouts/:path*',
    '/wp-admin',
    '/wp-login.php',
    '/xmlrpc.php',
    '/wp-content/:path*',
    '/wp-includes/:path*',
  ]
  for (const source of dropToHome) {
    redirects.push({ source, destination: '/', permanent: true })
  }

  // ────────────────────────────────────────────────────────────────────
  // 7b. Known WordPress author archives → /about (NOT /, because the
  //     content was company-info-style; /about is the canonical destination).
  //     /author/spencer/ is intentionally NOT in this list — it's a real
  //     static route now (Got Moles Spencer authority page).
  // ────────────────────────────────────────────────────────────────────
  const authorArchives = ['got-moles', 'admin', 'editor', 'mitch']
  for (const slug of authorArchives) {
    redirects.push({ source: `/author/${slug}`, destination: '/about/', permanent: true })
  }

  // ────────────────────────────────────────────────────────────────────
  // 8. Miscellaneous non-city `-2` duplicates + service catch-all + one-offs
  // ────────────────────────────────────────────────────────────────────
  redirects.push({ source: '/mole-control-2', destination: '/services/total-mole-control-program/', permanent: true })
  redirects.push({ source: '/mole-trapping-2', destination: '/services/one-time-mole-removal/', permanent: true })
  redirects.push({ source: '/mole-exterminator-2', destination: '/services/one-time-mole-removal/', permanent: true })
  redirects.push({ source: '/service/:path*', destination: '/services/total-mole-control-program/', permanent: true })

  return redirects
}
