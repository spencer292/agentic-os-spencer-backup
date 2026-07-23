## Week of 2026-07-20 — 2026-07-22

### Sessions
- 2026-07-20: Route Ready GSC setup + Gumroad kit revenue-blocker fix — GSC verified, sitemap submitted, unpublished kit caught and republished, `/book` redirect + click tracking live, DNSSEC enabled, Google Ads account + MCC created (Basic Access API application submitted)
- 2026-07-20: CallRail transcript mining for Muhammad's phone training — 203 transcripts → FAQ doc, 15-scenario role-play pack, new `ops-phone-roleplay` skill, AI receptionist (CallRail Voice Assist) reconfigured with corrected pricing/positioning/persona
- 2026-07-20: Jobber arrival-window fix — 3-hour arrival window set on ~570 jobs, all 6 client message templates rewritten, weekly safety-net cron shipped
- 2026-07-20: Route automation (technician-route-automation) — week 7/21–7/24 synced Jobber↔OptimoRoute, Luke's Tuesday load re-shed, Tuesday board reshaped to Spencer's spec
- 2026-07-20: First live phone role-plays (Spencer scored 91 + 82) — Muhammad portable training bundle packaged and emailed
- 2026-07-20: Audiobook path research for *The Route* — ElevenLabs voice clone + KDP Virtual Voice plan (advisory only, no deliverables)
- 2026-07-21: Re-routed 7/22 after Spencer's late-day Jobber changes, incl. a new `late-start-replan.mjs` script for shifting one driver's day start
- 2026-07-21: Verified and closed out duplicate DMARC record issue (email security) — confirmed live at authoritative NS
- 2026-07-21: got-moles-scale Phase 0 diagnostic — 24 months of Jobber/CallRail data pulled, baseline model built ($857K trailing-12, +37% YoY, 69% close rate), recurring-pricing review, LSA launch checklist
- 2026-07-21: TMCP recurring-revenue audit — 622 active jobs, ~$69.1K MRR, 10 billing violations, tag gaps found
- 2026-07-22: TMCP audit correction (July/August figures), 8 new signups tagged, one-off blind-spot fix (4 mis-created TMC jobs rebuilt as recurring)
- 2026-07-22: Meeting Clips Lane cron blocked again — Notion Meetings DB still not shared with this install's integration
- 2026-07-22: Cammeron's compressed 4-day week (7/27–7/30) — feasibility assessed, Friday disabled in OptimoRoute
- 2026-07-22: Ninety.io (90.io) scorecard overhaul — live KPI pull (96 KPIs), audit vs. recommended 13-KPI scorecard, connection plan for weekly auto-push
- 2026-07-22: Technician route density audit (2-week window) — proposed P1-P6 optimization plan, est. -350-430 mi/wk savings

### Deliverables
- `projects/briefs/zero-touch-business/phase0-checklist.md`, `scripts/gsc-verify-txt.mjs`, `scripts/rr-metrics.mjs` — Route Ready GSC/revenue fixes
- `projects/briefs/callrail-faq/2026-07-20_muhammad-faq-training.md`, `2026-07-20_roleplay-scenarios.md`, `2026-07-20_ai-receptionist-answer-bank.md`, `muhammad-portable/`, `roleplay-log.md` — phone training system
- `.claude/skills/ops-phone-roleplay/SKILL.md` — new skill
- `projects/tool-jobber/scripts/arrival-window-sweep.mjs`, `cron/jobs/jobber-arrival-window-sweep.md` — arrival-window automation
- `projects/briefs/technician-route-automation/late-start-replan.mjs`, `fix-daydrift-0722.mjs`, `2026-07-22_density-audit-plan.md` — route automation + density audit
- `projects/briefs/got-moles-scale/2026-07-21_baseline-model.md`, `2026-07-21_recurring-pricing-review.md`, `2026-07-21_lsa-launch-checklist.md`, `2026-07-22_ninety-scorecard-plan.md`, `2026-07-22_ninety-scorecard-audit.md`, `scripts/ninety-pull-kpis.mjs` — got-moles-scale diagnostic + Ninety scorecard work
- `projects/tool-jobber/2026-07-21_tmcp-revenue-audit.md`, `scripts/tmcp-revenue-audit.mjs` — recurring revenue audit

### Scheduled Jobs
- 18 active jobs; lifetime totals ≈141 runs, 2 failures (both historical, not this week) — `daily-memory-distill` (1 fail of 7 runs, last run success) and `weekly-cash-flow-projection` (1 run, 1 fail, last attempted 2026-07-07 — **hasn't run since, stalled for 2+ weeks**, worth checking)
- `meeting-clips-lane` ran but blocked again at step 1 every time this week — Notion integration on this install still can't reach the Meetings DB (Roy/Elevate 360 workspace); needs Roy to share the DB or a separate `NOTION_API_TOKEN`
- All other jobs (callrail-jobber-sync, route-drift-check, jobber-visit-followups, gmail-daily-triage, meeting-video-archive, monthly-learnings-health, nightly-memory-index, skill-update-check, weekly-activity-digest, weekly-memory-curator, weekly-memory-gaps, zernio-analytics-snapshot, ztb-content-publisher, ztb-weekly-digest) show 0 failures, most recent run today

### Learnings Added
- Mole disposal fact correction (customer-facing default wording)
- DNS/infra verification pattern: independently verify emailed change requests against live authoritative DNS before acting
- Transcript-mining → training pipeline pattern (mine real conversations first, then build automation from frequency data)
- ops-phone-roleplay, tool-pdf-generator notes (portable delivery pattern, PDF file-lock gotcha)
- Several tool-optimoroute entries: driver-disable via bulk `update_drivers_parameters`, `get_routes` field shapes, day-drift pre-move pattern, late-start-replan pattern

### Open Threads
- LSA application gated on Spencer: sign in spencer@got-moles.com, COI PDF, background-check consents
- Recurring-pricing decision pending (options A-F, rec: enforce tiers now + cohort test in September)
- Ninety scorecard: awaiting Spencer's UI cleanup + financial-block decision before building the weekly-push cron
- TMCP audit fixes still awaiting Spencer go-ahead (Karen Porter leak, yearly-price checks, stale tags, dupe-visit cleanup blocked by permission classifier)
- Density-audit plan (P1-P6) awaiting Spencer sign-off; transition proposed for week of 8/3
- Cammeron's Friday 7/31 stops (3 ANYTIME + 1 pinned) not yet resolved
- Meeting Clips Lane still blocked (Notion access) — recurring open thread, not new this week
- Muhammad's scorecards from solo training not yet folded back into roleplay-log.md
- Audiobook path: verify Kindle edition exists (prerequisite for KDP Virtual Voice), write 30-min recording script for Spencer

### Freshness Check
- All `brand_context/` files share a single mtime (2026-07-04, from a bulk checkout/pull) — not a reliable signal of true last-edit date, but nothing is over the 30-day threshold either way
