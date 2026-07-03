# YouTube to Ebook — Getting Started

## What This Does

Takes a YouTube video URL and transforms it into a polished, fact-checked long-form article delivered as a PDF. The article reads like a magazine feature — not a summary or transcript cleanup — written for someone who never watched the video.

## Inputs

**Required:**
- A YouTube video URL (the video must have captions/subtitles available)

**Optional:**
- `brand_context/voice-profile.md` — if you have a brand voice defined, the article and humanizer will match it
- `brand_context/visual-identity/tokens.json` (built by `mkt-visual-identity`) — if you want branded PDF styling (fonts, colours, accents)
- `brand_context/assets.md` — if you want your logo and links in the PDF header

## Outputs

- **PDF article** in `projects/00-youtube-to-ebook/{YYYY-MM-DD}/{ebook-slug}/`
- **Also copied** to `~/Downloads/` for quick access
- **Working files** (draft, fact-check report, pipeline log) in `projects/00-youtube-to-ebook/{YYYY-MM-DD}/logs/`

## How It Works

1. **Fetches the transcript** from YouTube (captions must exist)
2. **Writes a long-form article** — editorial, interpretive, explains jargon, uses direct quotes
3. **Extracts key screenshots** from the video (optional, if tool-video-screenshots installed)
4. **Fact-checks every claim** — flags anything false, mixed, or unverifiable
5. **Pauses for your review** — you see the draft + fact-check results and approve or edit
6. **Humanizes the writing** — removes AI patterns, matches your voice if available
7. **Generates a styled PDF** — minimal or branded, with optional logo and links header

## Checkpoints

The pipeline pauses once — after fact-checking (step 4). You'll see:
- The full draft article
- A fact-check report showing each claim and its verdict
- Suggested corrections for any false or misleading claims

You can approve, request edits, or stop the pipeline.

## PDF Design Configuration

On first use, or when editing `.claude/skills/00-youtube-to-ebook/skill-pack/config/sys-config.md`, choose:

### 1. Design mode
- **minimal** — clean serif typography, no branding (default)
- **branded** — uses your `brand_context/visual-identity/tokens.json` for fonts, colours, and layout

### 2. Branding intensity (branded mode only)
- **subtle** — your fonts and colours applied cleanly, white background, no decorations
- **heavy** — accent-coloured header border, tinted blockquote backgrounds, accent drop caps on the opening paragraph, coloured horizontal rules

### 3. Header options (branded mode only)
- **Show logo?** — embeds your logo from `brand_context/assets.md` in the top-left of page 1
- **Show links?** — adds your business/personal URLs in the top-right of page 1
- **Which links?** — pick from the links available in `brand_context/assets.md` (e.g. YouTube, Community, LinkedIn)

### Example config

```markdown
## PDF Format
- Design: branded
- Branding intensity: heavy
- Tokens path: brand_context/visual-identity/tokens.json

## Header
- Show logo: yes
- Show links: yes
- Links to show: YouTube, Community (Skool), LinkedIn
```

## Setup Checklist

- [ ] `tool-youtube` skill installed (check with `ls .claude/skills/tool-youtube`)
- [ ] Python 3 available (`python3 --version`)
- [ ] `weasyprint` and `markdown` Python packages installed (run `bash .claude/skills/tool-pdf-generator/scripts/setup.sh` if not)
- [ ] Optional: `YOUTUBE_API_KEY` in `.env` for channel/search features (direct URL mode works without it)
- [ ] Optional: `brand_context/visual-identity/tokens.json` (run `/mkt-visual-identity`) for branded PDF styling
- [ ] Optional: `brand_context/assets.md` with logo URL and business links for header
