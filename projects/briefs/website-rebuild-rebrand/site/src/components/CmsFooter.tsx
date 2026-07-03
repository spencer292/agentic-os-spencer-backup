/**
 * CmsFooter — CMS-aware Server Component wrapper around the Footer UI.
 *
 * Fetches the footer global from Payload CMS and passes data into the Footer
 * component. Also fetches site-settings for the phone number. Falls back to
 * the Footer's own hardcoded defaults if either CMS fetch fails.
 *
 * Usage: replace <Footer /> with <CmsFooter /> in the root layout.
 */

import { getGlobal } from '@/lib/payload'
import { Footer } from '@/components/Footer'

export async function CmsFooter() {
  let brandDescription: string | undefined
  let columns: { title: string; links: { label: string; url: string }[] }[] | undefined
  let serviceArea: string | undefined
  let legalLinks: { label: string; url: string }[] | undefined
  let copyright: string | undefined
  let phone: string | undefined

  try {
    const [footerData, siteData] = await Promise.all([
      getGlobal('footer') as Promise<Record<string, any>>,
      getGlobal('site-settings') as Promise<Record<string, any>>,
    ])

    if (footerData?.brandDescription) {
      brandDescription = footerData.brandDescription as string
    }

    if (footerData?.columns && Array.isArray(footerData.columns) && footerData.columns.length > 0) {
      columns = footerData.columns.map((col: any) => ({
        title: col.title as string,
        links: Array.isArray(col.links)
          ? col.links.map((link: any) => ({
              label: link.label as string,
              url: link.url as string,
            }))
          : [],
      }))
    }

    if (footerData?.serviceArea) {
      serviceArea = footerData.serviceArea as string
    }

    if (footerData?.legalLinks && Array.isArray(footerData.legalLinks) && footerData.legalLinks.length > 0) {
      legalLinks = footerData.legalLinks.map((link: any) => ({
        label: link.label as string,
        url: link.url as string,
      }))
    }

    if (footerData?.copyright) {
      copyright = footerData.copyright as string
    }

    if (siteData?.phone) {
      phone = siteData.phone as string
    }
  } catch (_err) {
    // CMS unavailable — Footer will use its built-in defaults
  }

  return (
    <Footer
      brandDescription={brandDescription}
      columns={columns}
      serviceArea={serviceArea}
      legalLinks={legalLinks}
      copyright={copyright}
      phone={phone}
    />
  )
}
