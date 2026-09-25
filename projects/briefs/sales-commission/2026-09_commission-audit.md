# Commission and salesperson-attribution audit — 2026-09

Source: 45 invoices issued in 2026-09, plus 81 quotes created in 2026-09. Pulled 2026-09-10 20:14Z.

## 1. Attribution health

| | Invoices | Invoiced |
|---|---:|---:|
| Chain clean (quote = job = invoice) | 27 | $10,145.00 |
| Has a problem | 18 | $7,150.00 |
| **Total** | **45** | **$17,295.00** |

### Problems by type

| Problem | Invoices | Invoiced | What it means |
|---|---:|---:|---|
| `NO_SELLER_ANYWHERE` | 15 | $6,350.00 | No quote and no seller anywhere — unattributable without a human call |
| `JOB_MISSING_SELLER` | 3 | $800.00 | Quote had a seller, the job lost it |
| `INVOICE_MISSING_SELLER` | 2 | $750.00 | Seller known upstream but the invoice has none — Jobber's own commission report misses it |
| `QUOTE_MISSING_SELLER` | 2 | $1,550.00 | A quote exists but nobody was set on it at the source |

## 2. Commissionable totals by salesperson

Seller is resolved from the QUOTE first, then the job, then the invoice — so a broken chain still lands on the right person here, even where Jobber's own report would miss it.

| Salesperson | Invoices | Invoiced | Collected | Of which flagged |
|---|---:|---:|---:|---:|
| Spencer Hill | 21 | $9,300.00 | $3,250.00 | 2 ($750.00) |
| (UNATTRIBUTED) | 15 | $6,350.00 | $2,150.00 | 15 ($6,350.00) |
| Muhammad Javed | 3 | $1,350.00 | $900.00 | 0 ($0.00) |
| Alias Franks | 4 | $200.00 | $150.00 | 0 ($0.00) |
| Tavis Alexander | 2 | $95.00 | $95.00 | 1 ($50.00) |

### Split by product

| Salesperson | Product | Invoices | Invoiced | Collected |
|---|---|---:|---:|---:|
| Spencer Hill | Quick Fix | 21 | $9,300.00 | $3,250.00 |
| (UNATTRIBUTED) | Quick Fix | 12 | $4,700.00 | $2,000.00 |
| (UNATTRIBUTED) | TMCP | 3 | $1,650.00 | $150.00 |
| Muhammad Javed | Quick Fix | 3 | $1,350.00 | $900.00 |
| Alias Franks | TMCP | 4 | $200.00 | $150.00 |
| Tavis Alexander | TMCP | 2 | $95.00 | $95.00 |

## 3. Fix list — every invoice with a broken chain

| Invoice | Date | Client | Total | Quote seller | Job seller | Invoice seller | Problem | Link |
|---|---|---|---:|---|---|---|---|---|
| 16020 | 2026-09-01 | Plemmons Industries | $1,500.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170085389) |
| 16261 | 2026-09-04 | Ravi Kumar Balachandran | $500.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170982656) |
| 16280 | 2026-09-10 | Ranju Atwal | $450.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171577858) |
| 16275 | 2026-09-09 | Liz Silke | $450.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/171446400) |
| 16277 | 2026-09-09 | Drew Culver | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171465579) |
| 16274 | 2026-09-09 | Tai Tran | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171431949) |
| 16273 | 2026-09-09 | Scott Jennings | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171422315) |
| 16271 | 2026-09-08 | Richard Kaumans | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171344942) |
| 16266 | 2026-09-08 | Paul Costa | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171245049) |
| 16265 | 2026-09-08 | Shawn Tobius | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171243385) |
| 16253 | 2026-09-02 | Roseanne Ingroia | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170637777) |
| 16258 | 2026-09-03 | Donna Youngblood | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170809981) |
| 16255 | 2026-09-02 | Chad Erickson | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170697109) |
| 16244 | 2026-09-01 | Kirsten Mcclelland | $375.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/170380588) |
| 16249 | 2026-09-01 | Susan Eggleton | $300.00 | Spencer Hill | — | — | INVOICE_MISSING_SELLER, JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/170466143) |
| 16263 | 2026-09-05 | Wanda Neste | $100.00 | — | — | — | NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/171097484) |
| 15493 | 2026-09-30 | Chad Vetter | $50.00 | — | — | — | QUOTE_MISSING_SELLER, NO_SELLER_ANYWHERE | [open](https://secure.getjobber.com/invoices/167071188) |
| 15561 | 2026-10-01 | Mary Greco | $50.00 | Tavis Alexander | — | Tavis Alexander | JOB_MISSING_SELLER | [open](https://secure.getjobber.com/invoices/169428811) |