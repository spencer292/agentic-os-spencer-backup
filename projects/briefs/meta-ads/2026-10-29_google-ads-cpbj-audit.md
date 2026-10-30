# Google Ads: Cost per Booked Job Audit, 2026-10-29

Read-only, via the Google Ads UI (account 166-576-1172; the API still returns 401) plus CallRail
matched to Jobber. Window: **May 1 – Oct 28, 2026**.

One near miss: a click meant for the date picker's Apply opened the "Turn on AI Max"
recommendation dialog. It was cancelled before applying. The change history shows no changes and
the recommendation is still pending, so nothing in the account changed.

## Answer

**The ~$63 is Google's cost per conversion, not per booked job.** A conversion is a lead form, a
phone-call lead, or "Other". Matched to Jobber, Google's real cost per booked job is about
**$180–220**.

| | Value | Tag |
|---|---|---|
| Spend, May 1 – Oct 28 | **$27,169.93** | KNOWN (Google Ads UI) |
| Google "conversions" | 452, at **$60.11** each | KNOWN |
| Booked jobs from Google Ads calls, new customers | 123 | KNOWN (CallRail → Jobber, `2026-10-29_google-ads-bookings.md`) |
| Booked jobs from Google Ads calls, existing customers | 28 | KNOWN |
| **Cost per booked job, new customers** | **$221** | KNOWN numerator; denominator is calls only |
| Cost per booked job, all bookings | $180 | same |
| Conversion → booked job | ~33% (151 / 452) | ESTIMATE |
| Mix of booked jobs | 96 Quick Fix / 53 TMCP / 2 other | KNOWN |

Reasons the true figure is probably slightly lower:
- Bookings from Google Ads *web forms* aren't matched yet. Only calls are.
- October bookings are still maturing.

Reasons it's flattered:
- The Brand campaign ($2,072, 110 conversions at $18.84) mostly reaches people already searching
  for Got Moles.
- Non-brand spend is $25,098, so non-brand CPBJ is a little higher than the blended figure.

## Campaigns, May 1 – Oct 28

| Campaign | Budget | Status | Bidding | Spend | Conv. | Cost/conv. |
|---|---|---|---|---|---|---|
| T1 v2 — City Exact | $150/day | Eligible (limited): **limited by budget; call asset disapproved** | Target CPA | $23,200.89 | 334.0 | $69.46 |
| Brand | $30/day | Eligible (limited): limited by bid strategy | Manual CPC | $2,071.85 | 110.0 | $18.84 |
| T1 - Buyer Intent | $150/day | Paused | Manual CPC | $1,777.93 | 6.6 | $270.45 |
| T2 - Problem Aware | $15/day | Paused | Manual CPC | $73.33 | 0.5 | $146.65 |
| T3 - Solution Research | $10/day | Paused | Manual CPC | $45.93 | 0.9 | $49.60 |
| **Account** | $180/day | | | **$27,169.93** | **452** | **$60.11** |

Last 7 days (Oct 22–28): $1,012, 13 conversions, $77.86 each, average CPC $12.05.

## Findings

1. **The call asset on T1 v2 is disapproved.** The main campaign's ads aren't showing the phone
   number, on a phone-first business. Fixing it is likely worth more than any budget change. Next
   step: open the asset and read the disapproval reason. A fix is a write and needs Spencer's OK.
2. **T1 v2 is limited by budget** at $150/day. Google says more budget would bring more
   conversions. At ~$221 per booked job that's still well inside the value of a customer (~$690
   contribution ESTIMATE). It needs a capacity check (techs) before any increase, and nothing
   until spring given the season.
3. **"Phone call lead" needs attention** in Goals. Something is wrong with how calls are counted
   as conversions. Target CPA bidding optimizes on this signal, so a broken call conversion
   misleads the bidder.
4. **Conversions are leads, so Target CPA is bidding toward leads.** The account would bid better
   on booked jobs. That means sending Jobber bookings back to Google as offline conversions, and
   it pairs with the F-01 attribution fix.
5. The API connection (401) is still broken, so all of this was read off the UI. Reconnecting it
   makes this a scripted monthly check.

## Consequence for Meta

The Meta proposal's **$200 target / $300 ceiling** was close to Google's real cost (~$180–220).
Hold Meta to **Google parity: target ≤ $220 per booked job**, ceiling $300, measured the same way
(CallRail tracker → Jobber).

## Follow-up: call asset and call goal (same day)

- **Call asset:** the account's only call asset is **(253) 331-2772** (CallRail tracker), account-level, **"Not eligible: Disapproved (Unverified phone number)"**, added 2026-07-23, 0 impressions. Since then no ad has shown a call button. Fix: verify the number (on the landing page, or a code by call/SMS to 331-2772, which forwards to the main line).
- **Call conversions** (Goals → Conversions):
  - "First Time Phone Call" (CallRail import, Primary, in the account goal): Needs attention
  - "Repeat Phone Call" (CallRail import, Secondary): Needs attention
  - "Text Message": Misconfigured
  - "Phone call leads" (calls from ads): Active, but starved without a call asset
  - The imports still log conversions (5 and 4 last week). The UI wouldn't surface the exact reason, so it's for Roy / CallRail to check the integration.
- **Sitelinks:** "Pricing & Guarantee" and "FAQ" on the paused T1 - Buyer Intent campaign are Eligible (Limited), Policy (Legal requirements). Low priority.
- **Email to Roy:** sent by Spencer 2026-10-29. Waiting on Roy to verify the call number and check the CallRail import.
