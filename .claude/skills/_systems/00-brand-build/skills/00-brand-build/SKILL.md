---
name: 00-brand-build
description: >
  End-to-end brand build orchestrator. Runs a complete brand from scratch in the accepted
  industry order (Alina Wheeler: Research → Strategy → Identity), chaining the foundation
  skills so the whole brand comes out of one guided run: audience (mkt-icp) → strategy
  (mkt-brand-strategy: archetype, essence, positioning statement) → market angles
  (mkt-positioning) → verbal identity (mkt-brand-voice) → visual identity
  (mkt-visual-identity: colour, type, logo, templates) → a combined brand book (markdown
  source-of-truth) and a designed portrait brand-guidelines deck (PDF, agency-standard).
  Triggers on: "build a brand", "build my whole brand", "create a brand from scratch",
  "full brand build", "brand identity from scratch", "new brand end to end", "do my
  branding", "brand me from scratch", "I need a complete brand", "build out the brand".
  Use this whenever someone wants the WHOLE brand built, not just one piece. Strategy is
  locked before any design runs. Does NOT trigger for a single component — route those to
  the specific skill (voice → mkt-brand-voice, visual → mkt-visual-identity, angle →
  mkt-positioning, audience → mkt-icp, strategy only → mkt-brand-strategy).
argument-hint: "[brand name | nothing]"
allowed-tools:
  - Bash(*)
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Skill
  - Agent
  - AskUserQuestion
dependencies:
  - mkt-icp
  - mkt-brand-strategy
  - mkt-positioning
  - mkt-brand-voice
  - mkt-visual-identity
  - viz-image-gen
  - tool-humanizer
  - tool-pdf-generator
metadata:
  category: pipeline
  phase: orchestrator
---

# Brand Build Orchestrator

Builds a complete brand from scratch by running the foundation skills in the accepted
methodological order and passing context between them through the shared `brand_context/`.
The product is a coherent full brand — audience, strategy, voice, visual identity — and a
combined brand book. Each sub-skill keeps its own gates; this orchestrator sequences them,
enforces **strategy-before-design**, and assembles the final deliverable.

## Outcome

A populated `{brand_context}/` and **two** combined brand deliverables:
- `{brand_context}/icp.md`, `brand-strategy.md`, `positioning.md`, `voice-profile.md` +
  `samples.md`, and `visual-identity/` (design-tokens, fonts, logos, templates, brand-in-action)
- `{brand_context}/brand-book.md` (+ `.pdf`) — the combined brand book, the editable
  **source of truth** and AI-readable context (the enriched section model in
  `references/brand-book-assembly.md`).
- `{brand_context}/brand-deck.json` + `brand-deck.pdf` — the **designed portrait brand-guidelines
  deck** (A4; agency-standard: cover, foundations, logo suite + clear-space, colour blocks with
  HEX/RGB/CMYK + 60/30/10, type specimens, a framed uncropped brand-in-action gallery, governance),
  rendered by `skill-pack/deck/deck-renderer.js` + Chrome headless. Both copied to `~/Downloads/`.
- A run log at `{output_base}/{YYYY-MM-DD}/build-log.md` (working notes; not a brand asset).

## Paths

Read `skill-pack/config/sys-config.md` → `## Paths` and `## Settings` before starting. It
resolves `{decoupled_base}`, `{env_file}`, `{brand_context}`, `{projects_base}`,
`{output_base}`, and the pipeline settings (`stop_after`, `assemble_brand_book`,
`brand_book_path`).

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| `{brand_context}/*` | Detect presence | Decides where to enter the pipeline and which stages run Update vs Create |
| `context/learnings.md` | `## 00-brand-build` section | Apply previous pipeline corrections before starting |

The shared `{brand_context}/` **is the bus** — each stage reads the files the previous stage
wrote. There is no bespoke plumbing.

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `mkt-icp` | Yes | Deep audience profile (`icp.md`) — the research input to strategy | Strategy runs on a light audience read only |
| `mkt-brand-strategy` | Yes | Archetype, essence, positioning statement, moodboard direction | No foundation — pipeline cannot proceed |
| `mkt-positioning` | Yes | Market angles + competitive white space (`positioning.md`) | Strategy statement stands; no external angle set |
| `mkt-brand-voice` | Yes | Voice profile + samples, seeded by archetype + tone coordinates | Generic voice |
| `mkt-visual-identity` | Yes | Colour, type, logo, templates, visual brand-book | No visual identity |
| `viz-image-gen` | Recommended | Generates the brand-in-action mockups (anchored to the locked logo) | No applied mockups in the deck/book |
| `tool-pdf-generator` | Recommended | Renders the combined brand book to PDF | Ship the brand book as markdown |
| `tool-humanizer` | Recommended | De-AIs assembled brand-book prose | Sub-skills already humanize their own output |

## Before You Start

1. **Read** `skill-pack/config/sys-config.md` and `context/learnings.md → ## 00-brand-build`.
2. **Brand name first.** Ask for it if not in the trigger — every sub-skill needs it and it
   anchors the brand book. Do not proceed with a placeholder.
3. **Entry detection.** `ls {brand_context}/` and note which of `icp.md`, `brand-strategy.md`,
   `positioning.md`, `voice-profile.md`, `visual-identity/tokens.json`, `brand-book.pdf`
   already exist. Tell the user plainly: "You already have X and Y — I'll run those in Update
   mode and build the rest." A user can enter the pipeline mid-way; each sub-skill's own
   "Before You Start" handles Create-vs-Update.
4. **Run the Pre-Goal Readiness Check below — and get sign-off — before starting Phase 1.**

## Phase 0: Pre-Goal Readiness Check (mandatory, blocking)

This pipeline is **attended end-to-end** — it is a sequence of interactive sub-skills with
human gates, not a cron or deployed workflow. Never describe it as hands-off. At kickoff,
state the three buckets explicitly (per AGENTS.md autonomous-goals rule) and get the user's go:

- **Needs your approval / decision:** ICP validation · strategy lock (archetype + positioning
  statement) · chosen market angle · voice test · visual identity approval (mkt-visual-identity
  Phase 4.7 gate + template review) · final brand-book sign-off. List these up front.
- **Pauses if I stop running:** the *whole* pipeline — every stage runs only while Claude is
  actively working it. There is no background engine. If you walk away, it waits at the next gate.
- **Can stall silently:** site/competitor scrapes (Research-assisted ICP/strategy), AI image
  + font fetches and Veo/illustration calls in `mkt-visual-identity`, and PDF rendering — each
  has a fallback (WebFetch → manual; gpt-image fallback; markdown brand book if PDF fails).
  Surface a stall rather than hanging.

Print this, then ask via `AskUserQuestion` whether to start the full build, or `stop_after`
a specific stage. Honour `stop_after` from config if set.

## Phase 1: Audience — `mkt-icp`

One-line framing ("First, who we're building this for — the audience research that strategy
sits on"), then invoke directly: `Skill(skill: "mkt-icp")`. Wait for it to return `icp.md`
and the user's ICP validation. Skip to Update mode automatically if `icp.md` already exists.

## Phase 2: Strategy — `mkt-brand-strategy` *(locks before any design)*

Framing ("Now the foundation — who the brand is and the one sentence everything ladders off"),
then `Skill(skill: "mkt-brand-strategy")`. It reads `icp.md` (skips audience questions),
runs discovery + synthesis, and **locks** at its Step 3 gate. **Hard gate:** do not start
Phase 4 (visual) until `brand-strategy.md` exists and is locked — Wheeler's rule of order.
`mkt-positioning` (Phase 3) and `mkt-brand-voice` may use the strategy as soon as it's locked.

## Phase 3: Market angles — `mkt-positioning`

`Skill(skill: "mkt-positioning")`. It consumes the positioning *statement* + `icp.md` and
produces external market *angles* + competitive white space → `positioning.md`. (Different
artifact from the statement — see mkt-brand-strategy Skill Relationships.) User picks the angle.

## Phase 4: Verbal identity — `mkt-brand-voice`

`Skill(skill: "mkt-brand-voice")`. Pass through the **archetype + four tone coordinates** from
`brand-strategy.md` so voice doesn't re-ask personality — it executes them into a full voice
profile + samples. User runs the voice test.

## Phase 5: Visual identity — `mkt-visual-identity`

Only after strategy is locked. `Skill(skill: "mkt-visual-identity")`. Pass the **moodboard
direction + archetype** from `brand-strategy.md` as the design brief so it isn't starting
cold. It runs its own gates (Phase 4.7 identity approval, template review) and produces
`visual-identity/` + its visual brand-book PDF.

## Phase 6: Brand book + deck assembly

If `assemble_brand_book` is true, read `references/brand-book-assembly.md` and produce **both**
combined deliverables from the locked sources (`brand-strategy.md` + `positioning.md` +
`voice-profile.md` + `icp.md` + `visual-identity/`):

1. **Brand book (source of truth)** — assemble the enriched-section markdown at
   `{brand_context}/brand-book.md` (embed the lockups + brand-in-action images), render to
   `brand-book.pdf` via `tool-pdf-generator` (Chrome-headless path on Windows). This is the
   editable, AI-readable artifact.
2. **Designed deck (presentation)** — build `{brand_context}/brand-deck.json` to the schema in
   `skill-pack/deck/SCHEMA.md` (pull every field from the locked `brand_context/` files; do not
   invent — faithfully transcribe). Then render:
   ```bash
   node .claude/skills/00-brand-build/skill-pack/deck/deck-renderer.js \
     --data {brand_context}/brand-deck.json --out {scratch}/brand-deck.html
   chrome --headless=new --disable-gpu --no-pdf-header-footer \
     --print-to-pdf={brand_context}/brand-deck.pdf "file:///{abs}/brand-deck.html"
   ```
   The renderer auto-computes CMYK from hex, derives deck chrome from the palette, and skips any
   slide whose data is absent. QC by rasterising a few pages (PyMuPDF/`fitz`) before delivering.

Copy both PDFs to `~/Downloads/` and show the user both full paths. Then collect feedback (Phase 7).

## Phase 7: Collect feedback

Ask how the full build landed. Log to `context/learnings.md → ## 00-brand-build` with date +
brand context. Summarise what was produced (the files + the brand book path) against the
three readiness buckets, so the user sees what completed and what — if anything — is still open.

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- 2026-06-27: Strategy locks before design. Phase 5 (visual) must not start before
  `brand-strategy.md` exists and is locked at its Step 3 gate.
- 2026-06-27: This pipeline is attended, never hands-off. Always run Phase 0 readiness check
  and get sign-off before Phase 1.
- 2026-06-27: Invoke every sub-skill via the `Skill` tool directly — never tell the user to
  run `/<skill-name>` themselves, and never re-implement a sub-skill's logic inline.
- 2026-06-27: Brand-agnostic. Never seed a run with a previous brand's context — each run
  starts from this brand's `brand_context/` only. (Multiple brands = separate workspaces.)
- 2026-06-28: Phase 6 ships TWO artifacts — the markdown brand book (source of truth) AND the
  designed 16:9 deck (`brand-deck.json` → `deck-renderer.js` → Chrome PDF). Benchmarked against
  a professional agency deck (clear-space diagrams, HEX/RGB/CMYK + 60/30/10, type specimens,
  brand-in-action, incorrect-usage). Build the deck JSON by transcribing locked `brand_context/`
  files — never invent values. The deck data is the contract; the renderer is generic.
- 2026-06-28: Our strategy + verbal layer (positioning statement, archetype, NN/g voice, message
  house, governance/AI-usage) is deeper than the agency benchmark — keep those slides; they're
  the differentiator. We absorbed the benchmark's *visual-system rigor*, not its (thinner) strategy.
- 2026-06-28: Deck defaults to **portrait** (A4 1000×1414); `orientation:"landscape"` is opt-in.
- 2026-06-28: **Brand in action must be a real platform spread, uncropped.** Generate a mockup set
  (YouTube/IG post/IG story/podcast/course…) via `viz-image-gen` anchored to the locked logo, save
  to `visual-identity/brand-in-action/`, and let the deck frame them (contain, platform chip, 6 per
  2×3 slide). Never force-crop a mockup. 1-2 cramped examples is the failure mode we fixed.

## Self-Update

If the user flags an issue with the pipeline — wrong order, a stage that re-asked something
already answered, a missed hand-off — update the `## Rules` section in this SKILL.md
immediately with the correction and today's date. Don't just log it to learnings; fix the
orchestrator so it doesn't repeat the mistake.

## Troubleshooting

**A stage re-asks something an earlier stage answered:** confirm the earlier stage actually
wrote its `brand_context/` file, and that the later sub-skill's Context Needs lists it. The
bus is the files — if a file is missing, the downstream skill can't read it.
**User only wants part of the brand:** set `stop_after` (config) or route them to the single
skill directly — don't run the whole pipeline for a one-piece request.
**Strategy not locking (user keeps refining):** that's the gate doing its job. Don't force it;
a wrong foundation is more expensive than another refinement loop.
**PDF render fails in Phase 6:** ship the combined brand book as markdown at the same path and
note the PDF step failed — the assembled content is the deliverable; the PDF is the view.
**Running a second brand:** do it in a separate client/workspace so `brand_context/` doesn't
collide. See `docs/multi-client-guide.md`.
