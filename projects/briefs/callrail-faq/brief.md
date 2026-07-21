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

## Constraints & notes
- CallRail account: `ACC019dc0126ade7956850fbd40239646af` (got moles), key `CALLRAIL_API_KEY` in `.env`
- Conversation Intelligence transcripts available via API (`fields=transcription` on the call show endpoint)
- Rate limit ~120 req/min — fetch script throttles at 550ms and is resumable (skips saved IDs)
- Transcript data contains customer names/numbers — stays in this project folder, do not publish
