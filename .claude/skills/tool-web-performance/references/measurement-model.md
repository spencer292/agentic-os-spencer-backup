# The measurement model

What the numbers mean, where they come from, and the mistakes that make a performance report wrong. Read this before writing any report. Checked September 2026.

## The three Core Web Vitals

| Metric | What it measures | Good | Poor |
|---|---|---|---|
| Largest Contentful Paint | When the main content finished rendering | 2.5 s or less | over 4.0 s |
| Interaction to Next Paint | How fast the page paints a response to input | 200 ms or less | over 500 ms |
| Cumulative Layout Shift | How much visible content moves unexpectedly | 0.1 or less | over 0.25 |

Between good and poor is "needs improvement".

Interaction to Next Paint replaced First Input Delay as a Core Web Vital in March 2024. First Input Delay measured only the delay before the first interaction was handled. Interaction to Next Paint measures the full latency of the worst interaction across the whole visit, so it catches slow handlers that First Input Delay never saw. Any advice still framed around First Input Delay is out of date.

## Supporting metrics, which are not Core Web Vitals

| Metric | Good | What it tells you |
|---|---|---|
| Time to First Byte | 800 ms or less | Server and network. A high value caps how good LCP can ever be |
| First Contentful Paint | 1.8 s or less | When anything first appeared. Usually moves with LCP |
| Total Blocking Time | 200 ms or less in the lab | Main-thread blocking. The lab proxy for responsiveness |

Do not report these as pass or fail against Core Web Vitals. They are diagnostic.

## Field versus lab

This is the distinction that most performance reports get wrong.

**Field data** comes from the Chrome User Experience Report. It is real Chrome users who opted in to reporting. It is aggregated to the **75th percentile** over a **rolling 28-day window**. A page passes only when all three Core Web Vitals clear their good threshold at that percentile. This is the data Google ranks on.

**Lab data** comes from Lighthouse. It is one synthetic page load on a simulated device and network. It is reproducible, it is available for any URL immediately, and it names specific causes. It is not what Google ranks on.

Rules that follow from this:

1. **Lab has no Interaction to Next Paint.** The metric needs real interactions and Lighthouse does not interact with the page. Total Blocking Time is the stand-in. Never print an Interaction to Next Paint figure from a lab run, and never call Total Blocking Time an Interaction to Next Paint result.
2. **The Lighthouse performance score is not a Core Web Vitals verdict.** It is a weighted composite of lab metrics. A page can score 45 and pass in the field, or score 92 and fail.
3. **Field and lab disagreeing is normal.** Field reflects the real mix of devices, networks, caches and repeat visitors. Lab is one cold load on one profile. When they disagree, field decides the verdict and lab decides the fix.
4. **A single lab run is noisy.** Treat one Lighthouse number as an indication, not a measurement. Compare like for like: same tool, same version, same device profile, same machine.

## URL-level versus origin-level field data

The Chrome User Experience Report only publishes a record when a page has enough traffic to anonymise. Low-traffic pages get no URL-level record at all.

The PageSpeed Insights response reflects this in two blocks:

- `loadingExperience` is the URL-level record when one exists.
- `originLoadingExperience` is the origin-level record, which is the whole site averaged.

If a report silently falls back to origin data and presents it as the page's result, it will hide one slow template behind a fast site average. Always say which scope a number came from. The audit script labels this on every page.

## The 28-day window

CrUX reports the 75th percentile across a rolling 28-day window. This has consequences that must appear in every report:

- A fix deployed today enters the window from the next day's traffic.
- The window still contains up to 28 days of pre-fix sessions, so the number moves slowly at first.
- The reading only fully reflects the new experience once 28 days of post-fix traffic have accumulated.
- A reading taken mid-window mixes both experiences and understates the improvement. Do not re-judge inside the window.

Express re-measurement timing in window terms, never in effort or duration terms.

## Data sources

### PageSpeed Insights API v5

One call returns both field and lab data, which is why it is the default in this skill.

```
GET https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed
```

| Parameter | Values | Notes |
|---|---|---|
| `url` | required | The page to analyse |
| `strategy` | `mobile` or `desktop` | Defaults to desktop. Always set it explicitly |
| `category` | `performance`, `accessibility`, `best-practices`, `seo` | Repeatable. Performance only unless you need more |
| `locale` | e.g. `en_GB` | Affects returned text only |
| `key` | API key | Optional but strongly recommended |

Response fields the script reads:

- `loadingExperience.metrics` and `originLoadingExperience.metrics`, keyed `LARGEST_CONTENTFUL_PAINT_MS`, `INTERACTION_TO_NEXT_PAINT`, `CUMULATIVE_LAYOUT_SHIFT_SCORE`, `EXPERIMENTAL_TIME_TO_FIRST_BYTE`, `FIRST_CONTENTFUL_PAINT_MS`. Each carries `percentile` and `category`.
- **Cumulative Layout Shift arrives multiplied by 100** so it can travel as an integer. Divide by 100 or every CLS figure will be a hundred times too large.
- `lighthouseResult.categories.performance.score`, a 0 to 1 float.
- `lighthouseResult.audits`, keyed by audit id.

**Quota.** With a key you get a generous daily allowance tied to your own Google Cloud project. Without a key, calls draw on a single shared anonymous project used by every keyless caller worldwide. That shared allowance is regularly exhausted, and when it is, every keyless call returns HTTP 429 no matter how few you make. Retries do not help. Both API hosts resolve to the same consumer project, so switching host does not help either. Set `PAGESPEED_API_KEY` before depending on this API.

Get a key from the Google Cloud console: create a project, enable the PageSpeed Insights API, create an API key credential. It is free.

### CrUX API

Field data only, no lab data. Use it when you want the histogram distribution rather than just the 75th percentile, or when you want origin trends without running Lighthouse.

```
POST https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=KEY
```

Body takes `url` or `origin`, an optional `formFactor` of `DESKTOP`, `PHONE` or `TABLET`, and an optional `metrics` array from `largest_contentful_paint`, `interaction_to_next_paint`, `cumulative_layout_shift`, `first_contentful_paint`, `experimental_time_to_first_byte` and `round_trip_time`.

Each metric returns a `histogram` of three density buckets and `percentiles.p75`. The record carries a `collectionPeriod` with `firstDate` and `lastDate`, which is how you confirm the window. Rate limit is 150 queries per minute per Google Cloud project, at no cost. A key is required.

There is a companion CrUX History API that returns weekly data points going back roughly six months. Use it when you need a trend line rather than a snapshot.

### Lighthouse CLI

The fallback when a page is not publicly reachable, or when the PageSpeed quota is gone.

```bash
npx lighthouse <url> --only-categories=performance \
  --form-factor=mobile --screenEmulation.mobile \
  --throttling-method=simulate \
  --output=json --output-path=out.json \
  --chrome-flags="--headless=new"
```

Use `--preset=desktop` for the desktop profile instead of the two mobile flags.

**Lighthouse 13 changed the audit shape.** Most `opportunity` audits, which carried `details.overallSavingsMs`, were replaced by `*-insight` audits which carry a `metricSavings` map instead, for example `{"FCP": 650, "LCP": 650}`. Parsers written against Lighthouse 12 silently return no opportunities on Lighthouse 13 output. Read `metricSavings` and fall back to `details.overallSavingsMs`, which is what `cwv-audit.mjs` does.

Useful Lighthouse 13 audit ids: `long-tasks`, `layout-shifts`, `cls-culprits-insight`, `render-blocking-insight`, `forced-reflow-insight`, `network-dependency-tree-insight`, `third-parties-insight`, `image-delivery-insight`, `cache-insight`, `font-display-insight`, `legacy-javascript-insight`, `duplicated-javascript-insight`, `modern-http-insight`.

**On Windows**, chrome-launcher frequently prints `EPERM, Permission denied` while removing its own temp profile after a successful run. The JSON is already on disk. Check the file exists rather than trusting the exit code.

### Real user monitoring

Neither the field APIs nor the lab tool gives you a fast read on Interaction to Next Paint for your own changes. The `web-vitals` library reporting to your existing analytics does. It is the only way to see the metric move before the CrUX window turns over, and the only page-level field signal available for low-traffic pages.

## Sources

All checked September 2026.

- https://web.dev/articles/vitals
- https://developer.chrome.com/docs/crux/methodology
- https://developer.chrome.com/docs/crux/api
- https://developer.chrome.com/docs/crux/history-api
- https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed
- https://developers.google.com/speed/docs/insights/v5/get-started
- https://developer.chrome.com/docs/lighthouse/overview
- https://web.dev/articles/optimize-inp
