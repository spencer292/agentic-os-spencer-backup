# Onboarding — Video Pipeline

## What This Does

Takes a YouTube URL (or local video file) and produces fully edited short-form clips — captioned, branded, reframed to portrait — then posts them to your social platforms. After the first-run setup below, every subsequent run is fully automated with zero human-in-the-loop.

## Inputs

| Input | Required | Example |
|-------|----------|---------|
| YouTube URL | Either this or local path | `https://youtube.com/watch?v=abc123` |
| Local video file | Either this or URL | `/path/to/video.mp4` |

## Outputs

| What | Where | Format |
|------|-------|--------|
| Rendered clips | `projects/00-longform-to-shortform/renders/{run}/` | MP4 (9:16, 1:1, or 16:9) |
| Pipeline log | `projects/00-longform-to-shortform/runs/{run}/` | Markdown with timing table |
| Social posts | Platform-dependent | Draft URLs or live post URLs |

## How It Works (Phases)

1. **Download** — Gets the video from YouTube or copies your local file
2. **Transcribe** — Converts speech to word-level text (cloud or local, your choice)
3. **Select** — Scores every moment for hook strength, standalone value, emotional resonance, information density, and shareability
4. **Auto-approve** — Filters to the top clips by score threshold
5. **Reframe** — Extracts clips and reformats to your target aspect ratio (split-screen, face-track, or cursor-track)
6. **Edit+Render** — Burns ASS subtitles and PNG illustration overlays via FFmpeg (~55s per clip)
7. **Post** — Creates drafts or publishes directly to YouTube Shorts, Instagram Reels, TikTok

## Checkpoints

**First run only:** Interactive onboarding asks you to choose providers, visual style, and publishing preferences. Takes ~2 minutes.

**Every run:** No pauses. Rendered clips are saved locally. If publishing mode is `draft`, nothing goes live until you approve in Zernio.

## Setup Checklist

### Prerequisites (checked automatically)

| Tool | What it does | Install |
|------|--------------|---------|
| ffmpeg | Video processing (extract, reframe, subtitle burn) | `brew install ffmpeg` |
| Python 3.10+ | Runs transcription & clip extraction | `brew install python` |
| jq | Parses illustration overlay config | `brew install jq` |
| yt-dlp | YouTube downloads | Installed automatically in venv |

### Optional API keys (for enhanced features)

| Key | What it enables | Without it |
|-----|-----------------|------------|
| `GROQ_API_KEY` | Fast cloud transcription (~22s for 60min, $0.04/hr) | Falls back to local WhisperX (15-30min, free) |
| `ZERNIO_API_KEY` | Automated social posting | Pipeline still renders clips, skips posting |

Add keys to `.env` in the project root.

## Configuration Files

After first-run onboarding, your choices live in two places:

```
Pipeline config (technical — clip count, score threshold, parallelism):
  .claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml

Creative preferences (style — captions, colors, branding):
  .claude/skills/00-longform-to-shortform/skill-pack/config/sys-config.md
```

Both files have inline comments documenting every option. Edit them anytime to change defaults for future runs.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| WhisperX fails | Run `./setup.sh` to rebuild the Python venv |
| yt-dlp can't download | Update: `source tools/venv.sh && pip install -U yt-dlp` |
| Groq rejects file | Audio over 25MB — pipeline auto-compresses, but check disk space |
| Subtitles misaligned | Always transcribe the reframed clip, never slice the master transcript |
| jq not found | `brew install jq` — needed for illustration overlay config parsing |
