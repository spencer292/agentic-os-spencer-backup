// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PainPointsBlock({ block }: { block: any }) {
  const bg = (block.background as 'grass' | 'grass-alt') || 'grass'

  // Match Section.tsx: flat body at top 65%, 35% gradient at bottom to blend
  const bgStyles: Record<string, React.CSSProperties> = {
    grass: { background: 'linear-gradient(to bottom, #184241 65%, #153635 100%)' },
    'grass-alt': { background: 'linear-gradient(to bottom, #153635 65%, #184241 100%)' },
  }

  const isTel = block.cta?.url?.startsWith('tel:')

  return (
    <section
      className="py-12 lg:py-24 text-cream-200"
      style={bgStyles[bg] || bgStyles.grass}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="font-heading text-display uppercase tracking-tight mb-8"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {block.heading}
          </h2>

          {block.body && (
            <div className="space-y-4 mb-8">
              {(block.body as string).split('\n\n').map((para, i, arr) => {
                const isLast = i === arr.length - 1
                return (
                  <p
                    key={i}
                    className={`font-body text-body-lg leading-relaxed ${
                      isLast
                        ? 'font-semibold text-cream-200'
                        : i === 0
                          ? 'text-cream-200/85'
                          : 'text-cream-200/80'
                    }`}
                  >
                    {para}
                  </p>
                )
              })}
            </div>
          )}

          {block.cta?.text && block.cta?.url && (
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
          )}
        </div>
      </div>
    </section>
  )
}
