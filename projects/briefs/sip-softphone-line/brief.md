---
project: sip-softphone-line
status: active
level: 2
created: 2026-08-13
---

# SIP Softphone Line — Muhammad live on calls

## Goal

Get Muhammad answering Got Moles calls from his MacBook in India, on a bare SIP line,
without the premature-answer bug that made Quo unusable.

## Why a bare SIP line (settled 2026-08-12)

Quo was terminated on 08-11 and was unusable anyway: it **accepted the call session before a
human picked up**, which CallRail reads as "call answered." CallRail then exits its flow, so its
Dial timeout never fires and Voice Assist never runs. There is no setting that fixes it —
screening ON means Voice Assist answers but no human can accept; screening OFF means a human can
answer but Voice Assist never fires.

A plain SIP softphone does not answer until a human taps answer, and passes RFC 2833 DTMF.
CallRail's Dial step takes a SIP address natively (`user@sip.telnyx.com`), which leaves CallRail
as the only routing engine in the path.

## Verified account state (2026-08-13, read live from the Telnyx portal)

| Check | State |
|-------|-------|
| Account level | **PRETRIAL** — not verified, not upgraded |
| Phone numbers | **0** (My Numbers empty, no filters applied) |
| Number orders | **0** — "This feature is not permitted at this account level" |
| Voice application / SIP connection | **none** — dashboard still offers "Create application" |
| Account email | `spencer@got-moles.com` — correct account, wrong level |
| Profile completeness | Company name, contact phone, service address **all blank** |

Spencer believed he had upgraded on 08-12. He had not — on the account-levels page only "Email is
verified" is checked, and the upgrade page still shows the first-step identity-connect prompt
rather than a pending-review state. The Zoiper Pro license was the purchase that went through.
**The target level is `Paid`, not `Trial`** — Trial cannot buy numbers or run production voice.

**Both reported faults have this one cause.** The number reads "not in service" because no number
was ever provisioned on this account. The Zoiper `403 Forbidden R18` on REGISTER is the same gate —
a pretrial account cannot register a SIP endpoint. Nothing was misconfigured; the account was
never opened far enough to configure.

## Scope decision — no DID for now

The Telnyx DID is **not on the critical path**. CallRail dials a SIP URI, which addresses the SIP
credential directly, not a phone number. Buying a DID matters only if Muhammad needs to be
reachable at a real number or needs outbound caller ID from Zoiper.

Deliberately skipped, because a fresh DID dialing a high volume of unique US numbers from an
offshore agent is the exact fraud pattern that got the Quo account terminated on 08-11. Outbound
callbacks stay in CallRail's dialer, where they are tracked and recorded.

## Deliverables

- `2026-08-13_muhammad-zoiper-setup.md` — Telnyx-side build + Muhammad's Mac config + test ladder
- Telnyx account upgraded and a Credentials SIP connection live
- One CallRail tracker (Facebook) cut over to the SIP URI as the pilot

## Acceptance criteria

1. Zoiper on Muhammad's Mac shows **Registered**.
2. A call to the Facebook tracker rings Zoiper and does **not** register as answered in CallRail
   until Muhammad taps answer.
3. With screening ON, pressing `1` accepts the call (proves RFC 2833 DTMF).
4. On no-answer, **Voice Assist still fires** — this is the whole point of the migration.

## Constraints

- Muhammad is in India, ~12.5 h ahead of Pacific. CallRail business hours are 9–5 PT.
- Telnyx upgrade needs a LinkedIn or GitHub connect for identity verification — Spencer's hands only.
- Telnyx business verification should be completed with EIN + website, use case stated plainly
  (flagged 08-12 as fraud-scoring mitigation).
- No VPN on Muhammad's machine — adds fraud-engine risk with no benefit.

## Dependencies

- **Blocking:** Telnyx account upgrade out of pretrial.
- **Parallel, not blocking:** Muhammad still cannot dial out from CallRail. Was `Reporting`
  (view-only), changed to `Manager` — did not fix it. Next step is per-company access on his user
  record. **This needs a screenshot of his screen** — it was diagnosed blind all of 08-12, which is
  what made it take hours.

## Open threads carried in

- **LIVE STATE IS NOT A RESTING CONFIG: CallRail screening is ON**, so Voice Assist answers but no
  human can accept a call. Do not leave this over a working day.
