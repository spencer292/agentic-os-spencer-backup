# Changelog

All notable changes to Agentic OS will be documented in this file. Written for humans, not machines.

## Unreleased

### Changed

- **Memory indexing defaults** — normal memory setup/reindex now indexes `context/memory/` and `context/learnings.md` only. Brand context remains available through skill-directed file loading and can still be indexed only when passed explicitly with `--root`.

## v0.3.1 - 2026-06-17

### Changed

- **Semantic memory upgrade** — updates now set up BGE-M3 semantic memory, download the model when needed, rebuild old 384-dim memory stores, and reindex existing memory so recall uses the same model for indexing and search.
- **More reliable recall** — memory search now combines semantic vector search with keyword search, and it fails clearly if the stored embeddings do not match the active model.
- **Recoverable memory sources** — `.aos.md` summarized memory captures are now included in private GitHub backups, so memory can be rebuilt later with a new model or pipeline. Raw transcripts and built memory databases still stay local.

## v0.3.0 - 2026-06-16

### Added

- **Recommended Memory Setup** — install and update now offer searchable memory through `scripts/setup-memory.sh` and `scripts/setup-memory.ps1`, with Claude Code as the default and Codex/both/skip choices.
- **Version visibility** — install and update now show the current Agentic OS version, and update confirms the version received.

### Changed

- **Primary recall on PGLite/pgvector** — semantic recall now runs on the new scope-isolated PGLite store via `npm run memory:recall` (Tier 1 in `AGENTS.md` points here). The legacy `memsearch` path is kept only as a temporary, explicit rollback (`MEMORY_BACKEND=memsearch` or `--backend memsearch`); it triggers automatically only when the new backend is unavailable, and never on an empty result or a scope error, so it cannot mask an isolation failure. Slated for removal once the new backend is stable.
- `setup-memsearch.sh` and `setup-memsearch.ps1` now route to the recommended setup flow for backward compatibility.

## v0.2.2 — 2026-06-02

### Added

- **Semantic Memory (Tier 1 recall)** — `memsearch` integration for semantic search across session logs, transcripts, learnings, and brand context. Run `bash scripts/setup-memsearch.sh` once after updating to activate (see README for details).
- **Auto-capture** — every session is automatically summarised and indexed to `.memsearch/memory/` at session end via the Stop hook.
- **Nightly memory indexer** — cron job runs at 02:00 to keep the semantic index up-to-date with new sessions and content.
- **Weekly memory gap analysis** — cron job runs Sunday at 09:30, before the weekly curator, to identify date gaps, stale threads, and orphaned decisions. Saves report to `context/memory/{date}_gap-analysis.md`.
- **Gap citation protocol** — memory recall responses now cite sources with dates, note temporal gaps, and state exactly what was searched when nothing is found.
- **Post-fusion reranker** — `scripts/lib/reranker.py` re-ranks memsearch results by source authority and recency before summarising. Configuration lives in `context/memory-config.json`.
- **Memory coverage stats** — `scripts/lib/memory-meta.sh` reports session log date range, gaps, and MEMORY.md usage. Runs automatically at session wrap-up.

### Changed

- Memory retrieval in `AGENTS.md` now uses a structured 3-tier protocol (MEMORY.md → semantic search → citation) instead of a bare fallback.

## v0.1.0 — 2026-04-13

First versioned release. Everything before this was unversioned iteration.

### Added
- Project template with personality (`SOUL.md`), user preferences (`USER.md`), and session memory
- Skill system with auto-registration, reconciliation, and category prefixes
- Brand context layer — voice profile, positioning, ICP, samples, and assets
- Multi-client architecture — run multiple clients from one install
- Command Centre — task board, Kanban view, GSD project management, and dashboard
- GSD framework integration — structured project execution with phases, plans, and verification
- Update system with safe self-updating (`update.sh`) and protected user data
- Cron dispatcher for scheduled jobs
- Skills: brand voice, positioning, ICP, skill creator, wrap-up, goal breakdown, AI SEO, Stitch design, interface design, Stitch fetch tool
- Changelog and version tracking with `/new-feature` and `/release` workflow
