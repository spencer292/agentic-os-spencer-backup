# Phase 4 — QC

Probe every finished `clip.mp4` before it reaches Review. Fail closed — a bad clip never goes to
Review labelled as ready.

```bash
ffprobe -v quiet -print_format json -show_format -show_streams "<run>/clip.mp4"
```

Check:

| Check | Pass condition | On fail |
|-------|----------------|---------|
| Resolution | exactly `1080x1920` | re-run reframe; if still wrong, fail job |
| Duration | within `±20%` of target (or note.duration) | log warning, keep (don't auto-fail) |
| Audio stream | present (unless music-only intentionally) | log; keep only if music-only path |
| Black seam | no persistent letterbox band (sample 5 frames, check top/bottom rows) | re-reframe with adjusted layout |
| Playable | ffprobe returns valid duration, no decode errors | fail job |

Sample-frame black-seam check (inherited from the podcast `stacked.py` letterbox fix — the seam bug is
real, so verify it explicitly):
```bash
ffmpeg -y -i "<run>/clip.mp4" -vf "select='not(mod(n,30))',crop=iw:4:0:0" -frames:v 5 \
  -f image2 "<run>/seam_%d.png" -v quiet
# inspect mean luma of the strip; near-zero across all = black band -> re-reframe
```

Log QC results to `run-log.md`. Only QC-passed clips advance to Phase 5.
