'use client'

import { usePathname } from 'next/navigation'

// Hides its children on paid landing pages (/lp/*) only — used to drop the site
// header + footer nav from single-goal LPs while leaving all tracking (GTM/GA4/
// CallRail/sticky bar) in the root layout untouched.
export function HideOnLp({ children }: { children: React.ReactNode }) {
  const p = usePathname()
  return p?.startsWith('/lp/') ? null : <>{children}</>
}
