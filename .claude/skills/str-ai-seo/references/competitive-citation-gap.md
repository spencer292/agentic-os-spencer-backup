# Competitive Citation Gap Analysis

Where competitors get cited and you don't. Most audits stop at "competitor outranks you" — this analysis goes deeper: *why* are they cited, *what specifically* would close the gap, and is it worth closing?

---

## Contents

- Why citation gap ≠ SERP rank gap
- Per-query gap analysis methodology
- Citation quality scoring (authoritative vs dismissive)
- Pattern recognition across gaps
- Gap-closing tactics by root cause
- Tracking over time

---

## The field/ICP/intent filter — run this BEFORE flagging anyone

Before treating any candidate as a competitive citation gap, sanity-check three axes:

1. **Same field/category?** A book about embodied cognition is not a competitor to a book about workplace productivity, even if both share a phrase. A software company called "Delta" is not in the same field as an airline.
2. **Same ICP / audience intent?** Would the same person, in the same moment, plausibly be deciding between both? If not, the citation surface is not shared.
3. **Same query intent?** Run the query through ChatGPT and Perplexity. If neither surfaces both candidates together, no resolution conflict exists today — and listing them as competitors creates fictional gaps that drain audit recommendations.

If a candidate fails all three, **do not flag it as a competitive citation gap**. Note it as "phrase-overlap, not entity competition" and move on. Concept overlap or title-phrase overlap alone is not a threat — the only real competitors are entities AI systems would actually conflate when answering a real ICP query.

False-positive competitors dilute every recommendation downstream. Each entry on a competitor table implies a recommended counter-move; recommending counter-moves against non-competitors wastes effort and drives strategy off-piste.

---

## Why citation gap ≠ SERP rank gap

Traditional SEO auditing treats "who ranks higher" as the question. AI SEO asks a different one: "who gets cited as the authoritative source?"

These diverge, but **how much they diverge depends on the surface**, and this is the distinction that most gap analyses miss:

- **AI Overviews stay tightly coupled to organic rank.** `[S]` seoClarity, 432,000 keywords: 97% of AI Overviews cite at least one source from the organic top 20. If you are nowhere near the top 20, the citation gap on this surface is mostly a ranking gap.
- **AI Mode is loosely coupled**, running query fan-out across sub-queries. Coverage of the sub-question set predicts citation here, not head-term rank. **This is where a page can be cited from well outside the top positions.**

`[S]` Whitespark: a top-10 organic ranking gives only about a 25% chance of AI Overview appearance. Rank is necessary-ish and nowhere near sufficient.

**Do not cite the circulating "top-10-to-AI-citation overlap fell from 76% to 38%" figure.** It is single-source and conflicts with the larger-sample finding above for AI Overviews specifically.

When a page outside the top positions does get cited, the usual reasons are:
- Clearer answer-first structure — a passage that survives being lifted out
- Coverage of a fan-out sub-question the higher-ranking page skips
- A specific, attributable, quotable claim where the competitor has adjectives
- Genuinely fresher content, not a timestamp bump
- Cleaner entity resolution

**Not on that list: schema.** `[S]` Adding schema to already-visible pages produced −4.6% / +2.4% / +2.2% across AI Overviews, AI Mode and ChatGPT. Check it for correctness and entity binding; do not offer it as an explanation for a citation gap.

**Your job in this analysis:** identify *which* signal explains each gap, on *which* surface, not just *that* a gap exists.

---

## Per-query gap analysis methodology

### Step 1: Pick 10-20 target queries

By intent bucket:
- **Informational:** "what is X", "how does Y work"
- **Comparison:** "X vs Y", "best X for Y", "X alternatives"
- **Commercial:** "X pricing", "X for {audience}", "buy X"
- **Branded:** "{your brand}", "{competitor brand}"
- **Local** (if applicable): "X near me", "X in {city}"

**Tag every query with the surface it competes on before running it.** `[S]` Transactional local fires the Local Pack around 93% of the time; informational and hybrid fire AI Overviews at 92–97%. A transactional query returning no AI Overview is expected behavior, not a gap.

### Step 2: Run each query, programmatically where possible

**Primary source: DataForSEO.** `ai_optimization/llm_mentions` returns mentions with sentiment across ChatGPT, Google AI Overviews, Gemini, Claude and Perplexity in one call. `serp/google/organic/live/advanced` returns the `ai_overview` element with its cited sources. This is repeatable and comparable over time in a way manual testing is not.

**Manual runs are a spot-check on top.** Results are personalized and multi-turn, so a single manual observation is an anecdote. Where you do run manually, cover AI Overviews, AI Mode, ChatGPT and Perplexity as a minimum, adding Gemini and Copilot by audience priority — and remember Gemini's off-site sources differ sharply from the others'.

### Step 3: Record citation state per query

```markdown
| Query | Surface | AIO | AI Mode | ChatGPT | Perplexity | Who cited | Why |
|---|---|:--:|:--:|:--:|:--:|---|---|
| "X vs Y" | informational | Yes | Yes | Yes | No | Competitor A | comparison table, answer-first |
| "best X for Y" | informational | Yes | No | No | No | Third-party listicle | not a competitor page at all |
```

**The "Who cited" column matters as much as the gap.** When the cited source is a third-party listicle or directory rather than a competitor's own site, the gap-closing move is inclusion in that source, not a better page of your own.

### Step 4: Analyze the "why" systematically

**Fetch and inspect each cited competitor page before concluding anything.** Do not infer from the SERP. On a real audit, the assumption that the client was behind on a given signal turned out to be wrong: most of the named competitors had not done the work either, which made "open ground, and the window is closing" both more accurate and a stronger argument than "you are behind."

| Signal | Present? |
|---|:--:|
| Crawlers can actually reach the page | |
| Answer-first block under each heading, self-contained | |
| One fact per sentence in the answer blocks | |
| Fan-out sub-questions covered | |
| Specific, attributable, checkable claims | |
| Format matches the query type — table, ranked list, steps | |
| Named author with real credentials | |
| Visible freshness reflecting real content change | |
| Off-site presence: directories, listicles, unstructured citations | |
| Clean entity resolution for the brand | |
| Organic rank position — relevant for AI Overviews specifically | |

**Schema is checked for correctness, not scored as a citation driver.**

This tells you which signal drives citation for each query. Pattern-recognize across the set to find what matters most for this query mix.

---

## Citation quality scoring

Not all citations are equal. Track the quality too:

| Level | Description | Example |
|---|---|---|
| **Authoritative** | Cited as the source for a claim, and named | "According to {Brand}, {claim}" |
| **Listed** | Included among sources with no authority framing | "Sources include ..." |
| **Mentioned** | Named in passing | "Companies like ..." |
| **Ghost** | The page is in the sources but the brand is never named in the answer | A link with no attribution in the text |
| **Dismissive** | Cited with hedging or negative framing | "Some sources claim ..." |
| **Not cited** | Absent | — |

A small number of authoritative citations beats many listed or mentioned ones. Consistently "mentioned" but rarely "authoritative" means the authority signals are thin.

**Ghost citations are the largest category and the easiest to miss.** `[S]` 62% of AI citations are ghost citations where the brand goes unnamed (Semrush, 126M US prompts). A mention tracker and a citation tracker measure different things, and a report using one to answer the other will be wrong by a wide margin. Say which one you measured.

**Track sentiment as its own dimension.** `[S]` Framing flips roughly 6.7x more often than mention presence does. A brand can be resolved correctly, cited consistently, and framed badly — and a presence-only tracker will show that as a win. DataForSEO `llm_mentions` returns sentiment; use it.

---

## Pattern recognition across gaps

After analyzing 20 queries, common patterns emerge:

**Pattern 1: Comparison queries dominated by sites with comparison tables + schema**
→ Build comparison tables + ItemList/ComparisonChart-style schema on your alternative pages.

**Pattern 2: "Best of" queries dominated by listicle sites with affiliate structure**
→ Build your own authoritative listicle with real criteria + schema.

**Pattern 3: Branded queries don't cite you, cite category aggregator instead**
→ Entity graph gap. Build Knowledge Panel, strengthen sameAs, improve Organization schema.

**Pattern 4: Informational queries cite Wikipedia / Reddit, not competitors**
→ Opportunity: create the definitive resource that AI prefers to Wikipedia for this niche. Needs original data, structured format, cited statistics.

**Pattern 5: Commercial queries cite review platforms**
→ Complete, accurate profiles on the platforms the engines actually read for this category.

**Pattern 6: Local queries cite business profiles and directories**
→ Local track (see `local-seo.md`), and note the directory priority is engine-specific rather than universal.

**Pattern 7: Nothing you write ranks, but the engine cites third-party listicles**
→ The gap is not a content gap. Get included in the listicles. `[S]` Ranked best-of listicles are the single most-cited format at ~21% of all citations, and inclusion outranks most link building.

**Pattern 8: The engine returns the wrong entity entirely**
→ Not a citation gap. A disambiguation problem. See `brand-disambiguation.md`, and check whether the brand or service term is a common-noun homograph.

---

## Gap-closing tactics by root cause

### Root cause: the crawler cannot reach the page

Check first, always. `[S]` 73% of sites have a crawlability issue preventing AI access. Robots.txt, CDN and WAF rules, JavaScript-render dependence. Free to fix, and nothing else works until it is.

### Root cause: missing content shape

- Answer-first block of roughly 40–80 words under every heading, self-contained
- One fact per sentence in those blocks
- Comparison tables instead of prose on comparison pages
- Numbered steps on process pages
- Question-format H2s in the body rather than a footer FAQ block

### Root cause: missing fan-out coverage

The page ranks for the head term and skips the sub-questions. Enumerate the fan-out set — harvest it from People Also Ask, Bing grounding queries and AI keyword data rather than inventing it — and cover every sub-question in the cluster, each reachable in one hop.

**Not a word-count problem.** `[S]` Correlation between word count and AI Overview citation is 0.04.

### Root cause: nothing quotable on the page

Every substantial page carries at least one specific, attributable, checkable claim. Generic advice is not citable at any length. First-hand operational detail is the version competitors cannot copy.

### Root cause: missing third-party presence

- **Get into the ranked listicles that already appear in your queries' answers.** Highest-leverage item here
- Earn genuine editorial mentions in publications the engines already cite
- Complete and correct every profile that already exists; inconsistency is how an engine fails to resolve the business at all
- **Build YouTube presence.** `[S]` YouTube mentions are the strongest measured correlate across ChatGPT, AI Mode and AI Overviews, and YouTube is the leading non-corporate citation source
- Where a Wikipedia entry is genuinely achievable on notability grounds it is the strongest anchor; for most brands it is not, and chasing it displaces achievable work
- **Never manufacture mentions.** `[P]` Google names inauthentic mention-seeking as unnecessary and states its spam systems already filter what AI features depend on

### Root cause: weak entity graph

See `entity-knowledge-graph.md`. The `sameAs` spine plus `knowsAbout` is the core of it.

### Root cause: freshness decay

- **A substantive update, not a timestamp bump.** At least one new fact, source or example per major section
- `dateModified` reflecting the real change, accurate `Last-Modified` header, sitemap `lastmod`
- Flag anything untouched for twelve months
- IndexNow on update — **for Bing only; Google does not participate**

`[S]` AI-cited content is 25.7% fresher on average, and 65% of AI bot hits target past-year content.

### Root cause: rank gap on AI Overviews specifically

AI Overviews stay rank-coupled, so on that surface this is a classic ranking problem and should be treated as one. It does not transfer to AI Mode, where coverage matters more than position.

### Root cause: authority gap

`[S]` Off-site brand signals beat backlinks by two to three times as correlates — branded web mentions 0.664 against backlinks around 0.218–0.27. **Lead with mentions, treat links as a byproduct.** Domain Rating sits below branded anchors on every surface, so a program whose main lever is Domain Rating is optimizing the weakest available signal.

### Not a root cause: missing schema

`[S]` The measured effect on already-visible pages is approximately zero. Audit schema for correctness, visible-content match and entity binding. **Never offer it as the explanation for a citation gap**, and never present it as a citation lever in client-facing output.

---

## Tracking over time

Citation gaps change as AI systems update their indices and as your content matures. Track month-over-month:

```markdown
| Query | Month 1 | Month 2 | Month 3 | Delta |
|-------|:--:|:--:|:--:|:--:|
| "X vs Y" | 0/5 platforms | 2/5 | 3/5 | +3 |
| "best X" | 0/5 | 1/5 | 2/5 | +2 |
| "{brand}" | 3/5 | 4/5 | 5/5 | +2 |
```

Re-run monthly during active optimization, quarterly during maintenance. **Re-baseline after any named Google core or spam update** before drawing conclusions from a movement — 2026 ran two core and three spam updates, and volatility outside named updates is now the majority of movement.

**Run it programmatically so the comparison is real.** A month-over-month delta built from two sets of manual observations is comparing two anecdotes. `ai_optimization/llm_mentions` on a fixed prompt set gives a comparable series.

---

## Gap analysis report format

```markdown
### Competitive Citation Gap

**Queries analyzed:** {N}, tagged by surface
**Data source:** {DataForSEO llm_mentions / SERP ai_overview / manual spot-check}
**Date range:** {} — results are personalized and point-in-time

**Presence by surface**
| Surface | Queries | Present | Top competitor present | Delta |
|---|--:|--:|--:|--:|
| AI Overviews | | | | |
| AI Mode | | | | |
| ChatGPT | | | | |
| Perplexity | | | | |
| Gemini | | | | |

**Citation quality:** authoritative / listed / mentioned / ghost / dismissive / not cited
**Sentiment:** {positive / neutral / negative, per engine}

**Most-cited third-party sources across the query set:** {this is the mention target list}

**Dominant gap pattern:** {one-sentence root-cause statement, naming the surface}

**Competitors tested directly:** {list — never assert a gap against an untested competitor}

**Gap closures, ranked by impact, risk and dependency order**
1. {tactic} — {surface} — {evidence tier} — {reversible / structural / blocked by X}

**Baseline note:** {honest expectation for a brand of this stature — niche brands appear in ~11% of relevant AI answers}
```

**Report rules:** no time or effort estimates — rank by impact, risk, dependency order and reversibility. Label every statistic `[P]`, `[S]` or `[U]`. Never state an "expected lift" percentage for a tactic; no study supports per-tactic lift figures for AI citation, and the ones that circulated did not survive checking.
