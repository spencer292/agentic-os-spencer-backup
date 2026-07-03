---
name: tool-web-screenshot
version: 1.0.0
description: >
  Capture web page screenshots with multi-backend routing. YouTube URLs fetch thumbnails directly.
  Simple pages use ScreenshotOne API (if key set) with Playwright fallback. Interactive captures
  (typing, multi-step forms) always use Playwright. Supports cookie banner removal, full-page
  scroll capture, viewport control, and interactive element enumeration with percentage-based
  bounding rects. Chain with tool-screenshot-annotator for numbered callouts.
triggers:
  - "screenshot this website"
  - "capture this page"
  - "take a screenshot of"
  - "web screenshot"
  - "grab a screenshot"
  - "screenshot URL"
  - "screenshot this"
negative_triggers:
  - "screenshot from video"
  - "video screenshot"
  - "extract frames"
category: tool
---

## Setup

Run `bash .claude/skills/tool-web-screenshot/scripts/setup.sh` on first use.

## Usage

```bash
uv run .claude/skills/tool-web-screenshot/scripts/capture.py \
  --url "https://example.com" \
  --block-cookie-banners \
  --enumerate-elements
```

### CLI Arguments

| Arg | Default | Description |
|-----|---------|-------------|
| `--url` | required | URL to capture |
| `--output-dir` | auto | Output directory |
| `--backend` | `auto` | `screenshotone`, `playwright`, or `auto` |
| `--viewport` | `1920x1080` | Viewport dimensions |
| `--actions` | none | JSON array of interactions |
| `--enumerate-elements` | false | List interactive elements with bounding rects |
| `--block-cookie-banners` | false | Inject CSS to hide cookie banners |
| `--full-page` | false | Capture full scrollable page |

### Backend Routing (auto mode)

| Signal | Backend |
|--------|---------|
| YouTube URL | Direct thumbnail fetch (no browser) |
| Simple capture, no typing | ScreenshotOne API (if key set) then Playwright |
| Interactive (typing, enumerate) | Playwright only |
| No API key | Always Playwright |

### Interaction Actions

Pass as `--actions '[{"type":"click","selector":"#btn"},{"type":"type","selector":"input","value":"hello"}]'`

| Type | Fields | Notes |
|------|--------|-------|
| `click` | `selector` | Click an element |
| `type` | `selector`, `value` | Type into a field |
| `scroll` | `amount` (px) | Scroll down |
| `hover` | `selector` | Hover over element |
| `wait` | `delay` (ms) | Wait N ms |
| `wait_for` | `selector` | Wait for element to appear |

### Output

```
{projects_base}/tool-web-screenshot/{YYYY-MM-DD}/{slug}/
  screenshot.png
  manifest.json       # {url, screenshot_path, width, height, backend, timestamp}
  elements.json       # optional, when --enumerate-elements used
```

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-screenshot-annotator` | Optional | Annotate captured screenshots | Screenshots are still fully usable |

## External Services

| Service | Key | What it enables | Without it |
|---------|-----|-----------------|------------|
| ScreenshotOne | `SCREENSHOTONE_API_KEY` | Fast cloud screenshots, bot bypass, cookie/ad blocking | Falls back to local Playwright |
