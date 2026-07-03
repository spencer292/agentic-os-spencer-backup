---
name: Nightly Memory Index (AOS)
time: '23:45'
days: daily
active: 'true'
model: haiku
notify: on_failure
description: 'Refreshes the PGLite memory index so semantic recall stays current (AOS-owned, AIOS-185)'
timeout: 15m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Task: Refresh the local PGLite memory index so Tier 1 semantic recall stays current.
This is the Agentic-OS-owned replacement for the legacy Memsearch index job — it
uses the new `command-centre` memory CLIs, not Memsearch.

Steps:

1. From the repo root, run the forced refresh index:
   - `cd command-centre && npm run memory:capture -- --reason refresh --force`
   - This runs the incremental indexer over context/memory/ (including the day's
     `.aos.md` captures) and context/learnings.md, re-embedding changed sources
     and pruning stale chunks.

2. Report status:
   - Run `npm run memory:status` and output the summary line
     (`sources`, `chunks`, last index job + reason).

Notes:
- Runs after daily-memory-distill (23:00) so newly promoted content is picked up, and is
  independent of Memsearch — it works even when Memsearch is not installed or running.
- The indexer is incremental: unchanged sources are skipped by content hash, so the
  re-embed cost is bounded to what actually changed (plus `--force` re-embeds everything).
- On failure, the job retries once automatically (retry: 1).
