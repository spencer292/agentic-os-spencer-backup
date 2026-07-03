# Brand Overlay Convention

The standard All The Power overlay for every studio clip. **Always apply `scripts/brand_overlay.py`
as the final pass** — never hand-roll white-Montserrat overlays. Validated 2026-06-14 on the Spencer
film after Roy's two notes ("tagline can't be bigger than the brand font" + "the logo gets lost at the end").

## What it does
1. **Opening lower-third title** in **BN Dime Display** (the brand display font), size 52 — controlled,
   never oversized, never centred on a face.
2. **Corner ATP mark** through the body (`atp-icon-square-150-light.png`, 150px, bottom-right).
3. **Clean brand END CARD** on the final ~2.3s: a solid **Night Sky `#333538`** background, the ATP
   logo centred and high-contrast (400px), the tagline beneath in **Light Green `#B9B47B`**
   (BN Dime Display, size 60). The brand *lands* instead of fading out in a corner.

## Brand tokens (encoded in the script)
| Token | Value | Use |
|-------|-------|-----|
| Display font | **BN Dime Display** (`brand_context/fonts/BNDimeDisplay.otf`) | all overlay text |
| Night Sky | `#333538` | end-card background |
| Light Green | `#B9B47B` | end-card tagline |
| Sky | `#E4EAE8` | lower-third title |
| Logo | `…/ALL THE POWER LOGO/PNG/atp-icon-square-150-light.png` | corner + end card |

## Usage
```bash
# run from repo root; relative paths only (ass filter breaks on C:\ absolute paths)
python .claude/skills/00-video-studio/scripts/brand_overlay.py \
  --in  projects/00-video-studio/runs/{job}/reel_music.mp4 \
  --out projects/00-video-studio/runs/{job}/reel.mp4 \
  --title "Living the life we love"          # opening + end-card line (or --end-tagline to differ)
# talking-head clips that shouldn't carry a full end card:
#   add --corner-only  (keeps the corner mark, skips the brand card)
```

## Rules
- **Every assembly/highlight reel gets the full treatment** (title + corner + end card).
- **Talking-head shorts:** corner mark always; end card optional via `--corner-only` if the clip ends
  on a strong spoken payoff you don't want to cover.
- Title text is the theme/tagline line. Keep it short (it's a brand line, not a caption).
- Do not exceed the script's sizes — the whole point of the convention is restraint so the brand,
  not the text, is what's remembered.
