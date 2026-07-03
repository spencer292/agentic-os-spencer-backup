import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'

export const metadata: Metadata = {
  // Title intentionally omits "| Got Moles" — the root layout template appends it once.
  title: 'Professional Mole Removal in Western Washington — $150 to Start',
  description:
    'Professional mole removal across Western Washington. $150 to start, $450 max, and you only pay the balance if we catch. Chemical-free, safe for pets and kids. Nearly 5,000 yards since 2017.',
  robots: 'noindex, nofollow',
  alternates: { canonical: 'https://got-moles.com/lp/mole-removal/' },
}

export default function MoleRemovalLP() {
  return (
    <LandingPage
      slug="mole-removal"
      breadcrumbName="Mole Removal"
      headline="Professional Mole Removal in Western Washington"
      subtext="Moles tearing up your lawn? We're Western Washington's mole specialists — and you only pay the balance if we actually catch them. $150 to start. $450 max. Chemical-free, safe for pets and kids."
      heroImage="hero-lp-before-3"
      guaranteeHeading="Pay Only If We Catch"
      guaranteeBody="It's simple: you only pay the balance if we actually catch moles. $150 to start, $450 maximum. If we don't catch any during the 4-5 week program, you owe nothing beyond the setup. That's a payment promise — not a sales pitch."
      faqs={[
        {
          question: 'How much does mole removal cost?',
          answer:
            "$150 to start. If we catch moles during the 4-5 week program, the total is $450. If we don't catch any, you owe nothing beyond the $150 — $450 is the most you'll ever pay.",
        },
        {
          question: 'Is it safe for my pets and kids?',
          answer:
            'Completely. No poisons and no chemicals — nothing that touches the grass your family and pets use. Our methods are professional and placed below the surface in the active runs.',
        },
        {
          question: 'Will the moles come back?',
          answer:
            'Once we clear the active moles, your yard is clear. Over time new moles can move in from neighboring property — which is why many homeowners choose our $100/month Total Mole Control Program for year-round protection.',
        },
        {
          question: 'How fast can you come out?',
          answer:
            'Spencer calls you back the same business day, and first visits are usually within a few days of booking.',
        },
        {
          question: 'Do moles bite or carry disease?',
          answer:
            "Moles aren't aggressive and bites are extremely rare. The real problem is the damage their tunneling does to your lawn, beds, and irrigation lines.",
        },
        {
          question: 'What areas do you cover?',
          answer:
            "We've protected nearly 5,000 properties across Western Washington since 2017 — King, Pierce, and the surrounding counties.",
        },
      ]}
      permanenceBlock={{
        heading: 'Never Worry About Moles Again',
        body: 'Our Total Mole Control Program is $100/month with a 12-month contract. Unlimited visits. No other charges. Hundreds of yards already on year-round protection.',
        buttonText: 'CALL ABOUT YEAR-ROUND PROTECTION',
        subtext: '$100/month · 12-month contract · Unlimited visits',
      }}
      finalHeading="Ready to Get Rid of Your Moles?"
      finalSubtext="$150 to start. $450 max. Balance only if we catch."
    />
  )
}
