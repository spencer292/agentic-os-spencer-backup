'use client'

import { useState } from 'react'
import { trackFormSubmit } from './Analytics'

interface ContactFormProps {
  variant?: 'light' | 'dark' | 'transparent'
}

export function ContactForm({ variant = 'light' }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const form = e.currentTarget
    const data = new FormData(form)

    const payload = {
      name: data.get('name') as string,
      phone: data.get('phone') as string,
      email: (data.get('email') as string) || undefined,
      zipCode: data.get('zipCode') as string,
      service: data.get('service') as string,
      message: (data.get('message') as string) || undefined,
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

      // Fire GA4 generate_lead with ECL-compatible user_data — GTM will hash
      // these fields server-side via the User-Provided Data tag.
      trackFormSubmit({
        form_name: 'contact_request',
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

  if (status === 'success') {
    return (
      <div className={`p-6 text-center rounded-2xl ${
        variant === 'transparent'
          ? 'bg-white/10 border border-cream-200/30'
          : variant === 'dark'
            ? 'bg-white/10'
            : 'bg-grass-600/10'
      }`}>
        <p className={`font-heading text-h4 uppercase mb-2 ${
          variant === 'light' ? 'text-grass-600' : 'text-cream-200'
        }`}>
          Thank you!
        </p>
        <p className={`font-body text-body ${
          variant === 'light' ? 'text-neutral-600' : 'text-cream-200/80'
        }`}>
          We&apos;ll be in touch within one business day.
        </p>
      </div>
    )
  }

  const isTransparent = variant === 'transparent'
  const isDark = variant === 'dark'

  const inputClasses = isTransparent
    ? 'w-full h-12 px-4 bg-transparent border border-cream-200/30 rounded-2xl font-body text-body text-cream-200 placeholder-cream-200/40 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20'
    : `w-full h-12 px-4 border border-neutral-200 rounded-2xl font-body text-body focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 ${
        isDark ? 'bg-white text-neutral-800' : 'bg-white text-neutral-800'
      }`

  const labelClasses = isTransparent
    ? 'block text-sm font-body font-semibold text-cream-200/80 mb-1'
    : 'block text-sm font-body font-semibold text-neutral-700 mb-1'

  const containerClasses = isTransparent
    ? 'bg-transparent border border-cream-200/30 rounded-2xl p-6'
    : ''

  return (
    <div className={containerClasses}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Honeypot — hidden from humans, visible to bots */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            type="text"
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="contact-name" className={labelClasses}>
            Name
          </label>
          <input
            type="text"
            id="contact-name"
            name="name"
            required
            maxLength={200}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className={labelClasses}>
            Phone
          </label>
          <input
            type="tel"
            id="contact-phone"
            name="phone"
            required
            maxLength={30}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClasses}>
            Email
          </label>
          <input
            type="email"
            id="contact-email"
            name="email"
            required
            maxLength={200}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="contact-zip" className={labelClasses}>
            Zip Code
          </label>
          <input
            type="text"
            id="contact-zip"
            name="zipCode"
            required
            maxLength={10}
            pattern="\d{5}(-\d{4})?"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="contact-service" className={labelClasses}>
            How can we help?
          </label>
          <select
            id="contact-service"
            name="service"
            required
            className={inputClasses}
          >
            <option value="" className="text-grass-800 bg-cream-200">Select...</option>
            <option value="tmcp" className="text-grass-800 bg-cream-200">Year-Round Protection (TMCP)</option>
            <option value="one-time" className="text-grass-800 bg-cream-200">One-Time Mole Removal</option>
            <option value="commercial" className="text-grass-800 bg-cream-200">Commercial Service</option>
            <option value="other" className="text-grass-800 bg-cream-200">Something Else</option>
          </select>
        </div>
        <div>
          <label htmlFor="contact-message" className={labelClasses}>
            Message <span className={isTransparent ? 'text-cream-200/40 font-normal' : 'text-neutral-400 font-normal'}>(optional)</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={3}
            maxLength={2000}
            className={`${inputClasses.replace('h-12', '')} py-3`}
          />
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full h-12 bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl"
        >
          {status === 'submitting' ? 'SENDING...' : 'REQUEST A CALL'}
        </button>
        {status === 'error' && (
          <p className="text-xs font-body text-red-600 text-center">{errorMessage}</p>
        )}
        <p className={`text-xs font-body text-center ${isTransparent ? 'text-cream-200/50' : 'text-neutral-400'}`}>
          Nearly 5,000 clients served since 2017. We stand behind our results.
        </p>
      </form>
    </div>
  )
}
