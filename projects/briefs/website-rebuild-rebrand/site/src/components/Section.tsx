interface SectionProps {
  children: React.ReactNode
  className?: string
  background?: 'grass' | 'grass-alt' | 'cream' | 'gradient' | 'grass-dark'
  spacing?: 'standard' | 'generous'
  id?: string
}

const bgClasses: Record<string, string> = {
  grass: 'text-cream-200',
  'grass-alt': 'text-cream-200',
  cream: 'bg-cream-50 text-neutral-800',
  gradient: 'text-cream-200',
  'grass-dark': 'text-cream-200',
}

// Flat body at top 65%, gradient over bottom 35% to blend softly into the
// next section's shade. Big enough fade to feel organic, small enough that
// the section's primary color still reads as a clear band.
const bgStyles: Record<string, React.CSSProperties | undefined> = {
  grass: { background: 'linear-gradient(to bottom, #184241 65%, #153635 100%)' },
  'grass-alt': { background: 'linear-gradient(to bottom, #153635 65%, #184241 100%)' },
  cream: undefined,
  gradient: { background: 'linear-gradient(to bottom, #153635 0%, #184241 15%, #184241 65%, #0E2A28 100%)' },
  'grass-dark': { background: 'linear-gradient(to bottom, #153635 65%, #184241 100%)' },
}

export function Section({ children, className = '', background = 'grass', spacing = 'standard', id }: SectionProps) {
  const paddingClass = spacing === 'generous' ? 'py-16 lg:py-32' : 'py-12 lg:py-24'

  return (
    <section
      id={id}
      className={`${paddingClass} ${bgClasses[background] ?? 'text-cream-200'} ${className}`}
      style={bgStyles[background]}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}
