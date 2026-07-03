import type { Metadata } from 'next'
import Link from 'next/link'
import { Section } from '@/components/Section'
import { CTABlock } from '@/components/CTABlock'
import { JsonLd, breadcrumbSchema, faqSchema } from '@/lib/schema'
import { cityData } from '@/lib/city-data'
import { PageHero } from '@/components/PageHero'

export const metadata: Metadata = {
  title: 'Service Areas | 90+ Western Washington Communities',
  description:
    'Got Moles provides chemical-free mole control across 90+ communities in King, Pierce, Snohomish, Thurston, and Kitsap Counties. 219+ five-star reviews, nearly 5,000 clients since 2017.',
  alternates: { canonical: 'https://got-moles.com/service-areas/' },
  openGraph: {
    title: 'Service Areas | Got Moles',
    description:
      'Professional mole control across 5 counties and 90+ Western Washington communities.',
    url: 'https://got-moles.com/service-areas/',
    images: [{ url: '/images/hero-service-areas.webp', alt: 'Mole control service areas across Western Washington' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Service Areas | Got Moles',
    description:
      'Professional mole control across 5 counties and 90+ Western Washington communities.',
    images: ['/images/hero-service-areas.webp'],
  },
}

// County display order and labels
const countyOrder = [
  'King County',
  'Pierce County',
  'Snohomish County',
  'Thurston County',
  'Kitsap County',
]

// Priority cities show first within each county
const prioritySlugs = new Set([
  'seattle', 'bellevue', 'kirkland', 'sammamish', 'redmond', 'renton',
  'tacoma', 'puyallup', 'lakewood',
  'everett', 'marysville',
  'olympia', 'lacey',
  'bremerton',
])

// Short intro paragraph per county — what defines the region for mole control
const countyIntros: Record<string, string> = {
  'King County':
    "King County covers the Seattle metro and the Eastside — from the Lake Washington shoreline to the Cascade foothills at North Bend. The Alderwood glacial till that dominates the region, combined with mature residential landscaping and 37+ inches of annual rainfall, creates consistent mole pressure across every neighborhood we serve here.",
  'Pierce County':
    "Pierce County spans from Tacoma's urban core through the Puyallup River valley to the Mount Rainier foothills. The valley floor sits on deep alluvial soil that Townsend's moles thrive in. The plateau neighborhoods above — from Bonney Lake to Graham — share the same glacial till as the King County Eastside.",
  'Snohomish County':
    "Snohomish County includes Everett, Mill Creek, and the bedroom communities north of Seattle. Alderwood glacial till dominates the uplands, while the North Creek and Snohomish River corridors keep the water table elevated across established residential neighborhoods.",
  'Thurston County':
    "Thurston County, anchored by Olympia and Lacey, covers the South Sound. Glacial outwash prairies and a wetter marine climate mean year-round mole activity, especially in established residential neighborhoods near wetlands and park corridors.",
  'Kitsap County':
    "Kitsap County — Bremerton, Silverdale, Bainbridge Island, Port Orchard, Poulsbo — receives 55+ inches of annual rainfall and has a maritime climate that keeps soil moisture high every month. Mole pressure here rivals any county on the Sound.",
}

// Service-area-specific FAQs (schema-ready)
const serviceAreasFaqs = [
  {
    question: 'Do you serve communities outside the 5 counties listed?',
    answer:
      "We occasionally travel outside King, Pierce, Snohomish, Thurston, and Kitsap Counties for larger commercial jobs, but residential work is concentrated within these 5 counties. If you don't see your city listed, call us — we cover 90+ communities, and some towns we service aren't displayed in the main grid.",
  },
  {
    question: 'How far will you travel for a residential property?',
    answer:
      "Our primary service radius reaches roughly 50 miles from our base of operations, covering the full Puget Sound region from Bainbridge Island to the Cascade foothills and from Everett to Olympia. Farther-out properties are considered case-by-case, especially for the Total Mole Control Program where ongoing visits are required.",
  },
  {
    question: 'Is the price the same regardless of which county I live in?',
    answer:
      "Pricing is based on the scope of mole activity on your property, not your location within our service area. A Seattle lot and a Tacoma lot with the same level of infestation will cost the same. We give you a clear quote before any work begins.",
  },
  {
    question: 'Do you service rural properties and larger acreage?',
    answer:
      "Yes. We regularly work on acreage, small farms, and rural parcels across all five counties — from horse properties in Roy to lakefront estates on Medina to rural lots around Ravensdale and Mill Creek. On larger properties we focus treatment on the high-value zones (lawns, paddocks, landscaped areas) rather than trying to clear undeveloped ground.",
  },
  {
    question: 'Which areas in Western Washington have the heaviest mole activity?',
    answer:
      "River valleys and lakefront communities see the most consistent pressure because of the high water table — the Puyallup Valley, the Green River corridor, Lake Tapps, and the Lake Washington shoreline all rank high. Kitsap County also sees heavy activity thanks to 55+ inches of annual rainfall. Cities backing onto forested parkland — Mill Creek, Ravensdale, Sammamish — face the most persistent reinvasion after treatment.",
  },
  {
    question: 'Do you service the islands (Bainbridge, Vashon)?',
    answer:
      "We serve Bainbridge Island and coordinate service around the ferry schedule. Vashon is case-by-case, typically for larger residential or commercial jobs where a single ferry trip is worth the travel. Call us for island properties and we'll confirm logistics.",
  },
  {
    question: "What's your response time for your first visit in outlying areas?",
    answer:
      "We quote and book over the phone — there is no separate pre-booking inspection. After booking, your first visit is usually within a couple of business days for properties in our core service corridor. Outlying areas (Mount Rainier foothills, Kitsap Peninsula, rural south Pierce) may run 3-5 business days depending on the route. We give you a specific date when we book.",
  },
  {
    question: 'Is my city not on the list? Can you still help?',
    answer:
      "Yes — call us. We service 90+ communities across the five counties, and not every neighborhood or CDP is listed in the main grid. If you're in Western Washington, there's a good chance we cover your address. Free quote, no obligation either way.",
  },
]

// Testimonial sampling — diverse across the service area
const testimonials = [
  {
    quote:
      "Got moles is not only the best exterminator in the business but they also have excellent customer service. I have been using them for several years and they never fail to exceed expectations.",
    name: 'Stan Adams',
    city: 'Seattle, WA',
  },
  {
    quote:
      "I have been working with Spencer now for over 2 years. He and his crew have the touch! I use him at home and at our church in Covington and he absolutely cleans house of the moles. Just amazing.",
    name: 'Clark Potter',
    city: 'Tacoma, WA',
  },
  {
    quote:
      "Spencer is really good at what he does. He runs his business very professionally and his expertise in this field shows.",
    name: 'Judith Challoner',
    city: 'Enumclaw, WA',
  },
]

export default function ServiceAreasPage() {
  // Build county groups from city-data.ts (source of truth)
  const countyMap = new Map<string, { name: string; slug: string }[]>()

  for (const [slug, city] of Object.entries(cityData)) {
    const county = city.county
    if (!countyMap.has(county)) {
      countyMap.set(county, [])
    }
    countyMap.get(county)!.push({ name: city.name, slug })
  }

  // Sort counties by defined order
  const sortedCounties = [...countyMap.entries()].sort(([a], [b]) => {
    const ai = countyOrder.indexOf(a)
    const bi = countyOrder.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  // Sort cities: priority first, then alphabetical
  for (const [, cities] of sortedCounties) {
    cities.sort((a, b) => {
      const aPriority = prioritySlugs.has(a.slug) ? 0 : 1
      const bPriority = prioritySlugs.has(b.slug) ? 0 : 1
      if (aPriority !== bPriority) return aPriority - bPriority
      return a.name.localeCompare(b.name)
    })
  }

  const totalCities = Object.keys(cityData).length
  const totalCounties = sortedCounties.length

  // ItemList schema — all cities with URLs
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Got Moles Service Areas',
    description: `${totalCities}+ communities across ${totalCounties} Western Washington counties served by Got Moles.`,
    numberOfItems: totalCities,
    itemListElement: sortedCounties.flatMap(([, cities]) =>
      cities.map((city, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `Mole Control in ${city.name}`,
        url: `https://got-moles.com/mole-control-${city.slug}/`,
      })),
    ),
  }

  // CollectionPage schema — the page itself as a collection of city service pages
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Service Areas — Got Moles',
    description: `Professional mole control across ${totalCounties} counties and ${totalCities}+ communities in Western Washington.`,
    url: 'https://got-moles.com/service-areas/',
    about: {
      '@type': 'Service',
      name: 'Mole Control',
      provider: {
        '@type': 'LocalBusiness',
        name: 'Got Moles',
      },
      areaServed: sortedCounties.map(([countyName]) => ({
        '@type': 'AdministrativeArea',
        name: `${countyName}, Washington`,
      })),
    },
  }

  return (
    <>
      {/* Schema — breadcrumb + FAQ + ItemList + CollectionPage */}
      <JsonLd data={breadcrumbSchema([{ name: 'Service Areas', url: '/service-areas/' }])} />
      <JsonLd data={faqSchema(serviceAreasFaqs)} />
      <JsonLd data={itemListSchema} />
      <JsonLd data={collectionPageSchema} />

      {/* Hero */}
      <PageHero
        heading="Mole Control Across Western Washington"
        subheading={`Got Moles serves ${totalCities}+ communities across ${totalCounties} counties in Western Washington. Find your city below.`}
        image="/images/hero-service-areas.webp"
        imageAlt="Western Washington landscape — rolling forested hills, river valleys, and Mt. Rainier in the distance"
        height="85vh"
        cta={{ text: 'CALL (253) 750-0211', url: 'tel:+12537500211' }}
        trustStrip={['219+ Five-Star Google Reviews', 'Chemical-Free', 'Proven Results']}
      />

      {/* Intro + GEO Definition (Speakable schema target) */}
      <Section background="grass">
        <div className="max-w-3xl mx-auto">
          <h2
            className="font-heading text-h2 uppercase tracking-tight text-center mb-6"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            One Problem. Five Counties. {totalCities}+ Communities.
          </h2>
          <p className="font-body text-body-lg text-cream-200/90 leading-relaxed mb-6">
            Moles don&apos;t care about city limits. They care about soil moisture, earthworm density, and undisturbed ground to tunnel through — conditions Western Washington produces in abundance. Since 2017, Got Moles has cleared Townsend&apos;s moles from nearly 5,000 properties across the Puget Sound region, from Seattle bungalows to Pierce County hobby farms to Bainbridge Island estates.
          </p>
          <p
            id="geo-definition"
            className="font-body text-body-lg text-cream-200/90 leading-relaxed"
          >
            Got Moles provides professional, chemical-free mole control services across {totalCounties} counties in Western Washington: King, Pierce, Snohomish, Thurston, and Kitsap. The company serves {totalCities}+ communities including Seattle, Tacoma, Bellevue, Puyallup, Everett, Olympia, and Bainbridge Island, with a single focus on residential and commercial mole removal using professional traps. No chemicals, no poisons — 219+ five-star Google reviews across 3 Google Business Profile locations.
          </p>
        </div>

        {/* Speakable schema for AI / voice search citation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPageElement',
              cssSelector: '#geo-definition',
              speakable: {
                '@type': 'SpeakableSpecification',
                cssSelector: ['#geo-definition'],
              },
            }),
          }}
        />
      </Section>

      {/* Stats band */}
      <Section background="grass-alt">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 lg:gap-8 text-center">
            {[
              { number: `${totalCounties}`, label: 'Counties Served' },
              { number: `${totalCities}+`, label: 'Communities' },
              { number: '5,000', label: 'Clients Since 2017' },
              { number: '219+', label: 'Five-Star Reviews' },
              { number: '100%', label: 'Chemical-Free' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-heading font-bold text-4xl lg:text-5xl text-gold-500 mb-2">
                  {stat.number}
                </div>
                <div className="font-body text-sm text-cream-200/80 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* County sections — each with intro paragraph + city grid */}
      {sortedCounties.map(([countyName, cities], i) => (
        <Section key={countyName} background={i % 2 === 0 ? 'grass' : 'grass-alt'}>
          <h2
            className="font-heading text-h2 uppercase tracking-tight text-center mb-2"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {countyName}
          </h2>
          <p className="text-center font-body text-sm text-cream-200/65 mb-6">
            {cities.length} communities served
          </p>

          {countyIntros[countyName] && (
            <p className="max-w-3xl mx-auto text-center font-body text-body-lg text-cream-200/85 leading-relaxed mb-10">
              {countyIntros[countyName]}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/mole-control-${city.slug}`}
                className="block py-3 px-4 text-center font-body font-semibold text-sm no-underline transition-colors text-cream-200 hover:text-gold-500 bg-white/5 rounded-2xl hover:bg-white/10"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </Section>
      ))}

      {/* Testimonial sampling */}
      <Section background="grass-alt">
        <div className="max-w-5xl mx-auto">
          <h2
            className="font-heading text-h2 uppercase tracking-tight text-center mb-10"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Trusted Across Western Washington
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white/5 rounded-2xl p-6 lg:p-8">
                <div className="flex gap-1 mb-4" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg key={i} className="w-4 h-4 text-gold-500 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="font-body text-body-lg text-cream-200/90 leading-relaxed mb-4 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="font-body font-semibold text-cream-200">{t.name}</p>
                <p className="font-body text-sm text-cream-200/65">{t.city}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/reviews/"
              className="font-body font-semibold text-gold-500 hover:text-gold-400 no-underline"
            >
              See All 219+ Reviews →
            </Link>
          </div>
        </div>
      </Section>

      {/* Service-area FAQs */}
      <Section background="grass">
        <div className="max-w-3xl mx-auto">
          <h2
            className="font-heading text-h2 uppercase tracking-tight text-center mb-10"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Service Area Questions
          </h2>
          <div className="space-y-4">
            {serviceAreasFaqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-b border-cream-200/10 pb-3"
              >
                <summary className="cursor-pointer font-body font-semibold text-body-lg text-cream-200 py-3 flex justify-between items-center">
                  {faq.question}
                  <svg className="w-5 h-5 text-gold-500 shrink-0 ml-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="font-body text-body-lg text-cream-200/80 leading-relaxed mt-2 pr-8">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      <CTABlock
        heading="Don't See Your City?"
        body="We likely still serve your area. Call us and we'll confirm coverage for your address."
        subtext="Free quote. No obligation."
        showForm={false}
      />
    </>
  )
}
