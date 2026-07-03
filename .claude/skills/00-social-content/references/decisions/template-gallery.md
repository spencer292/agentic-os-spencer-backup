# Template + AI Style Gallery

**Owner:** `ssc-designer` — read at the START of Phase 5.3b (before filling any slide object).  
**Purpose:** inspiration palette. Every option here has equal standing. There is no default, no fallback, no "safe choice." The right option is the one whose trigger matches the slide's content.

---

## How the two choices work together

**Template** = HTML structure. Where the headline sits, where the image lives, what the layout is.  
**AI style** = what the AI generates for the image zone (`ai_style` field, required when `render_mode ∈ {HYBRID_AI, FULL_AI}`).

They are **independent and combinable.** A `cinematic` AI photo inside an `editorial-news-image-top` template is as valid as a `social-design` archetype inside a `photo-overlay-front`. Mix freely — the template decides structure, the style decides what the image looks like.

The guiding question for every slide:
> **"What image would make a reader UNDERSTAND this slide before they read a word?"** — then pick the template that gives that image the best stage.

---

## PART 1 — HTML TEMPLATES

**Source of truth (v2.0.1+):** per-template descriptions (`summary` / `feels_like` / `use_when` / `avoid_when` / `image_zone` / `render_mode` / `creative_move_credit`) live in each pool's `manifest.json` under `brand_context/templates/<pool>/manifest.json` (per-brand) with `viz-image-gen/references/templates/<pool>/manifest.json` as fallback. Read the relevant manifest when picking a template_id — every entry has the fields above plus `compatible_ai_styles[]` for the AI-style pairing matrix in Part 3.

For the `linkedin-carousel` pool, the manifest currently exposes 26 templates: 3 native heroes (`hero-typographic`, `hero-photo-overlay`, `hero-split`), 11 native bodies (`body-headline-body`, `body-trap-fix`, `body-numbered-list`, `body-data-stat`, `body-pullquote`, `body-screenshot-annotated`, `body-comparison-2col`, `body-icon-grid`, `body-step-number`, `body-question-answer`, `body-timeline-vertical`), 3 native CTAs (`cta-typographic`, `cta-author-card`, `cta-question`), 4 photo-overlay cross-imports (`photo-overlay-front`, `photo-overlay-content`, `photo-overlay-text`, `photo-overlay-cta`), and 5 editorial-news cross-imports (`editorial-news-image-top`, `editorial-news-image-bottom`, `editorial-news-layout-statement`, `editorial-news-numbered`, `editorial-news-cta`).

Specialty families (`notebook`, `technical-annotation`, `comic/two-panel`, `subtle`, `bold-statement`) are Fase 9 migration targets — not yet in the pool. Use `body-screenshot-annotated` as the canonical annotation slot in the interim; use `editorial-news-numbered` / `body-numbered-list` for step-by-step teaching.

When adding a new template, update the manifest entry — this gallery is a navigation aid, not a duplicate spec.

---

## PART 2 — AI STYLES

**Required when `render_mode ∈ {HYBRID_AI, FULL_AI}`.** Pick one `ai_style`. No blank — pick deliberately based on what the slide's content says.

The right style generates an image that **represents what the text says** — not just a background decoration. If you removed the headline, would the image alone communicate the slide's beat? If not, pick a different style.

---

### `ai_style: "cinematic"`
**Style file:** `style-cinematic.md`  
**Feels like:** A film still. Dramatic light, real atmosphere, something happened here — Roger Deakins / Denis Villeneuve frame.  
**Generates:** Photorealistic scene — a person, a moment, an environment — in a cinematic color grade with volumetric light, shallow depth of field, and film grain. NOT illustration.  
**Use when:** The slide has emotional weight — a pain point, a transformation, a human struggle, a breakthrough. Any beat where you want the reader to FEEL something before they read.  
**Content signals:** "years of struggling", "everything changed when", "the real cost of", "burnout", "the moment I realized", "what nobody warns you about", emotional story beats.  
**Represents:** the human experience behind the text — the emotion made visible.  
**Best paired with:** `photo-overlay-front` (cover), `editorial-news-image-bottom` (emotional proof).  
**Model:** Gemini (atmospheric scenes) or GPT (portrait + product detail).

---

### `ai_style: "isometric"`
**Style file:** `style-isometric.md`  
**Feels like:** A Stripe or Linear landing page illustration. Clean 3D clay-render, soft shadows, floating UI elements — professional and precise.  
**Generates:** Isometric 3D scene — tech stacks, agent architectures, product ecosystems, workflow diagrams — with brand palette in a Dribbble/SaaS aesthetic.  
**Use when:** The slide explains a system, stack, process, or how things connect. Any "these 3 tools work together" or "here's the architecture" beat.  
**Content signals:** workflow, automation, n8n, API, pipeline, agents, integration, tech stack, dashboard, SaaS, cloud, diagram.  
**Represents:** the system or architecture — makes the abstract tangible as a 3D map.  
**Best paired with:** `editorial-news-image-top` (diagram above the explanation), `editorial-news-image-bottom`.  
**Model:** Gemini (compositional cleanliness) or GPT (when label detail needed).

---

### `ai_style: "editorial-illustration"`
**Style file:** `style-editorial-illustration.md`  
**Feels like:** The New Yorker or The Atlantic. Rich conceptual illustration — the idea becomes a picture.  
**Generates:** An illustrated metaphor — a tiny figure climbing a giant phone, a person drowning in emails, an open doorway to light. The image IS the concept.  
**Use when:** The slide makes an abstract or counter-intuitive point that has no real-world visual. Paradigm shifts, hidden costs, psychological traps, "what actually happens" beats.  
**Content signals:** "paradox", "trap", "hidden cost", "what actually happens", "the truth about X", "why most people fail at", any analogy or metaphor in the caption.  
**Represents:** the concept as a visual metaphor — the slide's idea made literal.  
**Best paired with:** `editorial-news-image-top` (metaphor leads), `editorial-news-image-bottom` (metaphor supports), `photo-overlay-content`.  
**Model:** GPT (conceptual precision + flat vector) or Gemini (atmospheric metaphors).

---

### `ai_style: "editorial-collage"`
**Style file:** `style-editorial-collage.md`  
**Feels like:** Agency work. Torn paper, magazine cutouts, surreal scale contrasts, bold color blocks — maximum visual tension.  
**Generates:** Layered mixed-media collage — oversized objects next to tiny figures, paper-cut edges, halftone textures, visible composition tension.  
**Use when:** The slide needs to disrupt — a hook that demands a second look, a bold claim, an impossible-to-scroll-past composition. Bold essays, industry disruption, manifesto energy, "nobody is talking about this" beats.  
**Content signals:** industry-shattering claim, disruptive take, "this changes everything", bold opinion, agency portfolio energy, provocative creative intent.  
**Represents:** the disruption or boldness of the idea — the composition itself IS the statement.  
**Best paired with:** `photo-overlay-front` (full-bleed disruptive cover), `photo-overlay-content`.  
**Model:** Gemini (multi-layer blending, torn-paper texture).

---

### `ai_style: "social-design"` *(27 archetypes — see `style-social-design.md`)*
**Style file:** `style-social-design.md`  
**Feels like:** Premium ad from a fintech or agency brand. Subject + floating UI badges + brand-color blocking + intentional clear zones for text overlay.  
**Generates:** One of 27 named archetypes — billboard, megaphone, surreal substitution, analog reveal, editorial portrait, contrast portal, exaggerated burden, suspended object, and more. Each is a full-density agency composition prompt.  
**Use when:** The slide is "about a person" (founder, audience, protagonist), "about a strong opinion" (manifesto, hot take), "about a transformation" (before/after), "about a pain point" (relatable struggle), or needs a premium ad-quality composition.  
**`ai_archetype` field:** required alongside `ai_style: "social-design"`. Set the archetype number (e.g., `"03"` for Billboard, `"10"` for Exaggerated Burden) after consulting the Archetype Selection Decision Matrix in `style-social-design.md`.  
**Represents:** the emotional or social signal of the text — the archetype is chosen to mirror the post's primary characteristic.  
**Best paired with:** `photo-overlay-front`, `photo-overlay-content`, `photo-overlay-cta`.  
**Model:** GPT (composition density) or Gemini (atmospheric archetypes — see model column in style file).

---

### `ai_style: "text-typography"`
**Style file:** `style-text-typography.md`  
**Feels like:** Swiss poster. A bold word or number IS the image — oversized sans-serif, high contrast, one accent color, nothing else.  
**Generates:** Typographic poster composition — a single large word, phrase, or stat in a Swiss/editorial style with brand colors and geometric layout.  
**Use when:** The slide's key message IS a short memorable phrase, a number, or a single word that should dominate the image zone. "27%." "ENOUGH." "3 rules." Use when the stat itself is more powerful as a designed poster than as a headline.  
**Content signals:** a specific percentage, count, year, or single word that carries the entire slide's weight — the number as a visual.  
**Represents:** the data or claim as a designed object — the number itself made art.  
**Best paired with:** `photo-overlay-front` (type as the cover visual), `editorial-news-image-top`.  
**Model:** GPT (text accuracy + Swiss style).

---

### `ai_style: "notebook-sketch"`
**Style file:** `style-notebook-sketch.md`  
**Feels like:** A hand-drawn concept diagram. Dotted paper, sketch lines, diagram arrows, marker highlights — original thinking, not stock art.  
**Generates:** Sketched visual — concept diagram, process loop, decision tree, framework drawing — in a Sketchnotes/whiteboard style.  
**Use when:** The slide visualizes a FRAMEWORK or PROCESS — the kind of thing you'd draw on a whiteboard for someone. "My system is…", "The loop looks like this…", "3 phases: X → Y → Z."  
**Content signals:** "my framework", "the loop", "3 steps to", "here's the system", "this is how I think about it", named process steps.  
**Represents:** the structure or mental model — the framework drawn out, not described.  
**Best paired with:** a `notebook-*` template (Fase 9 migration target — until then, fall back to `editorial-news-image-top` with a sketch image above the explanation, or `body-numbered-list` for step-by-step).  
**Model:** GPT (hand-drawn line quality).

---

### `ai_style: "comic-storyboard"`
**Style file:** `style-comic-storyboard.md`  
**Feels like:** A comic strip or storyboard panel. Sequential narrative, expressive moments, bold ink lines.  
**Generates:** A single-panel or multi-panel comic scene — characters in a relatable situation, a freeze-frame narrative moment, a "day in the life" beat.  
**Use when:** The slide tells a short story — a character's journey, a relatable frustration, a before/after narrative, a "me vs everyone else" contrast.  
**Content signals:** "imagine you're a…", "every Monday I…", "it was 2am and…", any narrative with a protagonist and a moment.  
**Represents:** the story beat — the narrative made visual as a scene.  
**Best paired with:** a `comic-*` template (Fase 9 migration target) or `body-comparison-2col` (native side-by-side); `editorial-news-image-bottom` for narrative-with-photo.  
**Model:** GPT (consistency) or Gemini (energy).

---

### Extended palette *(available but narrower use cases)*

| `ai_style` value | Style file | Best for |
|---|---|---|
| `ugc-influencer` | `style-ugc-influencer.md` | Authentic social / product-in-hand, person showing something to camera |
| `hyperreal-portrait` | `style-hyperreal-portrait.md` | Fantasy character / extreme detail portrait |
| `product-luxury` | `style-product-luxury.md` | Premium product still-life, luxury brand feel |
| `product-shoot` | `style-product-shoot.md` | Multi-angle product photography from a real reference image |

---

## PART 3 — Combination Matrix

**Derived from each pool manifest's `compatible_ai_styles[]` field.** When a template is added or its ai-style compatibility changes, update the manifest entry — this matrix is the visual summary. To regenerate: read `brand_context/templates/<pool>/manifest.json`, walk each template's `compatible_ai_styles[]` array. A style is `✅` if listed, `—` if absent.

Snapshot of the `linkedin-carousel` pool below (26 templates). For pools that haven't been built yet (instagram-carousel, youtube-slideshow, ebook), consult their manifests once they ship.

| template_id (linkedin-carousel) | cinematic | isometric | editorial-illustration | editorial-collage | social-design | text-typography | notebook-sketch | comic-storyboard |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `photo-overlay-front` | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — |
| `photo-overlay-content` | ✅ | — | ✅ | ✅ | ✅ | — | — | — |
| `photo-overlay-text` | — | — | — | — | — | — | — | — |
| `photo-overlay-cta` | ✅ | — | ✅ | — | ✅ | — | — | — |
| `editorial-news-image-top` | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| `editorial-news-image-bottom` | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | ✅ |
| `editorial-news-layout-statement` | — | — | — | — | — | — | — | — |
| `editorial-news-numbered` | — | — | — | — | — | — | — | — |
| `editorial-news-cta` | — | — | — | — | — | — | — | — |
| `hero-typographic` | — | — | — | — | — | — | — | — |
| `hero-photo-overlay` | ✅ | — | ✅ | ✅ | ✅ | — | — | — |
| `hero-split` | ✅ | — | ✅ | — | ✅ | — | — | — |
| `body-*` (consult per-entry manifest) | varies | varies | varies | varies | varies | varies | varies | varies |
| `cta-*` (typographic / author-card / question) | — | — | — | — | — | — | — | — |

✅ natural pairing | — skip (either no image or incompatible feel)

**Why some are blank:** TEMPLATE-only templates (`*-text`, `*-layout-statement`, `*-numbered`, `cta-typographic`, `cta-author-card`, `cta-question`, `hero-typographic`) don't generate AI images — no style applies. Specialty families (`notebook-*`, `technical-annotation-*`, `comic-*`) are Fase 9 migration targets; their compatibility ships with the manifest.

---

## Gallery Sweep *(run AFTER completing all audits 7.0–7.7)*

After the slide plan is filled and audits pass, do one sweep of both parts of this gallery:

**Template sweep:** walk the pool's manifest entries with `creative_move_credit: true` plus any specialty templates the pool offers. For each, is there a slide that CALLS for it but isn't using it?
- `body-screenshot-annotated` — any UI element with a specific thing to highlight?
- `editorial-news-numbered` / `body-numbered-list` / `body-step-number` — any framework/step moment that would land harder as numbered steps?
- `body-comparison-2col` — any contrast/before-after beat that would land harder as side-by-side?
- `editorial-news-layout-statement` / `body-data-stat` / `body-pullquote` — any number or pure-insight slide that would hit harder without an image?
- Fase 9 specialty migrations (`notebook-*`, `technical-annotation-*`, `comic-*`) — check the pool once added.

**AI style sweep:** for each style — is there a slide that would be MORE representative with this style?
- `isometric` — any tech/system explanation that currently uses generic cinematic?
- `editorial-illustration` — any abstract/metaphor slide that could be a concept illustration?
- `editorial-collage` — any hook that could be more disruptive with torn-paper tension?
- `social-design` — any slide about a person, pain point, or strong opinion that would benefit from an archetype?
- `notebook-sketch` — any "here's my framework" slide that could be a drawn diagram?

If a better match exists: reassign. Log: `Gallery sweep: slide N reassigned from {old} to {new} — {reason}.`
