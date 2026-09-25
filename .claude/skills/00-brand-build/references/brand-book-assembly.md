# Brand Book Assembly

How Phase 6 composes the combined brand deliverables from the `brand_context/` files the
pipeline produced. This is the full professional output — strategy + verbal + visual — distinct
from `visual-identity/brand-book.pdf`, which is the visual subset `mkt-visual-identity` makes.

**Two artifacts, one source of truth (decided 2026-06-28, benchmarked against a professional
agency deck):**

1. **Brand book (markdown + PDF)** — the editable, AI-readable **source of truth**. The enriched
   section model below. Lives at `{brand_context}/brand-book.md` (+ `.pdf`).
2. **Designed deck (PDF)** — the **presentation/handover** artifact: a designed 16:9 guidelines
   deck rendered by `skill-pack/deck/deck-renderer.js` from `{brand_context}/brand-deck.json`
   (data contract in `skill-pack/deck/SCHEMA.md`). Agency-standard: clear-space diagrams, colour
   blocks with HEX/RGB/CMYK + 60/30/10, type specimens, incorrect-usage grids, brand-in-action.

Build the deck JSON by **transcribing the locked `brand_context/` files** — never invent values.
The book and the deck draw from the same sources, so they never disagree.

## Output

- Markdown book at `{brand_context}/brand-book.md`; rendered to `brand-book.pdf` (Chrome-headless
  path on Windows — see `tool-pdf-generator` Step 3), copied to `~/Downloads/`.
- Deck JSON at `{brand_context}/brand-deck.json`; rendered to `brand-deck.pdf`, copied to `~/Downloads/`.
- If a PDF render fails, the markdown / JSON IS the deliverable — note the failure; never lose
  the assembled content.

## Enriched visual rigor (absorbed from the agency benchmark)

The visual sections must carry agency-level detail, not one-liners:
- **Logo:** per-lockup *Usage* + a *clear-space* rule + *min-size*; a visual *incorrect-usage* grid.
- **Colour:** every colour as HEX + RGB + **CMYK** (print) + role; the **60/30/10** dominance
  ratio; a **colour-pairing** matrix (what sits on what).
- **Typography:** a **specimen** per typeface (role, name, sample), 3-tier hierarchy, a type
  *incorrect-usage* grid.
- **Brand in action:** a real spread of applied mockups — the payoff. **Generate a platform set**
  (don't ship 1-2): YouTube thumbnail (16:9), Instagram feed post (1:1), Instagram story/reel (9:16),
  podcast cover (1:1), plus course/email/web as relevant. Use the image generator
  (`viz-image-gen/scripts/generate_image_gemini.py --aspect-ratio …`) anchored to the locked logo +
  a brand reference (`-i lockup.png -i community-card.png`); save to
  `{brand_context}/visual-identity/brand-in-action/`. The deck frames them **uncropped** (contain)
  with a platform chip, 6 per 2×3 slide — so native aspect ratios (portrait story, landscape thumb)
  all show in full. Never force-crop a mockup to a tile. Aim for a real placement spread: digital
  (YouTube/IG post/IG story/podcast/LinkedIn/web) **and** merch/print (mug, tote, notebook, apparel) —
  two full gallery pages is the target, not one sparse one.
  - **Downscale before rendering (required).** Full-res mockups base64-inline to a ~40 MB+ HTML and
    Chrome's print-to-pdf then emits a blank stub. Run `skill-pack/deck/optimize-actions.py` to make
    ≤1400px JPEG copies in `brand-in-action/deck/` and point `brand-deck.json` `actions[].img` at
    those; keep the full-res originals for production. See `skill-pack/deck/SCHEMA.md` → Asset prep.

These are exactly the slides the deck renders from `brand-deck.json`; the markdown book carries
the same content as prose + tables + embedded images.

**Orientation:** the deck defaults to **portrait** (A4 1000×1414) — the house standard. Set
`"orientation": "landscape"` in `brand-deck.json` only if a brand specifically wants a 16:9 deck.

## The 11 sections → source map

Pull each section from the file that owns it. Quote/summarise faithfully; do not re-derive
strategy or re-invent values — the source files are the locked truth.

| # | Section | Source |
|---|---------|--------|
| 1 | Introduction / brand story | `brand-strategy.md` → Brand story + how to use this book |
| 2 | Brand strategy | `brand-strategy.md` → essence, archetype, Golden Circle, positioning statement, mission/vision/values/promise; `positioning.md` → chosen market angle; `icp.md` → audience summary |
| 3 | Logo | `visual-identity/` → logo system, lockups, clear space, min size, misuse |
| 4 | Colour | `visual-identity/tokens.json` → palette with HEX/RGB(/CMYK/Pantone if present), ratios, accessibility |
| 5 | Typography | `visual-identity/tokens.json` + `fonts/` → typefaces, hierarchy, type scale, web/CSS |
| 6 | Imagery & photography | `visual-identity/` (moves / ai-image-style) → art direction, do/don't |
| 7 | Iconography & graphic elements | `visual-identity/` → icon set + signature devices |
| 8 | Layout & grid | `visual-identity/` → spacing, grid, templates |
| 9 | Voice & tone | `voice-profile.md` → personality, the four tone dimensions, vocabulary, message house, examples; `samples.md` → gold-standard lines |
| 10 | Applications / touchpoints | `visual-identity/templates/` → rendered examples (carousel, etc.); list intended touchpoints from strategy constraints |
| 11 | Governance + AI-usage | orchestrator-generated → approver/contact, version + date, where assets live, and **AI-usage rules** (how generative tools may/may not be used on this brand) |

## Assembly steps

1. Verify each source exists. For any missing source (e.g. user used `stop_after`), include
   the section with a clear `*(not yet built — run {skill})*` placeholder rather than omitting
   it silently, so the book's structure stays complete and the gap is visible.
2. Build `brand-book.md` with a cover (brand name, essence, date), a contents list, then the
   11 sections in order. Keep it faithful to the locked sources.
3. Run the orchestrator-written prose (story framing, section intros, governance, AI-usage)
   through `tool-humanizer` (`deep` if `voice-profile.md` exists). Sub-skill content is
   already humanized — don't double-process it.
4. Render to PDF via `tool-pdf-generator`; on success copy to `~/Downloads/` and show the
   absolute path. On failure, keep the markdown as the deliverable and report the render error.

## AI-usage section (section 11) — what to include

Modern brand books carry an AI-usage policy alongside logo and colour. Generate a short,
brand-specific policy: which AI tools are sanctioned for visuals vs copy, that AI output must
be checked against this strategy and the positioning statement before publishing, that the
brand's distinctiveness is human-directed (AI proposes, a human curates), and where the
brand's locked assets live (`brand_context/`).
