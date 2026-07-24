## Week of 2026-07-20 — 2026-07-23

### Sessions
- 2026-07-20: Route Ready GSC + revenue-blocking fixes — GSC verified, unpublished Gumroad kit republished, DNSSEC live, Ads account/MCC/GCP created, Basic Access API application submitted.
- 2026-07-20: CallRail transcript mining for Muhammad onboarding — FAQ doc, 15-scenario roleplay pack, AI receptionist rebuild (persona, pricing, service area).
- 2026-07-20: Jobber arrival-time fix — 3-hr windows set on ~570 jobs, all 6 client templates rewritten, weekly safety-net cron shipped.
- 2026-07-20: Jobber↔OptimoRoute weekly sync + Tuesday route shaping + Luke load-shed.
- 2026-07-20: First live phone roleplay reps scored; Muhammad portable training bundle packaged and zipped.
- 2026-07-20: Audiobook plan for *The Route* — ElevenLabs voice clone + KDP Virtual Voice path decided.
- 2026-07-21: Re-routed 7/22 board after Spencer's Jobber changes; new `late-start-replan.mjs` script shipped.
- 2026-07-21: Duplicate DMARC record diagnosed and fixed (Spencer removed stale GoDaddy record).
- 2026-07-21: got-moles-scale Phase 0 diagnostic (overnight) — baseline model, $857K trailing-12 revenue, 69% close rate, $5M/$10M gap math, LSA checklist.
- 2026-07-21: TMCP recurring-revenue audit run — 622 active jobs, MRR ≈$69.1K, 10 billing violations found.
- 2026-07-22: TMCP audit CLOSED — 625 members, MRR ≈$69.7K verified clean, one-off jobs rebuilt, tags/schedules fixed.
- 2026-07-22: Cammeron's 4×10 week set up in OptimoRoute (Fri 7/31 off).
- 2026-07-22: Ninety.io scorecard plan + live audit — 96 KPIs pulled, 28/41 weekly KPIs never scored.
- 2026-07-22: Route density audit plan (P1–P6) — Spencer approved all except P4 (peninsula biweekly, rejected); territory-grid v2 shipped.
- 2026-07-22: Mole Busters referral contract finalized (Mackenzie Parshall, $100/close, exclusive W. WA).
- 2026-07-22: Route Ready Ads API went fully live overnight; launch Search campaign built (paused, pending sign-off).
- 2026-07-22: Email triage system built — 7 Gmail labels, 6×/day cloud routine, 304-thread backlog swept.
- 2026-07-22: Ninety org chart Visionary-seat redefinition — Roles 1-3 final; decision: Spencer does zero bids going forward.
- 2026-07-23: Route Ready Ads campaign ENABLED and serving live; `ztb-ads-manager` cron flipped active.
- 2026-07-23: Route density restructure v3 finalized (Spencer: peninsula never changes; Cory+Alias run as one crew).
- 2026-07-23: Route Ready conversion tracking (gclid capture → Gumroad → Ads upload) built and deployed live.
- 2026-07-23: Ninety weekly push script built + backfilled 12 weeks (166 scores, 0 failures).
- 2026-07-23: Email triage backlog sweep completed (304 threads), 2 reply drafts staged for Spencer.

### Deliverables
- `projects/briefs/zero-touch-business/phase0-checklist.md` — Route Ready launch readiness tracker
- `projects/briefs/zero-touch-business/scripts/rr-build-launch-campaign.mjs` + `rr-mint-refresh-token.mjs` — Ads campaign build + OAuth tooling
- `projects/briefs/callrail-faq/muhammad-portable/` — self-contained onboarding training bundle
- `.claude/skills/ops-phone-roleplay/SKILL.md` — new roleplay training skill
- `projects/tool-jobber/scripts/arrival-window-sweep.mjs` + `cron/jobs/jobber-arrival-window-sweep.md` — arrival-window automation + weekly cron
- `projects/briefs/technician-route-automation/late-start-replan.mjs` — reusable late-start route script
- `projects/briefs/got-moles-scale/2026-07-21_baseline-model.md` — Phase 0 diagnostic (revenue, gap math, TAM)
- `projects/tool-jobber/2026-07-21_tmcp-revenue-audit.md` — recurring revenue audit (final)
- `projects/briefs/technician-route-automation/2026-07-22_density-audit-plan.md` + `territory-grid.json` (v2→v3) — route density restructure
- `projects/briefs/got-moles-scale/2026-07-22_ninety-scorecard-audit.md` + `scripts/ninety-weekly-push.mjs` — Ninety scorecard automation
- `projects/ops-contracts/2026-07-22_mole-busters-referral-agreement.md` (+PDF) — signed-pending referral contract
- `projects/briefs/got-moles-scale/2026-07-22_ninety-org-chart-current.md` + `2026-07-22_visionary-roles-redefine-draft.md` — org chart work
- `projects/briefs/zero-touch-business/scripts/rr-upload-conversions.mjs` — Gumroad→Ads conversion uploader

### Scheduled Jobs
- 19 jobs registered; most recent runs succeeded (callrail-jobber-sync, jobber-arrival-window-sweep, route-drift-check, ztb-ads-manager, ztb-content-publisher, ztb-weekly-digest, gmail-daily-triage, zernio-analytics-snapshot, nightly-memory-index, jobber-visit-followups, meeting-video-archive all green as of 7/23).
- 4 jobs failed simultaneously on 2026-07-23 afternoon (~16:00–17:01 PT): `monthly-learnings-health`, `skill-update-check`, `weekly-memory-curator`, `weekly-memory-gaps` — all hit the Claude session limit (resets 11am PT), not a code issue. Should clear on next scheduled run.
- `meeting-clips-lane` failed again on 7/23 (8th consecutive fail) — known standing blocker: this install's only Notion token (n8n Route Sync integration) has no access to the Meetings DB in Roy/Elevate 360's workspace. Needs Roy to share the DB or a separate `NOTION_API_TOKEN`.
- `weekly-cash-flow-projection` has not run successfully since 2026-07-07 (1 run, 1 failure) — stale, worth a manual check.
- `callrail-jobber-sync` running hourly with 3 lifetime failures; `daily-memory-distill` 1 lifetime failure — neither recurring this week.

### Learnings Added
- `## ops-google-ads` (new section, currently uncommitted): 3 entries from the Route Ready campaign build — REST v23 field-name traps (`targetSpend` not `maximizeClicks`, `location` not `geoTarget`), a criteria-type audit gotcha (device auto-criteria masks missing geo/language/negatives), and the `ROUTE_READY_ADS_*` env namespacing + MCC link-acceptance-via-API pattern.
- `## tool-jobber`: bulk-pull throttling pattern (24-mo invoice pulls hit query-cost throttle; 60s backoff + cursor resume), confirmed filter fields and quote-status close-rate formula.

### Open Threads
- **HIGH:** Amex over its limit — declining Ninety.io and Anthropic ($182.18) charges repeatedly; Claude subscription at risk.
- Meeting Clips Lane still blocked on Notion access (Roy's side).
- Ninety org chart: resume at Role 4 (Innovation & New Opportunities), then Roles 5-7.
- Ninety scorecard: Spencer's UI pass still pending (archive dupe KPIs, create new ones incl. Missed Calls).
- Density restructure v3: cutover timing decision pending (this week vs 8/3), 14 unassigned next-week visits need tech owners.
- Route Ready: enable PW/Lawn ad groups when Kits 2/3 exist; watch first `ztb-ads-manager` cron run Tue 7/28.
- Mole Busters contract awaiting signatures; provision dedicated CallRail number; collect W-9.
- Justin Muir job #7150 — close Aug 1 after final bill (COMPLETE_PAST_DESTROY_FUTURE, no extra invoice).
- Signup checklist insert (tag + monthly-last-day + recurring job type) still not drafted.
- Second email account (office@got-moles.com) still not connected to triage system.
- Nicholas Cheng (duckit.ai) quote pending since 7/12; ~17 clients with undelivered Jobber quotes/invoices need contact-info fixes.
- Cammeron's Fri 7/31 floaters (3 ANYTIME + 1 pinned visit) not yet resolved.

### Freshness Check
- All 12 `brand_context/` files last modified 2026-07-04 (19 days old) — under the 30-day threshold, none flagged stale yet. Worth a re-check next digest if untouched past 2026-08-03.
