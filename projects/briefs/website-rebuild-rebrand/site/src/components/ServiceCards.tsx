import Link from 'next/link'

interface ServiceCardData {
  icon?: string
  title: string
  price: string
  description: string
  linkText: string
  linkUrl: string
}

interface ServiceCardsProps {
  heading?: string
  cards?: ServiceCardData[]
  /**
   * URL of the card to emphasise as the recommended option (R4 primary-money
   * emphasis). Trailing slashes are ignored when matching. Omit for no emphasis.
   */
  highlightUrl?: string
}

// Title is used as the link anchor text — include the "mole control"
// keyword for exact-match anchor signal (Zyppy 5x traffic study).
const defaultCards: ServiceCardData[] = [
  {
    title: 'Year-Round Mole Control',
    price: '$100/month',
    description: 'Our Total Mole Control Program keeps your yard protected all year. Regular visits, immediate response to new activity, and a report after every check.',
    linkText: 'Get Year-Round Protection',
    linkUrl: '/services/total-mole-control-program',
  },
  {
    title: 'One-Time Mole Removal',
    price: '$450 flat rate',
    description: 'A focused, one-month eradication program for properties under 1 acre. 4-5 weekly visits. If we don\'t catch a mole, you only pay the $150 setup fee.',
    linkText: 'Get One-Time Removal',
    linkUrl: '/services/one-time-mole-removal',
  },
  {
    title: 'Commercial Mole Control',
    price: 'Custom quote',
    description: 'Annual contracts for property managers, HOAs, sports facilities, and commercial grounds. Professional reporting, reliable scheduling.',
    linkText: 'Get a Commercial Quote',
    linkUrl: '/services/commercial-mole-control',
  },
]

export function ServiceCards({ heading, cards, highlightUrl }: ServiceCardsProps) {
  const items = cards && cards.length > 0 ? cards : defaultCards
  const norm = (u: string) => u.replace(/\/$/, '')

  return (
    <div>
      {heading && (
        <div className="text-center mb-8">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-4">{heading}</h2>
          <div className="w-12 h-[3px] bg-gold-500 mx-auto" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-8">
        {items.map((card) => {
          const isPrimary = highlightUrl ? norm(card.linkUrl) === norm(highlightUrl) : false
          return (
          <Link
            key={card.linkUrl}
            href={card.linkUrl}
            className={`relative block rounded-2xl p-6 transition-colors no-underline group ${
              isPrimary
                ? 'bg-white/10 ring-2 ring-gold-500 hover:bg-white/15'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {isPrimary && (
              <span className="absolute -top-3 left-6 bg-gold-500 text-blue-600 font-body font-semibold text-xs uppercase tracking-wide px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <h3 className="font-body font-semibold text-h4 text-cream-200 mb-2">
              {card.title}
            </h3>
            <p className="font-heading font-bold text-gold-500 text-xl mb-3">
              {card.price}
            </p>
            <p className="font-body text-body-lg text-cream-200/80 mb-4 leading-relaxed">
              {card.description}
            </p>
            <span className="font-body font-semibold text-sm text-gold-500 group-hover:text-gold-400">
              {card.linkText} &rarr;
            </span>
          </Link>
          )
        })}
      </div>
    </div>
  )
}
