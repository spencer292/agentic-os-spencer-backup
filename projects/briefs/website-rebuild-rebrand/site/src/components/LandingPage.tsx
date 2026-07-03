import { RenderBlocks } from './blocks/RenderBlocks'
import { LpQuickForm } from './LpQuickForm'
import { JsonLd, breadcrumbSchema } from '@/lib/schema'
import { pickLpReviews } from '@/lib/lp-city-data'

/**
 * Shared component for the geo-agnostic /lp/{service}/ landing pages
 * (mole-removal, mole-trapper, mole-protection-plan, commercial).
 *
 * Rebuilt 2026-06-02 to parity with the proven /lp/[city]/ template
 * (src/lib/lp-city-data.ts buildLpBlocks): before-photo hero → quick form →
 * How It Works → testimonials → why-us → guarantee → FAQ → final gradient CTA.
 * Block shapes mirror buildLpBlocks exactly so RenderBlocks renders them the
 * same way. Backgrounds alternate grass / grass-alt; gradient ONLY on the last
 * block. FAQ self-emits its FAQPage schema (generateSchema:true) — the route
 * emits breadcrumb only, exactly one FAQPage node per URL (city-LP pattern).
 *
 * Geo-neutral: "Western Washington", never a city. Posture A (no trap-mechanism
 * / kill language). Claim discipline: permanence ONLY on the protection plan.
 */

// ─── Lexical helpers (richText for imageText) — mirror lp-city-data.ts ──────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lxText(text: string): any {
  return { type: 'text', text, version: 1, format: 0, detail: 0, mode: 'normal', style: '' }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lxParagraph(text: string): any {
  return { type: 'paragraph', version: 1, children: [lxText(text)], direction: 'ltr', format: '', indent: 0, textFormat: 0, textStyle: '' }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lxParagraphs(...texts: string[]): any {
  return { root: { type: 'root', version: 1, children: texts.map(lxParagraph), direction: 'ltr', format: '', indent: 0 } }
}

export interface ServiceStep {
  number: string
  title: string
  summary: string
  description: string
}

export interface ServiceLpProps {
  /** Service slug — breadcrumb URL, form source tag. e.g. 'mole-removal'. */
  slug: string
  /** Short breadcrumb label. e.g. 'Mole Removal'. */
  breadcrumbName: string
  /** H1 — message-match for the money keywords. */
  headline: string
  /** Hero subheading — offer + reassurance. */
  subtext: string
  /** Before-photo hero — fallbackImage filename (hero-lp-before-1..5). */
  heroImage?: string
  /** "Not sure it's moles?" body. Defaults to the shared geo-neutral copy. */
  isItMolesBody?: string
  /** How-It-Works heading + steps. Defaults to the shared one-time flow. */
  stepsHeading?: string
  steps?: ServiceStep[]
  /** Why-us / specialist proof body. Defaults to the shared copy. */
  whyUsHeading?: string
  whyUsBody?: string
  /** Guarantee, scoped per claim discipline. */
  guaranteeHeading?: string
  guaranteeBody: string
  /** Service-level FAQs (5–6). Posture-A clean. */
  faqs: { question: string; answer: string }[]
  /**
   * Optional year-round / permanence block before the final CTA.
   * Permanence language ("never worry again") is ONLY valid here — the
   * protection-plan page. Omit on one-time pages.
   */
  permanenceBlock?: { heading: string; body: string; buttonText: string; subtext: string }
  /** Final CTA copy. */
  finalHeading: string
  finalBody?: string
  finalSubtext: string
}

const PHONE = 'tel:+12537500211'
const CALL_CTA = 'CALL (253) 750-0211'

const TRUST_STRIP = [
  '219+ 5-Star Reviews',
  'Nearly 5,000 Yards',
  'Since 2017',
  'Veteran-Owned',
  'Safe for Pets & Kids',
]

const DEFAULT_IS_IT_MOLES =
  "If you're seeing volcano-shaped mounds of fresh soil — often appearing overnight — it's moles. So are spongy, raised ridges that give underfoot, brown patches where roots have been cut, and damage that keeps spreading no matter what you try.\n\nMoles don't stop on their own. A single mole can work an entire yard, pushing up mound after mound and tunneling day after day. The longer it goes, the more lawn there is to repair.\n\nThat's all we deal with. Moles. Nothing else."

const DEFAULT_STEPS: ServiceStep[] = [
  {
    number: '01',
    title: 'Call or Request a Callback',
    summary: "Tell us what's happening. We quote your property over the phone.",
    description:
      "Phone (253) 750-0211 or fill out the form. Tell us where you're seeing damage and how long it's been going on. We'll ask a few questions, answer yours, and give you a clear price — all over the phone. No pressure, no upsell, no surprise quote visit.",
  },
  {
    number: '02',
    title: 'Book and Pay $150 to Start',
    summary: 'Confirm your service and pay the $150 setup. That is all you owe upfront.',
    description:
      "Once you're ready, we schedule your first visit and take the $150 setup fee. That fee is the only thing you pay upfront. The rest is only due if we catch moles.",
  },
  {
    number: '03',
    title: 'First Visit: We Inspect and Set Traps',
    summary: 'Tech walks your yard, identifies active runs, and sets professional equipment — all in one visit.',
    description:
      "Our technician arrives on your booked date and does the full property walk on arrival — active runs, fresh mounds, soil patterns, entry points. From that assessment we place professional equipment in the right spots. Inspection and trap-setting happen in the same visit. No separate pre-sales call-out, no charge for the assessment — it's part of your booked service.",
  },
  {
    number: '04',
    title: 'Weekly Checks for 4-5 Weeks. Balance Only If We Catch.',
    summary: '$300 balance after 4-5 weeks — only if moles caught. $450 total max.',
    description:
      "We return each week to check traps, document progress, adjust placement, and remove anything caught. You don't have to be home. If we catch moles, the $300 balance is due at the end. If we don't catch any, you owe nothing beyond the $150 setup. $450 is the maximum you'll ever pay.",
  },
]

const DEFAULT_WHY_US_HEADING = 'A Mole Specialist, Not a Pest Control Company'
const DEFAULT_WHY_US_BODY =
  "You've probably stomped the mounds flat. Maybe bought traps from the hardware store, or tried castor oil, repellents, or sonic spikes. Maybe even called a pest control company that said they'd handle it. And the moles came back.\n\nIt's not your fault. General pest control companies chase every bug and rodent under the sun — moles are an afterthought. DIY remedies might shift a mole for a day or two, but they don't clear an active tunnel network; the mole just routes around them.\n\nWe do one thing: moles. Nearly 5,000 Western Washington yards since 2017. We read the active runs and work them every week until your yard is clear. That's the difference between chasing mounds and being done with them."

export function LandingPage(props: ServiceLpProps) {
  const {
    slug,
    breadcrumbName,
    headline,
    subtext,
    heroImage = 'hero-lp-before-1',
    isItMolesBody = DEFAULT_IS_IT_MOLES,
    stepsHeading = 'How Our Mole Service Works',
    steps = DEFAULT_STEPS,
    whyUsHeading = DEFAULT_WHY_US_HEADING,
    whyUsBody = DEFAULT_WHY_US_BODY,
    guaranteeHeading = 'Our Guarantee',
    guaranteeBody,
    faqs,
    permanenceBlock,
    finalHeading,
    finalBody = 'Call (253) 750-0211 or fill out the form below. Spencer calls you back same business day.',
    finalSubtext,
  } = props

  const { reviews } = pickLpReviews(slug)

  // Block array mirrors buildLpBlocks order/shape. Backgrounds alternate
  // grass / grass-alt; gradient ONLY on the final CTA (last block).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heroBlock: any = {
    blockType: 'hero',
    heading: headline,
    subheading: subtext,
    layout: 'left',
    heroHeight: '70vh',
    heroOverlay: 'strong',
    fallbackImage: heroImage,
    cta: { text: CALL_CTA, url: PHONE, style: 'primary' },
    trustStrip: TRUST_STRIP,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restBlocks: any[] = [
    {
      blockType: 'painPoints',
      heading: "Not Sure It's Moles in Your Yard?",
      showDivider: false,
      background: 'grass',
      body: isItMolesBody,
    },
    {
      blockType: 'stepsProcess',
      heading: stepsHeading,
      showDivider: false,
      background: 'grass-alt',
      steps,
      cta: { text: CALL_CTA, url: PHONE },
    },
    {
      blockType: 'testimonial',
      heading: 'What Got Moles Customers Say',
      background: 'grass',
      quotes: reviews,
      moreLink: { text: 'See all 219+ reviews', url: '/reviews/' },
    },
    {
      blockType: 'painPoints',
      heading: whyUsHeading,
      showDivider: false,
      background: 'grass-alt',
      body: whyUsBody,
    },
    {
      blockType: 'painPoints',
      heading: guaranteeHeading,
      showDivider: false,
      background: 'grass',
      body: guaranteeBody,
    },
    {
      blockType: 'faq',
      heading: 'Common Questions',
      items: faqs,
      generateSchema: true,
      background: 'grass-alt',
    },
    {
      blockType: 'imageText',
      heading: 'You Deal With Spencer and His Crew',
      imagePosition: 'left',
      fallbackImage: 'team-spencer-crew',
      imageAlt: 'Spencer Hill and the Got Moles crew',
      background: 'grass',
      content: lxParagraphs(
        'No call center. No franchise. Got Moles is Spencer Hill and his team — veteran-owned, Washington-based, and focused on moles since 2017.',
        "When you call, you're talking to the people who will actually clear your yard. We live and work in Western Washington too.",
      ),
    },
    ...(permanenceBlock
      ? [
          {
            blockType: 'cta',
            heading: permanenceBlock.heading,
            body: permanenceBlock.body,
            buttonText: permanenceBlock.buttonText,
            buttonUrl: PHONE,
            buttonStyle: 'secondary',
            subtext: permanenceBlock.subtext,
            showForm: false,
            background: 'grass-alt',
          },
        ]
      : []),
    {
      blockType: 'cta',
      heading: finalHeading,
      body: finalBody,
      buttonText: CALL_CTA,
      buttonUrl: PHONE,
      buttonStyle: 'primary',
      subtext: finalSubtext,
      showForm: true,
      background: 'gradient',
    },
  ]

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: breadcrumbName, url: `/lp/${slug}/` }])} />
      <RenderBlocks blocks={[heroBlock]} />
      <LpQuickForm source={slug} />
      <RenderBlocks blocks={restBlocks} />
    </>
  )
}
