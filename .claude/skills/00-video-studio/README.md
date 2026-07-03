# 00-video-studio

A drop-and-review video lane for personal-brand content. Distinct from the podcast pipeline.

## About

Drop a video — or a folder of clips and photos — into the `31_Studio` Drive Inbox. The studio
classifies it, cuts a production-ready 9:16 clip, and parks the result in `3_Review` for your approval.
Nothing posts until you drag a clip into `4_Approved`.

It reuses the render core from `00-longform-to-shortform` (the `reframe` CLI + caption burner) and adds
two new abilities that speech-only pipelines never needed: **highlight** selection for action footage,
and **assembly** of multiple clips + photos into one reel.

## Three paths (auto-detected)

| Path | When | What it does |
|------|------|--------------|
| **talking-head** | single video, continuous speech | transcribe → score punchy lines → reframe → kinetic captions |
| **highlight** | single video, low/no speech | motion + audio-energy scoring → cut to the visual peaks → music + overlays |
| **assembly** | multiple videos and/or photos | best beats from each clip + Ken-Burns photos → one crossfaded, scored reel |

## Drive layout (`31_Studio`)

```
1_inbox/        drop one folder per piece (clips + photos + optional note.txt)
2_processing/   system working area
3_Review/       finished clips awaiting your 👍
4_Approved/     drag here to publish
5_Posted/       archive of what went out
6_Assets/       your music, logo, fonts, overlay templates
```

## note.txt (optional brief, per job folder)

```
path: highlight          # force a path (else auto-detected)
duration: 30             # target seconds
mood: upbeat             # pacing / music hint
title: Spencer's Build   # overlay headline
tags: @spencer
music: engine-anthem.mp3 # specific bed from 6_Assets/music/
```

## Usage

```
/00-video-studio                 # process every pending job in 1_inbox
/00-video-studio spencer-racing  # process one job
/00-video-studio post            # Phase 6: publish what's in 4_Approved
```

## Dependencies

Required: `tool-transcription` (talking-head), `vid-ffmpeg-edit` (captions), ffmpeg, the shared
`projects/tools/.venv` (opencv + numpy). Optional: `tool-zernio-social` (posting),
`mkt-brand-voice` + `mkt-visual-identity` (personal styling).

## Status

v0.1.0 — talking-head path is production-ready (reuses trusted skills). Highlight + assembly paths are
new; `scripts/highlight_select.py` does the motion/audio peak selection. First real runs:
the scam-warning video (talking-head) and the Spencer racing day (assembly).
