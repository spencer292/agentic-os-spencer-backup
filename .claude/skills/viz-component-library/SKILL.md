---
name: viz-component-library
description: >
  Generate conversion-optimised component specifications with mobile-first variants. Each component
  carries its "why" — the psychology and conversion data behind the pattern. Produces component
  specs with usage guidelines, accessibility requirements, and responsive behavior. Use this skill
  whenever the user mentions: "component spec", "component library", "hero section design",
  "testimonial block", "CTA design", "pricing table", "form design", "card design", "navigation
  component", "footer design", "trust bar", "social proof section", "feature grid", "how should
  this component work", "design this section", "component pattern". Also use when building page
  sections — each section needs a component spec before code. Do NOT use for: page-level
  architecture (that's viz-page-architect), design tokens (that's viz-design-system), writing
  copy (that's mkt-copywriting), or full page mockups (that's viz-stitch-design).
---

# Component Library Generator

Generate conversion-optimised component specifications with mobile-first variants. Each component
carries its "why" — the psychology and conversion data behind the pattern. Every spec references
design system tokens directly, never raw values.

## Outcome

**Produces:**
- Component spec documents saved to `projects/viz-component-library/{YYYY-MM-DD}_{component-name}-spec.md`

Always save output to disk. This is not optional. After saving, show the user the full
absolute file path so they can click it directly.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/design-system.md` | full | Design tokens, colors, typography, spacing |
| `brand_context/icp.md` | summary + language | ICP psychology for component decisions |
| `brand_context/positioning.md` | summary | Positioning angle affects component tone |
| `context/learnings.md` | `## viz-component-library` section | Past feedback |

## Skill Relationships

**Upstream (reads from):**
- `viz-design-system` → design tokens, color palette, typography scale, spacing system
- `viz-page-architect` → section requirements and page structure that components fill

**Downstream (feeds into):**
- Build tasks → code implementation from component specs
- `mkt-copywriting` → content slots define what copy is needed

**Trigger boundaries:**
- "page structure" or "page layout" → `viz-page-architect` (not this skill)
- "design system" or "design tokens" → `viz-design-system` (not this skill)
- "write the copy" → `mkt-copywriting` (not this skill)
- "design a full page mockup" → `viz-stitch-design` (not this skill)

## Step 1: Load Context

Read the files listed in Context Needs. Extract:
- **From design system:** Color tokens, typography scale, spacing scale, breakpoints, motion rules,
  accessibility requirements, performance rules
- **From ICP:** Scepticism level, time pressure, sophistication, what they trust, what turns them off
- **From positioning:** Primary angle, category positioning, competitive aesthetic context
- **From learnings:** Any previous feedback on component specs

If `brand_context/design-system.md` does not exist, inform the user that running `viz-design-system`
first will produce better specs. Proceed with sensible defaults. Brand context enhances, never gates.

## Step 2: Identify Component

**This step requires user input.**

Ask the user which component they need. Present the options:

- **Hero section** — split-screen, centered, video, minimal
- **Navigation** — desktop + mobile responsive
- **Social proof bar** — logo row, metrics, testimonial carousel
- **Testimonial block** — single featured, grid, carousel
- **CTA block** — primary, secondary, inline, sticky mobile
- **Pricing table** — 2-3 tiers, comparison
- **Feature grid** — 3-column, bento, icon-led
- **Form** — contact, quiz, newsletter signup
- **FAQ accordion**
- **Footer** — comprehensive, minimal
- **Card** — blog post, service, team member
- **Trust bar** — certifications, media mentions, metrics
- **How-it-works** — 3-step process
- **Dark section** — contrast block with brand colors

If the user has already specified the component, skip the menu and proceed directly.

## Step 3: Generate Component Spec

Read the relevant reference file from `references/`. Produce a spec that includes:

1. **Component name and purpose** — what it is and why it exists on the page
2. **Psychology** — why this pattern converts for this ICP, with data where available
3. **Visual structure** — layout description referencing design system tokens (colors, spacing,
   typography by token name, not raw values)
4. **Content slots** — what content goes where, with character/word limits for each slot
5. **Responsive behavior** — mobile layout first (spec the smallest screen), then tablet
   enhancements, then desktop. Include breakpoints from the design system.
6. **Accessibility requirements** — ARIA roles, keyboard navigation, focus management,
   screen reader behavior, contrast requirements
7. **States** — default, hover, focus, active, disabled, loading, error (as applicable)
8. **CTA integration** — what CTA pattern to use, placement, copy guidance
9. **Social proof integration** — where and how social proof appears (if applicable)
10. **Performance notes** — image loading strategy, lazy-load behavior, animation budget
11. **Design system tokens used** — explicit list of which tokens from the design system
    this component references

## Step 4: Generate Variants

If the component has variants (e.g., hero: split-screen vs centered vs minimal), spec each
variant with:
- When to use it (what page type, what content situation)
- When to avoid it
- How it differs from the other variants structurally
- Any unique content slot requirements

## Step 5: Save and Present

1. **Save the spec** to `projects/viz-component-library/{YYYY-MM-DD}_{component-name}-spec.md`
2. **Show the user** the full absolute file path
3. **Ask for feedback:** "How does this land? Anything that needs adjusting?"
4. **Push to Notion for review** — Notion is the Got Moles review mechanism; create the spec page under the Got Moles project via the Notion MCP (`mcp__claude_ai_Notion__notion-create-pages`)
5. **Log feedback** to `context/learnings.md` under `## viz-component-library`

## Rules

- Every component spec must reference specific design system tokens (not raw values like
  `#2D5A4E` or `16px`). Use token names from brand_context/design-system.md: `gold-500`, `space-4`, `text-body` (never tokens from another brand's system).
- Mobile-first: spec the mobile version first, then enhance for desktop.
- 48px minimum touch targets on all interactive elements.
- One primary CTA per component. Secondary CTAs must be visually subordinate.
- Micro-copy under CTAs increases clicks 10-20%. Include guidance for every CTA.
- Social proof: named, specific, with outcomes. Never generic unattributed quotes.
- Performance: specify image loading strategy, animation budget, lazy-load behavior for
  every component that contains media.
- Zero em dashes in any output. Full stops create rhythm.
- Never use "but" — use contrasting constructions per voice-profile connector rules.
- If brand_context/ files are missing, produce solid generic output with standard tokens.
  Brand context enhances, never gates.

## Self-Update

If the user flags an issue with the output — wrong approach, bad format, missing context,
incorrect tone — update the `## Rules` section in this SKILL.md immediately with the
correction. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake.

Format: `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`
