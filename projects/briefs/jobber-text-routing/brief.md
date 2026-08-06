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
   per-crew numbers. Note this is NOT the brand number — 253-326-1740 is the main business line
   and does not move. 253-300-0889 appears nowhere in the site, GBP, or client phonebook;
   customers only have it because Jobber texted them from it.
2. **Conversations cannot be assigned to a person.** Jobber's only "reassign conversation"
   moves a thread to a *different client* sharing the same phone number. There is no
   assign-to-teammate.
3. **Read state is account-level.** Per Jobber's own docs: when one user opens a message it
   shows as read for every user, including those who never saw it. This is the single largest
   driver of dropped texts.
4. **Notification targeting is all-or-nothing.** You choose which team members are notified of
   *every* inbound text. You cannot notify only the tech who owns that customer.
5. **No middle permission tier.** Admins see all inbound messages; non-admins with the texting
   permission see only *outbound* messages on records they can already access. There is no
   "this tech sees just their own customers" setting.

**Consequence of #5, measured on the live account:** of 11 active users, exactly **4 are account
admins** — Spencer Hill (owner), Cory Ventura, Courtney, Kellen. Those four are the only people
who see inbound customer texts at all. The field techs — Luke LaVergne, Cammeron Anderson,
Alias Franks, Robert Norton, Muhammad Javed — see **nothing** inbound.

So the real shape of the problem is not "five techs in one inbox". It is: **four admins share one
unowned inbox, and every customer text about a tech's job has to be manually relayed to that
tech.** Making a tech an admin so they can see their own customer's texts would also expose full
account financials. That is the wall.

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

- **Make techs Jobber admins.** Admin is the only tier that sees inbound texts. It also exposes
  full account financials, and because read state is account-wide, adding 5 more viewers makes
  the "someone else must have got it" failure worse, not better.
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
roughly six months. The brand number 253-326-1740 is unaffected.

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

## Recommendation

1. **This week:** Option 1 cleanup (checklist below) as a bandaid.
2. **Now:** trial Quo text-only against JustCall. One purchase covers Options 0 and 2 — the
   decision is which vendor, not which architecture.
3. **First configuration:** per-tech direct numbers (Option 0). It removes most of the routing
   problem immediately and needs no engineering.
4. **Then:** shared inbox for new/unknown inbound, with the router (Option 3) auto-assigning and
   an SLA timer escalating anything unanswered.

Do not build the router before the platform is chosen — roughly a day of work, wasted if the inbox
changes underneath it.

---

## Deliverable built: `route-inbound-text.mjs`

Platform-agnostic routing brain. Takes a phone number, returns a routing decision. Whatever
platform we land on calls it from its inbound-message webhook and performs the assign/notify in
its own API.

```
node projects/briefs/jobber-text-routing/route-inbound-text.mjs "(253) 988-7254"
node projects/briefs/jobber-text-routing/route-inbound-text.mjs 2539887254 --json
```

**Ownership rule, in priority order:**

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
| 4254422264 | Howard Goodman | Spencer Hill | next-scheduled-visit |
| 2534058629 | Derek Smith | Cammeron Anderson | next-scheduled-visit |

Unknown numbers correctly fall through to `office-sales-queue` (exit code 3).

Note on Howard Goodman: Cory completed the last visit but the *next* visit is assigned to Spencer,
so the rule routes to Spencer. Correct per the rule, and a useful side effect — it surfaces that
Spencer is carrying a field visit, which is against his peninsula-Tuesday-only role.

---

## Jobber cleanup checklist (UI-only — cannot be scripted)

Current active roster, from the live account:

| User | Admin | Sees inbound texts today |
|---|---|---|
| Spencer Hill | owner | yes |
| Cory Ventura | admin | yes |
| Courtney | admin | yes |
| Kellen | admin | yes |
| Luke LaVergne | — | no |
| Cammeron Anderson | — | no |
| Alias Franks | — | no |
| Robert Norton | — | no |
| Muhammad Javed | — | no |
| Tavis Alexander | — | no |
| Roy Castleman | — | no |

Steps:

1. **Gear icon → Manage Team → [user] → custom permissions.** Confirm the two-way text message
   permission is on only for the office/dispatch group. Remove it from field techs — it gives them
   outbound-only visibility and adds confusion.
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
