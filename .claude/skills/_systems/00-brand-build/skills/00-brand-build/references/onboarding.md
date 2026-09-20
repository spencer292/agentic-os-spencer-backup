# Brand Build — First-Run Onboarding Guide

A non-technical walkthrough for first-time users of the `00-brand-build` system.

## What This Does

Builds a complete brand from scratch in one guided run — the same order a professional
brand agency works (research → strategy → identity). You answer questions; the system
produces the audience profile, brand strategy, market positioning, brand voice, and full
visual identity, then assembles everything into a brand book (markdown + PDF) and a
designed A4 brand-guidelines deck.

## Inputs

| Input | Required? | Example |
|-------|-----------|---------|
| Brand name | **Yes** — asked first if not given | `/00-brand-build Acme Coaching` |
| Your answers in the discovery interviews | Yes — this is where the brand comes from | Who it's for, what you stand for, tone preferences |
| Existing brand material | Optional — website URL, logo file, brand guidelines, sample writing | The pipeline detects what exists and runs those stages in Update mode |
| Reference brands / moodboard direction | Optional | "Feels like Patagonia meets Monzo" |

**Minimum viable input:** a brand name and a willingness to answer questions. Everything
else can be generated from the interviews.

## Outputs

All under your `brand_context/` folder (this becomes the shared brand memory every other
skill reads):

- `icp.md` — ideal customer profile
- `brand-strategy.md` — archetype, essence, mission/vision/values, positioning statement
- `positioning.md` — market angles + competitive white space
- `voice-profile.md` + `samples.md` — verbal identity
- `visual-identity/` — design tokens, fonts, logo files, templates, brand-in-action mockups
- `brand-book.md` + `brand-book.pdf` — the combined brand book (source of truth)
- `brand-deck.json` + `brand-deck.pdf` — the designed A4 brand-guidelines deck

Both PDFs are also copied to your `~/Downloads/` folder at the end.

## How It Works (Phases)

1. **Readiness check** — the system lists every point where it will need your decision, so
   nothing surprises you mid-run. You approve the plan before anything starts.
2. **Audience** — who the brand serves, researched and written up. You validate it.
3. **Strategy** — discovery interview → archetype, essence, and the one-sentence positioning
   statement everything else ladders off. **Locks before any design happens.**
4. **Market angles** — how the brand wins attention against competitors. You pick the angle.
5. **Voice** — how the brand sounds, seeded from the archetype so it doesn't re-ask.
6. **Visual identity** — colour, typography, logo system, templates, applied mockups. You
   approve the identity before templates are built.
7. **Assembly** — brand book + designed deck rendered to PDF and delivered.

## Checkpoints

This pipeline is **attended** — it pauses for you at every gate. There is no unattended mode.

| Gate | You decide |
|------|-----------|
| Readiness sign-off | Start the full build, or stop after a chosen stage |
| ICP validation | "Yes, that's my customer" |
| Strategy lock | Archetype + positioning statement approved |
| Angle pick | Which market angle to lead with |
| Voice test | Sample passes the "sounds like us" test |
| Identity approval | Colour/type/logo direction approved before templates |
| Final sign-off | Brand book + deck land correctly |

## Setup Checklist

Before the first run:

- [ ] **Claude Code** installed and working in your project folder
- [ ] **Node.js** installed (`node -v`) — renders the designed deck
- [ ] **Python 3** installed (`python3 --version` or `python --version`) with packages:
      `pillow pymupdf numpy scipy pyyaml` (`pip install pillow pymupdf numpy scipy pyyaml`)
- [ ] **Google Chrome** installed — used headless to render PDFs
- [ ] **`GEMINI_API_KEY`** in your `.env` — primary image generation for logos and mockups
      (get one at https://aistudio.google.com/apikey). *Recommended, not blocking.*
- [ ] **`OPENAI_API_KEY`** in `.env` — image-generation fallback. *Optional.*
- [ ] **`FIRECRAWL_API_KEY`** in `.env` — lets the voice stage auto-scrape an existing
      website. *Optional; falls back to manual paste.*

Missing keys never block the build — each stage has a documented fallback and will tell
you what it's doing instead.
