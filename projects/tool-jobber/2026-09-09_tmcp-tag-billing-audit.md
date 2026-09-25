# TMCP Audit — Tag + Billing — 2026-09-09

Run: `node projects/tool-jobber/scripts/tmcp-billing-audit.mjs 2026-09-09`
Source: live Jobber sweep, 892 live jobs across all 8 non-archived statuses. **Read-only — nothing was changed.**
Data: `data/2026-09-09_tmcp-billing-audit.json` · `data/2026-09-09_tmcp-jobs.jsonl` (735 rows)
Compares against the 08-25 run (15 days).

---

## Headline

**The book grew 26 jobs in 15 days and every single one of them went on hand-billed. The tag list refilled from 3 to 13. The billing list has now gone three consecutive audits without a single fix.**

Two of last audit's items did close: **#8069 Anne Nguyen** (the `DO NOT SERVICE` client with a tech booked) and **#6411 Woodyard** (10 days past end date) are both off the live book.

| | 08-25 | 09-09 | |
|---|---|---|---|
| Live TMCP jobs | 709 | **735** | +26 |
| Distinct clients | 687 | 713 | +26 |
| MRR (corrected) | $78,260.93 | **$80,885.94** | +$2,625.00 |
| Jobs missing the tag | 3 | **13** | **+10** ⚠ |
| MRR behind the tag gap | $400 | **$1,395** | +$995 |
| Jobs with a billing defect | 37 | **36** | **0 fixed, 0 new** (1 job closed) |
| Serviced with no recurring charge | 11 | 11 | unchanged |
| Autopay | 30.7% | **29.7%** | −1.0pt |

---

## 1. ⚠️ Tag hygiene went backwards — 3 → 13

Every one of the 10 new gaps is a job that started in the last 10 days. $1,395/mo — **$16,740/yr** of book that the `TMCP - Active` tag cannot see.

| Job | Client | $/mo | Starts | Client tags today |
|---|---|---|---|---|
| #8219 | **Trent Bryan** | 200 | 07-30 | *(none)* — **4th consecutive audit untagged, 41 days** |
| #8492 | John Mcmanus | 100 | 08-31 | Schedule requested; Voice Assist ×2 |
| #8503 | Joyce Hinkley | 100 | 09-01 | Schedule booked; Schedule requested |
| #8472 | David Johal | 100 | 09-02 | Schedule requested; Voice Assist |
| #8491 | Scott Owens | 100 | 09-02 | *(none)* |
| #8514 | Cathy Conner | 100 | 09-02 | *(none)* |
| #8499 | Kitrick Wulf | 100 | 09-03 | Schedule requested; Voice Assist |
| #8508 | Zoe Wu | 90 | 09-04 | *(none)* |
| #8497 | Jean Vanwagoner | 100 | 09-04 | Schedule requested; Voice Assist ×2 |
| #8500 | Mary Yu | 90 | 09-07 | *(none)* |
| #8524 | Michael Sobieck | 100 | 09-08 | *(none)* |
| #8530 | Phyllis Miller | 100 | 09-08 | *(none)* |
| #8531 | Lewis Henry | 115 | 09-08 | *(none)* |

**Fixed since 08-25:** #8431 Julie Woods now tagged. #8069 Anne Nguyen left the book (see §2).

### ✅ Cleared same day — re-verified live 2026-09-09 22:21 UTC

Spencer tagged the list after this audit ran. Re-checked against Jobber (targeted client-tag query, not a re-sweep):

| | at audit | after fix |
|---|---|---|
| Jobs missing `TMCP - Active` | 13 | **1** |
| MRR behind the tag gap | $1,395 | **$200** |
| Clients on the `TMCP - Active` roster | 702 | **713** |
| Clients tagged Active with no live job | 2 | **1** |
| `TMCP Churned` roster | 21 | **22** |

Twelve of the thirteen now carry `TMCP - Active`. **Woodyard is correctly flipped to `TMCP Churned`.**

**Correction — Barbee Mill HOA was never a defect.** Spencer confirmed 09-09 that it is a TMCP client, and the data agrees: **11 live TMCP jobs, $550/mo**, all correctly tagged, sitting on the individual owner records (Davis #8146, Zarro #8147, Hickenbottom #8320, Parhaniemei #8176, Dawson #7979, Goodman #7967, Richardson #8054, Wohlfarth #8019, Parasida #7980, Nugent #7981, Vira #8016 — all on Williams Ave N / N 41st Pl, Renton 98056, each `Total Mole Control @$100` + `Barbee Mill HOA discount @−$50`). The **HOA record is the umbrella account** and correctly holds no job of its own.

This was a bug in the audit, not in the book: `clientsTaggedActiveNoLiveJob` assumes every tagged client must hold its own job, which is false for parent/umbrella accounts. Fixed in `scripts/tmcp-billing-audit.mjs` via an explicit `UMBRELLA_ACCOUNTS` allow-list. Barbee Mill had been carried as an open item on the 08-19, 08-25 and 09-09 reports — **all three were wrong.** With Woodyard resolved and Barbee Mill excluded, the real count is **0**.

**#8219 Trent Bryan is a WA semi-annual special case (Spencer, 09-09) — not a tag defect. Future audits should not flag him as one.** Note that his client record currently carries **no tags at all**, so if a semi-annual marker was meant to go on, it did not land. The roster arithmetic confirms it: 713 tagged Active = 712 TMCP clients + Barbee Mill, i.e. Trent is the one TMCP client still off the roster.

The structural finding in this section stands regardless — the list was cleared by hand for the second audit running, and nothing changed at the booking step that produced it.

### This is not a lag — it splits by how the job was booked

The last two audits called the missing tags "a lag that catches up." The 29 new jobs say otherwise. Tagged and untagged jobs sit on the *same booking days*:

- **09-02:** #8512 Raman Mann tagged · #8472, #8491, #8514 untagged
- **09-04:** #8520 Depencier, #8513 Lamb tagged · #8508, #8497 untagged
- **09-07:** #8509 Kaur, #8507 Toland tagged · #8500 untagged
- **09-08:** #8529 Hui Evans tagged · #8524, #8530, #8531 untagged

Four of the untagged carry `Voice Assist` tags and seven carry **no tags at all**, while every tagged one reads a clean `TMCP - Active`. Whoever books a sale either applies the tag as part of their routine or never does. Fixing the 13 by hand today just refills the list again in a fortnight — the fix is at the booking step, not the list.

*(Caveat: `startAt` is the first visit date, not the sale date, so the day groupings above are approximate.)*

### Tagged Active with no live job — actually 0

The script reported 2. Both were wrong: **Woodyard** was real but is now flipped to `TMCP Churned`, and **Barbee Mill HOA** was never a defect at all (see the correction above). Real count: **0**.

---

## 2. Last audit's two urgent items both closed ✓

- **#8069 Anne Nguyen** — the `DO NOT SERVICE` client with a tech booked for 08-26. The job is off the live book and her `TMCP - Active` tag has been removed. Resolved.
- **#6411 John and Tessa Woodyard** — was 10 days past end date and still open. Now closed. Only the stale Active tag remains.

`TMCP Churned` went 20 → 21, consistent with #5300 Terry Williams ($85/mo) leaving the book.

---

## 3. Billing — third audit, still zero movement

Job-by-job diff, not a totals match. **The 36 remaining defect jobs are the same 36. Nothing was fixed, nothing new appeared, and not one job changed which defect it has.** The only change is Woodyard closing, which took `PAST_END_DATE` to zero.

| Category | 08-19 | 08-25 | 09-09 |
|---|---|---|---|
| Bills yearly | 16 | 16 | 16 |
| Zero price | 8 | 8 | 8 |
| Never invoiced | 7 | 7 | 7 |
| No invoice schedule | 6 | 6 | 6 |
| Below $75 floor, no discount line | 7 | 7 | 7 |
| Bills quarterly | 4 | 4 | 4 |
| Bills on close | 3 | 3 | 3 |
| Past end date | 1 | 1 | **0** ✓ |

### Tier 1 — being serviced for free, and all twelve took service this fortnight

I pulled every visit on these jobs in a 06-01 → 10-20 window. **All 12 were serviced since the last audit — 23 visits in 15 days, against $0 of new invoicing.** Not one is dormant.

| Job | Client | Comp tag | Visits since 08-25 | Last visit | Next | Lifetime invoiced | Age |
|---|---|---|---|---|---|---|---|
| #4979 | Marcus Andy | Cash | **3** | 09-09 | 09-16 | **$0** | 917d |
| #5433 | Susan Newby | Cash | **3** | 09-09 | 09-16 | **$0** | 803d |
| #6900 | Jeff Hunter | paid in full | **3** | 09-09 | 09-16 | **$0** | 412d |
| #7767 | Jamie Randall | **none** | 2 | 09-02 | 09-11 | **$0** | 181d |
| #7449 | Sally Gasser | **none** | 2 | 09-01 | 09-11 | $340 (last 2026-01-31) | 314d |
| #4754 | Barry Heimbigner | **none** | 2 | 09-04 | 09-18 | **$0** | 1,014d |
| #8339 | Donald Kaplan | **none** | 2 | 09-04 | 09-11 | $0 (bills on close) | 20d |
| #8338 | Leena Shah | **none** | 2 | 09-03 | 09-10 | $0 (bills on close) | 27d |
| #4492 | Rich Porter | paid in full | 1 | 09-08 | 09-15 | **$0** | 1,099d |
| #5007 | Karen Porter | paid in full | 1 | 08-27 | 09-30 | **$0** | 923d |
| #5440 | Steve Hewitt | Cash | 1 | 09-01 | 10-01 | $160 (last Aug 2024) | 800d |
| #6420 | Vikrant Jain | **none** | 1 | 09-01 | 10-06 | $83.33 | 554d |

Two things fall out of that table:

**The six with no comp tag at all** — Randall, Gasser, Heimbigner, Kaplan, Shah, Jain — are the ones that need a ruling. At the standard $100/mo that is **≈$7,200/yr** being delivered with no record of why it is free. Kaplan and Shah are the newest and the cheapest to fix: both are priced at $100, both were sold in the last month, and both are simply set to *bill on close* on a year-round job, which means they will never invoice.

**The six that are tagged Cash or paid in full** are a different problem — not a pricing decision, a bookkeeping one. #4979 Marcus Andy has taken 57 visits over 917 days with $0 ever recorded in Jobber. If that money is coming in as cash, none of it is landing in the system the P&L reads.

Taken together the eleven zero-charge jobs are **≈$12,800/yr** at list rate.

### Tiers 2–4 — unchanged

- **Yearly-schedule prepays:** the same 16, and the same 8 of them ($675/mo: Butt, Hahn, Shapiro, Davis, Watson, Mcdonald, Goodman, McGowan) carry a *monthly* price on a *yearly* schedule, so the script divides them by 12. **MRR correction is still exactly +$618.75/mo** — corrected MRR **$80,885.94**, not the $80,267.18 the script reports.
- **#5597 Jim McGowan** — unchanged. Still one $85 invoice in 777 days.
- **#8056 Madera West Condos — resolved, counted correctly.** It shows $7,650 invoiced in 70 days against a $3,825 quarterly schedule, i.e. two full cycles where one was due, which looked like it might be billing monthly. Spencer confirmed 09-09: **the client accidentally paid twice and asked that it be applied as two quarters paid.** So $3,825 is genuinely quarterly, **$1,275/mo is the right MRR contribution**, and the account is **prepaid through the end of Q4** — next invoice due ~2027-01-01, not 2026-10-01. Do not chase it in the interim. This is the largest single account in the book; had it been monthly, MRR would be $83,435.94.
- **Sub-floor $50 jobs:** same 7 (Charles #8157, Jonae #8159, Higashiyama, Fisher, Taylor, Good, VandenBrink), still no discount line recording why. Compare Barbee Mill, which does this properly: `Total Mole Control @$100` + `Barbee Mill HOA discount @−$50`.

---

## 4. Autopay — the trend line has now broken

| | 08-11 | 08-19 | 08-25 | 09-09 |
|---|---|---|---|---|
| Jobs on autopay | 212 | 219 | 218 | **218** |
| TMCP jobs | 675 | 694 | 709 | **735** |
| Share | 31.4% | 31.6% | 30.7% | **29.7%** |

**0 of 29 new sales went on autopay.** The absolute count has not moved in three weeks while the book added 41 jobs. Hand-billed TMCP is now **$58,927/mo across 517 jobs**, up from $56,317 a fortnight ago.

This is the only number in the audit that is moving, and it is moving the wrong way on its own. Below ~29% it stops being a collections nuisance and starts being the reason DSO and write-offs grow with the book.

---

## Do next

1. **Fix the tag at the booking step, not the list.** Same-day sales split tagged/untagged by who booked them — four through Voice Assist, seven with no tags at all. A checklist item or a required field at sale beats another manual sweep. (Then clear the 13, $1,395/mo.)
2. **#8219 Trent Bryan** — $200/mo, untagged through four audits and 41 days. The largest single one.
3. **#8339 Kaplan and #8338 Shah** — both priced correctly at $100 but set to *bill on close* on a year-round job. Two schedule changes, ~$2,400/yr, and they are new enough that no awkward conversation is needed.
4. **Rule on the six untagged free jobs** — Randall, Gasser, Heimbigner, Kaplan, Shah, Jain. Comp or bill? All six took service this fortnight. ≈$7,200/yr.
5. **The Cash / paid-in-full six** — if cash is being collected it is not reaching Jobber. #4979 Marcus Andy: 57 visits, $0 recorded, 917 days.
6. **Autopay at signup.** 0 of 29. This is now the largest line in the audit.
7. **Barbee Mill HOA + Woodyard** — tagged Active with no live job.

**On the pattern, three audits in:** the tag list gets cleaned by hand and refills within a fortnight, because nothing changed at the point of sale. The billing list does not move at all, because every item on it needs a *decision* (is this a comp?) rather than a fix, and no one has been asked to make one. Both lists will read the same on the next run unless something upstream changes.
