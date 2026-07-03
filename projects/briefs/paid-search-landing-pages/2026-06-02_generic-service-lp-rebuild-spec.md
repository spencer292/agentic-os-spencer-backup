---
project: paid-search-landing-pages
type: build-spec (rebuild)
created: 2026-06-02
status: ready-to-build — hand to a Got Moles website build window
build_from: clients/got-moles/projects/briefs/website-rebuild-rebrand/site
parent_specs:
  - 2026-05-23_no-video-lp-template-spec.md
  - 2026-05-24_lp-one-pass-qs-build-spec.md
target_file: src/components/LandingPage.tsx (shared by all 4 /lp/{service}/ pages)
triggered_by: paid "Buyer Intent — Generic" ad group (money keywords) is PAUSED until this ships
---

# Generic / Service LP Rebuild — Build Spec

**Problem:** the four service LPs — `/lp/mole-removal/`, `/lp/mole-trapper/`,
`/lp/mole-protection-plan/`, `/lp/commercial/` — all render from ONE thin component,
`src/components/LandingPage.tsx` (138 lines, 4 props). It never got brought up to the standard of the
proven `/lp/[city]/` template. It is where all **geo-agnostic paid traffic** lands, including the new
"money" keyword ad group (`professional mole removal`, `mole removal company`, etc.).

**Goal:** rebuild `LandingPage.tsx` to **match the proven `/lp/[city]/` block template** in structure,
tokens, and conversion mechanics — keeping its prop-driven flexibility so the 4 services stay distinct.
This is a parity job, **not new design**: copy the live city-LP patterns, don't invent.

> **Read first in the build session:** `website-rebuild-rebrand/PAGE-BUILD-REFERENCE.md` +
> `BUILD-METHODOLOGY.md` + `brand_context/design-system.md`. Correct site path:
> `clients/got-moles/projects/briefs/website-rebuild-rebrand/site`.
> **Reference implementation to mirror:** `src/lib/lp-city-data.ts` `buildLpBlocks()` + `lp/[city]/page.tsx`.
> **LPs bypass the CMS** — render from props/component. **No seed / reseed / Blob.**

---

## What's wrong with the current component (fix every one)

1. **Wall of dark green.** Every section is the same `#184241↔#153635` gradient — no rhythm, no
   contrast, Cream (`#FFF1D9`) never used. → Adopt the city-LP **alternating `grass` / `grass-alt`**
   background rhythm; gradient ONLY on the final CTA block.
2. **Zero imagery.** No hero photo, no before/after proof. → Add a **before-photo hero** (the city LPs
   use `HERO_BEFORE` static WebP groups; real yard-damage photos exist in
   `brand_context/pictures/`). `fetchpriority="high"`, never lazy.
3. **Broken desktop second CTA.** A 2-col grid (`lg:grid-cols-2`) inside `max-w-xl` (~576px) squishes
   the form to ~270px. → Replace with the city-LP **final gradient `cta` block, `showForm:true`,
   full-width, last block**.
4. **Thin proof.** Only 2 hardcoded reviews. → Use the city-LP **testimonial block** (3 reviews,
   `pickLpReviews` / WA-general fallback), `moreLink → /reviews/`.
5. **Price too high.** `$450` shown in the hero before value is built. → Move pricing into the offer
   line ("$150 to start · $450 max · pay only if we catch") in the hero subtext + How-It-Works, not as
   a standalone hero price shout.
6. **No FAQ, no local/why-us proof, no trust depth.** → Add **How-It-Works**, a **why-us / proof
   block**, and an **FAQ block with FAQPage schema** (service-level Q&As, Posture-A clean).

---

## Target structure (mirror the city-LP block order)

Service-led, geo-neutral ("Western Washington", not a city). Prop-driven per service.

1. **Hero** — `background` image (before-photo), `heroOverlay:'strong'`, `layout:'left'`.
   - `H1` = the service headline prop, e.g. **"Professional Mole Removal in Western Washington"**
     (message-match for the money keywords). Keep prop-driven so trapper/protection-plan/commercial
     each set their own H1.
   - Subtext prop (offer + reassurance): "$150 to start · $450 max · pay only if we catch. Chemical-free,
     safe for pets and kids."
   - `trustStrip:['219+ 5-Star Reviews','Nearly 5,000 Yards','Since 2017','Veteran-Owned','Safe for Pets & Kids']`
   - Primary CTA: click-to-call `tel:+12537500211` (CallRail DNI swaps it).
2. **Quick form** — inject `<LpQuickForm />` immediately after hero (city-LP pattern). Posts to Jobber
   with GCLID. (Geo-neutral: no city param, or default WA.)
3. **How It Works** — `stepsProcess`, `background:'grass-alt'`: Call → Book $150 → Inspect + Trap →
   Weekly checks, balance only if caught. (Reuse existing copy; "trap" generic verb is fine — Posture A.)
4. **Testimonials** — `testimonial`, `background:'grass'`: 3 reviews, `moreLink → /reviews/`.
5. **Why-us / proof block** — `richContent`/`geoDefinition`, `background:'grass-alt'`: chemical-free,
   pay-only-if-we-catch, veteran-owned, 5,000 yards since 2017. Optional before/after photo pair here
   if not used in hero.
6. **Guarantee** — keep the guarantee line, but scope it correctly (see Claim discipline below).
7. **FAQ** — `faq`, `generateSchema:true`, `background:'grass'`: 5–6 service-level Q&As. **Follow the
   city-LP self-emit pattern, NOT the runbook route-emit pattern:** the `FAQBlock` self-emits the
   `FAQPage` JSON-LD whenever `generateSchema !== false` (`FAQBlock.tsx:111`), so leaving
   `generateSchema:true` on the block is all that's needed. **Do NOT also add
   `<JsonLd data={faqSchema(faqs)}/>` in the page/route** — that would double-emit `FAQPage`. The route
   emits `breadcrumbSchema` only (exactly like `lp/[city]/page.tsx`). Cardinal rule: exactly ONE
   `FAQPage` node per URL. (PAGE-BUILD-REFERENCE Gotcha #7 / BUILD-METHODOLOGY step 8 mandate
   `generateSchema:false` + route-emit — but that pattern is for CMS two-layer pages; the code-rendered
   LPs use the self-emit exception, verified live on all 24 city LPs 2026-06-02.)
8. **Final CTA** — `cta`, `background:'gradient'`, `showForm:true`, **must be the LAST block**
   (Page Structure Checklist rule 4). Full-width form — fixes the squished 2-col bug.

Header already off on `/lp/*`; keep the **minimal footer with Privacy + Terms + tel** (Google Ads
requires a privacy policy on a form page) per `2026-05-24_lp-one-pass-qs-build-spec.md` Change 3.

---

## Per-service props (the 4 pages keep their identity)

| Page | H1 (prop) | Offer framing |
|------|-----------|---------------|
| `/lp/mole-removal/` | Professional Mole Removal in Western Washington | One-time: $150 setup, $450 max, pay only if we catch |
| `/lp/mole-trapper/` | Western Washington Mole Trappers | Same one-time offer; "trapper" angle |
| `/lp/mole-protection-plan/` | Year-Round Mole Protection Plan | **TMCP $100/mo** — recurring, "keep them gone" framing |
| `/lp/commercial/` | Commercial Mole Control | B2B/property framing; quote-led |

## Claim discipline (HARD — per `feedback_got_moles_claim_discipline` + client learnings)
- **Permanence ("for good"/"never again") ONLY on the Total Mole Control Program** (`/lp/mole-protection-plan/`).
- **One-time pages** (`mole-removal`, `mole-trapper`) clear **current** moles only — no permanence claims.
- **"Guarantee" = payment promise** (pay only if we catch), **never** biological eradication.
- **Posture A:** no body-gripping / scissor / harpoon / spike / kill / lethal language anywhere.
  Generic "trapping" is fine.

---

## Tokens / gates (every page, before push)
- **Backgrounds:** alternate `grass` (`#184241`, ~90%) / `grass-alt`; **gradient only on the last block**;
  no `blue`/`cream` block backgrounds; hero owns the trustStrip (Page Structure Checklist, all 7).
- **Gold `#E68C04` = CTAs only.** Blue/rust only inside the final gradient. Cream text on dark.
- **Fonts:** Lexend Bold (H1/H2 uppercase), Zilla Slab (H3/body).
- **Width:** match the city-LP container widths (not the cramped `max-w-xl` on the CTA).
- **CWV:** hero WebP `fetchpriority="high"`, below-fold lazy, page <1 MB, LCP <2.5s / INP <200ms / CLS <0.1.
- **Conversion:** one primary CTA per viewport; click-to-call in hero + final CTA; global sticky mobile
  bar present; quick form + final form both post to Jobber with GCLID.
- **Humanizer ≥8.5 (deep)** on every new copy line. **US English.** `noindex,nofollow` preserved.
- **Tracking intact:** GTM `GTM-5XLRMCGQ` / GA4 `G-H8ZV2L217D` / CallRail / Conversion Linker still fire
  on `/lp/*` after the change (they live in the root `<body>`, not the component — don't break them).

## Deploy (LP — no CMS)
```
1. edit src/components/LandingPage.tsx (+ any new block/photo wiring)
2. npx next build            # must pass clean
3. git fetch ; check ahead/behind (two machines push to mine/main)
4. git add {those files} ; commit
5. git push mine main        # Vercel staging
6. verify: project-pf8c6.vercel.app/lp/mole-removal/  (+ the other 3)  then got-moles.com
```

## Acceptance criteria
- `/lp/mole-removal/` renders 200, `noindex`, H1 = "Professional Mole Removal in Western Washington".
- Block order = hero → quick form → How-It-Works → testimonials → why-us → guarantee → FAQ → gradient CTA (last).
- Backgrounds alternate grass/grass-alt; gradient only on the last block; before-photo hero present.
- Desktop final CTA form is full-width (no 270px squish); one primary CTA per viewport.
- FAQPage schema validates with **exactly one `FAQPage` node** (block self-emit only; no route `faqSchema` call); reviews render; claim discipline + Posture A clean; humanizer ≥8.5.
- Tracking verified firing on `/lp/` (GA4 Realtime shows pageview + lead event with GCLID).
- All 4 service LPs inherit the rebuild and render correctly with their own props.

## After it ships (ads side — I'll do this, not the website agent)
- Re-enable the paused **"Buyer Intent — Generic"** ad group (`199956583871`) → status ENABLED.
- Confirm its RSA is APPROVED and watch its search-terms report for junk at the next re-check.

---
*Hand to a Got Moles website build window. Parity rebuild — it brings the service LPs onto the proven
city-LP standard; it does not invent a new design. Sign-off: Roy before re-enabling paid traffic.*
