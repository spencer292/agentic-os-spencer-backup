# Quiz funnel benchmarks

Every figure here was checked in September 2026. Each carries its source, its URL and its
methodology, because the methodology is what decides whether you can put the number in front of a
client. Section 8 is the do-not-cite list. Read it before quoting anything.

---

## 1. Headline conversion benchmarks

| Metric | Figure | Source |
|--------|--------|--------|
| Quiz start to lead | 40.1% | Interact, Quiz Conversion Rate Report 2026 |
| Quiz start to finish | 65% | Interact, same report |
| Completion, competing measure | 73.4% | Riddle, 2025 Quiz Marketing Report |

Interact: https://www.tryinteract.com/blog/quiz-conversion-rate-report/ (checked September 2026).
Riddle: https://www.riddle.com/blog/news-reviews/2025-quiz-marketing-report/ (checked September
2026).

**Read the methodology before you quote either.** Interact states a sample of over 80 million leads
since 2013 and publishes no quiz count, no view count, no date range for the current edition and no
methodology section. Their own homepage says 100 million leads, against the report's 80 million.
Riddle discloses far more, 8.96 billion data points and 766.8 million users reaching a final
result, and publishes no industry breakdown at all.

Per-industry, from Interact, the only three sectors they give numbers for:

| Sector | Start to lead | Start to finish |
|--------|---------------|-----------------|
| Coaching and courses | 44.9% | 59.1% |
| Service providers | 42.2% | 47.3% |
| E-commerce | 37.6% | 55.5% |

**The completion figure is not one number.** Published completion rates run from 47% to 95%
depending on the vendor, the denominator and the quiz type. Outgrow reports 85 to 95% for
lead-generation quizzes but 25 to 45% for B2B maturity assessments, which they describe as the
lowest completion and the highest lead quality. A scorecard for a business audience sits nearer
their assessment figure than their lead-gen figure. Do not average across vendors.

**The denominator trap.** Every published quiz benchmark is measured from quiz start, never from
landing-page visit. There is no published like-for-like comparison of a quiz against a static lead
magnet on a per-visitor basis. Anyone claiming quizzes convert some multiple better than forms is
comparing different denominators. Say so if a client raises it.

## 2. Length and format

- Platform guidance, all vendor documentation checked September 2026: Interact 13 questions for a
  standard flow and 7 with branching; Riddle 6 to 10; Outgrow 7; Typeform 6 or fewer.
- SurveyMonkey, 25,000 surveys with at least 100 respondents each, presented at AAPOR: 89%
  completion at 10 questions, 87% at 20, 85% at 30, 79% at 40.
  https://www.surveymonkey.com/learn/survey-best-practices/tips-increasing-survey-completion-rates/
- SurveyMonkey, 100,000 random surveys: per-question drop-off rises most sharply up to 15
  questions, and the incremental cost per question after 15 is lower than before it. The
  relationship is not linear.
  https://www.surveymonkey.com/curiosity/survey_questions_and_completion_rates/
- SurveyMonkey timing: first question about 75 seconds, second about 40, then roughly 30 seconds
  each, falling to 25 after question 10. Abandonment rises past 7 to 8 minutes.
- Three options are optimal for multiple-choice items. Rodriguez 2005, a meta-analysis of 80 years
  of research, Educational Measurement: Issues and Practice 24(2). Caveat: achievement testing with
  right and wrong answers, so applying it to attitudinal quizzes is extrapolation.
- Item-specific response options produce measurably higher-quality answers than agree-and-disagree
  scales. Saris, Revilla, Krosnick and Shaeffer 2010, Survey Research Methods 4(1) 61-79.
  https://ojs.ub.uni-konstanz.de/srm/article/view/2682
- Acquiescence bias affects roughly 10 to 20% of respondents. Kuru and Pasek 2016, Computers in
  Human Behavior 57, 82-92. Pew's guidance is to offer a choice between alternative statements
  rather than an agree-disagree scale. https://www.pewresearch.org/writing-survey-questions/
- The counter-finding, and it is a real trade-off: Riddle's own A/B test found a Likert-scale quiz
  completed at 68.97% with 32.75% lead-form completion, against 35.14% and 17.57% for a quiz using
  situational options unique to each question.
  https://www.riddle.com/blog/lab/riddle-lab-personality-quiz-question-format/

**What this supports.** Ten questions is defensible and inside every platform's range. Item-specific
behavioural options give better answers and may cost completion, so watch the completion rate after
launch and treat question format as a first thing to test if it is far below benchmark.

**What it does not support.** The commonly repeated "8 to 12 questions" range has no primary source.
Neither does any per-question drop-off figure for marketing quizzes. Nobody publishes one.

## 3. Gate placement

The evidence is thin and the two vendors with a public position disagree.

- Riddle lab, three identical quizzes varying only form position: form at the end before results
  43.1% completion, form at the beginning 22.4%, form split through the quiz 24.7%. No sample size,
  no date, no significance test. https://www.riddle.com/blog/lab/experiment-form-placement/
- Riddle lab, mandatory versus skippable gate: mandatory 34.25% form completion (50 of 146 reaching
  the form), skippable 24.07% (65 of 270). Chi-square reported.
  https://www.riddle.com/blog/lab/experiment-form-skip-option/
- **Lead quality was identical between the mandatory and skippable arms.** Both produced the same
  proportion of valid, authentic email addresses. Hesitant users dropped out rather than submitting
  fake data. This is the only direct gate-friction-versus-lead-quality finding available.
- ScoreApp recommends the opposite, gating before the quiz, and publishes no data. Their stated
  decision rules: low traffic gate first, high traffic can afford gate-after, five questions gate
  after is fine, ten or more gate first, paid traffic always gate first.
  https://www.scoreapp.com/quiz-leads-form/
- Partial-result-then-gate has no quantitative test anywhere. Nielsen Norman Group supports the
  pattern qualitatively, recommending you give some value and hold the most critical part behind the
  form, and cite no study. https://www.nngroup.com/articles/content-behind-forms/

**The honest position.** Gate placement is a genuine open question, not settled practice. Ship
gate-after as the default because it is the position with the only supporting test, keep the switch,
and tell the client plainly it needs testing on their own traffic. The variables that matter are
traffic volume, question count and traffic source.

## 4. Results page

- A controlled study of self-assessment tools, 553 registered and 178 completers: self-assessment
  with tailored feedback produced 65% dropout, generic information alone 66%, and self-assessment
  without tailored feedback 73%. Self-assessment with no tailored feedback was rated significantly
  lower than plain generic information on positive perceptions, p = .04. Morrison, Moss-Morris,
  Michie and Yardley 2013, British Journal of Health Psychology.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4231218/

  **The operative finding: a score with no personalised interpretation performs worse than not
  running the assessment at all.** This is the load-bearing citation for the whole result copy set.

- Reducing four CTAs to one lifted clickthrough 42%. Whirlpool via MarketingSherpa, campaign late
  2013. No sample size, no confidence level. It is an email test, not a results page. Directional
  analogy only.
  https://www.marketingsherpa.com/article/case-study/whirlpool-lift-clickthrough-testing-culture
- Personalised CTAs converted 202% better than basic CTAs, across more than 330,000 CTAs over six
  months. HubSpot. Year the study ran is not stated, and it is general website CTAs, not quiz
  results pages. https://blog.hubspot.com/marketing/personalized-calls-to-action-convert-better-data
- Nielsen Norman Group, qualitative: reactions to personalised recommendations are strongly
  positive, and users need to understand where a recommendation came from.
  https://www.nngroup.com/articles/recommendation-guidelines/

**Evidence gap worth stating out loud.** No study, test or vendor benchmark compares named
archetypes or tier names against a numeric score alone. Naming the tiers is a reasonable hypothesis
to test, not evidenced practice. There is also no published results-page-to-CTA conversion
benchmark from any vendor, so the client's own first month sets their baseline.

## 5. Follow-up sequence

There is no primary study on optimal post-quiz sequence length. The circulating "three to five
emails" is vendor opinion. ScoreApp's published template set is nine nurture plus four sales, first
email on completion day, second the next day, third two days later, segmented by score band, at a
ratio of one or two sales emails per ten nurture emails. https://www.scoreapp.com/quiz-email-sequence/

Email benchmarks worth using, best methodology first:

| Metric | Figure | Source |
|--------|--------|--------|
| Automated email open | 30.21% | Omnisend, 470 million automated sends |
| Automated email click | 4.66% | Omnisend |
| Automated conversion | 1.49% | Omnisend |
| Welcome email open | 35.53% | Omnisend |
| Campaign open, median | 43.46% | MailerLite, 3.6 million campaigns Dec 2024 to Nov 2025 |
| Campaign click, median | 2.09% | MailerLite |

Omnisend: https://www.omnisend.com/blog/email-marketing-benchmarks/. MailerLite:
https://www.mailerlite.com/blog/compare-your-email-performance-metrics-industry-benchmarks

**Two things to carry into any reporting.** First, Apple accounted for 62.26% of all email opens in
July 2026 and pre-fetches tracking pixels, so any open rate much above 35 to 40% is substantially
machine-generated. Report clicks, not opens. https://www.litmus.com/email-client-market-share
Second, the automation advantage is in clicks and revenue, never opens: Omnisend's own data shows
automated emails opening marginally lower than campaigns while converting roughly nineteen times
better.

Segmentation: the durable figure is a 100.95% lift in clicks for segmented against unsegmented
campaigns, from about 2,000 Mailchimp users and 9 million recipients. The study is from 2017 and
pre-dates mail privacy protection, so its open-rate half is no longer reliable.
https://mailchimp.com/resources/effects-of-list-segmentation-on-email-marketing-stats/

## 6. Gate form friction

All Baymard, checked September 2026, from 25 rounds of usability testing and 12 quantitative studies
with 20,240 participants.

- 42% of test participants typed their full name into a "First Name" field at least once when the
  form split the name. With a single combined name field, only 4% hesitated briefly. 89% of sites
  still split it. https://baymard.com/blog/checkout-flow-average-form-fields
- The average checkout flow carries 11.3 form fields, and most sites need only 8 in total.
- 17% of users have abandoned a purchase because the checkout was too long or complicated.
  https://baymard.com/lists/cart-abandonment-rate
- Single-column layout produced fewer skipped fields, fewer misinterpreted fields and fewer errors.
  The exception Baymard states and most citers drop: two or three inputs forming one coherent entity,
  such as a date or a postcode group, may share a line.
  https://baymard.com/blog/avoid-multi-column-forms
- Counter-evidence worth knowing: HubSpot's A/B test found a two-column version of a 13-field form
  converted 22% better at 99% confidence. Moot for a three-field gate, but do not claim single-column
  is universally proven.
  https://blog.hubspot.com/marketing/one-vs-two-column-form-conversion-test
- Chrome autofill produced a 75% reduction in form abandonment and a 35% reduction in completion
  time across thousands of high-traffic US sites. Use valid autocomplete tokens and never
  `autocomplete="off"`. https://blog.google/products/chrome/chrome-autofill/

## 7. The five rates, and what to change first

Read these from the Clarity funnel built on the event taxonomy in `deploy-paths.md`.

| Rate | Definition | Benchmark | If it is low, in order |
|------|-----------|-----------|------------------------|
| Start rate | Landing views to `quiz_start_click` | No published benchmark exists. Your own first month is the baseline | 1. Headline is not the visitor's question. 2. The promise is vague or unbelievable. 3. Time cost not stated. 4. CTA below the fold on mobile |
| Completion | `quiz_start_click` to `quiz_completed` | 47% to 73% across vendors, lower for B2B assessments | 1. Find the question that loses people, per-question drop-off names it. 2. Rage clicks on that question mean ambiguous wording. 3. Consider question format. 4. Only then consider cutting length |
| Lead rate | `quiz_start_click` to `lead_captured` | 40.1% overall, 42.2% for service providers | 1. Gate copy does not trade on the payoff. 2. Too many fields. 3. No privacy line. 4. Test the gate position switch |
| Results to CTA | `results_viewed` to `book_cta_click` | None published. Set your own baseline | 1. Scroll depth first, do they reach the CTA band. 2. One destination only. 3. CTA repeated after each block. 4. Sticky CTA on mobile |
| Per-question drop-off | Successive `question_answered` counts | None published for marketing quizzes | Fix the single worst question before touching anything else |

Change one thing at a time. At low traffic a config flag plus Clarity segments beats a testing tool
that would take a year to reach significance.

## 8. Do not cite these

Each of these is widely repeated and each failed verification in September 2026. Several appear in
otherwise reputable marketing blogs.

| Claim | What is actually true |
|-------|----------------------|
| "Each extra form field costs 4.1% conversion", attributed to HubSpot | Not in the original 40,000-page analysis. That study's real finding is that field type matters more than field count |
| "Every field over five costs 20 to 30%" | No traceable primary source. Baymard's actual findings are the ones in section 6 |
| Unbounce form-field conversion table, 1 field 13.4% down to 9 fields 3.6% | Unbounce publishes no form-field data. Their real report gives a 6.6% median conversion rate |
| Expedia made $12 million by deleting one form field | A 2010 interview anecdote. No study, no control. The cause was a confusing optional field, not field count |
| "AnalyticsFirst Research" verifying Outgrow's benchmarks | No such firm is locatable. Everything resting on it is vendor marketing |
| Outgrow State of Interactive Marketing Report, March 2026, 9,300 campaigns | No such report exists on Outgrow's site |
| HubSpot Interactive Content Performance Study, Feb 2026, 120,000 quiz deployments | Appears only on aggregator blogs. Almost certainly fabricated |
| "Partial results teaser converts 35 to 45%, full gating 20 to 30%" | Originates on AI-generated marketing blogs with no source and no statistic |
| "Capturing email at question 3 or 4 increases completion 40%" | No source anywhere |
| "Automated emails get 52% higher opens than broadcasts" | Contradicted by Omnisend's own current data, where automations open marginally lower |
| "A 3-email welcome series generates 90% more orders than one" | Not present on the page it is attributed to |
| "Progress bars cut abandonment 20 to 30%" | No traceable primary source. Progress indication is still good practice, just do not attach a number |
| "Sticky mobile CTAs lift conversion around 17%" | No traceable primary source. Sticky CTAs remain sound mobile practice on thumb-zone grounds |
| LeadQuizzes "31.6% average lead capture" | Real, but from their 2016 year in review. Ten years old. Never present as current |

Blocked rather than fabricated, so treat as unverified rather than false: Typeform's completion and
question-count guidance, Preston and Colman's scale-point numbers, GetResponse's open-rate figure,
and CXL's form-design research. All returned 403 to automated fetch.
