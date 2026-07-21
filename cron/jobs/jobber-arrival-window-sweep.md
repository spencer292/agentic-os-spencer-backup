---
name: Jobber Arrival Window Sweep
time: '06:10'
days: mon
active: 'true'
model: haiku
notify: on_error
description: 'Weekly safety net: ensures every Jobber job with timed visits in the next 14 days has the standard 3-hour arrival window, so client texts show a window instead of an exact route-ETA time. Mutation (jobEdit arrivalWindow 180min) pre-approved by Spencer 2026-07-20.'
timeout: 15m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Task: run the Jobber arrival-window sweep and report the outcome.

Steps:

1. From the repo root, run:
   `node projects/tool-jobber/scripts/arrival-window-sweep.mjs`
2. Read the output.
   - "Nothing to do" → output: `Arrival windows OK — all upcoming jobs covered.`
   - Applied N jobs cleanly → output: `Set 3-hour arrival window on {N} job(s) that were missing one.`
   - Any `!! ` failure lines → include them verbatim in the output so they surface in the
     notification, and recommend a manual look if the same job fails two weeks running.
3. Do not edit the script. Do not run any other Jobber mutations.

Rules:
- The script is the actor; you are the runner and reporter.
- The 180-minute window is the approved company standard — do not change it here. If the
  standard changes, Spencer updates WINDOW_MIN in the script.
