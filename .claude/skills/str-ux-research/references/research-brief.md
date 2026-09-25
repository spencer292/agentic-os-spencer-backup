# Research brief template

Self-contained reference for `str-ux-research` Step 8. Section order is fixed. Downstream skills
look for these headings by name.

Save to `projects/str-ux-research/{YYYY-MM-DD}_{client}-discovery.md`.

---

```markdown
---
client: {name}
date: {YYYY-MM-DD}
modes_run: [discovery-interview, evidence-review, user-interviews, content-audit]
evidence_sources:
  - GA4, {property}, {date range}
  - Search Console, {property type}, {date range}
  - Clarity, {date range}
  - Crawl, {n} URLs, {date}
  - User interviews, {n} participants, {date range}
research_gaps: [what did not happen]
status: draft
---

# {Client} discovery brief

## Research status

State plainly which modes ran and which did not. If user interviews did not happen, say so here
in the first line and note that every audience statement below is a hypothesis.

## 1. Business goals and success measures

| Goal | How it is measured | Where the number lives today | Baseline |
|------|--------------------|------------------------------|----------|

Stakeholder conflicts, if any, with both positions stated and nobody's view averaged away.

## 2. ICP summary and language bank

Summary drawn from `brand_context/icp.md` where it exists, otherwise built here and labelled.
Do not rebuild the ICP. If discovery contradicts it, say so and flag it to `mkt-icp`.

**Language bank.** Verbatim phrases only, grouped by problem, desired outcome, and what they
call the category. Each line carries its source: interview, review, search query, support
ticket.

## 3. Top tasks

Ranked, seven or fewer. Each with the evidence behind its rank.

| Rank | Task, in the visitor's words | Audience | Evidence |
|------|------------------------------|----------|----------|

## 4. Conversion map

| Audience | Primary action | Secondary action for the not-yet-ready | Measured by | Tracked today |
|----------|----------------|----------------------------------------|-------------|---------------|

## 5. Current-state findings

Each finding: what was observed, where, and the source. Grouped as clarity, conversion,
content, technical, accessibility.

**Five-second test**

| Page | Who is it for | What do they offer | What do I do next | Evidence |
|------|---------------|--------------------|--------------------|---------|

Three fails on the home page is the top finding regardless of everything else in this section.

**Heuristic review.** Findings by severity, blocking first, each naming the page and the
heuristic.

**Performance.** Core Web Vitals field data against the thresholds, with the source and date.

## 6. Competitor teardown

The table from `competitor-teardown.md`, then three paragraphs: the category baseline, the
positioning gap in one sentence, and the proof gap.

## 7. Content audit summary

Counts by verdict, traffic and conversions at risk, redirect map size, content gaps against the
top-task list, and the three URLs the new site must not break. Full inventory goes in the
appendix.

## 8. What must be true

| Statement | Who can prove it | Status | Evidence or test |
|-----------|------------------|--------|------------------|

Status is proven, contradicted or untested. Untested statements become the research backlog.

## 9. Risks

Each risk names what it threatens and how it would be detected. Order by impact and by
dependency, never by duration.

## 10. Open questions

| Question | Who answers it | Blocks what |
|----------|----------------|-------------|

## 11. Recommended page set

| Page | Job | Audience | Top task served | Primary action | Source |
|------|-----|----------|-----------------|----------------|--------|

Source is keep, rewrite, merge, or new. Every new page names the task or the content gap that
justifies it. A page with no task named comes out.

## Appendix A: Content inventory

Full table, one row per URL.

## Appendix B: Interview notes

Per-interview synthesis fields. Quotes attributed to participant codes, never to names.
```

---

## Rules for filling it

- Every number carries its source and date range. No exceptions.
- Every audience claim without an interview behind it is prefixed `Hypothesis:`.
- No time or effort estimates anywhere. Sequence by dependency order, risk and reversibility.
- No em dashes.
- Run `tool-humanizer` before any client-facing version. Deep mode when
  `brand_context/voice-profile.md` exists, standard otherwise.
- The recommended page set is the handoff to `viz-page-architect`. Keep it complete and keep it
  honest about what is unproven.
