# Brand Build System (`00-brand-build`)

A complete brand-from-scratch pipeline for Claude Code / Agentic OS. One guided run takes a
brand from nothing to an agency-standard brand book and designed guidelines deck — in the
accepted industry order (Alina Wheeler: Research → Strategy → Identity), with strategy locked
before any design happens.

## About

`00-brand-build` is an orchestrator that chains six foundation skills and three utility
skills through a shared `brand_context/` folder — each stage reads what the previous stage
wrote, so the brand stays coherent from audience research through to the final deck. The
output doubles as **AI-readable brand memory**: once built, every other skill in your
Agentic OS (copywriting, social content, design) reads the same `brand_context/` files and
writes on-brand automatically.

## What's In The Box

| Component | Role |
|-----------|------|
| `00-brand-build` | Entry skill — the orchestrator you invoke |
| `mkt-icp` | Phase 1 — ideal customer profile |
| `mkt-brand-strategy` | Phase 2 — archetype, essence, positioning statement (the strategic spine) |
| `mkt-positioning` | Phase 3 — market angles + competitive white space |
| `mkt-brand-voice` | Phase 4 — verbal identity: voice profile + writing samples |
| `mkt-visual-identity` | Phase 5 — colour, type, logo system, templates, design tokens |
| `viz-image-gen` | Utility — AI image generation (logo exploration, brand-in-action mockups) |
| `tool-humanizer` | Utility — de-AIs assembled prose |
| `tool-pdf-generator` | Utility — markdown → PDF rendering |
| `agents/ssc-template-builder.md` | Sub-agent — builds ship-ready post templates in Phase 5 |

Each skill also works standalone after install (e.g. `/mkt-icp` on its own for a quick
audience profile).

## Key Features

- **Agency methodology, one run** — research → strategy → identity, with a hard
  strategy-before-design gate. No visual work happens until the strategy is locked.
- **Human gates at every decision** — ICP validation, strategy lock, angle pick, voice
  test, identity approval, final sign-off. The system never designs past you.
- **Enter anywhere** — already have an ICP or a logo? The pipeline detects existing
  `brand_context/` files and runs those stages in Update mode instead of re-asking.
- **Two combined deliverables** — an editable markdown brand book (the source of truth)
  and a designed portrait A4 brand-guidelines deck (cover, logo suite + clear-space,
  colour blocks with HEX/RGB/CMYK + 60/30/10, type specimens, brand-in-action gallery,
  governance) rendered to PDF.
- **Real applied mockups** — brand-in-action images (YouTube, Instagram, merch, web) are
  generated anchored to your locked logo, uncropped, framed properly in the deck.
- **Graceful degradation** — every external service has a documented fallback; a missing
  API key never blocks the build.
- **Brand memory for everything else** — the populated `brand_context/` powers every
  other skill in an Agentic OS install from then on.

## Use Cases

1. **New venture** — you have a name and an idea; you leave with a complete brand and the
   PDFs to prove it.
2. **Rebrand / tidy-up** — existing business with inconsistent materials; the pipeline
   imports what you have and rebuilds the system around a locked strategy.
3. **Client work** — agencies/consultants running brand builds for clients: run it once
   per client workspace, hand over the deck, keep the brand context for ongoing content.
4. **Single components** — after install, each foundation skill works standalone
   (`/mkt-brand-voice` to redo just the voice, `/mkt-visual-identity` for just the look).

## Pipeline Flow

```
┌────────────────────────────────────────────────────────────────┐
│  INPUT: brand name (+ optionally: website URL, logo, existing   │
│  brand material, moodboard direction)                           │
└──────────────────────────────┬─────────────────────────────────┘
                               ▼
┌────────────────────────────────────────────────┐
│  0. READINESS CHECK                            │  IN:  your go/no-go
│  Lists every gate that will need your decision │  OUT: agreed run plan
│  before anything starts — no mid-run surprises │       (or stop_after stage)
└──────────────────────────────┬─────────────────┘
                               ▼
┌────────────────────────────────────────────────┐
│  1. AUDIENCE  (mkt-icp)                        │  IN:  interview / research
│  Researches who the brand serves, because      │  OUT: brand_context/icp.md
│  strategy built on a guessed audience fails    │  GATE: you validate the ICP
└──────────────────────────────┬─────────────────┘
                               ▼
┌────────────────────────────────────────────────┐
│  2. STRATEGY  (mkt-brand-strategy)             │  IN:  icp.md + discovery interview
│  Archetype, essence, mission/values and THE    │  OUT: brand_context/brand-strategy.md
│  positioning statement — the one sentence      │  GATE: strategy LOCKS here —
│  every later stage ladders off                 │  nothing visual runs before this
└──────────────────────────────┬─────────────────┘
                               ▼
┌────────────────────────────────────────────────┐
│  3. MARKET ANGLES  (mkt-positioning)           │  IN:  strategy + icp.md
│  Finds the competitive white space and the     │  OUT: brand_context/positioning.md
│  angles that win attention in YOUR market      │  GATE: you pick the angle
└──────────────────────────────┬─────────────────┘
                               ▼
┌────────────────────────────────────────────────┐
│  4. VOICE  (mkt-brand-voice)                   │  IN:  archetype + tone coordinates
│  Turns the archetype into a usable writing     │  OUT: voice-profile.md + samples.md
│  voice — so it sounds like you, not like AI    │  GATE: the voice test
└──────────────────────────────┬─────────────────┘
                               ▼
┌────────────────────────────────────────────────┐
│  5. VISUAL IDENTITY  (mkt-visual-identity)     │  IN:  moodboard direction + archetype
│  Colour, type, logo system, design tokens,     │  OUT: brand_context/visual-identity/
│  templates, applied mockups — built on the     │       (tokens, fonts, logos, templates,
│  locked strategy, not on taste alone           │        brand-in-action/)
│  (spawns the ssc-template-builder sub-agent)   │  GATE: identity approval + template review
└──────────────────────────────┬─────────────────┘
                               ▼
┌────────────────────────────────────────────────┐
│  6. ASSEMBLY                                   │  IN:  all locked brand_context/ files
│  Brand book (markdown source of truth → PDF)   │  OUT: brand-book.md/.pdf +
│  + designed A4 guidelines deck, rendered via   │       brand-deck.json/.pdf
│  the bundled deck renderer + headless Chrome   │       (both copied to ~/Downloads/)
└──────────────────────────────┬─────────────────┘
                               ▼
┌────────────────────────────────────────────────────────────────┐
│  OUTPUT: a populated brand_context/ (your permanent brand       │
│  memory), a brand book PDF, and a designed guidelines deck PDF  │
└────────────────────────────────────────────────────────────────┘

Brand files land in brand_context/ at your project root.
Run logs land in projects/00-brand-build/{YYYY-MM-DD}/build-log.md
```

## Approximate Timings

This is an **attended** pipeline — wall-clock time depends mostly on how long you spend at
the gates. Active working time measured on a real full build (Windows 11, cloud image gen):

| Phase | Active time | Notes |
|-------|------------|-------|
| 1. Audience | ~15–30 min | interview mode; research mode adds scraping time |
| 2. Strategy | ~30–45 min | the discovery interview is the heart of the build |
| 3. Market angles | ~15–20 min | includes competitor scan |
| 4. Voice | ~20–30 min | seeded by strategy, so no repeat questions |
| 5. Visual identity | ~1–2 h | image generation + your approval loops dominate |
| 6. Assembly | ~20–30 min | book assembly + deck render + QC |
| **Total** | **~3–5 h** | typically split over 2–3 sittings |

_Timings vary with interview depth, image-generation provider, and how many identity
iterations you ask for. Nothing runs unattended — walk away and it simply waits at the
next gate._

## Output Structure

```
brand_context/                         <- your permanent brand memory (all skills read this)
├── icp.md                                Ideal customer profile
├── brand-strategy.md                     Archetype, essence, positioning statement
├── positioning.md                        Market angles + competitive white space
├── voice-profile.md                      How the brand writes and speaks
├── samples.md                            Worked writing examples in the voice
├── visual-identity/
│   ├── design-tokens.md                  Colours, type scale, spacing — machine-readable
│   ├── visual-direction.md               The design rationale in plain English
│   ├── logos/                            Logo lockups (horizontal, stacked, mark)
│   ├── templates/                        Ship-ready post/card templates
│   └── brand-in-action/                  Applied mockups (YouTube, IG, merch, web)
├── brand-book.md                         Combined brand book — editable source of truth
├── brand-book.pdf                        The same, rendered for humans
├── brand-deck.json                       Deck data (transcribed from locked files)
└── brand-deck.pdf                        Designed A4 brand-guidelines deck

projects/00-brand-build/
└── {YYYY-MM-DD}/build-log.md          <- working notes from the run (not a brand asset)
```

## Requirements

### Software

| Tool | Needed for | Check |
|------|-----------|-------|
| Claude Code | everything | `claude --version` |
| Node.js ≥ 18 | deck renderer (no npm packages needed — stdlib only) | `node -v` |
| Python 3.10+ | image tooling, PDF QC | `python3 --version` or `python --version` |
| Python packages | `pillow pymupdf numpy scipy pyyaml` | `pip install pillow pymupdf numpy scipy pyyaml` |
| Google Chrome | headless PDF rendering | installed anywhere on PATH |

### Services (API keys in `.env` at your project root)

| Key | Used by | What it enables | Without it |
|-----|---------|-----------------|------------|
| `GEMINI_API_KEY` | viz-image-gen, mkt-visual-identity | Logo exploration + brand-in-action mockups (Gemini image models) | Falls back to OpenAI images |
| `OPENAI_API_KEY` | viz-image-gen | `gpt-image-1` fallback image generation | No image fallback — mockups skipped, deck still builds |
| `FIRECRAWL_API_KEY` | mkt-brand-voice (Auto-Scrape) | Scrape an existing site to extract voice | Falls back to WebFetch, then manual paste |

**None of these block the build.** Recommended minimum: `GEMINI_API_KEY` — the deck is
dramatically better with real applied mockups.

## Install

### Into an existing Agentic OS / Claude Code project (recommended for you, Lee)

```bash
unzip 00-brand-build-system.zip
cd 00-brand-build
bash install.sh --target /path/to/your/agentic-os
```

The installer:
1. Checks prerequisites (node, python3; warns about Chrome + Python packages)
2. Copies the 9 skills into `.claude/skills/` — **skips any skill you already have**
   (use `--force` to overwrite; your `SKILL.local.md` customisations are never touched)
3. Copies the `ssc-template-builder` sub-agent into `.claude/agents/`
4. Writes the path config (`skill-pack/config/sys-config.md`) for YOUR install location
5. Merges the service keys into your `.env.example` without duplicating
6. Creates `projects/00-brand-build/`

### Fresh standalone project

```bash
bash install.sh /path/to/new/project
```

Creates a minimal Claude Code project with the skills, then you run `claude` inside it.

### After install

Open Claude Code in the project and say:

```
build a brand
```

or

```
/00-brand-build YourBrandName
```

First run starts with a readiness check that lists every decision gate — see
`skills/00-brand-build/references/onboarding.md` for the full first-run guide.

## Configuration

| File | What it controls |
|------|-----------------|
| `.claude/skills/00-brand-build/skill-pack/config/sys-config.md` | Paths + pipeline settings: `stop_after` (halt after a chosen stage), `assemble_brand_book`, book path |
| `brand_context/` | The brand itself — every stage reads/writes here |
| `.env` | API keys (never committed) |

Edit `sys-config.md` anytime; it's read at the start of every run.

## Troubleshooting

- **PDF render fails** → the markdown brand book is the deliverable; the PDF is a view.
  Check Chrome is installed; the renderer prints the exact command it tried.
- **A stage re-asks something you already answered** → check the earlier stage actually
  wrote its `brand_context/` file — the files are the bus between stages.
- **Image generation fails** → check `GEMINI_API_KEY` / `OPENAI_API_KEY` in `.env`. The
  pipeline continues without mockups rather than blocking.
- **Second brand** → run in a separate workspace/client folder so `brand_context/`
  doesn't collide.
- **Only want one piece** → invoke the individual skill directly (`/mkt-brand-voice`,
  `/mkt-visual-identity`) — don't run the whole pipeline.

---

Packaged from a working Agentic OS install (All The Power / Roy Castleman), 2026-07-02.
System version 1.0.0 · entry skill `00-brand-build` v2026-06-28.
