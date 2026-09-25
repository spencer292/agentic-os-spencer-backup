---
name: Service Day Sheet Refresh
time: '06:45'
days: daily
active: 'true'
model: opus
notify: on_finish
description: 'Every morning before the phones open: rebuild the two pages the office answers calls from — the zip route-day sheet and the address lookup — from live Jobber visit history, then report any zip whose route day moved and any booked visit no truck is going to. REBUILT 2026-08-21 (route-engine spec v2 defect D1): both builders were pinned to territory-grid-v5.json, a four-tech map frozen 2026-08-01 that still lists Cammeron Anderson (left 08-07) and has no truck for Robert Norton, so the office quoted service days off a dead map every morning. The grid is now DERIVED from what the trucks actually did and is rebuilt in step 1 each run. Keeps whoever is answering calls from quoting a day or a date that is not real.'
timeout: 20m
retry: '1'
---
You are running as a scheduled job for Agentic OS.

Read CLAUDE.md for system context. Background:
`projects/briefs/callrail-faq/2026-08-03_service-day-scripts.md` (what the office says on the phone),
`projects/briefs/route-engine/2026-08-15_route-engine-spec-v2.md` (defect D1, why this job changed).

The office answers "what day will you be here?" and "when are you next coming?" off two generated
pages. Both go stale on their own, and until 2026-08-21 both were also generated from a hand-kept
territory grid that had been re-cut six times in three weeks and was last correct on 08-01. Scored
against real visits that grid was 90% and `territories.json` v8 was 73% — so neither map is the
answer. **The trucks are the answer.** Step 1 rebuilds the route-day grid from real Jobber visit
history and everything downstream reads that.

Run all steps from the repo root, in this order. Step 1 must complete before step 2 — it produces
the grid step 2 consumes.

1. `node projects/briefs/callrail-faq/service-day-lookup/build-zip-day-lookup.mjs`

   Pulls visits from Jobber, derives each zip's real route day(s), drops any tech with no visit in
   the last 10 days (a departed tech's history drags the day answer as well as the name), and writes:
   - `zip-day-lookup.html` — the zip sheet, into `service-day-lookup/` and `muhammad-portable/`
   - `service-day-grid.json` — the derived grid step 2 reads
   - `zip-day-lookup.json` — the underlying data

   Read-only against Jobber. Takes 3-6 minutes, mostly pagination.

   **The cut floor is the important part.** The script reads the latest `handovers[].effective` date
   out of `territories.json` and refuses to count anything before it — currently **2026-08-17**, the
   five-technician re-cut. This is not tuning: a rolling window straddling a re-cut is mostly
   evidence about a board that no longer exists. Measured 2026-08-21, a 4-week window disagreed with
   the post-cut board on **51 of 117 zips**, showing Tavis on 9 zips instead of 20 and Cory on 19
   instead of 7. The floor moves by itself at the next re-cut. Never pass `--since` to widen it back
   past a handover.

   Because of the floor, `--weeks-back` is a ceiling, not a promise — asking for 8 weeks on
   2026-08-21 still starts at 08-17. Expect confidence to read low for the first couple of weeks
   after any re-cut and to firm up as post-cut history accumulates. That is honest, not broken.

   **Report the roster line if it appears.** The script prints `Roster: dropping N tech(s) with no
   visits in the last 10 days` on stderr. If someone is dropped who has NOT left, that is worth
   surfacing — it means they have no visits on the board and their ground is being credited to
   somebody else.

   **Report any new name.** If a technician appears who is not in the `territories.json` roster, say
   so plainly rather than letting it through. On 2026-08-21 a "Courtney" surfaced holding 8 booked
   visits in Puyallup (98363, 98373) and zero completed work — either a new hire or a
   mis-assignment, and not something this job should decide.

2. `node projects/briefs/technician-route-automation/build-address-day-lookup.mjs --grid=../callrail-faq/service-day-lookup/service-day-grid.json`

   The primary office tool. Pulls every property and the next 90 days of visits from Jobber, the
   planned routes from OptimoRoute, and joins them to the grid from step 1. Takes 3-5 minutes.
   Writes `address-day-lookup.html` into both `service-day-lookup/` and `muhammad-portable/`, plus
   `address-day-lookup.artifact.html` for the hosted copy. Read-only against Jobber and OptimoRoute.

   **`--grid` is no longer a pinned filename and must never be pointed back at a
   `territory-grid-v*.json`.** Those are frozen hand-cut maps; passing one is exactly defect D1.
   If `service-day-grid.json` is missing, step 1 failed — say so and stop. Do NOT fall back to a
   grid file: picking the wrong grid is the failure this job exists to prevent.

   **Verify it actually wrote before going on.** On 2026-08-04 this job reported success in 106
   seconds having never rebuilt the file — the builder alone takes 3-5 minutes, so a fast "success"
   is the tell. Check that `projects/briefs/callrail-faq/service-day-lookup/address-day-lookup.html`
   has today's date on it. If it does not, this job has FAILED — say so plainly and do not report
   success. A stale lookup everyone believes is current is worse than an obvious outage, because the
   office keeps quoting dates off it.

3. Republish both hosted copies so the live pages match the files. Keep each `url` and favicon
   exactly as given — this job runs as its own conversation, and without the `url` every run mints a
   NEW link while the office keeps opening the original.

   a. Artifact tool with `file_path` =
      `projects/briefs/callrail-faq/service-day-lookup/address-day-lookup.artifact.html`,
      `url` = `https://claude.ai/code/artifact/20e073bc-db4d-4f9c-b49e-9adc55725fba`, favicon 🗓️.

   b. Artifact tool with `file_path` =
      `projects/briefs/callrail-faq/service-day-lookup/zip-day-lookup.artifact.html`,
      `url` = `https://claude.ai/code/artifact/591eb026-6906-4549-a326-f5d08fbcddf1`, favicon 📍.

      Publish the `.artifact.html`, never the plain `.html` — the latter carries its own doctype for
      offline use and would nest a second document inside the hosted skeleton.

      That URL previously served the grid-derived sheet from `make-service-day-sheet.mjs`. It now
      serves the real-visits page so the office's existing bookmark shows correct data. Do not mint
      a new link for it.

   If publishing is refused for permissions, say so — the local files are still correct, but the
   hosted pages are then a day stale and whoever uses the link needs telling.

4. Summarize, in this order. Lead with whatever needs a human today.

   - **Zips whose route day moved** since yesterday's `zip-day-lookup.json`: list each one loudly —
     zip, cities, old day → new day. Anyone quoted the old day since the last change needs a
     correction call. Never bury this.
   - **Departed techs dropped** (step 1), if any, and whether that looks right.
   - **Unrouted visits** (step 2, "Unrouted"): visits booked in Jobber for a day OptimoRoute has
     already planned, that are on no route. Nobody is driving to these. Give the count and say it
     needs Spencer's eyes today.
   - **Off-day visits** (step 2, "Off-day"): booked outside their zip's route day. A standing number
     in the hundreds — report the count and the direction versus yesterday, not a list. Escalate
     only if it jumps.
   - **Provisional zips** (step 1): zips with NO completed visit since the re-cut, answered from
     what is booked ahead. Report the count. If it is not falling week over week, those zips are
     booked but never actually served — that is a routing problem, not a lookup problem.
   - **Low-confidence zips** (step 1): zips resolved from fewer than 4 real visits. The page marks
     these; the office should confirm rather than promise.
   - **Any technician not in the `territories.json` roster**, by name, with their zips.
   - **Duplicates** (step 2): addresses holding more than one Jobber property record. Merged in the
     lookup, still duplicated in Jobber — feeds the `jobber-duplicate-cleanup` brief.
   - Otherwise one line: counts for addresses, zips, and the date routes are planned through.

5. If either builder errors, quote the error and stop. If step 1 fails, do NOT run step 2 against a
   stale `service-day-grid.json` — say plainly that the grid could not be rebuilt and that both
   pages are now a day stale. If step 2 fails but step 1 succeeded, say so explicitly: the office
   still has the zip sheet but no real dates, and yesterday's address lookup is on disk and will be
   silently one day old.

Rules:
- Never hand-edit `service-day-grid.json` — it is generated, and an edit is overwritten next run.
- `make-service-day-sheet.mjs` is retired from this job as of 2026-08-21. It reads the frozen grid
  and is kept only for historical comparison. Do not add it back.
- Never run any other script in `technician-route-automation/` from this job. Everything else in
  that folder can write to live routes — and since 2026-08-21 will be refused by the route-engine
  write gate if it tries, which would show up here as a confusing failure.
- Both outputs are gitignored on purpose — rebuilt daily and carrying ~4k customer addresses. Do not
  commit them, and do not "fix" the gitignore.
- Keep the summary short. Anything a human must act on today goes first.
