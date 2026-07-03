#!/usr/bin/env bash
# Video Studio setup — lightweight, self-contained.
# The highlight path needs only ffmpeg + opencv-python + numpy (NO torch), so it does
# NOT reuse the heavy L2S reframe venv. It uses its own venv at projects/tools/.venv-studio.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
VENV="$ROOT/projects/tools/.venv-studio"

echo "[video-studio setup] checking ffmpeg..."
command -v ffmpeg >/dev/null 2>&1 || { echo "  ffmpeg NOT found. Install (winget install Gyan.FFmpeg / brew install ffmpeg) and re-run." >&2; exit 1; }
echo "  ffmpeg OK"

# Find any Python 3.10+ (3.14 is fine — opencv/numpy ship cp314 wheels; we don't use torch).
PYBIN=""
for c in python3.13 python3.12 python3.11 python3.10 python3 python py; do
  if command -v "$c" >/dev/null 2>&1; then PYBIN="$c"; break; fi
done
[ -n "$PYBIN" ] || { echo "  No Python found. Install Python 3.10+ and re-run." >&2; exit 1; }
echo "[video-studio setup] using $PYBIN ($("$PYBIN" --version 2>&1))"

if [ ! -d "$VENV" ]; then
  echo "[video-studio setup] creating venv at $VENV ..."
  "$PYBIN" -m venv "$VENV"
fi
PY="$VENV/Scripts/python.exe"; [ -x "$PY" ] || PY="$VENV/bin/python"

# Verify deps; if missing, print the install command (package installs are user-gated, not auto-run).
if ! "$PY" - <<'EOF' 2>/dev/null
import importlib, sys
sys.exit(0 if all(importlib.util.find_spec(m) for m in ("cv2", "numpy")) else 1)
EOF
then
  echo "  opencv/numpy missing in the studio venv. Run this once:" >&2
  echo "    \"$PY\" -m pip install opencv-python numpy" >&2
  exit 3
fi
echo "  opencv + numpy OK"
echo "[video-studio setup] done. Highlight path ready."
