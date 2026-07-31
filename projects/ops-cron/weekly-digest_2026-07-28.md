## Week of 2026-07-27 — 2026-07-28

_Short week — only 2 days of memory logged (Mon 7/27, Tue 7/28). No entries for 7/22-7/26 in this file's window; those were covered by last week's digest._

### Sessions
- 2026-07-27 (route session, spans 7/26 AM → 7/27 late): Finalize week-of-7/27 routes before customer emails went out — rebalanced to ~10h days, locked techs to territory grid, fixed 20 weekend visits, deleted 18 duplicate visits. **1,100+ Jobber writes, zero failures.** Final week reconciles Jobber↔OptimoRoute exactly (0 unrouted/orphans/no-driver).
- 2026-07-27: Phone training — added Tier 4 "curveball" scenarios (16-20) for Muhammad testing mole knowledge over price recall, plus a 14-fact mole knowledge answer key. Pack now 20 scenarios.
- 2026-07-27: Route Ready ad traffic review — corrected an earlier "paid search is shut off" call (real auction CPC $2.75 vs. planner's $10.80 median); first real serving day showed 82 impr / 4 clicks / $11.01, on-target search terms, 30K/mo demand validated. Sales still $0.
- 2026-07-28 (cron-only day, no interactive session logged yet in a daily .md): 20+ scheduled jobs ran automatically — CallRail↔Jobber sync (hourly, clean), Jobber↔OptimoRoute drift-check (4x, created 2 new bookings, flagged a tech name-mapping gap), Ninety scorecard push (47 KPIs, 0 failures), Route Ready content publisher (shipped a new guide), ads manager/budget guard (on track, $18.92 of $75 cap), skill-update-check (found registry drift — see below). Also built and deployed a voice-to-text Jobber field-notes tool for technicians (not yet committed to git).

### Deliverables
- `projects/briefs/technician-route-automation/*.mjs` (lock-techs-to-grid, set-driver-days, verify-week, write-subset, fix-weekend-visits, push-week, optimize-week updates) — route tooling built out during the 7/27 finalization push
- `projects/briefs/technician-route-automation/territory-grid.json` (v4→v12) — day-balance fixes, job-level overrides
- `projects/briefs/callrail-faq/2026-07-20_roleplay-scenarios.md` + `.pdf` + `muhammad-portable/` — Tier 4 scenarios 16-20, mole knowledge answer key
- `.claude/skills/ops-phone-roleplay/SKILL.md` — new `facts` mode, 4 new hard gates
- `projects/briefs/zero-touch-business/site/content/guides/move-out-cleaning-checklist-template.md` + rendered dist — new Route Ready guide, deployed to Cloudflare
- `projects/briefs/zero-touch-business/runs/digest-2026-07-28.md` — weekly ZTB status (three-bucket format)
- `projects/briefs/technician-route-automation/drift-runs/2026-07-28T*.json` (4 runs) — drift-check reports, 3 new bookings auto-created this week
- `gm-visit-notes.route-ready.workers.dev` — new voice-to-text field-notes web app for technicians (speech → structured Jobber notes); **not yet committed**
- `projects/ops-cron/skill-update-check_2026-07-28.md` — flags critical skill-registry drift (see Open Threads)

### Scheduled Jobs
- 21 distinct cron jobs configured; all core lanes (CallRail sync, route drift-check, Ninety push, Route Ready ads/content/budget guard) ran clean this week with 0 failures on live runs.
- **Recurring credential-gap failures (known, standing — not new regressions):** `gmail-daily-triage` (missing `GMAIL_CLIENT_ID`), `meeting-video-archive` (missing `ZOOM_*`), `meeting-clips-lane` (wrong Notion workspace — architectural, needs to live on the Elevate 360 install), `zernio-analytics-snapshot` (missing `ZERNIO_API_KEY`). These fire and fail-fast correctly every run; no data corruption, just blocked.
- **`route-drift-check` had one clean abort** (7/28 ~16:03) on a Jobber 504 timeout — correctly did not retry, no state written, resumed fine on the next scheduled pass.
- **`weekly-cash-flow-projection` has not run since 2026-07-07** (last_run 3 weeks stale, that one run failed, exit code 1) — worth checking whether this job is still scheduled/enabled.
- Lifetime run/fail counts from `cron/status/`: callrail-jobber-sync 82/19, route-drift-check 48/9, weekly-activity-digest 10/2, ninety-scorecard-push 2/0, ztb-ads-budget-guard 2/0 — all fail counts trace to the credential gaps above, not new issues.

### Learnings Added
- New `## ops-phone-roleplay` section (context/learnings.md) — Tier 4 design notes: pass conditions must be behaviors not facts (escalate-to-Spencer on I-713 pressure), bluffing scores below "I don't know," PDF regen via headless Chrome (no pandoc on this box).
- New `## technician-route-automation` section — 10 route-pipeline lessons from the grid v12 rebuild: write-order dependency (move→push→lock→plan→write), `write --date X` scoping trap, ride-along preservation, `--from=` window bug, `decided:false` grid entries are unaudited guesses.
- Expanded `## tool-optimoroute` (under tool-jobber) — undocumented driver-parameter API schema, `balancing:'ON_FORCE'` overrides `enabled:false`, Gumroad file-upload CDP quirks.
- Route Ready notes: `LAST_7_DAYS` excludes today (false "funding didn't take" alarm), keyword-planner top-of-page bids overstate real auction CPC by ~4x.

### Open Threads
- **DELETE 12 one-week `jobOverrides` after Wed 7/29** (peninsula zips + Steilacoom) or the temporary Wednesday routing sticks permanently.
- **10-hour driver cap still not API-enforceable** — needs `externalId` set on all 4 drivers in the OptimoRoute UI.
- Skill registry drift is critical: catalog lists 19 skills, 74 exist on disk, `installed.json` is missing entirely — flagged by this week's `skill-update-check` run, needs a reconciliation pass.
- New voice-to-text Jobber notes tool is live but **uncommitted** — awaiting Spencer's go on commit timing; also lives on Route Ready's Cloudflare account, not Got Moles' (ownership token swap needed).
- 46 Jobber↔OptimoRoute tech-drift mismatches trace to two placeholder driver names ("Alias Franks", "Robert Norton") never mapped to real OptimoRoute drivers — one-time name-map fix needed, not 46 individual corrections.
- 3 future Sunday visits found (Aug 2, Aug 9) violating the Mon-Fri rule — `weekend-sweep.mjs` exists but hasn't been run against future dates yet.
- Route Ready ads keep-or-cut decision needs a full week of CPC/conversion data (first live day was 7/27).
- Spencer: enable Search Console API (project 377890328473) for Route Ready — biggest analytics blind spot.
- `weekly-cash-flow-projection` cron silent for 3 weeks — check if intentionally disabled.

### Freshness Check
- All 12 `brand_context/*.md` files show a filesystem mtime of Jul 4 (24 days old) — under the 30-day threshold, but note they all share the exact same timestamp, which looks like a bulk checkout/sync rather than genuine last-edit dates, so true content age may be older. Worth a spot-check if any of these (positioning, ICP, voice-profile) haven't actually been revisited since the site rebuild kicked off.
