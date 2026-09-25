# Campaign Brief — TMCP Autopay Conversion

**Date:** 2026-09-09 · **Channel:** Email (+ collections handoff)
**Status:** DRAFT — awaiting Spencer's approval · **Approved:**

## The one sentence

Ask the ~502 TMCP customers who are billed by hand to authorize automatic payment — starting with the majority who already have a card on file, where the ask is one question, not a form.

## Why now

Today's TMCP audit (2026-09-09, live Jobber sweep):

| | | Tag |
|---|---|---|
| TMCP MRR | $80,885.94 | `KNOWN` |
| On autopay | 218 jobs — **29.7%** of jobs, **26.4% of dollars** | `KNOWN` |
| Hand-billed | 517 jobs / 502 clients — **$59,546/mo** | `KNOWN` |
| New sales since 08-25 that went on autopay | **0 of 29** | `KNOWN` |
| Past due 14+ days, right now | **$5,969** across 29 clients / 35 invoices | `KNOWN` 17:21 PT |
| — of which the client already has a card on file | **$3,779** (17 clients) | `KNOWN` |

Autopay share has fallen every audit — 31.6% (08-19) → 30.7% (08-25) → 29.7% (09-09) — not because anyone cancelled, but because **every new sale lands hand-billed**. The book is growing faster than the autopay count, which has not moved in three weeks.

**Read that last line twice: this campaign cleans up a backlog that is refilling itself.** See "Do this first" below.

## Audience

Source: `autopay-target-tiers.mjs` (2026-08-11, 449 clients with autopay off) reconciled against today's audit (502 hand-billed clients). Tier counts are `ESTIMATE` until re-pulled — **required before send**, see the send gate.

| Tier | Definition | Count | Past due | The ask |
|---|---|---:|---:|---|
| **T1** | Card on file **+ past due** | 40 | $5,679 | → **collections lane, not this campaign** |
| **T2** | Card on file, current | **237** | $0 | **"May we charge the card you already have?"** |
| **T3** | No card **+ past due** | 37 | $8,740 | → **collections lane, not this campaign** |
| **T4** | No card, current | 135 | $0 | "Put a card on file" |

**277 of 449 — 62% — already have a card on file.** That is the finding that shapes this whole campaign. For most of the list this is not a card-capture exercise. They have already trusted Got Moles with a card; what is missing is permission to charge it on a schedule. That is a one-sentence email, not a sales pitch.

### Reachability — checked live, not assumed

Pulled every hand-billed client's email from Jobber, 2026-09-09 (`data/2026-09-09_handbilled-contactability.json`):

| | | Tag |
|---|---|---|
| Distinct hand-billed clients | 502 | `KNOWN` |
| **With an email address on file** | **489 — 97.4%** | `KNOWN` |
| Without | 13 | `KNOWN` |
| Monthly value reachable by email | **$57,817** | `KNOWN` |
| Monthly value not reachable | $1,110 | `KNOWN` |

Email is a real channel for this audience — no list to build, no data gap to close first. **The 13 without an email are a phone list for the office, not a campaign problem.**

### Waves

- **Wave 1 — T2, minus tippers.** The money wave. Highest yield per email in the whole program.
- **Wave 2 — T4 (~135).** Heavier ask; needs a reason, not just a request.
- **Wave 3 — T1 and T3 (~77): no separate email.** Fold the autopay ask into the collections conversation they are already in.

### Suppressions — check every time

- Anyone in the active collections queue (`collection-state.json`) — **never chase and upsell in the same week.** This is why T1/T3 are handled in the collections lane instead.
- Every client already on autopay (218 jobs) — never sell someone what they already have.
- Anyone who has ever unsubscribed, from any list.
- Anyone with an open complaint or unresolved service issue — **ask the office; Jobber will not know.**
- The 11 comp / zero-charge jobs (Marcus Andy, Susan Newby, Jeff Hunter, Rich Porter, Karen Porter, Steve Hewitt, Jamie Randall, Sally Gasser, Barry Heimbigner, Donald Kaplan, Leena Shah) — asking someone to set up automatic payment on an account we do not bill is the worst possible email.
- **#8056 Madera West Condos** — prepaid two quarters; no invoice due until ~2027-01-01.
- Commercial accounts — different decision-maker, different process. Handle by phone.
- **Any client with a recorded tip in the last 12 months — 70 clients, $6,630/mo.** See the tips section below; this is the suppression that makes the campaign worth running at all.

## Offer

There is no discount and none is needed. Autopay is being sold on **convenience and never getting a late notice**, not price.

**Do not offer a discount for autopay.** It would cost real margin across 502 clients to buy something most will say yes to for free, and it permanently reprices the base. If uptake stalls below the kill criterion, revisit — as a one-time credit, never an ongoing rate.

## The consent problem — read before writing a single word

**Autopay cannot be switched on because a card is on file.** A stored card authorizes the charge the customer agreed to, not an open-ended recurring one. Card-network stored-credential rules and FTC negative-option rules both require explicit consent with an auditable record. `ESTIMATE` — the shape is well established; **verify current requirements before the first send.**

Practical consequences for the copy, all non-negotiable:

1. **State the amount** — their actual monthly figure, merged per client, not "your monthly rate."
2. **State the frequency and the date** it charges.
3. **State that it continues until they stop it.**
4. **State how to stop it** — one reply or one phone call, no hoops, no fee.
5. **Confirm a receipt goes out on every charge.**
6. **Record the yes** against the client in Jobber, with date and method. A verbal yes on the phone counts if it is logged; an assumed yes never does.

An email that says "we'll start charging your card unless you tell us not to" is a negative option and is the one version of this campaign that could actually cause a problem. **Opt-in only.**

## Compliance

`ESTIMATE` throughout — verify before the first send, per `references/email-playbook.md`.

- This is plausibly a **transactional / relationship message** under CAN-SPAM rather than a commercial ad: it concerns the billing terms of an existing ongoing subscription. That is a favorable reading, **not a settled one** — do not rely on it.
- Include the physical postal address and a working opt-out anyway. Costs nothing, removes the argument entirely.
- **WA RCW 19.190** applies to nearly every recipient (Washington residents) and attaches statutory damages to misleading subject lines and transmission info. The subject line must plainly describe the email. No curiosity-gap subjects on this campaign.
- **Never send this down the transactional text channel** because the consent is already there. Service texting consent is not marketing consent, and misusing it puts the arrival-window messaging at risk too.
- Legal entity for any platform verification: **Rainier Power Wash LLC**. Customer-facing name: Got Moles.

## Destination

Per-client **Jobber Client Hub** link. `Invoice.clientHubUri` already returns a per-client hub URI (`https://clienthub.getjobber.com/client_hubs/{uuid}/...`) — the collections scripts use it today, so the plumbing exists.

**This forces a merge send.** A broadcast with one generic link cannot work: every recipient needs their own hub link and their own dollar figure. Build the merge file from the same Jobber pull that produces the segment.

## Sending mechanism — the open decision

Spencer's note: no access to office@got-moles.com from this install. Confirmed — I can neither read nor send from that mailbox, and I have not attempted to.

That is not the blocker, though. The real question is which system sends it:

| Option | Verdict |
|---|---|
| **Gmail from office@** | Fine for a **small batch** — Wave 3, or a 20-person pilot. Not for 237 in a day: no merge, no unsubscribe handling, no click tracking, and bulk sending from a shared mailbox risks the domain's reputation |
| **Jobber client emails** | Best fit for the *content* — per-client, already the system of record, hub link native. Confirm it can merge a custom message to a list rather than send one at a time |
| **HighLevel** | **Blocked** pending the DigiHammer audit — F-03. Do not put a new campaign inside a vendor system whose ownership is unresolved |
| **Standalone ESP** | Cleanest for merge + tracking + unsubscribe, but a new sending domain starts with zero reputation |

**Recommendation:** pilot Wave 1 with **50 T2 clients sent from office@ as a mail merge**, measure, then choose the system for the remaining ~187 based on what the pilot shows. This gets a real answer in a week without betting the domain or waiting on the vendor audit.

## The three numbers

CPBJ does not apply — **this campaign books no jobs.** Saying otherwise would be dressing up the wrong metric. What applies:

| Number | Projection | Basis |
|---|---|---|
| **Cost per conversion** | ~$0 media + office time | `KNOWN` — owned channel, no spend |
| **Payback** | Immediate | `KNOWN` — nothing to pay back |
| **Mix effect** | **The whole point** | Hand-billed recurring revenue is discounted heavily by any buyer; it is a collections process wearing a subscription's clothes. Converting $59,546/mo of hand-billed TMCP to autopay does not add a dollar of revenue — it makes the revenue already there **defensible**. This is an enterprise-value move, and it belongs in `acc-cfo`'s Value lens |

**Cash effect, separately:** $5,969 currently past due 14+ days, of which $3,779 sits on clients who already have a card. `KNOWN`, 2026-09-09.

### What hand-billing actually costs — sized 2026-09-09

Spencer's estimate: **~5 office hours per month** chasing payment. That number is worth taking seriously, because it makes the labor argument for this campaign **weak**, and the case has to stand somewhere else.

| Cost | Value | Tag |
|---|---|---|
| Office labor chasing payment | 5 h/mo ≈ **$1,800/yr** at ~$30/hr loaded | `KNOWN` hours (Spencer) × `ESTIMATE` rate |
| Cash permanently in float | **$11,219** sitting in the 1–14 day bucket on hand-billed clients; an autopay client never occupies that bucket. ~$900/yr at 8% cost of capital | `KNOWN` balance, `ESTIMATE` rate |
| Genuinely aged (15+ days) on hand-billed TMCP | **$3,594** | `KNOWN` |
| Annual write-off rate on hand-billed TMCP | **`UNKNOWN`** — Jobber holds no clean bad-debt figure. The 90+ bucket is $185 today, but that is a snapshot, not a year's flow |

**Honest total on cash and labor: roughly $3,000–5,000/yr.** Not nothing, and not a number that justifies a heavy lift on its own. **Do not oversell this as a cost-saving project.**

### The number that does justify it

Past-due rate, hand-billed vs autopay, both measured from the same 2026-09-09 17:21 PT Jobber pull:

| | Clients | Carrying a balance | Rate | Outstanding |
|---|---:|---:|---:|---:|
| **TMCP hand-billed** | 502 | **112** | **22.3%** | **$14,813** |
| **TMCP autopay** | 212 | **5** | **2.4%** | **$697** |

**One in every 4.5 hand-billed customers is carrying a balance right now. One in 42 autopay customers is.**

And the autopay failures are not a mystery — `autopay-not-collecting.json` (2026-09-01) identifies all 5 as **dead cards**, $482 total. So autopay's residual failure rate is ~2.4% and it is *detectable and fixable*, where hand-billed non-payment is a recurring manual chase forever.

**The honest caveat:** some of that gap is selection, not mechanism. Customers who agreed to autopay may simply be better payers. Nothing here separates the two, so treat 22.3% → 2.4% as the ceiling of what conversion achieves, not the forecast. The mechanism argument still holds on its own: an automatic charge does not depend on the customer remembering.

**Known trap:** Jobber writes **no PaymentRecord for a declined charge** — 0 FAILED rows in 4,258 records since 2026-06-01. A dead card is invisible except as *autopay on + invoice unpaid after the nightly run*. Converting 237 clients to autopay without running that check on a schedule just moves the failure somewhere quieter. **`autopay-not-collecting.mjs` must be on a recurring check before Wave 1 scales.**

### ⚠️ Tips — Spencer's objection, and it is correct

Spencer, 2026-09-09: *"autopay customers don't pay tips and my guys love the tips."*

Measured against every Jobber payment record since 2026-06-01 (4,450 records, `data/2026-09-09_tip-analysis.json`):

| Segment | Payments | Carried a tip | Rate | Tips |
|---|---:|---:|---:|---:|
| **TMCP autopay** | 1,523 | **1** | **0.1%** | $10 |
| **TMCP hand-billed** | 2,379 | **132** | **5.5%** | **$2,017** (avg $15.28) |
| Non-TMCP (Quick Fix etc.) | 561 | 27 | 4.8% | $1,328.75 (avg $49.21) |

**Autopay does not reduce tipping — it eliminates it.** 0.1% against 5.5%, a ~55× difference. One tip, ten dollars, in 1,523 autopay payments across three months. The mechanism is obvious: autopay removes the checkout screen, and the checkout screen is where the tip prompt lives.

**Size of it: $2,017 over 3.3 months ≈ $611/mo ≈ $7,300/yr** on the hand-billed TMCP book.

**That is larger than the entire cash-and-labor case for this campaign ($3,000–5,000/yr).** Converting the whole hand-billed book would take more out of the technicians' pockets than it puts into the company's. It does not appear on the P&L — it is not company money — but it is real compensation to the people hardest to replace.

**A blanket conversion is the wrong campaign, and this objection kills it.**

### The fix: convert the non-tippers, leave the tippers alone

Tipping is not spread evenly. Of 456 hand-billed clients who made a payment since June 1:

| | Clients | MRR | Tips |
|---|---:|---:|---:|
| **Have tipped at least once** | **70** (15.4%) | **$6,630/mo** | $2,017 |
| **Never tipped** | **386** (84.6%) | **$52,297/mo** | $0 |

**Suppress the 70 tippers. Convert the 386 who have never tipped.** That keeps 100% of the tip income and still converts **89% of the hand-billed dollars** — $52,297/mo of the $58,927/mo. The objection costs the campaign 11% of its reach and none of its value.

Add to the suppression list: **any client with a recorded tip in the last 12 months.**

**Caveats, both real:**

1. **This only sees Jobber Payments card and ACH tips.** `tipAmount` exists only on those record types — cash tips at the door are invisible here and almost certainly continue regardless of billing method. So the measured figure is the floor of what is at risk, and the true tipping picture is better than these numbers show.
2. **The window is 3.3 months.** A customer who tips once a year reads as a non-tipper. **Re-run over 12 months before the send** and suppress on that wider list — it will move some clients out of the convertible segment and that is the safe direction to be wrong in.

### Worth considering separately: decouple the tip from the payment

If tipping matters to technician pay — and $7,300/yr across the field team says it does — then tying it to the checkout screen is fragile regardless of this campaign. A "tip your tech" link in the job-complete message would let tipping survive autopay entirely, and would open it to the 218 clients already on autopay who currently have no way to tip at all. That is a Roy/Jobber build, not a campaign, and it is the version where both things win. **Flagging, not proposing — it needs its own sizing.**

### So why do it

Not for the $3–5K. For three reasons, in order:

1. **It is nearly free.** Owned channel, no media cost, ~5 hours of office time to process a wave.
2. **Enterprise value.** Recurring revenue collected by hand is a collections process wearing a subscription's clothes, and it gets discounted accordingly. Moving $59,546/mo onto automatic charge changes how defensible that revenue looks without adding a dollar to it. This is the largest number on the page and it is `acc-cfo`'s Value lens, not this year's cash.
3. **It stops 112 customers being chased.** The relationship cost of a collections text does not appear in any of the tables above.

**What would change the sizing:** the actual annual write-off on hand-billed TMCP. If it is meaningfully above ~$5K/yr, the cash case alone carries this and the campaign should be bigger and faster. That figure has to come from the bookkeeper — it is not in Jobber.

## Tracking plan

Per send: segment and size, delivered, clicks, **autopay authorizations recorded**, unsubscribes, complaints. Report authorizations — not opens. Apple Mail Privacy Protection makes open rates close to meaningless and an email program judged on opens optimizes for clever subject lines and produces nothing.

The measurement is clean here in a way most campaigns are not: **re-run the TMCP audit and count `willClientBeAutomaticallyCharged`.** The number either moved or it did not.

Baseline to beat, 2026-09-09: **218 autopay jobs, 29.7% of jobs, 26.4% of dollars.**

## Kill criterion — written before launch

**If the 50-client Wave 1 pilot produces fewer than 5 recorded authorizations within 10 days of send, the email approach stops** and the ask moves to the phone — folded into the call the office already makes, and into every new sale at signup. Email would have proven it is not the right channel for this and no amount of rewriting the subject line fixes that.

## Capacity check

No field capacity impact — nothing here books a visit. The load is **office** load: processing authorizations, recording consent against each client, and flipping the auto-charge flag per job. At an optimistic 30% uptake on Wave 1 that is ~70 client records to update. **Confirm with the office that this is a week they can absorb it** before sending, or the authorizations arrive and sit.

## Launch gate

- [ ] **Segment re-pulled** — `autopay-target-tiers.mjs` (Aug 11 data is a month stale; the book has grown by 53 clients since)
- [ ] Suppression list applied and counted, including the live collections queue
- [ ] Consent mechanics verified against current card-network / FTC requirements
- [ ] Merge file built with per-client amount + hub link
- [ ] Test send received on a real device, links clicked, merge fields checked
- [ ] Office confirmed it can process the responses
- [ ] Claims gate passed
- [ ] **Spencer approved this exact copy and this exact segment**

---

# Do this first — it is worth more than the campaign

**0 of 29 new TMCP sales since 08-25 went on autopay.** The autopay count has not moved in three weeks while the book added 41 jobs. Every week that continues, this campaign's backlog grows by roughly 13 clients.

Converting 237 existing customers is a one-time win that decays. **Making autopay the default at signup captures every sale from here forward, permanently, at zero marginal cost.** It is a change to the booking script and the sale flow, not a campaign — and it is the single highest-return item in the whole TMCP audit.

The ask at the point of sale is also far easier than by email: the customer is on the phone, they have already decided to buy, and the card conversation is happening anyway.

**Recommendation: fix the signup default before Wave 1 sends.** Otherwise this campaign is bailing with the tap running.

---

# Email copy — DRAFT, not approved

Merge fields: `{FirstName}` `{Amount}` `{ChargeDay}` `{HubLink}` `{OfficeSenderName}`

**Send it from a person, not "The Got Moles Office."** A named sender at office@got-moles.com gets replied to; a department does not — and the whole Wave 1 conversion depends on someone hitting reply. Spencer to name who.

## Wave 1 — T2: card on file, current (~237)

**Subject:** Can we put your Got Moles payment on autopay?

**Preview text:** You've already got a card with us — we just need your OK to use it.

> Hi {FirstName},
>
> You've got a card saved with us from a previous payment. We'd like your OK to use it for your monthly Total Mole Control payment, so the invoice stops landing on your to-do list.
>
> Here's exactly what that means:
>
> - **{Amount}** charged on the **{ChargeDay} of each month**
> - A receipt emailed to you every time
> - It continues until you tell us to stop — reply to this email or call us, and it stops. No fee, no notice period
> - Nothing else changes. Same visits, same technician, same guarantee
>
> **If that works for you, just reply "yes" to this email.** That's all we need.
>
> Prefer to set it up yourself? You can do it here: {HubLink}
>
> And if you'd rather keep paying by invoice, no problem — no need to reply at all.
>
> {OfficeSenderName}
> Got Moles
> office@got-moles.com · [phone]
> [physical postal address]
>
> *You're receiving this because you have an active Total Mole Control account with us. [Unsubscribe from emails like this].*

**Why it's built this way**
The whole email is one question, and the answer is one word. The bullets exist because consent has to be specific and auditable — amount, date, receipts, and how to cancel — and burying any of those is what turns a helpful email into a negative-option problem. "No need to reply at all" is deliberate: it makes saying no free, which is what makes yes trustworthy. No discount, no urgency, no deadline. There is nothing to be urgent about, and manufacturing it here would be the one thing that makes a routine billing note feel like a sales pitch.

## Wave 2 — T4: no card on file, current (~135)

**Subject:** A simpler way to pay for your Total Mole Control visits

**Preview text:** Add a card once and the monthly invoice takes care of itself.

> Hi {FirstName},
>
> Quick, practical one.
>
> Right now your Total Mole Control payment goes out as an invoice each month, which means it needs your attention every time — and if it slips past you, you get a reminder from us that neither of us enjoys.
>
> You can put a card on file instead. **{Amount}** on the **{ChargeDay} of each month**, receipt emailed every time, and you don't think about it again.
>
> Set it up here: {HubLink}
>
> - It continues until you tell us to stop. Reply to this email or call — no fee, no notice period
> - Your card details are stored with our payment processor, not with us
> - Nothing about your service changes. Same visits, same technician, same guarantee
>
> If you'd rather keep paying by invoice, no problem at all — that option isn't going anywhere.
>
> {OfficeSenderName}
> Got Moles
> office@got-moles.com · [phone]
> [physical postal address]
>
> *You're receiving this because you have an active Total Mole Control account with us. [Unsubscribe from emails like this].*

**Why it's built this way**
This one has to earn a form-fill, so it opens with the actual reason a customer would want it — not "convenience" as an abstraction but the specific irritation of a monthly task and a reminder email. Naming the awkwardness out loud ("that neither of us enjoys") is closer to how Spencer talks than a polished benefit statement, and it makes the ask feel like housekeeping between two people rather than a collections move. "Stored with our payment processor, not with us" pre-empts the objection that stops most card-on-file requests. Same free exit as Wave 1.

## Wave 3 — T1 and T3: fold into collections, no separate email

These 77 clients are mid-collections. A separate campaign email lands next to a payment chase and reads as tone-deaf.

Use this as the **close of the existing collections conversation** instead — the moment someone has just paid is the single highest-converting moment for this ask in the whole program:

> Thanks {FirstName}, that's received and you're all square.
>
> Want to skip this next time? We can charge {Amount} automatically on the {ChargeDay} of each month, with a receipt each time, and stop it whenever you say. Just reply "yes" and I'll set it up.

**Coordinate with `send-collection-texts.mjs`** so nobody receives a collections text and a billing email in the same week.

---

## Claims gate

1. **No forbidden claim.** No I-713, no "#1", no "15 years", no haul-away, no mechanism language. ✓
2. **Every number traced.** The only numbers customer-facing are the client's own amount and charge date, merged from Jobber. No review counts, no client counts, no company claims. ✓
3. **No unresolved conflict asserted.** The F-02 client count and F-05 review figures do not appear. ✓
4. **Paid posture:** N/A — not a paid channel. ✓
5. **Positioning:** no trapping language; nothing contradicts chemical-free/safe. **US English throughout** — "authorize", "canceled" if used, "check". ✓
6. **Pricing:** no price is quoted. Each client sees only their own existing rate. ✓

## Humanizer

Run both emails through `tool-humanizer` **deep** mode (a voice profile exists) before the test send.

## Results — filled after the fact

| | Baseline 09-09 | Projected | Actual |
|---|---|---|---|
| Autopay jobs | 218 | | |
| Autopay % of jobs | 29.7% | | |
| Autopay % of dollars | 26.4% | | |
| Hand-billed $/mo | $59,546 | | |
| Past due 14+ days | $5,969 | | |

**What we learned:**
