---
name: mkt-scorecard-funnel
description: >
  Design and stand up a quiz or scorecard lead-magnet funnel for a client: interview, instrument
  design, result copy, engine-ready config files, deploy notes and a measurement plan. Produces a
  scored ten-question instrument, a copy set covering every tier, TypeScript config the engine reads
  as data, and a validator that proves it before it ships. Use when the user says "build a
  scorecard", "quiz funnel", "scorecard funnel", "lead magnet quiz", "assessment quiz", "build a
  quiz for", "diagnostic quiz", "self-assessment tool", "replace ScoreApp", "design the quiz
  questions", "quiz results copy" or "interactive lead magnet". Do NOT use for auditing a live
  funnel's conversion, setting up analytics tags, writing general landing page copy, page structure,
  or survey research where nobody gets a score.
---

# Scorecard Funnel

Design a quiz or scorecard lead magnet that a client owns outright. The output is a working
instrument, the whole copy set, config files the engine reads as data, and the numbers to watch
once it is live. No SaaS seat, no invented benchmarks.

## Outcome

**Produces** a funnel pack in `projects/mkt-scorecard-funnel/{client-slug}/`:

| File | What it is |
|------|-----------|
| `instrument.md` | Score name, categories, ten questions with points, tier bands, rationale |
| `landing-copy.md` | Hero, promise bullets, deliverables, steps, trust block |
| `results-copy.md` | Three overall variants, every category by tier, tips, CTA band |
| `gate-copy.md` | Lead-gate copy for both gate positions |
| `{slug}.ts` `.landing.ts` `.results.ts` | Engine-ready TypeScript config |
| `deploy-notes.md` | Both deploy paths, event taxonomy, interface rules |
| `measurement-plan.md` | The five rates, and what to change first when each is low |

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/voice-profile.md` | full | Result copy must sound like the client, not a quiz vendor |
| `brand_context/icp.md` | full | Who answers, their vocabulary, their scepticism |
| `brand_context/positioning.md` | summary | Categories map to the methodology, so positioning sets them |
| `brand_context/design-system.md` | CTA colours, type scale | Only when building inside a site you own |
| `context/learnings.md` | `## mkt-scorecard-funnel` | Past instrument feedback |

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-humanizer` | Required | Strips AI patterns from every published string | Do not ship the copy set |
| `tool-fact-checker` | Required when copy carries a number | Traces statistics to a primary source | Cut the number |
| `tool-behaviour-analytics` | Required for Step 7 | Clarity and GA4 setup, the funnel build | The funnel ships blind |
| `mkt-brand-voice` | Optional | Voice profile for deep humanizer mode | Humanizer runs in standard mode |
| `mkt-icp` | Optional | Audience profile driving question language | Interview for it in Step 2 |
| `str-cro-audit` | Optional, downstream | Scores the pages before launch | Self-check against the checklists here |
| `mkt-copywriting` | Optional | Variants and a scored review of the landing copy | The copy set here is enough |

## Skill Relationships

**Upstream:** `mkt-brand-voice`, `mkt-icp` and `mkt-positioning` supply the voice, the audience and
the category spine. `str-ux-research` supplies evidence when a funnel already exists.

**Downstream:** `tool-behaviour-analytics` instruments it. `str-cro-audit` scores the pages before
launch and reads the numbers after. `mkt-copywriting` writes the ads and emails that feed it.

**Trigger boundaries:** "why is my quiz not converting" is `str-cro-audit`. "Set up Clarity" is
`tool-behaviour-analytics`. "Write the follow-up emails" is `mkt-copywriting`. A survey with no
score and no result page is not a scorecard, so say so and stop.

## Step 1: Load Context

Read the Context Needs files. Report one line: who the funnel is for, whether a voice profile
exists, and which humanizer mode Step 4 will use. Missing context never blocks the work. Read
`references/funnel-benchmarks.md` before quoting any number to a client. It carries the verified
figures with their methodology, and a do-not-cite list of widely repeated numbers that have no
traceable source.

## Step 2: Interview

Ask these in order, one at a time. Stop and wait. Never guess a client's methodology.

1. **The score name, and the question it answers.** The name is what the visitor receives. The
   question is what they typed into a search box.
2. **Who answers it.** One named role. If two roles would answer differently, it is aimed at neither.
3. **Three to five categories**, mapping to the client's methodology or product line so the result
   reads as a diagnosis of what they sell. Four is the default. Categories the client cannot name
   are the first sign there is no methodology to sell.
4. **Tiers and their names.** Three bands, named. The bottom name describes a situation, never a
   verdict on the person.
5. **The promise on the landing page.** What they know in two minutes that they do not know now.
6. **The CTA after results.** One. Two destinations is a decision the visitor will not make.
7. **Segments for the benchmark.** Sector or size, asked as screen one because it is not personal
   data and it drives the comparison.
8. **What benchmark data the client holds.** Ask for the file. With none, ship without a benchmark
   or label it illustrative on screen. Never fabricate one.

Write the answers into `instrument.md` as a definition block before designing anything.

## Step 3: Design the Instrument

Read `references/instrument-design.md` for the method, the evidence and two worked examples. Ten
questions is the default. In short:

- One idea per question. A question containing "and" is usually two questions.
- Anchor on behaviour in a stated period, not on agreement with a statement.
- Three answer options, exactly one scoring, with a middle option a real person would pick.
- Plain language in the buyer's words. No jargon, no product names.
- Every question has one category, except one overall-only intent closer. Category maxima are
  question counts, not weights, and bands cover 0 to 100 with no gap or overlap.

Then run the instrument checklist in that reference. Every line passes before copy is written. A
failing line is a rewrite, not a note.

## Step 4: Write the Copy Set

Read `references/copy-set-spec.md` for the required blocks and their structure.

Write the landing copy, three overall variants, every category by every tier with a "do this first"
tip, the CTA band, and gate copy for both positions. The bottom tier is what most people see. Write
it as the normal starting point with a cause and a first move, never as a failure.

Then, in order: run `tool-humanizer`, deep mode when `brand_context/voice-profile.md` exists and
standard otherwise; flag every statistic for `tool-fact-checker`, because a number with no primary
source comes out and paraphrasing it without the digit is still using it; then read the copy against
the ICP's vocabulary, where any word their buyer would not say is a rewrite.

## Step 5: Emit and Validate the Config

Read `references/engine-config-shape.md` for the exact shapes, then emit three files named for the
slug: definition, landing copy, result copy. Validate them:

```bash
node .claude/skills/mkt-scorecard-funnel/scripts/validate-instrument.mjs \
  projects/mkt-scorecard-funnel/{client-slug}
```

It loads the emitted files under plain node, with no build step and no framework, and checks
category maxima, tier coverage and reachability, copy coverage for every category and tier, exactly
one positive answer per question, and id integrity. It exits non-zero on any failure. Never hand
over a pack that has not passed.

## Step 6: Deploy Notes

Read `references/deploy-paths.md` and write `deploy-notes.md` for the path that fits. **Path A,
inside a site the client owns:** database-backed, a non-enumerable result key, leads in their own
records. **Path B, standalone app:** no database, signed result tokens, leads to a webhook, for a
demo or a site you do not control. Both carry the same funnel event taxonomy, the sticky mobile
CTA, the segment picker on screen one, and the gate-after default behind a config switch.

## Step 7: Measurement Plan

Write `measurement-plan.md` covering start rate, completion, lead rate, results to CTA, and
per-question drop-off. For each, give the current reading, the benchmark, and the first change to
make when it is low. `references/funnel-benchmarks.md` section 7 carries the ordered fix list. Name
`tool-behaviour-analytics` as the skill that builds the funnel these rates are read from.

## Step 8: Save and Present

Save every file to `projects/mkt-scorecard-funnel/{client-slug}/` and show every full absolute
path. Present the score name, the tier names, the category spine, the validator summary, and
anything labelled a placeholder. Then ask "How does this instrument land? Any question that does
not sound like your buyer?" and log the answer to `context/learnings.md` under
`## mkt-scorecard-funnel`.

## Rules

*Updated when the user flags an issue. Read before every run.*

- 2026-09-02: built at the root from the scorecard-engine project's Phase 3 scope, with a currency
  pass against September 2026 sources. Interact's 40.1% start-to-lead and 65% completion are
  published but rest on a lead count with no quiz count and no methodology section. The repeated
  "eight to twelve questions" range has no primary source; platform guidance spans six to thirteen.
  Both caveats live in `references/funnel-benchmarks.md`.
- Never fabricate a benchmark, sector average or peer comparison. With no client data, omit it or
  label it illustrative in the visible copy and in the config.
- Every question has exactly one point-scoring answer. Two positives is a scoring bug that only
  surfaces as a wrong tier.
- The bottom tier is where most people land. Copy that shames it loses the lead at the moment they
  are most willing to act. One CTA on the results page: repeat it, never add a second destination.
- No time or effort estimates anywhere. Rank by impact, risk, dependency order and reversibility.
- The client owns the funnel: their domain, their database or webhook, their leads.
- Gate placement is an open question in the evidence, not settled practice. Ship the default, keep
  the switch, and say plainly it needs testing on the client's own traffic.

## Self-Update

If the user flags an issue, wrong questions, a mis-scored instrument, copy that misses the voice, a
config the engine rejects, update the `## Rules` section here immediately with the correction and
today's date, as `- {YYYY-MM-DD}: {what was wrong and the rule that prevents it}`. Fix the skill,
do not only log it.

## References

| File | Read when |
|------|-----------|
| `references/instrument-design.md` | Step 3, before writing a single question |
| `references/copy-set-spec.md` | Step 4, before writing the copy |
| `references/engine-config-shape.md` | Step 5, before emitting any TypeScript |
| `references/deploy-paths.md` | Step 6, and when the client asks where it lives |
| `references/funnel-benchmarks.md` | Steps 1 and 7, and before quoting any number |
| `scripts/validate-instrument.mjs` | Step 5, run it, never eyeball the config |
