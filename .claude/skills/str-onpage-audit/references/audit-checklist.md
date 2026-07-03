# Audit Checklist (per-page detail)

Reference for str-onpage-audit Step 2 — full per-pillar scoring rubric.

Each signal scored 0 / 0.5 / 1. Sum signals to pillar score. Sum pillars (weighted) to per-page score / 100.

---

## Pillar 1: Headings (weight 20%)

| Signal | 1 (Pass) | 0.5 (Partial) | 0 (Fail) |
|---|---|---|---|
| H1 unique | Exactly 1 H1 on page | — | 0 or 2+ |
| H1 matches recommended H1 from target-keywords.md | Exact match or 1-word delta | Same primary keyword but different framing | Different primary keyword |
| H1 carries disambiguation signal (if ambiguous root term) | Lawn/yard/exterminator/geo/brand present | One signal, weakly placed | None |
| H2/H3 carry secondary cluster keywords | ≥2 H2/H3 contain cluster secondary KWs | 1 H2/H3 contains | None |
| No skipped heading levels | H1→H2→H3 clean | One skip | Multiple skips |

Max: 5 signals × 1 = 5. Pillar score: (sum / 5) × 20.

## Pillar 2: Meta + Canonical (weight 10%)

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Title 50-60 chars + primary KW + brand | All three | Two of three | <Two |
| Meta description 150-160 + primary KW + value prop | All three | Two | <Two |
| Canonical correct | Points to canonical URL | — | Wrong / missing |
| OG tags (title, description, image) | All present | Some present | None |
| Twitter card | Present | — | Missing |

Max: 5. Pillar score: (sum / 5) × 10.

## Pillar 3: Schema (weight 15%)

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Correct schema type for page | Yes | Generic WebPage where Article expected | Wrong / missing |
| BreadcrumbList | Emits | — | Missing |
| Article schema with dateModified (Article-typed pages) | Both fields | datePublished only | Article missing entirely |
| FAQPage aggregation rule (multi-FAQ pages) | One combined FAQPage | Per-block emission | Missing |
| Speakable schema with cssSelector | Emits with selector array | Schema present but no selector | Missing |
| Organization schema sitewide w/ knowsAbout + hasOfferCatalog | Both fields | One | Missing |
| Person schema on author bylines + sameAs populated | Schema + sameAs | Schema only | Missing |
| JSON-LD validates (Rich Results Test) | Pass | Warnings | Errors |

Max: 8. Pillar score: (sum / 8) × 15.

## Pillar 4: Content Shape — AEO (weight 20%)

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| BLUF answer-first paragraph | 40-60 words direct answer in target query terminology | Generic prose first paragraph | No first paragraph or hallucination-prone |
| Question-format H2s (informational pages) | ≥2 H2 in question form | 1 | None |
| Stat blocks for citable numbers | StatBlock component used | Stats in prose only | No stats |
| HTML tables for comparisons | Table where comparison exists | Comparison in prose | No comparison content |
| Ordered lists for steps | `<ol>` for processes | Steps in prose | No process content |
| Verified-fact callouts above the fold (relevant pages) | All canonical_facts represented | Some present | None |
| No queries-to-avoid in title/H1/FAQ | Pass | One borderline | Multiple |

Max: 7. Pillar score: (sum / 7) × 20.

## Pillar 5: Internal Links — Per-Page Link Plan (weight 15%)

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Inbound links from related cluster pages | ≥2 | 1 | 0 |
| Outbound links to cluster pillar + related cluster page | Both | One | None |
| Anchor diversity per Rule 5 | Diverse + lawn-signal anchors | Some repeated | Single anchor dominates / disambiguation fail |
| No links to cannibalisation losers | Clean | One legacy link | Multiple |
| Hub-spoke alignment (Tier 3 → Tier 1 pillar) | Present | Indirect | Missing |

Max: 5. Pillar score: (sum / 5) × 15.

## Pillar 6: Images (weight 5%)

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Alt text descriptive | All present + descriptive | Some missing/generic | Missing or stuffed |
| Explicit width/height | All | Some | None |
| WebP format | All | Some | None |
| Hero fetchpriority="high" | Set | Hero exists, no priority | No hero or wrong setup |
| Below-fold loading="lazy" | Set | Some | None |
| og:image present + correct dim | Both | OG only | Missing |

Max: 6. Pillar score: (sum / 6) × 5.

## Pillar 7: E-E-A-T (weight 10%)

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| Author byline (Article pages) | Present | Generic byline | Missing |
| Byline links to Person schema page | Yes | Plain text byline | Missing |
| Person schema sameAs populated | LinkedIn + ≥2 others | LinkedIn only | None |
| Outbound to authority anchor | ≥1 link to Tier 1 authority from authority-strategy.md | 1 outbound but not authority | None |
| Founder/expert quote (relevant pages) | Quote with named attribution + Person schema | Generic quote | None |

Max: 5. Pillar score: (sum / 5) × 10.

## Pillar 8: Freshness + Disambiguation (weight 5%)

| Signal | 1 | 0.5 | 0 |
|---|---|---|---|
| dateModified in Article schema | Present + recent | Present but stale (>1yr) | Missing |
| Last-Modified HTTP header | Returned | — | Missing |
| Visible publish + updated date in UI | Both | Publish only | Neither |
| Disambiguation signal in title + H1 | Both | One | Neither (when needed) |

Max: 4. Pillar score: (sum / 4) × 5.

---

## Per-page total

```
score = pillar_1 + pillar_2 + pillar_3 + pillar_4 + pillar_5 + pillar_6 + pillar_7 + pillar_8
```

Max: 100.

## Sitewide score (weighted by Tier)

```
sitewide = (sum(Tier_1_scores) × 3 + sum(Tier_2_scores) × 2 + sum(Tier_3_scores) × 1)
         / (Tier_1_count × 3 + Tier_2_count × 2 + Tier_3_count × 1)
```

## Priority assignment

| Page Tier | Score | Priority |
|---|---|---|
| Tier 1 | <75 | P1 |
| Tier 1 | 75-89 | P2 |
| Tier 1 | 90+ | Defend (no fix) |
| Tier 2 | <75 | P2 |
| Tier 2 | 75+ | P3 |
| Tier 3 | <60 | P3 |
| Tier 3 | 60+ | Monitor |

Hallucination-correction surface gaps + broken canonical / cannibalisation losers + missing schema on flagship pages = always P1 regardless of overall score.

---

## Live verification scripts (Rule C)

WebFetch's text summary is unreliable for schema and Next.js image attributes. Use these one-shot scripts to verify against rendered HTML.

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

