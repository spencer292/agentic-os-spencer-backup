"""
List Zernio accounts connected to the workspace.

Default output is a JSON object on stdout:
  {"ok": true, "count": N, "accounts": [{"id": "...", "platform": "...", "username": "..."}, ...]}

With --table, prints a human-readable table to stdout instead.
On failure: {"ok": false, "error": "..."} with exit code 1.

Usage:
  python list_accounts.py [options]

Options:
  --platform PLATFORM   Filter by platform (e.g. "instagram", "linkedin")
  --table               Render as a table instead of JSON
  --env-file PATH       Path to .env (default: walk up from cwd)
  --api-base URL        Override https://zernio.com/api/v1
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

DEFAULT_API = "https://zernio.com/api/v1"


def fail(msg: str) -> "None":
    print(json.dumps({"ok": False, "error": msg}, ensure_ascii=False))
    sys.exit(1)


def find_env(override: Path | None) -> Path:
    if override:
        if not override.exists():
            fail(f".env file not found at {override}")
        return override
    cur = Path.cwd().resolve()
    for parent in [cur, *cur.parents]:
        candidate = parent / ".env"
        if candidate.exists():
            return candidate
    fail(f"no .env found walking up from {cur}")


def load_api_key(env_file: Path) -> str:
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line.startswith("ZERNIO_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    fail(f"ZERNIO_API_KEY not found in {env_file}")


def http_get(url: str, key: str) -> tuple[int, str]:
    req = urllib.request.Request(
        url, headers={"Authorization": f"Bearer {key}", "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as e:
        fail(f"network error: {e.reason}")


def render_table(accounts: list[dict]) -> str:
    if not accounts:
        return "No accounts connected."
    rows = [("PLATFORM", "USERNAME", "ID"), *(
        (a["platform"], a["username"] or "—", a["id"]) for a in accounts
    )]
    widths = [max(len(r[i]) for r in rows) for i in range(3)]
    lines = []
    for i, row in enumerate(rows):
        lines.append("  ".join(cell.ljust(widths[j]) for j, cell in enumerate(row)))
        if i == 0:
            lines.append("  ".join("-" * widths[j] for j in range(3)))
    return f"Connected Zernio accounts ({len(accounts)})\n\n" + "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--platform")
    ap.add_argument("--table", action="store_true")
    ap.add_argument("--env-file", type=Path)
    ap.add_argument("--api-base", default=DEFAULT_API)
    args = ap.parse_args()

    env_file = find_env(args.env_file)
    key = load_api_key(env_file)

    status, body = http_get(f"{args.api_base}/accounts", key)
    if status != 200:
        fail(f"GET /accounts failed: HTTP {status} {body[:300]}")

    raw = json.loads(body).get("accounts", [])
    accounts = [
        {
            "id": a.get("_id"),
            "platform": a.get("platform"),
            "username": a.get("username"),
        }
        for a in raw
        if not args.platform or a.get("platform") == args.platform
    ]

    if args.table:
        print(render_table(accounts))
    else:
        print(json.dumps(
            {"ok": True, "count": len(accounts), "accounts": accounts},
            ensure_ascii=False,
        ))


if __name__ == "__main__":
    main()
