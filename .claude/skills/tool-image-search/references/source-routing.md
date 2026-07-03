# Source routing

How the skill chooses which engine to query for a given intent.

## Decision tree

```
intent (explicit or detected) ──► engine chain (tried in order until count hit)

stock   ── unsplash? ─► pexels? ─► openverse ─► [bing if --allow-scraping]
brand   ── wikimedia ─► openverse
news    ── [bing if --allow-scraping] ─► openverse
meme    ── imgflip ─► openverse
```

`unsplash?` / `pexels?` only fire when `UNSPLASH_ACCESS_KEY` / `PEXELS_API_KEY`
is set. Otherwise they are skipped silently.

## Why this order

- **Stock**: when keys exist, Unsplash and Pexels produce the cleanest
  editorial photos (curated, no watermarks, full-res). Openverse is the
  no-key floor — it aggregates Flickr + Wikimedia + Smithsonian, but quality
  is variable. Bing scraping is the long-tail fallback when stock services
  don't have the exact subject.

- **Brand**: Wikimedia has the canonical SVG logos for most major companies
  in the public domain or under CC-BY-SA. That's almost always what the user
  wants. Openverse provides photo references (e.g. "NVIDIA logo on a
  Quadro card") when a vector logo isn't enough.

- **News**: Openverse is sparse for recent events. Bing has the coverage but
  requires scraping. If `--allow-scraping` is off, the skill warns rather
  than silently returning a weak result.

- **Meme**: Imgflip's top-100 endpoint is the cleanest source for canonical
  templates (Drake Hotline Bling, Distracted Boyfriend, etc.). If the meme
  isn't in the top 100, fall back to Openverse and accept noisier results.

## Auto-intent detection

When `--intent auto` is passed, the skill applies simple heuristics on the
query string:

| Trigger                            | Intent picked |
| ---------------------------------- | ------------- |
| Contains "logo", "icon of", "brand mark" | brand   |
| Contains "meme", "template meme"   | meme          |
| Contains a year 2024–2039          | news          |
| Default                            | stock         |

These heuristics are intentionally conservative. When the model has clear
intent in the prompt context, pass `--intent` explicitly to skip detection.

## Forcing a single engine

For debugging or when you know exactly what you want, use `--engine` to
bypass routing entirely:

```bash
uv run scripts/search.py --query "openai logo" --engine wikimedia
```

This is also the right move when comparing engine coverage for a query.
