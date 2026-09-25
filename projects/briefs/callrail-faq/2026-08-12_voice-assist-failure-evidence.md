# Voice Assist not answering on Dial timeout — RESOLVED, not a CallRail defect

> **RESOLUTION (2026-08-12): do not send this to CallRail support.** The cause was
> destination-side, not CallRail. Enabling **"Prevent voicemails and automated systems
> from answering a call"** (call screening) on the Dial step made Voice Assist fire
> correctly, which identified the real mechanism:
>
> With screening OFF, the destination (Quo, 253-683-7555) answers the call session
> immediately while it is still ringing its users. CallRail reads that as "call answered",
> exits the flow, and the caller hears the destination's ringback until it gives up —
> producing ~36s of ringing, `answered=true`, and no Voice Assist. The Dial timeout is
> not ignored; the flow has already exited before it can matter.
>
> With screening ON, CallRail refuses the destination's premature answer and requires a
> human keypress, so the timeout fires and Voice Assist answers as designed.
>
> **Remaining constraint:** screening requires the agent to press a key to accept, and
> inbound DTMF from Quo hangs the call up (tested 2026-08-04, traced to the agent's home
> network). So screening ON = Voice Assist works but the agent cannot answer; screening
> OFF = the agent can answer but Voice Assist never fires. Resolving this needs either
> working inbound DTMF, a destination that does not answer prematurely, or a
> Voice-Assist-first flow using dynamic transfer (no keypress required).
>
> The failure analysis below is retained as a record of the investigation. Its conclusion
> that this was an account-level CallRail bug was **incorrect**.

---

## Original report (superseded)

**Account:** ACC019dc0126ade7956850fbd40239646af (got moles, COM019dc0126bea71ba8680470bce4446d1)
**Reported:** 2026-08-12
**Severity:** Every unanswered inbound lead is lost silently and logged as answered.

---

## Symptom

An inbound call to a tracking number rings the Dial destination for ~36 seconds, then the
line goes silent and the call ends. **Voice Assist never answers.** No voicemail, no AI
greeting, no human.

CallRail records these calls as `answered=true`, `voicemail=false`, `call_type=answered`,
duration 44–50s — so they do **not** appear as missed calls anywhere in the call log or
reporting. The loss is invisible without listening to recordings.

## What works

- **Voice Assist itself is healthy.** The "Test assistant" button on the Voice Assist
  settings page runs correctly and the AI responds as configured.
- Voice Assist is enabled on **17 / 17** tracking numbers ("Great coverage").
- Voice Assist greeting text is populated on the flow step.
- Live human answers work normally — when the destination picks up inside the ring window,
  the call connects and records fine (e.g. 10:48 call, 674s, full transcript).

## What fails

The **Dial step's timeout branch → Voice Assist** handoff. Reproduced on **two separate
call flows**:

| Flow | Result |
|---|---|
| `VA Call Flow` (9 trackers, live) | rings ~36s, silence, call ends |
| `Test Muhammad soft phone` | rings ~36s, silence, call ends |

Because two independent flows fail identically, this is not per-flow configuration.

## Live flow configuration (reads correct)

```
Greeting  "This call may be recorded and shared with third-party providers."
  -> Schedule  Weekdays 09:00-17:00, Pacific Time (US & Canada)
      -> Dial   253-683-7555
                timeout: 20 seconds
                "Prevent voicemails and automated systems from answering": OFF
          -> (timeout) Voice Assist
                "Thanks for calling Got Moles! Our team is currently unavailable,
                 but I can grab your info so someone gets back to you quickly.
                 Are you a new caller or an existing customer?"
```

Note the configured Dial timeout is **20 seconds** but observed ringing is **~36 seconds**
before the call ends — the timeout does not appear to be enforced as configured, and the
next step never executes.

## Reproduction — failing calls (all inbound, 2026-08-12, Pacific)

| Time | Call ID | Tracker | Duration | Logged as |
|---|---|---|---|---|
| 11:07:01 | CAL019ff728005478d28cc8cc89a49ac26f | Facebook 253-528-8152 | 48s | answered |
| 11:13:34 | CAL019ff72e00c070909f875e4141c4de21 | Facebook 253-528-8152 | 50s | answered |
| 11:40:01 | CAL019ff74636747c4db4da43aaef716b13 | Facebook 253-528-8152 | 46s | answered |
| 11:47:51 | CAL019ff74d60c3783fb4a2ebaa9d2a1b2b | Facebook 253-528-8152 | 44s | answered |
| 11:53:58 | CAL019ff752fa79758aa743d47e01cb2dc0 | Facebook 253-528-8152 | 47s | answered |

Recordings for these calls contain: ~1s connect tone, ringing from ~00:01 to ~00:37,
then silence to end. Independently confirmed by transcription and by the caller
(Spencer Hill, 253-326-1740) who reports hearing silence.

Note the recording length is consistently shorter than the call duration
(e.g. 11:40 — call 46s, recording 40s), so ~6s at the end of each call is not captured.

## The Dial timeout setting has no effect on execution

The timeout was lowered from **20 seconds to 10 seconds** on the `Test Muhammad soft phone`
flow and the call was repeated. The call duration did not change:

| Dial timeout setting | Call | Duration |
|---|---|---|
| 20 seconds | 11:40:01 | 46s |
| 20 seconds | 11:47:51 | 44s |
| **10 seconds** | **11:53:58** | **47s** |

Halving the configured timeout produced no change in call length and no change in outcome —
the call still rings out and ends in silence without reaching Voice Assist. The Dial step's
timeout value appears to be ignored entirely at execution time.

This rules out the timeout value as a cause and rules out any race with a destination-side
answering system, since nothing on the destination answers at all.

## When it started

Voice Assist was firing correctly in business hours on 2026-08-11 and stopped mid-afternoon:

```
2026-08-11 12:02  VA answered   "The team is out with customers right now..."   OK
2026-08-11 12:26  VA answered                                                   OK
2026-08-11 12:27  VA answered                                                   OK
2026-08-11 14:09  Voicemail intercepted (destination-side)                      FAIL
2026-08-11 14:13  Voicemail intercepted (destination-side)                      FAIL
2026-08-11 16:14  Voicemail intercepted (destination-side)                      FAIL
2026-08-12 onward silence, no answer at all                                     FAIL
```

The destination's own voicemail was masking the fault until 2026-08-12, when it was
removed from the destination phone system. After removal the calls go silent, which
exposed that the Voice Assist step was already not executing.

## Ruled out

- **Destination-side voicemail** — removed entirely from the destination phone system
  (Quo/OpenPhone, 253-683-7555); its call flow is now `Incoming call -> Ring users (30s)`
  with no voicemail step, published. That system has never recorded a voicemail.
- **Destination rejecting the call** — the destination log previously showed
  "You rejected the call" because a second user's device was in the ring group and was
  busy. Fixed by enabling "only ring users that are not on a call"; the log now shows
  "No one answered" and the ring runs its full duration.
- **Per-flow misconfiguration** — reproduced on two independent flows.
- **Voice Assist being disabled** — enabled on 17/17 trackers, and its own test passes.

## Questions for CallRail

1. Why does the Dial step's timeout branch not execute Voice Assist, when Voice Assist
   passes its own test and is enabled on the tracker?
2. Why is the observed ring duration ~36s when the Dial step timeout is set to 20s?
3. Why are unanswered calls logged as `answered=true` / `voicemail=false` rather than as
   missed, given nothing answered them?
4. Is there an account-level Voice Assist entitlement, quota, or usage limit that changed
   on 2026-08-11 around 14:00 Pacific?
