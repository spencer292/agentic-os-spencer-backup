# Pipeline Phases (Detailed)

## Phase 2: DOWNLOAD

Determine if input is a URL or local path.

**Important:** All commands run from the repo root (where `tools/` lives). Run working data goes to `projects/{skill-name}/runs/`.

**If YouTube URL:**
```bash
source tools/venv.sh
yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" \
  --merge-output-format mp4 \
  -o "projects/{skill-name}/runs/$(date +%Y-%m-%d)-TITLE/source.mp4" \
  "YOUTUBE_URL"
```

Sanitize the video title for the directory name (lowercase, hyphens, no special chars). Extract the title first with `yt-dlp --get-title`.

**If local path:**
- Create the project directory
- Copy (or symlink) the file to `{run_dir}/source.mp4`

Set `$SOURCE_VIDEO` to the final path. Set `$RUN_DIR` to `projects/{skill-name}/runs/YYYY-MM-DD-{title}`. Log duration with ffprobe.

---

## Phase 3: TRANSCRIBE (Full Video)

Reference: `.claude/skills/tool-transcription/SKILL.md`

Run WhisperX on the full source video to get a transcript for clip selection:

```bash
source tools/venv.sh
whisperx "$SOURCE_VIDEO" \
  --model "$WHISPER_MODEL" \
  --output_dir "$PROJECT_DIR" \
  --output_format srt \
  --language en
```

Use `device='cpu'` on macOS, `device='cuda'` on Linux with GPU. Use `compute_type='int8'` on CPU, `compute_type='float16'` on CUDA.

Output: `{run_dir}/source.srt`

---

## Phase 4: SELECT

Reference: `.claude/skills/vid-clip-selection/SKILL.md` (phases 1-4 only, skip Phase 5 human review)

1. Read the SRT transcript
2. Identify candidate clips using the 5-category scoring framework:
   - **Hook Strength** (0-20): Does it grab attention in first 3 seconds?
   - **Standalone Value** (0-25): Does it make sense without context?
   - **Emotional Resonance** (0-20): Does it provoke reaction?
   - **Information Density** (0-20): Insight-per-second ratio
   - **Shareability** (0-15): Would someone share this?
3. Score each candidate (total out of 100)
4. Respect `duration_range` from config for clip boundaries
5. Write `{run_dir}/clip_candidates.json`

---

## Phase 5: AUTO-APPROVE

No human review. Automated filtering:

1. Filter clips using `combined_score` when viral scores are present, otherwise fall back to `total_score`. Threshold: `>= min_score` (from config, default 65)
2. Sort by score descending
3. Take top `max_clips` (default 5)
4. **Safety net:** If fewer than `min_clips` (default 2) pass the threshold:
   - Lower threshold by 10 and re-filter
   - Repeat until `min_clips` met or floor of 45 reached
5. Write `{run_dir}/clip_definitions.json` (approved clips only)
6. Log all decisions

---

## Phase 6: REFRAME

Reference: `.claude/skills/vid-clip-extractor/SKILL.md`

Batch extract and reframe all approved clips:

```bash
cd tools
source .venv/bin/activate
python -m clip_extractor batch \
  --video "$SOURCE_VIDEO" \
  --clips "$PROJECT_DIR/clip_definitions.json" \
  --output "$PROJECT_DIR/clips/" \
  --format "$FORMAT" \
  --layout "$LAYOUT"
```

**Layout modes:**

| Layout | Behavior | Best for |
|--------|----------|----------|
| `face-track` | 9:16 crop follows the speaker's face | Talking head, vlog, direct-to-camera |
| `split-screen` (default) | Top 50% = screen content (webcam removed), bottom 50% = face zoomed in | Tutorials, demos, screen recordings with webcam |
| `cursor-track` | Face segments -> face-track crop, screen segments -> split-screen with cursor following | Screen recordings where cursor movement guides the viewer |

Output: `{run_dir}/clips/clip-N.mp4` for each approved clip.

**Performance defaults:** Reframed clips are intermediates (FFmpeg re-encodes during subtitle burn), so the renderer uses `veryfast` preset, CRF 23, bilinear scaling, and hardware-accelerated decode. Expected: ~12-15s per 90s clip.

---

## Phase 7: EDIT+RENDER (FFmpeg)

For each approved, reframed clip:

### Step 1: Transcribe the reframed clip

Word-level timestamps are needed for subtitle generation. Transcribe each reframed clip (never slice the master transcript — extraction padding causes drift).

```bash
whisperx "{run_dir}/clips/clip-N.mp4" \
  --model "$WHISPER_MODEL" \
  --output_dir "{run_dir}/clips/" \
  --output_format json \
  --language en
```

### Step 2: Generate ASS subtitles

```bash
python3 projects/tools/words_to_ass.py \
  "{run_dir}/clips/clip-N-words.ts" \
  "{run_dir}/clips/clip-N.ass" \
  --font-size "$SUBTITLE_SIZE" \
  --highlight-color "$HIGHLIGHT_COLOR" \
  --hook-text "$HOOK_TEXT"
```

Config values from pipeline.config.yaml:
- `editing.subtitle_size` -> --font-size (default: 48)
- `editing.highlight_color` -> --highlight-color (default: auto from design-tokens)

### Step 3: Generate illustrations (optional)

If `editing.illustrations: true` in config:

1. Analyze the transcript to identify 4-6 key visual moments
2. Use `viz-image-gen` to generate illustration PNGs for each moment
3. Save to `{run_dir}/clips/clip-N-illustrations/`
4. Create `{run_dir}/clips/clip-N-moments.json` with timing config

### Step 4: FFmpeg burn

**Subtitles only (no illustrations):**
```bash
ffmpeg -i "{run_dir}/clips/clip-N.mp4" \
  -vf "ass={run_dir}/clips/clip-N.ass" \
  -c:v libx264 -preset fast -crf 20 -c:a copy \
  "{skill-name}/renders/{run-dir}/clip-N.mp4"
```

**Subtitles + illustrations:**
```bash
# Burn subtitles first
ffmpeg -i "{run_dir}/clips/clip-N.mp4" \
  -vf "ass={run_dir}/clips/clip-N.ass" \
  -c:v libx264 -preset fast -crf 20 -c:a copy \
  "{run_dir}/clips/clip-N-subtitled.mp4"

# Then overlay illustrations
bash projects/tools/overlay_illustrations.sh \
  "{run_dir}/clips/clip-N-subtitled.mp4" \
  "{skill-name}/renders/{run-dir}/clip-N.mp4" \
  --config "{run_dir}/clips/clip-N-moments.json"
```

### Parallelization

Process clips in parallel (up to `performance.parallel_edits` from config, default 3).

### Error handling

- If subtitle generation fails: log error, skip clip
- If illustration generation fails: fall back to subtitles-only
- If FFmpeg burn fails: log error, skip clip
- At least one clip must succeed or pipeline fails

---

## Phase 8: POST

Reference: `.claude/skills/mkt-short-form-posting/SKILL.md`

For content packaging and platform-specific formatting, the orchestrator dispatches the content-packager sub-agent. See `.claude/agents/l2s-content-packager.md` for the full agent definition.

Controlled by `publishing.mode` in config:

### Mode: `skip`
Log "Publishing skipped per config" and finish.

### Mode: `draft`
For each rendered clip:
1. Generate content package (title, description, hashtags) per platform
2. Create draft in Zernio for each configured platform
3. Log the Zernio dashboard URLs for manual review

### Mode: `auto-post`
For each rendered clip:
1. Generate platform-specific content packages:
   - **YouTube Shorts:** Title (<=60 chars), description, tags
   - **Instagram Reels:** Caption with hashtags (<=2200 chars)
   - **TikTok:** Description with hashtags (<=2200 chars)
2. Upload video to Zernio storage
3. Create and publish posts to each configured platform
4. Log post URLs

## Timing Summary

After the final phase completes, write the timing summary to `pipeline-log.md`.
