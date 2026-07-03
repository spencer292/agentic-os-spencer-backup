'use client'

import { Section } from './Section'

type Cluster =
  | 'Biology'
  | 'Mole Control'
  | 'DIY vs Pro'
  | 'Cost & Value'
  | 'Safety'
  | 'Seasonal'
  | 'Mole Biology'
  | string
  | undefined

type Placement = 'mid_flow' | 'final_cta' | 'standalone'

interface QuizCTAProps {
  cluster?: Cluster
  slug?: string
  variant?: 'block' | 'inline'
  placement?: Placement
  background?: 'grass' | 'grass-alt'
  /** Test-page only. Renders a small overline above the heading. */
  debugLabel?: string
}

const QUIZ_BASE_URL = 'https://score.got-moles.com/'

// All cluster copy aligns with the actual quiz promise: a Mole Risk Score
// + personalized report on why moles target the yard and how to stop them
// returning. Button text mirrors the quiz's own CTA ("FIND MY RISK SCORE")
// for ad-to-page message match.
const COPY: Record<string, { heading: string; sub: string; button: string }> = {
  Biology: {
    heading: 'Why is your yard a mole target?',
    sub: 'Get your free 2-minute Mole Risk Score — a personalized report on what is drawing them in and how to make your property less attractive.',
    button: 'Find my risk score',
  },
  'Mole Biology': {
    heading: 'Why is your yard a mole target?',
    sub: 'Get your free 2-minute Mole Risk Score — a personalized report on what is drawing them in and how to make your property less attractive.',
    button: 'Find my risk score',
  },
  'Mole Control': {
    heading: 'Why do moles keep coming back? Find out in 2 minutes.',
    sub: 'Free, personalized Mole Risk Score with a report on what is making your yard a target — and the exact steps to stop reinvasion.',
    button: 'Find my risk score',
  },
  'DIY vs Pro': {
    heading: 'Get your Mole Risk Score in 2 minutes.',
    sub: 'Free, personalized report on why moles keep returning to your yard — and the exact steps to stop them. No call required.',
    button: 'Find my risk score',
  },
  'Cost & Value': {
    heading: 'Before you spend on mole removal, get your Risk Score.',
    sub: 'Free 2-minute report on what is making your property a mole magnet — and what to actually do about it. No pricing pressure, no call required.',
    button: 'Find my risk score',
  },
  Safety: {
    heading: 'What is drawing moles to your yard?',
    sub: 'Free 2-minute Mole Risk Score with a personalized report on why moles keep coming back — and the chemical-free steps to stop them.',
    button: 'Find my risk score',
  },
  Seasonal: {
    heading: 'Get your Mole Risk Score in 2 minutes.',
    sub: 'Free, personalized report on why moles target your yard this time of year — and exactly what to do about it.',
    button: 'Find my risk score',
  },
}

const DEFAULT_COPY = {
  heading: 'Get your Mole Risk Score in 2 minutes.',
  sub: 'Free, personalized report on what is drawing moles to your yard — and how to stop them coming back.',
  button: 'Find my risk score',
}

// Build a case-insensitive lookup map from COPY so 'Biology', 'biology',
// and 'BIOLOGY' all resolve to the same entry. The CMS may store cluster
// values in either case depending on how the post was seeded.
const COPY_LOWER: Record<string, { heading: string; sub: string; button: string }> =
  Object.fromEntries(Object.entries(COPY).map(([k, v]) => [k.toLowerCase(), v]))

function getCopy(cluster?: Cluster) {
  if (!cluster) return DEFAULT_COPY
  const key = String(cluster).toLowerCase()
  return COPY_LOWER[key] ?? DEFAULT_COPY
}

function buildUrl(slug?: string, placement?: Placement) {
  const params = new URLSearchParams({
    utm_source: 'blog',
    utm_medium: 'cta',
    utm_campaign: 'quiz_cta',
  })
  if (slug) params.set('utm_content', slug)
  if (placement) params.set('utm_term', placement)
  return `${QUIZ_BASE_URL}?${params.toString()}`
}

function pushClickEvent(cluster?: Cluster, slug?: string, placement?: Placement) {
  if (typeof window === 'undefined') return
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({
    event: 'quiz_cta_click',
    placement: placement ?? 'unknown',
    cluster: cluster ?? 'unknown',
    slug: slug ?? 'unknown',
  })
}

export function QuizCTA({
  cluster,
  slug,
  variant = 'block',
  placement = variant === 'inline' ? 'final_cta' : 'mid_flow',
  background = 'grass-alt',
  debugLabel,
}: QuizCTAProps) {
  const copy = getCopy(cluster)
  const url = buildUrl(slug, placement)

  if (variant === 'inline') {
    return (
      <p className="font-body text-small text-cream-200/75 mt-6">
        Or{' '}
        <a
          href={url}
          onClick={() => pushClickEvent(cluster, slug, placement)}
          className="text-gold-500 hover:text-gold-400 font-semibold no-underline"
        >
          get your free 2-minute Mole Risk Score
        </a>{' '}
        for a personalized report on why moles target your yard.
      </p>
    )
  }

  return (
    <Section background={background}>
      <div className="max-w-[720px] mx-auto text-center">
        {debugLabel && (
          <p className="font-body text-small text-cream-200/65 uppercase tracking-wider mb-3">
            Cluster: <span className="text-gold-500">{debugLabel}</span>
          </p>
        )}
        <h2
          className="font-heading text-h2 uppercase tracking-tight text-cream-200 mb-4"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          {copy.heading}
        </h2>
        <p className="font-body text-body-lg text-cream-200/85 mb-8 max-w-[55ch] mx-auto">
          {copy.sub}
        </p>
        <a
          href={url}
          onClick={() => pushClickEvent(cluster, slug, placement)}
          className="inline-block px-9 py-4 bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors rounded-2xl"
        >
          {copy.button}
        </a>
        <p className="font-body text-small text-cream-200/65 mt-4">
          Free. No call required. Takes about 2 minutes.
        </p>
      </div>
    </Section>
  )
}
