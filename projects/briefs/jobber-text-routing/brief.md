---
project: jobber-text-routing
status: active
level: 2
created: 2026-08-05
---

# Inbound customer texts — routing them to the right person

## Goal

Every inbound customer text reaches one named owner, gets answered, and escalates if it
doesn't — at 5 technicians today and at 10+ without redesign.

## The problem in one line

Jobber gives Got Moles one company texting number, one shared inbox, no per-conversation
owner, and a read state that clears for everyone the moment any one person opens a message.
"Someone else must have got it" is not a discipline failure — it is the designed behaviour.

---

## What we verified (2026-08-05, live Got Moles Jobber account)

### Five structural limits in Jobber's texting

1. **One number, company-wide.** Jobber issues a single dedicated texting number per account.
   Got Moles: **253-300-0889** (Jobber-issued, text-only). No per-tech, per-territory, or
   per-crew numbers. It appears nowhere in the site, GBP, or client phonebook — customers only
   have it because Jobber texted them from it.

   **The number map (verified live 2026-08-06 — earlier notes had this wrong):**

   | Number | What it actually is |
   |---|---|
   | 253-750-0211 | The main line. CallRail tracking numbers on GBP/site forward here |
   | 253-326-1740 | **Spencer's personal cell** — currently sitting in Jobber's Company Settings as the company phone (`account.phone` = `2533261740`) |
   | 253-300-0889 | Jobber's dedicated texting number (`account.dedicatedPhoneNumber`) |

   Successive memory notes compressed "Spencer's cell, entered in company settings" into "Jobber
   phone", then "company number", then "main business line". It is his cell. Flagged on
   2026-07-22 and still unresolved.

   **Consequence for this project:** Jobber's Company Settings phone is what the On My Way
   **"Office number"** callback resolves to, and it is where calls to 253-300-0889 forward. So
   both currently ring Spencer's personal cell — the same exposure that made putting tech numbers
   in profile phone fields unacceptable. **Fix: set Company Settings phone to 253-750-0211.**
2. **Conversations cannot be assigned to a person.** Jobber's only "reassign conversation"
   moves a thread to a *different client* sharing the same phone number. There is no
   assign-to-teammate.
3. **Read state is account-level.** Per Jobber's own docs: when one user opens a message it
   shows as read for every user, including those who never saw it. This is the single largest
   driver of dropped texts.
4. **Notification targeting is all-or-nothing.** You choose which team members are notified of
   *every* inbound text. You cannot notify only the tech who owns that customer.
5. **The texting permission has no scoping, and it drags financial access with it.** Verified at
   source in Jobber's FAQ: *"Users who have the permission enabled for two-way text messaging
   will be able to view **all** messages in the message center and send text messages to **all**
   clients."* There is no "this tech sees only their own customers" setting — it is all or
   nothing. Worse, enabling it **requires** these permissions at minimum: **Show pricing, View
   requests, View quotes, View jobs, View invoices.** So giving a tech the ability to answer their
   own customer's text also hands them company pricing and every invoice on the account.

   Also confirmed: the dedicated number **can never be changed** once selected, and every user
   texts from it — *"whether you or your employees are texting from Jobber.com or using the Jobber
   mobile app."* Per-user numbers do not exist in Jobber at any plan level.

**Live account:** of 11 active users, **4 are account admins** — Spencer Hill (owner), Cory
Ventura, Courtney, Kellen. Admins see everything by default.

**Caveat — who else has texting access is unknown.** The two-way texting permission is set
per-user in Manage Team and is **not exposed in the API** (`User` exposes `isAccountAdmin` and
nothing about custom permissions). So the admin list is a floor, not the full picture. **Action:
check Gear → Manage Team.** If any field tech already has the texting permission, they are
currently seeing every customer conversation on the account *and*, per the prerequisite
permissions, company pricing and all invoices.

So the real shape of the problem is not "five techs in one inbox". It is: **one unowned inbox that
you can only grant in full or not at all.** There is no configuration where a tech sees their own
customers' texts and nothing else. That is the wall.

### Jobber's API cannot fix this — confirmed by introspection

- **No inbound-message webhook exists.** Full `WebHookTopicEnum`: `APP_CONNECT`,
  `APP_DISCONNECT`, `CLIENT_*`, `INVOICE_*`, `JOB_*`, `JOB_CLOSED`, `PROPERTY_*`, `QUOTE_*`,
  `QUOTE_SENT`, `QUOTE_APPROVED`, `REQUEST_*`, `VISIT_*`, `PRODUCT_OR_SERVICE_*`, `PAYMENT_*`,
  `PAYOUT_*`, `TIMESHEET_*`, `EXPENSE_*`, `ON_MY_WAY_TRACKING_LINK_REQUEST`,
  `MARKETING_ITEM_UPDATE`, `USER_*`. Nothing messaging-related.
- **The API cannot read texts.** `Client.messages` exists but returns
  `MessageInterfaceConnection`, whose node type is not exposed. Live errors:
  `Field 'nodes' doesn't exist on type 'MessageInterfaceConnection'` and
  `Field 'node' doesn't exist on type 'MessageInterfaceEdge'`. `__type(name:"MessageInterface")`
  returns `null`. Polling is out as well as webhooks.
- **No mutation sends a text.**
- **Permissions are UI-only.** `userEdit` accepts a name and nothing else — team permissions and
  notification settings cannot be scripted.

Jobber's texting is a closed box. A routing layer built *on* it is not difficult, it is impossible.

### The routing key exists and works

What we would route *by* is fully available. Verified end to end:

```
phone 2539887254 → client "Dave Sinner" → next visit (job #8318, in 2 days) → Luke LaVergne
```

Phone → client → visit → `assignedUsers` resolves in one call chain, and Jobber's `searchTerm`
normalizes phone formats (`+1 (425) 213-3344` matches a number stored as `425-213-3344`).

**The missing piece is the messaging platform, not the logic.**

---

## Ruled out (checked, don't revisit)

- **Giving techs the Jobber texting permission.** Does not require admin, but grants access to
  *all* messages and *all* clients with no scoping, and requires Show pricing / View quotes /
  View invoices alongside it. Because read state is account-wide, adding 5 more viewers to an
  unowned inbox makes the "someone else must have got it" failure worse, not better.
- **Per-user numbers inside Jobber.** Do not exist. One dedicated number per account, unchangeable
  once selected, used by every employee. Confirmed at source.
- **CallRail.** Already paid for and it does texting, so it was checked properly. Same failure
  mode: every agent with Lead Center access sees every incoming text, with no per-conversation
  assignment. Does not solve routing.
- **Zapier / n8n / custom build on Jobber texting.** No inbound-message webhook exists and the
  API cannot read messages. Verified by introspection, not assumed.
- **Keeping 253-300-0889.** Jobber dedicated numbers cannot be ported out. Confirmed.

**The locked constraint:** there is no configuration in which the conversation stays on Jobber's
number AND gets assigned to a tech. Every remaining option involves conversational texting moving
off Jobber. Jobber keeps automated messaging (reminders, On My Way, quote/invoice sends).

---

## Options

### Option 0 — Per-tech direct numbers (no routing required)

The option that most directly answers "texts should reach the correct tech." Each tech gets a
company-owned direct texting number. The On My Way and reminder messages carry that tech's line
("This is Luke from Got Moles, I'm on my way — reply here"). The customer texts the tech. There
is nothing to assign, no dispatcher, no relay.

- **Pro:** solves the stated problem by construction; no router to build; simplest to explain.
- **Con:** no central history or oversight. If a tech leaves, the customer relationship walks with
  the thread — unless the numbers are company-owned inside one platform, which they should be.
- **Important:** this is the *same purchase* as Option 2. Quo and JustCall both provide per-user
  direct numbers AND a shared inbox. This is a configuration choice, not a separate vendor.

### Option 1 — Tighten Jobber process (free, this week, partial)

Bandaid, not a fix. Because read state is account-level, shared ownership *is* no ownership; the
only thing that works inside Jobber is one named human owning the inbox at a time.

- Restrict the two-way texting permission to the office/dispatch group only. Techs as non-admins
  gain nothing from it today — it adds noise, not coverage.
- Name a **daily text desk**: one person owns the inbox for the day, by name, on the schedule.
- Set text notifications to that small group rather than everyone.
- Buys months, not years. Does not survive 10 techs.

### Option 2 — Move texting to an inbox with real ownership (the fix)

Both candidates give assign-to-teammate, per-user unread, internal comments, and — critically —
an **inbound-message webhook**, which is what unlocks Option 3.

| | Quo (formerly OpenPhone) | JustCall |
|---|---|---|
| Price | ~$15–19/user/mo | from $29/user/mo |
| Usage | unlimited US/CA calls + texts on base | call/text caps, overage billed |
| Jobber integration | native (Business/Scale plan) | via Zapier/API |
| At 5 users | ~$75–95/mo | ~$145/mo |
| At 10 users | ~$150–190/mo | ~$290/mo |

**Quo caveat — read this before dismissing it.** Quo was rejected on this install for Muhammad's
line, but that was a *voice* failure: no inbound DTMF, and it seized the line before the CallRail
fallback could fire. Neither applies to texting. Quo is worth re-opening **for the text lane only**,
with voice staying on CallRail.

**Recommended configuration — Options 0 and 2 together:** one main text number for new and
unknown inbound (office assigns it, or the router assigns it automatically), plus each tech
carrying a direct line for their active jobs. Per-tech numbers stop most inbound from ever needing
routing; the shared inbox catches the rest and preserves history. This is what scales past 10.

**The one real cost:** 253-300-0889 cannot be ported out, so customers who text it after the
switch get silence. Mitigation: keep Jobber's automated texting running through the transition so
the old number stays live, and put the new number in every outbound message. Self-corrects in
roughly six months. The main line 253-750-0211 is unaffected.

### Option 3 — Auto-router on top of Option 2 (where this gets dialled)

Inbound text → normalize number → Jobber client lookup → next/last visit → assigned tech →
auto-assign the thread to that tech and @-mention them. Unknown number → sales queue.

Plus the piece that actually stops texts going unanswered:

- **SLA timer.** Unanswered after N minutes → escalate to office → then to Spencer.
- **Daily digest** of unanswered threads.

Assignment alone does not fix dropped messages; the escalation timer does.

**Dependency:** the n8n Jobber credential has been dead since 2026-07-24 and the replacement app
was rejected. This install's own Jobber app works, so the router runs as a local Agentic OS cron
instead and is not blocked on n8n.

---

## DECISION (2026-08-06, Spencer): Path A — own the desk

**Why Options 0 and 2 were rejected.** Per-tech numbers do not help, because *customers reply to
whatever number texted them*, and Jobber sends every reminder, On My Way, quote and invoice from
253-300-0889. Confirmed at source: *"In either case, these messages are not sent via your
employee's phone number."* Per-tech numbers only capture conversations the tech initiates — a
small slice. Inbound would keep landing in the shared Jobber inbox.

The only way to move inbound is to stop Jobber being the sender — switch its automated
notifications to email-only and rebuild reminders/On My Way on another platform driven by Jobber
webhooks (`VISIT_CREATE`, `VISIT_UPDATE`, `ON_MY_WAY_TRACKING_LINK_REQUEST` all exist). That is a
notification system to own and maintain, and it forfeits Jobber's client communication log. Not
worth it before the cheap option has been tried.

**Path A: stop trying to move the number; fix ownership instead.** Inbound stays on
253-300-0889. One named person owns that inbox each day. When a text arrives, the desk tool
resolves the number to the owning tech instantly. Most inbound (scheduling, "are you coming
today", arrival questions) the desk answers directly; job-specific questions get the tech looped
in. Cost: $0. Scales by adding desk hours rather than re-architecting.

Revisit Path B only if, after a month of the desk running, volume genuinely justifies owning a
notification system.

---

## Deliverables built

| File | What it is |
|---|---|
| `desk-server.mjs` + `desk-ui.html` | The text desk. Local web tool: paste a number or name, get the owning tech, job, program, property, and how to reach them. Includes an open queue so nothing sits unanswered. |
| `lib-resolve.mjs` | Shared ownership-resolution logic used by both the desk and the CLI. |
| `route-inbound-text.mjs` | CLI form of the same lookup, for terminal use and scripting. |
| `tech-contacts.json` | Fallback tech contacts. Preferred source is a Jobber **team custom field** — see below. |
| `README.md` | Operator guide for whoever runs the desk. |

Run it: `node projects/briefs/jobber-text-routing/desk-server.mjs` → <http://localhost:8787>

### Tech phone numbers: team custom field, never the profile phone field

**Rejected — putting tech numbers in the Jobber user profile.** Spencer: doing this makes Jobber
offer the tech's personal number as the On My Way callback, customers then contact that line
directly, the office never sees the conversation, and it leaves with the tech. Loss of visibility
is a worse failure than the routing problem being solved. The On My Way callback stays on the
**Office number** deliberately.

**Adopted — Jobber's documented workaround:** *"a team custom field can be set up as a way to
record their number which will not add it as a callback option for on my way texts."* Create a
Team custom field (Text) whose label contains phone/cell/mobile/contact; `lib-resolve.mjs` reads
it via `User.customFields` and prefers it over the local file. Profile phone stays blank.

Note: `customFieldConfigurations` is blocked for this app ("hidden due to permissions"), so the
field must be created in the Jobber UI — but reading `User.customFields` works fine.

### Ownership logic

Deliberately platform-agnostic: it takes a phone number or client name and returns a routing
decision. If conversational texting ever moves to a platform that emits an inbound-message
webhook (Path B), this is the function that webhook calls — no rework.

**Priority order:**

1. Tech on the **next scheduled visit** — they are about to walk the property. Confidence: high.
2. Tech on the **most recent completed visit**, within 120 days — the customer is replying about
   work just done. Confidence: high ≤21 days, medium beyond.
3. Nobody → office/sales queue.

**Handles:** any phone format; numbers shared by multiple clients (flags for human confirmation);
leads and archived clients; numbers where Jobber has SMS disabled; Jobber's query-cost limiter
(exponential backoff on `THROTTLED`).

**Test result — 6 real numbers from visits completed 2026-08-05, 6/6 resolved, all high confidence:**

| Number | Client | Routed to | Basis |
|---|---|---|---|
| 4258291954 | Barbee Mill HOA | Cory Ventura | next-scheduled-visit |
| 9548296640 | Jeff Nugent | Cory Ventura | next-scheduled-visit |
| 4252133344 | Marianne Parasida | Cory Ventura | next-scheduled-visit |
| 2537778989 | Jill Robinson | Luke LaVergne | next-scheduled-visit |
| 4254422264 | Howard Goodman | Cory Ventura | next-scheduled-visit |
| 2534058629 | Derek Smith | Cammeron Anderson | next-scheduled-visit |

Name search ("Dave Sinner") and unknown numbers both behave correctly — unknown falls through to
`desk answers` (exit code 3).

**Bug found and fixed during testing.** The first version paged visit history and picked Howard
Goodman's "next scheduled visit" as one assigned to Spencer — actually a phantom visit dated
**2036**, an artifact of the known Tavis 3,982-visit scheduling defect. Any "first N visits"
approach can silently latch onto those. The fix pins the query to a date window (150 days back,
90 days forward) via `filter:{startAt:{after,before}}`, which both corrects the answer and cuts
query cost enough to stop tripping Jobber's cost limiter.

---

## Jobber cleanup checklist (UI-only — cannot be scripted)

Current active roster, from the live account:

Texting permission is not readable via the API — the Admin column is from the live account, the
last column must be confirmed in Manage Team.

| User | Admin | Sees inbound texts |
|---|---|---|
| Spencer Hill | owner | yes |
| Cory Ventura | admin | yes |
| Courtney | admin | yes |
| Kellen | admin | yes |
| Luke LaVergne | — | **check** |
| Cammeron Anderson | — | **check** |
| Alias Franks | — | **check** |
| Robert Norton | — | **check** |
| Muhammad Javed | — | **check** |
| Tavis Alexander | — | **check** |
| Roy Castleman | — | **check** |

Steps:

1. **Gear icon → Manage Team → [user] → custom permissions.** Audit who currently has the two-way
   text message permission — this is the unknown, and it cannot be checked via API. Remove it from
   field techs: it does not give them their own customers, it gives them *every* conversation on
   the account, plus the pricing and invoice access the permission requires.
2. **Settings → Emails and Text Messages → notifications.** Narrow the notified list to the text
   desk group, not all admins.
3. **Name the daily text desk** on the schedule — one person per day, by name. This is the only
   control that works against account-level read state.
4. **Separately:** 9 deactivated users remain on the account (Chris, Jeff Mitchell, Kathy Hill,
   Brooke Jessen, Kaelyn Holten, Brayden Rich, Jack Spence, Brandon Boone, a duplicate Roy
   Castleman). Not a texting issue — worth a tidy-up pass.

---

## Open decisions

1. Quo (text-only) vs JustCall — needs a trial on both.
2. ~~Number strategy~~ — **resolved.** 253-300-0889 cannot be ported out of Jobber, so the new
   platform issues new numbers. Jobber's automated texting stays live during transition.
   Open sub-question: how long to run both before turning Jobber texting off.
3. Does Jobber keep any texting role after the move (e.g. automated reminders and On My Way),
   or does everything move? Recommend: keep Jobber's *automated* messages, move all
   *conversational* texting.
4. SLA thresholds for escalation — first response target, and who is tier 2 / tier 3.

## Open threads

- Router is built and tested but not wired to any platform — blocked on decision 1.
- Jobber permission cleanup is Spencer's clicks; not actionable via API.
