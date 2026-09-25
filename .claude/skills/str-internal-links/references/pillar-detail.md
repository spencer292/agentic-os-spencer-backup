# Pillar Detail: checks, evidence and score bands

Reference for `str-internal-links` Steps 3 to 9. Every claim carries its confidence label. Full sourcing is in `research-data.md`.

---

## Orphan pages (15%)

**Check for:**
- Pages with zero inbound internal links, from the crawl's `internal_links_count`, cross-checked against the edge list.
- Pages reached only through navigation or footer links, which are functional orphans with no contextual body link. Use the edge `type` field plus the provenance reconciliation.
- Pages present in the sitemap but absent from the crawl's discovered set, meaning crawlable but not reachable through the link graph.
- Redirect targets with no direct links, reached only through a redirect.
- Pages in the non-indexable set that still receive inbound internal links, which is equity pointed at a page that cannot be cited.

**Score:** zero orphans scores 10. An orphan ratio above 20% scores 0 to 3.

**Do not model traffic impact.** Report counts and named URLs. The orphan crawl-budget, traffic-share and recovery percentages that used to justify this pillar were vendor blog claims with no methodology and are retired.

---

## Link depth (10%)

**Measure:** click depth for every page, priority pages deeper than two clicks, any page deeper than three, the average, and the full distribution.

**Benchmarks:** strategic and conversion pages within two clicks, all important pages within three, resource and archive content within four.

**Score:** every priority page within two clicks scores 10. Priority pages at four or more score 0 to 3.

Take click depth from the crawl rather than re-deriving it. Compute a breadth-first search yourself only in degraded mode.

---

## Anchor text (20%)

**Analyse per destination page:**
- Total unique anchor texts pointing to it, from the edge list's text field.
- Distribution by type: branded, exact match, partial match, descriptive, generic, bare URL.
- Over-optimisation: more than 80% exact match to any single page. **[U]** a conservative sanity ceiling, not a publishable fact.
- Identical-pattern repetition: the same exact anchor used more than five times sitewide. Repetition without diversity reads as an anchor-spam pattern and dilutes the signal.
- Wasted anchors: "click here", "read more", "learn more".
- Anchor and destination misalignment: anchor text with no relevance to the destination topic.

**The four principles, in place of a distribution target:**

1. **A meaningful share of inbound anchors carries the brand.** **[S]** Ahrefs, 75,000 brands: branded anchors correlate 0.511 to 0.628 with AI brand visibility, above Domain Rating and roughly twice as strongly as backlinks. Near-zero branded anchors sitewide is a finding.
2. **Every anchor is distinct enough to describe its own destination.** Diversity is the property being scored, not conformance to a ratio.
3. **Exact-match anchors are reserved for priority destinations and never dominate one page.** **[S]** Zyppy, 23 million internal links across 1,800 sites cross-referenced with Search Console, 2024: pages with at least one exact-match anchor drew materially more organic traffic. That study predates AI Mode and is a classic-organic correlation. It justifies having exact-match anchors, not a percentage.
4. **Generic anchors are a defect, not a quota.** "Learn more" pointing at a money page is a fix whatever any distribution says.

**Anchor length** of two to five words is a working convention, explicitly not an evidenced threshold.

**The disambiguation guard, blocking.** Where the brand name or a category term collides with a more common other meaning, an unqualified anchor collapses to that other sense.
- Every anchor pointing at a page targeting an ambiguous head term carries a disambiguating signal, drawn from the token set in the anchor rules of `target-keywords.md`. Signals are typically a qualifying adjective, a geography, the brand name, or a service word.
- The bare ambiguous term is forbidden as anchor text. Always qualify it.
- Anchors drawn from the queries-to-avoid clusters are forbidden.
- Where the workspace defines category language rules, such as terms that must never appear in public-facing copy, those apply to anchor text as well.

Flag every anchor that fails the guard, and include the disambiguating signal in every rewrite recommendation.

**Score:** varied anchors with the brand present, exact-match used deliberately and the guard passing scores 10. Mostly generic anchors, one anchor repeated sitewide, over-optimisation to a single page, or any guard failure scores 0 to 3. **A guard failure caps the pillar at 5 regardless of the rest.**

---

## Cluster and fan-out coverage (25%)

### Topology from the sub-query set

For each cluster in `target-keywords.md`, take the pillar page's `fan_out_subqueries` and verify:

- **A page or an on-page section answers each sub-query.** Where none exists, that is a content gap rather than a link gap. Record it and hand it to the content skill.
- **Every sub-answer is reachable in one hop from the page that ranks.** This is the load-bearing rule. If the cost page ranks for the head term and the seasonality answer is two hops away, the cluster does not cover the fan-out.
- **The pillar links out to every sub-answer, and every sub-answer links back.**
- **Sibling sub-answers cross-link where the sub-queries are genuinely adjacent.** Adjacency means the sub-queries co-occur in a fan-out, not that the pages share a folder.
- **No cross-cluster pollution**, meaning a spoke linking to an unrelated pillar.

A cluster of a cost page, a method page, a timing page and a prevention page linked to each other covers a fan-out set. A ring of near-identical location pages linked to each other covers nothing.

### Location and variant pages link up and out

**[P/U] Cap sideways linking between templated pages.** Google's spam policies still name pages targeted at different cities that funnel visitors to the same destination as doorway abuse, and scaled-content abuse applies equally to machine and human writing. **[U, practitioner consensus]** the 2026 failure mode is not a manual action but quiet suppression, filtering or grouping so only one page shows, and **it does not announce itself in Search Console.** A ring of mutual links is the exact shape that pattern-matches to a doorway network.

The rule for a templated location or variant page:
- **Up** to its pillar and the relevant informational hubs. Required.
- **Out** to genuinely specific proof: real work done there, named sub-areas, local conditions, page-specific reviews. Required, and this is also the doorway defence. **[S]** Whitespark's top local organic factor is dedicated service pages with real per-page substance.
- **Sideways** to sibling pages: capped, and only where the link serves a reader. A small named module of genuinely adjacent places is acceptable. A large footer block or a full mesh is not.
- Never a blanket template-level link block. Per-page topical mapping only.

**Superseded.** A SearchPilot A/B test reporting a 7% organic uplift from cross-linking the six nearest locations is real and is kept in `research-data.md` as historical evidence. It measured classic organic on a different site type and predates the doorway-enforcement shift. **Where it and the doorway gate conflict, the doorway gate wins.** Do not cite it to expand sideways linking, and treat an existing dense mesh as a finding to reduce.

### Tier structure

Validate the graph against the hub-and-spoke topology in `target-keywords.md` rather than inventing one.

- **Tier 1, authority pages:** the homepage, service or product pages, and key cornerstone explainers. Linked from every Tier 2 hub and a relevant subset of Tier 3.
- **Tier 2, supporting hubs:** reviews, service areas, resource indexes, author pages. Each links up to relevant Tier 1 and down to its Tier 3 spokes.
- **Tier 3, spokes:** location or variant pages and posts. Each links up to its cluster pillar and the relevant Tier 2 hub. Post spokes also link to siblings serving adjacent sub-queries. Location and variant pages follow the cap above rather than the sibling rule.

Flag any Tier 1 page not linked from every Tier 2 hub, and any Tier 3 page missing its up-link.

### The entity anchor

**[U]** on the tactic, **[P]** on the mechanism. Entity linking resolves an ambiguous term against a training distribution the site does not control, so the site supplies the context itself. One canonical disambiguation page carries the definition: what the thing is, what it is not, and how to tell the difference.

- Every page mentioning the ambiguous term links to that page at least once with a disambiguated anchor.
- The disambiguation page is Tier 1 and within two clicks of the homepage.
- Where no such page exists, that is a P1 content finding handed to the content skill. The link rule cannot be satisfied without it.
- Flag any page mentioning the term with no path to the entity anchor.

**Score:** sub-answers all reachable in one hop, tier structure intact, variant pages linking up and out rather than sideways, and the entity anchor reachable from every page that needs it scores 10. Missing pillars, sub-queries with no reachable answer, a variant-page mesh, or no entity anchor scores 0 to 3.

---

## Link equity flow (5%)

**Analyse:**
- Pages with the most inbound internal links, the authority concentrators.
- Pages with the fewest inbound links relative to their strategic importance, the equity-starved.
- Total outbound links per page as a dilution check, ceiling 150.
- The contextual-versus-template link ratio per page. Strategic pages should be majority contextual.
- Nofollow internal links, which should be zero outside login and cart flows, because equity dissipates rather than redistributing.
- Redirect chains that internal links pass through. Always link to the final destination.
- Broken internal links, from the crawl's own broken flag. Report the measured count.

**No word-count benchmark.** Judge density by fan-out coverage: does this page link to every sub-answer a reader or a fan-out would need next. Keep the 150 ceiling as a sanity cap, and note **[S]** Zyppy's finding that organic clicks peaked around 40 to 50 internal links per page as classic-organic context rather than a target.

**Score:** 0 to 10 on how well equity distribution matches strategic priority.

---

## Cross-linking gaps (25%)

**The routing rule.** **[S]** SERP shape differs by intent: explicitly transactional local queries fire the local pack around 93% of the time, informational queries fire AI Overviews around 92%, hybrid queries around 97%. Informational pages are the ones AI Overviews cite. Transactional pages are the ones that convert. Read the `surface` column per page and check the routing explicitly.

| From | To | Why |
|------|----|-----|
| Informational posts | Service or product pages | The routing rule. The cited page passes the reader to the converting page |
| Informational posts | The location page for a place the post actually names | Local relevance, only where the post genuinely references it |
| Any page mentioning the ambiguous term | The canonical disambiguation page | The entity anchor |
| Pillar page | Every fan-out sub-answer in its cluster | One-hop reachability |
| Sub-answer | Its pillar, and genuinely adjacent siblings | Cluster closure |
| Service pages | Related service pages | Cross-sell and topical authority |
| Location or variant pages | The services available there, and specific local proof | Up and out |
| Reviews and testimonials | The service or location pages they reference | Social proof at the point of decision |
| Case studies | Service and location pages | Proof supporting money pages |
| Q&A sections | The page answering the question in full | Contextual relevance. The Q&A shape is retained; FAQPage schema is not a deliverable |
| Location or variant pages | Sibling location or variant pages | **Capped, not a gap to close.** A dense mesh is a finding to reduce |

**Generate specific recommendations.** Name the source page, the destination page, the suggested anchor text and the place in the content it belongs. Every recommendation names the fan-out sub-query or the surface-routing rule it serves.

**Score:** all natural cross-links present and informational-to-transactional routing intact scores 10. Major gaps in that routing, or sub-answers with no inbound link from their pillar, scores 0 to 3.
