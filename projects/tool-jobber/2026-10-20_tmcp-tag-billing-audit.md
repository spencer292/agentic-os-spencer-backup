# TMCP Audit: Tags, Billing, Churn (2026-10-20)

Run: `node projects/tool-jobber/scripts/tmcp-billing-audit.mjs 2026-10-20` and
`node projects/tool-jobber/scripts/tmcp-churn.mjs 2026-10-20 2026-08-19`.
Source: live Jobber sweep, 912 live jobs. **Read-only. Nothing was changed.**
Data: `data/2026-10-20_tmcp-billing-audit.json`, `data/2026-10-20_tmcp-jobs.jsonl`, `data/2026-10-20_tmcp-churn.json`

## Headline

| | 10-14 | 10-17 | 10-20 |
|---|---|---|---|
| Live TMCP jobs | 787 | 791 | **797** |
| Distinct TMCP clients | 766 | 770 | **776** (21 clients hold 2+ jobs) |
| Clients tagged `TMCP - Active` | 748 | 750 | **753** |
| Clients tagged `TMCP Churned` | 31 | 31 | **34** |
| MRR (script) | $86,492.73 | $86,982.73 | **$87,687.73** |
| Jobs with a billing flag | 37 | 36 | **34** (about 20 are known prepay/quarterly, not defects) |
| Live jobs missing the Active tag | 21 | 23 | **24** ($2,830/mo; 22 real) |
| Tagged Churned, job still live | 2 | 2 | **1** (new one) |
| Tagged Active, no live job | 3 | 3 | **1** |
| Autopay tagged + card on file, autopay off | 10 / $882.75 | 10 / $882.75 | **10 / $882.75** |

## Churn (client level, 08-19 to 10-20, 62 days)

- Start 673 clients, end 776. **16 left, 119 joined.**
- **1.17%/month client churn (about 13.2%/year).** Revenue churn 0.96%/month ($1,490 MRR lost of $76,192).
- New departures since 10-17: Eric Dworkis #7183 and Anne Gallagher #7897, both closed 10-17 and both tagged Churned correctly.
- 9 of the 16 left since 09-30, so October is running at about 1.8%/month against about 0.75% for 08-19 to 09-30.
- Limit: snapshots only go back to 08-19, so this is a 9-week rate, not a 12-month one.

## Fixed since 10-17

- #7183 Eric Dworkis: job closed, so autopay stops charging. Check whether he's owed a refund for any charge after he cancelled.
- #7897 Anne Gallagher: job closed. Her $255 balance stays for collections.
- #8722 David Coutts: now on a monthly schedule.
- Ashley Clark and Rob Chadek: flipped to `TMCP Churned`.

## Billing: fix these

1. **#7457 Chris Sita ($100/mo):** the tag was flipped to `TMCP Churned` since 10-17, but the job is
   still live, owes $200, and will invoice $100 again on 10-31. Close the job if he's gone. If he's
   staying, flip the tag back.
2. **#7282 Cushman & Wakefield ($125/mo, commercial):** the job **ended 09-30** and $125 is outstanding.
   Renew the contract or close the job.

## Billing: still open from earlier audits

- **Serviced, billing $0:** #5007 Karen Porter, #7767 Jamie Randall, #4754 Barry Heimbigner, #7449 Sally
  Gasser, #4979 Marcus Andy, #5433 Susan Newby, #4492 Rich Porter, #5440 Steve Hewitt. Each needs a
  ruling: comp (tag it) or bill it.
- **Under-billed schedules:** #5597 Jim McGowan, an $85 line on a *yearly* schedule ($85 invoiced in 820
  days). #6420 Vikrant Jain, $250 quarterly with only $333 invoiced in 597 days.
- **$50/mo with no discount line (7), still no ruling:** #8157 Charles, #8159 Jonae, #7684 Higashiyama,
  #7685 Fisher, #7819 Taylor, #7424 VandenBrink, #7425 Good.

## Tags

**Missing `TMCP - Active` (22 real; Trent Bryan is the known exception and Chris Sita is above):**
New bookings are still not getting tagged: 17 of these were booked since 09-30, including 3 more since 10-17.
#8754 Kirby Gusa (new), #8747 Liz Silke (new), #8739 Dean Ainardi, #8735 Jennifer Yarington, #8722 David
Coutts, #8708 Samuela Pulu, #8727 Jim McLaughlin ($355), #8719 Jessica Angel, #8700 Jennifer Nguyen,
#8717 Tia Gong, #8690 Donald Rose, #8665 Steilacoom Gardens Condos, #8688 Point Nautica, #8661 Scott
Kelly, #8685 Anne Dinwiddie, #8682 Robbie Colwell, #8650 Munene Peter, #8659 Dennis Gentele, #8656 Dean
Shull, #8628 Connie Schlimgen, #8629 Dustin Quaschnik, #8613 Steve Burns.

**Tagged Active, no live job (flip to `TMCP Churned`):** Hector Soto-Garcia (#7745 closed 09-21, first flagged 09-25).

**Churned but no Churned tag:** Anne Nguyen (#8069 closed 08-26, client archived). Low priority.

## Autopay: 10 switches, $882.75/mo (unchanged)

Tagged `Autopay` + card on file, autopay off on the job: #5412 Ahquin, #5227 Jana Wilson, #5324 Moser,
#8235 Schuppert, #6162 Barker, #5727 Crossley, #5439 Jacque Coffey, #5427 Dave Wilson, #5622 Cummings,
#7961 Kunz. #7803 Faith Trimble needs a card first.

## Not defects (leave alone)

#8358 Paul Watson (Quick Fix deposit + first month waived; first invoice 10-31, the script stops excusing it
after 11-01); #8056 Madera West (quarterly, prepaid); the yearly-prepay group (Mueller, Bosewicht,
Shivashankara, Dougan, Liu, Hahn, Butt, Shapiro, B. Watson, Davis, Mcdonald, Goodman, Cruz Rodriguez
#7789); Cruz Rodriguez #6323/#6325 quarterly; #8219 Trent Bryan semi-annual; Barbee Mill HOA umbrella.
