# Measurement & Tracking Implementation Guide
## Derived from ATP proving-ground execution, 2026-04-23

This is the step-by-step playbook for installing the full measurement layer on `got-moles.com`, based on the complete end-to-end install executed on `allthepower.co.uk` during a single day on 2026-04-23. Every pattern here has a working reference implementation in the ATP codebase.

Where Got Moles differs from ATP (US vs UK, local-service vs digital, 3 GBP locations vs 1), adaptations are called out inline.

---

## Part 1 — Pre-work decisions (lock BEFORE touching any platform)

### 1.1 Account ownership hygiene

The single biggest risk to the entire measurement layer is **identity fragmentation** — business properties scattered across personal Gmails, work emails, and IT-controlled accounts. Lock ownership upfront or pay for it later.

**Rule:** every business property is owned by a canonical identity that survives staff changes, agency changes, and IT-provider changes.

For Got Moles, the canonical identity should be:
- **Primary Google identity:** a Workspace or Gmail account owned by the business (not an agency's, not a staff member's personal Gmail). Recommend a dedicated `admin@got-moles.com` or similar.
- **Primary Microsoft identity:** use Google OAuth sign-in on Microsoft properties (Bing Webmaster, Microsoft Advertising, Clarity) — launched Feb 2026, removes need for separate Microsoft account. Sign in with the canonical Google identity.
- **Primary Apple ID:** a personal Apple ID owned by Spencer (not tied to the business's managed iCloud if one exists).

**ATP observation:** GBP ended up owned by `freeflyroy@` (personal Gmail), while Bing Webmaster + Microsoft Advertising + Clarity landed on `atpbos` (interim Workspace) — creating fragmentation that required a later ownership transfer task. Got Moles should avoid this by establishing the canonical Google identity first.

### 1.2 Canonical NAP lock

Lock these values before touching any directory. Every surface must match exactly.

| Field | Got Moles example | Rule |
|---|---|---|
| Legal name | `Got Moles? LLC` (whatever's on state registration) | Exact — including "LLC" / "Inc" / punctuation |
| Short name | `Got Moles` | Acceptable short form, no punctuation |
| Principal | Spencer (full legal name) | Consistent spelling, no middle-name variants |
| Website | `https://got-moles.com/` | https, no www, trailing slash |
| Phone (public business) | TBC — owned, stable line | Never a cell tied to a staff member. Prefer a business line that can outlast any one person. |
| Email (public) | e.g. `info@got-moles.com` | Operations email, not a personal one |
| Registered address | From WA Secretary of State | Exact state-filed address |
| EIN | TBC | US equivalent of UK Companies House number |
| D-U-N-S | Discoverable via Dun & Bradstreet (or via Apple Business Manager if claimed) | Major AI-engine trust signal. Free to obtain. |

**ATP observation:** Having one number owned outright (a UK SIM Roy already had) gave stable-forever ownership. VoIP providers (CircleLoop, OpenPhone, Google Voice) churn; SIM ownership survives any carrier switch via number portability rules. For Got Moles — if there's already a business line, keep it. If not, a carrier-owned business line is more stable than a VoIP provider.

### 1.3 Canonical social URLs

Lock the complete list before pushing to any schema or directory:

- GBP 3× (Seattle, Tacoma, Enumclaw — per memory)
- Bing Places 3×
- Facebook Page URL
- Instagram handle
- TikTok handle (if any)
- YouTube channel (when active)
- LinkedIn Company Page
- Yelp URL 3× (per location)
- Angi URL
- Nextdoor (per neighborhood)
- BBB profile
- HomeAdvisor / Thumbtack / TaskRabbit (if active)

Store these as a single JSON constant in the Got Moles site codebase — single source of truth for every schema + directory reference.

---

## Part 2 — Search consoles + Webmaster tier 1

Do these first. They're free, they cover organic discovery, and they unlock data imports for everything downstream.

### 2.1 Google Search Console

1. Sign in at https://search.google.com/search-console with the canonical Google identity
2. Add property → `got-moles.com` (domain property preferred over URL property)
3. Verify via DNS TXT record — durable, survives server moves
4. Submit sitemap: `https://got-moles.com/sitemap.xml`
5. Request indexing on top 10 URLs: homepage, 3 services (TMCP / One-Time / Commercial), service-areas hub, 5 city pages

### 2.2 Bing Webmaster Tools

1. Go to https://www.bing.com/webmasters
2. **Sign in with the same Google identity** (Bing supports Google OAuth since Feb 2018)
3. Add site → `got-moles.com`
4. **Click "Import from Google Search Console"** — one-click, federated auth pulls property in without DNS reconfiguration
5. Submit sitemap: `https://got-moles.com/sitemap.xml`
6. Request indexing on top 10 URLs

**ATP observation:** GSC import took < 30 seconds. Data populates within 48 hours.

### 2.3 Apple Business Connect

Covers Apple Maps / Siri / Spotlight. Feeds into Perplexity's citation layer.

1. Go to https://businessconnect.apple.com (NOT business.apple.com — that's Apple Business Manager, device management, different product)
2. Sign in with a personal Apple ID (Spencer's)
3. **Per location** (Got Moles = 3 locations): add each separately
4. Fill each with canonical NAP
5. Choose category: "Professional Services" → "Pest Control Services"
6. Submit for verification (Apple reviews over 5 business days)

Got Moles-specific: add 3 separate locations with location-specific hours.

### 2.4 Google Business Profile audit

GBP likely already exists. Audit each of the 3 locations:

**Per location:**
- Name exactly matches canonical
- Phone matches canonical (this was a catch on ATP — GBP had an old number)
- Address matches canonical (full form, not abbreviated)
- Website URL: `https://got-moles.com/` (or location-specific subpage)
- Category: "Pest Control Service"
- Hours, photos, services, attributes all current
- 219+ five-star reviews preserved (per memory)

**ATP observation:** GBP had stale phone number (07747 840823) and abbreviated address format. AI citation trust requires byte-for-byte NAP consistency across sources — these drift issues cost citations. Audit every field.

---

## Part 3 — Analytics foundation

### 3.1 GA4

1. Create GA4 property for `got-moles.com` under the canonical Google identity
2. Install via `<GoogleTag />` component (see ATP codebase `src/components/GoogleTag.tsx`)
3. Env var: property ID hardcoded in component OR via env var (ATP has hardcoded `G-ZBFDV6CDFE`)
4. Consent Mode v2 default = `denied`, flip to `granted` on cookie accept

### 3.2 Cookie consent banner

Copy from ATP's `src/components/CookieConsent.tsx`:
- Sets `cookie_consent=granted|denied` cookie (365 day max-age, SameSite=Lax)
- Calls `window.gtag('consent', 'update', {...})` for Google
- Calls `window.fbq('consent', 'grant'|'revoke')` for Meta

### 3.3 4-action conversion taxonomy

Got Moles version (different to ATP):

| # | Action | Type | Mechanism | Event name |
|---|---|---|---|---|
| 1 | Phone click ≥60s | **Primary** | Google Forwarding Number (GFN) for paid, tel: click for organic | `trackPhoneCall` |
| 2 | Contact form submit | **Primary** | Form submit success handler | `contact_form_submit` |
| 3 | Quiz completion | Secondary | ScoreApp quiz integration | `quiz_complete` |
| 4 | GBP "Get Directions" | Secondary | Native GBP, cross-reference only | — |

No book-sale action (Got Moles is not selling a book).

### 3.4 Microsoft Clarity (free heatmaps + session replay)

**This is a free win with no downside.** Install day one.

1. Go to https://clarity.microsoft.com → create new project
2. Name: "Got Moles site"
3. Copy the 10-character project ID (e.g. `wg4e7jhmlx`)
4. Install via `<Clarity />` component (copy from ATP `src/components/Clarity.tsx`)
5. Env var: `NEXT_PUBLIC_CLARITY_PROJECT_ID=<project-id>`
6. Consent-aware: calls `clarity('consent', true|false)` on init

**ATP observation:** Clarity is the highest-ROI free install on the stack. Heatmaps, dead-click detection, rage-click detection, session replay. Use early + often to tune the site.

---

## Part 4 — Ad platform tag stack (code-side)

All components scaffolded as env-gated — render nothing when env var is missing. Ship code before IDs are ready.

### 4.1 Meta Pixel (browser-side)

Component: `src/components/MetaPixel.tsx`.
Env var: `NEXT_PUBLIC_META_PIXEL_ID` (15-16 digit Dataset ID).
Consent-gated via `fbq('consent', 'grant'|'revoke')` — fires only after cookie accept.

### 4.2 Meta CAPI (server-side)

Route: `src/app/api/capi/route.ts`.
Env vars: `META_CAPI_ACCESS_TOKEN` (Sensitive), `NEXT_PUBLIC_META_PIXEL_ID` (same as above), optional `META_CAPI_TEST_EVENT_CODE`.
Forwards events server-side with matching `event_id` for Pixel↔CAPI dedupe.
Fires for Lead / ViewContent / InitiateCheckout — **NOT PageView** (by design — Meta gets PageView from the browser Pixel).

### 4.3 Meta domain verification

Instead of DNS TXT, use the meta tag method in Next.js metadata:

```ts
verification: {
  google: '<google-verification-string>',
  other: {
    'facebook-domain-verification': '<facebook-verification-string>',
  },
},
```

One line of code — ship + verify from Meta Business Settings → Brand Safety → Domains.

### 4.4 Google Ads tag

Component: `src/components/GoogleAdsTag.tsx`.
Env var: `NEXT_PUBLIC_GOOGLE_ADS_ID` (format `AW-XXXXXXXXX`).
Uses the same `gtag` as GA4 (loaded once by GoogleTag component).

### 4.5 Bing UET

Component: `src/components/BingUET.tsx`.
Env var: `NEXT_PUBLIC_BING_UET_ID` (8-digit tag ID).
`enableAutoSpaTracking: true` — tracks client-side Next.js route changes automatically.

### 4.6 Unified `trackEvent()` helper

File: `src/lib/tracking.ts`.

Single function fans out to 5 channels from one call:
1. GA4 via `window.gtag`
2. Meta Pixel via `window.fbq`
3. Meta CAPI via `fetch('/api/capi', ...)` with event_id
4. Google Ads conversion via `window.gtag('event', 'conversion', { send_to: ... })`
5. Bing UET via `window.uetq.push('event', ...)`

Event ID generated client-side, passed to CAPI for dedupe.
Enhanced Conversions: hashes email/phone/firstName/lastName client-side via SHA-256 before sending to Google Ads + Meta CAPI.

**Critical gap flagged in ATP install:** `trackEvent()` is not yet wired to UI elements. CAPI, Google Ads conversions, Bing UET business events will never fire until:
- Phone click handlers call `trackEvent('trackPhoneCall')`
- Contact form success handler calls `trackEvent('contact_form_submit', {...}, {email, phone})`
- Quiz completion calls `trackEvent('quiz_complete')`

For Got Moles: wire this at the same time as the form handlers are built, not after.

---

## Part 5 — Ad platform accounts (account-side setup)

### 5.1 Meta Business Manager

1. Sign in at https://business.facebook.com/ with canonical Meta identity (personal Facebook account that owns the Business Manager — own it, don't let IT own it)
2. Events Manager → Create dataset (new name for "Pixel") → name "Got Moles site"
3. Grab the 16-digit Dataset ID → `NEXT_PUBLIC_META_PIXEL_ID`
4. Dataset Settings → Conversions API → **Generate access token** → copy immediately (shown once) → `META_CAPI_ACCESS_TOKEN` Sensitive in Vercel
5. Business Settings → Brand Safety → Domains → Add → `got-moles.com` → choose Meta tag method → Meta shows a `<meta name="facebook-domain-verification">` string → add to layout.tsx verification metadata → redeploy → Meta Business Settings → hit Verify

### 5.2 Google Ads

**Got Moles-specific complication:** previous agency owned the account. Per memory, "unreachable — cold-start 4-6 weeks." Attempt handoff before committing to cold-start.

Handoff attempt:
- Spencer chases previous agency for ownership transfer of the existing Google Ads account (2+ years of Quality Scores, negative keyword history — valuable)
- 7-day deadline post-DNS to resolve handoff before writing off

If handoff fails (cold-start path):
1. Create new Google Ads account under canonical Google identity (same one that owns GA4)
2. Account → Customer ID `XXX-XXX-XXXX` → `AW-XXXXXXXXX` env var for `NEXT_PUBLIC_GOOGLE_ADS_ID`
3. Tools → Data Manager → Google tag → Manage → Configure your domains → add `got-moles.com`
4. Goals → Summary → + Create conversion action → Conversions on a website → enter `got-moles.com` → Scan → Continue
5. Create per 4-action taxonomy:
   - "Phone call ≥60s" (Phone calls category) — via Google Forwarding Number, free, dashboard-only
   - "Contact form submission" (Submit lead form) → `AW-XXX/YYY` → env var
   - "Quiz completion" (Sign-up or Submit lead form) → `AW-XXX/YYY` → env var
6. Enable Enhanced Conversions per action (requires site-side hashing — already in tracking.ts)

**ATP observation mid-flow:** Google Ads was previously set up for a different domain (`atpbos.com`); the Google tag domain list needed migrating before conversion actions could land on the right data source. Check this before creating actions — Tools → Data Manager → Google tag → Manage → Configure your domains.

### 5.3 Microsoft Advertising

1. Go to https://ads.microsoft.com → sign in with canonical Google identity (Google OAuth works since Feb 2026)
2. **Microsoft requires a payment method** before account creation completes. Add a card (no spend triggers until campaigns run)
3. Microsoft forces a starter campaign (Performance Max) as part of signup — create minimal placeholder, **set to Paused**, £1 budget placeholder
4. Tools → Conversion tracking → UET tag → Create → copy the 8-digit tag ID
5. Env var: `NEXT_PUBLIC_BING_UET_ID=<tag-id>`
6. Conversion goals: select per 4-action taxonomy (Submit lead form, Sign-up, Book appointment — skip Phone call lead if GFN handles it)
7. Do NOT tick "Enable Microsoft Clarity" if already installed — creates duplicate project

**ATP observation:** Microsoft forced the paid campaign path; not a true free signup path exists anymore. Plan for 10-15 minutes of friction.

### 5.4 Google Business Profile verification

Confirm canonical NAP on all 3 GBP locations (Seattle, Tacoma, Enumclaw per memory). Fix any drift.

---

## Part 6 — Schema.org entity graph

### 6.1 Single source of truth rule

**Never have two schema files with conflicting data.** AI engines cross-reference and flag inconsistencies as "unreliable entity" → exclusion from recommendations.

One file: `src/lib/schema.ts`. All entity data lives here. Every page that references schema imports from here via `@id`.

**ATP observation:** started the day with two schema files that disagreed (one had revenue-gating language, outdated social URLs; the other had full NAP but missing richness). Cost a commit to reconcile. Do it right from day one.

### 6.2 Root schema graph

In `layout.tsx`, render:

```tsx
import { rootSchemaGraph } from '@/lib/schema'

<head>
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(rootSchemaGraph) }}
  />
</head>
```

`rootSchemaGraph` contains:
- `Organization` entity (name, legalName, alternateName, url, logo, address, telephone, email, foundingDate, identifier [Companies House / EIN / D-U-N-S], founder@id, sameAs array with all canonical social URLs)
- `Person` entity for the principal (name, jobTitle, worksFor@id, sameAs for personal social)
- `WebSite` entity (url, inLanguage, publisher@id)

### 6.3 Per-page schema

Contact page extends via `@id` — doesn't duplicate:

```tsx
{
  '@type': 'LocalBusiness',
  '@id': `${BASE_URL}/#local-business`,
  // ... extends with phone, address, areaServed, priceRange
}
```

### 6.4 Got Moles additions

For local-service entities, add:
- `LocalBusiness` subtype: `PestControlService` (more specific than generic Organization)
- `areaServed` array of city entries (Seattle, Bellevue, Sammamish, etc.)
- `serviceType`: "Mole Control Services"
- `priceRange`: matches the service offering
- Separate `Place` entities per GBP location with `@id` links

---

## Part 7 — Site code surfaces

### 7.1 Contact page

Hero = primary booking CTA (whatever Got Moles uses — calendar embed OR a quiz link OR the contact form).
Direct contact grid: Phone (tel: link), WhatsApp or SMS (optional for US), Email (mailto), social.
Full canonical address in site footer (not per-page).
`LocalBusiness` JSON-LD at page level extending Organization@id.

**Pattern from ATP `/contact`:** Calendly inline embed section → multi-card direct contact grid → JSON-LD extending Organization.

### 7.2 Footer

Copy ATP pattern: canonical NAP in brand-identity column using semantic `<address>` element.

```tsx
<address className="not-italic">
  <a href="tel:+1XXXXXXXXXX">(XXX) XXX-XXXX</a>
  <a href="mailto:info@got-moles.com">info@got-moles.com</a>
  <span>
    Got Moles? LLC<br />
    {registered address}
  </span>
</address>
```

**Do NOT add a persistent phone icon in the header.** Dilutes the primary CTA and signals low-ticket service. Footer is enough for NAP; primary CTA is booking/quiz/form.

### 7.3 Privacy policy

Update privacy policy to enumerate:
- GA4
- Meta Pixel + Meta CAPI
- Google Ads (incl. Enhanced Conversions)
- Bing UET
- Microsoft Clarity
- Any form backend service
- Any CRM integration (Jobber)

Plain language, no legal boilerplate. Add a "Cookies We Use" section with each tag's purpose.

---

## Part 8 — Vercel env vars (full list)

All Production + Preview. `NEXT_PUBLIC_` prefix = browser-exposed, never Sensitive. No-prefix = server-only, Sensitive ON for anything secret.

```bash
# GA4 (if env-ified from hardcoded)
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX

# Meta
NEXT_PUBLIC_META_PIXEL_ID=<16-digit dataset ID>
META_CAPI_ACCESS_TOKEN=<EAA...> # Sensitive ON
META_CAPI_TEST_EVENT_CODE=<TEST...> # Optional, only during setup verification

# Google Ads
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-<customer-id-no-hyphens>
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_PHONE=AW-XXX/YYY
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_CONTACT_FORM=AW-XXX/YYY
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_QUIZ=AW-XXX/YYY

# Bing
NEXT_PUBLIC_BING_UET_ID=<8-digit tag ID>

# Microsoft Clarity
NEXT_PUBLIC_CLARITY_PROJECT_ID=<10-char project ID>
```

**Vercel UI 2026 quirks caught during ATP install:**
- Field is labeled "Key" not "Name"
- Sensitive toggle is ON by default — must flip OFF for any `NEXT_PUBLIC_` var (browser-exposed can't be Sensitive by definition)
- Changing env vars does NOT trigger auto-redeploy — must manually redeploy (Deployments → latest → ⋯ → Redeploy)

---

## Part 9 — Presence + profile hygiene (Got Moles Track E)

**Per location × 3:**

| Platform | Priority | Action |
|---|---|---|
| Google Business Profile | Critical | NAP audit per location, category verify, photos, attributes |
| Bing Places | Critical | 3 separate location listings |
| Apple Business Connect | High | 3 separate locations |
| Yelp | Critical (US local-service) | NAP consistency, owner-claimed, response templates |
| Angi | High | Profile claimed + NAP |
| Nextdoor | High | Neighborhood-specific presence per city |
| BBB | Medium | Profile + accreditation if applicable |
| HomeAdvisor | Medium | Profile + NAP |
| Thumbtack | Medium | Profile + NAP |
| Facebook Page | Medium | NAP check per location page if separate |
| Moz Local / BrightLocal scan | Medium | Free NAP audit across 20+ directories — surfaces drift |

**NAP consistency rule:** every platform's business name, phone, and address must match the canonical byte-for-byte. AI engines penalize drift.

### Historical data recovery (Got Moles Track D)

Per memory `project_got_moles_ads_ownership.md` — previous agency data "unreachable — cold-start 4-6 weeks." Attempt handoff sequence:

**Spencer chases:**
- Google Ads account (matured Quality Scores, negatives, 2+ years history)
- Microsoft (Bing) Ads account (34% of paid mix per previous-agency baseline)
- GA4 property (old-site traffic baseline)
- Google Search Console property (old keyword data)

**Deadline:** 7 days post-DNS. If not resolved, write off and cold-start using documented baselines from `google-ads-campaigns/baseline-from-previous-agency.md` ($10.28 CPL blended, 1,409 top-3 keywords).

---

## Part 10 — Verification checklist

Run in this order once all env vars are populated and deploy is green.

### 10.1 Browser DevTools on live site

Open `https://got-moles.com/`, DevTools → Network → reload → filter for:

| Filter | Expected |
|---|---|
| `clarity.ms` | 200 OK request to tag endpoint |
| `facebook.com/tr` | 200 OK Pixel PageView (AFTER cookie accept) |
| `bat.bing.com` | 200 OK UET pageLoad |
| `googletagmanager.com/gtag` | 200 OK gtag.js load |
| `/api/capi` | 200 POST (only when business event fires, not PageView) |

### 10.2 Platform consoles

- **GA4 Realtime** → events appear under taxonomy names
- **Meta Events Manager → Test Events** → Pixel + CAPI both show with matching `event_id` (dedupe verified)
- **Meta Events Manager → All The Power/Got Moles dataset → Overview** → count climbs from 0
- **Google Ads → Tools → Conversions → Tag Setup** → status "Recording conversions"
- **Bing UET Tag Helper** browser extension → green on tag
- **Microsoft Clarity dashboard** → Sessions tab populated within 30 min

### 10.3 NAP audit

- Run Moz Local free scan — identify drift across top 20 directories
- Query ChatGPT / Perplexity / Claude for "Got Moles Washington State" and "mole control Seattle" — verify citation NAP matches canonical

---

## Part 11 — Post-launch backlog

Not first-pass critical, but log as follow-ups:

| Item | Why |
|---|---|
| BigQuery link from GA4 | Free, captures raw event stream without sampling — valuable for later analysis |
| Looker Studio dashboard | Traffic / conversions / per-city performance |
| Call tracking — CallRail | If cross-source call attribution needed (Meta/organic calls won't flow through GFN) |
| Wikidata entity creation | Company + person entity, post-notability evidence |
| Crunchbase profile | AI-engine citation boost |
| D-U-N-S number | Apply via Dun & Bradstreet if not discovered via Apple Business Manager |
| Trustpilot claim | Defensive — reserves entity name |
| Apple Search Ads | iOS-specific, assess at Month 3 from iOS share in GA4 |
| Nextdoor Ads | Hyperlocal paid, assess at Month 3 from organic Nextdoor engagement |
| llms.txt file | At `/llms.txt` — formal spec for AI crawlers |

---

## Got Moles timeline against DNS switch (2026-04-27 target)

| Phase | Window | Items |
|---|---|---|
| Phase 1 — Pre-DNS | This week | Code-side installs (Clarity, MetaPixel, BingUET, GoogleAdsTag, tracking.ts, CookieConsent, schema.ts), Meta domain verification meta tag in code, consent banner live. No env vars yet. |
| Phase 2 — DNS cutover + 24h | Week of 2026-04-27 | GSC + Bing Webmaster claim, Apple Business Connect per location, GBP website field updates (× 3), populate all Vercel env vars, redeploy, Meta Pixel ID + CAPI token generation, Google Ads account confirmation |
| Phase 3 — Week 1 post-launch | 2026-04-28 to 2026-05-04 | Meta CAPI verification in Test Events, BigQuery link enable, conversion marking in GA4, Moz Local NAP scan, AI-engine citation spot-check |
| Phase 4 — Month 1+ | 2026-05-04 onwards | Google Ads conversion actions (post-handoff resolution), Enhanced Conversions, Looker Studio dashboard, consent banner tool decision if changing |

---

## Patterns to copy literally from ATP codebase

| Got Moles file | Copy from ATP path |
|---|---|
| `src/components/GoogleTag.tsx` | `projects/briefs/atpbos-website-rebuild/site/src/components/GoogleTag.tsx` |
| `src/components/MetaPixel.tsx` | Same path |
| `src/components/Clarity.tsx` | Same path |
| `src/components/BingUET.tsx` | Same path |
| `src/components/GoogleAdsTag.tsx` | Same path |
| `src/components/CookieConsent.tsx` | Same path |
| `src/app/api/capi/route.ts` | Same path (Meta CAPI server-side) |
| `src/lib/tracking.ts` | Same path (unified trackEvent helper) |
| `src/lib/schema.ts` | Same path (but edit canonical NAP + entity descriptions to match Got Moles) |
| `src/app/(frontend)/layout.tsx` | Same path — same wiring pattern |
| `src/components/Footer.tsx` | Same path — adapt the NAP block for 3-location business (or single corporate address + service-area note) |

Each file is < 200 lines, self-contained, env-gated, consent-aware. Copy → swap NAP + IDs + descriptions → ship.

---

## Got Moles-specific adaptations summary

| Pattern | ATP version | Got Moles version |
|---|---|---|
| Primary CTA | Calendly embed | TMCP quiz / contact form / phone |
| Phone strategy | Owned UK SIM + WhatsApp | Business line + GFN overlay for paid + CallRail later if multi-source attribution needed |
| Locations | 1 registered | 3 GBP locations |
| Directories | Coaching-adjacent | Local-service (Yelp, Angi, Nextdoor, BBB, HomeAdvisor) |
| Historical data | N/A (own accounts) | Track D chase sequence — previous agency handoff |
| Compliance | Basic privacy policy | Plus "No I-713 compliance claims" per memory rule |
| Legal entity | UK Ltd + Companies House | WA LLC + EIN + state registration |
| Language | en-GB | en-US |
| Currency | GBP | USD |
| Country code | GB | US |
