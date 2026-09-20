#!/usr/bin/env python3
"""Downscale brand-in-action / template mockups for the deck.

The deck inlines every asset as base64 so the PDF is self-contained. Full-res
AI mockups (2000-2752px, 1-5 MB each) blow the HTML past ~40 MB, and Chrome's
--print-to-pdf silently emits a near-empty PDF when the page is that heavy.

Deck tiles only ever render ~460px wide, so cap the long edge at 1400px and
re-encode photographic mockups as JPEG. KEEP THE FULL-RES ORIGINALS — they are
production deliverables; this only makes lightweight copies for the deck.

Usage:
  python optimize-actions.py <out_dir> <img1> [img2 ...]
  python optimize-actions.py <out_dir> --max 1400 --quality 88 <img...>

Prints one `src -> out` line per file (out paths are what brand-deck.json should
reference). Alpha is flattened onto warm-white (#FBFAF7) — the deck frames every
mockup on a white card anyway.
"""
import sys, os
from PIL import Image

MAX = 1400
QUALITY = 88
BG = (251, 250, 247)  # warm white #FBFAF7


def main(argv):
    if len(argv) < 2:
        print("usage: optimize-actions.py <out_dir> [--max N] [--quality N] <img...>", file=sys.stderr)
        return 2
    out_dir = argv[0]
    files, max_edge, quality = [], MAX, QUALITY
    i = 1
    while i < len(argv):
        a = argv[i]
        if a == "--max":
            max_edge = int(argv[i + 1]); i += 2; continue
        if a == "--quality":
            quality = int(argv[i + 1]); i += 2; continue
        files.append(a); i += 1

    os.makedirs(out_dir, exist_ok=True)
    for src in files:
        im = Image.open(src)
        # flatten any alpha onto warm white
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, BG)
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert("RGB")
        if max(im.size) > max_edge:
            im.thumbnail((max_edge, max_edge), Image.LANCZOS)
        base = os.path.splitext(os.path.basename(src))[0]
        out = os.path.join(out_dir, base + ".jpg")
        im.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
        print(f"{src} -> {out}  ({im.size[0]}x{im.size[1]}, {os.path.getsize(out)//1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
