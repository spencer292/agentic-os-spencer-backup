import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'

export const metadata: Metadata = {
  // Title intentionally omits "| Got Moles" — the root layout template appends it once.
  title: 'Western Washington Mole Trappers — $150 to Start',
  description:
    "Western Washington's mole-exclusive trappers. Not a general pest company. $150 to start, $450 max, pay only if we catch. Veteran-owned, chemical-free, nearly 5,000 yards since 2017.",
  robots: 'noindex, nofollow',
  alternates: { canonical: 'https://got-moles.com/lp/mole-trapper/' },
}

export default function MoleTrapperLP() {
  return (
    <LandingPage
      slug="mole-trapper"
      breadcrumbName="Mole Trapper"
      headline="Western Washington Mole Trappers"
      subtext="Not a general pest company — Got Moles is Western Washington's mole-exclusive trapper. Veteran-owned, chemical-free, nearly 5,000 yards since 2017. $150 to start, $450 max, and you only pay the balance if we catch."
      heroImage="hero-lp-before-1"
      whyUsHeading="A Mole Trapper, Not a Pest Control Company"
      guaranteeHeading="Pay Only If We Catch"
      guaranteeBody="It's simple: you only pay the balance if we actually catch moles. $150 to start, $450 maximum. If we don't catch any during the 4-5 week program, you owe nothing beyond the setup. That's a payment promise — not a sales pitch."
      faqs={[
        {
          question: 'What makes a mole trapper different from a pest control company?',
          answer:
            "Pest control companies chase every bug and rodent under the sun — moles are an afterthought. We do one thing: moles. We read the active runs and work them every week until your yard is clear.",
        },
        {
          question: 'How much does a mole trapper cost?',
          answer:
            "$150 to start. If we catch moles during the 4-5 week program, the total is $450. If we don't catch any, you owe nothing beyond the $150 — $450 is the most you'll ever pay.",
        },
        {
          question: 'Is it safe for my pets and kids?',
          answer:
            'Completely. No poisons and no chemicals — nothing that touches the grass your family and pets use. Our methods are professional and placed below the surface in the active runs.',
        },
        {
          question: 'How fast can you come out?',
          answer:
            'Spencer calls you back the same business day, and first visits are usually within a few days of booking.',
        },
        {
          question: 'Will the moles come back?',
          answer:
            'Once we clear the active moles, your yard is clear. Over time new moles can move in from neighboring property — which is why many homeowners choose our $100/month Total Mole Control Program for year-round protection.',
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
      finalHeading="Get a Mole Trapper on Your Yard"
      finalSubtext="$150 to start. $450 max. Balance only if we catch."
    />
  )
}
