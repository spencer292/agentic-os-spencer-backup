import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema } from '@/lib/schema'
import { LP_CITIES, buildLpBlocks } from '@/lib/lp-city-data'
import { LpQuickForm } from '@/components/LpQuickForm'

// Only known LP cities render; anything else 404s (LPs are paid-traffic only).
// This dynamic template now owns ALL /lp/{city}/ pages — the former per-city
// static files were removed; URLs and output are unchanged.
export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(LP_CITIES).map((city) => ({ city }))
}

type PageProps = { params: Promise<{ city: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params
  const CITY = LP_CITIES[city]
  if (!CITY) return {}
  return {
    title: `Mole Removal in ${CITY.displayName} — $150 to Start`,
    description: `Mole removal in ${CITY.displayName} starting at $150. $450 max if we catch. $100/month year-round. Spencer's 15+ years experience. ${CITY.metaTail ?? 'Nearly 5,000 yards served.'}`,
    robots: 'noindex, nofollow',
    alternates: { canonical: `https://got-moles.com/lp/${CITY.slug}/` },
  }
}

export default async function CityLP({ params }: PageProps) {
  const { city } = await params
  const CITY = LP_CITIES[city]
  if (!CITY) notFound()

  const blocks = buildLpBlocks(CITY)
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: `Mole Removal ${CITY.displayName}`, url: `/lp/${CITY.slug}/` },
        ])}
      />
      <RenderBlocks blocks={blocks.slice(0, 1)} />
      <LpQuickForm city={CITY} />
      <RenderBlocks blocks={blocks.slice(1)} />
    </>
  )
}
