---
project: paid-search-landing-pages
status: active
level: 2
created: 2026-05-15
supersedes:
  - 2026-05-13 got-moles-lp-build-spec-5-cities.md (Downloads, peak-season data spec)
  - 12-landing-page-build-spec.md sections re-scoped from 8 LPs to 5 city LPs
sources:
  - clients/got-moles/projects/briefs/paid-search-landing-pages/brief.md
  - clients/got-moles/projects/briefs/website-rebuild-rebrand/PAGE-BUILD-REFERENCE.md
  - clients/got-moles/projects/briefs/website-rebuild-rebrand/BUILD-METHODOLOGY.md
  - projects/briefs/got-moles-paid-search/12-landing-page-build-spec.md (canonical tracking)
  - projects/briefs/got-moles-paid-search/10-i713-mole-trap-legality.md (Posture A)
  - projects/briefs/got-moles-paid-search/11-copy-rewrite-patterns.md (banned phrasing)
---

# Paid Search Landing Pages — Got Moles (Merged Build Spec)

## Build Status — 2026-05-15 EOD

**Phase 1 SHIPPED to staging** at https://project-pf8c6.vercel.app/lp/{slug}/ across 5 city LPs.

### What's live on the 5 LPs

| Surface | Status | Notes |
|---|---|---|
| 5 city pages (`/lp/seattle`, `/lp/tacoma`, `/lp/kent`, `/lp/bellevue`, `/lp/kirkland`) | ✅ | Thin wrappers around `RenderBlocks` + inline block array from `src/lib/lp-city-data.ts` |
| Block stack | ✅ | Hero (70vh) → LpQuickForm → stepsProcess → testimonial → TMCP CTA → final CTA |
| Hero images | ✅ placeholder | `hero-king-county.webp` for Seattle/Kent/Bellevue/Kirkland, `hero-pierce-county.webp` for Tacoma. Final per-city imagery deferred to Moni / nano-banana / gpt-image pass. |
| H1 (`Mole Removal in {City} — $150 to Start`) | ✅ | Posture A clean, US English, "15+ years" attributed to Spencer not company |
| Unique subhead per city | ✅ | Neighbourhoods + flat-pricing line (see §5.1) |
| 3-field LpQuickForm in hero zone (name/phone/email) | ✅ | `src/components/LpQuickForm.tsx`. Honeypot, hidden `zipCode`=city default + `service`=`'other'` + `message`=`'Quick form from /lp/{city}/'` posted to `/api/contact` → Jobber `clientCreate`. Design-system compliant (grass section, semi-transparent card, cream-outline inputs). |
| Bottom full ContactForm | ✅ | Existing 6-field `<ContactForm>` reachable through final CTA block (`showForm: true`) |
| TestimonialBlock (3 reviews/LP) | ✅ | Keyword-weighted picker in `src/lib/lp-city-data.ts → pickLpReviews()`. Tier 1 results ×4, Tier 2 speed ×3, Tier 3 trust ×2, Tier 4 safety ×1. Staged city fill (exact → adjacent → WA-general). Per-LP rotation offset. Posture A banned-word filter. Dedupe by reviewer. |
| 4-step "How It Works" flow on LP | ✅ | Updated to new operational reality: Phone Quote → Book + Pay $150 → First Visit Inspect+Trap → Weekly Checks. No pre-booking inspection language anywhere. |
| TMCP upsell CTA | ✅ | `grass-alt`, secondary outline button, `tel:` link |
| Final CTA with form | ✅ | `gradient` background (last block per design Rule 4) |
| `robots: 'noindex, nofollow'` meta | ✅ | Per LP `metadata` export |
| Self-referencing canonical | ✅ | `https://got-moles.com/lp/{slug}/` |
| `breadcrumbSchema` JSON-LD | ✅ | Per LP route |
| 7-rule Page Structure Checklist | ✅ | Hero trustStrip ✅, no blue/cream bg ✅, gradient only last ✅, no standalone trustBar ✅, alternating bgs ✅. Rule 6 (GEO block) intentionally skipped on LPs (noindex, no AEO benefit). |
| Build clean | ✅ | `npx next build` passes — all 5 LPs prerendered (`○ Static`) |

### What's deferred to Phase 2

| Item | Reason |
|---|---|
| GTM tracking v1 layers (dataLayer page_view + lead_submit + phone_click, ECL, Meta Pixel, Meta CAPI, Bing UET) | Blocked on GTM install steps 4-7 (per memory `project_got_moles_gtm_install`). Existing `trackFormSubmit` analytics call fires on LpQuickForm submit, but no LP-specific dataLayer events yet. |
| `cityLocalBusinessSchema` JSON-LD per LP | Only `breadcrumbSchema` rendered for now. Schema package needs LP-specific stub. |
| `robots.txt` `Disallow: /lp/` | Not yet added — sitemap exclusion not yet added either. Risk is low (`noindex,nofollow` in meta is sufficient for de-indexing, but Disallow tightens crawl budget). |
| Per-city hero imagery | Generic county images used. Real per-city imagery (Moni/nano-banana/gpt-image) deferred. |
| `landing_city` first-class hidden field on `/api/contact` | LP form posts city through `message` string instead. Backend doesn't have a `landingCity` Lead field yet. |
| Make `zipCode`/`service` optional in `/api/contact` for LP submits | LP form sends city default ZIP + `service: 'other'` as workaround. Spencer confirms ZIP on callback. |
| OCI uploader (Jobber → Google Ads "Booked Job" conversion) | Phase 2 work, not LP-blocking |
| Humanizer deep pass on final LP copy | Not yet run on the new LP copy (subheads, step descriptions, TMCP body). Spec mandates ≥ 8.0 before launch. |

### Sitewide collateral changes (shipped this session, not LP-only)

Inspection-flow correction (commit `6f7dac68`) hit a lot more than the LPs because the pre-booking inspection language was sitewide:

- `pages-data.ts` — homepage steps, how-it-works page (4 steps + GEO + final CTA), contact page (2 FAQs), OMP service (4-step process + final CTA), commercial CTAs ("REQUEST A SITE INSPECTION" → "REQUEST A COMMERCIAL QUOTE"), commercial CTA body softened
- `city-data.ts` — 8 city FAQ answers (Sammamish, Redmond, Everett, Auburn, Milton, Steilacoom, Bremerton/landscaping, Medina)
- `how-it-works/page.tsx` — HowTo JSON-LD schema 4 steps
- `service-areas/page.tsx` — response-time FAQ
- `terms/page.tsx` — Services clause
- `[citySlug]/page.tsx` — city template "How It Works" step labels
- `LandingPage.tsx` — existing 4 non-city LPs (Call/Inspect/Gone → Call/Book/Trap)
- `schema.tsx` — commercial offer description ("site inspection required for quote" → "phone consultation first; site walkthrough as part of engagement")
- 7 CMS pages reseeded before push (home, how-it-works, contact, tmcp, one-time, commercial, case-studies)

Commercial flow preserved — inspections still happen as part of commercial engagement; CTAs no longer market site inspection as a free pre-sales hook.

### Commits

| SHA | Description |
|---|---|
| `b73ae2d3` | Initial 5 city LPs (thin LandingPage-wrapper version) |
| `a371856c` | Rebuild on block system + hero images (design-system compliant layout) |
| `f55fe45f` | Remove duplicate trustBar block |
| `fbc0a622` | Add 3-field LpQuickForm |
| `9c15d718` | Align LpQuickForm with dark-first design system |
| `6f7dac68` | Sitewide pre-booking inspection sweep |
| `63a4b361` | Keyword-weighted reviews picker + TestimonialBlock |
| `2f81f2f7` | Drop hero from 85vh → 70vh |

### Open inputs from §15 — status update

| # | Input | Status |
|---|---|---|
| 1 | Tacoma GBP confirmation (Spencer) | Open — only affects `cityLocalBusinessSchema` once that schema is added in Phase 2 |
| 2 | GTM install steps 4-7 (Roy) | Open — gates all v2 tracking layers |
| 3 | Meta Pixel ID | Open |
| 4 | Bing UET Tag ID | Open |
| 5 | Hero image direction (Roy + Moni) | Placeholder used; real direction deferred |
| 6 | OCI uploader | Phase 2 |
| 7 | Exact TMCP customer count (Spencer) | Copy uses "hundreds" placeholder |
| 8 | Legacy `/lp/mole-trapper/` redirect target | N/A — Roy decision was "no redirects, just new pages." Existing `/lp/mole-trapper/` is untouched. |

### Known small follow-ups

- The static `<LandingPage>` component used by the existing 4 non-city LPs (`/lp/mole-removal`, `/lp/mole-trapper`, `/lp/commercial`, `/lp/mole-protection-plan`) does not use the new block system. It still works, but is visually inconsistent with the 5 new city LPs. Reconcile when Moni does the final design pass.
- The `Inspection` text inside the OMP service schema description (`schema.tsx` line ~92) still reads "Includes inspection, equipment setup..." — left as-is intentionally because this describes what's included in the paid service, not a free pre-booking step. Worth a final eyes-on review.
- LP form submissions go in via `service: 'other'` which means Spencer's Jobber dashboard won't filter LP leads by service intent. Consider an LP-specific `service` value (`'lp-quick'`) once `/api/contact` is extended.

---

## 0. What this is

A single source of truth for the `/lp/*` paid-traffic landing pages. Merges:

- The 8-LP `paid-search-landing-pages/brief.md` (tracking stack, infra, acceptance criteria)
- The 5-city peak-season spec (data-driven city selection, content structure, copy)
- The site's existing CMS-first build pattern (no new infra — uses Pages collection + `pages-data.ts` + `seed.ts`)

**Scope change from prior brief:** Phase 1 is now **5 geo LPs at `/lp/[city]/`** (data-justified), not 8 LPs at `/lp/{service|geo|supporting}/`. Service + Supporting LPs are deferred to Phase 2/3 pending data.

---

## 1. Goal

Build 5 purpose-built city landing pages under `/lp/[city]/` for Google Ads paid traffic. Maximise Quality Score, conversion rate, and ad-to-page message match — without disturbing the existing organic SEO surface (services pages + 90 city pages stay intact).

---

## 2. Cities to build (data-driven, peak-season Google Ads Keyword Planner May–Aug 2025)

Build in this order. Each de-risks the next.

| Order | URL | City | Tier | Peak / mo | Why |
|---|---|---|---|---|---|
| 1 | `/lp/seattle/` | Seattle | 1 | 90 | Only city with real planner volume + actual bids ($2.62) + T1 impressions. **Reference build.** |
| 2 | `/lp/tacoma/` | Tacoma | 2 | 16–23 | Second GBP location, Pierce County anchor, medium competition |
| 3 | `/lp/kent/` | Kent | 2 | 16–23 | South King hub, high competition = demand exists |
| 4 | `/lp/bellevue/` | Bellevue | 2 | 16–23 | Affluent, **low** competition = opportunity |
| 5 | `/lp/kirkland/` | Kirkland | 2 | 16–23 | Proven T1 conversions (2 conv / 1 click) despite low planner volume |

**Not selected:** Everett (high competition + $3.73 bids), Renton/Issaquah (similar to Kirkland but no conversion proof yet), Puyallup/Bonney Lake/Lynnwood (smaller), Enumclaw/Black Diamond/Orting/Roy (<10 or 0).

**Phase 2 expansion** — see §14.

**URL pattern change vs prior brief:** Moves from `/lp/mole-removal-{city}/` to `/lp/[city]/`. The previously planned 301 from `/lp/mole-trapper/` → `/lp/mole-removal/` is dropped; if `/lp/mole-trapper/` is live, redirect to `/lp/seattle/` (highest-volume city) or to homepage — Roy to decide.

---

## 3. How pages get built (uses the existing site pattern — no new infra)

Every LP follows the standard Got Moles page build pattern from `PAGE-BUILD-REFERENCE.md`. No new framework, no static HTML — block-based, CMS-first, with `pages-data.ts` fallback.

### 3.1 Block stack per LP (maps to existing 14 block types)

| # | Section | Block type | Notes |
|---|---|---|---|
| 1 | Hero (H1 + price + phone + CTA) | `hero` | `heroHeight: 'short'` (no full-bleed). `trustStrip` shows 219+ Reviews · 5,000+ Yards · Safe for Pets & Kids. Background: city/yard imagery, fallbackImage required. |
| 2 | Lead form | (in-hero or `cta` with `showForm: true`) | 3 visible fields + hidden tracking fields (see §6) |
| 3 | Trust bar | `trustBar` | 6 metrics, see §5.2 |
| 4 | How It Works | `stepsProcess` | 4 steps, see §5.3. `cta.buttonUrl: 'tel:+12537500211'` |
| 5 | TMCP upsell | `cta` | Below fold, `background: 'gradient'`, outline secondary button, see §5.4 |

**No** Pain Points, FAQ, Service Area, GeoDefinition, TeamCards, Testimonial blocks on LPs — they belong on city/service pages, not paid LPs (would add scroll, dilute conversion focus).

### 3.2 Where the code lives

```
site/src/
├── app/(frontend)/lp/
│   ├── layout.tsx              ← noindex,nofollow meta + minimal nav wrapper
│   ├── [city]/page.tsx         ← single dynamic route, reads from city map
│   └── (later: explicit per-city files if needed for tracking nuance)
├── lib/
│   ├── pages-data.ts           ← exports lpCityBlocks(city), lpCityMeta(city)
│   └── lp-cities.ts            ← NEW: { slug, displayName, neighborhoods, soilNote } per city
└── scripts/seed.ts             ← adds 5 LP entries to allPages array
```

The 5 LPs **must** be seeded to the CMS Pages collection so the same render pattern applies (CMS wins, code is fallback). Friendly-name map entries: `seattle-lp`, `tacoma-lp`, etc.

### 3.3 The 13-step Page Build Checklist (from PAGE-BUILD-REFERENCE.md §"Checklist: Adding a New Page")

Run for **every** LP. Don't skip.

- [ ] **1. Block data** — `lpCityBlocks(city)` + `lpCityMeta(city)` in `pages-data.ts`
- [ ] **2. Images** — Hero image WebP in `public/images/` (`hero-lp-{city}.webp`). `fallbackImage` field set on every hero/imageText block.
- [ ] **3. Page route** — `src/app/(frontend)/lp/[city]/page.tsx` using `getCmsPageContent(slug)` + fallback pattern
- [ ] **4. Schema** — `JsonLd` with `cityLocalBusinessSchema(city)` from `src/lib/schema.tsx` + `breadcrumbSchema`. Canonical phone `+12537500211`, never tracking numbers.
- [ ] **5. Build** — `npx next build` passes clean
- [ ] **6. Seed entry** — Add to `allPages` in `seed.ts`. Strip `image` from imageText blocks, keep `fallbackImage`.
- [ ] **7. Seed** — `npm run seed -- --reseed seattle-lp` **before push** (per `feedback_reseed_before_push_not_after`)
- [ ] **8. Friendly name** — Map `seattle-lp` → CMS slug
- [ ] **9. Cross-links** — None inbound from main site nav. LP-only pages.
- [ ] **10. Humanizer** — Run deep pass on final copy. Target 8.0+. Per `feedback_humanizer_mandatory`.
- [ ] **11. Commit** — `git add` specific files only, descriptive message
- [ ] **12. Push** — `git push mine main`
- [ ] **13. Verify** — `project-pf8c6.vercel.app/lp/seattle/` (never localhost per `feedback_match_live_pages_not_specs`). Run §12 testing checklist.

---

## 4. DO / DO NOT

### 4.1 DO

| # | Element | Location | Purpose |
|---|---|---|---|
| 1 | H1 with city + price | Hero, above fold | Matches ad intent + city relevance |
| 2 | Phone (`tel:` link, large, thumb-sized ≥44×44px) | Hero, prominent | Highest-intent action |
| 3 | Price badge ($150 / $450 / $100/mo) | Hero, below H1 | Filters unqualified, attracts buyers |
| 4 | Action-oriented CTA button | Hero, below price | "SCHEDULE INSPECTION — $150", never "Submit" |
| 5 | 3-field form | Hero or below | Captures moderate-intent leads |
| 6 | Trust bar | Below hero | Social proof |
| 7 | How It Works (4 steps) | Below trust bar | Sets expectations |
| 8 | TMCP section | Below fold | Upsell to recurring |
| 9 | Hidden form fields (7) | Inside form | Attribution tracking — see §6 |
| 10 | CallRail DNI swap.js | Page-level | Session-level call tracking |
| 11 | GTM dataLayer push on `page_view` | Page-level | Tracking trigger — see §7 |

### 4.2 DO NOT — Content (banned words)

Combined banned list (paid-search spec + Posture A from `feedback_got_moles_posture_a_silent_mechanism`):

| Banned | Reason |
|---|---|
| "Same-day service" | We don't offer it |
| "Free inspection" / "Free quote" | We don't offer it; $150 setup is upfront |
| "Exterminator" | Google animal policy risk |
| "Kill" / "Lethal" / "Eliminate" / "Eradication" | Google animal policy + Posture A |
| "Poison" / "Chemicals" (as positive claim, OK as "chemical-free") | Policy + not our method |
| "Body-gripping" / "Scissor" / "Harpoon" / "Spear" / "Spike" | **Posture A — silent on trap mechanism** |
| "I-713" / "Initiative 713" / "Wildlife regulations" | Don't invite regulatory framing on a conversion page |
| "Guaranteed results" / "Guaranteed eradication" | Legally risky |
| "WA's #1" / "Best in WA" | Unsubstantiated (per client CLAUDE.md) |
| "Cheapest" / "Cheap" / "Discount" / "Coupon" | Devalues brand, attracts price shoppers |

**"15+ years"** is permitted ONLY when attributed to **Spencer**, never the company (founded 2017). Example: ✅ "Spencer's 15+ Years in Mole Control" — ❌ "15+ Years on Washington Mole Control" (implies company tenure).

### 4.3 DO NOT — Navigation

| Element | Why |
|---|---|
| Full site header/nav | Distraction from conversion |
| Links to blog / about / services / city pages | Takes user away |
| Social media links | Takes user away |
| Footer with all site links | Distraction — use minimal LP footer (Privacy Policy link + canonical phone only) |
| Any external links | Leak traffic; `nofollow` if unavoidable |

### 4.4 DO NOT — Form

| Element | Why |
|---|---|
| More than 3 visible fields | Abandonment ~+50% per extra field |
| Zip field, service dropdown, message/notes | Friction, not needed |
| "Submit" button text | Weak — use action-oriented copy |

### 4.5 DO NOT — Technical

| Element | Why |
|---|---|
| `index` in search engines | `noindex,nofollow` — conversion-only |
| Pop-ups / chat widgets / auto-play video | Hurts conversion + mobile speed |
| Hardcoded CallRail tracking numbers in HTML or schema | Breaks NAP + schema integrity |

---

## 5. Content per section

### 5.1 Hero

```
H1:       "Mole Removal in [City] — $150 to Start"
Subtext:  "$150 Setup · $450 Total If We Catch · $100/Month Year-Round"
Subtext2: "4-5 week program. Pay $150 upfront. Balance only if moles caught."

CTA Phone:  "Call (253) 750-0211"
  - <a href="tel:+12537500211">
  - Thumb-sized tap target on mobile (min 44×44px)
  - CallRail DNI swaps dynamically — never hardcode tracking numbers

CTA Form:   "SCHEDULE INSPECTION — $150"
  - Action-oriented (not "Submit")
  - Price in button reinforces low entry cost
```

**Unique-paragraph requirement:** Each city's hero subtext2 (or first paragraph below hero) must include a city-specific anchor — a neighbourhood, a soil-type note, or a service-pattern reference — so the 5 LPs don't trigger duplicate-content concerns. Keep it one sentence. Examples:

- Seattle: "From Ballard to Beacon Hill — same 4-5 week program, same flat pricing."
- Tacoma: "Pierce County yards — North End, Proctor, University Place — same flat pricing."
- Kent: "South King County — Kent, Covington, Maple Valley — moles in clay-heavy soil are our specialty."
- Bellevue: "Bellevue, Medina, Clyde Hill — discreet trapping, clean restoration, no chemicals."
- Kirkland: "Kirkland, Juanita, Finn Hill — proven 4-5 week program. $150 starts, $450 max."

Roy/Spencer can refine. The point is: zero token-substitution clones.

### 5.2 Trust bar (6 elements, wrap on mobile)

```
⭐ 219+ Reviews
· Nearly 5,000 Yards Served
· 92+ WA Communities
· Since 2017
· Veteran-Owned
· Safe for Pets & Kids
```

Numbers locked to canonical facts (`reference_got_moles_canonical_facts`). "600+ homes protected" claim from the original spec is held back until Spencer confirms — replaced with "92+ WA Communities" which is confirmed.

### 5.3 How It Works (4 steps — `stepsProcess` block)

```
Headline: "How It Works"

Step 1
  Title: "Call or Fill Out the Form"
  Desc:  "Spencer calls you back same day."

Step 2
  Title: "Schedule Inspection"
  Desc:  "We inspect within 2 business days."

Step 3
  Title: "Pay $150 Setup"
  Desc:  "We begin the 4-5 week program."

Step 4
  Title: "Pay Balance Only If We Catch"
  Desc:  "$300 balance after 4-5 weeks — only if moles caught. Total $450 max."
```

### 5.4 TMCP section (below fold — `cta` block, gradient bg, outline button)

```
Headline: "Never Worry About Moles Again"

Body:
  "Our Total Mole Control Program is $100/month with a 12-month contract.
   Unlimited visits. No other charges. Hundreds of yards already on
   year-round protection."

CTA: "Call About Year-Round Protection"
  - Secondary button style (outline, not filled)
  - href: tel:+12537500211
```

Note: dropped the unverified "600+ homes" claim in favour of "hundreds of yards" until Spencer confirms.

---

## 6. Form spec

### 6.1 Visible fields (3, max)

| Field | Type | Required | Validation |
|---|---|---|---|
| Name | text | Yes | Max 200 chars |
| Phone | tel | Yes | Max 30 chars |
| Email | email | Yes | Max 200 chars |

### 6.2 Hidden fields (7)

| Field | Source | Required |
|---|---|---|
| `utm_source` | URL `?utm_source=` | No |
| `utm_medium` | URL `?utm_medium=` | No |
| `utm_campaign` | URL `?utm_campaign=` | No |
| `utm_term` | URL `?utm_term=` | No |
| `gclid` | URL `?gclid=` OR `_gcl_aw` cookie | No |
| `landing_city` | Static: `[city]` | Yes |
| `callrail_tracking_number` | JS: read swapped `tel:` link textContent | No |

### 6.3 Form behaviour

| Requirement | Value |
|---|---|
| Endpoint | Existing `/api/contact` handler (extended to accept the 7 hidden fields — do NOT create a new endpoint) |
| Method | POST |
| Success | Inline confirmation (do NOT redirect — preserves attribution context) |
| Error | Inline error, preserve form data |
| Button state | Disabled + loading state during submit |
| Forward to | Jobber `clientCreate` (already wired, commit `03c3d2e`) with hidden fields in custom fields / notes |

### 6.4 UTM + GCLID JS

Runs on `DOMContentLoaded`:

1. Read URL params → populate matching hidden fields
2. Read `_gcl_aw` cookie → populate `gclid` if URL param absent
3. After CallRail swap fires → read `a[href^="tel:"]` textContent → strip non-digits → populate `callrail_tracking_number`

### 6.5 Jobber custom fields

| Field | Maps to |
|---|---|
| UTM_Source / Medium / Campaign / Term | Jobber custom fields |
| GCLID | Jobber "GCLID" custom field (persists for OCI server-to-server upload later) |
| CallRail Tracking Number | Jobber "Tracking Number" custom field |
| Landing City | Jobber "Lead Source City" custom field |

---

## 7. Tracking stack (14 layers, brief §"Tracking stack")

Layer-by-layer. Each line is either **v1 (ship with LPs)** or **v2 (after GTM install completes — currently steps 4–7 of 7 open per `project_got_moles_gtm_install`)**.

| # | Layer | v1 | v2 | Notes |
|---|---|---|---|---|
| 1 | GTM container sitewide | ✅ | — | Already loaded |
| 2 | Google Ads Conversion Linker (`_gcl_aw`) | ✅ | — | Already in GTM (per project_got_moles_gtm_install steps 1-3 done) |
| 3 | Google Ads site-wide event tag (remarketing) | ✅ | — | Already in GTM |
| 4 | Google Ads Conversion: Lead Form Submit | ✅ | — | `generate_lead` already imported into Google Ads as Primary (per memory) |
| 5 | Google Ads Conversion: Phone Call from Website | ⚠ v2 | ✅ | Needs `phone_click` GTM trigger + Google Ads tag |
| 6 | Google Ads Conversion: Booked Job (OCI) | — | ✅ | Server-to-server from Jobber webhook; needs OCI uploader |
| 7 | Enhanced Conversions for Leads (hashed PII) | ⚠ v2 | ✅ | Needs User-Provided Data variable in GTM (ECL step 4 of project_got_moles_gtm_install) |
| 8 | GA4 config + `generate_lead` event | ✅ | — | Mirrors to Google Ads via GA4 import (source of truth — skip duplicate GTM Google Ads Conversion Tag) |
| 9 | GA4 `phone_click` event | ⚠ v2 | ✅ | Tied to GTM phone-click trigger |
| 10 | Meta Pixel base + `Lead` event | — | ✅ | Needs Pixel ID from Roy/Spencer |
| 11 | Meta CAPI mirror with `event_id` dedup | — | ✅ | Cloudflare Worker or n8n |
| 12 | CallRail swap.js + form-submission API | ✅ | — | Already wired (commit `03c3d2e`) |
| 13 | Microsoft Clarity | ✅ | — | Live, project `wndo291wli` (per reference_got_moles_clarity) |
| 14 | Bing UET | — | ✅ | Needs UET Tag ID (step 6 of GTM install) |

### 7.1 dataLayer contract

All tags key off these events — no hardcoded page logic:

```js
// On load
dataLayer.push({ event: 'page_view', page_type: 'lp', lp_slug: '[city]' })

// On form success
dataLayer.push({
  event: 'lead_submit',
  form_location: 'hero' | 'midpage' | 'final',
  lp_slug: '[city]',
  user_data: { email_hash: <sha256>, phone_hash: <sha256> },
  event_id: <uuid>  // shared with Pixel + CAPI for dedup
})

// On phone tap
dataLayer.push({ event: 'phone_click', click_location: 'hero' | 'sticky' | 'final' })
```

### 7.2 GCLID capture flow

`?gclid=` URL param OR `_gcl_aw` cookie → hidden form field → POSTed to `/api/contact` → forwarded to Jobber `clientCreate` GCLID custom field → persists on Jobber client record → OCI uploader (v2) reads it when job booked → sends "Booked Job" conversion to Google Ads.

### 7.3 Consent Mode v2 + cookie banner

- Cookie banner: Accept / Decline. Does **not** gate page content.
- Google Consent Mode v2 defaults:
  - `ad_storage: 'denied'`
  - `analytics_storage: 'denied'`
  - `ad_user_data: 'denied'`
  - `ad_personalization: 'denied'`
- Update on Accept. Modeled conversions handle declined traffic.

### 7.4 Privacy + compliance

- Privacy Policy link in LP minimal footer (Google Ads + Meta Ads policy requirement)
- No deceptive practices: H1 must match ad headline intent (ad headlines listed in §13 below)

---

## 8. CallRail DNI rules

### DO

| Rule | Implementation |
|---|---|
| CallRail swap.js loads on `/lp/*` | Already wired in site layout — verify it's not blocked by `lp/layout.tsx` |
| Canonical number in static HTML | `(253) 750-0211` — for crawlers + schema |
| Schema uses canonical only | `cityLocalBusinessSchema(city)` — never swapped numbers |
| Pool size | 4 currently (per `reference_callrail_got_moles_config`). Bump to **8** before launch given new LP traffic + 5 cities — adds source attribution headroom. |
| Test swap on mobile after hard refresh | Required before sign-off |

### DO NOT

- Hardcode tracking numbers in HTML
- Let CallRail swap into schema JSON
- Assume swap works without device test

---

## 9. SEO + technical requirements

### 9.1 Meta tags (every LP)

| Tag | Value |
|---|---|
| `robots` | `noindex,nofollow` (matches brief — stricter than original 5-cities spec) |
| `title` | `Mole Removal in [City] — $150 to Start \| Got Moles` |
| `description` | `Mole removal in [City] starting at $150. $450 max if we catch. $100/month year-round. Spencer's 15+ years experience. Nearly 5,000 yards served.` |
| `canonical` | Self-referencing: `https://got-moles.com/lp/[city]/` |

### 9.2 Cross-LP infra (one-time, Phase 1)

- `noindex,nofollow` meta in `lp/layout.tsx` (applies to all `/lp/*`)
- `Disallow: /lp/` added to `robots.txt`
- `/lp/*` excluded from `sitemap.xml`
- 301 from any legacy `/lp/mole-trapper/` → `/lp/seattle/` (or homepage — Roy decides) in `redirects.ts`

### 9.3 Schema (JSON-LD)

Use existing `src/lib/schema.tsx` builders — never hand-roll:

- `cityLocalBusinessSchema(city)` — with `[city]` in `areaServed`, canonical phone `+12537500211`, same address as main site
- `breadcrumbSchema([{ name: 'Mole Removal [City]', url: '/lp/[city]/' }])`

Pages collection `schemaType: 'Service'` (closest valid match — `LocalBusiness` not in allowed list per PAGE-BUILD-REFERENCE §schemaType).

### 9.4 Performance

| Metric | Target | Acceptance |
|---|---|---|
| LCP | <2.5s | ✅ |
| INP | <200ms | ✅ |
| CLS | <0.1 | ✅ |
| Lighthouse Performance (mobile) | >80 | ✅ |
| FCP | <1.5s | ✅ |

---

## 10. Mobile-first rules

| Element | Requirement |
|---|---|
| Phone tap target | Thumb-sized, min 44×44px |
| Form fields | 16px+ font (prevents iOS zoom on focus) |
| CTA button | Full-width on mobile |
| Body text | Min 16px, headings 20px+ |
| Layout | Single column, no horizontal scroll |
| Sticky CTA bar | Optional but recommended — sticky bottom on scroll, `phone_click` location: `sticky` |

---

## 11. Acceptance criteria

Per LP, before Roy + Spencer sign-off:

### Build + content
- [ ] Page live on staging at `/lp/{city}/`, returns 200
- [ ] H1 contains city + price
- [ ] Price badge shows all 3 options ($150 / $450 / $100/mo)
- [ ] Trust bar has 6 elements
- [ ] How It Works has 4 steps
- [ ] TMCP section below fold
- [ ] Unique first paragraph per city (no `[city]` token-substitution clones)
- [ ] Posture A audit clean: zero `body-gripping`, `scissor`, `harpoon`, `kill`, `lethal`, `poison`, `eliminate`, `eradication`, `I-713`, `WA's #1`, `cheapest`, `discount`, `free inspection`, `same-day`, `exterminator`
- [ ] "15+ years" is attributed to Spencer, never the company
- [ ] Humanizer deep pass score ≥ 8.0

### SEO + infra
- [ ] `noindex,nofollow` verified in source
- [ ] Excluded from `sitemap.xml`
- [ ] Disallowed in `robots.txt`
- [ ] `cityLocalBusinessSchema` rendered with canonical `+12537500211`
- [ ] `breadcrumbSchema` rendered

### Tracking — v1 layers
- [ ] GTM container loads — verified via GTM Preview Mode
- [ ] `page_view` dataLayer event fires with `page_type: 'lp'` + `lp_slug`
- [ ] `lead_submit` dataLayer event fires on form success with `form_location`, `lp_slug`, hashed `user_data`, `event_id`
- [ ] Google Ads Conversion Linker sets `_gcl_aw` cookie on landing
- [ ] Google Ads "Lead Form Submit" conversion fires (Conversion Tracking diagnostic)
- [ ] GA4 DebugView confirms `page_view` + `generate_lead`
- [ ] Microsoft Clarity records the session (project `wndo291wli`)
- [ ] CallRail swap.js fires before user interaction (number swaps on first paint)
- [ ] Form POSTs to Jobber `clientCreate` with GCLID + UTMs + landing_city + tracking_number persisted to Jobber custom fields (test with `?gclid=TEST123&utm_source=test`)
- [ ] Phone tap-to-call dials CallRail-swapped number
- [ ] CallRail call attribution shows source/campaign when a test call is placed from the ad URL

### Tracking — v2 layers (must be live before scaling spend)
- [ ] `phone_click` dataLayer event fires (Google Ads + GA4)
- [ ] Enhanced Conversions for Leads — hashed email/phone visible in Google Ads Diagnose Conversions
- [ ] Meta Pixel `PageView` + `Lead` fire (Events Manager Test Events)
- [ ] Meta CAPI mirror lands with matching `event_id` — Events Manager shows "Browser + Server" dedup
- [ ] Bing UET fires
- [ ] OCI uploader sends "Booked Job" conversion to Google Ads when Jobber marks job booked

### Compliance
- [ ] Cookie banner appears + Consent Mode v2 defaults applied (`ad_storage`, `analytics_storage` denied by default)
- [ ] Privacy Policy link in LP footer
- [ ] H1 matches Google Ads headline intent (no bait-and-switch)

### Cross-page
- [ ] All 5 LPs have unique H1, subhead, and first paragraph
- [ ] Spencer + Roy approval per LP on staging

---

## 12. Testing checklist (run on `/lp/seattle/` first, then replicate)

### Content
| # | Check | Pass |
|---|---|---|
| 1 | No "same-day", "free", "exterminator", "kill", "poison", "eliminate" in page source | grep returns 0 |
| 2 | No Posture A banned words (`body-gripping`, `scissor`, etc.) | grep returns 0 |
| 3 | H1 contains city name | Visible in hero |
| 4 | Price badge shows 3 options | Visible |
| 5 | Trust bar 6 elements | Visible |
| 6 | 4 How-It-Works steps | Visible |
| 7 | TMCP section present | Scroll to verify |
| 8 | "15+ years" attributed to Spencer | Text check |

### Technical
| # | Check | How | Pass |
|---|---|---|---|
| 9 | `noindex,nofollow` meta | View source | `<meta name="robots" content="noindex,nofollow">` |
| 10 | Canonical phone in schema | View source | `+12537500211` in schema JSON, no tracking number |
| 11 | CallRail swap on mobile | Real iPhone or DevTools mobile emulator | Phone NOT `750-0211` after swap |
| 12 | UTM hidden fields populate | Visit `?utm_source=test&utm_term=mole&gclid=TEST123` | Hidden fields show values |
| 13 | Form submits successfully | Fill + submit | Inline confirmation appears |
| 14 | Jobber lead has UTM + GCLID + tracking number + landing_city | Check Jobber client record | All custom fields populated |
| 15 | PageSpeed Insights mobile | Run PSI | Score >80 |
| 16 | Mobile layout | Chrome DevTools iPhone | Single column, tappable CTAs, sticky CTA bar works |

### CallRail
| # | Check | How | Pass |
|---|---|---|---|
| 17 | swap.js loads | Network tab | 200 status |
| 18 | Number swaps on mobile | Real iPhone | Tracking number visible |
| 19 | Call attribution | Test call from ad URL | CallRail shows source/campaign |

### Tracking
| # | Check | How | Pass |
|---|---|---|---|
| 20 | GTM Preview Mode tags fire | GTM Preview | Lead Form, Conversion Linker, GA4 all green |
| 21 | GA4 DebugView | DebugView | `page_view`, `generate_lead` events |
| 22 | Google Ads conversion | Diagnose Conversions | "Recording conversions" |
| 23 | Clarity session | Clarity dashboard `wndo291wli` | Session recorded with page actions |

---

## 13. Build order (sequential, not parallel)

1. **Phase 1A — Reference build:** `/lp/seattle/` end-to-end + Phase 1 cross-LP infra (lp/layout.tsx noindex, robots.txt, sitemap exclusion, redirects.ts). v1 tracking layers fully wired. Run §12 in full.
2. **Phase 1B — Tier 2 replicate:** Build `/lp/tacoma/`, `/lp/kent/`, `/lp/bellevue/`, `/lp/kirkland/` from the Seattle pattern. Each gets §11 acceptance pass.
3. **Phase 1C — Posture A + Humanizer sweep:** Audit all 5 LPs for banned words + canonical-fact accuracy. Humanizer deep pass on every block of copy.
4. **Phase 1D — v1 launch:** Update Google Ads to point to `/lp/[city]/` URLs. Add "moles in yard [city]" + "[city] near me" keywords to T1. Monitor CallRail + Jobber for attribution for 2 weeks.
5. **Phase 2 — v2 tracking:** Complete GTM install steps 4-7 (ECL, Meta Pixel, Bing UET, CSP). Add `phone_click` triggers. Wire OCI uploader. Re-run §11 v2 acceptance.
6. **Phase 3 — Expansion:** Per §14 criteria.

---

## 14. Phase 2 expansion criteria

After 2 weeks of $150/day T1 budget, decide based on **actual LP conversion data** (not planner):

| Signal | Action |
|---|---|
| Seattle LP CVR >5% | Build Renton, Issaquah (nearby suburbs) |
| Tacoma LP converting | Build Puyallup, Auburn, Federal Way (south corridor) |
| Bellevue/Kirkland LP working | Build Redmond, Sammamish (Eastside expansion) |
| None converting well | Fix LP copy/targeting before adding cities |

### Candidate Phase 2 cities

| City | Peak / mo | Why |
|---|---|---|
| Renton | 18 | Medium competition, near Seattle/Kent |
| Issaquah | 18 | Medium competition, Eastside |
| Puyallup | 16 | Medium competition, south of Tacoma |
| Auburn | 23 | High competition, near Kent |
| Federal Way | 20 | High competition, between Kent + Tacoma |
| Lynnwood | 11 | Medium competition, north corridor |
| Everett | 20 | High competition, north anchor — re-evaluate after Tacoma data |

### Deferred from prior brief (revisit after Phase 1 data)

| Original LP | Status |
|---|---|
| `/lp/mole-removal/` (service, was reference) | **Deferred** — geo-first per data. Revisit if non-city ad groups need a generic landing target. |
| `/lp/year-round-mole-protection/` | Deferred — TMCP currently upsold inline on city LPs. Revisit if standalone year-round ad group performs. |
| `/lp/commercial-mole-control/` | Deferred — keep `/services/commercial-mole-control/` as the existing organic page. Revisit if a commercial paid stream launches. |
| `/lp/mole-removal-quote/` | Deferred — superseded by city-page form. |
| `/lp/emergency-mole-removal/` | Deferred — emergency framing not aligned with 4-5 week program reality. Likely drop entirely. |

---

## 15. Open inputs / dependencies

Blockers per phase:

| # | Input | Owner | Gates |
|---|---|---|---|
| 1 | GBP confirmation for Tacoma (second location) | Spencer | Phase 1B `/lp/tacoma/` schema |
| 2 | GTM container fully installed (steps 4-7 of `project_got_moles_gtm_install`) | Roy | Phase 2 v2 tracking |
| 3 | Meta Pixel ID | Roy/Spencer | Phase 2 Meta Pixel + CAPI |
| 4 | Bing UET Tag ID | Roy/Spencer | Phase 2 Bing UET |
| 5 | Hero image direction (AI-gen / stock / photographed) | Roy + Moni | Phase 1A — placeholder OK until decided |
| 6 | OCI uploader (Jobber webhook → Google Ads) | Roy | Phase 2 "Booked Job" conversion |
| 7 | "Hundreds of yards" → exact TMCP customer count | Spencer | Final TMCP copy (using "hundreds" as placeholder) |
| 8 | Legacy `/lp/mole-trapper/` redirect target | Roy | Phase 1A `redirects.ts` |

---

## 16. Constraints / non-negotiables

- **Ask-first on every code change** — launch-track, no unauthorised builds, edits, commits, pushes (per `feedback_no_unauthorized_build_actions`)
- **CMS-first build pattern** with `pages-data.ts` fallback — per PAGE-BUILD-REFERENCE.md
- **Reseed BEFORE push** — per `feedback_reseed_before_push_not_after`. Pushing before reseed bakes stale Supabase into Vercel's prerender.
- **Staging only**, never localhost — `project-pf8c6.vercel.app/{path}` — per `feedback_match_live_pages_not_specs`
- **US English** throughout (per client CLAUDE.md)
- **Posture A** — silent on trap mechanism on every LP
- **Humanizer deep pass mandatory** before commit, target 8.0+
- **`/lp/*` is paid-traffic-only** — never compete with city/service pages organically; noindex enforced
- **Run BUILD-METHODOLOGY.md + PAGE-BUILD-REFERENCE.md at the start of any page-edit session** — per `feedback_reseed_before_push_not_after`

---

## 17. Ad headlines reference (for ad↔page message-match)

These are the Google Ads RSA headlines that will drive traffic to `/lp/[city]/`. The LP H1 must align with headline 1 (top performer).

| # | Headline |
|---|---|
| 1 | Mole Removal [City] — $150 to Start |
| 2 | $450 Max or $100/Month — No Hidden Fees |
| 3 | Call (253) 750-0211 — Speak with Spencer |
| 4 | Tunnels in Your Yard? We Can Help |
| 5 | Speak with Spencer — Owner & Specialist |
| 6 | 219+ Reviews · Nearly 5,000 Yards |
| 7 | Chemical-Free · Safe for Pets & Kids |
| 8 | Year-Round Protection — Unlimited Visits |
| 9 | Mole Damage? $150 Starts — $450 Max |
| 10 | Veteran-Owned · Local WA Team |
| 11 | Get Rid of Moles — Proven 4-5 Week Program |
| 12 | Hundreds of Homes on Year-Round Protection |
| 13 | Spencer's 15+ Years in Mole Control |
| 14 | No Poisons · No Chemicals · Just Results |
| 15 | Mole Control [City] · Call Now |

**Default URL:** `/lp/[city]/`
**Display path:** `/Mole-Removal/[City]`

Changed from original 5-cities spec:
- Headline 6 updated to use canonical "Nearly 5,000 Yards" + add review count
- Headline 12 changed from "600+ Homes" to "Hundreds of Homes" pending Spencer's number
- Headline 13 changed from "15+ Years on Washington Mole Control" → "Spencer's 15+ Years in Mole Control" (attribution rule)

---

## Appendix A: Pricing (locked)

| Service | Upfront | Balance | When charged | Total |
|---|---|---|---|---|
| One-Time Removal | $150 setup | $300 | After 4-5 week program, if moles caught | $450 max |
| If no moles caught | $150 | $0 | — | $150 |
| Total Mole Control Program (TMCP) | $100/month | — | Monthly, 12-month contract | $1,200/year |
| TMCP includes | Unlimited visits, no other charges | | | |

---

## Appendix B: Canonical facts (locked — `reference_got_moles_canonical_facts`)

- 92+ communities served across 6 WA counties (NOT 70+ / 4)
- Nearly 5,000 properties served
- Founded 2017
- Spencer Hill — US Army veteran, 2011–2014
- TMCP: $100/month
- OMP: $150 setup + $300 balance = $450 max
- 219+ five-star Google reviews (across 3 GBP locations)
- Phone: (253) 750-0211 → `+12537500211`

---

## Output location

This spec lives at `clients/got-moles/projects/briefs/paid-search-landing-pages/2026-05-15_lp-build-spec-merged.md`. The `brief.md` in the same folder needs a `supersedes` note pointing here.

Code lives in `clients/got-moles/projects/briefs/website-rebuild-rebrand/site/`. Build session runs from the got-moles client window: `cd clients/got-moles && claude`.
