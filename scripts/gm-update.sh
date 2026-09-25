#!/usr/bin/env bash
# ============================================================================
# gm-update.sh — bring this Got Moles Agentic OS install up to date.
#
# This install is a CONSUMER copy: updates come FROM the shared Got Moles repo
# (origin) and your own work goes TO your personal backup remote. `git pull` is
# deliberately disabled here (push URL DISABLED + diverged branches), so this
# script does the safe equivalent:
#
#   1. fetch origin
#   2. pre-flight: list files BOTH you and the update changed (the only place a
#      conflict can happen) and stop if you have uncommitted work
#   3. merge origin/main (your commits stay; the update adds on top)
#   4. npm install in command-centre (only if package.json changed)
#   5. refresh the memory index so the new skills are searchable
#
# If the merge conflicts, nothing is lost: run `git merge --abort` to go back
# to exactly where you were, then ask Claude: "resolve the update conflict —
# take origin's version for shared OS files, keep mine for my own files".
#
# Usage (from the repo root):   bash scripts/gm-update.sh
#                               bash scripts/gm-update.sh --check   (pre-flight only)
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

CHECK=false; [[ "${1:-}" == "--check" ]] && CHECK=true

echo "═══════════════════════════════════════════════"
echo "  Got Moles Agentic OS — update"
echo "  Installed: v$(cat VERSION 2>/dev/null || echo '?')   branch: $(git rev-parse --abbrev-ref HEAD)"
echo "═══════════════════════════════════════════════"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "✗ You have uncommitted changes. Ask Claude to wrap up (commit) first, or run: git stash"
  git status --short | head -20
  exit 1
fi

echo "→ fetching the shared repo…"
git fetch origin

AHEAD=$(git rev-list --count origin/main..HEAD)
BEHIND=$(git rev-list --count HEAD..origin/main)
echo "   your local commits not in origin: $AHEAD   updates waiting: $BEHIND"
if [[ "$BEHIND" == "0" ]]; then echo "✓ Already up to date."; exit 0; fi

BASE=$(git merge-base HEAD origin/main)
echo "→ update touches $(git diff --name-only "$BASE" origin/main | wc -l | tr -d ' ') files; version → v$(git show origin/main:VERSION 2>/dev/null || echo '?')"

BOTH=$(comm -12 <(git diff --name-only "$BASE" HEAD | sort) <(git diff --name-only "$BASE" origin/main | sort) || true)
if [[ -n "$BOTH" ]]; then
  echo "⚠ files changed on BOTH sides (possible conflicts — usually still merge cleanly):"
  echo "$BOTH" | sed 's/^/     /'
else
  echo "✓ no overlap between your changes and the update — merge will be clean"
fi

$CHECK && { echo "(check only — nothing changed)"; exit 0; }

echo "→ merging origin/main…"
if ! git merge --no-edit origin/main; then
  echo
  echo "✗ Merge stopped on conflicts (listed above). Nothing is lost."
  echo "  Either:  git merge --abort        (back to exactly where you were)"
  echo "  Or ask Claude: \"resolve the update conflict — take origin's version for shared OS files, keep mine for my own files\""
  exit 1
fi

if git diff --name-only "$BASE" origin/main | grep -q '^command-centre/package'; then
  echo "→ command-centre dependencies changed — running npm install…"
  ( cd command-centre && npm install --no-audit --no-fund --loglevel=error ) || echo "⚠ npm install failed — run it by hand in command-centre/ before launching the Command Centre"
fi

echo "→ refreshing memory index (background)…"
( cd command-centre && node scripts/memory-index.cjs --visibility system --reason refresh >/dev/null 2>&1 & ) || true

echo
echo "✅ Updated to v$(cat VERSION). Your own work is untouched; $AHEAD local commit(s) preserved."
echo "   Next: ask Claude \"what's new in this update\" — it reads CHANGELOG.md and GOT-MOLES.md."
