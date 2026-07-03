import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, personSchema, breadcrumbSchema, teamSchema, faqSchema } from '@/lib/schema'

const SLUG = 'about'
const FALLBACK = {
  title: 'About | Founded by Spencer Hill, US Army Veteran',
  description:
    'Spencer Hill founded Got Moles in 2017 after years of trapping moles for neighbors in Buckley, WA. US Army veteran, nearly 5,000 clients served. Meet the team.',
  canonicalPath: '/about/',
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

export default async function AboutPage() {
  const page = await getCmsPageContent(SLUG)

  if (!page) {
    notFound()
  }

  const schema = page.schema as
    | { type?: string; customJsonLd?: string }
    | undefined

  const autoSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schema?.type || 'AboutPage',
    name: page.title,
    url: 'https://got-moles.com/about/',
    isPartOf: { '@id': 'https://got-moles.com/#website' },
    // Link AboutPage -> sitewide Organization node so AI engines can resolve
    // the entity graph cleanly. Sitewide Organization is emitted in layout.
    mainEntity: { '@id': 'https://got-moles.com/#organization' },
    // Last revised. Bump when /about/ block content changes; powers AI
    // freshness signals + answers "when was this updated" queries.
    dateModified: '2026-05-09',
    // Speakable: tells voice assistants + AI Overviews which DOM
    // elements to read aloud and cite. Targets the H1 (page topic)
    // and main H2s (section headings). Pixelmojo 2026-05-08 high-
    // impact action #1.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'main h2'],
    },
  }

  let customSchema: Record<string, unknown> | null = null
  if (schema?.customJsonLd) {
    try {
      customSchema = JSON.parse(schema.customJsonLd)
    } catch {
      // Malformed JSON-LD — skip silently
    }
  }

  const mergedSchema = customSchema ? { ...autoSchema, ...customSchema } : autoSchema

  // Aggregate FAQ items from every faq block on the page into ONE FAQPage
  // schema (per feedback_one_faqpage_per_page.md aggregation rule + Google
  // guideline). Mirrors the /faq/ route pattern. Strip markdown links from
  // answers — FAQPage Answer.text must be plain prose.
  const stripMd = (s: string) => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
  const layout = (page.layout as unknown[]) || []
  const allFaqItems: Array<{ question: string; answer: string }> = []
  for (const block of layout) {
    if (!block || typeof block !== 'object') continue
    const b = block as Record<string, unknown>
    if (b.blockType !== 'faq') continue
    const items = b.items
    if (!Array.isArray(items)) continue
    for (const it of items) {
      if (!it || typeof it !== 'object') continue
      const item = it as Record<string, unknown>
      const question = typeof item.question === 'string' ? item.question : ''
      const answer = typeof item.answer === 'string' ? item.answer : ''
      if (question && answer) allFaqItems.push({ question, answer: stripMd(answer) })
    }
  }

  return (
    <>
      <JsonLd data={mergedSchema} />
      <JsonLd data={breadcrumbSchema([{ name: 'About', url: '/about/' }])} />
      <JsonLd data={personSchema()} />
      <JsonLd data={teamSchema()} />
      {allFaqItems.length > 0 && <JsonLd data={faqSchema(allFaqItems)} />}
      <RenderBlocks blocks={layout} />
    </>
  )
}
