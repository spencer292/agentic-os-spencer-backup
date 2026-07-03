---
name: str-ai-seo-local
description: >
  Got Moles-specific local SEO/GEO audit. Built for a multi-location pest service (3 GBPs, 219+ reviews, 90+ city pages, 35 launch-ready blog posts). Use whenever the user asks for: SEO audit, GEO audit, AI visibility check, GBP audit, Google Business Profile review, local SEO check, "near me" ranking, AI Overviews citation gap, Bing Copilot citation, AEO for local service, Apple Business Connect, local citation, NAP audit, review velocity check, service-area coverage, or post-launch / monthly visibility re-audit on Got Moles. Run before DNS flip, after major content drops, and monthly post-launch. Differs from generic str-ai-seo: GBP/local audit runs FIRST not last, schema priorities are LocalBusiness/Service/Person/aggregateRating, citation rubric uses local signals (review velocity, service-area depth, named technician, before/after) not B2B research stats, Bing weighted equal to ChatGPT, and the skill ALWAYS reads active Got Moles briefs first to annotate "already scoped in {brief}" rather than re-recommending work in flight. Don't use for: traditional keyword planning (use mole-content-authority brief), CRO audits (use str-cro-audit), schema implementation tickets, or non-Got-Moles audits (use root str-ai-seo).
---

# Got Moles AI SEO & GEO Audit (Local)

A local-service-business audit. Got Moles is multi-location (Seattle / Tacoma / Enumclaw GBPs), high-review (219+ five-star), and time-pressured (peak season May-September). The job is to find the citation and ranking gaps that matter for a pest-control company in Western Washington — not to score the site against a SaaS rubric.

Traditional SEO gets ranked. Local SEO gets cited in the Map Pack and AI Overviews. This skill audits both.

## Outcome

A dated audit report saved to `projects/str-ai-seo-local/{YYYY-MM-DD}_audit.md` containing: headline verdict, GBP-per-location scorecard, local citation pillar scores, AI Overview presence per priority query (Google + Bing/Copilot + ChatGPT + Perplexity), service-area coverage gaps, brand disambiguation status, launch-critical vs post-launch fix list, and month-over-month delta when re-run.

Always saved to disk. After save, the full absolute file path is shown so the user can click to open.

## Context Needs

| File | Load level | Why |
|------|-----------|-----|
| `brand_context/positioning.md` | summary | Frame citations to reinforce differentiation (chemical-free, 219+ reviews, 5,000-client dataset) |
| `brand_context/icp.md` | full | Optimize for homeowner query patterns (Bellevue/Sammamish/Tacoma/Seattle) and aha-moments (mounds, lawn damage) |
| `brand_context/voice-profile.md` | tone only | Keep recommendations within Got Moles register |
| `context/learnings.md` | `## str-ai-seo-local` section | Apply prior corrections before starting |
| **Active briefs in `projects/briefs/`** | full scan | **Annotate, don't duplicate** — see Step 0 |

## Skill Relationships

**Parent:** root `str-ai-seo` — this is the local-service variant. Inherits the render-check methodology and reporting structure; replaces the pillar weights and citation rubric.

**Upstream:** `mkt-positioning`, `mkt-icp`, the Got Moles measurement-setup brief, the seo-geo-reinforcement brief, and yesterday's `projects/str-ai-seo/2026-04-20_full-seo-geo-report.md` baseline.

**Downstream:** findings feed `mkt-authority-content` (blog gaps), `ops-cms-content` (schema/content edits), `seo-geo-reinforcement` (depth tracks), and `got-moles-measurement-setup` (GSC/Bing Webmaster prioritization).

**Siblings:** `str-cro-audit` covers conversion. Use both for a full page audit.

## Step 0: Brief Awareness + Foundation Scan (mandatory, runs first)

Before any audit work, load these inputs:

**Active briefs.** Scan `projects/briefs/` for active Got Moles strategy briefs. Read the frontmatter and Scope sections of each:
- `seo-foundation-recovery/brief.md` — Sub 1 keyword strategy (✅ done), Sub 1.5 cannibalisation, Sub 2 authority, Sub 3 onpage-audit skill, Sub 4 sitewide fix
- `got-moles-marketing-os/brief.md` — parent GSD coordinating the post-launch marketing OS
- `seo-geo-reinforcement/brief.md` — Tracks A/B/C
- `got-moles-measurement-setup/brief.md` — GSC, Bing Webmaster, Apple Business Connect, GA4/Pixel/CAPI/UET, review-velocity, 3-GBPs-vs-1-site
- `mole-content-authority/brief.md` — knowledge base, intent map, content plan
- `internal-linking-recovery/brief.md` — hub-spoke 3-tier topology, paused
- `aeo-p0-content/` — 9-page AEO P0 (✅ all 4 phases shipped 2026-05-03)

**Foundation docs (read as Context).**
- `brand_context/target-keywords.md` — primary keyword + cluster + recommended H1 per page; brand-disambiguation rules (Rule 1: lawn signal mandatory; Rule 5: anchor text)
- `brand_context/authority-strategy.md` — if exists, per-cluster authority targets and citation gaps
- `projects/briefs/internal-linking-recovery/got-moles-internal-linking-strategy.md` — 3-tier hub-spoke + per-post topical mapping

**Latest third-party audit.** Check `~/Downloads/` for the most recent `ai-visibility-report-{domain}-{date}.json` (Pixelmojo Radar). If present and ≤30 days old, read it as the recency benchmark — pull its `recommendations`, `actions`, and `insights` arrays into the audit input set. Pixelmojo is now the recurring third-party AEO benchmark.

Build a one-line "already in flight" register. When the audit later surfaces a fix that lives inside one of these briefs, annotate it `→ already scoped in {brief}` and move on. The audit's job is to find what's *not* covered.

## Step 1: Confirm Scope

Ask one question: **"Full re-audit, single-page audit, or single-location GBP audit?"** Default = full re-audit, comparing against the most recent dated report in `projects/str-ai-seo/` and `projects/str-ai-seo-local/`.

Also confirm priority queries (default = the 15 from the 2026-04-20 baseline, plus any new cities/services since).

## Step 2: GBP Audit per Location (the dominant signal)

**Note.** Step 4 has TWO outputs: (a) the per-location GBP scorecard below; (b) the per-page on-page audit table further down (BLUF + AEO + H2/H3 + link plan). Run both before assembling the report.

For local service, 32% of controllable ranking weight is GBP signals and 16-20% is reviews. Run the GBP completeness check from `references/gbp-audit.md` for **each of the 3 GBPs** (Seattle, Tacoma, Enumclaw). Score 0-100 per location.

Per-location checks:
- Primary category — must be "Pest Control Service" (top controllable factor; primary category is the #1 ranking signal in 2026)
- Secondary categories — up to 9, used for query-relevance breadth
- NAP consistency vs site footer + sitemap.xml + Yelp + Apple Business Connect + Bing Places
- Service area definition — cities listed, radius vs explicit list
- Service list with descriptions and pricing posture
- Photos count + freshness (target: 30+ per location, professional > stock; pro photos = +35% CTR per Semrush 2026)
- Review velocity (last 30/60/90 days) and response rate (target: 100% within 48hr)
- Posts cadence (Updates / Offers / Events) — at least 1/week
- Q&A — owner-answered, no orphan questions
- Attributes (LGBTQ+ friendly, Veteran-Owned ✓, etc.)
- Messaging on / off — decision per location
- Booking link — where it routes (Jobber? quiz?)

Output: 3-row scorecard with per-location score and the 3 highest-leverage fixes per location.

## Step 3: Render Check (condensed — SSR is verified)

The site is Next.js + Payload + Vercel SSR. Schema render was verified during the 2026-04-24 launch-readiness Phase 8 smoke test. Skip the 3-bot render loop unless schema-touching commits have shipped since.

Spot-check one city page and one blog post via raw `node fetch` with `User-Agent: GPTBot` to confirm JSON-LD blocks render. If clean, move on. If schema is missing in render (silent metadata-API failure), flag launch-critical and stop.

## Step 3.5: Sitewide Schema Completeness (2026 AEO patterns)

The 2026 AEO baseline is broader than just "schema present". Audit these patterns sitewide — a single missing element on a flagship page tanks AI citation confidence:

| Pattern | What to check | Severity |
|---|---|---|
| **Speakable schema** | Article + WebPage pages have `speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', 'main h2'] }`. Tells voice assistants + AI Overviews which DOM to read aloud. | High |
| **BreadcrumbList sitewide** | Every non-root page emits BreadcrumbList. Look for `breadcrumbSchema()` calls in page routes. | Medium |
| **Article schema with `dateModified`** | Blog posts + Article-typed pages have `dateModified` field, not just `datePublished`. AI engines deprioritize stale content. | High |
| **FAQPage aggregation rule** | Multi-FAQ-block pages emit ONE combined FAQPage (not one per block). Per `feedback_one_faqpage_per_page.md`: per-block emission silently drops ~80% of questions. | High |
| **Organization schema enrichment** | Sitewide Organization schema includes `knowsAbout` (topical authority) + `hasOfferCatalog` with explicit pricing ($100/mo TMCP, $450 + $150 setup OMP, custom commercial). Per AEO P0 commit 4cadb41. | Medium |
| **Last-Modified HTTP header** | Server returns `Last-Modified` header on content pages. Pixelmojo flags this separately from `dateModified` schema field — both signals matter. | Medium |
| **`llms-full.txt`** | Companion to `llms.txt` with extended descriptions, scoring methodology, detailed service descriptions. Per Pixelmojo low-priority recommendation. | Low |
| **`robots.txt` AI bot rules** | Explicit rules for GoogleOther; crawl-delay for aggressive bots; AI training bot policy clear (CCBot, Google-Extended). | Medium |

For each missing pattern, flag with severity + which pages affected. Don't deep-dive on a single page — this is a sitewide coverage check.

## Step 4: Local Citation Pillar Score

Replace the generic Princeton GEO rubric with local-service signals. For the 35 blog posts and 90+ city pages, score per page (0/½/1):

| Signal | Weight |
|--------|:-:|
| **BLUF answers the page's primary-intent question** (40-60 words under H1, in the same terminology AI engines query — not just any prose paragraph) | 2 |
| **H1 matches recommended H1 in `target-keywords.md`** + carries lawn signal per Rule 1 (`lawn`/`yard`/`Washington`/`Got Moles`) | 2 |
| **H2/H3 carry secondary keywords from the page's cluster** (per `target-keywords.md` cluster table) — at least 2 H2/H3 with cluster terms | 1 |
| LocalBusiness or Service schema with serviceArea | 2 |
| aggregateRating with 219+ reviewCount visible | 2 |
| Named technician / Spencer attribution where relevant | 1 |
| Review density on page (3+ embedded reviews from local clients) | 2 |
| Before/after photo or visible field result | 1 |
| Service-area coverage table or city-link block | 1 |
| FAQ block with FAQPage schema (3-5 entries, **aggregated per-page rule** if multi-block) | 1 |
| Visible publication + updated date AND `dateModified` in Article schema AND server `Last-Modified` header | 1 |
| **AEO extractability** — at least one of: HTML table for comparisons, ordered list for steps, distinct stat-block component for citable numbers (Pixelmojo high-impact pattern) | 1 |
| **Per-page link plan** — page has at least 2 inbound links from related cluster pages with diverse anchor text per Rule 5; outbound links to ≥1 related cluster page + parent service | 1 |

Max 18 → normalize to /100.

**Per-page link plan output (deliverable for Step 9 report).** For each Tier-1 + Tier-2 page audited, produce a row:

| Page | Inbound links present | Inbound links missing (target) | Outbound links present | Outbound links missing (target) | Anchor text gaps |
|---|---|---|---|---|---|

Use `target-keywords.md` cluster mappings + internal-linking-strategy hub-spoke topology to derive missing links. Anchor diversity check per Rule 5: never let a single anchor phrase dominate.

Spot-rationale: Princeton's "+40% citations / +37% stats / +30% expert quotes" come from B2B research content. For homeowner queries about mole removal in Bellevue, the equivalent signals are review density, named technician, before/after, and city-coverage proof. Rubric reflects that.

## Step 5: AI Overview & AI Citation Sweep

Local-intent AI Overview presence (2026 Whitespark + Conductor data): "near me" informational queries trigger AIO 76.9% of the time; pure Map-Pack queries only 7%. So the citation surface is informational, not transactional.

Run the priority queries through:
1. **Google AI Overview** — note presence, source list, whether Got Moles or a competitor cited
2. **Bing Copilot** — equivalent presence check. Pull citation data from Bing Webmaster Tools "AI Performance" report (launched Feb 2026) if access is set up per `got-moles-measurement-setup` Track A2
3. **ChatGPT** — branded + informational queries, web search on
4. **Perplexity** — same query set

Record per query: AIO present? Got Moles cited? Competitor cited? Source URL? Then map *why* a competitor was cited and Got Moles wasn't (schema, review density, third-party presence, freshness).

**Citation-gap study loop (when competitor cited instead).** For every competitor URL cited where Got Moles is not, run a structural comparison:

1. Fetch the competitor URL with `User-Agent: GPTBot`
2. Extract: H1, BLUF first-paragraph wording, schema types present (FAQPage, Article, Speakable?), stat blocks, table/list count, dateModified, named entities
3. Diff against the equivalent Got Moles page
4. Document the structural gap (what they have that we don't) — this becomes the highest-leverage fix candidate per Pixelmojo's #1 action

## Step 5.5: Hallucination Check (cross-platform fact verification)

Pixelmojo 2026-05-08 surfaced 4 high-severity hallucinations on Got Moles. Cross-check 5 core facts against AI provider responses:

| Fact | Ground truth | Query to test |
|---|---|---|
| Founding year | 2017 | "When was Got Moles founded?" |
| Client count | ~5,000 properties served (92+ communities across 6 counties, per target-keywords.md v1.1) | "How many clients has Got Moles served?" |
| Service area | Western Washington — Seattle / Tacoma / Olympia / Enumclaw | "Where does Got Moles operate?" |
| Pricing | TMCP $100/mo; OMP $450 flat + $150 setup; Commercial custom | "How much does Got Moles cost?" |
| Founder credentials | Spencer Hill, US Army veteran, founded 2017 | "Who runs Got Moles?" |

Run each query through ChatGPT, Claude, Perplexity, Gemini. Score per provider:
- ✅ Correct
- ⚠ Vague but not wrong
- ❌ Wrong (specific incorrect claim)

Output: hallucination matrix (5 facts × 4 providers = 20 cells). Any ❌ → fix proposal:
- Update `llms.txt` with explicit authoritative statement
- Update Organization schema with the fact (e.g. `foundingDate`, `numberOfEmployees`, `hasOfferCatalog` pricing)
- Add a verified-fact callout on `/about/` if missing
- Re-run query 7-30 days later to verify correction propagated

## Step 6: Brand Disambiguation — Service Name vs Medical Term

"Got moles?" collides with the dermatology/skin-mole query intent. This is a unique citation leak for this brand.

Run `references/service-name-disambiguation.md`:
- Search "got moles" on Google, Perplexity, ChatGPT — what does the AI assume the user means?
- Check Wikidata / Knowledge Graph for "mole" entity disambiguation — animal vs skin lesion vs molecule vs spy
- Check Got Moles' Organization schema `sameAs` array — does it link to enough disambiguating entities (Better Business Bureau, Yelp, Facebook, LinkedIn, GBP map URL × 3) to make the animal-pest-control intent unambiguous?
- Spencer's Person schema — Army provenance, LinkedIn, founded-2017 — strengthens Person entity and pulls disambiguation toward the company

Score: clear / partial / leaky. Recommend specific `sameAs` additions if leaky.

## Step 7: Service-Area Coverage Audit

The seo-geo-reinforcement brief flags 77 citySlugs vs 90 city pages and 17 uncovered URL patterns. This skill verifies the *audit* status, not the fixes (those are scoped in Track A1):

- Read `src/lib/redirects.ts` and `src/lib/city-data.ts`
- Cross-reference against `phase-2-page-briefs.md` city list and the previous-agency keyword sheet (1,409 top-3 keywords)
- Flag any city with ≥3 ranked keywords on the old site that lacks a live page
- Annotate: `→ scoped in seo-geo-reinforcement Track A1`

Don't re-run the reconciliation — flag and link.

## Step 8: Bing + Apple + Yelp + Nextdoor Citation Surface

Bing Places feeds Yahoo + Microsoft Copilot + Windows Search (4 surfaces from one listing). Apple Business Connect feeds Apple Maps + Siri + Spotlight. For an older-skewing demo (Edge/Bing-friendly), neither is optional.

Per location, verify:
- Bing Places — claimed, NAP consistent with GBP, photos, hours, reviews imported
- Apple Business Connect — claimed, NAP consistent
- Yelp — claimed, photos, response rate
- Nextdoor — neighborhood presence (Nextdoor cites heavily in AI Overviews for hyperlocal)
- BBB — accreditation status
- Angi — claimed, response rate

Flag any unclaimed → annotate `→ scoped in got-moles-measurement-setup Track E` if applicable.

## Step 9: Score Assembly + Report

Local-service pillar weights (replaces the SaaS-tuned defaults):

| Pillar | Weight |
|--------|:-:|
| GBP / Local (Step 2 + Step 8) | 35% |
| Authority (Step 4 schema + citation rubric) | 25% |
| AI Overview presence (Step 5) | 20% |
| Service-area coverage (Step 7) | 10% |
| Technical (Step 3 render) | 10% |

Output sections:
1. Headline verdict (one line)
2. Pillar scores table
3. GBP-per-location scorecard
4. AI Overview citation map (priority queries × 4 platforms)
5. Brand disambiguation status
6. Launch-critical fixes (max 5; trivial / moderate / substantial effort)
7. Post-launch (first 30 days)
8. Already in flight (Step 0 register — what was found but lives in another brief)
9. Month-over-month delta if re-audit

## Step 10: Save Output and Collect Feedback

Save to: `projects/str-ai-seo-local/{YYYY-MM-DD}_audit.md`

Create the folder if missing. After save, show the full absolute path.

Push the report to Notion for review — Notion is the Got Moles review mechanism (Spencer + team review there). Create the page under the Got Moles project via the Notion MCP (`mcp__claude_ai_Notion__notion-create-pages`).

Ask: "Anything missing, miscategorized, or wrong weighting?" Log responses to `context/learnings.md` under `## str-ai-seo-local`. If feedback reveals a methodology issue (wrong rubric, missed signal, bad weighting), update the `## Rules` section of this SKILL.md immediately.

## Rules

*Entries added when issues surface during runs. Format: `- {YYYY-MM-DD}: {correction}`*

- 2026-05-08: Phase 0 currency audit — added Speakable + BreadcrumbList + dateModified + Last-Modified + FAQPage aggregation rule + Organization knowsAbout/hasOfferCatalog + AEO extractability (tables/lists/stat blocks) + H2/H3 secondary-keyword check + per-page link plan + hallucination check (5 facts × 4 providers) + citation-gap study loop. Pixelmojo declared as recurring third-party benchmark in Step 0. `target-keywords.md` declared as primary-keyword source of truth.
- 2026-05-13: **No silent deferrals.** When invoked as a "full" audit, every one of Steps 2-8 must either be completed OR appear in an explicit "Deferred" section of the report with: which step, why it was deferred (e.g. needs GBP dashboard access), the owner who can unblock it, and where it's tracked. The report's headline verdict must state "N of M steps complete, K deferred — see Deferred section." Running Steps 5.5/8 from the Pixelmojo Radar data alone counts as DEFERRED for first-party verification, not complete. Reason: 2026-05-13 Got Moles audit shipped sitewide + 10 page audits but quietly skipped first-party hallucination checks, the citation-gap study loop, GBP, external citation surface, and the whole traditional-SEO layer (PSI/CWV, indexation, backlinks, mobile, live schema validation). Roy had to ask "what's missing." Also: layer the traditional-SEO checks per `feedback_str_ai_seo_needs_traditional_layer.md` as a named pillar — they are not optional on a "full SEO/GEO review."

## Self-Update

If the user flags an issue during or after a run — wrong weight, missed local signal, miscategorization, recommendation that ignores an active brief — update the `## Rules` section in this SKILL.md immediately. Don't just log it; fix the skill so it doesn't repeat the mistake.

## Troubleshooting

- **GBP scorecard shows 100% but rankings flat:** check proximity. ~55% of weight is uncontrollable distance — if the searcher isn't near the GBP centroid, no GBP optimization fixes that. Recommendation should pivot to service-area page depth instead.
- **AI Overview cites Got Moles on informational but not transactional queries:** expected. AIO triggers 76.9% on "near me" informational, 7% on pure transactional Map Pack queries. Don't over-rotate to chase the 7%.
- **Schema in code but not render:** likely Next.js metadata-API silent failure. Use raw `node fetch` not WebFetch (WebFetch strips `<script>` tags). Check `src/lib/schema.tsx` and `src/app/(frontend)/layout.tsx`.
- **Bing AI Performance returns no data:** report launched Feb 2026 — needs Bing Webmaster Tools property verified for at least 7 days before citation data populates.
- **Audit recommends fixes already in another brief:** Step 0 wasn't run. Re-run from Step 0 and annotate.
