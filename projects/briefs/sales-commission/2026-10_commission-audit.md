# Commission and salesperson-attribution audit — 2026-10

Source: 77 invoices issued in 2026-10, plus 149 quotes created in 2026-10. Pulled 2026-10-23 00:07Z.

## 1. Attribution health

| | Invoices | Invoiced |
|---|---:|---:|
| Chain clean (quote = job = invoice) | 49 | $18,923.00 |
| Has a problem | 28 | $8,925.00 |
| **Total** | **77** | **$27,848.00** |

### Problems by type

| Problem | Invoices | Invoiced | What it means |
|---|---:|---:|---|
| `NO_SELLER_ANYWHERE` | 23 | $8,225.00 | No quote and no seller anywhere — unattributable without a human call |
| `JOB_MISSING_SELLER` | 4 | $650.00 | Quote had a seller, the job lost it |
| `INVOICE_MISSING_SELLER` | 2 | $550.00 | Seller known upstream but the invoice has none — Jobber's own commission report misses it |
| `INVOICE_DISAGREES_WITH_QUOTE` | 1 | $50.00 | Invoice credits a different person than the quote |
| `JOB_DISAGREES_WITH_QUOTE` | 1 | $50.00 | Job credits a different person than the quote |

## 2. Commissionable totals by salesperson

Seller is resolved from the QUOTE first, then the job, then the invoice — so a broken chain still lands on the right person here, even where Jobber's own report would miss it.

| Salesperson | Invoices | Invoiced | Collected | Of which flagged |
|---|---:|---:|---:|---:|
| Muhammad Javed | 39 | $15,250.00 | $7,400.00 | 1 ($450.00) |
| (UNATTRIBUTED) | 23 | $8,225.00 | $5,250.00 | 23 ($8,225.00) |
| Spencer Hill | 5 | $2,648.00 | $300.00 | 1 ($50.00) |
| Cory Ventura | 4 | $1,375.00 | $1,175.00 | 1 ($50.00) |
| Alias Franks | 3 | $150.00 | $0.00 | 0 ($0.00) |
| Courtney | 1 | $100.00 | $100.00 | 1 ($100.00) |
| Luke LaVergne | 1 | $50.00 | $0.00 | 0 ($0.00) |
| Tavis Alexander | 1 | $50.00 | $0.00 | 1 ($50.00) |

### Split by product

| Salesperson | Product | Invoices | Invoiced | Collected |
|---|---|---:|---:|---:|
| Muhammad Javed | Quick Fix | 39 | $15,250.00 | $7,400.00 |
| (UNATTRIBUTED) | Quick Fix | 21 | $7,875.00 | $5,250.00 |
| (UNATTRIBUTED) | Barter/F&F | 1 | $250.00 | $0.00 |
| (UNATTRIBUTED) | TMCP | 1 | $100.00 | $0.00 |
| Spencer Hill | TMCP | 3 | $1,748.00 | $0.00 |
| Spencer Hill | Quick Fix | 2 | $900.00 | $300.00 |
| Cory Ventura | Quick Fix | 2 | $825.00 | $675.00 |
| Cory Ventura | TMCP | 2 | $550.00 | $500.00 |
| Alias Franks | TMCP | 3 | $150.00 | $0.00 |
| Courtney | TMCP | 1 | $100.00 | $100.00 |
| Luke LaVergne | TMCP | 1 | $50.00 | $0.00 |
| Tavis Alexander | TMCP | 1 | $50.00 | $0.00 |

## 3. Fix list — every invoice with a broken chain

| Invoice | Date | Client | Total | Quote seller | Job seller | Invoice seller | Problem | Link |
|---|---|---|---:|---|---|---|---|---|
| 17118 | 2026-10-08 | Kathryn Ngo | $450.00 | Muhammad Javed | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/175278516) |
| 17104 | 2026-10-05 | Leo Coronado | $450.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174728467) |
| 17114 | 2026-10-07 | Gina Shields | $450.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175073427) |
| 17169 | 2026-10-21 | David Williamson | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/176829075) |
| 17167 | 2026-10-21 | Candy Ford | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/176811187) |
| 17165 | 2026-10-21 | Mike Ruff | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/176755814) |
| 17162 | 2026-10-20 | Amy Crenshaw-Burns | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/176623581) |
| 17137 | 2026-10-13 | Jake Fox | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175779068) |
| 17138 | 2026-10-13 | John Obrien | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175784379) |
| 17141 | 2026-10-14 | Sue Pennock | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175909494) |
| 17142 | 2026-10-14 | Holly Quionez | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175915664) |
| 17133 | 2026-10-13 | Kevin Milliren | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175734725) |
| 17100 | 2026-10-02 | James Wallace | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174524194) |
| 17135 | 2026-10-13 | Michael Glover | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175747013) |
| 17128 | 2026-10-12 | Tia Avril | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175609163) |
| 17122 | 2026-10-09 | Annette Bunker | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175386677) |
| 17094 | 2026-10-01 | Anthony Cuccia | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174220758) |
| 17097 | 2026-10-01 | Chris Heacox | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174292388) |
| 17116 | 2026-10-07 | Elaine Rustvold | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175079635) |
| 17095 | 2026-10-01 | Tyler Donaldson | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174221190) |
| 17134 | 2026-10-13 | Tad Hutchison | $300.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/175744405) |
| 17105 | 2026-10-05 | Bob Chatalas | $300.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/174743535) |
| 17159 | 2026-10-20 | Melissa  Bobbit | $250.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/176565110) |
| 17171 | 2026-10-22 | Chris Sita | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/176987925) |
| 17156 | 2026-10-20 | Michelle  Rasmussen | $100.00 | Courtney | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/176530085) |
| 17126 | 2026-10-31 | Jessica Angel | $50.00 | Spencer Hill | Alias Franks | Alias Franks | INVOICE_DISAGREES_WITH_QUOTE, JOB_DISAGREES_WITH_QUOTE | [open](https://secure.getjobber.com/invoices/175537579) |
| 16862 | 2026-10-31 | Michael Sexton | $50.00 | Cory Ventura | — | Cory Ventura | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173911495) |
| 16373 | 2026-10-31 | Chris Kerr | $50.00 | Tavis Alexander | — | Tavis Alexander | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/173791616) |