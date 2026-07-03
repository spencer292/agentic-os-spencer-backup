#!/usr/bin/env python3
"""
Layered podcast YouTube thumbnail generator  (Power Movers Podcast).

Architecture (locked 2026-06-21 — never one AI pass for faces or text):
  1. BACKGROUND  : procedural charcoal + radial spotlight + grain (default),
                   or a Gemini-rendered branded plate (--gemini-bg).
  2. FACES       : REAL cut-out photos, composited deterministically.
                     host  = transparent ATP cut-out PNG (already alpha)
                     guest = raw photo -> Gemini chroma-isolate (#00FF00) ->
                             Pillow green-key -> transparent cut-out (cached)
  3. TEXT        : Pillow / real type (Anton). Hook with ONE highlighted keyword
                   in a rotating per-variant accent, + guest name + credential,
                   + POWER MOVERS wordmark. Never AI-drawn.

Outputs 4 variants + a 2x2 comparison grid.  Re-running reuses cached AI assets
(bg plate + guest cut-out) unless --force, so text/layout iterate for free.

Usage:
  python scripts/podcast/thumbgen.py \
      --guest-img assets/nicky-raw.jpg \
      --hook "THE OWNER'S TRAP" --highlight TRAP \
      --guest-name "Nicky Billou" --credential "Founder, eCircle Academy" \
      --out projects/.../ep61-test [--gemini-bg] [--force]
"""
import argparse, base64, json, math, os, sys, urllib.request
from PIL import (Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps)

ROOT = "C:/Claude/agent-os-v3/agentic-os"
FONT_DIR = f"{ROOT}/.claude/skills/_assets/fonts"
WIN_FONTS = "C:/Windows/Fonts"
W, H = 1280, 720

# Brand palette
NIGHT = (0x33, 0x35, 0x38)      # Night Sky charcoal
SKY   = (0xE9, 0xED, 0xEB)      # off-white text
# Rotating accents — punchy on charcoal but NOT acid-lime (rejected). One per variant.
ACCENTS = [
    ("amber", (255, 184, 28)),
    ("coral", (255, 107, 64)),
    ("cyan",  (74, 201, 224)),
    ("green", (163, 214, 84)),
]


# ---------------------------------------------------------------- env / gemini
def load_env():
    env = {}
    with open(f"{ROOT}/.env", encoding="utf-8") as fh:
        for line in fh:
            m = line.strip()
            if "=" in m and not m.startswith("#"):
                k, v = m.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def gemini_image(prompt, input_paths=None, key=None):
    """Call Gemini 3 Pro Image; return PNG/JPEG bytes of the first image part."""
    parts = [{"text": prompt}]
    for p in (input_paths or []):
        mime = "image/png" if p.lower().endswith(".png") else "image/jpeg"
        with open(p, "rb") as fh:
            parts.append({"inline_data": {"mime_type": mime,
                                          "data": base64.b64encode(fh.read()).decode()}})
    body = json.dumps({"contents": [{"parts": parts}],
                       "generationConfig": {"responseModalities": ["Text", "Image"]}}).encode()
    url = ("https://generativelanguage.googleapis.com/v1beta/models/"
           f"gemini-3-pro-image-preview:generateContent?key={key}")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        j = json.loads(r.read())
    for part in j.get("candidates", [{}])[0].get("content", {}).get("parts", []):
        d = part.get("inlineData", {}).get("data") or part.get("inline_data", {}).get("data")
        if d:
            return base64.b64decode(d)
    raise RuntimeError("No image in Gemini response: " + json.dumps(j)[:400])


# ---------------------------------------------------------------- cut-out / fx
def chroma_key_green(img, threshold=70, feather=1.1):
    """Key out a flat green (#00FF00-ish) background -> transparent RGBA, despilled."""
    img = img.convert("RGB")
    r, g, b = img.split()
    rb_max = ImageChops.lighter(r, b)
    green_excess = ImageChops.subtract(g, rb_max)         # high where green dominates
    alpha = green_excess.point(lambda v: 0 if v > threshold else 255)
    alpha = alpha.filter(ImageFilter.GaussianBlur(feather))
    g2 = ImageChops.subtract(g, green_excess)             # despill: clamp green
    out = Image.merge("RGB", (r, g2, b)).convert("RGBA")
    out.putalpha(alpha)
    bbox = alpha.point(lambda v: 255 if v > 25 else 0).getbbox()
    if bbox:
        out = out.crop(bbox)
    return out


def bust_crop(img, keep=0.60):
    """Crop a cut-out to head + shoulders so its head fills the frame (matches a
    head-and-shoulders guest). keep = fraction of the alpha bbox height kept from top."""
    a = img.getchannel("A")
    bbox = a.getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop((l, t, r, t + int((b - t) * keep)))


def drop_shadow(subj, blur=16, opacity=170, offset=(6, 14)):
    a = subj.getchannel("A")
    layer = Image.new("RGBA", (subj.width + 60, subj.height + 60), (0, 0, 0, 0))
    blk = Image.new("RGBA", subj.size, (0, 0, 0, opacity))
    layer.paste(blk, (30 + offset[0], 30 + offset[1]), a)
    return layer.filter(ImageFilter.GaussianBlur(blur)), (-30, -30)


def rim_light(subj, color, grow=3, blur=2, opacity=220):
    a = subj.getchannel("A")
    big = a.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    ring = ImageChops.subtract(big, a)
    rim = Image.new("RGBA", subj.size, (0, 0, 0, 0))
    rim.paste(Image.new("RGBA", subj.size, color + (opacity,)), (0, 0), ring)
    return rim.filter(ImageFilter.GaussianBlur(blur))


# ---------------------------------------------------------------- backgrounds
DEEP = (0x1a, 0x1c, 0x1e)        # deep near-black base (matches Gemini plate depth)


def procedural_bg(spot=(0.40, 0.36), accent=(255, 184, 28)):
    big = Image.radial_gradient("L").resize((int(W * 1.9), int(H * 1.9)))  # center 0 -> edge 255
    cx, cy = spot[0] * W, spot[1] * H
    left, top = int(big.width / 2 - cx), int(big.height / 2 - cy)
    grad = big.crop((left, top, left + W, top + H))

    bg = Image.new("RGB", (W, H), DEEP)
    lighter = tuple(min(255, c + 40) for c in DEEP)                     # subtle spotlight lift
    spotmask = ImageOps.invert(grad).point(lambda v: int(v * 0.9))      # bright center
    bg = Image.composite(Image.new("RGB", (W, H), lighter), bg, spotmask)

    # faint accent wash in the spotlight, very subtle
    tint = Image.new("RGB", (W, H), accent)
    bg = Image.composite(tint, bg, ImageOps.invert(grad).point(lambda v: int(v * 0.05)))

    vig = grad.point(lambda v: 255 - int(v * 0.62))                     # deep edge falloff
    bg = ImageChops.multiply(bg, Image.merge("RGB", [vig] * 3))

    noise = Image.effect_noise((W, H), 8).convert("RGB")
    bg = Image.blend(bg, noise, 0.03)
    return bg.convert("RGBA")


def gemini_bg(key, cache):
    if os.path.exists(cache):
        return Image.open(cache).convert("RGBA").resize((W, H))
    prompt = (
        "Create a 1280x720 16:9 YouTube thumbnail BACKGROUND PLATE only. "
        "Absolutely NO people, NO text, NO logos, NO objects. "
        "A premium dark studio backdrop: deep near-black charcoal (hex #2c2f32 to #333538), "
        "a soft off-centre radial spotlight upper-left, gentle film grain and a faint subtle "
        "vignette darkening the edges. Cinematic, low-saturation, lots of clean negative space "
        "so foreground faces and bold text will pop. Output exactly 1280x720.")
    png = gemini_image(prompt, key=key)
    with open(cache, "wb") as fh:
        fh.write(png)
    return Image.open(cache).convert("RGBA").resize((W, H))


def bottom_scrim(strength=190, start=0.46):
    sc = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(sc)
    for y in range(H):
        if y > H * start:
            t = (y - H * start) / (H * (1 - start))
            d.line([(0, y), (W, y)], fill=int((t ** 1.3) * strength))
    overlay = Image.new("RGBA", (W, H), (8, 9, 10, 0))
    overlay.putalpha(sc)
    return overlay


def top_scrim(strength=160, end=0.20):
    sc = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(sc)
    for y in range(int(H * end)):
        t = 1 - (y / (H * end))
        d.line([(0, y), (W, y)], fill=int((t ** 1.2) * strength))
    overlay = Image.new("RGBA", (W, H), (8, 9, 10, 0))
    overlay.putalpha(sc)
    return overlay


# ---------------------------------------------------------------- text
def font(path, size):
    return ImageFont.truetype(path, size)


ANTON = f"{FONT_DIR}/Anton-Regular.ttf"
ARIAL_B = f"{WIN_FONTS}/arialbd.ttf"
ARIAL = f"{WIN_FONTS}/arial.ttf"


def wrap_words(draw, words, fnt, max_w):
    lines, cur = [], []
    for w in words:
        trial = " ".join(cur + [w])
        if draw.textlength(trial, font=fnt) <= max_w or not cur:
            cur.append(w)
        else:
            lines.append(cur)
            cur = [w]
    if cur:
        lines.append(cur)
    return lines


def draw_hook(base, text, highlight, accent, box, max_size=128):
    """Draw hook ALL CAPS, wrapped, with highlighted word(s) in accent. Bottom-anchored in box."""
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    hl = {h.upper().strip(",.!?") for h in highlight.split()}
    words = text.upper().split()
    draw = ImageDraw.Draw(base)

    size = max_size
    while size > 40:
        fnt = font(ANTON, size)
        lines = wrap_words(draw, words, fnt, bw)
        line_h = int(size * 1.02)
        total_h = line_h * len(lines)
        widest = max(draw.textlength(" ".join(l), font=fnt) for l in lines)
        if total_h <= bh and widest <= bw:
            break
        size -= 4

    fnt = font(ANTON, size)
    line_h = int(size * 1.02)
    total_h = line_h * len(lines)
    space = draw.textlength(" ", font=fnt)
    sw = max(6, int(size * 0.085))                      # stroke width

    # shadow layer (soft, behind)
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)

    y = y1 - total_h
    for line in lines:
        widths = [draw.textlength(w, font=fnt) for w in line]
        lw = sum(widths) + space * (len(line) - 1)
        x = x0 + (bw - lw) / 2
        for w, ww in zip(line, widths):
            sdraw.text((x + 5, y + 6), w, font=fnt, fill=(0, 0, 0, 200))
            col = accent if w.strip(",.!?") in hl else SKY
            draw.text((x, y), w, font=fnt, fill=col, stroke_width=sw, stroke_fill=(0, 0, 0))
            x += ww + space
        y += line_h

    shadow = shadow.filter(ImageFilter.GaussianBlur(9))
    base.alpha_composite(shadow)
    # redraw text on top of its own shadow
    y = y1 - total_h
    for line in lines:
        widths = [draw.textlength(w, font=fnt) for w in line]
        lw = sum(widths) + space * (len(line) - 1)
        x = x0 + (bw - lw) / 2
        for w, ww in zip(line, widths):
            col = accent if w.strip(",.!?") in hl else SKY
            draw.text((x, y), w, font=fnt, fill=col, stroke_width=sw, stroke_fill=(0, 0, 0))
            x += ww + space
        y += line_h
    return y1


def draw_wordmark(base, accent):
    d = ImageDraw.Draw(base)
    fnt = font(ANTON, 30)
    # letter-spaced wordmark
    x, y = 38, 34
    label = "POWER MOVERS"
    for ch in label:
        d.text((x, y), ch, font=fnt, fill=SKY, stroke_width=2, stroke_fill=(0, 0, 0))
        x += d.textlength(ch, font=fnt) + 4
    d.line([(40, y + 44), (x - 4, y + 44)], fill=accent, width=4)


def draw_name(base, name, credential, accent, top_y=26, maxw=690):
    """Centred top-band kicker: NAME (accent)  ·  CREDENTIAL (white). Auto-shrinks to fit
    a safe width so it never collides with the POWER MOVERS wordmark on the left."""
    d = ImageDraw.Draw(base)
    name = name.upper()
    cred = credential.upper()
    sep = "   ·   "
    size = 27
    while size >= 17:
        nf = font(ARIAL_B, size)
        segs = [(name, accent)] + ([(sep, accent), (cred, SKY)] if cred else [])
        total = sum(d.textlength(t, font=nf) for t, _ in segs)
        if total <= maxw:
            break
        size -= 1
    x = (W - total) / 2
    for t, col in segs:
        d.text((x, top_y), t, font=nf, fill=col, stroke_width=2, stroke_fill=(0, 0, 0))
        x += d.textlength(t, font=nf)


# ---------------------------------------------------------------- compose
def place(base, subj, target_h, cx, bottom_y, accent, rim_on=True):
    scale = target_h / subj.height
    s = subj.resize((max(1, int(subj.width * scale)), target_h), Image.LANCZOS)
    x = int(cx - s.width / 2)
    y = int(bottom_y - s.height)
    sh, off = drop_shadow(s)
    base.alpha_composite(sh, (x + off[0], y + off[1]))
    if rim_on:
        base.alpha_composite(rim_light(s, accent), (x, y))
    base.alpha_composite(s, (x, y))
    return x, y, s


def build_variant(bg_base, host_png, guest_cut, hook, highlight, name, credential,
                  accent, layout, show_name=False):
    base = bg_base.copy()
    host = bust_crop(Image.open(host_png).convert("RGBA"))

    # Guest dominant on RIGHT, host (matched bust) on LEFT. Bottom-aligned, heads high.
    place(base, guest_cut, int(H * layout["guest_h"]), W * layout["guest_cx"],
          H * layout["guest_by"], accent)
    place(base, host, int(H * layout["host_h"]), W * layout["host_cx"],
          H * layout["host_by"], accent, rim_on=True)

    base.alpha_composite(bottom_scrim())
    base.alpha_composite(top_scrim())
    draw_wordmark(base, accent)
    if show_name:
        draw_name(base, name, credential, accent, top_y=26)
    draw_hook(base, hook, highlight, accent,
              box=(70, int(H * 0.66), W - 70, int(H * 0.95)))
    return base.convert("RGB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--guest-img", help="raw guest photo (will be matted)")
    ap.add_argument("--guest-cut", help="pre-cut transparent guest PNG (skip Gemini matte)")
    ap.add_argument("--hook", required=True)
    ap.add_argument("--highlight", default="")
    ap.add_argument("--guest-name", required=True)
    ap.add_argument("--credential", default="")
    ap.add_argument("--host-imgs", default="05092023_ATP_014.png,05092023_ATP_008.png,"
                                           "05022023_ATP_002.png,05092023_ATP_014.png",
                    help="comma list of ATP png filenames (cycled per variant)")
    ap.add_argument("--host-dir", default="C:/photography/Me pics")
    ap.add_argument("--out", required=True)
    ap.add_argument("--gemini-bg", action="store_true")
    ap.add_argument("--hide-name", dest="show_name", action="store_false",
                    help="hide the guest name + credential kicker (on by default)")
    ap.add_argument("--accent", help="render only this accent (amber|coral|cyan|green); "
                                     "skips the grid. Omit to render all 4 + grid.")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    env = load_env()
    key = env.get("GEMINI_API_KEY") or env.get("GOOGLE_API_KEY")
    os.makedirs(a.out, exist_ok=True)
    cache = os.path.join(a.out, "assets")
    os.makedirs(cache, exist_ok=True)

    # --- guest cut-out (cached) -------------------------------------------------
    if a.guest_cut:
        guest_cut = Image.open(a.guest_cut).convert("RGBA")
    else:
        cut_path = os.path.join(cache, "guest-cut.png")
        if a.force or not os.path.exists(cut_path):
            print("Matting guest via Gemini...")
            prompt = (
                "Cut out ONLY this person — head, hair and shoulders, upper chest. "
                "PRESERVE their exact face and likeness; do not alter, beautify, age or "
                "invent features. Place them on a COMPLETELY FLAT PURE GREEN background "
                "hex #00FF00, edge to edge, no gradient, no shadow, no other objects. Keep "
                "their natural clothing and colours. Clean studio cut-out, sharp edges.")
            png = gemini_image(prompt, input_paths=[a.guest_img], key=key)
            raw = os.path.join(cache, "guest-green.png")
            with open(raw, "wb") as fh:
                fh.write(png)
            cut = chroma_key_green(Image.open(raw))
            cut.save(cut_path)
            print("  saved", cut_path, cut.size)
        guest_cut = Image.open(cut_path).convert("RGBA")

    # --- background -------------------------------------------------------------
    # faces lowered slightly to open a clean top band for the kicker
    layout = dict(guest_h=0.90, guest_cx=0.72, guest_by=1.05,
                  host_h=0.86, host_cx=0.25, host_by=1.07)

    hosts = [h.strip() for h in a.host_imgs.split(",")]
    accents = ACCENTS
    if a.accent:
        accents = [x for x in ACCENTS if x[0] == a.accent.lower()]
        if not accents:
            print("unknown accent", a.accent, "- options: amber coral cyan green")
            return
    outs = []
    for i, (aname, acol) in enumerate(accents):
        if a.gemini_bg:
            bg = gemini_bg(key, os.path.join(cache, "bg-gemini.png"))
        else:
            bg = procedural_bg(accent=acol)
        host_png = os.path.join(a.host_dir, hosts[i % len(hosts)])
        img = build_variant(bg, host_png, guest_cut, a.hook, a.highlight,
                            a.guest_name, a.credential, acol, layout, show_name=a.show_name)
        op = os.path.join(a.out, f"variant-{i+1}-{aname}.jpg")
        img.save(op, "JPEG", quality=90)
        outs.append(op)
        print("saved", op, f"({os.path.getsize(op)//1024} KB)")

    # --- 2x2 grid ---------------------------------------------------------------
    if len(outs) < 2:
        return
    grid = Image.new("RGB", (W, H), (20, 21, 22))
    for idx, op in enumerate(outs):
        thumb = Image.open(op).resize((W // 2 - 6, H // 2 - 6))
        gx = (idx % 2) * (W // 2) + 4
        gy = (idx // 2) * (H // 2) + 4
        grid.paste(thumb, (gx, gy))
    gpath = os.path.join(a.out, "grid-2x2.jpg")
    grid.save(gpath, "JPEG", quality=90)
    print("saved", gpath)


if __name__ == "__main__":
    main()
