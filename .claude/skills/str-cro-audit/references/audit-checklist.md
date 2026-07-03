# CRO Audit Checklist

Quick-reference checklist for systematic page audits. Use alongside the LIFT model scoring.
Every item is binary: pass or fail. Failing items become recommendations in the audit report.

---

## Five-Second Test

The most important test. Simulate a first-time visitor with zero context.

- [ ] **WHO** this is for is clear within 5 seconds
- [ ] **WHAT** they offer is clear within 5 seconds
- [ ] **WHAT TO DO NEXT** is clear within 5 seconds

If all three fail, stop here. This is the #1 issue. Everything else is secondary.

---

## Hero Section

The first viewport. Makes or breaks the visitor's decision to scroll.

- [ ] Headline under 10 words, benefit-driven
- [ ] Subheadline explains the "how" or adds specificity
- [ ] Single primary CTA above the fold
- [ ] At least one trust signal visible (logo bar, stat, testimonial snippet)
- [ ] Hero image supports the message (not generic stock)
- [ ] Hero image is not lazy-loaded (it IS the LCP element)
- [ ] No auto-playing video that delays page load
- [ ] Headline uses audience language, not company language

---

## Typography

Readability is conversion. If they cannot read it, they cannot buy it.

- [ ] Body text 16px minimum (18px on desktop is ideal)
- [ ] Heading hierarchy is logical (h1 then h2 then h3, no skips)
- [ ] One h1 per page (the main headline)
- [ ] Line length under 75 characters (50-65 is optimal)
- [ ] Contrast ratio 4.5:1 or higher for all body text
- [ ] Large text (18px+ bold or 24px+ regular) has 3:1 minimum contrast
- [ ] Paragraph length under 4 lines on mobile
- [ ] Font weight is 400+ for body text (thin fonts hurt readability)
- [ ] Maximum 2 font families on the page
- [ ] No justified text (creates uneven word spacing)

---

## Color and Design

Visual design serves conversion, not decoration.

- [ ] Brand colors used consistently (matches design-system.md if available)
- [ ] CTA color has maximum contrast with its surroundings
- [ ] CTA color is not used for non-interactive elements (no "banner blindness")
- [ ] No more than 3 active colors (primary, secondary, accent)
- [ ] Dark text on light backgrounds or light text on dark backgrounds (never mid-on-mid)
- [ ] Sufficient whitespace between sections (40px minimum, 80px+ ideal)
- [ ] Visual hierarchy is clear in a squint test (blur the page, hierarchy holds)
- [ ] No purely decorative elements that serve no conversion purpose

---

## Calls to Action

The CTA is the page's reason for existing. Get this right.

- [ ] One primary CTA per viewport section
- [ ] Benefit-oriented copy (not "Submit", "Click here", or "Learn more")
- [ ] 48px minimum height for touch targets
- [ ] 16px minimum horizontal padding around CTA text
- [ ] Micro-copy beneath the CTA (10-20% click lift in research)
- [ ] CTA visible on mobile without scrolling (or sticky at bottom)
- [ ] CTA color passes the squint test (stands out from everything else)
- [ ] Secondary CTAs are visually subordinate (outline, smaller, muted color)
- [ ] CTA text starts with a verb ("Get", "Start", "Join", not "Our services")
- [ ] No ghost buttons for primary CTAs (outline buttons convert 20-30% less)

---

## Social Proof

Trust signals placed where decisions are made, not where space is available.

- [ ] Social proof appears at decision points (near CTAs, at pricing)
- [ ] Social proof is NOT only in the footer
- [ ] Testimonials include names and specific outcomes (not "Great product!")
- [ ] 1-3 trust signal types present (logos, testimonials, metrics)
- [ ] Not more than 7 trust signal types (credibility penalty beyond this)
- [ ] Real photography, not stock photos for testimonials
- [ ] Numbers are specific ("127 companies" not "hundreds of companies")
- [ ] Logo bars use recognisable brands (or remove them)
- [ ] Case study links go to real case studies (not 404s or coming soon)

---

## Forms

Every extra field costs conversions. Prove each field earns its place.

- [ ] 3-5 fields maximum (each field above 3 drops conversion ~10%)
- [ ] Visible labels above fields (not placeholder-only labels)
- [ ] Single-column layout (multi-column forms convert worse)
- [ ] 48px minimum input height for touch targets
- [ ] Error states are defined and helpful (not just "invalid input")
- [ ] Submit button uses benefit copy, not "Submit"
- [ ] Optional fields are marked optional (not required fields marked required)
- [ ] Form is visible without scrolling or clearly indicated above fold
- [ ] Privacy statement near submit button (even one line helps)
- [ ] No CAPTCHA unless spam is a proven problem (costs 3-5% conversions)

---

## Mobile Experience

More than half of web traffic is mobile. Audit mobile first, not as an afterthought.

- [ ] Touch targets are 48px by 48px minimum
- [ ] Single-column layout (no horizontal scrolling)
- [ ] Primary CTA is in the thumb zone (bottom 40% of screen)
- [ ] No horizontal scrolling on any element
- [ ] Fast load: under 3 seconds on a 4G connection
- [ ] Text is readable without zooming (16px minimum)
- [ ] Sticky CTA or repeated CTA after every 2-3 scrollable sections
- [ ] Navigation is accessible via hamburger (not full desktop nav)
- [ ] Tap targets have 8px minimum spacing between them
- [ ] Images resize properly (no overflow, no cropping of key content)

---

## Performance

Slow pages kill conversions. Every 100ms of load time costs ~1% conversion rate.

- [ ] Hero image is preloaded (not lazy-loaded). It is the LCP element.
- [ ] All images have explicit width and height attributes (prevents CLS)
- [ ] WebP or AVIF format used for images (not uncompressed PNG/JPEG)
- [ ] Maximum 3 font files loaded (each font file adds ~100ms)
- [ ] Total page weight under 1MB (ideal under 500KB)
- [ ] No render-blocking JavaScript in the head
- [ ] CSS is inlined or loaded with high priority
- [ ] Third-party scripts are deferred or async
- [ ] No layout shift after initial paint (CLS under 0.1)
- [ ] Time to interactive under 3.5 seconds

---

## Accessibility

Accessibility is not optional. It affects 15-20% of users and is increasingly a legal requirement.

- [ ] Color contrast passes WCAG AA (4.5:1 body, 3:1 large text)
- [ ] All images have descriptive alt text (not "image1.jpg")
- [ ] Focus states are visible on all interactive elements
- [ ] Skip navigation link is present
- [ ] No information conveyed by color alone (always pair with text or icon)
- [ ] Heading hierarchy is semantic (not just styled to look like headings)
- [ ] Forms have associated labels (not just placeholders)
- [ ] Error messages are programmatically associated with fields
- [ ] Page has a lang attribute on the html element
- [ ] Keyboard navigation works for all interactive elements

---

## Content Structure

How the page organises and presents its information.

- [ ] One h1 per page
- [ ] Sections follow a logical decision sequence (problem, solution, proof, action)
- [ ] Each section has one job (not trying to do multiple things)
- [ ] Content is scannable (bullets, bold, short paragraphs)
- [ ] No orphan pages (every page links forward to a next step)
- [ ] Above-fold content answers "Am I in the right place?"
- [ ] Long pages use visual section breaks (alternating backgrounds, spacing)
- [ ] FAQ section uses accordion pattern (not all expanded)
- [ ] Content length matches visitor awareness level (cold = longer, warm = shorter)
