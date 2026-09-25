---
name: writ-editor
description: >
  Whole-MANUSCRIPT editorial pass — the managing-editor read above the per-piece reviewer.
  Reviews a whole book or multi-chapter manuscript for what single-chapter review can't
  see: through-line coherence, macro arc and reader transformation, continuity (facts,
  timeline, names), cross-chapter repetition (deliberate callback vs unwitting repeat),
  pacing and peak distribution, promise-and-payoff, and voice consistency — the craft
  methodology registry at manuscript scale. Triggers: "review my manuscript", "does the
  book hang together", "does it flow between chapters", "is the arc working", "am I
  repeating myself across chapters", "does it go round the houses", "continuity check",
  "does the order work", "is the through-line clear", "editor pass", "managing-editor
  read". NOT for one chapter standalone (writ-review) or writing/revising (writ-draft).
---

# Writing Editor — whole-manuscript pass

Reviews a whole book or multi-chapter manuscript for everything that only becomes visible **across** chapters: the through-line, the arc, continuity, repetition, pacing, payoff, and voice consistency. This is the publisher's *managing-editor* read — the line editor (`writ-review`) makes each chapter excellent on its own; this skill makes the chapters add up to a book.

The cardinal idea carries over from `writ-review` but moves up a level: **more is not better — the right structure is better.** A book where every chapter is individually a 9 can still fail if the chapters don't build, contradict each other, repeat themselves, or bury all the peaks in the first third. Effectiveness at book scale is about *relationships between pieces*, not the pieces themselves.

## Outcome

A scored editorial report saved to `projects/writ-editor/{YYYY-MM-DD}_{book-name}/editor-report.md`, containing:
1. **The Manuscript Map** — the book's single promise/spine, its intended reader and transformation, and a one-line job for every chapter (the yardstick).
2. **The Chapter Inventory** — the cross-chapter substrate: per chapter, the stories/examples used, the lessons asserted, the device peaks, and the checkable facts. Every later check reads off this.
3. **Dimension scores (M1–M7)** — through-line, arc/transformation, continuity, repetition, pacing/peak-distribution, promise/payoff, voice consistency — each scored as a whole-book read with **chapter-located** evidence.
4. **Continuity & repetition registers** — every contradiction and every repeated element, each with *both* locations and a verdict.
5. **The structural prescription** — the highest-leverage moves first (reorder / cut / merge / bridge / resolve a thread / redistribute peaks / fix a contradiction), each one located.
6. **Verdict + gate** — does the manuscript hold together, with the top 1–3 structural fixes that move the needle most.

Always save the report to disk. This is not optional. After saving, show the full absolute file path so the user can click it.

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| the manuscript itself (the book / chapters under review) | full | the object of the review — parsed into chapters to build the inventory |
| `references/manuscript-lens.md` | full | the manuscript-scale scoring model: the M1–M7 dimensions, the inventory + register formats, the peak-map method, and the gate. This *is* the rubric |
| methodology module(s), e.g. `projects/briefs/writing-os/methodologies/dennis-ross.md` | full | the craft definition whose **postures and spine** the book-wide consistency checks reference (so "voice/spirit drift" and "arc" are judged against the same craft the chapters were written to) |
| `brand_context/voice-profile-book.md` (preferred) or `brand_context/voice-profile.md` | full | the author's baseline texture — the yardstick for the voice-consistency dimension (which chapters drift from the author's real voice) |
| `brand_context/icp.md` | summary | who the reader is and where they start — feeds the arc/transformation check (does the book move *this* reader) |
| `context/learnings.md` | `## writ-editor` section | apply previous corrections before reviewing |

Load if they exist. The skill needs the manuscript and `references/manuscript-lens.md`. It runs best with a methodology module and a book voice-profile; without them it infers the spine and baseline from the manuscript itself and says so (lower confidence on the arc and voice-drift checks).

## Dependencies

| Skill / asset | Required? | What it provides | Without it |
|---------------|-----------|------------------|------------|
| `references/manuscript-lens.md` | **required** | the manuscript-scale rubric | can't score — this is the lens |
| methodology module (writing-os library) | recommended | the craft/postures the book is held to | infer the spine and postures from the manuscript, flag lower confidence |
| `mkt-brand-voice` output (voice-profile-book) | recommended | the author's baseline for voice-drift | infer the baseline from the bulk of the manuscript, flag lower confidence |
| `mkt-icp` output (icp.md) | optional | the reader the arc must move | infer the reader from the manuscript or ask |
| `writ-review` | optional, complementary | per-chapter craft scores | recommend running it on the weakest chapters; never duplicate its per-piece scoring here |

## Skill Relationships

- **Upstream (consumes):** methodology modules in the writing-os library; `mkt-brand-voice` (`voice-profile-book.md`); `mkt-icp`. Often run *after* `writ-review` has lifted the individual chapters.
- **Downstream (consumed by):** `writ-draft` (acts on the structural prescriptions — e.g. drafts a missing bridge chapter, rewrites a drifting chapter, resolves an orphaned thread); a future `00-book` orchestrator (the editor pass in the book pipeline).
- **Sibling (do NOT do its job):** `writ-review` owns the *per-piece* craft score — one chapter, standalone, position-agnostic. This skill is strictly *cross-chapter*: it assumes each chapter's standalone craft is `writ-review`'s business and looks only at how the chapters relate. **Never re-score a single chapter's internal device usage here** — if a chapter is individually weak, note it and point to `writ-review`, don't fold a per-piece critique into the manuscript score.
- **Trigger conflicts (defer, don't fire):** a request to review/score *one* chapter or piece → `writ-review`. A request to *write or fix* a chapter → `writ-draft`. Conversion → `mkt-copywriting`; virality → `mkt-social-showing`; de-AI → `tool-humanizer`.

## Before You Start

Establish three things (ask only if not inferable from the manuscript + context):
- **Which methodology stack?** Default to Dennis Ross (`dennis-ross.md`). The book-wide checks reference its postures and spine.
- **What is the manuscript's intended single promise / through-line?** If the author has stated it (a brief, a subtitle, an intro), use it as the yardstick. If not, infer it and **state your read** — the whole coherence check depends on naming the spine, so a wrong-but-explicit spine is more useful than none.
- **What's the scope of this pass?** The whole book, a set of chapters, a part/section? Continuity and arc are only as complete as the span you can see — say what you reviewed and what you didn't.

## Step 1: Load the lens + context

Read `references/manuscript-lens.md` in full — the M1–M7 dimensions, the inventory and register formats, and the gate live there. Read the methodology module (for the postures and spine the book is held to) and the author's `voice-profile-book.md` (the baseline texture). Read `context/learnings.md` → `## writ-editor` and apply any prior corrections.

Why: this SKILL.md is the generic engine; the manuscript rubric lives in the lens, and the craft it references lives in the methodology module. Keeping them separate is what lets a different book, with a different methodology stack and a different author voice, run through the same engine.

## Step 2: Ingest the manuscript → build the Chapter Inventory

Parse the manuscript into its chapters/sections. For **each** chapter, extract a compact inventory card — this is the substrate every cross-chapter check reads off, so do it properly; this is the step where genuine reading beats skimming:

- **Job** — the one thing this chapter is for (one line).
- **Stories / examples** — the anecdotes, cases, and metaphors it uses (named, so repeats across chapters are detectable).
- **Lessons / claims** — the takeaways it asserts.
- **Peaks** — where its emotional/device high points sit (focus story, athletic passage, brutal-honesty beat, call-to-mirror).
- **Checkable facts** — figures, dates, names, sequence markers ("£75", "first UK BOS UP coach", "in 2021", "my eldest") — the raw material for the continuity check.

For a large manuscript this is the heavy lifting and parallelises cleanly: extract one inventory card per chapter (sub-agents are well suited), then reason across the assembled cards yourself. The cross-chapter intelligence is in the *reasoning over* the inventory, not the extraction — never let parallel extraction skip the synthesis.

See `references/manuscript-lens.md` for the inventory card format.

## Step 3: Build the Manuscript Map

From the inventory + the stated/inferred promise, write a short **Map**: the book's single spine (the one argument/promise), the reader and where they start, the transformation the book intends to deliver by the close, and the one-line job of each chapter laid out in order. This is the yardstick — every dimension is scored against it. If the spine or transformation is genuinely unknowable, ask; otherwise state your read explicitly at the top of the report.

## Step 4: Score the seven dimensions — relationships, not pieces

Using the lens (`manuscript-lens.md` §M1–M7), score each dimension 1–10 as a whole-book read, every score carrying **chapter-located** evidence:

- **M1 Through-line / coherence** — does one spine run the whole way; does every chapter earn its place and advance the argument; are there chapters doing no distinct job or two chapters doing the same job.
- **M2 Macro arc / transformation** — do the chapters *build*; is there escalation; does the reader arrive somewhere; does the order serve the arc.
- **M3 Continuity** — facts, figures, timeline, names, and the author's own claims consistent across chapters. Fill the **continuity register**; contradictions are binary defects, not matters of degree.
- **M4 Repetition & redundancy** — the same story/example/metaphor/phrase/lesson across chapters. Fill the **repetition register**, and for each call it: deliberate **callback** (motif returning with new weight — keep) vs unwitting **repeat** (told again as if new — cut or fold).
- **M5 Pacing & peak distribution** — across the whole book, where it sags and where it rushes, and whether the peaks are *distributed* or clustered. All the focus stories and athletic peaks in the first third with a flat back half is a manuscript defect even when each chapter passed standalone. Use the peak map.
- **M6 Promise & payoff** — are the questions/threads/setups opened early resolved (or deliberately, satisfyingly left open) by the close; does the book deliver what its opening promised; list orphaned setups and unkept promises.
- **M7 Voice consistency** — does the author's baseline voice hold across all chapters, or do some drift (gone corporate, over-athleticised, or written *for* not *with* the author). Name the chapters that read like a different hand.

The discipline that keeps this honest: **stay above the chapter.** If you catch yourself critiquing one chapter's internal craft, stop — that's `writ-review`'s job. Your findings are always *about the relationship between two or more chapters*, or *about the book as a whole*.

## Step 5: Prescribe structurally — highest leverage first

Turn the findings into **located structural moves**, ordered by leverage. Book-level fixes are moves on the manuscript, not line edits:
- "Chapters 4 and 7 both run the £75 story as a first telling — keep it in 4 (where it sets up the risk theme) and in 7 replace it with a one-line callback."
- "The transformation stalls: chapters 2–5 all sit at the same emotional altitude. Move the diagnosis chapter (6) up to 3 so the stakes rise before the method arrives."
- "The opening promises a system; the book never names it as one. Add a one-page spine statement to the intro and a closing chapter that pays it back."
- "Continuity: £75 in ch1 vs £750 in ch9 — reconcile the figure."

Group as **What's working** (the structure to protect) / **What's not** / **The moves**. Never prescribe "tighten it up" — name the chapters and the move. Where a chapter's *internal* craft is the real problem, the move is "run `writ-review` on chapter N", not a craft critique here.

## Step 6: Verdict + gate

Give the overall read and apply the manuscript gate from `manuscript-lens.md` §Gate: a book holds together when **no dimension is below 8, the continuity register has zero open contradictions, and the arc delivers the promised transformation.** State plainly: **holds together**, or **revise** with the top 1–3 structural moves that matter most. Continuity contradictions and a missing through-line are the two defects that fail a manuscript on their own regardless of other scores — flag them as blocking.

## Step 7: Save the report

Create `projects/writ-editor/{YYYY-MM-DD}_{book-name}/` and save `editor-report.md`. **Always save output to disk. This is not optional.** Show the full absolute path so the user can click it.

## Step 8: Feedback + self-update

Ask "How did this land — was the diagnosis right, and were the structural moves the ones you'd make?" Log the response to `context/learnings.md` under `## writ-editor` with the date and context. If the user flags a wrong call — a contradiction missed, a callback mistaken for a repeat, a reorder that doesn't fit the book — update the `## Rules` section below immediately. Fix the skill, don't just note it.

## Rules

- 2026-06-28: Stay above the chapter. Findings must be about the *relationship between chapters* or the book as a whole. Never re-score a single chapter's internal craft/device usage here — that's `writ-review`. If a chapter is individually weak, note it and point to `writ-review`; don't fold a per-piece critique into the manuscript score.
- 2026-06-28: Name the spine before scoring anything. Coherence and arc have no meaning without the book's single promise as the yardstick — if the author hasn't stated it, infer it and state your read explicitly. A wrong-but-explicit spine is more useful than an unstated one.
- 2026-06-28: Distinguish callback from repeat. A motif that deliberately returns with new weight is a strength; the same story told twice as if new is a defect. Never flag intentional callbacks as repetition, and never wave through an unwitting repeat as a callback — judge it by whether the second appearance adds something.
- 2026-06-28: Continuity contradictions are binary defects, located with BOTH chapter references. Don't soften "£75 in ch1 vs £750 in ch9" into a stylistic note — it either reconciles or it doesn't, and an open contradiction is blocking.
- 2026-06-28: Peaks need distribution, not just presence. A book can pass every per-chapter review and still fail pacing if all the focus stories / athletic peaks / emotional highs cluster in one stretch. Judge the peak map across the whole manuscript.
- 2026-06-28: Don't manufacture structural problems to justify the pass. If a manuscript largely hangs together, say so and protect what works — recommend the few real moves, never a reorder for its own sake or repetition flags on things that read once.
- 2026-06-28: Prescriptions are located structural MOVES (reorder / cut / merge / bridge / resolve / reconcile / redistribute), naming the chapters. Never a bare "tighten" or "improve flow".

## Self-Update

If the user flags an issue with an editorial pass — a contradiction missed, a callback mistaken for a repeat, a structural move that didn't fit the book, an arc misread — update the `## Rules` section in this SKILL.md immediately with the correction, so the next pass doesn't repeat it. Rules are read before every run and treated as hard constraints. This is distinct from learnings (which track feedback patterns over time).

## Troubleshooting

- **No methodology named** — default to Dennis Ross. The book-wide checks reference its postures; a different stack just changes which postures the voice/spirit-drift check looks for.
- **No voice-profile available** — infer the baseline from the bulk of the manuscript (the dominant texture across chapters) and say the voice-drift check (M7) is lower-confidence.
- **The manuscript is huge** — extract the Chapter Inventory in parallel (one card per chapter), then do the cross-chapter reasoning yourself over the assembled cards. The intelligence is in the synthesis; never let parallel extraction replace it.
- **Only part of the book is available** — review what you have, but say so plainly: continuity, arc, and payoff are only as complete as the span you can see. Flag which checks are partial.
- **A chapter is individually broken** — note it and route to `writ-review`; don't try to fix per-piece craft from up here.
- **The methodology library path differs** — modules currently live in `projects/briefs/writing-os/methodologies/`. See `writ-review/references/methodology-library.md` for the module contract and how to point at a different library.
