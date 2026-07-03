import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema, serviceSchema } from '@/lib/schema'

const SLUG = 'total-mole-control-program'
const FALLBACK = {
  title: 'Total Mole Control Program | $100/Month',
  description:
    "Never deal with moles again. Got Moles' Total Mole Control Program protects your yard year-round for $100/month. Regular visits, reports after every check, guaranteed response.",
  canonicalPath: '/services/total-mole-control-program/',
}

// FAQPage schema is emitted by the FAQ block in pages-data.ts (tmcpBlocks).
// Keep that the single source of truth so the schema matches what visitors
// actually see rendered on the page.

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

export default async function TMCPPage() {
  const page = await getCmsPageContent(SLUG)

  if (!page) {
    notFound()
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Services', url: '/services/' }, { name: 'Total Mole Control Program', url: '/services/total-mole-control-program/' }])} />
      <JsonLd data={serviceSchema({ name: 'Total Mole Control Program', description: 'Year-round mole protection for $100/month. Regular visits, active monitoring, immediate response to mole activity, and a report after every visit.', url: '/services/total-mole-control-program/', price: '100.00', pricePer: 'month', billingDuration: 'P12M' })} />
      <RenderBlocks blocks={(page.layout as unknown[]) || []} />
    </>
  )
}
