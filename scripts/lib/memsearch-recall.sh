#!/usr/bin/env bash
# memsearch-recall.sh — cold-load-safe recall wrapper for memsearch.
#
# Why this exists: on Zilliz serverless (free tier), an idle collection is
# released from memory. The first queries after idle return an EMPTY result set
# (not an error, not a block) while the collection loads in the background.
# A naive caller reads that empty set and wrongly concludes "search is broken".
# This wrapper warms the collection, retries on empty, and — if still empty —
# checks the true indexed count so the caller can tell load-lag from real-empty.
#
# Usage:
#   scripts/lib/memsearch-recall.sh "your query" [top_k]
#
# Output (stdout): re-ranked JSON array (same shape as reranker.py output).
# Exit codes:
#   0  results returned
#   3  index genuinely empty (stats count == 0) — no data, not lag
#   4  index has data but search stayed empty after all retries — investigate

set -uo pipefail

QUERY="${1:?usage: memsearch-recall.sh \"query\" [top_k]}"
TOP_K="${2:-10}"
MAX_RETRIES="${MEMSEARCH_RECALL_RETRIES:-5}"
SLEEP_SECS="${MEMSEARCH_RECALL_SLEEP:-2}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RERANKER="$SCRIPT_DIR/reranker.py"

PY="python3"; command -v "$PY" >/dev/null 2>&1 || PY="python"

# Warm-up: a throwaway query forces the serverless collection to start loading.
memsearch search "$QUERY" --top-k 1 >/dev/null 2>&1 || true

attempt=0
while [ "$attempt" -le "$MAX_RETRIES" ]; do
  raw="$(memsearch search "$QUERY" --top-k "$TOP_K" --json-output 2>/dev/null)"
  # Non-empty JSON array? (anything past "[]" / whitespace)
  if printf '%s' "$raw" | "$PY" -c "import sys,json; sys.exit(0 if len(json.load(sys.stdin) or [])>0 else 1)" 2>/dev/null; then
    if [ -f "$RERANKER" ]; then
      printf '%s' "$raw" | "$PY" "$RERANKER" "$QUERY"
    else
      printf '%s' "$raw"
    fi
    exit 0
  fi
  attempt=$((attempt + 1))
  [ "$attempt" -le "$MAX_RETRIES" ] && sleep "$SLEEP_SECS"
done

# Still empty after retries — distinguish genuine-empty from a deeper problem.
count="$(memsearch stats 2>/dev/null | grep -oE '[0-9]+' | head -1)"
count="${count:-0}"
if [ "$count" -eq 0 ]; then
  echo "memsearch-recall: index is empty (0 chunks) — nothing to recall, re-index first." >&2
  exit 3
fi
echo "memsearch-recall: index has $count chunks but search stayed empty after $MAX_RETRIES retries — likely backend/load issue, not data loss. Verify with 'memsearch stats' and a manual 'memsearch search'." >&2
exit 4
