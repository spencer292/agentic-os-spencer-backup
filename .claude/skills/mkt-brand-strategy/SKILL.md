---
name: mkt-brand-strategy
description: >
  Build a brand's strategic foundation BEFORE any design: discovery interview, then
  archetype (12 Jungian + Aaker), Golden Circle, Brand Key/Pyramid to brand essence,
  mission/vision/values/promise, the Moore positioning statement, and a moodboard
  direction for visual design. Triggers: "brand strategy", "brand foundation", "brand
  archetype", "brand pyramid", "brand essence", "positioning statement", "what does my
  brand stand for", "brand discovery", "brand workshop", "message house", "brand
  platform", "brand DNA" — or whenever someone is starting or rethinking a brand, even
  just "help me figure out my brand". Foundation skill; writes {brand_context}/brand-
  strategy.md. NOT for voice/tone execution (mkt-brand-voice), audience-only profiling
  (mkt-icp), sales angles/USP (mkt-positioning), or visual identity (mkt-visual-identity).
---

# Brand Strategy

The strategic platform a brand is built on: who it is, why it exists, the one character
it behaves like, and the single sentence that aligns audience, benefit, proof and
competitor. Identity (voice, colour, type, logo) is the *expression* of this strategy —
so this runs first, and locks, before any design begins (Wheeler's rule of order).

## Outcome

`{brand_context}/brand-strategy.md` — the brand's strategic foundation, detailed enough
that every downstream skill (`mkt-icp`, `mkt-positioning`, `mkt-brand-voice`,
`mkt-visual-identity`) can work from one consistent source of truth. It ends with a
structured JSON block so automation and other skills can read the strategy programmatically.

This is a **foundation skill** — it writes to `{brand_context}/`, not `projects/`.

## Paths

Read `skill-pack/config/sys-config.md` → `## Paths` section before any path-dependent
step. It resolves `{decoupled_base}`, `{env_file}`, `{brand_context}`, and `{projects_base}`
to absolute paths set by the installer. Substitute these placeholders wherever they appear
below. `<project_root>` is the working directory where Claude Code was launched; if
`{brand_context}/` doesn't exist there, create it before writing.

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| `{brand_context}/icp.md` | Summary | If audience is already profiled, read it and skip the discovery audience questions |
| `{brand_context}/positioning.md` | Summary | Existing market angle informs the positioning statement and competitive frame |
| `{brand_context}/voice-profile.md` | Tone only | If voice exists, align personality language and pick humanizer `deep` |
| `context/learnings.md` | `## mkt-brand-strategy` section | Apply previous corrections before starting |

Load if they exist. Proceed without them if not — the skill degrades gracefully.

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-firecrawl-scraper` | Optional | Competitor / brand-site signal pull in Research-assisted mode | WebFetch fallback, then manual paste |
| `tool-humanizer` | Recommended | De-AIs the narrative prose before saving | Save as-is; note it wasn't humanized |

## Skill Relationships

- **Upstream:** none required — this is the first foundation skill in a brand build.
- **Downstream:** `mkt-icp` (deepens the audience read), `mkt-positioning` (consumes the
  positioning statement to generate market angles), `mkt-brand-voice` (consumes archetype +
  tone coordinates), `mkt-visual-identity` (consumes the moodboard direction + archetype),
  and the `00-brand-build` orchestrator which chains all of them.
- **Trigger boundaries (avoid collisions):**
  - vs `mkt-positioning` — this skill writes the **internal positioning *statement*** (the
    strategic spine: For/Who/Is-the/That/Because/Unlike). `mkt-positioning` writes the
    **external market *angles*** (contrarian, unique-mechanism, etc.) and competitive
    white-space map. Both are valid and distinct; the statement feeds the angles.
  - vs `mkt-icp` — this skill takes only a *light* audience read in discovery. The *deep*
    customer profile is `mkt-icp`'s job. When `icp.md` exists, defer to it.
  - vs `mkt-brand-voice` — this skill sets the **archetype + four tone coordinates**;
    `mkt-brand-voice` does the full voice execution (vocabulary, samples, platform rules).

## Before You Start

**Read `context/learnings.md` → `## mkt-brand-strategy`** (if present) and apply any prior
corrections. Then check whether `{brand_context}/brand-strategy.md` already exists.

**If it exists → Update mode.** Read it, show a one-paragraph summary of the current
strategy (essence + archetype + positioning statement), and ask via `AskUserQuestion` what
to refine. Offer targeted updates (re-pick archetype, sharpen the statement, revise values)
rather than rebuilding from scratch. Show what changed and confirm before overwriting.

**If it doesn't exist → Mode selection.** ALWAYS use `AskUserQuestion` (popup) — never a
text fallback, never "type 1 / 2 / 3":

```
AskUserQuestion({
  questions: [{
    question: "How do you want to build your brand strategy?",
    header: "Mode",
    multiSelect: false,
    options: [
      { label: "Interview — ask me questions",
        description: "Founder-led discovery. I ask in small batches, then synthesise the full strategy." },
      { label: "Research-assisted — I'll give you a URL / competitors",
        description: "I pull signals from your site + competitors to pre-fill answers, then confirm with you." },
      { label: "Import — I have a brief / existing strategy",
        description: "Paste or point me at an existing brand brief; I map it to the strategy format and flag gaps." }
    ]
  }]
})
```

If the user opens with a URL or competitor names → route straight to Research-assisted. If
they paste an existing brief → route straight to Import.

## Step 1: Discovery

Read `references/discovery-questions.md` for the full grouped question bank and how to run
the session. Seven groups: **Business & goals · Audience (light) · Competitors & category ·
Personality & values · Differentiation · Visual preferences & mood · Practical constraints.**

How to run it (this matters — a wall of questions kills the session):

- **Ask in small batches** — 3–4 questions at a time, then react to the answers before the
  next batch. Follow the threads the user opens; this is a conversation, not a form.
- **Skip what context already answers.** If `icp.md` exists, skip the audience group. If
  `positioning.md` exists, skip the differentiation group's competitive questions. Tell the
  user what you're skipping and why ("you've already got an ICP — I'll use that").
- **Research-assisted mode:** before asking, fetch the user's site + named competitors
  (WebFetch → `tool-firecrawl-scraper` fallback), summarise what each looks/sounds like, and
  pre-fill the questions you can — then ask the user only to confirm or correct.
- **Reference intake (optional):** if the user shares brands/logos/images they admire,
  capture *why* (the visual and tonal cues) — this becomes raw material for the moodboard
  direction in Step 2. You are not generating images here; you're describing territory.

Capture the answers as working notes. Do not advance to synthesis until the audience,
differentiation and personality groups have real answers (those three drive everything).

## Step 2: Strategy Synthesis

Read `references/strategy-frameworks.md` for each framework's structure, when to use it, and
worked guidance. Derive the following **from the user's actual answers** — never template
filler. Each output must trace to something the user said.

1. **Golden Circle** — Why (the belief/purpose), How (values & differentiators), What.
2. **Archetype** — pick a primary from the 12 (optionally a secondary), with the reasoning
   tied to their answers. Add an **Aaker Big-Five** read (score Sincerity / Excitement /
   Competence / Sophistication / Ruggedness 1–5) for a measurable personality fingerprint.
3. **Brand Key or Brand Pyramid → Brand Essence** (2–3 words). Use Brand Key when there's a
   real competitive frame to navigate; the Pyramid when laddering features → meaning is clearer.
4. **Mission / Vision / Values (3–6) / Promise.**
5. **Positioning statement** — the Geoffrey Moore template, fully filled:
   *For [audience] who [need], [brand] is the [category] that [benefit], because [reason to
   believe], unlike [primary alternative].* This is the strategic spine everything ladders off.
6. **Moodboard direction** — colour / type / imagery territory described **in words**, plus
   the admired-references rationale from Step 1. This is the hand-off to `mkt-visual-identity`;
   it does not generate visuals.

Present the synthesis to the user as a readable summary before saving (next step) — the
strategy is a creative-direction commitment, so it needs explicit human sign-off.

## Step 3: Validate & Lock

Show a **Brand at a glance** card (essence · primary archetype · positioning statement) plus
the synthesis, then gate via `AskUserQuestion`:

```
AskUserQuestion({
  questions: [{
    question: "Here's your brand strategy. This becomes the foundation every design and copy decision is checked against — OK to lock it?",
    header: "Lock strategy",
    multiSelect: false,
    options: [
      { label: "Lock it — this is the foundation",
        description: "Saves brand-strategy.md. Downstream voice + visual work builds on this." },
      { label: "Refine the positioning statement",
        description: "Tell me what's off in the For/Who/Is-the/That/Because/Unlike and I'll rework it." },
      { label: "Re-pick the archetype",
        description: "The character doesn't feel right — I'll re-examine the 12 against your answers." },
      { label: "Adjust essence / values",
        description: "I'll revise the essence, values or mission/vision and show it again." }
    ]
  }]
})
```

Loop until the user locks. **Why this gate exists:** strategy is the foundation — if the
positioning statement or archetype is wrong, every voice and visual decision built on top
inherits the error. Catch it here, once, before design starts (Wheeler's rule of order).

## Step 4: Save Output

Ensure `{brand_context}/` exists (create it if not). Write `{brand_context}/brand-strategy.md`
using the exact structure in `references/brand-strategy-template.md`, including the closing
JSON block. Run the narrative prose (story, purpose, personality descriptions) through
`tool-humanizer` first — `deep` mode if `voice-profile.md` exists, otherwise `standard`.
The frameworks' structured fields (positioning statement template, Aaker scores, values
list) are not prose and skip the humanizer.

If the file already existed, show what changed and confirm before overwriting. After saving,
show the user the actual **positioning statement** and **brand essence** as excerpts — not
just a "saved" confirmation — and the full path.

## Step 5: Collect Feedback

Ask: *"How does this strategy land — does it feel like the brand you're building?"* Log the
response to `context/learnings.md` under `## mkt-brand-strategy` with the date and context.
If the user flags something wrong, also apply the Self-Update rule below.

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- 2026-06-27: Strategy locks before design. Never let a run hand off a moodboard direction
  or archetype to a visual skill before Step 3 lock is explicit.
- 2026-06-27: Every strategy field must trace to a user answer or a read context file. No
  generic brand-essence filler ("empowering innovation for a better tomorrow") — if you
  can't source it, ask another question.

## Self-Update

If the user flags an issue with the output — wrong archetype, weak positioning statement,
essence that doesn't fit, missed a competitive truth — update the `## Rules` section in this
SKILL.md immediately with the correction and today's date. Don't just log it to learnings;
fix the skill so it doesn't repeat the mistake.

## Troubleshooting

**Founder can't articulate the Why:** ask what made them start, what would make them proud
in 3 years, what they'd be angry to see a competitor do. The Why is in the answers, not the
question.
**Two archetypes both fit:** that's normal — pick a dominant primary and name the secondary;
the primary governs voice and visuals, the secondary adds texture. Don't force a single one
if the brand genuinely blends two.
**Positioning statement feels generic:** the [unlike] and [because] slots are usually weak —
push for the real competitor and the real reason-to-believe. "Unlike other agencies" is not
a competitor; "unlike DIY Canva templates" is.
**No competitors named:** the brand may be category-creating — frame the [category] slot as
the new category it's defining, and note it for `mkt-positioning` (Stage 1 market).
**User wants to jump straight to logos/colours:** explain briefly why strategy comes first
(design without strategy is decoration), but if they insist, save a light strategy and let
them proceed — never hard-block their work.
