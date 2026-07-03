---
name: Meeting Video Archive
time: '08:00'
days: daily
active: 'true'
model: sonnet
notify: on_finish
description: 'Archives meeting recordings out of Zoom into the private Meeting Recordings Drive folder and links each Notion row, via the archive-video.cjs sweep on this cron host using local .env (no GitHub secrets). Activated 2026-06-25 — the GitHub Actions equivalent is now a manual-only fallback.'
timeout: 90m
retry: '0'
---
You are running as a scheduled job for Agentic OS. Read CLAUDE.md for system context.

> NOTE: This local cron OWNS the meeting-video archive (active since 2026-06-25). It runs the
> sweep on this host from the local `.env`, so no Zoom/Notion secrets are stored in GitHub.
> The GitHub Actions workflow (.github/workflows/meeting-video-archive.yml) is now a manual-only
> fallback for catching up a backlog after the machine has been off for a long stretch.

Task: archive any meeting that has a Notion Meetings row but no recording in Drive yet — pulling the
video out of Zoom (which expires recordings on a retention timer) into the private
**Meeting Recordings** folder on the Elevate 360 shared drive, and linking it back on the Notion row.

This runs AFTER the 06:00 Live pull, so the day's new meetings already have Notion rows by now.

## 1. Sweep
```
node scripts/meetings/archive-video.cjs --sweep --days 60 --batch 6
```
- Queries the Notion Meetings DB for rows where `Video Archived` is false and `Date` is within the last
  60 days, newest first, and archives up to 6 of them this run.
- Per meeting it copies the best single MP4 (screen+speaker → active-speaker → gallery) + the audio M4A
  into `Meeting Recordings/{YYYY-MM}/`, then writes `Recording` (folder link), `Recording File ID`, and
  ticks `Video Archived` on the Notion row.
- The script reads all keys from `.env` itself — never echo a token. It is **idempotent**: files already
  in Drive are skipped, already-archived rows are filtered out. Safe to re-run; the backlog clears over
  successive days at 6/run.

## 2. Report
Relay the script's summary verbatim-ish:
- How many archived, how many were missing-from-Zoom (recording expired before we reached it — these are
  lost and worth flagging), how many failed.
- If anything failed, name the meeting and the error. A hard failure stops that run; the next run resumes.
- If the sweep reports 0 un-archived, say "All recent meetings already archived."

Notes:
- The byte transfer runs on THIS machine (download from Zoom → upload to Drive), so it only runs when the
  command-centre/cron host is up. It is not an n8n-cloud job.
- `missing-from-Zoom` is the signal that Zoom retention is winning the race — if it appears often, widen
  the daily batch or shorten retention reliance.
