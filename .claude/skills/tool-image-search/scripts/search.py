# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "requests",
# ]
# ///
"""Image search across Openverse, Wikimedia, Imgflip, Unsplash, Pexels, Bing.

Tier 1 (Openverse, Wikimedia, Imgflip) and Tier 2 (Unsplash, Pexels) use plain
HTTP via `requests`. Tier 3 (Bing) is opt-in via --allow-scraping and lazily
imports `playwright` + `playwright-stealth` — those deps are added to the
script's dependency list at runtime by uv's `--with` flag so users who never
scrape don't pay the Playwright download cost.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable
from urllib.parse import quote

import requests

UA = "tool-image-search/0.1 (+https://github.com/anthropics/claude-code)"
BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


@dataclass
class ImageHit:
    source: str
    engine_tier: int
    query: str
    intent: str
    image_url: str
    source_url: str = ""
    title: str = ""
    creator: str = ""
    license: str = ""
    license_url: str = ""
    attribution: str = ""
    width: int = 0
    height: int = 0
    image_path: str = ""
    warnings: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def slugify(text: str, max_len: int = 40) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:max_len].rstrip("-") or "query"


def ext_from_url(url: str, default: str = ".jpg") -> str:
    m = re.search(r"\.(jpe?g|png|webp|gif|svg)(?:\?|$)", url.lower())
    return f".{m.group(1)}" if m else default


def short_id(s: str, n: int = 8) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:n]


def detect_intent(query: str) -> str:
    q = query.lower()
    if any(t in q for t in ("logo", "icon of", "brand mark")):
        return "brand"
    if any(t in q for t in ("meme", "meme template", "template meme")):
        return "meme"
    if re.search(r"\b20(2[4-9]|3[0-9])\b", q):
        return "news"
    return "stock"


# ---------------------------------------------------------------------------
# Tier 1 — Openverse
# ---------------------------------------------------------------------------


def search_openverse(query: str, count: int, license_filter: str) -> list[ImageHit]:
    params = {"q": query, "page_size": min(count, 20)}
    if license_filter == "commercial":
        params["license_type"] = "commercial"
    r = requests.get(
        "https://api.openverse.org/v1/images/",
        params=params,
        headers={"User-Agent": UA},
        timeout=20,
    )
    r.raise_for_status()
    out = []
    for item in r.json().get("results", []):
        creator = item.get("creator", "") or ""
        lic = item.get("license", "")
        lic_url = item.get("license_url", "")
        attr = ""
        if creator and lic:
            attr = f"Photo by {creator} on {item.get('provider', 'web')}, CC {lic.upper()}"
        out.append(
            ImageHit(
                source="openverse",
                engine_tier=1,
                query=query,
                intent="",  # set by caller
                image_url=item.get("url", ""),
                source_url=item.get("foreign_landing_url", ""),
                title=item.get("title", "") or "",
                creator=creator,
                license=lic,
                license_url=lic_url,
                attribution=attr,
            )
        )
    return out


# ---------------------------------------------------------------------------
# Tier 1 — Wikimedia Commons
# ---------------------------------------------------------------------------


def search_wikimedia(query: str, count: int, thumb_width: int = 1024) -> list[ImageHit]:
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": str(min(count, 20)),
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "iiurlwidth": str(thumb_width),
    }
    r = requests.get(
        "https://commons.wikimedia.org/w/api.php",
        params=params,
        headers={"User-Agent": UA},
        timeout=20,
    )
    r.raise_for_status()
    pages = r.json().get("query", {}).get("pages", {}) or {}
    out = []
    for _, p in pages.items():
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {}) or {}
        title = p.get("title", "").removeprefix("File:")
        creator_raw = (meta.get("Artist", {}) or {}).get("value", "") or ""
        creator = re.sub(r"<[^>]+>", "", creator_raw).strip()
        lic = (meta.get("LicenseShortName", {}) or {}).get("value", "") or ""
        lic_url = (meta.get("LicenseUrl", {}) or {}).get("value", "") or ""
        # For SVG files, Wikimedia rasterizes `thumburl` into PNG at iiurlwidth.
        # Prefer the original `url` (the SVG itself) so brand logos stay vector.
        original_url = info.get("url", "") or ""
        is_svg = original_url.lower().endswith(".svg") or title.lower().endswith(".svg")
        image_url = original_url if is_svg else (info.get("thumburl") or original_url)
        width = (info.get("width") or 0) if is_svg else (info.get("thumbwidth") or info.get("width") or 0)
        height = (info.get("height") or 0) if is_svg else (info.get("thumbheight") or info.get("height") or 0)
        out.append(
            ImageHit(
                source="wikimedia",
                engine_tier=1,
                query=query,
                intent="",
                image_url=image_url,
                source_url=info.get("descriptionurl", ""),
                title=title,
                creator=creator[:120],
                license=lic,
                license_url=lic_url,
                attribution=f"{creator[:80]} via Wikimedia Commons, {lic}".strip(", ").strip(),
                width=width,
                height=height,
            )
        )
    return out


# ---------------------------------------------------------------------------
# Tier 1 — Imgflip
# ---------------------------------------------------------------------------


def search_imgflip(query: str, count: int) -> list[ImageHit]:
    r = requests.get(
        "https://api.imgflip.com/get_memes",
        headers={"User-Agent": UA},
        timeout=15,
    )
    r.raise_for_status()
    memes = (r.json().get("data") or {}).get("memes", [])
    q = query.lower()
    # Score by token overlap with name; if zero overlap, fall back to first N
    def score(m: dict) -> int:
        name = m.get("name", "").lower()
        return sum(1 for tok in re.findall(r"\w+", q) if tok and tok in name)

    ranked = sorted(memes, key=score, reverse=True)
    if ranked and score(ranked[0]) == 0:
        ranked = memes  # no relevance signal, keep popularity order
    out = []
    for m in ranked[:count]:
        out.append(
            ImageHit(
                source="imgflip",
                engine_tier=1,
                query=query,
                intent="",
                image_url=m.get("url", ""),
                source_url=f"https://imgflip.com/memetemplate/{m.get('id', '')}",
                title=m.get("name", ""),
                license="public-meme-template",
                attribution="Imgflip popular meme template",
                width=int(m.get("width") or 0),
                height=int(m.get("height") or 0),
            )
        )
    return out


# ---------------------------------------------------------------------------
# Tier 2 — Unsplash / Pexels (require API keys)
# ---------------------------------------------------------------------------


def search_unsplash(query: str, count: int) -> list[ImageHit]:
    key = os.environ.get("UNSPLASH_ACCESS_KEY", "").strip()
    if not key:
        return []
    r = requests.get(
        "https://api.unsplash.com/search/photos",
        params={"query": query, "per_page": min(count, 30)},
        headers={"Authorization": f"Client-ID {key}", "User-Agent": UA},
        timeout=20,
    )
    r.raise_for_status()
    out = []
    for item in r.json().get("results", []):
        user = item.get("user", {}) or {}
        out.append(
            ImageHit(
                source="unsplash",
                engine_tier=2,
                query=query,
                intent="",
                image_url=(item.get("urls") or {}).get("regular", ""),
                source_url=(item.get("links") or {}).get("html", ""),
                title=item.get("alt_description", "") or item.get("description", "") or "",
                creator=user.get("name", "") or "",
                license="unsplash-license",
                license_url="https://unsplash.com/license",
                attribution=f"Photo by {user.get('name','')} on Unsplash",
                width=int(item.get("width") or 0),
                height=int(item.get("height") or 0),
            )
        )
    return out


def search_pexels(query: str, count: int) -> list[ImageHit]:
    key = os.environ.get("PEXELS_API_KEY", "").strip()
    if not key:
        return []
    r = requests.get(
        "https://api.pexels.com/v1/search",
        params={"query": query, "per_page": min(count, 80)},
        headers={"Authorization": key, "User-Agent": UA},
        timeout=20,
    )
    r.raise_for_status()
    out = []
    for item in r.json().get("photos", []):
        out.append(
            ImageHit(
                source="pexels",
                engine_tier=2,
                query=query,
                intent="",
                image_url=(item.get("src") or {}).get("large2x") or (item.get("src") or {}).get("large", ""),
                source_url=item.get("url", ""),
                title=item.get("alt", "") or "",
                creator=item.get("photographer", "") or "",
                license="pexels-license",
                license_url="https://www.pexels.com/license/",
                attribution=f"Photo by {item.get('photographer','')} on Pexels",
                width=int(item.get("width") or 0),
                height=int(item.get("height") or 0),
            )
        )
    return out


# ---------------------------------------------------------------------------
# Tier 3 — Bing via Playwright + stealth (lazy import)
# ---------------------------------------------------------------------------


def search_bing_scrape(query: str, count: int) -> list[ImageHit]:
    """Lazy-imports playwright + playwright-stealth. Caller must have
    --allow-scraping set and the deps installed (see setup script)."""
    try:
        from playwright.sync_api import sync_playwright
        from playwright_stealth import Stealth
    except ImportError as e:
        raise RuntimeError(
            "Tier 3 needs `playwright` and `playwright-stealth`. "
            "Run the skill's setup script first, or invoke with "
            "`uv run --with playwright --with playwright-stealth`."
        ) from e

    out: list[ImageHit] = []
    with Stealth().use_sync(sync_playwright()) as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent=BROWSER_UA,
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
        )
        page = ctx.new_page()
        url = f"https://www.bing.com/images/search?q={quote(query)}&form=HDRSC2"
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)
        items = page.evaluate(
            """
            () => {
              const out = [];
              document.querySelectorAll('a.iusc').forEach(a => {
                try {
                  const m = JSON.parse(a.getAttribute('m'));
                  out.push({
                    url: m.murl, thumb: m.turl, page: m.purl,
                    title: m.t || '', w: m.mw || 0, h: m.mh || 0,
                  });
                } catch(e) {}
              });
              return out;
            }
            """
        )
        browser.close()

    for it in items[:count]:
        out.append(
            ImageHit(
                source="bing",
                engine_tier=3,
                query=query,
                intent="",
                image_url=it.get("url", ""),
                source_url=it.get("page", ""),
                title=it.get("title", "")[:200],
                license="unknown",
                attribution="",
                width=int(it.get("w") or 0),
                height=int(it.get("h") or 0),
                warnings=["scraped-no-license-guarantee"],
            )
        )
    return out


# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------


def route_intent(intent: str, *, allow_scraping: bool) -> list[str]:
    """Return ordered list of engines to try for an intent."""
    has_unsplash = bool(os.environ.get("UNSPLASH_ACCESS_KEY", "").strip())
    has_pexels = bool(os.environ.get("PEXELS_API_KEY", "").strip())

    if intent == "stock":
        chain = []
        if has_unsplash: chain.append("unsplash")
        if has_pexels:   chain.append("pexels")
        chain.append("openverse")
        if allow_scraping: chain.append("bing")
        return chain
    if intent == "brand":
        return ["wikimedia", "openverse"]
    if intent == "news":
        chain = ["bing"] if allow_scraping else []
        chain.append("openverse")
        return chain
    if intent == "meme":
        return ["imgflip", "openverse"]
    return ["openverse"]


ENGINES = {
    "openverse": (search_openverse, ("license_filter",)),
    "wikimedia": (search_wikimedia, ()),
    "imgflip":   (search_imgflip,   ()),
    "unsplash":  (search_unsplash,  ()),
    "pexels":    (search_pexels,    ()),
    "bing":      (search_bing_scrape, ()),
}


# ---------------------------------------------------------------------------
# Download + manifest
# ---------------------------------------------------------------------------


def download_image(hit: ImageHit, dest_dir: Path, index: int) -> bool:
    """Download hit's image URL into dest_dir/images/. Returns True on success."""
    images_dir = dest_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    ext = ext_from_url(hit.image_url)
    name = f"{index:02d}-{hit.source}-{short_id(hit.image_url)}{ext}"
    out_path = images_dir / name

    referer = ""
    if hit.source == "bing":
        referer = "https://www.bing.com/"
    elif hit.source_url:
        referer = hit.source_url

    headers = {"User-Agent": BROWSER_UA}
    if referer:
        headers["Referer"] = referer

    try:
        r = requests.get(hit.image_url, headers=headers, timeout=20)
        if r.status_code != 200 or len(r.content) < 1024:
            hit.warnings.append(f"download-failed:{r.status_code}")
            return False
        out_path.write_bytes(r.content)
        hit.image_path = str(out_path.relative_to(dest_dir))
        return True
    except Exception as e:
        hit.warnings.append(f"download-error:{type(e).__name__}")
        return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--query", required=True)
    ap.add_argument("--intent", choices=["stock", "brand", "news", "meme", "auto"], default="auto")
    ap.add_argument("--count", type=int, default=5)
    ap.add_argument("--license", choices=["commercial", "all"], default="commercial")
    ap.add_argument("--output-dir", help="Output dir (auto-generated if omitted)")
    ap.add_argument("--allow-scraping", action="store_true",
                    help="Enable Tier 3 (Playwright + Bing). Off by default.")
    ap.add_argument("--min-width", type=int, default=0)
    ap.add_argument(
        "--engine",
        choices=["auto", "openverse", "wikimedia", "imgflip", "unsplash", "pexels", "bing"],
        default="auto",
        help="Force a single engine (skips routing).",
    )
    args = ap.parse_args()

    count = max(1, min(args.count, 20))
    intent = detect_intent(args.query) if args.intent == "auto" else args.intent

    # Output dir
    if args.output_dir:
        out_dir = Path(args.output_dir)
    else:
        date = dt.datetime.now().strftime("%Y-%m-%d")
        out_dir = Path("projects/tool-image-search") / date / slugify(args.query)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Engine list
    if args.engine != "auto":
        engines = [args.engine]
    else:
        engines = route_intent(intent, allow_scraping=args.allow_scraping)

    if intent == "news" and not args.allow_scraping:
        print(
            "warning: intent=news without --allow-scraping has very limited "
            "coverage (Openverse only). Pass --allow-scraping for Bing access.",
            file=sys.stderr,
        )

    # Run engines until we have enough hits
    collected: list[ImageHit] = []
    for engine in engines:
        if len(collected) >= count:
            break
        try:
            fn, _ = ENGINES[engine]
            if engine == "openverse":
                results = fn(args.query, count, args.license)
            else:
                results = fn(args.query, count)
        except Exception as e:
            print(f"engine {engine} failed: {type(e).__name__}: {e}", file=sys.stderr)
            continue
        for h in results:
            h.intent = intent
            if args.min_width and h.width and h.width < args.min_width:
                continue
            collected.append(h)
            if len(collected) >= count:
                break

    # Download
    final = []
    for i, hit in enumerate(collected[:count], start=1):
        ok = download_image(hit, out_dir, i)
        if ok:
            final.append(hit)

    # Manifest — force UTF-8 because titles may contain emoji/non-Latin glyphs
    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps([asdict(h) for h in final], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    summary = {
        "query": args.query,
        "intent": intent,
        "engines_tried": engines,
        "downloaded": len(final),
        "output_dir": str(out_dir),
        "manifest": str(manifest_path),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
