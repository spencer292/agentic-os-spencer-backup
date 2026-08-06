## Week of 2026-08-03 — 2026-08-03

*First day of the week — digest runs Monday, one session logged so far.*

### Sessions
- 2026-08-03: callrail-faq / technician-route-automation — built Muhammad an address-based day-lookup tool (joins 4,427 Jobber properties + 2,612 visits + live OptimoRoute planned routes against territory-grid-v5, 3,946 addresses, offline HTML). Made OptimoRoute the authority on which day/tech a customer is routed (Jobber only fills gaps beyond the planning horizon). Merged 81 duplicate Jobber properties (91 extra records) found while testing. Added 98008 Bellevue to the grid (→126 zips, stays with Cory per live routes). Mapped the intraday-drift gap: `route-drift-check` only scans days OptimoRoute has already planned, so most new bookings are invisible to it.

### Deliverables
- `projects/briefs/technician-route-automation/build-address-day-lookup.mjs` — read-only builder for the address lookup
- `projects/briefs/callrail-faq/service-day-lookup/address-day-lookup.html` — the office tool (gitignored, 896 KB)
- `cron/jobs/service-day-sheet-refresh.md` — rewritten to build the address lookup first; model raised sonnet → opus
- `projects/briefs/callrail-faq/2026-08-03_service-day-scripts.md` — call script update (address lookup replaces manual Jobber digging)
- `projects/briefs/callrail-faq/muhammad-portable/` — README + script update + HTML copy, address-first instructions
- `projects/briefs/technician-route-automation/intraday-drift.mjs` — read-only diagnostic (found OptimoRoute has no completion signal at all)
- `projects/briefs/technician-route-automation/territory-grid-v5.json` — 98008 Bellevue added

### Scheduled Jobs
*(last 7 days, 2026-07-28 → 2026-08-03, from `cron/logs/` + `cron/status/`)*
- ~139 runs across 20 jobs, 2 failures:
  - `route-drift-check` — FAILURE Jul 29 20:08 (430s): Anthropic API 529 overloaded, exhausted 10 retries. Self-recovered on the next scheduled run.
  - `weekly-memory-gaps` — TIMEOUT Jul 30 19:32 (10,921s / ~3h): job hung. Next scheduled run (Jul 31) completed normally in 478s.
- Cumulative: `route-drift-check` now 64 runs / 10 fails (~16%) lifetime, not yet diagnosed as a pattern.
- **Cron runtime has been stopped since last heartbeat 2026-07-31** (confirmed in today's session) — every job above went dark after Jul 31 except `route-drift-check` and `callrail-jobber-sync`, which show activity into Aug 3-4; that activity lines up with today's session running drift-check manually, not the daemon.
- `weekly-cash-flow-projection` still stalled — last run 2026-07-07 (failed), 0 runs since, now 27+ days unresolved.

### Learnings Added
Heavy week (mostly Jul 28-31, carrying into today's route work) — see `context/learnings.md` for full entries:
- **technician-route-automation** (7+ entries): `weekMonday()` silently disabled the whole grid on weekend-start dates; a serial alias is a write-back hazard (would have assigned Alias's visits to Spencer in Jobber); Jobber has no job-level assignment mutation, only per-visit; driver availability must track the roster or the optimizer ignores it; `push-week` can create orders but never retires stale ones.
- **tool-jobber** (multiple entries): the n8n Jobber OAuth credential was dead for 7 nights with no alert; refresh tokens don't rotate but re-authorizing invalidates the *other* consumer's token; `requestCreate` is live (a stale code comment said otherwise); Jobber cannot merge clients; CallRail→Jobber writes a duplicate client twice per call.
- **General**: "silent failures are the actual disease on this install" — 3 found in one session, none alerting; a root-cause-before-measuring-attribution lesson (call-driven vs. form-driven duplicate clients, 80/17 split).
- New section headers added for `ops-phone-roleplay` and `technician-route-automation (route pipeline)` (content pending).

### Open Threads
- 2 live date clashes today (#7662, #7962) — customers notified off the wrong Jobber date, not yet corrected
- 14 visits routed to a different tech than Jobber's assigned field shows
- 4 new bookings (#8299-#8302) sit on no planned OptimoRoute route — nobody is driving to them
- 178 visits off their zip's route day (89 within 2 weeks); 23 assigned to Tavis Alexander, who is in the grid's `notWorking` list
- Cron runtime down since Jul 31 — needs `scripts/start-crons.ps1` restart, or the 06:45 address-lookup refresh won't fire and the tool goes stale
- Intraday-drift gap unresolved: `route-drift-check` can't see bookings past OptimoRoute's planning horizon (currently through Aug 7) — fix candidates are plan-further-ahead or teach drift-check to plan unplanned days
- `weekly-cash-flow-projection` cron stalled 27+ days
- 81-address Jobber duplicate-property cleanup found today, feeds `jobber-duplicate-cleanup`, not yet actioned

### Freshness Check
- All 12 `brand_context/*.md` files (voice-profile, positioning, icp, assets, samples, design-system, target-keywords, authority-strategy, mole-knowledge-base, technician-field-guide ×2, brand guidelines) last modified **2026-07-04** — now **30 days old**, at the flag threshold.
- Notable: `technician-field-guide-INTERNAL.md` is one of the stale files, and per a 2026-07-31 learning it still does **not** reflect the activity-code follow-up cadence rule Spencer set 2026-07-26 — that rule only reached `CLAUDE.local.md`, not the document the technicians actually read.
