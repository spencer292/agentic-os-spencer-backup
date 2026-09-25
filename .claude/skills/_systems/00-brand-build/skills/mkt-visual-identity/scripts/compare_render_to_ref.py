#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow>=10.0.0", "numpy>=1.26.0", "pyyaml>=6.0"]
# ///
"""Post-render pixel comparison: ref vs preview, per text-element line count.

The math validator in validate_measurements.py only checks internal consistency
of declared numbers. If the agent reads the ref wrong and declares
observed_line_count=4 when the ref shows 5, the formula still balances
(font, bbox, lh all derived from the same wrong N) and the validator passes.

This script catches that class of error by actually LOOKING at the pixels.
For every text element with observed_line_count declared in _measurements.yaml,
it:

  1. Crops the bbox region from both ref.png and preview.png
  2. Auto-detects bg polarity (light bg + dark text, or vice versa)
  3. Otsu-thresholds to a text mask
  4. Computes the horizontal (per-row) projection of text pixels
  5. Clusters contiguous rows above a relative threshold into lines
  6. Compares cluster count to declared observed_line_count

Verdict emitted per element:

  OK                  ref_lines == preview_lines == declared_lines
  LINE_COUNT_MISMATCH ref_lines != preview_lines, or either != declared
  EMPTY_REGION        no text pixels detected in the bbox (skipped)

Elements with type != "text", or without observed_line_count, or with type
image-zone / icon / pill / bg-watermark are skipped.

Usage:

    uv run compare_render_to_ref.py \\
        --ref _qa-renders/cover-dark-byline-pill-ref.png \\
        --preview _qa-renders/cover-dark-byline-pill-preview.png \\
        --measurements brand_context/templates/linkedin-carousel/cover-dark-byline-pill/_measurements.yaml \\
        --output _qa-renders/cover-dark-byline-pill-linecheck.json

If --output is omitted, JSON is printed to stdout. Exit code is non-zero if
any element verdicts LINE_COUNT_MISMATCH (so CI can gate on it).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import yaml
from PIL import Image


# Element types we look at. Text only. Skip icons, pills, image-zones,
# bg-watermarks, decorative chrome — those don't have a line count.
TEXT_TYPES = {"text"}

# Minimum bbox area (in canvas %) below which we won't even try — too small
# to get a reliable projection signal. Kickers and tiny captions are still
# scanned; this guards against degenerate measurements.
MIN_BBOX_AREA_PCT = 0.5  # half a square percent of canvas


def load_image_normalized(path: Path, target_w: int, target_h: int) -> np.ndarray:
    """Load image and resize to canonical canvas size. Returns grayscale ndarray."""
    img = Image.open(path).convert("L")
    if img.size != (target_w, target_h):
        img = img.resize((target_w, target_h), Image.LANCZOS)
    return np.array(img, dtype=np.uint8)


def parse_canvas(meas: dict) -> tuple[int, int]:
    """Parse `canvas: 1080x1350` (or list/tuple) into (w, h)."""
    raw = meas.get("canvas", "1080x1350")
    if isinstance(raw, str):
        w_str, h_str = raw.lower().replace(" ", "").split("x")
        return int(w_str), int(h_str)
    if isinstance(raw, (list, tuple)) and len(raw) == 2:
        return int(raw[0]), int(raw[1])
    return 1080, 1350


def crop_bbox(arr: np.ndarray, bbox_pct: list, canvas_w: int, canvas_h: int) -> np.ndarray:
    """Crop the bbox from a grayscale array. bbox_pct = [left, top, w, h] in % of canvas."""
    left_pct, top_pct, w_pct, h_pct = bbox_pct
    x0 = max(0, int(round(left_pct / 100.0 * canvas_w)))
    y0 = max(0, int(round(top_pct / 100.0 * canvas_h)))
    x1 = min(canvas_w, int(round((left_pct + w_pct) / 100.0 * canvas_w)))
    y1 = min(canvas_h, int(round((top_pct + h_pct) / 100.0 * canvas_h)))
    if x1 <= x0 or y1 <= y0:
        return np.zeros((1, 1), dtype=np.uint8)
    return arr[y0:y1, x0:x1]


def otsu_threshold(arr: np.ndarray) -> int:
    """Compute Otsu threshold for a grayscale ndarray. Returns the threshold value (0-255)."""
    # Build histogram
    hist, _ = np.histogram(arr.ravel(), bins=256, range=(0, 256))
    total = arr.size
    if total == 0:
        return 127
    sum_total = np.dot(np.arange(256), hist)
    sum_b = 0.0
    w_b = 0
    max_var = -1.0
    threshold = 127
    for i in range(256):
        w_b += hist[i]
        if w_b == 0:
            continue
        w_f = total - w_b
        if w_f == 0:
            break
        sum_b += i * hist[i]
        m_b = sum_b / w_b
        m_f = (sum_total - sum_b) / w_f
        var_between = w_b * w_f * (m_b - m_f) ** 2
        if var_between > max_var:
            max_var = var_between
            threshold = i
    return int(threshold)


def text_mask(region: np.ndarray) -> tuple[np.ndarray, bool]:
    """Return a binary mask (True = pixel belongs to text) and bg polarity flag.

    Strategy: median-based polarity detection.
      - If median > 127, bg is light → text is dark → mask = pixel < otsu_t
      - Else, bg is dark → text is light → mask = pixel > otsu_t

    Returns (mask, bg_is_light).
    """
    if region.size == 0:
        return np.zeros_like(region, dtype=bool), True
    bg_is_light = bool(np.median(region) > 127)
    t = otsu_threshold(region)
    if bg_is_light:
        mask = region < t
    else:
        mask = region > t
    return mask, bg_is_light


def count_lines(mask: np.ndarray, min_line_height_px: int = 4,
                activity_threshold: float = 0.10,
                small_cluster_ratio: float = 0.30) -> tuple[int, list[tuple[int, int]]]:
    """Count text lines via horizontal projection clustering.

    Two-pass approach:
      Pass 1 — find all contiguous runs of "active" rows above a relative
               threshold. Drop runs below an absolute height floor.
      Pass 2 — drop clusters whose height is below `small_cluster_ratio` of
               the MEDIAN cluster height. This kills stray noise from
               ascenders/descenders bleeding outside the main text body, as
               well as thin bbox-edge artifacts.

    Args:
      mask: HxW binary mask, True where text pixel.
      min_line_height_px: hard floor on cluster height in raw rows.
      activity_threshold: row is "active" when active_px_count / max_row_count > this.
      small_cluster_ratio: clusters shorter than this fraction of median are dropped.

    Returns (line_count, list_of_(top_row, bottom_row)_per_line).
    """
    if mask.ndim != 2 or mask.size == 0:
        return 0, []

    # Per-row count of active pixels
    row_sums = mask.sum(axis=1).astype(np.float64)
    if row_sums.max() == 0:
        return 0, []

    # Relative threshold — lines vary in width (a single-word last line of a
    # paragraph has fewer active pixels), so we threshold against the row max
    # rather than an absolute value. 10% of max catches even narrow last-line
    # words while still rejecting kerning noise between lines.
    threshold = row_sums.max() * activity_threshold
    active = row_sums > threshold

    # Pass 1: contiguous runs above absolute height floor
    runs: list[tuple[int, int]] = []
    n = len(active)
    i = 0
    while i < n:
        if active[i]:
            j = i
            while j < n and active[j]:
                j += 1
            if j - i >= min_line_height_px:
                runs.append((i, j - 1))
            i = j
        else:
            i += 1

    if len(runs) <= 1:
        return len(runs), runs

    # Pass 2: drop micro-clusters relative to the median cluster height. The
    # idea is: real text lines all have roughly the same height (font is the
    # same), so anything dramatically smaller than the median is noise — a
    # descender that escaped the bbox, an emoji glyph dropped below baseline,
    # a sub-pixel anti-alias band, a row of border pixels near the bbox edge.
    heights = sorted(r[1] - r[0] + 1 for r in runs)
    median_h = heights[len(heights) // 2]
    min_keep = max(min_line_height_px, int(median_h * small_cluster_ratio))
    filtered = [r for r in runs if (r[1] - r[0] + 1) >= min_keep]

    return len(filtered), filtered


def is_skippable(element: dict) -> tuple[bool, str]:
    """Decide whether to skip this element. Returns (skip, reason)."""
    etype = element.get("type")
    if etype not in TEXT_TYPES:
        return True, f"type={etype} not a text element"
    if element.get("observed_line_count") is None:
        return True, "no observed_line_count declared"
    bbox = element.get("bbox_pct")
    if not isinstance(bbox, list) or len(bbox) != 4:
        return True, "bbox_pct missing or malformed"
    if bbox[2] * bbox[3] < MIN_BBOX_AREA_PCT:
        return True, f"bbox area {bbox[2] * bbox[3]:.2f}% below scan floor"
    return False, ""


def analyze_element(element: dict, ref_gray: np.ndarray, preview_gray: np.ndarray,
                    canvas_w: int, canvas_h: int) -> dict:
    """Run the line-count comparison for one element. Returns a result dict."""
    eid = element.get("id", "<unnamed>")
    bbox = element["bbox_pct"]
    declared = int(element["observed_line_count"])

    ref_region = crop_bbox(ref_gray, bbox, canvas_w, canvas_h)
    prev_region = crop_bbox(preview_gray, bbox, canvas_w, canvas_h)

    ref_mask, ref_bg_light = text_mask(ref_region)
    prev_mask, prev_bg_light = text_mask(prev_region)

    ref_lines, ref_runs = count_lines(ref_mask)
    prev_lines, prev_runs = count_lines(prev_mask)

    # Empty-region guard: if both regions have zero active pixels above
    # threshold, the bbox might be wrong or the element is invisible — emit
    # a soft verdict rather than asserting mismatch.
    ref_total = int(ref_mask.sum())
    prev_total = int(prev_mask.sum())
    if ref_total == 0 and prev_total == 0:
        verdict = "EMPTY_REGION"
    elif ref_lines == declared and prev_lines == declared:
        verdict = "OK"
    elif ref_lines == prev_lines and ref_lines != declared:
        # Both renders agree but contradict the declared count — likely
        # the agent misread the ref. Still a mismatch.
        verdict = "LINE_COUNT_MISMATCH"
    else:
        verdict = "LINE_COUNT_MISMATCH"

    return {
        "id": eid,
        "type": element.get("type"),
        "role": element.get("role"),
        "bbox_pct": bbox,
        "declared_lines": declared,
        "ref_lines": ref_lines,
        "preview_lines": prev_lines,
        "ref_text_pixels": ref_total,
        "preview_text_pixels": prev_total,
        "ref_bg_is_light": ref_bg_light,
        "preview_bg_is_light": prev_bg_light,
        "ref_line_bands_rows": ref_runs,
        "preview_line_bands_rows": prev_runs,
        "verdict": verdict,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Pixel-diff line-count check between ref and preview.")
    ap.add_argument("--ref", required=True, type=Path, help="Reference image path")
    ap.add_argument("--preview", required=True, type=Path, help="Rendered preview image path")
    ap.add_argument("--measurements", required=True, type=Path, help="Path to _measurements.yaml")
    ap.add_argument("--output", type=Path, default=None,
                    help="Output JSON path. If omitted, prints to stdout.")
    ap.add_argument("--strict-exit", action="store_true",
                    help="Exit 1 if any element has LINE_COUNT_MISMATCH (default behavior).")
    ap.add_argument("--no-strict-exit", dest="strict_exit", action="store_false",
                    help="Always exit 0 even on mismatch (for inspection runs).")
    ap.set_defaults(strict_exit=True)
    args = ap.parse_args()

    for p in (args.ref, args.preview, args.measurements):
        if not p.exists():
            print(f"Error: input not found: {p}", file=sys.stderr)
            return 2

    with args.measurements.open("r", encoding="utf-8") as f:
        meas = yaml.safe_load(f)

    canvas_w, canvas_h = parse_canvas(meas)
    ref_gray = load_image_normalized(args.ref, canvas_w, canvas_h)
    preview_gray = load_image_normalized(args.preview, canvas_w, canvas_h)

    results: list[dict] = []
    skipped: list[dict] = []
    for element in meas.get("elements", []):
        skip, reason = is_skippable(element)
        if skip:
            skipped.append({"id": element.get("id"), "type": element.get("type"), "reason": reason})
            continue
        results.append(analyze_element(element, ref_gray, preview_gray, canvas_w, canvas_h))

    mismatches = [r for r in results if r["verdict"] == "LINE_COUNT_MISMATCH"]
    payload = {
        "ref": str(args.ref),
        "preview": str(args.preview),
        "measurements": str(args.measurements),
        "canvas": {"width": canvas_w, "height": canvas_h},
        "elements": results,
        "skipped": skipped,
        "summary": {
            "elements_scanned": len(results),
            "elements_skipped": len(skipped),
            "mismatches": len(mismatches),
            "mismatch_ids": [m["id"] for m in mismatches],
        },
    }

    text = json.dumps(payload, indent=2)
    if args.output is None:
        print(text)
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
        print(f"Wrote: {args.output}", file=sys.stderr)
        # Also print a short summary to stdout for human eyeballs
        print(f"scanned={len(results)} skipped={len(skipped)} mismatches={len(mismatches)}")
        for m in mismatches:
            print(f"  LINE_COUNT_MISMATCH [{m['id']}] declared={m['declared_lines']} ref={m['ref_lines']} preview={m['preview_lines']}")

    if mismatches and args.strict_exit:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
