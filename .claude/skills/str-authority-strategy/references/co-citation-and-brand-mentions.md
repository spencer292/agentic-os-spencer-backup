# Co-Citation and Brand Mentions

> **CLIENT CONTEXT:** this is a Got Moles client skill. Every example below is Got Moles — a mole-control service business in Western Washington with three Google Business Profiles (Seattle, Tacoma, Enumclaw), 219+ five-star Google reviews, nearly 5,000 properties served, founded 2017 by Spencer Hill (US Army veteran, 15+ years personal mole-control experience — distinct from the company's 2017 founding). Never write "WA's #1" (unsubstantiated) and never claim I-713 compliance. US English throughout.

Steps 5 and 8 of `str-authority-strategy`. Off-site brand signals are the primary AI-visibility lever, and links are a byproduct.

## What the evidence actually says

**[S] Ahrefs, 75,000 brands, published 2025-12-12.** Spearman correlations against AI brand visibility:

| Signal | ChatGPT | AI Mode | AI Overviews |
|---|---|---|---|
| YouTube mentions | 0.737 | 0.712 | 0.740 |
| Branded web mentions | 0.664 | 0.709 | 0.656 |
| Branded anchors | 0.511 | 0.628 | 0.527 |
| Branded search volume | 0.352 | 0.466 | 0.392 |
| Domain Rating | 0.266 | 0.285 | 0.326 |
| Backlinks / URL Rating | ~0.2-0.3 | ~0.2-0.3 | ~0.2-0.3 |

Ahrefs' own caveat, quoted: "correlation isn't causation. We've spotted patterns between search metrics and AI mentions, but that doesn't mean improving these metrics will automatically boost your AI visibility." Carry that caveat into any client-facing use of these numbers.

**What it means in practice.**
- The gap between mentions and backlinks is 2-3x depending on which signal you compare, not a flat "3x". The earlier version of this file asserted "3x, 0.664 vs 0.218" sourced to trade content — corrected 2026-09-02 against the primary.
- **YouTube is the strongest single correlate**, ahead of web mentions. For Got Moles that means mole damage, trapping process and before/after footage are authority work, not marketing leftovers.
- A brand named on 30 authoritative regional sites is worth more for AI citation than 30 links from thin directories.
- Unlinked mentions carry signal. Do not chase every link.
- **[S] Ranked third-party listicles are ~21% of all AI citations** (arXiv 2606.20065) — the single most-cited format. A "best mole removal in Everett" roundup that names Got Moles beats most link building.
- **[S] Niche brands appear in 11% of relevant answers.** That is the honest baseline for a local service business, and the number to benchmark against instead of an invented target.

Full landscape context: root `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` §5.

## The hard prohibition

**[P] Google's generative-AI optimization guide names inauthentic mention-building as unnecessary, and states its spam systems already filter what AI features depend on.** So:

- No paid placement presented as editorial
- No mention swaps or reciprocal-mention schemes
- No seeded forum, Reddit or Nextdoor posts written as if from a customer
- No AI-generated mention farms or syndicated press-release blasts
- No review incentives without clear and prominent disclosure, and no review quotas on staff (see the review-policy rules in `SKILL.md` Step 10)

If a tactic only works because a reader would not know who paid for it, it is out. This is a gate on every recommendation this file produces, not a style preference.

## Co-citation defined

Co-citation = two entities mentioned together by a third-party source, whether or not either is hyperlinked. When third parties group two entities thematically often enough, search and AI systems start treating them as related, and authority transfers along the association.

**Worked example — Got Moles + WSU Extension.** WSU Extension publishes the Pacific Northwest's authoritative mole and vertebrate-pest guidance. Every Got Moles post that cites and links WSU Extension, every WSU Master Gardener session where Spencer speaks, every regional article that quotes both, and every `knowsAbout` field binding Got Moles to the same subject matter is a co-citation event. Cumulatively engines learn: if the query is about lawn moles in Western Washington, WSU Extension is the institutional source and Got Moles is the operator — related, not interchangeable.

The same pattern runs with WDFW on the legal and chemical-free angle, the county Chambers on the local-business angle, and PNW landscaping channels on the practitioner angle.

## How to engineer co-citation honestly

### Find real connection points

Co-citation only works on connections that exist or can genuinely be built. Aspiration does not count and fabrication is prohibited. Look for:

- **Existing institutional relationships** — Chamber membership, trade-association membership, Master Gardener program contact
- **Shared platforms** — a landscaping podcast both Spencer and a regional expert appear on, a county fair or home show, a trade event
- **Source adoption** — Got Moles citing WSU Extension and WDFW guidance in content, consistently and accurately, is itself a slow co-citation build
- **Real endorsement** — a landscaper who subcontracts mole work naming Got Moles

### Surfaces where co-citation accumulates

| Surface | How co-citation appears |
|---|---|
| Regional press | Both named in the same article; a quoted expert alongside an institutional source |
| Third-party roundups | "Best mole removal in {city}" listing Got Moles beside the named alternatives |
| Extension and association publications | Guest article or contributed field observation |
| YouTube | Guest appearance on a PNW lawn-care channel; both channels named in description and transcript |
| Podcasts | Both names in show notes, transcript and episode description |
| Chamber and community newsletters | Member spotlight beside other local businesses |
| Schema (`knowsAbout`, `sameAs`, `worksFor`, `areaServed`) | Machine-readable association on the site itself |
| Wikidata properties | Entity-to-entity links, once entities exist |

### Action template per co-citation target

For each named target in `authority-strategy.md` Section 5:
- **Entity** — name, URL, and Wikidata Q-id if one exists
- **Cluster** — which of the seven `target-keywords.md` clusters it serves
- **Relationship** — the real connection point, in one sentence
- **Surface plan** — the specific surfaces where the association gets seeded
- **First action** — the next concrete step
- **Cadence** — how often the association needs a fresh event to stay live

## Brand-mention strategy

Four components. All four appear in `authority-strategy.md` Section 8.

### 8.1 Proactive mention earning

- **Expert-source platforms** — Featured, Qwoted and equivalents, with Spencer's profile complete for "mole control expert", "PNW pest", "lawn damage", "veteran-owned business". Respond fast, answer quotably, link credentials.
- **Journalist outreach** — a specific angle per outlet, not pitch-and-pray. Regional desks (Seattle Times, Tacoma News Tribune, The Olympian, Enumclaw Courier-Herald) plus the trade press (Pest Control Technology, Pest Management Professional, Lawn & Landscape).
- **Roundup inclusion** — the highest-value class. Identify who publishes "best mole removal in {city}" for the priority cities, learn whether inclusion is editorial or submission-based, and pursue the honest path.
- **Speaking and community presence** — Master Gardener sessions, home and garden shows, Chamber events, veteran-business networks.
- **Referral exchange** — landscapers, lawn-care firms and pest companies that don't handle moles.

### 8.2 Reactive mention monitoring

Scheduled and logged, not remembered. Run from `clients/got-moles/`:

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs content_analysis/search/live \
  '{"keyword":"Got Moles","search_mode":"as_is","limit":50,"page_type":["news","blogs","message-boards","organization"]}' \
  --out projects/str-authority-strategy/data/mentions-{YYYY-MM-DD}.json
```

Repeat for "Spencer Hill mole" and "got-moles.com". Always set `limit`. Every call logs cost to `.dataforseo-usage.log`; reconcile after each run.

Backstops: Google Alerts (free), and a community watch on r/Seattle, r/Tacoma, r/lawncare, r/PNWGardening and Nextdoor. Convert unlinked mentions to linked where the ask is easy and welcome — but the unlinked mention already counts.

### 8.3 Mention-quality and sentiment scoring

**[S] Sentiment flips roughly 6.7x more often than mention presence.** A brand can hold its mention count while the framing turns against it, so counting mentions alone misses the failure mode. Score every run on both axes.

Context classes:
- **Authoritative cite** — "according to Got Moles" / quoted as the expert
- **Listed cite** — included in a roundup or best-of list
- **Neutral mention** — name reference, no framing
- **Dismissive cite** — hedged or qualified
- **Negative mention** — needs a response, not a link

Then the AI layer, across ChatGPT, Google AI Overviews, Gemini, Claude and Perplexity:

```bash
node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/llm_mentions/live \
  '{"keyword":"Got Moles","limit":50}' --dry
```

Confirm the sub-path against `https://docs.dataforseo.com/v3/ai_optimization/overview/` before the first paid call — the AI Optimization paths move between vendor releases. Priced at $0.10 per request plus $0.001 per row, so cap the prompt set per run.

Track as a trend: total mentions, the context-class distribution, the sentiment split, and the per-engine mention rate. Ten authoritative cites and five roundup inclusions beat a hundred neutral mentions.

### 8.4 Hallucination correction

Covered in `SKILL.md` Step 8.4. The surface order is GBP, then Yelp/BBB/Angi, then own-site answer blocks, schema, press corroboration, and Wikipedia-adjacent entity sources — then a re-test through `ai_optimization/llm_responses/live` on the same prompt set. **llms.txt is not a correction surface**: no engine documents consuming it and Google states it neither harms nor helps. Leave any existing file in place and keep it accurate.

## What NOT to do

- **Pure link-chasing.** Link volume is the weakest signal in the table.
- **Generic outreach lists.** An outlet with no per-outlet angle is an unused row.
- **Forced or fabricated co-citation.** If the connection isn't real, no engine accepts it and Google's guidance names the attempt.
- **Ignoring unlinked mentions.** They carry the correlating signal.
- **Counting mentions without sentiment.** The framing moves ~6.7x more than the count.
- **Presenting schema as a citation lever.** [S] Ahrefs' difference-in-differences test found no citation uplift for already-visible pages. Schema earns its keep for entity binding and correctness.

## Interaction with target-keywords clusters

Mention work runs **per cluster**, against the seven ids in `brand_context/target-keywords.md`:

| Cluster | Where mentions come from |
|---|---|
| `mole-control` | Regional press, "best mole removal in {city}" roundups, landscaper referral network |
| `biology` | WSU Extension, Master Gardener publications, iNaturalist, science and nature desks |
| `safety` | AVMA and ASPCA adjacent coverage, pet-owner and family publications, chemical-free angle |
| `cost-value` | Cost-guide publishers, Angi and HomeAdvisor editorial, consumer-finance desks |
| `seasonal` | Old Farmer's Almanac, garden columns, spring and fall regional pest stories |
| `diy-vs-pro` | Consumer Reports, This Old House, PNW lawn-care YouTube channels, myth-bust coverage |
| `location-services` | County Chambers, city papers, neighborhood associations, Nextdoor, local roundups |

Run a cluster-specific strategy, never a generic one.
