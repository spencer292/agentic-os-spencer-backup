# Got Moles Meta Operating Rules

Where the course and Got Moles disagree, this file wins. The course (The Meta Ads Arena, Dan
Edmund) is written for e-commerce, lead-gen and coaching accounts with daily budgets of 2–3x CPA.
Got Moles is a local, phone-first service with a small, finite service area, seasonal demand and a
conversion (a booked job) that happens offline, days after the click. Every rule below exists
because a course rule breaks on one of those facts.

Numbers tagged `ESTIMATE` are working rules set at build time (2026-10-29), not course rules and not
measured. Replace them with Got Moles' own baselines once 60 days of data exist.

---

## 1. The outcome and the two clocks

- **The outcome is a booked job in Jobber.** Not a lead, not a click, not Meta's "Results" column.
  Every recommendation reports cost per booked job (CPBJ), payback and mix effect, per `mkt-cmo`.
- **Meta cannot see a booked job yet.** Until booked jobs are sent back to Meta (offline
  conversions / CAPI, a brief for Roy), Meta optimizes on an upstream event and the booked-job
  number is reconciled by hand from Jobber and CallRail.
- **Clock 1, raw lead (protects budget this week).** Optimization event = website lead (form
  submit). Phone calls from the landing page count as leads when CallRail tracks them; tag them
  `KNOWN` only if the CallRail source says Meta.
- **Clock 2, booked-job cohort (decides what works).** Weekly, look at leads that came in 7–14 days
  ago, by ad and angle: contacted, quoted, booked. That is what kills or keeps an *angle*. Clock 1
  only kills an *execution*. Judge the cohort only once its quote/booking dates have passed, and
  at the ad-set level: ads in a set assist each other [Q&A].
- **Fire the Lead event only on qualified leads** (in the service area, residential under 5 acres or
  a real commercial inquiry), so Meta learns the profile that books [Q&A]. Form questions on
  property type and acreage make this possible; brief Roy for the conditional event.

### Deriving the raw-lead target from CPBJ

Course method [course-d §4.1], applied:

```
target CPL = target CPBJ x (lead -> booked rate)
```

The lead→booked rate for Meta leads is `UNKNOWN` until the first cohort matures. Until then use the
blended rate from CallRail→Jobber for all non-search leads and say it is a proxy. Write target CPBJ,
ceiling CPBJ and the resulting target CPL into the campaign brief before any spend. Spencer sets
target CPBJ (or acc-cfo derives it from the customer value model).

## 2. Kill / hold / scale at a local budget

The course's thresholds are kept; the event they run on changes.

| Course rule | Got Moles version |
|---|---|
| Zero results: observe <1x, diagnose 1.5x, pause the ad at 3x target CPA | Same lines, on **target CPL** (clock 1). Pause the *ad*, never the angle, on clock 1 alone. |
| 3+ results → keep / hold / gray / pause at 1x / 1.3x / 1.5x | Same, on CPL per ad. For the *angle*, apply the same bands to CPBJ from the cohort once it has 3+ booked jobs. Fewer than 3 booked jobs = observation only, say so. |
| 50 events / 7 days to exit learning | Unreachable on booked jobs and probably on leads too. Accept "learning limited" on test ad sets. Do not restructure to chase it. |
| Test budget 2–3x CPA per day | Not affordable. Size each test so every ad set can spend **at least 2x target CPL, ideally 3x**, before judging. Default $10/day per ad set for ~5 days only reaches 3x if target CPL is under ~$17; above that, run longer, never judge earlier. At most 3 ad sets [course-c §15]. Judge tests on clock 1, angles on clock 2. Never kill before 3x target CPL with no lead [Q&A]. |
| Vertical scaling 10% / 48h (20% / 24h mature) | 10% steps, minimum $5 a step, every 72h (`ESTIMATE`). Only when the scaling gate in §3 passes. A working ad that gets expensive is **stepped down**, not paused [Q&A]. |
| No numeric fatigue rule | Frequency alone is not a trigger [Q&A]. Refresh (new concept, not an edit) when CPL **and** frequency rise together over the week. Judge weekly, not daily: Meta flexes daily spend. Small geo saturates fast; watch it. |

## 3. The scaling gate (all must pass)

1. The scaling ad set meets target CPBJ on a matured cohort with 3+ booked jobs.
2. **Crew capacity.** Next two weeks of routes are not already full. Check the route board before
   proposing a budget increase. Leads the crews cannot service are a loss, not a win.
3. Speed to lead is healthy (calls answered, forms returned same day).
4. Nothing else changed in the last 72 hours.
5. Spencer approves the new daily budget.

## 4. Seasonality

Mole activity and demand peak spring and fall and drop in summer dry spells and hard freezes.
- Compare like season to like season, never October against July.
- Raise budget into the season, not after leads arrive: plan increases ~2 weeks before the
  historical spring/fall rise (use Jobber new-client counts by week as the baseline).
- In the off-season run retargeting and the existing-customer program (referrals, reviews) only.

## 5. Geography and audience

- Locations = the zips Got Moles actually services: Jobber property zips from the last 12 months,
  cross-checked against `projects/briefs/technician-route-automation/territories.json` (that file
  is not the as-built map, so live Jobber data wins). Target "people living in" the area. Never a state or country default. Advantage+ audience **OFF** via
  "Further limit the reach of your ads"; the include-people-outside setting unchecked
  [course-c §6]. Verify the field names on screen; Meta renames them.
- No interest targeting. Broad inside the service area; the creative does the targeting.
- **One ad set covers the whole service area.** Split ad sets by angle, never by city or zip:
  small pools never leave learning [Q&A]. For commercial or 5+ acre offers, a household-income
  top-25% layer is worth one test, after checking the audience size isn't too narrow.
- **Exclude active customers** (TMCP subscribers, open Quick Fix series) from every acquisition
  campaign. Customer lists are uploaded hashed and never enter the repo (same rule as
  `cfo-private/`).
- Age minimum 25 (`ESTIMATE`, homeowner service).

## 6. Calls

The course never covers calls. Got Moles is phone-first.

- **Every Meta ad that shows or dials a phone number uses the CallRail "Facebook" tracker,
  (253) 528-8152** (source: facebook_all, rings the main line). Never (253) 321-1024: that's the
  untracked main number, and DigiHammer's call ads used it, which made their calls impossible to
  attribute (audit 2026-10-29). Check with
  `node projects/briefs/meta-ads/scripts/callrail-meta-trackers.mjs`.

Until a better route is proven:
- Destination = a landing page with click-to-call and a short form, not an instant form, not a
  Calls objective. CallRail dynamic number insertion on the page gives Meta-sourced calls a source.
- Test an instant form (higher-intent version, qualifying questions on acreage and property type)
  only as a separate, labelled test once the website path has a baseline.
- Do not run the Calls objective until call tracking can attribute calls to an ad.

## 7. Offer and claims

- Residential is phone-priced (Quick Fix tiers, TMCP monthly). Commercial and 5+ acres are
  in-person bids routed to Cory. One campaign = one offer. Never mix bid-only and priced offers
  in one funnel.
- Every word and every picture passes `mkt-cmo/references/claims-gate.md` and, for AI creative,
  `mkt-ai-video-ads/references/ai-ad-gate.md`. Posture A covers images too: no traps, no dead
  moles, no mechanism.
- "Mole" is a skin-mole homograph. Every creative must read as lawn and yard in the first second.
- No fake customers, no invented testimonials, no AI person speaking as a customer. Dan's
  "make a fake review ad" tactic is banned here.
- Lead with "chemical-free and safe mole control", not "trapping".

## 8. Account safety (before anything else)

Run course-a's Vault 1 checklist on the ad account before the first campaign: Business Manager
owned by Got Moles (not DigiHammer), 2FA required for everyone, domain verified, two admins,
payment method current. A restricted ad account is the costliest failure in this lane. If one
happens, follow course-a's appeal ladder exactly; resubmit an appeal once only.

## 9. Change control

One change at a time. Every change is logged in
`projects/briefs/meta-ads/change-log.md`: date, campaign / ad set / ad, change, why, the review
condition. The course's rule [course-a, change control] and the reason the old agency account
drifted unnoticed.
