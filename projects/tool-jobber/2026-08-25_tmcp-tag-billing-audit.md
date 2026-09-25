# TMCP Audit — Tag + Billing — 2026-08-25 (re-run)

Run: `node projects/tool-jobber/scripts/tmcp-billing-audit.mjs 2026-08-25`
Source: live Jobber sweep, 871 live jobs across all 8 non-archived statuses. **Read-only — nothing was changed.**
Data: `data/2026-08-25_tmcp-billing-audit.json` · `data/2026-08-25_tmcp-jobs.jsonl` (709 rows)
Compares against the 08-19 run.

---

## Headline

**The tag problem got fixed. The billing problem did not move at all — the same 37 jobs, not one of them touched.**

And one new item that needs looking at today, not this week: **#8069 Anne Nguyen is tagged `DO NOT SERVICE` and has a tech booked for tomorrow.**

| | 08-19 | 08-25 | |
|---|---|---|---|
| Live TMCP jobs | 694 | **709** | +15 |
| Distinct clients | 673 | 687 | +14 |
| MRR (corrected) | $76,810.93 | **$78,260.93** | +$1,450.00 |
| Jobs missing the tag | 11 | **3** | **−8** ✓ |
| Jobs with a billing defect | 37 | **37** | **0 fixed, 0 new** |
| Serviced with no recurring charge | 11 | 11 | unchanged |
| Autopay | 31.6% | **30.7%** | −0.9pt |

---

## 1. Tag hygiene — mostly cleared ✓

**Nine of the eleven got tagged.** Simmons Mill HOA, Lynn Anderson, Michael Colella, Bill Henshaw, Rick Broderick, Nancy Collinsworth, Denise Froatz, Relic Rodrigues, Ken Lohse — all now carry `TMCP - Active`.

**Sue Eastman #7352** left the TMCP book, as expected — her job ended 08-20. `TMCP Churned` is now correct, and there are **no churned-but-live jobs left** (was 1).

**Tyler Smythe** cleared. Only **Barbee Mill HOA** is still tagged Active with no live TMCP job.

### Three still missing (down from 11) — $400/mo

| Job | Client | $/mo | Starts | Situation |
|---|---|---|---|---|
| #8219 | Trent Bryan | 200 | 07-30 | **Carried over** — flagged on 08-18 and 08-19, still untagged after 26 days |
| #8431 | Julie Woods | 100 | 08-19 | New sale, tag lagging — the usual pattern |
| #8069 | Anne Nguyen | 100 | 06-26 | **Not a lag — see below** |

Trent Bryan is the one to notice: he has now survived three consecutive audits untagged. Everything around him got cleaned up and he didn't.

---

## 2. ⚠️ New — #8069 Anne Nguyen: `DO NOT SERVICE` with a tech booked tomorrow

This one is different in kind from the rest of the list, and it is time-sensitive.

Her `TMCP - Active` tag was **not forgotten — it was deliberately removed and replaced.** On 08-19 her tags read `TMCP - Active; Schedule requested; Voice Assist ×2`. Today they read:

> **`DO NOT SERVICE`** · `noreview` · `Schedule requested` · `Voice Assist ×2`

Someone made a decision about this client in the last six days. But nothing downstream followed:

- The **job is still live** — `requires_invoicing`, $100/mo, ends 08-27
- **A visit is still scheduled for 2026-08-26 — tomorrow**
- 6 visits completed, $200 invoiced, $0 outstanding

So a tech is currently routed to a property the office has flagged do-not-service. Cancel the 08-26 visit and close the job, or clear the tag — but it should not stay as it is overnight.

*(Note: this is the exact inverse of the usual defect. Everywhere else the job is right and the tag is stale; here the tag is right and the job is stale.)*

---

## 3. Billing — zero movement

I diffed job-by-job rather than trusting the matching totals. It is genuinely the same set:

- **Fixed since 08-19: none**
- **New since 08-19: none**
- Every defect category identical: 16 yearly, 8 zero-price, 7 never-invoiced, 6 no-schedule, 3 bills-on-close, 4 quarterly, 7 below-floor, 1 past-end-date

### Tier 1 — still being serviced for free (11 jobs, ≈$12,820/yr)

Not one price, schedule, or invoiced total changed on any of the eleven. And they are not dormant — spot-checking the four with no comp tag at all:

| Job | Client | Serviced since 08-19 | Last visit | Upcoming | Lifetime invoiced |
|---|---|---|---|---|---|
| #7449 | Sally Gasser | **1** | 08-24 | 54 booked | $340 (last 2026-01-31) |
| #4754 | Barry Heimbigner | **1** | 08-21 | 5 booked | **$0** |
| #7767 | Jamie Randall | 0 | 08-12 | 8 booked, next 08-27 | **$0** |
| #6420 | Vikrant Jain | 0 | 08-04 | 53 booked, next 09-01 | $83.33 |

Sally Gasser and Barry Heimbigner each took another visit *since the last audit*, still against no invoice. This is the ~$4,600/yr with no comp record behind it.

**#5440 Steve Hewitt** — unchanged. Last invoice still August 2024.
**#5597 Jim McGowan** — unchanged. Still one $85 invoice in 762 days.

### Tier 2/3/4 — unchanged

- **Yearly-schedule prepays:** same 16. MRR correction is still **+$618.75/mo** — corrected MRR **$78,260.93**, not the $77,642.18 the script reports.
- **Sub-floor $50 jobs:** same 7, still no discount line recording why.
- **#6411 Woodyard:** still live, still `action_required`, now **10 days past its end date**.

---

## 4. Autopay went backwards

| | 08-11 | 08-19 | 08-25 |
|---|---|---|---|
| Jobs on autopay | 212 | 219 | **218** |
| TMCP jobs | 675 | 694 | 709 |
| Share | 31.4% | 31.6% | **30.7%** |

The absolute count **fell by one** while the book grew by 15 jobs. Every one of those 15 new sales went on as hand-billed. **$56,317/mo of TMCP is now hand-billed**, up from $54,767 six days ago.

This is drifting in the wrong direction on its own. Nothing is pushing new sales toward autopay at signup — the same structural gap that was producing the missing-tag list until someone cleared it by hand.

---

## Do next

1. **#8069 Anne Nguyen — today.** Visit booked tomorrow on a `DO NOT SERVICE` client. Cancel the visit and close the job, or clear the tag.
2. **#8219 Trent Bryan** — untagged through three audits. $200/mo, the largest of the three.
3. **The four unexplained free jobs** — Sally Gasser, Barry Heimbigner, Jamie Randall, Vikrant Jain. Two took another visit this week. Still ~$4,600/yr with no comp record.
4. **#5440 Steve Hewitt** — last invoice August 2024.
5. **#6411 Woodyard** — 10 days past end date, still open.
6. **Autopay at signup.** The share is falling because 15 of 15 new sales went on hand-billed. This is now the largest single line in the audit and the only metric moving the wrong way.
7. **Barbee Mill HOA** — tagged Active, no live job.

**On the pattern:** the tag list got cleaned by hand and immediately started refilling (2 new in 6 days). The billing list cannot be cleaned by hand — it needs decisions (is this a comp or not?), which is why nothing moved. Those eleven jobs will still be here next week unless someone rules on them.
