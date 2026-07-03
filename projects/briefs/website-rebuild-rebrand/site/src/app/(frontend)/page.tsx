import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, localBusinessSchema, breadcrumbSchema } from '@/lib/schema'

const SLUG = '/'
const FALLBACK = {
  title: 'Got Moles | Mole Control Specialists — Western Washington',
  description:
    "Western Washington's mole-exclusive specialist. Chemical-free, proven results. Veteran-owned. Nearly 5,000 clients served. Call (253) 750-0211.",
  canonicalPath: '/',
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

export default async function HomePage() {
  const page = await getCmsPageContent(SLUG)

  if (!page) {
    notFound()
  }

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={breadcrumbSchema([])} />
      <RenderBlocks blocks={(page.layout as unknown[]) || []} />
    </>
  )
}
