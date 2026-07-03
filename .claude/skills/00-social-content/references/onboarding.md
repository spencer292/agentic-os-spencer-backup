# Onboarding — Social Content Pipeline

## What This Does

Takes whatever you have (a YouTube video, a topic, a web article, a local file, or your existing LinkedIn/YouTube feed) and produces a platform-native social post with images — drafted in your voice, humanized, and ready to publish on LinkedIn, Instagram, Twitter, Threads, and 10+ other platforms via Zernio. After the first-run setup below, every subsequent run is fully automated.

## Inputs

| Input | Required | Example | Scenario |
|-------|----------|---------|----------|
| YouTube/video URL | Either | `https://youtube.com/watch?v=abc` | B |
| Topic or idea | Either | `"why most ai agents fail in production"` | C |
| Nothing / "from my sources" | Either | (empty) | D |
| Web article URL | Either | `https://example.com/post` | F |
| Local video/audio file | Either | `/path/to/video.mp4` | G |
| Finished caption + "generate image" | Either | `"My post: ... — generate image"` | A |
| Existing post + "adapt for X" | Either | `"adapt this for instagram: ..."` | E |

## Outputs

| What | Where | Format |
|------|-------|--------|
| Final post folder | `projects/00-social-content/{YYYY-MM-DD}/{post-slug}/` | `post.yaml` + `caption.md` + `image.png` (or `slide-N.png`) + `pipeline-log.md` |
| Pipeline log | `projects/00-social-content/{YYYY-MM-DD}/{post-slug}/pipeline-log.md` | Per-run markdown with phase timing table (v2.0.0: moved out of `logs/` so multiple runs on the same date don't collide) |
| Inspiration archive | `projects/00-social-content/{YYYY-MM-DD}/logs/inspiration/` | Saved transcripts, scraped posts, screenshot extracts |
| Published post | Platform-dependent (when `/tool-publisher` is run) | Live URL or draft URL in Zernio |

## How It Works (Phases)

1. **Config** — Reads `pipeline.config.yaml` and `.claude/skills/00-social-content/skill-pack/config/sys-config.md`. Verifies brand voice exists.
2. **Detect Scenario** — Inspects the trigger and routes to one of A-G (URL, topic, file, etc.).
3. **Gather Inspiration** — Transcript (B/G), trending research (C), feed scraping (D), or screenshot extraction (F).
4. **Briefing** — One-shot question for objective, format, and platform — only what wasn't in the trigger.
5. **Content Inference** — Derives `inferred_entities` (brands/people/events/products), `inferred_palette`, and `inferred_typography` from the gathered material. For single image: drafts the caption now.
6. **Visual Planning** *(sub-agent: `ssc-designer`)* — Builds a Visual Inventory (logos/icons/photos/screenshots available BEFORE planning) and the slide plan. Runs four blocking audits: per-slide real-image check, visual floor (`ceil(2N/3)` slides must be visual), icon-anchor classification (icons ≥25% of canvas count), and white-space audit (no empty canvas). Resolves image sources for every slide.
7. **Humanizer + Preview** — For carousels: humanizes silently, drafts the caption around the slide arc, then shows the plan for confirmation. For single: humanizes inline before image generation.
8. **Generate Images** *(sub-agent: `ssc-image-generator`)* — Executes the slide_plan the designer produced. Does NOT re-decide template family, source, or render mode.
9. **Save and Present** — Writes `post.yaml`, `caption.md`, image files, plus a `pipeline-log.md` timing table inside the post folder. Asks if you want to publish.

End-to-end: typically 2-5 minutes for a single post, 4-8 minutes for a carousel.

## Checkpoints

**First run only:** Interactive onboarding (this guide) walks you through brand voice, API keys, and preferences. Takes ~5 minutes. Sets `_customized: true` in `sys-config.md` so subsequent runs skip onboarding.

**Every run:** Two pause points — Phase 4 briefing (skipped if all three answers are in the trigger), and Phase 8 review before publishing. Everything else runs automatically.

**Scenario E (repurpose):** Routes to `/mkt-content-repurposing`, which has its own per-platform review.

## Setup Checklist

### Step O1 — Show what I can do

The orchestrator surfaces the 7 scenarios in a single table on first run:

```
What you give me              → What I produce
─────────────────────────────────────────────────────────────────
A YouTube/video URL           → Transcript → Post + Images       (B)
A topic or idea               → Trend research → Post + Images   (C)
Nothing / "from my sources"   → Scrape feed → Post + Images      (D)
A web article URL             → Screenshot extract → Post + Imgs (F)
A local video/audio file      → Transcribe → Post + Images       (G)
Finished caption + "image"    → Images only                      (A)
Existing post + "adapt for X" → Repurpose for platform           (E)
```

### Step O2 — Check API keys

Reads `.env` if it exists. Shows a status line for each key:

```
API Keys status:
✓/✗ GEMINI_API_KEY        — image generation (primary)
✓/✗ OPENAI_API_KEY        — image generation (alt) + Reddit research
✓/✗ APIFY_API_KEY         — Scenario D: scrape LinkedIn
✓/✗ YOUTUBE_API_KEY       — Scenario D: YouTube digest
✓/✗ XAI_API_KEY           — Scenario C: X/Twitter trending
✓/✗ SCREENSHOTONE_API_KEY — Scenario F: cloud screenshots (optional)
✓/✗ ZERNIO_API_KEY        — publishing via /tool-publisher
```

For any missing key: "You can add it to `.env` anytime. Let's continue with what you have."

### Step O3 — Brand voice setup

Open an `AskUserQuestion` popup (never plain text, never `/<skill-name>` suggestion):

```
AskUserQuestion({
  questions: [{
    question: "Shall we capture your brand voice now? This makes every post sound like you, not like AI.",
    header: "Brand voice",
    multiSelect: false,
    options: [
      { label: "Yes, set it up now",
        description: "Runs mkt-brand-voice (~5-10 min)." },
      { label: "Skip for now",
        description: "Continues without a personalized voice — you can run it later." }
    ]
  }]
})
```

If user picks "Yes" → invoke `Skill(skill: "mkt-brand-voice")` directly. After it completes, confirm: "Brand voice saved ✓"

### Step O3.5 — Visual identity setup

Open a second `AskUserQuestion` popup:

```
AskUserQuestion({
  questions: [{
    question: "And your visual identity? It defines palette, typography and templates — without it the pipeline infers visuals per post.",
    header: "Visual identity",
    multiSelect: false,
    options: [
      { label: "Yes, set it up now",
        description: "Runs mkt-visual-identity (~10-15 min). Carousels start using your tokens." },
      { label: "Skip for now",
        description: "Continues with per-post inference." }
    ]
  }]
})
```

If user picks "Yes" → invoke `Skill(skill: "mkt-visual-identity")` directly. After it completes, confirm: "Visual identity saved ✓"

### Step O4 — Set preferences

Use `AskUserQuestion` to ask **one preference at a time**. After each answer, run the conditional dependency check before moving to the next.

**Q1 — Default platform**
- options: `linkedin`, `instagram`, `twitter`, `threads`
- default: `linkedin`
- check: if `instagram`/`twitter`/`threads`, verify `ZERNIO_API_KEY` is in `.env`

**Q2 — Language**
- options: `en`, `pt-BR`, `es`, `other`
- default: `en`
- if `other`: ask which language via plain-text follow-up

**Q3 — Default format**
- options: `auto` (decide from content), `carousel`, `single`, `text`
- default: `auto`

> **No "image style" question.** Visual style (palette, typography, template family per slide) is **inferred per post** from (a) `brand_context` if it exists, and (b) the content itself (e.g., a post about a red+black+white sport team → those crest colors; a post about Claude Code → Anthropic orange + monospace headers). Asking the user "color / notebook / technical / mono?" up front confuses non-designers and locks the wrong default for half the posts they will write.

### Step O5 — Save and confirm

Write pipeline behaviour answers to `pipeline.config.yaml` and operational/path answers to `.claude/skills/00-social-content/skill-pack/config/sys-config.md`. Set `_customized: true` in `sys-config.md`. Tell the user:

> "All set! Saved:
> Platform: {platform} · Language: {language} · Format: {format}
>
> Visual style is decided per post (from your brand_context if set, or inferred from the content).
>
> Edit anytime in `.claude/skills/00-social-content/skill-pack/config/pipeline.config.yaml`
>
> Ready. Try: `/00-social-content` — give me a topic, a URL, or just say 'from my sources'."

### Conditional dependency map

| User choice | Requires | How to check | What to tell them |
|-------------|----------|--------------|-------------------|
| Platform: instagram/twitter/threads | `ZERNIO_API_KEY` | grep `.env` | zernio.com to get key → add to `.env` |
| Format: carousel/single | `GEMINI_API_KEY` or `OPENAI_API_KEY` | grep `.env` | need at least one image key |
| Source mode: "from my sources" | `APIFY_API_KEY` + `YOUTUBE_API_KEY` | grep `.env` | both keys for full Scenario D |

## Configuration Files

After first-run onboarding, your choices live in two places:

```
Pipeline config (technical — image provider, sources, publishing mode):
  .claude/skills/00-social-content/skill-pack/config/pipeline.config.yaml

Operational config (output paths, source toggles):
  .claude/skills/00-social-content/skill-pack/config/sys-config.md

Brand voice:
  brand_context/voice-profile.md
```

All three files have inline comments. Edit them anytime to change defaults for future runs.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Voice profile missing" | Run `/mkt-brand-voice` — onboarding will resume after |
| "Both image keys missing" | Add `GEMINI_API_KEY` or `OPENAI_API_KEY` to `.env` |
| Scenario B fails (no transcript) | Pipeline auto-falls back to Scenario F (screenshot) |
| Scenario D returns nothing | Check `tool-linkedin-scraper/config/sources.md` and `tool-youtube/config/sources.md` |
| Scenario G fails (transcription) | Verify `python3` + `whisperx` available; install ffmpeg if missing |
| Images come out off-brand | Update `brand_context/assets.md` and add reference images to `brand_context/visual_refs/` (both at project root) |
| Carousel slides drift visually | Sub-agent always anchors to slide 1; if drifting, regenerate slide 1 first |
| `/tool-publisher` says "MCP not connected" | Copy `.mcp.example.json` → `.mcp.json`, set `ZERNIO_API_KEY` in `.env`, restart Claude Code |
