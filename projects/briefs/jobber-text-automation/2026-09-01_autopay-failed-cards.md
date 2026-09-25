# Autopay cards that failed — 2026-09-01 billing run

Pulled live from Jobber, 2026-09-01. Data: `data/autopay-not-collecting.json`.

## How this is detected

**Jobber does not record a declined charge.** Every `PaymentRecord` since 2026-06-01 was
checked — 4,258 of them — and the count of `transactionStatus: FAILED` is **zero**. Successes
are written, declines leave nothing behind. So a dead card is only visible as its consequence:

> autopay flag ON (`Job.willClientBeAutomaticallyCharged`) **and** the invoice is still unpaid
> after the nightly `SYSTEM_GENERATED` charge run.

Timing is what makes this conclusive. When autopay works, the charge lands **seconds** after the
invoice is issued — Kyle Peterson's August invoice was issued `2026-08-01T04:11:52Z` and paid at
`04:11:54Z`. This morning's run went out 04:28–05:00 UTC and cleared **211 of 212 charges,
$20,728**. Thirteen hours later these five still have no payment record at all.

## The five

| Customer | Amount | Invoice | Job | Cards on file | Phone |
|---|---|---|---|---|---|
| Nichole Jacobson | $112 | #16131 | 5545 | 1 | 425-531-0140 |
| Kyle Peterson | $100 | #16130 | 5171 | 3 | 425-232-3145 |
| Marius Ungureanu | $100 | #16121 | 7776 | 1 | 425-777-6589 |
| Jacque Coffey | $85 | #16124 | 5439 | 1 | 253-208-8454 |
| Tom Schlimme | $85 | #15757 | 6890 / 6720 | 3 | 206-841-1867 |

**$482 total.** All five are TMCP monthly, all long-running accounts that have paid by autopay
every month — Jacque has 85 payments on file, Nichole 71, Kyle 59, Tom 58. Nothing here looks
like a churn signal; it looks like five cards that stopped working this month.

Every one of them has at least one payment method on file, so this is a dead/declined card, not
a missing card. Marius is the likeliest expiry case — his card changed between the July charge
(MasterCard ..0149, exp 01/30) and the August one (MasterCard ..7196, exp **07/31**), and that
August card is the one that just failed.

## Two things worth knowing

**Tom Schlimme is billed twice every month.** Two $85 invoices per cycle, from two jobs (#6890
and #6720) — #14465 + #14668 in July, #15071 + #15398 in August, #15757 + #16116 now. The
second one (#16116) charged fine today; #15757 is the one that failed. If that is two properties
it is correct; if it is a duplicate job it has been double-billing him for months.

**One charge is still pending, not failed:** Kristina Rollings, $100, invoice #16078 — already
marked paid, balance $0. ACH in flight. No action.

## Separately: 13 old invoices marked paid but carrying a balance

The same sweep turned up 13 autopay clients with invoices whose status is `paid` but whose
balance field is non-zero — **$5,505** across records dating back to 2019 (Tom Rebek $400 from
2019, Ron Houlihan $800 across four 2019 invoices, SLPPLLC $1,150 from 2025-06, Nadia Reynolds
$1,000 from 2025-10). These are not card failures — they are accounting artifacts in Jobber and
belong in front of the bookkeeper, not in a collections text. Full list in the JSON under
`legacyPaidWithResidualBalance`.

## Reproduce

```
node scripts/autopay-open-exact.mjs
```
Walks invoices per client rather than paging the account-wide invoice list — the account-wide
page ties on `issuedDate` and returns duplicates, which inflates balances (it double-counted all
five of these on the first pass).
