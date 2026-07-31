## Week of 2026-07-27 — 2026-07-29

*Short week (Mon–Wed only; digest runs mid-week).*

### Sessions
- 2026-07-27: Route finalization for week of 7/27 — locked techs to territory grid, fixed 20 weekend visits, deleted 18 dup visits, reconciled Jobber↔OptimoRoute (1,100+ writes, zero failures). Final week: 0 unrouted, 0 orphans, 0 no-driver, 0 Tavis.
- 2026-07-27: Phone training — built Tier 4 "curveball" scenarios (16–20) for Muhammad, testing mole knowledge over price recall, with an I-713 no-claim gate and a bluffing gate.
- 2026-07-27: Route Ready ads — corrected an earlier "paid search is dead" call (real CPC $2.75, not $10.80 planner estimate); first real ad traffic landed (82 impr / 4 clicks / $11.01, 4.88% CTR); kept ads running for a full week of data instead of cutting.
- 2026-07-28 (auto-captured, no manual session log): route drift-check found + fixed 3 missing OR bookings and a stale-snapshot bug in `lock-techs-to-grid.mjs`; Ninety KPI push succeeded (47 KPIs); Route Ready published a new guide article; built and tested a new Jobber voice-notes tool (uncommitted); built an n8n lead-alert workflow and fixed a live site bug in the contact form's Jobber API call; found the skill registry badly out of sync (19 cataloged vs 74 on disk).
- 2026-07-29: mostly cron/maintenance — drift-check clean across 3 runs (one new booking, #8261, needs manual OR placement); CallRail sync clean no-ops; meeting-clips lane reconfirmed blocked (no Notion Meetings DB access on this install).

### Deliverables
- `projects/briefs/technician-route-automation/lock-techs-to-grid.mjs` — tech-to-territory lock script, live-snapshot fix added 7/28
- `projects/briefs/technician-route-automation/territory-grid.json` — v4 → v12 this week
- `projects/briefs/technician-route-automation/drift-runs/*.json` — daily Jobber↔OptimoRoute drift reports
- `projects/briefs/callrail-faq/2026-07-20_roleplay-scenarios.md` (+ pdf, muhammad-portable copy) — Tier 4 scenarios 16–20 + mole-knowledge answer key
- `.claude/skills/ops-phone-roleplay/SKILL.md` — `facts` mode, 15→20 scenarios, 4 new hard gates
- `projects/briefs/zero-touch-business/site/dist/*` — new Route Ready guide article published
- `projects/briefs/zero-touch-business/runs/{ads,content}-log.md` — Route Ready ads/content run logs
- `gm-visit-notes.route-ready.workers.dev` — new technician voice-to-Jobber-notes tool (code not yet committed)
- n8n workflow "Got Moles — New Lead Alert" — built, left inactive pending Gmail credential
- `site/src/lib/jobber.ts`, `site/src/app/(frontend)/api/contact/route.ts` — fixed contact-form Jobber field bug
- `projects/ops-lead-alerts/2026-07-28_uncontacted-website-leads.md` — 21 uncontacted website leads compiled
- `projects/briefs/jobber-notes-automation/runs/2026-07-28-dryrun.txt` — follow-up scheduling dry run
- `projects/briefs/got-moles-scale/scorecard-runs/*.json` — Ninety KPI push logs

### Scheduled Jobs
- ~105 runs this week (Mon 7/27 – Wed 7/29), 6 failures, all self-recovered on the next scheduled run:
  - `callrail-jobber-sync`: 2 failures (Mon 7/27 early morning)
  - `route-drift-check`: 2 failures (Mon 7/27 00:00 — 17s crash; Wed 7/29 20:08 — 430s timeout)
  - `jobber-visit-followups`: 1 failure (Mon 7/27), recovered Tue 7/28
  - `weekly-activity-digest`: 1 failure (Mon 7/27 00:00, 8s), recovered next day
- **`weekly-cash-flow-projection` still stalled** — last run 2026-07-07 (`spawn ...claude ENOENT`), 0 runs since. 3+ weeks unresolved, needs investigation.
- **`meeting-clips-lane` "succeeds" every day but is a controlled no-op** — blocked on Notion Meetings DB access this install doesn't have. Standing recommendation unchanged: disable the cron here or move the lane to the Elevate 360 install.

### Learnings Added
- New section **`tool-optimoroute`** (5 entries) — undocumented driver-parameter API schema, `balancing:'ON_FORCE'` gotcha, order-level tech lock field, `lockTechs=false` gotcha, Gumroad file-upload quirks.
- New section **`ops-phone-roleplay`** (4 entries, first for this skill) — behavior-based pass conditions, dual-direction I-713 hard gate, bluffing-scores-worse-than-honesty gate, PDF regen via headless Chrome.
- Expanded **`technician-route-automation`** (10+ new entries) — write-scoping bug, tech-comparison bug, ride-along preservation, `--from` window bug, pinned-visit behavior, `decided:false` audit rule, same-tech rebalancing rule, end-of-day verify-week false-mismatch, Route Ready reporting-window trap, bid-reality-vs-planner-estimate lesson.
- All logged in the 2026-07-27 wrap-up commit.

### Open Threads
- Delete 12 one-week `jobOverrides` after Wed 7/29 or peninsula defaults to Wednesday instead of reverting to standing Tuesday.
- 10-hour driver cap still not API-enforceable — needs `externalId`s set on drivers in the OR UI.
- **#8261** (7/30, Cammeron Anderson) needs manual sequencing in OptimoRoute — created past the D-1 freeze, still reporting as missing drift.
- Voice-notes tool uncommitted, awaiting Spencer's go-ahead; hosted on Route Ready's Cloudflare account, needs a token swap to move to Got Moles.
- Lead-alert n8n workflow needs Gmail credential connect + Jobber Requests scope + Roy to deploy the site fix.
- **GSC API disabled at the GCP project level** — blocks Route Ready organic-search visibility; flagged repeatedly as the most urgent blocker.
- Skill registry drift (19 cataloged vs 74 on disk, `installed.json` missing) needs full reconciliation.
- `weekly-cash-flow-projection` cron stalled 3+ weeks.
- Rita Conger #7736 — visit notes outstanding from Spencer.
- Route Ready ads keep-or-cut decision needs a full week of CPC/conversion data (due ~7/33 area, i.e. early next week).
- Placeholder tech names ("Alias Franks"/"Robert Norton") still generate 38 rows/day of drift-check noise.

### Freshness Check
- All 12 `brand_context/*.md` files (voice-profile, positioning, icp, assets, samples, design-system, target-keywords, authority-strategy, mole-knowledge-base, technician-field-guide ×2, brand guidelines) last modified **2026-07-04** — 25 days old. Not yet past the 30-day flag, but will cross it within the next week if untouched.
