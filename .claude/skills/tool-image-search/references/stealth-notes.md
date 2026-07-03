# Stealth notes — why Tier 3 needs `playwright-stealth`

## The problem

Bing Images aggressively detects headless browser automation. Plain Playwright
(headless Chromium with default settings) gets degraded responses:

- First query may return normal results
- Subsequent queries return 0–1 hits, often unrelated to the query
- No CAPTCHA or visible block — Bing just degrades silently

The detection relies on well-known fingerprints:

- `navigator.webdriver === true`
- Missing/altered `chrome.runtime`
- Plugin array empty (`navigator.plugins.length === 0`)
- `Notification.permission === "denied"` in incognito-like state
- WebGL vendor strings reveal Chromium for testing
- Headless UA hint

## The fix

[`playwright-stealth`](https://pypi.org/project/playwright-stealth/) patches
these fingerprints before any page script runs. Validated 2026-05-14:

| Query                      | No stealth | With stealth |
| -------------------------- | ---------- | ------------ |
| `taylor swift eras tour`   | 0 hits     | 5 relevant hits, 784 KB sample |
| `sam altman openai keynote`| 0 hits     | 5 relevant hits, 490 KB sample |
| `elon musk neuralink 2025` | 1 wrong    | 5 hits found |

Same Chromium binary, same user-agent string, same network — only difference
is the stealth patches.

## Implementation

The skill imports stealth lazily so users who never scrape never pay the
import cost:

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

with Stealth().use_sync(sync_playwright()) as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(user_agent=BROWSER_UA, viewport={...}, locale="en-US")
    page = ctx.new_page()
    # ... goto bing.com/images/search ...
```

Fresh `new_context()` per query is **also important** — cookies accumulated
across queries trigger different heuristics on Bing. The script doesn't reuse
contexts across queries today; if batched search is added later, rotate the
context every 2–3 queries.

## Hotlink blocks on download

Even when search returns clean URLs, downloading from some hosts (Getty,
certain news publishers) needs a matching `Referer`. The script sets:

- `Referer: https://www.bing.com/` for `source=bing` hits (works in most cases)
- The original `source_url` otherwise

When direct download fails, a future improvement is to fall back to the
Bing thumbnail proxy URL (`m.turl`, captured during scrape) — that always
loads but loses resolution.

## ToS reality check

Scraping search engines violates Bing's terms of service. The skill is
designed for **personal-scale** social content composition (a handful of
images per post). Treat it accordingly:

- Don't loop the scraper at high frequency
- Don't redistribute the cached Bing pages
- Don't use Tier 3 to build a dataset for ML training
- For commercial campaigns, switch to paid stock or licensed image APIs

If you find yourself wishing for higher Tier 3 reliability, that's the signal
to provision a paid image search API (Brave Search, SerpAPI, Bing Image
Search API on Azure) instead of fighting harder against anti-bot.

## Robustness over time

The selector relies on Bing's `a.iusc` elements with a `m` attribute holding
a JSON payload. This has been stable for years. If Bing changes the markup,
update the JS in `search_bing_scrape()` — the DOM inspection probe in
`.scratch/test_stealth.py` (round-3 testing) is a good reference for
diagnosing what changed.
