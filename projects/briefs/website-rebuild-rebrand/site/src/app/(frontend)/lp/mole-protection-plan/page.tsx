import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'

export const metadata: Metadata = {
  // Title intentionally omits "| Got Moles" — the root layout template appends it once.
  title: 'Year-Round Mole Protection Plan — $100/month',
  description:
    'Year-round mole protection for $100/month: ongoing monitoring, priority response, and a report after every visit. 12-month plan, unlimited visits. Hundreds of Western Washington yards enrolled.',
  robots: 'noindex, nofollow',
  alternates: { canonical: 'https://got-moles.com/lp/mole-protection-plan/' },
}

export default function ProtectionPlanLP() {
  return (
    <LandingPage
      slug="mole-protection-plan"
      breadcrumbName="Mole Protection Plan"
      headline="Year-Round Mole Protection Plan"
      subtext="$100/month for year-round mole protection — ongoing monitoring, priority response, and a report after every visit. A 12-month plan with unlimited visits. Hundreds of Western Washington homeowners are already enrolled."
      heroImage="hero-lp-before-2"
      stepsHeading="How the Protection Plan Works"
      steps={[
        {
          number: '01',
          title: 'Call and Enroll',
          summary: 'Tell us about your property and enroll over the phone.',
          description:
            'Phone (253) 750-0211 or fill out the form. We talk through your property and get you set up on the plan — no quote visit, no pressure.',
        },
        {
          number: '02',
          title: '$100/month, 12-Month Plan',
          summary: 'One flat monthly fee. Unlimited visits. No other charges.',
          description:
            "You're on a 12-month plan at $100/month. That covers unlimited visits — there are no per-visit fees and no surprise charges on top.",
        },
        {
          number: '03',
          title: 'Ongoing Monitoring and Priority Response',
          summary: 'We keep your yard covered and respond fast to new activity.',
          description:
            "Our technicians keep your property monitored through the seasons. See fresh activity between visits? You're a priority — we come back at no extra charge.",
        },
        {
          number: '04',
          title: 'A Report After Every Visit',
          summary: 'Full accountability — you always know what we did and what we found.',
          description:
            "After each visit you get a report on what we checked, what we found, and what we did. You don't have to be home, and you never have to wonder.",
        },
      ]}
      whyUsHeading="Why Homeowners Choose Year-Round Protection"
      whyUsBody={
        "One-time removal clears the moles in your yard today. But over time, new moles can move in from a neighbor's property — and the cycle starts again.\n\nThe Total Mole Control Program ends that cycle. We keep your yard monitored and respond to new activity the moment it shows up, so the damage never gets a chance to take hold.\n\nWe do one thing: moles. Nearly 5,000 Western Washington yards since 2017. With the plan, you simply never have to think about them again."
      }
      guaranteeHeading="Covered Between Visits"
      guaranteeBody="New mole activity between visits? We come back at no extra charge. That's the whole point of the plan — your yard stays protected year-round, and you never have to worry about moles again."
      faqs={[
        {
          question: "What's included in the $100/month plan?",
          answer:
            'Ongoing monitoring through the seasons, priority response to new activity, unlimited visits, and a report after every visit — all for one flat $100/month on a 12-month plan.',
        },
        {
          question: 'How is this different from one-time mole removal?',
          answer:
            'One-time removal clears the moles in your yard now. The plan keeps your yard protected going forward, so new moles moving in from neighboring property never get a chance to take hold.',
        },
        {
          question: 'Is there a contract?',
          answer: "It's a 12-month plan at $100/month. Unlimited visits are included for that flat monthly fee.",
        },
        {
          question: 'What if moles come back between visits?',
          answer: 'We come back at no extra charge. Responding to new activity between scheduled visits is exactly what the plan is for.',
        },
        {
          question: 'Is it safe for my pets and kids?',
          answer:
            'Completely. No poisons and no chemicals — nothing that touches the grass your family and pets use. Our methods are professional and placed below the surface in the active runs.',
        },
        {
          question: 'What areas do you cover?',
          answer:
            "We've protected nearly 5,000 properties across Western Washington since 2017 — King, Pierce, and the surrounding counties.",
        },
      ]}
      finalHeading="Put Your Yard on Year-Round Protection"
      finalBody="Call (253) 750-0211 or fill out the form below. Spencer calls you back same business day."
      finalSubtext="$100/month · 12-month plan · Unlimited visits"
    />
  )
}
