---
document: 2.8 — Schema Markup Plan
project: website-rebuild-rebrand
created: 2026-03-27
status: draft
notes: JSON-LD structured data for every page type. Triple-stack where possible (1.8x AI citation rate).
---

# 2.8 — Schema Markup Plan

Every page on the new site gets structured data. Current site has zero schema — this is the single biggest technical SEO and GEO gap.

---

## Why This Matters

- Pages with triple-stack schema receive **1.8x more AI citations** than single-schema pages
- FAQ schema is the **most cited format** by AI systems
- LocalBusiness schema is **required** for local search features (map pack, knowledge panel)
- HowTo schema gets extracted into **featured snippets and AI Overviews**
- Zero competitors in the WA mole control niche have schema — first-mover advantage

---

## Sitewide Schema (every page)

### Organization (sitewide, in `<head>`)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Got Moles",
  "url": "https://got-moles.com",
  "logo": "https://got-moles.com/images/got-moles-logo.png",
  "description": "Got Moles is a veteran-owned mole control specialist serving Western Washington since 2017. Chemical-free, guaranteed results.",
  "founder": {
    "@type": "Person",
    "name": "Spencer Hill"
  },
  "foundingDate": "2017",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "718 Griffin Ave #905",
    "addressLocality": "Enumclaw",
    "addressRegion": "WA",
    "postalCode": "98022",
    "addressCountry": "US"
  },
  "telephone": "+12537500211",
  "sameAs": [
    "https://www.facebook.com/getridofmoles/",
    "https://www.yelp.com/biz/got-moles-enumclaw",
    "https://nextdoor.com/pages/got-moles-enumclaw-wa/"
  ]
}
```

### BreadcrumbList (every page except homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://got-moles.com/" },
    { "@type": "ListItem", "position": 2, "name": "{Page Name}", "item": "https://got-moles.com/{page-url}/" }
  ]
}
```

---

## Page-Specific Schema

### Homepage — /

**Triple stack: LocalBusiness + AggregateRating + Organization**

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://got-moles.com/#business",
  "name": "Got Moles",
  "description": "Veteran-owned mole control specialist serving Western Washington since 2017. Chemical-free methods, guaranteed results, year-round protection.",
  "url": "https://got-moles.com",
  "telephone": "+12537500211",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "718 Griffin Ave #905",
    "addressLocality": "Enumclaw",
    "addressRegion": "WA",
    "postalCode": "98022"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "47.2040",
    "longitude": "-121.9910"
  },
  "areaServed": {
    "@type": "State",
    "name": "Washington",
    "description": "Western Washington — King, Pierce, Thurston, and Snohomish Counties"
  },
  "priceRange": "$",
  "image": "https://got-moles.com/images/got-moles-hero.jpg",
  "founder": {
    "@type": "Person",
    "name": "Spencer Hill",
    "jobTitle": "Owner & Founder",
    "description": "US Army veteran (2011-2014), mole control specialist since 2017"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "[SPENCER TO CONFIRM]",
    "bestRating": "5"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "08:00",
    "closes": "18:00"
  }
}
```

### TMCP Page — /services/total-mole-control-program/

**Triple stack: Service + Offer + FAQPage**

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Total Mole Control Program",
  "description": "Year-round mole protection for $100/month. Regular visits, active monitoring, immediate response to mole activity, and a report after every visit.",
  "provider": { "@id": "https://got-moles.com/#business" },
  "areaServed": "Western Washington",
  "offers": {
    "@type": "Offer",
    "price": "100.00",
    "priceCurrency": "USD",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": "100.00",
      "priceCurrency": "USD",
      "unitText": "month",
      "billingDuration": "P12M"
    }
  }
}
```

Plus FAQPage schema with 5-8 TMCP-specific Q&As.

### One-Time Removal — /services/one-time-mole-removal/

**Triple stack: Service + Offer + FAQPage**

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "One-Time Mole Removal",
  "description": "Professional mole eradication for residential properties under 1 acre. $450 flat rate including inspection, weekly visits, and guarantee.",
  "provider": { "@id": "https://got-moles.com/#business" },
  "areaServed": "Western Washington",
  "offers": {
    "@type": "Offer",
    "price": "450.00",
    "priceCurrency": "USD"
  }
}
```

Plus FAQPage schema with eradication-specific Q&As.

### Commercial — /services/commercial-mole-control/

**Double stack: Service + FAQPage**

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Commercial Mole Control",
  "description": "Annual mole control contracts for commercial properties, property managers, HOAs, sports facilities, and schools across Western Washington.",
  "provider": { "@id": "https://got-moles.com/#business" },
  "areaServed": "Western Washington"
}
```

No pricing in schema (commercial is custom-quoted).

### How It Works — /how-it-works/

**Double stack: HowTo + FAQPage**

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How Got Moles' Mole Control Process Works",
  "description": "From first call to mole-free yard in 4 steps.",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Call or Book Online",
      "text": "Contact Got Moles at (253) 750-0211. We'll ask a few questions about your property and the mole activity you've noticed."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Property Inspection",
      "text": "A Got Moles technician walks your entire property, maps active mole runs, and develops a custom trapping strategy."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Professional Trapping",
      "text": "Equipment is placed on active tunnels and checked weekly. Adjustments are made based on mole activity patterns."
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Results Report",
      "text": "After every visit, you receive a clear report on what was found and what was done. No guessing."
    }
  ]
}
```

### About — /about/

**Double stack: Person + Organization**

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Spencer Hill",
  "jobTitle": "Owner & Founder",
  "worksFor": { "@id": "https://got-moles.com/#business" },
  "description": "US Army veteran and founder of Got Moles, Washington's mole control specialist since 2017.",
  "birthPlace": "Buckley, Washington",
  "homeLocation": {
    "@type": "Place",
    "name": "Enumclaw, Washington"
  },
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "Military Service",
    "description": "US Army Infantryman, 2011-2014"
  },
  "knowsAbout": ["mole control", "mole trapping", "Townsend's mole", "Pacific Northwest mole species", "Washington State Initiative 713"]
}
```

### Reviews — /reviews/

**AggregateRating + Review**

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://got-moles.com/#business",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "[SPENCER TO CONFIRM]",
    "bestRating": "5"
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "[Customer Name]" },
      "reviewRating": { "@type": "Rating", "ratingValue": "5" },
      "reviewBody": "[Review text]",
      "datePublished": "[Date]"
    }
  ]
}
```

### FAQ — /faq/

**FAQPage (highest GEO-value schema)**

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do you use poison or chemicals?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Got Moles uses only chemical-free trapping methods that are legal under Washington State law (Initiative 713). Our methods are safe for children and pets."
      }
    },
    {
      "@type": "Question",
      "name": "How much does mole removal cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Got Moles offers a One-Time Mole Removal service for $450 (residential properties under 1 acre) and a Total Mole Control Program for $100/month for year-round protection. Commercial properties are quoted on inspection."
      }
    }
  ]
}
```

25+ Q&As in this format.

### City Pages — /mole-control-{city}/

**Triple stack: LocalBusiness (city-specific) + Service + FAQPage**

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Got Moles - {City} Mole Control",
  "description": "Professional mole control in {City}, Washington. Veteran-owned, chemical-free, guaranteed results.",
  "url": "https://got-moles.com/mole-control-{city}/",
  "telephone": "+12537500211",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "{City}",
    "addressRegion": "WA",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "{city-lat}",
    "longitude": "{city-lng}"
  },
  "parentOrganization": { "@id": "https://got-moles.com/#business" }
}
```

Each city page needs its own geo coordinates. Plus 2-3 city-specific FAQ items in FAQPage schema.

### Blog Posts — /{post-slug}/

**Double stack: Article + FAQPage**

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{Post Title}",
  "author": {
    "@type": "Person",
    "name": "Spencer Hill",
    "url": "https://got-moles.com/about/"
  },
  "publisher": { "@id": "https://got-moles.com/#business" },
  "datePublished": "{YYYY-MM-DD}",
  "dateModified": "{YYYY-MM-DD}",
  "mainEntityOfPage": "https://got-moles.com/{post-slug}/"
}
```

Plus FAQPage schema with 2-3 Q&As extracted from each post.

---

## Schema Implementation Checklist

| Page Type | LocalBusiness | Service | FAQPage | HowTo | Article | Person | AggregateRating | BreadcrumbList |
|-----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Homepage | ✅ | — | — | — | — | — | ✅ | — |
| TMCP | — | ✅ | ✅ | — | — | — | — | ✅ |
| One-Time Removal | — | ✅ | ✅ | — | — | — | — | ✅ |
| Commercial | — | ✅ | ✅ | — | — | — | — | ✅ |
| How It Works | — | — | ✅ | ✅ | — | — | — | ✅ |
| About | — | — | — | — | — | ✅ | — | ✅ |
| Reviews | ✅ | — | — | — | — | — | ✅ | ✅ |
| FAQ | — | — | ✅ | — | — | — | — | ✅ |
| City pages (x72) | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| Blog posts (x25+) | — | — | ✅ | — | ✅ | — | — | ✅ |
| Contact | ✅ | — | — | — | — | — | — | ✅ |

---

## Geo Coordinates for Priority Cities

Required for city page LocalBusiness schema. Full list needed for all 72 cities.

| City | Latitude | Longitude |
|------|----------|-----------|
| Seattle | 47.6062 | -122.3321 |
| Tacoma | 47.2529 | -122.4443 |
| Bellevue | 47.6101 | -122.2015 |
| Sammamish | 47.6163 | -122.0356 |
| Kirkland | 47.6815 | -122.2087 |
| Puyallup | 47.1854 | -122.2929 |
| Auburn | 47.3073 | -122.2285 |
| Renton | 47.4829 | -122.2171 |
| Kent | 47.3809 | -122.2348 |
| Federal Way | 47.3223 | -122.3126 |
| Issaquah | 47.5301 | -122.0326 |
| Enumclaw | 47.2040 | -121.9910 |

Remaining 60 cities to be populated during Phase 5 build.

---

## Validation Plan

Before launch, every page must pass:
1. **Google Rich Results Test** — zero errors
2. **Schema.org validator** — valid JSON-LD
3. **Manual check** — correct business name, address, phone on every LocalBusiness instance
4. **Review count verified** — AggregateRating reviewCount matches actual verified count
