# Instrument design

How to build the ten questions. Read this before writing question one. Every rule here has either
an evidence base in `funnel-benchmarks.md` or a named failure mode from a real build.

---

## 1. What the instrument is for

The instrument has three jobs at once and they pull against each other:

1. **Diagnose honestly.** The score has to be defensible to the person who receives it and to the
   client who has to talk to them about it.
2. **Segment the lead.** The category profile tells the client which part of their offer to lead
   with on the call.
3. **Sell the gap.** Every question quietly shows the visitor something they had not thought about.
   The question is the lead magnet, not just the route to it.

A question that does not do at least two of the three is filler. Cut it and the instrument gets
better.

## 2. Length

**Ten questions is the default.** Take it as a working convention, not a proven optimum. What the
sources actually say:

- Platform guidance spans a wide range. Interact says thirteen for a standard flow and seven with
  branching. Riddle says six to ten. Outgrow says seven. Typeform says six or fewer.
- The commonly repeated "eight to twelve questions" range has no primary source behind it. It is
  blog convergence. Do not present it to a client as evidence.
- The best-measured length data is from survey research, not marketing quizzes. SurveyMonkey's
  25,000-survey dataset gives 89% completion at ten questions and 87% at twenty. The penalty for
  length is real but small, and the relationship is not linear.
- Time per question falls after the first two, so a ten-question quiz reads as roughly a
  five-minute task, and abandonment rises past seven or eight minutes.

The practical read. Ten questions is defensible, sits inside every platform's range, and gives four
categories enough questions to produce a meaningful per-category percentage. Nine questions across
categories plus one overall-only closer is the shape both reference instruments use. Cut to eight
only when the drop-off data says to, never on a hunch.

## 3. Category design

Three to five categories, four as the default.

- Categories map to the client's methodology or product line. The result then reads as a diagnosis
  of the thing they sell, without the results page ever naming a product.
- Each category needs at least two questions to produce a percentage anyone should act on. A
  one-question category can only score 0% or 100%, which reads as a bug to the visitor even when it
  is arithmetically correct. Use a single-question category only for a deliberately binary area,
  and write its copy knowing both readings are extreme.
- Category labels are the visitor's words for their problem, not the client's words for their
  service. "What runs without you" beats "Process maturity".
- Order the categories the way the results page will read them, worst-understood first.

## 4. Question rules

**One idea per question.** A question containing "and" is usually two questions wearing one coat.
The standard survey guidance is blunt about this: asking someone to evaluate more than one concept
at a time produces answers nobody can interpret. There is no published effect size, so treat it as
a craft rule, not a statistic to quote.

**Anchor on behaviour in a stated period.** Ask what happened, not whether they agree it should
have. "In the last twelve months, has every employee done some security training?" beats "We take
security training seriously." This is the best-evidenced rule in question design: response options
specific to the item produce measurably higher-quality answers than agree-and-disagree scales, and
agreement scales carry an acquiescence bias affecting a meaningful share of respondents.

There is a real trade-off here and the skill should name it rather than hide it. Uniform agreement
scales are easier to answer and complete better. One vendor's A/B test found a scale-format quiz
completed at roughly twice the rate of a situational-option quiz. So: use item-specific behavioural
options because the answers are worth more, and watch the completion rate. If completion is far
below benchmark, question format is one of the first things to test.

**Pick a reference period you can defend.** Twelve months for annual activities, ninety days for
operating habits, "last week" for how time is actually spent. Shortening a reference period changes
the answers, and not always in the direction you expect, so pick the period that matches the real
rhythm of the thing you are asking about and keep it consistent across the instrument.

**Three answer options, exactly one scoring.** Three options is well supported in the
achievement-testing literature and it keeps the answer cards big enough to tap on a phone. Note the
extrapolation: that literature is about right-and-wrong test items, not attitudes. Nobody has
published a three-versus-five test on marketing quizzes.

The three options should read as a ladder, not as a right answer plus two wrong ones:

| Position | Reads as | Points |
|----------|----------|--------|
| The honest bottom | "No" or "not really", written without shame | 0 |
| The honest middle | "Some", "sometimes", "partially" | 0 |
| The genuine top | The specific, provable, positive state | 1 |

The middle option is where most people land and it must feel like a real place to be. If the middle
option is embarrassing to select, people pick the top one and the instrument stops measuring
anything.

**Demand an instance, not a category.** People conflate a feature their software happens to have
with a system they built. "Could you name one thing that happens without a person starting it?"
separates the two. "Do you use automation?" does not.

**Plain language at the buyer's reading level.** No jargon, no product names, no internal
vocabulary. There is no defensible grade-level target to quote, and plain-language guidance
explicitly warns against writing to a fixed grade. Match the ICP's own words instead. If the client
has a voice profile or an ICP profile, mine it for the exact phrases their buyers use.

**Avoid the words the audience distrusts.** In one instrument the words "automation", "workflow"
and "agent" were all deliberately absent because the research showed the audience either did not
use them or actively distrusted them, while the underlying behaviour was still worth measuring.
Check the ICP profile for the equivalent list before writing.

## 5. The overall-only closer

One question belongs to no category and contributes only to the overall score. Its job is intent
capture. It asks whether they would act on what they are about to be shown.

- Two options, yes and no. It is the one place a binary is right.
- Phrase it as a specific commitment with a horizon, not as enthusiasm. "Would you act on it this
  quarter" beats "Are you interested in improving".
- It is also the honest place for the client's sales team to sort the list. A high score with a no
  on the closer is a different conversation from a low score with a yes.

Cut it to nine questions if the client finds it salesy. Say so as an option rather than deciding
for them.

## 6. Scoring and bands

- One point per positive answer. No weights. Weighting invites an argument with the client that
  the data cannot settle, and the category percentages already do the differentiating.
- Category maximum equals the count of questions in that category.
- `overallMax` equals the total question count.
- Three bands, inclusive integers, covering 0 to 100 with no gap and no overlap.
- 0 to 39, 40 to 79, 80 to 100 is the working default and matches both reference instruments.

**Check the reachable scores.** With ten single-point questions, only multiples of ten are
achievable overall, so the default bands mean four scores land low, four land medium and two land
high. Per category the granularity is coarser still: a two-question category can only score 0%, 50%
or 100%. Write each category's three copy variants knowing exactly which raw scores trigger them.

**Name the tiers.** The engine's tier ids stay low, medium and high, but the label is the
client-facing name and it should be one. Exposed, Building, Resilient. The bottom name describes a
situation, never a verdict on the person.

## 7. The instrument checklist

Run every line before writing a word of copy. A failing line is a rewrite, not a note in the
margin.

**Structure**
- [ ] Ten questions, or a stated reason for a different count
- [ ] Three to five categories, each with at least two questions, or a stated reason for one
- [ ] Exactly one overall-only question, with `categoryId: null`
- [ ] Every other question has exactly one `categoryId` and it exists in `categories`
- [ ] Each category's `maxScore` equals its question count
- [ ] `overallMax` equals the total question count
- [ ] Tiers cover 0 to 100 inclusive, no gap, no overlap
- [ ] Every tier is reachable given the achievable score set

**Each question**
- [ ] Exactly one answer with `points: 1`, and every other answer at `points: 0`
- [ ] Three options, or two for the overall-only closer
- [ ] One idea only, no hidden second clause after an "and"
- [ ] Anchored on a behaviour in a stated period, not on agreement with a statement
- [ ] Asks for an instance where it could otherwise be answered from a category
- [ ] The middle option is a place a real person would be comfortable selecting
- [ ] No jargon, no product name, no word the ICP profile flags as distrusted
- [ ] Reads the same to every member of the one named role who answers it
- [ ] Reverse scoring, if any, is commented in the config

**Ids**
- [ ] Question ids are sequential and stable, q1 to q10
- [ ] Answer ids are short, lowercase, hyphenated, and meaningful, not a, b, c
- [ ] Category ids are lowercase and hyphenated and match the result copy keys exactly
- [ ] No id changes after launch, because in-flight result links resolve against them

## 8. Worked example one, a business diagnostic

Four categories, nine scored questions, one closer. Category maxima three, two, three, one.
Questions never name the product. The signature question is the two-week absence test, phrased as a
concrete scenario rather than a maturity rating:

> If you took two weeks completely off, without checking in or putting out fires, would your
> business continue to run smoothly?

Options: Yes scores, No and Maybe do not. The Maybe option is doing real work here. It absorbs the
people who would otherwise round themselves up to Yes.

One question in that instrument is reverse-scored, asking whether employed friends seem to have
better balance than the owner. No is the positive answer. It is a change of pace and a moment of
recognition, and one is enough.

## 9. Worked example two, an organisational risk score

Four categories, ten questions, and a sector picker on screen one. Every question is anchored to a
period and to an observable event:

> In the last 12 months, has every employee done some cyber security training, not just the IT team?

Options: "Yes, everyone" scores. "Some people have" and "No, or I'm not sure" do not. Folding "not
sure" into the bottom option is deliberate. It gives the honest answer somewhere to go without
adding a fourth card, and uncertainty about whether training happened is itself the finding.

The sector picker is not a question and carries no points. It is segmentation, asked first because
it is not personal data, and it drives the benchmark comparison on the results page.

## 10. Failure modes seen in real builds

| Failure | What it looks like | Fix |
|---------|--------------------|-----|
| Two positive answers | Everyone scores high, tiers look broken | The validator catches it, run it |
| Category with one question | 0% or 100% only, reads as a bug | Merge it or add a question |
| Unreachable tier | Nobody ever sees the high copy | Check the achievable score set against the bands |
| Product names in questions | Reads as a sales form, completion falls | Rewrite in the buyer's words |
| Agreement scale throughout | High completion, meaningless profile | Convert to item-specific options |
| Shaming bottom-tier copy | Lead reads it and never books | Rewrite as the normal starting point |
| Ids renamed after launch | Old result links break or misresolve | Never rename, add instead |
