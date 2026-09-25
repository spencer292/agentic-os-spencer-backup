# Sample report: bobsbusiness.co.uk, measured 2 September 2026

Real output from this skill's scripts, kept as a worked example of what a finished audit looks like and of the two failure modes you will hit in practice: an exhausted API quota, and a prior audit whose numbers do not reproduce.

## What was run

Two URLs, mobile and desktop, four measurements in total.

- `https://www.bobsbusiness.co.uk/`
- `https://www.bobsbusiness.co.uk/cyber-awareness/`

## What happened to the PageSpeed Insights call

The first attempt was the normal path, `cwv-audit.mjs` against the PageSpeed Insights API with no key set. Every call returned HTTP 429:

```
Quota exceeded for quota metric 'Queries' and limit 'Queries per day' of service
'pagespeedonline.googleapis.com' for consumer 'project_number:583797351490'.
```

That project number is Google's shared anonymous consumer. Every keyless caller in the world draws on the same daily allowance, so it is regularly exhausted regardless of how few requests you make. Both API hosts return the same error, because both resolve to the same consumer project. Retries with exponential backoff do not help.

**The lesson for the skill:** set `PAGESPEED_API_KEY` before relying on field data. Without a key, treat a 429 as expected rather than as a fault, and fall back to `lighthouse-local.sh`. That fallback costs you the CrUX field data, which is the half that Google actually ranks on, so say so plainly in the report rather than presenting lab numbers as a Core Web Vitals verdict.

The numbers below therefore come from local Lighthouse 13.4.1 runs with simulated throttling, rendered through the same report builder via `--from-json`.

## Results

| Page | Device | Perf score | Lab LCP | Lab CLS | Lab TBT | Lab FCP |
|---|---|---|---|---|---|---|
| home | mobile | 47 | 5.74 s | 0.136 | 690 ms | 4.00 s |
| home | desktop | 80 | 1.38 s | 0.263 | 4 ms | 0.86 s |
| /cyber-awareness/ | mobile | 37 | 6.36 s | 0.167 | 770 ms | 4.55 s |
| /cyber-awareness/ | desktop | 91 | 1.51 s | 0.038 | 14 ms | 1.11 s |

Against the thresholds: mobile fails LCP outright on both pages and fails the Total Blocking Time proxy for INP on both. Desktop passes LCP and TBT everywhere, but the home page fails CLS at 0.263, past the 0.25 poor boundary.

## The Unboring claim, checked

A prior audit by Unboring reported `/cyber-awareness/` at mobile score 28 with LCP 10.9 s. That does not reproduce.

| Source | Mobile score | Mobile LCP |
|---|---|---|
| Unboring audit | 28 | 10.9 s |
| This run, 2 Sep 2026 | 37 | 6.36 s |

**Verdict: directionally confirmed, numerically corrected.** The page does fail Core Web Vitals badly on mobile, and it is the worse of the two pages tested, which is what the original audit was pointing at. The specific figures are roughly 30 percent better on score and 40 percent better on LCP than reported.

Three explanations, none of which can be separated without the original run's metadata:

1. **Different measurement conditions.** A local Lighthouse run on a fast workstation applies simulated throttling calibrated against that machine. The PageSpeed Insights service runs a fixed device and network profile. Numbers are not comparable across the two, and neither is comparable to a run on a different machine.
2. **The page may have changed** between the two audits.
3. **Lighthouse version drift.** This run used 13.4.1, which replaced most `opportunity` audits with `*-insight` audits and adjusted scoring weights.

**The general rule:** never carry a performance number forward from someone else's audit without re-measuring. Quote the tool, the version, the device profile and the date alongside every figure, as this report does. A score without its conditions is not a measurement.

## Sitewide diagnosis

One pattern explains most of the failure, and it is the same on both pages.

**Mobile is a JavaScript problem, not an image problem.** Main-thread work runs 4.3 s on the home page and 6.0 s on the cyber-awareness page. JavaScript execution alone is 1.9 s and 2.2 s. The cyber-awareness page logs 17 long tasks. Total Blocking Time of 690 ms and 770 ms is three to four times the 200 ms lab guideline, and Time to Interactive reaches 23.7 s on the worse page. Server response time is excellent throughout, between 9 ms and 53 ms, so nothing here is a hosting or backend problem.

**Two third parties account for most of it.** By main-thread time:

| Entity | Home mobile | Cyber-awareness mobile |
|---|---|---|
| Google Tag Manager | 188 ms, 492 KiB | 166 ms, 492 KiB |
| leadoo.com (chat) | 98 ms, 694 KiB | 186 ms, 1154 KiB |
| LinkedIn Ads | 10 ms, 42 KiB | 15 ms, 42 KiB |
| Trustpilot | 10 ms, 8 KiB | 7 ms, 8 KiB |

The Leadoo chat widget alone ships over 1.1 MB on the cyber-awareness page. Together the two entities move roughly 1 MB to 1.6 MB and hold the main thread for around 290 ms to 350 ms. Both are exactly the class of tag that damages INP, because they attach listeners that run on every interaction.

**Unused JavaScript is large and consistent:** 467 KiB on the home page, 654 KiB on cyber-awareness, 597 KiB on cyber-awareness desktop. Total page weight reaches 3,595 KiB on cyber-awareness mobile and 4,336 KiB on desktop, across 181 and 205 requests.

**Render-blocking requests cost 650 ms** on cyber-awareness mobile and 300 ms on the home page, both attributed to FCP and LCP. This is the largest single lab saving available and it does not require touching the third parties.

**CLS has two different causes by device.** Desktop home shifts 0.263 across 7 layout shifts, which is a fail. Mobile sits at 0.136 and 0.167, which is a warn. Images without explicit width and height are flagged on both desktop runs. Desktop cyber-awareness logs 13 layout shifts despite scoring 0.038, so the shifts are small but numerous.

## Fix list, in dependency order

Follow `references/fix-playbook.md`. Applied to this site:

1. **Audit the tag stack.** Google Tag Manager is carrying 492 KiB on every page. Open the container and remove tags nobody reads. Reversible one tag at a time, and it is the largest INP lever available here.
2. **Defer the Leadoo chat widget to user intent.** Load it on a click on the chat bubble rather than on page load. Removes up to 1.1 MB and roughly 186 ms of main-thread time from the critical path. Reversible.
3. **Eliminate render-blocking requests.** 650 ms on the worst page, attributed directly to FCP and LCP. Inline critical CSS, defer the rest. Needs a visual regression check.
4. **Give every image explicit width and height.** Flagged on both desktop runs and it is the direct cause of the 0.263 desktop home CLS fail. Reversible, and CLS is the metric closest to passing.
5. **Cut unused JavaScript**, 467 KiB to 654 KiB per page. Code-split so each page ships only what it uses. Structural, do after the tag audit, because removing tags may remove some of it for free.
6. **Reduce total page weight**, 3.6 MB mobile and 4.3 MB desktop on cyber-awareness. Convert images to AVIF or WebP at rendered size. Reversible.
7. **Review the 159 to 205 request count.** Structural, and largely a consequence of items 1, 2 and 5. Re-measure before treating it as separate work.

Note the split: mobile needs items 1, 2, 3 and 5, and desktop needs item 4. The desktop CLS fail is the closest thing to a passing metric on the site and is the least entangled fix.

## What to re-measure and when

- **Lab, immediately after each deploy.** Re-run `lighthouse-local.sh` on the same two URLs. Compare against this file as the baseline.
- **Set `PAGESPEED_API_KEY` before the next audit.** Without it there is no field data, and field data is the half Google ranks on. Nothing in this report is a Core Web Vitals verdict.
- **Add real user monitoring now.** Lighthouse produces no INP figure at all. Total Blocking Time is the stand-in and it is a proxy, not the metric. A `web-vitals` script reporting to the existing analytics is the only way to see real INP move.
- **CrUX field data after the window turns over.** CrUX reports the 75th percentile across a rolling 28-day window. A fix deployed today enters the window the next day and only fully replaces the old experience once 28 days of post-fix traffic have accumulated. Expect the field number to begin moving after roughly a quarter of the window and to settle at the full window. Do not re-judge mid-window: a partial reading mixes pre-fix and post-fix sessions and understates the gain.

## Commands used

```bash
# Intended path, blocked by the shared keyless quota on this run
node cwv-audit.mjs https://www.bobsbusiness.co.uk/ \
  https://www.bobsbusiness.co.uk/cyber-awareness/ \
  --strategy mobile,desktop --out report.md --json report.json

# Fallback that produced the numbers above
bash lighthouse-local.sh https://www.bobsbusiness.co.uk/ \
  https://www.bobsbusiness.co.uk/cyber-awareness/ --out-dir ./lh-out

node cwv-audit.mjs --from-json ./lh-out/*.json --top 6 --out report.md
```
