---
name: viz-page-architect
description: >
  Generate research-backed page blueprints with validated section ordering for any website page type.
  Produces section-by-section architecture with content requirements, CTA strategy, and conversion
  principles embedded in each section. Use this skill whenever the user mentions: "page structure",
  "page blueprint", "section order", "page layout", "wireframe the page", "what sections does this
  page need", "site architecture", "information architecture", "page template", "content hierarchy",
  "how should this page be structured", "design the page flow", "what goes on the homepage",
  "landing page structure", "site map". Also use when starting any page design or build — the
  architecture should exist before copy or components. Do NOT use for: generating a design system
  (that's viz-design-system), creating UI mockups (that's viz-stitch-design), writing copy
  (that's mkt-copywriting), or auditing an existing page (that's str-cro-audit).
---

# Page Architect

Generate research-backed page blueprints with validated section ordering for any website page
type. Every section has one job, a conversion principle behind it, and concrete content
requirements. The blueprint becomes the contract between copy, design, and build.

## Outcome

**Produces:** Page blueprint documents saved to
`projects/viz-page-architect/{YYYY-MM-DD}_{page-name}-blueprint.md`.

For full site architecture mode, also produces:
`projects/viz-page-architect/{YYYY-MM-DD}_site-architecture.md`

Always save output to disk. This is not optional. After saving, show the user the full
absolute file path so they can click it directly.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/design-system.md` | full | Design tokens, spacing, typography to reference |
| `brand_context/voice-profile.md` | tone + rhythm | Copy tone guidance for content requirements |
| `brand_context/positioning.md` | summary + anti-overwhelm | Positioning drives section strategy |
| `brand_context/icp.md` | full | ICP psychology drives section order and content density |
| `brand_context/assets.md` | photography style | Photography guidelines for image direction |
| `projects/briefs/website-rebuild-rebrand/photo-catalogue.md` | full (if exists) | Available Got Moles photo library for image selection |
| `context/learnings.md` | `## viz-page-architect` section | Past feedback |

## Skill Relationships

**Upstream (reads from):**
- `viz-design-system` — design tokens, spacing, typography inform section specs
- `mkt-brand-voice` — voice energy and rhythm inform content requirements
- `mkt-positioning` — positioning angle drives section strategy and proof hierarchy
- `mkt-icp` — ICP psychology is the primary driver of section order and density

**Downstream (feeds into):**
- `mkt-copywriting` — reads blueprints to write section-by-section copy
- Any build task — developers use the blueprint as the implementation spec

**Trigger boundaries:**
- "write copy for this page" → `mkt-copywriting` (not this skill)
- "design system" or "design tokens" → `viz-design-system` (not this skill)
- "audit this page" or "CRO audit" → `str-cro-audit` (not this skill)
- "UI mockup" or "screen design" → `viz-stitch-design` (not this skill)

## Before You Start

**Mode detection:**
- If the user asks about a single page → **Single page blueprint** mode
- If the user asks about the full site, navigation, or site map → **Full site architecture** mode

**Full site mode:** Generate the site map first (navigation structure, page hierarchy, user
journeys), then blueprint each page individually. Save the site map as a separate deliverable.

**Single page mode:** Ask which page type (or detect from context), then generate the blueprint.

**Reusability:** This skill works for any brand, not just one. It reads whatever ICP, voice,
and positioning exist in `brand_context/` and derives architecture decisions from them.

## Step 1: Load Context

Read the files listed in Context Needs. Extract:

- **From ICP:** Time pressure, scepticism level, device habits, emotional state on arrival,
  decision-making style, what overwhelms them, what builds trust
- **From voice:** Tone spectrum, rhythm, formality level. This shapes content requirements
  per section (punchy vs flowing, formal vs conversational)
- **From positioning:** Primary angle, anti-overwhelm principle, competitive framing.
  Positioning drives which sections get emphasis and which stay minimal
- **From design system:** Spacing tokens, typography scale, color semantics, motion rules.
  Reference these in section specs so the blueprint is buildable
- **From learnings:** Any previous feedback on page architectures

Show a brief status:
- Context loaded: "Building for [ICP summary]. Positioning: [angle]. Design system: [available/not available]."
- Nothing found: "No brand context yet. I'll produce a solid blueprint. We can make it brand-specific anytime."

## Step 2: Determine Page Type

**This step requires user input before proceeding.**

Present page type options or confirm what the user wants. Page types this skill handles:

| Page type | When to use |
|-----------|------------|
| Homepage | The front door. Answers who, what, why, proof, next step in 5 seconds |
| About / Founder | Origin story, credibility, human connection |
| Service / Programme | What you offer, who it's for, what they get |
| Pricing | Value framing, tier comparison, objection handling |
| Book / Product landing | Single product showcase with buy CTA |
| Blog / Resource hub | Content discovery, category navigation, newsletter capture |
| Contact | Form, expectations, alternative methods |
| Landing page (paid) | Stripped, no nav, single CTA, message-matched to ad |
| Landing page (organic) | SEO-optimised, full nav, 1000-1500 words |
| FAQ | Grouped questions, schema markup, objection handling |
| Podcast hub | Show info, episode archive, subscribe CTAs |
| Quiz / Assessment | Lead capture via interactive engagement |

Ask or confirm the page type. If the user's request maps clearly to one type, confirm it
and proceed. If ambiguous, present the options.

## Step 3: Generate Section Blueprint

Read `references/page-templates.md` for the validated section order for the chosen page type.

Generate the blueprint with these details for EVERY section:

### Per-section specification:

```markdown
## Section N: [Section Name]

**Job:** [One sentence. What problem this section solves in the visitor's decision process.]

**Content requirements:**
- [What copy goes here — headline, subhead, body, bullets, etc.]
- [What media goes here — images, video, icons, etc.]
- [Estimated word count: N-N words]

**CTA strategy:** [Primary / Secondary / None]
- [If primary: button text guidance, benefit framing, friction reducers]
- [If secondary: visual subordination, alternative commitment level]

**Social proof:** [What type, if any]
- [Testimonial with specific result / Logo bar / Metric / Case study link / None]
- [Why this type of proof at this point in the decision process]

**Conversion principle:** [Which LIFT model factor this section serves]
- [Relevance / Clarity / Urgency / Anxiety reduction / Distraction removal]

**Mobile considerations:**
- [Section order changes, if any]
- [Content truncation or progressive disclosure rules]
- [CTA placement in thumb zone]

**Image direction:**
- [What image this section needs and WHY it works for the ICP]
- [Source: photo library reference / generate with viz-nano-banana / needs shooting]
- [Treatment: crop ratio, overlay, color grading, alt text guidance]
- [ICP signal: what does this image communicate to the ICP personas in brand_context/icp.md?]
- [Performance: preload/lazy-load, format, responsive srcset needs]

**Design system references:**
- [Spacing tokens to use above/below this section]
- [Typography scale for headings and body in this section]
- [Background color / surface level]
```

Ensure every section has exactly ONE job. If a section tries to do two things, split it.

## Step 4: Define User Journey Context

Read `references/user-journey-patterns.md` for journey mapping frameworks.

For the page being architected, define:

1. **Entry points** — Where do visitors come from when they land on this page?
   (Search, social, email, internal link, ad, referral)
2. **Emotional state on arrival** — What is the visitor thinking and feeling?
3. **Exit paths** — Where should this page send visitors next? Define primary and
   secondary next steps.
4. **Internal linking strategy** — Which other pages does this page link to and why?
   Every page must link forward. No dead ends.
5. **Cross-page dependencies** — Does this page reference content that must exist on
   another page? Flag any dependencies.

## Step 5: Generate Navigation Strategy

**Full site architecture mode:**
- Define primary nav items (5 maximum for this ICP)
- Define nav hierarchy (dropdowns, mega-menu, or flat)
- Mobile navigation pattern (hamburger + floating thumb CTA)
- Sticky behaviour (when it sticks, what it shows when sticky)
- Footer navigation structure
- Breadcrumb strategy

**Single page mode:**
- Define how this page fits in the existing navigation
- Recommend nav item placement and label
- Flag if this page changes the nav structure

Read `references/site-architecture.md` for navigation best practices.

## Step 6: Save and Present

1. **Save the blueprint** to `projects/viz-page-architect/{YYYY-MM-DD}_{page-name}-blueprint.md`

   Include YAML frontmatter:
   ```yaml
   ---
   page: [page-name]
   type: [page-type]
   date: [YYYY-MM-DD]
   sections: [count]
   estimated_words: [total]
   status: draft
   ---
   ```

2. **If full site mode**, also save the site architecture to
   `projects/viz-page-architect/{YYYY-MM-DD}_site-architecture.md`

3. **Show the user** the full absolute file path(s).

4. **Present a summary:** Section list with jobs, total word count estimate, CTA map
   showing where primary and secondary CTAs land.

5. **Ask for feedback:** "How does this structure feel? Any sections that should move,
   merge, or get cut?"

6. **Push to Notion for review** — Notion is the Got Moles review mechanism; create the blueprint page under the Got Moles project via the Notion MCP (`mcp__claude_ai_Notion__notion-create-pages`).

7. **Log feedback** to `context/learnings.md` under `## viz-page-architect`.

8. **Suggest next steps:** "Ready for copy? The `mkt-copywriting` skill reads this
   blueprint and writes section by section."

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- Every section must have ONE job. If a section has two jobs, split it.
- Every section must include an **Image direction** block. Read `references/image-direction.md`
  before generating any blueprint. Every recommended image must pass the **Three-Gate
  Validation** explicitly: (1) ICP Recognition — would the ICP personas (read brand_context/icp.md — for Got Moles: Jennifer & Mike Thompson, WA homeowners) feel "this is for someone like me"?
  (2) Positioning Match — does it reinforce the brand angle, not a different one?
  (3) Section Job Match — does it serve THIS section's specific job? All three must pass.
  Show the gate check in the blueprint. An impressive image that fails any gate is wrong.
- 2026-03-30 (ATP-era lesson, generalized): never recommend imagery that signals a DIFFERENT brand archetype than positioning.md defines — an impressive image that miscommunicates the brand fails Gate 2, and imagery the ICP cannot see themselves in fails Gate 1. Homepage sections need grounded, approachable imagery; save dramatic imagery for pages where narrative contextualises it.
- Anti-overwhelm principle: the homepage must feel as simple as a 3-page site.
  Depth reveals on scroll.
- Zero em dashes in any output. Full stops create rhythm. This is non-negotiable.
- Never use "but" in any output. Use contrasting constructions instead.
- Social proof goes at decision points, not scattered randomly. Place proof where the
  visitor is weighing a decision, not where there's empty space.
- One primary CTA per viewport. Secondary CTAs must be visually subordinate.
- Mobile section order may differ from desktop. CTA moves to thumb zone. Long sections
  get progressive disclosure.
- Progressive disclosure: show the minimum needed, reveal depth on interaction.
  Accordions, tabs, and "read more" are tools, not compromises.
- Every page links forward. No dead-end pages. The visitor always has a clear next step.
- Navigation: 5 items maximum in primary nav. More options create decision paralysis
  for time-poor audiences.
- The blueprint is the contract. Copy, design, and build all reference it. If the
  blueprint changes, downstream work must be reviewed.

## Self-Update

If the user flags an issue with the output — wrong section order, missing considerations,
bad format, incorrect assumptions — update the `## Rules` section in this SKILL.md
immediately with the correction and today's date. Do not just log it to learnings. Fix
the skill so it does not repeat the mistake.

Format: `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`
