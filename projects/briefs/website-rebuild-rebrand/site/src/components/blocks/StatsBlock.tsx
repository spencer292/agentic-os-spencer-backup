import { Section } from '../Section'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StatsBlock({ block }: { block: any }) {
  const bg = (block.background as 'grass' | 'cream' | 'grass-alt') || 'grass'
  const isLight = bg === 'cream'
  const items: { number: string; label: string; description?: string }[] = block.items || []

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

      <div className={`grid grid-cols-2 gap-8 lg:gap-12 ${
        items.length <= 2
          ? 'md:grid-cols-2 max-w-xl mx-auto'
          : items.length === 3
            ? 'md:grid-cols-3'
            : 'md:grid-cols-4'
      } text-center`}>
        {items.map((item, i) => (
          <div key={i}>
            <div className="font-heading font-bold text-h1 text-gold-500">
              {item.number}
            </div>
            <div className={`font-body text-small uppercase tracking-widest mt-2 mb-1 ${isLight ? 'text-neutral-500' : 'text-cream-200/65'}`}>
              {item.label}
            </div>
            {item.description && (
              <p className={`font-body text-small leading-relaxed mt-2 ${isLight ? 'text-neutral-600' : 'text-cream-200/75'}`}>
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}
