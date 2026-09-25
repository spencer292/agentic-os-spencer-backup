# The Manuscript Lens — the whole-book scoring model

This is the rubric `writ-editor` scores against. Where a methodology module (e.g. `dennis-ross.md` §7) scores a **single piece's craft**, this lens scores the **relationships between pieces** — the things that only exist across a whole manuscript. It is methodology-agnostic: it references the chosen module's *postures* (for the voice/spirit-drift and arc checks) but adds the cross-chapter dimensions no per-piece rubric contains.

> The governing idea, carried up a level from the per-piece rubric: **effectiveness is relational at book scale.** A device, a story, an emotional peak that works beautifully *in* a chapter can still hurt the *book* — because it repeats something three chapters back, or because every peak lands in the first third, or because the chapter it sits in does the same job as the one before it. More good chapters is not a good book. The *right arrangement* of chapters is.

## Table of contents
- The Chapter Inventory (the substrate)
- The seven dimensions (M1–M7)
- The Continuity Register
- The Repetition Register
- The Peak Map
- The Gate
- Report skeleton

---

## The Chapter Inventory (build this first — everything reads off it)

Before any dimension can be scored, reduce each chapter to a compact card. The cross-chapter checks are only as good as this inventory, so extract it from a genuine read, not a skim. For a large book, one card per chapter parallelises cleanly (sub-agents); the *reasoning across* the cards is the part that must not be skipped.

**Inventory card format (one per chapter):**

```
### Ch{N} — {title}
- Job: {the one thing this chapter is for, one line}
- Stories/examples: {named anecdotes, cases, metaphors — name them so repeats are detectable}
- Lessons/claims: {the takeaways it asserts}
- Peaks: {where the emotional/device highs sit — focus story / athletic passage / brutal-honesty beat / call-to-mirror, with a rough position: open / mid / close}
- Facts: {checkable specifics — figures, dates, names, sequence markers, e.g. "£75", "first UK BOS UP coach", "2021", "eldest daughter"}
- Voice read: {does it sound like the author's baseline, or drift? one line}
```

Assemble all cards into one inventory block. The registers and dimensions below are computed against it.

---

## The seven dimensions

Score each **1–10 as a single whole-book read**, every score carrying chapter-located evidence (cite `Ch{N}` and quote/point to the spot). These are postures of the *manuscript*, not devices — you want them all high; none is "dosed". The two starred dimensions (M3, M1) can fail a book on their own (see Gate).

### M1 — Through-line / coherence ★
Does **one spine** — a single promise/argument — run the whole way, and does every chapter earn its place by advancing it?
- Is the book's single claim nameable in one sentence? (If you can't, that's the finding.)
- Does each chapter do a **distinct** job, and is that job *on* the spine? Flag chapters that do no distinct job, that duplicate another chapter's job, or that wander off the spine.
- Is anything **missing** — a step the argument needs but no chapter provides (a gap, not just a weak chapter)?
- Scores down: no nameable spine; two chapters doing the same job; a chapter that could be deleted with no loss; a topic the promise needs that never appears.

### M2 — Macro arc / transformation
Do the chapters **build**, and does the reader **arrive** somewhere?
- Is there escalation — stakes/insight/altitude rising across the book, not a flat list of equally-pitched topics?
- Does the **order** serve the arc? Could reordering chapters strengthen the build? (At book scale this is the analog of the methodology's emotional-sequencing device — applied to chapter order, not sentences.)
- Does the book deliver the **transformation** it intends for *this* reader (from `icp.md`): do they end somewhere different from where they started?
- Scores down: chapters interchangeable in order; no rise; the book "ends" rather than "arrives"; the reader is informed but not moved.

### M3 — Continuity ★
Are facts, figures, timeline, names, and the author's own claims **consistent** across chapters? Fill the **Continuity Register**.
- Numbers and amounts (£75 vs £750), dates and ages, sequence ("before I started the company" vs a later chapter placing it after), names and their spellings, and repeated self-descriptions ("first UK BOS UP coach" phrased two incompatible ways).
- A person/place/concept introduced **as if new** in a later chapter when already introduced.
- Continuity findings are **binary** — it reconciles or it doesn't. Don't soften a contradiction into a stylistic note. Every entry carries **both** locations.

### M4 — Repetition & redundancy
Is the same **story / example / metaphor / signature phrase / lesson** reused across chapters? Fill the **Repetition Register**, and call each one:
- **Callback** (keep): a motif that returns *deliberately, with new weight* — the second appearance recontextualises or pays off the first. This is a strength; do not flag it as a defect.
- **Repeat** (cut/fold): the same thing told *again as if new* — the second appearance adds nothing the reader didn't already have. Cut it, or reduce it to a one-line callback to the first telling.
- Signature phrases are dosed across the *book*, not just the chapter: a phrase that's a fresh coinage in ch1 reads as a tic by its fifth chapter. Over-coining at book scale is its own repeat.
- Scores down: first-tellings of the same anecdote in multiple chapters; the same lesson delivered fresh several times; a coined phrase worn smooth by overuse.

### M5 — Pacing & peak distribution
Across the **whole** book, where does it sag, where does it rush, and are the peaks **distributed**?
- Use the **Peak Map**. Plot each chapter's peaks (from the inventory). The failure mode this catches: all the focus stories / athletic passages / emotional highs clustered in the first third, with a flat, expository back half — a manuscript defect *even when every chapter passed `writ-review` standalone*, because peaks need valleys at book scale too.
- Density: are heavy/teaching chapters stacked with no breather; does an emotional peak get room to land or is it immediately buried by the next.
- Scores down: peaks clustered; a long flat stretch; the climax not in the structurally strongest position; relentless intensity with no valleys (the contrast law, at book scale).

### M6 — Promise & payoff
Are the **setups** — questions, threads, the "spiderweb" of statement-questions, explicit promises — opened early **resolved** (or deliberately, satisfyingly left open) by the close?
- Does the **opening promise** get delivered? (If the intro promises a system/method, does the book name and deliver it?)
- Orphaned setups: a thread opened and dropped; a question raised and never returned to; a "we'll come back to this" that never comes back.
- Unkept promises: the subtitle/intro pledges something the body doesn't cover.
- Scores down: dropped threads; an opening the ending doesn't honour; a "method" promised but never assembled.

### M7 — Voice consistency
Does the author's **baseline voice** (`voice-profile-book.md`) hold across **all** chapters?
- Name chapters that drift: gone corporate, over-athleticised (staccato throughout — the per-piece overdose, but here as a *cross-chapter* outlier), or written *for* not *with* the author (spirit-dead, lived specifics missing — the methodology's spirit posture failing in one chapter while others pass).
- This is the book-wide version of the per-piece voice check: not "is this chapter's voice good" (that's `writ-review`) but "do the chapters sound like **one author**".
- Scores down: a chapter that reads like a different hand; tone whiplash between adjacent chapters; one chapter clearly more AI-for than the rest.

---

## The Continuity Register

A table of every cross-chapter contradiction. Binary; both locations mandatory.

```
| # | What | Location A | Location B | Reconciles? | Fix |
|---|------|-----------|-----------|-------------|-----|
| 1 | Cash-at-low-point figure | Ch1 "£75 to my name" | Ch9 "down to £750" | No | Reconcile the figure — pick the true one |
| 2 | BOS UP coach claim | Ch2 "first in the UK" | Ch11 "one of the first in the UK" | No | Unify the claim |
```

If empty: "Continuity register: clean — no contradictions found across the reviewed span." (Only say this if you actually built and checked the inventory facts.)

## The Repetition Register

A table of every element appearing in more than one chapter, each verdicted.

```
| # | Element | Appears in | Verdict | Why / Fix |
|---|---------|-----------|---------|-----------|
| 1 | The £75 / Excel-course story | Ch1, Ch7 | Repeat | Both are first-tellings. Keep in Ch1; reduce Ch7 to a one-line callback |
| 2 | "Thinking outside your brain" (title phrase) | Ch1, Ch3, Ch6, Ch9, Ch12 | Callback | Deliberate motif, lands each time with new weight — keep |
| 3 | Diamond focus story | Ch2, Ch8 | Repeat | Same analogy doing the same job twice — cut the Ch8 instance |
```

## The Peak Map

A compact view of where the energy sits, to judge M5. One row per chapter, peaks marked by position.

```
Ch1  ███  (focus story open, athletic close)   — high
Ch2  █    (one mid teaching beat)              — low
Ch3  ███  (brutal-honesty peak)                — high
Ch4  █                                          — low
...
Ch10 ░    (pure exposition)                     — flat
Ch11 ░                                          — flat
Ch12 ░                                          — flat
```

Read it for *distribution*: a front-loaded map (highs in 1–4, flat 9–12) is the classic manuscript pacing defect. The fix is redistribution — move a peak chapter later, or surface a buried peak in the flat back stretch.

---

## The Gate

A manuscript **holds together** when **all three** hold:
1. **No dimension (M1–M7) below 8.**
2. **The Continuity Register has zero open contradictions.**
3. **The arc delivers the promised transformation** (M2 ≥ 8 *and* M6 confirms the opening promise is paid off).

Two defects are **blocking on their own**, regardless of the other scores:
- **An open continuity contradiction** (M3) — a book that contradicts itself isn't ready, however good the chapters.
- **No nameable through-line** (M1) — without a spine it's a collection, not a book.

Otherwise: **revise**, leading with the top 1–3 structural moves with the most leverage. Be honest in both directions — don't pass a contradicted manuscript to be encouraging, and don't fail a coherent one by manufacturing reorders it doesn't need.

---

## Report skeleton

```
# Editorial Pass — {book title}
_Reviewed: {span — whole book / chapters N–M}. Methodology: {module}. Voice baseline: {file or "inferred"}._

## The Manuscript Map
- Spine (one sentence): ...
- Reader & starting point: ...
- Intended transformation: ...
- Chapter jobs (in order): Ch1 — ... / Ch2 — ... / ...

## Chapter Inventory
{the cards}

## Dimension Scores
M1 Through-line — X/10 — {evidence}
M2 Arc/transformation — X/10 — {evidence}
M3 Continuity — X/10 — {see register}
M4 Repetition — X/10 — {see register}
M5 Pacing/peak distribution — X/10 — {see peak map}
M6 Promise/payoff — X/10 — {evidence}
M7 Voice consistency — X/10 — {evidence}

## Continuity Register
{table}

## Repetition Register
{table}

## Peak Map
{map}

## The Structural Prescription
What's working (protect): ...
What's not: ...
The moves (highest leverage first, each located): ...

## Verdict
{Holds together / Revise} — top 1–3 moves: ...
{Blocking flags, if any: open contradiction(s) / no through-line}
```
