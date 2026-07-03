import type { ReactNode } from 'react'
import { Section } from './Section'
import { ContactForm } from './ContactForm'

interface CTABlockProps {
  heading: string
  body?: string
  buttonText?: string
  buttonUrl?: string
  subtext?: string
  socialProof?: string
  showForm?: boolean
  background?: 'gradient' | 'grass' | 'grass-alt'
  /** Optional secondary line rendered below subtext — used by blog posts to
   *  surface the QuizCTA inline variant inside the final CTA. */
  secondaryLine?: ReactNode
}

export function CTABlock({
  heading,
  body,
  buttonText = 'CALL (253) 750-0211',
  buttonUrl = 'tel:+12537500211',
  subtext,
  socialProof,
  showForm = false,
  background = 'gradient',
  secondaryLine,
}: CTABlockProps) {
  if (showForm) {
    // 2-column layout when form is shown
    return (
      <Section background={background}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: text + CTA */}
          <div>
            <h2
              className="font-heading text-h2 uppercase tracking-tight mb-4"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              {heading}
            </h2>

            {body && (
              <p className="font-body text-body-lg mb-8 text-cream-200/90">
                {body}
              </p>
            )}

            {socialProof && (
              <p className="font-body text-small text-cream-200/65 mb-6">
                {socialProof}
              </p>
            )}

            <a
              href={buttonUrl}
              className="inline-block px-9 py-4 bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors rounded-2xl"
            >
              {buttonText}
            </a>

            {subtext && (
              <p className="font-body text-small text-cream-200/65 mt-4">
                {subtext}
              </p>
            )}

            {secondaryLine}
          </div>

          {/* Right: form */}
          <div>
            <ContactForm variant="transparent" />
          </div>
        </div>
      </Section>
    )
  }

  // Centered layout when no form
  return (
    <Section background={background}>
      <div className="max-w-2xl mx-auto text-center">
        <h2
          className="font-heading text-h2 uppercase tracking-tight mb-4"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          {heading}
        </h2>

        {body && (
          <p className="font-body text-body-lg mb-8 text-cream-200/90">
            {body}
          </p>
        )}

        {socialProof && (
          <p className="font-body text-small text-cream-200/65 mb-6">
            {socialProof}
          </p>
        )}

        <a
          href={buttonUrl}
          className="inline-block px-9 py-4 bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors rounded-2xl"
        >
          {buttonText}
        </a>

        {subtext && (
          <p className="font-body text-small text-cream-200/65 mt-4">
            {subtext}
          </p>
        )}
      </div>
    </Section>
  )
}
