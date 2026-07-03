import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema } from '@/lib/schema'

const SLUG = 'contact'
const FALLBACK = {
  title: 'Contact | Get a Free Quote',
  description:
    'Call us, text us, or fill out the form. Got Moles responds within one business day. Honest, no-obligation mole control quotes for Western Washington homeowners.',
  canonicalPath: '/contact/',
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

export default async function ContactPage() {
  const page = await getCmsPageContent(SLUG)

  if (!page) {
    notFound()
  }

  const schema = page.schema as
    | { type?: string; customJsonLd?: string }
    | undefined

  const autoSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schema?.type || 'ContactPage',
    name: page.title,
    url: 'https://got-moles.com/contact/',
    isPartOf: { '@id': 'https://got-moles.com/#website' },
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

  return (
    <>
      <JsonLd data={mergedSchema} />
      <JsonLd data={breadcrumbSchema([{ name: 'Contact', url: '/contact/' }])} />
      <RenderBlocks blocks={(page.layout as unknown[]) || []} />
    </>
  )
}
