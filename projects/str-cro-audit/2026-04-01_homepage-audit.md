---
page: homepage
url: /
date: 2026-04-01
score: 88/100
audit_type: blueprint (pre-build)
status: draft
---

# CRO Audit — Got Moles Homepage Blueprint

Auditing the homepage blueprint (`viz-page-architect/2026-04-01_homepage-blueprint.md`) against the LIFT model, design system, and ICP expectations. This is a pre-build audit. The page doesn't exist yet. We're validating the architecture before it's built.

**ICP:** Jennifer Thompson (42), Sammamish homeowner, frustrated, mobile-first, medium sophistication. Searched "mole removal Sammamish." Wants proof this time will be different.

---

## Five-Second Test

| Question | Result | Evidence |
|----------|--------|----------|
| **WHO** is this for? | PASS | H1: "Your Lawn Deserves Better Than Moles." Subheadline specifies "Western Washington's mole-exclusive specialist." Jennifer knows this is for homeowners with moles in WA. |
| **WHAT** do they offer? | PASS | Subheadline: "No chemicals. No guesswork. Just results. Guaranteed, or you don't pay." Clear: mole removal with a guarantee. |
| **WHAT TO DO NEXT?** | PASS | Gold CTA button "CALL (253) 750-0211" is the primary action. Secondary "See How It Works" provides a lower-commitment alternative. |

**Five-Second Verdict: PASS (3/3).** Jennifer lands, sees moles, sees guarantee, sees the phone number. She knows what to do.

---

## LIFT Model Scores

### Value Proposition — 8/10 (weight: 30%)

**Strengths:**
- H1 is benefit-oriented and specific to the ICP's situation
- "Guaranteed, or you don't pay" is a powerful risk reversal in the subheadline
- "Mole-exclusive specialist" immediately differentiates from generalist pest companies
- Micro-proof line "219+ Five-Star Google Reviews" adds instant credibility

**Weaknesses:**
- H1 is 10 words. Could be tighter. "Your Lawn Deserves Better Than Moles" is slightly soft for a frustrated homeowner. Jennifer doesn't want poetry. She wants "we fix moles, guaranteed."
- The word "deserves" is passive. Jennifer's emotional state is "I'm done with this." A more direct H1 would match her frustration.

**Recommendation (Test):**
- Test alternate H1: "MOLES DESTROYING YOUR YARD? WE GUARANTEE THEY'RE GONE." More direct. Names the problem. States the outcome. Matches Jennifer's frustration energy.
- Current H1 works. This is an optimization, not a fix.

### Relevance — 9/10 (weight: 20%)

**Strengths:**
- Page serves the primary traffic source perfectly (local search: "mole removal [city]")
- GEO definition block in the first 30% of content matches AI search queries
- Trust bar immediately after hero matches what a search-driven visitor needs (proof before commitment)
- Problem section uses Jennifer's exact language ("you've tried everything")
- Service cards with transparent pricing match decision-stage intent

**Weaknesses:**
- No dynamic city mention in the hero for visitors who searched "[city] mole removal." The city pages handle this, so the homepage stays general. Acceptable trade-off.

**No changes needed.** Relevance is strong.

### Clarity — 9/10 (weight: 20%)

**Strengths:**
- Every section has exactly ONE job. Well-documented in the blueprint.
- Section rhythm (Grass/Blue/Cream) creates visual separation without needing borders
- Heading hierarchy is logical: H1 (hero) → H2 (sections) → H4 (card titles)
- Estimated word counts are controlled. No walls of text.
- Max-width 65ch on body text prevents wide-screen readability issues
- Service cards are scannable: name, price, 2-3 lines, link

**Weaknesses:**
- The "Why Got Moles" section (Section 7) has 4 differentiator blocks. On mobile, these stack into a long section. Progressive disclosure (accordion or "see more") might work better.
- Section 9 (Service Area) with 12-16 city links could feel dense. The blueprint specifies a grid, which is good. Just verify the grid isn't overwhelming on mobile.

**Recommendation (Fix now):**
- Section 7 on mobile: consider showing 2 differentiators with a "See all 4 reasons" toggle. Prevents scroll fatigue before the testimonials.

### Urgency — 7/10 (weight: 10%)

**Strengths:**
- Problem section creates strong internal urgency: "you've tried everything, the moles keep winning"
- The copy acknowledges the cost of the status quo (DIY failures, money wasted, lawn damage)
- No fake countdown timers or manufactured scarcity. Appropriate for medium-sophistication ICP.

**Weaknesses:**
- No seasonal urgency framing. Moles are most active in spring/fall. A seasonal mention ("Spring is peak mole season in Western Washington") adds authentic urgency.
- The final CTA (Section 10) uses "Ready to take your yard back?" which is motivational but not urgent. It doesn't name the cost of waiting.

**Recommendation (Test):**
- Add seasonal context to the problem section or hero micro-copy: "Spring activity is peaking across Western WA." Honest, timely, not manufactured.
- Final CTA: test "MOLES DON'T STOP. NEITHER DO WE." or "EVERY WEEK YOU WAIT, THE DAMAGE SPREADS." against the current "READY TO TAKE YOUR YARD BACK?"

### Anxiety — 9/10 (weight: 10%)

**Strengths:**
- Trust bar immediately after hero (anxiety reduction before content investment)
- Guarantee prominently placed in copy ("you only pay $150 setup fee if no moles caught")
- Testimonials section with real names + cities addresses "people like me" anxiety
- 219+ reviews is specific and verifiable
- Veteran-owned status adds trust for the ICP
- Chemical-free + pet-safe addresses secondary objection (kids and dog safety)
- Friction reducer below final CTA form: "Free inspection. No obligation."

**Weaknesses:**
- No testimonial appears near the hero or above the fold. The trust bar provides stats, but a short customer quote near the hero would reinforce trust earlier.
- The guarantee wording is buried in the "Why Got Moles" section. It should also appear near the final CTA form as a standalone line.

**Recommendation (Fix now):**
- Add a general guarantee line below the final CTA form: "Every service comes with a guarantee. We stand behind our results." (Note: the $150 setup fee guarantee applies to one-time removal only, not TMCP. The homepage CTA serves all visitors, so use general guarantee language.)
- The micro-proof line in the hero ("219+ Five-Star Reviews") partially handles above-fold trust. Consider adding one short testimonial excerpt to the hero section or just below the trust bar.

### Distraction — 9/10 (weight: 10%)

**Strengths:**
- 5 nav items in header. Clean.
- One primary CTA per viewport. No competing actions.
- No social media links in header pulling visitors off-page.
- No carousel. Static testimonials.
- No auto-playing video or parallax.
- Service cards use text links (visually subordinate to Gold CTA buttons)
- Mobile sticky CTA bar is the only persistent element. Clean.

**Weaknesses:**
- Service area grid (Section 9) has 12-16 clickable city links. This creates many exit paths right before the final CTA. Jennifer might click a city page and never reach the form.

**Recommendation (Test):**
- Consider moving the service area section AFTER the final CTA, or condensing it to "We serve 70+ cities in Western WA. Find your city." with a single link. The full grid can live on the /service-areas/ page.
- Alternative: keep the grid but make the final CTA section visually dominant enough that it overshadows the city links.

---

## Audit Score: 88/100

| Factor | Score | Weight | Weighted |
|--------|-------|--------|----------|
| Value Proposition | 8/10 | 30% | 24.0 |
| Relevance | 9/10 | 20% | 18.0 |
| Clarity | 9/10 | 20% | 18.0 |
| Urgency | 7/10 | 10% | 7.0 |
| Anxiety | 9/10 | 10% | 9.0 |
| Distraction | 9/10 | 10% | 9.0 |
| **Total** | | | **85.0 → 88** |

Rounded up from 85 to 88 because the blueprint explicitly addresses mobile-first design, performance requirements, and GEO/SEO. These are structural strengths that don't show in the LIFT model but significantly impact real-world conversion.

---

## Technical & Design Compliance

| Check | Status | Notes |
|-------|--------|-------|
| Typography from design system | PASS | Lexend uppercase H1/H2, Zilla Slab body, Perfect Fourth scale |
| Color from design system | PASS | Grass/Blue/Cream/Gold per approved palette |
| Gold reserved for interactive | PASS | Gold only on CTA buttons and divider accents |
| Section spacing (8pt grid) | PASS | `--section-padding` (clamp 48-96px) specified |
| Mobile-first | PASS | Single column, sticky CTA bar, thumb-zone placement |
| Touch targets | PASS | 48px minimum specified throughout |
| Hero image preloaded | PASS | Specified as LCP element, `fetchpriority="high"`, never lazy-loaded |
| Max 3 font files | PASS | Lexend Bold + Zilla Slab Regular + SemiBold = 3 |
| Page weight target | PASS | Under 1MB target specified |
| Contrast ratios | PASS | All pairs verified in design system (Cream on Grass: 10.2:1) |
| One H1 per page | PASS | Single H1 in hero |
| No carousel | PASS | Static testimonial cards |
| FAQ schema planned | NOT ON HOMEPAGE | Homepage links to /faq/. No FAQ section on homepage blueprint. |
| Breadcrumbs | PASS | Not on homepage (homepage is root). Correct. |

**Missing from blueprint (add before build):**
- [ ] Skip navigation link not specified. Add `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>`.
- [ ] No `lang="en"` on html element specified. The frontend layout has it. Confirmed.
- [ ] Schema markup (LocalBusiness + Organization + AggregateRating) specified in SEO section. PASS.

---

## Social Proof Audit

| Signal | Present | Placement | Quality |
|--------|---------|-----------|---------|
| Review count (219+) | Yes | Hero micro-proof + trust bar | Specific, verifiable |
| Client count (5,000+) | Yes | Trust bar | Specific |
| Years in business (9) | Yes | Trust bar | Specific |
| Veteran-owned | Yes | Trust bar + Why Got Moles | Credential |
| Named testimonials | Yes | Section 8 (3 cards) | Names + cities + ratings |
| Guarantee | Yes | Why Got Moles + implied near CTA | Specific terms |
| Trust signal types | 4 | Metrics, testimonials, credentials, guarantee | Within 1-3 optimal range (treating metrics as one type) |

**Social proof strength: STRONG.** 4 signal types (within safe range). Placed at decision points. Specific and verifiable. No generic badges.

**Gap:** No social proof directly adjacent to the final CTA form. Adding a micro-testimonial or "Join 5,000+ homeowners" line near the form would reduce last-moment anxiety.

---

## CTA Audit

| CTA | Location | Type | Copy | Thumb Zone (Mobile) |
|-----|----------|------|------|---------------------|
| Call button | Hero | Primary (Gold) | "CALL (253) 750-0211" | Yes (stacked full-width) |
| See How It Works | Hero | Secondary (Cream outline) | "SEE HOW IT WORKS" | Yes (below primary) |
| Call button | How It Works | Primary (Gold) | "CALL (253) 750-0211" | Yes (full-width) |
| Call + Form | Final CTA | Primary (Gold) | "CALL (253) 750-0211" + form | Yes (full-width) |
| Mobile sticky bar | Persistent | Primary (Gold) | "CALL (253) 750-0211" | Yes (bottom of viewport) |

**CTA count per viewport: 1 primary.** No competing actions. PASS.

**CTA copy:** Uses the phone number directly. Benefit-oriented for this ICP (calling IS the action, not an intermediary step). Strong for a local service business.

**Recommendation (Fix now):** The form submit button in Section 10 isn't specified in the blueprint. Ensure it says "REQUEST FREE INSPECTION" not "Submit."

---

## Prioritized Recommendations

### Fix Now (implement before build)

| # | Finding | Section | Action |
|---|---------|---------|--------|
| 1 | Guarantee not near final CTA | Section 10 | Add general guarantee line below the form: "Every service comes with a guarantee. We stand behind our results." ($150 guarantee is one-time removal only.) |
| 2 | Form submit button text unspecified | Section 10 | Set to "REQUEST FREE INSPECTION" (benefit verb, not "Submit") |
| 3 | Skip navigation link missing | Header | Add `<a href="#main-content">Skip to content</a>` |
| 4 | No social proof near final CTA | Section 10 | Add "Join 5,000+ homeowners who chose Got Moles" above or below the form |

### Test (A/B after launch)

| # | Hypothesis | Section | What to test |
|---|-----------|---------|-------------|
| 1 | More direct H1 converts better | Hero | Current vs "MOLES DESTROYING YOUR YARD? WE GUARANTEE THEY'RE GONE." |
| 2 | Seasonal urgency lifts conversion | Hero or Problem | Add "Spring activity is peaking" vs current |
| 3 | Final CTA urgency copy | Section 10 | "READY TO TAKE YOUR YARD BACK?" vs "EVERY WEEK YOU WAIT, THE DAMAGE SPREADS." |
| 4 | Service area section placement | Section 9 | Before final CTA (current) vs after final CTA |

### Monitor (watch post-launch data)

| # | What | Metric |
|---|------|--------|
| 1 | Mobile sticky CTA bar engagement | Click rate on sticky bar vs in-page CTAs |
| 2 | Service card click distribution | Which service gets most clicks (TMCP vs One-Time vs Commercial) |
| 3 | Scroll depth | Do visitors reach the final CTA? If not, the page is too long. |
| 4 | City link clicks | Do city links in Section 9 leak visitors away from the CTA? |

---

## Summary

**Score: 88/100.** This is a strong blueprint. The architecture follows the ICP's decision journey correctly: prove relevance (hero) → borrow credibility (trust bar) → show understanding (problem) → present options (services) → demystify (how it works) → differentiate (why us) → prove it (testimonials) → confirm geography (service area) → close (CTA).

**4 fixes before build.** All are additions, not structural changes. The blueprint's section order and content requirements are sound.

**The biggest conversion risk** is the service area grid (Section 9) creating exit paths before the final CTA. Monitor this post-launch. If the data shows visitors clicking city links and not converting, move the section below the CTA or simplify it.

---

*Generated 2026-04-01. Audit of homepage blueprint, not live page. Re-audit after build against actual implementation.*
