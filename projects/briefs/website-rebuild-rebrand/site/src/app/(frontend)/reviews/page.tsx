import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { getPayloadClient } from '@/lib/payload'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema, reviewsSchema } from '@/lib/schema'
import { ReviewsHub } from '@/components/reviews/ReviewsHub'
import type { Testimonial } from '@/components/reviews/ReviewsHub'
import { Section } from '@/components/Section'

const SLUG = 'reviews'
const FALLBACK = {
  title: 'Reviews | 219+ Five-Star — Western Washington',
  description:
    "219+ five-star Google reviews from homeowners across Seattle, Tacoma, and Enumclaw. See why 5,000+ Western Washington homeowners trust Got Moles for mole control.",
  canonicalPath: '/reviews/',
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

async function getTestimonials(): Promise<Testimonial[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'testimonials',
    where: { status: { equals: 'published' } },
    limit: 300,
    sort: 'sortOrder',
  })

  return result.docs.map((doc) => ({
    id: String(doc.id),
    name: doc.name as string,
    city: (doc.city as string) || '',
    quote: (doc.quote as string) || '',
    fullQuote: (doc.fullQuote as string) || '',
    rating: (doc.rating as number) || 5,
    serviceType: (doc.serviceType as Testimonial['serviceType']) || null,
    concern: (doc.concern as Testimonial['concern']) || null,
    gbpLocation: (doc.gbpLocation as Testimonial['gbpLocation']) || null,
    dateGiven: (doc.dateGiven as string) || null,
    featured: Boolean(doc.featured),
    sortOrder: (doc.sortOrder as number) || 999,
  }))
}

export default async function ReviewsPage() {
  const [page, testimonials] = await Promise.all([
    getCmsPageContent(SLUG),
    getTestimonials(),
  ])

  if (!page) {
    notFound()
  }

  const blocks = (page.layout as unknown[]) || []

  // Split blocks: hero + GEO + stats come first, FAQ + CTA come after dynamic content
  const heroBlock = blocks.find((b: any) => b.blockType === 'hero')
  const geoBlock = blocks.find((b: any) => b.blockType === 'geoDefinition')
  const statsBlock = blocks.find((b: any) => b.blockType === 'stats')
  const faqBlock = blocks.find((b: any) => b.blockType === 'faq')
  const ctaBlock = blocks.find((b: any) => b.blockType === 'cta')

  // Build full review schema with all testimonials (not just 3)
  const reviewSchemaData = testimonials.map((t) => ({
    name: t.name,
    text: t.fullQuote,
    date: t.dateGiven || '2024-01-01',
    rating: t.rating,
    city: t.city,
  }))

  return (
    <>
      {/* Schema: LocalBusiness + AggregateRating + all Reviews */}
      <JsonLd data={reviewsSchema(reviewSchemaData)} />
      <JsonLd data={breadcrumbSchema([{ name: 'Reviews', url: '/reviews/' }])} />

      {/* Hero (CMS block) */}
      {heroBlock && <RenderBlocks blocks={[heroBlock]} />}

      {/* GEO Definition + Stats (CMS blocks, merged per CRO audit) */}
      {geoBlock && <RenderBlocks blocks={[geoBlock]} />}
      {statsBlock && <RenderBlocks blocks={[statsBlock]} />}

      {/* Dynamic content: Featured Reviews + Filters + Review Grid */}
      <ReviewsHub testimonials={testimonials} />

      {/* Expert Attribution (server-rendered) */}
      <Section background="grass-alt">
        <div className="grid md:grid-cols-[250px_1fr] gap-8 lg:gap-12 items-center">
          <div className="mx-auto md:mx-0">
            <img
              src="/images/team-spencer.webp"
              alt="Spencer Hill, founder of Got Moles"
              className="w-48 h-48 lg:w-64 lg:h-64 rounded-full object-cover"
              loading="lazy"
              width={256}
              height={256}
            />
          </div>
          <div>
            <h2
              className="font-heading text-h2 uppercase tracking-tight mb-6"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              The Specialist Behind the Results
            </h2>
            <p className="font-body text-body-lg text-cream-200/85 leading-relaxed mb-4">
              Spencer Hill is a U.S. Army veteran with 15+ years of professional trapping experience. He started Got Moles in 2017 for one reason: homeowners kept getting failed by general pest companies that treated moles as an afterthought. He knew a specialist could do better.
            </p>
            <p className="font-body text-body-lg text-cream-200/85 leading-relaxed mb-6">
              Today the team is 5 strong, serving nearly 5,000 clients across Western Washington. Every technician trained in Spencer's methods. Every visit documented with a written report. The focus hasn't changed since day one: do one thing, do it better than anyone.
            </p>
            <a
              href="/about/"
              className="inline-flex items-center gap-1.5 font-body text-sm text-gold-500 hover:text-gold-400"
            >
              Read Spencer's full story
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" />
              </svg>
            </a>
          </div>
        </div>
      </Section>

      {/* Commercial Case Studies cross-link */}
      <Section background="grass">
        <div className="text-center max-w-2xl mx-auto">
          <h2
            className="font-heading text-h2 uppercase tracking-tight mb-4"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Commercial Mole Control
          </h2>
          <p className="font-body text-body-lg text-cream-200/85 leading-relaxed mb-6">
            Sports fields, public parks, airports, property management portfolios. See how we solve mole problems for commercial clients across Western Washington.
          </p>
          <a
            href="/reviews/commercial-case-studies/"
            className="inline-flex items-center gap-2 font-body font-semibold text-sm uppercase tracking-wide text-grass-800 bg-gold-500 hover:bg-gold-400 px-6 py-3 rounded-lg transition-colors"
          >
            View Commercial Case Studies
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" />
            </svg>
          </a>
        </div>
      </Section>

      {/* Services Our Customers Review */}
      <Section background="grass-alt">
        <div className="max-w-5xl mx-auto">
          <h2
            className="font-heading text-h2 uppercase tracking-tight mb-8 text-center"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Services Our Customers Review
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="/services/total-mole-control-program/"
              className="block rounded-lg p-6 bg-grass-800/40 hover:bg-grass-800/60 transition-colors"
            >
              <h3 className="font-heading text-h3 uppercase tracking-tight mb-2">Total Mole Control Program</h3>
              <p className="font-body text-body text-cream-200/85 leading-relaxed mb-3">
                Year-round protection at $100/month. Regular monitoring, immediate response to new activity, written report after every visit. About 500 homeowners enrolled.
              </p>
              <span className="inline-flex items-center gap-1 font-body text-sm font-semibold text-gold-500">
                See Year-Round Mole Protection
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" /></svg>
              </span>
            </a>
            <a
              href="/services/one-time-mole-removal/"
              className="block rounded-lg p-6 bg-grass-800/40 hover:bg-grass-800/60 transition-colors"
            >
              <h3 className="font-heading text-h3 uppercase tracking-tight mb-2">One-Time Mole Removal</h3>
              <p className="font-body text-body text-cream-200/85 leading-relaxed mb-3">
                $450 flat rate (residential under 1 acre). 4-5 weekly visits. Guaranteed — if we don&apos;t catch a mole, you only pay the $150 setup fee.
              </p>
              <span className="inline-flex items-center gap-1 font-body text-sm font-semibold text-gold-500">
                See One-Time Mole Removal
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" /></svg>
              </span>
            </a>
            <a
              href="/services/commercial-mole-control/"
              className="block rounded-lg p-6 bg-grass-800/40 hover:bg-grass-800/60 transition-colors"
            >
              <h3 className="font-heading text-h3 uppercase tracking-tight mb-2">Commercial Mole Control</h3>
              <p className="font-body text-body text-cream-200/85 leading-relaxed mb-3">
                Annual contracts for property managers, HOAs, sports facilities, schools, and landscaping contractors. Custom-quoted after site inspection.
              </p>
              <span className="inline-flex items-center gap-1 font-body text-sm font-semibold text-gold-500">
                See Commercial Mole Control
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" /></svg>
              </span>
            </a>
          </div>
        </div>
      </Section>

      {/* FAQ (CMS block with auto-generated FAQPage schema) */}
      {faqBlock && <RenderBlocks blocks={[faqBlock]} />}

      {/* CTA (CMS block, gradient) */}
      {ctaBlock && <RenderBlocks blocks={[ctaBlock]} />}
    </>
  )
}
