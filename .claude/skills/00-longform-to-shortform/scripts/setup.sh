#!/bin/bash
# 00-longform-to-shortform setup: install Python deps for Phase 6 reframe.
#
# This script mirrors what `install.sh` already runs automatically during
# `npm install` / `npx scrapes-skills install`. Use it to re-setup or fix
# a broken venv (e.g., after a Python upgrade).
#
# Heavy deps for transcription (whisperx + torch) belong to
# `tool-transcription` — see `.claude/skills/tool-transcription/scripts/setup.sh`.

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

echo "=== 00-longform-to-shortform: reframe deps ==="
echo ""

# Resolve project root — walk up looking for .claude/, fall back to cwd.
PROJECT_ROOT="$(pwd)"
while [ "$PROJECT_ROOT" != "/" ] && [ ! -d "$PROJECT_ROOT/.claude" ]; do
  PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
done
if [ ! -d "$PROJECT_ROOT/.claude" ]; then
  fail "Could not locate project root (no .claude/ found). Run this from your project directory."
fi

SKILL_PACK="$PROJECT_ROOT/.claude/skills/00-longform-to-shortform/skill-pack"
VENV_DIR="$PROJECT_ROOT/projects/tools/.venv"
REQUIREMENTS="$SKILL_PACK/tools/reframe/requirements.txt"

if [ ! -f "$REQUIREMENTS" ]; then
  fail "Missing $REQUIREMENTS — skill not installed at $PROJECT_ROOT?"
fi

# ── Python 3.10-3.13 detection ────────────────────────────────────────────
PYTHON=""
case "$(uname -s)" in
  Darwin*)  candidates=(/opt/homebrew/bin/python3.12 /opt/homebrew/bin/python3.13 /opt/homebrew/bin/python3.11 /opt/homebrew/bin/python3.10 python3.12 python3.13 python3.11 python3.10 python3) ;;
  MINGW*|MSYS*|CYGWIN*) candidates=(python python3) ;;
  *)        candidates=(python3.12 python3.13 python3.11 python3.10 python3) ;;
esac

for cand in "${candidates[@]}"; do
  if command -v "$cand" >/dev/null 2>&1; then
    ver=$("$cand" --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
    major=$(echo "$ver" | cut -d. -f1)
    minor=$(echo "$ver" | cut -d. -f2)
    if [ "$major" = "3" ] && [ "$minor" -ge 10 ] 2>/dev/null && [ "$minor" -le 13 ] 2>/dev/null; then
      PYTHON="$cand"
      ok "Python: $PYTHON ($("$PYTHON" --version 2>&1))"
      break
    fi
  fi
done

[ -n "$PYTHON" ] || fail "Python 3.10-3.13 not found. Install Python 3.12 and retry."

# ── Venv ──────────────────────────────────────────────────────────────────
mkdir -p "$PROJECT_ROOT/projects/tools"

if [ -d "$VENV_DIR" ]; then
  warn "Existing venv at $VENV_DIR — reusing"
else
  echo "  Creating venv at projects/tools/.venv ..."
  "$PYTHON" -m venv "$VENV_DIR" || fail "venv creation failed"
  ok "venv created"
fi

# ── Locate pip ────────────────────────────────────────────────────────────
PIP=""
for cand_pip in "$VENV_DIR/bin/pip" "$VENV_DIR/Scripts/pip.exe" "$VENV_DIR/Scripts/pip"; do
  [ -x "$cand_pip" ] && PIP="$cand_pip" && break
done
[ -n "$PIP" ] || fail "pip not found in venv"

# ── Install deps ──────────────────────────────────────────────────────────
echo "  Installing opencv-python + numpy + scipy ..."
"$PIP" install --upgrade pip >/dev/null 2>&1 || true
if "$PIP" install -r "$REQUIREMENTS"; then
  ok "Reframe deps installed"
else
  fail "pip install failed. Retry: $PIP install -r $REQUIREMENTS"
fi

# ── Smoke test ────────────────────────────────────────────────────────────
echo "  Smoke test ..."
PY="$VENV_DIR/bin/python"
[ -x "$PY" ] || PY="$VENV_DIR/Scripts/python.exe"

if "$PY" -c "import cv2, numpy, scipy; print(f'cv2={cv2.__version__} numpy={numpy.__version__} scipy={scipy.__version__}')"; then
  ok "All packages importable"
else
  fail "Import test failed — venv is broken"
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Activate manually if needed:"
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) echo "  source $VENV_DIR/Scripts/activate" ;;
  *)                    echo "  source $VENV_DIR/bin/activate" ;;
esac
echo ""
echo "Phase 6 reframe will activate this venv automatically — see phase-6-reframe.md."
