# How Each AI Platform Picks Sources

Per-engine indexes, crawlers, freshness posture and local data sources. Every dated claim defers to `search-landscape-2026-09.md`, which wins on any conflict and carries the full sourcing.

**Read this second, not first.** Cross-surface correlations are high — AI Overviews to AI Mode 0.821, AI Overviews to ChatGPT 0.749, AI Mode to ChatGPT 0.769 `[S]`. **Winning one surface substantially predicts winning the others. Run one coherent program, then check per-engine.** A separate program per engine is wasted effort.

---

## The fundamentals

Every platform shares three baseline requirements:

1. **Indexed.** Each platform uses a different backend. Not indexed, not citable.
2. **Crawlable.** `[S]` 73% of sites have a crawlability issue preventing AI access — robots.txt blocks, CDN restrictions, JavaScript-render dependence. **This is the highest-return technical item and it costs nothing.** Check CDN and WAF rules, not just robots.txt.
3. **Extractable.** Systems retrieve passages, not pages. Self-contained answer blocks win.

Beyond that, Google's own position is that **no special optimization exists**: "There are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary" `[P]`. Named as unnecessary: machine-readable AI files, content chunking into tiny pieces, AI-specific rewriting, inauthentic mention-building, keyword-variation overfocus, "AEO/GEO hacks", and special schema.

---

## Per-engine table

| Engine | Index / grounding | Crawler user agents | Freshness posture | Local data sources |
|---|---|---|---|---|
| **ChatGPT** | Own search index plus licensed partners | `OAI-SearchBot` (search — allow it), `GPTBot` (training), `ChatGPT-User` (user-initiated; robots.txt "may not apply"), `OAI-AdsBot` `[P]` | `[U]` Strong recency bias claimed, no methodology behind the circulating figures | **Yelp dominant** since the 2026-07-23 OpenAI licensing deal covering reviews, ratings, photos, business details and Request a Quote. `[S]` August 2026: Yelp on 95.83% of structured business cards |
| **Perplexity** | Own index | `PerplexityBot` (search, does not train), `Perplexity-User` (user-initiated) `[P]` | `[U]` Described as the most recency-biased | `[S]` Yelp 62.1% of local directory citations. **`[P]` Perplexity documents nothing about selection or citation logic — anyone claiming to know it is inventing it** |
| **Google AI Overviews / AI Mode / Gemini** | Google Search index, retrieval-augmented generation plus query fan-out `[P]` | Googlebot governs eligibility. `Google-Extended` is **training-only**. `[U]` `Google-Agent` reportedly added 2026-03-20, ignores robots.txt by design | `[P]` Retrieves "up-to-date web pages" | `[S]` Scrapes Google Business Profile, review platforms, and unstructured citations from blogs, news, social, community pages, sponsorship listings and local association sites. **`[S]` Gemini cites Angi first; Yelp barely registers on Gemini** |
| **Copilot / Bing** | Bing index — **Bing indexation is a hard prerequisite** `[P]` | `Bingbot`. `[P]` "Bing respects all content owner preferences expressed through robots.txt" | `[P]` Microsoft guidance: keep information current | Bing Places for Business. `[U]` on its weight in Copilot local answers — free, so do it, label it unmeasured |
| **Claude** | `[U]` Never published | `ClaudeBot` (training), `Claude-User` (user-initiated), `Claude-SearchBot` (search quality) `[P]`. Supports non-standard `Crawl-delay`; robots.txt preferred over IP blocking | Not documented | Not documented. **Do not build a Brave-specific strategy** — see below |
| **Apple / Siri** | `[U]` Apple business data graph; Apple Maps also ingests Yelp | Not documented | Not documented | `[U]` Apple's business platforms were reportedly unified in April 2026 |

**Crawler IP lists for verification** — check these rather than trusting the user-agent string:

```
openai.com/searchbot.json
openai.com/gptbot.json
perplexity.com/perplexitybot.json
claude.com/crawling/bots.json
```

---

## Google AI Overviews and AI Mode

**These are two surfaces, not one.** Search Console reports them together; the strategy must not.

- **AI Overviews are organic-rank coupled.** `[S]` seoClarity, 432,000 keywords: 97% of AI Overviews cite at least one source from the organic top 20, and position-1 pages appear more than half the time. Winning them is largely a classic ranking problem plus extractable structure.
- **AI Mode is fan-out coupled.** It decomposes a prompt into multiple related searches across subtopics and data sources, then synthesizes. Coverage of the fan-out set predicts citation, not head-term rank.

**A top-10 organic ranking is a weak proxy for AI citation.** `[S]` Whitespark: it gives roughly a 25% chance of AI Overview appearance. Do not use rank as the AI metric.

**Two claims not to repeat.** The circulating "top-10-to-AI-citation overlap fell from 76% to 38%" figure is single-source and conflicts with the larger-sample seoClarity finding for AI Overviews specifically — **do not cite it as fact**. The circulating "query fan-out splits into 8–16 sub-queries" and "fan-out pages are 161% more likely to be cited" figures are `[U]`: encode the mechanism, never the numbers.

**Eligibility** `[P]`: a page must be indexed and eligible to be shown in Search with a snippet. Existing snippet controls apply because AI is built into Search — `nosnippet`, `data-nosnippet`, `max-snippet`, `noindex`.

**What Google names as effective** `[P]`: distinctive non-commodity content with unique expert or experienced takes, clear headings and sections, quality images and video with supporting text, technical requirements met, semantic HTML, sound JavaScript SEO, strong page experience, reduced duplication, effective internal linking, and — for businesses — Google Business Profile and Merchant Center.

**Distinctiveness is Google's own headline advice**, quoted: "creating content that people find unique, engaging, and helpful will have a greater impact on your website's presence in generative AI search in the long run than any other suggestion."

**Click impact.** `[S]` Zero-click reached 68% of US queries in early 2026. `[S]` Seer Interactive, 53 brands and 5.47M queries: CTR on AI Overview SERPs recovered to about 2.4% by February 2026 against roughly 3.3% on SERPs without one, and **cited pages earn about 2.1% CTR versus about 0.9% uncited on the same SERP**. That last pair is the argument for citation work: being cited roughly doubles the click rate on a SERP you cannot remove the AI Overview from.

---

## ChatGPT

Its own search index plus licensed partner data. **Allow `OAI-SearchBot`** — that is the search crawler, distinct from `GPTBot`, which is training. Blocking `GPTBot` does not remove the site from ChatGPT search, though allowing it is the better default given that brand presence in training corpora correlates with visibility.

**The Yelp deal changed local answers.** `[P]` OpenAI signed a Yelp licensing deal on 2026-07-23 covering reviews, ratings, photos, business details and Yelp's Request a Quote flow for local services. For any local business, a complete Yelp profile with Request a Quote enabled is now a tier-1 asset on par with the Google Business Profile.

**The Foursquare claim is dead.** `[S]` Steady Demand, 2,880 prompts across 12 verticals and 12 metros, 4,607 successful runs, August 2026: Foursquare at 0.00% of citations on ChatGPT's primary surface, Yelp attached to 95.83% of structured business cards. The widely repeated "Foursquare supplies ~70% of ChatGPT's local data" was wrong. The study author's own caveat is worth carrying: "partnership numbers have shelf lives."

`[S]` ChatGPT cites an average of 15 sources per response (Semrush, 126M US prompts). `[S]` 62% of AI citations are "ghost citations" where the brand goes unnamed — presence in the sources is not the same as being named in the answer, and a mention tracker measures a different thing from a citation tracker.

---

## Perplexity

Own index, always cites with clickable links.

**Perplexity documents nothing about how it selects or cites sources.** `[P]` This is the important fact about Perplexity and it is a negative one. Every circulating claim about Perplexity's preferences — FAQ schema weighting, PDF prioritization, publishing velocity, curated authority lists, time-decay algorithms — traces to trade content with no methodology. **Do not build tactics on them.** Allow `PerplexityBot`, apply the general fundamentals, and measure the result.

`[S]` Yelp accounts for 62.1% of Perplexity's local directory citations, so the local asset work transfers here.

---

## Copilot and Bing

Bing indexation is a hard prerequisite. Many sites submit to Search Console and never to Bing Webmaster Tools.

- Submit to **Bing Webmaster Tools** and use its **AI Performance** report — it is the only free source of grounding queries, the phrasing the AI actually used to retrieve a page.
- **IndexNow** is supported by Bing (Google is not a participant). Worth submitting for faster Bing indexing, which matters for Copilot citation. `[U]` on whether it materially raises citation odds — do it, label it unmeasured.
- Keep information current; Microsoft's guidance says so explicitly.

Drop the previously stated "hard 2.0-second load threshold" — it had no traceable source. Core Web Vitals guidance is unchanged and covered in `technical-infrastructure-audit.md`.

---

## Claude

`[U]` Anthropic has never published what Claude uses for search grounding. Trade content points to Brave Search as a subprocessor.

**Do not build a Brave-specific strategy.** The circulating "87% overlap with Brave top organic" figure has no reachable methodology, and the previous version of this file stated the Brave backend as fact and recommended verifying visibility at search.brave.com as a Claude tactic. That was inference presented as fact. Removed.

What is documented `[P]`: three distinct user agents — `ClaudeBot` (training), `Claude-User` (user-initiated), `Claude-SearchBot` (search quality). **Allow `Claude-SearchBot`.** Non-standard `Crawl-delay` is supported, and robots.txt is preferred over IP blocking.

`[S]` Claude holds a small share of local discovery, well behind ChatGPT and Google AI Mode. Priority accordingly.

---

## Robots policy

Allow unconditionally:

```
User-agent: OAI-SearchBot      # ChatGPT search
User-agent: PerplexityBot      # Perplexity search
User-agent: Claude-SearchBot   # Claude search quality
User-agent: Bingbot            # Copilot via Bing
User-agent: Googlebot          # Google, including AI Overviews and AI Mode
Allow: /
```

**Allow `Google-Extended` too.** `[P]` It is a Gemini **training** opt-out, not a Search or AI Overviews opt-out: it "manages whether content Google crawls from their sites may be used for training future generations of Gemini models" and does not affect Search ranking. **Blocking it does not remove pages from AI Overviews.** Blocking it buys nothing and costs training presence.

**Decide `GPTBot` and `ClaudeBot` separately, and recommend allowing them.** They are training crawlers. Blocking them does not remove the site from search surfaces, but the brand-mention correlations suggest presence in training corpora is an asset rather than a cost.

**The only real AI opt-out is the Search Console generative-AI toggle**, and it should never be enabled for a site that wants visibility. It applies collectively across AI Overviews, AI Mode and AI Overviews in Discover, with no per-feature control.

**Checking robots.txt is not enough.** CDN rules, WAF rules and JavaScript-render dependence block AI crawlers just as effectively and are invisible in robots.txt. Verify against the published IP lists above.

---

## Where to start

1. **Fix crawlability.** Free, and 73% of sites fail it. Robots.txt, CDN, WAF, render dependence.
2. **Win AI Overviews**, which means winning classic organic rank plus extractable answer-first structure. The cross-surface correlations mean this work carries into AI Mode and ChatGPT.
3. **Build fan-out coverage** for AI Mode, which is a different problem: cluster completeness rather than head-term rank.
4. **Fix the off-site surface.** For a local business that means the directory-by-engine priority in `local-seo.md`, and it is not uniform per engine.
5. **Bing Webmaster Tools**, for the grounding queries as much as for Copilot.
6. **Measure per surface** rather than assuming the engines move together, even though they mostly do.
