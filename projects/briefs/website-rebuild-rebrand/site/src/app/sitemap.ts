import type { MetadataRoute } from 'next'
import { getAllCitySlugs } from '@/lib/city-data'
import { blogPosts } from '@/lib/blog-data'

const BASE = 'https://got-moles.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  // Core pages
  const corePages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/services/`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/services/total-mole-control-program/`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/services/one-time-mole-removal/`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/services/commercial-mole-control/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/how-it-works/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/about/`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/faq/`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/reviews/`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/service-areas/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/contact/`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/blog/`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/author/spencer/`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  // City pages — high priority for local SEO
  const cityPages: MetadataRoute.Sitemap = getAllCitySlugs().map((slug) => ({
    url: `${BASE}/mole-control-${slug}/`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Blog posts — route depends on urlPattern:
  // - 'blog' (default) → /blog/{slug}/
  // - 'legacy-root' → /{slug}/ (preserves old WordPress URL, full indexing equity)
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url:
      post.urlPattern === 'legacy-root'
        ? `${BASE}/${post.slug}/`
        : `${BASE}/blog/${post.slug}/`,
    lastModified: post.date,
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }))

  return [...corePages, ...cityPages, ...blogPages]
}
