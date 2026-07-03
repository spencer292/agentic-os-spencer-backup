---
project: paid-search-landing-pages
status: complete
level: 2
created: 2026-05-05
updated: 2026-05-24
closed: 2026-05-24
parent: got-moles-marketing-os
parent_external: ../../../../projects/briefs/got-moles-paid-search/ (ATP root — spec source)
current_spec: 2026-05-24_lp-conversion-build-plan.md
template_spec: 2026-05-23_no-video-lp-template-spec.md
---

# Paid Search Landing Pages — Got Moles

> **✅ CLOSED 2026-05-24.** All 24 `/lp/{city}/` pages shipped and verified live (QS re-check 24/24
> pass: keyword-led H1, single title, header off + minimal footer, GA4 firing). Bothell added on demand.
> Remaining LP work is demand-triggered backlog (8 in-area cities) and is now tracked under the
> **paid-search** project, not here. Ad-side activation lives in `projects/briefs/got-moles-paid-search/`.

> **▶ CURRENT SOURCE OF TRUTH (2026-05-23):** **[`2026-05-23_no-video-lp-template-spec.md`](./2026-05-23_no-video-lp-template-spec.md)** — the no-video city LP template expansion. Read this for all current build work.
>
> **Spec lineage (newest first):**
> - **v3 — 2026-05-23 (current):** [`2026-05-23_no-video-lp-template-spec.md`](./2026-05-23_no-video-lp-template-spec.md). Extend the working `/lp/[city]/` template to ~18 more WA cities, data-driven from `city-data.ts`, no video required (reserved empty slot). Convert the 5 static city files to one dynamic `[city]` route. LP pages render directly from `lp-city-data.ts` — **no CMS / no reseed / no Blob.** Adds local-proof + FAQ blocks.
> - **v2 — 2026-05-15 (shipped):** [`2026-05-15_lp-build-spec-merged.md`](./2026-05-15_lp-build-spec-merged.md). Built the first 5 geo LPs (Seattle, Tacoma, Kent, Bellevue, Kirkland) at `/lp/[city]/`. ✅ Live, Kirkland 42.9% CTR.
> - **v1 — 2026-05-05 (history, below):** original 8-LP plan (Service + Geo + Supporting). Sections below are kept for context only.
>
> v3 is the next chapter of this same L2 project: scaling the proven 5-LP pattern from 5 → ~33 cities, in waves.

---

## Scope & rollout — confirmed 2026-05-23 (with Roy)

- **Build the full set ahead of demand.** Justified by evidence of paid demand on **exact-match key phrases** for these cities. We do not wait for per-city demand to prove out before building the page.
- **Rollout in waves:**
  - **Wave 1 — 18 cities, now** (the list in `2026-05-23_no-video-lp-template-spec.md`).
  - **Wave 2 — next 10 cities, after Wave 1** (list TBD; drawn from the same exact-match demand evidence).
  - Target footprint ≈ **33 LPs** (existing 5 + 18 + 10).
- **Sequence per city: page first, ads after.** Build the LP → make it genuinely excellent for click-through and conversion → tune hard for **Quality Score (landing-page experience)** → **then enable that city's ads.** Ads follow good pages, never the reverse.
- **QS timing nuance:** landing-page-experience QS is only scored once an ad actually serves the final URL — so pre-launch we *build to maximize* the LPE signals (message-match, CWV/speed, mobile, transparency, original local content), then **confirm and monitor QS live and refine** after enabling.

## Coverage check — `city-data.ts` (run 2026-05-23)

`city-data.ts` holds 68 cities with full local content. Wave 1 (18 cities) checks out as:

- **✅ Ready to build now — 14:** redmond, renton, tukwila, woodinville, shoreline, burien, issaquah, enumclaw, puyallup, buckley, covington, fife, sammamish, kenmore. Each has `whyMolesThrive` + `localTip` + `localDetails` (neighborhoods) + 5–15 FAQs.
- **❌ Missing from `city-data.ts` — 4:** **maple-valley, federal-way, south-hill, des-moines.** No entry → nothing for the template to render. Local content must be written before these build (else thin pages = weak CTR + weak QS).

**Data issues to fix:**
- **Buckley county is wrong** — `city-data.ts` lists King County; Buckley is in **Pierce County**. Breaks the county→hero-image map (would serve `hero-king-county` instead of `hero-pierce-county`). Fix the source field.
- **FAQ Posture-A scrub needed** — the LP FAQ block pulls `city-data.ts` FAQs verbatim. At least 2 entries carry banned "legal in Washington / wildlife regulations" phrasing (Bellevue + one other). Scrub all FAQs that go live. (Other regex hits — "activity spike," "kills grass," "grub killer," "sonic spikes" — are legitimate, not mechanism/kill language.)

**Net:** Wave 1 = **14 ready + 4 need content**. Wave 2 (next 10) cities still TBD.

---

## Goal

Build 8 purpose-built landing pages under `/lp/*` for Google Ads paid traffic. Maximise Quality Score, conversion rate, and ad-to-page message match — without disturbing the existing organic SEO surface (services pages + 90 city pages stay intact).

## Upstream inputs

- **Spec (canonical):** `agent-os/projects/briefs/got-moles-paid-search/12-landing-page-build-spec.md` — section order, content briefs per LP, tech requirements, acceptance criteria
- **Build runbook:** `clients/got-moles/projects/briefs/website-rebuild-rebrand/PAGE-BUILD-REFERENCE.md` — page route pattern, seed flow, image rules, deploy
- **Prior copy draft (Mar 2026):** `website-rebuild-rebrand/copy-adwords-lps.md` — superseded by spec but useful as voice reference
- **Posture A (silent on trap mechanism):** `agent-os/projects/briefs/got-moles-paid-search/10-i713-mole-trap-legality.md`
- **Banned/approved phrasing:** `agent-os/projects/briefs/got-moles-paid-search/11-copy-rewrite-patterns.md`

## Deliverables

8 LPs under `/lp/*`, build order one-at-a-time:

**Tier A — Service (3)**
- `/lp/mole-removal/` (replaces `/lp/mole-trapper/` stub + 301 redirect) — REFERENCE BUILD
- `/lp/year-round-mole-protection/`
- `/lp/commercial-mole-control/`

**Tier B — Geo (3)** — pending Spencer's GBP confirmation
- `/lp/mole-removal-tacoma/`
- `/lp/mole-removal-seattle/`
- `/lp/mole-removal-olympia/`

**Tier C — Supporting (2)**
- `/lp/mole-removal-quote/`
- `/lp/emergency-mole-removal/`

Per LP, every deliverable includes:
- Page route at `src/app/(frontend)/lp/{slug}/page.tsx`
- Block stack (9 sections per spec §4) in `pages-data.ts`
- Hero image (placeholder until Moni decides direction)
- Humanizer 8.0+ deep pass on all copy
- `allPages` entry in `seed.ts` + friendly name
- Seeded to CMS, verified on staging

Cross-LP infra (one-time, done in Phase 1):

**SEO / indexing**
- `noindex,nofollow` meta on `lp/layout.tsx`
- `Disallow: /lp/` in `robots.txt`
- `/lp/*` excluded from sitemap.xml
- 301 `/lp/mole-trapper/` → `/lp/mole-removal/` in `redirects.ts`

**Tracking stack** (all 14 layers from spec §7 must work; SEO-blocking and tracking are independent)
- GTM container loaded sitewide
- Google Ads Conversion Linker (sets `_gcl_aw`)
- Google Ads site-wide event tag (remarketing page view)
- Google Ads conversion tags: Lead Form Submit, Phone Call from Website, Booked Job (OCI server-to-server from Jobber webhook)
- Enhanced Conversions for Leads (hashed email/phone via User-Provided Data variable in GTM)
- GA4 config + `generate_lead` event + `phone_click` event (mirrors to Google Ads via GA4 import)
- Meta Pixel base + `Lead` event
- Meta CAPI mirror with `event_id` dedup (Cloudflare Worker / n8n) — recovers iOS / Safari ITP loss
- CallRail swap.js + form submission API (already wired commit `03c3d2e`)
- Microsoft Clarity (when added)

**DataLayer contract** (no tag hardcodes page logic — everything keys off these events)
- `page_view` on load: `{ event, page_type: 'lp', lp_slug }`
- `lead_submit` on form success: `{ event, form_location: 'hero|midpage|final', lp_slug, user_data: { email_hash, phone_hash }, event_id }`
- `phone_click` on tap: `{ event, click_location: 'hero|sticky|final' }`
- `event_id` shared between Pixel + CAPI for dedup

**GCLID capture flow**
- JS reads `?gclid=` param OR `_gcl_aw` cookie → hidden form field → POSTed to Jobber `clientCreate` with GCLID in custom field → persists on Jobber client record for OCI later

**Privacy + compliance**
- Privacy Policy link in LP footer (Google Ads + Meta Ads policy)
- Cookie banner with Accept / Decline (do NOT gate page content)
- Google Consent Mode v2: `ad_storage` + `analytics_storage` default to `denied`, update on consent — supports modeled conversions for declined users
- No deceptive practices: H1 must match ad headline intent, no bait-and-switch

## Acceptance criteria

Per spec §10. Headline checks:
- All 8 LPs live on staging at `/lp/{slug}/`, return 200
- All `noindex,nofollow` verified in source
- All excluded from sitemap + disallowed in robots.txt
- Each passes Core Web Vitals (LCP <2.5s, INP <200ms, CLS <0.1)
- Each LP form POSTs to Jobber `clientCreate` with GCLID captured + persisted to Jobber client record (test `?gclid=TEST123`)
- GTM container loaded — verified via GTM Preview Mode
- DataLayer events fire: `page_view` on load, `lead_submit` on form, `phone_click` on tap
- GA4 DebugView confirms `page_view` + `generate_lead` + `phone_click`
- Google Ads Conversion Linker sets `_gcl_aw` cookie on landing
- Google Ads conversion fires on form success (Conversion Tracking diagnostic)
- Enhanced Conversions for Leads — hashed email/phone visible in Google Ads Diagnose Conversions
- Meta Pixel `PageView` + `Lead` fire (Events Manager Test Events)
- Meta CAPI mirror lands with matching `event_id` — Events Manager shows "Browser + Server" dedup
- CallRail swap.js fires before user interaction (number swap on first paint)
- Cookie banner appears + Consent Mode v2 defaults applied
- Privacy Policy link in footer of every LP
- Phone tap-to-call dials CallRail-swapped number
- Posture A audit clean across all 8 (zero "body-gripping", "scissor", "harpoon", "I-713", "wildlife regulations", "WA's #1", "only mole-exclusive", "guaranteed eradication")
- All 8 have unique H1, subhead, and first paragraph (no dup-content risk)
- LocalBusiness schema on Tier B; Service schema on Tier A
- `/lp/mole-trapper/` returns 301 to `/lp/mole-removal/`
- Spencer + Roy approval per LP on staging

## Build order

Sequential, not parallel. Each phase de-risks the next.

1. **Phase 1 — Reference build:** `/lp/mole-removal/` end-to-end. Includes one-time cross-LP infra (layout noindex, robots, sitemap, 301 redirect, GCLID capture). Iterate until acceptance criteria pass clean.
2. **Phase 2 — Tier A complete:** replicate pattern for year-round + commercial.
3. **Phase 3 — Tier B geo:** 3 geo LPs (gated on Spencer's GBP confirmation).
4. **Phase 4 — Tier C supporting:** quote + emergency LPs.
5. **Phase 5 — Verification crawl:** full Posture A audit across all 8 + final sign-off.

## Open inputs / dependencies

Blockers for specific phases (not for Phase 1 reference build):

1. **Spencer's 3 GBP locations** — gates Phase 3 (assumed Tacoma/Seattle/Olympia; needs confirmation)
2. **GTM container ID** — needed for tracking acceptance criteria; per memory, GTM install is mid-build (steps 1-3 of 7 done at commit `ee300bc`, step 4 ECL next)
3. **Pricing positioning** — is `$450 flat rate` still current? Affects `/lp/mole-removal-quote/`
4. **Hero image direction** — Roy + Moni decision (AI-gen / stock / photographed). Phase 1 uses placeholder.
5. **"Won job" definition** — feeds GA4 event mapping, not a hard blocker for Phase 1

## Constraints / non-negotiables

- **Ask-first on every code change** — Got Moles is launch-track, no unauthorised builds, edits, commits, or pushes (per memory `feedback_no_unauthorized_build_actions`)
- **CMS-first build pattern** with `pages-data.ts` fallback — per PAGE-BUILD-REFERENCE
- **Staging only**, never localhost — `project-pf8c6.vercel.app/{path}` (per memory `feedback_staging_not_localhost`)
- **US English** throughout (per client CLAUDE.md)
- **Posture A** — silent on trap mechanism on every LP
- **Humanizer deep pass mandatory** before commit, target 8.0+
- **`/lp/*` is paid-traffic-only** — never compete with city/service pages organically; noindex enforced

## Output location

This brief + build artefacts live here. Code lives in the existing site repo at `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/`. Build session runs from the got-moles client window: `cd clients/got-moles && claude`.
