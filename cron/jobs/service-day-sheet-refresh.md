---
name: Service Day Sheet Refresh
time: '06:45'
days: daily
active: 'true'
model: opus
notify: on_finish
description: 'Every morning before the phones open: rebuild the office address-day lookup from live Jobber + OptimoRoute and the zip sheet from the territory grid, then report any zip whose route day moved and any booked visit no truck is going to. Keeps whoever is answering calls from quoting a day or a date that is not real.'
timeout: 15m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Read CLAUDE.md for system context. Background:
`projects/briefs/callrail-faq/2026-08-03_service-day-scripts.md` (what the office says on the phone)
and `projects/briefs/technician-route-automation/brief.md` (where the days come from).

The office answers "what day will you be here?" and "when are you next coming?" off two generated
files. Both go stale on their own: the territory grid behind the zip sheet has been re-cut three
times in two weeks, and the address lookup carries real scheduled dates that move daily. A stale
copy means a customer is told a day no truck is running, or a date nobody is coming.

Run both from the repo root, in this order.

1. `node projects/briefs/technician-route-automation/build-address-day-lookup.mjs --grid=territory-grid-v5.json`

   The primary office tool. Pulls every property and the next 90 days of visits from Jobber, the
   planned routes from OptimoRoute, and joins them to the grid. Takes 3-5 minutes — mostly Jobber
   pagination. Writes `address-day-lookup.html` into both `service-day-lookup/` and
   `muhammad-portable/`, plus `address-day-lookup.artifact.html` for the hosted copy. Read-only
   against Jobber and OptimoRoute.

   **Verify it actually wrote before going on.** On 2026-08-04 this job reported success in 106
   seconds having never rebuilt the file — the builder alone takes 3-5 minutes, so a fast "success"
   is the tell. Check that `projects/briefs/callrail-faq/service-day-lookup/address-day-lookup.html`
   has today's date on it. If it does not, this job has FAILED — say so plainly and do not report
   success. A stale lookup that everyone believes is current is worse than an obvious outage,
   because the office keeps quoting dates off it.

1b. Republish the hosted copy so the live page matches the file:

   Call the Artifact tool with
   `file_path` = `projects/briefs/callrail-faq/service-day-lookup/address-day-lookup.artifact.html`
   and `url` = `https://claude.ai/code/artifact/20e073bc-db4d-4f9c-b49e-9adc55725fba`.

   **The `url` is mandatory.** This job runs as its own conversation, and without it every run mints
   a NEW url — the office would keep using the original link while fresh data went to a page nobody
   opens. Keep `favicon` as 🗓️ and the title unchanged; a changed favicon reads as a different page.
   If publishing is refused for permissions, say so — the local files are still correct, but the
   hosted page is then a day stale and whoever uses the link needs telling.

2. `node projects/briefs/technician-route-automation/make-service-day-sheet.mjs --grid=territory-grid-v5.json`

   The zip-only sheet and its printable markdown. Grid-only, no API calls, instant.

3. Summarize, in this order. Lead with whatever needs a human today.

   - **Zips that changed route day** (from step 2): list each one loudly — zip, cities, old day →
     new day. Say plainly that anyone quoted the old day since the last change needs a correction
     call. Never bury this.
   - **Unrouted visits** (from step 1, "Unrouted"): visits booked in Jobber for a day OptimoRoute
     has already planned, that are not on any route. Nobody is driving to these. Give the count and
     say it needs Spencer's eyes today.
   - **Off-day visits** (from step 1, "Off-day"): booked outside their zip's route day. This is a
     standing number in the hundreds, so report the count and the direction of travel versus
     yesterday, not a list. Only escalate if it jumps.
   - **Zips added or dropped from the grid** (step 2): a dropped zip means the office now gets
     "not in our route grid" for an address we may still serve.
   - **Duplicates** (step 1): addresses holding more than one Jobber property record. Merged in the
     lookup, still duplicated in Jobber — this feeds the `jobber-duplicate-cleanup` brief.
   - Otherwise one line: counts for addresses, zips, and the date routes are planned through.

4. If either script errors, quote the error and stop. Do not fall back to a different grid file on
   your own — picking the wrong grid is the failure this job exists to prevent. If step 1 fails but
   step 2 succeeds, say so explicitly: the office still has the zip sheet but no real dates, and
   yesterday's address lookup is on disk and will be silently one day stale.

Rules:
- `--grid` is pinned deliberately. As of 2026-08-03 the live four-way grid is
  `territory-grid-v5.json`; `territory-grid.json` is still the stale v4 three-truck map and
  `territory-grid-v6.json` is an abandoned intermediate. If Spencer promotes v5 to
  `territory-grid.json`, this job's `--grid` flags must be updated in the same change.
- Never edit the grid, and never run any other script in that folder. Everything in
  `technician-route-automation/` other than these two builders writes to live routes.
- Both outputs are gitignored on purpose — they are rebuilt daily and carry ~4k customer
  addresses. Do not commit them, and do not "fix" the gitignore.
- Keep the summary short. Anything a human must act on today goes first.
