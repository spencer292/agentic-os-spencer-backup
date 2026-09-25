# Directory and Citation Surfaces, by Engine

The reference for Step 8. Covers which directories each engine actually reads, how to audit the Yelp profile that now carries the most weight, and the Bing and Apple surfaces that are cheap, plausible and unmeasured.

Full sourcing: `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` §4.1 and §4.2 (install root).

## The correction that reframes this whole file

**Foursquare is not ChatGPT's local grounding source and probably never was.** [S] Steady Demand, 2,880 prompts across 12 verticals and 12 metros, 4,607 successful runs, August 2026: Foursquare appeared in **0.00%** of citations on ChatGPT's primary surface, while **Yelp was attached to 95.83% of structured business cards**. Any inherited recommendation to build or optimize a Foursquare listing is retired. Do not reintroduce it.

**Yelp is now a tier-1 asset on par with GBP.** [P] OpenAI signed a Yelp licensing deal on 2026-07-23 covering reviews, ratings, photos, business details and Yelp's **Request a Quote** flow for local services.

The Steady Demand author's own caveat applies to the replacement as much as to the thing replaced: partnership numbers have shelf lives. Re-check this against the landscape file each quarter.

## Directory priority — total AI citations

[S] Foundation Marketing / AirOps, 28.5M AI responses, published 2026-05-28, primary dataset Q4 2025 across ChatGPT, Gemini, Perplexity and Google AI Mode.

| Priority | Directory | Total AI citations | Read |
|:-:|---|---|---|
| 1 | Yelp | 512,680 | Highest-leverage off-site local asset, higher still on ChatGPT post-deal |
| 2 | Better Business Bureau | 149,710 | Disproportionately important for ChatGPT, which BBB led at 68,617. Cheap to establish |
| 3 | Angi | 145,633 | The Gemini lever — Angi led Gemini at 18,870 while Yelp scored 49 |
| 4 | Thumbtack | 56,004 | Secondary |
| 5 | HomeAdvisor | 33,582 | Secondary |
| 6 | Nextdoor | 10,308 | Local and community tail |

Yelp's own citations split by engine: Google AI Mode 340,721 (66%), Perplexity 146,196 (28.5%), ChatGPT 25,681 (5%), Gemini 49 (under 1%).

## Directory by engine — audit in this order

| Engine | What it reads first | Practical instruction |
|---|---|---|
| **Google AI Mode** | Yelp, plus GBP ratings/hours/contact and unstructured citations from blogs, news, social, community pages and sponsorship listings | Yelp first, then the unstructured layer in §8d of the skill |
| **Perplexity** | Yelp (62.1% of its local directory citations). Trade adds TripAdvisor and Google Maps data | Yelp. [P] Perplexity documents nothing about selection or citation logic — anyone claiming to know it is inventing it |
| **ChatGPT** | BBB first historically (68,617 in Q4 2025), Yelp rising sharply post-deal | Do both. Enable Request a Quote on Yelp |
| **Gemini** | Angi, decisively | Angi. Yelp is near-absent here, so a Yelp-only citation strategy leaves Gemini uncovered |
| **Copilot / Bing** | Bing index. [P] Bing indexation is a hard prerequisite for Copilot citation | Bing Places, and confirm the site is indexed in Bing at all |

## Yelp audit — same depth as a GBP

The single highest-leverage item in Step 8, and the one most likely to be sitting unclaimed or half-complete.

| Section | Pass criteria |
|---|---|
| Claim status | Claimed and verified, per location |
| **Request a Quote** | **Enabled.** This is the specific flow the OpenAI deal surfaces inside ChatGPT for local services. Leaving it off forfeits the highest-leverage single item in this step |
| Categories | Correct and complete. Pest control primary, with the mole-specific and wildlife-adjacent categories Yelp offers |
| Business details | Hours, service area, description, attributes. Complete, not partial |
| Photos | Current and distinct per location. Not the same set as GBP or as each other |
| Review responses | Response rate and tone held to the same standard as GBP |
| NAP | Identical to GBP, character for character. Watch phone-format drift |

## Bing Places — free, four surfaces, unmeasured

One Bing Places listing surfaces in Bing, Yahoo Search, Microsoft Copilot and Windows Search. [U] on its actual weight in Copilot local answers — no study reaches it. It is free and plausible, so do it, and **label it in the report as unmeasured** so nobody mistakes it for an evidence-backed lever.

| Section | Pass criteria |
|---|---|
| Claim status | All 3 profiles claimed and verified. Free import from GBP, but verify the import did not lose data |
| NAP | Matches GBP exactly. Bing matches strictly, so watch phone-format drift |
| Categories | Primary pest control. Bing's category set is smaller than Google's — pick the closest match per location |
| Hours | Match GBP. Bing's "open now" surfaces in Copilot answers about local availability |
| Photos | At least 10 per location |
| Services | List TMCP, One-Time and Commercial. Bing parses these into structured offerings |
| Reviews | Verify the aggregate rating shows. "Based on N reviews" with no rating means the import broke |
| Indexation | [P] Confirm got-moles.com is indexed in Bing at all — it is a hard prerequisite for Copilot citation |

**IndexNow.** [P] Google does not support it; Bing, Yandex, Naver, Seznam, Yep and Amazon do. Worth submitting for Bing, which matters for Copilot. [U] on IndexNow materially raising citation odds — do not sell it as one.

## Bing Webmaster Tools — AI Performance

[P] Public preview since 2026-02-10. Surfaces total citations, average cited pages, page-level citation activity, visibility trends across Copilot and Bing AI summaries, and **grounding queries** — the phrasing the AI used to retrieve a page.

**UI only. There is no API.** This is a manual export every time.

Grounding queries are real retrieval phrasing that no keyword tool has. Feed them straight into `str-question-harvester` and `str-keyword-strategy` rather than leaving them in the report. The property must be verified and needs time to populate before data appears.

## Apple Business Connect — free, unmeasured

Surfaces in Apple Maps, Siri and Spotlight. [U] on its weight in Siri local answers, and [U] on the reported 2026-04-14 consolidation of Business Connect, Business Manager and Business Essentials into one Apple Business platform — Apple newsroom confirmation was not reachable. Free and plausible, so do it, and label it unmeasured.

| Section | Pass criteria |
|---|---|
| Claim | All 3 locations claimed and verified |
| Showcases | At least 1 active per location. Photo, headline, CTA |
| Action button | Set per location: Call, Directions or Website, chosen against the funnel |
| Photos | At least 5 per location |
| Reviews | Apple's review pool is independent of Google's and counts separately |

## Unstructured citations — the category a tool cannot find

[S] Whitespark's new AI-search-visibility dimension names high-quality unstructured citations among its top drivers, alongside expert-curated best-of lists and prominence on industry domains. [S] Google AI Mode is documented scraping blogs, news, social, community pages, sponsorship listings, industry publications and local business association sites.

Audit presence across: Western Washington chambers of commerce, local news outlets, neighborhood and homeowner associations, community event and sponsorship listings, pest-control and lawn-care industry publications, and any "best mole removal in {city}" roundup.

[S] Ranked best-of listicles are the single most-cited format at roughly 21% of all citations (arXiv 2606.20065). [P] Sterling Sky logged on 2026-08-12 that AI Overviews for local queries were pulling from low-quality listicles. Being on the right lists matters more than it should. Hand the target list to `str-authority-strategy`.

## NAP consistency — state the blast radius

NAP inconsistency across GBP, Yelp, Facebook, BBB, Angi and the website is the mechanism by which an engine fails to resolve the business at all. [S] Profile accuracy measured 68% on ChatGPT and Perplexity against 100% on Gemini.

Write findings with the blast radius attached: a phone-format drift on Yelp is a ChatGPT, Perplexity and AI Mode problem, not a Yelp problem. That is what makes the fix worth doing.

## Sources

- [S] Foundation Marketing / AirOps directory citation study (2026-05-28), via PPC Land — https://ppc.land/yelp-gets-3-4x-more-ai-citations-than-any-rival-in-new-local-search-data/
- [S] Steady Demand / Ben Fisher, ChatGPT local grounding, 4,607 runs (2026-08-21) — https://www.steadydemand.com/chatgpts-local-results-arent-coming-from-foursquare-and-probably-never-really-were/
- [P] Search Engine Land, OpenAI–Yelp deal (2026-07-23) — https://searchengineland.com/openai-yelp-deal-483326
- [P] Bing Webmaster Tools AI Performance public preview (2026-02-10) — https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview
- [S] Whitespark 2026 Local Search Ranking Factors — https://whitespark.ca/local-search-ranking-factors/
- Everything else: `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` §4

## Retired claims

Removed 2026-09-02, do not reintroduce:

- Foursquare as a ChatGPT local data source, in any form.
- "ChatGPT cites Yelp 4.2% of the time for local-service queries (2026 GEO benchmark data)" — no traceable source, and superseded by the measured 95.83% structured-business-card figure.
- "Bing Business Profile Image Slider (2026 feature) shows top 6 in Copilot results" — no reachable primary.
- "Angi: weak AI citation" — the opposite is true. Angi is the Gemini lever.
- "BBB: weak in AI Overview citation" — BBB led ChatGPT citations in the Q4 2025 dataset.
- "Nextdoor cites heavily in hyperlocal AI Overviews" — Nextdoor is last of six in the measured directory ranking. Keep it, weight it accordingly.
