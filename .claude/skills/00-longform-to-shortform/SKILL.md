---
name: 00-longform-to-shortform
version: 1.1.0
description: "End-to-end automated pipeline: YouTube URL -> download -> transcribe -> select clips -> reframe -> edit -> render -> post. Zero human-in-the-loop. Triggers: 'full pipeline', 'process video', 'long to short', 'auto pipeline', 'YouTube to shorts', 'create short-form content from'."
argument-hint: youtube_url_or_video_path
allowed-tools:
  - Bash(*)
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
  - mcp__zernio__*
dependencies:
  - vid-clip-selection
  - vid-clip-extractor
  - tool-transcription
  - vid-ffmpeg-edit
  - mkt-short-form-posting
  - tool-video-upload
  - tool-zernio-social
optional-dependencies:
  - viz-hyperframes  # opt-in renderer for Phase 7 (editing.renderer: "hyperframes")
metadata:
  category: video-production
  version: 1.1
  phase: orchestrator
---

# Long-Form to Short-Form Orchestrator

Fully automated pipeline that takes a YouTube URL (or local video path) and produces edited, rendered, and posted short-form clips with zero human intervention.

## Hard-Won Rules (Never Break These)

1. **Always transcribe the reframed clip, never slice the master transcript.** Extraction padding causes timestamp drift — word timings from the source video won't align with the extracted clip.
2. **Re-encode video for frame-accurate cuts at extract.** Stream-copy (`-c copy`) only cuts on keyframes, which drifts timestamps and breaks Phase 6/7 caption alignment. Use `-c:v libx264 -preset ultrafast -crf 18 -c:a copy` for the initial extract — fast enough to feel like stream-copy, but cuts land on the exact requested timestamp. Audio stays stream-copy.
3. **Always log phase timings to pipeline-log.md.** Every phase records `date +%s` bookends. The timing summary table is written after the final phase.
4. **Groq has a 25MB file limit.** For videos >15 min, use `-q:a 8` (not `-q:a 4`) on the first MP3 encode to avoid a wasted double-encode. Always probe duration first. If still over 25MB, chunk and merge.
5. **Provider selection is read once in Phase 3.** Don't re-read config mid-phase. Resolve `"auto"` to a concrete provider at the start of the phase.
6. **Always source `.env` before using API keys.** Phases that call external APIs (Groq, Zernio) must `set -a && source "$WORKSPACE_DIR/.env" && set +a` before any subprocess that reads environment variables. Python heredocs do NOT inherit shell variables unless they are exported.

---

## Setup

Reframe needs Python deps (opencv-python, numpy, scipy in `projects/tools/.venv`) and transcription needs `uv`. Both are **auto-installed on the first invocation** by Phase 0 (ONBOARD) — see `references/phase-0-onboard.md` → "Auto-trigger setup scripts on first run". The student doesn't need to run anything manually.

To re-setup or fix a broken venv manually:

```bash
bash .claude/skills/00-longform-to-shortform/scripts/setup.sh        # reframe deps
bash .claude/skills/tool-transcription/scripts/setup.sh              # uv for transcription
```

Heavy transcription deps (whisperx + torch, ~1.5GB) stay lazy via `uv run` — they download on the first Phase 3 call when no `GROQ_API_KEY` is set.

## Sub-Agent Dispatch

| Phase | Sub-Agent | Agent File | What to pass | What comes back |
|-------|-----------|------------|-------------|-----------------|
| 8 (POST) | Content Packager | `.claude/agents/l2s-content-packager.md` | Rendered clip paths, publishing mode, platform list | Post URLs or draft URLs |

Dispatch using the Agent tool with the agent name (`l2s-content-packager`). Pass clip metadata in the prompt.

## Input

The user provides ONE argument: a YouTube URL or a local video file path.

```
/00-longform-to-shortform https://youtube.com/watch?v=...
/00-longform-to-shortform /path/to/local/video.mp4
```

## Configuration

Config files:
- Pipeline: `.claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml`
- Reframe tool: `.claude/skills/00-longform-to-shortform/skill-pack/tools/reframe/` (constants in each layout module)

All settings come from `.claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml` in the workspace. Read it at the start and use its values throughout. Also read `sys-config.md` — **precedence:** `sys-config.md` overrides `pipeline.config.yaml`. Apply pipeline.config.yaml first, then layer sys-config.md values on top. If the file doesn't exist, use these defaults:
- format: `9x16`, layout: `split-screen`, whisper_model: `small`
- max_clips: `5`, min_clips: `2`, min_score: `65`, duration_range: `[45, 90]`
- renderer: `hyperframes`
- theme: `orange`, style: `default`, illustration_style: `flat`, overlay_background: `solid-white`
- publishing mode: `draft`, profile: `default`
- parallel_edits: `3`

## Pipeline Log

Create `runs/{run-dir}/pipeline-log.md` at the start. Append timestamped entries as each phase completes. This is the run's audit trail.

---

## Phase 0: ONBOARD (first run only)

See `references/phase-0-onboard.md` for full onboarding instructions.

---

## Phase 1: CONFIG (every run)

Runs on every invocation (including first run after onboarding completes).

1. Read `pipeline.config.yaml` and `.claude/skills/00-longform-to-shortform/skill-pack/config/sys-config.md`
2. Derive the run name: `YYYY-MM-DD-{sanitized-title}` — used for both `renders/{run}/` and `runs/{run}/`

---

## Pipeline Phase Summary

| Phase | Name | Key Action | Reference |
|-------|------|------------|-----------|
| 0 | ONBOARD | First-run only: explain, check deps, present choices, install, save config | `references/phase-0-onboard.md` |
| 1 | CONFIG | Read config, derive run name, apply theme | This file (above) |
| 2 | DOWNLOAD | yt-dlp or local copy | `references/phase-2-download.md` |
| 3 | TRANSCRIBE | WhisperX or Groq API -> SRT | `references/phase-3-transcribe.md` |
| 4 | SELECT | 5-category scoring, clip_candidates.json. Pass `duration_range` from config to clip selection — clips outside this window are discarded. See `vid-clip-selection` selection-framework.md | `references/phase-4-select.md` |
| 5 | AUTO-APPROVE | Filter by min_score, clip_definitions.json | `references/phase-5-approve.md` |
| 6 | REFRAME | Parallel extract + reframe clips | `references/phase-6-reframe.md` |
| 7 | EDIT+RENDER | HyperFrames HTML+GSAP composition (default) or FFmpeg ASS subtitles (fallback) | `references/phase-7-edit.md` |
| 8 | POST | Zernio draft/auto-post per config | `references/phase-8-post.md` |

See individual `references/phase-N-*.md` files for full phase instructions with code blocks.

---

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `viz-hyperframes` | Optional | HTML+CSS+GSAP renderer for Phase 7 (`editing.renderer: "hyperframes"`) | FFmpeg renderer (default) handles all editing |

## Error Handling

- **Phase fails:** Log the error in `pipeline-log.md`, attempt to continue with remaining clips
- **All clips fail reframe:** Stop pipeline, report error
- **All clips fail editing:** Stop pipeline, report error
- **Single clip fails:** Skip it, continue with others, note in log
- **Network error (download/post):** Retry once after 5s, then fail with message

## Output Summary

When the pipeline completes:

1. **Print file paths of rendered clips.**

2. **Print a summary:**
   ```
   Pipeline Complete
   -----------------
   Source: {video_title}
   Clips produced: N of M candidates
   Rendered: N files in projects/{skill-name}/renders/{run_dir}/
   Published: {mode} -- {platform_count} platforms

   Clips:
     1. {title} (score: {score}) -- {path}
     2. {title} (score: {score}) -- {path}
     ...

   Log: projects/{skill-name}/runs/{run_dir}/pipeline-log.md
   ```

---

## References

| File | Purpose |
|------|---------|
| `references/phase-2-download.md` | Phase 2: download via yt-dlp or local copy |
| `references/phase-3-transcribe.md` | Phase 3: transcription (Groq API or local WhisperX) |
| `references/phase-4-select.md` | Phase 4: clip selection with 5-category scoring |
| `references/phase-5-approve.md` | Phase 5: auto-approve filtering |
| `references/phase-6-reframe.md` | Phase 6: parallel clip extraction + reframing |
| `references/phase-7-edit.md` | Phase 7: edit+render (HyperFrames default, FFmpeg fallback) |
| `references/hyperframes-composition.md` | HyperFrames HTML composition template for L2S clips |
| `references/phase-8-post.md` | Phase 8: posting + timing summary |
| `references/conventions.md` | File naming, paths, and output directory conventions |
| `.claude/agents/l2s-content-packager.md` | Phase 8 posting agent definition |
| `README.md` | User-facing documentation (About, Features, Use Cases, Pipeline diagram) |
