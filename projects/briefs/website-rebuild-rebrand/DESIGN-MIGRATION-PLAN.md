# Design Migration Plan — Production Component Rebuild

**Created:** 2026-04-06
**Source of truth:** Test pages (`/test/homepage`, `/test/how-it-works`, `/test/city`, `/test/tmcp`) + `brand_context/design-system.md` (aligned to test pages)
**Scope:** Rebuild every production component to match the design-unification spec
**Status:** Waves 1-4 COMPLETE. Wave 5 (visual QA + sign-off) IN PROGRESS.
**Completed:** 2026-04-06 — 18 components rebuilt, CMS schema migrated, full reseed, SEO/GEO audit passed.

## CMS Reseed Rule

**CRITICAL:** The homepage (and all CMS pages) are served from the Payload CMS database, NOT from `pages-data.ts`. Changes to `pages-data.ts` only update the seed source. After any wave that changes page data (backgrounds, copy, block structure), the affected pages MUST be reseeded:

```bash
cd projects/briefs/website-rebuild-rebrand/site
npx tsx src/scripts/seed.ts --reseed home          # reseed homepage only
npx tsx src/scripts/seed.ts --reseed home,about    # reseed multiple
npx tsx src/scripts/seed.ts --reseed all           # reseed all pages
```

This requires local `.env` with `DATABASE_URI` and `PAYLOAD_SECRET`. Roy runs this after each wave's data changes.

**Reseed schedule:**
- After Wave 1 (DM-1d): `--reseed home` ← PENDING
- After Wave 2 (DM-2c): `--reseed home` (hero + trust bar restructured)
- After Wave 3: `--reseed home` (section component data changes)
- After Wave 4: `--reseed all` (landing pages, other pages affected)

---

## Why This Plan Exists

Phase 5 production components were built from Phase 4 blueprints BEFORE Moni's design review. Moni's review (2026-04-04) created the design-unification project with 16 design principles, Figma screenshots, and test pages — but the production components were never rebuilt to match. A piecemeal CSS-tweak approach was attempted and reverted because it missed structural changes.

This plan treats the migration as a proper component rebuild, not a CSS patch.

---

## Reference Files

| File | What it contains |
|------|-----------------|
| `brand_context/design-principles.md` | 16 design rules — the constitution |
| `brand_context/moni-design-input/Moni notes/FigmaScreeshots/` | 11 Figma prototype screens |
| `site/src/app/(frontend)/test/homepage/page.tsx` | Reference implementation — homepage |
| `site/src/app/(frontend)/test/how-it-works/page.tsx` | Reference implementation — how it works |
| `site/src/app/(frontend)/test/city/page.tsx` | Reference implementation — city template |
| `projects/briefs/design-unification/brief.md` | Design unification project brief + key decisions |

---

## Component Audit: Current vs Required

### WAVE 1 — Foundation (everything else depends on these)

#### 1.1 Section.tsx — Surface & Spacing
**Design principles:** #3 (dark-first, gradient transitions), #8 (generous whitespace)
**Current:** Flat colors (`bg-grass-600`, `bg-blue-600`, `bg-cream-50`). Padding `py-12 lg:py-24`.
**Required:**
- Replace flat grass with subtle alternating gradients (`#184241 ↔ #153635`)
- New background variants: `grass` (gradient A→B), `grass-alt` (gradient B→A), `grass-to-blue` (transition into blue/gradient CTA)
- Padding increased to `py-16 lg:py-32`
- `blue` background used ONLY for trust strip accent — not full sections
- `cream` background removed from homepage flow (service area TBD — may stay cream or go dark per Figma which shows it dark with a map)
**Files:** `Section.tsx`
**Data changes:** `pages-data.ts` — update all homepage section `background` values

#### 1.2 GoldDivider Removal
**Design principle:** #1 (no decorative dividers)
**Current:** GoldDivider rendered after headings in almost every block component. `showDivider` defaults to `true` or `!== false`.
**Required:** Remove ALL GoldDivider usage from production components. Spacing alone creates separation.
**Files:** `PainPointsBlock.tsx`, `FeatureGridBlock.tsx`, `StepsProcessBlock.tsx`, `TestimonialBlock.tsx`, `FAQBlock.tsx`, `CTABlock.tsx` (both), `RichContentBlock.tsx`, `StatsBlock.tsx`, `ImageTextBlock.tsx`, `ServiceAreaBlock.tsx`
**Note:** Don't delete `GoldDivider.tsx` — may still be used in CMS content or other pages. Just remove the calls from block components.

#### 1.3 Typography Consistency
**Design principle:** #16 (one body size), #5 (line-break discipline)
**Current:** Mixed `text-body` and `text-body-lg`. Headings use `text-h2` everywhere. No `textWrap: balance`.
**Required:**
- ALL body text → `text-body-lg` (paragraphs, card descriptions, step descriptions, FAQ answers, testimonial quotes)
- `text-body` reserved ONLY for form inputs/labels
- `text-sm` for captions, metadata, "Learn more" links
- Empathy/emotional headings → `text-display` (not `text-h2`)
- `textWrap: 'balance'` on all headings
- Card titles → `text-h4 lg:text-2xl`
**Files:** Every block component + `ContactForm.tsx`

---

### WAVE 2 — Header + Hero + Trust Bar (interdependent cluster)

#### 2.1 Header.tsx — Complete Redesign
**Design principles:** #11 (button design), Figma screenshot 1
**Current:** Solid green bar, individual text links, "Get a Free Quote" gold button, phone number as text.
**Required (from Figma):**
- **Transparent** background overlaying the hero image
- Logo "GOT MOLES?" left-aligned, cream text
- Nav links grouped in a **subtle pill/capsule container** with border, centered: "home · about · services · blog"
- **Gold circle phone icon** on the right (no text CTA button)
- On scroll past hero: transitions to solid `grass-700` background (sticky)
- Mobile: hamburger menu, same transparent-to-solid behavior
- Simplified nav: 4 items (home, about, services, blog) — Contact moves to phone icon
**Files:** `Header.tsx` (complete rewrite)
**Data changes:** May need to update nav items in `pages-data.ts` or `Header.tsx` defaults

#### 2.2 HeroBlock.tsx — Complete Redesign
**Design principles:** #9 (imagery as atmosphere), #12 (trust inside hero), #11 (single CTA)
**Current:** `min-h-[85vh]`, blue overlay at 70%, text vertically centered, two CTA buttons, microProof text line.
**Required (from Figma + test page):**
- Full viewport: `min-h-[100vh]`, `flex flex-col`
- Background image with gradient overlay: `from-transparent via-grass-600/40 to-grass-600/95`
- Text pushed to **bottom** of hero (`mt-auto`), left-aligned, `max-w-2xl`
- Heading: `text-display` (not `text-h1`)
- **Single CTA button** — "See How It Works" with circle-chevron icon
- No phone button in hero (phone is in header + sticky bar)
- No microProof text (trust strip handles this)
- Trust strip integrated INTO the hero bottom (see 2.3)
**Files:** `HeroBlock.tsx` (complete rewrite)
**Data changes:** `pages-data.ts` — remove `secondaryCta`, `microProof` from hero blocks. Change `cta` to navigation link.

#### 2.3 Trust Bar — Merge Into Hero
**Design principle:** #12 (trust elements flowing, inside hero)
**Current:** Separate `StatsBlock` component with columnar grid of number+label boxes on blue background.
**Required:**
- NOT a separate section — sits at the **bottom of the hero**, within the hero `<section>`
- Gradient overlay: `transparent → rgba(24,66,65,0.85) → #184241` — hero photo continues behind
- Gold stars centered above
- Single flowing line of dot-separated stats: "5-Star Rated · Nearly 5,000 Clients Served · Since 2017 · Veteran-Owned · Safe for Pets & Kids"
- No boxes, no columns, no large numbers
**Files:** Part of `HeroBlock.tsx` rewrite (inline, not separate component)
**Data changes:** `pages-data.ts` — remove separate `trustBar` block from homepage. Add trust data to hero block data.

---

### WAVE 3 — Section Components (independent, can parallelize)

#### 3.1 PainPointsBlock.tsx — Empathy Section Redesign
**Design principles:** #4 (centered above prose), #16 (display heading), #1 (no dividers), #11 (CTA with icon)
**Current:** `text-h2` heading, GoldDivider, single `<p>` body with `\n\n`, bullet points list, no CTA.
**Required:**
- Heading: `text-display` with `textWrap: balance`
- No GoldDivider
- Body split into separate `<p>` tags on `\n\n`, descending opacity (85% → 80%)
- Final line ("That's where we come in.") rendered bold/semibold
- CTA button with circle-chevron icon at bottom
- Remove bullet points support (not used in Moni's design)
**Files:** `PainPointsBlock.tsx`
**Data changes:** `pages-data.ts` — add `cta` object to painPoints block, update copy to match test page

#### 3.2 FeatureGridBlock.tsx — Service Cards + Feature Grid
**Design principles:** #2 (no visible containers), #3 (bg-white/5 cards), #11 (button design), #16 (typography)
**Current:** Sharp-cornered cards with borders. Light cards have `bg-white border border-neutral-200`. Dark cards have `bg-cream-200/5 border border-cream-200/10`. No price field. "Learn more →" text links.
**Required:**
- `rounded-2xl` on all cards
- Dark cards: `bg-white/5` with `hover:bg-white/10`, NO visible border
- Light cards: `bg-white rounded-2xl` with `hover:border-gold-500`
- New `price` field rendered in gold below title
- Whole card clickable as `<a>` when link exists
- Link text with inline arrow SVG (not `→` character)
- Heading: no GoldDivider, `textWrap: balance`
- Card titles: `text-h4 lg:text-2xl`
- Card descriptions: `text-body-lg` (not `text-body`)
- Padding: `p-6 lg:p-8`
**Files:** `FeatureGridBlock.tsx`
**Data changes:** `pages-data.ts` — add `price` to service items, change `linkText` to action-oriented, change services `background` from `cream` to `grass-alt`, change "Why Got Moles" `background` from `blue` to `grass`

#### 3.3 StepsProcessBlock.tsx — How It Works Redesign
**Design principles:** #6 (progressive disclosure), #4 (left-aligned above prose), #1 (no dividers), #11 (CTA)
**Current:** Centered, 4-column grid with step numbers (01-04), vertical dividers between columns, no expand/collapse.
**Required (from Figma + test page):**
- Left-aligned heading (not centered)
- Steps as vertical list with gold dot bullet (not numbers, not columns)
- Step titles: `text-h3`, bold, uppercase
- Step summary: `text-body-lg`, visible by default
- **Progressive disclosure:** `<details>` expand with "Learn more" + chevron for additional content
- CTA button at bottom with circle-chevron icon + subtext line
- No GoldDivider
- No column layout — single column, `max-w-3xl`
**Files:** `StepsProcessBlock.tsx` (complete rewrite)
**Data changes:** `pages-data.ts` — restructure steps data to include `summary` + `detail` fields (currently only has `description`). Add CTA. Change background to `grass-alt`.

#### 3.4 TestimonialBlock.tsx — Featured + Supporting Pattern
**Design principles:** #14 (featured single, not grid), #2 (no containers)
**Current:** 3 equal cards in a grid with quote mark + divider line + stars + card background.
**Required:**
- **Featured review:** large centered blockquote, stars above, gold quote mark, name + city below
- **Supporting reviews (optional):** 2 smaller quotes in 2-col grid below, gold left-border only, lighter text
- No card backgrounds on individual quotes
- No gold divider line between quote and attribution
- "See All 219+ Reviews" link below
- No GoldDivider after heading
**Files:** `TestimonialBlock.tsx` (complete rewrite)
**Data changes:** `pages-data.ts` — restructure to `featured` quote + `supporting` quotes array. Change background to `grass-to-blue`.

#### 3.5 CTABlock.tsx (both versions) — Contact Form Redesign
**Design principles:** #3 (transparent forms on dark), #7 (forms: 2-column on desktop), #11 (buttons)
**Current:** Centered single-column layout, white form container with solid inputs, GoldDivider.
**Required (from Figma + test page):**
- **2-column layout** on desktop: text + CTA button left, form right
- Heading left-aligned (not centered), `textWrap: balance`
- No GoldDivider
- Form inputs: **transparent background**, `border-cream-200/30`, `rounded-2xl`, cream text, cream placeholders at 40%
- Submit button: gold `rounded-2xl`, full width
- No white form container — form floats on dark background
- Subtext below form in cream at 40%
**Files:** `CTABlock.tsx` (blocks/), `CTABlock.tsx` (components/), `ContactForm.tsx`
**Data changes:** May need a `variant` prop on ContactForm for dark-transparent vs white-solid styles

#### 3.6 ServiceAreaBlock.tsx — Map + Links
**Design principle:** #13 (map + visible links)
**Current:** City link pills on cream background with "See All Service Areas" outline button.
**Required (from Figma):**
- Dark background (grass, not cream)
- Left-aligned heading + description
- Map visual (embedded Google Map or static image)
- City links grouped by county, visible in DOM
- Button: `rounded-2xl` with circle-chevron
**Files:** `ServiceAreaBlock.tsx`
**Data changes:** `pages-data.ts` — change background from `cream` to `grass-alt` or similar

---

### WAVE 4 — Global Polish

#### 4.1 Button Consistency Pass
**Design principle:** #11 (button design)
- `rounded-2xl` on ALL buttons across ALL components
- Circle-chevron icon on navigation CTAs (not on `tel:` links)
- `px-8 py-4` padding (not `px-9 py-4`)
- `inline-flex items-center gap-2` layout
**Files:** Every component with a button/CTA

#### 4.2 Card Border Removal
**Design principle:** #2 (no visible containers)
- Remove `border border-cream-200/10` from dark cards
- Remove `border border-neutral-200` from light cards (keep only on hover)
- Cards use tonal shift only (`bg-white/5`)
**Files:** `FeatureGridBlock.tsx`, `TestimonialBlock.tsx`, `TestimonialCard.tsx`, `ServiceCards.tsx`, `CmsServiceCards.tsx`, `FAQBlock.tsx`

#### 4.3 Landing Page Component
**Design principles:** Apply all relevant principles
**Current:** Sharp corners, solid backgrounds, fake reviews (already fixed with real ones).
**Required:** Match all design principles — rounded buttons, dark backgrounds, transparent forms
**Files:** `LandingPage.tsx`

#### 4.4 MobileStickyBar
**Design principle:** #11 (button design)
**Current:** Full-width gold bar, sharp corners.
**Required:** May need `rounded-2xl` on top corners or keep full-bleed. Check against Figma.
**Files:** `MobileStickyBar.tsx`

#### 4.5 Footer
**Design principle:** #1 (no dividers), #3 (dark-first)
**Current:** `bg-grass-800` with `border-t border-cream-200/10` dividers.
**Required:** Remove border-top dividers, spacing only.
**Files:** `Footer.tsx`

---

## Execution Order

Waves must execute in order (1→2→3→4). Within waves 3 and 4, components are independent and can be done in any order.

```
WAVE 1: Foundation (Section + GoldDivider + Typography)
  ↓ affects every component's wrapper, dividers, and text sizing
WAVE 2: Header + Hero + Trust (interdependent cluster)
  ↓ sets the top-of-page experience
WAVE 3: Section components (independent, any order)
  3.1 PainPoints
  3.2 FeatureGrid (services + why got moles)
  3.3 StepsProcess (how it works)
  3.4 Testimonials
  3.5 CTA/Contact form
  3.6 Service Area
  ↓
WAVE 4: Global polish
  4.1 Button consistency
  4.2 Card border removal
  4.3 Landing pages
  4.4 Mobile sticky bar
  4.5 Footer
```

## Verification After Each Wave

After completing each wave:
1. `npx tsc --noEmit` — zero TypeScript errors
2. Visual check on Vercel staging against Figma screenshots
3. Check test pages still render correctly (reference implementations)
4. Compare production homepage against `/test/homepage` — should be converging

## Pages Affected

The homepage is the primary target. Once homepage components are rebuilt, the same components render on ALL other pages (How It Works, About, TMCP, One-Time Removal, Commercial, FAQ, Contact, Reviews, city pages, blog posts, landing pages). So the component rebuild automatically propagates everywhere.

**Pages to visually verify after migration:**
- Homepage
- How It Works
- TMCP (Total Mole Control Program)
- About
- A city page (e.g., Sammamish)
- A blog post
- An AdWords landing page
- Contact page
- FAQ page

## What NOT to Change

- **Content/copy** — already approved, already uses real reviews
- **Schema markup** — visual changes don't affect structured data
- **URL structure** — no routing changes
- **CMS collections/blocks Payload schema** — component visual changes only, not data model
- **SEO elements** — meta tags, sitemap, robots.txt, llms.txt unchanged
- **Test pages** — these are the reference, don't modify them
