# Changelog — 00-youtube-to-ebook

All notable changes to this skill are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [1.1.0] — 2026-05-26

- Branded PDF theming now reads `{brand_context}/visual-identity/tokens.json`
  (produced by `mkt-visual-identity`) instead of the old `design-tokens.md`
  contract. `pdf_theme_from_tokens.py` maps the JSON colours + fonts onto the
  PDF CSS variables; legacy `design-tokens.md` files still parse as a fallback.

## [1.0.0] — 2026-05-09

- Initial release.
