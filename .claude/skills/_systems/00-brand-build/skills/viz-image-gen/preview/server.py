"""Per-slide preview + re-render server for the social-content pipeline.

Run from the project root:
    python .claude/skills/viz-image-gen/preview/server.py <run_dir>

Where `<run_dir>` is the project run folder, e.g.:
    projects/00-social-content/2026-05-18/your-post-slug/

Opens http://127.0.0.1:8766 in a browser. UI lets you:
- See every slide rendered, side-by-side with its text content
- Click any text to edit inline
- Click "Re-render this slide" to call the image-gen pipeline for that slide only
- Save the updated slide_plan.yaml back to disk

Stdlib-only. Binds 127.0.0.1 only.
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import re
import subprocess
import sys
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
INDEX_FILE = ROOT / "index.html"

PORT = 8766
HOST = "127.0.0.1"


def find_project_root(start: Path) -> Path:
    for candidate in [start, *start.parents]:
        if candidate.name == ".claude":
            continue
        if (candidate / ".claude").is_dir():
            return candidate
    return Path.cwd()


PROJECT_ROOT = find_project_root(ROOT)


def parse_simple_yaml(text: str):
    """Very small YAML subset parser — supports key: value pairs, multi-line
    strings via `key: |` block, and lists of flat maps under `slides:`."""
    out = {}
    lines = text.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.lstrip().startswith("#"):
            i += 1
            continue
        if not line.startswith(" "):
            stripped = line.rstrip()
            if stripped.endswith(": |") or stripped.endswith(": |+") or stripped.endswith(": |-"):
                key = stripped.split(":")[0].strip()
                # consume indented block
                block_lines = []
                j = i + 1
                while j < len(lines):
                    nxt = lines[j]
                    if nxt and not nxt.startswith(" ") and nxt.strip():
                        break
                    if nxt.startswith("  "):
                        block_lines.append(nxt[2:])
                    elif not nxt.strip():
                        block_lines.append("")
                    else:
                        break
                    j += 1
                out[key] = "\n".join(block_lines).rstrip()
                i = j
                continue
            if stripped.endswith(":"):
                key = stripped.split(":")[0].strip()
                if key == "slides":
                    items, j = parse_slides_block(lines, i + 1)
                    out["slides"] = items
                    i = j
                    continue
            else:
                m = re.match(r"^([\w_]+):\s*(.*)$", line)
                if m:
                    out[m.group(1)] = strip_quotes(m.group(2))
        i += 1
    return out


def parse_slides_block(lines, start):
    items = []
    cur = None
    i = start
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        # New item
        m_item = re.match(r"^\s*-\s+([\w_]+):\s*(.*)$", line)
        if m_item:
            if cur is not None:
                items.append(cur)
            cur = {m_item.group(1): strip_quotes(m_item.group(2))}
            i += 1
            continue
        m_pair = re.match(r"^\s+([\w_]+):\s*(.*)$", line)
        if m_pair and cur is not None:
            cur[m_pair.group(1)] = strip_quotes(m_pair.group(2))
            i += 1
            continue
        # End of block
        if not line.startswith(" "):
            break
        i += 1
    if cur is not None:
        items.append(cur)
    return items, i


def strip_quotes(s: str) -> str:
    s = s.strip()
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        return s[1:-1]
    return s


def find_slide_plan(run_dir: Path):
    for name in ("slide_plan.yaml", "slide_plan.json", "post.yaml"):
        f = run_dir / name
        if f.is_file():
            return f
    return None


def load_brand_summary() -> dict:
    """Read brand_context/assets.md + tokens.md and produce a small summary
    for the preview header. Best-effort — empty fields stay None."""
    try:
        import importlib, sys
        bkl_path = PROJECT_ROOT / ".claude" / "skills" / "viz-image-gen" / "scripts"
        if str(bkl_path) not in sys.path:
            sys.path.insert(0, str(bkl_path))
        bkl = importlib.import_module("brand_kit_loader")
        kit = bkl.load()
        return {
            "brand": kit.get("brand"),
            "primary":    kit.get("colors", {}).get("primary"),
            "secondary":  kit.get("colors", {}).get("secondary"),
            "background": kit.get("colors", {}).get("background"),
            "text":       kit.get("colors", {}).get("text"),
            "accents":    kit.get("colors", {}).get("accents", []),
            "fonts": {
                "headline": kit.get("fonts", {}).get("headline_family"),
                "body":     kit.get("fonts", {}).get("body_family"),
            },
            "logo_path": kit.get("logo", {}).get("primary_path"),
            "tone":      kit.get("tokens", {}).get("tone"),
        }
    except Exception:
        return {}


def find_latest_run() -> Path | None:
    """Find the most recent run folder under projects/00-social-content/<date>/<slug>/."""
    base = PROJECT_ROOT / "projects" / "00-social-content"
    if not base.is_dir():
        return None
    candidates = []
    for date_dir in base.iterdir():
        if not date_dir.is_dir():
            continue
        for slug_dir in date_dir.iterdir():
            if not slug_dir.is_dir():
                continue
            plan = find_slide_plan(slug_dir)
            if plan:
                candidates.append((slug_dir, plan.stat().st_mtime))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates[0][0]


def load_run(run_dir: Path):
    plan_file = find_slide_plan(run_dir)
    if not plan_file:
        return {"error": f"no slide_plan in {run_dir}", "run_dir": str(run_dir)}
    text = plan_file.read_text(encoding="utf-8")
    try:
        if plan_file.suffix == ".json":
            data = json.loads(text)
        else:
            data = parse_simple_yaml(text)
    except Exception as e:
        return {"error": f"parse error: {e}", "run_dir": str(run_dir)}
    slides = data.get("slides", []) or []
    # locate rendered images per slide
    images_dir = run_dir / "images"
    for slide in slides:
        n = slide.get("n") or slides.index(slide) + 1
        candidates = [
            images_dir / f"slide-{int(n):02d}.png",
            images_dir / f"slide_{int(n):02d}.png",
            images_dir / f"slide-{n}.png",
            run_dir / f"slide-{int(n):02d}.png",
        ]
        slide["image_url"] = None
        for c in candidates:
            if c.is_file():
                rel = c.relative_to(run_dir)
                slide["image_url"] = f"/runfiles/{rel.as_posix()}"
                break
    return {
        "run_dir": str(run_dir),
        "plan_file": plan_file.name,
        "brand_name":    data.get("brand_name") or data.get("brand", "Untitled"),
        "author_name":   data.get("author_name"),
        "author_handle": data.get("author_handle"),
        "author_role":   data.get("author_role"),
        "caption":       data.get("caption", ""),
        "platform":      data.get("platform", "linkedin"),
        "skill":         data.get("skill") or data.get("template_pool") or "linkedin-carousel",
        "slides":        slides,
        "brand_summary": load_brand_summary(),
    }


def save_slide_text(run_dir: Path, slide_index: int, updates: dict) -> bool:
    """Re-write the slide_plan file with updated text for one slide. Naive
    line-based rewrite — preserves comments/order."""
    plan_file = find_slide_plan(run_dir)
    if not plan_file:
        return False
    text = plan_file.read_text(encoding="utf-8")
    if plan_file.suffix == ".json":
        data = json.loads(text)
        if slide_index < len(data.get("slides", [])):
            data["slides"][slide_index].update(updates)
        plan_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        return True
    # YAML naive path: find the slide block by n, then update inline keys
    lines = text.split("\n")
    # find the slide block start by " - n: <slide_index+1>"
    target_n = str(slide_index + 1)
    block_start = None
    for i, line in enumerate(lines):
        if re.match(rf"^\s*-\s+n:\s*{target_n}\b", line):
            block_start = i
            break
    if block_start is None:
        return False
    block_end = len(lines)
    for j in range(block_start + 1, len(lines)):
        if re.match(r"^\s*-\s+n:\s*\d", lines[j]) or (lines[j] and not lines[j].startswith(" ")):
            block_end = j
            break
    block = lines[block_start:block_end]
    for k, v in updates.items():
        replaced = False
        for idx in range(len(block)):
            if re.match(rf"^\s+{k}:", block[idx]):
                indent = re.match(r"^(\s+)", block[idx]).group(1)
                block[idx] = f"{indent}{k}: {json.dumps(v, ensure_ascii=False)}"
                replaced = True
                break
        if not replaced:
            block.append(f"    {k}: {json.dumps(v, ensure_ascii=False)}")
    lines = lines[:block_start] + block + lines[block_end:]
    plan_file.write_text("\n".join(lines), encoding="utf-8")
    return True


def regenerate_slide(run_dir: Path, slide_index: int) -> dict:
    """Trigger image-gen for a single slide. Calls the project's renderer if
    present; otherwise reports the command the user should run manually."""
    renderer = PROJECT_ROOT / ".claude" / "skills" / "viz-image-gen" / "scripts" / "render_template.py"
    if not renderer.is_file():
        return {
            "ok": False,
            "manual": f"python {renderer} --run-dir {run_dir} --slide {slide_index + 1}",
            "error": "renderer script not found",
        }
    try:
        result = subprocess.run(
            ["python", str(renderer), "--run-dir", str(run_dir), "--slide", str(slide_index + 1)],
            capture_output=True, text=True, timeout=180,
        )
        return {
            "ok": result.returncode == 0,
            "stdout": result.stdout[-2000:],
            "stderr": result.stderr[-2000:],
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "render timed out (>180s)"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def make_handler(run_dir: Path):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):
            print(f"[{self.log_date_time_string()}] {fmt % args}")

        def _send_json(self, status, body):
            data = json.dumps(body, default=str).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _send_file(self, path, ctype=None):
            if not path.is_file():
                self.send_error(404)
                return
            ctype = ctype or mimetypes.guess_type(str(path))[0] or "application/octet-stream"
            data = path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _read_json(self):
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > 5_000_000:
                self._send_json(400, {"error": "invalid content length"})
                return None
            raw = self.rfile.read(length)
            try:
                return json.loads(raw.decode("utf-8"))
            except Exception as e:
                self._send_json(400, {"error": f"invalid json: {e}"})
                return None

        def do_GET(self):
            parsed = urlparse(self.path)
            path = unquote(parsed.path)

            if path in ("/", "/index.html"):
                self._send_file(INDEX_FILE, "text/html; charset=utf-8")
                return

            if path == "/api/run":
                self._send_json(200, load_run(run_dir))
                return

            if path.startswith("/runfiles/"):
                rel = path[len("/runfiles/"):]
                target = (run_dir / rel).resolve()
                try:
                    target.relative_to(run_dir.resolve())
                except ValueError:
                    self.send_error(403)
                    return
                self._send_file(target)
                return

            self.send_error(404)

        def do_POST(self):
            parsed = urlparse(self.path)
            path = unquote(parsed.path)

            if path == "/api/save-slide":
                body = self._read_json()
                if body is None:
                    return
                idx = body.get("index")
                updates = body.get("updates") or {}
                if idx is None or not isinstance(updates, dict):
                    self._send_json(400, {"error": "missing index/updates"})
                    return
                ok = save_slide_text(run_dir, int(idx), updates)
                self._send_json(200 if ok else 500, {"ok": ok})
                return

            if path == "/api/save-caption":
                body = self._read_json()
                if body is None:
                    return
                new_caption = body.get("caption", "")
                plan_file = find_slide_plan(run_dir)
                if not plan_file:
                    self._send_json(404, {"error": "no slide_plan"})
                    return
                text = plan_file.read_text(encoding="utf-8")
                # naive: replace the `caption: |` block (or add one)
                if plan_file.suffix == ".json":
                    data = json.loads(text)
                    data["caption"] = new_caption
                    plan_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
                else:
                    lines = text.split("\n")
                    # find caption block (caption: |) and replace its indented body
                    new_lines = []
                    i = 0
                    replaced = False
                    while i < len(lines):
                        line = lines[i]
                        if re.match(r"^caption:\s*\|", line):
                            new_lines.append("caption: |")
                            for c in new_caption.split("\n"):
                                new_lines.append("  " + c)
                            # skip the old block
                            j = i + 1
                            while j < len(lines) and (lines[j].startswith("  ") or not lines[j].strip()):
                                j += 1
                            i = j
                            replaced = True
                            continue
                        new_lines.append(line)
                        i += 1
                    if not replaced:
                        new_lines.append("caption: |")
                        for c in new_caption.split("\n"):
                            new_lines.append("  " + c)
                    plan_file.write_text("\n".join(new_lines), encoding="utf-8")
                self._send_json(200, {"ok": True})
                return

            if path == "/api/regenerate-slide":
                body = self._read_json()
                if body is None:
                    return
                idx = body.get("index")
                if idx is None:
                    self._send_json(400, {"error": "missing index"})
                    return
                result = regenerate_slide(run_dir, int(idx))
                self._send_json(200 if result.get("ok") else 500, result)
                return

            self.send_error(404)

    return Handler


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir", nargs="?", default=None,
                    help="path to the project run folder. If omitted, picks the most recent run from projects/00-social-content/")
    ap.add_argument("--port", type=int, default=PORT)
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()

    if args.run_dir:
        run_dir = Path(args.run_dir).resolve()
    else:
        latest = find_latest_run()
        if not latest:
            print("error: no runs found under projects/00-social-content/. Pass a run_dir explicitly.", file=sys.stderr)
            sys.exit(1)
        run_dir = latest
        print(f"Auto-detected latest run: {run_dir}")

    if not run_dir.is_dir():
        print(f"error: run_dir does not exist: {run_dir}", file=sys.stderr)
        sys.exit(1)

    handler = make_handler(run_dir)
    server = ThreadingHTTPServer((HOST, args.port), handler)
    url = f"http://{HOST}:{args.port}/"
    print(f"Slide Preview running at {url}")
    print(f"Run dir:  {run_dir}")
    print("Ctrl+C to stop.")
    if not args.no_browser:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
