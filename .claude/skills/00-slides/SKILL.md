---
name: 00-slides
version: 1.1.0
description: >
  Create presentations from any input — topic name, rough outline, or transcript.
  Researches, structures content, generates an adaptive outline for approval, then
  renders production-quality HTML slides with optional PDF export.
  Triggers on: "create a presentation", "create slides", "make a deck",
  "presentation about", "slides for", "slide deck", "build a presentation".
  Does NOT trigger for slide design only — that is viz-frontend-slides.
  Does NOT trigger for research only — that is str-trending-research.
---

# Slides Orchestrator

End-to-end presentation creation: input detection, content structuring, outline approval, rendering, and delivery.

## Outcome

A complete presentation delivered as:
- Self-contained HTML file, auto-opened in the browser
- Optional PDF export
- Outline saved alongside for reference

Output convention:

```
{projects_base}/00-slides/
  {YYYY-MM-DD}/
    logs/                       ← pipeline-log.md, working notes
    {presentation-slug}/        ← slides.html, outline.md, slides.pdf
```

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `skill-pack/config/sys-config.md` | full (Paths + Defaults) | Resolve `decoupled_base`, `brand_context`, `env_file`, `projects_base`; load default preferences |
| `{brand_context}/visual-identity/tokens.json` | full | Pass to viz-frontend-slides |
| `{brand_context}/voice-profile.md` | tone only | Copy tone for text slides |
| `{decoupled_base}/context/learnings.md` | `## 00-slides` | Past feedback |

The `## Paths` section of `sys-config.md` is populated by `install.sh` and points to the project's decoupled base (typically `<project-root>/` or `<project-root>/agentic-os/`).

## First Run

On first invocation, check for `skill-pack/config/sys-config.md`. If `_customized: false` or missing, run onboarding (see `references/onboarding.md`) — batched `AskUserQuestion` collecting all preferences in a single multi-question call:

1. Default style preset (or "auto" to match presentation type)
2. Max slide count cap (default: 20)
3. PDF export preference (default: on request only)
4. Auto-open browser (default: yes)

Also check for `{brand_context}/visual-identity/tokens.json`. If missing, offer to run `Skill(mkt-visual-identity)` or proceed with neutral defaults.

## Workflow

### Phase 1: Input Detection

Classify what the user provided:

| Input Type | Detection | Next Step |
|------------|-----------|-----------|
| **Topic only** | Short phrase, no structure, no content body | Phase 2a (Research) |
| **Rough outline** | Bullet points, section headers, structured notes | Phase 3 (Structure) |
| **Transcript** | Long-form text, conversational, timestamps | Phase 2b (Extract) |
| **Existing outline** | Numbered slides with content per slide | Phase 4 (Approve) |

### Phase 2a: Research (topic only)

Invoke `str-trending-research` with the topic. Use the research brief as input for Phase 3.

If `str-trending-research` is not installed or fails, ask the user to provide more content or an outline.

### Phase 2b: Extract (transcript)

For transcripts longer than 30 minutes of content:
- Ask the user to pick a focus area or key theme
- Suggest 2-3 possible angles based on a quick scan

Extract key points:
- Core arguments and insights
- Supporting evidence and examples
- Memorable quotes or phrases
- Natural section breaks

Cap extraction to fit the slide count limit from config.

### Phase 3: Content Structuring

Build an adaptive presentation structure based on the content type:

| Presentation Type | Structure Pattern |
|-------------------|-------------------|
| **Pitch deck** | Problem, Solution, How it works, Traction, Team, Ask |
| **Conference talk** | Hook, Context, Core insight, Evidence, Implications, Takeaway |
| **Knowledge share** | Overview, Key concepts (3-5), Deep dive, Practical application, Summary |
| **Internal update** | Context, Progress, Blockers, Next steps, Discussion |
| **Workshop** | Goal, Concept, Demo, Exercise, Recap |
| **Case study** | Challenge, Approach, Execution, Results, Learnings |

If the type is not obvious, ask: "What kind of presentation is this — pitch, talk, workshop, or something else?"

For each slide in the outline, write:
- Slide number and title
- Key message (one sentence)
- Supporting content (bullets, data, quote)
- Suggested slide type (title, content, feature grid, quote, image, data)

### Phase 4: Outline Approval

Present the complete outline to the user. Format:

```
PRESENTATION: {title}
TYPE: {presentation type}
SLIDES: {count}
STYLE: {preset or "auto"}

1. [Title Slide] {title}
   {subtitle}

2. [Content] {slide title}
   Key message: {one line}
   - {bullet 1}
   - {bullet 2}

3. [Quote] {speaker name}
   "{quote text}"

...
```

Ask: "Does this outline work? Anything to add, remove, or reorder?"

Do NOT proceed until the user approves. Accept edits and re-present if needed.

### Phase 5: Render

Pass the approved outline to `viz-frontend-slides` with:
- The structured slide content
- Presentation type
- Style preset (from config or user preference)
- Brand tokens (from `{brand_context}/visual-identity/tokens.json`)

The rendering skill handles all design, HTML generation, and viewport enforcement.

### Phase 6: Deliver

Output paths use `{projects_base}/00-slides/{YYYY-MM-DD}/{presentation-slug}/`. Resolve `{projects_base}` from `skill-pack/config/sys-config.md` → `## Paths`. Working notes and `pipeline-log.md` go to `{projects_base}/00-slides/{YYYY-MM-DD}/logs/`.

1. Save HTML to `{output_dir}/slides.html` where `{output_dir} = {projects_base}/00-slides/{YYYY-MM-DD}/{presentation-slug}/`
2. Save outline to `{output_dir}/outline.md` (and append a per-phase entry to `{projects_base}/00-slides/{YYYY-MM-DD}/logs/pipeline-log.md`)
3. Auto-open in browser (if enabled in config) — branch by OS:
   - macOS: `open slides.html`
   - Linux: `xdg-open slides.html`
   - Windows: `start "" slides.html`
4. If PDF requested, export via browser print-to-PDF or puppeteer
5. Show file paths and slide count

Ask: "Want any changes, or is this good?"

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `viz-frontend-slides` | Required | HTML slide generation and design | Cannot render |
| `str-trending-research` | Optional | Topic research for topic-only input | Ask user for content |
| `mkt-visual-identity` | Optional | Brand visual tokens | Uses neutral defaults |

## Edge Cases

- **Long transcript (60+ min):** Ask user to pick focus area. Cap slides.
- **No design tokens:** Proceed with neutral style or style preset.
- **Research fails:** Fall back to asking user for outline.
- **Too much content for cap:** Suggest splitting into two decks or increasing cap.
- **User wants full-length:** Override cap when explicitly requested.

## Rules

- Always pause for outline approval before rendering.
- Never exceed the slide count cap without explicit user override.
- Adapt structure to presentation type — never force a rigid template.
- Pass brand tokens through to renderer — never apply design in the orchestrator.
