# Intent Classification — 8 Categories

Worked examples are Got Moles. For another client, apply the method and substitute that client's queries.

Search intent is tagged in two stages. **Intent** says what the user wants. **Surface** says where Google answers it. Both are mandatory columns in `brand_context/target-keywords.md`, and intent determines surface — that is why this step runs first.

**Provenance.** This 8-category model is a working extension of the classic informational / navigational / commercial / transactional split, refined against this account's own SERPs. It is **not** sourced to any published Quality Rater Guidelines revision. The September 2025 edition is current and no 2026 revision exists (landscape file §7). An earlier version of this file attributed the model to a "2026 evolution of the rater guidelines"; that attribution was unsourced and has been removed. Use the model because it maps cleanly to page shape and to surface, and label it `[U]` if it ever reaches client-facing output.

Cross-check every manual tag against the DataForSEO Labs `search_intent` label. Where they disagree, the manual verdict wins and both are recorded.

## The 8 categories

### 1. Informational
Wants to learn or understand. No commercial intent yet.
- "what do mole holes look like"
- "why do molehills appear in spring"
- "are moles good for your yard"

### 2. Navigational
Wants a specific brand or entity.
- "got moles"
- "got moles reviews"
- "mole patrol seattle"

### 3. Commercial
Comparing options before buying. The highest-value cluster for a service business.
- "best mole control company washington"
- "mole exterminator near me"
- "professional mole removal"

### 4. Transactional
Ready to buy or book now.
- "book mole control"
- "mole control quote washington"
- "total mole control program pricing"

### 5. Short fact
One-fact queries, usually answered without a click.
- "how many eyes do moles have"
- "how deep do moles dig"
- "are moles nocturnal"

### 6. Comparison
Side-by-side evaluation between named alternatives.
- "vole vs mole"
- "moles vs gopher mounds"
- "monthly vs one-time mole control"

### 7. Instruction
Step-by-step intent.
- "how to get rid of moles in your yard"
- "how to find active mole tunnels"
- "how to repair mole damage in a lawn"

### 8. Consequence
Cause-and-effect intent. Under-represented in most strategies and strong for authority content.
- "what happens if you leave moles in your lawn"
- "do moles come back after trapping"
- "will moles go away on their own"

## Tagging rules

1. **Tag primary first** — what is the dominant need?
2. **Tag secondary only when the query genuinely splits.** Over-tagging dilutes the cluster signal.
3. **When in doubt, read the live SERP.** A `serp/google/organic/live/advanced` call returns the item types and the ranking page shapes in one request. Listicles dominating means commercial; long explanatory pages means informational; a local pack means the query is local-commercial regardless of phrasing.
4. **Branded queries are navigational** unless a modifier moves them: "got moles reviews" is commercial, "how got moles traps moles" is instruction.
5. **Homograph check before tagging.** A "mole" query whose SERP is dermatology is not a low-priority query, it is a query in the queries-to-avoid list. Check the SERP before assigning intent to any ambiguous root term.

## Tie-break rules

| Tie | Resolution |
|---|---|
| Informational vs Commercial | Modifiers decide — "best", "vs", "near me", "cost", "review" → Commercial. Pure "what is" or "why" → Informational |
| Commercial vs Transactional | Has the user decided? "Best mole control company" is Commercial. "Book mole control" is Transactional |
| Instruction vs Informational | "How to" → Instruction. "How does" → Informational |
| Short fact vs Informational | One sentence answers it → Short fact. Needs explanation → Informational |
| Comparison vs Commercial | Named alternatives ("vole vs mole") → Comparison. Generic "best X" → Commercial |
| Commercial vs Commercial-local | If the query carries a city, a county or "near me", it is local — and that changes the surface, not just the tag |

## Intent → surface

This is the table the whole strategy hangs on. Surface is confirmed by a live SERP call for the top priority keywords and inferred from this table below that, marked `inferred`.

| Intent | Typical surface | Won by |
|---|---|---|
| Transactional + local ("mole control Everett") | **Local Pack** (~93%) | Google Business Profile, proximity, reviews, service-area depth. Page copy barely moves it |
| Commercial + local ("mole exterminator near me") | **Local Pack**, often with an AI Overview above it → `multi` | GBP primarily, plus a cited service page for the AI Overview half |
| Informational + local ("how do I get rid of moles") | **AI Overviews** (~92%) | Classic organic rank plus answer-first cited content |
| Hybrid ("average cost of mole control in Tacoma") | **AI Overviews** (~97%) | Same, with the geo qualifier carried in the answer passage |
| Informational "near me" | **AI Overviews** (76.9%) | Same |
| Broad, conversational, multi-part | **AI Mode** | Fan-out coverage across sub-queries, not head-term rank |
| Short fact | AI Overviews, frequently zero-click | A self-contained 40–60 word answer in the retrieved chunk |
| Comparison | AI Overviews or Classic | A genuine side-by-side with a table, not a hedge |
| Navigational | Classic | Owning the branded SERP; brand defense |

Rates are from the landscape file §2.2. Do not restate them in client-facing output without the `[S]` label and the source.

## Intent → content shape

| Intent | Best page shape | Schema (correctness and entity binding only) |
|---|---|---|
| Informational | Pillar or cornerstone, answer-first, one fact per sentence | Article/BlogPosting + `dateModified` + Person author |
| Navigational | Branded landing page | Organization with `sameAs` spine + `knowsAbout`, Person |
| Commercial | Comparison or decision page, honest side-by-side | Service, Article, Review/AggregateRating only where genuine and disclosed |
| Transactional | Service or booking page | Service, LocalBusiness (most specific subtype) |
| Short fact | A definition or answer block inside a pillar | Article/BlogPosting |
| Comparison | A dedicated comparison page with a real table | Article/BlogPosting |
| Instruction | Step-by-step guide with numbered steps | Article/BlogPosting |
| Consequence | Cause-and-effect article | Article/BlogPosting |

**Schema notes.** FAQPage is absent from this table deliberately: the FAQ rich result was removed between 2026-05 and 2026-08 and the markup now earns nothing. **Keep the question-and-answer content shape, drop the markup as a deliverable, and leave existing markup alone.** HowTo desktop rich results were retired in 2023. Speakable is optional at best. Never present schema as an AI-citation lever — a controlled test on 1,885 pages found no citation uplift (landscape file §5.2, §6).

## Common mistakes to avoid

- **Treating "how to" and "how does" as the same.** One wants steps, one wants explanation. Different page shapes.
- **Tagging everything Commercial because it feels high-value.** Commercial is a behavior signal, not a budget signal. An informational pillar feeds more commercial queries than a thin commercial page.
- **Ignoring Short fact.** These queries carry the biology cluster, which is this account's largest impression source and its strongest AI Overview asset — even though it converts poorly on its own.
- **Assuming a schema type wins the surface.** Content shape and organic rank win AI Overviews; Google Business Profile wins the Local Pack; fan-out coverage wins AI Mode. Schema does none of the three.
- **Tagging intent without checking the SERP on a homograph term.** "Mole removal cost" reads commercial and returns dermatology.
