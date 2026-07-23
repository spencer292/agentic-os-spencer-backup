# TMCP Recurring Revenue Audit — 2026-07-21

Source: Jobber GraphQL full sweep — 4,807 recurring jobs (all statuses), 734 non-archived pulled
with line items, billing schedules, values, and dates; 597 clients tagged `TMCP - Active`.
TMC identity = line items (`Total Mole Control Program -- Year round protection` / `Total Mole
Control Package`), per the 7/10 method. Raw data in `projects/tool-jobber/data/`.

## Headline numbers

| Metric | Value | vs 7/10 audit |
|---|---|---|
| **Active TMC jobs** | **622** | 597 (+25 in 11 days) |
| Distinct clients | 602 | 577 |
| Clients tagged `TMCP - Active` | 597 | 584 |
| Multi-job clients | 10 (Prologis ×10, HyperGreen ×3, Cruz Rodriguez ×3, 7 others ×2) | 10 |
| Active Quick Fix (one-month) jobs | 97 | 88 |
| Barter/warranty/friends-family recurring | 11 | 13 |

## Billing cadence (622 active TMC jobs)

| Cadence | Jobs | $/period | Monthly equiv |
|---|---|---|---|
| **Monthly, last day of month** (standard) | **594** | $66,518/mo | $66,518 |
| Monthly, other day (Rasmussen, 3rd Monday) | 1 | $100/mo | $100 |
| Quarterly (Madera West $3,825; Cruz ×2 $849; Jain $83.33) | 4 | $5,606/qtr | $1,869 |
| Yearly prepay | 13 | $6,800/yr | $567 |
| **NEVER — "Don't remind me to invoice"** ⚠️ | 7 | — | $0 |
| **ON_COMPLETION — "when job is marked closed"** ⚠️ | 3 | — | $0 |

**TMC recurring MRR ≈ $69,054 → annual run rate ≈ $828,600.**
(Script summary JSON shows $71,659 — it double-bucketed two quarterly jobs as monthly; the
corrected figure above is right.)

96% of the base is on the standard last-day-of-month schedule. 10 jobs are set wrong.

## ⚠️ Billing violations (10 jobs)

### ON_COMPLETION (bills only when the job closes — TMC jobs run ~10 years, so effectively never)

| Job | Client | $/mo | Started | Disposition (7/22) |
|---|---|---|---|---|
| 8058 | Samantha Sieverling | $100 | 6/25/26 | **FIXED** — verified live: monthly/last-day |
| 8197 | Erin Irvine | $100 | 7/22/26 | **FIXED** — verified live: monthly/last-day |
| 5440 | Steve Hewitt | $0 | 7/1/24 | **OK per Spencer — pays once a year** (billed manually) |

### NEVER ("Don't remind me to invoice")

| Job | Client | $/mo | Started | Note |
|---|---|---|---|---|
| **5007** | **Karen Porter** | **$100** | **2/29/24** | **OK per Spencer (7/22) — pays once a year.** Consider setting the schedule to Yearly (like a prepay) so the renewal reminds instead of relying on memory. |
| 7701 | Susan Mcdonald | $75 | 2/25/26 | 1 invoice for $900 = 12×$75 — she prepaid the year; schedule should be set Yearly, not Never |
| 7449 | Sally Gasser | $0 | 10/30/25 | 4 invoices/$340 — billed manually |
| 7767 | Jamie Randall | $0 | 3/12/26 | $0 line — comp/barter? verify |
| 6900 | Jeff Hunter | $0 | 7/24/25 | $0 line, ends 7/24/26 — comp ending this week |
| 5433 | Susan Newby | $0 | 6/28/24 | $0 line — comp? verify |
| 4754 | Barry Heimbigner | $0 | 11/30/23 | $0 line — comp? verify |

### Suspicious "Yearly" pricing (8 of 13 yearly jobs)

These bill **once per year** at what looks like a **monthly** price: Cheryl Davis $85, Charles
Hahn $100, Briana Watson $85, Michael Shapiro $95, Shari Butt $100, Jim McGowan $85, Howard
Goodman $50, Rich Porter $0. If these people are meant to pay ~$85–100/mo, each is underbilling
~$935–$1,100/yr (≈$6,900/yr across the eight). The 5 legit prepays: Mueller $1,200, Liu $1,000,
Bosewicht $1,200, Dougan $1,000, Cruz Rodriguez $1,800.

## Tag audit

### Active TMC job, client NOT tagged `TMCP - Active` (10)

- **8 new signups, started 7/13–7/23:** Jonae (#8159), Charles (#8157), Deborah Berger (#8156),
  Mark & Lois Parhaniemei (#8176), Kevin Bohnert (#8190), Charlie Allaire (#8209), Leslie
  Bratrud (#8178), Cindy Kamrin (#8213). Same pattern as 7/10 (all 8 then were also fresh
  signups) — **the tag still isn't being applied at signup.** Worth adding to the signup
  checklist/CSR script.
  **RESOLVED 7/22:** all 8 tagged via `clientEdit(tagsToAdd)` with read-back verification.
  Tagged count now 605.
- **2 tagged `TMCP Churned` but job still active:** Larry Lemmon (#5639) and Justin Muir
  (#7150) — **Spencer confirmed 7/22 both are canceling; final bill this month.** Churned
  tags correct; no change.

### Tagged `TMCP - Active`, NO active TMC job (5) — resolved 7/22

- Marcus Andy: ACTIVE on ONE_OFF job #4979 (TMCP line, $0, cash annual payer) — tag correct; my recurring-only sweep missed one-off jobs.
- Connie Schlimgen: not active per Spencer — tag REMOVED.
- Aziz El-solh: ACTIVE, job #8150 started 7/10 — but created as ONE_OFF + bill-at-close, ends 2036; will never bill monthly. Needs rebuild as recurring monthly/last-day.
- Tyler Smythe ($0 barter jobs) and Barbee Mill HOA ($1,000/mo on Quick Fix line item, ends 2027) — left as-is.

### One-off blind spot (found 7/22)

Active ONE_OFF jobs with TMC line items my recurring sweep missed: Marcus Andy #4979, Aziz
El-solh #8150, Tim Wickland #8087 ($100/mo, started 7/1, bill-at-close, ends 2036 — same broken
setup as Aziz), Trent Bryan #8115 ($200, started 7/8, ends 11/1/26, bill-at-close — prepaid
deal?). Wickland + Bryan tagged `TMCP - Active` 7/22. **True active TMC job count: 626.**
**RESOLVED 7/22:** Jobber blocks periodic billing on ONE_OFF jobs, so recurring twins were
created via jobCreate: Aziz #8217 + Wickland #8218 ($100/mo last-day, visit cadence + tech
preserved, to 2036) and Bryan #8219 ($200/MO last-day per Spencer — not a TMCP, tag removed —
ends Oct 31). Spencer deleted the old one-off jobs and moved Bryan 7/23 visit himself.
Final member tally: 624 recurring TMC jobs + Marcus Andy one-off = 625 members; MRR +$200 ≈
$69,254 (+ Bryan $200/mo through Oct, non-TMC). Note: Bryan line item still reads TMC Program
— future audits will classify him TMC unless the line is renamed.

## July / August outlook

*(Corrected 7/22: initial version missed Quick Fix programs already completed July 1–21 —
those jobs archive on close and the first pull covered only active jobs. Re-pulled via
endAt-filtered query, any status: `data/2026-07-22_july-enders.json` / `_aug-enders.json`.)*

**July program revenue ≈ $90,700:**

| Component | Jobs | $ |
|---|---|---|
| TMCP monthly base (bills 7/31) | 595 | ~$66,618 |
| Quick Fix programs completing in July (full month) | 58 | $23,350 — $13,700 already invoiced (incl. deposits), $10,125 still to invoice |
| Friends/family + "Converted to TMCP" enders | 3 | ~$650 |
| TMC roll-off by 7/31 | 2 | Lemmon $100 (final bill), Hunter $0 comp |

**August program revenue ≈ $98,700 (on the books so far):**

| Component | Jobs | $ |
|---|---|---|
| TMCP monthly base (bills 8/31) | ~594 | ~$66,518 |
| Quick Fix programs closing in August | 75 | $32,325 |
| TMC roll-off in August | 0 | — |

August's Quick Fix number will grow — every one-month program sold from late July onward
also lands in August. July booked 58 completions; August already has 75 on the books
before the month starts.

TMC membership roll-off is essentially zero — only Lemmon churns in the window. The August
Quick Fix close-out wave (80 jobs) is the big conversion moment: every one of those is a
warm TMCP membership prospect at close.

Not included: any quarterly (Madera $3,825) or annual invoices whose cycle happens to fall in
July/August — cycle anchor dates weren't pulled.

## Recommended fixes (need Spencer's go-ahead)

1. **Verify Karen Porter (#5007)** — top leak candidate; if unbilled, decide back-bill vs write-off, and set monthly/last-day.
2. Fix the 3 ON_COMPLETION jobs → monthly/last-day (Sieverling, Irvine, Hewitt).
3. Review the 8 suspicious $50–100 "Yearly" jobs → likely monthly/last-day at the same figure.
4. Tag the 8 new signups `TMCP - Active`; resolve Muir churned-vs-active; clean 3 stale tags (Andy, Schlimgen, El-solh).
5. Susan Mcdonald → schedule Yearly (prepaid) so 2027 renewal reminds.
6. Add "apply TMCP - Active tag + set monthly/last-day billing" to the signup checklist — this is the second audit in a row where every fresh signup was missing the tag.
