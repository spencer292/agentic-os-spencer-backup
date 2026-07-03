---
project: website-launch-readiness
status: complete
level: 2
created: 2026-04-25
completed: 2026-05-01
target-flip: 2026-04-29
parent: website-rebuild-rebrand
runbook: ../website-rebuild-rebrand/LAUNCH-CHECKLIST.md
---

> **COMPLETE 2026-05-01.** DNS flipped, got-moles.com live on the new build. Closed out 2026-05-10 during project audit.


# Website Launch Readiness — Got Moles

Critical-path L2 to take the new build live on `got-moles.com`. Closes the gap between "build complete" and "DNS flip safe." Sub-brief of `website-rebuild-rebrand`.

## Goal

DNS flip from old WordPress → new Next.js build with **zero ranking loss** on the 635+ #1 keywords and 932+ ranked URLs the old site holds, full schema/GEO foundation in place, and analytics/security/lead-capture all firing on day one.

## Acceptance criteria

1. All Pattern 1 hand-mapped blog redirects (27 URLs / 305 ranked kw / 70 top-3) verified live on staging via `curl -I -L`
2. Phase 2 keyword mapping document confirmed (status flipped from "draft" to "confirmed")
3. All 8 outstanding schema gaps from `str-ai-seo-local/2026-04-25_audit.md` closed in a single commit
4. Rich Results Test passes on 7 page templates (homepage, TMCP, city, blog, reviews, how-it-works, service-areas)
5. PageSpeed baseline captured (mobile + desktop, homepage + 1 city page) — LCP < 2.5s mobile target
6. AIO 15-query baseline captured (lift-measurement starting line)
7. Tracking IDs (GA4, Pixel, GAds) in Vercel env + Analytics.tsx firing on staging
8. Cloudflare zone configured, Turnstile keys live on contact form
9. Bing Webmaster Tools + Bing Places + Apple Business Connect + Nextdoor (Seattle+Tacoma) + BBB claimed/verified
10. `VERCEL_PROJECT_PRODUCTION_URL` = `got-moles.com` confirmed (controls robots.ts production-mode flip)
11. Mobile smoke test on staging signed off by Spencer or Roy
12. Ian SEO migration sign-off received

## Deliverables

### Group A — Pre-flip code/data work (Roy + Claude — no external blockers)

| # | Item | Status |
|---|---|---|
| A1 | ~~Lock `phase-2-keyword-mapping.md`~~ | **closed** — Roy approved 2026-04-25, status flipped to `confirmed` |
| A18 | ~~Build full keyword corpus brief~~ | **closed** — `keyword-corpus-brief.md` shipped 2026-04-25. 2,668 kw / 2,405 ranked / 635 #1. Top 30 must-defend URLs all confirmed accounted for. Top 30 growth keywords scoped. `keyword-corpus-raw.json` for re-running analyses. |
| A2 | ~~Wire `howToSchema()` → `/how-it-works/`~~ | **closed** — already wired (verified live 2026-04-25) |
| A3 | ~~Wire `reviewsSchema()` → `/reviews/`~~ | **closed** — already wired (verified live 2026-04-25) |
| A4 | ~~Wire `collectionPageSchema + itemListSchema` → `/blog/` + `/service-areas/`~~ | **closed** — already wired (verified live 2026-04-25) |
| A5 | ~~Expand `BUSINESS.social` from 3 → 8+ entries~~ | **closed** — shipped `bc498d5` 2026-04-26. 8 sameAs URLs (3 GBPs + Facebook + Instagram + LinkedIn + Yelp + Nextdoor). All resolve. |
| A6 | ~~Add `streetAddress` + `postalCode` to `cityLocalBusinessSchema`~~ | **closed** — `1033c49` baseline; `a8ab776` 2026-04-26 added BRANCHES constant + `localBusinessSchema.department[]` graph + branch-aware city NAP for Tukwila/Tacoma. |
| A7 | ~~Reconcile review count 219 (schema) vs 175 (UI)~~ | **closed (non-issue)** — UI uses "219+" everywhere, schema matches. Original audit was wrong. |
| A8 | ~~Fix `articleSchema` height 675 → 669~~ | **closed** — shipped `1033c49` |
| A9 | ~~Fix og:image fallback for blog posts~~ | **closed** — shipped `1033c49`. Extracted shared map at `src/lib/blog-images.ts` |
| A10 | ~~Smoke-test 10 of Pattern 1 redirects on staging~~ | **closed** — 14 patterns traced 2026-04-25, all clean 308→200 |
| A11 | ~~Schema validation across 13 page templates~~ | **closed** — programmatic structural validation found 3 issues, all fixed in `58a5b69`. Roy may still run Google's web Rich Results Test on 1 example per template if desired |
| A12 | ~~Capture PageSpeed baseline~~ | **closed (partial)** — Roy ran homepage mobile + desktop via web tool 2026-04-25. Saved to `projects/str-ai-seo-local/2026-04-25_pagespeed-baseline.md`. Mobile 96 / Desktop 100. LCP 2.7s mobile (0.2s over target — post-launch followup). City + blog + service templates still to baseline (non-blocking). |
| A13 | ~~AIO 15-query baseline~~ | **closed** — ChatGPT + Gemini baselines captured in `projects/str-ai-seo-local/2026-04-25_aio-baseline.md`. Headline: 1 brand citation + 5 brand mentions across 30 cells. Perplexity/Claude/Google AIO need manual or API-key add for full coverage. |
| A14 | ~~Final `payload-types.ts` regen + commit~~ | **closed** — regen produced no diff, already in sync |
| A15 | ~~Confirm `llms.txt` canonical + 19-bot allowlist alignment with `robots.ts`~~ | **closed (non-issue)** — llms.txt is content-discovery markdown; robots.ts handles bot allowlist; they don't share format |
| A16 | ~~Dedupe FAQPage on `/faq`~~ | **closed** — shipped `1033c49` |
| A17 | ~~Decide on `/guarantee/` page~~ | **closed (dropped)** — no inbound links anywhere, memory rule says guarantee is TMCP/One-Time scoped not sitewide. Building it would conflict with positioning. Drop from launch scope. |

### Group B — Pre-flip ops/infra (Roy)

| # | Item | Status |
|---|---|---|
| B1 | Tracking IDs into Vercel env (`NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GADS_ID`) | **partial** — GA4 `G-H8ZV2L217D` live in Vercel (all envs) 2026-04-26. Meta Pixel **blocked on Spencer** (Roy needs Business Portfolio admin + Pixel access, email sent). GAds in progress. |
| B2 | Cloudflare new account + zone config (see LAUNCH-CHECKLIST §Cloudflare) | open |
| B3 | Turnstile site + keys into Vercel env | open |
| B4 | Confirm `VERCEL_PROJECT_PRODUCTION_URL` = `got-moles.com` | open |
| B5 | Decide CSP report-only vs enforcing pre-flip | open |

### Group C — Listings (Roy or Spencer — claim sweep)

| # | Item | Status |
|---|---|---|
| C1 | Bing Webmaster Tools — claim, verify, prep sitemap submission | open |
| C2 | Bing Places — claim 3 locations | open |
| C3 | Apple Business Connect — claim 3 locations | open |
| C4 | Nextdoor — Seattle + Tacoma profiles (Enumclaw exists) | open |
| C5 | BBB — claim/verify | open |

### Group D — Blocked on Spencer

| # | Item | Status |
|---|---|---|
| D1 | ~~Jobber OAuth authorize handshake~~ | **closed** — Spencer authorized; contact form lead-capture wired to Jobber and working on staging |
| D1a | Decide quote-option flow on contact form | open — Roy decision |
| D2 | SiteSettings data (logo, address, hours, GBP URLs) | **partial** — logo wired (real brand SVG in header/footer/schema/favicon, shipped `577aa02`). Spencer still owes: phone confirm, GBP URLs ×3, social URLs, default OG image |
| D3 | ~~Mobile smoke test on staging~~ | **closed** — completed 2026-04-25 |

### Group E — Blocked on Ian

| # | Item | Status |
|---|---|---|
| E1 | SEO migration sign-off | blocked |
| E2 | 24 shadow pages decision (in/out of launch?) | blocked |

### Group F — DNS flip day (executes in order — see LAUNCH-CHECKLIST)

| # | Item | Window |
|---|---|---|
| F1 | Cloudflare nameserver switch at GoDaddy | T0 |
| F2 | Verify robots.ts production mode + sitemap.xml loads | T+1h |
| F3 | Spot-check 10 redirects against production | T+1h |
| F4 | GSC + Bing add property, submit sitemaps | T+24h |
| F5 | Update 3 GBP locations website field → `got-moles.com` | T+24h |
| F6 | Re-run str-ai-seo-local audit on production | T+24h |
| F7 | Confirm tracking fires (GA4 Realtime, Meta Events Mgr, GAds Tag Assistant) | T+48h |
| F8 | Create Google Ads conversion actions (Phone Call + Form Submit) on production `got-moles.com`, grab labels, drop into env vars `NEXT_PUBLIC_GADS_CONVERSION_PHONE` + `_FORM`, replace `CONVERSION_LABEL` placeholder in `Analytics.tsx` lines 80+104, redeploy. Deferred from pre-flip 2026-04-26 — staging-URL setup carried domain-edit ambiguity, post-flip is clean. ~30 min. | T+1h |

## Out of scope

- Issaquah single-page deep dive (post-launch — Mole Masters outranks; accept short-term loss)
- 24 shadow pages (Ian-blocked, separate deliverable)
- Tier 2/3 myth-bust + safety blogs (queued in `mole-content-authority`, ship post-launch)
- County hub pages (5 planned, post-launch)
- Image sitemap `<image:image>` entries (post-launch nice-to-have)
- og:image regeneration to fix 675→669 height drift in JSON-LD (cosmetic)

## Gates

- **Cannot flip without:** A1-A15 closed, B1-B5 closed, F1 ready to execute, Ian sign-off (E1)
- **Should not flip without:** Group C complete, Spencer mobile smoke test (D3)
- **Can flip with degraded state:** Jobber wire (D1) — Leads collection captures regardless; SiteSettings (D2) — placeholders acceptable

## References

- **Notion runbook:** [Flip Day Plan — Got Moles Website Launch](https://www.notion.so/Flip-Day-Plan-Got-Moles-Website-Launch-34f3d42c4a9c815c9ba1f697e44e735d) (page ID `34f3d42c-4a9c-815c-9ba1-f697e44e735d`) — operational runbook with checkboxes for Roy + Spencer + Ian to tick during flip
- Runbook: `../website-rebuild-rebrand/LAUNCH-CHECKLIST.md` (the operational order-of-operations on flip day)
- Latest audit: `../../str-ai-seo-local/2026-04-25_audit.md` (68/100 baseline)
- Redirect audit: `../seo-geo-reinforcement/reports/redirect-audit_2026-04-20.md` (109 gaps documented; patches merged into `redirects.ts`)
- Keyword mapping: `../website-rebuild-rebrand/phase-2-keyword-mapping.md` (draft, needs A1)
- Schema source: `site/src/lib/schema.tsx`
- Redirects source: `site/src/lib/redirects.ts`

## Owner map

| Group | Owner | External dep |
|---|---|---|
| A | Roy + Claude | none |
| B | Roy | Spencer for GoDaddy access if needed |
| C | Roy or Spencer | each platform's verification flow |
| D | Spencer | none |
| E | Ian | none |
| F | Ian + Roy + Claude | DNS propagation |
