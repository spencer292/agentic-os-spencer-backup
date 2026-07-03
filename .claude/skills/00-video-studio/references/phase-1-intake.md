# Phase 1 — INTAKE

Pull each pending job from the Studio Drive Inbox into local working storage.

## Steps

1. Resolve the Inbox ID from `references/drive-ids.md` (`1_inbox` = `1IIq28oUi4rMsuUj-kh3vTgjNGuOSsuLN`).
2. List job folders: `search_files: parentId = '<inbox_id>'`. Each child **folder** is one job.
   - If the user passed a job name argument, filter to that one.
   - Loose files dropped directly in `1_inbox` (not in a subfolder) → treat each as its own
     single-video job named after the file stem.
3. For each job, list its files: `search_files: parentId = '<job_id>'`.
4. Create local working dir: `projects/00-video-studio/runs/{YYYY-MM-DD}_{job}/source/`.
5. Download each file with `download_file_content` and save to the source dir. Classify by mime:
   - `video/*` → videos
   - `image/*` → photos
   - `text/plain` named `note.txt` → the brief
6. Read `note.txt` if present. Parse optional directives (all lines optional):
   ```
   path: highlight            # force a path
   duration: 30               # target seconds
   mood: upbeat               # music/pacing hint
   title: Spencer's Build     # overlay headline
   tags: @spencer @brands     # overlay / caption tags
   music: engine-anthem.mp3   # specific bed from 6_Assets/music/
   ```
7. Start `run-log.md` in the run dir. Log the job name, file inventory, and parsed note.

## Output of this phase
A local `source/` folder per job + a parsed `note` dict. Hand to Phase 2 (ROUTE).

> Large files: Drive `download_file_content` streams base64 — for multi-GB racing footage prefer
> noting the file is large and downloading sequentially, not all jobs at once, to avoid memory spikes.
