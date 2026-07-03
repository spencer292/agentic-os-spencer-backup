import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema, serviceSchema } from '@/lib/schema'

const SLUG = 'one-time-mole-removal'
const FALLBACK = {
  title: 'One-Time Mole Removal | $450 Flat',
  description:
    "Professional mole removal for $450 flat rate (under 1 acre). Includes inspection, weekly visits, and guarantee — if we don't catch a mole, you only pay the $150 setup fee.",
  canonicalPath: '/services/one-time-mole-removal/',
}

// FAQPage schema is emitted by the FAQ block in pages-data.ts (oneTimeBlocks).

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

export default async function OneTimeRemovalPage() {
  const page = await getCmsPageContent(SLUG)

  if (!page) {
    notFound()
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Services', url: '/services/' }, { name: 'One-Time Mole Removal', url: '/services/one-time-mole-removal/' }])} />
      <JsonLd data={serviceSchema({ name: 'One-Time Mole Removal', description: 'Professional mole eradication for residential properties under 1 acre. $450 flat rate including inspection, weekly visits, and guarantee.', url: '/services/one-time-mole-removal/', price: '450.00' })} />
      <RenderBlocks blocks={(page.layout as unknown[]) || []} />
    </>
  )
}
