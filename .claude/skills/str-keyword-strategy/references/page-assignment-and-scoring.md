# Page Assignment, Cannibalisation Detection, and Priority Scoring

Worked examples are Got Moles. For another client, apply the method and substitute that client's pages and geography.

How target keywords get mapped to canonical pages, how cannibalisation gets detected, and how each keyword gets scored so the strategy is executable rather than aspirational.

## Page assignment rule

**Each keyword gets exactly one canonical page.** Not zero, not two.

When two pages target the same keyword, Google splits the signal and neither wins. When no page targets a keyword, the keyword is theoretical, not strategic.

### Assignment process

1. Read the keyword's primary intent (8 categories — see `intent-classification.md`).
2. Read its surface tag. **A Local Pack keyword is not assigned to a content page as its win condition** — assign the page that supports it, and record that the surface is won through Google Business Profile.
3. Match intent to the page shape that serves it (intent → content shape table in `intent-classification.md`).
4. Assign the best-fitting existing page, or flag `NEW: /proposed-path`.
5. Confirm the assignment against `ranked_keywords` — if a different URL already ranks for the keyword, that is the incumbent, and overriding it needs a reason.
6. Record the assignment in the cluster's query table.

### When intent is genuinely dual

Serve the primary intent with the page shape, and structure the secondary intent into a section within the same page. Never assign two pages to one keyword.

## Cannibalisation detection

**Cannibalisation = two or more pages on the site ranking for, or targeting, the same keyword and intent.**

### How to detect it, strongest evidence first

1. **DataForSEO Labs `ranked_keywords`.** Group the response by keyword. Any keyword returning two or more got-moles.com URLs is a confirmed pair, with both positions and both URLs. This is the primary detector.
2. **Google Search Console, query by page.** The same query producing impressions across multiple pages, especially where no page takes more than about 25% of them.
3. **Structural duplication.** Multiple URL variants for one city or topic (`/bellevue/`, `/bellevue-mole-removal`, `/bellevue-mole-extermination/`), or two pages carrying the same keyword in title, H1 and slug.

### How to describe the resolution

Three options, recorded as a **recommendation** in the detection table:

- **Consolidate** — merge the weaker page's substance into the stronger and 301 it.
- **Differentiate** — keep both, reassign one to a different keyword and intent, and verify the rank data supports the split.
- **Demote** — drop the weaker page from the sitemap and internal linking, keep it accessible, stop investing.

### Detection stops here

**This skill never executes a merge, a redirect or a deletion.** Execution — merge, 301, redirect-map update, sitemap update, thin-page cull — is owned by `str-onpage-audit` apply-fixes mode, which runs staged, evidence-gated changes one at a time. The site holds 635 #1 rankings and 93 templated city pages; a bulk cull run from a keyword document is how those are lost. Every detection table carries the hand-off line verbatim.

## Coverage gaps

Within each cluster, after assignment:

- List the intents the cluster serves and the fan-out axes around its head query.
- Mark which have a page and which do not.
- Gaps are the content plan.

Format:

```
cluster: diy-vs-pro
intents_in_cluster: [comparison, instruction, commercial, consequence]
fan_out_axes: [chemical-free methods, prevention, pricing, pets and children, DIY-vs-professional, seasonality]
coverage:
  - comparison: covered — /blog/diy-mole-removal-vs-professional/ (pillar)
  - instruction: covered — /blog/how-to-find-active-mole-tunnels/
  - commercial: covered — /services/one-time-mole-removal/
  - consequence: gap — recommend /blog/will-moles-go-away-on-their-own/
  - fan-out "pets and children": gap — safety cluster covers it, no link from this cluster
```

Coverage is measured against fan-out axes, not against a page count or a word count.

## Priority scoring

Each keyword scores on a 7-axis matrix. The first six are evidence; the seventh is business judgment.

| Axis | High | Medium | Low |
|---|---|---|---|
| **Intent fit** — does it represent the ICP buyer journey? | core ICP query | adjacent | tangential |
| **ICP match** — audience match | ICP exact | partial | mismatched |
| **Difficulty** — Labs `bulk_keyword_difficulty` | 0–30 | 31–60 | 61–100 |
| **Demand** — Google volume and AI volume together | material on either | modest on both | negligible on both |
| **Current position** — Labs `ranked_keywords` or GSC | already top 20 | 21–50 | 51+ or unranked |
| **Surface reachability** — can we act on the surface it fires? | AI Overviews or Classic, and we have or can build the page | multi, needs both plays | Local Pack only, and GBP work is out of this document's scope |
| **Business goal contribution** | direct revenue pull (booking, TMCP signup) | brand awareness or defense | nice-to-have |

**Scoring rules:**
- 5+ "high" axes → `priority: high`
- 3–4 "high", or 6+ "medium" → `priority: medium`
- Otherwise → `priority: low`
- Waiting on an external gate → `priority: deferred`, with the gate named

**Tie-breakers — bump one level:**
- Already ranking top 20, because close-to-page-one wins are the cheapest.
- Difficulty under 30 with a weak SERP, meaning unclaimed territory.
- Critical to a flagship initiative (TMCP, a new service area).
- The keyword appears in Bing grounding queries, because that is confirmed retrieval phrasing rather than modeled volume.
- The keyword closes an uncovered fan-out axis for a cluster that already has a strong pillar.

**Do not bump for:**
- Volume alone. Volume without intent fit is noise.
- Easy ranking achieved by keyword stuffing.
- Aspiration with no intent or ICP fit.
- A high AI search volume figure on its own — the underlying prompt corpora are estimates and carry a `[U]` label.

**Never bump a Local Pack keyword on the strength of a content plan.** If the surface is the Local Pack, the lever is Google Business Profile, proximity, reviews and service-area depth. Say so in the Notes column and route the work to `str-ai-seo-local`.

## Validation pass

Before writing `target-keywords.md`, check:

- [ ] Every cluster has one pillar and 5–15 supporting queries
- [ ] Every keyword has a primary intent
- [ ] Every keyword has a surface tag, marked `inferred` where it was not confirmed by a live SERP call
- [ ] Every keyword has an assigned page (existing URL or `NEW: /proposed-path`)
- [ ] Every primary keyword has its fan-out sub-queries enumerated
- [ ] No keyword has two assigned pages, and every confirmed collision appears in the Cannibalisation Detection table
- [ ] Every Tier 3 page has its own row — a pattern description is not enough for `str-onpage-audit`
- [ ] Every recommended H1 satisfies the homograph rule: no "mole" without a disambiguating token in the same sentence
- [ ] Every city page passes the doorway gate: strip the city name and it is still distinguishable from the others
- [ ] Priority distribution per cluster is roughly 1–3 high, 3–7 medium, the rest low
- [ ] `geographic_scope` is Western Washington, and `canonical_facts` is present and current
- [ ] `data_sources` lists every pull with its date, and the spend line reconciles with `.dataforseo-usage.log`
- [ ] Every statistic that could reach a client-facing extract carries a `[P]`, `[S]` or `[U]` label
