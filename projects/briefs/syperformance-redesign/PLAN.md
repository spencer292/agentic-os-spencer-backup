# SYPerformance.net — Full Site Redesign
## Build plan for Claude Code

Drop this file in the project root as `PLAN.md`. Start Claude Code and say:
`Read PLAN.md. Confirm you understand the scope, then start Phase 0.`

---

## 0. CONTEXT — read this before writing any code

**The business:** SYPerformance (syperformance.net) is a Shopify store selling JDM
performance parts for Honda B/K series, Mitsubishi Evo 8/9/X, and BMW/Toyota B58
platforms. Owner is a hands-on fabricator/machinist, not a marketer.

**The critical insight driving this entire redesign:** SY is a **billet parts
manufacturer** currently hiding inside a **generic reseller storefront**. They make
~64 in-house SYPerformance-branded SKUs — billet halfshafts, halfshaft carriers,
single-lobe rockers, billet bellhousings, transfer case block-offs, top-mount and
forward-facing turbo manifolds, HD Vanjen clamps — plus two house sub-brands
(**Synchro Solutionz**, **Comp 1 Clutch**). They also resell other brands' parts.

Right now the site treats a $795 in-house billet rocker set the same as a resold
silicone coupler. That's the core problem. The redesign must make the manufacturing
identity unmissable.

**Where the moat actually is:** drivetrain. Billet halfshafts, halfshaft carriers,
billet cases, LSDs, gearsets, synchros, single-lobe rockers. Turbo manifolds are a
knife fight against Full-Race, ETS, and DOC Race. Drivetrain is where SY has
defensible product and pricing power. **Lead with drivetrain.**

**Who we're beating and what we're stealing from them:**

| Competitor | What they do better | What we copy |
|---|---|---|
| ETS (extremeturbosystems.com) | Product pages that name the exact failure mode solved; customer reviews inline with the customer's turbo setup listed | Product page structure |
| KPower Industries | Radical technical honesty — tells you the frame rail needs notching, tells you why welded tubular manifolds crack | Objection-handling copy blocks |
| DOC Race | Dealer distribution — resold by 5+ storefronts, each a backlink | Dealer/pro program page |
| MFactory | "Lifetime, globally transferable warranty" repeated on every listing | Warranty as a headline feature |
| Full-Race | Editorial authority (cited in MotorTrend buyer's guides) | Press/proof section |

**Who we ignore:** PLM, 1320 Performance, Rev9, EMUSA. $580 turbo kits. We do not
compete on price and the site must never look like we're trying to.

**Known brand/SEO problem:** "SY Performance" collides with **Superformance**
(superformance.com — Shelby Cobra replicas) and with an unrelated Burbank personal
training studio. syperformance.com is documented as a common typo of
superformance.com. Flag this; don't try to solve it in code alone.

---

## 1. STACK & SETUP

This is a **Shopify** store. We are building a **custom theme**, not a headless app.

**Do this first, in order:**

1. Verify Shopify CLI is installed (`shopify version`). If not, install it and walk
   me through auth — I am not a developer, so explain each step in plain language
   and give me the exact command to run.
2. Check what theme the live store is currently running and what Shopify's current
   recommended reference theme is (Dawn, Horizon, or whatever is current as of
   today — **look this up, don't assume from memory**).
3. Pull the live theme down locally so we have a baseline to reference:
   `shopify theme pull`
4. Create a **new unpublished development theme**. All work happens here.
5. `git init`, commit the untouched baseline as the first commit before changing
   anything.
6. Set up `shopify theme dev` so I can preview changes live.

**Ground rules — do not violate these:**

- **Never push to or edit the live/published theme.** Every change goes to the dev
  theme. I will publish manually when I approve it.
- **Never touch checkout templates or checkout.liquid.** Broken checkout = dead
  business.
- **Never bulk-edit products via the Admin API without showing me the diff first.**
  Product data changes get exported to CSV, reviewed by me, then re-imported.
- **Do not install paid apps** without asking. Every app is a monthly bill and a
  page-speed tax.
- Commit at the end of every phase with a clear message. One phase = one commit.
- **Stop at the end of each phase and wait for my approval before starting the
  next.** Show me what changed and what it looks like.

---

## 2. DESIGN DIRECTION

Do **not** build a generic dark e-commerce theme with neon accents. Every JDM parts
site looks like that. We're going the other direction.

**The feel:** a machine shop's spec sheet. Precise, industrial, confident, slightly
cold. Think CNC toolpath documentation and aerospace part drawings — not a street
racing poster.

**Specifics:**
- Near-black or graphite base, not pure `#000`. Aluminum/steel greys as the
  secondary palette. **One** accent color used sparingly, for actions only.
- Typography: a technical sans with real weight range for headings (condensed
  works well for part numbers and specs), and a genuinely readable body face.
  Numbers matter here — horsepower ratings, torque specs, prices. Pick a face with
  tabular figures.
- Heavy use of thin rules, grid lines, and monospace for specs and part numbers.
- Generous whitespace. The product IS the hero — machined aluminum photographs
  beautifully. Let it breathe.
- **No stock photos. No generic "racing" imagery.** Real parts, real shop, real
  cars only.

Read `/mnt/skills/public/frontend-design/SKILL.md` if available before building
components.

**Accessibility is not optional:** contrast ratios must pass WCAG AA, all
interactive elements keyboard-navigable, all product images get real alt text.

---

## PHASE 0 — Audit & inventory

Before designing anything, produce a written audit at `docs/audit.md`:

1. Full sitemap of the current store — every collection, page, template in use.
2. Product inventory export. For each product flag:
   - In-house SYPerformance / Synchro Solutionz / Comp 1 Clutch, or resold
   - Platform (Honda B, Honda K, Evo 8/9, Evo X, B58, universal/fab)
   - Whether the title follows a consistent format (most don't — there's a mix of
     `SYPerformance Honda K Series...`, `SYP Bseries...`, and
     `MITSUBISHI EVO X TOP MOUNT TURBO MANIFOLD V BAND` in all caps)
   - Whether it has a real description or a stub
   - Whether it's permanently discounted (a lot are — $795 struck from $835 etc.)
3. Which Shopify apps are currently installed and what each costs.
4. Current Lighthouse scores (mobile + desktop) for homepage, a collection page,
   and a product page. This is our baseline.
5. Current metafield definitions, if any.

**Output the audit and stop.** Don't start Phase 1 until I've read it.

---

## PHASE 1 — Foundation

1. Fork the reference theme into our custom theme.
2. Build a design token layer — CSS custom properties for color, type scale,
   spacing, radii, borders. Everything downstream references tokens, never
   hardcoded values.
3. Set up typography: load fonts efficiently (`font-display: swap`, preload the
   critical face, subset if possible).
4. Build the base component library as theme snippets:
   - Button (primary / secondary / ghost)
   - Product card
   - Spec table (label / value rows, monospace values)
   - Callout box (for the technical-honesty blocks — see Phase 4)
   - Badge (`MADE IN-HOUSE`, `BUILT TO ORDER`, `IN STOCK`)
5. Rebuild header and footer.

**Header requirements:**
- Logo, platform nav, search, cart
- Fitment selector entry point (built in Phase 3)
- Sticky on scroll, but slim — don't eat mobile viewport

**Footer requirements:**
- Real email capture with a reason to subscribe (new product drops, restocks) —
  not a bare "Subscribe to our emails" box like the current site
- Links to About / Shop Tour, Dealer Program, Tech Articles, Warranty, Lead Times,
  Shipping, Returns, Contact
- Keep the existing policy pages

---

## PHASE 2 — Information architecture

The current nav is broken: `SHOP BY BRAND` and `SHOP BY PRODUCT` both link to the
same `/collections` URL, and individual products (HD Vanjen Clamps, Flex Bellow,
K Billet Bellhousing) sit at the same menu level as entire categories.

**Rebuild the nav platform-first:**

```
SYP BILLET          ← in-house manufacturing, gets top billet
  Drivetrain          Halfshafts, Carriers, Billet Case, Bellhousing,
                      Transfer Case Block-Off, LSD, Gearsets, Shift Selector
  Valvetrain          Single Lobe Rockers (B / K)
  Turbo Manifolds     Honda K, Honda B/D/H, Evo 8/9, Evo X, B58
  Cooling             Intercoolers, Cooling Fab 6061
  Clamps & Hardware   HD Vanjen, Stainless V-Band, Flex Bellows, Titanium

HONDA               B/D/H Series · K Series · (sub-nav by system)
MITSUBISHI EVO      Evo 8/9 · Evo X
BMW / TOYOTA B58
FABRICATION         Pie Cuts, Mandrel Bends, Flanges, Clamps, Titanium Hardware
FORCED INDUCTION    Turbos, Accessories, Boost Controllers, Wastegates/BOV,
                    Intercoolers
BRANDS              Synchro Solutionz · Comp 1 Clutch · [resold brands]
TECH                Articles, Install Guides, Build Gallery
```

Rules:
- Never link a single product from top-level nav. Products live in collections.
- Every collection gets a real intro paragraph — 2–3 sentences of genuine technical
  context, not keyword mush. These are ranking pages.
- Keep the sale/clearance collection but move it out of primary nav.
- Set up 301 redirects for any collection URL that changes. **Do not break existing
  links.** Audit which URLs have inbound links first.

---

## PHASE 3 — Fitment selector (highest-value single feature)

The site currently has **no year/make/model filter**. Every competitor beating them
has one. This is table stakes.

**Approach — build it native, no paid app:**

1. Define product metafields:
   - `custom.platform` (list: Honda B-Series, Honda D-Series, Honda H-Series,
     Honda K-Series, Evo 8/9, Evo X, B58 Gen1, B58 Gen2, S58, B48, Universal)
   - `custom.chassis` (list: EG, EK, DC2, DC5, EP3, FG/FA, A90/A91, F/G Chassis, etc.)
   - `custom.drivetrain` (FWD / AWD / RWD)
   - `custom.hp_rating` (number — max supported horsepower)
   - `custom.build_time` (text — e.g. "Ships in 5-7 business days", "Built to order, 6-8 weeks")
   - `custom.made_in_house` (boolean)
   - `custom.wastegate_compat` (text — for manifolds)
   - `custom.turbo_compat` (text — for manifolds)

2. Build a **platform → chassis → system** selector component. Persist the user's
   selection in `localStorage` and surface it as a dismissible bar sitewide
   ("Shopping for: K-Series / DC5 / AWD — change").

3. Filter collection pages against the selection. Use Shopify's native
   `filter.p.m.custom.*` storefront filters wherever possible before writing
   custom JS.

4. On product pages, show a clear **fits / doesn't fit** state against the saved
   selection.

Bulk-populating these metafields across ~64+ SKUs is a data task, not a code task —
generate the CSV, hand it to me to fill and verify, then import.

---

## PHASE 4 — Product page template (the money page)

Build **two variants**:

### 4A — In-house SYP parts (the hero template)

Structure, top to bottom:

1. **Gallery** — real photos of the machined part. Support multiple angles + video.
   Zoom on hover/tap.
2. **Title / part number / price / variant selector / ATC.** Part number in
   monospace. Price is the price — see the "kill permanent discounting" note below.
3. **Fitment strip** — what it fits, resolved against saved fitment selection.
4. **HP rating and build time**, stated plainly. Don't hide lead times. DOC Race and
   Dc5creations publish 6–8 week build times and it doesn't hurt them — it signals
   real manufacturing.
5. **"Why this part exists"** — the single most important block on the site.
   Structure: *what fails on the stock/cheap part → what we changed → what that
   means for you.* This is the ETS and KPower playbook. Every in-house product needs
   this and it should be a required section in the template, so an empty one looks
   obviously broken.
6. **Spec table** — material, dimensions, tolerances, hardware, wastegate/turbo
   compatibility, torque specs.
7. **"Before you buy" callout** — the honest caveats. What else you need, what might
   need modification, what this won't work with. KPower does this and it kills
   returns and pre-qualifies buyers.
8. **Warranty block** — prominent, repeated on every in-house product.
9. **Install notes / documentation download** if available.
10. **Reviews** with the reviewer's actual setup (platform, turbo, power level).
11. **Complete the build** — cross-sell by what's genuinely required, not by
    algorithm. A halfshaft carrier should surface the matching halfshafts.

### 4B — Resold parts (simplified)

Same shell, fewer required blocks. Vendor logo, fitment, specs, ATC. These pages
exist to complete a build, not to win an argument.

**Kill the permanent discounting.** A large share of in-house SKUs currently show a
struck-through price ($795 from $835, $265 from $295). Perpetual fake urgency on
your own manufactured goods signals you're competing with $580 eBay kits. Set real
prices, hold them, and reserve sale pricing for actual sales.

---

## PHASE 5 — Homepage

Sections in order:

1. **Hero** — a single claim about what SY makes, over real footage or a real part.
   Not a carousel. Not a stock racing photo. One claim, one CTA.
2. **Fitment selector**, immediately below the fold. Let people self-select fast.
3. **Made in-house** — the manufacturing story. Machine shop photos, material,
   process, tolerances. This is what turns a reseller into a brand and it is
   currently 100% absent from the site.
4. **Shop by platform** — Honda K / Honda B / Evo / B58 / Fabrication.
5. **Featured drivetrain** — lead with the moat.
6. **Proof** — customer builds, ETs, dyno sheets, sponsored cars.
7. **Tech articles** — 3 most recent.
8. **Dealer program CTA.**
9. Email capture with a real reason.

---

## PHASE 6 — Trust & proof infrastructure

None of this exists today. All of it is why competitors win.

1. **About / Shop Tour page.** Who runs this, what machines they run, how parts are
   made, where. Photos. This is the highest-ROI page on the entire site and it
   currently doesn't exist.
2. **Build Gallery** — a Shopify metaobject for customer cars. Each entry: photos,
   platform, power, ET/trap or track times, and which SYP parts are on it. Link
   entries back to the products used.
3. **Warranty page.** MFactory's "lifetime, globally transferable" is a marketing
   weapon, not a product feature. Whatever SY can genuinely stand behind, state it
   loudly and repeat it on every in-house product page.
4. **Lead Times page.** Honest per-category build times.
5. **Dealer / Pro Program page** with an application form. DOC Race is resold by
   R44, 5150 AutoSport, Speed Logic, and Patterson — every one of those is shelf
   space and a backlink SY doesn't have. This page is how that starts.
6. **Reviews.** Evaluate Shopify's free native product reviews vs. Judge.me free
   tier. Report cost and page-speed impact before installing anything.

---

## PHASE 7 — SEO

1. **Title standardization.** Normalize every product to:
   `SYPerformance [Platform] [Part] — [Key Spec/Fitment]`
   No ALL CAPS. No inconsistent abbreviations (`SYP` vs `SYPerformance` — pick one
   and use it everywhere). Generate as CSV for my review before importing.
2. **Structured data (JSON-LD):** Product (with price, availability, brand, reviews,
   aggregate rating), Organization, BreadcrumbList, Article on tech posts, FAQPage
   where applicable.
3. **`brand` must be set to SYPerformance** on in-house parts, and to the actual
   vendor on resold parts. Getting this wrong is why Google can't tell they're a
   manufacturer.
4. **Unique meta titles and descriptions** on every collection and product. No
   templated duplicates.
5. **Canonical tags** — Shopify duplicates products across collections by default.
   Verify canonicals are pointing at `/products/` URLs.
6. **Article/blog templates** built and ready. Priority content targets, all of
   which are real searches with weak competition:
   - Why K-series halfshafts fail above [X] hp
   - Single lobe rocker conversion, explained (B and K)
   - K-series synchro failure — causes and fixes
   - Top mount vs forward facing manifolds on K-series
   - Choosing a K-series LSD: helical vs plate
   - B58 6-port manifold runner sizing (1.25 vs 1.5)
   - Evo 8/9 stock placement vs forward facing
   - Billet halfshaft carrier — what problem it solves
7. **Internal linking** — every article links to the relevant products; every
   product page links to relevant articles.
8. **Fix the name collision where code can help:** consistent `SYPerformance`
   one-word usage sitewide, Organization schema with `sameAs` pointing to their
   social profiles, and a `alternateName` for "SY Performance". This mitigates but
   does not solve the Superformance problem — flag that as a business decision.
9. `robots.txt`, `sitemap.xml` sanity check. Verify no important pages are blocked.
10. Redirect map for every changed URL. Verify zero 404s post-launch.

---

## PHASE 8 — Performance

1. Lazy-load below-fold images; never lazy-load the LCP image.
2. Serve responsive images with proper `srcset` and correct dimensions. The current
   site is serving CDN images with `width=533` into cards — verify sizing is right.
3. Defer non-critical JS. Inline critical CSS.
4. Audit every installed app for injected scripts and remove what isn't earning its
   weight.
5. **Target: Lighthouse mobile performance 85+, all Core Web Vitals green.** Report
   against the Phase 0 baseline.

---

## PHASE 9 — Pre-launch checklist

Produce `docs/launch-checklist.md` and walk me through it:

- [ ] Full purchase test on the dev theme — every product type, every payment method
      currently enabled (Apple Pay, Shop Pay, PayPal, Venmo, cards)
- [ ] Mobile tested on real iOS and Android, not just devtools
- [ ] All redirects live and verified
- [ ] Every image has alt text
- [ ] Contact form and dealer application form both deliver
- [ ] Email capture writes to the right list
- [ ] Analytics and GSC still firing
- [ ] Lighthouse scores vs. Phase 0 baseline
- [ ] Multi-currency selector still works (store is configured for global currency)
- [ ] Rollback plan documented — I can revert to the current live theme in one click

---

## HOW TO WORK WITH ME

I build automations with n8n and I know my way around APIs, but **I'm not a coder.**

- Explain what you're doing in plain language before you do it.
- When you need me to run something, give me the exact command.
- When something is a business decision rather than a technical one, stop and ask —
  don't guess. (Pricing, warranty terms, lead times, what to say about the brand.)
- If you hit something that needs a real developer or a paid tool, say so plainly
  rather than building a fragile workaround.
- Don't over-explain things I've already confirmed I understand.

**Start with Phase 0. Show me the audit. Then stop.**
