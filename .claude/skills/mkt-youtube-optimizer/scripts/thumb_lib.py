"""Thumbnail compositing helpers — the primitives behind the four proven patterns.

Import from a per-video generator script:
    import sys; sys.path.insert(0, "<this scripts dir>")
    from thumb_lib import *

Worked example that produced a live thumbnail:
projects/briefs/core-values-cluster/thumbnails/make-thumbs-v2.py
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = "C:/Claude/agent-os-v3/agentic-os"
FONTS = f"{ROOT}/.claude/skills/_assets/fonts"
W, H = 1280, 720

NIGHT_DEEP = (0x1E, 0x1F, 0x22)
CHARCOAL = (0x33, 0x35, 0x38)
PAPER = (0xFA, 0xFA, 0xF8)
GREEN = (163, 214, 84)
RED = (229, 56, 42)
WHITE = (255, 255, 255)

anton = lambda s: ImageFont.truetype(f"{FONTS}/Anton-Regular.ttf", s)
archivo = lambda s: ImageFont.truetype(f"{FONTS}/Archivo-Bold.ttf", s)
ink = lambda s: ImageFont.truetype("C:/Windows/Fonts/Inkfree.ttf", s)


def dark_bg(rim_x=940, rim_y=300):
    """Near-black bg with a soft radial glow where the face sits (quote-card pattern)."""
    bg = Image.new("RGB", (W, H), NIGHT_DEEP)
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse([rim_x - 420, rim_y - 420, rim_x + 420, rim_y + 420], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    return Image.composite(Image.new("RGB", (W, H), (0x45, 0x47, 0x4C)), bg, glow)


def cover(img, w=W, h=H):
    return ImageOps.fit(img.convert("RGB"), (w, h), Image.LANCZOS)


def cutout(path, top_frac=0.72, target_h=int(H * 1.05)):
    """Load a transparent cut-out, crop to head+chest, scale so the face reads BIG.
    Rule: face should end up >= 35% of frame height. NEVER mirror (shirt text reverses)."""
    img = Image.open(path).convert("RGBA")
    img = img.crop(img.getbbox())
    img = img.crop((0, 0, img.width, int(img.height * top_frac)))
    scale = target_h / img.height
    return img.resize((int(img.width * scale), target_h), Image.LANCZOS)


def paste_subject(bg, sub, x=None, y=None):
    """Paste with a soft drop shadow. bg must be RGBA."""
    x = x if x is not None else W - sub.width + 60
    y = y if y is not None else H - sub.height + 40
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    a = sub.split()[3].point(lambda p: int(p * 0.5))
    sh = Image.new("RGBA", sub.size, (0, 0, 0, 255))
    sh.putalpha(a)
    shadow.paste(sh, (x - 14, y + 10), sh)
    bg.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    bg.alpha_composite(sub, (x, y))
    return bg


def chip(d, text="ALL THE POWER", x=42, y=36, on_dark=True):
    f = archivo(30)
    bb = d.textbbox((0, 0), text, font=f)
    pad = 14
    d.rounded_rectangle([x, y, x + bb[2] - bb[0] + pad * 2, y + bb[3] - bb[1] + pad * 2 - 4],
                        radius=10, fill=WHITE if on_dark else CHARCOAL)
    d.text((x + pad, y + pad - bb[1] - 2), text, font=f, fill=CHARCOAL if on_dark else WHITE)


def quote_lines(d, lines, x, y, size=80, gap=14, box_pad=16):
    """DOAC-style quote block. lines: [(text, style)], style None|'green'|'red'.
    Boxed lines get a filled rounded rect; keep total lines <= 5, one idea."""
    f = archivo(size)
    for text, style in lines:
        bb = d.textbbox((x, y), text, font=f)
        if style:
            fill = GREEN if style == "green" else RED
            tcol = CHARCOAL if style == "green" else WHITE
            d.rounded_rectangle([bb[0] - box_pad, bb[1] - box_pad + 4, bb[2] + box_pad, bb[3] + box_pad],
                                radius=12, fill=fill)
            d.text((x, y), text, font=f, fill=tcol)
        else:
            d.text((x, y), text, font=f, fill=WHITE)
        y = bb[3] + gap + (10 if style else 0)
    return y


def circle_cue(d, box, width=12, color=RED):
    for i in range(width):
        d.ellipse([box[0] - i, box[1] - i, box[2] + i, box[3] + i], outline=color)


def cross_out(d, box, width=22, color=RED):
    d.line([(box[0], box[1]), (box[2], box[3])], fill=color, width=width)
    d.line([(box[0], box[3]), (box[2], box[1])], fill=color, width=width)


def artifact_card(img, size=(640, 430), border=14, rotate=3):
    """White-bordered tilted evidence card (Harris pattern)."""
    card = ImageOps.expand(cover(img, *size), border=border, fill=WHITE)
    return card.rotate(rotate, expand=True)


def contact_sheet(paths, out_path, strip=True):
    """2-up contact sheet + 168px legibility strip. VIEW this before presenting."""
    n = len(paths)
    rows = (n + 1) // 2
    sheet = Image.new("RGB", (W * 2 + 30, H * rows + 30 * rows + (200 if strip else 0)), (16, 16, 18))
    for i, p in enumerate(paths):
        sheet.paste(Image.open(p), ((i % 2) * (W + 30), (i // 2) * (H + 30)))
    if strip:
        for i, p in enumerate(paths):
            small = Image.open(p).resize((300, 169), Image.LANCZOS)
            sheet.paste(small, (20 + i * 315, H * rows + 30 * rows + 15))
    sheet.save(out_path, quality=88)
    return out_path


# ---------------------------------------------------------------- ATP House Style (LOCKED 2026-07-04)
# One layout, every video: Night Sky canvas + musk energy glow, subject right,
# <=5 words left with ONE Light-Green boxed phrase, ATP mark in the corner.
# Brand colours ONLY — no red (not an ATP colour).
MUSK = (0x5E, 0x5C, 0x2B)
NIGHT_SKY = (0x33, 0x35, 0x38)
LIGHT_GREEN = (0xB9, 0xB4, 0x7B)
MUSK_PAPER = (0xF4, 0xF3, 0xEC)
SKY = (0xE4, 0xEA, 0xE8)
DUSTY_BLUE = (0x5E, 0x6D, 0x76)
ATP_ICON = f"{ROOT}/brand_context/Branding/ALL THE POWER LOGO/PNG/ALL THE POWER LOGO-17.png"


def atp_dark_bg(rim_x=940, rim_y=300):
    """Night Sky canvas with a musk-green energy glow behind the subject."""
    bg = Image.new("RGB", (W, H), (0x26, 0x27, 0x2A))
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse([rim_x - 430, rim_y - 430, rim_x + 430, rim_y + 430], fill=88)
    glow = glow.filter(ImageFilter.GaussianBlur(170))
    return Image.composite(Image.new("RGB", (W, H), (0x4A, 0x49, 0x2E)), bg, glow)


def atp_icon(bg, pos="tl", width=112, tint=LIGHT_GREEN, opacity=235):
    """Stamp the ATP mark (mitochondria/energy capsule). bg must be RGBA."""
    icon = Image.open(ATP_ICON).convert("RGBA")
    icon = icon.crop(icon.getbbox())
    h = int(icon.height * width / icon.width)
    icon = icon.resize((width, h), Image.LANCZOS)
    a = icon.split()[3].point(lambda p: int(p * opacity / 255))
    solid = Image.new("RGBA", icon.size, tint + (255,))
    solid.putalpha(a)
    x, y = {"tl": (42, 34), "tr": (W - width - 42, 34),
            "bl": (42, H - h - 30), "br": (W - width - 42, H - h - 30)}[pos]
    bg.alpha_composite(solid, (x, y))
    return bg


def atp_quote(d, lines, x=46, y=190, size=82, gap=14):
    """House text block: white sentence case, boxed phrase = Light Green w/ Night Sky text."""
    f = archivo(size)
    for text, boxed in lines:
        bb = d.textbbox((x, y), text, font=f)
        if boxed:
            d.rounded_rectangle([bb[0] - 16, bb[1] - 12, bb[2] + 16, bb[3] + 16], radius=12, fill=LIGHT_GREEN)
            d.text((x, y), text, font=f, fill=NIGHT_SKY)
        else:
            d.text((x, y), text, font=f, fill=WHITE)
        y = bb[3] + gap + (10 if boxed else 0)
    return y
