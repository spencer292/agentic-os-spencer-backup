# Keyword Research (Google Ads)

A repeatable multi-pass process using the Keyword Planner via the API
(`KeywordPlanIdeaService:generateKeywordIdeas`). Each pass surfaces a different slice; run them all,
then cluster.

## The passes

1. **Seed pass** — core service terms (`{service}`, `{service} cost`, `{service} company`,
   `professional {service}`, `{service} near me`).
2. **Geo-modified pass** — Keyword Planner needs explicit geo seeds to surface `"{term} {city}"`
   patterns. Seed with `{term} {top-metro}` for your priority cities (Planner caps ~20 seeds/request,
   so prioritise the most commercial metros).
3. **Symptom / problem pass** — how non-experts describe the problem before they know your category
   term (the language the ICP actually types).
4. **Competitor pass** — competitor brand/category terms (route these to NEGATIVES if you don't want to
   pay for out-of-brand intent; only bid if the economics work).
5. **Seasonal pass** — terms whose volume swings by season; plan budget/pacing around the curve.
6. **Cluster + funnel-tier** — group the harvested terms by intent into funnel tiers:
   - **Buyer-intent / money** (`professional {service}`, `{service} company`, `hire`, `near me`) → T1
   - **Mid** (`{service} cost`, `how much`, comparison) → mid tier
   - **Informational / DIY** (`how to`, `diy`, `home remedy`) → usually negatives or a low-value tier

## Match-type strategy

- Launch **EXACT** for the proven money terms (clean intent, best Quality Score signal).
- Add **PHRASE** to loosen reach once EXACT is established — but PHRASE head terms bleed into the wrong
  intent, so PHRASE **requires** a strong negative list (see `policy-compliance.md`).
- Avoid broad match until Smart Bidding + a mature negative list are in place.

## Output

Write the harvested corpus to JSON (`{term, avgMonthlySearches, competition, tier, matchType}`) so the
campaign builder and the negative-list builder both consume the same source of truth. Cache geo target
constants alongside it.

## Lesson

The corpus is usually far larger than what goes live — a 2,000+ keyword research corpus might deploy as a
few hundred. Keep the full corpus; it's the demand-sizing source for greenfield geo expansion later.
