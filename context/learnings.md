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

### tool-browser
- 2026-07-06: Built a zero-dependency CDP driver (`browser/launch.mjs`, `browser/cdp.mjs`) — no Playwright/Puppeteer needed because Node 24 on this machine has built-in `WebSocket` + `fetch`. Package installs are blocked here, so this dependency-free approach is the right one. Verified end-to-end: launch → goto example.com → read h1 → screenshot → Read the PNG rendered correctly.
- 2026-07-06: Chrome runs on a persistent dedicated profile at `C:\Users\spenc\.agentic-chrome-profile` (separate from the user's everyday Chrome). Logins persist across sessions once done. `--remote-allow-origins=*` is required in the launch args or the Node WebSocket client gets a 403 on the CDP upgrade.
- 2026-07-06: Not registered in AGENTS.md/README (shipped files — consumer branching policy forbids editing them). The skill still triggers because Claude Code reads skill frontmatter directly from `.claude/skills/`.
- 2026-07-06: LinkedIn people-search extraction that works (cheap, no screenshots): navigate to `https://www.linkedin.com/search/results/people/?keywords=<url-encoded>` then `cdp.mjs eval` collecting `a[href*="/in/"]` and their `innerText` into a `{href: text}` map — each entry's text carries name • degree | headline | location | connect/message | mutual-connection line. `<li>`-based extraction returns [] (LinkedIn doesn't use `<li>` cards); the anchor-map approach is reliable. Screenshot is the visual fallback.
- 2026-07-06: Prospecting insight for Got Moles: "X is a mutual connection" on a 2nd-degree search result means X is Spencer's OWN 1st-degree connection. Recurring mutuals across searches = network hubs = warm-intro routes. For WA property-mgmt/green-industry, the hubs are Patrick LaCroix, Nick Granberg, Brandon Sechrist, Mark Pyrah. First corporate-prospect pull saved to `projects/tool-browser/2026-07-06_linkedin-corporate-prospects.md`.

## General

- 2026-07-06: **Do not flip a live-data-writing automation to production until the WHOLE workflow is built and validated.** The Got Moles route automation shipped only the OptimoRoute→Jobber write-back (missing the Jobber→OptimoRoute ingest + re-optimize, and tech-assignment handling) plus a bad 7am–7pm placeholder step. Going live scrambled the real Jobber board (visits moved to wrong days, blanket placeholder times). "0 errors" on a run is NOT proof of correctness — verify what a real run actually CHANGES against a real day, and make the user review it before go-live. Go-live is a hard gate, not a flip.
