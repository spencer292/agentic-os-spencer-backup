# AEO and GEO Content Patterns

Reusable content block patterns for answer engines and AI citation.

---

## The three rules that govern every pattern below

Everything in this file is an application of three rules. If you remember nothing else, remember these.

### 1. Answer-first, 40–80 words, self-contained

Every H2 is a question or a direct topic, followed immediately by a self-contained answer of roughly 40–80 words. Supporting detail comes after.

**The test: does this paragraph still read correctly when lifted out of the page with zero surrounding context?** If it depends on the sentence before it, on the heading to make sense, or on a pronoun whose referent is elsewhere, it fails. Retrieval lifts passages, not pages, and a passage that needs its neighbors will not be quoted.

### 2. One fact per sentence

In every answer block, one sentence carries one fact. No hedging, no compound clauses stacking two claims behind a conjunction.

This is a retrieval requirement, not a style preference. A hedged compound sentence containing an excellent statistic is still unquotable, because there is no clean span to extract.

### 3. Fan-out coverage, never word count

`[S]` The correlation between word count and AI Overview citation is **0.04** (Ahrefs, 174,048 pages). **Never set a word-count minimum.**

The replacement target is coverage: does the page answer the sub-questions that a query fan-out would generate for its topic? An AI system decomposes one prompt into multiple related sub-queries and retrieves against each `[P]`. Enumerate that set before writing, and score the draft against it.

---

## What is explicitly not required

`[P]` Google's generative-AI guidance names these as unnecessary. Do not build them, do not score them.

- **Chunking content into tiny pieces.** Quoted: "There's no requirement to break your content into tiny pieces." Answer-first structure helps retrieval as a preference, not a rule. Rule 1 above is that preference — it is not a mandate to fragment a page.
- **AI-specific rewriting**, or a separate "AI version" of a page.
- **Machine-readable mirrors** — llms.txt, Markdown copies, AI text files.
- **Special schema.** "Structured data isn't required for generative AI search."
- **Keyword-variation overfocus and "AEO/GEO hacks"** generally.

**FAQPage schema is not a deliverable.** FAQ rich results were deprecated 2026-05-07 and fully removed through August 2026. **The Q&A content shape survives on its own merits and should be kept.** The schema earns nothing. Never add it to win a rich result, never score it, and never recommend stripping existing markup — that is churn with no upside.

**On the numbers circulating about chunk sizes:** the "median quoted chunk is ~25 tokens", "97% of citations are under 200 tokens" and "passages over 80 words get cut mid-thought" figures are all `[U]`. The 40–80 word range in Rule 1 is a working shape supported by the retrieval mechanism, not a measured threshold. Encode the pattern, never the numbers.

---

## Contents
- Answer-first patterns (Definition, Step-by-Step, Comparison Table, Pros and Cons, Q&A, Listicle)
- Citation patterns (Statistic Block, Expert Quote, Authoritative Claim, Self-Contained Answer, Evidence Sandwich)
- Domain-specific tactics
- Conversational and voice query patterns

## Answer-first patterns

These help content get extracted into AI Overviews, AI Mode answers, featured snippets and voice results.

### Definition Block

Use for "What is [X]?" queries.

```markdown
## What is [Term]?

[Term] is [concise 1-sentence definition]. [Expanded 1-2 sentence explanation with key characteristics]. [Brief context on why it matters or how it's used].
```

**Example** — note that every sentence carries exactly one fact, and the block stands alone:
```markdown
## What is a query fan-out?

A query fan-out is when a search system breaks one user question into several related sub-questions and searches for each one separately. It then combines what it finds into a single answer. Google uses this in AI Mode, issuing multiple related searches across subtopics and data sources. The practical effect is that covering a topic completely matters more than ranking a single page for one phrase.
```

A page-level definition block works the same way. **Where the term being defined is a common word with a more common unrelated meaning, the disambiguating word must appear in the same sentence** — see `brand-disambiguation.md` collision type 6.

### Step-by-Step Block

Use for "How to [X]" queries. Optimal for list snippets.

```markdown
## How to [Action/Goal]

[1-sentence overview of the process]

1. **[Step Name]**: [Clear action description in 1-2 sentences]
2. **[Step Name]**: [Clear action description in 1-2 sentences]
3. **[Step Name]**: [Clear action description in 1-2 sentences]
4. **[Step Name]**: [Clear action description in 1-2 sentences]
5. **[Step Name]**: [Clear action description in 1-2 sentences]

[Optional: brief note on the expected outcome]
```

**Do not put a time estimate in the closing note.** No "takes about twenty minutes", no "results in 2–4 weeks". Describe the outcome and what it depends on instead.

**Example:**
```markdown
## How to check whether AI crawlers can reach your site

Three things block AI crawlers, and only one of them is robots.txt.

1. **Check robots.txt**: confirm OAI-SearchBot, PerplexityBot, Claude-SearchBot, Bingbot and Googlebot are all allowed.
2. **Check the CDN and WAF**: bot-management rules block crawlers invisibly, without appearing in robots.txt at all.
3. **Fetch a page as each crawler**: compare the returned HTML against the browser view.
4. **Compare content volume**: a page returning far less content to a crawler depends on JavaScript the crawler does not run.
5. **Verify by IP, not user agent**: each vendor publishes a crawler IP list.

A page no crawler can fetch cannot be cited, whatever else is done to it.
```

### Comparison Table Block

Use for "[X] vs [Y]" queries. Optimal for table snippets.

```markdown
## [Option A] vs [Option B]: [Brief Descriptor]

| Feature | [Option A] | [Option B] |
|---------|------------|------------|
| [Criteria 1] | [Value/Description] | [Value/Description] |
| [Criteria 2] | [Value/Description] | [Value/Description] |
| [Criteria 3] | [Value/Description] | [Value/Description] |
| [Criteria 4] | [Value/Description] | [Value/Description] |
| Best For | [Use case] | [Use case] |

**Bottom line**: [1-2 sentence recommendation based on different needs]
```

### Pros and Cons Block

Use for evaluation queries: "Is [X] worth it?", "Should I [X]?"

```markdown
## Advantages and Disadvantages of [Topic]

[1-sentence overview of the evaluation context]

### Pros

- **[Benefit category]**: [Specific explanation]
- **[Benefit category]**: [Specific explanation]
- **[Benefit category]**: [Specific explanation]

### Cons

- **[Drawback category]**: [Specific explanation]
- **[Drawback category]**: [Specific explanation]
- **[Drawback category]**: [Specific explanation]

**Verdict**: [1-2 sentence balanced conclusion with recommendation]
```

### Q&A Block

Use where a topic genuinely raises several distinct questions. **Keep the shape; drop the schema deliverable.**

```markdown
## [Question phrased the way people actually ask it]?

[Self-contained 40-80 word answer. One fact per sentence. Reads correctly with no surrounding context.]

[Optional supporting detail, examples, or a table.]

## [Next question]?

[Self-contained 40-80 word answer.]
```

**Prefer question-format H2s in the body over a walled-off "Frequently Asked Questions" section at the foot of the page.** A body H2 with a real answer under it is a retrievable chunk on the topic. A stack of one-line answers in a footer block is thin content wearing a Q&A costume, and it competes with nothing.

**Where the questions come from.** Harvest them rather than inventing them: People Also Ask, Bing Webmaster grounding queries (real AI retrieval phrasing, which nothing else gives you), DataForSEO AI Keyword Data for conversational phrasing, and the fan-out sub-query set for the page's primary query. **These are the same thing as fan-out coverage** — a harvested question set is a fan-out set.

**Filter the harvest.** For a term with a common unrelated meaning, People Also Ask will return the wrong sense in volume. Strip those before they reach a content plan.

**Tips:**
- Natural phrasing: "how do I", not "how does one"
- Lead with the question word: what, how, why, when, where, who, which
- The answer's first sentence answers the question completely. Everything after it is elaboration
- No word-count target on the answer. It is as long as one complete answer needs to be, which is usually 40–80 words

**Do not add FAQPage schema to win a rich result** — those results no longer exist. Existing markup stays.

### Listicle Block

Use for "Best [X]", "Top [X]", "[Number] ways to [X]" queries.

**This is the highest-value format in the file.** `[S]` Ranked "best-of" listicles are the single most-cited format at ~21% of all citations (arXiv 2606.20065, 100,000+ prompt responses). Two consequences: publish your own where you can be genuinely authoritative, and — usually higher-leverage — **get included in other people's**. Inclusion in the roundups that already rank for a category outranks most link building.

```markdown
## [Number] Best [Items] for [Goal/Purpose]

[1-2 sentence intro establishing context and selection criteria]

### 1. [Item Name]

[Why it's included in 2-3 sentences with specific benefits]

### 2. [Item Name]

[Why it's included in 2-3 sentences with specific benefits]

### 3. [Item Name]

[Why it's included in 2-3 sentences with specific benefits]
```

---

## Citation patterns

These make a passage quotable once it has been retrieved. Retrieval gets you considered; a clean, attributable claim gets you named.

**The requirement behind all of them: every substantial page carries at least one specific, attributable, checkable claim** — a number, a named method, a concrete operational or local specific. Generic advice does not get quoted. "We're the best" gives an engine nothing to lift.

### Statistic Citation Block

```markdown
[Claim statement]. According to [Source/Organization], [specific statistic with number and timeframe]. [Context for why this matters].
```

**Rules, and these are not optional:**
- Name the source and the date. An unsourced number is worse than no number, because it survives into client deliverables and cannot be defended when questioned.
- Prefer your own first-hand data over someone else's aggregate. It is the one thing no competitor can copy.
- One statistic per sentence.
- **Carry the confidence tier** — `[P]` primary documentation, `[S]` named study with a stated sample, `[U]` unverified — into anything client-facing.

**Example:**
```markdown
Word count is not what gets a page cited. Ahrefs analyzed 174,048 pages in 2026 and found the correlation between word count and AI Overview citation was 0.04. Coverage of the sub-questions a query generates predicts citation far better than length does.
```

Note what makes that example work: a named source, a stated sample size, a specific figure, and one fact per sentence.

### Expert Quote Block

```markdown
"[Direct quote from a named expert]," says [Expert Name], [Title/Role] at [Organization]. [One sentence of context or interpretation].
```

**Use a real quote from a real, named person with a checkable role.** Never fabricate one, never paraphrase into quotation marks, and never attribute a plausible-sounding line to a real public figure who did not say it. That is a fabricated record, and the correctness problem matters more than the citation upside.

**The best source of quotes is usually inside the business.** A named practitioner describing what they actually see in the field is first-hand experience, which is the E-E-A-T criterion that content most often lacks, and it is unfakeable by competitors.

### Authoritative Claim Block

Structure claims for easy AI extraction with clear attribution.

```markdown
[Topic] [verb: is/has/requires/involves] [clear, specific claim]. [Source] [confirms/reports/found] that [supporting evidence]. This [explains/means/suggests] [implication or action].
```

**Example:**
```markdown
Structured data is not an AI citation lever. Google's own documentation states that "structured data isn't required for generative AI search, and there's no special schema.org markup you need to add." A controlled Ahrefs test of 1,885 pages against 4,000 matched controls found citation changes of -4.6% on AI Overviews, +2.4% on AI Mode and +2.2% on ChatGPT after adding JSON-LD. Schema still earns its place for rich results, correctness and entity binding.
```

### Self-Contained Answer Block

Create quotable, standalone statements that AI can extract directly.

```markdown
**[Topic/Question]**: [Complete, self-contained answer that makes sense without additional context. Include specific details, numbers, or examples in 2-3 sentences.]
```

**Example:**
```markdown
**Does blocking Google-Extended remove a site from AI Overviews?**: No. Google-Extended is a training opt-out only. It controls whether crawled content may be used to train future Gemini models, and Google states it does not affect Search ranking or AI Overview eligibility. The only control that removes a site from AI Overviews and AI Mode is the Search Console generative-AI opt-out, which applies to all of them at once.
```

That block answers a specific question completely, in four single-fact sentences, with no dependency on anything around it. Dropped into an AI answer verbatim, it would still be correct and still make sense.

### Evidence Sandwich Block

Structure claims with evidence for maximum credibility.

```markdown
[Opening claim statement].

Evidence supporting this includes:
- [Data point 1 with source]
- [Data point 2 with source]
- [Data point 3 with source]

[Concluding statement connecting evidence to actionable insight].
```

---

## Multi-format pages

`[S/U]` Pages combining text, images and video are cited more often than text-only pages. The direction is supported; the exact multiple circulating in trade content is not.

The stronger reason to pair content with video is separate and better evidenced: `[S]` YouTube mentions are the single strongest measured correlate of AI visibility across ChatGPT, AI Mode and AI Overviews, and YouTube is the leading non-corporate citation source. Where a topic is visual — a process, a before-and-after, a physical problem being diagnosed — make the video and embed it on the matching page. It feeds the correlation, and it serves as proof for the large majority of people who verify an AI recommendation before acting.

Images need supporting text to be useful. `[P]` Google names "quality images and video with supporting text" as effective; an image with no textual context contributes nothing retrievable.

---

## Domain-specific tactics

Different content domains benefit from different authority signals.

### Local Service Content
- Name the actual geography, not a placeholder swapped into a template. **A generic answer with the city name substituted is not a local answer**, and engines cite chunks that name the place
- Reference conditions specific to that area
- Cite real jobs, named neighborhoods, and photography of actual work
- Name the practitioner. A named technician with real experience is the E-E-A-T signal competitors cannot copy
- Where the service term is a common word with another meaning, apply the co-occurrence rule in every heading and opening paragraph

### Technology Content
- Emphasize technical precision and correct terminology
- Include version numbers and dates for software/tools
- Reference official documentation
- Add code examples where relevant

### Health/Medical Content
- Cite peer-reviewed studies with publication details
- Include expert credentials (MD, RN, etc.)
- Note study limitations and context
- Add "last reviewed" dates

### Financial Content
- Reference regulatory bodies (SEC, FTC, etc.)
- Include specific numbers with timeframes
- Note that information is educational, not advice
- Cite recognized financial institutions

### Legal Content
- Cite specific laws, statutes, and regulations
- Reference jurisdiction clearly
- Include professional disclaimers
- Note when professional consultation is advised

### Business/Marketing Content
- Include case studies with measurable results
- Reference industry research and reports
- Add percentage changes and timeframes
- Quote recognized thought leaders

---

## Conversational and voice query patterns

Prompts to an AI assistant and spoken queries share a shape: conversational, question-formed, longer than typed search, and often carrying context a typed query would omit. The same patterns serve both.

### Question forms to cover
- "What is..." / "What causes..."
- "How do I..." / "How much does..."
- "Where can I find..." / "Who does... near me"
- "Why does..." / "Why is..."
- "When should I..." / "Is it too late to..."
- "Is X better than Y" / "Should I do X or Y"

### Structure
- Lead with the direct answer, then elaborate
- Natural language, no jargon unless the audience is expert
- Include the geographic or situational context where it is relevant to the answer
- Each answer works as a single complete response

### Get the real phrasing rather than guessing it

Two sources give actual retrieval language instead of modeled search volume:

- **Bing Webmaster Tools AI Performance → Grounding Queries.** The phrasing the AI itself used to retrieve the page. Free, UI-only, and nothing else provides it.
- **DataForSEO AI Keyword Data.** Conversational phrasing and volume that typed-search keyword tools do not carry.

Feed both into the question set for the page. Conversational phrasing differs from typed search often enough that writing from typed-search keywords alone leaves the actual prompts uncovered.

---

## Applying these patterns

**Order of operations for a page:**

1. Enumerate the fan-out sub-questions for the primary query. Harvest them; do not invent them.
2. Map each sub-question to an H2, phrased as people phrase it.
3. Write the 40–80 word self-contained answer under each, one fact per sentence.
4. Add supporting detail, tables, examples and the citable claim.
5. Check every answer block by lifting it out and reading it alone.
6. Check the headings and the opening paragraph against any disambiguation rule that applies.
7. Score coverage against the fan-out set. **Never score length.**

**What not to do at any point:** add FAQPage schema as a deliverable, write a separate AI-specific version, build an llms.txt, fragment the page into tiny chunks, or set a word-count floor.
