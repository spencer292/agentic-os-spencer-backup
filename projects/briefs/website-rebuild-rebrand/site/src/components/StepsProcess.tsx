interface Step {
  number: string
  title: string
  description: string
}

interface StepsProcessProps {
  heading?: string
  steps: Step[]
  ctaText?: string
  ctaUrl?: string
}

export function StepsProcess({ heading, steps, ctaText, ctaUrl }: StepsProcessProps) {
  return (
    <div>
      {heading && (
        <div className="text-center mb-8">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-4">{heading}</h2>
          <div className="w-12 h-[3px] bg-gold-500 mx-auto" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 mt-8">
        {steps.map((step, i) => (
          <div key={step.number} className={`text-center md:text-left ${i < steps.length - 1 ? 'md:border-r md:border-cream-200/10 md:pr-6' : ''}`}>
            <span className="font-heading font-bold text-h2 text-gold-500 block mb-3">
              {step.number}
            </span>
            <h3 className="font-body font-semibold text-h4 text-cream-200 mb-2">
              {step.title}
            </h3>
            <p className="font-body text-body text-cream-200/80 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {ctaText && ctaUrl && (
        <div className="text-center mt-10">
          <a
            href={ctaUrl}
            className="inline-block px-9 py-4 bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
          >
            {ctaText}
          </a>
        </div>
      )}
    </div>
  )
}
