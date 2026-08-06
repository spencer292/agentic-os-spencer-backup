# Jobber for Muhammad — Create the Client, Send the Quote

**For:** Muhammad · **Date:** 2026-08-05
**Scope:** two new jobs — build the client record, send the quote.
**Not yours:** scheduling a **brand-new** customer once their quote is approved. That goes
to Cory. Your existing-customer booking (the address lookup, the zip route day, everything
in `2026-08-03_service-day-scripts.md`) is unchanged — see Step 5.

Everything below is how the Got Moles account is actually set up — the line-item names, the
quantities, the deposits, all of it comes from the last 40 real quotes in the account.
Match these exactly and your quotes look identical to Spencer's.

---

## The whole job in one line

**Search first → build the client → build the quote → send it → tag it for Cory.**

That's it. Five steps. The rest of this doc is the detail inside each one.

---

# Step 1 — Search before you create. Every single time.

Before you type a single new client, search the name, then search the phone number, then
search the street address. Three searches. Ten seconds.

**Why this is rule number one:** the account has 4,366 clients and an audit in July found
**97 duplicate groups — 114 extra records**. Twenty-three of those groups were *full record
plus full record*: someone in the office manually created a client who was already there.
That's the exact mistake you're in a position to make, and it's the expensive one — the
customer's whole service history, their past quotes, their notes, all of it ends up split
across two records and nobody can see it.

**How to search properly in Jobber:**

| Search this | Because |
|---|---|
| Last name | Catches "Bob Smith" vs "Robert Smith" |
| Phone number, digits only | Catches CallRail stubs with no name yet |
| Street number + street name | Catches spouses under different last names |

**What you'll often find instead of nothing:**

- **A record with just a phone number and no name.** That's a CallRail stub — the phone
  system created it when the call came in. **Do not create a new client. Fill that one in.**
  This is the single biggest source of duplicates in the account.
- **A full record from years ago.** Great — that's a returning customer. Use it, and they
  may be owed a **Repeat Customer Discount** (see Step 3).

**If you're not sure whether the record you found is the same person — stop and ask.
Merging is fixable. A split history is a mess.**

---

# Step 2 — Build the client record

Fill in all of it. A half-filled record turns into someone else's problem later.

### Required, every time

| Field | Get it right |
|---|---|
| **First and last name** | Full last name, spelled back to them |
| **Phone** | Mobile if they have one. Leave **"Allow SMS"** checked — arrival texts go out on this |
| **Email** | Read it back letter by letter. **The quote goes here — a wrong email is a quote that never arrives** |
| **Property address** | Street, city, ZIP. The ZIP is what decides which day the tech comes |
| **Lead source** | How they found us — Google, ChatGPT, referral, saw the truck, repeat |

### Two things that are easy to get wrong

**Billing address vs. property address.** If the mail goes somewhere else — a rental, a
second home, a property manager — put the service location in the **property** and the
mailing address in **billing**. If they're the same, leave billing alone; Jobber copies it.

**Company vs. person.** If the caller is a business, an HOA, or a property manager, set the
record up as a **company** with the business name, and put the human as the contact. Don't
file a landscaping company under the name of whoever happened to call.

### Tags

The tags in use on real records right now:

`TMCP - Active` · `Schedule requested` · `Schedule booked` · `Commercial Property` ·
`Commercial Client` · `LARGE PROPERTY` · `Autopay` · `paid in full` · `noreview`

The `Voice Assist - *` tags are put on automatically by the phone system. Don't add or
remove those.

**Your tag is `Schedule requested`** — see Step 5. Ask Spencer before inventing a new tag;
a one-off tag nobody else uses is invisible.

---

# Step 3 — Build the quote

## 3a. First: are you even allowed to quote this one?

Ask two questions on the call, before any number comes out of your mouth:

1. **Residential or commercial?**
2. **Roughly how many acres?**

Then:

| Situation | What you do |
|---|---|
| Residential, 5 acres or under | **Quote it.** Table below |
| Residential, over 5 acres | **Do not quote.** In-person bid |
| Commercial — any size at all | **Do not quote.** In-person bid |

**Bids go to Cory.** Not Spencer — Spencer does no bids, residential or commercial. Take
the details, tell them someone will come out and walk the property, and hand it to Cory.

> **Never guess a price to fill a silence.** A number you make up is a number we have to
> honor. "Let me have Cory come walk it" is always a safe answer.

## 3b. The prices

**The Quick Fix — one month, weekly visits**

| Property size | Price | Deposit |
|---|---|---|
| 1 acre or under | **$450** | $150 |
| 1–3 acres | **$500** | $150 |
| 3–5 acres | **$600** | $150 |

The $150 is a setup fee, collected upfront, and it's covered by the no-catch guarantee: if
we catch nothing, that setup fee is all they ever pay.

**Total Mole Control Program — year-round**

| Property size | Monthly | Quote total (12 mo) |
|---|---|---|
| 1 acre or under | **$100/mo** | $1,200 |
| 1–3 acres | **$125/mo** | $1,500 |
| 3–5 acres | **$150/mo** | $1,800 |

TMCP is a **12-month commitment**, billed monthly.

## 3c. How to build each one in Jobber

Pick the line item from the product list — **don't type a custom line.** The product
carries the full description (what's included, customer responsibilities, the guarantee)
and that description is what the customer reads on the quote. This is why you leave the
**Title** and **Message** fields **blank** — the product does the talking. Every recent
quote in the account has both blank.

### Quick Fix

```
Line item:  The Quick Fix — One-Month Mole Control Program
Quantity:   1
Unit price: 450  (or 500 / 600 by acreage)
Deposit:    150
```

### TMCP

```
Line item:  Total Mole Control Program -- Year round protection
Quantity:   12          ← twelve, one per month
Unit price: 100  (or 125 / 150 by acreage)
Deposit:    0           ← no deposit on TMCP
Total shows as: 1,200
```

**The quantity of 12 is the part people get wrong.** TMCP is quoted as twelve months, not
as one line of $100. If your TMCP quote totals $100, you left the quantity at 1.

### If they want to see both options

Build **two separate quotes** on the same client — one Quick Fix, one TMCP — and send both.
That's a normal, good outcome, and it happens in the account regularly. A caller who asks
for both is a caller who's deciding, not a caller who's leaving.

## 3d. Discounts — read this part twice

Discounts go on as their **own line item, with a negative unit price.**

> ### ⚠️ Always check the total after adding a discount
>
> A discount line only takes money off if its unit price is **negative**. If you add a
> discount and the total goes **up**, the minus sign is missing — put it in front of the
> unit price.
>
> Military and First Responder were both saved wrong in the account (stored as +$50, so
> they *added* $50 to a quote). **Fixed 2026-08-05** — both are now -$50. But check the
> total anyway. It takes one second and it's the difference between a correct quote and a
> quote that charges a veteran an extra fifty dollars.

**And match the quantity to the program line:**

| On a… | Discount quantity | Meaning |
|---|---|---|
| Quick Fix (qty 1) | **1** | One-time amount off |
| TMCP (qty 12) | **12** | Per-month amount off, for twelve months |

Real examples from the account:

- Quick Fix $450 + Military Discount, qty 1, **-$50** → **$400**
- TMCP $100 × 12 + Repeat Customer Discount, qty 12, **-$15** → **$1,020**
- TMCP $100 × 12 + Senior Discount, qty 12, **-$10** → **$1,080**
- TMCP $100 × 12 + Neighboring Property Discount, qty 12, **-$50** → **$600**

Notice the same discount is a different number depending on the program — Repeat Customer
is -$75 once on a Quick Fix, but -$15 per month on a TMCP. **The saved default is a
starting point, not the answer.** If you don't know what a discount should be on a
particular quote, ask Spencer before you send it.

### One that is NOT a discount line: Friends and family

**Friends and family is $250, and it's positive on purpose.** It's a replacement price, not
a subtraction — you use it *instead of* the Quick Fix line, not underneath it.

```
Line item:  Friends and family
Quantity:   1
Unit price: 250          ← positive. This IS the price.
```

Don't add a Quick Fix line as well, and don't make it negative.

**Who gets what** — confirm with Spencer before applying any of these on your own:
Military, First Responder, Senior, Repeat Customer, Neighboring Property (when we're
already servicing next door), Friends and family.

---

# Step 4 — Check it, then send it

Before you hit send, four things:

1. **Is the total right?** Quick Fix = the tier price. TMCP = monthly × 12. If a discount
   made it bigger, fix the sign.
2. **Deposit right?** $150 on Quick Fix. $0 on TMCP.
3. **Is the email right?** Look at it once more. This is the one mistake that silently
   loses the customer — the quote goes nowhere and everyone assumes they ghosted us.
4. **Title and message blank?** Yes. Leave them.

Then send by email. Jobber adds the terms automatically — *"This quote is valid for the
next 30 days"* — you don't type that.

**Tell them what to expect before you hang up:**

> "I've just sent that to your email — it'll come from Got Moles. Open it up and there's a
> green Approve button at the bottom. Once you approve it, we'll get you on the schedule."

That sentence does real work: they know what to look for, they know it's from us, and they
know approving is the next step.

---

# Step 5 — Hand it to Cory

Jobber tells you when the customer opens the quote and when they approve it.

**When a quote comes back approved:**

1. Tag the client **`Schedule requested`**
2. Tell Cory — approved quote, which program, the city and ZIP

**A newly approved quote is Cory's to schedule.** You don't pick the day, you don't promise
a date. If they ask when we're coming:

> "Cory handles getting new customers on the schedule — he'll be in touch to lock in your
> first visit."

## This does NOT change your existing-customer booking

**The booking rules you already have — in `2026-08-03_service-day-scripts.md` — still
stand for customers who are already on the books.** Someone calls asking when we're next
coming, or needs a visit moved, or is on file with nothing scheduled: that's still you, off
the address lookup, on the zip's route day. Nothing about that changed.

The split is simple:

| Who's calling | Who schedules |
|---|---|
| Existing customer — next visit, reschedule, nothing booked | **You**, off the lookup |
| Brand-new customer whose quote just got approved | **Cory** |

If you're ever unsure which side of the line a call falls on, it's a new customer if this is
their first service with us. Ask Spencer if it's genuinely murky.

---

# The follow-up

A quote that's been sitting **unopened for 2 days** is worth a short call: *"Just checking
that quote landed in your inbox — sometimes it goes to spam."* Often it did go to spam, and
that call is the whole sale.

A quote **opened but not approved** is a different call. They read it and stopped. Ask what
gave them pause — that's a real question with a real answer, and usually it's price or
"I want to talk to my husband/wife." Both are workable.

---

# Stop and ask — don't guess

Come get Spencer (or Cory for bids) for any of these:

- Commercial, any size
- Residential over 5 acres
- Anyone asking for a discount you haven't been told they get
- A customer who says they're already a customer, and you can't find their record
- Anyone who's unhappy, disputing a charge, or asking to cancel
- Any price that isn't in the table above

**Nobody has ever been in trouble for asking. Wrong prices go out the door and become
promises.**

---

# The card

| | Quick Fix | TMCP |
|---|---|---|
| **≤1 acre** | $450 | $100/mo |
| **1–3 acres** | $500 | $125/mo |
| **3–5 acres** | $600 | $150/mo |
| **Quantity** | 1 | **12** |
| **Deposit** | $150 | $0 |
| **Over 5 acres / any commercial** | Bid — Cory | Bid — Cory |

**Search before you create · Quantity 12 on TMCP · Check the total after a discount · Check
the email · New approved quote → tag `Schedule requested`, tell Cory**

*Existing customers still book with you, off the address lookup. Unchanged.*
