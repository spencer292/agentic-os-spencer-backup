'use client'

import { useEffect } from 'react'
import { trackPhoneCall } from './Analytics'

/**
 * Global click delegator. Listens once at document level for clicks on any
 * `a[href^="tel:"]` link and fires a `phone_click` dataLayer event. Saves
 * adding onClick handlers to every header / footer / sticky-bar / CMS-block
 * tel: link individually, and catches future tel: links automatically.
 *
 * Source attribution:
 * - inside <header>      → 'header'
 * - inside <footer>      → 'footer'
 * - inside element with [data-track-source]  → that value
 * - mobile sticky bar    → 'mobile_sticky_bar' (matches the fixed bottom bar)
 * - otherwise            → 'page_body'
 *
 * Note: actual call conversions land via CallRail native imports — this event
 * is engagement-only. NOT a conversion. Do not import as a Google Ads or Bing
 * UET conversion goal.
 */
export function TrackingDelegator() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target || typeof target.closest !== 'function') return
      const link = target.closest('a[href^="tel:"]') as HTMLAnchorElement | null
      if (!link) return

      let source = 'page_body'
      const explicit = link.closest('[data-track-source]') as HTMLElement | null
      if (explicit) {
        source = explicit.dataset.trackSource || source
      } else if (link.closest('header')) {
        source = 'header'
      } else if (link.closest('footer')) {
        source = 'footer'
      } else if (link.closest('.fixed.bottom-0.lg\\:hidden')) {
        // MobileStickyBar wrapper — see components/MobileStickyBar.tsx
        source = 'mobile_sticky_bar'
      }

      trackPhoneCall({ source_section: source })
    }

    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return null
}
