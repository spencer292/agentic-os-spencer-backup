# TMCP Audit — Tag Membership + Billing Setup — 2026-08-19

Run: `node projects/tool-jobber/scripts/tmcp-billing-audit.mjs 2026-08-19`
Source: live Jobber sweep, 844 live jobs across all 8 non-archived statuses. **Read-only — nothing was changed.**
Data: `data/2026-08-19_tmcp-billing-audit.json` · `data/2026-08-19_tmcp-jobs.jsonl` (694 rows)

---

## Headline

**694 live TMCP jobs across 673 clients. 11 are missing the tag. 37 are billed wrong — and 11 of those are getting serviced for free.**

| | |
|---|---|
| Live TMCP jobs | **694** (673 distinct clients, 21 extra jobs from 11 multi-property clients) |
| MRR as the script counts it | $76,192.18 |
| **MRR corrected** (see *Yearly prepay* below) | **$76,810.93** |
| Jobs missing `TMCP - Active` | **11** ($1,240/mo invisible to tag reports) |
| Jobs with a billing defect | **37** |
| **Service delivered with no recurring charge** | **11 jobs ≈ $12,820/yr** |
| Autopay | 219/694 (31.6%) — flat vs 31.4% on 08-11 |

---

## Part 1 — Missing the `TMCP - Active` tag (11 jobs, $1,240/mo)

Billing follows the **Job**, so these all bill fine. They are invisible to every report that counts the **Client** tag — the Ninety scorecard, the client list, the autopay targeting.

| Job | Client | Starts | $/mo | Existing client tags |
|---|---|---|---|---|
| #8404 | Simmons Mill HOA | 08-20 | 150 | *(none)* |
| #8417 | Lynn Anderson | 08-19 | 75 | *(none)* |
| #8381 | Michael Colella | 08-19 | 100 | Schedule requested, Voice Assist ×2 |
| #8412 | Bill Henshaw | 08-17 | 125 | *(none)* |
| #8413 | Rick Broderick | 08-17 | 100 | *(none)* |
| #8332 | Nancy Collinsworth | 08-13 | 90 | *(none)* |
| #8366 | Denise Froatz | 08-12 | 100 | Schedule requested, Voice Assist ×2 |
| #8365 | Relic Rodrigues | 08-12 | 100 | *(none)* |
| #8340 | Ken Lohse | 08-11 | 100 | Schedule requested |
| #8219 | Trent Bryan | 07-30 | 200 | *(none)* |
| #7352 | Sue Eastman | 2025-10-13 | 100 | **TMCP Churned** + Schedule requested |

**Ten of the eleven are new sales from the last nine days** — the tag simply lags the sale. That is the pattern, not an accident: it was 9 jobs on 08-18 and 3 on 08-11, and it keeps regenerating because nothing applies the tag at signup.

**#7352 Sue Eastman is the odd one** — tagged `TMCP Churned` while holding a live, autopay-charging job that has invoiced $1,000. Her job ends **08-20 (tomorrow)**, so "churning" fits; the tag just got applied ~10 months early. Decide whether it renews.

*(Aaron Carriveau #8003, flagged on 08-18 as Churned-but-live, has since been fixed. Only Sue Eastman remains.)*

**Two clients tagged Active with no live TMCP job:** Tyler Smythe, Barbee Mill HOA. Unchanged since 08-11 — untag them or find the missing job.

---

## Part 2 — Billing set up incorrectly (37 jobs)

Sorted by what it actually costs you.

### Tier 1 — Serviced for free. 11 jobs, ~$12,820/yr. ⚠️ This is the real leak.

These carry a TMCP line item, are **actively being serviced** — 13 to 30 completed visits in the last 12 months, all with a next visit already booked — and raise **no recurring charge at all**.

| Job | Client | Priced | Invoice schedule | Visits last 12mo | Last serviced | Lifetime invoiced | Tag |
|---|---|---|---|---|---|---|---|
| #5007 | Karen Porter | $100 | Don't remind me to invoice | 30 | 08-12 | **$0** | paid in full |
| #4492 | Rich Porter | $0 | Yearly | 27 | 08-17 | **$0** | paid in full |
| #6900 | Jeff Hunter | $0 | Don't remind me to invoice | 25 | 08-14 | **$0** | paid in full |
| #7449 | Sally Gasser | $0 | Don't remind me to invoice | 25 | 08-11 | $340 (last 2026-01-31) | *(none)* |
| #5440 | Steve Hewitt | $0 | When the job is marked closed | 25 | 08-03 | $160 (last **2024**-08-31) | Cash |
| #4754 | Barry Heimbigner | $0 | Yearly | 24 | 08-14 | **$0** | *(none)* |
| #5433 | Susan Newby | $0 | Don't remind me to invoice | 21 | 08-14 | **$0** | Cash |
| #4979 | Marcus Andy | $0 | Don't remind me to invoice | 21 | 08-12 | **$0** | Cash |
| #7767 | Jamie Randall | $0 | Don't remind me to invoice | 18 | 08-12 | **$0** | *(none)* |
| #5597 | Jim McGowan | $85 | Yearly | 14 | 08-04 | $85 (last 2025-10-31) | paid in full |
| #6420 | Vikrant Jain | $83.33 | Every 3 months | 13 | 08-04 | $83.33 (last 2026-06-30) | *(none)* |

That is roughly **240 field visits a year** being delivered against no recurring invoice. Valued at each job's own price (or the $100 median where the job is priced $0): **$1,068/mo = $12,820/yr**.

**The honest caveat:** 7 of the 11 carry a `paid in full` or `Cash` tag, which points to a settled or off-Jobber arrangement rather than pure lost revenue. Some are probably deliberate lifetime comps. But `paid in full` on a job with **$0 lifetime invoices across 900+ days and 27 visits a year** is not a record of anything — you cannot tell a comp from an oversight.

**The four with no explanation at all** — #7767 Jamie Randall, #7449 Sally Gasser, #4754 Barry Heimbigner, #6420 Vikrant Jain — are the sharpest ask: ~$383/mo, ~$4,600/yr, no tag, no note, still being serviced this month. Start there.

**#5440 Steve Hewitt** deserves its own line: last invoice **August 2024**, 25 visits since.

### Tier 2 — Yearly schedule, monthly price. 8 jobs. Not a leak; an MRR miscount (1 exception).

A `Yearly` job here carries the **monthly** line price and gets one invoice raised at 12×. Verified in the invoice history — Shari Butt #7474 has total $100 and a single invoice of **$1,200** subject *"For Services Rendered 11/30/25 – 11/30/2026"*.

So these are legitimate **annual prepays**, and any MRR calc that divides the job total by 12 undercounts them by 11/12.

| Job | Client | Job total | Lifetime invoiced | Verdict |
|---|---|---|---|---|
| #7474 | Shari Butt | $100 | $1,200 ✓ | prepaid, correct |
| #6287 | Charles Hahn | $100 | $1,200 ✓ | prepaid, correct |
| #7900 | Michael Shapiro | $95 | $1,140 ✓ | prepaid, correct |
| #7489 | Cheryl Davis | $85 | $1,020 ✓ | prepaid, correct |
| #8030 | Briana Watson | $85 | $1,020 ✓ | prepaid, correct |
| #7701 | Susan Mcdonald | $75 | $900 ✓ | prepaid, correct |
| #7967 | Howard Goodman | $50 | $600 ✓ | prepaid, correct (Barbee Mill rate) |
| **#5597** | **Jim McGowan** | **$85** | **$85** ✗ | **756 days, one invoice — broken** (also in Tier 1) |

**MRR correction: +$618.75/mo.** These eight were counted at $56.25/mo when they are worth $675/mo. Corrected TMCP MRR is **$76,810.93**, not $76,192.18.

The other 6 yearly jobs (Cruz Rodriguez $1,800; Sabra Bosewicht, Michelle Mueller $1,200; Belur Shivashankara $1,050; Jinzhi Liu, Vicky Dougan $1,000) carry a genuinely annual total and are counted correctly.

### Tier 3 — Priced below the floor with no discount line. 7 jobs.

Policy pricing is $100/$125/$150 per month by acreage. These bill a flat **$50** with nothing recording why:

| Job | Client | Address | Started |
|---|---|---|---|
| #7425 | Ross Good | 5006 35th Ave NE, Seattle 98105 | 2025-10-29 |
| #7424 | Irene VandenBrink | 5002 35th Ave NE, Seattle 98105 | 2025-10-29 |
| #7684 | Dennis Higashiyama | 21621 SE 259th St, Maple Valley 98038 | 2026-02-18 |
| #7685 | Mark Fisher | 21703 SE 259th St, Maple Valley 98038 | 2026-02-11 |
| #7819 | Kirsten Taylor | 21711 SE 259th St, Maple Valley 98038 | 2026-04-03 |
| #8157 | Charles | 14417 5th Ave E, Tacoma 98445 | 2026-07-15 |
| #8159 | Jonae | 1409 SW 349th St, Federal Way 98023 | 2026-07-13 |

**Five of seven are neighbor clusters** (two on 35th Ave NE, three on SE 259th St) — the same economics as the `Neighboring Property Discount` used elsewhere in the book. The price is probably what was agreed.

Compare the **Barbee Mill HOA cluster**, which does this correctly — all 11 jobs read `Total Mole Control @$100` **+** `Barbee Mill HOA discount @-$50`. List price preserved, discount documented, and a future price rise can be applied across the board.

The 7 above lose that. Re-cut them as $100 − $50 discount so the list price survives. The two singletons — **#8157 Charles** and **#8159 Jonae**, both new in July, both with no last name on the client record — have no cluster to explain them and look like straight mispricing.

### Tier 4 — Expired but still running. 1 job.

**#6411 John and Tessa Woodyard** — $100/mo on autopay, ended **08-15**, still sitting in `action_required` with $1,700 invoiced. Open since the 08-18 audit. Close it or renew it.

---

## Movement since 08-18

| | 08-18 | 08-19 | Δ |
|---|---|---|---|
| Live jobs scanned | 837 | 844 | +7 |
| TMCP jobs | 690 | 694 | +4 |
| Distinct clients | 669 | 673 | +4 |
| Clients tagged Active | 662 | 664 | +2 |
| Jobs missing the tag | 9 | **11** | **+2** |
| Autopay share | — | 31.6% | +0.2pt vs 08-11 |

The missing-tag count is growing, not shrinking — four new sales landed and only two got tagged.

---

## Do next

1. **Tag the 11.** Ten are just new sales. The recurring fix is applying `TMCP - Active` at signup — this list regenerates every week otherwise (3 → 9 → 11 in eight days).
2. **Decide the 4 unexplained free jobs** — Jamie Randall, Sally Gasser, Barry Heimbigner, Vikrant Jain. ~$4,600/yr, being serviced right now, no comp record. Either price them or record why they are free.
3. **Steve Hewitt #5440** — 25 visits since the last invoice in August 2024.
4. **Jim McGowan #5597** — an annual prepay that never got its annual invoice. ~$1,000 outstanding.
5. **Record the 7 sub-floor jobs as $100 − $50 discount**, the way Barbee Mill does it. Check #8157 and #8159 individually — no cluster explains them.
6. **Use $76,810.93 for MRR**, and 694 jobs — not the 664 tagged clients.
7. **Sue Eastman #7352** ends tomorrow; **#6411 Woodyard** expired 08-15. Close or renew both.

**Autopay is still the biggest single line.** 31.6% — statistically unmoved since 08-11 despite the 08-11 finding that 277 hand-billed clients already have a card on file (~$32k/mo). $54,767/mo of TMCP is still hand-billed.
