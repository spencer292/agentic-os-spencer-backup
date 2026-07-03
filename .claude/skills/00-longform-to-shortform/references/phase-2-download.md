# Phase 2: DOWNLOAD

Determine if input is a URL or local path.

**Important:** All commands run from the repo root (where `tools/` lives). Run working data goes to `projects/{skill-name}/runs/`.

**If YouTube URL:**
```bash
PHASE_START=$(date +%s)

source projects/tools/venv.sh
yt-dlp -f "bestvideo[height>=2160][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio" \
  --merge-output-format mp4 \
  -o "projects/{skill-name}/runs/$(date +%Y-%m-%d)-TITLE/source.mp4" \
  "YOUTUBE_URL"

# CRITICAL: After download, verify resolution with ffprobe.
# If below 1080p, STOP and re-download — never proceed with <1080p source.
# The format string prefers 4K > 1080p > best available.

PHASE_END=$(date +%s)
echo "Phase 2 DOWNLOAD: $((PHASE_END - PHASE_START))s" >> "$RUN_DIR/phase-timings.txt"
```

Sanitize the video title for the directory name (lowercase, hyphens, no special chars). Extract the title first with `yt-dlp --get-title`.

If `yt-dlp` is globally available, venv activation is optional for download.

## Structured metadata capture (YouTube URLs)

After download, extract structured metadata for downstream phases (speaker cards, CTA):

```bash
# Extract metadata as JSON
yt-dlp --print '{"title":"%(title)s","channel":"%(channel)s","channel_handle":"%(uploader_id)s","thumbnail_url":"%(thumbnail)s","duration":%(duration)s}' "YOUTUBE_URL" > "$RUN_DIR/run-metadata.json"

# Download thumbnail image
yt-dlp --write-thumbnail --skip-download --convert-thumbnails png -o "$RUN_DIR/thumbnail" "YOUTUBE_URL"
# Produces $RUN_DIR/thumbnail.png
```

This creates `run-metadata.json` with fields: `title`, `channel`, `channel_handle`, `thumbnail_url`, `duration`. The thumbnail PNG is used for end-screen CTA overlays in Phase 7.

**If local path:**
- Create the project directory
- Copy (or symlink) the file to `{run_dir}/source.mp4`
- Create a minimal `run-metadata.json` from user-provided info (speaker name, channel). Fields can be empty — absence is handled gracefully downstream.

Set `$SOURCE_VIDEO` to the final path. Set `$RUN_DIR` to `projects/{skill-name}/runs/YYYY-MM-DD-{title}`. Log duration with ffprobe.
