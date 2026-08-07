## Week of 2026-08-03 — 2026-08-06

### Sessions
- 2026-08-03: Address-first day lookup for Muhammad (Jobber + OptimoRoute joined) — shipped as a live claude.ai artifact; found the intraday-drift gap (routing only covers days already planned) and got the horizon-extend fix approved and built.
- 2026-08-04 *(folded into 08-03/08-05 logs)*: Horizon raised 12→19 days with a plan-slot guard; drift-check cadence hourly; address lookup published live; CallRail flow-builder found unautomatable (Angular form silently discards scripted saves).
- 2026-08-05 (S1): Routing redesign — Jobber declared source of truth for day+tech, OptimoRoute demoted to optimizer/re-sequencer; jobber-notes-automation cadence engine rewritten and flipped to `--execute` live.
- 2026-08-05 (S2): Built Jobber training SOPs for Muhammad (client + quote) and Cory (quote → scheduled job); fixed two inverted discount signs live in Jobber (Military/First Responder were +$50, now -$50).
- 2026-08-06 (S1): TMCP conversion project — built segmentation, reactive-vs-proactive pitch, and a 357-target ranked list from repeat Quick Fix customers.
- 2026-08-06 (S2): Muhammad's softphone stack (CallRail + Quo) wired and tested on an isolated tracker; human-first with AI fallback.
- 2026-08-06 (S3): Graded Muhammad's 7 role-play calls (63→75, two passes), shipped the coaching system, cleared him for live calls 2026-08-07.

### Deliverables
- `projects/briefs/technician-route-automation/build-address-day-lookup.mjs`, `.../address-day-lookup.html` — office day-lookup tool (live artifact)
- `cron/jobs/route-horizon-extend.md`, `.../extend-horizon.mjs` — keeps OptimoRoute planned 19 days out
- `projects/briefs/technician-route-automation/jobber-to-optimo-sync.mjs` — Jobber-is-truth sync (the keeper, supersedes grid-tech-realign.mjs)
- `projects/briefs/technician-route-automation/2026-08-04_routing-redesign-plan.md` — full diagnosis + proposed model
- `projects/briefs/jobber-notes-automation/decide.mjs`, `.../engine.mjs` — cadence engine, now live with `--execute`
- `projects/briefs/callrail-faq/2026-08-05_muhammad-jobber-training.md`, `.../technician-route-automation/2026-08-05_cory-scheduling-training.md` — onboarding SOPs
- `projects/briefs/tmcp-conversion/brief.md`, `.../data/target-list.csv` — 357-target TMCP conversion plan
- `projects/briefs/callrail-faq/2026-08-04_closing-language-and-call-1-debrief.md` + 4 companion docs, `roleplay-log.md` — phone coaching system
- `.claude/skills/ops-phone-roleplay/SKILL.local.md` — coach superseded by `muhammad-portable/project-instructions.md` (canonical)
- Notion: Phone Training parent page + 3 children

### Scheduled Jobs
- 238 runs this week across 23 jobs, **2 failures** (0.8%)
  - `route-horizon-extend` — FAILURE 2026-08-05 13:16 (36s)
  - `route-drift-check` — FAILURE 2026-08-06 19:02 (67s); this job's cumulative rate is 11/87 (~13%), still the noisiest job in the fleet but not diagnosed
  - `lead-alert` ran most often (111 runs, 0 failures this week)
  - `weekly-cash-flow-projection` still shows a standing failure from 2026-07-07 (last run 1/1 failed) — appears dormant/broken, not retried since

### Learnings Added
Heavy week — 4 commits + uncommitted changes added ~150 lines to `context/learnings.md`, spanning:
- **Jobber GraphQL gotchas**: `totalCount` on tag-filtered queries is stale, `ICalendarRule` write needs `RRULE:` prefix, no invoice void mutation, cursor pagination without explicit `sort` silently duplicates/drops rows, message bodies are scope-gated behind the API.
- **Classification traps**: TMCP must be identified by line item (not job duration/type) — legacy `Annual Mole Control Service` jobs misclassified 213 clients; date-scope any conformance audit to when a rule took effect or the number is fiction.
- **OptimoRoute behavior**: balances across drivers, never across days (needs day pinned manually); driver availability is per-date not standing and silently vanishes; balance on minutes not stop-count or rural techs absorb the difference.
- **CallRail/Quo**: flow builder's Angular form silently discards scripted saves; two routing engines in series can swallow calls if their answer-timers race; verify vendor diagnoses before accepting a dead end.
- **Coaching design**: grade trainees against their own trajectory not the expert benchmark; pass ceilings (not hard gates) for behavior-building; misses often mean a fact is filed wrong, not under-drilled.

### Open Threads
- **Cron runtime was stopped as of 2026-07-31** per the 08-03 log — confirm it's still running; the whole week's automation depends on it.
- `extend-horizon.mjs live` and related permission-classifier blocks — recurring friction, worth a permanent fix.
- Next week (Aug 10-14) still needs re-sync via `jobber-to-optimo-sync.mjs` under the new Jobber-truth model; 240 pre-decision Jobber tech writes need reconciling.
- 16-visit Aug 3-4 catch-up backlog never got its `--execute` approval (5 customers 7-36 days overdue on a catch).
- TMCP Phase 1 texts not drafted (T1 customers' final visits start landing 2026-08-11).
- Muhammad live 2026-08-07 — working-hours mismatch (9-5 PT = 9pm-5am PKT) still blocks production cutover; his Jobber tech contact record is blank.
- `route-drift-check` failure rate (~13% lifetime) still undiagnosed.
- `weekly-cash-flow-projection` cron looks dead since 2026-07-07 — worth checking if it's still needed.

### Freshness Check
- **All 12 `brand_context/` files are stale** — every one last touched 2026-07-04 (33 days ago): `assets.md`, `authority-strategy.md`, `design-system.md`, `icp.md`, `mole-knowledge-base.md`, `positioning.md`, `rebrand/GOT_MOLES_BRAND_GUIDELINES.md`, `samples.md`, `target-keywords.md`, `technician-field-guide-FULL-VERBATIM.md`, `technician-field-guide-INTERNAL.md`, `voice-profile.md`. None have moved despite a heavy week of Jobber/CallRail/pricing work — worth a pass if any of that should be captured as durable brand context (e.g. the TMCP positioning language, the corrected discount pricing).
