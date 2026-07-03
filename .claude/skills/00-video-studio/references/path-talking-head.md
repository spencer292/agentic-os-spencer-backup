# Build Path — TALKING-HEAD (piece-to-camera)

For single videos with continuous speech (the scam-warning video). Reuses the podcast/L2S
speech-driven machine almost wholesale.

## Steps

1. **Transcribe** the source via `tool-transcription` (Groq if `GROQ_API_KEY`, else local WhisperX) →
   word-level SRT/JSON. Transcribe the source here; re-transcribe the *reframed clip* later for
   caption alignment (hard rule #4).

2. **Select clip(s).** Run `vid-clip-selection` over the transcript with
   `min_score = talking_head.min_score`, `duration_range = talking_head.duration_range`.
   - For a short standalone piece (e.g. a 60–90s scam warning), the whole thing may be one clip —
     selection then just trims dead air at the ends.
   - For a longer ramble, it returns the punchiest self-contained moments.

3. **Extract** each chosen window (frame-accurate re-encode, hard rule #3):
   ```bash
   ffmpeg -y -ss {start} -i "<source>.mp4" -t {end-start} \
     -c:v libx264 -preset ultrafast -crf 18 -c:a copy -movflags +faststart "<run>/clip_{i}.mp4"
   ```

4. **Reframe** to 9:16 with face tracking so Roy stays centred:
   ```bash
   "$PY" -m reframe --video "<run>/clip_{i}.mp4" --output "<run>/clip_{i}_916.mp4" --layout stacked
   ```
   (`stacked` = speaker on top, captions/B-roll band below — the podcast default. Use `face-track`
   for a full-frame talking head with no band.)

5. **Re-transcribe the reframed clip**, then **burn kinetic captions** + progress bar via
   `vid-ffmpeg-edit`. Use the personal `voice-profile` tone for any rewritten on-screen hook text and
   `visual-identity` colours; fall back to the gold caption style until those exist.

6. Output `clip.mp4` (1080×1920) per selected moment. Hand to Phase 4 (QC).

## Notes
- This path is production-ready today — it leans entirely on skills you already trust.
- If selection returns nothing above `min_score`, keep the single best moment anyway and note the low
  score in the run log (a deliberately-recorded piece shouldn't be discarded for a soft score).
