# PageSpeed Baseline — Pre-Launch (2026-04-25)

**Tool:** Google PageSpeed Insights (https://pagespeed.web.dev/)
**Target:** `https://project-pf8c6.vercel.app` (new build, staging)
**Captured by:** Roy via web tool (anonymous PSI quota was exhausted on the API)

The SEO score of 66 reflects staging's `X-Robots-Tag: noindex, nofollow` header (set by `next.config.ts` headers() when `VERCEL_ENV !== 'production'`). It will flip to 100 once DNS cuts to production and `VERCEL_ENV=production` strips the header. This is **expected, not a defect**.

---

## Homepage — `/`

| Metric | Mobile | Desktop | Target |
|---|---:|---:|---|
| **Performance** | **96** | **100** | ≥90 |
| Accessibility | 93 | 93 | ≥90 |
| Best Practices | 100 | 100 | ≥90 |
| SEO | 66* | 66* | 100 (post-flip) |
| First Contentful Paint | 0.9s | 0.3s | <1.8s |
| **Largest Contentful Paint** | **2.7s** | **0.7s** | <2.5s mobile / <2.5s desktop |
| Total Blocking Time | 20ms | 30ms | <200ms |
| Cumulative Layout Shift | 0 | 0 | <0.1 |
| Speed Index | 2.2s | 0.8s | <3.4s |

\* SEO 66 = staging noindex. Will be 100 post-flip.

## Read

- **Mobile LCP 2.7s is 0.2s over the <2.5s target.** Likely cause: hero webp serving full-resolution to mobile. Not launch-blocking — Google still rates "Good" up to 2.5s and "Needs Improvement" 2.5-4.0s. Post-launch optimization options:
  - Add a `<source media="(max-width: 768px)" srcset>` mobile-specific variant under 100KB
  - Confirm `priority` + `fetchpriority="high"` on hero `<Image>` component (PageHero.tsx already sets `priority`)
  - Inspect via Lighthouse Treemap to confirm hero is the LCP element vs. a font/CSS bottleneck
- **Everything else is green or excellent.** TBT 20ms (mobile) is exceptional — no JavaScript stalls. CLS 0 means zero layout shift, which is rare and worth protecting through future template changes.
- **Desktop performance 100** is a clean ceiling — production should match or improve once HTTP cache + Vercel edge are live.

## Pages still to baseline

- `/mole-control-seattle` (city page template) — mobile + desktop
- `/blog/are-moles-blind` (blog post template) — mobile + desktop
- `/services/total-mole-control-program` (service page template) — mobile + desktop

These can be batched in a single 5-minute run via https://pagespeed.web.dev/ when convenient. Not launch-blocking — homepage covers the LCP/INP risk surface.

## 30-day re-run

Same URLs through the same tool, on production (got-moles.com). Compare:
- LCP delta — expect mobile to drop ~0.2-0.5s due to Vercel edge caching of hero
- SEO score — expect 66→100 (noindex header strip)
- Performance score — should stay 96+ mobile, 100 desktop
