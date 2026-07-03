/**
 * JSON-LD Schema Markup Utilities
 * Triple-stack schema for maximum SEO + GEO coverage.
 * Zero competitors have schema — first-mover advantage.
 */

// Shared business data used across all schema types
export const BUSINESS = {
  name: 'Got Moles',
  url: 'https://got-moles.com',
  phone: '+12537500211',
  phoneDisplay: '(253) 750-0211',
  logo: 'https://got-moles.com/images/got-moles-logo.png',
  description:
    "Veteran-owned mole control specialist serving Western Washington since 2017. Chemical-free methods. Nearly 5,000 clients served.",
  founder: 'Spencer Hill',
  foundingDate: '2017',
  address: {
    streetAddress: '718 Griffin Ave #905',
    city: 'Enumclaw',
    state: 'WA',
    zip: '98022',
  },
  geo: { lat: '47.2040', lng: '-121.9910' },
  social: [
    // Google Business Profiles (3 locations, 219+ combined reviews)
    'https://www.google.com/search?q=Got+Moles&stick=H4sIAAAAAAAA_-NgU1I1qDA1sTRIM0xLTTVOMTY3tEiyMqhISra0MDVJMjJOSks1MDGzWMTK6Z5fouCbn5NaDADUzhEoNQAAAA',
    'https://www.google.com/search?q=Got+Moles?&stick=H4sIAAAAAAAA_-NgU1I1qDA1sTQwMU5MsUg1TzRKNEqxAgpZppibmRuamlpaJBpamBotYuVyzy9R8M3PSS22BwASNXHuNgAAAA',
    'https://www.google.com/search?q=Got+Moles?&stick=H4sIAAAAAAAA_-NgU1I1qDA1sTQwNbUwNbM0SjSwNE6yMqhIMkhKNLFIMTQ1NjYxSzM1XsTK5Z5fouCbn5NaDADUzhEoNQAAAA',
    // Social
    'https://www.facebook.com/getridofmoles',
    'https://www.instagram.com/got_moles/',
    'https://www.linkedin.com/company/got-moles/',
    'https://www.yelp.com/biz/got-moles-enumclaw',
    'https://nextdoor.com/pages/got-moles-enumclaw-wa/',
  ],
  reviewCount: 219,
  ratingValue: '5.0',
  // UPDATE this ISO 8601 date when site content changes materially (ENRICH-01, ENRICH-02)
  siteLastUpdated: '2026-05-21',
} as const

// Physical branch locations (3 GBP-backed offices)
const BRANCHES = [
  {
    slug: 'enumclaw',
    city: 'Enumclaw',
    streetAddress: '718 Griffin Ave #905',
    zip: '98022',
    geo: { lat: '47.2040', lng: '-121.9910' },
  },
  {
    slug: 'seattle',
    city: 'Seattle',
    streetAddress: '14900 Interurban Ave S Ste 271-105',
    zip: '98168',
    geo: { lat: '47.4689158', lng: '-122.2525183' },
  },
  {
    slug: 'tacoma',
    city: 'Tacoma',
    streetAddress: '2367 Tacoma Ave S',
    zip: '98402',
    geo: { lat: '47.2400663', lng: '-122.4413297' },
  },
] as const

// Topical authority + service catalog — shared between organizationSchema
// (sitewide entity) and localBusinessSchema (homepage). Single source of
// truth so the two schema nodes never drift. Extracted 2026-05-08 as part
// of marketing-os GSD Phase 2.2 sitewide schema architecture pass.
const BRAND_KNOWS_ABOUT = [
  'Mole control',
  'Mole trapping',
  "Townsend's mole",
  'Pacific Northwest mole species',
  'Western Washington mole control',
  'Year-round mole protection',
  'Chemical-free mole control methods',
  'Commercial mole control',
] as const

const BRAND_OFFER_CATALOG = {
  '@type': 'OfferCatalog',
  name: 'Got Moles Services',
  itemListElement: [
    {
      '@type': 'Offer',
      name: 'One-Time Mole Removal',
      url: BUSINESS.url + '/services/one-time-mole-removal/',
      price: '450',
      priceCurrency: 'USD',
      description:
        'Flat-rate one-time mole removal for residential properties under 1 acre. Includes inspection, equipment setup, and 4-5 weekly service visits. $150 setup fee only if no moles are caught.',
      itemOffered: {
        '@type': 'Service',
        name: 'One-Time Mole Removal',
        description: 'Professional chemical-free mole trapping for residential properties.',
      },
    },
    {
      '@type': 'Offer',
      name: 'Total Mole Control Program',
      url: BUSINESS.url + '/services/total-mole-control-program/',
      price: '100',
      priceCurrency: 'USD',
      description:
        'Year-round monthly mole protection at $100/month with a 12-month minimum. Includes regular monitoring, immediate response between visits at no extra charge, and a written report after every visit.',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '100',
        priceCurrency: 'USD',
        unitText: 'MONTH',
        billingDuration: 'P12M',
      },
      itemOffered: {
        '@type': 'Service',
        name: 'Total Mole Control Program',
        description: 'Year-round monitoring and active mole protection.',
      },
    },
    {
      '@type': 'Offer',
      name: 'Commercial Mole Control',
      url: BUSINESS.url + '/services/commercial-mole-control/',
      description:
        'Custom-quoted annual contracts for properties over 1 acre or commercial sites — HOAs, sports facilities, schools, property managers. Phone consultation first; site walkthrough arranged as part of the engagement.',
      itemOffered: {
        '@type': 'Service',
        name: 'Commercial Mole Control',
        description: 'Annual mole control contracts for commercial properties.',
      },
    },
  ],
} as const

// Speakable WebPage helper — emit alongside other page-type schemas
// (Service, FAQPage, etc.) so AI voice assistants and AI Overviews
// can identify which DOM elements to read aloud and cite. Pixelmojo
// 2026-05-08 high-impact action #1. Per Schema.org, `speakable` is
// supported on WebPage and Article — NOT on Service or FAQPage —
// so we emit a small companion WebPage node carrying the selector.
export function webPageSpeakable(opts: { url: string; name: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: BUSINESS.url + opts.url,
    name: opts.name,
    isPartOf: { '@id': `${BUSINESS.url}/#website` },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'main h2'],
    },
  }
}

// ─── Sitewide (every page) ────────────────────────────────────

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BUSINESS.url}/#organization`,
    name: BUSINESS.name,
    url: BUSINESS.url,
    logo: BUSINESS.logo,
    description: BUSINESS.description,
    founder: {
      '@type': 'Person',
      name: BUSINESS.founder,
    },
    foundingDate: BUSINESS.foundingDate,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.address.streetAddress,
      addressLocality: BUSINESS.address.city,
      addressRegion: BUSINESS.address.state,
      postalCode: BUSINESS.address.zip,
      addressCountry: 'US',
    },
    telephone: BUSINESS.phone,
    sameAs: BUSINESS.social,
    // Sitewide topical authority signal — every page (not just homepage)
    // surfaces what Got Moles is an authority on. Counters AI mis-
    // categorisation hallucinations (e.g. ChatGPT framing as dermatology).
    knowsAbout: BRAND_KNOWS_ABOUT,
    // Sitewide pricing signal — every page corrects pricing hallucination
    // at source. Pixelmojo 2026-05-08 flagged AI providers fabricating
    // pricing because the Organization node (sitewide) didn't expose it;
    // only LocalBusiness on homepage did. Now consistent on every page.
    hasOfferCatalog: BRAND_OFFER_CATALOG,
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BUSINESS.url + '/' },
      ...items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: item.name,
        item: BUSINESS.url + item.url,
      })),
    ],
  }
}

// ─── Homepage ──────────────────────────────────────────────────

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${BUSINESS.url}/#business`,
    name: BUSINESS.name,
    description:
      'Veteran-owned mole control specialist serving Western Washington since 2017. Chemical-free methods. Nearly 5,000 clients served. Year-round protection available.',
    url: BUSINESS.url,
    telephone: BUSINESS.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.address.streetAddress,
      addressLocality: BUSINESS.address.city,
      addressRegion: BUSINESS.address.state,
      postalCode: BUSINESS.address.zip,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    areaServed: {
      '@type': 'State',
      name: 'Washington',
      description: 'Western Washington — King, Pierce, Snohomish, Thurston, Kitsap, and Lewis Counties (92+ communities)',
    },
    priceRange: '$',
    image: BUSINESS.url + '/images/hero-lawn.webp',
    dateModified: BUSINESS.siteLastUpdated,
    founder: {
      '@type': 'Person',
      name: BUSINESS.founder,
      jobTitle: 'Owner & Founder',
      description: 'US Army veteran (2011-2014), mole control specialist since 2017',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: BUSINESS.ratingValue,
      reviewCount: BUSINESS.reviewCount,
      bestRating: '5',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
    department: BRANCHES.map((b) => ({
      '@type': 'LocalBusiness',
      '@id': `${BUSINESS.url}/#branch-${b.slug}`,
      name: `Got Moles - ${b.city}`,
      telephone: BUSINESS.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: b.streetAddress,
        addressLocality: b.city,
        addressRegion: 'WA',
        postalCode: b.zip,
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: b.geo.lat,
        longitude: b.geo.lng,
      },
    })),
    // Reference shared constants — single source of truth across
    // organizationSchema (sitewide) and localBusinessSchema (homepage).
    knowsAbout: BRAND_KNOWS_ABOUT,
    hasOfferCatalog: BRAND_OFFER_CATALOG,
  }
}

// ─── Service Pages ─────────────────────────────────────────────

export function serviceSchema(service: {
  name: string
  description: string
  url: string
  price?: string
  pricePer?: string
  billingDuration?: string
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    url: BUSINESS.url + service.url,
    provider: { '@id': `${BUSINESS.url}/#business` },
    areaServed: 'Western Washington',
  }
  if (service.price) {
    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'USD',
    }
    if (service.pricePer) {
      offer.priceSpecification = {
        '@type': 'UnitPriceSpecification',
        price: service.price,
        priceCurrency: 'USD',
        unitText: service.pricePer,
        ...(service.billingDuration && { billingDuration: service.billingDuration }),
      }
    }
    schema.offers = offer
  }
  return schema
}

// ─── FAQ ───────────────────────────────────────────────────────

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

// ─── HowTo ─────────────────────────────────────────────────────

export function howToSchema(steps: { name: string; text: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: "How Got Moles' Mole Control Process Works",
    description: 'From first call to mole-free yard in 4 steps.',
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  }
}

// ─── About / Person ────────────────────────────────────────────

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Spencer Hill',
    jobTitle: 'Owner & Founder',
    worksFor: { '@id': `${BUSINESS.url}/#business` },
    description:
      'US Army veteran and founder of Got Moles, Washington\'s mole control specialist since 2017.',
    birthPlace: 'Buckley, Washington',
    homeLocation: {
      '@type': 'Place',
      name: 'Enumclaw, Washington',
    },
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Military Service',
      description: 'US Army Infantryman, 2011-2014',
    },
    knowsAbout: [
      'mole control',
      'mole trapping',
      "Townsend's mole",
      'Pacific Northwest mole species',
    ],
  }
}

// ─── About / Team Members (Person entities) ───────────────────
//
// Returns @graph of all 5 team members as Person entities, linked
// to the Got Moles Organization via worksFor/@id. E-E-A-T signal for
// AI engines: named, credentialed humans behind the service.

export function teamSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${BUSINESS.url}/about/#spencer-hill`,
        name: 'Spencer Hill',
        jobTitle: 'Owner & Founder',
        worksFor: { '@id': `${BUSINESS.url}/#business` },
        image: `${BUSINESS.url}/images/team-spencer.webp`,
        description:
          'US Army veteran (Infantryman, 2011-2014) and founder of Got Moles. Born and raised in Buckley, Washington. Lives in Enumclaw. Founded Got Moles in 2017 after years of trapping moles for neighbors across Pierce County.',
        birthPlace: 'Buckley, Washington',
        homeLocation: { '@type': 'Place', name: 'Enumclaw, Washington' },
        knowsAbout: ['mole control', 'mole trapping', "Townsend's mole", 'Pacific Northwest mole species'],
      },
      {
        '@type': 'Person',
        '@id': `${BUSINESS.url}/about/#cory-ventura`,
        name: 'Cory Ventura',
        jobTitle: 'General Manager',
        worksFor: { '@id': `${BUSINESS.url}/#business` },
        image: `${BUSINESS.url}/images/team-cory.webp`,
        description:
          "Grew up in Buckley. Spencer and Cory have been friends since high school. Cory runs service visits across King and Pierce County and is the technician behind a lot of Got Moles' highest-reviewed jobs.",
        homeLocation: { '@type': 'Place', name: 'Buckley, Washington' },
        knowsAbout: ['mole control', 'mole trapping', 'service delivery'],
      },
      {
        '@type': 'Person',
        '@id': `${BUSINESS.url}/about/#tavis-alexander`,
        name: 'Tavis Alexander',
        jobTitle: 'Technician',
        worksFor: { '@id': `${BUSINESS.url}/#business` },
        image: `${BUSINESS.url}/images/team-tavis.webp`,
        description:
          "Tavis came to Got Moles from the food industry, where customer service isn't optional. He brings the same standard to every service visit — homeowners feel heard and looked after.",
        knowsAbout: ['mole control', 'customer service'],
      },
      {
        '@type': 'Person',
        '@id': `${BUSINESS.url}/about/#brayden-rich`,
        name: 'Brayden Rich',
        jobTitle: 'Technician',
        worksFor: { '@id': `${BUSINESS.url}/#business` },
        image: `${BUSINESS.url}/images/team-brayden.webp`,
        description:
          "Born and raised in Buckley, Washington — the same community where Got Moles started. Brayden approaches every property with real curiosity and gets the job right.",
        birthPlace: 'Buckley, Washington',
        knowsAbout: ['mole control', 'mole trapping'],
      },
      {
        '@type': 'Person',
        '@id': `${BUSINESS.url}/about/#lukas-lavergne`,
        name: 'Lukas LaVergne',
        jobTitle: 'Technician',
        worksFor: { '@id': `${BUSINESS.url}/#business` },
        image: `${BUSINESS.url}/images/team-lukas.webp`,
        description:
          "Lukas worked summers commercial fishing to put himself through college. He brings the same grit to the field at Got Moles — the job gets done, properly.",
        knowsAbout: ['mole control'],
      },
    ],
  }
}

// ─── Reviews / AggregateRating ─────────────────────────────────

export function reviewsSchema(
  reviews: { name: string; text: string; date: string; rating?: number; city?: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${BUSINESS.url}/#business`,
    name: BUSINESS.name,
    url: BUSINESS.url,
    telephone: BUSINESS.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.address.streetAddress,
      addressLocality: BUSINESS.address.city,
      addressRegion: BUSINESS.address.state,
      postalCode: BUSINESS.address.zip,
      addressCountry: 'US',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: BUSINESS.ratingValue,
      reviewCount: BUSINESS.reviewCount,
      bestRating: '5',
    },
    review: reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: { '@type': 'Rating', ratingValue: String(r.rating ?? 5) },
      reviewBody: r.text,
      datePublished: r.date,
      ...(r.city && {
        locationCreated: {
          '@type': 'Place',
          name: r.city,
          address: { '@type': 'PostalAddress', addressRegion: 'WA', addressCountry: 'US' },
        },
      }),
    })),
  }
}

// ─── Blog Article ──────────────────────────────────────────────

export type CitedSource = {
  name: string
  url: string
  author?: string
  publisher?: string
  identifier?: string
  datePublished?: string
  type?: 'ScholarlyArticle' | 'Report' | 'CreativeWork' | 'WebPage'
}

export function articleSchema(post: {
  title: string
  slug: string
  date: string
  dateModified?: string
  excerpt: string
  image?: string
  url?: string
  keywords?: string[]
  cluster?: string
  wordCount?: number
  citations?: CitedSource[]
}) {
  const canonical = post.url || (BUSINESS.url + '/blog/' + post.slug + '/')
  const imageUrl = post.image ? BUSINESS.url + post.image : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    author: {
      '@type': 'Person',
      '@id': `${BUSINESS.url}/about/#spencer-hill`,
      name: 'Spencer Hill',
      url: BUSINESS.url + '/about/',
    },
    publisher: { '@id': `${BUSINESS.url}/#organization` },
    datePublished: post.date,
    dateModified: post.dateModified || post.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    url: canonical,
    description: post.excerpt,
    inLanguage: 'en-US',
    ...(post.cluster && { articleSection: post.cluster }),
    ...(post.keywords && post.keywords.length > 0 && {
      keywords: post.keywords.join(', '),
    }),
    ...(post.wordCount && { wordCount: post.wordCount }),
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
        width: 1200,
        height: 669,
        caption: post.title,
      },
    }),
    // Speakable schema — marks the H1, BLUF/definition block, and FAQ answers
    // as the sections voice assistants and AI engines should cite.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '#blog-definition-block', '.blog-faq-answer'],
    },
    ...(post.citations && post.citations.length > 0 && {
      citation: post.citations.map((c) => ({
        '@type': c.type || 'ScholarlyArticle',
        name: c.name,
        url: c.url,
        ...(c.author && { author: { '@type': 'Person', name: c.author } }),
        ...(c.publisher && { publisher: { '@type': 'Organization', name: c.publisher } }),
        ...(c.identifier && { identifier: c.identifier }),
        ...(c.datePublished && { datePublished: c.datePublished }),
      })),
    }),
  }
}

// ─── DefinedTerm (for posts whose BLUF defines a term) ────────────

export function definedTermSchema(opts: {
  term: string
  definition: string
  url: string
  inDefinedTermSet?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: opts.term,
    description: opts.definition,
    url: opts.url.startsWith('http') ? opts.url : BUSINESS.url + opts.url,
    inDefinedTermSet: opts.inDefinedTermSet || `${BUSINESS.url}/blog/#glossary`,
  }
}

// ─── City Pages ────────────────────────────────────────────────

export function cityLocalBusinessSchema(city: {
  name: string
  slug: string
  lat: string
  lng: string
}) {
  // If this city has a real branch office, use its NAP. Otherwise fall back to HQ.
  const branch = BRANCHES.find((b) => b.slug === city.slug)
  const streetAddress = branch?.streetAddress ?? BUSINESS.address.streetAddress
  const addressLocality = branch?.city ?? BUSINESS.address.city
  const postalCode = branch?.zip ?? BUSINESS.address.zip
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Got Moles - ${city.name} Mole Control`,
    description: `Professional mole control in ${city.name}, Washington. Veteran-owned, chemical-free. Nearly 5,000 clients served since 2017.`,
    url: `${BUSINESS.url}/mole-control-${city.slug}/`,
    telephone: BUSINESS.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress,
      addressLocality,
      addressRegion: BUSINESS.address.state,
      postalCode,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: city.lat,
      longitude: city.lng,
    },
    areaServed: {
      '@type': 'City',
      name: city.name,
      containedInPlace: { '@type': 'State', name: 'Washington' },
    },
    parentOrganization: { '@id': `${BUSINESS.url}/#business` },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: BUSINESS.ratingValue,
      reviewCount: BUSINESS.reviewCount,
      bestRating: '5',
    },
    dateModified: BUSINESS.siteLastUpdated,
    employee: {
      '@type': 'Person',
      '@id': `${BUSINESS.url}/about/#spencer-hill`,
      name: 'Spencer Hill',
      jobTitle: 'Owner & Founder',
    },
  }
}

// ─── CollectionPage (hub pages with multiple linked items) ────────

/**
 * CollectionPage schema for hub/landing pages that enumerate sub-content.
 * Optionally include speakable selector for AI/voice extraction.
 */
export function collectionPageSchema(opts: {
  name: string
  url: string
  description: string
  speakableSelector?: string
  about?: string
  authorName?: string
  authorJobTitle?: string
  authorDescription?: string
}) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    url: opts.url,
    description: opts.description,
    isPartOf: { '@id': `${BUSINESS.url}/#website` },
    publisher: {
      '@type': 'LocalBusiness',
      name: BUSINESS.name,
      telephone: BUSINESS.phoneDisplay,
      areaServed: { '@type': 'State', name: 'Washington' },
    },
  }
  if (opts.about) {
    data.about = { '@type': 'Thing', name: opts.about }
  }
  if (opts.authorName) {
    data.author = {
      '@type': 'Person',
      name: opts.authorName,
      jobTitle: opts.authorJobTitle,
      description: opts.authorDescription,
    }
  }
  if (opts.speakableSelector) {
    data.speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: [opts.speakableSelector],
    }
  }
  return data
}

// ─── ItemList (machine-readable inventory of items in a collection) ──

/**
 * ItemList schema enumerating items in a collection. Each item gets a
 * position, URL, and name. Use on hub/index pages to give crawlers and
 * AI a structured manifest of the collection contents.
 */
export function itemListSchema(items: { url: string; name: string }[], opts?: {
  orderDescending?: boolean
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListOrder: opts?.orderDescending
      ? 'https://schema.org/ItemListOrderDescending'
      : 'https://schema.org/ItemListOrderAscending',
    numberOfItems: items.length,
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: item.url,
      name: item.name,
    })),
  }
}

// ─── Helper: render script tag ─────────────────────────────────

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const safe = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
