# Phase 2 — ROUTE

Decide which build path each job takes.

## Decision order

```
if note.path is set:            use it (talking-head | highlight | assembly)
elif (video_count > 1) or (photo_count > 0):   ASSEMBLY
elif speech_ratio >= 0.60:      TALKING-HEAD
else:                           HIGHLIGHT
```

## Speech probe (single-video jobs)

Cheap check before committing to full transcription. Use ffmpeg silence detection to estimate how
much of the clip carries voice:

```bash
ffmpeg -i source/clip.mp4 -af silencedetect=noise=-30dB:d=0.5 -f null - 2>&1 \
  | grep -E "silence_(start|end)"
```

- Sum the silent spans, `speech_ratio = 1 - (silent_seconds / duration)`.
- `>= 0.60` → talking-head (continuous voice — words can drive the cut).
- `< 0.60` → highlight (sparse/no voice — visual peaks drive the cut).

This is an estimate, not transcription. The talking-head path transcribes properly in its own step.

## Fallbacks
- Talking-head forced by `note.path` but speech probe finds almost no voice → swap to highlight,
  log the swap, continue.
- Assembly with exactly one video and no photos but `note.path: assembly` → honour it (user may want
  the music/overlay treatment on a single clip).

Write the chosen path to `run-log.md`, then dispatch to the matching `path-*.md`.
