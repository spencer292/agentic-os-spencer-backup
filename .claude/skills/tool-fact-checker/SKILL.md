---
name: tool-fact-checker
version: 1.0.0
description: >
  Systematic fact verification and misinformation identification using evidence-based analysis.
  Use when: verifying claims in content, checking facts before publishing, identifying misinformation,
  evaluating source credibility, or when user asks to "fact check", "verify this", "is this true",
  "check these claims". Also triggers when any skill pipeline needs claim validation before output.
  Supports both standalone verification and inline pipeline mode (receives structured claims, returns verdicts).
  Do NOT trigger for opinion pieces, subjective preferences, or "what do you think" questions.
---

# Fact Checker

Systematic claim verification using evidence-based analysis. Works standalone or as a pipeline stage that other skills call to validate claims before publishing.


## Paths

Read `skill-pack/config/sys-config.md` → `## Paths` section before any path-dependent step. It resolves `{decoupled_base}`, `{env_file}`, `{brand_context}`, and `{projects_base}` to absolute paths set by the installer. Substitute these placeholders wherever they appear below.

## Outcome

- **Standalone mode:** A fact-check report saved to `{projects_base}/tool-fact-checker/{YYYY-MM-DD}/{topic}.md`
- **Pipeline mode:** Returns a structured verdict object (claim, rating, evidence, corrected text) to the calling skill

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## tool-fact-checker` | Past verification feedback |

## Skill Relationships

- **Upstream:** Any content-producing skill can feed claims into this skill
- **Downstream:** Content skills consume verdicts to correct or flag claims before publishing
- **Pipeline integration:** Skills like `00-youtube-to-ebook` call this skill on extracted claims before finalizing output

## Step 1: Identify Claims

Extract specific factual assertions from the input. For each claim:

1. Separate fact from opinion — opinions are not fact-checkable
2. Note any implicit claims (unstated assumptions presented as fact)
3. Identify measurable or verifiable aspects
4. Flag statistics, dates, names, and causal claims as high-priority

In pipeline mode, claims arrive pre-extracted. Skip to Step 2.

## Step 2: Determine Required Evidence

For each claim, establish:

- What would prove this claim true?
- What would disprove it?
- Which sources would be authoritative for this domain?
- Is this verifiable at all, or inherently subjective?

## Step 3: Gather and Evaluate Evidence

Use WebSearch and WebFetch to find authoritative sources. Prioritize by credibility:

1. **Peer-reviewed studies** — highest credibility
2. **Official statistics** (government, institutional) — authoritative data
3. **Reputable journalism** (fact-checked outlets) — verified reporting
4. **Domain expert statements** — qualified opinion in their field
5. **General news sites** — cross-reference with other sources
6. **Social media / blogs** — lowest credibility, verify independently

For each source: note publication date, author credentials, potential bias, and whether the source is primary or secondary.

## Step 4: Rate Each Claim

Apply one of these verdicts:

| Rating | Meaning |
|--------|---------|
| **TRUE** | Accurate and supported by reliable evidence |
| **MOSTLY TRUE** | Accurate but missing important context or minor details wrong |
| **MIXED** | Contains both true and false elements |
| **MOSTLY FALSE** | Misleading or largely inaccurate |
| **FALSE** | Demonstrably wrong |
| **UNVERIFIABLE** | Cannot be confirmed or denied with available evidence |

Read `references/verification-patterns.md` for common manipulation patterns to watch for (statistical cherry-picking, context removal, false equivalences, logical fallacies).

## Step 5: Produce Report

**Standalone mode** — save full report to `{projects_base}/tool-fact-checker/{YYYY-MM-DD}/{topic}.md`:

```markdown
# Fact Check: {Topic}

## Summary
{X} claims checked | {Y} verified | {Z} flagged

## Claims

### Claim 1: "{exact statement}"
**Verdict: {RATING}**

**Analysis:** {Why this rating}

**Evidence:**
- {Key supporting or refuting evidence with source}

**Context:** {Important nuance, why this matters}

**Correct Information:** {If false/misleading, the accurate version}

---
{Repeat for each claim}

## Sources
{Numbered list with credibility notes}
```

**Pipeline mode** — return structured data to the calling skill:

```json
{
  "claims": [
    {
      "text": "exact claim",
      "verdict": "TRUE|MOSTLY_TRUE|MIXED|MOSTLY_FALSE|FALSE|UNVERIFIABLE",
      "confidence": "high|medium|low",
      "evidence_summary": "one-line summary",
      "corrected_text": "null or corrected version",
      "sources": ["source 1", "source 2"]
    }
  ],
  "overall_reliability": "high|medium|low",
  "flagged_count": 0
}
```

Always save output to disk. This is not optional. After saving, show the user the full absolute file path.

## Step 6: Collect Feedback

After delivering the report, ask: "How did this land? Any claims I got wrong or missed?"

Log feedback to `context/learnings.md` under `## tool-fact-checker` with date and context.

## Rules

- Claims must be evaluated individually, not as a group
- Never rate opinion as TRUE or FALSE — mark it as not fact-checkable
- Always provide the corrected version when a claim is FALSE or MOSTLY FALSE
- In pipeline mode, return structured data, not prose
- Source recency matters — prefer sources from within the last 2 years for current-affairs claims

## Self-Update

If the user flags an issue with the output — wrong verdict, missed claim, bad source evaluation — update the `## Rules` section in this SKILL.md immediately with the correction.
