// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TrustBarBlock({ block }: { block: any }) {
  const variant = block.variant || 'inline'
  const metrics: { number: string; label: string }[] = block.metrics || []

  // Build flowing dot-separated text from metrics
  // Fallback to default trust items if no metrics
  const trustItems: string[] =
    metrics.length > 0
      ? metrics.map((m) => m.label ? `${m.number} ${m.label}` : m.number)
      : ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids']

  if (variant === 'hero') {
    // Inline hero variant — rendered inside HeroBlock, no wrapper section
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-cream-200/80 font-body text-sm">
        <div className="flex gap-0.5 mr-2" aria-label="5 stars">
          {Array.from({ length: 5 }, (_, i) => (
            <svg key={i} className="w-3.5 h-3.5 text-gold-500 fill-current" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          ))}
        </div>
        {trustItems.map((item, i) => (
          <span key={i}>
            {item}
            {i < trustItems.length - 1 && <span className="mx-2 text-cream-200/30">·</span>}
          </span>
        ))}
      </div>
    )
  }

  // Default inline variant — separate section with Blue accent gradient
  return (
    <section
      className="text-cream-200 py-6 lg:py-8"
      style={{ background: 'linear-gradient(to bottom, #153635, #184241)' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3">
          {/* Stars */}
          <div className="flex gap-1" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }, (_, i) => (
              <svg key={i} className="w-4 h-4 text-gold-500 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          {/* Flowing dot-separated text */}
          <p className="font-body text-sm text-center text-cream-200/80 leading-relaxed">
            {trustItems.map((item, i) => (
              <span key={i}>
                {item}
                {i < trustItems.length - 1 && (
                  <span className="mx-2 text-cream-200/40">·</span>
                )}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
