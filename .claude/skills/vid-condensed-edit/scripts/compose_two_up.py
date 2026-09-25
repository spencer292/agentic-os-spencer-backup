#!/usr/bin/env python3
"""Recompose a Zoom two-up gallery recording onto a branded 16:9 canvas.

Takes the (already cut) condensed video whose frames are raw Zoom gallery
(two tiles + black bars) and produces a 1920x1080 branded version:
Night Sky background, scaled-up speaker tiles, episode title, name straps,
ALL THE POWER wordmark.

Usage:
  python compose_two_up.py --video condensed.mp4 --out branded.mp4 \
      --title "Stress, AI and Getting Your Life Back" \
      --left-name "ROY CASTLEMAN" --right-name "JANNIK CLAUDI" \
      [--preview 60]        # render a single frame at 60s to PNG instead

Tile geometry is AUTO-DETECTED per recording by default: Zoom's divider gap
and letterbox bars are the only static pixels across sampled frames, so the
real tile edges are found frame-accurately regardless of source resolution
or layout drift (fixed defaults used to leave a grey divider sliver down the
middle when the recording's layout differed). --geometry tileW,tileH,x,y,gap
(source pixels) remains as a manual override.
"""
import argparse, subprocess, sys, os, tempfile, json

BG = "#333538"        # Night Sky
ACCENT = "#B9B47B"    # Light Green
TEXT = "#E4EAE8"      # Sky

# Inner safety shave: crops step this many px away from every detected tile
# edge so a rounding error can never re-admit the divider or bar pixels.
EDGE_INSET = 3
# Design box one tile may occupy on the 1920x1080 canvas.
BOX_W, BOX_H = 906, 540
TILE_Y = 250
CENTER_MARGIN = 18    # tile distance from canvas centreline

# --- tighter tile crop (--tile-aspect), added 2026-08-18 -----------------------
# Two 16:9 tiles side by side form a 32:9 strip, so on a 16:9 canvas they can only
# ever fill HALF the height. Measured: 44.5% of frame is live video and each face is
# 14.4% of frame height. Tuning BOX_W/BOX_H cannot fix that - maxed out it reaches
# 48.1% fill and a 15.0% face. The geometry is the constraint, not the padding.
# Cropping each speaker to 4:3 before compositing throws away the empty room either
# side of them and gets to 64% fill with the face at 20% of frame height.
# A taller tile leaves no room for the title where it sits at y=120, so the wide
# layout moves the title up and starts the tile block higher.
WIDE_TILE_Y = 128
WIDE_TITLE_Y = 40

# The logo PNG must enter as a looped 25 fps stream, not a bare single frame. A one-frame image
# input carries a single pts=0 packet; overlay then emits frames the mp4 muxer rejects
# ("Error submitting a packet to the muxer: Invalid argument") and the whole render dies at the
# very end, after the encode has run. -loop 1 -framerate 25 makes it a proper stream, and the
# shortest=1 on the logo overlay bounds it to the video. Found 2026-08-16 on ep 084 — the first
# render that actually reached this code path.
LOGO_INPUT = ["-loop", "1", "-framerate", "25", "-i"]

FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "..",
                        "00-longform-to-shortform", "skill-pack", "assets", "fonts")
FONT_BOLD = os.path.abspath(os.path.join(FONT_DIR, "Montserrat-Bold.ttf"))
FONT_SEMI = os.path.abspath(os.path.join(FONT_DIR, "Montserrat-SemiBold.ttf"))

def ff_escape_text(s):
    # NOTE: every drawtext below sets expansion=none. Without it a '%' in the text makes ffmpeg
    # silently drop the ENTIRE drawtext line — no error, no warning, just a missing title. Found
    # 2026-08-14 on "They Cut 73% of Their Delivery Time…": the title vanished from the branded
    # render while tiles, straps and logo composed correctly. Neither '\%' nor '%%' nor textfile=
    # fixes it (expansion happens after those); only expansion=none does. Do NOT add a '%' escape
    # here — with expansion off it would render as a literal backslash.
    return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’")

def ff_escape_path(p):
    # ffmpeg drawtext fontfile on Windows: forward slashes + escaped drive colon
    return p.replace("\\", "/").replace(":", "\\:")

def aim_crop(video, x, y, tw, th, crop_w, at_sec):
    """Where to put a narrower crop window inside a detected tile.

    Centre-cropping assumes the speaker sits in the middle of their Zoom tile, and
    plenty do not. Measure the face on one sampled frame and aim at it; fall back to
    centre if there is no readable face. Returns an x offset within the tile.
    """
    centre = (tw - crop_w) // 2
    try:
        import sys as _sys, tempfile, subprocess as _sp
        _sys.path.insert(0, os.path.join(os.path.dirname(__file__),
                                         "..", "..", "..", "..", "scripts", "podcast"))
        from thumb_faces import find_face          # noqa
        from PIL import Image
        tmp = os.path.join(tempfile.gettempdir(), f"aim_{x}_{int(at_sec)}.png")
        _sp.run(["ffmpeg", "-y", "-v", "error", "-ss", str(at_sec), "-i", video,
                 "-vf", f"crop={tw}:{th}:{x}:{y}", "-frames:v", "1", tmp],
                check=True)
        img = Image.open(tmp)
        face = find_face(tmp, img)
        if not face:
            return centre
        want = int(round(face.cx - crop_w / 2))
        return max(0, min(want, tw - crop_w))
    except Exception as e:
        print(f"  aim_crop fell back to centre for tile x={x}: {e}")
        return centre


def probe(video):
    res = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,duration",
         "-of", "json", video],
        capture_output=True, text=True)
    st = json.loads(res.stdout)["streams"][0]
    dur = float(st.get("duration") or 0) or 3600.0
    return int(st["width"]), int(st["height"]), dur

def _runs(mask):
    """Maximal [start, end) runs of True in a 1-D bool array."""
    runs, start = [], None
    for i, v in enumerate(list(mask) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append((start, i))
            start = None
    return runs

def detect_geometry(video, w, h, dur):
    """Find the two Zoom tiles: content band, tile junction, optional divider.

    Zoom's 2-up layout drifts per recording (720p vs 1080p, divider gap vs
    flush tiles), so nothing is assumed:
    - content rows: temporal change across sampled frames (letterbox bars
      never move; measured clean on real footage, band error < 3 px)
    - tile junction: the strongest PERSISTENT vertical edge near the centre
      (min across frames of band-mean |d/dx| — the only edge that exists in
      every frame regardless of what either speaker does). Temporal-change
      and vertical-uniformity signals both fail here: re-encode noise smears
      the divider and static virtual backgrounds out-flatline it.
    - divider vs flush: a second persistent edge within 28 px whose interior
      is edge-free marks a divider gap; otherwise the tiles are flush.
    Returns (lx, rx, tw, th, cy) in source pixels, inner-inset applied,
    or None if no plausible layout is found.
    """
    import numpy as np
    from PIL import Image
    frames = []
    with tempfile.TemporaryDirectory() as td:
        for i, frac in enumerate((0.15, 0.35, 0.5, 0.65, 0.85)):
            png = os.path.join(td, f"f{i}.png")
            r = subprocess.run(
                ["ffmpeg", "-y", "-v", "error", "-ss", str(dur * frac),
                 "-i", video, "-frames:v", "1", png],
                capture_output=True, text=True)
            if r.returncode == 0 and os.path.exists(png):
                frames.append(np.asarray(Image.open(png).convert("L"), dtype=np.int16))
    if len(frames) < 3:
        return None

    change = np.zeros_like(frames[0], dtype=np.int16)
    for a, b in zip(frames, frames[1:]):
        change = np.maximum(change, np.abs(a - b))

    # content rows = rows where anything moves (black bars are static)
    row_alive = change.mean(axis=1) > 1.0
    bands = [r for r in _runs(row_alive) if r[1] - r[0] > h * 0.2]
    if not bands:
        return None
    band_top, band_end = max(bands, key=lambda r: r[1] - r[0])

    # persistent vertical edge energy: edge index e = boundary between e, e+1
    pedge = np.min(
        [np.abs(np.diff(f[band_top:band_end].astype(np.float64), axis=1)).mean(axis=0)
         for f in frames], axis=0)
    lo, hi = w // 3, 2 * w // 3
    peak = lo + int(np.argmax(pedge[lo:hi]))
    if pedge[peak] < 6:
        return None

    # divider gap: a second strong persistent edge nearby with a flat interior
    inner_l, inner_r = peak, peak + 1        # flush default
    win_l, win_r = max(lo, peak - 28), min(hi, peak + 28)
    near = pedge[win_l:win_r].copy()
    near[max(0, peak - 3 - win_l):peak + 4 - win_l] = 0
    second = win_l + int(np.argmax(near))
    if pedge[second] >= max(3.0, 0.35 * pedge[peak]):
        a, b = sorted((peak, second))
        if b - a > 1 and pedge[a + 1:b].mean() < 2.0:   # interior must be featureless
            inner_l, inner_r = a, b + 1

    # black static side bars (absent when tiles span the full width)
    col_change = change[band_top:band_end].mean(axis=0)
    col_mean = np.mean([f[band_top:band_end].mean(axis=0) for f in frames], axis=0)
    bar = (col_change < 4) & (col_mean < 14)
    side = [r for r in _runs(bar) if r[0] == 0 or r[1] == w]
    left_edge = max((r[1] for r in side if r[0] == 0), default=0)
    right_edge = min((r[0] for r in side if r[1] == w), default=w)

    # symmetric tiles anchored on the junction, inset on every edge
    tw = min(inner_l + 1 - left_edge, right_edge - inner_r) - 2 * EDGE_INSET
    tw -= tw % 2
    th = (band_end - band_top) - 2 * EDGE_INSET
    th -= th % 2
    if tw < w * 0.25 or th < h * 0.2:
        return None
    lx = inner_l + 1 - EDGE_INSET - tw
    rx = inner_r + EDGE_INSET
    return lx, rx, tw, th, band_top + EDGE_INSET

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--left-name", required=True)
    ap.add_argument("--right-name", required=True)
    ap.add_argument("--show-line", default="ALL THE POWER  •  POWER MOVERS PODCAST")
    ap.add_argument("--logo", default=None,
                    help="PNG wordmark/logo (light-on-transparent). Replaces the text show-line; "
                         "the show-line text then renders smaller beneath it.")
    ap.add_argument("--geometry", default=None,
                    help="manual override: tileW,tileH,contentX,contentY,gap (source px). "
                         "Default is per-recording auto-detection.")
    ap.add_argument("--preview", type=float, default=None,
                    help="render one frame at this second to a PNG")
    ap.add_argument("--tile-aspect", default=None,
                    help="crop each speaker tile to this aspect before compositing, "
                         "e.g. 4:3. Bigger faces, less dead canvas. Omit for the "
                         "original full-width 16:9 tiles.")
    args = ap.parse_args()

    src_w, src_h, dur = probe(args.video)

    if args.geometry:
        tw, th, cx, cy, gap = [int(x) for x in args.geometry.split(",")]
        lx, rx = cx, cx + tw + gap
    else:
        geo = detect_geometry(args.video, src_w, src_h, dur)
        if geo is None:
            # fall back to the classic Zoom 2-up layout scaled to this source
            s = src_w / 1280
            tw, th = int(604 * s), int(360 * s)
            lx, cy = 0, int(180 * s)
            rx = lx + tw + int(16 * s)
            print(f"WARN: tile auto-detect failed, using scaled defaults for {src_w}x{src_h}")
        else:
            lx, rx, tw, th, cy = geo
            print(f"Auto-detected tiles: {tw}x{th} at x={lx}/{rx}, y={cy} (source {src_w}x{src_h})")

    # canvas layout — scale detected tiles into the per-tile design box
    W, H = 1920, 1080
    crop_w, crop_h = tw, th
    lx_off = rx_off = 0
    title_y = 120

    if args.tile_aspect:
        aw, ah = [int(v) for v in args.tile_aspect.split(":")]
        want = int(round(th * aw / ah)) // 2 * 2
        if want >= tw:
            print(f"  --tile-aspect {args.tile_aspect} is wider than the detected tile "
                  f"({tw}x{th}); leaving tiles uncropped.")
        else:
            crop_w = want
            at = min(max(dur * 0.35, 5), max(dur - 5, 5))
            lx_off = aim_crop(args.video, lx, cy, tw, th, crop_w, at)
            rx_off = aim_crop(args.video, rx, cy, tw, th, crop_w, at)
            print(f"  tile crop {crop_w}x{crop_h} ({args.tile_aspect}), "
                  f"aimed at x+{lx_off} / x+{rx_off} within each tile")

    if crop_w != tw:
        # Wide layout: fill the canvas width, derive height from the crop aspect.
        sw = ((W - 2 * CENTER_MARGIN) // 2) // 2 * 2
        sh = int(crop_h * sw / crop_w) // 2 * 2
        tile_y = WIDE_TILE_Y
        title_y = WIDE_TITLE_Y
    else:
        scale = min(BOX_W / tw, BOX_H / th)
        sw, sh = int(tw * scale) // 2 * 2, int(th * scale) // 2 * 2
        tile_y = TILE_Y + (BOX_H - sh) // 2   # keep the tile block vertically centred in its box

    left_x = (W // 2) - sw - CENTER_MARGIN
    right_x = (W // 2) + CENTER_MARGIN

    # The chrome below the tiles must not collide with the logo/show line.
    names_bottom = tile_y + sh + 56 + 34
    if names_bottom > H - 140:
        print(f"  WARN: tile block runs to {names_bottom}px, crowding the footer at {H - 140}px")

    fb = ff_escape_path(FONT_BOLD)
    fsm = ff_escape_path(FONT_SEMI)
    title = ff_escape_text(args.title.upper())
    lname = ff_escape_text(args.left_name.upper())
    rname = ff_escape_text(args.right_name.upper())
    show = ff_escape_text(args.show_line.upper())

    fc = (
        f"color=c={BG}:s={W}x{H}:r=25[bg];"
        f"[0:v]crop={crop_w}:{crop_h}:{lx + lx_off}:{cy}[lt];"
        f"[0:v]crop={crop_w}:{crop_h}:{rx + rx_off}:{cy}[rt];"
        f"[lt]scale={sw}:{sh}[lts];"
        f"[rt]scale={sw}:{sh}[rts];"
        f"[bg][lts]overlay={left_x}:{tile_y}:shortest=1[c1];"
        f"[c1][rts]overlay={right_x}:{tile_y}[c2];"
        # accent line under tiles
        f"color=c={ACCENT}:s={W}x6:r=25[line];"
        f"[c2][line]overlay=0:{tile_y + sh + 26}:shortest=1[c3];"
        # texts
        f"[c3]drawtext=fontfile='{fb}':text='{title}':expansion=none:fontcolor={TEXT}:fontsize=56:"
        f"x=(w-text_w)/2:y={title_y},"
        f"drawtext=fontfile='{fsm}':text='{lname}':expansion=none:fontcolor={ACCENT}:fontsize=34:"
        f"x={left_x}+({sw}-text_w)/2:y={tile_y + sh + 56},"
        f"drawtext=fontfile='{fsm}':text='{rname}':expansion=none:fontcolor={ACCENT}:fontsize=34:"
        f"x={right_x}+({sw}-text_w)/2:y={tile_y + sh + 56},"
        f"drawtext=fontfile='{fsm}':text='{show}':expansion=none:fontcolor={TEXT}@0.8:fontsize=28:"
        f"x=(w-text_w)/2:y={H - 80}[outv]"
    )

    if args.logo:
        # icon mark above the show-line text.
        # NOTE: this swaps the show-line drawtext for a smaller one plus a logo overlay. Both the
        # search and the replacement MUST carry expansion=none, exactly as the fc above builds it —
        # when expansion=none was added (2026-08-14) this search string was not updated, so the
        # replace silently no-opped and every branded render came out with NO LOGO (ffmpeg exits 0
        # because the unused -i logo input is harmless). Found 2026-08-16 on ep 084. The assert
        # below makes any future drift fail loudly instead of shipping a logo-less video.
        old_tail = (f"drawtext=fontfile='{fsm}':text='{show}':expansion=none:fontcolor={TEXT}@0.8:"
                    f"fontsize=28:x=(w-text_w)/2:y={H - 80}[outv]")
        new_tail = (f"drawtext=fontfile='{fsm}':text='{show}':expansion=none:fontcolor={TEXT}@0.7:"
                    f"fontsize=22:x=(w-text_w)/2:y={H - 52}[c9];"
                    f"[1:v]scale=-1:60[logo];"
                    f"[c9][logo]overlay=(W-w)/2:{H - 130}:shortest=1[outv]")
        if old_tail not in fc:
            sys.exit("logo overlay could not be spliced in: show-line drawtext string drifted")
        fc = fc.replace(old_tail, new_tail)

    if args.preview is not None:
        out_png = args.out if args.out.endswith(".png") else args.out + ".png"
        cmd = ["ffmpeg", "-y", "-ss", str(args.preview), "-i", args.video]
        if args.logo:
            cmd += LOGO_INPUT + [args.logo]
        cmd += ["-filter_complex", fc, "-map", "[outv]", "-frames:v", "1", out_png]
    else:
        cmd = ["ffmpeg", "-y", "-i", args.video]
        if args.logo:
            cmd += LOGO_INPUT + [args.logo]
        cmd += ["-filter_complex", fc,
               "-map", "[outv]", "-map", "0:a",
               "-c:v", "libx264", "-crf", "19", "-preset", "fast",
               "-c:a", "copy",
               "-dn", "-map_metadata", "-1", "-write_tmcd", "0",
               "-movflags", "+faststart",
               args.out]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(res.stderr[-3000:])
        sys.exit("ffmpeg failed")
    print("Done:", args.out)

if __name__ == "__main__":
    main()
