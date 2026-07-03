/**
 * Tracking helpers — push events to GTM dataLayer.
 *
 * GTM container is loaded once in (frontend)/layout.tsx via @next/third-parties.
 * All ad-platform tags (GA4, Google Ads, Meta Pixel, Bing UET) are configured
 * inside the GTM UI and fire off these dataLayer events. Adding a new platform
 * = new tag in GTM, zero code redeploy.
 *
 * Call conversions are NOT routed through here — CallRail's native integrations
 * import calls directly to GAds/Meta/Bing. Do not enable CallRail "Push to
 * dataLayer" or you will double-count.
 */

type DataLayerEvent = Record<string, unknown> & { event: string }

function pushDataLayer(payload: DataLayerEvent) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(payload as object)
}

/**
 * Track click-to-call. Fire on click of any tel: link.
 *
 * Usage: <a href="tel:..." onClick={() => trackPhoneCall({ source_section: 'hero' })}>
 *
 * Note: actual call conversions land via CallRail native imports.
 * This event is for click-engagement reporting only.
 */
export function trackPhoneCall(meta: { source_section?: string; city?: string } = {}) {
  pushDataLayer({
    event: 'phone_click',
    phone_number: '253-750-0211',
    ...meta,
  })
}

/**
 * Track form submission as a lead. Fire on successful form submit.
 *
 * Usage:
 *   trackFormSubmit({
 *     form_name: 'contact_request',
 *     user_data: { email_address, phone_number, address: { first_name, postal_code } },
 *   })
 *
 * GA4 recommended event name 'generate_lead' so it lights up GA4 lead reports
 * automatically. Map this to Meta Pixel `Lead`, GAds Lead conversion, and
 * Bing UET goal inside GTM.
 *
 * `user_data` is the schema Google Ads Enhanced Conversions for Leads (ECL)
 * expects — pass raw values, GTM hashes via the User-Provided Data tag.
 * Same payload feeds Meta Advanced Matching and Bing UET Enhanced Conversions.
 */
type EclUserData = {
  email_address?: string
  phone_number?: string
  address?: {
    first_name?: string
    last_name?: string
    postal_code?: string
  }
}

export function trackFormSubmit(
  meta: {
    form_name: string
    city?: string
    value?: number
    user_data?: EclUserData
  } = { form_name: 'unknown' },
) {
  pushDataLayer({
    event: 'generate_lead',
    currency: 'USD',
    value: 1,
    ...meta,
  })
}

/**
 * Generic CTA click tracker for buttons/links worth measuring.
 *
 * Usage: trackCtaClick({ cta_label: 'Get a Quote', cta_location: 'sticky_footer' })
 */
export function trackCtaClick(meta: { cta_label: string; cta_location?: string }) {
  pushDataLayer({
    event: 'cta_click',
    ...meta,
  })
}

