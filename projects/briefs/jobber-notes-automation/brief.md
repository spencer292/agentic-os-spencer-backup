---
project: jobber-notes-automation
status: active
level: 2
created: 2026-07-06
---

# Jobber Notes Automation

Turn the technician's Jobber **visit note** into the single source of truth, so the team
stops re-entering the same information into a checklist and manually managing follow-up
visits.

## The problem (today)

For every visit, a technician enters the same information up to three times:
1. **Visit note** (Jobber) — fast field shorthand. This is the one thing we keep.
2. **Checklist** — re-keyed from the note so a **report** shows job status in one place.
3. **Visit scheduling** — on-site, they look ahead and either pull the next monthly visit
   earlier or add a follow-up, so follow-ups happen without doubling up.

Steps 2 and 3 are re-entry of data already sitting in the note.

## Goal

On each completed visit, read the note and automatically:
- **Update the status report** (retire the checklist) — one filterable place showing every
  job's latest activity, catch/miss counts, trap inventory, next action.
- **Manage the follow-up visit** per the scheduling rules below (retire the manual look-ahead).
- **Raise a Task** for anything that isn't a scheduling action (e.g. "Convert to annual") or
  that the parser isn't confident about.

## The note shorthand (decoded, source-verified against 442 real notes)

Notes are newline-delimited; each line is roughly one field.

- **Catch:** `No mole` / `1 mole` / `2 caught` → moles caught (number)
- **Miss:** `No miss` / `1 miss u` / `2 miss t` → misses; `u` = under, `t` = tripped
- **Activity:** `NA`/`LA`/`MA`/`HA` (and `N/a` etc.) → None / Low / Moderate / High
- **Actions:** `Pulled` / `Added` / `Moved` / `Shifted` / `Swapped` / `Set`
- **Placement:** `foh`/`boh`/`loh`/`roh` = front/back/left/right of house; also `garden`,
  `shop`, `shed`, `bed`
- **Trap types:** `v` / `victor` / `VOOS` = **Victor** (all the same); `TL` / `trapline` =
  **Trapline**. `Gopher Hawk` = legacy/expired (old notes only).
- **Next action:** `Add visit` / `2 weeks` / `Monthly` / `Return visit scheduled` /
  `Convert to annual`
- **Customer:** `showed customer` / `told customer`
- **onX:** property + all trap locations are mapped in the onX app

## Visit scheduling rules (CANONICAL — corrected 2026-07-06)

Every TMCP job is pre-scheduled with a monthly visit for ~10 years. A follow-up interval is
derived from the note's next-action:

- `Add visit` → **+7 days** from the completed visit
- `2 weeks` → **+14 days**
- `Monthly` / `Return visit scheduled` / (none) → **no scheduling change**
- `Convert to annual` → **Task**, not a scheduling action

Then look at the **next scheduled visit** and decide by its **calendar month** relative to
the completed visit:

| Next scheduled visit is in… | Action | Mutation |
|---|---|---|
| **Same calendar month** (complete Jul 6, next Jul 27) | **Pull it earlier** to the target date | `visitEditSchedule` |
| **A later calendar month** (complete Jul 6, next Aug 10) | **Leave it, ADD** a new visit at target | `visitCreate` |

Hard rules:
- **Never** pull a future-month visit back into the current month — that strands the monthly
  cadence and creates a gap. (This was the 2026-07-06 Annette Wood error; corrected.)
- **Only ever pull earlier**, never push later.
- Move/leave **only the single next visit** — the rest of the 10-year series stays put.
- **Idempotent:** if an upcoming visit already exists within ±3 days of the target, do
  nothing (already handled — safe to re-run).
- Keep the same assigned technician; new visits inherit the tech from the next scheduled visit.

## Scope additions (2026-07-10, from Spencer)

The checklist database was doing THREE jobs, and all three must survive its retirement:
1. **Status report** → covered: Jobber Job Custom Fields (live).
2. **Reporting/trends** (checklist rows → database → reports) → planned: append one
   database row per parsed visit (Notion DB or similar) alongside the custom-field write.
3. **Week-ahead schedule verification** → `audit-schedule.mjs` (new): expected-vs-actual
   check that catches (a) follow-ups implied by a note but missing from the schedule,
   (b) recently visited jobs with no upcoming visit (stranded cadence), and (c) **double
   visits** — same-day pairs = definite dupes, pairs ≤10 days apart = probable (correct
   state never has two visits that close, per the pull-don't-add rule). REPORT ONLY —
   removing a duplicate stays a human decision.

Also flagged by Spencer: misspelled/nonconforming notes currently fail silently (field
skipped). Fix = exceptions lane — unparseable notes go to a daily review list instead of
being dropped. Not yet built. A structured Job Form input was considered as an alternative
to note parsing; parked pending (a) exception-rate evidence and (b) whether Jobber's API
can read job form submissions at all.

## Deliverables

- `parse-note.mjs` — pure parser: note string → structured record. ✅ built
- `decide.mjs` — canonical scheduling decision (pure). ✅ built
- `engine.mjs` — per-date orchestrator: pull completed visits → parse → compute visit plan →
  (with `--execute`) perform reschedules/adds. Dry-run by default; `--log` writes a dated
  review file; token-refresh retry built in. ✅ built
- `test.mjs` — 14 tests locking the rules (incl. the Annette later-month case). ✅ passing
- `report-preview.mjs` — read-only preview of the custom-field values per job. ✅ built
- `cron/jobs/jobber-visit-followups.md` — daily dry-run review cron (haiku, 18:00). ✅ built
  (runs only when the cron runtime is up: `start-crons`)
- Custom field WRITE into the engine — ⛔ blocked on Jobber scope (see Status).
- Report sync target = **Jobber custom fields** (decided 2026-07-06).

## Status (2026-07-10)

- **Read layer rebuilt (v2) — visits-first.** The original `jobs(first: N)` unfiltered pull
  was silently missing most of a day's visited jobs (07-09: found 0 of 65; 07-06: the
  "proven live" run synced 31 of what was really 85). Both `report-sync.mjs` and `engine.mjs`
  now page the day's visits (cheap), dedup to jobs, and fetch notes/fields for only those
  jobs in aliased batches of 15 — full coverage, and stays under Jobber's cost throttle.
- **Both scripts now use direct-fetch auth** (sanctioned pattern from the route-automation
  backfill script), NOT the tool-jobber CLI: Jobber returns partial "RequestNote … hidden
  due to permissions" errors alongside good data, and the CLI treats any GraphQL error as
  fatal. The scripts tolerate permission-hides and keep the JobNote data.
- **Report backfilled + current:** 07-06 re-synced (85 jobs), 07-07 (77), 07-08 (68),
  07-09 (65) all written live on 2026-07-10.
- **n8n workflow `2dxtg73X1JUvLUTr` rebuilt (v2), INACTIVE pending activation.** Now:
  daily 6pm PT trigger (the old trigger was misconfigured as hourly) → Visits p1+p2 →
  build job batches → batch reads → build writes → jobEdit writes. Uses the native
  "Jobber OAuth2" n8n credential (`NitrghZSAjZamvqp`) — the token node with the pasted
  client secret + refresh token is GONE from the workflow. Retry-on-fail + request
  spacing on all HTTP nodes. Editor: https://gotmoles.app.n8n.cloud/workflow/2dxtg73X1JUvLUTr
- **Scheduling half validated on real data:** 07-09 dry-run — 65 jobs, 33 "already
  scheduled" (engine matches techs' manual choices), 3 ADDs the techs missed, 0 PULLs,
  0 errors. Log: `runs/2026-07-09-dryrun.txt`. Still dry-run per the go-live gate.
- **Security (still pending, coordinated step):** the Jobber app client secret + refresh
  token were exposed in a 07-06 chat transcript. They are no longer embedded in any n8n
  workflow, but the credentials themselves should still be regenerated (breaks `.env` CLI
  auth + nothing else now — update `.env` in the same step).
- **Nightly status (verified 2026-07-12):** local cron `jobber-visit-followups` (18:15 PT,
  scheduling dry-run) is HEALTHY — 4 runs, 0 failures since the 07-10 stopgap fix
  (`AGENTIC_OS_CLAUDE_BIN` → native `claude.exe`, setx-persisted; see learnings
  `### ops-cron`; re-run `start-crons` after a reboot). The n8n report wf `2dxtg73X1JUvLUTr`
  is ACTIVE but **every scheduled run has FAILED** (07-10/11/12, all "Authorization failed"
  at the first Jobber node) — the native Jobber OAuth2 credential is dead, same failure the
  route session hit twice. Fix is UI-only: reconnect the credential (durable fix = the
  pending dedicated second Jobber app for n8n), ideally before Mon 07-13 18:00 PT.
  Gap already closed manually: `report-sync.mjs --date=2026-07-10 --write` → 91 jobs
  (07-11/12 = weekend, 0 visits). Report is current through 07-12.

## Status (2026-07-06 — superseded)

- **Report half: LIVE. No scope needed after all.** The custom-fields *config* scope stays
  blocked, but that turned out not to matter: field VALUES are written via `jobEdit { customFields }`
  under the existing Jobs:write scope, and each field's per-job `id` is READABLE off the job
  (only the `customFieldConfiguration` sub-object is blocked). Spencer created the 8 fields by
  hand in Job Custom Fields; `report-sync.mjs` populates them from notes. Proven live: all of
  2026-07-06's visited jobs populated.
  - Gotcha found + fixed: the `None` option in Latest Activity was created as `None ` (trailing
    space) → dropdown writes rejected until the option was cleaned. Field *names* also have
    stray trailing spaces (cosmetic; matched by trimmed label, written by id).
- **Scheduling half: done + tested + hardened.** `visitEditSchedule` (pull) and `visitCreate`
  (add) both proven live on Annette Wood. Stays **dry-run** per the go-live gate.
- **Daily cron:** `cron/jobs/jobber-visit-notes-automation` runs report-sync LIVE + scheduling
  dry-run at 18:00. Needs the cron runtime up (`start-crons`).
- **Hardening TODO:** paginate the jobs pull (currently `first: 40`) so busy days never miss a
  job; refine null-value policy (blank vs keep vs 0) for fields the note omits.
- **Go-live gate:** report = live now; scheduling = dry-run → flip engine to `--execute` once trusted.

## Proven live (2026-07-06)

- Note parsing: activity 96%, trap inventory 100%, next-action 76%, moles 74% across 442 notes.
- `visitEditSchedule` (pull) and `visitCreate` (add) both execute against the live account.
- Notion status report built from notes for 34 jobs.

## Open questions / dependencies

1. **Report target for unattended runs.** The interactive Notion (claude.ai) connector can't
   be used by a cron/n8n. Options: (a) write status into **Jobber custom fields** (fully
   API-native, unattended-safe, keeps everything in Jobber), or (b) add a **Notion
   integration token** (`NOTION_API_KEY`) to `.env` for unattended Notion writes. Decision
   needed.
2. **Custom field set** — if we go the Jobber-custom-fields route, needs a one-time create +
   sign-off on the field list.
3. **Trigger choice** — daily batch (simpler, review-friendly) vs real-time webhook.
4. **Execution gate** — auto-execute scheduling vs. daily review queue at first.

## Acceptance criteria

- Running the engine for a given date reproduces the technicians' manual scheduling choices,
  and catches follow-ups they missed, with zero double-bookings and zero cadence gaps.
- Re-running the same date is a no-op (idempotent).
- The report reflects every completed visit without anyone touching a checklist.
