---
page: city-page-template
type: landing-page-organic
url: /mole-control-{city}/
date: 2026-04-01
sections: 8
estimated_words: 500-700 per city (unique)
total_pages: 72
status: draft
primary_keyword: mole control {City}
schema: LocalBusiness (city-specific) + Service + FAQPage
---

# City Page Template Blueprint — Got Moles

This template produces 72 city pages. Each page MUST have unique content. No find-and-replace boilerplate. The CityPages collection in Payload CMS holds the city-specific data. The template renders it.

**SEO critical:** City pages are the SEO backbone. They protect the existing 635 #1 keywords.

---

## Section 1: GEO Definition + Hero
**Job:** Immediately answer "do they serve my city?" and provide an AI-citable summary.
- GEO block: "{City} homeowners trust Got Moles for professional mole control. As Western Washington's only mole-exclusive specialist, Got Moles serves {City} and surrounding {County} communities with chemical-free methods and guaranteed results. Founded in 2017, the company has served nearly 5,000 clients across 70+ cities."
- H1: "MOLE CONTROL IN {CITY} — GUARANTEED RESULTS FROM WASHINGTON'S MOLE SPECIALIST"
- CTA: Gold button "CALL (253) 750-0211"
- Micro-proof: "★★★★★ 219+ Five-Star Reviews"
- **Background:** Grass-600
- Estimated words: 60-80 (unique per city)

## Section 2: The Mole Problem in {City}
**Job:** City-specific content that proves Got Moles knows this area.
- H2: "MOLES IN {CITY}"
- Gold divider
- 2-3 paragraphs covering:
  - Local soil conditions (e.g., "Sammamish's well-irrigated lots and rich topsoil create ideal conditions for Townsend's moles")
  - Common damage patterns in this area
  - Neighborhood references where possible
  - Why this city's homeowners specifically need a specialist
- **This content MUST be genuinely unique per city. Not templated.**
- **No CTA.**
- **Background:** Blue-600
- Estimated words: 120-180 (unique)

## Section 3: Our Services
**Job:** Quick overview with links. Don't replicate service pages.
- H2: "HOW WE HELP {CITY} HOMEOWNERS"
- Gold divider
- 3 service cards (FeatureGrid block):
  - TMCP: "$100/month year-round protection" → link to /services/total-mole-control-program/
  - One-Time: "$450 flat rate eradication" → link to /services/one-time-mole-removal/
  - Commercial: "Custom quote for property managers" → link to /services/commercial-mole-control/
- **Background:** Cream-50
- Estimated words: 60-80

## Section 4: How It Works (condensed)
**Job:** Quick 4-step summary. Don't replicate the full How It Works page.
- H2: "HOW IT WORKS"
- 4 steps: Call → Inspect → Trap → Results. One line each.
- Link: "See the full process" → /how-it-works/
- **Background:** Grass-600
- Estimated words: 40-60

## Section 5: Trust Signals
**Job:** Compact proof strip.
- Trust bar: Veteran-Owned | Nearly 5,000 Clients | Guaranteed | Chemical-Free | Safe for Pets
- **Background:** Blue-600
- Estimated words: 10-15

## Section 6: Reviews from {City}
**Job:** Local social proof. Reviews from this city or nearest.
- H2: "WHAT {CITY} CUSTOMERS SAY"
- Gold divider
- 2-3 testimonials. Prioritize reviews from this city. Fall back to county if none available.
- Name + city + star rating
- **Background:** Grass-600
- Estimated words: 80-120

## Section 7: City FAQ
**Job:** City-specific questions. FAQPage schema.
- 3 questions:
  - "Do you service {City}?" → Yes, with specifics about coverage
  - "How quickly can you get to {City}?" → Response time from nearest base
  - "How bad is the mole problem in {City}?" → City-specific mole activity info
- **Background:** Cream-50
- Estimated words: 100-150

## Section 8: Final CTA
- H2: "READY FOR MOLE-FREE LIVING IN {CITY}?"
- Gold CTA + form
- **Background:** gradient (Blue → Rust)
- Estimated words: 25-35

### Navigation
- **Internal links from:** Homepage service area grid, adjacent city pages, blog posts
- **Internal links to:** Service pages, /how-it-works/, /about/, adjacent city pages, /service-areas/ hub

### Content Rules
- Minimum 500 words unique per city
- Reference local landmarks, neighborhoods, or soil conditions
- Every city page links to 2-3 adjacent city pages (internal linking mesh)
- Each city page links up to /service-areas/ hub

### Data-Driven Rendering
- CityPages collection in Payload provides: cityName, slug, county, headline, introText, localDetails, FAQs
- Frontend template renders the same layout for all 72 cities
- Route: `/mole-control-{slug}/` (e.g., `/mole-control-sammamish/`)

### Priority Cities (top 12, built first)
Sammamish, Bellevue, Kirkland, Seattle, Tacoma, Puyallup, Auburn, Federal Way, Renton, Kent, Issaquah, Enumclaw

---

*Generated 2026-04-01. Task 4.9.*
