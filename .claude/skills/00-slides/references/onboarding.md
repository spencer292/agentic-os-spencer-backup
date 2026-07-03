# 00-slides Onboarding

First-run walkthrough for users invoking `/00-slides` for the first time.

## What This Does

Turns a topic, outline, or transcript into a production-quality HTML presentation. Pauses once for outline approval, then renders the finished deck and opens it in your browser.

## Inputs

- **A topic** — short phrase, e.g. "AI agents in customer support". The system researches before drafting.
- **A rough outline** — bullet points or section headers. Skip research, jump to structuring.
- **A transcript** — long-form text (~30 min+ of content). System extracts themes first.
- **A finished outline** — numbered slides with content per slide. Skip straight to rendering.

The orchestrator detects which one you provided automatically.

## Outputs

- `slides.html` — self-contained HTML deck, opens in your browser
- `slides.pdf` — optional (request during the run or in config)
- `outline.md` — the approved outline used for rendering, saved alongside

All in `projects/00-slides/{YYYY-MM-DD}/{presentation-slug}/` (final files) and `projects/00-slides/{YYYY-MM-DD}/logs/` (working data).

## How It Works (Phases)

1. **Detect input type** — figure out whether you gave a topic, outline, or transcript.
2. **Research or extract** — for topics, chain `str-trending-research` to gather context. For transcripts, extract key themes.
3. **Structure** — build a slide-by-slide outline matched to the presentation type (pitch, talk, workshop, etc.).
4. **Approval checkpoint** — show you the outline. You approve, edit, or rework before any rendering happens.
5. **Render** — pass the approved outline to `viz-frontend-slides`, which produces the HTML with viewport-safe layout and brand-aware design.
6. **Deliver** — save HTML + outline, auto-open in browser, generate PDF if requested.

## Checkpoints

The pipeline pauses **once**, after Step 3, for outline approval. Nothing renders until you approve. You can edit, reorder, add, or remove slides at this point — the system re-presents and waits again.

If you rejected the type detection (e.g., system thinks "pitch" but you want "workshop"), say so during approval — system rebuilds the structure.

## Setup Checklist

**Required:**
- Node.js installed (slides render via HTML/JS)

**Optional:**
- `brand_context/visual-identity/tokens.json` populated — pre-fills brand colors and typography. Run `/mkt-visual-identity` to build it (from a URL, PDF, screenshots, or brand docs — no API key required), or proceed with neutral defaults.

**First-run prompts (batched in a single AskUserQuestion):**

| Tab | Question | Default |
|-----|----------|---------|
| 1 | Style preset (auto / specific name) | `auto` (matches presentation type) |
| 2 | Max slide count cap | `20` |
| 3 | PDF export default | `on request only` |
| 4 | Auto-open in browser | `yes` |

After you submit, the system saves `_customized: true` to `skill-pack/config/sys-config.md` and skips onboarding on subsequent runs.

## Where Config Lives

- **Operational config:** `.claude/skills/00-slides/skill-pack/config/sys-config.md` — edit anytime to change defaults.
- **Brand identity:** `brand_context/visual-identity/tokens.json` (at project root or `agentic-os/`) — produced by `mkt-visual-identity`, shared across all skills.
- **Decoupled paths:** `.claude/skills/00-slides/skill-pack/config/sys-config.md` → `## Paths` section — auto-populated on install, do not edit unless you moved the project.
