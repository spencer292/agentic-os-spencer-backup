---
project: paid-search-landing-pages
type: build-spec (one-pass)
created: 2026-05-24
status: ready-to-build — hand to the Got Moles build window
build_from: clients/got-moles/projects/briefs/website-rebuild-rebrand/site
parent_review: 2026-05-24_lp-qs-conversion-review.md (QS findings, verified live)
decisions_by: Roy (2026-05-24)
---

# LP One-Pass — Quality-Score build spec

**One pass over the `/lp/[city]/` template** to raise Quality Score (landing-page experience +
message-match) and conversion focus, **plus add Bothell**. All changes are template-level (one edit,
all cities) except the Bothell data entry.

> **Read first in the build session:** `website-rebuild-rebrand/PAGE-BUILD-REFERENCE.md` +
> `BUILD-METHODOLOGY.md` + `brand_context/design-system.md`.
> **Correct site path:** `clients/got-moles/projects/briefs/website-rebuild-rebrand/site`.
> **LPs bypass the CMS** — render from `lp-city-data.ts`. **No seed / reseed / Blob.**
> **Deploy:** `npx next build` (must pass) → `git push mine main` → verify `project-pf8c6.vercel.app/lp/{city}/`
> then `got-moles.com`. Two machines: `git fetch` + check ahead/behind before pushing.

All findings below were verified against **live production** (got-moles.com) on 2026-05-24.

---

## Scope (this pass)

- **Apply the template changes (1–4) to all existing 23 LPs + Bothell** → 24 LPs.
- **Demand-triggered backlog (NOT this pass):** 8 in-area cities (auburn, mercer-island, seatac,
  lakewood, bonney-lake, sumner, algona, dupont) — content ready, build when their keyword shows
  traffic. 6 greenfield (olympia, everett, mukilteo, bremerton, gig-harbor, centralia) — await geo
  widening. `vancouver wa` — pause keyword, do not build.
- **Ads-side (separate window, NOT here):** route each city's exact keywords to its own ad group →
  RSA with "Mole Removal {City}" → final URL = that city's `/lp/`; add keywords for covington +
  kenmore; pause `vancouver wa`. **The keyword-led H1 only moves QS once this routing is fixed.**

---

## Change 1 — Keyword-led hero (message-match) · `src/lib/lp-city-data.ts` → `buildLpBlocks`

Lead with the keyword; drop the emotional copy to the subheading. The `<h1>` is the strongest
message-match signal for `mole removal {city}`.

**In the `hero` block, replace:**
```ts
heading: `Moles Tearing Up Your ${C} Lawn? We'll End It.`,
subheading: `Fresh mounds every morning. Tunnels that collapse when you mow. A lawn you've worked hard on — going lumpy and bare. You haven't done anything wrong: moles are relentless, and they don't stop on their own. We're ${C}'s mole specialists. We do one thing, we don't guess, and you only pay the balance if we actually catch them. $150 to start. $450 max.`,
```
**with:**
```ts
heading: `Mole Removal in ${C}`,
subheading: `Moles tearing up your ${C} lawn? Fresh mounds every morning, tunnels that collapse when you mow — and they don't stop on their own. We're ${C}'s mole specialists, and you only pay the balance if we actually catch them. $150 to start. $450 max.`,
```
- Keep `heroOverlay: 'strong'`, the before-photo hero, trustStrip, and the CTA as-is.
- Bonus: `HeroBlock` derives image `alt` from the heading → alt now reads "Mole Removal in {City}"
  (service + geo) = a cleaner alt for free. No extra change.
- Humanizer ≥8.5 on the new subheading line; Posture A (no trap-mechanism/kill language); US English.

## Change 2 — Fix duplicate title · `src/app/(frontend)/lp/[city]/page.tsx` → `generateMetadata`

Live titles read `… | Got Moles | Got Moles` on all 23. Root cause: the root layout
(`(frontend)/layout.tsx`) sets `title.template = '%s | Got Moles'`, and the LP title string **already
ends** in `| Got Moles` → the template appends it again. Fix = let the template add it once.

**Replace:**
```ts
title: `Mole Removal in ${CITY.displayName} — $150 to Start | Got Moles`,
```
**with:**
```ts
title: `Mole Removal in ${CITY.displayName} — $150 to Start`,
```
Result: `Mole Removal in Redmond — $150 to Start | Got Moles` (single suffix). Verify on 2–3 live URLs.

## Change 3 — Header OFF + minimal footer on `/lp/*` (conversion focus + clean LPE)

LPs currently inherit the **full site header nav** ("How It Works · Services · Service Areas · About
· Contact") **and** the full footer nav from the root layout — confirmed live. Both are exit ramps off
a single-goal paid page. Remove them on `/lp/*` only. **Keep all tracking** (GTM/GA4/CallRail/
MobileStickyBar/Conversion Linker live in the root `<body>`, not in the header/footer — untouched by
this change). This is why we do it via conditional chrome, **not** a separate route group (a new root
layout would risk dropping GA4/GTM on LPs).

**a. New client gate** — `src/components/HideOnLp.tsx`:
```tsx
'use client'
import { usePathname } from 'next/navigation'
export function HideOnLp({ children }: { children: React.ReactNode }) {
  const p = usePathname()
  return p?.startsWith('/lp/') ? null : <>{children}</>
}
```
**b. Wrap header + footer** in `src/app/(frontend)/layout.tsx` (server components passed as children
to a client component is allowed — keeps CmsHeader/CmsFooter async data fetching intact):
```tsx
<HideOnLp><CmsHeader /></HideOnLp>
<main id="main-content" className="flex-1">{children}</main>
<HideOnLp><CmsFooter /></HideOnLp>
```
Leave `<MobileStickyBar />`, `<TrackingDelegator />`, `<GoogleTagManager />`, CallRail, Clarity exactly
as they are.

**c. Minimal LP footer** — `src/app/(frontend)/lp/layout.tsx` (currently returns only `children`).
Add a minimal footer **keeping Privacy + Terms** (Google Ads requires a privacy policy on a page that
collects form data) + phone. Match design tokens (grass bg, cream text, gold links):
```tsx
export default function LPLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear()
  return (
    <>
      {children}
      <footer className="bg-grass-700 text-cream-200/70 py-8 px-4 text-center font-body text-sm">
        <p>
          Got Moles — Western Washington&apos;s mole specialists ·{' '}
          <a href="tel:+12537500211" className="text-gold-500 underline">(253) 750-0211</a>
        </p>
        <p className="mt-2">
          <a href="/privacy/" className="text-gold-500 underline">Privacy Policy</a> ·{' '}
          <a href="/terms/" className="text-gold-500 underline">Terms of Service</a> · © {year} Got Moles
        </p>
      </footer>
    </>
  )
}
```
Verify on live: no header nav, no full footer nav, minimal footer present with working Privacy/Terms/tel.

## Change 4 — Add Bothell (proven demand: 368 GSC impr, content ready, currently leaking to generic page)

**a. `LP_CITIES`** in `src/lib/lp-city-data.ts`:
```ts
bothell: {
  slug: 'bothell',
  displayName: 'Bothell',
  heroImage: 'hero-king-county',
  neighborhoods: 'Downtown Bothell, Canyon Park, North Creek', // confirm vs city-data.ts
  uniqueParagraph:
    'Downtown Bothell to Canyon Park — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
  defaultZip: '98011',
},
```
**b. `ADJACENT`:** `bothell: ['kenmore', 'woodinville', 'kirkland', 'mill creek', 'lynnwood'],`
**c. `HERO_BEFORE`:** `bothell: 'hero-lp-before-2',` (eastside/King before-photo group)
- `cityData.bothell.whyMolesThrive` already exists (Sammamish River / North Creek) → local-proof block
  renders automatically. FAQs are template-generated (`lpFaqs`), reviews fall back — nothing else needed.
- Verify `/lp/bothell/` renders 200, noindex, H1 "Mole Removal in Bothell", local-proof paragraph, form.

## Change 5 — Confirm CWV (mobile) — verification, fix only if needed

Keyless PageSpeed is rate-limited; run a **keyed PSI mobile** pass on a King (redmond) + Pierce
(puyallup) sample. Pages are light (~117 KB, prioritized WebP hero, no video) so LCP is expected green
— but confirm LCP < 2.5s, INP < 200ms, CLS < 0.1. Fix in this pass only if a metric fails.

## Change 6 — Verify GA4 fires on `/lp/`

GTM `GTM-5XLRMCGQ` is live on LPs; container has GA4 config **`G-H8ZV2L217D`** + GA4 event tags +
Conversion Linker (GCLID). Google Ads conversions flow via **GA4 import** (no `AW-` tag — by design).
Confirm with **GTM Preview** or **GA4 Realtime/DebugView** on `/lp/redmond/`:
- pageview hit to `…/g/collect?…&tid=G-H8ZV2L217D`
- `generate_lead` (or `lp_quick_form`) event fires on form submit + GCLID present.
If the form event doesn't map, wire the GTM trigger for `form_name = lp_quick_form` → GA4 event.

---

## Heading / keyword reference (24 cities)

H1 is auto-generated as `Mole Removal in {displayName}` (Change 1). Primary ad keyword per city =
`mole removal {city}` (secondary `mole control {city}`). Each city's ad group final URL = its `/lp/`.

| slug | Display (H1 = "Mole Removal in …") | County | primary keyword |
|------|------------------------------------|--------|-----------------|
| bellevue | Bellevue | King | mole removal bellevue |
| bothell | Bothell *(NEW)* | King | mole removal bothell |
| buckley | Buckley | Pierce | mole removal buckley |
| burien | Burien | King | mole removal burien |
| covington | Covington | King | mole removal covington *(add keyword ads-side)* |
| des-moines | Des Moines | King | mole removal des moines |
| enumclaw | Enumclaw | King | mole removal enumclaw |
| federal-way | Federal Way | King | mole removal federal way |
| fife | Fife | Pierce | mole removal fife |
| issaquah | Issaquah | King | mole removal issaquah |
| kenmore | Kenmore | King | mole removal kenmore *(add keyword ads-side)* |
| kent | Kent | King | mole removal kent |
| kirkland | Kirkland | King | mole removal kirkland |
| maple-valley | Maple Valley | King | mole removal maple valley |
| puyallup | Puyallup | Pierce | mole removal puyallup |
| redmond | Redmond | King | mole removal redmond |
| renton | Renton | King | mole removal renton |
| sammamish | Sammamish | King | mole removal sammamish |
| seattle | Seattle | King | mole removal seattle |
| shoreline | Shoreline | King | mole removal shoreline |
| south-hill | South Hill | Pierce | mole removal south hill |
| tacoma | Tacoma | Pierce | mole removal tacoma |
| tukwila | Tukwila | King | mole removal tukwila |
| woodinville | Woodinville | King | mole removal woodinville |

---

## Gates (before push)
- `npx next build` passes clean.
- Page Structure Checklist holds: gradient CTA stays the **last** block; backgrounds alternate
  grass/grass-alt; no `blue`/`cream` block backgrounds; hero owns the trustStrip.
- Posture A clean (no trap-mechanism / kill language) on the new subheading.
- Humanizer ≥8.5 (deep) on the new subheading line.
- US English throughout.
- noindex preserved on all `/lp/`. Privacy + Terms links present in the minimal footer.
- Tracking intact: GTM/GA4/CallRail/MobileStickyBar still load on `/lp/` after the chrome change.

## Verify live (staging → prod)
- 3 sample LPs: H1 = "Mole Removal in {City}", single `| Got Moles` title, NO header/footer nav,
  minimal footer with Privacy/Terms/tel, form submits, sticky call bar present.
- `/lp/bothell/` renders fully.
- GA4 Realtime shows the LP pageview + lead event.
- CWV mobile green on redmond + puyallup.
