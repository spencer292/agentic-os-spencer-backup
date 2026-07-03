'use client'

import { useState } from 'react'
import { trackFormSubmit } from './Analytics'
import type { LpCity } from '@/lib/lp-city-data'

interface LpQuickFormProps {
  /** Geo LPs pass the city. Service/keyword LPs omit it → Western Washington default. */
  city?: LpCity
  /** Source slug for field IDs + the Jobber message tag when no city (e.g. 'mole-removal'). */
  source?: string
}

// Geo-neutral fallback for service/keyword LPs (no city). Western Washington,
// representative WA ZIP for enhanced-conversions postal_code + Jobber routing.
const WA_FALLBACK = { slug: 'wa', defaultZip: '98001' }

/**
 * 3-field quick CTA form for paid-search landing pages.
 *
 * Design-system compliant per brand_context/design-system.md:
 *   - Dark-first: grass section background (no cream/light)
 *   - Card: semi-transparent dark overlay, cream-200/10 border (no white/cream cards on dark)
 *   - Inputs: transparent bg + cream outline (matches ContactForm variant="transparent")
 *   - Submit: gold rounded-2xl (matches all buttons)
 *
 * Posts to /api/contact with hidden zipCode (city default), service ('other'),
 * and a source-tagged message so Spencer sees "Quick form from /lp/{city}/"
 * in Jobber.
 */
export function LpQuickForm({ city, source }: LpQuickFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Resolve geo: city when provided (geo LPs), else WA fallback keyed by source (service LPs).
  const slug = city?.slug ?? source ?? WA_FALLBACK.slug
  const zip = city?.defaultZip ?? WA_FALLBACK.defaultZip

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const form = e.currentTarget
    const data = new FormData(form)

    const payload = {
      name: data.get('name') as string,
      phone: data.get('phone') as string,
      email: data.get('email') as string,
      zipCode: zip,
      service: 'other',
      message: `Quick form from /lp/${slug}/ landing page`,
      website: data.get('website') as string, // honeypot
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Something went wrong.')
      }

      trackFormSubmit({
        form_name: 'lp_quick_form',
        user_data: {
          email_address: payload.email,
          phone_number: payload.phone,
          address: {
            first_name: payload.name?.trim().split(/\s+/)[0],
            postal_code: payload.zipCode,
          },
        },
      })

      setStatus('success')
      form.reset()
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  // Fade from grass-600 (#184241 — the hero trust strip above AND the painPoints
  // section below) into a slightly darker centre and back, so this block blends
  // into the flow instead of sitting as a flat box.
  const sectionBg = { background: 'linear-gradient(to bottom, #184241 0%, #153635 50%, #184241 100%)' }

  if (status === 'success') {
    return (
      <section className="py-10 px-4" style={sectionBg}>
        <div className="max-w-2xl mx-auto bg-cream-200/5 border border-cream-200/20 rounded-2xl p-6 text-center">
          <p className="font-heading text-h4 uppercase text-cream-200 mb-2">Thank you</p>
          <p className="font-body text-body text-cream-200/80">
            Spencer will call you back within one business day. For faster service, call{' '}
            <a href="tel:+12537500211" className="text-gold-500 font-semibold underline">
              (253) 750-0211
            </a>
            .
          </p>
        </div>
      </section>
    )
  }

  const inputClasses =
    'w-full h-12 px-4 bg-transparent border border-cream-200/30 rounded-2xl font-body text-body text-cream-200 placeholder-cream-200/40 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20'

  return (
    <section className="py-10 px-4" style={sectionBg}>
      <div className="max-w-2xl mx-auto bg-cream-200/5 border border-cream-200/20 rounded-2xl p-6 md:p-8">
        <div className="text-center mb-5">
          <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 mb-2">
            Request a Callback
          </h2>
          <p className="font-body text-body text-cream-200/80">
            Spencer calls you back the same business day. No obligation.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Honeypot */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor={`${slug}-lp-website`}>Website</label>
            <input
              type="text"
              id={`${slug}-lp-website`}
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor={`${slug}-lp-name`} className="sr-only">
                Name
              </label>
              <input
                type="text"
                id={`${slug}-lp-name`}
                name="name"
                placeholder="Your name"
                required
                maxLength={200}
                autoComplete="name"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor={`${slug}-lp-phone`} className="sr-only">
                Phone
              </label>
              <input
                type="tel"
                id={`${slug}-lp-phone`}
                name="phone"
                placeholder="Phone"
                required
                maxLength={30}
                autoComplete="tel"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor={`${slug}-lp-email`} className="sr-only">
                Email
              </label>
              <input
                type="email"
                id={`${slug}-lp-email`}
                name="email"
                placeholder="Email"
                required
                maxLength={200}
                autoComplete="email"
                className={inputClasses}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full h-12 bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl"
          >
            {status === 'submitting' ? 'SENDING…' : 'REQUEST A CALLBACK'}
          </button>
          {status === 'error' && (
            <p className="text-xs font-body text-red-400 text-center">{errorMessage}</p>
          )}
          <p className="text-xs font-body text-cream-200/50 text-center">
            Or call{' '}
            <a href="tel:+12537500211" className="text-gold-500 underline">
              (253) 750-0211
            </a>{' '}
            now — Spencer answers.
          </p>
        </form>
      </div>
    </section>
  )
}
