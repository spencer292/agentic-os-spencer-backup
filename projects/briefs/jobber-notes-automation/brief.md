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

## Status (2026-07-06)

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
