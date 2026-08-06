# TMCP Tag Audit — 2026-08-05

Re-run of the tag reconciliation. Source: live Jobber GraphQL sweep of **all 797 live jobs**
(every non-archived status, RECURRING *and* ONE_OFF) with line items + client tags in one pass,
cross-referenced against the `TMCP - Active` (631) and `TMCP Churned` (20) client tag sets.

Script: `projects/tool-jobber/scripts/tmcp-tag-audit.mjs` (new — read-only).
Raw report: `projects/tool-jobber/data/2026-08-05_tmcp-tag-audit.json`.

> Method change vs the 7/21 audit: that one swept `jobType: RECURRING` only and had to be
> patched by hand on 7/22 when four one-off TMC jobs turned up. This sweep filters by job
> *status*, so one-offs can't hide. Only one one-off TMC job survives today (Marcus Andy #4979).

## Answers

*(Revised after Spencer's read on 8/5: Larry Lemmon is still a customer — see below.)*

**Missing the tag: 11 jobs flagged → 10 are real gaps.**
**Real TMCP active jobs: 658** (659 raw, minus one false positive).

## Reconciliation

| Line | Jobs | Clients |
|---|---|---|
| Live jobs carrying a Total Mole Control line item | 659 | 640 |
| − #8219 Trent Bryan — fixed-term seasonal deal, not a TMCP | −1 | −1 |
| **Real active TMC jobs** | **658** | **639** |
| Clients tagged `TMCP - Active` | — | 631 |
| **Tag gap (should be tagged, isn't)** | — | **10** |

Job count > client count because 9 clients hold multiple TMC jobs (Prologis - Sumner Landing ×10,
Cruz Rodriguez ×3, HyperGreen ×3, six others ×2) — 19 extra jobs across those 9.

**MRR equivalent: $72,440/mo** (raw $72,640 less Bryan's $200) → **$869K annual run rate.**
Up from $69,254 on 7/22.

## The 11 flagged jobs

### 10 real gaps — need `TMCP - Active` added

| Started | Job | Client | $/mo | Billing | Current tags |
|---|---|---|---|---|---|
| 8/7 | #8315 | Scott Vojik | $115 | monthly/last-day | Schedule requested, Voice Assist ×2 |
| 8/4 | #8289 | Chad Vetter | $100 | ⚠️ **on-close** | Schedule requested, Voice Assist ×2 |
| 8/4 | #8305 | Douglas Kelly | $100 | monthly/last-day | (none) |
| 8/3 | #8297 | Babu Uppala | $50 | monthly/last-day | (none) |
| 8/3 | #8296 | Prasad Thiruveedu | $50 | monthly/last-day | (none) |
| 7/31 | #8277 | Jon Gomes | $100 | ⚠️ **on-close** | (none) |
| 7/30 | #8265 | Jepson Fuller | $100 | ⚠️ **on-close** | Schedule requested |
| 7/30 | #8270 | Brian Meadows | $100 | monthly/last-day | Schedule requested, Voice Assist ×2 |
| 7/28 | #8251 | Mike Malgarini | $100 | monthly/last-day | (none) |
| 7/30/24 | #5639 | **Larry Lemmon** | $100 | monthly/last-day | ⚠️ **TMCP Churned** — remove |

Nine of the ten are signups from the last 8 days. Worklist CSV:
`projects/tool-jobber/data/2026-08-05_tmcp-tag-fix-worklist.csv`

### Larry Lemmon #5639 — he never actually churned

Spencer flagged on 8/5 that Lemmon is back. The billing record says he never left:

- **24 consecutive monthly $100 invoices**, Sep 2024 → Jul 2026, **every one paid**, including
  #15275 issued 7/31/26. Zero uninvoiced balance. No lapse anywhere in the series.
- Job live to 2034, visits scheduled through 2034, monthly/last-day billing intact.

So the 7/22 note ("canceling, final bill this month") never turned into a cancellation — only the
tag was changed. Fix is tags only: **remove `TMCP Churned`, add `TMCP - Active`.** Nothing needs
rebuilding.

⚠️ **Double-billed for July.** Two $100 invoices issued 7/31/26: **#15275 paid** and
**#15026 past_due**. #15026 is a duplicate and should be voided — otherwise it sits as a phantom
past-due balance on a customer who is fully paid up. (Same shape as the Jobber duplicate-write
thread in `jobber-duplicate-cleanup`.)

### Trent Bryan #8219 — a third product that isn't on the price card

Not a mislabel so much as a product with no home. His full history:

| Job | Dates | Shape | Line item |
|---|---|---|---|
| #4506 | Sep–Oct 2023 | 1 month, $400 | 1 Month of Mole Control (South) |
| #5419 | Jun–Aug 2024 | 1 month, $400 | 1 Month (North) + repeat discount |
| #5670 | Aug 2024 | one-off, $200 | 1 Month (North) |
| #5849 | Sep–Oct 2024 | 1 month, $200 | 1 Month (North) + repeat discount |
| #6749 | Jul–Aug 2025 | 1 month, $325 | 1 Month + repeat discount |
| #6940 | Aug–Nov 2025 | **$200/mo × 3, monthly last-day** | 1 Month of Mole Control Service |
| **#8219** | **Jul–Nov 2026** | **$200/mo × 3, monthly last-day** | ⚠️ **Total Mole Control Program** |

He is a **repeat seasonal customer who buys a ~3-month block each summer** — he has done it every
year since 2023, and #8219 is a straight repeat of last year's #6940. That is neither a Quick Fix
(one month) nor a TMCP (year-round, ends 2036). The only thing that changed this year is that
whoever built the job reached for the TMCP line item, which is why the audit picks him up.

**Recommendation:** rename #8219's line item to match #6940 (`1 Month of Mole Control Service`)
and leave the client untagged. He is real revenue — $600 across Aug/Sep/Oct — just not recurring
revenue, and counting him in the TMCP base overstates MRR by $200 and inflates churn when he ends
on 11/1. Longer term, this shape has now happened twice: a named fixed-term line item would stop
it re-appearing every August.

## Signup tagging is mostly fixed

46 TMC jobs started since 7/22. **37 were tagged, 9 weren't** — 80% compliance, against 0-for-8
on both 7/10 and 7/21. Whatever changed at signup after 7/22 is largely working; the residue is
the last ~8 days, which suggests the tag gets applied on a lag rather than being missed outright.
Worth confirming before treating the remaining 9 as a process failure.

## Other things this sweep surfaced

**Tagged `TMCP - Active`, no TMC line item (2)** — both known and deliberate: Tyler Smythe ($0
barter jobs) and Barbee Mill HOA ($1,000/mo booked on a Quick Fix line item). No action.

**Double-tagged (1)** — **#5390 Mike Kaiser** carries *both* `TMCP - Active` and `TMCP Churned`.
Job is live, $90/mo, 22 invoices, $1,980 collected. One of the two tags is wrong; needs a call.

**3 new signups set to bill on job close (will never bill):** #8289 Chad Vetter, #8277 Jon Gomes,
#8265 Jepson Fuller — all $100/mo, all 0 invoices. Same defect fixed on #8058 and #8197 in July,
so it is still being created at signup. **$300/mo leaking.**

**7 legacy $0 / never-bill jobs** unchanged from the July audit (Randall, Gasser, Hunter, Hewitt,
Newby, Marcus Andy, Karen Porter). Porter and Hewitt are confirmed annual cash payers.

**8 "yearly" jobs still priced like a monthly:** Goodman $50, McGowan $85, Davis $85, Watson $85,
Shapiro $95, Hahn $100, Butt $100, Mcdonald $75. Six have invoiced ~12× the figure ($1,020–$1,200),
so they are prepays with the schedule mislabeled — **but Jim McGowan #5597 has invoiced $85 total,
i.e. actually paid one month for a year.** Unchanged since 7/21.

**$50 tier is growing fast:** 25 jobs, 13 of them started since 6/1 and 5 in the last week
(Pacharu, Abraham, Thiruveedu, Uppala, plus Kabue/Baughman/Davis/Jonae/Charles/Zarro/Parhaniemei
in July). That is half the standard $100 rate on a quarter of recent signups. Not a tag issue —
flagging it because it moves the pricing review from 7/21.

## Fix order

1. Tag the 10 — 9 adds, plus Lemmon's swap (`TMCP Churned` → `TMCP - Active`).
2. Fix billing on #8289, #8277, #8265 → monthly / last day of month. **$300/mo.**
3. Void Lemmon's duplicate July invoice #15026 ($100, past_due).
4. Resolve Mike Kaiser #5390's double tag.
5. Rename Trent Bryan #8219's line item to `1 Month of Mole Control Service`.

```
node projects/briefs/got-moles-scale/scripts/jobber-client-tags.mjs \
  --client <encodedId> --add "TMCP - Active" [--dry-run]
```

---

## Applied — 2026-08-05 (Spencer approved)

### Tags — done, all 10 verified by read-back

`TMCP - Active` added: Brian Meadows, Douglas Kelly, Babu Uppala, Prasad Thiruveedu, Jon Gomes,
Jepson Fuller, Mike Malgarini (7 written by me). Scott Vojik, Chad Vetter and Larry Lemmon were
**already correct** by the time the write ran — someone tagged them in the ~30 min between the
audit sweep and the fix, and Lemmon's `TMCP Churned` was already removed.

**Live count now: 641 tagged `TMCP - Active`, 19 `TMCP Churned`** (was 631 / 20).

641 reconciles exactly: 639 clients with a live TMC line item + the 2 deliberate exceptions
(Tyler Smythe barter, Barbee Mill HOA on a Quick Fix line). **The tag set is now clean.**

### Billing — done, 2 of 3

- **#8277 Jon Gomes** — ON_COMPLETION → PERIODIC, `FREQ=MONTHLY;BYMONTHDAY=-1`. Verified.
- **#8265 Jepson Fuller** — same. Verified.
- **#8289 Chad Vetter** — **already fixed** before I got there (same 30-minute window).

**$200/mo recovered** ($300 flagged, $100 of it already handled).

### Lemmon's stray invoice #15026 — RESOLVED by Spencer in the UI

**Correction to the original finding:** I called these a duplicate system write. They are not.
The subjects tell the real story:

| Invoice | Issued 7/31/26 | Subject | Status |
|---|---|---|---|
| #15026 | 15:01 | `For Services Rendered` — same as all 23 prior monthlies | past_due, $100 balance |
| #15275 | 20:33 | **`FINAL BILL`** | paid, $0 |

Someone believed Lemmon was cancelling and **manually cut a FINAL BILL** the same evening the
automatic monthly had already generated. He paid the manual one; the automatic one sat unpaid as a
$100 phantom balance. Not a Jobber double-write — a reversed cancellation leaving a manual final
bill colliding with the recurring invoice.

**Worth a sweep:** any other still-active client carrying a manual "FINAL BILL" has the same shape.

**The Jobber API has no void or delete mutation for invoices** — the full set is `invoiceCreate`,
`invoiceEdit`, `invoiceClose`, `invoiceReopen`, `invoiceMarkAsSent`, `invoiceUnmarkBadDebt`, none
of which delete. Spencer cleared it in the Jobber UI on 8/5.

## Method notes for next time

- **`ICalendarRule` writes need the `RRULE:` prefix; reads return it without.** Reading
  `FREQ=MONTHLY;BYMONTHDAY=-1` and writing it back verbatim fails with
  `argumentLiteralsIncompatible`. Correct write value: `"RRULE:FREQ=MONTHLY;BYMONTHDAY=-1"`.
- TMCP billing fix in full:
  `jobEdit(jobId, input:{ invoicing:{ invoicingType: FIXED_PRICE, invoicingSchedule: PERIODIC, recurrence: "RRULE:FREQ=MONTHLY;BYMONTHDAY=-1" } })`
- `Invoice` has no `amountPaid` — use `amounts { total invoiceBalance depositAmount }`.
- **Records move during a run.** Three clients and one job changed between the sweep and the
  fix pass. Re-read live state immediately before every write; the additive `tagsToAdd` and the
  before/after print made the already-done ones safe no-ops rather than clobbers.

---

## Final state — end of 2026-08-05 session

Verified by **enumerating** the tag set, not by `totalCount` (see gotcha below).

| | Count |
|---|---|
| Live TMCP jobs | **661** (660 excluding Bryan) |
| Distinct TMCP clients | **642** (641 excluding Bryan) |
| Clients tagged `TMCP - Active` | **643** |
| Clients tagged `TMCP Churned` | 19 |

**643 = 641 real TMCP clients + Tyler Smythe + Barbee Mill HOA** (the two deliberate
exceptions with no TMC line item). The only TMCP client without the tag is **Trent Bryan
#8219**, intentionally.

**The tag set is fully reconciled — zero unexplained gaps.**

Tag count moved 631 -> 643 over the session (+12): 9 written by me (7 from the audit list +
Jay Hickenbottom #8320 and Mike Huggins #8321, who signed up mid-session), and 3 applied by
someone else while the session ran (Vojik, Vetter, Lemmon).

### Jobs vs clients — do not mix the units

The tag lives on the **client**, so it can never equal the job count. 9 clients hold 28 of the
661 jobs — Prologis - Sumner Landing x10 ($2,185/mo), Cruz Rodriguez x3 ($3,498/mo),
HyperGreen x3, plus six x2 — i.e. **19 jobs beyond one-per-client**. 633 clients hold exactly one.
The Ninety scorecard already gets this right: `tmcp_active` is job-derived, labelled "Total TMCP
Jobs active", and auto-annotated with the job-vs-client explanation.

### MRR scope

**MRR counts TMCP line items only.** Full live picture:

| Product | Jobs | Recurring MRR | One-time value |
|---|---|---|---|
| TMCP | 661 | **$73,090** | $100 |
| Quick Fix | 113 | $1,000 | **$47,835** |
| Barter/comp | 12 | $75 | $500 |
| Bids / no line items | 10 | $0 | $0 |

112 of 113 Quick Fix jobs bill ON_COMPLETION, so they contribute nothing to MRR by construction.
Correct for an MRR figure, but **MRR is not monthly revenue** — ~$48.8K of live Quick Fix work
sits outside it. One Quick Fix job is on monthly/last-day billing and is probably misconfigured.

### Gotcha that cost time

`clients(filter:{tags:[...]}){totalCount}` is **stale** — it read 641 both immediately before and
after two verified writes, while enumerating the same filter returned 643. Page the connection
and count nodes; never quote `totalCount` for a tag population.
