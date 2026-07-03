# Social Proof Patterns

Reference material for social proof component specifications. Covers the psychology of
social proof, specific patterns, layout specs, and conversion data. Every pattern includes
responsive behavior and accessibility requirements.

---

## The Psychology of Social Proof

Social proof works because humans use other humans' decisions as shortcuts. For sceptical
audiences, this is even more important. They won't take your word for it. They need to
see that people like them have already made this decision and are glad they did.

**Key principles:**
- Specificity beats volume. One detailed testimonial outperforms ten vague ones.
- Named beats anonymous. "Sarah Chen, VP Marketing at Acme" beats "Marketing Executive."
- Numbers beat words. "Reduced from 60 hours to 15" beats "saved a lot of time."
- Restraint IS the trust signal. Piling on proof types looks desperate.

---

## Logo Bar

**Purpose:** Instant credibility. Shows that recognisable organisations trust you.
Appears immediately below the hero for maximum impact.

**Layout:**
- 5-7 logos maximum. More looks cluttered and reduces the impact of each.
- Grayscale treatment. Consistent height (32-40px). This prevents any single logo
  from dominating and keeps the visual weight even.
- Horizontal row with even spacing. Center-aligned.
- Optional label above: "Trusted by" (for client logos) or "As featured in" (for media logos).
  Set in small text, muted color token.
- Subtle top/bottom border or background tint to separate from surrounding sections.

**Responsive behavior:**
- **Mobile (default):** Two approaches. Horizontal scroll with overflow (add scroll
  indicators or fade edges). Or 2-row grid (3-4 logos per row). Choose based on logo
  count. Under 5: single scrollable row. 5-7: two-row grid.
- **Tablet (md breakpoint):** Single row, logos may be slightly smaller.
- **Desktop (lg breakpoint):** Single row, full size, evenly distributed across container width.

**Performance:**
- Lazy-load logo images (they are below the hero fold).
- SVG format preferred for logos. Crisp at any size, tiny file size.
- If using raster images, serve at 2x and compress.

**Accessibility:**
- Each logo image needs alt text: "Company Name logo" (not just "logo").
- The logo bar container should have `aria-label="Trusted by these organisations"` or similar.
- Logos should not be interactive unless they link somewhere meaningful.

**When to use:** You have recognisable client or media logos. The audience would be
impressed by the names. B2B and professional services benefit most.

**When to avoid:** Your clients are individuals (coaching, personal services) where
logos don't apply. Use testimonials instead.

---

## Testimonial: Single Featured

**Purpose:** Deep social proof. One person's story told with enough detail to be believable.
The most powerful format for sceptical audiences because it feels real, not curated.

**Layout:**
- Full quote: 2-4 sentences. Specific outcomes, not generic praise. "Reduced from 60 hours
  to 15 per week" not "great coaching."
- Attribution: name, role, company. All three. Missing any one reduces credibility.
- Headshot: real photo, professional quality. Circular crop, 64-80px diameter.
  Adds 35% credibility vs text-only testimonials.
- Optional: star rating, company logo, or link to full case study.
- Visual treatment: large pull-quote typography for the key line. Quotation mark as
  decorative element in brand accent color, oversized and partially transparent.

**Content requirements:**
- The quote must include a specific outcome. Numbers, timeframes, before/after states.
- The person must be named. Anonymous testimonials are worthless for sceptical audiences.
- The role/company must be relevant to the ICP. A testimonial from someone the audience
  identifies with converts 3x better than one from someone they don't recognise.

**Responsive behavior:**
- **Mobile (default):** Stack vertically. Photo above quote or inline with name/role.
  Quote text at body size or slightly larger. Full-width with section padding.
- **Tablet (md breakpoint):** Can introduce side-by-side layout (photo left, quote right).
- **Desktop (lg breakpoint):** Side-by-side with generous whitespace. Or centered with
  photo above the quote for a more editorial feel.

**Placement:** After the solution/services section, before the primary CTA. The testimonial
bridges "here's what I offer" and "take action" with "here's proof it works."

**Accessibility:**
- Headshot: descriptive alt text ("Sarah Chen, VP Marketing").
- Quote: use `<blockquote>` with `cite` attribute.
- Star ratings: use aria-label ("4.8 out of 5 stars").

---

## Testimonial: Grid

**Purpose:** Volume proof. Shows breadth of happy clients across different roles,
industries, and outcomes. Less deep than single featured, broader in impact.

**Layout:**
- 2-3 testimonials in a row (desktop). Each in a card format.
- Card styling: subtle shadow (shadow-sm or shadow-md token), rounded corners (radius-md),
  consistent padding (space-6 internal).
- Each card: quote (2-3 sentences), name, role, company, headshot (48-64px).
- Mix of outcomes, roles, and industries for maximum relatability.

**Responsive behavior:**
- **Mobile (default):** Stack cards vertically with space-4 gap between them. Each card
  full-width.
- **Tablet (md breakpoint):** 2-column grid if 4+ testimonials. Otherwise stack.
- **Desktop (lg breakpoint):** 3-column grid. All cards same height (CSS grid with
  equal row heights or flexbox with align-stretch).

**Content requirements:**
- Vary the testimonials. Different industries, different roles, different outcomes.
  The reader should see someone like themselves in the grid.
- Keep quotes consistent in length. One long quote and two short ones looks unbalanced.
- Each quote must pass the specificity test: could this quote only be about YOUR service?
  If it could describe any competitor, rewrite it.

**When to use:** You have 3+ strong testimonials from different audience segments.
Works well on services pages and landing pages where you serve multiple ICPs.

**When to avoid:** You only have 1-2 testimonials. A grid of two looks sparse. Use
single featured format instead.

---

## Testimonial: Video

**Purpose:** The highest-converting social proof format. Video testimonials convert
30-40% better than text testimonials because they are nearly impossible to fake.

**Layout:**
- Thumbnail with prominent play button overlay. Never autoplay.
- Thumbnail should show the person speaking (freeze frame from the video).
- Caption/name beneath the thumbnail: who they are and the key result.
- On play: expand to larger player or open in lightbox. Keep the user on the page.

**Technical requirements:**
- Keep under 90 seconds. The first 10 seconds must hook.
- Caption/transcript required for accessibility and for users who browse with sound off.
- Lazy-load the video embed. Only load the iframe/player when the user clicks play.
  Show a static thumbnail until then.
- Poster image with play button is the initial state. This is fast and lightweight.

**Responsive behavior:**
- **Mobile (default):** Full-width video thumbnail. Play button must be 48px minimum
  touch target. Caption below.
- **Desktop (lg breakpoint):** Can be inset (max-width 800px centered) or full-width
  depending on page layout.

**When to use:** You have professionally shot video testimonials. The person is articulate
and the production quality is decent. Amateur video can work if the person is genuine.

**When to avoid:** Low-quality recordings, rambling testimonials, anything over 2 minutes.
Bad video testimonials are worse than no video at all.

---

## Metrics Bar

**Purpose:** Quantified credibility. Large numbers create instant authority.
Works because numbers feel objective and are processed faster than text.

**Layout:**
- 3-4 key metrics in a horizontal row. More than 4 dilutes impact.
- Each metric: large number (display or h2 typography token) + descriptive label beneath
  (small text, muted color).
- Dividers between metrics (subtle border or spacing).
- Optional: animated count-up on scroll into view (respect prefers-reduced-motion).

**Example metrics:**
- "28 Years" / "Building Businesses"
- "90 to 5" / "Hours Per Week"
- "30+" / "Countries Visited"
- "500+" / "Leaders Coached"

**Content requirements:**
- Numbers must be real and verifiable. Sceptical audiences will question inflated numbers.
- Labels must be specific. "Clients Served" beats "Happy Clients." Measurable beats emotional.
- Choose metrics that demonstrate different dimensions of credibility: experience (years),
  scale (clients/countries), and results (hours saved, revenue generated).

**Responsive behavior:**
- **Mobile (default):** 2x2 grid or vertical stack. Each metric needs breathing room.
  Numbers remain large (h3 minimum). Don't shrink them to fit a row.
- **Tablet (md breakpoint):** 4-across if space allows, otherwise 2x2.
- **Desktop (lg breakpoint):** Single row, evenly distributed. Max-width container.

**Accessibility:**
- Numbers should be in text (not images). Screen readers can read them.
- If using count-up animation, the final number must be in the DOM from the start
  for screen readers. The animation is visual enhancement only.

---

## Trust Signal Limits

Research on trust signal density and conversion:

- **1-3 trust signal TYPES:** 23% better conversion than pages with none.
- **4-6 types:** Diminishing returns. Still positive, around 12% lift.
- **7+ types:** 8% WORSE than no trust signals at all. The page looks desperate.

**Types include:** testimonials, logos, metrics, certifications, awards, media mentions,
case studies, guarantees, security badges. Each is one type.

**For sceptical ICPs:** Restraint IS the trust signal. Pick your strongest 2-3 types
and deploy them strategically. One strong testimonial after the services section. One
logo bar below the hero. One metrics bar before the final CTA. That is enough.

Piling on every trust signal you have communicates insecurity. Confident brands
show enough proof and let the work speak.

---

## Case Study Block

**Purpose:** Deep proof for high-ticket decisions. Shows the full journey from
problem to solution to result. Most effective for B2B and premium services.

**Layout:**
- Before/after format with specific numbers. The contrast is the story.
- Structure: Problem (1-2 sentences) / Solution (1-2 sentences) / Result (specific metrics).
- Photo of the client (real, not stock). Builds connection.
- "Read full story" link for depth. Don't force the full case study on the page.
- Card or section format with subtle background differentiation.

**Content requirements:**
- Problem must be recognisable to the ICP. They should read it and think "that's me."
- Solution should reference YOUR specific approach, not generic methodology.
- Result must include numbers. Revenue, time saved, percentage improvement.
- Client must consent to being featured. Real name, real company.

**Responsive behavior:**
- **Mobile (default):** Vertical stack. Problem / Solution / Result as distinct blocks
  with clear visual separation. Photo at top or inline with the problem section.
- **Desktop (lg breakpoint):** Can use a two-column layout (photo + story side by side)
  or a timeline-style layout for multiple case studies.

**When to use:** High-ticket services, B2B sales, consulting, coaching. Where the
buyer needs confidence in the investment.

**When to avoid:** Low-ticket products, impulse purchases, audiences who don't need
deep proof to convert.

**Accessibility:**
- Before/after images (if used) need descriptive alt text explaining the change.
- Use semantic heading hierarchy within the case study block.
- "Read full story" links need context: "Read Sarah Chen's full story" not just "Read more."
