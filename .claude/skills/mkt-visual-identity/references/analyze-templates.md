---
name: analyze-templates
description: Receives N template images, groups them by composition, and spawns one sub-agent per unique family to generate a Template Card + HTML.
---

You received one or more social carousel template images.

## Step 1 — Analyze all the images at once

Look at all the images together and identify unique composition families.

**Criteria for the same family:**
- Same layout structure (where text, image, badge sit)
- Same background type (full-bleed photo / texture / solid color)
- Same number of text zones

**Variations that do NOT separate families:**
- Text content (changes per post)
- Photo subject (changes per post)
- Badge number
- Accent color

## Step 2 — List the groups found

Before generating anything, present the grouping to the user:

```
Found X families across Y templates:

family 1 — [descriptive name]
  refs: [images that belong]
  composition: [1-line description]

family 2 — [descriptive name]
  refs: [images that belong]
  composition: [1-line description]
```

Wait for confirmation before continuing.

## Step 3 — Spawn 1 sub-agent per family

For each confirmed family, spawn an `ssc-template-builder` agent passing:
- The family's canonical image (the clearest/most complete in the group)
- The brand context path
- The family name (kebab-case slug)
- The type: hook | body | cta

The sub-agent delivers: Template Card + template.html + preview.png.

## Rules

- Never spawn more agents than unique families
- If only 1 image arrived, spawn directly without asking
- You are the QA — don't create automatic validation loops
