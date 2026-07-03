#!/usr/bin/env python3
"""Import a folder of brand assets into brand_context/.

Walks the folder, auto-classifies each file by name+extension, and copies
into the right subfolder of `<project_root>/brand_context/`.

Two modes:
    --dry-run  (default) → print classification plan, copy nothing
    --apply              → actually copy files

Usage:
    python import_folder.py ~/Downloads/my-brand/
    python import_folder.py ~/Downloads/my-brand/ --apply

Stdlib only.
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
import unicodedata
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

CATEGORIES = ["logos", "fonts", "icons", "templates", "visual_refs", "components"]

# Classification rules. Order matters — first match wins.
RULES = [
    # Fonts (most specific extensions, easy)
    {"ext": {".ttf", ".otf", ".woff", ".woff2"},
     "category": "fonts",
     "reason": "font file (extension)"},
    # Logos — image + filename hint
    {"ext": {".svg", ".png", ".jpg", ".jpeg", ".webp"},
     "name_match": re.compile(r"\blogo\b|logomark|logotype|wordmark|brand[-_]?mark", re.I),
     "category": "logos",
     "reason": "image with 'logo' / 'mark' in filename"},
    # Headshot / author
    {"ext": {".png", ".jpg", ".jpeg", ".webp"},
     "name_match": re.compile(r"headshot|portrait|profile[-_]?pic|avatar", re.I),
     "category": "logos",
     "reason": "looks like an author headshot (also lands in logos/ since author chip uses it)"},
    # Icons — by path or filename
    {"ext": {".svg", ".png", ".jpg", ".jpeg", ".webp"},
     "path_match": re.compile(r"[\\/]icons?[\\/]", re.I),
     "category": "icons",
     "reason": "lives in an /icons/ folder"},
    {"ext": {".svg", ".png", ".webp"},
     "name_match": re.compile(r"^icon[-_]|[-_]icon\.|^ic[-_]", re.I),
     "category": "icons",
     "reason": "filename starts with 'icon' or 'ic-'"},
    # Components — buttons, cards, navbars
    {"ext": {".png", ".jpg", ".jpeg", ".webp", ".svg"},
     "name_match": re.compile(r"\b(button|btn|card|navbar|nav|hero|footer|cta)\b", re.I),
     "category": "components",
     "reason": "filename suggests a UI component"},
    # PDFs — brand guidelines / decks / one-pagers
    {"ext": {".pdf"},
     "category": "templates",
     "reason": "PDF — brand guideline or reference doc"},
    # HTML — possibly a template the user wrote
    {"ext": {".html", ".htm"},
     "category": "templates",
     "reason": "HTML file — likely a layout reference"},
    # Catch-all images → visual_refs
    {"ext": {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"},
     "category": "visual_refs",
     "reason": "image (fallback)"},
]

SKIP_FILES = {".DS_Store", "Thumbs.db", "desktop.ini"}
SKIP_PATTERNS = [re.compile(r"^\."), re.compile(r"~$")]
MAX_SIZE_MB = 50


def safe_filename(name: str) -> str:
    """ASCII-normalize, replace spaces with hyphens, strip unsafe chars."""
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-._")
    return name or "file"


def classify(file: Path, source_root: Path) -> dict | None:
    """Return {category, reason, target_name} or None to skip."""
    if file.name in SKIP_FILES:
        return None
    for p in SKIP_PATTERNS:
        if p.search(file.name):
            return None
    if file.stat().st_size > MAX_SIZE_MB * 1024 * 1024:
        return None

    ext = file.suffix.lower()
    rel_path = str(file.relative_to(source_root))

    for rule in RULES:
        if ext not in rule["ext"]:
            continue
        if "name_match" in rule and not rule["name_match"].search(file.name):
            continue
        if "path_match" in rule and not rule["path_match"].search(rel_path):
            continue
        return {
            "category": rule["category"],
            "reason": rule["reason"],
            "target_name": safe_filename(file.name),
        }
    return None  # unrecognized → skipped


def walk_and_classify(source: Path) -> list[dict]:
    """Walk source tree, return list of classifications."""
    plan = []
    for file in sorted(source.rglob("*")):
        if not file.is_file():
            continue
        c = classify(file, source)
        if c is None:
            plan.append({"source": str(file), "skip": True, "reason": "no rule matched / too large / hidden"})
            continue
        plan.append({
            "source": str(file),
            "category": c["category"],
            "target": str(BRAND_CTX / c["category"] / c["target_name"]),
            "target_name": c["target_name"],
            "reason": c["reason"],
        })
    return plan


def print_plan(plan: list[dict]) -> None:
    summary = {}
    skipped = 0
    for entry in plan:
        if entry.get("skip"):
            skipped += 1
            continue
        summary.setdefault(entry["category"], []).append(entry)

    print("─" * 64)
    print(f"BRAND IMPORT PLAN  →  {BRAND_CTX}")
    print("─" * 64)
    for cat in CATEGORIES:
        items = summary.get(cat, [])
        if not items:
            continue
        print(f"\n[{cat}/]  {len(items)} file(s)")
        for entry in items:
            src = Path(entry["source"]).name
            tgt = entry["target_name"]
            note = "" if src == tgt else f" → {tgt}"
            print(f"  · {src}{note}    ({entry['reason']})")
    if skipped:
        print(f"\nSkipped: {skipped} file(s) (no matching rule, hidden, or > {MAX_SIZE_MB}MB)")
    print("\n" + "─" * 64)


def apply_plan(plan: list[dict]) -> dict:
    """Copy files. Returns summary {copied, skipped, errors}."""
    summary = {"copied": 0, "skipped": 0, "errors": []}
    for entry in plan:
        if entry.get("skip"):
            summary["skipped"] += 1
            continue
        target = Path(entry["target"])
        target.parent.mkdir(parents=True, exist_ok=True)
        # Don't overwrite — append a counter to filename if conflict
        if target.exists():
            stem, suffix = target.stem, target.suffix
            i = 1
            while target.exists():
                target = target.parent / f"{stem}-{i}{suffix}"
                i += 1
        try:
            shutil.copy2(entry["source"], target)
            summary["copied"] += 1
        except Exception as e:
            summary["errors"].append({"source": entry["source"], "error": str(e)})
    return summary


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("source", help="Folder containing brand assets to import")
    ap.add_argument("--apply", action="store_true", help="Actually copy (default is dry-run)")
    ap.add_argument("--brand-context", help="Override brand_context path (default: auto-detect)")
    args = ap.parse_args()

    source = Path(args.source).expanduser().resolve()
    if not source.is_dir():
        print(f"ERROR: not a directory: {source}", file=sys.stderr)
        sys.exit(1)

    global BRAND_CTX
    if args.brand_context:
        BRAND_CTX = Path(args.brand_context).resolve()

    print(f"Source:        {source}")
    print(f"brand_context: {BRAND_CTX}")
    print()

    plan = walk_and_classify(source)
    print_plan(plan)

    if not args.apply:
        print("\nDRY RUN. Re-run with --apply to copy files.")
        return

    print("\nApplying...")
    summary = apply_plan(plan)
    print(f"✓ Copied: {summary['copied']}")
    print(f"  Skipped: {summary['skipped']}")
    if summary["errors"]:
        print(f"  Errors: {len(summary['errors'])}")
        for e in summary["errors"]:
            print(f"    {e['source']}: {e['error']}")


if __name__ == "__main__":
    main()
