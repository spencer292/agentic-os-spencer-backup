"""
Zernio REST publisher — template used by tool-publisher when the Zernio MCP
isn't loaded. Reads a post folder ({post-dir}/post.yaml + caption.md + media),
uploads media via presigned URLs, and creates the post (publish-now or
scheduled).

Output: a single JSON object on stdout. exit 0 on success, 1 on failure.
On failure the JSON has "ok": false and "error": "<message>".

Usage:
  python publish_rest.py <post-dir> [options]

Options:
  --platform PLATFORM       Override post.yaml platform (e.g. "instagram")
  --account-id ID           Override account auto-resolution
  --media FILE [FILE ...]   Explicit media files (default: auto-detect)
  --pdf                     LinkedIn carousel only — build PDF via
                            slides_to_pdf.py and upload as document
  --document-title TITLE    Title for LinkedIn PDF (default: post folder name)
  --schedule-for ISO        ISO 8601 UTC timestamp. If set, schedules
                            instead of publishing now.
  --no-optimize             Skip pre-upload image optimization (default: ON).
                            Optimization downscales to the platform's max
                            width, converts PNG→JPEG q=92, and avoids the
                            server-side re-encode that costs quality.
  --env-file PATH           Path to .env (default: walk up from <post-dir>)
  --api-base URL            Override https://zernio.com/api/v1
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

DEFAULT_API = "https://zernio.com/api/v1"
SCRIPT_DIR = Path(__file__).resolve().parent

CONTENT_TYPES = {
    ".png": ("image/png", "image"),
    ".jpg": ("image/jpeg", "image"),
    ".jpeg": ("image/jpeg", "image"),
    ".webp": ("image/webp", "image"),
    ".gif": ("image/gif", "image"),
    ".mp4": ("video/mp4", "video"),
    ".mov": ("video/quicktime", "video"),
    ".webm": ("video/webm", "video"),
    ".pdf": ("application/pdf", "document"),
}

# Per-platform image targets for pre-upload optimization.
# max_width: longest side IG/LI/etc actually serve — anything larger gets
# re-scaled server-side with low-quality algorithms. quality: JPEG quality
# for the optimized output (Pillow scale 1-95).
PLATFORM_TARGETS = {
    "instagram": {"max_width": 1080, "quality": 92},
    "linkedin":  {"max_width": 1920, "quality": 92},
    "twitter":   {"max_width": 1600, "quality": 88},
    "facebook":  {"max_width": 1200, "quality": 92},
    "threads":   {"max_width": 1080, "quality": 92},
    "tiktok":    {"max_width": 1080, "quality": 92},
}
DEFAULT_TARGET = {"max_width": 1920, "quality": 92}


def fail(msg: str, code: int = 1) -> "None":
    print(json.dumps({"ok": False, "error": msg}, ensure_ascii=False))
    sys.exit(code)


def find_env(start: Path, override: Path | None) -> Path:
    if override:
        if not override.exists():
            fail(f".env file not found at {override}")
        return override
    cur = start.resolve()
    for parent in [cur, *cur.parents]:
        candidate = parent / ".env"
        if candidate.exists():
            return candidate
    fail(f"no .env found walking up from {start}")


def load_api_key(env_file: Path) -> str:
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line.startswith("ZERNIO_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    fail(f"ZERNIO_API_KEY not found in {env_file}")


def parse_post_yaml(path: Path) -> dict:
    """Minimal parser for the top-level scalar fields tool-publisher needs.
    Avoids a PyYAML dependency. Stops descending into nested blocks."""
    if not path.exists():
        fail(f"post.yaml not found at {path}")
    out: dict = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        if not raw or raw.startswith("#"):
            continue
        if raw[0] in (" ", "\t", "-"):
            continue
        if ":" not in raw:
            continue
        key, _, value = raw.partition(":")
        value = value.strip()
        if value in ("", "~", "null"):
            continue
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]
        out[key.strip()] = value
    return out


def http(method: str, url: str, headers: dict | None = None, body: bytes | dict | list | None = None,
         timeout: int = 180) -> tuple[int, str]:
    h = {"Accept": "application/json"}
    if headers:
        h.update(headers)
    data: bytes | None = None
    if isinstance(body, (dict, list)):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        h.setdefault("Content-Type", "application/json")
    elif isinstance(body, (bytes, bytearray)):
        data = bytes(body)
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as e:
        fail(f"network error: {e.reason}")


def resolve_account(api: str, key: str, platform: str) -> str:
    status, body = http("GET", f"{api}/accounts", headers={"Authorization": f"Bearer {key}"})
    if status != 200:
        fail(f"GET /accounts failed: HTTP {status} {body[:300]}")
    accounts = [a for a in json.loads(body).get("accounts", []) if a.get("platform") == platform]
    if not accounts:
        fail(f"no Zernio account connected for platform '{platform}'")
    if len(accounts) > 1:
        fail(f"multiple Zernio accounts for '{platform}' — pass --account-id explicitly")
    return accounts[0]["_id"]


def autodetect_media(post_dir: Path, fmt: str) -> list[Path]:
    if fmt == "single":
        for name in ("image.png", "image.jpg", "image.jpeg"):
            p = post_dir / name
            if p.exists():
                return [p]
        return []
    if fmt == "carousel":
        slides = sorted(
            post_dir.glob("slide-*.png"),
            key=lambda p: int(p.stem.split("-")[1]),
        )
        return list(slides)
    return []


def build_pdf(post_dir: Path) -> Path:
    pdf_path = post_dir / "carousel.pdf"
    script = SCRIPT_DIR / "slides_to_pdf.py"
    if not script.exists():
        fail(f"slides_to_pdf.py missing at {script}")
    result = subprocess.run(
        [sys.executable, str(script), str(post_dir), "--output", str(pdf_path)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        fail(f"PDF build failed: {result.stderr.strip() or result.stdout.strip()}")
    if not pdf_path.exists():
        fail(f"slides_to_pdf.py exited cleanly but {pdf_path} not produced")
    return pdf_path


def optimize_image(src: Path, platform: str, tmpdir: Path) -> Path:
    """Downscale to the platform's max width and export as JPEG q=92.
    Avoids the low-quality server-side resize + re-encode that platforms
    do when you upload over-spec PNGs. Returns the optimized file path."""
    try:
        from PIL import Image
    except ImportError:
        fail("Pillow not installed but image optimization requested. Install with: pip install Pillow")
    target = PLATFORM_TARGETS.get(platform, DEFAULT_TARGET)
    img = Image.open(src)
    if img.mode == "RGBA":
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")
    if img.width > target["max_width"]:
        ratio = target["max_width"] / img.width
        new_size = (target["max_width"], round(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    out = tmpdir / (src.stem + ".jpg")
    img.save(out, "JPEG", quality=target["quality"], optimize=True,
             progressive=True, subsampling=1)
    return out


def upload_one(api: str, key: str, file: Path) -> dict:
    ext = file.suffix.lower()
    if ext not in CONTENT_TYPES:
        fail(f"unsupported file type {ext} for {file.name}")
    ctype, mtype = CONTENT_TYPES[ext]
    status, body = http(
        "POST", f"{api}/media/presign",
        headers={"Authorization": f"Bearer {key}"},
        body={"filename": file.name, "contentType": ctype},
    )
    if status != 200:
        fail(f"presign failed for {file.name}: HTTP {status} {body[:300]}")
    j = json.loads(body)
    data = file.read_bytes()
    up_status, up_body = http(
        "PUT", j["uploadUrl"],
        headers={"Content-Type": ctype, "Content-Length": str(len(data))},
        body=data,
    )
    if up_status not in (200, 201, 204):
        fail(f"upload failed for {file.name}: HTTP {up_status} {up_body[:300]}")
    return {"type": mtype, "url": j["publicUrl"]}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("post_dir", type=Path)
    ap.add_argument("--platform")
    ap.add_argument("--account-id")
    ap.add_argument("--media", nargs="+", type=Path)
    ap.add_argument("--pdf", action="store_true")
    ap.add_argument("--document-title")
    ap.add_argument("--schedule-for")
    ap.add_argument("--no-optimize", action="store_true",
                    help="Skip pre-upload image optimization")
    ap.add_argument("--env-file", type=Path)
    ap.add_argument("--api-base", default=DEFAULT_API)
    args = ap.parse_args()

    post_dir = args.post_dir.resolve()
    if not post_dir.is_dir():
        fail(f"post directory not found: {post_dir}")

    env_file = find_env(post_dir, args.env_file)
    key = load_api_key(env_file)
    meta = parse_post_yaml(post_dir / "post.yaml")
    platform = args.platform or meta.get("platform")
    if not platform:
        fail("no platform: pass --platform or set 'platform:' in post.yaml")
    fmt = meta.get("format", "single")

    caption_file = post_dir / meta.get("caption_file", "caption.md")
    if not caption_file.exists():
        fail(f"caption file not found: {caption_file}")
    caption = caption_file.read_text(encoding="utf-8").strip()

    if args.pdf:
        if platform != "linkedin":
            fail(f"--pdf is only valid for platform=linkedin (got '{platform}')")
        if fmt != "carousel":
            fail(f"--pdf needs format=carousel (got '{fmt}')")
        media_files = [build_pdf(post_dir)]
    elif args.media:
        media_files = [Path(m).resolve() for m in args.media]
        for m in media_files:
            if not m.exists():
                fail(f"media file not found: {m}")
    else:
        media_files = autodetect_media(post_dir, fmt)

    account_id = args.account_id or resolve_account(args.api_base, key, platform)

    optimized_count = 0
    with tempfile.TemporaryDirectory(prefix="zernio_opt_") as tmp:
        tmpdir = Path(tmp)
        upload_files: list[Path] = []
        for f in media_files:
            should_optimize = (
                not args.no_optimize
                and f.suffix.lower() in (".png", ".jpg", ".jpeg")
            )
            if should_optimize:
                upload_files.append(optimize_image(f, platform, tmpdir))
                optimized_count += 1
            else:
                upload_files.append(f)
        media_items = [upload_one(args.api_base, key, f) for f in upload_files]

    platform_block: dict = {"platform": platform, "accountId": account_id}
    if args.pdf:
        title = args.document_title or meta.get("slug") or post_dir.name
        platform_block["platformSpecificData"] = {"documentTitle": title}

    payload: dict = {
        "content": caption,
        "mediaItems": media_items,
        "platforms": [platform_block],
    }
    if args.schedule_for:
        payload["scheduledFor"] = args.schedule_for
    else:
        payload["publishNow"] = True

    status, body = http(
        "POST", f"{args.api_base}/posts",
        headers={"Authorization": f"Bearer {key}"},
        body=payload,
    )
    if status not in (200, 201):
        fail(f"POST /posts failed: HTTP {status} {body[:500]}")

    j = json.loads(body)
    post = j.get("post", j)
    plats = post.get("platforms", [])
    plat0 = plats[0] if plats else {}
    print(json.dumps({
        "ok": True,
        "post_id": post.get("_id"),
        "platform": plat0.get("platform", platform),
        "status": plat0.get("status") or post.get("status"),
        "post_url": plat0.get("platformPostUrl"),
        "scheduled_for": args.schedule_for,
        "transport": "rest",
        "media_count": len(media_items),
        "optimized": optimized_count,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
