import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema, howToSchema } from '@/lib/schema'

const SLUG = 'how-it-works'
const FALLBACK = {
  title: 'How Mole Control Works | 4-Step Process',
  description:
    "From first call to mole-free yard: how Got Moles' 4-step residential process works. Phone quote, booking, first-visit assessment and trap-setting, then weekly checks with a written report after every visit.",
  canonicalPath: '/how-it-works/',
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)
}

export default async function HowItWorksPage() {
  const page = await getCmsPageContent(SLUG)

  if (!page) {
    notFound()
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'How It Works', url: '/how-it-works/' }])} />
      <JsonLd data={howToSchema([
        { name: 'Call Got Moles', text: 'Contact us at (253) 750-0211 or fill out our online form. Describe the mole activity on your property. We will respond within one business day and give you a clear phone quote.' },
        { name: 'Book and Pay $150 Setup', text: 'When you are ready, we book your first visit and take the $150 setup fee. That is all you owe upfront. There is no separate pre-booking inspection visit.' },
        { name: 'First Visit: Inspection and Trapping', text: 'On your booked date, our technician arrives, walks your property to identify active tunnels and entry points, and sets professional equipment on the most active runs — all in the same visit. Chemical-free methods, safe for pets and children.' },
        { name: 'Weekly Checks and Results Report', text: 'We return weekly for 4-5 weeks to check traps, adjust placement, and document progress. After every visit you receive a written report showing what was found and removed. Balance only if we catch moles; $450 maximum. TMCP clients get ongoing year-round protection after the initial program.' },
      ])} />
      <RenderBlocks blocks={(page.layout as unknown[]) || []} />
    </>
  )
}
