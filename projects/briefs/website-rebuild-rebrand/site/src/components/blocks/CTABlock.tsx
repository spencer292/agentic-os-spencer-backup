import { Section } from '../Section'
import { ContactForm } from '../ContactForm'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CTABlock({ block }: { block: any }) {
  const bg = (block.background as 'gradient' | 'grass' | 'grass-alt') || 'gradient'

  if (block.showForm) {
    // 2-column layout when form is shown
    return (
      <Section background={bg}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: text + CTA */}
          <div>
            <h2
              className="font-heading text-h2 uppercase tracking-tight mb-4"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              {block.heading}
            </h2>

            {block.body && (
              <p className="font-body text-body-lg mb-8 text-cream-200/90">
                {block.body}
              </p>
            )}

            <a
              href={block.buttonUrl || 'tel:+12537500211'}
              className={`inline-block px-9 py-4 font-heading font-bold text-sm uppercase tracking-[0.1em] transition-colors rounded-2xl ${
                block.buttonStyle === 'secondary'
                  ? 'border-2 border-cream-200 text-cream-200 hover:bg-cream-200 hover:text-blue-600'
                  : 'bg-gold-500 text-blue-600 hover:bg-gold-600'
              }`}
            >
              {block.buttonText || 'CALL (253) 750-0211'}
            </a>

            {block.subtext && (
              <p className="font-body text-small text-cream-200/65 mt-4">
                {block.subtext}
              </p>
            )}
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
    <Section background={bg}>
      <div className="max-w-2xl mx-auto text-center">
        <h2
          className="font-heading text-h2 uppercase tracking-tight mb-4"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          {block.heading}
        </h2>

        {block.body && (
          <p className="font-body text-body-lg mb-8 text-cream-200/90">
            {block.body}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={block.buttonUrl || 'tel:+12537500211'}
            className={`inline-block px-9 py-4 font-heading font-bold text-sm uppercase tracking-[0.1em] transition-colors rounded-2xl ${
              block.buttonStyle === 'secondary'
                ? 'border-2 border-cream-200 text-cream-200 hover:bg-cream-200 hover:text-blue-600'
                : 'bg-gold-500 text-blue-600 hover:bg-gold-600'
            }`}
          >
            {block.buttonText || 'CALL (253) 750-0211'}
          </a>
        </div>

        {block.subtext && (
          <p className="font-body text-small text-cream-200/65 mt-4">
            {block.subtext}
          </p>
        )}
      </div>
    </Section>
  )
}
