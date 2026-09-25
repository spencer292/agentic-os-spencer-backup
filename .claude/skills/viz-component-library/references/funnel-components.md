# Funnel and Conversion Components

Specifications for the six components that carry most of the conversion load on a modern lead-generation
site. Each one includes structure, content slots, responsive behaviour, states, accessibility and the
evidence behind the pattern.

Sources checked September 2026:
- WCAG 2.2 Recommendation, https://www.w3.org/TR/WCAG22/
- Baymard Institute on multi-column forms, https://baymard.com/blog/avoid-multi-column-forms
- Interact quiz conversion rate report 2026, https://www.tryinteract.com/blog/quiz-conversion-rate-report/
- Contentsquare and Crazy Egg sticky call-to-action findings summarised in
  https://foundrycro.com/blog/cta-button-conversion-rate-benchmarks-2026/

---

## 1. Sticky Mobile CTA Bar

**Purpose.** Keep the primary action reachable at every scroll depth on mobile, where the hero call to
action leaves the viewport within one or two swipes.

**Evidence.** A Contentsquare study covering 58 million mobile sessions across 400 commerce sites
found sticky bottom-bar calls to action on product pages produced 31% more conversions than
non-sticky equivalents, with 22% higher average order value and an 18 percentage point lower
abandonment rate. Crazy Egg analysis puts sticky calls to action at roughly 27% more clicks than ones
that scroll away. A published 2026 homepage split test recorded a 20.4% lift at 95.1% probability to
beat control. Persistent action bars on product pages show 12% to 28% lifts in deep-page conversion
across multiple tests.

**Structure.**
- Fixed to the bottom edge of the viewport, full width
- Height 64 px to 72 px including padding, so the button inside clears 48 px
- Background: elevated surface token, not transparent. A translucent bar over scrolling content
  fails contrast unpredictably
- A 1 px top border in the default border token, or a soft upward shadow, to separate it from content
- Contents, left to right: an optional short context label, then the primary button. On a
  service business, a two-button split of call and enquire also works, with the higher-intent action
  given the accent colour and the other given the secondary treatment

**Content slots.**
- Context label: 3 to 5 words, small text token, secondary text colour. Optional. Example shapes:
  a price, a duration, a availability line
- Primary button: 2 to 4 words, action verb first
- Never put micro-copy inside the bar. There is no room and it competes with the button

**Behaviour.**
- Hidden on first paint. Appears once the hero call to action has scrolled out of view, detected with
  an `IntersectionObserver` on the hero button rather than a scroll-position threshold
- Slide up over 200 ms with `transform: translateY()`, honouring `prefers-reduced-motion`
- Hides again when the page's own final call to action enters the viewport, so the visitor is never
  looking at two copies of the same button
- `z-index` above page content and below modals, dialogs and the cookie banner

**Accessibility. This is where sticky bars usually fail.**
- WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum) is an AA requirement. A fixed bottom bar hides the
  focused element as a keyboard user tabs down the page. Fix it with `scroll-padding-bottom` on the
  scroll container set to the bar's height, so the focused element is always scrolled clear
- The bar's own button must sit in the tab order at a sensible point, not trapped at the end
- Give the bar a landmark role and an accessible name, for example
  `role="region" aria-label="Primary action"`
- Content at the bottom of the page needs `padding-bottom` equal to the bar height, so the footer and
  legal links are never permanently covered
- The button meets the 48 px design rule, comfortably above the 24 by 24 CSS pixel WCAG 2.2 AA floor

**Responsive.** Mobile and small tablet only. Hide at the `md` breakpoint and above, where the sticky
header call to action does the same job without covering content.

**Performance.** Use `position: fixed` with `will-change: transform` only while the bar is animating,
then remove it. A permanently promoted layer costs memory on low-end devices. No images inside.

**When to avoid.** Pages with a single short viewport. Checkout and form pages where the action is
already on screen. Any page where the bar would cover a persistent element such as a media player.

---

## 2. Multi-Step Form and Quiz Step Card

**Purpose.** Convert a long information request into a sequence of small commitments, and turn a lead
capture into an engagement the visitor wants to finish.

**Evidence.** Across more than 80 million leads on the Interact platform, personality and
recommendation quizzes convert 40.1% of starters into leads. Strong funnels hold completion at 80% or
above, and anything under 60% signals a question flow that is too long, too vague or badly built for
mobile. Five to eight questions is the conversion sweet spot, and past eight the completion rate falls
faster than the segmentation improves. Progress indicators lift completion by roughly 20% to 30%.

**Structure of one step.**
- Progress indicator at the top: a bar or a row of dots, plus a text equivalent
- Question, set in the h3 or h4 typography token. One question per screen, never two
- Optional helper line under the question, small text token, explaining why the question is asked
- Answer options as clickable cards, not bare radio buttons
- Navigation row at the bottom: a primary Next button and a subordinate Back link

**Option card spec.**
- Full-width block on mobile, two-up on tablet and above when options are short
- Internal padding at the comfortable spacing token, 1 px default border, medium radius token
- Optional leading icon or letter badge, then the option label, then an optional one-line description
- Minimum height 56 px so the whole card is the target, not just the label
- Selected state: accent border at 2 px, a subtle accent background tint, and a check indicator.
  Never rely on the tint alone, because that is colour-only meaning
- Hover state on pointer devices only: border darkens one step
- Focus state: the standard focus ring, offset outside the card border

**Progress psychology.**
- Start the bar at 10% to 15% on the first question. People are more likely to finish a process that
  has visibly started
- Show progress as a proportion, not as "Question 3 of 9", because a visible remaining count invites
  the visitor to calculate the effort and leave
- Provide the count to assistive technology through `aria-valuetext` on the progress element, so
  screen reader users are not left guessing

**Advance behaviour.**
- Single-select questions may auto-advance about 250 ms after selection, which removes a tap. Always
  pair auto-advance with a working Back control, or the visitor is trapped by a mis-tap
- Multi-select questions never auto-advance
- Preserve every answer when the visitor goes back. Losing answers is the fastest way to lose the
  completion

**Email capture step.**
- Placed at the end, before the results, framed as a value exchange. "Get your results", never
  "Subscribe to our newsletter"
- One or two fields maximum. Email alone converts better than name plus email
- State plainly what arrives and how often, plus an unsubscribe promise

**Accessibility.**
- Each step is a `fieldset` with the question as its `legend`
- Option cards are real radio or checkbox inputs with a visually hidden native control, or elements
  with `role="radio"` and full arrow-key handling. Do not fake it with click handlers on a div
- Move focus to the new question heading on every step change, and announce the change through a
  polite live region
- The progress element uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin` and
  `aria-valuemax`
- Never trap focus inside the step. The visitor must be able to reach the page's skip link and footer

**Responsive.** Mobile is the primary case. Full-width cards, generous vertical rhythm, and the Next
button in the thumb zone. On desktop, constrain the step to a 640 px column and centre it.

**Performance.** Render steps client-side after the first. Do not fetch a new document per question.
Reserve the height of the tallest step or the page will shift on every advance.

---

## 3. Results Gauge and Tier Chip

**Purpose.** Show a scored outcome in a way the visitor understands instantly, and name the band they
fall into so the next action feels personal.

**Structure.**
- Gauge: a semicircular or full-circle arc showing the score against the range. Radius large enough
  that the numeral inside is at h1 scale or larger
- Score numeral at the centre, with the maximum shown beneath it in small text
- Tier chip directly below or beside the gauge: a pill carrying the band name
- One-sentence interpretation under the chip, in plain language, explaining what the band means
- The primary next action immediately after, because motivation peaks the moment a gap is revealed

**Gauge spec.**
- Draw with inline SVG using a stroked arc and `stroke-dasharray`, not with a chart library. It is
  one path and it needs no runtime dependency
- Track in the subtle border token, fill in the tier colour
- Animate the fill on entry over 600 to 900 ms with an ease-out curve, animating `stroke-dashoffset`
  only. Skip the animation entirely under `prefers-reduced-motion: reduce` and render the final state
- Never rely on the fill colour alone to convey the band. The chip carries the name in words

**Tier chip spec.**
- Pill shape, full radius token, horizontal padding at the comfortable spacing token
- Background at the tier colour's lightest tint, text at its darkest shade, verified at 4.5:1
- Small caps or medium weight, never all-caps without added letter spacing
- Three to five bands maximum. More than five and the visitor cannot tell the bands apart
- Band naming: describe the state, not a grade. A named state such as "Foundations in place" carries
  more meaning and less shame than "Level 2 of 5"

**Content slots.**
- Score: numeral only, plus the scale maximum
- Tier name: 1 to 4 words
- Interpretation: one sentence, 15 to 25 words, second person
- Primary action label: 2 to 4 words

**Accessibility.**
- The SVG gauge is decorative. Mark it `aria-hidden="true"` and put the real value in text next to it,
  because a screen reader cannot read an arc
- Expose the score as a sentence, for example "Your score is 62 out of 100, which places you in
  Foundations in place"
- Do not encode the band in colour alone. The chip text is the accessible carrier
- If the score updates live, wrap the text value in `role="status"`

**Responsive.** Mobile: gauge and chip stacked and centred, gauge no wider than 240 px so it does not
push the interpretation below the fold. Desktop: gauge left, interpretation and action right, or keep
the centred stack when the page is a dedicated results page.

**Performance.** Inline the SVG. Do not load a charting library for one arc. No layout shift, because
the SVG has a fixed `viewBox` and an `aspect-ratio`.

---

## 4. Sector and Segment Picker Cards

**Purpose.** Let a visitor self-select their situation, so the rest of the page, the follow-up, or the
next step can speak to them specifically rather than to everyone.

**Where it goes.** Early on a homepage when the offer genuinely differs by segment. As the first step
of a quiz. As a router on a services index page.

**Structure.**
- A grid of cards, three or four across on desktop, two across on tablet, one or two on mobile
- Each card: an icon or a small image, a segment label, and one line naming the outcome for that
  segment
- Cards are equal height, achieved with grid rather than fixed heights
- Optional count or proof line per card when it is genuinely true, for example a number of
  organisations served in that sector

**Content slots.**
- Segment label: 1 to 3 words, in the visitor's own language, not internal jargon. "Care homes", not
  "Regulated residential"
- Outcome line: 6 to 12 words, naming the result rather than the service
- Icon: a simple single-colour glyph in the accent or primary token, never a detailed illustration
  that fails at 48 px

**Rules that decide whether this component earns its place.**
- Six segments maximum. More than six and the visitor cannot scan them, and choice paralysis costs
  more than the personalisation gains
- Never include an "Other" card that leads nowhere. Either it routes somewhere useful or it is not
  a card
- The segments must be mutually exclusive from the visitor's point of view. If a visitor could
  reasonably pick two, the segmentation is wrong
- Only build this when the downstream experience actually differs. A picker that leads every segment
  to the same page adds a click and removes trust

**States.** Default, hover with a raised border, focus ring, selected with an accent border and tint
plus a check indicator, and disabled with reduced opacity and a reason given in text.

**Accessibility.**
- If picking navigates, each card is a single link wrapping the whole card, with the segment label as
  its accessible name. Do not nest a second link inside
- If picking selects, use a radio group with arrow-key navigation
- Icons are decorative, so `aria-hidden="true"` and the label carries the meaning
- Whole card is the target, well above the 48 px design rule

**Responsive.** Mobile: single column, or two columns when the labels are one word. Never a horizontal
scroller, because segments hidden off-screen are segments nobody picks.

**Performance.** Use inline SVG icons, not an icon font and not individual image requests. Lazy-load
any card images below the fold.

---

## 5. Trust Strip

**Purpose.** Place proof exactly where doubt occurs, which is next to the call to action, without
building a whole social proof section.

**Evidence.** One to three trust signal types produce roughly 23% better conversion than none. Seven
or more perform worse than having none at all, because the page reads as over-selling. Unfamiliar
badges measurably decrease trust, so only recognised marks belong here.

**Structure.**
- A single horizontal row directly above or below the primary call to action, or immediately under
  the hero
- Contents: three to six items, drawn from client logos, industry certifications, accreditation marks,
  a review platform rating, or a single hard number
- Optional label above the row in small text and secondary colour: "Trusted by", "Accredited by",
  "Rated on"
- Logos in greyscale at a consistent optical height of 28 px to 40 px, so no single mark dominates
- A subtle top and bottom border or a background tint separates the strip from what surrounds it

**Selection rules.**
- Only marks the audience will recognise. An unfamiliar badge adds noise, not credibility
- Mix types deliberately: one recognition signal, one competence signal, one volume signal beats
  three of the same kind
- A review platform rating belongs here only with the count attached. A rating without a count reads
  as invented
- Never invent or imply an accreditation. If the certification is pending, it does not go on the site

**Content slots.**
- Label: 2 to 3 words, optional
- Per item: the mark itself plus an accessible name
- Optional single stat: a number at h4 scale with a 2 to 4 word descriptor beneath it

**Accessibility.**
- Each logo image carries alt text naming the organisation, for example "British Safety Council
  accreditation". Never "logo" and never empty unless the name is already in adjacent text
- Wrap the strip in a container with an accessible name describing what the marks are
- Logos are not links unless the link goes somewhere that verifies the claim, in which case say so
- A star rating rendered as icons needs a text equivalent, for example "4.8 out of 5 from 219 reviews"

**Responsive.** Mobile: a two-row grid of three items, not a horizontal scroller, because items
scrolled out of view are not proof. Below three items, a single centred row. Desktop: single row,
evenly distributed inside the container.

**Performance.** SVG logos wherever possible. Lazy-load the strip if it sits below the fold. Set
explicit dimensions on every mark to prevent layout shift as they load.

---

## 6. Booking and Enquiry Form

**Purpose.** Capture an enquiry with the least possible friction, and set expectations so the visitor
knows what happens next.

**Evidence.** Baymard Institute research found form length and complexity are the top drivers of
abandonment, that the average checkout carries 11.8 fields, and that most sites can cut the fields
shown by default by 20% to 60%. Extensive multi-column layouts scatter attention and cause skipped
required fields, and 16% of sites still use them. Baymard also recommends a single combined full-name
field, unless a legal requirement forces separation, and accepting single-name entries.

**Field set. Five fields is the ceiling.**

| Field | Include? | Notes |
|-------|----------|-------|
| Full name | Yes | One field, not first plus last. Accept a single name |
| Email | Yes | `type="email"`, `inputmode="email"`, `autocomplete="email"` |
| Phone | Only if you will actually call | `type="tel"`, `autocomplete="tel"`. Mark optional if the enquiry works without it |
| Message or requirement | Yes | Free text. A short prompt in the label beats a long placeholder |
| Preferred time or date | Only for booking | Native date and time inputs, never a custom picker unless the native one genuinely cannot express the constraint |
| Organisation | Rarely | Only when routing genuinely depends on it |
| How did you hear about us | No | Ask this after conversion, not before |

Every field beyond the fifth costs completions. Before adding one, name the decision it changes. If
nothing changes, it does not go on the form.

**Layout.**
- Single column, always. The only exception is a group that reads as one entity, such as a date and
  a time
- Visible label above every field. Placeholder text is not a label, because it disappears on focus
  and fails for anyone who is interrupted
- Field height 48 px minimum, 1 px border in the default border token, medium radius
- Focus: border shifts to the accent colour plus a visible ring. Never `outline: none` alone
- Mark optional fields as optional. Do not mark required fields with an asterisk, because most fields
  should be required and the exception is what needs labelling
- Submit button uses the primary call to action styling, full width on mobile, with a benefit label
  such as "Send my enquiry" rather than "Submit"
- One privacy line beneath the button, small text, secondary colour: what you will do with the
  details and that you will not pass them on. This is a trust requirement, not a legal footnote
- One expectation line: when they will hear back and from whom

**States.**
- Inline validation on blur, not on every keystroke. A green tick on a valid field is worth having
- Error: error-colour border, an icon, and the message directly under the field. Never a summary
  banner at the top and never clearing what was typed
- Loading: button disabled with a spinner and a present-participle label such as "Sending"
- Success: replace the form in place with a confirmation naming the person and restating the response
  time. Do not redirect to a separate thank-you page unless conversion tracking demands it, and if it
  does, keep the confirmation content identical

**Accessibility.**
- Every input has a programmatically associated `label`
- Errors are linked with `aria-describedby` and the field carries `aria-invalid="true"`
- The error summary, if you use one in addition to inline errors, receives focus on submit failure
- Correct `autocomplete` tokens on every field, which is both a usability win and WCAG 2.2 SC 1.3.5
- Do not re-request information the visitor already gave earlier in the flow, which is SC 3.3.7
  Redundant Entry
- No cognitive-function test such as a puzzle CAPTCHA without an alternative, which is SC 3.3.8

**Responsive.** Mobile: full-width fields, 16 px minimum font size on inputs so iOS does not zoom,
correct `inputmode` on every field, submit button in the thumb zone. Desktop: constrain the form to
a 560 px to 640 px column.

**Performance.** No form library for five fields. Native validation plus a small amount of JavaScript
is faster and more accessible. Reserve space for error messages so the layout does not jump when one
appears.
