# TMCP Audit: Tags, Billing, Churn (2026-10-14)

Run: `node projects/tool-jobber/scripts/tmcp-billing-audit.mjs 2026-10-14` and
`node projects/tool-jobber/scripts/tmcp-churn.mjs 2026-10-14 2026-08-19` (new script).
Source: live Jobber sweep, 901 live jobs. **Read-only. Nothing was changed.**
Data: `data/2026-10-14_tmcp-billing-audit.json`, `data/2026-10-14_tmcp-jobs.jsonl`, `data/2026-10-14_tmcp-churn.json`

## Headline

| | 09-30 | 10-14 |
|---|---|---|
| Live TMCP jobs | 770 | **787** |
| Distinct TMCP clients | 747 | **766** (21 clients hold 2+ jobs) |
| Clients tagged `TMCP - Active` | 743 | **748** |
| Clients tagged `TMCP Churned` | 25 | **31** |
| MRR (script) | $84,002.73 | **$86,492.73** |
| Jobs with a billing flag | 35 | **37** (about 20 are known prepay/quarterly, not defects) |
| Live jobs missing the Active tag | 7 | **21** ($2,325/mo) |
| Tagged Churned, job still live | 2 | **2** (different two) |
| Tagged Active, no live job | 2 | **3** |
| Autopay tagged + card on file, autopay off | 11 / $982.75 | **10 / $882.75** |

## Churn (client level, 08-19 to 10-14, 56 days)

- Start 673 clients, end 766. **14 left, 107 joined.**
- **1.14%/month client churn (about 12.8%/year).** Revenue churn 0.93%/month ($1,305 MRR lost of $76,192).
- Pace is rising: 7 of the 14 left in the last two weeks (09-30 to 10-14), about 1%
  in 14 days, so roughly 2%/month if it holds. Watch whether that is an end-of-season pattern.
- A client counts as churned only when they have no live TMCP job at all. A re-created job is not churn.
- Limit: snapshots only go back to 08-19, so this is an 8-week rate, not a 12-month one.

Who left: Sue Eastman, Woodyard, Terry Williams, Anne Nguyen, Eileen Petralia, Hector Soto-Garcia,
Rob Chadek, Bryce Murphy, Deborah Canon, Ashley Clark, Ryan Coffey, Jon Foster, Pam Griffin, David Rosser.

## Billing: fix these

1. **#8613 Steve Burns (Medina):** the job total is now **-$20**. The line is $100 with a $120 job
   discount, so it invoices nothing (or a credit) every month. On 09-29 it was a $1,200 line with a 10%
   reduction. Someone changed it and it's still wrong. Also untagged.
2. **#8358 Paul Watson (Buckley, $100/mo):** 64 days old, **$0 ever invoiced**. Missed both the 08-31 and
   09-30 cycles, so $200 is unbilled. The schedule reads monthly but isn't firing. Raise the invoices by hand and check the schedule.
3. **#7282 Cushman & Wakefield ($125/mo, commercial):** the job **ended 09-30** and $125 is outstanding.
   No more visits or invoices will generate. Renew the contract or close the job.
4. **#7183 Eric Dworkis ($100/mo):** tagged `TMCP Churned`, but the job is live **on autopay** ($1,300
   charged to date). If he cancelled, his card is still being charged. Close the job and check for
   a refund. If he's still a customer, swap the tag to Active.
5. **#7897 Anne Gallagher ($85/mo):** tagged `TMCP Churned` + `DO NOT SERVICE`, owes $255, and the
   job is live and will invoice $85 again on 10-31. Close the job; the $255 goes to collections.
6. **#8722 David Coutts:** booked to start 10-15 on "bills when closed", so it will never invoice
   monthly. Switch to monthly.

## Billing: still open from earlier audits

- **Serviced, billing $0:** #5007 Karen Porter, #7767 Jamie Randall, #4754 Barry Heimbigner, #7449 Sally
  Gasser, #4979 Marcus Andy, #5433 Susan Newby, #4492 Rich Porter, #5440 Steve Hewitt. Each needs a
  ruling: comp (tag it) or bill it.
- **Under-billed schedules:** #5597 Jim McGowan, an $85 line on a *yearly* schedule ($85 invoiced in 812
  days). #6420 Vikrant Jain, $250 quarterly with only $333 invoiced in 589 days.
- **$50/mo with no discount line (7), still no ruling:** #8157 Charles, #8159 Jonae, #7684 Higashiyama,
  #7685 Fisher, #7819 Taylor, #7424 VandenBrink, #7425 Good.
- **Fixed since 09-29:** Kaplan #8339 and Shah #8338 are off the list. Bryce Murphy and Deborah Canon
  were closed correctly.

## Tags

**Missing `TMCP - Active` (18 real; Trent Bryan is the known exception and Dworkis/Gallagher are above):**
13 of these were booked since 09-30, so new bookings are not getting tagged. That's a process gap, not a backlog.
#8722 Coutts, #8708 Samuela Pulu, #8727 Jim McLaughlin ($355), #8719 Jessica Angel, #8700 Jennifer
Nguyen, #8717 Tia Gong, #8690 Donald Rose, #8665 Steilacoom Gardens Condos, #8688 Point Nautica,
#8661 Scott Kelly, #8682 Robbie Colwell, #8685 Anne Dinwiddie, #8650 Munene Peter, #8659 Dennis
Gentele, #8656 Dean Shull, #8628 Connie Schlimgen, #8629 Dustin Quaschnik, #8613 Steve Burns.

**Tagged Active, no live job (flip to `TMCP Churned`):** Ashley Clark (closed 10-01), Rob Chadek
(closed 09-24), Hector Soto-Garcia (closed 09-21). Chadek and Soto-Garcia were first flagged on 09-25.

**Churned but no Churned tag:** Anne Nguyen (#8069 closed 08-26, client archived). Low priority.

## Autopay: 10 switches, $882.75/mo

Tagged `Autopay` + card on file, autopay off on the job: #5412 Ahquin, #5227 Jana Wilson, #5324 Moser,
#8235 Schuppert, #6162 Barker, #5727 Crossley, #5439 Jacque Coffey (new), #5427 Dave Wilson, #5622
Cummings, #7961 Kunz. #7803 Faith Trimble needs a card first. Larry Gasser and Kunz #4515 dropped off,
so someone worked part of this.

## Not defects (leave alone)

#8056 Madera West (quarterly, prepaid); the yearly-prepay group (Mueller, Bosewicht, Shivashankara,
Dougan, Liu, Hahn, Butt, Shapiro, B. Watson, Davis, Mcdonald, Goodman, Cruz Rodriguez #7789); Cruz
Rodriguez #6323/#6325 quarterly; #8219 Trent Bryan semi-annual; Barbee Mill HOA umbrella.
