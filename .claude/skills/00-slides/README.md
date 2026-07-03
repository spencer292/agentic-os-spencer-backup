# 00-slides

Topic, outline, or transcript → production-quality HTML slides with optional PDF export.

## About

`00-slides` is an end-to-end presentation creation pipeline. You give it a topic, a rough outline, or a transcript. It detects the input type, researches or extracts content, structures an adaptive outline matched to your presentation type (pitch / talk / workshop / etc.), pauses for your approval, then renders production-quality HTML slides with brand-aware design and viewport-safe layout. PDF export is one command away.

## Key Features

- **Adaptive structure** — outline shape matches presentation type (pitch deck, conference talk, knowledge share, internal update, workshop, case study)
- **Multiple input modes** — accepts topic only, rough outline, transcript, or finished outline
- **Optional research phase** — for topic-only input, chains `str-trending-research` to gather context before drafting
- **Outline approval gate** — always pauses for human review before rendering
- **Brand-aware rendering** — picks up `brand_context/visual-identity/tokens.json` automatically
- **Viewport-safe HTML** — every slide enforces `100vh/100dvh` with hard overflow guards
- **Browser auto-open** — cross-platform launch (macOS / Linux / Windows)
- **PDF export on request** — browser print-to-PDF or Puppeteer fallback

## Use Cases

- Building a pitch deck from a one-paragraph idea
- Turning a podcast transcript into a knowledge-share talk
- Rendering an existing rough outline into polished slides without touching design
- Adapting one outline into multiple presentation styles (talk → workshop → case study)
- Generating a deck from a research brief written by another skill

## Pipeline Flow

```
┌──────────────────────────────────────────────┐
│  INPUT: topic, outline, or transcript         │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  1. DETECT INPUT TYPE                         │  IN:  user input
│  Classify what was provided so the right      │  OUT: input_type
│  pipeline branch can run.                     │
└──────────────────────┬───────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌────────┐    ┌────────┐    ┌──────────┐
   │ topic  │    │outline │    │transcript│
   └───┬────┘    └───┬────┘    └────┬─────┘
       │             │              │
       ▼             │              ▼
┌──────────┐         │       ┌──────────┐
│ RESEARCH │         │       │ EXTRACT  │
│ (str-...)│         │       │  themes  │
└────┬─────┘         │       └────┬─────┘
     │               │            │
     └───────────────┴────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  3. STRUCTURE                                 │  IN:  content + type
│  Build slide-by-slide outline mapped to the   │  OUT: structured outline
│  presentation type.                           │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  4. APPROVAL CHECKPOINT                       │  HUMAN-IN-THE-LOOP
│  User reviews outline, edits or approves.     │  Pipeline pauses here.
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  5. RENDER (viz-frontend-slides)              │  IN:  approved outline
│  Generate HTML with brand-aware design and    │  OUT: slides.html
│  viewport enforcement.                        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  6. DELIVER                                   │  Auto-open in browser,
│  Save HTML + outline, optional PDF export.    │  optional PDF.
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│  OUTPUT: slides.html + outline.md (+ PDF)     │
└──────────────────────────────────────────────┘

Final files go to projects/00-slides/{YYYY-MM-DD}/{presentation-slug}/
Working data goes to projects/00-slides/{YYYY-MM-DD}/logs/
```

## Output Structure

```
projects/00-slides/
└── {YYYY-MM-DD}/
    ├── logs/                          <- Working data from this run
    │   └── pipeline-log.md                Per-phase timing and decisions
    └── {presentation-slug}/           <- The finished presentation
        ├── slides.html                    Auto-opened in your browser
        ├── slides.pdf                     Optional, generated on request
        └── outline.md                     Approved outline used to render
```

## Setup

Run the installer (handled automatically by `npx @scrapes/skill-systems install 00-slides`).
On first invocation of `/00-slides`, the orchestrator runs onboarding to capture your preferences (style preset, max slide count, PDF default, auto-open).

See `references/onboarding.md` for the first-run walkthrough.
