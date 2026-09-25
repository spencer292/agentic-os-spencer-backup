#!/bin/bash
# Remove a skill system's skills + agents from THIS project (the package under
# .claude/skills/_systems/{name} is kept so it can be reinstalled).
#
# Usage: bash scripts/remove-system.sh {system-name} [--yes]
#
set -e

SYSTEM_NAME="$1"
CONFIRM="$2"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SYSTEM_DIR="$PROJECT_DIR/.claude/skills/_systems/$SYSTEM_NAME"

if [ -z "$SYSTEM_NAME" ] || [ ! -f "$SYSTEM_DIR/PACKAGE.yaml" ]; then
  echo "Usage: bash scripts/remove-system.sh {system-name} [--yes]"
  exit 1
fi

# Skills and agents listed in the manifest
SKILLS=$(awk '/^skills:/{f=1;next} /^[a-z_]+:/{f=0} f && /^  - /{print $2}' "$SYSTEM_DIR/PACKAGE.yaml")
AGENTS=$(awk '/^agents:/{f=1;next} /^[a-z_]+:/{f=0} f && /^  - /{print $2}' "$SYSTEM_DIR/PACKAGE.yaml")

echo "This will remove from $PROJECT_DIR:"
for s in $SKILLS; do echo "  .claude/skills/$s"; done
for a in $AGENTS; do echo "  .claude/agents/$a.md"; done
echo ""

if [ "$CONFIRM" != "--yes" ]; then
  read -r -p "Proceed? [y/N] " ans
  case "$ans" in y|Y|yes|YES) ;; *) echo "Aborted."; exit 0 ;; esac
fi

for s in $SKILLS; do
  if [ -d "$PROJECT_DIR/.claude/skills/$s" ]; then
    rm -rf "$PROJECT_DIR/.claude/skills/$s"
    echo "  Removed skill: $s"
  fi
done
for a in $AGENTS; do
  if [ -f "$PROJECT_DIR/.claude/agents/$a.md" ]; then
    rm -f "$PROJECT_DIR/.claude/agents/$a.md"
    echo "  Removed agent: $a"
  fi
done

echo ""
echo "Done. Package kept at .claude/skills/_systems/$SYSTEM_NAME (reinstall with scripts/add-system.sh)."
