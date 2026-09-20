# User Flows

How visitors move from entry, through a decision, to a conversion. Every architecture decision has to
account for where they come from, what they need at that moment, and where they go next.

Sources checked September 2026:
- Interact quiz conversion rate report 2026, https://www.tryinteract.com/blog/quiz-conversion-rate-report/
- Baymard Institute form research, https://baymard.com/blog/avoid-multi-column-forms

---

## The Flow Model

Every flow has three phases. Name the page at each step, what the visitor needs there, and what would
make them leave.

**Entry.** Where they arrive and in what state. The landing page has to match that state, not the
state you wish they were in.

**Decision.** Where they weigh it up. This is where proof, clarity and anxiety reduction do their
work. Most flows lose people here, not at the form.

**Conversion.** The action. One action, the lowest-friction version of it that is still worth
capturing.

Write each flow as a table.

| Step | Page | Visitor state | What they need here | Drop-off risk | Success signal |

---

## Entry Point Strategy

Different sources deliver visitors in different states. The landing page has to meet the state.

| Source | Likely landing page | State on arrival | What they need first |
|--------|--------------------|-----------------|---------------------|
| Organic social post | Article or homepage | Curious, mildly interested | Relevance. Is this for me |
| Paid social or search ad | Campaign landing page | Sceptical, ad-aware | Message match. Mirror the ad promise exactly |
| Branded search | Homepage | Intent-rich, already aware | Confirmation. Yes, this is the right place |
| Non-branded search | Article or a service page | Problem-aware, not brand-aware | Value. Solve the problem first, sell second |
| AI answer engine citation | Whichever page was cited | Partially informed, verifying | The claim they saw, restated and evidenced on the page |
| Referral from a peer | Whatever was shared | High trust, transferred | Confirmation of what the referrer said |
| Email to an existing list | Article or offer page | Engaged, existing relationship | Something new. Do not re-sell what they know |
| Direct, typed URL | Homepage | High intent, returning | Clear navigation. Let them find what they came for |

**The architecture rule that follows.** Every page must work as an entry point. Visitors do not
always start at the homepage. Each page establishes enough context to orient a first-time visitor
without being redundant for a returning one.

---

## The Micro-Conversion Ladder

The full journey is a sequence of small commitments, each slightly larger than the last. Never ask
for a big commitment before earning the small ones.

```
Scroll  ->  Click  ->  Low-friction capture  ->  Nurture  ->
Small commitment  ->  Time commitment  ->  Conversation  ->  Purchase
```

| Stage | What earns it | What breaks it |
|-------|---------------|----------------|
| Scroll | The hero passing the five-second test | A headline about the company instead of the visitor |
| Click | Internal links and a clear next step | Dead-end sections with no forward path |
| Low-friction capture | A genuine value exchange, two fields maximum | Asking for a phone number to send a guide |
| Nurture | Content that stands alone as useful | A sequence that only sells |
| Small commitment | A cheap or free first step with a real outcome | A step that reveals nothing new |
| Time commitment | Clear expectations about what happens | Vague "book a chat" with no agenda |
| Conversation | Proof that they are talking to the right person | A discovery call that is actually a pitch |
| Purchase | Everything above, plus a risk reversal | Surprise pricing at the last step |

**Blueprint rule.** Every page blueprint states which stage it serves. A homepage serves the first
three. A pricing page serves the last three. A page that does not know its stage does not know its
job.

---

## Worked Flow 1: The Quiz or Scorecard Funnel

The highest-converting lead capture pattern available, and the one most often built badly.

**Why it works.** Across more than 80 million leads tracked on the Interact platform, personality and
recommendation quizzes convert 40.1% of starters into leads. Strong funnels hold completion at 80% or
above. Anything under 60% signals a question flow that is too long, too vague, or badly built for
mobile. Five to eight questions is the sweet spot, and past eight the completion rate falls faster
than the segmentation improves.

It works for three reasons. It gives value before asking for anything, which triggers reciprocity. It
builds commitment one question at a time, so each answer makes abandoning feel more wasteful. And it
reveals a gap the visitor did not have language for, which is the moment motivation peaks.

**The flow.**

| Step | Page | Visitor state | What they need here | Drop-off risk | Success signal |
|------|------|--------------|---------------------|---------------|----------------|
| 1 Entry | Quiz landing page | Problem-aware, curious | The outcome of taking it, and how long it takes | Vague promise. "Take our quiz" with no stated benefit | Quiz started |
| 2 Segment | Question 1, a segment picker | Deciding whether this is for them | To see themselves in the options | Options in your language, not theirs | Question 1 answered |
| 3 Diagnose | Questions 2 to 7 | Engaged, self-assessing | One question per screen, visible progress, easy back | Question 4 or 5, where novelty fades and effort registers | Question 5 answered |
| 4 Gate | Email capture | Invested, wants the result | A value exchange, not a subscription request | Asking for phone or organisation here | Email submitted |
| 5 Reveal | Results page | Motivated, gap exposed | The score, the band, and what it means in plain words | A generic result that could apply to anyone | Result viewed |
| 6 Convert | Results page action | Peak motivation | One next step that directly addresses the gap | Offering three next steps instead of one | Booking or purchase |
| 7 Nurture | Email sequence | Cooling | The detail the results page did not have room for | A sequence that ignores which band they landed in | Return visit |

**Architecture decisions this flow forces.**

- The quiz landing page carries no navigation once the quiz starts. It becomes a full-screen
  experience, because every navigation link at that point is a leak
- The results page is a real URL, not a modal, so it can be returned to and shared
- The results page is the highest-intent page on the site, so it gets the single strongest call to
  action and no competing links
- The nurture sequence branches by band. A funnel that sends every band the same email throws away
  the segmentation it just spent seven questions collecting
- Step 3 is where you lose people. Instrument it. Track abandonment per question, and if one question
  bleeds, it is the question, not the funnel

**The four mistakes that kill it.** Gating too early, before value has been delivered. Asking
questions that serve your CRM rather than the diagnosis. A results page that reveals nothing the
visitor could not have guessed. And offering more than one next step at the moment motivation peaks.

---

## Worked Flow 2: The Demo or Enquiry Request Funnel

The higher-consideration path. Fewer people enter it, and the ones who do are worth more.

**Why it is different from the quiz funnel.** The quiz funnel converts curiosity into a lead. This one
converts an existing intent into a conversation. The visitor is further along, more sceptical, and
more likely to be evaluating alternatives in another browser tab. Proof does more work here than
persuasion.

**The flow.**

| Step | Page | Visitor state | What they need here | Drop-off risk | Success signal |
|------|------|--------------|---------------------|---------------|----------------|
| 1 Entry | Service, sector or comparison page | Solution-aware, evaluating | Confirmation this fits their situation specifically | Generic positioning that fits everyone and nobody | Scroll past the fold |
| 2 Qualify | Sector or segment section | Checking fit | Language and proof from their own world | Proof from a sector they cannot map to theirs | Sector content engaged |
| 3 Prove | Case study or results section | Sceptical, comparing | A named client, a specific outcome, a verifiable claim | Unattributed claims and vague percentages | Case study opened |
| 4 De-risk | Objection or FAQ section | Weighing the downside | The answer to the objection they have not voiced | An FAQ that answers questions nobody asked | FAQ expanded |
| 5 Request | Booking or enquiry form | Ready, cautious about the sales call | To know exactly what the conversation will be | A form with eight fields and no agenda stated | Form submitted |
| 6 Confirm | Confirmation page or in-place state | Committed, slightly anxious | Who they will hear from, when, and what to prepare | A bare "thanks, we'll be in touch" | Confirmation seen |
| 7 Prepare | Confirmation email | Waiting | Something useful before the call happens | Silence between booking and the meeting | Meeting attended |

**Architecture decisions this flow forces.**

- The form is five fields maximum, single column, with one combined name field. Baymard research
  found form length and complexity are the top drivers of abandonment, and that most sites can cut
  the fields shown by default by 20% to 60%
- State the agenda next to the form. "A 20-minute call where we look at X and you leave with Y" beats
  "Book a call" by removing the fear of a pitch
- Put the strongest proof within sight of the form, not in a separate proof section further up
- The confirmation is a real page or a real in-place state, never a redirect to a bare thank-you.
  It names the person, restates the timing, and gives one thing to do or read before the meeting
- Offer an alternative channel. A phone number, or a direct email address, for the visitor who does
  not want a form. On mobile, click-to-call converts substantially better than a form for a service
  business
- If a calendar embed is offered, it does not replace the form. Some people book. Some people ask
  first. Support both

**The four mistakes that kill it.** A form that asks for information the sales conversation would
have surfaced anyway. Proof that is impressive but from the wrong sector. No stated agenda, so the
visitor assumes a hard sell. And a gap between booking and the meeting where nothing arrives.

---

## Internal Linking

Every page links forward. No dead ends. The visitor always has a clear next step.

1. **Forward momentum.** Every page has at least one link to a page deeper in the funnel
2. **Contextual links.** Links inside body copy connecting related ideas, placed where curiosity
   naturally peaks, not only in a related-content strip at the bottom
3. **Breadcrumbs.** On every page except the ones listed in `site-architecture.md`
4. **Related content.** Articles link to two or three related articles. Service pages link to the
   relevant case studies
5. **Consistent primary action.** The primary call to action on every page points at the same
   destination. Secondary actions can vary by page

**The dead-end audit.** After generating any blueprint, check that no section ends without a forward
path. If the last section is pure content with no link and no call to action, add one.

---

## Cross-Domain Journeys

Some businesses run the brand site on one domain and the conversion platform on another, for example
a marketing site plus a separate checkout or member area.

The rule: the visitor should never feel they have left the brand. Visual consistency in colour,
typography and voice has to carry across every domain. The blueprint states explicitly when a call to
action leaves the primary domain, so the build does not surprise anyone at launch, and so analytics
is configured for cross-domain tracking before traffic arrives rather than after.
