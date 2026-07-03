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
  a knowledge base into published authority content that ranks in both
  traditional search and AI search (GEO). Also use when the user references
  the content plan or asks "what should I write next" in a content context.
  Does NOT trigger for sales copy, landing pages, or ad copy (use
  mkt-copywriting). Does NOT trigger for repurposing existing content
  into social posts (use mkt-content-repurposing). Does NOT trigger for
  UGC scripts or video scripts (use mkt-ugc-scripts).
---

# Authority Content

Educational content that answers the searcher's question better than anything else on the internet. Not a sales pitch with information sprinkled in — genuine expertise published to build trust and rank.

The approach: answer the question immediately (BLUF), go deep with proprietary knowledge the reader can't get elsewhere, structure it so AI search engines can parse and cite it, and mention the brand naturally as the authority — never as a pitch.

## Outcome

A complete blog post saved to `projects/mkt-authority-content/{YYYY-MM-DD}_{slug}.md`, ready for CMS publishing. Includes: title, meta description, BLUF paragraph, structured sections, comparison tables where relevant, FAQ section (schema-ready), and internal link suggestions.

## Context Needs

| File | Load level | How it shapes the output |
|------|-----------|--------------------------|
| `brand_context/mole-knowledge-base.md` (or equivalent) | full | Primary fact source. Proprietary knowledge > generic content. Every claim should trace back here. |
| `brand_context/voice-profile.md` | tone + rhythm | Match the brand's actual voice — not generic "professional blog" tone |
| `brand_context/positioning.md` | summary | Know the brand's angle so authority positioning is consistent |
| `brand_context/icp.md` | full | Know the reader: awareness level, pain points, language they use, what they've already tried |
| `context/learnings.md` | `## mkt-authority-content` | Apply feedback from previous runs before writing |

Load what exists. Proceed without what doesn't — the skill works standalone, just less personalized.

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|-----------------|------------|
| `tool-humanizer` | Required | Strips AI patterns from output before saving | Output may read as AI-generated — always run humanizer |
| `str-ai-seo` | Optional | GEO optimization overlay (citation signals, schema hints) | Built-in GEO structure covers the basics |
| `ops-cms-content` | Optional | Pushes finished post to Payload CMS | Save to disk, push manually |
| `mkt-content-repurposing` | Optional | Atomizes post into social content | Run separately after publishing |

## Skill Relationships

**Upstream:** `mkt-brand-voice` (produces voice-profile.md), `mkt-icp` (produces icp.md), `mkt-positioning` (produces positioning.md)
**Downstream:** `tool-humanizer` (post-processing), `mkt-content-repurposing` (social atomization), `ops-cms-content` (CMS publishing), `str-ai-seo` (GEO overlay)
**No trigger conflicts:** `mkt-copywriting` handles sales copy (landing pages, ads). This skill handles informational/educational content. The boundary is intent: if it's trying to convert, use copywriting. If it's trying to educate and build authority, use this.

## Step 1: Gather Inputs

Determine what to write. The user provides some or all of:

- **Topic/title** — what the post is about
- **Primary keyword** — the main search query this targets
- **Secondary keywords** — additional queries to weave in (optional)
- **Content type** — one of: `guide` | `myth-bust` | `comparison` | `how-to` | `seasonal` | `local` (optional — infer from topic if not stated)
- **Target word count** — default 1500-2500 words

If the user just says "write about [topic]", infer the rest from the content plan (`projects/briefs/mole-content-authority/content-plan.md`) and search intent map if they exist.

## Step 2: Load Context

Read these files in this order:

1. `context/learnings.md` — the `## mkt-authority-content` section. Apply any rules or feedback before writing.
2. `brand_context/mole-knowledge-base.md` (or whatever knowledge base exists) — this is the fact source. Extract every relevant fact for the chosen topic.
3. `brand_context/voice-profile.md` — tone and rhythm to match.
4. `brand_context/icp.md` — who the reader is, what they know, what language they use.
5. `brand_context/positioning.md` — the brand angle (summary only).

If a knowledge base file doesn't exist, tell the user: "No knowledge base found at `brand_context/`. I can write from general knowledge, but the content will be stronger with proprietary facts. Want to proceed or build the knowledge base first?"

## Step 3: Research Gap Check

Before writing, check what already exists:

1. Scan `projects/mkt-authority-content/` for posts covering similar topics — don't duplicate.
2. Check `blog-data.ts` or equivalent for existing site content on this topic.
3. If overlap exists, tell the user and suggest either: (a) update the existing post, or (b) take a different angle.

## Step 4: Write the Post

Read `references/content-type-templates.md` for the template matching the content type. Then write the post following these principles:

**BLUF (Bottom Line Up Front):** The very first paragraph answers the searcher's question directly. No throat-clearing, no "in this article we'll explore." The reader gets the answer in 2-3 sentences, then chooses to read deeper.

**Knowledge base first:** Every factual claim should come from the knowledge base. Proprietary facts (species data, pricing, service details, local conditions) are what make this content uncopyable. Generic information that anyone could Google is filler — minimize it.

**Structure for humans AND machines:** Use H2/H3 headings that match search queries. Include comparison tables, numbered lists, and clear definitions. These structures are what AI search engines extract and cite. Read `references/geo-optimization.md` for the full checklist.

**Natural brand integration:** The brand appears as the knowledgeable authority, not the subject of a sales pitch. "Got Moles uses chemical-free trapping methods" is a fact. "Call Got Moles today for the best service!" is a pitch. Facts belong in authority content. Pitches don't.

**Honest about limits:** If DIY works in some cases, say so. If there's no permanent fix, say so. Readers trust content that doesn't oversell. The brand's honesty IS the selling point.

**Content type shapes structure.** Read the template for the specific type, but here's the gist:

- **Guide:** Comprehensive overview. BLUF → context → detailed sections → FAQ. Longest format.
- **Myth-bust:** State the myth → why people believe it → the real answer with evidence → what to do instead. Punchy, direct.
- **Comparison:** Side-by-side analysis with table. BLUF → comparison criteria → detailed breakdown → verdict → FAQ.
- **How-to:** Step-by-step instructions. BLUF → what you need → numbered steps → tips → FAQ.
- **Seasonal:** Time-specific advice. BLUF → what's happening this season → what it means for the reader → what to do → FAQ.
- **Local:** Area-specific content. BLUF → local conditions → why it matters here → local service info → FAQ.

## Step 5: Add FAQ Section

Every post ends with 3-5 FAQs. These serve two purposes:

1. **Schema-ready content** — formatted for FAQ structured data that appears in Google's rich results.
2. **GEO citation targets** — short, definitive Q&A pairs that AI search engines extract and cite directly.

Write FAQs that match real search queries from the search intent map. Each answer should be 2-4 sentences — enough to be useful, short enough to be quoted by AI.

Format:
```markdown
## Frequently Asked Questions

### [Question that matches a real search query]?

[Direct answer in 2-4 sentences. Include a specific fact or number.]

### [Next question]?

[Direct answer.]
```

## Step 6: Add Metadata

After the post body, add a metadata block:

```markdown
---
**Meta description:** [150-160 characters. Include primary keyword. Compelling enough to click.]
**Primary keyword:** [the main search target]
**Secondary keywords:** [2-5 additional queries this post answers]
**Content type:** [guide | myth-bust | comparison | how-to | seasonal | local]
**Internal links:** [Suggest 2-4 related posts from the content plan or existing content]
**Word count:** [actual count]
---
```

## Step 7: Humanizer Gate

Run the completed post through `tool-humanizer` in pipeline mode before saving. This is not optional — every post must pass through the humanizer.

Use `deep` mode if `brand_context/voice-profile.md` exists, `standard` mode otherwise.

If the humanizer score delta is > 2 points, show the user the before/after summary. Otherwise, apply silently.

## Step 8: Save Output

Always save output to disk. This is not optional.

Save to: `projects/mkt-authority-content/{YYYY-MM-DD}_{slug}.md`

Create the folder if it doesn't exist. After saving, show the user the full absolute file path so they can click it directly.

## Step 9: Offer Next Steps

After saving, offer (don't push):

1. **Push to CMS** — "Want me to push this to the site via `ops-cms-content`?"
2. **Atomize for social** — "Want me to create social posts from this via `mkt-content-repurposing`?"
3. **GEO overlay** — "Want me to run the `str-ai-seo` audit on this for AI search optimization?"
4. **Push to Notion** — "Want me to push this to Notion for Spencer's review?"
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

## Self-Update

If the user flags an issue with the output — wrong approach, bad format, missing context, incorrect tone — update the `## Rules` section in this SKILL.md immediately with the correction. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake. Date every new rule.
