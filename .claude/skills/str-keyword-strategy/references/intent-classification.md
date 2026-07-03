# Intent Classification — 8 Categories

> **CLIENT CONTEXT (added 2026-07-02):** worked examples below are from the ATP era (Roy Castleman / THRIVE / Bedford). Apply the METHOD; substitute Got Moles clusters (mole removal, TMCP, cost, DIY-vs-pro, pet safety, city pages) and WA-local geography.

Per Google's evolved quality rater guidelines (2026), search intent has split beyond the classic 4-category model into 8 working categories. Tag every query with **primary** intent (mandatory) and **secondary** intent (optional, when query genuinely splits).

## The 8 categories

### 1. Informational
User wants to learn or understand. No commercial intent yet.
- "what is a business operating system"
- "why am I always tired as a business owner"
- "how does AI thinking work"

### 2. Navigational
User wants to reach a specific brand/site/entity.
- "all the power coaching"
- "Roy Castleman LinkedIn"
- "Power Movers podcast Spotify"

### 3. Commercial
User is comparing options before buying. The biggest cluster of high-value SEO/GEO queries for thought-leader brands.
- "best business coach for service business owners"
- "AI coach UK"
- "BOS UP coach pricing"

### 4. Transactional
User wants to buy or sign up now.
- "buy thinking outside your brain with AI"
- "join THRIVE community"
- "book Roy Castleman coaching"

### 5. Short fact
Single-fact queries, often answered in featured snippet or AI Overview without click.
- "when does Thinking Outside Your Brain with AI launch"
- "how many companies does Roy Castleman run"
- "what is the EVOLVE method"

### 6. Comparison
Side-by-side evaluation between named alternatives.
- "BOS UP vs EOS"
- "Scaling Up vs EOS UK"
- "Roy Castleman vs Robin Waite"

### 7. Instruction
"How to" / step-by-step intent. Often pairs with HowTo schema for citation.
- "how to stop being the bottleneck in my business"
- "how to use AI for service business owners"
- "how to delegate when nothing meets my standards"

### 8. Consequence
"What happens if" / cause-effect intent. Underrepresented in most strategies, high-value for thought leaders.
- "what happens if I don't fix my business bottleneck"
- "what happens to founders who never delegate"
- "what is double burnout"

## Tagging rules

1. **Tag primary first** — what's the dominant user need?
2. **Tag secondary only if the query genuinely splits.** Don't double-tag for completeness; over-tagging dilutes the cluster signal.
3. **When in doubt, run the SERP test.** Look at what types of pages currently rank — if listicles dominate, intent is commercial. If long explanatory articles win, informational. If product pages lead, transactional.
4. **Branded queries are always navigational** unless they include a comparison or instruction modifier ("Roy Castleman reviews" → commercial; "how Roy Castleman runs his business" → instruction).

## Tie-break rules

When two categories feel equally valid:

| Tie | Resolution |
|---|---|
| Informational vs Commercial | Look at modifiers — "best", "vs", "for [audience]", "review" → Commercial. Pure "what is" / "why" → Informational |
| Commercial vs Transactional | Has the user decided? "Best X" = Commercial (still deciding). "Buy X" = Transactional (decided) |
| Instruction vs Informational | "How to" → Instruction. "How does" → Informational |
| Short fact vs Informational | If answer is one sentence/data point → Short fact. If answer needs explanation → Informational |
| Comparison vs Commercial | Specific named alternatives ("X vs Y") → Comparison. Generic "best X for Y" → Commercial |

## Why this matters for content type

| Intent | Best content shape | Schema to deploy |
|---|---|---|
| Informational | Long-form pillar / cornerstone | Article + Speakable |
| Navigational | Branded landing page | Person / Organization / WebSite |
| Commercial | Comparison page / "best of" listicle / detailed offer page | Article + AggregateRating (if applicable) + Offer |
| Transactional | Product / sales page | Product / Offer / Service |
| Short fact | FAQ entry / definition block in pillar | FAQPage + Speakable |
| Comparison | Dedicated /vs/ page | Article + ItemList |
| Instruction | Step-by-step guide | HowTo + Article |
| Consequence | Long-form cause-effect article | Article + Speakable |

This table seeds the page-assignment step.

## Common mistakes to avoid

- **Treating "how to" and "how does" as the same.** They split intent — one wants steps, one wants explanation. Different page shapes.
- **Tagging everything Commercial because "high-value."** Commercial intent is a behaviour signal, not a budget signal. A pillar Informational page can drive more downstream Commercial queries than a thin direct Commercial page.
- **Ignoring Short fact.** AI Overviews disproportionately surface Short fact answers; if a brand has good Short fact coverage with FAQ schema, AI citation rate climbs faster than blog volume alone would predict.
- **Branded query as Commercial.** "Roy Castleman" alone is Navigational — the user already wants Roy. "Roy Castleman reviews" is Commercial because they're evaluating.
