---
name: tool-youtube
version: 1.0.1
description: >
  Fetch latest videos from YouTube channels, extract full transcripts, and
  pull video metadata/thumbnails. Three modes: channel mode (list recent
  uploads, needs YOUTUBE_API_KEY), transcript mode (get full timestamped
  transcript from a URL, free via yt-dlp), and metadata mode (get title,
  duration, stats, thumbnail via yt-dlp).
  Triggers on: "latest youtube video", "get transcript", "youtube transcript",
  "what did they post", "fetch from youtube", "channel updates",
  "video metadata", "get video info", "youtube thumbnail", "video details",
  "video stats".
  Used by other skills as a content source.
  Does NOT trigger for content creation, repurposing, or video editing.
---

# YouTube Tool

Utility skill for getting content out of YouTube. Three scripts, three jobs:


## Paths

Read `skill-pack/config/sys-config.md` → `## Paths` section before any path-dependent step. It resolves `{decoupled_base}`, `{env_file}`, `{brand_context}`, and `{projects_base}` to absolute paths set by the installer. Substitute these placeholders wherever they appear below.

- **Channel mode** — find out what someone posted recently, list their latest videos
- **Transcript mode** — pull the full text from a specific video
- **Metadata mode** — get video info (title, duration, stats, tags) and/or download the thumbnail

Chain them together: find the latest video from a channel, then pull its transcript. Other skills (like `mkt-content-repurposing`) use this as a content source.

## Outcome

YouTube video metadata and/or full transcripts saved to `{projects_base}/tool-youtube/{YYYY-MM-DD}/{video-title-slug}.md`. Always save output to disk. This is not optional.

## Context Needs

None. This skill doesn't read brand context.

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## tool-youtube` section | Known issues, channel quirks |

## Dependencies

None — this is a base utility. Other skills depend on this one.

| Service | Key | Required For | Without It |
|---------|-----|-------------|------------|
| YouTube Data API v3 | `YOUTUBE_API_KEY` | Channel mode (listing videos, resolving @handles, search) | Can't list channel videos. Transcript mode still works if you have the URL. |

Get a key at https://console.cloud.google.com/ (free tier is generous — 10,000 units/day).

## Step 0: Auto-Setup (runs once)

Before doing anything else, check if the required binaries exist. If either is missing, run the setup script — it detects what's missing and installs it automatically.

```bash
bash .claude/skills/tool-youtube/scripts/setup.sh
```

This installs `uv` (for digest.py's inline dependencies) and `yt-dlp` (for transcript extraction). Uses `brew` on macOS, falls back to `curl`/`pip` otherwise. Only needs to run once per machine — skip on subsequent calls if both binaries exist.

## Step 1: Determine the Request Type

| Request | What to do |
|---------|------------|
| "Latest videos from [channel]" | Channel mode — use digest script (Step 2) |
| "Metadata for [URL]", "video info", "video stats" | Metadata mode — use metadata script (Step 3) |
| "Thumbnail from [URL]", "youtube thumbnail" | Metadata mode with `--thumbnail` (Step 3) |
| "Transcript of [URL]" | Transcript mode — use transcript script (Step 4) |
| "Latest video transcript from [channel]" | Chain: Step 2 then Step 4 |
| Another skill needs content | Provide the appropriate script output |

## Step 2: Channel Mode

Use the digest script to list recent uploads.

```bash
uv run .claude/skills/tool-youtube/scripts/digest.py --channels "@handle" --hours 48 --max-videos 5
```

This lists recent uploads with titles, dates, and URLs. Add `--transcript` to get a basic summary of each.

**Needs:** `YOUTUBE_API_KEY` in `{env_file}`. If missing, tell the user what it does and how to get one. Don't block — ask them to provide a video URL directly as the fallback.

**Script options:**

| Option | Default | What it does |
|--------|---------|-------------|
| `--channels` | — | Comma-separated @handles |
| `--search` | — | Comma-separated search queries |
| `--hours` | 48 | How far back to look |
| `--max-videos` | 10 | Cap on videos returned |
| `--transcript` | off | Include basic transcript summaries |
| `--output` | markdown | `markdown` or `json` |
| `--seen-file` | — | Track already-processed videos |
| `--api-key` | env var | Override YOUTUBE_API_KEY |

### Channel sources file (skip `--channels` when set)

When the user wants to track the same set of channels every time, populate `tool-youtube/config/sources.md` once instead of passing `--channels` on every run. The script reads that file automatically when `--channels` is not provided.

Format (see `tool-youtube/config/README.md` for the full spec):

```markdown
# Inspiration Sources

## YouTube Channels

- @fireship
- @lexfridman
- UCxxxxxxxxxxxxxxxxxxxxxxxx
```

One handle per line, prefixed with `- @`. Channel IDs (24-char `UC...`) work too. If the user mentions following a channel during the conversation, offer to add it to `sources.md` so they don't have to re-pass it later.

## Step 3: Metadata Mode

Use the metadata script to fetch video info and/or download the thumbnail.

```bash
python .claude/skills/tool-youtube/scripts/metadata.py "https://youtube.com/watch?v=VIDEO_ID" --output-dir /tmp
```

Add `--thumbnail` to also download the thumbnail as PNG. Use `--thumbnail --no-metadata` for thumbnail-only.

**Script options:**

| Option | Default | What it does |
|--------|---------|-------------|
| `--output-dir` | `.` | Where to save files |
| `--thumbnail` | off | Also download thumbnail PNG |
| `--no-metadata` | off | Skip metadata JSON (thumbnail-only mode) |
| `--check-setup` | — | Verify yt-dlp is installed |

**Output:** `metadata.json` with title, channel, duration, stats, tags, resolution, and more. `thumbnail.png` when `--thumbnail` is used.

No API key needed — yt-dlp handles it.

## Step 4: Transcript Mode

Use the transcript script for full text with timestamps.

```bash
python .claude/skills/tool-youtube/scripts/transcript.py "https://youtube.com/watch?v=VIDEO_ID" --output-dir /tmp
```

Then read the output file. No API key needed — yt-dlp handles it.

**Script options:**

| Option | Default | What it does |
|--------|---------|-------------|
| `--lang` | en | Language code |
| `--format` | md | `md` (timestamped markdown) or `vtt` |
| `--output-dir` | . | Where to save the file |
| `--auto-only` | off | Only auto-generated subs |
| `--list` | — | List available subtitle tracks |
| `--check-setup` | — | Verify yt-dlp is installed |

## Step 5: Save Output

**Always save the transcript to the projects folder.** After extracting, create a clean version at `{projects_base}/tool-youtube/{YYYY-MM-DD}/{video-title-slug}.md`. The saved file format:

```
# {Video Title}

Source: {YouTube URL}
Channel: {channel name if known}
Date extracted: {YYYY-MM-DD}

## Key Points

- {3-5 most important points from the video}

## Transcript

{Full transcript text with all timestamps removed — clean readable paragraphs only}
```

Strip all `**[HH:MM:SS]**` timestamps from the raw transcript before saving. The saved file should read like a document, not a subtitle track. Create the folder if it doesn't exist.

## Step 6: Collect Feedback

If used standalone, ask: "Got the transcript. Anything else you need from this video or channel?"

Log feedback to `context/learnings.md` → `## tool-youtube`.

---

## Rules

*Updated automatically when the user flags issues. Read before every run.*

---

## Self-Update

If the user flags an issue — wrong channel, bad transcript, missing data — update the `## Rules` section immediately with the correction and today's date.

---

## Troubleshooting

- **Setup script fails**: If `brew` isn't available, the script falls back to `curl` (for uv) and `pip` (for yt-dlp). If both fail, tell the user to install manually.
- **No API key**: Channel listing won't work. Transcript mode still works with direct URLs. Tell the user how to get a key and offer the URL fallback.
- **yt-dlp not installed**: Run `bash .claude/skills/tool-youtube/scripts/setup.sh` — it auto-installs. If that fails, `brew install yt-dlp` manually.
- **No transcripts available**: Some videos don't have captions. The script will say so. Suggest the user paste a transcript manually.
- **Channel not found**: The @handle might be wrong, or the channel might be very new. Try searching by name instead of handle.
