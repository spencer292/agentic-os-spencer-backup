# Weekly behavioural review

The cadence that turns a tag into decisions. Run it once a week on a live funnel, once a
fortnight on a low-traffic site. Copy the template at the bottom into
`projects/tool-behaviour-analytics/{YYYY-MM-DD}_{site}-review.md`.

The review is a filter, not a browse. You come with a question, you leave with one change.

---

## 1. Before you open anything

Write down the question. One of:

- Where in the funnel are we losing people, and is it the same place as last week?
- Did last week's change move the step it was meant to move?
- Which page has the worst gap between attention and action?

A review without a written question turns into an hour of watching recordings and no
decision.

---

## 2. The order to look, and why

**Funnel first.** Read the conversion rate and the per-step drop. The step with the biggest
drop is the only step you investigate this week. Everything else waits.

**Then the heatmap on that step's page.**

| Map | The question it answers | What a bad result looks like |
|---|---|---|
| Scroll | Was the content reachable? | The primary CTA sits below the depth half of sessions reach |
| Click | What do people treat as clickable? | Heavy clicks on an image, icon or heading that is not a link |
| Area | Which region wins on a responsive layout? | The nav out-clicks the hero on a landing page |
| Attention | Where did the time go? | High attention, zero clicks, meaning people are stuck reading and deciding against |
| Conversion | What did the sessions that converted actually touch? | The converters used a path the design does not promote |

Compare mobile and desktop separately, always. They are different pages in practice.

**Then the friction signals on that page.**

| Signal | What it means | Usual cause |
|---|---|---|
| Rage click | Repeated clicks in the same spot | Broken control, slow response, or a false button |
| Dead click | A click with no effect | A false affordance. An image, icon, price or heading that reads as interactive |
| Quick back | Arrived and left almost at once | The page did not match the promise that earned the click |
| Excessive scroll | Long scrolling with no settle | People are hunting for something the layout hides |
| JavaScript error | Script threw during the session | Watch these recordings first, they are cheap wins |

**Then the recordings, filtered.** Filter to the funnel step that dropped, on the device
that dropped, with the friction signal you found. Watch roughly twenty. Stop when the
pattern repeats three times, that is the finding. Twenty filtered recordings on the page in
question beats an hour of unfiltered browsing. Favourite anything worth keeping, because
plain recordings are deleted after 30 days.

**Then Copilot, last.** Ask it to summarise the grouped sessions you just filtered and the
heatmap you just read. It is a second opinion on evidence you have already seen, not a
replacement for seeing it. It summarises up to 250 recordings at a time.

---

## 3. Writing a finding

Three lines, in this order, every time.

1. **Observation.** What the data shows, with the number and the sample size.
2. **Hypothesis.** Why it might be happening. Marked as a hypothesis, because it is one.
3. **Change.** The single thing to do about it, and how you will know it worked.

Never conclude from one recording. A recording produces a hypothesis, a funnel step
measures it.

If the sample is too small, write "not enough sessions to say" and move on. That is a real
finding, and it beats a confident guess that gets built.

---

## 4. Change one thing

One change per cycle per funnel step. Two changes in one week means next week's review
cannot attribute the difference to either. If the site runs an A/B flag, the `variant` tag
is the only lever, and the review reads the two variants as separate funnels.

---

## 5. Handing off

Findings go to `str-cro-audit` as evidence, so the audit scores against observed behaviour
rather than heuristics alone. Copy quality findings, meaning ambiguous wording that causes
rage clicks, go to `mkt-copywriting`. Layout findings, meaning a section nobody reaches, go
to `viz-page-architect`.

---

## 6. Template

```markdown
---
site: {domain}
mode: review
date: {YYYY-MM-DD}
clarity_project: {name or id location}
window: {date range reviewed}
sessions: {count in window}
status: draft
---

# Behavioural review, {site}, week ending {date}

## Question this week
{One sentence.}

## Funnel

| Step | Sessions | Passed | Dropped | Drop % | vs last week |
|---|---|---|---|---|---|
| | | | | | |

Overall conversion rate: {x}%. Worst step: {name}.

## The page behind the worst step

Page: {url}
Device split: mobile {x}% / desktop {y}%

| Map | Reading |
|---|---|
| Scroll | |
| Click | |
| Area | |
| Attention | |
| Conversion | |

## Friction signals

| Signal | Count | Where | Note |
|---|---|---|---|
| Rage clicks | | | |
| Dead clicks | | | |
| Quick backs | | | |
| JS errors | | | |

## Recordings watched

Filter used: {step, device, signal}. Watched: {n}. Favourited: {n}.

## Findings

### Finding 1
- Observation:
- Hypothesis:
- Change:

### Finding 2
- Observation:
- Hypothesis:
- Change:

## The one change this cycle
{What ships, and the metric that will show whether it worked.}

## Not enough data to say
{List anything you looked at and could not conclude on.}

## Handoffs
- To str-cro-audit:
- To mkt-copywriting:
- To viz-page-architect:
```

---

## Sources

Checked September 2026.

- Clarity funnels, per-step drop-off and the jump to filtered recordings:
  https://learn.microsoft.com/en-us/clarity/setup-and-installation/funnels
- Clarity heatmap types: https://learn.microsoft.com/en-us/clarity/heatmaps/
- Copilot heatmap and grouped-session summaries:
  https://learn.microsoft.com/en-us/clarity/heatmaps-insights
- Data retention, 30 days for recordings, 9 months for heatmaps and favourited sessions:
  https://learn.microsoft.com/en-us/clarity/setup-and-installation/data-retention
- Review volume in agency practice, roughly twenty filtered recordings per page and a
  structured monthly sweep of twenty to thirty:
  https://www.lowcode.agency/blog/b2b-website-heatmap-and-session-recording-analysis
- Heatmaps diagnose, tests verify:
  https://www.growth-rocket.com/blog/heatmaps-and-session-recordings-turning-behavior-data-into-revenue/
