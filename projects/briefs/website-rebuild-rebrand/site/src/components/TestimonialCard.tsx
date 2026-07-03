interface Quote {
  text: string
  name: string
  city?: string
  rating?: number
}

interface TestimonialCardProps {
  heading?: string
  quotes: Quote[]
  moreLink?: { text: string; url: string }
  background?: 'grass'
}

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} className="w-4 h-4 text-gold-500 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </div>
  )
}

export function TestimonialCard({ heading, quotes, moreLink, background = 'grass' }: TestimonialCardProps) {
  return (
    <div>
      {heading && (
        <div className="text-center mb-8">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-4">{heading}</h2>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {quotes.map((quote, i) => (
          <blockquote
            key={i}
            className="p-6 bg-grass-500/30"
          >
            <span className="font-heading text-gold-500 text-5xl leading-none block mb-3">&ldquo;</span>
            <p className="font-body text-body text-cream-200 mb-4 leading-relaxed">{quote.text}</p>
            <Stars count={quote.rating || 5} />
            <cite className="not-italic block mt-2">
              <span className="font-body text-sm text-cream-200/80">{quote.name}</span>
              {quote.city && (
                <span className="font-body text-sm text-cream-200/65 block">{quote.city}</span>
              )}
            </cite>
          </blockquote>
        ))}
      </div>

      {moreLink && (
        <div className="text-center mt-8">
          <a href={moreLink.url} className="font-body text-sm text-gold-500 hover:text-gold-400 no-underline">
            {moreLink.text} &rarr;
          </a>
        </div>
      )}
    </div>
  )
}
