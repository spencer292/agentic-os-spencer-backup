import { getPageBySlug } from '@/lib/payload'

/**
 * Fetch a CMS page by slug and return it, or null if not found / Payload unavailable.
 * Used by the specific page routes (about, faq, contact, how-it-works, reviews, homepage).
 */
export async function getCmsPageContent(slug: string) {
  try {
    const page = await getPageBySlug(slug)
    return page || null
  } catch {
    return null
  }
}

/**
 * Build Next.js Metadata from a CMS page's meta tab fields.
 * Pass a fallback title/description for when the CMS page is not found.
 */
const DEFAULT_OG_IMAGE = {
  url: '/images/og-default.webp',
  width: 1200,
  height: 630,
  alt: 'Got Moles — Professional Mole Control in Western Washington',
}

const SITE_URL = 'https://got-moles.com'

export function buildMetadata(
  page: Awaited<ReturnType<typeof getPageBySlug>> | null,
  fallback: { title: string; description?: string; canonicalPath: string },
) {
  const canonicalUrl = `${SITE_URL}${fallback.canonicalPath}`

  if (!page) {
    return {
      title: fallback.title,
      description: fallback.description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: fallback.title,
        description: fallback.description || undefined,
        url: canonicalUrl,
        images: [DEFAULT_OG_IMAGE],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title: fallback.title,
        description: fallback.description || undefined,
        images: [DEFAULT_OG_IMAGE.url],
      },
    }
  }

  const meta = page.meta as
    | {
        title?: string
        description?: string
        noIndex?: boolean
        ogImage?: { url?: string; width?: number; height?: number } | null
      }
    | undefined

  const ogImage = meta?.ogImage?.url
    ? { url: meta.ogImage.url, width: meta.ogImage.width || 1200, height: meta.ogImage.height || 630, alt: meta?.title || fallback.title }
    : DEFAULT_OG_IMAGE

  const title = meta?.title || fallback.title
  const description = meta?.description || fallback.description

  return {
    title,
    description,
    robots: meta?.noIndex ? 'noindex, nofollow' : undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description: description || undefined,
      url: canonicalUrl,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description: description || undefined,
      images: [ogImage.url],
    },
  }
}
