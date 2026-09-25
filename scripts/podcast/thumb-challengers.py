#!/usr/bin/env python
"""
Thumbnail challengers for the Power Movers Podcast - built to the ATP brand spec.

Answers one question: is the locked two-cut-out layout the right design, or just
the one that got locked? The 168px contact sheet of eps 61-87 says no - the host
cut-out is byte-identical on every tile, so at feed size nothing separates one
episode from another but the headline band.

BRAND (brand_context/Branding/ALL_THE_POWER_Brand_Guidelines_Summary.md), which
the previous engine was not following:
  - "Podcast artwork uses the musk green or night sky backgrounds with the
     BN Dime Display font for episode titles" - quoted directly from the guidelines.
  - Night Sky #333538 / Musk Green #5E5C2B backgrounds. On Night Sky, Musk Green
    is an explicitly disallowed accent.
  - Accents: Light Green #B9B47B, Dusty Blue #5E6D76, Light Blue #A3B5B8, Sky #E4EAE8.
  - BN Dime Display for titles, Montserrat Bold for names/subheads.
  - The logo is used as supplied - never recoloured, rotated, reshaped or shadowed.

NO MATTING. All three challengers use the guest's real photograph untouched, in a
frame or full-bleed. Nothing hands a person to an image model to be redrawn, which
is both the brand rule ("REAL photography only - NO AI generation") and the direct
cause of the ep 87 failure where the host was replaced by a second copy of the guest.

FRAMING is measured, never guessed - see thumb_faces.py. The first version of this
script used a resize-to-cover with a hardcoded bias and cropped the host's head off
above the eyes.

  C1  duo-panel      - two framed photo panels, headline band beneath
  C2  guest-dominant - guest full-bleed right, headline left, host + studio mic
  C3  portrait-panel - headline left, guest in a tall portrait frame right

Usage:
  python scripts/podcast/thumb-challengers.py --ep 87 --guest "Steve Schroeder" \
      --photo <raw.jpg> --hook "STOP BEING THE BOTTLENECK" --accent light-green \
      --host 05092023_ATP_014.png --out <dir> [--bg musk-green]
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from thumb_faces import find_face, frame_face          # noqa: E402

ROOT = "C:/Claude/agent-os-v3/agentic-os"
BRAND = f"{ROOT}/brand_context/Branding"
FONT_DIR = f"{BRAND}/FONTS"
HOST_DIR = f"{ROOT}/projects/briefs/core-values-cluster/thumbnails/cutouts-nologo"
# Secondary logo (mark + wordmark), white on dark. Variant 22 is the bare mark -
# it is the "confined spaces" logo per the guidelines (favicons, profile pics) and
# renders as an unreadable smudge at thumbnail scale. 16 reads at 168px.
LOGO = f"{BRAND}/ALL THE POWER LOGO/PNG/ALL THE POWER LOGO-16.png"
LOGO_ON_LIGHT = f"{BRAND}/ALL THE POWER LOGO/PNG/ALL THE POWER LOGO-15.png"
# The show's own microphone, keyed off the flat Musk Green ground of the official
# PODCAST COVER DARK template. Real brand photography, not a drawn icon and not a
# generated one - it signals "this is a podcast" in the grid, which a talking-heads
# thumbnail otherwise does not.
MIC = f"{BRAND}/PODCAST POST AND STORY/mic-cutout.png"

W, H = 1280, 720

# ---- brand palette (exact hex from the guidelines) --------------------------
MUSK_GREEN = (0x5E, 0x5C, 0x2B)
NIGHT_SKY = (0x33, 0x35, 0x38)
LIGHT_GREEN = (0xB9, 0xB4, 0x7B)
DUSTY_BLUE = (0x5E, 0x6D, 0x76)
LIGHT_BLUE = (0xA3, 0xB5, 0xB8)
SKY = (0xE4, 0xEA, 0xE8)

BACKGROUNDS = {"night-sky": NIGHT_SKY, "musk-green": MUSK_GREEN}
# Only two of the four brand accents actually work as the highlight colour on a
# Night Sky ground. Sky #E4EAE8 IS the body-text colour, so a payoff word set in it
# is invisible as a highlight (seen on ep 83). Dusty Blue #5E6D76 is barely lighter
# than the ground. That leaves Light Green and Light Blue - a real constraint on how
# much the accent can rotate, so variety has to come from the Musk Green ground.
ACCENTS = {"light-green": LIGHT_GREEN, "light-blue": LIGHT_BLUE}
UNUSABLE_AS_HIGHLIGHT = {"sky": SKY, "dusty-blue": DUSTY_BLUE}
# The guidelines' colour-usage table: Musk Green may not sit on Night Sky, and
# Light Green may not sit on Light Blue. Encoded so a bad pairing cannot ship.
FORBIDDEN = {"night-sky": {"musk-green"}, "musk-green": set()}

# Hook legibility gate, locked 2026-08-17. The spec is 3-4 words; word COUNT is not
# the constraint and measurement proved it - THE HANDOVER THAT HELD (4 words) and
# THE HANDOVER HELD (3 words) both render at 100pt, and SELL WHAT YOU KNOW (4 words,
# 104pt) beats YOUR KNOWLEDGE PAYS (3 words, 94pt). What drives type size down is the
# LONGEST SINGLE WORD, because it sets the minimum line width. So the gate is on the
# achieved point size, which is the thing that actually affects legibility at 168px.
HOOK_MIN_PT = 90
C2_HOOK_BOX = (52, 132, int(W * 0.50), 452)      # the locked design's headline box

DIME = f"{FONT_DIR}/BNDimeDisplay.otf"
MONT_B = f"{FONT_DIR}/Montserrat-Bold.ttf"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


# ------------------------------------------------------------------ background
def brand_bg(bg_rgb, accent, spot=(0.5, 0.42)):
    """Flat brand ground with a soft spotlight lift. No third colour introduced -
    the lift is the same hue, raised in value."""
    bg = Image.new("RGB", (W, H), bg_rgb)
    grad = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(grad)
    cx, cy = int(W * spot[0]), int(H * spot[1])
    for i in range(60, 0, -1):
        r = int(max(W, H) * 0.95 * i / 60)
        d.ellipse([cx - r, cy - int(r * 0.75), cx + r, cy + int(r * 0.75)],
                  fill=int(255 * (1 - i / 60)))
    lift = tuple(min(255, c + 26) for c in bg_rgb)
    bg = Image.composite(Image.new("RGB", (W, H), lift), bg, grad)
    return bg.convert("RGBA")


def rounded(img, radius, border=None, bw=5):
    im = img.convert("RGBA")
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1],
                                           radius=radius, fill=255)
    im.putalpha(mask)
    if border:
        ImageDraw.Draw(im).rounded_rectangle(
            [bw // 2, bw // 2, im.size[0] - 1 - bw // 2, im.size[1] - 1 - bw // 2],
            radius=radius, outline=border + (240,), width=bw)
    return im


def shadow_paste(base, layer, xy, blur=24, opacity=140, offset=(0, 12)):
    sh = Image.new("RGBA", base.size, (0, 0, 0, 0))
    solid = Image.new("RGBA", layer.size, (0, 0, 0, opacity))
    solid.putalpha(Image.composite(solid.split()[3], Image.new("L", layer.size, 0),
                                   layer.split()[3]))
    sh.paste(solid, (xy[0] + offset[0], xy[1] + offset[1]), solid)
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    base.alpha_composite(layer, xy)


def scrim(base, strength=205, start=0.40, top=False):
    sc = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(sc)
    if top:
        for y in range(int(H * start)):
            d.line([(0, y), (W, y)], fill=int(strength * (1 - y / (H * start))))
    else:
        y0 = int(H * start)
        for y in range(y0, H):
            d.line([(0, y), (W, y)], fill=int(strength * ((y - y0) / (H - y0)) ** 1.35))
    ov = Image.new("RGBA", (W, H), (0x1A, 0x1B, 0x1C, 0))
    ov.putalpha(sc)
    base.alpha_composite(ov)


# ------------------------------------------------------------------------ text
# Short function words look wrong stranded on a line of their own - "STOP BEING /
# THE / BOTTLENECK" reads as a mistake even though it fits. They get a heavy penalty
# so the breaker moves them up to join the next word.
ORPHANS = {"A", "AN", "THE", "TO", "OF", "IS", "IT", "IN", "ON", "AT", "AND", "OR",
           "FOR", "BE", "SO", "AS", "MY", "YOU", "YOUR", "WHO", "WHY", "HOW"}


def balanced_lines(draw, words, fnt, max_w, n):
    """Split words into exactly n lines with minimum raggedness.

    Greedy first-fit wrapping packs each line as full as possible, which is why the
    old version produced "STOP BEING / THE / BOTTLENECK": it filled line 1, then had
    to strand THE. This weighs every legal partition by how much slack each line
    leaves, squared, so the lines come out even - and penalises a lone short function
    word hard enough that it is never chosen when an alternative exists.

    Returns None if the words cannot be fitted into n lines at this size.
    """
    N = len(words)
    if n > N:
        return None
    widths = [draw.textlength(w, font=fnt) for w in words]
    space = draw.textlength(" ", font=fnt)

    def line_w(i, j):
        return sum(widths[i:j]) + space * (j - i - 1)

    INF = float("inf")
    memo = {}

    def solve(k, i):
        if k == 0:
            return (0, []) if i == N else (INF, [])
        if (k, i) in memo:
            return memo[(k, i)]
        best = (INF, [])
        for j in range(i + 1, N - k + 2):
            w = line_w(i, j)
            if w > max_w:
                break
            cost = (max_w - w) ** 2
            if j - i == 1 and words[i] in ORPHANS:
                cost += (max_w * 2.0) ** 2
            sub_cost, sub = solve(k - 1, j)
            if sub_cost < INF and cost + sub_cost < best[0]:
                best = (cost + sub_cost, [(i, j)] + sub)
        memo[(k, i)] = best
        return best

    cost, parts = solve(n, 0)
    return None if cost == INF else [words[i:j] for i, j in parts]


def fit_hook(text, box, max_size=104, max_lines=3):
    """Resolve the point size and line break a hook WOULD render at, without drawing.
    Shares its fitting logic with draw_hook so the gate cannot disagree with reality."""
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    words = text.upper().split()
    d = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    size = max_size
    while size > 24:
        fnt = font(DIME, size)
        lh = int(size * 1.06)
        for n in range(1, min(max_lines, len(words)) + 1):
            if n * lh > bh:
                break
            lines = balanced_lines(d, words, fnt, bw, n)
            if lines:
                return size, [" ".join(l) for l in lines]
        size -= 2
    return size, None


def check_hook_gate(text, box=None, min_pt=HOOK_MIN_PT):
    """Return (ok, size, lines, diagnosis). The offending element is named so the fix
    is obvious - it is almost always one long compound word, not the word count."""
    size, lines = fit_hook(text, box or C2_HOOK_BOX)
    if size >= min_pt:
        return True, size, lines, ""
    longest = max(text.upper().split(), key=len)
    return (False, size, lines,
            f"hook renders at {size}pt, below the {min_pt}pt legibility gate. "
            f"Longest word is {longest!r} ({len(longest)} chars) — that is what forces "
            f"the type down, not the word count. Reword to shorten the longest word; "
            f"3 or 4 words are equally fine.")


def draw_hook(base, text, accent, box, max_size=132, align="center", highlight=None,
              max_lines=3):
    """Episode title in BN Dime Display, per the guidelines. The payoff word takes
    the accent - the one element that survives the 168px sidebar test.

    Picks the largest point size that fits, and at that size the most balanced line
    break rather than the greedy one.
    """
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    words = text.upper().split()
    hl = (highlight or words[-1]).upper()
    d = ImageDraw.Draw(base)

    chosen, size = None, max_size
    while size > 24:
        fnt = font(DIME, size)
        lh = int(size * 1.06)
        for n in range(1, min(max_lines, len(words)) + 1):
            if n * lh > bh:
                break
            lines = balanced_lines(d, words, fnt, bw, n)
            if lines:
                chosen = lines
                break
        if chosen:
            break
        size -= 2
    if not chosen:                              # last resort - never drop the title
        fnt = font(DIME, size)
        chosen = [words]

    fnt = font(DIME, size)
    lh = int(size * 1.06)
    space = d.textlength(" ", font=fnt)
    y = y0 + (bh - len(chosen) * lh) // 2 if align == "center" else y0
    sw = max(2, size // 24)
    for line in chosen:
        widths = [d.textlength(wd, font=fnt) for wd in line]
        total = sum(widths) + space * (len(line) - 1)
        x = x0 + (bw - total) / 2 if align == "center" else x0
        for wd, wdt in zip(line, widths):
            d.text((x, y), wd, font=fnt, fill=accent if wd == hl else SKY,
                   stroke_width=sw, stroke_fill=(0x1A, 0x1B, 0x1C))
            x += wdt + space
        y += lh
    return size


def place_logo(base, xy=(34, 26), height=58):
    """The supplied logo, scaled only. Never recoloured or reshaped."""
    try:
        lg = Image.open(LOGO).convert("RGBA")
    except Exception:
        return
    w = int(lg.width * height / lg.height)
    base.alpha_composite(lg.resize((w, height), Image.LANCZOS), xy)


def tracked(draw, xy, text, fnt, fill, tracking=3.0, stroke=2):
    """Letter-spaced text. The show line is small and set in caps; a little tracking
    is what stops it reading as a cramped label."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill, stroke_width=stroke,
                  stroke_fill=(0x1A, 0x1B, 0x1C))
        x += draw.textlength(ch, font=fnt) + tracking
    return x - tracking - xy[0]


def tracked_width(draw, text, fnt, tracking=3.0):
    return sum(draw.textlength(c, font=fnt) for c in text) + tracking * (len(text) - 1)


def host_block(base, show, host_name, accent, x, cy, max_w):
    """Show name over host name, sat beside the host circle.

    Replaces the studio microphone. The mic tested badly, and it was also carrying
    the whole job of saying "this is a podcast" - which the show's actual name does
    better, and which nothing on the thumbnail was doing before. The host was
    unnamed too: his face was there, his name was not.
    """
    d = ImageDraw.Draw(base)
    # Host name matches the guest name's size and colour - they are the two people
    # in the conversation and should carry equal weight. The show line sits above as
    # a small tracked label; set it too large and the tracking makes it out-shout the
    # name it is labelling.
    d = ImageDraw.Draw(base)
    size_name = 36
    fnt_show = font(MONT_B, 18)
    while size_name > 22:
        fnt_name = font(MONT_B, size_name)
        if (d.textlength(host_name.upper(), font=fnt_name) <= max_w
                and tracked_width(d, show.upper(), fnt_show) <= max_w):
            break
        size_name -= 1
    fnt_name = font(MONT_B, size_name)
    gap = 12
    h_show, h_name = 18, size_name
    top = cy - (h_show + gap + h_name) / 2
    tracked(d, (x, top), show.upper(), fnt_show, SKY, tracking=3.0)
    d.text((x, top + h_show + gap), host_name.upper(), font=fnt_name, fill=accent,
           stroke_width=2, stroke_fill=(0x1A, 0x1B, 0x1C))


def guest_tag(base, name, accent, xy, size=28, anchor="left", max_w=None):
    """Guest name in Montserrat Bold. No credential line - at 168px every credential
    in the live set degraded into an unreadable grey smear.

    Shrinks to fit max_w. Names vary a lot in length ("Bart Merrell" vs
    "Steve Schroeder" vs a double-barrelled one), and a fixed point size that suits
    one will run off the canvas on another.
    """
    d = ImageDraw.Draw(base)
    txt = name.upper()
    while size > 18:
        fnt = font(MONT_B, size)
        w = d.textlength(txt, font=fnt)
        if max_w is None or w <= max_w:
            break
        size -= 1
    fnt = font(MONT_B, size)
    w = d.textlength(txt, font=fnt)
    x = xy[0] - w if anchor == "right" else xy[0]
    d.text((x, xy[1]), txt, font=fnt, fill=accent, stroke_width=2,
           stroke_fill=(0x1A, 0x1B, 0x1C))


# ----------------------------------------------------------------- challengers
def c1_duo_panel(guest, host, hook, name, accent, bg, highlight, show=None, host_name=None):
    """Two framed photo panels, headline band beneath. Keeps the duo format the
    channel is known for and needs no matting - a webcam grab and a studio
    headshot both land cleanly inside a frame."""
    base = brand_bg(bg, accent)
    pw, ph, gap, top = 545, 388, 34, 80
    x0 = (W - (pw * 2 + gap)) // 2
    for i, (img, face) in enumerate((host, guest)):
        panel = rounded(frame_face(img, face, pw, ph, 0.44, 0.44, fill=bg), 22,
                        border=accent if i == 1 else None)
        shadow_paste(base, panel, (x0 + i * (pw + gap), top))
    place_logo(base)
    guest_tag(base, name, accent, (W - 34, 32), anchor="right", max_w=int(W * 0.48))
    # Bottom ~12% is the caption zone (progress bar + duration badge) - keep clear.
    draw_hook(base, hook, accent, (58, top + ph + 14, W - 58, H - 78), max_size=124,
              highlight=highlight)
    return base


def c2_guest_dominant(guest, host, hook, name, accent, bg, highlight, show, host_name):
    """Guest full-bleed right, headline stacked left, host + studio mic bottom-left.

    The host inset is deliberately large: at 132px it was a token, and the point of
    keeping him in frame at all is that people recognise him. The mic is the show
    signal - two talking heads read as an interview, but not necessarily a podcast.
    """
    base = brand_bg(bg, accent, spot=(0.26, 0.42))
    gw = int(W * 0.56)
    # 0.38, not 0.30: the pattern library hard rule is face >= 35% of FRAME height.
    # At 0.30 the guest measured 216px against a 252px threshold - the only outright
    # rule failure in the template, and the cheapest CTR lever available since the
    # evidence base puts emotive faces at a 20-35% lift that scales with frame share.
    g = frame_face(guest[0], guest[1], gw, H, 0.38, 0.34, fill=bg).convert("RGBA")
    feather = Image.new("L", (gw, H), 255)
    d = ImageDraw.Draw(feather)
    for x in range(int(gw * 0.30)):
        d.line([(x, 0), (x, H)], fill=int(255 * (x / (gw * 0.30)) ** 1.5))
    g.putalpha(feather)
    base.alpha_composite(g, (W - gw, 0))
    scrim(base, strength=140, start=0.55)
    scrim(base, strength=110, top=True, start=0.16)
    place_logo(base)

    # Headline shortened vertically to clear the host/mic cluster beneath it.
    draw_hook(base, hook, accent, C2_HOOK_BOX, max_size=104, align="left",
              highlight=highlight)
    guest_tag(base, name, accent, (W - 54, H - 128), size=36, anchor="right",
              max_w=int(W * 0.50))

    r = 208
    cy = H - r - 44
    # Same circle, but the subject sits LOWER in it. The measured box is the
    # face, and the scalp rises well above the face box - centring on the face
    # pushed the top of the head almost to the circle edge. 0.56 drops the face
    # centre below the circle centre, which is what buys headroom.
    inset = frame_face(host[0], host[1], r, r, 0.44, 0.56, fill=bg,
                       head_top_frac=0.15).convert("RGBA")
    m = Image.new("L", (r, r), 0)
    ImageDraw.Draw(m).ellipse([0, 0, r - 1, r - 1], fill=255)
    inset.putalpha(m)
    ring = Image.new("RGBA", (r + 14, r + 14), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse([0, 0, r + 13, r + 13], outline=accent + (255,), width=6)
    ring.alpha_composite(inset, (7, 7))
    shadow_paste(base, ring, (48, cy - 7), blur=20, opacity=165)

    host_block(base, show, host_name, accent, x=48 + r + 34, cy=cy + r / 2,
               max_w=int(W * 0.42) - r)

    return base


def c3_portrait_panel(guest, host, hook, name, accent, bg, highlight, show=None, host_name=None):
    """Headline left on brand ground, guest in a tall portrait panel right.

    The third design exists to be structurally different from the other two, but
    it also has to be the ROBUST one. A portrait panel is the only geometry here
    that matches the shape of the source material: guest photos are portrait or
    square, so a tall frame crops them barely at all. The full-bleed version this
    replaces kept breaking - forcing a portrait to cover 16:9 made the face huge
    and pushed the chin off the canvas, and blur-filling around it left a hard
    edge where the photo stopped.
    """
    base = brand_bg(bg, accent, spot=(0.34, 0.44))
    panel_w, panel_h = 392, 556
    px, py = W - panel_w - 54, (H - panel_h) // 2
    panel = rounded(frame_face(guest[0], guest[1], panel_w, panel_h, 0.30, 0.34, fill=bg),
                    24, border=accent)
    shadow_paste(base, panel, (px, py))
    place_logo(base)
    draw_hook(base, hook, accent, (54, 168, px - 62, H - 178), max_size=116, align="left",
              highlight=highlight)
    # Top-right, matching C1. Below the panel would put it inside the bottom
    # ~12% caption zone where the progress bar and duration badge sit.
    guest_tag(base, name, accent, (W - 54, 34), size=27, anchor="right", max_w=int(W * 0.40))
    return base


BUILDERS = {
    "C1-duo-panel": c1_duo_panel,
    "C2-guest-dominant": c2_guest_dominant,
    "C3-portrait-panel": c3_portrait_panel,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep", required=True)
    ap.add_argument("--guest", required=True)
    ap.add_argument("--photo", required=True, help="RAW guest photo - not a cut-out")
    ap.add_argument("--hook", required=True)
    ap.add_argument("--accent", default="light-green", choices=list(ACCENTS))
    ap.add_argument("--bg", default="night-sky", choices=list(BACKGROUNDS))
    ap.add_argument("--host", default="05092023_ATP_014.png")
    ap.add_argument("--highlight", default=None,
                    help="the word that takes the accent - the PATH word, never the wound. "
                         "Defaults to the last word, which is correct for most hooks but not all "
                         "(ROWING THE SAME WAY needs SAME, not WAY).")
    ap.add_argument("--allow-small-hook", action="store_true",
                    help="override the %dpt hook legibility gate (records the override)" % HOOK_MIN_PT)
    ap.add_argument("--show", default="Power Movers Podcast")
    ap.add_argument("--host-name", default="Roy Castleman")
    ap.add_argument("--design", default="all",
                    choices=["all"] + list(BUILDERS),
                    help="render one design only; thumbnail-build.cjs passes the locked one")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    if a.accent in FORBIDDEN[a.bg]:
        raise SystemExit(f"brand rule: {a.accent} may not sit on {a.bg}")

    # Gate the hook before rendering. Roy's standing rule: nothing ships that does not
    # meet the requirement - so this fails loudly rather than quietly producing a
    # thumbnail with unreadable display text.
    if a.highlight and a.highlight.upper() not in a.hook.upper().split():
        raise SystemExit(f"--highlight {a.highlight!r} is not a word in the hook "
                         f"{a.hook!r} — nothing would be accented.")
    ok, pt, lines, why = check_hook_gate(a.hook)
    print(f"  hook gate  : {pt}pt  {lines}  {'OK' if ok else 'FAIL'}")
    if not ok:
        print(f"  ! {why}")
        if not a.allow_small_hook:
            raise SystemExit(2)
        print("  ! --allow-small-hook set, continuing anyway")

    accent, bg = ACCENTS[a.accent], BACKGROUNDS[a.bg]
    host_path = a.host if os.path.isabs(a.host) else f"{HOST_DIR}/{a.host}"

    pairs = {}
    for key, path in (("guest", a.photo), ("host", host_path)):
        img = Image.open(path)
        face = find_face(path, img)
        print(f"  {key:5} {os.path.basename(path):34} face: "
              f"{face.source if face else 'NOT FOUND - falling back to centre crop'}")
        pairs[key] = (img, face)

    os.makedirs(a.out, exist_ok=True)
    todo = BUILDERS if a.design == "all" else {a.design: BUILDERS[a.design]}
    for name, fn in todo.items():
        img = fn(pairs["guest"], pairs["host"], a.hook, a.guest, accent, bg,
                 a.highlight, a.show, a.host_name).convert("RGB")
        p = f"{a.out}/ep{a.ep}_{name}_{a.accent}.jpg"
        img.save(p, quality=93)
        print("  saved", p)


if __name__ == "__main__":
    main()
