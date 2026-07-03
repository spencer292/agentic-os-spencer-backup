import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema, serviceSchema } from '@/lib/schema'

const SLUG = 'commercial-mole-control'
const FALLBACK = {
  title: 'Commercial Mole Control | Property Managers & HOAs',
  description:
    'Professional commercial mole control across Western Washington. Annual contracts, regular reporting, and reliable scheduling for property managers, HOAs, schools, and sports clubs.',
  canonicalPath: '/services/commercial-mole-control/',
}

// FAQPage schema is emitted by the FAQ block in pages-data.ts (commercialBlocks).

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

export default async function CommercialPage() {
  const page = await getCmsPageContent(SLUG)

  if (!page) {
    notFound()
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Services', url: '/services/' }, { name: 'Commercial Mole Control', url: '/services/commercial-mole-control/' }])} />
      <JsonLd data={serviceSchema({ name: 'Commercial Mole Control', description: 'Annual mole control contracts for commercial properties, property managers, HOAs, sports facilities, and schools across Western Washington.', url: '/services/commercial-mole-control/' })} />
      <RenderBlocks blocks={(page.layout as unknown[]) || []} />
    </>
  )
}
