# 2026 AEO Patterns (Pixelmojo + Phase 0 Derived)

Reference for the str-onpage-audit Step 2.4 (Content Shape — AEO Patterns) pillar.

These are the patterns 2026 AI search engines (ChatGPT, Claude, Perplexity, Gemini, Google AIO, Bing Copilot) reward when extracting content for citations.

## The five AEO content patterns

### 1. Answer-first BLUF paragraph

**What:** First paragraph after H1 directly answers the page's primary intent question, in 40-60 words, using the same terminology AI engines query.

**Why:** AI engines extract the first paragraph as the canonical answer. If the BLUF is generic prose ("Welcome to our site..."), the AI engine either skips citing or fabricates an answer (hallucination).

**How:**
- Pull the page's primary intent question from target-keywords.md
- Write the answer in 40-60 words using the cluster's exact query terminology
- Lead with the direct answer, NOT a soft preamble

**Example (Got Moles homepage):**
- ❌ "Welcome to Got Moles. We've been helping homeowners since 2017..."
- ✅ "Got Moles is a veteran-owned mole control specialist serving Western Washington since 2017. Chemical-free methods. ~5,000 properties served across 92+ communities. 219+ five-star Google reviews."

### 2. Question-format H2s

**What:** H2 headings phrased as questions matching user query intent.

**Why:** AI engines pattern-match Q&A structure for extraction. A page with question H2s is more easily decomposed into citable answer chunks.

**How:**
- For informational pages, convert declarative H2s to questions
- Match the actual query phrasing from target-keywords.md (cluster query column)
- Don't force on transactional pages where Q-format reads awkward

**Example:**
- ❌ "Mole Behavior in Spring"
- ✅ "How active are moles in spring?"

### 3. Stat blocks for citable numbers

**What:** Distinct visual / structural components for key statistics — not buried in prose.

**Why:** AI engines extract structured stat blocks verbatim. Pixelmojo specifically rewards this pattern (high-impact action: "Add HTML tables for comparisons, ordered lists for steps, StatBlocks for statistics").

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

**Why:** Tables and ordered lists are the highest-fidelity extractable structures. AI engines pull them verbatim.

**How:**
- Convert comparison prose to HTML tables (`<table>`, not styled divs)
- Convert process steps to `<ol>` with explicit step numbers
- Don't over-table — only when the content genuinely is comparison or steps

**Comparison example:** DIY methods comparison → table with columns "Method / Effort / Effectiveness / Cost / Got Moles verdict"

**Steps example:** "How mole removal works" → ordered list, 4-7 steps

### 5. Verified-fact callouts (hallucination correction)

**What:** Above-the-fold callouts of canonical facts that AI engines often hallucinate.

**Why:** When AI providers state wrong facts (Pixelmojo flagged 4 high-severity hallucinations for Got Moles), authoritative third-party sources stating correct facts is itself an authority signal — but the first-party site must also state these facts prominently and consistently. AI engines crawling these pages will state correct facts in answers.

**How:**
- Pull canonical_facts from target-keywords.md frontmatter (founding year, pricing, locations, client count, etc.)
- Place above-the-fold on relevant pages (homepage, about, services)
- Use distinct visual treatment (callout box, stat block, fact list)
- Reinforce in: llms.txt, Organization schema, FAQPage Q&A, hero subheading

**Connection to authority-strategy.md Section 8.4:** The hallucination-correction matrix tracks per-fact correction surfaces. This skill audits whether the callouts are present on the relevant pages.

## Schema patterns (Step 2.3)

### Speakable schema (Article + WebPage)

```json
{
  "@type": "WebPage",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["h1", "main h2"]
  }
}
```

Tells voice assistants + AI Overviews which DOM elements to read aloud and cite. Pixelmojo's #1 high-impact action.

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

knowsAbout = topical authority signal. hasOfferCatalog with explicit prices = hallucination-correction signal for pricing queries.

## Anchor disambiguation (Step 2.5)

Per target-keywords.md Brand-Disambiguation Rule 5:
- Every anchor pointing to a page targeting an ambiguous head term must carry a lawn / yard / exterminator / geo / brand signal
- **Forbidden:** anchor text = `mole removal` alone (collapses to dermatology in AI Overviews)
- **Forbidden:** anchors from queries-to-avoid clusters (medical / cosmetic / pop culture / etc.)

## Cluster-specific AEO patterns

| Cluster | Highest-leverage AEO pattern |
|---|---|
| mole-control (head) | Stat blocks (client count, year-round programme, response time) + verified-fact callouts |
| biology | Question-format H2s + tables for species comparison |
| safety | Verified-fact callouts (chemical-free, kid/pet-safe) + outbound to AVMA/ASPCA authority |
| cost-value | Tables for pricing + stat blocks for cost ranges + dateModified (cost queries are time-sensitive) |
| seasonal | Ordered lists for monthly activity + question-format H2s + dateModified |
| diy-vs-pro | Tables for method comparison + ordered lists for "if DIY then X" decision logic |
| location-services | Per-location stat blocks + named-technician + GBP rating widget reference |

## Re-test cycle

Per authority-strategy.md Section 8.4: after applying fixes, wait 7-30 days for AI providers to recrawl/retrain, then re-run the hallucination matrix + Pixelmojo Radar to verify pattern adoption translated to citation lift.
