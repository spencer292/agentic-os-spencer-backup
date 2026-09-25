# Output Structure

Save to `projects/str-question-harvester/{YYYY-MM-DD}_{brand-slug}-audit.md`. Raw API responses stay in `projects/str-question-harvester/data/{YYYY-MM-DD}/`.

Omit the Disambiguation Rejects section entirely where the brand has no recorded head-term collision, and say so in the Summary. Omit Local Pack routing where the brand has no locations or service areas.

````markdown
# Question Harvest: {brand}
Date: {YYYY-MM-DD}
Seeds: {count} derived from target-keywords.md (last_updated {date}) | Questions harvested: {count} | Unique after dedup: {count} | Disambiguation rejects: {count or "n/a, no collision recorded"}
Providers: DataForSEO ({n} calls, ${actual} from the usage log) | Second SERP provider ({n} searches, {allowance remaining at pre-flight}) | Bing grounding queries: {n or "not supplied"}

## Summary

{Two or three sentences. What the harvest revealed, which pillar has the weakest fan-out coverage, anything surprising. Answer-first, one fact per sentence.}

## Fan-Out Sets per Primary Keyword

*The contract section. `str-keyword-strategy` fills its `fan_out_subqueries` column from here. `mkt-authority-content` uses each set as the H2 plan.*

### {primary keyword} -> {owning page URL} [cluster: {id}] [surface: {AI Overviews | Local Pack | Classic organic}]

Fan-out coverage: {covered}/{total}

1. {sub-query} | vol {n} | AI vol {n} | intent {label} | **{covered / not retrievable / partial / gap}**
2. ...

### {next primary keyword}

...

## Priority Gaps, Grouped by Owning Page

### {page URL}, {n} unanswered sub-queries, coverage {x}%

| Sub-query | Cluster | Vol | AI vol | Difficulty | Score | Placement |
|---|---|---|---|---|---|---|
| {question} | {cluster id} | {n} | {n} | {n} | {score} | Answer-first H2 on this page / new spoke post / location-page local block |

## Full Question Bank by Cluster

### {cluster id} ({n} questions, {n} gaps)

#### Answered

- {question}, covered on {page}, under H2 "{heading}", self-contained: yes or no

#### Gaps

- {question} (vol {n}, AI vol {n}, intent {label}, surface {surface}, score {score})

## Disambiguation Rejects

*Omit this section where no collision is recorded in target-keywords.md.*

| Dropped question | Resolved sense | Seed that surfaced it |
|---|---|---|
| {question} | {the wrong sense it resolved to} | {seed} |

{Seeds that keep producing rejects need their phrasing tightened in target-keywords.md. Name them.}

## Cross-Page Collisions (hand to str-onpage-audit)

{Sub-queries answered on more than one page. Cannibalisation candidates. This skill reports them. `str-onpage-audit` owns the cull.}

## Competitor Sources

{Domains appearing as People Also Ask sources and as AI Overview references, with how many seeds each appeared under. This is the citation competition.}

## Seed Expansion for Next Run

{Question-shaped rows from related keywords and keyword suggestions with volume attached, plus any second-provider related searches. Candidates for the next derivation.}

## ICP Phrasing Observed

{Real phrasings from forum discussions and from high-AI-volume conversational questions. Feeds the phrasing bank.}

## Bing Grounding Queries

{Observed retrieval phrasings, or "not supplied this run". Any grounding query with no matching site answer is a confirmed gap.}

## Recommended Actions

1. {Page with the weakest fan-out coverage}: add answer-first H2 blocks for its {n} uncovered sub-queries. Each H2 is the question or its direct topic, followed by a self-contained 40 to 80 word answer, one fact per sentence.
2. {Cluster with a structural gap}: commission {n} new spoke posts, each carrying its fan-out set as the H2 plan.
3. Hand the fan-out sets to `str-keyword-strategy` for its `fan_out_subqueries` column at the next refresh.
4. Hand cross-page collisions to `str-onpage-audit`.
5. {Any brand-specific recommendation.}

Ordering is by impact and dependency, never by effort. No FAQ schema is added as a result of this output.
````

## Confidence labels

Every statistic reaching a client-facing version carries its tier. `[P]` for primary or platform data, which is what API-returned classic volumes are. `[S]` for a named study with a stated sample. `[U]` for anything unverified or modelled, which includes AI search volume and every inferred fan-out set.

## Month-over-month section, scheduled runs only

Append after the Summary on a scheduled run:

```markdown
## Month-over-Month Changes

- New questions: {n}
- Questions that dropped out of People Also Ask: {n}
- AI search volume movement: {the questions that moved and by how much}
- Fan-out coverage that changed: {page, previous percentage, current percentage}
```

A scheduled run never ends on a question. Where a decision is needed, state the options and the recommendation, and record it as a decision waiting rather than asking one.
