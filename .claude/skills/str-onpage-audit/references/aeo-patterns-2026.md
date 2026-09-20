# Answer-First and Fan-Out Content Patterns

Reference for str-onpage-audit **Pillar 2.3 (Content Shape — Answer-First and Fan-Out Coverage)**, the highest-weighted pillar at 25%.

**Landscape authority:** `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` at the install root. Where this file and that one disagree, that one wins. Confidence keys: **[P]** primary documentation, **[S]** named study with a sample, **[U]** unverified.

These are the patterns that make a passage liftable. They apply to classic organic snippets, Google AI Overviews, Google AI Mode, ChatGPT, Perplexity, Gemini and Copilot alike, because they all retrieve passages rather than pages.

**Refreshed 2026-09-02.** Three things changed. The Pixelmojo framing is gone as the source of authority. Speakable and FAQPage are no longer deliverables. Query fan-out and Google AI Mode are named explicitly, because they are the mechanism behind the chunked-self-contained-H2 advice this file already gave without saying why.

## The mechanism: query fan-out

**[P] Google describes two retrieval mechanisms.** Retrieval-augmented generation "relies on our core Search ranking systems to retrieve relevant, up-to-date web pages," plus query fan-out, "issuing multiple related searches across subtopics and data sources." Google's own worked example is a lawn-weeds query fanning into herbicides, chemical-free removal and prevention. That reads across directly to pest control.

**What it changes.** One user prompt becomes several synthetic sub-queries, each retrieved separately. A page that answers only the head term competes for one of them. A page that covers the fan-out set competes for all of them.

**The two surfaces behave differently:**

| Surface | Coupling | What to optimise |
|---|---|---|
| **Google AI Overviews** | **Organic-rank coupled.** [S] seoClarity, 432,000 keywords: 97% of AI Overviews cite at least one source from the organic top 20. [S] Whitespark: a top-10 rank still only gives ~25% chance of appearing | Rank, plus a liftable answer block |
| **Google AI Mode** | **Fan-out coupled.** Head-term rank matters much less | Coverage across the sub-query set |

**[S] Winning one surface predicts the others.** Ahrefs cross-platform overlap in AI brand visibility: AI Overviews to AI Mode 0.821, AI Overviews to ChatGPT 0.749, AI Mode to ChatGPT 0.769. Run one program, not five.

**[U] Do not quote** the circulating 8–16 sub-query fan-out count or the 161% fan-out citation lift. Both are single-source with no reachable methodology. The mechanism is documented; the numbers are not.

**Fan-out sub-queries for Got Moles** typically split along: identification, damage, chemical-free methods, pricing, prevention, seasonality, and safety for pets and children. The live set per primary keyword comes from `str-question-harvester`, not from this list.

## The content patterns

### 1. Answer-first BLUF paragraph

**What:** The first paragraph after the H1 directly answers the page's primary intent question, in 40-60 words, using the same terminology searchers use.

**Why:** Retrieval works on passages. A generic opener ("Welcome to our site...") gives the engine nothing to lift, so it either skips the page or fabricates an answer.

**The test:** does this paragraph survive being lifted out of the page and read correctly with zero surrounding context. If it needs the sentence before it, it fails.

**How:**
- Pull the page's primary intent question from target-keywords.md
- Write the answer in 40-60 words using the cluster's exact query terminology
- Lead with the direct answer, never a soft preamble
- **One fact per sentence.** No hedging, no compound clauses, no "it depends, but generally". Hedged compounds do not get quoted
- Carry a disambiguating token in the same sentence as "mole" (Gate 1 in the skill is blocking)

**[U] on the word range.** 40-60 words is a working shape drawn from trade guidance, not a measured threshold. **[S/U]** Otterly states "reference-grade, chunked content receives 3–5x more citations than dense paragraphing" without describing an experiment. Encode the pattern. Never quote the numbers to a client as a rule.

**Never a length target.** **[S]** Ahrefs, 174,048 pages: correlation between word count and AI Overview citation is **0.04**.

**Example (Got Moles homepage):**
- ❌ "Welcome to Got Moles. We've been helping homeowners since 2017..."
- ✅ "Got Moles is a veteran-owned mole control specialist serving Western Washington since 2017. Chemical-free methods. ~5,000 properties served across 92+ communities. 219+ five-star Google reviews."

### 2. Question-format H2s

**What:** H2 headings phrased as questions matching user query intent.

**Why:** Q&A structure decomposes cleanly into citable chunks, and a question H2 followed by its own answer is the smallest self-contained unit an engine can lift. **[U] BrightEdge** reports pages with FAQ or structured Q&A formatting cited ~1.9x more often; the primary report is unreachable, so treat the direction as sound and the figure as unusable.

**Note the tension, and resolve it correctly.** The Q&A *shape* still helps retrieval. **FAQPage *schema* earns nothing** since the rich result was removed. Keep the shape. Drop the markup as a deliverable.

**How:**
- For informational pages, convert declarative H2s to questions
- Match the actual query phrasing from target-keywords.md and the fan-out set
- Each H2 gets its own self-contained answer block of roughly 40-80 words before any elaboration, and each block passes the same lift-out test
- A direct-topic H2 is fine where a question reads awkwardly, as long as the answer block still stands alone
- Don't force question format on transactional pages

**Example:**
- ❌ "Mole Behavior in Spring"
- ✅ "How active are moles in spring?"

### 3. Stat blocks for citable numbers

**What:** Distinct visual / structural components for key statistics — not buried in prose.

**Why:** Structured assets get pulled verbatim. **[S]** Listicles are the single most-cited format at ~21% of all citations (arXiv 2606.20065, 100,000+ prompt responses, 100+ brands, March to May 2026). Ranked and enumerated structures travel further than prose.

**How:**
- Wrap key stats in a `<StatBlock>` component (or equivalent design-system pattern)
- Each stat block should have: number, label, optional source attribution
- Use canonical_facts from target-keywords.md frontmatter as the source of truth

**Example block content:**
- "5,000+ properties served"
- "219+ five-star reviews"
- "92+ communities across 6 counties"
- "Chemical-free since 2017"

### 4. Tables for comparisons + ordered lists for steps

**What:** HTML tables for any comparison content; ordered lists for any process/step content.

**Why:** Tables and ordered lists are the highest-fidelity extractable structures, and they survive being lifted whole.

**[S/U] Multi-format content** combining text, images and video is reported cited ~1.4x more than text-only (Semrush 2026, secondary reporting; **[U]** on the exact figure). Pair a visual asset with the table where the topic is visual.

**How:**
- Convert comparison prose to HTML tables (`<table>`, not styled divs)
- Convert process steps to `<ol>` with explicit step numbers
- Don't over-table — only when the content genuinely is comparison or steps

**Comparison example:** DIY methods comparison → table with columns "Method / Effort / Effectiveness / Cost / Got Moles verdict"

**Steps example:** "How mole removal works" → ordered list, 4-7 steps

### 5. Verified-fact callouts (hallucination correction)

**What:** Above-the-fold callouts of canonical facts that AI engines often hallucinate.

**Why:** When engines state wrong facts, the first-party site has to state the correct ones prominently and consistently, and third-party sources have to agree.

**The known Got Moles hallucinations were logged 2026-05-08** in the Pixelmojo Radar report and are tracked in `authority-strategy.md` Section 8.4: founding year given as 2018 rather than 2017, pricing described vaguely, client count stated as ~500 rather than nearly 5,000, and a four-county service area rather than six. **[U] as a current-state claim** — that report is stale and none of it has been re-tested. Re-run the check with `ai_optimization/llm_responses` before repeating any of it to a client, and never present a May finding as today's state.

**How:**
- Pull canonical_facts from target-keywords.md frontmatter (founding year, pricing, locations, client count)
- Place above the fold on relevant pages (homepage, about, services)
- Use a distinct visual treatment (callout box, stat block, fact list)
- Reinforce in the Organization schema `hasOfferCatalog` and `sameAs` spine, the visible Q&A content, and the hero subheading

**Not a correction surface: llms.txt.** **[P]** Google, 2026-06-15: "llms.txt files aren't required for Google Search visibility or rankings." OpenAI, Anthropic and Perplexity crawler documentation covers robots.txt only and never mentions it. Claims that Anthropic and Perplexity confirmed support trace to one uncited vendor page. **Do not build one, do not list it as a correction surface, and if one already exists on the site, leave it.**

**Connection to authority-strategy.md Section 8.4:** the hallucination-correction matrix tracks per-fact correction surfaces and re-test dates. This skill audits only whether the callouts are present on the relevant pages. The off-site half of the correction belongs to `str-authority-strategy`.

## Schema patterns (Pillar 2.6)

**Schema is not an AI-citation lever.** **[S]** Ahrefs difference-in-differences, 1,885 pages adding JSON-LD against 4,000 matched controls, published 2026-05-11: AI Overviews −4.6%, AI Mode +2.4%, ChatGPT +2.2%. **[P]** Google: "Structured data isn't required for generative AI search, and there's no special schema.org markup you need to add." What survives is rich results that still exist, entity binding, correctness, and non-Google systems that read it.

### Speakable — OPTIONAL, not scored

```json
{
  "@type": "WebPage",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["h1", "main h2"]
  }
}
```

**Downgraded to optional 2026-09-02.** It was previously described here as the top high-impact action, which came from a single vendor report and contradicted this skill's own 2026-05-31 rule. It is not scored in `audit-checklist.md`, it is never a fix in apply-fixes mode, and it never appears above "optional" in a recommendation. Existing implementations can stay.

### FAQPage — RETIRED as a deliverable

**[P]** FAQ rich results were deprecated 2026-05-07, the search appearance and Rich Results Test support were removed in June 2026, and Search Console API data was removed in August 2026. FAQPage remains a valid schema.org type and earns nothing.

**Keep the Q&A content shape** — that is pattern 2 above and it is scored in Pillar 2.3. **Do not add FAQPage as a deliverable, do not score it, and do not recommend removing existing markup.** Ripping it out is churn with no upside. If a page already emits it, the old aggregation rule still applies as a correctness note: one combined FAQPage per page, never one per block, because per-block emission silently drops most of the questions.

### BreadcrumbList sitewide

Every non-root page emits BreadcrumbList. Pattern: render via shared `breadcrumbSchema(items)` builder.

### Article + dateModified (not just datePublished)

```json
{
  "@type": "Article",
  "datePublished": "2026-04-15",
  "dateModified": "2026-05-08"
}
```

Plus server returns `Last-Modified` HTTP header — these are TWO separate signals; both matter.

### FAQPage aggregation rule

If a page has multiple FAQ blocks: emit ONE combined FAQPage at page level, NOT one per block. Per-block emission silently drops 80%+ of questions (per `feedback_one_faqpage_per_page.md`).

### Organization schema enrichment

```json
{
  "@type": "Organization",
  "knowsAbout": ["Mole control", "Talpidae", "Chemical-free pest control"],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "itemListElement": [
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Total Mole Control Program"}, "price": "100", "priceCurrency": "USD"}
    ]
  },
  "sameAs": ["https://maps.google.com/...", "https://yelp.com/...", ...]
}
```

`knowsAbout` binds the brand to the pest-control sense of "mole". `hasOfferCatalog` with explicit prices is the pricing hallucination-correction surface. **The `sameAs` spine — identical across Google Business Profile, Yelp, BBB, Angi, Facebook, LinkedIn and YouTube — is the single place schema still clearly earns its keep**, because it is the entity-disambiguation defense. Wikipedia is the strongest `sameAs` anchor of all and is not realistically achievable here, so the achievable stack above is the plan.

## Anchor disambiguation (Pillar 2.5)

Per target-keywords.md Brand-Disambiguation Rule 5:
- Every anchor pointing to a page targeting an ambiguous head term must carry a lawn / yard / exterminator / geo / brand signal
- **Forbidden:** anchor text = `mole removal` alone (collapses to dermatology in AI Overviews)
- **Forbidden:** anchors from queries-to-avoid clusters (medical / cosmetic / pop culture / etc.)

## Cluster-specific patterns

The seven cluster ids are the ones in the live `target-keywords.md`. There is no other taxonomy.

| Cluster | Highest-leverage pattern | Typical fan-out to cover |
|---|---|---|
| mole-control (head) | Stat blocks (client count, year-round program, response time) + verified-fact callouts | what the service includes, how long it takes, what happens if they come back |
| biology | Question-format H2s + species comparison table | identification, tunnels versus mounds, diet, breeding season, mole versus vole versus gopher |
| safety | Verified-fact callouts (chemical-free, safe around pets and children) + outbound to a Tier 1 authority | are the methods safe for dogs, for children, for the lawn |
| cost-value | Pricing table + cost-range stat blocks + accurate `dateModified` | typical cost, what drives price, one-time versus program, is it worth it |
| seasonal | Ordered list of monthly activity + question-format H2s + accurate `dateModified` | when moles are active, best month to treat, winter behavior |
| diy-vs-pro | Method comparison table + ordered "if DIY then X" decision logic | do home remedies work, traps versus repellents, when to call a professional |
| location-services | Per-city substance: local soil and species, real jobs, named neighborhoods, city-specific reviews, real photography | mole problems specific to that city, service coverage, local response |

**location-services carries an extra constraint.** The doorway gate is blocking on these pages: strip the city name and the remainder must not be indistinguishable from another city page. Named technicians may appear in page content, but **never ask a customer to name a technician in a review** — **[P]** that has been an explicit Google Business Profile policy violation since 2026-04-17, alongside staff review quotas and rewards tied to reviews.

## Re-test cycle

Per authority-strategy.md Section 8.4: after fixes land, wait for engines to recrawl, then re-run the hallucination matrix and the citation check to see whether pattern adoption translated into citation.

**Re-test with `ai_optimization/llm_responses` and `ai_optimization/llm_mentions`** through the shared DataForSEO client, not a stale report in a Downloads folder. Payloads and the spend guard are in SKILL.md § Data Sources.

**Set honest expectations.** **[S]** arXiv 2606.20065 brand-stature tiers: global household names appear in 73% of relevant answers, mid-market 44%, **niche brands 11%**. That 11% is the honest baseline for a local service business. **[S]** SOCi, ~350,000 locations: ChatGPT recommends 1.2% of locations, Perplexity 7.4%, Gemini 11%, against 35.9% in Google's local 3-pack. AI visibility is not achievable at local-pack rates and the deliverable must not imply it is.
