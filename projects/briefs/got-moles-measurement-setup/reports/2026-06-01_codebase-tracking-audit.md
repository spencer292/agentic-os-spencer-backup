# WS2 Measurement — Codebase Tracking Audit (2026-06-01)

**Scope:** What tracking is actually installed in the Got Moles site code and firing on production — verified against the live site, no external API access needed. First step of WS2 (Measurement Layer) per the marketing-os restart.

**Headline:** The instrumentation layer is **better than the measurement brief assumed and in good shape.** The architecture was re-built since the brief was written — it's now a clean **GTM-dataLayer** model (all platform tags live in the GTM UI; code just pushes semantic events), not the hardcoded-tag model the brief describes. **GTM, Microsoft Clarity, and CallRail are all live on production.** The gaps are not code — they're (a) confirming what's configured *inside* the GTM container, and (b) whether GA4/GBP are receiving data. Those need the access Roy is wiring.

---

## Live production verification (got-moles.com, 3 page types probed)

| Signal | Home | Seattle city | Contact | Verdict |
|---|---|---|---|---|
| **GTM container** (`GTM-5XLRMCGQ`) | ✅ | ✅ | ✅ | **LIVE sitewide** |
| **Microsoft Clarity** | ✅ | ✅ | ✅ | **LIVE** (heatmaps/session replay/rage-click recording NOW) |
| **CallRail** swap.js | ✅ | ✅ | ✅ | **LIVE** (dynamic call tracking + number swap) |
| GA4 (direct gtag) | ❌ | ❌ | ❌ | Expected — fires *inside* GTM, not as direct tag. Needs GTM/GA4 access to confirm it's configured |
| Meta Pixel | ❌ | ❌ | ❌ | Not in GTM container (or not on these pages). Confirm if paid Meta is intended |
| Bing UET | ❌ | ❌ | ❌ | Not present. Brief flagged Bing = 34% of historical paid mix — gap if paid Bing resumes |
| `dataLayer` in static HTML | ❌ | ❌ | ❌ | **False negative — ignore.** GTM creates dataLayer at runtime; our push events fire on interaction, never in initial HTML |

---

## Code layer — event instrumentation (read from source)

The semantic event layer is well-designed. `components/Analytics.tsx` pushes to `dataLayer`; GTM maps each event to whatever platforms are configured. Adding a platform = a GTM tag, zero redeploy. Clean.

| Event | Helper | Fired from | Coverage verdict |
|---|---|---|---|
| **`phone_click`** | `trackPhoneCall()` | `TrackingDelegator.tsx` — global document-level listener on every `a[href^="tel:"]`, with source attribution (header/footer/mobile_sticky_bar/page_body) | ✅ **Excellent** — auto-catches every tel: link sitewide incl. future ones. Engagement-only (real conversions via CallRail native import — correctly de-duped) |
| **`generate_lead`** | `trackFormSubmit()` | `ContactForm.tsx` (contact_request) + `LpQuickForm.tsx` (lp_quick_form), both on successful submit | ✅ **Good** — GA4-recommended event name, ECL-compatible `user_data` payload (email/phone/name/zip) for Enhanced Conversions + Meta Advanced Matching |
| **`quiz_cta_click`** | `pushClickEvent()` in `QuizCTA.tsx` | quiz CTA blocks (blog/city), with placement + cluster + slug + UTM | ⚠ **Partial** — fires the *click* toward score.got-moles.com. The quiz **completion** happens on ScoreApp (external) and is NOT captured here — that's the lead-outcome blind spot |
| **`cta_click`** | `trackCtaClick()` | defined, generic | ⚠ **Defined but unused** — no call sites found. Available for instrumenting key buttons if we want CTA-level funnel data |

**Lead capture backend (`/api/contact/route.ts`):** solid. Saves to Payload `leads` collection (source of truth) → syncs to **Jobber** (Spencer's triage UI) → status tracked (new/synced-jobber/failed-sync) with error logging. Rate-limited, honeypot, validated. Form submissions become real leads in Jobber **and** a queryable DB table.

---

## Env-var gating (why presence ≠ firing)

Every tag is gated: `{process.env.NEXT_PUBLIC_X && <Tag/>}`. So production firing proves these keys ARE set in Vercel:
- ✅ `NEXT_PUBLIC_GTM_ID` (= GTM-5XLRMCGQ)
- ✅ `NEXT_PUBLIC_CLARITY_PROJECT_ID`
- ✅ `NEXT_PUBLIC_CALLRAIL_COMPANY_ID` + `NEXT_PUBLIC_CALLRAIL_KEY`

(Local `.env`/`.env.local` only hold DB + Blob tokens — tracking keys are Vercel-prod-only, which is correct.)

---

## The real gaps (what WS2 still needs — none are code rewrites)

| # | Gap | Type | Needs |
|---|---|---|---|
| 1 | **What's configured INSIDE GTM-5XLRMCGQ** is invisible from outside. Is GA4 receiving `generate_lead` + `phone_click`? Are conversions marked? | Config verification | **GTM container access** (or GA4 access to confirm events arriving) |
| 2 | **GA4 → is data actually flowing + are key events marked as conversions?** | Verification | **GA4 access** (Roy wiring) |
| 3 | **Quiz completion** (the warmest lead signal) lives on ScoreApp and isn't tied back to GA4/leads | Attribution blind spot | ScoreApp → GA4/GTM integration, or ScoreApp export |
| 4 | **GBP insights** (calls/directions/discovery per 3 locations) — where most local leads originate | Not on-site at all | **GBP access** (Roy wiring) |
| 5 | **No dashboard** unifying GSC + GA4 + Clarity + CallRail + Jobber leads into one lead/conversion view by page-type | Reporting | Looker Studio once #1–2 confirmed |
| 6 | Meta Pixel + Bing UET absent | Decision | Confirm whether paid Meta/Bing are in plan (else ignore — paid is ATP's concern) |

---

## What this means for the restart

The "we're flying blind" diagnosis was **half right**: the *recording instruments are installed and running* (GTM + Clarity + CallRail live; events well-instrumented). What's missing is the **cockpit** — nobody has assembled the live view, and 3 confirmations (GTM config, GA4 flow, GBP) need the access being wired now.

**This is a much better starting position than the brief implied.** We are not building tracking from scratch — we are (a) verifying the GTM container is wired to GA4 correctly, (b) plugging the quiz-completion + GBP gaps, and (c) standing up the dashboard. Clarity is *already recording* — there may be weeks of session-replay/heatmap data waiting the moment we get access.

### Immediate next actions (in order)
1. **Roy:** grant GA4 + GSC + Clarity + GBP×3 access (in progress).
2. **Then me:** open GTM-5XLRMCGQ → inventory tags/triggers/variables; confirm GA4 tag fires on `generate_lead` + `phone_click` and they're marked key events.
3. **Then me:** pull the REAL buyer-query baseline from GSC — exact live positions for `mole control near me`, `mole exterminator near me`, `mole control {top-10 cities}` (replaces the stale scan).
4. **Then me:** check Clarity for existing recorded data (likely already sitting there).
5. **Then me:** stand up the unified lead/conversion dashboard → hands off to WS8 CRO + WS1 Get-Found, data-driven.

*Verified live 2026-06-01 via `_ws2-tracking-probe.mjs` (read-only). Supersedes the measurement brief's "Analytics.tsx hardcoded-tag" description — architecture is now GTM-dataLayer.*
