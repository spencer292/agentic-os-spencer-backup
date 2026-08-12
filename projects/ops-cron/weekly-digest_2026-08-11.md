## Week of 2026-08-10 — 2026-08-11

Note: this week is 2 days old (Mon 08-10, Tue 08-11 today). Prior week is `weekly-digest_2026-08-10.md`.

### Sessions
- **2026-08-10** (cron-only day, 3 runs):
  - Ninety scorecard push — clean. Weeks 07-20..08-03, 47 pushed / 0 failed. TMCP tags stable (647 active, 18 churned).
  - Route-horizon-extend — self-aborted at dry run again: `optimize-plan.json` for 08-10..14 (2 pending Jobber writes) is still unresolved, so the 08-17..08-28 window can't be planned without overwriting it. Still blocked.
  - Phone-lookup rebuild — clean against pinned v5 grid (3,982 addresses, unrouted down to 2, tech-clash down to 0). Artifact publish still broken (3rd+ day), 08-17 overlay came back empty (same horizon-block root cause), v5 roster still stale (missing Robert Norton, no Cory→Tavis handover).
- **2026-08-11**: TMCP audit — reconciled Ninety's scorecard (687) against a true job-level count (674) and a client-tag count (653/client). Found and explained the full gap: 26 archived TMCP jobs were being counted as active (a real bug — `endAt` never fires on a 10-year contract), plus timing/cache differences. Decision: freeze published history, correct forward from 2026-08-10 so nothing already on the board moves; corrected number lands 2026-08-17. Nothing pushed to Ninety this session (dry run only).

### Deliverables
- `projects/tool-jobber/scripts/tmcp-tag-audit.mjs` — added multi-job-client + job-level reporting
- `projects/tool-jobber/data/2026-08-11_tmcp-tag-audit.json` — audit run: 674 live TMCP jobs, 653 clients, $74,162.19 MRR-equivalent
- `projects/briefs/got-moles-scale/scripts/ninety-weekly-push.mjs` — archived-job guard fixed, one-time board notes added
- `projects/briefs/got-moles-scale/scripts/ninety-kpi-map.json` — fix cutoff + rationale recorded
- `projects/briefs/technician-route-automation/service-day-lookup/*` — rebuilt phone-lookup outputs (08-10 build stamp)

### Scheduled Jobs
- 25 jobs tracked in `cron/status/`. Within the last 7 days (08-05–08-11), every job's most recent run succeeded **except**:
  - `muhammad-call-grading` — last run 08-11 marked **FAILURE** by the wrapper (331s) despite producing a complete graded report (`projects/briefs/callrail-faq/call-grading/2026-08-11.md`) — looks like a wrapper/exit-code issue, not a content failure. Worth a look.
  - `weekly-cash-flow-projection` — still stuck on its one and only run, 2026-07-07, `result: failure`. Outside this week's window but now 5 weeks stale and unaddressed.
- `route-drift-check` has no runs logged since 08-09 — consistent with the standing rule to stop crons during manual Jobber editing sessions; not a failure signal on its own.

### Learnings Added
- 2 new entries in `context/learnings.md` (2026-08-11, both under `## tool-jobber` and `### What works well`):
  - Reconciling a numeric discrepancy to zero before trusting either source — the residual term is where the real bug lives (case: Ninety 687 vs audit 674).
  - TMCP `endAt` is a 10-year horizon, so date-gated "still active" checks never fire on archived jobs; and TMCP has three legitimate but non-comparable counts (jobs / clients / tagged clients).

### Open Threads
- `optimize-plan.json` for 2026-08-10..14 still unresolved — blocks the 08-17 route horizon; Spencer needs to either write or archive it.
- Two off-plan visits need a look: **#8336 Dale Hoff** (Tacoma, unrouted) and **#4962 Maureen Haley** (Auburn, off-day).
- Hosted artifact publish still broken from cron — office lookup links now ≥4 days stale.
- Corrected TMCP number (~672 vs 687, ~−15 step) first publishes to Ninety 08-17 — confirm the explanatory board notes actually landed.
- 6 TMCP tag mismatches (3 missing tag, 3 tagged with no job) and 4 possible duplicate TMCP jobs (~$370/mo) flagged but not actioned — Spencer's call.
- `muhammad-call-grading` FAILURE-flagged run needs a wrapper check (content was fine).
- `weekly-cash-flow-projection` has been broken for 5 weeks straight — needs a fix or a decision to retire it.

### Freshness Check
- **All of `brand_context/`** (voice-profile, positioning, icp, assets, design-system, authority-strategy, mole-knowledge-base, samples, target-keywords, technician field guides, rebrand asset set) last touched **2026-07-03 — 39 days stale**, unchanged from last week's check.
