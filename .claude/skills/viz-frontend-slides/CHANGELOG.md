# Changelog — viz-frontend-slides

All notable changes to this skill are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [1.1.0] — 2026-05-26

- Brand tokens now read from `{brand_context}/visual-identity/tokens.json`
  (produced by `mkt-visual-identity`) instead of the old `design-tokens.md`
  contract. Added a JSON-to-CSS-vars mapping so brand colours, fonts, and the
  type ramp apply cleanly; the carousel-calibrated type scale is treated as a
  relative ramp and re-fit to the 16:9 slide viewport.

## [1.0.0] — 2026-05-09

- Initial release.
