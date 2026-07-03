/**
 * Single source of truth for blog post hero images.
 *
 * Used by:
 *   - components/BlogPostContent.tsx (hero render fallback)
 *   - app/(frontend)/blog/page.tsx (hub card render fallback)
 *   - app/(frontend)/blog/[slug]/page.tsx (og:image fallback)
 *   - app/(frontend)/[citySlug]/page.tsx (legacy-root og:image fallback)
 *
 * CMS featuredImage takes priority where set; falls through to this map otherwise.
 * Keep entries in sync with files in public/images/ — see ops-blog-pipeline runbook.
 */
export const BLOG_HERO_IMAGES: Record<string, string> = {
  // /blog/ posts
  'how-to-choose-a-mole-control-company': '/images/blog-choose-company.webp',
  'diy-vs-professional-mole-control': '/images/blog-diy-vs-pro.webp',
  'mole-removal-cost-washington': '/images/blog-cost.webp',
  'mole-control-safe-for-pets': '/images/blog-pet-safety.webp',
  'monthly-vs-one-time-mole-control': '/images/blog-monthly-vs-onetime.webp',
  // 'when-are-moles-most-active-washington' → moved to legacy-root section as 'do-moles-hibernate' (cornerstone-url-recovery 2026-05-02)
  'why-moles-keep-coming-back': '/images/blog-coming-back.webp',
  'are-moles-blind': '/images/blog-are-moles-blind.webp',
  'best-mole-traps': '/images/blog-best-mole-traps.webp',
  'do-mole-repellents-work': '/images/blog-do-mole-repellents-work.webp',
  'are-moles-good-for-your-yard': '/images/blog-are-moles-good-for-yard.webp',
  'how-to-find-active-mole-tunnels': '/images/blog-how-to-find-active-mole-tunnels.webp',
  'humane-mole-removal': '/images/blog-humane-mole-removal.webp',
  'how-long-do-moles-live': '/images/blog-how-long-do-moles-live.webp',
  'does-grub-control-stop-moles': '/images/blog-does-grub-control-stop-moles.webp',
  // 'how-to-get-rid-of-moles' → moved to legacy-root section as 'how-to-get-rid-of-moles-in-your-yard' (cornerstone-url-recovery 2026-05-02)
  // 'mole-vs-vole-vs-gopher' → moved to legacy-root section as 'voles-vs-moles-whats-the-difference' (cornerstone-url-recovery 2026-05-02)
  // 'what-do-moles-eat' → moved to legacy-root section (slug unchanged) (cornerstone-url-recovery 2026-05-02)
  'types-of-moles-in-washington': '/images/blog-types-of-moles-in-washington.webp',
  // legacy-root migrated posts
  'do-moles-hibernate': '/images/blog-seasonal.webp',
  'voles-vs-moles-whats-the-difference': '/images/blog-mole-vs-vole-vs-gopher.webp',
  'how-to-get-rid-of-moles-in-your-yard': '/images/blog-how-to-get-rid-of-moles.webp',
  'what-do-moles-eat': '/images/blog-what-do-moles-eat.webp',
  'how-many-eyes-do-moles-have': '/images/blog-how-many-eyes-do-moles-have.webp',
  'do-moles-bite': '/images/blog-do-moles-bite.webp',
  'do-moles-carry-diseases': '/images/blog-do-moles-carry-diseases.webp',
  'are-moles-nocturnal': '/images/blog-are-moles-nocturnal.webp',
  'how-to-get-rid-of-ground-moles-with-vinegar': '/images/blog-vinegar-myth.webp',
  'what-do-mole-holes-look-like': '/images/blog-what-do-mole-holes-look-like.webp',
  'is-a-mole-a-rodent': '/images/blog-is-a-mole-a-rodent.webp',
  'what-attracts-moles-to-your-yard': '/images/blog-what-attracts-moles-to-your-yard.webp',
  'can-moles-swim': '/images/blog-can-moles-swim.webp',
  'how-deep-do-moles-dig': '/images/blog-how-deep-do-moles-dig.webp',
  'why-do-moles-make-molehills': '/images/blog-why-do-moles-make-molehills.webp',
  'what-eats-moles': '/images/blog-what-eats-moles.webp',
  'how-many-babies-do-moles-have': '/images/blog-how-many-babies-do-moles-have.webp',
  'do-moles-live-in-groups': '/images/blog-do-moles-live-in-groups.webp',
  'are-moles-poisonous-or-venomous': '/images/blog-are-moles-poisonous-or-venomous.webp',
}

export function getBlogHeroImage(slug: string): string | null {
  return BLOG_HERO_IMAGES[slug] || null
}
