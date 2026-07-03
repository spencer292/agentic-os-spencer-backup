---
page: blog-template, faq, contact, adwords-lps
type: mixed
date: 2026-04-01
status: draft
---

# Remaining Pages Blueprint — Got Moles

Blog template, FAQ page, Contact page, and AdWords landing pages.

---

## Blog Template — /blog/ + /blog/{slug}/

**Primary keyword:** varies per post
**Schema:** Article + Person + BreadcrumbList + FAQPage (per post)

### Blog Index (/blog/)

**Section 1: Header**
- H1: "MOLE CONTROL INSIGHTS"
- Subheadline: "Expert advice on moles, yard protection, and seasonal pest control in Western Washington."
- **Background:** Grass-600
- Estimated words: 15-25

**Section 2: Featured Post**
- Latest or pinned post as large card: featured image, title, excerpt, date, read time
- One featured post. Not three.
- **Background:** Cream-50

**Section 3: Post Grid**
- Cards: image, title, excerpt, date, keyword cluster tag
- 6-9 posts per page. Pagination.
- Filter by cluster: Mole Control, DIY vs Pro, Cost & Value, Safety, Seasonal, Commercial
- **Background:** Cream-50

### Blog Post (/blog/{slug}/)

**Section 1: Post Header**
- H1: post title (Lexend uppercase)
- Author: Spencer Hill. Date. Read time. Keyword cluster tag.
- Featured image (below title, full-width, lazy-loaded)
- **Background:** Grass-600 header, Cream-50 body

**Section 2: GEO Definition Block**
- 2-3 citable sentences in first 30% of content
- **Background:** Cream-50

**Section 3: Body Content**
- Rich text from Payload Lexical editor
- Max-width: 65ch
- H2s as question-format where possible (GEO optimization)
- Stat or proof point every 150-200 words
- **Background:** Cream-50

**Section 4: FAQ Section**
- 3-5 questions per post. Accordion. FAQPage schema.
- **Background:** Grass-600

**Section 5: Author Bio**
- Spencer's photo, 2-3 sentences, credentials
- Person schema
- **Background:** Blue-600

**Section 6: Related Posts**
- 2-3 related posts from same keyword cluster
- Card format: title, excerpt, link
- **Background:** Cream-50

**Section 7: CTA**
- "Got Moles? We Can Help." + Gold CTA
- **Background:** gradient (Blue → Rust)

### Blog SEO Rules
- Every post: H1 matches primary keyword, meta title/description set
- Every post: 3-5 internal links in body (to service pages, other posts, city pages)
- Every post: FAQPage schema on FAQ section
- Every post: definitionBlock in first 30% for GEO
- Humanizer pass on all publishable text (target 8.5+)

---

## FAQ Page — /faq/

**Primary keyword:** mole control FAQ
**Schema:** FAQPage (25+ Q&As)

### Section 1: Intro
- H1: "FREQUENTLY ASKED QUESTIONS ABOUT MOLES AND MOLE CONTROL"
- Subheadline: "Answers from Spencer Hill, Got Moles founder and 9-year mole control specialist."
- **Background:** Grass-600
- Estimated words: 20-30

### Section 2: Question Groups (accordion)
5 groups, each with its own heading:

**Group 1: About Moles (6 questions)**
Educational. Species, behavior, diet, depth, hibernation, moles vs voles.

**Group 2: About Our Methods (6 questions)**
Trust-building. Chemicals, safety, legality, technique, timeline, results.

**Group 3: About Our Services (6 questions)**
Commercial. Pricing, TMCP vs one-time, scheduling, response time, service areas.

**Group 4: About Mole Problems (5 questions)**
Objection handling. Recurrence, DIY traps, castor oil, grub control, single mole damage.

**Group 5: About Got Moles (3 questions)**
Trust. Licensed, years in business, service areas.

- Each answer: 50-100 words minimum, complete standalone paragraph
- Every answer quotable by AI without surrounding context
- Inline CTA between groups 2 and 3: "Ready to get started? Call (253) 750-0211"
- **Background:** alternating Grass/Cream per group
- Estimated words: 1500-2500

### Section 3: Still Have Questions
- "Didn't find your answer? Call us at (253) 750-0211 or email us."
- **Background:** Blue-600
- Estimated words: 15-25

### Section 4: Final CTA
- Gold CTA + form
- **Background:** gradient (Blue → Rust)

### Navigation
- **From:** Homepage FAQ link, service pages, blog posts
- **To:** /how-it-works/, /services/*, /contact/

---

## Contact Page — /contact/

**Primary keyword:** contact Got Moles
**Schema:** ContactPage + LocalBusiness

### Section 1: Hero
- H1: "GET IN TOUCH"
- Subheadline: "Call us, fill out the form, or email. We'll get back to you within one business day."
- Phone number prominent: (253) 750-0211 (clickable)
- **Background:** Grass-600
- Estimated words: 20-30

### Section 2: Contact Form
- Fields: Name, Phone, Email, Zip Code, Service Type dropdown (Residential/Commercial), Message
- Gold submit button: "SEND YOUR REQUEST"
- Friction reducer: "Free inspection. No obligation."
- **Background:** Cream-50
- Estimated words: 15-20 (labels + button)

### Section 3: What to Expect
- "You'll hear back within one business day. We'll ask a few questions about your property and schedule an inspection."
- **Background:** Cream-50
- Estimated words: 30-50

### Section 4: Alternative Contact
- Phone: (253) 750-0211 (click-to-call)
- Email: [Spencer's email, TBD]
- Service area: "King, Pierce, Thurston & Snohomish Counties"
- Hours: [TBD from Spencer]
- **Background:** Blue-600
- Estimated words: 20-30

### Section 5: Final CTA
- Repeat phone number. "Prefer to call? We're here."
- **Background:** Grass-600
- Estimated words: 10-15

### Navigation
- **From:** Every page (header CTA, final CTA sections)
- **To:** /how-it-works/, /services/*

---

## AdWords Landing Pages — /lp/*

**4 landing pages. All share the same stripped structure. noindex, nofollow.**

### Common Structure (all 4 LPs)

**Section 1: Hero**
- Headline: mirrors ad copy exactly
- Click-to-call: Gold button, above fold, immediately
- **NO navigation. NO header links.**
- **Background:** Grass-600

**Section 2: Trust Strip**
- 3 trust signals inline: Veteran-Owned | 5,000+ Clients | Safe for Pets
- **Background:** Blue-600

**Section 3: Social Proof**
- 2-3 short Google review excerpts. Name + city + stars.
- **Background:** Grass-600

**Section 4: How It Works**
- 3 steps only (condensed): Call → Inspect → Gone
- **Background:** Cream-50

**Section 5: Guarantee**
- LP 1 + LP 2 (one-time/trapper): "If we don't catch a mole, you only pay the $150 setup fee."
- LP 3 (protection plan): "New mole activity between visits? We come back at no extra charge."
- LP 4 (commercial): "Professional reporting after every visit. Full accountability."
- **Background:** Blue-600

**Section 6: Second CTA**
- Repeat click-to-call + short form (Name, Phone, Zip)
- **Background:** gradient (Blue → Rust)

### LP Variants

| LP | URL | Campaign | Headline | Key Message |
|----|-----|----------|----------|-------------|
| 1 | /lp/mole-removal/ | "{City} mole removal" | "MOLE REMOVAL IN {CITY} — GUARANTEED RESULTS" | $450 flat rate, fast, guaranteed |
| 2 | /lp/mole-trapper/ | "mole trapper near me" | "EXPERT MOLE TRAPPER NEAR YOU" | Specialist, not generalist. Veteran-owned. |
| 3 | /lp/mole-protection-plan/ | Recurring plan | "MONTHLY MOLE PROTECTION — NEVER DEAL WITH MOLES AGAIN" | $100/month, ~500 enrolled |
| 4 | /lp/commercial/ | Commercial | "COMMERCIAL MOLE CONTROL — ANNUAL CONTRACTS" | Property managers, HOAs, schools |

### LP Rules
- NO navigation links. NO header. NO footer links (except legal).
- NO competing CTAs. One action: call or form.
- NO links to other pages. Every non-CTA click is a leak.
- Message match: headline mirrors the ad that sent them here.
- Page load under 2 seconds. No heavy images.
- noindex, nofollow meta tags.
- Pages set to `noIndex: true` in Payload CMS.

### Estimated words per LP: 200-300

---

## Design System References (all pages)

| Element | Token |
|---------|-------|
| Dark backgrounds | Grass-600, Blue-600 |
| Light backgrounds | Cream-50 |
| Final CTA | gradient (Blue → Rust) |
| H1/H2 | Lexend Bold uppercase, -0.02em |
| Body | Zilla Slab Regular, max-width 65ch |
| Gold divider | 48px x 3px below H2s |
| CTA buttons | Gold, Blue text, sharp corners, uppercase |
| FAQ | Accordion, FAQPage schema, every answer 50+ words |
| Section padding | clamp(48px, 8vw, 96px) |

---

*Generated 2026-04-01. Tasks 4.10 (blog), 4.11 (FAQ), 4.12 (contact), 4.13 (AdWords LPs).*
