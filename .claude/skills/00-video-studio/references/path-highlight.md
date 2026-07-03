# Build Path — HIGHLIGHT (action / B-roll)

For footage where the good bits are *visual*, not spoken. The racing-clip default.

## Steps

1. **Select segments.** Run the highlight selector against the source video:
   ```bash
   PY="projects/tools/.venv-studio/Scripts/python.exe"; [ -x "$PY" ] || PY="projects/tools/.venv-studio/bin/python"
   "$PY" .claude/skills/00-video-studio/scripts/highlight_select.py \
     --video "<source>.mp4" \
     --target {highlight.target_duration or note.duration} \
     --min-seg {highlight.min_segment} --max-seg {highlight.max_segment} \
     --motion-weight {highlight.motion_weight} --audio-weight {highlight.audio_weight} \
     --out "<run>/clips.json"
   ```
   `clips.json` returns the chosen segments in chronological order with motion/audio scores.

2. **Extract each segment** (frame-accurate, re-encode — never stream-copy):
   ```bash
   ffmpeg -y -ss {start} -i "<source>.mp4" -t {end-start} \
     -c:v libx264 -preset ultrafast -crf 18 -c:a copy -movflags +faststart \
     "<run>/seg_{i}.mp4"
   ```

3. **Reframe to 9:16.** Action footage has no single face to track — use `split-screen`
   (centre-weighted crop) unless the note says otherwise:
   ```bash
   "$PY" -m reframe --video "<run>/seg_{i}.mp4" --output "<run>/seg_{i}_916.mp4" --layout split-screen
   ```
   (reframe module lives in `00-longform-to-shortform/skill-pack/tools/` — run from that dir or add it
   to `PYTHONPATH`.)

4. **Concatenate** the reframed segments with short crossfades (`assembly.crossfade`), via the ffmpeg
   `xfade` filter or a concat-demuxer + fade for speed on long sets.

5. **Music bed.** If `highlight.music` and a track exists in `6_Assets/music/` (or `note.music`):
   - Mix under the natural audio at ~ -8 dB if the footage has good diegetic sound (engine, crowd),
     or replace fully if the source audio is wind/noise.
   - Optionally snap segment cuts toward beats: detect beats with `ffmpeg ... ebur128` peaks or a
     fixed BPM from the track; nudge each segment boundary to the nearest beat within ±0.25s.

6. **Text overlays.** If `highlight.overlays` and `note` has `title`/`tags`/lap data, burn them with
   `vid-ffmpeg-edit` drawtext (top-third title, lower-third tags). Use personal `visual-identity`
   fonts/colours when present, else the default gold style.

7. Output `clip.mp4` (1080×1920) to the run dir. Hand to Phase 4 (QC).

## Notes
- No captions on pure-action clips unless the note asks — overlays carry the context.
- If `clips.json` selects < 2 segments (very short source), just reframe the whole clip.
