import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'

export const metadata: Metadata = {
  title: 'Test Page — Roy',
  robots: 'noindex, nofollow',
}

export default async function TestRoyPage() {
  const page = await getCmsPageContent('about')

  if (!page) {
    notFound()
  }

  const layout = (page.layout as unknown[]) || []

  return <RenderBlocks blocks={layout} />
}
