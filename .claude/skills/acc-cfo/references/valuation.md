# The Value Lens — how Got Moles decisions move enterprise value

Reference for `acc-cfo`. Loaded when running the Value lens on any decision.

All multiples here are **ESTIMATE** — 2026 sector M&A guidance, not an appraisal.
Sources: Breakwater M&A, CT Acquisitions, PestPac 2026 valuation guides.

---

## The core formula

```
Enterprise Value = Normalized EBITDA x Multiple
```

Owners obsess over the left term and ignore the right. **The multiple is the bigger lever**, and
in this sector it is driven by something Got Moles can directly control: recurring revenue share.

## The multiple bands

| Recurring share of revenue | Multiple |
|---|---|
| Under 40% | 3.5x – 4.5x |
| 60% (platform threshold) | 5x – 7x |
| Over 70% | 7x – 10x |

Most transactions in the $500K–$5M EBITDA range land at **5x–8x**. Normalized EBITDA typically
adds **5–15%** back to reported EBITDA for founder-led businesses (owner add-backs).

**Why this dominates every other lever:** the same $500K of EBITDA is worth $2.25M at 4.5x and
$3.5M at 7x. Moving recurring share across the 60% threshold is worth more than a year of
revenue growth — and it costs almost nothing except converting customers who already exist.

For pest control specifically, the sector trades at 7–10x for mid-market tuck-ins against 4–7x
for HVAC and 4–6x for plumbing. Route density and recurring contracts are why.

## The six named value drivers

Score every significant decision against these, not just against profit:

| Driver | Got Moles today | Read |
|---|---|---|
| **Recurring mix** | Unmeasured — TMCP tag count conflicts with MRR (see `open_conflicts` C1) | **The biggest lever, and it is not even instrumented** |
| **Customer retention** | UNKNOWN — 20 churn tags against 597 active members | Cannot be reported to a buyer. Fix the tagging. |
| **Technician retention** | Not tracked. Cammeron departed; Robert and Tavis are new | Buyers ask. Have an answer. |
| **Customer concentration** | Top 10% of clients = 37% of revenue | Watch it. Concentration discounts the multiple. |
| **Tech stack** | **Genuinely strong** — Jobber, OptimoRoute, CallRail, automated routing, AI ops | A real differentiator; most sub-$5M operators have nothing like it |
| **Management depth** | **Weak** — Spencer still runs 43 visits/wk, Cory runs 103 | An owner-dependent business sells at a discount or does not sell |

## How this changes specific decisions

**TMCP conversion is not a marketing campaign — it is the highest-ROI capital allocation
decision available.** It moves the multiple, not just the revenue. Treat it as such when it
competes for budget against ads or hiring.

**"Free the founders" hires are value-creating even at negative EBITDA.** A relief hire shows
as pure cost in the Profit lens (see `model-hire.mjs --mode relief`), but it moves *management
depth*, which is a named multiple driver. That is the entire justification, and it must be
stated explicitly rather than smuggled in as a productivity claim.

**Churn tagging hygiene is a valuation project.** Unmeasured retention is not a reporting gap,
it is a diligence failure that caps the multiple regardless of how good the retention actually is.
A buyer discounts what cannot be proven.

## Rules for the Value lens

- **Never run the Value lens off contribution margin.** Value runs off EBITDA. Contribution
  margin excludes overhead and will overstate every decision by the amount it ignores.
- **Always show a band, never a point estimate.** Report at two multiples so the recurring-mix
  sensitivity is visible on every decision.
- **State when the multiple itself moves.** Most decisions only change EBITDA. The few that
  change the multiple — recurring mix, retention, management depth — are worth far more than
  their EBITDA effect suggests, and that must be called out.
- **Do not produce a company valuation until EBITDA is KNOWN.** Until costs land, enterprise
  value is UNKNOWN. Say so rather than estimating off revenue.
