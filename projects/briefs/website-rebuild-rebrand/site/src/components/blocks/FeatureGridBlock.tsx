import Image from 'next/image'
import { Section } from '../Section'

const colClasses: Record<string, string> = {
  '2': 'grid-cols-1 md:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-3',
  '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FeatureGridBlock({ block }: { block: any }) {
  const bg = (block.background as 'grass' | 'grass-alt') || 'grass-alt'
  const isLight = false
  const columns = block.columns || '3'
  const items: { title: string; description: string; price?: string; icon?: { url?: string }; link?: string; linkText?: string }[] =
    block.items || []

  return (
    <Section background={bg}>
      {block.heading && (
        <div className="text-center mb-10">
          <h2
            className="font-heading text-h2 uppercase tracking-tight mb-4"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {block.heading}
          </h2>
        </div>
      )}

      <div className={`grid ${colClasses[columns] || colClasses['3']} gap-6 lg:gap-8`}>
        {items.map((item, i) => {
          const iconUrl = typeof item.icon === 'object' && item.icon !== null ? item.icon.url : null
          const CardWrapper = item.link ? 'a' : 'div'
          const cardProps = item.link ? { href: item.link } : {}

          return (
            <CardWrapper
              key={i}
              {...cardProps}
              className={`p-6 lg:p-8 rounded-2xl transition-colors no-underline block ${
                isLight
                  ? 'bg-white hover:border-gold-500 border border-neutral-200'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {iconUrl && (
                <div className="mb-4">
                  <Image src={iconUrl} alt="" width={40} height={40} className="w-10 h-10" unoptimized />
                </div>
              )}

              <h3
                className={`font-body font-semibold text-h4 lg:text-2xl mb-2 ${
                  isLight ? 'text-neutral-800' : 'text-cream-200'
                }`}
              >
                {item.title}
              </h3>

              {item.price && (
                <p className="font-heading font-bold text-gold-500 text-xl mb-2">{item.price}</p>
              )}

              <p
                className={`font-body text-body-lg leading-relaxed ${
                  isLight ? 'text-neutral-600' : 'text-cream-200/80'
                }`}
              >
                {item.description}
              </p>

              {item.link && item.linkText && (
                <span className="inline-flex items-center gap-1.5 mt-4 font-body text-sm font-semibold text-gold-500 hover:text-gold-400">
                  {item.linkText}
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" />
                  </svg>
                </span>
              )}
            </CardWrapper>
          )
        })}
      </div>
    </Section>
  )
}
