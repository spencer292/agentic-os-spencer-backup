import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Design Test — City Page (Sammamish) | New Principles',
  robots: 'noindex, nofollow',
}

/* ─── Self-contained test city page — Sammamish ─── */
/* Applies all updated design principles: grass-dominant, no dividers, */
/* rounded-2xl buttons, progressive disclosure, tonal section shifts, */
/* trust strip inside hero, single CTA, generous spacing */

function TestHero() {
  return (
    <section className="relative min-h-[70vh] flex flex-col overflow-hidden bg-grass-600">
      <Image
        src="/images/hero-king-county.webp"
        alt="Professional mole control in Sammamish, Washington"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(21,54,53,0.6) 0%, rgba(21,54,53,0.15) 30%, rgba(21,54,53,0.15) 50%, rgba(21,54,53,0.5) 70%, rgba(21,54,53,0.95) 100%)' }} />

      {/* Hero text */}
      <div className="relative z-10 mt-auto w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pb-8 lg:pb-12">
        <div className="max-w-2xl">
          <h1 className="font-heading font-bold text-display uppercase tracking-tight text-cream-200 leading-tight mb-5" style={{ textWrap: 'balance' }}>
            Mole Control in Sammamish
          </h1>
          <p className="font-body text-body-lg text-cream-200/85 mb-8 leading-relaxed max-w-[55ch]">
            Large lots, mature landscaping, and some of the richest topsoil on the Eastside. That combination is exactly why Sammamish properties attract Townsend&apos;s moles year after year.
          </p>
          <a
            href="tel:+12537500211"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
          >
            Call (253) 750-0211
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-600/30">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
              </svg>
            </span>
          </a>
        </div>
      </div>

      {/* Trust strip — inside hero */}
      <div className="relative z-10 w-full" style={{ background: 'linear-gradient(to bottom, transparent, rgba(24,66,65,0.85) 30%, #184241)' }}>
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex justify-center gap-1 mb-3" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }, (_, i) => (
              <svg key={i} className="w-5 h-5 text-gold-500 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <p className="text-center font-body text-body-lg text-cream-200/90">
            {['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'].map((item, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-2 text-cream-200/40">&middot;</span>}
                <span className="font-semibold">{item}</span>
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}

function TestGeoDefinition() {
  return (
    <section className="text-cream-200 py-10 lg:py-16" style={{ background: '#184241' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-[65ch] mx-auto">
          <p id="geo-definition" className="font-body text-body-lg text-cream-200/90 leading-relaxed">
            Got Moles provides professional mole control in Sammamish, Washington. As a mole-exclusive specialist serving Western Washington, we cover Sammamish and surrounding Eastside communities with chemical-free trapping methods that keep your yard safe for the kids and dogs who actually use it. Call (253) 750-0211 for a free quote.
          </p>
        </div>
      </div>
    </section>
  )
}

function TestCommunityPride() {
  return (
    <section className="text-cream-200 py-16 lg:py-32" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-[65ch] mx-auto">
          <p className="font-body text-body-lg lg:text-xl text-cream-200/85 leading-relaxed italic">
            Sammamish sits on a forested plateau east of Lake Sammamish, where families settle for the top-rated schools, miles of walking trails, and a pace of life that feels a world away from Seattle&apos;s rush. Beaver Lake Park, Pine Lake, and the Sammamish Commons give residents the kind of outdoor access most suburbs only promise.
          </p>
        </div>
      </div>
    </section>
  )
}

function TestWhyMolesThrive() {
  return (
    <section className="text-cream-200 py-16 lg:py-32" style={{ background: 'linear-gradient(to bottom, #153635, #184241)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-[65ch] mx-auto">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-8" style={{ textWrap: 'balance' }}>
            Why Moles Thrive in Sammamish
          </h2>
          <p className="font-body text-body-lg text-cream-200/85 leading-relaxed mb-6">
            The Sammamish Plateau sits on a layer of glacial till that traps moisture close to the surface, keeping the topsoil soft and earthworm-rich in every season. That&apos;s a year-round buffet for Townsend&apos;s moles.
          </p>
          <details className="group">
            <summary className="font-body text-sm text-gold-500 cursor-pointer hover:text-gold-400 list-none inline-flex items-center gap-1">
              Read more about Sammamish mole conditions
              <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
              </svg>
            </summary>
            <div className="mt-4 font-body text-body-lg text-cream-200/75 leading-relaxed space-y-4">
              <p>
                Neighborhoods backing onto Beaver Lake Park, the Sammamish River corridor, and the extensive greenbelt network face continuous reinvasion — clear one mole and another follows the existing tunnel system within weeks.
              </p>
              <p>
                The large lot sizes common in Klahanie, Sahalee, and Pine Lake give moles more territory to establish complex tunnel networks. Properties over half an acre with mature landscaping are the highest-risk homes in our service area.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}

function TestNeighborhoods() {
  return (
    <section className="text-cream-200 py-16 lg:py-32" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-[65ch] mx-auto">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-8" style={{ textWrap: 'balance' }}>
            Moles in Sammamish Neighborhoods
          </h2>
          <p className="font-body text-body-lg text-cream-200/85 leading-relaxed mb-6">
            We&apos;ve served homes across every Sammamish neighborhood. The Plateau&apos;s consistent soil conditions mean no area is immune, but some see heavier activity than others.
          </p>
          <details className="group">
            <summary className="font-body text-sm text-gold-500 cursor-pointer hover:text-gold-400 list-none inline-flex items-center gap-1">
              See neighborhood details
              <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
              </svg>
            </summary>
            <div className="mt-4 font-body text-body-lg text-cream-200/75 leading-relaxed space-y-4">
              <p>
                <strong className="text-cream-200">Klahanie & Sahalee:</strong> Large lots backing onto protected forest. The highest reinvasion rate in our service area. We recommend ongoing protection here rather than one-time removal.
              </p>
              <p>
                <strong className="text-cream-200">Pine Lake & Beaver Lake:</strong> Proximity to water keeps soil consistently moist. These neighborhoods see activity year-round with peaks in spring and fall.
              </p>
              <p>
                <strong className="text-cream-200">Sammamish Commons area:</strong> Newer developments with smaller lots and less mature landscaping see less severe problems, but the shared greenbelt means moles travel between properties easily.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}

function TestServices() {
  const cards = [
    {
      title: 'Total Mole Control Program',
      price: '$100/month',
      description: 'Year-round protection for Sammamish properties. Regular monitoring, immediate response to new activity, and a written report after every visit.',
      linkText: 'Learn About TMCP',
      linkUrl: '/services/total-mole-control-program',
    },
    {
      title: 'One-Time Removal',
      price: '$450 flat rate',
      description: "One-month eradication for properties under 1 acre. 4-5 weekly visits. If we don't catch a mole, you only pay the $150 setup fee.",
      linkText: 'Get One-Time Removal',
      linkUrl: '/services/one-time-mole-removal',
    },
    {
      title: 'Commercial',
      price: 'Custom quote',
      description: 'Annual contracts for HOAs, property managers, and commercial grounds in the Sammamish area.',
      linkText: 'Get a Commercial Quote',
      linkUrl: '/services/commercial-mole-control',
    },
  ]

  return (
    <section className="text-cream-200 py-16 lg:py-32" style={{ background: 'linear-gradient(to bottom, #153635, #133634)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight mb-12 text-center" style={{ textWrap: 'balance' }}>
          How We Help Sammamish Homeowners
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card) => (
            <a key={card.linkUrl} href={card.linkUrl} className="block bg-white/5 p-6 lg:p-8 rounded-2xl hover:bg-white/10 transition-colors no-underline">
              <h3 className="font-body font-semibold text-h4 lg:text-2xl text-cream-200 mb-2">{card.title}</h3>
              <p className="font-heading font-bold text-gold-500 text-xl mb-3">{card.price}</p>
              <p className="font-body text-body-lg text-cream-200/75 mb-5 leading-relaxed">{card.description}</p>
              <span className="inline-flex items-center gap-1 font-body font-semibold text-sm text-gold-500">
                {card.linkText}
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestLocalTip() {
  return (
    <section className="text-cream-200 py-16 lg:py-32" style={{ background: 'linear-gradient(to bottom, #133634, #184241)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-[65ch] mx-auto bg-white/5 rounded-2xl p-6 lg:p-8">
          <p className="font-heading font-bold text-h4 lg:text-2xl text-gold-500 mb-3">Local Tip</p>
          <p className="font-body text-body-lg text-cream-200/85 leading-relaxed">
            If your property borders the forested edges of Beaver Lake Park or the Sammamish River Trail, moles will recolonize cleared areas within weeks. Ongoing protection works better than one-time removal for properties near green corridors.
          </p>
        </div>
      </div>
    </section>
  )
}

function TestHowItWorks() {
  const steps = [
    { title: 'Call', description: 'Tell us about your Sammamish property' },
    { title: 'Inspect', description: 'We assess the mole activity on-site' },
    { title: 'Trap', description: 'Professional equipment on active tunnels' },
    { title: 'Report', description: 'Clear results after every visit' },
  ]

  return (
    <section className="text-cream-200 py-16 lg:py-32" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight mb-12" style={{ textWrap: 'balance' }}>
          How It Works
        </h2>
        <div className="space-y-8 max-w-3xl">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-5">
              <span className="flex-shrink-0 w-3 h-3 rounded-full bg-gold-500 mt-2" aria-hidden="true" />
              <div>
                <h3 className="font-heading font-bold text-h3 text-cream-200 uppercase tracking-tight">{step.title}</h3>
                <p className="font-body text-body-lg text-cream-200/80 mt-1 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <a href="/how-it-works" className="inline-flex items-center gap-1 font-body text-sm text-gold-500 hover:text-gold-400">
            See the full process
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}

function TestFAQ() {
  const faqs = [
    { q: 'Why do moles keep coming back to my Sammamish property even after I had them removed?', a: "The Sammamish Plateau is surrounded by forest and parkland that serves as a constant source of new moles. When one is removed, another follows the existing tunnel network in. That's why many Sammamish homeowners choose ongoing protection rather than one-time treatment." },
    { q: 'Is the trapping safe for my kids and pets who play in the yard?', a: "Completely. Our traps are placed below ground in active tunnels — they're not visible or accessible from the surface. No chemicals, no poisons, nothing that touches the grass your family walks on." },
    { q: 'My neighbor has moles too. Should we coordinate?', a: 'Absolutely. Moles move between adjacent properties through shared tunnel systems. Treating neighboring yards together is more effective and prevents the back-and-forth migration we see in Klahanie and Sahalee cul-de-sacs.' },
    { q: 'I just spent thousands on new landscaping. How quickly can you protect it?', a: "We understand the investment — Sammamish homeowners routinely put $15,000+ into their landscaping. We typically schedule inspections within two business days. The sooner we start, the less damage accumulates." },
    { q: 'Are moles worse in certain seasons here on the Plateau?', a: "Activity peaks in spring and fall when soil moisture is highest and earthworms are most active near the surface. But the Plateau's hardpan layer keeps moisture trapped year-round, so we see moles in every month." },
    { q: "What's the difference between your monthly program and a one-time visit?", a: 'One-time removal handles what\'s there now. The Total Mole Control Program provides year-round monitoring and trapping, which is what we recommend for Plateau properties that border natural areas — because new moles will move in.' },
  ]

  return (
    <section className="text-cream-200 py-16 lg:py-32" style={{ background: 'linear-gradient(to bottom, #153635, #184241)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-12" style={{ textWrap: 'balance' }}>
            Sammamish Mole Control FAQ
          </h2>
          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <details key={i} className="group border-b border-cream-200/10 py-5">
                <summary className="cursor-pointer font-body font-semibold text-body-lg text-cream-200 flex justify-between items-center gap-4">
                  {faq.q}
                  <svg className="w-4 h-4 text-gold-500 shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                  </svg>
                </summary>
                <p className="font-body text-body-lg text-cream-200/75 leading-relaxed mt-3 pr-8">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TestNearby() {
  return (
    <section className="text-cream-200 py-10 lg:py-16" style={{ background: '#184241' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 text-center">
        <p className="font-body text-sm text-cream-200/65 mb-3">Also serving nearby:</p>
        <div className="flex justify-center gap-6">
          <a href="/mole-control-issaquah/" className="font-body font-semibold text-gold-500 hover:text-gold-400 no-underline">Issaquah</a>
          <a href="/mole-control-bellevue/" className="font-body font-semibold text-gold-500 hover:text-gold-400 no-underline">Bellevue</a>
          <a href="/service-areas" className="font-body font-semibold text-gold-500 hover:text-gold-400 no-underline">All Service Areas</a>
        </div>
      </div>
    </section>
  )
}

function TestCTA() {
  return (
    <section className="py-16 lg:py-32 text-cream-200" style={{ background: 'linear-gradient(to bottom, #182034, #8F2A2D)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <h2 className="font-heading text-h2 uppercase tracking-tight mb-4" style={{ textWrap: 'balance' }}>
              Ready for Mole-Free Living in Sammamish?
            </h2>
            <p className="font-body text-body-lg text-cream-200/90 mb-6 leading-relaxed">
              Call (253) 750-0211 or fill out the form. We&apos;ll get back to you within one business day.
            </p>
            <a href="tel:+12537500211" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors">
              Call (253) 750-0211
            </a>
            <p className="font-body text-small text-cream-200/65 mt-4">Free inspection. No obligation.</p>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Name', type: 'text', placeholder: 'Your name' },
              { label: 'Phone', type: 'tel', placeholder: '(253) 000-0000' },
              { label: 'Zip Code', type: 'text', placeholder: '98074' },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-body font-semibold text-cream-200/80 mb-1">{field.label}</label>
                <input type={field.type} placeholder={field.placeholder} className="w-full h-12 px-4 bg-transparent border border-cream-200/30 rounded-2xl text-cream-200 font-body text-body placeholder:text-cream-200/40 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-body font-semibold text-cream-200/80 mb-1">How can we help?</label>
              <select className="w-full h-12 px-4 bg-transparent border border-cream-200/30 rounded-2xl text-cream-200 font-body text-body focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20">
                <option value="">Select...</option>
                <option value="tmcp">Year-Round Protection (TMCP)</option>
                <option value="one-time">One-Time Mole Removal</option>
                <option value="commercial">Commercial Service</option>
                <option value="other">Something Else</option>
              </select>
            </div>
            <button className="w-full h-12 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors">
              Request Free Inspection
            </button>
            <p className="text-xs font-body text-cream-200/40 text-center">
              Every service comes with a guarantee. We stand behind our results.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Page ─── */

export default function TestCityPage() {
  return (
    <>
      <TestHero />
      <TestGeoDefinition />
      <TestCommunityPride />
      <TestWhyMolesThrive />
      <TestNeighborhoods />
      <TestServices />
      <TestLocalTip />
      <TestHowItWorks />
      <TestFAQ />
      <TestNearby />
      <TestCTA />
    </>
  )
}
