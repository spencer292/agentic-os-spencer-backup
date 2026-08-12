---
project: jobber-text-automation
status: active
level: 2
created: 2026-08-11
---

# Jobber text automation — past-due collections + inbound triage

Sibling to `projects/briefs/jobber-text-routing/` (ownership resolution, the text desk).
That brief answered *whose customer is this*. This one answers *can the machine send and
answer the text itself*.

## Goal

Two lanes, both running on the Jobber texting number **253-300-0889**:

1. **Outbound:** past-due invoices get a text nudge at **7 days** and **11 days** past due,
   carrying the client-hub pay link. Jobber only offers this for email.
2. **Inbound:** every incoming text is classified, resolved to an owner, and either answered
   from Jobber data + the existing answer bank, or escalated to Spencer / the owning tech.

## Decisions (2026-08-11, Spencer)

- **Send mechanism: browser robot inside Jobber.** Chrome on the persistent `tool-browser`
  profile drives the message center. Keeps the conversation on the number customers already
  have; replies land in the existing inbox; $0 extra. Accepted cost: unofficial, breaks on
  Jobber UI changes, needs a machine left running.
- **Inbound autonomy at launch: draft everything, send nothing.** Every reply is pre-written
  and queued for human approval. Run 1–2 weeks, measure per-intent accuracy, then promote
  only the reliably-correct intents to auto-send.
- Rejected: separate SMS number (Twilio) — new number customers don't recognise, replies land
  where nobody is watching, needs A2P 10DLC registration.

## The constraint (verified, do not re-litigate)

Jobber's texting is a closed box at the API layer. Re-confirmed 2026-08-11 by introspection:

- No inbound-message webhook — nothing messaging-related in `WebHookTopicEnum`.
- Cannot read texts. `Client.messages` **and** `Invoice.linkedCommunications` both return
  `MessageInterfaceConnection`, which exposes only `totalCount` / `cursor`. Requesting the
  node errors: `Field 'nodes' doesn't exist on type 'MessageInterfaceConnection'`.
  `MessageInterface` is absent from `__schema.types`.
- No mutation sends a text.

**Browser automation is the only door**, for both reading and sending.

## What IS API-native (verified live 2026-08-11)

The entire targeting layer for the outbound lane. Only the send is blocked.

| Field | Use |
|---|---|
| `Invoice.clientHubUri` | per-invoice pay link, e.g. `https://clienthub.getjobber.com/client_hubs/{uuid}/invoices/{id}` |
| `Invoice.dateViewedInClientHub` | has the customer even opened it — changes the message wording |
| `Invoice.linkedCommunications.totalCount` | count-only signal that something was already sent |
| `client.phones[].smsAllowed` | per-number SMS consent, already in Jobber |
| `status: past_due`, `dueDate`, `amounts.invoiceBalance` | cohorting |

## Sizing (A/R snapshot 2026-07-06 — re-pull live before building)

- Past due: **133 invoices / $16,983**. Awaiting payment: 155 / $32,403.
- Aging: **121 at 1–6 days ($14,884)**, 2 at 7–10, 1 at 11–20, 7 at 21–45, 2 at 46–90.
- Chronic tail (21+ days): **9 invoices / $1,174**.

**This is a prevention play, not a collections play.** There is no delinquency pile — there is
a payment-lag pile. The 7/11-day nudge exists to stop the 1–6 day bucket from aging. Daily
send volume will be small and reviewable. Snapshot was taken the day after a batch invoice
run, so the steady-state daily cohort is unknown until a live re-pull.

## Phases

### Phase 0 — COMPLETE (2026-08-11)

**Read-state test: PASSED.** The message center list renders, per conversation, the client
name, phone number, **full message body** and timestamp — all in the DOM, without opening a
thread. Verified live. The robot can poll, read and classify without ever touching Jobber's
account-level read state.

Better still: **the robot should not use Jobber's unread state at all.** It keeps its own
per-conversation "last seen" state file keyed on client + timestamp + body. That is independent
of what the office does, survives a human opening a thread, and cannot clobber anyone's unread.
The read-state risk is designed out rather than mitigated.

**Selector map (verified live):**

| Element | Selector |
|---|---|
| Message center trigger | `button[data-testid="open-message-center"]` (carries unread badge) |
| Conversation rows | `[data-testid="conversations-list-item"]` — 20 loaded per page |

The message center is a **right-side drawer, not a routed page**. `/messages`,
`/message_center`, `/communications`, `/conversations` all 404. It must be opened by clicking
the trigger.

**Inbound vs outbound is not flagged in the DOM** — but outbound is template-matchable
(`Hello! This is Got Moles. We will arrive in approximately…`, `Hi {name}, here's your quote
from…`). Anything not matching a known outbound template is treated as candidate inbound. A
tech's manual outbound reply will occasionally false-positive into the queue; that costs a
human glance, not a wrong send.

**Signal-to-noise measured on a live 20-row sample: 4 real inbound, 16 outbound automation.**
Roughly 80% of the inbox is Jobber's own On My Way and quote texts. That is the concrete
mechanism behind messages getting lost — the real ones are buried in the company's own
notification traffic. Sample inbound: *"Hi Cory. Are you coming back today?"*,
*"Thank you! There is a really big mo…"*.

### Phase 0 findings — live A/R (see Sizing, and Autopay below)

### Autopay segmentation (verified 2026-08-11)

Spencer wants more customers on autopay; he estimates about half are. Confirmed independently.

Jobber gates payment-method *detail* exactly like messages (`PaymentMethodInterfaceEdge`
exposes only `cursor`), but `paymentMethods(filter:{clientId}) { totalCount }` **is** readable.
That gives a per-client card-on-file boolean — enough to segment. Script:
`scripts/enrich-payment-methods.mjs`.

| Segment | Invoices | Balance | Clients | Meaning |
|---|---|---|---|---|
| Card on file | 58 | $8,954 | 52 | charge failed, or autopay never switched on |
| No card | 44 | $10,865 | 41 | genuine autopay conversion target |

**The past-due list IS the autopay conversion list.** By definition these are the customers for
whom manual payment did not happen. Two consequences:

1. **$8,954 across 52 customers who already have a card saved and still went past due.** That
   is the cheapest money on the board — no new payment details required. Worth asking whether
   autopay is simply not enabled for them, because switching it on may recover a chunk of that
   without sending a single text. Potentially a bigger win than the texting project.
2. The 41 no-card clients get the autopay offer on the day-11 message.

**Wording constraint — cause-neutral, mandatory.** A saved card does NOT prove autopay was
enabled; Jobber stores cards for one-off charges too. So we cannot tell "autopay charge
declined" from "card saved, autopay never on". Never assert a decline. Use
*"we have a card on file for you — want us to run it?"*, never *"your card was declined."*

## Lane 3 — the autopay consent campaign (probably the biggest item here)

**Spencer's ruling (2026-08-11): "if autopay is not switched on then we need to get their
approval."** Correct, and it governs this lane. A stored card authorizes the charge the
customer agreed to — not an open-ended recurring one. Enrolling someone silently is not an
option. This is a consent campaign, not a settings sweep.

**Autopay IS readable via the API** — `Job.willClientBeAutomaticallyCharged` (verified against
the Jobber UI: job #8149 reads `false`, and the job page shows *Automatic payments: No /
Disabled*). There is **no mutation to set it** — enabling is UI-only, per job. So we can
measure and track automatically, but every enrolment is a manual toggle.

### Measured across all 809 active jobs (`scripts/autopay-audit.mjs`)

| Product | Jobs | Autopay ON | OFF |
|---|---|---|---|
| TMCP | 675 | 212 | **463** |
| Quick Fix | 113 | 0 | 113 |
| Barter / F&F | 10 | 0 | 10 |
| other / bid | 11 | 0 | 11 |
| **Total** | **809** | **212 (26%)** | **597** |

Quick Fix having zero is correct — it is a 5-week series, not recurring billing. **The real
figure is TMCP: 31% on autopay, not the ~50% assumed.** 463 TMCP jobs across **449 clients**
are billed by hand every month.

### Prioritized ask list (`scripts/autopay-target-tiers.mjs` → `data/autopay-targets.json`)

| Tier | Segment | Clients | Past due | Note |
|---|---|---:|---:|---|
| T1 | card on file + past due | 40 | $5,679 | warmest ask |
| T2 | card on file, current | **237** | $0 | one question away |
| T3 | no card + past due | 37 | $8,740 | needs card *and* consent |
| T4 | no card, current | 135 | $0 | cold, bulk campaign |

**277 of the 449 already have a card on file.** They trusted Got Moles with card details and
were simply never asked to authorize recurring billing. At the TMCP tiers ($100 / $125 / $150
by acreage; observed average ≈ $115) those 277 represent roughly **$32k/month currently
collected by hand**. That is worth more than the entire $19.8k past-due balance.

### Consent requirements (build to these)

The ask must state, in the message itself: the **amount** (or exactly how it is determined),
the **frequency**, that it **recurs automatically**, when it **starts**, and **how to cancel**.
Capture an affirmative reply — a "YES" in the Jobber thread is a timestamped written record,
which is the audit trail. Send a confirmation once enrolled. Not legal advice; this is the
standard bar for recurring card authorization and negative-option billing, and it is cheap to
meet.

**Keep T2 separate from collections.** Those 237 are current and paying fine every month. The
autopay ask to them is a convenience offer and must never ride along on a past-due nudge.

### Bottleneck to plan around

Enabling autopay is a manual per-job toggle (no API mutation). 277 warm clients ≈ a few hours
of clicking, one time. Progress is trackable automatically by re-running `autopay-audit.mjs`.

## Phase 1 — outbound past-due texts
Weekday cron, mid-morning. Pull `past_due`, days-past-due from `dueDate`, cohort at exactly
7 and 11. Day 7 friendly, day 11 firmer; both carry `clientHubUri`.

Suppression: payment posted since pull · balance under floor · already sent at that stage
(state file) · `smsAllowed: false` · one text per client even with multiple open invoices ·
weekdays only (no weekend visits/contact) · daylight hours only · STOP honoured.

### Phase 2 — inbound triage, three lanes
Knowledge base is `projects/briefs/callrail-faq/2026-07-20_ai-receptionist-answer-bank.md` —
reuse verbatim, including its 9 hard "never" guardrails and escalation flags. Ownership comes
from `jobber-text-routing/lib-resolve.mjs` (tested 6/6, high confidence).

- **AUTO** (post-launch only): service day, next visit, do I need to be home, pricing tiers,
  chemicals / pet + child safety, what happens to the mole, invoice balance.
- **DRAFT** (human sends): reschedules, new-lead intake, anything touching the schedule.
- **ESCALATE, never auto:** angry / complaint, safety near traps, commercial / HOA, discount
  requests, legality, cancellations, anything about what a tech found on the property.

Plus the SLA timer from the routing brief: unanswered after N minutes → office → Spencer.

### Phase 1 — FIRST LIVE RUN COMPLETE (2026-08-11, ~5:00–5:50 PM PT)

**40 clients texted, $5,914 of past-due invoices, zero failures.** Every message matched the
right thread, passed identity verification, and was confirmed accepted by Jobber (compose box
cleared). 21 of the 40 have a card on file and were offered the `reply CHARGE` option.

Not texted, deliberately: 8 commercial/HOA/municipal accounts ($3,580 — phone/email instead),
28 clients rolled to the next run ($2,475), 3 already hand-texted by Spencer.

**Two operational lessons from the run:**

1. **Background jobs get killed at their timeout.** The first launch had a 10-minute cap on a
   ~40-minute job and died at 32/40; the resume died again at 1/8. **The state file made this a
   non-event** — each resume skipped everything already sent and nobody was texted twice. Run
   long sends in the foreground, or chunk them under the cap.
2. **`isToday` was wrong** (fixed, now `isRecent`). Jobber shows a bare time like `4:50 PM` for
   the last ~24 HOURS, not the calendar day. Proof: a row read "4:50 PM" at 4:32 PM local, then
   flipped to a day-name format once it aged past 24h — which let Nichole Avila through after
   two dry runs had held her. The guard now asks "did a human touch this thread in the last day",
   which is the question actually worth asking.

### Phase 1 — build notes

`build-collection-queue.mjs` → `send-collection-texts.mjs`. Dry run over the full queue:
**37 of 40 verified ready ($6,044)**, 3 correctly held back.

**Send-path selector map (hard-won — do not "simplify"):**

| Step | Selector / method |
|---|---|
| Open panel | `button[data-testid="open-message-center"]` |
| Panel search | `input[type=text]` **inside the drawer**. `input[type=search]` is Jobber's GLOBAL nav search — typing there silently filters nothing |
| Typing | CDP `Input.insertText`. Setting `.value` programmatically does **not** trigger the conversation filter |
| Rows | `[data-testid="conversations-list-item"]` |
| Compose | `textarea` (one per thread). Accepts programmatic input, but Send only enables after React re-renders — **wait ~400 ms before reading `disabled`** |
| Send | `button[aria-label="Send"]` |
| Thread identity | Thread view shows the client **NAME only, no phone**. Phone search picks the row; name confirms the thread |

**Message cap: 670 characters** (Jobber shows `0/670`). Enforced before typing.

**Two-factor targeting:** search by phone digits (Jobber normalizes formats — `2063803393`,
`206-380-3393` and `(206) 380-3393` all resolve), require exactly one matching row, then verify
the opened thread's heading matches the expected client name. Both factors come from Jobber.

**Same-day activity guard (added 2026-08-11 after Spencer hand-texted three queued clients).**
The state file only knows what the ROBOT sent, so anything a human sends is invisible to it.
Fix: the conversation ROW already carries the last message and its timestamp, so before opening
anything the sender reads them and holds the client if the last message is **from today and not
a known Jobber template**. Zero extra cost, and no thread is opened — so account-wide read state
is never touched. Templates are listed in `check-recent-activity.mjs` → `AUTOMATION`
(On My Way, arrival window, quote/invoice sends); anything else is a person or the customer.

Validated against ground truth: it independently caught Spencer's own message to Nancy Parkes
(*"Hi Nancy! its Spencer, Can vwe get this invoice taken care of please."*, 9:56 AM) and
Deborah Larry's reply (*"Thank you"*, 10:08 AM).

`mark-contacted.mjs "Client Name"` is the explicit override for anything the detector can't see.

**Panel degradation.** The message-center list stops returning rows after ~14 consecutive
searches. Both scripts reset by navigating to `/home` and reopening the panel, and treat a
zero-row result as suspect — reset once and retry before believing "no conversation". Without
that retry a degraded panel reads as 26 missing customers.

**Multi-phone bug (found 2026-08-11 when Spencer said "Mike Doud has a text thread").**
A client can hold several SMS-allowed numbers and **the Jobber thread lives on the PRIMARY**,
which is not necessarily first in the `phones` array. Mike Doud: Mobile `401-578-4395`
(`primary:false`) vs Main `(206) 295-1604` (`primary:true`) — the thread is on the Main, so
picking `phones.find(p=>p.smsAllowed)` read as "no conversation". **8 past-due clients have more
than one SMS-allowed number.** Fixed: the queue prefers `primary`, keeps every SMS-allowed
number in `smsPhones`, and the sender tries them in order before concluding there is no thread.

**"Unknown"-labelled threads.** Some conversations show as `Unknown • (253) 250-1242` — the
number carries real history (Jobber's own invoice and arrival texts, addressed to the client by
name) but was never linked to the client record in the message center. Chad Buckley and Richard
Driscoll are both this. Accepted only when the row's last message names that client, so it stays
two factors: exact phone + name in the message. Worth fixing the linkage in Jobber separately.

**Correction, recorded so it is not repeated:** an early run reported Richard Driscoll's thread
as **"Gurley Eric"** and Chad Buckley's as **"Amanda Buckley"**, read as near-miss wrong-number
sends. Both were artifacts of the degraded panel matching a neighbouring row *before* the
reset-and-retry fix. Neither was real. The lesson is the one already in CLAUDE.local.md about
ghost data: **confirm a scary reading against a fresh, known-good page state before acting on it.**

### Phase 3 — measure and widen
Per-intent accuracy on the drafted replies. Promote to AUTO on evidence, one intent at a time.

## Acceptance criteria

- Phase 1: a past-due text goes out at day 7 and day 11 with a working pay link, no duplicate
  ever sent for the same invoice-stage, and no send to a client with `smsAllowed: false`.
- Phase 2: every inbound text produces a classification + owner + drafted reply within the SLA
  window, and nothing on the ESCALATE list is ever drafted as auto-sendable.
- Neither lane degrades the office's ability to see what is unanswered.

## Constraints / risks

- Browser automation against Jobber is unofficial; any UI change breaks it. Maintained robot,
  not fire-and-forget. Needs a machine that stays on.
- **Read-state destruction** is the risk that could make things worse rather than better.
- Collections texts need opt-out language and STOP handling.
- Worst failure mode is auto-answering an angry customer badly — hence draft-only at launch.
- Turn the field-ops crons off before any manual Jobber editing session that overlaps this
  work (`route-drift-check` runs hourly in fix mode).

## Incidental finding — LIVE, unrelated to this project, fix now

Reading the message center surfaced a customer-facing leak. Every On My Way text reads
*"If you have any concerns you can call us at 2537500211"* (the main line, correct) —
**except Cory Ventura's, which sends "(253) 569-4822". That is Cory's personal cell**
(confirmed against `jobber-text-routing/tech-contacts.json`).

This is precisely the exposure the routing brief identified and rejected: a phone number in a
Jobber **user profile** becomes a selectable On My Way callback. Cory's customers are being
handed his personal cell, the office never sees those conversations, and the relationship
leaves with him.

Fix (UI only, cannot be scripted): Gear → Manage Team → Cory Ventura → clear the profile phone
field; move the number to the Team custom field; confirm the On My Way callback is set to
**Office number**. Then re-check the other techs the same way.

## Dependencies

- `tool-browser` persistent Chrome profile, logged into Jobber.
- `tool-jobber` OAuth (working on this install).
- `jobber-text-routing/lib-resolve.mjs` for ownership.
- `callrail-faq` answer bank for reply content.
