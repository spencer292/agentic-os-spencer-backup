---
name: tool-web-performance
description: >
  Core Web Vitals and page-speed audit of a live site, with a platform-specific fix
  playbook. Pulls real-user field data from the Chrome User Experience Report and lab
  data from Lighthouse through the PageSpeed Insights API, scores every page against
  the LCP, INP and CLS thresholds, names the pattern that is failing sitewide, and
  returns an ordered fix list for Next.js, WordPress, Gatsby, Webflow or Shopify.
  Use when the user says "site speed", "page speed", "how fast is this site",
  "Core Web Vitals", "CWV audit", "performance audit", "why is my site slow",
  "LCP", "INP", "CLS", "PageSpeed score", "Lighthouse score", "failing Core Web
  Vitals", "speed up the site", "the site feels sluggish", "improve load time",
  "did the speed fix work". Do NOT use for conversion audits, accessibility audits,
  security headers, SEO keyword work, or profiling application server code.
---

# Web Performance

Measure a site against Core Web Vitals, explain why it fails, and hand back an ordered fix list for the platform it is built on.

Two data sources, and the difference matters. Field data is real Chrome users at the 75th percentile over a rolling 28-day window, which is what Google ranks on. Lab data is one synthetic Lighthouse run, which is what tells you where to look. Lab produces no INP figure at all. Never present a lab number as a Core Web Vitals verdict.

## Outcome

A report at `projects/tool-web-performance/{YYYY-MM-DD}_{site}-cwv.md` with a per-page scorecard, a sitewide diagnosis, an ordered fix list and a re-measurement plan. Always save it to disk and show the full absolute path. This is not optional.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## tool-web-performance` section | Past findings, accepted trade-offs, known false positives |
| `brand_context/design-system.md` | performance rules only, if present | Image, font and page-weight budgets to audit against |
| `references/measurement-model.md` | full, before writing any report | Field versus lab, thresholds, API shapes, the traps |
| `references/fix-playbook.md` | the relevant platform section | The ordered fix list |

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-behaviour-analytics` | Optional | Real user monitoring so INP changes are visible before the CrUX window turns over | Wait for the 28-day window, and say so in the report |
| `str-cro-audit` | Optional | Conversion context for the same pages | Report performance findings alone |

External: the PageSpeed Insights API, free, key optional but strongly recommended. Node 18 or later. Chrome only for the optional local Lighthouse fallback.

## Skill Relationships

**Upstream:** `viz-design-system` sets image, font and page-weight budgets this audit measures against.

**Downstream:** `str-cro-audit` uses the speed findings when a slow page is also converting badly. Build work consumes the fix list.

**Trigger boundaries:**
- "is this page converting" goes to `str-cro-audit`
- "is this site accessible" goes to `tool-accessibility-audit`
- "are the security headers right" goes to `tool-website-security`
- "did anything break after the deploy" goes to `tool-web-qa`
- "why is my API slow" is server profiling, not this skill

## Step 1: Load Context

Read `references/measurement-model.md` in full before anything else. Read the `## tool-web-performance` section of `context/learnings.md`. Read the performance rules from `brand_context/design-system.md` if it exists.

Establish the platform. Ask, or infer from response headers, generator meta tags and asset paths. The fix playbook is platform-specific and a generic fix list is worth far less than the right one.

## Step 2: Choose the Pages

Never audit one page and call it a site. Audit one page per template: home, a primary service or product page, a category or listing page, a blog post, and the highest-value conversion page. Templates fail differently and a site verdict needs the spread.

If the user names pages, use those. If not, pull from the sitemap with `--sitemap` and pick across templates rather than taking the first ten in order.

## Step 3: Run the Audit

```bash
node .claude/skills/tool-web-performance/scripts/cwv-audit.mjs \
  https://example.com/ https://example.com/pricing/ \
  --strategy mobile,desktop \
  --out projects/tool-web-performance/{YYYY-MM-DD}_{site}-cwv.md \
  --json projects/tool-web-performance/{YYYY-MM-DD}_{site}-cwv.json
```

| Flag | Default | What it does |
|------|---------|-------------|
| `<url> ...` | none | Pages to audit |
| `--sitemap <url>` | none | Take URLs from a sitemap or sitemap index |
| `--limit <n>` | 10 | Cap on sitemap URLs |
| `--strategy <list>` | `mobile,desktop` | Which device profiles to run |
| `--out <path>` | stdout | Markdown report |
| `--json <path>` | none | Raw parsed results |
| `--top <n>` | 5 | Opportunities listed per page |
| `--delay <ms>` | 1200 | Pause between calls |
| `--from-json <path>` | none | Build the report from local Lighthouse JSON instead of calling the API. Repeatable |

The script reads `PAGESPEED_API_KEY` from the environment or a `.env` file found by walking up from the working directory. Only the name is ever printed.

**Always run mobile and desktop.** They are separate CrUX records and they usually fail for different reasons. Mobile fails on processor time, desktop fails on layout.

## Step 4: Handle a Quota Failure

Without a key, calls draw on a single shared anonymous Google project used by every keyless caller worldwide. That allowance is regularly exhausted and returns HTTP 429 on every call regardless of how few you make. Retries and switching API host do not help, because both hosts resolve to the same project.

When that happens, say so in the report and fall back to a local Lighthouse run:

```bash
bash .claude/skills/tool-web-performance/scripts/lighthouse-local.sh \
  https://example.com/ https://example.com/pricing/ --out-dir ./lh-out

node .claude/skills/tool-web-performance/scripts/cwv-audit.mjs \
  --from-json ./lh-out/page-mobile.json --from-json ./lh-out/page-desktop.json \
  --out projects/tool-web-performance/{YYYY-MM-DD}_{site}-cwv.md
```

This is also the path for a site the API cannot reach: localhost, a preview deploy behind auth, a staging host with an IP allowlist.

The fallback is lab only. State plainly that no field data was available and that nothing in the report is a Core Web Vitals verdict. Recommend setting a key. Do not quietly present lab numbers as if they were field results.

## Step 5: Diagnose the Pattern

The per-page scorecard is the input, not the finding. Read across the pages and name the one pattern that explains most of the failure. Common shapes:

- **Mobile fails, desktop passes.** A processor problem. Look at main-thread time, long tasks and JavaScript execution, not at images.
- **The same third parties appear on every page.** Tag manager containers, chat widgets, consent banners and review embeds. Usually the largest single lever, and reversible one tag at a time.
- **Time to First Byte is high everywhere.** A caching or backend problem that caps how good LCP can get. Structural.
- **CLS fails on one device only.** Almost always images without dimensions, or something injected late.
- **One template fails and the rest pass.** Fix the template, not the site.

Check whether field data was URL-level or origin-level for each page. An origin-level number is the site average and will hide a slow template. The script labels this on every page, and the report must repeat it.

## Step 6: Build the Fix List

Read the platform section of `references/fix-playbook.md`. Order by impact and dependency, never by effort. Mark each item reversible or structural, and say what it is blocked by.

Rank whichever metric is furthest from passing first. Passing needs all three, so work spent on an already-good metric is wasted.

## Step 7: Write the Re-measurement Plan

Every report ends with this, expressed in CrUX-window terms and never in effort terms.

- Lab re-run immediately after each deploy, same tool, same version, same device profile.
- Real user monitoring from day one, because lab produces no INP at all.
- Field data only after the 28-day window turns over. A fix shipped today enters the window the next day and only fully replaces the old experience once 28 days of post-fix traffic have accumulated. Expect movement after roughly a quarter of the window and settling at the full window.
- Do not re-judge mid-window. A partial reading mixes pre-fix and post-fix sessions and understates the gain.

## Step 8: Save and Present

Save to `projects/tool-web-performance/{YYYY-MM-DD}_{site}-cwv.md` with frontmatter carrying `site`, `date`, `pages`, `strategies`, `source` and `field_data` true or false. Show the full absolute path.

Present the pass or fail verdict per device, the one-line diagnosis, and the top three fixes. Ask how the audit landed and log the answer to `context/learnings.md` under `## tool-web-performance`.

## Rules

*Updated when the user flags an issue. Read before every run.*

- 2026-09-02: built at root. Thresholds verified against September 2026 sources: LCP 2.5 s, INP 200 ms, CLS 0.1, at the 75th percentile over a rolling 28-day CrUX window.
- 2026-09-02: never print an INP figure from a lab run. Lighthouse does not interact with the page, so it has no INP. Total Blocking Time is the proxy and must be labelled as one.
- 2026-09-02: the Lighthouse performance score is not a Core Web Vitals verdict. It is a weighted lab composite. Report it as context, never as the pass or fail.
- 2026-09-02: Cumulative Layout Shift arrives from the PageSpeed API multiplied by 100. Divide by 100 or every CLS figure is a hundred times too large.
- 2026-09-02: always say whether field data was URL-level or origin-level. An origin number is the site average and hides a slow template.
- 2026-09-02: Lighthouse 13 replaced most `opportunity` audits with `*-insight` audits carrying `metricSavings` instead of `details.overallSavingsMs`. Read both.
- 2026-09-02: never carry a performance figure forward from a prior audit without re-measuring. Quote the tool, version, device profile and date beside every number. A score without its conditions is not a measurement.
- 2026-09-02: never quote human time or effort estimates. Rank by impact, risk, dependency order and reversibility. Express re-measurement in CrUX-window terms.
- 2026-09-02: audit one page per template, never one page for the whole site.
- 2026-09-02: read secrets from `.env` by name only. Never print a key value.

## Self-Update

If the user flags an issue with the output, wrong thresholds, a misread metric, a fix list in the wrong order, add a dated entry to `## Rules` immediately. Fix the skill, do not only log it.

Format: `- {YYYY-MM-DD}: {what was wrong and the rule that prevents it}`

## References

| File | Contents |
|------|----------|
| `references/measurement-model.md` | Thresholds, field versus lab, PageSpeed and CrUX API shapes, Lighthouse CLI, the traps |
| `references/fix-playbook.md` | Ordered fixes per metric, then per platform: Next.js 16, WordPress, Gatsby, Webflow, Shopify |
| `references/sample-report.md` | A real worked audit, including a quota failure and a prior claim that did not reproduce |
| `scripts/cwv-audit.mjs` | The audit engine. PageSpeed Insights API, or local Lighthouse JSON |
| `scripts/lighthouse-local.sh` | Optional local Lighthouse runner for unreachable sites or an exhausted quota |
