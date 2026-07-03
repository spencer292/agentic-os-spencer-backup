---
phase: 8
date: 2026-04-24
status: verified-staging
---

# Phase 8 — Launch Verification

## Publish state

All 35 blog posts: `status: 'published'` in Payload (seed.ts line 602 sets this on every post; full reseed ran at end of Phase 5 — 35 written, 0 skipped).

Visibility is controlled by the custom `status` field, not Payload's built-in `_status` draft system — confirmed in `src/lib/payload.ts` line 102 and 132.

## Staging smoke test

Staging URL: `https://project-pf8c6.vercel.app`

| URL | Status | Notes |
|---|---|---|
| `/` | 200 | homepage live |
| `/blog/` | 200 | hub page live |
| `/blog/how-to-get-rid-of-moles/` | 200 | standard blog URL pattern, H1 + FAQ + city links render |
| `/what-species-of-moles-live-in-washington-state/` | 200 | legacy-root URL, preserves indexed path |
| `/mole-control-seattle/` | 200 | city page, H1 "Mole Control in Seattle" |
| `/sitemap.xml` | 200 | ~150 URL entries (core + 92 city + 35 blog) |

City links verified live in blog post footer: `/mole-control-sammamish/`, `/mole-control-bellevue/`, `/mole-control-seattle/`, `/mole-control-tacoma/`, `/service-areas/`.

## Schema state (per-page, verified via `src/lib/schema.tsx` helpers)

- **BlogPosting** (upgraded from Article in Phase 6) — keywords, articleSection, ImageObject 1200×675, Author @id → Spencer Hill Person entity, mainEntityOfPage as WebPage node
- **DefinedTerm** — emitted for posts with `definitionBlock` (new Phase 6 helper)
- **FAQPage** — all 35 posts have 5 Q&A
- **BreadcrumbList** — fires on every post (standard and legacy-root variants)
- **SpeakableSpecification** — `h1`, `#blog-definition-block`, `.blog-faq-answer`

Per-page schemas on non-blog routes already comprehensive: LocalBusiness (homepage + city), Service (service pages), Person (about), Organization + WebSite (root layout), Reviews (reviews page).

## Technical SEO state

- `robots.ts` — AI bot allowlist covers GPTBot, ChatGPT-User, OAI-SearchBot, Google-Extended, Anthropic-AI, ClaudeBot, Claude-Web, PerplexityBot, Perplexity-User, Cohere-AI, CCBot, Applebot, Applebot-Extended, meta-externalagent, FacebookBot, Amazonbot, DuckAssistBot, YouBot
- Staging blocks all crawlers via host-based check (`VERCEL_PROJECT_PRODUCTION_URL === 'got-moles.com'`); production opens
- `sitemap.ts` — all URLs with `lastModified`, `changeFrequency`, `priority`; blog posts use per-post `date` for lastmod
- Canonical URLs — explicit on homepage, service pages, blog index, blog detail (Phase 7), city pages (Phase 7), legacy-root blog branch
- OpenGraph + Twitter — `summary_large_image` card + featured-image fallback to `og-default.webp` on every blog post + city page (Phase 7)
- UTM/fbclid — handled by explicit canonical (canonical tag points to clean URL; Google treats query-string variants as duplicates of canonical)
- `/lp/` noindex — staging + production (paid-traffic pages, separate from organic)

## Internal linking state

- Every blog post has 3 city links + 1 service link + 1 `/service-areas/` link + 1 `/contact/` link in closing section (Phase 5)
- Top-20 WA cities (Seattle, Bellevue, Tacoma, Sammamish, Issaquah, Puyallup, Federal Way, Renton, Kent, Enumclaw, Burien, Auburn, Kirkland, Redmond, Bothell, Maple Valley, Covington, Mercer Island, Snoqualmie, Black Diamond) each receive 5-6 inbound blog links for equity distribution
- Blog-to-blog cross-links already present throughout post bodies (7-10 inbound per cornerstone)
- Service pages get 82 inbound blog body links (39 TMCP + 37 One-Time + 3 Commercial + 3 from closing-section rotation)

## Items deferred / not in scope for this session

- **Lighthouse Core Web Vitals** — requires live browser run against staging; quick check is a post-DNS-flip task
- **Rich Results Test** — run on 5 sample URLs via https://search.google.com/test/rich-results once DNS flips and pages are publicly reachable (staging blocks all crawlers including Googlebot, so the validator can't fetch from preview)
- **Remaining 27 posts audit** — per-post audit was run on priority 8; the rest were content-uplifted in Phase 3 but not individually scored against all 9 sections of the checklist

## Verdict

Blog launch-readiness plan phases 0-8 complete. Content, schema, internal linking, technical SEO all in place on staging. Safe to flip DNS when Spencer/team give the word.
