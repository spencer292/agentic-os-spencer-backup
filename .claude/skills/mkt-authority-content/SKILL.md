---
name: mkt-authority-content
description: >
  Produce SEO/GEO-optimized informational blog posts and authority content
  from a knowledge base. Triggers on: "write a blog post about", "authority
  content", "informational article", "write about [mole/pest topic]",
  "blog post for", "content from knowledge base", "write an article",
  "educational content about", "create a guide about", "myth-bust article",
  "how-to post about", "seasonal content", "FAQ content for". Use this
  skill whenever someone wants long-form educational content that positions
  the brand as an expert — not sales copy. This is the skill for turning
  a knowledge base into published authority content that earns citation on
  classic organic, Google AI Overviews and AI Mode, and the answer engines.
  Also use when the user references the content plan or asks "what should I
  write next" in a content context. Does NOT trigger for sales copy, landing
  pages or ad copy — no copywriting skill is installed in this workspace, so
  write those directly. Does NOT trigger for the full publish pipeline
  (image, CMS seed, Notion) — that is `ops-blog-pipeline`, which calls this
  skill for methodology.
---

# Authority Content

Educational content that answers the searcher's question better than anything else on the internet. Not a sales pitch with information sprinkled in — genuine expertise published to build trust and rank.

The approach: answer the question immediately (BLUF), go deep with proprietary knowledge the reader can't get elsewhere, structure it so a retrieval system can lift a self-contained answer out of any section, and mention the brand naturally as the authority — never as a pitch.

**State of search.** This skill does not restate landscape claims. The canonical, sourced state of search as of 2026-09-02 lives in `../../.claude/skills/str-ai-seo/references/search-landscape-2026-09.md`, relative to this client folder (`clients/got-moles/`), which is where skills are run from. Read it before making any claim about how AI search behaves. The five numbers this skill actually acts on:

- Word count correlates 0.04 with AI Overview citation. Length is not a lever.
- AI-cited content is 25.7% fresher on average; 65% of AI bot hits target content published in the past year.
- Listicles are the single most-cited format at ~21% of citations; YouTube is the leading non-corporate citation source.
- Niche brands appear in ~11% of relevant AI answers. That is the honest baseline for a local service business.
- Informational and hybrid local queries fire an AI Overview ~92–97% of the time; explicitly transactional local queries fire a Local Pack ~93% of the time.

Everything else — surface definitions, crawler policy, schema stance, measurement — comes from that file.

## Outcome

A complete blog post saved to `projects/mkt-authority-content/{YYYY-MM-DD}_{slug}.md`, ready for CMS publishing, then pushed to Notion for Spencer's review. Includes: title, meta description, BLUF answer block, question-format or direct-topic H2s each opening with a self-contained answer, comparison tables where relevant, at least one citable attributable statement, an FAQ section, an author byline, freshness fields, and internal link suggestions.

## Context Needs

| File | Load level | How it shapes the output |
|------|-----------|--------------------------|
| `brand_context/target-keywords.md` | **REQUIRED** | The keyword/intent/page-mapping foundation. Supplies the post's cluster, primary keyword, recommended H1, secondary keywords, surface tag, fan-out sub-queries, the Brand-Disambiguation Rules 1–5 and the queries-to-avoid list. Do not write without it. |
| `brand_context/authority-strategy.md` | strongly recommended | Section 2 gives the per-cluster authority anchors to cite and link out to. Section 9 gives the entity-graph facts to reinforce. Without it the post ships with no outbound authority link and `str-onpage-audit` marks it down. |
| `brand_context/mole-knowledge-base.md` (or equivalent) | full | Primary fact source. Proprietary knowledge > generic content. Every claim should trace back here. |
| `brand_context/voice-profile.md` | tone + rhythm | Match the brand's actual voice — not generic "professional blog" tone |
| `brand_context/positioning.md` | summary | Know the brand's angle so authority positioning is consistent |
| `brand_context/icp.md` | full | Know the reader: awareness level, pain points, language they use, what they've already tried |
| latest `projects/str-question-harvester/{YYYY-MM-DD}_*.md` | gap section | Real questions people ask, already de-duplicated against live FAQ coverage. The primary source of H2 candidates. Use the newest file; if none exists, say so and fall back to the fan-out sub-queries in `target-keywords.md`. |
| `../../.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (root skill) | reference | The state-of-search contract. Any AI-search claim in the output must agree with it. |
| `context/learnings.md` | `## mkt-authority-content` | Apply feedback from previous runs before writing |

`target-keywords.md` is required. Everything else: load what exists, proceed without what doesn't. If `target-keywords.md` is missing, stop and tell the user — writing blind to the disambiguation rules is how a post ships that every downstream audit then fails.

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|-----------------|------------|
| `tool-humanizer` | Required | Strips AI patterns from output before saving | Output may read as AI-generated — always run humanizer |
| `str-ai-seo-local` | Optional | Local GEO/AEO audit of the published post | Built-in structure covers the basics |
| `ops-cms-content` | Optional | Pushes finished post to Payload CMS | Save to disk, push manually |
| `mkt-youtube-optimizer` | Optional | Packages the paired YouTube asset for a visual topic | Brief the video in the post's metadata block and hand it off manually |
| Notion MCP | Required for review | `mcp__claude_ai_Notion__notion-create-pages` — Notion is the client review mechanism | Save locally and flag to the user that Spencer cannot review it |

## Skill Relationships

**Upstream:** `str-keyword-strategy` (produces `target-keywords.md` — the required input), `str-authority-strategy` (produces `authority-strategy.md`), `str-question-harvester` (produces the question gap report). `voice-profile.md`, `icp.md` and `positioning.md` are maintained directly in `brand_context/`; no producer skill for them is installed here.
**Downstream:** `tool-humanizer` (post-processing), `ops-blog-pipeline` (calls this skill's methodology for the full publish pipeline), `ops-cms-content` (CMS publishing), `str-onpage-audit` and `str-internal-links` (grade the published post against the same foundation docs this skill reads).
**No trigger conflicts:** this skill handles informational and educational content. Sales copy, landing pages and ads are written directly — no copywriting skill is installed in this workspace. The boundary is intent: if it is trying to convert, it is not this skill.

## Step 1: Look Up the Brief in `target-keywords.md`

The user supplies the topic. **Everything else is looked up, not asked.** Read `brand_context/target-keywords.md` and pull:

| What | Where in `target-keywords.md` |
|------|-------------------------------|
| **Cluster** — one of the seven ids: `mole-control`, `biology`, `safety`, `cost-value`, `seasonal`, `diy-vs-pro`, `location-services` | the `## Cluster: {id}` section whose Queries table carries the topic, or the Tier 3 blog-post row |
| **Primary keyword** | the `Primary keyword` column of the Tier 3 blog-post row, or the highest-priority matching row in the cluster's Queries table |
| **Recommended H1 / title construction** | the Disambiguation Rules plus the row's `Notes` column (e.g. Rule 3: service-page H1s default to `Mole Control`, not `Mole Removal`) |
| **Secondary keywords** | sibling rows in the same cluster assigned to the same page, plus the cluster's Coverage gaps |
| **Surface tag** | the surface column on the query row — Local Pack, AI Overviews, AI Mode, classic organic. If the column is absent, derive it: explicitly transactional local intent → Local Pack; informational and hybrid → AI Overviews plus AI Mode |
| **Fan-out sub-queries** | the fan-out column on the query row. If absent, take them from the latest `projects/str-question-harvester/` report, which now emits a per-primary-keyword fan-out set |
| **Disambiguation rules** | `## Brand-Disambiguation Strategy` → Rules 1–5. Rule 1 is blocking: the title and H1 must carry an unambiguous lawn signal |
| **Canonical facts** | the `canonical_facts` block in the frontmatter — communities, counties, clients, founded, founder, pricing |

Only ask the user for the content type if the cluster and topic do not imply one: `guide` | `myth-bust` | `comparison` | `how-to` | `seasonal` | `local`.

**No target word count.** Word count correlates 0.04 with AI Overview citation. The length target is replaced by fan-out coverage — see Step 4.

Report the looked-up brief back before writing, so a wrong cluster match gets caught early:

```
Topic:      Do mole repellents work?
Cluster:    diy-vs-pro
Primary KW: do mole repellents work
Surface:    AI Overviews + AI Mode (informational)
H1:         Do Mole Repellents Work on Lawn Moles? (Rule 1 lawn signal: "lawn")
Fan-out:    ultrasonic devices · castor oil · repellent plants · what works instead ·
            how long until moles return · cost of repellents vs professional trapping
Type:       myth-bust
```

If the topic is not in `target-keywords.md` at all, say so plainly and offer to either map it into the foundation first (via `str-keyword-strategy`) or write it as an off-map post with the cluster and keyword chosen explicitly by the user. Do not guess silently.

## Step 1b: Queries-to-Avoid Pre-Flight

Blocking. Before any writing starts, check the chosen primary keyword, secondary keywords, H1 and every planned H2 against `## Queries to AVOID (never target these)` in `target-keywords.md` — six clusters: dermatology/skin, cosmetic DIY, medical/cancer, pop culture/food, adjacent animals when generic, and body-gripping product searches.

If any planned target lands in an avoid cluster, stop and substitute from the inverse rule in the same section (`lawn`, `yard`, `garden`, `tunnel`, `mound`, `molehill`, `exterminator`, `trapper`, `trapping service`, `Washington`, `professional`, `pest`, `Talpidae`). Report the substitution. Never write the post first and fix the targeting afterwards.

The body-gripping cluster is a policy line, not a preference: Posture A is silent on mechanism. No body-gripping, scissor, harpoon, spike, spear, kill or lethal language anywhere in the post, including anchor text.

## Step 2: Load Context

Read these files in this order:

1. `context/learnings.md` — the `## mkt-authority-content` section. Apply any rules or feedback before writing.
2. `brand_context/target-keywords.md` — already read in Step 1. Keep the disambiguation rules and canonical facts in view for the whole write.
3. `brand_context/authority-strategy.md` — Section 2 for the cluster's authority anchors (the sources to cite and link out to), Section 9 for the entity facts to reinforce.
4. `brand_context/mole-knowledge-base.md` (or whatever knowledge base exists) — this is the fact source. Extract every relevant fact for the chosen topic.
5. `brand_context/voice-profile.md` — tone and rhythm to match.
6. `brand_context/icp.md` — who the reader is, what they know, what language they use.
7. `brand_context/positioning.md` — the brand angle (summary only).

If a knowledge base file doesn't exist, tell the user: "No knowledge base found at `brand_context/`. I can write from general knowledge, but the content will be stronger with proprietary facts. Want to proceed or build the knowledge base first?"

## Step 3: Research Gap Check

Before writing, check what already exists and what is being asked:

1. **Read the latest question-harvester gap report** — the newest `projects/str-question-harvester/{YYYY-MM-DD}_*.md`. Its gap section lists real questions with no on-site answer, already clustered. These are the highest-value H2 candidates for this post: they are demand-verified and known to be uncovered. Pull every gap question that belongs to this post's cluster and topic, and fold them into the H2 set alongside the fan-out sub-queries from Step 1. If no report exists, say so and rely on the fan-out set alone.
2. Scan `projects/mkt-authority-content/` for posts covering similar topics — don't duplicate.
3. Check `blog-data.ts` or equivalent for existing site content on this topic.
4. If overlap exists, tell the user and suggest either: (a) update the existing post — which now counts as a refresh, see Step 4's freshness rule — or (b) take a different angle.

## Step 4: Write the Post

Read `references/content-type-templates.md` for the template matching the content type. Then write the post following these principles:

**BLUF (Bottom Line Up Front) — 40–60 words, self-contained, one fact per sentence.** The very first block answers the searcher's question directly. No throat-clearing, no "in this article we'll explore." The test: lift the block out of the page with no surrounding context and it still reads as a complete, correct answer. One fact per sentence — no hedging, no compound clauses. Hedged compound sentences do not get quoted.

**Question-format or direct-topic H2s, each with its own answer block.** Every H2 is either a question someone actually types ("How deep do moles dig?") or a direct topic label, never an abstract section name ("Depth Considerations"). Immediately under each H2 comes a **40–80 word self-contained answer**, then the depth. Same test as the BLUF: the answer block must survive being lifted out. The depth beneath it can be as long as the material justifies.

**No word-count minimums or targets.** Word count correlates 0.04 with AI Overview citation. The coverage standard is the **fan-out set**: does the post answer the sub-questions a query fan-out would generate for its primary keyword? Take the fan-out list from Step 1 and the gap questions from Step 3, and check every one is either answered in an H2 answer block, answered in the FAQ, or deliberately out of scope. Report the coverage in the metadata block. A short post that covers the fan-out beats a long one that doesn't.

**Homograph rule (blocking).** "Mole" never appears in the title, H1, any H2 or the first paragraph without a disambiguating token in the same sentence: lawn, yard, turf, ground, burrow, tunnel, molehill, trapping, pest, *Scapanus*. This is Rule 1 from `target-keywords.md` applied at write time. Google's AI Overviews collapse ambiguous mole queries to dermatology; the disambiguating token in the retrieved chunk is the defense. Step 7 blocks the humanizer on this check.

**At least one citable, attributable, specific statement per post.** Generic advice does not get quoted. Every post carries at least one claim that is specific enough, and attributed clearly enough, that an answer engine can lift it with the brand named. Use a number, a named local condition, or a named method. The verified brand facts available:

| Fact | Exact phrasing |
|---|---|
| Reviews | "219+ five-star Google reviews" — never a rounded or different number |
| Clients | "nearly 5,000 properties served" |
| Locations | three Google Business Profiles: Seattle, Tacoma, Enumclaw |
| Coverage | "92+ communities across 6 counties" (King, Pierce, Snohomish, Thurston, Kitsap, Lewis) |
| Founder experience | Spencer Hill's "15+ years" is his **personal** experience — always kept distinct from the company's 2017 founding |
| Pricing | TMCP $100/month; OMP $450 flat + $150 setup; Commercial custom-quoted |

Never write "WA's #1" — unsubstantiated. Never claim Initiative 713 (I-713) compliance. Third-party facts (WSU Extension, WDFW, species data) are cited by name and organization, per `authority-strategy.md` Section 2 — at least one outbound link to a Tier 1 authority anchor for the post's cluster.

**Local specificity in any city-oriented answer block.** A generic answer with the city name swapped in is not a local answer. If a post targets a city or names one, its answer blocks carry something only true of that place: local mole species, soil and drainage conditions, named neighborhoods, an actual job done there, a city-specific review. Engines cite chunks that name the place and mean it.

**Knowledge base first:** Every factual claim should come from the knowledge base. Proprietary facts (species data, pricing, service details, local conditions) are what make this content uncopyable. Generic information that anyone could Google is filler — minimize it.

**Structure for humans AND machines:** Use H2/H3 headings that match search queries. Include comparison tables, numbered lists, and clear definitions. Read `references/geo-optimization.md` for the full checklist.

**Author byline and E-E-A-T.** Every post carries a named author byline in the metadata block, defaulting to Spencer Hill unless the user names someone else. The byline is the hook for `Person` schema at seed time (`sameAs` spine per `authority-strategy.md` Section 9). Experience is the criterion that still rewards demonstrable first-hand work — where the post can say what was actually observed on a job, say it.

**Freshness.** Every post carries a review date and a substantive-update definition (see Step 6). AI-cited content is 25.7% fresher on average and 65% of AI bot hits target past-year content. A substantive update means at least one new fact, source or example in a major section — never a timestamp bump on unchanged copy.

**Pair with a YouTube asset where the topic is visual.** Mole damage, tunnel identification, trapping process and before/after are inherently visual, and YouTube mentions are the single strongest correlate of AI visibility across ChatGPT, AI Mode and AI Overviews. When the topic is visual, brief the video in the metadata block: working title, the one question it answers, and the shots needed. Route the packaging through `mkt-youtube-optimizer` if the user wants it produced now. This is a recommendation per post, not a gate — do not block the post on it.

**Natural brand integration:** The brand appears as the knowledgeable authority, not the subject of a sales pitch. "Got Moles uses chemical-free trapping methods" is a fact. "Call Got Moles today for the best service!" is a pitch. Facts belong in authority content. Pitches don't.

**Honest about limits:** If DIY works in some cases, say so. If there's no permanent fix, say so. Readers trust content that doesn't oversell. The brand's honesty IS the selling point.

**What not to build.** No llms.txt, no AI-specific Markdown mirror of the post, no separate "AI-optimized" rewrite pass. Google names all three as unnecessary. One well-structured page serves every surface.

**Content type shapes structure.** Read the template for the specific type, but here's the gist:

- **Guide:** Comprehensive overview. BLUF → context → detailed sections → FAQ. Widest fan-out coverage of the six types.
- **Myth-bust:** State the myth → why people believe it → the real answer with evidence → what to do instead. Punchy, direct.
- **Comparison:** Side-by-side analysis with table. BLUF → comparison criteria → detailed breakdown → verdict → FAQ.
- **How-to:** Step-by-step instructions. BLUF → what you need → numbered steps → tips → FAQ.
- **Seasonal:** Time-specific advice. BLUF → what's happening this season → what it means for the reader → what to do → FAQ.
- **Local:** Area-specific content. BLUF → local conditions → why it matters here → local service info → FAQ.

## Step 5: Add FAQ Section

Every post ends with 3-5 FAQs. The Q&A shape stays — short, definitive question-and-answer pairs are a good retrieval unit and they mop up fan-out sub-queries that did not earn a full H2.

**FAQPage schema is not a deliverable.** Google removed FAQ rich results between 2026-05 and 2026-08: the deprecation notice landed 2026-05-07, the search appearance and Rich Results Test support went in June 2026, and the Search Console API data went in August 2026. FAQPage markup is still a valid schema type and still earns nothing. Do not promise a rich result from it, do not add it as a deliverable, and **do not strip existing markup** from published pages — removing it is churn with no upside.

Source the questions from the question-harvester gap report and the fan-out set (Step 1 and Step 3), not from a static intent map. Each answer is self-contained in the same way an H2 answer block is: 40–80 words, one fact per sentence, correct with no surrounding context, at least one specific fact or number.

Format:
```markdown
## Frequently Asked Questions

### [Question that matches a real search query]?

[Self-contained 40-80 word answer. One fact per sentence. Include a specific fact or number.]

### [Next question]?

[Direct answer.]
```

## Step 6: Add Metadata

After the post body, add a metadata block:

```markdown
---
**Meta description:** [150-160 characters. Include primary keyword. Compelling enough to click.]
**Primary keyword:** [the main search target, from target-keywords.md]
**Cluster:** [mole-control | biology | safety | cost-value | seasonal | diy-vs-pro | location-services]
**Surface:** [Local Pack | AI Overviews | AI Mode | classic organic — the surface this post competes on]
**Secondary keywords:** [additional queries this post answers, from the same cluster]
**Fan-out coverage:** [each sub-query from Step 1 and Step 3 → answered in H2 / answered in FAQ / out of scope]
**Citable statement:** [quote the one specific attributable claim the post is built to be quoted on]
**Content type:** [guide | myth-bust | comparison | how-to | seasonal | local]
**Author:** [named byline — defaults to Spencer Hill. Hook for Person schema at seed time.]
**Published:** [YYYY-MM-DD]
**Review date:** [YYYY-MM-DD — 12 months out. On this date the post is re-checked for a substantive update.]
**Substantive update means:** at least one new fact, source or example in a major section, with `dateModified` reflecting that real change. A timestamp bump on unchanged copy is not an update.
**YouTube pairing:** [working title + the one question the video answers + shots needed — or "not a visual topic"]
**Internal links:** [2-4 related posts and the most relevant service page]
---
```

## Step 7: Homograph Guard, then Humanizer Gate

**Homograph guard — blocking, runs BEFORE the humanizer.** Scan the finished draft's title, H1, first paragraph and every H2. Reject any of them where the word "mole" (or "moles") appears without a disambiguating token in the same sentence: lawn, yard, turf, ground, burrow, tunnel, molehill, trapping, pest, *Scapanus*. Fix the offending line and re-scan. Do not pass a failing draft to the humanizer — the humanizer rewrites for rhythm and can quietly drop a disambiguating token, so the check has to pass before it runs and the rewritten lines get re-scanned after.

Report: `✓ Homograph guard passed — {N} headings + BLUF checked` or the exact failing lines.

**Humanizer.** Run the completed post through `tool-humanizer` in pipeline mode before saving. This is not optional — every post must pass through the humanizer.

Use `deep` mode if `brand_context/voice-profile.md` exists, `standard` mode otherwise.

If the humanizer score delta is > 2 points, show the user the before/after summary. Otherwise, apply silently.

After the humanizer runs, re-scan the rewritten title, H1, first paragraph and H2s against the homograph guard, and re-check that the BLUF is still 40–60 words and each H2 answer block still 40–80 words and self-contained.

## Step 8: Save Output

Always save output to disk. This is not optional.

Save to: `projects/mkt-authority-content/{YYYY-MM-DD}_{slug}.md`

Create the folder if it doesn't exist. After saving, show the user the full absolute file path so they can click it directly.

**Then push to Notion.** Notion is the client review mechanism — Spencer and the team review there, so a post that only exists on disk is not reviewable. Create the page with `mcp__claude_ai_Notion__notion-create-pages` under the Got Moles project parent. No script is needed; the MCP tools do it. Include the post body plus the metadata block so the reviewer sees the cluster, surface, citable statement and fan-out coverage alongside the copy. If the push fails, report the reason and tell the user the post is local-only until it is resolved.

## Step 9: Offer Next Steps

After saving, offer (don't push):

1. **Push to CMS** — "Want me to push this to the site via `ops-cms-content`?" (or run the whole publish chain through `ops-blog-pipeline`)
2. **On-page audit** — "Want me to score this against `str-onpage-audit` before it ships?"
3. **Local AI-visibility check** — "Want me to run `str-ai-seo-local` on the cluster this sits in?"
4. **YouTube pairing** — if the metadata block briefs a video: "Want me to package it via `mkt-youtube-optimizer`?"
5. **Next post** — "The content plan has [next topic] queued up. Want to write that next?"

## Step 10: Collect Feedback

Ask: "How did this land? Anything to adjust for next time?"

Log feedback to `context/learnings.md` under `## mkt-authority-content` with date and context. If the user flags an issue with the output — wrong approach, bad format, missing context, incorrect tone — update the `## Rules` section in this SKILL.md immediately with the correction.

## Rules

- 2026-04-07: US English spelling for all Got Moles content (color not colour, specialized not specialised)
- 2026-04-07: Never claim "WA's #1" — unsubstantiated
- 2026-04-07: Never mention Initiative 713 compliance
- 2026-04-07: "15+ years" = Spencer's personal experience, not company age (founded 2017)
- 2026-04-07: Always reference "219+ five-star Google reviews" not a round number
- 2026-04-07: Chemical-free positioning in every post — never mention Got Moles using any chemicals
- 2026-04-07: "Nearly 5,000 clients" — confirmed safe to publish
- 2026-04-07: Content is educational first. If it reads like a sales page, rewrite it.
- 2026-09-02: `brand_context/target-keywords.md` is a REQUIRED input, not optional context. Never ask the user for the primary keyword, cluster, H1 or secondary keywords — look them up. Writing blind to the Brand-Disambiguation Rules is how a post ships that every downstream audit then fails.
- 2026-09-02: BLUF is 40–60 words, self-contained, one fact per sentence. Each H2 answer block is 40–80 words on the same terms. This is the definition `str-onpage-audit` and `str-ai-seo-local` score against — the old "2-3 sentences" wording is superseded.
- 2026-09-02: No word-count targets or minimums anywhere. Word count correlates 0.04 with AI Overview citation (Ahrefs, 174,048 pages). Coverage is measured against the query fan-out set instead.
- 2026-09-02: Homograph guard is blocking and runs before the humanizer, then again after it. See Step 7.
- 2026-09-02: FAQPage schema is not a deliverable — FAQ rich results were removed 2026-05 to 2026-08. Keep FAQ content; never promise a rich result; never strip existing markup.
- 2026-09-02: Never present schema as an AI-citation lever in anything client-facing. The Ahrefs difference-in-differences test found no citation uplift.
- 2026-09-02: Every post carries a named author byline (default Spencer Hill), a review date and a substantive-update definition.
- 2026-09-02: Every deliverable goes to Notion. A post that only exists on disk cannot be reviewed by the client.
- 2026-09-02: Any statistic carried into client-facing output gets a confidence label — [P] primary source, [S] named study, [U] unverified — per the key in the root landscape file.

## Change log

### 2026-09-02

Aligned the skill to `../../.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` (relative to the client folder, which is where skills are run from), the canonical state of search as of that date, and to the live foundation docs.

- **Wired to the foundation.** `target-keywords.md` added as a REQUIRED context input and `authority-strategy.md` as strongly recommended. Step 1 was rewritten from "ask the user for the keywords" to a lookup of cluster, primary keyword, recommended H1, secondary keywords, surface tag and fan-out sub-queries. New Step 1b runs a blocking queries-to-avoid pre-flight against the six dermatology/pop-culture/DIY-product clusters. This closes the largest producer/consumer break in the client skill chain: content was being written blind to the disambiguation rules that every downstream auditor grades it against.
- **Consumes the question-harvester gap report.** Step 3 now reads the newest `projects/str-question-harvester/` report for H2 candidates. The harvester listed this skill as a downstream consumer; it was not one.
- **Answer-first spec replaced the old one.** BLUF is 40–60 words self-contained with one fact per sentence, matching `str-onpage-audit` and `str-ai-seo-local`; the previous "2-3 sentences" definition put every post at a built-in deficit against the audits. Question-format or direct-topic H2s each open with a 40–80 word self-contained answer.
- **Word-count targets removed** and replaced with fan-out coverage, reported in the metadata block. Correlation between word count and AI Overview citation is 0.04.
- **Homograph guard added as a blocking gate** before the humanizer and re-run after it, promoting Rule 1 of `target-keywords.md` from an audit finding to a write-time check.
- **Citable-statement requirement added** with the verified brand-fact table, plus a local-specificity rule for city-oriented answer blocks.
- **FAQ-rich-results promise deleted.** FAQ content stays; FAQPage schema is no longer a deliverable or a scored item. Existing markup is left alone.
- **E-E-A-T and freshness fields added** — author byline as the `Person` schema hook, review date, and a substantive-update definition that excludes timestamp bumps.
- **YouTube pairing added** as a per-post recommendation for visual topics, on the strength of the 0.737 correlation between YouTube mentions and AI visibility.
- **Notion push moved from an optional next step to part of Step 8**, per the client rule that Notion is the review mechanism.
- **Routing fixed.** `mkt-copywriting`, `mkt-content-repurposing`, `mkt-ugc-scripts`, `mkt-brand-voice`, `mkt-icp` and `mkt-positioning` are not installed in this workspace and were removed from the description, Dependencies and Skill Relationships. Replaced with the skills that exist or with plain instructions.
- **Both reference files updated** to match — see their own headers.

## Self-Update

If the user flags an issue with the output — wrong approach, bad format, missing context, incorrect tone — update the `## Rules` section in this SKILL.md immediately with the correction. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake. Date every new rule.
