# Build Path — ASSEMBLY (multi-clip + photos → one reel)

For a job folder holding several clips and/or photos — the racing-day case. Builds ONE reel and
adapts to whether narration is present ("build for either").

## Steps

1. **Sort assets** chronologically (Drive `createdTime`, or filename order if the note implies a story
   sequence). Photos and videos interleave in that order unless `note` says otherwise.

2. **Per-video highlight pass.** Run `scripts/highlight_select.py` on each video with a *per-clip*
   target = `assembly target / video_count`, so each contributes its best beats rather than one video
   dominating. Collect all selected segments.

3. **Photos → Ken-Burns stills.** For each image, make a `photo_duration`-second clip with a slow
   zoom/pan, scaled/padded to 1080×1920:
   ```bash
   ffmpeg -y -loop 1 -i photo.jpg -t {assembly.photo_duration} \
     -vf "scale=1280:-1,zoompan=z='min(zoom+0.0015,1.15)':d={fps*dur}:s=1080x1920,format=yuv420p" \
     -r 30 "<run>/still_{i}.mp4"
   ```

4. **Narration check ("build for either").** Resolve `assembly.keep_narration`:
   - `auto`: if any source video's speech_ratio (Phase 2 probe) ≥ 0.5 → **keep voice + captions**;
     otherwise → **music-only**.
   - `always` → always keep + caption the narrated segments.
   - `never` → drop all source audio, music only.

5. **Reframe** every video segment to 9:16 (`split-screen` for action, `face-track`/`stacked` for any
   narrated talking-head segment).

6. **Concatenate** all segments + stills in order with `assembly.crossfade` crossfades.

7. **Music bed** from `6_Assets/music/` (or `note.music`). If keeping narration, duck the music under
   speech (sidechain compress or -12 dB during narrated spans); else music at full bed level.

8. **Overlays/captions.** Title card from `note.title` at the open; tags lower-third; burn captions
   only over narrated segments.

9. Output one `clip.mp4` (1080×1920). Hand to Phase 4 (QC).

## Notes
- Keep the reel tight — default `assembly` target is the highlight target (30s). A racing day of 10
  clips becomes a 30s sizzle, not a 3-minute edit.
- If total selected content is shorter than the target, use everything; don't pad.
