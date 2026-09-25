# TMCP Audit — Tag + Billing — 2026-09-15

Run: `node projects/tool-jobber/scripts/tmcp-billing-audit.mjs 2026-09-15`
Source: live Jobber sweep, 899 live jobs across all 8 non-archived statuses. **Read-only — nothing was changed.**
Data: `data/2026-09-15_tmcp-billing-audit.json` · `data/2026-09-15_tmcp-jobs.jsonl` (747 rows)
Compares against the 09-09 run (6 days).

---

## Headline

**Two things moved that have never moved before: the tag gap did not refill, and a billing defect was actually fixed.** Against that, autopay is still the line going the wrong way, and this run found a new one — eleven customers who were *meant* to be on autopay, already hold a card, and are not being auto-charged.

| | 09-09 | 09-15 | |
|---|---|---|---|
| Live TMCP jobs | 735 | **747** | +12 |
| Distinct clients | 713 | 724 | +11 |
| MRR (corrected) | $80,885.94 | **$82,195.93** | +$1,309.99 |
| Jobs missing the tag | 13 | **3** | **−10** (2 real + Trent Bryan) |
| MRR behind the tag gap | $1,395 | **$425** | $225 excl. Trent |
| Jobs with a billing defect | 36 | **35** | **1 fixed, 0 new** ✓ |
| Serviced with no recurring charge | 11 | 10 | −1 |
| Tagged Active with no live job | 1 | **0** | ✓ |
| Autopay | 29.7% | **29.3%** | −0.4pt |

Only 6 days, so read the rates rather than the counts.

---

## 1. ✅ The tag fix held — and the timestamps show it is a per-sitting habit, not a lag

All **12 clients Spencer tagged on 09-09 are still tagged**. Nothing regressed. Twelve new jobs arrived in 6 days and **10 of them were tagged at creation**.

Last audit argued the gap "splits by who booked." This run pulled the real `createdAt` stamps rather than inferring from first-visit dates, and the picture is sharper than that — it is **one sitting**:

| Created (UTC) | Job | Client | $/mo | Tag |
|---|---|---|---|---|
| 09-10 03:25 | #8549 | Donna Youngblood | 85 | ✅ |
| 09-10 17:43 | #8552 | Larry Gasser | 100 | ✅ |
| 09-11 20:20 | #8561 | Jeremiah Slater | 100 | ✅ |
| 09-13 16:18 | #8564 | Jared Schapiro | 100 | ✅ |
| 09-13 16:22 | #8565 | Daniel Gagen | 100 | ✅ |
| **09-14 23:28** | **#8578** | **Eric Hill** | **100** | **❌** |
| **09-14 23:46** | **#8579** | **Gurwinder Sandhu** | **125** | **❌** |
| 09-15 20:54 | #8581 | Rachel Hanes | 100 | ✅ |
| 09-15 20:59 | #8582 | Stacey Ogle | 100 | ✅ |
| 09-15 21:24 | #8583 | Timothy Hoover | 100 | ✅ |
| 09-15 21:57 | #8585 | Jan Sterling | 100 | ✅ |
| 09-15 22:30 | #8587 | Mitchell Gasser | 100 | ✅ |

Both misses were created **18 minutes apart in a single evening block**, both on clients with **no tags at all**. Everything booked before that block and everything booked after it carries `TMCP - Active` — including **five jobs entered today that are already tagged**, which is what finally kills the "it's just a lag" reading. This is one person, one sitting, or one path through the booking screen — not a queue catching up.

Tagged-at-creation rate: **62% last period (16/26) → 83% this period (10/12).** Real improvement, small sample.

**Fix:** #8578 Eric Hill and #8579 Gurwinder Sandhu — $225/mo, both on brand-new clients with a blank tag list.

### #8219 Trent Bryan — known exception, not a defect

Per Spencer's 09-09 ruling this is a **WA semi-annual special case**, not a missing tag, and the script has no concept of that variant so it will keep surfacing him. He is excluded from the escalation above. Worth noting his record still carries **no tags at all** (created 07-22, 55 days) — if a semi-annual marker was meant to be applied, it still has not landed.

### Tagged Active with no live job → 0 ✓

Was 1 (Woodyard's stale tag). Now clean. `TMCP Churned` steady at 22. Barbee Mill HOA stays correctly excluded as an umbrella account.

---

## 2. ✅ First billing fix in four audits — #6900 Jeff Hunter

Three consecutive audits reported zero movement on this list. This one has movement.

**#6900 Jeff Hunter** — was `$0 price + no invoice schedule + never invoiced`, tagged *paid in full*, 412 days old, 3 visits in the prior fortnight against $0 ever billed. He is now **$100/mo on a monthly schedule with $100 invoiced.** Clean, off the defect list, off the zero-charge list.

That is the template for the remaining nine free jobs: someone made a decision, and the fix was one price field and one schedule.

**Nothing else changed.** Job-by-job, the other 35 defect jobs are the same 35, carrying the same defects, and no new ones appeared.

| Category | 08-19 | 08-25 | 09-09 | 09-15 |
|---|---|---|---|---|
| Bills yearly | 16 | 16 | 16 | 16 |
| Zero price | 8 | 8 | 8 | **7** ✓ |
| Never invoiced | 7 | 7 | 7 | **6** ✓ |
| No invoice schedule | 6 | 6 | 6 | **5** ✓ |
| Below $75 floor, no discount line | 7 | 7 | 7 | 7 |
| Bills quarterly | 4 | 4 | 4 | 4 |
| Bills on close | 3 | 3 | 3 | 3 |
| Past end date | 1 | 1 | 0 | 0 |

### Tier 1 — ten jobs still serviced for nothing, and six took service this week

Visits re-pulled live for all ten. **Every one has a next visit already booked. Six were serviced in the 6 days since the last audit.** Not one is dormant.

| Job | Client | Comp tag | Visits since 09-09 | Last visit | Next | Lifetime invoiced | Age |
|---|---|---|---|---|---|---|---|
| #5433 | Susan Newby | Cash | 1 | **09-15** | 09-29 | **$0** | 809d |
| #4979 | Marcus Andy | Cash | 1 | **09-15** | 09-22 | **$0** | 923d |
| #8339 | Donald Kaplan | **none** | 1 | 09-11 | 09-18 | $0 (bills on close) | 26d |
| #7767 | Jamie Randall | **none** | 1 | 09-11 | 09-18 | **$0** | 187d |
| #7449 | Sally Gasser | **none** | 1 | 09-11 | 09-18 | $340 (last 2026-01-31) | 320d |
| #8338 | Leena Shah | **none** | 1 | 09-10 | 09-17 | $0 (bills on close) | 33d |
| #4492 | Rich Porter | paid in full | 0 | 09-08 | 09-16 | **$0** | 1,105d |
| #4754 | Barry Heimbigner | **none** | 0 | 09-04 | 09-18 | **$0** | 1,020d |
| #5440 | Steve Hewitt | Cash, LARGE PROPERTY | 0 | 09-01 | 10-01 | $160 (last Aug 2024) | 806d |
| #5007 | Karen Porter | paid in full | 0 | 08-27 | 09-30 | **$0** | 929d |

Same two buckets as last time, one name lighter:

- **Five with no comp tag at all** — Kaplan, Randall, Gasser, Shah, Heimbigner. ≈$6,000/yr at the standard $100 with nothing on record explaining why it is free. **Kaplan and Shah remain the two cheapest wins in the whole audit**: both correctly priced at $100, both under 35 days old, both simply set to *bill on close* on a year-round job — so they will never invoice. Two schedule changes, ~$2,400/yr, no awkward conversation.
- **Four tagged Cash or paid in full** — Newby, Andy, Rich Porter, Hewitt. A bookkeeping problem, not a pricing one. #4979 Marcus Andy has now taken **58 visits over 923 days with $0 ever recorded in Jobber**, and he was serviced again today. If that cash is coming in, it is not reaching the system the P&L reads.

Ten zero-charge jobs ≈ **$11,800/yr** at list rate.

### Tiers 2–4 — unchanged

- **Yearly-schedule prepays:** the same 16. The same 8 ($675/mo: Goodman, Mcdonald, Watson, Davis, McGowan, Shapiro, Hahn, Butt) carry a *monthly* price on a *yearly* schedule, so the script divides them by 12. **MRR correction still exactly +$618.75/mo** — corrected MRR **$82,195.93**, not the $81,577.18 the script reports. All eight are hand-billed, so the correction lands entirely on the hand-billed side.
- **#5597 Jim McGowan** — still one $85 invoice in 783 days.
- **#8056 Madera West Condos** — resolved and counted correctly at $1,275/mo. **Prepaid through Q4; next invoice due ~2027-01-01.** Do not chase it in the interim.
- **Sub-floor $50 jobs:** same 7 (Charles #8157, Jonae #8159, Higashiyama, Fisher, Taylor, Good, VandenBrink), still no discount line recording why.

---

## 3. 🆕 Eleven customers meant to be on autopay, holding a card, not being charged

New check this run: cross-reference the client `Autopay` tag against the job's actual `willClientBeAutomaticallyCharged` setting, then against whether the client holds a saved payment method.

**12 jobs sit on a client tagged `Autopay` with autopay switched OFF — $1,082.75/mo. Eleven of the twelve already have a card on file.**

| Job | Client | $/mo | Cards on file | Outstanding |
|---|---|---|---|---|
| #5412 | Mike Ahquin | 100 | 1 | $0 |
| #8552 | **Larry Gasser** | 100 | 2 | $0 |
| #7803 | Faith Trimble | 100 | **0** | $0 |
| #5227 | Jana Wilson | 97.75 | 3 | $0 |
| #5324 | Scott Moser | 95 | 2 | $0 |
| #8235 | Mike Schuppert | 90 | 2 | $0 |
| #5427 | Dave Wilson | 85 | 1 | $0 |
| #5727 | Eric Crossley | 85 | 2 | $0 |
| #4515 | Kelly Kunz | 85 | 3 | $0 |
| #5622 | Carrie Cummings | 85 | 1 | $0 |
| #6162 | Scott Barker | 85 | 1 | **$85** |
| #7961 | Kelly Kunz | 75 | 3 | $0 |

Every one but Barker is at $0 outstanding — these people are paying, they are just being chased and hand-billed every month when someone already recorded that they agreed to autopay and they already handed over a card. **Eleven switches, $982.75/mo, no sales conversation required.** Faith Trimble is the only one who genuinely needs a card captured first.

**#8552 Larry Gasser is the sharp one:** booked 09-10, *this week*, client tagged `Autopay`, two cards on file — and the job was still created hand-billed.

Caveat on the signal: the `Autopay` tag is **under-applied**, not over-applied — 145 jobs autopay correctly while carrying no tag, so the tag is not a roster. But tag present + card on file + autopay off is a strong read, and it points at the same booking step as §1.

---

## 4. Autopay — still the only number moving the wrong way

| | 08-11 | 08-19 | 08-25 | 09-09 | 09-15 |
|---|---|---|---|---|---|
| Jobs on autopay | 212 | 219 | 218 | 218 | **219** |
| TMCP jobs | 675 | 694 | 709 | 735 | **747** |
| Share | 31.4% | 31.6% | 30.7% | 29.7% | **29.3%** |

**0 of 12 new sales went on autopay.** That is now **0 of 41 across three audits.** The single gain — #6028 Bill Sweatman, $90/mo — is an existing customer who flipped, not a new sale.

Hand-billed TMCP is now **$60,765.93/mo across 528 jobs** (corrected), up from $58,927 six days ago. Autopay holds $21,430/mo — **26.1% of MRR by value**, well under its 29.3% share by job count, because the larger accounts are disproportionately hand-billed.

The tag problem proved fixable once someone owned it. Autopay has had the same treatment applied to zero new sales.

---

## Do next

1. **Switch on the eleven autopay-tagged customers who already hold a card** — $982.75/mo, no conversation needed, the intent is already recorded. Capture a card for Faith Trimble separately. *(New this run — §3.)*
2. **Autopay at signup, as a required step.** 0 of 41 new sales across three audits. The tag gap closed because someone made it part of booking; nothing has been made part of booking for autopay, and #8552 Larry Gasser proves the intent can be recorded and still not applied.
3. **#8339 Kaplan and #8338 Shah** — priced right at $100, set to *bill on close* on a year-round job. Two schedule changes, ~$2,400/yr, both under 35 days old.
4. **#8578 Eric Hill and #8579 Sandhu** — tag them, $225/mo. Then ask who was booking at ~4:30pm PT on 09-14, because everything either side of that block is clean.
5. **Rule on the five untagged free jobs** — Kaplan, Randall, Gasser, Shah, Heimbigner. Comp or bill? ≈$6,000/yr.
6. **The Cash / paid-in-full four** — Newby, Andy, Rich Porter, Hewitt. #4979 Marcus Andy: 58 visits, 923 days, $0 recorded, serviced again today.
7. **#8219 Trent Bryan** — not a defect, but his record carries no tags at all. Put the semi-annual marker on so the audit stops surfacing him.

**On the pattern, four audits in:** the tag list was the one item that got an owner, and it is the one item that stopped refilling — the fix stuck across a full booking cycle and the timestamps now show the residue is a single sitting rather than a systemic gap. The billing list moved for the first time, by exactly one job, and that job moved because someone made a decision about it. Everything still on the list is still there for the same reason: it needs a ruling, not a repair, and nobody has been asked for one. Autopay is the exception — it needs neither a ruling nor a repair, just a step added to booking, and it is the largest number in the audit.
