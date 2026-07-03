# CRO Design Principles Reference

Every design decision either helps or hurts conversion. This reference codifies the
research-backed patterns so design decisions are grounded in evidence, not opinion.

---

## The LIFT Model (Chris Goward / WiderFunnel)

The dominant framework for evaluating any conversion touchpoint. Six factors:

1. **Value Proposition** (the vehicle) — Why should someone choose you over alternatives?
   Must be immediately clear. If a visitor can't articulate your value prop after 5 seconds
   on the page, the design has failed.

2. **Relevance** — Does the page match the visitor's intent? Message match between
   the traffic source (ad, email, search result) and the landing page is critical.
   Mismatch = immediate bounce. CXL found paid search visitors convert 38% better
   on short-form pages; organic visitors prefer long-form.

3. **Clarity** — Can the visitor understand the offer in 5 seconds? Two types:
   - Design clarity: visual hierarchy guides the eye to what matters
   - Content clarity: copy is plain, specific, benefit-oriented
   - Clarity TRUMPS persuasion. Always.

4. **Urgency** — Reason to act now. Two types:
   - Internal: visitor's pre-existing need (health scare, missed family event)
   - External: marketer-introduced (deadline, limited availability)
   - WARNING: fake urgency destroys trust with sophisticated audiences.
     For sceptical ICPs, internal urgency (naming the pain) beats countdown timers.

5. **Anxiety** — Fears, doubts, hesitations that prevent action.
   - Design response: trust signals, guarantees, social proof placed AT decision points
   - Not scattered. Not in the footer. NEXT TO the CTA where doubt occurs.

6. **Distraction** — Elements that pull attention from the goal.
   - Every element on the page either supports the conversion or competes with it.
   - Navigation links, competing CTAs, decorative elements, sidebar content — all potential distractions.
   - One primary CTA per viewport section. Everything else is subordinate.

---

## The 5-Second Test

Can a stranger understand three things in 5 seconds?
1. What is this? (what you offer)
2. Who is it for? (who you help)
3. What should I do next? (the CTA)

If any of these fail, the design needs to change before anything else matters.
Pages that nail the first 5 seconds convert at 2-5x the rate of pages that don't.

**Design implications:**
- Hero headline must be the largest text element on the page
- CTA must be visually distinct from everything else (colour, size, whitespace)
- Remove any visual noise competing for attention in the first viewport
- Use directional cues (gaze direction in photos, arrows, whitespace) toward the CTA

---

## Hero Section Patterns That Convert

Seven essential elements (research-backed):

1. **Headline** — Under 10 words, benefit-driven. Not what you do, but what they get.
   Headline optimisation alone: 27-104% conversion lift.

2. **Subheadline** — Under 25 words. Explains the "how" to the headline's "what."

3. **One primary CTA** — Action verb, benefit-oriented. "Start your free trial" beats "Submit."
   "Get my quote" beats "Click here." "Apply" outperforms "Buy Now" for high-ticket.
   Changing "Sign up for free" to "Trial for free": 104% increase.

4. **Visual proof** — Product screenshot, demo, or hero image showing the outcome in action.
   The right hero visual alters conversion by 20%+. Real photography beats stock by
   a significant margin for trust-driven audiences.

5. **At least one trust signal** — Logo bar, badge, or single testimonial. Above the fold.

6. **Message match** — Headline mirrors the traffic source. If the ad says "escape your
   60-hour weeks", the landing page headline must echo that exact language.

7. **Mobile-first** — 83% of landing page traffic is mobile. Design the mobile version first.

**Common failures:**
- Hero image with no clear subject (abstract backgrounds, generic stock)
- Headline that describes the company instead of the visitor's outcome
- CTA hidden below the fold or blending into the colour scheme
- Multiple CTAs fighting for attention in the same viewport

---

## Social Proof Hierarchy

Not all social proof is equal. Ranked by conversion impact:

| Type | Conversion lift | When to use |
|------|---------------|-------------|
| Video testimonials (recognisable customers) | 30-40% | High-ticket services, coaching |
| Detailed testimonials (photo, name, specific outcome) | 15-25% | Any service/product page |
| Case studies (before/after with ROI data) | High (varies) | B2B, professional services |
| User counts ("Trusted by 50,000+") | Moderate | Bandwagon effect, SaaS |
| Client logos | Moderate | B2B credibility, less effective than testimonials by 35% |
| Star ratings / reviews | Up to 270% | E-commerce, products |
| Generic unattributed quotes | 2-5% | Almost useless. Avoid. |

### Placement Rules
- Social proof goes AT decision points — near CTAs, adjacent to pricing, by form fields
- At least one trust signal above the fold
- ROI-specific testimonials directly below primary CTA (the "final nudge")
- 90% of people say social proof influences buying decisions

### Trust Signal Limits
- 1-3 trust signal TYPES: 23% better conversion than zero
- 7+ trust signal TYPES: 8% WORSE than 1-3 (triggers "trying too hard" reaction)
- Only use recognised badges (industry certifications, known logos)
- Unfamiliar badges actually DECREASED trust by 12%

---

## CTA Design Rules

### Copy
- Benefit-oriented action verbs: "Get", "Start", "Book", "Apply", "Discover"
- First person can work: "Get MY quote" vs "Get YOUR quote"
- Supporting micro-copy beneath the CTA lifts clicks 10-20%:
  "No credit card required" / "Cancel anytime" / "Takes 30 seconds"

### Visual
- CONTRAST is what matters, not colour. The CTA must be the most visually distinct element.
- Squint test: if the CTA disappears when you squint at the page, increase contrast.
- Minimum height: 48px (mobile touch target). Generous horizontal padding.
- Use the accent colour ONLY for interactive elements. This trains the eye.
- Rounded corners (8-12px radius) outperform sharp corners for approachability.
- Drop shadow or elevation gives the CTA dimensionality and draws attention.

### Placement
- Primary CTA above the fold, always
- Repeat CTA after each proof section on long-form pages
- Mobile: consider sticky CTA at bottom of viewport
- Placing CTA prominently increased blog revenue by 83%

### Quantity
- One primary CTA per page section. No competing actions.
- Secondary CTAs (lower commitment) visually subordinate — text link or ghost button.
- Multiple competing CTAs create decision paralysis (Hick's Law).

---

## Form Design

### Field count drives conversion more than any other variable
- 3 fields: 25% completion rate
- 4 fields: 20% completion rate
- Reducing from 11 to 4 fields: 120% conversion increase
- Each additional field reduces completion by 10-20%
- Sweet spot for most use cases: 3-5 fields

### Multi-step vs single-step
- Multi-step forms convert 86% higher than single-step overall
- Best for complex requests needing 6+ data points
- Single-step better for simple actions (newsletter, single CTA)
- Progress bars boost completion by 20-30%
- CAUTION: visible step counts can backfire — users calculate remaining effort

### Friction reduction
- Single-column layout is 15.4 seconds faster than multi-column
- Inline validation reduces errors by 22%, cuts completion time by 42%
- Smart defaults and auto-fill reduce perceived effort
- Mobile-optimised forms saw 40% decrease in drop-off
- Label placement: above the field is fastest for completion; inline/floating labels save space

### Error handling
- Show errors inline, next to the field — not in a summary at the top
- Use encouraging language: "Please enter your email" not "Error: invalid input"
- Preserve all entered data on error — never clear the form
- Real-time validation prevents frustration better than submit-time validation

---

## Psychology Principles in Design

### Cialdini's Principles Applied
| Principle | Design application |
|-----------|-------------------|
| Reciprocity | Give value first (free tool, guide, quiz results) before asking for commitment |
| Commitment | Micro-conversions build toward macro (quiz > email > trial > purchase) |
| Social Proof | Testimonials, reviews, user counts at decision points |
| Authority | Expert endorsements, media logos, certifications, data citations |
| Liking | Brand personality, real photography, conversational copy |
| Scarcity | Must be honest. Fake scarcity destroys trust with sophisticated audiences. |
| Unity | Community framing ("Join 10,000 founders"), shared identity language |

### Key Cognitive Biases
| Bias | Design response |
|------|----------------|
| Anchoring | Show original price before discount. Show premium plan first. |
| Loss aversion | "Don't miss out" beats "Get access." Frame what they'll lose by not acting. |
| Default effect | Pre-select the recommended plan. |
| Paradox of choice | Limit plans to 3. One primary CTA. Reduce navigation options. |
| Endowment effect | Free trials, personalised results before signup. |
| Serial position | Put the most important item first or last in any list. |
| Von Restorff | The CTA that looks different from everything else gets clicked. |

### Fogg Behavior Model (B = MAP)
Behaviour happens when Motivation + Ability + Prompt converge:
- Present your CTA (prompt) when motivation peaks and friction is lowest
- If motivation is low: improve value prop, use emotional appeal
- If ability is low: reduce friction (fewer fields, clearer instructions, lower commitment)
- If prompts are missing: add CTAs at natural decision points

**Motivation peaks at these moments:**
- Immediately after reading a compelling testimonial or case study
- After seeing a before/after transformation
- At the end of a value-loaded content section
- After a quiz or assessment reveals a gap

---

## Copy Readability and Conversion

The data is unambiguous:
- 5th-7th grade reading level: 11.1% conversion
- College level: 5.3% conversion
- Professional level: 5.5% conversion
- **Simpler copy converts 2x better.** No exceptions found in the research.

Design implication: the typography system must prioritise readability above all else.
Large body text (18px+), generous line-height, appropriate line length (45-75 characters).
The best copy in the world fails if it's hard to read.

**Readability rules for the design system:**
- Body text minimum 18px on desktop, 16px on mobile
- Line-height 1.5-1.7 for body copy
- Maximum line length 75 characters (measure with `ch` units in CSS)
- Contrast ratio 4.5:1 minimum for body text (WCAG AA)
- Heading hierarchy must be visually obvious without reading the text
- Paragraph spacing > line spacing (clear separation between ideas)

---

## Page Speed and Conversion

- Each 1-second delay: 7% conversion drop
- Under 2 seconds is the trust threshold for professional audiences
- 53% of mobile users abandon sites taking longer than 3 seconds
- Performance is a design decision, not a development afterthought

**Design system implications:**
- Optimise image formats: WebP/AVIF with fallbacks, lazy loading below fold
- System font stacks or variable fonts (one file, multiple weights) — avoid loading 4+ font files
- CSS custom properties over runtime JavaScript for theming
- Minimise layout shift: define explicit dimensions for images, embeds, dynamic content
- Critical CSS inlined, non-critical deferred
- Animation: prefer CSS transforms and opacity (GPU-composited) over layout-triggering properties

---

## Pricing Page Design

Pricing pages are one of the highest-leverage conversion surfaces. Rules:

- **Three tiers maximum.** More than three triggers choice paralysis.
- **Highlight the recommended plan.** Visual emphasis (colour, border, badge, scale) on the plan you want them to choose.
- **Anchor high.** Show the premium plan first (left-to-right) or make it most visually prominent.
- **Annual pricing default.** Pre-select annual billing; show monthly as an option.
- **Feature comparison tables** work for complex products but must be scannable — highlight differences, not similarities.
- **Money-back guarantee** next to the purchase CTA, not in the footer.
- **Remove navigation** on pricing pages for paid traffic. Fewer exits = higher conversion.

---

## Mobile-Specific Conversion Rules

Mobile is not a smaller desktop. Different constraints, different patterns:

- **Thumb zone:** Primary CTA within easy thumb reach (bottom 40% of screen)
- **Tap targets:** Minimum 48x48px with 8px spacing between targets
- **Sticky CTA:** Fixed bottom bar with primary action — proven lift on long-form pages
- **Accordion content:** Collapse secondary information; let users expand what they need
- **Click-to-call:** For service businesses, a phone CTA converts 2-3x vs form on mobile
- **Vertical flow only:** No horizontal scrolling, no side-by-side layouts below 768px
- **Input types matter:** Use `type="email"`, `type="tel"` — triggers the right keyboard

---

## Design System Integration Checklist

When generating a design system, verify every token decision against these CRO principles:

- [ ] Accent colour reserved exclusively for interactive/CTA elements
- [ ] Typography scale ensures 5-second readability (hero > subhead > body hierarchy)
- [ ] Button styles include primary (high contrast), secondary (ghost/outline), and text variants
- [ ] Form field styles include focus, error, success, and disabled states
- [ ] Spacing tokens create clear separation between content sections
- [ ] Trust signal component patterns defined (logo bar, testimonial card, badge row)
- [ ] Mobile breakpoints enforce single-column layout and thumb-zone CTA placement
- [ ] Animation tokens limited to transforms/opacity for performance
- [ ] Colour contrast ratios meet WCAG AA (4.5:1 body, 3:1 large text) minimum
- [ ] Loading state patterns defined (skeleton screens over spinners — perceived speed)
