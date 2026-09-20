# Entity and Knowledge Graph Audit

Why AI systems cite one brand over another for the same query often comes down to entity graph strength. An entity is a real-world thing (person, organization, book, product, event) that AI systems recognise and link across sources. Strong entity graph = cited by name. Weak entity graph = your competitor gets cited even when you have better content.

---

## Contents

- What an entity graph is and why it matters
- The `sameAs` methodology
- Wikidata: the AI systems' shared ontology
- Google Knowledge Panel triggers
- Author / Person entity consistency
- Book / Product entity consistency
- Organization entity consistency
- Entity audit scorecard

**What schema does and does not do here.** `[S]` Adding schema to already-visible pages produced roughly no citation change (Ahrefs difference-in-differences, −4.6% / +2.4% / +2.2%), and `[P]` Google states structured data is not required for generative AI search. **Entity binding is the one place schema still genuinely earns its keep** — not because it lifts citations, but because it is how a system confirms which thing you are. Frame it that way in client work.

---

## What an entity graph is

AI systems maintain implicit or explicit knowledge graphs: nodes for entities, edges for relationships. Google's Knowledge Graph is the visible example; the answer engines maintain similar structures during response synthesis.

When a system answers a query naming an entity, it resolves the name to a candidate entity, traces the relationships around it, and draws on sources associated with that entity. **Candidate generation is followed by context-weighted linking with a popularity prior** — where one candidate dominates the training distribution, an ambiguous mention resolves to it by default.

If your entity is weakly signposted — inconsistent `sameAs`, no Wikidata entry, no Knowledge Panel — the system resolves to whichever candidate has the stronger graph. That may be a different organization with a similar name, a different person sharing yours, or **not an organization at all**: for a brand whose service term is an everyday word, the competing candidate is the common meaning of that word. See `brand-disambiguation.md` collision type 6, which is the hardest version of this problem.

**The failure is silent.** Nothing reports "the entity did not resolve." It looks like an absence of traffic.

---

## The `sameAs` methodology

`sameAs` in schema.org links your entity on your site to the same entity on other authoritative sources. This is how AI systems confirm "the John Smith on site A is the same John Smith as LinkedIn profile X."

**Minimum sameAs set for a Person (author / thought leader):**

```json
{
  "@type": "Person",
  "@id": "https://yourdomain.com/about#person",
  "name": "Your Name",
  "url": "https://yourdomain.com/about",
  "sameAs": [
    "https://en.wikipedia.org/wiki/Your_Name",
    "https://www.wikidata.org/wiki/Q{id}",
    "https://www.linkedin.com/in/your-handle",
    "https://twitter.com/your-handle",
    "https://www.amazon.com/author/your-name",
    "https://www.goodreads.com/author/show/your-id",
    "https://github.com/your-handle",
    "https://www.crunchbase.com/person/your-handle",
    "https://podcasts.apple.com/podcast/your-podcast/id{id}"
  ]
}
```

**Minimum sameAs set for an Organization.** The right list is the set of profiles that actually exist and that engines actually read for the category — for a local service business that is the business profiles and directories, not the software-industry set.

```json
{
  "@type": "Organization",
  "@id": "https://example.com/#org",
  "name": "Brand Name",
  "url": "https://example.com",
  "knowsAbout": ["{core service}", "{core service}", "{disambiguating topic}"],
  "sameAs": [
    "https://www.google.com/maps/place/?q=place_id:{placeid}",
    "https://www.yelp.com/biz/{slug}",
    "https://www.facebook.com/{slug}",
    "https://www.linkedin.com/company/{slug}",
    "https://www.youtube.com/@{handle}",
    "https://www.wikidata.org/wiki/Q{id}"
  ]
}
```

**`knowsAbout` is the underrated field.** It binds the organization to a set of topics rather than to a string, which is exactly what a name-based resolution cannot do on its own. For any brand with an ambiguous name or service term, this is the single most useful line of schema on the site.

**Consistency rules:**
- The same `name` on every profile, character for character. One profile carrying a middle initial or a legal suffix the others omit is drift
- The same logo and profile image everywhere
- One canonical description, used verbatim
- Every profile links back to the site; the site's schema links to every profile
- **The `sameAs` values are identical everywhere they appear**, not merely equivalent

Drift dilutes the entity. `[S]` Business-profile accuracy measured 68% on ChatGPT and Perplexity, so this is a common and consequential failure rather than a theoretical one.

---

## Wikidata: the shared ontology

Wikidata is the machine-readable cousin of Wikipedia. It's the single most-referenced entity database for AI systems — virtually every AI model training corpus ingests it.

**Why Wikidata matters:**
- Google, Perplexity, ChatGPT, and Claude all cross-reference Wikidata for entity resolution
- A Wikidata entry is often easier to get than a Wikipedia page (lower notability bar)
- Wikidata entry makes Wikipedia page more likely later

**How to get a Wikidata entry:**
1. Build basic notability first: at least 2 independent secondary sources mention you (press, podcast appearances, industry articles)
2. Create account at wikidata.org
3. Create item: add core properties — `instance of`, `occupation`, `country of citizenship`, `date of birth` (persons); `instance of`, `industry`, `headquarters location`, `founded` (organizations)
4. Add `official website` property linking to your site
5. Add `Wikipedia` link if you have one; if not, leave blank
6. Add identifiers: LinkedIn, Twitter, Amazon, Crunchbase etc. — Wikidata knows these as specific properties (`P2035` for LinkedIn, `P2002` for Twitter)
7. Link from your site's schema: `sameAs: ["https://www.wikidata.org/wiki/Q{your-id}"]`

Entries can be deleted if they fail notability review. Don't attempt without ≥2 independent secondary sources.

---

## Google Knowledge Panel triggers

A Knowledge Panel is the sidebar that appears on branded Google searches. Knowledge Panels feed Google AI Overviews and provide high-weight authority signal across all platforms.

**Triggers (in order of ease):**
1. **Claim your Google Business Profile** — if you have any physical presence, even a registered address
2. **Build Wikidata entry** — single highest-leverage move
3. **Consistent sameAs graph across platforms** — detailed above
4. **Wikipedia page** — gold standard, but high notability bar
5. **Structured Organization schema with logo + contactPoint + sameAs** on your homepage

**Verify current state:** search `{your brand name}` on Google — if no Knowledge Panel appears, you're entity-weak. Competitors with Knowledge Panels will outcite you on brand-adjacent queries.

**Once you have a Knowledge Panel:** claim it via Google's "Suggest an edit" flow for owners. Lets you update photos, descriptions, hours, etc.

---

## Author / Person entity consistency

Books, podcasts, thought leadership, and coaching brands live or die by Person entity strength. Gaps here are the most common cause of "our book isn't getting cited."

**Checklist per author:**

| Channel | Property | Consistency check |
|---------|----------|-------------------|
| Amazon Author Central | Name, photo, bio | Matches site exactly |
| Goodreads author page | Name, photo, bio | Matches site |
| LinkedIn profile | Name, photo, headline | Matches site |
| Twitter / X | Name, photo, bio | Matches site |
| Wikipedia | (if present) | Matches site |
| Wikidata | Core properties | Present and accurate |
| Publisher author page | Name, photo, bio | Matches site |
| Podcast hosts (Apple, Spotify, RSS) | Name, photo, description | Matches site |
| YouTube channel About | Name, description | Matches site |
| Personal site `/about` | Person schema with full sameAs | Canonical source |

**Single-sentence canonical bio rule:** have one short (under 200 char) bio that you use verbatim across every platform. AI systems notice variance and deprioritize fuzzy entities.

---

## Book / Product entity consistency

For book launches, the Book entity is cited for "where to buy {book title}" and related queries. AI systems need consistent, structured data.

**Minimum Book schema:**

```json
{
  "@type": "Book",
  "name": "{Full title including subtitle}",
  "author": { "@id": "https://yourdomain.com/about#person" },
  "isbn": "{13-digit ISBN}",
  "datePublished": "{ISO date}",
  "bookFormat": "https://schema.org/Paperback",
  "inLanguage": "en",
  "publisher": { "@type": "Organization", "name": "{publisher}" },
  "description": "{canonical 2-sentence description}",
  "genre": ["{genre1}", "{genre2}"],
  "offers": [
    {
      "@type": "Offer",
      "url": "{retailer URL for the primary market}",
      "price": "{price}",
      "priceCurrency": "{ISO currency code for that market}",
      "availability": "https://schema.org/InStock"
    }
  ],
  "workExample": [
    {
      "@type": "Book",
      "isbn": "{paperback-isbn}",
      "bookFormat": "https://schema.org/Paperback"
    },
    {
      "@type": "Book",
      "isbn": "{ebook-isbn}",
      "bookFormat": "https://schema.org/EBook"
    }
  ]
}
```

**Cross-platform consistency:**
- Amazon metadata matches schema (title, subtitle, author, ISBN)
- Goodreads metadata matches
- Publisher page metadata matches
- Google Books entry matches (can be claimed via Google Books Partner Program)

---

## Measuring entity resolution

**This is the section that replaces guesswork, and it is the most important one in the file.** Everything above is signal-building. This is how you find out whether it worked.

A previous version of this file instructed a Brave Search check as the way to verify Claude visibility, on the stated basis that "Claude's web search backend is Brave." **That was inference presented as fact.** `[U]` Anthropic has never published what Claude uses for grounding, the circulating overlap figures have no reachable methodology, and building a Brave-specific strategy on them is not defensible. Removed.

**Ask the engines directly instead.** DataForSEO `ai_optimization/llm_responses` runs a fixed prompt set across ChatGPT, Gemini and Claude at a low per-prompt cost, which makes a monthly entity check cheap.

**The prompt set:**
- "What is {brand}?" — does the right entity come back at all
- "Who is {person}?" — for a personal-brand entity
- "{Brand} reviews" — does it resolve to the right organization
- "Who does {service} in {location}?" — does the brand appear, and as what
- Two or three category questions the audience would actually ask

**What to record per engine per prompt:** which entity came back, whether any detail is wrong, and whether it hedged or returned nothing. Log it over time. **A single run is an anecdote** — answers are personalized and multi-turn.

Pair it with `ai_optimization/llm_mentions` for sentiment, since an entity can resolve correctly and be framed badly, and `[S]` framing flips far more often than presence does.

**Wrong facts are the actionable output.** An engine confidently stating something incorrect about the business is a correction target. The correction surfaces that work are the ones engines actually read — the site itself, the business profiles, and third-party sources carrying accurate information. **An llms.txt is not a correction surface**; no engine documents reading one, which makes it the worst available place to put a correction.

---

## Entity audit scorecard

Include this in the audit report:

```markdown
### Entity Graph State

| Signal | Status | Notes |
|--------|:--:|------|
| Wikidata entry | {yes/no} | {Q-id if yes} |
| Wikipedia page | {yes/no} | |
| Google Knowledge Panel | {yes/no} | {verified via branded search} |
| Organization schema sameAs completeness | {/10} | {missing platforms} |
| Person schema sameAs completeness | {/10} | {missing platforms} |
| Cross-platform name consistency | {pass/fail} | {variants if any} |
| Cross-platform bio consistency | {pass/fail} | |
| `knowsAbout` binds the brand to its actual topics | {pass/fail} | |
| `sameAs` values identical everywhere they appear | {pass/fail} | {drift found} |
| **Entity resolution measured across engines** | {pass/fail} | {which entity came back, per engine, per prompt} |
| Factual errors returned by any engine | {none / list} | {correction targets} |
| Author Person schema (if applicable) | {yes/no} | |
| Book or Product schema (if applicable) | {yes/no} | {missing fields} |

### Entity graph score: {0-N based on checklist}
```

**Measurement outranks the checklist.** A complete `sameAs` graph that still resolves to the wrong entity is a failed graph, and a thin graph that resolves correctly on every engine is not an urgent problem. Score the signals, but lead the finding with what the engines actually returned.

Feed this into the Authority pillar. **Report dates and per-engine results, never a projected timeframe for improvement** — no study supports one for entity work.
