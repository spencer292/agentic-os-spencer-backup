# Core Web Vitals fix playbook

Ordered by impact and dependency, never by effort. Work top down inside each section. A fix marked "structural" changes how the page is built, so it lands after the cheap wins that do not conflict with it. A fix marked "reversible" can be undone with one deploy, so ship it first and measure.

Sources checked September 2026 are listed at the end.

---

## Part 1: platform-independent, in dependency order

These apply everywhere. Do these before reaching for a platform trick.

### Diagnose before you fix

1. **Read field data first, not the score.** The Lighthouse performance score is a weighted lab composite. Google ranks on CrUX field data at the 75th percentile over a rolling 28-day window. A page can score 45 in the lab and pass in the field, or score 92 and fail. Blocking, reversible, do first.
2. **Split mobile from desktop.** They are separate CrUX records and they usually fail for different reasons. Mobile fails on CPU, desktop fails on layout. Never average them.
3. **Check whether CrUX has URL-level data for the page.** If it does not, the report falls back to origin-level, which is the sitewide average and will hide one slow template. Say so in the report rather than treating an origin number as a page verdict.
4. **Find the single worst metric and fix that.** Passing needs all three. Two good metrics and one poor metric is a fail, so effort spent on an already-good metric is wasted.

### LCP, the loading metric

Ordered by how often each is the actual cause.

1. **Find the LCP element.** Almost always the hero image or the first block of heading text. Everything below is scoped to that one element. Blocking.
2. **Remove the LCP image from lazy loading.** `loading="lazy"` on the hero is the single most common self-inflicted LCP failure. Reversible, do first.
3. **Add `fetchpriority="high"` to the LCP image and preload it.** Tells the browser to fetch it before the rest of the waterfall. Reversible.
4. **Cut render-blocking CSS and JavaScript in the head.** Inline the critical CSS, defer the rest. This is the largest single lab saving on most content sites. Moderate risk, needs a visual check.
5. **Serve the hero as AVIF or WebP at the rendered size.** A 3000 px image displayed at 800 px wastes the whole download. Reversible.
6. **Fix TTFB if it is over 800 ms.** Cache the HTML at the edge, or cache the slow database query behind it. Structural, do after the front-end wins, because a slow front end masks the gain.
7. **Remove client-side rendering from the above-fold region.** If the hero only appears after JavaScript runs, LCP can never beat the bundle. Structural, do last.

### INP, the responsiveness metric

INP is the hardest of the three to pass and the one most often broken by things the site owner did not write. Lab has no INP figure, so use Total Blocking Time as the proxy and confirm in the field.

1. **Audit third-party tags first.** Chat widgets, consent banners, A/B testing snippets, heatmaps, ad pixels and social embeds attach event listeners that run on every interaction. One badly written consent banner can add 200 ms to every click on the page. Blocking, and reversible one tag at a time.
2. **Delete tags nobody reads.** The fastest INP fix is usually removal, not optimisation. Reversible.
3. **Load the rest late.** Anything not needed for the first interaction loads after the page is interactive, or on user intent such as a click on the chat bubble. Reversible.
4. **Break up long tasks.** Any main-thread task over 50 ms blocks input. Yield with `scheduler.yield()` where supported, `await new Promise(r => setTimeout(r, 0))` otherwise. Moderate risk.
5. **Move heavy work out of the event handler.** Update the visible state first, paint, then do the expensive work. The user sees a response immediately.
6. **Cut hydration cost.** Full-page hydration re-runs the whole component tree after load, producing long tasks exactly when people start clicking. Move to selective hydration: server components, islands, or partial hydration. Structural, do after the tag audit, because the tag audit is often enough on its own.
7. **Debounce input handlers and avoid layout thrash.** Reading a layout property after writing one inside a handler forces a synchronous reflow.

### CLS, the stability metric

1. **Give every image and video explicit width and height, or an aspect ratio box.** Reversible, do first.
2. **Reserve space for anything injected late:** ad slots, cookie banners, review widgets, embedded video. Reversible.
3. **Fix font swap shift.** Use `font-display: swap` with metric overrides (`size-adjust`, `ascent-override`) so the fallback occupies the same space as the web font. Reversible.
4. **Never insert content above existing content** after load, unless it is in response to a user action.
5. **Animate only `transform` and `opacity`.** Animating `top`, `left`, `width` or `height` shifts layout on every frame.

---

## Part 2: platform playbooks

### Next.js 16

Turbopack is the default bundler in 16 and it speeds up builds. It does not change runtime Core Web Vitals, so do not expect an upgrade alone to move LCP, INP or CLS.

| Order | Fix | Why |
|---|---|---|
| 1 | `next/image` for every image, with `priority` on the LCP image | Generates the srcset, reserves space so CLS stays flat, and lifts fetch priority on the hero |
| 2 | Remove `priority` from everything that is not the LCP element | Several priority images compete and none of them wins |
| 3 | `next/font` instead of a Google Fonts stylesheet link | Self-hosts the file, removes the third-party connection, and emits metric overrides that keep font swap from shifting layout |
| 4 | `next/script` with `strategy="afterInteractive"` for tags that must run, `lazyOnload` for chat and heatmaps | Keeps third-party JavaScript off the critical path, which is the main INP lever here |
| 5 | Move analytics and logging writes into `after()` | Runs work after the response is streamed, so it stops inflating TTFB |
| 6 | Convert interactive-only leaves to client components, keep the rest server components | Cuts the hydration payload, which is the second most common INP cause |
| 7 | `dynamic()` with `ssr: false` for below-fold heavy widgets such as maps, charts and video players | Removes them from the initial bundle |
| 8 | Check the route is not accidentally dynamic | One uncached `cookies()` or `headers()` read opts the whole route out of static rendering and TTFB jumps |

Structural, do last: if a page is fully client rendered, no amount of image tuning will fix LCP. Move the above-fold region to the server.

### WordPress

The failure pattern is consistent: a heavy theme, plugin sprawl, unoptimised images, and blocking third-party scripts.

| Order | Fix | Why |
|---|---|---|
| 1 | Audit installed plugins and remove what is unused | Page builders load their full CSS and JavaScript on every page whether or not the page uses their widgets. Reversible one plugin at a time |
| 2 | Page caching plus object caching at the host level | Turns a slow PHP render into a static HTML response, which is the TTFB fix |
| 3 | A caching or optimisation plugin for critical CSS, deferred JavaScript and unused CSS removal | Attacks render-blocking. Needs a visual regression check on every template |
| 4 | Image conversion to WebP or AVIF plus correct `srcset` | Media libraries are full of full-size uploads served at thumbnail dimensions |
| 5 | Disable lazy loading on the hero image in the theme template | WordPress lazy-loads by default, which sabotages LCP on the one image that must not be lazy |
| 6 | Move tag manager, chat and review widgets to load on interaction | The INP fix. Third-party tags dominate INP on WordPress |
| 7 | Replace the page builder with a block theme | Structural and disruptive. Only after the above have been measured, because they often get the site over the line without it |

### Gatsby (legacy)

Gatsby sites in 2026 are usually maintained rather than grown, so favour reversible fixes and avoid a framework upgrade unless the site is being rebuilt anyway.

| Order | Fix | Why |
|---|---|---|
| 1 | `gatsby-plugin-image` with `loading="eager"` on the hero | The v2 `gatsby-image` component lazy-loads everything including the LCP element |
| 2 | Remove unused plugins from `gatsby-config.js` | Each one adds to the bundle whether or not the site uses it |
| 3 | Self-host fonts with `font-display: swap` and metric overrides | Removes the third-party font connection |
| 4 | Defer or remove third-party scripts, use `gatsby-script` with `strategy="idle"` | The INP lever |
| 5 | Audit the GraphQL page queries for over-fetching | Large page data JSON files download on every navigation |
| 6 | Decide whether to migrate | Structural. A framework whose ecosystem has slowed is a poor place to invest deep performance work. Price the migration against the remaining fixes rather than optimising indefinitely |

### Webflow

You control the markup and the custom code, not the build pipeline. That shapes what is possible.

| Order | Fix | Why |
|---|---|---|
| 1 | Remove or defer custom code embeds in the site-wide head | This is where almost all Webflow INP damage lives |
| 2 | Set images to load "eager" on the hero and "lazy" everywhere else in the element settings | Webflow lazy-loads by default |
| 3 | Upload images already sized and compressed | Webflow serves responsive variants but cannot fix a 4 MB source file |
| 4 | Cut Webflow Interactions above the fold | Each interaction adds JavaScript that runs before the page settles, and animating layout properties causes CLS |
| 5 | Move third-party embeds (chat, forms, reviews) below the fold or behind a click | The INP lever |
| 6 | Replace heavy embedded video with a click-to-load poster image | A single embedded player can outweigh the rest of the page |
| 7 | Trim unused symbols and interactions from the project | The site-wide JavaScript bundle is generated from everything in the project, not just what the page uses |

### Shopify

The platform serves assets from a global edge with HTTP/3, so the gap is almost never the CDN. It is apps and theme code.

| Order | Fix | Why |
|---|---|---|
| 1 | Audit installed apps and uninstall the dead ones | Apps inject JavaScript globally, including on pages that never use them. This is the biggest single lever and it is reversible |
| 2 | Remove leftover script tags from uninstalled apps | Uninstalling an app does not always remove its injected snippet from the theme |
| 3 | Move reviews, chat and tracking pixels to load on interaction or below the fold | INP on Shopify is dominated by third-party app scripts |
| 4 | Fix the hero image: correct dimensions, modern format, eager load, `fetchpriority="high"` | The standard LCP fix, and product and collection heroes are usually the LCP element |
| 5 | Remove nested Liquid loops over full collections | Inefficient Liquid inflates TTFB and it is fixable in the theme with no external tooling |
| 6 | Reserve space for app-injected blocks such as review stars and badges | The main CLS cause on product pages |
| 7 | Trim theme features you do not use, or move to a lighter theme | Structural. Feature-heavy themes ship JavaScript for every feature regardless of use |

---

## Part 3: what to re-measure, and when

State this in every report, in CrUX-window terms rather than effort terms.

- **Lab re-run: immediately.** Re-run Lighthouse right after the deploy. It confirms the change did what you intended. It does not confirm users feel it.
- **Real user monitoring: from the first day.** A `web-vitals` script reporting to your analytics gives you your own field data without waiting for CrUX. This is the only way to see INP change quickly, because lab has no INP at all.
- **CrUX field data: after the window turns over.** CrUX reports the 75th percentile across a rolling 28-day window. A fix shipped today enters the window tomorrow and only fully replaces the old experience once 28 days of post-fix traffic have accumulated. Expect movement to begin after roughly a quarter of the window and to settle at the full window.
- **Do not re-judge inside the window.** A partial reading during the transition mixes pre-fix and post-fix sessions and will understate the improvement. If someone needs an earlier answer, give them the real user monitoring number and say plainly that CrUX has not turned over yet.
- **Low-traffic pages may never get URL-level CrUX.** They inherit the origin record. For those, real user monitoring is the only page-level field signal you will get.

---

## Sources

Checked September 2026.

- Core Web Vitals thresholds and the 75th percentile over a 28-day window: https://web.dev/articles/vitals and https://developer.chrome.com/docs/crux/methodology
- CrUX API metrics, form factors and rate limit: https://developer.chrome.com/docs/crux/api
- PageSpeed Insights API v5 parameters and response shape: https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed
- PageSpeed Insights API quota and key setup: https://developers.google.com/speed/docs/insights/v5/get-started
- Lighthouse CLI flags: https://github.com/GoogleChrome/lighthouse and https://developer.chrome.com/docs/lighthouse/overview
- INP causes, third-party tags, long tasks and hydration: https://web.dev/articles/optimize-inp and https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide
- Next.js image, font, script and `after()` guidance: https://nextjs.org/docs
- WordPress failure pattern, page-builder weight and caching: https://www.corewebvitals.io/core-web-vitals/wordpress-guide
- Shopify app and theme bottlenecks, edge and HTTP/3 state: https://www.corewebvitals.io/core-web-vitals/shopify-guide
- Webflow INP pattern: https://www.pravinkumar.co/blog/core-web-vitals-inp-webflow-optimization-2026
