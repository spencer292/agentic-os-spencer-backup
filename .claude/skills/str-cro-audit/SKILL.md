---
name: str-cro-audit
description: >
  Evaluate any web page or landing page for conversion effectiveness using the LIFT model,
  ResearchXL heuristics, and ICP-driven analysis. Produces a scored audit with prioritised
  recommendations. Use this skill whenever the user mentions: "audit this page", "review
  this landing page", "why isn't this converting", "CRO audit", "conversion review",
  "what's wrong with this page", "how can I improve conversions", "page review", "heuristic
  analysis", "is this page working", "rate this page", "score this page", "conversion check",
  "why are people bouncing", "optimise this page". Also use after building or redesigning
  any page — every page should pass a CRO audit before going live. Do NOT use for: designing
  page structure (that's viz-page-architect), building a design system (that's viz-design-system),
  writing copy (that's mkt-copywriting), or generating components (that's viz-component-library).
---

# CRO Audit

Evaluate any page for conversion effectiveness using the LIFT model, ResearchXL heuristics,
and ICP-driven analysis. Every score is evidence-based. Every finding includes a specific,
actionable recommendation. The audit produces a scored report with prioritised fixes.

## Outcome

**Produces:** Audit report saved to
`projects/str-cro-audit/{YYYY-MM-DD}_{page-name}-audit.md`.

Always save output to disk. This is not optional. After saving, show the user the full
absolute file path so they can click it directly.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/design-system.md` | principles + CTA colors | Verify design system compliance |
| `brand_context/icp.md` | full | ICP-specific conversion expectations |
| `brand_context/positioning.md` | summary | Verify message alignment |
| `context/learnings.md` | `## str-cro-audit` section | Past audit patterns |

## Skill Relationships

**Upstream (reads from):**
- `viz-design-system` — design tokens and standards to audit against
- `viz-page-architect` — page blueprint to compare actual implementation against
- `viz-component-library` — component specs to verify correct usage

**Downstream (feeds into):**
- `mkt-copywriting` — audit findings inform copy rewrites
- Build tasks — audit findings inform redesign work

**Trigger boundaries:**
- "write new copy" → `mkt-copywriting` (not this skill)
- "redesign this page" → `viz-page-architect` + `viz-component-library` (not this skill)
- "build a design system" → `viz-design-system` (not this skill)

## Step 1: Load Context

Read the files listed in Context Needs. Extract:

- **From design system:** CTA colors, typography scale, spacing tokens, contrast rules.
  These become the standards to audit against.
- **From ICP:** Scepticism level, decision-making style, device habits, pain points,
  language patterns. Use the ICP's name in recommendations.
- **From positioning:** Primary angle, key differentiator. Check if the page communicates
  the positioning clearly.
- **From learnings:** Any previous audit feedback or patterns.

Show a brief status:
- Context loaded: "Auditing for [ICP summary]. Design system: [available/not available]."
- Nothing found: "No brand context yet. I'll produce a solid audit using universal CRO
  principles. We can make it brand-specific anytime."

## Step 2: Capture the Page

**This step requires user input before proceeding.**

Get the page to audit. Accepted inputs:
- **URL** — use `tool-firecrawl-scraper` (if FIRECRAWL_API_KEY available) or WebFetch to
  capture page content
- **Markdown content** — pasted directly or from a file path
- **Page blueprint** — from `viz-page-architect` output (audit against the spec)
- **Screenshot** — describe what you see and audit visually

Read `references/lift-model.md` for the full scoring framework before proceeding.

## Step 3: Five-Second Test

Before any detailed analysis, simulate a first-time visitor:

- Can you identify **WHO this is for** in 5 seconds?
- Can you identify **WHAT they offer** in 5 seconds?
- Can you identify **WHAT TO DO NEXT** in 5 seconds?

Score: Pass/Fail for each. If all three fail, flag as critical priority. This test alone
predicts more conversion variance than any other single factor.

## Step 3.5: AIO / Zero-Click Awareness

Before running the LIFT audit, identify whether the page's target query triggers an AI Overview.

- Look up the page's primary keyword in `brand_context/target-keywords.md`
- Run a live SERP check (incognito, target geo) for that keyword
- If AI Overview present → the page may receive fewer clicks regardless of CRO quality (zero-click). Flag in audit.
- For pages targeting AIO-prone queries, the audit recommendation should pivot: traditional CRO still matters for the clicks that do land, but **answer-extractability for the AI engine** (Speakable schema, FAQPage with verified facts, stat blocks, dateModified) becomes co-equal priority. Reference `str-ai-seo-local` Step 3.5 for the AEO pattern checklist.

This step prevents the audit recommending a CRO fix that won't move the needle because traffic itself is being intercepted by AIO.

## Step 4: LIFT Model Audit

Score each factor 1-10 with specific evidence. Reference `references/lift-model.md` for
detailed scoring rubrics.

1. **Value Proposition (weight: 30%)** — Is the value prop immediately clear? Specific or
   generic? Does it match the ICP's language?

2. **Relevance (weight: 20%)** — Does the page match likely visitor intent? Message match
   with traffic sources?

3. **Clarity (weight: 20%)** — Visual hierarchy clear? Copy plain and specific? Can you
   understand the offer without reading everything?

4. **Urgency (weight: 10%)** — Is there a reason to act now? Internal urgency (pain
   acknowledgment) vs external (deadlines)?

5. **Anxiety (weight: 10%)** — What fears need addressing? Are trust signals present at
   decision points?

6. **Distraction (weight: 10%)** — What elements compete with the primary goal? Multiple
   CTAs? Navigation pulling attention?

## Step 5: Technical and Design Audit

**Mobile-first audit order.** Local-service traffic is 60%+ mobile in 2026. Run the mobile audit first; validate desktop only after mobile passes. A page that converts on mobile and loses on desktop is far cheaper to fix than the inverse.

Check against the design system and performance standards:

- **Core Web Vitals (2026 targets)** — LCP ≤ 2.5s (largest contentful paint), **INP ≤ 200ms** (interaction to next paint, replaced FID March 2024), CLS ≤ 0.1 (cumulative layout shift). Use PageSpeed Insights mobile + desktop. Failing INP is the most common 2026 miss — heavy JS bundles or third-party tags push it over 200ms even when LCP/CLS pass.
- **Typography compliance** — sizes, weights, hierarchy from design-system.md
- **Color compliance** — brand colors, contrast ratios
- **Spacing compliance** — 8pt grid, section gaps
- **Mobile readiness** — touch targets (48px min), thumb zone CTA placement, responsive layout (no horizontal scroll), tap-target spacing (8px+ between targets)
- **Performance indicators** — image optimisation (WebP, explicit dimensions, hero `fetchpriority="high"`, below-fold `loading="lazy"`), font loading (`font-display: swap`), page weight (<1MB target per page)
- **Accessibility** — contrast (4.5:1 body / 3:1 large), alt text, heading hierarchy (no skipped levels), focus states, prefers-reduced-motion respected

Reference `references/audit-checklist.md` for the full checklist.

## Step 6: Social Proof Audit

Evaluate trust signals:

- Type and quality of social proof present
- Placement relative to decision points (near CTA vs buried in footer)
- Specificity of testimonials (named with outcomes vs generic praise)
- Trust signal count (1-3 types optimal. 7+ types hurts credibility by ~8%)
- Missing proof opportunities

## Step 7: CTA Audit

Evaluate calls to action:

- Number of CTAs per viewport (should be 1 primary)
- CTA copy (benefit-oriented verb vs "Submit" or "Click here")
- Visual contrast (squint test. Does the CTA stand out?)
- Micro-copy presence (adds 10-20% click lift)
- Mobile CTA accessibility (thumb zone placement, sticky behaviour)

**Click-to-call CTA primacy (local-service mobile rule).** For any local-service page with phone-led conversion (Got Moles default), the primary mobile CTA is `tel:` not form fill. Audit:

- Is there a `tel:` link rendered as a tap-target on mobile? (NOT just plain text phone number)
- Is the click-to-call button in the thumb zone (bottom 25% of viewport)?
- Is there a sticky bottom-bar CTA on mobile with "Call now" + phone number visible?
- Is the tap target ≥48px and clearly contrasted?
- On desktop, is the phone number prominent in the header + above-fold + CTA blocks?

A local-service page without click-to-call as the mobile primary CTA is **the #1 fix regardless of other LIFT scores**. Per `feedback_check_obvious_first.md`: this beats any persuasion or design improvement.

## Step 7.5: Form Friction Audit (when page has form)

Skip if no form. If form present:

- **Field count** — every additional field reduces completion ~10-15%. Aim for ≤5 fields. For lead-gen, name + email + phone is often enough; everything else can be progressive (collected after lead capture).
- **Floating labels** — 2026 best practice. Placeholder-only fails accessibility (screen readers + cognitive load when typing).
- **Conditional logic** — show fields only when relevant. Don't render the full form for users who haven't engaged.
- **Escape-hatch button** — for high-friction forms ("get a quote"), add a low-commitment alternative: "Not ready yet? See pricing first" or "Just text me when you're available." Reduces bounce on hesitant users.
- **Error message tone** — specific + non-blaming. "Phone number missing" not "Invalid input." Inline validation, not on-submit reveal.
- **Success state** — what happens after submit? "We'll call you within 2 business days" beats "Form submitted." Specific next-step + timeline builds trust.
- **Privacy reassurance** — micro-copy under email field: "We never share your details." Reduces drop-off by 5-10%.

For Got Moles specifically: the primary mobile path is click-to-call, not form. Forms are secondary (e.g. ScoreApp quiz, contact form) and should follow these rules but with the assumption that desktop traffic is the majority.

## Step 8: Score and Prioritise

Generate the overall score and prioritised recommendations.

**Score format:**

```
## Audit Score: X/100

| Factor | Score | Weight | Weighted |
|--------|-------|--------|----------|
| Value Proposition | X/10 | 30% | X |
| Relevance | X/10 | 20% | X |
| Clarity | X/10 | 20% | X |
| Urgency | X/10 | 10% | X |
| Anxiety | X/10 | 10% | X |
| Distraction | X/10 | 10% | X |
```

Prioritise recommendations using the PXL framework:
- Is it above the fold? (higher priority)
- Does it address a known user complaint? (higher priority)
- Is it based on research data? (higher confidence)
- How easy is it to implement? (affects sequencing)

Categorise each recommendation:
- **Fix now** — obvious improvement, easy to implement
- **Test** — strong hypothesis, needs A/B validation
- **Investigate** — problem identified, solution unclear
- **Monitor** — potential issue, needs data

## Step 9: Save and Present

1. **Save the audit** to `projects/str-cro-audit/{YYYY-MM-DD}_{page-name}-audit.md`

   Include YAML frontmatter:
   ```yaml
   ---
   page: [page-name]
   url: [url-if-applicable]
   date: [YYYY-MM-DD]
   score: [X/100]
   status: draft
   ---
   ```

2. **Show the user** the full absolute file path.
3. **Push to Notion for review** — Notion is the Got Moles review mechanism; create the page under the Got Moles project via the Notion MCP (`mcp__claude_ai_Notion__notion-create-pages`).

3. **Present the summary:** Overall score, five-second test results, top 3 recommendations.

4. **Ask for feedback:** "How does this audit land? Anything I missed or scored wrong?"

5. **Log feedback** to `context/learnings.md` under `## str-cro-audit`.

6. **Suggest next steps** based on findings: copy rewrites (mkt-copywriting), page
   restructure (viz-page-architect), component fixes (viz-component-library).

## Got Moles-Specific Patterns

For Got Moles audits, these patterns OVERRIDE generic CRO defaults where they conflict. Apply on every Got Moles page:

| Pattern | What to check | Why |
|---|---|---|
| **GBP rating widget near CTA** | Visible "219+ five-star Google reviews" + star burst near every primary CTA — not buried in footer | Star ratings near decision points lift conversion 8-15% per BrightLocal 2026 |
| **Named technician photo** | Real Spencer / Cory photo (not stock) on About + service pages, near credentials | Faces near credentials lift trust + AI E-E-A-T signal |
| **Before/after photo placement** | Real mole-damage before/after near service-page CTA — not in gallery section | Visible field result is the highest-converting trust signal for service trades |
| **Service-area / response-time widget** | "Inspection within 2 business days in [city]" — geo-personalised on city pages | Local urgency + service-area depth signal |
| **Hallucination-proof verified-fact callouts** | Founded 2017, ~5,000 properties, $100/$450 pricing, **92+ communities across 6 counties**, veteran-owned visible above the fold | Per `target-keywords.md` v1.1 canonical_facts. AI engines crawling these pages will state correct facts in answers. Pixelmojo flagged 4 high-sev hallucinations 2026-05-08 — verified-fact callouts are part of the correction |
| **Click-to-call primary on mobile** | `tel:` button in thumb zone + sticky bottom bar | Local-service mobile traffic 60%+; phone wins over form |
| **No "WA's #1" claim** | Audit copy for unsubstantiated superiority | Per CLAUDE.md client-specific instructions — banned until Spencer provides evidence |
| **Posture A on trap mechanism** | No body-gripping / scissor / harpoon / spear / kill / lethal language | Per `feedback_got_moles_posture_a_silent_mechanism.md` — WA AG opinion + WAC + RCW 77.15 |
| **Guarantee scope discipline** | Guarantee language ONLY on TMCP service page (One-Month Eradication programme); not on About / Home / brand pages | Per `feedback_guarantee_scope.md` — programme-specific, not sitewide |

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- 2026-05-08: Phase 0 currency audit — added Step 3.5 AIO/zero-click awareness (recommend AEO patterns when target query triggers AI Overview); Core Web Vitals 2026 targets (LCP/INP/CLS, INP replaced FID); mobile-first audit order; click-to-call CTA primacy rule (local-service); Step 7.5 Form Friction Audit (field count / floating labels / escape-hatch / error tone / success state / privacy reassurance); Got Moles-specific patterns section (GBP widget, named technician, before/after, hallucination-proof verified facts, no "WA's #1", Posture A, guarantee scope).

- Never score based on personal aesthetic preference. Every score must cite evidence.
- Use ICP language in recommendations — name the personas from brand_context/icp.md ("Jennifer would..." / "the Thompsons would..."), never "users would...".
- The audit must be actionable. Every finding includes a specific recommendation.
- Prioritise clarity over persuasion in recommendations (matches LIFT model hierarchy).
- Zero em dashes. Full stops create rhythm.
- Compare against design-system.md standards when evaluating visual elements.
- If the page has no clear primary CTA, flag as the #1 issue regardless of other scores.
- If no design system exists, audit against universal web standards (WCAG AA, 16px+ body
  text, 48px touch targets, 4.5:1 contrast ratio).

## Self-Update

If the user flags an issue with the output — wrong scoring, missing considerations,
bad format, incorrect assumptions — update the `## Rules` section in this SKILL.md
immediately with the correction and today's date. Do not just log it to learnings. Fix
the skill so it does not repeat the mistake.

Format: `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`
