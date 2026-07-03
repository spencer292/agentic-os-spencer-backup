---
name: str-internal-links
description: >
  Internal link audit AND apply-fixes skill for websites where you have codebase access.
  Audit mode crawls routes, components, and page data to map every internal link, then scores
  the structure against 6 pillars (orphan pages, link depth, anchor text, hub-and-spoke
  topology, link equity flow, cross-linking gaps) and produces a prioritized fix list with
  exact files to edit. Apply-fixes mode takes an existing audit's P1/P2 fix list and executes
  the edits directly — adds block-level cross-links to service/city pages, injects in-content
  markdown links into blog post bodies, and reseeds affected CMS content.
  Use for internal linking audits, orphan pages, link depth, cross-linking, link equity,
  apply-fixes from a prior audit, or implement-internal-links requests. Do NOT use for
  external/backlink analysis or CRO audits (use str-cro-audit instead).
---

# Internal Link Audit

Audit a website's internal link structure from the codebase. Every link mapped, every gap found, every fix prioritized.

## Outcome

**Produces:** Scored audit report saved to `projects/str-internal-links/{YYYY-MM-DD}_{site-name}-audit.md`.

Includes: link map, 6-pillar score, orphan page list, link depth chart, anchor text analysis, hub-and-spoke validation, cross-linking gaps, and prioritized fix list with exact file paths.

Always save output to disk. This is not optional. After saving, show the user the full absolute file path so they can click it directly.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/target-keywords.md` | full | Canonical Page → Primary Keyword map (Tier 1/2/3) + cluster definitions + brand-disambiguation Rule 5 (anchor text). REQUIRED — if missing, warn user and recommend running `str-keyword-strategy` first |
| `brand_context/positioning.md` | summary | Understand which pages are strategic priorities |
| `brand_context/icp.md` | summary | Know user journey to validate link paths |
| `context/learnings.md` | `## str-internal-links` section | Past audit feedback |

## Skill Relationships

**Upstream (reads from):**
- `viz-page-architect` — page blueprints define intended link structure to audit against
- `str-ai-seo` — GEO recommendations may require specific internal link patterns
- `ops-cms-content` — CMS page data defines what pages exist

**Downstream (feeds into):**
- `mkt-authority-content` — audit findings inform where blog posts need links added
- `ops-blog-pipeline` — blog posts should link to pages identified as under-linked
- `str-ai-seo` — internal linking supports topical authority for AI citations
- Build tasks — fix list drives direct code changes

**Trigger boundaries:**
- "backlink analysis" or "external links" -> NOT this skill (external SEO tool)
- "CRO audit" or "conversion review" -> `str-cro-audit`
- "page structure" or "blueprint" -> `viz-page-architect`
- "redirect audit" -> separate task (though this skill flags redirect chains in internal links)

## Step 1: Load Context

Read `context/learnings.md` -> `## str-internal-links` for past corrections.

Read `brand_context/positioning.md` (summary) to understand which pages carry the most strategic weight. These become "priority pages" that need the strongest internal link support.

Read `brand_context/icp.md` (summary) to understand the visitor's journey. Internal links should mirror how visitors naturally move through the site.

## Step 2: Map the Site Structure

This is a codebase audit, not an external crawl. Read the source files to build the complete link map.

**For Next.js / App Router sites:**

1. **Discover all routes** — scan `app/` directory for `page.tsx` files. Each route = one node in the link graph.

2. **Scan page data files** — read pages-data.ts, city-data.ts, or equivalent. These define CMS block content that contains links.

3. **Scan components** — read layout files (header, footer, navigation), shared components, and page-specific components. Extract every `<Link>` and `<a>` element with its:
   - Source page (where the link lives)
   - Destination URL (where it points)
   - Anchor text (the clickable text)
   - Context (navigation, footer, body content, CTA, breadcrumb)
   - Link type (contextual body link vs template/nav link)

4. **Scan CMS content** — if the site uses a CMS (Payload, Sanity, etc.), check for richText fields that may contain links not visible in static code. Query the database or read seed scripts.

5. **Scan blog posts** — read all blog content files for internal links.

6. **Build the link graph** — create a data structure mapping every page to its inbound links, outbound links, anchor texts, and link types.

Read `references/discovery-patterns.md` for framework-specific file patterns.

## Step 3: Orphan Page Detection

An orphan page has zero contextual internal links pointing to it. Navigation/footer links alone are insufficient for strong SEO signals.

**Why this matters:** Orphan pages waste 26% of crawl budget on average for local businesses while generating only 5% of organic traffic. 76.6% of previously orphaned pages improve rankings when internal links are added (Niche Pursuits, 108-link case study).

**Check for:**
- Pages with zero inbound internal links (true orphans)
- Pages with ONLY nav/footer links (functional orphans — no contextual body links)
- Pages linked only from sitemap.xml (crawlable but not discoverable via link graph)
- Redirect targets that have no direct links (only reached via redirect)

**Score:** 0-10 based on orphan ratio. Zero orphans = 10. More than 20% orphan ratio = 0-3.

## Step 4: Link Depth Analysis

Link depth = minimum clicks from homepage to reach a page. Pages beyond 3 clicks get 89% fewer crawl visits. Crawl frequency drops 82% between depth 1 and depth 5.

**Measure:**
- Click depth for every page (BFS from homepage)
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

Anchor text tells Google what the destination page is about. Pages with at least one exact-match anchor receive 5x more traffic (Zyppy, 23M links). High anchor diversity correlates with position 1.3 vs 3.5 for low diversity (AuthorityHacker).

**Analyze per destination page:**
- Total unique anchor texts pointing to it
- Anchor text distribution by type — branded / exact match / partial match / descriptive / generic / URL
- Flag over-optimization: >80% exact match to any single page
- Flag identical-pattern repetition: same exact anchor used >5x sitewide (anchor-spam signal — see `feedback_per_post_topical_linking.md`)
- Flag wasted anchors: "click here", "read more", "learn more" (15% of all anchors are generic per LinkStorm)
- Flag anchor-destination misalignment: anchor text has no relevance to destination page topic

**Target distribution (2026 industry standard, per 12AM Agency / Carnegie / LinkDoctor):**
- 40% branded ("Got Moles", "the Got Moles team", "see how we do it")
- 30% keyword (exact + partial match — "mole control Seattle", "professional mole trapping")
- 30% generic / LSI ("see our process", "compare options", "learn more")

Within the 30% keyword bucket, aim for 15-25% exact-match anchors to priority pages (Zyppy 5x traffic finding).

Optimal anchor length: 2-5 words.

**Disambiguation guard (when `target-keywords.md` is loaded).** Apply Rule 5 from the brand-disambiguation strategy:
- Every anchor pointing to a mole-control / mole-removal page must carry a **lawn signal** (one of: `lawn`, `yard`, `garden`, `Washington`, `Seattle/Tacoma/Olympia`, `Got Moles`, `professional`, `trapping service`)
- **Forbidden anchor:** `mole removal` alone — collapses to dermatology intent in AI Overviews and burns equity. Always qualify: `lawn mole removal`, `professional mole removal`, `mole removal in Tacoma`
- **Forbidden anchor:** anchors from queries-to-avoid clusters in target-keywords.md (`mole removal cost`, `mole removal near me` ambiguous variants, etc.)

Flag any internal link whose anchor fails the disambiguation guard. Rewrite recommendation must include the lawn signal.

**Score:** 0-10 based on diversity and alignment. Strong varied anchors with keyword inclusion + disambiguation guard passing = 10. Mostly generic, over-optimized, or disambiguation-failing = 0-3.

## Step 6: Hub-and-Spoke Validation

Topic clusters with strong internal linking build topical authority. This is now a meaningful ranking signal (December 2025 Helpful Content Update).

**For each content cluster, verify:**
- Hub page exists and links to all spoke pages
- Every spoke links back to hub
- Spokes cross-link to 2-3 related spokes within the same cluster
- No cross-cluster pollution (spokes linking to irrelevant hubs)

**For local service sites specifically:**
- Service hub page links to all service detail pages
- Location hub ("Areas We Serve") links to all city pages
- Each city page links to relevant service pages
- Each service page links to relevant city pages
- City pages cross-link to 3-6 nearest neighboring cities (SearchPilot: +7% organic traffic)
- Blog posts link to relevant service AND city pages

**When `target-keywords.md` is loaded — align cluster validation to canonical Tier 1/2/3.** Don't invent your own hub-spoke topology when the canonical mapping exists:

- **Tier 1 (Authority pages)** — homepage, service pages, key cornerstones (e.g. `/how-to-get-rid-of-moles-in-your-yard/`, `/voles-vs-moles-whats-the-difference/`, `/about/`). These MUST be linked from every Tier 2 hub and a relevant subset of Tier 3 spokes.
- **Tier 2 (Supporting hubs)** — `/reviews/`, `/service-areas/`, `/faq/`, `/blog/`, `/author/spencer/`. Each Tier 2 hub MUST link up to relevant Tier 1 + down to its Tier 3 spokes.
- **Tier 3 (City pages + blog posts)** — every Tier 3 page MUST link up to its Tier 1 cluster pillar + relevant Tier 2 hub + 2-3 sibling Tier 3 spokes (per cluster).

Validate that the link graph reflects this Tier 1/2/3 structure. Flag any Tier 1 page that's NOT linked from every Tier 2 hub. Flag any Tier 3 page missing its up-link to Tier 1 pillar.

**Score:** 0-10 based on cluster completeness. All clusters complete with cross-linking + Tier 1/2/3 alignment = 10. Missing hubs, broken cluster links, or Tier-mismatch = 0-3.

## Step 6.5: Cannibalisation Awareness (when duplicate-URL inventory exists)

If a cannibalisation inventory exists (e.g. Sub 1.5 of seo-foundation-recovery), cross-reference every internal link destination against the duplicate-URL list. Flag any internal link pointing to the **non-canonical version** of a duplicate pair.

For Got Moles specifically (per `target-keywords.md` Cannibalisation notes):
- `/are-moles-blind/` ↔ `/how-many-eyes-do-moles-have/` — confirm canonical, flag links to the loser
- `/blog/types-of-moles-in-washington/` ↔ `/what-species-of-moles-live-in-washington-state/` — same
- Trailing-slash duplicates, /blog/* vs legacy-root variants, /mole-repellant-{city}/ thin pages — every internal link should resolve to the canonical version with no 301 hop

This is a HIGH-impact pillar despite no separate score — every link to a non-canonical URL is wasted equity AND a redirect-chain risk.

## Step 7: Link Equity Flow Analysis

Internal links distribute authority (PageRank). Contextual body links carry more weight than navigation links. Links higher in content pass more equity.

**Analyze:**
- Pages with highest inbound internal links (authority concentrators)
- Pages with lowest inbound links relative to their strategic importance (equity-starved)
- Total outbound links per page (dilution check — keep under 150)
- Contextual vs template link ratio per page (target: majority contextual for strategic pages)
- Nofollow internal links (should be zero except login/cart — equity dissipates rather than redistributing)
- Redirect chains in internal links (always link to final destination)
- Broken internal links (35% of websites have them per Semrush)

**Density benchmark:** 2-5 contextual internal links per 1,000 words. Sweet spot for total links: 40-50 per page for maximum organic clicks (Zyppy, 23M links).

**Score:** 0-10 based on equity distribution alignment with strategic priorities.

## Step 8: Cross-Linking Gap Analysis

The highest-value finding: specific links that should exist but don't.

**Check these cross-link patterns:**

| From | To | Why |
|------|----|-----|
| Blog posts | Service pages | Content authority flows to money pages |
| Blog posts | City pages | Local relevance signal |
| Service pages | Related service pages | Cross-sell, topical authority |
| City pages | Nearby city pages | +7% organic traffic (SearchPilot) |
| City pages | Service pages available there | User journey completion |
| Reviews/testimonials | Service pages they reference | Social proof at point of decision |
| Reviews | City pages they reference | Local trust signal |
| Case studies | Service + city pages | Proof supporting money pages |
| FAQ pages | Service pages answering the question | Contextual relevance |

**Generate specific recommendations:** "Add link from [source page] to [destination page] with anchor text '[suggested anchor]' in [specific location in the content]."

**Score:** 0-10 based on cross-linking completeness. All natural cross-links present = 10. Major gaps in service-city or blog-service linking = 0-3.

## Step 9: Score and Prioritize

### Overall Score

```
## Internal Link Audit Score: X/100

| Pillar | Score | SEO/GEO Weight | Weighted |
|--------|-------|----------------|----------|
| Cross-Linking Gaps | X/10 | 25% | X |
| Hub-and-Spoke | X/10 | 25% | X |
| Anchor Text | X/10 | 20% | X |
| Orphan Pages | X/10 | 15% | X |
| Link Depth | X/10 | 10% | X |
| Link Equity Flow | X/10 | 5% | X |
```

### Per-Page Link Plan (deliverable for downstream consumption)

For every Tier 1 + Tier 2 page, produce this table — used by `str-onpage-audit` apply-mode and any per-page build work:

| Page | Tier | Inbound links (current) | Inbound links (target — gaps) | Outbound links (current) | Outbound links (target — gaps) | Anchor candidates (Rule 5 compliant) |
|---|---|---|---|---|---|---|

For Tier 3 (city + blog), produce a condensed version (one row per page or one row per cluster summarising patterns).

This table is the canonical handoff to `str-onpage-audit`'s per-page link-plan check (see Step 4 of that skill's rubric).

### Prioritized Fix List

Rank every fix by impact and effort:

| Priority | Fix | Impact | Effort | File(s) to Edit |
|----------|-----|--------|--------|-----------------|
| P1 | [description] | High | Low | `path/to/file.tsx` |
| P2 | ... | ... | ... | ... |

**Priority rules:**
- P1 (fix now): Cross-linking gaps to money pages, missing hub-spoke links, broken links
- P2 (fix this sprint): Anchor text optimization, orphan pages, city cross-linking expansion
- P3 (scheduled): Blog cross-linking, FAQ-to-service links, anchor diversity
- P4 (monitor): Minor depth issues, low-priority page linking

## Step 10: Save and Present

1. Save the audit to `projects/str-internal-links/{YYYY-MM-DD}_{site-name}-audit.md` with YAML frontmatter:
   ```yaml
   ---
   site: [site-name]
   date: [YYYY-MM-DD]
   score: [X/100]
   orphan_pages: [count]
   fixes_p1: [count]
   fixes_total: [count]
   status: draft
   ---
   ```

2. Show the user the full absolute file path.
3. Push the report to Notion for review — Notion is the Got Moles review mechanism (Spencer + team review there). Create the page under the Got Moles project via the Notion MCP (`mcp__claude_ai_Notion__notion-create-pages`).

3. Present the summary: overall score, worst pillar, top 5 fixes.

4. Ask for feedback: "How does this audit land? Any pages I should have weighted differently?"

5. Log feedback to `context/learnings.md` under `## str-internal-links`.

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
2. Insert the required block(s) at the right position to preserve the site's alternation rule (see `feedback_unified_alternation_rule.md` for Got Moles — parity via added blocks, end in grass before CTA). If in doubt, add two blocks rather than one to avoid flipping downstream backgrounds.
3. Use existing block types (`featureGrid`, `serviceArea`, `richContent`, `cta`) rather than inventing new types. `featureGrid` supports `link` + `linkText` per item. `serviceArea` supports arbitrary city name + URL pairs.
4. Prefer keyword-rich anchor text: "Mole Control in Bellevue" > "Bellevue", "See Year-Round Mole Protection" > "Learn More" (Zyppy 5x traffic for exact-match anchors).

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
| `clients/got-moles/brand_context/target-keywords.md` | **REQUIRED.** Canonical Tier 1/2/3 page mapping + cluster definitions + Rule 5 anchor disambiguation + queries-to-avoid (forbidden anchors). |
| `clients/got-moles/projects/briefs/seo-foundation-recovery/brief.md` | Parent project. Sub 1.5 cannibalisation inventory feeds Step 6.5; Sub 4 sitewide audit consumes the per-page link plan output. |
| `clients/got-moles/projects/briefs/internal-linking-recovery/got-moles-internal-linking-strategy.md` | Roy's canonical strategy. 3-tier hub-and-spoke architecture, 8 audit gaps with named fixes, per-post topical mappings (§5.1 blog→location, §5.2 location→blog by archetype), anchor diversity rules, target link counts per page type. |
| `feedback_per_post_topical_linking.md` (auto-memory) | Hard rule: never add blanket city-link footer blocks at template level. Use surgical per-post mapping. Anchor diversity > link volume. |
| `feedback_unified_alternation_rule.md` (auto-memory) | Section background alternation when adding new blocks via apply-fixes. |
| `clients/got-moles/projects/briefs/internal-linking-recovery/brief.md` | Active L2 project state — which phases are done, which are next. Don't duplicate work that's in flight. |
| `clients/got-moles/projects/str-ai-seo-local/2026-05-05_audit.md` | Latest SEO/GEO audit context — sitewide -1.5/-2 position slip post-Apr-20 deploy, schema downgrade per blog post, internal-link density delta vs WordPress legacy. |

**Got Moles-specific scoring weight nudges:**
- Cross-Linking Gaps weight stays 25% but applies extra penalty if ANY of the 8 strategy doc gaps are open
- Hub-and-Spoke validation against the strategy's 3-tier model (Tier 1 authority hubs, Tier 2 supporting hubs, Tier 3 supporting content)
- Cluster pillar pages: cornerstone "How to Get Rid of Moles in Your Yard" must link to ≥8 cluster spokes per industry benchmark + AI citation impact (12% → 41% with hub-spoke per topical-authority research)

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- 2026-05-08: Phase 0 currency audit — added `target-keywords.md` as REQUIRED context input; Step 5 Rule 5 disambiguation guard (lawn signal in anchors, never anchor with `mole removal` alone); Step 6 Hub-and-Spoke aligned to canonical Tier 1/2/3; new Step 6.5 cannibalisation awareness (cross-reference link destinations against duplicate-URL inventory); Step 9 per-page link plan deliverable for str-onpage-audit handoff.
- 2026-05-05: For Got Moles, never recommend a blanket footer city-link block as a fix for blog→location gaps. Strategy §5.1 + `feedback_per_post_topical_linking.md` require per-post topical mapping. Recommend specific blog↔location pairs (e.g. "What Attracts Moles" → Sammamish/Bellevue/Kirkland; "When Moles Most Active" → Puyallup/Tacoma/Auburn) not generic 24-city footers.
- 2026-05-05: Always read the current pages-data.ts / city-data.ts / component source DIRECTLY to score Hub-and-Spoke + Cross-Linking pillars. Don't carry forward findings from a prior audit without verification — between the prior audit and now, fixes may have shipped. Initial 2026-05-05 audit incorrectly scored service-to-service + service-to-city as "open" because relied on April 16 audit findings; both were actually closed by commit c258c31 on April 19. Score difference: 50/100 (wrong) → 58/100 (correct after re-reading source). Spend the extra read time before scoring.

- 2026-04-16: Default to SEO/GEO weighting (cross-linking 25%, hub-spoke 25%, anchor 20%, orphans 15%, depth 10%, equity 5%). General weighting undervalues the pillars that actually drive rankings and AI citations. The site's weakest areas are exactly the ones that matter most for search.
- Every fix must include the exact file path to edit. "Add more internal links" is not actionable. "Add link from `app/(frontend)/about/page.tsx` line 47 to `/mole-control-tacoma/` with anchor 'mole control in Tacoma'" is.
- Codebase-first: read the actual source files before making claims about what links exist. Never assume from page titles alone.
- Navigation and footer links count as links but carry less SEO weight than contextual body links. Score both but flag pages that rely only on template links.
- For CMS sites: check both code-level links AND CMS content (richText fields, block data). A link in pages-data.ts that gets seeded to CMS is a real link.
- Weight strategic pages (service pages, city pages, conversion pages) more heavily than informational pages. A missing link to a money page is higher priority than a missing link to an "About" page.
- Cross-link nearby cities for local service sites. The SearchPilot split test proved +7% organic traffic from linking to 6 nearest neighboring location pages.

## Self-Update

If the user flags an issue with the output — wrong scoring, missed links, bad priorities, incorrect file paths — update the `## Rules` section in this SKILL.md immediately with the correction and today's date. Do not just log it to learnings. Fix the skill so it does not repeat the mistake.

Format: `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`
