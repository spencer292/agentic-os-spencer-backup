#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright>=1.40.0"]
# ///
"""Import brand assets from a website URL into brand_context/.

What it captures (Playwright + headless Chromium):
- Logo: looks for <img alt*='logo'>, <img class*='logo'>, or favicon — saves to logos/
- Hero: full-bleed screenshot of the homepage top fold — saves to visual_refs/
- Components: screenshots of the first <button>, card-like element, and <nav> — saves to components/
- Colors: extracts CSS computed background/text color from the body — appends to a colors.txt seed
- Fonts: parses CSS @font-face declarations + <link href*='fonts.googleapis.com'> tags — appends to fonts.txt seed

The seed text files are NOT assets.md updates — they're rough observations
the user reviews. The actual assets.md edits happen via the brandbook UI or
design-questions flow, prefilled with these observations.

Usage:
    uv run import_url.py https://example.com
    uv run import_url.py https://example.com --apply
"""

from __future__ import annotations

import argparse
import re
import sys
import urllib.parse
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent


def find_project_root(start: Path) -> Path:
    for c in [start, *start.parents]:
        if c.name == ".claude":
            continue
        if (c / ".claude").is_dir():
            return c
    return Path.cwd()


PROJECT_ROOT = find_project_root(SCRIPT_DIR)
BRAND_CTX = PROJECT_ROOT / "brand_context"


def slugify(s: str) -> str:
    s = re.sub(r"^https?://", "", s).strip("/")
    s = re.sub(r"[^\w.-]+", "-", s).strip("-").lower()
    return s or "site"


def capture(url: str, out_dir: Path, dry_run: bool = True) -> dict:
    """Run the capture flow. Returns a dict summarizing what was found."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("ERROR: playwright not installed. Run: uv run playwright install chromium", file=sys.stderr)
        sys.exit(1)

    plan: dict = {
        "url": url,
        "logos": [],
        "hero": None,
        "components": [],
        "colors": {},
        "fonts": [],
        "errors": [],
    }

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = ctx.new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=10000)
        except Exception as e:
            plan["errors"].append(f"navigation: {e}")
            try:
                browser.close()
            except Exception:
                pass
            return plan

        # ─── Hero (top-fold screenshot) ────────────────────────────
        plan["hero"] = {
            "target": str(out_dir / "visual_refs" / f"homepage-{slugify(url)}.png"),
        }
        if not dry_run:
            Path(plan["hero"]["target"]).parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=plan["hero"]["target"], full_page=False, clip={"x": 0, "y": 0, "width": 1440, "height": 900})

        # ─── Logo ──────────────────────────────────────────────────
        logo_locator = page.locator("header img[alt*='logo' i], img[alt*='logo' i], img[class*='logo' i], a[class*='logo' i] img").first
        try:
            if logo_locator.count() > 0:
                logo_target = out_dir / "logos" / f"primary-{slugify(url)}.png"
                if not dry_run:
                    logo_target.parent.mkdir(parents=True, exist_ok=True)
                    logo_locator.screenshot(path=str(logo_target), omit_background=True)
                plan["logos"].append({"selector": "first <img alt*=logo>", "target": str(logo_target)})
        except Exception as e:
            plan["errors"].append(f"logo: {e}")

        # ─── Favicon (always — backup logo) ────────────────────────
        favicon_url = page.eval_on_selector(
            "link[rel*='icon']",
            "el => el.href",
            strict=False,
        ) if page.locator("link[rel*='icon']").count() else None
        if favicon_url:
            plan["logos"].append({"favicon": favicon_url, "note": "downloaded as logos/favicon.<ext>"})
            if not dry_run:
                try:
                    import urllib.request
                    ext = Path(urllib.parse.urlparse(favicon_url).path).suffix or ".ico"
                    fav_target = out_dir / "logos" / f"favicon{ext}"
                    fav_target.parent.mkdir(parents=True, exist_ok=True)
                    urllib.request.urlretrieve(favicon_url, fav_target)
                except Exception as e:
                    plan["errors"].append(f"favicon: {e}")

        # ─── Components (first button / card / nav) ────────────────
        component_targets = [
            ("button-primary", "button, a.btn, a[class*='button' i]"),
            ("card-first",     "article, .card, [class*='card' i]:not(nav):not(header):not(footer)"),
            ("navbar",         "header, nav, [role='navigation']"),
        ]
        for name, selector in component_targets:
            loc = page.locator(selector).first
            try:
                if loc.count() == 0:
                    continue
                target = out_dir / "components" / f"{name}-{slugify(url)}.png"
                if not dry_run:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    loc.screenshot(path=str(target))
                plan["components"].append({"name": name, "selector": selector, "target": str(target)})
            except Exception as e:
                plan["errors"].append(f"{name}: {e}")

        # ─── Colors (computed style of body + accent guess) ───────
        try:
            colors = page.evaluate("""() => {
                const body = document.body;
                const bs = getComputedStyle(body);
                const out = { background: bs.backgroundColor, text: bs.color };
                // Try to find an accent — first colored button background
                const buttons = document.querySelectorAll('button, a.btn, a[class*="button" i]');
                for (const b of buttons) {
                    const c = getComputedStyle(b).backgroundColor;
                    if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
                        out.accent = c;
                        break;
                    }
                }
                return out;
            }""")
            plan["colors"] = colors
        except Exception as e:
            plan["errors"].append(f"colors: {e}")

        # ─── Fonts ─────────────────────────────────────────────────
        try:
            fonts = page.evaluate("""() => {
                const families = new Set();
                // Google Fonts <link>
                const links = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
                for (const l of links) {
                    const m = l.href.match(/family=([^&]+)/g) || [];
                    for (const x of m) families.add(decodeURIComponent(x.replace('family=', '').split(':')[0].replace('+', ' ')));
                }
                // Computed font-family of body + first heading
                const body = getComputedStyle(document.body).fontFamily;
                if (body) families.add(body.split(',')[0].replace(/['"]/g, '').trim());
                const h1 = document.querySelector('h1, h2');
                if (h1) families.add(getComputedStyle(h1).fontFamily.split(',')[0].replace(/['"]/g, '').trim());
                return [...families].filter(Boolean);
            }""")
            plan["fonts"] = fonts
        except Exception as e:
            plan["errors"].append(f"fonts: {e}")

        browser.close()

    # ─── Write seed observations file (only on apply) ──────────────
    if not dry_run:
        seed = out_dir / f"_import-observations-{slugify(url)}.md"
        seed.parent.mkdir(parents=True, exist_ok=True)
        lines = [
            f"# Brand Import Observations — {url}",
            "",
            "Rough observations from the scrape. Review these before updating `assets.md`.",
            "",
            "## Colors (computed)",
        ]
        for k, v in plan["colors"].items():
            lines.append(f"- **{k}**: `{v}`")
        lines += ["", "## Fonts (declared/computed)"]
        for f in plan["fonts"]:
            lines.append(f"- {f}")
        lines += ["", "## Captured assets"]
        for kind, items in [("Logos", plan["logos"]), ("Components", plan["components"])]:
            if items:
                lines.append(f"\n### {kind}")
                for it in items:
                    lines.append(f"- {it.get('target', it)}")
        if plan["hero"]:
            lines.append(f"\n### Hero\n- {plan['hero']['target']}")
        if plan["errors"]:
            lines += ["", "## Errors"]
            for e in plan["errors"]:
                lines.append(f"- {e}")
        seed.write_text("\n".join(lines) + "\n", encoding="utf-8")
        plan["observations_file"] = str(seed)

    return plan


def print_plan(plan: dict, dry_run: bool) -> None:
    print("─" * 64)
    print(f"BRAND IMPORT FROM URL  →  {plan['url']}")
    print("─" * 64)
    print(f"\n[hero] {plan['hero']['target'] if plan['hero'] else '— none —'}")
    print(f"\n[logos] {len(plan['logos'])} found")
    for l in plan["logos"]:
        print(f"  · {l}")
    print(f"\n[components] {len(plan['components'])} captured")
    for c in plan["components"]:
        print(f"  · {c['name']:18s} {c.get('target', '')}")
    print(f"\n[colors] {plan['colors']}")
    print(f"\n[fonts] {plan['fonts']}")
    if plan["errors"]:
        print(f"\n[errors] {len(plan['errors'])}")
        for e in plan["errors"]:
            print(f"  ! {e}")
    print("\n" + "─" * 64)
    if dry_run:
        print("DRY RUN. Re-run with --apply to actually save.")
    elif plan.get("observations_file"):
        print(f"Observations: {plan['observations_file']}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("url", help="Website URL to scrape")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--brand-context", help="Override brand_context path")
    args = ap.parse_args()

    global BRAND_CTX
    if args.brand_context:
        BRAND_CTX = Path(args.brand_context).resolve()

    print(f"URL:           {args.url}")
    print(f"brand_context: {BRAND_CTX}\n")

    plan = capture(args.url, BRAND_CTX, dry_run=not args.apply)
    print_plan(plan, dry_run=not args.apply)


if __name__ == "__main__":
    main()
