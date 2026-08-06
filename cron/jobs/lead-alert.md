---
name: New Lead Alert (Jobber → Email)
time: '07:00,07:15,07:30,07:45,08:00,08:15,08:30,08:45,09:00,09:15,09:30,09:45,10:00,10:15,10:30,10:45,11:00,11:15,11:30,11:45,12:00,12:15,12:30,12:45,13:00,13:15,13:30,13:45,14:00,14:15,14:30,14:45,15:00,15:15,15:30,15:45,16:00,16:15,16:30,16:45,17:00,17:15,17:30,17:45,18:00,18:15,18:30,18:45,19:00'
days: daily
active: 'true'
model: haiku
notify: on_finish
description: 'Every 15 min, 7am-7pm PT: polls Jobber for newly created clients, picks the inbound leads worth a callback (website-form leads first, caller-ID stubs held 70 min for the CallRail sync to repair, 48h phone dedupe, non-US phones flagged as likely spam) and emails Spencer. Replaces n8n workflow LGD33gS2IupDhUi0, which could never activate because n8n and this machine share one Jobber OAuth app and only one can hold a live token.'
timeout: 5m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Task: run the new-lead alert and report the outcome. The script is the actor — it queries
Jobber, decides which new client records are leads, and sends the email itself. You are the
runner and reporter only.

Steps:

1. From the repo root, run:
   `node projects/briefs/lead-alerts/lead-alert.mjs`
2. Read the output and respond as follows:
   - Output starts with `No new leads` → reply with exactly: `No new leads. [SILENT]`
   - Output starts with `Primed:` → repeat that line as-is. This is the first run; it marks
     existing leads as already-seen so Spencer is not blasted with a backlog.
   - Output starts with `N NEW LEAD(S)` and ends with `Emailed to ...` → reply with a
     one-line summary: `{N} new lead(s) emailed: {names}.` Add `— {M} flagged as possible spam`
     if any line carries `[POSSIBLE SPAM`.
   - Output contains `!! EMAIL FAILED` or `!! EMAIL NOT CONFIGURED` → this is the important
     case. Reply with the FULL lead block (names, phones, emails, Jobber links) plus the
     failure line, so the leads reach Spencer through the desktop notification even though
     the mailbox is down. Never abbreviate the leads in this case.
   - Output starts with `!! ERROR` → report the error line verbatim. If it mentions the
     Jobber token or authorization, say explicitly: "Jobber token needs re-auth — run
     `node .claude/skills/tool-jobber/scripts/jobber-api.mjs auth`."

Rules:
- Do not edit the script, the state file, or `runs/`.
- Never make Jobber mutations. This job is read-only on Jobber by design.
- Do not re-run the script on success — a second run inside the same window is harmless but
  pointless, and a run after a partial failure could double-send.
- On error, do NOT retry destructively. The suppression state only advances on a successful
  run, so the next scheduled poll picks up anything missed.
- Keep the summary to one line unless email delivery failed.
