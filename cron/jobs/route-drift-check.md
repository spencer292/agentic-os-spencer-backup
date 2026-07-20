---
name: Route Drift Check (Jobber vs OptimoRoute)
time: '09:00,11:00,13:00,15:00,17:00'
days: daily
active: 'true'
model: sonnet
notify: on_finish
description: 'Every 2h 9am-5pm PT: diff the Jobber board against the OptimoRoute plan for all planned future days. New bookings missing from OR are auto-fixed (order created locked to day+tech, that day re-planned with everyone else locked, times written back to Jobber). Day/tech/time drift on existing orders is report-only. Spencer authorized auto-fix 2026-07-13.'
timeout: 20m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Read CLAUDE.md for system context. Full background:
`projects/briefs/technician-route-automation/brief.md` (v2 architecture + 07-12 drift findings).

This job closes the Jobber↔OptimoRoute drift gap: new bookings entered in Jobber never reach
OptimoRoute on their own (job #8158 on 07-12 was the proving case). The entire pass is one
deterministic script — do NOT improvise API calls or write your own fix logic.

1. From the repo root, run:
   `node projects/briefs/technician-route-automation/drift-check.mjs fix`
   The script itself enforces every guard: email freeze (a date locks 14:00 PT on D-1; today is
   never writable), planned-days-only scope, own-orders-only, max 15 creations per run,
   post-replan verification (any existing stop changing day or tech aborts that day with zero
   Jobber writes), priority always M, never deletes.
2. Summarize the output concisely:
   - Clean run: one line ("no drift" or "N new bookings slotted: #job @ time (tech)").
   - Report-only findings (day/tech/time drift on EXISTING orders, orphans, no-address or
     unscheduled new orders): list each with job number and what differs — these need Spencer's
     eyes, the script deliberately does not touch them.
   - Any ABORT, VERIFY FAILED, create/lock/write failure, or non-zero exit: quote the exact
     lines loudly at the top of the summary. Do not retry the fix yourself, do not attempt a
     manual repair — report and stop.
3. The JSON report is saved to `projects/briefs/technician-route-automation/drift-runs/` —
   reference the file path in your summary.

Rules:
- Never run the script more than once per job execution (a failed fix must be seen by Spencer,
  not retried blind — the retry could double-write).
- If the script fails on a Jobber token error or missing .env key, report it and stop.
- Never call OptimoRoute delete endpoints or `start_planning` yourself under any circumstances.
- Keep the summary short and skimmable.
