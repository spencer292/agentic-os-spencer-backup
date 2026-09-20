---
name: str-internal-links
description: >
  Internal link audit AND apply-fixes skill. Audit mode builds the live link graph from a
  DataForSEO On-Page crawl (primary source) and cross-checks it against the codebase, then
  scores the structure against 6 pillars (orphan pages, link depth, anchor text, cluster and
  fan-out coverage, link equity flow, cross-linking gaps) and produces a prioritized fix list
  with exact files to edit. Clusters are built around query fan-out sub-questions, not around
  city names; city-page-to-city-page linking is capped. Apply-fixes mode takes an existing
  audit's P1/P2 fix list and executes the edits directly — adds block-level cross-links to
  service/city pages, injects in-content markdown links into blog post bodies, and reseeds
  affected CMS content. Use for internal linking audits, orphan pages, link depth,
  cross-linking, link equity, anchor text audits, apply-fixes from a prior audit, or
  implement-internal-links requests. Do NOT use for backlink or brand-mention strategy
  (use str-authority-strategy) or CRO audits (use str-cro-audit).
---

# Internal Link Audit

Audit a website's internal link structure from the live crawl, reconciled against the codebase. Every link mapped, every gap found, every fix prioritized with the file to edit.

## Outcome

**Produces:** Scored audit report saved to `projects/str-internal-links/{YYYY-MM-DD}_{site-name}-audit.md`, then pushed to Notion for review.

Includes: link map with crawl-versus-code provenance, 6-pillar score, orphan page list, link depth distribution, anchor text analysis, cluster and fan-out coverage validation, cross-linking gaps, the Per-Page Link Plan consumed by `str-onpage-audit`, and a prioritized fix list with exact file paths.

Always save output to disk. This is not optional. After saving, show the user the full absolute file path so they can click it directly, then push the report to Notion.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/target-keywords.md` | full | **REQUIRED.** Produced by `str-keyword-strategy`. Canonical Page → Primary Keyword map (Tier 1/2/3), the seven cluster ids, brand-disambiguation Rule 5 (anchor text), queries-to-avoid, Hub-and-Spoke topology, and the two columns this skill links against: **`surface`** (Classic organic / Local Pack / AI Overviews / AI Mode / ChatGPT / Perplexity / Gemini / Copilot-Bing) and **`fan_out_subqueries`** (the sub-questions a query fan-out generates for that primary keyword). If missing, stop and run `str-keyword-strategy` first |
| `../../.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` | the sections you cite | Root landscape file — the single source of truth for the state of search. §2.3 (fan-out and source selection), §3.6 (doorway risk on city pages), §5 (what correlates with citation), §9 (the mole homograph), §12.3 (the rules for this skill). Any landscape claim in an audit report is cited from here, never restated from memory |
| `brand_context/authority-strategy.md` | summary | Per-cluster authority signals. Tells you which pages carry earned external authority worth routing internally |
| `brand_context/positioning.md` | summary | Understand which pages are strategic priorities |
| `brand_context/icp.md` | summary | Know user journey to validate link paths |
| `context/learnings.md` | `## str-internal-links` section | Past audit feedback |

## Skill Relationships

**Upstream (reads from):**
- `str-keyword-strategy` — **the producer of `brand_context/target-keywords.md`**, which this skill requires. It supplies the Tier 1/2/3 page map, the seven cluster ids, Rule 5 anchor disambiguation, the `surface` tag per keyword and the `fan_out_subqueries` set that this skill's cluster topology is built around
- `str-authority-strategy` — `brand_context/authority-strategy.md` names which pages hold external authority, so internal links can route it
- `str-question-harvester` — its fan-out sub-query gap report is the same question set the link graph must make reachable in one hop
- `viz-page-architect` — page blueprints define intended link structure to audit against
- `ops-cms-content` — CMS page data defines what pages exist

**Downstream (feeds into):**
- `str-onpage-audit` — consumes the Per-Page Link Plan from Step 9 as **Pillar 2.5** (`### 2.5 Internal Links — Per-Page Link Plan`), which treats that section as its inbound/outbound source of truth. It also owns the cannibalisation cull that this skill only detects
- `mkt-authority-content` — audit findings inform where blog posts need links added
- `ops-blog-pipeline` — blog posts should link to pages identified as under-linked
- `str-ai-seo-local` — internal linking supports topical authority for AI citations
- Build tasks — fix list drives direct code changes

**Trigger boundaries:**
- "backlink analysis", "external links", "brand mentions" -> `str-authority-strategy` (this skill covers the internal graph only; DataForSEO Backlinks data reaches it through that skill)
- "CRO audit" or "conversion review" -> `str-cro-audit`
- "page structure" or "blueprint" -> `viz-page-architect`
- "merge these duplicate pages", "301 the loser", "cull thin pages" -> `str-onpage-audit`. This skill DETECTS cannibalisation (Step 6.5) and never executes the cull
- "redirect audit" -> this skill reports redirect chains that internal links pass through; a full redirect-map rebuild belongs to `str-onpage-audit`

## Step 1: Load Context

Read `context/learnings.md` -> `## str-internal-links` for past corrections.

Read `brand_context/target-keywords.md` in full. You need the Tier 1/2/3 page map, the seven cluster ids, Rule 5, the queries-to-avoid list, and — for every primary keyword — its **`surface`** tag and its **`fan_out_subqueries`** set. The link topology in Step 6 is built from `fan_out_subqueries`, and the routing rule in Step 8 is built from `surface`. If either column is absent, the foundation doc predates the 2026-09 refresh: say so in the report and run `str-keyword-strategy` before scoring cluster coverage.

Read the sections of `../../.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` you intend to cite. Any landscape claim that reaches the report is cited from that file with its [P]/[S]/[U] confidence label. Do not restate search-landscape facts from memory and do not carry a number this skill cannot attribute.

Read `brand_context/positioning.md` (summary) to understand which pages carry the most strategic weight. These become "priority pages" that need the strongest internal link support.

Read `brand_context/icp.md` (summary) to understand the visitor's journey. Internal links should mirror how visitors naturally move through the site.

## Step 2: Map the Site Structure — live crawl first, codebase as cross-check

The link graph is built from **what actually ships**, then reconciled against the source. Code-only scoring is no longer acceptable: the 2026-05-05 run in `## Rules` scored 50/100 from code and assumptions and 58/100 after re-reading source — an 8-point error from a source of truth that was never the live site. A crawl removes that error class and also catches CMS-only links (Payload Lexical richtext already seeded to the database but absent from `pages-data.ts`) that a codebase read cannot see at all.

### 2a. Primary source — DataForSEO On-Page full crawl

Run from the client folder so `.env` and the usage log resolve. Never print credential values.

**Spend guard, before any live call.** The DataForSEO account is pay-as-you-go on a small balance. Every On-Page task is billed per page crawled, so:
- Check the balance first: `node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs appendix/user_data`
- Always set `max_crawl_pages` explicitly. Never omit it and never point a crawl at a domain without one.
- Always set `load_resources: false` and `enable_javascript: false` for a link-graph crawl. Resource loading and JS rendering multiply the cost and this skill needs the anchor graph, not the render.
- Add `--dry` first to inspect the request; `--dry` costs nothing.
- After the run, reconcile against `.dataforseo-usage.log` in the client folder and report the spend in the audit's frontmatter.
- Prices are in `search-landscape-2026-09.md` §10. Do not quote a price this skill cannot source.

**Post the crawl task.** For got-moles.com set `max_crawl_pages` to comfortably exceed the live page count (93 city pages + 35 blog posts + Tier 1/2 pages) and no more:

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/task_post \
  '{"target":"got-moles.com","max_crawl_pages":180,"load_resources":false,"enable_javascript":false,"store_raw_html":false,"check_spell":false,"calculate_keyword_density":false}' \
  --out projects/str-internal-links/data/onpage-task.json
```

The response carries the task `id`. Poll until the crawl finishes:

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs on_page/summary/<TASK_ID>
```

`crawl_progress` reaches `finished` when `crawl_status.pages_crawled` equals `crawl_status.pages_in_queue + pages_crawled`. Do not pull results before then — a partial crawl produces false orphans.

**Then pull the five result sets.** Each is a POST carrying the task `id`:

| Endpoint | Payload | What it gives this skill |
|---|---|---|
| `on_page/pages` | `{"id":"<TASK_ID>","limit":1000}` | Every crawled URL with `click_depth`, `internal_links_count`, `external_links_count`, status code, canonical, meta. Pillars: Orphan Pages, Link Depth |
| `on_page/links` | `{"id":"<TASK_ID>","limit":1000,"filters":[["link_from","like","%got-moles.com%"]]}` | The edge list: `link_from`, `link_to`, `text` (anchor), `type`, `dofollow`, `is_broken`. Pillars: Anchor Text, Cluster and Fan-Out Coverage, Link Equity Flow, Cross-Linking Gaps. Page the `limit`/`offset` until the edge list is exhausted |
| `on_page/redirect_chains` | `{"id":"<TASK_ID>","limit":1000}` | Every internal link resolving through a hop. Feeds Step 6.5 and the Link Equity pillar |
| `on_page/duplicate_content` | `{"id":"<TASK_ID>","url":"<page-url>","limit":100}` | Near-duplicate pages for one URL. Requires the `url` field. Feeds Step 6.5 cannibalisation detection and the doorway check on city pages |
| `on_page/non_indexable` | `{"id":"<TASK_ID>","limit":1000}` | Pages excluded by robots, noindex or canonical. An internal link pointing at one of these is wasted equity |

Save each response under `projects/str-internal-links/data/` so the audit is reproducible and a re-score does not re-spend.

### 2b. Cross-check source — the codebase

The crawl says what ships. The codebase says which file to edit, which is what every fix in Step 9 needs. Read the source to attach a file path to each edge and to catch links that exist in code but never rendered.

**For Next.js / App Router sites:**

1. **Discover all routes** — scan `app/` directory for `page.tsx` files. Each route = one node in the link graph.
2. **Scan page data files** — read pages-data.ts, city-data.ts, or equivalent. These define CMS block content that contains links.
3. **Scan components** — read layout files (header, footer, navigation), shared components, and page-specific components. Extract every `<Link>` and `<a>` element with its source page, destination URL, anchor text, context (navigation, footer, body content, CTA, breadcrumb) and link type (contextual body link vs template/nav link).
4. **Scan CMS content** — for Payload, Sanity and equivalents, read the richText/Lexical link nodes. These are the links most likely to be crawl-only.
5. **Scan blog posts** — read all blog content files for internal links.

### 2c. Reconcile, and report the divergence

Build one link graph and label every edge with its provenance:

| Provenance | Meaning | Action |
|---|---|---|
| Both | In the crawl and in the source | Normal. Fixable, file path known |
| Crawl only | Renders live, no source edge found | Usually CMS-seeded richtext. Record the source of truth before proposing an edit, or the fix will be wiped by the next reseed |
| Source only | In the code, absent from the live HTML | A real defect. The link is behind JS, inside a lazy block, in dead code, or on a page the crawl could not reach. Flag it — the site is not shipping a link it thinks it ships |

**Report the divergence count in the audit.** A high crawl-only count means the codebase is not the source of truth for links and every apply-fix must route through the seed script rather than the data file.

If the crawl cannot run (no credentials, no balance, site unreachable), the skill still works from the codebase alone — but the report must open with an explicit banner naming the degradation, and the score is labelled provisional. Never present a code-only score as a measured one.

Read `references/discovery-patterns.md` for the crawl-to-codebase field mapping and framework-specific file patterns.

## Step 3: Orphan Page Detection

An orphan page has zero contextual internal links pointing to it. Navigation/footer links alone are insufficient for strong SEO signals.

**Why this matters — the mechanism, not a statistic.** [P] Google's own AI-optimization guidance names "effective internal linking" as one of the things that helps content surface in AI Overviews and AI Mode, and states the eligibility gate directly: a page must be indexed and eligible to show with a snippet to be cited at all (`search-landscape-2026-09.md` §2.3). A page with no inbound contextual link is a page the crawler reaches late, re-crawls rarely, and has the weakest claim on that gate. The circulating orphan-page percentages (26% crawl budget, 5% traffic, 76.6% recovery) were retired on 2026-09-02 — they trace to vendor blog posts with no stated methodology. Report orphan **counts and named URLs**, never a modelled traffic impact.

**Check for:**
- Pages with zero inbound internal links (true orphans) — from `on_page/pages` where `internal_links_count` is 0, cross-checked against the `on_page/links` edge list
- Pages with ONLY nav/footer links (functional orphans — no contextual body links). Use the `on_page/links` `type` field plus the crawl-to-source reconciliation from Step 2c
- Pages present in sitemap.xml but absent from the crawl's discovered set (crawlable but not reachable through the link graph)
- Redirect targets that have no direct links (only reached via redirect)
- Pages in `on_page/non_indexable` that still receive inbound internal links — equity pointed at a page that cannot be cited

**Score:** 0-10 based on orphan ratio. Zero orphans = 10. More than 20% orphan ratio = 0-3.

## Step 4: Link Depth Analysis

Link depth = minimum clicks from homepage to reach a page. Take `click_depth` straight from `on_page/pages`; only compute a BFS yourself if the crawl did not run.

Depth matters because discovery and re-crawl frequency fall with it, and because a fan-out sub-answer sitting four clicks deep is not reachable in one hop from the page that ranks (Step 6). The specific crawl-frequency percentages this skill used to quote (89% fewer visits beyond 3 clicks, an 82% drop between depth 1 and 5, and a per-depth "PageRank retention" column) were retired on 2026-09-02 as unsourced. Report the measured depth distribution instead — it is real data from the crawl and needs no borrowed statistic.

**Measure:**
- `click_depth` for every page
- Flag strategic/priority pages deeper than 2 clicks
- Flag any page deeper than 3 clicks
- Average depth across all pages
- Depth distribution chart

**Benchmarks:**
- Strategic pages: within 2 clicks (service pages, city pages, conversion pages)
- All important pages: within 3 clicks
- Blog/resource content: within 4 clicks acceptable

**Score:** 0-10 based on depth distribution. All priority pages within 2 clicks = 10. Priority pages at 4+ = 0-3.

## Step 5: Anchor Text Analysis

Anchor text does two jobs. It tells Google what the destination page is about, and — this is the 2026 addition — it is a **brand signal**. [S] Ahrefs, 75,000 brands: branded anchors correlate 0.511 (ChatGPT) to 0.628 (AI Mode) with AI brand visibility, above Domain Rating at 0.266–0.326 and well above backlinks at ~0.218–0.27 (`search-landscape-2026-09.md` §5.1). Correlation is not causation, and Ahrefs says so themselves — but an internal anchor profile that never names the brand is throwing away the cheapest instance of the signal that correlates best.

**Analyze per destination page:**
- Total unique anchor texts pointing to it, from the `text` field of `on_page/links`
- Anchor text distribution by type — branded / exact match / partial match / descriptive / generic / URL
- Flag over-optimization: >80% exact match to any single page
- Flag identical-pattern repetition: same exact anchor used more than 5 times sitewide. Repetition without diversity reads as an anchor-spam pattern and dilutes the signal
- Flag wasted anchors: "click here", "read more", "learn more"
- Flag anchor-destination misalignment: anchor text has no relevance to destination page topic

**No evidenced target split exists — do not publish one.** Two different recommended distributions were carried by this skill (40% partial / 40% descriptive / 20% exact, and 40% branded / 30% keyword / 30% generic). Both trace to trade blog posts with no methodology, they contradicted each other, and both were removed on 2026-09-02. Score against these four principles instead, and say in the report that the split is a principle rather than a benchmark:

1. **A meaningful share of inbound anchors carries the brand.** "Got Moles", "the Got Moles team", "Got Moles in Tacoma". This is the AI-visibility signal above. If branded anchors are near zero sitewide, that is a finding.
2. **Every anchor is distinct enough to describe its own destination.** Diversity is the property being scored, not conformance to a ratio.
3. **Exact-match anchors are reserved for priority destinations and never dominate one page.** [S] Zyppy, 23M internal links across 1,800 sites cross-referenced with Search Console (2024): pages with at least one exact-match anchor drew materially more organic traffic. That study predates AI Mode and is a correlation on classic organic. Use it to justify having exact-match anchors, not a percentage.
4. **Generic anchors are a defect, not a quota.** "Learn more" pointing at a money page is a fix, whatever the distribution says.

Anchor length: 2-5 words is the working convention, not an evidenced threshold.

**Disambiguation guard (blocking — from `target-keywords.md` Rule 5 and `search-landscape-2026-09.md` §9).** "Mole" resolves to a skin lesion in the dominant training distribution, so an unqualified anchor collapses to dermatology intent:
- Every anchor pointing to a mole-control / mole-removal page must carry a **lawn signal** (one of: `lawn`, `yard`, `garden`, `turf`, `ground`, `burrow`, `tunnel`, `molehill`, `Washington`, `Seattle`/`Tacoma`/`Olympia`, `Got Moles`, `professional`, `trapping service`)
- **Forbidden anchor:** `mole removal` alone — collapses to dermatology intent and burns equity. Always qualify: `lawn mole removal`, `professional mole removal`, `mole removal in Tacoma`
- **Forbidden anchor:** anchors drawn from the queries-to-avoid clusters in `target-keywords.md` (`mole removal cost`, ambiguous `mole removal near me` variants, and the rest of the six clusters listed there)
- **Posture A applies to anchor text.** Never `body-gripping`, `scissor`, `harpoon`, `spear`, `kill`, `lethal`. Generic "trapping" and "professional service" are fine

Flag any internal link whose anchor fails the guard. Every rewrite recommendation must include the lawn signal.

**Score:** 0-10 on diversity, brand presence, destination alignment and guard compliance. Varied anchors, brand present, exact-match used deliberately, guard passing = 10. Mostly generic, one anchor repeated sitewide, over-optimized to a single page, or any guard failure = 0-3. A guard failure caps the pillar at 5 regardless of the rest.

## Step 6: Cluster and Fan-Out Coverage Validation

**[P] Internal linking is Google-endorsed for AI features.** The official generative-AI optimization guide (published 2026-05-15, last updated 2026-07-10) names "effective internal linking" among the things that help content surface in AI Overviews and AI Mode. Cite Google, not inference, and cite it through `search-landscape-2026-09.md` §2.3 rather than restating it. The same section names the mechanism this step is built on: **query fan-out**, where Google issues "multiple related searches across subtopics and data sources" against one user query. Google's own worked example is a lawn-weeds query fanning into herbicides, chemical-free removal and prevention — a direct read-across to mole control.

The 2026 correction: **build clusters around fan-out sub-queries, not around city names.**

### 6a. Cluster topology is built from `fan_out_subqueries`

For each of the seven clusters in `target-keywords.md` (mole-control, biology, safety, cost-value, seasonal, diy-vs-pro, location-services), take the pillar page's `fan_out_subqueries` set and verify:

- **A page or an on-page section exists that answers each sub-query.** Where none exists, that is a content gap, not a link gap — record it and hand it to `mkt-authority-content`.
- **Every fan-out sub-answer is reachable in one hop from the page that ranks.** This is the load-bearing rule of the step. If the cost page ranks for the head term and the seasonality answer is two hops away, the cluster does not cover the fan-out.
- **The pillar links out to every sub-answer, and every sub-answer links back to the pillar.**
- **Sibling sub-answers cross-link where the sub-queries are genuinely adjacent** — a cost page and a method page, a seasonality page and a prevention page. Adjacency means the sub-queries co-occur in a fan-out, not that the pages share a folder.
- **No cross-cluster pollution** — a spoke linking to an unrelated pillar.

A cluster of a cost page, a method page, a seasonality page and a prevention page linked to each other covers a fan-out set. A ring of near-identical city pages linked to each other covers nothing.

### 6b. City pages link UP and OUT, never sideways in rings

**[P/U] Cap city-page-to-city-page linking.** Google's spam policies still name pages targeted at different cities that funnel visitors to the same destination as doorway abuse, and scaled-content abuse applies equally to human and AI writing (`search-landscape-2026-09.md` §3.6). The 2026 failure mode is not a manual action — it is quiet suppression, filtering, or grouping so only one city page shows, and **it does not announce itself in Search Console.** A ring of mutual city links is the exact shape that pattern-matches to a doorway network.

The rule for a city page:
- **UP** to its service pillar and to the relevant informational hubs. Required.
- **OUT** to genuinely local proof — a review from that city, a job done there, a named neighborhood, local species or soil conditions. Required, and this is also the doorway defense: [S] Whitespark's top local organic factor is dedicated service pages with real per-city substance.
- **SIDEWAYS** to other city pages: capped, and only where the link serves a reader. A named "nearby areas" module of a small number of genuinely adjacent cities is acceptable. A 24-city footer block or a full mesh is not.
- Never a blanket template-level city-link block. Per-post and per-page topical mapping only.

**Superseded 2026-09-02.** This skill previously recommended cross-linking 3-6 nearest neighboring cities on the strength of a SearchPilot A/B test reporting +7% organic traffic. That test is real and is retained in `references/research-data.md` as historical evidence, but it measured classic organic on a different site type and predates both the doorway-enforcement shift and the AI surfaces. Where the SearchPilot result and the doorway gate conflict, **the doorway gate wins.** Do not recommend expanding city-to-city linking, and treat an existing dense city mesh as a finding to reduce.

### 6c. Tier 1/2/3 structure from `target-keywords.md`

Don't invent a topology when the canonical mapping exists. Validate the graph against the Hub-and-Spoke topology section of `target-keywords.md`:

- **Tier 1 (Authority pages)** — homepage, service pages, key cornerstones (e.g. `/how-to-get-rid-of-moles-in-your-yard/`, `/voles-vs-moles-whats-the-difference/`, `/about/`). Linked from every Tier 2 hub and a relevant subset of Tier 3 spokes.
- **Tier 2 (Supporting hubs)** — `/reviews/`, `/service-areas/`, `/faq/`, `/blog/`, `/author/spencer/`. Each links up to relevant Tier 1 and down to its Tier 3 spokes.
- **Tier 3 (City pages + blog posts)** — every Tier 3 page links up to its Tier 1 cluster pillar and to the relevant Tier 2 hub. Blog posts also link to sibling spokes serving adjacent fan-out sub-queries. City pages follow 6b, not the sibling rule.

Flag any Tier 1 page not linked from every Tier 2 hub. Flag any Tier 3 page missing its up-link to its Tier 1 pillar.

### 6d. The entity anchor — every "mole" page links to the disambiguation page

**[U] on the tactic, [P] on the mechanism.** Entity linking resolves "mole" against a training distribution where the skin-lesion sense dominates, so the site has to supply the context itself (`search-landscape-2026-09.md` §9). One canonical disambiguation page carries the definition: what a lawn mole is, why it is not a skin mole, what a molehill looks like, which *Scapanus* species live in Western Washington.

- Every page that mentions "mole" links to that page at least once, with a lawn-signal anchor.
- The disambiguation page is Tier 1 and must be within 2 clicks of the homepage.
- If no such page exists, that is a P1 finding handed to `mkt-authority-content` — the link rule cannot be satisfied without it.
- Flag any page mentioning "mole" with no path to the entity anchor.

**Score:** 0-10. Fan-out sub-answers all reachable in one hop, Tier 1/2/3 alignment intact, city pages linking up and out rather than sideways, entity anchor reachable from every mole page = 10. Missing pillars, fan-out sub-queries with no reachable answer, a city-page mesh, or no entity anchor = 0-3.

## Step 6.5: Cannibalisation Detection (detection only — execution belongs to `str-onpage-audit`)

**Scope boundary, set 2026-09-02.** This skill DETECTS cannibalisation and reports it. It never merges pages, never writes a 301, never edits the redirect map or the sitemap, and never culls a thin page. Execution belongs to the **`## Cannibalisation Cull — Apply-Fixes Procedure` section of `str-onpage-audit` (steps C1 to C5)**. That is a top-level section in that skill, deliberately not a numbered Step — do not cite it as one. Hand your findings there and stop. Deleting and redirecting live URLs on a site holding 635 #1 keywords is a high-risk, hard-to-reverse operation that has to run under one owner with one staged procedure.

**How to detect.** Three inputs, in order of authority:
1. `on_page/duplicate_content` from the Step 2a crawl — measured near-duplication, run per candidate URL (the endpoint requires a `url` field).
2. The Cannibalisation notes in each cluster of `target-keywords.md`.
3. Any standing duplicate-URL inventory (e.g. Sub 1.5 of `seo-foundation-recovery`).

**What to report.** Cross-reference every internal link destination against the duplicate set and flag:
- Internal links pointing at the **non-canonical version** of a duplicate pair — wasted equity and a redirect-chain risk in one
- Duplicate pairs where the internal link graph disagrees with the declared canonical, meaning the site's own linking is voting for the loser
- Any destination appearing in `on_page/non_indexable`

### Feeding the C1 evidence gate — candidate versus confirmed

`str-onpage-audit` C1 requires **all three** of the following to agree before any URL is touched, and one source alone is not evidence. Produce all three here and the cull can start from this report without re-deriving anything.

| Evidence | Source | Who produces it |
|---|---|---|
| Overlapping ranked keywords, grouped by URL, with each URL's position and Google's preferred URL per keyword | `dataforseo_labs/google/ranked_keywords/live` with an explicit `limit` | This skill can run it; otherwise leave it to C1 |
| Page-level clicks and impressions over a 16-month window for the overlapping queries | Search Console, via `.claude/skills/ops-got-moles-ads/scripts/_gsc-status.mjs` and `_gsc-today.mjs`. **Those two scripts currently hold hardcoded OAuth tokens and are gitignored pending a scrub — they must be scrubbed to `.env` and the tokens rotated before anyone other than Roy runs this step** | Either skill |
| Full inbound internal-link inventory with anchor text for both URLs | The Step 2a crawl edge list. **This is native to this skill and is also the rewrite list C3 step 5 works from** | **This skill. Always produce it.** |

**Labelling is mandatory.** A pair backed by all three is a **confirmed pair**. A pair backed by keyword overlap or near-duplication alone is a **candidate pair** and must be labelled as such, so nothing downstream reads it as actionable.

**Two constraints from C5 that shape what you flag:**
- **A URL holding a #1 keyword is never proposed for a cull** without explicit approval from Roy. Check position 1 in the ranked-keyword pull before listing a pair, and mark any pair touching a #1 URL as approval-gated.
- **A thin city page is a substance problem before it is a cull candidate.** City pages go through the blocking doorway gate in `str-onpage-audit` first. Report a weak city page as a substance and linking finding, not as a deletion candidate.

Known Got Moles pairs to confirm rather than assume (canonical may have moved since these were recorded):
- `/are-moles-blind/` ↔ `/how-many-eyes-do-moles-have/`
- `/blog/types-of-moles-in-washington/` ↔ `/what-species-of-moles-live-in-washington-state/`
- Trailing-slash duplicates, `/blog/*` vs legacy-root variants, and the thin `/mole-repellant-{city}/` pages

Every internal link should resolve to the canonical version with no 301 hop. This is a HIGH-impact finding despite carrying no separate pillar score — surface it in the P1 band and name `str-onpage-audit` as the owner of the fix.

## Step 7: Link Equity Flow Analysis

Internal links distribute authority (PageRank). Contextual body links carry more weight than navigation links. Links higher in content pass more equity.

**Analyze:**
- Pages with highest inbound internal links (authority concentrators)
- Pages with lowest inbound links relative to their strategic importance (equity-starved)
- Total outbound links per page (dilution check — keep under 150)
- Contextual vs template link ratio per page (target: majority contextual for strategic pages)
- Nofollow internal links (should be zero except login/cart — equity dissipates rather than redistributing). Read the `dofollow` field from `on_page/links`
- Redirect chains in internal links (always link to final destination). Read `on_page/redirect_chains`
- Broken internal links. Read the `is_broken` field from `on_page/links`. Report the measured count from the crawl; the "35% of websites have them" figure was retired on 2026-09-02 as unsourced, and a measured number on this site is worth more than an industry average anyway

**Density: no word-count benchmark.** The old "2-5 contextual links per 1,000 words" rule was removed on 2026-09-02. Word count does not predict citation — [S] Ahrefs, 174,048 pages, found a 0.04 correlation between word count and AI Overview citation (`search-landscape-2026-09.md` §5.2) — and a per-thousand-words target rewards padding. Judge link density by **fan-out coverage** instead: does this page link to every sub-answer a reader or a fan-out would need next. Keep the total-outbound dilution ceiling at 150 as a sanity cap, and note [S] Zyppy's 2024 finding that organic clicks peaked around 40-50 internal links per page as classic-organic context rather than a target.

**Score:** 0-10 based on equity distribution alignment with strategic priorities.

## Step 8: Cross-Linking Gap Analysis

The highest-value finding: specific links that should exist but don't.

**The routing rule — informational links to transactional local, because they win on different surfaces.** [S] The SERP shape now differs by intent (`search-landscape-2026-09.md` §2.2): explicitly transactional local queries fire the Local Pack ~93% of the time, while informational local queries fire AI Overviews ~92% and hybrid queries ~97%. The informational pages are the ones AI Overviews cite; the transactional local pages are the ones that convert. Internal links are how the first hands readers to the second. Read the `surface` column in `target-keywords.md` for each page and check the routing explicitly.

**Check these cross-link patterns:**

| From | To | Why |
|------|----|-----|
| Informational blog posts (AI Overviews surface) | Service pages (Local Pack surface) | The routing rule. The cited page passes the reader to the converting page |
| Informational blog posts | The city page for a city the post actually names | Local relevance, only where the post genuinely references that place |
| Any page mentioning "mole" | The canonical disambiguation page | Entity anchor, per Step 6d |
| Pillar page | Every fan-out sub-answer in its cluster | One-hop reachability, per Step 6a |
| Fan-out sub-answer | Its pillar, and genuinely adjacent siblings | Cluster closure |
| Service pages | Related service pages | Cross-sell, topical authority |
| City pages | Service pages available there, and local proof | UP and OUT, per Step 6b |
| ~~City pages~~ | ~~Nearby city pages~~ | **Capped since 2026-09-02.** See Step 6b. Not a gap to close; a dense mesh is a finding to reduce |
| Reviews/testimonials | Service pages they reference | Social proof at point of decision |
| Reviews | City pages they reference | Local trust signal |
| Case studies | Service + city pages | Proof supporting money pages |
| FAQ or Q&A sections | The page that answers the question in full | Contextual relevance. Note the Q&A content shape is retained; FAQPage schema is not a deliverable |

**Generate specific recommendations:** "Add link from [source page] to [destination page] with anchor text '[suggested anchor]' in [specific location in the content]." Every recommendation names the fan-out sub-query or surface-routing rule it serves.

**Score:** 0-10 based on cross-linking completeness. All natural cross-links present, informational-to-transactional routing intact = 10. Major gaps in informational-to-service routing, or fan-out sub-answers with no inbound link from their pillar = 0-3.

## Step 9: Score and Prioritize

### Overall Score

```
## Internal Link Audit Score: X/100

| Pillar | Score | SEO/GEO Weight | Weighted |
|--------|-------|----------------|----------|
| Cross-Linking Gaps | X/10 | 25% | X |
| Cluster and Fan-Out Coverage | X/10 | 25% | X |
| Anchor Text | X/10 | 20% | X |
| Orphan Pages | X/10 | 15% | X |
| Link Depth | X/10 | 10% | X |
| Link Equity Flow | X/10 | 5% | X |
```

State the data basis directly under the score: crawl-measured, code-only-provisional, or mixed with the divergence count from Step 2c. A reader cannot interpret the number without it.

### Per-Page Link Plan (deliverable for downstream consumption)

For every Tier 1 + Tier 2 page, produce this table under the heading **`## Per-Page Link Plan`** — consumed by `str-onpage-audit` as **Pillar 2.5** (`### 2.5 Internal Links — Per-Page Link Plan`) and by any per-page build work. Keep the filename and this exact heading — that skill looks for both by name:

| Page | Tier | Cluster | Surface | Fan-out sub-queries served | Inbound links (current) | Inbound links (target — gaps) | Outbound links (current) | Outbound links (target — gaps) | Anchor candidates (Rule 5 compliant) |
|---|---|---|---|---|---|---|---|---|---|

Three columns were added on 2026-09-02: **Cluster** (one of the seven ids in `target-keywords.md`), **Surface** (copied from that page's primary keyword `surface` tag), and **Fan-out sub-queries served** (which entries of `fan_out_subqueries` this page answers). Downstream consumers must read them — the surface column is what makes the informational-to-transactional routing rule checkable per page.

For Tier 3 (city + blog), produce a condensed version (one row per page, or one row per cluster summarising patterns).

### Prioritized Fix List

Rank every fix by impact, risk and dependency order. **Never attach a time or effort estimate.**

| Priority | Fix | Impact | Risk / reversibility | Depends on | File(s) to Edit |
|----------|-----|--------|----------------------|------------|-----------------|
| P1 | [description] | High | Low / reversible | — | `path/to/file.tsx` |
| P2 | ... | ... | ... | ... | ... |

**Priority rules:**
- P1 (do first — high impact, low risk, no dependencies): disambiguation-guard failures, links to non-canonical or non-indexable destinations, broken links, missing informational-to-transactional routing, fan-out sub-answers unreachable from their pillar
- P2 (do next): anchor diversity and brand presence, orphan pages, entity-anchor links from mole-mentioning pages
- P3 (structural — do after the cleanup above): cluster restructuring, blog cross-linking at scale, reducing an existing city-page mesh
- P4 (monitor): minor depth issues, low-priority page linking

Confidence labels are mandatory on any statistic that reaches the report: [P] primary source, [S] named study with a stated sample, [U] unverified. The key is in `search-landscape-2026-09.md`.

## Step 10: Save and Present

1. Save the audit to `projects/str-internal-links/{YYYY-MM-DD}_{site-name}-audit.md` with YAML frontmatter:
   ```yaml
   ---
   site: [site-name]
   date: [YYYY-MM-DD]
   score: [X/100]
   data_basis: crawl | code-only-provisional | mixed
   crawl_task_id: [DataForSEO on_page task id, or none]
   crawl_spend_usd: [from .dataforseo-usage.log, or 0]
   pages_crawled: [count]
   crawl_vs_code_divergence: [count of crawl-only + source-only edges]
   orphan_pages: [count]
   fixes_p1: [count]
   fixes_total: [count]
   status: draft
   ---
   ```

2. Show the user the full absolute file path.

3. Push the report to Notion for review — Notion is the Got Moles review mechanism (Spencer and the team review there). Create the page under the Got Moles project via the Notion MCP (`mcp__claude_ai_Notion__notion-create-pages`). Every deliverable this skill produces goes to Notion, audits and re-scores alike.

4. Present the summary: overall score, data basis, worst pillar, top 5 fixes.

5. Ask for feedback: "How does this audit land? Any pages I should have weighted differently?"

6. Log feedback to `context/learnings.md` under `## str-internal-links`.

## Apply-Fixes Mode

When the user asks to "apply," "implement," "execute," or "fix" items from an existing audit (or says "do the P1 fixes now"), switch into apply-fixes mode. This mode does not re-audit — it executes the fix list that already exists.

### Step A1: Find the audit

Read the most recent audit at `projects/str-internal-links/{YYYY-MM-DD}_{site-name}-audit.md` (sort by date, newest first). If multiple audits exist, ask which one to apply from. If none, tell the user to run the audit first.

### Step A2: Confirm the scope with the user

Present the P1 fix list from the audit and confirm: "I'll apply P1 #2 through #6 (service cross-links, city links, reviews→services, case studies→services). P1 #1 (in-content blog links) is a larger batch — run separately. Confirm or change scope?"

Wait for confirmation. Do not silently apply the entire fix list.

### Step A3: Apply block-level fixes (service cross-links, city links, hub navigation)

For each confirmed fix:

1. Read the target file(s) listed in the audit's "File(s) to Edit" column.
2. Insert the required block(s) at the right position to preserve the site's **section background alternation rule** — parity via added blocks, end in grass before the CTA. If in doubt, add two blocks rather than one to avoid flipping downstream backgrounds. (This rule was previously cited to an auto-memory file, `feedback_unified_alternation_rule.md`, which is no longer present in the memory store as of 2026-09-02. The rule is stated inline here so it survives.)
3. Use existing block types (`featureGrid`, `serviceArea`, `richContent`, `cta`) rather than inventing new types. `featureGrid` supports `link` + `linkText` per item. `serviceArea` supports arbitrary city name + URL pairs.
4. Prefer descriptive, disambiguated anchor text: "Mole Control in Bellevue" over "Bellevue", "See Year-Round Mole Protection" over "Learn More". Every anchor passes the Step 5 disambiguation guard, and a meaningful share across the batch carries the brand.
5. `serviceArea` blocks are the block type most likely to produce a city mesh. Before adding one to a city page, check Step 6b — city pages link UP to hubs and OUT to local proof. Do not use this block to add a ring of neighboring cities.

### Step A4: Apply in-content body link fixes (blog posts)

For each blog post in the target list:

1. Read the `sections` array in `blog-data.ts` (or equivalent CMS content source).
2. Identify 2-3 natural sentences per post where a link would enhance rather than interrupt the flow. Target priority:
   - **Primary:** the single most relevant service page (TMCP for ongoing/year-round topics, One-Time for removal/cost topics, Commercial for B2B topics).
   - **Secondary:** 1-2 related-cluster blog posts (link Biology posts to Biology, Mole Control posts to Mole Control, etc.).
   - **Tertiary:** a city page if the post mentions a specific city.
3. Edit each body string to inline markdown links: `[anchor text](/path/)`.
4. Link rendering requires the target framework's rich-text renderer to parse markdown links. For Got Moles Payload: `sectionsToLexical()` in `src/scripts/seed.ts` parses `[text](url)` into Lexical link nodes (added 2026-04-20 — confirm before running on new sites).

### Step A5: Reseed affected CMS content

For page-block changes (Fixes #2-#6):
- `npx tsx -r dotenv/config src/scripts/seed.ts --reseed <comma-separated-slugs>`

For blog body changes (Fix #1):
- `npx tsx -r dotenv/config src/scripts/seed.ts --reseed-blogs all` (or specific slug list)
- This flag deletes and recreates blog posts so body-level changes propagate. Authors/services/testimonials/cities/pages are untouched.

For sites without `--reseed-blogs` support yet, add the flag to the seed script first (pattern: parse flag, find existing by slug, delete if targeted, recreate with updated body). Do not hand-edit the CMS database.

### Step A6: Verify and deploy

1. `npx next build` (or framework equivalent) to catch type errors before push.
2. Visual smoke test on staging: spot-check one blog and one service page to confirm links render as actual anchors, not literal `[text](url)` strings.
3. Commit per fix cluster, not per individual edit. Descriptive commit messages referencing the audit.
4. Commit + push to origin for backup. NO deploy from this repo — live shipping routes through the deploy repo (client AGENTS.md "Website Deploy", rewire pending); report the fixes as STAGED until shipped.

### Step A7: Update audit status

Update the source audit's frontmatter:
- `status: draft` → `status: partially-applied` or `status: complete`
- Add an `applied_at: YYYY-MM-DD` field
- Add a note at the bottom of the audit with applied commits and date

### Apply-fixes rules

- Never apply fixes silently. Confirm scope first, show what was done after.
- When an audit's fix list mentions infrastructure that does not exist yet (e.g., "markdown link parser in sectionsToLexical"), build the infrastructure first, test on one item, then roll out.
- Run a local build BEFORE reseeding DB content. Broken code + updated DB = worst-case recovery scenario.
- For Got Moles specifically: commit direct to main (trunk-based) and push to origin for backup; the LIVE site deploys from the ORIGINAL freeflyroy/agent-os repo (client AGENTS.md "Website Deploy" — rewire pending), so shipping means routing the site tree through that deploy repo as an explicit user step. Report unshipped fixes as STAGED, not deployed. Never use the Vercel CLI.

## Got Moles Specific Guardrails

When auditing or applying fixes on got-moles.com specifically, these documents OVERRIDE generic skill defaults where they conflict. Read them before starting:

| Document | Why |
|---|---|
| `clients/got-moles/brand_context/target-keywords.md` | **REQUIRED.** Canonical Tier 1/2/3 page mapping, the seven cluster ids, Rule 5 anchor disambiguation, queries-to-avoid (forbidden anchors), and the `surface` + `fan_out_subqueries` columns Steps 6 and 8 are built on. |
| `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (root) | The state of search. §2.3 fan-out, §3.6 doorway risk, §5 citation correlates, §9 the mole homograph, §12.3 this skill's rules. Overrides any conflicting claim in this SKILL.md or its references. |
| `clients/got-moles/projects/briefs/seo-foundation-recovery/brief.md` | Parent project. Sub 1.5 cannibalisation inventory feeds Step 6.5; Sub 4 sitewide audit consumes the per-page link plan output. |
| `clients/got-moles/projects/briefs/internal-linking-recovery/got-moles-internal-linking-strategy.md` | Roy's canonical strategy. 3-tier architecture, 8 audit gaps with named fixes, per-post topical mappings (§5.1 blog→location, §5.2 location→blog by archetype), anchor diversity rules, target link counts per page type. **Read with one 2026-09-02 amendment:** wherever it prescribes city-to-city cross-linking, Step 6b's cap applies instead. Everything else in it stands. |
| `clients/got-moles/projects/briefs/internal-linking-recovery/brief.md` | Active L2 project state — which phases are done, which are next. Don't duplicate work that's in flight. |
| Most recent audit in `clients/got-moles/projects/str-ai-seo-local/` | Latest local SEO/GEO/AI-visibility context. **Sort by date and read the newest — do not hard-code a filename.** The previously pinned `2026-05-05_audit.md` recorded a sitewide -1.5/-2 position slip after the April 20 deploy, a schema downgrade per blog post, and an internal-link density delta against the WordPress legacy site; newer audits supersede it. |

**Two auto-memory rules, now inlined.** This skill previously cited `feedback_per_post_topical_linking.md` and `feedback_unified_alternation_rule.md` from the auto-memory store. Neither file exists in that store as of 2026-09-02, so the rules are written into the skill body to stop them being lost:
- **Per-post topical linking.** Never add a blanket city-link footer block at template level. Use surgical per-post mapping. Anchor diversity beats link volume. (Also carried as a dated Rule below.)
- **Section background alternation.** Covered in Apply-Fixes Step A3 item 2.

**Got Moles-specific scoring weight nudges:**
- Cross-Linking Gaps weight stays 25% but applies an extra penalty if ANY of the 8 strategy-doc gaps are open
- Cluster and Fan-Out Coverage validates against the strategy's 3-tier model (Tier 1 authority hubs, Tier 2 supporting hubs, Tier 3 supporting content) **and** against the `fan_out_subqueries` sets in `target-keywords.md`
- Cluster pillar pages: the cornerstone "How to Get Rid of Moles in Your Yard" links out to every fan-out sub-answer in its cluster. The old "≥8 cluster spokes" target and the "12% → 41% AI citation uplift from hub-spoke" figure were retired on 2026-09-02 — the figure traced to an unsourced vendor page, and a spoke count is the wrong unit. Coverage of the fan-out set is the unit

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- 2026-09-02: Live crawl is the primary link-graph source. Run the DataForSEO On-Page crawl (Step 2a), then reconcile against the codebase (Step 2b/2c) and report the divergence. A code-only score is provisional and must be labelled as such in the report. This closes the error class the 2026-05-05 rule below records.
- 2026-09-02: Build clusters around fan-out sub-queries, not city names. Every fan-out sub-answer must be reachable in one hop from the page that ranks. Read `fan_out_subqueries` and `surface` from `target-keywords.md`; if those columns are absent, say so and run `str-keyword-strategy` first.
- 2026-09-02: City-page-to-city-page linking is capped. City pages link UP to service and informational hubs and OUT to genuinely local proof. A ring or mesh of near-duplicate city links is a doorway pattern and is now a finding to reduce, not a gap to close (`search-landscape-2026-09.md` §3.6).
- 2026-09-02: No anchor-distribution percentages. The two conflicting splits this skill carried (40/40/20 and 40/30/30) were both unsourced trade claims and are removed. Score anchor diversity, brand presence, destination alignment and disambiguation-guard compliance instead. Branded anchors correlate 0.511–0.628 with AI visibility, above Domain Rating.
- 2026-09-02: No word-count-derived link density. "2-5 contextual links per 1,000 words" is gone. Judge density by fan-out coverage. Word count correlates 0.04 with AI Overview citation.
- 2026-09-02: This skill detects cannibalisation and never executes it. Merges, 301s, redirect-map and sitemap updates and thin-page culls all belong to the `## Cannibalisation Cull — Apply-Fixes Procedure` section of `str-onpage-audit` (steps C1 to C5). Produce the inbound-link inventory with anchor text that its C1 evidence gate requires, and label a pair `candidate` unless all three C1 evidence sources agree.
- 2026-09-02: Every page mentioning "mole" links to the canonical disambiguation page. If that page does not exist, raise it as a P1 content finding for `mkt-authority-content` rather than silently skipping the rule.
- 2026-05-08: Phase 0 currency audit — added `target-keywords.md` as REQUIRED context input; Step 5 Rule 5 disambiguation guard (lawn signal in anchors, never anchor with `mole removal` alone); Step 6 cluster validation aligned to canonical Tier 1/2/3; new Step 6.5 cannibalisation detection (cross-reference link destinations against duplicate-URL inventory); Step 9 per-page link plan deliverable for `str-onpage-audit` handoff.
- 2026-05-05: For Got Moles, never recommend a blanket footer city-link block as a fix for blog→location gaps. Strategy §5.1 requires per-post topical mapping. Recommend specific blog↔location pairs (e.g. "What Attracts Moles" → Sammamish/Bellevue/Kirkland; "When Moles Most Active" → Puyallup/Tacoma/Auburn) not generic 24-city footers. *(Reinforced 2026-09-02 by the doorway gate in Step 6b. The auto-memory file this rule cited, `feedback_per_post_topical_linking.md`, is no longer in the memory store — the rule is preserved here and in the Guardrails section.)*
- 2026-05-05: Always read the current pages-data.ts / city-data.ts / component source DIRECTLY. Don't carry forward findings from a prior audit without verification — between the prior audit and now, fixes may have shipped. The initial 2026-05-05 audit incorrectly scored service-to-service and service-to-city as "open" because it relied on April 16 audit findings; both were actually closed by commit c258c31 on April 19. Score difference: 50/100 (wrong) → 58/100 (correct after re-reading source). *(Superseded 2026-09-02 in its mechanism, not its lesson: reading source is no longer sufficient either. The live crawl in Step 2a is now the primary source and the codebase is the cross-check. The lesson — never score from a prior audit or an assumption — stands unchanged and applies to the crawl too: re-crawl, don't reuse a stale task id.)*

- 2026-04-16: Default to SEO/GEO weighting (cross-linking 25%, cluster/fan-out 25%, anchor 20%, orphans 15%, depth 10%, equity 5%). General weighting undervalues the pillars that actually drive rankings and AI citations. The site's weakest areas are exactly the ones that matter most for search.
- Every fix must include the exact file path to edit. "Add more internal links" is not actionable. "Add link from `app/(frontend)/about/page.tsx` line 47 to `/mole-control-tacoma/` with anchor 'mole control in Tacoma'" is.
- Crawl-first, codebase-second: the live crawl says what ships, the source says which file to edit. Never claim a link exists from either one alone when both are available, and never assume from page titles.
- Navigation and footer links count as links but carry less weight than contextual body links. Score both but flag pages that rely only on template links.
- For CMS sites: check both code-level links AND CMS content (richText, Lexical, block data). A link in pages-data.ts that gets seeded to the CMS is a real link, and a link that lives only in the CMS is real too — the crawl is what catches the second kind.
- Weight strategic pages (service pages, city pages, conversion pages) more heavily than informational pages. A missing link to a money page is higher priority than a missing link to an "About" page.
- Never quote a time or effort estimate in an audit, a fix list or any client-facing output. Rank by impact, risk, dependency order and reversibility.
- US English throughout in anything client-facing.

## Change log

### 2026-09-02 — landscape re-alignment and DataForSEO rewiring

Updated against `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (§2.3, §3.6, §5, §9, §12.3, §12.9) and the September 2026 skill audit.

**Methodology**
- Query fan-out is now the organizing concept for cluster topology (Step 6). Clusters are built around `fan_out_subqueries`, not city names, and every sub-answer must be reachable in one hop from the ranking page. [P] Google's generative-AI optimization guide names both effective internal linking and the fan-out mechanism.
- City-page-to-city-page linking capped (Step 6b), superseding the SearchPilot-backed "cross-link 3-6 nearest cities" recommendation. Driven by the doorway and scaled-content risk in landscape §3.6, where the 2026 failure mode is silent suppression rather than a manual action.
- Surface-aware link routing added (Step 8): informational content routes to transactional local pages because they win on different surfaces (Local Pack ~93% transactional local, AI Overviews ~92% informational).
- Branded anchors reframed as a brand signal, not only a relevance signal, on the Ahrefs 75,000-brand correlations (0.511–0.628, above Domain Rating).
- Entity-anchor rule added (Step 6d): every page mentioning "mole" links to one canonical disambiguation page, per landscape §9.
- Cannibalisation scope tightened (Step 6.5): detection stays here, execution moves to the `## Cannibalisation Cull — Apply-Fixes Procedure` section of `str-onpage-audit` (steps C1 to C5), and Step 6.5 now produces the C1 evidence gate inputs with a candidate/confirmed label.

**Data sources**
- DataForSEO On-Page full crawl is now the primary link-graph source (Step 2a), with the codebase as cross-check (2b) and an explicit provenance reconciliation (2c). Payload examples are `--dry` tested. A spend guard caps `max_crawl_pages`, disables resource loading and JS rendering, and requires the run to be reconciled against `.dataforseo-usage.log`.
- Rationale: the 2026-05-05 rule records an 8-point scoring error from code-only assessment, and CMS-only links were previously invisible to this skill entirely.

**Corrections**
- Removed the duplicate item 3 in Step 10 and renumbered.
- Fixed the mis-citation of `str-onpage-audit`'s internal-link check from "Step 4" to Pillar 2.5 (`### 2.5 Internal Links — Per-Page Link Plan`). That rubric moved from eight pillars to nine and the internal-links weight dropped from 15% to 10% as AI crawlability took the top slot; the 2.5 number is unchanged.
- Named `str-keyword-strategy` as the upstream producer of `target-keywords.md`, which the Context Needs table already marked REQUIRED.
- Removed the superseded 40/40/20 anchor block and the competing 40/30/30 block. No evidenced split exists; four principles replace them.
- Retired unsourced statistics: orphan crawl-budget and recovery percentages, the depth crawl-frequency percentages and the PageRank-retention column, the broken-link industry rate, the hub-and-spoke AI-citation uplift, and the "December 2025 Helpful Content Update" attribution.
- Removed word-count-derived link density.
- Replaced the hard-coded `2026-05-05_audit.md` guardrail path with a newest-file lookup.
- Inlined the two auto-memory rules whose files are no longer in the memory store.
- Routing now names only skills installed in this workspace; backlink questions route to `str-authority-strategy`.
- Applied the standard output path and the Notion push rule, and added crawl provenance and spend to the report frontmatter.

## Self-Update

If the user flags an issue with the output — wrong scoring, missed links, bad priorities, incorrect file paths — update the `## Rules` section in this SKILL.md immediately with the correction and today's date. Do not just log it to learnings. Fix the skill so it does not repeat the mistake.

Format: `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`
