import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cityData, getAllCitySlugs, getNearestCities, getCityPrimaryMoneyPage } from '@/lib/city-data'
import { MONEY_PAGE_URL } from '@/lib/money-pages'
import {
  JsonLd,
  cityLocalBusinessSchema,
  faqSchema,
  breadcrumbSchema,
} from '@/lib/schema'
import { Section } from '@/components/Section'
import { ServiceCards } from '@/components/ServiceCards'
import { CTABlock } from '@/components/CTABlock'
import { PageHero } from '@/components/PageHero'
import { getBlogHeroImage } from '@/lib/blog-images'
import { BlogPostContent } from '@/components/BlogPostContent'
import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/payload'

interface PageProps {
  params: Promise<{ citySlug: string }>
}

const PREFIX = 'mole-control-'

// A legitimate legacy-root blog slug is lowercase alphanumeric words joined by
// single hyphens (e.g. "do-moles-bite"). Anything else — file-extension probes
// (.conf/.yml/.env), path-traversal, scanner junk — is rejected BEFORE it can
// reach the database. On 2026-06-08 a Go-http-client scanner blasted ~1,600
// junk paths in 4s; each fell through to a live Supabase query, exhausted the
// 200-connection limit (EMAXCONN), and returned 500. This guard short-circuits
// that class of traffic to a cheap 404. See projects/str-security-audit.
const VALID_BLOG_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Allow any slug that passes the prefix check or matches a legacy-root blog —
// don't restrict to static params only
export const dynamicParams = true

export async function generateStaticParams() {
  const citySlugsList = getAllCitySlugs().map((slug) => ({ citySlug: `${PREFIX}${slug}` }))
  // Also pre-render legacy-root migrated blogs (urlPattern === 'legacy-root')
  try {
    const legacyBlogs = await getAllBlogPosts({ limit: 500, urlPattern: 'legacy-root' })
    const legacyBlogSlugs = legacyBlogs.docs
      .filter((post) => post.slug)
      .map((post) => ({ citySlug: post.slug as string }))
    return [...citySlugsList, ...legacyBlogSlugs]
  } catch {
    return citySlugsList
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug } = await params

  // Branch 1: city page
  if (citySlug.startsWith(PREFIX)) {
    const slug = citySlug.replace(PREFIX, '')
    const local = cityData[slug]
    if (!local) return {}

    const cityName = local.name
    return {
      title: `${cityName} Mole Control | Proven Results`,
      description: `Professional mole control in ${cityName}, WA. Veteran-owned, chemical-free. Nearly 5,000 clients served since 2017. Call (253) 750-0211.`,
      alternates: { canonical: `https://got-moles.com/${citySlug}/` },
      openGraph: {
        title: `${cityName} Mole Control | Got Moles`,
        description: `Professional mole control in ${cityName}, WA. Chemical-free, proven results.`,
        url: `https://got-moles.com/${citySlug}/`,
        images: [
          { url: '/images/og-default.webp', alt: `Mole control services in ${cityName}, Washington` },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${cityName} Mole Control | Got Moles`,
        description: `Professional mole control in ${cityName}, WA.`,
        images: ['/images/og-default.webp'],
      },
    }
  }

  // Branch 2: legacy-root migrated blog post
  if (!VALID_BLOG_SLUG.test(citySlug)) return {}
  try {
    const post = await getBlogPostBySlug(citySlug, { urlPattern: 'legacy-root' })
    if (!post) return {}

    const seo = post.seo as { metaTitle?: string; metaDescription?: string } | undefined
    const title = post.title as string
    const excerpt = post.excerpt as string | undefined
    const featured = post.featuredImage as { url?: string; alt?: string } | undefined
    const ogImage = featured?.url || getBlogHeroImage(citySlug) || '/images/og-default.webp'

    return {
      title: seo?.metaTitle || `${title} | Got Moles Blog`,
      description: seo?.metaDescription || excerpt,
      alternates: { canonical: `https://got-moles.com/${citySlug}/` },
      openGraph: {
        title: seo?.metaTitle || title,
        description: seo?.metaDescription || excerpt,
        type: 'article',
        url: `https://got-moles.com/${citySlug}/`,
        images: [{ url: ogImage, alt: featured?.alt || title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: seo?.metaTitle || title,
        description: seo?.metaDescription || excerpt,
        images: [ogImage],
      },
    }
  } catch {
    return {}
  }
}

export default async function CityPage({ params }: PageProps) {
  const { citySlug } = await params

  // Branch 2: slug doesn't match mole-control-* prefix → try legacy-root migrated blog
  if (!citySlug.startsWith(PREFIX)) {
    // Reject scanner/junk slugs before any DB call (see VALID_BLOG_SLUG above)
    if (!VALID_BLOG_SLUG.test(citySlug)) notFound()
    let post
    try {
      post = await getBlogPostBySlug(citySlug, { urlPattern: 'legacy-root' })
    } catch (err) {
      // A DB outage / connection-exhaustion must degrade to 404, never a 500.
      // notFound() is called OUTSIDE the try so its control-flow throw is not swallowed.
      console.error('[citySlug] legacy-root blog lookup failed:', err)
      post = null
    }
    if (!post) notFound()
    return (
      <BlogPostContent
        post={post as unknown as Record<string, unknown>}
        urlPattern="legacy-root"
      />
    )
  }

  const slug = citySlug.replace(PREFIX, '')
  const local = cityData[slug]
  if (!local) notFound()

  const cityName = local.name
  const county = local.county.toLowerCase().replace(' county', '')
  const introText = local.intro
  const communityDescription = local.communityDescription
  const whyMolesThrive = local.whyMolesThrive
  const localDetails = local.localDetails
  const localTip = local.localTip
  const faqs = local.faqs
  const lat = local.lat
  const lng = local.lng
  const headline = `Mole Control in ${cityName}`

  // County-level hero images
  const countyImages: Record<string, string> = {
    king: '/images/hero-king-county.webp',
    pierce: '/images/hero-pierce-county.webp',
    snohomish: '/images/hero-snohomish-county.webp',
    thurston: '/images/hero-thurston-county.webp',
    kitsap: '/images/hero-kitsap-county.webp',
  }
  const heroImage = countyImages[county] || '/images/hero-king-county.webp'

  const citySchemaInput = {
    name: cityName,
    slug: slug,
    lat,
    lng,
  }

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: `${cityName} Mole Control`, url: `/mole-control-${slug}/` },
        ])}
      />
      <JsonLd data={cityLocalBusinessSchema(citySchemaInput)} />
      {faqs.length > 0 && <JsonLd data={faqSchema(faqs)} />}

      {/* Hero */}
      <PageHero
        heading={headline}
        subheading={introText}
        image={heroImage}
        imageAlt={`Professional mole control in ${cityName}, Washington`}
        height="70vh"
        cta={{ text: 'Call (253) 750-0211', url: 'tel:+12537500211' }}
        trustStrip={['219+ Five-Star Google Reviews', 'Chemical-Free', 'Proven Results']}
      />

      {/* GEO Definition — AI-extractable city summary (visually subtle, content already in hero subheading) */}
      {introText && (
        <section className="py-6 lg:py-8" style={{ background: 'linear-gradient(to bottom, #184241 65%, #153635 100%)' }}>
          <div className="max-w-[65ch] mx-auto px-4 md:px-6 lg:px-8">
            <p id="geo-definition" className="font-body text-body-lg text-cream-200/80 leading-relaxed text-center">
              Got Moles provides professional mole control in {cityName}, Washington. Chemical-free methods. Nearly 5,000 clients served since 2017. Call (253) 750-0211 for a free quote.
            </p>
          </div>
          {/* Speakable schema for AI / voice search citation — mirrors service-areas + GEODefinitionBlock.
              Co-located with #geo-definition so it only emits where the target element renders. */}
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
        </section>
      )}

      {/* Community pride — callout box */}
      {communityDescription && (
        <Section background="grass">
          <div className="max-w-[65ch] mx-auto">
            <div className="bg-white/5 rounded-2xl px-6 py-5 md:px-8 md:py-6">
              <p className="font-body text-body-lg text-cream-200/90 leading-relaxed italic">
                {communityDescription}
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* Why moles thrive here */}
      {whyMolesThrive && (
        <Section background="grass-alt">
          <div className="max-w-[65ch] mx-auto">
            <h2 className="font-heading text-h2 uppercase tracking-tight mb-8" style={{ textWrap: 'balance' } as { textWrap: string }}>
              Why Moles Thrive in {cityName}
            </h2>
            <p className="font-body text-body-lg text-cream-200/90 leading-relaxed">
              {whyMolesThrive}
            </p>
          </div>
        </Section>
      )}

      {/* Local neighborhood details */}
      {localDetails && (
        <Section background="grass">
          <div className="max-w-[65ch] mx-auto">
            <h2 className="font-heading text-h2 uppercase tracking-tight mb-8" style={{ textWrap: 'balance' } as { textWrap: string }}>
              Moles in {cityName} Neighborhoods
            </h2>
            <p className="font-body text-body-lg text-cream-200/90 leading-relaxed">
              {localDetails}
            </p>
          </div>
        </Section>
      )}

      {/* Services grid — emphasise the primary money page (R4) */}
      <Section background="grass-alt">
        <ServiceCards
          heading={`How We Help ${cityName} Homeowners`}
          highlightUrl={MONEY_PAGE_URL[getCityPrimaryMoneyPage(slug)]}
        />
      </Section>

      {/* Local tip — gold callout */}
      {localTip && (
        <Section background="grass">
          <div className="max-w-[65ch] mx-auto">
            <div className="bg-white/5 rounded-2xl px-6 py-5 lg:px-8 lg:py-6">
              <p className="font-heading font-bold text-h4 text-cream-200 mb-2">
                Local Tip
              </p>
              <p className="font-body text-body-lg text-cream-200/90 leading-relaxed">
                {localTip}
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* How it works */}
      <Section background="grass-alt">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-8" style={{ textWrap: 'balance' } as { textWrap: string }}>
            How It Works
          </h2>
          <div className="space-y-6">
            {[
              { title: 'Call', desc: 'Phone quote, no obligation' },
              { title: 'Book', desc: 'Pay $150 setup. We schedule your first visit.' },
              { title: 'Trap', desc: 'Tech inspects and sets traps on the first visit' },
              { title: 'Report', desc: 'Weekly checks. Written report every visit.' },
            ].map((step) => (
              <div key={step.title} className="flex gap-4 items-start">
                <span className="w-3 h-3 rounded-full bg-gold-500 shrink-0 mt-2" />
                <div>
                  <h3 className="font-body font-semibold text-cream-200 mb-1">{step.title}</h3>
                  <p className="font-body text-body-lg text-cream-200/80">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/how-it-works"
              className="font-body text-sm text-gold-500 hover:text-gold-400 no-underline"
            >
              See the full process &rarr;
            </Link>
          </div>
        </div>
      </Section>

      {/* FAQs — uses native <details> for progressive disclosure (content in SSR HTML for GEO) */}
      {faqs.length > 0 && (
        <Section background="grass">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-heading text-h2 uppercase tracking-tight mb-8" style={{ textWrap: 'balance' } as { textWrap: string }}>
              {cityName} Mole Control FAQ
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group border-b border-cream-200/10 pb-3"
                >
                  <summary className="cursor-pointer font-body font-semibold text-body-lg text-cream-200 py-3 flex justify-between items-center">
                    {faq.question}
                    <svg className="w-5 h-5 text-gold-500 shrink-0 ml-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <p className="font-body text-body-lg text-cream-200/80 leading-relaxed mt-2 pr-8">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Nearby service areas — 6 nearest cities computed from lat/lng.
          SearchPilot A/B test: +7% organic traffic from linking to 6 nearest
          neighbouring location pages (vs 2). Anchor text uses exact-match
          "Mole Control in {City}" pattern for Zyppy 5x-traffic anchor lift. */}
      <Section background="grass-alt">
        <div className="max-w-3xl mx-auto">
          <p className="font-body text-sm text-cream-200/65 text-center mb-4">Mole control in nearby communities:</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {getNearestCities(slug, 6).map((nearby) => (
              <Link
                key={nearby.slug}
                href={`/mole-control-${nearby.slug}/`}
                className="font-body font-semibold text-gold-500 hover:text-gold-400 no-underline"
              >
                Mole Control in {nearby.name}
              </Link>
            ))}
            <Link
              href="/service-areas"
              className="font-body font-semibold text-cream-200 hover:text-gold-500 no-underline"
            >
              All Service Areas
            </Link>
          </div>
        </div>
      </Section>

      <CTABlock
        heading={`Ready for Mole-Free Living in ${cityName}?`}
        body="Call (253) 750-0211 or fill out the form below."
        showForm={true}
        subtext="Free quote. No obligation."
      />
    </>
  )
}
