# Local SEO for AI Systems

Local search has its own citation mechanics. Run this track when the audience has local intent. Dated claims defer to `search-landscape-2026-09.md`, which wins on any conflict.

**Market neutrality.** The mechanics here apply everywhere; the directory lists do not. Directories are market-specific, and the engine-citation evidence below is from US data. Pick the list that matches the market, and where a market has no measured directory data, say so rather than transplanting another market's list.

**Where a client workspace has a dedicated local skill** — a `str-ai-seo-local` or equivalent built for that business — prefer it. This file is the client-neutral foundation it inherits from.

---

## Contents

- When to run the local track
- The four local surfaces
- Local ranking factor weights
- Google Business Profile completeness
- LocalBusiness schema
- NAP consistency and citation sources
- Directory-by-engine matrix
- Reviews: policy compliance before optimization
- Service-area business rules
- City pages and the doorway gate
- Local AI query behavior
- Report format

---

## When to run the local track

Run when any apply:
- Business has a physical location customers visit
- Business serves a defined geographic area (trades, home services, professional services, clinics)
- Audience uses "near me" or "{city}" queries
- Local news or regional press is a meaningful earned-media channel

Don't run when: pure online business with no geographic specificity, or global software with no country-level variance.

---

## The four local surfaces

Audit them separately. They are won by different work.

| Surface | Fires on | Won by |
|---|---|---|
| **Local Pack / Maps** | Explicitly transactional local, ~93% `[S]` | Google Business Profile, proximity, reviews |
| **Google AI Overviews** | Informational local ~92%, hybrid ~97% `[S]` | Cited content plus organic rank |
| **Google AI Mode** | Increasingly the default surface | Fan-out coverage across the cluster |
| **Answer engines** (ChatGPT, Perplexity, Gemini, Copilot) | Direct recommendation prompts | Off-site directory and mention presence |

**Two structural facts to set expectations against.** `[S]` AI local packs show 1–2 businesses instead of 3 and have no call buttons. `[S]` AI local visibility is far narrower than the Local Pack: across roughly 350,000 locations, ChatGPT recommended 1.2%, Perplexity 7.4% and Gemini 11%, against 35.9% appearing in Google's local 3-pack. That study covers only multi-location brands, so the direction transfers and the percentages do not.

**Never imply AI local visibility is achievable at Local Pack rates.** It is materially harder, and a deliverable that promises otherwise will read as a failure.

---

## Local ranking factor weights

`[S]` Whitespark 2026 Local Search Ranking Factors, published 2025-11-06, 47 experts scoring 187 factors.

| Factor group | Local Pack / Maps weight |
|---|:--:|
| Google Business Profile signals | ~32% |
| Reviews | ~20% |
| On-page | ~15% |
| Behavioral | ~9% |
| Links | ~8% |
| Citations | ~6% |
| Social | ~5% |

**Score citations twice.** They continue to decline as a Local Pack factor while rising as an AI visibility factor. One number for each dimension, not one number overall.

**Local Pack top five:** primary GBP category, proximity to the searcher, keywords in the business title, physical address in the search city, business open at the time of search. The last is newly prominent and is an hours-configuration fix rather than a content one.

**Local organic top five:** dedicated service pages, geographic keyword relevance, quality inbound links to the domain, keywords in landing-page title tags, industry-relevant linking domains.

**New AI-visibility dimension, top drivers:** expert-curated "best of" lists, dedicated service pages, prominence on industry domains, high-quality unstructured citations, and the authority of the review sites carrying the brand.

---

## Google Business Profile completeness

The single biggest local signal, and the AI surfaces read it too — AI Mode scrapes ratings, hours and contact details from it.

| Field | Critical? | Notes |
|---|:--:|---|
| Business name (exact legal or trading name) | Y | Must match schema and every citation. Repeated bilingual names and transliterations are disallowed as of 2026-08-10 |
| Primary category | Y | **A top-five Local Pack factor.** Affects which queries the profile can rank for at all |
| Secondary categories | Y | Use the relevant ones, not all of them |
| Address | Y | Exact match across citations. **Hide it if the business travels to customers** — see service-area rules |
| Service area (if non-premise) | Y | Set properly or risk suspension |
| Phone (matching) | Y | Local number preferred over toll-free |
| Website | Y | |
| Hours, including holiday hours | Y | "Open at time of search" is a top-five Local Pack factor. Wrong hours cost rankings and calls |
| Description | Y | Use the space; work in the core service and geography naturally |
| Products and services | Y | Itemize with descriptions |
| Booking or appointment link | Y if relevant | |
| Attributes | Y | Quality signal |
| Photos (logo, cover, exterior, team, work in progress) | Y | Real photography of actual jobs, not stock |
| Videos | Nice | |
| Posts | Y | Freshness signal |
| Messaging | Nice | Only if genuinely responsive |
| Reviews (respond to all) | Y | Response rate is a ranking signal |

**Check for platform bugs before diagnosing a ranking loss.** 2026 produced repeated Google Business Profile defects: reviews disappearing after reinstatement, review replies not displaying, "no reviews yet" display errors, and widespread review disappearance. Verify live state first. A bug misread as an algorithmic loss produces the wrong remediation.

**Ask Maps replaced the Q&A surface.** `[P]` Gemini-powered Ask Maps launched in March 2026 and expanded to 150+ countries by August. Any playbook step that depends on the old owner-answered Q&A flow needs rewriting.

---

## LocalBusiness schema

Use the most specific subtype that genuinely fits. Schema here is for **entity binding and correctness, not AI citation** — see `authority-signals.md`.

**Common subtypes, most specific first:** `Dentist`, `Physician`, `Notary`, `RealEstateAgent` · `Restaurant`, `Bakery`, `CafeOrCoffeeShop` · `ProfessionalService`, `FinancialService`, `LegalService`, `AccountingService` · `HomeAndConstructionBusiness`, `Plumber`, `Electrician`, `HVACBusiness`, `PestControlService` · `HealthAndBeautyBusiness`, `BeautySalon` · `Store` and its subtypes · fallback `LocalBusiness`.

```json
{
  "@context": "https://schema.org",
  "@type": "{SpecificSubtype}",
  "@id": "https://example.com/#localbusiness",
  "name": "Business Name",
  "image": "https://example.com/logo.png",
  "telephone": "+1-555-555-0100",
  "email": "hello@example.com",
  "url": "https://example.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "{City}",
    "addressRegion": "{State or region code}",
    "postalCode": "{Postal code}",
    "addressCountry": "{ISO country code}"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 0.0,
    "longitude": 0.0
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "17:00"
    }
  ],
  "areaServed": [
    { "@type": "City", "name": "{City}" }
  ],
  "knowsAbout": ["{service}", "{service}", "{disambiguating topic}"],
  "sameAs": [
    "https://www.google.com/maps/place/?q=place_id:{placeid}",
    "https://www.yelp.com/biz/{slug}",
    "https://www.facebook.com/{slug}",
    "https://www.youtube.com/@{handle}"
  ]
}
```

**Note on `streetAddress`:** omit it entirely for a business that travels to customers and does not receive them at a location. Publishing it contradicts the profile configuration and creates a suspension risk.

**`areaServed` and `knowsAbout` are the two fields that earn their keep here.** `areaServed` states the geography without needing a page per city to say it; `knowsAbout` binds the brand to the correct topic, which is the disambiguation defense.

**Multi-location:** each location gets its own page with its own LocalBusiness schema. Link from `Organization.subOrganization` or a locations index. Avoid a single "locations" page listing everything with no individual pages — there is no URL for an engine to cite.

**`aggregateRating`:** only where the reviews are genuine and any incentive is clearly disclosed. See the review policy section below. This is a manual-action surface now.

---

## NAP consistency and citation sources

NAP is Name, Address, Phone. Consistency across every profile is a ranking signal, and inconsistency is the mechanism by which an engine fails to resolve the business at all. `[S]` Business-profile accuracy measured 68% on ChatGPT and Perplexity.

**Method:** inventory every profile that exists, compare NAP across all of them, fix the highest-value ones first, re-audit on a cadence. Use DataForSEO `business_data/business_listings/search` and `business_data/google/my_business_info` to pull profile data programmatically rather than checking by hand.

**Common inconsistencies:** suite numbers on some listings and not others; phone with and without country code; legal suffix variations in the business name; a stale address on an abandoned directory; multiple numbers split across sources.

### Directory lists are market-specific

There is no universal list. Pick the one that matches the market, and treat any list without measured citation data behind it as an assumption.

**United States** — this is the market with measured per-engine data, below:
Google Business Profile · Bing Places · Apple Business Connect · Yelp · Better Business Bureau · Angi · Thumbtack · HomeAdvisor · Nextdoor · Facebook · Chamber of Commerce · industry-specific associations.

**United Kingdom** — no comparable per-engine citation study is available; treat priority as unmeasured:
Google Business Profile · Bing Places · Apple Business Connect · Yelp · Yell · Trustpilot · Checkatrade, Which? Trusted Trader or Rated People for trades · Companies House for the `sameAs` record · local chamber of commerce.

**Any market:** the highest-value citations are usually the unstructured ones a directory tool will never find — local news, neighborhood and community pages, association memberships, sponsorship listings, local business groups. Score them as a category.

---

## Directory-by-engine matrix

`[S]` Foundation Marketing / AirOps, published 2026-05-28, 28.5M AI responses, primary dataset Q4 2025 across ChatGPT, Gemini, Perplexity and Google AI Mode. **US data.**

| Directory | Total AI citations | Priority read |
|---|---:|---|
| Yelp | 512,680 | Highest-leverage off-site local asset, and higher still on ChatGPT since the 2026-07 OpenAI licensing deal |
| Better Business Bureau | 149,710 | Disproportionately important for ChatGPT, and cheap to establish |
| Angi | 145,633 | **The Gemini lever.** Angi led Gemini while Yelp barely registered there |
| Thumbtack | 56,004 | Secondary |
| HomeAdvisor | 33,582 | Secondary |
| Nextdoor | 10,308 | Local and community tail |

Yelp's citations split by engine: Google AI Mode 66%, Perplexity 28.5%, ChatGPT 5%, Gemini under 1%.

**The read: priority is engine-specific, not universal.** A program that optimizes only Yelp wins AI Mode and Perplexity and loses Gemini. Match the directory work to the engines the audience actually uses.

**Yelp is now a tier-1 asset on par with the Google Business Profile** for US local services: complete profile, photos, correct service categories, review responses, and **Request a Quote enabled**, because the OpenAI deal surfaces that flow inside ChatGPT.

`[U]` and not to be used with a client: "Yelp is cited in 33% of local LLM answers", and "Google Business Profile makes up 28.5% of all citations". Both trace only to secondary trade content.

---

## Reviews: policy compliance before optimization

**Run the compliance check before any acquisition advice.** Google tightened review policy twice in 2026 and both changes carry live enforcement risk.

`[P] 2026-04-16` — Gemini-powered enforcement and pre-publication scam detection deployed.

`[P] 2026-04-17` — **Staff review quotas and employee-name solicitation are explicit violations.** The policy prohibits merchants requesting that staff solicit reviews containing specific content, including content identifying a staff member. Staff may invite an honest, open-ended review offered equally to all customers with no reward attached. A customer naming a technician spontaneously is fine; **asking them to is a violation.** Any review-request script that names technicians must be rewritten.

`[P] 2026-07-24` — **Undisclosed incentivized reviews are a named violation** in review-snippet structured data guidelines: reviews not based on genuine experience, and reviews written for money, discounts, vouchers or free products without clear and prominent disclosure. This sits under star-rating eligibility and can trigger a manual action killing review rich-result eligibility while the page still ranks.

**The compliance checklist:** no staff quotas · no asking customers to name an employee · no rewards tied to reviews · any incentive disclosed clearly and prominently · requests open-ended and offered equally to all customers · `Review` and `AggregateRating` markup verified free of fake or undisclosed incentivized reviews.

### What review signals actually do

`[S]` Average star rating of AI-recommended locations clusters around 3.9 to 4.3 across engines. **Rating acts as a filter, not a ranking signal.** The audit question is not "raise the rating" but "is the rating visible, accurate and consistent on every platform an engine reads."

`[S]` Consumer behavior, 1,002 US adults: 45% have used AI to find a local business, up from 6% a year earlier, now the third discovery channel behind Google and Facebook. Among those users, 63% trust AI recommendations, **88% fact-check the sources and 97% double-check against real reviews**, and only 18% are ready to contact the recommended business directly. 47% will not use a business with under 20 reviews; 31% will not use one rated below 4.5.

**The read: AI is a discovery channel, not a closing channel.** The review corpus is what converts an AI mention into a call. That makes review volume and recency a conversion asset, not just a ranking one — which is a better argument for the work than any ranking claim.

**Acquisition, within policy:** an open-ended request to every customer after service, responses to every review, professional handling of negatives with resolution offline. Review platform diversity matters because different engines read different platforms.

---

## Service-area business rules

`[P, long-standing]` A service-area business travels to the customer and **must not display a business address**. Hide it publicly, enter it only for verification, and show service areas instead. A home-based business leaving its address visible faces eventual suspension.

Mail-drop addresses are prohibited unless staffed by your own team during business hours, and suspensions on that basis are very hard to reverse.

**Audit across every profile, not just Google** — the address has to be hidden consistently, and schema must not publish a `streetAddress` the profile hides.

---

## City pages and the doorway gate

A templated page-per-city build sits closest to two live Google policies, and this is where local programs most often break.

`[P]` Pages targeted at different cities that funnel visitors to the same destination are named as doorway abuse, and enforcement has never stopped. `[P]` Scaled content abuse is "when many pages are generated for the primary purpose of manipulating search rankings and not helping users," and it applies equally to AI and human writing.

`[U, practitioner consensus]` The 2026 practical shift: manual actions still happen for egregious cases, but the common outcome for thin location pages is quiet suppression, filtering, or grouping so that only one representative page shows. **The failure mode does not announce itself in Search Console** — which makes the audit the only place it gets caught.

**The gate, and it is blocking:** strip the city name from the title, H1 and body. **If what remains is indistinguishable from any other city page, the page fails.**

**The defense is per-city substance, not per-city templating.** Whitespark's top local organic factor is dedicated service pages, so the pages themselves are right — the templating is the problem. Real per-city substance means local conditions specific to that area, actual jobs done there, named neighborhoods, city-specific reviews, and real photography.

**Linking:** city pages link **up** to service and informational hubs and **out** to genuinely local proof. They do not link sideways into a ring of near-duplicates, which covers nothing and looks like a doorway network.

---

## Local AI query behavior

- **Google AI Overviews and AI Mode** pull from the Google Business Profile, review platforms, and unstructured citations across blogs, news, social, community pages and local association sites. `[P]` Sterling Sky logged in August 2026 that local AI Overviews were pulling from low-quality listicles — being on the right lists matters more than it should.
- **ChatGPT** leans on Yelp for structured business data since the July 2026 deal, with BBB historically strong. Location sharing is live.
- **Perplexity** is reliable for named-city queries and cites local business sites plus review platforms. Yelp is its dominant directory source.
- **Gemini** cites Angi first among directories. Do not assume the Yelp work carries here.
- **Copilot** needs Bing indexation and a Bing Places listing. `[U]` on its weight.

**Track by observation, not rank.** Results are personalized and multi-turn. Log presence and absence per query on a fixed cadence, and record which sources were cited — the recurring third-party sources are the mention target list.

---

## Report format

```markdown
### Local

**Scope:** single-location / multi-location / service-area
**Target geographies:** {list}

**Surface split**
| Surface | Queries tested | Present | Notes |
|---|--:|--:|---|
| Local Pack | | | |
| AI Overviews | | | |
| AI Mode | | | |
| ChatGPT / Perplexity / Gemini / Copilot | | | |

**Blocking gates**
- Review policy compliance: {pass/fail} — {which rule, if failed}
- Service-area address configuration: {pass/fail}
- City-page doorway gate: {n passed / n failed}
- Incentivized-review markup check: {pass/fail/not applicable}

**Google Business Profile completeness:** {score} — {gaps}
**LocalBusiness schema:** {subtype, correctness, entity-binding fields}
**NAP consistency:** {profiles checked, drift found}
**Directory presence by engine:** {matrix against the target market's list}
**Unstructured citations:** {count and type}
**Review signals:** total {N} · average {X.X} · response rate {%} · recency {}
**Call path:** {tracked per surface, yes/no}

**Findings, ranked by impact, risk and dependency order**
1. {finding} — {surface} — {evidence tier} — {reversibility}

**Expectation note:** state the realistic AI-visibility baseline for a brand of this stature.
```

**No time or effort estimates anywhere in the report.** Rank by impact, risk, dependency order and reversibility. Label every statistic `[P]`, `[S]` or `[U]`.
