---
title: Search Landscape — State of Play, September 2026
last_updated: 2026-09-02
scope: US local-service SEO / AEO / GEO. Written against Got Moles (mole control, Western Washington, 3 Google Business Profiles, ~90 city pages, blog); rules generalize to any local service business.
supersedes: Every per-skill "2026 reality" / "current state of search" / "GEO tactics" claim dated May–July 2026 in str-keyword-strategy, str-onpage-audit, str-internal-links, str-ai-seo-local, str-authority-strategy, str-question-harvester, mkt-authority-content, ops-blog-pipeline and root str-ai-seo. Where a skill contradicts this file, this file wins. That baseline predates Google's generative-AI guidance (2026-07-10 revision), the FAQ rich-result removal, the OpenAI–Yelp deal and the Foursquare correction.
refresh_cadence: Quarterly, or immediately on a named Google core or spam update, or a first-party announcement from Google, OpenAI, Microsoft, Anthropic or Perplexity that changes crawler policy, citation surfacing or measurement reporting.
confidence_key: >
  [P] PRIMARY — official platform documentation or first-party announcement; treat as fact.
  [S] STUDY — named study with stated methodology and sample size from an organization with a real data asset (Ahrefs, Semrush, BrightLocal, SOCi, Whitespark, Seer, Foundation/AirOps, Steady Demand, arXiv); strong evidence, correlational unless stated.
  [U] UNVERIFIED — trade content, no traceable methodology, or primary source unreachable; never a scored rule, never presented to a client as fact.
---

# Search Landscape — September 2026

Two research passes were merged to produce this file: a Google Search state-of-play pass and an AEO/GEO/LLM-visibility pass, both compiled 2026-09-02. Where the two disagree, the disagreement is stated inline rather than resolved silently.

## 1. What changed since May 2026

1. **[P] AI Mode became the default Search experience globally on 2026-05-19**, powered by Gemini 3.5 Flash, past one billion monthly users. Classic blue links still exist but are no longer the primary discovery surface. ([blog.google, 2026-05-19](https://blog.google/products-and-platforms/products/search/search-io-2026/))
2. **[P] Google published official generative-AI optimization guidance** on 2026-05-15, last updated 2026-07-10, and it contradicts most circulating GEO advice. It names llms.txt, content chunking, AI-specific rewriting, inauthentic mention-building and special schema as unnecessary. ([AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide))
3. **[P] Search Console shipped Generative AI performance reports**, announced 2026-06-03, worldwide by 2026-08-31. Impressions only, no clicks, no CTR, no queries, no API. ([Search Central, 2026-06](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports))
4. **[P] FAQ rich results are gone.** Deprecation notice 2026-05-07, search appearance and Rich Results Test support removed June 2026, Search Console API data removed August 2026. FAQPage markup stays valid and earns nothing. ([Search Central updates](https://developers.google.com/search/updates))
5. **[S] Ahrefs ran a difference-in-differences test on schema and found no citation uplift.** 1,885 pages adding JSON-LD versus 4,000 matched controls, published 2026-05-11: AI Overviews −4.6%, AI Mode +2.4%, ChatGPT +2.2%. ([Ahrefs](https://ahrefs.com/blog/schema-ai-citations/))
6. **[P] OpenAI signed a Yelp licensing deal on 2026-07-23** covering reviews, ratings, photos, business details and Yelp's Request a Quote flow for local services. This changes what feeds ChatGPT's answer to "mole removal near me." ([Search Engine Land](https://searchengineland.com/openai-yelp-deal-483326))
7. **[S] The "Foursquare supplies ~70% of ChatGPT local data" claim is dead.** 4,607 runs in August 2026 found Foursquare at 0.00% of citations on ChatGPT's primary surface and Yelp attached to 95.83% of structured business cards. ([Steady Demand, 2026-08-21](https://www.steadydemand.com/chatgpts-local-results-arent-coming-from-foursquare-and-probably-never-really-were/))
8. **[S] AI local packs show 1–2 businesses instead of 3, and the mobile local-pack call button is disappearing.** Click-to-call from GBP dropped sharply on mobile while desktop website clicks held steady, isolating the cause to UI rather than ranking loss. Single biggest commercial risk for a call-driven business. ([Sterling Sky, 2026-06-26](https://www.sterlingsky.ca/the-state-of-local-seo-in-2026/); [Search Engine Land, 2026-02-05](https://searchengineland.com/local-rankings-fine-calls-vanishing-468321))
9. **[P] GBP review policy tightened 2026-04-17** — staff review quotas and asking customers to name an employee are now explicit violations, with Gemini-powered pre-publication enforcement deployed 2026-04-16. ([Sterling Sky local changes log](https://www.sterlingsky.ca/google-local-changes/))
10. **[P] Undisclosed incentivized reviews became a named violation on 2026-07-24** in review-snippet structured data guidelines, exposing star-rating markup to manual action. ([Search Engine Land](https://searchengineland.com/google-says-dont-include-fake-or-undisclosed-incentivized-reviews-in-review-snippet-structured-data-483456))
11. **[P] GA4 added a native "AI Assistant" default channel**, announced 2026-05-13, broad availability around 2026-06-07. Google explicitly excludes its own AI Overviews and AI Mode from it. ([GA4 channel definitions](https://support.google.com/analytics/answer/9756891))
12. **[P] Microsoft shipped AI Performance in Bing Webmaster Tools**, public preview 2026-02-10, including Grounding Queries — the phrasing AI used to retrieve a page. ([Bing Webmaster blog](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview))
13. **[S] Consumer AI adoption for local discovery went vertical.** BrightLocal, 1,002 US adults, published 2026-03-10: 45% used AI to find a local business, up from 6% a year earlier, now the third discovery channel behind Google and Facebook. ([BrightLocal](https://www.brightlocal.com/research/lcrs-ai-trust/))
14. **[S] AI local visibility is far narrower than the local pack.** SOCi, ~350,000 locations: ChatGPT recommends 1.2% of locations, Perplexity 7.4%, Gemini 11%, versus 35.9% in Google's local 3-pack. ([Search Engine Land, 2026-01-28](https://searchengineland.com/ai-local-visibility-report-2026-468085))
15. **[S] Off-site brand signals beat backlinks by 2–3x as correlates of AI visibility.** Ahrefs, 75,000 brands: YouTube mentions 0.737, branded web mentions 0.664, backlinks and referring domains ~0.218–0.27. ([Ahrefs, 2025-12-12](https://ahrefs.com/blog/ai-brand-visibility-correlations))
16. **[P] Gemini is inside Maps.** Ask Maps launched 2026-03-12 in the US and India, expanded to 150+ countries by August 2026, and replaced the GBP Q&A surface. ([EFTM, 2026-08](https://eftm.com/2026/08/google-rolls-out-gemini-powered-ask-maps-to-150-countries-including-australia-279055))
17. **[P] Google will begin charging for missed and subsequent calls on Local Services Ads from 2026-10-01**, announced 2026-08-25. LSAs also migrated into the main Google Ads platform on 2026-07-21. ([Sterling Sky local changes log](https://www.sterlingsky.ca/google-local-changes/))
18. **[P] Two core updates and three spam updates ran in 2026** (March core, May core; March, June, August spam) plus a first-ever Discover-only core update in February. ([Google Search Status Dashboard](https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history))
19. **[U] Google added a new user agent, Google-Agent, on 2026-03-20** for AI systems browsing on a user's behalf. By design it ignores robots.txt. Reported by secondary sources only; the crawler documentation extract fetched 2026-09-02 did not surface it. ([nohacks user-agent reference](https://nohacks.co/blog/ai-user-agents-landscape-2026))
20. **[P] Site reputation abuse policy changed 2026-08-28/30** — four described factors replace the example list, and manual actions under this policy no longer affect searchers in the EEA. Enforcement outside the EEA is unchanged. ([Search Central, 2026-08](https://developers.google.com/search/blog/2026/08/update-site-reputation-policy))

## 2. Google Search: current state

### 2.1 AI Mode and AI Overviews rollout

- **[P]** AI Mode is the default surface globally since 2026-05-19. Google also shipped its first Search box redesign in over 25 years, accepting text, images, files, videos and Chrome tabs.
- **[P]** Classic results were not removed. Google's post says users "continue to get a range of results from Search, just like you do today."
- **[P]** From around 2026-08-27, AI Overviews dynamically expand into AI Mode responses on some queries, and the AI Mode prompt box shows by default on some queries. Hover previews now show a site preview on AI links. ([Search Engine Roundtable, 2026-08](https://www.seroundtable.com/google-ai-overviews-push-ai-mode-responses-41974.html))
- **[P]** Agentic calling rolled out across the US over summer 2026 — Google's agent phones local businesses to check price and availability. Agentic booking expanded to local experiences and services.
- **[P]** Business Agent for Leads launched at Google Marketing Live on 2026-05-20: a Gemini chat window inside Search results, grounded in the advertiser's own website copy. ([Google Brand Profile Help](https://support.google.com/brandprofile/answer/16410382?hl=en))

### 2.2 Prevalence by intent

| Query type | Surface that fires | Rate | Source |
|---|---|---|---|
| Explicitly transactional local ("mole removal Everett") | Local Pack | ~93% | [S] Whitespark 540-query study, via [SEJ](https://www.searchenginejournal.com/ai-overviews-now-answer-most-local-searches-how-to-get-your-business-cited/580757/) |
| Informational local ("how do I get rid of moles") | AI Overviews | ~92% | [S] same study |
| Hybrid ("average cost of mole removal in {city}") | AI Overviews | ~97% | [S] same study |
| Informational "near me" | AI Overviews | 76.9% | [S] [Search Engine Land zero-click study](https://searchengineland.com/google-zero-click-searches-2026-study-479717) |
| Local business queries, all types | AI Overviews 68% vs Local Pack 39% | — | [S] Whitespark, secondary reporting only |
| All tracked queries | AI Overviews | ~48% (Feb 2026, BrightEdge), up from 31% Feb 2025; range 21–48% by methodology | [U] on the exact figure |

**Click impact.** [S] Zero-click reached 68% of US queries in early 2026, up from 60.45% two years earlier. [S] Seer Interactive (53 brands, 5.47M queries, 2.43B impressions): CTR on AI Overview SERPs bottomed at 1.3% in December 2025 and recovered to 2.4% by February 2026, against ~3.3% on SERPs with no AI Overview; **cited pages earn ~2.1% CTR versus ~0.9% uncited on the same SERP**. [S] Ahrefs, 300,000 searches: organic CTR drops ~34.5% when an AI Overview is present. ([Seer](https://www.seerinteractive.com/insights/aio-impact-on-google-ctr-2026-update); [Ahrefs](https://ahrefs.com/blog/de/ai-overviews-reduce-clicks))

### 2.3 Source selection and query fan-out — Google's own words

- **[P] Two mechanisms.** Retrieval-augmented generation "relies on our core Search ranking systems to retrieve relevant, up-to-date web pages," plus query fan-out, "issuing multiple related searches across subtopics and data sources." Google's worked example is a lawn-weeds query fanning into herbicides, chemical-free removal and prevention — a direct read-across to pest control.
- **[P] Eligibility gate.** "To be eligible to be shown as a supporting link in AI Overviews or AI Mode, a page must be indexed and eligible to be shown in Google Search with a snippet." ([AI features and your website](https://developers.google.com/search/docs/appearance/ai-features))
- **[P] No special optimization.** "There are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary."
- **[P] Named as unnecessary:** machine-readable files, AI text files, markup or Markdown; breaking content into tiny chunks; rewriting in AI-specific language; chasing inauthentic brand mentions; over-focusing on keyword variations; "AEO/GEO hacks"; and special schema — "Structured data isn't required for generative AI search."
- **[P] Named as effective:** distinctive non-commodity content with unique expert or experienced takes, clear headings and sections, quality images and video with supporting text, technical requirements met, semantic HTML, JavaScript SEO practices, strong page experience, reduced duplication, effective internal linking, and — for businesses — Google Business Profile and Merchant Center.
- **[P] Controls.** Existing snippet controls apply because "AI is built into Search": `nosnippet`, `data-nosnippet`, `max-snippet`, `noindex`.

**Third-party fan-out findings — treat as hypotheses.** [S] seoClarity, 432,000 keywords: 97% of AI Overviews cite at least one source from the organic top 20, and position-1 pages appear in AI Overviews more than half the time. [U] AI Mode is much more loosely coupled, with circulating top-10 overlap figures of 17–38%. [U] Query fan-out reportedly splits one query into roughly 8–16 sub-queries, and pages ranking for fan-out sub-queries are reported 161% more likely to be cited. [S] Whitespark: a top-10 organic ranking gives only ~25% chance of AI Overview appearance.

**Disagreement to note.** The Google pass carried a single-source claim that top-10-to-AI-citation overlap fell from 76% in July 2025 to 38% by March 2026 ([LLM Pulse](https://llmpulse.ai/blog/how-to-rank-in-google-ai-overviews/)). The AEO pass carries seoClarity's 97%-of-AIOs-cite-a-top-20-source finding, which has a stated sample and points the other way for the AI Overviews surface specifically. **Resolution to encode: AI Overviews stay tightly coupled to organic rank; AI Mode is loosely coupled via fan-out. Do not cite the 76→38 figure as fact.**

[S] Ahrefs cross-platform overlap in AI brand visibility: AI Overviews to AI Mode 0.821, AI Overviews to ChatGPT 0.749, AI Mode to ChatGPT 0.769. Winning one surface substantially predicts winning the others.

### 2.4 Search Console generative AI report and its limits

- **[P]** Covers AI Overviews, AI Mode and generative AI features in Discover, broken down by page, country, device and date. ([Search Console Help](https://support.google.com/webmasters/answer/16984139?hl=en))
- **[P] Limits:** impressions only. No clicks, no CTR, no queries. Data starts 2026-05-18 with no backfill. The Search Console API rejects the generative-AI type, so export is manual.
- **[U]** Whether the report splits AI Mode from AI Overviews as distinct rows could not be confirmed. Evidence points to one combined generative-AI grouping. Treat it as a single AI channel.
- **[P] Opt-out toggle.** Sites can opt out of generative AI Search features. "Sites that opt out will not receive traffic or impressions from our generative AI features." It applies collectively across AI Overviews, AI Mode and AI Overviews in Discover, with no per-feature control, and is not used as a ranking signal elsewhere. **Never enable this for a local-service site.**

### 2.5 GA4 attribution limits and noreferrer

- **[P]** GA4's AI Assistant channel recognizes ChatGPT, Gemini, Deepseek, Copilot and Grok referrers via `medium = ai-assistant`. **Google's own AI surfaces are excluded** — AI Overviews and AI Mode clicks land in `google / organic`.
- **[P/S]** AI Mode adds `noreferrer` to outbound links, and AI Overviews links frequently do the same. **AI Mode and AI Overview traffic cannot be isolated in GA4.** ([seresa](https://seresa.io/blog/ai-data-readiness/google-ai-mode-uses-noreferrer-your-analytics-cannot-see-the-traffic))
- **[U]** 35–70% of AI referral sessions arrive with no referrer and land in Direct. Widely repeated, no traceable study. Use it as a reason never to report AI referrals as a complete number.
- Perplexity and Claude are not in Google's stated recognized list. Cover them with a custom channel group. The channel is not retroactive.

### 2.6 Algorithm updates, January–September 2026

| Update | Start | End | Duration |
|---|---|---|---|
| February 2026 Discover update | 2026-02-05 | 2026-02-27 | 21d 17h |
| March 2026 spam update | 2026-03-24 | 2026-03-25 | 19h 30m |
| March 2026 core update | 2026-03-27 | 2026-04-08 | 12d 4h |
| May 2026 core update | 2026-05-21 | 2026-06-02 | 11d 21h |
| June 2026 spam update | 2026-06-24 | 2026-06-26 | 2d 1h |
| August 2026 spam update | 2026-08-18 | 2026-08-20 | 2d 16h |

- **[P]** Dates from the Google Search Status Dashboard, fetched 2026-09-02.
- **[U]** February Discover update effects: clickbait demoted, locally relevant content promoted, unique US Discover top-1000 domains down from 172 to 158. Third-party visibility estimates.
- **[U]** March core called the most volatile on record (79.5% of top-3 results changing); May core third-party analysis of 8,887 domains reported 5,039 winners and 3,845 losers, brand-owned and institutional sites gaining while aggregators declined. Google publishes no winners/losers data.
- **[P/S]** June and August spam updates enforced existing policies and explicitly did not target link spam or site reputation abuse. Volatility outside named updates is now the majority of movement, including a significant unconfirmed movement 2026-08-01 to 2026-08-03. ([Search Engine Roundtable](https://www.seroundtable.com/google-search-ranking-volatility-continues-41952.html))
- **[U]** No local-specific named algorithm update was confirmed by Google in 2026. Local volatility traces to core/spam updates plus GBP policy enforcement.

## 3. Local search

### 3.1 Map Pack and AI local pack

- **[S]** AI-powered local packs show only 1–2 businesses instead of 3 and have no call buttons. **[U] on the "~32% as many unique businesses" figure** — the Google pass sourced it to Sterling Sky (2026-06-26, 88% of 322 markets showing fewer businesses, 5,943 vs 18,330); the AEO pass could not reach the Sterling Sky primary and marked it unverified. It is directionally corroborated by SOCi. Use the direction, label the number.
- **[S]** Click-to-call from GBP has dropped substantially on mobile over two years while desktop website clicks stayed stable. A business can hold 3-pack rankings while calls fall.
- **[P/S]** Paid placements, especially Local Services Ads, retain prominent call buttons where organic listings lose them.
- **[U]** The specific "call button removal" event date and the circulating 50–70% call-drop figures are not primary-sourced.

### 3.2 GBP changes, 2026

From the [Sterling Sky Google local changes log](https://www.sterlingsky.ca/google-local-changes/), fetched 2026-09-02, all [P] unless noted:

| Date | Change |
|---|---|
| 2026-03-12 | Ask Maps launched (US, India), Gemini-powered, replaced the GBP Q&A surface; 150+ countries by August |
| 2026-07-21 / 07-31 / 08-21 / 08-26 | LSAs migrated into the main Google Ads platform; D-U-N-S required for some advertisers; pre-badge ads and more verticals; booking partners expanded from ~20 to 500+ |
| 2026-08-25 | **Google will charge for missed and subsequent calls on LSAs from 2026-10-01** |
| 2026-08-10 | Repeated bilingual names and transliterations disallowed in business names |
| 2026-07-08 / 07-13 / 07-23 | Appeals accept evidence uploads; new "Collected Info" section for visual content; email notice when a review fails to post |
| 2026-08-14 / 08-19 / 08-20 | "Report owner response" moderation option; revamped Q&A interface in testing; Google Posts Insights restored |

**Known GBP bugs logged in 2026:** reviews disappearing after reinstatement (2026-08-24), review replies not displaying (2026-07-22), "no reviews yet" display bug (2026-07-09), widespread review disappearance (2026-07-03). Verify live state before diagnosing a ranking loss.

### 3.3 Review policy

- **[P] 2026-04-16** — Gemini-powered enforcement and pre-publication scam detection deployed.
- **[P] 2026-04-17** — Staff review quotas and employee-name solicitation banned. The policy prohibits "merchants requesting that staff solicit reviews that include specific content, including content that identifies a staff member." Staff may invite an honest, open-ended review offered equally to all customers with no reward attached. A customer naming a technician spontaneously is fine; asking them to is a violation.
- **[P] 2026-07-24** — Review-snippet structured data guidelines added: "Don't include fake or undisclosed incentivized reviews on your page or in your structured data markup." Named examples: reviews not based on genuine experience, and reviews written for money, discounts, vouchers or free products without clear and prominent disclosure. Violations sit under star-rating eligibility and can trigger a manual action killing review rich-result eligibility while the page still ranks.

### 3.4 Service-area business rules

**[P, long-standing, no 2026 change found]** SABs travel to the customer and must not display a business address. Hide it publicly, enter it only for verification, show service areas instead. A home-based SAB leaving its address visible faces eventual suspension. Mail-drop addresses are prohibited unless staffed by your own team during business hours, and suspensions on that basis are very hard to reverse. ([Birdeye](https://birdeye.com/blog/google-business-profile-guidelines/); [GBP Guardian](https://gbpguardian.com/google-business-profile-address-rules))

### 3.5 Whitespark 2026 local ranking factor weights

**[S]** Whitespark 2026 Local Search Ranking Factors, published 2025-11-06, 47 experts scoring 187 factors. ([Whitespark](https://whitespark.ca/local-search-ranking-factors/))

| Factor group | Local Pack / Maps weight |
|---|---|
| GBP signals | ~32% |
| Reviews | ~20% |
| On-page | ~15% |
| Behavioral | ~9% |
| Links | ~8% |
| Citations | ~6% |
| Social | ~5% |

- Reviews and behavioral rose. Citations continued to decline as a Local Pack factor while rising as an AI visibility factor — score them in both dimensions, not once.
- **Local Pack top five:** primary GBP category, proximity to searcher, keywords in business title, physical address in the search city, business open at time of search.
- **Local organic top five:** dedicated service pages, geographic keyword relevance, quality inbound links to domain, keywords in landing page title tags, industry-relevant linking domains.
- **New AI search visibility dimension, top drivers:** expert-curated "best of" lists, dedicated service pages, prominence on industry domains, high-quality unstructured citations, authority of review sites.

### 3.6 Doorway and scaled-content risk for city pages

- **[P]** Google's spam policies still name pages targeted at different cities that funnel visitors to the same destination as doorway abuse. Enforcement has not stopped since the March 2015 doorway update.
- **[P]** Scaled content abuse is "when many pages are generated for the primary purpose of manipulating search rankings and not helping users," and it applies equally to AI and human writing. A templated ~90-city-page build sits closest to this policy.
- **[U, practitioner consensus]** The 2026 practical shift: manual actions still happen for egregious cases, but the common outcome for thin location pages is quiet suppression, filtering, or grouping so only one representative page shows. **The failure mode does not announce itself in Search Console.**
- **The test to encode:** strip the city name from the title, H1 and body. If what remains is indistinguishable from any other city page, the page fails.
- **[S]** Whitespark's local organic top factor is *dedicated service pages* — the defense is per-city substance, not per-city templating: local mole species and soil conditions, actual jobs done there, named neighborhoods, city-specific reviews, real photography.

## 4. Answer engines

### 4.1 Per-engine table

| Engine | Index / grounding used | Crawler user-agents | Freshness posture | Local data sources |
|---|---|---|---|---|
| **ChatGPT** (OpenAI) | Own search index plus licensed partners | `OAI-SearchBot` (search, allow it), `GPTBot` (training), `ChatGPT-User` (user-initiated, robots.txt "may not apply"), `OAI-AdsBot` (ad page safety) [P] | [U] Strong recency bias claimed; one circulating figure is 76.4% of top-cited pages updated within 30 days. No methodology. | **Yelp dominant post-deal** (2026-07-23 licensing incl. Request a Quote). [S] Aug 2026: Yelp on 95.83% of structured business cards, Foursquare 0.00%. [S] Q4 2025 pre-deal: BBB led at 68,617, Yelp third at 25,681. Location sharing live; [U] ChatGPT Maps place blocks observed in EU 2026-08-09 |
| **Perplexity** | Own index | `PerplexityBot` (search, does not train), `Perplexity-User` (user-initiated) [P] | [U] Described as most recency-biased, ~50% of citations current-year | [S] Yelp 62.1% of local directory citations. Trade adds TripAdvisor, Google Maps data, local editorial. [P] Perplexity documents **nothing** about selection or citation logic — anyone claiming to know it is inventing it |
| **Gemini / Google AI Mode / AI Overviews** | Google Search index, RAG plus query fan-out [P] | Googlebot governs eligibility; `Google-Extended` is training-only; [U] `Google-Agent` added 2026-03-20, ignores robots.txt by design | [P] RAG retrieves "up-to-date web pages." [U] BrightEdge claims regularly updated content cited ~1.6x more | [S] AI Mode scrapes GBP (ratings, hours, contact), review platforms, and unstructured citations from blogs, news, social, community pages, sponsorship listings, industry publications, local business association sites. [S] AI Mode → Yelp 72.5% of local directory citations. **[S] Gemini → Angi first (18,870); Yelp sixth at 49 citations** |
| **Copilot / Bing** | Bing index — Bing indexation is a hard prerequisite [P] | `Bingbot`. [P] "Bing respects all content owner preferences expressed through robots.txt" | [P] Microsoft guidance: keep information current | Bing Places for Business. [U] on its weight in Copilot local answers — free, so do it, but label it unmeasured. [U] on IndexNow raising citation odds |
| **Claude** (Anthropic) | [U] Never published. Trade points to Brave Search as a "Web Search" subprocessor | `ClaudeBot` (training), `Claude-User` (user-initiated), `Claude-SearchBot` (search quality) [P]. Supports non-standard `Crawl-delay`; robots.txt preferred over IP blocking | Not documented | [S] Small share of local discovery per BrightLocal, behind ChatGPT 31% and Google AI Mode 23%. **Do not build a Brave-specific strategy** — the circulating "87% overlap with Brave top organic" has no reachable methodology |
| **Apple / Siri** | [U] Apple business data graph; Apple Maps also ingests Yelp | Not documented | Not documented | [U] Business Connect, Business Manager and Business Essentials unified into one Apple Business platform 2026-04-14 across 200+ countries. [U] "World Knowledge Answers" Siri overhaul reported for spring 2026 across Siri, Safari and Spotlight |

Crawler IP lists: `openai.com/searchbot.json`, `openai.com/gptbot.json`, `perplexity.com/perplexitybot.json`, `claude.com/crawling/bots.json`.

### 4.2 Directory-by-engine matrix

**[S] Foundation Marketing / AirOps**, published 2026-05-28, 28.5M AI responses, primary dataset Q4 2025 across ChatGPT, Gemini, Perplexity and Google AI Mode. ([via PPC Land](https://ppc.land/yelp-gets-3-4x-more-ai-citations-than-any-rival-in-new-local-search-data/))

| Directory | Total AI citations | Priority read |
|---|---|---|
| Yelp | 512,680 | Highest-leverage off-site local asset, and higher still on ChatGPT since the July 2026 deal |
| Better Business Bureau | 149,710 | Disproportionately important for ChatGPT (led at 68,617); cheap to establish |
| Angi | 145,633 | **The Gemini lever** — Angi led Gemini at 18,870 while Yelp scored 49 |
| Thumbtack | 56,004 | Secondary |
| HomeAdvisor | 33,582 | Secondary |
| Nextdoor | 10,308 | Local/community tail |

Yelp's citations split by engine: Google AI Mode 340,721 (66%), Perplexity 146,196 (28.5%), ChatGPT 25,681 (5%), Gemini 49 (under 1%).

**Correction to encode:** [S] the Steady Demand test (2,880 prompts, 12 verticals × 12 metros, 4,607 successful runs, August 2026) supersedes the Foursquare claim for ChatGPT. Secondary sources in that test: TripAdvisor 28.90%, OpenTable 16.88%, Resy 8.96%, Google 4.62%. The author's own caveat: "partnership numbers have shelf lives."

**[U]** "Yelp is cited in 33% of local LLM answers across every industry tested," attributed to BrightLocal 2026 in secondary sources, could not be verified. **[U]** "Google Business Profile makes up 28.5% of all citations" traces only to trade content — do not use with a client.

### 4.3 Consumer behavior around AI local discovery

**[S] BrightLocal Local Consumer Review Survey 2026**, 1,002 US adults, published 2026-03-10, 455 had used AI for local recommendations in the prior 12 months.

| Data point | Value |
|---|---|
| Used AI to find a local business | 45% (up from 6% in 2025) |
| Rank of AI as a discovery channel | 3rd, behind Google and Facebook |
| Adoption, ages 30–44 / 60+ | 64% / 24% |
| Used ChatGPT / Google AI Mode for a business recommendation | 31% / 23% |
| Trust AI recommendations (among users) | 63% |
| Fact-check AI sources | 88% |
| Double-check against real reviews | 97% |
| Ready to contact the AI-recommended business directly | 18% |
| Will not use a business under 20 reviews / rated below 4.5 | 47% / 31% |

**Read:** AI is a discovery channel, not a closing channel. The 97% verification behavior means the review corpus is what converts an AI mention into a call.

**[S] SOCi 2026 Local Visibility Index**, ~350,000 locations, 2,751 brands with 50+ locations, 5 industries, 120+ metrics: Google local 3-pack 35.9%, Gemini 11%, Perplexity 7.4%, ChatGPT 1.2%. "AI visibility is three to 30 times harder to achieve than ranking well in traditional local search." Only 45% overlap between top-20 Google local brands and top-20 AI-recommended brands in retail. Average star rating of recommended locations: ChatGPT 4.3, Perplexity 4.1, Gemini 3.9 — **rating acts as a filter, not a ranking signal**. Business-profile accuracy: 68% on ChatGPT and Perplexity, 100% on Gemini. **Caveat: SOCi covers only 50+-location brands; the direction transfers, the percentages do not.**

## 5. What correlates with citation

### 5.1 Ahrefs, 75,000 brands (published 2025-12-12)

Method: domains with DR > 40, highest-volume keyword at monthly volume ≥ 800, brand mentions via Brand Radar across millions of AI responses. Spearman correlations against AI brand visibility.

| Signal | ChatGPT | AI Mode | AI Overviews |
|---|---|---|---|
| YouTube mentions | 0.737 | 0.712 | 0.740 |
| YouTube mention impressions | 0.717 | ~0.71 | ~0.71 |
| Branded web mentions | 0.664 | 0.709 | 0.656 |
| Branded anchors | 0.511 | 0.628 | 0.527 |
| Branded search volume | 0.352 | 0.466 | 0.392 |
| Domain Rating | 0.266 | 0.285 | 0.326 |
| Branded traffic | 0.235 | 0.357 | 0.274 |
| Backlinks / URL Rating | ~0.2–0.3 | ~0.2–0.3 | ~0.2–0.3 |
| Number of site pages | 0.194 | — | — |

Ahrefs' own caveat, quoted: "correlation isn't causation. We've spotted patterns between search metrics and AI mentions, but that doesn't mean improving these metrics will automatically boost your AI visibility."

### 5.2 Format, length, freshness and schema

- **[S] Listicles are the single most-cited format at ~21% of all citations.** arXiv 2606.20065, 100,000+ prompt responses, 100+ brands, March–May 2026, across ChatGPT, Claude, Perplexity and Gemini. Same study: ~78% of citations go to corporate websites; among non-corporate sources YouTube leads, ahead of Reddit, editorial media and Wikipedia. Brand-stature tiers: global household names appear in 73% of relevant answers, mid-market 44%, **niche brands 11%** — that 11% is the honest baseline for a local service business. Sentiment flips ~6.7x more often than mention presence.
- **[S] Word count is irrelevant.** Ahrefs, 174,048 pages: correlation between word count and AI Overview citations is **0.04**.
- **[S] Freshness is real.** Ahrefs (2025): AI-cited content is 25.7% fresher on average, roughly a 368-day gap. Seer Interactive (October 2025): 65% of AI bot hits target content published in the past year, 89% within three years.
- **[S] Schema does not lift citations for already-visible pages.** Ahrefs DiD test: −4.6% / +2.4% / +2.2%. Authors' caveats: treated pages already had 100+ citations so schema may still aid discoverability for invisible pages; all schema types pooled; 30-day windows; JSON-LD only; effects not fully separable from simultaneous page changes.
- **[S/U] Answer-first, one fact per sentence.** Supported by the chunk-retrieval mechanism and Otterly's report, which states "reference-grade, chunked content receives 3–5x more citations than dense paragraphing" without describing an experiment. **[U]** on the chunk numbers circulating (median quoted chunk ~25 tokens, 97% of citations under 200 tokens, passages over ~80 words cut mid-thought) and on the "40–80 word answer under each question H2, 5–8 H2s of 200–400 words" trade shape. **Encode the pattern, never the numbers.**
- **[S/U] Multi-format content** combining text, images and video cited ~1.4x more than text-only (Semrush 2026, via secondary reporting; [U] on the exact figure).
- **[U] BrightEdge:** pages with FAQ or structured Q&A formatting cited ~1.9x more often. Primary report unreachable. Note the tension with the FAQ rich-result deprecation — the Q&A *shape* is claimed to help AI even though the schema earns nothing.
- **[S] 73% of websites have crawlability issues preventing AI access** — robots.txt blocks, CDN restrictions, JS rendering requirements (Otterly, 1M+ citations, Jan–Feb 2026). The highest-return technical item and it costs nothing.

### 5.3 Scale of the opportunity

**[S] Semrush 2026 AI Visibility Index**, 126 million US AI prompts January–April 2026: ChatGPT cites an average of **15 sources per response**, Gemini cites **3**. 62% of AI citations are "ghost citations" where the brand goes unnamed. Citation rates vary 615x between platforms. Only 36 brands held top-100 visibility across all engines every month. 45% of marketing leaders cannot accurately measure AI brand visibility. AI traffic to US retail sites grew 1,324% between October 2024 and May 2026.

**[S] Otterly**, 1M+ citations: brand domains 47.5% of citations, news 20.3%, community forums 5.9%, other 26.3%. Most-cited domains — ChatGPT: Reddit, Wikipedia, Amazon, Forbes. AI Overviews: YouTube, Wikipedia, Forbes, Quora. Perplexity: Reddit, Wikipedia, LinkedIn, Forbes.

## 6. Structured data state

- **[P] FAQ rich results timeline:** deprecation notice 2026-05-07 (no blog post); search appearance, rich result report and Rich Results Test support removed June 2026; Search Console API data removed August 2026. Search Central's log: "2026-06-15 — Removed FAQ rich result feature documentation as it no longer appears in search results."
- **[P] FAQPage remains a valid schema.org type** and unused structured data causes no harm. Keeping it is fine. Adding it as a deliverable is not.
- **[P] Also retired:** seven schema types in June 2025, Practice Problem reporting January 2026, HowTo desktop rich results September 2023. **Rankings are unaffected by these deprecations** — the loss is display real estate.
- **[P] Google's stance on schema and AI:** "Structured data isn't required for generative AI search, and there's no special schema.org markup you need to add." Structured data must match visible page content.
- **What still matters, and why:** LocalBusiness (most specific subtype), Service, Organization, BreadcrumbList, Article/BlogPosting with `dateModified`, Person for author E-E-A-T, and Review/AggregateRating under the new incentivized-review constraint. The surviving rationale is **rich results, entity binding and non-Google systems** — not AI citation. The `sameAs` spine on Organization (GBP, Yelp, BBB, Angi, Facebook, LinkedIn, YouTube) plus `knowsAbout` is the one place schema still earns its keep, because it is the disambiguation defense.
- **Never present schema as an AI-citation tactic in client-facing output.** Cite the Ahrefs DiD result when the change is questioned.

## 7. Content and quality

- **[P] E-E-A-T is unchanged.** The September 2025 Quality Rater Guidelines edition is still current, no 2026 revision found. It added YMYL Government/Civics/Society definitions and AI Overview evaluation examples; the Experience criterion still rewards demonstrable first-hand work.
- **[P] AI-generated content is not penalized for being AI-generated.** Low-quality, unhelpful or manipulative content is penalized regardless of production method.
- **[P] Scaled content abuse** applies equally to AI and human writing. This is the policy a templated city-page build sits closest to.
- **[P] Site reputation abuse** policy updated 2026-08-28/30: four described factors replace the example list, and manual actions no longer affect EEA searchers as of 2026-08-30 following a European Commission mandate. Enforcement elsewhere is unchanged. Relevant to a US business mainly as evidence that Google now enforces spam policy differently by searcher geography.
- **[S] The helpful content system is no longer separate** — it was folded into core ranking, and the cadence moved from named updates to near-continuous adjustment.
- **[P] Distinctiveness is Google's own headline advice:** "creating content that people find unique, engaging, and helpful will have a greater impact on your website's presence in generative AI search in the long run than any other suggestion," emphasizing non-commodity content with unique expert or experienced takes.
- **[P] Preferred Sources** reached all Search languages 2026-04-30, with an embeddable button, JavaScript SDK and deeplink fallback shipped 2026-08-20. Mostly a publisher play; low priority for a local service business.

## 8. Technical

- **[P] Core Web Vitals are unchanged: LCP, INP, CLS.** No new metric and no INP replacement announced. **[S]** INP is the most commonly failed metric, with around 43% of sites over the 200ms threshold. Weight it highest.
- **[P] Googlebot file limits, clarified February 2026:** first 2MB of HTML, first 64MB of PDFs, first 2MB of other supported types; a separate 15MB default applies across Google's wider crawler infrastructure. This was a documentation relocation, not a new restriction. **Practical effect: very large JavaScript bundles risk incomplete rendering.**
- **[P] Google-Extended is a training opt-out, not a Search or AI Overviews opt-out.** It "manages whether content Google crawls from their sites may be used for training future generations of Gemini models" and does not affect Search ranking. **Blocking it does not remove pages from AI Overviews.** The only real AI opt-out is the Search Console toggle.
- **[P] llms.txt does nothing for Google.** Search Central, 2026-06-15: "Clarified that llms.txt files aren't required for Google Search visibility or rankings," plus "It's completely fine if you decide to create and maintain LLMS.txt files (or other similar files) for other services or systems that use these files." **[P]** OpenAI, Anthropic and Perplexity crawler documentation covers robots.txt only and never mentions llms.txt. **[U] and probably false:** claims that Anthropic and Perplexity publicly confirmed llms.txt support trace to a single vendor page with no citations, no sample sizes and no methodology. **Verdict: do not build one. If one exists, leave it.**
- **[P] IndexNow: Google still does not support it.** Participants are Bing, Yandex, Naver, Seznam, Yep and Amazon. Worth submitting for Bing, which matters for Copilot citation. **[U]** on IndexNow materially raising citation odds.
- **[P] Sitemaps:** no guidance change; accurate `lastmod` matters more now that freshness feeds RAG retrieval. **Robots.txt:** Google is expanding documentation of unsupported rules after a review by Gary Illyes and Martin Splitt, with no behavioral change announced.
- **Robots policy to encode:** allow `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Bingbot`, and Googlebot unconditionally. Allow `Google-Extended` (blocking it buys nothing and costs training presence). Decide `GPTBot` and `ClaudeBot` separately — they are training crawlers and blocking them does not remove the site from search surfaces; **recommend allowing them**, since the Ahrefs brand-mention correlations suggest presence in training corpora is an asset. Verify against the published IP lists, and check CDN and WAF rules, not just robots.txt.
- **[P] Other 2026 doc changes:** crawl documentation reorganized into a nine-section overview (2026-03-03), canonicalization re-evaluation timeframes clarified (2026-07-10), site move guidance expanded for domain variants (2026-06-17), AMP documentation trimmed (2026-07-01), favicon formats listed (2026-08-28).

## 9. Homograph and entity disambiguation: the "mole" problem

"Mole" resolves to a skin lesion, a burrowing mammal, a spy, a chemistry unit and a Mexican sauce. The skin-mole sense dominates the training distribution, so this is popularity bias, not just ambiguity. The paid side already handles it with ~120 medical-cluster negatives; the organic and AI side needs the equivalent.

**[U] on every specific tactic below** — no controlled study exists. The underlying mechanism (candidate generation, then context-weighted entity linking with popularity bias) is standard NLP and is safe to rely on.

1. Never let "mole" appear without a co-occurring disambiguating token in the same sentence or heading. Use lawn, yard, turf, burrow, tunnel, molehill, *Scapanus*, ground mole, pest, trapping.
2. Put the disambiguation in the first 40–80 words of every page and in every H1 and H2, not just body copy — that is the chunk that gets retrieved.
3. Wikipedia is the strongest `sameAs` anchor because it feeds the Knowledge Graph and multiple training pipelines. It is not realistically achievable here, so use the achievable stack: Organization schema with identical `sameAs` to GBP, Yelp, BBB, Angi, Facebook, LinkedIn and YouTube, plus `knowsAbout` binding the brand to the pest-control sense.
4. Every page mentioning "mole" links to one canonical disambiguation page (what a lawn mole is, why it is not a skin mole, what a molehill looks like). That page is the entity anchor.
5. **Measure the failure, do not assume it.** DataForSEO LLM Responses at $0.0006 per prompt makes it cheap to ask each engine "what is Got Moles" and "who removes moles in Everett WA" on a fixed cadence and check which entity comes back.

## 10. Measurement stack

### 10.1 Free and first-party — do these first

- **[P] Search Console → Performance → Generative AI.** The primary AI visibility metric. Impressions inside AI Overviews and AI Mode, by page, country, device and date. From 2026-05-18, no backfill, no clicks, no queries, no API.
- **[P] Bing Webmaster Tools → AI Performance** (public preview since 2026-02-10). Total Citations, Average Cited Pages, **Grounding Queries**, page-level citation activity, visibility trends across Copilot and Bing AI summaries. Grounding queries are real retrieval-phrasing data no keyword tool has — feed them straight into keyword strategy.
- **[P] GA4 AI Assistant channel** plus a custom channel group placed **above** Referral in evaluation order to catch Perplexity and Claude:
  ```
  chatgpt\.com|chat\.openai\.com|openai\.com|perplexity\.ai|claude\.ai|
  gemini\.google\.com|copilot\.microsoft\.com|bing\.com/chat|
  you\.com|poe\.com|grok\.com|meta\.ai|deepseek\.com|phind\.com
  ```
- **Triangulation method, since no clean attribution exists:** Search Console generative AI impressions give the AI-side numerator, Search Console web impressions and clicks give the classic baseline, GA4 `google / organic` gives landed traffic. A widening gap between rising impressions and flat clicks is the AI-answer signature.
- **For a phone-led business, call tracking is the real measurement layer.** With the map pack call button eroding and Google's agent placing calls on searchers' behalf, distinct tracked numbers per surface (GBP, website, LSA) are the only way to see where calls originate.

### 10.2 DataForSEO AI Optimization API — [P] from vendor docs

Pay-as-you-go. The $100/month commitment for LLM Mentions was removed 2026-07-01. Total prompt corpus tracked: 342,472,483. Free sandbox, $1 trial credit.

| API | Returns | Models | Price |
|---|---|---|---|
| LLM Mentions | Brand/domain/keyword mentions, sentiment, citation tracking, source references, snippets | ChatGPT, Google AIO, Gemini, Claude, Perplexity | $0.10 per request + $0.001 per row, live only |
| AI Keyword Data | AI search volume last month, 12-month trend, phrasing patterns, topic popularity | ChatGPT (26M+ prompts), Google AIO (316M+ prompts) | $0.01 per task + $0.0001 per keyword, ~$110 per 1M keywords |
| LLM Responses | Structured responses to custom prompts with system instructions and reasoning | ChatGPT, Gemini, Claude | Live $0.0006 + provider charges; standard queue $0.0006 + $0.01 prepay |
| LLM Scraper | Real-time data from live AI interfaces, brand entity extraction | ChatGPT, Gemini | Standard $0.0012/page, Priority $0.0024/page, Live $0.004/page |

**Read:** AI Keyword Data at $0.0001 per keyword makes AI search volume effectively free at this scale. LLM Mentions at $0.10 per request supports a cheap recurring "is the brand named for these 30 prompts" cron.

### 10.3 Commercial platforms — skip them

**[U] on all pricing** (aggregated from comparison posts, not vendor pages): Otterly ~$29/mo, Peec AI ~$80–95/mo, Semrush AI Toolkit ~$99/mo, Profound from ~$99/mo but realistically $399–499+, Ahrefs Brand Radar ~$199 per platform or ~$699 bundled. **Recommendation: no SaaS AI-visibility seat.** Search Console plus Bing AI Performance plus GA4 plus DataForSEO covers the need at a fraction of the cost. Verify any vendor pricing on the vendor page before quoting it to a client.

## 11. Debunked and downgraded

| Claim | Status | Evidence |
|---|---|---|
| Schema markup increases AI citations | **Downgraded to no measurable effect** for already-visible pages | [S] Ahrefs DiD, 1,885 treated vs 4,000 control, 2026-05-11: −4.6% / +2.4% / +2.2%. [P] Google: "Structured data isn't required for generative AI search" |
| llms.txt improves AI visibility | **Debunked** | [P] Google: not needed, "will neither harm nor help." No engine documents support. Anthropic/Perplexity "confirmations" trace to one uncited vendor page |
| You must chunk content into tiny pieces for AI | **Debunked as a requirement** | [P] Google: "There's no requirement to break your content into tiny pieces." Answer-first structure still helps retrieval as a preference, not a rule |
| Foursquare supplies ~70% of ChatGPT's local data | **Debunked** | [S] 4,607 runs, August 2026: Foursquare 0.00% on the primary surface, Yelp on 95.83% of structured business cards |
| Longer content gets cited more | **Debunked** | [S] Ahrefs, 174,048 pages: word count vs AI Overview citation correlation 0.04 |
| Backlinks and Domain Rating drive AI visibility | **Downgraded** | [S] Ahrefs, 75,000 brands: backlinks ~0.218–0.27 vs YouTube mentions 0.737, branded web mentions 0.664 |
| Ranking in the organic top 10 gets you into AI answers | **Downgraded and split by surface** | [S] seoClarity: 97% of AI Overviews cite a top-20 source. AI Mode is loosely coupled via fan-out. [S] Whitespark: top-10 rank gives ~25% chance of AIO appearance |
| FAQPage schema earns rich results | **Removed by Google** | [P] Deprecation 2026-05-07, features gone June 2026, API data gone August 2026 |
| AEO and GEO are separate disciplines needing separate tactics | **Rejected by Google** | [P] The guide names "AEO/GEO hacks," AI-specific rewriting, inauthentic mention-building and keyword-variation overfocus as unnecessary |
| Buying or manufacturing brand mentions raises AI visibility | **Debunked** | [P] Google warns against inauthentic mentions; spam systems already filter what AI features depend on |
| Google-Extended blocks AI Overviews | **Debunked** | [P] It is a Gemini training opt-out only and does not affect Search ranking or AIO eligibility |
| Reddit is a reliably rising AI citation source | **Contested — act on neither direction** | Some 2026 sources report share falling ~50% Oct 2025 → Jan 2026, others report 73% growth in commercial categories. The Axios reporting returned HTTP 403 |
| The 2026 local volatility came from a named local update | **Unsupported** | No Google confirmation of a distinct 2026 local update. Attribute to core/spam updates plus GBP enforcement |

## 12. Rules for the skill chain

Concrete and testable. Ordered by risk and dependency, not effort. Each carries its evidence tier.

### 12.1 `str-keyword-strategy`

1. **[S] Split the keyword map by intent, because the SERP shape now differs by intent.** Tag every target keyword with the surface it competes on: transactional local → Local Pack (~93%), won through GBP; informational and hybrid → AI Overviews (92–97%), won through cited content.
2. **[S] Add a fan-out column.** For each primary keyword, enumerate the sub-queries a fan-out would generate — identification, damage, chemical-free methods, pricing, prevention, seasonality, pets and children. Build pages to satisfy a cluster, not a head term. Coverage across the fan-out, not head-term rank, predicts AI Mode citation.
3. **[P] Stop treating AI Overviews and AI Mode as one target.** AI Overviews are an organic-rank problem; AI Mode is a fan-out coverage problem. Search Console reports them combined; the strategy must not.
4. **[P] Add grounding queries from Bing Webmaster Tools AI Performance as an input source.** It is real retrieval phrasing, not modeled volume.
5. **[P] Add AI search volume as a second volume column** via DataForSEO AI Keyword Data. Conversational phrasing differs from typed search; map both.
6. **[S] Stop using top-10 rank as the AI proxy.** It remains valid for classic search and the Local Pack and is a weak proxy for AI citation, at ~25% per Whitespark.
7. **[U] Never write "AI search volume" in client-facing output without a source label.** The underlying prompt corpora are estimates.
8. **[P] Do not build a strategy that requires ranking a near-identical page per city for the same head term.** See 12.2 and 12.3.

### 12.2 `str-onpage-audit`

1. **[S] Promote crawlability to the top check.** 73% of sites block AI crawlers somewhere. Audit `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `ClaudeBot`, `GPTBot`, `Google-Extended` and `Bingbot` in robots.txt, plus CDN and WAF rules and JS-rendering dependence. Verify against the published IP lists.
2. **[P] Remove FAQ rich-result scoring entirely.** Keep FAQPage markup as harmless. Delete any line item that scores it, promises a rich result from it, or recommends adding it to win one.
3. **[S] Demote schema scoring.** Keep schema checks for correctness, visible-content match and entity binding. **Remove any scoring language implying schema drives AI citation**, and cite the Ahrefs DiD result in the rationale so the change is defensible.
4. **[P] Rewrite the schema priority list** to: LocalBusiness (most specific subtype) → Service → Organization (with `sameAs` spine and `knowsAbout`) → BreadcrumbList → Article/BlogPosting with `dateModified` → Person for author → Review/AggregateRating.
5. **[P] Add an incentivized-review check.** Any page carrying Review or AggregateRating markup must be verified free of fake or undisclosed incentivized reviews. Named violation since 2026-07-24 with manual-action exposure.
6. **[P] Remove llms.txt from the audit entirely**, as a recommendation and as a scored item. Same for AI-specific Markdown mirrors, content chunking and AI-specific rewriting.
7. **[S] Score the answer-first block.** Every H2 is a question or a direct topic, followed immediately by a self-contained answer that reads correctly with zero surrounding context. The test: does this paragraph survive being lifted out of the page.
8. **[S] Score one-fact-per-sentence density** in the first block of each section. Hedged compound sentences do not get quoted.
9. **[P] Drop word-count targets.** Correlation 0.04. Replace with section-coverage targets against the fan-out question set.
10. **[S] Add the homograph check as a blocking item.** Fail any page where "mole" appears in the H1, the first paragraph or any H2 without a disambiguating token in the same sentence.
11. **[P/U] Add a doorway-page gate for city pages.** Strip the city name from title, H1 and body; if what remains is indistinguishable from any other city page, the page fails. Require per-city substance. The 2026 failure mode is silent suppression, so the audit is the only place this gets caught.
12. **[S] Freshness: require a substantive update, not a timestamp bump.** Flag pages untouched for 12 months. Require `dateModified` to reflect real content change with at least one new fact, source or example per major section, plus an accurate `Last-Modified` header and sitemap `lastmod`.
13. **[P] Add a JavaScript payload check.** Flag any page whose HTML exceeds 2MB or whose critical rendering depends on bundles beyond Googlebot's fetch limits.
14. **[P/S] Keep Core Web Vitals on LCP, INP and CLS**, weighting INP highest as the most commonly failed.

### 12.3 `str-internal-links`

1. **[P] Internal linking is now Google-endorsed for AI features** — "use internal linking effectively" appears in the official guide. Cite Google rather than inference.
2. **[S] Build hub-and-spoke clusters around fan-out sub-queries, not around city names.** A cost page, a method page, a seasonality page and a prevention page linked as a cluster covers a fan-out set. City pages cross-linking to each other cover nothing and look like a doorway network.
3. **[S] Cap city-page-to-city-page linking.** City pages link up to service and informational hubs and out to genuinely local proof, not sideways into a ring of near-duplicates.
4. **[S] Route internal links from informational content to transactional local pages.** The two win on different surfaces, and the informational pages are the ones AI Overviews cite.
5. **[S] Link to support fan-out coverage.** Every fan-out sub-answer should be reachable in one hop from the page that ranks.
6. **[S] Treat anchor text as a brand signal, not only a relevance signal.** Branded anchors correlate 0.511–0.628 with AI visibility, above Domain Rating. A meaningful share of inbound anchors, internal and external, should carry the brand name.
7. **[U] Every page mentioning "mole" links to the canonical disambiguation page.**

### 12.4 `str-ai-seo-local`

This skill needs the largest revision. Its baseline predates the Yelp deal and the Foursquare correction.

1. **[P] Replace every Foursquare reference with Yelp as ChatGPT's dominant local grounding source.**
2. **[P] Add Yelp as a tier-1 asset on par with GBP:** complete profile, photos, service categories, review responses, and **Request a Quote enabled**, because the OpenAI deal surfaces that flow inside ChatGPT for local services.
3. **[S] Replace the generic citation list with the directory-by-engine matrix** in section 4.2. Audit priority: Yelp, BBB, Angi, Thumbtack, HomeAdvisor, Nextdoor. **Angi is the Gemini lever, not Yelp.**
4. **[S] Re-weight the audit to Whitespark's 2026 numbers** (GBP ~32%, reviews ~20%, on-page ~15%, behavioral ~9%, links ~8%, citations ~6%, social ~5%), and **score citations twice** — declining as a Local Pack factor, rising as an AI visibility factor.
5. **[S] Audit the top five Local Pack factors explicitly:** primary GBP category, proximity, keywords in business title, physical address in the search city, open at time of search. The last is newly prominent and is an hours-configuration fix.
6. **[S] Add a call-path audit.** The mobile local-pack call button is eroding and AI local packs have none. Verify every surface still reaching the customer — website, GBP profile, LSA — has a working, tracked call path, and that on-site click-to-call is fast and prominent because it now absorbs demand the map pack used to convert.
7. **[P] Add a review-policy compliance check.** No staff quotas, no asking customers to name a technician, no rewards tied to reviews, requests open-ended and offered equally. Any review-request script naming technicians must be rewritten. Live suspension and review-stripping risk, enforced with Gemini-powered pre-publication detection.
8. **[P] Add an SAB configuration check** across all profiles: address hidden where customers are not received, service areas defined, no mail-drop address.
9. **[S] Treat star rating as a filter, not a ranking factor.** The audit question is not "raise the rating" but "is the rating visible and consistent on every platform an engine reads."
10. **[S] Make NAP consistency an AI-visibility item with a named blast radius.** Inconsistency across GBP, Yelp, Facebook, BBB, Angi and the website is the mechanism by which an engine fails to resolve the business at all. Profile accuracy measured 68% on ChatGPT and Perplexity.
11. **[S] Add unstructured citations as a scored category:** chambers of commerce, local news, neighborhood associations, community pages, sponsorship listings, local business association sites. A citation-builder tool will not find these.
12. **[S] Add an AI-citation source audit.** Run target queries in AI Mode, AI Overviews and ChatGPT, record which sources are cited in the vertical, and treat recurring third-party sources as a mention target list. **[P]** Sterling Sky logged on 2026-08-12 that AI Overviews for local were pulling from low-quality listicles — being on the right lists matters more than it should.
13. **[S] Track AI citation by observation, not rank.** Results are personalized and multi-turn; log presence and absence per query on a fixed cadence.
14. **[U-flagged] Add Bing Places and Apple Business Connect as low-cost, no-evidence items.** Do them, label them in the report as unmeasured.
15. **[S] Set honest expectations in the audit template.** Niche brands appear in 11% of relevant AI answers. AI local visibility is 3–30x harder than local pack ranking. The deliverable must not imply AI visibility is achievable at local-pack rates.
16. **[P] Add the LSA cost change to any paid-adjacent review:** charging for missed and subsequent calls begins 2026-10-01, which turns a missed call into a direct cost.
17. **[P] Add the two free measurement surfaces to the monthly re-audit:** Search Console Generative AI report and Bing Webmaster Tools AI Performance.
18. **[P] Check for GBP data bugs before diagnosing a ranking loss.** 2026 produced repeated review-disappearance and review-display bugs. Verify live state first.

### 12.5 `str-authority-strategy`

1. **[S] Reweight from backlinks to brand mentions.** Lead with mention acquisition and treat links as a byproduct. YouTube mentions 0.737, branded web mentions 0.664, branded anchors 0.527, backlinks ~0.218.
2. **[S] Make YouTube a first-class authority channel, not a repurposing afterthought.** It is the strongest single correlate across ChatGPT, AI Mode and AI Overviews and the leading non-corporate citation source in the arXiv study. Mole damage, trapping process and before/after are inherently visual, and the footage doubles as proof for the 97% who verify.
3. **[S] Target third-party listicles explicitly.** Ranked "best-of" listicles are ~21% of all citations, the single most-cited format. Inclusion in "best mole removal in {city}" roundups outranks most link building.
4. **[S] Re-target authority work at Whitespark's AI-visibility drivers:** expert-curated best-of lists, prominence on industry domains, high-quality unstructured citations in blogs, community pages and local news, and the authority of review sites carrying the brand.
5. **[S] Prioritize unstructured brand mentions over directory citations.** Directory citations fall as a Local Pack factor while unstructured mentions rise as an AI factor.
6. **[P] Add an explicit prohibition on manufactured mentions.** Google names inauthentic mention-seeking as unnecessary and says spam systems already filter it.
7. **[S] Add sentiment monitoring, not just mention monitoring.** Framing flips ~6.7x more often than mention presence. DataForSEO LLM Mentions returns sentiment.
8. **[S] Build and maintain the `sameAs` entity spine** across GBP, Yelp, BBB, Angi, Facebook, LinkedIn and YouTube, identical everywhere. This is the disambiguation defense and the one surviving schema justification.
9. **[P/S] Keep the E-E-A-T author layer.** Named technician bylines, Person schema and first-hand experience signals feed both classic quality systems and AI trust signals.
10. **[S] Diversify beyond Google.** Organic local visibility is shifting toward pay-to-play, and YouTube and Reddit are becoming alternative authoritative surfaces that AI systems cite — while noting Reddit's citation trend is contested.

### 12.6 `str-question-harvester`

1. **[S] Keep PAA harvesting, and reframe the output as fan-out sub-query discovery.** PAA questions are the closest free proxy for the sub-queries a fan-out generates.
2. **[P] Add Bing grounding queries as a second harvest source.** They are actual AI retrieval phrasings, which PAA is not.
3. **[P] Add DataForSEO AI Keyword Data as a third source** for conversational phrasing that never appears in typed-search tools.
4. **[P] Stop routing harvested questions to an FAQPage-schema deliverable.** Route them to answer-first H2 sections in body content instead. The Q&A shape survives; the schema deliverable does not.
5. **[S] Score gaps against fan-out coverage per page**, not against a site-wide FAQ count.
6. **[S] Apply the homograph filter at harvest time.** PAA for "mole" will return dermatology questions; strip them before they reach a content plan, using the same disambiguation token list the ads negatives use.

### 12.7 `mkt-authority-content` and `ops-blog-pipeline`

1. **[S] Enforce the answer-first block.** Question-format H2, then a self-contained answer, then supporting detail. The answer must read correctly with no surrounding context.
2. **[S] One fact per sentence in answer blocks.** No hedging, no compound clauses. This is a retrieval requirement, not a style preference.
3. **[P] Drop word-count minimums.** Replace with fan-out coverage: does the post answer the sub-questions a fan-out would generate.
4. **[S] Add a citable-statement requirement.** Every post carries at least one specific, attributable, quotable claim — a number, a local specific, a named method. Generic advice does not get quoted. Verified brand facts available: 219+ five-star Google reviews, 5,000 clients, three locations, Spencer's 15+ years personal experience kept distinct from the 2017 founding date. Never use "WA's #1" and never claim I-713 compliance.
5. **[S] Homograph guard before the humanizer.** Reject any draft whose title, first paragraph or any H2 uses "mole" without a disambiguating token in the same sentence.
6. **[S] Build a scheduled refresh lane, not just a publish lane.** AI-cited content is 25.7% fresher on average and 65% of AI bot hits target past-year content. Every published post gets a review date and a substantive-update definition. Sequence this after the current publish backlog clears.
7. **[S] Pair each post with a YouTube asset where the topic is visual.** Highest-leverage addition to the content operation given the 0.737 correlation.
8. **[P] Keep FAQ sections. Stop adding FAQPage schema as a deliverable.** Existing markup stays; ripping it out is churn with no upside.
9. **[S] Add local specificity to every city page's answer block.** A generic answer with the city name swapped in is not a local answer, and engines cite chunks that name the place.
10. **[P] No llms.txt, no AI-specific Markdown mirrors, no AI-specific rewriting pass.**

### 12.8 Root `str-ai-seo`

1. **[P] This file is the single source of "state of search" for the chain.** Every downstream skill reads it rather than restating landscape claims in its own SKILL.md. Landscape facts live here; skills carry only their own rules.
2. **[P] Update the six GM-era references to defer to this file** wherever they assert 2026 conditions, especially local-seo, entity-knowledge-graph, technical-infrastructure-audit, competitive-citation-gap and brand-disambiguation.
3. **[S] Encode the cross-surface overlap finding:** winning AI Overviews substantially predicts winning AI Mode (0.821) and ChatGPT (0.749). One coherent program, not per-engine programs.
4. **[P] Encode Google's "no special optimization" position as the default posture,** and require any AI-specific tactic added to a skill to cite either primary documentation or a named study with a sample.

### 12.9 Cross-cutting rules

1. **[P] robots.txt policy:** allow `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Bingbot`, Googlebot and `Google-Extended`. Recommend allowing `GPTBot` and `ClaudeBot`. Check CDN and WAF rules, not just robots.txt.
2. **[P] Never enable the Search Console generative AI opt-out** for a business that wants local visibility.
3. **[P] Never block Google-Extended expecting to leave AI Overviews.** It only opts out of Gemini training.
4. **[P] Never present schema as an AI-citation tactic** in any client-facing document.
5. **[P] Report AI visibility and classic visibility as two separate channels**, because Search Console now separates them.
6. **[P] Never promise AI Mode traffic attribution in GA4.** `noreferrer` makes it impossible. Report AI impressions from Search Console, landed traffic from GA4 `google / organic`, and the gap between them as the AI-answer effect.
7. **[P] Free-first measurement stack.** Search Console Generative AI, Bing AI Performance, GA4 AI Assistant plus custom group, DataForSEO for prompt-level tracking. No SaaS AI-visibility seat.
8. **Confidence labeling in client output is mandatory.** Every AI-visibility recommendation carries its evidence tier. Several widely repeated 2026 "facts" did not survive checking: Foursquare's ChatGPT share, Anthropic and Perplexity honoring llms.txt, GBP's 28.5% citation share, and the 50–70% call-drop figures.
9. **US English throughout.** No time or effort estimates in any deliverable produced by these skills — rank by impact, risk, dependency order and reversibility.

## 13. Could not verify

- Whether the Search Console generative AI report splits AI Mode from AI Overviews as distinct rows. Evidence points to one combined grouping; no explicit Google statement either way.
- The exact date and mechanics of the map-pack call-button removal, and the circulating "80% of searches" and "50–70% call drop" figures.
- The "AI local packs surface ~32% as many unique businesses" figure. The Google pass sourced it to Sterling Sky; the AEO pass could not reach the Sterling Sky primary. Directionally corroborated by SOCi.
- The 76%-to-38% collapse in top-10-to-AI-citation overlap, the 8–16 sub-query fan-out count, and the 161% fan-out citation lift. Each single-source; the first conflicts with seoClarity's larger-sample finding for AI Overviews.
- Google-Agent's addition date (2026-03-20) and its robots.txt behavior. Secondary sources only; the crawler documentation extract did not surface it.
- Any 2026 revision of the Quality Rater Guidelines (September 2025 edition appears current), and any 2026 named local algorithm update confirmed by Google.
- Primary reports for BrightEdge, seoClarity and the Whitespark 68% local AI Overview figure, all reached only through secondary summaries. Axios on Reddit fading from ChatGPT citations (2026-08-20) returned HTTP 403.
- Presenc AI's "State of llms.txt 2026" — no citations, no methodology, self-reported monitoring; its Anthropic and Perplexity llms.txt claims are unsupported.
- ChatGPT and Perplexity recency-bias figures, chunk-size token counts, the 35–70% no-referrer AI session claim, BrightLocal's "Yelp cited in 33% of local LLM answers," and all commercial AI-visibility platform pricing.
- Apple newsroom confirmation of the 2026-04-14 Business platform consolidation and the "World Knowledge Answers" Siri overhaul.

## 14. Sources

**Google primary [P]** — AI optimization guide (updated 2026-07-10) https://developers.google.com/search/docs/fundamentals/ai-optimization-guide · AI features and your website https://developers.google.com/search/docs/appearance/ai-features · Gen-AI performance reports (2026-06) https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports · New generative AI resource (2026-05) https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing · Site reputation policy update (2026-08) https://developers.google.com/search/blog/2026/08/update-site-reputation-policy · Docs update log https://developers.google.com/search/updates · Common crawlers (updated 2026-07-14) https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers · Search Console Help, generative AI https://support.google.com/webmasters/answer/16984139?hl=en · GA4 channel groups https://support.google.com/analytics/answer/9756891 · Search Status Dashboard https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history · Preferred Sources https://developers.google.com/search/docs/appearance/preferred-sources · blog.google Search at I/O (2026-05-19) https://blog.google/products-and-platforms/products/search/search-io-2026/ · blog.google website-owner controls (2026-06-03, updated 2026-08-31) https://blog.google/products-and-platforms/products/search/new-controls-website-owners/

**Other platform primary [P]** — OpenAI bots https://developers.openai.com/api/docs/bots · Perplexity bots https://docs.perplexity.ai/guides/bots · Anthropic crawlers https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler · Bing AI Performance preview (2026-02-10) https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview · DataForSEO AI Optimization API https://dataforseo.com/apis/ai-optimization-api and https://docs.dataforseo.com/v3/ai_optimization/overview/

**Studies [S]**
- Ahrefs, AI brand visibility correlations, 75,000 brands (2025-12-12) — https://ahrefs.com/blog/ai-brand-visibility-correlations
- Ahrefs, schema and AI citations DiD test, 1,885 pages (2026-05-11) — https://ahrefs.com/blog/schema-ai-citations/
- Ahrefs, AI Overviews reduce clicks, 300,000 searches — https://ahrefs.com/blog/de/ai-overviews-reduce-clicks
- Semrush, 2026 AI Visibility Index, 126M prompts — https://www.semrush.com/news/463141-semrush-releases-expanded-2026-ai-visibility-index-analyzing-126-million-ai-search-prompts/
- arXiv 2606.20065, Generative Engine Optimization at Scale (2026-06-18) — https://arxiv.org/abs/2606.20065
- Otterly, AI Citations Report 2026, 1M+ citations — https://otterly.ai/blog/the-ai-citations-report-2026/
- Seer Interactive, AIO impact on Google CTR (2026 update) — https://www.seerinteractive.com/insights/aio-impact-on-google-ctr-2026-update
- BrightLocal, Local Consumer Review Survey 2026 (2026-03-10, n=1,002) — https://www.brightlocal.com/research/lcrs-ai-trust/
- SOCi 2026 Local Visibility Index, via Search Engine Land (2026-01-28) — https://searchengineland.com/ai-local-visibility-report-2026-468085
- Foundation Marketing / AirOps directory citation study (2026-05-28), via PPC Land — https://ppc.land/yelp-gets-3-4x-more-ai-citations-than-any-rival-in-new-local-search-data/
- Steady Demand / Ben Fisher, ChatGPT local grounding, 4,607 runs (2026-08-21) — https://www.steadydemand.com/chatgpts-local-results-arent-coming-from-foursquare-and-probably-never-really-were/
- Whitespark, 2026 Local Search Ranking Factors (2025-11-06) — https://whitespark.ca/local-search-ranking-factors/
- Whitespark, Guide to Google AI Mode for Local Businesses (2026-05-22) — https://whitespark.ca/guides/whitesparks-guide-to-googles-ai-mode-for-local-businesses/

**Reporting**
- Sterling Sky — State of Local SEO 2026 (2026-06-26) https://www.sterlingsky.ca/the-state-of-local-seo-in-2026/ · Google local changes log https://www.sterlingsky.ca/google-local-changes/
- Search Engine Land — calls vanishing (2026-02-05) https://searchengineland.com/local-rankings-fine-calls-vanishing-468321 · zero-click 2026 https://searchengineland.com/google-zero-click-searches-2026-study-479717 · OpenAI–Yelp (2026-07-23) https://searchengineland.com/openai-yelp-deal-483326 · incentivized reviews (2026-07-24) https://searchengineland.com/google-says-dont-include-fake-or-undisclosed-incentivized-reviews-in-review-snippet-structured-data-483456 · GEO myths (2026-01-19) https://searchengineland.com/geo-myths-lies-467617 · Search Console AI reports global https://searchengineland.com/google-search-console-ai-performance-reports-and-search-generative-ai-control-rolling-out-globally-486269 · site reputation and the EEA https://searchengineland.com/google-wont-respect-manual-actions-for-site-reputation-abuse-in-european-economic-area-486055
- Search Engine Journal — AI Overviews answer most local searches https://www.searchenginejournal.com/ai-overviews-now-answer-most-local-searches-how-to-get-your-business-cited/580757/ · llms.txt guidance (2026-06-17) https://www.searchenginejournal.com/googles-says-its-fine-to-use-llms-txt-for-ai-seo/579608/ · FAQ rich results dropped https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/
- Search Engine Roundtable — AIO pushing AI Mode (2026-08) https://www.seroundtable.com/google-ai-overviews-push-ai-mode-responses-41974.html · volatility continues https://www.seroundtable.com/google-search-ranking-volatility-continues-41952.html
- Other — EFTM Ask Maps expansion (2026-08) https://eftm.com/2026/08/google-rolls-out-gemini-powered-ask-maps-to-150-countries-including-australia-279055 · web.dev INP https://web.dev/blog/inp-cwv-march-12 · chudi.dev Search Console gen-AI report analysis https://chudi.dev/blog/search-console-generative-ai-report · LLM Pulse AIO ranking analysis https://llmpulse.ai/blog/how-to-rank-in-google-ai-overviews/
