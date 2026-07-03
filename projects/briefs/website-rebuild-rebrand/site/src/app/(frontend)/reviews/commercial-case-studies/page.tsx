import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema, articleSchema, faqSchema } from '@/lib/schema'
import { commercialCaseStudiesBlocks, commercialCaseStudiesMeta } from '@/lib/pages-data'
import { Section } from '@/components/Section'

const SLUG = 'commercial-case-studies'
const FALLBACK = { ...commercialCaseStudiesMeta, canonicalPath: '/reviews/commercial-case-studies/' }

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

export default async function CommercialCaseStudiesPage() {
  const page = await getCmsPageContent(SLUG)

  // Use CMS blocks if page exists, otherwise fall back to pages-data
  const blocks = page
    ? ((page.layout as unknown[]) || [])
    : commercialCaseStudiesBlocks

  if (!page && commercialCaseStudiesBlocks.length === 0) {
    notFound()
  }

  // Split blocks: everything before FAQ, then Spencer sign-off, then FAQ + CTA
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faqBlock = blocks.find((b: any) => b.blockType === 'faq') as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctaBlock = blocks.find((b: any) => b.blockType === 'cta') as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preBlocks = blocks.filter((b: any) => b.blockType !== 'faq' && b.blockType !== 'cta')
  const faqItems = faqBlock?.items || []

  return (
    <>
      <JsonLd
        data={articleSchema({
          title: 'Commercial Mole Control Case Studies',
          slug: 'commercial-case-studies',
          date: '2026-04-16',
          excerpt: FALLBACK.description,
          image: '/images/case-study-airport.webp',
          url: 'https://got-moles.com/reviews/commercial-case-studies/',
        })}
      />
      {faqItems.length > 0 && <JsonLd data={faqSchema(faqItems)} />}
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Reviews', url: '/reviews/' },
          { name: 'Commercial Case Studies', url: '/reviews/commercial-case-studies/' },
        ])}
      />

      {/* Hero + GEO + Stats + 4 Case Studies + Summary */}
      <RenderBlocks blocks={preBlocks} />

      {/* Spencer Sign-Off (server-rendered) */}
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
              Spencer Handles Commercial Directly
            </h2>
            <p className="font-body text-body-lg text-cream-200/85 leading-relaxed mb-4">
              I handle every commercial inquiry personally. No sales team, no call center. You talk to me, I walk your property, and I write the proposal myself. That is how every contract on this page started.
            </p>
            <p className="font-body text-body-lg text-cream-200/85 leading-relaxed mb-6">
              We built our commercial program the same way we built the residential side. Show up, do the work, document everything. The only difference is scale. Call me directly at (253) 750-0211.
            </p>
            <a
              href="/about/"
              className="inline-flex items-center gap-1.5 font-body text-sm text-gold-500 hover:text-gold-400"
            >
              Read my full story
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" />
              </svg>
            </a>
          </div>
        </div>
      </Section>

      {/* FAQ + CTA */}
      {faqBlock && <RenderBlocks blocks={[faqBlock]} />}
      {ctaBlock && <RenderBlocks blocks={[ctaBlock]} />}
    </>
  )
}
