---
name: tool-transcription
version: 1.1.1
description: >
  Transcribe local video or audio files using WhisperX. Two output modes:
  clean markdown (default — for content pipelines) or word-level JSON
  (for subtitling and video editing).
  Use when the user provides a local file path to a video or audio file.
  Supports MP4, MOV, WebM, MKV, AVI, MP3, WAV, M4A, FLAC, OGG.
  Triggers on: "this video", "my video", "local video", "transcribe this file",
  "from this recording", "from this file", "transcript", "transcribe",
  "speech to text", "video to text", "extract captions".
  Does NOT trigger for YouTube URLs or other web URLs — those use
  tool-youtube or tool-web-screenshot.
---

# Tool: Transcription

Transcribes local video/audio files using **WhisperX** with word-level
alignment. Two output modes:

| Mode | Output file | Use case |
|---|---|---|
| `markdown` (default) | `.md` with frontmatter + clean text | Content pipelines (`/00-social-content`, `/00-youtube-to-ebook`). Just the text. |
| `words-json` | `.json` with `words: [{start, end, word}, ...]` | Subtitling / clip selection (`/00-longform-to-shortform`, `/vid-clip-selection`, `/vid-ffmpeg-edit`). |

## Setup (run once)

```bash
bash .claude/skills/tool-transcription/scripts/setup.sh
```

Installs `uv` and `ffmpeg`. WhisperX + torch (~1.5GB) auto-download via
`uv run` on the first transcription.

## Usage

### Clean markdown (content pipelines)

```bash
uv run .claude/skills/tool-transcription/scripts/transcribe.py \
  --file "{FILE_PATH}" \
  --language en
```

Default `--output=markdown`. Writes `{output_base}/{date}/logs/inspiration/{slug}.md`:

```yaml
---
source_type: local_video
source_path: /path/to/video.mp4
transcribed_at: 2026-05-09
model: small
language: en
---

## Transcript

{full transcript text, clean}
```

### Word-level JSON (subtitling / video editing)

```bash
uv run .claude/skills/tool-transcription/scripts/transcribe.py \
  --file "{FILE_PATH}" \
  --language en \
  --output words-json
```

Writes `{output_base}/{date}/transcripts/{slug}.json`:

```json
{
  "words": [
    { "start": 0.0, "end": 0.5, "word": "Hello" },
    { "start": 0.5, "end": 1.0, "word": "world." }
  ],
  "meta": {
    "source_type": "local_video",
    "source_path": "/path/to/video.mp4",
    "transcribed_at": "2026-05-09",
    "model": "small",
    "language": "en"
  }
}
```

To convert that JSON to ASS subtitles for FFmpeg, use the
`words_to_ass.py` helper bundled with `00-longform-to-shortform`:

```bash
python3 .claude/skills/00-longform-to-shortform/skill-pack/tools/words_to_ass.py \
  transcript.json output.ass
```

## Options

| Arg | Default | Description |
|-----|---------|-------------|
| `--file` | required | Absolute or relative path to the video/audio file. |
| `--output` | `markdown` | `markdown` or `words-json`. |
| `--model` | `small` | `tiny` / `base` / `small` / `medium` / `large-v3`. |
| `--language` | auto-detect | Language code (`pt`, `en`, etc.) — set explicitly for better accuracy. |
| `--device` | `cpu` | `cpu` or `cuda` (GPU — much faster on long videos). |
| `--batch-size` | `16` | Higher batch sizes are faster on GPU; reduce on low-memory CPUs. |
| `--output-dir` | resolved by mode | Override the destination folder. |

### Default output directories

When `--output-dir` isn't passed:

- `--output=markdown` → `projects/00-social-content/{YYYY-MM-DD}/logs/inspiration/`
- `--output=words-json` → `projects/00-longform-to-shortform/{YYYY-MM-DD}/transcripts/`

A caller invoking from an orchestrator should pass `--output-dir` explicitly
so output lands inside the run's folder.

### Model selection

| Model | Speed | Accuracy | Use when |
|-------|-------|----------|----------|
| `tiny` | Fastest | Basic | Quick preview |
| `base` | Fast | Good | Short clips < 5 min |
| `small` | Balanced | Very good | Default — most cases |
| `medium` | Slower | Excellent | Critical accuracy |
| `large-v3` | Slowest | Best | Non-English, production |

## Supported Formats

Video: MP4, MOV, WebM, MKV, AVI
Audio: MP3, WAV, M4A, FLAC, OGG
