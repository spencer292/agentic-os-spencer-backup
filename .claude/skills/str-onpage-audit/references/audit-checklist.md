# Audit Checklist (per-page detail)

Reference for str-onpage-audit Step 1.5 (blocking gates) and Step 2 — the full per-pillar scoring rubric.

**Landscape authority:** `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` at the install root. Where this rubric and that file disagree, that file wins.

Each signal is scored 0 / 0.5 / 1. Sum the signals to a pillar score, then sum the weighted pillars to a per-page score out of 100.

Confidence keys: **[P]** primary documentation, **[S]** named study with a sample, **[U]** unverified.

---

## Blocking gates (Step 1.5) — pass/fail, not scored

Run all three before scoring. A failure records **BLOCKED** on the page and sends it to P1 regardless of the numeric score. Report the gate and the score separately; never average them.

| Gate | Applies to | Test | Fail condition |
|---|---|---|---|
| **Homograph** | Every page | Scan `<title>`, H1, every H2 and the first paragraph | "Mole" appears without a disambiguating token in the same sentence. Tokens: lawn, yard, turf, garden, ground, burrow, tunnel, molehill, trapping, pest, exterminator, *Scapanus*, ground mole, or a Western Washington geographic modifier |
| **Doorway page** | City pages only | Strip the city name from title, H1 and body | The remainder is indistinguishable from another city page. Record the stripped text and the closest-matching page |
| **Incentivized review** | Any page emitting `Review` or `AggregateRating` | Confirm reviews are genuine, any incentive is disclosed, and collection complies with the 2026-04-17 GBP policy | Undisclosed incentive, staff quotas, or asking customers to name a technician. **[P]** named violation since 2026-07-24, manual-action exposure. Provenance unconfirmed records UNVERIFIED, not PASS |

---

## Pillar 1: AI + Search Crawlability (weight 15%)

**[S] 73% of websites have crawlability issues preventing AI access** (Otterly, 1M+ citations, Jan–Feb 2026). Highest-return technical item, costs nothing, and every other pillar is worthless on a page an engine cannot fetch. This is why it runs first.

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| robots.txt allows all named agents | `Googlebot`, `Google-Extended`, `Bingbot`, `OAI-SearchBot`, `GPTBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-SearchBot`, `ClaudeBot` all permitted | One training-only agent blocked (`GPTBot` / `ClaudeBot` / `Google-Extended`) | Any search agent blocked |
| CDN / WAF does not block them | Rules reviewed and clear, **verified against the vendors' published IP ranges**, not just user-agent strings | Rules reviewed, one ambiguous rate-limit rule | Not checked, or a block found |
| No JS-render dependence for primary content | Answer block, H1, H2s and body present in the raw HTML with JavaScript disabled | Some supporting content JS-only | Primary content only appears in the rendered pass |
| HTML payload under 2MB | Under 2MB | 1.5–2MB | Over 2MB. **[P]** Googlebot fetches the first 2MB of HTML, clarified Feb 2026 |
| Indexed and snippet-eligible | No `noindex`, `nosnippet`, `data-nosnippet` or restrictive `max-snippet` on citable content | Restrictive `max-snippet` present | `noindex` or `nosnippet` on a page meant to be cited. **[P]** eligibility gate for AI Overviews and AI Mode |
| Search Console generative AI opt-out is OFF | Confirmed off (site-level, record once per audit) | Not verified this run | Opt-out enabled. **[P]** opted-out sites receive no traffic or impressions from generative AI features. **Never enable for a local-service site** |

Max 6. Pillar score: (sum / 6) × 15.

**Note on `Google-Extended`:** **[P]** it is a Gemini training opt-out only. Blocking it does not remove pages from AI Overviews or AI Mode and does not affect ranking. Recommend allowing it. **[U] `Google-Agent`** was reported added 2026-03-20 for agentic browsing and reported to ignore robots.txt by design; secondary sources only, so note it, do not score it.

## Pillar 2: Headings + Keyword Alignment (weight 15%)

| Signal | 1 (Pass) | 0.5 (Partial) | 0 (Fail) |
|---|---|---|---|
| H1 unique | Exactly 1 H1 on page | — | 0 or 2+ |
| H1 matches recommended H1 from target-keywords.md | Exact match or 1-word delta | Same primary keyword, different framing | Different primary keyword |
| H1 carries disambiguation signal | Lawn / yard / exterminator / geo / brand present | One signal, weakly placed | None. Also fails Gate 1 |
| H2/H3 carry secondary cluster keywords | ≥2 H2/H3 contain cluster secondary KWs | 1 H2/H3 contains | None |
| H2s map to fan-out sub-queries | ≥half the H2s match a sub-query in the fan-out set | Some overlap, no clear mapping | No mapping, or no fan-out set consulted |
| No skipped heading levels | H1→H2→H3 clean | One skip | Multiple skips |

Max 6. Pillar score: (sum / 6) × 15.

## Pillar 3: Content Shape — Answer-First and Fan-Out (weight 25%)

Highest-weight pillar. Passage-level extraction is what decides citation.

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Answer-first block under H1 | 40–60 words, self-contained, direct answer in the searcher's terms. **Survives being lifted out with zero context** | Direct answer but needs the surrounding text to read correctly | Generic prose, soft preamble, or no opening answer |
| Per-H2 answer block | Every H2 followed immediately by a ~40–80-word self-contained answer, then detail | Some H2s have one | Prose runs on with no per-section answer |
| One fact per sentence in answer blocks | No hedged compound sentences anywhere in the opening blocks | One or two hedged sentences | Compound, hedged prose throughout. Hedged compounds do not get quoted |
| Fan-out coverage | Every sub-query in the page's fan-out set answered on-page or one hop away | Majority covered | Under half covered |
| Extractable structured asset | ≥1 comparison table, ordered list of steps, or stat block | Content is comparison- or step-shaped but rendered as prose | None, and the content warrants one |
| Cited, attributable specifics | ≥1 specific attributable claim per major section, inline-attributed to `.gov` / `.edu` / WSU Extension or Got Moles job data | Some specifics, no attribution | Generic advice only |
| Verified-fact callouts | All applicable canonical_facts represented | Some present | None |
| Local specificity (city pages) | Says something true and particular about the city | City named but content generic | City name swapped into a template |
| No queries-to-avoid in title / H1 / FAQ | Clean | One borderline | Multiple |
| No visible TL;DR or "AI summary" box | Clean semantic HTML | — | Visible AEO furniture on the page |

Max 10. Pillar score: (sum / 10) × 25.

**Never scored:** word count. **[S]** Ahrefs, 174,048 pages: correlation between word count and AI Overview citation is **0.04**. Do not reward a page for length or penalise it for brevity. Score coverage.

**[U] on the word ranges above.** They are a working shape drawn from trade guidance, not a measured threshold. The lift-out test is the real criterion. Encode the pattern, never the numbers, and never quote the numbers to a client as a rule.

**Surface criteria (report per page, not scored as one number):**

| Surface | Criterion |
|---|---|
| Classic organic | Ranks for the primary keyword |
| Google AI Overviews | **Organic-rank coupled.** [S] seoClarity, 432,000 keywords: 97% of AI Overviews cite a top-20 source. [S] Whitespark: a top-10 rank gives ~25% chance of appearing. Needs top-20 rank **and** a liftable answer block |
| Google AI Mode | **Fan-out coupled.** [P] Google issues multiple related searches across subtopics. Measured by fan-out coverage, not head-term rank |
| Local Pack | Not won on the page. Route to `str-ai-seo-local` |

## Pillar 4: Meta + Canonical (weight 10%)

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Title 50-60 chars + primary KW + brand | All three | Two of three | Fewer than two |
| Meta description 150-160 + primary KW + value prop | All three | Two | Fewer than two |
| Canonical correct | Points to the canonical URL | — | Wrong or missing |
| OG tags (title, description, image) | All present | Some present | None |
| Twitter card | Present | — | Missing |

Max 5. Pillar score: (sum / 5) × 10.

## Pillar 5: Internal Links — Per-Page Link Plan (weight 10%)

Consumes the per-page link plan from `str-internal-links`. **[P]** Google's generative-AI guidance names effective internal linking as helpful, so cite Google rather than inference.

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Inbound links from related cluster pages | ≥2 | 1 | 0 |
| Outbound to cluster pillar + related cluster page | Both | One | None |
| Fan-out reachability | Every off-page sub-answer reachable in one hop | Most reachable | Sub-answers orphaned from this page |
| Anchor diversity per Rule 5 | Diverse, includes branded anchors | Some repetition | Single anchor dominates |
| Disambiguation guard on anchors | All anchors to ambiguous-head-term pages carry a lawn / geo / brand signal | One bare anchor | `mole removal` used bare |
| No links to cannibalisation losers | Clean, no 301 hops | One legacy link | Multiple |
| Hub-spoke alignment | Tier 3 links up to its pillar; Tier 2 links across and down | Indirect | Missing |
| City pages link up and out, not sideways | No city-to-city ring | ≤2 city-to-city links | City-to-city ring present |

Max 8. Pillar score: (sum / 8) × 10.

## Pillar 6: Schema — Correctness and Entity Binding (weight 10%)

**[S] Schema does not lift AI citations.** Ahrefs difference-in-differences, 1,885 pages adding JSON-LD against 4,000 matched controls, 2026-05-11: AI Overviews −4.6%, AI Mode +2.4%, ChatGPT +2.2%. **[P]** Google: "Structured data isn't required for generative AI search." Score for correctness, visible-content match and entity binding. **Never as a citation lever.**

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Correct schema type for the page | LocalBusiness subtype / Service / Article / BlogPosting / AboutPage as appropriate | Generic WebPage where a specific type belongs | Wrong or missing |
| Organization `sameAs` spine + `knowsAbout` | Identical `sameAs` across GBP, Yelp, BBB, Angi, Facebook, LinkedIn, YouTube, plus `knowsAbout` | Partial spine or missing `knowsAbout` | Neither. **This is the disambiguation defense and the one place schema still earns its keep** |
| Referenced `@id` pattern | Sitewide entities defined once, referenced by `@id` | Mixed | Embedded inline duplicates. Triggers "could not pick canonical entity" and the fields drift |
| BreadcrumbList | Emits on every non-root page | — | Missing |
| Article / BlogPosting with `dateModified` | Both `datePublished` and `dateModified` | `datePublished` only | Article node missing entirely |
| Person schema on author bylines | Schema with `worksFor` and `sameAs` | Schema only | Missing |
| Structured data matches visible content | Every asserted price, rating and date is on the page | Minor drift | Markup asserts what the page does not show. **[P]** a hard requirement, not an optimization |
| JSON-LD validates | Pass | Warnings | Errors |

Max 8. Pillar score: (sum / 8) × 10.

**Not scored, deliberately:**

- **FAQPage.** **[P]** FAQ rich results deprecated 2026-05-07, features removed June 2026, Search Console API data removed August 2026. Markup stays valid and earns nothing. **Score the Q&A content shape in Pillar 3 instead. Do not add FAQPage as a deliverable, do not score it, and do not recommend removing existing markup.** The old one-FAQPage-per-page aggregation rule still applies to any markup already on the site — it is a correctness note, not a scored signal.
- **Speakable.** **Optional. Never scored, never above "optional" in a recommendation.** It previously carried a full point here and was called a top-priority action in `aeo-patterns-2026.md`, both of which contradicted this skill's own 2026-05-31 rule.
- **Review / AggregateRating** is handled by Gate 3, not by a score.

## Pillar 7: Visible Freshness (weight 5%)

**[S]** AI-cited content is 25.7% fresher on average, roughly a 368-day gap (Ahrefs). 65% of AI bot hits target content from the past year (Seer, Oct 2025). **[P]** Google's retrieval targets "up-to-date web pages."

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| `dateModified` reflects a substantive change | New fact, source or example in a major section since the previous value | Minor copy edit only | Timestamp moved with no content delta, or missing |
| `Last-Modified` HTTP header | Returned and consistent with `dateModified` | Returned but inconsistent | Missing |
| Sitemap `lastmod` | Accurate and consistent with both above | Present but stale | Missing or wrong |
| Visible publish + updated dates in UI | Both | Publish only | Neither |
| 12-month substantive-change check | Changed within 12 months | 12–18 months | Over 18 months untouched. Goes to the refresh queue, not the fix queue |

Max 5. Pillar score: (sum / 5) × 5.

## Pillar 8: E-E-A-T (weight 5%)

**[P]** The September 2025 Quality Rater Guidelines edition is current; no 2026 revision found. Experience still rewards demonstrable first-hand work.

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Author byline (Article pages) | Present | Generic byline | Missing |
| Byline links to Person schema page | Yes | Plain text byline | Missing |
| Person schema `sameAs` populated | ≥2 real professional profiles | One | None |
| Outbound to authority anchor | ≥1 link to a Tier 1 authority from authority-strategy.md | 1 outbound, not an authority | None |
| Named first-hand detail | Named technician or founder detail on a real job | Generic quote | None |

Max 5. Pillar score: (sum / 5) × 5.

## Pillar 9: Images + Performance (weight 5%)

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Alt text descriptive | All present and descriptive | Some missing or generic | Missing or stuffed |
| Dimensions or aspect-ratio container | All (`<Image fill>` in an `aspect-*` parent counts) | Some | None |
| WebP format | All | Some | None |
| Hero has `priority` | Set (emits `fetchpriority="high"` + eager) | Hero exists, no priority | No hero or wrong setup |
| Below-fold `loading="lazy"` | Set | Some | None |
| og:image present + 1200x630 | Both | OG only | Missing |
| LCP | Under 2.5s | 2.5–4.0s | Over 4.0s |
| **INP (weight this highest)** | Under 200ms | 200–500ms | Over 500ms. **[S]** most commonly failed metric, ~43% of sites over threshold |
| CLS | Under 0.1 | 0.1–0.25 | Over 0.25 |
| JS payload | HTML under 2MB, critical render inside Googlebot's fetch limits | Approaching the limit | Over. Cross-references Pillar 1 |

Max 10. Pillar score: (sum / 10) × 5.

Core Web Vitals numbers come from `on_page/lighthouse/live/json`. **[P]** LCP, INP and CLS are unchanged; no new metric and no INP replacement has been announced.

---

## Per-page total

```
score = pillar_1 + pillar_2 + pillar_3 + pillar_4 + pillar_5
      + pillar_6 + pillar_7 + pillar_8 + pillar_9
```

Max 100. Weights: 15 + 15 + 25 + 10 + 10 + 10 + 5 + 5 + 5.

A page failing any blocking gate carries `BLOCKED` next to its score. The two are reported separately and never averaged.

## Sitewide score (weighted by Tier)

```
sitewide = (sum(Tier_1_scores) x 3 + sum(Tier_2_scores) x 2 + sum(Tier_3_scores) x 1)
         / (Tier_1_count x 3 + Tier_2_count x 2 + Tier_3_count x 1)
```

## Priority assignment

| Page Tier | Score | Priority |
|---|---|---|
| Any tier | BLOCKED by a gate | **P1** |
| Any tier | Pillar 1 crawlability failure | **P1** |
| Tier 1 | Under 75 | P1 |
| Tier 1 | 75-89 | P2 |
| Tier 1 | 90+ | Defend (no fix) |
| Tier 2 | Under 75 | P2 |
| Tier 2 | 75+ | P3 |
| Tier 3 | Under 60 | P3 |
| Tier 3 | 60+ | Monitor |

Hallucination-correction surface gaps, broken canonicals and cannibalisation losers are always P1 regardless of overall score.

Rank the queue by impact, risk, dependency order and reversibility. **No time or effort estimates anywhere.**

---

## Live verification scripts (Rule C)

WebFetch's text summary is unreliable for schema and Next.js image attributes. Use these one-shot scripts to verify against rendered HTML.

**Preferred first:** `on_page/instant_pages` through the shared DataForSEO client returns rendered HTML, meta, the heading tree, canonical, schema presence, broken links, redirect chains and load timing in one call. Use it as the primary extractor when the spend guard allows, and keep the scripts below as the free fallback and cross-check. Payload and spend rules are in SKILL.md § Data Sources.

### Schema extractor (any site)

Save to `_audit-tools/fetch-{slug}-schema.mjs` in the project, then `node _audit-tools/fetch-{slug}-schema.mjs`:

```js
// Fetch a live URL and dump every JSON-LD block.
const URL = 'https://{domain}/{path}/'  // edit
const html = await fetch(URL).then(r => r.text())
const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])
console.log(`Found ${blocks.length} JSON-LD blocks\n`)
blocks.forEach((s, i) => {
  try {
    const data = JSON.parse(s)
    const t = Array.isArray(data['@graph']) ? `@graph[${data['@graph'].length}]` : (data['@type'] || '?')
    console.log(`=== Block ${i+1}: @type=${t} ===`)
    console.log(JSON.stringify(data, null, 2))
    console.log()
  } catch (e) { console.log(`Block ${i+1} parse error: ${e.message}`); console.log(s.slice(0, 400)) }
})
```

### Internal-link counter (rendered HTML)

```js
const html = await fetch(URL).then(r => r.text())
// crude main extraction
const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [,html])[1]
const links = [...main.matchAll(/<a[^>]+href=["'](\/[^"'#]*)["'][^>]*>([\s\S]*?)<\/a>/g)]
const internal = links.filter(m => !m[1].startsWith('//') && !m[1].startsWith('tel:') && !m[1].startsWith('mailto:'))
console.log(`Internal links in <main>: ${internal.length}`)
internal.forEach(m => console.log(`  ${m[2].replace(/<[^>]+>/g, '').trim().slice(0, 60).padEnd(62)} -> ${m[1]}`))
```

### Image audit (Next.js source)

WebFetch can't see `next/image` runtime attributes. Read the relevant component(s):
- `src/components/blocks/HeroBlock.tsx` — verify `priority` prop on hero, `quality`, `sizes`
- `src/components/blocks/TeamCardsBlock.tsx` (or equivalent) — verify `fill` inside `aspect-[N/M]` parent + responsive `sizes`
- Any custom hero/banner — same checks

Score:
- ✅ `priority` on above-fold hero → fetchpriority=high + eager (LCP)
- ✅ `fill` + `aspect-*` parent → CLS-safe without explicit width/height
- ✅ Default `<Image>` (no `priority`) below fold → lazy by default
- ❌ Plain `<img>` without dimensions → CLS risk
- ❌ Auto-generated alt with redundant geo/service repetition → tighten

### AI crawlability probe (Pillar 1)

Robots.txt plus a JavaScript-on / JavaScript-off content diff. The user-agent list is the one scored in Pillar 1.

```js
const ORIGIN = 'https://{domain}'
const AGENTS = ['Googlebot','Google-Extended','Bingbot','OAI-SearchBot','GPTBot','ChatGPT-User',
                'PerplexityBot','Perplexity-User','Claude-SearchBot','ClaudeBot']
const robots = await fetch(ORIGIN + '/robots.txt').then(r => r.text())
console.log(robots)
for (const a of AGENTS) {
  const named = new RegExp('User-agent:\\s*' + a, 'i').test(robots)
  console.log(`${a.padEnd(20)} explicitly named: ${named}`)
}
// Named is not the same as blocked. Read the Disallow lines under each block, and under `*`, by eye.
// Then check the CDN and WAF configuration separately, against each vendor's published IP ranges.
```

Robots.txt is the least common place a block actually lives. CDN and WAF rules matching on IP or ASN will stop an agent whose user-agent string is allowed, so never conclude "crawlable" from robots.txt alone.

### Freshness probe (Pillar 7)

```js
const res = await fetch(URL, { method: 'HEAD' })
console.log('Last-Modified:', res.headers.get('last-modified'))
// Compare against dateModified in the Article JSON-LD and lastmod in sitemap.xml.
// All three should agree, and dateModified must correspond to a real content change.
```
