# Who is answering the phone — Mo vs Voice Assist

**Window:** 2026-08-11 → 2026-09-10 (31 days) · **583 inbound calls** on the CallRail tracking numbers
**Source:** CallRail `call_disposition` on every inbound call (`answered` / `voice_assist` / `abandoned`)
**Script:** `projects/briefs/callrail-faq/scripts/who-answers.mjs` (read-only) · cache in `data/who-answers-2026-08-11_2026-09-10.json`

---

## The headline

**Inside Mo's shift (Mon–Fri, 9am–5pm PT) — 476 calls:**

| Who took it | Calls | Share of all calls | Share of calls that reached someone |
|---|---:|---:|---:|
| Human (Mo) | 303 | **63.7%** | **70.0%** |
| Voice Assist | 130 | **27.3%** | **30.0%** |
| Abandoned before anyone picked up | 43 | 9.0% | — |

**Across all 583 calls, every hour of every day:** Mo 52.0%, Voice Assist 38.9%, abandoned 9.1%.
Of the 524 that reached someone: **Mo 57%, Voice Assist 43%.**

The gap between the two figures is just coverage — outside 9–5 the split is not close:

| Window | Calls | Human | Voice Assist | Abandoned |
|---|---:|---:|---:|---:|
| Mon–Fri 9:00–16:59 | 476 | 63.7% | 27.3% | 9.0% |
| Mon–Fri outside 9–5 | 75 | **0.0%** | 89.3% | 10.7% |
| Weekend | 32 | **0.0%** | 93.8% | 6.3% |

Zero human pickups outside the shift, both ends — 8am is 93.5% Voice Assist, 5pm is 85.7%.

---

## The number that matters more than the split

**Of the 130 calls Voice Assist took during Mo's shift, only 35 (27%) came in while he was on another call.**
The other **95 — 73% — arrived on a free line.** The phone rang for 20 seconds, nobody picked up, and the AI took it.

That is ~3 calls a working day handed to the robot with no one on the other line, on top of ~1.4/day of genuine overflow.

Two more things from the same pull:

- **Voice Assist captured a usable message on only 55%** of its in-shift calls. The other 45% — roughly 58 calls in the month — the caller hung up on the AI and left nothing.
- **43 in-shift calls were abandoned** before anyone or anything answered, and only 6 of those were during another call.

---

## Week by week (in-shift, human share of calls that reached someone)

| Week of | Calls | Human | Voice Assist | Abandoned | Human share |
|---|---:|---:|---:|---:|---:|
| 08-10 | 83 | 74.7% | 20.5% | 4.8% | **78.5%** |
| 08-17 | 100 | 50.0% | 42.0% | 8.0% | 54.3% |
| 08-24 | 127 | 48.0% | 38.6% | 13.4% | 55.5% |
| 08-31 | 127 | 66.9% | 20.5% | 12.6% | **76.6%** |
| 09-07 | 70 | 55.7% | 35.7% | 8.6% | 60.9% |

Worst days: 08-28 (35.0% human), 08-27 (46.7%), 08-19 (43.5%), 08-18 (44.4%).
Best days: 08-13 (83.3%), 08-25 (83.3%), 09-01 (82.8%), 08-12 (80.0%).
09-07 reads 0% human because it was Labor Day.

The 08-17 → 08-27 dip is also the window the phone path was being moved off Quo onto the Telnyx SIP line, so some of it is the switch rather than Mo.

Last 14 days, in-shift: **65.5% human / 25.7% VA — 71.8% human share.** Roughly flat against the month.

---

## Method and caveats

- The split is CallRail's own per-call `call_disposition`, not a transcript guess — `answered` means a person picked up, `voice_assist` means the AI handled it, `abandoned` means the caller hung up during ringing.
- **"Human" during the shift is Mo.** The main line's call flow rings his SIP extension and nothing else, and every call summary that names its agent names Mo. Spencer's name shows up in summaries often, but as the *subject* of the call ("caller asking for Spencer"), not the person answering — a name-matching count would overstate him badly.
- `agent_email` is null on every call in the account, so CallRail itself cannot attribute a pickup to a person. If you want that, each answerer needs their own destination in the flow.
- Overflow detection compares each Voice Assist call's start against the start+duration of every human-answered call, with a 15s tail for wrap-up. It will slightly *over*count overflow, not under — so the 73%-on-a-free-line figure is a floor.
