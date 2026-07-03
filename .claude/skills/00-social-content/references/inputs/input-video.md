# Input: Video (Scenarios B + G)

Use when the input is a video — either a remote URL (B) or a local file (G). Both scenarios extract a transcript AND a frame manifest, then feed both into draft + image generation.

## Detection signals

| Scenario | Trigger pattern |
|----------|-----------------|
| B — YouTube/Vimeo/Loom/TikTok URL | `youtube.com/watch?v=`, `youtu.be/`, `vimeo.com`, `loom.com`, `tiktok.com`, `instagram.com/reel`, `.mp4` URL |
| G — local file | Absolute path to `.mp4`, `.mov`, `.mp3`, `.wav`, `.m4a` |

## Phase 3 logic

### Scenario B

**Step 0 — Binary check (run before anything else):**
```bash
where yt-dlp 2>$null; where ffmpeg 2>$null   # PowerShell
# or: which yt-dlp && which ffmpeg             # bash/macOS
```
Record the result — binary presence/absence — in `pipeline-log.md` under Phase 3. This check runs once and its result governs steps 5–6.

1. Invoke `tool-youtube` in transcript mode with `{URL}`.
2. Save cleaned transcript to `{output_base}/{date}/logs/inspiration/{slug}.md`.
3. Merge transcript ideas into `inspiration_pool`.
4. **Download video thumbnail** — run in thumbnail-only mode, no API key needed:
   ```bash
   python .claude/skills/tool-youtube/scripts/metadata.py "{URL}" \
     --thumbnail --no-metadata \
     --output-dir "{output_base}/{date}/logs/inspiration/"
   ```
   Store result as `thumbnail_path` (absolute path to `thumbnail.png`, `.webp`, or `.jpg`). If download fails, set `thumbnail_path: null` — non-blocking.
   Log: `Phase 3 — thumbnail: {thumbnail_path | FAILED (non-blocking)}`.
5. **Fallback:** if transcript fails (no captions, age-restricted, geo-blocked) → fall back to Scenario F (`tool-web-screenshot`) using the same URL. Log the fallback reason.
6. **Call `tool-video-screenshots`** in pipeline mode with `{URL}` → writes a manifest to `{output_base}/{date}/logs/screenshots/manifest.json`. Each entry: `{timestamp, frame_path, caption}`.
   - **This step is mandatory.** Real video frames are first-class inputs — they make visuals authentic and brand-matched. Always attempt.
   - **Only valid skip condition:** Step 0 confirmed `yt-dlp` or `ffmpeg` is not on PATH. No other condition justifies skipping.
   - "Talking-head only" is NOT a skip condition — let the tool run and it will return few or no useful frames naturally; the frame-matching step in 5.3b.1 handles empty manifests gracefully.
   - **If skipping:** log to `pipeline-log.md` exactly: `Phase 3 — tool-video-screenshots: SKIPPED. Reason: {binary} not found at PATH. Frame matching will fall back to AI generation.`
   - **If running:** log: `Phase 3 — tool-video-screenshots: RUNNING at {HH:MM:SS}.`

### Scenario G

**Step 0 — Binary check:**
```bash
where ffmpeg 2>$null   # PowerShell
# or: which ffmpeg     # bash/macOS
```

1. Invoke `tool-transcription` with the local file path.
2. Save transcript to `{output_base}/{date}/logs/inspiration/{slug}.md`.
3. **Call `tool-video-screenshots`** in pipeline mode with the local file path → manifest at the same path as Scenario B.
   - Same mandatory rule as Scenario B step 5 above.
   - **Only valid skip condition:** Step 0 confirmed `ffmpeg` not on PATH.

## Frame matching (Phase 5.3b.1)

After the slide outline is built (Phase 5.3b), check if `manifest.json` exists. If yes:

1. Read all manifest entries: `[{timestamp, frame_path, caption}, ...]`.
2. For each slide where `render_mode != TEMPLATE` AND `image_zone != none`:
   - Find the manifest entry whose `caption` semantically matches the slide's `image_concept`.
   - Assign `frame_path` to that entry's absolute path.
3. **Deconflict:** each manifest entry can only be assigned once. Pick best matches first; exclude used entries from later slides.
4. If no manifest exists, no good semantic match is found, or the slide is `TEMPLATE`: leave `frame_path: null`.

Slides with `frame_path` set pass the frame to the AI as `--input-image` — the model stylizes it instead of hallucinating from scratch. This dramatically improves visual fidelity for "transform this moment from the video" use cases.

## Best practices

- **Prefer real frames over AI invention.** If a frame matches `image_concept`, always use it. The AI's stylization preserves the subject matter; pure AI gen drifts.
- **Talking-head videos:** frames are usually useless (same headshot repeating). Don't force-assign — `frame_path: null` is the right call.
- **Long videos (>15 min):** the screenshot tool samples; not every moment is captured. Some slides will legitimately have no matching frame.
- **YouTube fallback to web-screenshot is intentional** — even if we can't get the transcript, the page screenshot gives us title, thumbnail, description, top comments.
- **Reasoning log:** for each slide with `frame_path` set, log `Frame matched: timestamp Xs — caption "{caption}" → image_concept "{concept}"`. For slides without a match, log `No frame match — falling back to AI generation`.
