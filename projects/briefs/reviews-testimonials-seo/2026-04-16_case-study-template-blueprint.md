---
page: case-study-template
type: case-study (custom)
date: 2026-04-16
sections: 8
estimated_words: 800-1200 per case study
status: draft
---

# Page Blueprint — Case Study Template (`/reviews/[slug]/`)

**Page type:** Case Study (dynamic route, one per study)
**Target keyword pattern:** "Got Moles [city] mole removal results", "mole control case study [area]"
**Schema:** Article + Review + LocalBusiness (@id reference) + BreadcrumbList

**Note:** Template and route built now. Content blocked on Spencer providing raw material (before/after photos, specific client stories, permission). This blueprint defines the structure so the build isn't blocked.

---

## Entry Points

| Source | Emotional state |
|--------|----------------|
| Reviews hub "Case Studies" section | Wants deeper proof than short reviews |
| Google "[city] mole removal results" | Looking for evidence of local expertise |
| AI engine "does mole control actually work" | Needs citation-quality outcome data |
| Internal link from service page | Considering a specific service, wants proof |
| Internal link from city page | Wants local proof |

**Primary exit:** Call (253) 750-0211 or TMCP page
**Secondary exit:** Reviews hub, related service page, related city page

---

## Section 1: Hero (compact)

**Job:** Set the scene. Property type, location, problem severity. The visitor should picture a property like theirs.

**Content requirements:**
- Headline: outcome-led, specific. E.g., `27 MOLES REMOVED FROM A 5-ACRE TACOMA PROPERTY` (text-h1)
- Subheading: client name (with permission) + timeframe. E.g., `Brian W. / Tacoma, WA / Total Mole Control Program member since 2022`
- No CTA in hero. The story IS the conversion mechanic.
- Estimated words: 15-25

**Image direction:**
- Before/after photo of the property (Spencer to provide)
- Fallback if no property photo: landscape team shot from photo library
- Treatment: sub-page hero, `min-h-[70vh]` (compact, content page)

**Design system references:**
- Sub-page hero: `min-h-[70vh]`
- No trust strip in case study hero (the headline stat IS the trust signal)
- Gradient overlay: sub-page pattern

---

## Section 2: The Problem

**Job:** Articulate the customer's situation before Got Moles. This mirrors the ICP's own frustrations and creates recognition.

**Content requirements:**
- Heading: question-format H2 matching user queries. E.g., `WHAT HAPPENS WHEN MOLES TAKE OVER A 5-ACRE PROPERTY?`
- 2-3 paragraphs: property description, how long the problem persisted, what they tried before (DIY, general pest companies), the impact (lawn damage, frustration, money wasted)
- Client quote embedded (blockquote with attribution)
- Specific numbers: property size, years of problem, money spent on failed solutions
- Estimated words: 150-200

**Design system references:**
- Background: `grass`
- Body: `text-body-lg`, max-w-[65ch]
- Blockquote: gold `"` accent, cream text, no card background
- Padding: `py-12 lg:py-24`

---

## Section 3: The Method

**Job:** Show what Got Moles did differently. Specialist approach vs. what failed before. This section reinforces the "Mole Specialist" positioning.

**Content requirements:**
- Heading: `HOW GOT MOLES APPROACHED THE PROBLEM`
- Step-by-step narrative (not the generic How It Works. Case-specific):
  - Initial assessment findings (what Spencer's team discovered)
  - Trap placement strategy (body-gripping traps, professional method)
  - Visit frequency and communication approach
  - How the ongoing program works for this property
- No technical jargon. Spencer's voice: confident, direct, explaining simply.
- Estimated words: 150-200

**Image direction:**
- Action photo of team working (from photo library): 0893 (Spencer digging), 1011 (overhead shovel work), 0866 (close-up hands + dirt)
- Or property-specific photos from Spencer

**Design system references:**
- Background: `grass-alt`
- Step format: gold circle markers + bold heading + narrative paragraph (not accordion)
- Padding: `py-12 lg:py-24`

---

## Section 4: The Results

**Job:** The proof. Specific numbers, timeframe, outcome. This is the section AI engines cite.

**Content requirements:**
- Heading: `THE RESULTS` (or outcome-specific: `27 MOLES REMOVED. YARD RESTORED.`)
- Key result stats in large format (like statistics bar):
  - Moles removed: [number]
  - Timeframe: [months/years]
  - Property size: [acres]
  - Current status: [ongoing protection / mole-free since X]
- 1-2 paragraphs of narrative around the numbers
- Before/after photos side by side (if available from Spencer)
- Client quote about the outcome (blockquote)
- Estimated words: 100-150

**Design system references:**
- Background: `grass`
- Stats: `text-h2` numbers, `text-small` labels (same pattern as reviews hub stats bar)
- Before/after: `grid md:grid-cols-2 gap-4`, images with captions
- Padding: `py-12 lg:py-24`

---

## Section 5: Client Review (full)

**Job:** The customer's own words, unedited. Full Google review text. This carries the Review schema for this case study.

**Content requirements:**
- Full verbatim review from the customer
- Star rating (gold stars)
- Name, city, date
- Google review link (if available)
- Review schema markup on this block
- Estimated words: 50-200 (varies by review length)

**Design system references:**
- Background: `grass-alt`
- Featured testimonial pattern: large centered blockquote, `text-body-lg`, gold `"`, stars above
- Padding: `py-12 lg:py-24`

---

## Section 6: FAQ (case-study-specific)

**Job:** Answer 3-4 questions specific to this case study's context. FAQPage schema. These target long-tail queries.

**Content requirements:**
- 3-4 questions relevant to this case study's specifics:
  - "How do you remove moles from a [size] property?"
  - "How long does mole control take for [problem type]?"
  - "Does Got Moles work in [city/area]?"
  - "What does mole control cost for [property type]?"
- Each answer: 40-80 words, self-contained for AI extraction
- Estimated words: 150-300

**Design system references:**
- Background: `grass`
- Accordion pattern: `<details><summary>`, same as reviews hub FAQ
- Padding: `py-12 lg:py-24`

---

## Section 7: Related Content

**Job:** Link to relevant service page, city page, and back to reviews hub. No dead ends.

**Content requirements:**
- 3 link cards:
  - Service page for the service type used in this case study
  - City page for this customer's location
  - Reviews hub ("See all 219+ reviews")
- Each card: icon/image + title + 1-line description + arrow link
- Estimated words: 30-50

**Design system references:**
- Background: `grass-alt`
- Cards: `bg-white/5 rounded-2xl p-6 hover:bg-white/10`, 3-column grid (stacks on mobile)
- Padding: `py-12 lg:py-24`

---

## Section 8: Final CTA

**Job:** Convert. Same pattern as reviews hub.

**Content requirements:**
- Heading: `YOUR YARD COULD BE NEXT`
- Body: "Call for a free inspection. See what Got Moles can do for your property."
- Primary CTA: `CALL (253) 750-0211`
- Secondary: contact form
- Estimated words: 20-30

**Design system references:**
- Background: `gradient` (Blue to Rust). Always last section.
- Same CTA pattern as all other pages.

---

## Schema Plan

```
Page-level JSON-LD:
├── Article
│   ├── headline: "[outcome headline]"
│   ├── author: Person (@id: Spencer Hill)
│   ├── datePublished: [case study date]
│   ├── about: LocalBusiness (@id: /#business)
│   └── description: "[GEO-optimized summary]"
├── Review
│   ├── author: Person (client name)
│   ├── reviewRating: Rating
│   ├── reviewBody: full review text
│   └── itemReviewed: LocalBusiness (@id: /#business)
├── FAQPage
│   └── mainEntity: [ ...3-4 Question objects ]
└── BreadcrumbList
    └── Home > Reviews > [Case Study Title]
```

---

*Template ready for build. Content will be populated when Spencer provides raw case study material.*
