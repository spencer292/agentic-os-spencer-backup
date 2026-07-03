import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Test — Homepage H1 Options',
  robots: 'noindex, nofollow',
}

/* Self-contained — does NOT touch CMS or production homepage. Three hero variants
 * stacked for side-by-side review.
 *
 * Context: WordPress homepage H1 was "Mole Control Seattle" (keyword-led, ranking).
 * New build H1 is "Your Lawn Deserves Better Than Moles. We Make Sure It Gets It."
 * (brand-led, zero keyword signal). Homepage rank slipped 6.7 -> 8.3. Restoring a
 * keyword signal in the visible heading hierarchy is the proposed fix.
 */

function HeroBase({
  variant,
  h1,
  h2,
  sub,
}: {
  variant: string
  h1: string
  h2?: string
  sub: string
}) {
  return (
    <section className="relative min-h-[85vh] flex flex-col overflow-hidden bg-grass-600 border-b-4 border-gold-500">
      <Image
        src="/images/hero-home.webp"
        alt="Hero"
        fill
        priority={false}
        className="object-cover"
        sizes="100vw"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(21,54,53,0.6) 0%, rgba(21,54,53,0.15) 30%, rgba(21,54,53,0.15) 50%, rgba(21,54,53,0.5) 70%, rgba(21,54,53,0.95) 100%)',
        }}
      />

      {/* Variant label badge — for review only, not on production */}
      <div className="relative z-20 self-start m-6 px-3 py-1.5 rounded-full bg-gold-500 text-blue-600 font-heading font-bold text-xs uppercase tracking-wider">
        {variant}
      </div>

      <div className="relative z-10 mt-auto w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pb-8 lg:pb-12">
        <div className="max-w-2xl">
          <h1
            className="font-heading font-bold text-display uppercase tracking-tight text-cream-200 leading-tight mb-3"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {h1}
          </h1>
          {h2 && (
            <h2
              className="font-heading font-bold text-h2 uppercase tracking-tight text-gold-500 mb-4"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              {h2}
            </h2>
          )}
          <p className="font-body text-body-lg text-cream-200/85 mb-8 leading-relaxed">
            {sub}
          </p>
          <a
            href="/how-it-works"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
          >
            See How It Works
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-600/30">
              <svg
                className="w-3 h-3"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default function HomepageH1TestPage() {
  return (
    <>
      {/* Brief intro */}
      <section
        className="text-cream-200 px-4 py-12"
        style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}
      >
        <div className="max-w-[800px] mx-auto">
          <h1 className="font-heading text-h1 uppercase tracking-tight mb-4">
            Homepage H1 — Three Variants for Review
          </h1>
          <p className="font-body text-body-lg text-cream-200/85 mb-2">
            Three hero options stacked below for visual comparison.
          </p>
          <p className="font-body text-small text-cream-200/65">
            <strong>Why:</strong> The WordPress homepage H1 was{' '}
            <em>&ldquo;Mole Control Seattle&rdquo;</em> — keyword-led, ranking. The new
            build H1 is brand-led with zero keyword signal. Homepage rank slipped from
            position 6.7 to 8.3 post-launch. Restoring keyword presence in the visible
            heading hierarchy is the proposed fix. Pick one.
          </p>
        </div>
      </section>

      {/* VARIANT 1 — current production */}
      <HeroBase
        variant="Variant 1 — Current production (brand-only H1)"
        h1="Your Lawn Deserves Better Than Moles. We Make Sure It Gets It."
        sub="Western Washington's mole-exclusive specialist since 2017. No chemicals. No guesswork. Just results."
      />

      {/* VARIANT 2 — Option A: keyword H1, brand demoted to subhead */}
      <HeroBase
        variant="Variant 2 — Option A: Keyword H1 + brand subhead"
        h1="Mole Control in Western Washington"
        sub="Your lawn deserves better than moles. We make sure it gets it. Veteran-owned, chemical-free, nearly 5,000 properties served since 2017."
      />

      {/* VARIANT 3 — Option B: brand H1 + keyword H2 */}
      <HeroBase
        variant="Variant 3 — Option B: Brand H1 + keyword H2"
        h1="Your Lawn Deserves Better Than Moles. We Make Sure It Gets It."
        h2="Mole Control in Western Washington Since 2017"
        sub="Veteran-owned, chemical-free, nearly 5,000 properties served. No chemicals. No guesswork."
      />

      {/* Notes panel */}
      <section
        className="text-cream-200 px-4 py-12"
        style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}
      >
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-6">
            Trade-offs
          </h2>
          <div className="space-y-4 font-body text-body-lg text-cream-200/85">
            <p>
              <strong className="text-gold-500">Variant 1 (current):</strong> Strong
              brand presence, weak keyword signal. Loses the &ldquo;Mole Control
              Seattle/Western Washington&rdquo; topical match Google had been ranking.
            </p>
            <p>
              <strong className="text-gold-500">Variant 2 (Option A):</strong> Maximum
              SEO recovery — H1 directly matches the highest-volume query intent. Brand
              voice survives in the subhead. Closest match to the WordPress structure
              that was ranking. <em>Risk:</em> reads more like a service page H1 than a
              hero, less distinctive at first glance.
            </p>
            <p>
              <strong className="text-gold-500">Variant 3 (Option B):</strong> Keeps the
              brand-led emotional opener, adds keyword presence as H2 in gold. Both
              signals visible above the fold. <em>Risk:</em> two competing headings can
              look busy; H2 in gold may pull eye away from the H1.
            </p>
            <p className="text-cream-200/65 text-small mt-6">
              Whichever wins, the production change is a single edit to{' '}
              <code className="bg-white/10 px-1.5 py-0.5 rounded">homepageBlocks</code>{' '}
              in <code className="bg-white/10 px-1.5 py-0.5 rounded">pages-data.ts</code>{' '}
              + a reseed of the home slug. Reversible in one commit.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
