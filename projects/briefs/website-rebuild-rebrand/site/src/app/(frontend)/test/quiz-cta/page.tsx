import type { Metadata } from 'next'
import { QuizCTA } from '@/components/QuizCTA'
import { Section } from '@/components/Section'

export const metadata: Metadata = {
  title: 'Test — Quiz CTA Variants',
  robots: 'noindex, nofollow',
}

const CLUSTERS = [
  'Biology',
  'Mole Control',
  'DIY vs Pro',
  'Cost & Value',
  'Safety',
  'Seasonal',
  undefined,
] as const

// Strict alternation per design-system Rule 7: grass <-> grass-alt.
// Title (grass) -> CLUSTERS[0] (grass-alt) -> [1] grass -> ... -> inline final.
export default function QuizCTATestPage() {
  return (
    <>
      <Section background="grass">
        <div className="max-w-[720px] mx-auto">
          <h1 className="font-heading text-h1 uppercase tracking-tight text-cream-200 mb-4">
            Quiz CTA — Variant Preview
          </h1>
          <p className="font-body text-body-lg text-cream-200/80">
            Each block below renders the QuizCTA component with a different
            cluster value. Headlines, subheads, and button copy adapt per
            cluster. Final block shows the inline variant inside a simulated
            final CTA.
          </p>
        </div>
      </Section>

      {CLUSTERS.map((cluster, i) => {
        const bg = i % 2 === 0 ? 'grass-alt' : 'grass'
        return (
          <QuizCTA
            key={`block-${i}`}
            cluster={cluster}
            slug={`test-${cluster ?? 'default'}`}
            variant="block"
            background={bg}
            debugLabel={cluster ?? '(no cluster — default fallback)'}
          />
        )
      })}

      {/* CLUSTERS.length = 7, last is i=6 -> grass-alt. Final inline = grass. */}
      <Section background="grass">
        <div className="max-w-[720px] mx-auto">
          <p className="font-body text-small text-cream-200/65 uppercase tracking-wider mb-4">
            Inline variant — shown inside the final CTABlock on each blog post
          </p>
          <p className="font-body text-body-lg text-cream-200/90">
            (Example final-CTA copy here — phone number + form would normally
            render above this line.)
          </p>
          <QuizCTA cluster="Mole Control" slug="test-inline" variant="inline" />
        </div>
      </Section>
    </>
  )
}
