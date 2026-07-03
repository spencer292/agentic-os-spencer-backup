---
name: tool-video-upload
version: 1.0.0
description: Upload and compress videos for YouTube publishing. Handles local compression via HandBrake and upload to Zernio storage.
allowed-tools:
  - Bash(*)
  - Read
  - Write
---

# Video Upload Helper

Compress and upload videos for YouTube publishing via Zernio.

## Quick Start

User provides: Local video file path
Output: Video URL ready for Zernio publishing (under 500MB)

## API Key
```
$ZERNIO_API_KEY
```

## Size Limit

**IMPORTANT:** Zernio has a 500MB upload limit. All videos must be compressed to under 500MB before uploading.

---

## Workflow

### Step 1: Check Video Size

```bash
du -m "PATH_TO_VIDEO" | cut -f1
```

- If **under 500MB**: Skip to Step 3 (upload directly)
- If **over 500MB**: Proceed to Step 2 (compress)

### Step 2: Compress with HandBrake (Local)

Use HandBrake CLI with NVENC GPU acceleration for fast compression:

```bash
$(command -v HandBrakeCLI || echo "HandBrakeCLI") \
  -i "INPUT_VIDEO_PATH" \
  -o "OUTPUT_VIDEO_PATH" \
  -e nvenc_h264 \
  -q 26 \
  -B 128 \
  --encoder-preset medium \
  -O
```

**Quality Settings (CRF-like):**
| Target Size | Quality (-q) | Use Case |
|-------------|--------------|----------|
| < 200MB | 26-28 | Short videos (<10 min) |
| 200-400MB | 22-24 | Medium videos (10-30 min) |
| 400-500MB | 20-22 | Long videos (high quality) |

**Monitor Progress:**
```bash
tail -1 "OUTPUT_PATH"
```

**Verify Output Size:**
```bash
du -m "OUTPUT_PATH" | cut -f1
```

If still over 500MB, increase quality value (higher = smaller file) and re-compress.

### Step 3: Get Zernio Presigned Upload URL

```bash
curl -s -X POST "https://getlate.dev/api/v1/media/presign" \
  -H "Authorization: Bearer $ZERNIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "video-name.mp4", "contentType": "video/mp4"}'
```

**Response:**
```json
{
  "uploadUrl": "https://late-media.../presigned-url",
  "publicUrl": "https://media.getlate.dev/temp/video-name.mp4"
}
```

### Step 4: Upload to Zernio Storage

```bash
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: video/mp4" \
  --upload-file "COMPRESSED_VIDEO_PATH" \
  --progress-bar
```

The `publicUrl` from Step 3 is now ready to use with mkt-youtube-content-package.

---

## Tool Discovery

The skill auto-discovers tools on your PATH:
- HandBrake: `command -v HandBrakeCLI`
- FFmpeg: `command -v ffmpeg`

---

## FFmpeg Alternative

If HandBrake is unavailable:

```bash
$(command -v ffmpeg) -i "INPUT" -c:v libx264 -crf 26 -preset medium -c:a aac -b:a 128k "OUTPUT"
```

Note: FFmpeg without GPU is slower than HandBrake with NVENC.

---

## Compression Time Estimates (NVENC)

| Original Size | Compressed Size | Time |
|---------------|-----------------|------|
| 500MB | ~200MB | 1-2 min |
| 1GB | ~350MB | 3-4 min |
| 1.5GB+ | ~400MB | 4-6 min |

---

## Integration with YouTube Content Package

After upload completes, the public URL is ready for the full workflow with mkt-youtube-content-package:

```
/mkt-youtube-content-package https://media.getlate.dev/temp/your-video.mp4
```

---

## Troubleshooting

**HandBrake not found:**
```bash
# macOS: brew install handbrake
# Linux: apt install handbrake-cli / dnf install HandBrake-cli
# Windows: winget install HandBrake.HandBrake.CLI
```

**NVENC not available:**
- Requires NVIDIA GPU
- Fall back to `-e x264` (slower but works on any system)

**Upload fails:**
- Check file size is under 500MB
- Presigned URLs expire in 1 hour
- Verify API key is correct
