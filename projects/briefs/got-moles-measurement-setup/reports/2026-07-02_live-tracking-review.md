# Live Tracking & Ads-Code Review (2026-07-02)

**Scope:** read-only review of got-moles.com production tracking — GTM, GA4, Google Ads conversion wiring, CallRail, Clarity — verified against live HTML (node fetch, 5 page types), the GTM container JS, the site codebase, and read-only Google Ads API queries. Nothing changed.

**Headline: everything is okay.** The full measurement chain is verified working end-to-end, live: site dataLayer events → GTM → GA4 → Google Ads import (forms), and CallRail DNI → Google Ads import (calls). Last-30d Ads conversions (37) decompose exactly per the designed model with no double counting.

---

## Live verification (5 pages: home, /services/one-time-mole-removal, city page, blog, contact)

| Layer | State | Evidence |
|---|---|---|
| **GTM** `GTM-5XLRMCGQ` | ✅ live sitewide, in `<head>`, preloaded | all pages |
| **GA4** `G-H8ZV2L217D` | ✅ configured inside GTM (googtag + gaawe event tags + `phone_click` trigger + conversion linker) | GTM container JS |
| **CallRail DNI** | ✅ live sitewide — `swap.js` company 438678888, afterInteractive, preloaded; canonical (253) 750-0211 retained in static HTML/JSON-LD (NAP-safe) | all pages |
| **Microsoft Clarity** | ✅ live (env-injected project ID inside RSC payload — invisible to naive static grep, fires at runtime) | homepage payload |
| **Google Ads on-site tag** | ✅ correctly ABSENT — no AW- tag by design; conversions arrive via CallRail native import + GA4 key-event import. Conversion linker + auto-tagging carry GCLID | GTM container + Ads API |
| Meta Pixel / Bing UET | ❌ absent (matches 2026-06-01 audit; decision item, not a defect) | all pages |

## Code layer (matches live)

- `layout.tsx`: every tag env-gated (`NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_CALLRAIL_*`, `NEXT_PUBLIC_CLARITY_PROJECT_ID`) — all set in Vercel prod.
- `Analytics.tsx`: clean dataLayer model — the old `CONVERSION_LABEL` placeholders from the pre-rebuild audit are gone.
- `TrackingDelegator.tsx`: global `tel:` listener fires `phone_click` with source attribution (header/footer/mobile_sticky_bar/page_body) — engagement-only, correctly de-duped from CallRail conversions.
- `ContactForm.tsx` / `LpQuickForm.tsx`: `generate_lead` with ECL-ready user_data.

## Google Ads account verification (read-only API, acct 1665761172)

- Auto-tagging **enabled**; call reporting + call conversion reporting **enabled**.
- **Primary conversion actions** (count in "Conversions"): `First Time Phone Call` (CallRail import) · `Got Moles (web) generate_lead` (GA4 import) · `Calls from ads` (call extensions).
- **Last 30d: 37 conversions = 21 first-time calls + 14 form leads + 2 ad calls.** $3,880 spend → ≈$105/lead blended.
- Correctly secondary/not-counted: Repeat Phone Call (2), Text Message, GBP local actions; old `Phone Call` upload action REMOVED (superseded). No double-count paths found.
- Campaigns: Brand + T1 v2 City Exact ENABLED; T1/T2/T3 originals PAUSED.

## Open items (all known, none new, none broken)

1. **Quiz completion blind spot** — ScoreApp conversions still not tied back to GA4/Ads (June audit gap #3).
2. **Consent banner decision** (brief F1–F3) still open — WA-only, low legal risk, Osano free tier recommended.
3. GTM `<noscript>` iframe absent — cosmetic best-practice only.
4. Meta Pixel / Bing UET — install only if paid Meta/Bing resumes.
5. Reusable review script saved: `scripts/_gm-conv-actions-review.mjs` (read-only; lists all conversion actions + 30d split).
