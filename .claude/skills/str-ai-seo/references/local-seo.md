# Local SEO for AI Systems

Local search has its own citation mechanics. AI systems handling "X near me" or "X in {city}" queries rely heavily on Google Business Profile, LocalBusiness schema, and NAP consistency across citation sources. This file runs when the target audience has local intent.

---

## Contents

- When to run the local track
- Google Business Profile (GBP) completeness
- LocalBusiness schema and its variants
- NAP consistency audit
- Local citation sources (top 20)
- Reviews and aggregateRating
- Local AI query behavior
- Multi-location considerations

---

## When to run the local track

Run this when any of apply:
- Business has a physical location customers visit
- Business serves a defined geographic area (trades, professional services, clinics)
- Target audience uses "near me" or "{city}" queries
- Local news / regional press is a meaningful earned-media channel

Don't run when:
- Pure online business with no geographic specificity
- Global SaaS with no country-level variance

---

## Google Business Profile completeness audit

GBP is the single biggest local AI signal. Google AIO, Gemini, and (indirectly) ChatGPT and Perplexity pull from GBP data.

**Completeness checklist:**

| Field | Critical? | Notes |
|-------|:--:|-------|
| Business name (exact legal / trading name) | Y | Must match schema and all citations |
| Primary category | Y | Affects which queries you rank for |
| Secondary categories | Y | Up to 9 — use them all, relevant only |
| Address | Y | Exact match across all citations |
| Service area (if non-premise) | Y | Set properly or risk de-listing |
| Phone (matching) | Y | Local phone preferred over toll-free |
| Website | Y | |
| Hours (accurate, holiday hours set) | Y | Wrong hours = deranking |
| Description (750 char max) | Y | Use all the space, include 2-3 core keywords naturally |
| Products / services | Y | Itemize with descriptions |
| Appointment / booking link | Y if relevant | |
| Attributes (black-owned, wheelchair accessible, etc.) | Y | Signal quality |
| Photos (logo, cover, interior, exterior, team) | Y | 30+ photos correlates with higher ranking |
| Videos | Nice | 30-second intro video |
| Posts (weekly updates) | Y | Fresh content signal for GBP ranking |
| Q&A (answered by owner) | Y | Address common pre-visit questions |
| Messaging enabled | Nice | If responsive |
| Reviews (respond to all) | Y | Response rate is a ranking signal |

**Audit:** run through every item. Flag anything incomplete or stale.

---

## LocalBusiness schema

Schema.org has a large LocalBusiness hierarchy. Use the most specific subtype you qualify for.

**Common subtypes (most specific first):**
- `Dentist`, `Physician`, `Notary`, `TravelAgency`, `RealEstateAgent`
- `Restaurant`, `Bakery`, `CafeOrCoffeeShop`, `FoodEstablishment`
- `ProfessionalService`, `FinancialService`, `LegalService`, `AccountingService`
- `HomeAndConstructionBusiness`, `Plumber`, `Electrician`, `HVACBusiness`
- `HealthAndBeautyBusiness`, `BeautySalon`, `HairSalon`, `DaySpa`
- `Store`, `AutoPartsStore`, `BikeStore`, `BookStore`
- Fallback: `LocalBusiness`

**Minimum LocalBusiness schema:**

```json
{
  "@context": "https://schema.org",
  "@type": "{SpecificSubtype}",
  "@id": "https://yourdomain.com/#localbusiness",
  "name": "Business Name",
  "image": "https://yourdomain.com/logo.png",
  "telephone": "+44 1234 567890",
  "email": "hello@yourdomain.com",
  "url": "https://yourdomain.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Example St",
    "addressLocality": "London",
    "addressRegion": "England",
    "postalCode": "SW1A 1AA",
    "addressCountry": "GB"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 51.5074,
    "longitude": -0.1278
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  ],
  "areaServed": {
    "@type": "City",
    "name": "London"
  },
  "sameAs": [
    "https://www.google.com/maps/place/?q=place_id:{placeid}",
    "https://www.yelp.com/biz/yourbusiness",
    "https://www.facebook.com/yourbusiness",
    "https://www.instagram.com/yourbusiness"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

**Multi-location:** each location gets its own LocalBusiness schema on its own page. Link each from `Organization.subOrganization` or maintain a `/locations/` index.

**Service-area businesses** (no storefront customers visit): include `areaServed` array of cities/postcodes, include service radius via `GeoCircle`.

---

## NAP consistency audit

NAP = Name, Address, Phone. Consistency across every citation is a ranking signal. Inconsistency = ranking penalty.

**Audit:** build a spreadsheet of every citation source. Compare NAP across all.

**Top 20 NAP-relevant citation sources (UK-weighted; adjust for other markets):**

1. Google Business Profile
2. Bing Places for Business
3. Apple Maps Connect
4. Facebook Business Page
5. Yelp
6. Yell.com
7. Thomson Local
8. Scoot
9. 192.com
10. Companies House (for the record, for schema sameAs)
11. LinkedIn Company Page
12. Trustpilot
13. Industry-specific directories (Checkatrade, Which? Trusted Trader, Rated People for trades)
14. Nextdoor
15. BBB (if US operations)
16. Wikidata entry
17. Crunchbase (for B2B)
18. Better Business Bureau
19. Hotfrog
20. Cylex

**Tool:** BrightLocal, Whitespark, or Moz Local automate the NAP audit. For smaller scope, manual spreadsheet works.

**Common inconsistencies:**
- Suite/apartment numbers included on some, not others
- Phone with country code on some, local format on others
- "Ltd" vs "Limited" in business name
- Old address still on stale directories
- Multiple phone numbers (main vs direct vs mobile) split across sources

**Fix approach:**
1. Decide canonical NAP (copy-paste-exact)
2. Start with top 10 citations — fix each
3. Use a NAP management tool to submit corrections in bulk for tier-2 citations
4. Re-audit quarterly

---

## Reviews and aggregateRating

Reviews drive local AI citation more than any other single factor in 2026.

**Review signals that matter:**

| Signal | Weight | Notes |
|--------|:--:|------|
| Total review count | High | Target: 100+ on primary (Google) for competitive areas |
| Average rating | High | Below 4.0 significantly lowers citation probability |
| Review recency | High | Aim for a few reviews monthly |
| Response rate | Medium | Respond to every review, positive or negative |
| Review keyword diversity | Medium | AI systems parse review text for topical signals |
| Review platform diversity | Medium | Google + Yelp + industry-specific (e.g. Trustpilot for UK services) |

**aggregateRating schema:** embed on homepage + relevant service pages. Use real numbers (don't fake — Google penalizes fake review schema harshly).

**Acquisition workflow:**
- Automated post-service request (email or SMS) linking directly to Google review form
- Respond to every review within 48 hours
- Negative review → respond professionally, resolve offline if possible
- Never incentivize reviews (Google policy violation)

---

## Local AI query behavior

"Near me" queries have distinct AI behavior:

**Google AIO:** pulls from GBP + local pack. Citations heavily favor the 3-pack.

**ChatGPT:** less reliable for hyper-local (often says "I can't determine your location"). When it does answer, pulls from Wikipedia-level local sources (city pages), review aggregators.

**Perplexity:** reliable for named city queries ("{service} in {city}"). Cites directly to local business websites + review sites. Weaker on "near me" without geolocation access.

**Claude:** Brave Search-backed — Brave has growing local coverage but trails Google. Verify visibility at search.brave.com for local queries.

**Optimize for all:** the same signals work across platforms — complete GBP, local-pack visibility, strong on-page LocalBusiness schema, NAP consistency, rich reviews.

---

## Multi-location considerations

If operating in multiple cities:

- Separate page per location with unique LocalBusiness schema
- Location-specific content (not boilerplate template) — photos, team, local testimonials
- Location-specific URLs (`/locations/london/`, `/locations/manchester/`)
- Breadcrumb schema linking location → organization
- `areaServed` on Organization root

Avoid: single "locations" page listing all, with no individual dedicated pages. AI systems can't cite a single-URL list.

---

## Report format for local

```markdown
### Local SEO

**Scope:** single-location / multi-location / service-area
**Target geographies:** {list}

**Google Business Profile completeness:** {/15 checklist score}
**LocalBusiness schema:** {present/correct subtype/missing fields}
**NAP consistency:** {passes/fails across top 20 citations}
**Review signals:**
  - Total: {N}
  - Average: {X.X}
  - Response rate: {%}
**Local AI query testing:** {pass/fail per platform × 5 queries}

**Score:** {0-100}
**Launch-critical local fixes:** {list}
**Post-launch:** {list}
```
