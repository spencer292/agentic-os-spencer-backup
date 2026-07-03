import { Section } from '../Section'

interface ServiceItem {
  name: string
  link?: string
  bestFor: string
  howItWorks: string
  pricing: string
  guarantee?: string
  duration?: string
  reporting?: string
}

const ROW_LABELS = [
  { key: 'bestFor', label: 'Best for' },
  { key: 'howItWorks', label: 'How it works' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'guarantee', label: 'Guarantee' },
  { key: 'duration', label: 'Duration' },
  { key: 'reporting', label: 'Reporting' },
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ServiceComparisonBlock({ block }: { block: any }) {
  const bg = (block.background as 'grass' | 'grass-alt') || 'grass-alt'
  const services: ServiceItem[] = block.services || []

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

      {/* Desktop: HTML table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-4 font-body text-sm text-cream-200/50 w-[140px]" />
              {services.map((s, i) => (
                <th key={i} className="p-4 text-center">
                  {s.link ? (
                    <a href={s.link} className="font-heading font-bold text-lg uppercase tracking-tight text-gold-500 hover:text-gold-400 no-underline">
                      {s.name}
                    </a>
                  ) : (
                    <span className="font-heading font-bold text-lg uppercase tracking-tight text-gold-500">
                      {s.name}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROW_LABELS.map((row, ri) => (
              <tr key={row.key} className={ri % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.02]'}>
                <td className="p-4 font-body font-semibold text-sm text-cream-200/70 align-top">
                  {row.label}
                </td>
                {services.map((s, si) => (
                  <td key={si} className={`p-4 font-body text-body-lg text-cream-200/90 align-top text-center ${row.key === 'pricing' ? 'font-heading font-bold text-gold-500 text-xl' : ''}`}>
                    {(s as unknown as Record<string, string | undefined>)[row.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-6">
        {services.map((s, i) => (
          <div key={i} className="bg-white/5 rounded-2xl p-6">
            {s.link ? (
              <a href={s.link} className="block font-heading font-bold text-lg uppercase tracking-tight text-gold-500 hover:text-gold-400 mb-4 no-underline">
                {s.name}
              </a>
            ) : (
              <p className="font-heading font-bold text-lg uppercase tracking-tight text-gold-500 mb-4">
                {s.name}
              </p>
            )}
            <dl className="space-y-3">
              {ROW_LABELS.map((row) => {
                const val = (s as unknown as Record<string, string | undefined>)[row.key]
                if (!val) return null
                return (
                  <div key={row.key}>
                    <dt className="font-body font-semibold text-sm text-cream-200/60">{row.label}</dt>
                    <dd className={`font-body text-body-lg text-cream-200/90 mt-0.5 ${row.key === 'pricing' ? 'font-heading font-bold text-gold-500 text-xl' : ''}`}>
                      {val}
                    </dd>
                  </div>
                )
              })}
            </dl>
            {s.link && (
              <a href={s.link} className="inline-flex items-center gap-1.5 mt-4 font-body text-sm font-semibold text-gold-500 hover:text-gold-400 no-underline">
                Learn more
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" />
                </svg>
              </a>
            )}
          </div>
        ))}
      </div>

      {block.footnote && (
        <p className="text-center font-body text-body-lg text-cream-200/70 mt-8">
          {block.footnote}
        </p>
      )}
    </Section>
  )
}
