#!/bin/bash
# Install a packaged skill system from .claude/skills/_systems/{name} into THIS project.
#
# Usage: bash scripts/add-system.sh {system-name} [--force]
#
set -e

SYSTEM_NAME="$1"
FORCE_FLAG=""
[ "$2" = "--force" ] && FORCE_FLAG="--force"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SYSTEM_DIR="$PROJECT_DIR/.claude/skills/_systems/$SYSTEM_NAME"

if [ -z "$SYSTEM_NAME" ]; then
  echo "Usage: bash scripts/add-system.sh {system-name} [--force]"
  echo ""
  echo "Available systems:"
  ls "$PROJECT_DIR/.claude/skills/_systems/" 2>/dev/null || echo "  (none packaged yet)"
  exit 1
fi

if [ ! -f "$SYSTEM_DIR/install.sh" ]; then
  echo "ERROR: No system named '$SYSTEM_NAME' in .claude/skills/_systems/"
  exit 1
fi

bash "$SYSTEM_DIR/install.sh" --target "$PROJECT_DIR" $FORCE_FLAG

# Print the get_started hint from the manifest
GET_STARTED=$(grep '^get_started:' "$SYSTEM_DIR/PACKAGE.yaml" | sed 's/get_started: *//' | tr -d '"')
[ -n "$GET_STARTED" ] && echo "$GET_STARTED"
