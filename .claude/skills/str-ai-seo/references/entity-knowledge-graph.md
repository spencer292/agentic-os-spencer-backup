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
- Brave Search verification for Claude
- Entity audit scorecard

---

## What an entity graph is

AI systems maintain implicit or explicit knowledge graphs: nodes (entities) and edges (relationships). Google's Knowledge Graph is the most visible example; ChatGPT, Perplexity, and Claude all maintain similar internal structures during response synthesis.

When an AI system answers a query like "who wrote Thinking Outside Your Brain with AI?" it:
1. Resolves the book title → book entity
2. Traces to author entity
3. Cites sources associated with that author entity

If your author entity is weak (inconsistent sameAs, no Wikidata, no Google Knowledge Panel), the AI picks whichever entity has the stronger graph — often a different author with the same name or a similar title.

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

**Minimum sameAs set for an Organization:**

```json
{
  "@type": "Organization",
  "@id": "https://yourdomain.com/#org",
  "name": "Your Brand",
  "url": "https://yourdomain.com",
  "sameAs": [
    "https://en.wikipedia.org/wiki/Your_Brand",
    "https://www.wikidata.org/wiki/Q{id}",
    "https://www.linkedin.com/company/your-brand",
    "https://twitter.com/your-brand",
    "https://www.facebook.com/your-brand",
    "https://www.instagram.com/your-brand",
    "https://www.youtube.com/@your-brand",
    "https://www.crunchbase.com/organization/your-brand"
  ]
}
```

**Consistency rules:**
- Same `name` across every profile (exact match — "Roy Castleman" not "Roy N Castleman" on one and "Roy Castleman" on another)
- Same logo / profile image across platforms
- Same description text (one canonical 2-sentence description)
- All profiles link back to your site
- Your site's schema links to all profiles

Any drift = entity dilution. AI systems quietly deprioritize fuzzy entities.

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
      "url": "https://www.amazon.co.uk/dp/{asin}",
      "price": "12.99",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock"
    },
    {
      "@type": "Offer",
      "url": "https://www.amazon.com/dp/{asin}",
      "price": "15.99",
      "priceCurrency": "USD",
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

## Brave Search verification for Claude

Claude's web search backend is Brave. If your site isn't visible on Brave Search, Claude cannot cite you — regardless of how well you optimize elsewhere.

**Verification steps:**
1. Visit `https://search.brave.com`
2. Search for your brand, your top cluster keywords, and your target queries
3. Record whether you appear in top 10 for each
4. If not: likely Brave's crawler (`Bravebot`) hasn't indexed you, OR robots.txt is blocking, OR canonicals are confused

**If Brave shows nothing:**
- Submit your sitemap to Brave via Webmaster support (no public dashboard as of 2026)
- Verify `Bravebot` is not blocked in robots.txt
- Check content isn't blocked by JavaScript rendering requirements
- Request index refresh after fixes

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
| Brave Search visibility | {pass/fail} | {tested queries} |
| Amazon Author Central (if author) | {yes/no} | |
| Goodreads author page (if author) | {yes/no} | |
| Book schema (if book) | {yes/no} | {missing fields if yes} |

### Entity graph score: {0-10 based on checklist}
```

Feed this score into the Authority pillar (weight 30% of Authority).
