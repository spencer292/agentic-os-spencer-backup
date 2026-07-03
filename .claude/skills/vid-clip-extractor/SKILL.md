---
name: vid-clip-extractor
version: 1.0.0
description: "Extract and intelligently reframe clips from long-form 16:9 videos into 9:16 portrait format with face-aware layouts. Uses FFmpeg pipe rendering with OpenCV DNN face detection and HSV scene detection. Use for 'extract clips', 'reframe video', 'clip extractor', 'portrait crop', 'face tracking', '16:9 to 9:16', 'smart crop', 'make shorts from video', 'auto reframe'."
argument-hint: [video_file_path]
allowed-tools:
  - Bash(python:*)
  - Bash(ffmpeg:*)
  - Bash(ffprobe:*)
  - Bash(pip:*)
  - Read
  - Write
metadata:
  category: video-production
  version: 4.0
  phase: 6
---

# Clip Extractor

FFmpeg pipe-based reframing tool that takes 16:9 landscape videos and produces 9:16 portrait clips with face-aware layout switching. Three layout modes for different content types. Fully local, zero cost per clip.

## Architecture

All layouts use the same pipeline:
1. **Face detection** — OpenCV DNN ResNet-10 SSD (every frame, via FFmpeg rawvideo pipe)
2. **Scene detection** — HSV histogram difference (every 10th frame)
3. **Per-scene classification** — face_width > 10% of frame = talking-head, else screen-share
4. **Motion-classified smoothing** — stationary (snap to mean), panning (linear), tracking (cubic spline + gaussian)
5. **FFmpeg pipe render** — decode raw frames, numpy crop/composite, pipe to libx264 encoder

No MediaPipe. No crop_path.json intermediate. No NVENC. Single-pass detect-and-render.

## Layout Modes

| Mode | CLI flag | Best for | What it does |
|------|----------|----------|--------------|
| **split-screen** | `--layout split-screen` (default) | Tutorials, demos, screen recordings with webcam | Top 50% = wide screen crop (9:8, opposite side to face). Bottom 50% = tight face zoom. Talking-head scenes get a single full-frame 9:16 crop instead |
| **cursor-track** | `--layout cursor-track` | Screen recordings where cursor guides viewer | Screen-share scenes = wide 9:8 crop centered vertically in output. Talking-head scenes = tight 9:16 face crop |
| **face-track** | `--layout face-track` | Talking head, vlog, direct-to-camera | Simple 9:16 crop that follows the speaker's face with motion-classified smoothing |

**Default:** `split-screen` — works for any video that shows both screen content and a person.

### Split-Screen Detail

- **Screen-share scenes:** Top panel = 9:8 crop from source (full height, opposite side to face). Bottom panel = tight face zoom (3x face width, 9:8 aspect, centered on face cx/cy)
- **Talking-head scenes:** Single 9:16 crop (computed dynamically from source dims), face-centered
- Scene type determined by average face_width: >10% = talking-head, <=10% = screen-share
- Screen alignment: face on right -> screen from left, face on left -> screen from right

### Cursor-Track Detail

- **Screen-share scenes:** Wide 9:8 crop of screen area (opposite side to face), scaled to output width, centered vertically with black bars
- **Talking-head scenes:** Tight 9:16 face crop (dynamic from source dims), fills full output

## Package

**Location:** `.claude/skills/00-longform-to-shortform/skill-pack/tools/reframe/`
**Models:** `.claude/skills/00-longform-to-shortform/skill-pack/tools/reframe/models/` (ResNet-10 SSD Caffe — deploy.prototxt + caffemodel)

## Prerequisites

```bash
pip install opencv-python numpy scipy
ffmpeg -version | head -1
```

## CLI

```bash
# Run from the repo root — PYTHONPATH resolves tools.reframe from the _systems package
SYS_DIR=".claude/skills/00-longform-to-shortform/skill-pack"

# Full reframe (most common)
PYTHONPATH="$SYS_DIR" python -m tools.reframe --video INPUT.mp4 --output OUTPUT.mp4 --layout split-screen

# With clip extraction (stream-copy cut, then reframe)
PYTHONPATH="$SYS_DIR" python -m tools.reframe --video SOURCE.mp4 --output OUTPUT.mp4 --start 120.5 --end 196.5 --layout split-screen

# Cursor-track mode
PYTHONPATH="$SYS_DIR" python -m tools.reframe --video INPUT.mp4 --output OUTPUT.mp4 --layout cursor-track

# Face-track mode
PYTHONPATH="$SYS_DIR" python -m tools.reframe --video INPUT.mp4 --output OUTPUT.mp4 --layout face-track
```

**IMPORTANT:** Run from the repo root. Set `PYTHONPATH` to the _systems package dir so `python -m tools.reframe` resolves.

## Python API

```python
# Add _systems package to path first
import sys; sys.path.insert(0, ".claude/skills/00-longform-to-shortform/skill-pack")
from tools.reframe.split_screen import reframe as split_screen_reframe
from tools.reframe.cursor_track import reframe as cursor_track_reframe
from tools.reframe.face_track import reframe as face_track_reframe

# Each takes (video_path: str, output_path: str)
split_screen_reframe("input.mp4", "output.mp4")
```

## Non-Negotiable Rules

1. **NEVER re-encode during clip extraction** — use `ffmpeg -c copy` for stream copy
2. **ALWAYS use split-screen as default** — it handles mixed content best
3. **NEVER produce black bars in split-screen** — boundary clamping is always on
4. **Reframed clips are intermediates** — FFmpeg re-encodes during subtitle burn in Phase 7, so preset=fast and crf=20 are fine

## Integration

- **Upstream:** `vid-clip-selection` for clip timestamps
- **Downstream:** `vid-ffmpeg-edit` for subtitles and overlays
- **Replaces:** Old `clip_extractor/` Python package (MediaPipe-based)

## References

| File | Purpose |
|------|---------|
| `references/reframe-engine-api.md` | Python module API reference |
| `references/config-tuning.md` | Tunable parameters |
