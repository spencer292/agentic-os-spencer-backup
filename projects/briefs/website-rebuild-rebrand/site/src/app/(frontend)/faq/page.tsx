import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema, faqSchema, webPageSpeakable } from '@/lib/schema'

const SLUG = 'faq'
const FALLBACK = {
  title: 'Mole Control FAQ | 49 Expert Answers | Got Moles',
  description:
    'Answers to the most common mole control questions in Washington. Cost, methods, safety, timing, commercial, and more. 49 expert answers from Got Moles.',
  canonicalPath: '/faq/',
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

export default async function FAQPage() {
  const page = await getCmsPageContent(SLUG)

  if (!page) {
    notFound()
  }

  const schema = page.schema as { customJsonLd?: string } | undefined

  let customSchema: Record<string, unknown> | null = null
  if (schema?.customJsonLd) {
    try {
      customSchema = JSON.parse(schema.customJsonLd)
    } catch {
      // Malformed JSON-LD — skip silently
    }
  }

  // Aggregate FAQ items from every faq block on the page into ONE
  // FAQPage schema. The page has 5 topic-grouped FAQ blocks (Methods,
  // Services, Moles, Concerns, Got Moles); per Google guidelines we want
  // a single FAQPage with all questions, not multiple. Each block has
  // generateSchema: false at the CMS layer so they don't double-emit.
  //
  // Strip markdown links `[text](url)` from answers — FAQPage Answer.text
  // must be plain prose per Google guidelines. Markdown links remain in the
  // visible HTML rendering (FAQBlock.tsx) for SEO/UX.
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
      {customSchema && <JsonLd data={customSchema} />}
      <JsonLd data={webPageSpeakable({ url: '/faq/', name: 'Mole Control FAQ' })} />
      <JsonLd data={breadcrumbSchema([{ name: 'FAQ', url: '/faq/' }])} />
      {allFaqItems.length > 0 && <JsonLd data={faqSchema(allFaqItems)} />}
      <RenderBlocks blocks={layout} />
    </>
  )
}
