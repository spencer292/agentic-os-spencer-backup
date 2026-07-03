import Link from 'next/link'
import { Section } from '../Section'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ServiceAreaBlock({ block }: { block: any }) {
  const bg = (block.background as 'cream' | 'grass' | 'grass-alt') || 'grass'
  const isLight = bg === 'cream'
  const cities: { name: string; url: string }[] = block.cities || []

  return (
    <Section background={bg}>
      {block.heading && (
        <div className="mb-10 text-center">
          <h2
            className={`font-heading text-h2 uppercase tracking-tight ${isLight ? 'text-neutral-800' : ''}`}
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {block.heading}
          </h2>
        </div>
      )}

      {block.countyText && (
        <p className={`font-body text-small uppercase tracking-widest mb-8 text-center ${isLight ? 'text-neutral-500' : 'text-cream-200/65'}`}>
          {block.countyText}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {cities.map((city) => (
          <Link
            key={city.url}
            href={city.url}
            className={`py-3 px-3 text-center font-body text-sm transition-colors no-underline ${
              isLight
                ? 'text-neutral-700 hover:text-gold-500'
                : 'text-cream-200/80 hover:text-gold-500'
            }`}
          >
            {city.name}
          </Link>
        ))}
      </div>

      {block.allAreasLink?.text && block.allAreasLink?.url && (
        <div className="mt-8 text-center">
          <Link
            href={block.allAreasLink.url}
            className="inline-flex items-center gap-3 px-9 py-4 bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors no-underline rounded-2xl"
          >
            {block.allAreasLink.text}
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12M10 4l6 6-6 6" />
            </svg>
          </Link>
        </div>
      )}
    </Section>
  )
}
