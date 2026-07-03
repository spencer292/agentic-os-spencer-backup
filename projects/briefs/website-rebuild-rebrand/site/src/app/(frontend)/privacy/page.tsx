import type { Metadata } from 'next'
import { Section } from '@/components/Section'
import { PageHero } from '@/components/PageHero'
import { CTABlock } from '@/components/blocks/CTABlock'
import { GEODefinitionBlock } from '@/components/blocks/GEODefinitionBlock'
import { JsonLd, breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Got Moles privacy policy. How we collect, use, and protect your personal information.',
  alternates: { canonical: 'https://got-moles.com/privacy/' },
  openGraph: {
    title: 'Privacy Policy | Got Moles',
    description: 'Got Moles privacy policy. How we collect, use, and protect your personal information.',
    url: 'https://got-moles.com/privacy/',
    images: [{ url: '/images/og-default.webp', width: 1200, height: 630, alt: 'Got Moles — Professional Mole Control in Western Washington' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Got Moles',
    description: 'Got Moles privacy policy. How we collect, use, and protect your personal information.',
    images: ['/images/og-default.webp'],
  },
}

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Privacy Policy', url: '/privacy/' }])} />

      <PageHero
        heading="Privacy Policy"
        subheading="How we collect, use, and protect your information. Last updated April 30, 2026."
        image="/images/hero-faq.webp"
        imageAlt="Got Moles team — privacy policy"
        height="70vh"
        trustStrip={['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids']}
      />

      <GEODefinitionBlock
        block={{
          content:
            'Got Moles collects only the information you provide directly — name, email, phone, and property address — to schedule and deliver mole control service in Western Washington. We do not sell or share your data with third parties for marketing. You can request access, correction, or deletion at any time by calling (253) 750-0211.',
        }}
      />

      <Section background="grass-alt">
        <div className="max-w-[65ch] mx-auto">
          <div className="space-y-6 font-body text-body text-cream-200/90 leading-relaxed">
            <p>
              Got Moles (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website got-moles.com.
              This page explains what information we collect, how we use it, and your rights regarding that information.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Information We Collect</h2>
            <p>We collect information you provide directly when you:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fill out our contact form (name, email, phone number, property address, message)</li>
              <li>Call or text our business phone number</li>
              <li>Take our mole assessment quiz on score.got-moles.com</li>
            </ul>
            <p>We also collect standard website analytics data through Google Analytics, including pages visited, time on site, device type, and approximate location. This data is anonymized and used to improve our website.</p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To respond to your inquiry and schedule service</li>
              <li>To provide the mole control services you request</li>
              <li>To send service reports and follow-up communications</li>
              <li>To improve our website and services</li>
            </ul>
            <p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Cookies and Tracking</h2>
            <p>
              Our website uses cookies for Google Analytics and may use cookies for advertising platforms
              (Google Ads, Meta) to measure the effectiveness of our advertising. You can disable cookies
              in your browser settings at any time.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Third-Party Services</h2>
            <p>We use the following third-party services that may process your data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Google Analytics (website analytics)</li>
              <li>Google Ads (advertising)</li>
              <li>Meta/Facebook (advertising)</li>
              <li>ScoreApp (mole assessment quiz at score.got-moles.com)</li>
              <li>Vercel (website hosting)</li>
            </ul>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">SMS Communications &amp; Mobile Privacy</h2>
            <p>
              Got Moles? sends text message updates and responses to consumer customers about pricing
              and products offered at www.got-moles.com.
            </p>
            <p>
              Mobile information will not be shared with third parties or affiliates for marketing or
              promotional purposes. Got Moles? respects your privacy. We use information you provide
              to send and respond to your mobile messages. This includes sharing it with platform
              providers, phone companies, and other vendors who help us deliver messages. We won&apos;t
              share mobile information with third parties for marketing. Text messaging originator
              opt-in data and consent are exempt from this. We may disclose information to satisfy
              legal, regulatory, or governmental requests, avoid liability, or protect our rights or
              property. This policy applies to your use of the Text Message Service and doesn&apos;t
              modify our general Privacy Policy, which may govern our relationship with you in other
              contexts.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">SMS Terms of Service</h2>
            <p>
              Got Moles? sends text message updates and responses to consumer customers about pricing
              and products offered at www.got-moles.com.
            </p>
            <p>
              When you opt in to the service, we may send you a message to confirm your signup.
              Message and data rates may apply. Message frequency varies. Text &quot;HELP&quot; for help.
              Text &quot;STOP&quot; to cancel. You can cancel this service at any time. Just text
              &quot;STOP&quot; to{' '}
              <a href="tel:+12537500211" className="text-gold-500 font-semibold no-underline">(253) 750-0211</a>.
              After you send the message &quot;STOP&quot; to us, we will reply to confirm that you have
              been unsubscribed. After this, you will no longer receive messages from us. If you want
              to join again, just sign up as you did the first time, and we will start sending you
              messages again. If at any time you forget what keywords are supported, just text
              &quot;HELP&quot; to{' '}
              <a href="tel:+12537500211" className="text-gold-500 font-semibold no-underline">(253) 750-0211</a>.
              After you send the message &quot;HELP&quot; to us, we will respond with instructions on
              how to use our service and how to unsubscribe.
            </p>
            <p>
              <strong>Participating carriers:</strong> AT&amp;T, Verizon Wireless, Sprint, T-Mobile,
              U.S. Cellular, Boost Mobile, MetroPCS, Virgin Mobile, Alaska Communications Systems
              (ACS), Appalachian Wireless (EKN), Bluegrass Cellular, Cellular One of East Central, IL
              (ECIT), Cellular One of Northeast Pennsylvania, Cricket, Coral Wireless (Mobi PCS), COX,
              Cross, Element Mobile (Flat Wireless), Epic Touch (Elkhart Telephone), GCI, Golden
              State, Hawkeye (Chat Mobility), Hawkeye (NW Missouri), Illinois Valley Cellular, Inland
              Cellular, iWireless (Iowa Wireless), Keystone Wireless (Immix Wireless/PC Man), Mosaic
              (Consolidated or CTC Telecom), Nex-Tech Wireless, NTelos, Panhandle Communications,
              Pioneer, Plateau (Texas RSA 3 Ltd), Revol, RINA, Simmetry (TMP Corporation), Thumb
              Cellular, Union Wireless, United Wireless, Viaero Wireless, and West Central (WCC or
              5 Star Wireless). Carriers are not liable for delayed or undelivered messages. If you
              have any questions regarding privacy, please refer to the sections above in this Privacy
              Policy.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Data Security</h2>
            <p>
              We take reasonable measures to protect your personal information. Our website uses HTTPS
              encryption. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Your Rights</h2>
            <p>You may request to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Delete your personal information</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p>
              To make any of these requests, contact us at{' '}
              <a href="tel:+12537500211" className="text-gold-500 font-semibold no-underline">(253) 750-0211</a> or through our{' '}
              <a href="/contact" className="text-gold-500 font-semibold no-underline">contact form</a>.
            </p>

            <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 pt-4">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will be posted on this page
              with an updated revision date.
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
          heading: 'Questions about your privacy?',
          body: "We're happy to walk you through how we handle your information. Give us a call.",
          buttonText: 'CALL (253) 750-0211',
          buttonUrl: 'tel:+12537500211',
          background: 'gradient',
        }}
      />
    </>
  )
}
