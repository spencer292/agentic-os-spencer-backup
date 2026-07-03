# Worked Example — Got Moles (paid search)

The skill was refactored out of this live operation. Kept here as a concrete reference. The
**Got-Moles-specific** scripts, data, and full strategy wiki belong with the Got Moles **client**
workspace (being stood up separately) — this file is the bridge so nothing is lost.

## The account

- US (Washington State) mole-removal company. Account `1665761172` (USD, America/Los_Angeles) under
  **ATP MCC `2845309762`**, tag `AW-18098890649`. First spend 2026-05-05.
- **Primary conversion = phone call** (CallRail → GA4 `G-H8ZV2L217D` → Ads import). Form `generate_lead`
  secondary. Jobber booked-job OCI = the eventual revenue-truth conversion.

## Architecture as built

- **T1 v2 — City Exact** (`23876158925`, $150/day, Manual CPC): 24 city ad groups × (9 EXACT + 9 PHRASE)
  ≈ 432 keywords. Plus a **Buyer Intent — Generic** ad group (17 geo-less money terms → `/lp/mole-removal/`).
- **Brand** (`23819590031`, $30/day): defensive; budget-capped and inefficient — tighten, don't feed.
- T2/T3 (DIY corpus) killed permanently.

## The hard-won lessons (now generalised into the references)

- **Volume-starved, not budget-starved:** ~88% IS, ~0% lost to budget. More budget can't spend on finite
  local volume — expand surface (greenfield counties: Snohomish, Thurston, Kitsap) instead.
- **QS ~6.4, bottleneck is Expected CTR only** (Ad Relevance + LP experience both fine). RSAs are done
  (15 headlines/4 descriptions, maxed, pinned for message-match). "POOR Ad Strength" is a pinning artifact
  — **Ad Strength ≠ Expected CTR.** Lever is time + hygiene, not rebuilds.
- **Image assets ineligible until ~60-day account age** (~early July) — check eligibility before advising.
- **~120 medical/cosmetic negatives mandatory** (the "mole" homograph). Competitor leaks: `mole man`,
  `mole masters`, `mole patrol` via the loose `got moles wa` brand keyword.
- **Posture A** (no body-grip/scissor/harpoon/kill/lethal/poison). **No phone in RSA text.**
- **Conversions before budget** (a budget change caused a ~$600 overdelivery day).

## Where the originals live

- **Remote:** `agent-os-orig/main` (this repo has it fetched as remote `agent-os-orig`).
- **65 operational scripts + data** at `scripts/got-moles-*.mjs` and `scripts/_got-moles-*.json`
  (`_got-moles-ads-snapshot.json`, `_got-moles-existing-negatives.json` ~120 negs, `_got-moles-live-rsas.json`,
  `_got-moles-city-demand.json`).
- **Full strategy wiki:** `clients/got-moles/brain/wiki/paid-search-google-ads.md`.
- **Living doc:** `projects/briefs/got-moles-paid-search/LEARNINGS-INDEX.md` ("read first, update last").

When the Got Moles client is stood up, copy those operational scripts/data into that client's workspace
and point them at this skill's `scripts/lib/ads-client.mjs` engine (bump CID via `GOOGLE_ADS_CUSTOMER_ID`).
