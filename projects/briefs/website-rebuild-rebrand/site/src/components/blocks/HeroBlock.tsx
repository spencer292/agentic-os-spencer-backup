import Image from 'next/image'

// Static fallback images — used when CMS backgroundImage is not set.
// These live in public/images/ and always deploy with the site.
const FALLBACK_IMAGES: Record<string, string> = {
  'hero-lawn': '/images/hero-lawn.webp',
  'hero-home': '/images/hero-home.webp',
  'hero-faq': '/images/hero-faq.webp',
  'inspection': '/images/inspection.webp',
  'results': '/images/results.webp',
  'mole-damage': '/images/mole-damage.webp',
  'commercial-grounds': '/images/commercial-grounds.webp',
  'clean-yard': '/images/clean-yard.webp',
  'service-area': '/images/service-area.webp',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function HeroBlock({ block }: { block: any }) {
  // Try CMS image first, then fallbackImage field, then default hero-lawn
  const imageUrl =
    typeof block.backgroundImage === 'object' && block.backgroundImage !== null
      ? block.backgroundImage.url
      : typeof block.backgroundImage === 'string'
        ? block.backgroundImage
        : block.fallbackImage
          ? (FALLBACK_IMAGES[block.fallbackImage] || `/images/${block.fallbackImage}.webp`)
          : '/images/hero-lawn.webp'

  // Build alt text. If the heading already carries the geo + mole signals
  // (e.g. "About Got Moles — Western Washington's Mole Specialists"),
  // alt = heading verbatim. Otherwise append a tight signal suffix.
  const baseAlt = block.heading || 'Got Moles'
  const headingLower = baseAlt.toLowerCase()
  const hasGeo = /western washington|seattle|tacoma|enumclaw/.test(headingLower)
  const hasService = /mole/.test(headingLower)
  const fallbackAlt = hasGeo && hasService
    ? baseAlt
    : `${baseAlt}. Professional mole control in Western Washington.`

  const imageAlt =
    typeof block.backgroundImage === 'object' && block.backgroundImage !== null
      ? block.backgroundImage.alt || fallbackAlt
      : fallbackAlt

  const heightClass =
    block.heroHeight === '85vh'
      ? 'min-h-[85vh]'
      : block.heroHeight === '70vh'
        ? 'min-h-[70vh]'
        : 'min-h-[100vh]'

  const isTel = block.cta?.url?.startsWith('tel:')

  return (
    <section className={`relative ${heightClass} flex flex-col overflow-hidden bg-grass-600`}>
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        priority
        fetchPriority="high"
        quality={65}
        className="object-cover"
        sizes="100vw"
      />
      {/* Gradient overlay. heroOverlay='strong' (busy/bright real photos, e.g. LP before-shots):
          darker mid-band + a left-weighted gradient so left-aligned headline + subheading stay legible. */}
      <div
        className="absolute inset-0"
        style={{ background: block.heroOverlay === 'strong'
          ? 'linear-gradient(to bottom, rgba(21,54,53,0.7) 0%, rgba(21,54,53,0.45) 35%, rgba(21,54,53,0.55) 60%, rgba(21,54,53,0.82) 80%, rgba(21,54,53,0.97) 100%)'
          : 'linear-gradient(to bottom, rgba(21,54,53,0.6) 0%, rgba(21,54,53,0.15) 30%, rgba(21,54,53,0.15) 50%, rgba(21,54,53,0.5) 70%, rgba(21,54,53,0.95) 100%)' }}
      />
      {block.heroOverlay === 'strong' && (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(21,54,53,0.8) 0%, rgba(21,54,53,0.4) 42%, rgba(21,54,53,0) 72%)' }}
        />
      )}

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-32 pb-16 flex flex-col flex-1">
        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        <div className="max-w-2xl">
          <h1
            className="font-heading font-bold text-display uppercase tracking-tight text-cream-200 leading-tight mb-5"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {block.heading}
          </h1>

          {block.subheading && (
            <p className="font-body text-body-lg text-cream-200/85 mb-8 leading-relaxed">
              {block.subheading}
            </p>
          )}

          {block.cta?.text && (
            <a
              href={block.cta.url || 'tel:+12537500211'}
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

      {/* Trust strip — sits at the very bottom of the hero, over the photo */}
      {block.trustStrip && (
        <div className="relative z-10 w-full" style={{ background: 'linear-gradient(to bottom, transparent, rgba(24,66,65,0.85) 30%, #184241)' }}>
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-10 pb-6 lg:pt-14 lg:pb-8">
            <div className="flex justify-center gap-1 mb-3" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} className="w-5 h-5 text-gold-500 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <p className="text-center font-body text-body-lg text-cream-200/90">
              {(block.trustStrip as string[]).map((item: string, i: number) => (
                <span key={i}>
                  {i > 0 && <span className="mx-2 text-cream-200/40">&middot;</span>}
                  <span className="font-semibold">{item}</span>
                </span>
              ))}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
