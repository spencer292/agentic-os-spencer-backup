# Phase 7: EDIT+RENDER

For each approved, reframed clip:

## Renderer Dispatch

Read `editing.renderer` from pipeline config (default: `hyperframes`).

- **`hyperframes`** (default) — proceed to Step 1 (transcription is shared), then jump to Step 2H
- **`ffmpeg`** — proceed to Steps 1-4 below (FFmpeg path, fallback renderer)

Both renderers share Step 1 (transcription) — word-level timestamps are needed regardless of renderer.

## Step 1: Transcribe the reframed clip

```bash
PHASE_START=$(date +%s)
```

Word-level timestamps are needed for subtitle generation. Transcribe each reframed clip (never slice the master transcript — extraction padding causes drift).

```bash
whisperx "{run_dir}/clips/clip-N/reframed-split-screen.mp4" \
  --model "$WHISPER_MODEL" \
  --output_dir "{run_dir}/clips/clip-N/" \
  --output_format json \
  --language en
```

## Step 1b: Groq fallback for clip transcription

If WhisperX is not installed, use Groq API for clip-level transcription:
1. Extract audio: `ffmpeg -y -i clip.mp4 -vn -acodec libmp3lame -q:a 4 audio.mp3`
2. **Important:** If the reframed clip's audio is truncated (shorter than video), extract audio from the **source video** at the clip's original timestamps instead.
3. Send to Groq, get word-level JSON, convert to TS format (seconds → frames at 30fps).

## Overlay Dependency Model

The `illustrations` toggle controls ONLY illustration overlays (Step 3). These elements are independent and ALWAYS on by default:

| Element | Config key | Default | Controlled by illustrations? |
|---------|-----------|---------|------------------------------|
| Hook text | `editing.hook_enabled` | true | NO — always renders |
| Subtitles/captions | `editing.subtitles_enabled` | true | NO — always renders |
| CTA end card | `editing.cta_enabled` | true | NO — always renders |
| Speaker card | `editing.speaker_card_enabled` | true | NO — independent toggle |
| Illustrations | `editing.illustrations` | true | YES — this is the toggle |

**Critical:** When `illustrations: false`, Steps 1, 2, and 4 (transcription, subtitles, FFmpeg burn) MUST still execute. Only Step 3 (illustration generation) is skipped.

---

## Step 2: Generate ASS subtitles

**Full-phrase subtitle rendering (CRITICAL):** Each ASS Dialogue event must contain the FULL phrase (3-4 words) with ALL words visible in white. The currently-spoken word is highlighted using ASS override tags. Do NOT create separate Dialogue events for individual words. Example for a 3-word phrase where "single" is active:
```
Dialogue: 0,0:00:01.20,0:00:01.80,Default,,0,0,0,,Every {\c&H81D4F8&}single{\c&HFFFFFF&} skill
```
(ASS uses BGR color order: `#F8D481` gold becomes `&H81D4F8&`). Generate one Dialogue event per word timing within the phrase, each showing the full phrase text but shifting which word has the highlight color.

Convert word-level data to ASS subtitle file with phrase highlighting, speaker card, and end-screen CTA:

```bash
# Read run metadata for speaker card and CTA
SPEAKER_NAME=$(jq -r '.channel // empty' "$RUN_DIR/run-metadata.json" 2>/dev/null || echo "")
CHANNEL_HANDLE=$(jq -r '.channel_handle // empty' "$RUN_DIR/run-metadata.json" 2>/dev/null || echo "")
CLIP_DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$REFRAMED_CLIP")

python3 projects/tools/words_to_ass.py \
  "{run_dir}/clips/clip-N/words.ts" \
  "{run_dir}/clips/clip-N/captions.ass" \
  --font-size "$SUBTITLE_SIZE" \
  --highlight-color "$HIGHLIGHT_COLOR" \
  --alignment "$SUBTITLE_ALIGNMENT" \
  --margin-v "$SUBTITLE_MARGIN_V" \
  --hook-text "$HOOK_TEXT" \
  --box-style "$SUBTITLE_BOX_STYLE" \
  --speaker-name "$SPEAKER_NAME" \
  --cta-duration "$CTA_DURATION" \
  --clip-duration "$CLIP_DURATION"
```

**Hook text is always enabled.** Use the clip's title/hook line from `clip_definitions.json` as `--hook-text`. The hook appears at frame 0, holds for 3 seconds, centered mid-screen, then fades out. Subtitles begin 0.7s after the hook disappears.

**Speaker card:** If `speaker_card_enabled: true` in config and `SPEAKER_NAME` is non-empty, a lower-third name card appears for the first 4 seconds with a fade-in/out. Agent can override with clip-specific speaker info for interviews/podcasts.

**End-screen CTA:** If `cta_enabled: true` in config and `CLIP_DURATION` is available, a "Watch the full video" overlay appears for the last `cta_duration` seconds. The CTA text and channel handle are sourced from `run-metadata.json`.

Config values from pipeline.config.yaml:
- `editing.subtitle_font` → font (default: Montserrat)
- `editing.subtitle_size` → --font-size (default: 120)
- Subtitle alignment & vertical margin are now layout-driven (see the table further down) — the legacy `editing.subtitle_alignment` and `editing.subtitle_margin_v` config keys were removed in 1.1.0.
- `editing.hook_duration` → --hook-duration (default: 3.0)
- `editing.highlight_color` → --highlight-color (default: auto from design-tokens)
- `editing.subtitle_box_style` → --box-style (default: backed). `"backed"` uses ASS `BorderStyle: 3` (opaque box) with `BackColour: &H8C000000` (55% opacity black), `Outline: 0`, `Shadow: 0`. `"none"` uses `BorderStyle: 1` with outline only. `"pill"` same as backed but word-level boxes.
- `editing.cta_duration` → --cta-duration (default: 4.0) — controls subtitle end-cap timing
- `editing.cta_enabled` → whether to build CTA card and apply overlay (default: true)
- `editing.speaker_card_enabled` → whether to pass speaker flags (default: true)

### Layout-specific subtitle positioning

Best practice for 9:16 short-form: position depends on layout. Full-face layouts use lower-third; split-screen puts subtitles mid-screen to straddle the panel boundary.

| Layout | Alignment | MarginV | Hook Alignment | Hook MarginV | Box Style | Rationale |
|--------|-----------|---------|----------------|--------------|-----------|-----------|
| `cursor-track` | 2 (bottom-center) | 350 | 5 (mid-center) | 0 | none | Lower-third subtitles, centered hook |
| `split-screen` | 5 (mid-center) | 0 | 8 (top-center) | 320 | none | Mid-screen subtitles at split boundary, hook in top-third above screen panel |
| `face-track` | 2 (bottom-center) | 350 | 5 (mid-center) | 0 | none | Lower-third subtitles, centered hook |

**Mixed-mode clips (HyperFrames only):** When a single clip transitions between talking-head and split-screen (detected via face detection in Phase 6), set subtitle position per phrase group based on the mode at that phrase's timestamp:
- Phrases during talking-head segments: `top:75%` (lower third)
- Phrases during split-screen segments: `top:50%` (center/panel boundary)

Pass layout-specific positioning to `words_to_ass.py`:
```bash
# split-screen example:
python3 projects/tools/words_to_ass.py ... --alignment 5 --margin-v 0 --hook-alignment 8 --hook-margin-v 320
# face-track / cursor-track example:
python3 projects/tools/words_to_ass.py ... --alignment 2 --margin-v 350 --hook-alignment 5 --hook-margin-v 0
```

## Step 3: Generate illustrations (optional)

**Skip this step entirely if `editing.illustrations: false`.** All other steps (transcription, subtitle generation, hook text, CTA, speaker card) proceed regardless of this toggle.

If `editing.illustrations: true` in config:

### Source: image-gen (default)

If `editing.illustration_source: "image-gen"`:

1. **Moment selection**: For each of 4-6 key visual moments, extract the verbatim transcript text in a ~10-second window (from word-level timestamps). Record the exact words being spoken. Choose moments at concept shifts, statistics, system names, or concrete examples.

2. For each moment, invoke `viz-image-gen` with:
   - Style: from `editing.illustration_style` (default: notebook-sketch)
   - Background: **transparent** (`--background transparent`) for clean overlay
   - Size: 1024x1024
   - Prompt rules:
     - **Literal, not metaphorical** — illustrate what the speaker describes, not an abstraction of a keyword
     - **Use the speaker's own examples** — if they say "copywriting, researching", draw those specific things
     - **Ground every prompt in the transcript excerpt** — re-read the verbatim text before writing the prompt

   Calibration examples (embed these in your reasoning when writing prompts):

   | Transcript | BAD prompt | GOOD prompt |
   |-----------|-----------|------------|
   | "skills are generic, bloated, lacking context" | "Three boxes falling apart with cracks" | "Five identical cookie-cutter documents in a row, each with the same bland content" |
   | "built for one task at a time. Think copywriting, researching" | "Arrow pointing at one box, others disconnected" | "A hand pointing at one page labeled COPYWRITING while RESEARCHING, EDITING, PUBLISHING sit unused" |

3. Save PNGs to `{run_dir}/clips/clip-N/illustrations/`
4. Create `{run_dir}/clips/clip-N/moments.json` — each entry must include:
   - `timestamp`: start time in seconds
   - `duration`: display duration in seconds
   - `context`: verbatim transcript excerpt (~10s window)
   - `concept`: one-line description of what the illustration communicates
   - `prompt`: the image-gen prompt used
   - `file`: path to the generated PNG

### Source: ffmpeg (free fallback)

If `editing.illustration_source: "ffmpeg"`:

1. Identify 4-6 key moments from transcript. For each, extract the verbatim transcript text in a ~10-second window. Prompts must illustrate what the speaker literally describes — not abstract metaphors.
2. For each moment, generate a visual diagram PNG using FFmpeg drawbox/drawtext filters:
   - **Must be actual visual diagrams** — shapes, charts, wireframes, stacked layers, crowd grids. NOT text-only cards.
   - Visual conventions (match sketch style): transparent background, dark strokes (#2D2D2D), gold accents (#D4A843)
   - Diagram types by concept: bar charts for comparisons, stacked rectangles for layers/stacks, grid dots for scale, wireframe boxes for systems, arrow flows for processes
   - Size: 1024x1024, transparent background (use `color=0x00000000` as base)
   - Save as PNG via FFmpeg single-frame render: `ffmpeg -f lavfi -i "color=0x00000000:s=1024x1024:d=1" -vf "drawbox=...,drawtext=..." -frames:v 1 -y output.png`
3. Save to `{run_dir}/clips/clip-N/illustrations/`
4. Create `{run_dir}/clips/clip-N/moments.json`

## Fonts (brand captions)

The caption font (`editing.subtitle_font`, default Montserrat) must be resolvable by libass. Montserrat static weights (Regular/Bold/SemiBold) are bundled at `skill-pack/assets/fonts/`. Make every `ass=` burn point libass at them so renders stay branded even on machines without a system install:

```
-vf "ass={captions.ass}:fontsdir=.claude/skills/00-longform-to-shortform/skill-pack/assets/fonts"
```

Run ffmpeg from the repo root and use relative forward-slash paths in the filter — Windows drive colons (`C:`) break the `ass` filter's option parsing.

## Standard burn recipe (current default)

The shipped `words_to_ass.py` is absent in this install; captions are generated by
`skill-pack/tools/captions_from_words.py` (words-json → ASS, phrase-grouped gold
word-highlight). Motion treatment is ON by default:

```bash
python3 skill-pack/tools/captions_from_words.py "$WORDS_JSON" "$CD/captions.ass" \
  --font Montserrat --font-size 104 --highlight "#F8D481" \
  --alignment 5 --margin-v 0 --box-style backed \
  --hook "$HOOK" --hook-duration 3.0 --kinetic        # --kinetic = phrase + hook pop-in

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CD/reframed-stacked.mp4")
ffmpeg -y -i "$CD/reframed-stacked.mp4" \
  -f lavfi -i "color=c=0xF8D481:s=1080x14:d=$DUR" \
  -filter_complex "[0:v]ass=$CD/captions.ass:fontsdir=skill-pack/assets/fonts,drawbox=x=0:y=ih-14:w=iw:h=14:color=black@0.3:t=fill[base];[1:v]format=rgba[bar];[base][bar]overlay=x=-1080+1080*t/$DUR:y=H-14[v]" \
  -map "[v]" -map 0:a -c:v libx264 -preset fast -crf 20 -c:a copy "$OUT"
```

The progress bar uses an `overlay` slide (not `drawbox` width) because this ffmpeg
build's `drawbox` lacks `eval=frame`. Run from repo root; relative forward-slash
paths only (Windows drive colons break the `ass`/filter parsing).

## Step 4: FFmpeg burn

### Step 4a: Build CTA card PNG (if CTA enabled and metadata exists)

```bash
VIDEO_TITLE=$(jq -r '.title // "Watch the full video"' "$RUN_DIR/run-metadata.json" 2>/dev/null || echo "Watch the full video")
CHANNEL_HANDLE=$(jq -r '.channel_handle // "@channel"' "$RUN_DIR/run-metadata.json" 2>/dev/null || echo "@channel")
VIDEO_DURATION=$(jq -r '.duration // ""' "$RUN_DIR/run-metadata.json" 2>/dev/null || echo "")

python3 projects/tools/build_cta_card.py \
  --thumbnail "$RUN_DIR/thumbnail.png" \
  --title "$VIDEO_TITLE" \
  --handle "$CHANNEL_HANDLE" \
  --duration "$VIDEO_DURATION" \
  --highlight-color "$HIGHLIGHT_COLOR" \
  --output "{run_dir}/clips/clip-N/cta_card.png"
```

**Expected CTA card layout (1080x1920):**
- Near-opaque dark background (`rgba(0,0,0,0.85)`)
- "WATCH THE FULL VIDEO" label (accent color, uppercase, letter-spacing)
- YouTube thumbnail image (centered, ~800x450, rounded corners)
- Video title (large, bold, white, with 1-2 key words in accent color)
- Duration + platform info (muted text, e.g. "37-min full build · YouTube")
- Channel handle (accent color)

**Fallback:** If no thumbnail exists, the script produces a text-only card — hide the thumbnail area and increase the title size to fill the space. The card is a 1080x1920 translucent PNG (`rgba` preserved).

### Step 4b: FFmpeg burn variants

Calculate CTA timing:
```bash
CTA_START=$(echo "$CLIP_DURATION - $CTA_DURATION" | bc)
```

**Decision tree:**

1. **CTA enabled + card PNG exists** — subtitles + card overlay with `enable` timing:
```bash
ffmpeg -y -i "{run_dir}/clips/clip-N/reframed-split-screen.mp4" \
  -i "{run_dir}/clips/clip-N/cta_card.png" \
  -filter_complex "[0:v]ass={run_dir}/clips/clip-N/captions.ass[subbed];[1:v]format=rgba[card];[subbed][card]overlay=0:0:enable='gte(t,$CTA_START)'[out]" \
  -map "[out]" -map 0:a -c:v libx264 -preset fast -crf 20 -c:a copy \
  "{skill-name}/renders/{run-dir}/clip-N.mp4"
```

2. **CTA enabled + no card PNG** — subtitles + drawbox dim fallback:
```bash
ffmpeg -y -i "{run_dir}/clips/clip-N/reframed-split-screen.mp4" \
  -vf "ass={run_dir}/clips/clip-N/captions.ass,drawbox=x=0:y=0:w=iw:h=ih:color=black@0.5:t=fill:enable='gte(t,$CTA_START)'" \
  -c:v libx264 -preset fast -crf 20 -c:a copy \
  "{skill-name}/renders/{run-dir}/clip-N.mp4"
```

3. **CTA disabled** — subtitles only:
```bash
ffmpeg -y -i "{run_dir}/clips/clip-N/reframed-split-screen.mp4" \
  -vf "ass={run_dir}/clips/clip-N/captions.ass" \
  -c:v libx264 -preset fast -crf 20 -c:a copy \
  "{skill-name}/renders/{run-dir}/clip-N.mp4"
```

4. **Illustrations enabled** — burn subtitles first, then overlay illustrations (existing flow unchanged):
```bash
# Burn subtitles first
ffmpeg -y -i "{run_dir}/clips/clip-N/reframed-split-screen.mp4" \
  -vf "ass={run_dir}/clips/clip-N/captions.ass" \
  -c:v libx264 -preset fast -crf 20 -c:a copy \
  "{run_dir}/clips/clip-N/subtitled.mp4"

# Then overlay illustrations (mode from config)
bash projects/tools/overlay_illustrations.sh \
  "{run_dir}/clips/clip-N/subtitled.mp4" \
  "{skill-name}/renders/{run-dir}/clip-N.mp4" \
  --config "{run_dir}/clips/clip-N/moments.json" \
  --mode "$ILLUSTRATION_MODE"
```

**Note:** CTA card overlay and illustrations can be combined — burn subtitles, overlay illustrations, then overlay CTA card as the final step.

Config values:
- `editing.illustration_mode` → --mode (default: spotlight)
- `editing.illustration_source` → determines Step 3 path
- `editing.illustration_style` → viz-image-gen style preset
- `editing.cta_enabled` → whether to apply CTA dim overlay
- `editing.cta_duration` → seconds before end to start dim

## Step 2H: HyperFrames Render (opt-in alternative to Steps 2-4)

When `editing.renderer: "hyperframes"` is set, use the `viz-hyperframes` skill to render each clip as an HTML+CSS+GSAP composition instead of FFmpeg filter graphs.

### 2H.1: Check prerequisites

```bash
# All three must be available
command -v node >/dev/null 2>&1 && NODE_OK=true || NODE_OK=false
command -v npx >/dev/null 2>&1 && NPX_OK=true || NPX_OK=false
command -v ffmpeg >/dev/null 2>&1 && FFMPEG_OK=true || FFMPEG_OK=false

if [ "$NODE_OK" = false ] || [ "$NPX_OK" = false ] || [ "$FFMPEG_OK" = false ]; then
  echo "WARN: HyperFrames requires node 22+, npx, and ffmpeg. Falling back to FFmpeg renderer."
  # Fall back to FFmpeg path (Steps 2-4)
fi
```

If prerequisites are missing, fall back to the FFmpeg path for all clips with a warning in the pipeline log.

### 2H.2: Init HyperFrames project per clip

For each clip, create a HyperFrames project. Note: `npx hyperframes init` creates a named subdirectory — account for this in the path.

```bash
CLIP_PARENT="{run_dir}/clips/clip-N"
cd "$CLIP_PARENT" && npx hyperframes init "clip-N"
CLIP_HF_DIR="$CLIP_PARENT/clip-N"
```

The project lives at `$CLIP_HF_DIR` (the named subdirectory, not the parent). Copy the reframed clip into the project directory so the HTML `<video>` element can reference it locally.

### 2H.3: Generate design.md

Build a `design.md` in the HyperFrames project from pipeline config + brand design-tokens (if available):

- Canvas: 1080x1920
- Font: from `editing.subtitle_font`
- Highlight color: from `editing.highlight_color` (or design-tokens)
- Background: video-based (no solid background)

### 2H.4: Build HTML composition

Follow `references/hyperframes-composition.md` to generate the HTML composition dynamically:

1. Parse word-level timestamps from Step 1 transcription output
2. Group words into 3-4 word phrase groups
3. Build the layer stack: video base, captions, hook text, speaker card, illustrations, CTA
4. Generate GSAP timeline with per-word highlight tweens and layer entrance/exit animations
5. Write `index.html` to the HyperFrames project directory

**Illustrations:** If `editing.illustrations: true`, generate illustrations using the same Step 3 logic (image-gen or ffmpeg source), then reference the PNGs in the HTML composition with animated entrances per `illustration_mode`.

**Layout-specific positioning:** Use the CSS positioning table from `references/hyperframes-composition.md` — map layout type (split-screen, face-track, cursor-track) to appropriate caption and hook CSS positions.

### 2H.5: Lint + render

```bash
cd "$CLIP_HF_DIR"
npx hyperframes lint          # Validate composition before render
npx hyperframes render --quality standard
```

The rendered MP4 appears in the HyperFrames project output directory. Copy it to the final render path:

```bash
cp "$CLIP_HF_DIR/output/composition.mp4" "{skill-name}/renders/{run-dir}/clip-N.mp4"
```

### 2H.6: Cleanup

Remove the temporary HyperFrames project directory to save disk space:

```bash
rm -rf "$CLIP_HF_DIR"
```

### Fallback

If HyperFrames render fails for any individual clip (lint error, render crash, timeout), fall back to FFmpeg for that specific clip:

1. Log a warning: `"WARN: HyperFrames render failed for clip-N, falling back to FFmpeg"`
2. Run Steps 2-4 (FFmpeg path) for that clip
3. Continue with HyperFrames for remaining clips

This ensures the pipeline never fails completely due to HyperFrames issues.

---

## Parallelization

Process clips in parallel (up to `performance.parallel_edits` from config, default 3).

**Windows note:** bash background jobs with exported variables behave inconsistently under Git Bash (`$VAR` interpolates as empty in subshells, log redirects land at filesystem root). Force serial execution on Windows.

```bash
MAX_PARALLEL=$PARALLEL_EDITS

# Detect Windows and force serial — see Phase 6 reframe for context.
if [ -n "$MSYSTEM" ] || [ "$OS" = "Windows_NT" ]; then
  MAX_PARALLEL=1
  echo "[edit] Windows detected — forcing serial execution (MAX_PARALLEL=1)"
fi

RUNNING=0

for CLIP in "${CLIPS[@]}"; do
  (
    # Steps 1-4 for this clip
  ) &
  RUNNING=$((RUNNING + 1))
  if [ "$RUNNING" -ge "$MAX_PARALLEL" ]; then
    wait -n
    RUNNING=$((RUNNING - 1))
  fi
done
wait

PHASE_END=$(date +%s)
echo "Phase 7 EDIT+RENDER ($NUM_CLIPS clips): $((PHASE_END - PHASE_START))s" >> "$RUN_DIR/phase-timings.txt"
```

## Error handling

- If subtitle generation fails: log error, skip clip
- If illustration generation fails: fall back to subtitles-only
- If FFmpeg burn fails: log error, skip clip
- At least one clip must succeed or pipeline fails
