# SEO preservation on a redesign

Applies to any build where a site already exists at the destination domain. Ranking loss is
the least reversible failure in this process, so this protocol runs at Phase 2, gates at
Phase 7, and is watched through Phase 10.

The failure mode is well documented and always the same shape: sites lose traffic after a
redesign because of missing redirects, deleted high-performing pages, broken links and
technical regressions that nobody checked for. None of those are design problems. All of
them are process problems.

---

## Step 1: Crawl the old site before anything changes

Take the snapshot while the old site is still live. It is the reference every later
comparison is made against, and it cannot be recreated afterwards.

Capture, all on one dated day:

- **Every indexed URL**, from every sitemap and every section. This inventory is the raw
  material for the redirect plan.
- **A full crawl** with a crawler that reports status codes, redirect chains, titles, metas,
  headings, canonicals and internal links.
- **Ranking ground truth.** Search Console performance data by page and by query, over a
  window long enough to be stable. Where there is no Search Console history, use whatever
  ranking export exists, including one from a previous agency.
- **Backlink profile**, at least at the level of which pages hold external links.
- **The scored baseline audit set** from Phase 1, on-page, performance, accessibility and
  security, so the rebuild has a before number.

---

## Step 2: Classify every URL by measured ranking value

Do not sort by what the business thinks matters. Sort by what the data says ranks and
converts. Every historical URL lands in one of four tiers:

| Tier | Definition | Treatment |
|---|---|---|
| Protect | Ranks independently, holds external links, or drives conversions | Keep live at its original address, verbatim, self-canonical. Take it out of navigation and the new sitemap if it is not part of the new structure, but do not move it. |
| Migrate | Real value, and a clean one-to-one equivalent exists in the new structure | 301 to the equivalent. One to one, never to a "closest match" hub. |
| Consolidate | Thin or overlapping, with a genuine parent | 301 into the parent, but only after checking it is not independently ranking. |
| Retire | No traffic, no links, no rankings | 301 to the nearest relevant page, or let it 410 deliberately if it should not exist. Never leave it 404ing by accident. |

**Never merge-redirect a cornerstone or legacy root URL.** Three merge redirects on one real
rebuild cost roughly thirty percent of impressions, measured in Search Console. If a page
ranks on its own, it stays on its own.

**Old posts that hold long-tail rankings get migrated live at their original address**, not
redirected to something similar. A lossy redirect forfeits the ranking it was meant to save.

---

## Step 3: Build the redirect map

Pattern rules first, then a hand-mapped table for whatever the patterns miss. Most large
redirect sets collapse to a handful of rules plus a tail of specific cases.

Rules for the map:

- Every changed URL gets a 301. No exceptions, no chains, no redirects to redirects.
- Redirects live in the framework config, not at the DNS or host level, so they are in
  version control and travel with the code.
- Pick one canonical host, apex or www, and redirect the other permanently in the framework
  config.
- Nothing 404s by accident. Where the new structure has no home for an old page, that is a
  decision, recorded.

**Validation is a build gate, not a spot check.** Script it: request every historical URL,
record the status and the final destination, and cross-reference against the ranking-value
tier. Zero unexplained 404s, zero chains, zero protect-tier URLs that moved.

---

## Step 4: Protect the on-page signals

The redesign wraps around the content. It does not replace it.

- **H1s match the target keyword** from the Phase 2 page-to-keyword map, exactly.
- **Titles and meta descriptions carry over** for any protect-tier page unless the keyword
  map deliberately changes them. A redesign is not a reason to rewrite a title that is
  working.
- **Body content substance survives.** Pages that rank do so because of what they say.
  Shorter and prettier is a ranking decision disguised as a design decision.
- **Canonicals are explicit and correct**, especially on the protect-tier pages kept out of
  navigation.
- **Schema is additive.** Where the old site had none, adding it is upside. Where it had
  some, do not drop types the site already earned results with.
- **Internal links carry over.** A page that lost its inbound internal links lost the reason
  it ranked. Run the internal link audit against the old graph, not just the new one.

---

## Step 5: Launch and resubmit

At the flip, and immediately after:

1. Verify by direct request that robots.txt is the production version and not the staging
   disallow-all. This is a routine and expensive mistake.
2. Verify the sitemap is live, points at the new URLs, and carries truthful last-modified
   dates.
3. Sample the redirect map by direct request across every pattern rule.
4. Confirm the certificate and the canonical host redirect.
5. Verify the property in Search Console and Bing Webmaster Tools on the production domain.
6. Submit the sitemap in both.
7. Request indexing on the priority URLs, ranked by historical keyword concentration. The
   top pages typically carry a disproportionate share of the ranking value, so attention
   goes there rather than being spread evenly.

---

## Step 6: Watch the window

For four weeks after the flip, check weekly:

| Signal | Where | What a problem looks like |
|---|---|---|
| Coverage and redirect errors | Search Console page indexing report | Redirect issues on more than one percent of URLs, which points at a mapping problem rather than noise |
| Impressions and clicks by page | Search Console performance, compared against the pre-launch baseline | A protect-tier page dropping out |
| Average position by query | Search Console performance | Movement concentrated in one cluster, which usually means a structural cause |
| Crawl errors and 404s | Server or host logs, plus a repeat crawl | New 404s appearing that the pre-launch validation did not catch |
| Core Web Vitals field data | Search Console vitals report | Nothing trustworthy until the 28-day rolling window has fully cleared the old site, so read lab numbers before then and say which you are quoting |

A dip in the first days after a flip is normal while the index resettles. A dip that does
not recover inside the window, or one concentrated in protect-tier pages, is a fault to
investigate against the redirect map, not something to wait out.

After the window closes, this folds into the quarterly keyword refresh in Phase 10, which
also reviews which Phase 2 keyword bets actually landed and feeds the corrections back into
the map.

---

## Sources

Checked September 2026.

- SEO.com, Website Redesign SEO Checklist, 2026. Pre-redesign snapshot as the reference for
  measuring wins and losses, full crawl before changes.
  https://www.seo.com/blog/website-redesign-seo/
- Shopify, Website Redesign SEO: How To Preserve Organic Traffic, 2026. Complete URL map
  with a 301 for every changed URL, no exceptions.
  https://www.shopify.com/blog/website-redesign-seo
- Boral Agency, Website Redesign SEO Checklist 2026. Redirect issues above one percent of
  URLs as the threshold that signals a mapping problem; verify staging tags are gone at
  launch; monitor Search Console for thirty days after.
  https://www.boralagency.com/website-redesign/
- NetON, SEO Checklist for Website Redesign: What to Keep, What to Change in 2026.
  Protecting pages that drive organic traffic, backlinks and conversions.
  https://www.neton.com.au/2026/07/seo-checklist-for-website-redesign-what-to-keep-what-to-change-in-2026/
- Internal, measured on a shipped rebuild: merge-redirecting cornerstone URLs cost roughly
  thirty percent of impressions, recorded in
  `C:\Claude\agent-os-v3\agentic-os\projects\briefs\website-build-process\2026-08-10_atp-website-build-guide.md`
  Part 1.3.
