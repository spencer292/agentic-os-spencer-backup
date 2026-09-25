#!/bin/bash
# Brand Build System (00-brand-build) Installer
#
# Usage:
#   ./install.sh                              # Fresh project in ./00-brand-build/
#   ./install.sh /path/to/project             # Fresh project at specified path
#   ./install.sh --target /path/to/existing   # Add to existing Claude Code / Agentic OS project
#   ./install.sh --force --target /existing   # Overwrite skills that already exist
#
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET=""
MODE="fresh"
FORCE=false

# ─── PLATFORM DETECTION ────────────────────────────────────────────────────
OS="$(uname -s)"
case "$OS" in
  Darwin*)  PLATFORM="macos" ;;
  Linux*)   PLATFORM="linux" ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
  *)        PLATFORM="unknown" ;;
esac

sed_inplace() {
  if [ "$PLATFORM" = "macos" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

install_hint() {
  local cmd="$1"
  case "$PLATFORM" in
    macos)   echo "brew install $cmd" ;;
    linux)   echo "apt install $cmd  # or your distro's package manager" ;;
    windows) echo "winget install $cmd  # or choco install $cmd" ;;
    *)       echo "Install $cmd via your system package manager" ;;
  esac
}

# ─── ARGUMENTS ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) MODE="existing"; TARGET="$2"; shift 2 ;;
    --force)  FORCE=true; shift ;;
    --help|-h)
      echo "Brand Build System Installer"
      echo ""
      echo "Usage:"
      echo "  ./install.sh                              Fresh project in ./00-brand-build/"
      echo "  ./install.sh /path/to/project             Fresh project at specified path"
      echo "  ./install.sh --target /existing/project   Add to existing project"
      echo "  ./install.sh --force --target /existing   Overwrite existing skills"
      exit 0 ;;
    *) TARGET="$1"; shift ;;
  esac
done

[ -z "$TARGET" ] && TARGET="$(pwd)/00-brand-build"

echo "==> Brand Build System Installer (platform: $PLATFORM)"
echo "    Mode: $MODE"
echo "    Target: $TARGET"
echo ""

# ─── PREREQUISITES ──────────────────────────────────────────────────────────
MISSING=""
command -v node &>/dev/null || MISSING="$MISSING node"
command -v python3 &>/dev/null || command -v python &>/dev/null || MISSING="$MISSING python3"
if [ -n "$MISSING" ]; then
  echo "ERROR: Missing prerequisites:$MISSING"
  echo ""
  for cmd in $MISSING; do
    echo "       $(install_hint "$cmd")"
  done
  exit 1
fi
# Non-blocking checks
PYBIN="$(command -v python3 || command -v python)"
if ! "$PYBIN" -c "import PIL, fitz, numpy, scipy, yaml" &>/dev/null; then
  echo "    NOTE: some Python packages are missing. Install with:"
  echo "          pip install pillow pymupdf numpy scipy pyyaml"
  echo ""
fi
echo "    NOTE: Google Chrome is required for PDF rendering (deck + brand book)."
echo ""

ENTRY_SKILL=$(grep '^entry_skill:' "$SCRIPT_DIR/PACKAGE.yaml" | head -1 | sed 's/entry_skill: *//')

# ─── FRESH MODE ─────────────────────────────────────────────────────────────
if [ "$MODE" = "fresh" ]; then
  if [ -d "$TARGET" ] && [ "$(ls -A "$TARGET" 2>/dev/null)" ]; then
    echo "ERROR: Target directory '$TARGET' already exists and is not empty."
    echo "       Use --target for existing projects, or choose a different path."
    exit 1
  fi
  echo "==> Creating project structure..."
  mkdir -p "$TARGET/.claude/skills" "$TARGET/.claude/agents" "$TARGET/brand_context" \
           "$TARGET/projects/$ENTRY_SKILL" "$TARGET/context"
fi

# ─── EXISTING MODE PRECHECK ─────────────────────────────────────────────────
if [ "$MODE" = "existing" ] && [ ! -d "$TARGET" ]; then
  echo "ERROR: Target directory '$TARGET' does not exist."
  exit 1
fi

# ─── SKILLS ─────────────────────────────────────────────────────────────────
echo "==> Installing skills..."
mkdir -p "$TARGET/.claude/skills"
INSTALLED_SKILLS=""
for skill_dir in "$SCRIPT_DIR/skills/"*/; do
  skill_name=$(basename "$skill_dir")
  dest="$TARGET/.claude/skills/$skill_name"
  if [ -d "$dest" ] && [ "$FORCE" != "true" ]; then
    echo "    SKIP: $skill_name (already exists — use --force to overwrite)"
  else
    cp -r "$skill_dir" "$TARGET/.claude/skills/" 2>/dev/null || {
      # cp -r into existing dir merges on some platforms; force copy contents
      mkdir -p "$dest"
      cp -r "$skill_dir"/. "$dest"/
    }
    INSTALLED_SKILLS="$INSTALLED_SKILLS $skill_name"
    echo "    OK: $skill_name"
  fi
done

# ─── AGENTS ─────────────────────────────────────────────────────────────────
echo "==> Installing sub-agents..."
mkdir -p "$TARGET/.claude/agents"
for agent_file in "$SCRIPT_DIR/agents/"*.md; do
  [ -f "$agent_file" ] || continue
  base=$(basename "$agent_file")
  dest="$TARGET/.claude/agents/$base"
  if [ -f "$dest" ] && [ "$FORCE" != "true" ]; then
    echo "    SKIP: $base (already exists)"
  else
    cp "$agent_file" "$dest"
    echo "    OK: $base"
  fi
done

# ─── RENDER SYS-CONFIG PATHS ────────────────────────────────────────────────
# Every skill just installed carries skill-pack/config/sys-config.md with {{TARGET}}
# placeholders. Render them to the actual install path (forward slashes).
echo "==> Writing path config..."
if [ "$PLATFORM" = "windows" ] && command -v cygpath &>/dev/null; then
  TARGET_FWD=$(cygpath -m "$TARGET")   # C:/mixed/form — what node/python expect
else
  TARGET_FWD=$(echo "$TARGET" | sed 's|\\|/|g')
fi
for skill_name in $INSTALLED_SKILLS; do
  cfg="$TARGET/.claude/skills/$skill_name/skill-pack/config/sys-config.md"
  if [ -f "$cfg" ] && grep -q '{{TARGET}}' "$cfg"; then
    sed_inplace "s|{{TARGET}}|$TARGET_FWD|g" "$cfg"
    echo "    OK: $skill_name/skill-pack/config/sys-config.md"
  fi
done

# ─── .ENV.EXAMPLE MERGE ─────────────────────────────────────────────────────
echo "==> Merging service keys into .env.example..."
SRC_ENV="$SCRIPT_DIR/skills/$ENTRY_SKILL/skill-pack/templates/.env.example"
if [ -f "$TARGET/.env.example" ]; then
  while IFS= read -r line; do
    key=$(echo "$line" | grep -oE '^[A-Z_]+=' | tr -d '=')
    if [ -n "$key" ] && ! grep -q "^${key}=" "$TARGET/.env.example"; then
      echo "$line" >> "$TARGET/.env.example"
      echo "    Added: $key"
    fi
  done < "$SRC_ENV"
else
  cp "$SRC_ENV" "$TARGET/.env.example"
  echo "    Created .env.example"
fi

# ─── OUTPUT DIRS ────────────────────────────────────────────────────────────
mkdir -p "$TARGET/projects/$ENTRY_SKILL" "$TARGET/brand_context"

# ─── DONE ───────────────────────────────────────────────────────────────────
echo ""
echo "==> Installation complete!"
echo ""
echo "    Skills:  $TARGET/.claude/skills/"
echo "    Agents:  $TARGET/.claude/agents/"
echo "    Outputs: $TARGET/projects/$ENTRY_SKILL/  and  $TARGET/brand_context/"
echo ""
echo "    Setup checklist (nothing here blocks the build):"
echo "      1. Put API keys in $TARGET/.env  (see .env.example — GEMINI_API_KEY recommended)"
echo "      2. pip install pillow pymupdf numpy scipy pyyaml"
echo "      3. Make sure Google Chrome is installed (PDF rendering)"
echo ""
echo "    First-run guide: .claude/skills/$ENTRY_SKILL/references/onboarding.md"
echo ""
echo "    Quick start:"
echo "      cd \"$TARGET\""
echo "      claude"
echo "      > /00-brand-build YourBrandName     (or just say: build a brand)"
echo ""
