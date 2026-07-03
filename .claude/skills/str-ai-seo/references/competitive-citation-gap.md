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

1. **Same field/category?** A book about embodied cognition is not a competitor to a book about AI tooling for service businesses, even if both share a phrase. A SaaS company called "Delta" is not in the same field as an airline.
2. **Same ICP / audience intent?** Would the same person, in the same moment, plausibly be deciding between both? If not, the citation surface is not shared.
3. **Same query intent?** Run the query through ChatGPT and Perplexity. If neither surfaces both candidates together, no resolution conflict exists today — and listing them as competitors creates fictional gaps that drain audit recommendations.

If a candidate fails all three, **do not flag it as a competitive citation gap**. Note it as "phrase-overlap, not entity competition" and move on. Concept overlap or title-phrase overlap alone is not a threat — the only real competitors are entities AI systems would actually conflate when answering a real ICP query.

False-positive competitors dilute every recommendation downstream. Each entry on a competitor table implies a recommended counter-move; recommending counter-moves against non-competitors wastes effort and drives strategy off-piste.

---

## Why citation gap ≠ SERP rank gap

Traditional SEO auditing treats "who ranks higher" as the question. AI SEO asks a different question: "who gets cited as the authoritative source?"

These diverge. A page on position 5 can be cited by ChatGPT while the position 1 page gets ignored — because position 5 has:
- Clearer direct-answer structure
- Named expert attribution
- Sourced statistics
- Better schema coverage
- Fresher update date
- Stronger entity graph

**Your job in this analysis:** identify *which* signal explains each gap, not just *that* a gap exists.

---

## Per-query gap analysis methodology

### Step 1: Pick 10-20 target queries

By intent bucket:
- **Informational:** "what is X", "how does Y work"
- **Comparison:** "X vs Y", "best X for Y", "X alternatives"
- **Commercial:** "X pricing", "X for {audience}", "buy X"
- **Branded:** "{your brand}", "{competitor brand}"
- **Local** (if applicable): "X near me", "X in {city}"

### Step 2: Run each query through 3+ platforms

Minimum: Google AIO, ChatGPT, Perplexity. Add Claude, Copilot, Gemini based on audience priority.

### Step 3: Record citation state per query

```markdown
| Query | AIO | ChatGPT | Perplexity | Claude | Who cited | Why |
|-------|:--:|:--:|:--:|:--:|---|---|
| "X vs Y" | Yes | Yes | Yes | No | Competitor A | comparison table + schema |
| "best X for Y" | Yes | No | No | No | Competitor B | listicle format + citations |
```

The "Why" column is where the real work happens.

### Step 4: Analyze the "why" systematically

For each competitor citation, open their page and score:

| Signal | Present? |
|--------|:--:|
| Direct answer lead matching query | |
| Definitive structured format for this query type | |
| Sourced statistics | |
| Named expert attribution | |
| Comparison table / listicle / steps depending on query | |
| Schema type matching query intent | |
| Visible freshness (recent update date) | |
| Third-party citation inbound (Wikipedia, Reddit, industry pub) | |
| Strong entity graph | |
| Domain authority advantage | |

This tells you WHICH signal drives the citation for each specific query. Pattern-recognize across queries → which signals matter most for your audience's query mix.

---

## Citation quality scoring

Not all citations are equal. Track the quality too:

| Level | Description | Example |
|-------|-------------|---------|
| **Authoritative** | AI cites you as the source for a claim | "According to All The Power, {stat/claim}" |
| **Listed** | AI includes you in a list of sources without explicit authority framing | "Sources include ..." |
| **Mentioned** | AI mentions your brand in passing | "Companies like ..." |
| **Dismissive** | AI cites you with hedging or negative framing | "Some sources claim..." |
| **Not cited** | You're absent | — |

A small number of authoritative citations beats many listed-or-mentioned ones. If you're consistently "mentioned" but rarely "authoritative," your authority signals are thin.

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

**Pattern 5: Commercial queries cite review sites (G2, Capterra)**
→ Get listed on those review sites with complete profiles + aggregated reviews.

**Pattern 6: Local queries cite Google Business Profiles + Yelp**
→ Local SEO track (see `references/local-seo.md`).

---

## Gap-closing tactics by root cause

### Root cause: missing schema for query intent

| Query intent | Schema to add |
|-------------|---------------|
| "What is X" | Article + DefinedTerm |
| "How to X" | HowTo |
| "X vs Y" | Article + ItemList (or ComparisonChart-style) |
| "Best X" | ItemList |
| "X FAQ" | FAQPage |
| "X reviews" | Review + AggregateRating |
| "{Book title}" | Book + Person (author) |
| "{Podcast name}" | PodcastSeries + PodcastEpisode |
| "{Course name}" | Course |
| "X near me" | LocalBusiness + aggregateRating |

### Root cause: missing content format

- Add comparison tables on alternatives pages
- Add definition blocks on "what is" pages
- Add step-by-step numbered lists on "how to" pages
- Add FAQ blocks on topic hubs

### Root cause: missing authority signals

- Source every stat with outbound link to primary source
- Add named expert quotes with credentials
- Add author bio with credentials (byline block pattern)
- Add visible publication + updated dates

### Root cause: missing third-party presence

- Pitch Wikipedia editors on notable entity (requires ≥2 independent secondary sources)
- Seed authentic Reddit discussions in relevant subs
- Secure 3-5 guest posts on industry publications
- Get on category roundups ("10 best X for Y")
- Participate in Quora answers (long-form, cited)
- YouTube presence (Google AIO favors YouTube heavily)

### Root cause: weak entity graph

- See `references/entity-knowledge-graph.md` — full methodology

### Root cause: freshness decay

- Update cornerstone content every 90 days minimum
- Add visible "Last updated" dates
- Update `<lastmod>` in sitemap
- Ping IndexNow on every substantive update

### Root cause: domain authority gap

- Slow play. Build authority through consistent publishing + earned backlinks. No shortcut.
- Shorter-term lever: get on high-authority third parties (Wikipedia, Forbes, Guardian, HBR) so you get cited *through* them until your direct authority grows.

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

Re-run the gap analysis every 4-6 weeks during active optimization, quarterly during maintenance.

---

## Gap analysis report format

Include this in the audit:

```markdown
### Competitive Citation Gap

**Queries analyzed:** {N}
**Citation rate (user):** {%} (across all platforms × queries)
**Citation rate (top competitor):** {%}
**Delta:** {%}

**Citation quality breakdown (user):**
| Authoritative | Listed | Mentioned | Dismissive | Not cited |

**Dominant gap pattern:**
{1-sentence root-cause statement}

**Top 5 gap closures ranked by impact-per-effort:**
1. {tactic} — {expected lift} — {effort category}
2. ...

**Re-audit target date:** {date for next run}
```
