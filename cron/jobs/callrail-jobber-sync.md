---
name: CallRail Voice Assist → Jobber Sync
time: '07:15,08:15,09:15,10:15,11:15,12:15,13:15,14:15,15:15,16:15,17:15,18:15'
days: daily
active: 'true'
model: haiku
notify: on_error
description: 'Hourly 7am-6pm PT: pulls structured Voice Assist intake (correct name, real street address, email, property size/type, lead source) from CallRail and repairs/creates the matching Jobber client. Fixes caller-ID junk names ("Last,First N/A"), fills empty CID-only property addresses, adds emails, attaches an intake note with call link. Ambiguous name mismatches are noted, never overwritten. Spencer authorized apply mode 2026-07-20.'
timeout: 15m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Task: run the CallRail → Jobber sync in apply mode and report the outcome.

Steps:

1. From the repo root, run:
   `node projects/briefs/callrail-faq/scripts/callrail-jobber-sync.mjs --apply --hours 24`
2. Read the output.
   - If it ends with "Applied." and shows no `!! ERROR` lines: output a one-line summary —
     `Synced {N} VA calls: {created} created, {repaired} repaired, {noted} note-only.` (count from the printed plans; if 0 unprocessed, say "No new Voice Assist calls.")
   - If any plan shows `!! ERROR`: include the caller name, call ID, and the error line in the output so it surfaces in the notification. Do NOT retry mutations yourself — the state file leaves errored calls unprocessed, so the next run retries them.
3. Do not edit the script. If the same call errors on 3+ consecutive runs, say so explicitly in the output and recommend a manual look.

Rules:
- The script is the actor; you are the runner and reporter. No ad-hoc Jobber mutations.
- Never mark a call processed manually.
