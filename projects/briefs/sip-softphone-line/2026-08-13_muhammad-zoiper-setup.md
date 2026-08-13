# Muhammad — Zoiper + Telnyx setup sheet

**Date:** 2026-08-13
**Machine:** Muhammad's MacBook (India)
**Rule for the whole build: change one thing, test, then change the next.** Yesterday's session
lost hours to diagnosing two faults at once from the wrong end.

---

## Part 0 — Read this first

Nothing below works until the Telnyx account is out of **PRETRIAL**. As of today the account has
zero numbers, zero orders, and no voice application. That is why the number says "not in service"
and why Zoiper returns `403 Forbidden` on REGISTER. They are the same fault, not two.

We are **not buying a phone number yet.** CallRail dials a SIP address, not a number — the DID is
optional and carries fraud-scoring risk we don't need to take this week.

---

## Part 1 — Spencer, on Telnyx (~15 minutes)

### 1.1 Get the account to **Paid** level — not Trial

**Trial is not enough.** It cannot buy numbers or run production voice. The target is the **Paid**
level, and Telnyx checks five things (`portal.telnyx.com/#/account/account-levels`):

| # | Criterion | Status as of 2026-08-13 |
|---|-----------|------------------------|
| 1 | Email is verified | ✅ done |
| 2 | Initial account verification checks passed | ❌ — needs the LinkedIn/GitHub identity connect |
| 3 | A verified phone number has been provided | ❌ — profile Contact Phone is blank |
| 4 | A service address has been provided | ❌ — profile address is blank |
| 5 | 2FA is enabled | ❌ — check `#/account/my-account/security` |
| 6 | Payment with credit card has been made | ❌ |

Start at the **PRETRIAL — UPGRADE** badge → **Connect with LinkedIn** (standard OAuth, no posting
access; GitHub also works). Then fill in the profile properly at `#/account/general` — company
name, contact phone, and full service address are all currently empty and are prerequisites, not
optional fields.

**Skip Trial. It is a dead end for this use case**, per Telnyx's own docs:

- Incoming calls are **only receivable from the account's one verified phone number**. CallRail
  forwards from arbitrary tracking numbers, so inbound would never arrive.
- One local number per **trial account lifetime**, reclaimed within 30 days if not upgraded.

**"Use-case is verified" is a Trial criterion only — it is not in the Paid criteria list.** Going
straight to Paid means you never have to complete it. If the portal does force a use-case form
during the upgrade flow, the wording to use is in 1.2 below.

**Paid-level limits worth knowing:** 5 concurrent outbound calls, 100 outbound calls/day, 10/hour.
Irrelevant while Zoiper is inbound-only, and another reason outbound callbacks stay in CallRail.

**Payment methods accepted:** credit card and PayPal. The billing pages return 404 at Pretrial
level, so **billing unlocks only after the identity connect passes** — that one click is the first
domino, and both the payment page and the remaining criteria become reachable behind it.

#### Exact portal locations for the Paid criteria (verified live 2026-08-13)

None of these are where you would expect, and two of them are separate records that the
obvious-looking form does **not** satisfy.

| Criterion | Exact location | Trap |
|-----------|---------------|------|
| Verified phone number | `#/numbers/verified-numbers` → **Verify Number** | **Not** the Contact Phone field on the profile page. Entering it there leaves the criterion red. This page is a separate ownership check — Telnyx calls/texts a code. |
| Service address | `#/billing/service-address` → **Create** | **Not** the address on `#/account/general`. It is its own record with its own empty form. Telnyx: *"If you do not fill service address, Telnyx will use the account address"* — for tax, but the Paid criterion still requires the record to exist. |
| 2FA enabled | `#/account/my-account/security` | ✅ Already done as of 2026-08-13. |
| Credit card payment | Account icon → **Manage billing** → `#/billing/payment` → **Make a Payment** | Billing has its own left-hand nav (Invoices, Payment History, Service Address, Billing Groups). |

Check progress at `#/account/account-levels` — it shows a green tick or red X against every
criterion. **Read that page rather than trusting that an action completed.** Twice now an action
felt done and had not moved the level.

> Note: upgrading resets the $25 AI credit to a $5 full-service credit. Irrelevant for us — voice
> minutes are fractions of a cent.

### 1.2 Complete business verification properly

Do this now rather than when a limit bites. Use the **EIN**, the **got-moles.com** website, and
state the use case plainly: *"US pest-control company; one remote customer-service agent answering
inbound calls forwarded from our CallRail tracking numbers."*

This matters. Offshore agent + fresh account is the pattern that got the Quo account terminated on
08-11. Being transparent up front is the mitigation.

### 1.3 Enable 2FA and make a card payment

Both are hard requirements for Paid level, not nice-to-haves. 2FA is on the Security page.

### 1.4 Create the SIP connection

Voice → **SIP Connections** → Create → and this is the setting that mattered yesterday:

| Setting | Value | Why |
|---------|-------|-----|
| Connection type | **Credentials** | An IP or FQDN connection *rejects* REGISTER. A wrong choice here returns exactly the `403` we saw. |
| Name | `muhammad-softphone` | |
| Username | `gotmolesmuhammad` | **Letters and numbers only — Telnyx rejects underscores and hyphens.** This becomes the SIP address |
| Password | generate a long one | Store in the VoIP passwords file, not in chat |
| SIP transport | **UDP** to start | Add TLS later; don't debug encryption and registration at the same time |
| DTMF type | **RFC 2833** | This is what makes CallRail screening work |
| Codecs | Opus, G.711 μ-law (PCMU), G.729 | Opus first — best on a lossy link from India |

The resulting SIP address is **`gotmolesmuhammad@sip.telnyx.com`**. That string is what goes into
CallRail later.

### 1.5 Check inbound SIP URI calling is permitted

On the connection's inbound settings, confirm calls addressed to the connection's SIP URI from an
outside party are accepted. **Verify this on the day** — the exact label moves around in the Telnyx
UI, and this is the one setting that decides whether CallRail can reach Muhammad at all.

### 1.6 Attach an Outbound Voice Profile

Only needed if Muhammad ever dials *out* of Zoiper. Set it up so the option exists, but per the
brief, outbound stays in CallRail's dialer for now.

---

---

## AS BUILT — 2026-08-13, 10:34 AM

Part 1 is **done**. The account reached `Paid` and the connection exists.

| Item | Value |
|------|-------|
| Account level | **Paid** (all six criteria green), balance $19.95 |
| Connection name | `muhammad-softphone` |
| Connection ID | `3025744455840826576` |
| Type | **Credential Connection** |
| Status | Active |
| Username | `gotmolesmuhammad` |
| Password | Telnyx-generated — reveal with the eye icon on the connection's *Authentication and routing* step |
| **SIP address** | **`gotmolesmuhammad@sip.telnyx.com`** |
| Receive SIP URI calls | **From anyone** — required; "Only from my Connections" would block CallRail |
| DTMF type | RFC 2833 (Telnyx default, no change needed) |
| Codecs | G722, G711U, G711A, G729, **OPUS** (Opus added for the India link); video off |
| AnchorSite | Latency (auto-selects lowest-latency site) |
| Outbound voice profile | **Not assigned** — deliberate; outbound callbacks stay in CallRail's dialer |
| Phone numbers | None — deliberate, see the brief's scope decision |

`#/voice/connections` also has a **Test call** button, useful for test-ladder step 2.

---

## Part 2 — Muhammad, on his MacBook (~10 minutes)

**Test on Spencer's machine FIRST.** Spencer bought and installed Zoiper on 2026-08-13; Muhammad's
install status is unconfirmed. Registering from Spencer's desk proves the Telnyx build before any
remote session — the 08-12 lesson was that diagnosing Muhammad's screen blind is what burns hours.

**Licensing:** Zoiper Pro is typically per-seat, so Spencer's license may not cover Muhammad's Mac.
Free Zoiper does bare SIP with G.711, which is enough to prove the whole path — buy a second seat
only once the line is validated.

### 2.1 Add the account

Zoiper → **Settings → Accounts → Add account** → choose manual configuration, **SIP**.

| Field | Value |
|-------|-------|
| Domain / Host | `sip.telnyx.com` |
| Username | `gotmolesmuhammad` |
| Password | *(from Spencer, sent securely — not over chat)* |
| Auth username | same as Username |
| Outbound proxy | **leave blank** |
| Transport | UDP, port 5060 |
| Register on account | **ON** |

### 2.2 The settings that are non-negotiable

These are what make this different from Quo. Getting one wrong reproduces the exact bug we are
migrating away from.

- **Auto-answer: OFF.** This is the entire reason we left Quo. If the softphone answers on its own,
  CallRail thinks a human picked up, exits its flow, and Voice Assist never fires.
- **Any built-in voicemail / auto-reply / "answer after N seconds": OFF.** Same failure mode. The
  softphone must never accept the session on its own.
- **DTMF: RFC 2833**, in-band audio DTMF off.
- **Video: off.** Not needed, and it complicates codec negotiation.

### 2.3 macOS permissions

macOS silently blocks mic access and it presents as one-way audio, which is easy to misread as a
network problem.

**System Settings → Privacy & Security → Microphone → Zoiper: ON.**
Allow Zoiper through the firewall if prompted. Set the correct headset under Zoiper → Audio.

### 2.4 Network

- **No VPN.** Confirmed with Spencer he doesn't have one — keep it that way. It adds fraud-engine
  risk with no benefit.
- Wired ethernet if at all possible; otherwise sit close to the router.
- Needs roughly 100 kbps stable up and down. Bandwidth is rarely the problem — jitter is.

---

## Part 3 — Test ladder

Run in order. **Do not skip ahead** — each step proves one link, and a failure at step *n* is
meaningless if step *n−1* was never confirmed.

**Step 1 PASSED 2026-08-13** — MicroSIP/3.22.12 registered from Spencer's Windows machine over UDP;
Telnyx-side status `Registered`, IP 192.168.1.224. The line works. Steps 2-7 remain.

Two things learned doing it:

- **Verify from the Telnyx side, not the client.** The connection's *Authentication and routing* tab has a
  **Check registration status** button showing status, IP, transport, user agent and last registration.
- **That button goes stale in place.** It read `Unregistered` twice while MicroSIP was already online.
  A full page reload showed the truth. Never believe a negative reading without hard-reloading first —
  the account-levels page behaves identically.

| # | Test | Proves | If it fails |
|---|------|--------|-------------|
| 1 | Softphone registers — confirm via **Check registration status** on the Telnyx connection | Account level, connection type, credentials | Telnyx → **Debugging → SIP call flow tool**. Note it searches CDRs (calls), not REGISTER traffic, so it will not show a failed registration — use the status button and a hard reload. |
| 2 | Spencer calls the SIP address from a SIP-capable endpoint, or uses Telnyx's test call | Inbound SIP URI reaches the softphone | Re-check 1.5 (inbound SIP URI calling) |
| 3 | Muhammad answers, two-way audio both directions | Media path India ↔ US, mic permission | One-way audio = macOS mic permission (2.3), then codecs |
| 4 | Point **one** CallRail tracker (Facebook — lowest volume) Dial step at `gotmolesmuhammad@sip.telnyx.com`, call it, **let it ring out without answering** | The premature-answer bug is gone | If CallRail logs `answered=true` while nobody picked up, something in Zoiper is still auto-answering — back to 2.2 |
| 5 | Same call, Muhammad answers | End-to-end live | |
| 6 | Screening **ON**, press `1` to accept | RFC 2833 DTMF passes | This was Quo's second fatal flaw — it could not do this at all |
| 7 | Let it ring out with screening ON | **Voice Assist still fires** | This is the acceptance criterion that matters most |

**CallRail warning:** the Call Flow Builder cannot be edited by script — its Angular form silently
submits the original state even when the UI shows the new values. Confirmed on four attempts.
Step 4 is a manual edit in the CallRail UI, then verified afterward against the API.

---

## Part 4 — After the pilot passes

1. Roll the remaining trackers over to the SIP address one at a time.
2. Revisit the DID question only if Muhammad needs a direct number.
3. Solve outbound separately — he still can't dial from CallRail. `Manager` role did not fix it;
   next suspect is per-company access on his user record. **Get a screenshot of his screen first.**
   Yesterday was diagnosed blind and that is what made it expensive.

---

## Do not leave this hanging

CallRail screening is currently **ON**, which means Voice Assist answers but **no human can accept
a call.** That is not a safe resting state. Either finish the cutover or turn screening back off
before the end of the working day.
