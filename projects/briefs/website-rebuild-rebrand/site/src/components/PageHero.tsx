import Image from 'next/image'
import type React from 'react'

export interface PageHeroProps {
  heading: string
  subheading?: string
  image: string
  imageAlt: string
  height?: '100vh' | '85vh' | '70vh'
  cta?: { text: string; url: string }
  trustStrip?: string[]
}

export function PageHero({
  heading,
  subheading,
  image,
  imageAlt,
  height = '85vh',
  cta,
  trustStrip,
}: PageHeroProps) {
  const heightClass =
    height === '100vh'
      ? 'min-h-[100vh]'
      : height === '70vh'
        ? 'min-h-[70vh]'
        : 'min-h-[85vh]'

  // Slightly more opaque overlay for full-viewport heroes
  const gradientOpacity = height === '100vh' ? '0.95' : '0.9'
  const gradient = `linear-gradient(to bottom, rgba(21,54,53,0.6) 0%, rgba(21,54,53,0.15) 30%, rgba(21,54,53,0.15) 50%, rgba(21,54,53,0.5) 70%, rgba(21,54,53,${gradientOpacity}) 100%)`

  const isTel = cta?.url?.startsWith('tel:')

  return (
    <section className={`relative ${heightClass} flex flex-col overflow-hidden bg-grass-600`}>
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      {/* Gradient overlay — dark top + clear middle + dark bottom */}
      <div className="absolute inset-0" style={{ background: gradient }} />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-32 pb-16 flex flex-col flex-1">
        {/* Spacer pushes content to bottom */}
        <div className="flex-1" />

        <div className="max-w-2xl">
          <h1
            className="font-heading font-bold text-display uppercase tracking-tight text-cream-200 leading-tight mb-5"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {heading}
          </h1>

          {subheading && (
            <p className="font-body text-body-lg text-cream-200/85 mb-8 leading-relaxed">
              {subheading}
            </p>
          )}

          {cta?.text && (
            <a
              href={cta.url}
              className="inline-flex items-center gap-3 px-9 py-4 bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors rounded-2xl"
            >
              {cta.text}
              {!isTel && (
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12M10 4l6 6-6 6" />
                </svg>
              )}
            </a>
          )}
        </div>
      </div>

      {/* Trust strip — sits at very bottom of hero, over the photo */}
      {trustStrip && trustStrip.length > 0 && (
        <div
          className="relative z-10 w-full"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgba(24,66,65,0.85) 30%, #184241)',
          }}
        >
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-10 pb-6 lg:pt-14 lg:pb-8">
            <div className="flex justify-center gap-1 mb-3" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5 text-gold-500 fill-current"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <p className="text-center font-body text-body-lg text-cream-200/90">
              {trustStrip.map((item, i) => (
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
