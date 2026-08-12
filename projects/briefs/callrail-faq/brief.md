---
project: callrail-faq
status: active
level: 2
created: 2026-07-20
---

# CallRail FAQ Mining — Training Doc for Muhammad

## Goal
Download a full year of CallRail call transcripts (calls > 90 seconds), mine them for
the most common customer questions and call scenarios, and compile a training FAQ doc
for new hire Muhammad so he has "all the scenarios worked out."

## Deliverables
- `data/calls.jsonl` — one year of call records + transcripts (2025-07-20 → 2026-07-20, >90s only)
- `data/fetch-summary.json` — download stats
- `{YYYY-MM-DD}_muhammad-faq-training.md` — ranked FAQ/scenario doc with real caller phrasings

## Acceptance criteria
- Every eligible call fetched (or accounted for in the summary)
- FAQs ranked by actual frequency, each with example quotes from real calls
- Scenario coverage beyond FAQs: upset customers, retreatment/callback requests,
  out-of-area callers, pricing objections, scheduling flows

## Phase 2 — daily call grading (added 2026-08-11)

Muhammad went live on the phones around 2026-08-07. Grading moved from role-play to real
calls and is now a scheduled job.

- `GRADING-RUBRIC.md` — **pinned** 100-point rubric, hard gates, and the letter scale for
  service calls. Version it, don't rewrite it: comparable scores are the whole point.
- `scripts/fetch-day-calls.mjs` — assembles one day of evidence (CallRail calls + transcripts,
  who answered, the service-day sheet's answer per zip, that day's Jobber quotes, duplicate
  detection) into `call-grading/_briefings/{date}.md`. Read-only.
- `cron/jobs/muhammad-call-grading.md` — weekdays 18:30 PT, Opus. Grades, cross-checks Jobber
  quote follow-through, writes the report, appends the tallies and the log entry.
- `call-grading/{date}.md` — the daily report. `call-grading/_tallies.json` — running counters
  (append only). `roleplay-log.md` — the running narrative, role-play and live in one thread.

## Constraints & notes
- CallRail account: `ACC019dc0126ade7956850fbd40239646af` (got moles), key `CALLRAIL_API_KEY` in `.env`
- Conversation Intelligence transcripts available via API (`fields=transcription` on the call show endpoint)
- Rate limit ~120 req/min — fetch script throttles at 550ms and is resumable (skips saved IDs)
- Transcript data contains customer names/numbers — stays in this project folder, do not publish
