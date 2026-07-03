# Long-Form to Short-Form Video Pipeline

Fully automated content repurposing engine: YouTube URL in, platform-ready short-form clips out.

## About

Transforms long-form videos into edited, rendered, and published short-form clips. Handles the entire workflow from YouTube URL to Shorts, Reels, and TikToks — downloading the source, transcribing with word-level timestamps, scoring and selecting the strongest moments, intelligently reframing from 16:9 to 9:16 with face tracking, burning ASS subtitles and illustration overlays via FFmpeg, and posting to social platforms.

## Key Features

- Word-level transcription with WhisperX for precise animated captions
- AI-powered clip selection scoring across 5 engagement categories
- Intelligent face-tracking reframe from landscape to portrait
- FFmpeg-native subtitle burning with phrase highlighting (~55s per clip)
- Optional PNG illustration overlays at key visual moments
- Parallel FFmpeg processing — multiple clips edited simultaneously
- Automated social posting via Zernio (YouTube Shorts, Instagram Reels, TikTok)
- Full pipeline audit trail with timestamped logs per run

## Pipeline Flow

```
INPUT: YouTube URL or local .mp4 file
  |
  v
[1. CONFIG] -> [2. DOWNLOAD] -> [3. TRANSCRIBE] -> [4. SELECT] -> [5. AUTO-APPROVE]
  |
  v
[6. REFRAME (16:9 -> 9:16)] -> [7. EDIT+RENDER (FFmpeg subtitle burn + illustrations)]
  |
  v
[8. POST (YouTube Shorts, Instagram Reels, TikTok)]
  |
  v
OUTPUT: Rendered clips in renders/{run}/ + pipeline log
```

## Output Structure

```
projects/00-longform-to-shortform/
├── renders/YYYY-MM-DD-title/       <- The finished videos
│   ├── clip-1-hook-about-ai.mp4
│   ├── clip-2-growth-story.mp4
│   └── clip-3-founder-advice.mp4
├── runs/YYYY-MM-DD-title/          <- Pipeline working data
│   ├── source.mp4
│   ├── transcript.srt
│   ├── clip_candidates.json
│   ├── clip_definitions.json
│   ├── clips/
│   │   ├── clip-1.mp4              <- Reframed clip
│   │   ├── clip-1.ass              <- Generated subtitles
│   │   └── clip-1-moments.json     <- Illustration timing config
│   └── pipeline-log.md
├── audio/
└── logos/
```

## File Conventions

| Type | Location |
|------|----------|
| Renders | `projects/00-longform-to-shortform/renders/YYYY-MM-DD-title/` |
| Run data | `projects/00-longform-to-shortform/runs/YYYY-MM-DD-title/` |
| Audio/SFX | `projects/00-longform-to-shortform/audio/` |
| Logos | `projects/00-longform-to-shortform/logos/` |

**Video specs:** 30 FPS | Portrait: 1080x1920 | Landscape: 1920x1080

## Configuration

| Config | Location |
|--------|----------|
| Pipeline settings | `.claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml` |
| Operational prefs | `.claude/skills/00-longform-to-shortform/skill-pack/config/sys-config.md` |
| Clip extractor | `tools/clip_extractor/config.yaml` |

### Defaults (when no config exists)

- format: `9x16`, layout: `split-screen`, whisper_model: `small`
- max_clips: `5`, min_clips: `2`, min_score: `65`, duration: `[45, 90]`
- subtitle_font: `Montserrat`, subtitle_size: `48`, highlight_color: auto from design-tokens
- illustrations: `true`, illustration_count: `4`
- publishing mode: `draft`, profile: `default`
- parallel_edits: `3`

## Usage

```
/00-longform-to-shortform https://youtube.com/watch?v=...
/00-longform-to-shortform /path/to/local/video.mp4
```
