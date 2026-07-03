# Changelog — tool-transcription

All notable changes to this skill are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [1.1.1] — 2026-05-26

### Changed
- Example command + frontmatter now use `--language en` (docs-in-English convention). No behavioral change — `--language` is supplied per run by the caller.

## [1.1.0] — 2026-05-09

### Added
- `--output=words-json` flag exports word-level timestamps as JSON for
  subtitling pipelines (used by 00-longform-to-shortform).
- `segments_to_words_json()` helper in scripts/transcribe.py.

### Changed
- Unified canonical version: byte-identical copies now live in both
  00-social-content and 00-longform-to-shortform.
- SKILL.md rewritten to document both output modes side by side.
- Default `--output=markdown` preserves prior behavior — no breaking
  changes for 00-social-content callers.

## [1.0.0] — 2026-05-07

- Initial release.
