---
name: str-ux-research
description: >
  Discovery and UX research for a website or product build. Four modes: client discovery
  interview, evidence review of analytics and the live site, user interviews with
  jobs-to-be-done synthesis, and a content inventory audit. Produces one research brief that
  page architecture, keyword strategy and copywriting all read from. Use when the user says:
  "discovery", "discovery phase", "kick off the website project", "research before we design",
  "stakeholder interview", "discovery call", "user research", "user interviews", "jobs to be
  done", "audit the current site", "content audit", "content inventory", "competitor teardown",
  "what should this site do", "review our analytics before the rebuild". Do NOT use for: page
  structure (viz-page-architect), keyword research (str-keyword-strategy), conversion audit of
  one page (str-cro-audit), audience profile (mkt-icp), or writing copy (mkt-copywriting).
---

# UX Research and Discovery

The discovery phase decides whether a site build succeeds. This skill runs the four things a
good agency does before anyone draws a box: interview the client, read the evidence, talk to
users, and audit what already exists. Everything it writes is either evidence or a labelled
hypothesis. There is no third category.

## Outcome

**Produces:** `projects/str-ux-research/{YYYY-MM-DD}_{client}-discovery.md`. Always save to disk,
then show the full absolute path. The brief contains business goals, ICP summary, top tasks,
conversion map, current-state findings with evidence, competitor teardown, content audit summary,
risks, open questions, and a recommended page set.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/icp.md` | full | Audience segments, pains, language. Read, do not rebuild |
| `brand_context/positioning.md` | summary | The angle the site must carry |
| `brand_context/voice-profile.md` | tone only | How the client talks about themselves |
| `brand_context/target-keywords.md` | summary if it exists | Existing demand map, avoids duplicate work |
| `context/learnings.md` | `## str-ux-research` section | Past discovery feedback |

Load what exists. Proceed without the rest and say what is missing in the brief.

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `mkt-icp` | Optional, upstream | Documented audience profile | Build an ICP summary from the discovery interview and label it hypothesis |
| `mkt-positioning` | Optional, upstream | Chosen angle and competitive frame | Derive a working angle from the interview and flag it unvalidated |
| `tool-firecrawl-scraper` | Optional | Crawl of the current site and competitor pages | Use WebFetch page by page, and say the crawl was partial |
| `tool-behaviour-analytics` | Optional | Clarity heatmaps, recordings, funnels | Rely on GA4 and Search Console, and record behaviour claims as hypotheses |
| `tool-humanizer` | Required for client-facing versions | Removes AI writing patterns | Do not send the brief to a client unhumanized |

## Skill Relationships

**Upstream (reads from):** `mkt-icp`, `mkt-positioning`, `mkt-brand-voice`.

**Downstream (feeds into):**
- `viz-page-architect` reads the recommended page set, top tasks and conversion map
- `str-keyword-strategy` reads the language bank, top tasks and content audit
- `mkt-copywriting` reads the language bank and the objection list
- `str-cro-audit` reads the current-state findings as the baseline to re-audit against

**Trigger boundaries:** "what sections does this page need" goes to `viz-page-architect`. "Find
keywords" goes to `str-keyword-strategy`. "Why is this page not converting" goes to
`str-cro-audit`. "Who is our customer" goes to `mkt-icp`.

## Step 1: Set Scope and Pick Modes

Ask what already exists and which modes to run. The four are independent and combine freely:

- **A. Discovery interview** with the client and stakeholders
- **B. Evidence review** of analytics, a live crawl, and a heuristic review
- **C. User interviews** and jobs-to-be-done synthesis
- **D. Content inventory and audit** of the current site

Default when the user just says "run discovery": A, B and D, with C offered and named as the
biggest gap if skipped. Never present a brief built without C as if it contained user research.
Read `references/discovery-method.md` before running any mode.

## Step 2: Mode A, Discovery Interview

Run the script in `references/discovery-interview.md`. Twenty questions across seven areas:
business model and money, goals and success measures, audiences, conversion definitions,
current-site pain, brand and content, constraints and technical reality.

Rules for the interview:
- Ask at most six questions per turn. Skip anything `brand_context/` answers, and say which.
- Push every vague answer once. "More leads" becomes "how many, of what type, from where".
- Capture the client's own words verbatim. Do not paraphrase them into marketing register.
- Where stakeholders disagree, record both positions rather than averaging them.
- Ask no timeline questions. Sequence work by dependency order and risk instead.

## Step 3: Mode B, Evidence Review

Three parts, all specified in `references/evidence-review.md`.

1. **Analytics.** GA4, Search Console and Clarity. Never state a number you were not given or did
   not pull. Record the property and date range next to every number.
2. **Live crawl.** `tool-firecrawl-scraper`, or WebFetch the top pages. Capture title, H1,
   primary call to action, whether the page says who it is for, and proof present.
3. **Heuristic review.** The ten Nielsen Norman heuristics plus a mobile and accessibility pass,
   against WCAG 2.2 AA and the Core Web Vitals thresholds in the reference.

Where behaviour data is missing, say so. A missing funnel is a finding, not a blocker.

## Step 4: Mode C, User Interviews and Synthesis

Use the jobs-to-be-done switch interview guide in `references/user-interviews.md`. Six to eight
interviews with recent buyers or recent non-buyers is enough to see patterns.

Per interview, capture the timeline from first dissatisfaction to switch, the struggling moment,
push and pull forces, anxieties, habits, the underlying job, and exact language. Then roll up
across interviews into top tasks, objections, a language bank and a jobs statement per segment.

**Hard rule.** If interviews have not happened, every audience statement in the brief is prefixed
`Hypothesis:` and the header says user research is outstanding. Never write a quote, a percentage
or a persona detail that no one said.

## Step 5: Mode D, Content Inventory and Audit

Build the inventory using `references/content-audit.md`. One row per URL, merged from the crawl,
the sitemap, Search Console and GA4.

| URL | Page type | Purpose | Primary keyword | Sessions | Conversions | Last updated | Verdict | Notes |

Verdicts are keep, rewrite, merge, cut or redirect. Every merge and cut names the target URL it
folds into, so redirects can be written later. Summarise by verdict count and by the traffic and
conversions at risk.

## Step 6: Competitor Teardown

Three to five competitors the client actually loses to, not the biggest names in the sector. Ask
the client who they lose to, and include the do-nothing alternative as a row. Fill the table in
`references/competitor-teardown.md`: promise above the fold, who it is for, proof used, primary
and secondary conversion actions, pricing transparency, content depth, trust signals, and the one
thing they do better. End with a positioning gap statement in one sentence, meaning what nobody
in the set is claiming that this client can credibly claim. Where that contradicts
`brand_context/positioning.md`, flag it back to `mkt-positioning` rather than overriding it.

## Step 7: Five-Second Test and What Must Be True

Two framings that go into the brief verbatim.

**Five-second test.** On the current home page and the two highest-traffic pages, answer as a
first-time visitor: who is this for, what do they offer, what do I do next. Pass or fail each,
with the evidence you saw. Three fails is the top finding regardless of anything else.

**What must be true for this site to succeed.** Four to eight statements that must hold for the
recommended approach to work. Each is testable and names who can prove it, for example "buyers
compare at least two providers before enquiring, provable from the switch interviews".
Contradicted statements change the recommendation. Untested ones become the risk register.

## Step 8: Assemble and Save the Brief

Use the template in `references/research-brief.md`. Its eleven sections are in a fixed order
because downstream skills look for those headings by name. Then:

- Run `tool-humanizer` before any client-facing version. Deep mode when
  `brand_context/voice-profile.md` exists, standard otherwise.
- Save to `projects/str-ux-research/{YYYY-MM-DD}_{client}-discovery.md` with YAML frontmatter
  carrying client, date, modes_run, evidence_sources and status. Show the full absolute path.
- Present the top three findings, the recommended page set, and the open questions.
- Ask how the brief lands, and log the answer to `context/learnings.md` under `## str-ux-research`.

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- 2026-09-02: built for the web-design skill pack. Sources checked September 2026 and cited in
  `references/sources.md`.
- Never invent user data. No quote, statistic or persona detail without a named source. Where
  interviews have not happened, everything is prefixed `Hypothesis:`.
- Every number carries its source and its date range. An unsourced number is a defect.
- Never quote human time or effort estimates. Rank by impact, risk, dependency order and
  reversibility.
- Do not rebuild the ICP or the positioning. Read them, summarise them, and flag conflicts back
  to `mkt-icp` or `mkt-positioning`.
- Do not recommend a page set larger than the content audit and the top tasks support. Every
  recommended page names the task it serves.
- Zero em dashes. One idea per sentence.
- A missing evidence source is a finding to report, never a reason to guess.

## Self-Update

If the user flags an issue with the output, wrong questions, missed evidence, bad brief
structure, incorrect assumptions, add a dated entry to `## Rules` immediately in the format
`- {YYYY-MM-DD}: {what was wrong and the rule to prevent it}`. Do not just log it to learnings.
Fix the skill so it does not repeat the mistake.

## References

| File | Purpose |
|------|---------|
| `references/discovery-method.md` | What a 2026 discovery phase contains and how the modes fit together |
| `references/discovery-interview.md` | The 20-question client and stakeholder script |
| `references/evidence-review.md` | GA4, Search Console, Clarity, crawl and heuristic review method |
| `references/user-interviews.md` | Jobs-to-be-done switch interview guide and synthesis format |
| `references/content-audit.md` | Inventory columns and keep, rewrite, merge, cut rules |
| `references/competitor-teardown.md` | Teardown table and method |
| `references/research-brief.md` | The output template, section by section |
| `references/sources.md` | Every source cited, with URL and month checked |
