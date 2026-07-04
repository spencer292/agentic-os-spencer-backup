# Learnings

## General

### What works well

### What doesn't work well

## Individual Skills

### viz-image-gen
- 2026-07-04: For YouTube banners (and anything needing true 16:9), use the **Gemini** backend, not GPT. GPT/gpt-image maxes out at 3:2 (1536×1024) and cannot output 16:9. Gemini at `--resolution 2K --aspect-ratio 16:9` produced a clean 2752×1536 banner first try, above YouTube's 2560×1440 recommendation.
- 2026-07-04: `skill-pack/config/sys-config.md` Paths point to a **stale template path** (`C:/Claude/agent-os-v3/agentic-os`), NOT this install (`C:/Agentic-os-got-moles`). Ignore those paths — use the real repo root. The Gemini/GPT scripts auto-load `.env` via `find_dotenv(usecwd=True)`, so running from repo root resolves keys without manual export (the older learnings note about exporting the key is outdated).
- 2026-07-04: Gemini rendered all AI text correctly (wordmark, tagline, dot-separated trust line) when exact strings were quoted in the prompt and text was locked to the centered safe band. Verified by reading the output once — worth doing for brand-critical typography despite the skill's "don't read back" default.

### tool-optimoroute
- 2026-07-04: Connection test passed — `node .claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs test` returns "Connected — API key valid." Key is set in `.env` (`OPTIMOROUTE_API_KEY`) and authenticates against `https://api.optimoroute.com/v1/`.
