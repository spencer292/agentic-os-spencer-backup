import { Section } from '../Section'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StepsProcessBlock({ block }: { block: any }) {
  const bg = (block.background as 'grass' | 'grass-alt') || 'grass'
  const steps: { number?: string; title: string; summary?: string; detail?: string; description?: string }[] = block.steps || []

  const isTel = block.cta?.url?.startsWith('tel:')

  return (
    <Section background={bg}>
      {block.heading && (
        <div className="mb-10 max-w-3xl">
          <h2
            className="font-heading text-h2 uppercase tracking-tight"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {block.heading}
          </h2>
        </div>
      )}

      <ol className="max-w-3xl space-y-6 list-none pl-0">
        {steps.map((step, i) => {
          // summary = short visible text, description = full text for progressive disclosure
          // If no summary, description shows as the visible text (no disclosure)
          const summaryText = step.summary || step.description || ''
          const detailText = step.summary ? (step.description || '') : ''

          return (
            <li key={i} className="flex gap-5">
              {/* Gold dot bullet */}
              <div className="flex-shrink-0 mt-2">
                <div className="w-3 h-3 rounded-full bg-gold-500" aria-hidden="true" />
              </div>

              <div className="flex-1 pb-6 border-b border-cream-200/10 last:border-0 last:pb-0">
                <h3 className="font-heading font-bold text-h3 uppercase tracking-tight text-cream-200 mb-2">
                  {step.title}
                </h3>

                {summaryText && (
                  <p className="font-body text-body-lg text-cream-200/80 leading-relaxed">
                    {summaryText}
                  </p>
                )}

                {detailText && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer inline-flex items-center gap-2 font-body text-sm text-gold-500 hover:text-gold-400 list-none">
                      Learn more
                      <svg
                        className="w-3 h-3 transition-transform group-open:rotate-180"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                      </svg>
                    </summary>
                    <p className="mt-3 font-body text-body text-cream-200/70 leading-relaxed">
                      {detailText}
                    </p>
                  </details>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {block.cta?.text && block.cta?.url && (
        <div className="mt-10">
          <a
            href={block.cta.url}
            className="inline-flex items-center gap-3 px-9 py-4 bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors rounded-2xl"
          >
            {block.cta.text}
            {!isTel && (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12M10 4l6 6-6 6" />
              </svg>
            )}
          </a>
          {block.cta.subtext && (
            <p className="font-body text-small text-cream-200/65 mt-3">
              {block.cta.subtext}
            </p>
          )}
        </div>
      )}
    </Section>
  )
}
