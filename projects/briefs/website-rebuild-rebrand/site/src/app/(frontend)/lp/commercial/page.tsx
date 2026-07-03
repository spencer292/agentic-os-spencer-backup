import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'

export const metadata: Metadata = {
  // Title intentionally omits "| Got Moles" — the root layout template appends it once.
  title: 'Commercial Mole Control — Annual Contracts & Reporting',
  description:
    'Commercial mole control for property managers, HOAs, schools, sports facilities, and commercial grounds across Western Washington. Annual contracts, professional reporting after every visit. Specialist, not a general pest company.',
  robots: 'noindex, nofollow',
  alternates: { canonical: 'https://got-moles.com/lp/commercial/' },
}

export default function CommercialLP() {
  return (
    <LandingPage
      slug="commercial"
      breadcrumbName="Commercial Mole Control"
      headline="Commercial Mole Control"
      subtext="Mole control for property managers, HOAs, schools, sports facilities, and commercial grounds across Western Washington. Specialist mole control — not a general pest company — with professional reporting after every visit."
      heroImage="hero-lp-before-4"
      isItMolesBody={
        "Volcano-shaped mounds of fresh soil, spongy raised ridges underfoot, brown patches where roots have been cut, and tunneling that keeps spreading across the grounds — that's moles.\n\nOn commercial property the stakes are higher: trip hazards on walkways and fields, damaged irrigation, and grounds that reflect on the whole site. Moles don't stop on their own, and the longer it runs, the more turf there is to repair.\n\nThat's all we deal with. Moles. Nothing else."
      }
      stepsHeading="How Commercial Service Works"
      steps={[
        {
          number: '01',
          title: 'Call for a Property Assessment',
          summary: 'Tell us about the site. We scope the grounds and quote.',
          description:
            'Phone (253) 750-0211 or fill out the form. Tell us about the property — size, problem areas, access. We scope the grounds and put together a clear quote for ongoing service.',
        },
        {
          number: '02',
          title: 'Annual Contract, Predictable Coverage',
          summary: 'A service agreement built around your property and budget.',
          description:
            'We set up an annual service agreement scaled to the site — so coverage is predictable, budgeted, and there are no surprise call-out charges.',
        },
        {
          number: '03',
          title: 'Scheduled Service Visits',
          summary: 'Our technicians work the active runs on a set schedule.',
          description:
            'Our techs service the grounds on a regular schedule, reading the active runs and working them until the property is clear — and keeping it that way through the seasons.',
        },
        {
          number: '04',
          title: 'Professional Reporting After Every Visit',
          summary: 'Full accountability — documented every time we are on site.',
          description:
            'After each visit you get a report on what we checked, what we found, and what we did. Full accountability for facilities teams, boards, and owners.',
        },
      ]}
      whyUsHeading="A Mole Specialist, Not a General Pest Company"
      whyUsBody={
        'General pest companies chase every bug and rodent under the sun — moles are an afterthought, and on a large site that shows.\n\nWe do one thing: moles. Nearly 5,000 Western Washington properties since 2017, residential and commercial. We read the active runs and work them on a schedule until the grounds are clear.\n\nFor property managers, HOAs, schools, and sports facilities, that focus is the difference between a recurring headache and a property that stays clear.'
      }
      guaranteeHeading="Full Accountability"
      guaranteeBody="Professional reporting after every visit, and full accountability for every property we service. You always know what we did, what we found, and the condition of your grounds."
      faqs={[
        {
          question: 'Do you work with property managers and HOAs?',
          answer:
            'Yes. We set up annual service agreements with property managers, HOAs, and facilities teams across Western Washington, scaled to the size of the property.',
        },
        {
          question: 'What kinds of properties do you service?',
          answer:
            'HOAs and common areas, schools, sports fields and facilities, parks, and commercial grounds — anywhere mole damage affects safety, irrigation, or appearance.',
        },
        {
          question: 'Is it safe and chemical-free?',
          answer:
            'Yes. No poisons and no chemicals — important for grounds used by the public, students, and athletes. Our methods are professional and placed below the surface in the active runs.',
        },
        {
          question: 'Do you provide reporting?',
          answer:
            'A professional report after every visit — what we checked, what we found, and what we did — so facilities teams, boards, and owners have full accountability.',
        },
        {
          question: 'Are you veteran-owned and local?',
          answer:
            "Yes — Got Moles is Spencer Hill and his team, veteran-owned and Washington-based, focused on moles since 2017.",
        },
        {
          question: 'What areas do you cover?',
          answer:
            'Western Washington — King, Pierce, and the surrounding counties. Nearly 5,000 properties served since 2017.',
        },
      ]}
      finalHeading="Get a Commercial Quote"
      finalBody="Call (253) 750-0211 or fill out the form below. We'll scope your property and send a quote."
      finalSubtext="Annual contracts · professional reporting · Western Washington"
    />
  )
}
