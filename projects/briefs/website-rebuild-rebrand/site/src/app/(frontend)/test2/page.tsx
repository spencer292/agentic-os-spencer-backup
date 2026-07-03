import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Test 2 — Basic Rules | Got Moles',
  robots: 'noindex, nofollow',
}

export default function Test2Page() {
  return (
    <main className="bg-grass-600 text-cream-200 min-h-screen">
      {/* Hero */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-20 pb-16">
        <h1
          className="font-heading font-bold text-display uppercase tracking-tight text-cream-200 leading-tight mb-6"
          style={{ textWrap: 'balance' }}
        >
          A Test Page. Basic Rules Only.
        </h1>
        <p className="font-body text-body-lg text-cream-200/85 max-w-2xl leading-relaxed mb-10">
          This page is a sandbox for design-system rules: brand colors, type scale, button shape, container width. Nothing here ships to production.
        </p>

        <a
          href="/contact"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors"
        >
          Test CTA
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-600/30">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
            </svg>
          </span>
        </a>
      </section>

      {/* Type scale demo */}
      <section className="bg-blue-600 text-cream-200">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-16 space-y-6">
          <h2 className="font-heading font-bold text-h1 uppercase tracking-tight">Heading 1 — Lexend Bold Uppercase</h2>
          <h3 className="font-heading font-bold text-h2 uppercase tracking-tight">Heading 2 — Lexend Bold Uppercase</h3>
          <h4 className="font-subhead font-semibold text-h3">Subheading — Zilla Slab SemiBold</h4>
          <p className="font-body text-body-lg leading-relaxed max-w-2xl">
            Body large — Zilla Slab Regular. Used for hero subcopy and important paragraph blocks. Generous line height. Cream on dark.
          </p>
          <p className="font-body text-body max-w-2xl">
            Body default — Zilla Slab Regular. Used for paragraph copy across the site. Sentence case, never ALL CAPS for long strings.
          </p>
        </div>
      </section>

      {/* Color palette demo */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-16">
        <h2 className="font-heading font-bold text-h2 uppercase tracking-tight mb-8">Color Tokens</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: 'Grass', value: '#184241', cls: 'bg-grass-600 text-cream-200' },
            { name: 'Blue', value: '#182034', cls: 'bg-blue-600 text-cream-200' },
            { name: 'Cream', value: '#FFF1D9', cls: 'bg-cream-200 text-grass-600' },
            { name: 'Gold', value: '#E68C04', cls: 'bg-gold-500 text-blue-600' },
            { name: 'Rust', value: '#8F2A2D', cls: 'bg-rust-600 text-cream-200' },
          ].map((c) => (
            <div key={c.name} className={`${c.cls} rounded-2xl p-6 font-body`}>
              <div className="font-heading font-bold text-sm uppercase tracking-[0.1em]">{c.name}</div>
              <div className="text-sm mt-2 opacity-80">{c.value}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
