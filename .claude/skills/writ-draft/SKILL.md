---
name: writ-draft
description: >
  Methodology-aware drafting AND revision — the generator counterpart to writ-review.
  DRAFT mode: turn a plan, notes, or raw source into a new piece (chapter, article, copy,
  email, keynote). REVISE mode: apply a writ-review report's prescriptions while
  preserving what works. Writes in the AUTHOR's voice, applies the craft methodology at
  correct dosage (never device-soup), and NEVER invents lived specifics — anything the
  source doesn't supply becomes a [[NEEDS:]] placeholder. Triggers: "draft this chapter",
  "write this section", "turn these notes into a chapter", "apply the review / fix this
  draft", "rewrite this with the prescriptions", "make this draft better". NOT for
  reviewing/scoring (writ-review), whole-book flow (writ-editor), transcript-to-article
  (mkt-longform-article), sales copy (mkt-copywriting), or repurposing (mkt-content-
  repurposing).
---

# Writing Draft — methodology-aware authoring & revision

The generator counterpart to `writ-review`. `writ-review` *checks* the craft; this skill *applies* it — drafting new pieces and revising existing ones in the author's voice, to a craft methodology, at the right dosage. Its hardest rule is what it refuses to do: it never invents the author's life.

## Outcome

A drafted or revised piece saved to `projects/writ-draft/{YYYY-MM-DD}_{piece-name}/draft.md`, plus a short `NEEDS.md` listing every `[[NEEDS:]]` placeholder — each with its brief AND a labelled illustrative example — that the author must fill. The draft is in the author's voice, built to the methodology's dosage discipline, humanised before saving, with **no invented lived specifics**.

Always save to disk. This is not optional. Show the full absolute path after saving.

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| methodology module(s), e.g. `projects/briefs/writing-os/methodologies/dennis-ross.md` | full | The craft — esp. §6 worked examples (style calibration), §7 dosage table, §8 per-format device budgets |
| `brand_context/voice-profile-book.md` (preferred) or `voice-profile.md` | full | The voice to write IN — the author's baseline texture and signature moves |
| `brand_context/icp.md` | summary | Who it's for — the reader the mirror must reflect |
| `brand_context/positioning.md` | summary | The angle (for copy / positioning pieces) |
| a `writ-review` report (Revise mode) | full | The located prescriptions to apply, and the "what's working" to preserve |
| `context/learnings.md` | `## writ-draft` section | Apply prior corrections before writing |

## Dependencies

| Skill / asset | Required? | What it provides | Without it |
|---------------|-----------|------------------|------------|
| methodology module | **required** | the craft + dosage budgets + few-shot examples | ask which methodology, default Dennis Ross |
| `mkt-brand-voice` output (voice-profile) | strongly recommended | the author's voice — this skill writes AS someone | write clean/neutral and flag that a voice-profile makes it sound like the author; never fake a distinctive voice |
| `writ-review` | optional (both sides) | upstream: its report drives Revise mode · downstream: scores the finished draft | self-check against the scorecard inline; offer a full writ-review pass |
| `tool-humanizer` | **required gate** | strips AI patterns before save | do not skip — run standard mode if no voice-profile |

## Skill Relationships

- **Upstream (consumes):** methodology modules; `mkt-brand-voice`; `mkt-icp`; `mkt-positioning`; `writ-review` reports; the future `writ-plan` (chapter plans).
- **Downstream (feeds):** `writ-review` (score the draft — closes the loop), `writ-editor` (whole-book flow), `writ-format` / `writ-publish`.
- **Trigger conflicts (defer, don't fire):** `writ-review` *scores*, doesn't write; `mkt-longform-article` is transcript→editorial; `mkt-copywriting` is sales copy from a brief; `mkt-content-repurposing` atomises one piece across platforms. Fire this skill only for methodology-driven authoring or revision (especially books, and any "apply the review" rewrite).

## Before You Start — detect the mode

- **DRAFT mode** — input is a chapter plan, notes, a topic, or raw source → produce a *new* piece.
- **REVISE mode** — input is an *existing* piece, ideally with a `writ-review` report → produce an improved version that applies the located fixes and keeps what works.

Also establish: which **methodology** (default Dennis Ross), the **format** (sets the device budget + gate, §8), and the **author identity** (whose voice).

## Step 1: Load methodology + author identity + input

Read the methodology module in full — especially **§6 worked examples**, the **§7 dosage table**, and the **§8 device budgets**. Load the author's voice-profile (the voice you'll write in) and icp. In Revise mode, load the existing piece and any `writ-review` report. Read `context/learnings.md` → `## writ-draft`.

## Step 2: Build the brief (the target the draft is written TO)

Write the same **Map** `writ-review` uses, so the draft aims at something: **job** (sell/teach/move/position), **reader + the feeling at the close**, the **1–3 intended emotional peaks**, the **baseline voice**, the **format**. In Revise mode, inherit the Map and verdict from the review report rather than re-deriving them. This Map is the yardstick the piece will be scored against later — write to it.

## Step 3: Plan the device placement BEFORE writing (the anti-overdose gate)

This is what stops generation from becoming device-soup. Decide, up front and in writing, the device budget for *this* piece per §8:
- where the **fire opener** sits;
- the **one focus story** (and where it resolves);
- the **emotional sequence** (what you open on — never the chronological beginning);
- where the **1–3 peaks** are — and that **athletic / three-word writing is reserved for them**, with the author's flowing baseline everywhere else;
- the **1–2 coined pairings** (no more);
- the **call-to-mirror** close.

Postures (consequence-over-journalism, the mirror, honesty, spirit) are always-on and need no budgeting. You place the devices deliberately here, then write to the plan — you do not sprinkle devices as you go.

## Step 4: Source the lived specifics — WITH the author, not FOR them (hard gate)

The methodology's house rule (§5): *AI drafts the structure and the clothing; the human supplies the consequence and the spirit.* Before writing, list the lived specifics the piece needs — names, amounts, dates, the object in the room, the scar, the real moment. For each one:
- **If the source/notes supply it**, use it.
- **If they don't, insert a two-part placeholder** and move on — **never invent the fact itself**. Each placeholder carries two things: a short **brief** (what's needed and why) AND a clearly-labelled **illustrative example** showing the shape, length, and specificity of a good answer, so the author can *react and replace* rather than stare at a bare instruction. Format:

  ```
  [[NEEDS: <what's needed + why> — e.g. (illustrative, replace with your truth): "<a concrete sample answer, written in the author's register>"]]
  ```

  The example is a model of the *form*, never a claim of fact — the `(illustrative, replace with your truth)` tag is mandatory and keeps it honestly a stand-in. A good example makes the gap obvious and the fill easy; it must never be mistaken for, or quietly harden into, the author's real detail.

A fabricated specific *presented as fact* fails the spirit test, betrays the author, and is exactly the "AI-for-you" failure (§5) the whole methodology is built to prevent. Placeholders are a feature: they mark precisely where the author's lived truth goes, and the example shows them what good looks like. Collect every placeholder (brief + example) into the `NEEDS.md` file.

## Step 5: Draft / Revise

**Draft mode** — write the piece to the Step-3 plan, in the author's voice: postures always-on; devices at planned dose and placement; peaks (and only peaks) earning the athletic seasoning; consequence-led, never journalism; closing on a mirror, not a CTA. Use §6 worked examples as *style calibration only* — they are seeds, not templates. **Do not transplant the methodology's own images** (the diamond, the elevator, "hold up a mirror") into the draft; the piece's images must be the author's own, or a `[[NEEDS:]]`.

**Revise mode** — apply the `writ-review` prescriptions **surgically**. Quote the report's "what's working" and *keep it untouched*. Fix only what's flagged, at the located spot. Do not rewrite wholesale, and do not introduce a new overdose while fixing an absence (the report's reader-guard-rails apply to you too).

## Step 6: Self-check against the scorecard

A lightweight pass against the module's §7 scorecard before you save: postures alive? devices at dose (no overdose, no device-soup)? contrast present (valleys for the peaks)? every un-sourced specific a marked placeholder, nothing invented? For a high-stakes piece (a book chapter), **offer to run a full `writ-review` pass** to score it against the gate — that closes the loop.

## Step 7: Humanizer gate

Run the draft through `tool-humanizer` before saving — `deep` mode if a voice-profile exists, otherwise `standard`. Only surface the score if the delta is significant.

## Step 8: Save output (mandatory)

Create `projects/writ-draft/{YYYY-MM-DD}_{piece-name}/` and save `draft.md` plus `NEEDS.md` (the placeholder list). **Always save output to disk. This is not optional.** Show the full absolute path, and tell the author how many `[[NEEDS:]]` placeholders are waiting on them.

## Step 9: Feedback + self-update

Ask how it landed — did it sound like the author, was the dosage right, were the placeholders in the right places? Log to `context/learnings.md` under `## writ-draft`. If the user flags an issue, update `## Rules` below immediately.

## Rules

- 2026-06-28: **Never invent lived specifics** — real names, amounts, dates, the personal moment. Use the author's supplied detail, or leave a clearly-marked `[[NEEDS:]]` placeholder. AI writes WITH the author, not FOR them. A fabricated specific presented as fact is a defect, not a convenience.
- 2026-06-28: **Every `[[NEEDS:]]` placeholder must carry BOTH a brief AND a labelled illustrative example** — `[[NEEDS: <brief> — e.g. (illustrative, replace with your truth): "<sample>"]]`. The author wants to *react and replace*, not decode an instruction. The example shows the shape of a good answer; the `(illustrative, replace with your truth)` tag is mandatory so it can never be mistaken for fact. (Roy, 2026-06-28: "more of an example in there rather than it just telling me what to do.")
- 2026-06-28: **Plan device placement before writing (Step 3) and write to that plan.** Generation without a dosage plan becomes device-soup — the exact failure `writ-review` penalises. Postures always-on; devices placed and rationed; athletic writing only at the 1–3 peaks, the author's baseline voice everywhere else.
- 2026-06-28: **Don't transplant the methodology's worked examples** (the diamond, the elevator, the mirror line) into a draft. They are style seeds; the piece's images must be the author's own or a `[[NEEDS:]]`. (This is the borrowed-exemplar trap `writ-review` flags.)
- 2026-06-28: **In Revise mode, preserve what the review marked as working**; fix only what's flagged, at the located spot. Don't rewrite wholesale, and don't add a new overdose while filling an absence.
- 2026-06-28: **Always run the humanizer gate before saving.**
- 2026-06-28: If asked to draft with no plan, notes, or source, **ask for the raw material** — this skill applies craft to substance; it does not invent the author's life or argument.

## Self-Update

If the user flags an issue with a draft — wrong voice, a device overdone, an invented detail that should have been a placeholder, a working passage needlessly rewritten — update the `## Rules` section in this SKILL.md immediately with the correction, so the next draft doesn't repeat it. Rules are read before every run and treated as hard constraints. This is distinct from learnings (which track feedback patterns over time).

## Troubleshooting

- **No methodology named** — default to Dennis Ross.
- **No voice-profile available** — write in a clean, neutral register and state that a voice-profile would make it sound like the author; do **not** guess a distinctive voice (a wrong voice is worse than a neutral one).
- **The source lacks the lived specifics** — expected and fine. Mark placeholders; don't fabricate. The draft is a scaffold the author completes.
- **Revise request with no review report** — run the Map yourself (Step 2) or offer a `writ-review` pass first, so the revision has located targets rather than vibes.
- **The methodology library path differs** — modules live in `projects/briefs/writing-os/methodologies/`. See `writ-review/references/methodology-library.md` for the module contract.
