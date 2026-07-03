---
project: paid-search-landing-pages
type: fix-list
created: 2026-05-23
status: "#1 + #2 DONE 2026-05-23 (commit 71315b04 — re-audit 23 pages 0 flags). #3-#5 remaining."
build_from: clients/got-moles/projects/briefs/website-rebuild-rebrand/site
source: Phase-1 QS-readiness audit of all 23 live /lp/{city}/ pages (scripts/_got-moles-lp-audit.mjs)
spec: 2026-05-23_no-video-lp-template-spec.md (this folder)
---

# LP Fix List — post-audit (run in the Got Moles build window)

All 23 `/lp/{city}/` are LIVE and passing the basics: HTTP 200, **noindex** ✓, **H1 message-match** ✓,
**click-to-call** ✓, **BreadcrumbList schema** ✓, city content in body ✓. Two template-level gaps
remain (they hit all 23 incl. the original 5, so fix them in `buildLpBlocks` / the route once).

> Reminder: LPs **bypass the CMS — NO seed/reseed**. Flow: edit `src/lib/lp-city-data.ts` +
> `src/app/(frontend)/lp/[city]/page.tsx` → `npx next build` → `git push mine main` →
> verify on `project-pf8c6.vercel.app` then `got-moles.com`. Posture A, humanizer ≥8.5, US English.

## 1. FAQ block + FAQPage schema — ✅ DONE 2026-05-23 (commit 71315b04)
> Added `faq` block (top-6 from `cityData[slug].faqs`) — FAQBlock emits FAQPage JSON-LD itself, so
> NO `faqSchema` in the route (would duplicate). Also added `geoDefinition` local-proof from
> `whyMolesThrive` (adds Speakable schema). Re-audit: FAQ=y on all 23, LD count 2→4.
The audit found only 2 JSON-LD blocks/page (breadcrumb + org) — **no FAQPage**. Likely the FAQ +
local-proof blocks from spec change 3 didn't land. Do:
- In `buildLpBlocks(city)`: add a **`faq` block** (`generateSchema: true`, `background: 'grass-alt'`)
  populated from `cityData[city.slug].faqs` (the city's own Q&As in `src/lib/city-data.ts`). Skip
  gracefully if a city has no `faqs`.
- Also confirm the **local-proof block** is present (a `geoDefinition`/`richContent` "Why moles
  thrive in {City}" from `cityData[slug].whyMolesThrive` + `neighborhoods`). If missing, add it.
- In `lp/[city]/page.tsx`: add `<JsonLd data={faqSchema(faqs)} />` (import `faqSchema` from
  `@/lib/schema`). Pull the same `faqs` used in the block.
- Keep the Page Structure Checklist: gradient CTA stays the LAST block; alternate grass/grass-alt.
- Verify with Google Rich Results Test that FAQPage validates.

## 2. Hero image — `fetchpriority="high"` + not lazy — ✅ DONE 2026-05-23 (commit 71315b04)
> Live HTML showed next/image `priority` already PRELOADS the hero (`<link rel=preload as=image>`),
> but Next 16 omits the `fetchpriority="high"` attribute. Added `fetchPriority="high"` to the shared
> `HeroBlock` next/image. Re-audit: fpri=y on all 23.
Audit shows the hero is **not** marked high-priority on any page (LCP risk; feeds the
landing-page-experience QS component).
- Ensure the hero image renders with `fetchpriority="high"` and is **never** `loading="lazy"`.
- If hero uses `next/image`, set `priority`. If it's a CSS background, add a `<link rel="preload" as="image">`
  for the hero, or switch to a prioritised `<img>`.

## 3. Conversion hero image swap — PENDING (Roy)
Roy is generating better conversion-focused hero images (gpt-image). When supplied:
- Drop the WebP(s) into `site/public/images/` (county or per-city naming).
- Update `heroImage` in the relevant `LP_CITIES` entries.
- Keep #2 (fetchpriority) applied to the new image.

## 4. Verify (after fixes)
- Re-run the audit from the agent-os root: `node scripts/_got-moles-lp-audit.mjs`
  → expect **zero flags** on all 23 (no `no-FAQschema`, no `hero-not-priority`).
- Run **PageSpeed Insights (mobile)** on 3-4 representative pages (e.g. redmond, puyallup, kirkland):
  LCP <2.5s, INP <200ms, CLS <0.1.
- Confirm Posture-A clean + humanizer ≥8.5 on any new copy (FAQ/local-proof).

## 5. Then (handled back in the paid/root window — not this build)
- Point each city's Google Ads exact keywords at its `/lp/{city}/`.
- ~3-5 days later: `node scripts/_got-moles-qs.mjs` to confirm QS lift (landing-page-experience
  component ≥ Average on the city keywords).

---
*Acceptance: audit clean on all 23 + CWV green + FAQPage validates. Sign-off: Roy + Spencer.*
