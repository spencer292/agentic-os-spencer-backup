# Seed Keywords — Got Moles

**This file is not the seed list.** The seed list is derived from `brand_context/target-keywords.md` at the start of every run — see SKILL.md Step 2. This file holds the derivation rule, the homograph gate, the ICP phrasing bank, and a **dated fallback list** for the case where the foundation doc cannot be read.

Why: a hand-copied seed list was authored here on 2026-07-02 from the then-current clusters. It froze. Cluster changes in `target-keywords.md` stopped propagating and nothing detected the drift. Deriving every run removes that failure mode entirely.

---

## Derivation rule (the actual method)

Per cluster in `brand_context/target-keywords.md` — `mole-control`, `biology`, `safety`, `cost-value`, `seasonal`, `diy-vs-pro`, `location-services` — take:

1. **3–5 informational or hybrid-intent entries** from the cluster's `### Queries` table, highest priority first. At most one transactional head term per cluster, as a control; transactional local intent fires the Local Pack and produces thin People Also Ask data.
2. **Every entry from the cluster's `### Coverage gaps`.** A recorded gap is exactly where fan-out discovery pays.
3. **The cluster's pillar primary keyword** from `## Pillar designation per cluster`, so each fan-out set has a page to attach to.

`location-services` is conditional: seed geo-modified queries only when the run's purpose is city-page fan-out coverage, and then use two or three Tier A cities from `### Priority cities`, never the full 93.

Cap a full harvest at roughly 20–30 seeds and cut to fit the spend guard in SKILL.md before starting.

If `target-keywords.md` gains, loses or renames a cluster, the new set wins with no reconciliation against this file.

---

## Homograph gate (blocking, applies to every seed)

Every seed must carry a disambiguating token **in the seed string itself**: `lawn`, `yard`, `turf`, `ground`, `burrow`, `tunnel`, `molehill`, `trapping`, `pest`, `Scapanus`, or a Washington place name.

The one exception is a deliberate **ambiguity probe** — a bare term such as `mole removal` or `mole removal cost`, run specifically to observe which sense Google resolves to. A probe must be labeled as such, and its results go to the Homograph Rejects section of the report, never to the content queue.

Never seed skin-mole, chemistry, culinary or espionage queries. Cross-check every seed against the `### Queries to AVOID` list in `brand_context/target-keywords.md` and against the medical-cluster negatives the ads side maintains at `.claude/skills/ops-got-moles-ads/scripts/_got-moles-existing-negatives.json` (read only — that file belongs to `ops-got-moles-ads`).

If a harvested question turns out to be dermatological, it is dropped at Step 3.5 and recorded as a reject with the sense it resolved to. Do not answer it, and do not quietly delete it — the reject list is evidence for the disambiguation work.

---

## Fallback seed list (dated 2026-07-02 — NOT current, use only if `target-keywords.md` is unreadable)

Derived by hand from the clusters as they stood on 2026-07-02. It is retained so a harvest can still run when the foundation doc is missing, and for nothing else. A report produced from these seeds must say on its face that it used the fallback list and is therefore not aligned to the current clusters.

The `★` marks a reduced set for a constrained run.

### Removal & control (→ cluster `mole-control`)
- ★ mole control
- ★ how to get rid of moles in yard
- get rid of moles in lawn without killing them
- mole trapping service washington

### Signs & damage (→ cluster `biology`)
- ★ signs of moles in yard
- ★ mole hills in lawn
- mole damage to lawn
- mole tunnels in yard

### DIY vs professional (→ cluster `diy-vs-pro`)
- ★ do mole repellents work in the yard
- ★ how to trap a mole in your lawn
- best way to get rid of moles in the yard
- lawn mole poison vs trapping

### Cost & value (→ cluster `cost-value`)
- ★ mole control cost washington
- lawn mole removal cost
- professional mole trapping cost

### Safety (→ cluster `safety`)
- ★ mole poison safe for dogs
- ★ pet safe mole control
- are mole traps safe for pets
- chemical free mole control for lawns

### Prevention & seasonal (→ cluster `seasonal`)
- ★ how to prevent moles in yard
- when are moles most active in the lawn
- yard moles keep coming back

### Commercial (→ cluster `mole-control`, commercial intent)
- ★ commercial mole control
- mole control for HOA properties

Note the cluster mapping: the old seven service categories in this file are **not** the seven cluster ids. The arrows above map the legacy grouping onto the real ids. There is no `Commercial` cluster — commercial-intent seeds sit inside `mole-control`.

---

## ICP phrasing bank

How Western Washington homeowners actually phrase it, as distinct from industry terms: "something is digging up my yard", "lawn is getting destroyed", "dirt mounds everywhere", "is it a mole or a gopher", "will it hurt my dog", "guy who traps moles".

Real phrasing beats industry terms in question discovery, and it matters more now than it did: conversational phrasings show up in AI search volume where they barely register in typed-search tools. Refresh this bank each run from the `discussions_and_forums` data in the SerpAPI cross-check and from the highest-AI-volume conversational questions in the harvest.

Load `brand_context/icp.md` for the current audience definition rather than relying on names written into this file.

---

## Hypotheses to re-test (unverified, recorded 2026-07-02)

These were asserted in July 2026 as "first-mover GEO opportunities" with no measurement behind them. They are kept as **hypotheses to test with the AI Optimization API**, not as findings, and must never be presented to the client as fact:

- mole vs gopher vs vole damage identification
- are moles protected in Washington State
- do coffee grounds, ultrasonic spikes or Juicy Fruit gum work on lawn moles
- mole activity after rain

Testing them is cheap: run each through `ai_optimization/ai_keyword_data/keywords_search_volume/live` for AI search volume, and check `ai_overview` presence and its cited sources in the Pass A SERP result. Replace this section with the measured answer the first time a harvest covers them.
