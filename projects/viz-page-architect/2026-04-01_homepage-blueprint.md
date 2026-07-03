---
page: homepage
type: homepage
url: /
date: 2026-04-01
sections: 11
estimated_words: 950-1100
status: draft
primary_keyword: mole control Washington
schema: LocalBusiness + Organization + AggregateRating
primary_cta: Call (253) 750-0211 / Get a Free Quote
micro_conversion_stages: 1-3 (scroll, click, form/call)
---

# Homepage Blueprint — Got Moles

The front door. Answers five questions in five seconds: Who is this for? What outcome do I get? Why is this different? What proof exists? What do I do next?

**ICP on arrival:** Jennifer (42) searched "mole removal Sammamish" on her phone. She's frustrated. She's tried DIY traps and a pest company. She wants someone who'll just handle it. She'll scan this page for 5 seconds and decide whether to scroll or hit back.

**Design system reference:** `brand_context/design-system.md`. All spacing, typography, and color tokens reference the approved system.

---

## Section 1: Sticky Header

**Job:** Persistent navigation with always-visible primary CTA. Never more than one tap from calling.

**Content requirements:**
- Skip navigation link: `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>` (accessibility, keyboard users)
- Logo (GOT MOLES?™ primary) left-aligned, max-width 200px
- Phone number visible on desktop: (253) 750-0211
- "Get a Free Quote" Gold button right-aligned (desktop)
- Hamburger menu on mobile (nav links collapse)
- Nav items (5 max): How It Works, Services, About, Service Areas, Contact
- Estimated words: 10-15 (nav labels only)

**CTA strategy:** Primary. Gold button always visible. On mobile, the header shows logo + hamburger only. The click-to-call sticky bar at the bottom handles the CTA.

**Social proof:** None. Clean utility.

**Conversion principle:** Distraction removal. Five nav items max. No dropdown menus on mobile.

**Mobile considerations:**
- Height: 56px max (preserves content space)
- Sticky on scroll. Transparent initially, fills with Grass-700 on scroll
- Hamburger right-aligned. Logo left. No phone number visible (sticky CTA bar handles it)

**Image direction:**
- Logo only. GOT MOLES?™ primary logo in Cream on dark background
- SVG format for crisp rendering at all sizes
- Gate check: N/A (logo, not a selected image)

**Design system references:**
- Height: `--header-height: 56px`
- Background: `--grass-700` on scroll, transparent initially
- Button: Gold CTA per button system (14px Lexend, uppercase, sharp corners)
- Z-index: above all content

---

## Section 2: Hero

**Job:** Answer the five questions. Earn the scroll. Jennifer decides in 5 seconds if this is for her.

**Content requirements:**
- H1: "YOUR LAWN DESERVES BETTER THAN MOLES. WE MAKE SURE IT GETS IT." (uppercase Lexend Bold, display size)
- Subheadline: "Western Washington's mole-exclusive specialist. No chemicals. No guesswork. Just results. Guaranteed, or you don't pay." (Zilla Slab Regular, body-lg)
- Primary CTA: Gold button "CALL (253) 750-0211"
- Secondary CTA: Cream outline button "SEE HOW IT WORKS"
- GEO opening paragraph positioned as meta/BLUF content (visible to crawlers, styled as lead text above the H1 or in meta): "Got Moles is a veteran-owned mole control specialist serving Western Washington since 2017..."
- Estimated words: 40-60

**CTA strategy:** Primary. One Gold button (call). One secondary outline button (how it works). No other clickable elements in the hero.

**Social proof:** Micro-proof line below CTAs: "★★★★★ 219+ Five-Star Google Reviews"

**Conversion principle:** Relevance + Clarity. Jennifer reads "mole-exclusive specialist" and "guaranteed" and knows this is different from the pest company that failed her.

**Mobile considerations:**
- H1 scales to 32px (clamp). Subheadline to 16px.
- Both CTAs stack vertically, full-width
- Click-to-call button first (primary), "See How It Works" second
- Hero image crops or hides. Text and CTAs visible without scrolling.
- Micro-proof line visible without scrolling

**Image direction:**
- **What:** Clean, healthy lawn in Western Washington with subtle mole hill evidence. OR Spencer/Corey in the field checking traps on a real property. Real photography, not stock.
- **Source:** Pending from Spencer. If unavailable at build time, use a clean lawn landscape photo with brand overlay. Add to shot list: "Spencer or Corey on a residential property, kneeling near trap equipment, natural light, professional casual."
- **Treatment:** Full-bleed background. Semi-opaque Grass overlay panel behind text (not full-image dim). Text sits on solid/semi-solid panel for max readability and faster LCP than a dimmed photo approach.
- **Crop:** 16:9 desktop. Content positioned so text panel occupies left 60%. Mobile: image becomes subtle background or hides entirely. Text and CTAs take priority.
- **Performance:** This is the LCP element. Preloaded with `fetchpriority="high"`. WebP format. Responsive srcset (400w, 800w, 1200w, 1600w). NEVER lazy-loaded. Target: under 150KB above-fold.
- **Alt text:** Decorative (alt="") since the H1 carries the page message.
- **Three-Gate Validation:**
  - Gate 1 (ICP): Would Jennifer see "this is for someone like me"? YES. A real yard in the PNW, or real techs on a property. She recognizes her world.
  - Gate 2 (Positioning): Does this match "The Mole Specialist"? YES. Field work on a residential property signals hands-on expertise. Not a call center. Not a franchise.
  - Gate 3 (Section Job): Does this serve "answer the five questions"? YES. The visual context (yard, techs, traps) immediately communicates "mole control" before a word is read.
  - Result: USE.

**Design system references:**
- Background: `--grass-600` overlay panel on image
- H1: `--text-display`, `--font-heading`, uppercase, `--tracking-tight`
- Subheadline: `--text-body-lg`, `--font-body`
- Text color: `--cream-200`
- Primary button: Gold CTA system
- Secondary button: Cream outline system
- Section padding: `--space-32` top (128px, hero breathing room), `--section-padding` bottom

---

## Section 3: Trust Bar

**Job:** Borrow credibility before Jennifer invests attention. She glances at this in 1 second.

**Content requirements:**
- 4 stat columns:
  - "9" / "YRS IN BUSINESS"
  - "5,000+" / "CLIENTS SERVED"
  - "219+" / "5-STAR REVIEWS"
  - "GUARANTEED" / "RESULTS"
- No explanatory text. Numbers speak.
- Estimated words: 12-15

**CTA strategy:** None. Pure credibility.

**Social proof:** This IS the social proof. Metrics only. No logos needed for a local service business.

**Conversion principle:** Anxiety reduction. "Nearly 5,000 people already trusted them. 219 gave them 5 stars. I'm not the guinea pig."

**Mobile considerations:**
- 2x2 grid with `--space-6` (24px) gap
- Numbers scale down but remain prominent: clamp(1.5rem, 3vw, 2.5rem)
- Full viewport width (edge-to-edge)

**Image direction:**
- None. Numbers are the visual. Clean typography is the design element.
- Optional: small icons (shield, star, calendar, checkmark) in Gold above each number. SVG, 24px. Only if they add clarity, not decoration.

**Design system references:**
- Background: `--blue-600` (alternate dark surface, creates rhythm break from hero)
- Numbers: `--font-heading`, `--weight-bold`, `--cream-200`
- Labels: `--font-body`, `--text-small`, `--cream-200` at 65% opacity, uppercase, `--tracking-wide`
- Section padding: `--space-12` (48px) vertical (compact bar, not a full section)

---

## Section 4: The Problem

**Job:** Show Jennifer you understand her world better than she can describe it. Earn trust through empathy before selling anything.

**Content requirements:**
- H2: "YOU'VE TRIED EVERYTHING. THE MOLES KEEP WINNING." (uppercase Lexend)
- Gold divider (48px x 3px)
- Body copy: 3 paragraphs of pain articulation. Stomping down mounds. Hardware store traps. The pest company that failed. The moles came back. The lawn she spent $15,000 maintaining. ~120 words.
- Concrete details in her language. Not clinical. Not vague empathy.
- This section uses Phase 3 copy from `copy-homepage.md` Section 3.
- Estimated words: 100-130

**CTA strategy:** None. This section earns trust, not clicks.

**Social proof:** None. Pure empathy. Proof comes after the solution.

**Conversion principle:** Relevance. "This person understands my exact situation. They've talked to people like me before."

**Mobile considerations:**
- Full width. No columns. Text stacked.
- Generous line height (1.6) for reading comfort
- Max-width: 65ch for text container

**Image direction:**
- **What:** No hero image for this section. Let the words do the work. Whitespace is the visual.
- **Alternative:** Subtle background. Grass-600 with slightly lighter text area. No photos of "damage" or "frustration." Those are stock cliches.
- **Three-Gate Validation:** N/A. No image recommended. Absence of imagery creates contrast with the image-rich hero and solution sections.

**Design system references:**
- Background: `--grass-600` (returns to primary after Blue trust bar)
- H2: `--text-h2`, `--font-heading`, uppercase, `--tracking-tight`, `--cream-200`
- Divider: `--divider-width`, `--divider-height`, `--divider-color`
- Body: `--text-body`, `--font-body`, `--cream-200`, max-width `--text-max-width`
- Section padding: `--section-padding` (clamp 48-96px)

---

## Section 5: Services Overview

**Job:** Show Jennifer how Got Moles solves her problem. Three clear options. She self-selects.

**Content requirements:**
- H2: "ONE PROBLEM. THREE WAYS WE SOLVE IT." (uppercase Lexend)
- Gold divider
- 3 service cards in a row (stacked on mobile):
  - **Card 1: Year-Round Protection** — "$100/month. Our Total Mole Control Program keeps your yard protected all year. Regular visits, immediate response, a report after every check." CTA: "Learn About the TMCP" (text link)
  - **Card 2: One-Time Removal** — "$450 flat rate. A focused, one-month eradication program. 4-5 weekly visits. If we don't catch a mole, you only pay the $150 setup fee." CTA: "Learn About One-Time Removal" (text link)
  - **Card 3: Commercial** — "Custom quote. Annual contracts for property managers, HOAs, sports facilities, and commercial grounds." CTA: "Learn About Commercial" (text link)
- Uses Phase 3 copy from `copy-homepage.md` Section 4.
- Estimated words: 120-150

**CTA strategy:** Secondary. Text links on each card pointing to service pages. No Gold buttons here. Cards themselves are clickable.

**Social proof:** None. The pricing transparency IS the trust signal. Showing real numbers says "we have nothing to hide."

**Conversion principle:** Clarity. "Now I understand what they offer and what it costs. I can choose the right option for me."

**Mobile considerations:**
- Cards stack vertically, full-width
- Card order: TMCP first (highest value), One-Time second, Commercial third
- Each card: title, price, 2-3 lines, text link. Tap the entire card.
- Internal padding: `--space-6` (24px)

**Image direction:**
- **What:** Icons for each service type. Simple, consistent line-art style in Gold on Grass background. Calendar/shield icon for TMCP. Checkmark icon for One-Time. Building icon for Commercial.
- **Source:** SVG icons, custom or from a consistent icon set. Not clip-art. Not emoji.
- **Treatment:** Gold (#E68C04) stroke on Grass (#184241) card backgrounds. 48px icon size. Centered above card title.
- **Three-Gate Validation:**
  - Gate 1 (ICP): Icons help Jennifer scan and self-select quickly. YES.
  - Gate 2 (Positioning): Clean, professional icons signal specialist. Not a cluttered generalist page. YES.
  - Gate 3 (Section Job): Icons help differentiate the three options at a glance. YES.
  - Result: USE.

**Design system references:**
- Background: `--cream-50` (light section. Visual breathing room. Contrast from dark sections.)
- Cards: white background, `--color-border-light` border, `--space-6` padding
- H2: `--text-h2`, `--font-heading`, `--neutral-800`
- Card titles: `--text-h4`, `--font-body`, `--weight-semibold`, `--neutral-800`
- Card body: `--text-body`, `--font-body`, `--neutral-600`
- Card links: Gold text, `--weight-semibold`
- Grid: 3 columns desktop (`grid-template-columns: repeat(3, 1fr)`), single column mobile
- Section padding: `--section-padding`

---

## Section 6: How It Works

**Job:** Demystify the process. Make it feel simple. Jennifer needs to know that calling Got Moles won't become another project she has to manage.

**Content requirements:**
- H2: "FROM FIRST CALL TO MOLE-FREE YARD" (uppercase Lexend)
- Gold divider
- 4 steps in a row (numbered, stacked on mobile):
  - **01 — You Call Us.** "Tell us what's happening. We'll schedule an inspection. Usually within 2 business days."
  - **02 — We Inspect.** "A Got Moles technician walks your entire yard, identifies active runs, and builds a strategy specific to your property."
  - **03 — We Get to Work.** "Professional-grade equipment on active tunnels. Weekly visits to check and adjust. You don't have to do a thing."
  - **04 — You See Results.** "After every visit, a clear report. What we found. What we did. You always know what's happening."
- Primary CTA below the steps: Gold button "CALL (253) 750-0211"
- Uses Phase 3 copy from `copy-homepage.md` Section 5.
- Estimated words: 100-130

**CTA strategy:** Primary. After demystifying the process, Jennifer is ready to act. The Gold CTA here is a natural conversion point.

**Social proof:** None. The simplicity of 4 clear steps IS the persuasion.

**Conversion principle:** Clarity + Anxiety reduction. "This isn't complicated. They handle everything. I just call."

**Mobile considerations:**
- Steps stack vertically with large step numbers (Gold, Lexend Bold)
- CTA full-width below the steps
- Step numbers: 48px+ font size in Gold for visual rhythm

**Image direction:**
- **What:** Step numbers (01, 02, 03, 04) in large Gold typography ARE the visual element. No photos needed. The numbered sequence creates its own visual rhythm.
- **Alternative:** Small icons per step (phone, magnifying glass, wrench, clipboard). Same Gold line-art style as service cards. 32px. Only if they add clarity.
- **Three-Gate Validation:** N/A for typography-as-visual. If icons used:
  - Gate 1: Simple icons help Jennifer scan the process quickly. YES.
  - Gate 2: Consistent icon style signals professionalism. YES.
  - Gate 3: Each icon maps to its step's action. YES.
  - Result: USE (optional).

**Design system references:**
- Background: `--grass-600` (back to primary dark)
- Step numbers: `--font-heading`, `--gold-500`, large size (clamp 2-3.5rem)
- Step titles: `--text-h4`, `--font-body`, `--weight-semibold`, `--cream-200`
- Step body: `--text-body`, `--font-body`, `--cream-200`
- White dividers between steps: 1px, cream at 10% opacity (from ScoreApp pattern)
- Layout: 4-column desktop, single-column mobile
- Section padding: `--section-padding`

---

## Section 7: Why Got Moles

**Job:** Differentiate from competitors. This is where "specialist vs generalist" crystallizes.

**Content requirements:**
- H2: "WHY HOMEOWNERS CHOOSE GOT MOLES" (uppercase Lexend)
- Gold divider
- 4 differentiator blocks (2x2 grid desktop):
  - **Moles Are All We Do.** "We don't spray for ants. We don't chase rats. We do one thing and we've built our entire company around doing it better than anyone."
  - **Veteran-Owned. Community-Built.** "Spencer Hill founded Got Moles in 2017 after serving in the US Army. We live and work in the same neighborhoods we protect."
  - **You See Your Results.** "After every visit, you get a report showing exactly what happened. Moles caught? You'll know."
  - **Guaranteed.** "Our one-time removal program comes with a guarantee: if we don't catch a mole, you only pay the $150 setup fee. Our year-round program guarantees we respond to any new activity between visits at no extra charge."
- Uses Phase 3 copy from `copy-homepage.md` Section 6.
- Estimated words: 120-150

**CTA strategy:** None. The differentiators build conviction. The next section (testimonials) provides proof. CTA comes after proof.

**Social proof:** Credentials embedded in copy (Army veteran, 2017 founding, guarantee terms). Not a separate element.

**Conversion principle:** Relevance + Clarity. "This is different from every pest company I've called before. These people ONLY do moles."

**Mobile considerations:**
- 4 blocks stack vertically, single column
- Each block: bold title + 2-3 sentence body
- Gold accent (small icon or left border) to visually separate blocks

**Image direction:**
- **What:** No photos in this section. The copy does the work. Optional: small Gold icons per differentiator (target/crosshair for "moles only", shield for "veteran", chart for "results", checkmark for "guaranteed"). Same consistent icon set.
- **Source:** SVG, Gold stroke, 32px.
- **Three-Gate Validation:**
  - Gate 1: Icons help Jennifer scan differentiators quickly. YES.
  - Gate 2: Professional, restrained icons match Specialist Signal. YES.
  - Gate 3: Each icon maps to its differentiator's core idea. YES.
  - Result: USE (optional accent).

**Design system references:**
- Background: `--blue-600` (alternate dark surface, creates rhythm)
- Blocks: no border, subtle cream left accent or Gold icon
- H2: `--text-h2`, `--font-heading`, uppercase, `--cream-200`
- Block titles: `--text-h4`, `--font-body`, `--weight-semibold`, `--cream-200`
- Block body: `--text-body`, `--font-body`, `--cream-200`
- Grid: 2x2 desktop, single column mobile
- Section padding: `--section-padding`

---

## Section 8: Testimonials

**Job:** Remove doubt with specific evidence from people like Jennifer. This is the decision point. She's considering calling. Proof tips her over.

**Layout: Featured + Supporting (1 + 2 pattern)**

The section uses a two-tier layout that gives visual weight to one standout review while covering multiple ICP concerns:

1. **Featured review** — large centered blockquote, full visual treatment (stars, oversized gold quote mark, name + city). This is the "hero" testimonial with the most compelling specific detail.
2. **Two supporting reviews** — lighter treatment in a 2-column grid below. Gold left border, smaller text, no stars or quote mark. These cover different objections without competing with the featured review.

This pattern preserves Moni's clean single-blockquote design while meeting CRO evidence density (3 voices > 1) and GEO extractable-fact requirements.

**Content requirements:**
- H2: "WHAT OUR CUSTOMERS SAY" (uppercase Lexend)
- **Featured review (centered, large):**
  - ★★★★★ stars (5x Gold, 20px)
  - Gold quotation mark accent (") — 48px, `--gold-500`
  - Review text — `--text-body-lg`, italic, `--cream-200`
  - Customer full name + city/suburb
  - Currently: Brian Wozeniak, Tacoma — "27 moles removed since 2022" (effectiveness + numbers)
- **Two supporting reviews (2-col grid below):**
  - Gold left border (2px, `--gold-500` at 40% opacity)
  - Review text — `--text-body`, italic, `--cream-200` at 80%
  - Customer first name or full name + city
  - Currently: Sabra B., Seattle — tried-everything story (DIY failure → Got Moles success)
  - Currently: Christina McDougall, Seattle — 22-year loyalty story (ongoing protection)
- Each review addresses a different concern: effectiveness, tried-everything, ongoing protection
- Source: Spencer's ranked Google reviews (183 reviews, 3 GBP locations)
- "See All 219+ Reviews" text link to /reviews/ page, centered below both tiers
- Estimated words: 120-150

**CTA strategy:** None. Let the proof land. The CTA comes in the next section.

**Social proof:** This IS the proof section. Real reviews with real names and locations. Three voices from different situations create a pattern that's harder to dismiss than a single data point.

**Conversion principle:** Anxiety reduction. "Three different people — one with 5 acres, one who tried everything, one who's been a customer for 22 years — all chose Got Moles. They're like me."

**Mobile considerations:**
- Featured review: full-width, centered. Stars + quote mark + text + attribution stacked vertically.
- Supporting reviews: stack to single column on mobile (2-col on md+). Gold left border preserved.
- NOT a carousel. All 3 visible on scroll. (Design principle: no hidden content)
- Featured review has generous bottom margin (`mb-14`) before supporting grid begins.
- Supporting reviews are visually quieter — reader's eye naturally goes to the featured review first, then discovers the supporting evidence on scroll.

**Image direction:**
- **What:** No customer photos needed (Google reviews don't typically include headshots). The review content and real names/locations carry the trust.
- **Optional:** If Spencer can provide customer photos with permission, circular crop (64px), next to attribution. Real faces only. Never stock. Never AI-generated.
- **Three-Gate Validation:**
  - Gate 1: Real names + WA cities = "someone in my area." YES.
  - Gate 2: Unadorned Google reviews match Specialist Signal. Featured review gets drama; supporting reviews stay understated. YES.
  - Gate 3: Section job is "remove doubt." Three named reviews with specific details serve this better than one. YES.
  - Result: USE text reviews. 1 featured + 2 supporting. Photos optional if available.

**Design system references:**
- Background: gradient `--grass-600` to `--grass-600` via darker mid (matches adjacent sections)
- Featured review: centered, max-width 2xl (672px)
- Supporting grid: max-width 3xl (768px), 2-col on md+, gap-6
- Quotation mark (featured only): `--gold-500`, `--font-heading`, 48px
- Featured text: `--text-body-lg`, `--font-body`, `--cream-200`, italic
- Supporting text: `--text-body`, `--font-body`, `--cream-200` at 80%, italic
- Supporting border: 2px left, `--gold-500` at 40% opacity, padding-left 20px
- Attribution (featured): `--text-sm`, font-semibold, `--cream-200`
- Attribution (supporting): `--text-sm`, font-semibold, `--cream-200` at 90%, city at 50%
- Star rating (featured only): Gold (#E68C04) stars, 20px
- Grid: 3 columns desktop, single column mobile
- Section padding: `--section-padding`

---

## Section 9: Service Area

**Job:** Confirm Got Moles serves Jennifer's city. She searched "[city] mole removal." This section closes the geographic relevance loop.

**Content requirements:**
- H2: "SERVING 70+ COMMUNITIES ACROSS WESTERN WASHINGTON" (uppercase Lexend)
- Gold divider
- City grid: 12-16 priority cities as clickable links to city pages. Each city name links to `/mole-control-{city}/`
- Priority cities: Sammamish, Bellevue, Kirkland, Seattle, Tacoma, Puyallup, Auburn, Federal Way, Renton, Kent, Issaquah, Enumclaw
- "See All Service Areas" text link to /service-areas/
- Counties mentioned: King, Pierce, Thurston, Snohomish
- Estimated words: 40-60

**CTA strategy:** Secondary. City links and "See All Service Areas" are navigational. Not conversion CTAs.

**Social proof:** None. Geographic coverage IS the proof for this section.

**Conversion principle:** Relevance. "They serve my area. This is local."

**Mobile considerations:**
- City names in a 2-column grid or a flow layout (pills/tags)
- Tap target: entire city name area, minimum 48px height
- "See All" link prominent at bottom

**Image direction:**
- **What:** No map image. City names as styled text links create the visual. Optional: a subtle background outline of Western Washington counties in Cream at 5% opacity. Not an interactive map (performance cost, mobile complexity).
- **Three-Gate Validation:** N/A for text-based layout. If map used:
  - Gate 1: Jennifer scans for her city name. Text is faster than finding a pin on a map. TEXT > MAP.
  - Result: Text grid. No map.

**Design system references:**
- Background: `--cream-50` (light section for contrast)
- H2: `--text-h2`, `--font-heading`, uppercase, `--neutral-800`
- City links: `--text-body`, `--font-body`, `--weight-semibold`. Default: `--neutral-700`. Hover: `--gold-500`
- Grid: 4 columns desktop, 2 columns mobile
- Section padding: `--section-padding`

---

## Section 10: Final CTA

**Job:** Close the page with one clear action. Jennifer has scrolled past problem, solution, proof, process, differentiators, and testimonials. She's ready. Make it easy.

**Content requirements:**
- H2: "READY TO TAKE YOUR YARD BACK?" (uppercase Lexend)
- Body: "Call us at (253) 750-0211 or fill out the form below. We'll get back to you within one business day." (Zilla Slab)
- Gold CTA button: "CALL (253) 750-0211"
- Simple form below: Name, Phone, Zip Code, "How can we help?" dropdown
- Form: 4 fields max. Large inputs. Gold submit button: **"REQUEST FREE INSPECTION"** (not "Submit")
- Guarantee line below form: **"Every service comes with a guarantee. We stand behind our results."**
- Friction reducer below guarantee: "Free inspection. No obligation. We'll call you back within one business day."
- Estimated words: 50-70

**CTA strategy:** Primary. Two paths: call (instant) or form (low-friction). Both equally prominent.

**Social proof:** **"Join 5,000+ homeowners who chose Got Moles."** (Required. Not optional. Place above the form.)

**Conversion principle:** Clarity + Anxiety reduction. "The next step is easy. No commitment. Just a conversation."

**Mobile considerations:**
- Phone number as click-to-call link (prominent)
- Form fields stack full-width. Large touch targets (48px+ height)
- Gold submit button full-width
- Friction reducer text visible without scrolling past the form

**Image direction:**
- None. Clean form on gradient background. The visual simplicity signals "this is easy."

**Design system references:**
- Background: `--gradient-cta-section` (linear-gradient from Blue #182034 to Rust #8F2A2D). This is the ONLY place Rust appears.
- H2: `--text-h2`, `--font-heading`, uppercase, `--cream-200`
- Body: `--text-body-lg`, `--font-body`, `--cream-200`
- Form: white card on gradient background, `--space-6` padding, `--space-3` gaps between fields
- Input borders: `--neutral-200`. Focus: `--gold-500` 2px border
- Submit button: Gold CTA system, full-width on mobile
- Section padding: `--section-padding-lg` (extra breathing room for the final push)

---

## Section 11: Footer

**Job:** Provide navigation, contact info, and legal links. Utility, not persuasion.

**Content requirements:**
- Logo (GOT MOLES?™) in Cream
- Phone: (253) 750-0211 (clickable)
- Email: [Spencer's email, TBD]
- Service area summary: "Serving King, Pierce, Thurston & Snohomish Counties"
- Secondary nav: How It Works, Services, About, Service Areas, FAQ, Contact, Reviews, Blog
- Social links: Google Business Profile, Facebook, Nextdoor (if applicable)
- Legal: Privacy Policy, Terms of Service
- Copyright: "© 2026 Got Moles. All rights reserved. Veteran-Owned."
- Estimated words: 40-60

**CTA strategy:** None. The footer is closure, not conversion.

**Social proof:** None.

**Conversion principle:** Distraction removal. Clean closure.

**Mobile considerations:**
- Single column. Logo top. Contact info. Nav links stacked. Legal at bottom.
- Phone and email as clickable links (tap-to-call, tap-to-email)
- Social icons in a horizontal row, 48px touch targets

**Image direction:**
- Logo only. Cream variant on dark background. Mole skull illustration as subtle background element at 5% opacity (optional, brand personality touch).

**Design system references:**
- Background: `--grass-800` (#0E2A28, darkest surface)
- Text: `--cream-200` for primary, `--cream-200` at 65% opacity for secondary
- Links: `--cream-200`, hover: `--gold-500`
- Section padding: `--space-16` (64px) top, `--space-12` (48px) bottom
- Border top: 1px `--cream-200` at 10% opacity (subtle separation from final CTA)

---

## Section 12: Mobile Sticky CTA Bar

**Job:** Persistent click-to-call on mobile. Jennifer should never have to scroll to find the phone number.

**Content requirements:**
- Phone icon + "CALL (253) 750-0211"
- Full viewport width
- Appears after scrolling past the hero (not visible when hero CTA is in view)

**CTA strategy:** Primary. Always present. Always one tap.

**Social proof:** None.

**Conversion principle:** Distraction removal. The primary action is always within thumb reach.

**Mobile considerations:**
- Fixed to bottom of viewport
- Height: 56px
- Above the browser's bottom chrome
- Disappears if form section is in view (prevent doubling of CTA)

**Design system references:**
- Background: `--gold-500`
- Text: `--blue-600`, `--font-heading`, `--weight-bold`, 14px, uppercase
- Height: 56px
- Z-index: above content, below modal/overlay
- Shadow: subtle upward shadow for elevation

---

## User Journey Context

### Entry Points

| Source | % Est. | Emotional state | What they need first |
|--------|--------|-----------------|---------------------|
| Google (local search) | 50-60% | Problem-aware, intent-driven | Confirmation this is a specialist, not a generalist |
| Google Ads | 15-20% | High intent, ad-aware | Message match with ad copy. Proof. Easy CTA. |
| Referral/word of mouth | 10-15% | Trust transferred from referrer | Confirmation of what they were told |
| Nextdoor/community | 5-10% | Curious, community-influenced | Local credibility, reviews from neighbors |
| Direct (typed URL) | 5% | Returning or high-intent | Clear navigation to what they came for |

### Exit Paths

| Priority | Destination | Trigger |
|----------|-------------|---------|
| **Primary** | Phone call (253) 750-0211 | Gold CTA buttons, sticky bar |
| **Primary** | /contact/ (form submission) | Final CTA form, header button |
| Secondary | /services/total-mole-control-program/ | TMCP service card |
| Secondary | /services/one-time-mole-removal/ | One-Time service card |
| Secondary | /how-it-works/ | "See How It Works" hero button |
| Tertiary | /mole-control-{city}/ | City links in service area section |
| Tertiary | /reviews/ | "See All 219+ Reviews" link |

### Internal Linking Strategy

- **Forward links from homepage:** /how-it-works/, /services/total-mole-control-program/, /services/one-time-mole-removal/, /services/commercial-mole-control/, /service-areas/, /contact/, /reviews/
- **Inbound links to homepage:** Every page nav, breadcrumbs, footer logo
- **No dead ends:** Every section either has a link forward or the next section carries the visitor deeper

### Cross-Page Dependencies

- City pages must exist before service area grid links work. Build city template (task 4.9) before homepage goes live.
- Reviews page must exist before "See All Reviews" link works. Can be a simple page pulling Google reviews.
- Service pages (TMCP, One-Time, Commercial) must exist before service cards link through.

---

## Navigation Strategy

### Primary Nav (5 items)

| Position | Label | Links to | Mobile |
|----------|-------|----------|--------|
| 1 | How It Works | /how-it-works/ | In hamburger |
| 2 | Services | /services/ (or dropdown: TMCP, One-Time, Commercial) | In hamburger |
| 3 | About | /about/ | In hamburger |
| 4 | Service Areas | /service-areas/ | In hamburger |
| 5 | Contact | /contact/ | In hamburger |

**Desktop:** Horizontal links in header. "Get a Free Quote" Gold button far right. Phone number visible.

**Mobile:** Hamburger menu. Logo left. Gold button visible only as sticky bottom bar.

**Sticky behavior:** Header becomes sticky on scroll. Background transitions from transparent to `--grass-700`. Logo shrinks slightly. Nav items remain visible on desktop. Phone number condenses to icon on smaller desktops.

### Footer Nav

Secondary links: How It Works, Services (TMCP, One-Time, Commercial), About, Service Areas, FAQ, Contact, Reviews, Blog

### Breadcrumbs

Not on homepage (homepage IS the root). All other pages get breadcrumbs: Home > [Section] > [Page].

---

## SEO Requirements

| Element | Value |
|---------|-------|
| H1 | YOUR LAWN DESERVES BETTER THAN MOLES. WE MAKE SURE IT GETS IT. |
| Meta title | Got Moles \| Washington's Mole Control Specialist — Veteran-Owned, Guaranteed Results |
| Meta description | Got Moles is Western Washington's mole-exclusive specialist. Chemical-free, guaranteed results. Nearly 5,000 clients served since 2017. Call (253) 750-0211. |
| Schema | LocalBusiness + Organization + AggregateRating (triple stack) |
| Primary keyword | mole control Washington |
| Secondary keywords | mole exterminator near me, best mole exterminator, mole trapping near me |
| OG image | Hero image (1200x630 crop) |
| Canonical | https://got-moles.com/ |

### GEO Requirements

- BLUF opening paragraph in first 30% of content (GEO opening paragraph from copy)
- Question-format H2s matching user queries ("You've Tried Everything" maps to "why don't DIY mole traps work")
- Specific, citable statistics throughout (5,000 clients, 219 reviews, 9 years, $450, $100/month)
- Named entities with credentials (Spencer Hill, US Army veteran, founder 2017)
- FAQ section on homepage links to full /faq/ page with FAQPage schema

---

## Summary

| Section | Job | Surface | CTA |
|---------|-----|---------|-----|
| 1. Sticky Header | Navigation + persistent CTA | Grass-700 | Gold button |
| 2. Hero | Answer 5 questions in 5 seconds | Grass-600 + image | Primary (call) + Secondary |
| 3. Trust Bar | Borrow credibility | Blue-600 | None |
| 4. Problem | Show understanding | Grass-600 | None |
| 5. Services | Self-selection | Cream-50 | Secondary (card links) |
| 6. How It Works | Demystify process | Grass-600 | Primary (call) |
| 7. Why Got Moles | Differentiate | Blue-600 | None |
| 8. Testimonials | Remove doubt | Grass-600 | None |
| 9. Service Area | Confirm geography | Cream-50 | Secondary (city links) |
| 10. Final CTA | Close | Blue→Rust gradient | Primary (call + form) |
| 11. Footer | Utility | Grass-800 | None |
| 12. Mobile Sticky | Persistent call CTA | Gold | Primary (call) |

**Section rhythm:** Grass → Blue → Grass → Cream → Grass → Blue → Grass → Cream → Gradient → Grass-dark

**Primary CTA appears:** Hero, How It Works, Final CTA, Mobile sticky = 4 touchpoints.
**No viewport has competing CTAs.** Each viewport shows one primary action.

**Total estimated words:** 950-1100 (matches Phase 3 copy)

---

*Generated 2026-04-01. Blueprint for the Got Moles homepage. Read by: mkt-copywriting (section copy), viz-component-library (component specs), production build (implementation). See `brand_context/design-system.md` for token references.*
