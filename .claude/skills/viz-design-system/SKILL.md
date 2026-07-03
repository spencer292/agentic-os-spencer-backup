---
name: viz-design-system
description: >
  Generate a complete design system (tokens, typography, color, spacing, motion, accessibility,
  performance rules) from brand context. Produces CSS variables, Tailwind config, and a visual
  spec document. Use this skill whenever the user mentions: "design system", "design tokens",
  "color palette", "brand colors", "typography system", "type scale", "font hierarchy",
  "spacing system", "component patterns", "design guide", "design guidelines", "design specs",
  "visual identity for website", "set up the design foundation", "define the look and feel".
  Also use when starting any website build or redesign — the design system should exist before
  pages are designed. Do NOT use for: UI mockups or screen design (that's viz-stitch-design),
  image/infographic generation (that's viz-nano-banana), diagrams (that's viz-excalidraw-diagram),
  or writing copy (that's mkt-copywriting).
---

# Design System Generator

Generate a complete, ICP-driven design system from brand context. Every design decision is
grounded in what the target audience responds to — not personal aesthetics, not trends.
The system produces tokens, principles, and specs that all downstream skills reference.

## Outcome

**Produces:**
- `brand_context/design-system.md` — principles document (read by all downstream skills)
- `projects/viz-design-system/{YYYY-MM-DD}_design-tokens.md` — CSS custom properties + Tailwind config
- `projects/viz-design-system/{YYYY-MM-DD}_visual-spec.md` — rendered spec with usage examples

Always save output to disk. This is not optional. After saving, show the user the full
absolute file path so they can click it directly.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/voice-profile.md` | tone + rhythm section | Design must match voice energy — flowing voice needs breathing typography |
| `brand_context/positioning.md` | summary + anti-overwhelm principle | Positioning drives visual strategy — the brand archetype in positioning.md sets the register, not design trends |
| `brand_context/icp.md` | full | ICP psychology is the PRIMARY driver of every design decision |
| `brand_context/assets.md` | colors + brand name | Existing brand colors as starting palette |
| `brand_context/design-system.md` | full (if exists) | Previous system to update rather than replace |
| `context/learnings.md` | `## viz-design-system` section | Past feedback on design decisions |

## Skill Relationships

**Upstream (reads from):**
- `mkt-brand-voice` → voice energy, rhythm, tone spectrum inform typography and whitespace
- `mkt-positioning` → positioning angle drives visual strategy and aesthetic direction
- `mkt-icp` → ICP psychology is the primary driver of all design decisions

**Downstream (feeds into):**
- `mkt-copywriting` → reads design-system.md for visual hierarchy guidance
- `viz-excalidraw-diagram` → reads color tokens for consistent palette
- Any future page/component skills → reads full design system as foundation

**Trigger boundaries:**
- "design a page/screen" → `viz-stitch-design` (not this skill)
- "generate an image" → `viz-nano-banana` (not this skill)
- "draw a diagram" → `viz-excalidraw-diagram` (not this skill)

## Before You Start

**Mode detection:**
- If `brand_context/design-system.md` exists → UPDATE mode. Read it first. Ask what needs changing.
- If it doesn't exist → CREATE mode. Run the full methodology below.

**Reusability:** This skill works for any brand, not just one. It reads whatever ICP, voice, and
positioning exist in `brand_context/` and derives design decisions from them. If running for a
client under `clients/{slug}/`, read that client's brand context.

## Step 1: Load Brand Context

Read the files listed in Context Needs. Extract:
- **From ICP:** Age range, sophistication level, time pressure, scepticism level, platform habits,
  words that turn them off, what they trust
- **From voice:** Energy level (calm/energetic), sentence rhythm (flowing/punchy), formality
  spectrum, personality traits
- **From positioning:** Primary angle, category, anti-overwhelm rules, competitive aesthetic
  to avoid
- **From assets:** Existing brand colors, brand name
- **From learnings:** Any previous feedback on design decisions

Read `references/icp-design-psychology.md` for the framework that maps ICP traits to design
decisions.

## Step 2: Derive Design Principles from ICP Psychology

**This step requires user approval before proceeding.**

Using the ICP-to-design framework, derive 5-7 design principles. Each principle must:
1. Name a specific ICP trait from brand_context/icp.md (Got Moles: "stressed homeowner watching their lawn get destroyed, wants it handled safely")
2. State the design implication (e.g., "Clarity in 5 seconds or they're gone")
3. Define the concrete rule (e.g., "One CTA per viewport. No competing actions.")

Present the principles to the user for approval. These become the constitution —
every subsequent decision must trace back to an approved principle.

**Format:**
```
## Design Principles

### 1. [Principle Name]
**ICP trait:** [What about the audience drives this]
**Design rule:** [The concrete constraint]
**Violation test:** [How to know if you've broken this]
```

## Step 3: Define Typography System

**This step requires user approval before proceeding.**

Read `references/typography-system.md` for the full framework.

Decisions to make:
1. **Primary typeface** — propose 2-3 options with rationale tied to ICP and voice.
   Serif for authority and warmth. Sans-serif for clarity and modernity. Consider the
   voice rhythm — flowing sentences need generous line-height and readable body text.
2. **Type scale** — use Perfect Fourth (1.333) or Major Third (1.25) based on content density.
   Define: body, small, h6 through h1, display. Maximum 4-5 sizes in active use per page.
3. **Line height** — body at 1.5-1.7 for readability. Headings at 1.1-1.3 for tightness.
4. **Responsive strategy** — `clamp()` for fluid scaling between mobile and desktop.
5. **Weight system** — regular (400) for body, medium (500) for emphasis, bold (700) for headings.
   Maximum 3 weights to limit font file downloads.

Present options with reasoning. Let the user choose.

## Step 4: Define Color System

**This step requires user approval before proceeding.**

Read `references/color-system.md` for the full framework.

Start from existing brand colors in `brand_context/assets.md`. Extend into a full system:

1. **Primary palette** — brand colors + 1-2 extensions. Generate tint/shade scales (50-950).
2. **Neutral palette** — warm or cool greys derived from the primary. Used for text, borders, backgrounds.
3. **Semantic colors** — success (green), warning (amber), error (red), info (blue). Must meet
   WCAG AA contrast (4.5:1 for text, 3:1 for large text and UI elements).
4. **Surface hierarchy** — background, surface, elevated surface. Define the layering system.
5. **Accent strategy** — one accent color for CTAs and interactive elements. Must have sufficient
   contrast against all surfaces.

Verify every text/background combination meets WCAG 2.2 AA. Present the palette with
contrast ratios.

## Step 5: Define Spacing and Layout System

Read `references/spacing-layout.md` for the full framework. This step is autonomous.

Generate:
1. **Base unit:** 8px (with 4px for fine adjustments)
2. **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
3. **Section spacing:** Generous gaps between page sections (96-128px desktop, 64-96px mobile)
4. **Internal rule:** Component internal padding always ≤ external margin
5. **Breakpoints:** 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1536px (2xl)
6. **Container:** max-width 1280px, centered, with responsive padding (16px mobile, 24px tablet, 32px+ desktop)
7. **Grid:** 12-column on desktop, 4-column on mobile. Gutter = 24px desktop, 16px mobile.

## Step 6: Define Motion and Interaction Rules

Read `references/icp-design-psychology.md` for audience-appropriate motion level. This step
is autonomous.

For most professional/B2B audiences:
1. **Default:** Minimal motion. Content appears, doesn't perform.
2. **Allowed:** Subtle fade-in on scroll (200-300ms, ease-out). Hover state transitions (150ms).
   Focus ring animations. Loading state indicators.
3. **Forbidden:** Parallax scrolling, auto-playing video, animated backgrounds, content that
   moves while you're trying to read it, entrance animations that delay content visibility.
4. **Technical:** Only animate `transform`, `opacity`, `filter`, `clip-path` for 60fps.
   Always respect `prefers-reduced-motion: reduce`.
5. **Easing:** `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state changes.

## Step 7: Define Accessibility and Performance Rules

Read `references/performance-rules.md` for the full framework. This step is autonomous.

**Accessibility (non-negotiable):**
- WCAG 2.2 AA compliance minimum
- Color contrast: 4.5:1 text, 3:1 UI elements
- Touch targets: 44px minimum (WCAG) / 48px recommended
- Focus indicators: visible, 2px+ offset, sufficient contrast
- No drag-only interactions
- Skip navigation link
- Semantic HTML hierarchy (one h1 per page, logical heading order)
- `alt` text strategy for images

**Performance (non-negotiable):**
- LCP target: under 2.5 seconds
- NEVER lazy-load the hero/LCP image
- Preload hero image with `fetchpriority="high"`
- Lazy-load all below-fold images
- Modern image formats (WebP primary, AVIF where supported)
- Font loading: `font-display: swap`, preload critical weights, max 3 font files
- Set explicit width/height on all images (prevents CLS)
- Target: under 2 seconds full load for the ICP's trust threshold

## Step 8: Generate Design Tokens

This step is autonomous. Compile all approved decisions into two formats:

**1. CSS Custom Properties:**
```css
:root {
  /* Typography */
  --font-primary: '{font}', {fallback};
  --text-body: clamp({min}, {preferred}, {max});
  /* ... full token set */
}
```

**2. Tailwind Config Extension:**
```js
module.exports = {
  theme: {
    extend: {
      colors: { /* semantic palette */ },
      fontFamily: { /* primary + fallbacks */ },
      fontSize: { /* scale with line-heights */ },
      spacing: { /* 8pt scale */ },
    }
  }
}
```

Save to `projects/viz-design-system/{YYYY-MM-DD}_design-tokens.md`.

## Step 9: Save and Present

1. **Save the principles document** to `brand_context/design-system.md`. This is the file
   all downstream skills read. Structure:
   - Design principles (from Step 2)
   - Typography system summary
   - Color palette with hex values and semantic names
   - Spacing scale
   - Motion rules
   - Accessibility requirements
   - Performance requirements

2. **Save the tokens** to `projects/viz-design-system/{YYYY-MM-DD}_design-tokens.md`

3. **Push to Notion for review** — Notion is the Got Moles review mechanism; create the design-system page under the Got Moles project via the Notion MCP (`mcp__claude_ai_Notion__notion-create-pages`)

3. **Save the visual spec** to `projects/viz-design-system/{YYYY-MM-DD}_visual-spec.md`
   Include rendered examples: heading hierarchy, color swatches with contrast ratios,
   spacing demonstrations, button states, form elements.

4. **Show the user** all three file paths.

5. **Ask for feedback:** "How does this land? Anything that feels off or needs adjusting?"
   Log feedback to `context/learnings.md` under `## viz-design-system`.

## Rules

- Never choose design elements based on personal aesthetics or trends. Every decision
  must trace to an ICP trait or brand context data point.
- Zero em dashes in any output. Full stops create rhythm. This is non-negotiable.
- Never use "but" — use contrasting constructions per voice-profile connector rules.
- The anti-overwhelm principle applies to the design system itself: present decisions
  clearly, don't overwhelm with options.
- If brand_context/ files are missing, ask what's needed and produce solid generic output.
  Brand context enhances, never gates.

## Self-Update

If the user flags an issue with the output — wrong approach, bad format, missing context,
incorrect tone — update the `## Rules` section in this SKILL.md immediately with the
correction. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake.

Format: `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`
