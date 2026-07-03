---
page: services-hub
type: service-hub
date: 2026-05-19
sections: 9
estimated_words: 1100-1400
primary_keyword: mole control
secondary_keywords: got moles pricing, got moles cost, professional mole removal, chemical free mole control
schema: ServiceCatalog + BreadcrumbList + FAQPage + Speakable
status: draft
---

# Services Hub Blueprint — /services/

## Page Purpose

Hub/index page for Got Moles' three services. Two jobs: (1) help visitors compare services and pick the right one, (2) rank for the "mole control" head term (2,261 vol, currently position 37.8). Secondary function: hallucination correction surface for "got moles pricing" queries where AI providers fabricate prices.

**Page type:** Sub-page (85vh hero, action CTA, `py-12 lg:py-24` section spacing).

**ICP entry state:** Jennifer arrives from Google ("mole control near me" or "got moles pricing"), from the homepage service cards, or from a city page cross-link. She knows she has a mole problem. She may not know Got Moles offers multiple services. She needs to quickly understand which one fits her situation.

---

## Section 1: Hero

**Job:** Confirm this is the right page. Name what Got Moles does and where.

**Content requirements:**
- H1: "MOLE CONTROL SERVICES IN WESTERN WASHINGTON" (Lexend Bold 700, uppercase, `text-display`)
- Subheading: "Got Moles is a mole-exclusive specialist serving Seattle, Tacoma, Bellevue, Sammamish, Puyallup, Renton, and 86 other communities across six counties. Chemical-free. Nearly 5,000 yards reclaimed since 2017."
- Anchor cities named in the first 50 words per seeding rule.
- Estimated words: 40-55

**CTA strategy:** Primary. Gold button "Call (253) 750-0211" with inline arrow icon. One CTA only.

**Social proof:** Trust strip inside hero at bottom.
- "5-Star Rated . Nearly 5,000 Yards Reclaimed . Since 2017 . Veteran-Owned . Safe for Pets & Kids"

**Conversion principle:** Relevance + Clarity. Jennifer confirms "mole control" and "my area" in under 5 seconds.

**Mobile considerations:**
- H1 + CTA above fold on 390px screen.
- Trust strip wraps naturally, centered.
- Phone button is tap-to-call.

**Image direction:**
- **Image:** `hero-team-field.webp` (team working on a residential lawn, professional equipment visible)
- **Three-Gate Validation:**
  - Gate 1 (ICP Recognition): Jennifer sees professionals on a lawn like hers. Passes.
  - Gate 2 (Positioning Match): Specialist team in action, not a generic pest company. Passes.
  - Gate 3 (Section Job Match): Establishes "this is a real mole control company." Passes.
- Treatment: Full-bleed background. Standard sub-page gradient overlay (dark top for header, clear middle, dark bottom for text). `fetchpriority="high"`, never lazy-loaded.
- Alt text: "Got Moles team performing mole control on a residential lawn in Western Washington"

**Design system references:**
- Hero height: `min-h-[85vh]`
- Background: Grass gradient overlay per design-system.md sub-page hero spec
- Typography: `text-display` for H1, `text-body-lg` for subheading
- Trust strip: inside hero, gold stars above flowing inline stats

---

## Section 2: GEO Definition Block

**Job:** AI-citable entity summary. Placed in first 30% of page per GEO strategy.

**Content requirements:**
- Plain text, no heading. One dense paragraph:
- "Got Moles is a veteran-owned, chemical-free mole control company serving Western Washington since 2017. Three service programs: the Total Mole Control Program ($100/month year-round protection), One-Time Mole Removal ($450 flat rate for active infestations), and Commercial Mole Control (custom-quoted annual contracts). Nearly 5,000 residential and commercial properties served across King, Pierce, Snohomish, Thurston, Kitsap, and Lewis Counties. 219+ five-star Google reviews. Last updated May 2026."
- Estimated words: 60-75

**CTA strategy:** None.

**Social proof:** Statistics embedded in copy (5,000 clients, 219+ reviews, 6 counties).

**Conversion principle:** Relevance. AI engines extract this verbatim for citation.

**Mobile considerations:** Full-width text. No special treatment needed.

**Image direction:** None. Text-only utility block.

**Design system references:**
- Background: flat Grass `#184241` (compact utility section, no gradient)
- Typography: `text-body-lg`, `max-w-[65ch]`, `mx-auto`
- Spacing: compact `py-8 lg:py-12` (transitional block, not a full content section)

---

## Section 3: Service Comparison Block (NEW COMPONENT)

**Job:** Help Jennifer pick the right service in one scan. This is the decision engine of the page.

**Content requirements:**
- H2: "WHICH MOLE CONTROL SERVICE IS RIGHT FOR YOU?" (Lexend Bold 700, uppercase)
- HTML comparison table (ServiceComparisonBlock) with 4 columns:

| | Total Mole Control Program | One-Time Mole Removal | Commercial |
|---|---|---|---|
| **Best for** | Recurring mole activity, ongoing protection | Active mole problem, one-time fix | Property managers, HOAs, sports fields, schools |
| **How it works** | Year-round monitoring with regular visits + immediate response | 4-5 week focused trapping campaign | Annual contract, custom schedule |
| **Pricing** | $100/month | $450 flat (includes $150 setup) | Custom quote after inspection |
| **Guarantee** | New activity between visits? We come back at no extra charge | No moles caught? Pay only the $150 setup fee | Defined in contract |
| **Duration** | 12-month initial, then month-to-month | One month | Annual |
| **Reporting** | Written report after every visit | Summary on completion | Scheduled reports per contract |

- Below the table: "Not sure which service fits? Call us at (253) 750-0211. We'll recommend based on your property."
- Each service name in the table header links to its child page.
- Estimated words: 150-200

**CTA strategy:** Secondary. Soft "not sure? call us" line below the table. No competing Gold button here. The table itself routes to child pages.

**Social proof:** None. The table IS the clarity device.

**Conversion principle:** Clarity + Distraction removal. Three options, structured comparison, no guesswork.

**Mobile considerations:**
- Table reformats to stacked cards (one card per service) on mobile.
- Each card: service name (h3), key facts as label-value pairs, Gold "Learn More" link at bottom.
- Cards stack vertically, full-width.
- 48px touch targets on all links.

**Image direction:** None. Data-driven section. Clean typography does the work.

**Design system references:**
- Background: `grass-alt` (tonal shift from GEO block)
- H2: centered (above a grid/table), `text-h2`
- Table: dark semi-transparent rows (`bg-white/5` alternating with `bg-white/3`), no visible borders, cream text, Gold for pricing figures
- Spacing: `py-12 lg:py-24`

---

## Section 4: Residential Services Overview (ImageText)

**Job:** Expand on the two residential services with enough copy to rank for "professional mole removal" and "chemical free mole control."

**Content requirements:**
- H2: "PROFESSIONAL MOLE CONTROL FOR WASHINGTON HOMEOWNERS" (Lexend Bold 700, uppercase)
- Body: 2-3 paragraphs covering:
  - What makes Got Moles different from general pest companies (specialist focus, chemical-free, evidence-based)
  - Brief on the two residential paths: TMCP for ongoing protection, OMP for a one-time active problem
  - Name the anchor cities again naturally: "From Sammamish and Bellevue to Tacoma and Puyallup..."
  - Link to `/how-it-works/` for the detailed process
  - Link to each residential service page inline
- Estimated words: 150-200

**CTA strategy:** Secondary. Inline text links to child pages and `/how-it-works/`.

**Social proof:** One embedded stat: "Nearly 5,000 residential properties cleared since 2017."

**Conversion principle:** Relevance + Clarity. Reinforces specialist positioning for the keyword cluster.

**Mobile considerations:**
- Image stacks above text on mobile.
- Full-width. No side-by-side below 768px.

**Image direction:**
- **Image:** `spencer-probe.webp` (Spencer using a probe on a residential lawn, professional and focused)
- **Three-Gate Validation:**
  - Gate 1 (ICP Recognition): Homeowner lawn, professional at work. Jennifer sees her yard. Passes.
  - Gate 2 (Positioning Match): Specialist methodology visible (probe, not spray). Passes.
  - Gate 3 (Section Job Match): Demonstrates "professional mole control" visually. Passes.
- Position: image right, text left (`imagePosition: 'right'`)
- Treatment: `loading="lazy"`, WebP, descriptive alt text
- Alt text: "Spencer Hill using a mole probe to locate active tunnels on a residential lawn"

**Design system references:**
- Background: `grass`
- Typography: `text-h2` heading (left-aligned, above prose), `text-body-lg` body
- Spacing: `py-12 lg:py-24`
- Image: `fallbackImage: 'spencer-probe'`

---

## Section 5: Commercial Services Overview (ImageText)

**Job:** Address the secondary ICP (property managers). Brief enough that residential visitors skip it. Detailed enough that commercial visitors click through.

**Content requirements:**
- H2: "COMMERCIAL MOLE CONTROL" (Lexend Bold 700, uppercase)
- Body: 1-2 paragraphs covering:
  - Annual contracts for property managers, HOAs, sports facilities, schools, landscaping contractors, hotels
  - Custom-quoted after site inspection
  - Chemical-free (critical for schools and public spaces)
  - Documentation and reporting included
  - Link to `/services/commercial-mole-control/` for full details
- Estimated words: 80-120

**CTA strategy:** Secondary. Inline link to commercial child page + "Request a commercial quote" text link.

**Social proof:** None in body. Commercial proof lives on the child page (case studies).

**Conversion principle:** Relevance. Commercial visitors self-select. Residential visitors move past.

**Mobile considerations:**
- Image stacks above text on mobile.
- Compact section. Does not dominate the scroll.

**Image direction:**
- **Image:** `commercial-grounds.webp` (well-maintained commercial property grounds)
- **Three-Gate Validation:**
  - Gate 1 (ICP Recognition): Property manager sees professional-grade grounds. Passes.
  - Gate 2 (Positioning Match): Commercial scale, not residential. Passes.
  - Gate 3 (Section Job Match): Signals "we handle properties like yours." Passes.
- Position: image left, text right (`imagePosition: 'left'`)
- Treatment: `loading="lazy"`, WebP
- Alt text: "Commercial property grounds protected by Got Moles mole control program"

**Design system references:**
- Background: `grass-alt`
- Typography: `text-h2` heading (left-aligned), `text-body-lg` body
- Spacing: `py-12 lg:py-24`
- Image: `fallbackImage: 'commercial-grounds'`

---

## Section 6: Testimonial

**Job:** Proof at the decision point. Jennifer has seen the services and pricing. Now she needs reassurance from someone like her.

**Content requirements:**
- H2: "WHAT OUR CLIENTS SAY" (Lexend Bold 700, uppercase, centered)
- Featured review: one residential testimonial with specific result, full name, city. Emphasis on "they actually solved it" or "wish we'd called sooner." `text-body-lg`, gold `"` accent.
- Supporting reviews: 2 smaller quotes, `text-body`, lighter text. One residential, one commercial if available.
- "See All 219+ Reviews" link with inline arrow to `/reviews/`
- Estimated words: 80-120

**CTA strategy:** Secondary. "See All 219+ Reviews" text link.

**Social proof:** This IS the proof section. Named testimonials with cities.

**Conversion principle:** Anxiety reduction. "People like me got results from this company."

**Mobile considerations:**
- Featured quote full-width.
- Supporting quotes stack below.
- "See all reviews" link prominent, 48px touch target.

**Image direction:** None. Testimonials are text-driven. Gold quotation marks and stars provide visual accent.

**Design system references:**
- Background: Transitional gradient `linear-gradient(to bottom, #153635, #184241 50%, #153635)`
- Typography: featured `text-body-lg`, supporting `text-body`, heading centered `text-h2`
- No card backgrounds, no borders. Spacing and tonal shifts only.
- Spacing: `py-12 lg:py-24`

---

## Section 7: FAQ

**Job:** Handle the top 5-6 service selection and pricing objections. Schema markup for rich results. AI engines extract Q&A pairs.

**Content requirements:**
- H2: "COMMON QUESTIONS ABOUT MOLE CONTROL SERVICES" (Lexend Bold 700, uppercase, centered)
- Questions (phrased as Jennifer would ask):
  1. "How much does mole control cost?" (surfaces pricing explicitly for AI hallucination correction)
  2. "What is the difference between the Total Mole Control Program and One-Time Mole Removal?"
  3. "Is mole control safe for pets and children?"
  4. "How long does it take to get rid of moles?"
  5. "Do you serve my area?"
  6. "What if the moles come back after treatment?"
- Answers: direct, concise, end with confidence. Embed links to child pages where relevant.
- `generateSchema: true` for FAQPage schema
- Estimated words: 250-350

**CTA strategy:** None within FAQ. The next section handles the close.

**Social proof:** Embedded in answers. "Nearly 5,000 homeowners..." in the cost answer. "219+ five-star reviews" in the trust answer.

**Conversion principle:** Anxiety reduction. Every objection addressed before the final CTA.

**Mobile considerations:**
- Accordion pattern. One question open at a time.
- Touch targets: 48px minimum on expand triggers.

**Image direction:** None. Text-only section.

**Design system references:**
- Background: `grass`
- Typography: `text-h2` heading centered, questions in `text-h4` or Zilla Slab SemiBold, answers in `text-body-lg`
- Spacing: `py-12 lg:py-24`

---

## Section 8: Service Area Snippet

**Job:** Reinforce local relevance. Help city-page SEO by creating hub-to-spoke links.

**Content requirements:**
- H2: "SERVING SIX COUNTIES ACROSS WESTERN WASHINGTON" (Lexend Bold 700, uppercase, centered)
- Brief intro: "Got Moles provides mole control across King, Pierce, Snohomish, Thurston, Kitsap, and Lewis Counties."
- Top 6-8 city links (the anchor cities + a few more): Seattle, Tacoma, Bellevue, Sammamish, Puyallup, Renton, Auburn, Kirkland
- "See all service areas" link to `/service-areas/`
- Estimated words: 40-60

**CTA strategy:** Secondary. "See all service areas" text link.

**Social proof:** None. Geographic coverage is the proof.

**Conversion principle:** Relevance. "They serve my neighborhood."

**Mobile considerations:**
- City links in a 2-column grid.
- "See all service areas" full-width link below.

**Image direction:** None. Compact link section.

**Design system references:**
- Background: flat `grass-alt` (compact utility section)
- Typography: `text-h2` centered, city links in `text-body-lg`
- City links: visible HTML `<a>` tags (SEO requirement per design system)
- Spacing: compact `py-10 lg:py-16`

---

## Section 9: Final CTA (Gradient)

**Job:** Close the page. One clear action. Repeat benefit angle.

**Content requirements:**
- H2: "READY TO TAKE YOUR YARD BACK?" (Lexend Bold 700, uppercase)
- Body: "Call Got Moles today for a free inspection. We'll assess your property, recommend the right service, and start clearing moles within days."
- CTA button: Gold "Call (253) 750-0211"
- Sub-text: "Or call (253) 750-0211 for a free quote."
- Show form: true (name, phone, optional message)
- Estimated words: 30-50

**CTA strategy:** Primary. Gold button + contact form. The only gradient CTA on the page.

**Social proof:** None. Trust was built in sections 6-7.

**Conversion principle:** Clarity + Anxiety reduction. "The next step is easy."

**Mobile considerations:**
- Form full-width, large inputs, Gold submit button in thumb zone.
- Phone number is tap-to-call.

**Image direction:** None. Gradient background provides visual weight.

**Design system references:**
- Background: `gradient` (Blue #182034 to Rust #8F2A2D). Only appears on the final section.
- Typography: `text-h2` heading, `text-body-lg` body
- Form fields: transparent fill, cream/gold outline, 16px radius
- Spacing: `py-12 lg:py-24`

---

## User Journey Context

### Entry Points
1. **Google search:** "mole control", "got moles pricing", "mole control near me" (redirected from GBP or homepage)
2. **Homepage:** Feature grid "One Problem. Three Ways We Solve It" links
3. **City pages:** Cross-link "Learn about our services"
4. **Header nav:** Services dropdown parent link (currently `#services`, needs changing to `/services/`)
5. **Blog posts:** Inline links to service comparison

### Emotional State on Arrival
Jennifer knows she has a mole problem. She is comparing options or looking for pricing. She is skeptical from past failures. She wants clarity, not a sales pitch.

### Exit Paths
- **Primary:** Click through to the right child service page (TMCP, OMP, or Commercial)
- **Secondary:** Call (253) 750-0211 directly from the page
- **Tertiary:** Visit `/how-it-works/` to understand the process
- **Supporting:** `/reviews/` for more proof, `/service-areas/` to confirm coverage

### Internal Linking Strategy
| Direction | Pages | Link Type |
|-----------|-------|-----------|
| Down (hub to child) | TMCP, OMP, Commercial child pages | Table headers, inline copy, comparison block |
| Across | `/how-it-works/`, `/reviews/`, `/service-areas/` | Inline copy, text links |
| Up (from children) | Each child page should link back to /services/ | Breadcrumb + "Compare all services" link |
| Up (from city pages) | City pages link to /services/ | "Learn about our services" inline links |
| Blog cross-links | Monthly-vs-onetime, cost, choosing-company posts | Inline "See our services" links |

### Cross-Page Dependencies
- Header nav: change `url: '#services'` to `url: '/services/'`
- Sitemap: add `/services/` at priority 0.9
- Schema: new `serviceCatalogSchema()` helper in `schema.tsx`
- Breadcrumb: Home > Services
- Each child page breadcrumb: Home > Services > [Service Name]

---

## Navigation Strategy

This page fits the existing nav structure. The "Services" dropdown in the header currently points to `#services` (homepage anchor). Change it to `/services/` as the parent link.

**Dropdown behavior stays the same:** hovering/tapping "Services" opens the dropdown with the three child pages. The parent "Services" link now goes to `/services/` instead of an anchor.

**Breadcrumb:** `Home > Services` (2-item, BreadcrumbList schema).

**No nav structure changes needed.** The page slots into the existing hierarchy.

---

## Schema Plan

```json
{
  "@context": "https://schema.org",
  "@type": "ServiceCatalog",
  "name": "Got Moles Mole Control Services",
  "provider": { "@id": "https://got-moles.com/#organization" },
  "hasService": [
    {
      "@type": "Service",
      "name": "Total Mole Control Program",
      "url": "https://got-moles.com/services/total-mole-control-program/",
      "offers": { "@type": "Offer", "price": "100", "priceCurrency": "USD", "priceSpecification": { "unitText": "month" } }
    },
    {
      "@type": "Service",
      "name": "One-Time Mole Removal",
      "url": "https://got-moles.com/services/one-time-mole-removal/",
      "offers": { "@type": "Offer", "price": "450", "priceCurrency": "USD" }
    },
    {
      "@type": "Service",
      "name": "Commercial Mole Control",
      "url": "https://got-moles.com/services/commercial-mole-control/"
    }
  ]
}
```

Plus: `breadcrumbSchema([{ name: 'Services', url: '/services/' }])` and `faqSchema(faqItems)`.

New schema helper needed: `serviceCatalogSchema()` in `src/lib/schema.tsx`.

---

## Meta Tags

- **Title:** "Mole Control Services | Got Moles | Western Washington"
- **Description:** "Compare Got Moles' mole control services: Total Mole Control Program ($100/mo), One-Time Removal ($450), and Commercial contracts. Chemical-free. 219+ five-star reviews. Serving 6 WA counties."
- **OG Image:** `/images/og-default.webp` (via `buildMetadata` default)

---

## New Component Required

**ServiceComparisonBlock.tsx** — HTML comparison table rendered from block data.

**Why:** The Lexical editor does not support table blocks. This is a custom block that takes structured data (rows and columns) and renders a responsive HTML table with mobile card fallback.

**Block schema (Payload):**
```typescript
{
  slug: 'serviceComparison',
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'background', type: 'select', options: backgrounds },
    { name: 'services', type: 'array', fields: [
      { name: 'name', type: 'text' },
      { name: 'link', type: 'text' },
      { name: 'bestFor', type: 'textarea' },
      { name: 'howItWorks', type: 'textarea' },
      { name: 'pricing', type: 'text' },
      { name: 'guarantee', type: 'textarea' },
      { name: 'duration', type: 'text' },
      { name: 'reporting', type: 'textarea' },
    ]},
    { name: 'footnote', type: 'textarea' },
  ]
}
```

**Rendering:**
- Desktop (768px+): HTML `<table>` with service columns, row labels on the left
- Mobile (<768px): Stacked cards, one per service, with label-value pairs
- Styling: dark semi-transparent rows, no visible borders, cream text, Gold for pricing

---

## Summary

| # | Section | Job | CTA | Background |
|---|---------|-----|-----|------------|
| 1 | Hero | Confirm page, establish credibility | Primary (call) | grass (hero image) |
| 2 | GEO Definition | AI-citable entity summary | None | grass (flat) |
| 3 | Service Comparison | Decision engine. Pick the right service. | Secondary (call if unsure) | grass-alt |
| 4 | Residential Overview | Rank for "professional mole removal" | Secondary (inline links) | grass |
| 5 | Commercial Overview | Address secondary ICP | Secondary (inline link) | grass-alt |
| 6 | Testimonial | Proof at decision point | Secondary (see all reviews) | grass transitional |
| 7 | FAQ | Handle objections, FAQPage schema | None | grass |
| 8 | Service Area Snippet | Local relevance, hub-to-spoke links | Secondary (see all areas) | grass-alt |
| 9 | Final CTA | Close the page | Primary (call + form) | gradient |

**Total estimated words:** 1,100-1,400
**Primary CTA locations:** Hero (section 1), Final CTA (section 9)
**Schema:** ServiceCatalog + BreadcrumbList + FAQPage
