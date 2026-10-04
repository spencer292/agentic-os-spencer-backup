# Commission and salesperson-attribution audit — 2026-09

Source: 848 invoices issued in 2026-09, plus 195 quotes created in 2026-09. Pulled 2026-10-01 21:06Z.

## 1. Attribution health

| | Invoices | Invoiced |
|---|---:|---:|
| Chain clean (quote = job = invoice) | 385 | $67,332.25 |
| Has a problem | 463 | $64,174.04 |
| **Total** | **848** | **$131,506.29** |

### Problems by type

| Problem | Invoices | Invoiced | What it means |
|---|---:|---:|---|
| `NO_SELLER_ANYWHERE` | 296 | $44,012.74 | No quote and no seller anywhere — unattributable without a human call |
| `INVOICE_MISSING_SELLER` | 158 | $19,381.30 | Seller known upstream but the invoice has none — Jobber's own commission report misses it |
| `JOB_MISSING_SELLER` | 158 | $19,166.30 | Quote had a seller, the job lost it |
| `QUOTE_MISSING_SELLER` | 44 | $8,839.25 | A quote exists but nobody was set on it at the source |
| `INVOICE_DISAGREES_WITH_QUOTE` | 5 | $485.00 | Invoice credits a different person than the quote |
| `JOB_DISAGREES_WITH_QUOTE` | 5 | $485.00 | Job credits a different person than the quote |

## 2. Commissionable totals by salesperson

Seller is resolved from the QUOTE first, then the job, then the invoice — so a broken chain still lands on the right person here, even where Jobber's own report would miss it.

| Salesperson | Invoices | Invoiced | Collected | Of which flagged |
|---|---:|---:|---:|---:|
| (UNATTRIBUTED) | 296 | $44,012.74 | $32,185.00 | 296 ($44,012.74) |
| Spencer Hill | 224 | $34,828.80 | $17,708.80 | 59 ($7,336.30) |
| Muhammad Javed | 93 | $24,860.00 | $13,245.00 | 11 ($1,890.00) |
| Cory Ventura | 78 | $12,244.75 | $4,255.00 | 25 ($3,890.00) |
| Tavis Alexander | 52 | $5,070.00 | $3,165.00 | 33 ($3,140.00) |
| Courtney | 46 | $4,630.00 | $3,225.00 | 31 ($3,115.00) |
| Brayden Rich | 25 | $2,480.00 | $1,700.00 | 7 ($690.00) |
| Alias Franks | 13 | $1,040.00 | $790.00 | 1 ($100.00) |
| Luke LaVergne | 7 | $980.00 | $745.00 | 0 ($0.00) |
| Robert Norton | 9 | $890.00 | $300.00 | 0 ($0.00) |
| Jeff Mitchell | 4 | $370.00 | $370.00 | 0 ($0.00) |
| Cammeron Anderson | 1 | $100.00 | $100.00 | 0 ($0.00) |

### Split by product

| Salesperson | Product | Invoices | Invoiced | Collected |
|---|---|---:|---:|---:|
| (UNATTRIBUTED) | TMCP | 253 | $28,162.74 | $19,485.00 |
| (UNATTRIBUTED) | Quick Fix | 41 | $15,525.00 | $12,375.00 |
| (UNATTRIBUTED) | Barter/F&F | 2 | $325.00 | $325.00 |
| Spencer Hill | TMCP | 190 | $22,253.80 | $9,833.80 |
| Spencer Hill | Quick Fix | 31 | $12,125.00 | $7,875.00 |
| Spencer Hill | Other | 3 | $450.00 | $0.00 |
| Muhammad Javed | Quick Fix | 46 | $19,755.00 | $11,130.00 |
| Muhammad Javed | TMCP | 39 | $3,905.00 | $2,115.00 |
| Muhammad Javed | Other | 8 | $1,200.00 | $0.00 |
| Cory Ventura | TMCP | 78 | $12,244.75 | $4,255.00 |
| Tavis Alexander | TMCP | 52 | $5,070.00 | $3,165.00 |
| Courtney | TMCP | 46 | $4,630.00 | $3,225.00 |
| Brayden Rich | TMCP | 25 | $2,480.00 | $1,700.00 |
| Alias Franks | TMCP | 13 | $1,040.00 | $790.00 |
| Luke LaVergne | TMCP | 6 | $575.00 | $490.00 |
| Luke LaVergne | Quick Fix | 1 | $405.00 | $255.00 |
| Robert Norton | TMCP | 9 | $890.00 | $300.00 |
| Jeff Mitchell | TMCP | 4 | $370.00 | $370.00 |
| Cammeron Anderson | TMCP | 1 | $100.00 | $100.00 |

## 3. Fix list — every invoice with a broken chain

| Invoice | Date | Client | Total | Quote seller | Job seller | Invoice seller | Problem | Link |
|---|---|---|---:|---|---|---|---|---|
| 16450 | 2026-09-30 | Plemmons Industries | $1,500.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878278) |
| 16625 | 2026-09-30 | GC Bellefield, LLC. | $1,500.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879203) |
| 16020 | 2026-09-01 | Plemmons Industries | $1,500.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170085389) |
| 16500 | 2026-09-30 | City of Burien | $950.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878503) |
| 16617 | 2026-09-30 | Marymoor Park | $906.30 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879151) |
| 16868 | 2026-09-30 | Cruz Rodriguez | $750.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174006235) |
| 16261 | 2026-09-04 | Ravi Kumar Balachandran | $500.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170982656) |
| 16275 | 2026-09-09 | Liz Silke | $450.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/171446400) |
| 16367 | 2026-09-29 | Pia Matsuno | $450.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173720911) |
| 16320 | 2026-09-17 | Morgan Harris | $450.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172418239) |
| 16360 | 2026-09-28 | Dave Matsumoto | $450.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173539854) |
| 16359 | 2026-09-25 | Santush Kumar | $450.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173390272) |
| 16357 | 2026-09-25 | Lyle Penrod | $450.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173375609) |
| 16291 | 2026-09-11 | Mac Kirk | $450.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171770771) |
| 16871 | 2026-10-01 | Steve  Mcdonough | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174043476) |
| 16869 | 2026-09-30 | Dean Shull | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174011166) |
| 16867 | 2026-09-30 | Sara Wade | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173999261) |
| 16280 | 2026-09-10 | Ranju Atwal | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171577858) |
| 16351 | 2026-09-24 | Dan Froemke | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173177705) |
| 16364 | 2026-09-28 | Constance Pivonka | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173554575) |
| 16286 | 2026-09-11 | Jake Fox | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171658160) |
| 16358 | 2026-09-25 | Mauricio Silva | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173382489) |
| 16326 | 2026-09-18 | Gina Beam | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172518098) |
| 16341 | 2026-09-21 | Polly Prince | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172793725) |
| 16350 | 2026-09-23 | Melinda Holland | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173076823) |
| 16343 | 2026-09-22 | Oscar Alvaravo | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172870790) |
| 16348 | 2026-09-23 | Damien Romanik | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173030108) |
| 16340 | 2026-09-21 | John Croonquist | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172781299) |
| 16274 | 2026-09-09 | Tai Tran | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171431949) |
| 16265 | 2026-09-08 | Shawn Tobius | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171243385) |
| 16328 | 2026-09-18 | Clark Lehigh | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172575319) |
| 16319 | 2026-09-17 | Mike Dosch | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172415376) |
| 16318 | 2026-09-17 | John Ott | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172403147) |
| 16312 | 2026-09-16 | Lily Tsai | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172270796) |
| 16258 | 2026-09-03 | Donna Youngblood | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170809981) |
| 16266 | 2026-09-08 | Paul Costa | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171245049) |
| 16295 | 2026-09-14 | Marjory Laymon | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171912457) |
| 16288 | 2026-09-11 | Patty  Ring | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171723254) |
| 16287 | 2026-09-11 | Sarah Jeffers | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171700254) |
| 16277 | 2026-09-09 | Drew Culver | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171465579) |
| 16271 | 2026-09-08 | Richard Kaumans | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171344942) |
| 16253 | 2026-09-02 | Roseanne Ingroia | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170637777) |
| 16255 | 2026-09-02 | Chad Erickson | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170697109) |
| 16244 | 2026-09-01 | Kirsten Mcclelland | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170380588) |
| 16362 | 2026-09-28 | Aaron Burke | $325.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173550609) |
| 16443 | 2026-09-30 | Bye The Green Condominiums | $309.75 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878254) |
| 16337 | 2026-09-21 | Klaudia Elam | $300.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172763218) |
| 16249 | 2026-09-01 | Susan Eggleton | $300.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170466143) |
| 16972 | 2026-10-01 | HyperGreen Landscaping | $275.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101150) |
| 16990 | 2026-10-01 | Run Wild Dog Sports | $275.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101257) |
| 16474 | 2026-09-30 | Washington Premier Soccer Club | $250.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878387) |
| 16327 | 2026-09-18 | Sauce | $250.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172538930) |
| 16548 | 2026-09-30 | Vikrant Jain | $249.99 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878831) |
| 16553 | 2026-09-30 | Galilee Baptist Church | $225.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878857) |
| 16369 | 2026-09-29 | Jody Sanders | $225.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173739596) |
| 16316 | 2026-09-16 | Virgil Holman | $225.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/172315980) |
| 17064 | 2026-10-01 | Daniel Hoffman | $200.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101914) |
| 16482 | 2026-09-30 | Trent Bryan | $200.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878425) |
| 16386 | 2026-09-30 | Thomas Spring Estates | $200.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878042) |
| 16516 | 2026-09-30 | Regency Ridge COA | $200.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878616) |
| 16414 | 2026-09-30 | Detrays | $200.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878146) |
| 16445 | 2026-09-30 | Conover Court | $175.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878261) |
| 16983 | 2026-10-01 | Larry Gasser | $170.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101217) |
| 16461 | 2026-09-30 | Kelly Kunz | $160.00 | Spencer Hill | Spencer Hill | — | INVOICE_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878336) |
| 16441 | 2026-09-30 | Skookum Archers | $155.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878247) |
| 16861 | 2026-09-30 | Mike Miller | $150.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173896468) |
| 16765 | 2026-09-30 | Ross Luo | $150.00 | Spencer Hill | Spencer Hill | — | INVOICE_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879642) |
| 16332 | 2026-09-19 | Michael Sexton | $150.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/172640098) |
| 16306 | 2026-09-15 | Laura Goodrich | $150.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/172157897) |
| 17054 | 2026-10-01 | Chris Thornhill | $139.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101807) |
| 16886 | 2026-10-01 | Duncan Kariuki | $135.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100520) |
| 17088 | 2026-10-01 | Chris Taylor | $135.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174102214) |
| 16570 | 2026-09-30 | Roselee Buonauro | $125.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878937) |
| 16643 | 2026-09-30 | Matt Wood | $125.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879266) |
| 16932 | 2026-10-01 | Peter Dale | $125.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100893) |
| 16957 | 2026-10-01 | Jim Benham | $125.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101044) |
| 17043 | 2026-10-01 | Liz Jones | $125.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101687) |
| 17084 | 2026-10-01 | Carrie Williamson | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174102163) |
| 17035 | 2026-10-01 | Clint Bjornson | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101576) |
| 17018 | 2026-10-01 | Kevin Chen | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101419) |
| 17005 | 2026-10-01 | Mike Cushman | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101344) |
| 16909 | 2026-10-01 | Amber Owen | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100721) |
| 16960 | 2026-10-01 | MT Landscape | $125.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101062) |
| 16496 | 2026-09-30 | Vince Preece | $125.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878486) |
| 16530 | 2026-09-30 | Thanhquyen Nguyen | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878712) |
| 16385 | 2026-09-30 | Ryan Middleton | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878037) |
| 16783 | 2026-09-30 | Ken Larson | $125.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879701) |
| 16447 | 2026-09-30 | Josh Mckee | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878269) |
| 16451 | 2026-09-30 | Kathy Wilson | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878279) |
| 16653 | 2026-09-30 | Jennifer Cramer | $125.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879302) |
| 16566 | 2026-09-30 | Don Petricic | $125.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878921) |
| 16552 | 2026-09-30 | Barclay Square | $125.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878852) |
| 17082 | 2026-10-01 | SLPPLLC | $115.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174102138) |
| 17069 | 2026-10-01 | SLPPLLC | $115.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101978) |
| 16448 | 2026-09-30 | Stephanie Larson | $115.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878271) |
| 16883 | 2026-10-01 | Nichole  Jacobson | $112.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100481) |
| 16589 | 2026-09-30 | Lisa Shaughnessy | $110.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879016) |
| 16596 | 2026-09-30 | Amy Thomas | $110.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879048) |
| 16460 | 2026-09-30 | Dave Gierok | $105.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878330) |
| 16493 | 2026-09-30 | Maja Haloway | $105.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878479) |
| 16559 | 2026-09-30 | Liz Hannon | $100.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878894) |
| 16694 | 2026-09-30 | Mike Doud | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879421) |
| 16619 | 2026-09-30 | Edward Yang | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879166) |
| 16544 | 2026-09-30 | Dave Koshork | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878812) |
| 16636 | 2026-09-30 | Greg Thoreson | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879247) |
| 16459 | 2026-09-30 | Mike Ahquin | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878324) |
| 17090 | 2026-10-01 | Akanksha Singh | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174108385) |
| 17041 | 2026-10-01 | Tim Wickland | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101649) |
| 16979 | 2026-10-01 | Ally Sharp | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101196) |
| 16946 | 2026-10-01 | Bess  Poehlmann | $100.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100977) |
| 16897 | 2026-10-01 | Swenbert LLC | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100630) |
| 16993 | 2026-10-01 | Teri McCabe | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101281) |
| 17014 | 2026-10-01 | Jeff  Boggs | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101395) |
| 16939 | 2026-10-01 | David Delafield | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100942) |
| 16876 | 2026-10-01 | Brian Young | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100410) |
| 17052 | 2026-10-01 | Peter Youngs | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101785) |
| 16911 | 2026-10-01 | Tom Falk | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100734) |
| 16881 | 2026-10-01 | Craig Knebel | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100462) |
| 17063 | 2026-10-01 | Paul Hwang | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101902) |
| 16950 | 2026-10-01 | Julie Carper | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101001) |
| 16955 | 2026-10-01 | Kristina Rollings | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101036) |
| 17083 | 2026-10-01 | Mitchell Gasser | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174102150) |
| 16931 | 2026-10-01 | Doug  Schutt | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100889) |
| 17058 | 2026-10-01 | Jonelle Loranger | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101850) |
| 17007 | 2026-10-01 | Melissa Street | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101353) |
| 17020 | 2026-10-01 | Maggie Culbert-O’Leary | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101433) |
| 16916 | 2026-10-01 | Michael Morgan | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100771) |
| 16968 | 2026-10-01 | Ray Spencer | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101119) |
| 17011 | 2026-10-01 | Kelly  Scott | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101375) |
| 16920 | 2026-10-01 | Bobby  Holt | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100802) |
| 17057 | 2026-10-01 | Tom Feldman | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101841) |
| 17000 | 2026-10-01 | Jonathan Kim-Hull | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101320) |
| 16949 | 2026-10-01 | Mike Rohan | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100995) |
| 17029 | 2026-10-01 | Melisa Shryock | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101502) |
| 17075 | 2026-10-01 | Joe Kelley | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174102046) |
| 17009 | 2026-10-01 | Christine Sanders-Meena | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101364) |
| 16987 | 2026-10-01 | Deke Turner | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101242) |
| 16938 | 2026-10-01 | Kelly Tivnan | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100937) |
| 17053 | 2026-10-01 | Wendi Wang | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101797) |
| 17073 | 2026-10-01 | Chris Mckenzie | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174102022) |
| 16914 | 2026-10-01 | John Culbertson | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100756) |
| 17056 | 2026-10-01 | Eric Dworkis | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101831) |
| 16929 | 2026-10-01 | Mary Olin | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100872) |
| 16951 | 2026-10-01 | Sara Houpis | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101007) |
| 17038 | 2026-10-01 | Pat Birkeland | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101613) |
| 17055 | 2026-10-01 | Eliav Coen | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101818) |
| 17089 | 2026-10-01 | Chris Bartlett | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174102226) |
| 16965 | 2026-10-01 | Nadia Reynolds | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101096) |
| 17023 | 2026-10-01 | Kyle Peterson | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101456) |
| 16956 | 2026-10-01 | Corky Heimbigner | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101039) |
| 17010 | 2026-10-01 | Ryan Tacher | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101369) |
| 17048 | 2026-10-01 | Loren Sanchez | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101744) |
| 16976 | 2026-10-01 | Tim Matula | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101177) |
| 16945 | 2026-10-01 | Gary Patterson | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100971) |
| 16958 | 2026-10-01 | Sherry Lotze | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101050) |
| 17032 | 2026-10-01 | Alexandra Daley | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101537) |
| 16907 | 2026-10-01 | Robin Sofola | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100705) |
| 17004 | 2026-10-01 | Greg Flynn | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101340) |
| 16904 | 2026-10-01 | Clint Bjornson | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100683) |
| 16942 | 2026-10-01 | Bill Harris | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100958) |
| 16935 | 2026-10-01 | Larena Walshe | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100918) |
| 16906 | 2026-10-01 | Bonnee Terrio | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100697) |
| 16959 | 2026-10-01 | Kathy Sternoff | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101055) |
| 16889 | 2026-10-01 | Candice Storm | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100551) |
| 16961 | 2026-10-01 | Dennis Mccreery | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101067) |
| 16875 | 2026-10-01 | Sean Finlayson | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100397) |
| 16893 | 2026-10-01 | Sharon Da-Dalto | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100590) |
| 16873 | 2026-10-01 | Jeff Ostlund | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100374) |
| 16872 | 2026-10-01 | Evan Henke | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100361) |
| 16628 | 2026-09-30 | April Bower | $100.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879214) |
| 16689 | 2026-09-30 | Debbie Jennings | $100.00 | Spencer Hill | Luke LaVergne | Luke LaVergne | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/173879406) |
| 16563 | 2026-09-30 | Lynn Wecker | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878910) |
| 16830 | 2026-09-30 | Russ Decaire | $100.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879865) |
| 16581 | 2026-09-30 | Douglas  Kelly | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878975) |
| 16700 | 2026-09-30 | Darren Corliss | $100.00 | — | Spencer Hill | Spencer Hill | QUOTE_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879442) |
| 16780 | 2026-09-30 | Doug Crow | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879694) |
| 16638 | 2026-09-30 | Joel Coons | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879254) |
| 16674 | 2026-09-30 | Gary Fredericks | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879368) |
| 16502 | 2026-09-30 | Ruth  Edwards | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878516) |
| 16759 | 2026-09-30 | Deborah Berger | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879624) |
| 16789 | 2026-09-30 | Brian Meadows | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879722) |
| 16395 | 2026-09-30 | Gwen Morton | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878077) |
| 16561 | 2026-09-30 | Joe Gross | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878902) |
| 16678 | 2026-09-30 | David Sprague | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879379) |
| 16604 | 2026-09-30 | Melissa  Osvaldik | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879083) |
| 16642 | 2026-09-30 | Sarah Templin | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879265) |
| 16418 | 2026-09-30 | Eric Reddy | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878162) |
| 16663 | 2026-09-30 | Ashley Frizzell | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879337) |
| 16613 | 2026-09-30 | Ashleigh  Root | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879129) |
| 16690 | 2026-09-30 | Jennifer Gleason | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879408) |
| 16488 | 2026-09-30 | Rick Conces | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878457) |
| 16650 | 2026-09-30 | Brent Fernyhough | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879290) |
| 16612 | 2026-09-30 | Marc Abraham | $100.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879125) |
| 16753 | 2026-09-30 | Bac Walker | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879606) |
| 16407 | 2026-09-30 | Annette Wood | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878116) |
| 16647 | 2026-09-30 | Tom Li | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879283) |
| 16504 | 2026-09-30 | Dana  Daher | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878524) |
| 16665 | 2026-09-30 | Yuji Xie | $100.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879341) |
| 16717 | 2026-09-30 | Christina Long | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879512) |
| 16540 | 2026-09-30 | Dan Golden | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878790) |
| 16503 | 2026-09-30 | John Raber | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878520) |
| 16857 | 2026-09-30 | Bellevue Korean Presbyterian Church | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173893574) |
| 16600 | 2026-09-30 | Hannah  Jacobson | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879064) |
| 16423 | 2026-09-30 | Lauren Tomala | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878172) |
| 16777 | 2026-09-30 | Shannon Supple | $100.00 | Alias Franks | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879687) |
| 16634 | 2026-09-30 | Elizabeth Kalouner | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879238) |
| 16410 | 2026-09-30 | Greg Anderson | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878131) |
| 16781 | 2026-09-30 | John Shepard | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879697) |
| 16590 | 2026-09-30 | Josh Trachtenberg | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879020) |
| 16409 | 2026-09-30 | Wanda Neste | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878129) |
| 16648 | 2026-09-30 | Vicky Garcia | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879284) |
| 16797 | 2026-09-30 | Tanya Parry | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879741) |
| 16693 | 2026-09-30 | Stratton Felker | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879419) |
| 16659 | 2026-09-30 | Seattle Rental Management | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879320) |
| 16633 | 2026-09-30 | Scott Hamilton | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879233) |
| 16560 | 2026-09-30 | Rosemarie Havranek | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878896) |
| 16562 | 2026-09-30 | Rosemarie  Havranek | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878904) |
| 16845 | 2026-09-30 | Richard Depencier | $100.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879912) |
| 16629 | 2026-09-30 | Rahul Newaskar | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879215) |
| 16491 | 2026-09-30 | Phyllis Miller | $100.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878470) |
| 16713 | 2026-09-30 | Peter Kisbye | $100.00 | Courtney | Spencer Hill | Spencer Hill | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/173879498) |
| 16573 | 2026-09-30 | Olivia Sandoval | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878948) |
| 16437 | 2026-09-30 | Noel Murphy | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878230) |
| 16697 | 2026-09-30 | Natalya Krahn | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879428) |
| 16551 | 2026-09-30 | Mike  Magnusson | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878848) |
| 16841 | 2026-09-30 | Michael Sobieck | $100.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879900) |
| 16724 | 2026-09-30 | Melissa Bay | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879528) |
| 16685 | 2026-09-30 | Max Ye | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879398) |
| 16469 | 2026-09-30 | Matt  Wurdeman | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878370) |
| 16555 | 2026-09-30 | Marnee Humphrey | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878869) |
| 16523 | 2026-09-30 | Lynn Clapp | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878663) |
| 16683 | 2026-09-30 | Lindsey Willis | $100.00 | — | Spencer Hill | Spencer Hill | QUOTE_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879394) |
| 16481 | 2026-09-30 | Linda Lowe | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878417) |
| 16483 | 2026-09-30 | Lauren Kenyon | $100.00 | Courtney | Cory Ventura | Cory Ventura | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/173878429) |
| 16597 | 2026-09-30 | Larry McGowan | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879053) |
| 16510 | 2026-09-30 | Larry Lemmon | $100.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878567) |
| 16428 | 2026-09-30 | Larry Gasser | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878197) |
| 16736 | 2026-09-30 | Larry Brewer | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879564) |
| 16703 | 2026-09-30 | Kim Suver | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879451) |
| 16810 | 2026-09-30 | Ken Lohse | $100.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879771) |
| 16579 | 2026-09-30 | Kelsey White | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878969) |
| 16569 | 2026-09-30 | John Luger | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878935) |
| 16808 | 2026-09-30 | Jennifer Pere | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879766) |
| 16403 | 2026-09-30 | Jennifer Flanegan | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878107) |
| 16766 | 2026-09-30 | Jenna Elberts | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879646) |
| 16598 | 2026-09-30 | Jeff Taylor | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879055) |
| 16495 | 2026-09-30 | Jeff Jensen | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878483) |
| 16518 | 2026-09-30 | Jeff Hunter | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878635) |
| 16456 | 2026-09-30 | Jeff Hudson | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878304) |
| 16644 | 2026-09-30 | Jeannine Rouleau | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879269) |
| 16431 | 2026-09-30 | Huayu Sun | $100.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878207) |
| 16506 | 2026-09-30 | Greg Hastings | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878539) |
| 16722 | 2026-09-30 | Frank Ciaramello | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879523) |
| 16769 | 2026-09-30 | Erica Benson | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879657) |
| 16657 | 2026-09-30 | Elizabeth Duroe | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879313) |
| 16602 | 2026-09-30 | Dawn St Clair | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879072) |
| 16606 | 2026-09-30 | Darren Bartels | $100.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879097) |
| 16704 | 2026-09-30 | Danielle Steele | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879455) |
| 16622 | 2026-09-30 | Collin Sidebotham | $100.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879185) |
| 16615 | 2026-09-30 | Chris Sita | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879136) |
| 16666 | 2026-09-30 | Charles Strauss | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879344) |
| 16637 | 2026-09-30 | Charanjit  Kalsi | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879251) |
| 16672 | 2026-09-30 | Bonnie Mccracken | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879362) |
| 16691 | 2026-09-30 | Ben Gardner | $100.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879411) |
| 16755 | 2026-09-30 | Aziz El-solh | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879612) |
| 16714 | 2026-09-30 | Aaron Diaz | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879501) |
| 16342 | 2026-09-22 | Michelle  Rasmussen | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/172832967) |
| 16263 | 2026-09-05 | Wanda Neste | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171097484) |
| 16404 | 2026-09-30 | Jana Wilson | $97.75 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878110) |
| 16664 | 2026-09-30 | Jason Pedersen | $95.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879339) |
| 16498 | 2026-09-30 | Scott  Moser | $95.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878493) |
| 16511 | 2026-09-30 | Jane Gallagher | $95.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878573) |
| 17078 | 2026-10-01 | Shar Brown | $95.00 | Brayden Rich | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174102085) |
| 16964 | 2026-10-01 | Deborah Canon | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101089) |
| 17044 | 2026-10-01 | Al Chappell | $95.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101703) |
| 16925 | 2026-10-01 | Joel Glass | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100842) |
| 16934 | 2026-10-01 | Julie James | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100910) |
| 17015 | 2026-10-01 | Jennifer Beardall | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101401) |
| 17070 | 2026-10-01 | Thomas Carpinito | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101988) |
| 17059 | 2026-10-01 | Kay Neal | $95.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101860) |
| 17050 | 2026-10-01 | Joe  Edmunson | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101767) |
| 16941 | 2026-10-01 | Evan Epstein | $95.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100952) |
| 17046 | 2026-10-01 | Nancy Krossa | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101725) |
| 16923 | 2026-10-01 | Buff Nelson | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100827) |
| 16400 | 2026-09-30 | Al Nettles | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878096) |
| 16427 | 2026-09-30 | Brant Bengston | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878192) |
| 16509 | 2026-09-30 | Dan Hazen | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878558) |
| 16682 | 2026-09-30 | Walter Poupore | $95.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879391) |
| 16513 | 2026-09-30 | Neil Kanungo | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878597) |
| 16631 | 2026-09-30 | Roy Restad | $95.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879221) |
| 16508 | 2026-09-30 | Ron Short | $95.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878553) |
| 16558 | 2026-09-30 | Miles Magnuson | $95.00 | Brayden Rich | Cory Ventura | Cory Ventura | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/173878885) |
| 16438 | 2026-09-30 | Leslie Bratrud | $95.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878233) |
| 16999 | 2026-10-01 | Jim Nelsen | $93.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101316) |
| 17092 | 2026-10-01 | Jean Brannen | $90.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174108392) |
| 17024 | 2026-10-01 | BIll Sweatman | $90.00 | Courtney | Cory Ventura | Cory Ventura | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/174101463) |
| 16879 | 2026-10-01 | Larry Desmet | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100443) |
| 16944 | 2026-10-01 | Thomas  Varrelman | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100966) |
| 17025 | 2026-10-01 | Pam Griffin | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101471) |
| 16985 | 2026-10-01 | Aly Mendez | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101228) |
| 16937 | 2026-10-01 | Mike Kaiser | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100930) |
| 16970 | 2026-10-01 | Scott Taylor | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101135) |
| 17008 | 2026-10-01 | Ashley Clark | $90.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101358) |
| 17085 | 2026-10-01 | Don Severide | $90.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174102178) |
| 17062 | 2026-10-01 | Jane Moore | $90.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101893) |
| 16484 | 2026-09-30 | Jameel Hyder | $90.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878432) |
| 16471 | 2026-09-30 | Terry Yoshimura | $90.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878376) |
| 16520 | 2026-09-30 | Amber John | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878647) |
| 16426 | 2026-09-30 | Shelley Bensussen | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878189) |
| 16840 | 2026-09-30 | Sarabjit Kaur | $90.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879898) |
| 16391 | 2026-09-30 | Tom Hopson | $90.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878061) |
| 16479 | 2026-09-30 | Stan Adams | $90.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878410) |
| 16458 | 2026-09-30 | Mike Schuppert | $90.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878314) |
| 16490 | 2026-09-30 | Joe Crecca | $90.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878467) |
| 16533 | 2026-09-30 | Chris Higgs | $90.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878742) |
| 16417 | 2026-09-30 | Bryce Murphy | $90.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878160) |
| 16998 | 2026-10-01 | Steve Herbst | $89.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101312) |
| 16910 | 2026-10-01 | Nancy  Price | $89.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100728) |
| 17001 | 2026-10-01 | Ron Houlihan | $89.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101325) |
| 17039 | 2026-10-01 | Steve Smith | $89.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101624) |
| 16885 | 2026-10-01 | Eric Fraumeni | $89.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100512) |
| 16878 | 2026-10-01 | Kristi Rice | $89.25 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100430) |
| 17080 | 2026-10-01 | Paul Klansnic | $89.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174102113) |
| 16449 | 2026-09-30 | Nichole Avila | $89.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878274) |
| 16943 | 2026-10-01 | Brian Muirhead | $86.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100961) |
| 16446 | 2026-09-30 | Tim Flood | $86.25 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878267) |
| 16457 | 2026-09-30 | Eric Crossley | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878308) |
| 16436 | 2026-09-30 | Jake Nettleton | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878224) |
| 17093 | 2026-10-01 | Joe Tate | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174108393) |
| 17006 | 2026-10-01 | Omar Aftab | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101349) |
| 17022 | 2026-10-01 | Yvonne Hall | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101448) |
| 16991 | 2026-10-01 | Jared Haines | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101265) |
| 17077 | 2026-10-01 | Mike Sewell | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174102067) |
| 17002 | 2026-10-01 | Doreen Rigos | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101329) |
| 16966 | 2026-10-01 | Noe Cerda | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101105) |
| 16901 | 2026-10-01 | Rick Ternosky | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100662) |
| 17074 | 2026-10-01 | Pam Northrip | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174102036) |
| 17019 | 2026-10-01 | Charles Bender | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101426) |
| 17036 | 2026-10-01 | John Siebenbaum | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101590) |
| 17066 | 2026-10-01 | Colleen Hunter | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101933) |
| 17065 | 2026-10-01 | Jacque Coffey | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101922) |
| 16973 | 2026-10-01 | Sandy Foster | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101158) |
| 16986 | 2026-10-01 | Rachel Brouhard | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101236) |
| 16894 | 2026-10-01 | Sandy Blackburn | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100601) |
| 17021 | 2026-10-01 | Ron Krebbs | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101441) |
| 16947 | 2026-10-01 | Jon Foster | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100982) |
| 17012 | 2026-10-01 | Tom Weaver | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101383) |
| 16912 | 2026-10-01 | Sandee Smith | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100743) |
| 16969 | 2026-10-01 | Kathy Lewis | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101128) |
| 16995 | 2026-10-01 | Chris Doll | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101294) |
| 16918 | 2026-10-01 | Trudy Wozeniak | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100786) |
| 16963 | 2026-10-01 | HyperGreen Landscaping | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101081) |
| 16464 | 2026-09-30 | Ryan Coffey | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878357) |
| 16908 | 2026-10-01 | David Bhend | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100714) |
| 16992 | 2026-10-01 | Amanda Willard | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101271) |
| 17013 | 2026-10-01 | Nathan Barness | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101389) |
| 17047 | 2026-10-01 | Amy Shick | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101736) |
| 16997 | 2026-10-01 | Faye Houshyari | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101306) |
| 17033 | 2026-10-01 | Marta Dickerson | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101549) |
| 16928 | 2026-10-01 | Denica Bucklin | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100865) |
| 16954 | 2026-10-01 | Martha Copeland | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101032) |
| 17049 | 2026-10-01 | Mandy Sprague | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101755) |
| 17016 | 2026-10-01 | Lisa Peterson | $85.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174101407) |
| 17081 | 2026-10-01 | Ganesh   Thirumalai | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174102128) |
| 16962 | 2026-10-01 | Dave Mcclung | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101075) |
| 17067 | 2026-10-01 | Matt Swank | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101949) |
| 16902 | 2026-10-01 | Rick  Fegurgur | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100670) |
| 16953 | 2026-10-01 | Randy Redding | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101024) |
| 16891 | 2026-10-01 | Priscilla Dendy | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100572) |
| 16899 | 2026-10-01 | Randy Stegmeier | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100647) |
| 16917 | 2026-10-01 | HyperGreen Landscaping | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100779) |
| 16981 | 2026-10-01 | Zach Usher | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101207) |
| 16905 | 2026-10-01 | Jason Gomez | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100689) |
| 16874 | 2026-10-01 | Lindsay Donner | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100387) |
| 17027 | 2026-10-01 | Bruce  Sprague | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101485) |
| 16913 | 2026-10-01 | Gail Jones | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100750) |
| 16919 | 2026-10-01 | Nick Miller | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100793) |
| 16978 | 2026-10-01 | Tim Cho | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101189) |
| 16975 | 2026-10-01 | Debbie Griffith | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101170) |
| 17076 | 2026-10-01 | Ryan Palmer | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174102058) |
| 17051 | 2026-10-01 | Tom Schlimme | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101773) |
| 17037 | 2026-10-01 | Maureen Haley | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101601) |
| 17031 | 2026-10-01 | Clark Potter | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101526) |
| 17028 | 2026-10-01 | Susy Bevans | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101496) |
| 16930 | 2026-10-01 | Lee Hansen | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100881) |
| 16989 | 2026-10-01 | David Rosser | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101250) |
| 16988 | 2026-10-01 | Jan Stanfield | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101247) |
| 16880 | 2026-10-01 | Rishab Narula | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100452) |
| 16877 | 2026-10-01 | Michael Satran | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100420) |
| 16888 | 2026-10-01 | Clark Potter | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100540) |
| 16940 | 2026-10-01 | Steven Friedrichsen | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/174100947) |
| 16884 | 2026-10-01 | Tom Rebek | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100498) |
| 16433 | 2026-09-30 | Mike Baril | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878215) |
| 16656 | 2026-09-30 | Nancy Hawkins | $85.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879310) |
| 16687 | 2026-09-30 | Pam Novotny | $85.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879401) |
| 16453 | 2026-09-30 | Brian Beans | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878291) |
| 16599 | 2026-09-30 | Gary Smart | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879060) |
| 16550 | 2026-09-30 | Jerry Wilkinson | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878840) |
| 16465 | 2026-09-30 | Blaine Wright | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878361) |
| 16401 | 2026-09-30 | Debra Chrapaty | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878098) |
| 16641 | 2026-09-30 | Jackie Owner | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879262) |
| 16463 | 2026-09-30 | Dale Bundy | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878352) |
| 16592 | 2026-09-30 | Michelle  Bates | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879029) |
| 16378 | 2026-09-30 | Todd Davis | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878016) |
| 16618 | 2026-09-30 | Erik Yang | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879155) |
| 16402 | 2026-09-30 | Tom Craig | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878105) |
| 16527 | 2026-09-30 | Melinda Wagner | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878694) |
| 16429 | 2026-09-30 | Scott Barker | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878200) |
| 16733 | 2026-09-30 | Aleyna Yamaguchi | $85.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879556) |
| 16393 | 2026-09-30 | Mike Coile | $85.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878067) |
| 16452 | 2026-09-30 | Steve Lees | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878285) |
| 16432 | 2026-09-30 | Karen Baker | $85.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878210) |
| 16476 | 2026-09-30 | Liki Estes | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878397) |
| 16377 | 2026-09-30 | Dave Belmont | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878012) |
| 16398 | 2026-09-30 | Carrie Cummings | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878088) |
| 16499 | 2026-09-30 | Susanna Suiter | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878498) |
| 16406 | 2026-09-30 | Scott Fritschle | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878115) |
| 16455 | 2026-09-30 | Ross Parker | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878300) |
| 16494 | 2026-09-30 | Rob Goolsby | $85.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878481) |
| 16416 | 2026-09-30 | Rita Gray | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878158) |
| 16419 | 2026-09-30 | Rita Conger | $85.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173878165) |
| 16420 | 2026-09-30 | Maggie Pierotti | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878167) |
| 16412 | 2026-09-30 | Jenny Roy | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878139) |
| 16383 | 2026-09-30 | Jeff Hardman | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878032) |
| 16413 | 2026-09-30 | Harsh Nanchahal | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878142) |
| 16396 | 2026-09-30 | Dennis Scroggins | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878079) |
| 16669 | 2026-09-30 | David Bennett | $85.00 | Tavis Alexander | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879354) |
| 16422 | 2026-09-30 | Dave Wilson | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878171) |
| 16594 | 2026-09-30 | Chuck  Christenson | $85.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879037) |
| 16399 | 2026-09-30 | Christina McDougall | $85.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878093) |
| 16442 | 2026-09-30 | Theo Vervilles | $80.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878250) |
| 16430 | 2026-09-30 | Velena Bryant | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878202) |
| 16967 | 2026-10-01 | Della Crossley | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101114) |
| 16936 | 2026-10-01 | Bill Langley | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100923) |
| 16915 | 2026-10-01 | Dee Lewis | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174100764) |
| 16405 | 2026-09-30 | Brienna Dyberg | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878113) |
| 16473 | 2026-09-30 | Alex Stevenson | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878383) |
| 16632 | 2026-09-30 | Thanh Tran | $75.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879226) |
| 16389 | 2026-09-30 | Tom Hornberg | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878054) |
| 16381 | 2026-09-30 | Shana Valencia | $75.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878029) |
| 16614 | 2026-09-30 | Dalveer Josan | $75.00 | Cory Ventura | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173879131) |
| 16466 | 2026-09-30 | Irene VandenBrink | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878363) |
| 17040 | 2026-10-01 | Ross Good | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174101636) |
| 16425 | 2026-09-30 | Gary Hollins | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878181) |
| 16756 | 2026-09-30 | Paul Davis | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879616) |
| 16435 | 2026-09-30 | Sheri Powers | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878222) |
| 16708 | 2026-09-30 | Martha  Dawson | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879478) |
| 16711 | 2026-09-30 | Jeff Nugent | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879488) |
| 16719 | 2026-09-30 | Nasima Vira | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879516) |
| 16424 | 2026-09-30 | Dennis Higashiyama | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878177) |
| 16761 | 2026-09-30 | Jonae | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879632) |
| 16668 | 2026-09-30 | Pauline Kabue | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879349) |
| 16467 | 2026-09-30 | Mark Fisher | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878365) |
| 16571 | 2026-09-30 | Mark Baughman | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173878939) |
| 16707 | 2026-09-30 | Mark & Lois Parhaniemei | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879474) |
| 16709 | 2026-09-30 | Marianne Parasida | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879481) |
| 16757 | 2026-09-30 | Laura Zarro | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879618) |
| 16730 | 2026-09-30 | Katie Richardson | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879542) |
| 16720 | 2026-09-30 | John Wohlfarth | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879520) |
| 16803 | 2026-09-30 | Jay Hickenbottom | $50.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/173879751) |
| 15493 | 2026-09-30 | Chad Vetter | $50.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/167071188) |
| 15561 | 2026-10-01 | Mary Greco | $50.00 | Tavis Alexander | — | Tavis Alexander | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/169428811) |
| 15577 | 2026-09-30 | Terry Wirth | $45.00 | Tavis Alexander | — | Tavis Alexander | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/169867738) |