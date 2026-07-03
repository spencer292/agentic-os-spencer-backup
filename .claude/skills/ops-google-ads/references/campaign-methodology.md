# Campaign Methodology

Reusable architecture and operating lessons distilled from a live local-service account.
Generic here; the worked example (`got-moles-worked-example.md`) shows it concretely.

## Tiered architecture

- **T1 — Buyer Intent / City-Exact.** The money tier. Per-city ad groups, each with EXACT + PHRASE
  variants of the core service terms. Highest budget, manual CPC to start. Message-matched RSAs per city.
  Add a geo-neutral **"Buyer Intent — Generic"** ad group for geo-less money terms
  (`professional {service}`, `{service} company`, `{service} near me`) pointing at a generic service LP.
- **Brand.** Cheap defensive tier capturing your own name. Watch for a loose brand catch-all keyword
  pulling in competitor/navigational junk — tighten it; don't feed it budget.
- **T2 / T3 (DIY / informational).** Often low-value for direct-response local service. Be willing to
  kill them permanently rather than nurse them.

## Geo-targeting

- Resolve geo target constants once via the API (geoTargetConstants) and cache to JSON; reference by
  resourceName when building. Target by presence, not interest, for local service.
- **Greenfield geography is usually the real new-impression pool** once you own your home metro. Identify
  untapped adjacent counties/cities and expand the surface before raising budgets.

## Budget & bidding

- Start **Manual CPC**; it gives clean CTR/keyword history while volume is thin.
- **Smart Bidding is the structural unlock but is gated** — needs ~30 conversions in the trailing window
  before it has signal. Don't switch early.
- On finite local volume, **Manual CPC will never fully spend a large daily budget** — that's expected,
  not a failure. See the volume-starved diagnosis below.

## Diagnosis: volume-starved vs budget-starved (do this before spending more)

Pull impression share and where it's lost:
- **Lost IS (budget)** high → budget-starved → more budget helps.
- **Lost IS (budget) ~0%, high IS already, lost IS (rank) the remainder** → **volume-starved** → more
  budget/bids will NOT help. The only lever is **expanding the surface** (keywords + geography).

## Quality Score — read before "fixing ads"

- QS has three components: **Expected CTR, Ad Relevance, Landing-page experience.** Pull all three; fix
  the one that's actually below average.
- **Ad Strength ≠ Expected CTR.** Ad Strength is advisory and does not set rank; pinning headlines for
  message-match deliberately lowers Ad Strength. Do **not** rewrite well-built pinned RSAs to chase a
  "POOR" Ad Strength label.
- Low-volume EXACT keywords sit below-average on Expected CTR until they accumulate click history — the
  lever is **time + targeting hygiene** (cut low-intent/out-of-area impressions that never get clicked),
  not ad/LP rebuilds.
- **Check feature eligibility by account age before recommending it** — e.g. image assets need ~60 days
  of account history. Recommending an ineligible feature wastes a cycle.

## Conversion plumbing

- Define the **primary conversion** deliberately (for service businesses it's usually the **phone call**,
  via a call-tracking provider → GA4 → Ads import). Form fills are secondary.
- The revenue-truth conversion (offline/booked-job via OCI) is the eventual target; build the GCLID chain
  toward it. `include_in_conversions_metric:false` means *secondary*, not *untracked* — don't infer a
  tracking break from one flag.

## Hard operating rules (these bite)

1. **Conversions before budget.** Never change daily budgets mid-month to chase spend — it resets
   monthly-cap math and can 2× overdeliver.
2. **Don't trust Keyword Planner zeros.** Real demand can be several × the Planner-visible volume.
3. **Always `validateOnly` a mutate first**, show the dry-run, then write.
4. **Bump `API_VERSION`** the moment a version sunset is announced (monthly cadence).
