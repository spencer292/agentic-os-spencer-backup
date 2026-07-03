---
project: paid-search-landing-pages
type: build-spec
created: 2026-05-23
status: ready-to-build (hand to a Got Moles build session)
build_from: clients/got-moles/projects/briefs/website-rebuild-rebrand/site
parent_strategy: agent-os ROOT projects/briefs/got-moles-paid-search/2026-05-23_landing-page-strategy.md
purpose: Extend the EXISTING working /lp/[city]/ template to ~18 more cities, data-driven from city-data.ts, with a reserved (empty) video slot. No video required. Non-video version must be excellent on its own.
---

# No-Video City LP Template — Build Spec

> **Read first in the build session:** `website-rebuild-rebrand/PAGE-BUILD-REFERENCE.md` +
> `website-rebuild-rebrand/BUILD-METHODOLOGY.md` + `brand_context/design-system.md`.
> **Correct site path:** `clients/got-moles/projects/briefs/website-rebuild-rebrand/site`
> (BUILD-METHODOLOGY's startup path `C:\Claude\agent_os_main_atp\...` is STALE — ignore it.)

## Prime directive — match the working pages
The 5 live LPs (Seattle/Tacoma/Kent/Bellevue/Kirkland) already convert (Kirkland 42.9% CTR).
**Extend `src/lib/lp-city-data.ts` `buildLpBlocks()` — do NOT rewrite it, do NOT invent new
block types or styles.** Reuse the existing block types and their class/token patterns. When in
doubt, copy the live pattern, not this prose. Per `feedback_match_live_pages_not_specs`.

## Key build facts (verified 2026-05-23)
- **LP pages bypass the CMS** — they render directly from `lp-city-data.ts` block arrays. **NO seed / NO reseed / NO Blob.** (Confirmed in the file header + PAGE-BUILD-REFERENCE.)
- **Images:** no `BLOB_READ_WRITE_TOKEN` locally → all images are static WebP in `site/public/images/`. County heroes already exist: `hero-king-county`, `hero-pierce-county`.
- **Deploy flow:** `npx next build` (must pass) → `git add {specific files}` → commit → `git push mine main` → verify on `project-pf8c6.vercel.app/lp/{city}/`. Never localhost, never `origin`.
- **Already in place:** `/lp/` is `noindex,nofollow` (per-page metadata + `lp/layout.tsx`), robots-disallow, sitemap-excluded. Keep it.

---

## The working baseline (current `buildLpBlocks`, in order)
This is what the live LPs render. Reproduce exactly for new cities; the new blocks slot in as noted.

1. `hero` — `Mole Removal in {City} — $150 to Start`, subheading = `uniqueParagraph`, `layout:'left'`, `heroHeight:'70vh'`, `fallbackImage: city.heroImage`, primary CTA `CALL (253) 750-0211` → `tel:+12537500211`, `trustStrip:['219+ 5-Star Reviews','Nearly 5,000 Yards','Since 2017','Veteran-Owned','Safe for Pets & Kids']`
   - *Route injects `<LpQuickForm city={CITY}/>` immediately after the hero — keep this.*
2. `stepsProcess` (`background:'grass-alt'`) — "How It Works" 4 steps (Call → Book $150 → Inspect+Trap → Weekly checks, balance only if caught) + call CTA
3. `testimonial` (`background:'grass'`) — `pickLpReviews(city.slug)` top-3, city-matched heading, moreLink → `/reviews/`
4. `cta` (`background:'grass-alt'`) — TMCP $100/mo year-round, `buttonStyle:'secondary'`, `showForm:false`
5. `cta` (`background:'gradient'`) — `Ready to Get Started in {City}?`, `showForm:true`, primary — **must stay the LAST block** (Page Structure Checklist rule 4)

---

## Changes to make

### 1. Convert to a dynamic route (one template, all cities)
- Create `src/app/(frontend)/lp/[city]/page.tsx` — **mirror `lp/seattle/page.tsx` exactly**, but read `LP_CITIES[params.city]` (404 if missing). Add `export function generateStaticParams()` returning `Object.keys(LP_CITIES).map(city => ({ city }))`.
- Keep the metadata pattern (title `Mole Removal in {City} — $150 to Start | Got Moles`, the same description shape, `robots:'noindex, nofollow'`, canonical `https://got-moles.com/lp/{slug}/`).
- Keep the render order: `breadcrumbSchema` JsonLd → hero block → `<LpQuickForm city={CITY}/>` → remaining blocks. **Add `faqSchema(...)` JsonLd** once the FAQ block exists (see change 3).
- **Delete the 5 static per-city files** (`lp/seattle|tacoma|kent|bellevue|kirkland/page.tsx`) so the dynamic route owns them — URLs are unchanged, so paid final-URLs keep working.

### 2. Add the ~18 cities to `LP_CITIES`
Each entry needs: `slug, displayName, heroImage (county map), neighborhoods, uniqueParagraph, defaultZip`.
- **Source `neighborhoods` from `city-data.ts`** (`cityData[slug].localDetails` / `nearbyCity1/2` / `communityDescription`) — real local names, not generic.
- **Write `uniqueParagraph` per city** in Got Moles voice from `city-data.ts` content. **Posture-A clean** (no kill/trap-mechanism; "safe for pets & kids," never "safe for moles") and **humanizer ≥8.5**. Keep the existing pattern: one tight paragraph naming neighborhoods + the $150/$450/no-catch-no-charge offer.
- `heroImage`: King County → `hero-king-county`, Pierce → `hero-pierce-county` (both exist).
- **Add an `ADJACENT[slug]` entry** for each new city (neighbouring city slugs) so `pickLpReviews` can city-match reviews; if omitted it still falls back to WA-general (acceptable).

**Worked example (copy this shape):**
```ts
redmond: {
  slug: 'redmond',
  displayName: 'Redmond',
  heroImage: 'hero-king-county',
  neighborhoods: 'Education Hill, Grass Lawn, Overlake',     // from city-data.ts
  uniqueParagraph:
    'Education Hill to Overlake — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. Chemical-free, safe for pets and kids.',
  defaultZip: '98052',
},
```

**Cities to add (demand-ranked from the rankings corpus; verify ZIP/neighborhoods against city-data.ts):**

| slug | Display | County → heroImage | ~ZIP |
|------|---------|--------------------|------|
| redmond | Redmond | King → hero-king-county | 98052 |
| renton | Renton | King | 98057 |
| tukwila | Tukwila | King | 98168 |
| woodinville | Woodinville | King | 98072 |
| shoreline | Shoreline | King | 98133 |
| maple-valley | Maple Valley | King | 98038 |
| burien | Burien | King | 98146 |
| issaquah | Issaquah | King | 98027 |
| enumclaw | Enumclaw | King | 98022 |
| puyallup | Puyallup | Pierce → hero-pierce-county | 98371 |
| buckley | Buckley | (per city-data county) | 98321 |
| covington | Covington | King | 98042 |
| fife | Fife | Pierce | 98424 |
| federal-way | Federal Way | King | 98003 |
| sammamish | Sammamish | King | 98074 |
| south-hill | South Hill | Pierce | 98374 |
| kenmore | Kenmore | King | 98028 |
| des-moines | Des Moines | King | 98198 |

(Existing 5 stay. Confirm each slug matches its `city-data.ts` key + the Google Ads final-URL.)

### 3. Extend `buildLpBlocks` — add local proof + FAQ + reserved video slot
Insert these using EXISTING block types, keeping the **gradient CTA last** and **alternating grass/grass-alt** (Page Structure Checklist rules 4, 6, 7). Pull content from `city-data.ts[slug]`; if a field/city is missing, **skip that block gracefully** (don't render an empty block).

- **Local-proof block** (after `testimonial`, before TMCP CTA) — use `geoDefinition` or `richContent` (`background:'grass'`): a "Why moles thrive in {City}" paragraph from `cityData.whyMolesThrive` + the `neighborhoods`/`localTip`. This is the uniqueness + relevance that keeps 18 pages from reading as thin duplicates (and the QS landing-page-experience lever).
- **FAQ block** (`faq`, `generateSchema:true`, `background:'grass-alt'`) — `cityData[slug].faqs` (the 5-6 city-specific Q&As already written). Then add `<JsonLd data={faqSchema(faqs)}/>` in the route.
- **VIDEO SLOT — reserved, render nothing yet.** Add a clearly-commented placeholder where the video block will go (recommended position: right after the hero/quick-form, before How-It-Works). Build it as a no-op now (returns null / omitted) so the page ships clean; we wire a façade-loaded `<video>`/poster block when Spencer's clips arrive. Do NOT ship an empty box.

Final block order: hero → [video slot, empty] → How-It-Works → testimonial → **local-proof** → **FAQ** → TMCP CTA → gradient CTA (last).

---

## Gates (every city, before push)
- **Page Structure Checklist (design-system.md ~line 625), all 7:** hero owns the trustStrip; no `background:'blue'` or `'cream'` on any block; `gradient` only on the last block; no standalone `trustBar`; order hero→content→CTA; backgrounds alternate grass/grass-alt.
- **Branding tokens (globals.css):** grass-600 `#184241` (~90% of page), gold-500 `#E68C04` (CTAs only), blue/rust only inside the final gradient, cream-200 text-on-dark only. Fonts: Lexend Bold (h1/h2 uppercase), Zilla Slab (h3/body).
- **Posture A:** no trap-mechanism / kill language anywhere (uniqueParagraph, FAQ, local-proof). The review picker already filters quotes — keep `containsBannedTerm`.
- **Humanizer ≥8.5 deep** on every new line of copy (per BUILD-METHODOLOGY).
- **CWV:** hero image `fetchpriority="high"`, never lazy; everything below-fold lazy; page <1MB; WebP only. (No video = easier CWV — keep it that way until the façade-loaded video lands.)
- **Conversion:** one primary CTA per viewport; click-to-call (`tel:+12537500211`) in hero + final CTA; sticky mobile bar already global; quick form posts to Jobber w/ GCLID.
- **US English** throughout.

## Deploy (LP-specific — no CMS)
```
1. edit src/lib/lp-city-data.ts (LP_CITIES + buildLpBlocks + ADJACENT)
2. add src/app/(frontend)/lp/[city]/page.tsx ; delete the 5 static city files
3. npx next build            # must pass clean — fix errors, don't patch past 2+
4. git add {those files}
5. git commit -m "lp: data-driven city template + 18 cities (no-video, video slot reserved)"
6. git push mine main        # Vercel staging
7. verify: project-pf8c6.vercel.app/lp/{each city}/  (NO reseed step)
```

## Acceptance criteria (per city)
- Renders at `/lp/{slug}/`, 200, `noindex` in source.
- H1 = "Mole Removal in {City} — $150 to Start" (message-match).
- Hero click-to-call dials the CallRail-swapped number; quick form present.
- City-relevant reviews show (city-matched heading where reviews exist).
- Local-proof + FAQ render with that city's `city-data.ts` content; FAQPage schema validates.
- Page Structure Checklist passes; CWV green on PageSpeed; Posture-A clean; humanizer ≥8.5.
- Gradient CTA is the last block; one primary CTA per viewport.
- Then point each city's Google Ads exact keywords at its `/lp/{slug}/` (not the organic page).

## Open inputs (non-blocking — slots reserved, ship without them)
- **Video** — NotebookLM explainer + Spencer clip (Spencer to provide). Slot reserved (change 3).
- **Spencer founder photo** + **before/after yard photos** — easy static WebP adds that beat an empty video box; drop into `public/images/` and into a trust block when supplied.
- Per-city hero images (optional upgrade over county maps).

---
*Hand this to a Got Moles build window. It extends the working LP template — it does not replace it. Sign-off: Roy + Spencer before pointing paid traffic at new pages.*
