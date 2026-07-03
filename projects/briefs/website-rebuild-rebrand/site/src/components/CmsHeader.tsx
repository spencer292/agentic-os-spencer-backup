/**
 * CmsHeader — CMS-aware Server Component wrapper around the Header UI.
 *
 * Fetches header global from Payload CMS and passes data into the Header
 * component. Falls back to the Header's own hardcoded defaults if the CMS
 * fetch fails, so the site is never broken by a missing global.
 *
 * Usage: replace <Header /> with <CmsHeader /> in the root layout.
 */

import { getGlobal } from '@/lib/payload'
import { Header } from '@/components/Header'

export async function CmsHeader() {
  let navItems: { label: string; url: string; children?: { label: string; url: string }[] }[] | undefined
  let ctaButton: { text: string; url: string } | undefined
  let phone: string | undefined

  try {
    const data = await getGlobal('header') as Record<string, any>

    if (data?.navItems && Array.isArray(data.navItems) && data.navItems.length > 0) {
      navItems = data.navItems.map((item: any) => ({
        label: item.label as string,
        url: item.url as string,
        children:
          item.children && Array.isArray(item.children) && item.children.length > 0
            ? item.children.map((child: any) => ({
                label: child.label as string,
                url: child.url as string,
              }))
            : undefined,
      }))
    }

    if (data?.ctaButton?.text && data?.ctaButton?.url) {
      ctaButton = {
        text: data.ctaButton.text as string,
        url: data.ctaButton.url as string,
      }
    }

    if (data?.phone) {
      phone = data.phone as string
    }
  } catch (_err) {
    // CMS unavailable — Header will use its built-in defaults
  }

  return <Header navItems={navItems} ctaButton={ctaButton} phone={phone} />
}
