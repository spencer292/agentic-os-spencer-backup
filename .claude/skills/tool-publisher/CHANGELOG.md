# Changelog — tool-publisher

All notable changes to this skill are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [1.1.0] — 2026-05-15

- **REST fallback is now a first-class path.** When the Zernio MCP server isn't
  loaded in the session, the skill uses the template script
  `scripts/publish_rest.py` instead of aborting. The script loads the API key
  from `.env`, presigns + uploads each media file, and creates the post in
  one call — no browser-upload step.
- **`scripts/publish_rest.py` template.** Single entry-point for the REST
  flow with flags for `--platform` override, `--pdf` (LinkedIn carousels),
  `--schedule-for` (ISO 8601 UTC scheduling), and `--account-id`. Emits a
  single JSON object on stdout so the skill can parse the result. UTF-8 stdout
  is forced to avoid Windows console crashes on Unicode response bodies.
- **`scripts/list_accounts.py` helper.** Lists connected Zernio accounts
  with minimal fields (id, platform, username). JSON by default, `--table`
  for human-readable output, `--platform X` to filter. Used by Step 2.5 to
  verify the requested platform actually has a connected account before
  asking the user how to proceed.
- **Pre-upload image optimization (ON by default).** `publish_rest.py` now
  downscales images to each platform's actual max width (IG: 1080, LI: 1920,
  X: 1600, etc.), composites RGBA onto white, and exports JPEG q=92 with
  progressive + 4:2:2 subsampling. Avoids the server-side downscale +
  re-encode that destroys quality on over-spec PNGs. Pass `--no-optimize`
  to skip. Surfaced in the output JSON as `"optimized": N`.
- **Platform mismatch double-check (Step 2.5).** If the user asks to publish
  to a platform that differs from `post.yaml`'s `platform` field, the skill
  stops and offers four options: repurpose first via `mkt-content-repurposing`
  (recommended), publish as-is to the requested platform, fall back to the
  original platform, or cancel.
- Steps 3–4 rewritten to describe the MCP and REST upload/publish paths in
  parallel.
- `references/zernio-rest-fallback.md` retained as the under-the-hood
  reference for debugging and custom flows.

## [1.0.1] — 2026-05-09

- Adapted from the agentic-os baseline for inclusion in
  @scrapes/skill-systems. See the parent system CHANGELOG for context.

## [1.0.0] — agentic-os baseline

- Originally shipped as part of agentic-os.
