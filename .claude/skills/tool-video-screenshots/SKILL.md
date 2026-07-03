---
name: tool-video-screenshots
version: 1.0.0
description: >
  Extract intelligent screenshots from YouTube videos at key visual moments.
  Two modes: scene-detect (automatic via ffmpeg scene filter) and timestamp
  (manual list of times). After extraction, Claude reviews candidates against
  the transcript, picks the best 2-10 frames, and writes captions for each.
  Triggers on: "screenshot from video", "extract frames", "video screenshots",
  "capture slides from video", "grab frames from", "key moments from video".
  Does NOT trigger for video editing, clip extraction, or thumbnail creation.
  No paid APIs — uses yt-dlp and ffmpeg only.
---

# Video Screenshots Tool

Extract key frames from YouTube videos. Two modes:

- **Scene-detect** — ffmpeg finds visual transitions automatically
- **Timestamp** — you specify exact times to capture

After extraction, Claude reviews the candidate frames against the transcript, selects the best 2-10, and writes a caption for each.

## Outcome

Selected frames with captions saved to `{projects_base}/tool-video-screenshots/{YYYY-MM-DD}/{video-slug}/`. Always save output to disk. Resolve `{projects_base}` from `skill-pack/config/sys-config.md` → `## Paths`.

**Standalone output structure:**
```
{projects_base}/tool-video-screenshots/{YYYY-MM-DD}/{video-slug}/
  frames/          <- selected PNG frames
  manifest.json    <- [{timestamp, frame_path, caption}]
  README.md        <- summary with inline frame references
```

**Pipeline mode:** When called by another skill, return the manifest JSON path instead of building the README. The orchestrator typically passes an explicit output path inside its own `{date}/logs/screenshots/` folder.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `skill-pack/config/sys-config.md` | `## Paths` only | Resolve `projects_base` for standalone output |
| `{decoupled_base}/context/learnings.md` | `## tool-video-screenshots` section | Known issues, video quirks |

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-youtube` | Optional | Transcript for AI selection pass | Ask user to describe video content |

| Binary | Required | Install |
|--------|----------|---------|
| `ffmpeg` | Yes | `brew install ffmpeg` |
| `yt-dlp` | Yes | `brew install yt-dlp` |

## Step 0: Auto-Setup (runs once)

Check if ffmpeg and yt-dlp exist. If either is missing, run setup:

```bash
bash .claude/skills/tool-video-screenshots/scripts/setup.sh
```

Skip on subsequent calls if both binaries exist.

## Step 1: Determine Mode

| Request | Mode |
|---------|------|
| "Get screenshots from [URL]" | Scene-detect (default) |
| "Capture frames at 2:35, 9:49, 15:00" | Timestamp |
| Another skill needs frames | Pipeline — return manifest path |

## Step 2: Extract Candidate Frames

```bash
python3 .claude/skills/tool-video-screenshots/scripts/extract_frames.py \
  "<url>" --scene-detect --max-frames 15 --output-dir /tmp/frames
```

Or for specific timestamps:

```bash
python3 .claude/skills/tool-video-screenshots/scripts/extract_frames.py \
  "<url>" --timestamps "00:02:35,00:09:49,00:15:00" --output-dir /tmp/frames
```

The script outputs a `manifest.json` with all candidate frames and their timestamps.

## Step 3: AI Selection Pass

Read `references/frame-selection-guide.md` for heuristics.

**If the user specified topics** (e.g. "screenshots about the architecture" or "frames showing the dashboard"):

1. Fetch the transcript via `tool-youtube` — this is required for topic filtering
2. Scan the transcript for segments discussing the requested topics
3. Read the manifest and view each candidate frame
4. Keep only frames whose timestamp falls within or near a topic-relevant transcript segment AND whose visual content matches the topic
5. If no candidates match a requested topic, say so explicitly — don't force-pick an unrelated frame
6. Write topic-focused captions that explain how each frame relates to what was requested

**If no topics specified** (default):

1. Read the manifest and view each candidate frame
2. If a transcript is available (via `tool-youtube`), cross-reference timestamps with spoken content
3. Select the best 2-10 frames based on visual distinctness and content relevance
4. Write a caption for each selected frame describing what the viewer sees and why it matters

Delete unselected frames in both modes.

## Step 4: Save Output

Copy selected frames to `{projects_base}/tool-video-screenshots/{YYYY-MM-DD}/{video-slug}/frames/` (or to the path passed by the orchestrator).

Write the final manifest with captions:
```json
[
  {
    "timestamp": "00:02:35",
    "frame_path": "frames/frame_00_02_35.png",
    "caption": "Dashboard showing the main analytics view with three KPI cards"
  }
]
```

Write a `README.md` summarizing the video and listing each frame with its caption.

## Step 5: Collect Feedback

If used standalone, ask: "Got the frames. Want me to adjust the selection or add captions?"

Log feedback to `context/learnings.md` > `## tool-video-screenshots`.

---

## Rules

*Updated automatically when the user flags issues. Read before every run.*

---

## Self-Update

If the user flags an issue — wrong frames, bad selection, missing content — update the `## Rules` section immediately with the correction and today's date.
