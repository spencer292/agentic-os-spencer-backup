# Brand and Entity Disambiguation

When your name, brand, book, framework, or product shares a name with another entity, AI systems have to pick which entity to cite. Whoever has stronger disambiguation signals wins. This is a common, silent, losable citation battle — but only when the colliding entity is one AI systems would actually conflate. Most "title overlaps" aren't real disambiguation problems.

---

## Contents

- The field/ICP/intent filter (run this first)
- How entity confusion loses citations
- Types of collision (name, title, framework, acronym)
- The disambiguation signal stack
- Example collisions and winning tactics
- Disambiguation audit checklist

---

## The field/ICP/intent filter — run this BEFORE flagging anything

Phrase coincidences are not entity collisions. Before treating a candidate as a disambiguation threat, sanity-check three axes:

1. **Same field/category?** A book about embodied cognition is not in the same field as a book about AI tooling for business owners, even if both share the phrase "thinking outside the brain". A SaaS company called "Delta" is not in the same field as Delta Airlines.
2. **Same ICP / audience intent?** Would the same person, in the same moment, plausibly be searching for both entities? If a researcher Googling "extended mind theory" and a service-business owner Googling "AI prompts for my plumbing business" are looking for different things, AI systems will resolve to different entities — there is no shared citation surface to fight over.
3. **Same query intent?** Run the candidate query through ChatGPT and Perplexity. If neither even surfaces both entities together, there is no resolution conflict happening today.

**If the answer to all three is "no" — there is no disambiguation issue. Note it and move on.** Concept overlap or title-phrase overlap alone is not a threat. Anchor only on entities AI systems would actually conflate, not phrase coincidences.

Real disambiguation candidates almost always pass at least 2 of the 3 axes. If a candidate fails all 3, you are pattern-matching on words, not on entity-resolution risk — and recommending defensive work against a non-threat dilutes everything else in the audit.

---

## How entity confusion loses citations

**Example (real same-field collision):** Two business books published within 18 months called "Traction" — Gino Wickman's EOS book (2007) and Gabriel Weinberg's startup-marketing book (2015). Same field (business), same ICP (founders/owners), same retailer shelf, same query intent ("Traction book recommendation"). When a user asks ChatGPT "should I read Traction?", ChatGPT has to resolve which one. Whichever has stronger signals — distinct subtitle in canonical metadata, distinct schema, distinct third-party citation density — wins.

This is what a real entity collision looks like: two entities AI systems would *actually* conflate because the field, audience, and query intent overlap.

**The loss is invisible.** You don't see "I lost a citation." You see "we got no AI traffic." Until you fix the entity disambiguation, AI systems default to the stronger entity and you stay dark.

---

## Types of collision

### 1. Personal name collisions

Multiple people with the same or similar name. Common with common names ("John Smith", "Sarah Johnson"). Less common but still possible with uncommon names if another public figure shares them.

### 2. Book / product title collisions

Two books or products with the same or near-identical title. Happens constantly because titles don't trademark easily.

### 3. Framework / methodology name collisions

"CARE Framework" collides with 10+ variants (NN/G, project management, nursing, education). "OKRs", "North Star Metric", "ICE scoring" all have multiple published variants. Your version competes with all of them for the same query.

### 4. Brand name collisions

Two companies with the same name in different industries (e.g. "Delta" = airline, faucet brand, Greek letter, Delta Force). Less common at the high end but frequent for small brands.

### 5. Acronym collisions

"BOS UP" is unique. "API" is not. Acronyms that overlap with common words or other abbreviations dilute searchability.

---

## The disambiguation signal stack

AI systems resolve ambiguity by scoring signal strength across these axes. Strong signals on ≥3 axes usually wins the citation.

### Axis 1: Distinct title / distinct subtitle

If you can add a distinguishing word or phrase to the canonical title, do it everywhere.

- **Weak:** "Traction" (collides with multiple business books)
- **Strong:** "Traction: Get a Grip on Your Business" (distinct subtitle anchors entity)

Deploy the distinct version in:
- Amazon title + subtitle fields
- Book schema `name`
- Publisher metadata
- Your site's `<title>` tags, OG title, meta description
- Every single backlink anchor text where possible

### Axis 2: Distinct author / brand association

Tie the title / framework to a distinguishable author or brand via every signal.

- `Book.author` schema on every page referencing the book
- Canonical bio mentions the title explicitly
- Amazon Author Central includes the title
- Podcast episode titles reference "(author of {title})"
- LinkedIn headline includes the title

### Axis 3: Distinct content corpus

You own a thick content layer that AI systems can pattern-match to distinguish you. Deep cornerstones on the specific themes only you cover — the AI-specific angle, the exact stack of methodologies, the case studies from your actual work.

**Target:** ≥10 cornerstone pages that only make sense as yours (not the other entity's).

### Axis 4: Distinct entity graph

Your `sameAs` linking, Wikidata entry, Knowledge Panel. See `references/entity-knowledge-graph.md`. The stronger your graph, the less chance of entity confusion.

### Axis 5: Third-party citations that explicitly disambiguate

Podcast interviews, press articles, guest posts, reviews that say "Roy Castleman's *Thinking Outside Your Brain with AI*" — not "Roy's book on thinking with AI."

Earned media during a launch is the single biggest disambiguation move. Every outlet that cites the distinct full title trains AI systems to resolve correctly.

### Axis 6: Distinct structured data

Schema differentiation:
- Different ISBN (distinct Book entity)
- Different publication date
- Different genre tagging
- Different language / region if applicable

### Axis 7: Direct contrast content (confrontational disambiguation)

Sometimes worth writing a dedicated page or blog post that explicitly disambiguates a real same-field collision: "Our [Framework Name] is distinct from [Other Framework Name in the same category] in three ways…" Controversial — can feel petty — but deeply effective for AI entity resolution when the entities genuinely conflate. Only use this when the field/ICP/intent filter at the top of this document confirms a real collision; never deploy it against a phrase coincidence.

Do it once, link it once, move on. Not a core content pillar.

---

## Example collisions and winning tactics

### Case 1: Book title collision (same category)

**Situation:** Your business book shares a title with another business book.

**Winning tactics:**
- Add unique subtitle to every surface
- Get the distinct full title into press headlines
- Build Book schema with ISBN + author entity
- Secure Amazon author page with dedicated bio referencing the title
- Publish 3-5 podcast interviews referencing the full title in episode metadata
- Add Wikidata entry for your book specifically (Wikidata allows distinct items even with near-identical names when disambiguated by author / date / ISBN)

### Case 2: Framework name collision (same term, different fields)

**Situation:** Your "CARE Framework" competes with NN/G's usability CARE, nursing CARE, project management CARE.

**Winning tactics:**
- Always use a disambiguator in first mention: "CARE Framework for AI Thinking" or "Roy Castleman's CARE Framework"
- Schema: use `DefinedTerm` type with explicit `inDefinedTermSet` pointing to your framework hub
- Content: on your CARE page, include a section "How this differs from other CARE frameworks" — explicitly compare. AI systems weight this heavily for entity resolution.
- Third-party: when discussing the framework externally, always use the disambiguator

### Case 3: Acronym collision

**Situation:** Your acronym is common (e.g. "BOS" collides with lots of things).

**Winning tactics:**
- Use the expanded form on first mention: "BOS UP (Business Operating System — UP)"
- Register the acronym as your brand's trademark if possible (trademark feeds into Wikidata / Knowledge Panel)
- Never use the acronym alone in metadata (titles, H1s); always pair with a qualifier

### Case 4: Personal name collision

**Situation:** Another public figure shares your name.

**Winning tactics:**
- Include middle name / credential / affiliation in canonical bio ("Roy Castleman, founder of All The Power")
- Distinct domain (you own `yourname.com` plus brand domain)
- Dedicated "About" page with strong Person schema + sameAs
- LinkedIn headline includes company / role
- If the other figure is dominant, pivot to brand-led positioning (your brand becomes the primary entity, you become the "founder of X")

---

## Disambiguation audit checklist

For each potential collision, score:

| Signal | Status |
|--------|:--:|
| Distinct full name/title used in canonical metadata (site `<title>`, schema, OG) | {pass/fail} |
| Distinct full name/title used in Amazon / publisher / third-party listings | {pass/fail} |
| Dedicated distinguishing description (1-2 sentence canonical) | {pass/fail} |
| Schema uses specific entity type with distinct identifiers (ISBN / Q-id / etc.) | {pass/fail} |
| Author/brand association explicit in all surfaces | {pass/fail} |
| ≥3 third-party citations using distinct full name/title | {pass/fail} |
| Wikidata entry specifically for this entity | {pass/fail} |
| Direct disambiguation content page (if collision is severe) | {pass/fail} |
| Cross-platform sameAs graph complete | {pass/fail} |

**Score:** {0-9}. Anything below 6 = high risk of entity confusion. Above 7 = generally winning disambiguation battles.

---

## When to run this audit

- **Book launches:** mandatory before launch week
- **New framework / methodology publication:** mandatory
- **Rebrand / name change:** mandatory (high collision risk with old brand)
- **New geographic market entry:** check for local-language collisions
- **When AI citation traffic is lower than content quality predicts:** run as first diagnostic

## Typical finding in practice

Most authors and thought leaders I audit have **3-5 of 9 disambiguation signals in place**. They've done Amazon and LinkedIn well; they haven't done Wikidata, explicit schema disambiguation, or third-party citation seeding with the distinct full title. Closing those gaps during launch week produces measurable citation lift within 4-8 weeks.
