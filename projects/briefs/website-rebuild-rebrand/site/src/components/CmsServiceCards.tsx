import Link from 'next/link'
import { getAllServices } from '@/lib/payload'

interface ServiceCardsProps {
  heading?: string
}

interface FallbackCard {
  title: string
  price: string
  description: string
  linkText: string
  linkUrl: string
}

const fallbackCards: FallbackCard[] = [
  {
    title: 'Year-Round Protection',
    price: '$100/month',
    description:
      'Our Total Mole Control Program keeps your yard protected all year. Regular visits, immediate response to new activity, and a report after every check.',
    linkText: 'Get Year-Round Protection',
    linkUrl: '/services/total-mole-control-program',
  },
  {
    title: 'One-Time Removal',
    price: '$450 flat rate',
    description:
      "A focused, one-month eradication program for properties under 1 acre. 4-5 weekly visits. If we don't catch a mole, you only pay the $150 setup fee.",
    linkText: 'Get One-Time Removal',
    linkUrl: '/services/one-time-mole-removal',
  },
  {
    title: 'Commercial',
    price: 'Custom quote',
    description:
      'Annual contracts for property managers, HOAs, sports facilities, and commercial grounds. Professional reporting, reliable scheduling.',
    linkText: 'Get a Commercial Quote',
    linkUrl: '/services/commercial-mole-control',
  },
]

export async function CmsServiceCards({ heading }: ServiceCardsProps) {
  let items: { title: string; price: string; description: string; linkText: string; linkUrl: string }[] =
    []

  try {
    const services = await getAllServices()

    if (services && services.length > 0) {
      items = services.map((svc) => ({
        title: svc.name as string,
        price: ((svc.pricing as { price?: string } | undefined)?.price) || '',
        description: svc.summary as string,
        linkText: `Learn More About ${svc.name}`,
        linkUrl: `/services/${svc.slug as string}`,
      }))
    }
  } catch {
    // Payload not available — fall through to hardcoded defaults
  }

  if (items.length === 0) {
    items = fallbackCards
  }

  return (
    <div>
      {heading && (
        <div className="text-center mb-8">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-4">{heading}</h2>
          <div className="w-12 h-[3px] bg-gold-500 mx-auto" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-8">
        {items.map((card) => (
          <Link
            key={card.linkUrl}
            href={card.linkUrl}
            className="block bg-white border border-neutral-200 p-6 hover:border-gold-500 transition-colors no-underline group"
          >
            <h3 className="font-body font-semibold text-h4 text-neutral-800 mb-2">
              {card.title}
            </h3>
            <p className="font-heading font-bold text-gold-500 text-xl mb-3">{card.price}</p>
            <p className="font-body text-body text-neutral-600 mb-4 leading-relaxed">
              {card.description}
            </p>
            <span className="font-body font-semibold text-sm text-gold-500 group-hover:text-gold-600">
              {card.linkText} &rarr;
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
