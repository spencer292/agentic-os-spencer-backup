# AI SEO by Content Type

How to optimize different content types for AI citation. Dated claims defer to `search-landscape-2026-09.md`, which wins on any conflict.

**Read the three rules in `content-patterns.md` first.** Answer-first blocks of roughly 40–80 words, one fact per sentence, and fan-out coverage instead of word count. Everything below is those rules applied to a specific content type.

---

## Format priorities

`[S]` arXiv 2606.20065, 100,000+ prompt responses, 100+ brands, March–May 2026, across ChatGPT, Claude, Perplexity and Gemini.

**Ranked "best-of" listicles are the single most-cited format at ~21% of all citations.** Roughly 78% of citations go to corporate websites; among non-corporate sources YouTube leads, ahead of Reddit, editorial media and Wikipedia.

Two consequences, and the second is usually the bigger one:

1. **Publish listicles where you can be genuinely authoritative** — real criteria, real comparison, a defensible ranking.
2. **Get included in other people's.** Inclusion in the roundups that already appear in AI answers for your category outranks most link building. Find them by running your target queries through each engine and recording which sources get cited.

**The previous version of this file carried a table of citation shares by content type** — comparison articles 33%, definitive guides 15%, original research 12% and so on. Those figures had no traceable source and are removed. The listicle finding above replaces them because it has a stated sample and methodology.

**Word count is not a format decision.** `[S]` Correlation with AI Overview citation is 0.04. There is no length target anywhere in this file.

---

## What underperforms

- Content with no structure — no headings, no answer blocks, nothing self-contained to lift
- Thin pages carrying marketing language instead of specifics
- **Gated content.** An engine cannot read it, so it cannot cite it. Keep the most authoritative material open
- Content with no date and no named author
- **Templated pages differing only by a swapped variable.** This is the highest-risk pattern on the list, and it has a policy attached — see below
- Pages that depend on JavaScript the crawler does not execute

---

## Templated and location pages

`[P]` Scaled content abuse is "when many pages are generated for the primary purpose of manipulating search rankings and not helping users," and it applies equally to AI and human writing. `[P]` Pages targeted at different cities that funnel visitors to the same destination are named as doorway abuse.

`[U, practitioner consensus]` The common 2026 outcome is not a manual action but quiet suppression, filtering, or grouping so only one representative page shows. **It does not announce itself in Search Console.**

**The gate:** strip the variable — the city, the product model, the industry — from the title, H1 and body. **If what remains is indistinguishable from another page in the set, the page fails.**

The defense is per-instance substance, not per-instance templating. The page type is fine; the sameness is the problem.

---

## Informational and blog content

**Goal:** get cited as the source on topics in the category. These are the pages AI Overviews actually cite, which makes them the entry point even when they are not the pages that convert.

**Optimize:**
- One clear primary query per post, with its fan-out sub-questions as the H2 set
- A self-contained answer block under every H2
- At least one specific, attributable, checkable claim — a number, a named method, a concrete operational detail
- First-hand experience that only someone who did the work could write
- Named author with real credentials, plus Person schema
- A visible last-updated date that reflects a real update
- Internal links to the transactional pages the topic leads toward, and to every sub-answer in the cluster

**Pair visual topics with video.** `[S]` YouTube mentions are the strongest measured correlate of AI visibility across ChatGPT, AI Mode and AI Overviews.

---

## Transactional and service pages

**Goal:** win the surface these actually compete on, which is usually not the AI surface.

**Split by intent before optimizing.** `[S]` Explicitly transactional local queries fire the Local Pack around 93% of the time, while informational and hybrid queries fire AI Overviews at 92–97%. A transactional service page is competing for the Local Pack and classic organic, not for an AI Overview citation. Optimizing it as though it were an informational page targets the wrong surface.

**Optimize:**
- What the service is and who it is for, stated plainly in the opening
- Specific, verifiable detail rather than adjectives — method, coverage, credentials, what is actually included
- Visible pricing or a real pricing basis where the business can support it
- Trust signals with real numbers, disclosed accurately
- Clear next step
- Correct schema for entity binding: the most specific `LocalBusiness` subtype, `Service`, `Organization` with the `sameAs` spine and `knowsAbout`

**Do not add schema expecting citation lift.** It is for correctness and entity binding.

---

## Comparison and alternatives pages

**Goal:** get cited on "X vs Y" and "best X" queries.

**Optimize:**
- Structured comparison tables, not prose. A table is directly extractable; a paragraph comparing four things is not
- Genuinely balanced. An obviously self-serving comparison reads as one to a model too
- Specific criteria with real values, not marketing categories
- Current data, with the date visible

---

## Documentation and how-to content

**Goal:** get cited on "how to X" queries.

**Optimize:**
- Numbered steps, one action per step
- Prerequisites and expected outcome stated up front
- Code examples, screenshots with descriptive alt text, or real visuals where they carry information
- **No time estimates in the steps.** "Takes about ten minutes" is a guess that dates badly

`HowTo` desktop rich results were retired. Keep the step structure, which is what gets extracted; drop the schema deliverable.

---

## Reference and definitional content

**Goal:** own the entity for a term.

This is the format that matters most for a **common-noun homograph** — a canonical page establishing what the term means in your sense, what it is not, and what it looks like in practice. Every page mentioning the term links to it. See `brand-disambiguation.md` collision type 6.

**Optimize:**
- Definition in the first sentence, disambiguated in that same sentence
- Distinguish it explicitly from the colliding sense where one exists
- `knowsAbout` on Organization binding the brand to the intended topic
- Link inbound from everywhere the term appears

---

## Product and software pages

**Goal:** get cited on "what is {category}" and "best {category}" queries.

**Optimize:**
- What it does and who it is for, in the first paragraph
- Feature comparison against the category, not only against named competitors
- Specific metrics rather than adjectives — a stated figure beats "blazing fast"
- Visible pricing, since a page with no pricing has nothing to answer a pricing question with
- Question-format H2s covering the buyer's fan-out: pricing, integrations, limits, alternatives, migration

---

## Applying this file

For any content type, the sequence is the same:

1. **Identify the surface** the content actually competes on. Transactional local goes to the Local Pack; informational goes to AI Overviews; broad exploratory goes to AI Mode via fan-out coverage.
2. **Harvest the fan-out set** for the primary query rather than inventing it.
3. **Structure answer-first** against that set.
4. **Add the citable claim.**
5. **Check coverage, never length.**
