---
name: tool-image-search
version: 0.1.0
description: >
  Search the web for images to compose social-content posts. Credential-free by
  default via Openverse (stock + brand photos with proper license metadata),
  Wikimedia Commons (official brand SVGs, public-domain photos) and Imgflip
  (top meme templates). Optional API keys for Unsplash/Pexels improve stock
  quality. Opt-in Playwright + stealth scraping of Bing Images covers the long
  tail — news photos, celebrities, current products — when --allow-scraping
  is set. Each result lands with a manifest entry capturing license,
  attribution and source URL.
triggers:
  - "find images of"
  - "search images"
  - "search for image"
  - "look for images"
  - "find a picture of"
  - "image of"
  - "stock photo of"
  - "news photo"
  - "meme template"
negative_triggers:
  - "generate an image"
  - "create an image with AI"
  - "screenshot this page"
  - "capture this URL"
  - "icon"
  - "SVG icon"
category: tool
---

## What this skill does

Given a query, return one or more images from the web with license/attribution
metadata, ready to drop into a post composition. Three source tiers:

1. **Credential-free APIs** — always on. Cover stock, brand logos, memes.
2. **API keys** — optional via env vars. Upgrade stock quality (Unsplash, Pexels).
3. **Browser scraping** — opt-in via `--allow-scraping`. Covers news photos,
   celebrities, recent products. Uses Playwright + `playwright-stealth` against
   Bing Images.

## When to use

- Composing a carousel/slide/thumbnail and needing a real-world photo
- Looking for an official brand logo (Wikimedia often has the canonical SVG)
- Pulling a top meme template by name
- Finding a news/celeb photo for an editorial post (requires `--allow-scraping`)

If the user asks to **generate** an image with AI, hand off to `viz-image-gen`.
If they need a **screenshot of a known URL**, that's `tool-web-screenshot`. If
they need a **static UI icon**, point them at `references/icons/` in
`viz-image-gen` (the curated SVG library).

## Setup

Run once per machine:

```bash
# Mac / Linux
bash .claude/skills/tool-image-search/scripts/setup.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .claude\skills\tool-image-search\scripts\setup.ps1
```

The setup installs `uv` if missing and (only when `--allow-scraping` will be
used) the Playwright chromium browser. The Tier-1 API path works without any
browser install — only `uv` and Python 3.10+.

## Usage

```bash
uv run .claude/skills/tool-image-search/scripts/search.py \
  --query "minimalist workspace" \
  --intent stock \
  --count 5
```

### CLI arguments

| Arg                | Default      | Description                                                   |
| ------------------ | ------------ | ------------------------------------------------------------- |
| `--query`          | required     | Free-text search query                                        |
| `--intent`         | `auto`       | `stock` \| `brand` \| `news` \| `meme` \| `auto` (route by query) |
| `--count`          | `5`          | Max images to return (1–20)                                   |
| `--license`        | `commercial` | `commercial` \| `all` (Openverse filter; ignored elsewhere)   |
| `--output-dir`     | auto         | Output directory. Auto = `projects/tool-image-search/{date}/{slug}` |
| `--allow-scraping` | off          | Enable Tier 3 (Playwright + Bing). Off = Tier-1/2 only        |
| `--min-width`      | `0`          | Drop results smaller than this width (px)                     |
| `--engine`         | `auto`       | `openverse` \| `wikimedia` \| `imgflip` \| `unsplash` \| `pexels` \| `bing` \| `auto` |

### Intent routing (auto mode)

| Intent | Order tried                                                              |
| ------ | ------------------------------------------------------------------------ |
| stock  | Unsplash (if key) → Pexels (if key) → Openverse → Bing (if scraping ok)  |
| brand  | Wikimedia → Openverse                                                    |
| news   | Bing (requires `--allow-scraping`, warns if not set) → Openverse         |
| meme   | Imgflip → Openverse                                                      |
| auto   | Stock by default. Heuristic upgrades:                                     |
|        |   • query contains "logo" → brand                                         |
|        |   • query contains "meme"/"template" → meme                               |
|        |   • query contains a year (2024–2030) → news                              |

The heuristic in `auto` is intentionally conservative — when the model knows
the intent, pass it explicitly with `--intent` for a cleaner route.

### Output

```
{output_dir}/
  images/
    01-openverse-82931d3e.jpg
    02-wikimedia-OpenAI_Logo.svg
    03-bing-d4f1a2b8.jpg
  manifest.json
```

`manifest.json` is an array of entries with these fields:

```json
{
  "source": "openverse|wikimedia|imgflip|unsplash|pexels|bing",
  "engine_tier": 1,
  "query": "minimalist workspace",
  "intent": "stock",
  "image_path": "images/01-openverse-82931d3e.jpg",
  "image_url": "https://live.staticflickr.com/.../...jpg",
  "source_url": "https://www.flickr.com/photos/.../8375875941",
  "title": "Minimalist Workspace. TK43 Hildesheim, 2010",
  "creator": "AbhijeetRane",
  "license": "by",
  "license_url": "https://creativecommons.org/licenses/by/2.0/",
  "attribution": "Photo by AbhijeetRane on Flickr, CC BY 2.0",
  "width": 1024,
  "height": 683,
  "warnings": []
}
```

`license: "unknown"` and `warnings: ["scraped-no-license-guarantee"]` are set
for Bing results — the consumer must decide whether the use case (e.g.
editorial commentary, fair use) covers them.

## External services

| Service     | Auth?         | What it enables                              | Without it                              |
| ----------- | ------------- | -------------------------------------------- | --------------------------------------- |
| Openverse   | none          | Stock + brand-tagged photos with CC license  | Required for Tier 1                     |
| Wikimedia   | none          | Brand logos (SVG) and public-domain photos   | Required for Tier 1                     |
| Imgflip     | none          | Top-100 meme templates                       | Required for Tier 1                     |
| Unsplash    | `UNSPLASH_ACCESS_KEY` | Premium editorial stock, full-res    | Falls back to Openverse                 |
| Pexels      | `PEXELS_API_KEY`      | Diverse stock library                | Falls back to Openverse                 |
| Bing Images | none (scrape) | News, celebs, current products               | Tier 3 disabled, intent=news returns 0  |

## Dependencies

| Skill                       | Required? | Why                                                  |
| --------------------------- | --------- | ---------------------------------------------------- |
| `tool-web-screenshot`       | Optional  | If a result's source page is more useful than the image itself, capture the page via web-screenshot |
| `viz-image-gen`             | Optional  | Use the icons library in `references/icons/` for static brand icons rather than searching the web for logos |

## See also

- `references/source-routing.md` — full decision tree for intent → source
- `references/licensing.md` — license rules and attribution boilerplate per source
- `references/stealth-notes.md` — why `playwright-stealth` is required for Bing,
  hotlink-block workarounds, and ToS caveats
