---
name: vid-condensed-edit
version: 1.0.0
description: "Produce a condensed 10-15 minute 'best bits' YouTube edit from a long-form podcast episode (gallery video + word-level transcript). Cold-open hook, best segments in original order, sentence-boundary cuts, YouTube chapters, title candidates, and a thumbnail contact sheet. Triggers: 'condensed edit', 'best bits edit', 'highlight episode', 'condensed YouTube version', 'short version of the episode', 'cut this episode down for YouTube'. Does NOT trigger for vertical Shorts (use 00-longform-to-shortform), single clip extraction (vid-clip-extractor), or caption work (vid-ffmpeg-edit)."
argument-hint: video_path [transcript_json_path]
dependencies:
  - tool-transcription   # optional — only when no word-level transcript exists
metadata:
  category: video-production
  phase: execution
---

# Condensed Edit — Long-Form Episode → 10–15 min YouTube Asset

Full episodes underperform on YouTube; a condensed best-bits edit is the channel's
main long-form asset (see `references/methodology.md` for the evidence base and
all editorial rules). This skill turns a 30–90 min episode into a 10–15 minute
edit with a cold-open hook.

## Inputs

1. **Video** — 16:9 episode video (Zoom gallery view MP4 is the normal case)
2. **Transcript** — word-level JSON `{words: [{start, end, word}]}`.
   - Pipeline runs usually have one at `projects/00-longform-to-shortform/runs/{run}/`
   - If missing: invoke `tool-transcription` (word timestamps required)

## Phases

### 1. PREP
- `ffprobe` the video (duration, resolution, fps)
- Load the words JSON; reconstruct readable, timestamped paragraphs

### 2. EDITORIAL (LLM judgment — read methodology.md first)
- Split into candidate segments (60s–4min, self-contained beats)
- Score each per the methodology weights; apply content gates
- Select chronological segments totalling **9–14 min**, plus ONE cold-open
  moment (20–40s, the single strongest hook — it may repeat later in context)
- Snap all cut points to sentence boundaries per the cut-hygiene rules
- Write `cutlist.json`:
  ```json
  {
    "cold_open": {"start": 123.45, "end": 151.2, "label": "hook"},
    "segments": [{"start": 60.1, "end": 245.8, "label": "Chapter title"}]
  }
  ```

### 3. RENDER
```bash
python .claude/skills/vid-condensed-edit/scripts/render_cut.py \
  --video <src.mp4> --cutlist <cutlist.json> --out <condensed.mp4>
```

### 3b. BRAND COMPOSE (Zoom gallery sources — standard for YouTube)
Raw Zoom two-up has dead black bars; recompose onto the branded 1080p canvas:
```bash
python .claude/skills/vid-condensed-edit/scripts/compose_two_up.py \
  --video <condensed.mp4> --out <condensed-branded.mp4> \
  --title "<episode title>" --left-name "<host>" --right-name "<guest>" \
  --logo "brand_context/Branding/ALL THE POWER LOGO/PNG/ALL THE POWER LOGO-22.png"
```
Logo: variant **-22** = icon mark, Sky/light (Roy-approved 2026-06-11; wordmark
variants render fuzzy at strap size — use the icon).
Render a `--preview <sec>` PNG first and eyeball it (tile crop alignment varies
if Zoom layout differs — tune `--geometry`). The branded file is the YouTube
upload asset. v2 (planned): speaker-switching singles driven by AssemblyAI
utterances once 1080p source recordings flow from P02.

### 4. PACKAGE
- `chapters.txt` — YouTube chapter list (first line `00:00`, one per segment)
- `metadata.md` — 5 title candidates (≤60 chars), description opening (first
  150 chars = hook + keyword), 3–4 word thumbnail text candidates
- Thumbnail contact sheet (NEVER auto-pick the frame — Roy chooses):
```bash
python .claude/skills/vid-condensed-edit/scripts/contact_sheet.py \
  --video <condensed.mp4> --count 12 --out <thumbs/>
```

### 5. REVIEW GATE
Present: rendered file path, duration, chapter list, titles. The user reviews
the cut before anything is uploaded (P06 YouTube publishing is a separate step).

## Outputs

`projects/vid-condensed-edit/{YYYY-MM-DD}_{episode-slug}/`
- `cutlist.json`, `condensed.mp4`, `chapters.txt`, `metadata.md`, `thumbs/`

## Rules

- Re-encode at cut points (`libx264 -crf 18`) — never stream-copy; keyframe
  drift breaks sentence-boundary cuts (same lesson as the shorts pipeline)
- Chronological order always; the cold open is the only out-of-order element
- When the transcript and audio disagree (rough word timings), pad cuts wider,
  never tighter
- Log learnings to `context/learnings.md` → `## vid-condensed-edit`
