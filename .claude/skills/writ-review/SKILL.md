---
name: writ-review
description: >
  Methodology-aware writing review and scoring. Critiques a piece (chapter, article, copy,
  email, keynote) against a chosen craft methodology and reports what works, what doesn't,
  and exactly how to fix it — scoring EFFECTIVENESS, not presence: overused or misplaced
  devices score DOWN. Pilot methodology: Dennis Ross "Lead With Words". Triggers: "review
  this draft/chapter", "score this against the methodology", "what's working and what's
  not", "is this landing", "why does this read oddly", "make this piece work". NOT for
  conversion scoring (mkt-copywriting), virality (mkt-social-showing), human-ness / AI-
  pattern removal (tool-humanizer), or writing from scratch (writ-draft). The craft
  reviewer, not a generator.
---

# Writing Review — methodology-aware

Reviews a finished or draft piece against a chosen craft methodology and tells the writer **what's working, what isn't, and precisely how to fix it.** The whole point is to score *effectiveness*, not presence: the techniques in a methodology are dosed and placed, and using too many of them — or the right one in the wrong place — makes writing *worse*. This skill is the antidote to "more devices = better".

## Outcome

A scored review report saved to `projects/writ-review/{YYYY-MM-DD}_{piece-name}/review.md`, containing:
1. **The Map** — the piece's job, reader, intended emotional peaks, baseline voice, and format (the yardstick).
2. **Posture scores** — the always-on, whole-piece qualities.
3. **Device scores** — each craft device rated on placement × dosage × execution, with line/section evidence.
4. **Interaction & contrast flags** — voice conflicts, saturation, over-coining, missing valleys.
5. **The prescription** — grouped as *What's working / What's not / How to make it work*, every fix a located, specific edit.
6. **Verdict + gate** — overall read and the format's pass/revise threshold.

Always save the report to disk. This is not optional. After saving, show the full absolute file path so the user can click it.

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| methodology module(s), e.g. `projects/briefs/writing-os/methodologies/dennis-ross.md` | full | The technique set, the §7 dosage/interaction table, the scorecard, and the 5 diagnostic questions — this *is* the rubric |
| `brand_context/voice-profile-book.md` (preferred) or `brand_context/voice-profile.md` | full | The author's baseline texture — defines what counts as "peak seasoning" vs the norm; required for the athletic-overdose check |
| `brand_context/icp.md` | summary | Who the reader is (feeds diagnostic Q2: what should they feel) |
| `context/learnings.md` | `## writ-review` section | Apply previous corrections before reviewing |

Load if they exist. The skill cannot run without at least one methodology module — if none is named, ask which to use (default: Dennis Ross). It can run without voice-profile by inferring the baseline from the piece itself, but says so.

## Dependencies

| Skill / asset | Required? | What it provides | Without it |
|---------------|-----------|------------------|------------|
| methodology module (writing-os library) | **required** | the craft definition + scoring rubric | can't score — ask which methodology, default Dennis Ross |
| `mkt-brand-voice` output (voice-profile) | recommended | the author's baseline texture | infer the baseline from the piece, flag lower confidence |
| `mkt-icp` output (icp.md) | optional | the reader, for the "what should they feel" yardstick | ask the user or infer |
| `tool-humanizer` | optional, downstream | fixes the AI-pattern tells the spirit posture flags | recommend it as a follow-on, don't run it here |

## Skill Relationships

- **Upstream (consumes):** methodology modules in the writing-os library; `mkt-brand-voice`; `mkt-icp`.
- **Downstream (consumed by):** `writ-draft` (future book engine), `mkt-copywriting`, `mkt-longform-article`, `mkt-social-showing` — any of these can call this skill for a craft pass on a draft.
- **Sibling (do NOT do its job):** `writ-editor` owns the *whole-manuscript* pass — flow between chapters, continuity, repetition across the book, the macro arc, pacing. This skill is strictly *per-piece* and *standalone*. Hand cross-piece observations to `writ-editor`; never fold them into a piece's standalone score.
- **Trigger conflicts (defer, don't fire):** `mkt-copywriting` owns *conversion* scoring; `mkt-social-showing` owns *virality/hook* scoring; `tool-humanizer` owns *human-ness* scoring. This skill is the *craft* reviewer against a methodology. If the user wants "will it convert / will it travel / de-AI this", route there instead.

## Before You Start

Establish two things (ask only if not inferable):
- **Which methodology stack?** Default to Dennis Ross (`dennis-ross.md`). A piece can be reviewed against more than one module — load each and score per module.
- **What format?** book chapter / long-form article / copy / social / email / keynote. This sets the device budget and the gate (see the module's §8). Infer from the piece and state your read.

## Step 1: Load the methodology + context

Read the methodology module(s) in full — especially the **§7 scoring model** and the **§7.2 dosage & interaction table**. Read the author's voice-profile (the baseline texture). Read `context/learnings.md` → `## writ-review` and apply any prior corrections.

Why: the rubric lives in the module, not in this file. Different methodologies have different devices, doses, and interactions. The skill is the generic engine; the module is the craft.

## Step 2: Map the piece — run the diagnostic questions FIRST

Before scoring anything, answer the module's five diagnostic questions (Dennis Ross §7.4):
1. What is this piece's **job**? (sell / teach / move / position)
2. Who is the **reader**, and what should they **feel** by the close?
3. Where are the **1–3 intended emotional peaks**?
4. What is the **baseline voice/texture**? (from voice-profile)
5. What **format** is it?

Produce a short **Map** block from the answers. If any are genuinely unknowable from the piece + context, ask the user — this is a human-in-the-loop gate. **You cannot score effectiveness without the yardstick;** a score with no Map is noise. If you proceed on assumptions, state them explicitly at the top of the report.

## Step 3: Score effectiveness, not presence

Using the module's scorecard (§7.3):
- **Postures** (whole-piece qualities) — score each 1–10 as a single read of the entire piece.
- **Devices** — score each on **placement** (right home?), **dosage** (right amount — *under and over both lose points*), and **execution** (done well?).

For every score, cite the evidence — quote the line or name the section. The cardinal rule: **a device that is overused or misplaced scores down.** Never reward "more". If a piece is wall-to-wall statement questions or three-word sentences, that is a *defect* to be marked, not a strength to be praised.

## Step 4: Check interactions & contrast

This is where "every device is technically present but the piece reads oddly" gets caught. Run the module's interaction checks (§7.2):
- **Voice conflict** — is a device (classically athletic/three-word writing) overriding the author's baseline voice? Baseline wins; the device is reserved for peaks.
- **Saturation** — too many statement questions / unresolved suspense threads.
- **Over-coining** — more than ~2 signature lexicon pairings, so none land.
- **Missing contrast** — are there valleys for the peaks to stand against? All-peak = no peak.

## Step 5: Prescribe surgically

Turn every weakness into a **located, specific edit** — not a category. Good prescriptions name the place and the move:
- "Para 2 has gone staccato — restore your flowing voice here; save the three-word punch for the line about the diagnosis."
- "This section runs four statement questions; keep the strongest opener and resolve or convert the other three."
- "The opening is journalism ('I started my business in 2009…') — lead instead with the consequence two paragraphs down."

Group the output as **What's working** (so the writer keeps it) / **What's not** / **How to make it work**. Never write "add more X".

## Step 6: Verdict + gate

Give an overall read and apply the format's gate from the module's §8 (book chapters gate at 9/10; long-form/copy/email relax to "no posture below 8, no device below 7"; social gates on the hook). State plainly: **pass**, or **revise** with the top 1–3 fixes that move the needle most.

## Step 7: Save the report

Create `projects/writ-review/{YYYY-MM-DD}_{piece-name}/` and save `review.md`. **Always save output to disk. This is not optional.** Show the full absolute path.

## Step 8: Feedback + self-update

Ask "How did this land — was the diagnosis right?" Log the response to `context/learnings.md` under `## writ-review` with the date and context. If the user flags a wrong call (a device misjudged, an overdose missed, a prescription that didn't fit), update the `## Rules` section below immediately — fix the skill, don't just note it.

## Rules

- 2026-06-27: Score effectiveness, never presence. Overuse, misplacement, and voice-conflict are defects that lose points. Never recommend "add more" of a device already at or over its dose.
- 2026-06-27: Never score before completing the Map (Step 2). Without the job/reader/peaks/baseline/format yardstick, a score is meaningless — ask or state assumptions.
- 2026-06-27: The author's voice-profile is the baseline texture. Athletic / three-word writing is peak seasoning, not the default; flag it as overdose when pervasive — except for social, where short-form makes it native.
- 2026-06-27: Prescriptions must be located and specific (name the line/section and the move). Never prescribe a bare category like "add statement questions".
- 2026-06-27: Already-published or previously-praised writing is NOT the source of truth for "good". The skill's job is to find the ceiling the piece hasn't hit, so score against the methodology, never against the author's or a prior reviewer's earlier scores. A lower score than a published piece "earned" before is expected and correct — do not soften to match it.
- 2026-06-28: Review each piece as a STANDALONE artifact. It must stand on its own craft with the SAME bar wherever it sits in a larger work — beginning, middle, or end. Never relax or tighten the gate by position (an opening is not gated more leniently for being an opening). Cross-piece concerns — flow between chapters, continuity, repetition across a book, the macro arc/transformation, pacing — are OUT OF SCOPE here; they belong to the whole-manuscript editor pass (`writ-editor`). If you spot a cross-piece issue, note it as a one-line aside for the editor pass, but never let it change this piece's standalone score.

## Self-Update

If the user flags an issue with a review — a device misjudged, an overdose or voice-conflict missed, a prescription that didn't fit the piece — update the `## Rules` section in this SKILL.md immediately with the correction, so the next review doesn't repeat it. Rules are read before every run and treated as hard constraints. This is distinct from learnings (which track feedback patterns over time).

## Troubleshooting

- **No methodology named** — ask which module to score against; default to Dennis Ross. A piece can be scored against several modules in one pass.
- **No voice-profile available** — infer the baseline texture from the piece's own dominant rhythm, and say the athletic-overdose check is lower-confidence as a result.
- **The piece is raw / structureless** — still produce the Map; the first prescription is usually the structural one (sequence, opener, close).
- **The methodology library path differs** — modules currently live in `projects/briefs/writing-os/methodologies/`. See `references/methodology-library.md` for the module contract and how to point at a different library location.
