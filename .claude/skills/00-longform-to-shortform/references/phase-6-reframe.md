# Phase 6: REFRAME

Reference: `.claude/skills/vid-clip-extractor/SKILL.md`

## Tool

**Package:** `.claude/skills/00-longform-to-shortform/tools/reframe/`

FFmpeg pipe-based reframing with OpenCV DNN face detection and HSV scene detection. No MediaPipe, no crop_path.json, no external dependencies beyond opencv-python, numpy, scipy.

## CLI

```bash
# Activate the reframe venv (installed by install.sh — has opencv-python, numpy, scipy).
# Falls back to system python if the venv is missing.
VENV_DIR="projects/tools/.venv"
if [ -f "$VENV_DIR/bin/activate" ]; then
  source "$VENV_DIR/bin/activate"
elif [ -f "$VENV_DIR/Scripts/activate" ]; then
  source "$VENV_DIR/Scripts/activate"
fi

# PYTHONPATH points to the skill-pack so python -m tools.reframe resolves
SKILL_PACK=".claude/skills/00-longform-to-shortform/skill-pack"
PYTHONPATH="$SKILL_PACK" python -m tools.reframe \
  --video "$SOURCE_VIDEO" \
  --output "$PROJECT_DIR/clips/clip-N/reframed.mp4" \
  --start "$CLIP_START" \
  --end "$CLIP_END" \
  --layout "$LAYOUT"
```

If `python -m tools.reframe` fails with `ModuleNotFoundError: No module named 'cv2'`, the venv was not created at install time. Run:
```bash
python -m venv projects/tools/.venv
source projects/tools/.venv/bin/activate   # or .venv/Scripts/activate on Windows
pip install -r .claude/skills/00-longform-to-shortform/skill-pack/tools/reframe/requirements.txt
```

Where `$LAYOUT` comes from `input.layout` in pipeline config (default `split-screen`).

## Parallel Extraction

Read `performance.parallel_reframes` from `pipeline.config.yaml` (default: 3). Run individual clip reframes in parallel.

**Windows note:** bash background jobs (`cmd &`) with exported `RUN_DIR`-style variables behave inconsistently under Git Bash — variables interpolate as empty in the spawned subshell and log redirects land at the filesystem root. Force serial execution on Windows to avoid silent log-loss and clip drops.

```bash
PHASE_START=$(date +%s)

MAX_PARALLEL=$PARALLEL_REFRAMES  # from config, default 3

# Detect Windows (Git Bash sets MSYSTEM; cmd-spawned shells set OS=Windows_NT).
# Native Bash on macOS/Linux exposes neither.
if [ -n "$MSYSTEM" ] || [ "$OS" = "Windows_NT" ]; then
  MAX_PARALLEL=1
  echo "[reframe] Windows detected — forcing serial execution (MAX_PARALLEL=1)"
fi

RUNNING=0

SKILL_PACK=".claude/skills/00-longform-to-shortform/skill-pack"
VENV_DIR="projects/tools/.venv"

# Activate the reframe venv if it exists (installed by install.sh).
# Falls back to system python — Phase 6 will fail with ModuleNotFoundError
# if the venv is missing and system python doesn't have opencv/numpy/scipy.
if [ -f "$VENV_DIR/bin/activate" ]; then
  source "$VENV_DIR/bin/activate"
elif [ -f "$VENV_DIR/Scripts/activate" ]; then
  source "$VENV_DIR/Scripts/activate"
fi

for CLIP in $(seq 1 $NUM_CLIPS); do
  PYTHONPATH="$SKILL_PACK" python -m tools.reframe \
    --video "$SOURCE_VIDEO" \
    --output "$PROJECT_DIR/clips/clip-${CLIP}/reframed-${LAYOUT}.mp4" \
    --start "${CLIP_STARTS[$CLIP]}" \
    --end "${CLIP_ENDS[$CLIP]}" \
    --layout "$LAYOUT" &

  RUNNING=$((RUNNING + 1))

  if [ "$RUNNING" -ge "$MAX_PARALLEL" ]; then
    wait -n
    RUNNING=$((RUNNING - 1))
  fi
done

wait

PHASE_END=$(date +%s)
echo "Phase 6 REFRAME ($NUM_CLIPS clips, $MAX_PARALLEL parallel): $((PHASE_END - PHASE_START))s" >> "$RUN_DIR/phase-timings.txt"
```

## Layout Modes

| Layout | Behavior | Best for |
|--------|----------|----------|
| `split-screen` (default) | Top 50% = screen content (9:8 crop, opposite side to face). Bottom 50% = face zoom (3x face width). Talking-head scenes = single 9:16 face crop | Tutorials, demos, screen recordings with webcam |
| `cursor-track` | Screen-share scenes = wide 9:8 crop centered vertically. Talking-head scenes = tight 9:16 face crop | Screen recordings where cursor movement matters |
| `face-track` | 9:16 crop follows the speaker's face with motion-classified smoothing | Talking head, vlog, direct-to-camera |
| `stacked` | Two-person side-by-side grid split into a stacked 9:16 (left speaker top, right speaker bottom). Auto-detects each tile's letterbox content band so there's no black gap. Static — no face detection, single ffmpeg pass. Tunables (`FACE_BIAS`, `TOP_X_BIAS`, `BOT_X_BIAS`, `SWAP_SIDES`) at the top of `stacked.py` | Two-up Zoom/Riverside/Teams interviews where both people sit in fixed tiles |

## Output

Each clip reframe creates:
- `{run_dir}/clips/clip-N/raw.mp4` — stream-copy extract (when --start/--end used)
- `{run_dir}/clips/clip-N/reframed-{layout}.mp4` — reframed 1080x1920 output

## How It Works

1. FFmpeg decodes every frame as raw BGR via pipe
2. OpenCV DNN ResNet-10 SSD detects faces (every frame, full resolution) and records confidence scores
3. HSV histogram scene detection classifies scene boundaries
4. Per-scene classification (position-primary, size-secondary):
   - Face position (cx) is the primary signal:
     - `cx < 0.30` or `cx > 0.70` → face is off to one side → **screen-share** (triggers split-screen panel)
     - `cx` between `0.35` and `0.65` → face centered → **talking-head** (full 9:16 face crop)
     - `cx` in `0.30–0.35` or `0.65–0.70` (ambiguous zone) → face width is used as a tiebreaker
   - **Majority vote**: a clip only locks into uniform mode when ≥90% of frames agree on the same classification. Mixed content (some talking-head, some screen-share) is handled per-scene
   - **Graphic-insert detection**: stretches of ≥5 frames with face-detection confidence below `0.3` are flagged as full-screen graphic inserts and routed to the content-focus path
5. Motion-classified smoothing (stationary/panning/tracking) prevents jitter
6. Numpy crops/composites each frame per layout mode
7. FFmpeg encodes output via pipe (libx264, preset fast, crf 20)

Thresholds live as constants at the top of `skill-pack/tools/reframe/split_screen.py` (`CX_SIDE_THRESHOLD`, `CX_CENTER_LOW`, `CX_CENTER_HIGH`, `FW_THRESHOLD`, `GRAPHIC_CONF_THRESHOLD`, `GRAPHIC_MIN_FRAMES`). Adjust them if your recording setup uses different camera framing.

## Performance

Expected render time per 90s clip: ~2-3 min (face detection + render).

Reframed clips are **intermediates** — FFmpeg re-encodes during the subtitle burn pass in Phase 7, so these don't need to be pixel-perfect.

## Quoting

Always quote variables in background commands: `"$VAR"` not `$VAR`, especially for paths with spaces.
