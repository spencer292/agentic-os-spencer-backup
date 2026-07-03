# Changelog — tool-video-screenshots

All notable changes to this skill are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased — pending test]

### Changed
- Now invoked automatically by `00-social-content` Phase 3 for Scenarios B (YouTube) and G (local file) in pipeline mode. Returns `manifest.json` path to the orchestrator instead of building the standalone README.
- Manifest is consumed by Phase 5 frame-matching: each AI/HYBRID carousel slide gets a `frame_path` assigned based on semantic similarity between `image_concept` and frame captions.

## [1.0.0] — 2026-05-09

- Initial release.
