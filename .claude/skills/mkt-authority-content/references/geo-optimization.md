# Answer-First Content Checklist

*Last updated 2026-09-02. Landscape source: `../../.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`, relative to the client folder (`clients/got-moles/`) that skills are run from. Where this file and the landscape file disagree, the landscape file wins.*

How to structure content so both classic search and the answer surfaces can retrieve a self-contained answer out of it.

---

## The Surfaces, Named

They are not one thing. Tag every post with the surface it competes on, because they are won differently.

| Surface | What it is | How it is won |
|---|---|---|
| **Classic organic** | Blue links. Still present, no longer the primary discovery surface | Conventional relevance and quality |
| **Local Pack** | The map results. Fires on ~93% of explicitly transactional local queries | Google Business Profile, proximity, reviews — not content |
| **Google AI Overviews** | The generated block above results. Fires on ~92% of informational local queries, ~97% of hybrid ones | **Organic-rank coupled** — 97% of AI Overviews cite at least one source from the organic top 20. Rank first, then be quotable |
| **Google AI Mode** | The default Search experience since 2026-05-19 | **Fan-out coupled** — the query is decomposed into sub-queries and each is retrieved against. Coverage across the fan-out, not head-term rank |
| **ChatGPT / Perplexity / Gemini / Copilot** | Independent answer engines | Brand mentions, third-party listicles, review-site presence. Winning AI Overviews substantially predicts winning these (cross-platform overlap 0.749–0.821) |

Informational and hybrid posts are written for AI Overviews and AI Mode. Transactional local intent is a Local Pack problem, which content does not solve.

## Why This Matters

Answer surfaces don't just rank pages — they retrieve a passage and cite its source. On an AI Overview SERP, a cited page earns roughly 2.1% click-through against 0.9% for an uncited page on the same SERP. Being the quoted passage is the whole game.

**Set expectations honestly.** Niche brands appear in about 11% of relevant AI answers, against 73% for global household names. AI local visibility is measured at three to 30 times harder to achieve than local-pack ranking. This is a compounding program, not a switch.

**No competitive claim without measurement.** Do not assert that competitors are or are not doing this. If the question matters, measure it — DataForSEO LLM Responses prices a prompt at $0.0006, so "who does an engine name for this query" is a cheap thing to check rather than assume.

## Google's Own Position, and What It Rules Out

Google published generative-AI optimization guidance on 2026-05-15, last updated 2026-07-10. It names as **unnecessary**: machine-readable AI text files, breaking content into tiny chunks, rewriting in AI-specific language, chasing inauthentic brand mentions, over-focusing on keyword variations, "AEO/GEO hacks", and special schema. Its stated position is that there are no additional requirements to appear in AI Overviews or AI Mode.

It names as **effective**: distinctive non-commodity content with a unique expert or experienced take, clear headings and sections, quality images and video with supporting text, semantic HTML, strong page experience, reduced duplication, effective internal linking, and — for businesses — Google Business Profile.

So: answer-first structure is a **retrieval preference that helps**, not a requirement Google imposes. Write it because passages that stand alone get quoted, not because a rule says to. And the eligibility gate is plain — a page must be indexed and eligible to show with a snippet. Nothing else is a prerequisite.

---

## Structure Checklist

Run through this for every post before saving:

### 1. BLUF Answer Block
- [ ] First block directly answers the primary search query
- [ ] **40–60 words**, self-contained
- [ ] **One fact per sentence** — no hedging, no compound clauses. Hedged sentences do not get quoted
- [ ] Contains at least one specific number or fact
- [ ] Passes the lift test: cut it out of the page, and it still reads as a complete, correct answer
- [ ] Carries a disambiguating token in the same sentence as "mole" (see section 9)

### 2. Heading Hierarchy and Answer Blocks
- [ ] H1 = title (includes primary keyword, and an unambiguous lawn signal per Rule 1)
- [ ] H2s are questions people actually type ("How deep do moles dig?") or direct topic labels — never abstract section names ("Depth Considerations")
- [ ] **Each H2 is followed immediately by a 40–80 word self-contained answer**, then the supporting depth
- [ ] Each answer block passes the same lift test as the BLUF
- [ ] H3s break complex sections into scannable sub-topics
- [ ] No heading skips (H1 → H3 without H2)

### 3. Comparison Tables
- [ ] Include at least one table for any post comparing options, species, products, or methods
- [ ] Tables have clear headers and consistent formatting
- [ ] Data is specific (numbers, names, facts) not vague ("varies", "depends")
- [ ] AI parses tables extremely well — this is one of the highest-value GEO structures

### 4. Numbered Lists
- [ ] Steps, processes, or rankings use numbered lists (not bullets)
- [ ] Each item starts with the key point (not a filler word)
- [ ] AI extracts numbered lists as featured snippets and step-by-step answers

### 5. Definitions and Key Facts
- [ ] Important terms are defined inline or in a clear definition format
- [ ] Key facts are stated as standalone sentences (not buried in paragraphs)
- [ ] Format: "[Term]: [definition]" or "**[Term]** — [definition]"
- [ ] AI loves extracting clean definitions

### 6. FAQ Section
- [ ] 3-5 FAQs at the end of every post
- [ ] Questions come from the latest `projects/str-question-harvester/` gap report and the fan-out set, not a static intent map
- [ ] Answers are 40–80 words, self-contained, one fact per sentence
- [ ] FAQs mop up fan-out sub-queries that did not earn a full H2
- [ ] **No FAQPage schema deliverable.** FAQ rich results were removed between 2026-05 and 2026-08. The markup is still valid and earns nothing. Keep the Q&A shape; do not promise a rich result; do not strip existing markup from published pages

### 7. Citation-Worthy Statements
- [ ] At least one specific, attributable, quotable claim per post. Generic advice does not get quoted
- [ ] Format: factual claim + specific evidence. "Moles eat 60-80% of their body weight daily in earthworms" not "Moles eat a lot of worms"
- [ ] Attribute claims to sources by name (WSU Extension, WDFW, company data), and link out to at least one Tier 1 authority anchor for the cluster per `authority-strategy.md` Section 2
- [ ] Verified brand facts: 219+ five-star Google reviews · nearly 5,000 properties served · three locations (Seattle, Tacoma, Enumclaw) · 92+ communities across 6 counties · Spencer's 15+ years personal experience, kept distinct from the 2017 founding
- [ ] Never "WA's #1". Never an I-713 compliance claim
- [ ] Any statistic that reaches client-facing output carries a confidence label: [P] primary source, [S] named study, [U] unverified

### 8. Local Signals (for local content)
- [ ] City/county/region names appear naturally in content
- [ ] **Every city-oriented answer block carries something only true of that place** — local species, soil and drainage, named neighborhoods, an actual job done there, a city-specific review. A generic answer with the city name swapped in is not a local answer
- [ ] Doorway test: strip the city name from the title, H1 and body. If what remains is indistinguishable from another city page, it fails. The 2026 failure mode is silent suppression, not a manual action, so nothing in Search Console will warn you
- [ ] Service area referenced with specific coverage details

### 9. Homograph Guard (blocking)
- [ ] "Mole" never appears in the title, H1, any H2 or the first paragraph without a disambiguating token **in the same sentence**: lawn, yard, turf, ground, burrow, tunnel, molehill, trapping, pest, *Scapanus*
- [ ] The skin-mole sense dominates the training distribution, so this is popularity bias, not just ambiguity — the retrieved chunk has to carry the signal itself
- [ ] Checked before the humanizer runs and again after it
- [ ] Every post mentioning moles links to the canonical disambiguation page

### 10. Freshness and Authorship
- [ ] Named author byline — the hook for `Person` schema at seed time
- [ ] Review date set 12 months out
- [ ] `dateModified` reflects real content change. A substantive update means at least one new fact, source or example per major section — never a timestamp bump on unchanged copy
- [ ] AI-cited content is 25.7% fresher on average; 65% of AI bot hits target past-year content

---

## What Gets Retrieved

Answer engines retrieve passages, not pages. Structures that survive being lifted out of context are the ones that get quoted.

| Structure | How it is used | Priority |
|-----------|---------------|----------|
| BLUF answer block | The direct answer to the head query | Highest |
| Self-contained H2 answer blocks | Fan-out sub-query answers — the AI Mode retrieval unit | Highest |
| FAQ Q&A pairs | Direct extraction for question-shaped queries. Content shape only, no schema deliverable | High |
| Comparison tables | Side-by-side answers for "vs" queries | High |
| Ranked lists | Listicles are ~21% of all citations, the single most-cited format | High |
| Numbered steps | Step-by-step answers for "how to" queries | High |
| Definitions | Direct definitions for "what is" queries | High |
| Attributed statistics | Cited facts, with the brand named | High |
| Paired video | Multi-format content is cited more, and YouTube mentions are the strongest single correlate of AI visibility (0.737) | High for visual topics |

---

## Anti-Patterns

- **Vague language:** "Many experts agree" — name the expert or cite the source
- **Buried answers:** Making the reader scroll past context before getting the answer
- **Hedged compound sentences:** Two clauses joined by a qualifier do not survive extraction. One fact per sentence in every answer block
- **Opinion without evidence:** "We believe..." — state facts, let the reader draw conclusions
- **Keyword stuffing:** Repeating the primary keyword unnaturally. Google names over-focusing on keyword variations as unnecessary
- **Word-count padding:** Length is not a lever. Word count correlates 0.04 with AI Overview citation across 174,048 pages. Cover the fan-out and stop
- **No unique data:** If everything in the post is available on 10 other sites, there is no reason to cite this one. Distinctiveness is Google's own headline advice
- **Undisambiguated "mole":** The single highest-cost failure here. It routes the passage to dermatology

## Things That Do Not Work — Do Not Build Them

| Claim | Status |
|---|---|
| Schema markup increases AI citations | No measurable effect. Ahrefs difference-in-differences test, 1,885 treated pages against 4,000 matched controls: −4.6% AI Overviews, +2.4% AI Mode, +2.2% ChatGPT. Google: "Structured data isn't required for generative AI search." Schema is for entity binding, correctness and rich results — never presented as a citation lever |
| llms.txt improves AI visibility | Debunked. Google says it is not required and will neither harm nor help. No engine documents consuming it. Do not build one; if one exists, leave it |
| Content must be chunked into tiny pieces | Debunked as a requirement. Answer-first structure helps retrieval as a preference, not a rule |
| Longer content gets cited more | Debunked. Correlation 0.04 |
| FAQPage schema earns rich results | Removed by Google, 2026-05 to 2026-08 |
| AEO and GEO need separate tactics from SEO | Rejected by Google, which names "AEO/GEO hacks" and AI-specific rewriting as unnecessary |
| Manufactured brand mentions raise AI visibility | Debunked. Google warns against inauthentic mentions and says spam systems already filter them |

---

## Answer-First vs Traditional SEO

Answer-first structure doesn't replace SEO — it layers on top, and for AI Overviews it depends on it, since 97% of AI Overviews cite a source from the organic top 20.

| Traditional SEO | What the answer surfaces add |
|----------------|-------------|
| Title tag with keyword | 40–60 word self-contained BLUF that answers the query |
| Meta description | Fan-out coverage across the sub-questions the query generates |
| Header hierarchy | Question-format H2s, each with its own 40–80 word answer block |
| Internal links | Links that make every fan-out sub-answer reachable in one hop |
| Alt text on images | Attributed, quotable statistics with the brand named |
| Mobile-friendly | Freshness with a real substantive update, and a named author |

Do both. Always.
