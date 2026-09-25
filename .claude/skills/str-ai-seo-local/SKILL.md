---
name: str-ai-seo-local
description: >
  Got Moles-specific local SEO / AEO / GEO audit. Built for a multi-location pest service (3 Google Business Profiles, 219+ five-star reviews, ~90 city pages, blog). Use whenever the user asks for: SEO audit, GEO audit, AEO audit, AI visibility check, AI Mode visibility, AI Overviews citation gap, Local Pack audit, map pack ranking, GBP audit, Google Business Profile review, local SEO check, "near me" ranking, Yelp audit, directory citation audit, NAP audit, review policy compliance, review velocity check, call-path audit, service-area coverage, SAB configuration, brand disambiguation / homograph check, Bing Places, Apple Business Connect, or post-launch / monthly visibility re-audit on Got Moles. Run after major content drops and monthly. Audits four distinct surfaces separately — Local Pack (transactional, ~93% of transactional local queries), Google AI Overviews (informational, ~92%), Google AI Mode (fan-out, tracked by presence not rank), and the answer engines (ChatGPT, Perplexity, Gemini, Copilot) — because they are won by different work. Differs from the root `str-ai-seo`: GBP and Local Pack run FIRST not last, weights follow Whitespark 2026 local ranking factors, citations are scored twice (declining Local Pack factor, rising AI-visibility factor), Yelp is a tier-1 asset on par with GBP after the 2026-07 OpenAI licensing deal, the directory priority order is engine-specific, and the skill ALWAYS reads active Got Moles briefs first to annotate "already scoped in {brief}" rather than re-recommending work in flight. Don't use for: the keyword and page-map foundation (use str-keyword-strategy), per-page on-page scoring or the cannibalisation cull (use str-onpage-audit), internal link structure (use str-internal-links), CRO audits (use str-cro-audit), or non-Got-Moles audits (use root str-ai-seo).
---

# Got Moles AI SEO & GEO Audit (Local)

A local-service-business audit. Got Moles is multi-location (Seattle / Tacoma / Enumclaw GBPs), high-review (219+ five-star), and time-pressured (peak season May-September). The job is to find the citation and ranking gaps that matter for a pest-control company in Western Washington, not to score the site against a SaaS rubric.

**Four surfaces, audited separately, because they are won by different work.**

| Surface | What wins it | Fires on |
|---|---|---|
| **Local Pack / Maps** | GBP signals, reviews, proximity, hours | Transactional local ("mole removal Everett") — ~93% [S] |
| **Google AI Overviews** | Organic rank plus cited content shape | Informational local ("how do I get rid of moles") — ~92% [S] |
| **Google AI Mode** | Query fan-out coverage across a cluster | Default Search surface since 2026-05-19 [P]; tracked by presence, never by rank |
| **Answer engines** (ChatGPT, Perplexity, Gemini, Copilot) | Third-party directory presence, review corpus, brand mentions | Increasingly the discovery step before the call [S] |

**Landscape facts live in one file, not here.** Read `../../../../../.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (install root: `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`) before every run. It is the single source of "state of search" for this skill chain, and where this SKILL.md and the landscape file disagree, the landscape file wins. This skill carries only the handful of numbers it acts on and points at that file for everything else.

Every statistic that reaches a client-facing deliverable carries its confidence label: **[P]** primary documentation, **[S]** named study with a stated sample, **[U]** unverified. The key is in the landscape file's frontmatter.

## Outcome

A dated audit report saved to `projects/str-ai-seo-local/{YYYY-MM-DD}_got-moles-audit.md` containing: headline verdict, GBP-per-location scorecard, Local Pack factor audit, call-path audit, local citation pillar scores, per-surface visibility map (Local Pack / AI Overviews / AI Mode / ChatGPT / Perplexity / Gemini / Copilot), directory-by-engine presence, brand disambiguation status, review-policy compliance status, service-area coverage gaps, prioritized fix list, and month-over-month delta when re-run.

Always saved to disk. After save, show the full absolute file path so the user can click to open. Then push to Notion.

**Honest-expectation statement (mandatory in every report, verbatim intent).** AI visibility is not achievable at Local Pack rates and the report must never imply it is. [S] Niche brands appear in roughly 11% of relevant AI answers versus 73% for household names (arXiv 2606.20065). [S] SOCi measured local-3-pack visibility at 35.9% of locations against Gemini 11%, Perplexity 7.4% and ChatGPT 1.2%, and describes AI visibility as three to thirty times harder than ranking well in traditional local search. The Local Pack remains the volume channel. AI is the discovery channel that feeds it.

## Context Needs

| File | Load level | Why |
|------|-----------|-----|
| `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (install root) | **full, first** | Canonical state of search. Overrides any dated claim in this skill |
| `brand_context/target-keywords.md` | full | Seven cluster ids, per-page primary keyword and recommended H1, Brand-Disambiguation Rules 1-5, Queries to AVOID, `canonical_facts` block, Tier A city list |
| `brand_context/authority-strategy.md` | Sections 1, 4, 9, 10 | Brand Defense, current authority surface inventory, entity-graph plan, multi-location authority |
| `brand_context/positioning.md` | summary | Frame citations to reinforce differentiation (chemical-free, 219+ five-star reviews, ~5,000 properties served) |
| `brand_context/icp.md` | full | Homeowner query patterns and aha-moments (mounds, lawn damage) |
| `brand_context/voice-profile.md` | tone only | Keep recommendations within Got Moles register |
| `context/learnings.md` | `## str-ai-seo-local` section | Apply prior corrections before starting |
| **Active briefs in `projects/briefs/`** | full scan | **Annotate, don't duplicate** — see Step 0 |

## Skill Relationships

**Parent:** root `str-ai-seo` — this is the local-service variant. Inherits the landscape file and reporting structure; replaces the pillar weights and citation rubric with local ones.

**Upstream:** `str-keyword-strategy` produces `brand_context/target-keywords.md`; `str-authority-strategy` produces `brand_context/authority-strategy.md`; `str-question-harvester` produces the per-primary-keyword fan-out sub-query sets this skill audits coverage against. Prior baselines are this skill's own dated reports in `projects/str-ai-seo-local/` (see Step 0).

**Downstream:** findings feed `mkt-authority-content` and `ops-blog-pipeline` (content gaps), `ops-cms-content` (schema and content edits), `str-onpage-audit` (per-page fixes and the cannibalisation cull), `str-internal-links` (link plan), and `ops-got-moles-ads` (anything paid-adjacent, including the Local Services Ads call-charging change in Step 2.5).

**Siblings:** `str-cro-audit` covers conversion. `str-onpage-audit` owns per-page scoring, the doorway gate and the cannibalisation cull — this skill flags city-page problems at portfolio level and hands the page-level work there rather than duplicating it.

## Data Sources

Wire these in. Do not defer a step for lack of access without first checking whether one of these covers it — the 2026-05-13 incident was caused by exactly that.

**DataForSEO v3** through the shared client. Run every call from the client folder (`clients/got-moles/`) so this client's `.env` wins:

```
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' [--out file] [--raw] [--dry]
```

Credentials resolve automatically from `.env`. Never print or quote credential values. Every call appends endpoint, task status and cost to `.dataforseo-usage.log` in the working directory.

**Spend guard (hard).** The account is pay-as-you-go with a small balance. Before starting a full audit, check the balance with the free GET `appendix/user_data`. Budget **$5 per full audit** and stop if the running total in `.dataforseo-usage.log` crosses it, reporting what was covered and what was not. Put an explicit `limit` on every Labs and mentions call. Use `--dry` to inspect any payload before spending. [P] Documented AI Optimization prices are in the landscape file §10.2 — LLM Mentions $0.10 per request plus $0.001 per row, LLM Responses $0.0006 per prompt plus provider charges, AI Keyword Data $0.01 per task plus $0.0001 per keyword. Read actual per-call cost from the usage log rather than assuming.

**Location codes** (resolved from the free `serp/google/locations` GET, 2026-09-02). Country US = `2840`, Washington state = `21180`, `language_code` = `"en"`.

| City | Code | City | Code | City | Code |
|---|---|---|---|---|---|
| Seattle | 1027744 | Tacoma | 1027773 | Enumclaw | 1027581 |
| Bellevue | 1027509 | Sammamish | 1027741 | Mercer Island | 1027662 |
| Medina | 1027660 | Kirkland | 1027627 | Redmond | 1027725 |
| Issaquah | 1027615 | Puyallup | 1027719 | Auburn | 1027505 |
| Renton | 1027726 | Kent | 1027623 | Federal Way | 1027588 |
| Olympia | 1027691 | Everett | 1027583 | Gig Harbor | 1027595 |
| Bremerton | 1027519 | Bainbridge Island | 1027506 | Silverdale | 1027751 |
| Maple Valley | 1027653 | Covington | 9051783 | Bonney Lake | 9051619 |
| Lacey | 1027632 | | | | |

Lake Tapps has no city code — use Bonney Lake. To resolve any other city: `node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs serp/google/locations "" --raw --out locs.json` (free), then filter on `location_name` ending `,Washington,United States`.

**Google Search Console** — domain property `sc-domain:got-moles.com`, full-user access, via `.claude/skills/ops-got-moles-ads/scripts/_gsc-status.mjs` and `_gsc-today.mjs`. Never use the URL-prefix property; it is unverified. **Caution: both scripts currently carry hardcoded OAuth credentials and are gitignored pending a scrub to `.env`. They must be scrubbed and the tokens rotated before anyone other than Roy runs this skill.**

**Search Console Generative AI report** — the primary first-party AI-visibility metric, but **UI only**. [P] Impressions inside AI Overviews and AI Mode by page, country, device and date, from 2026-05-18 with no backfill. No clicks, no CTR, no queries, and the Search Console API rejects the generative-AI type, so this is a manual export every time. Do not ask a script for it.

**Bing Webmaster Tools AI Performance** — [P] public preview since 2026-02-10. Total citations, average cited pages, page-level citation activity and **grounding queries**, which are real Copilot retrieval phrasings no keyword tool has. UI only, manual input.

**GA4** — [P] the AI Assistant channel recognizes ChatGPT, Gemini, Deepseek, Copilot and Grok referrers, and **excludes Google's own AI surfaces**: AI Overviews and AI Mode clicks land in `google / organic`. [P/S] AI Mode adds `noreferrer`. **Never promise AI Mode attribution in a report.** Report Search Console AI impressions as the AI-side numerator, GA4 `google / organic` as landed traffic, and the widening gap between them as the AI-answer signature.

**SerpAPI** — paid Starter plan, key `SERPAPI_API_KEY` in root `.env`. Available as a cross-check on DataForSEO SERP results.

**WebSearch and live browser checks** — valid as a spot-check, never as the primary data source.

**Pixelmojo Radar** JSON in `~/Downloads/` — now **optional**. DataForSEO AI Optimization is the primary AI-visibility benchmark. If a Radar report exists and is recent, read it as a secondary input; never gate the audit on it.

## Step 0: Brief Awareness + Foundation Scan (mandatory, runs first)

**Active briefs.** Glob `projects/briefs/*/brief.md` and read the frontmatter and Scope section of each. Do not work from a hardcoded list — new briefs must be visible. Briefs known to overlap this skill's territory include `seo-foundation-recovery`, `got-moles-marketing-os`, `seo-geo-reinforcement`, `got-moles-measurement-setup`, `mole-content-authority`, `internal-linking-recovery`, `aeo-p0-content`, `aeo-audit-2026` and `reviews-testimonials-seo`. Read status from each brief's own frontmatter, never from this list.

**Foundation docs (read as Context).** `brand_context/target-keywords.md` and `brand_context/authority-strategy.md` per the Context Needs table, plus `projects/briefs/internal-linking-recovery/got-moles-internal-linking-strategy.md` for the hub-and-spoke topology.

**Prior baseline.** The comparison baseline is this skill's own most recent dated report: glob `projects/str-ai-seo-local/{YYYY-MM-DD}_*audit*.md` and take the newest. `projects/str-ai-seo/2026-04-20_full-seo-geo-report.md` is the pre-skill historical baseline only — read it for context, never as the month-over-month comparison point.

**Optional third-party benchmark.** Check `~/Downloads/` for the most recent `ai-visibility-report-{domain}-{date}.json` (Pixelmojo Radar). If present, read its `recommendations`, `actions` and `insights` arrays as a secondary input and label anything sourced from it. Absence is not a blocker.

Build a one-line "already in flight" register. When the audit later surfaces a fix that lives inside one of these briefs, annotate it `→ already scoped in {brief}` and move on. The audit's job is to find what is *not* covered.

## Step 1: Confirm Scope

Ask one question: **"Full re-audit, single-page audit, or single-location GBP audit?"** Default = full re-audit against the newest report found in Step 0.

Confirm the priority query set. Every query is tagged with the surface it competes on before any measurement runs:

| Query shape | Surface | Example |
|---|---|---|
| `mole control {city}` / `mole removal near me` | **Local Pack** | Won by GBP, reviews, proximity, hours |
| `how do I get rid of moles in my lawn` | **AI Overviews** | Won by organic rank plus cited content shape |
| `best way to get rid of yard moles in western washington` | **AI Mode** | Won by fan-out coverage across the cluster |
| `who removes moles in Everett WA` / `what is Got Moles` | **Answer engines** | Won by directories, reviews, brand mentions, entity clarity |

Default set: 15 queries spanning all four surfaces, drawn from the seven clusters in `target-keywords.md` plus the Tier A city list, plus any new cities or services since the last run. Never run an untagged query — an untagged result cannot be scored against the right surface.

## Step 2: GBP Audit per Location (the dominant Local Pack signal)

**Note.** This step has two outputs: (a) the per-location GBP scorecard below; (b) the Local Pack factor audit. The per-page content rubric is Step 4.

[S] Whitespark 2026 Local Search Ranking Factors, 47 experts scoring 187 factors, Local Pack / Maps weights: **GBP signals ~32%, reviews ~20%, on-page ~15%, behavioral ~9%, links ~8%, citations ~6%, social ~5%.** Reviews and behavioral rose since the prior edition; citations declined. Run the completeness check in `references/gbp-audit.md` for **each of the 3 GBPs** (Seattle, Tacoma, Enumclaw). Score 0-100 per location.

**Before diagnosing anything as a ranking loss, verify live state.** [P] 2026 produced repeated GBP data bugs: reviews disappearing after reinstatement (2026-08-24), review replies not displaying (2026-07-22), a "no reviews yet" display bug (2026-07-09) and widespread review disappearance (2026-07-03). A missing review count is a bug hypothesis before it is a ranking hypothesis. Check the Sterling Sky local changes log and the profile itself before writing a finding.

### 2a. Top five Local Pack factors — audit each explicitly

[S] Whitespark's Local Pack top five, in order. Every one gets a pass/fail line in the report:

1. **Primary GBP category** — must be "Pest Control Service" on all three. Wrong primary category is the single biggest unforced error.
2. **Proximity to searcher** — uncontrollable. State it as context, never as a fix. If a location scores well and still loses the pack in a distant city, the answer is service-area page depth, not more GBP work.
3. **Keywords in the business title** — real legal name only. Keyword-stuffed names are a violation and [P] since 2026-08-10 repeated bilingual names and transliterations are also disallowed.
4. **Physical address in the search city** — interacts directly with SAB rules in 2c. A hidden address is correct for an SAB and costs this factor; that is the trade, not a defect.
5. **Business open at the time of search** — newly prominent and the cheapest fix in the list. Verify hours are set, accurate, include special and holiday hours, and actually cover the hours homeowners search. A profile closed at 7pm loses the 7pm pack.

### 2b. Per-location checks

- Primary category, plus up to 9 secondary categories for query-relevance breadth
- NAP consistency against site footer, Yelp, BBB, Angi, Apple Business Connect, Bing Places, Facebook (scored in Step 8 with its blast radius)
- Service area defined as an explicit city list, not a radius
- Service list with names, descriptions and pricing posture
- Photos: count, type coverage and freshness. Distinct primary photos per location
- Review count, velocity (last 30/60/90 days) and response rate
- Posts cadence
- Q&A — owner-answered, no orphans. [P] Note that Gemini-powered Ask Maps replaced the GBP Q&A surface from 2026-03-12, so weight this lower than in prior runs
- Attributes, messaging on/off decision, booking link destination
- Hours, including special hours (factor 5 above)

### 2c. Service-area business configuration check (all three profiles)

[P, long-standing] A service-area business travels to the customer and must not display a business address. For each profile verify: address hidden where customers are not received on site, service areas defined as explicit cities, and **no mail-drop address** — mail drops are prohibited unless staffed by your own team during business hours, and suspensions on that basis are very hard to reverse. A home-based SAB leaving its address visible faces eventual suspension. This is a live account-risk check, not a ranking check, and any failure is P0 regardless of score.

### 2d. Review-policy compliance check

[P] Two policy changes make review solicitation an active compliance surface:

- **2026-04-17** — staff review quotas and asking customers to name an employee are explicit violations. The policy prohibits merchants requesting that staff solicit reviews containing specific content, including content identifying a staff member. Staff may invite an honest, open-ended review offered equally to every customer with no reward attached. A customer naming a technician spontaneously is fine; asking them to is a violation. [P] Gemini-powered pre-publication enforcement has been deployed since 2026-04-16.
- **2026-07-24** — review-snippet structured data guidelines now name fake and undisclosed incentivized reviews. Reviews written for money, discounts, vouchers or free products without clear and prominent disclosure are violations, and they expose star-rating markup to a manual action that kills review rich-result eligibility while the page still ranks.

**Audit action:** read the actual review-request wording Got Moles sends. Check the n8n workflows (`tool-n8n`) and any Jobber automation (`tool-jobber`) for a review-request template or trigger, plus any printed leave-behind or text script Spencer uses. Flag P0 if any of these names a technician, sets a staff quota, or offers a reward. If a review-request automation exists in n8n or Jobber, name the workflow in the finding so the fix has an address. If none is found, say so explicitly rather than passing the check silently.

### 2e. DataForSEO wiring for this step

The per-location scorecard is scripted, not eyeballed. This is the fix for the 2026-05-13 deferral.

```bash
# GBP profile state per location: category, hours, attributes, rating, review count
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs business_data/google/my_business_info/live \
  '{"keyword":"Got Moles Seattle","location_code":1027744,"language_code":"en"}' \
  --out projects/str-ai-seo-local/data/gbp-seattle.json

# Individual reviews with dates -> review velocity and response rate, computable not deferrable
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs business_data/google/reviews/task_post \
  '{"keyword":"Got Moles Seattle","location_code":1027744,"language_code":"en","depth":100,"sort_by":"newest"}'
```

Repeat per location with the Tacoma (1027773) and Enumclaw (1027581) codes. `business_data/google/my_business_updates` covers post cadence and `business_data/google/questions_and_answers` covers the Q&A check where those endpoints are available on the account. Reviews are a task-based endpoint: post the task, then collect with the matching `task_get`. Anything the API does not return still needs the GBP dashboard — say which, and route it per the no-silent-deferrals Rule.

Output: 3-row scorecard with per-location score, top-five-factor pass/fail, SAB status, review-policy status, and the three highest-leverage fixes per location.

## Step 2.5: Call-Path Audit (the commercial risk this year)

[S] The single biggest commercial risk for a call-driven local business in 2026 is not a ranking loss. It is that the paths carrying calls are being removed from underneath stable rankings. AI-powered local packs show 1-2 businesses instead of 3 and **have no call button at all**. Click-to-call from GBP has dropped substantially on mobile over two years while desktop website clicks stayed stable, which isolates the cause to interface change rather than ranking loss. A business can hold its 3-pack position while its calls fall. [U] on the specific call-button removal date and on the circulating 50-70% call-drop figures — use the direction, never those numbers.

Audit every surface that can still reach the customer:

| Path | Check | Why |
|---|---|---|
| **Website click-to-call** | Prominent, above the fold on mobile, tappable `tel:` link, no interstitial. Present on every city page and every blog post | It now absorbs demand the map pack used to convert |
| **GBP call button** | Present per location, correct number, tracked | Eroding on mobile, still live on desktop |
| **GBP website click** | Correct destination per location, tracked | Desktop-stable, the surviving GBP path |
| **Local Services Ads** | [P/S] Paid placements retain prominent call buttons where organic listings lose them | The only surface where the call button is not at risk |
| **Messaging / booking** | Where messaging is on, is it staffed. Where the booking link routes | Half-on messaging hurts more than off |
| **Call tracking** | Distinct tracked numbers per surface (GBP, website, LSA), reconciled | With Google's agent placing calls on searchers' behalf, this is the only way to see where calls originate |

**Paid-adjacent note (mandatory when LSAs are live).** [P] From **2026-10-01** Google begins charging for missed and subsequent calls on Local Services Ads, announced 2026-08-25. A missed call becomes a direct cost, not just a lost lead. [P] LSAs also migrated into the main Google Ads platform on 2026-07-21. Flag this to `ops-got-moles-ads` with the answer-rate and after-hours-routing implication stated; do not build the paid fix here.

## Step 3: Render Check

The site is Next.js + Payload + Vercel SSR. Spot-check one city page and one blog post with raw `node fetch` and `User-Agent: GPTBot` to confirm JSON-LD blocks and body copy render server-side. WebFetch strips `<script>` tags, so it cannot see JSON-LD — use raw fetch.

Do not skip this on the strength of a prior verification. The 2026-04-24 smoke test is a historical record, not current evidence; a build, dependency or metadata-API change since then invalidates it. If schema is missing in render (silent Next.js metadata-API failure), flag P0 and stop.

[S] Crawlability is the highest-return technical item and it costs nothing: 73% of sites block AI crawlers somewhere (Otterly, 1M+ citations, Jan-Feb 2026). Confirm as part of this step that robots.txt, the CDN and any WAF rule allow `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Bingbot` and Googlebot, and check the published crawler IP lists rather than trusting the user-agent string. `str-onpage-audit` owns the full crawlability pillar — flag here, fix there.

## Step 3.5: Sitewide Schema Completeness (correctness and entity binding)

**Schema is not an AI-citation lever and must never be presented as one in client-facing output.** [S] The Ahrefs difference-in-differences test (1,885 pages adding JSON-LD versus 4,000 matched controls, 2026-05-11) found AI Overviews −4.6%, AI Mode +2.4%, ChatGPT +2.2% — no measurable citation uplift. [P] Google: "Structured data isn't required for generative AI search, and there's no special schema.org markup you need to add." Cite the Ahrefs result whenever the change is questioned.

What schema still earns is rich results, correctness, and **entity binding** — which for this brand is the disambiguation defense. Audit in this priority order:

| Priority | Pattern | What to check |
|---|---|---|
| 1 | **LocalBusiness, most specific subtype** | Present per location with `areaServed`. Matches visible page content |
| 2 | **Service** | Per service, bound to the Organization |
| 3 | **Organization `sameAs` spine + `knowsAbout`** | Identical `sameAs` set everywhere: 3 GBP map URLs, Yelp, BBB, Angi, Facebook, LinkedIn, YouTube. `knowsAbout` binds the brand to the pest-control sense of "mole". **This is the one place schema still earns its keep** |
| 4 | **BreadcrumbList** | Every non-root page emits it |
| 5 | **Article / BlogPosting with `dateModified`** | Reflects a real content change, not a timestamp bump. Paired with an accurate `Last-Modified` header and sitemap `lastmod` |
| 6 | **Person (Spencer)** | Author E-E-A-T layer, `worksFor` the Organization |
| 7 | **Review / AggregateRating** | Only where reviews are genuine and any incentive is disclosed — see the incentivized-review gate below |

**Incentivized-review gate (blocking).** [P] Since 2026-07-24, any page carrying Review or AggregateRating markup must be verified free of fake or undisclosed incentivized reviews. Failure is manual-action exposure. If Step 2d found an incentive in the request flow, the markup is a live risk and this gate fails.

**Removed from this audit, deliberately:**

- **FAQPage schema is no longer a deliverable or a scored item.** [P] FAQ rich results were deprecated 2026-05-07, removed from search appearance and the Rich Results Test in June 2026, and dropped from Search Console API data in August 2026. FAQPage markup remains a valid schema type and causes no harm. **Keep the Q&A content shape; stop scoring the markup; never recommend removing existing markup** — ripping it out is churn with no upside.
- **Speakable is optional at most.** Never scored above optional and never described as high-impact.
- **`llms.txt` and `llms-full.txt` are not recommendations, not scored items, and not hallucination-correction surfaces.** [P] Google, 2026-06-15: llms.txt files are not required for Search visibility or rankings. OpenAI, Anthropic and Perplexity crawler documentation covers robots.txt only and never mentions llms.txt. If files exist, leave them.
- **`Google-Extended` blocking is not a finding.** [P] It is a Gemini training opt-out only. Blocking it does not remove pages from AI Overviews or AI Mode and costs training presence. Recommend allowing it, along with `GPTBot` and `ClaudeBot`.
- **Never enable the Search Console generative-AI opt-out.** [P] Sites that opt out receive no traffic or impressions from generative AI features, with no per-feature control.

## Step 4: Local Citation Pillar Score

Score per page (0 / ½ / 1) across the blog posts and city pages. This rubric is built on local-service signals — review density, named technician, before/after proof, city-coverage depth — because homeowner queries about mole removal are not B2B research queries.

| Signal | Weight |
|--------|:-:|
| **Homograph gate (blocking, scored separately as pass/fail)** — "mole" never appears in the title, H1, any H2 or the first paragraph without a disambiguating token in the same sentence (lawn, yard, turf, ground, burrow, tunnel, molehill, trapping, pest, *Scapanus*) | gate |
| **Answer-first block** — 40-60 words under the H1, self-contained, one fact per sentence, reads correctly lifted out of the page with zero surrounding context | 2 |
| **H1 matches the recommended H1 in `target-keywords.md`** and carries the lawn signal per Rule 1 | 2 |
| **Fan-out coverage** — each H2 is a question or direct topic followed by a self-contained 40-80 word answer, and the page's H2 set covers the sub-questions a fan-out on its primary keyword would generate (identification, damage, chemical-free methods, pricing, prevention, seasonality, pets and children) | 2 |
| **H2/H3 carry secondary keywords from the page's cluster** per the `target-keywords.md` cluster table | 1 |
| LocalBusiness or Service schema with `serviceArea`, matching visible content | 1 |
| `aggregateRating` with the 219+ review count visible, and the incentivized-review gate passing | 1 |
| Named technician or Spencer attribution where relevant | 1 |
| Review density on page (3+ embedded reviews from local clients) | 2 |
| Before/after photo or visible field result | 1 |
| Service-area coverage table or city-link block | 1 |
| Q&A content shape present where the page has answerable sub-questions (content shape only — FAQPage markup is not scored) | 1 |
| Visible publication and updated date, `dateModified` reflecting a real content change, accurate `Last-Modified` header | 1 |
| **Extractability** — at least one of: HTML table for comparisons, ordered list for steps, distinct stat block for a citable number | 1 |
| **Citable statement** — at least one specific, attributable, quotable claim: a number, a named local specific, a named method. Generic advice does not get quoted | 1 |

Max 18 → normalize to /100. The homograph gate is pass/fail on top: a page that fails it cannot score above 50 regardless of the rest.

**No word-count target anywhere.** [S] Ahrefs, 174,048 pages: the correlation between word count and AI Overview citation is 0.04. Coverage of the fan-out set replaces length entirely.

**City pages: portfolio-level flag only.** Apply the doorway test — strip the city name from the title, H1 and body; if what remains is indistinguishable from any other city page, the page fails. [U, practitioner consensus] The 2026 failure mode is quiet suppression or grouping so only one representative page shows, and it does not announce itself in Search Console. Count how many of the ~90 pages fail, name the worst offenders, and hand the per-page work and the cannibalisation cull to `str-onpage-audit`. Do not attempt the cull here.

**Per-page link plan (deliverable).** For each Tier-1 and Tier-2 page audited:

| Page | Inbound links present | Inbound links missing (target) | Outbound links present | Outbound links missing (target) | Anchor text gaps |
|---|---|---|---|---|---|

Derive missing links from the `target-keywords.md` cluster mappings and the hub-and-spoke topology. Anchor diversity per Rule 5: never let a single anchor phrase dominate. City pages link **up** to service and informational hubs and **out** to genuinely local proof, never sideways into a ring of near-duplicates. Hand execution to `str-internal-links`.

## Step 5: Per-Surface Visibility Sweep

Run the tagged priority query set from Step 1 against each surface separately. Never merge the results — a Local Pack win and an AI Overview win are different outcomes bought with different work.

### 5a. Local Pack (transactional queries)

Measured per city, per query. This is the first time the skill has been able to measure Local Pack position at all.

```bash
# Local Finder results per priority city
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs serp/google/local_finder/live/advanced \
  '{"keyword":"mole control bellevue","location_code":1027509,"language_code":"en","depth":20}' \
  --out projects/str-ai-seo-local/data/localfinder-bellevue.json

# Maps results where the pack composition matters more than the finder list
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs serp/google/maps/live/advanced \
  '{"keyword":"mole removal near me","location_code":1027744,"language_code":"en","depth":20}'
```

Record per query: pack position, which three (or in an AI local pack, which one or two) businesses show, whether a call button is present, and which competitor holds the slot.

### 5b. AI Overviews and classic organic (informational and hybrid queries)

The advanced organic endpoint returns `ai_overview` and `local_pack` items in the same response, so one call covers both the AI Overview and the organic rank it is coupled to.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs serp/google/organic/live/advanced \
  '{"keyword":"how much does mole removal cost in washington","location_code":21180,"language_code":"en","device":"desktop","depth":20,"load_async_ai_overview":true}' \
  --out projects/str-ai-seo-local/data/aio-cost-wa.json
```

Record: AI Overview present, sources cited, whether Got Moles or a competitor is cited, and the organic position of each cited source. [S] AI Overviews stay tightly coupled to organic rank — seoClarity, 432,000 keywords: 97% cite at least one source from the organic top 20 — so a citation gap here is usually a rank gap first. [S] Whitespark: a top-10 organic ranking still only gives roughly a 25% chance of AI Overview appearance, so rank is necessary and not sufficient.

### 5c. AI Mode (fan-out queries)

**AI Mode has no rank. Track presence and absence per query on a fixed cadence and never report a position.** Results are personalized and multi-turn, so a single observation is an observation, not a measurement. Log each query as cited / not cited with the date, and read the trend across runs.

AI Mode is loosely coupled to organic rank via query fan-out, so the diagnostic is different: when Got Moles is absent, check whether the cluster covers the fan-out sub-queries rather than whether the head page ranks. [P] Google's own worked example of fan-out is a lawn-weeds query splitting into herbicides, chemical-free removal and prevention — a direct read-across to mole control.

### 5d. Answer engines (ChatGPT, Perplexity, Gemini, Claude)

```bash
# Is the brand named, with sentiment and source references, across engines
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/llm_mentions/live \
  '{"keyword":"Got Moles","llm_models":["chat_gpt","gemini","perplexity"],"limit":50}' \
  --out projects/str-ai-seo-local/data/llm-mentions.json
```

Keep `limit` low and the model list short — [P] LLM Mentions bills $0.10 per request plus $0.001 per row.

Record per engine: brand named or not, sentiment, and which third-party sources the engine cited. [S] Sentiment flips roughly 6.7x more often than mention presence, so a mention that was positive last month is not automatically positive now.

### 5e. Citation-source audit (what to do with the sources)

Every third-party source that recurs across engines for this vertical becomes a mention target, handed to `str-authority-strategy`. [P] Sterling Sky logged on 2026-08-12 that AI Overviews for local queries were pulling from low-quality listicles: being on the right lists matters more than it should. [S] Ranked "best-of" listicles are the single most-cited format at roughly 21% of all citations (arXiv 2606.20065). Inclusion in a "best mole removal in {city}" roundup outranks most link building.

Where a competitor is cited and Got Moles is not, run a structural comparison: fetch the competitor URL with `User-Agent: GPTBot`, extract H1, answer-first wording, heading set, extractable elements, `dateModified` and named entities, and diff against the equivalent Got Moles page. Document the gap. Do not conclude "they have schema and we don't" — that is the debunked lever.

## Step 5.5: Hallucination + Homograph Matrix

Cross-check core facts against what each engine actually says. This step used to be run by hand and got deferred; it is now scripted.

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/chat_gpt/llm_responses/live \
  '{"user_prompt":"what is Got Moles","model_name":"gpt-4o","web_search":true}' \
  --out projects/str-ai-seo-local/data/llm-what-is-got-moles-chatgpt.json
```

Repeat against the Gemini and Claude equivalents under `ai_optimization/`. [P] LLM Responses bills $0.0006 per prompt plus provider charges, so the full matrix is cheap — there is no longer a cost argument for deferring it.

**Facts to verify**, ground truth from the `canonical_facts` block in `target-keywords.md`:

| Fact | Ground truth | Query |
|---|---|---|
| Founding year | 2017 | "When was Got Moles founded?" |
| Client count | Nearly 5,000 properties served, 92+ communities across 6 counties | "How many clients has Got Moles served?" |
| Service area | Western Washington — King, Pierce, Snohomish, Thurston, Kitsap, Lewis | "Where does Got Moles operate?" |
| Pricing | TMCP $100/month; OMP $450 flat + $150 setup; Commercial custom-quoted | "How much does Got Moles cost?" |
| Founder | Spencer Hill, US Army veteran, founded 2017 | "Who runs Got Moles?" |
| Reviews | 219+ five-star Google reviews across 3 locations | "How good is Got Moles?" |

**Homograph check, per engine (this is the one that matters most for this brand).** Ask each engine "what is Got Moles" and "who removes moles in Everett WA" and record which sense of "mole" comes back. A dermatology answer to either is a total citation loss, not a partial one. [S] Business-profile accuracy measured 68% on ChatGPT and Perplexity against 100% on Gemini, so expect resolution failures and measure them rather than assuming.

Score each cell: correct / vague but not wrong / wrong. Output a facts × engines matrix plus a separate homograph row.

Any wrong cell produces a fix proposal drawn from the achievable stack only:

- Strengthen the Organization `sameAs` spine and `knowsAbout` so the entity resolves to the pest-control sense
- Add or correct the fact on the page a retrieval would land on, in the first 40-80 words
- Add a verified-fact callout on `/about/` if missing
- Strengthen the canonical disambiguation page and link every "mole" mention to it
- Re-run the query on the next scheduled cadence to see whether the correction propagated

**Never propose an llms.txt entry as a hallucination fix.** No engine documents consuming it.

## Step 6: Brand Disambiguation — Lawn Mole vs Skin Mole

"Got moles?" collides with dermatology intent. [P/mechanism] The skin-mole sense dominates the training distribution, so this is popularity bias on top of ordinary ambiguity — the paid side already handles it with ~120 medical-cluster negatives, and the organic and AI side needs the equivalent. [U] on every specific tactic below; no controlled study exists, but the underlying mechanism (candidate generation, then context-weighted entity linking with popularity bias) is standard and safe to rely on.

Run `references/service-name-disambiguation.md`:

- Test the query set across Google AI Overviews, AI Mode, ChatGPT, Perplexity and Copilot; record which sense each engine assumes
- Check the Knowledge Panel for the brand and confirm it is not being absorbed into the wrong sense
- Audit the Organization `sameAs` spine — 3 GBP map URLs, Yelp, BBB, Angi, Facebook, LinkedIn, YouTube, identical everywhere
- Confirm Spencer's Person schema is present and bound to the Organization
- Confirm one canonical disambiguation page exists (what a lawn mole is, why it is not a skin mole, what a molehill looks like) and that every page mentioning "mole" links to it

Score: clear / partial / leaky. Recommend specific `sameAs` additions if leaky.

## Step 7: Service-Area Coverage Audit

The seo-geo-reinforcement brief tracks the citySlug-versus-city-page reconciliation. This skill verifies audit status, not fixes:

- Read `src/lib/redirects.ts` and `src/lib/city-data.ts`
- Cross-reference against the Tier A and Tier A+ city lists in `target-keywords.md` and the agency rankings tracker
- Flag any city with ranked keywords on the old site that lacks a live page
- Flag the reverse: any live city page whose city is not in the strategy at all
- Annotate anything already scoped: `→ scoped in seo-geo-reinforcement Track A1`

Do not re-run the reconciliation — flag and link. Measure actual Local Pack presence per Tier A city with the Step 5a call rather than inferring coverage from the page count.

## Step 8: Directory and Citation Surface, by Engine

The old "claim everything" citation list is replaced by an engine-specific priority order, because the engines do not read the same directories.

[S] Foundation Marketing / AirOps, 28.5M AI responses, published 2026-05-28, total AI citations by directory:

| Priority | Directory | AI citations | Read |
|:-:|---|---|---|
| 1 | **Yelp** | 512,680 | Highest-leverage off-site local asset, and higher still on ChatGPT since the 2026-07-23 OpenAI licensing deal |
| 2 | **Better Business Bureau** | 149,710 | Disproportionately important for ChatGPT, which BBB led at 68,617. Cheap to establish |
| 3 | **Angi** | 145,633 | **The Gemini lever** — Angi led Gemini at 18,870 citations while Yelp scored 49 |
| 4 | Thumbtack | 56,004 | Secondary |
| 5 | HomeAdvisor | 33,582 | Secondary |
| 6 | Nextdoor | 10,308 | Local and community tail |

**Directory by engine — audit presence in this order:**

| Engine | Directory that matters most |
|---|---|
| Google AI Mode | Yelp (340,721 citations, 66% of Yelp's total) |
| Perplexity | Yelp (146,196, 28.5%) |
| ChatGPT | BBB first, then Yelp — and Yelp's weight is rising post-deal |
| Gemini | **Angi**, decisively. Yelp is near-absent here |

### 8a. Yelp is a tier-1 asset, on par with GBP

[P] OpenAI signed a Yelp licensing deal on 2026-07-23 covering reviews, ratings, photos, business details and **Yelp's Request a Quote flow** for local services. That changes what feeds ChatGPT's answer to "mole removal near me". [S] An August 2026 test of 4,607 runs found Yelp attached to 95.83% of ChatGPT's structured business cards.

**The Foursquare claim is dead and must not appear in any Got Moles deliverable.** [S] The same test found Foursquare at 0.00% of citations on ChatGPT's primary surface. Any inherited recommendation to build or optimize a Foursquare listing is retired. The author's own caveat applies to the replacement too: partnership numbers have shelf lives, so re-check this against the landscape file each quarter.

Audit the Yelp profile to the same depth as a GBP:

- Claimed and verified, per location
- Complete profile: hours, service area, description, business details
- **Service categories** correct and complete
- Photos, current and location-distinct
- Review responses — response rate and tone, same standard as GBP
- **Request a Quote enabled** — this is the specific flow the OpenAI deal surfaces inside ChatGPT for local services, and leaving it off forfeits the highest-leverage single item in this step
- NAP identical to GBP

### 8b. Remaining directories

BBB (accreditation status), Angi (claimed, response rate, badges), Thumbtack, HomeAdvisor, Nextdoor (neighborhood presence), Facebook. Per location where the platform supports it.

### 8c. Low-cost, unmeasured — do them, label them

[U-flagged] **Bing Places** (free, feeds Bing, Copilot, Yahoo and Windows Search from one listing) and **Apple Business Connect** (free, feeds Apple Maps, Siri and Spotlight). [U] on their weight in Copilot and Siri local answers. They are cheap and plausible, so do them — and in the report label them explicitly as **unmeasured**, so nobody mistakes them for evidence-backed levers. Detail in `references/bing-copilot.md`.

### 8d. Unstructured citations (scored category)

[S] Whitespark's new AI-search-visibility dimension names high-quality unstructured citations among the top drivers, alongside expert-curated best-of lists and prominence on industry domains. [S] AI Mode is documented scraping exactly these: blogs, local news, community pages, sponsorship listings, industry publications and local business association sites. **A citation-builder tool will not find these** — they are found by looking.

Score presence across: Western Washington chambers of commerce, local news outlets, neighborhood and homeowner associations, community event and sponsorship listings, pest-control and lawn-care industry publications, and any "best mole removal in {city}" roundup. Hand the target list to `str-authority-strategy`.

### 8e. NAP consistency — an AI-visibility item with a named blast radius

NAP inconsistency across GBP, Yelp, Facebook, BBB, Angi and the website is **the mechanism by which an engine fails to resolve the business at all**, not a minor tidiness issue. [S] Profile accuracy measured 68% on ChatGPT and Perplexity. State the blast radius in the finding: which engines read which surface, and therefore which answers a given mismatch corrupts. One phone-format drift on Yelp is a ChatGPT and Perplexity problem, not a Yelp problem.

### 8f. Citations are scored twice

[S] Citations are ~6% of Local Pack weight and falling, and simultaneously **rising** as an AI-visibility factor. Score them in both dimensions and report both. A recommendation that reads "citations no longer matter" is wrong for AI and a recommendation that reads "build 50 citations" is wrong for the Local Pack. The correct read: structured directory citations are near-saturated as a Local Pack lever, and the engine-specific ones plus unstructured mentions are where the remaining upside sits.

## Step 9: Score Assembly + Report

Pillar weights, anchored to [S] Whitespark 2026 Local Pack weights and adapted to what this audit covers:

| Pillar | Weight | Anchored to |
|--------|:-:|---|
| GBP and Local Pack (Steps 2, 2a-2e, 5a) | 32% | Whitespark GBP signals ~32% |
| Reviews: corpus, velocity, response, policy compliance (Steps 2d, 8) | 20% | Whitespark reviews ~20% |
| On-page and content shape (Step 4) | 15% | Whitespark on-page ~15% |
| AI visibility: AI Overviews, AI Mode, answer engines (Steps 5b-5e, 5.5) | 15% | Not in the Whitespark Local Pack model — scored separately because it is a separate surface |
| Call path and conversion surface (Step 2.5) | 8% | Behavioral ~9%, the part this audit can see |
| Citations and directories, both dimensions (Step 8) | 6% | Whitespark citations ~6% as a Local Pack factor, reported again in the AI pillar |
| Technical and render (Step 3) | 4% | Gate, not a growth lever |

**Report sections:**

1. Headline verdict, one line, plus the step-completion count required by the 2026-05-13 Rule
2. Honest-expectation statement (see Outcome — mandatory, with its [S] labels)
3. Pillar scores table
4. GBP-per-location scorecard, including the top-five Local Pack factor pass/fail, SAB status and review-policy status
5. Call-path audit, including the 2026-10-01 Local Services Ads change where LSAs are live
6. Per-surface visibility map: Local Pack position by city, AI Overview citation by query, AI Mode presence/absence by query, answer-engine mention by engine
7. Directory-by-engine presence, with Yelp Request a Quote called out and Bing Places and Apple Business Connect labeled unmeasured
8. Hallucination and homograph matrix
9. Brand disambiguation status
10. Service-area coverage gaps
11. Prioritized fix list, ranked by impact, risk, dependency order and reversibility. **No time or effort estimates**
12. Already in flight (the Step 0 register)
13. Deferred, with owner and blocker, per the 2026-05-13 Rule
14. Month-over-month delta if a prior report was found

**Every statistic in the report carries [P], [S] or [U].** Several widely repeated 2026 "facts" did not survive checking and must never appear: Foursquare's ChatGPT share, Anthropic and Perplexity honoring llms.txt, GBP's "28.5% of all citations", and the 50-70% call-drop figures.

## Step 10: Save Output and Collect Feedback

Save to: `projects/str-ai-seo-local/{YYYY-MM-DD}_got-moles-audit.md`. Raw API responses go to `projects/str-ai-seo-local/data/`.

Create folders if missing. After save, show the full absolute path.

Push the report to Notion for review — Notion is the Got Moles review mechanism (Spencer and the team review there). Create the page under the Got Moles project with the Notion MCP tools (`mcp__claude_ai_Notion__notion-create-pages`). No script needed.

Report the DataForSEO spend for the run from `.dataforseo-usage.log`.

Ask: "Anything missing, miscategorized, or wrong weighting?" Log responses to `context/learnings.md` under `## str-ai-seo-local`. If feedback reveals a methodology issue, update the `## Rules` section of this SKILL.md immediately.

## Monthly Re-Audit

The recurring loop, in addition to a re-run of Steps 2, 5 and 8:

- **[P] Search Console → Performance → Generative AI** — the primary first-party AI-visibility number. UI only, manual export, impressions from 2026-05-18 forward with no backfill, no clicks and no queries.
- **[P] Bing Webmaster Tools → AI Performance** — total citations, page-level citation activity and grounding queries. UI only. Feed the grounding queries straight into `str-question-harvester` and `str-keyword-strategy`; they are real retrieval phrasing no keyword tool has.
- **GA4** — AI Assistant channel plus a custom channel group above Referral to catch Perplexity and Claude. Report AI impressions and landed traffic as two separate numbers and never as one attributed figure.
- **AI Mode presence log** — the running cited / not-cited record from Step 5c. Trend, not rank.

## Rules

*Entries added when issues surface during runs. Format: `- {YYYY-MM-DD}: {correction}`*

- 2026-05-08: Phase 0 currency audit — added Speakable + BreadcrumbList + dateModified + Last-Modified + FAQPage aggregation rule + Organization knowsAbout/hasOfferCatalog + extractability (tables/lists/stat blocks) + H2/H3 secondary-keyword check + per-page link plan + hallucination check + citation-gap study loop. Pixelmojo declared as recurring third-party benchmark in Step 0. `target-keywords.md` declared as primary-keyword source of truth. **Superseded 2026-09-02 in three parts:** (a) FAQPage schema and its aggregation rule are no longer scored — [P] FAQ rich results were removed between 2026-05 and 2026-08; keep the Q&A content shape, keep existing markup, stop recommending it; (b) Speakable is demoted to optional at most, never high-impact; (c) Pixelmojo is optional, not the recurring benchmark — DataForSEO AI Optimization is primary. The rest of the rule stands.
- 2026-05-13: **No silent deferrals.** When invoked as a "full" audit, every one of Steps 2-8 must either be completed OR appear in an explicit "Deferred" section of the report with: which step, why it was deferred, the owner who can unblock it, and where it is tracked. The headline verdict must state "N of M steps complete, K deferred — see Deferred section." Running a step from third-party report data alone counts as DEFERRED for first-party verification, not complete. Reason: the 2026-05-13 audit shipped sitewide plus 10 page audits but quietly skipped first-party hallucination checks, the citation-gap loop, GBP, external citation surface and the whole traditional-SEO layer. Roy had to ask "what's missing." **Reinforced 2026-09-02:** the access excuse is largely gone. Steps 2, 5, 5.5 and 8 are now scripted through DataForSEO Business Data, SERP and AI Optimization endpoints. A deferral on those steps now needs a stated reason that is not "no dashboard access."
- 2026-05-25: Ground every schema and page-change recommendation in the LIVE artifact (raw JSON-LD via node fetch, or the source builder) before proposing additions. A recommendation to add `knowsAbout` / `areaServed` / `sameAs` was made when they were already present and correct, and Roy flagged "are you looking at live data?". WebFetch strips `<script>` — use node fetch for JSON-LD.
- 2026-09-02: **Never present schema as an AI-citation lever.** [S] Ahrefs difference-in-differences, 1,885 pages versus 4,000 controls: −4.6% / +2.4% / +2.2%. [P] Google states structured data is not required for generative AI search. Schema is audited for correctness, visible-content match and entity binding only. The `sameAs` spine plus `knowsAbout` is the one place it still earns its keep, because it is this brand's disambiguation defense.
- 2026-09-02: **Track AI Mode by presence, never by rank.** Results are personalized and multi-turn. Log cited / not cited per query per run and read the trend. Any report line implying an AI Mode "position" is wrong.
- 2026-09-02: **Score citations twice.** Once as a declining Local Pack factor (~6% and falling) and once as a rising AI-visibility factor. Reporting a single citation score hides the fact that the two dimensions now point in opposite directions.
- 2026-09-02: **The review-request flow is a compliance surface, not just a growth lever.** Check the actual wording in n8n and Jobber before scoring review velocity. [P] Staff quotas, asking a customer to name a technician, and undisclosed incentives are all violations, the last with manual-action exposure on star-rating markup.
- 2026-09-02: **Verify live GBP state before diagnosing a ranking or review loss.** 2026 produced repeated review-disappearance and review-display bugs. A data bug is the first hypothesis, not the last.

## Self-Update

If the user flags an issue during or after a run — wrong weight, missed local signal, miscategorization, recommendation that ignores an active brief — update the `## Rules` section in this SKILL.md immediately. Don't just log it; fix the skill so it doesn't repeat the mistake.

## Troubleshooting

- **GBP scorecard shows 100% but rankings flat:** check proximity, which is one of the top five Local Pack factors and entirely uncontrollable. If the searcher is not near the profile centroid, no GBP work fixes it. Pivot to service-area page depth and to the surfaces that do not depend on proximity.
- **Rankings are stable but calls are down:** this is the expected 2026 pattern, not an anomaly. [S] The mobile local-pack call button is eroding and AI local packs have no call button at all. Run Step 2.5 before touching rankings.
- **Cited on informational queries but not transactional ones:** expected, and it is two different jobs. [S] Transactional local intent fires the Local Pack ~93% of the time and is won through GBP; informational fires AI Overviews ~92% and is won through cited content. Do not try to win a transactional query with a blog post.
- **Absent from AI Mode while ranking well:** AI Mode is fan-out coupled, not rank coupled. Check whether the cluster answers the sub-questions, not whether the head page ranks.
- **Reviews vanished from a profile:** check for a known GBP bug before assuming enforcement or a ranking event. Several ran through 2026.
- **Schema in code but not in render:** likely a Next.js metadata-API silent failure. Use raw `node fetch`, not WebFetch, which strips `<script>` tags. Check `src/lib/schema.tsx` and `src/app/(frontend)/layout.tsx`.
- **Bing AI Performance returns no data:** the property must be verified in Bing Webmaster Tools and needs time to populate. The report is UI-only; there is no API path.
- **DataForSEO call returns a task error or unexpected shape:** re-run with `--dry` to inspect the payload, confirm the endpoint path against the landscape file §10.2 and the client's usage examples, and check the balance with the free `appendix/user_data` GET before assuming a payload problem.
- **Audit recommends fixes already in another brief:** Step 0 wasn't run. Re-run from Step 0 and annotate.

## Change log

- **2026-09-02** — Largest revision since the skill was built, against `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (install root) and the September 2026 skill audit.
  - **Yelp replaces Foursquare entirely.** [P] The 2026-07-23 OpenAI–Yelp licensing deal makes Yelp a tier-1 asset on par with GBP, including Request a Quote. [S] The Foursquare-supplies-ChatGPT claim was measured at 0.00% and is retired.
  - **Directory audit is now engine-specific** (AI Mode → Yelp, Perplexity → Yelp, ChatGPT → BBB then Yelp, Gemini → Angi), then Thumbtack, HomeAdvisor, Nextdoor. Bing Places and Apple Business Connect kept as low-cost items explicitly labeled unmeasured.
  - **Re-weighted to [S] Whitespark 2026 factor weights** and citations are now scored twice, declining for the Local Pack and rising for AI visibility.
  - **New: top-five Local Pack factor audit** including open-at-search-time hours, **call-path audit (Step 2.5)** with the 2026-10-01 Local Services Ads missed-call charging change, **review-policy compliance check**, **SAB configuration check**, and a **GBP data-bug caution** before diagnosing a loss.
  - **Surfaces split and named**: Local Pack (~93% transactional), AI Overviews (~92% informational), AI Mode (fan-out, presence-tracked not ranked), answer engines. Every query is surface-tagged before measurement.
  - **DataForSEO wired into the chronically deferred steps** — Business Data for the GBP scorecard and review velocity, SERP advanced for AI Overviews and local pack, Local Finder and Maps for Local Pack position, AI Optimization for the citation sweep, hallucination matrix and homograph check. Real Washington location codes included; per-audit spend guard added.
  - **Removed as scored items**: FAQPage schema (rich results gone), Speakable as high-impact, llms.txt and llms-full.txt, and Google-Extended blocking. Existing markup is left alone.
  - **Honest expectations added to the report template** — niche brands ~11% of relevant AI answers, AI local visibility 3-30x harder than the 3-pack, star rating a filter rather than a ranking factor, NAP consistency reframed as an AI-resolution input with a named blast radius, unstructured citations added as a scored category.
  - **Measurement**: Search Console Generative AI report and Bing Webmaster AI Performance added to a monthly re-audit section, both flagged UI-only. GA4 caveat added — the AI Assistant channel excludes Google's own AI surfaces and AI Mode is `noreferrer`, so AI Mode attribution is never promised.
  - **Fixed**: baseline lookup now reads this skill's own dated reports rather than the root skill's folder; output name standardized to `{YYYY-MM-DD}_got-moles-audit.md`; routing to the non-existent `mkt-positioning` and `mkt-icp` replaced with the real upstream skills; Step 0's frozen brief list replaced with a live glob; the four-month-old render verification no longer authorizes skipping Step 3; retired the unsourced "+35% CTR", "primary category is the #1 ranking signal", "76.9% / 7%" and Princeton-rubric claims.
