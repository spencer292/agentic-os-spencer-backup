import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Cached Payload client — call this in every data-fetching function.
 */
export async function getPayloadClient() {
  return getPayload({ config })
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

/**
 * Fetch a page by slug from the Pages collection.
 * Returns null if not found or not published.
 */
export async function getPageBySlug(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 2,
    draft: false,
  })
  return result.docs[0] || null
}

/**
 * Fetch all published pages (for sitemap / static generation).
 */
export async function getAllPages() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: { status: { equals: 'published' } },
    limit: 200,
    depth: 0,
  })
  return result.docs
}

// ---------------------------------------------------------------------------
// City Pages
// ---------------------------------------------------------------------------

/**
 * Fetch a city page by slug.
 * City pages are programmatic — no status filter applied.
 */
export async function getCityPageBySlug(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'city-pages',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] || null
}

/**
 * Fetch all city pages for static generation.
 */
export async function getAllCityPages() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'city-pages',
    limit: 500,
    depth: 0,
  })
  return result.docs
}

// ---------------------------------------------------------------------------
// Blog Posts
// ---------------------------------------------------------------------------

/**
 * Fetch a blog post by slug.
 * Returns null if not found or not published.
 *
 * Pass `urlPattern: 'blog'` to only match /blog/{slug}/ posts (excludes legacy-root migrated posts).
 * Pass `urlPattern: 'legacy-root'` to only match migrated /{slug}/ posts.
 * Omit to match any urlPattern.
 */
export async function getBlogPostBySlug(
  slug: string,
  options?: { urlPattern?: 'blog' | 'legacy-root' },
) {
  const payload = await getPayloadClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    slug: { equals: slug },
    status: { equals: 'published' },
  }
  if (options?.urlPattern) {
    where.urlPattern = { equals: options.urlPattern }
  }
  const result = await payload.find({
    collection: 'blog-posts',
    where,
    limit: 1,
    depth: 2,
    draft: false,
  })
  return result.docs[0] || null
}

/**
 * Fetch all published blog posts with optional filtering and pagination.
 *
 * Pass `urlPattern` to restrict by route type (see getBlogPostBySlug).
 */
export async function getAllBlogPosts(options?: {
  tag?: string
  page?: number
  limit?: number
  urlPattern?: 'blog' | 'legacy-root'
}) {
  const payload = await getPayloadClient()
  const { tag, page = 1, limit = 12, urlPattern } = options || {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { status: { equals: 'published' } }
  if (tag) {
    where['tags.slug'] = { equals: tag }
  }
  if (urlPattern) {
    where.urlPattern = { equals: urlPattern }
  }

  return payload.find({
    collection: 'blog-posts',
    where,
    sort: '-publishDate' as any,
    page,
    limit,
    depth: 1,
    draft: false,
  })
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

/**
 * Fetch featured testimonials (featured = true) for the homepage trust strip.
 */
export async function getFeaturedTestimonials() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'testimonials',
    where: {
      featured: { equals: true },
    },
    sort: 'sortOrder',
    limit: 6,
    depth: 1,
  })
  return result.docs
}

/**
 * Fetch all testimonials, optionally filtered by service.
 */
export async function getAllTestimonials(service?: string) {
  const payload = await getPayloadClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (service) {
    where['service.slug'] = { equals: service }
  }
  const result = await payload.find({
    collection: 'testimonials',
    where,
    sort: 'sortOrder',
    limit: 100,
    depth: 1,
  })
  return result.docs
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

/**
 * Fetch all services (for nav, service grid, schema).
 */
export async function getAllServices() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'services',
    limit: 50,
    depth: 2,
  })
  return result.docs
}

/**
 * Fetch a single service by slug.
 * Returns null if not found.
 */
export async function getServiceBySlug(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'services',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] || null
}

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------

/**
 * Fetch a global by its slug.
 * Supported globals: siteSettings, headerNav, footerNav
 */
export async function getGlobal(slug: 'site-settings' | 'header' | 'footer') {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug, depth: 2 })
}
