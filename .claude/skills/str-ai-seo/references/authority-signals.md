# Authority Signals

How to make content citable by AI systems. Every figure here is correlational and carries its confidence tier. Dated claims defer to `search-landscape-2026-09.md`, which wins on any conflict.

---

## What actually correlates with AI visibility

`[S]` Ahrefs, 75,000 brands, published 2025-12-12. Spearman correlations against AI brand visibility across ChatGPT, Google AI Mode and AI Overviews. Method: domains with Domain Rating above 40, highest-volume keyword at monthly volume of at least 800, brand mentions measured across millions of AI responses.

| Signal | ChatGPT | AI Mode | AI Overviews |
|---|:--:|:--:|:--:|
| YouTube mentions | 0.737 | 0.712 | 0.740 |
| YouTube mention impressions | 0.717 | ~0.71 | ~0.71 |
| Branded web mentions | 0.664 | 0.709 | 0.656 |
| Branded anchors | 0.511 | 0.628 | 0.527 |
| Branded search volume | 0.352 | 0.466 | 0.392 |
| Domain Rating | 0.266 | 0.285 | 0.326 |
| Branded traffic | 0.235 | 0.357 | 0.274 |
| Backlinks / URL Rating | ~0.2–0.3 | ~0.2–0.3 | ~0.2–0.3 |

**The study's own caveat, quoted:** "correlation isn't causation. We've spotted patterns between search metrics and AI mentions, but that doesn't mean improving these metrics will automatically boost your AI visibility."

**What this changes.** Off-site brand signals beat backlinks by roughly two to three times as correlates. Lead authority work with mention acquisition and treat links as a byproduct. Do not build a program whose main lever is Domain Rating — it sits below branded anchors on every surface.

**Do not manufacture mentions.** `[P]` Google names inauthentic mention-seeking as unnecessary and states its spam systems already filter what AI features depend on. A bought mention is worse than no mention because it carries filtering risk into the surface you are trying to win.

---

## YouTube is a first-class channel, not a repurposing afterthought

It is the strongest single correlate across all three Google-adjacent surfaces, and `[S]` the leading non-corporate citation source in the arXiv study, ahead of Reddit, editorial media and Wikipedia.

Where a topic is inherently visual — a process, a before-and-after, a physical problem being diagnosed — the video does double duty: it feeds the correlation above, and it serves as proof for the large majority of consumers who verify an AI recommendation before acting on it.

Practical shape: one video per major content cluster, with the brand named in the title and description, embedded on the matching page so the page carries text plus video rather than text alone. `[S/U]` Multi-format pages combining text, images and video are cited more than text-only pages; the direction is supported, the exact multiple is not.

---

## Third-party listicles

`[S]` arXiv 2606.20065, 100,000+ prompt responses, 100+ brands, March–May 2026, across ChatGPT, Claude, Perplexity and Gemini.

**Ranked "best-of" listicles are the single most-cited format at ~21% of all citations.** Inclusion in the roundups that already rank for a category outranks most link building as an authority move.

Same study, and worth carrying into expectation-setting:
- ~78% of citations go to corporate websites.
- Brand-stature tiers: global household names appear in 73% of relevant answers, mid-market brands 44%, **niche brands 11%**. That 11% is the honest baseline for a small or local brand.
- **Sentiment flips roughly 6.7x more often than mention presence.** Monitor how the brand is framed, not only whether it is named.

`[S]` Otterly, 1M+ citations: brand domains take 47.5% of citations, news 20.3%, community forums 5.9%, other 26.3%. A bit over half the citation surface is somewhere you do not control, which is the whole argument for the presence pillar.

---

## Third-party presence

AI systems cite where you appear, not just your website. **Which third parties matter is category-dependent and engine-dependent. Measure it before assuming it.**

The reliable method: run the target queries through each engine, record every source cited in the vertical, and treat recurring third-party sources as the mention target list. A citation-builder tool will not find the ones that matter most, because the highest-value ones are usually unstructured — local news, community pages, association sites, industry publications, sponsorship listings.

**For a local service business**, the directory priority order is not uniform across engines and is documented in `local-seo.md` §"Directory-by-engine matrix". The headline: Yelp dominates overall and dominates ChatGPT further since the July 2026 OpenAI licensing deal, while Angi is the Gemini lever.

**For any category:**
- Get into the ranked roundups that already appear in AI answers for your terms.
- Earn genuine editorial mentions in publications the engines already cite.
- Maintain accurate profiles wherever the brand already exists; inconsistency is how an engine fails to resolve the business at all.
- Build a YouTube presence for the visual topics.
- Where a Wikipedia entry is genuinely achievable on notability grounds it is the strongest anchor, because it feeds the Knowledge Graph and multiple training pipelines. For most small brands it is not achievable, and pursuing it is a distraction from the achievable stack.

---

## Freshness

`[S]` AI-cited content is 25.7% fresher on average than uncited content, a gap of roughly 368 days (Ahrefs). `[S]` 65% of AI bot hits target content published in the past year and 89% within three years (Seer Interactive).

**Require a substantive update, not a timestamp bump.** A `dateModified` that moves without the content changing is a correctness problem, and structured data is required to match the visible page. The working definition of a real update: at least one new fact, source or example per major section, plus an accurate `Last-Modified` header and sitemap `lastmod`.

Flag anything untouched for twelve months. Build a scheduled refresh lane alongside the publish lane rather than treating refresh as something that happens when someone remembers.

---

## E-E-A-T and the author layer

`[P]` E-E-A-T is unchanged. The September 2025 Quality Rater Guidelines edition is still current. The Experience criterion still rewards demonstrable first-hand work.

- Named authors with real, checkable credentials, not a generic company byline.
- Person schema for the author, linked from the page's Article or BlogPosting.
- First-hand detail that only someone who did the work could write. This is also what makes content quotable.
- Transparent sourcing: every statistic carries its source and its date.

`[P]` AI-generated content is not penalized for being AI-generated. Low-quality, unhelpful or manipulative content is penalized regardless of how it was produced. The policy that matters for a templated build is scaled content abuse, which applies equally to AI and human writing.

---

## The citable-statement requirement

Generic advice does not get quoted. Every substantial page should carry at least one specific, attributable, checkable claim — a number, a named method, a concrete local or operational specific.

This is the single most actionable item in this file, and it is free. A page that says "we're the best" gives an engine nothing to lift. A page that states a specific verifiable fact gives it a quotable sentence.

Pair it with the structural rule from `content-patterns.md`: one fact per sentence in the answer block. A hedged compound sentence containing a good statistic is still unquotable.

---

## Schema: what it is for, and what it is not for

**Schema is not an AI-citation lever. Never present it as one in client-facing output.**

`[S]` Ahrefs difference-in-differences test, published 2026-05-11: 1,885 pages adding JSON-LD against 4,000 matched controls produced AI Overviews −4.6%, AI Mode +2.4%, ChatGPT +2.2%. The authors' own caveats: the treated pages already had 100+ citations, so schema may still aid discoverability for pages with no visibility at all; all schema types were pooled; the windows were 30 days; JSON-LD only; effects are not fully separable from simultaneous page changes.

`[P]` Google: "Structured data isn't required for generative AI search, and there's no special schema.org markup you need to add."

**What schema still earns its keep for:** rich results where they still exist, correctness, and entity binding. Structured data must match the visible page content.

**Priority order:**

| Type | Why |
|---|---|
| `LocalBusiness`, at the most specific subtype that fits | Local eligibility and entity typing |
| `Service` | Binds the offering to the organization |
| `Organization` with the `sameAs` spine and `knowsAbout` | **The disambiguation defense.** The one place schema genuinely earns its keep |
| `BreadcrumbList` | Site structure, still a rich result |
| `Article` / `BlogPosting` with a real `dateModified` | Freshness and authorship binding |
| `Person` for the author | E-E-A-T binding |
| `Review` / `AggregateRating` | **Only where reviews are genuine and any incentive is clearly disclosed** |

**Incentivized-review warning.** `[P]` Since 2026-07-24, review-snippet guidelines name fake and undisclosed incentivized reviews as a violation: reviews not based on genuine experience, and reviews written for money, discounts, vouchers or free products without clear and prominent disclosure. This sits under star-rating eligibility and can trigger a manual action that kills review rich-result eligibility while the page still ranks. Verify before adding or keeping this markup.

**Retired, and not worth chasing:** FAQPage rich results, removed through 2026. `HowTo` desktop rich results. Seven schema types retired in June 2025. **Rankings are unaffected by these deprecations** — the loss is display real estate. Keep existing markup, stop adding it as a deliverable.

**`Speakable` is optional at best.** Never score it above optional and never present it as high-impact.

---

## What was removed from this file, and why

The previous version led with a nine-row table of percentage "visibility boosts" attributed to the Princeton GEO study, a "+115% for low-ranking sites" claim, a "schema markup shows 30-40% higher AI visibility" claim, "brands are 6.5x more likely to be cited via third-party sources", and Wikipedia and Reddit ChatGPT citation-share percentages.

Those figures were either unsourced, contradicted by later evidence with a stated sample, or already banned as unsourced by a downstream skill in this chain. The +115% figure in particular put this root skill in direct contradiction with its own child skill. They are gone rather than softened, because a percentage with no traceable methodology is worse than no number: it survives into client deliverables and cannot be defended when questioned.

The replacement standard: any figure in this file names its study, its sample, and its confidence tier, or it does not appear.
