## Week of 2026-07-14 — 2026-07-20

_Note: this run landed on a Monday (the cron is Friday-scheduled but has been firing ad hoc). Last digest covered through 2026-07-13, so this one picks up 07-14 → 07-20 to close the gap rather than reporting just today._

### Sessions
- 2026-07-14: Route automation — Jobber OAuth restored (unblocked 2h drift-check cron); drift-check fix run for 7/15–7/17 (9 missing bookings created, 0 write failures); new `eod-reroute.mjs` pin tool built and used for Jennifer Cramer's EOD request.
- 2026-07-15: Route automation — fixed 7/16 after Spencer's manual Jobber edits; `drift-check.mjs` gained `--apply-tech-drift` and `--override-freeze` flags; 51 Jobber write-backs, 0 failed.
- 2026-07-16: Route automation — manual drift-check for 7/17 found the board already in perfect sync (109/109 stops matched, 0 writes needed).
- 2026-07-18/19: Route automation — full weekly push+optimize for week 07-20..24 (525 stops), mirrored to last week, verified, and **written back to Jobber live** (525/525). Territory ownership doctrine documented. Fixed a `visitEditAssignedUsers` payload-shape bug that had silently failed 103 tech assignments.
- 2026-07-19: Route-book launch — built a 29-target outreach dossier (authors/podcasters/influencers) for Spencer's book *The Route*; Amazon listing located.
- 2026-07-19: Zero-Touch Business — **Route Ready launched end-to-end in one day** (~70 Spencer-minutes): kit built, humanized, Gumroad product + free lead magnet published, Cloudflare zone/DNS/Worker site deployed live on routereadykits.com, logo shipped, content-publisher + weekly-digest crons activated.
- 2026-07-19: Jobber notes automation — two-week schedule cleanup: 31 duplicate visits deleted, 13 follow-up visits created, plus a form-vs-note reconciliation pass (form wins on conflict) fixing ~10 more scheduling gaps.
- 2026-07-20: Zero-Touch Business — GSC property created + verified for routereadykits.com, sitemap submitted; CallRail→Jobber sync script shipped + hourly cron live (backfilled 72h).
- 2026-07-20: CallRail FAQ project — mined 204 calls into a training doc + 15-scenario role-play pack for new hire Muhammad; built the `ops-phone-roleplay` skill; rebuilt the CallRail AI receptionist (persona, FAQ, pricing rules, intake fields) live, iterated with Spencer on a real test call.
- 2026-07-20: Jobber templates — set a 3-hour arrival window on ~570 jobs, rewrote all 6 client message templates to reference the window instead of exact ETAs, shipped a weekly safety-net sweep cron.

### Deliverables
- `projects/briefs/technician-route-automation/` — `eod-reroute.mjs`, `verify-mirror.mjs`, updated `mirror-lastweek.mjs`, `2026-07-19_week-0720-territory-map.md` + density snapshot
- `cron/jobs/route-drift-check.md`, `cron/jobs/jobber-arrival-window-sweep.md`, `cron/jobs/callrail-jobber-sync.md` — new/active crons
- `projects/tool-jobber/scripts/arrival-window-sweep.mjs` — arrival-window sweep actor
- `projects/briefs/callrail-faq/` — brief, transcript pull scripts, `data/calls.jsonl` (204 calls), training doc, role-play pack, AI-receptionist answer bank
- `.claude/skills/ops-phone-roleplay/SKILL.md` — new skill, registered in `CLAUDE.local.md`
- `projects/briefs/route-book-launch/` — brief + outreach dossier
- `projects/briefs/zero-touch-business/` — business plan, kit #1 (14 files), site (`site/build.mjs` → `site/dist/`), deliverables workbooks/docs, Gumroad + Cloudflare deploy scripts — **live at routereadykits.com**
- `projects/briefs/jobber-notes-automation/runs/` — audit + dedupe + follow-up + reconciliation reports (07-18/19)
- `context/memory/2026-07-14_gap-analysis.md`, `..._2026-07-20_gap-analysis.md` — weekly-memory-gaps cron output

### Scheduled Jobs
- Cumulative status across 17 jobs with recorded runs: **~77 total runs, 2 failures** (both historical, outside this week's window: `weekly-cash-flow-projection` on 07-07, job now deactivated; `daily-memory-distill` one transient failure, self-resolved next run). No failures logged this week.
- Most jobs are ≤2 weeks old, so lifetime totals roughly track this week's activity. `route-drift-check` (every 2h, 9am–5pm PT) ran 14 times, 0 failures.
- New this week and active: `callrail-jobber-sync` (hourly 7–18 PT), `jobber-arrival-window-sweep` (Mon 06:10), `ztb-content-publisher` + `ztb-weekly-digest` (flipped active on Route Ready launch 07-19).
- Still known-inactive/no-op: `gmail-daily-triage` and `meeting-clips-lane` report "success" but do no real work on this install (missing Gmail creds / no Notion Meetings DB token) — carried over from prior digests, unchanged.

### Learnings Added
27 new entries this week, concentrated in three sections:
- **tool-jobber** — arrival windows are job-level not visit-level; batch mutation gotchas; GraphQL read/write type mismatches; CallRail integration writes junk contact data (now repaired by the sync script).
- **tool-optimoroute** — weekly flow must be push → mirror-last-week → sequence-only optimize (never raw baseline); committed orders need explicit tech-lock; Jobber churns visits overnight so diff before write-back; `visitEditAssignedUsers` correct payload shape; 14:00 PT Sunday write-freeze cutoff.
- **tool-browser** — Jobber/CallRail settings pages need explicit Save + reload-verify; GSC/Cloudflare dashboard automation patterns; file-upload-without-picker pattern; never dry-check a mutating script by piping to `head` (it still executes).
- Plus: image edit-pass technique for garbled mockup text, inline-SVG logos over generated PNGs, ops-phone-roleplay skill notes, mole-disposal fact correction.

### Open Threads
- Route automation: WF-1/WF-2 rebuild (dynamic mirror dates, tech-locking, drift logic, churn diff folded in) still pending — target is cron-only with Spencer reviewing only.
- Customer comms: Spencer to notify several clients about promise-day/arrival-time changes from the 07-18/19 route rebuild.
- Route Ready: ads account pending Spencer (~1wk for indexing anyway); DNSSEC re-enable via Cloudflare; dup PDF on freebie listing; verify Gumroad KYC cleared; kit #2/#3 (pressure washing, lawn care) queued behind first traffic signal.
- CallRail AI receptionist: "Text messages" card still Inactive (Spencer decision), one unreviewed CallRail alert about pool-number swapping.
- Phone training: awaiting Spencer feedback on the training doc/role-play pack; Muhammad's first role-play session not yet run.
- Jobber notes automation: 3 same-month visit PULLs deferred, new jobs needed for 3 stranded customers (Chirillo/Foth/Charles), 2 created visits still unassigned pending tech.
- Carried from prior weeks (unchanged): cash-flow projection cron still waiting on a Notion credential from Spencer (14+ days stale per gap analysis); LinkedIn growth plan — Spencer hasn't updated his profile or started daily connecting (14+ days stale).

### Freshness Check
- All 12 `brand_context/` files last modified 2026-07-04 (16 days ago) — within the 30-day threshold, nothing stale yet.
