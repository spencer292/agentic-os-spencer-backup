# Lead-Magnet and Quiz Funnel Benchmarks

Use this whenever the audited page is the entry to a quiz, scorecard, assessment, calculator or gated
asset. A funnel is not one page, so a single LIFT score cannot describe it. Score the sequence.

All numbers are sourced in `sources-2026-09.md` with the month checked.

---

## Why interactive beats a gated PDF

An interactive asset converts a materially larger share of page visitors than a downloadable PDF
behind a form. The mechanism is reciprocity and sunk cost: the visitor answers questions, invests
attention, and the result feels earned rather than harvested. This is why a quiz funnel is worth
auditing on its own terms rather than as "a landing page with a form on it".

## Published benchmarks

Interact's 2026 conversion report, drawn from a platform corpus of quizzes and more than 80 million
leads, gives two headline rates:

| Metric | Benchmark | Definition |
|--------|-----------|------------|
| Start to lead | 40.1% | Of people who click start, the share that submit their details |
| Start to finish | 65% | Of people who click start, the share that answer every question |

Service providers specifically sit near 42% start to lead and around 47% start to finish. Categories
vary, so treat these as the range a healthy funnel lives in rather than a pass mark.

Ten questions sits inside the range that holds those numbers. Question count is not the first thing to
cut when a funnel underperforms. Measured per-question drop-off is.

## Sequence rules

**Sector or segment first.** Open with a segmentation choice, not personally identifiable
information. Sector, role, company size or situation costs the visitor nothing, is not PII, and it
drives both the benchmarking in the result and the routing afterwards. Tappable cards beat a native
select on mobile.

**Contact form after the questions, before the results.** This is the current consensus placement
across the guides: the visitor has invested the effort and the score is the payoff, so the ask lands
at the moment of maximum sunk cost. Treat it as strong consensus rather than proven, because no clean
public A/B of "before questions" against "before results" exists. The trade-off is real and worth
naming in the audit: gating after the questions means no email address for the people who abandon
mid-quiz. Where abandon-email recovery matters more than completion, gate first, and make that a
config flag so it can be tested rather than argued about.

**Three fields, single column, one name field.** Name, email and one qualifying field. Every field
past five carries a steep cost, and splitting first and last name is a known friction point because
people type their whole name into the first box.

**Sticky CTA on mobile.** On both the entry page and the results page, in the thumb zone, hidden on
desktop.

**Personalised results.** Greet by name, show the score, explain what it means, and put one clear next
step directly beside the explanation. Personalised calls to action convert substantially better than
generic ones. Repeat the CTA after each major results block. Personalisation held in session storage
on the same device keeps a shared results link anonymous.

**Progress indicator.** On any flow over about three steps.

## Per-question drop-off is measured, never guessed

Instrument the funnel before arguing about it. One tracking seam fanning out to the analytics
platforms, with a named event per step, gives per-question drop-off rather than per-page. A workable
event set for a ten-question quiz:

```
quiz_start_click
sector_selected
question_answered (question index as a property, one event per question)
quiz_completed
lead_captured
results_viewed
primary_cta_click
booking_submitted
```

Add session tags for segment and score band so the funnel can be filtered by both. Then read, in this
order: which question loses people, rage clicks on answer cards which usually mean ambiguous wording,
scroll depth on the results page, whether the in-page CTA band is ever seen before the sticky bar is
tapped, and mobile against desktop completion. `tool-behaviour-analytics` covers the setup.

Cutting question count, rewording a question or moving the gate are all decisions the drop-off curve
should make, not the audit's opinion.

---

## Funnel Scorecard

Produce this table in every audit of a quiz or lead-magnet funnel. Every rate is either measured or
explicitly marked unmeasured. Never estimate a rate and present it as data.

| Metric | Definition | Benchmark | This funnel | Evidence | Verdict |
|--------|-----------|-----------|-------------|----------|---------|
| Start rate | Entry-page visitors who click start | Interactive assets convert a far larger share of visitors than gated PDFs. Set the target from the site's own history when it exists | | measured or unmeasured | |
| Completion rate | Starters who answer every question | 65% overall, about 47% for service providers | | | |
| Lead rate | Starters who submit their details | 40.1% overall, about 42% for service providers | | | |
| Results-to-CTA rate | Results viewers who click the primary next step | No published benchmark. Set it from the site's own baseline and treat the first measurement as the baseline | | | |

Rules for the scorecard:

- A rate with no analytics behind it is written as "unmeasured", never as an estimate.
- A funnel with no instrumentation gets one finding above all others: instrument it, then re-audit.
- Report the funnel scorecard alongside the LIFT score, not instead of it. LIFT explains why a rate is
  low. The scorecard says which rate.
- When a rate sits below benchmark, name the step it fails at from the drop-off data. "The quiz
  underperforms" is not a finding. "Sixty per cent of starters leave on question four" is.
