#!/usr/bin/env python3
"""Recompose a Zoom two-up gallery recording onto a branded 16:9 canvas.

Takes the (already cut) condensed video whose frames are raw Zoom gallery
(two tiles + black bars) and produces a 1920x1080 branded version:
Night Sky background, scaled-up speaker tiles, episode title, name straps,
ALL THE POWER wordmark.

Usage:
  python compose_two_up.py --video condensed.mp4 --out branded.mp4 \
      --title "Stress, AI and Getting Your Life Back" \
      --left-name "ROY CASTLEMAN" --right-name "AMANDA KNARR" \
      [--preview 60]        # render a single frame at 60s to PNG instead

Tile geometry defaults match Zoom 1280x720 2-up (content 1224x360 @ y180,
gap ~16). Override with --geometry if a recording differs.
"""
import argparse, subprocess, sys, os

BG = "#333538"        # Night Sky
ACCENT = "#B9B47B"    # Light Green
TEXT = "#E4EAE8"      # Sky

FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "..",
                        "00-longform-to-shortform", "skill-pack", "assets", "fonts")
FONT_BOLD = os.path.abspath(os.path.join(FONT_DIR, "Montserrat-Bold.ttf"))
FONT_SEMI = os.path.abspath(os.path.join(FONT_DIR, "Montserrat-SemiBold.ttf"))

def ff_escape_text(s):
    return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’")

def ff_escape_path(p):
    # ffmpeg drawtext fontfile on Windows: forward slashes + escaped drive colon
    return p.replace("\\", "/").replace(":", "\\:")

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
    ap.add_argument("--geometry", default="604,360,0,180,16",
                    help="tileW,tileH,contentX,contentY,gap")
    ap.add_argument("--preview", type=float, default=None,
                    help="render one frame at this second to a PNG")
    args = ap.parse_args()

    tw, th, cx, cy, gap = [int(x) for x in args.geometry.split(",")]
    rx = cx + tw + gap  # right tile x

    # canvas layout
    W, H = 1920, 1080
    scale = 1.5
    sw, sh = int(tw * scale), int(th * scale)         # 906 x 540
    tile_y = 250
    left_x = (W // 2) - sw - 18
    right_x = (W // 2) + 18

    fb = ff_escape_path(FONT_BOLD)
    fsm = ff_escape_path(FONT_SEMI)
    title = ff_escape_text(args.title.upper())
    lname = ff_escape_text(args.left_name.upper())
    rname = ff_escape_text(args.right_name.upper())
    show = ff_escape_text(args.show_line.upper())

    fc = (
        f"color=c={BG}:s={W}x{H}:r=25[bg];"
        f"[0:v]crop={tw}:{th}:{cx}:{cy}[lt];"
        f"[0:v]crop={tw}:{th}:{rx}:{cy}[rt];"
        f"[lt]scale={sw}:{sh}[lts];"
        f"[rt]scale={sw}:{sh}[rts];"
        f"[bg][lts]overlay={left_x}:{tile_y}:shortest=1[c1];"
        f"[c1][rts]overlay={right_x}:{tile_y}[c2];"
        # accent line under tiles
        f"color=c={ACCENT}:s={W}x6:r=25[line];"
        f"[c2][line]overlay=0:{tile_y + sh + 26}:shortest=1[c3];"
        # texts
        f"[c3]drawtext=fontfile='{fb}':text='{title}':fontcolor={TEXT}:fontsize=56:"
        f"x=(w-text_w)/2:y=120,"
        f"drawtext=fontfile='{fsm}':text='{lname}':fontcolor={ACCENT}:fontsize=34:"
        f"x={left_x}+({sw}-text_w)/2:y={tile_y + sh + 56},"
        f"drawtext=fontfile='{fsm}':text='{rname}':fontcolor={ACCENT}:fontsize=34:"
        f"x={right_x}+({sw}-text_w)/2:y={tile_y + sh + 56},"
        f"drawtext=fontfile='{fsm}':text='{show}':fontcolor={TEXT}@0.8:fontsize=28:"
        f"x=(w-text_w)/2:y={H - 80}[outv]"
    )

    if args.logo:
        # icon mark above the show-line text
        fc = fc.replace(
            f"drawtext=fontfile='{fsm}':text='{show}':fontcolor={TEXT}@0.8:fontsize=28:"
            f"x=(w-text_w)/2:y={H - 80}[outv]",
            f"drawtext=fontfile='{fsm}':text='{show}':fontcolor={TEXT}@0.7:fontsize=22:"
            f"x=(w-text_w)/2:y={H - 52}[c9];"
            f"[1:v]scale=-1:60[logo];"
            f"[c9][logo]overlay=(W-w)/2:{H - 130}[outv]"
        )

    if args.preview is not None:
        out_png = args.out if args.out.endswith(".png") else args.out + ".png"
        cmd = ["ffmpeg", "-y", "-ss", str(args.preview), "-i", args.video]
        if args.logo:
            cmd += ["-i", args.logo]
        cmd += ["-filter_complex", fc, "-map", "[outv]", "-frames:v", "1", out_png]
    else:
        cmd = ["ffmpeg", "-y", "-i", args.video]
        if args.logo:
            cmd += ["-i", args.logo]
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
