#!/usr/bin/env bash
# Build the numbered source bundle Codex reviews (it has no shell/file access on this machine).
# Usage: bash bundle-for-codex.sh > ../stages/S6-codex-bundle.md
set -euo pipefail
R="$(cd "$(dirname "$0")/.." && pwd)"
cat "$R/stages/S6-codex-brief.md"
echo; echo; echo "# ===== BUNDLE ====="; echo
n=0
for f in \
  stages/S4-design.md \
  stages/S2-plan-vs-actual.md \
  stages/S3a-master-territory.md \
  stages/S3b-cadence-capacity.md \
  stages/S5-harness.md \
  stages/S5-week-solve.md \
  stages/S1-travel-model.md \
  scripts/backtest.mjs \
  scripts/backtest-data.mjs \
  scripts/sequence.mjs \
  scripts/policies/week-solve.mjs \
  scripts/policies/dominant-routeday.mjs \
  scripts/policies/keep-actual.mjs \
  scripts/travel.mjs \
  scripts/derive-cadence.mjs \
  scripts/demand-model.mjs \
  scripts/derive-master.mjs \
; do
  [ -f "$R/$f" ] || { echo "## [$((++n))] $f — MISSING" ; continue; }
  n=$((n+1))
  echo; echo "## [$n] $f"; echo; echo '```'
  cat -n "$R/$f"
  echo '```'
done
