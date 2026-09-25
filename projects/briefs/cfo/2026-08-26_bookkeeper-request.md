# Bookkeeper / CPA Request — Got Moles

Created 2026-08-26. This is the standing list of what the CFO function needs from the books.

**Everything below is aggregate financial reporting a bookkeeper produces as a matter of routine.**
None of it is unusual, and most of it is three exports from QuickBooks. Send it once to establish
the baseline, then the monthly items each month after close.

Drop everything received into **`cfo-private/`** at the repo root. That folder is gitignored and
never leaves this machine.

---

## Part 1 — The one-time baseline (unblocks everything)

### A. Profit & Loss, monthly columns, last 24 months

The single most important item. Not a summary — the **monthly-columns** version, so seasonality
and cost trends are visible.

- QuickBooks: Reports → Profit and Loss → Display columns by **Month** → date range last 24 months → Export to Excel
- Accrual basis preferred. If the books are kept on cash basis, send cash basis and say so.

### B. Balance Sheet, as of the most recent close

- Cash on hand, AR, AP, any debt outstanding, owner equity/draws

### C. Chart of Accounts

- Just the account list. Needed to map cost categories correctly rather than guessing what
  a line item contains.

### D. Statement of Cash Flows, last 12 months

- If it is not routinely produced, skip it — it can be derived from A and B.

---

## Part 2 — Specific questions the P&L usually will not answer

These are the ones that decide whether a hire, a price change, or an ad budget is a good idea.
Short answers are fine.

### Labor

1. **Fully-loaded burden rate** on a field technician — what does $1.00 of base wage actually cost
   once L&I workers' comp, PFML, WA Cares, FUTA, SUTA, employer FICA and any benefits are added?
   (A percentage is fine. This is the single most valuable number on the list.)
2. **The L&I risk classification code** used for the field techs, and its current rate.
   Misclassification is assessed retroactively with penalties, so it is worth confirming.
3. Are the techs **hourly or salaried**? If any are salaried, what is the annual figure?
   → *Reason: WA's 2026 exempt salary threshold is **$80,168.40/yr**. Anyone salaried below that is
   non-exempt and owed overtime regardless of job title. Cory is salaried and runs a full route.
   If his salary is under the threshold, unpaid overtime is a live liability.*
4. **Overtime paid** in the last 12 months, in dollars.

### Vehicles

5. Per truck, per month: payment or depreciation, commercial auto insurance, maintenance, registration.
6. **Fuel** — total last 12 months, and per-vehicle if tracked.
7. Owned, financed, or leased? Any balloon payments or lease ends coming up?

### Direct job costs

8. **Traps and field consumables** — total spend last 12 months. (Divided by ~18,800 annual visits,
   this gives cost per visit, which the pricing model needs.)

### Overhead

9. **General liability, commercial umbrella, and any other insurance** — annual premiums.
10. **Software and subscriptions** — total monthly. (Jobber, OptimoRoute, CallRail, Telnyx, Ninety,
    Google Workspace, AI/API spend.)
11. **Advertising spend** last 12 months, **broken out by channel if possible** — Google Ads,
    LSA, Meta, print, anything else.
    → *Reason: the Google Ads API is not connected on this machine, so ad spend is currently
    invisible. Without it, cost per customer cannot be calculated at all.*
12. **Office, admin and contract labor** — VA/answering service, bookkeeping fee, any contractors.
13. **Rent, facilities, storage, utilities** if any.

### Entity and owner

14. What is the **tax election** for Rainier Power Wash LLC — S-corp, partnership, or disregarded?
15. **Owner compensation** last 12 months, split between W-2 salary and distributions.
16. **Effective tax rate** actually paid last year, and the current quarterly estimate schedule.
17. Is there a **line of credit**? Limit, current balance, rate.
18. Any **debt outstanding** — vehicle notes, equipment, SBA, personal guarantees.

---

## Part 3 — Standing monthly (after each close)

Once the baseline lands, only these are needed each month:

- P&L for the closed month, with the prior month and same-month-last-year alongside
- Balance sheet as of close
- Cash balance and any change in debt or credit line
- A note on anything unusual in the month

---

## Part 4 — The one question for Spencer, not the bookkeeper

**What do you need to draw from the business per year, minimum, to live?**

This is the hard constraint in the decision policy — it comes out before growth spending, and every
distribution and hiring recommendation is built on it. Nobody else can answer it.

---

## Why this matters — what is blocked right now

Without Part 1 and Part 2, the following are literally uncomputable, not merely imprecise:

| Blocked | Needs |
|---|---|
| Gross margin | Labor burden, vehicle, fuel, materials |
| EBITDA and EBITDA margin | All of the above plus overhead |
| Whether a new tech makes money | Burden, vehicle, fuel, materials, overhead allocation |
| What a customer is actually worth (LTV) | Contribution margin + churn |
| What to spend to acquire a customer (CAC) | Ad spend by channel |
| What the business is worth | EBITDA + recurring revenue share |
| How much cash to hold through Dec–Feb | Cash on hand, fixed monthly cost |
| How much can safely be taken out | All of the above plus tax rate |

The revenue half of the business is already measured in detail — $857K trailing twelve months,
a 69% close rate, a dollar-weighted collection curve, visit-level capacity per tech. The cost half
is a blank page. Every financial decision made today is made on half the picture.

---

## Note on the QuickBooks API

QuickBooks Online has an API that would make the monthly close automatic and remove this request
list entirely. That is worth doing — **but not yet.** Run two monthly closes by hand first so the
account mapping is proven against what the books actually contain. An automated pull built on a
wrong mapping produces confident, wrong numbers, which is worse than no numbers.
