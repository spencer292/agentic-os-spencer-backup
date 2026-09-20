#!/usr/bin/env python3
"""Build 8-up contact sheets from a folder of reference thumbnails (fetch-ref-thumbs.mjs)."""
import glob, os, sys
from PIL import Image, ImageDraw

folder = sys.argv[1]
files = sorted(glob.glob(os.path.join(folder, "*.jpg")))
files = [f for f in files if "sheet" not in os.path.basename(f)]
W, H, per = 640, 360, 8
for s in range((len(files) + per - 1) // per):
    batch = files[s * per:(s + 1) * per]
    sheet = Image.new("RGB", (W * 2 + 20, (H + 34) * 4 + 10), (15, 15, 17))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(batch):
        img = Image.open(f).convert("RGB").resize((W, H))
        x, y = (i % 2) * (W + 20), (i // 2) * (H + 34)
        sheet.paste(img, (x, y + 28))
        d.text((x + 4, y + 6), os.path.basename(f), fill=(220, 220, 220))
    out = os.path.join(folder, f"refs-sheet-{s+1}.jpg")
    sheet.save(out, quality=85)
    print(out, len(batch))
