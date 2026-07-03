"""Generate a cover/thumbnail image for a short-form clip.

Grabs a frame from the (clean, un-captioned) reframed clip, darkens it with a
scrim for legibility, and lays a kicker + big bold title (with one gold accent
word) over it. Output is a 1080x1920 PNG to set as the post COVER at upload —
NOT a frame prepended to the video (a static intro card kills first-second
retention; the cover is a separate grid image).

Usage:
    python make_cover.py --video reframed.mp4 --time 22 \
        --title "The Stress No One Admits" --accent "Stress" \
        --kicker "POWER MOVERS" --out cover.png \
        --fontsdir skill-pack/assets/fonts
"""

import argparse
import os
import subprocess
import tempfile


def hex_inline(hex_color):
    h = hex_color.lstrip("#")
    return f"&H{h[4:6]}{h[2:4]}{h[0:2]}".upper() + "&"


def build_cover_ass(title, kicker, accent, font, title_size, gold, white):
    # Uppercase the visible WORDS only — never the ASS override tags, or
    # `\c` becomes `\C` and the colour override silently fails.
    words = title.split()
    if accent:
        rendered = []
        for w in words:
            bare = w.strip(".,!?'\"").lower()
            wu = w.upper()
            if bare == accent.strip().lower():
                rendered.append(f"{{\\c{gold}}}{wu}{{\\c{white}}}")
            else:
                rendered.append(wu)
        title_text = " ".join(rendered)
    else:
        title_text = title.upper()

    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Kicker,{font},46,{gold},{gold},&H00000000&,&H00000000&,1,0,0,0,100,100,8,0,1,0,0,8,80,80,110,1
Style: Title,{font},{title_size},{white},{white},&H00000000&,&H00000000&,1,0,0,0,100,100,0,0,1,4,2,5,90,90,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Kicker,,0,0,0,,{kicker.upper()}
Dialogue: 0,0:00:00.00,0:00:05.00,Title,,0,0,0,,{title_text}
"""
    return head


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--video", required=True)
    p.add_argument("--time", type=float, default=None, help="frame timestamp (s); default = 38 pct of duration")
    p.add_argument("--title", required=True)
    p.add_argument("--accent", default="")
    p.add_argument("--kicker", default="POWER MOVERS")
    p.add_argument("--out", required=True)
    p.add_argument("--font", default="Montserrat")
    p.add_argument("--font-size", type=int, default=124)
    p.add_argument("--highlight", default="#F8D481")
    p.add_argument("--scrim", type=float, default=0.35)
    p.add_argument("--fontsdir", default="")
    args = p.parse_args()

    gold = hex_inline(args.highlight)
    white = hex_inline("#FFFFFF")

    # default frame = 38% in (usually mid-gesture, animated)
    t = args.time
    if t is None:
        dur = float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", args.video],
            capture_output=True, text=True, check=True).stdout.strip())
        t = dur * 0.38

    ass = build_cover_ass(args.title, args.kicker, args.accent, args.font,
                          args.font_size, gold, white)
    # Write the ASS beside the output using a RELATIVE path — an absolute Windows
    # path (C:/...) breaks the ffmpeg `ass` filter (drive colon parsed as option).
    out_dir = os.path.dirname(args.out) or "."
    base = os.path.splitext(os.path.basename(args.out))[0]
    ass_path = os.path.join(out_dir, f"_{base}.ass").replace("\\", "/")
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass)

    fontsdir = f":fontsdir={args.fontsdir}" if args.fontsdir else ""
    # darken whole frame with a scrim, then a stronger centre band behind title,
    # then burn the title/kicker.
    vf = (
        f"drawbox=x=0:y=0:w=iw:h=ih:color=black@{args.scrim}:t=fill,"
        f"drawbox=x=0:y=ih*0.32:w=iw:h=ih*0.40:color=black@0.30:t=fill,"
        f"ass={ass_path}{fontsdir}"
    )
    cmd = [
        "ffmpeg", "-y", "-ss", f"{t}", "-i", args.video,
        "-frames:v", "1", "-vf", vf, args.out, "-v", "error",
    ]
    subprocess.run(cmd, check=True)
    os.unlink(ass_path)
    print(f"cover -> {args.out} (frame @ {t:.1f}s, accent='{args.accent}')")


if __name__ == "__main__":
    main()
