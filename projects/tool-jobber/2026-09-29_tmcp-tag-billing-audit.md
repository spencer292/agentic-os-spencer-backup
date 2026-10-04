# TMCP Audit — Tag + Billing — 2026-09-29

Run: `node projects/tool-jobber/scripts/tmcp-billing-audit.mjs 2026-09-29`
Source: live Jobber sweep, 891 live jobs. **Read-only — nothing was changed.**
Data: `data/2026-09-29_tmcp-billing-audit.json` · `data/2026-09-29_tmcp-jobs.jsonl`

## Headline

| | 09-25 | 09-29 |
|---|---|---|
| Live TMCP jobs | 761 | **769** |
| MRR (script) | $83,967.18 | **$84,752.18** |
| Jobs with a billing defect | 36 | **36** (none fixed, none new) |
| Jobs missing the tag | 4 | **8** (incl. Trent Bryan) |
| Tagged Churned but job still live | 0 | **2** (new) |
| Autopay tagged but off | 12 | 12 |

## Fix before month-end invoicing (09-30)

1. **#8613 Steve Burns** (Medina): the line item is $1,200 and the job carries a 10% reduction. It's
   still on a **monthly** schedule, so it will invoice **$1,080 on 09-30 and every month after**. If
   it's an annual prepay, switch it to yearly. Also untagged. Flagged 09-25, not changed.
2. **#7303 Bryce Murphy ($90/mo) and #6396 Deborah Canon ($95/mo)**: both clients are tagged
   `TMCP Churned`, but their jobs are live on monthly schedules and will invoice on 09-30. Either
   close the job, or remove the Churned tag if they are still customers.
3. **#8358 Paul Watson** (Buckley, $100/mo): 49 days old, $0 invoiced. The 08-31 invoice never
   went out.

## Serviced but billing nothing or almost nothing

| Job | Client | Setup | Invoiced to date | Age |
|---|---|---|--:|--:|
| #8338 | Leena Shah | $100, bills on close | $0 | 47d |
| #8339 | Donald Kaplan | $100, bills on close | $0 | 40d |
| #5007 | Karen Porter | $100, no invoice schedule ("paid in full" tag) | $0 | 943d |
| #7767 | Jamie Randall | $0, no schedule, no comp tag | $0 | 201d |
| #4754 | Barry Heimbigner | $0, yearly, no comp tag | $0 | 1,034d |
| #7449 | Sally Gasser | $0, no schedule, no comp tag | $340 (last Jan) | 334d |
| #4979 | Marcus Andy | $0, no schedule, Cash tag | $0 | 937d |
| #5433 | Susan Newby | $0, no schedule, Cash tag | $0 | 823d |
| #4492 | Rich Porter | $0, yearly, "paid in full" tag | $0 | 1,119d |
| #5440 | Steve Hewitt | $0, bills on close, Cash tag | $160 (Aug 2024) | 820d |
| #5597 | Jim McGowan | $85, yearly schedule | $85 total | 797d |
| #6420 | Vikrant Jain | $83.33, quarterly | $83.33 total | 574d |

Kaplan and Shah are priced correctly: only the schedule needs changing, to monthly.

## Needs a ruling: $50/mo with no discount line (7)

#8157 Charles · #8159 Jonae · #7684 Dennis Higashiyama · #7685 Mark Fisher · #7819 Kirsten Taylor ·
#7424 Irene VandenBrink · #7425 Ross Good. Half the floor price with nothing on record explaining why.

## Tags

- **Missing `TMCP - Active`:** #8650 Munene Peter, #8651 Robert Hartsell (both booked today),
  #8628 Connie Schlimgen, #8629 Dustin Quaschnik, #8613 Steve Burns. (#8219 Trent Bryan is a
  semi-annual exception, not a defect.)
- **Tagged Active, no live job:** Rob Chadek, Hector Soto-Garcia.

## Autopay: 11 switches, $982.75/mo

Client tagged `Autopay` + card on file, autopay off on the job: #5412 Ahquin, #8552 Larry Gasser,
#5227 Jana Wilson, #5324 Moser, #8235 Schuppert, #5727 Crossley, #4515 + #7961 Kunz, #6162 Scott
Barker (owes $85), #5427 Dave Wilson, #5622 Cummings. #7803 Faith Trimble has no card on file, so it
needs a card first.

## Not defects (known, leave alone)

- #8056 Madera West: quarterly, prepaid through Q4.
- The yearly-prepay group: Mueller, Bosewicht, Shivashankara, Dougan, Liu, Hahn, Butt, Shapiro,
  B. Watson, Davis, Mcdonald, Goodman, Cruz Rodriguez #7789.
- #6323 and #6325 Cruz Rodriguez: quarterly, invoicing normally.
- #8219 Trent Bryan: semi-annual.
