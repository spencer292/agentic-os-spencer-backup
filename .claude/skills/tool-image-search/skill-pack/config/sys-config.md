# tool-image-search — system config

## Environment variables

| Variable                | Purpose                                                | Required? |
| ----------------------- | ------------------------------------------------------ | --------- |
| `UNSPLASH_ACCESS_KEY`   | Enables Tier 2 Unsplash API (premium editorial stock)  | Optional  |
| `PEXELS_API_KEY`        | Enables Tier 2 Pexels API (stock + videos)             | Optional  |

Both are optional. Without them, the skill still works using Tier 1 (Openverse,
Wikimedia, Imgflip) and Tier 3 (Bing scrape, when `--allow-scraping` is set).

## Default output base

`projects/tool-image-search/{YYYY-MM-DD}/{query-slug}/`

Override per-call with `--output-dir`.

## Tunables (script defaults, edit `scripts/search.py` to change)

- `count` default: 5
- `license` default: `commercial`
- `min_width` default: 0 (no filter)
- Bing scrape wait: 3000ms after `domcontentloaded`
- Wikimedia thumb width: 1024 px
- Imgflip relevance scoring: word-overlap with template name; falls back to
  popularity order if no overlap found
