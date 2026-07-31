# Close rate, call conversion, and product mix

**Pulled 2026-07-31 from live Jobber (GraphQL) + CallRail.**
Quotes: 12 months (2025-08-01 → 2026-07-31, n=1,101). Jobs + calls: 3 months (2026-05-01 → 2026-07-31, n=355 jobs / 790 inbound calls) — CallRail has no data before 2026-04-30, so the call window can't go back further.

Scripts: `scripts/close-rate-analysis.mjs`, `close-rate-callers.mjs`, `close-rate-mix.mjs`, `close-rate-diag.mjs` (all read-only).

---

## 1. Close rate — 69% of quotes, 76% of the ones that get an answer

| Measure | Rate |
|---|---|
| Won ÷ all quotes issued (12 mo) | **68.5%** (754 of 1,101) |
| Won ÷ quotes that got a decision (excl. 114 still open) | **76.4%** |
| Mature cohort only (issued 30+ days ago, n=936) | 68.8% of issued / 74.0% of decided |
| Dollar-weighted | **64.0%** ($664,699 won of $1,038,397 quoted) |

"Won" = quote status `converted` or `approved`. "Lost" = `archived`.

**By product:**

| Product | Quotes issued | Won | Close rate | Avg won quote |
|---|---|---|---|---|
| Quick Fix | 555 | 414 | **74.6%** | $464 |
| Total Mole Control | 546 | 340 | **62.3%** | $1,390 |

The headline number to use is **69%** — it matches the 69% already on the Ninety scorecard, so that KPI is sound. Quote for quote, the Quick Fix closes 12 points better than the program, which is what you'd expect from a $464 decision vs a $1,390 one.

**Monthly trend (quotes by month created):**

| Month | Issued | Won | Lost | Still open | Close % |
|---|---|---|---|---|---|
| 2026-02 | 76 | 47 | 29 | 0 | 61.8% |
| 2026-03 | 106 | 66 | 37 | 3 | 62.3% |
| 2026-04 | 89 | 42 | 28 | 19 | 47.2% |
| 2026-05 | 64 | 42 | 5 | 17 | 65.6% |
| 2026-06 | 107 | 79 | 5 | 23 | 73.8% |
| 2026-07 | 174 | 118 | 7 | 49 | 67.8% |

⚠️ **Caveat on recent months:** May–July show only 5–7 lost quotes each, versus 28–37 in Feb–April. Quotes aren't being archived when they die anymore — they just sit in `awaiting_response` (89 open across the three months). So the recent "lost" column is understated and the open column is inflated. The true recent close rate is somewhere between the 67.8% "of issued" and the 94% "of decided" figures — realistically still in the high 60s / low 70s. **Worth fixing: archive dead quotes on a cadence, or the KPI drifts.**

---

## 2. Calls → job — about 1 in 4 new-lead calls books, and it's improving fast

790 inbound calls over 3 months, from 588 unique numbers.

**Call handling:** 736 answered (**93.2%**), 54 missed (6.8%). 146 calls (18.5%) ran under 30 seconds. Zero spam-flagged.

I split every caller against the full 4,336-client Jobber phone book so existing-customer service calls don't pollute the sales number:

| Segment | Callers | Share | Booked a job | Booking rate |
|---|---|---|---|---|
| Existing customer | 45 | 7.7% | 25 | 55.6% |
| New lead (client record created on the call) | 505 | 85.9% | 133 | 26.3% |
| New lead (never entered Jobber at all) | 38 | 6.5% | 0 | 0.0% |
| **All new leads** | **543** | **92.3%** | **133** | **24.5%** |
| New leads, answered + 30s+ conversation | 474 | — | 132 | **27.8%** |

**The trend is the real story:**

| Month of first call | New leads | Booked | Rate (real conversations) |
|---|---|---|---|
| May | 117 | 22 | 18.8% |
| June | 178 | 43 | 24.2% |
| July | 179 | 67 | **37.4%** |

Booking rate has doubled since May. I checked whether this was a measurement artifact and it isn't: 80% of bookings happen within 3 days of the first call and none take more than 60 days, so May's cohort is fully mature — its 18.8% is real, not "still pending."

**What actually changed is quoting discipline, not selling.** Quotes issued per unique caller went 0.41 (May) → 0.49 (June) → 0.75 (July), while the close rate on quotes stayed flat at 66–74%. You were never losing on the pitch; leads were leaving the call without a quote ever being written.

**Where the calls come from:** Google Business Profile 52.9%, Google Ads 19.6%, Google organic 14.3%, direct 6.7%, everything else (Bing, SearchGPT, Yelp) under 5% combined.

⚠️ **Two caveats on this section:**
1. Only **47% of jobs created** trace back to a tracked call. The rest are existing customers rebooking, web/manual entry, or calls that never hit CallRail. Related: ads currently bypass CallRail and the 253-331-2772 tracker swap is still pending — until that's done, true call volume is higher than 790 and this rate is a floor.
2. CallRail's `lead_status` field is **null on all 790 calls** — nobody is tagging calls as good-lead/not-a-lead. That's a free qualification layer sitting unused; turning it on would make this number exact instead of inferred from phone matching.

---

## 3. Quick Fix vs Total Mole Control — 58/42 by count, 26/74 by annual value

**By job booked (355 jobs, May–July, 25 unclassified excluded):**

| Product | Jobs | Share |
|---|---|---|
| Quick Fix | 193 | **58.5%** |
| Total Mole Control | 137 | **41.5%** |

Identical among phone-sourced bookings specifically (58.4% / 41.6%), so the phone lane isn't skewed either way versus the business overall.

**Monthly:** May 64.4% QF → June 53.0% → July 60.3%. Noisy, no real trend.

**The count split is misleading on value:**

| | Quick Fix | Total Mole Control |
|---|---|---|
| Jobs booked (3 mo) | 193 | 137 |
| Value booked | $81,705 one-time | $19,295/month |
| Annualized | $81,705 | **$231,540** |
| Avg per sale | $423 | $141/month |
| **Share of annualized value** | **26.1%** | **73.9%** |
| Share of first-90-days cash | 58.5% | 41.5% |

So: **Quick Fix is the majority of jobs and the majority of near-term cash, but Total Mole Control is three quarters of the value you're actually building.** Every point of mix you move from QF to TMC is worth roughly 4x on an annualized basis.

Note the TMC close rate (62.3%) is the weakest number in this report, and it's on the product carrying 74% of the value.

---

## Data-quality note

Quotes and jobs name the same two products differently — the Quick Fix appears as "The Quick Fix" on jobs but as **"1 Month of Mole Control Service"** on 302 quotes. A naive keyword match drops 29% of quotes into an "unclassified" bucket, or worse, files them as program work. The scripts here handle both namings (0 unclassified). Anything else reporting on product mix from quote line items should be checked for this.

---

## What I'd do with this

1. **Archive dead quotes on a cadence.** 114 open quotes across 12 months, 89 of them from the last 3 months. Without this the close-rate KPI silently drifts upward.
2. **Protect the July quoting behaviour.** The doubling in booking rate came from writing quotes on more calls, not from closing harder. Whatever changed in July (training, VA intake) is the highest-leverage thing in the funnel — 543 new-lead calls a quarter with a 69% close rate means every 10 points of quote-issue rate is worth ~37 extra jobs a quarter.
3. **Fix the TMC close rate.** 62.3% on the product carrying 74% of annualized value; the Quick Fix closes at 74.6%.
4. **Turn on CallRail lead tagging** and finish the tracker swap so ads stop bypassing CallRail — then this whole report becomes measured rather than inferred.
