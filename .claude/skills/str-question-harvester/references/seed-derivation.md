# Seed Derivation, the Disambiguation Gate and the Phrasing Bank

**This file is not the seed list.** The seed list is derived from `brand_context/target-keywords.md` at the start of every run. This file holds the derivation rule, the disambiguation gate, the ICP phrasing bank and the fallback protocol.

Why derivation rather than storage: a hand-copied seed list freezes. Cluster changes in the foundation document stop propagating and nothing detects the drift. Deriving every run removes that failure mode entirely.

---

## Derivation rule

For each cluster id in `brand_context/target-keywords.md`, take:

1. **3 to 5 informational or hybrid-intent entries** from the cluster's `### Queries` table, highest priority first. At most one transactional head term per cluster as a control, because transactional local intent fires the Local Pack and produces thin People Also Ask data.
2. **Every entry from the cluster's `### Coverage gaps`.** A recorded gap is exactly where fan-out discovery pays.
3. **The cluster's pillar primary keyword** from `## Pillar designation per cluster`, so each fan-out set has a page to attach to.

A location or service-area cluster is conditional. Seed geographically modified queries only when the run's purpose is location-page fan-out coverage, and then use two or three priority places from the foundation document, never the full list. Geographically modified People Also Ask is thin, and these seeds fire the Local Pack rather than AI Overviews, so tag them accordingly. A national or purely digital brand has no such cluster and skips this entirely.

Cap a full harvest at roughly 20 to 30 seeds and cut to fit the run's spend guard before starting.

**If `target-keywords.md` gains, loses or renames a cluster, the new set wins with no reconciliation against anything written here.**

---

## The disambiguation gate

**Run this gate only where the foundation document records a real collision** in its Brand-Disambiguation Strategy section. Where there is none, skip the gate and say so in the report. Do not invent a collision from the brand name alone.

Where a collision exists, every seed must carry a disambiguating token **in the seed string itself**, drawn from the token set the foundation document's Rule 1 defines. For example, a client selling mole control required a lawn, yard, turf, burrow, tunnel, trapping or pest token in every seed, because the skin-lesion sense of the same word dominates the training distribution.

The one exception is a deliberate **ambiguity probe**: a bare term run specifically to observe which sense Google resolves to. A probe must be labelled as one, and its results go to the Disambiguation Rejects section of the report, never to the content queue.

Cross-check every seed against the `### Queries to AVOID` list in `target-keywords.md`, and against the paid-search negative keyword list where the workspace maintains one. Read that list, never modify it, because it belongs to the paid-search skill. Anything on either list is dropped, not rephrased.

If a harvested question turns out to resolve to the wrong sense, it is dropped at Step 3.5 and recorded as a reject with the sense it resolved to. Do not answer it, and do not quietly delete it. The reject list is evidence for the disambiguation work in `str-onpage-audit` and for the paid-search negatives.

---

## Fallback protocol

Use a stored seed list only when `target-keywords.md` is unreadable. A report produced from fallback seeds **must say on its face** that it used them and is therefore not aligned to the current clusters.

To build a fallback for a workspace, write a dated list into a `SKILL.local.md` beside this skill, grouped by the cluster id each seed maps onto, with the date it was derived. Never store it in this file, which is shared across every brand in the install. A fallback list older than one refresh cycle is evidence, not a seed source.

---

## ICP phrasing bank

The audience's real phrasing beats industry terms in question discovery, and it matters more now than it used to. Conversational phrasings show up in AI search volume where they barely register in typed-search tools.

Load `brand_context/icp.md` for the current audience definition rather than relying on names or examples written into a skill file. Refresh the bank each run from the forum-discussion data in the optional second-provider pass and from the highest-AI-volume conversational questions in the harvest, and write the observed phrasings into the report's ICP Phrasing section.

What to capture: how the audience describes the problem before they know its name, what they call the practitioner who fixes it, the wrong words they use for the right thing, and the urgency register. A consumer audience and a professional buyer will phrase the same underlying job very differently, and the harvest should reflect whichever one `icp.md` names.

---

## Hypotheses, not findings

Where a previous run recorded an untested "first-mover opportunity" or a hunch about an uncovered topic, keep it as a **hypothesis to test**, never as an asserted finding, and never present it to a client as fact.

Testing is cheap. Run each candidate through the AI search volume pass, and check AI Overview presence and its cited sources in the Pass A SERP result. Replace the hypothesis with the measured answer the first time a harvest covers it.
