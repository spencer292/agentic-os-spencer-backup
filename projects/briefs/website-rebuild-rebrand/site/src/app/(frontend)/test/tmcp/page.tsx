import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Design Test — TMCP Service Page | New Principles',
  robots: 'noindex, nofollow',
}

/* ─── Self-contained TMCP test page ─── */
/* Sub-page pattern: 85vh hero, separate trust strip, py-12 lg:py-24 spacing */
/* Validates design spec for service pages: empathy section, pricing, comparison, */
/* feature list, progressive disclosure, testimonials, FAQ, CTA form */

function TestHero() {
  return (
    <section className="relative min-h-[85vh] flex items-end overflow-hidden bg-grass-600">
      <Image
        src="/images/results.webp"
        alt="Got Moles technician checking traps on a residential property"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(21,54,53,0.6) 0%, rgba(21,54,53,0.15) 30%, rgba(21,54,53,0.15) 50%, rgba(21,54,53,0.5) 70%, rgba(21,54,53,0.9) 100%)' }} />
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pb-16 pt-32 lg:pb-24 lg:pt-48">
        <div className="max-w-2xl">
          <h1 className="font-heading font-bold text-display uppercase tracking-tight text-cream-200 leading-tight mb-5" style={{ textWrap: 'balance' }}>
            Year-Round Mole Protection for $100/Month
          </h1>
          <p className="font-body text-body-lg text-cream-200/85 mb-8 leading-relaxed">
            Stop chasing the same problem every season. The Total Mole Control Program keeps your yard protected all year — so you never have to think about moles again.
          </p>
          <a
            href="tel:+12537500211"
            className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
          >
            Call (253) 750-0211 to Enroll
          </a>
          <p className="font-body text-sm text-cream-200/65 mt-5">
            ~500 homeowners already enrolled &middot; Chemical-free &middot; Guaranteed
          </p>
        </div>
      </div>
    </section>
  )
}

function TestTrustStrip() {
  const items = ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids']
  return (
    <section className="text-cream-200 py-6 lg:py-8" style={{ background: 'linear-gradient(to bottom, #184241, #182034, #184241)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-center gap-1 mb-3" aria-label="5 out of 5 stars">
          {Array.from({ length: 5 }, (_, i) => (
            <svg key={i} className="w-5 h-5 text-gold-500 fill-current" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          ))}
        </div>
        <p className="text-center font-body text-body-lg text-cream-200/90">
          {items.map((item, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-2 text-cream-200/40">&middot;</span>}
              <span className="font-semibold">{item}</span>
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

function TestEmpathy() {
  return (
    <section className="relative text-cream-200 py-12 lg:py-24 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-display uppercase tracking-tight mb-8" style={{ textWrap: 'balance' }}>
            You Fixed the Problem.<br />Then It Came Back.
          </h2>
          <p className="font-body text-body-lg text-cream-200/85 mb-6 leading-relaxed">
            Here&apos;s what we see every year. A homeowner calls us, we clear the moles, the yard looks great. Three months later, the phone rings again. Same homeowner. Same yard. New moles.
          </p>
          <p className="font-body text-body-lg text-cream-200/80 mb-6 leading-relaxed">
            It&apos;s not that the first job failed. Moles don&apos;t respect property lines. A cleared yard is still prime territory for the next mole moving through the area. Without ongoing protection, the cycle just repeats.
          </p>
          <p className="font-body text-body-lg text-cream-200 font-semibold mb-10">
            The Total Mole Control Program was built to break that cycle.
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
          >
            See Pricing
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

function TestWhatYouGet() {
  const steps = [
    {
      title: 'Monitor',
      summary: 'We check your entire property for signs of new mole activity. Fresh mounds, tunnel runs, soil displacement.',
      detail: 'Every visit covers every corner of your property, not just the areas where we last found activity. Moles establish new tunnel systems constantly, and early detection prevents the kind of damage that takes months to repair.',
    },
    {
      title: 'Respond',
      summary: 'When moles are detected, we act the same day. Equipment goes in, strategies get adjusted. No waiting for a callback.',
      detail: 'If you spot new activity between scheduled visits, call us. We come back at no extra charge. That\'s the whole point of year-round protection — you\'re covered, not just scheduled.',
    },
    {
      title: 'Report',
      summary: 'After every visit, a clear written summary. What we checked, what we found, what we did.',
      detail: 'Reports include areas inspected, mole activity found (or confirmed clear), actions taken, equipment status, and any recommendations. You\'re never left wondering what\'s happening with your yard.',
    },
  ]

  return (
    <section className="text-cream-200 py-12 lg:py-24" style={{ background: 'linear-gradient(to bottom, #153635, #184241)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight mb-12" style={{ textWrap: 'balance' }}>
          What You Get
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
                  <p className="font-body text-body-lg text-cream-200/70 mt-3 leading-relaxed">
                    {step.detail}
                  </p>
                </details>
              </div>
            </div>
          ))}
        </div>

        {/* Included features */}
        <div className="mt-14 max-w-3xl">
          <ul className="font-body text-body-lg text-cream-200/90 space-y-3">
            {[
              'Regular visits from a trained Got Moles technician',
              'Full property monitoring every visit, every corner',
              'Immediate response to new activity at no extra charge',
              'Written report after every visit',
              'More frequent visits during peak season at no additional cost',
              'Year-round protection through all seasons',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-gold-500 shrink-0">&#10003;</span> {item}
              </li>
            ))}
          </ul>
          <p className="font-body text-body-lg text-gold-500 font-semibold mt-8">
            New mole activity between visits? We come back at no extra charge. That&apos;s what year-round protection means.
          </p>
        </div>
      </div>
    </section>
  )
}

function TestPricing() {
  return (
    <section id="pricing" className="text-cream-200 py-12 lg:py-24" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight text-center mb-12" style={{ textWrap: 'balance' }}>
          Simple, Transparent Pricing
        </h2>

        {/* Pricing card — dark, not cream */}
        <div className="max-w-md mx-auto bg-white/5 rounded-2xl p-8 lg:p-10 text-center mb-16">
          <p className="font-heading font-bold text-5xl text-gold-500">$100<span className="text-2xl">/month</span></p>
          <p className="font-body text-body-lg text-cream-200/80 mt-3">12-month initial commitment, then month-to-month</p>
          <p className="font-body text-sm text-cream-200/50 mt-1">Properties under 1 acre. Over 1 acre: custom quote.</p>
          <p className="font-body text-body-lg text-cream-200 font-semibold mt-6">Less than $3.30/day to never think about moles again.</p>
          <p className="font-body text-sm text-cream-200/60 mt-2">One month of unprotected mole activity can undo months of lawn maintenance.</p>
          <div className="mt-8">
            <a
              href="tel:+12537500211"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
            >
              Enroll Now — Call (253) 750-0211
            </a>
          </div>
        </div>

        {/* Comparison — dark treatment */}
        <div className="max-w-2xl mx-auto">
          <h3 className="font-heading text-h3 uppercase tracking-tight text-center mb-8" style={{ textWrap: 'balance' }}>
            Which Service Is Right for You?
          </h3>

          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full font-body text-body-lg">
              <thead>
                <tr className="border-b border-cream-200/20">
                  <th className="text-left py-4 pr-4 font-body text-sm text-cream-200/50 uppercase tracking-wide"></th>
                  <th className="text-left py-4 px-4 font-body text-sm text-cream-200/70 uppercase tracking-wide">One-Time Removal</th>
                  <th className="text-left py-4 pl-4 font-body text-sm text-gold-500 uppercase tracking-wide">TMCP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200/10">
                {[
                  ['What it does', 'Removes current moles', 'Removes + prevents future'],
                  ['Duration', '~1 month', 'Year-round, ongoing'],
                  ['After service', 'New moles can move in', 'Monitored continuously'],
                  ['Reporting', 'End-of-service summary', 'Report after every visit'],
                  ['Price', '$450 flat rate', '$100/month'],
                  ['Guarantee', "No catch = pay setup fee only", "Activity between visits = free return"],
                ].map(([label, oneTime, tmcp]) => (
                  <tr key={label}>
                    <td className="py-4 pr-4 font-semibold text-sm text-cream-200/70">{label}</td>
                    <td className="py-4 px-4 text-cream-200/70">{oneTime}</td>
                    <td className="py-4 pl-4 text-cream-200 font-semibold">{tmcp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked */}
          <div className="md:hidden space-y-4">
            {[
              ['What it does', 'Removes current moles', 'Removes + prevents future'],
              ['Duration', '~1 month', 'Year-round, ongoing'],
              ['After service', 'New moles can move in', 'Monitored continuously'],
              ['Reporting', 'End-of-service summary', 'Report after every visit'],
              ['Price', '$450 flat rate', '$100/month'],
              ['Guarantee', "No catch = pay setup fee only", "Activity between visits = free return"],
            ].map(([label, oneTime, tmcp]) => (
              <div key={label} className="bg-white/5 rounded-2xl p-4">
                <p className="font-body font-semibold text-sm text-cream-200 mb-3">{label}</p>
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-body text-xs text-cream-200/40 uppercase tracking-wide">One-Time</p>
                    <p className="font-body text-sm text-cream-200/70">{oneTime}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-xs text-gold-500 uppercase tracking-wide">TMCP</p>
                    <p className="font-body text-sm text-cream-200 font-semibold">{tmcp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="font-body text-sm text-cream-200/50 text-center mt-6">
            Not sure? Call us and we&apos;ll recommend based on your property.
          </p>
        </div>
      </div>
    </section>
  )
}

function TestTestimonial() {
  return (
    <section className="text-cream-200 py-12 lg:py-24" style={{ background: 'linear-gradient(to bottom, #153635, #184241 50%, #182034)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight text-center mb-10" style={{ textWrap: 'balance' }}>
          What TMCP Members Say
        </h2>

        {/* Featured review */}
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
              3-4 years later, I&apos;m still using Got Moles! Their service is excellent, fast, efficient, professional. Fair Pricing and immediate Results. I highly recommend them, and believe me I&apos;ve tried everything.
            </p>
          </blockquote>
          <cite className="not-italic block mt-6">
            <span className="font-body text-sm font-semibold text-cream-200">Velena Bryant</span>
            <span className="font-body text-sm text-cream-200/65 block mt-0.5">Seattle, WA</span>
          </cite>
        </div>

        {/* Supporting review */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <blockquote className="border-l-2 border-gold-500/40 pl-5">
            <p className="font-body text-body text-cream-200/80 leading-relaxed italic">
              &ldquo;I believe we were the first of Got Moles annual customers. We have fought moles for the entire 22 years we&apos;ve lived here. Got Moles has been a game changer.&rdquo;
            </p>
            <cite className="not-italic block mt-3">
              <span className="font-body text-sm font-semibold text-cream-200/90">Christina McDougall</span>
              <span className="font-body text-sm text-cream-200/50 ml-1">Seattle, WA</span>
            </cite>
          </blockquote>
          <blockquote className="border-l-2 border-gold-500/40 pl-5">
            <p className="font-body text-body text-cream-200/80 leading-relaxed italic">
              &ldquo;We live on a 5-acre property, and since 2022 these guys have removed 27 moles from our property. When we first moved in the moles were everywhere.&rdquo;
            </p>
            <cite className="not-italic block mt-3">
              <span className="font-body text-sm font-semibold text-cream-200/90">Brian Wozeniak</span>
              <span className="font-body text-sm text-cream-200/50 ml-1">Tacoma, WA</span>
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

function TestFAQ() {
  const faqs = [
    { q: 'How often do you visit?', a: 'Weekly during active mole season, shifting to monthly once we\'ve established full control. If new activity pops up at any point, we increase visit frequency at no extra cost.' },
    { q: 'How much does the Total Mole Control Program cost?', a: 'The TMCP costs $100 per month with a 12-month minimum commitment. This covers regular monitoring visits, immediate response to any new mole activity, and a detailed report after every check.' },
    { q: 'Is there a contract?', a: 'The TMCP runs on a 12-month minimum commitment, billed monthly. After that, month-to-month. We ask for 30 days\' notice if you want to cancel.' },
    { q: 'What if moles come back between visits?', a: 'Call us. We come back at no extra charge. That\'s the whole point of year-round protection.' },
    { q: 'Is the TMCP worth it?', a: 'If you\'ve had moles before, the answer is almost certainly yes. Moles re-invade cleared territory within 3-12 months. The TMCP catches new activity before damage starts. About 500 homeowners are currently enrolled.' },
    { q: 'How is the TMCP different from one-time removal?', a: 'One-time removal is a focused, one-month service that removes current moles. The TMCP provides continuous year-round monitoring and protection — we catch new invaders before they damage your yard.' },
    { q: 'Can I cancel early?', a: 'An early cancellation fee applies within the first 12 months. After that, cancel any time with 30 days\' notice.' },
    { q: 'What does the report include?', a: 'Areas inspected, mole activity found (or confirmed clear), actions taken, equipment status, and any recommendations.' },
  ]

  return (
    <section className="text-cream-200 py-12 lg:py-24" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-12" style={{ textWrap: 'balance' }}>
            Frequently Asked Questions
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

function TestCTA() {
  return (
    <section className="py-12 lg:py-24 text-cream-200" style={{ background: 'linear-gradient(to bottom, #182034, #8F2A2D)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <h2 className="font-heading text-h2 uppercase tracking-tight mb-4" style={{ textWrap: 'balance' }}>
              Ready to Stop Fighting Moles for Good?
            </h2>
            <p className="font-body text-body-lg text-cream-200/90 mb-6 leading-relaxed">
              Call us at (253) 750-0211 or fill out the form. We&apos;ll get back to you within one business day.
            </p>
            <a
              href="tel:+12537500211"
              className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
            >
              Call (253) 750-0211
            </a>
            <p className="font-body text-small text-cream-200/65 mt-4">
              Join ~500 homeowners on the TMCP.
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
              <label className="block text-sm font-body font-semibold text-cream-200/80 mb-1">I&apos;m interested in</label>
              <select className="w-full h-12 px-4 bg-transparent border border-cream-200/30 rounded-2xl text-cream-200 font-body text-body focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20">
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
              New mole activity between visits? We come back at no extra charge.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Page ─── */

export default function TestTMCP() {
  return (
    <>
      <TestHero />
      <TestTrustStrip />
      <TestEmpathy />
      <TestWhatYouGet />
      <TestPricing />
      <TestTestimonial />
      <TestFAQ />
      <TestCTA />
    </>
  )
}
