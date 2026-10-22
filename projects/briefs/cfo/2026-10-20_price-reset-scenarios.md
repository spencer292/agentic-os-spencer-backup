# Price Reset: Scenarios, Competitors, Timing

**Built 2026-10-20 · DRAFT, nothing changed in Jobber.** Model: `scripts/model-pricing.mjs` on the 09-29 active book (744 monthly TMCP jobs). Quote data: `got-moles-scale/data/quotes.jsonl` (1,130 quotes, Jul 2025–Jul 2026). Retention: `invoices.jsonl`.

## Answer

**Raise the program price and hold the Quick Fix.** In the expected case, 2027 gains **~$95K cash** and the business exits 2027 **~$150K/yr higher run-rate**. The downside case, where 10% of affected customers leave and new-sale closing drops 6 points, still comes out roughly breakeven, not a loss. The increase only loses money if **more than ~9% of the customers it touches cancel because of it**. Your own data shows no sign that program buyers pick the cheaper price.

| Lens | Expected case | Downside case |
|---|---|---|
| Cash, 2027 in-year | **+$95K** | +$15K |
| Profit, run-rate contribution | **+$150K/yr** | +$40K/yr |
| Value at 7–10x (recurring >70%) | **+$1.0–1.5M** | +$0.3–0.4M |

All figures are `ESTIMATE` built on `KNOWN` book counts.

## 1. What your own data says about price sensitivity

**Program buyers: no visible price sensitivity between $85 and $125 a month.** `KNOWN`, cross-sectional and confounded by property size and quote age.

| 2026 TMCP quote | n | Close (issued) | Close (decided) |
|---|---:|---:|---:|
| $1,020/yr ($85/mo) | 47 | 62% | 69% |
| $1,200/yr ($100/mo) | 250 | 62% | 75% |
| $1,500/yr ($125/mo) | 17 | 82% | 82% |

When new-sale pricing moved from $85 to $100 in early 2025, sales volume kept growing. Retention on the 2025 Q3 cohort over 10 months: <$90 = 93%, $100 = 88%, $101–150 = 92%. That's no gradient, and the samples are small.

**Quick Fix buyers do respond to price.** Same months (Jul–Oct 2025), same season:

| Quick Fix quote | n | Close |
|---|---:|---:|
| $400 | 70 | 87% |
| $450 | 131 | 82% |
| $500 | 123 | 78% |

Each ~$50 step costs about 4–5 close points. Quick Fix already went from $400 to $450 in fall 2025. It's also the product that feeds the program, so a 10% increase there trades about 5% more revenue per quote for about 5% fewer customers entering the funnel. **Hold it at $450/$500/$600.**

## 2. Existing-book scenarios

Effective dates assumed: grandfathered Feb 1, $100+ group Mar 1. Contribution uses ~$41/mo variable cost per job (`ESTIMATE`).

**A. Grandfathered to $100.** Use the vetted 129-job list (`2026-09-29_tmcp-price-increase-list.md`). +$1,683/mo, +18–20%.
The full model finds 199 sub-$100 jobs. The other 70 are under a year old or carry discounts you approved, so leave them until their anniversary.

| Cancel because of it | Jobs lost | 2027 cash | Run-rate contribution |
|---:|---:|---:|---:|
| 0% | 0 | +$18.5K | +$23K/yr |
| 5% | 6 | +$12K | +$18K/yr |
| 10% | 13 | +$5K | +$13K/yr |

Revenue breaks even at ~15% lost and contribution at ~25%. These are the most loyal customers you have (93% retention), so this group carries the least risk.

**B. +10% on residential $100–199.** 517 jobs, $53.3K → $58.7K/mo, +$5,416/mo.

| Cancel because of it | Jobs lost | 2027 cash | Run-rate contribution |
|---:|---:|---:|---:|
| 0% | 0 | +$54K | +$65K/yr |
| 3% | 16 | +$37K | +$51K/yr |
| 5% | 26 | +$25K | +$42K/yr |
| 10% | 52 | −$5K | +$20K/yr |
| 15% | 78 | −$34K | −$3K/yr |

**Flip points:** revenue at 9.2% lost, contribution at 14.4%. Contribution holds up longer because every customer who leaves also stops costing visits.

What to expect: Rollins (Orkin) is taking 3–4% a year in 2026 and reports no notable pushback. I found no pest-industry churn data for a 10% step. **Plan on 3–5% and treat anything over 7% in the first 30 days as the stop signal.**

**Not touched:** 26 commercial contracts at $200+/mo. Reprice those at renewal, one by one.

**Military/veteran and senior discounts are honored (Spencer, 2026-10-20).** 22 monthly jobs keep today's price: 12 with a `Military Discount` line and 10 with a `Senior Discount` line ($10–25 off a $100 list). The +10% group is now 495 jobs and gains +$5,196/mo, so honoring the discounts costs ~$220/mo (~$2.2K in 2027). Gap: the call FAQ says some military and senior discounts were given verbally as an $85–90 price with no line item. Those can't be found in the data and may be on the 129 grandfathered list, so check that list by hand before notices go out.

## 3. New-sale scenarios

Assume ~700 new program sales in 2027 (plan E), each billing ~5.5 months in-year on average because sales peak in summer.

**C. New-sale list $100/$125/$150 → $110/$135/$165.**

| Close-rate effect | 2027 cash | Run-rate |
|---|---:|---:|
| None (what the quote data shows) | +$38K | +$84K/yr |
| −3 points | +$17K | +$38K/yr |
| −6 points | −$5K | −$8K/yr |

**D. Apply the acreage tiers you already publish.** This is the bigger leak. Only 40 of 744 program jobs sit on the $125 or $150 tiers, yet ~27% of Quick Fix quotes land on the $500 or $600 tier (`KNOWN`). If ~20% of new program sales are really over 1 acre, enforcing the tier is worth **+$19K in 2027 and +$42K/yr run-rate** (`ESTIMATE`). It isn't really a price increase, since it's the price already on the card. It needs an acreage question at quote time; county parcel data or Jobber coordinates could check it.

## 4. Competitors

The full report is from the 2026-10-20 search.

- **No Western WA mole competitor publishes prices.** Mole Masters (Tacoma/Seattle/Eastside, the only other year-round program found) charges flat per trip with an "up-to" estimate. Mole Patrol (Snohomish/Skagit) charges setup plus per mole. Orkin/Terminix/Cascade/Sound mole offerings: UNVERIFIED.
- **National benchmarks** (HomeAdvisor 2026-06): $100–$550 a job, average ~$400; $50–$80 per mole plus ~$100 setup. Year-round plans run $600–$1,200/yr (Fixr, date unverified).
- **Where you sit:** $1,200/yr on the smallest tier is already the top of the national plan range, and $1,320 would sit above it. You'd be the premium option. What supports that: 340 five-star reviews against competitors with no visible review base, the no-catch guarantee, and being the only transparent price in the market.
- **Gap:** real local prices stay unknown. Spencer decided 2026-10-20 to skip mystery-shopping; the plan does not depend on them.

## 5. Is now the right time?

Yes, with the timing below.

- **Costs give a reason customers will accept:** WA minimum wage rises to $17.73 on Jan 1 2027 (+3.5%), CPI is +3.4%, energy is +16%, and WA gas is $5.52.
- **You haven't touched the existing base.** Grandfathered customers have paid $75–$95 since 2023–24.
- **The demand signal is strong:** 69% quote close and recurring billing doubled in 2026. A business that's losing on price doesn't look like that.
- **Against it:** winter is when customers see the least for their money (~1.5 visits/mo Dec–May). An increase landing in January hits exactly when someone is asking "what am I paying for?"

**Sequence:**
1. **Nov 2026:** add the acreage question to intake.
2. **Jan 1:** new-sale list goes to $110/$135/$165, with tiers enforced. Jan–Feb volume is the lowest of the year, so if close rate drops, you find out with the least money at stake.
3. **Jan 5:** grandfathered notice goes to the 129 jobs, effective Feb 1. Watch cancellations for 30 days. This is the test cohort.
4. **Feb 1:** if grandfathered cancellations are ≤7%, send the +10% notice to the 517-job group, effective Mar 1. Give the reason as market-wide (wages, fuel). In the one controlled study found (self-storage), that framing cut attrition ~30% versus no explanation.
5. **Retention valve:** with the notice, offer *"prepay 12 months before Mar 1 and keep your current rate."* It locks the customers most likely to leave and brings cash in during the trough month.
6. **Quick Fix:** no change.

## Open / UNKNOWN

- Real local competitor prices (not pursued, Spencer's call)
- Share of program properties over 1 acre (drives lever D)
- Seasonal churn pattern. The 1.14%/mo figure comes from an 8-week peak-season window.
