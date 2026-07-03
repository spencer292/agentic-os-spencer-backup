---
name: str-onpage-audit
description: >
  Per-page on-page SEO/GEO/AEO audit AND apply-fixes skill for codebase-accessible sites. Audit mode reads `brand_context/target-keywords.md` (primary keyword + cluster mapping per page) + `brand_context/authority-strategy.md` (per-cluster authority signals) + the latest Pixelmojo Radar AEO benchmark, then audits every page on H1/H2/H3 keyword alignment, meta tags, schema completeness (Speakable + BreadcrumbList + Article+dateModified + FAQPage aggregation + Organization knowsAbout/hasOfferCatalog), AEO content shape (answer-first paragraph, Q-format H2s, stat blocks, tables/ordered lists, verified-fact callouts, hallucination-correction surface), per-page internal-link plan (inbound + outbound + anchor diversity per Rule 5), images (alt + dimensions + WebP + hero fetchpriority), E-E-A-T (author byline + Person sameAs + outbound authority), brand disambiguation (lawn/exterminator signal where applicable), and freshness (dateModified field + Last-Modified header). Produces a scored audit report with per-page fix list. Apply-fixes mode executes the fixes directly. Use when the user mentions: "on-page audit", "SEO audit", "AEO audit", "page audit", "audit my pages", "score this page for SEO/AEO", "fix H1s sitewide", "audit H2s against keywords", "page-level SEO/GEO audit", "implement onpage fixes", "apply audit fixes". Foundation skill — runs DOWNSTREAM of `str-keyword-strategy` + `str-authority-strategy` (both REQUIRED). Used adjacent to `str-internal-links` (consumes its per-page link plan), `str-cro-audit` (orthogonal — conversion not search), `str-ai-seo` / `str-ai-seo-local` (sitewide audit; this skill is page-level). Does NOT trigger for: keyword research (use `str-keyword-strategy`), authority/backlink strategy (use `str-authority-strategy`), conversion audits (use `str-cro-audit`), internal-linking-only audits (use `str-internal-links`).
---

# On-Page SEO / GEO / AEO Audit

Per-page audit and apply-fixes skill. Audits every page on the site against validated foundation docs (target-keywords.md + authority-strategy.md) and the latest 3rd-party AEO benchmark (Pixelmojo Radar by default). Emits a scored audit + per-page fix list with explicit file paths. Apply-fixes mode executes the fixes.

This is the **audit-skill pattern** named in `meta-skill-creator`: foundation-doc consumption + per-page structured handoff to apply-mode + recurring 3rd-party benchmark input.

## Outcome

**Produces:** Scored audit report saved to `projects/str-onpage-audit/{YYYY-MM-DD}_{site-name}-audit.md`.

Includes:
- Site-wide score (0-100) across 8 audit pillars
- Per-page audit table (one row per page, all 8 pillars scored)
- Per-page fix list with explicit file paths
- Per-page link plan (inbound + outbound + anchor candidates)
- Hallucination-correction surface progress (if applicable)
- Apply-mode handoff: P1/P2/P3 prioritised fix queue

Always save output to disk. After saving, show the user the full absolute file path.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/target-keywords.md` | **REQUIRED, full** | Per-page primary keyword, cluster, recommended H1, secondary keywords for H2/H3, brand-disambiguation rules, queries-to-avoid, canonical_facts |
| `brand_context/authority-strategy.md` | **REQUIRED, full** | Per-cluster authority anchors, hallucination-correction matrix, brand defense, multi-location patterns |
| `brand_context/design-system.md` | tokens + image rules | Hero image rules, alt-text patterns, schema conventions |
| `brand_context/positioning.md` | summary | Differentiation messaging audit |
| `brand_context/icp.md` | summary | Audience-language audit |
| `context/learnings.md` | `## str-onpage-audit` section | Past audit feedback |

If `target-keywords.md` or `authority-strategy.md` is missing, **stop**. Tell the user to run `str-keyword-strategy` (then `str-authority-strategy`) first. Per `meta-skill-creator` Pre-Scaffold Guardrails: foundation-doc consumption is non-negotiable.

## Skill Relationships

**Upstream (REQUIRED):**
- `str-keyword-strategy` produces target-keywords.md
- `str-authority-strategy` produces authority-strategy.md (depends on target-keywords.md)

**Upstream (recurring benchmark):**
- Pixelmojo Radar AI Visibility Report (`~/Downloads/ai-visibility-report-{domain}-{date}.json`) — primary AEO recency benchmark. Read in Step 0 if present.

**Adjacent (read for cross-reference):**
- `str-internal-links` — its per-page link plan (Step 9 deliverable) is the inbound/outbound source of truth. If a recent str-internal-links audit exists, ingest it rather than re-deriving.
- `str-ai-seo` / `str-ai-seo-local` — sitewide audit pillars; this skill is page-level. Read latest sitewide audit for context.
- `str-cro-audit` — orthogonal (conversion not search). Some overlap on Core Web Vitals + image rules; defer to str-cro-audit on conversion concerns.

**Downstream:**
- Build tasks — fix list drives direct code changes
- `mkt-copywriting` — copy-rewrite recommendations from BLUF / answer-first / disambiguation gaps
- `ops-cms-content` — schema fixes + meta tag updates surface here; CMS content skill executes

**Trigger boundaries:**
- "audit conversion" / "CRO audit" → `str-cro-audit`
- "internal link audit only" → `str-internal-links`
- "sitewide AEO score" → `str-ai-seo-local` (Got Moles) or `str-ai-seo` (others)
- "build a keyword strategy" → `str-keyword-strategy`

## Refresh

Quarterly default; trigger-based on:
- New Pixelmojo report (or equivalent 3rd-party AEO audit)
- target-keywords.md or authority-strategy.md refresh
- Post-deploy verification of any major page batch
- Hallucination-correction matrix re-test cycle (re-test dates per authority-strategy Section 8.4)

## Before You Start

Confirm scope:
1. **Run mode:** "Full sitewide audit, single-page audit, or apply-fixes from existing audit?"
2. **Scope filter:** "All pages, Tier 1 only (authority pages from target-keywords.md), or specific URL list?"
3. **Verify foundation docs exist** — if either target-keywords.md or authority-strategy.md is missing, stop and instruct user to run upstream skills first.
4. **Re-audit gate (Rule H below):** If this run is a *post-fix re-audit* (not a fresh audit), explicitly state so. Re-audits MUST run the full evidence chain. No projecting pillar lifts from "fix landed = +X". If any internal monologue says "estimated score lift" / "should clear ≥90 with these fixes" — stop and run the actual extractor.
5. **Page Structure Checklist gate (apply-fixes mode only):** Before any `pages-data.ts` insert/edit, run all 7 rules of `brand_context/design-system.md` Page Structure Checklist (line 625-637 in Got Moles). Treat the checklist as a gate, not a reference. The Section component's background enum is NOT a menu of valid options — the checklist explicitly bans `cream`, `blue` (standalone), and mid-page `gradient`. Verify each insert against all 7 rules before code change.
6. **Visual verification commitment:** Live HTML correctness ≠ visual correctness. Plan a browser-render check after every commit, not just an extractor probe. Test pages at `/test/{name}` exist for this purpose on Got Moles + ATP.

## Step 0: Foundation + Benchmark Load

Read in this order — don't skip any:

1. **Foundation docs** — target-keywords.md (full), authority-strategy.md (full), design-system.md, positioning.md (summary), icp.md (summary)
2. **Latest 3rd-party AEO audit** — check `~/Downloads/` for `ai-visibility-report-{domain}-{date}.json`. If present and ≤30 days old, ingest its `recommendations[]`, `actions[]`, `aiSummary.context` for each pillar (citation, answer, aeo, hallucinationCheck, schemaAudit). These define the recency benchmark.
3. **Cannibalisation inventory** — read target-keywords.md cannibalisation notes; ingest the canonical-vs-loser URL pairs.
4. **Adjacent audit context** — check `projects/str-internal-links/` and `projects/str-ai-seo-local/` (or str-ai-seo) for recent audits. If found, ingest the per-page link plan + sitewide audit context. Don't re-derive what's been audited recently.
5. **Past learnings** — `context/learnings.md` → `## str-onpage-audit` section.

Output a brief status before starting: "Loading X clusters from target-keywords.md, Y authority anchors from authority-strategy.md, Pixelmojo benchmark dated Z, N adjacent audits found."

## Step 1: Discover Pages

Scan the codebase to enumerate every page that needs auditing.

For Next.js / Payload sites (the default Got Moles + ATP stack):
- `src/app/**/page.tsx` — every route
- `src/lib/pages-data.ts` — block-based CMS pages
- `src/lib/blog-data.ts` — blog posts
- `src/lib/city-data.ts` (or equivalent) — programmatic city/location pages
- Dynamic route enumeration via `generateStaticParams`

Cross-reference page list against target-keywords.md Tier 1/2/3 mapping. Flag any page on the site NOT mapped in target-keywords.md (gap) and any page in target-keywords.md NOT live on the site (gap).

## Step 2: Per-Page Audit (8 Pillars)

For each page in scope, run all 8 pillars. Score 0/0.5/1 per signal; sum to a per-page score normalised to 100.

### 2.1 Headings (Pillar weight 20%)

- **H1 unique on the page** — exactly one H1
- **H1 matches recommended H1 from target-keywords.md** — exact phrase or close variant; carries primary keyword
- **H1 carries disambiguation signal** if applicable (per target-keywords.md Brand-Disambiguation Rule 1: lawn / yard / exterminator / Washington / city / brand)
- **H2/H3 carry secondary cluster keywords** — at least 2 H2/H3 contain secondary keywords from the page's cluster (per target-keywords.md cluster query table)
- **No skipped heading levels** (H1 → H3 without H2 = fail)

### 2.2 Meta + Canonical (Pillar weight 10%)

- **Title tag 50-60 chars** + carries primary KW + brand
- **Meta description 150-160 chars** + carries primary KW + clear value prop
- **Canonical tag** points to the canonical URL (especially important per cannibalisation inventory)
- **Open Graph tags** present (og:title, og:description, og:image)
- **Twitter card** tags present
- **og:image** present + correct dimensions (1200×630)

### 2.3 Schema / Structured Data (Pillar weight 15%)

- **Correct schema type** for the page (LocalBusiness for homepage, Service for service pages, Article for blog, FAQPage for FAQ, AboutPage for /about/, etc.)
- **BreadcrumbList** sitewide (every non-root page)
- **Article schema with dateModified** (blog posts + Article-typed pages) — not just datePublished
- **AboutPage / WebPage `mainEntity`** uses **referenced** `@id` pattern (`{ "@id": "https://example.com/#organization" }`), NOT embedded inline copy. Sitewide entities (Organization / LocalBusiness) defined ONCE, referenced everywhere via `@id`. Embedded duplicates trigger Google "could not pick canonical entity" warnings + fields drift.
- **FAQPage aggregation rule** — if page has multiple FAQ blocks, ONE combined FAQPage emitted (per `feedback_one_faqpage_per_page.md`)
- **Speakable schema** with cssSelector array on Article + WebPage pages targeting H1 + main H2s. Schema.org spec restricts speakable to WebPage/Article — for Service / FAQPage primary nodes, emit a small companion WebPage node carrying the selector.
- **Organization schema** sitewide with knowsAbout + hasOfferCatalog (if e-commerce / pricing) + sameAs population
- **Person schema** on author byline pages with worksFor + sameAs
- **No malformed JSON-LD** (validates via Rich Results Test)

**How to verify:** WebFetch's text summary STRIPS `<script type="application/ld+json">` blocks. Always verify schema by extracting raw HTML — write a one-shot Node fetch script (template in `references/audit-checklist.md` § Live verification) that parses every `<script type="application/ld+json">` and dumps the JSON. Don't trust WebFetch summaries for schema audits.

### 2.4 Content Shape — AEO Patterns (Pillar weight 20%)

This pillar reflects 2026 GEO research (see `mole-content-authority/.planning/research/METHOD.md`; Princeton GEO study; Conductor/Stackmatix retrieval studies). Highest-weight pillar because passage-level extraction is what decides AI citation.

- **BLUF / answer-first paragraph** — a **40–60-word** direct answer to the page's primary question, immediately under H1, in the searcher's own terms (~44% of AI citations come from the first 30% of the text). State the principle; don't quote the old unsourced "+115%".
- **Chunked, self-contained H2 sections** — each H2 section is **200–400 words**, **stands alone**, and **opens with its own 40–75-word direct answer** before elaborating. One concept per section (don't mix definition with how-to). LLMs extract atomic chunks, not whole pages.
- **Question-format H2s** — H2s phrased as the actual queries (from target-keywords.md / PAA); at least half are natural-language questions.
- **Cited-statistic cadence** — **one specific statistic per ~150–200 words**, with inline attribution to `.gov`/`.edu`/extension (WSU) or Got Moles' own job data. (Princeton: statistics + quotations + cited sources ≈ +40% generative visibility — the most-replicated GEO finding.)
- **At least one extractable structured asset** — a comparison/data table, numbered steps, or a stat block (disproportionately pulled into AI answers). Cost → price table; myth → works-vs-doesn't table; seasonal → month table; ID → comparison table.
- **Verified-fact callouts** — canonical_facts from target-keywords.md (founding year, pricing, locations) where applicable; ties to the hallucination-correction matrix.
- **No queries-to-avoid in title/H1/FAQ** — verify per target-keywords.md Brand-Disambiguation Strategy.
- **NO visible TL;DR / "AI summary" boxes** — answer-first prose + semantic HTML only (established Got Moles pattern; AEO must be invisible infrastructure).

### 2.5 Internal Links — Per-Page Link Plan (Pillar weight 15%)

Read from `str-internal-links` audit if recent; otherwise derive.

- **Inbound link count** — page has ≥2 inbound links from related cluster pages
- **Outbound link count** — page links to ≥1 related cluster page + parent service / pillar
- **Anchor diversity** — no single anchor phrase dominates inbound; per target-keywords.md Rule 5
- **Disambiguation guard** — anchors carry lawn/exterminator/geo signal where the destination page targets ambiguous head terms
- **No links to cannibalisation losers** — every internal link resolves to canonical version (no 301-hop)
- **Hub-spoke alignment** — Tier 3 spoke links UP to its cluster pillar; Tier 2 hub links to all relevant Tier 1 + down to its Tier 3

Output: per-page link plan row in the audit (inbound present + missing, outbound present + missing, anchor candidates from target-keywords.md cluster + Rule 5).

### 2.6 Images (Pillar weight 5%)

- **Alt text** present + descriptive (not stuffed). For sitewide auto-generated alts (e.g. HeroBlock fallback pattern `{heading} — {suffix}`), check for redundant geo/service repetition when heading already carries those signals.
- **Explicit width/height OR aspect-ratio container** for CLS prevention. Next.js `<Image fill>` inside an `aspect-[3/4]` parent counts as compliant (parent reserves space).
- **WebP format**
- **Hero image** has `priority` (Next.js) which emits `fetchpriority="high"` + `loading="eager"` at runtime
- **Below-fold images** have `loading="lazy"` (Next.js `<Image>` default when no `priority` prop)
- **og:image** matches page topic

**How to verify (Next.js sites):** WebFetch parsers commonly miss `next/image` runtime-emitted attributes (`fetchpriority`, `loading`, dimensions when `fill` mode). Always cross-check the actual component source code — read `src/components/blocks/HeroBlock.tsx`, `TeamCardsBlock.tsx`, etc. — to confirm `priority`, `fill`, `sizes`, `aspect-*` parent. WebFetch image audits alone undercount and produce false negatives.

### 2.7 E-E-A-T (Pillar weight 10%)

- **Author byline** present on Article-typed pages
- **Author byline links to Person schema page** (e.g. /author/spencer/)
- **Person schema sameAs** populated (LinkedIn, professional profiles)
- **Outbound to authoritative source** — at least 1 link to a Tier 1 authority anchor from authority-strategy.md per relevant cluster
- **Founder / expert quote** on relevant pages (per Princeton GEO study + authority-strategy Section 5 co-citation)

### 2.8 Freshness + Disambiguation (Pillar weight 5%)

- **dateModified** field in Article schema
- **Last-Modified HTTP header** returned by server
- **Visible publish + updated date** in page UI
- **Disambiguation signal in title + H1** for any page targeting an ambiguous root term (per target-keywords.md Rule 1)

## Step 3: Score + Prioritise

### Per-page score

Sum the 8 pillars to a per-page score / 100. Categorise:
- **Excellent (90-100)** — defend
- **Good (75-89)** — minor lifts
- **Needs work (60-74)** — P2 fixes
- **Poor (<60)** — P1 fixes

### Sitewide score

Average per-page across the site, weighted by Tier (Tier 1 pages weighted 3×, Tier 2 weighted 2×, Tier 3 weighted 1×).

### Prioritised fix list

Generate P1/P2/P3 fix queue:
- **P1** — Tier 1 pages scoring <75; hallucination-correction surface gaps; broken canonical / cannibalisation losers; missing schema on flagship pages
- **P2** — Tier 2 pages scoring <75; H2/H3 secondary-keyword gaps; AEO content-shape gaps on cluster pillar pages
- **P3** — Tier 3 pages; minor meta + image hygiene

Each fix item must include: page, pillar, specific gap, recommended fix, file path to edit.

## Step 4: Save Audit Report

Save to `projects/str-onpage-audit/{YYYY-MM-DD}_{site-name}-audit.md` with frontmatter:

```yaml
---
site: [domain]
date: [YYYY-MM-DD]
sitewide_score: [X/100]
pages_audited: [N]
fixes_p1: [count]
fixes_p2: [count]
fixes_p3: [count]
hallucination_correction_progress: [N/M facts corrected]
status: draft
---
```

Show the user the full absolute file path. Present summary: sitewide score, top 5 P1 fixes, hallucination-correction progress.

Push the report to Notion for review — Notion is the Got Moles review mechanism (Spencer + team review there). Create the page under the Got Moles project via the Notion MCP (`mcp__claude_ai_Notion__notion-create-pages`).

**Per-page report block structure (mandatory — Rule G):**

```markdown
## {Page URL}

### Foundation-doc lookup (Rule F)
| Field | target-keywords.md | Live | Match |
|---|---|---|---|
| Primary KW | … | … | ✅/❌ |
| Recommended H1 | … | … | exact/close/mismatch |
| Disambiguation signal | Rule 1: {signals} | present? | ✅/❌ |
| Secondary cluster KWs | {KW1}, {KW2}, … | {H2/H3 carrying each} | ✅/❌/MISSING |
| Queries-to-avoid | {list} | scan result | ✅ none / ❌ {violations} |

### Live verification (Rule C)
- Schema: {N} JSON-LD blocks parsed via raw HTML extractor: {types}
- Images: component source read: {component paths}; `priority`/`fill`/`aspect-*` confirmed
- Internal links: {N} via raw HTML count (WebFetch reported {M})

### Three-Layer SoT (Rule A)
- Live render: {hash or last-deploy timestamp}
- HEAD: {commit short SHA}
- Working tree: clean / divergent ({list files})
- CMS reseed: {date} or N/A

### Pillar scores
| # | Pillar | Wt | Score | Notes |
|---|---|---|---|---|
| 1 | Headings | 20% | … | references Foundation-doc row 2 |
| 2 | Meta | 10% | … | … |
| … |
```

If any of the three evidence sections is empty for any audited page, the report is incomplete — return to Step 2 and fill them before saving.

Ask: "Anything missing or scored wrong? Any pages to re-prioritise?" Log feedback to learnings.

## Production Flow Discipline (Mandatory for Live CMS Sites)

Before audit OR apply-fixes on a live production site, internalise these four rules. They are non-negotiable for any site with rank equity at stake (e.g. Got Moles 635 #1 keywords, ATP cornerstones).

### Rule A — Three-Layer Source-of-Truth Check

Before scoring any pillar, verify the state across three layers (CMS sites only — pure SSG sites collapse to one):

| Layer | Where | What it represents |
|---|---|---|
| **Live render** | `https://{domain}/{path}` | What users + Googlebot + AI engines actually see |
| **HEAD** | `git show HEAD:{file}` | What's committed but may not be deployed yet |
| **Working tree** | local edits | What's about to be committed (may have regressions) |
| **CMS layer** | Payload / Supabase data | Block-data source of truth on Payload-backed pages — diverges from `pages-data.ts` until re-seed |

If any of these diverge unexpectedly (e.g. working tree shows a regression vs HEAD; HEAD differs from live because re-seed missed; CMS has manual edits not in code), STOP and reconcile before scoring. Audits scored against the wrong layer are worthless.

For Got Moles + ATP (Next.js + Payload pattern): the CMS render is authoritative for any page route that calls `getCmsPageContent()`. Code changes to `pages-data.ts` don't affect the live page until `npm run seed -- --reseed {slug}` runs.

### Rule B — The Only Flow per fix tier

For every commit during apply-fixes mode on a CMS-backed live site:

1. **Edit** code (pages-data.ts / page.tsx / schema.tsx / components)
2. **Humanize** any new prose — pass through `tool-humanizer` (deep mode if voice-profile exists). **ZERO em dashes** (humanizer Rule #1) — replace every em dash with full stop, comma, or restructure.
3. **Build** — `npx next build` MUST pass. Don't commit broken builds.
4. **Reseed** if block data changed — `npm run seed -- --reseed {slug}`. Skip only if no CMS-backed change.
5. **Stage selectively** — use backup-checkout-reapply (Rule D) if other uncommitted changes exist
6. **Commit** with descriptive message referencing the audit ID + page + tier
7. **Commit + push** — push to origin for backup; the LIVE site deploys from the ORIGINAL freeflyroy/agent-os repo (client AGENTS.md "Website Deploy" — rewire pending), so shipping means routing the site tree through that deploy repo as an explicit user step. Report unshipped fixes as STAGED, not deployed. Never use the Vercel CLI.
8. **Verify once actually deployed** — after the change ships via the deploy repo (~2 min Vercel build), verify via WebFetch + raw HTML extraction (don't trust client-side previews)

Skipping any step = fix doesn't actually deploy or breaks production. Common miss: committing without re-seeding → live site stays unchanged while git looks clean.

### Rule C — Verify Live, Not Just Source

After deploy, verify the actual rendered HTML, not just the source files:

- **Schema:** raw HTML extractor script (template in `references/audit-checklist.md`). WebFetch summary strips JSON-LD.
- **Headings (H1/H2/H3):** WebFetch is reliable for headings.
- **Images:** WebFetch alt text reliable; `fetchpriority`/`loading`/dimensions check via component source code.
- **Internal links:** WebFetch undercounts city clusters / pricing card grids — count manually from rendered HTML or component source.
- **Visible freshness:** WebFetch reliable for "Last updated {date}" string presence.

**CDN cache awareness:** `x-vercel-cache: HIT` can serve stale static HTML even after a fresh deploy. Cache-bust query strings (`?nocache=...`) don't always invalidate Next.js static prerender cache. Before declaring a deploy "didn't work", probe the data source directly — for Payload+Supabase sites, a small `payload.find()` script confirming CMS state is the ground truth. CDN HITs lie; the database doesn't. Got Moles 2026-05-09: thought a deploy failed because extractor showed 7 FAQ items; Supabase had 11 the whole time, edge cache was just stale. Always probe upstream of the CDN before suspecting build/deploy failure.

### Rule D — Backup-Checkout-Reapply (when uncommitted changes exist)

If other uncommitted work is in the working tree (e.g. homepage hero changes you don't want to ship yet) but your fix touches the same file (e.g. `pages-data.ts`):

```bash
cp src/lib/pages-data.ts /tmp/backup-{tier}.ts            # 1. backup full working tree
git checkout HEAD -- src/lib/pages-data.ts                 # 2. reset to HEAD
# 3. re-apply ONLY your fix's edits (not the unrelated uncommitted work)
git add src/lib/pages-data.ts && git commit -m "..."       # 4. commit clean
cp /tmp/backup-{tier}.ts src/lib/pages-data.ts             # 5. restore working tree
```

This isolates a clean per-tier commit + revert point per fix without losing in-progress unrelated work. Per `feedback_per_page_review_pattern.md`.

### Rule F — Foundation-Doc Keyword Lookup (per page, evidence-bearing)

Before scoring Pillars 1 (Headings), 2 (Meta), 4 (AEO content), 5 (Internal Links) for any page, perform an explicit per-page lookup against `target-keywords.md` and emit the lookup as a table in the audit output. The lookup is the precondition for those pillars — score is invalid without it.

**Required lookup row per page:**

| Field | Source in target-keywords.md | Live state | Match? |
|---|---|---|---|
| Primary KW | Tier 1/2/3 row for this URL | extracted from H1/title/body | ✅/❌ |
| Recommended H1 | Tier 1/2/3 row "Recommended H1" column | live H1 text | exact / close-variant / mismatch |
| Disambiguation signal | Brand-Disambiguation Rule 1 (lawn/yard/exterminator/Washington/city/brand) | present in H1? | ✅/❌ |
| Secondary cluster KWs (≥2) | cluster query table for this page's cluster | which H2/H3 carry them | list each KW + its H2/H3 location, or `MISSING` |
| Queries-to-avoid | Brand-Disambiguation queries-to-avoid list | scan title/H1/FAQ for any | ✅ none / ❌ list violations |

If the lookup table is absent from the audit output, **the audit is incomplete and must be rerun** — Pillars 1/2/4/5 scores are not trustworthy without it. This rule exists because foundation-doc grounding is easy to skip silently under context pressure; making the lookup an output artefact makes skipping visible.

### Rule G — Output Must Carry Evidence of Execution

The audit report (`projects/str-onpage-audit/{date}_{site}-audit.md`) must include three evidence sections per page audited. If any section is empty or missing, the audit is incomplete and must be rerun.

| Section | What it proves | What goes in it |
|---|---|---|
| **Foundation-doc lookup** (Rule F) | target-keywords.md was actually consulted | the 5-row lookup table from Rule F |
| **Live verification log** (Rule C) | raw HTML / component code was actually checked, not just WebFetch | the schema-extraction count ("7 JSON-LD blocks parsed: Organization, AboutPage, BreadcrumbList, ..."), component-source paths read for image checks ("HeroBlock.tsx confirmed `priority` prop"), raw-HTML link count when WebFetch undercounts likely |
| **Three-Layer SoT reconciliation** (Rule A) | live vs HEAD vs working tree vs CMS state was reconciled | one-line confirmation per layer ("Live render = HEAD ✅, Working tree = HEAD ✅, CMS reseeded {date} ✅") or note any divergence + how it was resolved |

These sections appear at the top of each per-page audit block, BEFORE the 8-pillar score table. The pillar scores reference these sections (e.g. "Headings: 9.5 — see Foundation-doc lookup row 2 for H1 match").

**Self-check before saving the report:** scan the markdown for the three section headers per page. If any page is missing any of the three, the report is incomplete — go back and fill them. Don't save or present the audit otherwise.

### Rule H — Post-Fix Re-Audits Run Full Rule G Evidence

Re-scoring after fixes land must run the same evidence-bearing process as the original audit. Never project pillar deltas from "this commit shipped therefore Pillar X went up by Y points".

**Why:** Got Moles homepage 2026-05-09. Pre-fix audit ran full Rule G → 58.6/D+. After 5 commits I reported "post-fix score 89.4/B+" — but that 89.4 was projected, not measured. Roy: "please run properly don't just guess." A real Rule G re-audit landed at 89.5/B+ (close on the number, but the WSU outbound placement issue was completely invisible to the projection because projection only counts what code CHANGED, not what code now SAYS in context).

**How to apply:**
- Original audit's Rule G discipline carries forward to ALL re-audits. Same artefacts: foundation-doc lookup table (Rule F), live verification log (Rule C), three-layer SoT reconciliation (Rule A).
- Pillar scores in a re-audit reference live evidence captured DURING that re-audit, not the original audit's evidence + projected deltas.
- Post-fix audit file: separate filename suffix like `_post-fixes.md` or `_re-audit.md`. Same Rule G template as pre-audit file. Same self-check at save.
- If a re-audit feels too cheap to run again because "I just shipped the fixes", that's the exact signal it MUST be run. Discipline is most needed where it feels redundant.

**Trigger phrases that should fire this rule:**
- "Re-score after this commit"
- "Estimated score lift"
- "Projected pillar delta"
- "Running estimate after Commits X+Y"
- "Should clear ≥90 with these fixes"

If any of these appear in self-talk, stop and run the actual extractor. Per `feedback_post_audit_must_be_rule_g_too.md`.

### Rule I — Visual Verification (browser, not just extractor)

Live HTML correctness ≠ visual correctness. The live HTML extractor can confirm semantic shipping (H2 count went up, schema entries added, list markup present) while missing visible regressions (a horizontal seam where two gradients meet, an unexpected line, a broken image, a layout shift).

**Why:** Got Moles homepage 2026-05-09 Commit 7. I declared the commit "verified live" after the extractor confirmed +2 H2s, +5 `<li>`, FAQPage schema picked up new Q. Roy then sent a screenshot showing a visible horizontal line on the page. Diagnosed as a hero-photo / overlay-gradient interaction unrelated to my commit — but I wouldn't have known the question even existed without the screenshot.

**How to apply:**
- After every post-deploy extractor probe: open the page in a browser. Visual scan for: section seams / hairlines, broken layout, missing images, visible whitespace gaps, alignment shifts, mobile-vs-desktop divergence.
- Hard signals to check: any element that "shouldn't be a line but is", any sudden tonal break between adjacent sections, any element that breaks the design-system principle "no decorative dividers" (`design-system.md` line 20-21).
- Test pages live at `/test/{name}` on Got Moles + ATP for exactly this purpose. Use them.
- A commit is NOT verified until both the extractor AND a visual check have run. If browser access isn't possible in the moment, ask the user to confirm visually before declaring the commit verified.

### Rule J — Page Structure Checklist Is a Gate (not a reference)

Before any insert/edit to `pages-data.ts` (or equivalent block-data file), run all 7 rules of `brand_context/design-system.md` Page Structure Checklist (Got Moles: line 625-637). Treat as a gate. The Section component's `background` enum is NOT a menu of valid options — the checklist explicitly bans `cream`, standalone `blue`, and mid-page `gradient`.

**Got Moles current banned-by-checklist values:**
- Rule 2: `bg='blue'` (standalone) — bans
- Rule 3: `bg='cream'` — bans
- Rule 4: `bg='gradient'` — only on the LAST block

**Why:** Got Moles homepage 2026-05-09 Commit 8 plan. I proposed `bg='cream'` for a comparison-table block to make it "stand out". Roy caught the violation before I shipped it. I had read the Section.tsx enum (5 background options) and treated it as a menu, missing that the design-system Page Structure Checklist bans 3 of those 5.

**How to apply:**
- Before any block insert, write out a 7-rule check inline in your plan (or mentally if confident, but ONLY after running it explicitly the first 3 times you use it on a site).
- If a rule is violated, STOP and redesign before writing code. Don't ship and revert.
- If alternation requires more than 2 dark backgrounds in a row to stay legal, that means the block design (typography, whitespace, content density) needs to do the visual standout — not background swaps.

### Rule E — Lexical Builder Capability Check (Payload + Lexical sites)

Before applying any fix that requires inline links inside `richContent` blocks: check the project's Lexical builder helper (e.g. `parseInline` in `pages-data.ts`).

If the helper supports `**bold**` only and not `[text](url)`: extend it to handle markdown-style link syntax via combined regex — `/\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g` — emitting Lexical link nodes (`type: 'link'`, `version: 2`, `fields: { url, linkType: 'custom', newTab: false }`). Verify the renderer (`RichContentBlock.tsx`) already handles `case 'link':`.

Without this, internal-link fixes either skip or hand-write Lexical JSON — both bad. Skip = Pillar 5 stays at 3/10. Hand-write = brittle, violates Gotcha #8 of the page-build playbook.

## Apply-Fixes Mode

When the user asks to apply / implement / execute fixes from an existing audit, switch to apply-fixes mode. Don't re-audit — execute the fix list.

### A1. Find the audit
Read most recent `projects/str-onpage-audit/{YYYY-MM-DD}_*.md`. Sort newest first. If multiple, ask which.

### A2. Confirm scope
Present P1 fix list. Confirm: "Apply all P1, or filter to specific pages / pillars?"

### A3. Apply fixes per fix-type

| Fix type | Where to edit | Example |
|---|---|---|
| H1 mismatch | `pages-data.ts` (Payload block-based) or `blog-data.ts` (blog posts) | Update `heading` field |
| Meta title/description | `pages-data.ts` (`*Meta` exports) or per-page `generateMetadata()` | Update title/description in `*Meta` object |
| Canonical | Per-page route file | Update canonical in metadata |
| Schema gap | `src/lib/schema.tsx` builder + per-page route | Add Speakable / BreadcrumbList / FAQPage emission |
| AEO content shape (BLUF, stat block, table) | `pages-data.ts` block content | Add `richContent` block above existing or convert prose to structured |
| Internal-link rewrite | `pages-data.ts` block bodies + `blog-data.ts` section bodies | Rewrite markdown links |
| Image alt / dimensions | Component or block level | Update `alt` / `width` / `height` props |
| E-E-A-T (author byline) | Blog post template | Add Person schema + byline component |
| dateModified | Article schema builder + blog post data | Add field |

For schema changes:
1. Update the schema builder in `src/lib/schema.tsx` if pattern-level
2. Update per-page route if per-page emission
3. Verify with Google Rich Results Test before committing

### A4. Reseed CMS content (Payload pattern)

For block-data changes affecting CMS:
- `npm run seed -- --reseed {slug}` for individual pages
- `npm run seed -- --reseed-blogs {slug}` for blog posts
- Verify on staging before claiming complete

### A5. Build + deploy

- `npx next build` must pass
- Commit per fix cluster (not per individual edit). Reference audit ID + page list
- Commit + push to origin; shipping live goes through the deploy repo (AGENTS.md "Website Deploy")
- Spot-check on staging URL

### A6. Update audit status

Mark audit frontmatter `status: partially-applied` or `complete`. Add `applied_at` field. Add applied-commits log at bottom of audit.

### Apply-fixes rules

- Confirm scope before applying. Don't silently apply the entire list.
- Run a build BEFORE reseeding DB content.
- Per page: respect existing block alternation rules (per `feedback_unified_alternation_rule.md` for Got Moles).
- For Got Moles: commit direct to main (trunk-based). Live shipping routes through the deploy repo — see AGENTS.md "Website Deploy". Verify after the deploy actually lands.

## References

| File | Topic |
|------|-------|
| `references/audit-checklist.md` | Full per-pillar detail + scoring rubric |
| `references/aeo-patterns-2026.md` | 2026 AEO patterns derived from Pixelmojo + Phase 0 work |
| `references/2026-research-notes.md` | SEO/GEO/AEO standards research notes (recency anchor; refresh quarterly) |

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- 2026-05-31: Updated to 2026 research (`mole-content-authority/.planning/research/METHOD.md`, ~40 cited sources). Schema pillar: FAQ rich results removed 2026-05-07 (keep FAQPage for AI extraction only), Speakable downgraded to optional BLUF-only, schema field rigor (`sameAs`/`knowsAbout`/`dateModified`/`mainEntityOfPage`) > presence, LocalBusiness/Service = top priority. AEO pillar: 40–60w BLUF + chunked self-contained H2s (each opening 40–75w answer) + cited-stat cadence (1 per ~150–200w, Princeton +40%) + no visible TL;DR boxes. Reference notes point to METHOD.md as primary benchmark; Pixelmojo Radar demoted to secondary. Off-page entity presence flagged as the #1 2026 AI-visibility lever (page audit covers on-page; entity work is str-authority-strategy).
- 2026-05-08: Skill created. Foundation-doc check is non-negotiable — stop if target-keywords.md or authority-strategy.md missing. Pixelmojo as recurring 3rd-party benchmark in Step 0. Per-page link plan output is the canonical handoff to apply-fixes mode and adjacent skills.
- Audit-skill pattern (per meta-skill-creator): foundation-doc consumption + structured per-page handoff to apply-mode. Apply mode is a separate top-level section.
- For multi-location brands (e.g. Got Moles 3 GBPs), per-location LocalBusiness schema is a sitewide audit concern — defer to str-ai-seo-local for sitewide; this skill audits per-page emission only.
- Hallucination-correction surface gaps are P1 priority — verified-fact callouts visible above the fold on relevant pages.
- 2026-05-09: Added Production Flow Discipline section (Rules A-E) after Got Moles /about/ apply-fixes work surfaced 5 production-flow gaps: three-layer source-of-truth check, The Only Flow per-tier, live-vs-source verification, backup-checkout-reapply pattern, Lexical builder capability check. Pillar 2.3 (Schema) updated with referenced @id pattern + raw-HTML extraction note. Pillar 2.6 (Images) updated with component-code-vs-WebFetch caveat for Next.js sites. /about/ went 68→95 with these patches applied.
- 2026-05-09: Apply-fixes mode must run `tool-humanizer` deep pass on any new prose before commit. ZERO em dashes (humanizer Rule #1) — easy to miss, mandatory.
- 2026-05-09 (later): Added Rule F (Foundation-Doc Keyword Lookup, per page, evidence-bearing) + Rule G (Output Must Carry Evidence of Execution). Reason: a /about/ re-audit was scored without opening target-keywords.md — the rule existed in Pillar 2.1 but was skippable silently. Fix: make foundation-doc lookup + live-verification + three-layer SoT reconciliation visible artefacts in the report. Empty section = incomplete audit. Self-check before save scans for the three section headers per page.

## Self-Update

If the user flags an issue with the output during or after a run — wrong scoring, missed pillar, bad fix priority, file path errors — update the `## Rules` section in this SKILL.md immediately with the correction and today's date. Don't just log to learnings; fix the skill so it doesn't repeat the mistake.

Format: `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`

## Troubleshooting

- **Foundation doc missing:** stop. Tell user to run str-keyword-strategy (then str-authority-strategy) first. Per meta-skill-creator Pre-Scaffold Guardrails — non-negotiable.
- **Page not in target-keywords.md:** flag as a coverage gap; don't audit. Recommend updating target-keywords.md to include the page or removing the page if orphaned.
- **Pixelmojo report stale or missing:** proceed without; flag in audit frontmatter as "no recency benchmark"; recommend running Pixelmojo Radar.
- **Schema validates in Rich Results Test but Pixelmojo flags as missing:** likely Speakable selector mismatch or Article schema not emitting on the right page-type. Check src/lib/schema.tsx + per-page route.
- **Apply-mode breaks build:** rollback the specific commit; re-run audit on the affected page; identify why the fix produced invalid Lexical / TypeScript / schema; fix root cause.
- **Multi-location LocalBusiness schema audit:** out-of-scope for this skill — handled by str-ai-seo-local sitewide.
