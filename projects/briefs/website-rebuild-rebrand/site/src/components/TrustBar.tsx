interface Metric {
  number: string
  label: string
}

interface TrustBarProps {
  metrics?: Metric[]
  background?: 'grass'
}

const defaultMetrics: Metric[] = [
  { number: '9', label: 'YRS IN BUSINESS' },
  { number: '5,000+', label: 'CLIENTS SERVED' },
  { number: '219+', label: '5-STAR REVIEWS' },
  { number: '✓', label: 'PROVEN RESULTS' },
]

export function TrustBar({ metrics, background = 'grass' }: TrustBarProps) {
  const items = metrics && metrics.length > 0 ? metrics : defaultMetrics

  return (
    <section
      className="text-cream-200 py-8 lg:py-12"
      style={{
        background: 'linear-gradient(to bottom, #153635, #184241)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {items.map((metric) => (
            <div key={metric.label}>
              <div className="font-heading font-bold text-h2 text-gold-500">
                {metric.number}
              </div>
              <div className="font-body text-small uppercase tracking-widest text-cream-200/65 mt-1">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
