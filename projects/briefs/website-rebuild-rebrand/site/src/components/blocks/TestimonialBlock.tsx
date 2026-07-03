import { Section } from '../Section'

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} className="w-4 h-4 text-gold-500 fill-current" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TestimonialBlock({ block }: { block: any }) {
  const bg = (block.background as 'grass' | 'grass-alt') || 'grass'
  const quotes: { text: string; name: string; city?: string; rating?: number }[] = block.quotes || []
  const [featured, ...supporting] = quotes

  return (
    <Section background={bg}>
      {block.heading && (
        <div className="text-center mb-10">
          <h2
            className="font-heading text-h2 uppercase tracking-tight"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {block.heading}
          </h2>
        </div>
      )}

      {/* Featured review — first quote */}
      {featured && (
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="flex justify-center gap-0.5 mb-6" aria-label={`${featured.rating || 5} out of 5 stars`}>
            {Array.from({ length: featured.rating || 5 }, (_, i) => (
              <svg key={i} className="w-5 h-5 text-gold-500 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <blockquote>
            <span className="font-heading text-gold-500 text-5xl leading-none block mb-2" aria-hidden="true">&ldquo;</span>
            <p className="font-body text-body-lg text-cream-200 leading-relaxed italic">
              {featured.text}
            </p>
          </blockquote>
          <cite className="not-italic block mt-6">
            <span className="font-body text-sm font-semibold text-cream-200">{featured.name}</span>
            {featured.city && <span className="font-body text-sm text-cream-200/65 block mt-0.5">{featured.city}</span>}
          </cite>
        </div>
      )}

      {/* Supporting reviews */}
      {supporting.length > 0 && (
        <div className={`max-w-3xl mx-auto grid grid-cols-1 gap-6 ${supporting.length >= 2 ? 'md:grid-cols-2' : ''}`}>
          {supporting.map((quote, i) => (
            <blockquote key={i} className="pl-5">
              <p className="font-body text-body text-cream-200/90 leading-relaxed mb-3">
                &ldquo;{quote.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <Stars count={quote.rating || 5} />
                <cite className="not-italic font-body text-sm text-cream-200/80">
                  {quote.name}
                  {quote.city && <span className="text-cream-200/65 ml-1">— {quote.city}</span>}
                </cite>
              </div>
            </blockquote>
          ))}
        </div>
      )}

      {block.moreLink?.text && block.moreLink?.url && (
        <div className="text-center mt-10">
          <a
            href={block.moreLink.url}
            className="inline-flex items-center gap-1.5 font-body text-sm text-gold-500 hover:text-gold-400"
          >
            {block.moreLink.text}
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" />
            </svg>
          </a>
        </div>
      )}
    </Section>
  )
}
