---
name: vid-ffmpeg-edit
version: 1.0.0
description: >
  Wraps FFmpeg to burn ASS subtitles and overlay illustration PNGs onto a reframed 9:16 clip.
  Takes a clip MP4 plus word-level transcript (JSON, SRT, or TS word file), converts words to
  styled ASS captions via words_to_ass.py, optionally generates illustration PNGs via viz-image-gen
  at key moments, then burns everything in a single FFmpeg pass → final subtitled/illustrated MP4.
  Triggers: "edit clip", "add subtitles", "burn captions", "illustrate clip", "edit short-form",
  "add subtitles to clip", "edit this clip".
  Not for: pipeline orchestration, clip selection, reframing, transcription, or upload.
argument-hint: clip_path
allowed-tools: Bash(*), Read, Write, Edit, Glob, Grep, Agent
dependencies:
  - name: viz-image-gen
    required: false
    provides: Illustration PNG generation for key moments
    without: Text-only subtitle overlays, no illustration panels
metadata:
  category: video-production
  version: "1.0"
---

# vid-ffmpeg-edit

Burn subtitles and illustration overlays onto a reframed 9:16 clip using FFmpeg.


## Paths

Read `skill-pack/config/sys-config.md` → `## Paths` section before any path-dependent step. It resolves `{decoupled_base}`, `{env_file}`, `{brand_context}`, and `{projects_base}` to absolute paths set by the installer. Substitute these placeholders wherever they appear below.

## Inputs

- `clip_path` — reframed 9:16 MP4 (required)
- Transcript data — one of:
  - Word-level JSON (preferred): `{words: [{word, start, end}]}`
  - SRT file: converted via `srt_to_words.py`
  - TS word data file from pipeline

## Phase 7 — EDIT + RENDER

### Step 1: Verify inputs

Confirm the clip MP4 exists and identify the transcript file format.

```bash
ls -lh "$clip_path"
ls -lh "${clip_path%.*}"*.{json,srt,tsv} 2>/dev/null
```

### Step 2: Convert transcript to word data (if SRT)

```bash
python3 .claude/skills/00-longform-to-shortform/skill-pack/tools/srt_to_words.py input.srt --output words.json
```

### Step 3: Generate ASS subtitle file

```bash
python3 .claude/skills/00-longform-to-shortform/skill-pack/tools/words_to_ass.py words.json captions.ass \
  --highlight-color "#FF6600" \
  --font-size 48 \
  --margin-v 120 \
  --alignment 2 \
  --hook-text "HOOK TEXT HERE" \
  --hook-duration 3
```

Read accent color from `{brand_context}/design-tokens.md` if present; fall back to `#FF6600`.

CLI options for `words_to_ass.py`:

| Flag | Default | Description |
|------|---------|-------------|
| `--highlight-color` | `#FF6600` | Phrase highlight color (hex) |
| `--font-size` | `48` | Base subtitle font size |
| `--margin-v` | `120` | Vertical margin from bottom |
| `--alignment` | `2` | ASS alignment (2 = bottom-center) |
| `--hook-text` | — | Text overlay for opening seconds |
| `--hook-duration` | `3` | Seconds to show hook text |

### Step 4: Generate illustrations (if enabled)

If `editing.illustrations: true` in `pipeline.config.yaml` and `viz-image-gen` is installed:

1. Identify 4-8 key moments from the transcript (concept shifts, high-energy phrases, visual metaphors)
2. For each moment, invoke `viz-image-gen` with a descriptive prompt
3. Save PNGs as `01.png`, `02.png`, … in a working directory

### Step 5: Create moments config

```json
{
  "moments": [
    {"time": 1.37, "duration": 3.5, "image": "01.png", "label": "Label Text", "position": "lower-right"},
    {"time": 37.07, "duration": 3.5, "image": "02.png", "label": "Label Text", "position": "upper-right"}
  ]
}
```

Save as `moments.json` in the working directory.

### Step 6: Burn subtitles

```bash
ffmpeg -i clip.mp4 \
  -vf "ass=captions.ass" \
  -c:v libx264 -preset fast -crf 20 \
  -c:a copy \
  subtitled.mp4
```

### Step 7: Overlay illustrations (if enabled)

Two display modes controlled by `--mode`:
- **spotlight** (default) — illustration on a cream card with rounded corners and drop shadow, centered on screen with 50% dim backdrop. Best for key concept reveals.
- **float** — small (280px) illustration in the corner, no background. Video plays uninterrupted underneath.

Two illustration sources:
- **image-gen** — AI-generated sketches via viz-image-gen (GPT/Gemini, ~$0.04/image)
- **ffmpeg** — visual diagrams built from shapes/charts via FFmpeg filters (free)

```bash
bash .claude/skills/00-longform-to-shortform/skill-pack/tools/overlay_illustrations.sh \
  subtitled.mp4 final.mp4 \
  --config moments.json \
  --mode spotlight
```

Skip this step if `editing.illustrations: false`. Use `subtitled.mp4` as the final output.

### Step 8: Output

Report the final MP4 path. Copy to `~/Downloads/` if it is not already there.

## Config (pipeline.config.yaml)

| Key | Default | Description |
|-----|---------|-------------|
| `editing.subtitle_font` | `Montserrat` | Subtitle font family |
| `editing.subtitle_size` | `48` | Subtitle font size |
| `editing.highlight_color` | from design-tokens or `#FF6600` | Phrase highlight color |
| `editing.illustrations` | `true` | Enable illustration overlays |
| `editing.illustration_mode` | `spotlight` | Display mode: `spotlight` (card + dim) or `float` (corner, no bg) |
| `editing.illustration_source` | `image-gen` | Source: `image-gen` (GPT/Gemini) or `ffmpeg` (free visual diagrams) |
| `editing.illustration_style` | `notebook-sketch` | Style preset for image-gen source |
| `editing.illustration_count` | `4-6` | Number of illustration panels |

## Graceful Degradation

- No `design-tokens.md` → use `#FF6600` as highlight color
- No `viz-image-gen` → subtitles only, skip illustration steps
- No `pipeline.config.yaml` → use all defaults above
- SRT input → auto-convert via `srt_to_words.py` before proceeding

## References

- `references/ffmpeg-workflow.md` — filter chain details, ASS format, performance
- `references/illustration-overlay.md` — overlay config format, positioning, timing
