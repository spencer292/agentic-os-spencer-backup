# Changelog — tool-image-search

All notable changes to this skill are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] — 2026-05-14

- Initial draft.
- Tier 1 sources: Openverse, Wikimedia Commons, Imgflip.
- Tier 2 sources (env-var keys): Unsplash, Pexels.
- Tier 3 source (opt-in via `--allow-scraping`): Bing Images via Playwright +
  `playwright-stealth`. Validated for news + celebrity queries.
- Per-image manifest captures license, attribution, source URL and warnings.
- Cross-platform setup: `setup.sh` for macOS/Linux, `setup.ps1` for Windows.
