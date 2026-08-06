## Week of 2026-08-03 — 2026-08-05

*(Week-to-date only — Monday through today, Wednesday. No 2026-08-01/02 sessions counted, those were last week.)*

### Sessions
- **2026-08-03**: Muhammad address-day lookup tool built (Jobber + OptimoRoute joined, 3,946 addresses) — got Muhammad answering "when are you coming?" without digging in Jobber. Also: cron daemon restarted (had been dark since 7/31), 98008 Bellevue added to territory grid, and a long thread evaluating phone systems (Quo vs JustCall vs Google Voice) for Muhammad's India-based shift.
- **2026-08-04**: Address lookup published live as a claude.ai artifact. Route-planning horizon raised 12→19 days with a new `extend-horizon.mjs`; found and guarded a design flaw where planning a new window could silently destroy an unwritten plan. drift-check cadence moved from every-2h to hourly. Two job reassignments made (#8267, #7817) after Spencer clarified the OptimoRoute-then-grid tie-break rule.
- **2026-08-05**: Full TMCP tag/billing audit — 10 missing tags applied (641 active / 19 churned), 3 billing fixes landed, a stale duplicate-invoice mystery solved (manual "FINAL BILL" colliding with an auto invoice). Found Ashley Wollam (#6986) with a live date conflict between Jobber and OptimoRoute. New scheduling rule captured: any activity level on a TMCP job now means weekly visits, `N/A` means monthly.

### Deliverables
- `projects/briefs/technician-route-automation/build-address-day-lookup.mjs` — address→day lookup builder (Jobber + OptimoRoute + grid)
- `projects/briefs/callrail-faq/service-day-lookup/address-day-lookup.html` + `muhammad-portable/` copy — office tool, published as claude.ai artifact
- `projects/briefs/technician-route-automation/extend-horizon.mjs` — new, chains set-driver-days/push-week/optimize-week over unplanned days only
- `cron/jobs/route-horizon-extend.md` — new, weekday 06:15 dry-first horizon extension
- `cron/jobs/service-day-sheet-refresh.md` — rewritten to build address lookup first, verify the rebuild actually wrote
- `projects/briefs/technician-route-automation/set-driver-days.mjs` — added `--dates=` flag
- `projects/tool-jobber/2026-08-05_tmcp-tag-audit.md` — TMCP audit + applied worklist
- `projects/briefs/technician-route-automation/territory-grid-v5.json` — 98008 Bellevue added (126 zips)
- `projects/ops-cron/skill-update-check_2026-08-04.md`, `_2026-08-05.md`
- `projects/ops-cron/learnings-health_2026-08-04.md`, `_2026-08-05.md`
- `projects/briefs/zero-touch-business/runs/digest-2026-08-04.md`, `digest-2026-08-05.md`
- `context/learnings.md` — 5 new `tool-jobber` entries (GraphQL gotchas, see Learnings section)

### Decisions
- **OptimoRoute is authority on which day a customer is visited; Jobber only fills gaps beyond the planning horizon** (Spencer, 08-03).
- **98008 Bellevue stays with Cory Ventura / Thursday** — matches what he's already driving; grid updated to match reality rather than reassigning (08-03/04).
- **Muhammad's lookup tool is a baked daily snapshot, not a live server** — Jobber creds can't live on his machine (08-03).
- **Horizon raised 12→19 days; drift-check and extend-horizon must stay numerically equal** or planned-but-unwatched days go stale silently (08-04).
- **Any activity code (L/M/H) on a TMCP job → weekly visits; `N/A` → monthly** — supersedes the prior graded ladder (08-05, logged to `CLAUDE.local.md`).
- Phone system for Muhammad: leaning Quo over JustCall/Google Voice, pending confirmation from Quo support on India support and owner-seat billing — not yet finalized.

### Scheduled Jobs
- 24 distinct jobs on the roster; cumulative run/fail counts (all-time, not week-only — no per-week counters exist):
  - Healthy/routine all week: `lead-alert` (63 runs, 0 fails, but email delivery fails every time — see below), `ninety-scorecard-push`, `jobber-arrival-window-sweep`, `ztb-content-publisher`, `jobber-visit-followups`, `nightly/daily-memory-*`, `weekly-memory-curator/gaps`.
  - **route-drift-check**: 78 runs, 10 fails (~13%) — but very active this week, slotting 3–10 new Jobber bookings into OptimoRoute per run, multiple times a day.
  - **route-horizon-extend**: 1 run, 1 failure — blocked deliberately: an already-generated Aug 10-14 plan (357 Jobber writes) was never written back, so it aborted rather than risk destroying it. Needs Spencer to resolve (write or discard-and-replan) before Aug 17+ gets a route.
  - **weekly-cash-flow-projection**: still effectively dead — only 1 run ever recorded, dated 2026-07-07, and it failed. Not touched this week.
- **Standing credential blockers, all failed every run this week, no change from prior weeks:**
  - `zernio-analytics-snapshot` — `ZERNIO_API_KEY` missing
  - `gmail-daily-triage` — `GMAIL_CLIENT_ID`/`SECRET`/`REFRESH_TOKEN` missing (this is Roy's mailbox, not Got Moles')
  - `meeting-video-archive` / `meeting-clips-lane` — Zoom OAuth creds missing, Notion Meetings DB lives in Elevate 360's workspace anyway
  - `lead-alert` — finds leads fine but email never sends, `LEAD_ALERT_SMTP_*` missing from `.env`
  - `ztb-ads-manager` / `ztb-ads-budget-guard` — `ROUTE_READY_ADS_REFRESH_TOKEN` expired since 2026-07-30, 5th consecutive blocked week; GSC token also expired
- **callrail-jobber-sync**: otherwise clean, but one call (Spencer Hill's internal/test number, malformed email) has failed the same `clientEdit` step on 8+ consecutive hourly runs — needs a manual fix at the CallRail source, not a code fix.

### Learnings Added
- 5 new entries under `## tool-jobber` (2026-08-05), all from the TMCP audit: tag-filtered `clients.totalCount` is stale (must paginate to count), `ICalendarRule` writes need an `RRULE:` prefix that reads omit, Jobber has no invoice void/delete mutation, always read `invoice.subject` before calling same-day invoices duplicates, and live records can move mid-run so re-read immediately before writing.

### Open Threads
- **route-horizon-extend blocked** — Aug 10-14 plan generated but unwritten; Aug 17+ has no route until Spencer decides write-vs-discard.
- **Ashley Wollam #6986** — Jobber says 8/18, OptimoRoute has Cory routed 8/11; customer already told the 18th, needs a callback decision.
- **CallRail malformed-email call** stuck retrying hourly since 08-04T23:15Z — fix in CallRail, not code.
- **4 credential gaps unresolved all week**: `ZERNIO_API_KEY`, Roy's `GMAIL_*`, `ZOOM_*`, `LEAD_ALERT_SMTP_*`.
- **Route Ready (zero-touch-business) ads/budget-guard blind for 5+ weeks** — `ROUTE_READY_ADS_REFRESH_TOKEN` + GSC token both need Spencer to re-mint interactively.
- **Mike Kaiser #5390** — dual-tagged TMCP Active + Churned, unresolved, needs Spencer call.
- **Bryan #8219** — TMCP vs. seasonal line-item naming conflict; Spencer's instructions conflicted so nothing was changed, still a false-positive risk on future audits.
- **weekly-cash-flow-projection** cron effectively dead since 7/7 — not re-diagnosed this week.
- Phone system decision for Muhammad (Quo vs. alternatives) still open pending vendor answers.

### Freshness Check
- **All 12 `brand_context/*.md` files are dated 2026-07-04 — 32 days old, over the 30-day threshold.** Includes voice-profile, positioning, icp, samples, assets, design-system, authority-strategy, target-keywords, mole-knowledge-base, technician-field-guide (both versions), and the brand guidelines PDF source. None were touched this week despite active route/ops/TMCP work — worth a refresh pass if any of that work should feed back into brand context.
