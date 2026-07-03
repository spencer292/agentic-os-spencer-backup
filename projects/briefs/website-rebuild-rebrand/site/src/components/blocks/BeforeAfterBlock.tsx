import { Section } from '../Section'

// Before/After proof block for the LP template. Renders two labelled images
// side-by-side (stacks on mobile). Images are static WebP in public/images/,
// referenced by filename without extension (e.g. "lp-ba-2-before").
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BeforeAfterBlock({ block }: { block: any }) {
  const bg = (block.background as 'grass' | 'grass-alt' | 'cream') || 'grass-alt'
  const before = block.beforeImage
  const after = block.afterImage
  if (!before || !after) return null

  const cards = [
    { label: 'Before', src: `/images/${before}.webp`, alt: 'Lawn damaged by mole mounds before treatment' },
    { label: 'After', src: `/images/${after}.webp`, alt: 'Healthy restored lawn after Got Moles mole control' },
  ]

  return (
    <Section background={bg}>
      {block.heading && (
        <div className="max-w-3xl mx-auto mb-8">
          <h2
            className="font-heading text-h2 uppercase tracking-tight text-center"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {block.heading}
          </h2>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 max-w-4xl mx-auto">
        {cards.map((c) => (
          <figure key={c.label} className="relative overflow-hidden rounded-2xl">
            <div className="relative aspect-[4/3]">
              <img
                src={c.src}
                alt={c.alt}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <figcaption className="absolute top-3 left-3 px-3 py-1 rounded-full bg-grass-600/90 text-cream-200 font-heading font-bold text-xs uppercase tracking-[0.1em]">
              {c.label}
            </figcaption>
          </figure>
        ))}
      </div>

      {block.caption && (
        <p className="text-center font-body text-body-sm text-cream-200/70 mt-5 max-w-2xl mx-auto">
          {block.caption}
        </p>
      )}
    </Section>
  )
}
