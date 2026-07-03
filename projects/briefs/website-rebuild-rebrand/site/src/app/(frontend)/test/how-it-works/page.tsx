import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Design Test — How It Works | New Principles',
  robots: 'noindex, nofollow',
}

/* ─── Self-contained test components ─── */

function TestHero() {
  return (
    <section className="relative min-h-[85vh] flex items-end overflow-hidden bg-grass-600">
      <Image
        src="/images/inspection.webp"
        alt="Got Moles technician inspecting a lawn for mole activity"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(21,54,53,0.6) 0%, rgba(21,54,53,0.15) 30%, rgba(21,54,53,0.15) 50%, rgba(21,54,53,0.5) 70%, rgba(21,54,53,0.9) 100%)' }} />
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pb-16 pt-32 lg:pb-24 lg:pt-48">
        <div className="max-w-2xl">
          <h1 className="font-heading font-bold text-display uppercase tracking-tight text-cream-200 leading-tight mb-5" style={{ textWrap: 'balance' }}>
            How It Works — From First Call to Mole-Free Yard
          </h1>
          <p className="font-body text-body-lg text-cream-200/85 mb-8 leading-relaxed">
            No guesswork. No wasted time. Here&apos;s exactly what happens when you call Got Moles.
          </p>
          <a
            href="tel:+12537500211"
            className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
          >
            Call (253) 750-0211
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
          <p className="font-body text-sm text-cream-200/65 mt-5">
            Chemical-free &middot; Proven results &middot; Most yards cleared in one month
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

function TestProcess() {
  const steps = [
    {
      title: 'You Call. We Listen.',
      summary: "Tell us what's happening. We'll schedule an inspection, usually within two business days.",
      detail: "Phone us at (253) 750-0211 or fill out the form on our contact page. We'll ask a few questions — where you're seeing damage, how long it's been going on, whether you've tried anything already. No pressure. No upsell. Just a quick conversation so we understand your situation. We'll schedule an inspection, usually within two business days.",
    },
    {
      title: 'We Walk Your Property.',
      summary: 'A Got Moles technician inspects every part of your yard, identifies active mole runs, and builds a trapping strategy specific to your property.',
      detail: "A Got Moles technician comes out and inspects every part of your yard. We're looking for active mole runs, fresh mounds, soil displacement, and entry patterns. This isn't a drive-by assessment — it's a hands-on assessment of what's happening underground. From there, we build a trapping strategy tailored to your yard's specific layout and mole behavior.",
    },
    {
      title: 'We Get to Work.',
      summary: 'Professional-grade equipment goes in on active tunnels. We return weekly to check, adjust, and respond to new activity.',
      detail: "Professional-grade traps go into active tunnels. All methods are chemical-free and safe for pets and children. We return weekly to check traps, adjust placement based on new activity, and respond to changes in mole behavior. Most residential mole problems are resolved within one month. For ongoing protection, our Total Mole Control Program provides year-round monitoring and immediate response.",
    },
    {
      title: 'You See the Results.',
      summary: 'After every visit, you get a clear report on what we found and what we did. No guessing.',
      detail: "We provide a written results report after every service visit so you always know exactly what's happening with your yard. You'll see what traps were checked, what was caught, and what the next steps are. If new activity appears between scheduled visits on our Total Mole Control Program, we come back at no extra charge. That's it. No fine print. No surprise charges. We can offer this because we've done it nearly 5,000 times.",
    },
  ]

  return (
    <section className="text-cream-200 py-12 lg:py-24" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight mb-12" style={{ textWrap: 'balance' }}>
          The 4-Step Got Moles Process
        </h2>
        <div className="space-y-10 max-w-3xl">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-5">
              <span className="flex-shrink-0 w-3 h-3 rounded-2xl bg-gold-500 mt-2" aria-hidden="true" />
              <div>
                <h3 className="font-heading font-bold text-h3 text-cream-200 uppercase tracking-tight">
                  {step.title}
                </h3>
                <p className="font-body text-body text-cream-200/80 mt-2 leading-relaxed">
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
        <div className="mt-12">
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
          >
            Schedule Your Free Inspection
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
          <p className="font-body text-small text-cream-200/65 mt-3">
            Most yards cleared in one month &middot; Chemical-free &middot; Guaranteed
          </p>
        </div>
      </div>
    </section>
  )
}

function TestAfterSection() {
  return (
    <section className="text-cream-200 py-12 lg:py-24" style={{ background: 'linear-gradient(to bottom, #153635, #184241)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-6" style={{ textWrap: 'balance' }}>
            What Happens When the Moles Are Gone?
          </h2>
          <p className="font-body text-body-lg text-cream-200/90 leading-relaxed mb-4">
            Your yard is clear. The damage stops. You can actually enjoy the lawn you&apos;ve been paying to maintain.
          </p>
          <details className="group">
            <summary className="font-body text-sm text-gold-500 cursor-pointer hover:text-gold-400 list-none inline-flex items-center gap-1">
              Read more
              <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
              </svg>
            </summary>
            <div className="mt-4 font-body text-body-lg text-cream-200/80 leading-relaxed space-y-4">
              <p>
                Here&apos;s what most people don&apos;t realize: moles will try again. A cleared yard is still attractive territory. New moles move in from neighboring properties, especially during peak season.
              </p>
              <p>
                That&apos;s why most of our clients choose ongoing protection through the Total Mole Control Program — $100/month for year-round monitoring, immediate response, and a report after every visit.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}

function TestWhyDifferent() {
  const items = [
    {
      title: "Moles Aren't Pests — They're Tunnelers",
      description: "Unlike surface pests, moles operate underground. You can't spray them, bait them, or trap them with hardware store products. They require specialized equipment and knowledge of tunnel systems.",
    },
    {
      title: 'DIY Methods Usually Fail',
      description: "Grub killer doesn't work — moles eat earthworms, not grubs. Vibrating stakes are ignored within days. Castor oil granules wash away. The only proven method is professional trapping in active tunnels.",
    },
    {
      title: 'General Pest Companies Treat Moles as an Afterthought',
      description: 'Most pest companies focus on insects and rodents. Moles are a sideline service they offer but rarely specialize in. That lack of focus shows in the results.',
    },
    {
      title: 'Experience Matters',
      description: "Spencer Hill has been doing this since before the company was founded in 2017. Nearly 5,000 properties across 70+ communities. That experience means we know mole behavior in Western Washington's specific soil and climate conditions.",
    },
  ]

  return (
    <section className="text-cream-200 py-12 lg:py-24" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight mb-12 text-center" style={{ textWrap: 'balance' }}>
          Why Mole Control Is Different
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
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
    <section className="text-cream-200 py-12 lg:py-24" style={{ background: 'linear-gradient(to bottom, #153635, #184241 50%, #182034)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight text-center mb-10" style={{ textWrap: 'balance' }}>
          What Homeowners Say
        </h2>
        <div className="max-w-2xl mx-auto text-center">
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
              After trying two other pest companies and every DIY trap on the market, Got Moles actually solved the problem. Spencer knows exactly what he&apos;s doing. Worth every penny.
            </p>
          </blockquote>
          <cite className="not-italic block mt-6">
            <span className="font-body text-sm font-semibold text-cream-200">Mark R.</span>
            <span className="font-body text-sm text-cream-200/65 block mt-0.5">Issaquah, WA</span>
          </cite>
          <div className="mt-8">
            <a href="/reviews" className="inline-flex items-center gap-2 font-body text-sm text-gold-500 hover:text-gold-400">
              Read all reviews
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
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
              Ready to Take Your Yard Back?
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
              Join 5,000+ homeowners who chose Got Moles.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-body font-semibold text-cream-200/80 mb-1">Name</label>
              <input type="text" placeholder="Your name" className="w-full h-12 px-4 bg-transparent border border-cream-200/30 rounded-2xl text-cream-200 font-body text-body placeholder:text-cream-200/40 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />
            </div>
            <div>
              <label className="block text-sm font-body font-semibold text-cream-200/80 mb-1">Phone</label>
              <input type="tel" placeholder="(253) 000-0000" className="w-full h-12 px-4 bg-transparent border border-cream-200/30 rounded-2xl text-cream-200 font-body text-body placeholder:text-cream-200/40 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />
            </div>
            <div>
              <label className="block text-sm font-body font-semibold text-cream-200/80 mb-1">Zip Code</label>
              <input type="text" placeholder="98000" className="w-full h-12 px-4 bg-transparent border border-cream-200/30 rounded-2xl text-cream-200 font-body text-body placeholder:text-cream-200/40 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />
            </div>
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

export default function TestHowItWorks() {
  return (
    <>
      <div className="bg-blue-600 text-cream-200 text-center py-3 text-sm font-body">
        Design Test Page — How It Works (not production)
      </div>
      <TestHero />
      <TestTrustStrip />
      <TestProcess />
      <TestAfterSection />
      <TestWhyDifferent />
      <TestTestimonial />
      <TestCTA />
    </>
  )
}
