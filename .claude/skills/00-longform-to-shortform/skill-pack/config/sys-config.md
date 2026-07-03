# 00-longform-to-shortform — System Config

Operational preferences for the long-form to short-form video pipeline. Shared across all instances of this skill system.

> **This is NOT technical config.** Whisper model, parallel edits, and rendering settings live in `.claude/skills/00-longform-to-shortform/skill-pack/config/pipeline.config.yaml`.

> **Precedence:** When `sys-config.md` and `pipeline.config.yaml` disagree, `sys-config.md` wins. This file represents the user's resolved preferences. `pipeline.config.yaml` provides defaults and technical settings. During Phase 1 CONFIG, read both — apply `pipeline.config.yaml` first, then override with values set here.

---

## Platform

Default target platform(s) for posting.

- Default: youtube
- Options: `all` | `youtube` | `instagram` | `tiktok`

## Clip Selection

- Max clips per run: 3
- Min clips per run: 2
- Min score threshold: 65
- Duration range: 45-60 seconds

## Publishing

- Default mode: skip
- Options: `draft` | `auto-post` | `skip`

## Format

- Default: 9x16
- Layout: stacked
- Illustrations: on (image-gen, notebook-sketch, spotlight mode)

---

## Caption Style

- Font: Montserrat
- Size: 120px (extra-large — professional short-form scale)
- Animation: highlight (word-by-word phrase groups)
- Position: center (alignment 5, margin-v 0)
- Box style: backed (semi-transparent dark background, rgba(0,0,0,0.55))
- Active color: #F8D481 (gold accent)
- Inactive color: #FFFFFF (white)

## Color Palette

- Primary: #2E6EF5 (blue)
- Secondary: #202124 (near-black)
- Accent: #F8D481 (warm gold)
- Background: #F8F7F5 (warm off-white)
- Theme preset: custom (brand colors)

## Music

- Music: none

## Watermark / Logo

- Logo placement: top-right
- Watermark opacity: 80%
- Logo file: projects/00-longform-to-shortform/logos/brand-logo.png

## Overlay Controls

- Hook text: always on (default: true)
- Subtitles: always on (default: true)
- CTA end card: always on (default: true)
- Speaker card: on (default: true)
- Illustrations: on (image-gen, notebook-sketch, spotlight mode)

> Hook, subtitles, and CTA are independent of the illustrations toggle.
> Setting illustrations to off does NOT disable any of these.

## Intro / Outro

- Intro style:
- Outro style:
- CTA text: WATCH THE FULL VIDEO
