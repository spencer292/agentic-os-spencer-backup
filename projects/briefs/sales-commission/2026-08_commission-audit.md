# Commission and salesperson-attribution audit — 2026-08

Source: 748 invoices issued in 2026-08, plus 234 quotes created in 2026-08. Pulled 2026-09-09 19:05Z.

## 1. Attribution health

| | Invoices | Invoiced |
|---|---:|---:|
| Chain clean (quote = job = invoice) | 311 | $52,232.25 |
| Has a problem | 437 | $57,549.05 |
| **Total** | **748** | **$109,781.30** |

### Problems by type

| Problem | Invoices | Invoiced | What it means |
|---|---:|---:|---|
| `NO_SELLER_ANYWHERE` | 282 | $37,487.75 | No quote and no seller anywhere — unattributable without a human call |
| `JOB_MISSING_SELLER` | 144 | $18,491.30 | Quote had a seller, the job lost it |
| `INVOICE_MISSING_SELLER` | 136 | $17,251.30 | Seller known upstream but the invoice has none — Jobber's own commission report misses it |
| `QUOTE_MISSING_SELLER` | 42 | $7,289.25 | A quote exists but nobody was set on it at the source |
| `INVOICE_DISAGREES_WITH_QUOTE` | 7 | $685.00 | Invoice credits a different person than the quote |
| `JOB_DISAGREES_WITH_QUOTE` | 6 | $585.00 | Job credits a different person than the quote |

## 2. Commissionable totals by salesperson

Seller is resolved from the QUOTE first, then the job, then the invoice — so a broken chain still lands on the right person here, even where Jobber's own report would miss it.

| Salesperson | Invoices | Invoiced | Collected | Of which flagged |
|---|---:|---:|---:|---:|
| Spencer Hill | 238 | $43,403.80 | $26,307.50 | 56 ($8,471.30) |
| (UNATTRIBUTED) | 282 | $37,487.75 | $30,052.00 | 282 ($37,487.75) |
| Cory Ventura | 80 | $13,379.75 | $5,850.00 | 25 ($3,890.00) |
| Courtney | 48 | $5,155.00 | $4,015.00 | 32 ($3,190.00) |
| Tavis Alexander | 48 | $4,800.00 | $4,075.00 | 32 ($3,145.00) |
| Brayden Rich | 26 | $2,580.00 | $2,380.00 | 7 ($690.00) |
| Muhammad Javed | 11 | $1,200.00 | $900.00 | 2 ($200.00) |
| Robert Norton | 6 | $965.00 | $400.00 | 1 ($475.00) |
| Jeff Mitchell | 4 | $370.00 | $370.00 | 0 ($0.00) |
| Luke LaVergne | 2 | $200.00 | $100.00 | 0 ($0.00) |
| Alias Franks | 2 | $140.00 | $140.00 | 0 ($0.00) |
| Cammeron Anderson | 1 | $100.00 | $100.00 | 0 ($0.00) |

### Split by product

| Salesperson | Product | Invoices | Invoiced | Collected |
|---|---|---:|---:|---:|
| Spencer Hill | TMCP | 184 | $22,523.80 | $14,427.50 |
| Spencer Hill | Quick Fix | 49 | $20,130.00 | $11,880.00 |
| Spencer Hill | Other | 5 | $750.00 | $0.00 |
| (UNATTRIBUTED) | TMCP | 252 | $26,587.75 | $21,302.00 |
| (UNATTRIBUTED) | Quick Fix | 26 | $10,575.00 | $8,500.00 |
| (UNATTRIBUTED) | Barter/F&F | 2 | $325.00 | $250.00 |
| (UNATTRIBUTED) | Other | 2 | $0.00 | $0.00 |
| Cory Ventura | TMCP | 76 | $11,554.75 | $5,550.00 |
| Cory Ventura | Quick Fix | 3 | $1,825.00 | $300.00 |
| Cory Ventura | Other | 1 | $0.00 | $0.00 |
| Courtney | TMCP | 47 | $4,705.00 | $4,015.00 |
| Courtney | Quick Fix | 1 | $450.00 | $0.00 |
| Tavis Alexander | TMCP | 48 | $4,800.00 | $4,075.00 |
| Brayden Rich | TMCP | 26 | $2,580.00 | $2,380.00 |
| Muhammad Javed | TMCP | 9 | $900.00 | $900.00 |
| Muhammad Javed | Quick Fix | 1 | $150.00 | $0.00 |
| Muhammad Javed | Other | 1 | $150.00 | $0.00 |
| Robert Norton | TMCP | 6 | $965.00 | $400.00 |
| Jeff Mitchell | TMCP | 4 | $370.00 | $370.00 |
| Luke LaVergne | TMCP | 2 | $200.00 | $100.00 |
| Alias Franks | TMCP | 2 | $140.00 | $140.00 |
| Cammeron Anderson | TMCP | 1 | $100.00 | $100.00 |

## 3. Fix list — every invoice with a broken chain

| Invoice | Date | Client | Total | Quote seller | Job seller | Invoice seller | Problem | Link |
|---|---|---|---:|---|---|---|---|---|
| 15823 | 2026-08-31 | GC Bellefield, LLC. | $1,500.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037298) |
| 14973 | 2026-08-01 | Plemmons Industries | $1,500.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/166165946) |
| 15500 | 2026-08-06 | Belur Shivashankara | $1,050.00 | Spencer Hill | — | Spencer Hill | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/167288147) |
| 15700 | 2026-08-31 | City of Burien | $950.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036931) |
| 15816 | 2026-08-31 | Marymoor Park | $906.30 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037283) |
| 15568 | 2026-08-27 | Kristin Cruse | $650.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/169612996) |
| 15508 | 2026-08-10 | Kristin Cruse | $650.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/167594617) |
| 15569 | 2026-08-27 | Joyce Moen | $500.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/169665536) |
| 15688 | 2026-08-31 | Sharon Young | $475.00 | Robert Norton | Robert Norton | — | INVOICE_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036894) |
| 15514 | 2026-08-11 | 1st Baptist Church | $450.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/167727051) |
| 15551 | 2026-08-31 | Joanna Chou | $450.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/168941354) |
| 15559 | 2026-08-26 | Anne Nguyen | $450.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/169422039) |
| 15556 | 2026-08-24 | Cindy Joaquin | $450.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/169195023) |
| 15809 | 2026-08-31 | Jill Robinson | $425.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037267) |
| 15579 | 2026-08-31 | Rick Little | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170004975) |
| 16024 | 2026-08-31 | Lan Kulapaditharom | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170127085) |
| 16017 | 2026-08-31 | T.J.  Mcgill | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170056043) |
| 15622 | 2026-08-31 | Scott Jennings | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036696) |
| 15543 | 2026-08-18 | Jake Fox | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168568210) |
| 15541 | 2026-08-18 | Michelle  Wantuch | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168538777) |
| 15530 | 2026-08-17 | Tim Banning | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168358943) |
| 15555 | 2026-08-24 | Mary Yu | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/169157553) |
| 15554 | 2026-08-24 | Jody Sanders | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/169135147) |
| 15550 | 2026-08-20 | Amy Tang | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168879394) |
| 15549 | 2026-08-20 | Vicki Yoshioka | $375.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/168878741) |
| 15546 | 2026-08-19 | Gary  Koessler | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168731357) |
| 15547 | 2026-08-20 | Jay Poole | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168800717) |
| 15490 | 2026-08-05 | Kalen Radford | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/167016169) |
| 15542 | 2026-08-18 | Jared Barrett | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168557849) |
| 15527 | 2026-08-14 | Carly Klee | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168225838) |
| 15539 | 2026-08-17 | Michael Marquez | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168430653) |
| 15499 | 2026-08-06 | Tom Clary | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/167250395) |
| 15518 | 2026-08-12 | Ryan Jaffe | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/167812447) |
| 15513 | 2026-08-11 | Jeannette  Takashima | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/167722917) |
| 15498 | 2026-08-06 | Heidi Wilson | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/167202743) |
| 15646 | 2026-08-31 | Bye The Green Condominiums | $309.75 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036764) |
| 16086 | 2026-09-01 | HyperGreen Landscaping | $275.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263175) |
| 16184 | 2026-09-01 | Run Wild Dog Sports | $275.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264111) |
| 15677 | 2026-08-31 | Washington Premier Soccer Club | $250.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036868) |
| 15548 | 2026-08-20 | Mike Morrow | $250.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168865013) |
| 15753 | 2026-08-31 | Galilee Baptist Church | $225.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037109) |
| 16203 | 2026-09-01 | Daniel Hoffman | $200.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264378) |
| 15683 | 2026-08-31 | Trent Bryan | $200.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036878) |
| 15589 | 2026-08-31 | Thomas Spring Estates | $200.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036604) |
| 15716 | 2026-08-31 | Regency Ridge COA | $200.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036991) |
| 15617 | 2026-08-31 | Detrays | $200.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036679) |
| 15648 | 2026-08-31 | Conover Court | $175.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036769) |
| 16197 | 2026-09-01 | Larry Gasser | $170.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264292) |
| 15663 | 2026-08-31 | Kelly Kunz | $160.00 | Spencer Hill | Spencer Hill | — | INVOICE_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036828) |
| 15644 | 2026-08-31 | Skookum Archers | $155.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036758) |
| 15533 | 2026-08-17 | Simmons Mill HOA | $150.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168412411) |
| 15965 | 2026-08-31 | Ross Luo | $150.00 | Spencer Hill | Spencer Hill | — | INVOICE_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037777) |
| 16067 | 2026-09-01 | Chris Thornhill | $139.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263087) |
| 16075 | 2026-09-01 | Duncan Kariuki | $135.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263126) |
| 16183 | 2026-09-01 | Chris Taylor | $135.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264096) |
| 15981 | 2026-08-31 | Ken Larson | $125.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037865) |
| 15842 | 2026-08-31 | Matt Wood | $125.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037351) |
| 16228 | 2026-09-01 | Kevin Chen | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264671) |
| 16102 | 2026-09-01 | Amber Owen | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263248) |
| 15766 | 2026-08-31 | Don Petricic | $125.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037156) |
| 16160 | 2026-09-01 | Liz Jones | $125.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263822) |
| 16141 | 2026-09-01 | Jim Benham | $125.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263588) |
| 16209 | 2026-09-01 | Peter Dale | $125.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264459) |
| 16135 | 2026-09-01 | Mike Cushman | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263520) |
| 16120 | 2026-09-01 | MT Landscape | $125.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263378) |
| 16038 | 2026-09-01 | Carrie Williamson | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262843) |
| 16026 | 2026-09-01 | Clint Bjornson | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262716) |
| 15696 | 2026-08-31 | Vince Preece | $125.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036917) |
| 15770 | 2026-08-31 | Roselee Buonauro | $125.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037163) |
| 15653 | 2026-08-31 | Kathy Wilson | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036787) |
| 15650 | 2026-08-31 | Josh Mckee | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036777) |
| 15731 | 2026-08-31 | Thanhquyen Nguyen | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037035) |
| 15588 | 2026-08-31 | Ryan Middleton | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036601) |
| 15752 | 2026-08-31 | Barclay Square | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037106) |
| 16188 | 2026-09-01 | SLPPLLC | $115.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264167) |
| 16215 | 2026-09-01 | SLPPLLC | $115.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264526) |
| 15651 | 2026-08-31 | Stephanie Larson | $115.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036779) |
| 16131 | 2026-09-01 | Nichole  Jacobson | $112.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263481) |
| 15786 | 2026-08-31 | Lisa Shaughnessy | $110.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037210) |
| 15792 | 2026-08-31 | Amy Thomas | $110.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037225) |
| 15693 | 2026-08-31 | Maja Haloway | $105.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036910) |
| 15662 | 2026-08-31 | Dave Gierok | $105.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036824) |
| 15689 | 2026-08-31 | Rick Conces | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036897) |
| 15872 | 2026-08-31 | Bonnie Mccracken | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037446) |
| 15730 | 2026-08-31 | Rob Chadek | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037030) |
| 15954 | 2026-08-31 | Bac Walker | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037739) |
| 15634 | 2026-08-31 | Huayu Sun | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036726) |
| 15841 | 2026-08-31 | Sarah Templin | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037349) |
| 15621 | 2026-08-31 | Eric Reddy | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036695) |
| 15779 | 2026-08-31 | Douglas  Kelly | $100.00 | Spencer Hill | — | Spencer Hill | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037187) |
| 15706 | 2026-08-31 | Greg Hastings | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036951) |
| 15787 | 2026-08-31 | Josh Trachtenberg | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037211) |
| 15987 | 2026-08-31 | Brian Meadows | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037884) |
| 15773 | 2026-08-31 | Olivia Sandoval | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037171) |
| 16004 | 2026-08-31 | Jennifer Pere | $100.00 | Spencer Hill | — | Spencer Hill | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037937) |
| 15815 | 2026-08-31 | Mark Dumler | $100.00 | Courtney | Spencer Hill | Spencer Hill | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/170037281) |
| 15844 | 2026-08-31 | Jeannine Rouleau | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037356) |
| 15612 | 2026-08-31 | Wanda Neste | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036665) |
| 15799 | 2026-08-31 | Dawn St Clair | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037242) |
| 15793 | 2026-08-31 | Larry McGowan | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037228) |
| 15751 | 2026-08-31 | Mike  Magnusson | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037103) |
| 15836 | 2026-08-31 | Charanjit  Kalsi | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037338) |
| 15777 | 2026-08-31 | Kelsey White | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037180) |
| 15853 | 2026-08-31 | Jennifer Cramer | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037391) |
| 15762 | 2026-08-31 | Rosemarie  Havranek | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037144) |
| 15760 | 2026-08-31 | Rosemarie Havranek | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037134) |
| 15865 | 2026-08-31 | Charles Strauss | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037425) |
| 15874 | 2026-08-31 | Gary Fredericks | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037450) |
| 15960 | 2026-08-31 | Deborah Berger | $100.00 | Spencer Hill | — | Spencer Hill | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037762) |
| 15811 | 2026-08-31 | Ashleigh  Root | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037273) |
| 15682 | 2026-08-31 | Linda Lowe | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036876) |
| 15759 | 2026-08-31 | Liz Hannon | $100.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037131) |
| 15803 | 2026-08-31 | Darren Bartels | $100.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037250) |
| 15745 | 2026-08-31 | Dave Koshork | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037079) |
| 15850 | 2026-08-31 | Brent Fernyhough | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037380) |
| 15978 | 2026-08-31 | Doug Crow | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037855) |
| 15886 | 2026-08-31 | Max Ye | $100.00 | Spencer Hill | — | Spencer Hill | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037495) |
| 15818 | 2026-08-31 | Edward Yang | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037287) |
| 16185 | 2026-09-01 | Dennis Mccreery | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264123) |
| 16046 | 2026-09-01 | John Culbertson | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170262921) |
| 16240 | 2026-09-01 | Jeff Ostlund | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170268659) |
| 16118 | 2026-09-01 | Greg Flynn | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263360) |
| 16130 | 2026-09-01 | Kyle Peterson | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263472) |
| 16210 | 2026-09-01 | Bess  Poehlmann | $100.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264471) |
| 16182 | 2026-09-01 | Nadia Reynolds | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264083) |
| 16073 | 2026-09-01 | Akanksha Singh | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263118) |
| 16149 | 2026-09-01 | Peter Youngs | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263687) |
| 16108 | 2026-09-01 | Bill Harris | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263289) |
| 16029 | 2026-09-01 | Bobby  Holt | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170262742) |
| 16186 | 2026-09-01 | Evan Henke | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264138) |
| 16034 | 2026-09-01 | Gary Patterson | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262804) |
| 16051 | 2026-09-01 | Jonathan Kim-Hull | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262967) |
| 16219 | 2026-09-01 | Ryan Tacher | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264576) |
| 16206 | 2026-09-01 | Doug  Schutt | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264421) |
| 16176 | 2026-09-01 | Jonelle Loranger | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264013) |
| 16101 | 2026-09-01 | Teri McCabe | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263241) |
| 16167 | 2026-09-01 | Candice Storm | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263905) |
| 16222 | 2026-09-01 | Swenbert LLC | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264607) |
| 16171 | 2026-09-01 | Kelly  Scott | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263951) |
| 16078 | 2026-09-01 | Kristina Rollings | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263140) |
| 16158 | 2026-09-01 | Paul Hwang | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263797) |
| 16085 | 2026-09-01 | Tim Matula | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263172) |
| 16208 | 2026-09-01 | Alexandra Daley | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264446) |
| 16115 | 2026-09-01 | John and Tessa Woodyard | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263339) |
| 16105 | 2026-09-01 | David Delafield | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263267) |
| 16212 | 2026-09-01 | Melissa Street | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264494) |
| 16148 | 2026-09-01 | Melisa Shryock | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263675) |
| 16205 | 2026-09-01 | Christine Sanders-Meena | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264408) |
| 16076 | 2026-09-01 | Clint Bjornson | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263131) |
| 16134 | 2026-09-01 | Wendi Wang | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263512) |
| 16207 | 2026-09-01 | Brian Young | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264433) |
| 16226 | 2026-09-01 | Julie Carper | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264651) |
| 16089 | 2026-09-01 | Pat Birkeland | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263189) |
| 16236 | 2026-09-01 | Michael Morgan | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264725) |
| 16032 | 2026-09-01 | Mike Rohan | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262778) |
| 16056 | 2026-09-01 | Sean Finlayson | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263012) |
| 16199 | 2026-09-01 | Maggie Culbert-O’Leary | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264323) |
| 16043 | 2026-09-01 | Sherry Lotze | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170262890) |
| 16200 | 2026-09-01 | Sharon Da-Dalto | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264336) |
| 16103 | 2026-09-01 | Ray Spencer | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263255) |
| 16100 | 2026-09-01 | Robin Sofola | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263234) |
| 16079 | 2026-09-01 | Joe Kelley | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263146) |
| 16066 | 2026-09-01 | Sara Houpis | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263081) |
| 16060 | 2026-09-01 | Mary Olin | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263042) |
| 16227 | 2026-09-01 | Bonnee Terrio | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264660) |
| 16233 | 2026-09-01 | Tom Falk | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264705) |
| 16175 | 2026-09-01 | Ally Sharp | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264005) |
| 16238 | 2026-09-01 | Chris Mckenzie | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264741) |
| 16172 | 2026-09-01 | Chris Bartlett | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263964) |
| 16063 | 2026-09-01 | Jeff  Boggs | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263063) |
| 16044 | 2026-09-01 | Loren Sanchez | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170262899) |
| 16139 | 2026-09-01 | Tom Feldman | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263565) |
| 16221 | 2026-09-01 | Kelly Tivnan | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264595) |
| 16036 | 2026-09-01 | Corky Heimbigner | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262827) |
| 16150 | 2026-09-01 | Eric Dworkis | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263699) |
| 16061 | 2026-09-01 | Larena Walshe | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263051) |
| 16151 | 2026-09-01 | Craig Knebel | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263711) |
| 16142 | 2026-09-01 | Deke Turner | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263602) |
| 16052 | 2026-09-01 | Kathy Sternoff | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262978) |
| 15925 | 2026-08-31 | Melissa Bay | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037627) |
| 15904 | 2026-08-31 | Kim Suver | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037546) |
| 15915 | 2026-08-31 | Aaron Diaz | $100.00 | Courtney | — | Spencer Hill | JOB_MISSING_SELLER, INVOICE_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/170037586) |
| 15878 | 2026-08-31 | David Sprague | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037461) |
| 15826 | 2026-08-31 | April Bower | $100.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037307) |
| 15702 | 2026-08-31 | Ruth  Edwards | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036941) |
| 15801 | 2026-08-31 | Melissa  Osvaldik | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037246) |
| 15831 | 2026-08-31 | Eileen Petralia | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037319) |
| 15810 | 2026-08-31 | Marc Abraham | $100.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037272) |
| 15890 | 2026-08-31 | Debbie Jennings | $100.00 | Spencer Hill | Luke LaVergne | Luke LaVergne | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/170037508) |
| 15598 | 2026-08-31 | Gwen Morton | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036623) |
| 16005 | 2026-08-31 | Ken Lohse | $100.00 | Muhammad Javed | — | Muhammad Javed | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037941) |
| 15661 | 2026-08-31 | Mike Ahquin | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036821) |
| 15755 | 2026-08-31 | Marnee Humphrey | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037117) |
| 15695 | 2026-08-31 | Jeff Jensen | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036916) |
| 15835 | 2026-08-31 | Greg Thoreson | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037335) |
| 15848 | 2026-08-31 | Vicky Garcia | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037373) |
| 15613 | 2026-08-31 | Greg Anderson | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036668) |
| 15704 | 2026-08-31 | Dana  Daher | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036948) |
| 15703 | 2026-08-31 | John Raber | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036943) |
| 15863 | 2026-08-31 | Ashley Frizzell | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037421) |
| 15884 | 2026-08-31 | Lindsey Willis | $100.00 | — | Spencer Hill | Spencer Hill | QUOTE_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037485) |
| 15832 | 2026-08-31 | Scott Hamilton | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037321) |
| 15673 | 2026-08-31 | Matt  Wurdeman | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036858) |
| 15979 | 2026-08-31 | John Shepard | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037861) |
| 15610 | 2026-08-31 | Annette Wood | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036656) |
| 15847 | 2026-08-31 | Tom Li | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037370) |
| 15833 | 2026-08-31 | Elizabeth Kalouner | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037329) |
| 16016 | 2026-08-31 | Russ Decaire | $100.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037975) |
| 15761 | 2026-08-31 | Joe Gross | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037137) |
| 15763 | 2026-08-31 | Lynn Wecker | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037147) |
| 15891 | 2026-08-31 | Jennifer Gleason | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037511) |
| 15741 | 2026-08-31 | Dan Golden | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037064) |
| 15627 | 2026-08-31 | Lauren Tomala | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036710) |
| 15796 | 2026-08-31 | Hannah  Jacobson | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037238) |
| 15606 | 2026-08-31 | Jennifer Flanegan | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036645) |
| 15684 | 2026-08-31 | Lauren Kenyon | $100.00 | Courtney | Cory Ventura | Cory Ventura | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/170036880) |
| 15934 | 2026-08-31 | Tim Wickland | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037664) |
| 15894 | 2026-08-31 | Stratton Felker | $100.00 | Spencer Hill | — | Spencer Hill | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037517) |
| 15859 | 2026-08-31 | Seattle Rental Management | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037408) |
| 15827 | 2026-08-31 | Rahul Newaskar | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037309) |
| 15914 | 2026-08-31 | Peter Kisbye | $100.00 | Courtney | Spencer Hill | Spencer Hill | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/170037583) |
| 15640 | 2026-08-31 | Noel Murphy | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036746) |
| 15898 | 2026-08-31 | Natalya Krahn | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037529) |
| 15895 | 2026-08-31 | Mike Doud | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037522) |
| 15722 | 2026-08-31 | Lynn Clapp | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037006) |
| 15710 | 2026-08-31 | Larry Lemmon | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036966) |
| 15769 | 2026-08-31 | John Luger | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037161) |
| 15837 | 2026-08-31 | Joel Coons | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037341) |
| 15966 | 2026-08-31 | Jenna Elberts | $100.00 | Spencer Hill | — | Spencer Hill | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037785) |
| 15794 | 2026-08-31 | Jeff Taylor | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037231) |
| 15658 | 2026-08-31 | Jeff Hudson | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036804) |
| 15970 | 2026-08-31 | Erica Benson | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037819) |
| 15857 | 2026-08-31 | Elizabeth Duroe | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037402) |
| 15742 | 2026-08-31 | Eliav Coen | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037067) |
| 15901 | 2026-08-31 | Darren Corliss | $100.00 | — | Spencer Hill | Spencer Hill | QUOTE_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037539) |
| 15905 | 2026-08-31 | Danielle Steele | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037551) |
| 15821 | 2026-08-31 | Collin Sidebotham | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037294) |
| 15813 | 2026-08-31 | Chris Sita | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037276) |
| 15892 | 2026-08-31 | Ben Gardner | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037513) |
| 15868 | 2026-08-31 | Bellevue Korean Presbyterian Church | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037431) |
| 15956 | 2026-08-31 | Aziz El-solh | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037748) |
| 15520 | 2026-08-12 | Mike Marinella | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/167842509) |
| 15540 | 2026-08-18 | Michelle  Rasmussen | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/168466166) |
| 15607 | 2026-08-31 | Jana Wilson | $97.75 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036647) |
| 15708 | 2026-08-31 | Ron Short | $95.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036960) |
| 15711 | 2026-08-31 | Jane Gallagher | $95.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036971) |
| 15758 | 2026-08-31 | Miles Magnuson | $95.00 | Brayden Rich | Cory Ventura | Cory Ventura | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/170037127) |
| 16162 | 2026-09-01 | Joel Glass | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263846) |
| 16191 | 2026-09-01 | Joe  Edmunson | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264206) |
| 16048 | 2026-09-01 | Evan Epstein | $95.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262939) |
| 16091 | 2026-09-01 | Al Chappell | $95.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263196) |
| 16136 | 2026-09-01 | Shar Brown | $95.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263532) |
| 16194 | 2026-09-01 | Jennifer Beardall | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264251) |
| 16138 | 2026-09-01 | Nancy Krossa | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263556) |
| 16113 | 2026-09-01 | Thomas Carpinito | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263323) |
| 16211 | 2026-09-01 | Kay Neal | $95.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264482) |
| 16204 | 2026-09-01 | Buff Nelson | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264394) |
| 16202 | 2026-09-01 | Julie James | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264364) |
| 16055 | 2026-09-01 | Deborah Canon | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263005) |
| 15864 | 2026-08-31 | Jason Pedersen | $95.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037423) |
| 15641 | 2026-08-31 | Leslie Bratrud | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036747) |
| 15709 | 2026-08-31 | Dan Hazen | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036963) |
| 15883 | 2026-08-31 | Walter Poupore | $95.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037481) |
| 15713 | 2026-08-31 | Neil Kanungo | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036982) |
| 15698 | 2026-08-31 | Scott  Moser | $95.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036924) |
| 15829 | 2026-08-31 | Roy Restad | $95.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037314) |
| 15631 | 2026-08-31 | Brant Bengston | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036719) |
| 15603 | 2026-08-31 | Al Nettles | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036638) |
| 16065 | 2026-09-01 | Jim Nelsen | $93.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263075) |
| 15691 | 2026-08-31 | Joe Crecca | $90.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036903) |
| 16168 | 2026-09-01 | Aly Mendez | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263916) |
| 16053 | 2026-09-01 | Jane Moore | $90.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262989) |
| 16054 | 2026-09-01 | Scott Taylor | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262995) |
| 16133 | 2026-09-01 | Pam Griffin | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263501) |
| 16098 | 2026-09-01 | Larry Desmet | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263224) |
| 16071 | 2026-09-01 | Thomas  Varrelman | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263108) |
| 16129 | 2026-09-01 | Ashley Clark | $90.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263462) |
| 16126 | 2026-09-01 | Mike Kaiser | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263433) |
| 16084 | 2026-09-01 | Don Severide | $90.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263168) |
| 16161 | 2026-09-01 | Jean Brannen | $90.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263831) |
| 15660 | 2026-08-31 | Mike Schuppert | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036817) |
| 15670 | 2026-08-31 | BIll Sweatman | $90.00 | Courtney | Cory Ventura | Cory Ventura | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/170036847) |
| 15685 | 2026-08-31 | Jameel Hyder | $90.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036886) |
| 15719 | 2026-08-31 | Amber John | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036998) |
| 15630 | 2026-08-31 | Shelley Bensussen | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036717) |
| 15675 | 2026-08-31 | Terry Yoshimura | $90.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036864) |
| 15681 | 2026-08-31 | Stan Adams | $90.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036875) |
| 15734 | 2026-08-31 | Chris Higgs | $90.00 | Tavis Alexander | — | Tavis Alexander | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037045) |
| 15620 | 2026-08-31 | Bryce Murphy | $90.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036693) |
| 15532 | 2026-08-17 | Chris Higgs | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/168409796) |
| 16094 | 2026-09-01 | Ron Houlihan | $89.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263208) |
| 16045 | 2026-09-01 | Nancy  Price | $89.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262909) |
| 16033 | 2026-09-01 | Steve Smith | $89.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262791) |
| 16173 | 2026-09-01 | Eric Fraumeni | $89.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263985) |
| 16112 | 2026-09-01 | Kristi Rice | $89.25 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263317) |
| 16127 | 2026-09-01 | Steve Herbst | $89.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263439) |
| 16220 | 2026-09-01 | Paul Klansnic | $89.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264587) |
| 15652 | 2026-08-31 | Nichole Avila | $89.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036783) |
| 15649 | 2026-08-31 | Tim Flood | $86.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036773) |
| 16088 | 2026-09-01 | Brian Muirhead | $86.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263184) |
| 15666 | 2026-08-31 | Ryan Coffey | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036836) |
| 15856 | 2026-08-31 | Nancy Hawkins | $85.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037400) |
| 15840 | 2026-08-31 | Jackie Owner | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037347) |
| 15659 | 2026-08-31 | Eric Crossley | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036813) |
| 15888 | 2026-08-31 | Pam Novotny | $85.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037504) |
| 15626 | 2026-08-31 | Dave Wilson | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036705) |
| 15788 | 2026-08-31 | Michelle  Bates | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037215) |
| 15581 | 2026-08-31 | Dave Belmont | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036582) |
| 15657 | 2026-08-31 | Ross Parker | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036802) |
| 15795 | 2026-08-31 | Gary Smart | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037234) |
| 15727 | 2026-08-31 | Melinda Wagner | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037022) |
| 15619 | 2026-08-31 | Rita Gray | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036692) |
| 15639 | 2026-08-31 | Jake Nettleton | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036743) |
| 15605 | 2026-08-31 | Tom Craig | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036644) |
| 15750 | 2026-08-31 | Jerry Wilkinson | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037100) |
| 15667 | 2026-08-31 | Blaine Wright | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036838) |
| 16156 | 2026-09-01 | Steven Friedrichsen | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263771) |
| 16241 | 2026-09-01 | Mandy Sprague | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170268663) |
| 16242 | 2026-09-01 | Sandee Smith | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170268666) |
| 16030 | 2026-09-01 | Terry Williams | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262750) |
| 16047 | 2026-09-01 | John Siebenbaum | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262930) |
| 16154 | 2026-09-01 | Sandy Foster | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263746) |
| 16070 | 2026-09-01 | Clark Potter | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263103) |
| 16124 | 2026-09-01 | Jacque Coffey | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263412) |
| 16235 | 2026-09-01 | Rishab Narula | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264721) |
| 16140 | 2026-09-01 | Nick Miller | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263575) |
| 16169 | 2026-09-01 | Lee Hansen | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263926) |
| 16231 | 2026-09-01 | Dave Mcclung | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264695) |
| 16132 | 2026-09-01 | Yvonne Hall | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263490) |
| 16096 | 2026-09-01 | Denica Bucklin | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263217) |
| 16193 | 2026-09-01 | Gail Jones | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264234) |
| 16087 | 2026-09-01 | Marta Dickerson | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263181) |
| 16214 | 2026-09-01 | Matt Swank | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264517) |
| 16109 | 2026-09-01 | Charles Bender | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263293) |
| 16050 | 2026-09-01 | Faye Houshyari | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262960) |
| 16097 | 2026-09-01 | Lindsay Donner | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263219) |
| 16190 | 2026-09-01 | Rachel Brouhard | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264195) |
| 16146 | 2026-09-01 | Colleen Hunter | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170263658) |
| 16177 | 2026-09-01 | Lisa Peterson | $85.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170264027) |
| 16174 | 2026-09-01 | Ryan Palmer | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263995) |
| 16218 | 2026-09-01 | HyperGreen Landscaping | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264564) |
| 16082 | 2026-09-01 | Pam Northrip | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263158) |
| 16093 | 2026-09-01 | Rick  Fegurgur | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263203) |
| 16223 | 2026-09-01 | Randy Redding | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264617) |
| 16196 | 2026-09-01 | Debbie Griffith | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264281) |
| 16192 | 2026-09-01 | Maureen Haley | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264219) |
| 16155 | 2026-09-01 | Tim Cho | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263757) |
| 16213 | 2026-09-01 | Bruce  Sprague | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264506) |
| 16225 | 2026-09-01 | Rick Ternosky | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264641) |
| 16080 | 2026-09-01 | Martha Copeland | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263151) |
| 16144 | 2026-09-01 | Tom Weaver | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263630) |
| 16039 | 2026-09-01 | Amy Shick | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262852) |
| 16159 | 2026-09-01 | Omar Aftab | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263809) |
| 16189 | 2026-09-01 | Jason Gomez | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264179) |
| 16069 | 2026-09-01 | Jared Haines | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263098) |
| 16122 | 2026-09-01 | David Rosser | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263393) |
| 16147 | 2026-09-01 | Jan Stanfield | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263668) |
| 16031 | 2026-09-01 | Zach Usher | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262768) |
| 16059 | 2026-09-01 | Ganesh   Thirumalai | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263034) |
| 16232 | 2026-09-01 | David Bhend | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264700) |
| 16064 | 2026-09-01 | Randy Stegmeier | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263070) |
| 16153 | 2026-09-01 | Joe Tate | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263730) |
| 16198 | 2026-09-01 | Nathan Barness | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264309) |
| 16106 | 2026-09-01 | Clark Potter | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263273) |
| 16166 | 2026-09-01 | Mike Sewell | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263892) |
| 16157 | 2026-09-01 | Jon Foster | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263784) |
| 16074 | 2026-09-01 | Noe Cerda | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263122) |
| 16234 | 2026-09-01 | Michael Satran | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264716) |
| 16092 | 2026-09-01 | Ron Krebbs | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263201) |
| 16077 | 2026-09-01 | Doreen Rigos | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263136) |
| 16107 | 2026-09-01 | Chris Doll | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263283) |
| 16165 | 2026-09-01 | Kathy Lewis | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263880) |
| 16116 | 2026-09-01 | Tom Schlimme | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263346) |
| 16170 | 2026-09-01 | Tom Rebek | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263938) |
| 16057 | 2026-09-01 | Priscilla Dendy | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263019) |
| 16152 | 2026-09-01 | HyperGreen Landscaping | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263722) |
| 16110 | 2026-09-01 | Sandy Blackburn | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263303) |
| 16028 | 2026-09-01 | Amanda Willard | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262735) |
| 16037 | 2026-09-01 | Trudy Wozeniak | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262832) |
| 16027 | 2026-09-01 | Susy Bevans | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170262726) |
| 15655 | 2026-08-31 | Brian Beans | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036792) |
| 15654 | 2026-08-31 | Steve Lees | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036788) |
| 15615 | 2026-08-31 | Jenny Roy | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036672) |
| 15694 | 2026-08-31 | Rob Goolsby | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036913) |
| 15635 | 2026-08-31 | Karen Baker | $85.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036729) |
| 15582 | 2026-08-31 | Todd Davis | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036587) |
| 15636 | 2026-08-31 | Mike Baril | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036733) |
| 15609 | 2026-08-31 | Scott Fritschle | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036654) |
| 15665 | 2026-08-31 | Dale Bundy | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036832) |
| 15678 | 2026-08-31 | Liki Estes | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036869) |
| 15602 | 2026-08-31 | Christina McDougall | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036634) |
| 15869 | 2026-08-31 | David Bennett | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037433) |
| 15604 | 2026-08-31 | Debra Chrapaty | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036641) |
| 15632 | 2026-08-31 | Scott Barker | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036723) |
| 15596 | 2026-08-31 | Mike Coile | $85.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036617) |
| 15933 | 2026-08-31 | Aleyna Yamaguchi | $85.00 | Spencer Hill | — | Spencer Hill | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037660) |
| 15623 | 2026-08-31 | Rita Conger | $85.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170036699) |
| 15699 | 2026-08-31 | Susanna Suiter | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036927) |
| 15601 | 2026-08-31 | Carrie Cummings | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036632) |
| 15624 | 2026-08-31 | Maggie Pierotti | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036701) |
| 15587 | 2026-08-31 | Jeff Hardman | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036599) |
| 15616 | 2026-08-31 | Harsh Nanchahal | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036676) |
| 15817 | 2026-08-31 | Erik Yang | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037284) |
| 15599 | 2026-08-31 | Dennis Scroggins | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036627) |
| 15790 | 2026-08-31 | Chuck  Christenson | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037220) |
| 15645 | 2026-08-31 | Theo Vervilles | $80.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036762) |
| 15633 | 2026-08-31 | Velena Bryant | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036724) |
| 16095 | 2026-09-01 | Dee Lewis | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263213) |
| 15608 | 2026-08-31 | Brienna Dyberg | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036651) |
| 16178 | 2026-09-01 | Della Crossley | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264035) |
| 16090 | 2026-09-01 | Bill Langley | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170263193) |
| 15830 | 2026-08-31 | Thanh Tran | $75.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037316) |
| 15585 | 2026-08-31 | Shana Valencia | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036595) |
| 16021 | 2026-08-31 | Alex Stevenson | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170085613) |
| 15592 | 2026-08-31 | Tom Hornberg | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036609) |
| 15812 | 2026-08-31 | Dalveer Josan | $75.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170037275) |
| 15921 | 2026-08-31 | John Wohlfarth | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037611) |
| 15668 | 2026-08-31 | Irene VandenBrink | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036842) |
| 15628 | 2026-08-31 | Dennis Higashiyama | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036712) |
| 15908 | 2026-08-31 | Mark & Lois Parhaniemei | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037563) |
| 16181 | 2026-09-01 | Ross Good | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170264070) |
| 15930 | 2026-08-31 | Katie Richardson | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037650) |
| 15910 | 2026-08-31 | Marianne Parasida | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037572) |
| 15962 | 2026-08-31 | Jonae | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037767) |
| 15638 | 2026-08-31 | Sheri Powers | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036737) |
| 15909 | 2026-08-31 | Martha  Dawson | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037569) |
| 15920 | 2026-08-31 | Nasima Vira | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037607) |
| 15912 | 2026-08-31 | Jeff Nugent | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037578) |
| 15867 | 2026-08-31 | Pauline Kabue | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037429) |
| 15957 | 2026-08-31 | Paul Davis | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037752) |
| 15671 | 2026-08-31 | Mark Fisher | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036851) |
| 15771 | 2026-08-31 | Mark Baughman | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037165) |
| 15958 | 2026-08-31 | Laura Zarro | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037754) |
| 16000 | 2026-08-31 | Jay Hickenbottom | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037920) |
| 15629 | 2026-08-31 | Gary Hollins | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170036714) |
| 16023 | 2026-08-31 | Patty Dills | $0.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170111186) |
| 15991 | 2026-08-31 | Diana Miller | $0.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170037898) |