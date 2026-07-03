---
name: 00-video-studio
version: 0.2.0
description: "Drop-and-review personal-brand video studio: pulls video/photos from the Studio Drive Inbox, auto-routes (talking-head/highlight/assembly), cuts a 9:16 clip held in Review for approval. Triggers: 'process studio inbox', 'studio video', 'make a clip from', 'turn this footage into a reel', 'video studio', 'process my drops'. Not for YouTube-URL automation or podcasts."
argument-hint: inbox_folder_name_or_drive_id (optional)
allowed-tools:
  - Bash(*)
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
  - mcp__claude_ai_Google_Drive__search_files
  - mcp__claude_ai_Google_Drive__download_file_content
  - mcp__claude_ai_Google_Drive__create_file
  - mcp__claude_ai_Google_Drive__get_file_metadata
  - mcp__zernio__*
dependencies:
  - tool-transcription
  - vid-ffmpeg-edit
optional-dependencies:
  - tool-zernio-social
  - mkt-brand-voice
  - mkt-visual-identity
metadata:
  category: video-production
  phase: orchestrator
  drive_root: "31_Studio"
---

# Video Studio Orchestrator

Personal-brand video lane. You drop a video — or a whole folder of clips and photos — into the
Studio Drive Inbox. The studio figures out what kind of content it is, cuts it into a
production-ready 9:16 clip, and parks the result in `3_Review` for your eyes before anything posts.

This reuses the render core from `00-longform-to-shortform` (the `reframe` CLI + caption burner) and
adds the new **highlight** and **assembly** paths that speech-only pipelines never needed.

## Hard-Won Rules (Never Break These)

1. **Drop & review is the contract.** Nothing ever posts straight from `1_inbox`. Every finished
   clip lands in `3_Review/`. Posting only happens when the user drags a clip to `4_Approved/`
   (handled by Phase 6, run separately).
2. **One Inbox subfolder = one job.** Treat everything inside a single `1_inbox/{job}/` folder as one
   piece of content. Never merge two job folders. Never split one.
3. **Re-encode on extract for frame accuracy.** Use `-c:v libx264 -preset ultrafast -crf 18 -c:a copy`
   for cuts — stream-copy drifts timestamps and breaks caption alignment (inherited L2S rule).
4. **Transcribe the reframed clip, never the master.** Padding shifts word timings (inherited L2S rule).
5. **Read the job's `note.txt` first.** It is the user's brief — honour duration, mood, and tags.
   No note = sensible defaults from `studio.config.yaml`.
6. **Never overwrite the source.** Originals are copied to `2_processing/{job}/source/` and left intact.

---

## Setup

The highlight path needs OpenCV + numpy (shared with the L2S reframe venv at `projects/tools/.venv`),
and transcription needs `uv`. Both auto-install on first run:

```bash
bash .claude/skills/00-video-studio/scripts/setup.sh
```

## Input

Optional argument: a specific Inbox job folder name (e.g. `spencer-racing`). With no argument, process
every job folder currently in `1_inbox/`.

```
/00-video-studio                 # process all pending jobs in 1_inbox
/00-video-studio spencer-racing  # process one job
```

## Configuration

All settings come from `.claude/skills/00-video-studio/skill-pack/config/studio.config.yaml`. Read it
at the start. If missing, use the defaults documented in that file's header.

## Run Log

Create `projects/00-video-studio/runs/{YYYY-MM-DD}_{job}/run-log.md` at the start of each job. Append
a timestamped entry per phase. This is the audit trail.

---

## Pipeline Phase Summary

| Phase | Name | Key Action | Reference |
|-------|------|------------|-----------|
| 0 | ONBOARD | First run only: check deps, seed personal brand from the first videos, confirm Drive IDs | `references/phase-0-onboard.md` |
| 1 | INTAKE | List `1_inbox/` jobs, pull each job's files to `2_processing/{job}/source/`, read `note.txt` | `references/phase-1-intake.md` |
| 2 | ROUTE | Classify each job: talking-head / highlight / assembly (decision rules below) | `references/phase-2-route.md` |
| 3 | BUILD | Run the path-specific build (cut → reframe → caption / select → assemble → music) | `references/path-talking-head.md`, `references/path-highlight.md`, `references/path-assembly.md` |
| 4 | QC | Probe output: 1080×1920, duration in range, audio present, no black seam | `references/phase-4-qc.md` |
| 5 | REVIEW | Upload finished clip + a contact sheet to `3_Review/{job}/`, write a one-line summary | `references/phase-5-review.md` |
| 6 | POST | Separate run: watch `4_Approved/`, package per platform, post via Zernio, archive to `5_Posted/` | `references/phase-6-post.md` |

Phases 0–5 run on `/00-video-studio`. Phase 6 runs on its own (cron or manual) so approval stays human.

---

## Phase 2 — Routing Decision Rules

For each job folder, decide the path in this order:

1. **Assembly** — if the job folder contains **more than one video**, OR contains **any image files**
   (`.jpg/.jpeg/.png/.heic`) alongside video. Multiple assets → one assembled reel.
2. **Talking-head** — single video, and a quick speech probe (`references/phase-2-route.md`) finds
   **continuous speech** (≥ ~60% of the clip has words). Speech tells us where the good bits are.
3. **Highlight** — single video, low/no speech. Visual peaks (motion + audio energy + scene cuts) drive
   the cut. This is the racing-footage default.

A `note.txt` line `path: highlight|talking-head|assembly` overrides the auto-decision.
The "build for either" racing case is handled inside the assembly path: if the assembled clips contain
strong narration it keeps voice + burns captions; if not, it cuts to music.

---

## Phase 3 — Build (path dispatch)

| Path | What it does | Reference |
|------|--------------|-----------|
| talking-head | Transcribe → score punchy lines (reuse `vid-clip-selection`) → extract → `reframe --layout stacked` → burn kinetic captions | `references/path-talking-head.md` |
| highlight | `scripts/highlight_select.py` ranks segments by motion + audio energy + scene cuts → extract top picks → reframe → beat-sync to music from `6_Assets/` → text overlays from `note.txt` | `references/path-highlight.md` |
| assembly | Run highlight selection across all clips, interleave photos as Ken-Burns stills, concatenate with crossfades, add music, optional captions if narration present | `references/path-assembly.md` |

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-transcription` | Required (talking-head) | WhisperX/Groq transcription for speech-driven cuts | Talking-head path can't run; highlight/assembly unaffected |
| `vid-ffmpeg-edit` | Required | Caption burn-in + progress bar render | No captions; raw reframed clip only |
| `tool-zernio-social` | Optional | Posting from `4_Approved/` in Phase 6 | Clips package but don't post — manual upload |
| `mkt-brand-voice` | Optional | Personal voice-profile for caption tone | Generic clean captions |
| `mkt-visual-identity` | Optional | Personal fonts/colours for captions + overlays | Default styling |

## Error Handling

- **One job fails:** log it, leave its source in `2_processing/{job}/`, continue to the next job.
- **One clip in an assembly fails:** drop it, continue with the rest, note in the run log.
- **Drive download/upload error:** retry once after 5s, then fail that job with a clear message.
- **No speech detected on a talking-head override:** fall back to highlight path, note the swap.

## References

| File | Purpose |
|------|---------|
| `references/phase-0-onboard.md` | First-run setup, brand seed, Drive ID capture |
| `references/phase-1-intake.md` | Listing jobs + pulling files from Drive |
| `references/phase-2-route.md` | Speech probe + routing logic |
| `references/path-talking-head.md` | Speech-driven clip build |
| `references/path-highlight.md` | Action/B-roll highlight build |
| `references/path-assembly.md` | Multi-clip + photo reel build |
| `references/phase-4-qc.md` | Output quality checks |
| `references/phase-5-review.md` | Upload to Review + summary |
| `references/phase-6-post.md` | Approval watch + posting + archive + flipping drafts live (`scripts/zernio_publish.cjs`) |
| `references/proven-pipeline.md` | **START HERE** — the actual working flow + scripts + env gotchas (validated 2026-06-14) |
| `references/brand-overlay.md` | Brand overlay convention (`brand_overlay.py`) — BN Dime Display title + Night Sky end card. Always applied. |
| `references/drive-ids.md` | Cached Drive folder IDs for 31_Studio |
| `README.md` | User-facing documentation |
