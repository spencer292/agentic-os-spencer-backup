---
name: str-question-harvester
description: >
  Discover what questions people are asking about your topics using SerpAPI
  People Also Ask data. Pulls PAA questions for seed keywords organised by
  pillar, clusters results, compares against existing FAQ content on your
  websites, and outputs a prioritised gap report. Runs on-demand or monthly
  via cron. Use this skill whenever the user wants to know what questions
  their audience is searching for, find FAQ content gaps, discover PAA
  opportunities, build a question bank, or understand what people ask about
  a topic -- even if they don't use the word "harvest".
  Triggers on: "question harvester", "what questions are people asking",
  "find questions", "question research", "PAA research", "harvest questions",
  "FAQ gaps", "question bank", "what should we answer", "content gaps",
  "what are homeowners asking", "what are people searching for".
  Does NOT trigger for: writing FAQ content (mkt-copywriting), optimizing
  existing content for AI citation (str-ai-seo), general trending research
  across social platforms (str-trending-research), or weekly content planning
  (str-linkedin-planner).
---

# Question Harvester

Discover what real people are asking about your topics. Uses SerpAPI to pull Google's "People Also Ask" questions for seed keywords organised by business pillar, clusters them, and compares against your existing FAQ content to find gaps worth filling.

The seed keywords are organised per service category so the output maps directly to the Got Moles content structure -- each category gets its own question set.

## Outcome

A question bank and gap report saved to `projects/str-question-harvester/{YYYY-MM-DD}_{business-slug}.md` containing:
- All PAA questions discovered, clustered by pillar/topic
- Gap analysis against existing website FAQ schema
- Prioritised list of unanswered questions worth creating content for
- Suggested content type per question (FAQ entry, blog post, LinkedIn post, video)
- Competitor sources appearing in PAA answers

Always save output to disk. This is not optional. After saving, show the user the full absolute file path so they can click it directly.

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| `brand_context/positioning.md` | summary | Understand what differentiates the brand -- prioritise questions where we have a unique angle |
| `brand_context/icp.md` | full | Know the audience's language, pain points, and search patterns for relevance scoring |
| `context/learnings.md` | `## str-question-harvester` section | Apply previous feedback before starting |

Load if they exist. Proceed without them if not -- the skill works standalone.

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|-----------------|------------|
| SerpAPI | Required for structured PAA | PAA question data from Google (`SERPAPI_API_KEY`, registered in the root env template) | Fall back to WebSearch-based PAA gathering: search each seed, note the People-Also-Ask questions visible in results. Reduced coverage, no source metadata — flag the report as fallback-mode |

## Skill Relationships

**Upstream:** None -- this is a primary research skill that generates its own data from SerpAPI.

**Downstream consumers:**
- `str-ai-seo` -- consumes the gap report to know which questions to optimize content for
- `mkt-authority-content` / `ops-blog-pipeline` -- consume discovered questions as blog/FAQ topics (questions homeowners are actually asking become content)
- `mkt-copywriting` -- uses gap questions as briefs for FAQ entries and blog posts

**Trigger conflicts:** Could overlap with `str-trending-research` on phrases like "what are people asking about X". The distinction: this skill pulls structured PAA data from Google search. `str-trending-research` pulls social discussion from Reddit/X. Different data sources, different outputs. Both can run on the same topic without conflict.

## Before You Start

1. **Check API key.** Read `.env` for `SERPAPI_API_KEY`. If missing:
   "I need a SerpAPI key to pull People Also Ask data. Sign up free at serpapi.com (250 searches/month free). Add `SERPAPI_API_KEY=your_key` to `.env`."

2. **Check for recent runs.** Look in `projects/str-question-harvester/` for a report from the last 30 days for the same business. If one exists: "I ran a harvest on {date} for {business}. Refresh it, or run for a different business?"

3. **Business:** this is the Got Moles client workspace — always Got Moles (seed keywords mapped to service categories in `references/seed-keywords.md`).

## Step 1: Load Context

Check `brand_context/` and load per the Context Needs table. Show a brief status:

- Positioning loaded: "Framing questions around '{angle}' -- will prioritise gaps where we have a unique take."
- ICP loaded: "Scoring relevance against {audience summary}."
- Nothing found: "No brand context yet. I'll produce a solid gap report -- we can make it brand-specific anytime."

Read `context/learnings.md` -> `## str-question-harvester` section. Apply any previous corrections.

## Step 2: Load Seed Keywords

Read `references/seed-keywords.md` for the full keyword sets organised by pillar.

Keywords are grouped per service category so each SerpAPI call maps to a specific content area — Got Moles: Removal & Control, Signs & Damage, DIY vs Professional, Cost & Value, Safety (pets/kids/chemical-free), Prevention & Seasonal, Commercial (~24 core keywords; 12-keyword quick set flagged in the file).

If the user provides custom keywords, merge them into the relevant pillar group or create a new group.

Each keyword becomes one SerpAPI call. Budget: ~12 (quick set) to ~24 (full set) searches per run against the 100/month free tier — monthly cron on the quick set leaves comfortable buffer.

## Step 3: Pull PAA Questions from SerpAPI

For each seed keyword, call the SerpAPI JSON API using WebFetch:

```
GET https://serpapi.com/search.json?q={keyword}&engine=google&gl=us&hl=en&api_key={key}
```

Parameters:
- `engine=google` -- Google search
- `gl=us` -- US results (Got Moles market: Washington State)
- `hl=en` -- English
- Extract the `related_questions` array from the JSON response

The response JSON contains several useful fields. Extract all of them:

**Primary: `related_questions` array** (People Also Ask):
- `question` -- the PAA question text
- `snippet` -- Google's answer snippet
- `title` -- source page title
- `link` -- source URL

**Secondary: `related_searches` array** (keyword expansion):
- `query` -- related search term Google suggests
- Useful for discovering new seed keywords even when PAA is empty

**Tertiary: `discussions_and_forums` array** (real conversations):
- `title` -- discussion title
- `link` -- URL to the thread
- `source` -- platform (Reddit, Quora, etc.)
- Useful for validating ICP language and finding question phrasing

Not every keyword generates PAA results -- Google sometimes shows discussions or videos instead. When `related_questions` is absent, log the keyword as "no PAA" and still capture `related_searches` and `discussions_and_forums` as secondary data.

Tag each question with the pillar of the seed keyword that generated it.

Save all raw data before deduplication.

**Rate limiting:** SerpAPI free tier allows 50 searches/hour. If running all keywords in one batch, add a 2-second delay between calls to stay safe.

**Error handling:** If a call fails (rate limit, 401 auth error, timeout), log the failed keyword and continue with the rest. Report all failures at the end so the user can decide whether to retry.

## Step 4: Deduplicate and Cluster

1. **Deduplicate** -- remove exact and near-duplicate questions (e.g., "how to get rid of moles" and "how do I get rid of moles" are the same question). Keep the version with the best snippet.
2. **Cluster by pillar/topic** -- questions inherit the pillar of the seed keyword that found them. If a question appeared under multiple pillars, assign it to the most relevant one and note the cross-pillar appearance.
   - Got Moles categories: Removal & Control, Signs & Damage, DIY vs Professional, Cost & Value, Safety, Prevention & Seasonal, Commercial
   - Got Moles categories: Prevention, Removal, Commercial, DIY vs Pro, Cost, Signs/Damage, General
3. **Count frequency** -- questions that appear across multiple seed keywords are higher priority signals.
4. **Flag question type** -- How/What/Why/Can/Does/Should/Is. This shapes the content format recommendation later (How -> step-by-step/video, What -> definition/FAQ, Why -> blog post, Can/Does -> direct FAQ answer).

## Step 5: Pull Existing FAQ Content

Scan the relevant website source code for existing FAQ content and schema:

**Got Moles site** (`projects/briefs/website-rebuild-rebrand/site/src/` — path relative to this client workspace root):
- Grep for `faqSchema`, `FAQBlock`, question/answer arrays
- Check: FAQ page, service page FAQs, city page FAQs, blog post FAQs
- Extract every question currently answered with its page location

Build a complete list of questions already answered on the site. This is the baseline for gap analysis.

## Step 6: Gap Analysis

Compare each discovered PAA question against existing FAQ content:

- **Already answered** -- question semantically matches an existing FAQ entry (mark as covered, note which page)
- **Partially answered** -- the topic is covered but this specific angle or phrasing isn't (mark as opportunity)
- **Not answered** -- no existing content addresses this question (mark as gap)

## Step 7: Prioritise Gaps

Score each gap on five factors:

| Factor | Weight | How to assess |
|--------|--------|---------------|
| **Frequency** | 3x | Appeared in PAA results for how many seed keywords? More = stronger signal |
| **ICP relevance** | 3x | Would the ICP (brand_context/icp.md — Jennifer & Mike Thompson, WA homeowners with mole damage) actually search this? |
| **Content depth available** | 2x | Do we have expertise, knowledge base content, or source material to answer this well? |
| **Competitive gap** | 1x | Are the current PAA source pages weak (thin content, outdated, generic)? |
| **Content type fit** | 1x | Does this naturally suit FAQ, blog, video, or LinkedIn? Clear fit = higher score |

Rank all gaps by total score. Top 20 form the priority list.

## Step 8: Save the Report

Save to `projects/str-question-harvester/{YYYY-MM-DD}_{business-slug}.md`. Always save output to disk. This is not optional.

Report structure -- use this exact template:

```markdown
# Question Harvest: {Business Name}
Date: {YYYY-MM-DD}
Seed keywords: {count} | PAA questions found: {count} | Unique after dedup: {count}
API calls used: {count} / 250 monthly budget

## Summary
{2-3 sentences: what the harvest revealed, biggest gaps, any surprises}

## Priority Gaps (Top 20)

| # | Question | Pillar | Frequency | Score | Suggested Format |
|---|----------|--------|-----------|-------|-----------------|
| 1 | {question} | {pillar} | {n} seeds | {score} | FAQ / Blog / LinkedIn / Video |

## Full Question Bank by Pillar

### {Pillar Name} ({n} questions, {n} gaps)
#### Answered
- {question} -- covered on {page}

#### Gaps
- {question} (frequency: {n}, score: {score})

### {Next Pillar}
...

## Competitor Sources
{Notable domains/pages that appear frequently in PAA answers -- these are who you're competing with for AI citations}

## Keyword Expansion (from related_searches)
{New keyword ideas discovered via Google's related searches. Candidates for adding to seed-keywords.md next month.}

## Real Conversations (from discussions_and_forums)
{Reddit/Quora threads where homeowners are actively discussing these problems. Useful for ICP language validation and content hooks.}

## Recommended Actions
1. Add top 5 gaps to FAQ page with FAQPage schema markup
2. Write blog posts for gaps that need depth (800-1200 words for GEO)
3. Use question language in LinkedIn hooks this week (hand to str-linkedin-planner)
4. Add promising related_searches to seed-keywords.md for next month
5. {Any business-specific recommendations}
```

Show the user the full absolute file path after saving.

## Step 9: Collect Feedback

Present to the user:
- Summary stats (questions found, gaps identified, API calls used)
- Top 10 gaps in a table
- Pillar distribution (which pillars have the most gaps)
- "Any of these surprise you? Any topics I should add or remove from the seed keywords?"

Log feedback to `context/learnings.md` under `## str-question-harvester` with date.

## Cron Mode

When triggered by cron (monthly schedule) rather than interactively:
1. Run for both businesses automatically
2. Save reports silently
3. Compare against previous month's report if one exists -- flag new questions that appeared and questions that dropped off
4. Add a `## Month-over-Month Changes` section showing new questions, dropped questions, and movement in priority scores

## Rules

*Updated automatically when the user flags issues. Read before every run.*

## Self-Update

If the user flags an issue with the output -- wrong keywords, bad clustering, missed questions, irrelevant results, wrong pillar mapping -- update the `## Rules` section in this SKILL.md immediately with the correction and today's date. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake.

## Troubleshooting

**SerpAPI returns 401:** API key is wrong or expired. Check `.env` for `SERPAPI_API_KEY`. Free tier keys don't expire but must be correct.

**No `related_questions` in response:** Not every Google query generates PAA results. Log the keyword and move on. If many keywords return nothing, the queries may be too niche -- try broader terms.

**Rate limited (429):** Free tier is 50 searches/hour. If running a full batch, the 2-second delay should prevent this. If it still happens, split the run into two batches with a 10-minute gap.

**Existing FAQ scan finds nothing:** The website may not have FAQ content yet. This is fine -- every discovered question becomes a gap by default. The report is even more valuable in this case.

**Budget concerns:** At 46 keywords per run and 250/month free, you can run twice a month with budget to spare. If the user wants more keywords, suggest upgrading to the $25/month tier (1,000 searches).
