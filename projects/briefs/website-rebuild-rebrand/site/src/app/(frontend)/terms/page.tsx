import type { Metadata } from 'next'
import { Section } from '@/components/Section'
import { PageHero } from '@/components/PageHero'
import { CTABlock } from '@/components/blocks/CTABlock'
import { GEODefinitionBlock } from '@/components/blocks/GEODefinitionBlock'
import { JsonLd, breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Got Moles terms of service. Terms and conditions for using our website and mole control services.',
  alternates: { canonical: 'https://got-moles.com/terms/' },
  openGraph: {
    title: 'Terms of Service | Got Moles',
    description: 'Got Moles terms of service. Terms and conditions for using our website and mole control services.',
    url: 'https://got-moles.com/terms/',
    images: [{ url: '/images/og-default.webp', width: 1200, height: 630, alt: 'Got Moles — Professional Mole Control in Western Washington' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Got Moles',
    description: 'Got Moles terms of service. Terms and conditions for using our website and mole control services.',
    images: ['/images/og-default.webp'],
  },
}

export default function TermsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Terms of Service', url: '/terms/' }])} />

      <PageHero
        heading="Terms of Service"
        subheading="Terms and conditions for using our website and mole control services. Last updated April 30, 2026."
        image="/images/hero-faq.webp"
        imageAlt="Got Moles team — terms of service"
        height="70vh"
        trustStrip={['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids']}
      />

      <GEODefinitionBlock
        block={{
          content:
            'These terms govern your use of the Got Moles website and the mole control services Got Moles provides in Western Washington. By using the site or booking service, you agree to fair use, accurate information, and the standard terms outlined below. Service warranties and pricing are programme-specific and confirmed at booking.',
        }}
      />

      <Section background="grass-alt">
        <div className="max-w-[65ch] mx-auto">
          <div className="space-y-6 font-body text-body text-cream-200/90 leading-relaxed">
            <p>
              These terms govern your use of the Got Moles website (got-moles.com) and the mole control
              services provided by Got Moles, operated by Spencer Hill, based in Enumclaw, Washington.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Services</h2>
            <p>
              Got Moles provides professional mole control services in Western Washington. All services
              include a property assessment performed by the technician on the first booked service visit,
              and are limited to mole control only. We do not provide general pest control services.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Service Area</h2>
            <p>
              Got Moles serves residential and commercial properties across King, Pierce, Thurston, and
              Snohomish Counties in Washington State. Service availability is confirmed during scheduling.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Pricing and Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>One-Time Mole Removal:</strong> $450 flat rate for residential properties under 1 acre.
                A $150 setup fee is collected at the time of service. The remaining balance is due upon completion.
              </li>
              <li>
                <strong>Total Mole Control Program (TMCP):</strong> $100 per month with a 12-month minimum commitment.
                Billed monthly. Cancellation is available after 12 months with 30 days written notice.
              </li>
              <li>
                <strong>Commercial Services:</strong> Custom-quoted following a site inspection. Terms are specified
                in individual service agreements.
              </li>
            </ul>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Guarantee</h2>
            <p>
              The one-time mole removal program includes a results guarantee: if no moles are caught during
              the service period, the client pays only the $150 setup fee. This guarantee applies to the
              one-time removal program only and does not apply to the TMCP or commercial services.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Property Access</h2>
            <p>
              By scheduling service, you authorize Got Moles technicians to access your property for the
              purpose of mole control. Technicians may complete service visits without the homeowner present.
              Equipment will be placed in active mole tunnels on your property and removed at the end of service.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Limitations</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Got Moles controls moles only. We are not responsible for damage caused by other animals or pests.</li>
              <li>Mole re-invasion from adjacent properties is a natural occurrence. One-time removal does not guarantee against future mole activity.</li>
              <li>Service timelines depend on mole activity levels and weather conditions.</li>
            </ul>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Website Use</h2>
            <p>
              The content on this website is for informational purposes. While we strive for accuracy,
              we make no warranties about the completeness or reliability of the information provided.
              Pricing and service details are subject to change.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Intellectual Property</h2>
            <p>
              All content on this website, including text, images, logos, and design, is the property of
              Got Moles and may not be reproduced without written permission.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Governing Law</h2>
            <p>
              These terms are governed by the laws of the State of Washington. Any disputes will be
              resolved in the courts of King County, Washington.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Contact</h2>
            <p>
              Got Moles<br />
              718 Griffin Ave #905<br />
              Enumclaw, WA 98022<br />
              Phone: <a href="tel:+12537500211" className="text-gold-500 font-semibold no-underline">(253) 750-0211</a>
            </p>
          </div>
        </div>
      </Section>

      <CTABlock
        block={{
          heading: 'Questions about our terms?',
          body: 'Talk to us before you book — we keep things straightforward and want you to know exactly what you\'re signing up for.',
          buttonText: 'CALL (253) 750-0211',
          buttonUrl: 'tel:+12537500211',
          background: 'gradient',
        }}
      />
    </>
  )
}
