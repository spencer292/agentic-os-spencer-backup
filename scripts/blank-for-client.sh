#!/usr/bin/env bash
# Blank a fresh Agentic OS snapshot for a new client.
#
# Run this INSIDE a freshly-cloned client repo (NOT your master OS). It strips
# the tracked-but-personal files that would otherwise travel from your master
# install — memory, learnings, personal cron jobs, local overrides — leaving a
# true blank template ready for `/start-here`.
#
# Keeps:  SOUL.md, all skills, all scripts, AGENTS.md/CLAUDE.md, docs, .env.example
# Resets: USER.md, MEMORY.md, learnings.md, CLAUDE.local.md
# Wipes:  daily memory logs, transcripts, personal cron jobs, SKILL.local.md files
# Scaffolds: empty brand_context/, projects/, context/memory/
#
# Usage:
#   bash scripts/blank-for-client.sh                 # preview (dry-run, default)
#   bash scripts/blank-for-client.sh --apply         # actually blank
#   bash scripts/blank-for-client.sh --apply --client "Acme Co"
#   bash scripts/blank-for-client.sh --apply --force # skip the master-repo guard

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── Config: edit these lists to taste ────────────────────────────────────────
# Cron jobs that are personal/content-specific and should NOT ship to a client.
# Everything else under cron/jobs/ is treated as generic system plumbing and kept.
PERSONAL_CRON_JOBS=(
  "youtube-newsletter.md"
  "podcast-shorts-lane.md"
)
# Slug of YOUR master repo. The script refuses to run if origin points here
# (so you can't blank your own master by accident). Override with --force.
MASTER_REPO_SLUG="freeflyroy/agent-os-v3"
# ─────────────────────────────────────────────────────────────────────────────

APPLY=false
FORCE=false
CLIENT_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)  APPLY=true; shift ;;
    --force)  FORCE=true; shift ;;
    --client) CLIENT_NAME="${2:-}"; shift 2 ;;
    -h|--help)
      sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# ── Guard: don't APPLY against the master repo (preview is always allowed) ───
ORIGIN_URL="$(git -C "$REPO_ROOT" remote get-url origin 2>/dev/null || echo "")"
if $APPLY && [[ "$ORIGIN_URL" == *"$MASTER_REPO_SLUG"* ]] && ! $FORCE; then
  echo "✋ origin points at the master repo ($MASTER_REPO_SLUG)."
  echo "   This script is meant to run inside a CLIENT clone, not your master OS."
  echo "   Re-run with --force only if you truly mean to blank this repo."
  exit 1
fi

if $APPLY; then MODE="APPLY"; else MODE="DRY-RUN (preview only)"; fi
echo "═══════════════════════════════════════════════"
echo "  Blank for client — $MODE"
[[ -n "$CLIENT_NAME" ]] && echo "  Client: $CLIENT_NAME"
echo "  Repo:   $REPO_ROOT"
echo "═══════════════════════════════════════════════"
echo ""

# Helper: act() prints the action; only mutates when --apply is set.
act() { # act "<label>" <command...>
  local label="$1"; shift
  echo "  • $label"
  if $APPLY; then "$@"; fi
}

# ── 1. Reset identity / memory / learnings to clean stubs ────────────────────
write_stub() { # write_stub <path> <heredoc-via-stdin>
  local path="$1"
  echo "  • reset $path"
  if $APPLY; then mkdir -p "$(dirname "$path")"; cat > "$path"; else cat > /dev/null; fi
}

write_stub "$REPO_ROOT/context/USER.md" <<'EOF'
# USER.md — Who You're Working For

> Populated during onboarding. `/start-here` reads the client onboarding form
> and fills this in. Keep under ~1.5 KB.

## Profile
- Name:
- Business:
- Role:

## Preferences
-

## Working style
-
EOF

write_stub "$REPO_ROOT/context/MEMORY.md" <<'EOF'
# Memory — Working Scratchpad

> Curated durable facts, loaded at session start. Capped at 2,500 characters.
> Fresh client install — start empty.

## Active Threads

## Environment Notes

## Pending Decisions
EOF

write_stub "$REPO_ROOT/context/learnings.md" <<'EOF'
# Learnings

## General

### What works well

### What doesn't work well

## Individual Skills
EOF

write_stub "$REPO_ROOT/CLAUDE.local.md" <<'EOF'
# CLAUDE.local.md — user overrides

User-owned. Never modified by updates. `## Rules` here extend and override
`CLAUDE.md` for the whole session.

## Rules
-
EOF

# ── 2. Wipe daily memory logs + transcripts (keep the .gitkeep) ──────────────
if [[ -d "$REPO_ROOT/context/memory" ]]; then
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    act "remove memory log $(basename "$f")" rm -f "$f"
  done < <(find "$REPO_ROOT/context/memory" -maxdepth 1 -name '*.md' 2>/dev/null)
fi
if [[ -d "$REPO_ROOT/context/transcripts" ]]; then
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    act "remove transcript $(basename "$f")" rm -f "$f"
  done < <(find "$REPO_ROOT/context/transcripts" -maxdepth 1 -name '*.md' 2>/dev/null)
fi

# ── 3. Drop personal cron jobs (keep generic system jobs) ────────────────────
for job in "${PERSONAL_CRON_JOBS[@]}"; do
  if [[ -f "$REPO_ROOT/cron/jobs/$job" ]]; then
    act "remove personal cron job $job" rm -f "$REPO_ROOT/cron/jobs/$job"
  fi
done

# ── 4. Remove SKILL.local.md overrides (client builds their own) ─────────────
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  act "remove ${f#"$REPO_ROOT/"}" rm -f "$f"
done < <(find "$REPO_ROOT/.claude/skills" -name 'SKILL.local.md' 2>/dev/null)

# ── 4b. Wipe personal projects/ content a snapshot may have carried in ───────
# A git-archive snapshot brings master's *tracked* projects/ outputs onto disk
# even though they're gitignored downstream. Strip them (keep the .gitkeep).
if [[ -d "$REPO_ROOT/projects" ]]; then
  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    act "remove projects/${entry##*/}" rm -rf "$entry"
  done < <(find "$REPO_ROOT/projects" -mindepth 1 -maxdepth 1 ! -name '.gitkeep' 2>/dev/null)
fi

# ── 5. Scaffold empty client data dirs (gitignored — ensure they exist) ──────
for d in brand_context projects context/memory; do
  act "ensure $d/ exists" mkdir -p "$REPO_ROOT/$d"
  if [[ ! -f "$REPO_ROOT/$d/.gitkeep" ]]; then
    act "touch $d/.gitkeep" touch "$REPO_ROOT/$d/.gitkeep"
  fi
done

echo ""
if $APPLY; then
  echo "✅ Blanked. This snapshot is clean of your personal data."
  echo ""
  echo "Next:"
  echo "  1. cp .env.example .env   (then fill in the client's API keys)"
  echo "  2. git add -A && git commit -m 'chore: blank snapshot for client'"
  echo "  3. git push   (to the client's repo)"
  echo "  4. On the client site: clone, run the installer, then /start-here"
else
  echo "ℹ  Dry-run only — nothing changed. Re-run with --apply to blank for real."
fi
