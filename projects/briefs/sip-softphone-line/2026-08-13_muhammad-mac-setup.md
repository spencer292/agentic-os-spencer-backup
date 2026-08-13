# Muhammad — phone setup on your MacBook

This gets you answering Got Moles calls from your Mac. It takes about 10 minutes.

You need three things from Spencer: the **username**, the **password**, and this sheet.

---

## 1. Install Zoiper

Download Zoiper 5 for macOS from [zoiper.com](https://www.zoiper.com/en/voip-softphone/download/current) and
open it. Sign in with the Zoiper Pro account details Spencer gives you — that unlocks the paid features
on your machine.

## 2. Add the phone line

In Zoiper: **Settings → Accounts → + (Add account) → choose manual configuration → SIP**.

Fill in exactly these three:

| Field | Value |
|-------|-------|
| Domain / Host | `sip.telnyx.com` |
| Username | `gotmolesmuhammad` |
| Password | *(Spencer will send this separately)* |

If Zoiper asks for an **Auth username**, use `gotmolesmuhammad` again.
If it offers an **Outbound proxy**, leave it blank.

Save. Within a few seconds Zoiper should show the account as **registered** (usually a green dot or
tick). Tell Spencer when it does — he can confirm it independently from the Telnyx side, so don't
worry if you are unsure what you are looking at.

## 3. The settings that actually matter

These three are the whole reason we moved off the old system. Please do not skip them.

**Auto-answer: OFF.** Look through Zoiper's settings for anything called *auto answer*, *automatic
answer*, or *answer after N seconds*, and make sure it is switched off. If your softphone picks up a
call by itself, our call-tracking system thinks a human answered, and the customer ends up hearing
ringing and then silence. This is exactly what went wrong with the last system.

**Any built-in voicemail or automatic greeting: OFF.** Same reason. The phone must do nothing at all
until you personally click answer.

**DTMF: RFC 2833.** Usually the default. This is what lets you press `1` to accept a call when call
screening is on.

## 4. Let macOS use your microphone

macOS blocks microphone access by default, and when it does, calls connect but the customer cannot
hear you — which looks like a bad connection but is not.

**System Settings → Privacy & Security → Microphone → turn Zoiper ON.**

Then in Zoiper's audio settings, pick your actual headset for both microphone and speaker.

## 5. Your internet connection

- **No VPN.** If you have one, turn it off and leave it off.
- **Use an ethernet cable if you can.** If not, sit close to the router.
- Voice calls need very little bandwidth, but they are sensitive to an unstable connection. A weak
  wifi signal causes choppy audio far more often than slow internet does.

---

## 6. Testing, with Spencer

Do these in order with Spencer on the other end. Each step checks one thing, so if something breaks
we know exactly where.

1. **Zoiper shows registered.** Spencer confirms from Telnyx.
2. **Spencer calls you.** Your Zoiper should ring. Do not answer yet — just confirm it rings.
3. **Answer it.** Check you can hear each other clearly, both directions.
4. **Spencer calls the tracking number and lets it ring out.** You do *not* answer. This proves the
   auto-answer settings are right.
5. **Spencer calls again, you answer.** This is a real end-to-end call.
6. **With screening on, press `1` to accept.** This proves the keypad tones work.

---

## If something does not work

**Tell Spencer the exact wording of any error message.** Not "it didn't work" — the specific text, or a
screenshot. Every error code means something different, and guessing at it costs hours. Spencer can
look up exactly what happened on the Telnyx side, but only if he knows what you saw.

Most common problems and what they usually mean:

- **Will not register** — usually the password. Ask Spencer to re-send it; do not retype it by hand.
- **Call connects but they cannot hear you** — microphone permission, step 4.
- **Choppy or robotic audio** — network. Try ethernet, or a different wifi network, to compare.
