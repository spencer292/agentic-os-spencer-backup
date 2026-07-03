"""Stacked layout: two-person side-by-side grid -> vertically stacked 9:16.

For interview/podcast recordings where two speakers sit in a fixed
side-by-side grid (e.g. a two-up Zoom call). The left half goes on top,
the right half on the bottom, each filling a 1080x960 panel so both
speakers stay visible the whole time.

This layout is fully static — the source tiles never move — so it needs
no face detection. A single ffmpeg filter_complex does the work.

Zoom tiles are commonly letterboxed: the 16:9 webcam feed sits inside a
taller tile with black bars above and below. This module auto-detects that
content band with cropdetect and frames into it, so the stacked output has
no black gap between the two speakers. Set AUTODETECT_BAND=False to use the
full tile height instead.

Tunables:
    FACE_BIAS        Vertical crop position within the content band:
                     0.0 = top, 0.5 = center, 1.0 = bottom. Lower keeps faces
                     (upper-middle of a tile) higher in frame. Default 0.40.
    TOP_X_BIAS       Horizontal framing of the top speaker, 0=left .. 1=right.
    BOT_X_BIAS       Horizontal framing of the bottom speaker.
    SWAP_SIDES       If True, the right half goes on top instead of the left.
    AUTODETECT_BAND  Auto-detect the letterbox content band (default True).
"""

import json
import re
import subprocess

OUT_W, OUT_H = 1080, 1920
PANEL_W, PANEL_H = 1080, 960          # each speaker panel (top / bottom)
ZOOM = 1.30                            # >1 crops tighter -> bigger heads (1.0 = full tile)
TOP_FACE_BIAS = 0.30                    # vertical centre of top speaker (0=top .. 1=bottom)
BOT_FACE_BIAS = 0.52                    # vertical centre of bottom speaker
TOP_X_BIAS = 0.50                      # horizontal centering of top speaker
BOT_X_BIAS = 0.50                      # horizontal centering of bottom speaker
SWAP_SIDES = False                     # True -> right speaker on top
AUTODETECT_BAND = True                 # strip letterbox bars within each tile


def _probe_dims(video_path):
    """Source width/height via ffprobe (no OpenCV dependency)."""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "json", str(video_path)],
        capture_output=True, text=True, check=True,
    )
    s = json.loads(out.stdout)["streams"][0]
    return int(s["width"]), int(s["height"])


def _even(n):
    """ffmpeg/yuv420p needs even pixel dimensions."""
    n = int(round(n))
    return n - (n % 2)


def _detect_band(video_path, half_w, src_h):
    """Detect the vertical content band (y, height) inside the left tile.

    Runs cropdetect per-frame over a short sample and takes the MODAL band —
    the band most frames agree on. A max-based pick is poisoned by a single
    noisy frame; limited-range (tv) video has black at luma 16 with encode
    noise that rides past cropdetect's default limit of 24, so we use 36.
    The left tile is used because side backgrounds there are typically light;
    both tiles share the same vertical letterbox in a Zoom row layout.
    Returns (content_y, content_h) in source pixels; falls back to full height.
    """
    cmd = [
        "ffmpeg", "-ss", "5", "-i", str(video_path), "-t", "8",
        "-vf", f"crop={half_w}:{src_h}:0:0,cropdetect=36:2:1",
        "-f", "null", "-",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    counts = {}
    for m in re.finditer(r"crop=(\d+):(\d+):(\d+):(\d+)", proc.stderr):
        ch, cy = int(m.group(2)), int(m.group(4))
        if 0 < ch <= src_h:
            counts[(cy, ch)] = counts.get((cy, ch), 0) + 1
    if not counts:
        return 0, src_h
    (band_y, band_h), _ = max(counts.items(), key=lambda kv: (kv[1], kv[0][1]))
    return band_y, band_h


def _panel_crop(region_w, region_h):
    """Crop rect (w, h) inside a content region, matched to the panel aspect."""
    panel_aspect = PANEL_W / PANEL_H            # 1.125
    crop_w = region_w
    crop_h = crop_w / panel_aspect
    if crop_h > region_h:                       # region too short -> crop width
        crop_h = region_h
        crop_w = crop_h * panel_aspect
    return _even(crop_w), _even(crop_h)


def reframe(video_path, output_path):
    """Two-up side-by-side -> stacked 9:16 via a single ffmpeg pass."""
    print("[stacked] Two-person side-by-side -> vertical stack")
    w, h = _probe_dims(video_path)
    half_w = _even(w / 2)

    if AUTODETECT_BAND:
        band_y, band_h = _detect_band(video_path, half_w, h)
    else:
        band_y, band_h = 0, h

    crop_w, crop_h = _panel_crop(half_w, band_h)
    # Tighten the crop by ZOOM (keeps panel aspect) so heads fill more of frame.
    crop_w = min(_even(crop_w / ZOOM), half_w)
    crop_h = min(_even(crop_h / ZOOM), band_h)

    # Each speaker gets its own vertical centre — the two webcams are framed
    # differently within the shared content band.
    top_y = band_y + _even((band_h - crop_h) * TOP_FACE_BIAS)
    bot_y = band_y + _even((band_h - crop_h) * BOT_FACE_BIAS)
    slack = half_w - crop_w
    left_x = _even(slack * TOP_X_BIAS)
    right_x = _even(half_w + slack * BOT_X_BIAS)

    top_x, bot_x = (right_x, left_x) if SWAP_SIDES else (left_x, right_x)

    print(f"  [stacked] src {w}x{h} | band y={band_y} h={band_h} | zoom={ZOOM} | "
          f"crop {crop_w}x{crop_h} | top @({top_x},{top_y}) bot @({bot_x},{bot_y})")

    filter_complex = (
        f"[0:v]crop={crop_w}:{crop_h}:{top_x}:{top_y},"
        f"scale={PANEL_W}:{PANEL_H}:flags=lanczos,setsar=1[top];"
        f"[0:v]crop={crop_w}:{crop_h}:{bot_x}:{bot_y},"
        f"scale={PANEL_W}:{PANEL_H}:flags=lanczos,setsar=1[bot];"
        f"[top][bot]vstack=inputs=2[v]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-filter_complex", filter_complex,
        "-map", "[v]", "-map", "0:a?",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast", "-crf", "20",
        "-movflags", "+faststart",
        "-c:a", "copy",
        "-v", "error", "-stats",
        str(output_path),
    ]
    subprocess.run(cmd, check=True)
    print(f"  Rendered stacked {OUT_W}x{OUT_H} -> {output_path}")
    print("[stacked] Done.")
