## Week of 2026-07-20 — 2026-07-27

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
- 2026-07-23: Phone-tracking mystery solved — "the AI" giving out a wrong number traced to Google's call-reporting forwarding number; new CallRail tracker built (swap into the Ads call asset still pending, blocked on expired creds/session).
- 2026-07-24 / 2026-07-25: **No sessions recorded** — cron runtime was down (`leaderState: absent`) for this entire window; no Claude sessions ran either. Missed: Friday content publish, Monday-cadence digest/article, Tuesday ads manager.
- 2026-07-26: Codex CLI installed as an independent second reviewer — `/codex-check` command, global rule bridge at `~/.codex/AGENTS.md`.
- 2026-07-26: Model tiering rewired — Fable 5 as orchestrator/designer, Opus 5 demoted to worker tier, field-ops (Jobber/OptimoRoute) lane lifted to Opus floor.
- 2026-07-26: Ninety scorecard backfilled 52 weeks (597 scores, 0 failures) + Missed Calls KPI added + weekly push cron registered (Mon 05:30).
- 2026-07-26: Kits 2 & 3 (pressure washing, lawn care) finished and published LIVE on Gumroad — full funnel now 3 products / 3 ad groups live, $8/day ad spend covering all three.
- 2026-07-26: Cron runtime found stopped since ~7/21; restarted by Spencer (daemon live, leader, heartbeat fresh) — this is what let the 7/26 catch-up work run at all.
- 2026-07-27 (today, in progress): only the automated weekly gap-analysis has run so far; no full session logged yet at time of this digest.

### Deliverables
- `projects/briefs/zero-touch-business/phase0-checklist.md` — Route Ready launch readiness tracker
- `projects/briefs/callrail-faq/muhammad-portable/` — self-contained onboarding training bundle
- `.claude/skills/ops-phone-roleplay/SKILL.md` — new roleplay training skill
- `projects/tool-jobber/scripts/arrival-window-sweep.mjs` + `cron/jobs/jobber-arrival-window-sweep.md` — arrival-window automation + weekly cron
- `projects/briefs/technician-route-automation/late-start-replan.mjs` — reusable late-start route script
- `projects/briefs/got-moles-scale/2026-07-21_baseline-model.md` — Phase 0 diagnostic (revenue, gap math, TAM)
- `projects/tool-jobber/2026-07-21_tmcp-revenue-audit.md` — recurring revenue audit (final)
- `projects/briefs/technician-route-automation/territory-grid.json` (v2→v3) — route density restructure
- `projects/briefs/got-moles-scale/2026-07-22_ninety-scorecard-audit.md` + `scripts/ninety-weekly-push.mjs` — Ninety scorecard automation
- `projects/ops-contracts/2026-07-22_mole-busters-referral-agreement.md` (+PDF) — signed-pending referral contract
- `projects/briefs/got-moles-scale/2026-07-22_ninety-org-chart-current.md` — org chart work
- `scripts/_gm-call-asset-audit.mjs` — call-asset/tracking audit tooling
- `.codex/AGENTS.md` (`~/.codex/AGENTS.md`) + `.claude/commands/codex-check.md` — external second-reviewer harness
- `projects/briefs/got-moles-scale/2026-07-26_ninety-52week-backfill.md` + `cron/jobs/ninety-scorecard-push.md` — full scorecard backfill + registered cron
- `products/pw-kit/` + `products/lawn-kit/` (deliverables, listing copy, site pages) — Kits 2 & 3, live on Gumroad
- `CLAUDE.local.md` — model tiering + field-ops Opus-floor rules added

### Scheduled Jobs
- Fleet of 21 jobs. The dominant story this week is an **outage, not scattered flakiness**: the runtime was down (`leaderState: absent`) from roughly 2026-07-21 through 2026-07-26 evening, confirmed in the logs by a ~40-hour dead zone (2026-07-25 ~01:15 to 2026-07-26 ~17:15-18:00) across the two highest-frequency jobs. Restarted by Spencer on 7/26.
- **Currently red (last run = failure):** `jobber-visit-followups` (7/27 01:16, exit 1), `weekly-activity-digest` — this job's own earlier scheduled attempt today failed fast (8ms, exit 1) before this catch-up run, `weekly-cash-flow-projection` (stale — see below).
- **Abandoned:** `weekly-cash-flow-projection` has not run since 2026-07-07 — 20 days dead, zero runs this week. Worth a manual check.
- **Failures this week, by job** (log-verified, mostly clustered on 7/23–7/24 or inside the outage window): `callrail-jobber-sync` 19 (its entire lifetime failure count — all happened this week, concentrated 7/24), `route-drift-check` 9 (also its full lifetime total); single failures each on `daily-memory-distill`, `jobber-arrival-window-sweep`, `meeting-video-archive`, `gmail-daily-triage`, `nightly-memory-index`, `zernio-analytics-snapshot`, `ztb-ads-manager`, `ztb-weekly-digest`, `ztb-content-publisher`; two failures each on `monthly-learnings-health`, `meeting-clips-lane`, `skill-update-check`, `weekly-memory-curator`, `weekly-memory-gaps`, `jobber-visit-followups`, `weekly-activity-digest`.
- `meeting-clips-lane` failures are the known standing blocker, not new: this install's only Notion token has no access to Roy/Elevate 360's Meetings DB.
- Most jobs are green again as of 7/27 now that the daemon is back up; `ninety-scorecard-push` (new this week) and `ztb-ads-budget-guard` (new this week) have clean records so far.

### Learnings Added
- `## ops-google-ads` (new section): Route Ready campaign-build gotchas — REST v23 field-name traps (`targetSpend` not `maximizeClicks`, `location` not `geoTarget`), a criteria-type audit gotcha (device auto-criteria masks missing geo/language/negatives), `ROUTE_READY_ADS_*` env namespacing, MCC link-acceptance-via-API pattern.
- `## tool-jobber`: bulk-pull throttling pattern (24-mo invoice pulls hit query-cost throttle; 60s backoff + cursor resume), confirmed filter fields, quote-status close-rate formula, jobCreate shapes for one-off→recurring rebuilds, ONE_OFF billing restriction, the "Yearly job.total shows the monthly rate" trap.
- Org-chart / Ninety: no public API for the org chart (browser-only, seat text lives in textarea values); Ninety's public API cannot create KPIs and has no GET for scores (verification has to be visual or by reconciling the board total).
- CallRail/Ads: "the AI" identified as CallRail's Voice Assistant (not Jobber's); Google Ads call assets carry the raw main line and get overlaid with Google's own forwarding number unless pointed at a CallRail tracker.
- Model routing: subagent model resolution order documented (env var → per-call param → frontmatter → session default) — a blank `model:` field silently inherits and bills at session rate.
- Gumroad (from the 7/26 kit-publish push, not yet folded into `context/learnings.md` — flag for next wrap-up): the API cannot publish products or reliably report attached files; multi-file uploads collapse into an "Untitled" folder that can't be renamed via automation; `element.click()` fails on Gumroad's React buttons, use a trusted CDP click.

### Open Threads
- **HIGH:** Amex over its limit — declining Ninety.io and Anthropic charges repeatedly; Claude subscription at risk.
- **HIGH:** Cron runtime's single point of failure — it silently sat down for ~5-6 days before anyone noticed. No alerting exists for "daemon not running." Worth building a heartbeat check.
- Google Ads call asset swap (raw line → CallRail tracker 253-331-2772) still pending — blocked on invalid `GOOGLE_ADS_*` creds and an expired Google session in the agentic browser.
- Meeting Clips Lane still blocked on Notion access (Roy's side).
- Ninety org chart: resume at Role 4 (Innovation & New Opportunities), then Roles 5-7.
- Ninety scorecard: Spencer's UI cleanup pass still pending (archive dupe KPIs, set owners/goals, loosen Missed Calls goal if desired).
- Density restructure v3: cutover-timing decision still open (this week vs 8/3); 14 unassigned next-week visits need tech owners.
- Route Ready: watch first real `ztb-ads-manager` search-term read (Tue 7/28) — first look at the funnel now that all 3 kits are live; conversion-tracking site tweak recommended by ~8/6.
- Mole Busters contract awaiting signatures; provision dedicated CallRail number; collect W-9.
- Gumroad content folders on both new kits still read "Untitled" — could not be renamed via automation, needs a manual pass in the dashboard.
- Signup checklist insert (tag + monthly-last-day + recurring job type) still not drafted.
- Second email account (office@got-moles.com) still not connected to the triage system.
- `~/.codex/AGENTS.md` sync debt — any future `CLAUDE.local.md` rule change must be hand-copied there; no automation yet.

### Freshness Check
- All 12 `brand_context/` files last touched 2026-07-03 — 24 days old. Under the 30-day threshold, nothing flagged stale yet, but this is the closest the set has been to the line; worth a re-check on the next digest if still untouched past 2026-08-02.
