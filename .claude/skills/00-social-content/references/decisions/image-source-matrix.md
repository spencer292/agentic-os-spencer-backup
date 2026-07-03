# Decision: Image source

For every slide that needs an image, the orchestrator decides **where the image comes from** *before* deciding the render mode. The render mode is downstream of this choice — see `render-mode-matrix.md`.

The core question, asked per slide: **"Is there a real image, logo, or icon that genuinely belongs on this slide?"** If yes, use it. If no, the slide either becomes a TEMPLATE composition (typography + icons) or HYBRID_AI generation.

## Source tiers — priority order

Try top to bottom. **Stop at the first usable match.**

| # | Source | Wins when | Resolver |
|---|--------|-----------|----------|
| 1 | **Brand / product / platform logo** | The slide's text mentions a recognizable brand, app, tool, or platform | viz-image-gen `references/icons/` library → `tool-image-search --intent brand` |
| 2 | **Real person photo** | The slide's text names a real person (athlete, founder, public figure) | `tool-image-search --intent news` (with `--allow-scraping` for recent figures) |
| 3 | **Real event / news image** | The slide refers to a real recent event ("X happened", "they did Y") | `tool-image-search --intent news --allow-scraping` |
| 4 | **Real UI / product screenshot** | The slide references a specific website, app screen, dashboard, or CLI | `tool-web-screenshot` for live UI; `tool-image-search --intent stock` for generic screenshots |
| 5 | **User-supplied asset** | `brand_context/visual_refs/` contains a file that fits the slide subject | Direct filepath match |
| 6a | **Video thumbnail** *(Scenario B only — slide 1 priority)* | `thumbnail_path` was set in Phase 3; prefer for slide 1 (cover) since it's the creator's curated representative image | `{output_base}/{date}/logs/inspiration/thumbnail.{ext}` |
| 6b | **Video frame** *(Scenarios B/G only)* | Manifest has a frame whose caption matches the slide's `image_concept`; use for content slides | `{output_base}/{date}/logs/screenshots/manifest.json` |
| 7 | **AI generation (fallback)** | None of 1–6 fit; concept is abstract / metaphorical | `ssc-image-generator` HYBRID_AI prompt |

This ordering reverses the previous skill behavior. Old default went straight to AI gen for almost any slide; the new default forces a real-image attempt first whenever entities (brands, people, events) are present in the post.

## Tier 1 — Brand / product / platform logo

**The cheapest and most authentic source.** A post about Claude Code that doesn't show the Anthropic mark is visually wrong; a post comparing "n8n × Mercedes" without both logos is missing the punchline.

Detection — scan the post caption + slide bodies for tokens that match:

| Token type | Examples | Action |
|---|---|---|
| AI tools | Claude, ChatGPT, Anthropic, OpenAI, Gemini, Perplexity, Mistral, Cursor, Copilot | Search `icons/commons/ai/{name}.svg`, then `tool-image-search --intent brand` if missing |
| Dev tools | GitHub, GitLab, VS Code, Vim, Docker, Kubernetes, Vercel, Next.js, React, Python | `icons/commons/dev/{name}.svg`, then `--intent brand` |
| Social platforms | LinkedIn, Instagram, TikTok, Twitter/X, YouTube, Threads, Discord, WhatsApp, Telegram | `icons/commons/social/{platform}.svg` |
| Productivity / SaaS | Notion, Linear, Figma, Slack, Zoom, Asana, ClickUp | `--intent brand` (rarely in icons lib) |
| Companies / consumer brands | Mercedes, Apple, Stripe, Shopify, Amazon (crest/badge for sports clubs) | `--intent brand` |

**One match per slide.** If two brands are referenced *and* the comparison itself is the point of the slide (n8n × Mercedes), allow both — composite via `HYBRID_REAL` template or `HYBRID_FROM_REAL` if AI needs to layer them.

When a logo is found, it usually anchors a `TEMPLATE` composition (logo card + typography) or sits inside a `HYBRID_REAL` slide. It is rarely the full-bleed background — see render-mode-matrix for the call.

## Tier 2 — Real person photo

Triggered when the slide names a specific real person (full name or well-known mononym: "Calleri", "Sam Altman", "Cristiano Ronaldo"). The default expectation: **show the person**.

```bash
uv run .claude/skills/tool-image-search/scripts/search.py \
  --query "{person name} {context — e.g. 'training ground', 'press conference'}" \
  --intent news \
  --allow-scraping \
  --count 5 \
  --output-dir "{output_base}/{date}/{slug}/sourced/"
```

Pick the first result with `width ≥ 800px`. Verify license — log attribution in `caption.md` when CC BY family. If the person's emotional context is wrong for the slide (happy photo on a tragic-news slide), prefer `HYBRID_FROM_REAL` to restyle, not a different person and not a generic AI render.

## Tier 3 — Real event / news image

For Scenario F (news article inputs) this tier is **mandatory** before any HYBRID_AI is allowed. The orchestrator must attempt `tool-image-search --intent news --allow-scraping` for at least one slide derived from the news, even if other slides go AI.

```bash
uv run .claude/skills/tool-image-search/scripts/search.py \
  --query "{event keywords — stripped of opinion/commentary words}" \
  --intent news \
  --allow-scraping \
  --count 5 \
  --output-dir "{output_base}/{date}/{slug}/sourced/"
```

## Tier 4 — Real UI / product screenshot

When the post mentions a specific website, app, terminal, dashboard, or product screen:

- **Live URL known** → `tool-web-screenshot {url}` and use the capture
- **Generic screenshot needed (e.g. "a typical Slack channel")** → `tool-image-search --intent stock --count 3`
- **Past UI moment ("Claude Code in 2025")** → tool-image-search with date-range hints if available; otherwise fall back to live screenshot of current state and accept the discrepancy

## Tier 5 — User-supplied asset

Scan `brand_context/visual_refs/`. Substring match against `image_concept`. If a single carousel uses multiple `brand_context/visual_refs/` files, cycle through them (don't reuse the same photo).

## Tier 6a — Video thumbnail *(Scenario B only)*

Downloaded during Phase 3 via `metadata.py --thumbnail --no-metadata`. Stored at `{output_base}/{date}/logs/inspiration/thumbnail.{ext}`.

**Use for slide 1 (photo-overlay cover) when `thumbnail_path` is set.** The thumbnail is the creator's hand-picked representative frame — more curated than any random video frame, and always high-resolution. It makes slide 1 visually authentic without AI generation.

For content slides, thumbnail is rarely a good fit (it's generic/cover-oriented) — fall through to tier 6b.

## Tier 6b — Video frame *(Scenarios B/G)*

Already documented in `inputs/input-video.md`. Frame manifest is built during Phase 3 transcript/frame extraction; matching to slides happens in Phase 5.3b.1.

Use for content slides — each frame is scene-specific and semantically closer to individual slide concepts than the thumbnail.

## Tier 7 — AI generation (fallback)

Only after 1–6 have all failed or don't apply. Even then, the prompt MUST be tuned for **documentary realism**, not "epic cinematic":

- ✅ "Photojournalist style, available light, 35mm lens, slight grain"
- ✅ "Documentary photography, candid moment, no posing"
- ❌ "Epic cinematic, dramatic lighting, hyper-real"
- ❌ "8k ultra-detailed, masterpiece, trending on artstation"

The second set is what produces the AI-cliché look that makes a slide read fake even though no real photo was involved.

## Decision log format

```
- Slide N:
    Image source: tier 2 (real person photo via tool-image-search)
    Reasoning: caption mentions "Calleri" — try news photo first; found 5 results, picked sourced/02-calleri-ct.jpg (Globo Esporte press, scraped, fair-use editorial)
    Render mode downstream: HYBRID_REAL (photo fits slide's emotional beat — no restyling needed)
    Alternatives rejected:
      - tier 7 (HYBRID_AI): would lose face recognition, generic vibe
      - tier 5 (user asset): brand_context/visual_refs/ has no Calleri photo
```

## What this changes vs. the previous skill

| Old behavior | New behavior |
|---|---|
| AI generation was the default for any slide with an image_zone | AI generation is the **last** resort; six tiers tried first |
| Brand mentions did not trigger a logo lookup | Tier 1 is logo lookup, always |
| Scenario F (news) only attempted tool-image-search if explicitly configured | Scenario F now FORCES at least one tier 2 or 3 attempt |
| HYBRID_REAL only triggered when user uploaded an asset | HYBRID_REAL triggers from tiers 1–6 (logos, web search, screenshots, etc.) |
| No image-to-image option | Tier resolution can route to HYBRID_FROM_REAL for AI restyling of real photos |
