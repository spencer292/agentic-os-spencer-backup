# Form and CTA Patterns

Reference material for form and CTA component specifications. Covers button styling,
form design, pricing tables, and the conversion data behind each pattern.

---

## CTA Button Patterns

### Primary CTA
- Background: primary accent color token from the client design system (Got Moles: gold-500).
- Text: white or contrast-appropriate color. Must meet WCAG AA (4.5:1 minimum).
- Height: 48px minimum (touch target requirement).
- Padding: 16px vertical, 32px horizontal (space-4 / space-8 tokens).
- Border radius: radius-md token.
- Font: body weight bold (700) or semi-bold (600). Same font family as body text.
- States:
  - **Default:** solid background, no border.
  - **Hover:** darken background 10% or shift to the 600 shade. Subtle transition (150ms).
  - **Focus:** visible focus ring (2px offset, contrasting color). Never remove focus styles.
  - **Active/pressed:** darken further to 700 shade. Slight scale reduction (0.98) optional.
  - **Disabled:** reduced opacity (0.5) or muted background. Cursor not-allowed.
  - **Loading:** spinner icon replaces or sits beside text. Button disabled. Text changes
    to present participle ("Sending..." not "Send").

### Secondary CTA
- Background: transparent.
- Border: 2px solid, using secondary color token (e.g., dusty-500).
- Text: same color as border.
- Sizing: identical to primary (48px height, same padding).
- Purpose: alternative action that doesn't compete with primary. "Learn more" next to
  "Book a call." The secondary CTA must always be visually subordinate.

### Ghost CTA
- No background, no border. Text link styling.
- Underline on hover. Color: link color token or muted text.
- Use for tertiary actions: "Skip for now", "Maybe later", "View all".
- Must still meet 48px touch target on mobile (achieve with padding, not font size).

### Sticky Mobile CTA
- Fixed to bottom of viewport on mobile.
- Full-width bar with padding. Primary CTA styling.
- Appears on scroll past the hero section (first CTA). Triggered by intersection observer.
- Z-index above content, below modals/overlays.
- Subtle top shadow to separate from content.
- Must not cover content permanently. Include a dismiss option or auto-hide on scroll-up.
- Performance: use `position: sticky` or `position: fixed` with `will-change: transform`
  for smooth rendering.

### CTA Copy Rules
- **Benefit-oriented verbs.** "Book" not "Submit." "Get my" not "Click here." "Start" not
  "Begin process." "Apply" for high-ticket (creates exclusivity).
- **First person works.** "Get my free guide" outperforms "Get your free guide" by 10-15%
  in most tests.
- **Urgency without fakery.** "Book this week" is honest if there are limited slots. "Only
  3 left!" is dishonest if you refill them every Monday. Sceptical audiences smell fake
  urgency instantly.
- **Action length.** 2-5 words. "Book a discovery call" (4 words) beats "Schedule your free
  no-obligation discovery session today" (8 words).

### Micro-Copy

The 13px text beneath a CTA button. Set in small text token, muted color (neutral-500 or
equivalent). Centered beneath the button.

**Purpose:** Reduces friction by answering the objection the reader has at the moment of
clicking. Increases click-through by 10-20% consistently across studies.

**Examples:**
- "No credit card required" (removes financial risk)
- "Free 30-minute session" (sets time expectation)
- "Trusted by 5,000 clients" / "219+ five-star Google reviews" (social proof at point of action — use the client's real proof numbers)
- "Cancel anytime" (removes commitment fear)
- "Takes 2 minutes" (reduces effort perception)

**Rules:**
- One line only. If you need two lines, the CTA copy itself is unclear.
- Address the specific objection for THIS audience. Time-poor people need "Takes 2 minutes."
  Cost-sensitive people need "No credit card." Commitment-phobic people need "Cancel anytime."
- Never use micro-copy to add legal disclaimers. That goes in the footer.

---

## Form Patterns

### Contact Form
- **Fields:** 3-5 maximum. Name, email, message are the core three. Phone and company are
  optional (mark them as optional visually).
- **Layout:** Single column always. Multi-column forms reduce completion by 15-20%.
- **Input styling:** 48px height. Visible labels above each field (not placeholder-only).
  Border: 1px solid neutral-300. Focus: border changes to accent color, subtle box-shadow.
  Border radius: radius-sm or radius-md.
- **Submit button:** Primary CTA styling. Full-width on mobile. "Send message" not "Submit."
- **Error states:** Red/error-color border on the field. Error message in small text directly
  below the field. Icon (exclamation) before the error text. Never remove what the user
  already typed. Never show all errors at once in a banner at the top.
- **Loading state:** Submit button shows spinner, becomes disabled, text changes to
  "Sending..." Prevent double-submission.
- **Success state:** Replace the entire form with a confirmation message. Do not redirect
  to a separate page. "Thanks, [name]. I'll be in touch within 24 hours." Keep them on the
  page so they can continue browsing.

### Quiz / Assessment Form
- **Layout:** Multi-step. One question per screen. Progress indicator at top (step dots or
  percentage bar).
- **Question types:** Multiple choice (radio buttons with card-style options), short text,
  rating scale.
- **Card-style options:** Each option is a clickable card (padding space-4, border, radius-md).
  Selected state: accent border, subtle background tint. This is more engaging than standard
  radio buttons.
- **Navigation:** "Next" button (primary CTA). "Back" link (ghost CTA). No "Skip" unless
  the question is truly optional.
- **Final step:** Collect email/name with a value exchange. "Get your personalised results"
  not "Subscribe to our newsletter."
- **Progress psychology:** Start the progress bar at 10-15% on the first question. People
  are more likely to complete a process that has already "started."

### Newsletter Signup
- **Fields:** Single field (email) + CTA button. Inline layout: input and button side by
  side on desktop, stacked on mobile.
- **CTA copy:** "Get weekly insights" not "Subscribe." The value, not the action.
- **Placement:** Works best in dark sections (contrast draws attention), footers, or as
  an inline element within long-form content.
- **Privacy note:** Small text below: "No spam. Unsubscribe anytime." Required for trust
  with sceptical audiences.

### Lead Magnet Form
- **Fields:** 2 fields (name + email) + CTA button.
- **Value exchange:** Clear statement of what they get. "Download the free guide: [Title]"
  with a thumbnail/preview image of the resource.
- **Social proof at form:** the client's real proof line beneath the form (Got Moles: "219+ five-star Google reviews").
- **Layout:** Often in a card or modal overlay. Background tint to separate from page content.

### Universal Form Rules
- 48px minimum input height (touch target).
- Visible labels always. Placeholder text disappears on focus and is not a substitute for labels.
- Single-column layout. Always. No exceptions.
- Inline validation on blur (not on each keystroke). Show green checkmark for valid fields.
- Tab order must follow visual order. Test with keyboard.
- Autofocus on the first field only if the form is the primary purpose of the page.
- Mark optional fields as "(optional)" rather than marking required fields with asterisks.
  Most fields should be required. The exception is the norm.

---

## Pricing Table Patterns

### Three-Tier Layout (Centre-Stage Effect)
- **Three tiers** is optimal. Centre-stage effect: people gravitate to the middle option.
  Three tiers convert 1.4x better than two tiers and 1.8x better than four or more.
- **Layout:** Three cards side by side on desktop. Recommended tier in the centre, slightly
  elevated or with accent border and "Popular" or "Most chosen" badge.
- **Recommended tier styling:** Different background (subtle tint of accent color), accent
  border (2px), badge at top ("Popular" or "Recommended"), slightly larger or elevated with
  shadow-md.
- **Default billing toggle:** Annual selected by default. Showing savings ("Save 20%") next
  to the toggle. Default to annual increases annual plan adoption by 19%.
- **Tier structure:**
  - Tier name (h3 typography)
  - Price: large display number + billing period in small text
  - Short description (1 sentence, what this tier is for)
  - Feature list: checkmarks for included, X or muted text for excluded
  - CTA at bottom of each tier card

### CTA Strategy for Pricing
- Every tier gets a CTA button. Recommended tier gets primary CTA. Others get secondary CTA.
- CTA copy varies by tier: "Get started" (entry), "Choose [plan name]" (mid), "Contact us"
  (enterprise/premium).
- Add a final CTA below the entire pricing table: "Not sure which plan? Book a call."
  This catches indecisive buyers who scrolled past the table.

### Social Proof Near Pricing
- Placing a testimonial or trust signal within 200px of the pricing table produces
  15-25% conversion lift.
- Best format: single testimonial from someone who chose the recommended tier.
  "I started with [tier] and saw [result] within [timeframe]."
- Alternative: metrics bar showing total customers or satisfaction rate.

### Responsive Behavior
- **Mobile (default):** Stack tiers vertically. Recommended tier first (top of stack).
  Full-width cards with space-4 gap.
- **Tablet (md breakpoint):** Can show 2-across with the third below, or begin the
  3-across layout if space allows.
- **Desktop (lg breakpoint):** 3-across. Centre tier visually elevated. Equal card widths.

### Accessibility
- Pricing toggle (monthly/annual): use proper toggle/switch component with aria-pressed
  or aria-checked. Label: "Billing period: monthly or annual."
- Feature lists: use semantic list markup. Included features: checkmark with
  `aria-label="Included"`. Excluded: `aria-label="Not included"`.
- Price changes on toggle must be announced to screen readers. Use aria-live region
  or role="status" on the price elements.
- Comparison tables: use proper `<table>` markup with headers, not div grids.

### Pricing Psychology Notes
- Anchoring: show the most expensive tier first (left on desktop). The reader's
  perception of value is anchored to the first number they see.
- Charm pricing (ending in 9 or 7) still works but feels dated for premium services.
  Round numbers (100, 250, 500) signal confidence and premium positioning.
- "Starting from" framing works for variable pricing. "From 500/month" sets a floor
  without locking you in.
- Free tier: only include if it genuinely serves as a funnel. A free tier that gives
  away too much cannibalises paid tiers. A free tier that gives too little frustrates
  users and generates support tickets, not conversions.
