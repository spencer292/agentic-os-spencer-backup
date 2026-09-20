# Brand Deck — data contract

`deck-renderer.js` is generic and brand-agnostic. It renders one `brand-deck.json` into a
designed 16:9 guidelines deck. Build the JSON by **transcribing the locked `brand_context/`
files** — never invent values. Every field is optional; a slide is skipped if its data is
absent, so partial brands still render cleanly.

## Asset paths
Image fields (`logo_cover`, `logos.*.img`, `actions[].img`) are paths **relative to the
`brand-deck.json` file's own directory** (or absolute). Assets are inlined as base64 at render
time, so the PDF is self-contained. Put the JSON in `{brand_context}/` and reference
`visual-identity/...` paths.

## Asset prep — downscale mockups first (REQUIRED for image-heavy decks)
The deck inlines every asset as base64. Full-res AI mockups (2000–2752px, 1–5 MB each) push the
HTML past ~40 MB, and Chrome's `--print-to-pdf` then **silently emits a blank ~24 KB PDF**. Before
rendering, downscale the `actions` mockups and point the JSON at the lightweight copies (keep the
full-res originals — they're production deliverables):
```bash
python optimize-actions.py {brand_context}/visual-identity/brand-in-action/deck \
  {brand_context}/visual-identity/brand-in-action/*.png  # + any template/card images
# then set actions[].img to the .jpg copies in brand-in-action/deck/
```
Caps the long edge at 1400px, flattens alpha onto warm white, re-encodes JPEG q88 (~32 MB → ~2 MB).

## Render
```bash
node deck-renderer.js --data {brand_context}/brand-deck.json --out {scratch}/deck.html
chrome --headless=new --disable-gpu --no-pdf-header-footer \
  --run-all-compositor-stages-before-draw --virtual-time-budget=20000 \
  --print-to-pdf={brand_context}/brand-deck.pdf "file:///{ABS_WINDOWS_PATH}/deck.html"
```
`--assets DIR` overrides the asset base dir (defaults to the JSON's dir).

**Windows/MSYS gotcha:** the `file://` URL must be a real Windows path (`file:///C:/Users/.../deck.html`).
A bash/MSYS `/c/Users/...` path inside the URL is **not** auto-converted and Chrome opens nothing →
blank ~24 KB PDF. Build it with `URL="file:///$(cygpath -m "$SCRATCH/deck.html")"`. Verify the PDF is
real (>1 MB / expected page count), not the blank stub.

## Fields → source file

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `orientation` | string | run context | `"portrait"` (default, A4 1000×1414) or `"landscape"` (16:9 1280×720). Portrait is the house default |
| `brand` | string | brand-strategy | required |
| `essence` | string | brand-strategy → Essence | |
| `founders`, `version`, `date`, `studio` | string | run context | cover meta |
| `ink` | hex | design-tokens | deck text colour; defaults to darkest palette colour |
| `accent` | hex | design-tokens | deck chrome accent (rules, numbers). Set explicitly when the dominant palette colour is light (e.g. white-led brands) so the chrome isn't washed out |
| `logo_cover` | path | visual-identity | cover lockup; falls back to `logos.primary.img` |
| `story` | string | brand-strategy → Brand story | "the brand" slide |
| `adjectives_line` | string | strategy personality | e.g. "Warm · Deep · Grounded" |
| `adjectives` | `[{word, def}]` | strategy personality / 3 brand adjectives | the foundations slide |
| `purpose`, `vision`, `mission` | string | strategy MVV | |
| `values` | `[{name, def}]` | strategy values | grid of 3-6 |
| `positioning` | string | brand-strategy → positioning statement | hero slide (our differentiator) |
| `logos` | `{primary,secondary,mark}` each `{img, usage, clearspace?, minsize?}` | visual-identity | primary gets clear-space diagram |
| `logo_donts` | `[string]` | visual-identity misuse | incorrect-usage grid |
| `colour_ratio` | string | design-tokens | e.g. "60 / 30 / 10" |
| `colour_ratio_note` | string | design-tokens | usage sentence |
| `colours` | `[{name, role, hex, cmyk?}]` | design-tokens | role ∈ Primary/Secondary/Accent/Neutral; CMYK auto-computed from hex if omitted |
| `colour_pairing` | `[{name, bg, use}]` | design-tokens | "what sits on what" |
| `type` | `[{role, name, desc, sample, css_font?, weight?}]` | design-tokens | `css_font` renders the live specimen (use a web-safe analog if the brand font isn't installed) |
| `type_donts` | `[string]` | type best-practice | incorrect-usage grid |
| `voice` | `{oneline, coordinates, leanInto[], avoid[], ritual?}` | voice-profile | our differentiator — keep it |
| `imagery` | `{do[], dont[]}` | visual-direction / icp | art-direction do/don't |
| `actions` | `[path \| {img, platform?, caption?}]` | visual-identity/brand-in-action + templates | brand-in-action gallery — framed, **uncropped** (object-fit contain), `platform` shows as a chip ("YouTube", "Instagram", "Podcast"…). Paginates 6 per slide into a 2×3 grid. Aim for a real spread of placements, not 1-2 |
| `governance` | string | run context | approvers, version, asset location |
| `ai_usage` | `[string]` | brand-book-assembly AI policy | modern AI-usage section |
| `closing` | string | — | "keep me safe" close |

## Slide order (auto, data-driven)
cover → contents → the brand → foundations → purpose/vision/mission → values →
**positioning** → logo primary (+clear-space) → logo variations → logo incorrect-usage →
colour palette → colour pairing → typography → type incorrect-usage → **voice & tone** →
imagery & assets → brand in action → governance & AI → closing.

Bolded slides are our additions beyond the agency benchmark — they carry the strategic/verbal
depth the visual-led benchmark lacks. Keep them.
