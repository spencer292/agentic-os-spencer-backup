import Link from 'next/link'
import Image from 'next/image'

interface FooterColumn {
  title: string
  links: { label: string; url: string }[]
}

interface FooterProps {
  brandDescription?: string
  columns?: FooterColumn[]
  legalLinks?: { label: string; url: string }[]
  copyright?: string
  serviceArea?: string
  phone?: string
}

const defaultColumns: FooterColumn[] = [
  {
    title: 'Services',
    links: [
      { label: 'Year-Round Protection (TMCP)', url: '/services/total-mole-control-program' },
      { label: 'One-Time Removal', url: '/services/one-time-mole-removal' },
      { label: 'Commercial', url: '/services/commercial-mole-control' },
      { label: 'How It Works', url: '/how-it-works' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Got Moles', url: '/about' },
      { label: 'Reviews', url: '/reviews' },
      { label: 'FAQ', url: '/faq' },
      { label: 'Blog', url: '/blog' },
      { label: 'Contact', url: '/contact' },
    ],
  },
  {
    title: 'Service Areas',
    links: [
      { label: 'Seattle & King County', url: '/mole-control-seattle' },
      { label: 'Tacoma & Pierce County', url: '/mole-control-tacoma' },
      { label: 'Everett & Snohomish County', url: '/mole-control-everett' },
      { label: 'Olympia & Thurston County', url: '/mole-control-olympia' },
      { label: 'Bremerton & Kitsap County', url: '/mole-control-bremerton' },
      { label: 'All 77 Service Areas →', url: '/service-areas' },
    ],
  },
]

const defaultDescription =
  "Western Washington's mole-exclusive specialist. Veteran-owned. Chemical-free. Proven results."

export function Footer({ brandDescription, columns, legalLinks, copyright, serviceArea, phone }: FooterProps) {
  const cols = columns && columns.length > 0 ? columns : defaultColumns
  const desc = brandDescription || defaultDescription
  const area = serviceArea || 'Serving King, Pierce, Snohomish, Thurston & Kitsap Counties'
  const phoneNumber = phone || '(253) 750-0211'
  const legal = legalLinks && legalLinks.length > 0
    ? legalLinks
    : [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms of Service', url: '/terms' },
      ]
  const cr = copyright || 'Got Moles. All rights reserved. Veteran-Owned.'

  return (
    <footer className="bg-grass-800 text-cream-200">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Image
              src="/images/logo-cream.svg"
              alt="Got Moles"
              width={180}
              height={43}
              className="h-10 w-auto"
            />
            <p className="mt-3 text-sm font-body leading-relaxed text-cream-200/80">{desc}</p>
            <p className="mt-2 text-sm font-body text-cream-200/65">{area}</p>
            <a
              href={`tel:${phoneNumber.replace(/[^0-9+]/g, '')}`}
              className="mt-3 inline-block text-gold-500 font-heading font-bold no-underline hover:text-gold-400"
            >
              {phoneNumber}
            </a>
          </div>

          {cols.map((section) => (
            <div key={section.title}>
              <h3 className="text-small font-body font-semibold uppercase tracking-widest text-cream-200/65 mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.url}>
                    <Link
                      href={link.url}
                      className="block py-1.5 text-sm font-body text-cream-200/80 hover:text-gold-500 transition-colors no-underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-cream-200/50">
            &copy; {new Date().getFullYear()} {cr}
          </p>
          <div className="flex gap-4">
            {legal.map((link) => (
              <Link
                key={link.url}
                href={link.url}
                className="text-small text-cream-200/50 hover:text-cream-200 no-underline"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
