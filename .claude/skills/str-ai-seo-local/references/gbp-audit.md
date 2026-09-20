# Google Business Profile Audit — Per Location

Got Moles has 3 GBPs (Seattle, Tacoma, Enumclaw). Run this checklist for each.

**Weights.** [S] Whitespark 2026 Local Search Ranking Factors, published 2025-11-06, 47 experts scoring 187 factors. Local Pack / Maps weights: **GBP signals ~32%, reviews ~20%, on-page ~15%, behavioral ~9%, links ~8%, citations ~6%, social ~5%.** Reviews and behavioral rose since the prior edition; citations declined as a Local Pack factor while rising as an AI-visibility factor. These weights sum to 100 and replace the older figures that summed past 120.

**Top five Local Pack factors**, in order: primary GBP category, proximity to searcher, keywords in the business title, physical address in the search city, business open at time of search. The last is newly prominent and is the cheapest fix on the list. Proximity is uncontrollable — report it as context, never as a fix.

Full sourcing: `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` §3.5 (install root).

**Before diagnosing a loss, verify live state.** [P] 2026 produced repeated GBP data bugs — reviews disappearing after reinstatement (2026-08-24), review replies not displaying (2026-07-22), a "no reviews yet" display bug (2026-07-09), widespread review disappearance (2026-07-03). A data bug is the first hypothesis for a missing review count, not the last.

## Scripted collection

Run from `clients/got-moles/`. Location codes: Seattle 1027744, Tacoma 1027773, Enumclaw 1027581. Country 2840, Washington state 21180.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs business_data/google/my_business_info/live \
  '{"keyword":"Got Moles Seattle","location_code":1027744,"language_code":"en"}'

node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs business_data/google/reviews/task_post \
  '{"keyword":"Got Moles Seattle","location_code":1027744,"language_code":"en","depth":100,"sort_by":"newest"}'
```

`my_business_info` returns category, hours, attributes, rating and review count. `reviews` returns individual reviews with dates, which makes review velocity and response rate computable rather than deferrable. `my_business_updates` covers post cadence and `questions_and_answers` covers the Q&A check where available on the account. Anything the API does not return still needs the dashboard — name it and route it per the no-silent-deferrals Rule rather than skipping it.

## Per-location scorecard (max 100)

| Section | Max | What "pass" looks like |
|---------|:-:|---|
| Primary category | 12 | "Pest Control Service" exactly. Top-five Local Pack factor and the single biggest unforced error |
| Hours, including special hours | 8 | Set, accurate, holiday hours present, and covering the hours homeowners actually search. Top-five Local Pack factor: a profile closed at 7pm loses the 7pm pack |
| Business name | 6 | Real legal name only. No keyword stuffing. [P] Since 2026-08-10 repeated bilingual names and transliterations are also disallowed |
| Secondary categories | 5 | Up to 9 used. Suggested: Mole Trapper, Wildlife Control Service, Lawn Care Service, Animal Trapper, Animal Removal Service. Don't dilute with unrelated |
| SAB configuration | 8 | Address hidden where customers are not received on site, explicit service-area city list, **no mail-drop address**. Account-risk check: any failure is P0 regardless of score |
| NAP consistency | 8 | Matches site footer, Yelp, BBB, Angi, Apple Business Connect, Bing Places, Facebook. Scored again in Step 8 for its AI blast radius |
| Service list | 5 | Each service has name, description and price posture. TMCP, One-Time Removal, Commercial |
| Photos — count | 4 | 30+ per location |
| Photos — types | 5 | Logo, cover, equipment and truck, team, before/after of mole work, service in progress |
| Photo freshness | 3 | At least one new photo recently. Stale libraries signal an inactive listing |
| Review count | 4 | Aggregate ≥219 five-star across the three profiles. Track per-location distribution |
| Review velocity | 8 | New reviews over the last 30/60/90 days, computed from the `reviews` endpoint. Velocity matters more than total |
| Review response rate | 7 | Every review answered, including five-stars |
| **Review-request policy compliance** | 7 | See the section below. A violation here is P0 and can strip reviews or trigger a manual action |
| Posts cadence | 4 | Regular Updates / Offers / Events |
| Q&A | 2 | Owner-answered, no orphans. [P] Weight lowered: Gemini-powered Ask Maps replaced the GBP Q&A surface from 2026-03-12 |
| Attributes | 2 | Veteran-Owned, licensed and insured, online appointments, on-site services |
| Messaging | 2 | On with response-time tracking, or explicitly off if not staffed. Half-on hurts more than off |
| Booking link | 2 | Routes to the intended destination per the funnel decision |
| Products | 2 | TMCP / One-Time / Commercial with pricing posture |
| Opening date | 1 | 2017 set |

## Review-request policy compliance (audit the actual wording)

[P] **2026-04-17.** Staff review quotas and asking customers to name an employee are explicit violations. The policy prohibits merchants requesting that staff solicit reviews containing specific content, including content identifying a staff member. Staff may invite an honest, open-ended review offered equally to every customer with no reward attached. A customer naming a technician spontaneously is fine; asking them to is a violation. [P] Gemini-powered pre-publication enforcement has been deployed since 2026-04-16.

[P] **2026-07-24.** Review-snippet structured data guidelines now name fake and undisclosed incentivized reviews. Reviews written for money, discounts, vouchers or free products without clear and prominent disclosure are violations, and they expose star-rating markup to a manual action that kills review rich-result eligibility while the page still ranks.

**What to actually check:** the live review-request wording Got Moles sends. Look in the n8n workflows (via `tool-n8n`) and any Jobber automation (via `tool-jobber`) for a review-request template or trigger, plus any printed leave-behind or text script. Name the workflow in the finding so the fix has an address. Flag P0 if any of them names a technician, sets a staff quota, or offers a reward. If no automation is found, say so explicitly rather than passing the check silently.

**Star rating is a filter, not a ranking factor.** [S] SOCi measured average ratings of AI-recommended locations at ChatGPT 4.3, Perplexity 4.1, Gemini 3.9. [S] BrightLocal, 1,002 US adults: 47% will not use a business with under 20 reviews and 31% will not use one rated below 4.5. The audit question is not "raise the rating" but "is the rating visible and consistent on every platform an engine reads."

## Per-location red flags

- Same photos across all 3 locations — Google detects it and downweights all 3
- NAP mismatch on any one citation — entity confusion propagates across all 3 and into the answer engines
- Phone number forwards to a single number but is listed differently — pick one display number per profile
- Service area lists the same cities in all 3 profiles — the profiles compete with each other for proximity weight
- Address visible on a profile where customers are not received on site — a suspension risk, not a ranking issue

## Cross-location coordination

3 profiles sharing 1 brand carry a Map Pack cannibalization risk. Mitigations:

- Distinct service-area city lists per profile (Seattle covers Eastside and city; Tacoma covers South Sound; Enumclaw covers Plateau and rural east)
- Distinct primary photos per location
- Each profile's "From the business" description focuses on that area's specifics
- One canonical service page per service on the site, with each city page linking to the closest profile

## Sources

- [S] Whitespark 2026 Local Search Ranking Factors — https://whitespark.ca/local-search-ranking-factors/
- [P] Google Business Profile Help, tips to improve local ranking — https://support.google.com/business/answer/7091?hl=en
- [P] Sterling Sky Google local changes log (review policy, GBP bugs, LSA changes) — https://www.sterlingsky.ca/google-local-changes/
- [P] Search Engine Land, undisclosed incentivized reviews (2026-07-24) — https://searchengineland.com/google-says-dont-include-fake-or-undisclosed-incentivized-reviews-in-review-snippet-structured-data-483456
- [S] BrightLocal Local Consumer Review Survey 2026 — https://www.brightlocal.com/research/lcrs-ai-trust/
- Everything else: `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` §3

## Retired claims

Removed 2026-09-02, do not reintroduce:

- "proximity ~55%, GBP signals 32%, reviews 16-20%, on-page 19%" — the components summed past 120% and the source was untraceable. Replaced with the Whitespark 2026 weights above.
- "Pro photos = +35% CTR per Semrush 2026" — no reachable primary. Photos still matter; the number does not.
- "Primary category is the #1 ranking signal in 2026" — replaced with the sourced Whitespark top-five ordering, in which primary category is first among five named factors.
- "Mole Masters has 356 reviews" — a point-in-time competitor count from April 2026, treated as a standing fact. Re-measure competitor review counts each run rather than quoting this.
