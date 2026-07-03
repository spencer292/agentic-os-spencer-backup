---
name: tool-screenshot-annotator
version: 1.0.0
description: >
  Annotate screenshots with numbered circles and highlight boxes. Accepts
  manual coordinates, element data from tool-web-screenshot, or pipeline
  manifest paths. Uses percentage-based positioning (0-100%) with edge
  clamping. Renders RGBA overlay composited onto source PNG. Supports custom
  accent colors and annotation specs via JSON. Chain after tool-web-screenshot
  or tool-video-screenshots for labeled UI walkthroughs.
  Triggers on: "annotate this screenshot", "add numbered circles",
  "highlight this area", "mark up this image", "annotate image",
  "add callouts to", "label this screenshot".
  Does NOT trigger for capturing screenshots (use tool-web-screenshot or
  tool-video-screenshots) or for AI image generation/editing (use viz-image-gen).
---

## Setup

Run `bash .claude/skills/tool-screenshot-annotator/scripts/setup.sh` on first use.

## First-Run Onboarding

Check `references/default-config.json` for `"onboarded": false`. If false, run this flow before annotating:

1. **Detect brand context.** Check if `{brand_context}/design-tokens.md` exists and has an Accent colour.
   - If yes: tell the user you found their brand accent and show the hex. Ask if they want to use it or pick a different colour.
   - If no: show the default palette (warm orange #D97757, blue #4A90D9, green #4CAF50, red #E53935) and ask them to pick one or enter a custom hex.

2. **Detail level.** Ask: "How much annotation detail do you want by default?"
   - **Minimal** — numbered circles only, no highlight boxes, no legend. Clean and subtle.
   - **Standard** — circles + highlight boxes + legend strip. Good for tutorials and walkthroughs.
   - **Detailed** — everything, including auto-annotating all interactive elements. Dense, technical.

3. **Label style.** Ask: "How should annotation labels appear?"
   - **Legend** — numbered key strip below the image. Clean separation between image and labels.
   - **Inline** — pill-shaped labels rendered next to each circle directly on the image. More compact, no extra strip.

4. **Legend.** Only ask if they chose "legend" style: "Show a legend key below annotated images?" (yes/no). Explain it lists what each number points to.

5. **Circle size.** Ask: "Circle size — standard (44px) or compact (32px)?" Only offer these two; don't ask for arbitrary numbers.

6. **Save.** Write their choices to `references/default-config.json` and set `"onboarded": true`. Confirm with a one-line summary of what was saved.

7. **Continue.** Proceed immediately with the annotation task using the new config.

On subsequent runs, skip onboarding entirely — just use the saved config.

## Usage

Create a JSON spec file, then run:

```bash
uv run .claude/skills/tool-screenshot-annotator/scripts/annotate.py \
  --spec spec.json \
  --output annotated.png
```

### Style Config

Edit `references/default-config.json` to set install-wide defaults. Every spec can override any value.

| Setting | Default | Values |
|---------|---------|--------|
| `accent_color` | `"auto"` | `"auto"` (pulls from `{brand_context}/design-tokens.md`) or any hex |
| `detail_level` | `"standard"` | `minimal` (circles only, no legend), `standard` (circles + boxes + legend), `detailed` (all elements) |
| `circle_diameter` | 44 | Base px size (auto-scales with image resolution) |
| `border_width` | 3 | Highlight box border thickness |
| `border_radius` | 12 | Highlight box corner rounding |
| `label_style` | `"legend"` | `legend` (numbered key strip below image) or `inline` (pill-shaped labels next to circles on the image) |
| `legend` | true | Show/hide the legend strip below the image (only applies when `label_style` is `legend`) |

**Priority cascade:** default-config.json < brand design tokens (for `"auto"`) < spec-level values.

Always add a `label` field to `circle_number` annotations — it populates the legend or inline pill labels.

### Annotation Spec Format

```json
{
  "source": "/path/to/screenshot.png",
  "annotations": [
    {"type": "circle_number", "number": 1, "x_pct": 45.2, "y_pct": 30.1, "label": "Settings button"},
    {"type": "highlight_box", "x_pct": 10, "y_pct": 20, "width_pct": 30, "height_pct": 5}
  ]
}
```

Omit `accent_color` from the spec to use the config default (auto brand color).

### Annotation Types

| Type | Z-order | Fields | Visual |
|------|---------|--------|--------|
| `circle_number` | 10 (top) | `number`, `x_pct`, `y_pct`, `label` | Accent circle, white number, drop shadow, legend entry |
| `highlight_box` | 5 (behind) | `x_pct`, `y_pct`, `width_pct`, `height_pct` | Accent border, rounded, semi-transparent fill |

Overlap avoidance: circles auto-nudge away from other annotations. Spec any `accent_color`, `diameter`, `border_width`, or `radius` per-annotation to override defaults.

### Coordinate System

All positions are percentage-based (0-100% of image dimensions). Circle numbers are clamped to 5%-95% to prevent edge cropping.

### Input Modes

| Input | Mode |
|-------|------|
| Image path + coordinates from Claude | Manual — Claude reads the image and determines positions |
| Image path + elements.json from tool-web-screenshot | Auto-target — match annotations to elements |
| Manifest path from pipeline | Pipeline — auto-load image and elements |

### Output

```
{projects_base}/tool-screenshot-annotator/{YYYY-MM-DD}/{name}/
  annotated.png
  manifest.json    # includes config_used showing resolved accent + detail level
```

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-web-screenshot` | Optional | Source screenshots with element enumeration | User provides screenshot manually |
