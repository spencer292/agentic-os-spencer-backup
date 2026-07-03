import { Metadata } from 'next'
import Image from 'next/image'
import TestHeader from './TestHeader'

export const metadata: Metadata = {
  title: 'Design Test — Homepage | New Principles',
  robots: 'noindex, nofollow',
}

/* ─── Self-contained test components ─── */
/* These are isolated from production. Nothing here touches the CMS-driven site. */

/* Skull watermark removed for now — revisit placement with Moni */

function TestHero() {
  return (
    <section className="relative min-h-[100vh] flex flex-col overflow-hidden bg-grass-600">
      <Image
        src="/images/hero-lawn.webp"
        alt="Mole damage on a residential lawn in Western Washington"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      {/* Gradient overlay — dark top (header) + clear middle (image) + dark bottom (text) */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(21,54,53,0.6) 0%, rgba(21,54,53,0.15) 30%, rgba(21,54,53,0.15) 50%, rgba(21,54,53,0.5) 70%, rgba(21,54,53,0.95) 100%)' }} />

      {/* Hero text — sits in lower portion */}
      <div className="relative z-10 mt-auto w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pb-8 lg:pb-12">
        <div className="max-w-2xl">
          <h1 className="font-heading font-bold text-display uppercase tracking-tight text-cream-200 leading-tight mb-5" style={{ textWrap: 'balance' }}>
            Your Lawn Deserves Better Than Moles. We Make Sure It Gets It.
          </h1>

          <p className="font-body text-body-lg text-cream-200/85 mb-8 leading-relaxed">
            Got Moles is Western Washington&apos;s mole-exclusive specialist since 2017. No chemicals. No guesswork. Just results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
            >
              See How It Works
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-600/30">
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Trust strip — sits at the very bottom of the hero, over the photo */}
      <div className="relative z-10 w-full" style={{ background: 'linear-gradient(to bottom, transparent, rgba(24,66,65,0.85) 30%, #184241)' }}>
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8 relative overflow-hidden">

          <div className="relative z-10">
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
      </div>
    </section>
  )
}

function TestEmpathy() {
  return (
    <section className="relative text-cream-200 py-16 lg:py-32 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-display uppercase tracking-tight mb-8" style={{ textWrap: 'balance' }}>
            You&apos;ve Tried Everything.<br />The Moles Keep Winning.
          </h2>
          <p className="font-body text-body-lg text-cream-200/85 mb-6 leading-relaxed">
            You&apos;ve stomped down the mounds. Bought traps from the hardware store. Maybe even called a pest company that said they&apos;d handle it. And the moles came back.
          </p>
          <p className="font-body text-body-lg text-cream-200/80 mb-6 leading-relaxed">
            You&apos;re not doing anything wrong. Moles are just harder to deal with than most people realize. General pest companies treat them as an afterthought. DIY traps miss more than they catch. And every week the damage spreads further into the lawn you&apos;ve spent real money maintaining.
          </p>
          <p className="font-body text-body-lg text-cream-200 font-semibold mb-10">
            That&apos;s where we come in.
          </p>
          <a
            href="/how-it-works"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
          >
            See How It Works
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-600/30">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}

function TestServiceCards() {
  const cards = [
    {
      title: 'Year-Round Protection',
      price: '$100/month',
      description: 'Our Total Mole Control Program keeps your yard protected all year. Regular visits, immediate response to new activity, and a report after every check.',
      linkText: 'Get Year-Round Protection',
      linkUrl: '/services/total-mole-control-program',
    },
    {
      title: 'One-Time Removal',
      price: '$450 flat rate',
      description: "A focused, one-month eradication program for properties under 1 acre. 4-5 weekly visits. If we don't catch a mole, you only pay the $150 setup fee.",
      linkText: 'Get One-Time Removal',
      linkUrl: '/services/one-time-mole-removal',
    },
    {
      title: 'Commercial',
      price: 'Custom quote',
      description: 'Annual contracts for property managers, HOAs, sports facilities, and commercial grounds. Professional reporting, reliable scheduling.',
      linkText: 'Get a Commercial Quote',
      linkUrl: '/services/commercial-mole-control',
    },
  ]

  return (
    <section className="text-cream-200 py-16 lg:py-32" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight mb-12 text-center" style={{ textWrap: 'balance' }}>
          One Problem. Three Ways We Solve It.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card) => (
            <a
              key={card.linkUrl}
              href={card.linkUrl}
              className="block bg-white/5 p-6 lg:p-8 rounded-2xl hover:bg-white/10 transition-colors no-underline"
            >
              <h3 className="font-body font-semibold text-h4 lg:text-2xl text-cream-200 mb-2">
                {card.title}
              </h3>
              <p className="font-heading font-bold text-gold-500 text-xl mb-3">
                {card.price}
              </p>
              <p className="font-body text-body-lg text-cream-200/75 mb-5 leading-relaxed">
                {card.description}
              </p>
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

function TestHowItWorks() {
  const steps = [
    {
      title: 'You Call Us',
      summary: "Tell us what's happening. We'll schedule an inspection, usually within 2 business days.",
      detail: "We'll ask a few questions about your property and schedule an inspection. No pressure. No upsell. Just a quick conversation so we understand your situation.",
    },
    {
      title: 'We Inspect Your Property',
      summary: 'A Got Moles technician walks your entire yard, identifies active mole runs, and builds a trapping strategy specific to your property.',
      detail: "This isn't a drive-by assessment. We look at fresh mounds, soil displacement, and entry patterns. From there, we build a trapping strategy tailored to your yard.",
    },
    {
      title: 'We Get to Work',
      summary: 'Professional-grade equipment goes in on active tunnels. We return weekly to check, adjust, and respond to mole activity.',
      detail: 'All methods are chemical-free. We use professional traps placed in active tunnels. We return weekly to check traps, adjust placement, and respond to new activity.',
    },
    {
      title: 'You See the Results',
      summary: 'After every visit, you get a clear report on what we found and what we did. No guessing. No wondering.',
      detail: 'We provide written reports after every service visit. If new activity appears between scheduled visits, we come back at no extra charge.',
    },
  ]

  return (
    <section className="relative text-cream-200 py-16 lg:py-32 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #153635, #184241)' }}>

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight mb-12" style={{ textWrap: 'balance' }}>
          How It Works
        </h2>
        <div className="space-y-10 max-w-3xl">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-5">
              <span className="flex-shrink-0 w-3 h-3 rounded-full bg-gold-500 mt-2" aria-hidden="true" />
              <div>
                <h3 className="font-heading font-bold text-h3 text-cream-200 uppercase tracking-tight">
                  {step.title}
                </h3>
                <p className="font-body text-body-lg text-cream-200/80 mt-2 leading-relaxed">
                  {step.summary}
                </p>
                <details className="mt-3 group">
                  <summary className="font-body text-sm text-gold-500 cursor-pointer hover:text-gold-400 list-none flex items-center gap-1">
                    Learn more
                    <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                    </svg>
                  </summary>
                  <p className="font-body text-body-lg text-cream-200/70 mt-2 leading-relaxed">
                    {step.detail}
                  </p>
                </details>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-14">
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
          >
            Schedule Your Free Inspection
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-600/30">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
              </svg>
            </span>
          </a>
          <p className="font-body text-small text-cream-200/65 mt-3">
            Chemical-free &middot; Proven results &middot; Most yards cleared in one month
          </p>
        </div>
      </div>
    </section>
  )
}

function TestFeatureGrid() {
  const items = [
    {
      title: 'Moles Are All We Do',
      description: "We don't spray for ants. We don't chase rats. We do one thing and we've built our entire company around doing it better than anyone. That singular focus is why it works.",
    },
    {
      title: 'Veteran-Owned. Community-Built.',
      description: 'Spencer Hill founded Got Moles in 2017 after serving in the US Army. The company started in Buckley, grew through word of mouth, and now covers 70+ communities across Western Washington.',
    },
    {
      title: 'You See Your Results',
      description: 'We report on progress. After every visit, you get a report showing exactly what happened.',
    },
    {
      title: 'Guaranteed',
      description: "We stand behind every removal programme. If we don't catch a mole, you only pay the setup fee.",
    },
  ]

  return (
    <section className="text-cream-200 py-16 lg:py-32" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight mb-12 text-center" style={{ textWrap: 'balance' }}>
          Why Homeowners Choose Got Moles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {items.map((item, i) => (
            <div key={i} className="bg-white/5 p-6 lg:p-8 rounded-2xl">
              <h3 className="font-body font-semibold text-h4 lg:text-2xl text-cream-200 mb-3">
                {item.title}
              </h3>
              <p className="font-body text-body-lg text-cream-200/80 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestTestimonial() {
  return (
    <section className="text-cream-200 py-16 lg:py-32" style={{ background: 'linear-gradient(to bottom, #153635, #184241 50%, #182034)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight text-center mb-10" style={{ textWrap: 'balance' }}>
          What Our Customers Say
        </h2>

        {/* Featured review — large centered blockquote */}
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="flex justify-center gap-0.5 mb-6" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }, (_, i) => (
              <svg key={i} className="w-5 h-5 text-gold-500 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <blockquote>
            <span className="font-heading text-gold-500 text-5xl leading-none block mb-2" aria-hidden="true">&ldquo;</span>
            <p className="font-body text-body-lg text-cream-200 leading-relaxed italic">
              We live on a 5-acre property, and since 2022 these guys have removed 27 moles from our property. When we first moved in the moles were everywhere.
            </p>
          </blockquote>
          <cite className="not-italic block mt-6">
            <span className="font-body text-sm font-semibold text-cream-200">Brian Wozeniak</span>
            <span className="font-body text-sm text-cream-200/65 block mt-0.5">Tacoma, WA</span>
          </cite>
        </div>

        {/* Supporting reviews — lighter treatment, different concerns */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <blockquote className="border-l-2 border-gold-500/40 pl-5">
            <p className="font-body text-body text-cream-200/80 leading-relaxed italic">
              &ldquo;We tried everything non lethal to get rid of our moles. Sonic mole repellant, caster oil, coyote urine... nothing worked. Got Moles came out and set effective traps.&rdquo;
            </p>
            <cite className="not-italic block mt-3">
              <span className="font-body text-sm font-semibold text-cream-200/90">Sabra B.</span>
              <span className="font-body text-sm text-cream-200/50 ml-1">Seattle, WA</span>
            </cite>
          </blockquote>
          <blockquote className="border-l-2 border-gold-500/40 pl-5">
            <p className="font-body text-body text-cream-200/80 leading-relaxed italic">
              &ldquo;I believe we were the first of Got Moles annual customers. We have fought moles for the entire 22 years we&apos;ve lived here.&rdquo;
            </p>
            <cite className="not-italic block mt-3">
              <span className="font-body text-sm font-semibold text-cream-200/90">Christina McDougall</span>
              <span className="font-body text-sm text-cream-200/50 ml-1">Seattle, WA</span>
            </cite>
          </blockquote>
        </div>

        <div className="text-center mt-10">
          <a href="/reviews" className="inline-flex items-center gap-2 font-body text-sm text-gold-500 hover:text-gold-400">
            See All 219+ Reviews
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}

function TestCTAWithForm() {
  return (
    <section className="py-16 lg:py-32 text-cream-200" style={{ background: 'linear-gradient(to bottom, #182034, #8F2A2D)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <h2 className="font-heading text-h2 uppercase tracking-tight mb-4" style={{ textWrap: 'balance' }}>
              Ready to Take Your Yard Back?
            </h2>
            <p className="font-body text-body-lg text-cream-200/90 mb-6 leading-relaxed">
              Call us at (253) 750-0211 or fill out the form. We&apos;ll get back to you within one business day.
            </p>
            <a
              href="tel:+12537500211"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
            >
              Call (253) 750-0211
            </a>
            <p className="font-body text-small text-cream-200/65 mt-4">
              Join 5,000+ homeowners who chose Got Moles.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Name', type: 'text', placeholder: 'Your name' },
              { label: 'Phone', type: 'tel', placeholder: '(253) 000-0000' },
              { label: 'Zip Code', type: 'text', placeholder: '98000' },
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

export default function TestHomepage() {
  return (
    <>
      <TestHeader />
      <TestHero />
      <TestEmpathy />
      <TestServiceCards />
      <TestHowItWorks />
      <TestFeatureGrid />
      <TestTestimonial />
      <TestCTAWithForm />
    </>
  )
}
