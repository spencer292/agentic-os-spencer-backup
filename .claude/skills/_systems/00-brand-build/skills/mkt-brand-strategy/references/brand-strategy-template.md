# brand-strategy.md — Output Template

Write `{brand_context}/brand-strategy.md` in this exact structure. Keep prose tight and
specific to the user's answers. End with the JSON block so downstream skills and automation
can read the strategy programmatically.

---

```markdown
# Brand Strategy — {Brand Name}

*Locked {YYYY-MM-DD}. The strategic foundation — every voice, copy and design decision is
checked against this.*

## Brand at a glance

- **Essence:** {2–3 words}
- **Archetype:** {Primary}{ + Secondary if any}
- **Positioning statement:** For {audience} who {need}, {Brand} is the {category} that
  {benefit}, because {reason to believe}, unlike {alternative}.

## Brand story

{2–4 sentences: origin, why it exists, the change it wants to make. Sourced from the Why.}

## Purpose — Golden Circle

- **Why:** {belief / purpose}
- **How:** {values & differentiators that make it real}
- **What:** {products / services}

## Personality

- **Primary archetype:** {name} — {one-line justification tied to the user's words}
- **Secondary archetype:** {name or "none"}
- **Aaker Big-Five:** Sincerity {n}/5 · Excitement {n}/5 · Competence {n}/5 ·
  Sophistication {n}/5 · Ruggedness {n}/5
- **In three words:** {word, word, word}
- **Tone coordinates (for voice):** Formal↔Casual {pos} · Serious↔Funny {pos} ·
  Respectful↔Irreverent {pos} · Matter-of-fact↔Enthusiastic {pos}

## Positioning statement (the spine)

> For {audience} who {need}, {Brand} is the {category} that {benefit}, because
> {reason to believe}, unlike {primary alternative}.

## {Brand Key | Brand Pyramid}

{Render the chosen model's parts as a short list, ending at the Essence. State which model
and why it was chosen.}

## Mission · Vision · Values · Promise

- **Vision:** {the world we want to create}
- **Mission:** {what we do daily to get there}
- **Values:** {3–6, each phrased as a behaviour}
- **Promise:** {what every customer can reliably expect}

## Audience

{Light read — who and core pain. If a full ICP exists: "See `icp.md` for the full profile."}

## Competitive frame

{Top alternatives, the category convention being broken, and the white space — note for
`mkt-positioning` to develop into market angles.}

## Moodboard direction (hand-off to visual identity)

- **Colour direction:** {psychological intent, not final hex}
- **Type feeling:** {display + body character}
- **Imagery / texture:** {subject, treatment, mood}
- **Reference rationale:** {admired brand → the one cue to borrow}, …

## Messaging (optional — Message House seed)

- **Roof (core message):** {value prop}
- **Pillars:** {3–4 proof themes}

---

<details>
<summary>Structured data (machine-readable)</summary>

```json
{
  "brand": "{Brand Name}",
  "locked_date": "{YYYY-MM-DD}",
  "essence": "{2-3 words}",
  "archetype": { "primary": "{name}", "secondary": "{name or null}" },
  "aaker_big_five": { "sincerity": 0, "excitement": 0, "competence": 0, "sophistication": 0, "ruggedness": 0 },
  "tone_dimensions": { "formal_casual": "{pos}", "serious_funny": "{pos}", "respectful_irreverent": "{pos}", "matter_of_fact_enthusiastic": "{pos}" },
  "golden_circle": { "why": "", "how": "", "what": "" },
  "positioning_statement": { "audience": "", "need": "", "category": "", "benefit": "", "reason_to_believe": "", "alternative": "" },
  "model": { "type": "brand_key | brand_pyramid", "essence": "{2-3 words}" },
  "mission": "", "vision": "", "values": [], "promise": "",
  "competitive_frame": { "alternatives": [], "convention_broken": "", "white_space": "" },
  "moodboard_direction": { "colour": "", "type": "", "imagery": "", "references": [] },
  "message_house": { "roof": "", "pillars": [] }
}
```
</details>
```
