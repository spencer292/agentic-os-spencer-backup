# CallRail Website Number Pool — Setup Requirements

**Created:** 2026-04-30
**Status:** LIVE — verified in production 2026-05-28
**Trigger:** 2026-04-29 pre-flip audit identified missing source attribution on phone calls. Single hardcoded number across 3 GBPs and all paid/organic channels = no per-source ROI.

> **Verification 2026-05-28:** `swap.js` confirmed firing sitewide on got-moles.com via raw view-source. Snippet renders from the root `(frontend)/layout.tsx`, env-gated on `NEXT_PUBLIC_CALLRAIL_COMPANY_ID` (`438678888`) + `NEXT_PUBLIC_CALLRAIL_KEY` (`d7c60fc985ac8f0eda75`) — both set in Vercel Production. Preload hint present in `<head>`. All JSON-LD `telephone` fields correctly retain canonical `+12537500211` (schema untouched by DNI). Note: WebFetch is unreliable for this check — it strips `<script>` tags; use raw view-source or curl. Runtime checks still owned by the CallRail dashboard (pool exhaustion, source attribution, "snippet installed" warning cleared).

---

## What a Website Pool Actually Does

A pool of N tracking numbers is dynamically rotated into the visible DOM and `tel:` hrefs of every page on the site, **per visitor session**. CallRail then tells you which marketing source (Google Ads / Google Organic / Bing / direct / referral / specific UTM / specific landing page) drove every inbound call, with full keyword and campaign attribution where available.

The canonical business number stays in JSON-LD schema, GBP, and footer for SEO / NAP integrity. Only the **visible rendered number** swaps — search engines never see the tracking numbers, so there's no NAP-consistency penalty.

---

## What We Need to Procure

### 1. CallRail Plan
**Call Tracking — $50/month** (entry plan, source: callrail.com/pricing 2026).

Includes:
- 5 local tracking numbers
- 250 local minutes/month
- Unlimited DNI / website pools
- Native Google Ads + GA4 + GTM integrations
- Recording + transcription (entry tier)

**Add-ons we'll likely need:**
- 3-5 extra numbers @ $3/mo each (= $9-15/mo) → see pool sizing below
- Possibly toll-free swap number @ $5/mo if we want one canonical 1-800 fronting all 3 locations later

**Estimated all-in:** $60-70/month for the launch configuration.

### 2. Pool Size — How Many Numbers?

Rule of thumb: 1 tracking number per concurrent unique visitor in a 30-minute session window. Got Moles is a local-service site; assume modest concurrent traffic at launch. Plus realistic ramp through peak season May-September.

**Recommended starting pool: 8 numbers.**
- 5 included in plan
- +3 add-ons @ $3 = $9/mo
- CallRail will alert if the pool exhausts (visitor sees the static number = source attribution lost for that visit)
- Easy to scale up post-launch from the dashboard

Pool sizing can be revisited at the 30-day mark using CallRail's "Pool Capacity" dashboard.

### 3. Integrations to Enable

All native, all toggle-on inside CallRail after account setup:

| Integration | Purpose | Status now |
|---|---|---|
| Google Ads | Auto-creates "Phone Call" conversion action, imports conversions, supports Enhanced Conversions for Calls | **Solves yesterday's `CONVERSION_LABEL` placeholder problem** — CallRail provides the conversion action, no manual label needed |
| GA4 | Sends `phone_call` events with source/medium/campaign attribution | Replaces / augments our manual `trackPhoneCall()` GA4 event |
| Microsoft Advertising (Bing) | Imports calls as Bing Ads conversions | Pending Bing Ads account creation by Spencer |
| Meta (Conversions API) | Native CAPI integration — server-side phone-call events to Meta | Solves the "no CAPI" gap from the audit |
| GBP / Local Service Ads | Optional — for LSA call attribution later | Phase 2 |

---

## Site-Side Implementation (what changes in code)

Three small changes in `projects/briefs/website-rebuild-rebrand/site/`:

### a. Inject the CallRail swap.js snippet
Add to `src/app/(frontend)/layout.tsx` using `next/script` with `strategy="afterInteractive"`. Single tag, env-var-gated:
```tsx
<Script
  src={`//cdn.callrail.com/companies/${process.env.NEXT_PUBLIC_CALLRAIL_COMPANY_ID}/${process.env.NEXT_PUBLIC_CALLRAIL_KEY}/12/swap.js`}
  strategy="afterInteractive"
/>
```
No other code change required for the swap itself — CallRail finds the canonical number in the DOM and replaces it.

### b. Set the swap target
In CallRail, set the **swap target** = `(253) 750-0211` (the canonical number currently hardcoded). CallRail will find every instance and swap it.

**Important:** CallRail swaps `tel:` hrefs AND visible text. So the `onClick={trackPhoneCall}` wiring identified in yesterday's audit (Blocker #1) is **still valuable** — it fires our own GA4/Pixel/Bing events on click, regardless of which tracking number is rendered. The two layers stack:

- CallRail = source attribution + post-call tracking (duration, recording, transcript)
- Our `trackPhoneCall()` = click-level event firing for Pixel/Bing UET browser-side

### c. Schema integrity rule
**Do NOT** swap the number in `src/lib/schema.tsx` JSON-LD. Schema must keep `BUSINESS.phone` canonical. CallRail's default JS swap operates on visible DOM only, not on `<script type="application/ld+json">` blocks — so this is automatic, but verify in testing.

---

## What This Replaces / Resolves From the Pre-Flip Audit

| Audit gap | CallRail resolves? |
|-----------|:-:|
| `CONVERSION_LABEL` literal placeholder | ✅ CallRail provides the GAds conversion action and label |
| No source attribution on calls | ✅ Core CallRail feature |
| No per-channel ROI for ads | ✅ Native GAds + Bing UET + Meta CAPI |
| No CAPI (server-side Meta) | ✅ CallRail has native Meta CAPI |
| `trackPhoneCall()` not wired to `tel:` links | ❌ Still needs wiring — gives us click-time events independent of CallRail |
| Per-GBP-location attribution (Seattle/Tacoma/Enumclaw) | ⚠️ Partial — see below |

---

## Open Decision: Per-Location Attribution

Three GBPs all currently ring `(253) 750-0211`. Two paths:

**Path A — Single pool, all sources (recommended for launch)**
- One website pool, 8 numbers, swaps based on traffic source
- Tells us "Google Ads → call" but not "Seattle GBP → call"
- Cheapest, fastest, ships before Friday flip

**Path B — Per-location source numbers (post-launch upgrade)**
- 3 dedicated source numbers — one per GBP, point each GBP listing at its dedicated number (no swap, static)
- Plus the website pool for digital sources
- Tells us GBP-by-GBP call volume + still gets digital attribution
- Needs Spencer agreement to update each GBP listing — coordinate with `got-moles-measurement-setup` Track on GBP migration

**Recommendation:** Ship Path A this week. Layer Path B in Week 2-4 post-flip when GBPs get re-pointed at the new domain anyway.

---

## ACTION PLAN — Updated 2026-04-30

**Flip target:** Friday 2026-05-02. Plan structured as: today, tomorrow (test), flip day, post-flip.

### Status (what's already done)
- ✅ CallRail company `Got Moles?` provisioned (Company ID `438678888`)
- ✅ Website pool created — 4 numbers, swap target `(253) 750-0211`, sources = All
- ✅ Per-GBP tracking numbers configured: Seattle, Tacoma, Enumclaw (Path B already implemented — better than expected)
- ✅ Facebook + Instagram source numbers configured
- ✅ Default Call Flow set up (forwards to `(253) 222-0846`)
- ✅ Code: CallRail `swap.js` injected in root layout (`(frontend)/layout.tsx`)
- ✅ Code: broken `CONVERSION_LABEL` GAds firing removed from `Analytics.tsx` (CallRail will own GAds call conversions natively)

---

### Account Reality (as of 2026-04-30)

Plan must respect what's actually live vs what's not. Updated 2026-04-30:

| Account | Status | Pre-flip action available? |
|---|---|---|
| CallRail | Trial active, 8 days left, pool of 4 numbers | ✅ Yes — paid configuration today |
| Google Ads (Spencer's new) | Provisioned (ID in Vercel env), no live campaigns yet, cold-starting per `feedback_cold_start_over_handover.md` | ⚠️ Plumbing only — connect integration but no ads running to attribute |
| Google Ads (previous agency) | Old agency still controls. Their campaigns send clicks to OLD got-moles.com URL. We do not have access. | ❌ Out of scope — Spencer to kill or migrate post-flip |
| GA4 (Spencer's) | Property exists, ID in Vercel env, fresh data | ✅ Yes — connect integration, traffic flows on flip |
| Meta Pixel | Spencer-blocked on Business Portfolio admin access | ❌ Defer — Phase 5 |
| Meta CAPI | Same blocker | ❌ Defer — Phase 5 |
| Bing Ads + UET | Account doesn't exist yet | ❌ Defer — Phase 5 |

**Key reframe:** pre-flip integration work is *plumbing setup*, not *attribution verification*. Verification (call → conversion appears in GAds with campaign data) requires Spencer's new GAds campaigns running, which is post-flip work.

---

### Phase 1 — Pre-Flip Plumbing (TODAY, 2026-04-30)

**1a. Code (DONE — commit `0dbbc9d` on `mine`)**
- [x] Inject CallRail `swap.js` in root layout (env-var-gated)
- [x] Strip broken `CONVERSION_LABEL` from `Analytics.tsx`
- [x] Commit + push to staging — deployed
- [x] DNI proven on staging (visible swap to `(253) 544-5581`)

**1b. CallRail account hygiene (Spencer / Roy in dashboard)**
- [ ] Add credit card (8-day trial expiry risk)
- [ ] Bump pool size 4 → 8 (Website pool → ✏️). $9/mo extra.
- [ ] Confirm `(253) 750-0211` is still ringing somewhere (carrier-level forward to `(253) 222-0846` or directly answered). Required for visitors hitting the canonical before swap.js fires or with JS disabled.

**1c. CallRail integration plumbing — connect but expect no real conversions yet**

These connect the pipes. Real conversions only flow once Spencer's new GAds runs live campaigns post-flip.

- [ ] **In Google Ads (Spencer's new account):** Admin → Account settings → enable **Auto-tagging**. Required prerequisite for CallRail to attribute imported conversions.
- [ ] **CallRail → Google Ads:** left nav Integrations icon → Google Ads → choose `Got Moles?` company → Authorize → select Spencer's GAds account → tick Calls + Forms → choose "one conversion for all calls" → Activate. This auto-creates `Phone Call` + `Form Capture` conversion actions in GAds, ready to receive data once campaigns run.
- [ ] **In GA4:** Admin → Data Streams → web stream → Measurement Protocol API secrets → Create → copy secret
- [ ] **CallRail → GA4:** left nav Integrations icon → Google Analytics 4 → paste Measurement ID + API Secret → tick Calls + Forms → Activate.

**1d. Smoke test on staging (Phase 2 — see below)**

---

### Phase 2 — Pre-Flip Smoke Test (TOMORROW, 2026-05-01)

These prove the **plumbing** works. They do NOT prove **campaign attribution** — that requires Spencer's new GAds running live campaigns (Phase 4b post-flip).

All on `project-pf8c6.vercel.app` (staging) before DNS flip.

**Coverage audit verified 2026-04-30:** every phone instance across the site is either (a) in body content / `tel:` href → swapped, or (b) in `<head>` metadata / JSON-LD → correctly canonical. See "Coverage Map" section below for full inventory. Top-right icon-only phone button: `href` swaps correctly → click dials pool number → tracked.

**Live verification steps:**

- [ ] Visit homepage → wait 2 sec → inspect a phone CTA. Visible number should NOT be `(253) 750-0211` (it should be a pool number). If it IS still canonical, CallRail JS isn't running — debug.
- [ ] Refresh → confirm a different pool number appears (proves rotation)
- [ ] **DevTools href check:** right-click any phone CTA → Inspect → confirm `href="tel:..."` resolves to a pool number, NOT canonical `+12537500211`. Repeat on the top-right icon button (no visible text, only DevTools confirms swap). Repeat on footer.
- [ ] Click a phone CTA on a city page (e.g. `/locations/bellevue`) → check CallRail dashboard "Activity" — call should appear within 30 sec with source = direct/staging
- [ ] Verify `swap.js` request in browser Network tab — must be 200 OK
- [ ] Verify CallRail dashboard alert "JavaScript snippet not installed" has cleared
- [ ] **View page source (Ctrl-U, NOT DevTools):** JSON-LD schema (`<script type="application/ld+json">` blocks) must show canonical `(253) 750-0211`. Meta description (`<meta name="description">`) must show canonical. DNI does not touch `<head>`.
- [ ] Submit contact form → confirm Jobber receives it AND `generate_lead` GA4 event fires (DebugView)
- [ ] In CallRail → confirm Google Ads integration shows "Active" status (plumbing only — no real conversions yet, no campaigns running)
- [ ] In Google Ads (Spencer's account) → Goals/Conversions → confirm `Phone Call` and `Form Capture` actions exist with source "Import from clicks". Status will be "No recent conversions" — that's fine, expected, no campaigns running yet.
- [ ] In CallRail → confirm GA4 integration shows "Active" with the right Measurement ID

**Pass criteria (plumbing only):** visible number swaps, hrefs swap, calls appear in CallRail, schema + meta-description canonical, GAds + GA4 integrations show "Active", no console errors. All pass → green-light flip. Attribution-end-to-end testing happens post-flip in Phase 4b once Spencer's campaigns run.

---

### Coverage Map (verified 2026-04-30)

**Will swap correctly (CallRail handles in body):**
- Hero CTAs (every page) — `blocks/Hero.ts`, `PageHero.tsx`, `HeroBlock.tsx`
- All CTA blocks — `blocks/CTA.ts`, `CTABlock.tsx`
- Header phone icon (top-right desktop + mobile circle + in-menu button) — `Header.tsx`
- Footer — `Footer.tsx`
- Mobile sticky bar — `MobileStickyBar.tsx`
- Landing pages `/lp/*` — `LandingPage.tsx`
- Blog post in-article phone refs + CTA blocks — `BlogPostContent.tsx`, `blog-data.ts` (30+ instances)
- Payload-CMS body content — pages-data defaults, all dynamic city/blog pages
- SiteSettings global default

**Correctly NOT swapped (canonical preserved):**
- JSON-LD schema (6 telephone fields in `lib/schema.tsx`) — required canonical for SEO/AI Overview citation
- Meta description in `<head>` (`layout.tsx:15`) — appears in SERP snippets, must be canonical
- Migration `.json` files — dev artifacts, not rendered
- Server-side `api/contact` route — internal, no end-user phone exposure

**href format inventory (all swap — CallRail normalizes digits):**
- `tel:+12537500211` (E.164, used in hardcoded hrefs + Payload defaults)
- `tel:2537500211` (digits-only, derived dynamically from display via regex strip in Header/Footer/MobileStickyBar)
- Both normalize to the same 10-digit form CallRail matches against the swap target.

---

### Phase 3 — Flip Day (FRIDAY, 2026-05-02)

DNS-related items (covered in main `website-launch-readiness` brief, not duplicated here). CallRail-specific:

- [ ] Within 30 min of flip: `curl https://got-moles.com` → confirm `swap.js` loads
- [ ] Trigger one test call from a phone (call any pool tracking number) → verify it forwards to canonical AND appears in CallRail dashboard
- [ ] Re-point all 3 GBP listings at `https://got-moles.com` (was old domain) — separate from CallRail tracking numbers, which stay as-is
- [ ] Verify the per-GBP tracking numbers (Seattle/Tacoma/Enumclaw) are listed in each GBP's "Phone number" field — should already be done by Spencer

---

### Phase 4a — Post-Flip Week 1: Organic/Direct Baseline (2026-05-02 → 2026-05-09)

What we CAN do without live paid campaigns. Focus = prove organic/direct/GBP attribution pipes work.

- [ ] Daily check: CallRail Activity dashboard for call volume + source breakdown (will see Direct, Organic Google, GBP, Facebook, Instagram — no Paid yet)
- [ ] Daily check: GA4 Realtime — confirm CallRail call events firing as `phone_call` with custom params
- [ ] Trigger a controlled test call from each source: organic Google search → got-moles.com → call. Direct → call. GBP listing → call. Facebook profile → call. Verify each lands in CallRail with correct source attribution within 30 sec.
- [ ] If pool exhaustion alert fires → bump pool to 12. CallRail will email when concurrent visitors > pool.
- [ ] GA4 → register **CallRail custom dimensions** (Admin → Custom definitions → Custom dimensions). Required because Google does not expose attribution fields to CallRail's GA4 integration — source/medium/campaign come through as custom params, not standard dimensions:
  - `cr_source`, `cr_medium`, `cr_campaign`, `cr_keyword`, `cr_landing_page`, `cr_call_duration`
- [ ] Set CallRail email/Slack alerts: missed calls, after-hours calls, calls >5 min
- [ ] Confirm previous agency's GAds account is no longer sending traffic to got-moles.com (Spencer to verify they've paused/killed any active campaigns; otherwise their clicks land on the new site untracked by their account but possibly missing our auto-tagging)

### Phase 4b — Spencer's New GAds Campaigns Come Online (timing TBC, separate work stream)

This is the cold-start work. Lives outside this brief — see `google-ads-campaigns/` brief once scoped. CallRail-side actions when Spencer's campaigns go live:

- [ ] Confirm Auto-tagging still ON in Spencer's GAds account
- [ ] Confirm `Phone Call` + `Form Capture` conversion actions remain at "Active" (CallRail-imported source)
- [ ] First paid call: open Spencer's ad in incognito → click ad → land on landing page → call → verify within 12-24h: GAds shows the conversion attributed to campaign + keyword + landing page. CallRail Activity shows the call with `gclid` populated.
- [ ] Confirm enhanced conversions for calls is enabled (CallRail → GAds integration → Enhanced Conversions toggle)
- [ ] Bid optimization: once Spencer has 30+ call conversions importing, switch the GAds campaigns to a conversion-based bid strategy
- [ ] Same loop applies for Microsoft Advertising/Bing once Spencer creates the account (Phase 5)

---

### Phase 5 — Post-Flip Week 2-4 (2026-05-10 → 2026-05-30)

These are tracking upgrades that don't block launch:

- [ ] **Wire `onClick={trackPhoneCall}` to all `tel:` links** (10 components, see audit Blocker #1) — fires browser-side Pixel + Bing UET click events on click-intent (separate from CallRail's call-completion conversions). Useful for retargeting and click-vs-call funnel analysis. Defer until we have a sense of whether CallRail's native integrations cover the use cases.
- [ ] **Connect Meta CAPI** in CallRail once Spencer unblocks Pixel access — server-side call event reporting to Meta (replaces lost iOS 14.5+ Pixel events)
- [ ] **Connect Bing UET** in CallRail once Spencer creates Bing Ads account
- [ ] **Local Swap™** evaluation — currently Off. If we see a meaningful share of visitors from Eastside (425) area codes, turn on Local Swap so visitors see a same-area-code tracking number (stronger local feel, better connect rate). Costs more numbers in pool.
- [ ] **CallRail Form Tracking add-on?** Currently $50/mo upgrade to $100/mo plan. Decision: only if Jobber form submission attribution proves insufficient. Defer to Week 3.
- [ ] **Pool capacity review** at day-30 mark using CallRail's "Pool Capacity" dashboard. Bump if peak concurrency exceeds 80% of pool size.
- [ ] **Per-GBP attribution baseline** — pull 30 days of call data per GBP location, compare against organic-traffic split per location (GA4 by city). Identifies underperforming GBPs.
- [ ] **CallRail conversation intelligence** ($100/mo upgrade) — keyword spotting on call transcripts (e.g. flag calls mentioning "estimate", "Seattle", "yard"). Defer; only revisit if call volume justifies.

---

### Decisions Locked

1. ✅ Going with CallRail (Spencer signed up)
2. ✅ Path A + Path B simultaneously — Spencer already did per-GBP numbers AND a website pool. Better than original plan.
3. ✅ Removed manual GAds firing from `Analytics.tsx` — CallRail owns call/form conversions in GAds
4. ✅ Pool size 8 (bump from current 4 today)

---

## Cost Summary

| Item | Monthly |
|---|---|
| Call Tracking plan | $50 |
| 3 extra numbers (8-number pool) | $9 |
| 250 minutes included; overage @ $0.05/min | variable |
| **Estimated baseline** | **$60-70/mo** |

Annual: ~$720-840/year. Compare to: one extra booked customer per quarter pays for it.

---

## Decisions Needed From Roy

1. ✅ Green-light to procure (Spencer signs up)?
2. ✅ Path A (single pool) for launch, defer Path B post-flip?
3. ✅ Replace manual `Analytics.tsx` GAds firing entirely with CallRail-provided conversion (recommended) or keep both?
4. ✅ Pool size 8, or different number?

---

## Sources

- [Dynamic number insertion overview — CallRail Help Center](https://support.callrail.com/hc/en-us/articles/5711814948877-Dynamic-number-insertion-overview)
- [Installing the JavaScript snippet — CallRail Help Center](https://support.callrail.com/hc/en-us/articles/5711709638541-Installing-the-JavaScript-snippet)
- [Call conversions in Google Ads — CallRail Help Center](https://support.callrail.com/hc/en-us/articles/5712674412301-Call-conversions-in-Google-Ads)
- [GA4 integration — CallRail Help Center](https://support.callrail.com/hc/en-us/articles/9495611166733-Google-Analytics-4-GA4-integration)
- [CallRail and Google Ads enhanced conversions](https://support.callrail.com/hc/en-us/articles/31817036913549-CallRail-and-Google-Ads-enhanced-conversions)
- [CallRail Pricing](https://www.callrail.com/pricing)
