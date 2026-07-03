# Changelog — 00-longform-to-shortform

All notable changes to this skill are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [1.1.0] — 2026-05-13

### Fixed
- Phase 3: Smart MP3 bitrate selection based on video duration — avoids wasted double-encode for videos >15 min (Groq 25MB limit)
- Phase 3: Added `.env` sourcing before Groq API calls — Python subprocesses now inherit API keys
- Phase 3: Python-side `.env` fallback when `GROQ_API_KEY` not in `os.environ`
- Phase 4/5: Timestamp format mismatch — Phase 4 output HH:MM:SS strings in `start_time`/`end_time`, Phase 5 passed them through to `clip_definitions.json`, Phase 6 reframe tool crashed expecting float seconds
- Phase 4: Now emits both `start_time`/`end_time` (HH:MM:SS) and `start_sec`/`end_sec` (float seconds) in `clip_candidates.json`
- Phase 5: Now explicitly converts to batch-compatible format with `start`/`end` as float seconds, with HH:MM:SS→seconds conversion fallback
- Phase 7: Fixed HyperFrames `init` path — accounts for `npx hyperframes init` creating a named subdirectory
- Phase 7: Rewrote `hyperframes-composition.md` template to pass HyperFrames lint (root wrapper with `data-composition-id`/`width`/`height`, `data-start` on video, Flexbox centering instead of CSS transforms, `data-duration` instead of `data-end`)
- Phase 7: Added `class="clip"` + `data-start`/`data-duration`/`data-track-index` on all timed elements — required by HyperFrames for visibility control
- Phase 7: Added separate `<audio>` track alongside muted `<video>` for audio playback
- Phase 7: Fixed overlapping clips on same track — each phrase group now ends 0.01s before next begins
- Phase 7: Moved opacity/visibility animations to inner child divs to avoid conflict with framework clip visibility management
- Phase 7: Replaced CSS `transform: translateX(-50%)` with GSAP `xPercent: -50` to prevent GSAP transform overwrite
- Phase 7: Added deterministic kill commands (`opacity: 0`) at end of each caption group
- Phase 7: Fixed end screen not rendering — `opacity:0` on clip element blocked visibility; moved opacity to inner child div
- Phase 7: Fixed end screen missing thumbnail — composition now copies `thumbnail.png` from run directory into HyperFrames project
- Phase 7: Replaced `display:flex` centering on clip element with absolute positioning + `transform:translate(-50%,-50%)` on inner container
- Phase 7: Fixed subtitle position — moved from `bottom:340px` (too low) to `top:880px` (center of screen for split-screen view)
- Phase 7: Added font fallback stack for headless Playwright rendering
- Phase 6 reframe: clip extraction now uses `libx264 -preset ultrafast -crf 18` (with `-c:a copy`) for frame-accurate cuts. Pure stream-copy was cutting on keyframes and drifting timestamps, breaking caption alignment downstream.
- Windows: reframe tool no longer crashes on Unicode log output. `__main__.py` and `split_screen.py` now force UTF-8 stdout/stderr at import time so characters like `→` survive Windows consoles defaulting to cp1252 (previously caused silent empty-clip generation).
- Windows: Phase 6 and Phase 7 now force serial execution (`MAX_PARALLEL=1`) when running under Git Bash. Bash background jobs with exported `$RUN_DIR`-style variables interpolated as empty in subshells, causing log redirects to land at the filesystem root and clips to silently drop.
- `skill-pack/tools/__init__.py` added — `tools/` was missing the package marker, so `python -m tools.reframe` (documented in `phase-6-reframe.md`) failed with a module-not-found error on fresh installs.

### Added
- Always-on overlay controls in `pipeline.config.yaml`: `hook_enabled`/`hook_duration`, `subtitles_enabled`, `cta_enabled`/`cta_duration`, `speaker_card_enabled` — these render independently of the `illustrations` toggle
- Config keys: `editing.renderer`, `editing.illustration_mode`, `editing.illustration_source`, `editing.illustration_style`
- Config precedence documentation: `sys-config.md` overrides `pipeline.config.yaml`
- HyperFrames Lint Checklist section in composition reference
- Scene classification in split-screen reframe: detects full-screen graphic inserts via face-detection confidence drops; uses cx (face position) as primary signal with face-width as tiebreaker
- `phase-0-onboard.md`: new "How split-screen detection works" subsection explaining cx thresholds, ambiguous zone, majority vote, and how users can adjust thresholds in `split_screen.py` for non-standard recording setups
- Hard-Won Rule 6: Always source `.env` before using API keys
- Hard-Won Rule 7: Never animate `visibility` on elements with `class="clip"` — the framework manages clip visibility. Animate a child div instead.
- Hard-Won Rule 8: Clips on the same `data-track-index` must not overlap — leave ≥0.01s gap between consecutive clips
- Hard-Won Rule 9: Never use CSS `transform` on elements that GSAP also animates — use GSAP equivalents (`xPercent`, `yPercent`, `x`, `y`)
- Hard-Won Rule 10: Never set `opacity:0` on a clip element and animate it via GSAP — the framework controls clip visibility, so the element stays invisible. Always put `opacity:0` on a child div and animate that instead.
- Hard-Won Rule 11: Copy `thumbnail.png` from run directory into the HyperFrames project before composition build — end screen needs it as a local asset

### Changed
- Hard-Won Rule 2: Rewritten to require frame-accurate re-encode (`libx264 ultrafast`) at extract instead of stream-copy. Stream-copy was cutting on keyframes and drifting timestamps downstream.
- Hard-Won Rule 4: Clarified to probe duration first and use `-q:a 8` for long videos
- Default caption size raised from `102pt` to `120px` (extra-large, professional short-form scale)
- Default `subtitle_box_style` changed from `none` to `backed` (semi-transparent dark background for readability)
- Default `illustration_mode` changed from `float` to `spotlight`
- Default `publishing.mode` changed from `skip` to `draft`
- Default `duration_range` widened from `[45, 60]` to `[45, 90]`
- `phase-0-onboard.md` Question 1 (Visual Style) renderer choice rewritten as `hyperframes` vs `ffmpeg` (was previously mislabeled as `image-gen` vs `ffmpeg`, which referenced a non-existent `viz-image-gen` skill)
- `phase-0-onboard.md` Question 1 illustrations rewritten as on/off — FFmpeg drawbox/drawtext is the only working illustration source; the `image-gen` path is no longer surfaced in onboarding
- `phase-6-reframe.md` "How It Works" rewritten to describe the new position-primary / size-tiebreaker scene classification (cx thresholds, 90% majority vote, graphic-insert detection) so the doc matches the new `split_screen.py`

### Removed
- Config key `transcription_provider` from `pipeline.config.yaml` — provider is now resolved per-phase rather than configured globally
- Config key `target_platform` from `pipeline.config.yaml` — duration range is set directly via `duration_range`
- Config keys `subtitle_alignment` and `subtitle_margin_v` from `pipeline.config.yaml` — handled internally by the renderer
- `phase-0-onboard.md` Question 1 (Transcription provider) — provider is now resolved automatically based on `.env` (Groq if `GROQ_API_KEY` exists, else local WhisperX)
- `phase-0-onboard.md` Question 2 (Target platform) — `duration_range` is now set directly in `pipeline.config.yaml`

## [1.0.0] — 2026-05-09

- Initial release.
