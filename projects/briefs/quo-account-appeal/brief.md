---
project: quo-account-appeal
status: active
level: 2
created: 2026-08-11
---

# Quo account termination — appeal and phone-system recovery

## What happened

2026-08-11, ~10:18 PT: Quo (formerly OpenPhone, [rebranded Sept 2025](https://www.quo.com/blog/next-chapter/))
restricted the Got Moles workspace and cancelled the subscription. The compliance notice went to
**muhammad.j1461@gmail.com**, not to the account owner.

Stated reason: *"activity that may be inconsistent with our Fair Use Policy, specifically relating
to communications without sufficient recipient consent."*

**The unstated reason is in the email's own tracking parameters:**

```
utm_campaign = Compliance+and+fraud+warnings
utm_content  = Suspected+Cold+Calling+Email
```

An automated fraud model classified the account as a cold-calling operation. No human reviewed it
before termination.

## Root cause (established from data, not guessed)

The fraud model was reacting to a real, measurable pattern — Got Moles' own lead feed was
poisoned:

| Signal | Measured value |
|---|---|
| Age of outbound number (253) 683-7555 | 8 days (issued 2026-08-03) |
| Seats / location | 1 seat, signing in from Pakistan |
| Inbound calls in window (Aug 3–11) | 129 — but on **CallRail** numbers Quo cannot see |
| Missed inbound calls (the assumed callback pool) | **4** |
| New Jobber leads in window (the real callback pool) | **75** |
| — outside Washington State area codes | **20** (incl. 1 international, +880 Bangladesh) |
| — with no inbound call record at all | **23** |
| A2P/10DLC registration | none (Quo emailed about it Aug 10) |
| Free Caller Registry / CNAM | none |

The `lead-alerts` cron emails Muhammad every new Jobber client with *"call back while they are
still shopping."* The got-moles.com service-request form has been taking bot/spam submissions, and
nothing filtered them. So a brand-new Washington VoIP number, driven from Pakistan, was dialling
out-of-state and international numbers that never answered. That is indistinguishable from a
boiler room.

Note: Spencer's initial reply to Quo — *"the only people we have called are calls that we missed"* —
is **not supported by the data** (4 missed calls vs. ~75 callbacks). The appeal corrects this
rather than repeating it.

## Deliverables

- `consent-evidence.md` — the consent record. 737 inbound calls from 506 households since Jun 1;
  full inbound ledger for the Quo window with CallRail call IDs; verbatim transcript openings.
  **Strongest artifact:** CallRail's receptionist asks each caller *"Could I have the best phone
  number for our team to reach you?"* and they agree — recorded verbal consent, pre-dating any
  outbound call.
- `callback-pool-audit.md` — the spam-lead finding, every affected record, and remediation.
  Supplied to Quo voluntarily.
- `appeal-email.md` — the reinstatement email, sent from Spencer as account owner.
- `scripts/build-consent-evidence.mjs` — regenerates the evidence pack from CallRail. Read-only.
- `scripts/audit-callback-pool.mjs` — regenerates the lead audit from Jobber + CallRail. Read-only.
- `scripts/probe-lead-sources.mjs` — one-off diagnostic that located the real callback source.

## Acceptance criteria

- [x] Root cause established from data rather than assumed
- [x] Consent evidence generated and verifiable (every CallRail ID resolvable with audio)
- [x] Appeal drafted from the account owner, with the ID-verification trap flagged
- [ ] Lead-alert area-code filter shipped — **blocks the appeal being truthful**
- [ ] Replacement phone provider live so Muhammad can work
- [ ] EIN supplied and appeal sent

## Open threads / decisions for Spencer

1. **EIN needed** to complete the appeal email.
2. **Replacement provider** — recommended: JustCall (built for offshore/BPO agents), CloudTalk or
   Aircall, or Zoom Phone if Got Moles already holds a Zoom account. Avoid self-serve PLG apps
   (Grasshopper, Google Voice, Dialpad low tier) — same automated fraud scoring, same outcome.
   **Speak to a human in sales first and disclose the Pakistan seat in writing.**
3. **Do not sign up for OpenPhone** — same company, same fraud engine, and a new account is ban
   evasion that ends the appeal.
4. **(253) 683-7555 is not worth porting** — 8 days old, on zero marketing, not the (253) 750-0211
   office line or a CallRail tracking number. Let it go.
5. **Amex ending 811008** showed a returned-payment notice on Aug 11. Confirm the card is good
   before signing up anywhere new — a decline at signup is another fraud signal.

## Constraints

- CallRail account `ACC019dc0126ade7956850fbd40239646af`, key `CALLRAIL_API_KEY` in `.env`
- All scripts here are read-only. Nothing in this project mutates Jobber, CallRail or routes.
- Sam at Quo confirmed in writing on 2026-08-03 (ticket 1136228) that Pakistan is supported —
  keep that email, it is cited in the appeal.
