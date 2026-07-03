"""Brand overlay convention for the studio lane.

Applies the standard All The Power overlay treatment to a finished reel:
  - opening lower-third title in the brand display font (BN Dime Display), controlled size
  - the ATP logo as a small corner mark through the body
  - a clean Night Sky brand END CARD on the final beat: logo centred + high-contrast,
    tagline beneath in Light Green — so the brand lands instead of getting lost

This replaces ad-hoc white-Montserrat overlays. Validated 2026-06-14 on the Spencer film.

IMPORTANT: run from the repo root with RELATIVE forward-slash paths for --in/--out
(the libass `ass=` filter breaks on Windows drive-colon absolute paths).

Usage:
    python .claude/skills/00-video-studio/scripts/brand_overlay.py \
        --in  projects/00-video-studio/runs/{job}/reel_music.mp4 \
        --out projects/00-video-studio/runs/{job}/reel.mp4 \
        --title "Living the life we love" \
        [--end-tagline "Living the life we love"] [--endcard-secs 2.3] [--corner-only]
"""

import argparse
import subprocess
import sys
from pathlib import Path

# --- Brand tokens (All The Power) ---
FONT = "BN Dime Display"
FONTS_DIR = "brand_context/fonts"
LOGO = "brand_context/Branding/ALL THE POWER LOGO/PNG/atp-icon-square-150-light.png"
NIGHT_SKY_HEX = "0x333538"          # end-card background (drawbox)
SKY_ASS = "&H00E8EAE4"              # #E4EAE8 lower-third text (BGR)
LIGHT_GREEN_ASS = "&H007BB4B9"      # #B9B47B end-card tagline (BGR)
OUTLINE_ASS = "&H00383533"          # Night Sky outline (BGR)

ASS_TEMPLATE = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Lower,{font},52,{sky},&H000000FF,{outline},&H64000000,0,0,0,0,100,100,1,0,1,3,2,2,80,80,300,1
Style: EndTag,{font},60,{lgreen},&H000000FF,{outline},&H00000000,0,0,0,0,100,100,2,0,1,1,0,5,90,90,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
{events}
"""


def ts(sec):
    h = int(sec // 3600); m = int((sec % 3600) // 60); s = sec % 60
    return f"{h:d}:{m:02d}:{s:05.2f}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--title", required=True, help="opening lower-third line")
    ap.add_argument("--end-tagline", default=None, help="end-card tagline (defaults to --title)")
    ap.add_argument("--endcard-secs", type=float, default=2.3)
    ap.add_argument("--corner-only", action="store_true", help="skip the brand end card (corner logo only)")
    args = ap.parse_args()

    end_tag = args.end_tagline or args.title
    dur = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", args.inp],
        capture_output=True, text=True).stdout.strip())
    ec_start = max(0.0, dur - args.endcard_secs)

    events = [f"Dialogue: 0,0:00:00.40,0:00:04.00,Lower,,0,0,0,,{{\\fad(400,400)}}{args.title}"]
    if not args.corner_only:
        events.append(
            f"Dialogue: 0,{ts(ec_start+0.1)},{ts(dur)},EndTag,,0,0,0,,"
            f"{{\\fad(500,300)\\pos(540,1240)}}{end_tag}")
    ass_path = str(Path(args.out).with_suffix("").as_posix()) + "_brand.ass"
    Path(ass_path).write_text(
        ASS_TEMPLATE.format(font=FONT, sky=SKY_ASS, lgreen=LIGHT_GREEN_ASS,
                            outline=OUTLINE_ASS, events="\n".join(events)),
        encoding="utf-8")

    # Build the filter graph. drawbox paints the Night Sky end card; ass draws text;
    # corner logo through the body; larger centred logo on the end card.
    if args.corner_only:
        fc = (f"[0:v]ass={ass_path}:fontsdir={FONTS_DIR}[bg];"
              f"[1:v]scale=150:-1,format=rgba,colorchannelmixer=aa=0.92[corner];"
              f"[bg][corner]overlay=W-w-30:H-h-44[v]")
        inputs = ["-i", args.inp, "-i", LOGO]
    else:
        fc = (f"[0:v]drawbox=x=0:y=0:w=iw:h=ih:color={NIGHT_SKY_HEX}:t=fill:enable='gte(t,{ec_start})',"
              f"ass={ass_path}:fontsdir={FONTS_DIR}[bg];"
              f"[1:v]scale=150:-1,format=rgba,colorchannelmixer=aa=0.92[corner];"
              f"[2:v]scale=400:-1,format=rgba[big];"
              f"[bg][corner]overlay=W-w-30:H-h-44:enable='lt(t,{ec_start})'[b1];"
              f"[b1][big]overlay=(W-w)/2:600:enable='gte(t,{ec_start})'[v]")
        inputs = ["-i", args.inp, "-i", LOGO, "-i", LOGO]

    cmd = (["ffmpeg", "-y"] + inputs +
           ["-filter_complex", fc, "-map", "[v]", "-map", "0:a",
            "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "copy",
            "-movflags", "+faststart", "-v", "error", args.out])
    r = subprocess.run(cmd)
    if r.returncode != 0:
        print("brand_overlay: ffmpeg failed", file=sys.stderr); sys.exit(1)
    print(f"  brand overlay applied -> {args.out} (end card from {ec_start:.1f}s)"
          if not args.corner_only else f"  corner mark applied -> {args.out}")


if __name__ == "__main__":
    main()
