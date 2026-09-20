# Copy set spec

Every string the funnel needs, in the order the visitor meets them. The copy is the product. The
engine only renders it.

Count before you start. Three overall variants plus four categories times three tiers plus a CTA
band plus the landing page. That is fifteen result blocks for a four-category instrument, and the
engine throws at render if any one of them is missing.

---

## 1. Landing page

The landing page has one job: get the first question answered. It is not a sales page for the
client's service and it should not try to be.

| Block | What it carries | Rules |
|-------|-----------------|-------|
| Hero headline | The question the visitor already has | Their words. Often a live search phrase. Never the product name |
| Hero sub | The gap the score reveals, plus the time cost | Two sentences. State the question count and the time |
| Primary CTA | One button, action-first | "See where I stand" beats "Start quiz" |
| In two minutes you will know | Three bullets | Three specific things, each a thing they cannot answer today |
| You will receive | Three to five items with icons | Only what actually arrives. See the promise rule below |
| Steps | Three steps, one line each | Answer, get your score, get the plan |
| Trust | Whatever is true and specific | Named client, a real count, a credential. Nothing vague |

**The promise rule.** Every item under "you will receive" must exist at the moment the results page
renders. A landing page that promises an email bonus pack while the email hook is a no-op is a
broken promise on the first interaction, and it is a mistake that has shipped before. If email
delivery is not wired, the landing page promises only what appears on screen.

## 2. Gate copy

Write both positions, because the gate switch is a config flag and the client will want to test it.

**Gate after the questions, the default.** The visitor has answered ten questions and wants the
number. The copy trades on that:

- Heading: state that the score is ready
- Body: one line on what happens next and what does not happen. Name the thing they fear
- Button: the payoff, not the action. "Show me my score" beats "Submit"
- Under the button: one privacy line, plain, specific, no legal register

**Gate before the questions.** A colder ask on screen one, so it needs a reason to exist:

- Heading: what they are about to get
- Body: why the details are needed before rather than after
- Button: forward motion, "Start my assessment"
- Same privacy line

**Form rules for both positions.** Single column. One combined name field, not first and last split,
because a large share of people type their whole name into a "first name" field and then have to go
back. Three fields is the working maximum for a gate: name, email, and one segment or organisation
field. Visible labels, not placeholder-only. Inline validation, not on-submit reveal. Correct
`inputmode` and `autocomplete` tokens so the browser can fill it. A privacy line beside the button.

Error copy is specific and does not blame. "That email address is missing an @" beats "Invalid
input".

## 3. Overall result copy, three variants

Each variant is a `lede` and three paragraphs. Same shape every time so the page reads consistently
whatever the score.

| Paragraph | Job |
|-----------|-----|
| Lede | One sentence naming where they are, in plain words. Bold on screen |
| One | Recognition. Describe their situation back to them accurately enough that they relax |
| Two | The cause. Not their effort, not their ability. Something structural and fixable |
| Three | The bridge to the categories below. What the rest of the page will show them |

**The bottom tier is the most important copy in the pack.** Most people land there. Three rules:

1. Normalise it. If most people score low, say so. It is true and it is disarming.
2. Locate the cause outside the person. The business was designed around them, or the tool never
   knew their business. Never a character failing.
3. Promise the specific thing the page is about to do, then do it.

The top tier needs its own discipline. It is rare and it should feel rare, but it must still have a
next move, or the highest-intent lead on the list has no reason to book anything.

There is real evidence behind this section rather than taste. A controlled study of self-assessment
tools found that a self-assessment returning no tailored feedback was rated worse than plain
generic information, and had higher dropout than the tailored version. A bare score with no
personalised interpretation performs worse than not running the assessment at all.

## 4. Category result copy, every category by every tier

Each block is a `body` and a `topTip`.

**Body**, two or three sentences:
- Sentence one describes what the score means in their operational reality, not in abstract terms
- Sentence two names the cause or the risk, structurally
- Optional sentence three points at what changes when it is fixed

**Top tip**, one concrete first move:
- A specific action they could start today without buying anything
- No tool required. A tip that needs the client's product is an advert, not a tip
- Written as an instruction, not a suggestion
- Ends with the outcome, so they know when they have done it

Do not write the "Top Tip:" label into the string. The interface renders the label.

The three tiers of a category are three different diagnoses, not three intensities of the same
sentence. Low is "this is not happening". Medium is "this is partial, and here is what the partial
cases have in common". High is "protect it, and here is the failure mode at your level", usually
drift or complacency.

## 5. CTA band

One heading, one body, one button label, one destination. It repeats after the overall block and
after the categories. It does not become two destinations.

- Heading: the value of the conversation, not the format of it
- Body: three or four lines. What the call covers, what it is not, and the honest no-pressure line
  if the client can actually keep it
- Button: first person, specific. "Book my session" beats "Contact us"
- Destination: whatever the client already uses. A booking link, a purchase page, a community

Personalisation is worth the effort here. Greeting by first name on the results page, and a CTA
that reflects the tier, both have support in the general conversion literature, though not from any
quiz-specific study. Greet from device-local storage rather than putting the name in the URL, so a
shared result link never leaks a name.

## 6. Benchmark copy, only if the data exists

If the client holds real aggregate data, the results page can compare the visitor to their sector.
That is a strong block and it is worth asking for the file.

If they do not hold it:

- Ship without the benchmark, or
- Ship an illustrative benchmark that says so on screen, in the visible copy, not in a comment.
  Name the constant something that cannot be mistaken for real data, and say the same thing in the
  handover notes.

Never invent a sector average. A client repeating an invented benchmark to a prospect is a
reputational problem you handed them.

## 7. Statistics in copy

Every number in any published string goes through `tool-fact-checker` before the pack is handed
over.

- A number that traces to a primary source with a publication date can be used with attribution
- A number that only appears in vendor marketing gets named as that vendor's own figure, or cut
- A number with no traceable origin comes out. Paraphrasing it without the digit is still using it
- Do not put a statistic in copy just because it is true. It has to change what the reader does

`funnel-benchmarks.md` carries a do-not-cite list of widely repeated funnel numbers that have no
traceable primary source. Several of them appear in otherwise reputable marketing blogs. Check it
before quoting anything about quizzes or forms to a client.

## 8. Voice

Run `tool-humanizer` on every published string. Deep mode when `brand_context/voice-profile.md`
exists, standard mode when it does not.

Then read the copy against the ICP profile. The test is not whether it sounds good. The test is
whether the client's buyer would use those words. Result copy that sounds like a quiz vendor
undoes the work the instrument just did.

House rules that apply regardless of client voice:
- No em dashes. Full stops and commas
- One idea per sentence
- No "leverage", "robust", "comprehensive", "seamless", "unlock", "journey"
- No time or effort estimates anywhere in client-facing copy
- Second person throughout the result copy. It is about them, not about the client's method

## 9. Delivery checklist

- [ ] Every landing promise is delivered on screen at results time
- [ ] Three overall variants written, each with a lede and three paragraphs
- [ ] Every category has low, medium and high, each with a body and a top tip
- [ ] Category labels in the copy match the definition labels exactly
- [ ] Category keys in the copy match the definition ids exactly
- [ ] One CTA destination, repeated, never two
- [ ] Gate copy written for both positions
- [ ] Privacy line present under the gate button
- [ ] Humanizer run, mode recorded
- [ ] Every statistic fact-checked or removed
- [ ] Benchmark either real, absent, or labelled illustrative on screen
- [ ] No time estimates, no em dashes, no banned words
