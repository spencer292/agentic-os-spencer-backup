import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema, collectionPageSchema, itemListSchema } from '@/lib/schema'
import { servicesHubBlocks, servicesHubMeta } from '@/lib/pages-data'

const SLUG = 'services'
const FALLBACK = servicesHubMeta

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

export default async function ServicesPage() {
  const page = await getCmsPageContent(SLUG)
  const blocks = page
    ? ((page.layout as unknown[]) || [])
    : servicesHubBlocks

  if (!page && servicesHubBlocks.length === 0) notFound()

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: 'Services', url: '/services/' },
      ])} />
      <JsonLd data={collectionPageSchema({
        name: 'Got Moles Mole Control Services',
        url: 'https://got-moles.com/services/',
        description: "Compare Got Moles' mole control services: Total Mole Control Program, One-Time Mole Removal, and Commercial Mole Control. Chemical-free specialist serving Western Washington since 2017.",
        about: 'Mole control services',
      })} />
      <JsonLd data={itemListSchema([
        { url: 'https://got-moles.com/services/total-mole-control-program/', name: 'Total Mole Control Program' },
        { url: 'https://got-moles.com/services/one-time-mole-removal/', name: 'One-Time Mole Removal' },
        { url: 'https://got-moles.com/services/commercial-mole-control/', name: 'Commercial Mole Control' },
      ])} />
      <RenderBlocks blocks={blocks} />
    </>
  )
}
