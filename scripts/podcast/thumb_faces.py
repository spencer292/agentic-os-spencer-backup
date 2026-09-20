"""
Face geometry for thumbnail composition.

Written because the first pass at the challengers used a generic resize-to-cover
with a hardcoded vertical bias, which has no idea where a face is. On a tall
cut-out that takes a horizontal band from wherever the number lands - it cropped
the host's head off above the eyes on ep 83 and clipped his scalp inside the
circular inset on ep 85. A thumbnail generator must never guess where the face is.

Two sources of truth, in order of preference:

1. ALPHA GEOMETRY (cut-outs) - deterministic, free, no API. A cut-out's head is
   always at the top of its alpha bounding box, so the head box can be measured
   directly from the mask. Preferred whenever the image has transparency.

2. VISION MEASUREMENT (photographs) - one Gemini call returning a bounding box,
   cached to a sidecar so it only ever happens once per photo. This is the model
   MEASURING, not generating: it returns four numbers and never touches a pixel.
   That distinction matters - the brand rule bans running a person through an
   image model, and asking for coordinates does not do that.
"""
import json
import os

from PIL import Image, ImageOps

_MODEL = "gemini-3.6-flash"
_BASE = "https://generativelanguage.googleapis.com"


class FaceBox:
    """Face rectangle in source-pixel coordinates."""

    def __init__(self, x, y, w, h, source, head_top=None):
        self.x, self.y, self.w, self.h = float(x), float(y), float(w), float(h)
        self.source = source
        # Top of the HEAD (hair/scalp), not the top of the face box. Only the alpha
        # path can know this. It is what "headroom" actually means to a human eye -
        # positioning by face centre gives inconsistent gaps because how much scalp
        # sits above the face varies with pose and tilt.
        self.head_top = None if head_top is None else float(head_top)

    @property
    def cx(self):
        return self.x + self.w / 2

    @property
    def cy(self):
        return self.y + self.h / 2

    def __repr__(self):
        return (f"FaceBox({self.x:.0f},{self.y:.0f},{self.w:.0f}x{self.h:.0f} "
                f"via {self.source})")


# --------------------------------------------------------------- alpha geometry
def _face_from_alpha(img):
    """Measure the head box from a cut-out's alpha channel.

    The head is the topmost mass of the silhouette. Walk down from the top of the
    alpha bbox and find where the subject's width jumps - that is the neck/shoulder
    line. Everything above it is head.
    """
    alpha = img.split()[3]
    mask = alpha.point(lambda v: 255 if v > 16 else 0)
    bbox = mask.getbbox()
    if not bbox:
        return None
    x0, y0, x1, y1 = bbox
    bh = y1 - y0
    if bh < 20:
        return None

    # Row-by-row width of the silhouette over the top 60% of the figure.
    widths = []
    px = mask.load()
    step = max(1, bh // 220)
    for y in range(y0, y0 + int(bh * 0.60), step):
        row = [x for x in range(x0, x1) if px[x, y] > 0]
        widths.append((y, (min(row), max(row)) if row else None))

    solid = [(y, r) for y, r in widths if r]
    if len(solid) < 6:
        return None

    # Head width settles in the upper part of the skull; shoulders are much wider.
    head_ws = [r[1] - r[0] for _, r in solid[: max(3, len(solid) // 4)]]
    head_w = sorted(head_ws)[len(head_ws) // 2]
    shoulder_y = None
    for y, r in solid:
        if (r[1] - r[0]) > head_w * 1.55:      # widened out - this is shoulders
            shoulder_y = y
            break
    head_bottom = shoulder_y if shoulder_y else y0 + int(bh * 0.34)

    top_rows = [r for _, r in solid[: max(2, len(solid) // 5)]]
    hx0 = min(r[0] for r in top_rows)
    hx1 = max(r[1] for r in top_rows)

    # The measured box is the whole head; the FACE sits in its lower two-thirds.
    head_h = head_bottom - y0
    return FaceBox(hx0, y0 + head_h * 0.22, hx1 - hx0, head_h * 0.78, "alpha",
                   head_top=y0)


# ------------------------------------------------------------ vision measurement
def _load_key():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    for name in (".env",):
        p = os.path.join(root, name)
        if not os.path.exists(p):
            continue
        for line in open(p, encoding="utf-8"):
            if line.strip().startswith(("GEMINI_API_KEY", "GOOGLE_API_KEY")):
                return line.split("=", 1)[1].strip().strip("\"'")
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")


def _face_from_vision(path, img):
    """Ask Gemini for the primary face's bounding box. Cached per file."""
    cache = f"{os.path.splitext(path)[0]}.facebox.json"
    if os.path.exists(cache):
        try:
            d = json.load(open(cache, encoding="utf-8"))
            return FaceBox(d["x"], d["y"], d["w"], d["h"], "vision(cached)")
        except Exception:
            pass

    import base64
    import urllib.request

    key = _load_key()
    if not key:
        return None
    buf = open(path, "rb").read()
    mime = "image/png" if path.lower().endswith(".png") else "image/jpeg"
    prompt = (
        "Return ONLY a JSON object, no prose and no code fence, giving the bounding box of the "
        "single most prominent human face in this image - the head from the top of the hair to "
        "the bottom of the chin, and the full width of the face including both ears. "
        'Format: {"ymin":0,"xmin":0,"ymax":1000,"xmax":1000} using integers 0-1000 normalised to '
        "image height (y) and width (x). If there is no human face, return {}."
    )
    body = json.dumps({"contents": [{"parts": [
        {"inline_data": {"mime_type": mime, "data": base64.b64encode(buf).decode()}},
        {"text": prompt},
    ]}]}).encode()
    req = urllib.request.Request(
        f"{_BASE}/v1beta/models/{_MODEL}:generateContent?key={key}",
        data=body, headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            j = json.loads(r.read())
        txt = j["candidates"][0]["content"]["parts"][0]["text"]
        txt = txt.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        d = json.loads(txt)
        if not d:
            return None
        # Gemini answers detection in its own house format, {"box_2d":[ymin,xmin,
        # ymax,xmax]}, regardless of the key names asked for. Accept both shapes.
        if isinstance(d, list):
            d = d[0] if d else {}
        if "box_2d" in d:
            ymin, xmin, ymax, xmax = d["box_2d"]
        elif "xmin" in d:
            ymin, xmin, ymax, xmax = d["ymin"], d["xmin"], d["ymax"], d["xmax"]
        else:
            return None
        W, H = img.size
        x = xmin / 1000 * W
        y = ymin / 1000 * H
        w = (xmax - xmin) / 1000 * W
        h = (ymax - ymin) / 1000 * H
        if w <= 0 or h <= 0:
            return None
        # Sanity-clamp. The model sometimes returns the whole head-and-torso mass
        # rather than the face; an unchecked oversized box makes the compositor
        # scale the subject far too small. A face taller than 60% of the frame is
        # not a face box, so pull it back to its upper portion.
        if h > img.size[1] * 0.60:
            y += h * 0.10
            h *= 0.62
        json.dump({"x": x, "y": y, "w": w, "h": h}, open(cache, "w", encoding="utf-8"))
        return FaceBox(x, y, w, h, "vision")
    except Exception as e:
        print(f"  ! face detection failed for {os.path.basename(path)}: {e}")
        return None


def find_face(path, img):
    """Alpha geometry when there is a mask, vision measurement otherwise."""
    if img.mode in ("RGBA", "LA"):
        fb = _face_from_alpha(img)
        if fb:
            return fb
    return _face_from_vision(path, img)


# -------------------------------------------------------------------- the crop
def frame_face(img, face, box_w, box_h, face_h_frac=0.42, face_cy_frac=0.44,
               fill=(0x33, 0x35, 0x38), enforce_fill=True, head_top_frac=None):
    """Crop/scale so the face lands at a deliberate size and position in the box.

    face_h_frac  - face height as a fraction of the box height (how big the head is)
    face_cy_frac - where the face centre sits vertically (headroom; <0.5 = upper half)

    Pads rather than over-cropping when the source runs out, so a face is never
    sliced to make the numbers work - the whole point of this module.
    """
    if face is None:                     # no measurement - never guess a tight crop
        return ImageOps.fit(img.convert("RGB"), (box_w, box_h),
                            method=Image.LANCZOS, centering=(0.5, 0.35))

    sw, sh = img.size
    # Two constraints: the face should be a chosen size, AND the photo must fill
    # the box. Take whichever scale is larger so the frame is never padded out
    # with dead background - a letterboxed portrait looks like a mistake, and it
    # was one of the things wrong with the first pass.
    scale = (box_h * face_h_frac) / face.h
    if enforce_fill:
        scale = max(scale, box_w / sw, box_h / sh)
    # enforce_fill=False lets the caller own the background (a blur-fill, say).
    # Forcing a portrait to cover a 16:9 frame always yields an enormous face -
    # on ep 87 it pushed the guest's chin off the bottom edge - so the full-bleed
    # layout supplies its own ground and asks for the face size it actually wants.
    nw, nh = max(1, int(sw * scale + 0.5)), max(1, int(sh * scale + 0.5))
    big = img.resize((nw, nh), Image.LANCZOS)

    fcx = face.cx * scale
    left = int(round(fcx - box_w / 2))
    if head_top_frac is not None and face.head_top is not None:
        # Pin the top of the head to a fixed fraction of the box - gives the SAME
        # visible gap above every subject regardless of pose.
        top = int(round(face.head_top * scale - box_h * head_top_frac))
    else:
        top = int(round(face.cy * scale - box_h * face_cy_frac))
    # Keep the window inside the image: get as close to the intended face position
    # as the source allows rather than sliding off and exposing fill.
    left = max(0, min(left, nw - box_w))
    if head_top_frac is None:
        top = max(0, min(top, nh - box_h))
    # With head_top_frac the clamp is deliberately skipped. The host cut-outs are
    # trimmed flush to the top of the scalp, so the headroom does not exist in the
    # source to be revealed - it has to be ADDED by letting the window sit above the
    # image and padding with the brand fill. Clamping here is what made every earlier
    # attempt at "more space above his head" silently do nothing.

    # crop() tolerates an out-of-bounds window and pads it transparent, so the
    # face keeps its intended position even when the source runs out at an edge.
    region = big.convert("RGBA").crop((left, top, left + box_w, top + box_h))
    out = Image.new("RGBA", (box_w, box_h), fill + (255,))
    out.alpha_composite(region)
    return out.convert("RGB")
