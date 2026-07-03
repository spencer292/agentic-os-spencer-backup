---
page: reviews-hub
type: reviews-hub (custom)
date: 2026-04-16
sections: 10
estimated_words: 1800-2200
status: draft
---

# Page Blueprint — Reviews Hub (`/reviews/`)

**Page type:** Reviews/Proof Hub (custom type. Closest template: testimonials + FAQ hybrid)
**Target keyword:** "Got Moles reviews"
**Secondary keywords:** "mole control reviews Washington", "Got Moles testimonials", "mole removal reviews near me", "is Got Moles worth it"
**Schema:** LocalBusiness + AggregateRating + Review[] (all 183+) + FAQPage + BreadcrumbList

---

## Entry Points

| Source | Emotional state | What they need |
|--------|----------------|---------------|
| Homepage "See All 219+ Reviews" | Interested, validating | Volume of proof. Specific outcomes from people like them. |
| TMCP page "See All Reviews" | Considering TMCP, price-checking | TMCP-specific testimonials. Proof the monthly program works. |
| Google "Got Moles reviews" | Researching before calling | Unfiltered volume. Star ratings. Real names. |
| Google "mole control reviews [city]" | Local intent, comparing options | City-specific reviews. Named local customers. |
| AI engine query "is Got Moles worth it" | Decision-stage, needs citation-quality proof | GEO paragraph, FAQ, statistics. Structured for extraction. |
| Service/city page testimonial link | Saw one review, wants more | Filtered view matching their service type or city |

**Primary exit:** Call (253) 750-0211 or schedule inspection form
**Secondary exit:** TMCP page, service pages, case study pages (when available)

---

## Section 1: Hero

**Job:** Confirm the visitor is in the right place. Establish the sheer volume of proof before they scroll.

**Content requirements:**
- Headline: `WHAT OUR CUSTOMERS SAY` (text-display, uppercase Lexend)
- Subheading: `219+ five-star reviews across 3 Google Business locations` (text-body-lg, Zilla Slab)
- Primary CTA: `CALL (253) 750-0211` (gold button, tel: link)
- Trust strip: `5-Star Rated . Nearly 5,000 Clients Served . Since 2017 . Veteran-Owned . Safe for Pets & Kids`
- Estimated words: 30-40

**CTA strategy:** Primary. Click-to-call. One action.

**Social proof:** Trust strip inside hero (standard pattern). The headline itself IS the proof claim.

**Conversion principle:** Relevance + Clarity. Visitor confirms "this is the reviews page" and sees the volume claim immediately.

**Mobile considerations:**
- Headline + subheading above fold
- CTA in thumb zone
- Trust strip wraps naturally below

**Image direction:**
- Photo: `hero-team-laughing` (0791) already assigned in current pages-data.ts
- Genuine laughter, tools visible, branded uniforms. Communicates real team, real work.
- Gate 1 (ICP Recognition): Jennifer sees a real crew, not stock. Pass.
- Gate 2 (Positioning Match): Specialist crew in branded gear, tools of the trade. Pass.
- Gate 3 (Section Job): Reviews page hero needs to say "real people, real work." Laughter + tools = authentic. Pass.
- Treatment: Full-bleed, gradient overlay per design system, preloaded fetchpriority="high"

**Design system references:**
- Sub-page hero: `min-h-[85vh]`
- Gradient overlay: standard sub-page pattern
- Sub-page spacing: `py-12 lg:py-24`
- Background: hero image with gradient into Grass

---

## Section 2: GEO Definition Block

**Job:** Give AI engines a self-contained, citable passage about Got Moles reviews in the first 30% of the page. This is the paragraph Perplexity, ChatGPT, and Google AI Overviews will extract.

**Content requirements:**
- Single paragraph, 50-70 words, structured for extraction
- Must include: company name, review count, star rating, location specifics, founding date, founder name with credentials, client count
- Content (run through humanizer before final):

> Got Moles holds 219+ five-star Google reviews across three service locations in Seattle, Tacoma, and Enumclaw, Washington. Founded in 2017 by Spencer Hill, a U.S. Army veteran with 15+ years of professional trapping experience, Got Moles is a mole-exclusive pest control company serving Western Washington. The company has served nearly 5,000 residential and commercial clients.

- Estimated words: 50-70

**CTA strategy:** None. This is an information block, not a conversion element.

**Social proof:** The paragraph itself IS proof. Statistics and credentials embedded.

**Conversion principle:** Relevance + Anxiety reduction. Specific numbers build trust. Named founder with credentials signals specialist.

**Mobile considerations:**
- Full-width text block, body-lg size
- No truncation. Always visible. AI engines need this in the DOM.

**Image direction:** None. Text-only block.

**Design system references:**
- `blockType: 'geoDefinition'` (already exists in the page data structure)
- Flat Grass background (compact/transitional section per design system)
- `text-body-lg`, max-w-[65ch], mx-auto centered
- Compact padding: `py-8 lg:py-12`

---

## Section 3: Statistics Bar

**Job:** Surface the citable numbers that AI engines and skeptical humans both respond to. This is the "at a glance" proof layer.

**Content requirements:**
- 4-5 key statistics in a horizontal bar (wraps on mobile)
- Each stat: large number + label below
  - `219+` / Five-Star Google Reviews
  - `98.9%` / Five-Star Rating
  - `5,000+` / Clients Served Since 2017
  - `3` / Google Business Locations
  - `15+` / Years of Trapping Experience
- Estimated words: 20-30

**CTA strategy:** None. Data speaks.

**Social proof:** This IS proof. Statistics format per GEO methodology (+37% citation boost).

**Conversion principle:** Anxiety reduction. Volume of numbers overwhelms doubt.

**Mobile considerations:**
- 2x2 grid or stacked vertical on mobile
- Numbers large (text-h2), labels small (text-small)

**Image direction:** None. Data visualization only.

**Design system references:**
- Background: `grass-alt` (tonal shift from geo definition block)
- Number styling: `text-h2` Lexend Bold, cream
- Label styling: `text-small` Zilla Slab, cream-200/70
- Padding: `py-12 lg:py-24` (sub-page standard)

---

## Section 4: Featured Reviews (3 full-width)

**Job:** Stop the scroll with the 3 most compelling reviews. These are the "if you read nothing else, read these" quotes. Selected for outcome specificity and emotional range.

**Content requirements:**
- 3 featured reviews, each full-width, larger treatment than the grid below
- Each review shows: full quote text, reviewer name, city + state, star rating (5 gold stars), service type badge, date
- Selection criteria: one showing scale (Brian Wozeniak, 27 moles / 5 acres), one showing longevity (Christina McDougall, 22 years of fighting moles), one showing transformation (John Gower, from reluctant to monthly subscriber)
- Featured flag in CMS: `featured: true`
- Estimated words: 300-400 (the reviews themselves)

**CTA strategy:** None. Let the proof breathe.

**Social proof:** This IS the primary proof section. Three named, city-attributed, outcome-specific testimonials.

**Conversion principle:** Anxiety reduction. "People like me in my area got results."

**Mobile considerations:**
- Stacked full-width, one per viewport height
- Stars and name visible without scrolling within each review card

**Image direction:** None. Quote-only treatment. Gold quote marks per design system testimonial pattern.

**Design system references:**
- Featured testimonial pattern: large centered blockquote, `text-body-lg`, gold `"` accent at `text-5xl`, gold stars above, full name + city
- No card backgrounds, no borders. Spacing and tonal shifts only.
- Background: `grass`
- Each review: `cite` block with name, city, service type badge (small pill: `text-xs bg-white/10 rounded-full px-3 py-1`)
- Section padding: `py-12 lg:py-24`

---

## Section 5: Filter Bar

**Job:** Let visitors self-select their relevance group. Filters serve two audiences: humans who want to see reviews from their city or service type, and search engines that index each filter combination as a crawlable URL.

**Content requirements:**
- Heading: `FIND REVIEWS THAT MATCH YOUR SITUATION` (text-h3)
- Two filter groups:
  - **Service type:** All / Total Mole Control Program / One-Time Removal / Commercial (pills/buttons)
  - **City/Area:** All / Seattle / Tacoma / Enumclaw (pills/buttons)
- Active filter state: gold background, blue text
- Inactive: `bg-white/5`, cream text
- Filter combinations produce crawlable URL patterns: `/reviews/?service=tmcp&city=seattle`
- When a city filter is active, show the city-specific GEO intro paragraph (see Section 6)
- Count badge on each filter showing number of matching reviews
- Estimated words: 10-20 (labels only)

**CTA strategy:** None. This is navigation, not conversion.

**Social proof:** Count badges on filters ("Seattle (96)", "TMCP (5)") reinforce volume.

**Conversion principle:** Relevance. Self-selection increases relevance of the content below. Clarity. Visitor controls their experience.

**Mobile considerations:**
- Filter pills wrap naturally, full-width on small screens
- Horizontal scroll on very small screens if needed
- Sticky below header on scroll so filters remain accessible

**Image direction:** None. UI element.

**Design system references:**
- Background: `grass-alt`
- Pills: `rounded-full`, inactive `bg-white/5 text-cream-200`, active `bg-gold-500 text-blue-600`
- Compact padding: `py-8 lg:py-12`
- Heading: `text-h3` Zilla Slab SemiBold, centered

---

## Section 6: City-Specific GEO Paragraphs (conditional)

**Job:** When a city filter is active, show a localized GEO paragraph that AI engines can cite for "[city] mole control reviews" queries. Hidden when "All" filter is active.

**Content requirements:**
- One paragraph per city (3 total: Seattle, Tacoma, Enumclaw), 40-60 words each
- Each must include: city name, review count for that city, named customers, specific outcomes
- These are the passages AI engines cite for "mole control reviews [city]" queries

**Seattle (96 reviews):**
> Got Moles has earned 96 five-star Google reviews from homeowners across Seattle and the Eastside, including Sammamish, Bellevue, Issaquah, and Federal Way. Seattle-area customers like Dave Gierok (5 acres, problem resolved) and Sabra Bosewicht (tried everything non-lethal before calling) report lasting results after years of failed DIY attempts.

**Tacoma (61 reviews):**
> Tacoma-area homeowners have given Got Moles 61 five-star reviews, the highest-rated mole control service in Pierce County. Customers across Tacoma, Puyallup, and surrounding areas like Brian Wozeniak (27 moles removed from a 5-acre property) and Debbie Feigenbaum (monthly client) highlight reliable scheduling and year-round protection.

**Enumclaw (26 reviews):**
> Got Moles holds 26 five-star reviews from the Enumclaw and rural King County area, where larger properties and agricultural land create persistent mole problems. Customers like Jared Barrett describe Got Moles as a "10/10 business" that responds within 24 hours.

- Estimated words: 40-60 per city (120-180 total, but only one shows at a time)

**CTA strategy:** None. GEO content block.

**Social proof:** City-specific review counts + named customers with outcomes.

**Conversion principle:** Relevance. Local specificity is the strongest relevance signal for local service businesses.

**Mobile considerations:**
- Full-width text block below filter bar
- Appears/disappears with filter selection (CSS transition, content always in DOM for crawlers)

**Image direction:** None. Text block.

**Design system references:**
- Inherits `grass-alt` from filter bar section (same visual block)
- `text-body-lg`, max-w-[65ch], mx-auto
- Compact padding: `py-4 lg:py-6` (sits directly under filter bar)

---

## Section 7: Review Grid (paginated)

**Job:** Show ALL reviews in a browsable, filterable grid. Volume IS the conversion mechanic. Nobody reads 183 reviews. Everybody is impressed that 183 exist.

**Content requirements:**
- Grid of review cards, 1 column mobile / 2 columns tablet / 3 columns desktop
- Each card shows: reviewer name, city, star rating, service type badge, truncated quote (first 2-3 sentences), "Read full review" expand
- Progressive disclosure: quote truncates at ~100 chars with "..." + expand toggle
- Pagination: 12 reviews per page load, "Load More" button (not traditional pagination). All reviews in DOM via SSR for crawlers. Client-side progressive reveal for UX.
- Sort: default by Spencer's rank order. No user-facing sort controls (simplicity).
- Responds to filter bar selections in real-time
- Each review card carries individual Review schema markup
- Estimated words: varies (all 183 review texts are in the DOM)

**CTA strategy:** None. The grid is proof, not conversion.

**Social proof:** The grid IS social proof. Volume, names, cities, ratings.

**Conversion principle:** Anxiety reduction. Sheer volume overwhelms doubt. Distraction removal. No competing elements. Just reviews.

**Mobile considerations:**
- Single column, full-width cards
- Touch-friendly expand/collapse
- "Load More" button large enough for thumb (48px height minimum)

**Image direction:** None. Text cards only.

**Design system references:**
- Background: `grass`
- Cards: `bg-white/5 rounded-2xl p-6 lg:p-8 hover:bg-white/10` (matching test page card pattern)
- No borders. Tonal shift only.
- Name: `text-h4 lg:text-2xl` Zilla Slab SemiBold, cream
- Quote: `text-body` Zilla Slab Regular, cream-200/80 (intentional hierarchy: smaller than featured)
- Stars: gold-500 SVGs, same component as TestimonialBlock
- Service type badge: `text-xs bg-white/10 rounded-full px-3 py-1`
- City: `text-small`, cream-200/60
- Grid gap: `gap-6 lg:gap-8`
- Section padding: `py-12 lg:py-24`

---

## Section 8: Expert Attribution Block

**Job:** Give AI engines a named expert entity with credentials. E-E-A-T signal. Spencer Hill must appear as the authority behind these results.

**Content requirements:**
- Heading: `THE SPECIALIST BEHIND THE RESULTS` (text-h2, centered)
- Layout: Spencer photo left (content tier), text right
- Text content (run through humanizer):
  - Spencer Hill, founder. U.S. Army veteran. 15+ years of professional trapping.
  - Founded Got Moles in 2017 as a mole-exclusive company serving Western Washington.
  - Nearly 5,000 clients served. 219+ five-star reviews. Team of 5 specialists.
  - One-liner quote from Spencer about why reviews matter to him.
- Links to About page for full story
- Estimated words: 80-120

**CTA strategy:** Secondary. Text link to About page ("Read Spencer's full story").

**Social proof:** Spencer's credentials ARE proof. Veteran status, experience years, client count.

**Conversion principle:** Anxiety reduction + Relevance. Named expert with credentials. AI engines cite named entities 25-30% more.

**Mobile considerations:**
- Photo stacks above text on mobile
- Photo: 200px circle crop on mobile, 300px on desktop

**Image direction:**
- Photo: `team-spencer-0770.webp` (standard portrait, branded cap, Got Moles patch) or `1206` (warm close-up)
- Gate 1 (ICP Recognition): Real person in work gear. Jennifer sees a professional, not a stock model. Pass.
- Gate 2 (Positioning Match): Branded specialist. Confident posture. Pass.
- Gate 3 (Section Job): Expert attribution needs "this is the person behind the results." Portrait with branded gear = authority. Pass.
- Treatment: Circular crop, `rounded-full`, `object-cover`, soft shadow

**Design system references:**
- Background: `grass-alt`
- Layout: `grid md:grid-cols-[300px_1fr] gap-8 lg:gap-12 items-center`
- Photo: `rounded-full w-48 h-48 lg:w-72 lg:h-72 object-cover`
- Heading: `text-h2` Lexend Bold, cream, centered above grid
- Body: `text-body-lg` Zilla Slab, cream
- Link: text link with inline arrow, cream, hover gold
- Section padding: `py-12 lg:py-24`

---

## Section 9: FAQ Section

**Job:** Answer the 7 high-intent queries AI engines field about Got Moles reviews. Each answer is structured for extraction. FAQPage schema on the entire section.

**Content requirements:**
- Heading: `FREQUENTLY ASKED QUESTIONS ABOUT GOT MOLES REVIEWS` (text-h2, centered)
- 7 FAQ items, each as `<details><summary>` accordion:

1. **Is Got Moles worth the money?**
   Answer: cite 70+ reviewers mentioning value, 98.9% five-star rate, 2-3 short named quotes. Link to pricing context on TMCP page.

2. **How many moles does Got Moles catch?**
   Answer: Brian Wozeniak, 27 moles from 5-acre property. Context on varying property sizes. Link to How It Works.

3. **Does the monthly program actually work?**
   Answer: cite Christina McDougall (first annual customer, 22 years of fighting), John Gower (moved to monthly after initial success). Link to TMCP page.

4. **Is Got Moles safe for pets and children?**
   Answer: professional body-gripping traps, no poisons, no chemicals. Cite ICP context (two kids and a dog). Link to How It Works.

5. **What do customers in Seattle say about Got Moles?**
   Answer: 96 five-star reviews from Seattle area. Cite 2 named customers. Link to filtered view.

6. **How long does it take Got Moles to remove moles?**
   Answer: cite reviews mentioning speed ("in short order", "quickly"). Context on initial assessment + program timeline. Link to How It Works.

7. **What happens if moles come back?**
   Answer: TMCP provides year-round protection. Monthly visits. Cite ongoing customers. Link to TMCP page.

- Each answer: 60-100 words, structured as self-contained citable passage
- Estimated words: 500-700

**CTA strategy:** None within FAQ. Internal links embedded in answers serve as secondary paths.

**Social proof:** Named customer quotes embedded in answers. Statistics in answers.

**Conversion principle:** Anxiety reduction. Every FAQ directly addresses a buying objection. Clarity. Structured answers reduce cognitive load.

**Mobile considerations:**
- Accordion is native mobile UX pattern. Works perfectly.
- Summary text large enough for 48px touch target
- Only one FAQ open at a time to prevent scroll overload

**Image direction:** None. Text content.

**Design system references:**
- Background: `grass`
- Heading: `text-h2` Lexend Bold, cream, centered
- Accordion: `<details>` element (progressive disclosure per design system). Summary: `text-h4 lg:text-2xl` Zilla Slab SemiBold. Content: `text-body-lg`.
- No card backgrounds on FAQ items. Spacing + subtle border-bottom (`border-cream-200/10`) between items.
- Section padding: `py-12 lg:py-24`
- FAQPage schema wraps all 7 items

---

## Section 10: Final CTA

**Job:** Convert. The visitor has scrolled through 183+ reviews, seen featured proof, read FAQ answers. This is the moment.

**Content requirements:**
- Heading: `READY TO SEE RESULTS LIKE THESE?` (text-h1, centered)
- Body: One sentence. "Join 5,000+ homeowners who chose the specialist."
- Primary CTA: `CALL (253) 750-0211` (gold button, tel: link)
- Secondary CTA: Contact form embedded (name, phone, zip, message)
- Subtext below form: `Or call (253) 750-0211 for a free inspection`
- Estimated words: 30-50

**CTA strategy:** Primary. This is THE conversion section. Phone + form. No other links.

**Social proof:** "5,000+ homeowners" in the body copy. No additional proof. The entire page above IS the proof.

**Conversion principle:** Urgency (soft) + Anxiety reduction. "Ready to see results like these" implies they could be next. Form reduces friction for those who won't call.

**Mobile considerations:**
- CTA button in thumb zone
- Form fields stacked single-column, large inputs
- Click-to-call button full-width on mobile

**Image direction:** None. Gradient background carries the visual weight.

**Design system references:**
- Background: `gradient` (Blue #182034 to Rust #8F2A2D). ONLY section that uses this. Always last.
- Heading: `text-h1` Lexend Bold, cream, centered
- Body: `text-body-lg` Zilla Slab, cream-200/80
- Form: transparent fields, cream/gold outline, `rounded-2xl`
- Desktop layout: text + CTA left, form right (`grid md:grid-cols-2`)
- Section padding: `py-12 lg:py-24`

---

## Internal Linking Map

| From this page | Link to | Anchor text | Location |
|---------------|---------|-------------|----------|
| Reviews hub | TMCP page | "Learn about the Total Mole Control Program" | FAQ answers #3, #7 |
| Reviews hub | How It Works | "See how Got Moles works" | FAQ answers #2, #4, #6 |
| Reviews hub | About page | "Read Spencer's full story" | Expert attribution block |
| Reviews hub | City pages | "See mole control in [city]" | City filter GEO paragraphs |
| Reviews hub (filtered) | Service pages | "Learn about [service]" | Service type filter context |
| Homepage | Reviews hub | "See All 219+ Reviews" | Already exists |
| TMCP page | Reviews hub | "See All Reviews" | Already exists |
| Each service page | Reviews hub (filtered) | "Read [service] reviews" | New. Add to service pages. |
| Each city page | Reviews hub (filtered) | "See reviews from [city]" | New. Add to city pages. |

---

## Schema Plan

```
Page-level JSON-LD:
├── LocalBusiness (@id: /#business)
│   ├── name: "Got Moles"
│   ├── aggregateRating: { ratingValue: 5.0, reviewCount: 219+ }
│   └── review: [ ...all 183+ Review objects ]
├── FAQPage
│   └── mainEntity: [ ...7 Question objects ]
└── BreadcrumbList
    └── Home > Reviews

Per-testimonial:
└── Review (on each displayed review card)
    ├── author: Person (real name)
    ├── reviewRating: Rating
    ├── reviewBody: full text
    ├── datePublished: real date
    └── locationCreated: city, WA
```

---

## CTA Map Summary

| Section | CTA type | Action |
|---------|----------|--------|
| 1. Hero | Primary | Call (253) 750-0211 |
| 2. GEO Definition | None | - |
| 3. Statistics Bar | None | - |
| 4. Featured Reviews | None | - |
| 5. Filter Bar | None (navigation) | - |
| 6. City GEO Paragraphs | None | - |
| 7. Review Grid | None | - |
| 8. Expert Attribution | Secondary | About page link |
| 9. FAQ | None (internal links in answers) | - |
| 10. Final CTA | **Primary** | Call + form |

**One primary CTA per viewport rule satisfied.** Hero CTA at top, final CTA at bottom. Everything between is proof. No competing actions.

---

*Blueprint ready for str-cro-audit validation. After CRO approval, this becomes the build spec.*
