# Internal Linking Evidence Base

**Precedence.** The root landscape file `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` is the source of truth for the state of search. Where anything here disagrees with it, that file wins. This file holds the internal-linking-specific evidence the landscape file does not cover, and it labels every claim so nothing unsourced reaches a client deliverable.

**Confidence key** (same as the landscape file):
- **[P] PRIMARY** — official platform documentation or a first-party announcement. Treat as fact.
- **[S] STUDY** — a named study with a stated methodology and sample size from an organization with a real data asset. Strong evidence, correlational unless stated.
- **[U] UNVERIFIED** — trade content, no traceable methodology, or the primary source is unreachable. **Never a scored rule, never presented to a client as fact.**

**Hard rule for audit reports.** Every statistic that reaches a report carries its label. Anything marked [U] here does not go into a client deliverable at all — it is kept only so a future reader knows the claim was examined and rejected rather than overlooked.

---

## 1. Google's own position — [P]

From the generative-AI optimization guide (published 2026-05-15, last updated 2026-07-10), via `search-landscape-2026-09.md` §2.3:

- **"Effective internal linking" is named among the things that help content surface in AI Overviews and AI Mode.** This is the strongest citation available for the whole skill, and it is primary. Cite Google, not a correlation study.
- **The eligibility gate:** "To be eligible to be shown as a supporting link in AI Overviews or AI Mode, a page must be indexed and eligible to be shown in Google Search with a snippet." An orphan page is a page with the weakest claim on that gate.
- **Query fan-out:** Google issues "multiple related searches across subtopics and data sources" against one user query. Google's worked example is a lawn-weeds query fanning into herbicides, chemical-free removal and prevention — a direct read-across to mole control, and the reason Step 6 builds clusters around sub-queries.
- **Named as unnecessary:** machine-readable AI files, content chunking into tiny pieces, AI-specific rewriting, inauthentic mention-building, special schema, and "AEO/GEO hacks."

**John Mueller, on the record:**
- Internal linking is "super-critical for SEO" and "one of the biggest things you can do on a website"
- "The number of clicks it takes to get to a page is more important than your URL structure"

**Technical requirements — [P]:**
- Links must use `<a>` elements with `href` attributes. Search engines do not use search boxes or pulldown menus
- Every page you care about needs at least one link from another page
- Nofollow on internal links: equity dissipates rather than redistributing

---

## 2. Anchor text as a brand signal — [S]

**Ahrefs, 75,000 brands (published 2025-12-12).** Method: domains with DR > 40, highest-volume keyword at monthly volume ≥ 800, brand mentions measured across millions of AI responses. Spearman correlations against AI brand visibility. Full table in `search-landscape-2026-09.md` §5.1.

| Signal | ChatGPT | AI Mode | AI Overviews |
|---|---|---|---|
| Branded anchors | 0.511 | 0.628 | 0.527 |
| Branded web mentions | 0.664 | 0.709 | 0.656 |
| Domain Rating | 0.266 | 0.285 | 0.326 |
| Backlinks / URL Rating | ~0.2–0.3 | ~0.2–0.3 | ~0.2–0.3 |

**What this licenses.** Branded anchors correlate with AI visibility more strongly than Domain Rating and roughly twice as strongly as backlinks. Internal links are the cheapest place to produce branded anchors, so an internal anchor profile that never names the brand is leaving the best-correlating signal on the table.

**What this does not license.** Ahrefs' own caveat, quoted: "correlation isn't causation. We've spotted patterns between search metrics and AI mentions, but that doesn't mean improving these metrics will automatically boost your AI visibility." Do not promise an AI-visibility gain from an anchor rewrite.

---

## 3. Anchor distribution — no evidenced split exists

**Both previously recommended splits were removed on 2026-09-02.**

| Retired claim | Why |
|---|---|
| "40% partial match / 40% descriptive / 20% exact match" | [U] No traceable source. Was already marked superseded inside this file while still being live in it |
| "40% branded / 30% keyword / 30% generic (12AM Agency, Carnegie Higher Ed, LinkDoctor, iBeam Consulting, 2026)" | [U] Four trade blog posts, no methodology, no sample. Contradicted the block above it in the same file |
| "Optimal anchor length 4.85 words / 23.5 characters average" | [U] No traceable source. The 2-5 word convention is retained in SKILL.md as a convention, explicitly not as evidence |

**What replaces them** — the four principles in SKILL.md Step 5: a meaningful share of anchors carries the brand; every anchor is distinct enough to describe its own destination; exact-match anchors are reserved for priority destinations and never dominate one page; generic anchors are a defect rather than a quota. Report anchor **diversity and composition as measured**, and say in the report that no evidenced target split exists.

**Over-optimization threshold.** ">80% exact match to a single page" is retained as a conservative guard, labelled [U]. It is a sanity ceiling, not a finding to publish as a fact.

---

## 4. Named studies — [S], all classic organic, all pre-AI-Mode

These have real samples and stated methods. They remain the best available evidence for classic organic internal linking. **Every one of them predates AI Mode becoming the default surface on 2026-05-19**, so none of them says anything about AI citation. Cite them for classic organic and say so.

### Zyppy — 23 million internal links (Cyrus Shepard, 2024) — [S]
23 million internal links across 1,800 websites (~520,000 URLs), cross-referenced with Google Search Console data. The largest internal-linking study available.

| Finding | Data |
|---------|------|
| Organic clicks peaked around | 40-50 internal links per page |
| Links beyond ~50 | Reversed the benefit |
| Exact-match anchor impact | Pages with at least 1 exact-match anchor drew materially more traffic (reported as 5x) |
| Anchor text variety | Strong correlation with clicks, confirmed across three cuts |
| URL / naked anchors | ~50% more traffic than pages without |
| Anchor variation ceiling | Data unreliable past 25 variations per URL |

**Use:** justifies having exact-match anchors and keeps the 150-link dilution ceiling honest. **Do not use** as a per-page link target or as an AI-citation claim.

### LinkStorm — 2.5 million internal links (2025) — [S]
1,700 websites, contextual internal links only. Descriptive of what sites do, not prescriptive.

| Finding | Data |
|---------|------|
| Keyword-rich anchors | 81% of all anchors |
| Generic anchors ("click here") | 15% |
| Anchors with 1-3 words | 61% |
| Links within first 2 hierarchy levels | 71% |
| Links at depth 4+ | Under 6% |
| Anchor-title alignment | Only 8% strongly aligned |
| No similarity to target | 28% of anchors |

**Use:** context for what a normal anchor profile looks like. **Not a target distribution.**

### SearchPilot — controlled A/B split tests (2024-2025) — [S]

| Test | Result |
|------|--------|
| Nearby location page cross-links (6 nearest) | +7% organic traffic |
| Category page L2-L3 cross-linking | +25% organic traffic |
| Homepage footer links | +5% organic traffic |
| Anchor text keyword optimization | "Significantly positive" for destination pages |

**Superseded for city pages, 2026-09-02.** The nearby-location result is real and is kept here as historical evidence. It measured classic organic on a different site type and predates the doorway-enforcement shift described in `search-landscape-2026-09.md` §3.6, where the 2026 failure mode for thin location pages is silent suppression or grouping rather than a manual action. **Where this result and the doorway gate conflict, the doorway gate wins.** SKILL.md Step 6b caps city-to-city linking; do not cite this test to expand it. The category and homepage-footer results are unaffected and still apply to non-location hierarchies.

### seoClarity case studies (2024-2025) — [U]
Single-client case studies (+150,000 annual visits, +24%, +23%, a 100% keyword-discovery jump). No control, no methodology published. Retained as anecdote. **Never cite in a client deliverable.**

---

## 5. Retired claims — do not reuse

Removed from SKILL.md on 2026-09-02. Listed here so a future reader knows they were examined and rejected.

| Retired claim | Previously used for | Why retired |
|---|---|---|
| "Orphan pages waste 26% of crawl budget for local businesses and generate 5% of organic traffic"; "-40% Local Pack appearance from NAP inconsistency on orphans"; "+118% organic revenue"; "850% site health" (PushLeads) | Step 3 rationale | [U] Vendor blog, no methodology, no sample. Report measured orphan counts and named URLs instead |
| "76.6% of previously orphaned pages improve rankings when internal links are added" (Niche Pursuits, 108 links across 47 articles) | Step 3 rationale | [U] A single uncontrolled case study on one site, presented as a general rate |
| "Pages beyond 3 clicks get 89% fewer crawl visits"; "crawl frequency drops 82% between depth 1 and depth 5" | Step 4 rationale | [U] No traceable primary source |
| Per-depth "PageRank retention ~60% / ~35% / ~15%" table | Step 4 rationale | No source was ever given for the column. PageRank retention is not observable from outside Google |
| "35% of websites have broken internal links" (Semrush) | Step 7 | [U] Unreachable primary. The crawl measures this site's actual count, which is worth more |
| "2-5 contextual internal links per 1,000 words" | Step 7 density benchmark | Word-count-derived. [S] Ahrefs, 174,048 pages: word count correlates 0.04 with AI Overview citation. Replaced by fan-out coverage |
| "AI citation rate 12% baseline → 41% with hub-and-spoke" (TopicalMap.ai 2026) | Step 6 and the Got Moles scoring nudge | [U] Vendor page, no methodology. This was the single number driving the cluster-completeness score |
| "AI engines weight contextual body links 3-5x higher than nav/footer" (12AM Agency / Conductor 2026) | Step 7 | [U] No study behind the multiplier. The qualitative preference for contextual over template links is retained; the number is not |
| "December 2025 Helpful Content Update made internal linking a ranking signal" | Step 6 opener | No such named update exists. The 2026 update list is in `search-landscape-2026-09.md` §2.6. Replaced by Google's own [P] guidance in section 1 above |
| "Pillar pages need 8-12 cluster pages" / "cornerstone must link to ≥8 spokes" | Got Moles scoring nudge | "Industry consensus" with no source, and the wrong unit. Coverage of the fan-out set replaced the spoke count |

---

## 6. Surface prevalence — use the landscape file, not this file

This file previously carried "76.9% of near-me informational queries trigger AIO" and "only 7% of pure transactional Map Pack queries trigger AIO," both attributed to Whitespark / Conductor 2026. The first is corroborated and lives in `search-landscape-2026-09.md` §2.2 as [S]; the second does not appear there and is retired as [U].

**Read the current numbers from `search-landscape-2026-09.md` §2.2.** The shape that matters for this skill:

| Query type | Surface that fires | Rate | Tier |
|---|---|---|---|
| Explicitly transactional local ("mole removal Everett") | Local Pack | ~93% | [S] |
| Informational local ("how do I get rid of moles") | AI Overviews | ~92% | [S] |
| Hybrid ("average cost of mole removal in {city}") | AI Overviews | ~97% | [S] |

**Implication for the link graph** — this is the basis of the Step 8 routing rule. Informational pages are the ones AI Overviews cite. Transactional local pages are the ones the Local Pack serves and the ones that convert. Internal links are how the first hands the reader to the second, and the two are not interchangeable.

**Also relevant, from the landscape file:**
- [S] AI Overviews stay tightly coupled to organic rank; **AI Mode is loosely coupled via fan-out.** Fan-out coverage, not head-term rank, is what a link graph can influence for AI Mode (§2.3)
- [S] Ahrefs cross-platform overlap: AI Overviews to AI Mode 0.821, AI Overviews to ChatGPT 0.749. Winning one surface substantially predicts the others, so this is one program rather than per-engine programs (§2.3)
- [S] Niche brands appear in roughly 11% of relevant AI answers. That is the honest baseline for a local service business, and no internal-linking change moves it on its own (§5.2)

---

## 7. Doorway and scaled-content risk — the constraint on city linking

From `search-landscape-2026-09.md` §3.6:

- **[P]** Google's spam policies still name pages targeted at different cities that funnel visitors to the same destination as doorway abuse. Enforcement has not stopped since 2015.
- **[P]** Scaled content abuse is "when many pages are generated for the primary purpose of manipulating search rankings and not helping users," and applies equally to AI and human writing. A templated ~90-city-page build sits closest to this policy.
- **[U, practitioner consensus]** The 2026 practical shift: the common outcome for thin location pages is quiet suppression, filtering, or grouping so only one representative page shows. **The failure mode does not announce itself in Search Console.**
- **The test:** strip the city name from title, H1 and body. If what remains is indistinguishable from any other city page, the page fails.
- **[S]** Whitespark's top local organic factor is dedicated service pages. The defense is per-city substance — local mole species and soil conditions, actual jobs done there, named neighborhoods, city-specific reviews, real photography — not per-city templating, and not a denser link mesh between the templates.

**For this skill:** a mutual ring of city links adds link volume between pages that already look near-identical, which strengthens exactly the pattern the policy targets. City pages link UP to hubs and OUT to local proof. See SKILL.md Step 6b.

---

## 8. The homograph constraint on anchors

From `search-landscape-2026-09.md` §9. **[U] on every specific tactic; [P] on the mechanism** — candidate generation followed by context-weighted entity linking with popularity bias is standard NLP, and the skin-mole sense dominates the training distribution.

1. Never let "mole" appear without a co-occurring disambiguating token in the same sentence or heading: lawn, yard, turf, burrow, tunnel, molehill, *Scapanus*, ground mole, pest, trapping.
2. Every page mentioning "mole" links to one canonical disambiguation page. That page is the entity anchor.
3. The paid side already handles this with roughly 120 medical-cluster negatives in the Google Ads account. The organic and AI side needs the equivalent, and internal anchors are where this skill enforces it.

Applied in SKILL.md Step 5 (anchor guard) and Step 6d (entity anchor).
