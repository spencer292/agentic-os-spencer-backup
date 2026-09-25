# Small-Batch Coffee Roasting — Start, Scale, Market, Succeed

**Date:** 2026-09-15
**For:** Spencer Hill — personal venture, separate from Got Moles
**Geography:** SR-410 / Plateau corridor (Buckley, Enumclaw, Bonney Lake, Sumner, Black Diamond, Orting, Graham)

> Verify every regulatory figure in here directly with the agency named. Fees and caps move, and this document states ranges from general knowledge, not from a call placed on 2026-09-15.

---

## 1. The one thing to internalize first

**The Behmor is not a business machine — it's a school.** Its ceiling is roughly 1.5–2 lb roasted per hour once you account for cooling cycles between batches, which caps the venture around $1,500–2,000/month in revenue at punishing labor.

That's fine. It is the correct first purchase. But plan the equipment jump from day one, because the trap is spending two years building demand you physically cannot serve — or burning out on 10-hour roasting weekends for $400.

Roasting is also never the bottleneck. **Selling is.** Most home roasters who go pro fail because they built supply and never built demand.

---

## 2. Starting: months 0–6

### 2.1 Gear (~$1,200–1,800 all in)

| Item | Cost | Notes |
|---|---|---|
| Behmor 2000AB Plus | ~$450 | 1 lb max; roast 8–12 oz for even results. Built-in catalytic afterburner = indoor-legal, low smoke. That's why it's the right pick over a Fresh Roast or a popper. |
| 0.1g scale + 2kg kitchen scale | $40 | |
| Cupping set (6 bowls + spoons) | $40 | Non-negotiable. |
| Burr grinder (Baratza Encore ESP / Fellow Ode Gen 2) | $250–350 | You can't sell what you can't taste. |
| Bean probe + Artisan software | $50–150 / free | Behmor doesn't log natively. You already run node scripts against the Jobber API — you will want the data. |
| Green coffee, 20–30 lb assorted | $200–300 | |
| Bags w/ one-way valve, labels, impulse sealer | $150 | Stage 1, not Stage 0. |
| Cool/dry green storage (off floor, stable temp, no light) | $0–100 | Green keeps 6–12 months in GrainPro. |

### 2.2 The first 90 days: don't sell anything

Goal is **40–60 logged roasts** and one coffee you can reproduce three times running.

Log every batch:

- green weight
- charge temp
- ambient temp (matters more than people expect on a Behmor)
- first crack time
- drop time
- **development time ratio** (time from first crack to drop, as % of total — target 18–25%)
- roasted weight
- weight-loss % (light 12–14%, medium 15–17%, dark 18–20%)

Then cup them blind against each other, weekly.

Without logs you stay a hobbyist forever. That is the actual dividing line between people who go pro and people who don't — not equipment, not palate.

Start with 3–4 origins of different densities so each one punishes you differently: a washed Ethiopian, a Colombian or Guatemalan, a natural Brazil, a Sumatra.

### 2.3 Green sourcing is the real moat

Everyone can learn to roast in six months. Almost nobody has good green at good prices.

| Tier | Source | Volume | Approx. cost |
|---|---|---|---|
| 1 — Education | Sweet Maria's, Happy Mug | 1–5 lb | $9–13/lb |
| 2 — Bridge | **Genuine Origin** (Volcafe) | single 30kg/66 lb boxes, no minimum, published cupping scores | $6–9/lb |
| 3 — Real | Royal Coffee (The Crown), Cafe Imports, Red Fox | full bags + splits | $5–8/lb for solid 84–86 pt |

Moving from tier 1 to tier 2 roughly **halves your green cost**. That single step is worth more to the P&L than any roaster upgrade. Ask every importer about splits.

Note: the C market hit record highs through 2024–25 and has stayed elevated. Price your bags against what green actually costs you this quarter, not against a blog post from 2023.

---

## 3. Unit economics

At ~15% roast loss, a 12 oz bag needs **14.1 oz of green (0.88 lb)**.

| Line | Small-lot green ($9/lb) | Full-bag green ($5.50/lb) |
|---|---|---|
| Green | $8.00 | $4.85 |
| Bag + valve + label | $0.70 | $0.55 |
| Power | $0.05 | $0.05 |
| **COGS** | **$8.75** | **$5.45** |
| Card processing (3%) | $0.54 | $0.54 |
| Retail price | $18.00 | $18.00 |
| Gross profit | $8.71 | $12.01 |
| **Gross margin** | **48%** | **67%** |

Add ~$7 shipping to either column and the DTC mail-order model collapses. That is the whole argument for selling locally.

Run `node unit-economics.mjs` to re-price with your real numbers.

### Then reality intrudes

**Shipping kills DTC.** $5–9 for a 12 oz USPS package eats the entire margin. Local pickup, farmers markets and local delivery are the whole game early. You run a routing operation across King/Pierce/Thurston — local delivery economics are something you understand better than 99% of roasters. That is not a small edge.

**Labor is the hidden number.** 45–60 min of attention per pound roasted at the start, counting prep, weighing, cooling waits, resting and bagging. At $30/hr that's $30/lb — more than your entire COGS. It is "free" while it's a hobby. The moment it isn't free, you need the Bullet.

**Payment processing** takes ~3%.

### The honest Behmor ceiling

10 hrs/week roasting → ~18 lb roasted → ~24 bags → **~$430 revenue, ~$220 gross profit. Per week.** That is the machine's limit, not a pessimistic scenario.

### Useful framing for customers

A 12 oz bag brews ~20 cups. At $18 that's **$0.90 a cup**, against $6 at a counter. The value story writes itself — you never have to argue price, just show the arithmetic.

---

## 4. Legal and regulatory (Washington)

This is where most people get surprised. It is a genuine cost gate, not a formality.

| Item | What it is | When it bites |
|---|---|---|
| **WSDA Cottage Food Permit** | Roasted coffee is on the allowed list. ~$230 initial, ~$35k annual gross cap. **Direct-to-consumer, in-state only** — no wholesale, no third-party retail, no out-of-state shipping. | Stage 1–2. Perfect fit, then a hard wall. |
| **WSDA Food Processing License** | Required the moment you wholesale or sell through any third party. Needs a facility separate from living space. | This, not the roaster, is what makes Stage 3 expensive. |
| **Puget Sound Clean Air Agency** | King/Pierce are in their jurisdiction and they regulate commercial coffee roasters. Expect a Notice of Construction and likely an afterburner above small-batch size. | Non-issue now (Behmor has a built-in catalytic converter). **Call them before signing a Stage 3 lease, not after.** |
| **Labeling** | Name, net weight, ingredients, your name/address, plus the cottage-food home-kitchen disclosure. Roast date isn't legally required — put it on anyway (see §7.2). | Stage 1. |
| **Entity** | Separate LLC. Different risk profile, different books, and you want clean financials if you ever sell or take a partner. | Before the first dollar. |
| **Zoning / home occupation permit** | Check City of Buckley. Usually fine at this scale, occasionally not. | Before Stage 1. |
| **Sales tax** | Whole-bean coffee sold as a grocery item is generally food-exempt in WA; prepared beverages are taxable. Confirm. | Stage 1. |

---

## 5. Market analysis

### 5.1 The honest picture

Seattle is arguably the most saturated specialty coffee market in North America: Victrola, Caffe Vita, Lighthouse, Slate, Onda Origins, Broadcast, Middle Fork, Boon Boona, Kuma, Anchorhead, Ladro, Fulcrum, Espresso Vivace — plus Starbucks/Stumptown/Intelligentsia distribution everywhere. Tacoma has Bluebeard, Valhalla, Anthem. Dillanos in Sumner runs serious wholesale volume.

### 5.2 But that isn't your market

Your market is the **SR-410 / Plateau corridor** — Buckley, Enumclaw, Bonney Lake, Sumner, Black Diamond, Orting, Graham. Those communities have no third-wave roaster of their own. Dillanos is geographically close but it's a wholesale operation, not a local micro-roaster with a face.

That's a real, defensible wedge. **You are not competing with Victrola. You are competing with the grocery shelf** — and that's a fight you win on freshness alone, because shelf coffee is 4–12 weeks old and never says so.

### 5.3 Your unfair advantages, ranked

1. **~5,000 residential customers in exactly this geography**, 5.0 across three GBP listings, with an existing SMS channel. Nobody launching a coffee brand has a warm local list of 5,000. **Use it carefully** — gift-and-invite channel, not a blast channel. One clumsy mass text spends trust earned over nine years.
2. **Four techs visiting ~500 homes/week.** A bag with a QR code as a thank-you gift is a distribution channel that costs COGS and nothing else. Ask the accountant how it's expensed; keep branding fully separate (nobody wants mole-adjacent coffee).
3. **You already sell B2B** to property managers and HOAs. Office coffee is the same buyer, same conversation, and `mkt-linkedin-nurture` already has the pipeline shape.
4. **You understand route density and delivery cost** at a level most roasters never develop.

### 5.4 Where to sell, in order

1. **Farmers markets** — Enumclaw, Bonney Lake, Sumner, Puyallup. $25–60/stall. Direct feedback, cash, zero shipping, free samples convert hard. This is the validation lab: twenty conversations on a Saturday beats six months of guessing.
2. **Local non-coffee retail** — butcher, feed store, golf pro shop, brewery, gift shop. Low volume, high visibility, no shelf competition.
3. **Subscription to your own community.** 100 subscribers × $18/mo = $1,800 MRR *and* predictable volume — which is what unlocks full-bag green pricing. Highest-value customer type by a distance.
4. **Wholesale — last, and carefully.** It looks like scale. At $12/lb wholesale against $9/lb small-lot green you make $3/lb and inherit deliveries, barista training, equipment loans and 30-day terms. Wholesale only works with full-bag green and a real roaster. **Do not chase wholesale on a Behmor.**

---

## 6. Scaling ladder

| Stage | Machine | Cost | Throughput | Monthly rev |
|---|---|---|---|---|
| 0–1 | Behmor 2000AB Plus | $450 | 1.5–2 lb/hr | $0–1,500 |
| 2 | **Aillio Bullet R1 V2** | $3,500–4,000 | 8–10 lb/hr | $1,500–6,000 |
| 3 | Mill City 1–2kg / used Diedrich IR-2.5 / Giesen W6 | $10k–40k + $60k–150k buildout | 15–60 lb/hr | $5k–30k |
| 4 | Drive-thru hut or café | $40k–500k | — | — |

**The Bullet is the pivotal purchase.** 1kg batches, runs on 120V, real profile control and data logging through RoasTime, genuinely repeatable. It turns "I roast coffee" into "I have a product." Roughly 5× throughput for $3,500.

Alternative worth knowing: **Kaffelogic Nano 7** (~$4k) — fully automatic profiles, superb consistency, but tiny batches (~600g). Better lab machine, worse business machine. The Bullet is the right call for throughput.

**Buy the Bullet when — and only when — you've sold out Behmor capacity four consecutive weeks.** Not when you're excited. Not when you find a deal.

Stage 3 is a different business: commercial lease, WSDA plant license, PSCAA permit, three-phase power or a gas line, Type I hood, fire suppression. Budget $60k–150k beyond the roaster. Don't arrive there by accident.

---

## 7. What separates roasters who make it

1. **Consistency, logged and cupped.** See §2.2. It is the whole thing.
2. **Freshness as the product.** Roast-to-order, roast date on every bag, in hands within 48 hours. This is the *only* dimension where you beat a national roaster, and it is decisive. Make the date the headline, not fine print.
3. **Blend for espresso, single-origin for filter.** Espresso blends are where wholesale money lives and where consistency gets tested hardest.
4. **Never compete on price.** You'll lose, and you'll have taught your customers the wrong thing about what you are.
5. **Packaging carries the shelf.** One-way valve mandatory. Good design is worth more than an extra origin on the menu.
6. **Story.** Army veteran who built a mole business out of his own Buckley yard, now roasting for the Plateau. That is a brand people remember and repeat. Don't do generic-mountain-logo coffee — there are four hundred of those.
7. **Presell.** Take orders, then roast. Never build inventory you haven't sold.

---

## 8. The coffee shop, honestly

**A café is a job, not an investment.** $150k–500k+ buildout, labor 30–35% of revenue, COGS 20–25%, rent that should be under 10% and in Puget Sound usually isn't, and a typical independent nets 3–8%. Roughly half to two-thirds don't reach five years. The owner works 60-hour weeks.

It is also a completely different business from roasting: one is hospitality, real estate and labor management; the other is manufacturing and sales.

Two things worth knowing:

**Roastery-first makes a shop work later.** You'd arrive with product at cost, brand equity, and wholesale accounts that de-risk the retail revenue. Shop-first with someone else's beans is the hard version.

**The drive-thru hut is the smarter shop-shaped move here.** It's the Pacific Northwest-native model for a reason: $40k–120k for a hut plus a site lease versus a full café buildout, far better margins, no dining-room labor, and Western Washington has the most mature drive-thru coffee culture in the country. If a retail footprint ever makes sense, it's almost certainly this and not a sit-down café.

---

## 9. Gates and kill criteria

Set these now, while it's cheap and you're unattached.

**Go gates**

- Month 3 — one coffee reproduced 3× running, 40+ logged roasts → start selling.
- Month 6 — 20 repeat full-price buyers → cottage food permit, farmers market.
- Month 12 — sold out 4 straight weeks → buy the Bullet.
- Month 24 — wholesale profitable on full-bag green, and someone other than you can run a shift → consider Stage 3.

**Kill criteria — stop, or stay a hobby, if**

- Month 6 and fewer than 10 people have bought twice at full price. Repeat purchase is the only signal that matters; one-time buys are politeness.
- Month 12 and you're under $800/mo revenue while enjoying it less than at month 3.
- Any month where coffee costs you more than 8 hours Got Moles needed.

---

## 10. The thing worth saying plainly

Cash isn't your constraint. $1,500 to find out is cheap and worth spending. **Your attention is the constraint.** Got Moles has a vacant Marketing seat, a vacant Finance seat, and an open phone-conversion gap worth real money to close. Coffee competes with those for the same scarce hour.

So structure it deliberately as a hobby with a business option attached: hard-cap the weekly hours, keep the kill criteria written down where you'll actually re-read them, and let it prove itself on repeat purchases before it gets one more hour than you planned to give it.

If it earns its way up the ladder, you'll know — because customers will be pulling instead of you pushing.
