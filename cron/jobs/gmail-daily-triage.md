---
name: Gmail Daily Triage
time: '07:30'
days: daily
active: 'true'
model: opus
notify: on_finish
description: 'Reads new Gmail since the last run, files obvious junk out of the inbox, surfaces what needs Roy''s attention, and writes reply DRAFTS in his voice for clear reply-requests. Never sends, never deletes. Drafts-only, human-in-the-loop.'
timeout: 15m
retry: '1'
---
You are running as a scheduled job for Agentic OS. Read CLAUDE.md for system context.

Task: triage Roy's Gmail (`roy@atpbos.com`). File obvious junk **out of** the inbox, label what needs
him, and write reply **drafts** (never send) for messages that clearly warrant a reply. This mirrors
Fyxer's gated, drafts-only, human-in-the-loop pattern.

**Hard rules — never break these:**
- **Never send.** Replies are created as Gmail drafts only. Roy reviews and sends himself.
- **Never delete.** Junk/FYI are *archived* (removed from INBOX) — they stay in All Mail, recoverable.
- The scripts read their keys from `.env` internally. Never echo a token. Run from the repo root.
- If a step errors, stop and report — do not apply partial labels or guess.

## 1. Fetch new mail (read-only)
```
node scripts/gmail/gmail-fetch.cjs --full --out .tmp/gmail/inbox.json
```
- Lists new INBOX messages since the last run (a `.last-run.json` marker; falls back to the last 24h).
- Already-triaged messages (carrying any `Triage/*` label) are skipped automatically.
- Read `.tmp/gmail/inbox.json`. If `counts.returned` is 0, output "Inbox clear — nothing new to triage." and stop.

## 2. Classify — read every message with judgement
**FIRST, read `scripts/gmail/inbox-rules.md` in full** — it is the single source of truth (golden rules,
the three outcomes, drafting rules, classification policy, people/VIPs, per-sender exceptions). Also load
`brand_context/voice-profile.md` for drafting voice.

Then read **the actual content** of each message in `inbox.json` (subject + body, not sender/keywords alone)
and assign exactly one outcome per `inbox-rules.md` §1: `TO-RESPOND` (draft a reply), `ACTION`
(needs action, no reply → `Action` folder), or file/archive (`JUNK`/`FYI`/area). Honour every rule in
that file — especially the golden rules (never send, never delete, never assume calendar times).
Be **conservative**: when unsure whether to draft, choose `ACTION`/`NEEDS-YOU`, not `TO-RESPOND`.

Write `.tmp/gmail/decisions.json` = `[{ id, class, reason }]` for all messages.

For `TO-RESPOND` only, also write `.tmp/gmail/drafts.json` =
`[{ id, threadId, to, subject, messageIdHeader, body }]` where `to` = the message's `replyToEmail`,
`subject` = its `subject`, `messageIdHeader` = its `messageIdHeader`, and `body` = a short reply in Roy's
voice (plain British English, warm, direct, signed as Roy). The draft is a starting point — keep it tight.

## 3. Apply triage labels
```
node scripts/gmail/gmail-label.cjs --in .tmp/gmail/decisions.json
```
- JUNK/FYI are labelled and archived out of the inbox; NEEDS-YOU/TO-RESPOND are labelled and stay.
- Idempotent — safe to re-run.

## 3b. Auto-file areas (high-confidence senders only)
```
node scripts/gmail/gmail-area.cjs --auto --query "newer_than:1d"
```
- Deterministic sender→area filing from `scripts/gmail/area-rules.json` (Got-Moles, Finance, Marketing,
  Notification, Newsletters). Label-only — it does NOT archive; triage (step 3) owns inbox/archive.
- Only high-confidence automated senders match. The human buckets — `Clients/Normal`, `Clients/Urgent`,
  `Leads` (and the `Missed Response` action label) — are assigned by judgement, never by sender rules.
  e.g. `elean@/ana@zernio.on.crisp.email` (partnership) are deliberately never auto-filed.
- The area label and the Triage/* label coexist on the same message (filing vs action are separate layers).

## 4. Create drafts (only if there are TO-RESPOND items)
```
node scripts/gmail/gmail-draft.cjs --in .tmp/gmail/drafts.json
```
- Creates threaded drafts in Drafts and tags each source message `Triage/Drafted`. **Never sends.**

## 5. Report
Post one summary block:
- Counts per class (JUNK archived, FYI archived, NEEDS-YOU in inbox, TO-RESPOND drafted).
- For each NEEDS-YOU: one line — sender + subject + why it needs him.
- For each draft: sender + subject (so Roy knows which Drafts to review).
- Anything skipped or errored, named explicitly.
- End with: "Drafts are waiting in Gmail — review and send the ones you want. Nothing was sent."

Notes:
- This job is incremental: it only processes mail newer than the last successful run.
- First live runs were done attended (label-only, then drafts) before this was scheduled — keep the
  conservative bias; if classification drifts, tune `classification-rules.md`.
